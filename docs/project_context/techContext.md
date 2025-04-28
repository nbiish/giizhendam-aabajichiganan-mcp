# Technology Context

**Core Technologies:**
*   **Language:** TypeScript (compiled to JavaScript)
*   **Runtime:** Node.js
*   **Package Manager:** npm

**Key Libraries & Frameworks:**
*   **MCP SDK:** `@modelcontextprotocol/sdk` (for server creation, tool registration, transport)
*   **Schema Validation:** `zod` (for defining and validating tool parameters)
*   **Google AI:** `@google/generative-ai` (for interacting with the Gemini API)

**External Dependencies / Integrations:**
*   **`aider-chat` (CLI Tool):** Required for `prompt_aider` and `double_compute` tools. Must be installed and available in the system PATH where the MCP server runs.
*   **Google Gemini API:** Required for `finance_experts` and `ceo_and_board`. Requires a valid `GEMINI_API_KEY`.
*   **(Implied) OpenRouter:** The presence of `OPENROUTER_API_KEY` suggests potential integration or use with OpenRouter, possibly for routing `aider` models. Requires a valid `OPENROUTER_API_KEY`.

**Development Environment:**
*   **Build Tool:** `tsc` (TypeScript Compiler)
*   **Configuration:** MCP Server behavior is configured via `~/.cursor/mcp.json`, specifically environment variables (`env`) passed to the `npx` command.
*   **Execution:** Typically run via `npx -y @nbiish/giizhendam-aabajichiganan-mcp` as defined in `mcp.json`.

**Tool Usage Patterns:**
*   Uses `child_process.spawn` for running `aider`.
*   Uses `async/await` for handling promises from API calls and process execution.
*   Logging to `/tmp/giizhendam_mcp_v2_log.txt` for debugging.

**Testing:**
*   Currently relies on manual testing by invoking tools via an MCP client (e.g., Cursor).

**Build/Publish:**
*   Uses `npm run build` (defined in `package.json`, runs `tsc`).
*   Uses `npm version patch` and `npm publish` for versioning and publishing.
*   Subject to `dual-publish` custom rule (publishes as two package names). 