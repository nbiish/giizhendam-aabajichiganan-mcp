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
const generative_ai_1 = require("@google/generative-ai");
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
// const AIDER_SCRIPT_PATH = './aider-cli-commands.sh'; // Assuming it's in the root
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
// --- Tool Implementations (To be added based on PRD) ---
// Helper function to execute the aider command directly
function executeAider(toolArgs // Args specific to the tool, e.g., ['--message', 'prompt', 'file1.ts']
) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            const aiderModel = process.env.AIDER_MODEL;
            const aiderEditorModel = process.env.AIDER_EDITOR_MODEL;
            if (!aiderModel) {
                const errorMsg = "Environment variable AIDER_MODEL is not set.";
                log(`Error: ${errorMsg}`);
                // Reject the promise immediately for configuration errors
                return reject(new Error(errorMsg));
            }
            const baseAiderArgs = [];
            // Add model and common args
            // Check if editor model is specified to use architect mode
            if (aiderEditorModel) {
                log(`Using architect mode with Model: ${aiderModel}, Editor Model: ${aiderEditorModel}`);
                baseAiderArgs.push('--architect');
                baseAiderArgs.push('--model', aiderModel);
                baseAiderArgs.push('--editor-model', aiderEditorModel);
            }
            else {
                log(`Using standard mode with Model: ${aiderModel}`);
                baseAiderArgs.push('--model', aiderModel);
            }
            // Add common flags needed for programmatic execution
            baseAiderArgs.push('--no-auto-commit');
            baseAiderArgs.push('--yes-always');
            // baseAiderArgs.push('--no-detect-urls'); // Add if needed
            // Combine base args with tool-specific args
            const finalArgs = [...baseAiderArgs, ...toolArgs];
            const executedCommand = `aider ${finalArgs.join(' ')}`;
            log(`Executing aider: ${executedCommand}`);
            let stdoutData = '';
            let stderrData = '';
            try {
                // Spawn 'aider' directly
                const aiderProcess = (0, child_process_1.spawn)('aider', finalArgs, {
                    stdio: ['pipe', 'pipe', 'pipe'],
                    cwd: process.cwd(), // Run aider from the project root
                    env: process.env
                });
                aiderProcess.stdout.on('data', (data) => {
                    stdoutData += data.toString();
                    log(`Aider stdout: ${data.toString().substring(0, 100)}...`);
                });
                aiderProcess.stderr.on('data', (data) => {
                    stderrData += data.toString();
                    log(`Aider stderr: ${data.toString().substring(0, 100)}...`);
                });
                aiderProcess.on('error', (error) => {
                    log(`Failed to start aider process: ${error.message}`);
                    stderrData += `\nFailed to start aider: ${error.message}`;
                    // Reject on spawn error
                    reject(new Error(`Failed to start aider: ${error.message}`));
                });
                aiderProcess.on('close', (code) => {
                    log(`Aider process exited with code ${code}`);
                    resolve({ stdout: stdoutData, stderr: stderrData, exitCode: code, executedCommand });
                });
            }
            catch (error) {
                log(`Error spawning aider process: ${error.message}`);
                // Reject on catch error
                reject(new Error(`Error spawning aider: ${error.message}`));
            }
        });
    });
}
// --- Tool: prompt_aider ---
const promptAiderParamsSchema = zod_1.z.object({
    prompt_text: zod_1.z.string().describe("The main prompt/instruction for aider."),
    task_type: zod_1.z.enum(TASK_TYPES).optional().describe("Optional task type hint (research, docs, security, code, verify, progress) - currently informational."),
    files: zod_1.z.array(zod_1.z.string()).optional().describe("Optional list of files for aider to consider or modify.")
});
// Output Schema (shared part for script execution tools)
const scriptExecutionOutputSchema = zod_1.z.object({
    success: zod_1.z.boolean().describe('True if the aider process exited with code 0.'),
    exitCode: zod_1.z.number().nullable().describe('The exit code of the aider process.'),
    stdout: zod_1.z.string().describe('The captured standard output from aider.'),
    stderr: zod_1.z.string().describe('The captured standard error from aider.'),
    executedCommand: zod_1.z.string().describe('The full aider command string executed.')
});
// Extend the meta schema to include output file path and saving status
const simulationOutputMetaSchema = scriptExecutionOutputSchema.extend({
    errorType: zod_1.z.string().optional().describe("Indicates error source: 'ExecutionError', 'AiderError', 'FileSystemError', 'ConfigurationError'."), // Added ConfigurationError
    outputFilePath: zod_1.z.string().optional().describe("Path to the generated output file (if applicable)."),
    fileSaveSuccess: zod_1.z.boolean().optional().describe("True if the output was successfully saved to the file (if applicable).")
});
server.tool("prompt_aider", "Executes the aider command directly with the given prompt and optional files, using models defined in environment variables (AIDER_MODEL, optional AIDER_EDITOR_MODEL).", promptAiderParamsSchema.shape, (params) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    // Construct tool-specific arguments for aider
    const toolArgs = ['--message', (_a = params.prompt_text) !== null && _a !== void 0 ? _a : ''];
    if (params.files && params.files.length > 0) {
        toolArgs.push(...params.files);
    }
    // task_type is not passed directly to aider in this setup, but could be added to the prompt if needed.
    let result = null;
    let error = null;
    let errorType = undefined;
    try {
        // Execute aider directly with tool args
        result = yield executeAider(toolArgs);
    }
    catch (e) {
        error = e;
        // Check if it's the configuration error we threw
        if (e.message.includes("AIDER_MODEL is not set")) {
            errorType = 'ConfigurationError';
        }
        else {
            errorType = 'ExecutionError';
        }
    }
    const success = (result === null || result === void 0 ? void 0 : result.exitCode) === 0 && !error;
    const stdout = (_b = result === null || result === void 0 ? void 0 : result.stdout) !== null && _b !== void 0 ? _b : '';
    const stderr = `${(_c = result === null || result === void 0 ? void 0 : result.stderr) !== null && _c !== void 0 ? _c : ''}${error ? `\nTool Error: ${error.message}` : ''}`;
    const exitCode = (_d = result === null || result === void 0 ? void 0 : result.exitCode) !== null && _d !== void 0 ? _d : null;
    const executedCommand = (_e = result === null || result === void 0 ? void 0 : result.executedCommand) !== null && _e !== void 0 ? _e : `aider [error constructing command - ${error === null || error === void 0 ? void 0 : error.message}]`; // Provide fallback
    if (!errorType && !success && exitCode !== 0) { // If no execution error but script failed
        errorType = 'AiderError';
    }
    // Prepare content array
    const contentResponse = [
        {
            type: "text",
            text: success
                ? `Aider command executed successfully (Exit Code: ${exitCode}). See _meta for full logs.`
                : `Aider command failed (Exit Code: ${exitCode}). Error: ${(_f = error === null || error === void 0 ? void 0 : error.message) !== null && _f !== void 0 ? _f : 'Aider execution failed.'} See _meta for full logs.`
        }
    ];
    // Add snippet conditionally
    if (success && stdout.trim()) {
        contentResponse.push({ type: 'text', text: `\n--- Aider Output Snippet ---\n...${stdout.trim().slice(-300)}` });
    }
    else if (!success && stderr.trim()) {
        contentResponse.push({ type: 'text', text: `\n--- Aider Error Snippet ---\n...${stderr.trim().slice(-300)}` });
    }
    return {
        content: contentResponse,
        isError: !success,
        _meta: {
            success: success,
            exitCode: exitCode,
            stdout: stdout,
            stderr: stderr,
            executedCommand: executedCommand,
            errorType: errorType
        }
    };
}));
// --- Tool: double_compute ---
const doubleComputeParamsSchema = zod_1.z.object({
    prompt_text: zod_1.z.string().describe("The main prompt/instruction for aider."),
    files: zod_1.z.array(zod_1.z.string()).optional().describe("Optional list of files for aider to consider or modify.")
});
const doubleComputeOutputMetaSchema = zod_1.z.object({
    overallSuccess: zod_1.z.boolean().describe("True if both aider executions succeeded (Exit Code 0)."),
    run1: scriptExecutionOutputSchema.describe("Results of the first execution."),
    run2: scriptExecutionOutputSchema.describe("Results of the second execution."),
    errorType: zod_1.z.string().optional().describe("Indicates if there was an execution error ('ExecutionError'), aider error ('AiderError'), or config error ('ConfigurationError').") // Added ConfigurationError
});
server.tool("double_compute", "Executes the aider command TWICE directly with the same prompt and optional files, using models defined in environment variables. Useful for tasks requiring redundant computation or comparison.", doubleComputeParamsSchema.shape, (params) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    // Construct tool-specific arguments once
    const toolArgs = ['--message', (_a = params.prompt_text) !== null && _a !== void 0 ? _a : ''];
    if (params.files && params.files.length > 0) {
        toolArgs.push(...params.files);
    }
    log(`Preparing double_compute with tool args: ${toolArgs.join(' ')}`);
    let result1 = null;
    let error1 = null;
    let errorType1 = undefined;
    let result2 = null;
    let error2 = null;
    let errorType2 = undefined;
    // Run 1
    try {
        log("Executing double_compute Run 1...");
        result1 = yield executeAider(toolArgs);
    }
    catch (e) {
        error1 = e;
        errorType1 = e.message.includes("AIDER_MODEL is not set") ? 'ConfigurationError' : 'ExecutionError';
    }
    const success1 = (result1 === null || result1 === void 0 ? void 0 : result1.exitCode) === 0 && !error1;
    const stdout1 = (_b = result1 === null || result1 === void 0 ? void 0 : result1.stdout) !== null && _b !== void 0 ? _b : '';
    const stderr1 = `${(_c = result1 === null || result1 === void 0 ? void 0 : result1.stderr) !== null && _c !== void 0 ? _c : ''}${error1 ? `\nTool Error (Run 1): ${error1.message}` : ''}`;
    const exitCode1 = (_d = result1 === null || result1 === void 0 ? void 0 : result1.exitCode) !== null && _d !== void 0 ? _d : null;
    const executedCommand1 = (_e = result1 === null || result1 === void 0 ? void 0 : result1.executedCommand) !== null && _e !== void 0 ? _e : `aider [error constructing command (run 1) - ${error1 === null || error1 === void 0 ? void 0 : error1.message}]`;
    if (!errorType1 && !success1 && exitCode1 !== 0)
        errorType1 = 'AiderError';
    // Run 2
    try {
        log("Executing double_compute Run 2...");
        result2 = yield executeAider(toolArgs);
    }
    catch (e) {
        error2 = e;
        errorType2 = e.message.includes("AIDER_MODEL is not set") ? 'ConfigurationError' : 'ExecutionError';
    }
    const success2 = (result2 === null || result2 === void 0 ? void 0 : result2.exitCode) === 0 && !error2;
    const stdout2 = (_f = result2 === null || result2 === void 0 ? void 0 : result2.stdout) !== null && _f !== void 0 ? _f : '';
    const stderr2 = `${(_g = result2 === null || result2 === void 0 ? void 0 : result2.stderr) !== null && _g !== void 0 ? _g : ''}${error2 ? `\nTool Error (Run 2): ${error2.message}` : ''}`;
    const exitCode2 = (_h = result2 === null || result2 === void 0 ? void 0 : result2.exitCode) !== null && _h !== void 0 ? _h : null;
    const executedCommand2 = (_j = result2 === null || result2 === void 0 ? void 0 : result2.executedCommand) !== null && _j !== void 0 ? _j : `aider [error constructing command (run 2) - ${error2 === null || error2 === void 0 ? void 0 : error2.message}]`;
    if (!errorType2 && !success2 && exitCode2 !== 0)
        errorType2 = 'AiderError';
    const overallSuccess = success1 && success2;
    let finalErrorType = undefined;
    // Prioritize showing config/execution errors over aider errors if they occurred
    if (errorType1 === 'ConfigurationError' || errorType2 === 'ConfigurationError')
        finalErrorType = 'ConfigurationError';
    else if (errorType1 === 'ExecutionError' || errorType2 === 'ExecutionError')
        finalErrorType = 'ExecutionError';
    else if (!overallSuccess)
        finalErrorType = 'AiderError'; // Only if no config/exec errors occurred
    // Prepare content array
    const contentResponse = [
        {
            type: "text",
            text: overallSuccess
                ? `double_compute executed successfully twice (Exit Codes: ${exitCode1}, ${exitCode2}). See _meta for full logs.`
                : `double_compute execution failed. Run 1 Success: ${success1} (Exit Code: ${exitCode1}), Run 2 Success: ${success2} (Exit Code: ${exitCode2}). See _meta for full logs.`
        }
    ];
    // Add snippets conditionally for Run 1
    if (success1 && stdout1.trim()) {
        contentResponse.push({ type: 'text', text: `\n--- Run 1 Output Snippet ---\n...${stdout1.trim().slice(-200)}` });
    }
    else if (!success1 && stderr1.trim()) {
        contentResponse.push({ type: 'text', text: `\n--- Run 1 Error Snippet ---\n...${stderr1.trim().slice(-200)}` });
    }
    // Add snippets conditionally for Run 2
    if (success2 && stdout2.trim()) {
        contentResponse.push({ type: 'text', text: `\n--- Run 2 Output Snippet ---\n...${stdout2.trim().slice(-200)}` });
    }
    else if (!success2 && stderr2.trim()) {
        contentResponse.push({ type: 'text', text: `\n--- Run 2 Error Snippet ---\n...${stderr2.trim().slice(-200)}` });
    }
    return {
        content: contentResponse,
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
            errorType: finalErrorType
        }
    };
}));
// --- Tool: finance_experts ---
// Define hardcoded expert prompts focused on project/business financial analysis
const EXPERT_PROMPTS = {
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
const financeExpertsParamsSchema = zod_1.z.object({
    topic: zod_1.z.string().describe("The central financial topic or query related to a project or business situation for the experts to analyze (e.g., 'Financial risks of Project X', 'Funding strategy for new initiative Y')."),
    // experts field removed - all experts are processed now.
    output_filename: zod_1.z.string().optional().describe("Optional filename (without extension) for the output markdown file. Defaults to a sanitized version of the topic.")
});
const OUTPUT_DIR_FINANCE = path_1.default.join(process.cwd(), 'financial-experts');
// const FINANCE_AGENTS_PATH = path.join(process.cwd(), 'finance-agents.md'); // Removed - prompts are hardcoded
const GEMINI_MODEL_NAME = "gemini-1.5-flash-latest"; // Or choose another appropriate model
// Helper function to parse expert prompts from finance-agents.md - REMOVED
/*
function parseExpertPrompts(fileContent: string): Map<string, string> {
    // ... implementation removed ...
}
*/
// Define a new metadata schema specifically for the finance_experts tool
const financeExpertsOutputMetaSchema = zod_1.z.object({
    success: zod_1.z.boolean().describe('True if all API calls and file saving succeeded.'),
    outputFilePath: zod_1.z.string().optional().describe("Path to the generated output file."),
    fileSaveSuccess: zod_1.z.boolean().optional().describe("True if the output was successfully saved to the file."),
    expertsProcessed: zod_1.z.array(zod_1.z.string()).describe("List of all experts whose prompts were processed."),
    apiErrors: zod_1.z.array(zod_1.z.object({ expert: zod_1.z.string(), error: zod_1.z.string() })).optional().describe("List of errors encountered during API calls."),
    errorType: zod_1.z.string().optional().describe("Indicates error source: 'InitializationError', 'FileSystemError', 'ApiError'.") // Removed 'ParsingError'
});
// Define a similar schema for the board simulation tool
const boardSimulationOutputMetaSchema = zod_1.z.object({
    success: zod_1.z.boolean().describe('True if the API call and file saving succeeded.'),
    outputFilePath: zod_1.z.string().optional().describe("Path to the generated output file."),
    fileSaveSuccess: zod_1.z.boolean().optional().describe("True if the output was successfully saved to the file."),
    apiError: zod_1.z.string().optional().describe("Error message encountered during the API call."),
    errorType: zod_1.z.string().optional().describe("Indicates error source: 'InitializationError', 'FileSystemError', 'ApiError'.")
});
server.tool("finance_experts", 
// Updated Description:
"Simulates a deliberation between multiple internally-defined financial expert personas (Graham, Ackman, Wood, Munger, Burry, Lynch, Fisher) on a given financial topic/query related to a project or business situation using the Gemini API. Generates responses reflecting each expert's refocused principles and saves the aggregated result to './financial-experts/'. Requires GEMINI_API_KEY environment variable.", financeExpertsParamsSchema.shape, (params) => __awaiter(void 0, void 0, void 0, function* () {
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
        ai = new generative_ai_1.GoogleGenerativeAI(apiKey); // Pass apiKey directly
    }
    catch (initError) {
        log(`Error initializing GoogleGenerativeAI: ${initError.message}`);
        return {
            content: [{ type: 'text', text: `Failed to initialize AI client: ${initError.message}` }],
            isError: true,
            _meta: { success: false, expertsProcessed: [], errorType: 'InitializationError' }
        };
    }
    // 1. Read and parse finance-agents.md - REMOVED
    /*
    let expertPrompts: Map<string, string>;
    try {
        // ... file reading and parsing removed ...
    } catch (readError: any) {
        // ... error handling removed ...
    }
    */
    // 2. Generate responses for ALL defined experts
    const apiErrors = [];
    const expertResponses = [];
    const expertsToProcess = Object.keys(EXPERT_PROMPTS); // Process all experts defined above
    // Removed check for empty expertsToProcess as it's now based on the hardcoded object
    /*
    if (expertsToProcess.length === 0) {
         // ... logic removed ...
    }
    */
    log(`Processing topic "${params.topic}" for ALL defined experts: ${expertsToProcess.join(', ')}`);
    yield Promise.allSettled(expertsToProcess.map((expert) => __awaiter(void 0, void 0, void 0, function* () {
        const basePrompt = EXPERT_PROMPTS[expert]; // Get prompt from hardcoded object
        // Combine base prompt with the specific topic/query from the user
        const fullPrompt = `${basePrompt}

--- USER QUERY ---
Analyze the following query/topic:
${params.topic}`;
        try {
            log(`Generating response for ${expert}...`);
            const model = ai.getGenerativeModel({ model: GEMINI_MODEL_NAME }); // Get model instance
            const result = yield model.generateContent(fullPrompt); // Pass prompt string directly
            const response = yield result.response; // Await the response accessor
            const responseText = response.text(); // Call text() method
            if (responseText) {
                expertResponses.push({ expert, response: responseText });
                log(`Response received for ${expert}`);
            }
            else {
                // Handle cases where response or text is missing
                const errorMsg = `No text content received for ${expert}. Response: ${JSON.stringify(response)}`; // Log the response structure
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
    // Sort responses to maintain consistent order (matching definition order)
    expertResponses.sort((a, b) => expertsToProcess.indexOf(a.expert) - expertsToProcess.indexOf(b.expert));
    // 3. Format output as Markdown
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
    if (apiErrors.length > 0) {
        markdownOutput += `
**API Errors Encountered:**
`;
        apiErrors.forEach(({ expert, error }) => {
            markdownOutput += `- ${expert}: ${error}
`;
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
        log(`Successfully saved finance_experts perspectives to ${outputFilePath}`);
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
                // Updated response text
                text: overallSuccess
                    ? `Financial Experts simulation (Topic: ${params.topic}) completed processing perspectives from all defined experts ${fileSaveSuccess ? `and saved to '${outputFilePath}'` : 'but failed to save file'}.`
                    : `Financial Experts simulation (Topic: ${params.topic}) completed with errors while processing perspectives. Saved: ${fileSaveSuccess}. See details in _meta.`
            }
        ],
        isError: !overallSuccess || !fileSaveSuccess,
        _meta: {
            success: overallSuccess && fileSaveSuccess,
            outputFilePath: outputFilePath,
            fileSaveSuccess: fileSaveSuccess,
            expertsProcessed: expertsToProcess, // Now always lists all defined experts
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
// const GEMINI_MODEL_NAME = "gemini-1.5-flash-latest"; // Already defined above
server.tool("ceo_and_board", 
// Updated Description:
"Simulates a board discussion on a given topic with specified roles using the Gemini API. Constructs a prompt, executes the API call, and saves the output markdown to './ceo-and-board/'. Requires GEMINI_API_KEY environment variable.", ceoBoardParamsSchema.shape, (params) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        log("Error: GEMINI_API_KEY environment variable not set for ceo_and_board.");
        return {
            content: [{ type: 'text', text: "Configuration Error: GEMINI_API_KEY is not set." }],
            isError: true,
            _meta: { success: false, errorType: 'InitializationError' }
        };
    }
    let ai;
    try {
        ai = new generative_ai_1.GoogleGenerativeAI(apiKey);
    }
    catch (initError) {
        log(`Error initializing GoogleGenerativeAI for ceo_and_board: ${initError.message}`);
        return {
            content: [{ type: 'text', text: `Failed to initialize AI client: ${initError.message}` }],
            isError: true,
            _meta: { success: false, errorType: 'InitializationError' }
        };
    }
    // 1. Construct the detailed prompt for the Gemini model
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
- Start with the Chair (or CEO if present, otherwise first role listed) opening the discussion on the topic.
- Conclude with a summary of key decisions or next steps.
        `.trim();
    // 2. Determine output file path
    const safeFilenameBase = ((_a = params.output_filename) === null || _a === void 0 ? void 0 : _a.replace(/[^a-z0-9_-]/gi, '_').toLowerCase()) || params.topic.replace(/[^a-z0-9_-]/gi, '_').toLowerCase().substring(0, 50);
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
                success: false, apiError: `Directory creation error: ${dirError.message}`, errorType: 'FileSystemError',
                outputFilePath: outputFilePath, fileSaveSuccess: false
            }
        };
    }
    // 4. Execute the Gemini API call
    let simulationText = '';
    let apiError = undefined;
    let apiSuccess = false;
    try {
        log(`Generating ceo_and_board simulation for topic: ${params.topic}`);
        const model = ai.getGenerativeModel({ model: GEMINI_MODEL_NAME });
        const result = yield model.generateContent(prompt_text);
        const response = yield result.response;
        const responseText = response.text();
        if (responseText) {
            simulationText = responseText;
            apiSuccess = true;
            log(`Successfully received ceo_and_board simulation from API.`);
        }
        else {
            const errorMsg = `No text content received for ceo_and_board. Response: ${JSON.stringify(response)}`;
            log(`Error: ${errorMsg}`);
            apiError = errorMsg;
        }
    }
    catch (error) {
        const errorMsg = `API Error during ceo_and_board simulation: ${error.message}`;
        log(errorMsg);
        apiError = errorMsg;
    }
    // 5. Attempt to save output if API call succeeded
    let fileSaveSuccess = false;
    let fileSaveError = '';
    let fileSystemError = false;
    if (apiSuccess && simulationText) {
        try {
            yield promises_1.default.writeFile(outputFilePath, simulationText);
            log(`Successfully saved ceo_and_board output to ${outputFilePath}`);
            fileSaveSuccess = true;
        }
        catch (writeError) {
            log(`Error writing output file ${outputFilePath}: ${writeError.message}`);
            fileSaveError = `File System Error: ${writeError.message}`;
            fileSystemError = true; // Mark as file system error
        }
    }
    else if (apiSuccess && !simulationText) {
        log(`API succeeded but produced no text for ceo_and_board: ${params.topic}`);
        fileSaveError = "File Save Info: API succeeded but produced no output to save.";
        // fileSaveSuccess remains false
    }
    // 6. Determine overall success and return result
    const overallSuccess = apiSuccess && fileSaveSuccess;
    let finalErrorType = undefined;
    if (fileSystemError)
        finalErrorType = 'FileSystemError';
    else if (!apiSuccess)
        finalErrorType = 'ApiError';
    const finalApiError = apiError ? apiError : (fileSaveError && !fileSystemError ? fileSaveError : undefined);
    // Prepare content array
    const contentResponse = [
        {
            type: "text",
            text: overallSuccess
                ? `CEO & Board simulation (Topic: ${params.topic}) using Gemini API completed and saved to '${outputFilePath}'.`
                : `CEO & Board simulation (Topic: ${params.topic}) using Gemini API failed. API Success: ${apiSuccess}, Saved: ${fileSaveSuccess}. Error: ${finalApiError || 'See _meta'}.`
        }
    ];
    // Add error snippet conditionally
    if (!overallSuccess && finalApiError) {
        contentResponse.push({ type: 'text', text: `
--- Error Snippet ---
...${finalApiError.slice(-300)}` });
    }
    return {
        content: contentResponse,
        isError: !overallSuccess,
        _meta: {
            success: overallSuccess,
            outputFilePath: outputFilePath,
            fileSaveSuccess: fileSaveSuccess,
            apiError: finalApiError, // Report specific API or related error
            errorType: finalErrorType
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
