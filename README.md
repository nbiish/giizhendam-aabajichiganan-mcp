# Giizhendam Aabajichiganan MCP Server

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

## Overview

This project implements a Model Context Protocol (MCP) server that provides various AI-powered tools for developers and decision-makers. It serves as a bridge between different AI models and provides specialized tools for code assistance, financial analysis, and collaborative decision simulation.

The server includes direct interfaces to the aider CLI for AI pair programming and the Gemini API for specialized simulations, all within a secure TypeScript implementation.

## Features

- **AI-assisted Programming**
  - Direct interface to aider CLI for code assistance
  - Support for dual-model architecture ("architect" mode)
  - Redundant computation capabilities for verification
  
- **Financial Expert Simulation**
  - Simulates deliberation between 7 financial expert personas
  - Generates analysis from different financial perspectives
  - Includes perspectives from Graham, Ackman, Wood, Munger, Burry, Lynch, and Fisher
  
- **CEO & Board Meeting Simulation**
  - Simulates realistic board discussions on specified topics
  - Customizable roles and discussion parameters
  - Useful for planning and decision-making exercises
  
- **Security & Reliability**
  - Built-in security checks for file operations and URL validation
  - Comprehensive error handling and logging
  - Secure API key management

## Prerequisites

- Node.js (v14 or higher) and npm/yarn
- Aider CLI installed and accessible in PATH
- API keys for required services
- Git (for aider functionality)

## Installation

```bash
# Clone repository
git clone https://github.com/yourusername/giizhendam-aabajichiganan-mcp.git
cd giizhendam-aabajichiganan-mcp

# Install dependencies
npm install

# Build project
npm run build
```

## Configuration

Set the following environment variables:

```bash
# Required for aider tools
export AIDER_MODEL="your-model-name"  # e.g., "gpt-4o" or other model supported by aider

# Optional for architect mode
export AIDER_EDITOR_MODEL="your-editor-model-name"  # e.g., "gpt-4o"

# Required for financial expert and board simulations
export GEMINI_API_KEY="your-gemini-api-key"

# Optional: Configure output directories for simulations
export FINANCE_EXPERTS_OUTPUT_DIR="/path/to/finance-experts-output"  # Default: ./financial-experts
export CEO_BOARD_OUTPUT_DIR="/path/to/ceo-board-output"  # Default: ./ceo-and-board
```

You can also configure these in your mcp.json file:

```json
"giizhendam-aabajichiganan-mcp": {
  "command": "node",
  "args": [
    "path/to/giizhendam-aabajichiganan-mcp/dist/index.js"
  ],
  "env": {
    "AIDER_MODEL": "your-model-name",
    "AIDER_EDITOR_MODEL": "your-editor-model-name",
    "GEMINI_API_KEY": "your-gemini-api-key",
    "FINANCE_EXPERTS_OUTPUT_DIR": "/path/to/finance-experts-output",
    "CEO_BOARD_OUTPUT_DIR": "/path/to/ceo-board-output"
  }
}
```

## Usage

### Aider Code Assistance

Use the `prompt_aider` tool to interact with the aider CLI:

```typescript
// Example using prompt_aider
const result = await server.execute("prompt_aider", {
  prompt_text: "Create a React component that displays a counter with increment and decrement buttons",
  files: ["src/components/Counter.tsx"]  // Optional: specific files to consider
});

// Optional: specify task type
const result = await server.execute("prompt_aider", {
  prompt_text: "Analyze this code for security vulnerabilities",
  task_type: "security",
  files: ["src/auth.ts"]
});
```

### Double Computation

For tasks requiring verification through redundant computation:

```typescript
const result = await server.execute("double_compute", {
  prompt_text: "Calculate the optimal path for this algorithm and explain your reasoning",
  files: ["src/algorithms/pathfinder.ts"]
});

// Check results from both runs in result._meta.run1 and result._meta.run2
```

### Financial Expert Simulation

Simulate a financial analysis from multiple expert perspectives:

```typescript
const result = await server.execute("finance_experts", {
  topic: "Funding strategy for our new AI product line",
  output_filename: "ai_product_funding_analysis"  // Optional: custom filename
});

// Results saved to ./financial-experts/ai_product_funding_analysis_[timestamp].md
```

### Board Meeting Simulation

Simulate a board discussion on a specific topic:

```typescript
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

## Tool Reference

### prompt_aider

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| prompt_text | string | The main prompt/instruction for aider | Yes |
| task_type | string | Optional task type hint (research, docs, security, code, verify, progress) | No |
| files | string[] | Optional list of files for aider to consider or modify | No |

### double_compute

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| prompt_text | string | The main prompt/instruction for aider | Yes |
| files | string[] | Optional list of files for aider to consider or modify | No |

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

Copyright © 2025 ᓂᐲᔥ ᐙᐸᓂᒥᑮ-ᑭᓇᐙᐸᑭᓯ (Nbiish Waabanimikii-Kinawaabakizi), also known legally as JUSTIN PAUL KENWABIKISE, professionally documented as Nbiish-Justin Paul Kenwabikise, Anishinaabek Dodem (Anishinaabe Clan): Animikii (Thunder), a descendant of Chief ᑭᓇᐙᐸᑭᓯ (Kinwaabakizi) of the Beaver Island Band, and an enrolled member of the sovereign Grand Traverse Band of Ottawa and Chippewa Indians. This work embodies Traditional Knowledge and Traditional Cultural Expressions. All rights reserved. 