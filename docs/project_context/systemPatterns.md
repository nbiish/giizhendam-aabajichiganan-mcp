# System Patterns & Architecture

**High-Level Design:**
*   A Node.js-based MCP server implemented using the `@modelcontextprotocol/sdk`.
*   Registers multiple tools (`prompt_aider`, `double_compute`, `finance_experts`, `ceo_and_board`).
*   Tools act as wrappers/interfaces to external processes or APIs.

**Key Technical Patterns:**
*   **MCP Tool Registration:** Uses `server.tool()` from the SDK to define tool names, descriptions, input schemas (Zod), and asynchronous execution logic.
*   **External Process Invocation (`aider` tools):**
    *   Uses Node.js `child_process.spawn` to execute the `aider` CLI tool.
    *   Constructs command-line arguments based on tool parameters and configured environment variables (`AIDER_MODEL`).
    *   Captures `stdout` and `stderr` from the child process.
    *   Passes the parent process environment (`process.env`) to the child.
    *   Explicitly sets the child process `cwd` to `process.cwd()`.
*   **External API Integration (Simulation tools):**
    *   Uses `@google/generative-ai` SDK to interact with the Gemini API.
    *   Requires `GEMINI_API_KEY` from environment variables.
    *   Constructs specific prompts based on tool parameters and internal templates (e.g., expert personas).
*   **Configuration Management:** Relies heavily on environment variables (`AIDER_MODEL`, `GEMINI_API_KEY`, `OPENROUTER_API_KEY`, output directories) set via the MCP server configuration (`~/.cursor/mcp.json`). Performs validation checks for required variables at tool runtime.
*   **Input Validation:** Uses `zod` schemas to define and validate the parameters for each tool.
*   **Output Formatting:** Structures tool output (`content` and `_meta`) according to MCP conventions, providing status, results, captured output/errors, and metadata.
*   **Error Handling:** Includes `try...catch` blocks for process spawning and API calls. Uses a `safeErrorReport` function to sanitize error messages returned to the client while logging full details server-side.
*   **File System Interaction:** Tools like `finance_experts` and `ceo_and_board` write simulation results to configured output directories (`FINANCE_EXPERTS_OUTPUT_DIR`, `CEO_BOARD_OUTPUT_DIR`). Includes directory creation (`mkdir -p`) logic.

**Anti-Patterns to Avoid:**
*   Hardcoding API keys or sensitive configuration.
*   Not validating external process exit codes.
*   Leaking detailed internal error messages or stack traces to the client.
*   Insecure file system access (ensure paths are validated and restricted).
*   Blocking the main server thread with long-running operations (uses `async/await`). 