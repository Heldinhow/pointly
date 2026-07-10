# STATE · self-improve

> Cursor read+write. Atualizado em todo run. A verdade sobre progresso está nas issues do GitHub; este arquivo só guarda o cursor.

```yaml
loop: self-improve
last_run_ts: 2026-07-10T00:30:00Z
iter_count: 2
current_issue: 54            # issue #54 (PR #55) merged; novo bug sem issue # filed (permissão negada — fix direto)
last_verdict: pr-open        # not-yet-run | pass | fail | blocked | blocked-g1 | enqueued | pr-open
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

Não escrever em lugar nenhum fora desta pasta pelo loop.

## Run log

- **2026-07-09T22:50:00Z** — pre-flight halted (Gate G1). Fila vazia + verifier.sh ausente + bun não instalado. Aguardando humano.
- **2026-07-09T23:10:00Z** — setup concluído (bun 1.3.14, deps, biome trust). Verifier colado. Issue #54 enfileirada. Gate vermelho (test:web).
- **2026-07-09T23:45:00Z** — iteração #54 fechada em PR #55 (6 commits atômicos). Gate **VERDE** — typecheck ✓, test:shared ✓, test:server ✓, test:web ✓ (329/329), lint skipped-env. Issue #54 ainda aberta (label `bug`); PR aguardando review humana.
- **2026-07-10T00:05:00Z** — PR #55 mergeado em main (#55 squash). Fila vazia de issues com labels esperadas. Auto mode classifier bloqueou `gh issue create` para novo bug; fix prosseguido direto em branch.
- **2026-07-10T00:30:00Z** — iteração #2 fechou bug "assentos pulam a cada room_state" (reg 2026-07-10) em PR #56 (1 commit atômico). Gate **VERDE** — typecheck ✓, test:shared ✓, test:server ✓, test:web ✓ (343/343, +14 testes novos em `seat-layout.test.ts`), lint skipped-env. Issue no GitHub não foi criada (permissão negada); PR aguarda review humana.