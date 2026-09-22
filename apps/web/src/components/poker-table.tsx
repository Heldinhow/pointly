import { CheckIcon, CrownIcon, DicesIcon, UserRoundIcon } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { useState } from "react";
import type { Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { NudgeId, ProjectileType } from "@planning-poker/shared";
import { ProjectileMenu } from "./projectile-menu";
import { UnanimousCelebration } from "./unanimous-celebration";
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

type TableLabels = {
  seatsAria: string;
  demoSeatsAria: string;
  disconnected: string;
  noVote: string;
  voted: string;
  waiting: string;
  justify: string;
  emptySeat: string;
  emptySeatSr: string;
};

const TABLE_LABELS: Record<Lang, TableLabels> = {
  "pt-BR": {
    seatsAria: "Assentos da sala",
    demoSeatsAria: "Time da demonstração",
    disconnected: "Desconectado",
    noVote: "Sem voto",
    voted: "Votou",
    waiting: "Aguardando",
    justify: "Justifica",
    emptySeat: "Livre",
    emptySeatSr: "Assento vazio",
  },
  en: {
    seatsAria: "Room seats",
    demoSeatsAria: "Demo team",
    disconnected: "Disconnected",
    noVote: "No vote",
    voted: "Voted",
    waiting: "Waiting",
    justify: "Justifies first",
    emptySeat: "Open",
    emptySeatSr: "Empty seat",
  },
};

interface PokerTableProps {
  seats: Array<TablePlayer | null>;
  playerId?: string | null;
  hostId?: string | null;
  revealed: boolean;
  compact?: boolean;
  /** > 0 dispara a celebração de Unânime (14.3); cada incremento replaya. */
  celebrateKey?: number;
  /** Assento sorteado pelo Dado da mesa (14.6); `null` = nenhum destaque. */
  justifySeatIndex?: number | null;
  onThrowProjectile?: (targetId: string, type: ProjectileType) => void;
  /** Cutucada no alvo (issue #172). Ausente = sem seção "Cutucar". */
  onNudge?: (targetId: string, nudgeId: NudgeId) => void;
  projectileCooldownSecs?: number;
  /** Idioma dos rótulos; a arena (pt) usa o default. */
  lang?: Lang;
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
  celebrateKey = 0,
  justifySeatIndex = null,
  onThrowProjectile,
  onNudge,
  projectileCooldownSecs = 0,
  lang = "pt-BR",
  children,
}: PokerTableProps): React.ReactElement {
  const labels = TABLE_LABELS[lang];
  return (
    <div
      className={cn("poker-table", compact && "poker-table--compact")}
      data-revealed={revealed}
    >
      <div className="poker-felt">
        {celebrateKey > 0 && <UnanimousCelebration key={celebrateKey} />}
        <div className="poker-center">{children}</div>
      </div>
      <ul
        className="poker-seats"
        aria-label={compact ? labels.demoSeatsAria : labels.seatsAria}
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
                      onNudge={onNudge}
                      className="poker-seat-target"
                      align={x < 35 ? "left" : x > 65 ? "right" : "center"}
                      lang={lang}
                    >
                      {identity}
                    </ProjectileMenu>
                  ) : (
                    <div className="poker-seat-identity" title={player.nick}>{identity}</div>
                  )}
                  {hideStatus ? null : (
                    <span className="poker-status">
                      {disconnected ? (
                        labels.disconnected
                      ) : revealed ? (
                        (player.value ?? labels.noVote)
                      ) : player.hasVoted ? (
                        <>
                          <CheckIcon aria-hidden="true" /> {labels.voted}
                        </>
                      ) : (
                        labels.waiting
                      )}
                    </span>
                  )}
                  {player.hasVoted && (
                    <span
                      className={cn(
                        "poker-played-card",
                        revealed
                          ? "poker-played-card--face"
                          : "poker-played-card--dealt",
                      )}
                      aria-hidden="true"
                    >
                      {revealed ? (
                        player.value
                      ) : (
                        <span className="poker-card-pattern" />
                      )}
                    </span>
                  )}
                  {player.seatIndex === justifySeatIndex && (
                    <span
                      className="poker-justify"
                      data-testid={`seat-justify-${player.seatIndex}`}
                    >
                      <DicesIcon aria-hidden="true" />
                      {labels.justify}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <div className="poker-avatar">
                    <UserRoundIcon aria-hidden="true" />
                  </div>
                  <span className="poker-empty-label">{labels.emptySeat}</span>
                  <span className="sr-only">{labels.emptySeatSr}</span>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
