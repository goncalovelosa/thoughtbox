/**
 * Filesystem Branch Handlers
 *
 * Business logic for branch spawn, merge, list, and get operations.
 * Uses ThoughtboxStorage interface instead of Supabase client.
 * Branch metadata is persisted as JSON files alongside session data.
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";

import type { ThoughtboxStorage, ThoughtData, Session } from "../persistence/types.js";

// ---------------------------------------------------------------------------
// Branch metadata types
// ---------------------------------------------------------------------------

export interface BranchMeta {
  branchId: string;
  description: string | null;
  branchFromThought: number;
  status: "active" | "merged" | "rejected" | "abandoned" | "completed";
  spawnedAt: string; // ISO 8601
  completedAt: string | null;
  mergeThoughtNumber: number | null;
}

// ---------------------------------------------------------------------------
// Filesystem path helpers
// ---------------------------------------------------------------------------

/**
 * Resolve the session directory path using the same convention as FileSystemStorage:
 *   {dataDir}/projects/{project}/sessions/{partitionPath?}/{sessionId}/
 */
function resolveSessionDir(
  dataDir: string,
  project: string,
  session: Session,
): string {
  const sessionsDir = path.join(dataDir, "projects", project, "sessions");
  if (session.partitionPath) {
    return path.join(sessionsDir, session.partitionPath, session.id);
  }
  return path.join(sessionsDir, session.id);
}

/** Path to the per-session branch metadata file. */
function branchMetaPath(sessionDir: string): string {
  return path.join(sessionDir, "_branches.json");
}

