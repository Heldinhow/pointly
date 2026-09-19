import { CheckIcon, CrownIcon, UserRoundIcon } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { ProjectileType } from "@/lib/protocol";
import { ProjectileMenu } from "./projectile-menu";
import "./poker-table.css";

export interface TablePlayer {
  id: string;
  nick: string;
  seatIndex: number;
  hasVoted: boolean;
  value?: string | null;
  status: "connected" | "disconnected";
  /** Avatar dataURL. Ausente, null ou com erro de load = iniciais. */
  avatar?: string | null;
}

interface PokerTableProps {
  seats: Array<TablePlayer | null>;
  playerId?: string | null;
  hostId?: string | null;
  revealed: boolean;
  compact?: boolean;
  onThrowProjectile?: (targetId: string, type: ProjectileType) => void;
  projectileCooldownSecs?: number;
  children?: ReactNode;
}

const SEATS = [
  [18, 9],
  [34, 9],
  [50, 9],
  [66, 9],
  [82, 9],
  [95, 50],
  [82, 91],
  [66, 91],
  [50, 91],
  [34, 91],
  [18, 91],
  [5, 50],
];
const DEMO_SEATS = [
  [27, 9],
  [73, 9],
  [73, 91],
  [27, 91],
];

/**
 * Carta "na frente" do assento: mesma coluna do avatar, o mais perto possível
 * dentro do feltro (elipse interna). A posição é calculada com a largura/altura
 * reais da mesa — em telas estreitas o feltro recua nos cantos e a carta desce;
 * em telas largas ela fica colada na borda, logo abaixo do pill do assento.
 */
const FELT_INSET_Y = 44;
const FELT_INSET_X = 45;
const FELT_BORDER = 10;
const CARD_W = 30;
const CARD_H = 42;
const CARD_GAP = 3;
/** Centro mínimo (px) para não encostar no pill do assento (medido no browser). */
const CARD_PILL_CLEARANCE = 110;
/** Distância da borda para a carta dos assentos laterais. */
const CARD_EDGE_PX = 90;
/** Órbita da carta na mesa compact (demo da home): fração assento→centro. */
const CARD_ORBIT_COMPACT = 0.5;
/** Referência até a mesa ser medida (jsdom/primeiro layout). */
const TABLE_REF = { w: 920, h: 430 };

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));
const round2 = (value: number): number => Math.round(value * 100) / 100;

interface TableSize {
  w: number;
  h: number;
}

/** Inclinação discreta da carta pelo assento. */
function cardRotate(seatX: number): number {
  return round2(clamp((seatX - 50) * 0.12, -5, 5));
}

/**
 * Centro vertical (px) mais próximo do assento com a carta inteira dentro da
 * elipse interna do feltro. Fecha a conta pelas quinas rotacionadas.
 */
