# Planning Poker v1 — Pointly (Functional)

> Status: **PRD v2 — sistema funcional** · Última atualização: 2026-07-04
> Supersedes o PRD wireframe (v1-wireframe). HTMLs em `/*.html` viraram **reference** (visual + feature spec).
> Architecture: [ADR 0005](../../docs/adr/0005-v1-functional-in-memory-state.md) + stack ADRs [0006](../../docs/adr/0006-bun-hono-websocket-backend.md) – [0010](../../docs/adr/0010-ui-primitives-and-testing.md).
> Glossary: [CONTEXT.md](../../CONTEXT.md). Brief narrativo: [plan.md](../../plan.md).

## Problem Statement

Times ágeis (3–12 pessoas) precisam estimar trabalho de forma síncrona em calls de planning. Ferramentas atuais (PlanITpoker, Scrum Poker, Parabol) exigem cadastro, planos pagos ou curvas de aprendizado que atrasam a conversa. Pointly v1 entrega um sistema funcional web: backend com WebSocket, frontend React, sala como objeto no `Map<codigo, Sala>` do processo do servidor. Sem cadastro, sem email, sem plano pago, sem bots. Salas reais entre jogadores reais, com voto síncrono, reveal coletivo, reconnect por UUID.

## Goals

- [ ] Time roda uma rodada completa (criar sala → apelido → votar → revelar) em < 60s, com sync de voto < 200ms
- [ ] Zero cadastro, zero email, zero plano pago
- [ ] Até 12 jogadores por sala, rejeição server-side com `error { code: 'sala_cheia' }`
- [ ] Votação 100% síncrona (server é source of truth pra fase, timer, votes)
- [ ] Reconnect por UUID enquanto servidor vive (sem recovery entre restarts, vide [ADR 0009](../../docs/adr/0009-reconnect-uuid-strategy.md))
- [ ] Visual do React app bate com HTML reference (anatomia da mesa, cores Atelier Zero, tipografia)
- [ ] Paleta restrita a tokens Atelier Zero; coral ≤1 CTA por viewport

## Out of Scope

| Item | Razão |
|------|-------|
| Mobile/tablet (responsivo) | v1 é desktop 1440px |
| Story context na Arena | backlog/integrações fora de escopo |
| ActionBar dedicada | só RevealButton → NewRoundButton |
| Skip/Discall buttons | não na spec original |
| Spectator UI | papel existe no domínio, não na UI |
| Backlog, analytics, histórico | spec exclui |
| Integração Jira/Linear | não na spec original |
| Permissões granulares | só host + player |
| Pagamento, plano pago | "grátis, sempre" |
| Avatar configurável | só inicial do nome no círculo |
| Toasts individuais por jogador | consolidado em "Mais N escolheram" para reduzir ruído |
| Audit log / who-voted-what persistence | v1 não persiste (in-memory only) |
| Reconnect entre restarts do servidor | sala some do Map; cliente recebe `sala_ended` |
| Multi-instance scaling | `Map` em processo não compartilha entre réplicas |
| Imagens colagem geradas | placeholder first-pass; promover a `gpt-image-2` depois |

---

## Architecture

| Camada | Stack | ADR |
|--------|-------|-----|
| Runtime | Bun | [0006](../../docs/adr/0006-bun-hono-websocket-backend.md) |
| HTTP framework | Hono | [0006](../../docs/adr/0006-bun-hono-websocket-backend.md) |
| WebSocket | `Bun.serve()` nativo | [0006](../../docs/adr/0006-bun-hono-websocket-backend.md) |
| Server state | `Map<codigo, Sala>` em processo | [0005](../../docs/adr/0005-v1-functional-in-memory-state.md) |
| Frontend framework | React 18 + Vite + TypeScript | [0007](../../docs/adr/0007-react-vite-typescript-frontend.md) |
| Client state | Zustand | [0008](../../docs/adr/0008-zustand-zod-shared-schemas.md) |
| Shared schemas | Zod em `packages/shared` | [0008](../../docs/adr/0008-zustand-zod-shared-schemas.md) |
| Reconnect | UUID client-side, sala reidrata | [0009](../../docs/adr/0009-reconnect-uuid-strategy.md) |
| UI primitives | Tailwind + shadcn/ui | [0010](../../docs/adr/0010-ui-primitives-and-testing.md) |
| Testing | Vitest (service) + Playwright (E2E) | [0010](../../docs/adr/0010-ui-primitives-and-testing.md) |

