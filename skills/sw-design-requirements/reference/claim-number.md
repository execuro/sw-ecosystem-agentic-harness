# Claiming a new PRD number

Other sessions may be writing PRDs at the same time, in this tree, another worktree or another branch. Never take the number from `ls specs` alone, and never write the PRD under a number this script did not print.

Pick the slug first (kebab-case, 2–5 words), then run this as one Bash call, replacing `SLUG`:

```
bash -c 'mkdir -p specs
got=; for i in $(seq 30); do mkdir specs/.nnnn.lock 2>/dev/null && { got=1; break; }; sleep 1; done
[ -n "$got" ] || { echo "LOCKED: remove specs/.nnnn.lock if no other session is creating a PRD"; exit 1; }
trap "rmdir specs/.nnnn.lock" EXIT
n=$({ ls specs
  git worktree list --porcelain 2>/dev/null | sed -n "s/^worktree //p" | while IFS= read -r w; do ls "$w/specs" 2>/dev/null; done
  git for-each-ref --format="%(refname)" refs/heads refs/remotes 2>/dev/null | while IFS= read -r r; do git ls-tree --name-only "$r" specs/ 2>/dev/null; done
} | sed "s#.*/##" | grep -oE "^[0-9]{4}" | sort -n | tail -1)
f="specs/$(printf %04d $((10#${n:-0} + 1)))-SLUG.md"; : > "$f"; echo "$f"'
```

It takes the highest `NNNN` across `specs/`, every git worktree and every local and remote branch, adds 1 and creates the empty file under a lock, so two sessions never get the same number. The printed path is the target. Remote branches count as of the last fetch; the script never fetches.

`LOCKED` → ask the user. Never delete the lock yourself.
