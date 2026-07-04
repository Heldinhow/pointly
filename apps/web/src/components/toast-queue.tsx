/**
 * Toast queue — T37 (Phase 6).
 *
 * Componente invisível que escuta mudanças no `useSalaStore` e dispara toasts
 * via `useToast()`. Deve ser montado dentro de `<ToastProvider>` em `App.tsx`
 * (T26 já configura isso).
 *
 * **Eventos que disparam toasts**:
 *  - `vote_cast { kind: 'individual', playerName }` → "{playerName} escolheu uma carta."
 *  - `vote_cast { kind: 'aggregate', count }`       → "Mais {count} escolheram."
 *  - Mudança de phase idle → voting + 1º voto        → "Rodada iniciada."
 *  - `votes_revealed`                                  → "Mediana: {median}" (se unanimity=false)
 *                                                       ou "Unanimous!" (se true)
 *  - `sala_ended { reason: 'last_left' }`              → "Sala encerrada — último jogador saiu."
 *  - `error { code: 'invalid_phase' }`                 → "Aguarde o reveal para nova rodada."
 *  - `error { code: 'sala_cheia' }`                    → "Sala cheia — 12/12."
 *
 * **Implementação**:
 *  - Subscribe ao store via `useSalaStore.subscribe` (Zustand v5)
 *  - Mantém last-seen sala ref pra detectar transições
 *  - Reage a:
 *    - increase em votedCount (vote_cast)
 *    - mudança de phase (idle → voting, voting → revealed)
 *    - consensus becoming non-null (votes_revealed)
 *    - salaEndedReason becoming non-null (sala_ended)
 *
 * **A11y**:
 *  - role="status" + aria-live="polite" (delegado ao ToastProvider — T26)
 *  - role="alert" + aria-live="assertive" pra erros (kind="error")
 *
 * @see .specs/features/planning-poker-v1/tasks.md T37
 * @see .specs/features/planning-poker-v1/spec.md F-008, F-022
 */
import { useEffect, useRef } from "react";
import { useSalaStore } from "../store/sala";
import { useToast } from "./ui/toast";

/** Componente invisível que só dispara toasts. */
export function ToastQueue() {
	const toast = useToast();
	const sala = useSalaStore((s) => s.sala);
	const consensus = useSalaStore((s) => s.consensus);
	const salaEndedReason = useSalaStore((s) => s.salaEndedReason);

	/** Refs pra detectar transições (vs render repetido com mesmo valor). */
	const prevPhase = useRef<string | null>(null);
	const prevVotedCount = useRef<number>(0);
	const prevConsensus = useRef<typeof consensus>(null);
	const prevEndedReason = useRef<string | null>(null);

	useEffect(() => {
		if (!sala) {
			// Reset refs quando sala some
			prevPhase.current = null;
			prevVotedCount.current = 0;
			prevConsensus.current = null;
			prevEndedReason.current = null;
			return;
		}

		const votedCount = sala.players.filter((p) => p.hasVoted).length;
		const phase = sala.phase;

		// 1) Detecta 1º voto (idle → voting)
		if (
			prevPhase.current !== null &&
			prevPhase.current === "idle" &&
			phase !== "idle"
		) {
			toast.push("Rodada iniciada.", "info");
		}

		// 2) Detecta increase em votedCount
		if (votedCount > prevVotedCount.current && votedCount > 0) {
			const delta = votedCount - prevVotedCount.current;
			// 1º voto: toast individual (no caso real, server manda vote_cast individual,
			// mas aqui simplificamos mostrando "Alguém votou" pro 1º).
			if (votedCount === 1) {
				toast.push("Alguém escolheu uma carta.", "info");
			} else if (delta > 1) {
				// Aggregate: server manda `vote_cast { kind: 'aggregate', count: N }`
				toast.push(`Mais ${delta} escolheram.`, "info");
			} else {
				// Individual: server manda `vote_cast { kind: 'individual', name }`
				toast.push("Mais alguém escolheu uma carta.", "info");
			}
		}

		// 3) Detecta reveal (consensus aparece)
		if (consensus && consensus !== prevConsensus.current) {
			if (consensus.unanimous) {
				toast.push("★ Unanimous!", "success");
			} else if (consensus.median !== null) {
				toast.push(`Mediana: ${consensus.median}`, "success");
			} else {
				toast.push("Votos revelados.", "success");
			}
		}

		// 4) Detecta sala_ended
		if (salaEndedReason && salaEndedReason !== prevEndedReason.current) {
			if (salaEndedReason === "last_left") {
				toast.push("Sala encerrada — último jogador saiu.", "info");
			} else if (salaEndedReason === "server_restart") {
				toast.push("Servidor reiniciou. Reconecte.", "error");
			} else if (salaEndedReason === "replaced") {
				toast.push("Outra aba tomou o lugar desta.", "info");
			}
		}

		// Update refs
		prevPhase.current = phase;
		prevVotedCount.current = votedCount;
		prevConsensus.current = consensus;
		prevEndedReason.current = salaEndedReason;
	}, [sala, consensus, salaEndedReason, toast]);

	return null;
}
