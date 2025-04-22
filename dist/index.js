#!/usr/bin/env node
/**
 * ᑮᔐᓐᑕᒻ ᐋᐸᒋᒋᑲᓇᓐ (Giizhendam Aabajichiganan) MCP Server
 * A Meta-Cognitive Programming server implementing the MCP protocol.
 * Traditional Anishinaabe'mowin Name: ᑮᔐᓐᑕᒻ ᐋᐸᒋᒋᑲᓇᓐ
 * Romanized: Giizhendam Aabajichiganan
 *
 * Registered MCP Tools (Most delegate to aider):
 * - run_aider_directly: Executes an aider task directly, providing full control over arguments.
 * - prompt: Sends a text prompt to aider (taskType='code').
 * - prompt_from_file: Sends a prompt read from a file to aider (taskType='code').
 * - prompt_from_file_to_file: Runs the same prompt from a file through aider TWICE for verification, saving both responses to a file.
 * - ceo_and_board: Simulates a board discussion by querying an LLM (via aider) for each specified board member role based on a topic, appending results to a file (e.g., ceo_board_report.md).
 * - finance_experts: Simulates querying multiple financial experts (LLM via aider) for each specified role based on a query, appending results to a file (e.g., finance_experts_analysis.md).
 */
// import dotenv from 'dotenv'; // Remove dotenv import
// dotenv.config(); // Remove dotenv configuration call
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { spawn } from "child_process"; // Import spawn
import fs from 'fs';
import path from 'path';
import fsPromises from 'fs/promises'; // Use promises version of fs
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
    'openrouter/anthropic/claude-3.5-sonnet' // Assumed mapping for Claude 3.7 Sonnet
];
// Use ?? for safer default handling (only overrides null/undefined)
const DEFAULT_ARCHITECT_MODEL = process.env.DEFAULT_ARCHITECT_MODEL ?? PREFERRED_OPENROUTER_MODELS[0];
const DEFAULT_EDITOR_MODEL = process.env.DEFAULT_EDITOR_MODEL ?? PREFERRED_OPENROUTER_MODELS[0];
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
 * Input schema for the run_aider_task tool
 * (Previously generate_aider_commands)
 * Executes an aider command directly.
 */
// REMOVE START
const runAiderTaskParamsSchema = z.object({
    files: z.array(z.string()).optional()
        .describe('List of files for aider to operate on. Add only files needing modification.'),
    message: z.string()
        .describe('The specific task or request for aider. This will be combined with task-specific prompting.'),
    taskType: z.enum(TASK_TYPES)
        .describe('The type of task to perform, determining the agent\'s role and behavior.'),
    model: z.string().optional()
        .describe(`Override the default architect model. See README for recommended models.`),
    editorModel: z.string().optional()
        .describe(`Override the default editor model. See README for recommended models.`),
    architect: z.boolean().optional()
        .describe('Enable/disable architect mode. Default: true'),
    noDetectUrls: z.boolean().optional()
        .describe('Disable URL detection in messages. Default: true'),
    noAutoCommit: z.boolean().optional()
        .describe('Disable automatic git commits. Default: true'),
    yesAlways: z.boolean().optional().default(true)
        .describe('Automatically confirm all prompts. Default: true'),
    aiderPath: z.string().optional().default('aider')
        .describe('Path to the aider executable. Defaults to "aider" in PATH.'),
    extraArgs: z.array(z.string()).optional()
        .describe('Additional command-line arguments to pass to aider.')
});
/**
 * Output schema for the run_aider_task tool
 */
