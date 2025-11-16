#!/bin/bash

# Dual Publish Script
# Publishes both @nbiish/giizhendam-aabajichiganan-mcp and @nbiish/ai-tool-mcp packages
# 
# Workflow:
# 1. Build Package 1
# 2. Check prerequisites (clean working tree, npm login)
# 3. Bump version for Package 1
# 4. Commit version bump for Package 1
# 5. Publish Package 1
# 6. Sync version to Package 2
# 7. Update Package 2 dependency to match Package 1 version
# 8. Commit changes for Package 2
# 9. Publish Package 2
#
# Requirements:
# - Clean working tree (no uncommitted changes)
# - npm login completed
# - OTP code for npm publish

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Configuration ---
# Directory of the first package (current directory)
PKG1_DIR="."
# Directory of the second package (relative to the first)
PKG2_DIR="../ai-tool-mcp-pkg"
# Build output directory name (assumed to be the same for both)
BUILD_DIR="dist"

echo "
╭──────────────────────────────────────────────╮
│  ᐴ MAAJITAAWIN ᔔ [ BEGINNING THE JOURNEY ]   │
│  ◈──◆──◇─◈ DUAL PUBLISH SYSTEM ◈─◇──◆──◈     │
╰──────────────────────────────────────────────╯
"

echo "
╭──────────────────────────────────────────────╮
│  ᐴ OZHITOON ᔔ [ BUILDING THE PATH ]          │
│  ◈──◆──◇─◈ EARLY BUILD PROCESS ◈─◇──◆──◈     │
╰──────────────────────────────────────────────╯
"
echo "Building Package 1 (early build before any version bump or publish)..."
npm run build # Assumes 'build' script exists in package.json

echo "
╭──────────────────────────────────────────────╮
│  ᐴ GANAWAABANDAAN ᔔ [ EXAMINING WITH CARE ]  │
│  ◈──◆──◇─◈ SYSTEM PRE-CHECKS ◈─◇──◆──◈       │
╰──────────────────────────────────────────────╯
"
echo "Checking prerequisites..."

# Check if the second package directory exists
if [ ! -d "$PKG2_DIR" ]; then
    echo "ERROR: Second package directory not found at '$PKG2_DIR'"
    exit 1
fi
echo "Found second package directory: $PKG2_DIR"

# Check if logged into npm
npm whoami > /dev/null || (echo "ERROR: Not logged into npm. Please run 'npm login' first." && exit 1)
echo "NPM login check passed."

# Check for uncommitted changes in PKG1 - fail if found (user should commit manually)
if ! git diff --quiet HEAD -- "$PKG1_DIR"; then
    echo "ERROR: Uncommitted changes detected in '$PKG1_DIR'."
    echo "Please commit or stash your changes before running dual-publish.sh"
    git status --short
    exit 1
fi
echo "✅ Working tree is clean. Ready to proceed with version bump."

echo "
╭──────────────────────────────────────────────╮
│  ᐴ ISHKWAAJAANIIKE ᔔ [ UPGRADING ]           │
│  ◈──◆──◇─◈ VERSION MANAGEMENT ◈─◇──◆──◈      │
╰──────────────────────────────────────────────╯
"
echo "Processing Package 1 ($PKG1_DIR)..."
cd "$PKG1_DIR"
CURRENT_VERSION=$(npm pkg get version | tr -d '"')
echo "Current version in $PKG1_DIR: $CURRENT_VERSION"

echo "Bumping patch version..."
# Use npm version patch to calculate and update package.json, but don't create a git tag yet
NEW_VERSION=$(npm version patch --no-git-tag-version | tr -d 'v') 
if [ -z "$NEW_VERSION" ]; then
    echo "ERROR: Failed to determine new version."
    exit 1
fi
echo "New version set to: $NEW_VERSION"

echo "
╭──────────────────────────────────────────────╮
│  ᐴ GANAWENDAAGWAD ᔔ [ SECURING THE PATH ]    │
│  ◈──◆──◇─◈ AUTHORIZATION REQUIRED ◈─◇──◆──◈  │
╰──────────────────────────────────────────────╯
"
read -sp "Enter NPM OTP for publishing version $NEW_VERSION: " NPM_OTP
echo # Add a newline for cleaner output
if [ -z "$NPM_OTP" ]; then
    echo "ERROR: OTP cannot be empty."
    exit 1
fi

echo "
╭──────────────────────────────────────────────╮
│  ᐴ NITAM MIIGIWEWIN ᔔ [ FIRST OFFERING ]     │
│  ◈──◆──◇─◈ PACKAGE ONE PUBLISH ◈─◇──◆──◈     │
╰──────────────────────────────────────────────╯
"
echo "Staging Package 1 changes (version bump + build artifacts)..."
git add package.json package-lock.json dist/ 2>/dev/null || true

echo "Committing Package 1 version bump..."
git commit -m "chore: bump version to $NEW_VERSION" || {
    echo "WARNING: Could not commit. Continuing anyway..."
}

