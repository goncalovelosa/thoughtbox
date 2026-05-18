/**
 * Filesystem Branch Toolhost
 *
 * MCP toolhost wrapper for filesystem-based branch operations.
 * Mirrors the BranchHandler interface but uses FilesystemBranchHandlers
 * internally. Used when Supabase is not configured but storage is available.
 */

import { FilesystemBranchHandlers, type FilesystemBranchHandlersDeps } from "./filesystem-handler.js";
import { getOperation } from "./operations.js";
import { validateBranchArgs } from "./schemas.js";

export { BRANCH_TOOL } from "./operations.js";
export { getOperationNames, getOperationsCatalog } from "./operations.js";
export type { FilesystemBranchHandlersDeps } from "./filesystem-handler.js";

export class FilesystemBranchHandler {
  private handlers: FilesystemBranchHandlers;
  private initialized = false;

  constructor(deps: FilesystemBranchHandlersDeps) {
    this.handlers = new FilesystemBranchHandlers(deps);
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
  }

  async processTool(
    operation: string,
    args: Record<string, unknown>
  ): Promise<{
    content: Array<
      | { type: "text"; text: string }
      | {
          type: "resource";
          resource: {
            uri: string;
            text: string;
            mimeType: string;
            title?: string;
            annotations?: Record<string, unknown>;
          };
        }
    >;
    isError: boolean;
  }> {
    const validation = validateBranchArgs(operation, args);
    if (!validation.ok) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { success: false, error: validation.error },
              null,
              2,
            ),
          },
        ],
        isError: true,
      };
    }
    const validated = validation.data;

    try {
      let result: unknown;
      const opDef = getOperation(`branch_${operation}`);

      switch (operation) {
        case "spawn":
          result = await this.handlers.handleSpawn(
            validated as Parameters<FilesystemBranchHandlers["handleSpawn"]>[0]
          );
          break;
        case "merge":
          result = await this.handlers.handleMerge(
            validated as Parameters<FilesystemBranchHandlers["handleMerge"]>[0]
          );
          break;
        case "list":
          result = await this.handlers.handleList(
            validated as Parameters<FilesystemBranchHandlers["handleList"]>[0]
          );
          break;
        case "get":
          result = await this.handlers.handleGet(
            validated as Parameters<FilesystemBranchHandlers["handleGet"]>[0]
          );
          break;
        default:
          throw new Error(`Unknown branch operation: ${operation}`);
      }

      const content: Array<
        | { type: "text"; text: string }
        | {
            type: "resource";
            resource: {
              uri: string;
              text: string;
              mimeType: string;
              title?: string;
              annotations?: Record<string, unknown>;
            };
          }
      > = [{ type: "text", text: JSON.stringify(result, null, 2) }];

      if (opDef) {
        content.push({
          type: "resource",
          resource: {
            uri: `thoughtbox://branch/operations/${operation}`,
            title: opDef.title,
            mimeType: "application/json",
            text: JSON.stringify(opDef, null, 2),
            annotations: { audience: ["assistant"], priority: 0.5 },
          },
        });
      }

      return { content, isError: false };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: false,
                error:
                  error instanceof Error ? error.message : String(error),
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  }
}
