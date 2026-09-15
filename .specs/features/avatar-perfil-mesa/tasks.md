# Avatar na mesa Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/avatar-perfil-mesa/design.md`
**Status**: Draft

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `AGENTS.md` (coss UI reuse), `apps/web/src/pages/arena.test.tsx` + `components/deck.test.tsx` (testing-library component pattern), `bun test src/` per package.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Shared schemas (zod) | unit | All branches; 1:1 to spec ACs (teto, formato, opcionalidade) | `packages/shared/src/**/*.test.ts` | `bun --filter @planning-poker/shared test` |
| Server handlers/service | unit | Every handler path: happy + edge + error (invalid, teto, sem player) | `apps/server/src/**/*.test.ts` | `bun --filter server test` |
| Web lib (avatar/protocol/ws-client) | unit | All branches; normalize tamanhos/formatos/erro; hello inclui avatar | `apps/web/src/lib/*.test.ts` | `bun --filter pointly-web test` |
| Web components/pages | unit (testing-library) | Render com/sem avatar, fallback erro, picker erro/remover, lista espectador | `apps/web/src/components/*.test.tsx`, `apps/web/src/pages/*.test.tsx` | `bun --filter pointly-web test` |

## Gate Check Commands

> Generated from codebase - confirm before Execute.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After tasks with unit tests only (single scope) | `bun --filter <pkg> test` (scope da tarefa) |
| Full | After tasks touching wire C↔S (shared+server+web) | `bun --filter @planning-poker/shared test && bun --filter server test && bun --filter pointly-web test` |
| Build | After phase completion or UI-only tasks | `bun --filter pointly-web typecheck && bun --filter server typecheck && bun --filter @planning-poker/shared typecheck` |

---

## Execution Plan

Phases are ordered and run sequentially - each phase completes before the next begins, and tasks within a phase execute in order.

### Phase 1: Contrato compartilhado

```
T1 → T2
```

### Phase 2: Servidor

```
T3 → T4
```

### Phase 3: Web base

```
T5 → T6
```

### Phase 4: UI e wiring

```
T7 → T8 → T9
```

---

## Task Breakdown

### T1: AvatarSchema + Player.avatar

**What**: Criar AvatarSchema (dataURL jpeg/png/webp, teto 40KB) e campo opcional em PlayerSchema com testes
**Where**: `packages/shared/src/schemas/sala.ts`
**Depends on**: None
**Reuses**: padrão NickSchema/UuidSchema
**Requirement**: AV-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] AvatarSchema exportado com regex dataURL + max ~40000
- [x] PlayerSchema aceita avatar opcional/nullable e rejeita acima do teto
- [x] Gate check passes: `bun --filter @planning-poker/shared test`
- [x] Test count: ≥6 tests pass (válido jpeg/png/webp, inválido gif/svg, teto, ausente, null)

**Status**: ✅ Complete (T1)

**Tests**: unit
**Gate**: quick

---

### T2: Hello + update_avatar schemas

**What**: Estender HelloPayload com avatar opcional e criar UpdateAvatar payload + união C→S
**Where**: `packages/shared/src/schemas/events.ts`
**Depends on**: T1
**Reuses**: `sala.ts` AvatarSchema de T1

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] HelloPayloadSchema aceita avatar opcional e rejeita acima do teto
- [x] UpdateAvatarPayloadSchema aceita string válida ou null e entra na discriminated union
- [x] PlayerJoined carrega avatar opcional (ou documentado que não carrega)
- [x] Gate check passes: `bun --filter @planning-poker/shared test`
- [x] Test count: ≥5 tests pass (hello com/sem avatar, update set/clear, teto, união dispatch)

**Status**: ✅ Complete (T2)

**Tests**: unit
**Gate**: quick

---

### T3: Server hello avatar + persist no Player

**What**: Aceitar avatar no handleHello (ignora só o campo se inválido), persistir no candidate e reidratar no reconnect
**Where**: `apps/server/src/handlers/hello.ts` (+ `sala.ts` setAvatar se preciso)
**Depends on**: T2
**Reuses**: padrão outcome de hello.ts:23

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] hello com avatar válido persiste no Player e aparece no toState
- [x] hello com avatar acima do teto aceita o join com avatar ignorado (iniciais)
- [x] reconnect reidrata avatar junto com assento/voto
- [x] Gate check passes: `bun --filter server test`
- [x] Test count: ≥4 tests pass (persist, teto ignorado, reconnect, sem avatar)

