---
name: pointly-dod
description: Piso executável de Done do Pointly. Use em qualquer mudança de código produto (apps/web, apps/server, packages/shared).
---

# Pointly DoD

Vale para qualquer mudança de código produto. Sem prova, não está "done".

## Proibido

- Proibido alegar "done" se `verify` foi pulado ou falhou.
- Proibido alegar Playwright se a suite não existe nesta tree (ver PR B).

## Comandos por tipo de mudança

- Sempre: `bun run verify` (= `typecheck` → `test` → `build:web`, fail fast). Guarde os exit codes.
- `packages/shared`: `bun --filter @planning-poker/shared test && bun --filter @planning-poker/shared typecheck`.
- `apps/server`: `bun --filter server test && bun --filter server typecheck`; opcional `/health` se o server estiver rodando.
- `apps/web` não-visual: coberto pelo `verify` (`web test + typecheck + build:web`).
- `apps/web` visual: `verify` MAIS (a) futuro `verify:ui`/Playwright quando restaurado OU (b) checklist OpenChamber/browser contra `DESIGN.md` nos viewports 375/390/768/1024/1440, screenshots fora do git (path untracked, ex.: `/tmp/...`).
- Docker/compose: `docker compose build` quando Docker disponível; senão, registre indisponível e deixe para o CI.

## Prova obrigatória

Escreva `.agents/results/<short-id>.json` com o schema:

```json
{
  "gitSha": "<sha do HEAD>",
  "commands": [{ "cmd": "bun run verify", "exitCode": 0 }],
  "notes": "curto: o que rodou, falhas pré-existentes, screenshots untracked"
}
```

Não commite screenshots/binários grandes. Falha pré-existente: documente no `notes` (e no corpo do PR), mas os scripts precisam invocar os comandos certos.
