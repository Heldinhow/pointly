# Pointly

Planning Poker web para times ágeis (3–12 pessoas). Salas efêmeras, votação síncrona, deck Fibonacci, sem cadastro, sem email, sem plano pago.

## Visão Geral

Pointly é um aplicativo web para estimativa ágil de trabalho usando Planning Poker. Crie uma sala compartilhando um código de 4 caracteres, convide seu time, votem síncrono e revelem as estimativas coletivamente.

**Princípios:**
- Zero cadastro, zero email, zero fricção
- Até 12 jogadores por sala
- Sincronização em tempo real via WebSocket
- Reconnect automático por UUID
- Visual limpo com paleta Atelier Zero

## Stack

| Camada | Tecnologia |
|--------|------------|
| Runtime | Bun |
| Backend | Hono + WebSocket nativo (`Bun.serve()`) |
| Frontend | React 18 + Vite + TypeScript |
| State (client) | Zustand |
| Schemas compartilhados | Zod |
| UI | Tailwind CSS |
| Testes | Vitest + Playwright |

## Estrutura do Projeto

```
pointly/
├── apps/
│   ├── web/          # Frontend React (port 5173)
│   └── server/       # Backend Bun + Hono (port 3001)
├── packages/
│   └── shared/       # Schemas Zod + tipos TS + computeConsensus
├── tests/
│   └── e2e/          # Testes Playwright multi-client
├── design/           # Wireframes HTML de referência visual
└── docs/adr/         # Architecture Decision Records
```

## Início Rápido

### Pré-requisitos

- [Bun](https://bun.sh) >= 1.1.0

### Instalação

```bash
git clone https://github.com/Heldinhow/pointly.git
cd pointly
bun install
```

### Desenvolvimento

```bash
bun run dev
```

Isso inicia o frontend (Vite, porta 5173) e o backend (Bun, porta 3001) em paralelo.

- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- WebSocket: ws://localhost:3001/ws
- Health check: http://localhost:3001/health

### Comandos

| Comando | Descrição |
|---------|-----------|
| `bun run dev` | Inicia frontend + backend em paralelo |
| `bun run dev:web` | Inicia só o frontend |
| `bun run dev:server` | Inicia só o backend |
| `bun run build` | Build de produção |
| `bun run test:all` | Roda todos os testes |
| `bun run test:server` | Testes do backend (Vitest) |
| `bun run test:web` | Testes do frontend (Vitest) |
| `bun run test:shared` | Testes do package shared |
| `bun run test:e2e` | Testes E2E (Playwright) |
| `bun run typecheck` | Verificação de tipos |
| `bun run lint` | Lint com Biome |
| `bun run format` | Formata código com Biome |

## Como Funciona

### Fluxo de Uso

1. **Criar sala** — Acesse a landing e clique "Criar sala". Um código de 4 caracteres é gerado.
2. **Convidar time** — Compartilhe o código (ou link) com sua equipe.
3. **Entrar na sala** — Cada jogador entra com um apelido (sem cadastro).
4. **Votar** — Escolha uma carta do deck Fibonacci (`0, ½, 1, 2, 3, 5, 8, 13, ☕`).
5. **Revelar** — qualquer jogador pode revelar os votos ou o timer expira (60s).
6. **Discutir** — Veja a mediana, média e intervalo. Jogadores com voto = mediana ganham destaque gold.
7. **Nova rodada** — Inicie uma nova rodada de votação.

### Deck Fibonacci

`0` · `½` · `1` · `2` · `3` · `5` · `8` · `13` · `☕`

- `☕` (pausa) é excluído dos cálculos estatísticos
- `0` indica "não sei estimar" ou "trivial"

### Roles

- **Host** — criador da sala. Se sair, o jogador mais antigo herda o papel.
- **Player** — qualquer participante. Todos podem revelar votos e iniciar nova rodada.

### Protocolo WebSocket

O servidor é a fonte da verdade para fase da rodada, timer e votos.

**Eventos Client → Server:**
- `hello` — conexão inicial com uuid + apelido + código opcional
- `cast_vote` — registrar voto (pode ser trocado até o reveal)
- `reveal_votes` — revelar todos os votos
- `start_new_round` — iniciar próxima rodada
- `ping` — heartbeat a cada 30s

**Eventos Server → Client:**
- `welcome` — confirmação com playerId, role e estado da sala
- `room_state` — estado completo sincronizado
- `player_joined` / `player_left` — entrada/saída de jogadores
- `vote_cast` — notificação de voto (valor oculto até reveal)
- `votes_revealed` — todos os votos + stats (mediana, média, intervalo)
- `round_started` — nova rodada iniciada
- `sala_ended` — sala encerrada

### Reconnect

Se a conexão cair, o cliente reconecta automaticamente com o mesmo UUID (persistido em `localStorage`). O servidor reidrata o jogador na sala, preservando voto e posição.

## Arquitetura

### State In-Memory

O estado das salas vive em um `Map<codigo, Sala>` no processo do servidor (ADR-0005). Sem banco de dados, sem Redis. Salas são efêmeras — são removidas quando o último jogador sai.

### Schemas Compartilhados

O package `@planning-poker/shared` define todos os schemas Zod e tipos TypeScript usados tanto pelo client quanto pelo server, garantindo contrato único para todos os eventos WebSocket.

### Design System

Cores e tipografia seguem a paleta **Atelier Zero**:
- Fundo escuro com texto claro
- Coral para CTAs e estado ativo
- Mostarda/Gold para destaque de mediana
- Tipografia: Playfair Display (numerals do deck)

## Testes

### Unit/Integration (Vitest)

```bash
bun run test:shared   # Schemas, computeConsensus
bun run test:server   # State machine, validadores, handlers
bun run test:web      # Componentes React
```

### E2E (Playwright)

```bash
bun run test:e2e
```

Cenários testados:
- Fluxo feliz completo (criar sala → votar → revelar)
- Sala cheia (13º jogador rejeitado)
- Reconnect com UUID preserva voto

## Decisões de Arquitetura

Os ADRs detalham as escolhas técnicas:

| ADR | Decisão |
|-----|---------|
| [0001](docs/adr/0001-deck-includes-half-card.md) | Deck inclui carta ½ |
| [0002](docs/adr/0002-host-is-creator-not-ruler.md) | Host = criador, não ditador |
| [0005](docs/adr/0005-v1-functional-in-memory-state.md) | State in-memory, sem DB |
| [0006](docs/adr/0006-bun-hono-websocket-backend.md) | Bun + Hono + WebSocket nativo |
| [0007](docs/adr/0007-react-vite-typescript-frontend.md) | React + Vite + TypeScript |
| [0008](docs/adr/0008-zustand-zod-shared-schemas.md) | Zustand + Zod shared schemas |
| [0009](docs/adr/0009-reconnect-uuid-strategy.md) | Reconnect por UUID |
| [0010](docs/adr/0010-ui-primitives-and-testing.md) | UI primitives + Vitest + Playwright |

## Limitações (v1)

- Desktop only (1440px) — sem responsivo mobile/tablet
- State in-memory — sem persistência entre restarts do servidor
- Sem scaling multi-instance (Map não compartilha entre réplicas)
- Sem integração com Jira, Linear ou outras ferramentas
- Sem histórico de rodadas ou analytics

## Licença

Projeto privado.
