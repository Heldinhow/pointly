# Relatório de Testes UX/Design — Pointly

> Gerado em 2026-07-04 · Playwright 1.61.1 · Chromium · 1440×900

---

## Resumo

| Track | Testes | Passou | Falhou | Taxa |
|-------|--------|--------|--------|------|
| A — Smoke | 8 | 7 | 1 | 87% |
| B — Visual | 10 | 10 | 0 | 100% |
| C — Flows | 6 | 4 | 2 | 67% |
| D — Join | 8 | 8 | 0 | 100% |
| E — Arena | 7 | 6 | 1 | 86% |
| F — Responsive | 12 | 12 | 0 | 100% |
| G — A11y | 5 | 5 | 0 | 100% |
| **Total** | **56** | **52** | **3** | **93%** |

---

## Bugs encontrados

### P0 — Bloqueia funcionalidade

#### BUG-001: EmptyOverlay intercepta cliques — host sozinho NÃO consegue votar
- **Afeta:** C1, E5+E6+E8
- **Root cause:** `arena.tsx:294` — `onDismiss={() => {}}` não faz nada; o overlay com `role="dialog" aria-modal="true"` fica visível e `pointer-events: auto`, bloqueando todo clique no deck.
- **Reprodução:** Acessa `/arena?code=ABCD` sozinho → EmptyOverlay aparece → deck está por trás, não interagível.
- **Fix sugerido:** No `EmptyOverlay`, adicionar botão "Dismiss" que chama `onDismiss` de verdade, OU auto-dismiss quando há 1 player que é o host (sem "Convide outros" necessário pra host que está na sala).
- **Impacto:** Host que criou a sala sozinho e tenta votar antes de convidar alguém → trava completamente. Flow quebrado.

#### BUG-002: share URL usa `join.html` legado ao invés de `/join` SPA
- **Afeta:** C6
- **Root cause:** `empty-overlay.tsx` gera URL com `join.html?code=` (wireframe legado), mas o router usa `/join` (SPA).
- **Reprodução:** Empty overlay mostra `http://localhost:5173/join.html?code=XXXX` — 404 se copiado.
- **Fix sugerido:** Trocar `join.html` por `/join` no `EmptyOverlay`.

### P1 — Comportamento inesperado

#### BUG-003: `prefers-reduced-motion` não desabilita pulse dot
- **Afeta:** A6
- **Root cause:** Tailwind `animate-pulse` sem variante `motion-reduce:animate-none` não respeita `prefers-reduced-motion`.
- **Reprodução:** Browser com reduced-motion → pulse dot continua animando.
- **Fix sugerido:** Mudar `animate-pulse` para `motion-reduce:animate-none animate-pulse` no metadata strip.

#### BUG-004: Landing overflow horizontal em mobile (360/390px)
- **Afeta:** F (mobile-360, mobile-390)
- **Dados:** scrollWidth=529, innerWidth=360. Overflow = 169px extra.
- **Impacto:** Mesmo v1 sendo "desktop only", mobile mostra horizontal scroll — ruim pra usuários que abrem no celular.
- **Fix sugerido:** Adicionar `overflow-x-hidden` no body da Landing OU usar `w-full` + `max-w-full` nos containers com side-rails.

#### BUG-005: 2 CTAs coral na Landing (plan.md diz ≤1)
- **Afeta:** B6
- **Dados:** "Criar sala ↗" aparece 2x: hero CTA + ribbon CTA inferior.
- **Contrato:** plan.md seção 4 — "um coral CTA por viewport."
- **Fix sugerido:** Trocar ribbon CTA para `ghost-pill` ou `white` em vez de coral.

### P2 — Observação / melhoria

#### OBS-001: ☕ e numerais têm mesmo `font-style: normal` no deck
- **Afeta:** E12
- **Dados:** card5.fontStyle = "normal", coffee.fontStyle = "normal"
- **Nota:** Plan.md diz que numerais devem ser Playfair Italic, mas ambos estão em `normal`. Pode ser intencional (Playfair aplicado via classe Tailwind específica que não muda `font-style` CSS).

