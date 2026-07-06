# CHANGELOG_HOME — Pointly home improvement loop (T1–T8)

Registro por item do backlog. Entradas são adicionadas ao final, na ordem em que o item
fecha (`DONE`) ou esgota iterações (`BLOCKED`). Formato padrão por entrada:

```
## T{N} — {título curto}
Issue: #{M}
Status: DONE (issue fechada) | BLOCKED (issue aberta, label `blocked`)
Mudanças: {arquivos/componentes tocados}
Decisões: {qualquer trade-off ou adaptação em relação à sugestão original}
Verificação: {como foi validado — screenshot, teste de contraste, viewport testado, etc.}
```

---

## T1 — Hero mostra o produto, não só ilustração decorativa

Issue: #23
Status: DONE (issue fechada via Closes #23 no commit)
Mudanças:

- `apps/web/src/pages/landing.tsx`: novo componente `HeroTable` (preview de 6 jogadores
  em torno de elipse pontilhada, mediana destacada em mostarda, moldura editorial com
  "FIG. 01 · MESA REVELADA" + badge "MEDIANA 5" + rodapé mono "6 JOGADORES · 1 HOST /
  MOSTARDA = MEDIANA"); substitui a ilustração Ø abstrata do hero.
- `apps/web/src/pages/landing.test.tsx`: novo teste que verifica `hero-table-preview`,
  presença de "Fig. 01 · Mesa revelada", nick "Você" e "Mediana", ≥6 valores Fibonacci
  revelados.

Decisões:

- Mantive a moldura editorial (chip "FIG. 01", badge mono "MEDIANA 5", rodapé mono)
  para preservar a metáfora de "revista" — não troquei por uma ilustração genérica.
- 6 jogadores (não 8 como na MockTable do ABOUT) para caber no espaço do hero e
  deixar a mediana visualmente limpa (5/5/5 + 3 + 8 + 8).
- Posições ajustadas após primeira renderização (Theo estava parcialmente escondido
  pelo chip superior — movido de top 8% para 18%).
- O `Ø` sumiu do hero mas continua aparecendo no topo (logo "Pointly") e na nav.
  A marca permanece intacta.

Verificação:

- `bun test apps/web/src/pages/landing.test.tsx` → 8/8 pass (incluindo o novo teste T1).
- Screenshot do hero após mudança mostra 6 cartas visíveis com valores 5/3/5/8/5/8,
  3 delas com borda mostarda (mediana 5), 1 com borda coral ("Você") e 1 com estrela
  mostarda (host Theo).
- Full-page screenshot em 1440x900 confirma que ABOUT (MockTable 8 jogadores),
  Capabilities, Dark showcase, CTA e Footer permanecem intactos — sem regressão.

## T2 — Métrica "0 Cadastros" ambígua

Issue: #24
Status: DONE (issue fechada via Closes #24 no PR)
Mudanças:

- `apps/web/src/pages/landing.tsx`: removido `{ num: "0", label: "Cadastros" }` de
  `STATS`; adicionados 3 stats numéricos inequívocos
  (`12 Assentos`, `60s P/ decidir`, `0s Setup`); adicionado selo editorial
  `data-testid="selo-sem-cadastro"` em coral (`✓ SEM CADASTRO · SEM E-MAIL`).
  Anel de stat élargido de 40px para 56px para acomodar "0s" / "60s".
- `apps/web/src/pages/landing.test.tsx`: 2 novos testes — um verifica que "Cadastros"
  não aparece mais como label numérico e que o selo está presente; outro garante
  que os 3 stats restantes (Assentos, Decidir, Setup) são inequívocos.

Decisões:

- Optei pelo caminho (a) do spec: o claim "sem cadastro" virou **selo**, não número.
  O número "0" continua na barra de stats mas com label **"Setup"** (zero segundos
  de setup) — inequívoco.
- Selo em coral com fundo `bg-coral/10` e borda `border-coral/30` para se destacar
  sem competir com o CTA coral principal "Criar sala".
- Mantive 3 itens na barra de stats para preservar ritmo visual; troquei o conteúdo,
  não a estrutura.

Verificação:

- `bun test src/pages/landing.test.tsx` → 10/10 pass (2 novos testes T2 inclusos).
- Screenshot 1440x900 mostra: stats row com `12 ASSENTOS / 60s P/ DECIDIR / 0s SETUP`,
  selo `✓ SEM CADASTRO · SEM E-MAIL` em coral logo abaixo.
- T1 (preview da mesa) intacto: 6 cartas visíveis com mediana 5 destacada.

## T3 — Open-source escondido no footer

Issue: #25
Status: DONE (issue fechada via Closes #25 no PR)
Mudanças:

- `apps/web/src/pages/landing.tsx`: adicionado selo `[ GITHUB ↗ ]` no topo metadata
  strip (visível sem rolar), ao lado de "PLANNING POKER EFÊMERO". Selo é um
  `<a target="_blank" rel="noopener noreferrer">` apontando para
  `https://github.com/Heldinhow/pointly`, com ícone SVG do GitHub em
  `ink-faint` e hover para `coral`. `data-testid="selo-github-header"`.
- `apps/web/src/pages/landing.test.tsx`: novo teste T3 verifica presença do selo,
  tag `<a>`, href para github.com, `target="_blank"`, e que está visível
  sem rolar (`getBoundingClientRect().top < 100`).

Decisões:

- Coloquei o selo no **top metadata strip** (não no sticky nav) para preservar o
  "Planning Poker Efêmero" como texto editorial e dar respiro ao botão coral
  "Criar sala" na nav. O selo compete visualmente com o claim "PLANNING POKER
  EFÊMERO" no mesmo nível tipográfico, mantendo a densidade editorial.
- Escondi "PLANNING POKER EFÊMERO" em viewports < lg para priorizar o selo GitHub
  em telas médias (mobile-first visibility do link open-source).
- Brackets `[ ... ]` ao redor de "GITHUB ↗" mantém a linguagem editorial de
  "peça numerada" da revista (mesmo padrão usado em "FIG. 01", "MÉDIA 6.25").

Verificação:

- `bun test src/pages/landing.test.tsx` → 11/11 pass (novo teste T3 incluso).
- Screenshot 1440x900 confirma selo `⊙ [ GITHUB ↗ ]` no canto superior direito,
  visível sem rolar; T1 e T2 intactos.
- Hover state não verificado por screenshot mas testado via classes Tailwind
  (`hover:border-coral hover:text-coral`).