**Status**: ✅ Complete (T3)

**Tests**: unit
**Gate**: quick

---

### T4: update_avatar handler + dispatch WS

**What**: Criar handler update_avatar com broadcast room_state e case no WSService dispatch
**Where**: `apps/server/src/handlers/update-avatar.ts`, `apps/server/src/ws.ts`
**Depends on**: T3
**Reuses**: padrão handlers de voto + broadcastRoomState de ws.ts:495

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] update_avatar válido atualiza Player e broadcast room_state com novo avatar
- [x] avatar null limpa e volta a iniciais no snapshot
- [x] sem playerId retorna invalid_phase sem broadcast
- [x] Gate check passes: `bun --filter server test`
- [x] Test count: ≥4 tests pass (set, clear, sem auth, teto)

**Status**: ✅ Complete (T4)

**Tests**: unit
**Gate**: quick

---

### T5: lib/avatar normalize + storage

**What**: Criar normalizeAvatar (canvas 128x128 JPEG q0.8, crop central, valida tipo/5MB) + load/save/clear em localStorage
**Where**: `apps/web/src/lib/avatar.ts`
**Depends on**: T2
**Reuses**: `lib/storage.ts` safeGet/safeSet

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] png/jpeg/webp normaliza para dataURL jpeg 128px
- [x] formato inválido e >5MB rejeitam com erro tipado sem throw cru
- [x] save/load/clear usam chave pointly-avatar com fallback em memória
- [x] Gate check passes: `bun --filter pointly-web test`
- [x] Test count: ≥6 tests pass (3 formatos, inválido, tamanho, storage roundtrip)

**Status**: ✅ Complete (T5)

**Tests**: unit
**Gate**: quick

---

### T6: protocol mirror + ws-client avatar

**What**: Espelhar avatar em TablePlayer/HelloPayload e enviar no connect + novo updateAvatar
**Where**: `apps/web/src/lib/protocol.ts`, `apps/web/src/lib/ws-client.ts`
**Depends on**: T5
**Reuses**: padrão connect/hello de ws-client.ts:161

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] TablePlayer e HelloPayload incluem avatar opcional
- [x] connect envia avatar no hello quando presente
- [x] updateAvatar envia evento tipado e trata erro sem crash
- [x] Gate check passes: `bun --filter pointly-web test`
- [x] Test count: ≥4 tests pass (hello com/sem avatar, update set/clear)

**Status**: ✅ Complete (T6)

**Tests**: unit
**Gate**: quick

---

### T7: AvatarPicker component

**What**: Criar picker com input file escondido, preview circular, remover, erro inline e microcopy, em coss
**Where**: `apps/web/src/components/avatar-picker.tsx`
**Depends on**: T5
**Reuses**: coss Button/Field de `components/ui/*`, `lib/avatar.ts`

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Selecionar arquivo válido mostra preview circular imediato
- [x] Formato inválido/grande mostra erro inline sem quebrar
- [x] Remover limpa e volta a iniciais; microcopy "Visível para todos na sala" presente
- [x] Gate check passes: `bun --filter pointly-web test`
- [x] Test count: ≥5 tests pass (preview, erro formato, erro tamanho, remover, microcopy)

**Status**: ✅ Complete (T7)

**Tests**: unit
**Gate**: quick

---

### T8: PokerTable img + fallback

**What**: Renderizar img cover no círculo quando há avatar, com onError para iniciais, mesma âncora
**Where**: `apps/web/src/components/poker-table.tsx`, `apps/web/src/components/poker-table.css`
**Depends on**: T6, T7
**Reuses**: classes .poker-avatar e data-projectile-player existentes

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Com avatar renderiza img object-fit cover 44px no lugar das iniciais
- [x] Sem avatar ou com erro de load exibe iniciais
- [x] Layout/âncora de projéteis inalterados
- [x] Gate check passes: `bun --filter pointly-web test`
- [x] Test count: ≥4 tests pass (com avatar, sem avatar, onError, âncora)

**Status**: ✅ Complete (T8)

**Tests**: unit
**Gate**: quick

---

### T9: Join + Arena wiring + espectadores

