import type {
	ProjectileType,
	ServerToClientEvent,
} from "@planning-poker/shared";
import { projectileEvents } from "./projectile-events";
import type { WSClient } from "./ws-client";

/**
 * Envia mensagem `throw_projectile` para o servidor via WebSocket.
 */
export function throwProjectile(
	ws: WSClient,
	targetPlayerId: string,
	projectileType: ProjectileType,
): void {
	ws.send({
		type: "throw_projectile",
		payload: { targetPlayerId, projectileType },
	});
}

/**
 * Cria o loop de projéteis no cliente: throwProjectile + dispatch de eventos do WebSocket.
 */
export function createProjectileLoop(ws: WSClient) {
	return {
		/** Dispara arremesso pro servidor. */
		throwProjectile: (targetPlayerId: string, projectileType: ProjectileType) =>
			throwProjectile(ws, targetPlayerId, projectileType),

		/** Dispatcher: recebe eventos S→C e propaga projectile_thrown. */
		dispatch: (event: ServerToClientEvent) => {
			if (event.type === "projectile_thrown") {
				projectileEvents.emit(event.payload);
			}
		},
	};
}
