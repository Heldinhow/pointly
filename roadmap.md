# Roadmap — Pointly (lote diversão)

> Filtros do lote: foco em engajamento/diversão · pilares invioláveis (sem cadastro, sala efêmera, sem plano pago) · horizonte de 1–2 semanas (5–8 itens pequenos).
> Linguagem do domínio: `CONTEXT.md`. Visual: `DESIGN.md` + `apps/web/src/index.css` (SSOT de código). Regras executáveis: `packages/shared` (SSOT).

## Now (ordem de execução)

- [ ] **1. Carta vira no assento ao votar** — animar a mini-carta do assento com `card-reveal` (`rotateY`, só `transform/opacity`) ao registrar voto, sem expor valor. Critério: voto aparece com flip; com `prefers-reduced-motion`, sem voo/animação.
- [ ] **2. Celebração sutil de `Unânime`** — pulse curto no feltro + micro-confete CSS-only (~1s, só `transform/opacity`) quando houver unanimidade; só nesse caso, sem neon/glow. Critério: divergência não celebra; `reduced-motion` desativa.
- [ ] **3. Sons táteis opt-in (default off)** — `pop` (voto), `flip` (reveal), fanfarra curta (`Unânime`); toggle em `localStorage`, 100% client-side, sem autoplay. Critério: default silencioso; toggle persiste no dispositivo.
- [ ] **4. Cutucadas pré-prontas e efêmeras** — 4–5 mensagens fixas ("Bora!", "☕ Café?", "Polêmica!", "Confia") como balão sobre o assento por ~2s; broadcast via WS sem persistir, sob o mesmo cooldown dos projéteis. Sem texto livre (sem moderação). Critério: some sozinho; respeita cooldown; nunca persiste.
- [ ] **5. Dado da mesa ("quem justifica primeiro")** — após reveal divergente, sorteio client-side a partir do `room_state` aponta um assento. Critério: só ativo pós-reveal divergente; determinístico por sorteio local, sem servidor.
- [ ] **6. Clima da sessão (memória volátil da sala)** — contadores no sidebar: `unanimidades`, `maior divergência`, `rodadas`. Some com a sala; sem placar por player, sem "vencedor". Critério: zera ao esvaziar a sala.
- [ ] **7. Copiar resultado como texto (bônus)** — copia `mediana + distribuição` em texto para Slack/Jira. Critério: um clique copia; primeiro a cortar se o lote estourar.

## Corte proposto

- **MVP:** 1 + 2 + 4 + 5.
- **Se sobrar fôlego:** 3, depois 6, depois 7.

## Later (fora deste lote, registrado para não perder)

- Mais variantes de desfecho de arremesso (server-side).
- Integrações (Jira/Linear) e exportar ata — só se flexibilizar o pilar efêmero.

## Explicitamente fora

- Ranking global, histórico entre sessões, login/conta, chat livre, loja de avatares paga.