**Monorepo layout** (per AGENTS.md):

```
planning-poker/
├── apps/
│   ├── web/          # React 18 + Vite + TS (port 5173)
│   └── server/       # Bun + Hono + Bun.serve (port 3001)
├── packages/
│   └── shared/       # Zod schemas + TS types + computeConsensus pure
├── tests/
│   └── e2e/          # Playwright multi-client
├── *.html            # Visual reference (legacy wireframe, NÃO runtime)
└── docs/adr/         # Architecture Decision Records
```

Vite proxy em dev: `/ws` e `/api` → `localhost:3001`.

---

## WebSocket Protocol

**Connection lifecycle:**

1. Client abre WS em `ws://server/ws`
2. Envia `hello { uuid, nick, code? }` (uuid é client-generated via `crypto.randomUUID()`, persistente em `localStorage`)
3. Server valida com Zod schema, responde `welcome { playerId, role, sala }` (ou rejeita com `error`)
4. Se código não existe, server cria sala; senão adiciona player à sala existente
5. Heartbeat: client envia `ping` a cada 30s, server responde `pong`

**Client → Server events:**

| Event | Payload | Quem pode |
|-------|---------|-----------|
| `hello` | `{ uuid, nick, code? }` | Todos (1x por conexão) |
| `cast_vote` | `{ value }` | Player na sala em `voting` |
| `reveal_votes` | `{ }` | Host na sala em `voting` com `phase: 'revealable'` |
| `start_new_round` | `{ }` | Host na sala em `revealed` |
| `leave_room` | `{ }` | Player ou Host |
| `ping` | `{ }` | Todos (heartbeat) |

**Server → Client events:**

| Event | Payload | Quando |
|-------|---------|--------|
| `welcome` | `{ playerId, role, sala }` | Após `hello` válido |
| `room_state` | `{ sala: FullState }` | Sync completo após qualquer mudança |
| `player_joined` | `{ player }` | Outro player entrou |
| `player_left` | `{ playerId }` | Outro player saiu |
| `vote_cast` | `{ playerId, hasVoted: true }` | Alguém votou (valor NÃO exposto pré-reveal) |
| `votes_revealed` | `{ votes, median, mean, range, unanimous }` | Qualquer player clicou reveal ou timer expirou |
| `round_started` | `{ round }` | Host clicou nova rodada |
| `sala_ended` | `{ reason }` | Último player saiu ou servidor vai reiniciar |
| `error` | `{ code, message }` | Erro de validação, sala cheia, role negada |
| `pong` | `{ }` | Resposta a ping |

**Reconnect** (vide [ADR 0009](../../docs/adr/0009-reconnect-uuid-strategy.md)):

- Client reconecta com mesmo UUID (persistido em localStorage)
- Server reidrata player na sala (mantém voto já feito, posição na mesa)
- Se sala não existe mais (servidor reiniciou), server responde `sala_ended { reason: 'server_restart' }`

**Zod schemas** (em `packages/shared`): `HelloPayload`, `CastVotePayload`, `RevealVotesPayload`, `StartNewRoundPayload`, `WelcomeResponse`, `RoomStateResponse`, `PlayerJoinedEvent`, `VoteCastEvent`, `VotesRevealedEvent`, `RoundStartedEvent`, `SalaEndedEvent`, `ErrorEvent`. Tipos TS via `z.infer<typeof X>`.

---

## User Stories

### P1: US-1 — Entrar na sala com apelido ⭐ MVP

**User Story**: Como jogador, quero entrar na sala informando só meu apelido para que eu possa votar sem cadastro, email ou qualquer fricção.

**Acceptance Criteria**:

