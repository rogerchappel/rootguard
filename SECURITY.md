# Security Policy

RootGuard is a local command guard, not an operating-system sandbox. Treat it as a defense against wrong-directory mistakes and overly broad automation, not as a boundary against malicious code.

## Supported Versions

| Version | Supported |
| --- | --- |
| main | Yes |

Versioned releases will be supported once the package is published.

## Reporting a Vulnerability

Please do not report suspected vulnerabilities in public issues, pull requests, or discussions.

Ask maintainers for the private security reporting path before sharing details. If no private reporting path exists yet, ask through public project channels for a private reporting path, but do not include exploit details, secrets, personal data, or sensitive technical details in public messages.

## What to Include

When a private reporting path is available, include:

- affected commit, tag, or package version
- operating system and Node.js version
- the manifest involved, with secrets removed
- a minimal reproduction
- expected and actual behavior
- potential impact

## Scope

In scope:

- command execution when identity checks fail
- allowlist bypasses
- JSON output that hides or misreports denial reasons
- path traversal that finds the wrong manifest
- insecure defaults shipped by this project

Out of scope:

- commands that are explicitly allowed by the manifest
- protection from malicious dependencies or scripts
- containment, permissions, containers, or kernel sandboxing
- general support requests

## Disclosure

Coordinate disclosure with maintainers before publishing vulnerability details.
