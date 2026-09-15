# avatar-perfil-mesa Validation

**Date**: 2026-09-15
**Spec**: `.specs/features/avatar-perfil-mesa/spec.md`
**Diff range**: `496b17d..653cf08` (docs `c63495d` + 9 feats `0a83642..a8b98a6` + 4 test fixes `62e1da2, 8aafcca, 05edb01, 653cf08`)
**Verifier**: independent (author ≠ verifier), re-verificação 2/3

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1 AvatarSchema + Player.avatar | ✅ Done | `packages/shared/src/schemas/avatar.test.ts` |
| T2 Hello + update_avatar schemas | ✅ Done | `packages/shared/src/schemas/events.test.ts` avatar blocks |
| T3 Server hello avatar + persist | ✅ Done | `apps/server/src/handlers/hello.test.ts` avatar block (5) |
| T4 update_avatar handler + dispatch | ✅ Done | `apps/server/src/handlers/update-avatar.test.ts` (8) |
| T5 lib/avatar normalize + storage | ✅ Done | `apps/web/src/lib/avatar.test.ts` (13) |
| T6 protocol mirror + ws-client | ✅ Done | `lib/protocol.test.ts` + `lib/ws-client.test.ts` avatar tests |
| T7 AvatarPicker | ✅ Done | `components/avatar-picker.test.tsx` (9) |
| T8 PokerTable img + fallback | ✅ Done | `components/poker-table.test.tsx` (5) |
| T9 Join + Arena wiring + espectadores | ✅ Done | `pages/join.test.tsx` (2) + `pages/arena.test.tsx` (5 avatar) |
| FIX-1 (62e1da2) ancora 128/q0.8/crop | ✅ Done | test-only, `avatar.test.ts` captura canvas |
| FIX-2 (8aafcca) fallback erro espectador | ✅ Done | test-only, `arena.test.tsx` onError lista |
| FIX-3 (05edb01) nicks duplicados | ✅ Done | test-only, `update-avatar.test.ts` edge E2 |
| FIX-4 (653cf08) busy precisado + teste | ✅ Done | spec P2-AC4 precisada + `avatar-picker.test.tsx` promise diferida |

---

## Spec-Anchored Acceptance Criteria

### P1: Trocar avatar no join e ver na mesa

