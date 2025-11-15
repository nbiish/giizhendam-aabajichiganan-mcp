# ◈──◆──◇ GIIZHENDAM AABAJICHIGANAN MCP SERVER ◇──◆──◈

*"Giizhendam Aabajichiganan"* (Ojibwe: Decision-Making Tools) - An MCP server providing AI-assisted programming and decision-making tools.

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

<div align="center">
╭──────────────[ ◈◆◇ SYSTEM OVERVIEW ◇◆◈ ]──────────────╮
</div>

## ᐴ WAAWIINDAMAAGEWIN ᔔ [OVERVIEW] ◈──◆──◇──◆──◈

This project implements a Model Context Protocol (MCP) server that provides multi-agent CLI orchestration for developers and decision-makers. It serves as a bridge between different AI models and external CLI agents, and provides specialized tools for financial analysis and collaborative decision simulation.

The server includes a multi-agent orchestrator tool (`orchestrate_agents`) that loads CLI agents from `CLI_AGENTS_JSON` or `llms.txt`, uses Gemini 2.5 Pro via OpenRouter to decide between sequential or parallel execution, executes the agents, and synthesizes a consolidated markdown report.

<div align="center">
◈──◆──◇─────────────────────────────────────────────────◇──◆──◈
</div>

## ᐴ GASHKITOONAN ᔔ [CAPABILITIES] ◈──◆──◇──◆──◈

- **◇ Multi-Agent Orchestrator ◇**
  - Load CLI agents from CLI_AGENTS_JSON or llms.txt
  - Model-chosen sequential or parallel execution
  - Consolidated markdown synthesis of agent outputs
  
- **◇ Financial Expert Simulation ◇**
  - Simulates deliberation between 7 financial expert personas
  - Generates analysis from different financial perspectives
  - Includes perspectives from Graham, Ackman, Wood, Munger, Burry, Lynch, and Fisher
  
- **◇ CEO & Board Meeting Simulation ◇**
  - Simulates realistic board discussions on specified topics
  - Customizable roles and discussion parameters
  - Useful for planning and decision-making exercises
  
- **◇ Security & Reliability ◇**
  - Built-in security checks for file operations and URL validation
  - Comprehensive error handling and logging
  - Secure API key management

<div align="center">
◈──◆──◇─────────────────────────────────────────────────◇──◆──◈
</div>

## ᐴ OSHKI-AABAJICHIGANAN ᔔ [RECENT CHANGES] ◈──◆──◇──◆──◈

- **v0.3.34** - Fixed shebang line in the bundled output file to ensure proper execution via npx. This resolves issues with "Client closed" errors when running via MCP.

<div align="center">
◈──◆──◇─────────────────────────────────────────────────◇──◆──◈
</div>

## ᐴ NITAM-AABAJICHIGANAN ᔔ [PREREQUISITES] ◈──◆──◇──◆──◈

- Node.js (v14 or higher) and npm/yarn
- CLI tools for agents you plan to run (e.g., qwen, gemini, cursor, goose, opencode, crush) available in PATH
- API keys for required services (e.g., OpenRouter)

<div align="center">
╭──────────────[ ◈◆◇ SYSTEM INSTALLATION ◇◆◈ ]──────────────╮
</div>

## ᐴ AABAJITOOWINAN ᔔ [INSTALLATION] ◈──◆──◇──◆──◈

### Global Installation (Recommended)

```bash
╭──────────────────────────────────────────────────────────────────────╮
│  ᐴ AABAJITOOWINAN ᔔ [ IMPLEMENTATION COMMANDS ]                      │
╰──────────────────────────────────────────────────────────────────────╯

# First uninstall any existing versions
npm uninstall -g @nbiish/giizhendam-aabajichiganan-mcp
npm uninstall -g @nbiish/ai-tool-mcp

# Install from the current directory
npm install -g .

# Or install from npm registry (choose one)
npm install -g @nbiish/giizhendam-aabajichiganan-mcp
# Alternative package with identical functionality
npm install -g @nbiish/ai-tool-mcp
```

