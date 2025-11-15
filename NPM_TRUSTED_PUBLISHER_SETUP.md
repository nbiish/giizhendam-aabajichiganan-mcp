# npm Trusted Publisher Setup Guide

This guide will help you set up npm's Trusted Publisher using GitHub Actions and OpenID Connect (OIDC).

## What is Trusted Publisher?

Trusted Publisher is npm's secure way to publish packages using OpenID Connect (OIDC) tokens instead of long-lived npm tokens. This is more secure because:
- No npm tokens to manage or rotate
- Tokens are automatically generated and short-lived
- GitHub Actions handles authentication automatically

## Setup Steps

### Step 1: Verify Your Workflow File

The workflow file `.github/workflows/npm-publish.yml` is already configured with:
- ✅ `id-token: write` permission (required for OIDC)
- ✅ `setup-node@v4` with `registry-url` (enables OIDC auth)
- ✅ No `NODE_AUTH_TOKEN` secret needed

### Step 2: Configure Trusted Publisher on npm

1. **Go to your npm package page:**
   - Visit: https://www.npmjs.com/package/@nbiish/giizhendam-aabajichiganan-mcp
   - Click on your package name to go to the package page

2. **Navigate to Package Settings:**
   - Click on the package name in the top navigation
   - Go to the "Settings" or "Access" tab
   - Look for "Trusted Publishers" section

3. **Add Trusted Publisher:**
   - Click "Add Trusted Publisher" or "Set up connection"
   - Select **Publisher**: `GitHub Actions`
   - **Organization or user**: `nbiish`
   - **Repository**: `giizhendam-aabajichiganan-mcp`
   - **Workflow filename**: `npm-publish.yml` (the filename in `.github/workflows/`)
   - **Environment name**: (leave empty unless using GitHub Environments)

4. **Complete Setup:**
   - Click "Set up connection"
   - npm will verify the workflow file exists
   - Once verified, the trusted publisher is active

### Step 3: Test the Setup

#### Option A: Create a GitHub Release (Recommended)

```bash
# Create a release which triggers the workflow
gh release create v0.6.0 --title "Release v0.6.0" --notes "See CHANGELOG.md"
```

#### Option B: Manual Workflow Dispatch

1. Go to your GitHub repository
2. Click "Actions" tab
3. Select "Publish to npm" workflow
4. Click "Run workflow"
5. Enter version: `0.6.0`
6. Click "Run workflow"

### Step 4: Verify Publication

After the workflow runs:
1. Check the Actions tab for successful completion
2. Verify on npm: https://www.npmjs.com/package/@nbiish/giizhendam-aabajichiganan-mcp
3. The version should appear in the package page

## Troubleshooting

### "Workflow file not found"
- Ensure the file is named exactly `npm-publish.yml`
- Ensure it's in `.github/workflows/` directory
- Ensure it's committed to the repository

### "Permission denied"
- Verify `id-token: write` is in the workflow permissions
- Ensure you're the package owner on npm
- Check that the repository name matches exactly

### "Version already published"
- The workflow checks if the version exists before publishing
- Bump the version in `package.json` before creating a release
- Or use a different version number

### "Package verification failed"
- Ensure `agents` directory exists with `.md` files
- Ensure `dist` directory exists with compiled files
- Run `npm run build` locally to verify

## Workflow Details

The workflow (`npm-publish.yml`) will:
1. ✅ Checkout the repository
2. ✅ Set up Node.js with npm registry
3. ✅ Install dependencies
4. ✅ Build the package
5. ✅ Verify package contents (agents, dist)
6. ✅ Check if version already published
7. ✅ Publish to npm (using OIDC token)
8. ✅ Verify publication succeeded
9. ✅ Test installation via npx
10. ✅ Create GitHub release (if triggered by release event)

## Security Notes

- ✅ No npm tokens stored in GitHub Secrets
- ✅ Uses short-lived OIDC tokens
- ✅ Tokens are automatically generated per workflow run
- ✅ Only works from the specified repository and workflow file

## Next Steps After Setup

1. **Test the workflow:**
   ```bash
   # Create a test release
   gh release create v0.6.0-test --title "Test" --notes "Testing"
   ```

2. **Monitor the workflow:**
   - Go to Actions tab in GitHub
   - Watch the workflow run
   - Check for any errors

3. **Verify on npm:**
   - Check your package page
   - Verify the new version appears
   - Test installation: `npx -y @nbiish/giizhendam-aabajichiganan-mcp`

## Alternative: Using npm Token (Not Recommended)

If you prefer to use an npm token instead (less secure):
1. Create an npm access token (Automation type)
2. Add it as `NPM_TOKEN` secret in GitHub
3. Update the workflow to use `NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}`

However, **Trusted Publisher is recommended** for better security.

