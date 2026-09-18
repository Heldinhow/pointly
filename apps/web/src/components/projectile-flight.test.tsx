import { afterEach, expect, mock, spyOn, test } from "bun:test";
import { cleanup, render, waitFor } from "@testing-library/react";
import { ProjectileFlight, type ProjectileFlightEvent } from "./projectile-flight";

const originalAnimate = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "animate");
const animations: Array<{ target: HTMLElement; timing: KeyframeAnimationOptions; cancel: ReturnType<typeof mock> }> = [];

afterEach(() => {
  cleanup();
  mock.restore();
  animations.length = 0;
  if (originalAnimate) Object.defineProperty(HTMLElement.prototype, "animate", originalAnimate);
  else Reflect.deleteProperty(HTMLElement.prototype, "animate");
});

function showProjectile(projectileType: ProjectileFlightEvent["projectileType"], outcome: ProjectileFlightEvent["outcome"] = "hit") {
  Object.defineProperty(HTMLElement.prototype, "animate", {
    configurable: true,
    value(this: HTMLElement, _frames: Keyframe[], timing: KeyframeAnimationOptions) {
      const cancel = mock(() => {});
      animations.push({ target: this, timing, cancel });
      return { cancel };
    },
  });
  const arena = document.createElement("div");
  const target = document.createElement("span");
  target.dataset.projectilePlayer = "p_target";
  arena.append(target);
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
