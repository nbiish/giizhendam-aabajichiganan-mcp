#!/usr/bin/env node

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

// Optional args common to all tools
const OptionalAiderArgsSchema = z.object({
    architect_model: z.string().optional().describe("Optional. Override for --model flag."),
    editor_model: z.string().optional().describe("Optional. Override for --editor-model flag."),
    additional_aider_args: z.array(z.string()).optional().default([]).describe("Optional. Extra flags for aider command."),
    background: z.boolean().optional().default(true).describe("Optional. Run in background mode. Defaults to true."),
    show_progress: z.boolean().optional().default(false).describe("Optional. Show task progress updates."),
    task_type: z.enum([
        "research",
        "documentation",
        "security",
        "code_modification",
        "verification"
    ]).optional().describe("Optional. Specific type of task being requested.")
});

const RunAiderInputSchema = z.object({
  files: z.array(z.string()).min(1).describe("File paths for aider."),
  message: z.string().describe("Prompt/instructions for aider.")
}).merge(OptionalAiderArgsSchema); // Merge common optional args

const RunAgenticCodeTaskInputSchema = z.object({
  files: z.array(z.string()).min(1).describe("Files for aider to work on."),
  task_prompt: z.string().describe("Specific instructions for the coding task.")
}).merge(OptionalAiderArgsSchema);

const RunAgenticResearchInputSchema = z.object({
  research_topic: z.string().describe("The topic to research."),
  output_file: z.string().describe("Target markdown file path (must start with RESEARCH/).")
}).merge(OptionalAiderArgsSchema);

// Define the output schema for all tools (immediate response)
const ToolOutputSchema = z.object({
  status: z.enum(["minose", "maazhise"]).describe("Status: 'minose' (success) or 'maazhise' (error)."),
  details: z.string().describe("Details about the launch status or error message.")
});

// --- Server Definition ---
const server = new McpServer({
  name: "giizhendam-aabajichiganan", // Traditional name in romanized form
  version: "0.2.11", // Match version in package.json
  capabilities: {
    resources: {}, // No resources defined yet
    tools: {
      // Tool: run_aider - Part of ᑮᔐᓐᑕᒻ ᐋᐸᒋᒋᑲᓇᓐ MCP toolset
      run_aider: {
        description: "Launches an `aider` command-line process in the background to apply changes to specified files based on a prompt. Responds immediately with confirmation (minose) or error (maazhise).",
        inputSchema: RunAiderInputSchema,
        outputSchema: ToolOutputSchema, // Use shared output schema
        handler: handleRunAider, // Link to handler function
      },
      // Tool: run_agentic_code_task - Part of ᑮᔐᓐᑕᒻ ᐋᐸᒋᒋᑲᓇᓐ MCP toolset
      run_agentic_code_task: {
        description: "Initiates a background `aider` process for an autonomous coding task using an OODA loop approach. Does not interfere with main assistant. Responds immediately with launch status (minose/maazhise).",
        inputSchema: RunAgenticCodeTaskInputSchema,
        outputSchema: ToolOutputSchema,
        handler: handleRunAgenticCodeTask,
      },
      // Tool: run_agentic_research - Part of ᑮᔐᓐᑕᒻ ᐋᐸᒋᒋᑲᓇᓐ MCP toolset
      run_agentic_research: {
        description: "Initiates a background `aider` process for autonomous research, creating/updating a markdown file in RESEARCH/. Uses OODA loop. Responds immediately with launch status (minose/maazhise).",
        inputSchema: RunAgenticResearchInputSchema,
        outputSchema: ToolOutputSchema,
        handler: handleRunAgenticResearch,
      },
    },
  },
});

// --- Prompt Construction Helpers (Keep existing helpers) ---
function constructCodeTaskPrompt(task_prompt) {
    return `You are an autonomous agent performing a background coding task. Do not interfere with the main assistant's flow. Your task is to: ${task_prompt}. Use an OODA loop approach: Observe the code, Orient to the goal, Decide on changes, Act by implementing them, and repeat if necessary. Apply changes directly to the specified files.`;
}

