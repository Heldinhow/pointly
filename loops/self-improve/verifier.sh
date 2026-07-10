#!/usr/bin/env bash
# verifier.sh — gate determinístico para o loop self-improve do Pointly.
#
# Exit 0 = VERDE (todos os estágios passaram). Exit ≠ 0 = VERMELHO.
#
# Estágios (em ordem do mais rápido/barato para o mais lento):
#   1. typecheck     — bun run typecheck (todos os workspaces)
#   2. lint          — bun run lint (Biome)
#   3. test:shared   — packages/shared
#   4. test:server   — apps/server (bun test)
#   5. test:web      — apps/web (bun test + Testing Library)
#
# NÃO inclui:
#   - test:e2e (Playwright) — exige `bunx playwright install` e browser binaries.
#     Rodado fora do loop como gate humano (ver HUMAN-GATES.md → G2).
#   - build — typecheck já valida o type layer; build incremental local é caro e
#     quebraria o gate em todo save.
#
# Uso:
#   ./verifier.sh            # modo human (cores, summary)
#   ./verifier.sh json       # modo machine (uma linha JSON por estágio)
#   ./verifier.sh stage X    # roda só o estágio X (typecheck|lint|test:*)

set -uo pipefail

# Resolve o repo root a partir deste arquivo (loops/self-improve/verifier.sh → raiz)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

# Garante bun no PATH (instalado em ~/.bun/bin via install.ps1)
if ! command -v bun >/dev/null 2>&1; then
  if [ -x "$HOME/.bun/bin/bun" ]; then
    export PATH="$HOME/.bun/bin:$PATH"
  elif [ -x "/c/Users/$(whoami)/.bun/bin/bun.exe" ]; then
    export PATH="/c/Users/$(whoami)/.bun/bin:$PATH"
  else
    echo "ERRO: bun não encontrado no PATH e não está em ~/.bun/bin/" >&2
    echo "      Instale com: irm bun.sh/install.ps1 | iex" >&2
    exit 2
  fi
fi

MODE="${1:-human}"
ONLY_STAGE="${2:-}"

# Cores só em modo human + TTY
if [ "$MODE" = "human" ] && [ -t 1 ]; then
  GREEN="\033[0;32m"; RED="\033[0;31m"; YELLOW="\033[0;33m"; BOLD="\033[1m"; RESET="\033[0m"
else
  GREEN=""; RED=""; YELLOW=""; BOLD=""; RESET=""
fi

PASS=0
FAIL=0
JSON_RESULTS=()

# Detecta se o biome consegue produzir QUALQUER output. Em alguns ambientes
# Windows o binário nativo do biome carrega mas não escreve nada (problema
# conhecido com API set DLLs faltando em System32). Se --version sair vazio,
# tratamos o lint como SKIPPED (env), não como FAIL (código).
biome_works() {
  local probe
  probe=$(bun --bun ./node_modules/@biomejs/biome/bin/biome --version 2>&1 | tr -d '[:space:]')
  [ -n "$probe" ]
}

SKIPPED=0
run_stage() {
  local name="$1"
  local cmd="$2"
  local log="/tmp/pointly-verifier-${name//[:\/]/_}.log"

  if [ -n "$ONLY_STAGE" ] && [ "$ONLY_STAGE" != "$name" ]; then
    return 0
  fi

  # Lint tem fallback: se o biome estiver quebrado no ambiente, marca SKIPPED.
  if [ "$name" = "lint" ] && ! biome_works; then
    if [ "$MODE" = "json" ]; then
      echo "{\"stage\":\"$name\",\"status\":\"skipped\",\"reason\":\"biome.exe não produz output neste ambiente (DLLs Windows API set faltando em System32)\"}"
    else
      echo
      echo -e "${BOLD}▶ $name${RESET}"
      echo -e "  ${YELLOW}⊘ $name — SKIPPED${RESET}"
      echo "    biome.exe carrega mas não produz output (env limitation)."
      echo "    Isso NÃO conta como falha de código. Reativar quando o ambiente"
      echo "    tiver api-ms-win-* DLLs em C:\\Windows\\System32."
    fi
    SKIPPED=$((SKIPPED+1))
    return 0
  fi

  if [ "$MODE" = "json" ]; then
    if eval "$cmd" >"$log" 2>&1; then
      echo "{\"stage\":\"$name\",\"status\":\"pass\"}"
      PASS=$((PASS+1))
    else
      local code=$?
      echo "{\"stage\":\"$name\",\"status\":\"fail\",\"exit\":$code,\"log\":\"$log\"}"
      FAIL=$((FAIL+1))
    fi
    return 0
  fi

  # Modo human
  echo
  echo -e "${BOLD}▶ $name${RESET}"
  echo "  $ $cmd"

  if eval "$cmd" >"$log" 2>&1; then
    echo -e "  ${GREEN}✓ $name${RESET}"
    PASS=$((PASS+1))
  else
    local code=$?
    echo -e "  ${RED}✗ $name${RESET} (exit $code)"
    echo "  --- últimas 30 linhas (log completo em $log) ---"
    tail -30 "$log" 2>/dev/null | sed 's/^/  /'
    FAIL=$((FAIL+1))
  fi
}

run_stage "typecheck"   "bun run typecheck"
run_stage "lint"        "bun run lint"
run_stage "test:shared" "bun run test:shared"
run_stage "test:server" "bun run test:server"
run_stage "test:web"    "bun run test:web"

# Summary
if [ "$MODE" = "json" ]; then
  local_verdict="vermelho"
  [ $FAIL -eq 0 ] && local_verdict="verde"
  echo "{\"summary\":{\"pass\":$PASS,\"fail\":$FAIL,\"skipped\":$SKIPPED,\"verdict\":\"$local_verdict\"}}"
else
  echo
  echo "=========================================="
  if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}${BOLD}✓ verifier: VERDE${RESET}  ($PASS pass, $FAIL fail, $SKIPPED skipped)"
    echo -e "    ${GREEN}pode abrir PR${RESET}"
  else
    echo -e "${RED}${BOLD}✗ verifier: VERMELHO${RESET}  ($PASS pass, $FAIL fail, $SKIPPED skipped)"
    echo -e "    ${RED}bloqueado — corrigir antes de prosseguir${RESET}"
    echo "    logs em /tmp/pointly-verifier-*.log"
  fi
  echo "=========================================="
fi

exit $((FAIL > 0 ? 1 : 0))