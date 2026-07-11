/**
 * Init Operations Catalog — Navigation steps for Thoughtbox initialization.
 *
 * This module was removed upstream during the Code Mode migration but is still
 * referenced by operations-tool/handler.ts (legacy dead code, not imported by
 * the server). These stubs satisfy the build and the operations-tool test suite.
 */

export interface NavigationStep {
  name: string;
  title: string;
  description: string;
  category: string;
  inputSchema?: {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
  };
  example?: unknown;
}

const LIST_SESSIONS: NavigationStep = {
  name: 'list_sessions',
  title: 'List Sessions',
  description: 'List all Thoughtbox reasoning sessions.',
  category: 'navigation',
  inputSchema: {
    type: 'object',
    properties: {
      limit: { type: 'number', description: 'Maximum sessions to return.' },
    },
  },
};

export const INIT_NAVIGATION_STEPS: NavigationStep[] = [LIST_SESSIONS];

export function getNavigationStep(name: string): NavigationStep | undefined {
  return INIT_NAVIGATION_STEPS.find((step) => step.name === name);
}
