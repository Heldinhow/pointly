/**
 * sala_ended + sala_cheia UX — T41 (Phase 7).
 *
 * Conecta eventos S→C `sala_ended` e `error { code: 'sala_cheia' }` em:
 *  - Store updates (setSalaEnded)
 *  - Toasts informativos
 *  - Redirects: `/` para sala_ended, `/full` para sala_cheia
 *
 * **Pattern**:
 *  - `applySalaEndedEvent(store, event, hooks)` aplica no store + agenda redirect
 *  - `applyErrorEvent(store, event, hooks)` aplica no store + redireciona se sala_cheia
 *  - `createSalaEndLoop(...)` retorna `{ applySalaEnded, applyError, dispatch }`
 *
 * **Redirects** (via React Router):
 *  - `sala_ended { reason: 'last_left' }`       → `/`  com toast "Sala encerrada"
 *  - `sala_ended { reason: 'server_restart' }` → `/`  com toast error "Servidor reiniciou"
 *  - `sala_ended { reason: 'replaced' }`        → `/`  com toast "Outra aba assumiu"
 *  - `error { code: 'sala_cheia' }`              → `/full` com toast error "Sala cheia"
 *
 * **Hooks** (injetados pra testabilidade):
 *  - `navigate(path)` — wrapper sobre useNavigate
 *  - `toast.push(text, kind)` — wrapper sobre useToast
 *
 * **Testes** (≥3 integration tests):
 *  - sala_ended last_left → redirect / + toast
 *  - sala_ended server_restart → redirect / + error toast
 *  - sala_ended replaced → redirect / + toast
 *  - error sala_cheia → redirect /full + error toast
 *  - outros errors → apenas toast (sem redirect)
 *
 * @see .specs/features/planning-poker-v1/tasks.md T41
 * @see .specs/features/planning-poker-v1/spec.md F-005, F-007, F-036, F-039
 */
import type {
	ErrorEvent,
	SalaEndedEvent,
	ServerToClientEvent,
} from "@planning-poker/shared";
import type { ToastKind } from "../components/ui/toast";
import type { SalaStore } from "../store/sala";

/** Hooks injetados pra testabilidade (sem depender de useNavigate/useToast). */
export interface SalaEndHooks {
	/** Wrapper sobre useNavigate (ex: (path) => navigate(path)). */
	navigate: (path: string) => void;
	/** Wrapper sobre useToast().push (ex: (text, kind) => toast.push(text, kind)). */
	pushToast: (text: string, kind?: ToastKind) => void;
}

/** Aplica `sala_ended` no store + agenda redirect. */
export function applySalaEndedEvent(
	store: SalaStore,
	event: SalaEndedEvent,
	hooks: SalaEndHooks,
): void {
	store.setSalaEnded(event.reason);

	switch (event.reason) {
		case "last_left":
			hooks.pushToast("Sala encerrada — último jogador saiu.", "info");
			hooks.navigate("/");
			break;
		case "server_restart":
			hooks.pushToast(
				"Servidor reiniciou. Sala encerrada — reconecte.",
				"error",
			);
			hooks.navigate("/");
			break;
		case "replaced":
			hooks.pushToast("Outra aba assumiu o lugar desta.", "info");
			hooks.navigate("/");
			break;
	}
}

/** Aplica `error` no store + redireciona se sala_cheia. */
export function applyErrorEvent(
	store: SalaStore,
	event: ErrorEvent,
	hooks: SalaEndHooks,
): void {
	switch (event.code) {
		case "sala_cheia":
			store.setSalaEnded("last_left");
			hooks.pushToast(
				event.message ?? "Sala cheia — 12/12 jogadores.",
				"error",
			);
			hooks.navigate("/full");
			break;
		case "sala_nao_encontrada":
			hooks.pushToast(event.message ?? "Sala não encontrada.", "error");
			// Não redireciona — caller pode retry
			break;
		case "invalid_nick":
		case "invalid_phase":
		case "invalid_vote":
		case "rate_limited":
		case "internal_error":
		case "role_denied":
			hooks.pushToast(event.message ?? `Erro: ${event.code}`, "error");
			break;
	}
}

/** Cria o sala-end loop. */
export function createSalaEndLoop(store: SalaStore, hooks: SalaEndHooks) {
	return {
		applySalaEnded: (event: SalaEndedEvent) =>
			applySalaEndedEvent(store, event, hooks),
		applyError: (event: ErrorEvent) => applyErrorEvent(store, event, hooks),
		dispatch: (event: ServerToClientEvent) => {
			if (event.type === "sala_ended") {
				applySalaEndedEvent(store, event.payload, hooks);
			} else if (event.type === "error") {
				applyErrorEvent(store, event.payload, hooks);
			}
		},
	};
}
