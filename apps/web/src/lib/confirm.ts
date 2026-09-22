/**
 * Padrão de confirmação dupla da Arena: o primeiro toque arma, o segundo
 * dentro da janela confirma e o timeout desarma sem trafegar nada.
 * Usado pela Nova Rodada (#08) e por apagar história pontuada (#165).
 * A duração vai inline no countdown — nunca hardcoded no CSS.
 */
export const CONFIRM_TIMEOUT_MS = 5000;