const runAiderTaskOutputSchema = z.object({
    stdout: z.string().describe('Standard output from the aider command execution.'),
    stderr: z.string().describe('Standard error output from the aider command execution.'),
    exitCode: z.number().nullable().describe('The exit code of the aider process (null if killed).')
});
// Helper to escape shell arguments (basic version, might need refinement)
function escapeShellArg(arg) {
    // Simple escaping for demonstration; robust escaping is complex.
    // This handles spaces and basic special characters for common shells.
    if (/[^A-Za-z0-9_\/:=-]/.test(arg)) {
        return "'" + arg.replace(/'/g, "'\''") + "'";
    }
    return arg;
}
// REMOVE END
// Create server instance
const server = new McpServer({
    name: "giizhendam-aabajichiganan-mcp",
    version: "0.2.33", // Increment version to match package.json
    capabilities: { resources: {}, tools: {} },
});
// Register the 'run_aider_task' tool (Replaces generate_aider_commands)
// REMOVE START
server.tool("run_aider_task", // Renamed tool
"Executes an aider task directly based on the provided parameters.", // Updated description
runAiderTaskParamsSchema.shape, // Use new schema
async (params) => {
    let stdoutData = '';
    let stderrData = '';
    try {
        const aiderCmdPath = params.aiderPath || 'aider';
        const architectModel = params.model ?? DEFAULT_ARCHITECT_MODEL;
        const editorModel = params.editorModel ?? DEFAULT_EDITOR_MODEL;
        if (!architectModel) {
            throw new Error('Architect model is not configured (check DEFAULT_ARCHITECT_MODEL env var or provide \'model\' param).');
        }
        if (!editorModel) {
            throw new Error('Editor model is not configured (check DEFAULT_EDITOR_MODEL env var or provide \'editorModel\' param).');
        }
        const useArchitect = params.architect ?? BASE_FLAGS.architect;
        const useNoDetectUrls = params.noDetectUrls ?? BASE_FLAGS.noDetectUrls;
        const useNoAutoCommit = params.noAutoCommit ?? BASE_FLAGS.noAutoCommit;
        const useYesAlways = params.yesAlways ?? BASE_FLAGS.yesAlways;
        const taskBasePrompt = TASK_PROMPTS[params.taskType];
        const fullPrompt = `${taskBasePrompt} ${params.message}`;
        const aiderArgs = []; // Just the arguments, not the command itself
        aiderArgs.push('--model', architectModel); // Use non-escaped model names for spawn
        aiderArgs.push('--editor-model', editorModel);
        if (useArchitect)
            aiderArgs.push('--architect');
        if (useNoDetectUrls)
            aiderArgs.push('--no-detect-urls');
        if (useNoAutoCommit)
            aiderArgs.push('--no-auto-commit');
        if (useYesAlways)
            aiderArgs.push('--yes-always');
        if (params.files && params.files.length > 0) {
            aiderArgs.push(...params.files);
        }
        if (params.extraArgs) {
            aiderArgs.push(...params.extraArgs);
        }
        aiderArgs.push('--message', fullPrompt); // Pass the full prompt directly
        log(`Executing aider: ${aiderCmdPath} ${aiderArgs.join(' ')}`);
        // Execute using spawn
        const aiderProcess = spawn(aiderCmdPath, aiderArgs, {
            stdio: ['pipe', 'pipe', 'pipe'] // Pipe stdin, stdout, stderr
            // Consider adding cwd if necessary, but usually inherits from server process
        });
        // Capture stdout
        aiderProcess.stdout.on('data', (data) => {
            const chunk = data.toString();
            stdoutData += chunk;
            log(`Aider stdout: ${chunk.substring(0, 100)}...`); // Log snippets
        });
        // Capture stderr
        aiderProcess.stderr.on('data', (data) => {
            const chunk = data.toString();
            stderrData += chunk;
            log(`Aider stderr: ${chunk.substring(0, 100)}...`); // Log snippets
        });
        // Wait for the process to exit
        const exitCode = await new Promise((resolve, reject) => {
            aiderProcess.on('close', (code) => {
                log(`Aider process exited with code: ${code}`);
                resolve(code);
            });
            aiderProcess.on('error', (err) => {
                log(`Failed to start aider process: ${err.message}`);
                reject(err);
            });
        });
        // Return captured output according to the new schema
        return {
            content: [], // Base content required by MCP
            stdout: stdoutData,
            stderr: stderrData,
            exitCode: exitCode,
            _meta: { success: exitCode === 0 } // Indicate success based on exit code
        };
    }
    catch (error) {
        log(`Error in run_aider_task: ${error.message}`);
        // Return a structured error response matching the *tool output schema*
        return {
            content: [],
            stdout: stdoutData, // Include any stdout captured before error
            stderr: `${stderrData}
--- Tool Error ---
${error.message}`,
            exitCode: null, // Indicate error state
            isError: true, // Standard MCP error flag
            _meta: {
                success: false,
                errorType: error.name || 'ToolExecutionError'
            }
        };
    }
});
// REMOVE END
// --- NEW TOOL DEFINITIONS START ---
// Placeholder helper function for simple text responses
function createPlaceholderResponse(toolName, params) {
    return { results: [`Tool: ${toolName}, Result: Placeholder response for tool '${toolName}'. Received params: ${JSON.stringify(params)}. Full implementation pending.`] };
}
// --- Tool: prompt ---
const promptParamsSchema = z.object({
    text: z.string().describe('The prompt text')
});
server.tool("prompt", "Sends a text prompt to aider (taskType='code').", // Updated description
promptParamsSchema.shape, async (params) => {
    log(`Received prompt tool call with text: ${params.text.substring(0, 50)}...`);
    try {
        const result = await executeAiderViaSpawn({
            message: params.text,
            taskType: 'code' // Use 'code' task type for general prompts
        });
        log(`Prompt tool call via aider successful. Exit code: ${result._meta?.exitCode}`);
        // Return aider's stdout/stderr in the MCP response
        return {
            content: [
                { type: 'text', text: `Aider Stdout:\n${result._meta?.stdout ?? ''}` },
                ...(result._meta?.stderr ? [{ type: 'text', text: `Aider Stderr:\n${result._meta.stderr}` }] : [])
            ],
            isError: result.isError,
            _meta: result._meta
        };
    }
    catch (error) {
        log(`Error in prompt tool (via aider): ${error.message}`);
        return {
            content: [{ type: 'text', text: `Failed to process prompt via aider: ${error.message}` }],
            isError: true,
            _meta: { success: false, errorType: 'ToolExecutionError', stdout: '', stderr: error.message, exitCode: null, executedCommand: 'N/A' } // Add required _meta fields
        };
    }
});
// --- Tool: prompt_from_file ---
const promptFromFileParamsSchema = z.object({
    file: z.string().describe('Path to the file containing the prompt')
});
server.tool("prompt_from_file", "Sends a prompt read from a file to aider (taskType='code').", // Updated description
promptFromFileParamsSchema.shape, async (params) => {
    log(`Received prompt_from_file tool call for file: ${params.file}`);
    try {
        const filePath = path.resolve(params.file);
        log(`Reading file content from: ${filePath}`);
        const fileContent = await fsPromises.readFile(filePath, 'utf-8');
        log(`File content read successfully. Length: ${fileContent.length}`);
        const result = await executeAiderViaSpawn({
            message: fileContent,
            taskType: 'code' // Use 'code' task type for general prompts
        });
        log(`Prompt_from_file tool call via aider successful. Exit code: ${result._meta?.exitCode}`);
        return {
            content: [
                { type: 'text', text: `Aider Stdout (from file ${params.file}):\n${result._meta?.stdout ?? ''}` },
                ...(result._meta?.stderr ? [{ type: 'text', text: `Aider Stderr:\n${result._meta.stderr}` }] : [])
            ],
            isError: result.isError,
            _meta: result._meta
        };
    }
    catch (error) {
        const isFileNotFound = error.code === 'ENOENT';
        const errorMessage = isFileNotFound
            ? `Failed to read prompt file: File not found at ${params.file}`
            : `Failed to process prompt from file via aider: ${error.message}`;
        log(`Error in prompt_from_file tool (via aider): ${errorMessage}`);
        return {
            content: [{ type: 'text', text: errorMessage }],
            isError: true,
            _meta: { success: false, errorType: isFileNotFound ? 'FileNotFound' : 'ToolExecutionError', stdout: '', stderr: errorMessage, exitCode: null, executedCommand: 'N/A' }
        };
    }
});
// --- Tool: prompt_from_file_to_file ---
const promptFromFileToFileParamsSchema = z.object({
    file: z.string().describe('Path to the file containing the prompt'),
    output_dir: z.string().optional().describe('Directory to save the response markdown file to. Defaults to current directory.'),
    // Add optional taskType override for flexibility
    taskType: z.enum(TASK_TYPES).optional().default('code').describe('Optional: Task type for aider (e.g., code, verify). Defaults to code.')
});
server.tool("prompt_from_file_to_file", "Runs the same prompt from a file through aider TWICE for verification, saving both responses to a file.", // Updated description
promptFromFileToFileParamsSchema.shape, async (params) => {
    log(`Received prompt_from_file_to_file (verification run) tool call for file: ${params.file}`);
    let fileContent = '';
    let inputFilePath = '';
    try {
        inputFilePath = path.resolve(params.file);
        log(`Reading file content from: ${inputFilePath}`);
        fileContent = await fsPromises.readFile(inputFilePath, 'utf-8');
        log(`File content read successfully. Length: ${fileContent.length}`);
        // --- Run 1 ---
        log(`Starting first aider run for ${params.file}`);
        const aiderResult1 = await executeAiderViaSpawn({
            message: fileContent,
            taskType: params.taskType ?? 'code' // Use provided or default taskType
        });
        log(`Aider run 1 finished. Exit code: ${aiderResult1._meta?.exitCode}`);
        // --- Run 2 ---
        log(`Starting second aider run for ${params.file}`);
        const aiderResult2 = await executeAiderViaSpawn({
            message: fileContent,
            taskType: params.taskType ?? 'code' // Use same taskType
        });
        log(`Aider run 2 finished. Exit code: ${aiderResult2._meta?.exitCode}`);
        // Determine output path
        const outputDir = params.output_dir ? path.resolve(params.output_dir) : process.cwd();
        const inputFilename = path.basename(inputFilePath);
        const outputFilename = `${inputFilename}.response.md`;
        const outputFilePath = path.join(outputDir, outputFilename);
        log(`Attempting to write both aider responses to: ${outputFilePath}`);
        await fsPromises.mkdir(outputDir, { recursive: true });
        // Combine outputs
        const outputContent = `# Verification Runs for Prompt: ${inputFilename}\n\n` +
            `--- Run 1 (Exit Code: ${aiderResult1._meta?.exitCode ?? 'N/A'}) ---\n` +
            `${aiderResult1._meta?.stdout || '(No stdout for run 1)'}\n` +
            `${aiderResult1._meta?.stderr ? `\n**Stderr Run 1:**\n${aiderResult1._meta.stderr}\n` : ''}` +
            `\n--- Run 2 (Exit Code: ${aiderResult2._meta?.exitCode ?? 'N/A'}) ---\n` +
            `${aiderResult2._meta?.stdout || '(No stdout for run 2)'}\n` +
            `${aiderResult2._meta?.stderr ? `\n**Stderr Run 2:**\n${aiderResult2._meta.stderr}\n` : ''}`;
        await fsPromises.writeFile(outputFilePath, outputContent);
        log(`Successfully wrote both aider responses to ${outputFilePath}`);
        // Determine overall success (both runs must succeed)
        const overallSuccess = (aiderResult1._meta?.success ?? false) && (aiderResult2._meta?.success ?? false);
        if (overallSuccess) {
            return {
                content: [
                    { type: 'text', text: `Successfully processed prompt from ${params.file} via aider twice and saved combined response to ${outputFilePath}.` }
                ],
                isError: false,
                _meta: { success: true, outputFilePath: outputFilePath, run1_exitCode: aiderResult1._meta?.exitCode, run2_exitCode: aiderResult2._meta?.exitCode }
            };
        }
        else {
            return {
                content: [
                    { type: 'text', text: `One or both aider verification runs failed for prompt from ${params.file}. Combined response saved to ${outputFilePath}.` },
                    { type: 'text', text: `Run 1 Exit Code: ${aiderResult1._meta?.exitCode ?? 'N/A'}, Run 2 Exit Code: ${aiderResult2._meta?.exitCode ?? 'N/A'}` }
                ],
                isError: true,
                _meta: { success: false, outputFilePath: outputFilePath, run1_exitCode: aiderResult1._meta?.exitCode, run2_exitCode: aiderResult2._meta?.exitCode, run1_stderr: aiderResult1._meta?.stderr, run2_stderr: aiderResult2._meta?.stderr }
            };
        }
    }
    catch (error) {
        // Handle file reading errors or other unexpected issues
        let errorMessage = `Failed to process prompt from file to file (verification run): ${error.message}`;
        let errorType = 'ToolExecutionError';
        const isFileNotFound = error.code === 'ENOENT' && error.path === inputFilePath;
        const isFileWriteError = error.syscall === 'open' || error.syscall === 'write';
        if (isFileNotFound) {
            errorMessage = `Failed to read prompt file: File not found at ${params.file}`;
            errorType = 'FileNotFound';
        }
        else if (isFileWriteError) {
            errorMessage = `Failed to write response file: ${error.message}`;
            errorType = 'FileWriteError';
        }
        log(`Error in prompt_from_file_to_file tool: ${errorMessage}`);
        return {
            content: [{ type: 'text', text: errorMessage }],
            isError: true,
            _meta: { success: false, errorType: errorType, stderr: errorMessage }
        };
    }
});
// --- Tool: ceo_and_board ---
// Updated Schema for multi-agent simulation
const ceoAndBoardParamsSchema = z.object({
    topic: z.string().describe('The central topic or question for the board to discuss.'),
    board_members: z.array(z.string()).min(1).describe('A list of board member roles (e.g., ["CTO", "CFO", "Legal Counsel"]).'),
    output_file: z.string().optional().describe('Optional path for the output report file. Defaults to ./ceo_board_report.md')
});
server.tool("ceo_and_board", "Simulates a board discussion by querying an LLM (via aider) for each specified board member role based on a topic, appending results to a file.", // Updated description
ceoAndBoardParamsSchema.shape, async (params) => {
    log(`Received ceo_and_board simulation call for topic: ${params.topic}`);
    const { topic, board_members, output_file } = params;
    const defaultFilename = 'ceo_board_report.md';
    const reportFilePath = path.resolve(output_file || defaultFilename);
    log(`Report will be saved to: ${reportFilePath}`);
    try {
        // Clear or create the report file initially
        await fsPromises.writeFile(reportFilePath, `# CEO Board Report: ${topic}\n\n`);
        log(`Initialized report file: ${reportFilePath}`);
        let allSucceeded = true;
        const errors = [];
        for (const memberRole of board_members) {
            log(`Querying board member: ${memberRole}`);
            // Construct a prompt specific to the role
            const memberPrompt = `Acting as the ${memberRole} of the board, provide your perspective, key considerations, and recommendations regarding the following topic: ${topic}`;
            // Call aider for this member's perspective
            const result = await executeAiderViaSpawn({
                message: memberPrompt,
                taskType: 'research' // Research seems appropriate for synthesizing a perspective
            });
            if (result.isError || !result._meta?.success) {
                allSucceeded = false;
                const errorMsg = `Failed to get perspective from ${memberRole}. Error: ${result._meta?.stderr || 'Unknown aider error'}`;
                log(errorMsg);
                errors.push(errorMsg);
                // Append error marker to report
                await fsPromises.appendFile(reportFilePath, `\n---\n## Perspective from ${memberRole}\n\n**ERROR:** Failed to retrieve perspective. Aider stderr: ${result._meta?.stderr || 'N/A'}\n`);
            }
            else {
                // Append successful response to the report file
                const responseContent = result._meta?.stdout || '(No response content)';
                await fsPromises.appendFile(reportFilePath, `\n---\n## Perspective from ${memberRole}\n\n${responseContent}\n`);
                log(`Successfully appended perspective from ${memberRole} to report.`);
            }
        }
        // Construct final response
        if (allSucceeded) {
            return {
                content: [{ type: 'text', text: `Board simulation complete. Report saved to: ${reportFilePath}` }],
                isError: false,
                _meta: { success: true, outputFilePath: reportFilePath }
            };
        }
        else {
            return {
                content: [
                    { type: 'text', text: `Board simulation completed with errors. Report saved to: ${reportFilePath}` },
                    { type: 'text', text: `Errors encountered:\n${errors.join('\n')}` }
                ],
                isError: true,
                _meta: { success: false, outputFilePath: reportFilePath, errors: errors }
            };
        }
    }
    catch (error) {
        log(`Fatal error during ceo_and_board simulation: ${error.message}`);
        return {
            content: [{ type: 'text', text: `Fatal error during simulation: ${error.message}` }],
            isError: true,
            _meta: { success: false, errorType: 'SimulationError', stderr: error.message }
        };
    }
});
const FINANCIAL_EXPERT_PERSONAS = [
    {
        role: "Risk Analyst",
        promptTemplate: (query) => `You are a meticulous Risk Analyst AI. Analyze the following query focusing *exclusively* on identifying potential risks (financial, operational, market, regulatory, reputational), quantifying them where possible, and suggesting mitigation strategies. Avoid discussing potential upsides. Be objective and data-driven. Query: ${query}`
    },
    {
        role: "Market Strategist",
        promptTemplate: (query) => `You are a forward-looking Market Strategist AI. Analyze the following query focusing on market trends, competitive landscape, potential growth opportunities, and strategic positioning. Provide actionable insights and potential strategic moves. Query: ${query}`
    },
    {
        role: "Economist",
        promptTemplate: (query) => `You are an Economist AI. Analyze the following query from a macroeconomic perspective. Consider relevant economic indicators, potential impacts of fiscal/monetary policy, and broader economic factors. Explain the underlying economic principles. Query: ${query}`
    },
    {
        role: "Accountant",
        promptTemplate: (query) => `You are a detail-oriented Accountant AI. Analyze the following query strictly from a financial accounting and reporting perspective. Focus on the accuracy of financial statements, compliance with standards (e.g., GAAP/IFRS if applicable), key financial ratios derived directly from standard statements, and potential red flags in financial reporting. Do not speculate on market strategy or future growth. Query: ${query}`
    }
];
// --- End Predefined Personas ---
// --- Tool: finance_experts ---
// Updated Schema: Takes query, uses predefined internal experts
const financeExpertsParamsSchema = z.object({
    query: z.string().describe('The central financial query or topic for the experts to deliberate on.'),
    output_file: z.string().optional().describe('Optional path for the output analysis file. Defaults to ./finance_experts_analysis.md')
    // REMOVED: expert_roles parameter
});
server.tool("finance_experts", "Simulates deliberation by querying predefined financial expert personas (via aider) based on a user query, appending results to a file.", // Updated description
financeExpertsParamsSchema.shape, async (params) => {
    log(`Received finance_experts deliberation call for query: ${params.query}`);
    const { query, output_file } = params;
    const defaultFilename = 'finance_experts_analysis.md';
    const analysisFilePath = path.resolve(output_file || defaultFilename);
    log(`Analysis will be saved to: ${analysisFilePath}`);
    try {
        // Initialize the analysis file
        await fsPromises.writeFile(analysisFilePath, `# Financial Experts Analysis: ${query}\n\n`);
        log(`Initialized analysis file: ${analysisFilePath}`);
        let allSucceeded = true;
        const errors = [];
        // Iterate through the PREDEFINED personas
        for (const expert of FINANCIAL_EXPERT_PERSONAS) {
            log(`Querying financial expert persona: ${expert.role}`);
            // Construct the prompt using the persona's template
            const expertPrompt = expert.promptTemplate(query);
            // Call aider for this expert's analysis
            const result = await executeAiderViaSpawn({
                message: expertPrompt,
                taskType: 'research' // Research seems appropriate for deliberation
            });
            if (result.isError || !result._meta?.success) {
                allSucceeded = false;
                const errorMsg = `Failed to get analysis from ${expert.role}. Error: ${result._meta?.stderr || 'Unknown aider error'}`;
                log(errorMsg);
                errors.push(errorMsg);
                // Append error marker to report
                await fsPromises.appendFile(analysisFilePath, `\n---\n## Analysis from ${expert.role}\n\n**ERROR:** Failed to retrieve analysis. Aider stderr: ${result._meta?.stderr || 'N/A'}\n`);
            }
            else {
                // Append successful response to the analysis file
                const responseContent = result._meta?.stdout || '(No response content)';
                await fsPromises.appendFile(analysisFilePath, `\n---\n## Analysis from ${expert.role}\n\n${responseContent}\n`);
                log(`Successfully appended analysis from ${expert.role} to report.`);
            }
        }
        // Construct final response
        if (allSucceeded) {
            return {
                content: [{ type: 'text', text: `Financial experts deliberation complete. Analysis saved to: ${analysisFilePath}` }],
                isError: false,
                _meta: { success: true, outputFilePath: analysisFilePath }
            };
        }
        else {
            return {
                content: [
                    { type: 'text', text: `Financial experts deliberation completed with errors. Analysis saved to: ${analysisFilePath}` },
                    { type: 'text', text: `Errors encountered:\n${errors.join('\n')}` }
                ],
                isError: true,
                _meta: { success: false, outputFilePath: analysisFilePath, errors: errors }
            };
        }
    }
    catch (error) {
        log(`Fatal error during finance_experts deliberation: ${error.message}`);
        return {
            content: [{ type: 'text', text: `Fatal error during deliberation: ${error.message}` }],
            isError: true,
            _meta: { success: false, errorType: 'DeliberationError', stderr: error.message }
        };
    }
});
// --- NEW TOOL DEFINITIONS END ---
// Ensure default models have fallbacks if env vars are not set
if (!DEFAULT_ARCHITECT_MODEL) {
    console.warn('Warning: DEFAULT_ARCHITECT_MODEL environment variable not set. Aider commands might fail if not overridden.');
}
if (!DEFAULT_EDITOR_MODEL) {
    console.warn('Warning: DEFAULT_EDITOR_MODEL environment variable not set. Aider commands will likely fail.');
}
// Logging function
function log(message) {
    try {
        fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${message}\\n`);
    }
    catch (error) {
        console.error(`Unable to write to log file: ${error.message}`);
    }
}
// Update helper function to return the McpToolResponse type
async function executeAiderViaSpawn(params) {
    // This function encapsulates the spawn logic previously in run_aider_directly
    return new Promise((resolve) => {
        const aiderCmdPath = params.aiderPath ?? 'aider';
        const architectModel = params.model ?? DEFAULT_ARCHITECT_MODEL;
        const editorModel = params.editorModel ?? DEFAULT_EDITOR_MODEL;
        if (!architectModel || !editorModel) {
            const errorMsg = !architectModel
                ? "Architect model is not configured (check DEFAULT_ARCHITECT_MODEL env var or provide 'model' param)."
                : "Editor model is not configured (check DEFAULT_EDITOR_MODEL env var or provide 'editorModel' param).";
            log(`Configuration Error: ${errorMsg}`);
            // Ensure content objects use literal type 'text'
            resolve({
                content: [{ type: "text", text: `Configuration Error: ${errorMsg}` }],
                isError: true,
                _meta: { success: false, exitCode: null, stdout: '', stderr: errorMsg, executedCommand: 'N/A', errorType: 'ConfigurationError' }
            });
            return;
        }
        const useArchitect = params.architect ?? BASE_FLAGS.architect;
        const useNoDetectUrls = params.noDetectUrls ?? BASE_FLAGS.noDetectUrls;
        const useNoAutoCommit = params.noAutoCommit ?? BASE_FLAGS.noAutoCommit;
        const useYesAlways = params.yesAlways ?? BASE_FLAGS.yesAlways;
        const taskBasePrompt = TASK_PROMPTS[params.taskType];
        const fullPrompt = `${taskBasePrompt} ${params.message}`;
        const args = [];
        args.push('--model', architectModel);
        args.push('--editor-model', editorModel);
        if (useArchitect)
            args.push('--architect');
        if (useNoDetectUrls)
            args.push('--no-detect-urls');
        if (useNoAutoCommit)
            args.push('--no-auto-commit');
        if (useYesAlways)
            args.push('--yes-always');
        if (params.files && params.files.length > 0) {
            args.push(...params.files);
        }
        if (params.extraArgs) {
            args.splice(2, 0, ...params.extraArgs);
        }
        args.push('--message', fullPrompt);
        const executedCommand = `${aiderCmdPath} ${args.join(' ')}`;
        log(`Executing aider via helper: ${executedCommand}`);
        let stdoutData = '';
        let stderrData = '';
        let exitCode = null;
        try {
            const aiderProcess = spawn(aiderCmdPath, args, {
                stdio: ['pipe', 'pipe', 'pipe'],
                cwd: process.cwd(),
                env: process.env
            });
            aiderProcess.stdout.on('data', (data) => {
                const chunk = data.toString();
                stdoutData += chunk;
                log(`Aider stdout: ${chunk.substring(0, 100)}...`);
            });
            aiderProcess.stderr.on('data', (data) => {
                const chunk = data.toString();
                stderrData += chunk;
                log(`Aider stderr: ${chunk.substring(0, 100)}...`);
            });
            aiderProcess.on('error', (error) => {
                log(`Failed to start aider process: ${error.message}`);
                stderrData += `\nFailed to start process: ${error.message}`;
                // Ensure content objects use literal type 'text'
                resolve({
                    content: [{ type: "text", text: `Failed to start aider: ${error.message}` }],
                    isError: true,
                    _meta: { success: false, exitCode: null, stdout: stdoutData, stderr: stderrData, executedCommand: executedCommand, errorType: 'SpawnError' }
                });
            });
            aiderProcess.on('close', (code) => {
                exitCode = code;
                const success = code === 0;
                log(`Aider process exited with code ${code}`);
                // Ensure content objects use literal type 'text'
                resolve({
                    content: [{ type: "text", text: `Aider process finished with exit code ${code}.` }],
                    isError: !success,
                    _meta: { success: success, exitCode: exitCode, stdout: stdoutData, stderr: stderrData, executedCommand: executedCommand }
                });
            });
        }
        catch (error) {
            log(`Error spawning aider process: ${error.message}`);
            // Ensure content objects use literal type 'text'
            resolve({
                content: [{ type: "text", text: `Error spawning aider: ${error.message}` }],
                isError: true,
                _meta: { success: false, exitCode: null, stdout: stdoutData, stderr: `Spawn error: ${error.message}`, executedCommand: executedCommand, errorType: 'CatchError' }
            });
        }
    });
}
// --- End Aider Execution Helper ---
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
// Add graceful shutdown
process.on('SIGTERM', () => {
    log('SIGTERM signal received: closing HTTP server');
    // Add cleanup logic if needed, e.g., closing database connections
    process.exit(0);
});
process.on('SIGINT', () => {
    log('SIGINT signal received: closing HTTP server');
    // Add cleanup logic if needed
    process.exit(0);
});
// --- NEW TOOL: Run Aider Directly ---
// Input schema similar to generate_aider_commands
const runAiderDirectlyParamsSchema = z.object({
    files: z.array(z.string()).optional()
        .describe('List of files for aider to operate on. Add ONLY files needing modification or creation.'),
    message: z.string()
        .describe('The specific task or request for aider. This will be combined with task-specific prompting.'),
    taskType: z.enum(TASK_TYPES)
        .describe("The type of task to perform, determining the agent's role and behavior."),
    model: z.string().optional()
        .describe(`Override the default architect model (Default: ${DEFAULT_ARCHITECT_MODEL}).`),
    editorModel: z.string().optional()
        .describe(`Override the default editor model (Default: ${DEFAULT_EDITOR_MODEL}).`),
    architect: z.boolean().optional()
        .describe('Enable/disable architect mode. Default: true'),
    noDetectUrls: z.boolean().optional()
        .describe('Disable URL detection in messages. Default: true'),
    noAutoCommit: z.boolean().optional()
        .describe('Disable automatic git commits. Default: true'),
    yesAlways: z.boolean().optional().default(true)
        .describe('Automatically confirm all prompts. Default: true'),
    aiderPath: z.string().optional().default('aider')
        .describe('Path to the aider executable. Defaults to "aider" in PATH.'),
    extraArgs: z.array(z.string()).optional()
        .describe('Additional command-line arguments to pass to aider.')
});
// Output schema for the run_aider_directly tool - Describes fields within _meta
const runAiderDirectlyOutputSchema = z.object({
    success: z.boolean().describe('True if the aider process exited with code 0, false otherwise.'),
    exitCode: z.number().nullable().describe('The exit code of the aider process, or null if it terminated abnormally.'),
    stdout: z.string().describe('The captured standard output from the aider process.'),
    stderr: z.string().describe('The captured standard error from the aider process.'),
    executedCommand: z.string().describe('The command and arguments that were executed.')
});
// Register the 'run_aider_directly' tool
server.tool("run_aider_directly", "Executes an aider task directly, providing full control over arguments.", runAiderDirectlyParamsSchema.shape, async (params) => {
    log(`Received run_aider_directly call.`);
    try {
        // The helper function now returns the exact type needed
        const result = await executeAiderViaSpawn(params);
        log(`run_aider_directly call finished. Exit code: ${result._meta?.exitCode}`);
        return result;
    }
    catch (error) {
        log(`Unexpected error in run_aider_directly wrapper: ${error.message}`);
        // Return MCP-compatible error structure
        return {
            content: [{ type: 'text', text: `Unexpected error processing run_aider_directly: ${error.message}` }],
            isError: true,
            _meta: { success: false, exitCode: null, stdout: '', stderr: `Wrapper error: ${error.message}`, executedCommand: 'N/A', errorType: 'WrapperError' }
        };
    }
});
// --- Finance Experts Tool --- (This section seems misplaced, should be removed as it's defined earlier)
// ... existing code ...
//# sourceMappingURL=index.js.map