1. WHEN o cliente abre a página THEN SHALL conectar no WS e enviar `hello { uuid, nick, code? }`
2. WHEN o server recebe `hello` com nick < 2 chars THEN SHALL responder `error { code: 'invalid_nick', message: 'Mínimo 2 caracteres.' }`
3. WHEN o server recebe `hello` com nick > 20 chars THEN SHALL truncar pra 20 e responder `error` se > 20 antes do truncate
4. WHEN o server recebe `hello` com nick contendo espaços duplos THEN SHALL responder `error { code: 'invalid_nick', message: 'Sem espaços duplos.' }`
5. WHEN o server recebe `hello` válido com `code` THEN SHALL validar que sala existe e tem < 12 jogadores; se inválido responde `error { code: 'sala_nao_encontrada' }` ou `error { code: 'sala_cheia' }`
6. WHEN server aceita THEN SHALL responder `welcome { playerId, role, sala }` com `role: 'host'` se foi criador, `role: 'player'` caso contrário
7. WHEN cliente recebe `error { code: 'sala_cheia' }` THEN SHALL redirecionar para `full.html`

**Independent Test**: 2 browsers A e B. Browser A cria sala via landing → code gerado. Browser B entra em `join.html?code=XXXX` com nick "Test" → vê assento na mesa real (não mock). Sala cheia: 3º browser entra com mesmo code → redireciona para `full.html`.

---

### P1: US-2 — Votar em uma rodada ⭐ MVP

**User Story**: Como jogador, quero escolher uma carta do deck Fibonacci para registrar minha estimativa.

**Acceptance Criteria**:

1. WHEN jogador entra na sala THEN SHALL receber deck 9 cartas (`0, ½, 1, 2, 3, 5, 8, 13, ☕`) via `room_state` com numeral em Playfair Italic
2. WHEN jogador clica numa carta THEN client SHALL enviar `cast_vote { value }` ao server
3. WHEN server recebe `cast_vote` THEN SHALL broadcast `vote_cast { playerId, hasVoted: true }` pra todos os outros (sem expor valor)
4. WHEN primeiro voto da rodada entra THEN server SHALL mudar `phase` para `voting`, iniciar timer de 60s e broadcast `room_state`
5. WHEN timer ≤ 30s THEN server SHALL marcar `critical: true` no `room_state` broadcast
6. WHEN jogador clica em outra carta (já tendo votado) THEN client SHALL enviar `cast_vote` novamente (server atualiza in-place, broadcast `vote_cast` mas sem valor)
7. WHEN jogador tenta votar após reveal THEN server SHALL responder `error { code: 'invalid_phase' }`
8. WHEN primeiro voto real entra THEN server SHALL emitir `vote_cast` com nome do jogador; votos seguintes SHALL ser consolidados em `vote_cast { count: N }` (toast "Mais N escolheram")

**Independent Test**: Browser A vota 5 → em < 200ms browser B vê seat de A mudar para "VOTED" (sem valor). Browser A troca voto para 8 → B vê atualização em < 200ms.

---

### P1: US-3 — Revelar votos (qualquer player) ⭐ MVP

**User Story**: Como qualquer player, quero revelar os votos coletivamente para que o time veja todas as estimativas simultaneamente e a mediana seja destacada. Reveal é democratizado — não precisa ser host.

**Acceptance Criteria**:

1. WHEN ≥1 player votou THEN qualquer player pode enviar `reveal_votes` (não precisa esperar todos)
2. WHEN qualquer player envia `reveal_votes` THEN server SHALL calcular mediana/média/intervalo (excluindo ☕), detectar unanimous (todos os votos não-nulos são iguais), mudar `phase` para `revealed`, broadcast `votes_revealed { votes, median, mean, range, unanimous }`
3. WHEN timer expira sem todos votarem THEN server SHALL auto-revelar, calcular stats, broadcast
4. WHEN cliente recebe `votes_revealed` THEN SHALL virar todos assentos face-up com valor + nome visíveis em full opacity
5. WHEN `unanimous: false` THEN cliente SHALL aplicar borda gold (mustard) 2px nos assentos com voto igual à mediana; WHEN `unanimous: true` THEN nenhum assento recebe gold border (em vez disso, stats pill mostra badge "UNANIMOUS")
6. WHEN VOCÊ votou a mediana THEN seu assento SHALL ter borda coral 2px (outer) + borda gold 2px (inner, aninhada via box-shadow inset)
7. WHEN reveal completa THEN cliente SHALL mostrar stats pill "MÉDIA X.X · MEDIANA Y · INTERVALO A–B" no canto superior esquerdo (com badge "UNANIMOUS" se aplicável)
8. WHEN reveal completa THEN cliente SHALL trocar botão central para ghost "Nova rodada" (disponível para qualquer player)
9. WHEN qualquer player envia `start_new_round` THEN server SHALL incrementar round, limpar votes, reset timer, broadcast `round_started { round }`

