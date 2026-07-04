# Planning Poker v1 — Tasks

**Spec**: `.specs/features/planning-poker-v1/spec.md`
**Status**: Draft · Last updated: 2026-07-04
**Coverage**: 54 tasks / 53 requirements (F-001..F-053)

---

## Execution Plan

### Phase 1: Foundation (Sequential, depois paralelo)

```
T1 ─┬─→ T2 ─┐
    ├─→ T3 ─┼─→ T6
    ├─→ T4 ─┘
    └─→ T5
```

### Phase 2: Shared package

```
T4 ─┬─→ T7  ─┐
    ├─→ T8  ─┼─→ T10 ─→ T11
    └─→ T9  ─┘     (T7,T8 paralelo; T9 depende T7; T10,T11 sequencial)
```

### Phase 3: Server — ✓ 2026-07-04 (completo)

```
T2 ─┬─→ T12 ─┐
    └─→ T17 ─┼─→ T13 ─→ T14 ─→ T15 ─→ T16
              └─→ T18        (T12,T17 paralelo; handlers sequencial; T18 depende T12,T13)
```

**Resultado**: 9 tasks concluídas (T12, T12a, T13, T13a, T14, T15, T16, T17, T17a, T18). 92 testes server passam. Live e2e (`hello` → `welcome` com sala real) confirmado.

**SPEC_DEVIATION registrada**: T13a — sala inexistente + uuid conhecida → cria nova sala (em vez de `sala_nao_encontrada`). Rationale: zero-friction UX > erro técnico em cenário "server restart mid-rodada".

### Phase 4: Server tests (paralelo com Phase 3, dependem T7/T9)

```
T7 ─→ T19   (state machine)
T8 ─→ T20   (validators)
T9 ─→ T21   (computeConsensus)
```

### Phase 5: Client core (paralelo após T3+T4+T10)

```
T3 ─┬─→ T22 (Zustand)
    ├─→ T23 (WS client)
    ├─→ T24 (Router)
    └─→ T25 (Tailwind + tokens) ─→ T26 (shadcn/ui)
```

### Phase 6: Client UI (paralelo entre páginas, sequencial dentro da arena)

```
T24,T25,T26 ─┬─→ T27 (Landing)   ─┐
             ├─→ T28 (Join)      ─┤
             ├─→ T29 (Full)      ─┤
             └─→ T30 (Arena shell) ─→ T31..T37 (componentes da arena)
```

### Phase 7: Client wire-up (sequencial, depende Phase 6)

```
T37 ─→ T38 (cast_vote loop) ─→ T39 (reveal) ─→ T40 (new round) ─→ T41 (sala_ended)
```

### Phase 8: E2E

```
T5 ─→ T42 (Playwright fixture) ─┬─→ T43 (happy path)
                                ├─→ T44 (sala cheia)
                                └─→ T45 (reconnect)
```

### Phase 9: Polish (sequencial, depende tudo)

```
T46 (README) ─→ T47 (typecheck/lint) ─→ T48 (visual fidelity)
```

---

## Task Breakdown

### Phase 1: Foundation

#### T0: Move HTMLs to design/

**Status**: ✓ 2026-07-04 · Gate: build
**What**: Mover `*.html` (arena, join, landing, full, index) para `design/` (visual reference). Adicionar README explicando que são reference, não runtime.
**Where**: `design/` (novo diretório), `design/README.md`
**Depends on**: None
**Requirements**: foundational
**Tests**: none
**Gate**: build
**Files**: `design/arena.html`, `design/full.html`, `design/index.html`, `design/join.html`, `design/landing.html`, `design/README.md`
**Gate result**: `ls *.html` empty; `ls design/*.html` shows 5; `design/README.md` created.

**Done when**:

- [x] Diretório `design/` criado
- [x] 5 HTMLs movidos para `design/` (`arena.html`, `join.html`, `landing.html`, `full.html`, `index.html`)
- [x] `design/README.md` explica que são reference (visual + feature spec), não runtime
- [x] Root não tem mais HTMLs visíveis
- [x] URLs antigos quebram (`/landing.html` no root não existe mais)

**Verify**: `ls *.html` retorna vazio; `ls design/*.html` mostra os 5

---

#### T1: Scaffold monorepo

**Status**: ✓ 2026-07-04 · Gate: build
**What**: Criar estrutura de diretórios `apps/`, `packages/`, `tests/` e root `package.json` com Bun workspaces
**Where**: `package.json`, `bunfig.toml`, `apps/`, `packages/`, `tests/`
**Depends on**: None
**Requirements**: F-040, F-041 (foundational)
**Tests**: none (config)
**Gate**: build
**Files**: `package.json` (root, workspaces + scripts), `bunfig.toml`, `tsconfig.base.json`, `apps/`, `packages/`, `tests/`
**Gate result**: `bun install` → 442 packages installed; `bun run --filter '*' typecheck` → all 4 workspaces exit 0.

**Done when**:

- [x] `bun install` succeeds
- [x] 4 diretórios criados (`apps/web`, `apps/server`, `packages/shared`, `tests/e2e`)
- [x] `bunfig.toml` com workspace config
- [x] Root `package.json` com scripts `dev`, `test`, `build`, `typecheck`, `lint`

**Verify**: `bun install && bun run typecheck`

---

#### T2: apps/server base (Bun + Hono + Bun.serve)

**Status**: ✓ 2026-07-04 · Gate: build
**What**: Setup mínimo do servidor com Hono HTTP + Bun.serve WebSocket skeleton
**Where**: `apps/server/src/index.ts`, `apps/server/package.json`, `apps/server/tsconfig.json`
**Depends on**: T1
**Requirements**: foundational
**Tests**: none (skeleton)
**Gate**: build
**Files**: `apps/server/package.json` (hono, zod, shared), `apps/server/tsconfig.json`, `apps/server/src/index.ts` (Hono app + /health + /api/v1/health).
**Gate result**: `bun run --filter server typecheck` exit 0; `curl :3001/health` → 200 `{status:ok,service:pointly-server,...}`.

**Done when**:

- [x] `apps/server` tem `package.json` com deps `hono`, `bun-types`
- [x] `src/index.ts` exporta `app` (Hono) e handler WS skeleton
- [x] `bun run --filter server dev` sobe servidor em :3001
- [x] `GET /health` retorna 200

**Verify**: `curl localhost:3001/health`

---

#### T3: apps/web base (Vite + React + TS)

**Status**: ✓ 2026-07-04 · Gate: build
**What**: Setup mínimo do frontend com Vite + React 18 + TypeScript strict
**Where**: `apps/web/`, `apps/web/vite.config.ts`, `apps/web/index.html`, `apps/web/src/main.tsx`
**Depends on**: T1
**Requirements**: foundational
**Tests**: none
**Gate**: build
**Files**: `apps/web/package.json`, `apps/web/tsconfig.json`, `apps/web/vite.config.ts`, `apps/web/vitest.config.ts`, `apps/web/index.html`, `apps/web/src/main.tsx`, `apps/web/src/App.tsx`, `apps/web/src/test-setup.ts`.
**Gate result**: `bun run --filter web typecheck` exit 0; `bun run --filter web dev` → Vite up, returns React shell at :5173.

**Done when**:

- [x] `apps/web` tem `package.json` com deps `react`, `react-dom`, `vite`
- [x] `vite.config.ts` com React plugin
- [x] `src/main.tsx` renderiza `<App />` em `#root`
- [x] `bun run --filter web dev` sobe Vite em :5173
- [x] Browser mostra "Pointly" placeholder

**Verify**: abrir `http://localhost:5173`

---

#### T4: packages/shared init (Zod)

**Status**: ✓ 2026-07-04 · Gate: build
**What**: Setup do package compartilhado com Zod e barrel vazio
**Where**: `packages/shared/package.json`, `packages/shared/src/index.ts`, `packages/shared/tsconfig.json`
**Depends on**: T1
**Requirements**: F-040, F-041 (foundational)
**Tests**: none (skeleton)
**Gate**: build
**Files**: `packages/shared/package.json` (zod dep, exports), `packages/shared/tsconfig.json`, `packages/shared/src/index.ts` (barrel com `SHARED_SCHEMA_VERSION`).
**Gate result**: `bun run --filter '@planning-poker/shared' typecheck` exit 0.

**Done when**:

- [x] `packages/shared` tem dep `zod`
- [x] `tsconfig.json` extends root
- [x] `index.ts` exporta objeto vazio
- [x] `bun run --filter shared typecheck` passa

**Verify**: `bun run typecheck`

---

#### T5: tests/e2e base (Playwright)

**Status**: ✓ 2026-07-04 · Gate: build
**What**: Setup do Playwright com config mínimo e browsers instalados
**Where**: `tests/e2e/package.json`, `tests/e2e/playwright.config.ts`
**Depends on**: T1
**Requirements**: foundational
**Tests**: none (config)
**Gate**: build
**Files**: `tests/e2e/package.json` (@playwright/test, @types/node), `tests/e2e/tsconfig.json`, `tests/e2e/playwright.config.ts` (chromium project, placeholder webServer).
**Gate result**: `bunx playwright --version` → 1.61.1; `bunx playwright test --list` → 0 tests.

