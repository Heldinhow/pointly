import type { Lang } from "./i18n";
import { safeGet, safeRemove, safeSet } from "./storage";

/**
 * Avatar local-first (AV-01/AV-02): normaliza o upload para 128x128 JPEG
 * q0.8 via canvas com crop central quadrado, e persiste o dataURL em
 * localStorage para reenvio no hello a cada join. Sem backend persistente.
 */

export const AVATAR_KEY = "pointly-avatar";
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
export const AVATAR_SIZE_PX = 128;

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

export type AvatarErrorCode =
	| "invalid_type"
	| "too_large"
	| "unreadable"
	| "unsupported";

/** Erro tipado do avatar — nunca throw cru (espelha `JoinError`). */
export class AvatarError extends Error {
	readonly code: AvatarErrorCode;

	constructor(code: AvatarErrorCode, message?: string) {
		super(message ?? code);
		this.name = "AvatarError";
		this.code = code;
	}
}

const MESSAGES: Record<AvatarErrorCode, string> = {
	invalid_type: "Use uma imagem png, jpeg ou webp.",
	too_large: "A imagem passa de 5MB. Escolha uma menor.",
	unreadable: "Não foi possível ler a imagem. Tente outra.",
	unsupported: "Este navegador não processa imagens. Segue com iniciais.",
};

const AVATAR_MESSAGES: Record<Lang, Record<AvatarErrorCode, string>> = {
	"pt-BR": MESSAGES,
	en: {
		invalid_type: "Use a png, jpeg or webp image.",
		too_large: "The image is over 5MB. Pick a smaller one.",
		unreadable: "Couldn't read the image. Try another one.",
		unsupported: "This browser can't process images. Initials it is.",
	},
};

export function avatarErrorMessage(
	code: AvatarErrorCode,
	lang: Lang = "pt-BR",
): string {
	return AVATAR_MESSAGES[lang][code];
}

interface DecodedImage {
	width: number;
	height: number;
	source: CanvasImageSource;
	cleanup: () => void;
}

async function decodeImage(file: File): Promise<DecodedImage> {
	if (typeof createImageBitmap === "function") {
		try {
			const bitmap = await createImageBitmap(file);
			return {
				width: bitmap.width,
				height: bitmap.height,
				source: bitmap,
				cleanup: () => bitmap.close(),
			};
		} catch {
			throw new AvatarError("unreadable", MESSAGES.unreadable);
		}
	}
	if (
		typeof Image !== "undefined" &&
		typeof URL !== "undefined" &&
		typeof URL.createObjectURL === "function"
	) {
		const url = URL.createObjectURL(file);
		try {
			const img = await new Promise<HTMLImageElement>((resolve, reject) => {
				const el = new Image();
				el.onload = () => resolve(el);
				el.onerror = () => reject(new Error("decode"));
				el.src = url;
			});
			return {
				width: img.naturalWidth || img.width,
				height: img.naturalHeight || img.height,
				source: img,
				cleanup: () => URL.revokeObjectURL(url),
			};
		} catch {
			URL.revokeObjectURL(url);
			throw new AvatarError("unreadable", MESSAGES.unreadable);
		}
	}
	throw new AvatarError("unsupported", MESSAGES.unsupported);
}

/**
 * Valida tipo/tamanho e normaliza para dataURL `image/jpeg` 128x128 q0.8
 * com crop central quadrado. Rejeita com `AvatarError` tipado — o chamador
 * exibe inline e mantém iniciais sem quebrar o join.
 */
export async function normalizeAvatar(file: File): Promise<string> {
	if (!ACCEPTED_TYPES.includes(file.type)) {
		throw new AvatarError("invalid_type", MESSAGES.invalid_type);
	}
	if (file.size > AVATAR_MAX_BYTES) {
		throw new AvatarError("too_large", MESSAGES.too_large);
	}
	let canvas: HTMLCanvasElement;
	try {
		canvas = document.createElement("canvas");
	} catch {
		throw new AvatarError("unsupported", MESSAGES.unsupported);
	}
	const ctx = canvas.getContext("2d");
	if (!ctx) {
		throw new AvatarError("unsupported", MESSAGES.unsupported);
	}
	const decoded = await decodeImage(file);
	try {
		const side = Math.min(decoded.width, decoded.height);
		if (!Number.isFinite(side) || side <= 0) {
			throw new AvatarError("unreadable", MESSAGES.unreadable);
		}
		const sx = (decoded.width - side) / 2;
		const sy = (decoded.height - side) / 2;
		canvas.width = AVATAR_SIZE_PX;
		canvas.height = AVATAR_SIZE_PX;
		ctx.drawImage(
			decoded.source,
			sx,
			sy,
			side,
			side,
			0,
			0,
			AVATAR_SIZE_PX,
			AVATAR_SIZE_PX,
		);
	} finally {
		decoded.cleanup();
	}
	let dataUrl: string;
	try {
		dataUrl = canvas.toDataURL("image/jpeg", 0.8);
	} catch {
		throw new AvatarError("unreadable", MESSAGES.unreadable);
	}
	if (!dataUrl.startsWith("data:image/jpeg")) {
		throw new AvatarError("unreadable", MESSAGES.unreadable);
	}
	return dataUrl;
}

/** Avatar persistido no dispositivo; null = iniciais. */
export function loadAvatar(): string | null {
	return safeGet(AVATAR_KEY);
}

export function saveAvatar(dataUrl: string): void {
	safeSet(AVATAR_KEY, dataUrl);
}

export function clearAvatar(): void {
	safeRemove(AVATAR_KEY);
}