**Independent Test**: 2+ browsers votam → qualquer um revela → todos veem valores sincronizados em < 200ms. Mediana destacada gold em 1+ assento (a menos que unanimous). Stats pill aparece.

---

### P1: US-4 — Reconhecer minha posição na mesa ⭐ MVP

**User Story**: Como jogador, quero ver claramente qual assento é o meu para que eu me oriente na mesa mesmo após o reveal.

**Acceptance Criteria**:

1. WHEN jogador entra THEN server SHALL atribuir `seatIndex` baseado na posição disponível (default: primeiro assento livre em ordem)
2. WHEN cliente renderiza assento THEN SHALL aplicar borda coral 2px + badge "VOCÊ" no assento do próprio `playerId`
3. WHEN Host criou a sala THEN seu assento SHALL exibir ★ mostarda no canto superior direito
4. WHEN reveal acontece THEN borda coral do "VOCÊ" SHALL permanecer visível em full opacity (não esmaecer junto com avatar/nick)

**Independent Test**: Browser A e B entram. A vê "VOCÊ" no seu assento, vê B sem borda. B vê "VOCÊ" no seu, vê A sem borda. Sem sobreposição de "VOCÊ". Após reveal, ambos mantêm borda coral.

---

### P1: US-5 — Criar sala (host = criador) ⭐ MVP

**User Story**: Como time ágil, quero criar uma sala em < 5s a partir da landing para começar uma rodada imediatamente. **Host é só "criador da sala"** — não tem poder exclusivo de reveal/new_round (vide decisão de grilling 2026-07-04; ADR 0002).

**Acceptance Criteria**:

1. WHEN usuário acessa `landing.html` THEN SHALL exibir hero com CTA coral "Criar sala" e Trust Badge "0 cadastros · 4 chars no código"
2. WHEN clica "Criar sala" THEN SHALL redirecionar para `join.html?host=1` (input de nick)
3. WHEN user entra com nick válido via `hello` sem `code` THEN server SHALL criar sala com código 4-char alfanumérico, adicionar player como `host` (criador), responder `welcome { role: 'host' }`
4. WHEN host sai da sala THEN server SHALL promover o player com menor `joinedAt` (mais antigo) a `role: 'host'` e broadcast `room_state` atualizado
5. WHEN o último player sai THEN server SHALL remover a sala do `Map<codigo, Sala>` e broadcast `sala_ended { reason: 'last_left' }`
6. WHEN player é único na sala THEN SHALL ver overlay "Convide outros" com share URL copiável (`${origin}/join.html?code=${code}`)
7. Header da arena SHALL ter botão "Share" sempre visível, copia URL ao click (independente do estado da sala)

**Independent Test**: Browser A cria → code gerado em < 100ms. Browser B entra com code via `join.html`. A vê B entrar em < 200ms via `player_joined`. A sai → B vira host automaticamente.

---

## Edge Cases

