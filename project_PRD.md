# LLM-Optimized Agile MVP PRD for Aider-Integrated MCP Server

## Purpose
*   Provide a lean, standardized PRD template for LLM-driven requirement definition and iteration for the Aider-Integrated MCP Server project.

## Vision & Goals
*   **Vision:** An easily deployable MCP server that empowers LLMs to leverage the `aider` tool for various specialized tasks (research, coding, analysis) via clearly defined tools.
*   **Primary Goal:** Enable LLMs interacting with this MCP server to effectively utilize the capabilities defined in `aider-cli-commands.sh` through dedicated server tools, facilitating complex task execution and information synthesis.

## Core MVP Definition
*   **Definition:** Minimal MCP server exposing core `aider` functionalities (single prompt, double compute, board simulation, financial expert simulation) as distinct tools, publishable to npm.
*   **Scope:**
    *   **Must have:**
        *   npm-publishable Node.js/TypeScript project structure.
        *   MCP Server implementation using `@modelcontextprotocol/sdk`.
        *   `prompt_aider` tool: Implemented (v1). Executes a single prompt via `aider-cli-commands.sh` with task tagging. Needs testing.
        *   `double_compute` tool: Implemented. Executes a single prompt twice via `aider-cli-commands.sh`. Needs testing.
        *   `ceo_and_board` tool: Implemented. Simulates a board discussion using `aider` for specified roles, attempts saving outputs to `ceo-and-board/`. Needs testing.
        *   `finance_experts` tool: Implemented and refined. Simulates financial expert deliberation using `aider` with adapted prompts from `finance-agents.md`, attempts saving outputs to `financial-experts/`. Needs testing.
        *   Clear tool descriptions guiding LLM usage based on `aider-cli-commands.sh` task types.
        *   Basic error handling for script execution.
    *   **Out of scope:**
        *   Advanced error handling beyond script execution failures.
        *   User authentication/authorization.
        *   Sophisticated state management between tool calls.
        *   Direct integration with Context7, Brave Search, or Fetch MCPs (these are meta-instructions for the assistant, not server features).
        *   UI/Frontend.

## Guiding Principles
*   Build–Measure–Learn (applied to tool usability for LLMs).
*   Problem-focused: Enable LLM access to `aider` tasks.
*   Minimalism: Implement only the specified tools initially.
*   Viability: Ensure the tools function correctly and interface with the `aider` script.

## Success Metrics
*   **Quantitative:**
    *   Successful publication to npm.
    *   LLM successfully calls each of the 4 tools via the MCP.
    *   Output files are correctly generated in `ceo-and-board/` and `financial-experts/` directories upon tool execution.
*   **Qualitative:**
    *   Tool descriptions are clear and sufficient for an LLM to use them correctly.
    *   Feedback indicates the server reliably facilitates `aider` tasks.

## Feedback & Iteration
*   Initial feedback based on testing interactions with an LLM.
*   Future iterations could include: adding more tools, improving error handling, enhancing prompt structures based on usage.

## Terminology
*   **MCP:** Model Context Protocol
*   **Aider:** The underlying CLI tool being interfaced with.
*   **LLM:** Large Language Model (the consumer of the MCP server).

## Prompt Engineering Guide (for users of this PRD)
*   Reference sections by header (e.g., "## Core MVP Definition") to scope LLM responses about this project.
*   Example prompt: "Based on the ## Core MVP Definition, detail the implementation steps for the `prompt_aider` tool."

## Document Types Overview
*   This document follows the Agile MVP PRD format.

## Prompting Tips (for users of this PRD)
*   **Target headers:** Scope LLM queries by section (e.g., "## Success Metrics").
*   **Feature generation:** "Suggest one additional 'Must-have' feature based on the ## Vision & Goals."
*   **Refinement prompts:** "Based on potential LLM usage patterns, suggest improvements to the `ceo_and_board` tool's output format."

## Agile MVP Framework for Project Goal Setting
*   **Define Problem & Target Audience:** LLMs lack direct access to execute specialized `aider` tasks defined in a local script. Target audience is developers integrating LLMs that need this capability.
*   **Identify Core Value & Essential Features:** Provide MCP tools mapping directly to `aider` script functions (`prompt_aider`, `double_compute`, `ceo_and_board`, `finance_experts`). Exclude direct web/Context7 integration in the server itself.
*   **Prioritize & Scope:** Implement the four specified tools as the minimal viable increment.
*   **Define Success Metrics:** Focus on successful tool execution by an LLM and correct output generation.
*   **Plan Feedback & Iteration:** Initial testing by developers/LLMs, future enhancements based on identified needs.

## Key Considerations
*   **Benefits:** Enables LLMs to perform complex, structured tasks via `aider`, promotes modularity, allows specialized task execution.
*   **Challenges:** Ensuring robust interaction with the shell script (`aider-cli-commands.sh`), crafting effective tool descriptions for LLMs, managing dependencies for npm publication, adapting specific prompts (finance) for general use. 

## Codebase Structure Example (Conceptual Mapping)

This structure provides a conceptual hierarchy inspired by principles like Domain-Driven Design (DDD) and Atomic Design for organizing codebase elements.

*   **Matter:** Represents the largest boundaries, akin to DDD Bounded Contexts or major application domains/services.
    *   *Example Directory:* `/src/matter/user-management/`
    *   *Example Directory:* `/src/matter/order-processing/`
    *   *Focus:* High-level domain logic, coordination between molecules.

*   **Molecules:** Represents composite features, use cases, or larger components formed by combining Atoms within a specific Matter. Analogous to complex components or feature slices.
    *   *Example Directory:* `/src/matter/user-management/molecules/registration-flow/`
    *   *Example Directory:* `/src/matter/order-processing/molecules/checkout-process/`
    *   *Example Component:* `UserProfileCard` (combining Atom components like `Avatar`, `UserName`, `EditButton`)
    *   *Focus:* Orchestrating Atoms to fulfill a specific feature or user interaction.

*   **Atoms:** Represents the smallest reusable building blocks, similar to Atomic Design's atoms or core domain entities/functions.
    *   *Example Directory:* `/src/atoms/ui/` (for UI components)
    *   *Example Directory:* `/src/atoms/domain/` (for core domain objects/logic)
    *   *Example UI Component:* `Button.tsx`, `Input.tsx`, `Label.tsx`
    *   *Example Domain Atom:* `class UserId { ... }`, `function calculateDiscount(...)`
    *   *Focus:* Single responsibility, reusability, minimal dependencies.

*   **Quanta:** Represents the most fundamental, indivisible units – often cross-cutting concerns or foundational elements.
    *   *Example Directory:* `/src/quanta/utils/`
    *   *Example Directory:* `/src/quanta/constants/`
    *   *Example Directory:* `/src/quanta/design-tokens/`
    *   *Example File:* `dateTimeUtils.ts`, `apiEndpoints.ts`, `colors.ts`, `spacing.ts`
    *   *Focus:* Pure functions, configuration values, fundamental definitions used across Atoms and Molecules. 