import { afterEach, expect, mock, spyOn, test } from "bun:test";
import { cleanup, render, waitFor } from "@testing-library/react";
import { ProjectileFlight, type ProjectileFlightEvent } from "./projectile-flight";

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

test("cadeirada permanece até o fim das estrelas e termina uma única vez", async () => {
  const { onDone } = showProjectile("chair");
  await new Promise((resolve) => setTimeout(resolve, 1450));
  expect(onDone).not.toHaveBeenCalled();
  await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
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

test("cadeirada gira em 3D no voo", () => {
  showProjectile("chair");
  const chairFlight = animations.find(({ target }) => target.classList.contains("projectile-flight"))!;
  expect(chairFlight).toBeTruthy();
  expect(chairFlight.frames.some((frame) => String(frame.transform).includes("rotateY("))).toBe(true);
  expect(chairFlight.frames.some((frame) => String(frame.transform).includes("rotateX("))).toBe(true);
});

test("cadeirada sacode a mesa e solta o grip no contato", () => {
  const { container } = showProjectile("chair");
  const tableAnimation = animations.find(({ target }) => target.classList.contains("poker-table"));
  expect(tableAnimation).toBeTruthy();
  expect(Number(tableAnimation!.timing.delay)).toBeGreaterThan(0);
  const grip = container.querySelector(".projectile-grip");
  expect(grip).toBeTruthy();
  const gripAnimation = animations.find(({ target }) => target === grip);
  expect(gripAnimation).toBeTruthy();
  expect(Number(gripAnimation!.frames.at(-1)?.opacity)).toBe(0);
});

test("projétil comum não sacode a mesa", () => {
  showProjectile("brick");
  expect(animations.some(({ target }) => target.classList.contains("poker-table"))).toBe(false);
});