function constructResearchPrompt(research_topic, output_file) {
    return `You are an autonomous agent performing research. Your goal is to gather information on '${research_topic}' and create or update the markdown file '${output_file}'. Use an OODA loop approach: Observe available information, Orient to the research goal, Decide on key findings, Act by writing/updating the markdown file, and repeat. Ensure the output is well-structured markdown within the specified file.`;
}

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

// --- Core Aider Launch Function (Adapt slightly for SDK context) ---
// Returns a standardized output object matching ToolOutputSchema
function launchAiderCommand(files, full_prompt, architectModel, editorModel, additional_aider_args) {
  console.error("Entering launchAiderCommand...");
  try {
    // Basic validation (types mostly handled by Zod now)
    if (!full_prompt || !architectModel || !editorModel || !Array.isArray(files) || files.length === 0 || !Array.isArray(additional_aider_args)) {
        console.error('Internal Error: Invalid arguments passed to launchAiderCommand.');
        return { status: 'maazhise', details: 'Internal error: Invalid arguments for launch.' };
    }

    const baseArgs = [
      '--model', architectModel,
      '--editor-model', editorModel,
      '--no-detect-urls',
      '--no-auto-commit',
      '--yes-always' // Ensure non-interactive
    ];

    // Add background and progress flags if specified
    if (additional_aider_args.includes('--background')) {
        baseArgs.push('--background');
    }
    if (additional_aider_args.includes('--show-progress')) {
        baseArgs.push('--show-progress');
    }

    const fileArgs = files;
    const messageArg = ['--message', full_prompt];
    const extraArgs = additional_aider_args.filter(arg => 
        arg !== '--background' && arg !== '--show-progress'
    );

    const aiderArgs = [...baseArgs, ...fileArgs, ...messageArg, ...extraArgs];

    console.error(`Spawning aider with args: ${aiderArgs.join(' ')}`);

    // Environment variables needed by aider (read from process.env)
    const env = {
        ...process.env, // Pass existing env vars
        // Explicitly pass API keys aider might look for
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
        GEMINI_API_KEY: process.env.GEMINI_API_KEY,
        OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
        // Add any other keys aider might need
    };
    // Filter out undefined keys to avoid passing them literally
    Object.keys(env).forEach(key => env[key] === undefined && delete env[key]);
    console.error(`Passing environment keys: ${Object.keys(env).join(', ')}`);


    const aiderProcess = spawn('aider', aiderArgs, {
      detached: true, // Run in background
      stdio: 'ignore', // Ignore stdio streams
      env: env        // Pass necessary environment variables
    });

    let spawnFailed = false;
    aiderProcess.on('error', (err) => {
      console.error('Spawn Error:', err);
      spawnFailed = true; // Set flag if spawn fails
    });

    aiderProcess.unref(); // Allow parent process to exit independently

    // Check the flag *after* unref and event listener setup
    if (spawnFailed) {
        // This error handling is still a bit racy but better than before
        console.error("Aider process failed to spawn (e.g., command not found).");
        return { status: 'maazhise', details: 'Aider process failed to spawn (e.g., command not found).' };
    }

    console.error("Exiting launchAiderCommand (success). Aider launched in background.");
    return { status: 'minose', details: 'Aider process launch initiated in background.' };

  } catch (error) {
    console.error('Error preparing aider command:', error);
    console.error("Exiting launchAiderCommand (error).");
    return { status: 'maazhise', details: `Internal error preparing command: ${error.message}` };
  }
}

// --- Tool Handler Functions ---

