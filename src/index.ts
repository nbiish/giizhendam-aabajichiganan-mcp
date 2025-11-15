#!/usr/bin/env node
console.error("--- MCP SCRIPT START ---"); // Diagnostic log

/**
 * ᑮᔐᓐᑕᒻ ᐋᐸᒋᒋᑲᓇᓐ (Giizhendam Aabajichiganan) - Multi-Agent Orchestrator MCP Server v0.5.0
 *
 * Description: This server acts as an intelligent assistant for formulating precise
 * multi-agent CLI tooling orchestration. It helps construct execution plans and
 * synthesizes outputs from multiple CLI agents, driven by LLM-based deliberation.
 * This server guides and/or orchestrates local CLI agents based on environment
 * configuration and produces consolidated results for review.
 *
 * v0.5.0 Enhancements:
 * - Added multi-agent orchestration with sequential/parallel execution styles.
 * - Introduced model-driven execution-style selection and synthesis via OpenRouter.
 * - Deprecated prior assistant/tooling references in favor of CLI experts.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from 'fs';
import path from 'path';
import fsPromises from 'fs/promises';
import { GoogleGenerativeAI } from "@google/generative-ai";
import net from 'net';
import { spawn } from 'child_process';
import https from 'https';

// Setting up logging
const LOG_FILE = '/tmp/giizhendam_mcp_v0_5_0_log.txt'; // Updated log file name
function log(message: string) {
    try {
        fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${message}\n`);
    } catch (error: any) {
        console.error(`Unable to write to log file: ${error.message}`);
    }
}

// --- Configuration ---
const STANDARD_BOARD_ROLES = [
    "Board Chair", "CEO (Chief Executive Officer)", "CFO (Chief Financial Officer)",
    "COO (Chief Operations Officer)", "CTO (Chief Technology Officer)", "Independent Director",
    "Corporate Secretary/General Counsel", "Lead Investor/Venture Capitalist", "Risk/Audit Committee Chair"
];
// Orchestrator defaults (Gemini 2.5 Pro via OpenRouter preferred)
const ORCHESTRATOR_MODEL = process.env.ORCHESTRATOR_MODEL || 'google/gemini-2.5-pro';
const AGENT_OUTPUT_DIR = process.env.AGENT_OUTPUT_DIR || path.join(process.cwd(), 'output', 'agents');
// (Aider compatibility removed)

// --- Server Setup ---
const serverName = "giizhendam-multi-agent-orchestrator-mcp"; // Updated name
const serverVersion = "0.5.0"; // Incremented version

const server = new McpServer({
    name: serverName,
    version: serverVersion,
    description: `ᑮᔐᓐᑕᒻ ᐋᐸᒋᒋᑲᓇᓐ (Giizhendam Aabajichiganan) - Multi-Agent Orchestrator MCP Server (v${serverVersion}): Assists users and AI agents in planning execution styles (sequential/parallel/pipeline/feedback) and consolidating outputs from configured CLI agents. Uses LLM deliberation for orchestration decisions and synthesis.`,
    capabilities: { resources: {}, tools: {} },
});

// --- Tool: orchestrate_agents ---
const orchestrateParamsSchema = z.object({
    prompt_text: z.string().max(10000).describe('Primary task prompt passed into each configured CLI agent.'),
});

server.tool(
    'orchestrate_agents',
    'Runs configured CLI agents (sequential or parallel) on the given prompt. Uses Gemini 2.5 Pro via OpenRouter to choose between sequential and parallel, and to synthesize a consolidated markdown report. Outputs per-agent artifacts and a final synthesis file into AGENT_OUTPUT_DIR.',
    orchestrateParamsSchema.shape,
    async (params): Promise<{ content: { type: 'text'; text: string }[]; _meta: any; isError?: boolean }> => {
        const agents = await loadAgents();
        if (agents.length === 0) {
            const msg = 'No CLI agents configured. Set CLI_AGENTS_JSON or define agents in llms.txt.';
            log(msg);
            return { content: [{ type: 'text', text: msg }], _meta: { success: false }, isError: true };
        }
        const styleEnv = (process.env.EXECUTION_STYLE || 'auto').toLowerCase();
        const style = styleEnv !== 'auto' ? (styleEnv as ExecStyle) : await decideExecutionStyle(params.prompt_text, agents);
        log(`Execution style selected: ${style}`);

        const results: { name: string; outputPath: string; exitCode: number; error?: string }[] = [];
        if (style === 'sequential') {
            for (const a of agents) {
                results.push(await runAgentCommand(a, params.prompt_text, AGENT_OUTPUT_DIR));
            }
        } else {
            // Parallel execution
            const settled = await Promise.allSettled(agents.map(a => runAgentCommand(a, params.prompt_text, AGENT_OUTPUT_DIR)));
            settled.forEach(s => { if (s.status === 'fulfilled') results.push(s.value); });
        }

        const synthesis = await synthesizeOutputs(params.prompt_text, results.map(r => ({ name: r.name, outputPath: r.outputPath })));
        const synthFile = path.join(AGENT_OUTPUT_DIR, `synthesis_${Date.now()}.md`);
        try { await fsPromises.writeFile(synthFile, synthesis); } catch (e) { log(`Failed to write synthesis: ${safeErrorReport(e)}`); }

        const summary = `Orchestration complete. Style: ${style}. Agents run: ${agents.map(a=>a.name).join(', ')}.\nSynthesis: ${synthFile}`;
        return {
            content: [{ type: 'text', text: summary }],
            _meta: { success: true, executionStyle: style, outputs: results, synthesisPath: synthFile }
        };
    }
);

// --- Security Utility Functions ---
function safeErrorReport(error: any): string {
    log(`Internal Error: ${error?.stack || error}`);
    if (!error) return 'Unknown error.';
    if (typeof error === 'string') return error.split('\n')[0];
    if (error.message) return error.message.split('\n')[0];
    return 'An error occurred.';
}

function validateFilePath(filePath: string): boolean {
    const allowedExtensions = ['.md', '.ts', '.json', '.txt', '.py', '.js', '.html', '.css', '.sh', '.java', '.go', '.rs', '.c', '.cpp', '.h'];
    try {
        const absPath = path.resolve(process.cwd(), filePath); // Resolve relative to CWD where server runs
        const projectRoot = process.cwd(); // Assume project root is CWD

        // Check if the resolved path is within the project root.
        // This is a basic check; for more complex scenarios, consider explicit project root configuration.
        if (!absPath.startsWith(projectRoot)) {
            log(`Security Violation: Path ${filePath} (resolved to ${absPath}) is outside project directory ${projectRoot}.`);
            return false;
        }
        if (!allowedExtensions.some(ext => absPath.endsWith(ext))) {
            log(`Security Violation: Attempt to access file with disallowed extension: ${filePath}`);
            return false;
        }
        return true;
    } catch (error) {
        log(`Error validating file path ${filePath}: ${error}`);
        return false;
    }
}

function validateUrl(urlStr: string): boolean {
    try {
        const url = new URL(urlStr);
        if (url.protocol !== 'https:') {
            log(`Security Violation: Non-HTTPS URL rejected: ${urlStr}`);
            return false;
        }
        const hostname = url.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
            log(`Security Violation: Localhost URL rejected: ${urlStr}`);
            return false;
        }
        if (/^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(hostname) || net.isIPv6(hostname) && hostname.startsWith('fd')) {
            log(`Security Violation: Private IP URL rejected: ${urlStr}`);
            return false;
        }
        return true;
    } catch (error) {
        log(`Error validating URL ${urlStr}: ${error}`);
        return false;
    }
}

// --- OpenRouter Client (minimal) ---
type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };
async function openRouterChat(model: string, messages: ChatMessage[]): Promise<string> {
    return new Promise((resolve, reject) => {
        const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_AGENTS;
        if (!apiKey) return reject(new Error('OpenRouter key not set (set OPENROUTER_API_KEY or OPENROUTER_API_AGENTS)'));
        const payload = JSON.stringify({ model, messages });
        const req = https.request(
            {
                method: 'POST',
                hostname: 'openrouter.ai',
                path: '/api/v1/chat/completions',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(payload),
                    'Accept': 'application/json'
                }
            },
            (res) => {
                let data = '';
                res.on('data', (chunk) => (data += chunk));
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        const text = json?.choices?.[0]?.message?.content || '';
                        resolve(text);
                    } catch (e: any) {
                        reject(new Error(`OpenRouter parse error: ${e?.message || e}`));
                    }
                });
            }
        );
        // Timeout guard
        const timeoutMs = Number(process.env.OPENROUTER_TIMEOUT_MS || '30000');
        req.setTimeout(timeoutMs, () => {
            req.destroy(new Error(`OpenRouter request timeout after ${timeoutMs}ms`));
        });
        req.on('error', (err) => reject(err));
        req.write(payload);
        req.end();
    });
}

// --- CLI Agent Loading ---
interface AgentDef { name: string; cmd: string }
async function loadAgents(): Promise<AgentDef[]> {
    // Prefer JSON from env
    const json = process.env.CLI_AGENTS_JSON;
    if (json) {
        try {
            const arr = JSON.parse(json);
            if (Array.isArray(arr)) {
                return arr.filter((a) => a && a.name && a.cmd).map((a) => ({ name: String(a.name), cmd: String(a.cmd) }));
            }
        } catch (e) {
            log(`Invalid CLI_AGENTS_JSON: ${safeErrorReport(e)}`);
        }
    }
    // Fallback: parse llms.txt
    const llmsPath = path.join(process.cwd(), 'llms.txt');
    try {
        const content = await fsPromises.readFile(llmsPath, 'utf8');
        const lines = content.split(/\r?\n/);
        const agents: AgentDef[] = [];
        let currentName: string | null = null;
        let inFence = false;
        let fenceCmd: string[] = [];
        for (const line of lines) {
            if (line.trim().startsWith('- ')) {
                currentName = line.trim().slice(2).trim();
            } else if (line.trim().startsWith('```')) {
                if (!inFence) { inFence = true; fenceCmd = []; }
                else {
                    inFence = false;
                    const cmd = fenceCmd.join('\n').trim();
                    if (currentName && cmd) agents.push({ name: currentName, cmd });
                    currentName = null; fenceCmd = [];
                }
            } else if (inFence) {
                fenceCmd.push(line);
            }
        }
        return agents;
    } catch (e) {
        log(`Failed to read llms.txt: ${safeErrorReport(e)}`);
        return [];
    }
}

function fillTemplate(cmd: string, prompt: string): string {
    // Avoid String.replaceAll to support older lib targets
    return cmd.split('{prompt}').join(prompt);
}

async function runAgentCommand(agent: AgentDef, prompt: string, outDir: string): Promise<{ name: string; outputPath: string; exitCode: number; error?: string }>{
    await fsPromises.mkdir(outDir, { recursive: true });
    const outFile = path.join(outDir, `${agent.name.toLowerCase().replace(/[^a-z0-9_-]/gi,'_')}_${Date.now()}.txt`);
    const fullCmd = fillTemplate(agent.cmd, prompt);
    return new Promise((resolve) => {
        const child = spawn('/bin/sh', ['-c', fullCmd], { stdio: ['ignore', 'pipe', 'pipe'] });
        const chunks: Buffer[] = [];
        const errChunks: Buffer[] = [];
        child.stdout.on('data', (d) => chunks.push(d));
        child.stderr.on('data', (d) => errChunks.push(d));
        child.on('close', async (code) => {
            try {
                await fsPromises.writeFile(outFile, Buffer.concat(chunks));
            } catch (e) {
                log(`Error writing agent output ${agent.name}: ${safeErrorReport(e)}`);
            }
            resolve({ name: agent.name, outputPath: outFile, exitCode: code ?? -1, error: errChunks.length ? Buffer.concat(errChunks).toString('utf8') : undefined });
        });
    });
}

type ExecStyle = 'sequential' | 'parallel';
async function decideExecutionStyle(taskPrompt: string, agents: AgentDef[]): Promise<ExecStyle> {
    const system = `You are an orchestration strategist. Choose the best execution style from: sequential or parallel. Answer with a single word.`;
    const user = `Task: ${taskPrompt}\nAgents: ${agents.map(a=>a.name).join(', ')}`;
    try {
        const resp = await openRouterChat(ORCHESTRATOR_MODEL, [{ role: 'system', content: system }, { role: 'user', content: user }]);
        const pick = (resp || '').toLowerCase();
        if (pick.includes('sequential')) return 'sequential';
        return 'parallel';
    } catch (e) {
        log(`Execution style decision failed: ${safeErrorReport(e)}. Defaulting to parallel.`);
        return 'parallel';
    }
}

async function synthesizeOutputs(taskPrompt: string, results: { name: string; outputPath: string }[]): Promise<string> {
    const docs: string[] = [];
    const maxPer = Number(process.env.SYNTH_MAX_PER_AGENT_CHARS || '20000');
    const maxTotal = Number(process.env.SYNTH_MAX_TOTAL_CHARS || '150000');
    let total = 0;
    for (const r of results) {
        try {
            let txt = await fsPromises.readFile(r.outputPath, 'utf8');
            if (txt.length > maxPer) txt = txt.slice(0, maxPer) + `\n\n...[truncated ${txt.length - maxPer} chars]`;
            const section = `## ${r.name}\n\n${txt}`;
            if (total + section.length > maxTotal) {
                docs.push(`## ${r.name}\n\n*(omitted to respect synthesis size cap)*`);
                continue;
            }
            docs.push(section);
            total += section.length;
        } catch (e) {
            docs.push(`## ${r.name}\n\n*(failed to read output)*`);
        }
    }
    const system = 'You are an expert technical writer. Given multiple agent outputs, produce a concise, well-structured markdown report with Findings, Evidence, and Recommended Actions sections.';
    const user = `Task: ${taskPrompt}\n\n---\n\n${docs.join('\n\n---\n\n')}`;
    const summary = await openRouterChat(ORCHESTRATOR_MODEL, [{ role: 'system', content: system }, { role: 'user', content: user }]);
    return summary || '# Synthesis\n\n*(No content returned from model)*';
}

// --- Tools: finance_experts and ceo_and_board (Deliberation for Orchestrator Prompt) ---
// These tools use Gemini to deliberate and suggest a prompt for orchestrated CLI workflows.

const EXPERT_PROMPTS: Record<string, string> = { // Keep full prompts from original
    "Graham": `You are a Benjamin Graham AI agent... Analyze the following query/topic: \n${'{params.topic}'}`,
    "Ackman": `You are a Bill Ackman AI agent... Analyze the following query/topic: \n${'{params.topic}'}`,
    "Wood": `You are a Cathie Wood AI agent... Analyze the following query/topic: \n${'{params.topic}'}`,
    "Munger": `You are a Charlie Munger AI agent... Analyze the following query/topic: \n${'{params.topic}'}`,
    "Burry": `You are a Dr. Michael J. Burry AI agent... Analyze the following query/topic: \n${'{params.topic}'}`,
    "Lynch": `You are a Peter Lynch AI agent... Analyze the following query/topic: \n${'{params.topic}'}`,
    "Fisher": `You are a Phil Fisher AI agent... Analyze the following query/topic: \n${'{params.topic}'}`
};

const financeExpertsParamsSchema = z.object({
    topic: z.string().max(2000).describe("Financial topic for expert deliberation (e.g., 'Financial risks of Project X')."),
    output_filename: z.string().optional().describe("Optional filename for output. Defaults to sanitized topic.")
});

const DEFAULT_GEMINI_MODEL = "gemini-1.5-flash-latest";
const GEMINI_MODEL_NAME = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;

const financeExpertsOutputMetaSchema = z.object({
    success: z.boolean(), outputFilePath: z.string().optional(), fileSaveSuccess: z.boolean().optional(),
    expertsProcessed: z.array(z.string()),
    recommendedPrompt: z.string().optional().describe("The orchestrator prompt suggested by the expert deliberation for user execution."),
    apiErrors: z.array(z.object({ expert: z.string(), error: z.string() })).optional(),
    errorType: z.string().optional().describe("Error: 'InitializationError', 'FileSystemError', 'ApiError', 'ConfigurationError'.")
});

server.tool(
    "finance_experts",
    "Simulates deliberation between financial expert personas on a financial topic using Gemini. This includes formulating a recommended orchestrator prompt for the user to execute based on the deliberation. Saves aggregated expert perspectives and the recommendation to a file in './financial-experts/'.",
    financeExpertsParamsSchema.shape,
    async (params): Promise<{
        content: { type: 'text'; text: string }[];
        _meta: z.infer<typeof financeExpertsOutputMetaSchema>;
        isError?: boolean;
    }> => {
        const apiKey = process.env.GEMINI_API_KEY;
        const outputDirFinance = process.env.FINANCE_EXPERTS_OUTPUT_DIR;

        if (!apiKey) {
            log("Config Error: GEMINI_API_KEY missing for finance_experts.");
            return { content: [{ type: 'text', text: "Configuration Error: GEMINI_API_KEY is not set." }], isError: true, _meta: { success: false, expertsProcessed: [], errorType: 'ConfigurationError' } };
        }
        if (!outputDirFinance) {
            log("Config Error: FINANCE_EXPERTS_OUTPUT_DIR missing.");
            return { content: [{ type: 'text', text: "Configuration Error: FINANCE_EXPERTS_OUTPUT_DIR is not set." }], isError: true, _meta: { success: false, expertsProcessed: [], errorType: 'ConfigurationError' } };
        }

        let ai: GoogleGenerativeAI;
        try { ai = new GoogleGenerativeAI(apiKey); } catch (initError: any) {
            log(`AI Init Error: ${initError.message}`);
            return { content: [{ type: 'text', text: `AI Client Initialization Error: ${initError.message}` }], isError: true, _meta: { success: false, expertsProcessed: [], errorType: 'InitializationError' } };
        }

        const apiErrors: { expert: string; error: string }[] = [];
        const expertResponses: { expert: string; response: string }[] = [];
        const expertsToProcess = Object.keys(EXPERT_PROMPTS);

        await Promise.allSettled(expertsToProcess.map(async (expert) => {
            const basePrompt = EXPERT_PROMPTS[expert].replace('${params.topic}', params.topic);
            try {
                log(`FinanceExperts: Generating for ${expert} using ${GEMINI_MODEL_NAME}`);
                const model = ai.getGenerativeModel({ model: GEMINI_MODEL_NAME });
                const result = await model.generateContent(basePrompt);
                const responseText = (await result.response).text();
                if (responseText) expertResponses.push({ expert, response: responseText });
                else {
                    log(`FinanceExperts: No text content for ${expert}.`);
                    apiErrors.push({ expert, error: "No text content received." });
                    expertResponses.push({ expert, response: `*No text content received for ${expert}.*`});
                }
            } catch (error: any) {
                log(`FinanceExperts: API Error for ${expert}: ${error.message}`);
                apiErrors.push({ expert, error: error.message });
                expertResponses.push({ expert, response: `*API Error for ${expert}: ${error.message}*`});
            }
        }));

        expertResponses.sort((a, b) => expertsToProcess.indexOf(a.expert) - expertsToProcess.indexOf(b.expert));

        let orchestratorDeliberation = "", promptSuggestion = "";
        try {
            log("FinanceExperts: Generating orchestrator prompt deliberation...");
            const deliberationPrompt = `You are a panel of financial experts (${expertsToProcess.join(', ')}). Collectively deliberate and formulate the single most effective prompt for our CLI-agent orchestrator to address the following financial topic.
Topic: ${params.topic}
FORMAT YOUR RESPONSE AS FOLLOWS:
## Expert Deliberation Summary
[Brief summary of key discussion points leading to the prompt.]
## Recommended Task Type (optional)
[Single word if applicable]
## Recommended Orchestrator Prompt (for user execution)
[The exact, concise prompt to be provided to the orchestrator by the user.]
## Collective Confidence Score (1-10)
[A number from 1-10 for the recommendation.]`;

            const model = ai.getGenerativeModel({ model: GEMINI_MODEL_NAME });
            const result = await model.generateContent(deliberationPrompt);
            orchestratorDeliberation = (await result.response).text();
            const promptMatch = orchestratorDeliberation.match(/## Recommended Orchestrator Prompt \(for user execution\)\n([^#]+)/im);
            if (promptMatch && promptMatch[1]) promptSuggestion = promptMatch[1].trim();
            else log("FinanceExperts: Could not parse 'Recommended Orchestrator Prompt' from deliberation output.");
        } catch (error: any) {
            log(`FinanceExperts: API Error for orchestrator deliberation: ${error.message}`);
            orchestratorDeliberation = `*Error generating orchestrator prompt deliberation: ${error.message}*`;
        }

        let markdownOutput = `# Financial Expert Perspectives\n\n**Topic/Query:** ${params.topic}\n\n---\n\n`;
        expertResponses.forEach(({ expert, response }) => markdownOutput += `## ${expert}'s Perspective\n\n${response}\n\n---\n\n`);
        markdownOutput += `\n# Collective Deliberation on Optimal Orchestrator Prompt (for user execution)\n\n${orchestratorDeliberation}\n\n---\n\n`;
        if (apiErrors.length > 0) markdownOutput += `**API Errors Encountered:**\n${apiErrors.map(e => `- ${e.expert}: ${e.error}`).join('\n')}\n`;

        const safeFilenameBase = (params.output_filename?.replace(/[^a-z0-9_-]/gi, '_') || params.topic.replace(/[^a-z0-9_-]/gi, '_').substring(0, 50)).trim() || "financial_expert_analysis";
        const outputFilename = `${safeFilenameBase}_${Date.now()}.md`;
        const outputFilePath = path.join(outputDirFinance, outputFilename);

        let fileSaveSuccess = false, fileSystemError = false;
        try {
            await fsPromises.mkdir(outputDirFinance, { recursive: true });
            await fsPromises.writeFile(outputFilePath, markdownOutput);
            fileSaveSuccess = true;
            log(`FinanceExperts: Output saved to ${outputFilePath}`);
        } catch (writeError: any) {
            fileSystemError = true;
            log(`FinanceExperts: File system error saving output: ${writeError.message}`);
        }

        const overallSuccess = apiErrors.length === 0 && !fileSystemError;
        return {
            content: [
                { type: "text", text: `Financial Experts simulation (Topic: ${params.topic}) ${overallSuccess ? 'completed.' : 'completed with errors.'} ${fileSaveSuccess ? `Results saved to '${outputFilePath}'.` : 'Failed to save results file.'}` },
                { type: "text", text: promptSuggestion ? `\n--- Recommended Orchestrator Prompt (for your terminal) ---\n${promptSuggestion}` : `\n--- No specific Prompt Recommendation was parsed from deliberation. See full deliberation in saved file. ---` }
            ],
            isError: !overallSuccess,
            _meta: {
                success: overallSuccess, outputFilePath: fileSaveSuccess ? outputFilePath : undefined, fileSaveSuccess, expertsProcessed: expertsToProcess,
                recommendedPrompt: promptSuggestion || undefined,
                apiErrors: apiErrors.length > 0 ? apiErrors : undefined,
                errorType: fileSystemError ? 'FileSystemError' : (apiErrors.length > 0 ? 'ApiError' : undefined)
            }
        };
    }
);

// --- Tool: ceo_and_board ---
const ceoBoardParamsSchema = z.object({
    topic: z.string().max(2000).describe("Topic for board discussion (e.g., 'Q3 Strategy Review')."),
    roles: z.array(z.string().max(100)).optional().describe("Optional board roles. Uses standard roles if not provided."),
    output_filename: z.string().optional().describe("Optional filename. Defaults to sanitized topic.")
});

const boardSimulationOutputMetaSchema = z.object({
    success: z.boolean(), outputFilePath: z.string().optional(), fileSaveSuccess: z.boolean().optional(),
    recommendedPrompt: z.string().optional().describe("The orchestrator prompt suggested by the board deliberation for user execution."),
    apiError: z.string().optional(),
    errorType: z.string().optional().describe("Error: 'InitializationError', 'FileSystemError', 'ApiError', 'ConfigurationError'.")
});

server.tool(
    "ceo_and_board",
    "Simulates a board discussion on a given topic using Gemini. This deliberation includes formulating a recommended orchestrator prompt for the user to execute based on the discussion. Saves the simulated discussion and recommendation to a file in './ceo-and-board/'.",
    ceoBoardParamsSchema.shape,
    async (params): Promise<{
        content: { type: 'text'; text: string }[];
        _meta: z.infer<typeof boardSimulationOutputMetaSchema>;
        isError?: boolean;
    }> => {
        const apiKey = process.env.GEMINI_API_KEY;
        const outputDirBoard = process.env.CEO_BOARD_OUTPUT_DIR;

        if (!apiKey) { /* ... error handling ... */
            log("Config Error: GEMINI_API_KEY missing for ceo_and_board.");
            return { content: [{ type: 'text', text: "Configuration Error: GEMINI_API_KEY is not set." }], isError: true, _meta: { success: false, errorType: 'ConfigurationError' } };
        }
        if (!outputDirBoard) { /* ... error handling ... */
            log("Config Error: CEO_BOARD_OUTPUT_DIR missing.");
            return { content: [{ type: 'text', text: "Configuration Error: CEO_BOARD_OUTPUT_DIR is not set." }], isError: true, _meta: { success: false, errorType: 'ConfigurationError' } };
        }

        let ai: GoogleGenerativeAI;
        try { ai = new GoogleGenerativeAI(apiKey); } catch (initError: any) { /* ... error handling ... */
            log(`AI Init Error for ceo_and_board: ${initError.message}`);
            return { content: [{ type: 'text', text: `AI Client Initialization Error: ${initError.message}` }], isError: true, _meta: { success: false, errorType: 'InitializationError' } };
        }

        const rolesToUse = params.roles || STANDARD_BOARD_ROLES;
        const rolesString = rolesToUse.join(', ');
        const simulationPrompt = `Simulate a concise board meeting transcript.
Topic: ${params.topic}
Participants (Roles): ${rolesString}
Instructions: Generate realistic perspectives, questions, and decisions for each role. Ensure logical flow. Keep it professional. Conclude with key decisions/next steps. Output in markdown.`.trim();

        let orchestratorDeliberationBoard = "", promptSuggestionBoard = "";
        try {
            log("CeoAndBoard: Generating orchestrator prompt deliberation...");
            const deliberationPrompt = `You are the board members (${rolesString}). Collectively deliberate and formulate the single most effective prompt for our CLI-agent orchestrator to address the board's topic.
Topic: ${params.topic}
FORMAT YOUR RESPONSE AS FOLLOWS:
## Board Deliberation Summary
[Brief summary of key discussion points.]
## Recommended Task Type (optional)
[Single word if applicable]
## Recommended Orchestrator Prompt (for user execution)
[The exact, concise prompt to be provided to the orchestrator by the user.]
## Board Confidence Score (1-10)
[A number from 1-10 for the recommendation.]`;

            const model = ai.getGenerativeModel({ model: GEMINI_MODEL_NAME });
            const result = await model.generateContent(deliberationPrompt);
            orchestratorDeliberationBoard = (await result.response).text();
            const promptMatch = orchestratorDeliberationBoard.match(/## Recommended Orchestrator Prompt \(for user execution\)\n([^#]+)/im);
            if (promptMatch && promptMatch[1]) promptSuggestionBoard = promptMatch[1].trim();
            else log("CeoAndBoard: Could not parse 'Recommended Orchestrator Prompt' from deliberation output.");

        } catch (error: any) {
            log(`CeoAndBoard: API Error for orchestrator deliberation: ${error.message}`);
            orchestratorDeliberationBoard = `*Error generating orchestrator prompt deliberation: ${error.message}*`;
        }

        const safeFilenameBase = (params.output_filename?.replace(/[^a-z0-9_-]/gi, '_') || params.topic.replace(/[^a-z0-9_-]/gi, '_').substring(0, 50)).trim() || "board_discussion";
        const outputFilename = `${safeFilenameBase}_${Date.now()}.md`;
        const outputFilePath = path.join(outputDirBoard, outputFilename);

        try { await fsPromises.mkdir(outputDirBoard, { recursive: true }); } catch (dirError: any) {
            log(`CeoAndBoard: Directory creation error ${outputDirBoard}: ${dirError.message}`);
            return { content: [{ type: 'text', text: `Failed to create output directory: ${outputDirBoard}` }], isError: true, _meta: { success: false, apiError: `Directory creation error: ${dirError.message}`, errorType: 'FileSystemError', outputFilePath, fileSaveSuccess: false } };
        }

        let simulationText = '', apiError: string | undefined, apiSuccess = false;
        try {
            log(`CeoAndBoard: Generating simulation for ${params.topic} using ${GEMINI_MODEL_NAME}`);
            const model = ai.getGenerativeModel({ model: GEMINI_MODEL_NAME });
            const result = await model.generateContent(simulationPrompt);
            const responseText = (await result.response).text();
            if (responseText) { simulationText = responseText; apiSuccess = true; }
            else {
                apiError = "No text content received for board simulation.";
                log(`CeoAndBoard: ${apiError}`);
                simulationText = `*${apiError}*`;
            }
        } catch (error: any) {
            apiError = error.message;
            log(`CeoAndBoard: API Error for simulation: ${apiError}`);
            simulationText = `*API Error during simulation: ${apiError}*`;
        }

        const fullOutputContent = `# Board Meeting: ${params.topic}\n\n${simulationText}\n\n---\n\n# Board Deliberation: Recommended Orchestrator Prompt (for user execution)\n\n${orchestratorDeliberationBoard}\n`;
        let fileSaveSuccess = false, fileSystemError = false;

        // Attempt to save even if API had issues, to capture deliberation part if successful
        try {
            await fsPromises.writeFile(outputFilePath, fullOutputContent);
            fileSaveSuccess = true;
            log(`CeoAndBoard: Output saved to ${outputFilePath}`);
        } catch (writeError: any) {
            fileSystemError = true;
            log(`CeoAndBoard: File system error saving output: ${writeError.message}`);
        }


        const overallSuccess = apiSuccess && fileSaveSuccess; // Success requires both API for simulation and file save
        return {
            content: [
                { type: "text", text: `CEO & Board simulation (Topic: ${params.topic}) ${overallSuccess ? 'completed and saved.' : (apiSuccess ? 'completed but failed to save.' : 'failed.')} Results in '${outputFilePath}'.`},
                { type: "text", text: promptSuggestionBoard ? `\n--- Recommended Orchestrator Prompt (for your terminal) ---\n${promptSuggestionBoard}` : `\n--- No specific Prompt Recommendation was parsed from deliberation. See full deliberation in saved file. ---` }
            ],
            isError: !overallSuccess,
            _meta: {
                success: overallSuccess, outputFilePath: fileSaveSuccess ? outputFilePath : undefined, fileSaveSuccess,
                recommendedPrompt: promptSuggestionBoard || undefined,
                apiError: safeErrorReport(apiError),
                errorType: fileSystemError ? 'FileSystemError' : (!apiSuccess ? 'ApiError' : undefined)
            }
        };
    }
);

// --- Main Execution ---
async function main() {
    log(`--- Starting Giizhendam Multi-Agent Orchestrator MCP Server v${serverVersion} ---`);
    log(`Initial process.cwd() = ${process.cwd()}`);

    try {
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error(`${serverName} v${serverVersion} running on stdio`);
        log(`Server connected via stdio.`);
    } catch (error: any) {
        console.error("Fatal error in main():", error);
        log(`Fatal error in main(): ${safeErrorReport(error)}`);
        process.exit(1);
    }
}

main().catch((error: any) => {
    console.error("Fatal error outside main():", error);
    log(`Fatal error outside main(): ${safeErrorReport(error)}`);
    process.exit(1);
});

process.on('SIGTERM', () => { log('SIGTERM received: closing.'); process.exit(0); });
process.on('SIGINT', () => { log('SIGINT received: closing.'); process.exit(0); });