echo "Publishing Package 1 (@nbiish/giizhendam-aabajichiganan-mcp) version $NEW_VERSION..."
npm publish --otp="$NPM_OTP" --access public # Added --access public, adjust if needed
echo "Package 1 published successfully."

echo "
╭──────────────────────────────────────────────╮
│  ᐴ GANAWENDAAGWAD ᔔ [ WAITING FOR PROPAGATION ] │
│  ◈──◆──◇─◈ NPM REGISTRY SYNC ◈─◇──◆──◈       │
╰──────────────────────────────────────────────╯
"
echo "Waiting for npm registry to propagate Package 1 version $NEW_VERSION..."
# Function to check if package version is available on npm
wait_for_package() {
    local pkg_name="$1"
    local version="$2"
    local max_attempts=30
    local attempt=1
    local wait_time=2
    
    while [ $attempt -le $max_attempts ]; do
        if npm view "${pkg_name}@${version}" version > /dev/null 2>&1; then
            echo "✅ Package ${pkg_name}@${version} is now available on npm registry."
            return 0
        fi
        echo "⏳ Attempt $attempt/$max_attempts: Package not yet available, waiting ${wait_time}s..."
        sleep $wait_time
        attempt=$((attempt + 1))
        # Exponential backoff, max 10 seconds
        if [ $wait_time -lt 10 ]; then
            wait_time=$((wait_time + 1))
        fi
    done
    
    echo "❌ ERROR: Package ${pkg_name}@${version} did not become available after $max_attempts attempts."
    return 1
}

# Wait for Package 1 to be available before proceeding
if ! wait_for_package "@nbiish/giizhendam-aabajichiganan-mcp" "$NEW_VERSION"; then
    echo "ERROR: Failed to verify Package 1 availability. Aborting Package 2 publish."
    exit 1
fi

echo "
╭──────────────────────────────────────────────╮
│  ᐴ NIIZH MIIGIWEWIN ᔔ [ SECOND OFFERING ]    │
│  ◈──◆──◇─◈ PACKAGE TWO PUBLISH ◈─◇──◆──◈     │
╰──────────────────────────────────────────────╯
"
echo "Processing Package 2 ($PKG2_DIR)..."
ORIGINAL_DIR=$(pwd) # Save current dir before changing
cd "$PKG2_DIR"

# Check if package.json exists in PKG2
if [ ! -f "package.json" ]; then
    echo "ERROR: package.json not found in '$PKG2_DIR'."
    cd "$ORIGINAL_DIR" # Go back before exiting
    exit 1
fi

# Check for uncommitted changes in PKG2 before changing version
# Note: The check for uncommitted changes is still commented as it might not be a git repository
# if ! git diff --quiet HEAD -- .; then
#    echo "ERROR: Uncommitted changes detected in \'$PKG2_DIR\'. Please commit or stash them first."
#    cd "$ORIGINAL_DIR" # Go back before exiting
#    exit 1
# fi
# echo "No uncommitted changes in $PKG2_DIR."

echo "Setting Package 2 version to $NEW_VERSION..."
# Set the exact same version, allow if it somehow matches (shouldn't happen here)
npm version "$NEW_VERSION" --no-git-tag-version --allow-same-version

echo "Updating Package 2 dependency to match new version..."
# Update the dependency version in package.json to match the new version
node -e "const fs = require('fs'); const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8')); pkg.dependencies['@nbiish/giizhendam-aabajichiganan-mcp'] = '^${NEW_VERSION}'; fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');"

echo "Updating lockfile for Package 2..."
npm install

# Package 2 doesn't need a build (it's an alias package)
echo "Skipping build for Package 2 (alias package, no build needed)..."

# Git operations for Package 2 - Note: This assumes Package 2 is part of a git repository
# If Package 2 is not a git repository, these commands will fail gracefully
echo "Staging Package 2 changes..."
git add package.json package-lock.json 2>/dev/null || echo "WARNING: Could not add files for Package 2. Is it a git repository?"

echo "Committing Package 2 version bump..."
git commit -m "chore: bump version to $NEW_VERSION and update dependency" || echo "WARNING: Could not commit for Package 2."

echo "Publishing Package 2 (@nbiish/ai-tool-mcp) version $NEW_VERSION..." # Assumed name
npm publish --otp="$NPM_OTP" --access public # Added --access public, adjust if needed
echo "Package 2 published successfully."

echo "
╭──────────────────────────────────────────────╮
│  ᐴ GIIZHIITAA ᔔ [ MISSION ACCOMPLISHED ]     │
│  ◈──◆──◇─◈ DEPLOYMENT COMPLETE ◈─◇──◆──◈     │
╰──────────────────────────────────────────────╯
"
cd "$ORIGINAL_DIR" # Return to the starting directory
echo "Dual publish complete for version $NEW_VERSION."
echo "Packages published:"
echo "- @nbiish/giizhendam-aabajichiganan-mcp@$NEW_VERSION"
echo "- @nbiish/ai-tool-mcp@$NEW_VERSION (from $PKG2_DIR)"

exit 0 