| Cenário | Comportamento esperado |
|---------|------------------------|
| Apelido vazio | `error { code: 'invalid_nick' }`, client mostra inline |
| Apelido com emoji ou charset especial | Aceito (sem validação de charset no v1) |
| Apelido duplicado na sala | Aceito (playerId é o identificador real, não o nick) |
| Sala com 12/12 | `error { code: 'sala_cheia' }`, client redireciona para `full.html` |
| Código inexistente | `error { code: 'sala_nao_encontrada' }`, client mostra retry |
| Reload mid-rodada | Client reconecta com mesmo UUID; server reidrata player se sala ainda existe |
| Voto = ☕ | Excluído do cálculo de stats (média/mediana/intervalo) |
| Todos votam o mesmo valor | Mediana = esse valor; todos os 12 recebem gold border |
| Timer expira sem todos votarem | Server auto-revela, calcula stats com quem votou |
| Múltiplas abas com mesmo UUID | Server trata como reconnect — último tab assume controle do player |
| Network drop mid-voto | Client tenta reconnect com mesmo UUID; se sala ainda existe, voto é preservado |
| Server restart mid-rodada | Sala some do Map; clientes recebem `sala_ended { reason: 'server_restart' }` |
| Voto duplicado (race condition) | Server trata `cast_vote` como idempotente — último valor vence |
| Heartbeat timeout (60s sem ping) | Server desconecta player, libera assento; se for o último, sala some |
| Sala 0/1 (você é o único) | Overlay "Convide outros" com share URL |
| Sala vazia (você saiu, último) | `sala_ended { reason: 'last_left' }` broadcast |
| Voto unânime (todos não-nulos iguais) | Stats pill mostra badge "UNANIMOUS"; nenhum assento recebe gold border |
| Host sai com outros players | `Sala.promoteOldestPlayer()` move role para player com menor `joinedAt`; broadcast `room_state` |
| Host sai sendo o último | Sala é removida do `Map`; `sala_ended { reason: 'last_left' }` (não há ninguém pra promover) |
| Player desconecta (dentro de grace 60s) | Assento mostra opacity 0.4 + badge "DISCONNECTED"; voto preservado; após 60s, removido do `Map` |
| Player tenta un-vote (set value=null) | Server rejeita com `error { code: 'invalid_vote' }`; client mantém voto atual |

---

## Requirement Traceability

**Status legend:** ✓ Verified (passa em test) · ⏳ Pending (não implementado) · ✗ Blocked

