# Project Progress

**Current Version:** 0.3.24 (as of [Get Current Date])

**Completed Features/Components:**
*   Initial implementation of MCP server (`src/index.ts`).
*   Tool: `prompt_aider` (v1 implementation).
*   Tool: `double_compute` (v1 implementation).
*   Tool: `finance_experts` (using Gemini API, saves to output dir).
*   Tool: `ceo_and_board` (using Gemini API, saves to output dir).
*   Basic Zod validation for tool parameters.
*   Configuration via environment variables (`mcp.json`).
*   Basic logging to `/tmp/giizhendam_mcp_v2_log.txt`.
*   Build process using `tsc`.
*   Publishing setup via `npm` (`dual-publish.sh`).

**Work In Progress:**
*   Debugging `aider`-based tools (`prompt_aider`, `double_compute`) file system interaction failure when invoked via MCP server.

**Known Issues/Bugs:**
*   **Resolved (v0.3.22):** `aider` tools failed due to incompatible `--edit-model` flag being passed when `AIDER_EDITOR_MODEL` env var was set.
*   **BLOCKER (v0.3.24):** `aider` tools fail file system operations (creation/modification) when invoked via the MCP server process (`spawn`), even when the command runs successfully manually and returns exit code 0.
    *   Attempted fix 1 (v0.3.22): Setting explicit `cwd` in `spawn` call - **Failed.**
    *   Attempted fix 2 (v0.3.24): Passing absolute file paths to `aider` - **Failed.**
    *   Permissions check confirmed server process owner has write access to target dir. **Permissions OK.**
    *   Next Steps: Investigate `aider` internals/debug flags, environment differences, or try simplified spawn test.

**Evolution of Major Decisions:**
*   Initial approach might have involved a shell script wrapper; moved to direct `spawn` of `aider` for better control and error handling.
*   Shifted from hardcoded defaults to reliance on environment variables for models and API keys.
*   Refined error handling to use `safeErrorReport` for client responses.
*   Attempted explicit CWD setting during `spawn`.
*   Attempted passing absolute paths to `aider`.

**Overall Status:**
*   Core functionality for all four tools is implemented.
*   Simulation tools (`finance_experts`, `ceo_and_board`) appear functional.
*   `aider`-based tools (`prompt_aider`, `double_compute`) are **blocked** by a persistent file system interaction issue when run via the MCP server. Investigation ongoing, focusing now on aider internals or environment. 