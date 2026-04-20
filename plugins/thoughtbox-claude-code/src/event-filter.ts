/**
 * Filters events for the current Thoughtbox session.
 * Events not tied to this session are dropped.
 */

import type { ThoughtboxEvent } from "./event-types.js";

export interface EventFilterConfig {
  sessionId?: string;
}

export class EventFilter {
  private config: EventFilterConfig;

  constructor(config: EventFilterConfig) {
    this.config = config;
  }

  shouldForward(event: ThoughtboxEvent): boolean {
    if (!this.config.sessionId) return true;
    return event.sessionId === this.config.sessionId;
  }

  setSessionId(sessionId: string): void {
    this.config.sessionId = sessionId;
  }
}
