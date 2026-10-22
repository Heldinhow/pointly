import { afterEach, expect, mock, spyOn, test } from "bun:test";
import { cleanup, render, waitFor } from "@testing-library/react";
import { CHAIR_TIMELINE, ProjectileFlight, STATIC_NOTICE_MS, type ProjectileFlightEvent } from "./projectile-flight";

const originalAnimate = Object.getOwnPropertyDescriptor(Element.prototype, "animate");
const animations: Array<{ target: Element; frames: Keyframe[]; timing: KeyframeAnimationOptions; cancel: ReturnType<typeof mock> }> = [];
// Tetos de opacidade dos dois ecos, na ordem de atraso.
const ECHO_MAX_OPACITY = [0.26, 0.13];

afterEach(() => {
  cleanup();
  mock.restore();
  animations.length = 0;
  if (originalAnimate) Object.defineProperty(Element.prototype, "animate", originalAnimate);
  else Reflect.deleteProperty(Element.prototype, "animate");
});

function showProjectile(projectileType: ProjectileFlightEvent["projectileType"], outcome: ProjectileFlightEvent["outcome"] = "hit") {
  Object.defineProperty(Element.prototype, "animate", {
    configurable: true,
    value(this: Element, frames: Keyframe[], timing: KeyframeAnimationOptions) {
      const cancel = mock(() => {});
      animations.push({ target: this, frames, timing, cancel });
      return { cancel };
    },
  });
  const arena = document.createElement("div");
  const target = document.createElement("span");
  target.dataset.projectilePlayer = "p_target";
  const table = document.createElement("div");
  table.className = "poker-table";
  arena.append(target, table);
  const onDone = mock(() => {});
  const view = render(<ProjectileFlight
    event={{ key: 1, receivedAt: Date.now(), senderPlayerId: "p_sender", targetPlayerId: "p_target", projectileType, outcome }}
    arenaRef={{ current: arena }}
    onDone={onDone}
  />);
  return { ...view, onDone, target };
}

test.each(["chair", "tomato", "rock", "brick", "paper_ball", "paper_plane"] as const)("%s só é removido depois da reação e de todas as partículas", (type) => {
  const timers = spyOn(globalThis, "setTimeout");
  const { container, unmount } = showProjectile(type);
  const removalDelay = Number(timers.mock.calls.at(-1)?.[1]);
  for (const { timing } of animations) {
    expect(removalDelay).toBeGreaterThanOrEqual(Number(timing.delay ?? 0) + Number(timing.duration));
  }
  const impact = container.querySelector<HTMLElement>(".projectile-impact")!;
  const contact = Number.parseFloat(impact.style.getPropertyValue("--contact-delay"));
  const duration = Number.parseFloat(impact.style.getPropertyValue("--impact-duration"));
  const stagger = Number.parseFloat(impact.style.getPropertyValue("--star-stagger"));
  expect(removalDelay).toBeGreaterThanOrEqual(contact + duration + (type === "chair" ? stagger * 2 : 0));
  unmount();
  for (const animation of animations) expect(animation.cancel).toHaveBeenCalledTimes(1);
});

test("cadeirada fica tombada por 2-3s e termina uma única vez", () => {
  const timers = spyOn(globalThis, "setTimeout");
  const { onDone } = showProjectile("chair");
  expect(Number(timers.mock.calls.at(-1)?.[1])).toBe(CHAIR_TIMELINE.end);
  expect(CHAIR_TIMELINE.restUntil - CHAIR_TIMELINE.landed).toBeGreaterThanOrEqual(1500);
  expect(CHAIR_TIMELINE.end - CHAIR_TIMELINE.contact).toBeGreaterThanOrEqual(2000);
  expect(onDone).not.toHaveBeenCalled();
  (timers.mock.calls.at(-1)?.[0] as () => void)();
  (timers.mock.calls.at(-1)?.[0] as () => void)();
  expect(onDone).toHaveBeenCalledTimes(1);
  expect(onDone).toHaveBeenCalledWith(1);
});

test.each(["dodge", "deflect"] as const)("%s não produz impacto e cancela as animações no resize", (outcome) => {
  const { onDone, unmount } = showProjectile("rock", outcome);
  expect(animations.some(({ target }) => target.classList.contains("projectile-impact"))).toBe(false);
  window.dispatchEvent(new Event("resize"));
  expect(onDone).toHaveBeenCalledWith(1);
  unmount();
  for (const animation of animations) expect(animation.cancel).toHaveBeenCalledTimes(1);
});

