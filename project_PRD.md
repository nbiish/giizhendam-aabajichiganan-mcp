# LLM-Optimized Agile MVP PRD: Giizhendam Aabajichiganan MCP Server

## Purpose
*   Provide a lean, standardized PRD to guide the development and iteration of the Giizhendam Aabajichiganan MCP server, which interfaces with external AI tools (`aider`, Gemini API) for specialized tasks.

## Vision & Goals
*   **Vision:** To provide a robust and flexible MCP server that acts as an intelligent agent interface, leveraging powerful external tools like `aider` and foundation models (like Gemini) to offer specialized AI assistance directly within the development environment.
*   **Primary Goal:** Offer developers a suite of MCP tools that enable targeted AI-driven tasks, including financial analysis simulations, board meeting simulations, and general-purpose code/text generation via `aider`, with configurable underlying AI models.

## Core MVP Definition (Current State)
*   **Definition:** The current feature set allows users to invoke specific AI tasks through MCP tools, leveraging `aider` and the Gemini API, with model configurations driven by environment variables.
*   **Scope:**
    *   **Must have (Implemented):**
        *   **`prompt_aider` tool:** Executes a general prompt using the `aider` command, configured via `AIDER_MODEL` and optional `AIDER_EDITOR_MODEL` env vars. Captures `stdout`/`stderr`.
        *   **`double_compute` tool:** Executes `prompt_aider` twice for redundant computation or comparison.
        *   **`finance_experts` tool:** Simulates perspectives from multiple hardcoded financial expert personas (Graham, Ackman, Wood, Munger, Burry, Lynch, Fisher) on a user-provided financial topic/query using the Gemini API. Saves output to `./financial-experts/`. Requires `GEMINI_API_KEY`.
        *   **`ceo_and_board` tool:** Simulates a board discussion based on a user-provided topic and roles using the **Gemini API**. Saves output to `./ceo-and-board/`. Requires `GEMINI_API_KEY`.
        *   **Model Configuration:** Reads `AIDER_MODEL` and optional `AIDER_EDITOR_MODEL` from `process.env` (set via `mcp.json`) to control `aider` execution style (for `prompt_aider`, `double_compute` only).
        *   **Gemini API Integration:** `finance_experts` and `ceo_and_board` use the Gemini API directly (requires `GEMINI_API_KEY` env var).
        *   **Output Handling:** Tools return execution status, summaries, and include detailed logs (`stdout`/`stderr` from `aider`, API errors from Gemini tools) in the `_meta` field. Output snippets are included in the main response.
        *   **File Saving:** Simulation tools (`finance_experts`, `ceo_and_board`) save results to dedicated directories.
    *   **Out of scope (Current):**
        *   Direct image generation or processing.
        *   Execution of arbitrary shell scripts (replaced by direct `aider` calls).
        *   Complex multi-step workflows beyond `double_compute`.
        *   Reading expert prompts from external files (now embedded).

## Guiding Principles
*   Leverage powerful external tools (`aider`, Gemini API).
*   Provide specialized, task-oriented MCP interfaces.
*   Enable flexible AI model configuration via environment variables.
*   Ensure detailed execution logs (`stdout`/`stderr`) are captured and returned.
*   Prioritize direct execution over intermediate scripts where feasible.

## Success Metrics
*   **Quantitative:**
    *   High rate of successful tool executions (exit code 0 for `aider` tools, API success for Gemini tools).
    *   Successful saving of output files for simulation tools.
    *   Low rate of configuration errors (e.g., missing API keys/models).
*   **Qualitative:**
    *   User feedback indicates the expert/simulation outputs are relevant and useful.
    *   The provided `stdout`/`stderr` snippets and full logs in `_meta` are sufficient for debugging and understanding tool execution.
    *   Ease of configuration via `mcp.json`.

## Feedback & Iteration
*   Collect feedback primarily through user interactions within the Cursor environment.
*   Monitor tool usage patterns and error rates.
*   Prioritize future iterations based on user feedback, focusing on improving tool utility, reliability, and potentially expanding the range of specialized tasks.

## Terminology
*   **MCP:** Model Context Protocol.
*   **Aider:** AI pair programming tool used for code/text generation tasks.
*   **Gemini API:** Google's API for accessing Gemini foundation models.
*   **MVP:** Minimum Viable Product.

## Tool Usage & Prompting Guide
*   **General:** Ensure required environment variables (`AIDER_MODEL`, `GEMINI_API_KEY`, potentially `AIDER_EDITOR_MODEL`) are set correctly in the `mcp.json` configuration for this server.
*   **`prompt_aider` / `double_compute`:** Use the `prompt_text` parameter for the core instruction to `aider`. Use the `files` parameter (array of strings) to specify files `aider` should be aware of or modify.
*   **`finance_experts`:** Use the `topic` parameter to pose a specific financial question or describe a situation for the experts to analyze from their unique perspectives (e.g., "Analyze the financial risks and potential ROI for launching a new subscription service based on our current user base."). Requires `GEMINI_API_KEY`.
*   **`ceo_and_board`:** Use the `topic` parameter for the central discussion point (e.g., "Q3 Marketing Strategy Review"). Use the `roles` parameter (array of strings) to list the participant roles (e.g., `["CEO", "CFO", "Head of Marketing", "Lead Investor"]`). Requires `GEMINI_API_KEY`.
*   **Output:** Check the main `content` for summaries and output snippets. Always check the `_meta` field in the tool response for full `stdout`, `stderr`, `executedCommand` (for `aider` tools), or `apiError` details (for Gemini tools).

## Codebase Structure (Current)
*   **`src/index.ts`:** Contains the main MCP server logic, tool definitions (interfacing with `aider` or Gemini API), and helper functions (`executeAider`, though now only used by `prompt_aider`/`double_compute`).
*   **`package.json` / `package-lock.json`:** Manage Node.js dependencies (@modelcontextprotocol/sdk, @google/generative-ai, etc.).
*   **`tsconfig.json`:** TypeScript configuration.
*   **`dist/`:** Compiled JavaScript output.
*   **`financial-experts/` / `ceo-and-board/`:** Output directories created dynamically to store simulation results.
*   **Configuration:** Primarily driven by environment variables passed via the `mcp.json` server definition.
