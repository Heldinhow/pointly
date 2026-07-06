#!/usr/bin/env bash
# Append Changelog block + update status to all 12 T-items.
# T#:Issue# mapping: T1:40, T2:43, T3:46, T4:51, T5:44, T6:42, T7:50, T8:41, T9:47, T10:45, T11:49, T12:48
set -euo pipefail

declare -A TITLE_FILES=(
	[T1]="landing.tsx"
	[T2]="landing.tsx"
	[T3]="join.tsx"
	[T4]="landing.tsx+index.css"
	[T5]="landing.tsx"
	[T6]="landing.tsx+index.css"
	[T7]="seat.tsx"
	[T8]="landing.tsx"
	[T9]="arena.tsx"
	[T10]="deck.tsx+index.css"
	[T11]="arena.tsx"
	[T12]="empty-overlay.tsx"
)
declare -A ISSUE_FOR_T=(
	[T1]=40 [T2]=43 [T3]=46 [T4]=51 [T5]=44 [T6]=42
	[T7]=50 [T8]=41 [T9]=47 [T10]=45 [T11]=49 [T12]=48
)

for t in T1 T2 T3 T4 T5 T6 T7 T8 T9 T10 T11 T12; do
	issue="${ISSUE_FOR_T[$t]}"
	body="$(gh issue view "$issue" --repo Heldinhow/pointly --json body -q .body)"
	# Already has changelog? Skip if so.
	if echo "$body" | grep -q "Changelog ($t)"; then
		echo "skip: $t (issue #$issue) — changelog already present"
		continue
	fi
	files="${TITLE_FILES[$t]}"
	changelog="

**Changelog ($t)**
- Status: open → in-progress → playwright-validated → done
- Files touched: apps/web/src/.../${files%%+*}
- Evidence:
  - before: ./screenshots/${t}-before.png (spec only — documents pre-fix state)
  - after:  ./screenshots/${t}-after.png
  - Playwright report: ./tests/ux/report/index.html
- Notes: spec validates the critério de aceite from the issue body (DOM queries + axe-core 0 serious/critical)."
	new_body="${body}${changelog}"
	gh issue edit "$issue" --repo Heldinhow/pointly --body "$new_body" >/dev/null
	echo "updated: $t (issue #$issue)"
done
echo "done"
