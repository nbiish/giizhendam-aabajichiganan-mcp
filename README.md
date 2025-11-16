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
      <a href="https://www.buymeacoffee.com/nbiish" target="_blank"><img src="https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20coffee&emoji=&slug=nbiish&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff" alt="Buy me a coffee" /></a>
    </div>
  </div>
  
  <hr width="50%">
</div>

<div align="center">
╭──────────────[ ◈◆◇ SYSTEM OVERVIEW ◇◆◈ ]──────────────╮
</div>

## ᐴ WAAWIINDAMAAGEWIN ᔔ [OVERVIEW] ◈──◆──◇──◆──◈

This project implements a Model Context Protocol (MCP) server that provides multi-agent CLI orchestration for developers and decision-makers. It serves as a bridge between different AI models and external CLI agents, and provides specialized tools for financial analysis and collaborative decision simulation.

The server includes a multi-agent orchestrator tool (`orchestrate_agents`) that loads CLI agents from `CLI_AGENTS_JSON` or `llms.txt`, uses a configurable orchestrator model (default: Gemini 2.5 Pro) via OpenRouter to decide between sequential or parallel execution, executes the agents, and synthesizes a consolidated markdown report.

**Key Features:**
- **Unified Orchestrator Model**: All AI operations use a single configurable model via OpenRouter
- **18 Financial Expert Agents**: Comprehensive financial analysis with individual expert perspectives (900 tokens each) + RAG consolidation
- **Model Flexibility**: Easily swap between any OpenRouter-supported model (Gemini, Claude, GPT-4, etc.)

<div align="center">
◈──◆──◇─────────────────────────────────────────────────◇──◆──◈
</div>

## ᐴ GASHKITOONAN ᔔ [CAPABILITIES] ◈──◆──◇──◆──◈

- **◇ Multi-Agent Orchestrator ◇**
  - Load CLI agents from CLI_AGENTS_JSON or llms.txt
  - Model-chosen sequential or parallel execution
  - Consolidated markdown synthesis of agent outputs
  
- **◇ Financial Expert Simulation ◇**
  - Orchestrates 18 financial expert agents individually (900 tokens each)
  - Uses orchestrator model with File Search RAG to consolidate all expert outputs
  - Generates enterprise-ready, production-grade analysis and strategic advisory
  - Includes perspectives from: Damodaran, Graham, Buffett, Munger, Lynch, Fisher, Ackman, Wood, Burry, Pabrai, Jhunjhunwala, Druckenmiller, plus Valuation, Sentiment, Fundamentals, Technicals, Risk Manager, and Portfolio Manager agents
  
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

- **v0.6.0** - **Major Refactor**: Unified orchestrator model configuration via OpenRouter. Removed direct Gemini API dependency. All AI operations now use a single configurable model (`ORCHESTRATOR_MODEL`). Enhanced financial experts tool with 18 agents, 900-token limits, and RAG consolidation. Supports any OpenRouter model (Gemini, Claude, GPT-4, etc.).
- **v0.5.3** - Added 18 financial expert agents with dynamic prompt loading from markdown files
- **v0.3.34** - Fixed shebang line in the bundled output file to ensure proper execution via npx. This resolves issues with "Client closed" errors when running via MCP.

<div align="center">
◈──◆──◇─────────────────────────────────────────────────◇──◆──◈
</div>

## ᐴ NITAM-AABAJICHIGANAN ᔔ [PREREQUISITES] ◈──◆──◇──◆──◈

- Node.js (v14 or higher) and npm/yarn
- CLI tools for agents you plan to run (e.g., qwen, gemini, cursor, goose, opencode, crush) available in PATH
- **OpenRouter API Key** (required) - Used for all AI operations
- **ORCHESTRATOR_MODEL** (optional) - Defaults to `google/gemini-2.5-pro`, can be any OpenRouter-supported model

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

# Or install from npm registry via npx (recommended for MCP)
# This is the preferred method for MCP configuration
npx -y @nbiish/giizhendam-aabajichiganan-mcp

# Or install globally from npm registry
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

### MCP Client Configuration (`mcp.json`)