| ID | Story | Componente | Status |
|----|-------|-----------|--------|
| F-001 | US-1 | server: validate nick 2-20 chars | ⏳ |
| F-002 | US-1 | server: validate no double spaces, no edge spaces | ⏳ |
| F-003 | US-1 | server: create sala on `hello` sem code | ⏳ |
| F-004 | US-1 | server: join sala on `hello` com code | ⏳ |
| F-005 | US-1 | server: reject sala cheia (12/12) | ⏳ |
| F-006 | US-1 | server: reject sala inexistente | ⏳ |
| F-007 | US-1 | client: redirect to full.html on sala_cheia | ⏳ |
| F-008 | US-1 | client: persistent UUID in localStorage | ⏳ |
| F-009 | US-2 | server: receive cast_vote, broadcast vote_cast (no value) | ⏳ |
| F-010 | US-2 | server: track hasVoted per player, hidden value pre-reveal | ⏳ |
| F-011 | US-2 | server: change_vote in-place (idempotente) | ⏳ |
| F-012 | US-2 | server: reject vote if phase != voting | ⏳ |
| F-013 | US-2 | server: timer 60s on first vote | ⏳ |
| F-014 | US-2 | server: critical state (≤30s) broadcast | ⏳ |
| F-015 | US-2 | server: auto-reveal on timer=0 | ⏳ |
| F-016 | US-2 | client: deck 9 cards, Playfair Italic numerals | ⏳ |
| F-017 | US-2 | client: card selection ring coral | ⏳ |
| F-018 | US-2 | client: deck disabled post-reveal | ⏳ |
| F-019 | US-3 | server: reveal_votes only by host, only if phase=revealable | ⏳ |
| F-020 | US-3 | server: compute median/mean/range, ☕ excluded | ⏳ |
| F-021 | US-3 | server: broadcast votes_revealed event | ⏳ |
| F-022 | US-3 | client: face-up animation, full opacity post-reveal | ⏳ |
| F-023 | US-3 | client: median highlight gold border | ⏳ |
| F-024 | US-3 | client: stats pill (média/mediana/intervalo) | ⏳ |
| F-025 | US-3 | server: start_new_round only by host | ⏳ |
| F-026 | US-3 | server: increment round, reset votes, reset timer | ⏳ |
| F-027 | US-4 | server: assign seatIndex (first free) | ⏳ |
| F-028 | US-4 | client: VOCÊ border coral 2px + badge | ⏳ |
| F-029 | US-4 | client: host star ★ mostarda | ⏳ |
| F-030 | US-4 | client: VOCÊ full opacity post-reveal | ⏳ |
| F-031 | US-5 | client: landing CTA "Criar sala" | ⏳ |
| F-032 | US-5 | client: share URL copy to clipboard | ⏳ |
| F-033 | US-5 | client: empty sala overlay "Convide outros" | ⏳ |
| F-034 | Negócio | server: heartbeat ping/pong 30s | ⏳ |
| F-035 | Negócio | server: timeout disconnect 60s sem ping | ⏳ |
| F-036 | Negócio | server: sala some do Map quando último sai | ⏳ |
| F-037 | Negócio | client: reconnect com mesmo UUID | ⏳ |
| F-038 | Negócio | client: reidrata após reconnect, voto preservado | ⏳ |
| F-039 | Negócio | server: graceful shutdown → broadcast sala_ended | ⏳ |
| F-040 | Negócio | shared: Zod schema para cada event payload | ⏳ |
| F-041 | Negócio | shared: tipos TS inferidos de Zod | ⏳ |
| F-042 | Test | vitest: state machine sala.test.ts | ⏳ |
| F-043 | Test | vitest: validators nick.test.ts | ⏳ |
| F-044 | Test | vitest: stats computeConsensus (mediana/média) | ⏳ |
| F-045 | Test | playwright: 2 clients criam + entram + votam + revelam | ⏳ |
| F-046 | Test | playwright: sala cheia (3 clients, 3º rejeitado) | ⏳ |
| F-047 | Test | playwright: reconnect com UUID preserva voto | ⏳ |
| F-048 | US-5 | server: `promoteOldestPlayer()` move role para player com menor `joinedAt` quando host sai | ⏳ |
| F-049 | US-3 | server: detecta unanimous; client renderiza badge "UNANIMOUS" no stats pill | ⏳ |
| F-050 | Negócio | client: seat com `status: 'disconnected'` mostra opacity 0.4 + badge "DISCONNECTED" durante grace 60s | ⏳ |
| F-051 | US-3 | server: `reveal_votes` aceita de qualquer player após ≥1 voto (sem role check) | ⏳ |
| F-052 | US-3 | server: `start_new_round` aceita de qualquer player (sem role check) | ⏳ |
| F-053 | US-5 | client: botão "Share" no header da arena, sempre visível, copia URL ao click | ⏳ |

**Coverage**: 53 requisitos, 53 mapeados, 0 não-mapeados ✓
**All pending** — implementação ainda não começou. Próximo passo: scaffold do monorepo (per AGENTS.md).

---

## Success Criteria

- [ ] 2 clients reais (sem bots) conseguem criar sala, votar, revelar em < 60s end-to-end via Playwright
- [ ] Latência de sync `cast_vote` → `vote_cast` no outro client < 200ms (LAN)
- [ ] Sala rejeita 13º jogador com `error { code: 'sala_cheia' }`
- [ ] Reconnect com UUID preserva voto já feito (se sala ainda existe)
- [ ] Server restart: clientes recebem `sala_ended { reason: 'server_restart' }` em < 5s
- [ ] `vitest` passa com 100% dos testes service-level (state machine, validators, computeConsensus)
- [ ] `playwright` passa com 5+ cenários E2E multi-client
- [ ] `packages/shared` exporta Zod schemas + tipos inferidos, usados em client e server
- [ ] Visual do React app bate com HTML reference (anatomia da mesa, cores, tipografia)
- [ ] `bun test` + `bun run typecheck` + `bun run lint` passam no CI

---

## Open Questions (deferidos)

- gpt-image-2 para placeholders de colagem (deferido pra v2)
- Avatar opcional via emoji/cor (deferido — v1 só inicial)
- Revenue: 100% grátis é permanente?
- Auto-discover de IP/porta para testes locais (vite proxy /api e /ws pro server)
- Sala com senha (auth simples por código já cobre; sem necessidade de senha no v1)
- Modo "silent spectator" (ver sem votar) — papel existe no domínio mas não na UI
