# Code Mode Reference Repos

Code Mode exposes an MCP server's capabilities as a simple TypeScript API — a single `code` tool that agents call by writing code instead of juggling dozens of parameters. For Thoughtbox, this means agents interact with the currently param-heavy MCP server through straightforward TypeScript rather than constructing complex tool calls.

## Contents

| Directory | Description |
|-----------|-------------|
| [agents/examples/codemode-mcp-openapi/](agents/examples/codemode-mcp-openapi/) | OpenAPI-to-Codemode example. We don't use OpenAPI, but OpenAPI is widely-enough represented in training data that it's a useful model for the pattern. |
| [agents/examples/codemode-mcp/](agents/examples/codemode-mcp/) | Example of how to wrap any MCP server with `codeMcpServer` to expose a single `code` tool to the agent. |
| [codemode-mcp-cloudflare/](codemode-mcp-cloudflare/) | A full Code Mode MCP server in TypeScript from Cloudflare. |
| [dodopayments-typescript/packages/mcp-server/](dodopayments-typescript/packages/mcp-server/) | Another full Code Mode TypeScript MCP server, from Dodo Payments. |