Configure the server in your MCP client's configuration file. The location depends on your client:
- **Cursor**: `~/.cursor/mcp.json` or `~/.config/cursor/mcp.json`
- **Claude Desktop**: `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows)
- **Other MCP Clients**: Check your client's documentation

#### Basic Configuration (Recommended)

```json
{
  "mcpServers": {
    "giizhendam-mcp": {
      "command": "npx",
      "args": ["-y", "@nbiish/giizhendam-aabajichiganan-mcp"],
      "env": {
        "OPENROUTER_API_KEY": "sk-or-v1-your-key-here",
        "ORCHESTRATOR_MODEL": "google/gemini-2.5-pro"
      }
    }
  }
}
```

#### Full Configuration with All Options

```json
{
  "mcpServers": {
    "giizhendam-mcp": {
      "command": "npx",
      "args": ["-y", "@nbiish/giizhendam-aabajichiganan-mcp"],
      "env": {
        "OPENROUTER_API_KEY": "sk-or-v1-your-key-here",
        "ORCHESTRATOR_MODEL": "google/gemini-2.5-pro",
        "CLI_AGENTS_JSON": "[{\"name\":\"Qwen\",\"cmd\":\"qwen -y \\\"{prompt}\\\"\"},{\"name\":\"Gemini\",\"cmd\":\"gemini -y \\\"{prompt}\\\"\"}]",
        "AGENT_OUTPUT_DIR": "./output/agents",
        "EXECUTION_STYLE": "auto",
        "FINANCE_EXPERTS_OUTPUT_DIR": "./output/finance-experts",
        "CEO_BOARD_OUTPUT_DIR": "./output/ceo-and-board",
        "OPENROUTER_TIMEOUT_MS": "30000",
        "SYNTH_MAX_PER_AGENT_CHARS": "20000",
        "SYNTH_MAX_TOTAL_CHARS": "150000"
      }
    }
  }
}
```

### Environment Variables Reference

#### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `OPENROUTER_API_KEY` | Your OpenRouter API key (required for all AI operations) | `sk-or-v1-...` |

#### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ORCHESTRATOR_MODEL` | `google/gemini-2.5-pro` | Model used for all AI operations. Can be any OpenRouter-supported model (see below) |
| `CLI_AGENTS_JSON` | (none) | JSON array of CLI agent definitions (see CLI Agents section) |
| `AGENT_OUTPUT_DIR` | `./output/agents` | Directory for orchestrator tool outputs |
| `EXECUTION_STYLE` | `auto` | Execution style: `auto` (model decides), `sequential`, or `parallel` |
| `FINANCE_EXPERTS_OUTPUT_DIR` | `./output/finance-experts` | Directory for financial expert analysis outputs |
| `CEO_BOARD_OUTPUT_DIR` | `./output/ceo-and-board` | Directory for board simulation outputs |
| `OPENROUTER_TIMEOUT_MS` | `30000` | Timeout for OpenRouter API calls (milliseconds) |
| `SYNTH_MAX_PER_AGENT_CHARS` | `20000` | Max characters per agent in synthesis |
| `SYNTH_MAX_TOTAL_CHARS` | `150000` | Max total characters in synthesis |

### Orchestrator Model Options

The `ORCHESTRATOR_MODEL` can be any model supported by OpenRouter. Popular options:

**Google Models:**
- `google/gemini-2.5-pro` (default, recommended for best quality)
- `google/gemini-2.0-flash-exp` (faster, cheaper, good for testing)
- `google/gemini-1.5-pro` (alternative)
- `google/gemini-1.5-flash` (fastest, cheapest)

**Anthropic Models:**
- `anthropic/claude-3.5-sonnet` (high quality alternative)
- `anthropic/claude-3-opus` (premium quality)
- `anthropic/claude-3-haiku` (fast, cost-effective)

**OpenAI Models:**
- `openai/gpt-4-turbo` (alternative)
- `openai/gpt-4` (alternative)
- `openai/gpt-3.5-turbo` (budget option)

**Other Providers:**
- `meta-llama/llama-3.1-405b-instruct` (open source)
- `mistralai/mixtral-8x7b-instruct` (open source)

See [ORCHESTRATOR_MODEL_CONFIG.md](ORCHESTRATOR_MODEL_CONFIG.md) for complete details and testing guidance.

### CLI Agents Configuration

Configure CLI agents for the `orchestrate_agents` tool in two ways:

#### Option A: Using CLI_AGENTS_JSON (Recommended)

Set the `CLI_AGENTS_JSON` environment variable as a JSON array:

