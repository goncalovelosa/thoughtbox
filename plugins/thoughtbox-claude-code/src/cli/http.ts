import { normalizeBaseUrl } from './config.js';

type FetchLike = typeof fetch;
type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

async function parseJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { raw: text };
  }
}

export interface CliValidateResponse {
  ok: boolean;
  workspaceId: string;
  setupStatus: string;
}

export async function validateApiKey(args: {
  fetchImpl: FetchLike;
  baseUrl: string;
  apiKey: string;
}): Promise<CliValidateResponse> {
  const response = await args.fetchImpl(
    `${normalizeBaseUrl(args.baseUrl)}/cli/validate`,
    {
      headers: {
        Authorization: `Bearer ${args.apiKey}`,
      },
      signal: AbortSignal.timeout(10_000),
    },
  );

  const payload = await parseJsonResponse(response);
  if (!response.ok) {
    const message = (payload as { error?: string }).error ?? response.statusText;
    throw new Error(message);
  }

  return payload as CliValidateResponse;
}

export async function writeWorkspaceSetupStatus(args: {
  fetchImpl: FetchLike;
  baseUrl: string;
  apiKey: string;
  status: string;
  evidence?: JsonValue;
  lastError?: string | null;
}): Promise<void> {
  const response = await args.fetchImpl(
    `${normalizeBaseUrl(args.baseUrl)}/cli/setup-status`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${args.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: args.status,
        evidence: args.evidence ?? {},
        lastError: args.lastError ?? null,
      }),
      signal: AbortSignal.timeout(10_000),
    },
  );

  if (!response.ok) {
    const payload = await parseJsonResponse(response);
    const message = (payload as { error?: string }).error ?? response.statusText;
    throw new Error(message);
  }
}
