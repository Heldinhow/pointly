# Publicar o protocolo de reconexão v2

## Escopo

Este procedimento acompanha a separação entre `Player` interno e `PublicPlayer`, a projeção de votos por destinatário e a rotação da identidade local. Não executa deploy automaticamente.

O cliente usa `pointly-uuid-v2` e envia `protocolVersion: 2` no hello. O backend exige essa versão. A versão é pública e não substitui o segredo de reconexão.

## Antes de publicar

1. Obtenha autorização para a interrupção das salas efêmeras. O estado está em memória e será descartado.
2. Identifique todas as instâncias de backend e os destinos das rotas WebSocket no ambiente real.
3. Construa frontend e backend do mesmo commit revisado. Execute `bun run verify` e a validação do transporte WebSocket local.
4. Prepare uma janela de manutenção que impeça upgrades e reconexões ao backend antigo. Interrompa também as conexões WebSocket existentes.

## Publicação

1. Bloqueie o acesso ao backend antigo antes de disponibilizar o frontend novo.
2. Encerre todas as instâncias antigas. Não preserve seus mapas de salas e identidades.
3. Inicie somente instâncias do backend corrigido.
4. Publique o frontend correspondente e confirme que o tráfego WebSocket aponta exclusivamente ao backend corrigido.
5. Libere o acesso e peça reload das páginas antigas. Clientes sem a versão do hello não são compatíveis.
6. Execute uma sessão de teste autorizada com dois jogadores e um espectador.

Não use um rolling deploy que misture as duas versões. O backend antigo pode aceitar o hello novo, ignorar o campo de versão e transmitir a identidade nova aos demais participantes. A rejeição do snapshot pelo frontend novo não impede esse vazamento.

## Validação depois da publicação

- Confirme o commit efetivo de ambos os artefatos e os destinos de todas as rotas WebSocket.
- Um hello sem versão não pode receber welcome nem criar uma sala.
- Em `voting` e `revealable`, o jogador recebe somente seu próprio voto. Outros jogadores e espectadores veem `hasVoted`, mas não o valor.
- Nenhum welcome ou broadcast pode conter a propriedade `uuid` dos participantes.
- Atualizações de pauta e avatar devem manter o mesmo sigilo.
- Reload deve recuperar o assento e o próprio voto, sem expor a identidade a outros participantes.
- Reveal deve mostrar os votos. Nova rodada deve limpar valores e seleções.

Não registre credenciais reais em logs, screenshots ou relatórios compartilhados.

## Se houver falha

Bloqueie o acesso e corrija o par de artefatos. Não faça rollback para o backend vulnerável enquanto houver clientes com identidades novas em uso.

Se um frontend novo tiver alcançado um backend antigo, trate a nova geração de identidades como potencialmente exposta. Uma nova rotação requer outra chave local, bloqueio de clientes incompatíveis e descarte dos mapas antes de reabrir o serviço. Não afirme revogação com base apenas no campo `protocolVersion`.