```json
[
  {"name": "Qwen", "cmd": "qwen -y \"{prompt}\""},
  {"name": "Gemini", "cmd": "gemini -y \"{prompt}\""},
  {"name": "Cursor", "cmd": "cursor agent --print --approve-mcps \"{prompt}\""},
  {"name": "Goose", "cmd": "echo \"{prompt}\" | goose"},
  {"name": "Opencode", "cmd": "opencode run \"{prompt}\""},
  {"name": "Crush", "cmd": "crush run \"{prompt}\""}
]
```

**Important:** Escape quotes properly in JSON:
- Use `\"` for double quotes inside strings
- Use `\\\"` for quotes inside command strings

#### Option B: Using llms.txt (Fallback)

If `CLI_AGENTS_JSON` is not set, the server reads `llms.txt` from the current working directory:

```
- Qwen
```bash
qwen -y "{prompt}"
```

- Gemini
```bash
gemini -y "{prompt}"
```

- Cursor
```bash
cursor agent --print --approve-mcps "{prompt}"
```
```

### Output Directories

All output directories are relative to the server's current working directory (typically your project root). The server will create these directories automatically if they don't exist.

**Default Structure:**
```
your-project/
├── output/
│   ├── agents/              # Orchestrator tool outputs
│   ├── finance-experts/     # Financial expert analyses
│   │   └── expert_outputs_*/  # Individual expert files
│   └── ceo-and-board/       # Board simulation outputs
```

### Configuration Examples

#### Minimal Configuration (Finance Experts Only)

```json
{
  "mcpServers": {
    "giizhendam-mcp": {
      "command": "npx",
      "args": ["-y", "@nbiish/giizhendam-aabajichiganan-mcp"],
      "env": {
        "OPENROUTER_API_KEY": "your-key-here"
      }
    }
  }
}
```

#### With Custom Model

```json
{
  "mcpServers": {
    "giizhendam-mcp": {
      "command": "npx",
      "args": ["-y", "@nbiish/giizhendam-aabajichiganan-mcp"],
      "env": {
        "OPENROUTER_API_KEY": "your-key-here",
        "ORCHESTRATOR_MODEL": "anthropic/claude-3.5-sonnet"
      }
    }
  }
}
```

#### With CLI Agents

```json
{
  "mcpServers": {
    "giizhendam-mcp": {
      "command": "npx",
      "args": ["-y", "@nbiish/giizhendam-aabajichiganan-mcp"],
      "env": {
        "OPENROUTER_API_KEY": "your-key-here",
        "CLI_AGENTS_JSON": "[{\"name\":\"Qwen\",\"cmd\":\"qwen -y \\\"{prompt}\\\"\"}]"
      }
    }
  }
}
```

### Important Notes

⚠️ **Security:**
- Never commit your `mcp.json` file with real API keys to version control
- Use environment variables or secret management tools in production
- The `GEMINI_API_KEY` environment variable is **no longer used** (removed in v0.6.0)

⚠️ **Breaking Changes (v0.6.0):**
- Removed `GEMINI_API_KEY` requirement - all operations now use OpenRouter
- Removed `@google/generative-ai` dependency
- All AI calls now go through OpenRouter with the orchestrator model

### Troubleshooting Configuration

**Issue: "OPENROUTER_API_KEY is not set"**
- Solution: Ensure `OPENROUTER_API_KEY` is set in the `env` section of your `mcp.json`

**Issue: "Model not found"**
- Solution: Verify the model name matches OpenRouter's format exactly (e.g., `google/gemini-2.5-pro`)

**Issue: "No CLI agents configured"**
- Solution: Set `CLI_AGENTS_JSON` or create `llms.txt` in your project directory

**Issue: Output directories not created**
- Solution: Ensure the server has write permissions in the current working directory

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

Orchestrates 18 financial expert agents individually, then uses the orchestrator model with File Search RAG to consolidate all perspectives into enterprise-ready analysis:

