import { useLayoutEffect, useRef, type CSSProperties, type RefObject } from "react";
import { PROJECTILE_CATALOG } from "@/lib/projectiles";
import type { ProjectileThrownPayload, ProjectileType } from "@/lib/protocol";
import "./projectile-flight.css";

export interface ProjectileFlightEvent extends ProjectileThrownPayload {
  key: number;
  receivedAt: number;
}

/** Papel amassado, dobradura e cadeira próprios — sem emoji. */
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
      ) : type === "chair" ? (
        <svg viewBox="0 0 80 88" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Tubos traseiros ligam o encosto, o assento e as pernas. */}
          <path d="m18 13 5 32-8 30M46 8l4 29-2 29" stroke="#404b52" strokeWidth="5" />
          <path d="m18 13 5 32-8 30M46 8l4 29-2 29" stroke="#b7c3ca" strokeWidth="3" />
          <path d="m23 45 26-8 17 14M19 61l20 14m11-26 20 15" stroke="#46535c" strokeWidth="4" />
          <path d="m23 45 26-8 17 14M19 61l20 14m11-26 20 15" stroke="#a0afb9" strokeWidth="2" />
          {/* Encosto estofado com espessura e contorno legíveis sobre o feltro. */}
          <path d="M17 9 43 3q5-1 6 4l3 23q.5 4-3 5l-25 7q-5 1-6-4l-4-24q-1-4 3-5Z" fill="#171e24" stroke="#b8c5ce" strokeWidth="1.6" />
          <path d="m20 12 23-6q2-.5 2.5 2l3 21q.5 2-2 2.5l-23 6q-2 .5-2.5-2l-3-21q-.5-2 2-2.5Z" fill="#343e48" />
          <path d="m21 14 21-5M23 34l21-5" stroke="#64717d" strokeWidth="1" />
          {/* Pernas da frente, à frente das travessas. */}
          <path d="m41 58-2 26m27-33 6 27" stroke="#404b52" strokeWidth="5" />
          <path d="m41 58-2 26m27-33 6 27" stroke="#cbd5db" strokeWidth="3" />
          <path d="m40 62-1 18m28-24 4 18" stroke="#f0f4f6" strokeWidth="0.9" />
          {/* Assento em três quartos: plano superior e borda frontal distintos. */}
          <path d="m22 45 26-8 20 12v5L41 65 22 52Z" fill="#141b21" stroke="#8b9ca8" strokeWidth="1.4" />
          <path d="m22 45 26-8 20 12-27 11Z" fill="#46515b" stroke="#bdc9d1" strokeWidth="1.4" />
          <path d="m26 45 22-6 15 9-22 8Z" fill="#36404a" />
          <path d="M41 60v5" stroke="#8b9ca8" />
          <path d="m13 76 4 1m29-10 4 1m-13 16 4 1m29-6 4-1" stroke="#202b33" strokeWidth="3.5" />
        </svg>
      ) : PROJECTILE_CATALOG.find((item) => item.type === type)?.emoji}
    </span>
  );
}

const FLIGHT_MS = 1250;
const CHAIR_FLIGHT_MS = 1400;
const CONTACT = 0.68;
const CHAIR_CONTACT = 0.58;
const IMPACT_MS = 600;
const CHAIR_IMPACT_MS = 800;
const STAR_STAGGER_MS = 80;
const IMPACT_PARTICLES = 5;

function particleOffset(index: number): CSSProperties {
  const angle = (index / IMPACT_PARTICLES) * Math.PI * 2;
  return {
    "--dx": `${Math.cos(angle) * 44}px`,
    "--dy": `${Math.sin(angle) * 40 - 12}px`,
    "--spin": `${index % 2 ? 110 : -85}deg`,
  } as CSSProperties;
}