#### OBS-002: Roman numerais sec-rules: II. ausente (4/5 encontrados)
- **Afeta:** B10
- **Dados:** I, III, IV, V presentes. II não encontrado no textContent (pode estar renderizado mas não pego pelo `textContent("body")`).

#### OBS-003: Stats pill mostra "Mediana 6.5" em vez de "Mediana 5" no cenário A=5 B=8
- **Afeta:** E10
- **Dados:** Com 2 votos (5,8), `computeConsensus` retorna median=6.5 (média dos dois centrais).
- **Nota:** O spec da seção 9 do plan.md diz "mediana 5" pra este cenário. Pode ser divergência entre spec e implementação — verificar `computeConsensus` em shared/.

#### OBS-004: Timer mostra "00:60" em vez de "01:00" ou "60"
- **Afeta:** E11
- **Dados:** Timer value `00:60` — formato inesperado para segundos restantes.

#### OBS-005: LGPD — localStorage grava UUID sem consentimento de cookies
- **Afeta:** Auditoria
- **Nota:** `crypto.randomUUID()` salvo em `localStorage` sem banner de consentimento.

---

## Bugs por severidade

| Severidade | Qtd | IDs |
|-----------|-----|-----|
| P0 | 2 | BUG-001, BUG-002 |
| P1 | 3 | BUG-003, BUG-004, BUG-005 |
| P2 | 5 | OBS-001 a OBS-005 |

---

## Screenshots salvos

| Arquivo | Conteúdo |
|---------|----------|
| `screenshots/baseline/landing-1440.png` | Landing completa |
| `screenshots/baseline/join-1440.png` | Join (apelido) |
| `screenshots/baseline/full-1440.png` | Sala cheia |
| `screenshots/responsive/landing-mobile-360.png` | Landing overflow mobile |
| `screenshots/responsive/landing-desktop-1440.png` | Landing canônico |
| `screenshots/responsive/full-mobile-360.png` | Full em mobile |

---

## Auditoria heurística (resumo)

### Nielsen — 5 de 10 validadas

| # | Heurística | Status | Achado |
|---|-----------|--------|--------|
| 1 | Visibilidade de status | ⚠ | Loading state ausente entre Join → Arena |
| 2 | Match sistema↔mundo | ✅ | Termos PT-BR consistentes |
| 3 | Controle e liberdade | ❌ | Botão "Voltar" no full funciona; mas host sozinho não sai da arena |
| 4 | Consistência | ⚠ | 2 CTAs coral (BUG-005) |
| 5 | Error prevention | ✅ | maxlength=20 + validação server-side |
| 6 | Recognition > recall | ✅ | Código da sala visível no topbar |
| 7 | Flexibilidade | ⚠ | Sem atalho teclado pra reveal |
| 8 | Minimalismo | ⚠ | Landing densa (5 sec-rules + 4 caps + 4 steps + 3 stats) |
| 9 | Error recovery | ✅ | Redirect /full pra sala cheia |
| 10 | Help & docs | ⚠ | Sem tooltip (?) |

---

## Fluxo crítico quebrado

**O único fluxo que completamente quebra:** Host cria sala → entra sozinho → EmptyOverlay bloqueia deck → host não consegue votar. O botão "Entrar na mesa mesmo assim" não tem handler. Em produção real, isso significa que o host NÃO pode testar a sala antes de convidar alguém.

---

## Arquivos de teste gerados

| Arquivo | Tracks |
|---------|--------|
| `tests/ux/playwright.config.ts` | Config (desktop + tablet + mobile) |
| `tests/ux/01-smoke.spec.ts` | A (8 testes) |
| `tests/ux/02-visual.spec.ts` | B (10 testes) |
| `tests/ux/03-flows.spec.ts` | C (6 testes) |
| `tests/ux/04-join.spec.ts` | D (8 testes) |
| `tests/ux/05-arena.spec.ts` | E (7 testes) |
| `tests/ux/06-responsive.spec.ts` | F (12 testes) |
| `tests/ux/07-a11y.spec.ts` | G (5 testes) |
