/**
 * ᑮᔐᓐᑕᒻ ᐋᐸᒋᒋᑲᓇᓐ (Giizhendam Aabajichiganan) MCP Server
 * A Meta-Cognitive Programming server implementing the MCP protocol
 * Traditional Anishinaabe'mowin Name: ᑮᔐᓐᑕᒻ ᐋᐸᒋᒋᑲᓇᓐ
 * Romanized: Giizhendam Aabajichiganan
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
// We still don't know where ToolDefinition comes from, leave it out for now
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { spawn } from "child_process";
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const LOG_FILE = '/tmp/giizhendam_mcp_log.txt';
fs.appendFileSync(LOG_FILE, `\n--- Server script loading at ${new Date().toISOString()} ---\n`);

/**
 * Input schema for the run_aider tool
 * Part of ᑮᔐᓐᑕᒻ ᐋᐸᒋᒋᑲᓇᓐ MCP toolset
 */
const runAiderParamsSchema = z.object({
    files: z.array(z.string()).optional().describe("Files/globs to add to the aider chat context."),
    message: z.string().describe("The user's request/prompt for aider."),
    model: z.string().optional().describe("Specify the model for aider to use (e.g., 'gemini/gemini-2.5-pro-exp-03-25')."),
    editorModel: z.string().optional().describe("Specify the editor model (e.g., 'sonnet')."),
    reasoningEffort: z.enum(["low", "medium", "high"]).optional().describe("Set the reasoning effort level."),
    architect: z.boolean().optional().describe("Use architect mode."),
    noDetectUrls: z.boolean().optional().describe("Disable URL detection."),
    noAutoCommit: z.boolean().optional().describe("Disable automatic git commits. Strongly recommended for use cases involving parallel operations or verification to avoid interference."),
    yesAlways: z.boolean().optional().default(true).describe("Automatically confirm actions (like applying changes). Default is true; use with caution in automated workflows."),
    repoPath: z.string().optional().describe("Absolute or relative path to the git repository. Overrides AIDER_REPO_PATH env var."),
    aiderPath: z.string().optional().describe("Path to the aider executable. Overrides AIDER_PATH env var."),
    extraArgs: z.array(z.string()).optional().describe("Array of additional command-line arguments/flags for aider.")
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

/**
 * Tool definition for run_aider
 * Part of ᑮᔐᓐᑕᒻ ᐋᐸᒋᒋᑲᓇᓐ MCP toolset
 */
// const runAiderTool: ToolDefinition<typeof runAiderParamsSchema, z.ZodObject<{ success: z.ZodBoolean; output: z.ZodString; error: z.ZodOptional<z.ZodString>; }>> = { // Temporarily comment out type annotation
const runAiderTool = {
    name: "run_aider",
    description: "Runs the aider command-line tool with specified parameters. Designed for delegating coding tasks, potentially in parallel workflows or for verification. Ensure non-interference by using appropriate flags (e.g., `noAutoCommit`).",
    inputSchema: runAiderParamsSchema,
    outputSchema: z.object({
        success: z.boolean(),
        output: z.string(),
        error: z.string().optional(),
    }),
    async execute(params: any, context: any) { // Use 'any' types for now
        return new Promise((resolve) => {
            // 1. Get Configuration (prioritize params over environment variables)
            const aiderCmd = params.aiderPath || process.env.AIDER_PATH || 'aider';
            const repoDir = params.repoPath || process.env.AIDER_REPO_PATH || '.'; // Default to current dir
            const resolvedRepoPath = path.resolve(repoDir);

            console.error(`Attempting to run aider: command=${aiderCmd}, repoPath=${resolvedRepoPath}`);

            // 2. Construct Arguments
            const args: string[] = [];
            if (params.model) args.push('--model', params.model);
            if (params.editorModel) args.push('--editor-model', params.editorModel);
            if (params.reasoningEffort) args.push('--reasoning-effort', params.reasoningEffort);
            if (params.architect) args.push('--architect');
            if (params.noDetectUrls) args.push('--no-detect-urls');
            if (params.noAutoCommit) args.push('--no-auto-commit');
            if (params.yesAlways) args.push('--yes-always'); // Default is true in schema

            // Add files *after* other options but *before* message
            if (params.files && params.files.length > 0) {
                args.push(...params.files);
            }

            // Add extra arguments
             if (params.extraArgs && params.extraArgs.length > 0) {
                args.push(...params.extraArgs);
            }

            // Add message last
            args.push('--message', params.message);

            console.error("Executing aider with args:", args.join(' '));

            // 3. Execute Subprocess
            let stdoutData = '';
            let stderrData = '';

            try {
                const aiderProcess = spawn(aiderCmd, args, {
                    cwd: resolvedRepoPath,
                    stdio: 'pipe', // Use pipe to capture streams
                    shell: false // More secure, avoids shell injection issues
                });

                aiderProcess.stdout.on('data', (data) => {
                    stdoutData += data.toString();
                });

                aiderProcess.stderr.on('data', (data) => {
                    stderrData += data.toString();
                    console.error("Aider STDERR:", data.toString()); // Log stderr for debugging
                });

                aiderProcess.on('close', (code) => {
                    console.error(`Aider process exited with code ${code}`);
                    if (code === 0) {
                        resolve({ success: true, output: stdoutData });
                    } else {
                        resolve({ success: false, output: stdoutData, error: stderrData || `Aider exited with code ${code}` });
                    }
                });

                aiderProcess.on('error', (err) => {
                    console.error('Failed to start aider process:', err);
                    resolve({ success: false, output: '', error: `Failed to start aider process: ${err.message}` });
                });

            } catch (error: any) {
                console.error('Error spawning aider process:', error);
                resolve({ success: false, output: '', error: `Error spawning aider process: ${error.message}` });
            }
        });
    },
};

// Create server instance
const server = new McpServer({
    name: "nbiish-aider", // Using a distinct name
    version: "0.1.0", // Match package.json version
    capabilities: {
        resources: {}, // No resources defined initially
        tools: {
            [runAiderTool.name]: runAiderTool,
        },
    },
});

// Main function to run the server
async function main() {
    fs.appendFileSync(LOG_FILE, `Main function started at ${new Date().toISOString()}\n`);
    // Determine the directory of the current module
    // Needed if aider needs to be run relative to the package
    // const __filename = fileURLToPath(import.meta.url);
    // const __dirname = path.dirname(__filename);
    // console.error(`MCP Server running in directory: ${__dirname}`);

    const transport = new StdioServerTransport();
    try {
        fs.appendFileSync(LOG_FILE, `Attempting server.connect() at ${new Date().toISOString()}\n`);
        await server.connect(transport);
        fs.appendFileSync(LOG_FILE, `Server connected via stdio at ${new Date().toISOString()}\n`);
        console.error("@nbiish/aider-mcp-server running on stdio");
    } catch (error: any) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        fs.appendFileSync(LOG_FILE, `Error during server.connect(): ${errorMessage} at ${new Date().toISOString()}\nStack: ${error instanceof Error ? error.stack : 'N/A'}\n`);
        console.error("Fatal error during server connection:", errorMessage);
    }
}

main().catch((error) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    fs.appendFileSync(LOG_FILE, `Fatal error in main(): ${errorMessage} at ${new Date().toISOString()}\nStack: ${error instanceof Error ? error.stack : 'N/A'}\n`);
    console.error("Fatal error in @nbiish/aider-mcp-server:", error);
    process.exit(1);
});

// Add an explicit uncaught exception handler for extra safety
process.on('uncaughtException', (error) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    fs.appendFileSync(LOG_FILE, `CRITICAL: Uncaught Exception: ${errorMessage} at ${new Date().toISOString()}\nStack: ${error.stack}\n`);
    console.error('CRITICAL: Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    const reasonMessage = reason instanceof Error ? reason.message : String(reason);
    fs.appendFileSync(LOG_FILE, `CRITICAL: Unhandled Rejection: ${reasonMessage} at ${new Date().toISOString()}\nReason: ${reason}\n`);
    console.error('CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
}); 