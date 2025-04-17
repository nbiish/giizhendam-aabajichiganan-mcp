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

An MCP (Multi-Cognitive Process) server designed to integrate with code editing environments (like Cursor) and provide tools based on cognitive architectures and potentially external tools like `aider`.

This project is intended to be run via `npx` and published under two names:
- `@nbiish/giizhendam-aabajichiganan-mcp` (ᑮᔐᓐᑕᒻ ᐋᐸᒋᒋᑲᓇᓐ - Traditional Anishinaabe'mowin Name)
- `@nbiish/ai-tool-mcp` (English Translation Name)

## Installation & Usage (via npx)

To run this MCP server within a compatible editor (like Cursor or Claude Desktop), you can use `npx`. Configure your editor to run one of the following commands (ensure you replace placeholders like API keys in the `env` section):

```json
{
  "mcpServers": {
    "giizhendam-aabajichiganan": { 
      "command": "npx",
      "args": [
        "-y",
        "@nbiish/giizhendam-aabajichiganan-mcp"
      ],
      "env": {
        "GEMINI_API_KEY": "YOUR_GEMINI_API_KEY",
        "OPENROUTER_API_KEY": "YOUR_OPENROUTER_API_KEY",
        "DEFAULT_ARCHITECT_MODEL": "gemini-2.5-pro-preview-03-25",
        "DEFAULT_CODER_MODEL": "gemini-2.5-pro-preview-03-25",
        "CUSTOM_ARCHITECT_MODEL": "deepseek/deepseek-chat-v3-0324:free",
        "CUSTOM_CODER_MODEL": "deepseek/deepseek-chat-v3-0324:free"
      }
    }
  }
}
```

Or using the English translation name:

```json
{
  "mcpServers": {
    "ai-tool-mcp": { 
      "command": "npx",
      "args": [
        "-y",
        "@nbiish/ai-tool-mcp"
      ],
      "env": {
        "GEMINI_API_KEY": "YOUR_GEMINI_API_KEY",
        "OPENROUTER_API_KEY": "YOUR_OPENROUTER_API_KEY",
        "DEFAULT_ARCHITECT_MODEL": "gemini-2.5-pro-preview-03-25",
        "DEFAULT_CODER_MODEL": "gemini-2.5-pro-preview-03-25",
        "CUSTOM_ARCHITECT_MODEL": "deepseek/deepseek-chat-v3-0324:free",
        "CUSTOM_CODER_MODEL": "deepseek/deepseek-chat-v3-0324:free"
      }
    }
  }
}
```

## Configuration

The server requires configuration via environment variables, passed through the MCP client's `env` setting:

-   `GEMINI_API_KEY`: Your API key for Google Gemini.
-   `OPENROUTER_API_KEY`: Your API key for OpenRouter (for access to various models).
-   `DEFAULT_ARCHITECT_MODEL`: The default LLM for higher-level planning (e.g., `gemini/gemini-2.5-pro-exp-03-25`).
-   `DEFAULT_CODER_MODEL`: The default LLM for code generation/editing (e.g., `gemini/gemini-2.5-pro-exp-03-25`).
-   `CUSTOM_ARCHITECT_MODEL`: A specific alternative model for planning (e.g., `deepseek/deepseek-chat-v3-0324:free`).
-   `CUSTOM_CODER_MODEL`: A specific alternative model for editing (e.g., `deepseek/deepseek-chat-v3-0324:free`).
-   *(Potentially others as features are added)*

## Features

ᑮᔐᓐᑕᒻ ᐋᐸᒋᒋᑲᓇᓐ (Giizhendam Aabajichiganan) MCP provides cognitive tools and potentially integrates external functionalities like `aider` to enhance AI-assisted coding workflows.

*(Detailed feature list and tool descriptions to be added)*

## Development

*(Instructions for setting up the development environment, building, and testing will go here.)*

## Publishing

This package is dual-published to npm under:
- `@nbiish/giizhendam-aabajichiganan-mcp` (ᑮᔐᓐᑕᒻ ᐋᐸᒋᒋᑲᓇᓐ - Traditional Anishinaabe'mowin Name)
- `@nbiish/ai-tool-mcp` (English Translation Name)

*(The `publish_all.sh` script handles this process automatically.)*

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
  note = {Authored and stewarded by ᓂᐲᔥ ᐙᐸᓂᒥᑮ-ᑭᓇᐙᐸᑭᓯ (Nbiish Waabanimikii-Kinawaabakizi), also known legally as JUSTIN PAUL KENWABIKISE, professionally documented as Nbiish-Justin Paul Kenwabikise, Anishinaabek Dodem (Anishinaabe Clan): Animikii (Thunder), descendant of Chief ᑭᓇᐙᐸᑭᓯ (Kinwaabakizi) of the Beaver Island Band and enrolled member of the sovereign Grand Traverse Band of Ottawa and Chippewa Indians. This work embodies Indigenous intellectual property, traditional knowledge systems (TK), traditional cultural expressions (TCEs), and associated data protected under tribal law, federal Indian law, treaty rights, Indigenous Data Sovereignty principles, and international indigenous rights frameworks including UNDRIP. All usage, benefit-sharing, and data governance are governed by the COMPREHENSIVE RESTRICTED USE LICENSE FOR INDIGENOUS CREATIONS WITH TRIBAL SOVEREIGNTY, DATA SOVEREIGNTY, AND WEALTH RECLAMATION PROTECTIONS.}
}
```

## License

This project is licensed under the terms detailed in the [LICENSE](LICENSE) file. This is a comprehensive restricted use license designed for Indigenous creations, incorporating protections for Tribal Sovereignty, Data Sovereignty, and Wealth Reclamation.

---

Copyright © 2025 ᓂᐲᔥ ᐙᐸᓂᒥᑮ-ᑭᓇᐙᐸᑭᓯ (Nbiish Waabanimikii-Kinawaabakizi), also known legally as JUSTIN PAUL KENWABIKISE, professionally documented as Nbiish-Justin Paul Kenwabikise, Anishinaabek Dodem (Anishinaabe Clan): Animikii (Thunder), a descendant of Chief ᑭᓇᐙᐸᑭᓯ (Kinwaabakizi) of the Beaver Island Band, and an enrolled member of the sovereign Grand Traverse Band of Ottawa and Chippewa Indians. This work embodies Traditional Knowledge and Traditional Cultural Expressions. All rights reserved. 