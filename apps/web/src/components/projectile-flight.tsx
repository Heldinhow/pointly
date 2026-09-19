import { useLayoutEffect, useRef, type CSSProperties, type RefObject } from "react";
import type { ProjectileThrownPayload, ProjectileType } from "@/lib/protocol";
import "./projectile-flight.css";

export interface ProjectileFlightEvent extends ProjectileThrownPayload {
  key: number;
  receivedAt: number;
}

/** Ícones próprios dos seis projéteis — sem emoji. */
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
      ) : type === "rock" ? (
        <svg viewBox="0 0 40 40" fill="none">
          <path d="M9 14 17 6l13 3 5 11-7 13-12 2L6 26Z" fill="#b3aca1" stroke="#7f7970" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="m17 6 4 11-9 6-6-3M21 17l9-5 5 8-8 6" stroke="#948d83" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="m17 6 4 11-7 2-4-5Z" fill="#d8d3c9" fillOpacity=".8" />
          <path d="m21 17 9-5 5 8-4 2Z" fill="#8b847a" fillOpacity=".6" />
          <path d="m12 24 1.5 1m9-4 1.5 1m-4 7 1.5 1" stroke="#6f6a62" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      ) : type === "brick" ? (
        <svg viewBox="0 0 40 40" fill="none">
          <path d="M6 12 31 7l4 14-25 7Z" fill="#c78765" stroke="#8f5636" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M6 12 31 7l1 4-25 7Z" fill="#e0a481" />
          <path d="M10 26.5 36 19.5l-1 2.5-24 6.5Z" fill="#a4674a" />
          <path d="m13 15 1.5 2.5m6-4 1.5 2.5m6-4 1.5 2.5" stroke="#a4674a" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="15" cy="20" r="1" fill="#9c5f42" />
          <circle cx="26" cy="16.5" r="0.8" fill="#9c5f42" />
        </svg>
      ) : type === "tomato" ? (
        <svg viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="23" r="13.5" fill="#d94f3d" stroke="#9c3327" strokeWidth="1.5" />
          <path d="M20 7v4" stroke="#3f6634" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M20 10c-2-3-6-3.5-9-2.5 2 2 4.5 3.5 7.5 4M20 10c2-3 6-3.5 9-2.5-2 2-4.5 3.5-7.5 4" fill="#5c8a4a" stroke="#3f6634" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M13.5 18c1.5-3.5 4.5-5.5 8-5.5" stroke="#ef8b78" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M27.5 29.5c-2 3-5.5 4.5-9 4" stroke="#9c3327" strokeWidth="1.6" strokeLinecap="round" opacity=".5" />
        </svg>
      ) : (
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
      )}
    </span>
  );
}

type ProjectileWeight = "light" | "medium" | "heavy";

interface ProjectileMotion {
  /** Duração base do voo (ms). */
  baseMs: number;
  /** Acréscimo de duração por pixel de distância (ms/px). */
  msPerPx: number;
  /** Fração da distância que vira altura do arco. */
  arcRatio: number;
  arcMin: number;
  arcMax: number;
  /** Giro total no voo; 0 = alinhado à tangente (aviãozinho). */
  spin: number;
  /** Fração do voo até o contato. */
  contact: number;
  weight: ProjectileWeight;
}

/** Perfil de voo por tipo; a cadeirada tem coreografia própria, fora da tabela. */
const PROJECTILE_MOTION: Record<Exclude<ProjectileType, "chair">, ProjectileMotion> = {
  paper_ball: { baseMs: 320, msPerPx: 1.5, arcRatio: 0.2, arcMin: 40, arcMax: 90, spin: 540, contact: 0.68, weight: "light" },
  paper_plane: { baseMs: 420, msPerPx: 1.8, arcRatio: 0.12, arcMin: 36, arcMax: 60, spin: 0, contact: 0.72, weight: "light" },
  rock: { baseMs: 260, msPerPx: 1.2, arcRatio: 0.18, arcMin: 40, arcMax: 100, spin: 990, contact: 0.66, weight: "heavy" },
  brick: { baseMs: 280, msPerPx: 1.3, arcRatio: 0.16, arcMin: 40, arcMax: 96, spin: 1170, contact: 0.66, weight: "heavy" },
  tomato: { baseMs: 300, msPerPx: 1.4, arcRatio: 0.2, arcMin: 42, arcMax: 100, spin: 720, contact: 0.68, weight: "medium" },
};