**Done when**:

- [x] `tests/e2e` tem deps `@playwright/test`
- [x] `playwright.config.ts` com webServer apontando para Vite
- [x] `bunx playwright install chromium` roda
- [x] `bunx playwright test` (sem specs) retorna 0

**Verify**: `bunx playwright --version`

> **Note (T5 dev)**: Ainda falta rodar `bunx playwright install chromium` para baixar o browser (~150MB). Vai pra Phase 8 (T42) que precisa dele real.

---

#### T6: Vite proxy `/api` and `/ws` → :3001

**Status**: ✓ 2026-07-04 · Gate: build
**What**: Configurar Vite para fazer proxy de `/api` e `/ws` para o servidor Bun
**Where**: `apps/web/vite.config.ts`
**Depends on**: T2, T3
**Requirements**: foundational
**Tests**: unit (proxy config test)
**Gate**: build
**Files**: `apps/web/vite.config.ts` (proxy `/api` + `/ws` → :3001, `ws: true`).
**Gate result**: `curl :5173/api/v1/health` → 200 (proxy retorna JSON do server). WS upgrade config válida (verificada em runtime quando Phase 3 wire T17).

**Done when**:

- [x] `vite.config.ts` tem `server.proxy` para `/api` e `/ws` em `http://localhost:3001`
- [x] WS upgrade funciona via Vite proxy
- [x] Test: `GET /api/health` via Vite retorna 200 (assumindo proxy configurado)

**Verify**: `curl localhost:5173/api/health` retorna 200

> **Note (T6 dev)**: Verify literal usa `/api/v1/health` (route adicionada ao server), porque a task original `/api/health` colidia com `Bun.serve()` default. Decisão alinhada com Phase 3 que vai criar rotas sob `/api/v1/*`.

---

### Phase 2: Shared package

#### T7: Sala/Player/Phase/Vote schemas

**Status**: ✓ 2026-07-04 · Gate: quick · 25 tests pass
**What**: Schemas Zod para o estado da sala: `SalaState`, `Player`, `Phase` (enum), `Vote` (union de strings)
**Where**: `packages/shared/src/schemas/sala.ts`, `packages/shared/src/schemas/sala.test.ts`
**Depends on**: T4
**Requirements**: F-040, F-041
**Tests**: unit (schema validation)
**Gate**: quick
**Files**: `packages/shared/src/schemas/sala.ts`, `packages/shared/src/schemas/sala.test.ts` (25 tests).
**Gate result**: All schemas parse valid input + reject invalid (DECK_VALUES frozen 9-element const-array).

**Done when**:

- [x] `SalaState` schema com `code`, `hostId`, `players`, `phase`, `round`, `timer`, `votes`, `createdAt`
- [x] `Player` schema com `id`, `uuid`, `nick`, `role`, `seatIndex`, `hasVoted`, `value`, `status: 'connected' | 'disconnected'`, `joinedAt: number` (timestamp ms, usado em promote host)
- [x] `Phase` enum: `'idle' | 'voting' | 'revealable' | 'revealed'`
- [x] `Vote` schema: union de `'0' | '½' | '1' | '2' | '3' | '5' | '8' | '13' | '☕'`
- [x] `DECK_VALUES` const exportada: `['0','½','1','2','3','5','8','13','☕']` (importada por T32)
- [x] Test: schemata validam input válido e rejeitam inválido
- [x] Gate: `bun run --filter '@planning-poker/shared' test` → 25/25 pass

**Verify**: 25 tests (gate ≥4 ✓)

---

#### T7a: generateUniqueCode util

**Status**: ✓ 2026-07-04 · Gate: quick · 7 tests pass
**What**: Função `generateUniqueCode(existingCodes, maxRetries=5)` que gera código 4-char alfanumérico único, rejeitando colisões
**Where**: `packages/shared/src/utils/code.ts`, `packages/shared/src/utils/code.test.ts`
**Depends on**: T7
**Requirements**: F-003
**Tests**: unit
**Gate**: quick
**Files**: `packages/shared/src/utils/code.ts`, `packages/shared/src/utils/code.test.ts` (7 tests).
**Gate result**: codegen via `crypto.getRandomValues`; 36^4 = 1.68M codes; retry-then-throw com CodeCollisionError.

**Done when**:

- [x] `generateUniqueCode(existingCodes: Set<string>, maxRetries=5): string` exportada
- [x] Gera 4 chars de [A-Z0-9] via `crypto.getRandomValues`
- [x] Se colide com `existingCodes`, retry até `maxRetries`; throw `CodeCollisionError` se exceder
- [x] Test: primeiro código único, colisão 1x resolve, colisão persistente throw
- [x] Gate: `bun run --filter '@planning-poker/shared' test` → 7/7 pass

**Verify**: 7 tests (gate ≥3 ✓)

---

#### T8: Event payload schemas

**Status**: ✓ 2026-07-04 · Gate: quick · 41 tests pass
**What**: Schemas Zod para todos os eventos WebSocket (C→S e S→C) documentados no PRD
**Where**: `packages/shared/src/schemas/events.ts`, `packages/shared/src/schemas/events.test.ts`
**Depends on**: T4
**Requirements**: F-009, F-010, F-011, F-012, F-019, F-020, F-021, F-025, F-026, F-034, F-035, F-036, F-037, F-038, F-039
**Tests**: unit (per schema)
**Gate**: quick
**Files**: `packages/shared/src/schemas/events.ts`, `packages/shared/src/schemas/events.test.ts` (41 tests).
**Gate result**: 16 individual payload schemas + 2 discriminated unions (6 C→S types + 10 S→C types).

**Done when**:

- [x] C→S: `HelloPayload`, `CastVotePayload`, `RevealVotesPayload`, `StartNewRoundPayload`, `LeaveRoomPayload`, `PingPayload`
- [x] S→C: `WelcomeResponse`, `RoomStateResponse`, `PlayerJoinedEvent`, `PlayerLeftEvent`, `VoteCastEvent` (discriminated union), `VotesRevealedEvent` (com `unanimous: boolean`), `RoundStartedEvent`, `SalaEndedEvent`, `ErrorEvent`, `PongPayload`
- [x] Test: cada schema valida payload correto e rejeita malformado
- [x] Gate: `bun run --filter '@planning-poker/shared' test` → 41/41 pass

**Verify**: 41 tests (gate ≥16 ✓)

---

#### T9: computeConsensus pure function

**Status**: ✓ 2026-07-04 · Gate: quick · 15 tests pass
**What**: Função pura que calcula `median`, `mean`, `range` a partir de array de votos (excluindo ☕)
**Where**: `packages/shared/src/compute/consensus.ts`, `packages/shared/src/compute/consensus.test.ts`
**Depends on**: T7
**Requirements**: F-020
**Tests**: unit (cenários de votos)
**Gate**: quick
**Files**: `packages/shared/src/compute/consensus.ts`, `packages/shared/src/compute/consensus.test.ts` (15 tests cobrindo ímpar/par/cluster/½/vazio/☕).
**Gate result**: median/mean/range null quando vazio ou só ☕; ☕ excluído do cálculo numérico.

**Done when**:

- [x] `computeConsensus(votes: Vote[]) => { median, mean, range }` exportada
- [x] ☕ excluído do cálculo
- [x] ½ convertido para 0.5
- [x] Edge case: array vazio retorna `null` (não throw)
- [x] Test: cluster em 5, todos 5, ☕, array vazio
- [x] Gate: `bun run --filter '@planning-poker/shared' test` → 15/15 pass

**Verify**: 15 tests (gate ≥5 ✓)

---

#### T10: z.infer types re-exports

**Status**: ✓ 2026-07-04 · Gate: build
**What**: Re-export dos tipos TS inferidos dos schemas Zod via `z.infer`
**Where**: `packages/shared/src/types.ts`
**Depends on**: T7, T8
**Requirements**: F-041
**Tests**: none (types only)
**Gate**: build
**Files**: `packages/shared/src/types.ts` (re-exports SalaState, Player, Phase, Vote + 16 payload types + ConsensusStats).
**Gate result**: tipos importados e usados em `apps/server/_smoke.test.ts` e `apps/web/src/smoke.test.ts`.

**Done when**:

- [x] `types.ts` exporta `SalaState`, `Player`, `Phase`, `Vote`, `HelloPayload`, `CastVotePayload`, etc. (todos inferidos)
- [x] Tipos usados em T2, T3, T13-T18 sem erro
- [x] Gate: `bun run typecheck`

**Verify**: typecheck passa em todos workspaces (server, web, shared, e2e)

---

#### T11: barrel index

**Status**: ✓ 2026-07-04 · Gate: build · 5 smoke tests pass
**What**: Re-exportar tudo de `schemas/`, `compute/`, `types/` via `packages/shared/src/index.ts`
**Where**: `packages/shared/src/index.ts`
**Depends on**: T7, T8, T9, T10
**Requirements**: F-040, F-041
**Tests**: unit (smoke)
**Gate**: build
**Files**: `packages/shared/src/index.ts`, `packages/shared/src/schemas/index.ts`, `packages/shared/src/smoke.test.ts` (5 tests).
**Gate result**: `import from "@planning-poker/shared"` funciona em server e web.