/** Atomic JSON write (write to tmp, then rename). */
async function atomicWriteJson(filePath: string, data: unknown): Promise<void> {
  const tmpPath = `${filePath}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), "utf-8");
  await fs.rename(tmpPath, filePath);
}

// ---------------------------------------------------------------------------
// Handler class
// ---------------------------------------------------------------------------

export interface FilesystemBranchHandlersDeps {
  storage: ThoughtboxStorage;
  dataDir: string;
  workspaceId: string;
}

export class FilesystemBranchHandlers {
  private storage: ThoughtboxStorage;
  private dataDir: string;
  private workspaceId: string;

  constructor(deps: FilesystemBranchHandlersDeps) {
    this.storage = deps.storage;
    this.dataDir = deps.dataDir;
    this.workspaceId = deps.workspaceId;
  }

  // =========================================================================
  // Session directory resolution
  // =========================================================================

  private async requireSessionDir(sessionId: string): Promise<{ session: Session; sessionDir: string }> {
    const session = await this.storage.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    const project = this.storage.getProject();
    const sessionDir = resolveSessionDir(this.dataDir, project, session);
    return { session, sessionDir };
  }

  // =========================================================================
  // Branch metadata persistence
  // =========================================================================

  private async loadBranchMeta(sessionDir: string): Promise<Map<string, BranchMeta>> {
    const filePath = branchMetaPath(sessionDir);
    try {
      const raw = await fs.readFile(filePath, "utf-8");
      const arr = JSON.parse(raw) as BranchMeta[];
      const map = new Map<string, BranchMeta>();
      for (const entry of arr) {
        map.set(entry.branchId, entry);
      }
      return map;
    } catch {
      return new Map();
    }
  }

  private async saveBranchMeta(sessionDir: string, meta: Map<string, BranchMeta>): Promise<void> {
    const filePath = branchMetaPath(sessionDir);
    const arr = Array.from(meta.values());
    await atomicWriteJson(filePath, arr);
  }

  /**
   * Register a branch in the session manifest's branchFiles map
   * so that branchCount stays accurate on reads.
   */
  private async registerBranchInManifest(sessionDir: string, branchId: string): Promise<void> {
    const manifestPath = path.join(sessionDir, "manifest.json");
    try {
      const raw = await fs.readFile(manifestPath, "utf-8");
      const manifest = JSON.parse(raw) as {
        branchFiles: Record<string, string[]>;
        [key: string]: unknown;
      };
      if (!manifest.branchFiles) {
        manifest.branchFiles = {};
      }
      if (!manifest.branchFiles[branchId]) {
        manifest.branchFiles[branchId] = [];
      }
      await atomicWriteJson(manifestPath, manifest);
    } catch {
      // Manifest may not exist for some edge cases — non-critical
    }
  }

  // =========================================================================
  // Spawn
  // =========================================================================

  async handleSpawn(args: {
    sessionId: string;
    branchId: string;
    description?: string;
    branchFromThought: number;
  }): Promise<{
    branchId: string;
    workerUrl: string;
    status: string;
    sessionId: string;
  }> {
    const { sessionId, branchId, description, branchFromThought } = args;

    // Validate session exists
    const { sessionDir } = await this.requireSessionDir(sessionId);

    // Validate the main-track thought exists
    const thought = await this.storage.getThought(sessionId, branchFromThought);
    if (!thought) {
      throw new Error(
        `Main-track thought ${branchFromThought} not found in session ${sessionId}`
      );
    }

    // Check for duplicate branch ID
    const existingMeta = await this.loadBranchMeta(sessionDir);
    if (existingMeta.has(branchId)) {
      throw new Error(
        `Branch ${branchId} already exists in session ${sessionId}`
      );
    }

    // Create branch metadata entry
    const branchMeta: BranchMeta = {
      branchId,
      description: description ?? null,
      branchFromThought,
      status: "active",
      spawnedAt: new Date().toISOString(),
      completedAt: null,
      mergeThoughtNumber: null,
    };

    existingMeta.set(branchId, branchMeta);
    await this.saveBranchMeta(sessionDir, existingMeta);

    // Ensure the branch directory exists (for branch thoughts later)
    const branchDir = path.join(sessionDir, "branches", branchId);
    await fs.mkdir(branchDir, { recursive: true });

    // Update manifest.branchFiles so branchCount stays accurate
    await this.registerBranchInManifest(sessionDir, branchId);

    return { branchId, workerUrl: "", status: "active", sessionId };
  }

  // =========================================================================
  // Merge
  // =========================================================================

  async handleMerge(args: {
    sessionId: string;
    synthesis: string;
    selectedBranchId?: string;
    resolution: "selected" | "synthesized" | "abandoned";
  }): Promise<{
    mergeThoughtNumber: number;
    updatedBranches: Array<{ branchId: string; status: string }>;
  }> {
    const { sessionId, synthesis, selectedBranchId, resolution } = args;

    const { sessionDir } = await this.requireSessionDir(sessionId);

    // Load all branch metadata
    const meta = await this.loadBranchMeta(sessionDir);

    // Filter to resolvable branches (active or completed)
    const resolvable = Array.from(meta.values()).filter(
      (b) => b.status === "active" || b.status === "completed"
    );

    if (resolvable.length === 0) {
      throw new Error(`No resolvable branches for session ${sessionId}`);
    }

    // Determine the next main-chain thought number
    const mainThoughts = await this.storage.getThoughts(sessionId);
    const maxNumber = mainThoughts.reduce(
      (max, t) => Math.max(max, t.thoughtNumber),
      0
    );
    const mergeThoughtNumber = maxNumber + 1;

    // Save synthesis thought to main chain
    const synthesisThought: ThoughtData = {
      thought: synthesis,
      thoughtNumber: mergeThoughtNumber,
      totalThoughts: mergeThoughtNumber,
      nextThoughtNeeded: false,
      thoughtType: "reasoning",
      timestamp: new Date().toISOString(),
    };
    await this.storage.saveThought(sessionId, synthesisThought);

    // Touch session updatedAt to hint at in-memory refresh
    try {
      await this.storage.updateSession(sessionId, {
        updatedAt: new Date(),
      });
    } catch {
      // Non-critical: disk state is already correct
    }

    // Update branch statuses
    const updatedBranches: Array<{ branchId: string; status: string }> = [];
    const now = new Date().toISOString();

    for (const b of resolvable) {
      let newStatus: BranchMeta["status"];

      if (resolution === "abandoned") {
        newStatus = "abandoned";
      } else if (resolution === "selected") {
        newStatus = b.branchId === selectedBranchId ? "merged" : "rejected";
      } else {
        // synthesized — all branches are merged
        newStatus = "merged";
      }

      const updated: BranchMeta = {
        ...b,
        status: newStatus,
        completedAt: now,
        mergeThoughtNumber: newStatus === "merged" ? mergeThoughtNumber : null,
      };
      meta.set(b.branchId, updated);
      updatedBranches.push({ branchId: b.branchId, status: newStatus });
    }

    await this.saveBranchMeta(sessionDir, meta);

    return { mergeThoughtNumber, updatedBranches };
  }

  // =========================================================================
  // List
  // =========================================================================

  async handleList(args: { sessionId: string }): Promise<{
    branches: Array<{
      branchId: string;
      description: string | null;
      status: string;
      thoughtCount: number;
      branchFromThought: number;
      spawnedAt: string;
      completedAt: string | null;
    }>;
  }> {
    const { sessionId } = args;

    const { sessionDir } = await this.requireSessionDir(sessionId);

    const meta = await this.loadBranchMeta(sessionDir);
    const branchEntries = Array.from(meta.values()).sort(
      (a, b) => new Date(a.spawnedAt).getTime() - new Date(b.spawnedAt).getTime()
    );

    // Get thought counts for each branch
    const branches = await Promise.all(
      branchEntries.map(async (entry) => {
        const thoughts = await this.storage.getBranch(sessionId, entry.branchId);
        return {
          branchId: entry.branchId,
          description: entry.description,
          status: entry.status,
          thoughtCount: thoughts.length,
          branchFromThought: entry.branchFromThought,
          spawnedAt: entry.spawnedAt,
          completedAt: entry.completedAt,
        };
      })
    );

    return { branches };
  }

  // =========================================================================
  // Get
  // =========================================================================

  async handleGet(args: {
    sessionId: string;
    branchId: string;
  }): Promise<{
    branch: Record<string, unknown>;
    thoughts: Array<Record<string, unknown>>;
  }> {
    const { sessionId, branchId } = args;

    const { sessionDir } = await this.requireSessionDir(sessionId);

    const meta = await this.loadBranchMeta(sessionDir);
    const branchMeta = meta.get(branchId);
    if (!branchMeta) {
      throw new Error(
        `Branch ${branchId} not found in session ${sessionId}`
      );
    }

    const thoughts = await this.storage.getBranch(sessionId, branchId);

    return {
      branch: { ...branchMeta } as Record<string, unknown>,
      thoughts: thoughts.map((t) => ({ ...t }) as unknown as Record<string, unknown>),
    };
  }
}
