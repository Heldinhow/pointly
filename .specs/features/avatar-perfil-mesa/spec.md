# Avatar na mesa Specification

## Problem Statement

Players hoje são só iniciais do Apelido no círculo da mesa. Sem foto, a mesa é impessoal e difícil de escanear quem é quem. Precisamos permitir trocar a imagem do perfil e exibi-la na mesa, sem criar contas nem nova infra de storage.

## Goals

- [ ] Player troca o Avatar por upload próprio e vê refletido na mesa em < 5s
- [ ] Avatar persiste no dispositivo entre reloads e salas, sem backend persistente
- [ ] Mesa mantém layout 44px e fallback legível quando sem imagem ou com erro

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
| ------- | ------ |
| Rota /profile dedicada | Sem contas; picker no join + arena cobre o uso (grill Q4) |
| Editor manual de crop/zoom | Crop central automático + cover é suficiente pro v1 (grill Q7) |
| Storage S3/R2 ou URL externa | Sem infra nova; localStorage + hello cobre salas efêmeras (grill Q2, ADR-0013) |
| Galeria de presets / avatares gerados | Upload próprio atende o pedido; gerados ficam para depois |
| Moderação de imagem no servidor | Sem backend persistente; limite de tamanho + escopo da sala bastam pro v1 |

---

## Assumptions & Open Questions

Every ambiguity is resolved or recorded here - nothing is left silently unclear.

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Fonte da imagem | Upload próprio do dispositivo | Pedido original; sem dependência externa | y |
| Persistência sem conta | localStorage + reenvio via hello a cada join | Arquitetura atual é sala em memória + UUID client; zero infra | y |
| Escopo | Global do dispositivo, votante + espectador | Sem conta não há por-sala; espectador na lista evita inconsistência | y |
| Onde trocar | Picker no join + troca na arena, sem rota nova | YAGNI sem contas | y |
| Render na mesa | <img> no círculo 44px, fallback iniciais | Mantém layout e âncora de projéteis | y |
| Normalização | 128x128 JPEG q0.8 via canvas, entrada png/jpeg/webp, recusa >5MB antes de processar | localStorage ~5MB e room_state replica x24; 8-15KB evita estouro | y |
| Crop | Central quadrado automático + object-fit cover | Sem editor manual no v1 | y |
| Protocolo | avatar?: string dataURL teto ~40KB, zod recusa sem derrubar hello | Viabiliza Q6/Q7/Q9 sem storage | y |
| Troca mid-sala | Evento update_avatar + broadcast room_state | Só-no-join frustra troca invisível | y |
| Remover e erro | Botão Remover + onError para iniciais | Usuário não fica preso; quebrado não vira círculo vazio | y |
| Privacidade | Microcopy "Visível para todos na sala" | Avatar via room_state é público da sala | y |
| Docs | CONTEXT Avatar/Perfil + ADR-0013 | Wire format difícil de reverter | y |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Trocar avatar no join e ver na mesa ⭐ MVP

**User Story**: As a Player, I want enviar minha foto no join para que minha imagem apareça no meu assento na mesa.

**Why P1**: É o corte vertical demo-ável: upload → persist → protocolo → render.

**Acceptance Criteria**:

1. WHEN o Player seleciona um arquivo png/jpeg/webp de até 5MB THEN the system SHALL normalizar para 128x128 JPEG q0.8 e exibir preview circular imediato
2. WHEN o Player entra na sala com avatar THEN the system SHALL enviar avatar no hello e persistir em localStorage para próximos joins
3. WHILE o Player está sentado com avatar válido THEN the system SHALL renderizar <img> com object-fit cover no círculo 44px em vez das iniciais
4. IF o arquivo for de formato inválido ou maior que 5MB THEN the system SHALL recusar com erro inline sem quebrar o join
5. IF o avatar exceder ~40KB após normalização THEN the system SHALL recusar no zod sem derrubar o hello e manter iniciais como fallback
6. The system SHALL manter o mesmo posicionamento, tamanho e âncora data-projectile-player do círculo existente