function frontCardCenterY(
  seatX: number,
  { w, h }: TableSize,
  top: boolean,
): number {
  const ex = w / 2;
  const ey = h / 2;
  const a = (w - 2 * FELT_INSET_X - 2 * FELT_BORDER) / 2;
  const b = (h - 2 * FELT_INSET_Y - 2 * FELT_BORDER) / 2;
  const rad = (cardRotate(seatX) * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const cardX = (seatX / 100) * w;
  let y = top ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
  for (const [sx, sy] of [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ]) {
    const dx = (sx * CARD_W) / 2;
    const dy = (sy * CARD_H) / 2;
    const cornerX = cardX + dx * cos - dy * sin;
    const cornerY = dx * sin + dy * cos;
    const k = (cornerX - ex) / a;
    const limit = b * Math.sqrt(Math.max(0, 1 - k * k));
    if (top) {
      y = Math.max(y, ey - limit - cornerY);
    } else {
      y = Math.min(y, ey + limit - cornerY);
    }
  }
  return top ? y + CARD_GAP : y - CARD_GAP;
}

export interface CardPlacement {
  /** Centro da carta em % da mesa (desktop e compact). */
  x: number;
  y: number;
  /** Ajuste fino em px (assentos laterais usam 90px a partir da borda). */
  dx: number;
  dy: number;
  /** Inclinação em graus — discreta por assento. */
  rotate: number;
  /** Posição no mobile: carta ao lado do avatar (layout de 2 colunas). */
  mobileX: number;
  mobileY: number;
}

/**
 * Posição da carta votada. Arena: na frente do assento (mesma coluna do
 * avatar; laterais deslocadas 90px da borda), o mais perto que o feltro permite
 * para a largura/altura dadas. Compact: ponto na reta assento→centro, na órbita
 * `CARD_ORBIT_COMPACT`. Mobile (arena): reproduz o layout de duas colunas do
 * CSS — carta ao lado do avatar. Sem voto, sem carta.
 */
export function cardPlacement(
  seatIndex: number,
  compact = false,
  size: TableSize = TABLE_REF,
): CardPlacement {
  const row = Math.min(seatIndex % 12, 11 - (seatIndex % 12));
  const mobile = {
    mobileX: seatIndex % 12 < 6 ? 9 : 91,
    mobileY: round2(8 + (compact ? seatIndex % 4 : row) * 16.8),
  };
  if (compact) {
    const [seatX, seatY] = DEMO_SEATS[seatIndex % DEMO_SEATS.length];
    return {
      x: round2(seatX + (50 - seatX) * CARD_ORBIT_COMPACT),
      y: round2(seatY + (50 - seatY) * CARD_ORBIT_COMPACT),
      dx: 0,
      dy: 0,
      rotate: cardRotate(seatX),
      ...mobile,
    };
  }
  const index = seatIndex % 12;
  const [seatX] = SEATS[index];
  if (index === 5 || index === 11) {
    return {
      x: index === 5 ? 100 : 0,
      y: 50,
      dx: index === 5 ? -CARD_EDGE_PX : CARD_EDGE_PX,
      dy: 0,
      rotate: cardRotate(seatX),
      ...mobile,
    };
  }
  const top = index < 5;
  const limit = top
    ? Math.max(frontCardCenterY(seatX, size, true), CARD_PILL_CLEARANCE)
    : Math.min(frontCardCenterY(seatX, size, false), size.h - CARD_PILL_CLEARANCE);
  return {
    x: seatX,
    y: round2((limit / size.h) * 100),
    dx: 0,
    dy: 0,
    rotate: cardRotate(seatX),
    ...mobile,
  };
}

/**
 * Círculo do assento (AV-04): img cover quando há avatar válido, iniciais
 * como fallback (sem avatar, null ou erro de load). Mesma classe
 * `.poker-avatar` e mesma âncora de projéteis.
 */
function SeatAvatar({
  player,
  isHost,
  anchor,
}: {
  player: TablePlayer;
  isHost: boolean;
  anchor: string | undefined;
}): React.ReactElement {
  const [broken, setBroken] = useState(false);
  return (
    <span className="poker-avatar" data-projectile-player={anchor}>
      {player.avatar && !broken ? (
        <img
          src={player.avatar}
          alt={player.nick}
          className="poker-avatar-img"
          onError={() => setBroken(true)}
        />
      ) : (
        player.nick.slice(0, 2).toUpperCase()
      )}
      {isHost && <CrownIcon className="poker-crown" aria-label="Host" />}
    </span>
  );
}

export function PokerTable({
  seats,
  playerId,
  hostId,
  revealed,
  compact = false,
  onThrowProjectile,
  projectileCooldownSecs = 0,
  children,
}: PokerTableProps): React.ReactElement {
  const tableRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<TableSize>({ w: 0, h: 0 });
  // A carta "na frente" depende da largura real: o feltro recua nos cantos e a
  // posição mais próxima do assento muda com o tamanho da mesa.
  useLayoutEffect(() => {
    const node = tableRef.current;
    if (!node) return;
    const update = (): void => {
      const rect = node.getBoundingClientRect();
      setSize((prev) =>
        prev.w === rect.width && prev.h === rect.height
          ? prev
          : { w: rect.width, h: rect.height },
      );
    };
    update();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const tableSize = size.w > 0 && size.h > 0 ? size : undefined;
  return (
    <div
      ref={tableRef}
      className={cn("poker-table", compact && "poker-table--compact")}
      data-revealed={revealed}
    >
      <div className="poker-felt">
        <div className="poker-center">{children}</div>
      </div>
      <div className="poker-table-cards" aria-hidden="true">
        {seats.map((player, index) => {
          if (!player?.hasVoted) return null;
          const place = cardPlacement(index, compact, tableSize);
          return (
            <span
              key={player.id}
              data-seat={player.seatIndex}
              className={cn(
                "poker-played-card",
                revealed
                  ? "poker-played-card--face"
                  : "poker-played-card--dealt",
              )}
              style={
                {
                  "--card-x-md": place.x,
                  "--card-y-md": place.y,
                  "--card-dx-md": `${place.dx}px`,
                  "--card-dy-md": `${place.dy}px`,
                  "--card-rot-md": `${place.rotate}deg`,
                  "--card-x-sm": place.mobileX,
                  "--card-y-sm": place.mobileY,
                  "--card-rot-sm": "12deg",
                  "--card-dx-sm": "28.5px",
                  "--card-dy-sm": "-28px",
                } as CSSProperties
              }
            >
              {revealed ? (
                player.value
              ) : (
                <span className="poker-card-pattern" />
              )}
            </span>
          );
        })}
      </div>
      <ul
        className="poker-seats"
        aria-label={compact ? "Time da demonstração" : "Assentos da sala"}
      >
        {seats.map((player, index) => {
          const [x, y] = (compact ? DEMO_SEATS : SEATS)[
            index % (compact ? 4 : 12)
          ];
          const isSelf = player?.id === playerId;
          const isHost = player?.id === hostId;
          const disconnected = player?.status === "disconnected";
          const hideStatus =
            !!player && !disconnected && revealed && player.value != null;
          const identity = player && (
            <>
              <SeatAvatar
                player={player}
                isHost={isHost}
                anchor={compact ? undefined : player.id}
              />
              <span className="poker-name">{player.nick}</span>
            </>
          );
          return (
            <li
              key={player?.seatIndex ?? index}
              className={cn(
                "poker-seat",
                !player && "poker-seat--empty",
                isSelf && "poker-seat--self",
                disconnected && "poker-seat--offline",
              )}
              style={
                { "--seat-x": `${x}%`, "--seat-y": `${y}%` } as CSSProperties
              }
              data-testid={
                compact
                  ? undefined
                  : player
                    ? `seat-${player.seatIndex}`
                    : `seat-empty-${index}`
              }
            >
              {player ? (
                <>
                  {onThrowProjectile && !compact && !isSelf && !disconnected ? (
                    <ProjectileMenu
                      target={player}
                      cooldownSecs={projectileCooldownSecs}
                      onThrow={onThrowProjectile}
                      className="poker-seat-target"
                      align={x < 35 ? "left" : x > 65 ? "right" : "center"}
                    >
                      {identity}
                    </ProjectileMenu>
                  ) : (
                    <div className="poker-seat-identity" title={player.nick}>{identity}</div>
                  )}
                  {hideStatus ? null : (
                    <span className="poker-status">
                      {disconnected ? (
                        "Desconectado"
                      ) : revealed ? (
                        (player.value ?? "Sem voto")
                      ) : player.hasVoted ? (
                        <>
                          <CheckIcon aria-hidden="true" /> Votou
                        </>
                      ) : (
                        "Aguardando"
                      )}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <div className="poker-avatar">
                    <UserRoundIcon aria-hidden="true" />
                  </div>
                  <span className="poker-empty-label">Livre</span>
                  <span className="sr-only">Assento vazio</span>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