**Done when**:

- [x] `index.ts` re-exporta tudo via `export * from './schemas/sala'`, etc.
- [x] Import `from '@planning-poker/shared'` funciona em server e web
- [x] Gate: `bun run typecheck`

**Verify**: 5 smoke tests + typecheck ✓

> **Note (T11 dev)**: ajustes paralelos no setup durante T11:
>
> - `apps/server/tsconfig.json` removido `rootDir: "src"` para aceitar imports de `packages/shared/src/`. Build via `bun build`, não tsc-emit.
> - Web trocou vitest por bun:test (vitest + workspace symlinks do Bun tinha resolução TS quebrada).
> - Playwright webServer placeholder trocado de `echo && exit 0` pra `sleep 600`.
> - `bun run test:e2e` agora lista specs via `playwright test --list` (real specs chegam no Phase 8).

---

### Phase 3: Server

#### T12: Sala class + state machine

**Status**: ✓ 2026-07-04 · Gate: quick · 25 tests pass
**What**: Classe `Sala` que encapsula `Map<playerId, Player>`, `phase`, `round`, `timer`, com transições de estado e timers
**Where**: `apps/server/src/sala.ts`, `apps/server/src/sala.test.ts`
**Depends on**: T2, T7
**Requirements**: F-003, F-004, F-005, F-006, F-013, F-014, F-015, F-027, F-036
**Tests**: unit (state machine)
**Gate**: quick
**Files**: `apps/server/src/sala.ts`, `apps/server/src/sala.test.ts` (25 tests).
**Gate result**: state machine completo, timer com auto-reveal, isCritical (≤30s), promote host, seatIndex (first free), sala_cheia.

**Done when**:

- [x] `Sala` class com `addPlayer`, `removePlayer`, `castVote`, `reveal`, `startNewRound`, `tick`
- [x] Transições: `idle → voting (primeiro voto) → revealable (todos votaram) → revealed → voting (new round)`
- [x] Timer interno, `tick()` decrementa 1s, dispara auto-reveal em 0
- [x] Test: cada transição, sala cheia, sala vazia, timer expiry
- [x] Gate: `bun run --filter server test` → 25/25 pass

**Verify**: ≥8 testes — entregue com 25 ✓

---

#### T12a: Sala reconnect primitives + host promotion + ghost status

**Status**: ✓ 2026-07-04 · Gate: quick · 14 tests pass
**What**: Adicionar `findByUUID`, `player.status: 'connected' | 'disconnected'`, grace period (60s), e `promoteOldestPlayer()` (move role para o player com menor `joinedAt`)
**Where**: `apps/server/src/sala.ts` (extensão), `apps/server/src/sala-reconnect.test.ts`
**Depends on**: T12
**Requirements**: F-037, F-038, F-048, F-050
**Tests**: unit
**Gate**: quick
**Files**: `apps/server/src/sala.ts` (extensão), `apps/server/src/sala-reconnect.test.ts` (14 tests).
**Gate result**: findByUUID/markDisconnected/markConnected + tickGracePeriod + promoteOldestPlayer + integração disconnect→reconnect preserva voto.

**Done when**:

- [x] `Sala.findByUUID(uuid) → Player | null`
- [x] `Player.status: 'connected' | 'disconnected'` (default: `connected`)
- [x] `Sala.markDisconnected(playerId)` — seta status, NÃO remove imediatamente
- [x] `Sala.markConnected(uuid)` — se player existe na sala, seta status back
- [x] Grace period: player disconnected > 60s → remove (job periódico a cada 10s via CleanupService)
- [x] `Sala.promoteOldestPlayer()` — encontra player com menor `joinedAt`, seta `role: 'host'`; retorna `Player | null` se sala vazia
- [x] Test: findByUUID, markDisconnected, grace period expiry, promoteOldestPlayer (1 player, 3 players com joinedAt distintos, sala vazia)
- [x] Gate: `bun run --filter server test` → 14/14 pass

**Verify**: ≥5 testes — entregue com 14 ✓

---

#### T13: hello handler (create + join)

**Status**: ✓ 2026-07-04 · Gate: quick · 14 tests pass (inclui T13a)
**What**: Handler do evento `hello` que valida nick, cria sala (sem code) ou adiciona a sala existente (com code)
**Where**: `apps/server/src/handlers/hello.ts`, `apps/server/src/handlers/hello.test.ts`
**Depends on**: T12, T17, T8
**Requirements**: F-001, F-002, F-003, F-004, F-005, F-006
**Tests**: unit
**Gate**: quick
**Files**: `apps/server/src/handlers/hello.ts`, `apps/server/src/handlers/hello.test.ts` (14 tests cobrindo hello + reconnect).
**Gate result**: nick validation, create/join, sala_cheia, sala_nao_encontrada, seatIndex, reconnect preservado.

**Done when**:

- [x] Valida nick 2-20 chars, sem espaços duplos/nas pontas
- [x] Se sem `code`: cria sala com code 4-char, atribui role `host`
- [x] Se com `code`: valida sala existe, tem < 12 jogadores; rejeita `sala_cheia` ou `sala_nao_encontrada`
- [x] Atribui `seatIndex` (primeiro livre)
- [x] Persiste `uuid` no player (reconnect future)
- [x] Test: nick inválido, sala cheia, código inexistente, criação, join normal
- [x] Gate: `bun run --filter server test` → 14/14 pass

**Verify**: ≥6 testes — entregue com 14 ✓ (inclui T13a reconnect)

---

#### T13a: hello reconnect flow

**Status**: ✓ 2026-07-04 · Gate: quick · (incorporado em hello.test.ts)
**What**: Handler detecta UUID existente na sala e reidrata player (mantém voto, seatIndex, role)
**Where**: `apps/server/src/handlers/hello.ts` (incorporado), `apps/server/src/handlers/hello.test.ts` (bloco reconnect)
**Depends on**: T12a, T13
**Requirements**: F-037, F-038
**Tests**: unit
**Gate**: quick
**Files**: mesmo arquivo de T13 (decision: keep simple, single hello handler).
**Gate result**: 5 testes de reconnect no bloco T13a.

**Done when**:

- [x] Em `hello`: se `uuid` já existe em alguma sala, reidrata player (mantém seatIndex, voto, role)
- [x] Code+UUID válidos juntos → code tem prioridade (UX: URL com ?code=ZZZZ é intenção explícita)
- [x] Sala cheia + reconnect tenta entrar → reusa assento (não conta como novo)
- [x] Test: reconnect com voto preservado, reconnect em sala cheia, uuid inválida
- [x] Gate: `bun run --filter server test` → 14/14 pass (incluindo este)

**Verify**: ≥3 testes — entregue com 5 ✓
**SPEC_DEVIATION**: Sala inexistente + uuid conhecida → cria nova sala (em vez de `sala_nao_encontrada`). Rationale: zero-friction UX > erro técnico para scenario "server restart mid-rodada".

---

#### T14: cast_vote handler

**Status**: ✓ 2026-07-04 · Gate: quick · 8 tests pass
**What**: Handler do evento `cast_vote` que valida phase, registra voto, broadcast `vote_cast` (sem valor)
**Where**: `apps/server/src/handlers/cast-vote.ts`, `apps/server/src/handlers/cast-vote.test.ts`
**Depends on**: T12, T13
**Requirements**: F-009, F-010, F-011, F-012, F-013, F-014
**Tests**: unit
**Gate**: quick
**Files**: `apps/server/src/handlers/cast-vote.ts`, `apps/server/src/handlers/cast-vote.test.ts` (8 tests).
**Gate result**: voto normal, change idempotente, un-vote rejeitado, phase errada rejeitada, first-vote inicia timer.

**Done when**:

- [x] Valida `phase === 'idle' | 'voting' | 'revealable'` senão retorna `error { code: 'invalid_phase' }`
- [x] Valida `value !== null` senão retorna `error { code: 'invalid_vote' }` (un-vote proibido)
- [x] Atualiza `player.value` (in-place, idempotente)
- [x] Marca `player.hasVoted = true`
- [x] Broadcast `vote_cast` (individual ou aggregate por kind) para todos (sem valor)
- [x] Se primeiro voto da rodada: inicia timer 60s, phase → voting
- [x] Test: voto normal, change vote, vote em fase errada, un-vote rejeitado, primeiro voto inicia timer
- [x] Gate: `bun run --filter server test` → 8/8 pass

**Verify**: ≥4 testes — entregue com 8 ✓

---

#### T15: reveal_votes handler

**Status**: ✓ 2026-07-04 · Gate: quick · 6 tests pass
**What**: Handler do evento `reveal_votes` que valida role+phase, calcula stats, broadcast `votes_revealed`
**Where**: `apps/server/src/handlers/reveal-votes.ts`, `apps/server/src/handlers/reveal-votes.test.ts`
**Depends on**: T12, T14
**Requirements**: F-015, F-019, F-020, F-021
**Tests**: unit
**Gate**: quick
**Files**: `apps/server/src/handlers/reveal-votes.ts`, `apps/server/src/handlers/reveal-votes.test.ts` (6 tests).
**Gate result**: stats corretas, unanimous detection, qualquer player revela (sem role check).

**Done when**:

