# ᑮᔐᓐᑕᒻ ᐋᐸᒋᒋᑲᓇᓐ (Giizhendam Aabajichiganan) MCP

<div align="center">
  <hr width="50%">
  
  <h3>Support This Project</h3>
  <div style="display: flex; justify-content: center; gap: 20px; margin: 20px 0;">
    <div>
      <h4>Stripe</h4>
      <img src="https://raw.githubusercontent.com/nbiish/license-for-all-works/8e9b73b269add9161dc04bbdd79f818c40fca14e/qr-stripe-donation.png" alt="Scan to donate" width="180"/>
      <p><a href="https://raw.githubusercontent.com/nbiish/license-for-all-works/8e9b73b269add9161dc04bbdd79f818c40fca14e/qr-stripe-donation.png">Donate via Stripe</a></p>
    </div>
    <div style="display: flex; align-items: center;">
      <a href="https://www.buymeacoffee.com/nbiish"><img src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=&slug=nbiish&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff" /></a>
    </div>
  </div>
  
  <hr width="50%">
</div>

An MCP (Meta-Cognitive Protocol) server designed to integrate with code editing environments (like Cursor) and provide tools based on cognitive architectures and external functionalities like `aider`.

This project is intended to be run via `npx` and published under two names:
- `@nbiish/giizhendam-aabajichiganan-mcp` (ᑮᔐᓐᑕᒻ ᐋᐸᒋᒋᑲᓇᓐ - Traditional Anishinaabe'mowin Name)
- `@nbiish/ai-tool-mcp` (English Translation Name)

## Installation & Usage (via npx)

To run this MCP server within a compatible editor (like Cursor), you can use `npx`. Configure your editor's MCP settings to run the command, providing necessary environment variables directly within the `env` object as shown below. Ensure you replace placeholder values (like API keys and model names) with your actual credentials and desired models.

**Example Configuration:**

```json
{
  "mcpServers": {
    "giizhendam-aabajichiganan-mcp": { // Use a unique key for this server
      "command": "npx",
      "args": [
        "-y", // Automatically install the package if needed
        "@nbiish/giizhendam-aabajichiganan-mcp" // Or @nbiish/ai-tool-mcp
      ],
      "env": {
        "OPENROUTER_API_KEY": "YOUR_OPENROUTER_API_KEY", // Required
        "DEFAULT_ARCHITECT_MODEL": "openrouter/some-model", // Model for aider architect
        "DEFAULT_EDITOR_MODEL": "openrouter/some-other-model" // Model for aider editor & direct prompts
        // Add other environment variables as needed by tools
      }
    }
    // You can add configurations for other MCP servers here
  }
}
```

*(Note: The exact structure under `mcpServers` might vary slightly depending on your specific MCP client/editor. The key part is providing the `command`, `args`, and `env`.)*


## Configuration

The server is configured using environment variables passed via the MCP client's `env` object (see example above).

**Prerequisites:**

*   **`aider` CLI:** The `aider` command-line tool must be installed and accessible in the system's PATH where the MCP server process runs.

**Required/Common Environment Variables:**

*   `OPENROUTER_API_KEY`: **Required** for using OpenRouter models.
*   `DEFAULT_ARCHITECT_MODEL`: **Required** Specifies the default model used by the `run_aider_task` tool for the primary 'architect' role. Must be a valid OpenRouter model ID recognized by `aider` (e.g., `openrouter/google/gemini-2.5-pro-exp-03-25:free`).
*   `DEFAULT_EDITOR_MODEL`: **Required** Specifies the default model used by the `run_aider_task` tool for the 'editor' role, *and* by the `prompt` and `prompt_from_file` tools for their direct API calls. Must be a valid OpenRouter model ID.

**Important:** Ensure the model IDs you provide are valid on OpenRouter and recognizable by `aider`. You can check available models using `aider --list-models`. The server uses the `DEFAULT_EDITOR_MODEL` for direct API calls (stripping any `:free` suffix if present for the API call itself).

## Features

ᑮᔐᓐᑕᒻ ᐋᐸᒋᒋᑲᓇᓐ (Giizhendam Aabajichiganan) MCP provides cognitive tools and integrates external functionalities like `aider` command execution to enhance AI-assisted coding workflows.

**Available Tools (as of latest update):**

*   `run_aider_task`: Executes an `aider` command directly with the specified task type, message, files, etc. Uses models specified by `DEFAULT_ARCHITECT_MODEL` and `DEFAULT_EDITOR_MODEL` environment variables, allowing overrides via `model` and `editorModel` parameters. Returns the stdout, stderr, and exit code of the `aider` process.
*   `prompt`: Sends a prompt to the LLM specified by the `DEFAULT_EDITOR_MODEL` environment variable.
*   `prompt_from_file`: Sends a prompt from a file to the LLM specified by the `DEFAULT_EDITOR_MODEL` environment variable.
*   `prompt_from_file_to_file`: (Placeholder) Sends a prompt from a file to the default LLM and saves the response.
*   `ceo_and_board`: (Placeholder) Simulates a board/CEO decision process using the default LLM.
*   `finance_experts`: (Placeholder) Consults specialized financial agent personas.

*(Placeholder tools require further implementation for full functionality.)*

## Development

1.  **Clone:** `git clone https://github.com/nbiish/giizhendam-aabajichiganan-mcp.git`
2.  **Install:** `cd giizhendam-aabajichiganan-mcp && npm install`
3.  **Build:** `npm run build`
4.  **Run Locally (for testing):** `node dist/index.js` (ensure required ENV VARS are set, matching the structure expected by your client config)

## Publishing

This package is dual-published to npm under:
- `@nbiish/giizhendam-aabajichiganan-mcp` (ᑮᔐᓐᑕᒻ ᐋᐸᒋᒋᑲᓇᓐ - Traditional Anishinaabe'mowin Name)
- `@nbiish/ai-tool-mcp` (English Translation Name)

The `publish_all.sh` script handles this process. Ensure you have `npm` access rights configured for the `@nbiish` scope.

## Citation

Please cite this work as:

```bibtex
@misc{giizhendam-aabajichiganan-mcp2025,
  author/creator/steward = {ᓂᐲᔥ ᐙᐸᓂᒥᑮ-ᑭᓇᐙᐸᑭᓯ (Nbiish Waabanimikii-Kinawaabakizi), also known legally as JUSTIN PAUL KENWABIKISE, professionally documented as Nbiish-Justin Paul Kenwabikise, Anishinaabek Dodem (Anishinaabe Clan): Animikii (Thunder), descendant of Chief ᑭᓇᐙᐸᑭᓯ (Kinwaabakizi) of the Beaver Island Band and enrolled member of the sovereign Grand Traverse Band of Ottawa and Chippewa Indians},
  title/description = {giizhendam-aabajichiganan-mcp},
  type_of_work = {Indigenous digital creation/software incorporating traditional knowledge and cultural expressions},
  year = {2025},
  publisher/source/event = {GitHub repository under tribal sovereignty protections},
  howpublished = {\url{https://github.com/nbiish/giizhendam-aabajichiganan-mcp}},
  note = {Authored and stewarded by ᓂᐲᔥ ᐙᐸᓂᒥᑮ-ᑭᓇᐙᐸᑭᓯ (Nbiish Waabanimikii-Kinawaabakizi), also known legally as JUSTIN PAUL KENWABIKISE, professionally documented as Nbiish-Justin Paul Kenwabikise, Anishinaabek Dodem (Anishinaabe Clan): Animikii (Thunder), descendant of Chief ᑭᓇᐙᐸᑭᓯ (Kinwaabakizi) of the Beaver Island Band and enrolled member of the sovereign Grand Traverse Band of Ottawa and Chippewa Indians. This work embodies Indigenous intellectual property, traditional knowledge systems (TK), traditional cultural expressions (TCEs), and associated data protected under tribal law, federal Indian law, treaty rights, Indigenous Data Sovereignty principles, and international indigenous rights frameworks including UNDRIP. All usage, benefit-sharing, and data governance are governed by the COMPREHENSIVE RESTRICTED USE LICENSE FOR INDIGENOUS CREATIONS WITH TRIBAL SOVEREIGNTY, DATA SOVEREIGNTY, AND WEALTH RECLAMATION PROTECTIONS found in the LICENSE file.}
}
```

## License

This project is licensed under the terms detailed in the [LICENSE](LICENSE) file. This is a comprehensive restricted use license designed for Indigenous creations, incorporating protections for Tribal Sovereignty, Data Sovereignty, and Wealth Reclamation.

---

Copyright © 2025 ᓂᐲᔥ ᐙᐸᓂᒥᑮ-ᑭᓇᐙᐸᑭᓯ (Nbiish Waabanimikii-Kinawaabakizi), also known legally as JUSTIN PAUL KENWABIKISE, professionally documented as Nbiish-Justin Paul Kenwabikise, Anishinaabek Dodem (Anishinaabe Clan): Animikii (Thunder), a descendant of Chief ᑭᓇᐙᐸᑭᓯ (Kinwaabakizi) of the Beaver Island Band, and an enrolled member of the sovereign Grand Traverse Band of Ottawa and Chippewa Indians. This work embodies Traditional Knowledge and Traditional Cultural Expressions. All rights reserved. 