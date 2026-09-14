import { CheckIcon, CrownIcon, UserRoundIcon } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";
import "./poker-table.css";

export interface TablePlayer {
  id: string;
  nick: string;
  seatIndex: number;
  hasVoted: boolean;
  value?: string | null;
  status: "connected" | "disconnected";
}

interface PokerTableProps {
  seats: Array<TablePlayer | null>;
  playerId?: string | null;
  hostId?: string | null;
  revealed: boolean;
  compact?: boolean;
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
  [27, 12],
  [73, 12],
  [73, 88],
  [27, 88],
];

export function PokerTable({
  seats,
  playerId,
  hostId,
  revealed,
  compact = false,
  children,
}: PokerTableProps): React.ReactElement {
  return (
    <div
      className={cn("poker-table", compact && "poker-table--compact")}
      data-revealed={revealed}
    >
      <div className="poker-felt">
        <div className="poker-center">{children}</div>
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
                  <div className="poker-avatar">
                    {player.nick.slice(0, 2).toUpperCase()}
                    {isHost && (
                      <CrownIcon className="poker-crown" aria-label="Host" />
                    )}
                  </div>
                  <div className="poker-name" title={player.nick}>
                    {player.nick}
                  </div>
                  {isSelf && (
                    <span
                      className="poker-you"
                      data-testid={
                        compact ? undefined : `seat-${player.seatIndex}-you`
                      }
                    >
                      você
                    </span>
                  )}
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
                  {player.hasVoted && (
                    <span
                      className={cn(
                        "poker-played-card",
                        revealed && "poker-played-card--face",
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
