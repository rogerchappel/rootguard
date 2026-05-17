# RootGuard PRD

Status: in-progress

## Summary

RootGuard is a command wrapper that refuses to run project commands from the wrong directory. It protects local and agentic workflows from "oops, wrong repo" mistakes with a tiny manifest and deterministic checks.

## Problem

Agents and humans frequently run commands in nested worktrees, parent monorepos, or stale terminals. A command intended for one repo can mutate another, install dependencies in the wrong place, or publish from the wrong checkout.

## Users

- Developers juggling many OSS repos and worktrees.
- Agent runners that need a local safety boundary.
- Maintainers who want commands to assert repo identity before execution.

## V1

- Initialize a .rootguard.json manifest with expected git remote, package name, and allowed command prefixes.
- Check current working directory identity before running a command.
- Provide "rootguard run -- <cmd>" and "rootguard check" commands.
- Emit clear denial reasons and machine-readable JSON.
- Include fixtures for wrong repo, nested directory, missing remote, and allowed commands.

## Non-goals

- OS sandboxing.
- Replacing permissions, containers, or policy engines.
- Network calls.

## Safety

Read-only checks by default. "run" executes only after all manifest checks pass, and command allowlists are explicit.

## Attribution

Inspired by worktree-heavy agent development where directory identity matters, reframed as a small local guardrail instead of a broad security product.
