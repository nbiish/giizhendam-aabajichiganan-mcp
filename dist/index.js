"use strict";
/**
 * ᑮᔐᓐᑕᒻ ᐋᐸᒋᒋᑲᓇᓐ (Giizhendam Aabajichiganan) MCP Server v2
 * Interface to aider-cli-commands.sh script based on revised PRD.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const zod_1 = require("zod");
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const genai_1 = require("@google/genai");
// Setting up logging (Optional but recommended)
const LOG_FILE = '/tmp/giizhendam_mcp_v2_log.txt';
function log(message) {
    try {
        fs_1.default.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${message}\n`);
    }
    catch (error) {
        console.error(`Unable to write to log file: ${error.message}`);
    }
}
log(`--- Starting server v2 ---`);
// --- Configuration ---
// Path to the script we will be calling
const AIDER_SCRIPT_PATH = './aider-cli-commands.sh'; // Assuming it's in the root
// --- Server Setup ---
const serverName = "giizhendam-aabajichiganan-mcp-script-interface";
const serverVersion = "0.3.0"; // New version for the new architecture
const server = new mcp_js_1.McpServer({
    name: serverName,
    version: serverVersion,
    capabilities: { resources: {}, tools: {} },
});
// Aider Task Types and Configuration
const TASK_TYPES = ['research', 'docs', 'security', 'code', 'verify', 'progress'];
// Use environment variables for defaults, allowing override via params
// Helper to escape shell arguments (basic version, might need refinement)
function escapeShellArg(arg) {
    // Simple escaping for demonstration; robust escaping is complex.
    // This handles spaces and basic special characters for common shells.
    if (/[^A-Za-z0-9_\/:=-]/.test(arg)) {
        return "'" + arg.replace(/'/g, "'\\''") + "'";
    }
    return arg;
}
// --- Tool Implementations (To be added based on PRD) ---
// Helper function to execute the aider script
function executeAiderScript(subCommand, args) {
    return new Promise((resolve, reject) => {
        const fullArgs = [subCommand, ...args];
        const commandString = `${AIDER_SCRIPT_PATH} ${fullArgs.join(' ')}`;
        log(`Executing script: ${commandString}`);
        let stdoutData = '';
        let stderrData = '';
        try {
            const scriptProcess = (0, child_process_1.spawn)(AIDER_SCRIPT_PATH, fullArgs, {
                stdio: ['pipe', 'pipe', 'pipe'],
                cwd: process.cwd(), // Run script from the project root
                env: process.env
            });
            scriptProcess.stdout.on('data', (data) => {
                stdoutData += data.toString();
                log(`Script stdout: ${data.toString().substring(0, 100)}...`);
            });
            scriptProcess.stderr.on('data', (data) => {
                stderrData += data.toString();
                log(`Script stderr: ${data.toString().substring(0, 100)}...`);
            });
            scriptProcess.on('error', (error) => {
                log(`Failed to start script process: ${error.message}`);
                stderrData += `\nFailed to start script: ${error.message}`;
                // Reject on spawn error so the tool handler can catch it
                reject(new Error(`Failed to start script: ${error.message}`));
            });
            scriptProcess.on('close', (code) => {
                log(`Script process exited with code ${code}`);
                resolve({ stdout: stdoutData, stderr: stderrData, exitCode: code });
            });
        }
        catch (error) {
            log(`Error spawning script process: ${error.message}`);
            // Reject on catch error
            reject(new Error(`Error spawning script: ${error.message}`));
        }
    });
}
// --- Tool: prompt_aider ---
const promptAiderParamsSchema = zod_1.z.object({
    prompt_text: zod_1.z.string().describe("The main prompt/instruction for aider."),
    task_type: zod_1.z.enum(TASK_TYPES).optional().describe("Optional task type hint (research, docs, security, code, verify, progress)."),
    files: zod_1.z.array(zod_1.z.string()).optional().describe("Optional list of files for aider to consider or modify.")
    // Add other potential aider script params here if needed (e.g., model overrides)
});
// Output Schema (shared part for script execution tools)
const scriptExecutionOutputSchema = zod_1.z.object({
    success: zod_1.z.boolean().describe('True if the script process exited with code 0.'),
    exitCode: zod_1.z.number().nullable().describe('The exit code of the script process.'),
    stdout: zod_1.z.string().describe('The captured standard output from the script.'),
    stderr: zod_1.z.string().describe('The captured standard error from the script.'),
    executedCommand: zod_1.z.string().describe('The full command string executed.')
});
// Extend the meta schema to include output file path and saving status
const simulationOutputMetaSchema = scriptExecutionOutputSchema.extend({
    errorType: zod_1.z.string().optional().describe("Indicates error source: 'ExecutionError', 'ScriptError', 'FileSystemError'."),
    outputFilePath: zod_1.z.string().optional().describe("Path to the generated output file (if successful)."),
    fileSaveSuccess: zod_1.z.boolean().optional().describe("True if the output was successfully saved to the file.")
});
server.tool("prompt_aider", "Executes the 'prompt_aider' command from aider-cli-commands.sh with the given prompt and optional files/task type.", promptAiderParamsSchema.shape, (params) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    // Ensure scriptArgs are explicitly typed as string[]
    const scriptArgs = [];
    // Safely push prompt_text
    scriptArgs.push((_a = params.prompt_text) !== null && _a !== void 0 ? _a : ''); // Ensure it's always a string
    if (params.task_type) {
        scriptArgs.push(params.task_type);
    }
    if (params.files && params.files.length > 0) {
        scriptArgs.push(...params.files);
    }
    // Use the correctly typed scriptArgs for mapping
    const executedCommand = `${AIDER_SCRIPT_PATH} prompt_aider ${scriptArgs.map(escapeShellArg).join(' ')}`;
    let result = null;
    let error = null;
    try {
        result = yield executeAiderScript("prompt_aider", scriptArgs);
    }
    catch (e) {
        error = e;
    }
    const success = (result === null || result === void 0 ? void 0 : result.exitCode) === 0 && !error;
    const stdout = (_b = result === null || result === void 0 ? void 0 : result.stdout) !== null && _b !== void 0 ? _b : '';
    const stderr = `${(_c = result === null || result === void 0 ? void 0 : result.stderr) !== null && _c !== void 0 ? _c : ''}${error ? `\nTool Error: ${error.message}` : ''}`;
    const exitCode = (_d = result === null || result === void 0 ? void 0 : result.exitCode) !== null && _d !== void 0 ? _d : null;
    return {
        content: [
            {
                type: "text",
                text: success
                    ? `prompt_aider script executed successfully (Exit Code: ${exitCode}). See stdout/stderr in _meta.`
                    : `prompt_aider script failed (Exit Code: ${exitCode}). Error: ${(_e = error === null || error === void 0 ? void 0 : error.message) !== null && _e !== void 0 ? _e : 'Script execution failed.'} See stdout/stderr in _meta.`
            }
        ],
        isError: !success,
        _meta: {
            success: success,
            exitCode: exitCode,
            stdout: stdout,
            stderr: stderr,
            executedCommand: executedCommand,
            errorType: error ? 'ExecutionError' : undefined
        }
    };
}));
// --- Tool: double_compute ---
const doubleComputeParamsSchema = zod_1.z.object({
    prompt_text: zod_1.z.string().describe("The main prompt/instruction for aider."),
    files: zod_1.z.array(zod_1.z.string()).optional().describe("Optional list of files for aider to consider or modify.")
});
const doubleComputeOutputMetaSchema = zod_1.z.object({
    overallSuccess: zod_1.z.boolean().describe("True if both script executions succeeded (Exit Code 0)."),
    run1: scriptExecutionOutputSchema.describe("Results of the first execution."),
    run2: scriptExecutionOutputSchema.describe("Results of the second execution."),
    errorType: zod_1.z.string().optional().describe("Indicates if there was an execution error ('ExecutionError') or script error ('ScriptError').")
});
server.tool("double_compute", "Executes the 'prompt_aider' command from aider-cli-commands.sh TWICE with the same prompt and optional files. Useful for tasks requiring redundant computation or comparison.", doubleComputeParamsSchema.shape, (params) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g;
    const scriptArgs = [];
    scriptArgs.push((_a = params.prompt_text) !== null && _a !== void 0 ? _a : '');
    if (params.files && params.files.length > 0) {
        scriptArgs.push(...params.files);
    }
    const baseCommand = `${AIDER_SCRIPT_PATH} prompt_aider ${scriptArgs.map(escapeShellArg).join(' ')}`;
    log(`Preparing double_compute: ${baseCommand}`);
    let result1 = null;
    let error1 = null;
    let result2 = null;
    let error2 = null;
    // Run 1
    try {
        log("Executing double_compute Run 1...");
        result1 = yield executeAiderScript("prompt_aider", scriptArgs);
    }
    catch (e) {
        error1 = e;
    }
    const success1 = (result1 === null || result1 === void 0 ? void 0 : result1.exitCode) === 0 && !error1;
    const stdout1 = (_b = result1 === null || result1 === void 0 ? void 0 : result1.stdout) !== null && _b !== void 0 ? _b : '';
    const stderr1 = `${(_c = result1 === null || result1 === void 0 ? void 0 : result1.stderr) !== null && _c !== void 0 ? _c : ''}${error1 ? `\nTool Error (Run 1): ${error1.message}` : ''}`;
    const exitCode1 = (_d = result1 === null || result1 === void 0 ? void 0 : result1.exitCode) !== null && _d !== void 0 ? _d : null;
    const executedCommand1 = baseCommand; // Command is the same
    // Run 2
    try {
        log("Executing double_compute Run 2...");
        result2 = yield executeAiderScript("prompt_aider", scriptArgs);
    }
    catch (e) {
        error2 = e;
    }
    const success2 = (result2 === null || result2 === void 0 ? void 0 : result2.exitCode) === 0 && !error2;
    const stdout2 = (_e = result2 === null || result2 === void 0 ? void 0 : result2.stdout) !== null && _e !== void 0 ? _e : '';
    const stderr2 = `${(_f = result2 === null || result2 === void 0 ? void 0 : result2.stderr) !== null && _f !== void 0 ? _f : ''}${error2 ? `\nTool Error (Run 2): ${error2.message}` : ''}`;
    const exitCode2 = (_g = result2 === null || result2 === void 0 ? void 0 : result2.exitCode) !== null && _g !== void 0 ? _g : null;
    const executedCommand2 = baseCommand; // Command is the same
    const overallSuccess = success1 && success2;
    const combinedStderr = `${stderr1}${stderr1 && stderr2 ? '\n---\n' : ''}${stderr2}`;
    let errorType = undefined;
    if (error1 || error2)
        errorType = 'ExecutionError';
    else if (!overallSuccess)
        errorType = 'ScriptError';
    return {
        content: [
            {
                type: "text",
                text: overallSuccess
                    ? `double_compute script executed successfully twice (Exit Codes: ${exitCode1}, ${exitCode2}). See stdout/stderr for each run in _meta.`
                    : `double_compute script execution failed. Run 1 Success: ${success1} (Exit Code: ${exitCode1}), Run 2 Success: ${success2} (Exit Code: ${exitCode2}). See errors and stdout/stderr in _meta.`
            }
        ],
        isError: !overallSuccess,
        _meta: {
            overallSuccess: overallSuccess,
            run1: {
                success: success1,
                exitCode: exitCode1,
                stdout: stdout1,
                stderr: stderr1,
                executedCommand: executedCommand1
            },
            run2: {
                success: success2,
                exitCode: exitCode2,
                stdout: stdout2,
                stderr: stderr2,
                executedCommand: executedCommand2
            },
            errorType: errorType
        }
    };
}));
// --- Tool: finance_experts ---
// Define available expert personas based on finance-agents.md
const FINANCIAL_EXPERT_PERSONAS = ['Graham', 'Ackman', 'Wood', 'Munger', 'Burry', 'Lynch', 'Fisher'];
const financeExpertsParamsSchema = zod_1.z.object({
    topic: zod_1.z.string().describe("The central financial topic for the expert deliberation (e.g., 'Investment case for AAPL', 'Outlook for semiconductor industry')."),
    experts: zod_1.z.array(zod_1.z.enum(FINANCIAL_EXPERT_PERSONAS)).min(1).describe("List of financial expert personas to simulate (e.g., ['Graham', 'Wood', 'Munger']). Choose from: " + FINANCIAL_EXPERT_PERSONAS.join(', ')),
    output_filename: zod_1.z.string().optional().describe("Optional filename (without extension) for the output markdown file. Defaults to a sanitized version of the topic.")
});
const OUTPUT_DIR_FINANCE = path_1.default.join(process.cwd(), 'financial-experts');
const FINANCE_AGENTS_PATH = path_1.default.join(process.cwd(), 'finance-agents.md');
const GEMINI_MODEL_NAME = "gemini-1.5-flash-latest"; // Or choose another appropriate model
// Helper function to parse expert prompts from finance-agents.md
function parseExpertPrompts(fileContent) {
    const prompts = new Map();
    // Regex to find blocks starting with """You are a [Name] AI agent..."""
    const expertBlocks = fileContent.split(/```\s*```/); // Split by the separator between agents
    for (const block of expertBlocks) {
        const match = block.match(/\"\"\"You are a(?:n)?\s+(.+?)\s+AI agent/i);
        if (match && match[1]) {
            const expertName = match[1].trim();
            // Find the main prompt within triple quotes
            const promptMatch = block.match(/\"\"\"([\s\S]+?)\"\"\"/);
            if (promptMatch && promptMatch[1]) {
                // Normalize name for matching against FINANCIAL_EXPERT_PERSONAS
                const normalizedName = FINANCIAL_EXPERT_PERSONAS.find(p => expertName.toLowerCase().includes(p.toLowerCase()));
                if (normalizedName) {
                    prompts.set(normalizedName, promptMatch[1].trim());
                }
                else {
                    log(`Warning: Could not normalize expert name "${expertName}" found in finance-agents.md`);
                }
            }
        }
    }
    log(`Parsed prompts for experts: ${Array.from(prompts.keys()).join(', ')}`);
    return prompts;
}
// Define a new metadata schema specifically for the finance_experts tool
const financeExpertsOutputMetaSchema = zod_1.z.object({
    success: zod_1.z.boolean().describe('True if all API calls and file saving succeeded.'),
    outputFilePath: zod_1.z.string().optional().describe("Path to the generated output file."),
    fileSaveSuccess: zod_1.z.boolean().optional().describe("True if the output was successfully saved to the file."),
    expertsProcessed: zod_1.z.array(zod_1.z.string()).describe("List of experts whose prompts were processed."),
    apiErrors: zod_1.z.array(zod_1.z.object({ expert: zod_1.z.string(), error: zod_1.z.string() })).optional().describe("List of errors encountered during API calls."),
    errorType: zod_1.z.string().optional().describe("Indicates error source: 'InitializationError', 'FileSystemError', 'ApiError', 'ParsingError'.")
});
server.tool("finance_experts", "Simulates a deliberation between specified financial expert personas on a given topic using the Gemini API. Reads prompts from finance-agents.md, generates responses for each expert, and saves the aggregated result to './financial-experts/'. Requires GEMINI_API_KEY environment variable.", financeExpertsParamsSchema.shape, (params) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        log("Error: GEMINI_API_KEY environment variable not set.");
        return {
            content: [{ type: 'text', text: "Configuration Error: GEMINI_API_KEY is not set." }],
            isError: true,
            _meta: { success: false, expertsProcessed: [], errorType: 'InitializationError' }
        };
    }
    let ai;
    try {
        ai = new genai_1.GoogleGenAI({ apiKey });
    }
    catch (initError) {
        log(`Error initializing GoogleGenAI: ${initError.message}`);
        return {
            content: [{ type: 'text', text: `Failed to initialize AI client: ${initError.message}` }],
            isError: true,
            _meta: { success: false, expertsProcessed: [], errorType: 'InitializationError' }
        };
    }
    // 1. Read and parse finance-agents.md
    let expertPrompts;
    try {
        const fileContent = yield promises_1.default.readFile(FINANCE_AGENTS_PATH, 'utf-8');
        expertPrompts = parseExpertPrompts(fileContent);
        if (expertPrompts.size === 0) {
            throw new Error("No expert prompts could be parsed from finance-agents.md.");
        }
    }
    catch (readError) {
        log(`Error reading or parsing ${FINANCE_AGENTS_PATH}: ${readError.message}`);
        return {
            content: [{ type: 'text', text: `Failed to read or parse expert definitions: ${readError.message}` }],
            isError: true,
            _meta: { success: false, expertsProcessed: [], errorType: 'ParsingError' }
        };
    }
    // 2. Generate responses for selected experts
    const apiErrors = [];
    const expertResponses = [];
    const expertsToProcess = params.experts.filter(expert => expertPrompts.has(expert)); // Only process experts found in the file
    if (expertsToProcess.length === 0) {
        log(`Warning: None of the requested experts (${params.experts.join(', ')}) were found in the parsed prompts.`);
        return {
            content: [{ type: 'text', text: `Warning: None of the requested experts were found in finance-agents.md. No simulation run.` }],
            isError: false, // Not technically an error, but nothing happened
            _meta: { success: true, expertsProcessed: [], outputFilePath: undefined, fileSaveSuccess: undefined } // Indicate success=true but nothing done
        };
    }
    log(`Processing topic "${params.topic}" for experts: ${expertsToProcess.join(', ')}`);
    yield Promise.allSettled(expertsToProcess.map((expert) => __awaiter(void 0, void 0, void 0, function* () {
        const basePrompt = expertPrompts.get(expert);
        // Combine base prompt with the specific topic
        const fullPrompt = `${basePrompt}\n\nNow, specifically analyze the following topic:\n${params.topic}`;
        try {
            log(`Generating response for ${expert}...`);
            const result = yield ai.models.generateContent({
                model: GEMINI_MODEL_NAME,
                contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
                // Add generationConfig if needed (temperature, topK, etc.)
                // generationConfig: { temperature: 0.7 }
            });
            // Access the text response correctly - Updated based on typical SDK structure
            const responseText = result.text; // Use the .text getter
            if (responseText) {
                expertResponses.push({ expert, response: responseText });
                log(`Response received for ${expert}`);
            }
            else {
                // Handle cases where response or text is missing
                const errorMsg = `No text content received for ${expert}. Response: ${JSON.stringify(result)}`; // Stringify the whole result object
                log(`Error: ${errorMsg}`);
                apiErrors.push({ expert, error: errorMsg });
                expertResponses.push({ expert, response: `*Error: Could not generate response for ${expert}*` });
            }
        }
        catch (error) {
            const errorMsg = `API Error for ${expert}: ${error.message}`;
            log(errorMsg);
            apiErrors.push({ expert, error: errorMsg });
            expertResponses.push({ expert, response: `*Error: API call failed for ${expert}*` });
        }
    })));
    // Sort responses to maintain consistent order (matching input order)
    expertResponses.sort((a, b) => params.experts.indexOf(a.expert) - params.experts.indexOf(b.expert));
    // 3. Format output as Markdown
    let markdownOutput = `# Financial Expert Deliberation\n\n**Topic:** ${params.topic}\n\n---\n\n`;
    expertResponses.forEach(({ expert, response }) => {
        markdownOutput += `## ${expert}\n\n${response}\n\n---\n\n`;
    });
    if (apiErrors.length > 0) {
        markdownOutput += `\n**API Errors Encountered:**\n`;
        apiErrors.forEach(({ expert, error }) => {
            markdownOutput += `- ${expert}: ${error}\n`;
        });
    }
    // 4. Determine output file path
    const safeFilenameBase = ((_a = params.output_filename) === null || _a === void 0 ? void 0 : _a.replace(/[^a-z0-9_-]/gi, '_').toLowerCase()) || params.topic.replace(/[^a-z0-9_-]/gi, '_').toLowerCase().substring(0, 50);
    const outputFilename = `${safeFilenameBase}_${Date.now()}.md`;
    const outputFilePath = path_1.default.join(OUTPUT_DIR_FINANCE, outputFilename);
    // 5. Ensure output directory exists and save file
    let fileSaveSuccess = false;
    let fileSaveError = '';
    let fileSystemError = false;
    try {
        yield promises_1.default.mkdir(OUTPUT_DIR_FINANCE, { recursive: true });
        log(`Ensured output directory exists: ${OUTPUT_DIR_FINANCE}`);
        yield promises_1.default.writeFile(outputFilePath, markdownOutput);
        log(`Successfully saved finance_experts output to ${outputFilePath}`);
        fileSaveSuccess = true;
    }
    catch (writeError) {
        log(`Error writing output file ${outputFilePath}: ${writeError.message}`);
        fileSaveError = `File System Error: ${writeError.message}`;
        fileSystemError = true;
    }
    // 6. Determine overall success and return result
    const overallSuccess = apiErrors.length === 0 && !fileSystemError;
    let finalErrorType = undefined;
    if (fileSystemError)
        finalErrorType = 'FileSystemError';
    else if (apiErrors.length > 0)
        finalErrorType = 'ApiError';
    return {
        content: [
            {
                type: "text",
                text: overallSuccess
                    ? `Financial Experts simulation (Topic: ${params.topic}) completed${fileSaveSuccess ? ` and saved to '${outputFilePath}'` : ' but failed to save file'}. Experts Processed: ${expertsToProcess.join(', ')}.`
                    : `Financial Experts simulation (Topic: ${params.topic}) completed with errors. Saved: ${fileSaveSuccess}. See details in _meta.`
            }
        ],
        isError: !overallSuccess || !fileSaveSuccess,
        _meta: {
            success: overallSuccess && fileSaveSuccess,
            outputFilePath: outputFilePath,
            fileSaveSuccess: fileSaveSuccess,
            expertsProcessed: expertsToProcess,
            apiErrors: apiErrors.length > 0 ? apiErrors : undefined,
            errorType: finalErrorType
        }
    };
}));
// --- Tool: ceo_and_board ---
const ceoBoardParamsSchema = zod_1.z.object({
    topic: zod_1.z.string().describe("The central topic for the board discussion (e.g., 'Q3 Strategy Review', 'Acquisition Proposal X')."),
    roles: zod_1.z.array(zod_1.z.string()).min(1).describe("List of board member roles to simulate (e.g., ['CEO', 'CTO', 'Lead Investor', 'Independent Director'])."),
    output_filename: zod_1.z.string().optional().describe("Optional filename (without extension) for the output markdown file. Defaults to a sanitized version of the topic.")
});
const OUTPUT_DIR_BOARD = path_1.default.join(process.cwd(), 'ceo-and-board');
server.tool("ceo_and_board", "Simulates a board discussion on a given topic with specified roles using aider. Constructs a prompt, executes it via aider-cli-commands.sh, and saves the output markdown to './ceo-and-board/'.", ceoBoardParamsSchema.shape, (params) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    // 1. Construct the detailed prompt for aider
    const rolesString = params.roles.join(', ');
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
- Start with the Chair opening the discussion on the topic.
- Conclude with a summary of key decisions or next steps.
        `.trim();
    // 2. Determine output file path
    const safeFilenameBase = ((_a = params.output_filename) === null || _a === void 0 ? void 0 : _a.replace(/[^a-z0-9_-]/gi, '')) || params.topic.replace(/[^a-z0-9_-]/gi, '').toLowerCase().substring(0, 50);
    const outputFilename = `${safeFilenameBase}_${Date.now()}.md`;
    const outputFilePath = path_1.default.join(OUTPUT_DIR_BOARD, outputFilename);
    // 3. Ensure output directory exists
    try {
        yield promises_1.default.mkdir(OUTPUT_DIR_BOARD, { recursive: true });
        log(`Ensured output directory exists: ${OUTPUT_DIR_BOARD}`);
    }
    catch (dirError) {
        log(`Error creating directory ${OUTPUT_DIR_BOARD}: ${dirError.message}`);
        return {
            content: [{ type: 'text', text: `Failed to create output directory: ${OUTPUT_DIR_BOARD}` }],
            isError: true,
            _meta: {
                success: false, exitCode: null, stdout: '', stderr: `Directory creation error: ${dirError.message}`, executedCommand: 'N/A', errorType: 'FileSystemError',
                outputFilePath: outputFilePath // Still provide path even on failure
            }
        };
    }
    // 4. Prepare script arguments
    const scriptArgs = [prompt_text];
    // Maybe add a specific tag later if needed, e.g., '--simulation'
    const executedCommand = `${AIDER_SCRIPT_PATH} prompt_aider ${scriptArgs.map(escapeShellArg).join(' ')}`;
    // 5. Execute the script
    let result = null;
    let error = null;
    let success = false;
    let stdout = '';
    let stderr = '';
    let exitCode = null;
    let fileSaveSuccess = false;
    let fileSaveError = '';
    try {
        log(`Executing aider for ceo_and_board simulation: ${params.topic}`);
        result = yield executeAiderScript("prompt_aider", scriptArgs);
        success = (result === null || result === void 0 ? void 0 : result.exitCode) === 0 && !error;
        stdout = (_b = result === null || result === void 0 ? void 0 : result.stdout) !== null && _b !== void 0 ? _b : '';
        stderr = (_c = result === null || result === void 0 ? void 0 : result.stderr) !== null && _c !== void 0 ? _c : '';
        exitCode = (_d = result === null || result === void 0 ? void 0 : result.exitCode) !== null && _d !== void 0 ? _d : null;
        // 6. Attempt to save output if script succeeded
        if (success && stdout) {
            try {
                yield promises_1.default.writeFile(outputFilePath, stdout);
                log(`Successfully saved ceo_and_board output to ${outputFilePath}`);
                fileSaveSuccess = true;
            }
            catch (writeError) {
                log(`Error writing output file ${outputFilePath}: ${writeError.message}`);
                fileSaveError = `\nFile Save Error: ${writeError.message}`;
                // Treat file save error as a partial failure for the tool's purpose
                success = false;
            }
        }
        else if (success && !stdout) {
            log(`Script succeeded but produced no stdout for ceo_and_board: ${params.topic}`);
            fileSaveError = "\nFile Save Info: Script succeeded but produced no output to save.";
        }
    }
    catch (e) {
        error = e;
        stderr += `\nTool Error: ${(_e = error === null || error === void 0 ? void 0 : error.message) !== null && _e !== void 0 ? _e : 'Unknown execution error'}`;
    }
    const finalStderr = `${stderr}${fileSaveError}`;
    let errorType = undefined;
    if (error)
        errorType = 'ExecutionError';
    else if (fileSaveError && !stderr)
        errorType = 'FileSystemError'; // Prioritize execution/script errors
    else if (!success)
        errorType = 'ScriptError';
    return {
        content: [
            {
                type: "text",
                text: success && fileSaveSuccess
                    ? `CEO & Board simulation (Topic: ${params.topic}) completed and saved to '${outputFilePath}'. (Exit Code: ${exitCode})`
                    : `CEO & Board simulation (Topic: ${params.topic}) failed or could not save output. Success: ${success}, Saved: ${fileSaveSuccess}. See errors/details in _meta. (Exit Code: ${exitCode})`
            }
        ],
        isError: !success || !fileSaveSuccess, // Mark as error if script failed OR saving failed
        _meta: {
            success: success && fileSaveSuccess, // Overall success requires script success AND file save
            exitCode: exitCode,
            stdout: "[stdout omitted in response, check saved file if successful]", // Avoid large output here
            stderr: finalStderr,
            executedCommand: executedCommand,
            outputFilePath: outputFilePath,
            fileSaveSuccess: fileSaveSuccess,
            errorType: errorType
        }
    };
}));
// --- Main Execution ---
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const transport = new stdio_js_1.StdioServerTransport();
            yield server.connect(transport);
            console.error(`${serverName} v${serverVersion} running on stdio`);
            log(`Server connected via stdio.`);
        }
        catch (error) {
            console.error("Fatal error in main():", error);
            log(`Fatal error in main(): ${error.message}`);
            process.exit(1);
        }
    });
}
main().catch((error) => {
    console.error("Fatal error outside main():", error);
    log(`Fatal error outside main(): ${error.message}`);
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
