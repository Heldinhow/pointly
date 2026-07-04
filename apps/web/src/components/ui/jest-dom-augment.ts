/**
 * jest-dom-bun-test — augment types for @testing-library/jest-dom matchers in bun:test.
 *
 * Phase 5 (T26). Augmenta `Matchers<T>` do bun:test com os matchers
 * customizados do jest-dom. Importar este arquivo uma vez no entry-point
 * dos testes (ex.: test-helpers.tsx).
 *
 * Sem isto, `expect(btn).toBeInTheDocument()` falha em typecheck.
 */
import "bun:test";

declare module "bun:test" {
	interface Matchers<T = unknown> {
		toBeInTheDocument(): void;
		toHaveTextContent(text: string | RegExp): void;
		toBeDisabled(): void;
		toBeEnabled(): void;
		toHaveAttribute(attr: string, value?: string): void;
		toHaveClass(...classes: string[]): void;
		toHaveStyle(css: Partial<CSSStyleDeclaration>): void;
		toBeVisible(): void;
		toHaveFocus(): void;
		toHaveValue(value: string | string[] | number): void;
	}
}
