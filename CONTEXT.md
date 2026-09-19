# Pointly

Planning Poker web para times ágeis (3–12 pessoas). Salas efêmeras, votação síncrona, deck Fibonacci, sem cadastro, sem email, sem plano pago.

## Language

**Sala**:
Container efêmero de uma sessão de Planning Poker, identificado por código curto de 4 caracteres. Existe enquanto há pelo menos um jogador dentro; some quando todos saem.
_Avoid_: room, partida, match

**Host**:
Jogador que criou a sala (★ visual; se sair, o player mais antigo herda). Reveal e nova rodada são democratizados: qualquer player pode revelar e iniciar nova rodada (ADR-0002).
_Avoid_: admin, dono, owner

**Player**:
Qualquer participante da sala. Pode votar, trocar o voto antes do reveal e editar o próprio voto após o reveal (consensus recomputado, sala segue `revealed`).
_Avoid_: jogador, participante, usuário

**Apelido**:
Identificador visível de um jogador na mesa, 2–20 caracteres, sem espaços duplos e sem espaços nas pontas. Sem conta, sem email por trás.
_Avoid_: username, nome de usuário, display name

**Código**:
Identificador único de uma sala, 4 caracteres alfanuméricos (A–Z, 0–9), gerado no servidor (`generateUniqueCode`). Compartilhado via URL para convidar outros jogadores.
_Avoid_: ID, token, PIN

**Assento**:
Posição fixa de um jogador ao redor da mesa em formato de elipse. Cada assento é vinculado a exatamente um jogador; sem entrar, sem assento.
_Avoid_: cadeira, seat, slot

**Rodada**:
Ciclo completo de votação dentro de uma sala: idle → voting (após o primeiro voto) → revealable (todos conectados votaram) → revealed (após reveal manual).
_Avoid_: round, partida, turno

**Voto**:
Escolha de uma carta do deck por um jogador. Privado até o reveal; pode ser trocado antes do reveal e editado após o reveal (atualiza o voto, recomputa o consensus).
_Avoid_: escolha, seleção

**Reveal**:
Ato de expor todos os votos simultaneamente. Disparado por qualquer player manualmente, sem pressa de tempo.
_Avoid_: mostrar, expor, abrir

**Mediana**:
Valor do meio do conjunto de votos numéricos da rodada. Jogadores com voto igual à mediana recebem destaque gold (mustard).
_Avoid_: média, average, mean

**Unânime**:
Rodada revelada em que todos os votos numéricos são iguais — pausa (☕) fica de fora — com pelo menos dois votantes numéricos. Voto único não é unanimidade.
_Avoid_: consenso, acordo total, todos de acordo

**Divergente**:
Rodada revelada com pelo menos dois votos numéricos e ao menos dois valores distintos. A magnitude da divergência é a distância entre o menor e o maior voto numérico; rodadas com menos de dois votos numéricos não têm sinal.
_Avoid_: discordância, desacordo, conflito

**Dado da mesa**:
Sorteio determinístico, local e sem servidor que aponta, após um Reveal divergente, o Assento que justifica primeiro. Todos os clientes veem o mesmo Assento: a semente é o Código + número da Rodada e o pool são os Assentos com voto numérico, então o resultado só muda em nova Rodada ou se o pool mudar. Não persiste: é recomputado do snapshot a cada carregamento.
_Avoid_: roleta, dice, aleatório

**Deck**:
Conjunto fixo de 9 cartas usadas para votar: `0, ½, 1, 2, 3, 5, 8, 13, ☕`. Sequência Fibonacci + pausa explícita.
_Avoid_: baralho, cards, conjunto

**Projétil**:
Objeto virtual arremessável (ex: tomate, café, patinho de borracha) que possui animação e efeitos visuais próprios.
_Avoid_: munição, bola, objeto

**Arremesso**:
O ato de lançar um Projétil de um Assento de origem para um Assento de destino, sujeito a um Cooldown.
_Avoid_: lance, tiro, jogada

**Desfecho**:
O resultado físico/visual de um Arremesso determinado pelo servidor (ex: acerto, desvio, rebote).
_Avoid_: resultado, fim

**Cooldown**:
O intervalo obrigatório entre Arremessos e Cutucadas do mesmo Player. SSOT no código: `PROJECTILE_COOLDOWN_MS` (1s) e `PROJECTILE_CHAIR_COOLDOWN_MS` (8s, cadeirada épica) em `packages/shared/src/compute/projectile.ts`.
_Avoid_: tempo de recarga, espera, delay

**Cutucada**:
Mensagem pré-pronta e efêmera — "Bora!", "☕ Café?", "Polêmica!", "Confia" — exibida por ~2s como balão sobre o Assento do alvo. Sem texto livre (sem moderação), qualquer participante conectado pode cutucar qualquer outro menos a si mesmo, inclusive espectadores, em qualquer fase. Compartilha o Cooldown do Arremesso e nunca persiste: some sozinha e não volta no recarregamento.
_Avoid_: reação, poke, nudge, aviso

**Avatar**:
Imagem do Player exibida no círculo do Assento na mesa, normalizada para 128x128 JPEG. Sem imagem, exibe as iniciais do Apelido.
_Avoid_: foto, profile pic, thumbnail

**Perfil**:
Ponto onde o dono troca Apelido + Avatar (picker no join + "Você é" na arena). Global do dispositivo, sem rota própria, visível para toda a sala.
_Avoid_: conta, profile page, settings
