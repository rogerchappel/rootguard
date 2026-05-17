#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "\${BASH_SOURCE[0]}")/.." && pwd)"
fixture_source="$repo_root/test/fixtures/allowed-command"
fixture_repo="$(mktemp -d "\${TMPDIR:-/tmp}/rootguard-smoke.XXXXXX")"

cleanup() {
  rm -rf "$fixture_repo"
}
trap cleanup EXIT

cp -R "$fixture_source/." "$fixture_repo/"
git -C "$fixture_repo" init -b main >/dev/null
git -C "$fixture_repo" remote add origin "https://github.com/example/allowed-command-fixture.git"

node "$repo_root/bin/rootguard.js" check --cwd "$fixture_repo" --json >/tmp/rootguard-check.json
node "$repo_root/bin/rootguard.js" run --cwd "$fixture_repo" -- node -e "console.log('rootguard smoke ok')"

if node "$repo_root/bin/rootguard.js" run --cwd "$fixture_repo" -- npm publish >/tmp/rootguard-denied.out 2>/tmp/rootguard-denied.err; then
  echo "Expected disallowed command to fail" >&2
  exit 1
fi

grep -q "command_not_allowed" /tmp/rootguard-denied.err
echo "rootguard smoke passed"
