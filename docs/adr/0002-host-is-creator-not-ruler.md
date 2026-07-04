# Host is creator, not ruler

> **Status: superseded by [0005](./0005-v1-functional-in-memory-state.md)** — v1 abandonou wireframe client-side, virou sistema funcional real. Salas reais, papéis reais, sem bots.
> **Atualizado pela grilling 2026-07-04**: no v2 functional, host é só "criador da sala" + ★ star visual. Reveal e new_round foram democratizados (qualquer player pode).

O wireframe ignora separação de papéis: o botão Reveal/NewRound é sempre visível, mesmo entrando via "Entrar com código". Host e Player existem como termos no domínio (ver [CONTEXT.md](../../CONTEXT.md)) mas não são exercitados no protótipo client-side — honrá-los trava o demo, já que um Player pode votar mas nunca revelar, e os 11 bots estão sempre presentes. Em produção, o servidor aplica papéis estritamente; o wireframe serve apenas para validar a anatomia visual e o fluxo do host. Trade-off aceito: fidelidade de papel vs. fidelidade de fluxo de demo.

**Grilling 2026-07-04 (v2 functional):** Reveal e new_round foram democratizados — qualquer player pode revelar (após ≥1 voto) e iniciar nova rodada. O papel de host ficou fraco: apenas "criador da sala" (quem chamou `hello` sem `code`) e ★ mostarda visual. Em caso de saída do host, `Sala.promoteOldestPlayer()` move o papel para o player com menor `joinedAt` (determinístico). Host promotion é mantida pra preservar a semântica de "quem criou" e o indicador visual ★; **não** dá poder exclusivo de reveal ou new_round.