const CHAIR_FLIGHT_MS = 1400;
const CHAIR_CONTACT = 0.58;
const FLIGHT_MIN_MS = 560;
const FLIGHT_MAX_MS = 1400;
const IMPACT_MS = 600;
const CHAIR_IMPACT_MS = 800;
const STAR_STAGGER_MS = 80;
const IMPACT_PARTICLES = 5;
const TRAJECTORY_SAMPLES = 60;
const RELEASE_FRACTION = 0.06;

function flightDuration(type: Exclude<ProjectileType, "chair">, distance: number): number {
  const motion = PROJECTILE_MOTION[type];
  return Math.min(FLIGHT_MAX_MS, Math.max(FLIGHT_MIN_MS, motion.baseMs + distance * motion.msPerPx));
}

/** Spray radial da cadeirada (impacto em todas as direções). */
function radialSpray(): Array<{ dx: number; dy: number; spin: number }> {
  return Array.from({ length: IMPACT_PARTICLES }, (_, index) => {
    const angle = (index / IMPACT_PARTICLES) * Math.PI * 2;
    return { dx: Math.cos(angle) * 44, dy: Math.sin(angle) * 40 - 12, spin: index % 2 ? 110 : -85 };
  });
}

/** Partículas empurradas na direção do voo; peso define abertura e queda. */
function directionalSpray(weight: ProjectileWeight, ux: number, uy: number): Array<{ dx: number; dy: number; spin: number }> {
  const base = Math.atan2(uy, ux);
  const spread = weight === "heavy" ? 45 : weight === "medium" ? 65 : 100;
  const travel = weight === "heavy" ? 32 : weight === "medium" ? 46 : 42;
  const droop = weight === "heavy" ? 20 : weight === "medium" ? 14 : 7;
  return Array.from({ length: IMPACT_PARTICLES }, (_, index) => {
    const lane = (index / (IMPACT_PARTICLES - 1)) * 2 - 1;
    const angle = base + lane * spread * Math.PI / 180 + (index % 2 ? 0.12 : -0.12);
    const speed = travel * (index % 2 ? 1 : 0.82);
    return { dx: Math.cos(angle) * speed, dy: Math.sin(angle) * speed + droop, spin: index % 2 ? 110 : -85 };
  });
}

