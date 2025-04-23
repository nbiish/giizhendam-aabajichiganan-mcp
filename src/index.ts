/**
 * ᑮᔐᓐᑕᒻ ᐋᐸᒋᒋᑲᓇᓐ (Giizhendam Aabajichiganan) MCP Server v2
 * Interface to aider-cli-commands.sh script based on revised PRD.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { spawn } from "child_process";
import fs from 'fs';
import path from 'path';
import fsPromises from 'fs/promises';

// Setting up logging (Optional but recommended)
const LOG_FILE = '/tmp/giizhendam_mcp_v2_log.txt';
function log(message: string) {
    try {
        fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${message}\n`);
    } catch (error: any) {
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

const server = new McpServer({
    name: serverName,
    version: serverVersion, 
    capabilities: { resources: {}, tools: {} },
});

// Aider Task Types and Configuration
const TASK_TYPES = ['research', 'docs', 'security', 'code', 'verify', 'progress'] as const;
type TaskType = typeof TASK_TYPES[number];

// Use environment variables for defaults, allowing override via params

// Helper to escape shell arguments (basic version, might need refinement)
function escapeShellArg(arg: string): string {
  // Simple escaping for demonstration; robust escaping is complex.
  // This handles spaces and basic special characters for common shells.
  if (/[^A-Za-z0-9_\/:=-]/.test(arg)) {
    return "'" + arg.replace(/'/g, "'\\''") + "'";
  }
  return arg;
}

// --- Tool Implementations (To be added based on PRD) ---

// Helper function to execute the aider script
function executeAiderScript(
    subCommand: string,
    args: string[]
): Promise<{ stdout: string; stderr: string; exitCode: number | null }> {
    return new Promise((resolve, reject) => {
        const fullArgs = [subCommand, ...args];
        const commandString = `${AIDER_SCRIPT_PATH} ${fullArgs.join(' ')}`;
        log(`Executing script: ${commandString}`);

        let stdoutData = '';
        let stderrData = '';

        try {
            const scriptProcess = spawn(AIDER_SCRIPT_PATH, fullArgs, {
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
        } catch (error: any) {
            log(`Error spawning script process: ${error.message}`);
            // Reject on catch error
            reject(new Error(`Error spawning script: ${error.message}`));
        }
    });
}

// --- Tool: prompt_aider ---
const promptAiderParamsSchema = z.object({
    prompt_text: z.string().describe("The main prompt/instruction for aider."),
    task_type: z.enum(TASK_TYPES).optional().describe("Optional task type hint (research, docs, security, code, verify, progress)."),
    files: z.array(z.string()).optional().describe("Optional list of files for aider to consider or modify.")
    // Add other potential aider script params here if needed (e.g., model overrides)
});

// Output Schema (shared part for script execution tools)
const scriptExecutionOutputSchema = z.object({
    success: z.boolean().describe('True if the script process exited with code 0.'),
    exitCode: z.number().nullable().describe('The exit code of the script process.'),
    stdout: z.string().describe('The captured standard output from the script.'),
    stderr: z.string().describe('The captured standard error from the script.'),
    executedCommand: z.string().describe('The full command string executed.')
});

// Extend the meta schema to include output file path and saving status
const simulationOutputMetaSchema = scriptExecutionOutputSchema.extend({
    errorType: z.string().optional().describe("Indicates error source: 'ExecutionError', 'ScriptError', 'FileSystemError'."),
    outputFilePath: z.string().optional().describe("Path to the generated output file (if successful)."),
    fileSaveSuccess: z.boolean().optional().describe("True if the output was successfully saved to the file.")
});

server.tool(
    "prompt_aider",
    "Executes the 'prompt_aider' command from aider-cli-commands.sh with the given prompt and optional files/task type.",
    promptAiderParamsSchema.shape,
    async (params): Promise<{ 
        content: { type: 'text'; text: string }[]; 
        _meta: z.infer<typeof scriptExecutionOutputSchema> & { errorType?: string };
        isError?: boolean;
      }> => {
        
        // Ensure scriptArgs are explicitly typed as string[]
        const scriptArgs: string[] = [];
        // Safely push prompt_text
        scriptArgs.push(params.prompt_text ?? ''); // Ensure it's always a string

        if (params.task_type) {
            scriptArgs.push(params.task_type);
        }
        if (params.files && params.files.length > 0) {
            scriptArgs.push(...params.files); 
        }

        // Use the correctly typed scriptArgs for mapping
        const executedCommand = `${AIDER_SCRIPT_PATH} prompt_aider ${scriptArgs.map(escapeShellArg).join(' ')}`;
        let result: { stdout: string; stderr: string; exitCode: number | null } | null = null;
        let error: Error | null = null;

        try {
            result = await executeAiderScript("prompt_aider", scriptArgs);
        } catch (e: any) {
            error = e;
        }

        const success = result?.exitCode === 0 && !error;
        const stdout = result?.stdout ?? '';
        const stderr = `${result?.stderr ?? ''}${error ? `\nTool Error: ${error.message}` : ''}`;
        const exitCode = result?.exitCode ?? null;

        return {
            content: [
                {
                    type: "text",
                    text: success 
                        ? `prompt_aider script executed successfully (Exit Code: ${exitCode}). See stdout/stderr in _meta.` 
                        : `prompt_aider script failed (Exit Code: ${exitCode}). Error: ${error?.message ?? 'Script execution failed.'} See stdout/stderr in _meta.`
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
    }
);

// --- Tool: double_compute ---
const doubleComputeParamsSchema = z.object({
    prompt_text: z.string().describe("The main prompt/instruction for aider."),
    files: z.array(z.string()).optional().describe("Optional list of files for aider to consider or modify.")
});

const doubleComputeOutputMetaSchema = z.object({
    overallSuccess: z.boolean().describe("True if both script executions succeeded (Exit Code 0)."),
    run1: scriptExecutionOutputSchema.describe("Results of the first execution."),
    run2: scriptExecutionOutputSchema.describe("Results of the second execution."),
    errorType: z.string().optional().describe("Indicates if there was an execution error ('ExecutionError') or script error ('ScriptError').")
});


server.tool(
    "double_compute",
    "Executes the 'prompt_aider' command from aider-cli-commands.sh TWICE with the same prompt and optional files. Useful for tasks requiring redundant computation or comparison.",
    doubleComputeParamsSchema.shape,
    async (params): Promise<{
        content: { type: 'text'; text: string }[];
        _meta: z.infer<typeof doubleComputeOutputMetaSchema>;
        isError?: boolean;
      }> => {
        const scriptArgs: string[] = [];
        scriptArgs.push(params.prompt_text ?? '');
        if (params.files && params.files.length > 0) {
            scriptArgs.push(...params.files);
        }
        const baseCommand = `${AIDER_SCRIPT_PATH} prompt_aider ${scriptArgs.map(escapeShellArg).join(' ')}`;
        log(`Preparing double_compute: ${baseCommand}`);

        let result1: { stdout: string; stderr: string; exitCode: number | null } | null = null;
        let error1: Error | null = null;
        let result2: { stdout: string; stderr: string; exitCode: number | null } | null = null;
        let error2: Error | null = null;

        // Run 1
        try {
            log("Executing double_compute Run 1...");
            result1 = await executeAiderScript("prompt_aider", scriptArgs);
        } catch (e: any) {
            error1 = e;
        }
        const success1 = result1?.exitCode === 0 && !error1;
        const stdout1 = result1?.stdout ?? '';
        const stderr1 = `${result1?.stderr ?? ''}${error1 ? `\nTool Error (Run 1): ${error1.message}` : ''}`;
        const exitCode1 = result1?.exitCode ?? null;
        const executedCommand1 = baseCommand; // Command is the same

        // Run 2
        try {
            log("Executing double_compute Run 2...");
            result2 = await executeAiderScript("prompt_aider", scriptArgs);
        } catch (e: any) {
            error2 = e;
        }
        const success2 = result2?.exitCode === 0 && !error2;
        const stdout2 = result2?.stdout ?? '';
        const stderr2 = `${result2?.stderr ?? ''}${error2 ? `\nTool Error (Run 2): ${error2.message}` : ''}`;
        const exitCode2 = result2?.exitCode ?? null;
        const executedCommand2 = baseCommand; // Command is the same


        const overallSuccess = success1 && success2;
        const combinedStderr = `${stderr1}${stderr1 && stderr2 ? '\n---\n' : ''}${stderr2}`;
        let errorType: string | undefined = undefined;
        if (error1 || error2) errorType = 'ExecutionError';
        else if (!overallSuccess) errorType = 'ScriptError';

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
    }
);

// --- Tool: finance_experts ---
// Define available expert personas based on finance-agents.md
const FINANCIAL_EXPERT_PERSONAS = ['Graham', 'Ackman', 'Wood', 'Munger', 'Burry', 'Lynch', 'Fisher'] as const;
type FinancialExpertPersona = typeof FINANCIAL_EXPERT_PERSONAS[number];

const financeExpertsParamsSchema = z.object({
    topic: z.string().describe("The central financial topic for the expert deliberation (e.g., 'Investment case for AAPL', 'Outlook for semiconductor industry')."),
    experts: z.array(z.enum(FINANCIAL_EXPERT_PERSONAS)).min(1).describe("List of financial expert personas to simulate (e.g., ['Graham', 'Wood', 'Munger']). Choose from: " + FINANCIAL_EXPERT_PERSONAS.join(', ')),
    output_filename: z.string().optional().describe("Optional filename (without extension) for the output markdown file. Defaults to a sanitized version of the topic.")
});

const OUTPUT_DIR_FINANCE = path.join(process.cwd(), 'financial-experts');

server.tool(
    "finance_experts",
    "Simulates a deliberation between specified financial expert personas on a given topic using aider. Constructs a prompt referencing their core principles (based on finance-agents.md), executes it via aider-cli-commands.sh (--research tag), and aims to save output to './financial-experts/'.",
    financeExpertsParamsSchema.shape,
     async (params): Promise<{
        content: { type: 'text'; text: string }[];
        _meta: z.infer<typeof simulationOutputMetaSchema>;
        isError?: boolean;
      }> => {

        // 1. Construct the detailed prompt for aider
        const expertsString = params.experts.join(', ');
        // Basic prompt structure - Ideally, pull detailed principles for *each* selected expert from finance-agents.md
        // For simplicity here, we'll just list them. A more advanced version could inject specific rules per expert.
        const prompt_text = `
Simulate a concise deliberation transcript among financial experts.
Topic: ${params.topic}
Participants: ${expertsString}
Instructions:
- Generate realistic perspectives, arguments, and potential disagreements for each expert based on their known investment philosophies (e.g., Graham=Value/Margin of Safety, Wood=Disruptive Growth, Munger=Quality/Moat, Ackman=Activism/Quality, Burry=Deep Value/Contrarian, Lynch=GARP/Understandable, Fisher=Long-Term Growth/R&D).
- Focus on key analysis points, risks, and investment conclusions (buy/sell/hold rationale) for the topic.
- Keep the discussion focused and representative of each expert's style.
- Output should be in markdown format.
- Start with a brief introduction setting the context.
- Conclude with a summary of viewpoints or key takeaways.
        `.trim();

        // 2. Determine output file path
        const safeFilenameBase = params.output_filename?.replace(/[^a-z0-9_-]/gi, '_').toLowerCase() || params.topic.replace(/[^a-z0-9_-]/gi, '_').toLowerCase().substring(0, 50);
        const outputFilename = `${safeFilenameBase}_${Date.now()}.md`;
        const outputFilePath = path.join(OUTPUT_DIR_FINANCE, outputFilename);

        // 3. Ensure output directory exists
        try {
            await fsPromises.mkdir(OUTPUT_DIR_FINANCE, { recursive: true });
            log(`Ensured output directory exists: ${OUTPUT_DIR_FINANCE}`);
        } catch (dirError: any) {
             log(`Error creating directory ${OUTPUT_DIR_FINANCE}: ${dirError.message}`);
             return {
                content: [{ type: 'text', text: `Failed to create output directory: ${OUTPUT_DIR_FINANCE}` }],
                isError: true,
                _meta: {
                     success: false, exitCode: null, stdout: '', stderr: `Directory creation error: ${dirError.message}`, executedCommand: 'N/A', errorType: 'FileSystemError'
                }
             };
        }

        // 4. Prepare script arguments (using --research tag)
        const scriptArgs: string[] = [
            prompt_text,
            '--research' // Using research tag for complex text generation/simulation
        ];
        const executedCommand = `${AIDER_SCRIPT_PATH} ${scriptArgs.map(escapeShellArg).join(' ')}`;

        // 5. Execute the script (Acknowledging background limitation)
        let result: { stdout: string; stderr: string; exitCode: number | null } | null = null;
        let error: Error | null = null;
        let success = false;
        let stdout = '';
        let stderr = '';
        let exitCode = null;
        let fileSaveSuccess = false;
        let fileSaveError = '';

        try {
            log(`Executing aider for finance_experts simulation: ${params.topic}`);
            result = await executeAiderScript("prompt_aider", scriptArgs);
            success = result?.exitCode === 0 && !error;
            stdout = result?.stdout ?? '';
            stderr = result?.stderr ?? '';
            exitCode = result?.exitCode ?? null;

            // 6. Attempt to save output if script succeeded (Added similar logic to ceo_and_board)
            if (success && stdout) {
                try {
                    await fsPromises.writeFile(outputFilePath, stdout);
                    log(`Successfully saved finance_experts output to ${outputFilePath}`);
                    fileSaveSuccess = true;
                } catch (writeError: any) {
                    log(`Error writing output file ${outputFilePath}: ${writeError.message}`);
                    fileSaveError = `\nFile Save Error: ${writeError.message}`;
                    // Treat file save error as a partial failure
                    success = false;
                }
            } else if (success && !stdout) {
                 log(`Script succeeded but produced no stdout for finance_experts: ${params.topic}`);
                 fileSaveError = "\nFile Save Info: Script succeeded but produced no output to save.";
            }

        } catch (e: any) {
            error = e;
            stderr += `\nTool Error: ${error?.message ?? 'Unknown execution error'}`;
        }

        const finalStderr = `${stderr}${fileSaveError}`;
        let errorType: string | undefined = undefined;
        if (error) errorType = 'ExecutionError';
        else if (fileSaveError && !stderr) errorType = 'FileSystemError';
        else if (!success) errorType = 'ScriptError';

        return {
            content: [
                {
                    type: "text",
                    text: success && fileSaveSuccess
                        ? `Financial Experts simulation (Topic: ${params.topic}) completed and saved to '${outputFilePath}'. (Exit Code: ${exitCode})`
                        : `Financial Experts simulation (Topic: ${params.topic}) failed or could not save output. Success: ${success}, Saved: ${fileSaveSuccess}. See errors/details in _meta. (Exit Code: ${exitCode})`
                }
            ],
            isError: !success || !fileSaveSuccess, // Mark as error if script failed OR saving failed
            _meta: {
                success: success && fileSaveSuccess, // Overall success requires script success AND file save
                exitCode: exitCode,
                stdout: "[stdout omitted in response, check saved file if successful]", // Avoid large output
                stderr: finalStderr,
                executedCommand: executedCommand,
                outputFilePath: outputFilePath,
                fileSaveSuccess: fileSaveSuccess,
                errorType: errorType
            }
        };
    }
);

// --- Tool: ceo_and_board ---
const ceoBoardParamsSchema = z.object({
    topic: z.string().describe("The central topic for the board discussion (e.g., 'Q3 Strategy Review', 'Acquisition Proposal X')."),
    roles: z.array(z.string()).min(1).describe("List of board member roles to simulate (e.g., ['CEO', 'CTO', 'Lead Investor', 'Independent Director'])."),
    output_filename: z.string().optional().describe("Optional filename (without extension) for the output markdown file. Defaults to a sanitized version of the topic.")
});

const OUTPUT_DIR_BOARD = path.join(process.cwd(), 'ceo-and-board');

server.tool(
    "ceo_and_board",
    "Simulates a board discussion on a given topic with specified roles using aider. Constructs a prompt, executes it via aider-cli-commands.sh, and saves the output markdown to './ceo-and-board/'.",
    ceoBoardParamsSchema.shape,
    async (params): Promise<{
        content: { type: 'text'; text: string }[];
        _meta: z.infer<typeof simulationOutputMetaSchema>;
        isError?: boolean;
      }> => {
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
        const safeFilenameBase = params.output_filename?.replace(/[^a-z0-9_-]/gi, '') || params.topic.replace(/[^a-z0-9_-]/gi, '').toLowerCase().substring(0, 50);
        const outputFilename = `${safeFilenameBase}_${Date.now()}.md`;
        const outputFilePath = path.join(OUTPUT_DIR_BOARD, outputFilename);

        // 3. Ensure output directory exists
        try {
            await fsPromises.mkdir(OUTPUT_DIR_BOARD, { recursive: true });
            log(`Ensured output directory exists: ${OUTPUT_DIR_BOARD}`);
        } catch (dirError: any) {
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
        const scriptArgs: string[] = [prompt_text];
        // Maybe add a specific tag later if needed, e.g., '--simulation'
        const executedCommand = `${AIDER_SCRIPT_PATH} prompt_aider ${scriptArgs.map(escapeShellArg).join(' ')}`;

        // 5. Execute the script
        let result: { stdout: string; stderr: string; exitCode: number | null } | null = null;
        let error: Error | null = null;
        let success = false;
        let stdout = '';
        let stderr = '';
        let exitCode = null;
        let fileSaveSuccess = false;
        let fileSaveError = '';

        try {
            log(`Executing aider for ceo_and_board simulation: ${params.topic}`);
            result = await executeAiderScript("prompt_aider", scriptArgs);
            success = result?.exitCode === 0 && !error;
            stdout = result?.stdout ?? '';
            stderr = result?.stderr ?? '';
            exitCode = result?.exitCode ?? null;

            // 6. Attempt to save output if script succeeded
            if (success && stdout) {
                try {
                    await fsPromises.writeFile(outputFilePath, stdout);
                    log(`Successfully saved ceo_and_board output to ${outputFilePath}`);
                    fileSaveSuccess = true;
                } catch (writeError: any) {
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

        } catch (e: any) {
            error = e;
            stderr += `\nTool Error: ${error?.message ?? 'Unknown execution error'}`;
        }

        const finalStderr = `${stderr}${fileSaveError}`;
        let errorType: string | undefined = undefined;
        if (error) errorType = 'ExecutionError';
        else if (fileSaveError && !stderr) errorType = 'FileSystemError'; // Prioritize execution/script errors
        else if (!success) errorType = 'ScriptError';

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
    }
);

// --- Main Execution ---
async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error(`${serverName} v${serverVersion} running on stdio`);
    log(`Server connected via stdio.`);
  } catch (error: any) {
    console.error("Fatal error in main():", error);
    log(`Fatal error in main(): ${error.message}`);
    process.exit(1);
  }
}

main().catch((error: any) => {
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