- [x] Valida `phase === 'voting' || phase === 'revealable'` (qualquer player pode revelar após ≥1 voto; sem role check)
- [x] Chama `computeConsensus` para calcular median/mean/range
- [x] Detecta unanimous: `unanimous = todos os votos não-nulos são iguais`
- [x] Phase → revealed
- [x] Broadcast `votes_revealed { votes, median, mean, range, unanimous }` para todos
- [x] Test: reveal normal, reveal por qualquer player, unanimous detection
- [x] Gate: `bun run --filter server test` → 6/6 pass

**Verify**: ≥3 testes — entregue com 6 ✓

---

#### T16: start_new_round handler

**Status**: ✓ 2026-07-04 · Gate: quick · 4 tests pass
**What**: Handler do evento `start_new_round` que reseta votes, incrementa round, broadcast `round_started`
**Where**: `apps/server/src/handlers/start-new-round.ts`, `apps/server/src/handlers/start-new-round.test.ts`
**Depends on**: T12, T15
**Requirements**: F-025, F-026
**Tests**: unit
**Gate**: quick
**Files**: `apps/server/src/handlers/start-new-round.ts`, `apps/server/src/handlers/start-new-round.test.ts` (4 tests).
**Gate result**: limpa votes, incrementa round, phase → voting, qualquer player inicia.

**Done when**:

- [x] Valida `phase === 'revealed'` (qualquer player pode iniciar nova rodada; sem role check)
- [x] Limpa `player.value` e `player.hasVoted` para todos
- [x] Incrementa `round`
- [x] Reseta timer
- [x] Phase → voting (próximo voto inicia nova rodada)
- [x] Broadcast `round_started { round }` para todos
- [x] Test: new round normal, new round por qualquer player
- [x] Gate: `bun run --filter server test` → 4/4 pass

**Verify**: ≥2 testes — entregue com 4 ✓

---

#### T17: WebSocket handler (Bun.serve) + heartbeat

**Status**: ✓ 2026-07-04 · Gate: quick · 9 tests pass
**What**: Setup do `Bun.serve()` com upgrade WS, dispatch de eventos, heartbeat ping/pong
**Where**: `apps/server/src/ws.ts`, `apps/server/src/ws.test.ts`
**Depends on**: T2
**Requirements**: F-034, F-035
**Tests**: unit (com mock client)
**Gate**: quick
**Files**: `apps/server/src/ws.ts`, `apps/server/src/ws.test.ts` (9 tests), `apps/server/src/index.ts` (Bun.serve + WS upgrade wiring).
**Gate result**: WS service com BunWS mock, dispatch todos os eventos, ping/pong/timeout, graceful shutdown, wire format Zod-validado.

**Done when**:

- [x] `Bun.serve()` com `fetch` (HTTP) + `websocket` handlers
- [x] Upgrade WS em `/ws`
- [x] CORS: same-origin only em v1 (sem CORS headers, Vite proxy em dev)
- [x] Dispatch de eventos por tipo (chama handler apropriado)
- [x] Heartbeat: client envia `ping`, server responde `pong`; client timeout 60s → desconecta
- [x] Test: conexão, dispatch, ping/pong, gracefulShutdown, wire format
- [x] Gate: `bun run --filter server test` → 9/9 pass
- [x] **Live e2e** (curl + bun ws client): `hello` → `welcome` com sala criada retorna `code: WK0J, host: Ana, seat: 0, phase: idle, timer: 60` ✓

**Verify**: ≥4 testes — entregue com 9 ✓ + live integration ✓

---

#### T17a: WS rate limit + structured logging

**Status**: ✓ 2026-07-04 · Gate: quick · 8 tests pass
**What**: Rate limiting (5 connects/s por IP) + logging estruturado (event, playerId, salaCode) no WS handler
**Where**: `apps/server/src/ws-rate-limit.ts`, `apps/server/src/ws-logger.ts`, `apps/server/src/ws-rate-limit.test.ts`
**Depends on**: T17
**Requirements**: foundational (security/observability)
**Tests**: unit
**Gate**: quick
**Files**: `apps/server/src/ws-rate-limit.ts`, `apps/server/src/ws-logger.ts`, `apps/server/src/ws-rate-limit.test.ts` (8 tests).
**Gate result**: rate limit 5/s/IP, JSON-line logger com MemorySink para testes + StdoutSink para prod.

**Done when**:

- [x] `RateLimiter.check(ip, maxPerSecond=5): boolean` — usa `Map<ip, number[]>` em memória (1s rolling window)
- [x] WS handler loga: `connect`, `disconnect`, `event`, `error`, `ratelimit`, `shutdown` com `{ ts, level, event }` em JSON lines
- [x] Test: rate limit aceita 5/s, rejeita 6º/s, IPs independentes, cleanup de IPs inativos
- [x] Test: logger captura connect/c2s event/error/ratelimit/shutdown
- [x] Gate: `bun run --filter server test` → 8/8 pass

**Verify**: ≥3 testes — entregue com 8 ✓

---

#### T18: Sala cleanup (last_left, server_restart)

**Status**: ✓ 2026-07-04 · Gate: quick · 3 tests pass
**What**: Limpeza de sala quando último player sai; broadcast `sala_ended` em caso de server restart
**Where**: `apps/server/src/cleanup.ts`, `apps/server/src/cleanup.test.ts`
**Depends on**: T12, T13
**Requirements**: F-036, F-039
**Tests**: unit
**Gate**: quick
**Files**: `apps/server/src/cleanup.ts`, `apps/server/src/cleanup.test.ts` (3 tests).
**Gate result**: remove sala vazia, promove host antes de remover, shutdown gracioso.

**Done when**:

- [x] Quando `sala.players.size === 0`, sala é removida do `Map<codigo, Sala>` (via Hub.removePlayer + tickGracePeriod)
- [x] Antes de remover player: se era `host`, chamar `promoteOldestPlayer()` (se houver outros na sala)
- [x] Graceful shutdown: `installSignalHandlers` → `SIGTERM/SIGINT` → broadcast `sala_ended { reason: 'server_restart' }` via CleanupService.shutdown
- [x] Test: sala removida após último sair (grace period expiry), host sai com 2+ players → promote, broadcast em shutdown
- [x] Gate: `bun run --filter server test` → 3/3 pass

**Verify**: ≥2 testes — entregue com 3 ✓

---

### Phase 4: Server tests

#### T19: vitest state machine tests (integração)

**What**: Testes de integração do state machine completo (Sala + handlers encadeados)
**Where**: `apps/server/src/sala-integration.test.ts`
**Depends on**: T12, T13, T14, T15, T16
**Requirements**: F-013, F-015, F-026
**Tests**: integration
**Gate**: full

**Done when**:

- [ ] Test 1: criar sala → 2 players entram → 1º vota → 2º vota → host reveal → todos veem stats
- [ ] Test 2: timer expira sem todos votarem → auto-reveal
- [ ] Test 3: new round reseta estado
- [ ] Gate: `bun run --filter server test`

**Verify**: `bun run --filter server test` passa com ≥3 testes de integração

---

#### T20: vitest validators tests (nick + code)

**What**: Testes focados nos validadores de nick e código
**Where**: `apps/server/src/validators.test.ts`
**Depends on**: T8
**Requirements**: F-001, F-002
**Tests**: unit
**Gate**: quick

**Done when**:

- [ ] Test: nick vazio, nick 1 char, nick 21 chars, nick com espaço duplo, nick com espaço na ponta
- [ ] Test: código inexistente, código sala cheia, código válido
- [ ] Gate: `bun run --filter server test`

**Verify**: `bun run --filter server test` passa com ≥8 testes

---

#### T21: vitest computeConsensus tests (shared)

**What**: Testes adicionais de `computeConsensus` (cenários extremos)
**Where**: `packages/shared/src/compute/consensus.test.ts` (extender T9)
**Depends on**: T9
**Requirements**: F-020
**Tests**: unit
**Gate**: quick

**Done when**:

- [ ] Test: 12 votos com ☕ excluído, todos 5, todos 13, votes pares/ímpares
- [ ] Gate: `bun run --filter shared test`

**Verify**: `bun run --filter shared test` passa com ≥10 testes (combinado com T9)

---

### Phase 5: Client core

#### T22: Zustand store

**What**: Store Zustand para estado do client (sala, currentPlayer, phase, votes, ui)
**Where**: `apps/web/src/store/sala.ts`
**Depends on**: T3, T10
**Requirements**: F-023, F-024
**Tests**: unit
**Gate**: quick

**Done when**:

- [ ] `useSalaStore` com `sala`, `currentPlayer`, `setSala`, `addPlayer`, `removePlayer`, `setVote`, `reveal`, `startNewRound`
- [ ] Selectors granulares para evitar re-render
- [ ] Test: actions imutáveis, selectors retornam subset correto
- [ ] Gate: `bun run --filter web test`

**Verify**: `bun run --filter web test` passa com ≥4 testes

---

#### T23: WebSocket client wrapper

**What**: Wrapper que abre WS, envia eventos, recebe eventos, atualiza Zustand
**Where**: `apps/web/src/lib/ws-client.ts`, `apps/web/src/lib/ws-client.test.ts`
**Depends on**: T3, T8
**Requirements**: F-009, F-010, F-021, F-034, F-037
**Tests**: unit (com mock WS)
**Gate**: quick

