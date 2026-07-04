# Pointly

Planning Poker web para times ágeis (3–12 pessoas). Salas efêmeras, votação síncrona, deck Fibonacci, sem cadastro, sem email, sem plano pago.

## Language

**Sala**:
Container efêmero de uma sessão de Planning Poker, identificado por código curto de 4 caracteres. Existe enquanto há pelo menos um jogador dentro; some quando todos saem.
_Avoid_: room, partida, match

**Host**:
Jogador que criou a sala. Tem permissão para revelar votos e iniciar nova rodada.
_Avoid_: admin, dono, owner

**Player**:
Qualquer participante da sala que não seja o Host. Pode votar e trocar voto até o reveal.
_Avoid_: jogador, participante, usuário

**Apelido**:
Identificador visível de um jogador na mesa, 2–20 caracteres, sem espaços duplos e sem espaços nas pontas. Sem conta, sem email por trás.
_Avoid_: username, nome de usuário, display name

**Código**:
Identificador único de uma sala, 4 caracteres alfanuméricos (A–Z, 0–9), gerado client-side. Compartilhado via URL para convidar outros jogadores.
_Avoid_: ID, token, PIN

**Assento**:
Posição fixa de um jogador ao redor da mesa em formato de elipse. Cada assento é vinculado a exatamente um jogador; sem entrar, sem assento.
_Avoid_: cadeira, seat, slot

**Rodada**:
Ciclo completo de votação dentro de uma sala: idle → voting (após o primeiro voto) → revealed (após reveal ou auto-reveal por timer).
_Avoid_: round, partida, turno

**Voto**:
Escolha de uma carta do deck por um jogador. Privado até o reveal; pode ser trocado até lá.
_Avoid_: escolha, seleção

**Reveal**:
Ato de expor todos os votos simultaneamente. Disparado pelo Host manualmente ou pelo timer ao expirar.
_Avoid_: mostrar, expor, abrir

**Mediana**:
Valor do meio do conjunto de votos numéricos da rodada. Jogadores com voto igual à mediana recebem destaque gold (mustard).
_Avoid_: média, average, mean

**Deck**:
Conjunto fixo de 9 cartas usadas para votar: `0, ½, 1, 2, 3, 5, 8, 13, ☕`. Sequência Fibonacci + pausa explícita.
_Avoid_: baralho, cards, conjunto

**Timer**:
Contador regressivo de 60 segundos por rodada. Entra em estado crítico (coral) quando ≤30s; auto-reveal ao chegar a zero.
_Avoid_: cronômetro, contagem
