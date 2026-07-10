#!/usr/bin/env bash
# auto-close-merged.sh — fecha issues cujo PR foi mergeado sem "Closes #N".
#
# Por que existe: PRs mergeados no GitHub só auto-fecham issues referenciadas
# se o body (ou comentário) contiver a keyword mágica "Closes #N", "Fixes #N"
# ou "Resolves #N". Se o PR só menciona "(#N)" no título ou usa o nome de
# branch `loop/issue-N`, a issue fica aberta na fila do self-improve para
# sempre — mesmo com o fix já em main.
#
# Estratégia de mapeamento PR → issue (em ordem):
#   1. Branch name `loop/issue-N` → issue N
#   2. Título contém `(#N)` → issue N
#   3. Body contém `Closes #N` / `Fixes #N` / `Resolves #N` → issue N
#
# Comportamento por issue candidata:
#   - Já CLOSED → pulada (OK, nada a fazer)
#   - Body do PR já tem keyword mágica → pulada (GitHub auto-fechou; resto é idempotente)
#   - OPEN sem auto-close → CANDIDATA (proposta para fechamento manual/automático)
#
# Uso:
#   ./loops/self-improve/auto-close-merged.sh             # dry-run (padrão — só lista)
#   ./loops/self-improve/auto-close-merged.sh --apply     # fecha de fato (com confirmação)
#
# Variáveis:
#   REPO        — repo alvo (default Heldinhow/pointly)
#   DAYS_BACK   — janela de busca de PRs mergeados (default 30)
#   NO_CONFIRM  — se setada, pula confirmação interativa em --apply
#
# Dependências: gh CLI. NÃO requer python/jq — usa gh --jq + grep/sed para
# parsear o JSON retornado.

set -uo pipefail

REPO="${REPO:-Heldinhow/pointly}"
DAYS_BACK="${DAYS_BACK:-30}"
MODE="${1:-dry-run}"
APPLY=false
if [ "$MODE" = "--apply" ]; then
	APPLY=true
elif [ "$MODE" != "dry-run" ] && [ "$MODE" != "--dry-run" ]; then
	echo "Uso: $0 [dry-run | --apply]" >&2
	exit 2
fi

# Cores (TTY only)
if [ -t 1 ]; then
	GREEN="\033[0;32m"
	YELLOW="\033[0;33m"
	RED="\033[0;31m"
	BOLD="\033[1m"
	RESET="\033[0m"
else
	GREEN=""
	YELLOW=""
	RED=""
	BOLD=""
	RESET=""
fi

if ! command -v gh >/dev/null 2>&1; then
	echo -e "${RED}ERRO: gh CLI não encontrado no PATH${RESET}" >&2
	exit 1
fi

# ---------------------------------------------------------------------------
# 1. Lista PRs mergeados
# ---------------------------------------------------------------------------

echo -e "${BOLD}▸ Buscando PRs mergeados em $REPO (últimos ${DAYS_BACK}d)...${RESET}"

prs_json=$(gh pr list \
	--repo "$REPO" \
	--state merged \
	--limit 100 \
	--json number,title,headRefName,body,mergedAt 2>&1) || {
	echo -e "${RED}ERRO ao listar PRs: $prs_json${RESET}" >&2
	exit 1
}

# Conta PRs (grep em vez de jq)
pr_count=$(printf '%s' "$prs_json" | grep -o '"number":' | wc -l | tr -d ' ')
echo "  Encontrados: $pr_count PRs."
echo

# ---------------------------------------------------------------------------
# 2. Para cada PR, infere issue # e verifica estado
#    Loop no MESMO shell (sem pipe em subshell) para preservar contadores.
# ---------------------------------------------------------------------------

candidates=()        # entries: "issue_num|pr_num|heuristic"
closed_count=0
skipped_count=0
error_count=0

# Converte array JSON em linhas (cada PR = 1 linha)
# Truque: insere newline entre "},{" para split em objetos
pr_lines=$(printf '%s' "$prs_json" | sed 's/},{/}\n{/g' | sed 's/^\[//; s/\]$//' | grep -E '^\{')

