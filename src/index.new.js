#!/usr/bin/env node

import dotenv from 'dotenv';
dotenv.config();

/**
 * ᑮᔐᓐᑕᒻ ᐋᐸᒋᒋᑲᓇᓐ (Giizhendam Aabajichiganan) MCP Server
 * A Meta-Cognitive Programming server implementing the MCP protocol
 * Traditional Anishinaabe'mowin Name: ᑮᔐᓐᑕᒻ ᐋᐸᒋᒋᑲᓇᓐ
 * Romanized: Giizhendam Aabajichiganan
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { spawn } from 'child_process';
import fs from 'fs/promises'; // Use fs.promises for async operations
import path from 'path';

// --- Zod Schema Definitions ---

// Shared optional args based on aider-cli-commands.sh base config and mcp.json env
const OptionalAiderArgsSchema = z.object({
    // Model overrides (optional, defaults will be read from env)
    architect_model: z.string().optional().describe("Optional. Override the architect model (e.g., openrouter/google/gemini-2.5-pro-exp-03-25:free). Defaults to env settings."),
    editor_model: z.string().optional().describe("Optional. Override the editor model (e.g., openrouter/google/gemini-2.5-pro-exp-03-25:free). Defaults to env settings."),
    // Aider flags (from base config in script)
    no_detect_urls: z.boolean().optional().default(true).describe("Use --no-detect-urls flag."),
    no_auto_commit: z.boolean().optional().default(true).describe("Use --no-auto-commit flag."),
    yes_always: z.boolean().optional().default(true).describe("Use --yes-always flag."),
    // Background execution (common pattern)
    background: z.boolean().optional().default(true).describe("Run aider in the background. Defaults to true."),
    // Files to operate on (required by most aider tasks)
    files: z.array(z.string()).optional().default([]).describe("File paths for aider to operate on. Required for code, security, verify tasks.")
});

// Tool-specific input schemas
const RunResearchInputSchema = z.object({
  topic: z.string().describe("The research topic.")
}).merge(OptionalAiderArgsSchema);

const RunDocsInputSchema = z.object({
  subject: z.string().describe("The subject for documentation generation."),
  files: z.array(z.string()).optional().default([]).describe("Optional file paths relevant to the documentation subject.")
}).merge(OptionalAiderArgsSchema);

const RunSecurityInputSchema = z.object({
  focus_area: z.string().describe("The specific focus area for the security analysis (e.g., a component, feature, or general request)."),
  files: z.array(z.string()).min(1).describe("File paths for aider to analyze.") // Files required for security
}).merge(OptionalAiderArgsSchema);

const RunCodeInputSchema = z.object({
  request: z.string().describe("The code generation or modification request."),
  files: z.array(z.string()).min(1).describe("File paths for aider to modify.") // Files required for code
}).merge(OptionalAiderArgsSchema);

const RunVerifyInputSchema = z.object({
  verification_request: z.string().describe("The request detailing what to verify and the criteria."),
  files: z.array(z.string()).min(1).describe("File paths containing the code/implementation to verify.") // Files required for verify
}).merge(OptionalAiderArgsSchema);

const RunTaskInputSchema = z.object({
    prompt: z.string().describe("General prompt for a background aider task (e.g., status update, general query)."),
    files: z.array(z.string()).optional().default([]).describe("Optional file paths relevant to the task.")
}).merge(OptionalAiderArgsSchema);


// Define the generic output schema for all tools (immediate response)
const ToolOutputSchema = z.object({
  status: z.enum(["minose", "maazhise"]).describe("Status: 'minose' (success) or 'maazhise' (error)."),
  details: z.string().describe("Details about the launch status or error message.")
});


// --- Server Definition ---
const server = new McpServer({
  name: "giizhendam-aabajichiganan", // Traditional name in romanized form
  version: "0.2.20", // Match version in package.json
  capabilities: {
    resources: {}, // No resources defined yet
    tools: {
      // Tool: run_research - Based on aider-cli-commands.sh --research
      run_research: {
        description: "Act as a research analyst. Synthesize findings on a topic. Launches aider background task.",
        inputSchema: RunResearchInputSchema,
        outputSchema: ToolOutputSchema,
        handler: (params, context) => handleRunResearch(params, context), // Placeholder handler
      },
      // Tool: run_docs - Based on aider-cli-commands.sh --docs
      run_docs: {
        description: "Act as a technical writer. Generate documentation for a subject. Launches aider background task.",
        inputSchema: RunDocsInputSchema,
        outputSchema: ToolOutputSchema,
        handler: (params, context) => handleRunDocs(params, context), // Placeholder handler
      },
      // Tool: run_security - Based on aider-cli-commands.sh --security
      run_security: {
        description: "Act as a security analyst. Review code/context for vulnerabilities. Launches aider background task.",
        inputSchema: RunSecurityInputSchema,
        outputSchema: ToolOutputSchema,
        handler: (params, context) => handleRunSecurity(params, context), // Placeholder handler
      },
      // Tool: run_code - Based on aider-cli-commands.sh --code
      run_code: {
        description: "Act as a software developer. Implement code generation/modification. Launches aider background task.",
        inputSchema: RunCodeInputSchema,
        outputSchema: ToolOutputSchema,
        handler: (params, context) => handleRunCode(params, context), // Placeholder handler
      },
      // Tool: run_verify - Based on aider-cli-commands.sh --verify
      run_verify: {
        description: "Act as a code reviewer. Verify code/implementation against criteria. Launches aider background task.",
        inputSchema: RunVerifyInputSchema,
        outputSchema: ToolOutputSchema,
        handler: (params, context) => handleRunVerify(params, context), // Placeholder handler
      },
      // Tool: run_task - Based on aider-cli-commands.sh --progress (general task)
      run_task: {
        description: "Run a general aider task in the background based on the provided prompt.",
        inputSchema: RunTaskInputSchema,
        outputSchema: ToolOutputSchema,
        handler: (params, context) => handleRunTask(params, context), // Placeholder handler
      },
    },
  },
});

// --- Utility Functions (Keep existing helper) ---
async function ensureDirectoryExists(filePath) {
    const dirPath = path.dirname(filePath);
    try {
        await fs.mkdir(dirPath, { recursive: true });
        console.error(`Directory ensured/created for: ${dirPath}`);
        return true;
    } catch (error) {
        console.error(`Error ensuring directory exists for ${filePath}:`, error);
        return false;
    }
}

// --- Core Aider Launch Function (Updated Env Handling) ---
// Returns a standardized output object matching ToolOutputSchema
function launchAiderCommand(files, full_prompt, architectModel, editorModel, optionalArgs, context) {
  console.error("Entering launchAiderCommand...");
  try {
    // Basic validation
    if (!full_prompt || !architectModel || !editorModel || !Array.isArray(files) || !optionalArgs) {
        console.error('Internal Error: Invalid arguments passed to launchAiderCommand.');
        return { status: 'maazhise', details: 'Internal error: Invalid arguments for launch.' };
    }

    // --- Argument Construction ---
    // Start with models
    const aiderArgs = [
        '--model', architectModel,
        '--editor-model', editorModel,
    ];

    // Add optional boolean flags from OptionalAiderArgsSchema
    if (optionalArgs.no_detect_urls) aiderArgs.push('--no-detect-urls');
    if (optionalArgs.no_auto_commit) aiderArgs.push('--no-auto-commit');
    if (optionalArgs.yes_always) aiderArgs.push('--yes-always');
    // Note: --background is handled by spawn detached:true, not passed as arg here

    // Add files (if any)
    if (files && files.length > 0) {
        aiderArgs.push(...files);
    }

    // Add the constructed message
    aiderArgs.push('--message', full_prompt);

    console.error(`Spawning aider with args: ${aiderArgs.join(' ')}`);

    // --- Environment Variable Construction ---
    // Prioritize context.environment (client config) over process.env (server env from .env)
    const clientEnv = context?.environment || {};
    const serverEnv = process.env;

    // Explicitly define needed keys and their priority
    const env = {
        ...serverEnv, // Start with server env as base, potentially filtered

        // Required API Keys (Error if missing from both sources? Or let aider handle?)
        GEMINI_API_KEY: clientEnv.GEMINI_API_KEY || serverEnv.GEMINI_API_KEY,
        OPENROUTER_API_KEY: clientEnv.OPENROUTER_API_KEY || serverEnv.OPENROUTER_API_KEY,
        // Add other potential API keys aider might use if configured
        // OPENAI_API_KEY: clientEnv.OPENAI_API_KEY || serverEnv.OPENAI_API_KEY,
        // ANTHROPIC_API_KEY: clientEnv.ANTHROPIC_API_KEY || serverEnv.ANTHROPIC_API_KEY,

        // Model names (used by this function to construct args, not passed directly in env unless aider needs them)
        // We already pass the determined models via args, but include them in env
        // in case aider logic uses them directly somehow.
        DEFAULT_ARCHITECT_MODEL: clientEnv.DEFAULT_ARCHITECT_MODEL || serverEnv.DEFAULT_ARCHITECT_MODEL,
        DEFAULT_CODER_MODEL: clientEnv.DEFAULT_CODER_MODEL || serverEnv.DEFAULT_CODER_MODEL, // Alias for editor
        CUSTOM_ARCHITECT_MODEL: clientEnv.CUSTOM_ARCHITECT_MODEL || serverEnv.CUSTOM_ARCHITECT_MODEL,
        CUSTOM_CODER_MODEL: clientEnv.CUSTOM_CODER_MODEL || serverEnv.CUSTOM_CODER_MODEL, // Alias for editor
    };

    // Filter out undefined/null keys to avoid passing them literally
    Object.keys(env).forEach(key => (env[key] === undefined || env[key] === null) && delete env[key]);

    // Logging for verification
    console.error("Using environment variables for aider process:");
    console.error(`  GEMINI_API_KEY source: ${clientEnv.GEMINI_API_KEY ? 'client' : serverEnv.GEMINI_API_KEY ? 'server' : 'missing'}`);
    console.error(`  OPENROUTER_API_KEY source: ${clientEnv.OPENROUTER_API_KEY ? 'client' : serverEnv.OPENROUTER_API_KEY ? 'server' : 'missing'}`);
    console.error(`  DEFAULT_ARCHITECT_MODEL source: ${clientEnv.DEFAULT_ARCHITECT_MODEL ? 'client' : serverEnv.DEFAULT_ARCHITECT_MODEL ? 'server' : 'used_default'}`);
    console.error(`  DEFAULT_CODER_MODEL source: ${clientEnv.DEFAULT_CODER_MODEL ? 'client' : serverEnv.DEFAULT_CODER_MODEL ? 'server' : 'used_default'}`);
    console.error(`  CUSTOM_ARCHITECT_MODEL source: ${clientEnv.CUSTOM_ARCHITECT_MODEL ? 'client' : serverEnv.CUSTOM_ARCHITECT_MODEL ? 'server' : 'not_set'}`);
    console.error(`  CUSTOM_CODER_MODEL source: ${clientEnv.CUSTOM_CODER_MODEL ? 'client' : serverEnv.CUSTOM_CODER_MODEL ? 'server' : 'not_set'}`);
    console.error("Final Env object for spawn:", env);

    // --- Spawning Process ---
    const runInBackground = optionalArgs.background !== false;
    const aiderProcess = spawn('aider', aiderArgs, {
      detached: runInBackground, // Run in background if requested
      stdio: 'ignore', // Ignore stdio streams to avoid blocking
      env: env        // Pass constructed environment variables
    });

    let spawnFailed = false;
    aiderProcess.on('error', (err) => {
      console.error('Spawn Error:', err);
      spawnFailed = true; // Set flag if spawn fails
    });

    if (runInBackground) {
        aiderProcess.unref(); // Allow parent process to exit independently
    }

    // Check the flag *after* unref and event listener setup
    if (spawnFailed) {
        console.error("Aider process failed to spawn (e.g., command not found or permissions).");
        return { status: 'maazhise', details: 'Aider process failed to spawn (e.g., command not found or permissions).' };
    }

    const launchMsg = runInBackground
        ? 'Aider process launch initiated in background.'
        : 'Aider process launch initiated (foreground - blocking).' // Should ideally not happen with current defaults
    console.error(`Exiting launchAiderCommand (success). ${launchMsg}`);
    return { status: 'minose', details: launchMsg };

  } catch (error) {
    console.error('Error preparing or launching aider command:', error);
    console.error("Exiting launchAiderCommand (error).");
    return { status: 'maazhise', details: `Internal error preparing/launching command: ${error.message}` };
  }
}

// --- Tool Handler Functions ---

// Base handler to extract common logic: determine models, construct args, call launch
async function baseAiderHandler(params, context, messageConstructor) {
    console.error(`Handling tool call with params:`, params);
    console.error(`Received context keys: ${context ? Object.keys(context).join(', ') : 'null'}`);
    const clientEnv = context?.environment || {};
    const serverEnv = process.env;

    // Determine models (Priority: params -> clientEnv (custom) -> clientEnv (default) -> serverEnv (custom) -> serverEnv (default))
    const architectModel = params.architect_model
        || clientEnv.CUSTOM_ARCHITECT_MODEL
        || clientEnv.DEFAULT_ARCHITECT_MODEL
        || serverEnv.CUSTOM_ARCHITECT_MODEL
        || serverEnv.DEFAULT_ARCHITECT_MODEL;

    const editorModel = params.editor_model
        || clientEnv.CUSTOM_CODER_MODEL
        || clientEnv.DEFAULT_CODER_MODEL
        || serverEnv.CUSTOM_CODER_MODEL
        || serverEnv.DEFAULT_CODER_MODEL;

    // Check if essential models are determined
    if (!architectModel || !editorModel) {
        const missing = [!architectModel && "Architect", !editorModel && "Editor"].filter(Boolean).join(' and ');
        console.error(`Error: Could not determine essential models (${missing}). Check params or environment variables.`);
        return { status: 'maazhise', details: `Configuration error: ${missing} model not found.` };
    }

    console.error(`Using Architect Model: ${architectModel}`);
    console.error(`Using Editor Model: ${editorModel}`);

    // Construct the specific message for aider
    const message = messageConstructor(params);

    // Extract files (handle optional/required nature at schema level)
    const files = params.files || [];

    // Extract optional args (flags, background mode)
    const optionalArgs = {
        no_detect_urls: params.no_detect_urls,
        no_auto_commit: params.no_auto_commit,
        yes_always: params.yes_always,
        background: params.background,
    };

    // Launch the command
    return launchAiderCommand(files, message, architectModel, editorModel, optionalArgs, context);
}

// Specific Handlers
async function handleRunResearch(params, context) {
    return baseAiderHandler(params, context, (p) => 
        `Act as a research analyst. Synthesize the key findings, evidence, and implications related to the following topic. Provide a concise summary suitable for a technical team. Topic: ${p.topic}`
    );
}

async function handleRunDocs(params, context) {
    return baseAiderHandler(params, context, (p) => 
        `Act as a technical writer. Generate clear and concise documentation (e.g., explanation, usage guide, API reference) for the following subject, targeting an audience of developers. Subject: ${p.subject}`
    );
}

async function handleRunSecurity(params, context) {
    return baseAiderHandler(params, context, (p) => 
        `Act as an expert security analyst. Review the provided context/code for potential security vulnerabilities (e.g., OWASP Top 10, injection flaws, insecure configurations, logic errors). Clearly identify any findings, explain the risks, and suggest mitigations. Focus area: ${p.focus_area}`
    );
}

async function handleRunCode(params, context) {
    return baseAiderHandler(params, context, (p) => 
        `Act as an expert software developer. Implement the following code generation or modification request, ensuring code is efficient, readable, and adheres to best practices. Request: ${p.request}`
    );
}

async function handleRunVerify(params, context) {
    return baseAiderHandler(params, context, (p) => 
        `Act as a meticulous code reviewer. Verify the following code or implementation against the requirements or criteria specified. Identify any discrepancies, potential bugs, logical errors, or areas for improvement (e.g., clarity, performance). Verification request: ${p.verification_request}`
    );
}

async function handleRunTask(params, context) {
    // Generic task based on the prompt
    return baseAiderHandler(params, context, (p) => p.prompt );
}


// --- Main Execution ---
async function main() {
  try {
    // Log environment variables being used for models (if set)
    console.error(`--- Environment Model Config ---`);
    console.error(`DEFAULT_ARCHITECT_MODEL: ${process.env.DEFAULT_ARCHITECT_MODEL || 'Not Set'}`);
    console.error(`DEFAULT_EDITOR_MODEL: ${process.env.DEFAULT_EDITOR_MODEL || 'Not Set'}`);
    console.error(`CUSTOM_ARCHITECT_MODEL: ${process.env.CUSTOM_ARCHITECT_MODEL || 'Not Set'}`);
    console.error(`CUSTOM_EDITOR_MODEL: ${process.env.CUSTOM_EDITOR_MODEL || 'Not Set'}`);
    console.error(`--- API Keys (Presence Only) ---`);
    console.error(`OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? 'Set' : 'Not Set'}`);
    console.error(`ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? 'Set' : 'Not Set'}`);
    console.error(`GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? 'Set' : 'Not Set'}`);
    console.error(`OPENROUTER_API_KEY: ${process.env.OPENROUTER_API_KEY ? 'Set' : 'Not Set'}`);
    console.error(`------------------------------`);


    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error(`${server.name} MCP Server v${server.version} running on stdio`);
    console.error(`Registered Tools: ${Object.keys(server.capabilities.tools).join(', ')}`);

  } catch (error) {
    console.error("Fatal error initializing or running MCP Server:", error);
    process.exit(1); // Exit with error code
  }
}

// Add signal handlers for graceful shutdown
process.on('SIGINT', () => {
  console.error('Received SIGINT. Shutting down...');
  server.disconnect().finally(() => process.exit(0));
});

process.on('SIGTERM', () => {
  console.error('Received SIGTERM. Shutting down...');
  server.disconnect().finally(() => process.exit(0));
});

// Start the server
main(); 