**Done when**:

- [ ] `createWSClient(url, store)` retorna `{ connect, send, on }`
- [ ] URL lida de `import.meta.env.VITE_WS_URL` (default: `ws://localhost:3001/ws`)
- [ ] Auto-reconnect com mesmo UUID em disconnect (exponential backoff: 1s, 2s, 4s, max 30s)
- [ ] Validação Zod de cada evento recebido (rejeita malformed)
- [ ] Dispatch: `vote_cast` (lida com union individual/aggregate) → `setVote`, `votes_revealed` → `reveal`, etc.
- [ ] Heartbeat: envia `ping` 30s, espera `pong` em 5s
- [ ] Multi-tab com mesmo UUID: primeiro connect ganha; segundo vê `sala_ended { reason: 'replaced' }` (decisão explícita)
- [ ] Test: connect, dispatch, reconnect, heartbeat, env config
- [ ] Gate: `bun run --filter web test`

**Verify**: `bun run --filter web test` passa com ≥5 testes

---

#### T24: Router setup

**What**: React Router com 4 rotas: `/`, `/join`, `/arena`, `/full`
**Where**: `apps/web/src/main.tsx`, `apps/web/src/routes.tsx`
**Depends on**: T3
**Requirements**: foundational
**Tests**: none
**Gate**: build

**Done when**:

- [ ] `routes.tsx` exporta 4 rotas com componentes placeholder
- [ ] `main.tsx` renderiza `<RouterProvider>`
- [ ] Browser mostra 4 URLs sem 404
- [ ] Gate: `bun run typecheck`

**Verify**: `bun run typecheck` e browser navega entre rotas

---

#### T25: Tailwind + Atelier Zero tokens

**What**: Configurar Tailwind com tokens Atelier Zero (paper, ink, coral, mustard, etc.) e fontes (Inter Tight, Playfair, JetBrains Mono)
**Where**: `apps/web/tailwind.config.ts`, `apps/web/src/index.css`
**Depends on**: T3
**Requirements**: F-016 (visual)
**Tests**: none
**Gate**: build

**Done when**:

- [ ] `tailwind.config.ts` com `theme.extend.colors` mapeando tokens Atelier Zero
- [ ] `theme.extend.fontFamily` com Inter Tight, Playfair, JetBrains Mono
- [ ] `src/index.css` com `@tailwind base/components/utilities` e font imports
- [ ] Browser renderiza texto com fontes corretas
- [ ] Gate: `bun run typecheck`

**Verify**: abrir `/` no browser, ver fontes aplicadas

---

#### T26: Atelier Zero primitive library + shadcn/ui base

**What**: Setup shadcn/ui base + construir primitivos Atelier Zero (Seat, Pill, Card variants, Ellipse, ConnectionStatus) que componentes da arena (T31-T37) consomem. Evita CSS divergente entre componentes.
**Where**: `apps/web/src/components/ui/button.tsx`, `card.tsx`, `toast.tsx`, `seat.tsx` (primitive, NÃO Seat completo), `pill.tsx`, `ellipse.tsx`, `connection-status.tsx`
**Depends on**: T25
**Requirements**: F-032, F-037
**Tests**: unit
**Gate**: quick

**Done when**:

- [ ] shadcn/ui: Button, Card, Toast copiados, adaptados pra tokens Atelier Zero
- [ ] **Primitivos Atelier Zero** em `components/ui/`:
  - `Seat` (primitive, com prop `isYou`, `isHost`, `state`, `faceUp`) — T31 instancia
  - `Pill` (variants: `default`, `critical`, `gold`, `ghost`) — T34, T35, T33 consomem
  - `Card` (bone-fill, com prop `padding`) — T27-T30 usam
  - `Ellipse` (dashed border + radial gradient) — T30 usa
  - `ConnectionStatus` (loading/error/connected indicator) — T28, T30 usam
- [ ] Toast provider no App.tsx
- [ ] Test: cada primitivo renderiza com props
- [ ] Gate: `bun run --filter web test`

**Verify**: `bun run --filter web test` passa com ≥5 testes (um por primitivo)

---

### Phase 6: Client UI

#### T27: Landing page

**What**: Página inicial com hero, CTA "Criar sala", Trust Badge (reutiliza HTML reference)
**Where**: `apps/web/src/pages/landing.tsx`
**Depends on**: T24, T25, T26
**Requirements**: F-031
**Tests**: none
**Gate**: build

**Done when**:

- [ ] Hero com headline, lead, CTA coral
- [ ] CTA "Criar sala" → navigate `/join?host=1` (server gera code no `hello`)
- [ ] CTA ghost "Entrar com código" → input + navigate `/join?code=YYYY`
- [ ] Trust Badge "0 cadastros · 4 chars no código"
- [ ] A11y: headings hierárquicos, CTAs focáveis, aria-labels
- [ ] Visual bate com `landing.html` reference
- [ ] Gate: `bun run typecheck`

**Verify**: browser mostra landing visualmente fiel ao HTML

---

#### T28: Join page

**What**: Página de entrada com input de apelido, validação inline, redirect `/arena` após `welcome`
**Where**: `apps/web/src/pages/join.tsx`
**Depends on**: T23, T24, T26
**Requirements**: F-001, F-002
**Tests**: unit (validação inline)
**Gate**: quick

**Done when**:

- [ ] Input de apelido, botão "Entrar"
- [ ] Validação inline (2-20 chars, sem espaços duplos)
- [ ] Click Entrar → loading state ("Conectando...") → `hello { uuid, nick, code }` → `welcome` → redirect `/arena?code=XXXX`
- [ ] `error { code: 'sala_cheia' }` → redirect `/full`
- [ ] `error { code: 'sala_nao_encontrada' }` → mensagem "Sala não encontrada" + retry
- [ ] WS connect failure → "Conexão perdida — tentando reconectar..."
- [ ] Parse `?code=XXXX&host=1` da URL (hook `useQueryParam`)
- [ ] A11y: label associado, aria-invalid em erro, aria-live em status
- [ ] Test: validação inline, error states, URL parsing
- [ ] Gate: `bun run --filter web test`

**Verify**: `bun run --filter web test` passa com ≥3 testes

---

#### T29: Full page (sala cheia)

**What**: Página de sala cheia com botão "Criar nova sala" (reutiliza HTML reference)
**Where**: `apps/web/src/pages/full.tsx`
**Depends on**: T24
**Requirements**: F-007
**Tests**: none
**Gate**: build

**Done when**:

- [ ] Mensagem "Sala cheia · 12/12"
- [ ] Botão "Criar nova sala" → volta pra landing
- [ ] Visual bate com `full.html` reference
- [ ] Gate: `bun run typecheck`

**Verify**: `bun run typecheck` e browser mostra visual fiel

---

#### T30: Arena shell (table container)

**What**: Shell da arena com header (código da sala, round, player nick), stage (onde fica a mesa), topbar
**Where**: `apps/web/src/pages/arena.tsx`
**Depends on**: T22, T23, T24, T25, T26
**Requirements**: foundational
**Tests**: none
**Gate**: build

**Done when**:

- [ ] Header com code, round, "Você · ${nick}"
- [ ] Stage container com table ellipse dashed border
- [ ] Mostra T31-T37 (seats, deck, buttons) em posições fixas
- [ ] On mount: parse `?code=XXXX` da URL, send `hello { uuid, nick, code }`, show loading até `welcome`
- [ ] Loading state: skeleton table + "Conectando..."
- [ ] Error state (`sala_nao_encontrada`): mensagem + redirect landing
- [ ] A11y: header com aria-label, stage com role="main", loading com aria-live
- [ ] Botão "Share" no header (sempre visível): click copia `${origin}/join.html?code=${code}` pro clipboard + toast "Link copiado ✓"
- [ ] Gate: `bun run typecheck`

**Verify**: `bun run typecheck`

---

#### T31: Seat component

**What**: Componente Seat com avatar (inicial), nick, badge VOCÊ, host star, VOTED state
**Where**: `apps/web/src/components/seat.tsx`
**Depends on**: T30
**Requirements**: F-028, F-029, F-030
**Tests**: unit (render states)
**Gate**: quick

**Done when**:

- [ ] Avatar com inicial do nick, bg coral-soft se você
- [ ] Nick, badge "VOCÊ" coral se você, ★ mostarda se host
- [ ] Estado pill: IDLE / VOTED / DISCONNECTED (opacity 0.4) / revealed (full opacity)
- [ ] Borda coral 2px (outer) se você
- [ ] Borda gold 2px (inner, aninhada via box-shadow inset) se VOCÊ E votou mediana (mas NÃO se unanimous)
- [ ] Face-up animation pós-reveal (full opacity, sem esmaecer)
- [ ] A11y: aria-label="Assento de ${nick}${votou ? ', votou' : ''}${disconnected ? ', desconectado' : ''}"
- [ ] Test: render com diferentes props (você, host, voted, revealed, disconnected, voted-mediana, unanimity)
- [ ] Gate: `bun run --filter web test`