**Independent Test**: Fazer upload no join, entrar na sala e ver a foto no próprio assento; recarregar e ver a foto persistida no picker.

---

### P2: Trocar ou remover avatar dentro da sala

**User Story**: As a Player em sala, I want trocar ou remover meu avatar sem sair para que todos vejam a mudança em tempo real.

**Why P2**: Troca só-no-join frustra; tempo real fecha o loop.

**Acceptance Criteria**:

1. WHEN o Player troca o avatar na arena THEN the system SHALL enviar update_avatar e fazer broadcast room_state com o novo avatar para toda a sala
2. WHEN o Player remove o avatar THEN the system SHALL enviar avatar null, limpar o localStorage e voltar a exibir iniciais em toda a sala
3. IF a imagem falhar ao carregar na mesa THEN the system SHALL exibir as iniciais do Apelido automaticamente
4. WHILE o avatar está sendo processado THEN the system SHALL manter o preview anterior visível e desabilitar os controles (input e botões) até concluir, sem congelar a página

**Independent Test**: Com dois clients na mesma sala, trocar a foto em um e ver atualizar no outro sem reload; remover e ver voltar às iniciais nos dois.

---

### P3: Espectador e consistência visual

**User Story**: As a espectador, I want meu avatar visível na lista de presentes para que eu seja reconhecível mesmo sem assento.

**Why P3**: Consistência com Q3; sem isso espectador fica invisível.

**Acceptance Criteria**:

1. WHERE o Player é espectador com avatar THEN the system SHALL exibir o avatar na lista de presentes com o mesmo fallback de erro da mesa
2. WHILE o avatar está ausente THEN the system SHALL exibir as iniciais do Apelido no círculo e na lista
3. The system SHALL exibir o microcopy "Visível para todos na sala" junto ao picker

**Independent Test**: Entrar como espectador com avatar e ver a foto na lista; entrar sem avatar e ver iniciais.

---

## Edge Cases

- IF o localStorage estiver indisponível ou cheio THEN the system SHALL manter fallback em memória na sessão e exibir iniciais sem quebrar o join
- IF dois Players usarem o mesmo Apelido THEN the system SHALL exibir cada avatar vinculado ao seu próprio Player id sem misturar
- WHEN o Player reconecta com o mesmo UUID THEN the system SHALL reidratar o avatar junto com assento e voto
- IF o payload do hello contiver avatar acima do teto THEN the system SHALL ignorar apenas o campo avatar e aceitar o join normalmente

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| AV-01 | P1: join + normalização 128px | T5, T7 | Verified |
| AV-02 | P1: persist localStorage + hello | T3, T5, T6 | Verified |
| AV-03 | P1: protocolo avatar teto 40KB | T1, T2 | Verified |
| AV-04 | P1: render mesa img + fallback | T8 | Verified |
| AV-05 | P1: picker join + erro inline | T7, T9 | Verified |
| AV-06 | P2: update_avatar + broadcast | T4, T6, T9 | Verified |
| AV-07 | P2: remover + onError iniciais | T4, T8, T9 | Verified |
| AV-08 | P3: espectador lista + microcopy | T7, T9 | Verified |

**ID format:** `[CATEGORY]-[NUMBER]` (e.g., `AUTH-01`, `CART-03`, `NOTIF-02`)

**Status values:** Pending → In Design → In Tasks → Implementing → Verified

**Coverage:** 8 total, 9 mapped to tasks, 0 unmapped

---

## Success Criteria

How we know the feature is successful:

- [ ] Upload no join reflete na mesa em < 5s com layout 44px intacto
- [ ] Reload mantém avatar via localStorage sem novo upload
- [ ] Troca na arena propaga para outro client sem reload
- [ ] Arquivo inválido/grande falha com mensagem inline e join segue funcionando
- [ ] Sem avatar ou com erro, iniciais permanecem legíveis
