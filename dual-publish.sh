#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Configuration ---
# Directory of the first package (current directory)
PKG1_DIR="."
# Directory of the second package (relative to the first)
PKG2_DIR="../ai-tool-mcp-pkg"
# Build output directory name (assumed to be the same for both)
BUILD_DIR="dist"

echo "--- Dual Publish Script ---"

# --- Pre-Checks ---
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

# Check for uncommitted changes in PKG1
if ! git diff --quiet HEAD -- "$PKG1_DIR"; then
    echo "ERROR: Uncommitted changes detected in '$PKG1_DIR'. Please commit or stash them first."
    exit 1
fi
echo "No uncommitted changes in $PKG1_DIR."

# --- Version Bump (in PKG1) ---
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

# --- OTP Prompt ---
read -sp "Enter NPM OTP for publishing version $NEW_VERSION: " NPM_OTP
echo # Add a newline for cleaner output
if [ -z "$NPM_OTP" ]; then
    echo "ERROR: OTP cannot be empty."
    exit 1
fi

# --- Process Package 1 (Build, Commit, Publish) ---
echo "Updating lockfile for Package 1..."
npm install

echo "Building Package 1..."
npm run build # Assumes 'build' script exists in package.json

echo "Staging and committing Package 1 changes..."
git add package.json package-lock.json "$BUILD_DIR/"
git commit -m "chore: bump version to $NEW_VERSION"

echo "Publishing Package 1 (@nbiish/giizhendam-aabajichiganan-mcp) version $NEW_VERSION..."
npm publish --otp="$NPM_OTP" --access public # Added --access public, adjust if needed
echo "Package 1 published successfully."

# --- Process Package 2 (Update Version, Build, Commit, Publish) ---
echo "-----------------------------"
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
# if ! git diff --quiet HEAD -- .; then
#    echo "ERROR: Uncommitted changes detected in \'$PKG2_DIR\'. Please commit or stash them first."
#    cd "$ORIGINAL_DIR" # Go back before exiting
#    exit 1
# fi
# echo "No uncommitted changes in $PKG2_DIR." # Also commented out as it refers to the check

echo "Setting Package 2 version to $NEW_VERSION..."
# Set the exact same version, allow if it somehow matches (shouldn't happen here)
npm version "$NEW_VERSION" --no-git-tag-version --allow-same-version

echo "Updating lockfile for Package 2..."
npm install

echo "Building Package 2..."
npm run build # Assumes 'build' script exists and is the same name

# echo "Staging and committing Package 2 changes..."
# git add package.json package-lock.json "$BUILD_DIR/"
# git commit -m "chore: bump version to $NEW_VERSION"

echo "Publishing Package 2 (@nbiish/ai-tool-mcp) version $NEW_VERSION..." # Assumed name
npm publish --otp="$NPM_OTP" --access public # Added --access public, adjust if needed
echo "Package 2 published successfully."

# --- Completion ---
echo "-----------------------------"
cd "$ORIGINAL_DIR" # Return to the starting directory
echo "Dual publish complete for version $NEW_VERSION."
echo "Packages published:"
echo "- @nbiish/giizhendam-aabajichiganan-mcp@$NEW_VERSION"
echo "- @nbiish/ai-tool-mcp@$NEW_VERSION (from $PKG2_DIR)"

exit 0 