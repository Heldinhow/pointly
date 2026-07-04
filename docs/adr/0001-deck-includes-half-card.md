# Deck includes ½ card

Mantemos 9 cartas no deck (`0, ½, 1, 2, 3, 5, 8, 13, ☕`) em vez de 8 sem o ½. O valor ½ é o único sub-inteiro comum na tradição de Planning Poker e serve para estimar tarefas triviais onde "0" seria "não vale nada" e "1" seria exagero. Remover agora e reintroduzir depois custa reflow do dock, retrabalho de cálculos estatísticos (média/mediana) e de copy — barato segurar 9 desde o v1.
