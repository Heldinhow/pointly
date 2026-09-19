import { describe, expect, test } from "bun:test";
import { useConsensusStats } from "./stats";

describe("useConsensusStats — sinais de consenso (14.1)", () => {
	test("unânime: ≥2 numéricos iguais (pausa fora)", () => {
		const view = useConsensusStats(["5", "5", "☕"]);
		expect(view.consensusSignal).toBe("unanimous");
		expect(view.isUnanimousSignal).toBe(true);
		expect(view.divergenceMagnitude).toBe(0);
	});

	test("divergente: ≥2 numéricos distintos", () => {
		const view = useConsensusStats(["5", "8"]);
		expect(view.consensusSignal).toBe("divergent");
		expect(view.isUnanimousSignal).toBe(false);
		expect(view.divergenceMagnitude).toBe(3);
	});

	test("sem sinal: voto único, só ☕ ou vazio", () => {
		for (const votes of [["8"], ["☕", "☕"], []]) {
			const view = useConsensusStats(votes);
			expect(view.consensusSignal).toBe("none");
			expect(view.isUnanimousSignal).toBe(false);
		}
		expect(useConsensusStats([]).divergenceMagnitude).toBeNull();
	});

	test("rótulos existentes seguem iguais (badge/aria)", () => {
		const unanimous = useConsensusStats(["5", "5"]);
		expect(unanimous.resultsAriaLabel).toMatch(/unânime/i);
		const single = useConsensusStats(["8"]);
		expect(single.isSingleNumeric).toBe(true);
		expect(single.resultsAriaLabel).toMatch(/Voto único/);
		const pauseOnly = useConsensusStats(["☕"]);
		expect(pauseOnly.noNumerics).toBe(true);
		expect(pauseOnly.resultsAriaLabel).toMatch(/Sem votos numéricos/);
	});
});