| Criterion (WHEN X THEN Y) | Spec-defined outcome | `file:line` + assertion | Result |
| ------------------------- | -------------------- | ----------------------- | ------ |
| P1-AC1: seleciona png/jpeg/webp ≤5MB THEN normaliza 128x128 JPEG q0.8 + crop central + preview circular | dataURL `image/jpeg`, canvas 128/128, `toDataURL("image/jpeg",0.8)`, crop 200x100→sx50/sy0/side100→dst 0,0,128,128, preview imediato | `apps/web/src/lib/avatar.test.ts:88` — `expect(cap.width).toBe(128)` (`:92`), `expect(cap.height).toBe(128)` (`:93`), `expect(cap.toDataURLArgs).toEqual(["image/jpeg", 0.8])` (`:94`), `expect(sx).toBe(50)` (`:97`), `expect(sy).toBe(0)` (`:98`), `expect(sideW).toBe(100)` (`:99`), `expect([dx,dy,dw,dh]).toEqual([0,0,128,128])` (`:101`); prod `apps/web/src/lib/avatar.ts:121` `canvas.width = AVATAR_SIZE_PX`, `:122` height, `:139` `toDataURL("image/jpeg", 0.8)`; preview `apps/web/src/components/avatar-picker.test.tsx:34` `expect(img.getAttribute("src")).toBe(AVATAR)` (`:37`) | ✅ PASS — FIX-1 fecha o GAP; MUT4 re-injetado morre |
| P1-AC2: entra com avatar THEN envia no hello + persiste localStorage | hello carrega `avatar`, chave `pointly-avatar` roundtrips | `apps/web/src/pages/join.test.tsx:270` — `:285` localStorage startsWith jpeg + `:303` `expect(hello.payload.avatar?.startsWith("data:image/jpeg;base64,")).toBe(true)`; `apps/web/src/lib/avatar.test.ts:141` roundtrip + `:145` chave `pointly-avatar` | ✅ PASS |
| P1-AC3: sentado com avatar válido THEN renderiza img cover 44px, sem iniciais | `<img src=avatar>` no círculo 44px, object-fit cover | `apps/web/src/components/poker-table.test.tsx:24` — `:36` `expect(img.getAttribute("src")).toBe(AVATAR)` + `:37` classe `poker-avatar-img` + `:38` sem iniciais; CSS `apps/web/src/components/poker-table.css:63` 44px + `:78` `object-fit: cover` | ✅ PASS |
| P1-AC4: formato inválido ou >5MB THEN recusa com erro inline, join segue | erro tipado + mensagem inline + onChange não chamado + join completa sem avatar | `apps/web/src/lib/avatar.test.ts:104` `invalid_type` (`:108`) + `:113` `too_large` (`:119`); `avatar-picker.test.tsx:109` erro `/png, jpeg ou webp/i` (`:121`) + `:123` `seen` vazio; `:126` erro `/5MB/` (`:140`) + `:142` vazio + `:144` preview anterior; `pages/join.test.tsx:308` erro visível (`:320`) + `:333` `"avatar" in hello.payload` false + ARENA (`:328`) | ✅ PASS |
| P1-AC5: avatar >~40KB pós-normalização THEN zod recusa sem derrubar hello, iniciais | schema rejeita; handler aceita join com campo ignorado | `packages/shared/src/schemas/events.test.ts:460` — `:463` `expect(r.success).toBe(false)` (hello teto); `apps/server/src/handlers/hello.test.ts:349` — `:356` `expect(result.ok).toBe(true)` + `:359` `expect(player?.avatar).toBeUndefined()` | ✅ PASS |
| P1-AC6: mantém posicionamento, tamanho e âncora data-projectile-player | mesma classe/âncora com avatar | `apps/web/src/components/poker-table.test.tsx:80` — `:88` `data-projectile-player="p_beto"` + `:92` img src | ✅ PASS |

### P2: Trocar ou remover avatar dentro da sala

| Criterion (WHEN X THEN Y) | Spec-defined outcome | `file:line` + assertion | Result |
| ------------------------- | -------------------- | ----------------------- | ------ |
| P2-AC1: troca na arena THEN update_avatar + broadcast room_state com novo avatar | `room_state` broadcastado contém o novo avatar (valor) | `apps/server/src/handlers/update-avatar.test.ts:170` — `:186` filtra `room_state`, `:188` `expect(...avatar).toBe(JPEG)` (valor); client `apps/web/src/pages/arena.test.tsx:1725` `sentAvatars` + `:1741` prefixo jpeg; dispatch `apps/server/src/ws.ts:259` + `:287` broadcast | ✅ PASS |
| P2-AC2: remove THEN avatar null + limpa localStorage + iniciais em toda sala | snapshot null, storage null, assento volta a iniciais | `update-avatar.test.ts:53` — `:63` `expect(avatar ?? null).toBeNull()`; `arena.test.tsx:1752` — `:1766` `sentAvatars [null]` + `:1767` localStorage null + `:1774` seat `/BE/` após broadcast | ✅ PASS |
| P2-AC3: imagem falha ao carregar THEN iniciais automaticamente | onError → iniciais, sem círculo vazio | `poker-table.test.tsx:65` — `:73` `fireEvent.error(...)` + `:74` img null + `:75` iniciais | ✅ PASS |
| P2-AC4: WHILE processando THEN preview anterior visível + controles desabilitados até concluir, sem congelar | spec precisada em `spec.md:82`; busy: preview anterior + input/botões disabled + onChange só após concluir | `apps/web/src/components/avatar-picker.test.tsx:66` — `:90` botão Trocar `disabled` true (busy) + `:96` preview `src` == AVATAR + `:101` `seen` vazio + `:105` `seen` 1 após resolve (sem freeze); impl `apps/web/src/components/avatar-picker.tsx:36` `busy`, `:83` input `disabled={busy}`, `:93` botão `disabled={busy}`, `:104` remover `disabled={busy}` | ✅ PASS — FIX-4: spec testável + promise diferida cobre busy; MUT-A (disabled→false) morre |