// Generic handler to determine models and call launchAiderCommand
async function baseAiderHandler(params, promptConstructor) {
    console.error(`Handling tool call with params:`, params);

    // Determine models (common logic for all tools)
    const architectModel = params.architect_model || process.env.CUSTOM_ARCHITECT_MODEL || process.env.DEFAULT_ARCHITECT_MODEL;
    const editorModel = params.editor_model || process.env.CUSTOM_EDITOR_MODEL || process.env.DEFAULT_EDITOR_MODEL;
    
    // Build additional args array with new flags
    const additional_aider_args = [...(params.additional_aider_args || [])];
    
    // Add background flag if specified (defaults to true)
    if (params.background !== false) {
        additional_aider_args.push('--background');
    }
    
    // Add progress flag if specified
    if (params.show_progress) {
        additional_aider_args.push('--show-progress');
    }

    // Log task type if specified
    if (params.task_type) {
        console.error(`Task type specified: ${params.task_type}`);
    }

    if (!architectModel || !editorModel) {
        const errorMsg = 'Could not determine required models. Set DEFAULT/CUSTOM env vars or provide in tool call.';
        console.error(errorMsg);
        return { status: 'maazhise', details: errorMsg };
    }
    console.error(`Using Architect Model: ${architectModel}`);
    console.error(`Using Editor Model: ${editorModel}`);
    console.error(`Using Additional Args: ${additional_aider_args.join(' ')}`);

    // Construct the specific prompt using the provided function
    const full_prompt = promptConstructor(params);
    if (typeof full_prompt !== 'string') {
        console.error('Internal Error: Prompt constructor did not return a string.');
        return { status: 'maazhise', details: 'Internal error generating prompt.' };
    }

    // Handle directory creation for research tool specifically
    if (params.output_file && params.output_file.startsWith('RESEARCH' + path.sep)) {
        console.error(`Ensuring directory exists for research file: ${params.output_file}`);
        const dirOk = await ensureDirectoryExists(params.output_file);
        if (!dirOk) {
            const errorMsg = `Internal Error: Failed to create directory for output_file: ${params.output_file}`;
            console.error(errorMsg);
            return { status: 'maazhise', details: errorMsg };
        }
        console.error(`Directory ensured successfully.`);
    }

    // Determine files list based on tool type
    let filesToUse;
    if (params.message) { // run_aider
        filesToUse = params.files;
    } else if (params.task_prompt) { // run_agentic_code_task
        filesToUse = params.files;
    } else if (params.research_topic) { // run_agentic_research
        filesToUse = [params.output_file];
    } else {
        console.error('Internal Error: Could not determine files list for tool.');
        return { status: 'maazhise', details: 'Internal error determining files list.' };
    }

    console.error(`Files list for aider: ${filesToUse.join(', ')}`);

    // Launch the command with updated args
    const launchResult = launchAiderCommand(filesToUse, full_prompt, architectModel, editorModel, additional_aider_args);
    console.error(`Launch result:`, launchResult);
    return launchResult;
}


// Specific Handlers - they prepare the prompt constructor and call the base handler

async function handleRunAider(params) {
    // params are already validated by Zod against RunAiderInputSchema
    return baseAiderHandler(params, (p) => p.message); // Simple prompt is just the message
}

async function handleRunAgenticCodeTask(params) {
    // params are already validated by Zod against RunAgenticCodeTaskInputSchema
    return baseAiderHandler(params, (p) => constructCodeTaskPrompt(p.task_prompt));
}

async function handleRunAgenticResearch(params) {
    // params are already validated by Zod against RunAgenticResearchInputSchema

    // Additional validation specific to research tool
    const researchDir = 'RESEARCH';
    if (!params.output_file.startsWith(researchDir + path.sep) && params.output_file !== researchDir) {
        const errorMsg = `Invalid Params: output_file must be within the ${researchDir}/ directory. Received: ${params.output_file}`;
         console.error(errorMsg);
         return { status: 'maazhise', details: errorMsg };
    }

    return baseAiderHandler(params, (p) => constructResearchPrompt(p.research_topic, p.output_file));
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