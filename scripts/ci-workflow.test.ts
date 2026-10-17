import { expect, test } from "bun:test";

test("workflow executa verify e navegador sem permissões de escrita", async () => {
	const yaml = await Bun.file(new URL("../.github/workflows/verify.yml", import.meta.url)).text();
	const workflow: unknown = Bun.YAML.parse(yaml);
	expect(workflow).toMatchObject({
		on: { pull_request: {}, push: { branches: ["main"] } },
		permissions: { contents: "read" },
		jobs: {
			verify: {
				"runs-on": "ubuntu-24.04",
				steps: expect.arrayContaining([
					expect.objectContaining({ run: "bun install --frozen-lockfile" }),
					expect.objectContaining({ run: "bun test scripts/ci-workflow.test.ts" }),
					expect.objectContaining({ run: "bun run verify" }),
				]),
			},
			e2e: {
				needs: "verify",
				steps: expect.arrayContaining([
					expect.objectContaining({ run: "bunx playwright install --with-deps chromium" }),
					expect.objectContaining({ run: "bun run test:e2e" }),
					expect.objectContaining({ uses: "actions/upload-artifact@v4", if: "${{ always() }}" }),
				]),
			},
		},
	});
	expect(yaml).not.toContain("continue-on-error");
	expect(yaml).not.toContain("pull_request_target");
});
