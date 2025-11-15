# Finance Experts Orchestration Workflow

## Overview

The `finance_experts` tool now implements a sophisticated two-phase orchestration workflow:

1. **Phase 1**: Individual expert analysis (900 tokens each)
2. **Phase 2**: Gemini File Search RAG consolidation for enterprise-ready guidance

## Workflow Details

### Phase 1: Individual Expert Analysis

1. **Expert Execution**: Each of the 18 financial experts is called individually using Gemini (not CLI tools)
   - Model: Uses `GEMINI_MODEL` environment variable (default: `gemini-1.5-flash-latest`)
   - Token Limit: 900 tokens per expert (enforced via `maxOutputTokens: 900`)
   - Prompt: Each expert's full prompt (from `agents/*.md` files) with the topic inserted

2. **File Storage**: Each expert's response is saved to an individual markdown file
   - Location: `{FINANCE_EXPERTS_OUTPUT_DIR}/expert_outputs_{timestamp}/`
   - Format: `{expert_name}_{timestamp}.md`
   - Content: Expert name, topic, and their 900-token analysis

3. **Parallel Processing**: All 18 experts are processed in parallel using `Promise.allSettled`

### Phase 2: Gemini File Search RAG Consolidation

1. **File Preparation**: All expert output files are prepared for RAG analysis
   - Files are read and encoded as base64 inline data
   - MIME type: `text/markdown`
   - All files are included in a single RAG query

2. **RAG Analysis**: Gemini File Search RAG API is used to analyze all expert outputs
   - Model: Uses `ORCHESTRATOR_MODEL` (prefers Gemini 2.5 Pro) or falls back to `GEMINI_MODEL`
   - Max Tokens: 4000 tokens for comprehensive analysis
   - Temperature: 0.7 (balanced creativity and precision)

3. **Consolidation Prompt**: The RAG model receives:
   - All expert output files as inline data
   - A comprehensive prompt requesting:
     - Synthesis of all expert perspectives
     - Strategic recommendations
     - Areas requiring further analysis
     - Recommended orchestrator prompt for CLI tools
     - Implementation roadmap
     - Confidence assessment

4. **Output Generation**: The consolidated analysis includes:
   - **Consolidated Expert Analysis Summary**: Comprehensive synthesis
   - **Strategic Recommendations**: Enterprise-ready recommendations
   - **Areas Requiring Further Analysis**: Specific focus areas for CLI tools
   - **Recommended Orchestrator Prompt**: Detailed prompt for CLI tools execution
   - **Implementation Roadmap**: Step-by-step guidance
   - **Confidence Assessment**: Overall confidence and risk factors

### Fallback Mechanism

If Gemini File Search RAG fails:
- Falls back to text-based consolidation
- Reads all expert responses as text
- Uses standard Gemini API to synthesize insights
- Still generates orchestrator prompt

## Output Structure

### Individual Expert Files
```
expert_outputs_{timestamp}/
├── damodaran_{timestamp}.md
├── graham_{timestamp}.md
├── buffett_{timestamp}.md
├── munger_{timestamp}.md
├── ... (all 18 experts)
```

### Consolidated Report
```
{output_filename}_{timestamp}.md
├── Individual Expert Perspectives (all 18)
├── Consolidated Expert Analysis (Gemini File Search RAG)
├── Expert Output Files reference
└── API Errors (if any)
```

## Configuration

### Environment Variables

- `GEMINI_API_KEY`: Required for expert analysis and RAG consolidation
- `GEMINI_MODEL`: Model for individual experts (default: `gemini-1.5-flash-latest`)
- `ORCHESTRATOR_MODEL`: Preferred model for RAG consolidation (default: uses `GEMINI_MODEL`)
  - If set to `google/gemini-2.5-pro`, will use `gemini-2.5-pro` for consolidation
- `FINANCE_EXPERTS_OUTPUT_DIR`: Output directory (default: `./output/finance-experts`)

### Model Selection

- **Individual Experts**: Uses `GEMINI_MODEL` (typically faster, cheaper model)
- **RAG Consolidation**: Uses `ORCHESTRATOR_MODEL` if available (prefers Gemini 2.5 Pro for better synthesis)

## Usage Example

```typescript
const result = await server.execute("finance_experts", {
  topic: "Financial risks and opportunities of expanding into European markets",
  output_filename: "europe_expansion_analysis"
});

// Returns:
// - Individual expert analyses in expert_outputs_{timestamp}/
// - Consolidated report with RAG-based synthesis
// - Recommended orchestrator prompt for CLI tools
```

## Benefits

1. **Comprehensive Analysis**: 18 diverse expert perspectives on every topic
2. **Token Efficiency**: 900 tokens per expert (16,200 total) vs. unlimited
3. **RAG-Powered Synthesis**: Gemini File Search RAG provides deep understanding of all perspectives
4. **Enterprise-Ready**: Consolidated analysis guides CLI tools to create production-grade outputs
5. **Actionable Guidance**: Specific orchestrator prompts for CLI tool execution

## Technical Details

### Token Limits
- Individual Experts: 900 tokens max per expert
- RAG Consolidation: 4000 tokens max for comprehensive synthesis
- Total Expert Input: ~16,200 tokens (18 × 900)

### File Format
- Expert files: Markdown with expert name, topic, and analysis
- Consolidated report: Comprehensive markdown with all sections

### Error Handling
- Individual expert failures don't stop the process
- RAG failures fall back to text-based consolidation
- All errors are logged and reported in output

## Next Steps

After receiving the consolidated analysis:
1. Review the "Recommended Orchestrator Prompt"
2. Use that prompt with the `orchestrate_agents` tool
3. CLI tools will execute based on expert-guided instructions
4. Results will be enterprise-ready, production-grade analysis