### P3: Espectador e consistência visual

| Criterion (WHEN X THEN Y) | Spec-defined outcome | `file:line` + assertion | Result |
| ------------------------- | -------------------- | ----------------------- | ------ |
| P3-AC1: espectador com avatar THEN exibe na lista com mesmo fallback de erro da mesa | img na lista + onError→iniciais | `arena.test.tsx:1777` — `:1800` `expect(img?.getAttribute("src")).toBe("data:image/jpeg;base64,AAA")`; fallback `:1804` — `:1826` `fireEvent.error(img.arena-spectator-avatar)` + `:1827` img null + `:1828` `/OL/`; impl `apps/web/src/pages/arena.tsx:150` `SpectatorAvatar` + `:159` `onError` | ✅ PASS — FIX-2 fecha o GAP |
| P3-AC2: WHILE sem avatar THEN iniciais no círculo e na lista | iniciais nos dois lugares | `poker-table.test.tsx:41` iniciais círculo (`:46`); `arena.test.tsx:1831` — `:1847` sem img + `:1848` `/OL/` | ✅ PASS |
| P3-AC3: microcopy "Visível para todos na sala" junto ao picker | texto exato presente | `avatar-picker.test.tsx:165` — `getByText("Visível para todos na sala")`; impl `avatar-picker.tsx:113` | ✅ PASS |

**Status**: ✅ All ACs covered (13/13 + 4 edges)

---

## Edge Cases

- [x] localStorage indisponível/cheio → fallback memória, iniciais, join ok — `apps/web/src/lib/avatar.test.ts:160` `saveAvatar`+`loadAvatar` MEM com storage quebrado (`:171`)
- [x] Mesmo Apelido → avatar por Player id sem misturar — `apps/server/src/handlers/update-avatar.test.ts:92` dois joins nick "Beto" ids distintos (`:103`), `setAvatar` em um (`:105`), outro sem avatar (`:109`), `toState` por id (`:111` JPEG / `:114` null) — FIX-3
- [x] Reconnect mesmo UUID → reidrata avatar + assento + voto — `hello.test.ts:382` `:401` avatar + `:402` seat + `:403` value
- [x] hello com avatar acima do teto → ignora só o campo, join ok — `hello.test.ts:349` ok + `:359` avatar undefined (+ formato inválido `:362`)

---

## Discrimination Sensor

Scratch: `git worktree` temporário em `/tmp/avatar-sensor-2` (symlink só de `node_modules`), mutações revertidas uma a uma, worktree removido ao final. Baseline real `git status --porcelain` = 4 untracked (`.playwright-mcp/`, `LESSONS.md`, `validation.md`, `lessons.json`) antes e depois ✅. Nenhum `stash`; real nunca mutado.

| Mutation | File:line (scratch) | Description | Killed? |
| -------- | ------------------- | ----------- | ------- |
| R-MUT4 | `apps/web/src/lib/avatar.ts:121,139` | Re-injeção: 128px→64px + `toDataURL("image/jpeg",0.8)`→`("image/png")` | ✅ Killed — `avatar.test.ts:92` 1 fail (`Expected 128 Received 64`), 11 pass/1 fail |
| MUT-A | `apps/web/src/components/avatar-picker.tsx:83,93,104` | `disabled={busy}`→`disabled={false}` (remove disabled no busy) | ✅ Killed — `avatar-picker.test.tsx:66` busy 1 fail (timeout waitFor disabled), 8 pass/1 fail |
| MUT-B | `apps/web/src/components/avatar-picker.tsx:56` | Remove `onChange(null)` no remover (sem clear) | ✅ Killed — `avatar-picker.test.tsx:151` 1 fail (`Expected [null] Received []`), 8 pass/1 fail |
| MUT-C | `packages/shared/src/schemas/sala.ts:65` | Teto `.max(40000)`→`.max(4000000)` | ✅ Killed — 4 fail (AvatarSchema/PlayerSchema teto + hello teto + update teto), 61 pass/4 fail |