### Troubleshooting Installation Issues

If you encounter issues with the executable script (e.g., "command not found" or shell syntax errors), try these steps:

```bash
╭──────────────────────────────────────────────────────────────────────╮
│  ᐴ NANAA'ITOOWIN ᔔ [ TROUBLESHOOTING COMMANDS ]                      │
╰──────────────────────────────────────────────────────────────────────╯

# Check if the installed script has the proper shebang line:
cat $(which giizhendam-mcp)

# If the shebang line is missing or incorrect, fix it manually:
echo '#!/usr/bin/env node' > /tmp/fixed-script
cat $(which giizhendam-mcp) >> /tmp/fixed-script
sudo mv /tmp/fixed-script $(which giizhendam-mcp)
sudo chmod +x $(which giizhendam-mcp)

# Alternatively, reinstall after clearing npm cache:
npm cache clean --force
npm uninstall -g @nbiish/giizhendam-aabajichiganan-mcp
npm install -g .
```

<div align="center">
╭──────────────[ ◈◆◇ SYSTEM CONFIGURATION ◇◆◈ ]──────────────╮
</div>

## ᐴ ONAAKONIGE ᔔ [CONFIGURATION] ◈──◆──◇──◆──◈

You can configure the server settings within your `mcp.json` file when defining the server:

```json
╭──────────────────────────────────────────────────────────────────────╮
│  ᐴ ONAAKONIGE ᔔ [ CONFIGURATION SETTINGS ]                           │
╰──────────────────────────────────────────────────────────────────────╯

"ai-tool-mcp": {
  "command": "npx",
  "args": ["-y", "@nbiish/giizhendam-aabajichiganan-mcp"],
  "env": {
    "OPENROUTER_API_KEY": "YOUR_OPENROUTER_API_KEY",
    "ORCHESTRATOR_MODEL": "google/gemini-2.5-pro",
    "CLI_AGENTS_JSON": "[ {\"name\":\"Qwen\",\"cmd\":\"qwen -y {prompt}\"} ]",
    "AGENT_OUTPUT_DIR": "./output/agents",
    "EXECUTION_STYLE": "auto", // or sequential | parallel
    "FINANCE_EXPERTS_OUTPUT_DIR": "./output/finance-experts",
    "CEO_BOARD_OUTPUT_DIR": "./output/ceo-and-board"
  },
  "cwd": "/path/to/your/project"
}
```

The server uses the following internal defaults if environment variables are not provided via `mcp.json`:
- `ORCHESTRATOR_MODEL`: `google/gemini-2.5-pro`
- Output Directories: Relative to the server's Current Working Directory (`cwd`) specified in `mcp.json`, defaulting to `./output/finance-experts` and `./output/ceo-and-board`.

Note: The orchestrator decides sequential vs parallel automatically unless you set `EXECUTION_STYLE` to force a style. Agent outputs and the final synthesis markdown are written to `AGENT_OUTPUT_DIR`.

<div align="center">
╭──────────────[ ◈◆◇ SYSTEM OPERATION ◇◆◈ ]──────────────╮
</div>

## ᐴ INAABAJICHIGAN ᔔ [USAGE] ◈──◆──◇──◆──◈

### Orchestrate CLI Agents

Use the `orchestrate_agents` tool to run your configured CLI agents and produce a consolidated report:

```typescript
╭──────────────────────────────────────────────────────────────────────╮
│  ᐴ WIIDOOKAAZOWIN ᔔ [ CODE ASSISTANCE ]                           │
╰──────────────────────────────────────────────────────────────────────╯

const result = await server.execute("orchestrate_agents", {
  prompt_text: "Create a React component that displays a counter with increment and decrement buttons"
});

// Returns a summary with execution style, per-agent outputs, and synthesis markdown path in _meta
```

