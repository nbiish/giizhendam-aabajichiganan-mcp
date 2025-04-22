#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Define package names
# ᑮᔐᓐᑕᒻ ᐋᐸᒋᒋᑲᓇᓐ (Giizhendam Aabajichiganan) - Traditional Anishinaabe'mowin Name
PRIMARY_NAME="@nbiish/giizhendam-aabajichiganan-mcp"
# English Translation Name
ENGLISH_NAME="@nbiish/ai-tool-mcp"

# --- Pre-Publish Checks ---
# Ensure user is logged into npm
npm whoami > /dev/null || (echo "ERROR: Not logged into npm. Please run 'npm login' first." && exit 1)

# Ensure package.json exists and is readable
if [ ! -f package.json ]; then
    echo "ERROR: package.json not found in current directory." 
    exit 1
fi

# Get current package name from package.json
CURRENT_NAME=$(npm pkg get name | tr -d '"') # Remove quotes from output

# Ensure the starting name is the primary (Traditional Anishinaabe'mowin) name
if [ "$CURRENT_NAME" != "$PRIMARY_NAME" ]; then
    echo "ERROR: package.json name is currently '$CURRENT_NAME'. Expected '$PRIMARY_NAME' (ᑮᔐᓐᑕᒻ ᐋᐸᒋᒋᑲᓇᓐ). Please reset it before publishing."
    exit 1
fi

echo "Current package name verified: $CURRENT_NAME (ᑮᔐᓐᑕᒻ ᐋᐸᒋᒋᑲᓇᓐ)"

# --- Prompt for OTP ---
# Prompt for OTP without echoing to terminal
read -sp "Enter NPM OTP: " NPM_OTP
echo # Add a newline for cleaner output

# --- Publish Primary Name ---
echo "Publishing primary name ($PRIMARY_NAME - ᑮᔐᓐᑕᒻ ᐋᐸᒋᒋᑲᓇᓐ)..."
npm publish --access public --otp="$NPM_OTP"
echo "Successfully published $PRIMARY_NAME"

# --- Publish English Translation Name ---
echo "Temporarily setting package name to English translation ($ENGLISH_NAME)..."
npm pkg set name="$ENGLISH_NAME"
echo "Publishing English translation name ($ENGLISH_NAME)..."
npm publish --access public --otp="$NPM_OTP"
echo "Successfully published $ENGLISH_NAME"

# --- Revert to Primary Name --- 
echo "Reverting package name back to primary ($PRIMARY_NAME - ᑮᔐᓐᑕᒻ ᐋᐸᒋᒋᑲᓇᓐ)..."
npm pkg set name="$PRIMARY_NAME"

# Final verification (optional)
FINAL_NAME=$(npm pkg get name | tr -d '"')
if [ "$FINAL_NAME" != "$PRIMARY_NAME" ]; then
    echo "ERROR: Failed to revert package.json name back to $PRIMARY_NAME (ᑮᔐᓐᑕᒻ ᐋᐸᒋᒋᑲᓇᓐ). Current name: $FINAL_NAME. Please fix manually."
    exit 1 # Exit with error if revert failed
fi

echo "Package name successfully reverted to $PRIMARY_NAME (ᑮᔐᓐᑕᒻ ᐋᐸᒋᒋᑲᓇᓐ)."
echo "Dual publishing complete." 