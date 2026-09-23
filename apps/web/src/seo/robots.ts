/**
 * Meta robots em runtime (SPA).
 *
 * O HTML pré-renderizado já traz `noindex` nas rotas não indexáveis e o
 * serve-web manda `X-Robots-Tag: noindex` no shell de `/join` e `/s/*`; aqui
 * o `<meta name="robots">` acompanha a rota atual na navegação client-side.
 * Sem isso, um `noindex` herdado de `/404` ou do shell seguiria para uma rota
 * pública depois de um clique — ruído de indexação no GSC.
 */

export const ROBOTS_META_SELECTOR = 'meta[name="robots"]';

/** Garante `noindex` em rota não indexável e o remove em rota indexável. */
export function syncRobotsMeta(
	indexable: boolean,
	doc: Document = document,
): void {
	const head = doc.head;
	if (!head) return;
	const existing = head.querySelector(ROBOTS_META_SELECTOR);

	if (indexable) {
		existing?.remove();
		return;
	}
	if (existing) {
		existing.setAttribute("content", "noindex");
		return;
	}
	const meta = doc.createElement("meta");
	meta.setAttribute("name", "robots");
	meta.setAttribute("content", "noindex");
	head.appendChild(meta);
}
