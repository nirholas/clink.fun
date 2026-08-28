#!/usr/bin/env bash
# Commit whatever is in the tree and push it.
#
# Progress insurance: this repo is being built in a session that can end
# abruptly, so work is committed and pushed continuously rather than batched
# into tidy commits at the end. A messy history that exists beats a clean one
# that was lost.
#
#   PAT=github_pat_... ./scripts/push.sh "subject line"

set -euo pipefail
cd "$(dirname "$0")/.."

MSG="${1:-chore: checkpoint work in progress}"
PAT="${PAT:?set PAT to a token with contents:write on this repo}"

git add -A
if git diff --cached --quiet; then
	echo "nothing to commit"
else
	git -c commit.gpgsign=false -c user.name=nirholas -c user.email=claudescammer@outlook.com \
		commit -q -m "$MSG"
	echo "committed: $MSG"
fi

# The Codespaces credential helper answers first with the wrong token, so the
# helper list is reset for this one command.
git -c credential.helper= \
	-c credential.helper="!f() { echo username=x-access-token; echo password=$PAT; }; f" \
	push origin main 2>&1 | sed "s/$PAT/[redacted]/g"
