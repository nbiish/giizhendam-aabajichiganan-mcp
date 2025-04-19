#!/usr/bin/env node
/**
 * ᑮᔐᓐᑕᒻ ᐋᐸᒋᒋᑲᓇᓐ (Giizhendam Aabajichiganan) MCP Server
 * A Meta-Cognitive Programming server implementing the MCP protocol
 * Traditional Anishinaabe'mowin Name: ᑮᔐᓐᑕᒻ ᐋᐸᒋᒋᑲᓇᓐ
 * Romanized: Giizhendam Aabajichiganan
 */
import dotenv from 'dotenv';
dotenv.config();
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
// MCP Response Types (No longer needed as we return commands)
/*
type McpTextContent = {
  type: "text";
  text: string;
  [key: string]: unknown;
};

type McpResponse = {
  content: McpTextContent[];
  isError?: boolean;
  _meta?: {
    success: boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

// Helper function to create proper MCP response format (No longer needed)
function createMcpResponse(success: boolean, text: string, isError = false): McpResponse {
  // ... implementation ...
}
*/
// Aider Task Types and Configuration
const TASK_TYPES = ['research', 'docs', 'security', 'code', 'verify', 'progress'];
// Use environment variables for defaults, allowing override via params
const DEFAULT_ARCHITECT_MODEL = process.env.DEFAULT_ARCHITECT_MODEL || 'openrouter/google/gemini-2.5-pro-exp-03-25:free';
const DEFAULT_EDITOR_MODEL = process.env.DEFAULT_EDITOR_MODEL || 'openrouter/google/gemini-2.5-pro-exp-03-25:free'; // Use separate env var if desired
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
        .describe(`Override the default architect model. Default: ${DEFAULT_ARCHITECT_MODEL}`),
    editorModel: z.string().optional()
        .describe(`Override the default editor model. Default: ${DEFAULT_EDITOR_MODEL}`),
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
    version: "0.2.25", // Increment version for the change
    capabilities: { resources: {}, tools: {} },
});
// Register the 'generate_aider_commands' tool
server.tool("generate_aider_commands", "Generates primary and verification aider CLI command strings for agentic tasks. The assistant should run these using a terminal tool.", generateAiderCommandsParamsSchema.shape, async (params) => {
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
        // Format output simply as text content
        return {
            content: [
                {
                    type: "text",
                    text: instructions // Send instructions and commands as plain text
                }
            ],
            _meta: {
                success: true,
                // Optionally include raw commands here if needed for robust parsing
                // primary_command: primaryCommand,
                // verification_command: verificationCommand
            }
        };
    }
    catch (error) {
        console.error("Error generating aider commands:", error);
        // Format error response to comply with MCP standard
        return {
            content: [
                {
                    type: "text",
                    text: `Failed to generate aider commands: ${error.message}`
                }
            ],
            isError: true,
            _meta: { success: false }
        };
    }
});
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