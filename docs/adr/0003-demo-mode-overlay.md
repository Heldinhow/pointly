# Empty overlay is honest about Demo Mode

> **Status: superseded by [0005](./0005-v1-functional-in-memory-state.md)** — sem bots, sem Demo Mode. Sala vazia é estado legítimo (zero jogadores reais) e o overlay "Convide outros" volta como copy original.

O overlay "Convide outros" é substituído por um banner "Demo Mode" que explica ao usuário que 11 bots vão simular votos automaticamente. A copy original dizia "Você é o único na sala agora. Compartilhe o link..." — desonesto, porque no wireframe os bots estão sempre lá. Em produção multiplayer o overlay volta como estado "sala vazia" legítimo (zero jogadores além de você); no wireframe, esse estado nunca acontece. Trade-off aceito: honestidade do demo vs. fidelidade ao copy original da spec.