test.each(["paper_ball", "paper_plane", "rock", "brick", "tomato", "chair"] as const)("%s usa arte SVG própria no voo", (type) => {
  const { container } = showProjectile(type);
  expect(container.querySelector(".projectile-flight svg")).toBeTruthy();
});

test("sombra de contato acompanha o voo e as partículas ganham animação própria", () => {
  const { container } = showProjectile("rock");
  expect(container.querySelector('[data-testid="projectile-shadow"]')).toBeTruthy();
  expect(animations.some(({ target }) => target.classList.contains("projectile-shadow"))).toBe(true);
  expect(animations.filter(({ target }) => target.classList.contains("projectile-particle"))).toHaveLength(5);
});

test("cadeirada dispensa sombra de contato", () => {
  const { container } = showProjectile("chair");
  expect(container.querySelector('[data-testid="projectile-shadow"]')).toBeNull();
  expect(container.querySelector('[data-testid="projectile-echo"]')).toBeNull();
  expect(animations.some(({ target }) => target.classList.contains("projectile-shadow") || target.classList.contains("projectile-echo"))).toBe(false);
});

test.each(["paper_ball", "paper_plane", "rock", "brick", "tomato"] as const)("%s deixa dois ecos que colapsam sobre o líder", (type) => {
  const { container } = showProjectile(type);
  expect(container.querySelectorAll('[data-testid="projectile-echo"]')).toHaveLength(2);
  const echoAnimations = animations.filter(({ target }) => target.classList.contains("projectile-echo"));
  expect(echoAnimations).toHaveLength(2);
  echoAnimations.forEach((echoAnimation, index) => {
    expect(Number(echoAnimation.timing.delay)).toBeGreaterThan(0);
    const opacities = echoAnimation.frames.map((frame) => Number(frame.opacity ?? 0));
    const peak = Math.max(...opacities);
    expect(peak).toBeLessThanOrEqual(ECHO_MAX_OPACITY[index]!);
    expect(peak).toBeGreaterThan(0);
    // Depois do contato o rastro já colapsou: opacity 0 nos frames finais.
    expect(opacities.at(-1)).toBe(0);
  });
});

test("partículas seguem arco balístico em keyframes lineares", () => {
  const { container } = showProjectile("rock");
  expect(container.querySelectorAll(".projectile-particle").length).toBe(5);
  const particleAnimations = animations.filter(({ target }) => target.classList.contains("projectile-particle"));
  expect(particleAnimations).toHaveLength(5);
  for (const { frames, timing } of particleAnimations) {
    expect(timing.easing).toBe("linear");
    expect(frames.length).toBeGreaterThan(4);
  }
  const yAt = (frame: Keyframe) => Number(/translate\(-?[\d.]+px, (-?[\d.]+)px\)/.exec(String(frame.transform))?.[1]);
  const ys = particleAnimations[0]!.frames.map(yAt);
  const minIndex = ys.indexOf(Math.min(...ys));
  expect(minIndex).toBeGreaterThan(0);
  expect(minIndex).toBeLessThan(ys.length - 1);
  expect(ys[minIndex]!).toBeLessThan(ys.at(-1)!);
});

test("ripple do feltro aparece só na cadeirada", () => {
  const chairView = showProjectile("chair");
  expect(chairView.container.querySelector(".projectile-ripple")).toBeTruthy();
  const rockView = showProjectile("rock");
  expect(rockView.container.querySelector(".projectile-ripple")).toBeNull();
});

test("cadeirada entra de fora da tela, girando, opaca", () => {
  showProjectile("chair");
  const chairFlight = animations.find(({ target }) => target.classList.contains("projectile-flight"))!;
  const first = chairFlight.frames[0]!;
  const y = Number(/translate\(-?[\d.]+px, (-?[\d.]+)px\)/.exec(String(first.transform))?.[1]);
  expect(y).toBeLessThan(-100);
  const rotations = chairFlight.frames.map((frame) => Number(/rotate\((-?[\d.]+)deg\)/.exec(String(frame.transform))?.[1]));
  expect(Math.abs(rotations[0]! - rotations[24]!)).toBeGreaterThan(360);
  const contactIndex = chairFlight.frames.findIndex((frame) => Number(frame.offset) * Number(chairFlight.timing.duration) >= CHAIR_TIMELINE.contact - 0.5);
  for (const frame of chairFlight.frames.slice(0, contactIndex)) expect(frame.opacity).toBe(1);
});

