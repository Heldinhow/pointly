import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe("App (issue #158 — polimento e auditoria)", () => {
  test("uma nova tela começa no topo e recebe o foco no conteúdo", () => {
    const originalScrollTo = window.scrollTo;
    const calls: ScrollToOptions[] = [];
    window.scrollTo = ((options: ScrollToOptions) => calls.push(options)) as typeof window.scrollTo;
    try {
      render(
        <MemoryRouter initialEntries={["/"]}>
          <App />
        </MemoryRouter>,
      );
      fireEvent.click(screen.getByTestId("home-cta-create"));
      expect(calls).toEqual([{ top: 0, behavior: "instant" }]);
      expect(document.activeElement).toBe(screen.getByRole("main"));
      expect(screen.getByLabelText("Apelido")).toBeTruthy();
    } finally {
      window.scrollTo = originalScrollTo;
    }
  });
  test("navegação para entrar com código atualiza o formulário já aberto", () => {
    render(
      <MemoryRouter initialEntries={["/join"]}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.queryByRole("group", { name: "Código da sala" })).toBeNull();
    fireEvent.click(screen.getByRole("link", { name: "Entrar com código" }));
    expect(screen.getByRole("group", { name: "Código da sala" })).toBeTruthy();
  });
  test("skip link leva ao conteúdo principal", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    const skip = screen.getByRole("link", { name: /pular para o conteúdo/i });
    expect(skip.getAttribute("href")).toBe("#conteudo");
    const main = screen.getByRole("main");
    expect(main.getAttribute("id")).toBe("conteudo");
  });

  test("marcos de navegação presentes nas duas superfícies", () => {
    render(
      <MemoryRouter initialEntries={["/join"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole("banner")).toBeTruthy();
    expect(screen.getByRole("main").getAttribute("id")).toBe("conteudo");
  });
});