export function ProjectileFlight({ event, arenaRef, onDone }: {
  event: ProjectileFlightEvent;
  arenaRef: RefObject<HTMLDivElement>;
  onDone: (key: number) => void;
}): React.ReactElement {
  const flightRef = useRef<HTMLSpanElement>(null);
  const impactRef = useRef<HTMLSpanElement>(null);
  const chair = event.projectileType === "chair";
  const duration = chair ? CHAIR_FLIGHT_MS : FLIGHT_MS;
  const contactAt = duration * (chair ? CHAIR_CONTACT : CONTACT);
  const reactionAt = !chair && event.outcome === "dodge" ? duration * 0.5 : contactAt;
  const reactionMs = chair ? 700 : 460;
  const impactMs = chair ? CHAIR_IMPACT_MS : IMPACT_MS;
  const hasImpact = event.outcome === "hit" || chair;
  // Inclui a última estrela e a recuperação do avatar, não só o voo.
  const lifetime = Math.max(duration, reactionAt + reactionMs,
    hasImpact ? contactAt + impactMs + (chair ? STAR_STAGGER_MS * 2 : 0) : 0);

  useLayoutEffect(() => {
    const node = flightRef.current;
    const impact = impactRef.current;
    const arena = arenaRef.current;
    const done = () => onDone(event.key);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!node || !arena || reducedMotion.matches || Date.now() - event.receivedAt > duration) {
      done();
      return;
    }

    // Anonimato: a origem é sempre o centro da mesa — nunca o avatar de
    // quem arremessou. Só o alvo importa; o sender segue no payload apenas
    // para o cooldown local de quem jogou.
    const target = arena.querySelector<HTMLElement>(
      `[data-projectile-player="${event.targetPlayerId}"]`,
    );
    if (!target) {
      done();
      return;
    }
    const bounds = arena.getBoundingClientRect();
    const center = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      return { x: rect.left + rect.width / 2 - bounds.left, y: rect.top + rect.height / 2 - bounds.top };
    };
    const origin = arena.querySelector<HTMLElement>(".poker-center");
    const from = origin ? center(origin) : { x: bounds.width / 2, y: bounds.height / 2 };
    const to = center(target);
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.hypot(dx, dy) || 1;
    const arc = Math.min(110, Math.max(40, distance * 0.2));
    const ux = dx / distance;
    const uy = dy / distance;
    const side = dx < 0 ? -1 : 1;
    const plane = event.projectileType === "paper_plane";
    const heavy = event.projectileType === "rock" || event.projectileType === "brick";
    const tomato = event.projectileType === "tomato";
    const transform = (x: number, y: number, angle: number, scaleX = 1, scaleY = scaleX) =>
      `translate(${x - 18}px, ${y - 18}px) rotate(${angle}deg) scale(${scaleX}, ${scaleY})`;
    const contact = chair ? { x: to.x - side * 10, y: to.y - 10 } : to;

    let frames: Keyframe[];
    if (chair) {
      // Mãos no topo do encosto (30, 10), pé dianteiro em (72, 78).
      // Espelha o desenho inteiro: as pernas continuam apontando para o alvo.
      const pivotX = side > 0 ? 30 : 50;
      node.style.transformOrigin = `${pivotX}px 10px`;
      node.style.setProperty("--chair-facing", String(side));
      const strikeAngle = -side * 30;
      const radians = strikeAngle * Math.PI / 180;
      const tipX = side * 42;
      const tipY = 68;
      const grip = {
        x: contact.x - (tipX * Math.cos(radians) - tipY * Math.sin(radians)),
        y: contact.y - (tipX * Math.sin(radians) + tipY * Math.cos(radians)),
      };
      const held = (x: number, y: number, angle: number, scale = 1) =>
        `translate(${x - pivotX}px, ${y - 10}px) rotate(${angle}deg) scale(${scale})`;
      const strike = held(grip.x, grip.y, strikeAngle);
      frames = [
        // Primeiro mostra a cadeira de pé; depois ergue as pernas e arma o golpe.
        { offset: 0, transform: held(from.x, from.y - 30, 0, 0.85), opacity: 0, easing: "ease-out" },
        { offset: 0.1, transform: held(from.x + (grip.x - from.x) * 0.2, from.y - 30 + (grip.y - from.y) * 0.2, 0), opacity: 1, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
        { offset: 0.23, transform: held(grip.x - side * 14, grip.y + 26, -side * 12), opacity: 1, easing: "ease-in-out" },
        { offset: 0.37, transform: held(grip.x - side * 16, grip.y - 4, -side * 90), opacity: 1, easing: "ease-out" },
        { offset: 0.43, transform: held(grip.x - side * 20, grip.y - 5, -side * 110), opacity: 1, easing: "cubic-bezier(0.55, 0, 0.85, 0.4)" },
        { offset: CHAIR_CONTACT, transform: strike, opacity: 1 },
        // 42 ms de hit-stop: mãos, cadeira e alvo marcam o mesmo contato.
        { offset: CHAIR_CONTACT + 0.03, transform: strike, opacity: 1, easing: "ease-out" },
        { offset: 0.68, transform: held(grip.x + side * 4, grip.y + 6, -side * 20), opacity: 1, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
        { offset: 0.86, transform: held(grip.x - side * 14, grip.y - 4, -side * 60), opacity: 1, easing: "ease-in" },
        { offset: 1, transform: held(grip.x - side * 24, grip.y + 12, -side * 50, 0.92), opacity: 0 },
      ];
    } else {
      const angleAt = (t: number) => {
        if (!plane) return t * 540;
        const angle = Math.atan2(dy - 4 * arc * (1 - 2 * t), dx) * 180 / Math.PI;
        // Mantém a tangente contínua ao cruzar ±180° em voos para a esquerda.
        return dx < 0 && angle < 0 ? angle + 360 : angle;
      };
      frames = Array.from({ length: 61 }, (_, index) => {
        const progress = index / 60;
        const t = progress * progress;
        return {
          offset: progress * CONTACT,
          transform: transform(from.x + dx * t, from.y + dy * t - 4 * arc * t * (1 - t), angleAt(t)),
          opacity: index === 0 ? 0 : 1,
        };
      });
      const angle = angleAt(1);
      if (event.outcome === "hit") {
        if (tomato) {
          frames.push(
            { offset: CONTACT + 0.025, transform: transform(to.x, to.y, angle, 1.45, 0.45), opacity: 1, easing: "ease-out" },
            { offset: 0.84, transform: transform(to.x, to.y + 5, angle, 1.65, 0.2), opacity: 0 },
            { offset: 1, transform: transform(to.x, to.y + 5, angle, 1.65, 0.2), opacity: 0 },
          );
        } else {
          const rebound = heavy ? 14 : 24;
          frames.push(
            { offset: CONTACT + 0.025, transform: transform(to.x, to.y, angle, heavy ? 1 : plane ? 0.6 : 0.85, heavy ? 1 : 1.12), opacity: 1, easing: "ease-out" },
            { offset: 0.82, transform: transform(to.x - ux * rebound, to.y - uy * rebound - 10, angle + side * (plane ? 12 : 28), 0.95), opacity: 1, easing: "ease-in" },
            { offset: 1, transform: transform(to.x - ux * rebound * 1.5, to.y + 32, angle + side * (plane ? 24 : 75), 0.75), opacity: 0 },
          );
        }
      } else {
        const travel = event.outcome === "deflect" ? -90 : 65;
        frames.push({ offset: 1, transform: transform(to.x + dx / distance * travel, to.y + dy / distance * travel + 28, angle + (plane ? 0 : -270), 0.65), opacity: 0 });
      }
    }

    const animations: Animation[] = [];
    // Sem Web Animations API, o voo some e o alvo não reage — sem quebrar.
    if (typeof node.animate === "function") {
      animations.push(node.animate(frames, { duration, fill: "both" }));
      // Reação do alvo por desfecho: squash+shake no hit, passo lateral no
      // dodge, tilt no deflect — e tilt+shake forte no smash da cadeirada.
      const push = heavy ? 10 : tomato ? 6 : 3;
      const reaction: Keyframe[] = chair
        ? [
          { offset: 0, transform: "none" },
          { offset: 0.06, transform: `translate(${side * 10}px, 7px) rotate(${side * 10}deg) scale(0.96, 0.92)` },
          { offset: 0.12, transform: `translate(${side * 10}px, 7px) rotate(${side * 10}deg) scale(0.96, 0.92)` },
          { offset: 0.3, transform: `translate(${side * 14}px, 9px) rotate(${side * 13}deg) scale(0.98, 0.96)` },
          { offset: 0.58, transform: `translate(${-side * 2}px, -1px) rotate(${-side * 3}deg)` },
          { offset: 0.78, transform: `translateX(${side}px) rotate(${side}deg)` },
          { offset: 1, transform: "none" },
        ]
        : event.outcome === "dodge"
          ? [
            { transform: "none" },
            { transform: `translate(${-dy / distance * 24}px, ${dx / distance * 24}px)` },
            { transform: "none" },
          ]
          : event.outcome === "deflect"
            ? [
              { transform: "none" },
              { transform: `rotate(${-side * 16}deg) scale(1.08)` },
              { transform: `rotate(${side * 6}deg) scale(1.02)` },
              { transform: "none" },
            ]
            : [
              { offset: 0, transform: "none" },
              { offset: 0.1, transform: `translate(${ux * push}px, ${uy * push}px) rotate(${side * push}deg) scale(${heavy ? 0.88 : 0.96})` },
              { offset: 0.24, transform: `translate(${ux * push}px, ${uy * push}px) rotate(${side * push}deg) scale(${heavy ? 0.88 : 0.96})` },
              { offset: 0.6, transform: `translate(${-ux * push * 0.25}px, ${-uy * push * 0.25}px) rotate(${-side * push * 0.3}deg)` },
              { offset: 1, transform: "none" },
            ];
      animations.push(target.animate(reaction, {
        duration: reactionMs,
        delay: reactionAt,
        easing: "ease-out",
      }));
      // Explosão de partículas no ponto de contato (cor por tipo, via CSS).
      if (impact && hasImpact) {
        impact.style.left = `${contact.x}px`;
        impact.style.top = `${contact.y}px`;
        impact.style.setProperty("--star-offset", `${Math.max(0, 72 - contact.y)}px`);
        animations.push(impact.animate(
          [{ opacity: 1 }, { opacity: 1 }],
          { duration: impactMs + (chair ? STAR_STAGGER_MS * 2 : 0), delay: contactAt },
        ));
      }
    }
    const timer = setTimeout(done, lifetime);
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
  }, [event, arenaRef, onDone, chair, duration, contactAt, reactionAt, reactionMs, impactMs, hasImpact, lifetime]);
  return (
    <>
      <span ref={flightRef} className={chair ? "projectile-flight projectile-flight--chair" : "projectile-flight"} data-testid="projectile-flight" data-target={event.targetPlayerId} data-outcome={event.outcome} data-projectile={event.projectileType} aria-hidden="true">
        <ProjectileIcon type={event.projectileType} />
        {chair ? (
          <svg className="projectile-grip" viewBox="0 0 80 88" fill="none" aria-hidden="true">
            {["translate(15 7)", "translate(40 1)"].map((position) => (
              <g key={position} transform={position} stroke="#79543d" strokeWidth="0.7" strokeLinejoin="round">
                <path d="m-6 0 7 2-1 5-7-2Z" fill="#303d47" stroke="#a8b5bf" />
                <path d="m-1 1 3 1-1 5-3-1Z" fill="#e4e9e9" stroke="none" />
                <path d="M2 1q1-2 2 0 1-2 2 0 2-1 2 1v5q0 2-2 2H3Q0 8 0 6V4q0-1 1-1l2 1Z" fill="#e8b48d" />
                <path d="M4 2v3m2-3v3M1 4l3 1" stroke="#a67150" strokeLinecap="round" />
              </g>
            ))}
          </svg>
        ) : null}
      </span>
      <span ref={impactRef} className={`projectile-impact projectile-impact--${event.projectileType} projectile-impact--${event.outcome}`} data-testid="projectile-impact" aria-hidden="true" style={{ "--contact-delay": `${contactAt}ms`, "--impact-duration": `${impactMs}ms`, "--star-stagger": `${STAR_STAGGER_MS}ms` } as CSSProperties}>
        <i className="projectile-ring" aria-hidden="true" />
        {Array.from({ length: IMPACT_PARTICLES }, (_, index) => (
          <i key={index} className="projectile-particle" style={particleOffset(index)} aria-hidden="true" />
        ))}
        {chair ? (
          <>
            <i className="projectile-star projectile-star--1" aria-hidden="true">★</i>
            <i className="projectile-star projectile-star--2" aria-hidden="true">★</i>
            <i className="projectile-star projectile-star--3" aria-hidden="true">★</i>
          </>
        ) : null}
      </span>
    </>
  );
}
