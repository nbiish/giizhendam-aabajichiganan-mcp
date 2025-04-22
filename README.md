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

To run this MCP server within a compatible editor (like Cursor), you can use `npx`. Configure your editor's MCP settings to run the command, providing necessary environment variables directly within the `env` object as shown below. Ensure you replace placeholder values (like API keys) with your actual credentials.

**Example Configuration:**

```json
{
  "mcpServers": {
    "giizhendam-aabajichiganan": { 
      "type": "stdio", // Assuming stdio transport, adjust if needed
      "command": "npx",
      "args": [
        "-y", // Automatically install the package if needed
        "@nbiish/giizhendam-aabajichiganan-mcp"
      ],
      "env": {
        "GEMINI_API_KEY": "YOUR_GEMINI_API_KEY", // Add if needed by specific tools
        "OPENROUTER_API_KEY": "YOUR_OPENROUTER_API_KEY", // Required for OpenRouter models
        "DEFAULT_ARCHITECT_MODEL": "openrouter/google/gemini-2.5-pro-exp-03-25:free", // Recommended Default
        "DEFAULT_EDITOR_MODEL": "openrouter/google/gemini-2.5-pro-exp-03-25:free" // Recommended Default
        // Add other environment variables as needed by tools
      }
    }
    // You can add configurations for other MCP servers here
  }
}
```

*(Note: The exact structure under `mcpServers` might vary slightly depending on your specific MCP client/editor. The key part is providing the `command`, `args`, and `env`.)*

Alternatively, use the English translation name `@nbiish/ai-tool-mcp` in the `args` array.

## Configuration

The server is configured using environment variables. These can be set in two primary ways:

1.  **Shell Environment:** Export the variables in your terminal session before launching the editor/client (e.g., `export OPENROUTER_API_KEY="your_key_here"`).
2.  **MCP Client `env` Object:** Pass the variables directly within the `env` object in your MCP client's JSON configuration, as shown in the example above. This is often the most convenient method.

**Required/Common Environment Variables:**

-   `OPENROUTER_API_KEY`: **Required** for using any OpenRouter models (which are the defaults).
-   `DEFAULT_ARCHITECT_MODEL`: Overrides the default architect model used by tools like `generate_aider_commands`. Defaults to `openrouter/google/gemini-2.5-pro-exp-03-25:free` if not set. See recommended models below.
-   `DEFAULT_EDITOR_MODEL`: Overrides the default editor model used by tools like `generate_aider_commands`. Defaults to `openrouter/google/gemini-2.5-pro-exp-03-25:free` if not set. See recommended models below.
-   `GEMINI_API_KEY`: May be required if specific tools are implemented to use the Gemini API directly (currently placeholder tools may not require this).
-   *(Other variables may be needed depending on the specific tools implemented or added in the future.)*

**Recommended Models (OpenRouter)**

You can override the default models used by the server (specifically `DEFAULT_ARCHITECT_MODEL` and `DEFAULT_EDITOR_MODEL` for the `generate_aider_commands` tool) by setting the corresponding environment variable in your MCP client's `env` object.

Here is the prioritized list of recommended OpenRouter models (use the full ID string):

```
- openrouter/google/gemini-2.5-pro-exp-03-25:free
- openrouter/deepseek/deepseek-coder-v2:free
- openrouter/google/gemini-2.5-flash-preview
- openrouter/google/gemini-2.5-pro-preview
- openrouter/deepseek/deepseek-coder-v2
- openrouter/deepseek/deepseek-chat:free
- openrouter/google/gemini-flash-1.5
- openrouter/anthropic/claude-3.5-sonnet
```

**Example: Using DeepSeek Coder V2 Free as the Editor Model**

Modify your MCP client's configuration JSON like this:

```json
{
  "mcpServers": {
    "giizhendam-aabajichiganan": { 
      // ... other settings ...
      "env": {
        "OPENROUTER_API_KEY": "YOUR_OPENROUTER_API_KEY",
        "DEFAULT_ARCHITECT_MODEL": "openrouter/google/gemini-2.5-pro-exp-03-25:free", 
        "DEFAULT_EDITOR_MODEL": "openrouter/deepseek/deepseek-coder-v2:free" // <-- Changed Editor Model
      }
    }
  }
}
```

For tools like `prompt`, `prompt_from_file`, etc., you can specify models using the `models_prefixed_by_provider` parameter when calling the tool.

## Features

ᑮᔐᓐᑕᒻ ᐋᐸᒋᒋᑲᓇᓐ (Giizhendam Aabajichiganan) MCP provides cognitive tools and integrates external functionalities like `aider` command generation to enhance AI-assisted coding workflows.

**Available Tools (as of latest update):**

*   `generate_aider_commands`: Generates `aider` CLI commands for various tasks (research, coding, security, etc.) using configurable OpenRouter models.
*   `prompt`: (Placeholder) Sends a prompt to specified LLM models.
*   `prompt_from_file`: (Placeholder) Sends a prompt from a file to specified LLM models.
*   `prompt_from_file_to_file`: (Placeholder) Sends a prompt from a file, gets responses, and saves to files.
*   `ceo_and_board`: (Placeholder) Simulates a board/CEO decision process using LLMs.
*   `list_providers`: (Placeholder) Lists available LLM providers.
*   `finance_experts`: (Placeholder) Consults specialized financial agent personas.

*(Placeholder tools require further implementation for full functionality.)*

## Development

1.  **Clone:** `git clone https://github.com/nbiish/giizhendam-aabajichiganan-mcp.git`
2.  **Install:** `cd giizhendam-aabajichiganan-mcp && npm install`
3.  **Build:** `npm run build`
4.  **Run Locally (for testing):** `node dist/index.js` (ensure required ENV VARS are set)

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