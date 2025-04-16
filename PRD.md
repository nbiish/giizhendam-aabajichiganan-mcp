# Minimum Viable Product (MVP) Specification - ᑮᔐᓐᑕᒻ ᐋᐸᒋᒋᑲᓇᓐ (Giizhendam Aabajichiganan) MCP

## 1. Product Vision/Goal (for MVP)

Create a minimal MCP (Model Context Protocol) server, ᑮᔐᓐᑕᒻ ᐋᐸᒋᒋᑲᓇᓐ (Giizhendam Aabajichiganan), that connects AI assistants (like Cursor) to the `aider` command-line tool, enabling basic code editing through an AI assistant directly in the user's local git repository.

## 2. Problem Statement

Developers using AI-assisted coding environments (e.g., Cursor, Claude App) cannot currently leverage the powerful capabilities of `aider` directly through their assistant without switching contexts. This creates friction in the development workflow and limits the potential of AI-assisted coding.

## 3. Target Users (Early Adopters)

- Developers already using AI assistants like Cursor for coding
- Developers familiar with `aider` who want a more integrated experience
- Early adopters interested in experimenting with AI-assisted coding workflows

## 4. Key Features/User Stories (MVP Scope)

### In Scope (MVP)

- **Core MCP Server**
  - Runnable via `npx @nbiish/giizhendam-aabajichiganan-mcp` (Traditional Anishinaabe'mowin Name: ᑮᔐᓐᑕᒻ ᐋᐸᒋᒋᑲᓇᓐ) or `@nbiish/ai-tool-mcp` (English Translation)
  - Implements basic MCP protocol for tool discovery and execution
  - Configurable via environment variables

- **Single File Aider Integration**
  - `run_aider` tool for editing/creating individual files
  - Passes user instructions to `aider` to execute changes
  - Reports success/failure of launching the `aider` process

- **API Key Management**
  - Read API keys from environment variables (e.g., `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`)
  - Pass these keys correctly to the `aider` subprocess

### Explicitly Out of Scope (for MVP)

- Multi-file `aider` operations
- Agentic/autonomous task execution via `aider`
- Research capabilities
- Advanced configuration options
- Git status tools
- Error recovery mechanisms
- Enhanced logging

## 5. Key Metrics/Success Criteria

- **Launch Success Rate:** >95% successful launches of the MCP server via `npx`
- **Tool Usability:** >90% of `run_aider` tool calls successfully launch the `aider` process
- **Early Adoption:** At least 10 developers actively using the MVP within the first month
- **User Feedback:** Qualitative feedback that the MVP successfully bridges the gap between AI assistants and `aider`

## 6. Riskiest Assumptions

1. **Technical Assumption:** `aider` CLI can be effectively wrapped and controlled by the MCP server without significant compatibility issues
2. **User Assumption:** AI assistant users will find value in accessing `aider` through this bridge rather than using `aider` directly
3. **Integration Assumption:** The MCP protocol implementation will be compatible with various AI assistants (Cursor, Claude App, etc.)
4. **Performance Assumption:** The Node.js server can handle the communication overhead without introducing noticeable latency

## 7. Glossary

- **MCP:** Model Context Protocol. A standard for AI assistants to communicate with external tools/servers.
- **MCP Server:** A program implementing the MCP protocol to expose specific tools (like `aider` commands) to an AI assistant.
- **ᑮᔐᓐᑕᒻ ᐋᐸᒋᒋᑲᓇᓐ (Giizhendam Aabajichiganan):** The traditional Anishinaabe'mowin name for this MCP server implementation.
- **Aider:** A command-line tool that uses AI models to edit code within a local git repository.
- **npx:** Node Package Execute. A tool to execute Node.js packages without explicitly installing them globally or locally.

*Current Version: 0.2.4* 