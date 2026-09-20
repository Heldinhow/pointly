import { afterEach, describe, expect, test } from "bun:test";
import {
	AVATAR_MAX_BYTES,
	AvatarError,
	avatarErrorMessage,
	clearAvatar,
	loadAvatar,
	normalizeAvatar,
	saveAvatar,
} from "./avatar";

const JPEG_PREFIX = "data:image/jpeg;base64,";

function fileOf(type: string, size: number, name = "foto"): File {
	const bytes = new Uint8Array(Math.min(size, 1024));
	return new File([bytes], name, { type });
}

/** Canvas 2d falso: jsdom não tem canvas real; normalização é mockada no nível do decode+draw. */
function canvasProto(): Record<string, unknown> {
	const ctor = (window as unknown as Record<string, unknown>)
		.HTMLCanvasElement as unknown as { prototype: Record<string, unknown> };
	return ctor.prototype;
}

/** Captura do pipeline de canvas para ancorar dims/qualidade/crop (P1-AC1). */
interface CanvasCapture {
	width: number | null;
	height: number | null;
	toDataURLArgs: unknown[];
	drawImageArgs: unknown[];
}

function mockCanvasPipeline(captured?: CanvasCapture): CanvasCapture {
	const cap: CanvasCapture = captured ?? {
		width: null,
		height: null,
		toDataURLArgs: [],
		drawImageArgs: [],
	};
	const proto = canvasProto();
	proto.getContext = () => ({
		drawImage: (...args: unknown[]) => {
			cap.drawImageArgs = args;
		},
	});
	proto.toDataURL = function (
		this: { width: number; height: number },
		...args: unknown[]
	) {
		cap.width = this.width;
		cap.height = this.height;
		cap.toDataURLArgs = args;
		return `${JPEG_PREFIX}MOCK128`;
	};
	(globalThis as Record<string, unknown>).createImageBitmap = async () => ({
		width: 200,
		height: 100,
		close: () => {},
	});
	return cap;
}

afterEach(() => {
	window.localStorage.clear();
	clearAvatar();
});

describe("normalizeAvatar", () => {
	test("png normaliza para dataURL jpeg 128px", async () => {
		mockCanvasPipeline();
		const out = await normalizeAvatar(fileOf("image/png", 1024, "a.png"));
		expect(out.startsWith(JPEG_PREFIX)).toBe(true);
	});

	test("jpeg normaliza para dataURL jpeg 128px", async () => {
		mockCanvasPipeline();
		const out = await normalizeAvatar(fileOf("image/jpeg", 2048, "a.jpg"));
		expect(out.startsWith(JPEG_PREFIX)).toBe(true);
	});

	test("webp normaliza para dataURL jpeg 128px", async () => {
		mockCanvasPipeline();
		const out = await normalizeAvatar(fileOf("image/webp", 2048, "a.webp"));
		expect(out.startsWith(JPEG_PREFIX)).toBe(true);
	});

	test("ancora 128x128 jpeg q0.8 e crop central (P1-AC1)", async () => {
		const cap = mockCanvasPipeline();
		const out = await normalizeAvatar(fileOf("image/png", 1024, "a.png"));
		expect(out.startsWith(JPEG_PREFIX)).toBe(true);
		expect(cap.width).toBe(128);
		expect(cap.height).toBe(128);
		expect(cap.toDataURLArgs).toEqual(["image/jpeg", 0.8]);
		// Bitmap 200x100 → lado 100, sx 50, sy 0; destino 0,0 128x128.
		const [, sx, sy, sideW, sideH, dx, dy, dw, dh] = cap.drawImageArgs;
		expect(sx).toBe(50);
		expect(sy).toBe(0);
		expect(sideW).toBe(100);
		expect(sideH).toBe(100);
		expect([dx, dy, dw, dh]).toEqual([0, 0, 128, 128]);
	});

	test("formato inválido rejeita com erro tipado sem throw cru", async () => {
		const promise = normalizeAvatar(fileOf("image/gif", 1024, "a.gif"));
		await expect(promise).rejects.toBeInstanceOf(AvatarError);
		await promise.catch((error: AvatarError) => {
			expect(error.code).toBe("invalid_type");
			expect(error.message).toMatch(/png, jpeg ou webp/i);
		});
	});

	test("arquivo acima de 5MB rejeita com erro tipado", async () => {
		const big = fileOf("image/png", AVATAR_MAX_BYTES + 1, "grande.png");
		Object.defineProperty(big, "size", { value: AVATAR_MAX_BYTES + 1 });
		const promise = normalizeAvatar(big);
		await expect(promise).rejects.toBeInstanceOf(AvatarError);
		await promise.catch((error: AvatarError) => {
			expect(error.code).toBe("too_large");
		});
	});

	test("sem canvas cria erro tipado unsupported em vez de throw cru", async () => {
		const proto = canvasProto();
		proto.getContext = () => null;
		const promise = normalizeAvatar(fileOf("image/png", 512, "a.png"));
		await expect(promise).rejects.toBeInstanceOf(AvatarError);
		await promise.catch((error: AvatarError) => {
			expect(error.code).toBe("unsupported");
		});
	});
});

describe("avatarErrorMessage", () => {
	test("mensagens em pt-BR por código", () => {
		expect(avatarErrorMessage("invalid_type")).toMatch(/png, jpeg ou webp/i);
		expect(avatarErrorMessage("too_large")).toMatch(/5MB/);
	});
	test("mensagens em EN por código", () => {
		expect(avatarErrorMessage("invalid_type", "en")).toMatch(
			/png, jpeg or webp/i,
		);
		expect(avatarErrorMessage("unsupported", "en")).toMatch(/can't process/);
	});
});

describe("loadAvatar/saveAvatar/clearAvatar", () => {
	test("roundtrip persiste o dataURL na chave pointly-avatar", () => {
		saveAvatar(`${JPEG_PREFIX}ABC`);
		expect(loadAvatar()).toBe(`${JPEG_PREFIX}ABC`);
		expect(window.localStorage.getItem("pointly-avatar")).toBe(
			`${JPEG_PREFIX}ABC`,
		);
	});

	test("sem avatar retorna null", () => {
		expect(loadAvatar()).toBeNull();
	});

	test("clear apaga e volta a null", () => {
		saveAvatar(`${JPEG_PREFIX}ABC`);
		clearAvatar();
		expect(loadAvatar()).toBeNull();
	});

	test("localStorage indisponível cai no fallback em memória sem quebrar", () => {
		const setItem = window.localStorage.setItem;
		const getItem = window.localStorage.getItem;
		window.localStorage.setItem = () => {
			throw new Error("cheio");
		};
		window.localStorage.getItem = () => {
			throw new Error("indisponível");
		};
		try {
			saveAvatar(`${JPEG_PREFIX}MEM`);
			expect(loadAvatar()).toBe(`${JPEG_PREFIX}MEM`);
		} finally {
			window.localStorage.setItem = setItem;
			window.localStorage.getItem = getItem;
		}
	});
});
