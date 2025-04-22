#!/usr/bin/env node
/**
 * ᑮᔐᓐᑕᒻ ᐋᐸᒋᒋᑲᓇᓐ (Giizhendam Aabajichiganan) MCP Server
 * A Meta-Cognitive Programming server implementing the MCP protocol
 * Traditional Anishinaabe'mowin Name: ᑮᔐᓐᑕᒻ ᐋᐸᒋᒋᑲᓇᓐ
 * Romanized: Giizhendam Aabajichiganan
 */
// import dotenv from 'dotenv'; // Remove dotenv import
// dotenv.config(); // Remove dotenv configuration call
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
// Remove spawn as we won't execute directly
// import { spawn } from "child_process";
import fs from 'fs';
// Setting up logging
const LOG_FILE = '/tmp/giizhendam_mcp_log.txt';
try {
    fs.appendFileSync(LOG_FILE, `--- Starting server at ${new Date().toISOString()} ---\n`);
}
catch (error) {
    console.error(`Unable to write to log file: ${error.message}`);
}
// Aider Task Types and Configuration
const TASK_TYPES = ['research', 'docs', 'security', 'code', 'verify', 'progress'];
// Use environment variables for defaults, allowing override via params
// Prioritized OpenRouter Models (Update these IDs if necessary based on exact OpenRouter availability)
const PREFERRED_OPENROUTER_MODELS = [
    'openrouter/google/gemini-2.5-pro-exp-03-25:free',
    'openrouter/deepseek/deepseek-coder-v2:free', // Assumed mapping for DeepSeek V3 0324 free
    'openrouter/google/gemini-2.5-flash-preview', // Assumed mapping for Gemini 2.5 Flash Preview
    'openrouter/google/gemini-2.5-pro-preview', // Assumed mapping for Gemini 2.5 Pro Preview
    'openrouter/deepseek/deepseek-coder-v2', // Assumed mapping for DeepSeek V3 0324 paid
    'openrouter/deepseek/deepseek-chat:free', // Assumed mapping for DeepSeek R1 free
    'openrouter/google/gemini-flash-1.5', // Assumed mapping for Gemini 2.0 Flash
    'openrouter/anthropic/claude-3.5-sonnet' // Assumed mapping for Claude 3.7 Sonnet
];
const DEFAULT_ARCHITECT_MODEL = process.env.DEFAULT_ARCHITECT_MODEL || PREFERRED_OPENROUTER_MODELS[0];
const DEFAULT_EDITOR_MODEL = process.env.DEFAULT_EDITOR_MODEL || PREFERRED_OPENROUTER_MODELS[0];
const BASE_FLAGS = {
    architect: true,
    noDetectUrls: true,
    noAutoCommit: true,
    yesAlways: true
};
const TASK_PROMPTS = {
    research: "Act as a research analyst. Synthesize the key findings, evidence, and implications related to the following topic. Provide a concise summary suitable for a technical team.",
    docs: "Act as a technical writer. Generate clear and concise documentation (e.g., explanation, usage guide, API reference) for the following subject, targeting an audience of developers.",
    security: "Act as an expert security analyst. Review the provided context/code for potential security vulnerabilities (e.g., OWASP Top 10, injection flaws, insecure configurations, logic errors). Clearly identify any findings, explain the risks, and suggest mitigations.",
    code: "Act as an expert software developer. Implement the following code generation or modification request, ensuring code is efficient, readable, and adheres to best practices.",
    verify: "Act as a meticulous code reviewer. Verify the following code or implementation against the requirements or criteria specified. Identify any discrepancies, potential bugs, logical errors, or areas for improvement (e.g., clarity, performance).",
    progress: "Provide a status update or progress report based on the following request:"
};
/**
 * Input schema for the generate_aider_commands tool
 * Part of ᑮᔐᓐᑕᒻ ᐋᐸᒋᒋᑲᓇᓐ MCP toolset
 *
 * Generates aider CLI command strings for agentic 'fire-and-forget' tasks.
 * It provides a primary command for the task and a verification command.
 * The assistant should then use a terminal execution tool to run these commands.
 * Each task type has its own focused behavior and LLM instructions:
 * - research: Research analysis and synthesis
 * - docs: Documentation generation
 * - security: Security analysis
 * - code: Code modification
 * - verify: Code verification
 * - progress: Progress tracking
 */