**Sensor depth**: lightweight reforçado (4 behavior-level mutations: normalização, busy, remover, teto)
**Result**: 4/4 killed — sensor PASS

---

## Interactive UAT Results

Não realizado (verificação automatizada suficiente para esta feature; UAT visual da mesa pode ser feita pelo orquestrador se desejado).

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ✅ — handlers, schema, lib e componentes pequenos e coesos |
| Surgical changes | ✅ — produção intacta nos 4 fixes (só testes + 1 linha spec P2-AC4) |
| No scope creep | ✅ — sem presets, sem S3, sem rota /profile (out-of-scope respeitado) |
| Matches patterns | ✅ — outcome `{ok, code}`, coss Field/Button, bun test |
| Spec-anchored outcome check | ✅ — P1-AC1 ancora 128/q0.8/crop; P2-AC4 precisada e ancorada |
| Per-layer Coverage Expectation met | ✅ — schemas/handlers/lib/components/pages com happy+edge+error |
| Every test maps to a spec requirement | ✅ — sem testes órfãos detectados |
| Documented guidelines followed | ✅ — `AGENTS.md` (coss reuse: Button/Field) |

---

## Gate Check

- **Gate command (Full)**: `bun --filter @planning-poker/shared test && bun --filter server test && bun --filter pointly-web test`
- **Result**: 487 passed, 0 failed, 0 skipped
  - shared: 134 pass / 0 fail (6 files)
  - server: 186 pass / 0 fail (16 files, +1 FIX-3)
  - web: 167 pass / 0 fail (13 files, +3 FIX-1/FIX-2/FIX-4)
- **Build**: `typecheck` nos 3 pacotes — exit 0 nos 3 (`pointly-web typecheck`, `tsc --noEmit -p packages/shared`, `tsc --noEmit -p apps/server`)
- **Test count**: só adições nos 4 fixes (nenhum teste deletado; asserts só fortalecidos)
- **Skipped tests**: nenhum
- **Failures**: nenhum

---

## Fix Plans

Nenhum — FIX-1..FIX-4 da verificação anterior estão aplicados e verificados (sensor 4/4). Sem novos gaps.

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| AV-01 | ❌ Needs Fix (FIX-1) | ✅ Verified |
| AV-02 | ✅ Verified | ✅ Verified |
| AV-03 | ✅ Verified | ✅ Verified |
| AV-04 | ✅ Verified | ✅ Verified |
| AV-05 | ✅ Verified | ✅ Verified |
| AV-06 | ✅ Verified | ✅ Verified |
| AV-07 | ✅ Verified | ✅ Verified |
| AV-08 | ❌ Needs Fix (FIX-2) | ✅ Verified |

---

## Summary

**Overall**: ✅ Ready (todos os ACs ancorados, sensor 4/4, gate 487/0)

**Spec-anchored check**: 13/13 ACs + 4/4 edges com `file:line` — P1-AC1 ancora 128/128 + jpeg/q0.8 + crop (`avatar.test.ts:88`); P2-AC4 precisada testável e coberta (`avatar-picker.test.tsx:66`); fallback espectador coberto (`arena.test.tsx:1804`); nicks duplicados bound por id (`update-avatar.test.ts:92`)
**Sensor**: 4/4 killed (R-MUT4 + MUT-A/B/C)
**Gate**: 487 passed, 0 failed + 3 typechecks exit 0

**What works**: upload→preview→hello→persist→render; teto 40KB sem derrubar join; update_avatar + broadcast com valor; remover→null→iniciais; onError na mesa e na lista; reconnect com avatar; microcopy; localStorage fallback; nicks duplicados isolados por id; busy com preview anterior + controles desabilitados.

**Issues found**: nenhum.

**Next steps**: pronto para merge (não commitar por instrução do Verifier); `validate_state.py avatar-perfil-mesa` deve sair 0.
