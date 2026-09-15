import { useLayoutEffect, useRef, type RefObject } from "react";
import { PROJECTILE_CATALOG } from "@/lib/projectiles";
import type { ProjectileThrownPayload, ProjectileType } from "@/lib/protocol";
import "./projectile-flight.css";

export interface ProjectileFlightEvent extends ProjectileThrownPayload {
  key: number;
  receivedAt: number;
}

/** Papel amassado e dobradura próprios, sem emoji de rolo ou avião comercial. */
export function ProjectileIcon({ type }: { type: ProjectileType }): React.ReactElement {
  return (
    <span className="projectile-icon" aria-hidden="true">
      {type === "paper_ball" ? (
        <svg viewBox="0 0 40 40" fill="none">
          <path d="m11 4 14-1 10 9 2 13-10 12-14-1L3 26 4 13Z" fill="#f3f5eb" stroke="#87968b" strokeWidth="1.5" />
          <path d="m11 4 5 10-9 5 9 7-3 10m12-33-3 12 13-3M16 14l6 1-6 11 12-2 9 1m-9-1-1 13M7 19l-4 7m19-11 6 9" stroke="#b0baac" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="m16 14 6 1-6 11-9-7Zm12 10 9 1-10 12Z" fill="#d4dbce" fillOpacity=".65" />
        </svg>
      ) : type === "paper_plane" ? (
        <svg viewBox="0 0 40 40" fill="none">
          <path d="M3 4 38 20 3 36l7-16Z" fill="#f3f5eb" stroke="#87968b" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="m10 20 28 0L6 29Z" fill="#bac6b8" />
          <path d="M3 4 10 20 38 20M10 20 3 36" stroke="#9caa98" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      ) : PROJECTILE_CATALOG.find((item) => item.type === type)?.emoji}
    </span>
  );
}

const FLIGHT_MS = 1250;
const CONTACT = 0.68;

export function ProjectileFlight({ event, arenaRef, onDone }: {
  event: ProjectileFlightEvent;
  arenaRef: RefObject<HTMLDivElement>;
  onDone: (key: number) => void;
}): React.ReactElement {
  const flightRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const node = flightRef.current;
    const arena = arenaRef.current;
    const done = () => onDone(event.key);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!node || !arena || reducedMotion.matches || Date.now() - event.receivedAt > FLIGHT_MS) {
      done();
      return;
    }

    // Mede os avatares reais: acompanha os assentos laterais no mobile e
    // os nomes dos espectadores, que não ocupam um assento na mesa.
    const anchors = Array.from(arena.querySelectorAll<HTMLElement>("[data-projectile-player]"));
    const sender = anchors.find((anchor) => anchor.dataset.projectilePlayer === event.senderPlayerId);
    const target = anchors.find((anchor) => anchor.dataset.projectilePlayer === event.targetPlayerId);
    if (!sender || !target) {
      done();
      return;
    }
    const bounds = arena.getBoundingClientRect();
    const center = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      return { x: rect.left + rect.width / 2 - bounds.left, y: rect.top + rect.height / 2 - bounds.top };
    };
    const from = center(sender);
    const to = center(target);
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.hypot(dx, dy) || 1;
    const arc = Math.min(110, Math.max(40, distance * 0.2));
    const plane = event.projectileType === "paper_plane";
    const transform = (x: number, y: number, angle: number, scale = 1) =>
      `translate(${x - 18}px, ${y - 18}px) rotate(${angle}deg) scale(${scale})`;
    const angleAt = (t: number) => plane
      ? Math.atan2(dy - 4 * arc * (1 - 2 * t), dx) * 180 / Math.PI
      : t * 540;
    const frames: Keyframe[] = Array.from({ length: 61 }, (_, index) => {
      const t = index / 60;
      return {
        offset: t * CONTACT,
        transform: transform(from.x + dx * t, from.y + dy * t - 4 * arc * t * (1 - t), angleAt(t)),
        opacity: index === 0 ? 0 : 1,
        easing: "ease-in-out",
      };
    });
    const angle = angleAt(1);
    if (event.outcome === "hit") {
      frames.push(
        { offset: 0.78, transform: transform(to.x, to.y, angle, 1.35), opacity: 1 },
        { offset: 1, transform: transform(to.x, to.y + 18, angle + 30, 0.25), opacity: 0 },
      );
    } else {
      const travel = event.outcome === "deflect" ? -90 : 65;
      frames.push({ offset: 1, transform: transform(to.x + dx / distance * travel, to.y + dy / distance * travel + 28, angle + (plane ? 0 : -270), 0.65), opacity: 0 });
    }

    const animations: Animation[] = [];
    // Sem Web Animations API, o feed continua sendo a confirmação acessível.
    if (typeof node.animate === "function") {
      animations.push(node.animate(frames, { duration: FLIGHT_MS, fill: "both" }));
      const reaction = event.outcome === "dodge"
        ? `translate(${-dy / distance * 24}px, ${dx / distance * 24}px)`
        : event.outcome === "deflect" ? "rotate(-16deg) scale(1.12)" : "scale(0.82) rotate(10deg)";
      animations.push(target.animate(
        [{ transform: "none" }, { transform: reaction }, { transform: "none" }],
        { duration: 380, delay: FLIGHT_MS * (event.outcome === "dodge" ? 0.5 : CONTACT), easing: "ease-out" },
      ));
    }
    const timer = setTimeout(done, FLIGHT_MS);
    // Não mantém uma trajetória antiga após resize, ocultação ou troca de preferência.
    window.addEventListener("resize", done);
    document.addEventListener("visibilitychange", done);
    reducedMotion.addEventListener("change", done);
    return () => {
      clearTimeout(timer);
      animations.forEach((animation) => animation.cancel());
      window.removeEventListener("resize", done);
      document.removeEventListener("visibilitychange", done);
      reducedMotion.removeEventListener("change", done);
    };
  }, [event, arenaRef, onDone]);

  return (
    <span ref={flightRef} className="projectile-flight" data-testid="projectile-flight" data-sender={event.senderPlayerId} data-target={event.targetPlayerId} data-outcome={event.outcome}>
      <ProjectileIcon type={event.projectileType} />
    </span>
  );
}
