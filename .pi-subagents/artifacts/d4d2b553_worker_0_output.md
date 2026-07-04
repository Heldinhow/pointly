{
  "task": "T22 — Zustand store",
  "phase": "Phase 5 (Client core)",
  "status": "completed",
  "files_created": [
    "apps/web/src/store/sala.ts",
    "apps/web/src/store/sala.test.ts"
  ],
  "files_modified": [],
  "test_counts": {
    "store_specific": 29,
    "smoke_existing": 2,
    "total_web_tests": 31
  },
  "test_categories": [
    "actions (setSala, setCurrentPlayerId, upsertPlayer, removePlayerById, markVoted, applyReveal, resetForNewRound, setSalaEnded, pushToast, dismissToast, reset)",
    "critical detection (≤30s boundary)",
    "consensus lifecycle",
    "selectors (selectSala, selectPlayers, selectCurrentPlayer, selectPhase, selectTimer, selectVotes, selectConsensus, selectIsHost, selectIsOnlyPlayer)",
    "imutabilidade (upsertPlayer não muta array original, markVoted preserva identidade dos outros players)",
    "smoke end-to-end (setSala → upsert → vote → reveal → new round)"
  ],
  "selectors_exported": [
    "selectSala",
    "selectPlayers",
    "selectCurrentPlayer",
    "selectPhase",
    "selectTimer",
    "selectCritical",
    "selectRound",
    "selectVotes",
    "selectConsensus",
    "selectMySeat",
    "selectToast",
    "selectSalaEndedReason",
    "selectHost",
    "selectCode",
    "selectIsHost",
    "selectIsOnlyPlayer"
  ],
  "hooks_exported": [
    "useSala",
    "usePlayers",
    "useCurrentPlayer",
    "usePhase",
    "useTimer",
    "useCritical",
    "useRound",
    "useVotes",
    "useConsensus",
    "useMySeat",
    "useToast",
    "useCode",
    "useIsHost",
    "useIsOnlyPlayer",
    "useSalaEndedReason"
  ],
  "gates": {
    "test_web": "31 pass / 0 fail",
    "typecheck": "exit 0"
  },
  "commands_run": [
    {
      "command": "bun run test:web",
      "result": "passed",
      "summary": "31 tests, 78 expect() calls, exit 0"
    },
    {
      "command": "bun run --filter web typecheck",
      "result": "passed",
      "summary": "tsc --noEmit exit 0"
    }
  ],
  "validation_output": [
    "(pass) useSalaStore — actions: 16 tests",
    "(pass) useSalaStore — selectors: 9 tests",
    "(pass) useSalaStore — imutabilidade: 2 tests",
    "(pass) useSalaStore — smoke: 1 test",
    "(pass) web ↔ @planning-poker/shared workspace: 2 tests"
  ],
  "residual_risks": [
    "Seletores Zustand v5 precisam de useShallow em hooks React; sem isso, retornam nova referência a cada update. Implementado useShallow em todos os hooks exportados — testes unitários diretos em getState() não exercitam React render cycle (sem React Testing Library invocado nos testes do store; T31-T37 vão render real com RTL)."
  ],
  "spec_compliance": {
    "actions_required": "setSala, setCurrentPlayerId, upsertPlayer, removePlayerById, markVoted, applyReveal, resetForNewRound, setSalaEnded, pushToast, dismissToast",
    "actions_provided": "todas as 10 actions do spec",
    "selectors_required": "useSala, usePlayers, useCurrentPlayer, usePhase, useTimer, useCritical, useRound, useVotes, useConsensus, useMySeat",
    "selectors_provided": "todas as 10 hooks + 6 selectors auxiliares (selectHost, selectCode, selectIsHost, selectIsOnlyPlayer, selectSalaEndedReason, selectToast)",
    "tests_required": "≥4",
    "tests_provided": 29
  }
}