import type { ProjectileThrownEvent } from "@planning-poker/shared";

type ProjectileListener = (event: ProjectileThrownEvent) => void;
const listeners: Set<ProjectileListener> = new Set();

/**
 * Event emitter simples para propagar eventos de arremessos de projéteis
 * do WebSocket direto para o componente animador sem re-renderizar todo o store.
 */
export const projectileEvents = {
	subscribe(listener: ProjectileListener) {
		listeners.add(listener);
		return () => {
			listeners.delete(listener);
		};
	},
	emit(event: ProjectileThrownEvent) {
		listeners.forEach((listener) => {
			try {
				listener(event);
			} catch (e) {
				console.error("Erro no listener de projétil", e);
			}
		});
	},
};