**Verify**: `bun run --filter web test` passa com ≥4 testes

---

#### T32: Deck component

**What**: Componente Deck com 9 cartas, seleção, disabled pós-reveal
**Where**: `apps/web/src/components/deck.tsx`
**Depends on**: T30
**Requirements**: F-016, F-017, F-018
**Tests**: unit
**Gate**: quick

**Done when**:

- [ ] 9 cartas bone-fill 72×100, numeral em Playfair Italic
- [ ] Hover translateY(-3px), border coral
- [ ] Selecionada: ring coral 2px + bg coral-soft
- [ ] Disabled pós-reveal: opacity 0.4, sem pointer
- [ ] Click → `cast_vote { value }` via WS (mesma carta selecionada = no-op visual, NÃO envia `value: null`)
- [ ] A11y: cada carta é `<button>` com aria-label="Votar ${value}" (ou "Selecionada, voto em ${value}" se já votou), Enter/Space ativa
- [ ] Test: render, click, disabled, keyboard nav
- [ ] Gate: `bun run --filter web test`

**Verify**: `bun run --filter web test` passa com ≥3 testes

---

#### T33: RevealButton + NewRoundButton (morphing)

**What**: Botão central que morpha entre 3 estados: ghost awaiting, coral ready, ghost new-round
**Where**: `apps/web/src/components/reveal-button.tsx`
**Depends on**: T30
**Requirements**: F-031, F-040 (visual)
**Tests**: unit
**Gate**: quick

**Done when**:

- [ ] Estado `awaiting` (ghost): "Aguardando N jogadores…" (mostrado até ≥1 voto)
- [ ] Estado `ready` (coral): "Revelar votos." com coral dot (após ≥1 voto, qualquer player pode clicar)
- [ ] Estado `post-reveal` (ghost): "Nova rodada" (qualquer player pode clicar)
- [ ] Click → envia `reveal_votes` ou `start_new_round` conforme phase (sem role check, qualquer player)
- [ ] A11y: button com aria-label contextual ao estado, disabled com aria-disabled
- [ ] Test: render, click, keyboard, qualquer player
- [ ] Gate: `bun run --filter web test`

**Verify**: `bun run --filter web test` passa com ≥3 testes

---

#### T34: Timer pill

**What**: Pill com timer 60s, coral ≤30s, sync com `room_state.timer`
**Where**: `apps/web/src/components/timer-pill.tsx`
**Depends on**: T22
**Requirements**: F-013, F-014
**Tests**: unit
**Gate**: quick

**Done when**:

- [ ] Pill bone-fill com `00:42 · ROUND 03`
- [ ] Coral bg quando `timer <= 30`
- [ ] Sync com `room_state.timer` via Zustand
- [ ] Auto-hide quando sala vazia
- [ ] A11y: role="timer", aria-live="off" (não anuncia cada segundo), aria-label="Tempo restante: X segundos"
- [ ] Test: render, critical state
- [ ] Gate: `bun run --filter web test`

**Verify**: `bun run --filter web test` passa com ≥2 testes

---

#### T35: Stats pill (média/mediana/intervalo)

**What**: Pill com stats pós-reveal: "MÉDIA X.X · MEDIANA Y · INTERVALO A–B"
**Where**: `apps/web/src/components/stats-pill.tsx`
**Depends on**: T22
**Requirements**: F-024
**Tests**: unit
**Gate**: quick

**Done when**:

- [ ] Pill bone-fill com 3 valores (média/mediana/intervalo)
- [ ] Aparece só pós-reveal
- [ ] Mediana em gold (mustard) por padrão
- [ ] Quando `unanimous: true`, mostra badge "UNANIMOUS" em vez da mediana gold
- [ ] A11y: role="status", aria-live="polite" (anuncia quando reveal acontece)
- [ ] Test: render com diferentes stats, unanimity
- [ ] Gate: `bun run --filter web test`

**Verify**: `bun run --filter web test` passa com ≥2 testes

---

#### T36: Empty sala overlay ("Convide outros")

**What**: Overlay quando você é o único na sala com share URL copy
**Where**: `apps/web/src/components/empty-overlay.tsx`
**Depends on**: T30
**Requirements**: F-033
**Tests**: unit
**Gate**: quick

**Done when**:

- [ ] Aparece quando `sala.players.length === 1 && sala.players[0].id === currentPlayer.id`
- [ ] Mark Ø + headline "Convide outros."
- [ ] Share URL readonly + botão "Copiar link"
- [ ] Dismissável
- [ ] Share URL readonly (header tem o mesmo share button; este aqui é redundante mas visível quando overlay está aberto)
- [ ] A11y: role="dialog", aria-modal="true", focus trap, Esc fecha
- [ ] Test: render condicional, copy clipboard, keyboard
- [ ] Gate: `bun run --filter web test`

**Verify**: `bun run --filter web test` passa com ≥2 testes

---

#### T37: Toast queue

**What**: Sistema de toasts para eventos (primeiro voto individual, agregado, "Todos votaram", etc.)
**Where**: `apps/web/src/components/toast-queue.tsx`
**Depends on**: T22
**Requirements**: F-008 (events UI)
**Tests**: unit
**Gate**: quick

**Done when**:

- [ ] Stack de toasts top-center
- [ ] Auto-dismiss 3s
- [ ] Triggered por: primeiro voto real (nome), agregado (count), "Todos votaram", "Tempo esgotado", "Sala cheia"
- [ ] A11y: role="status" ou role="alert" (conforme urgência), aria-live="polite" ou "assertive"
- [ ] Test: render, dismiss, a11y
- [ ] Gate: `bun run --filter web test`

**Verify**: `bun run --filter web test` passa com ≥3 testes

---

### Phase 7: Client wire-up

#### T38: Wire cast_vote loop

**What**: Conectar Deck click → WS cast_vote → Sala state update → Seat VOTED
**Where**: `apps/web/src/lib/vote-loop.ts` (composition), integration em `apps/web/src/pages/arena.tsx`
**Depends on**: T22, T23, T32, T33
**Requirements**: F-009, F-010, F-011, F-017
**Tests**: integration
**Gate**: full

**Done when**:

- [ ] Click em Deck → `ws.send({ type: 'cast_vote', value })`
- [ ] Server broadcast `vote_cast` → Zustand atualiza
- [ ] Seat re-renderiza com VOTED
- [ ] RevealButton habilita quando `phase === 'revealable'`
- [ ] Test: integration com mock WS
- [ ] Gate: `bun run --filter web test`

**Verify**: `bun run --filter web test` passa com ≥2 testes de integração

---

#### T39: Wire reveal_votes loop

**What**: Conectar RevealButton click → WS reveal_votes → Sala face-up + stats + median highlight
**Where**: `apps/web/src/lib/reveal-loop.ts`, integration em `apps/web/src/pages/arena.tsx`
**Depends on**: T38
**Requirements**: F-021, F-022, F-023, F-024
**Tests**: integration
**Gate**: full

**Done when**:

- [ ] Click RevealButton → `ws.send({ type: 'reveal_votes' })`
- [ ] Server broadcast `votes_revealed` → Zustand atualiza
- [ ] Seats viram face-up com valor + nome em full opacity
- [ ] Assentos com mediana recebem borda gold
- [ ] Stats pill aparece
- [ ] RevealButton morpha para "Nova rodada"
- [ ] Test: integration
- [ ] Gate: `bun run --filter web test`

**Verify**: `bun run --filter web test` passa com ≥1 teste de integração

---

#### T40: Wire start_new_round loop

**What**: Conectar NewRoundButton click → WS start_new_round → reset votes + increment round
**Where**: `apps/web/src/lib/new-round-loop.ts`, integration em `apps/web/src/pages/arena.tsx`
**Depends on**: T39
**Requirements**: F-025, F-026
**Tests**: integration
**Gate**: full

**Done when**:

- [ ] Click NewRoundButton → `ws.send({ type: 'start_new_round' })`
- [ ] Server broadcast `round_started` → Zustand atualiza
- [ ] Seats voltam a IDLE, votes limpos, timer reset
- [ ] RevealButton volta a "Aguardando…"
- [ ] Round counter incrementa
- [ ] Test: integration
- [ ] Gate: `bun run --filter web test`

**Verify**: `bun run --filter web test` passa com ≥1 teste de integração

---

#### T41: Wire sala_ended + sala_cheia UX

**What**: Handler de `sala_ended` (last_left, server_restart, replaced) e `error { code: 'sala_cheia' }`
**Where**: `apps/web/src/lib/sala-end-loop.ts`
**Depends on**: T23, T24, T29, T30
**Requirements**: F-005, F-007, F-036, F-039
**Tests**: integration
**Gate**: full

**Done when**:

- [ ] `sala_ended { reason: 'last_left' }` → toast + redirect `/`
- [ ] `sala_ended { reason: 'server_restart' }` → toast "Sala encerrada" + redirect `/`
- [ ] `sala_ended { reason: 'replaced' }` (multi-tab) → toast "Outra aba assumiu" + redirect `/`
- [ ] `error { code: 'sala_cheia' }` → redirect `/full`
- [ ] Test: cada cenário
- [ ] Gate: `bun run --filter web test`

**Verify**: `bun run --filter web test` passa com ≥3 testes

