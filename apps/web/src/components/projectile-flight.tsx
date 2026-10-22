import { useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { createPortal } from "react-dom";
import type { ProjectileThrownPayload, ProjectileType } from "@planning-poker/shared";
import { PROJECTILE_CATALOG } from "@/lib/projectiles";
import type { Lang } from "@/lib/i18n";
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
type CommonProjectile = Exclude<ProjectileType, "chair">;

interface ProjectileMotion {
  /** Duração base do voo até o contato (ms). */
  baseMs: number;
  /** Acréscimo de duração por pixel de distância (ms/px). */
  msPerPx: number;
  /** Fração da distância que vira altura do arco. */
  arcRatio: number;
  arcMin: number;
  arcMax: number;
  /** Giro total no voo; 0 = alinhado à tangente (aviãozinho). */
  spin: number;
  /** Duração da batida própria depois do contato (ms), só no acerto. */
  afterMs: number;
  weight: ProjectileWeight;
}

/** Perfil de voo por tipo; a cadeirada tem coreografia própria, fora da tabela. */
const PROJECTILE_MOTION: Record<CommonProjectile, ProjectileMotion> = {
  paper_ball: { baseMs: 300, msPerPx: 1.3, arcRatio: 0.22, arcMin: 44, arcMax: 96, spin: 540, afterMs: 760, weight: "light" },
  paper_plane: { baseMs: 620, msPerPx: 1.9, arcRatio: 0.1, arcMin: 24, arcMax: 48, spin: 0, afterMs: 1100, weight: "light" },
  rock: { baseMs: 220, msPerPx: 0.85, arcRatio: 0.12, arcMin: 30, arcMax: 70, spin: 720, afterMs: 1300, weight: "heavy" },
  brick: { baseMs: 340, msPerPx: 1.2, arcRatio: 0.2, arcMin: 48, arcMax: 110, spin: 540, afterMs: 1700, weight: "heavy" },
  tomato: { baseMs: 300, msPerPx: 1.25, arcRatio: 0.2, arcMin: 42, arcMax: 100, spin: 600, afterMs: 2700, weight: "medium" },
};

/** Curva temporal do voo por peso: leve flutua (sai rápido e desacelera), pesado acelera. */
const WEIGHT_WARP: Record<ProjectileWeight, (t: number) => number> = {
  light: (t) => 1 - (1 - t) ** 1.25,
  medium: (t) => t,
  heavy: (t) => t ** 1.45,
};

/** Batida da cadeirada (ms desde o arremesso). */
export const CHAIR_TIMELINE = {
  contact: 900,
  hitStop: 60,
  /** Após o impacto a cadeira troca de camada (assento → sob os assentos). */
  swapAfterImpact: 180,
  landed: 1460,
  restUntil: 3100,
  end: 3400,
} as const;
const FLIGHT_MIN_MS = 480;
const FLIGHT_MAX_MS = 1500;
const MISS_AFTER_MS = 320;
const IMPACT_MS = 600;
const CHAIR_IMPACT_MS = 500;
const STAR_STAGGER_MS = 80;
const IMPACT_PARTICLES = 5;
const TRAJECTORY_SAMPLES = 48;
const RELEASE_FRACTION = 0.06;
const ECHO_DELAYS_MS = [35, 70];
const ECHO_OPACITIES = [0.26, 0.13];
const TABLE_SHAKE_MS = 150;
const TABLE_SHAKE_PX = 3;
const PARTICLE_SAMPLES = 14;
const CHAIR_STARS = 5;
const TOMATO_DRIPS = 3;
/** Versão de movimento reduzido: ícone + rótulo estáticos junto do alvo. */
export const STATIC_NOTICE_MS = 1500;

const STAMP_TEXT: Record<Lang, string> = { "pt-BR": "CADEIRADA!", en: "CHAIR SMASH!" };

/** Partícula do impacto em coordenadas balísticas (px/s). */
interface ImpactParticle {
  vx: number;
  vy: number;
  spin: number;
  gravity: number;
}

function flightDuration(type: CommonProjectile, distance: number): number {
  const motion = PROJECTILE_MOTION[type];
  return Math.min(FLIGHT_MAX_MS, Math.max(FLIGHT_MIN_MS, motion.baseMs + distance * motion.msPerPx));
}

function launch(dx: number, dy: number, spin: number, gravity: number, seconds: number): ImpactParticle {
  return { vx: dx / seconds, vy: (dy - 0.5 * gravity * seconds ** 2) / seconds, spin, gravity };
}

/** Estilhaços radiais da cadeirada. */
function radialSpray(seconds: number): ImpactParticle[] {
  return Array.from({ length: IMPACT_PARTICLES }, (_, index) => {
    const angle = (index / IMPACT_PARTICLES) * Math.PI * 2 - Math.PI / 2;
    return launch(Math.cos(angle) * 56, Math.sin(angle) * 44 - 16, index % 2 ? 260 : -200, 180, seconds);
  });
}

/** Partículas empurradas na direção do voo; peso define abertura e queda. */
function directionalSpray(weight: ProjectileWeight, ux: number, uy: number, seconds: number): ImpactParticle[] {
  const base = Math.atan2(uy, ux);
  const spread = weight === "heavy" ? 45 : weight === "medium" ? 65 : 100;
  const travel = weight === "heavy" ? 32 : weight === "medium" ? 46 : 42;
  const droop = weight === "heavy" ? 20 : weight === "medium" ? 14 : 7;
  const gravity = weight === "heavy" ? 170 : weight === "medium" ? 140 : 110;
  return Array.from({ length: IMPACT_PARTICLES }, (_, index) => {
    const lane = (index / (IMPACT_PARTICLES - 1)) * 2 - 1;
    const angle = base + lane * spread * Math.PI / 180 + (index % 2 ? 0.12 : -0.12);
    const speed = travel * (index % 2 ? 1 : 0.82);
    return launch(Math.cos(angle) * speed, Math.sin(angle) * speed + droop, index % 2 ? 190 : -140, gravity, seconds);
  });
}

function particleFrames(particle: ImpactParticle, seconds: number): Keyframe[] {
  return Array.from({ length: PARTICLE_SAMPLES + 1 }, (_, index) => {
    const progress = index / PARTICLE_SAMPLES;
    const t = progress * seconds;
    return {
      offset: progress,
      transform: `translate(${particle.vx * t}px, ${particle.vy * t + 0.5 * particle.gravity * t * t}px) rotate(${particle.spin * t}deg)`,
      opacity: progress < 0.3 ? 1 : Math.max(0, 1 - (progress - 0.3) / 0.7),
    };
  });
}

const round = (value: number) => Math.round(value * 100) / 100;

export function ProjectileFlight({ event, arenaRef, onDone, lang = "pt-BR" }: {
  event: ProjectileFlightEvent;
  arenaRef: RefObject<HTMLDivElement>;
  onDone: (key: number) => void;
  lang?: Lang;
}): React.ReactElement {
  const flightRef = useRef<HTMLSpanElement>(null);
  const shadowRef = useRef<HTMLSpanElement>(null);
  const echoRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const impactRef = useRef<HTMLSpanElement>(null);
  const staticRef = useRef<HTMLSpanElement>(null);
  const chair = event.projectileType === "chair";
  const type = event.projectileType;
  const hit = event.outcome === "hit" || chair;
  // A cadeira voa na camada sob os assentos (dentro da mesa): nomes e avatares
  // ficam sempre por cima dela; carimbo/estrelas seguem na camada de cima.
  // Voo e impacto no assento do alvo (acima do avatar, abaixo dos chips);
  // repouso na camada sob os assentos. Carimbo/estrelas na camada de cima.
  const restRef = useRef<HTMLSpanElement>(null);
  const [hosts] = useState<{ seat: HTMLElement | null; under: HTMLElement | null }>(() => {
    const arena = chair ? arenaRef.current : null;
    const seat = arena?.querySelector<HTMLElement>(`[data-projectile-player="${event.targetPlayerId}"]`)?.closest<HTMLElement>(".poker-seat") ?? null;
    return { seat, under: arena?.querySelector<HTMLElement>(".projectile-layer-under") ?? null };
  });

  useLayoutEffect(() => {
    const node = flightRef.current;
    const shadow = shadowRef.current;
    const echoes = echoRefs.current;
    const impact = impactRef.current;
    const notice = staticRef.current;
    const arena = arenaRef.current;
    const animations: Animation[] = [];
    let lifetime = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let observer: MutationObserver | undefined;
    let restoreTarget: (() => void) | undefined;
    let finished = false;
    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      clearTimeout(timer);
      observer?.disconnect();
      animations.forEach((animation) => animation.cancel());
      restoreTarget?.();
      window.removeEventListener("resize", done);
      document.removeEventListener("visibilitychange", done);
      reducedMotion.removeEventListener("change", done);
    };
    const done = () => {
      if (finished) return;
      finished = true;
      cleanup();
      onDone(event.key);
    };
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!node || !arena) {
      done();
      return;
    }
    // Anonimato: a origem é o centro da mesa (ou fora da tela, na cadeirada) —
    // nunca o avatar de quem arremessou.
    const target = arena.querySelector<HTMLElement>(`[data-projectile-player="${event.targetPlayerId}"]`);
    if (!target) {
      done();
      return;
    }
    const watchLifetime = (ms: number) => {
      timer = setTimeout(done, ms);
      window.addEventListener("resize", done);
      document.addEventListener("visibilitychange", done);
      reducedMotion.addEventListener("change", done);
      observer = new window.MutationObserver(() => {
        if (!arena.contains(target)) done();
      });
      observer.observe(arena, { childList: true, subtree: true });
    };
    const bounds = arena.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const to = {
      x: targetRect.left + targetRect.width / 2 - bounds.left,
      y: targetRect.top + targetRect.height / 2 - bounds.top,
    };
    const radius = targetRect.width / 2 || 22;
    const age = Date.now() - event.receivedAt;

    if (reducedMotion.matches) {
      // Versão estática: ícone + rótulo junto do alvo, sem voo nem tremor.
      if (age > STATIC_NOTICE_MS || !notice) {
        done();
        return;
      }
      notice.style.left = `${round(to.x)}px`;
      notice.style.top = `${round(to.y - radius - 6)}px`;
      notice.dataset.visible = "true";
      watchLifetime(STATIC_NOTICE_MS);
      return cleanup;
    }

    const run = (element: Element | null | undefined, frames: Keyframe[], timing: KeyframeAnimationOptions) => {
      if (!element || typeof element.animate !== "function") return;
      animations.push(element.animate(frames, timing));
      lifetime = Math.max(lifetime, Number(timing.delay ?? 0) + Number(timing.duration ?? 0));
    };
    const origin = arena.querySelector<HTMLElement>(".poker-center");
    const originRect = origin?.getBoundingClientRect();
    const center = originRect
      ? { x: originRect.left + originRect.width / 2 - bounds.left, y: originRect.top + originRect.height / 2 - bounds.top }
      : { x: bounds.width / 2, y: bounds.height / 2 };
    const sideOf = (x: number) => (to.x - x < 0 ? -1 : 1);
    const at = (ms: number, total: number) => Math.round((ms / total) * 10000) / 10000;

    if (impact) {
      impact.style.left = `${round(to.x)}px`;
      impact.style.top = `${round(to.y)}px`;
      impact.style.setProperty("--avatar-r", `${round(radius)}px`);
    }

    if (chair) {
      const T = CHAIR_TIMELINE;
      const total = T.end;
      if (age > total) {
        done();
        return;
      }
      const side = sideOf(center.x);
      // Escala relativa ao desenho (80×88): ~2× o avatar no impacto, ~1,2× tombada.
      const chairH = 88;
      const size = (radius * 2 * 2) / chairH;
      const restScale = (radius * 2 * 1.2) / chairH;
      // Entra de fora da tela, pelo alto e do lado de dentro da mesa.
      const from = {
        x: Math.min(bounds.width - 40, Math.max(40, to.x - side * Math.min(170, bounds.width * 0.3))),
        y: -bounds.top - 140,
      };
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const distance = Math.hypot(dx, dy) || 1;
      const ux = dx / distance;
      const uy = dy / distance;
      const contact = { x: to.x - ux * (radius + 14), y: to.y - uy * (radius + 14) };
      // Lado livre: o que tem mais espaço até a borda ou até o avatar vizinho
      // na mesma faixa de altura. Sem espaço dos dois lados → à frente (rumo ao centro).
      const viewportW = document.documentElement.clientWidth || window.innerWidth;
      const restOffset = radius + 36;
      const neighbors = [...arena.querySelectorAll<HTMLElement>("[data-projectile-player]")]
        .filter((element) => element !== target)
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return { x: rect.left + rect.width / 2 - bounds.left, y: rect.top + rect.height / 2 - bounds.top };
        })
        .filter((point) => Math.abs(point.y - to.y) < radius * 3);
      const spaceOn = (dir: number) => {
        const edge = dir > 0 ? viewportW - bounds.left - to.x : to.x + bounds.left;
        const near = neighbors
          .filter((point) => Math.sign(point.x - to.x) === dir)
          .map((point) => Math.abs(point.x - to.x) - radius * 2.2);
        return Math.min(edge, ...near);
      };
      const need = restOffset + 34;
      const left = spaceOn(-1);
      const right = spaceOn(1);
      let rest: { x: number; y: number };
      let restSide: number;
      if (Math.max(left, right) >= need) {
        restSide = right >= left ? 1 : -1;
        rest = { x: to.x + restSide * restOffset, y: to.y - 10 };
      } else {
        const cx = center.x - to.x;
        const cy = center.y - to.y;
        const len = Math.hypot(cx, cy) || 1;
        restSide = cx < 0 ? -1 : 1;
        rest = { x: to.x + (cx / len) * (radius + 52), y: to.y + (cy / len) * (radius + 52) };
      }
      const strikeRot = -side * 24;
      const restRot = restSide * 96;
      const flightChair = node;
      const restChair = restRef.current;
      flightChair.style.setProperty("--chair-facing", String(side));
      restChair?.style.setProperty("--chair-facing", String(side));
      // Coordenadas da arena → coordenadas da camada onde cada cadeira foi montada.
      const shiftOf = (element: HTMLElement | null | undefined) => {
        const host = element?.parentElement;
        if (!host || host === arena || !host.closest(".poker-table")) return { x: 0, y: 0 };
        const rect = host.getBoundingClientRect();
        return { x: rect.left - bounds.left, y: rect.top - bounds.top };
      };
      const switchAt = T.contact + T.swapAfterImpact;
      const timeline = (shift: { x: number; y: number }, visible: (ms: number) => number): Keyframe[] => {
        const pose = (x: number, y: number, rotation: number, sx: number, sy = sx) =>
          `translate(${round(x - 40 - shift.x)}px, ${round(y - 44 - shift.y)}px) rotate(${round(rotation)}deg) scale(${round(sx)}, ${round(sy)})`;
        const frames: Keyframe[] = [];
        const samples = 24;
        for (let index = 0; index < samples; index += 1) {
          const t = index / samples;
          const fall = t ** 1.6;
          const ms = t * T.contact;
          frames.push({
            offset: at(ms, total),
            transform: pose(from.x + (contact.x - from.x) * t, from.y + (contact.y - from.y) * fall, strikeRot - side * 720 * (1 - t) ** 1.3, size),
            opacity: visible(ms),
          });
        }
        const squash = pose(contact.x, contact.y, strikeRot, size * 1.1, size * 0.86);
        const apex = { x: (contact.x + rest.x) / 2, y: Math.min(contact.y, rest.y) - 34 };
        const recoil = { x: contact.x + (apex.x - contact.x) * 0.3, y: contact.y + (apex.y - contact.y) * 0.3 };
        const recoilPose = pose(recoil.x, recoil.y, strikeRot + (restRot - strikeRot) * 0.15, size * 0.92);
        frames.push(
          { offset: at(T.contact, total), transform: squash, opacity: visible(T.contact) },
          { offset: at(T.contact + T.hitStop, total), transform: squash, opacity: visible(T.contact), easing: "cubic-bezier(0.2, 0.8, 0.4, 1)" },
          { offset: at(switchAt, total), transform: recoilPose, opacity: visible(switchAt - 1) },
          { offset: at(switchAt + 1, total), transform: recoilPose, opacity: visible(switchAt + 1), easing: "cubic-bezier(0.2, 0.7, 0.4, 1)" },
          { offset: at(1260, total), transform: pose(apex.x, apex.y, (strikeRot + restRot) / 2, (size + restScale) / 2), opacity: visible(1260), easing: "cubic-bezier(0.6, 0, 0.9, 0.5)" },
          { offset: at(T.landed, total), transform: pose(rest.x, rest.y, restRot + restSide * 10, restScale), opacity: visible(T.landed), easing: "ease-out" },
          { offset: at(T.landed + 110, total), transform: pose(rest.x, rest.y, restRot - restSide * 4, restScale), opacity: visible(T.landed), easing: "ease-in-out" },
          { offset: at(T.landed + 200, total), transform: pose(rest.x, rest.y, restRot, restScale), opacity: visible(T.landed) },
          { offset: at(T.restUntil, total), transform: pose(rest.x, rest.y, restRot, restScale), opacity: visible(T.restUntil), easing: "ease-in" },
          { offset: 1, transform: pose(rest.x, rest.y + 6, restRot, restScale * 0.96), opacity: 0 },
        );
        return frames;
      };
      if (restChair) {
        // Voo + impacto: no assento do alvo (acima do avatar, abaixo dos chips);
        // depois troca para a camada sob os assentos e tomba ao lado.
        run(flightChair, timeline(shiftOf(flightChair), (ms) => (ms < switchAt ? 1 : 0)), { duration: total, fill: "both" });
        run(restChair, timeline(shiftOf(restChair), (ms) => (ms < switchAt ? 0 : 1)), { duration: total, fill: "both" });
      } else {
        run(flightChair, timeline(shiftOf(flightChair), () => 1), { duration: total, fill: "both" });
      }
      // O assento do alvo desce abaixo dos vizinhos durante o voo: a cadeira
      // passa por baixo dos nomes alheios (z-index discreto, sem layout).
      const seat = target.closest<HTMLElement>(".poker-seat");
      if (seat && flightChair.parentElement === seat) {
        run(seat, [{ zIndex: 0 }, { zIndex: 0 }], { duration: switchAt + 1, fill: "none" });
      }

      // Tremor curto da mesa: 3px por 150ms.
      const table = arena.querySelector<HTMLElement>(".poker-table");
      const s = TABLE_SHAKE_PX;
      run(table, [
        { transform: "none" },
        { offset: 0.2, transform: `translate(${s * side}px, ${s * 0.6}px)` },
        { offset: 0.45, transform: `translate(${-s * side * 0.8}px, ${-s * 0.4}px)` },
        { offset: 0.7, transform: `translate(${s * side * 0.4}px, ${s * 0.2}px)` },
        { transform: "none" },
      ], { duration: TABLE_SHAKE_MS, delay: T.contact, easing: "linear" });

      // O assento balança a partir da base, com squash no golpe.
      const previousOrigin = target.style.transformOrigin;
      target.style.transformOrigin = "50% 100%";
      restoreTarget = () => { target.style.transformOrigin = previousOrigin; };
      const squash = `translate(${round(ux * 4)}px, ${round(uy * 4 + 6)}px) rotate(${side * 14}deg) scale(1.08, 0.78)`;
      const reactionMs = 1000;
      run(target, [
        { offset: 0, transform: squash },
        { offset: T.hitStop / reactionMs, transform: squash, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
        { offset: 0.28, transform: `rotate(${-side * 12}deg) scale(1.03, 1.04)`, easing: "ease-in-out" },
        { offset: 0.48, transform: `rotate(${side * 8}deg)`, easing: "ease-in-out" },
        { offset: 0.66, transform: `rotate(${-side * 4}deg)`, easing: "ease-in-out" },
        { offset: 0.82, transform: `rotate(${side * 2}deg)`, easing: "ease-out" },
        { offset: 1, transform: "none" },
      ], { duration: reactionMs, delay: T.contact, easing: "linear" });

      if (impact) {
        impact.style.setProperty("--contact-delay", `${T.contact}ms`);
        impact.style.setProperty("--impact-duration", `${CHAIR_IMPACT_MS}ms`);
        const seconds = CHAIR_IMPACT_MS / 1000;
        const spray = radialSpray(seconds);
        impact.querySelectorAll<HTMLElement>(".projectile-particle").forEach((particle, index) => {
          run(particle, particleFrames(spray[index % spray.length]!, seconds), { duration: CHAIR_IMPACT_MS, delay: T.contact, easing: "linear", fill: "both" });
        });
        // Estrelas orbitando a cabeça do alvo (contorno escuro: lê nos dois temas).
        const orbitMs = 1500;
        impact.querySelectorAll<HTMLElement>(".projectile-star").forEach((star, index) => {
          const phase = (index / CHAIR_STARS) * Math.PI * 2;
          const starFrames: Keyframe[] = Array.from({ length: 17 }, (_, step) => {
            const p = step / 16;
            const angle = phase + p * Math.PI * 2.2;
            const pop = p < 0.1 ? p / 0.1 : p > 0.8 ? Math.max(0, (1 - p) / 0.2) : 1;
            return {
              offset: p,
              transform: `translate(${round(Math.cos(angle) * (radius + 12))}px, ${round(-radius - 8 + Math.sin(angle) * 9)}px) rotate(${round(p * 260)}deg) scale(${round(0.4 + 0.6 * pop)})`,
              opacity: round(pop),
            };
          });
          run(star, starFrames, { duration: orbitMs, delay: T.contact + index * 30, easing: "linear", fill: "both" });
        });
        // Carimbo junto do alvo: acima do avatar, ou abaixo do nome se a barra fixa cobrir.
        const stamp = impact.querySelector<HTMLElement>(".projectile-stamp");
        // Posição do carimbo: primeira candidata livre dentro da viewport, abaixo
        // da barra fixa e sem cobrir a cadeira tombada, nomes, status nem avatares
        // (preferência: acima do avatar → lado oposto à cadeira → abaixo do status
        // → além da cadeira). Sem candidata limpa: a de menor sobreposição.
        const toolbarBottom = document.querySelector(".arena-toolbar")?.getBoundingClientRect().bottom ?? 0;
        const viewportH = window.innerHeight || 800;
        const vw = document.documentElement.clientWidth || window.innerWidth;
        const stampScale = window.matchMedia("(max-width: 700px)").matches ? 0.8 : 1;
        // Caixa visível: giro de -8° + "pop" de entrada (~1,15 quando já opaco).
        const w = (stamp?.offsetWidth ?? 120) * stampScale * 1.15 + 10;
        const h = (stamp?.offsetHeight ?? 26) * stampScale * 1.15 + 14;
        type Box = { l: number; t: number; r: number; b: number };
        const vx = bounds.left + to.x;
        const vy = bounds.top + to.y;
        const boxAt = (dx: number, dy: number): Box => ({ l: vx + dx - w / 2, t: vy + dy - h / 2, r: vx + dx + w / 2, b: vy + dy + h / 2 });
        const restHalf = (chairH * restScale) / 2 + 4;
        const obstacles: Box[] = [
          { l: bounds.left + rest.x - restHalf, t: bounds.top + rest.y - restHalf, r: bounds.left + rest.x + restHalf, b: bounds.top + rest.y + restHalf },
          ...[...arena.querySelectorAll<HTMLElement>(".poker-name, .poker-status, .poker-avatar, .poker-empty-label")].map((element) => {
            const rect = element.getBoundingClientRect();
            return { l: rect.left - 3, t: rect.top - 3, r: rect.right + 3, b: rect.bottom + 3 };
          }).filter((box) => box.r > box.l),
        ];
        const area = (box: Box) => obstacles.reduce((sum, o) =>
          sum + Math.max(0, Math.min(box.r, o.r) - Math.max(box.l, o.l)) * Math.max(0, Math.min(box.b, o.b) - Math.max(box.t, o.t)), 0);
        const inside = (box: Box) => box.l >= 4 && box.r <= vw - 4 && box.t >= toolbarBottom + 4 && box.b <= viewportH - 4;
        const statusBottom = target.closest(".poker-seat")?.querySelector(".poker-status")?.getBoundingClientRect().bottom;
        const below = (statusBottom ?? vy + radius + 46) - vy + 6 + h / 2;
        const opposite = -restSide;
        const candidates: Array<[number, number]> = [
          [0, -radius - 6 - h / 2],
          [opposite * (radius + 8 + w / 2), -radius / 2],
          [opposite * (radius + 8 + w / 2), 0],
          [0, below],
          [rest.x - to.x + restSide * (restHalf + 6 + w / 2), rest.y - to.y],
          [rest.x - to.x, rest.y - to.y - restHalf - 6 - h / 2],
          [rest.x - to.x, rest.y - to.y + restHalf + 6 + h / 2],
        ];
        const scored = candidates.map(([dx, dy], index) => ({ dx, dy, index, box: boxAt(dx, dy) }))
          .filter(({ box }) => inside(box))
          .map((candidate) => ({ ...candidate, overlap: area(candidate.box) }));
        const best = scored.find((candidate) => candidate.overlap === 0)
          ?? [...scored].sort((x, y) => x.overlap - y.overlap)[0]
          ?? { dx: Math.min(Math.max(0, w / 2 + 4 - vx), vw - w / 2 - 4 - vx), dy: Math.max(-radius - 6 - h / 2, toolbarBottom + h / 2 + 4 - vy), index: -1 };
        stamp?.setAttribute("data-placement", String(best.index));
        const stampAt = (scale: number, rotation: number) =>
          `translate(${round(best.dx)}px, ${round(best.dy)}px) translate(-50%, -50%) rotate(${rotation}deg) scale(${round(scale * stampScale)})`;
        run(stamp, [
          { offset: 0, transform: stampAt(1.6, -14), opacity: 0, easing: "cubic-bezier(0.5, 0, 0.75, 0)" },
          { offset: 0.1, transform: stampAt(0.92, -8), opacity: 1, easing: "ease-out" },
          { offset: 0.17, transform: stampAt(1.05, -9), opacity: 1, easing: "ease-in-out" },
          { offset: 0.24, transform: stampAt(1, -8), opacity: 1 },
          { offset: 0.85, transform: stampAt(1, -8), opacity: 1, easing: "ease-in" },
          { offset: 1, transform: stampAt(1.06, -8), opacity: 0 },
        ], { duration: 1900, delay: T.contact + T.hitStop, fill: "both" });
        run(impact, [{ opacity: 1 }, { opacity: 1 }], {
          duration: Math.max(CHAIR_IMPACT_MS + STAR_STAGGER_MS * 2, total - T.contact),
          delay: T.contact,
        });
      }
      watchLifetime(Math.max(lifetime, total));
      return cleanup;
    }

    // ——— Projéteis comuns ———
    const motion = PROJECTILE_MOTION[type as CommonProjectile];
    const from = center;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.hypot(dx, dy) || 1;
    const ux = dx / distance;
    const uy = dy / distance;
    const side = dx < 0 ? -1 : 1;
    const flightMs = flightDuration(type as CommonProjectile, distance);
    const total = flightMs + (hit ? motion.afterMs : MISS_AFTER_MS);
    if (age > total) {
      done();
      return;
    }
    const contactFraction = flightMs / total;
    const arc = Math.min(motion.arcMax, Math.max(motion.arcMin, distance * motion.arcRatio));
    const plane = type === "paper_plane";
    const warp = WEIGHT_WARP[motion.weight];
    const sway = plane ? Math.min(34, Math.max(16, distance * 0.14)) : 0;
    const pathAt = (raw: number) => {
      const t = warp(Math.min(1, Math.max(0, raw)));
      // Aviãozinho: voo em S (senoide perpendicular à reta, zero nas pontas).
      const s = Math.sin(t * Math.PI * 2) * sway;
      return {
        x: from.x + dx * t - uy * s,
        y: from.y + dy * t - 4 * arc * t * (1 - t) + ux * s,
      };
    };
    const tangentAt = (t: number) => {
      const a = pathAt(t - 0.015);
      const b = pathAt(t + 0.015);
      return Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
    };
    let lastAngle = plane ? tangentAt(0) : 0;
    const angleAt = (t: number) => {
      if (!plane) return t * motion.spin * side;
      // Tangente contínua: desenrola o salto de ±180°.
      let angle = tangentAt(t);
      while (angle - lastAngle > 180) angle -= 360;
      while (angle - lastAngle < -180) angle += 360;
      lastAngle = angle;
      return angle;
    };
    const transform = (x: number, y: number, angle: number, scaleX = 1, scaleY = scaleX) =>
      `translate(${round(x - 18)}px, ${round(y - 18)}px) rotate(${round(angle)}deg) scale(${round(scaleX)}, ${round(scaleY)})`;
    const frames: Keyframe[] = [];
    const shadowFrames: Keyframe[] = [];
    for (let index = 0; index <= TRAJECTORY_SAMPLES; index += 1) {
      const t = index / TRAJECTORY_SAMPLES;
      const point = pathAt(t);
      const release = t < RELEASE_FRACTION ? 0.72 + (t / RELEASE_FRACTION) * 0.28 : 1;
      const tw = warp(t);
      const lift = 4 * tw * (1 - tw);
      frames.push({ offset: round(t * contactFraction), transform: transform(point.x, point.y, angleAt(t), release), opacity: index === 0 ? 0 : 1 });
      shadowFrames.push({
        offset: round(t * contactFraction),
        transform: `translate(${round(from.x + dx * tw)}px, ${round(from.y + dy * tw)}px) scale(${round(1 - lift * 0.45)})`,
        opacity: index === 0 ? 0 : round(0.5 * (1 - lift * 0.55)),
      });
    }
    const endAngle = angleAt(1);
    const after = (ms: number) => round((flightMs + ms) / total);
    const floorY = to.y + radius + 14;
    if (hit) {
      if (type === "paper_ball") {
        // Quica uma vez no avatar e rola para fora, pelo chão.
        const roll = side;
        frames.push(
          { offset: after(50), transform: transform(to.x, to.y, endAngle, 1.18, 0.8), opacity: 1, easing: "cubic-bezier(0.2, 0.7, 0.4, 1)" },
          { offset: after(280), transform: transform(to.x - ux * 14 + roll * 16, to.y - 38, endAngle + roll * 140), opacity: 1, easing: "cubic-bezier(0.55, 0, 0.85, 0.4)" },
          { offset: after(460), transform: transform(to.x + roll * 34, floorY, endAngle + roll * 260, 1.08, 0.9), opacity: 1, easing: "ease-out" },
          { offset: 1, transform: transform(to.x + roll * 96, floorY + 4, endAngle + roll * 560, 0.9), opacity: 0 },
        );
      } else if (type === "paper_plane") {
        // Pousa espetado: o bico entra no anel e o aviãozinho vibra antes de cair.
        const rad = endAngle * Math.PI / 180;
        const stuck = { x: to.x - Math.cos(rad) * (radius + 6), y: to.y - Math.sin(rad) * (radius + 6) };
        frames.push(
          { offset: after(40), transform: transform(stuck.x, stuck.y, endAngle + 5, 0.94, 1), opacity: 1, easing: "ease-out" },
          { offset: after(110), transform: transform(stuck.x, stuck.y, endAngle - 4), opacity: 1, easing: "ease-in-out" },
          { offset: after(180), transform: transform(stuck.x, stuck.y, endAngle + 2), opacity: 1, easing: "ease-in-out" },
          { offset: after(240), transform: transform(stuck.x, stuck.y, endAngle), opacity: 1 },
          { offset: after(820), transform: transform(stuck.x, stuck.y, endAngle), opacity: 1, easing: "cubic-bezier(0.5, 0, 0.9, 0.5)" },
          { offset: 1, transform: transform(stuck.x - side * 8, floorY + 10, endAngle + side * 50, 0.9), opacity: 0 },
        );
      } else if (type === "rock") {
        // Queda seca: rebote curto e cai no chão.
        frames.push(
          { offset: after(40), transform: transform(to.x, to.y - 2, endAngle, 1.05, 0.95), opacity: 1, easing: "ease-out" },
          { offset: after(180), transform: transform(to.x - ux * 12, to.y - 16, endAngle + side * 40), opacity: 1, easing: "ease-in" },
          { offset: after(400), transform: transform(to.x - ux * 18, floorY + 6, endAngle + side * 90, 0.9), opacity: 1 },
          { offset: after(560), transform: transform(to.x - ux * 18, floorY + 6, endAngle + side * 90, 0.9), opacity: 0 },
          { offset: 1, transform: transform(to.x - ux * 18, floorY + 6, endAngle + side * 90, 0.9), opacity: 0 },
        );
      } else if (type === "brick") {
        // O mais pesado: crava, inclina e despenca.
        frames.push(
          { offset: after(90), transform: transform(to.x - ux * 4, to.y - uy * 4, endAngle, 1), opacity: 1, easing: "ease-in-out" },
          { offset: after(220), transform: transform(to.x - ux * 8, to.y - 6, endAngle + side * 18), opacity: 1, easing: "cubic-bezier(0.6, 0, 1, 0.6)" },
          { offset: after(420), transform: transform(to.x - ux * 10, floorY + 10, endAngle + side * 70), opacity: 1 },
          { offset: after(640), transform: transform(to.x - ux * 10, floorY + 10, endAngle + side * 70), opacity: 0 },
          { offset: 1, transform: transform(to.x - ux * 10, floorY + 10, endAngle + side * 70), opacity: 0 },
        );
      } else {
        // Tomate: o corpo vira splat na hora; a mancha (no impacto) escorre.
        frames.push(
          { offset: after(40), transform: transform(to.x, to.y, endAngle, 1.45, 0.45), opacity: 1, easing: "ease-out" },
          { offset: after(140), transform: transform(to.x, to.y + 4, endAngle, 1.7, 0.2), opacity: 0 },
          { offset: 1, transform: transform(to.x, to.y + 4, endAngle, 1.7, 0.2), opacity: 0 },
        );
      }
      shadowFrames.push({ offset: after(120), transform: `translate(${round(to.x)}px, ${round(to.y)}px) scale(0.82)`, opacity: 0 }, { offset: 1, opacity: 0 });
    } else {
      const travel = event.outcome === "deflect" ? -90 : 65;
      const exitX = to.x + ux * travel;
      const exitY = to.y + uy * travel + 28;
      frames.push({ offset: 1, transform: transform(exitX, exitY, endAngle + (plane ? 0 : -270), 0.65), opacity: 0 });
      shadowFrames.push({ offset: 1, transform: `translate(${round(exitX)}px, ${round(exitY)}px) scale(0.7)`, opacity: 0 });
    }

    run(node, frames, { duration: total, fill: "both" });
    // Eco/rastro: mesmos keyframes atrasados, colapsando sobre o líder no contato.
    echoes.forEach((echoNode, index) => {
      const base = ECHO_OPACITIES[index] ?? 0;
      run(echoNode, frames.map((frame) => ({
        ...frame,
        opacity: round((typeof frame.opacity === "number" ? frame.opacity : 1) * base * Math.max(0, 1 - Number(frame.offset ?? 0) / contactFraction)),
      })), { duration: total, delay: ECHO_DELAYS_MS[index] ?? 0, easing: "linear", fill: "both" });
    });
    run(shadow, shadowFrames, { duration: total, fill: "both" });

    // Reação do alvo por desfecho e por item.
    const reactionAt = event.outcome === "dodge" ? flightMs * 0.7 : flightMs;
    const push = motion.weight === "heavy" ? 10 : type === "tomato" ? 6 : 3;
    let reactionMs = 460;
    let reaction: Keyframe[];
    if (event.outcome === "dodge") {
      reaction = [{ transform: "none" }, { transform: `translate(${round(-uy * 24)}px, ${round(ux * 24)}px)` }, { transform: "none" }];
    } else if (event.outcome === "deflect") {
      reaction = [{ transform: "none" }, { transform: `rotate(${-side * 16}deg) scale(1.08)` }, { transform: `rotate(${side * 6}deg) scale(1.02)` }, { transform: "none" }];
    } else if (type === "rock") {
      // O avatar afunda com o golpe e volta devagar.
      reactionMs = 620;
      reaction = [
        { offset: 0, transform: "none" },
        { offset: 0.08, transform: "translateY(8px) scale(1.06, 0.84)", easing: "cubic-bezier(0.2, 0.8, 0.4, 1)" },
        { offset: 0.35, transform: "translateY(6px) scale(1.02, 0.92)", easing: "ease-in-out" },
        { offset: 0.7, transform: "translateY(-2px) scale(0.98, 1.03)", easing: "ease-out" },
        { offset: 1, transform: "none" },
      ];
    } else {
      reaction = [
        { offset: 0, transform: "none" },
        { offset: 0.1, transform: `translate(${round(ux * push)}px, ${round(uy * push)}px) rotate(${side * push}deg) scale(${motion.weight === "heavy" ? 0.88 : 0.96})` },
        { offset: 0.24, transform: `translate(${round(ux * push)}px, ${round(uy * push)}px) rotate(${side * push}deg) scale(${motion.weight === "heavy" ? 0.88 : 0.96})` },
        { offset: 0.6, transform: `translate(${round(-ux * push * 0.25)}px, ${round(-uy * push * 0.25)}px) rotate(${round(-side * push * 0.3)}deg)` },
        { offset: 1, transform: "none" },
      ];
      if (motion.weight === "heavy") reactionMs = 560;
    }
    run(target, reaction, { duration: reactionMs, delay: reactionAt, easing: "ease-out" });

    if (impact && hit) {
      impact.style.setProperty("--contact-delay", `${round(flightMs)}ms`);
      impact.style.setProperty("--impact-duration", `${IMPACT_MS}ms`);
      const seconds = IMPACT_MS / 1000;
      const spray = directionalSpray(motion.weight, ux, uy, seconds);
      impact.querySelectorAll<HTMLElement>(".projectile-particle").forEach((particle, index) => {
        run(particle, particleFrames(spray[index % spray.length]!, seconds), { duration: IMPACT_MS, delay: flightMs, easing: "linear", fill: "both" });
      });
      if (type === "rock") {
        // "Galo" no topo da cabeça por ~1s.
        run(impact.querySelector(".projectile-bump"), [
          { offset: 0, transform: `translate(${round(radius * 0.3)}px, ${round(-radius + 2)}px) scale(0)`, opacity: 1, easing: "cubic-bezier(0.2, 1.6, 0.4, 1)" },
          { offset: 0.14, transform: `translate(${round(radius * 0.3)}px, ${round(-radius + 2)}px) scale(1.15)`, opacity: 1, easing: "ease-out" },
          { offset: 0.24, transform: `translate(${round(radius * 0.3)}px, ${round(-radius + 2)}px) scale(1)`, opacity: 1 },
          { offset: 0.86, transform: `translate(${round(radius * 0.3)}px, ${round(-radius + 2)}px) scale(1)`, opacity: 1, easing: "ease-in" },
          { offset: 1, transform: `translate(${round(radius * 0.3)}px, ${round(-radius + 2)}px) scale(0.5)`, opacity: 0 },
        ], { duration: 1250, delay: flightMs + 40, fill: "both" });
      } else if (type === "brick") {
        // Rachadura no anel, do lado de onde o tijolo veio.
        const hitAngle = round(Math.atan2(-uy, -ux) * 180 / Math.PI);
        const crack = (scale: number) => `rotate(${hitAngle}deg) scale(${scale})`;
        run(impact.querySelector(".projectile-crack"), [
          { offset: 0, transform: crack(1.12), opacity: 1, easing: "ease-out" },
          { offset: 0.08, transform: crack(1), opacity: 1 },
          { offset: 0.82, transform: crack(1), opacity: 1, easing: "ease-in" },
          { offset: 1, transform: crack(1), opacity: 0 },
        ], { duration: 1600, delay: flightMs, fill: "both" });
      } else if (type === "tomato") {
        const splatMs = motion.afterMs;
        run(impact.querySelector(".projectile-splat"), [
          { offset: 0, transform: "scale(0.3, 0.2)", opacity: 1, easing: "cubic-bezier(0.2, 0.8, 0.3, 1.2)" },
          { offset: 0.07, transform: "scale(1.12, 0.94)", opacity: 1, easing: "ease-out" },
          { offset: 0.14, transform: "scale(1)", opacity: 0.95 },
          { offset: 0.85, transform: "translateY(3px) scale(0.98, 1.02)", opacity: 0.9, easing: "ease-in" },
          { offset: 1, transform: "translateY(5px) scale(0.96, 1.04)", opacity: 0 },
        ], { duration: splatMs, delay: flightMs, fill: "both" });
        impact.querySelectorAll<HTMLElement>(".projectile-drip").forEach((drip, index) => {
          const length = 5 + index * 3;
          run(drip, [
            { offset: 0, transform: "translateY(0) scaleY(0.1)", opacity: 0 },
            { offset: 0.08, transform: "translateY(0) scaleY(0.4)", opacity: 1, easing: "cubic-bezier(0.5, 0, 0.8, 0.6)" },
            { offset: 0.75, transform: `translateY(${length}px) scaleY(1)`, opacity: 1, easing: "ease-in" },
            { offset: 1, transform: `translateY(${length + 6}px) scaleY(0.9)`, opacity: 0 },
          ], { duration: splatMs - 200 - index * 120, delay: flightMs + 180 + index * 160, fill: "both" });
        });
      }
      run(impact, [{ opacity: 1 }, { opacity: 1 }], { duration: Math.max(IMPACT_MS, total - flightMs), delay: flightMs });
    }
    watchLifetime(Math.max(lifetime, total + ECHO_DELAYS_MS[ECHO_DELAYS_MS.length - 1]!));
    return cleanup;
  }, [event, arenaRef, onDone, hit, type, chair, hosts]);

  const flight = (
    <span ref={flightRef} className={chair ? "projectile-flight projectile-flight--chair" : "projectile-flight"} data-testid="projectile-flight" data-target={event.targetPlayerId} data-outcome={event.outcome} data-projectile={type} aria-hidden="true">
      <ProjectileIcon type={type} />
    </span>
  );
  const label = PROJECTILE_CATALOG.find((entry) => entry.type === type)?.label[lang] ?? "";
  return (
    <>
      {chair ? null : <span ref={shadowRef} className="projectile-shadow" data-testid="projectile-shadow" aria-hidden="true" />}
      {chair ? null : ECHO_DELAYS_MS.map((delay, index) => (
        <span
          key={delay}
          ref={(echoNode) => { echoRefs.current[index] = echoNode; }}
          className="projectile-echo"
          style={{ "--echo-index": index } as CSSProperties}
          data-testid="projectile-echo"
          aria-hidden="true"
        >
          <ProjectileIcon type={type} />
        </span>
      ))}
      {hosts.seat ? createPortal(flight, hosts.seat) : flight}
      {chair && hosts.under ? createPortal(
        <span ref={restRef} className="projectile-flight projectile-flight--chair projectile-flight--rest" data-testid="projectile-chair-rest" aria-hidden="true">
          <ProjectileIcon type={type} />
        </span>,
        hosts.under,
      ) : null}
      <span ref={impactRef} className={`projectile-impact projectile-impact--${type} projectile-impact--${event.outcome}`} data-testid="projectile-impact" aria-hidden="true" style={{ "--contact-delay": "0ms", "--impact-duration": `${IMPACT_MS}ms`, "--star-stagger": `${STAR_STAGGER_MS}ms` } as CSSProperties}>
        {chair ? <i className="projectile-ripple" aria-hidden="true" /> : null}
        <i className="projectile-ring" aria-hidden="true" />
        {Array.from({ length: IMPACT_PARTICLES }, (_, index) => (
          <i key={index} className="projectile-particle" aria-hidden="true" />
        ))}
        {chair ? (
          <>
            {Array.from({ length: CHAIR_STARS }, (_, index) => (
              <i key={index} className="projectile-star" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="m12 2 2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 21l1.6-7L2 9.2l7.1-.6Z" /></svg>
              </i>
            ))}
            <b className="projectile-stamp" data-testid="projectile-stamp">{STAMP_TEXT[lang]}</b>
          </>
        ) : null}
        {type === "rock" && hit ? <i className="projectile-bump" data-testid="projectile-bump" aria-hidden="true" /> : null}
        {type === "brick" && hit ? (
          <svg className="projectile-crack" data-testid="projectile-crack" viewBox="-30 -30 60 60" aria-hidden="true">
            <path d="M25 -3 18 -1 21 4 14 3 11 8M18 -1 15 -7 10 -6M21 4 26 8" />
          </svg>
        ) : null}
        {type === "tomato" && hit ? (
          <>
            <i className="projectile-splat" data-testid="projectile-splat" aria-hidden="true" />
            {Array.from({ length: TOMATO_DRIPS }, (_, index) => (
              <i key={index} className={`projectile-drip projectile-drip--${index + 1}`} data-testid="projectile-drip" aria-hidden="true" />
            ))}
          </>
        ) : null}
      </span>
      <span ref={staticRef} className="projectile-static" data-testid="projectile-static" aria-hidden="true">
        <ProjectileIcon type={type} />
        <span>{chair ? STAMP_TEXT[lang] : label}</span>
      </span>
    </>
  );
}