### Notes

The former double computation tool has been removed. If you need redundant verification, you can invoke `orchestrate_agents` multiple times and compare outputs.

### Financial Expert Simulation

Simulate a financial analysis from multiple expert perspectives:

```typescript
╭──────────────────────────────────────────────────────────────────────╮
│  ᐴ ZHOONIYAAWICHIGEWIN ᔔ [ FINANCIAL EXPERTISE ]                     │
╰──────────────────────────────────────────────────────────────────────╯

const result = await server.execute("finance_experts", {
  topic: "Funding strategy for our new AI product line",
  output_filename: "ai_product_funding_analysis"  // Optional: custom filename
});

// Results saved to ./financial-experts/ai_product_funding_analysis_[timestamp].md
```

### Board Meeting Simulation

Simulate a board discussion on a specific topic:

```typescript
╭──────────────────────────────────────────────────────────────────────╮
│  ᐴ MAAWANJIDIWIN ᔔ [ BOARD MEETING ]                                 │
╰──────────────────────────────────────────────────────────────────────╯

const result = await server.execute("ceo_and_board", {
  topic: "Q3 Strategy Review: Expansion into European Markets",
  output_filename: "q3_europe_expansion_board_meeting"  // Optional: custom filename
});

// The tool now uses standard board roles by default, including:
// Board Chair, CEO, CFO, COO, CTO, Independent Director, Corporate Secretary/General Counsel, etc.

// You can also specify custom roles if needed:
const result = await server.execute("ceo_and_board", {
  topic: "Q3 Strategy Review: Expansion into European Markets",
  roles: ["CEO", "CFO", "CTO", "Lead Investor", "Independent Director"],
  output_filename: "q3_europe_expansion_board_meeting"
});

// Results saved to the configured output directory or default ./ceo-and-board/
```

<div align="center">
╭──────────────[ ◈◆◇ ANISHINAABE APPLICATIONS ◇◆◈ ]──────────────╮
</div>

## ᐴ WAABANDA'IWEWIN ᔔ [EXAMPLES] ◈──◆──◇──◆──◈

### Anishinaabe Cultural Examples

Here are some examples of how these tools could be applied in contexts relevant to Anishinaabe culture and communities:

```typescript
╭──────────────────────────────────────────────────────────────────────╮
│  ᐴ ANISHINAABE INAADIZIWIN ᔔ [ CULTURAL APPLICATIONS ]               │
╰──────────────────────────────────────────────────────────────────────╯

// Example using orchestrator for language revitalization
const result = await server.execute("orchestrate_agents", {
  prompt_text: "Help draft an Ojibwe language localization file (oj.json) for our UI based on this English template file. Ensure respectful and accurate translations.",
});

// Example: run orchestrator for resource management simulation
const result2 = await server.execute("orchestrate_agents", {
  prompt_text: "Verify the logic in wild_rice_harvest_simulation.js for sustainable yield calculations reflecting traditional ecological knowledge principles."
});

// Example using finance_experts for community project planning
const result = await server.execute("finance_experts", {
  topic: "Financial sustainability plan for the Ojibwe Language Nest startup, considering long-term community benefit and grant opportunities.",
  output_filename: "ojibwe_language_nest_finance_plan"
});

// Example using ceo_and_board for governance simulation
const result = await server.execute("ceo_and_board", {
  topic: "Tribal Council discussion on investing treaty settlement funds into renewable energy infrastructure on reservation lands, balancing economic development with environmental stewardship.",
  roles: ["Tribal Chair", "Treasurer", "Council Member (Economic Development)", "Council Member (Natural Resources)", "Elder Advisor", "Community Member Rep"],
  output_filename: "treaty_fund_renewable_energy_discussion"
});
```

## Tool Reference

### orchestrate_agents

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| prompt_text | string | The main prompt/instruction that is passed to each CLI agent’s command template | Yes |