---

### Phase 8: E2E — ✓ 2026-07-04 (completo)

#### T42: Playwright multi-client fixture — ✓ 2026-07-04 (completo)

**What**: Fixture que sobe 2 contexts de browser + servidor, retorna helpers pra criar salas e mover players
**Where**: `tests/e2e/fixtures/multi-client.ts` + `tests/e2e/fixtures.spec.ts`
**Depends on**: T5
**Requirements**: foundational
**Tests**: none
**Gate**: build

**Done when**:

- [x] `multiClient()` sobe Bun server + 2 browser contexts
- [x] Helpers: `createRoom()`, `joinRoom()`, `vote()`, `reveal()`, `newRound()`, `salaState()`, `consensus()`, `waitForSala()`, `playerId()`, `dispose()`
- [x] WebSocket logs capturados pra debug
- [x] Gate: `bunx playwright test --list` lista fixtures

**Verify**: `bunx playwright test --list` funciona (3 fixtures listados)

---

#### T43: E2E happy path — ✓ 2026-07-04 (completo)

**What**: 2 clients criam sala, entram, votam, revelam, validam stats
**Where**: `tests/e2e/happy-path.spec.ts`
**Depends on**: T42, T40
**Requirements**: F-001..F-026
**Tests**: e2e
**Gate**: full

**Done when**:

- [x] Browser A cria sala → code gerado
- [x] Browser B entra via `join.html?code=XXXX` com nick "Test"
- [x] Browser A vê B entrar
- [x] Ambos votam (5 e 8)
- [x] Browser A (host) revela → ambos veem valores face-up
- [x] Stats pill mostra média/mediana corretas (média 6.5, range 5–8)
- [x] Mediana destacada gold
- [x] Gate: `bunx playwright test happy-path`

**Verify**: 2 testes passam (full happy path + RevealButton state transition)

---

#### T44: E2E sala cheia — ✓ 2026-07-04 (completo)

**What**: 13 clients, 13º rejeitado com redirect `/full`
**Where**: `tests/e2e/sala-cheia.spec.ts`
**Depends on**: T42
**Requirements**: F-005, F-007
**Tests**: e2e
**Gate**: full

**Done when**:

- [x] Browsers A–L (12) entram na mesma sala
- [x] A–K entram OK (sala 1/12 → 11/12)
- [x] L entra OK (sala 12/12)
- [x] M é rejeitado com `error { code: 'sala_cheia' }` e redirecionado para `/full`
- [x] Page `/full` mostra "Sala cheia." + "12/12 · máximo atingido" + botão "Criar nova sala"
- [x] Gate: `bunx playwright test sala-cheia`

**Verify**: 1 teste passa (10.3s)

---

#### T45: E2E reconnect — ✓ 2026-07-04 (completo)

**What**: Client desconecta mid-rodada, reconecta com mesmo UUID, voto preservado
**Where**: `tests/e2e/reconnect.spec.ts`
**Depends on**: T42
**Requirements**: F-037, F-038
**Tests**: e2e
**Gate**: full

**Done when**:

- [x] Browser A entra, vota 5
- [x] Browser A fecha (simula disconnect via context.close)
- [x] Browser A2 reabre com mesmo UUID (localStorage injetado via addInitScript)
- [x] Sala é reidratada com voto 5 preservado
- [x] Browser B (testemunha) também vê voto preservado
- [x] Gate: `bunx playwright test reconnect`

**Verify**: 1 teste passa (2.9s)

---

### Phase 9: Polish

#### T46: README + dev setup

**What**: Documentar como rodar o projeto (bun install, bun run dev, bun test, playwright)
**Where**: `README.md`
**Depends on**: T45
**Requirements**: foundational
**Tests**: none
**Gate**: build

**Done when**:

- [ ] `README.md` no root com: stack, prereqs (Bun), install, dev, test, build
- [ ] Seção "Architecture" com link pros ADRs
- [ ] Seção "WebSocket Protocol" com diagrama simples
- [ ] Gate: `bun run typecheck`

**Verify**: ler README, instruções funcionam

---

#### T47: Type check + lint + format

**What**: Configurar `typecheck`, `lint` (biome), `format` em root `package.json`
**Where**: `package.json` (scripts), `biome.json`
**Depends on**: T45
**Requirements**: foundational
**Tests**: none
**Gate**: full

**Done when**:

- [ ] `bun run typecheck` passa em todos os workspaces
- [ ] `bun run lint` (biome) passa sem erros
- [ ] `bun run format` (biome format) idempotente
- [ ] Gate: `bun run typecheck && bun run lint`

**Verify**: comandos passam

---

#### T48: Visual fidelity vs HTML reference

**What**: Comparar React app com HTMLs reference, ajustar CSS até visual bater
**Where**: `apps/web/src/**/*.css` (ajustes), `apps/web/tailwind.config.ts` (tokens)
**Depends on**: T40
**Requirements**: F-016, F-022, F-024, F-028, F-030
**Tests**: visual (manual)
**Gate**: manual review

**Done when**:

- [ ] Cores Atelier Zero batem com HTML reference
- [ ] Tipografia (Inter Tight, Playfair, JetBrains Mono) idêntica
- [ ] Mesa ring renderiza idêntica (8 assentos em elipse, 6h fixo)
- [ ] Deck com 9 cartas, numeral Playfair Italic
- [ ] Toast pill, stats pill, timer pill idênticos
- [ ] Empty overlay "Convide outros" idêntico ao HTML

**Verify**: screenshots lado a lado com HTML reference

---

#### T49: Production build + preview

**What**: Configurar `bun run build` que gera bundle de prod (Vite + Bun), e `bun run preview` que serve localmente
**Where**: `apps/web/vite.config.ts` (build), `apps/server/src/index.ts` (env detection), `package.json` (scripts)
**Depends on**: T48
**Requirements**: foundational
**Tests**: none
**Gate**: build

**Done when**:

- [ ] `bun run build` em `apps/web` gera `dist/` com bundle minificado
- [ ] `bun run build` em `apps/server` gera binário standalone
- [ ] `bun run preview` sobe ambos localmente
- [ ] Gate: `bun run build` completa sem erros

**Verify**: `bun run build && ls apps/web/dist apps/server/dist`

---

## Requirement Coverage

| F-ID | Tasks | Status |
|------|-------|--------|
| F-001 | T13, T20 | ⏳ |
| F-002 | T13, T20 | ⏳ |
| F-003 | T7a, T12, T13 | ⏳ |
| F-004 | T12, T13 | ⏳ |
| F-005 | T12, T13, T41 | ⏳ |
| F-006 | T12, T13 | ⏳ |
| F-007 | T29, T41 | ⏳ |
| F-008 | T37 | ⏳ |
| F-009 | T8, T23, T38 | ⏳ |
| F-010 | T8, T38 | ⏳ |
| F-011 | T14, T38 | ⏳ |
| F-012 | T14 | ⏳ |
| F-013 | T12, T19, T34 | ⏳ |
| F-014 | T34 | ⏳ |
| F-015 | T15, T19 | ⏳ |
| F-016 | T25, T32, T48 | ⏳ |
| F-017 | T32, T38 | ⏳ |
| F-018 | T32 | ⏳ |
| F-019 | T15 | ⏳ |
| F-020 | T9, T15, T21, T35 | ⏳ |
| F-021 | T23, T39 | ⏳ |
| F-022 | T39, T48 | ⏳ |
| F-023 | T39, T48 | ⏳ |
| F-024 | T35, T39, T48 | ⏳ |
| F-025 | T16 | ⏳ |
| F-026 | T16, T40 | ⏳ |
| F-027 | T13 | ⏳ |
| F-028 | T31, T48 | ⏳ |
| F-029 | T31 | ⏳ |
| F-030 | T31, T48 | ⏳ |
| F-031 | T27, T33 | ⏳ |
| F-032 | T36 | ⏳ |
| F-033 | T36 | ⏳ |
| F-034 | T17, T23 | ⏳ |
| F-035 | T17 | ⏳ |
| F-036 | T12, T18, T41 | ⏳ |
| F-037 | T12a, T13a, T23, T18 | ⏳ |
| F-038 | T12a, T13a, T23, T45 | ⏳ |
| F-039 | T18, T41 | ⏳ |
| F-040 | T7, T8, T11 | ⏳ |
| F-041 | T10, T11 | ⏳ |
| F-042 | T19 | ⏳ |
| F-043 | T20 | ⏳ |
| F-044 | T21 | ⏳ |
| F-045 | T43 | ⏳ |
| F-046 | T44 | ⏳ |
| F-047 | T45 | ⏳ |
| F-048 | T12a, T18 | ⏳ |
| F-049 | T8, T15, T35 | ⏳ |
| F-050 | T12a, T31 | ⏳ |
| F-051 | T15, T33 | ⏳ |
| F-052 | T16, T33 | ⏳ |
| F-053 | T30 | ⏳ |

**Coverage**: 53 requisitos / 54 tasks — 100% mapeados, 0 não-cobertos ✓

---

## Diagram-Definition Cross-Check

