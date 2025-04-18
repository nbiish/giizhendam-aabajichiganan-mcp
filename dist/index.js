/**
 * ᑮᔐᓐᑕᒻ ᐋᐸᒋᒋᑲᓇᓐ (Giizhendam Aabajichiganan) MCP Server
 * A Meta-Cognitive Programming server implementing the MCP protocol
 * Traditional Anishinaabe'mowin Name: ᑮᔐᓐᑕᒻ ᐋᐸᒋᒋᑲᓇᓐ
 * Romanized: Giizhendam Aabajichiganan
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { spawn } from "child_process";
import fs from 'fs';
import path from 'path';
const LOG_FILE = '/tmp/giizhendam_mcp_log.txt';
fs.appendFileSync(LOG_FILE, `--- Starting server at ${new Date().toISOString()} ---\n`);
// Helper function to create proper MCP response format
function createMcpResponse(success, text, isError = false) {
    return {
        content: [{
                type: "text",
                text: text
            }],
        isError: isError,
        _meta: {
            success: success
        }
    };
}
// Aider Task Types and Configuration
const TASK_TYPES = ['research', 'docs', 'security', 'code', 'verify', 'progress'];
const BASE_CONFIG = {
    model: 'openrouter/google/gemini-2.5-pro-exp-03-25:free',
    editorModel: 'openrouter/google/gemini-2.5-pro-exp-03-25:free',
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
 * Input schema for the run_aider tool
 * Part of ᑮᔐᓐᑕᒻ ᐋᐸᒋᒋᑲᓇᓐ MCP toolset
 *
 * This tool enables fire-and-forget agentic tasks using aider with specific configurations.
 * Each task type has its own focused behavior and LLM instructions:
 * - research: Research analysis and synthesis
 * - docs: Documentation generation
 * - security: Security analysis
 * - code: Code modification
 * - verify: Code verification
 * - progress: Progress tracking
 */
const runAiderParamsSchema = z.object({
    files: z.array(z.string()).optional()
        .describe('List of files to include in the task context. These files will be available for the aider agent to read and potentially modify.'),
    message: z.string()
        .describe('The specific task or request to be handled by the aider agent. This will be combined with task-specific prompting based on the taskType.'),
    taskType: z.enum(TASK_TYPES)
        .describe('The type of task to perform. This determines the agent\'s role and behavior:\n' +
        '- research: Analyze and synthesize information on a topic\n' +
        '- docs: Generate technical documentation\n' +
        '- security: Perform security analysis\n' +
        '- code: Implement or modify code\n' +
        '- verify: Review and verify code/implementation\n' +
        '- progress: Track and report progress'),
    model: z.string().optional()
        .describe('Override the default model. Default: openrouter/google/gemini-2.5-pro-exp-03-25:free'),
    editorModel: z.string().optional()
        .describe('Override the default editor model. Default: openrouter/google/gemini-2.5-pro-exp-03-25:free'),
    architect: z.boolean().optional()
        .describe('Enable/disable architect mode. When enabled, the agent takes a more high-level architectural approach. Default: true'),
    noDetectUrls: z.boolean().optional()
        .describe('Disable URL detection in messages. Default: true'),
    noAutoCommit: z.boolean().optional()
        .describe('Disable automatic git commits. Useful when running multiple tasks that modify the same codebase. Default: true'),
    yesAlways: z.boolean().optional().default(true)
        .describe('Automatically confirm all prompts. Essential for fire-and-forget operation. Default: true'),
    repoPath: z.string().optional()
        .describe('Path to the git repository to operate in. Defaults to current directory or AIDER_REPO_PATH env var.'),
    aiderPath: z.string().optional()
        .describe('Path to the aider executable. Defaults to "aider" in PATH or AIDER_PATH env var.'),
    extraArgs: z.array(z.string()).optional()
        .describe('Additional command-line arguments to pass to aider.')
});
/**
 * Conceptual Usage Notes for run_aider:
 * This tool allows an LLM assistant to delegate coding tasks to the `aider` tool.
 * It's intended for scenarios such as:
 * 1. Offloading specific, well-defined coding tasks to run concurrently (conceptually)
 *    while the primary assistant focuses on other objectives.
 * 2. Performing verification or double-checking on complex coding tasks by having
 *    `aider` attempt the same task.
 *
 * **Important Considerations:**
 * - Non-Interference: When using this tool in parallel with other operations
 *   modifying the same codebase, it is CRUCIAL to prevent conflicts.
 *   Using the `noAutoCommit: true` parameter is strongly advised in such cases.
 * - Sequential Execution: Note that underlying MCP execution is sequential. "Parallel"
 *   refers to the conceptual workflow management by the calling assistant.
 */
// Create server instance
const server = new McpServer({
    name: "giizhendam-aabajichiganan-mcp",
    version: "0.2.20",
    capabilities: { resources: {}, tools: {} },
});
// Register the 'run_aider' tool using the high-level API
server.tool("run_aider", "Executes fire-and-forget agentic tasks using aider with specialized configurations. Each task type has focused behavior and prompting:\n- research: Analyze and synthesize information\n- docs: Generate technical documentation\n- security: Perform security analysis\n- code: Implement or modify code\n- verify: Review and verify code/implementation\n- progress: Track and report progress\n\nUses OpenRouter's Gemini Pro model for both main and editor roles, with architect mode enabled by default.", runAiderParamsSchema.shape, async (params) => {
    const cmd = params.aiderPath || process.env.AIDER_PATH || 'aider';
    const cwd = path.resolve(params.repoPath || process.env.AIDER_REPO_PATH || '.');
    // Combine base config with provided params
    const config = {
        ...BASE_CONFIG,
        model: params.model || BASE_CONFIG.model,
        editorModel: params.editorModel || BASE_CONFIG.editorModel,
        architect: params.architect ?? BASE_CONFIG.architect,
        noDetectUrls: params.noDetectUrls ?? BASE_CONFIG.noDetectUrls,
        noAutoCommit: params.noAutoCommit ?? BASE_CONFIG.noAutoCommit,
        yesAlways: params.yesAlways ?? BASE_CONFIG.yesAlways
    };
    // Build command arguments
    const args = [];
    if (config.model)
        args.push('--model', config.model);
    if (config.editorModel)
        args.push('--editor-model', config.editorModel);
    if (config.architect)
        args.push('--architect');
    if (config.noDetectUrls)
        args.push('--no-detect-urls');
    if (config.noAutoCommit)
        args.push('--no-auto-commit');
    if (config.yesAlways)
        args.push('--yes-always');
    if (params.files)
        args.push(...params.files);
    if (params.extraArgs)
        args.push(...params.extraArgs);
    // Construct task-specific message
    const taskPrompt = TASK_PROMPTS[params.taskType];
    const fullMessage = `${taskPrompt} ${params.message}`;
    args.push('--message', fullMessage);
    return new Promise((resolve) => {
        let out = '', err = '';
        const p = spawn(cmd, args, { cwd, stdio: ['pipe', 'pipe', 'pipe'] });
        p.stdout.on('data', d => out += d.toString());
        p.stderr.on('data', d => err += d.toString());
        p.on('close', code => {
            if (code === 0) {
                resolve(createMcpResponse(true, out));
            }
            else {
                resolve(createMcpResponse(false, `${out}\nError: ${err}`, true));
            }
        });
        p.on('error', e => {
            resolve(createMcpResponse(false, `Error: ${e.message}`, true));
        });
    });
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("giizhendam-aabajichiganan-mcp running on stdio");
}
main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map