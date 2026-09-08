# Pointly — redesign Factory (Autonomy Stack / Industrial)

One-shot manual. Roda uma vez quando o usuário mandar "executa". Sem recorrência, sem evento.

## Trigger

- Manual: comando explícito do usuário. `schedule: none`.

## Objetivo

Aplicar redesign completo de `apps/web` (landing, join/recovery, arena, estados da cobertura existente) para design system extraído das refs, nesta ordem de precedência (a anterior vence em conflito):
1. https://factory.ai
2. https://factory.ai/product/cli
3. https://factory.ai/company#careers
4. https://docs.factory.ai

`loop-prompt.md` está superseded (desktop-only v1 + cream/coral não valem mais). Não deletar o arquivo.

## Escopo permitido

- Só mexer em `apps/web/**` (tokens/CSS/config de UI) + `DESIGN.md`.
- NÃO tocar `apps/server/**`, `packages/shared/**`, lógica de transporte/schemas/store/regras de sala/voto/rotas.
- Testes de aparência que codificam o sistema descartado (Mesa/Azul tinta) podem ser atualizados; testes comportamentais/IDs de teste, não.

## Matriz de estados (fechada, de `design/redesign-2026/coverage.md`)

- Landing `/`: header, hero, criar/entrar, explicação, FAQ, footer.
- Criar `/join?host=1`, entrar `/join` (código 4 chars + apelido, vazio/inválido/válido), convite `/join?code=…` (sala inexistente, falha de rede).
- Arena `/arena`: conectando, espera, voting, revealable, revealed, próxima rodada.
- Participantes 1/2/6/12, host, você, voto oculto/revelado, mediana, desconectado, nome longo.
- Resultados: mediana, média, intervalo, unanimidade, pausa. Sem inventar decisão final.
- Recuperação: `/full`, 404, sala encerrada, offline, reconexão, erros.
- Transversal: fallback, toast, foco, hover, disabled, loading, help-modal, temas, motion reduzido.

## Fase 1 — extrair tokens (skill `/redesign-existing-projects`)

1. Fetch nas 4 refs na ordem acima. Extrair tokens reais: cores (bg/surface/ink/acento/borda/semânticas), fonts (famílias-pesos-escalas-tracking-line-height), espaçamento, raios, elevação, componentes/estados.
2. Fonts: tentar Geist via fontsource (OFL) com fallback `Inter, system-ui` + `ui-monospace`. Se licença travar sem fallback viável → parar como bloqueado (ver §Bloqueio).
3. Dark: derivação tonal dos mesmos tokens (não cópia literal do docs), ajustado até AA.
4. Aplicar no site inteiro via `apps/web/src/index.css` + `tailwind.config.ts` + `src/styles/*.css`. Estado atual já iniciado (accent `#ee6018`, raios 3/6/8, header 68px) — consolidar, não recomeçar. `DESIGN.md` ainda diz Mesa/Azul tinta: isso é drift a ser eliminado na fase 2.
5. Restrições: contraste AA 4.5:1 corpo (3:1 texto grande), foco visível 3px, `prefers-reduced-motion: reduce` → transições instantâneas, temas via `data-theme` claro/escuro + system, alvos ≥44px, `text-wrap: balance` em h1–h3.

## Fase 2 — reescrever `DESIGN.md`

- Substituição integral de Mesa compartilhada/Azul tinta pelo novo sistema.
- Manter frontmatter + seções: tokens, tipografia, layout, elevação, formas, componentes, estados, do's/don'ts — todos consistentes com o código renderizado.
- Incluir tabela de precedência das refs, estratégia dark, e nota de aliases de compat (`coral/paper/mustard/olive` → novos tokens, sem representar identidade descartada).

## Fase 3 — `/impeccable` critique + polish (+ `/anti-ui-slop` `/ui-design` `/frontend-design` como lentes)

- `critique` comparando implementação vs. refs (tipografia/fonts primeiro), depois `polish` + ajustes.
- Aplicar todas as melhorias encontradas dentro do escopo permitido.
- Rejeitar: gradient-text, card-fantasma (borda 1px + shadow ≥16px no mesmo elemento), raio 32px+ em cards, eyebrow numerado em toda seção, hero-metric template.

## Verificação (após cada tentativa; escolhe a próxima ação útil: token faltante, breakpoint, contraste, componente, doc)

- `bun run build` (web + server build, sem mudar server).
- Regressão: `bun run test:web` + `test:shared` + `test:server`. Baseline conhecido: 111 shared / 163 server / 340 web passavam, 1 Pill falhava por `bg-coral-soft` (expectativa do sistema descartado — atualizar, não declarar regressão nova sem comparar).
- Screenshots isolados em `screenshots/factory-<rota>-<viewport>-<tema>.png`: rotas `/`, `/join`, `/join?host=1`, `/arena`, `/full`, 404 × light/dark × 1440/375. Sem overflow horizontal (`scrollWidth === innerWidth`), sem quebra de layout/estados, sem texto ilegível.

## Checkpoint (único, push right)

- Só no final. Brief decisão-pronto: tabela de tokens, diff `DESIGN.md`, matriz de screenshots, resultado build/testes. Nada de checkpoint intermediário; usuário aprova ou pede ajuste em lote.

## Pronto quando

1. `DESIGN.md` reescrito reflete o que está renderizado.
2. Build + suite de testes passam sem regressão (vs. baseline acima).
3. Screenshots light/dark desktop + mobile sem overflow, quebra ou ilegibilidade.

## Bloqueio (parar e reportar, não improvisar)

- Refs inacessíveis, ou fonts exigirem licença incompatível sem fallback viável, ou build/testes falharem por causa externa ao redesign.
- Report: evidência (log/HTTP/status), caminhos tentados, e o input que destravaria.
