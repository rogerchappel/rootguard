# RootGuard Examples

Copy one of these manifests to .rootguard.json and edit the identity values before using it.

- basic.rootguard.json: conservative defaults for a normal package.
- agent.rootguard.json: a narrow allowlist for automated coding workers.

Do not add broad prefixes like npm, git, or bash unless you really mean to allow every subcommand beneath them.