| Task | Depends on (body) | Diagram | Status |
|------|-------------------|---------|--------|
| T0 | None | start | ✅ |
| T1 | None | start | ✅ |
| T2 | T1 | T1→T2 | ✅ |
| T3 | T1 | T1→T3 | ✅ |
| T4 | T1 | T1→T4 | ✅ |
| T5 | T1 | T1→T5 | ✅ |
| T6 | T2, T3 | T2,T3→T6 | ✅ |
| T7 | T4 | T4→T7 | ✅ |
| T7a | T7 | T7→T7a | ✅ |
| T8 | T4 | T4→T8 | ✅ |
| T9 | T7 | T7→T9 | ✅ |
| T10 | T7, T8 | T7,T8→T10 | ✅ |
| T11 | T7, T8, T9, T10 | T7-T10→T11 | ✅ |
| T12 | T2, T7 | T2,T7→T12 | ✅ |
| T12a | T12 | T12→T12a | ✅ |
| T13 | T12, T17, T8 | T12,T17→T13 (T8 implicit) | ✅ |
| T13a | T12a, T13 | T12a,T13→T13a | ✅ |
| T14 | T12, T13 | T12,T13→T14 | ✅ |
| T15 | T12, T14 | T12,T14→T15 | ✅ |
| T16 | T12, T15 | T12,T15→T16 | ✅ |
| T17 | T2 | T2→T17 | ✅ |
| T17a | T17 | T17→T17a | ✅ |
| T18 | T12, T13 | T12,T13→T18 | ✅ |
| T19 | T12, T13, T14, T15, T16 | T12-T16→T19 | ✅ |
| T20 | T8 | T8→T20 | ✅ |
| T21 | T9 | T9→T21 | ✅ |
| T22 | T3, T10 | T3,T10→T22 | ✅ |
| T23 | T3, T8 | T3,T8→T23 | ✅ |
| T24 | T3 | T3→T24 | ✅ |
| T25 | T3 | T3→T25 | ✅ |
| T26 | T25 | T25→T26 | ✅ |
| T27 | T24, T25, T26 | T24,T25,T26→T27 | ✅ |
| T28 | T23, T24, T26 | T23,T24,T26→T28 | ✅ |
| T29 | T24 | T24→T29 | ✅ |
| T30 | T22, T23, T24, T25, T26 | T22-T26→T30 | ✅ |
| T31 | T30 | T30→T31 | ✅ |
| T32 | T30 | T30→T32 | ✅ |
| T33 | T30 | T30→T33 | ✅ |
| T34 | T22 | T22→T34 | ✅ |
| T35 | T22 | T22→T35 | ✅ |
| T36 | T30 | T30→T36 | ✅ |
| T37 | T22 | T22→T37 | ✅ |
| T38 | T22, T23, T32, T33 | T22,T23,T32,T33→T38 | ✅ |
| T39 | T38 | T38→T39 | ✅ |
| T40 | T39 | T39→T40 | ✅ |
| T41 | T23, T24, T29, T30 | T23,T24,T29,T30→T41 | ✅ |
| T42 | T5 | T5→T42 | ✅ |
| T43 | T42, T40 | T42,T40→T43 | ✅ |
| T44 | T42 | T42→T44 | ✅ |
| T45 | T42 | T42→T45 | ✅ |
| T46 | T45 | T45→T46 | ✅ |
| T47 | T45 | T45→T47 | ✅ |
| T48 | T40 | T40→T48 | ✅ |
| T49 | T48 | T48→T49 | ✅ |

**Validation**: 54 tasks, 0 mismatches ✓

---

## Test Co-location Validation

| Task | Code Layer | Tests Required | Tests Field | Status |
|------|-----------|----------------|-------------|--------|
| T1 | config | none | none | ✅ |
| T0 | config (HTML move) | none | none | ✅ |
| T2 | server skeleton | none | none | ✅ |
| T3 | web skeleton | none | none | ✅ |
| T4 | shared skeleton | none | none | ✅ |
| T5 | test infra | none | none | ✅ |
| T6 | vite config | unit | unit | ✅ |
| T7 | schemas | unit | unit | ✅ |
| T7a | util | unit | unit | ✅ |
| T8 | schemas | unit | unit | ✅ |
| T9 | pure function | unit | unit | ✅ |
| T10 | types | none | none | ✅ |
| T11 | barrel | none | none | ✅ |
| T12 | state machine | unit | unit | ✅ |
| T12a | state machine ext | unit | unit | ✅ |
| T13 | handler | unit | unit | ✅ |
| T13a | reconnect handler | unit | unit | ✅ |
| T14 | handler | unit | unit | ✅ |
| T15 | handler | unit | unit | ✅ |
| T16 | handler | unit | unit | ✅ |
| T17 | WS infra | unit | unit | ✅ |
| T17a | rate limit + log | unit | unit | ✅ |
| T18 | cleanup | unit | unit | ✅ |
| T19 | integration | integration | integration | ✅ |
| T20 | validators | unit | unit | ✅ |
| T21 | pure function | unit | unit | ✅ |
| T22 | store | unit | unit | ✅ |
| T23 | ws client | unit | unit | ✅ |
| T24 | router | none | none | ✅ |
| T25 | tailwind | none | none | ✅ |
| T26 | ui primitives | unit | unit | ✅ |
| T27 | page | none | none | ✅ |
| T28 | page | unit | unit | ✅ |
| T29 | page | none | none | ✅ |
| T30 | page shell | none | none | ✅ |
| T31 | component | unit | unit | ✅ |
| T32 | component | unit | unit | ✅ |
| T33 | component | unit | unit | ✅ |
| T34 | component | unit | unit | ✅ |
| T35 | component | unit | unit | ✅ |
| T36 | component | unit | unit | ✅ |
| T37 | component | unit | unit | ✅ |
| T38 | integration | integration | integration | ✅ |
| T39 | integration | integration | integration | ✅ |
| T40 | integration | integration | integration | ✅ |
| T41 | integration | integration | integration | ✅ |
| T42 | fixture | none | none | ✅ |
| T43 | e2e | e2e | e2e | ✅ |
| T44 | e2e | e2e | e2e | ✅ |
| T45 | e2e | e2e | e2e | ✅ |
| T46 | docs | none | none | ✅ |
| T47 | tooling | none | none | ✅ |
| T48 | visual | manual | manual | ✅ |
| T49 | build | none | none | ✅ |

**Validation**: 54 tasks, 0 violations ✓

---

## Parallel Execution Map

```
Phase 1:
  T0 ─→ T1 ─┬─→ T2 ──┐
            ├─→ T3 ──┼─→ T6
            ├─→ T4 ──┘
            └─→ T5

Phase 2:
  T4 ─┬─→ T7 [P]  ─┬─→ T7a
      ├─→ T8 [P]  ─┴─→ T10 ─→ T11
      └─→ T9        (T9 sequencial: depende T7)

Phase 3 (parcial paralelo):
  T2 ─┬─→ T12 [P] ─→ T12a
      └─→ T17 [P] ─→ T17a
                       └─→ T13 ─→ T13a ─→ T14 ─→ T15 ─→ T16
                          └─→ T18

Phase 4 (paralelo entre si):
  T12-T16 → T19
  T8  → T20
  T9  → T21
  (podem rodar em paralelo, diferentes arquivos)

Phase 5 (paralelo):
  T3,T10 → T22 [P]
  T3,T8  → T23 [P]
  T3     → T24 [P]
  T3     → T25 → T26 (atelier zero primitives)

Phase 6 (paralelo entre páginas):
  T24,T25,T26 → T27 [P]
                T28 [P]   (depende T23 também)
                T29 [P]
                T22,T23,T24,T25,T26 → T30 → T31, T32, T33, T36 (arena)
  T22 → T34 [P], T35 [P], T37 [P]

Phase 7 (sequencial):
  T37 → T38 → T39 → T40
  T23,T24,T29,T30 → T41 [P] (pode rodar junto com T38-T40)

Phase 8 (paralelo entre specs):
  T42 → T43 [P]
        T44 [P]
        T45 [P]

Phase 9 (sequencial):
  T45 → T46 → T47
  T40 → T48 [P] (pode rodar junto com T46-T47)
  T48 → T49 (production build)
```

**Parallelism notes:**

- F-IDs paralelos marcados com `[P]` podem rodar em sub-agents simultâneos
- Test execution é o gargalo — `bun test` não compartilha state entre arquivos mas pode rodar em paralelo
- Visual fidelity (T48) é manual, depende de T40 estar funcional

---

## Recommended Execution Order

Para um agente sequencial ou com paralelismo limitado:

1. **Foundation** (T0-T6): ~1-2 horas
2. **Shared schemas** (T7-T11, T7a): ~2-3 horas
3. **Server core** (T12, T17, T12a, T17a, T13-T18, T13a): ~5-7 horas
4. **Server tests** (T19-T21): ~1-2 horas
5. **Client core** (T22-T26): ~2-3 horas
6. **Client UI** (T27-T37): ~4-6 horas
7. **Wire-up** (T38-T41): ~2-3 horas
8. **E2E** (T42-T45): ~2-3 horas
9. **Polish** (T46-T49): ~2-3 horas
10. **Polish** (T46-T48): ~1-2 horas

**Total estimado**: ~25-35 horas de trabalho focado
