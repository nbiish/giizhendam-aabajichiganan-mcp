# Project Brief: giizhendam-aabajichiganan-mcp

**Goal:** To create a set of Model Context Protocol (MCP) server tools that provide AI-assisted capabilities for decision-making, code generation, and simulation tasks within an IDE environment.

**Scope:**
*   Implement MCP tools wrapping functionalities like:
    *   Direct interaction with the `aider` CLI tool (`prompt_aider`, `double_compute`).
    *   Simulation of expert discussions using the Gemini API (`finance_experts`, `ceo_and_board`).
*   Package these tools as an npm package (`@nbiish/giizhendam-aabajichiganan-mcp`) for use via `npx` within the MCP framework.
*   Ensure tools are configurable via environment variables passed through the MCP server configuration (`mcp.json`).

**Key Constraints:**
*   Must adhere to the Model Context Protocol specification.
*   Primary implementation language: TypeScript/Node.js.
*   Requires external dependencies: `aider` CLI, Google Gemini API access.
*   Configuration relies on environment variables set in `~/.cursor/mcp.json`.
*   Dual-publishes as `@nbiish/ai-tool-mcp` (see `dual-publish` rule). 