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
// REMOVED: PREFERRED_OPENROUTER_MODELS array is no longer needed as models are configured externally.
// const PREFERRED_OPENROUTER_MODELS: string[] = [
//     'openrouter/google/gemini-2.5-pro-exp-03-25:free',
//     ...
// ];
const DEFAULT_ARCHITECT_MODEL = process.env.DEFAULT_ARCHITECT_MODEL; // Keep for generate_aider_commands default
const DEFAULT_EDITOR_MODEL = process.env.DEFAULT_EDITOR_MODEL; // Keep for generate_aider_commands default and callOpenRouter
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
        return "'" + arg.replace(/'/g, "'\\''") + "'";
    }
    return arg;
}
// Create server instance
const server = new McpServer({
    name: "giizhendam-aabajichiganan-mcp",
    version: "0.2.33", // Increment version to match package.json
    capabilities: { resources: {}, tools: {} },
});
// Register the 'run_aider_task' tool (Replaces generate_aider_commands)
server.tool("run_aider_task", // Renamed tool
"Executes an aider task directly based on the provided parameters.", // Updated description
runAiderTaskParamsSchema.shape, // Use new schema
async (params) => {
    let stdoutData = '';
    let stderrData = '';
    try {
        const aiderCmdPath = params.aiderPath || 'aider';
        const architectModel = params.model || DEFAULT_ARCHITECT_MODEL || '';
        const editorModel = params.editorModel || DEFAULT_EDITOR_MODEL || '';
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
            stderr: `${stderrData}\n--- Tool Error ---\n${error.message}`,
            exitCode: null, // Indicate error state
            isError: true, // Standard MCP error flag
            _meta: {
                success: false,
                errorType: error.name || 'ToolExecutionError'
            }
        };
    }
});
// --- NEW TOOL DEFINITIONS START ---
// Placeholder helper function for simple text responses
function createPlaceholderResponse(toolName, params) {
    return { results: [`Tool: ${toolName}, Result: Placeholder response for tool '${toolName}'. Received params: ${JSON.stringify(params)}. Full implementation pending.`] };
}
// --- Tool: prompt ---
const promptParamsSchema = z.object({
    text: z.string().describe('The prompt text')
    // REMOVED: models_prefixed_by_provider parameter
});
server.tool("prompt", "Send a prompt to the configured default LLM model.", // Updated description
promptParamsSchema.shape, async (params) => {
    log(`Received prompt tool call with text: ${params.text.substring(0, 50)}...`);
    try {
        const result = await callOpenRouter(params.text);
        log(`Prompt tool call successful for model: ${result.model}`);
        return {
            content: [{ type: 'text', text: `Model: ${result.model}, Response: ${result.response}` }]
        };
    }
    catch (error) {
        log(`Error in prompt tool: ${error.message}`);
        // Ensure error return type matches MCP expected structure
        return {
            content: [{ type: 'text', text: `Failed to process prompt: ${error.message}` }],
            isError: true,
            _meta: { success: false }
        };
    }
});
// --- Tool: prompt_from_file ---
const promptFromFileParamsSchema = z.object({
    file: z.string().describe('Path to the file containing the prompt')
    // REMOVED: models_prefixed_by_provider parameter
});
server.tool("prompt_from_file", "Send a prompt from a file to the configured default LLM model.", // Updated description
promptFromFileParamsSchema.shape, async (params) => {
    log(`Received prompt_from_file tool call for file: ${params.file}`);
    try {
        // ... existing file reading logic ...
        const filePath = path.resolve(params.file); // Ensure absolute path
        log(`Reading file content from: ${filePath}`);
        const fileContent = await fsPromises.readFile(filePath, 'utf-8');
        log(`File content read successfully. Length: ${fileContent.length}`);
        const result = await callOpenRouter(fileContent);
        log(`Prompt_from_file tool call successful for model: ${result.model}`);
        return {
            content: [{ type: 'text', text: `Model: ${result.model}, Response from file ${params.file}: ${result.response}` }]
        };
    }
    catch (error) {
        log(`Error in prompt_from_file tool: ${error.message}`);
        const errorMessage = error.code === 'ENOENT'
            ? `Failed to process prompt from file: File not found at ${params.file}`
            : `Failed to process prompt from file: ${error.message}`;
        // Ensure error return type matches MCP expected structure
        return {
            content: [{ type: 'text', text: errorMessage }],
            isError: true,
            _meta: { success: false }
        };
    }
});
// --- Tool: prompt_from_file_to_file ---
// Placeholder - Implementation TBD
const promptFromFileToFileParamsSchema = z.object({
    file: z.string().describe('Path to the file containing the prompt'),
    // REMOVED: models_prefixed_by_provider parameter
    output_dir: z.string().optional().describe('Directory to save the response markdown files to')
});
server.tool("prompt_from_file_to_file", "Send a prompt from a file to the default LLM model and save response as markdown file", // Updated description
promptFromFileToFileParamsSchema.shape, async (params) => createPlaceholderResponse("prompt_from_file_to_file", params));
// --- Tool: ceo_and_board ---
// Placeholder - Implementation TBD
const ceoAndBoardParamsSchema = z.object({
    file: z.string().describe('Path to the file containing the prompt'),
    // REMOVED: ceo_model parameter
    // REMOVED: models_prefixed_by_provider parameter
    output_dir: z.string().optional().describe('Directory to save the response files and CEO decision')
});
server.tool("ceo_and_board", "Send a prompt to a 'CEO' model (using default config) based on generated 'board member' responses (placeholder)", // Updated description
ceoAndBoardParamsSchema.shape, async (params) => createPlaceholderResponse("ceo_and_board", params));
// --- Tool: finance_experts ---
// Placeholder - Implementation TBD
// ... existing definition ...
// --- NEW TOOL DEFINITIONS END ---
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
// Ensure default models have fallbacks if env vars are not set
if (!DEFAULT_ARCHITECT_MODEL) {
    console.warn('Warning: DEFAULT_ARCHITECT_MODEL environment variable not set. Aider command generation might fail if not overridden.');
    // Optionally set a hardcoded fallback, but relying on env is better
}
if (!DEFAULT_EDITOR_MODEL) {
    console.warn('Warning: DEFAULT_EDITOR_MODEL environment variable not set. API calls will likely fail.');
    // Optionally set a hardcoded fallback, but relying on env is better
}
// Helper function to call OpenRouter API (simplified)
async function callOpenRouter(prompt) {
    if (!OPENROUTER_API_KEY) {
        throw new Error("OpenRouter API key (OPENROUTER_API_KEY) is not configured.");
    }
    if (!DEFAULT_EDITOR_MODEL) { // Use the configured default editor model
        throw new Error("Default editor model (DEFAULT_EDITOR_MODEL) is not configured for API calls.");
    }
    // Strip the :free suffix if present, as the direct API endpoint doesn't expect it.
    const modelToCall = DEFAULT_EDITOR_MODEL.replace(/:free$/, '');
    log(`Calling OpenRouter API for model: ${modelToCall} (derived from ${DEFAULT_EDITOR_MODEL})`);
    try {
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: modelToCall, // Use the stripped model ID
                messages: [{ role: 'user', content: prompt }],
            }),
        });
        log(`OpenRouter API response status: ${response.status}`);
        if (!response.ok) {
            const errorBody = await response.text();
            log(`OpenRouter API error: ${errorBody}`);
            throw new Error(`OpenRouter API request failed with status ${response.status}: ${errorBody}`);
        }
        const data = await response.json();
        log(`OpenRouter API response data received.`);
        // Extract the response content - structure may vary slightly based on API
        const responseContent = data.choices?.[0]?.message?.content || 'No response content found.';
        return { model: modelToCall, response: responseContent };
    }
    catch (error) {
        log(`Error calling OpenRouter: ${error.message}`);
        // Re-throw or handle as appropriate for the MCP tool response
        throw error;
    }
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
//# sourceMappingURL=index.js.map