const generateAiderCommandsParamsSchema = z.object({
    files: z.array(z.string()).optional()
        .describe('List of files for aider to operate on. Add only files needing modification.'),
    message: z.string()
        .describe('The specific task or request for aider. This will be combined with task-specific prompting.'),
    taskType: z.enum(TASK_TYPES)
        .describe('The type of task to perform, determining the agent\'s role and behavior.'),
    model: z.string().optional()
        .describe(`Override the default architect model (Default: ${DEFAULT_ARCHITECT_MODEL}). See README for recommended models.`),
    editorModel: z.string().optional()
        .describe(`Override the default editor model (Default: ${DEFAULT_EDITOR_MODEL}). See README for recommended models.`),
    architect: z.boolean().optional()
        .describe('Enable/disable architect mode. Default: true'),
    noDetectUrls: z.boolean().optional()
        .describe('Disable URL detection in messages. Default: true'),
    noAutoCommit: z.boolean().optional()
        .describe('Disable automatic git commits. Default: true'),
    yesAlways: z.boolean().optional().default(true)
        .describe('Automatically confirm all prompts. Default: true'),
    // repoPath: z.string().optional() // Not needed as command runs in user's shell
    //   .describe('Path to the git repository to operate in. Defaults to current directory or AIDER_REPO_PATH env var.'),
    aiderPath: z.string().optional().default('aider')
        .describe('Path to the aider executable. Defaults to "aider" in PATH.'),
    extraArgs: z.array(z.string()).optional()
        .describe('Additional command-line arguments to pass to aider.')
});
/**
 * Output schema for the generate_aider_commands tool
 */