export function ProjectileFlight({ event, arenaRef, onDone }: {
  event: ProjectileFlightEvent;
  arenaRef: RefObject<HTMLDivElement>;
  onDone: (key: number) => void;
}): React.ReactElement {
  const flightRef = useRef<HTMLSpanElement>(null);
  const shadowRef = useRef<HTMLSpanElement>(null);
  const impactRef = useRef<HTMLSpanElement>(null);
  const chair = event.projectileType === "chair";

  useLayoutEffect(() => {
    const node = flightRef.current;
    const shadow = shadowRef.current;
    const impact = impactRef.current;
    const arena = arenaRef.current;
    const done = () => onDone(event.key);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!node || !arena || reducedMotion.matches) {
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
    const ux = dx / distance;
    const uy = dy / distance;
    const side = dx < 0 ? -1 : 1;

    const type = event.projectileType;
    // Cadeirada espalha a poeira um pouco antes do alvo, à frente do corpo.
    const contact = type === "chair" ? { x: to.x - side * 10, y: to.y - 10 } : to;
    const duration = type === "chair" ? CHAIR_FLIGHT_MS : flightDuration(type, distance);
    if (Date.now() - event.receivedAt > duration) {
      done();
      return;
    }
    const contactAt = duration * (type === "chair" ? CHAIR_CONTACT : PROJECTILE_MOTION[type].contact);
    const reactionAt = type !== "chair" && event.outcome === "dodge" ? duration * 0.5 : contactAt;
    const reactionMs = type === "chair" ? 700 : 460;
    const impactMs = type === "chair" ? CHAIR_IMPACT_MS : IMPACT_MS;
    const hasImpact = event.outcome === "hit" || type === "chair";
    // Inclui a última estrela e a recuperação do avatar, não só o voo.
    const lifetime = Math.max(duration, reactionAt + reactionMs,
      hasImpact ? contactAt + impactMs + (type === "chair" ? STAR_STAGGER_MS * 2 : 0) : 0);

    let frames: Keyframe[];
    let shadowFrames: Keyframe[] | null = null;
    if (type === "chair") {
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
        x: to.x - (tipX * Math.cos(radians) - tipY * Math.sin(radians)),
        y: to.y - (tipX * Math.sin(radians) + tipY * Math.cos(radians)),
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
      const motion = PROJECTILE_MOTION[type];
      const arc = Math.min(motion.arcMax, Math.max(motion.arcMin, distance * motion.arcRatio));
      const plane = type === "paper_plane";
      const heavy = motion.weight === "heavy";
      const tomato = type === "tomato";
      const transform = (x: number, y: number, angle: number, scaleX = 1, scaleY = scaleX) =>
        `translate(${x - 18}px, ${y - 18}px) rotate(${angle}deg) scale(${scaleX}, ${scaleY})`;
      const angleAt = (t: number) => {
        if (!plane) return t * motion.spin;
        const angle = Math.atan2(dy - 4 * arc * (1 - 2 * t), dx) * 180 / Math.PI;
        // Mantém a tangente contínua ao cruzar ±180° em voos para a esquerda.
        return dx < 0 && angle < 0 ? angle + 360 : angle;
      };
      // X linear (velocidade de arremesso) + arco parabólico em Y; sai da mão
      // com escala menor por ~6% do voo em vez de nascer colado no centro.
      frames = Array.from({ length: TRAJECTORY_SAMPLES + 1 }, (_, index) => {
        const progress = index / TRAJECTORY_SAMPLES;
        const t = progress;
        const release = progress < RELEASE_FRACTION ? 0.72 + (progress / RELEASE_FRACTION) * 0.28 : 1;
        return {
          offset: progress * motion.contact,
          transform: transform(from.x + dx * t, from.y + dy * t - 4 * arc * t * (1 - t), angleAt(t), release, release),
          opacity: index === 0 ? 0 : 1,
        };
      });
      // Sombra de contato: segue a linha do chão e encolhe/clareia com a altura.
      shadowFrames = Array.from({ length: TRAJECTORY_SAMPLES + 1 }, (_, index) => {
        const progress = index / TRAJECTORY_SAMPLES;
        const t = progress;
        const lift = (4 * arc * t * (1 - t)) / arc;
        return {
          offset: progress * motion.contact,
          transform: `translate(${from.x + dx * t}px, ${from.y + dy * t}px) scale(${1 - lift * 0.45})`,
          opacity: index === 0 ? 0 : 0.5 * (1 - lift * 0.55),
        };
      });
      const angle = angleAt(1);
      if (event.outcome === "hit") {
        if (tomato) {
          frames.push(
            { offset: motion.contact + 0.025, transform: transform(to.x, to.y, angle, 1.45, 0.45), opacity: 1, easing: "ease-out" },
            { offset: 0.84, transform: transform(to.x, to.y + 5, angle, 1.65, 0.2), opacity: 0 },
            { offset: 1, transform: transform(to.x, to.y + 5, angle, 1.65, 0.2), opacity: 0 },
          );
        } else {
          const rebound = heavy ? 14 : 24;
          frames.push(
            { offset: motion.contact + 0.025, transform: transform(to.x, to.y, angle, heavy ? 1 : plane ? 0.6 : 0.85, heavy ? 1 : 1.12), opacity: 1, easing: "ease-out" },
            { offset: 0.82, transform: transform(to.x - ux * rebound, to.y - uy * rebound - 10, angle + side * (plane ? 12 : 28), 0.95), opacity: 1, easing: "ease-in" },
            { offset: 1, transform: transform(to.x - ux * rebound * 1.5, to.y + 32, angle + side * (plane ? 24 : 75), 0.75), opacity: 0 },
          );
        }
        shadowFrames.push({ offset: 1, transform: `translate(${to.x}px, ${to.y}px) scale(0.82)`, opacity: 0 });
      } else {
        const travel = event.outcome === "deflect" ? -90 : 65;
        const exitX = to.x + ux * travel;
        const exitY = to.y + uy * travel + 28;
        frames.push({ offset: 1, transform: transform(exitX, exitY, angle + (plane ? 0 : -270), 0.65), opacity: 0 });
        shadowFrames.push({ offset: 1, transform: `translate(${exitX}px, ${exitY}px) scale(0.7)`, opacity: 0 });
      }
    }

    const animations: Animation[] = [];
    // Sem Web Animations API, o voo some e o alvo não reage — sem quebrar.
    if (typeof node.animate === "function") {
      animations.push(node.animate(frames, { duration, fill: "both" }));
      if (shadow && shadowFrames) {
        animations.push(shadow.animate(shadowFrames, { duration, fill: "both" }));
      }
      // Reação do alvo por desfecho: squash+shake no hit, passo lateral no
      // dodge, tilt no deflect — e tilt+shake forte no smash da cadeirada.
      const heavyHit = type !== "chair" && PROJECTILE_MOTION[type].weight === "heavy";
      const push = type === "chair" ? 0 : heavyHit ? 10 : type === "tomato" ? 6 : 3;
      const reaction: Keyframe[] = type === "chair"
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
              { offset: 0.1, transform: `translate(${ux * push}px, ${uy * push}px) rotate(${side * push}deg) scale(${heavyHit ? 0.88 : 0.96})` },
              { offset: 0.24, transform: `translate(${ux * push}px, ${uy * push}px) rotate(${side * push}deg) scale(${heavyHit ? 0.88 : 0.96})` },
              { offset: 0.6, transform: `translate(${-ux * push * 0.25}px, ${-uy * push * 0.25}px) rotate(${-side * push * 0.3}deg)` },
              { offset: 1, transform: "none" },
            ];
      animations.push(target.animate(reaction, {
        duration: reactionMs,
        delay: reactionAt,
        easing: "ease-out",
      }));
      // Explosão de partículas no ponto de contato (cor por tipo, via CSS).
      if (impact) {
        impact.style.left = `${contact.x}px`;
        impact.style.top = `${contact.y}px`;
        impact.style.setProperty("--contact-delay", `${contactAt}ms`);
        impact.style.setProperty("--impact-duration", `${impactMs}ms`);
        impact.style.setProperty("--star-offset", `${Math.max(0, 72 - contact.y)}px`);
        // O spray parte na direção do voo (cadeirada segue radial).
        const spray = type === "chair"
          ? radialSpray()
          : directionalSpray(PROJECTILE_MOTION[type].weight, ux, uy);
        impact.querySelectorAll<HTMLElement>(".projectile-particle").forEach((particle, index) => {
          const shot = spray[index % spray.length] ?? spray[0]!;
          particle.style.setProperty("--dx", `${shot.dx}px`);
          particle.style.setProperty("--dy", `${shot.dy}px`);
          particle.style.setProperty("--spin", `${shot.spin}deg`);
        });
        if (hasImpact) {
          animations.push(impact.animate(
            [{ opacity: 1 }, { opacity: 1 }],
            { duration: impactMs + (type === "chair" ? STAR_STAGGER_MS * 2 : 0), delay: contactAt },
          ));
        }
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
  }, [event, arenaRef, onDone]);
  return (
    <>
      {chair ? null : <span ref={shadowRef} className="projectile-shadow" data-testid="projectile-shadow" aria-hidden="true" />}
      <span ref={flightRef} className={chair ? "projectile-flight projectile-flight--chair" : "projectile-flight"} data-testid="projectile-flight" data-target={event.targetPlayerId} data-outcome={event.outcome} data-projectile={event.projectileType} aria-hidden="true">
        <ProjectileIcon type={event.projectileType} />
        {chair ? (
          <svg className="projectile-grip" viewBox="0 0 80 88" fill="none" aria-hidden="true">
            {["translate(15 7)", "translate(40 1)"].map((position) => (
              <g key={position} transform={position} stroke="#79543d" strokeWidth="0.7" strokeLinejoin="round">
                <path d="m-6 0 7 2-1 5-7-2Z" fill="#303d47" stroke="#a8b5bf" />
                <path d="m-1 1 3 1-1 5-3-1Z" fill="#e4e9e9" stroke="none" />
                <path d="M2 1q1-2 2 0 1-2 2 0 2-1 2 1v5q0 2-2 2H3Q0 8 0 6V4q0-1 1-1l2 1Z" fill="#e8b48d" />
                <path d="M4 2v3m2-3v3M1 4l3 1" stroke="#a67148" strokeLinecap="round" />
              </g>
            ))}
          </svg>
        ) : null}
      </span>
      <span ref={impactRef} className={`projectile-impact projectile-impact--${event.projectileType} projectile-impact--${event.outcome}`} data-testid="projectile-impact" aria-hidden="true" style={{ "--contact-delay": "0ms", "--impact-duration": `${IMPACT_MS}ms`, "--star-stagger": `${STAR_STAGGER_MS}ms` } as CSSProperties}>
        <i className="projectile-ring" aria-hidden="true" />
        {Array.from({ length: IMPACT_PARTICLES }, (_, index) => (
          <i key={index} className="projectile-particle" aria-hidden="true" />
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
