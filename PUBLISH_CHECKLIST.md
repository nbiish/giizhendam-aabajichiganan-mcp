# Publishing Checklist - v0.6.0

## ✅ Pre-Publish Checklist

### Code Changes
- [x] Removed `@google/generative-ai` dependency
- [x] Unified all AI calls to use OpenRouter
- [x] Updated to use `ORCHESTRATOR_MODEL` throughout
- [x] Enhanced `finance_experts` with 18 agents + RAG consolidation
- [x] Updated `ceo_and_board` to use orchestrator model
- [x] Build successful with no errors

### Documentation
- [x] Updated main README.md with v0.6.0 changes
- [x] Added ORCHESTRATOR_MODEL_CONFIG.md
- [x] Added FINANCE_EXPERTS_WORKFLOW.md
- [x] Added CHANGELOG.md
- [x] Updated mcp.json configuration example
- [x] Updated installation instructions (npx format)

### Configuration
- [x] Updated mcp.json to use `npx -y` format
- [x] Removed GEMINI_API_KEY from config
- [x] Version bumped to 0.6.0

### Package
- [x] package.json version: 0.6.0
- [x] Dependencies cleaned (removed @google/generative-ai)
- [x] Build artifacts in dist/ directory
- [x] prepublishOnly script configured

## 📦 Publishing Steps

### 1. Final Build Verification
```bash
npm run build
npm test  # If tests exist
```

### 2. Publish to npm
```bash
npm publish --access public
```

### 3. Verify Publication
```bash
npm view @nbiish/giizhendam-aabajichiganan-mcp version
# Should show: 0.6.0
```

### 4. Test Installation
```bash
# Test via npx (as users would)
npx -y @nbiish/giizhendam-aabajichiganan-mcp --version

# Or install globally
npm install -g @nbiish/giizhendam-aabajichiganan-mcp
giizhendam-mcp --version
```

## 🔄 Alternative Package Name

**Note**: The README mentions `@nbiish/ai-tool-mcp` as an alternative package name. If this is a separate package that should mirror this one:

1. Check if `@nbiish/ai-tool-mcp` exists as a separate repo
2. If it's an alias or separate package, publish to both names
3. Update both READMEs if they're separate repositories

## 📝 Post-Publish

- [ ] Update GitHub releases with v0.6.0 changelog
- [ ] Verify MCP configuration works with new version
- [ ] Test `finance_experts` tool with real topic
- [ ] Test `ceo_and_board` tool
- [ ] Monitor npm download stats

## 🚀 Ready to Publish

All checks complete! Ready to publish v0.6.0 to npm.

**Command to publish:**
```bash
npm publish --access public
```

