# Giizhendam Aabajichiganan MCP Server - Project Tracker

## Goal
Implement and verify the functionality of all tools provided by the `giizhendam-aabajichiganan-mcp` server.

## Current Status & Plan (as of latest update)

| Tool                          | Status                     | Notes / Next Steps                                                                                    |
| :---------------------------- | :------------------------- | :---------------------------------------------------------------------------------------------------- |
| `run_aider_directly`          | Implemented (v1 - TS Fixed) | Executes aider via `spawn`. Uses default models from env/constants. Needs verification testing.        |
| `run_aider_task`              | Removed                    | Replaced by `run_aider_directly` which executes within the server process.                           |
| `prompt`                      | Implemented (v1)         | Uses OpenRouter API via `fetch` with default model from env. Needs testing.                     |
| `prompt_from_file`            | Implemented (v1)         | Reads file, uses OpenRouter via `fetch` with default model from env. Needs testing.            |
| `prompt_from_file_to_file`  | Placeholder              | **TODO:** Implement file writing logic for results. Uses default model.                           |
| `ceo_and_board`               | Placeholder              | **TODO:** Implement multi-model logic (placeholder). Uses default model.                            |
| `finance_experts`             | Implemented (v1)         | Reads persona prompts, constructs combined prompts. Needs verification testing. (LLM calls TODO) |

## Key Dependencies / Configuration

*   **Aider CLI:** Must be installed and available in the system PATH where the server runs.
*   **OpenRouter API Key:** Required via `OPENROUTER_API_KEY` environment variable.
*   **Default Models:** `DEFAULT_ARCHITECT_MODEL`, `DEFAULT_EDITOR_MODEL` environment variables or internal constants used.
*   **Node.js Features:** Relies on built-in `fetch`, `fs/promises`, `child_process`.
*   **MCP SDK:** `@modelcontextprotocol/sdk`

## Next Steps

1.  **Build:** Run `npm run build` (or equivalent) to compile TypeScript.
2.  **(Optional) Publish:** If desired, publish the new version to npm.
3.  **Restart Server:** Ensure the MCP client reloads the server configuration/gets the new version.
4.  **Test Implemented Tools:**
    *   Test `run_aider_directly` (e.g., create a test file). **Verify functionality.**
    *   Test `prompt` with text input.
    *   Test `prompt_from_file` with a test file.
    *   Test `finance_experts` with a sample query.
5.  **Implement Remaining Tools:** Address the TODO items for the placeholder tools (`prompt_from_file_to_file`, `ceo_and_board`).
6.  **Enhance `finance_experts`:** Add actual LLM calls based on the generated prompts. 