**What**: Ligar picker no join e na arena (Você é), propagar via hello/update_avatar, exibir avatar na lista de espectadores
**Where**: `apps/web/src/pages/join.tsx`, `apps/web/src/pages/arena.tsx`
**Depends on**: T8
**Reuses**: fluxo saveNickDraft/saveSession e FakeSocket de arena.test.tsx

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Join com avatar envia no hello e persiste; erro de arquivo não bloqueia join
- [ ] Arena troca via update_avatar sem reload; remover volta a iniciais nos clients
- [ ] Espectador com avatar aparece na lista; sem avatar mostra iniciais
- [ ] Gate check passes: `bun --filter pointly-web test`
- [ ] Test count: ≥5 tests pass (join hello, arena update, remover, espectador com/sem)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(avatar): wire picker no join e arena com espectadores`

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4

Phase 1:  T1 ------→ T2
Phase 2:  T3 ------→ T4
Phase 3:  T5 ------→ T6
Phase 4:  T7 ------→ T8 ------→ T9
```

```text
T1 -> T2 -> T3 -> T4
T2 -> T5 -> T6
T5 -> T7 -> T8 -> T9
T6 -> T8
```

Execution is strictly sequential - there is no intra-phase parallelism. A single agent (or batch worker) works one task at a time, in order.

**How phase-based execution works:**

At Execute, the agent counts total tasks and packs phases into **task-budgeted batches** (~7 tasks
per worker, whole phases - the benchmarked sweet spot is ~20 tasks → ~3 workers). A **phase** is the
semantic/dependency unit; a **batch** is one or more *consecutive whole phases* assigned to one
worker. The cut only ever lands on a phase boundary - a phase is never split across workers.

When the whole feature fits a single batch (≤ ~8 tasks), execution happens inline in the main window
with no sub-agents spawned.

**The orchestrating agent's role during Execute:**
1. Count total tasks and pack phases into ~7-task batches - offer batch sub-agents if that yields more than one batch and the user accepts
2. Dispatch the next batch (to a worker, or execute inline)
3. Receive the compact batch summary
4. Update tasks.md with results
5. If the batch summary shows all tasks complete: proceed to the next batch
6. If a task failed: decide fix/escalate before dispatching the next batch

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1: AvatarSchema + Player | 1 schema + testes | ✅ Granular |
| T2: Hello + update schemas | 1 arquivo events | ✅ Granular |
| T3: hello handler avatar | 1 handler | ✅ Granular |
| T4: update handler + dispatch | 1 handler + 1 dispatch | ✅ Granular |
| T5: lib/avatar | 1 lib + testes | ✅ Granular |
| T6: protocol + ws-client | 1 camada wire client | ✅ Granular |
| T7: AvatarPicker | 1 componente | ✅ Granular |
| T8: PokerTable img | 1 componente + css | ✅ Granular |
| T9: Join + Arena wiring | 2 páginas coesas (join+arena) | ✅ Granular |

**Granularity check**:

- ✅ 1 component / 1 function / 1 endpoint = Good
- ⚠️ 2-3 related things in same file = OK if cohesive
- ❌ Multiple components or files = MUST split

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | raiz Phase 1 | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2 | T2 → T3 (cross-phase map) | ✅ Match |
| T4 | T3 | T3 → T4 | ✅ Match |
| T5 | T2 | T2 → T5 (cross-phase map) | ✅ Match |
| T6 | T5 | T5 → T6 | ✅ Match |
| T7 | T5 | T5 → T7 (cross-phase map) | ✅ Match |
| T8 | T6, T7 | T7 → T8 + T6 → T8 (cross-phase map) | ✅ Match |
| T9 | T8 | T8 → T9 | ✅ Match |

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1: schemas sala | Shared schemas | unit | unit | ✅ OK |
| T2: schemas events | Shared schemas | unit | unit | ✅ OK |
| T3: handler hello | Server handlers | unit | unit | ✅ OK |
| T4: handler update + ws | Server handlers | unit | unit | ✅ OK |
| T5: lib/avatar | Web lib | unit | unit | ✅ OK |
| T6: protocol + ws-client | Web lib | unit | unit | ✅ OK |
| T7: AvatarPicker | Web components | unit | unit | ✅ OK |
| T8: PokerTable | Web components | unit | unit | ✅ OK |
| T9: Join + Arena | Web components/pages | unit | unit | ✅ OK |

---

## Tips

- **Phases are ordered** - Each phase completes before the next; tasks run in order within a phase
- **Reuses = Token saver** - Always reference existing code
- **Tools per task** - MCPs and Skills prevent wrong approaches
- **Dependencies are gates** - Clear what blocks what
- **Done when = Testable** - If you can't verify it, rewrite it
- **Requirement ID = Traceable** - Every task traces back to a spec requirement
- **One commit per task** - Plan the commit message format in advance
