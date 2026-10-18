# Pointly — feature map

Verification source for `verify-pointly`. One file per user-facing feature; each answers what it is, how to reach it from the user's POV, how to drive it, and what observable end state proves it works. A proof driven through one convenience entry point is incomplete when the map lists others.

Harness: `openchamber_web`. Evidence goes to `/tmp/pointly-verify/`.

| Feature | Entry point | Proves |
| --- | --- | --- |
| [Entrada](entrada.md) | `/join` | create/join/spectate/avatar → `/s/<CODE>` |
| [Mesa e votação](mesa-votacao.md) | `/s/<CODE>` | vote → reveal → results |
| [Pauta](pauta.md) | `/s/<CODE>` agenda | story CRUD + deck gate |
| [Interações e convite](interacoes.md) | `/s/<CODE>` table | projectile/nudge reload, invite copy, leave confirmation, reconnect |
| [Páginas públicas](paginas-publicas.md) | `/`, `/planning-poker`, `/guias` | content, i18n, theme |
