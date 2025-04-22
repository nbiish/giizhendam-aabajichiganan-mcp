# Giizhendam Aabajichiganan MCP Server - Project Tracker

## Goal
Implement and verify the functionality of all tools provided by the `giizhendam-aabajichiganan-mcp` server.

## Current Status & Plan (as of latest update)

| Tool                          | Status                 | Notes / Next Steps                                                                                  |
| :---------------------------- | :--------------------- | :-------------------------------------------------------------------------------------------------- |
| `run_aider_task`              | Implemented (v1)     | Executes aider via `spawn`. Allows model overrides via params. Needs verification testing.         |
| `prompt`                      | Implemented (v1)     | Uses OpenRouter API via `fetch` with default model from env. Needs testing.                   |
| `prompt_from_file`            | Implemented (v1)     | Reads file, uses OpenRouter via `fetch` with default model from env. Needs testing.          |
| `prompt_from_file_to_file`  | Placeholder          | **TODO:** Implement file writing logic for results. Uses default model.                         |
| `ceo_and_board`               | Placeholder          | **TODO:** Implement multi-model logic (placeholder). Uses default model.                          |
| `finance_experts`             | Placeholder          | **TODO:** Implement financial expert persona logic.                                                 |

## Key Dependencies / Configuration

*   **Aider CLI:** Must be installed and available in the system PATH where the server runs.
*   **OpenRouter API Key:** Required via `OPENROUTER_API_KEY` environment variable.
*   **Default Models:** `DEFAULT_ARCHITECT_MODEL`, `DEFAULT_EDITOR_MODEL` environment variables used.
*   **Node.js Features:** Relies on built-in `fetch`, `fs/promises`, `child_process`.
*   **MCP SDK:** `@modelcontextprotocol/sdk`

## Next Steps

1.  **Build:** Run `npm run build` (or equivalent).
2.  **Publish:** Publish the new version to npm.
3.  **Restart Server:** Ensure the MCP client reloads the server configuration/gets the new version.
4.  **Test Implemented Tools:**
    *   Test `run_aider_task` with various parameters.
    *   Test `prompt` with text input.
    *   Test `prompt_from_file` with a test file.
5.  **Implement Remaining Tools:** Address the TODO items for the placeholder tools. 