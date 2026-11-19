/**
 * Padrão de confirmação dupla para apagar história pontuada (#165): o
 * primeiro toque arma, o segundo dentro da janela confirma e o timeout
 * desarma sem trafegar nada. A duração vai inline no countdown — nunca
 * hardcoded no CSS.
 */
export const CONFIRM_TIMEOUT_MS = 5000;
