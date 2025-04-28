# Product Context: Giizhendam Aabajichiganan (Decision Tools)

**Problem Solved:** Provides developers using the Model Context Protocol (MCP) framework with integrated, AI-powered tools for complex tasks directly within their IDE, reducing context switching and streamlining workflows for code generation, financial simulation, and strategic discussion modeling.

**User Personas:**
*   AI/ML Engineers and Developers using MCP-enabled IDEs (like Cursor).
*   Users needing to script or automate interactions with `aider` or generative AI simulations.

**User Experience Goals:**
*   Seamless integration into the MCP tool ecosystem.
*   Clear and predictable tool behavior based on provided parameters and configured environment.
*   Reliable execution of underlying tools (`aider`, Gemini API).
*   Actionable output and clear error reporting.

**Functional Overview:**
*   `prompt_aider`: Executes a single `aider` command with a given prompt and optional files.
*   `double_compute`: Executes the same `aider` command twice.
*   `finance_experts`: Simulates a financial discussion between predefined expert personas using Gemini API.
*   `ceo_and_board`: Simulates a board meeting discussion on a given topic using Gemini API. 