import { afterEach, describe, expect, test } from "bun:test";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AvatarPicker } from "./avatar-picker";
import { AVATAR_MAX_BYTES } from "../lib/avatar";

const AVATAR = "data:image/jpeg;base64,AAA";

function mockCanvasPipeline(): void {
	const ctor = (window as unknown as Record<string, unknown>)
		.HTMLCanvasElement as unknown as { prototype: Record<string, unknown> };
	ctor.prototype.getContext = () => ({ drawImage: () => {} });
	ctor.prototype.toDataURL = () => `${AVATAR}MOCK`;
	(globalThis as Record<string, unknown>).createImageBitmap = async () => ({
		width: 200,
		height: 100,
		close: () => {},
	});
}

function pngFile(name = "foto.png"): File {
	return new File([new Uint8Array([1, 2, 3])], name, { type: "image/png" });
}

function chooseFile(file: File): void {
	const input = screen.getByLabelText("Escolher foto") as HTMLInputElement;
	fireEvent.change(input, { target: { files: [file] } });
}

afterEach(() => {
	cleanup();
});

describe("AvatarPicker (AV-05)", () => {
	test("com valor mostra preview circular imediato", () => {
		render(<AvatarPicker value={AVATAR} onChange={() => {}} />);
		const img = screen.getByAltText("Prévia do avatar") as HTMLImageElement;
		expect(img.getAttribute("src")).toBe(AVATAR);
		expect(screen.queryByRole("button", { name: "Escolher foto" })).toBeNull();
		expect(
			screen.getByRole("button", { name: "Trocar foto" }),
		).toBeTruthy();
	});

	test("sem valor mostra escolher e sem preview", () => {
		render(<AvatarPicker value={null} onChange={() => {}} />);
		expect(screen.getByRole("button", { name: "Escolher foto" })).toBeTruthy();
		expect(screen.queryByAltText("Prévia do avatar")).toBeNull();
	});

	test("arquivo válido normaliza e chama onChange com dataURL", async () => {
		mockCanvasPipeline();
		const seen: Array<string | null> = [];
		render(
			<AvatarPicker
				value={null}
				onChange={(value) => {
					seen.push(value);
				}}
			/>,
		);
		chooseFile(pngFile());
		await waitFor(() => expect(seen).toHaveLength(1));
		expect(seen[0]?.startsWith("data:image/jpeg;base64,")).toBe(true);
	});

	test("durante o processamento mantém preview anterior e desabilita controles", async () => {
		let resolveBitmap:
			| ((bitmap: { width: number; height: number; close: () => void }) => void)
			| null = null;
		const ctor = (window as unknown as Record<string, unknown>)
			.HTMLCanvasElement as unknown as { prototype: Record<string, unknown> };
		ctor.prototype.getContext = () => ({ drawImage: () => {} });
		ctor.prototype.toDataURL = () => `${AVATAR}MOCK`;
		(globalThis as Record<string, unknown>).createImageBitmap = () =>
			new Promise<{ width: number; height: number; close: () => void }>(
				(resolve) => {
					resolveBitmap = resolve;
				},
			);
		const seen: Array<string | null> = [];
		render(
			<AvatarPicker
				value={AVATAR}
				onChange={(value) => {
					seen.push(value);
				}}
			/>,
		);
		chooseFile(pngFile());
		await waitFor(() =>
			expect(
				(screen.getByRole("button", { name: "Trocar foto" }) as HTMLButtonElement)
					.disabled,
			).toBe(true),
		);
		expect(
			(screen.getByAltText("Prévia do avatar") as HTMLImageElement).getAttribute(
				"src",
			),
		).toBe(AVATAR);
		expect(seen).toHaveLength(0);
		await act(async () => {
			resolveBitmap?.({ width: 200, height: 100, close: () => {} });
		});
		await waitFor(() => expect(seen).toHaveLength(1));
		mockCanvasPipeline();
	});

	test("formato inválido mostra erro inline sem chamar onChange", async () => {
		const seen: Array<string | null> = [];
		render(
			<AvatarPicker
				value={null}
				onChange={(value) => {
					seen.push(value);
				}}
			/>,
		);
		chooseFile(new File([new Uint8Array([1])], "a.gif", { type: "image/gif" }));
		expect(
			await screen.findByText(/png, jpeg ou webp/i),
		).toBeTruthy();
		expect(seen).toHaveLength(0);
	});

	test("arquivo acima de 5MB mostra erro inline sem chamar onChange", async () => {
		const seen: Array<string | null> = [];
		render(
			<AvatarPicker
				value={AVATAR}
				onChange={(value) => {
					seen.push(value);
				}}
			/>,
		);
		const big = new File([new Uint8Array([1])], "grande.png", {
			type: "image/png",
		});
		Object.defineProperty(big, "size", { value: AVATAR_MAX_BYTES + 1 });
		chooseFile(big);
		expect(await screen.findByText(/5MB/)).toBeTruthy();
		expect(seen).toHaveLength(0);
		// Avatar anterior segue visível durante o erro.
		expect(
			(screen.getByAltText("Prévia do avatar") as HTMLImageElement).getAttribute(
				"src",
			),
		).toBe(AVATAR);
	});

	test("remover limpa e volta a iniciais", () => {
		const seen: Array<string | null> = [];
		render(
			<AvatarPicker
				value={AVATAR}
				onChange={(value) => {
					seen.push(value);
				}}
			/>,
		);
		fireEvent.click(screen.getByRole("button", { name: "Remover" }));
		expect(seen).toEqual([null]);
	});

	test("microcopy de privacidade acompanha o picker", () => {
		render(<AvatarPicker value={null} onChange={() => {}} />);
		expect(screen.getByText("Visível para todos na sala")).toBeTruthy();
	});

	test("input aceita só png/jpeg/webp", () => {
		render(<AvatarPicker value={null} onChange={() => {}} />);
		expect(
			(screen.getByLabelText("Escolher foto") as HTMLInputElement).getAttribute(
				"accept",
			),
		).toBe("image/png,image/jpeg,image/webp");
	});
});
