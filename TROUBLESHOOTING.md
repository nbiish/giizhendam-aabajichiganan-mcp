# Troubleshooting Guide

## Issues Found and Resolved During Installation

### ✅ Issue: Duplicate Shebang in Compiled Output
**Problem**: The source file (`src/index.ts`) had a shebang line, and esbuild was adding another one via the banner flag, causing a syntax error when Node.js tried to execute the file.

**Solution**: Removed the shebang from `src/index.ts` since esbuild adds it automatically via the `--banner:js='#!/usr/bin/env node'` flag in the build script.

**Status**: ✅ Fixed

### ✅ Issue: Node.js Not in PATH
**Problem**: Node.js was installed at `/opt/homebrew/bin/node` but not accessible in the default PATH.

**Solution**: Added `/opt/homebrew/bin` to PATH. For permanent fix, add to shell profile:
```bash
echo 'export PATH="/opt/homebrew/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

**Status**: ✅ Resolved (temporary PATH export used during installation)

## Common Issues and Solutions

### Server Won't Start

**Symptoms**: 
- "command not found: giizhendam-mcp"
- Syntax errors when running the server

**Solutions**:
1. Ensure Node.js is in PATH:
   ```bash
   export PATH="/opt/homebrew/bin:$PATH"
   which node
   ```

2. Verify global installation:
   ```bash
   npm list -g @nbiish/giizhendam-aabajichiganan-mcp
   ```

3. Check executable permissions:
   ```bash
   ls -l $(which giizhendam-mcp)
   ```

4. Rebuild and reinstall:
   ```bash
   npm run build
   npm install -g .
   ```

### API Key Errors

**Symptoms**:
- "OpenRouter key not set" errors
- "GEMINI_API_KEY missing" errors

**Solutions**:
1. Verify environment variables are set in MCP client configuration
2. Check that `env` block in MCP config is properly formatted
3. Test environment variable access:
   ```bash
   echo $OPENROUTER_API_KEY
   ```

### CLI Agents Not Found

**Symptoms**:
- "No CLI agents configured" error
- Agent execution failures

**Solutions**:
1. Set `CLI_AGENTS_JSON` environment variable with valid JSON
2. Or ensure `llms.txt` exists in the working directory (`cwd` from MCP config)
3. Verify CLI tools are installed and in PATH:
   ```bash
   which qwen gemini cursor
   ```

### Output Directory Issues

**Symptoms**:
- Files not being written
- Permission errors

**Solutions**:
1. Check that output directories are writable
2. Verify `cwd` in MCP config points to a valid directory
3. Check log file for specific errors:
   ```bash
   tail -f /tmp/giizhendam_mcp_v0_5_0_log.txt
   ```

### Build Issues

**Symptoms**:
- TypeScript compilation errors
- Missing dependencies

**Solutions**:
1. Clean and reinstall dependencies:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. Rebuild:
   ```bash
   npm run build
   ```

3. Check TypeScript version compatibility:
   ```bash
   npm list typescript
   ```

## Verification Checklist

Run these commands to verify installation:

```bash
# 1. Check Node.js version (should be >= 14.0.0)
node --version

# 2. Check global installation
npm list -g @nbiish/giizhendam-aabajichiganan-mcp

# 3. Verify executable exists
which giizhendam-mcp

# 4. Test server startup
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' | giizhendam-mcp

# 5. List available tools
echo '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' | giizhendam-mcp | grep -o '"name":"[^"]*"'

# 6. Check log file
tail -n 20 /tmp/giizhendam_mcp_v0_5_0_log.txt
```

## Getting Help

If issues persist:

1. Check the log file: `/tmp/giizhendam_mcp_v0_5_0_log.txt`
2. Review the README.md for configuration examples
3. Verify all environment variables are set correctly
4. Ensure MCP client configuration matches the examples in INSTALLATION_COMPLETE.md