### finance_experts

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| topic | string | The central financial topic or query related to a project or business situation | Yes |
| output_filename | string | Optional filename (without extension) for the output markdown file | No |

### ceo_and_board

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| topic | string | The central topic for the board discussion | Yes |
| roles | string[] | Optional list of board member roles to simulate. If not provided, standard board roles will be used | No |
| output_filename | string | Optional filename (without extension) for the output markdown file | No |

## Project Structure

```
giizhendam-aabajichiganan-mcp/
├── src/                    # Source code
│   └── index.ts            # Main server implementation
├── dist/                   # Compiled JavaScript output
├── output/                 # Configurable output directory (example)
│   ├── agents/             # Per-agent outputs and synthesis markdown
│   ├── finance-experts/    # Financial expert simulation output
│   └── ceo-and-board/      # Board simulation output
├── package.json            # Project metadata and dependencies
└── tsconfig.json           # TypeScript configuration
```

## Development

```bash
# Run in development mode
npm run dev

# Build
npm run build

# Test
npm test
```

## Local Testing Plan

- **Prepare env**
  - Set `OPENROUTER_API_KEY` in your MCP config env or shell.
  - Optionally set `CLI_AGENTS_JSON` or populate `llms.txt`.
  - Ensure agent CLIs (qwen, gemini, cursor, goose, opencode, crush) are installed and in PATH.
- **Start server**
  - `npm run build`
  - Launch via your MCP client using the `mcp.json` example above.
- **Invoke orchestrator**
  - Call `orchestrate_agents` with a short `prompt_text`.
  - Expected: The server selects `parallel` or `sequential`, executes agents, writes per-agent files under `AGENT_OUTPUT_DIR`, and creates a synthesis markdown file.
- **Verify outputs**
  - Confirm files exist in `AGENT_OUTPUT_DIR` and review the synthesis report.
  - Adjust `EXECUTION_STYLE` to `sequential` or `parallel` to force behavior.
- **Troubleshoot**
  - If timeouts occur, tune `OPENROUTER_TIMEOUT_MS`, `SYNTH_MAX_PER_AGENT_CHARS`, `SYNTH_MAX_TOTAL_CHARS`.
  - Ensure each agent’s command runs successfully from your shell with a sample prompt.

## Citation

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

This project is licensed under the terms specified in the [LICENSE](LICENSE) file. This license is a COMPREHENSIVE RESTRICTED USE LICENSE FOR INDIGENOUS CREATIONS WITH TRIBAL SOVEREIGNTY, DATA SOVEREIGNTY, AND WEALTH RECLAMATION PROTECTIONS.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

Copyright © 2025 ᓂᐲᔥ ᐙᐸᓂᒥᑮ-ᑭᓇᐙᐸᑭᓯ (Nbiish Waabanimikii-Kinawaabakizi), also known legally as JUSTIN PAUL KENWABIKISE, professionally documented as Nbiish-Justin Paul Kenwabikise, Anishinaabek Dodem (Anishinaabe Clan): Animikii (Thunder), a descendant of Chief ᑭᓇᐙᐸᑭᓯ (Kinwaabakizi) of the Beaver Island Band, and an enrolled member of the sovereign Grand Traverse Band of Ottawa and Chippewa Indians. This work embodies Traditional Knowledge and Traditional Cultural Expressions. All rights reserved.

## Release Notes

### [Unreleased]
- Major Refactor: Removed Aider tooling and introduced `orchestrate_agents` for multi-agent CLI orchestration using Gemini 2.5 Pro (OpenRouter) to decide execution style and synthesize outputs.
- Added environment variables: `OPENROUTER_API_KEY`, `ORCHESTRATOR_MODEL`, `CLI_AGENTS_JSON`, `AGENT_OUTPUT_DIR`, `EXECUTION_STYLE`, and synthesis/timeout caps.