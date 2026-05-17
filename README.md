# RootGuard

RootGuard is a tiny command wrapper for people and agents who keep too many terminals open. It refuses to run a command unless the current directory still belongs to the repo you meant.

It is not a sandbox. It is a tripwire with good manners.

## Install

    npm install --save-dev rootguard

For local development in this repo:

    npm install
    npm run build

## Quick Start

Create a manifest:

    npx rootguard init --allow "npm test" --allow "npm run build"

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

Checks are deterministic and local:

- package.json name must match when configured.
- git remote get-url origin must match when configured.
- nested directories are allowed only inside the same git root.
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
    bash scripts/validate.sh

## Safety Notes

Keep allowlists boring. Prefer ["npm", "run", "build"] over ["npm"], and do not add release or publish commands unless the repository already has a reviewed release process.

More examples live in [examples](examples), and orchestration notes live in [docs/ORCHESTRATION.md](docs/ORCHESTRATION.md).

## License

MIT