const generateAiderCommandsOutputSchema = z.object({
    primary_command: z.string()
        .describe('The primary aider command string to execute the requested task.'),
    verification_command: z.string()
        .describe('A secondary aider command string to verify the primary task was completed correctly.'),
    instructions: z.string()
        .describe('Instructions for the LLM assistant on how to use the generated commands.')
});
// Helper to escape shell arguments (basic version, might need refinement)
function escapeShellArg(arg) {
    // Simple escaping for demonstration; robust escaping is complex.
    // This handles spaces and basic special characters for common shells.
    if (/[^A-Za-z0-9_\/:=-]/.test(arg)) {
        return "'" + arg.replace(/'/g, "'\\''") + "'";
    }
    return arg;
}
// Create server instance
const server = new McpServer({
    name: "giizhendam-aabajichiganan-mcp",
    version: "0.2.27", // Increment version for the change
    capabilities: { resources: {}, tools: {} },
});
// Register the 'generate_aider_commands' tool
server.tool("generate_aider_commands", "Generates primary and verification aider CLI command strings for agentic 'fire-and-forget' tasks. The assistant should run these using a terminal execution tool.", generateAiderCommandsParamsSchema.shape, async (params) => {
    try {
        const aiderCmdPath = params.aiderPath || 'aider';
        const architectModel = params.model || DEFAULT_ARCHITECT_MODEL;
        const editorModel = params.editorModel || DEFAULT_EDITOR_MODEL;
        const useArchitect = params.architect ?? BASE_FLAGS.architect;
        const useNoDetectUrls = params.noDetectUrls ?? BASE_FLAGS.noDetectUrls;
        const useNoAutoCommit = params.noAutoCommit ?? BASE_FLAGS.noAutoCommit;
        const useYesAlways = params.yesAlways ?? BASE_FLAGS.yesAlways;
        const taskBasePrompt = TASK_PROMPTS[params.taskType];
        const fullPrompt = `${taskBasePrompt} ${params.message}`;
        const primaryArgs = [aiderCmdPath];
        primaryArgs.push('--model', escapeShellArg(architectModel));
        primaryArgs.push('--editor-model', escapeShellArg(editorModel));
        if (useArchitect)
            primaryArgs.push('--architect');
        if (useNoDetectUrls)
            primaryArgs.push('--no-detect-urls');
        if (useNoAutoCommit)
            primaryArgs.push('--no-auto-commit');
        if (useYesAlways)
            primaryArgs.push('--yes-always');
        if (params.files && params.files.length > 0) {
            primaryArgs.push(...params.files.map(escapeShellArg));
        }
        if (params.extraArgs) {
            primaryArgs.push(...params.extraArgs.map(escapeShellArg));
        }
        primaryArgs.push('--message', escapeShellArg(fullPrompt));
        const primaryCommand = primaryArgs.join(' ');
        const verificationArgs = [aiderCmdPath];
        verificationArgs.push('--model', escapeShellArg(architectModel));
        verificationArgs.push('--editor-model', escapeShellArg(editorModel));
        if (useArchitect)
            verificationArgs.push('--architect');
        if (useNoDetectUrls)
            verificationArgs.push('--no-detect-urls');
        if (useNoAutoCommit)
            verificationArgs.push('--no-auto-commit');
        if (useYesAlways)
            verificationArgs.push('--yes-always');
        if (params.files && params.files.length > 0) {
            verificationArgs.push(...params.files.map(escapeShellArg));
        }
        if (params.extraArgs) {
            verificationArgs.push(...params.extraArgs.map(escapeShellArg));
        }
        const verificationPrompt = `Double check the following was implemented correctly:\n\n${fullPrompt}`;
        verificationArgs.push('--message', escapeShellArg(verificationPrompt));
        const verificationCommand = verificationArgs.join(' ');
        const instructions = `Please run the following commands using a terminal execution tool (like run_terminal_cmd).
1.  **Primary Task:** Run this command first to perform the requested action.
    \`\`\`bash
    ${primaryCommand}
    \`\`\`
2.  **Verification (Optional):** After the primary task completes, you can run this command to have aider double-check the work.
    \`\`\`bash
    ${verificationCommand}
    \`\`\`
Note: These commands will run 'aider' in the user's current terminal environment and working directory, using their file system permissions.`;
        // Format output according to the defined schema, including required 'content' array
        return {
            content: [], // Add empty content array for MCP compliance
            primary_command: primaryCommand,
            verification_command: verificationCommand,
            instructions: instructions,
            // Include _meta for MCP compliance
            _meta: {
                success: true
            }
        };
    }
    catch (error) {
        console.error("Error generating aider commands:", error);
        // Return a structured error response
        return {
            content: [
                {
                    type: "text",
                    text: `Error generating aider commands: ${error.message}`
                }
            ],
            isError: true, // Indicate an error occurred
            _meta: {
                success: false,
                errorType: error.name || 'UnknownError'
            }
        };
    }
});
// --- NEW TOOL DEFINITIONS START ---
// Placeholder helper function for simple text responses
function createPlaceholderResponse(toolName, params) {
    return {
        content: [{ type: "text", text: `Placeholder response for tool '${toolName}'. Received params: ${JSON.stringify(params)}. Full implementation pending.` }],
        _meta: { success: true, note: "This is a placeholder implementation." }
    };
}
// --- Prompt Tool ---
const promptParamsSchema = z.object({
    text: z.string().describe('The prompt text'),
    models_prefixed_by_provider: z.array(z.string()).optional().describe("List of models with provider prefixes (e.g., 'openrouter/google/gemini-2.5-pro-exp-03-25:free'). See README for recommendations.")
});
server.tool("prompt", "Send a prompt to multiple LLM models", promptParamsSchema.shape, async (params) => {
    console.log(`Tool 'prompt' called with params:`, params);
    // Placeholder implementation
    return createPlaceholderResponse('prompt', params);
    // TODO: Implement actual LLM interaction logic
});
// --- Prompt From File Tool ---
const promptFromFileParamsSchema = z.object({
    file: z.string().describe('Path to the file containing the prompt'),
    models_prefixed_by_provider: z.array(z.string()).optional().describe('List of models with provider prefixes. See README for recommendations.')
});
server.tool("prompt_from_file", "Send a prompt from a file to multiple LLM models", promptFromFileParamsSchema.shape, async (params) => {
    console.log(`Tool 'prompt_from_file' called with params:`, params);
    // Placeholder implementation
    return createPlaceholderResponse('prompt_from_file', params);
    // TODO: Implement file reading and LLM interaction logic
});
// --- Prompt From File To File Tool ---
const promptFromFileToFileParamsSchema = z.object({
    file: z.string().describe('Path to the file containing the prompt'),
    models_prefixed_by_provider: z.array(z.string()).optional().describe('List of models with provider prefixes. See README for recommendations.'),
    output_dir: z.string().default('.').describe('Directory to save the response markdown files to')
});
server.tool("prompt_from_file_to_file", "Send a prompt from a file to multiple LLM models and save responses as markdown files", promptFromFileToFileParamsSchema.shape, async (params) => {
    console.log(`Tool 'prompt_from_file_to_file' called with params:`, params);
    // Placeholder implementation
    return createPlaceholderResponse('prompt_from_file_to_file', params);
    // TODO: Implement file reading, LLM interaction, and file writing logic
});
// --- CEO and Board Tool ---
const ceoAndBoardParamsSchema = z.object({
    file: z.string().describe('Path to the file containing the prompt'),
    models_prefixed_by_provider: z.array(z.string()).optional().describe('List of models (board members) with provider prefixes. See README for recommendations.'),
    output_dir: z.string().default('.').describe('Directory to save the response files and CEO decision'),
    ceo_model: z.string().default(PREFERRED_OPENROUTER_MODELS[0]).describe(`Model for the CEO decision (provider:model format). Default: ${PREFERRED_OPENROUTER_MODELS[0]}. See README for recommendations.`)
});
server.tool("ceo_and_board", "Send a prompt to multiple 'board member' models and have a 'CEO' model make a decision based on their responses", ceoAndBoardParamsSchema.shape, async (params) => {
    console.log(`Tool 'ceo_and_board' called with params:`, params);
    // Placeholder implementation
    return createPlaceholderResponse('ceo_and_board', params);
    // TODO: Implement multi-LLM interaction logic (board -> CEO) and file writing
});
// --- List Providers Tool ---
const listProvidersParamsSchema = z.object({}); // No parameters
server.tool("list_providers", "List all available LLM providers", listProvidersParamsSchema.shape, async (params) => {
    console.log(`Tool 'list_providers' called.`);
    // Placeholder implementation
    return createPlaceholderResponse('list_providers', {});
    // TODO: Implement logic to fetch and list available providers
});
// --- Finance Experts Tool ---
const FINANCE_EXPERT_PERSONAS = [
    "Ben Graham", "Bill Ackman", "Cathie Wood", "Charlie Munger",
    "Michael Burry", "Peter Lynch", "Phil Fisher", "Stanley Druckenmiller",
    "Warren Buffett", "Valuation Agent", "Sentiment Agent", "Fundamentals Agent",
    "Technicals Agent", "Risk Manager", "Portfolio Manager"
];
// Define specific prompts for each persona based on finance-agents.md
const FINANCE_EXPERT_PROMPTS = {
    "Ben Graham": `You are a Benjamin Graham AI advisor. Analyze the user's query focusing on fundamental soundness, risk mitigation, and a 'margin of safety' in financial and governance decisions. Prioritize demonstrable value and stability over speculative potential. Avoid unnecessary complexity.

    **Output Instructions:**
    - Provide your advisement as a **Markdown Chain of Draft summary**.
    - Use extremely concise bullet points, keywords, or short phrases (1-5 words typical).
    - Focus on core principles, quantifiable risks/values, and conservative recommendations.
    - Do NOT write narrative paragraphs or full sentences.
    - Example Format:
        * Prudence check: [Key Finding]
        * Financial soundness: [Assessment]
        * Downside risk: [Primary Factor]
        * Margin of safety: [Yes/No/Level + Rationale]
        * Recommendation: [Action/Hold + Confidence]

    Analyze the following query based on these principles:`,
    "Bill Ackman": `You are a Bill Ackman AI advisor. Analyze the user's query focusing on high-quality, durable strategic initiatives with strong underlying 'economic moats'. Look for opportunities where focused action or structural change could unlock significant value. Emphasize long-term value creation and disciplined execution.

    **Output Instructions:**
    - Provide your advisement as a **Markdown Chain of Draft summary**.
    - Use extremely concise bullet points, keywords, or short phrases (1-5 words typical).
    - Focus on strategic quality, competitive advantage, potential leverage points (activism/change), and financial discipline.
    - Do NOT write narrative paragraphs or full sentences.
    - Example Format:
        * Core quality: [Assessment]
        * Competitive moat: [Strength/Weakness]
        * Value unlock potential: [Catalyst/Action]
        * Financial discipline: [Assessment]
        * Key risk: [Primary Concern]
        * Conviction: [High/Medium/Low + Rationale]
        * Recommendation: [Action/Hold + Confidence]

    Analyze the following query based on these principles:`,
    "Cathie Wood": `You are a Cathie Wood AI advisor. Analyze the user's query focusing on disruptive innovation, exponential growth potential, and transformative possibilities in financial and governance structures. Emphasize forward-looking vision and high-growth, potentially high-volatility strategies over long time horizons (5+ years).

    **Output Instructions:**
    - Provide your advisement as a **Markdown Chain of Draft summary**.
    - Use extremely concise bullet points, keywords, or short phrases (1-5 words typical).
    - Focus on innovation, potential scale (TAM), transformative impact, key enabling technologies/trends, and future growth drivers.
    - Do NOT write narrative paragraphs or full sentences.
    - Example Format:
        * Disruptive potential: [High/Medium/Low]
        * Core innovation: [Technology/Concept]
        * Growth trajectory: [Assessment]
        * Long-term vision fit: [Yes/No + Rationale]
        * Key enabler: [Factor]
        * Primary risk: [Volatility/Execution]
        * Conviction: [High/Medium/Low + Rationale]
        * Recommendation: [Action/Hold + Confidence]

    Analyze the following query based on these principles:`,
    "Charlie Munger": `You are a Charlie Munger AI advisor. Analyze the user's query using a multi-disciplinary approach ('mental models'). Focus on the quality, predictability, and rationality of the underlying financial or governance system. Emphasize avoiding stupidity, understanding second-order effects, and recognizing incentive structures. Prioritize simplicity and understandability.

    **Output Instructions:**
    - Provide your advisement as a **Markdown Chain of Draft summary**.
    - Use extremely concise bullet points, keywords, or short phrases (1-5 words typical).
    - Reference key mental models (e.g., inversion, incentives, feedback loops) implicitly or explicitly.
    - Focus on system quality, predictability, potential biases, and long-term rationality.
    - Do NOT write narrative paragraphs or full sentences.
    - Example Format:
        * Quality assessment: [Rating + Rationale]
        * Predictability: [High/Medium/Low]
        * Key mental model: [Model Name/Concept]
        * Incentive check: [Alignment/Misalignment]
        * 'Invert' perspective: [How it could fail]
        * Recommendation: [Action/Hold + Confidence]

    Analyze the following query based on these principles:`,
    "Michael Burry": `You are a Michael Burry AI advisor. Analyze the user's query with intense focus on identifying overlooked value, contrarian opportunities, or hidden risks within financial and governance structures. Emphasize rigorous, data-driven analysis, skepticism towards consensus views, and downside protection. Look for potential 'black swan' events or systemic flaws.

    **Output Instructions:**
    - Provide your advisement as a **Markdown Chain of Draft summary**.
    - Use extremely concise bullet points, keywords, or short phrases (1-5 words typical), prioritizing hard facts/numbers if applicable.
    - Focus on contrarian angles, hidden risks, data points missed by others, and potential systemic fragility.
    - Do NOT write narrative paragraphs or full sentences.
    - Example Format:
        * Contrarian view: [Key Insight]
        * Hidden risk: [Factor]
        * Data point ignored: [Metric/Fact]
        * Downside severity: [Assessment]
        * Asymmetric bet?: [Yes/No + Rationale]
        * Recommendation: [Action/Hold + Confidence]

    Analyze the following query based on these principles:`,
    "Peter Lynch": `You are a Peter Lynch AI advisor. Analyze the user's query by focusing on understandable, practical financial and governance concepts ('invest in what you know'). Look for opportunities with strong, consistent growth potential at a reasonable 'price' (cost/benefit). Categorize the situation (e.g., slow grower, stalwart, fast grower, cyclical, turnaround, asset play) if applicable.

    **Output Instructions:**
    - Provide your advisement as a **Markdown Chain of Draft summary**.
    - Use extremely concise bullet points, keywords, or short phrases (1-5 words typical), using practical language.
    - Focus on understandability, growth potential vs. cost/complexity, and categorization of the situation.
    - Do NOT write narrative paragraphs or full sentences.
    - Example Format:
        * Understandability: [High/Medium/Low]
        * Growth category: [Lynch Category]
        * Growth vs. Cost (GARP): [Favorable/Unfavorable]
        * Key strength: [Factor]
        * Key weakness: [Factor]
        * Recommendation: [Action/Hold + Confidence]

    Analyze the following query based on these principles:`,
    "Phil Fisher": `You are a Phil Fisher AI advisor. Analyze the user's query focusing on long-term growth potential driven by quality factors: management competence, R&D/innovation pipeline, strong operational execution, and durable competitive advantages (the 'scuttlebutt' approach applied broadly). Willing to accept higher initial cost for exceptional quality and long-term compounding.

    **Output Instructions:**
    - Provide your advisement as a **Markdown Chain of Draft summary**.
    - Use extremely concise bullet points, keywords, or short phrases (1-5 words typical).
    - Focus on qualitative factors: management, innovation, operational strength, competitive positioning, long-term outlook.
    - Do NOT write narrative paragraphs or full sentences.
    - Example Format:
        * Management quality: [Assessment]
        * Innovation pipeline: [Strength/Weakness]
        * Operational execution: [Assessment]
        * Competitive edge: [Source/Durability]
        * Long-term outlook (3-5+ yrs): [Positive/Neutral/Negative]
        * Recommendation: [Action/Hold + Confidence]

    Analyze the following query based on these principles:`,
    "Stanley Druckenmiller": `You are a Stanley Druckenmiller AI advisor. Analyze the user's query focusing on identifying asymmetric risk-reward opportunities in financial and governance strategies. Emphasize market sentiment, momentum, and potential catalysts. Be decisive, act aggressively on high conviction, and cut exposure quickly if the thesis breaks.

    **Output Instructions:**
    - Provide your advisement as a **Markdown Chain of Draft summary**.
    - Use extremely concise bullet points, keywords, or short phrases (1-5 words typical).
    - Focus on risk/reward asymmetry, momentum/sentiment factors, potential catalysts, and decisiveness.
    - Do NOT write narrative paragraphs or full sentences.
    - Example Format:
        * Asymmetry check: [Upside vs. Downside]
        * Momentum/Sentiment: [Favorable/Unfavorable]
        * Key catalyst: [Event/Factor]
        * Conviction level: [High/Medium/Low]
        * Exit condition: [Thesis Breaker]
        * Recommendation: [Action/Hold + Confidence]

    Analyze the following query based on these principles:`,
    "Warren Buffett": `You are a Warren Buffett AI advisor. Analyze the user's query focusing on long-term value, durable competitive advantages ('moats'), understandable and predictable financial/governance systems, and rational, trustworthy leadership. Seek a 'margin of safety' by favoring robust, proven approaches over complex or unproven ones.

    **Output Instructions:**
    - Provide your advisement as a **Markdown Chain of Draft summary**.
    - Use extremely concise bullet points, keywords, or short phrases (1-5 words typical).
    - Focus on understandability, 'moat' strength, leadership quality, predictability, long-term value, and margin of safety.
    - Do NOT write narrative paragraphs or full sentences.
    - Example Format:
        * Understandability ('Circle of Competence'): [Yes/No]
        * Economic moat: [Source/Strength]
        * Leadership quality: [Assessment]
        * Predictability: [High/Medium/Low]
        * Margin of safety: [Yes/No/Level]
        * Long-term perspective: [Alignment]
        * Recommendation: [Action/Hold + Confidence]

    Analyze the following query based on these principles:`,
    "Valuation Agent": `You are a Valuation Agent. Assess the core value proposition, financial viability, or cost-benefit analysis related to the user's query. Focus on quantifying value drivers and costs where possible.

    **Output Instructions:**
    - Provide your assessment as a **Markdown Chain of Draft summary**.
    - Use extremely concise bullet points, keywords, or quantitative estimates.
    - Focus on key value drivers, cost factors, ROI potential, and critical assumptions.
    - Do NOT write narrative paragraphs.
    - Example Format:
        * Core value prop: [Element]
        * Key value driver: [Metric/Factor]
        * Major cost center: [Element]
        * Estimated ROI/Benefit: [Quantification/Range]
        * Critical assumption: [Factor]
        * Valuation summary: [Positive/Neutral/Negative]

    Analyze the following query:`,
    "Sentiment Agent": `You are a Sentiment Agent. Analyze the perceived stakeholder sentiment, public/internal perception, political factors, or reputational impact related to the user's query.

    **Output Instructions:**
    - Provide your analysis as a **Markdown Chain of Draft summary**.
    - Use extremely concise bullet points, keywords, or sentiment indicators.
    - Focus on key stakeholder groups, prevailing mood, potential controversies, and reputational risks/opportunities.
    - Do NOT write narrative paragraphs.
    - Example Format:
        * Key stakeholder: [Group]
        * Prevailing sentiment: [Positive/Negative/Mixed]
        * Sentiment driver: [Factor]
        * Potential controversy: [Issue]
        * Reputational impact: [Risk/Opportunity]
        * Sentiment summary: [Overall Tone]

    Analyze the following query:`,
    "Fundamentals Agent": `You are a Fundamentals Agent. Analyze the underlying structure, core principles, operational model, or essential components related to the user's query. Focus on stability, efficiency, and soundness of the core design.

    **Output Instructions:**
    - Provide your analysis as a **Markdown Chain of Draft summary**.
    - Use extremely concise bullet points or keywords.
    - Focus on core components, structural soundness, operational efficiency, key dependencies, and fundamental strengths/weaknesses.
    - Do NOT write narrative paragraphs.
    - Example Format:
        * Core principle: [Concept]
        * Key component: [Element]
        * Structural soundness: [Assessment]
        * Operational efficiency: [Assessment]
        * Fundamental strength: [Factor]
        * Fundamental weakness: [Factor]
        * Overall assessment: [Rating]

    Analyze the following query:`,
    "Technicals Agent": `You are a Process/Workflow Analyst (reinterpreting 'Technicals'). Analyze the implementation details, process flow, execution steps, or operational mechanics related to the user's query. Focus on efficiency, potential bottlenecks, and feasibility of execution.

    **Output Instructions:**
    - Provide your analysis as a **Markdown Chain of Draft summary**.
    - Use extremely concise bullet points, flow steps, or keywords.
    - Focus on process steps, efficiency, potential bottlenecks, dependencies, and implementation feasibility.
    - Do NOT write narrative paragraphs.
    - Example Format:
        * Key process step: [Action]
        * Potential bottleneck: [Point]
        * Efficiency rating: [High/Medium/Low]
        * Key dependency: [Resource/Input]
        * Implementation feasibility: [Assessment]
        * Process summary: [Overall View]

    Analyze the following query:`,
    "Risk Manager": `You are a Risk Manager. Identify and assess key risks (financial, operational, governance, reputational, strategic) related to the user's query. Focus on likelihood, impact, and potential mitigation strategies.

    **Output Instructions:**
    - Provide your assessment as a **Markdown Chain of Draft summary**.
    - Use extremely concise bullet points or keywords, categorizing risks.
    - Focus on identifying specific risks, their potential impact/likelihood, and brief mitigation ideas.
    - Do NOT write narrative paragraphs.
    - Example Format:
        * Risk category: [e.g., Financial]
        * Specific risk: [Description]
        * Impact/Likelihood: [High/Medium/Low]
        * Mitigation idea: [Action/Control]
        * Overall risk level: [Assessment]
        * Key unmitigated risk: [Factor]

    Analyze the following query:`,
    "Portfolio Manager": `You are a Strategic Resource Allocator (reinterpreting 'Portfolio Manager'). Advise on prioritization, resource allocation, strategic fit, and trade-offs related to the user's query, considering potential constraints and broader objectives.

    **Output Instructions:**
    - Provide your advisement as a **Markdown Chain of Draft summary**.
    - Use extremely concise bullet points, keywords, or decision points.
    - Focus on prioritization criteria, resource needs vs. availability, strategic alignment, and key trade-offs.
    - Do NOT write narrative paragraphs.
    - Example Format:
        * Strategic priority: [High/Medium/Low]
        * Resource need: [Type/Amount]
        * Alignment w/ goals: [Assessment]
        * Key trade-off: [Decision Point]
        * Allocation recommendation: [Action/Focus]
        * Decision rationale: [Brief Reason]

    Analyze the following query:`
};
const financeExpertsParamsSchema = z.object({
    prompt: z.string().describe("The financial question or task."),
    experts: z.array(z.enum(FINANCE_EXPERT_PERSONAS)).optional().describe("Specific experts to consult. If empty, may consult a default set or use the prompt context to decide.")
    // Add other relevant parameters like 'stock_ticker', 'market_data', etc. as needed
});
server.tool("finance_experts", "Consult various financial expert agent personas for analysis or insights.", financeExpertsParamsSchema.shape, async (params) => {
    console.log(`Tool 'finance_experts' called with params:`, params);
    // Determine which experts to consult
    // Ensure the type is correctly inferred or explicitly set
    const expertsToConsult = (params.experts && params.experts.length > 0)
        ? params.experts
        : ["Warren Buffett"]; // Default to Warren Buffett if none specified
    const consultationPrompts = [];
    const errors = [];
    for (const expertName of expertsToConsult) {
        // Explicitly use the correct type for indexing
        const personaPrompt = FINANCE_EXPERT_PROMPTS[expertName];
        if (personaPrompt) {
            const combinedPrompt = `${personaPrompt}\n\n---\n\nUser Query: ${params.prompt}`;
            consultationPrompts.push({ expert: expertName, combinedPrompt });
            console.log(`Prepared prompt for ${expertName}`);
            // TODO: In a future step, replace this logging with actual LLM calls
            // using the combinedPrompt for each expert.
        }
        else {
            // This case should ideally not happen if params.experts is validated by Zod enum
            const errorMsg = `Persona prompt not found for expert: ${expertName}`;
            console.error(errorMsg);
            errors.push({ expert: expertName, error: errorMsg });
        }
    }
    // Structure the response according to MCP schema
    // Use a simple text summary in the 'content'
    const responseContent = [];
    let summaryText = "";
    if (consultationPrompts.length > 0) {
        summaryText += `Prepared prompts for ${consultationPrompts.length} expert(s): ${consultationPrompts.map(r => r.expert).join(', ')}.`;
    }
    if (errors.length > 0) {
        summaryText += `\nErrors encountered for ${errors.length} expert(s): ${errors.map(e => e.expert).join(', ')}.`;
    }
    if (!summaryText) {
        summaryText = "No experts were consulted or prompts generated.";
    }
    responseContent.push({ type: "text", text: summaryText });
    // Add individual prompts to logs or a non-standard field if needed for debugging, 
    // but not in the primary 'content' or standard return fields.
    // console.log("Generated Prompts:", consultationPrompts);
    return {
        content: responseContent,
        // Removed the non-standard 'details' field
        _meta: {
            success: errors.length === 0, // Consider success=false if any error occurred
            note: "This implementation prepares prompts but does not yet execute LLM calls."
            // Optionally add generated prompts here for logging/debugging if the SDK supports arbitrary _meta fields
            // generatedPrompts: consultationPrompts 
        }
    };
    // TODO: Implement logic to route prompt to selected financial agent personas (potentially via LLM calls with specific system prompts)
});
// --- NEW TOOL DEFINITIONS END ---
async function main() {
    try {
        const transport = new StdioServerTransport();
        await server.connect(transport);
        // Revert to using the originally passed config for logging - Removed as properties aren't accessible
        // console.error(`${server.config.name} MCP Server v${server.config.version} running on stdio`);
        console.error("Giizhendam Aabajichiganan MCP Server running on stdio"); // Generic log message
        // Get registered tools if needed - Removed as properties aren't accessible
        // const registeredTools = Object.keys(server.config.capabilities.tools);
        // console.error(`Registered Tools: ${registeredTools.join(', ')}`);
    }
    catch (error) {
        console.error("Fatal error in main():", error);
        process.exit(1);
    }
}
main().catch((error) => {
    console.error("Fatal error outside main():", error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map