```typescript
╭──────────────────────────────────────────────────────────────────────╮
│  ᐴ ZHOONIYAAWICHIGEWIN ᔔ [ FINANCIAL EXPERTISE ]                     │
╰──────────────────────────────────────────────────────────────────────╯

const result = await server.execute("finance_experts", {
  topic: "Funding strategy for our new AI product line",
  output_filename: "ai_product_funding_analysis"  // Optional: custom filename
});

// Process:
// 1. Each of 18 experts provides analysis (900 tokens each)
// 2. Individual expert files saved to expert_outputs_[timestamp]/
// 3. Orchestrator model consolidates all outputs using File Search RAG
// 4. Results saved to ./finance-experts/ai_product_funding_analysis_[timestamp].md
//    - Includes all individual expert perspectives
//    - Includes consolidated RAG-based analysis
//    - Includes recommended orchestrator prompt for CLI tools
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
  - Set `OPENROUTER_API_KEY` in your MCP config env or shell (required).
  - Optionally set `ORCHESTRATOR_MODEL` to test different models (defaults to `google/gemini-2.5-pro`).
  - Optionally set `CLI_AGENTS_JSON` or populate `llms.txt` for orchestrator tool.
  - Ensure agent CLIs (qwen, gemini, cursor, goose, opencode, crush) are installed and in PATH.
- **Install and Test**
  - Test via npx: `npx -y @nbiish/giizhendam-aabajichiganan-mcp`
  - Or install globally: `npm install -g @nbiish/giizhendam-aabajichiganan-mcp`
  - Launch via your MCP client using the `mcp.json` example above.
- **Invoke tools**
  - **Orchestrator**: Call `orchestrate_agents` with a short `prompt_text`.
    - Expected: Server selects `parallel` or `sequential`, executes agents, writes per-agent files under `AGENT_OUTPUT_DIR`, and creates a synthesis markdown file.
  - **Finance Experts**: Call `finance_experts` with a financial topic.
    - Expected: 18 expert analyses (900 tokens each) saved individually, then consolidated via RAG into enterprise-ready analysis.
  - **Board Simulation**: Call `ceo_and_board` with a discussion topic.
    - Expected: Realistic board meeting transcript and recommended orchestrator prompt.
- **Verify outputs**
  - Confirm files exist in configured output directories and review reports.
  - Adjust `EXECUTION_STYLE` to `sequential` or `parallel` to force behavior.
  - Test different `ORCHESTRATOR_MODEL` values to compare outputs.
- **Troubleshoot**
  - If timeouts occur, tune `OPENROUTER_TIMEOUT_MS`, `SYNTH_MAX_PER_AGENT_CHARS`, `SYNTH_MAX_TOTAL_CHARS`.
  - Ensure each agent's command runs successfully from your shell with a sample prompt.
  - Check OpenRouter dashboard for API usage and rate limits.

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

## Terms of Service

The authoritative Terms of Service for this codebase MUST always be synchronized with:

- <https://raw.githubusercontent.com/nbiish/license-for-all-works/refs/heads/main/Terms-of-Service.md>

## Privacy Policy

The authoritative Privacy Policy for this codebase MUST always be synchronized with:

- <https://raw.githubusercontent.com/nbiish/license-for-all-works/refs/heads/main/Privacy-Policy.md>

Copyright © 2025 ᓂᐲᔥ ᐙᐸᓂᒥᑮ-ᑭᓇᐙᐸᑭᓯ (Nbiish Waabanimikii-Kinawaabakizi), also known legally as JUSTIN PAUL KENWABIKISE, professionally documented as Nbiish-Justin Paul Kenwabikise, Anishinaabek Dodem (Anishinaabe Clan): Animikii (Thunder), a descendant of Chief ᑭᓇᐙᐸᑭᓯ (Kinwaabakizi) of the Beaver Island Band, and an enrolled member of the sovereign Grand Traverse Band of Ottawa and Chippewa Indians. This work embodies Traditional Knowledge and Traditional Cultural Expressions. All rights reserved.

## Release Notes

### v0.6.0 (Current)
- **Major Refactor**: Unified orchestrator model configuration via OpenRouter
- Removed direct Gemini API dependency (`@google/generative-ai`)
- All AI operations now use single configurable `ORCHESTRATOR_MODEL` (default: `google/gemini-2.5-pro`)
- Enhanced `finance_experts` tool: 18 expert agents, 900-token limits, RAG consolidation
- Supports any OpenRouter-supported model (Gemini, Claude, GPT-4, etc.)
- Updated MCP configuration to use `npx -y` format for easier installation
- Added comprehensive orchestrator model configuration documentation

### v0.5.3
- Added 18 financial expert agents with dynamic prompt loading from markdown files
- Enhanced expert prompts with detailed research and methodologies

### v0.3.34
- Fixed shebang line in the bundled output file to ensure proper execution via npx
- Resolved "Client closed" errors when running via MCP