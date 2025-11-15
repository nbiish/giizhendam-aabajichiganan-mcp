# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.0] - 2025-01-XX

### Major Refactor - Unified Orchestrator Model Configuration

#### Added
- Unified orchestrator model configuration via `ORCHESTRATOR_MODEL` environment variable
- Support for any OpenRouter-supported model (Gemini, Claude, GPT-4, etc.)
- Enhanced `finance_experts` tool with 18 expert agents
- Individual expert output files (900 tokens each) saved to separate directory
- RAG consolidation using orchestrator model with File Search capabilities
- Comprehensive orchestrator model configuration documentation (`ORCHESTRATOR_MODEL_CONFIG.md`)
- Enhanced OpenRouter client with file data support

#### Changed
- **BREAKING**: Removed direct Gemini API dependency (`@google/generative-ai`)
- **BREAKING**: Removed `GEMINI_API_KEY` requirement - now uses `OPENROUTER_API_KEY` exclusively
- All AI operations now use OpenRouter with configurable orchestrator model
- Default model changed to `google/gemini-2.5-pro` (via OpenRouter)
- MCP configuration updated to use `npx -y` format for easier installation
- Financial experts tool now orchestrates 18 agents individually before RAG consolidation

#### Removed
- `@google/generative-ai` package dependency
- `GEMINI_API_KEY` environment variable
- Direct Gemini API calls

#### Fixed
- Improved error handling for OpenRouter API calls
- Better fallback mechanisms for RAG consolidation

## [0.5.3] - 2025-01-XX

### Added
- 18 financial expert agents with dynamic prompt loading from markdown files
- Individual agent prompt files in `agents/` directory
- Enhanced expert prompts with detailed research and methodologies
- Agent file mapping system for flexible naming

## [0.3.34] - 2025-01-XX

### Fixed
- Fixed shebang line in bundled output file to ensure proper execution via npx
- Resolved "Client closed" errors when running via MCP

## [Unreleased]

### Changed
- Major refactor: Removed Aider tooling and introduced `orchestrate_agents` for multi-agent CLI orchestration
- Added environment variables: `OPENROUTER_API_KEY`, `ORCHESTRATOR_MODEL`, `CLI_AGENTS_JSON`, `AGENT_OUTPUT_DIR`, `EXECUTION_STYLE`, and synthesis/timeout caps

