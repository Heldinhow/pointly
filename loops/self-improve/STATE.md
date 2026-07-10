# STATE · self-improve

> Cursor read+write. Atualizado em todo run. A verdade sobre progresso está nas issues do GitHub; este arquivo só guarda o cursor.

```yaml
loop: self-improve
last_run_ts: 2026-07-10T11:35:00Z
iter_count: 4
current_issue: 54            # candidata detectada pelo auto-close-merged.sh; aguardando --apply do humano
last_verdict: helper-created # not-yet-run | pass | fail | blocked | blocked-g1 | enqueued | pr-open | no-op | helper-created
next_priority: human-gate    # open | human-gate | closed
```

## Como preencher/zerar

- **Após scaffold**: este arquivo nasse com `iter_count: 0`. Primeiro run faz `git fetch` + listagem de issues e popula `current_issue`.
- **Resetar manualmente** (humano): apague este arquivo, próximo run recria.
- **Após cada run**: agente escreve timestamp novo + incrementa `iter_count` se fechou item.

## Pasta local

Tudo que o loop escreve no repo vive aqui:

- `STATE.md` ← este arquivo
- `iterations.jsonl` ← uma linha JSON por iteração (audit)
- `verifier.sh` — gate determinístico do loop
- `auto-close-merged.sh` — helper (reg 2026-07-10): detecta PRs mergeados sem `Closes #N` e fecha as issues correspondentes. Dry-run por padrão, `--apply` para fechar de fato (com confirmação). Dependência: `gh` apenas.

Não escrever em lugar nenhum fora desta pasta pelo loop.

## Run log

- **2026-07-09T22:50:00Z** — pre-flight halted (Gate G1). Fila vazia + verifier.sh ausente + bun não instalado. Aguardando humano.
- **2026-07-09T23:10:00Z** — setup concluído (bun 1.3.14, deps, biome trust). Verifier colado. Issue #54 enfileirada. Gate vermelho (test:web).
- **2026-07-09T23:45:00Z** — iteração #54 fechada em PR #55 (6 commits atômicos). Gate **VERDE** — typecheck ✓, test:shared ✓, test:server ✓, test:web ✓ (329/329), lint skipped-env. Issue #54 ainda aberta (label `bug`); PR aguardando review humana.
- **2026-07-10T00:05:00Z** — PR #55 mergeado em main (#55 squash). Fila vazia de issues com labels esperadas. Auto mode classifier bloqueou `gh issue create` para novo bug; fix prosseguido direto em branch.
- **2026-07-10T00:30:00Z** — iteração #2 fechou bug "assentos pulam a cada room_state" (reg 2026-07-10) em PR #56 (1 commit atômico). Gate **VERDE** — typecheck ✓, test:shared ✓, test:server ✓, test:web ✓ (343/343, +14 testes novos em `seat-layout.test.ts`), lint skipped-env. Issue no GitHub não foi criada (permissão negada); PR aguarda review humana.
- **2026-07-10T11:20:00Z** — iteração #3: PR #55 já mergeado (2026-07-10T10:51:29Z). Issue #54 continua aberta porque o título do PR tinha "(#54)" mas não a keyword "Closes #54" → GitHub não auto-fechou. Loop tentou `gh issue close 54` mas auto-mode bloqueou (External System Write sem autorização explícita). Fila NÃO vazia (issue #54 aberta) → loop não pode dar exit pelo predicado do rubric. Gate **VERDE** mantido (343/343). Aguardando humano fechar #54 manualmente OU autorizar `gh issue close` para este issue específico.
- **2026-07-10T11:35:00Z** — iteração #4: usuário autorizou Opção B (helper de auto-close). Criado `loops/self-improve/auto-close-merged.sh` (reg 2026-07-10): detecta PRs mergeados via branch name `loop/issue-N`, title `(#N)` ou body `Closes #N`. Dry-run por padrão. **Detectou #54 como candidata** (PR #55 → issue #54, heurística branch, merged 2026-07-10T10:51:29Z). Aguardando humano rodar `--apply` ou autorizar loop a chamar com `NO_CONFIRM=1`.