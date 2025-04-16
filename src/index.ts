/**
 * ᑮᔐᓐᑕᒻ ᐋᐸᒋᒋᑲᓇᓐ (Giizhendam Aabajichiganan) MCP Server
 * A Meta-Cognitive Programming server implementing the MCP protocol
 * Traditional Anishinaabe'mowin Name: ᑮᔐᓐᑕᒻ ᐋᐸᒋᒋᑲᓇᓐ
 * Romanized: Giizhendam Aabajichiganan
 */

import { McpServer, ToolDefinition } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { spawn } from "child_process";
import { fileURLToPath } from 'url';
import path from 'path';

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
    noAutoCommit: z.boolean().optional().describe("Disable automatic git commits."),
    yesAlways: z.boolean().optional().default(true).describe("Automatically confirm actions (like applying changes). Defaults to true."),
    repoPath: z.string().optional().describe("Absolute or relative path to the git repository. Overrides AIDER_REPO_PATH env var."),
    aiderPath: z.string().optional().describe("Path to the aider executable. Overrides AIDER_PATH env var."),
    extraArgs: z.array(z.string()).optional().describe("Array of additional command-line arguments/flags for aider.")
});

/**
 * Tool definition for run_aider
 * Part of ᑮᔐᓐᑕᒻ ᐋᐸᒋᒋᑲᓇᓐ MCP toolset
 */
const runAiderTool: ToolDefinition<typeof runAiderParamsSchema, z.ZodObject<{ success: z.ZodBoolean; output: z.ZodString; error: z.ZodOptional<z.ZodString>; }>> = {
    name: "run_aider",
    description: "Runs the aider command-line tool with specified parameters.",
    inputSchema: runAiderParamsSchema,
    outputSchema: z.object({
        success: z.boolean(),
        output: z.string(),
        error: z.string().optional(),
    }),
    async execute(params, context) {
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
    // Determine the directory of the current module
    // Needed if aider needs to be run relative to the package
    // const __filename = fileURLToPath(import.meta.url);
    // const __dirname = path.dirname(__filename);
    // console.error(`MCP Server running in directory: ${__dirname}`);

    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("@nbiish/aider-mcp-server running on stdio");
}

main().catch((error) => {
    console.error("Fatal error in @nbiish/aider-mcp-server:", error);
    process.exit(1);
}); 