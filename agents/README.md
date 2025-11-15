# Financial Agents Directory

This directory contains comprehensive agent prompts for 18 financial and investment experts/agents. Each agent has a detailed prompt file (~444 tokens) that captures their investment philosophy, methodology, and analysis style.

## Agent List

### Value Investors
1. **Benjamin Graham** (`benjamin-graham.md`) - The godfather of value investing, focuses on margin of safety and hidden gems
2. **Warren Buffett** (`warren-buffett.md`) - Seeks wonderful companies at fair prices, long-term compounding
3. **Charlie Munger** (`charlie-munger.md`) - Wonderful businesses at fair prices, multidisciplinary thinking
4. **Michael Burry** (`michael-burry.md`) - Deep value contrarian, hunts for misunderstood opportunities
5. **Mohnish Pabrai** (`mohnish-pabrai.md`) - Dhandho investor, seeks doubles at low risk

### Growth Investors
6. **Cathie Wood** (`cathie-wood.md`) - Innovation and disruption investing, exponential growth focus
7. **Peter Lynch** (`peter-lynch.md`) - Practical investor seeking ten-baggers in everyday businesses
8. **Philip Fisher** (`phil-fisher.md`) - Meticulous growth investor using scuttlebutt research

### Activist & Specialized Investors
9. **Bill Ackman** (`bill-ackman.md`) - Activist investor taking bold positions and pushing for change
10. **Stanley Druckenmiller** (`stanley-druckenmiller.md`) - Macro legend hunting asymmetric opportunities
11. **Rakesh Jhunjhunwala** (`rakesh-jhunjhunwala.md`) - The Big Bull of India, long-term value creation

### Valuation & Analysis
12. **Aswath Damodaran** (`aswath-damodaran.md`) - The Dean of Valuation, story-numbers-valuation framework

### Functional Agents
13. **Valuation Agent** (`valuation-agent.md`) - Calculates intrinsic value and generates trading signals
14. **Sentiment Agent** (`sentiment-agent.md`) - Analyzes market sentiment and generates trading signals
15. **Fundamentals Agent** (`fundamentals-agent.md`) - Analyzes fundamental data and generates trading signals
16. **Technicals Agent** (`technicals-agent.md`) - Analyzes technical indicators and generates trading signals
17. **Risk Manager** (`risk-manager.md`) - Calculates risk metrics and sets position limits
18. **Portfolio Manager** (`portfolio-manager.md`) - Makes final trading decisions and generates orders

## Usage

These agent prompts are automatically loaded by the MCP server when the `finance_experts` tool is invoked. The prompts are read from the markdown files in this directory and used to simulate expert deliberation on financial topics.

## Prompt Structure

Each agent prompt file follows this structure:
- **Header**: Agent name and role
- **Core Philosophy**: Fundamental beliefs and approach
- **Key Principles**: 5-7 core principles
- **Investment Approach**: Methods, metrics, red flags
- **Analysis Style**: How the agent analyzes investments
- **Final Instruction**: Template for topic analysis with `{topic}` placeholder

## File Naming Convention

Files use kebab-case (e.g., `aswath-damodaran.md`) and are mapped to display names in the code (e.g., `Damodaran`). See `AGENT_FILE_MAP` in `src/index.ts` for the complete mapping.

## Adding New Agents

To add a new agent:
1. Create a new markdown file in this directory following the existing structure
2. Add the file name mapping to `AGENT_FILE_MAP` in `src/index.ts`
3. Ensure the prompt ends with: `Analyze the following query/topic... {topic}`
4. Rebuild the project: `npm run build`

## Token Count

Each prompt is designed to be approximately 444 tokens, providing comprehensive context while remaining efficient for LLM processing.

