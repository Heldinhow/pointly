# E2E — Pointly (Playwright, frontend + backend reais)

Suíte Playwright exercitando o frontend Vite REAL contra o backend
Bun+Hono+WS REAL, pela UI, com contextos de browser separados por
jogador (nunca só abas do mesmo storage).

Não substitui os testes unitários existentes (ver SSOT de contagem na
suite unitária) nem usa mocks de socket, rota ou store.

## Pré-requisitos

- Bun 1.3+, Node 22+
- Chromium: o Playwright usa o bundle próprio por padrão. Neste ambiente
  RHEL9 (sem cache de browsers), exporte o Chromium do SO:
  `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser`
- Portas livres: `3001` (backend), `5179` (Vite dev) e `5188` (build de
  produção). O `webServer` do Playwright sobe e derruba os três;
  `reuseExistingServer: false`. O servidor de `:5188` roda
  `bun run build:web` antes de servir `apps/web/dist` com
  `scripts/serve-web.mjs` — só ele tem HTML pré-renderizado + `hydrateRoot`.

## Comandos

```bash
bun run typecheck:e2e  # tsc -p tsconfig.e2e.json (sem any, sem casts de parsing)
bun run test:e2e:list  # lista os cenários (não executa)
bun run test:e2e        # typecheck + executa a suíte (2 projetos × cenários)
```

## Variáveis de ambiente

| Var | Default | Uso |
| --- | --- | --- |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` | bundle Playwright | Chromium do SO neste ambiente |
| `PLAYWRIGHT_OUTPUT_DIR` | `test-results/` (gitignored) | logs/traces/`report.json` |
| `PLAYWRIGHT_HTML_REPORT` | `playwright-report/` (gitignored) | report HTML |
| `VITE_GA_MEASUREMENT_ID` | `"G-POINTLY-E2E-DISABLED"` (forçado no webServer, sintético e não vazio) | com ID configurado, o banner de consentimento aparece; nenhum request a Google antes de Aceitar |

A configuração retém screenshots e traces de falhas e não grava vídeo.
O cenário de votação também anexa uma screenshot da rodada revelada
quando passa, nos dois viewports.

Exemplo com artefatos fora do repo:

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser \
PLAYWRIGHT_OUTPUT_DIR=/caminho/externo/e2e-reviewed \
bun run test:e2e
```

Repetição de estabilidade:

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser bunx playwright test --repeat-each=3
```

## Cenários (independentes — cada um cria a própria sala)

1. `e2e/security-voting.spec.ts` — fluxo completo + sigilo pré-reveal:
   criar, pauta destrava deck, entrada com código manual (Beto) e por
   convite (Carol espectadora, sem voto), votos 8/5 com `aria-pressed`,
   sigilo estrito WS (`votes` igual ao próprio voto e só ele,
   `players.value` de todos os demais `null`, espectadora fora dos dois
   canais, sem uuid), reveal por jogador normal (mediana 6.5), edição
   pós-reveal recalcula, nova rodada com confirmação dupla limpa e
   avança a pauta. A espectadora não recebe o CTA de primeira história.
2. `e2e/reload-rejoin.spec.ts` — reload espera um NOVO `welcome`
   pós-rejoin e afirma playerId/assento/papel/voto nele (nunca em
   snapshot velho); voto alheio segue oculto; sem uuid S2C.
   Reload de sala sumida cai no estado terminal `missing`
   ("Esta sala não está mais disponível."), com volta à `/join` sem
   reaproveitar o código morto — encerramento, não erro genérico de rede.
3. `e2e/round-hygiene.spec.ts` — higiene solo: deck travado sem pauta,
   CTA `Adicionar primeira história` visível no viewport foca o input
   real `#pauta-novo-titulo` e some após `addStory`; reveal exige voto,
   1ª ativação da nova rodada só arma, 2ª confirma.
4. `e2e/late-join.spec.ts` — late-join após o host votar: o `welcome` do
   jogador e o da espectadora chegam com `votes` vazio e todos os
   `players.value` nulos.
5. `e2e/identity-privacy.spec.ts` — o welcome inicial não transmite a
   credencial de reconexão. Este cenário permite comparar a versão
   corrigida com o backend anterior sem depender da hidratação dos
   snapshots no helper.
6. `e2e/analytics-privacy.spec.ts` — banner LGPD com ID sintético não
   vazio (`G-POINTLY-E2E-DISABLED`): sem escolha e após Recusar, zero
   requests aos hosts de analytics, sem `script` injetado e sem `gtag`,
   inclusive após reload; Aceitar injeta gtag, envia `page_view` (rota
   inicial e SPA) e Recusar depois interrompe novos eventos.
7. `e2e/join-usability.spec.ts` — `/join`, `/join?mode=join` e
   `/join?code=AB12`: sem scroll horizontal e sem seção recolhida; nos
   caminhos de join a opção `Entrar como espectador` (`#spectate`, com
   ícone e hint) fica visível de imediato, e no create ela não existe.
8. `e2e/prod-hydration.spec.ts` — build de produção pré-renderizado em
   `:5188`: `/` e `/guias/story-points` carregam e recarregam com zero
   `pageerror`/`console.error` antes e depois de **Aceitar** o banner
   (regressão do React #421, update de consentimento durante a
   hidratação). Analytics hosts seguem stubbed.

Projetos: `chromium-desktop` (1280×800) e `chromium-mobile`
(390×844 com touch — Chromium com viewport de telefone, **não** iOS real).
Cada contexto manual passa os campos `use` do projeto explicitamente e
afirma em runtime o viewport real (`viewportSize` + `innerWidth/Height`)
e o touch (`maxTouchPoints`) antes do cenário.

## Convenções da suíte

- Captura raw via `page.on("websocket")` + `framereceived` —
  `e2e/helpers/ws-capture.ts`. Passiva: não substitui sockets, rotas ou
  Zustand, sem mock, nenhuma ação em produção.
- Parse validado pelos schemas do `@planning-poker/shared`
  (`parseServerEvent`); raw preservado e falhas de parse registradas em
  `parseErrors` (assert vazio em todo cenário).
- Asserts de sigilo só valem sobre snapshots `voting`/`revealable`
  **após** esperar o snapshot correspondente (ambos `hasVoted`); voto
  aberto pós-reveal não é vazamento.
- `expect.poll` para estado; sem sleeps fixos.
- Todo `pageerror` e `console.error` falha, sem filtro por texto ou recurso.
- O objeto de cada frame cru é comparado ao resultado do parser para
  detectar campos extras descartados pelo schema, inclusive em eventos
  como `vote_cast` e `player_joined`.
- Convite: lido do campo real da arena (`readInviteUrl`, com validação de
  origem/path/code, sem fallback); o join navega no link lido.
- Espectador/foto ficam visíveis direto no formulário de entrada (sem
  seção recolhida): o harness marca `#spectate` diretamente — nunca
  clique por bypass em controle oculto.
- Encerramento × desconexão: `sala_ended` (`server_restart`, `replaced`,
  `last_left`) e `sala_nao_encontrada` no retry são terminais
  (`room-ended`, sem novos votos, volta à entrada sem recriar sala);
  queda sem motivo mantém backoff/reconexão de 5min.
- CI: `scripts/ci-workflow.test.ts` valida a declaração do workflow
  (gates `verify` → `e2e`, sem escrita/deploy) — prova de execução real
  só existe com jobs verdes no GitHub.
- Locale `pt-BR` nos contextos.
