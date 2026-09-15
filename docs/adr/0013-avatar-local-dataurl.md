# Avatar local via dataURL + hello/update_avatar

Sem contas e sem storage, Avatar é upload próprio normalizado no browser para 128x128 JPEG q0.8 (~8-15KB, teto 40KB validado no zod), persistido em `localStorage` e reenviado via `hello`, com troca mid-sala via `update_avatar` + broadcast `room_state`.

## Considered Options

- **S3/R2 com presigned upload**: exige nova infra, bucket, credenciais e rota de upload para salas efêmeras — overkill pro v1 sem contas.
- **Bytes/base64 full-size na sala em memória**: 1 foto de celular (3MB) x 24 players incha `room_state` e estoura `localStorage` (~5MB).
- **Avatar gerado (DiceBear/identicon) ou URL externa**: zero upload, mas não atende "trocar imagem do perfil" com foto própria; URL externa vaza IP e quebra sem moderação.

## Consequences

- `PlayerSchema`, `HelloPayload`, `TablePlayer` e `PersistedSession` ganham `avatar?: string` (dataURL); zod recusa acima do teto sem derrubar o `hello`.
- Crop quadrado central automático via canvas + `object-fit: cover`; entrada só `png/jpeg/webp`, recusa >5MB antes de processar.
- Mesa substitui iniciais por `<img>` quando há `avatar`, com `onError→iniciais` e botão Remover; mesma âncora `data-projectile-player`.
- Imagem trafega no `room_state` (pública da sala) — picker exibe "Visível para todos na sala"; vale para votante + espectador.
