import json
import os
import subprocess
import sys

def load_mcp_config(config_path):
    """Loads the MCP configuration JSON."""
    try:
        with open(config_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: MCP config file not found at {config_path}", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from {config_path}", file=sys.stderr)
        sys.exit(1)

def get_aider_env_vars(config, server_key="giizhendam-aabajichiganan-mcp"):
    """Extracts environment variables for the specified server key."""
    servers = config.get("mcpServers", {})
    server_config = servers.get(server_key, {})
    return server_config.get("env", {})

def run_aider_with_uv(aider_args, env_vars):
    """Sets environment variables and runs aider using uv."""
    # Set environment variables for the subprocess
    current_env = os.environ.copy()
    current_env.update(env_vars)

    # Construct the command
    # We assume 'aider' is installed such that 'python -m aider.main' works.
    # uv run handles creating an environment if necessary.
    # Pass received arguments directly to aider.main
    command = ["uv", "run", "--", "python", "-m", "aider.main"] + aider_args

    print(f"Executing command: {' '.join(command)}", file=sys.stderr)
    print(f"With extra environment: {env_vars}", file=sys.stderr)

    try:
        # Pass the modified environment to the subprocess
        # Capture stdout and stderr
        result = subprocess.run(
            command,
            env=current_env,
            check=True,
            capture_output=True,
            text=True,
        )
        print("Aider Output:\n", result.stdout)
        if result.stderr:
            print("Aider Stderr:\n", result.stderr, file=sys.stderr)
    except subprocess.CalledProcessError as e:
        print(f"Error running aider: {e}", file=sys.stderr)
        print(f"Aider Stdout:\n{e.stdout}", file=sys.stderr)
        print(f"Aider Stderr:\n{e.stderr}", file=sys.stderr)
        sys.exit(e.returncode)
    except FileNotFoundError:
        print("Error: 'uv' command not found. Make sure uv is installed and in your PATH.", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    # Path to your mcp.json (adjust if necessary)
    mcp_config_path = os.path.expanduser("~/.cursor/mcp.json")

    # Load MCP config and get aider env vars
    config = load_mcp_config(mcp_config_path)
    aider_env = get_aider_env_vars(config)

    if not aider_env:
        print("Warning: No environment variables found for aider in mcp.json", file=sys.stderr)

    # Pass all script arguments directly to aider
    aider_arguments = sys.argv[1:]

    # Run aider
    run_aider_with_uv(aider_arguments, aider_env) 