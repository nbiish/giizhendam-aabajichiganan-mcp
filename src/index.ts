console.error("--- MCP SCRIPT START ---"); // Diagnostic log

/**
 * ᑮᔐᓐᑕᒻ ᐋᐸᒋᒋᑲᓇᓐ (Giizhendam Aabajichiganan) MCP Server v2
 * Interface to aider-cli-commands.sh script based on revised PRD.
 */

// --- START MCP DEBUG LOGGING ---
// Removed initial console.error debug logs for brevity
// --- END MCP DEBUG LOGGING ---

// --- START Initial CWD Logging ---
// Removed duplicate log statement here, initial CWD is logged later if needed
// --- END Initial CWD Logging ---

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { spawn } from "child_process";
import fs from 'fs';
import path from 'path';
import fsPromises from 'fs/promises';
import { GoogleGenerativeAI } from "@google/generative-ai";
import net from 'net';

// Setting up logging (Optional but recommended)
const LOG_FILE = '/tmp/giizhendam_mcp_v2_log.txt';
function log(message: string) {
    try {
        fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${message}\n`);
    } catch (error: any) {
        console.error(`Unable to write to log file: ${error.message}`);
    }
}

// --- Configuration ---
// Path to the script we will be calling
// const AIDER_SCRIPT_PATH = './aider-cli-commands.sh'; // Removed commented-out line

// Define standard board roles for ceo_and_board tool
const STANDARD_BOARD_ROLES = [
  "Board Chair",
  "CEO (Chief Executive Officer)",
  "CFO (Chief Financial Officer)",
  "COO (Chief Operations Officer)",
  "CTO (Chief Technology Officer)",
  "Independent Director",
  "Corporate Secretary/General Counsel",
  "Lead Investor/Venture Capitalist",
  "Risk/Audit Committee Chair"
];

// --- Best-practice Aider CLI flags (per EXAMPLES, docs, leaderboards) ---
// Always use these flags for non-interactive, programmatic use:
// --model (from env or default), --no-gui, --yes-always, --no-detect-urls, --message, --no-auto-commit, --no-git, --yes, --no-pretty
// Default model: openrouter/google/gemini-2.5-pro-preview-03-25
const DEFAULT_AIDER_MODEL = 'openrouter/google/gemini-2.5-pro-preview-03-25';

// --- Server Setup ---
const serverName = "giizhendam-aabajichiganan-mcp-script-interface";
const serverVersion = "0.3.1"; // Incremented version

const server = new McpServer({
    name: serverName,
    version: serverVersion, 
    capabilities: { resources: {}, tools: {} },
});

// Aider Task Types and Configuration
const TASK_TYPES = ['research', 'docs', 'security', 'code', 'verify', 'progress', 'general'] as const;
type TaskType = typeof TASK_TYPES[number];

// Use environment variables for defaults, allowing override via params

// Helper to escape shell arguments (basic version, might need refinement)
/*
function escapeShellArg(arg: string): string {
  // Simple escaping for demonstration; robust escaping is complex.
  // This handles spaces and basic special characters for common shells.
  if (/[^A-Za-z0-9_\/:=-]/.test(arg)) {
    return "'" + arg.replace(/'/g, "'\\''") + "'";
  }
  return arg;
}
*/

// --- Security Utility Functions ---

/**
 * Scrub stack traces and internal paths from errors returned to clients.
 * Only return safe error messages. Log full error server-side.
 */
function safeErrorReport(error: any): string {
    // Security: Prevent leaking sensitive error details to the client.
    log(`Internal Error: ${error?.stack || error}`); // Log full error server-side
    if (!error) return 'Unknown error.';
    if (typeof error === 'string') return error.split('\n')[0];
    // Return only the first line of the message to avoid stack traces
    if (error.message) return error.message.split('\n')[0];
    return 'An error occurred.';
}

/**
 * Validate file paths to restrict to project directory and allow only certain extensions.
 * Prevents path traversal and unsafe file access.
 * Security: Ensure file operations stay within the intended project scope.
 */
function validateFilePath(filePath: string): boolean {
    const allowedExtensions = ['.md', '.ts', '.json', '.txt']; // Allowlist safe extensions
    try {
        const absPath = path.resolve(process.cwd(), filePath);
        // Check 1: Is the resolved path still within the current working directory?
        if (!absPath.startsWith(process.cwd())) {
            log(`Security Violation: Attempt to access file outside project directory: ${filePath}`);
            return false;
        }
        // Check 2: Does the file have an allowed extension?
        if (!allowedExtensions.some(ext => absPath.endsWith(ext))) {
             log(`Security Violation: Attempt to access file with disallowed extension: ${filePath}`);
            return false;
        }
        return true;
    } catch (error) {
        log(`Error validating file path ${filePath}: ${error}`);
        return false;
    }
}

/**
 * Validate URLs to allow only HTTPS and block localhost/private IPs.
 * Prevents SSRF and cleartext transmission.
 * Security: Enforce secure HTTPS connections and prevent requests to internal network resources.
 */
function validateUrl(urlStr: string): boolean {
    try {
        const url = new URL(urlStr);
        // Check 1: Only allow HTTPS protocol
        if (url.protocol !== 'https:') {
            log(`Security Violation: Non-HTTPS URL rejected: ${urlStr}`);
            return false;
        }
        const hostname = url.hostname;
        // Check 2: Block localhost variants
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
             log(`Security Violation: Localhost URL rejected: ${urlStr}`);
            return false;
        }
        // Check 3: Block private IP ranges (RFC 1918 and loopback)
        if (/^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(hostname) || net.isIPv6(hostname) && hostname.startsWith('fd')) {
            log(`Security Violation: Private IP URL rejected: ${urlStr}`);
            return false;
        }
        // Note: This doesn't prevent DNS rebinding attacks where a public hostname resolves to a private IP later.
        // More robust SSRF prevention might involve an explicit allowlist or a network proxy.
        return true;
    } catch (error){
         log(`Error validating URL ${urlStr}: ${error}`);
        return false;
    }
}

// --- ADD MODEL-BASED EDIT FORMAT HELPER ---
/**
 * Determine the best edit format for a given model based on the leaderboard recommendations.
 * This looks at the base model name regardless of provider prefix.
 */
function getBestEditFormatForModel(modelName: string): string {
    // Convert to lowercase for case-insensitive matching
    const model = modelName.toLowerCase();
    
    // Extract the base model name, ignoring provider prefixes like openrouter/google/
    const getBaseModelName = (fullName: string): string => {
        // Remove provider prefixes if present
        const parts = fullName.split('/');
        return parts[parts.length - 1];
    };
    
    const baseModelName = getBaseModelName(model);
    
    // Map model patterns to their recommended edit formats based on the leaderboard
    if (model.includes('architect') || baseModelName.includes('architect')) {
        return 'architect'; // For any model using architect mode
    } else if (baseModelName.includes('gemini-2.5-pro-preview')) {
        return 'diff-fenced'; // Best for Gemini 2.5 Pro Preview models
    } else if (baseModelName.includes('claude-3') || baseModelName.includes('sonnet') || 
               baseModelName.includes('claude-3-5')) {
        return 'diff'; // Best for Claude models
    } else if (baseModelName.includes('o3') || baseModelName.includes('o-3') || 
               baseModelName.includes('gpt-4') || baseModelName.includes('gpt4') || 
               baseModelName.includes('o4') || baseModelName.includes('o-4') || 
               baseModelName.includes('o1') || baseModelName.includes('o-1')) {
        return 'diff'; // Best for most OpenAI models
    } else if (baseModelName.includes('deepseek') && baseModelName.includes('r1')) {
        return 'architect'; // For DeepSeek R1 models
    }
    
    // Default to 'whole' as the safest option for unknown models
    return 'whole';
}

// --- Tool Implementations (To be added based on PRD) ---

// Helper function to format prompt based on task type
function formatPromptByTaskType(prompt: string, taskType?: TaskType): string {
    if (!taskType || taskType === 'general') {
        return prompt; // No formatting for general tasks
    }
    
    switch(taskType) {
        case 'research':
            return `Act as a research analyst. Synthesize the key findings, evidence, and implications related to the following topic. Provide a concise summary suitable for a technical team. Topic: ${prompt}`;
        case 'docs':
            return `Act as a technical writer. Generate clear and concise documentation (e.g., explanation, usage guide, API reference) for the following subject, targeting an audience of developers. Subject: ${prompt}`;
        case 'security':
            return `Act as an expert security analyst. Review the provided context/code for potential security vulnerabilities (e.g., OWASP Top 10, injection flaws, insecure configurations, logic errors). Clearly identify any findings, explain the risks, and suggest mitigations. Focus area: ${prompt}`;
        case 'code':
            return `Act as an expert software developer. Implement the following code generation or modification request, ensuring code is efficient, readable, and adheres to best practices. Request: ${prompt}`;
        case 'verify':
            return `Act as a meticulous code reviewer. Verify the following code or implementation against the requirements or criteria specified. Identify any discrepancies, potential bugs, logical errors, or areas for improvement (e.g., clarity, performance). Verification request: ${prompt}`;
        case 'progress':
            return `Provide a status update or progress report based on the following request: ${prompt}`;
        default:
            return prompt;
    }
}

// --- Function to generate aider command guidance (replacing executeAider) ---
async function generateAiderCommandGuidance(
    toolArgs: string[], // Args specific to the tool, e.g., ['--message', 'prompt', 'file1.ts']
    isDoubleCompute: boolean = false
): Promise<{ 
    recommendedCommand: string;
    editFormat: string;
    editFormatReasoning: string;
    baseArgs: string[];
    modelName: string;
    apiKeyWarning?: string;
}> {
    // Get model from environment or use default
    let aiderModel = process.env.AIDER_MODEL;
    if (!aiderModel) {
        aiderModel = DEFAULT_AIDER_MODEL;
        log(`AIDER_MODEL not set, using default: ${DEFAULT_AIDER_MODEL}`);
    }

    // Check for OpenRouter API key if using an OpenRouter model
    let apiKeyWarning: string | undefined = undefined;
    if (aiderModel.toLowerCase().includes('openrouter') && !process.env.OPENROUTER_API_KEY) {
        const warningMsg = `WARNING: OPENROUTER_API_KEY environment variable is not set. You will need to set this before running the aider command.`;
        log(warningMsg);
        apiKeyWarning = warningMsg;
    }

    // Determine the best edit format for this model
    const editFormat = getBestEditFormatForModel(aiderModel);
    log(`Recommending edit format '${editFormat}' for model: ${aiderModel}`);

    // Generate reasoning for edit format choice
    let editFormatReasoning = `Based on the aider.chat leaderboard performance data, '${editFormat}' is the optimal edit format for ${aiderModel}.`;
    
    // Add more specific reasoning based on model and edit format
    if (editFormat === 'architect') {
        editFormatReasoning += ` The 'architect' mode is a two-stage editing approach that performs best with models like ${aiderModel}.`;
    } else if (editFormat === 'diff-fenced') {
        editFormatReasoning += ` The 'diff-fenced' format uses clearly marked code fences that perform well with ${aiderModel}.`;
    } else if (editFormat === 'diff') {
        editFormatReasoning += ` The 'diff' format provides clear edit boundaries that work effectively with ${aiderModel}.`;
    } else if (editFormat === 'whole') {
        editFormatReasoning += ` The 'whole' format is the safest default option for ${aiderModel} when other formats are not specifically recommended.`;
    }

    // Build the base args - match EXAMPLES-aider-cli-commands.sh BASE_CONFIG and leaderboard best practices
    const baseAiderArgs: string[] = [
        '--model', aiderModel,
        '--no-detect-urls',
        '--no-gui',
        '--yes-always',
        '--no-auto-commit',
        '--no-git',
        '--yes',                 // Always say yes to every confirmation
        '--no-pretty',
        '--edit-format', editFormat  // Use the appropriate edit format for this model
    ];

    // Add all "accept all" options from Aider options reference for maximum compatibility
    if (editFormat === 'architect') {
        // For architect mode, we need to specify the editor model
        baseAiderArgs.push('--editor-model', aiderModel);
        // Use the appropriate editor edit format (usually 'whole' or 'diff')
        const editorEditFormat = 'editor-whole'; // Could be refined based on model
        baseAiderArgs.push('--editor-edit-format', editorEditFormat);
    }

    // Combine base args with tool-specific args
    const finalArgs = [...baseAiderArgs, ...toolArgs];
    const recommendedCommand = `aider ${finalArgs.join(' ')}`;

    // If it's double compute, we should run the command twice
    const finalRecommendedCommand = isDoubleCompute 
        ? `# Run this command twice for redundant computation/comparison:\n${recommendedCommand}` 
        : recommendedCommand;

    return {
        recommendedCommand: finalRecommendedCommand,
        editFormat,
        editFormatReasoning,
        baseArgs: baseAiderArgs,
        modelName: aiderModel,
        apiKeyWarning
    };
}

// --- Create new output schemas for the refactored tools ---
const aiderGuidanceOutputSchema = z.object({
    recommendedCommand: z.string().describe('The recommended aider command to execute.'),
    editFormat: z.string().describe('The optimal edit format for the specified model.'),
    editFormatReasoning: z.string().describe('Explanation of why this edit format is recommended.'),
    taskType: z.string().optional().describe('The task type used for prompt formatting.'),
    formattedPrompt: z.string().optional().describe('The prompt after task-specific formatting.'),
    modelName: z.string().describe('The aider model that will be used.'),
    fileArgs: z.array(z.string()).optional().describe('File arguments to be passed to aider.'),
    apiKeyWarning: z.string().optional().describe('Warning about missing API keys needed for the model.'),
});

const doubleComputeGuidanceOutputSchema = aiderGuidanceOutputSchema.extend({
    isDoubleCompute: z.boolean().describe('Indicates this is guidance for a double compute operation.'),
});

// --- Tool: prompt_aider (refactored) ---
const promptAiderParamsSchema = z.object({
    prompt_text: z.string().max(10000, "Prompt text exceeds maximum length of 10000 characters.").describe("The main prompt/instruction for aider."),
    task_type: z.enum(TASK_TYPES).optional().describe("Optional task type hint (research, docs, security, code, verify, progress) - currently informational."),
    files: z.array(z.string()).optional().describe("Optional list of files for aider to consider or modify."),
    cache_prompts: z.boolean().optional().default(true).describe("Whether to enable prompt caching to reduce token usage."),
    cache_file: z.string().optional().describe("Optional path to store cached prompts. Defaults to .aider/prompt_cache.json")
});

// Output Schema (shared part for script execution tools)
const scriptExecutionOutputSchema = z.object({
    success: z.boolean().describe('True if the aider process exited with code 0.'),
    exitCode: z.number().nullable().describe('The exit code of the aider process.'),
    stdout: z.string().describe('The captured standard output from aider.'),
    stderr: z.string().describe('The captured standard error from aider.'),
    executedCommand: z.string().describe('The full aider command string executed.')
});

// Extend the meta schema to include output file path and saving status
const simulationOutputMetaSchema = scriptExecutionOutputSchema.extend({
    errorType: z.string().optional().describe("Indicates error source: 'ExecutionError', 'AiderError', 'FileSystemError', 'ConfigurationError'."), // Added ConfigurationError
    outputFilePath: z.string().optional().describe("Path to the generated output file (if applicable)."),
    fileSaveSuccess: z.boolean().optional().describe("True if the output was successfully saved to the file (if applicable).")
});

server.tool(
    "prompt_aider",
    "Executes the aider command with proven best-practice flags and model for robust, non-interactive code editing. Automatically selects the optimal edit format based on the model (architect, diff, diff-fenced, or whole) according to the Aider leaderboard performance data. Uses all necessary acceptance flags (--yes-always, --yes, etc.) for fully automated operation. All invocations use the base model with: --no-gui, --no-detect-urls, --no-auto-commit, --no-git, --no-pretty and other compatibility options.",
    promptAiderParamsSchema.shape,
    async (params): Promise<{ 
        content: { type: 'text'; text: string }[]; 
        _meta: z.infer<typeof aiderGuidanceOutputSchema>;
        isError?: boolean;
      }> => {
        
        // Format prompt based on task type
        const formattedPrompt = formatPromptByTaskType(params.prompt_text, params.task_type);
        const taskTypeName = params.task_type || 'general';
        
        // Construct tool-specific arguments for aider
        const toolArgs: string[] = [
            '--message', formattedPrompt,
        ];

        if (params.cache_prompts) {
            toolArgs.push('--cache-prompts');
            if (params.cache_file) {
                toolArgs.push('--cache-file', params.cache_file);
            }
        }

        // Format file arguments correctly with --file flag
        const fileArgs: string[] = [];
        if (params.files && params.files.length > 0) {
            params.files.forEach(file => {
                toolArgs.push('--file', file);
                fileArgs.push(file);
            });
            log(`Using --file flags for aider (prompt_aider): ${params.files.join(', ')}`);
        }

        try {
            // Generate command guidance instead of executing aider
            const guidance = await generateAiderCommandGuidance(toolArgs);
            
            // Prepare content array with guidance
            const contentResponse: { type: 'text'; text: string }[] = [
                {
                    type: "text",
                    text: `# Aider Command Guidance (${taskTypeName})\n\n`
                        + `## Recommended Command\n\`\`\`bash\n${guidance.recommendedCommand}\n\`\`\`\n\n`
                        + `## Edit Format\n${guidance.editFormat}\n\n`
                        + `## Reasoning\n${guidance.editFormatReasoning}`
                        + (guidance.apiKeyWarning ? `\n\n## ⚠️ Warning\n${guidance.apiKeyWarning}` : '')
                }
            ];

            // Add prompt information if task type is specified
            if (params.task_type && params.task_type !== 'general') {
                contentResponse.push({ 
                    type: 'text', 
                    text: `\n## Task-Specific Prompt Formatting\nTask Type: ${taskTypeName}\nPrompt Engineering: ${formattedPrompt.substring(0, formattedPrompt.indexOf(params.prompt_text))}...`
                });
            }

            return {
                content: contentResponse,
                _meta: {
                    recommendedCommand: guidance.recommendedCommand,
                    editFormat: guidance.editFormat,
                    editFormatReasoning: guidance.editFormatReasoning,
                    taskType: taskTypeName,
                    formattedPrompt: formattedPrompt,
                    modelName: guidance.modelName,
                    fileArgs: fileArgs.length > 0 ? fileArgs : undefined,
                    apiKeyWarning: guidance.apiKeyWarning
                }
            };
        } catch (error: any) {
            // Handle errors gracefully
            const errorMsg = safeErrorReport(error);
            log(`Error generating aider command guidance: ${errorMsg}`);
            
            return {
                content: [{ 
                    type: 'text', 
                    text: `Error generating aider command guidance: ${errorMsg}` 
                }],
                isError: true,
                _meta: {
                    recommendedCommand: `# Error generating command: ${errorMsg}`,
                    editFormat: 'unknown',
                    editFormatReasoning: 'Could not determine optimal edit format due to error.',
                    taskType: taskTypeName,
                    modelName: process.env.AIDER_MODEL || DEFAULT_AIDER_MODEL,
                    apiKeyWarning: undefined
                }
            };
        }
    }
);

// --- Tool: double_compute (refactored) ---
const doubleComputeParamsSchema = z.object({
    prompt_text: z.string().max(10000, "Prompt text exceeds maximum length of 10000 characters.").describe("The main prompt/instruction for aider."),
    task_type: z.enum(TASK_TYPES).optional().describe("Optional task type hint (research, docs, security, code, verify, progress) - currently informational."),
    files: z.array(z.string()).optional().describe("Optional list of files for aider to consider or modify."),
    cache_prompts: z.boolean().optional().default(true).describe("Whether to enable prompt caching to reduce token usage."),
    cache_file: z.string().optional().describe("Optional path to store cached prompts. Defaults to .aider/prompt_cache.json")
});

const doubleComputeOutputMetaSchema = z.object({
    overallSuccess: z.boolean().describe("True if both aider executions succeeded (Exit Code 0)."),
    run1: scriptExecutionOutputSchema.describe("Results of the first execution."),
    run2: scriptExecutionOutputSchema.describe("Results of the second execution."),
    errorType: z.string().optional().describe("Indicates if there was an execution error ('ExecutionError'), aider error ('AiderError'), or config error ('ConfigurationError').")
});

server.tool(
    "double_compute",
    "Executes the aider command TWICE with proven best-practice flags and model for robust, non-interactive code editing. Automatically selects the optimal edit format based on the model (architect, diff, diff-fenced, or whole) according to the Aider leaderboard performance data. Uses all necessary acceptance flags (--yes-always, --yes, etc.) for fully automated operation. All invocations use the base model with: --no-gui, --no-detect-urls, --no-auto-commit, --no-git, --no-pretty and other compatibility options. Useful for tasks requiring redundant computation or comparison.",
    doubleComputeParamsSchema.shape,
    async (params): Promise<{
        content: { type: 'text'; text: string }[];
        _meta: z.infer<typeof doubleComputeGuidanceOutputSchema>;
        isError?: boolean;
      }> => {
        // Format prompt based on task type
        const formattedPrompt = formatPromptByTaskType(params.prompt_text, params.task_type);
        const taskTypeName = params.task_type || 'general';
        
        // Construct tool-specific arguments once
        const toolArgs: string[] = [
            '--message', formattedPrompt,
        ];

        if (params.cache_prompts) {
            toolArgs.push('--cache-prompts');
            if (params.cache_file) {
                toolArgs.push('--cache-file', params.cache_file);
            }
        }

        // Format file arguments correctly with --file flag
        const fileArgs: string[] = [];
        if (params.files && params.files.length > 0) {
            params.files.forEach(file => {
                toolArgs.push('--file', file);
                fileArgs.push(file);
            });
            log(`Using --file flags for aider (double_compute): ${params.files.join(', ')}`);
        }
        log(`Preparing double_compute guidance with tool args: ${toolArgs.join(' ')}`);

        try {
            // Generate command guidance with isDoubleCompute flag
            const guidance = await generateAiderCommandGuidance(toolArgs, true);
            
            // Prepare content array with guidance for double compute
            const contentResponse: { type: 'text'; text: string }[] = [
                {
                    type: "text",
                    text: `# Double Compute Aider Command Guidance (${taskTypeName})\n\n`
                        + `## Recommended Command (Run Twice)\n\`\`\`bash\n${guidance.recommendedCommand.replace('# Run this command twice for redundant computation/comparison:\n', '')}\n\`\`\`\n\n`
                        + `## Edit Format\n${guidance.editFormat}\n\n`
                        + `## Reasoning\n${guidance.editFormatReasoning}\n\n`
                        + `## Double Compute Note\nThis command should be run twice to perform redundant computation/comparison for better results.`
                        + (guidance.apiKeyWarning ? `\n\n## ⚠️ Warning\n${guidance.apiKeyWarning}` : '')
                }
            ];

            // Add prompt information if task type is specified
            if (params.task_type && params.task_type !== 'general') {
                contentResponse.push({ 
                    type: 'text', 
                    text: `\n## Task-Specific Prompt Formatting\nTask Type: ${taskTypeName}\nPrompt Engineering: ${formattedPrompt.substring(0, formattedPrompt.indexOf(params.prompt_text))}...`
                });
            }

            return {
                content: contentResponse,
                _meta: {
                    recommendedCommand: guidance.recommendedCommand,
                    editFormat: guidance.editFormat,
                    editFormatReasoning: guidance.editFormatReasoning,
                    taskType: taskTypeName,
                    formattedPrompt: formattedPrompt,
                    modelName: guidance.modelName,
                    fileArgs: fileArgs.length > 0 ? fileArgs : undefined,
                    isDoubleCompute: true,
                    apiKeyWarning: guidance.apiKeyWarning
                }
            };
        } catch (error: any) {
            // Handle errors gracefully
            const errorMsg = safeErrorReport(error);
            log(`Error generating double compute aider command guidance: ${errorMsg}`);
            
            return {
                content: [{ 
                    type: 'text', 
                    text: `Error generating double compute aider command guidance: ${errorMsg}` 
                }],
                isError: true,
                _meta: {
                    recommendedCommand: `# Error generating command: ${errorMsg}`,
                    editFormat: 'unknown',
                    editFormatReasoning: 'Could not determine optimal edit format due to error.',
                    taskType: taskTypeName,
                    modelName: process.env.AIDER_MODEL || DEFAULT_AIDER_MODEL,
                    isDoubleCompute: true,
                    apiKeyWarning: undefined
                }
            };
        }
    }
);

// --- Tool: finance_experts ---

// Define hardcoded expert prompts focused on project/business financial analysis
const EXPERT_PROMPTS: Record<string, string> = {
  "Graham": `You are a Benjamin Graham AI agent. Apply his core principles to analyze the user's financial query regarding a project or business situation:
1. Emphasize a 'margin of safety': Does the project/idea have buffer against downside? Are assumptions too optimistic? What are the key risks and how can they be mitigated?
2. Assess Financial Prudence: Does the financial plan demonstrate soundness? Is leverage reasonable? Are resources adequate?
3. Focus on Understandability and Stability: Is the financial model clear? Are revenue/cost projections grounded and stable?
4. Avoid Speculation: Focus on realistic, provable aspects rather than high-growth hypotheticals.

When responding to the user's query:
- Analyze the situation through Graham's conservative lens.
- Identify potential financial risks and areas needing a 'margin of safety'.
- Question optimistic assumptions.
- Provide a reasoned perspective using Graham's analytical voice.
- Structure your output clearly, addressing the user's query directly.`,

  "Ackman": `You are a Bill Ackman AI agent. Apply his core principles to analyze the user's financial query regarding a project or business situation:
1. Focus on Quality & Simplicity: Does the project/business have clear, high-quality objectives and a potentially durable advantage? Is it overly complex?
2. Assess Long-Term Value Creation: What is the potential for long-term free cash flow or value generation? Is the financial strategy sustainable?
3. Scrutinize Financial Discipline: Is the proposed capital allocation efficient? Is leverage appropriate? Are there operational improvements possible?
4. Consider Catalysts/Activism Angles: Are there specific actions (cost cuts, strategy shifts, better capital allocation) that could significantly improve the financial outlook?
5. Valuation Mindset: Even for a project, are the required resources justified by the potential return? Is there a conceptual 'margin of safety'?

When responding to the user's query:
- Analyze the situation with a focus on quality, long-term value, and potential improvements.
- Identify key financial levers or potential points of intervention (activist mindset).
- Provide a confident, analytical perspective, potentially highlighting flaws or opportunities bluntly.
- Structure your output clearly, addressing the user's query directly.`,

  "Wood": `You are a Cathie Wood AI agent. Apply her core principles to analyze the user's financial query regarding a project or business situation:
1. Identify Disruptive Innovation: Does the project leverage new technology or innovative models? What is its potential to disrupt existing markets or create new ones?
2. Emphasize Exponential Growth Potential: What is the scale of the opportunity (Total Addressable Market)? Does the financial plan support rapid, exponential growth?
3. Focus on Future-Facing Themes: How does the project align with major technological or societal shifts (AI, genomics, blockchain, energy transition, etc.)?
4. Long-Term Vision (5+ Years): Assess the project's potential impact and financial trajectory over an extended timeframe.
5. Investment in Innovation: Does the plan prioritize necessary R&D or investment to achieve its breakthrough potential?

When responding to the user's query:
- Analyze the situation through a lens of disruptive innovation and long-term, exponential growth.
- Highlight the transformative potential and alignment with future trends.
- Be comfortable with uncertainty and focus on the scale of the potential upside.
- Provide an optimistic, future-focused, and conviction-driven perspective using Wood's voice.
- Structure your output clearly, addressing the user's query directly.`,

  "Munger": `You are a Charlie Munger AI agent. Apply his multidisciplinary principles and mental models to analyze the user's financial query regarding a project or business situation:
1. Assess Quality & Predictability: Is the project/business model fundamentally sound and understandable? How predictable are its financial outcomes?
2. Apply Mental Models: Use frameworks from psychology, economics, engineering, etc., to understand the situation (e.g., incentives, feedback loops, scalability constraints).
3. Look for Durable Advantages ('Moats'): Does the project create or leverage a sustainable competitive advantage?
4. Emphasize Rationality & Prudence: Avoid folly. Invert the problem – what could cause this project to fail financially? Is management/planning rational?
5. Focus on Long-Term Economics: Prioritize sustainable financial health over short-term gains. Is the return on invested capital likely to be strong?

When responding to the user's query:
- Analyze the situation using multiple mental models and a focus on fundamental quality and rationality.
- "Invert" the problem to identify key risks and potential points of failure.
- Assess the long-term financial prospects and potential 'moat'.
- Provide a wise, direct, and pithy perspective using Munger's voice, drawing connections across disciplines.
- Structure your output clearly, addressing the user's query directly.`,

  "Burry": `You are a Dr. Michael J. Burry AI agent. Apply his core principles to analyze the user's financial query regarding a project or business situation:
1. Hunt for Unseen Value/Risk: Look beyond the surface. Is there a hidden financial risk or an undervalued aspect the user might be missing?
2. Be Contrarian: Question conventional wisdom. Is the popular opinion about the project's finances potentially wrong?
3. Focus on Downside First: What are the most significant financial risks? Is leverage excessive? Where could the project realistically fail?
4. Data-Driven Analysis: Ground your assessment in concrete numbers and realistic financial projections, avoiding hype.
5. Look for Catalysts (Internal): Are there internal factors (e.g., specific milestones, cost controls, resource allocation shifts) that could significantly change the financial trajectory?

When responding to the user's query:
- Analyze the situation with a contrarian, risk-focused, and data-driven perspective.
- Identify potential hidden risks or flaws in the financial assumptions.
- Question the consensus view.
- Provide a terse, direct, and number-focused assessment using Burry's communication style.
- Structure your output clearly, addressing the user's query directly.`,

  "Lynch": `You are a Peter Lynch AI agent. Apply his core principles to analyze the user's financial query regarding a project or business situation:
1. Invest in What You Know: Is the project's concept and financial model understandable? Can you explain it simply? Avoid excessive complexity.
2. Growth at a Reasonable Price (GARP) for Projects: Are the resources required (price) reasonable given the potential growth and financial return? Look for potential 'ten-bagger' project ideas if applicable.
3. Assess the 'Story': What is the underlying narrative? Is it compelling and realistic, or overly hyped? Does the project have potential for steady, understandable growth?
4. Check Financial Health: Is the financial plan sound? Is debt manageable? Are the underlying unit economics favorable?
5. Look for Simplicity & Focus: Favor projects with clear goals and straightforward financial structures.

When responding to the user's query:
- Analyze the situation using a practical, common-sense approach focused on understandability and reasonable growth prospects.
- Evaluate the project's 'story' and whether the financials back it up.
- Apply the GARP concept conceptually – is the investment justified by the potential?
- Provide a relatable, practical perspective using Lynch's folksy voice.
- Structure your output clearly, addressing the user's query directly.`,

  "Fisher": `You are a Phil Fisher AI agent. Apply his core principles to analyze the user's financial query regarding a project or business situation:
1. Focus on Long-Term Growth Potential: What are the project's prospects for sustained growth and impact over 3-5+ years? Is it targeting a growing area?
2. Quality of Management/Team: Assess the competence, vision, and execution capability of the team driving the project. Is their financial planning sound?
3. Investment in Future (R&D/Innovation): Does the project plan adequately for necessary innovation, research, or development to maintain its edge and achieve long-term goals?
4. Profitability & Financial Soundness: Does the project have a path to sustainable financial performance? Are the projected margins reasonable and defensible?
5. Competitive Advantages & 'Scuttlebutt': What makes this project likely to succeed against alternatives? What insights can be gathered by talking to potential users/stakeholders (conceptual 'scuttlebutt')?

When responding to the user's query:
- Analyze the situation with a focus on long-term growth, management quality, and innovation potential.
- Evaluate the sustainability of the financial model and competitive positioning.
- Emphasize the importance of R&D and forward-looking investment.
- Provide a methodical, growth-focused, and long-term oriented perspective using Fisher's voice.
- Structure your output clearly, addressing the user's query directly.`
};

// Define available expert personas based on the hardcoded prompts
// const FINANCIAL_EXPERT_PERSONAS = ['Graham', 'Ackman', 'Wood', 'Munger', 'Burry', 'Lynch', 'Fisher'] as const;
// type FinancialExpertPersona = typeof FINANCIAL_EXPERT_PERSONAS[number];
// ^^^ No longer needed as we process all defined experts ^^^

const financeExpertsParamsSchema = z.object({
    topic: z.string().max(2000, "Topic exceeds maximum length of 2000 characters.").describe("The central financial topic or query related to a project or business situation for the experts to analyze (e.g., 'Financial risks of Project X', 'Funding strategy for new initiative Y')."),
    // experts field removed - all experts are processed now.
    output_filename: z.string().optional().describe("Optional filename (without extension) for the output markdown file. Defaults to a sanitized version of the topic.")
});

// Make output directories configurable via environment variables
// const OUTPUT_DIR_FINANCE = process.env.FINANCE_EXPERTS_OUTPUT_DIR || path.join(process.cwd(), 'financial-experts'); // <-- REMOVED FALLBACK
// const FINANCE_AGENTS_PATH = path.join(process.cwd(), 'finance-agents.md'); // Removed - prompts are hardcoded

// --- START Configuration Change ---
// Make Gemini Model configurable via environment variable, with a default
const DEFAULT_GEMINI_MODEL = "gemini-2.0-flash-lite";
const GEMINI_MODEL_NAME = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
// --- END Configuration Change ---

// Helper function to parse expert prompts from finance-agents.md - REMOVED
/*
function parseExpertPrompts(fileContent: string): Map<string, string> {
    // ... implementation removed ...
}
*/

// Define a new metadata schema specifically for the finance_experts tool
const financeExpertsOutputMetaSchema = z.object({
    success: z.boolean().describe('True if all API calls and file saving succeeded.'),
    outputFilePath: z.string().optional().describe("Path to the generated output file."),
    fileSaveSuccess: z.boolean().optional().describe("True if the output was successfully saved to the file."),
    expertsProcessed: z.array(z.string()).describe("List of all experts whose prompts were processed."),
    apiErrors: z.array(z.object({ expert: z.string(), error: z.string() })).optional().describe("List of errors encountered during API calls."),
    errorType: z.string().optional().describe("Indicates error source: 'InitializationError', 'FileSystemError', 'ApiError'.") // Removed 'ParsingError'
});

// Define a similar schema for the board simulation tool
const boardSimulationOutputMetaSchema = z.object({
    success: z.boolean().describe('True if the API call and file saving succeeded.'),
    outputFilePath: z.string().optional().describe("Path to the generated output file."),
    fileSaveSuccess: z.boolean().optional().describe("True if the output was successfully saved to the file."),
    apiError: z.string().optional().describe("Error message encountered during the API call."),
    errorType: z.string().optional().describe("Indicates error source: 'InitializationError', 'FileSystemError', 'ApiError'.")
});

server.tool(
    "finance_experts",
    "Simulates a deliberation between multiple internally-defined financial expert personas (Graham, Ackman, Wood, Munger, Burry, Lynch, Fisher) on a given financial topic/query related to a project or business situation using the Gemini API. Generates responses reflecting each expert's refocused principles and saves the aggregated result to './financial-experts/'. Also includes a collective deliberation on the optimal aider prompt for the topic.",
    financeExpertsParamsSchema.shape,
     async (params): Promise<{
        content: { type: 'text'; text: string }[];
        _meta: z.infer<typeof financeExpertsOutputMetaSchema>;
        isError?: boolean;
      }> => {

        // --- START Configuration Validation ---
        const apiKey = process.env.GEMINI_API_KEY;
        const outputDirFinance = process.env.FINANCE_EXPERTS_OUTPUT_DIR; // Get configured path

        if (!apiKey) {
            log("Error: GEMINI_API_KEY environment variable not set for finance_experts.");
            return {
                content: [{ type: 'text', text: "Configuration Error: GEMINI_API_KEY is not set." }],
                isError: true,
                _meta: { success: false, expertsProcessed: [], errorType: 'InitializationError' }
            };
        }
        if (!outputDirFinance) { // Check if the output directory path is configured
            log("Error: FINANCE_EXPERTS_OUTPUT_DIR environment variable not set.");
            return {
                content: [{ type: 'text', text: "Configuration Error: FINANCE_EXPERTS_OUTPUT_DIR is not set. Check MCP server configuration (mcp.json)." }],
                isError: true,
                _meta: { success: false, expertsProcessed: [], errorType: 'ConfigurationError' } // Use ConfigurationError
            };
        }
        // --- END Configuration Validation ---

        let ai: GoogleGenerativeAI;
        try {
            ai = new GoogleGenerativeAI(apiKey); // Pass apiKey directly
        } catch (initError: any) {
            log(`Error initializing GoogleGenerativeAI: ${initError.message}`);
             return {
                 content: [{ type: 'text', text: `Failed to initialize AI client: ${initError.message}` }],
                 isError: true,
                 _meta: { success: false, expertsProcessed: [], errorType: 'InitializationError' }
             };
        }

        // 2. Generate responses for ALL defined experts
        const apiErrors: { expert: string; error: string }[] = [];
        const expertResponses: { expert: string; response: string }[] = [];
        const expertsToProcess = Object.keys(EXPERT_PROMPTS); // Process all experts defined above

        log(`Processing topic "${params.topic}" for ALL defined experts: ${expertsToProcess.join(', ')}`);

        await Promise.allSettled(expertsToProcess.map(async (expert) => {
            const basePrompt = EXPERT_PROMPTS[expert]; // Get prompt from hardcoded object
            // Combine base prompt with the specific topic/query from the user
            const fullPrompt = `${basePrompt}

--- USER QUERY ---
Analyze the following query/topic:
${params.topic}`;

            try {
                log(`Generating response for ${expert}...`);
                const model = ai.getGenerativeModel({ model: GEMINI_MODEL_NAME }); // Get model instance
                const result = await model.generateContent(fullPrompt); // Pass prompt string directly
                const response = await result.response; // Await the response accessor
                const responseText = response.text(); // Call text() method

                 if (responseText) {
                    expertResponses.push({ expert, response: responseText });
                    log(`Response received for ${expert}`);
                 } else {
                    // Handle cases where response or text is missing
                    const errorMsg = `No text content received for ${expert}. Response: ${JSON.stringify(response)}`; // Log the response structure
                    log(`Error: ${errorMsg}`);
                    apiErrors.push({ expert, error: errorMsg });
                    expertResponses.push({ expert, response: `*Error: Could not generate response for ${expert}*` });
                 }


            } catch (error: any) {
                const errorMsg = `API Error for ${expert}: ${error.message}`;
                log(errorMsg);
                apiErrors.push({ expert, error: errorMsg });
                 expertResponses.push({ expert, response: `*Error: API call failed for ${expert}*` });
            }
        }));

        // Sort responses to maintain consistent order (matching definition order)
        expertResponses.sort((a, b) => expertsToProcess.indexOf(a.expert) - expertsToProcess.indexOf(b.expert));

        // 3. Generate aider prompt deliberation
        let aiderDeliberation = "";
        let aiderPromptSuggestion = "";
        
        try {
            log("Generating collective deliberation for optimal aider prompt...");
            
            // Create a deliberation prompt that simulates the experts discussing the best aider prompt
            const deliberationPrompt = `
You represent a collective deliberation between financial experts (${expertsToProcess.join(', ')}) who must formulate the optimal prompt for an AI coding assistant called "aider".

Topic: ${params.topic}

The experts are aware of different aider task types that can be used:
1. research - For synthesizing findings, evidence and implications
2. docs - For generating clear documentation 
3. security - For reviewing code/systems for vulnerabilities
4. code - For implementing efficient, readable code
5. verify - For verifying code against requirements
6. progress - For status updates/reports
7. general - For general requests

FORMAT YOUR RESPONSE AS FOLLOWS:

## Expert Deliberation
[Simulate a brief discussion between the experts about which aider task type would be most appropriate for this topic and what specific prompt would be most effective]

## Recommended Task Type
[Single word recommendation: research/docs/security/code/verify/progress/general]

## Recommended Aider Prompt
[The exact, concise prompt that should be sent to aider]

## Confidence Score
[A number from 1-10 representing the group's collective confidence in this recommendation]
`;
            
            const model = ai.getGenerativeModel({ model: GEMINI_MODEL_NAME });
            const result = await model.generateContent(deliberationPrompt);
            const response = await result.response;
            aiderDeliberation = response.text();
            
            // Extract the recommended prompt from the deliberation
            const promptMatch = aiderDeliberation.match(/## Recommended Aider Prompt\n([^#]+)/);
            if (promptMatch && promptMatch[1]) {
                aiderPromptSuggestion = promptMatch[1].trim();
            }
            
            log("Successfully generated aider prompt deliberation");
        } catch (error: any) {
            const errorMsg = `API Error for aider deliberation: ${error.message}`;
            log(errorMsg);
            aiderDeliberation = `*Error: Could not generate aider prompt deliberation: ${error.message}*`;
        }

        // 4. Format output as Markdown
        let markdownOutput = `# Financial Expert Perspectives

**Topic/Query:** ${params.topic}

---

`;
        expertResponses.forEach(({ expert, response }) => {
            markdownOutput += `## ${expert}'s Perspective

${response}

---

`;
        });
        
        // Add the aider prompt deliberation section
        markdownOutput += `
# Collective Deliberation on Optimal Aider Prompt

${aiderDeliberation}

---

`;

        if (apiErrors.length > 0) {
             markdownOutput += `
**API Errors Encountered:**
`;
             apiErrors.forEach(({expert, error}) => {
                 markdownOutput += `- ${expert}: ${error}
`;
             });
        }

        // 5. Determine output file path
        const safeFilenameBase = params.output_filename?.replace(/[^a-z0-9_-]/gi, '_').toLowerCase() || params.topic.replace(/[^a-z0-9_-]/gi, '_').toLowerCase().substring(0, 50);
        const outputFilename = `${safeFilenameBase}_${Date.now()}.md`;
        const outputFilePath = path.join(outputDirFinance, outputFilename);

        // 6. Ensure output directory exists and save file
        let fileSaveSuccess = false;
        let fileSaveError = '';
        let fileSystemError = false;
        try {
            await fsPromises.mkdir(outputDirFinance, { recursive: true });
            log(`Ensured output directory exists: ${outputDirFinance}`);
            await fsPromises.writeFile(outputFilePath, markdownOutput);
            log(`Successfully saved finance_experts perspectives to ${outputFilePath}`);
                    fileSaveSuccess = true;
                } catch (writeError: any) {
                    log(`Error writing output file ${outputFilePath}: ${writeError.message}`);
            fileSaveError = `File System Error: ${writeError.message}`;
            fileSystemError = true;
        }

        // 7. Determine overall success and return result
        const overallSuccess = apiErrors.length === 0 && !fileSystemError;
        let finalErrorType: string | undefined = undefined;
        if (fileSystemError) finalErrorType = 'FileSystemError';
        else if (apiErrors.length > 0) finalErrorType = 'ApiError';


        return {
            content: [
                {
                    type: "text",
                    text: overallSuccess
                        ? `Financial Experts simulation (Topic: ${params.topic}) completed processing perspectives from all defined experts ${fileSaveSuccess ? `and saved to '${outputFilePath}'` : 'but failed to save file'}.`
                        : `Financial Experts simulation (Topic: ${params.topic}) completed with errors while processing perspectives. Saved: ${fileSaveSuccess}. See details in _meta.`
                },
                {
                    type: "text",
                    text: aiderPromptSuggestion 
                        ? `\n--- Recommended Aider Prompt ---\n${aiderPromptSuggestion}`
                        : `\n--- No Aider Prompt Recommendation Available ---`
                }
            ],
            isError: !overallSuccess,
            _meta: {
                success: overallSuccess,
                outputFilePath: outputFilePath,
                fileSaveSuccess: fileSaveSuccess,
                expertsProcessed: expertsToProcess,
                apiErrors: apiErrors.length > 0 ? apiErrors : undefined,
                errorType: finalErrorType
            }
        };
    }
);

// --- Tool: ceo_and_board ---
const ceoBoardParamsSchema = z.object({
    topic: z.string().max(2000, "Topic exceeds maximum length of 2000 characters.").describe("The central topic for the board discussion (e.g., 'Q3 Strategy Review', 'Acquisition Proposal X')."),
    roles: z.array(z.string().max(100, "Role exceeds maximum length of 100 characters.")).optional().describe("Optional list of board member roles to simulate. If not provided, standard board roles will be used."),
    output_filename: z.string().optional().describe("Optional filename (without extension) for the output markdown file. Defaults to a sanitized version of the topic.")
});

// Make output directories configurable via environment variables
// const OUTPUT_DIR_BOARD = process.env.CEO_BOARD_OUTPUT_DIR || path.join(process.cwd(), 'ceo-and-board'); // <-- REMOVED FALLBACK
// const GEMINI_MODEL_NAME = "gemini-1.5-flash-latest"; // Now defined globally and configurable

server.tool(
    "ceo_and_board",
    "Simulates a board discussion on a given topic with specified roles using the Gemini API. Constructs a prompt, executes the API call, and saves the output markdown to './ceo-and-board/'. Also includes a deliberation on the optimal aider prompt for the topic.",
    ceoBoardParamsSchema.shape,
    async (params): Promise<{
        content: { type: 'text'; text: string }[];
        // Use the new metadata schema
        _meta: z.infer<typeof boardSimulationOutputMetaSchema>;
        isError?: boolean;
      }> => {

        // --- START Configuration Validation ---
        const apiKey = process.env.GEMINI_API_KEY;
        const outputDirBoard = process.env.CEO_BOARD_OUTPUT_DIR; // Get configured path

        if (!apiKey) {
            log("Error: GEMINI_API_KEY environment variable not set for ceo_and_board.");
            return {
                content: [{ type: 'text', text: "Configuration Error: GEMINI_API_KEY is not set." }],
                isError: true,
                _meta: { success: false, errorType: 'InitializationError' }
            };
        }
        if (!outputDirBoard) { // Check if the output directory path is configured
            log("Error: CEO_BOARD_OUTPUT_DIR environment variable not set.");
            return {
                content: [{ type: 'text', text: "Configuration Error: CEO_BOARD_OUTPUT_DIR is not set. Check MCP server configuration (mcp.json)." }],
                isError: true,
                _meta: { success: false, errorType: 'ConfigurationError' } // Use ConfigurationError
            };
        }
        // --- END Configuration Validation ---

        let ai: GoogleGenerativeAI;
        try {
            ai = new GoogleGenerativeAI(apiKey);
        } catch (initError: any) {
            log(`Error initializing GoogleGenerativeAI for ceo_and_board: ${initError.message}`);
             return {
                 content: [{ type: 'text', text: `Failed to initialize AI client: ${initError.message}` }],
                 isError: true,
                 _meta: { success: false, errorType: 'InitializationError' }
             };
        }

        // Use standard board roles if none are provided
        const rolesToUse = params.roles || STANDARD_BOARD_ROLES;
        const rolesString = rolesToUse.join(', ');

        // 1. Construct the detailed prompt for the Gemini model
        const prompt_text = `
Simulate a concise board meeting transcript.
Topic: ${params.topic}
Participants (Roles): ${rolesString}
Instructions:
- Generate realistic perspectives, questions, and decisions for each specified role based on typical board dynamics and the topic.
- Ensure the discussion flows logically towards action items or conclusions.
- Keep the simulation focused and representative of a professional board meeting.
- Include brief moments of agreement, disagreement, and clarification.
- Output should be in markdown format, suitable for meeting minutes.
- Start with the Chair (or CEO if present, otherwise first role listed) opening the discussion on the topic.
- Conclude with a summary of key decisions or next steps.
        `.trim();

        // 2. Generate aider prompt deliberation
        let aiderDeliberation = "";
        let aiderPromptSuggestion = "";
        
        try {
            log("Generating collective board deliberation for optimal aider prompt...");
            
            // Create a deliberation prompt that simulates the board discussing the best aider prompt
            const deliberationPrompt = `
You represent a collective deliberation between board members (${rolesString}) who must formulate the optimal prompt for an AI coding assistant called "aider".

Topic: ${params.topic}

The board members are aware of different aider task types that can be used:
1. research - For synthesizing findings, evidence and implications
2. docs - For generating clear documentation 
3. security - For reviewing code/systems for vulnerabilities
4. code - For implementing efficient, readable code
5. verify - For verifying code against requirements
6. progress - For status updates/reports
7. general - For general requests

FORMAT YOUR RESPONSE AS FOLLOWS:

## Board Deliberation
[Simulate a brief discussion between the board members about which aider task type would be most appropriate for this topic and what specific prompt would be most effective]

## Recommended Task Type
[Single word recommendation: research/docs/security/code/verify/progress/general]

## Recommended Aider Prompt
[The exact, concise prompt that should be sent to aider]

## Confidence Score
[A number from 1-10 representing the board's collective confidence in this recommendation]
`;
            
            const model = ai.getGenerativeModel({ model: GEMINI_MODEL_NAME });
            const result = await model.generateContent(deliberationPrompt);
            const response = await result.response;
            aiderDeliberation = response.text();
            
            // Extract the recommended prompt from the deliberation
            const promptMatch = aiderDeliberation.match(/## Recommended Aider Prompt\n([^#]+)/);
            if (promptMatch && promptMatch[1]) {
                aiderPromptSuggestion = promptMatch[1].trim();
            }
            
            log("Successfully generated board aider prompt deliberation");
        } catch (error: any) {
            const errorMsg = `API Error for board aider deliberation: ${error.message}`;
            log(errorMsg);
            aiderDeliberation = `*Error: Could not generate aider prompt deliberation: ${error.message}*`;
        }

        // 3. Determine output file path
        const safeFilenameBase = params.output_filename?.replace(/[^a-z0-9_-]/gi, '_').toLowerCase() || params.topic.replace(/[^a-z0-9_-]/gi, '_').toLowerCase().substring(0, 50);
        const outputFilename = `${safeFilenameBase}_${Date.now()}.md`;
        const outputFilePath = path.join(outputDirBoard, outputFilename);

        // 4. Ensure output directory exists
        try {
             // Use the validated environment variable for the path
            await fsPromises.mkdir(outputDirBoard, { recursive: true });
            log(`Ensured output directory exists: ${outputDirBoard}`);
        } catch (dirError: any) {
            log(`Error creating directory ${outputDirBoard}: ${dirError.message}`);
            return {
                content: [{ type: 'text', text: `Failed to create output directory: ${outputDirBoard}` }],
                isError: true,
                _meta: {
                    success: false, apiError: `Directory creation error: ${dirError.message}`, errorType: 'FileSystemError',
                    outputFilePath: outputFilePath, fileSaveSuccess: false
                }
            };
        }

        // 5. Execute the Gemini API call for board simulation
        let simulationText = '';
        let apiError: string | undefined = undefined;
        let apiSuccess = false;

        try {
            log(`Generating ceo_and_board simulation for topic: ${params.topic}`);
            const model = ai.getGenerativeModel({ model: GEMINI_MODEL_NAME });
            const result = await model.generateContent(prompt_text);
            const response = await result.response;
            const responseText = response.text();

            if (responseText) {
                simulationText = responseText;
                apiSuccess = true;
                log(`Successfully received ceo_and_board simulation from API.`);
            } else {
                 const errorMsg = `No text content received for ceo_and_board. Response: ${JSON.stringify(response)}`;
                 log(`Error: ${errorMsg}`);
                 apiError = errorMsg;
            }
        } catch (error: any) {
            const errorMsg = `API Error during ceo_and_board simulation: ${error.message}`;
            log(errorMsg);
            apiError = errorMsg;
        }

        // 6. Combine board simulation with aider deliberation
        const fullOutputContent = `
# Board Meeting: ${params.topic}

${simulationText}

---

# Board Deliberation on Optimal Aider Prompt

${aiderDeliberation}
`;

        // 7. Attempt to save output if API call succeeded
        let fileSaveSuccess = false;
        let fileSaveError = '';
        let fileSystemError = false;

        if (apiSuccess && simulationText) {
            try {
                await fsPromises.writeFile(outputFilePath, fullOutputContent);
                log(`Successfully saved ceo_and_board output to ${outputFilePath}`);
                fileSaveSuccess = true;
            } catch (writeError: any) {
                log(`Error writing output file ${outputFilePath}: ${writeError.message}`);
                fileSaveError = `File System Error: ${writeError.message}`;
                fileSystemError = true; // Mark as file system error
            }
        } else if (apiSuccess && !simulationText) {
             log(`API succeeded but produced no text for ceo_and_board: ${params.topic}`);
             fileSaveError = "File Save Info: API succeeded but produced no output to save.";
             // fileSaveSuccess remains false
        }

        // 8. Determine overall success and return result
        const overallSuccess = apiSuccess && fileSaveSuccess;
        let finalErrorType: string | undefined = undefined;
        if (fileSystemError) finalErrorType = 'FileSystemError';
        else if (!apiSuccess) finalErrorType = 'ApiError';

        const finalApiError = apiError ? apiError : (fileSaveError && !fileSystemError ? fileSaveError : undefined);


        // Prepare content array
        const contentResponse: { type: 'text'; text: string }[] = [
            {
                type: "text",
                text: overallSuccess
                    ? `CEO & Board simulation (Topic: ${params.topic}) using Gemini API completed and saved to '${outputFilePath}'.`
                    : `CEO & Board simulation (Topic: ${params.topic}) using Gemini API failed. API Success: ${apiSuccess}, Saved: ${fileSaveSuccess}. Error: ${safeErrorReport(finalApiError) || 'See _meta'}.`
            },
            {
                type: "text",
                text: aiderPromptSuggestion 
                    ? `\n--- Recommended Aider Prompt ---\n${aiderPromptSuggestion}`
                    : `\n--- No Aider Prompt Recommendation Available ---`
            }
        ];

        // Add error snippet conditionally
        if (!overallSuccess && finalApiError) {
            contentResponse.push({ type: 'text', text: `\n--- Error Snippet ---\n...${safeErrorReport(finalApiError).slice(-300)}` });
        }

        return {
            content: contentResponse,
            isError: !overallSuccess,
            _meta: {
                success: overallSuccess,
                outputFilePath: outputFilePath,
                fileSaveSuccess: fileSaveSuccess,
                apiError: safeErrorReport(finalApiError), // Report specific API or related error
                errorType: finalErrorType
            }
        };
    }
);

// --- Main Execution ---
async function main() {
    log(`--- Starting server v2 ---`);
    log(`Initial process.cwd() = ${process.cwd()}`); // Log initial CWD once

    log(`Starting ${serverName} v${serverVersion}`);

    try {
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error(`${serverName} v${serverVersion} running on stdio`);
        log(`Server connected via stdio.`);
    } catch (error: any) {
        console.error("Fatal error in main():", error);
        log(`Fatal error in main(): ${safeErrorReport(error)}`);
        process.exit(1);
    }
}

main().catch((error: any) => {
  console.error("Fatal error outside main():", error);
  log(`Fatal error outside main(): ${safeErrorReport(error)}`);
  process.exit(1);
});

// Graceful shutdown handlers
process.on('SIGTERM', () => {
  log('SIGTERM signal received: closing.');
  process.exit(0);
});
process.on('SIGINT', () => {
  log('SIGINT signal received: closing.');
  process.exit(0);
});