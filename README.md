# ᑮᔐᓐᑕᒻ ᐋᐸᒋᒋᑲᓇᓐ MCP Server (@nbiish/giizhendam-aabajichiganan-mcp)

<div align="center">
  <hr width="50%">
  
  <h3>Support This Project</h3>
  <div style="display: flex; justify-content: center; gap: 20px; margin: 20px 0;">
    <div>
      <h4>Stripe</h4>
      <img src="qr-stripe-donation.png" alt="Scan to donate" width="180"/>
      <p><a href="https://raw.githubusercontent.com/nbiish/license-for-all-works/8e9b73b269add9161dc04bbdd79f818c40fca14e/qr-stripe-donation.png">Donate via Stripe</a></p>
    </div>
    <div style="display: flex; align-items: center;">
      <a href="https://www.buymeacoffee.com/nbiish"><img src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=&slug=nbiish&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff" /></a>
    </div>
  </div>
  
  <hr width="50%">
</div>

This package provides an MCP (Model Context Protocol) server that acts as an interface to various tools, including:

*   An interface to `aider` via direct execution (for `prompt_aider`, `double_compute`).
*   A financial expert simulation tool (`finance_experts`) using the Google Gemini API.
*   A board discussion simulation tool (`ceo_and_board`) using the Google Gemini API.

## Installation & Setup

This server is designed to be run via `npx` within an environment configured for MCP.

1.  **Prerequisites:** Ensure you have Node.js (v18+) and npm installed.
2.  **MCP Configuration:** Add the server to your MCP configuration file (e.g., `~/.cursor/mcp.json`).

    ```json
    {
      "mcpServers": {
        "giizhendam-aabajichiganan-mcp": { // Choose a name for your reference
          "command": "npx",
          "args": [
            "-y",
            "@nbiish/giizhendam-aabajichiganan-mcp"
          ],
          "env": {
            "GEMINI_API_KEY": "YOUR_GEMINI_API_KEY_HERE", // Essential for finance_experts
            "OPENROUTER_API_KEY": "YOUR_OPENROUTER_KEY_HERE", // Likely needed for aider tools
            "AIDER_MODEL": "openrouter/google/gemini-pro", // Example, configure as needed
            "AIDER_EDITOR_MODEL": "openrouter/google/gemini-pro" // Example, configure as needed
            // Add any other necessary environment variables here
          }
        }
        // ... other servers
      }
    }
    ```

## Configuration

### Environment Variables

The server requires the following environment variables to be set (either in the `env` block of your `mcp.json` or in your execution environment):

*   `GEMINI_API_KEY`: **Required** for the `finance_experts` and `ceo_and_board` tools. Get an API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
*   `AIDER_MODEL`: Specifies the primary model for aider (used *only* by `prompt_aider` and `double_compute`). Configure according to your `aider` setup (e.g., referencing OpenAI, OpenRouter, etc.).
*   `AIDER_EDITOR_MODEL`: Specifies the editor model for aider (used *only* by `prompt_aider` and `double_compute`, optional).
*   `OPENROUTER_API_KEY`: Required *if* your `AIDER_MODEL` or `AIDER_EDITOR_MODEL` uses an OpenRouter model.

### Dependencies

The server process needs access to certain files in its working directory:

*   `finance-agents.md`: **No longer required.** Expert prompts are now hardcoded within the `finance_experts` tool.

*(Note: `aider-cli-commands.sh` is **not** used by this server directly anymore, but the underlying `aider` command must be installed and configured in the environment if you intend to use the `prompt_aider` or `double_compute` tools).*

## Available Tools

*   `prompt_aider`: Executes `aider` directly with a prompt and optional files. Uses `AIDER_MODEL` / `AIDER_EDITOR_MODEL`.
*   `double_compute`: Executes `prompt_aider` twice. Uses `AIDER_MODEL` / `AIDER_EDITOR_MODEL`.
*   `finance_experts`: Simulates a deliberation between financial experts (Graham, Ackman, Wood, Munger, Burry, Lynch, Fisher) on a given topic using the Gemini API. Requires `GEMINI_API_KEY`.
*   `ceo_and_board`: Simulates a board discussion using the Gemini API. Requires `GEMINI_API_KEY`.

## License

This project is licensed under the terms detailed in the [LICENSE](LICENSE) file.

## Citation

Please cite this work as follows:

```bibtex
@misc{giizhendam-aabajichiganan-mcp2024,
  author/creator/steward = {ᓂᐲᔥ ᐙᐸᓂᒥᑮ-ᑭᓇᐙᐸᑭᓯ (Nbiish Waabanimikii-Kinawaabakizi), also known legally as JUSTIN PAUL KENWABIKISE, professionally documented as Nbiish-Justin Paul Kenwabikise, Anishinaabek Dodem (Anishinaabe Clan): Animikii (Thunder), descendant of Chief ᑭᓇᐙᐸᑭᓯ (Kinwaabakizi) of the Beaver Island Band and enrolled member of the sovereign Grand Traverse Band of Ottawa and Chippewa Indians},
  title/description = {giizhendam-aabajichiganan-mcp},
  type_of_work = {Indigenous digital creation/software incorporating traditional knowledge and cultural expressions},
  year = {2024},
  publisher/source/event = {GitHub repository under tribal sovereignty protections},
  howpublished = {\url{https://github.com/nbiish/giizhendam-aabajichiganan-mcp}},
  note = {Authored and stewarded by ᓂᐲᔥ ᐙᐸᓂᒥᑮ-ᑭᓇᐙᐸᑭᓯ (Nbiish Waabanimikii-Kinawaabakizi), also known legally as JUSTIN PAUL KENWABIKISE, professionally documented as Nbiish-Justin Paul Kenwabikise, Anishinaabek Dodem (Anishinaabe Clan): Animikii (Thunder), descendant of Chief ᑭᓇᐙᐸᑭᓯ (Kinwaabakizi) of the Beaver Island Band and enrolled member of the sovereign Grand Traverse Band of Ottawa and Chippewa Indians. This work embodies Indigenous intellectual property, traditional knowledge systems (TK), traditional cultural expressions (TCEs), and associated data protected under tribal law, federal Indian law, treaty rights, Indigenous Data Sovereignty principles, and international indigenous rights frameworks including UNDRIP. All usage, benefit-sharing, and data governance are governed by the COMPREHENSIVE RESTRICTED USE LICENSE FOR INDIGENOUS CREATIONS WITH TRIBAL SOVEREIGNTY, DATA SOVEREIGNTY, AND WEALTH RECLAMATION PROTECTIONS.}
}
```

---
Copyright © 2024 ᓂᐲᔥ ᐙᐸᓂᒥᑮ-ᑭᓇᐙᐸᑭᓯ (Nbiish Waabanimikii-Kinawaabakizi), also known legally as JUSTIN PAUL KENWABIKISE, professionally documented as Nbiish-Justin Paul Kenwabikise, Anishinaabek Dodem (Anishinaabe Clan): Animikii (Thunder), a descendant of Chief ᑭᓇᐙᐸᑭᓯ (Kinwaabakizi) of the Beaver Island Band, and an enrolled member of the sovereign Grand Traverse Band of Ottawa and Chippewa Indians. This work embodies Traditional Knowledge and Traditional Cultural Expressions. All rights reserved. 