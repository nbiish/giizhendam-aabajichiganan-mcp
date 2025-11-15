# Installation Complete - Configuration Guide

## ✅ Installation Status

The Giizhendam Aabajichiganan MCP Server has been successfully installed globally.

- **Executable Location**: `/opt/homebrew/bin/giizhendam-mcp`
- **Package Version**: v0.5.3
- **Server Version**: v0.5.0
- **Status**: ✅ Installed and verified working

## 🔧 Required Configuration

### 1. Environment Variables

The server requires the following environment variables to be set (typically in your MCP client configuration):

#### Required:
- `OPENROUTER_API_KEY` - Your OpenRouter API key (required for orchestrator tool)

#### Optional but Recommended:
- `GEMINI_API_KEY` - Direct Gemini API key (required for `finance_experts` and `ceo_and_board` tools)
- `GEMINI_MODEL` - Default: `gemini-1.5-flash-latest`

#### Optional Configuration:
- `ORCHESTRATOR_MODEL` - Default: `google/gemini-2.5-pro`
- `OPENROUTER_TIMEOUT_MS` - Default: `30000`
- `CLI_AGENTS_JSON` - JSON array of agent definitions (see example below)
- `AGENT_OUTPUT_DIR` - Default: `./output/agents`
- `EXECUTION_STYLE` - Options: `auto`, `sequential`, `parallel` (Default: `auto`)
- `FINANCE_EXPERTS_OUTPUT_DIR` - Default: `./output/finance-experts`
- `CEO_BOARD_OUTPUT_DIR` - Default: `./output/ceo-and-board`
- `SYNTH_MAX_PER_AGENT_CHARS` - Default: `20000`
- `SYNTH_MAX_TOTAL_CHARS` - Default: `150000`

### 2. MCP Client Configuration

Add the following to your MCP client configuration file (typically `mcp.json` or `.configs/MCP/settings.json`):

```json
{
  "mcpServers": {
    "giizhendam-mcp": {
      "command": "giizhendam-mcp",
      "env": {
        "OPENROUTER_API_KEY": "YOUR_OPENROUTER_API_KEY_HERE",
        "GEMINI_API_KEY": "YOUR_GEMINI_API_KEY_HERE",
        "ORCHESTRATOR_MODEL": "google/gemini-2.5-pro",
        "CLI_AGENTS_JSON": "[{\"name\":\"Qwen\",\"cmd\":\"qwen -y \\\"{prompt}\\\"\"}]",
        "AGENT_OUTPUT_DIR": "./output/agents",
        "EXECUTION_STYLE": "auto",
        "FINANCE_EXPERTS_OUTPUT_DIR": "./output/finance-experts",
        "CEO_BOARD_OUTPUT_DIR": "./output/ceo-and-board"
      },
      "cwd": "/path/to/your/project"
    }
  }
}
```

**Alternative using npx:**
```json
{
  "mcpServers": {
    "giizhendam-mcp": {
      "command": "npx",
      "args": ["-y", "@nbiish/giizhendam-aabajichiganan-mcp"],
      "env": {
        "OPENROUTER_API_KEY": "YOUR_OPENROUTER_API_KEY_HERE"
      }
    }
  }
}
```

### 3. CLI Agents Configuration

You can configure CLI agents in two ways:

#### Option A: Using CLI_AGENTS_JSON (Recommended)
Set the `CLI_AGENTS_JSON` environment variable with a JSON array:
```json
[
  {"name":"Qwen","cmd":"qwen -y \"{prompt}\""},
  {"name":"Gemini","cmd":"gemini -y \"{prompt}\""},
  {"name":"Cursor","cmd":"cursor agent --print --approve-mcps \"{prompt}\""}
]
```

#### Option B: Using llms.txt (Fallback)
If `CLI_AGENTS_JSON` is not set, the server will parse `llms.txt` in the current working directory. The file format is:
```
- AgentName
```bash
command with {prompt} placeholder
```
```

## 🧪 Testing

### Test Server Startup
```bash
export PATH="/opt/homebrew/bin:$PATH"
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' | giizhendam-mcp
```

Expected output should include:
- `--- MCP SCRIPT START ---`
- `giizhendam-multi-agent-orchestrator-mcp v0.5.0 running on stdio`
- A JSON-RPC response

### Test Tools via MCP Client

Once configured in your MCP client, you can test:

1. **orchestrate_agents** - Requires `OPENROUTER_API_KEY` and configured CLI agents
2. **finance_experts** - Requires `GEMINI_API_KEY`
3. **ceo_and_board** - Requires `GEMINI_API_KEY`

## 📝 Notes

- The server logs to `/tmp/giizhendam_mcp_v0_5_0_log.txt`
- Output directories are created automatically if they don't exist
- The server uses stdio for MCP protocol communication
- Ensure all CLI tools referenced in agent configurations are installed and in your PATH

## 🐛 Troubleshooting

### Issue: "command not found: giizhendam-mcp"
**Solution**: Ensure `/opt/homebrew/bin` is in your PATH:
```bash
export PATH="/opt/homebrew/bin:$PATH"
```

### Issue: Server doesn't start
**Solution**: Check the log file:
```bash
tail -f /tmp/giizhendam_mcp_v0_5_0_log.txt
```

### Issue: API errors
**Solution**: Verify your API keys are set correctly in the MCP client configuration

### Issue: CLI agents not found
**Solution**: Ensure the CLI tools (qwen, gemini, etc.) are installed and accessible in your PATH

## ✅ Installation Checklist

- [x] Node.js installed and in PATH
- [x] Dependencies installed (`npm install`)
- [x] Project built (`npm run build`)
- [x] Global installation completed (`npm install -g .`)
- [x] Executable verified working
- [ ] OPENROUTER_API_KEY configured
- [ ] GEMINI_API_KEY configured (if using finance_experts or ceo_and_board)
- [ ] MCP client configuration updated
- [ ] CLI agents configured (CLI_AGENTS_JSON or llms.txt)
- [ ] Tested via MCP client