while IFS= read -r pr_obj; do
	[ -z "$pr_obj" ] && continue

	# Extrai campos via grep regex (sem jq). Schema estável do `gh pr list --json`.
	pr_num=$(echo "$pr_obj" | grep -oE '"number":[0-9]+' | head -1 | grep -oE '[0-9]+$')
	pr_title=$(echo "$pr_obj" | grep -oE '"title":"[^"]*"' | head -1 | sed 's/^"title":"//; s/"$//')
	branch=$(echo "$pr_obj" | grep -oE '"headRefName":"[^"]*"' | head -1 | sed 's/^"headRefName":"//; s/"$//')
	merged_at=$(echo "$pr_obj" | grep -oE '"mergedAt":"[^"]*"' | head -1 | sed 's/^"mergedAt":"//; s/"$//')
	body=$(echo "$pr_obj" | grep -oE '"body":"[^"]*"' | head -1 | sed 's/^"body":"//; s/"$//; s/\\n/ /g; s/\\"/"/g')

	# Heurística 1: branch `loop/issue-N`
	issue_num=""
	heuristic=""
	if [[ "$branch" =~ loop/issue-([0-9]+) ]]; then
		issue_num="${BASH_REMATCH[1]}"
		heuristic="branch"
	# Heurística 2: título contém "(#N)"
	elif [[ "$pr_title" =~ \(#([0-9]+)\) ]]; then
		issue_num="${BASH_REMATCH[1]}"
		heuristic="title"
	# Heurística 3: body contém keyword mágica
	elif [[ "$body" =~ (Closes|Fixes|Resolves)\s+#([0-9]+) ]]; then
		issue_num="${BASH_REMATCH[2]}"
		heuristic="body-keyword"
	fi

	# Se body JÁ tem "Closes #N" → GitHub auto-fechou.
	if [ -n "$issue_num" ] && [[ "$body" =~ (Closes|Fixes|Resolves)\s+#$issue_num([[:space:]]|,|$|\.) ]]; then
		echo -e "  ${GREEN}SKIP${RESET} PR #$pr_num — body já tem Closes/Fixes/Resolves #$issue_num (auto-fechado pelo GitHub)"
		skipped_count=$((skipped_count + 1))
		continue
	fi

	if [ -z "$issue_num" ]; then
		echo -e "  ${YELLOW}SKIP${RESET} PR #$pr_num — não foi possível inferir issue (branch='$branch')"
		skipped_count=$((skipped_count + 1))
		continue
	fi

	# Verifica estado atual da issue
	issue_state=$(gh issue view "$issue_num" --repo "$REPO" --json state --jq '.state' 2>/dev/null) || {
		echo -e "  ${RED}ERROR${RESET} PR #$pr_num → issue #$issue_num: gh issue view falhou"
		error_count=$((error_count + 1))
		continue
	}

	if [ "$issue_state" = "CLOSED" ]; then
		echo -e "  ${GREEN}OK${RESET}   PR #$pr_num → issue #$issue_num já CLOSED (heuristic: $heuristic)"
		closed_count=$((closed_count + 1))
		continue
	fi

	# Candidata!
	echo -e "  ${YELLOW}CAND${RESET}  PR #$pr_num → issue #$issue_num OPEN (heuristic: $heuristic, merged: $merged_at)"
	candidates+=("$issue_num|$pr_num|$heuristic")
done <<<"$pr_lines"

echo
echo -e "${BOLD}==========================================${RESET}"
echo -e "Total: $pr_count PRs"
echo -e "  Já fechadas:        ${GREEN}$closed_count${RESET}"
echo -e "  Puladas (sem ref):  $skipped_count"
echo -e "  Erros:              ${RED}$error_count${RESET}"
echo -e "  ${YELLOW}Candidatas:           ${#candidates[@]}${RESET}"
echo

if [ ${#candidates[@]} -eq 0 ]; then
	echo -e "${GREEN}Nada para fechar. ✓${RESET}"
	exit 0
fi

# ---------------------------------------------------------------------------
# 3. Dry-run vs apply
# ---------------------------------------------------------------------------

if [ "$APPLY" = false ]; then
	echo -e "${BOLD}DRY-RUN.${RESET} Para fechar de fato:"
	echo "  $0 --apply"
	exit 0
fi

# Confirmação interativa (skip se NO_CONFIRM=1 ou stdin não é TTY)
if [ "${NO_CONFIRM:-0}" != "1" ] && [ -t 0 ]; then
	echo -e "${BOLD}Confirma fechar ${#candidates[@]} issue(s)?${RESET}"
	printf "  Digite 'yes' para confirmar (ou Enter para cancelar): "
	read -r confirm
	if [ "$confirm" != "yes" ]; then
		echo "Cancelado."
		exit 0
	fi
	echo
fi

echo -e "${BOLD}Fechando ${#candidates[@]} issue(s)...${RESET}"
ok=0
fail=0
for entry in "${candidates[@]}"; do
	IFS='|' read -r issue_num pr_num heuristic <<<"$entry"
	printf "  issue #%s (PR #%s) ... " "$issue_num" "$pr_num"
	comment="Fechada por auto-close-merged.sh: PR #${pr_num} foi mergeado em main sem a keyword 'Closes #${issue_num}', mas o fix está em main (heuristic: ${heuristic})."
	if gh issue close "$issue_num" --repo "$REPO" --comment "$comment" >/dev/null 2>&1; then
		echo -e "${GREEN}fechada ✓${RESET}"
		ok=$((ok + 1))
	else
		echo -e "${RED}falhou${RESET}"
		fail=$((fail + 1))
	fi
done

echo
echo -e "${BOLD}==========================================${RESET}"
echo -e "Fechadas: ${GREEN}$ok${RESET}  |  Falhas: ${RED}$fail${RESET}"
exit $((fail > 0 ? 1 : 0))