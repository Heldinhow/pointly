# LESSONS - auto-maintained by scripts/lessons.py

> Machine-owned. Do NOT hand-edit. Changes are overwritten on the next `lessons.py` write.
> Canonical state lives in `.specs/lessons.json`. Edit lessons only via the script.
> promote_threshold=2 distinct features · window_days=45 · quarantine_threshold=2

## Confirmed (load these at Specify/Design)

Corroborated across multiple features. Safe to apply as guidance.

_none_

## Candidates (under observation - do NOT load as guidance yet)

Seen once or not yet corroborated. Tracked, not trusted.

### L-001 - Mock de canvas que retorna dataURL fixa sem capturar args esconde regressao de dims/qualidade: capture canvas.width/height, args do toDataURL e do drawImage e asserte os valores da spec.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `apps/web/src/lib` · harmful: 0
- features: avatar-perfil-mesa
- evidence: apps/web/src/lib/avatar.test.ts:26 (apps/web/src/lib)
- last seen: 2026-09-15T20:05:05Z

## Quarantined (failed when applied - ignore)

A confirmed lesson that recurred alongside failure. Kept for the maintainer to review.

_none_
