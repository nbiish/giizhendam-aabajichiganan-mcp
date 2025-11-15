# Orchestrator Model Configuration

## Overview

The entire codebase now uses a **single configurable orchestrator model** via OpenRouter. This allows you to easily swap between different models (Gemini, Claude, GPT-4, etc.) for testing and optimization.

## Configuration

### Environment Variable

Set `ORCHESTRATOR_MODEL` to configure which model to use:

```bash
export ORCHESTRATOR_MODEL="google/gemini-2.5-pro"
```

### Default Model

If not specified, defaults to: `google/gemini-2.5-pro`

### Supported Models

Any model supported by OpenRouter can be used. Examples:

- **Google Models:**
  - `google/gemini-2.5-pro` (default)
  - `google/gemini-2.0-flash-exp`
  - `google/gemini-1.5-pro`
  - `google/gemini-1.5-flash`

- **Anthropic Models:**
  - `anthropic/claude-3.5-sonnet`
  - `anthropic/claude-3-opus`
  - `anthropic/claude-3-haiku`

- **OpenAI Models:**
  - `openai/gpt-4-turbo`
  - `openai/gpt-4`
  - `openai/gpt-3.5-turbo`

- **Other Providers:**
  - `meta-llama/llama-3.1-405b-instruct`
  - `mistralai/mixtral-8x7b-instruct`
  - And many more via OpenRouter

## Where It's Used

The orchestrator model is used throughout the codebase for:

1. **Finance Experts Tool:**
   - Individual expert analysis (18 experts, 900 tokens each)
   - RAG consolidation of all expert outputs
   - Strategic advisory generation

2. **CEO and Board Tool:**
   - Board simulation generation
   - Orchestrator prompt deliberation

3. **Future Tools:**
   - All AI operations will use the orchestrator model

## Benefits

1. **Unified Configuration:** One model setting for all operations
2. **Easy Testing:** Swap models to compare outputs
3. **Future-Proof:** Use new models as they become available
4. **Cost Optimization:** Choose models based on performance/cost tradeoffs
5. **OpenRouter Integration:** Access to 100+ models through one API

## Example Configurations

### MCP Configuration (`mcp.json`)

```json
{
  "mcpServers": {
    "giizhendam-mcp": {
      "command": "giizhendam-mcp",
      "env": {
        "OPENROUTER_API_KEY": "your-key-here",
        "ORCHESTRATOR_MODEL": "google/gemini-2.5-pro",
        "FINANCE_EXPERTS_OUTPUT_DIR": "./output/finance-experts",
        "CEO_BOARD_OUTPUT_DIR": "./output/ceo-and-board"
      }
    }
  }
}
```

### Testing Different Models

```bash
# Test with Claude 3.5 Sonnet
export ORCHESTRATOR_MODEL="anthropic/claude-3.5-sonnet"

# Test with GPT-4 Turbo
export ORCHESTRATOR_MODEL="openai/gpt-4-turbo"

# Test with Gemini 2.0 Flash (faster, cheaper)
export ORCHESTRATOR_MODEL="google/gemini-2.0-flash-exp"
```

## Migration Notes

### Removed Dependencies

- `@google/generative-ai` - No longer needed
- Direct Gemini API calls - All replaced with OpenRouter

### Required Environment Variables

- `OPENROUTER_API_KEY` or `OPENROUTER_API_AGENTS` - Required
- `ORCHESTRATOR_MODEL` - Optional (defaults to `google/gemini-2.5-pro`)

### Removed Environment Variables

- `GEMINI_API_KEY` - No longer used
- `GEMINI_MODEL` - Replaced by `ORCHESTRATOR_MODEL`

## Performance Considerations

- **Token Limits:** Each expert limited to 900 tokens; consolidation limited to 4000 tokens
- **Temperature:** 
  - Expert analysis: 0.7 (balanced)
  - RAG consolidation: 0.7 (balanced)
  - Board simulation: 0.8 (more creative)
- **Timeout:** Default 30 seconds (configurable via `OPENROUTER_TIMEOUT_MS`)

## Troubleshooting

### Model Not Found

If you get a "model not found" error:
1. Check the model name format (must match OpenRouter's format exactly)
2. Verify the model is available on OpenRouter
3. Check your OpenRouter API key has access to the model

### Rate Limits

If you hit rate limits:
1. Consider using a faster/cheaper model for testing
2. Reduce parallel operations
3. Check OpenRouter dashboard for usage limits

### Cost Optimization

- Use `gemini-2.0-flash-exp` for faster/cheaper operations
- Use `gemini-2.5-pro` for highest quality
- Use `claude-3-haiku` for cost-effective alternatives

