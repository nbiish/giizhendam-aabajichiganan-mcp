# Security Policy for MCP Servers

## Overview
This project sets the security standard for all Model Context Protocol (MCP) servers. All MCP servers must adhere to these practices to minimize risk and ensure robust, production-grade security.

## Key Security Practices

### 1. Input Validation & Sanitization
- All user input (including prompts, topics, roles, file paths, URLs, and environment variables) **must** be strictly validated and sanitized.
- File operations are restricted to the project directory and allowlisted extensions (`.md`, `.ts`, `.json`, `.txt`).
- URLs must use HTTPS and must not resolve to localhost or private IPs (prevents SSRF and cleartext transmission).
- Input length limits are enforced to prevent DoS attacks.

### 2. Output Encoding
- Any output that could be rendered as HTML (now or in the future) **must** be properly encoded to prevent XSS.

### 3. Error Handling
- Sensitive error details (stack traces, internal paths) are **never** returned to clients. Only safe summaries are exposed.
- Full error details are logged server-side for debugging.

### 4. Dependency Hygiene
- All dependencies must be kept up-to-date and regularly scanned with `npm audit` and/or `snyk test`.
- Use pinned versions where possible.

### 5. Secure Defaults
- All external calls (e.g., to aider, Gemini) use secure defaults (HTTPS, minimal privileges).
- No secrets or API keys are ever hardcoded; use environment variables.

### 6. Prompt Injection & LLM Safety
- User input is never directly injected into LLM prompts without context or validation.
- Prompts are constructed defensively to minimize prompt injection risk.

### 7. Documentation & Review
- All security decisions are documented in code comments.
- This `SECURITY.md` must be reviewed and updated regularly.
- Encourage regular code reviews and external security audits.

## Reporting Vulnerabilities
If you discover a security vulnerability, please report it privately to the maintainers. Do **not** file a public issue until a fix is in place.

## Commitment
By following these practices, we set a high bar for security and reliability across all MCP servers. All contributors and maintainers are expected to uphold these standards. 