test("cadeirada sacode a mesa 3px por 150ms, balança o assento e carimba CADEIRADA!", () => {
  const { container, target } = showProjectile("chair");
  const tableAnimation = animations.find(({ target }) => target.classList.contains("poker-table"))!;
  expect(Number(tableAnimation.timing.delay)).toBe(CHAIR_TIMELINE.contact);
  expect(Number(tableAnimation.timing.duration)).toBe(150);
  const offsets = tableAnimation.frames.flatMap((frame) => [...String(frame.transform).matchAll(/(-?[\d.]+)px/g)].map((m) => Math.abs(Number(m[1]))));
  expect(Math.max(...offsets)).toBeLessThanOrEqual(3);
  const sway = animations.find((animation) => animation.target === target)!;
  expect(sway.frames.filter((frame) => String(frame.transform).includes("rotate(")).length).toBeGreaterThanOrEqual(4);
  expect(target.style.transformOrigin).toBe("50% 100%");
  const stamp = container.querySelector('[data-testid="projectile-stamp"]')!;
  expect(stamp.textContent).toBe("CADEIRADA!");
  expect(animations.some((animation) => animation.target === stamp)).toBe(true);
  expect(animations.filter(({ target }) => target.classList.contains("projectile-star"))).toHaveLength(5);
});

test.each([
  ["rock", "projectile-bump"],
  ["brick", "projectile-crack"],
  ["tomato", "projectile-splat"],
] as const)("%s tem batida própria (%s)", (type, testId) => {
  const { container } = showProjectile(type);
  const element = container.querySelector(`[data-testid="${testId}"]`)!;
  expect(element).toBeTruthy();
  expect(animations.some((animation) => animation.target === element)).toBe(true);
});

test("tomate escorre e dura 2-3s", () => {
  const { container } = showProjectile("tomato");
  const splat = animations.find(({ target }) => target.classList.contains("projectile-splat"))!;
  expect(Number(splat.timing.duration)).toBeGreaterThanOrEqual(2000);
  expect(Number(splat.timing.duration)).toBeLessThanOrEqual(3000);
  expect(container.querySelectorAll('[data-testid="projectile-drip"]')).toHaveLength(3);
});

test("aviãozinho faz voo em S e fica espetado", () => {
  // Alvo 300px à direita do centro da mesa: geometria real para o S.
  spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    const x = this.dataset.projectilePlayer ? 300 : 0;
    return { left: x, top: 0, width: 44, height: 44, right: x + 44, bottom: 44, x, y: 0, toJSON() {} } as DOMRect;
  });
  showProjectile("paper_plane");
  const flight = animations.find(({ target }) => target.classList.contains("projectile-flight"))!;
  const angles = flight.frames.map((frame) => Number(/rotate\((-?[\d.]+)deg\)/.exec(String(frame.transform))?.[1]));
  const deltas = angles.slice(1, 49).map((angle, index) => angle - angles[index]!).filter((d) => Math.abs(d) > 0.05);
  const turns = deltas.slice(1).filter((d, index) => Math.sign(d) !== Math.sign(deltas[index]!)).length;
  expect(turns).toBeGreaterThanOrEqual(1);
  const transforms = flight.frames.map((frame) => String(frame.transform));
  const held = transforms.filter((t, index) => index > 48 && t === transforms[index - 1]);
  expect(held.length).toBeGreaterThanOrEqual(1);
});

test("projétil comum não sacode a mesa", () => {
  showProjectile("brick");
  expect(animations.some(({ target }) => target.classList.contains("poker-table"))).toBe(false);
});


test("cadeirada sincroniza contato e pausa de 60ms", () => {
  const { target } = showProjectile("chair");
  const flight = animations.find(({ target }) => target.classList.contains("projectile-flight"))!;
  const reaction = animations.find((animation) => animation.target === target)!;
  expect(Number(reaction.timing.delay)).toBe(CHAIR_TIMELINE.contact);
  expect(reaction.timing.easing).toBe("linear");
  const at = (time: number) => flight.frames.find((frame) => Math.abs(Number(frame.offset) * Number(flight.timing.duration) - time) < 1);
  expect(at(CHAIR_TIMELINE.contact)?.transform).toBe(at(CHAIR_TIMELINE.contact + CHAIR_TIMELINE.hitStop)?.transform);
  expect(reaction.frames[0]?.transform).toBe(reaction.frames[1]?.transform);
});

