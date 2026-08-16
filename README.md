# RootGuard

RootGuard is a tiny command wrapper for people and agents who keep too many terminals open. It refuses to run a command unless the current directory still belongs to the repo you meant.

It is not a sandbox. It is a tripwire with good manners.

## Install

No npm version has been published yet. Until the first tagged release, install
the current `main` branch directly from GitHub:

    npm install --save-dev github:rogerchappel/rootguard

After a version appears on the [releases page](https://github.com/rogerchappel/rootguard/releases),
install that published version from npm:

    npm install --save-dev rootguard

For local development in this repo:

    npm install
    npm run build

## Quick Start

Create a manifest:

    npx rootguard init --allow "npm test" --allow "npm run build"

`rootguard init` refuses to replace an existing `.rootguard.json`. Review or
remove the existing file explicitly before initializing the project again.

Check the current directory:

    npx rootguard check

Run a command only after identity and allowlist checks pass:

    npx rootguard run -- npm test

## Manifest

RootGuard reads .rootguard.json from the current directory upward.

    {
      "version": 1,
      "identity": {
        "packageName": "my-package",
        "gitRemote": "https://github.com/example/my-package.git"
      },
      "allow": [
        {
          "prefix": ["npm", "test"],
          "description": "Run tests in the intended repo."
        }
      ]
    }

`rootguard init` adds a `$schema` reference to the canonical schema at
`https://raw.githubusercontent.com/rogerchappel/rootguard/main/docs/rootguard.schema.json`.
Editors and validators can fetch that URL without relying on a checkout-local
`docs/` directory. The schema uses the same URL as its `$id`.

Checks are deterministic and local:

- package.json name must match when configured.
- git remote get-url origin must match when configured; equivalent HTTPS,
  `git@host:owner/repo`, and `ssh://git@host/owner/repo` spellings compare equally.
- nested directories and symlinked path aliases are allowed only inside the same
  git root, as determined by filesystem identity.
- commands must start with an explicit allow prefix.

## Agent-Friendly JSON

    npx rootguard check --json
    npx rootguard run --json -- npm test

Denials include stable codes such as git_remote_mismatch, package_name_mismatch, and command_not_allowed.

## Verify

    npm test
    npm run check
    npm run build
    npm run smoke
    npm run package:smoke
    npm run release:check
    bash scripts/validate.sh

`npm run release:check` runs the TypeScript check, compiled tests, smoke
fixture, and npm pack dry-run used to verify release readiness.
`npm run release:pack -- <directory>` creates the exact tarball used by the tag
workflow and rejects an artifact whose name or version differs from
`package.json`.

## Package Contents

The npm package includes the executable shim, compiled sources, docs, examples,
README, license, changelog, contributing guide, and security policy.
`npm run package:smoke` builds the project, checks the dry-run package contents,
installs the resulting tarball into a temporary consumer project, and verifies
that `rootguard init` emits the canonical hosted schema reference while
preserving that manifest if initialization is attempted again.

## Safety Notes

Keep allowlists boring. Prefer ["npm", "run", "build"] over ["npm"], and do not add release or publish commands unless the repository already has a reviewed release process.

More examples live in [examples](examples), and orchestration notes live in [docs/ORCHESTRATION.md](docs/ORCHESTRATION.md).

## License

MIT
