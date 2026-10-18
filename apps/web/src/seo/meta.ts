export const META_DESCRIPTION_SELECTOR = 'meta[name="description"]';

/** Upsert (ou remove com `null`) a meta description da página atual. */
export function syncMetaDescription(
	content: string | null,
	doc: Document = document,
): void {
	const head = doc.head;
	if (!head) return;
	const existing = head.querySelector(META_DESCRIPTION_SELECTOR);

	if (content === null) {
		existing?.remove();
		return;
	}
	if (existing) {
		existing.setAttribute("content", content);
		return;
	}
	const meta = doc.createElement("meta");
	meta.setAttribute("name", "description");
	meta.setAttribute("content", content);
	head.appendChild(meta);
}