test.each(["chair", "rock"] as const)("movimento reduzido (%s) mostra ícone + rótulo estáticos, sem animação", (type) => {
  const timers = spyOn(globalThis, "setTimeout");
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  spyOn(window, "matchMedia").mockReturnValue({ ...media, matches: true });
  const { container, onDone, unmount } = showProjectile(type);
  expect(onDone).not.toHaveBeenCalled();
  expect(animations).toHaveLength(0);
  const notice = container.querySelector<HTMLElement>('[data-testid="projectile-static"]')!;
  expect(notice.dataset.visible).toBe("true");
  expect(notice.textContent).toBe(type === "chair" ? "CADEIRADA!" : "Pedra");
  expect(Number(timers.mock.calls.at(-1)?.[1])).toBe(STATIC_NOTICE_MS);
  unmount();
});

test("cancelamento repetido conclui uma única vez", () => {
  const { onDone } = showProjectile("chair");
  window.dispatchEvent(new Event("resize"));
  window.dispatchEvent(new Event("resize"));
  document.dispatchEvent(new Event("visibilitychange"));
  expect(onDone).toHaveBeenCalledTimes(1);
});

test("saída do alvo encerra a cadeirada, cancela seus efeitos e restaura o alvo", async () => {
  const { target, onDone, unmount } = showProjectile("chair");
  target.remove();
  await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
  unmount();
  for (const animation of animations) expect(animation.cancel).toHaveBeenCalledTimes(1);
});

test("cadeirada voa no assento do alvo e tomba na camada sob os assentos", () => {
  Object.defineProperty(Element.prototype, "animate", {
    configurable: true,
    value(this: Element, frames: Keyframe[], timing: KeyframeAnimationOptions) {
      const cancel = mock(() => {});
      animations.push({ target: this, frames, timing, cancel });
      return { cancel };
    },
  });
  const arena = document.createElement("div");
  const table = document.createElement("div");
  table.className = "poker-table";
  const under = document.createElement("div");
  under.className = "projectile-layer-under";
  const seat = document.createElement("li");
  seat.className = "poker-seat";
  const target = document.createElement("span");
  target.dataset.projectilePlayer = "p_target";
  seat.append(target);
  table.append(under, seat);
  arena.append(table);
  document.body.append(arena);
  const view = render(<ProjectileFlight
    event={{ key: 1, receivedAt: Date.now(), senderPlayerId: "p_sender", targetPlayerId: "p_target", projectileType: "chair", outcome: "hit" }}
    arenaRef={{ current: arena }}
    onDone={mock(() => {})}
  />);
  const flight = seat.querySelector<HTMLElement>('[data-testid="projectile-flight"]')!;
  const rest = under.querySelector<HTMLElement>('[data-testid="projectile-chair-rest"]')!;
  expect(flight).toBeTruthy();
  expect(rest).toBeTruthy();
  const swap = CHAIR_TIMELINE.contact + CHAIR_TIMELINE.swapAfterImpact;
  const opacityAt = (element: Element, ms: number) => {
    const frames = animations.find((animation) => animation.target === element)!.frames;
    return Number([...frames].reverse().find((frame) => Number(frame.offset) * CHAIR_TIMELINE.end <= ms + 0.5)!.opacity);
  };
  // Voo e impacto no assento; depois do impacto, só a cadeira de baixo aparece.
  expect(opacityAt(flight, CHAIR_TIMELINE.contact)).toBe(1);
  expect(opacityAt(rest, CHAIR_TIMELINE.contact)).toBe(0);
  expect(opacityAt(flight, swap + 2)).toBe(0);
  expect(opacityAt(rest, swap + 2)).toBe(1);
  // O assento do alvo desce abaixo dos vizinhos até a troca.
  const seatAnimation = animations.find((animation) => animation.target === seat)!;
  expect(seatAnimation.frames.every((frame) => frame.zIndex === 0)).toBe(true);
  // Só transform/opacity (e o z-index discreto do assento).
  for (const { frames } of animations) for (const frame of frames) {
    for (const key of Object.keys(frame)) expect(["offset", "easing", "transform", "opacity", "zIndex"]).toContain(key);
  }
  expect(view.container.querySelector('[data-testid="projectile-stamp"]')).toBeTruthy();
  view.unmount();
  expect(seat.querySelector('[data-testid="projectile-flight"]')).toBeNull();
  expect(under.querySelector('[data-testid="projectile-chair-rest"]')).toBeNull();
  arena.remove();
});
