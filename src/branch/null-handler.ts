/**
 * NullBranchHandler
 *
 * Graceful fallback when Supabase is not configured.
 * Returns informative errors for all branch operations instead of crashing.
 * Follows the same pattern as InMemoryProtocolHandler for ProtocolHandler.
 */

import type { BranchHandlerDeps } from "./handlers.js";

export class NullBranchHandler {
  private reason: string;

  constructor(reason?: string) {
    this.reason = reason ?? "Supabase is not configured. Branch operations require SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.";
  }

  async processTool(
    _operation: string,
    _args: Record<string, unknown>,
  ): Promise<{
    content: Array<{ type: "text"; text: string }>;
    isError: boolean;
  }> {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            { success: false, error: this.reason },
            null,
            2,
          ),
        },
      ],
      isError: true,
    };
  }
}

// Re-export BranchHandler for consumers
export { BranchHandler } from "./index.js";
export type { BranchHandlerDeps } from "./handlers.js";
