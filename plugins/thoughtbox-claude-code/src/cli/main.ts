import process from 'node:process';
import {
  DEFAULT_BASE_URL,
  extractApiKeyFromLocalConfig,
  findOtelEndpoint,
  findThoughtboxMcpUrl,
  hasRequiredOtelConfig,
  loadLocalThoughtboxConfig,
  mergeThoughtboxInitConfig,
  saveLocalThoughtboxConfig,
  warnIfClaudeDirNotGitignored,
} from './config.js';
import {
  validateApiKey,
} from './http.js';

type FetchLike = typeof fetch;

export interface CliRuntime {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  fetchImpl?: FetchLike;
  stdinText?: string;
  writeStdout?: (line: string) => void;
  writeStderr?: (line: string) => void;
}

function createDefaultWriter(
  stream: NodeJS.WriteStream,
): (line: string) => void {
  return (line: string) => {
    stream.write(`${line}\n`);
  };
}

function flagValue(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index === -1) return undefined;
  return args[index + 1];
}

function printHelp(writeStdout: (line: string) => void): void {
  writeStdout('thoughtbox init --key <api_key>');
  writeStdout('thoughtbox doctor [--key <api_key>]');
}

async function handleInit(
  args: string[],
  runtime: Required<Pick<CliRuntime, 'cwd' | 'env' | 'fetchImpl' | 'writeStdout' | 'writeStderr'>>,
): Promise<number> {
  const apiKey = flagValue(args, '--key');
  if (!apiKey) {
    runtime.writeStderr('error: thoughtbox init requires --key <api_key>');
    return 1;
  }

  const baseUrl = DEFAULT_BASE_URL;

  let validation;
  try {
    validation = await validateApiKey({
      fetchImpl: runtime.fetchImpl,
      baseUrl,
      apiKey,
    });
  } catch (error) {
    runtime.writeStderr(
      `auth_failed: ${error instanceof Error ? error.message : 'validation failed'}`,
    );
    return 1;
  }

  const config = await loadLocalThoughtboxConfig(runtime.cwd);
  const merged = mergeThoughtboxInitConfig({
    settingsLocal: config.settingsLocal,
    baseUrl,
    apiKey,
  });
  config.settingsLocal = merged.settingsLocal;
  await saveLocalThoughtboxConfig(config);

  const gitignoreWarning = await warnIfClaudeDirNotGitignored(runtime.cwd);

  runtime.writeStdout(`configured workspace ${validation.workspaceId}`);
  runtime.writeStdout(`mcp: ${baseUrl}/mcp?key=...`);
  runtime.writeStdout(`otel: ${baseUrl}/v1/logs`);
  if (gitignoreWarning) {
    runtime.writeStderr(gitignoreWarning);
  }
  runtime.writeStdout('next: thoughtbox doctor');

  return 0;
}

async function handleDoctor(
  args: string[],
  runtime: Required<Pick<CliRuntime, 'cwd' | 'env' | 'fetchImpl' | 'writeStdout' | 'writeStderr'>>,
): Promise<number> {
  const config = await loadLocalThoughtboxConfig(runtime.cwd);
  const configuredKey =
    flagValue(args, '--key') ?? extractApiKeyFromLocalConfig(config.settingsLocal);
  const configuredBaseUrl = findOtelEndpoint(config.settingsLocal)
    ?? (() => {
      const mcpUrl = findThoughtboxMcpUrl(config.settingsLocal);
      if (!mcpUrl) return DEFAULT_BASE_URL;
      try {
        return new URL(mcpUrl).origin;
      } catch {
        return DEFAULT_BASE_URL;
      }
    })();

  const mcpUrl = findThoughtboxMcpUrl(config.settingsLocal);
  if (!mcpUrl) {
    runtime.writeStderr('mcp_missing: Thoughtbox MCP server configuration is missing');
    return 1;
  }

  if (!hasRequiredOtelConfig(config.settingsLocal)) {
    runtime.writeStderr('otel_missing: required OTEL exporter configuration is missing');
    return 1;
  }

  if (!configuredKey) {
    runtime.writeStderr('auth_failed: no API key is configured locally');
    return 1;
  }

  try {
    await validateApiKey({
      fetchImpl: runtime.fetchImpl,
      baseUrl: configuredBaseUrl,
      apiKey: configuredKey,
    });
  } catch (error) {
    runtime.writeStderr(
      `auth_failed: ${error instanceof Error ? error.message : 'validation failed'}`,
    );
    return 1;
  }

  runtime.writeStdout('doctor: ready');
  runtime.writeStdout('workspace_status: ready');

  return 0;
}

export async function runCli(
  argv: string[],
  runtime: CliRuntime = {},
): Promise<number | null> {
  const command = argv[0];
  const writeStdout =
    runtime.writeStdout ?? createDefaultWriter(process.stdout);
  const writeStderr =
    runtime.writeStderr ?? createDefaultWriter(process.stderr);

  if (!command) return null;
  if (command === '--help' || command === '-h' || command === 'help') {
    printHelp(writeStdout);
    return 0;
  }

  const shared = {
    cwd: runtime.cwd ?? process.cwd(),
    env: runtime.env ?? process.env,
    fetchImpl: runtime.fetchImpl ?? fetch,
    writeStdout,
    writeStderr,
  };

  switch (command) {
    case 'init':
      return handleInit(argv.slice(1), shared);
    case 'doctor':
      return handleDoctor(argv.slice(1), shared);
    default:
      return null;
  }
}
