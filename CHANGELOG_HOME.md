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
