# Votos mascarados no servidor até o Reveal

O `room_state` passa a carregar apenas a contagem de votos antes do Reveal; os valores individuais (playerId → Voto) só saem do servidor na fase `revealed` — no evento de revelação, no `room_state` pós-Reveal e em reconexões durante o Reveal. Antes, os votos trafegavam para todos os clientes em qualquer fase e a ocultação era só client-side: qualquer um via tudo pelo devtools, contradizendo a confiança que o produto promete sem cadastro.

## Consequences

- O cliente deixa de receber valores antes do Reveal; esconder passa a ser responsabilidade única do servidor.
- `vote_cast` continua igual: informa QUEM votou (individual/aggregate), nunca O QUE foi votado.
- A serialização da Sala ganha dois modos (pré e pós-Reveal) e os testes de WS cobrem o payload mascarado.
