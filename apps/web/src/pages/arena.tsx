import {
  CheckIcon,
  CopyIcon,
  DicesIcon,
  EyeIcon,
  EyeOffIcon,
  LogOutIcon,
  RotateCcwIcon,
  UsersIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@/components/ui/card";
import { Deck } from "@/components/deck";
import { Input } from "@/components/ui/input";
import { AvatarPicker } from "@/components/avatar-picker";
import { PokerTable } from "@/components/poker-table";
import { ProjectileFlight, type ProjectileFlightEvent } from "@/components/projectile-flight";
import { ProjectileMenu } from "@/components/projectile-menu";
import { NudgeBalloon, type NudgeBalloonEvent } from "@/components/nudge-balloon";
import "./arena.css";
import { Spinner } from "@/components/ui/spinner";
import {
  consensusSignal,
  formatMean,
  formatMedian,
  formatRange,
  pickJustifySeat,
  voteToNumber,
} from "@/lib/deck";
import {
  hasAnyVotes,
  useConsensusStats,
  voteSelectionText,
} from "@/lib/stats";
import type { Phase, Player, Vote } from "@/lib/protocol";
import type { NudgeId, ProjectileType } from "@/lib/protocol";
import {
  trackNewRound,
  trackVoteCast,
  trackVotesRevealed,
} from "@/lib/analytics";
import { useSession } from "@/store/session";
import { JoinError, friendlyJoinMessage, genericJoinMessage } from "@/lib/errors";
import { SOCKET_ERROR_COPY } from "@/lib/forms";
import type { Lang } from "@/lib/i18n";
import { clearAvatar, loadAvatar, saveAvatar } from "@/lib/avatar";
import { clearSession, loadSession } from "@/lib/identity";
import { safeClear } from "@/lib/storage";
import { copyText } from "@/lib/clipboard";
import { resolveWsUrl } from "@/lib/api";
import {
  PROJECTILE_CHAIR_COOLDOWN_MS,
  PROJECTILE_COOLDOWN_MS,
} from "@/lib/projectiles";
import { PointlySocket } from "@/lib/ws-client";
import { ARENA_CONTENT } from "./arena-content";

/** Limite duro do domínio: 12 assentos por sala. */
export const SEAT_COUNT = 12;

/**
 * Janela da confirmação dupla de nova rodada: a primeira ativação (botão
 * ou N) arma o estado de confirmação; sem a segunda ativação a tempo o
 * comando volta ao estado inicial sem trafegar nada.
 */
export const NEW_ROUND_CONFIRM_TIMEOUT_MS = 5000;

// Re-export de compat (SSOT em `@/lib/projectiles`).
export { PROJECTILE_CHAIR_COOLDOWN_MS, PROJECTILE_COOLDOWN_MS };

/** Cadeirada épica recarrega mais devagar que os projéteis comuns. */
function cooldownFor(type: ProjectileType): number {
  return type === "chair" ? PROJECTILE_CHAIR_COOLDOWN_MS : PROJECTILE_COOLDOWN_MS;
}

function isTypingTarget(event: KeyboardEvent): boolean {
  const target = event.target as
    | (HTMLElement & {
        tagName?: string;
      })
    | null;
  if (!target) return false;
  if (target.closest?.('[role="menu"]')) return true;
  // Tag check funciona no browser e no jsdom (sem depender de globals
  // como HTMLInputElement, ausentes no preload de testes).
  const tag = (target.tagName ?? "").toUpperCase();
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (
    typeof (target as HTMLElement).isContentEditable === "boolean" &&
    (target as HTMLElement).isContentEditable
  ) {
    return true;
  }
  return false;
}

/**
 * Envio genérico pelo socket da sessão — SSOT do guard + try/catch.
 * Antes 3x `sendReveal/NewRound/ProjectileThroughSession` + 1x leave inline.
 */
function sendThroughSession<K extends "sendRevealVotes" | "sendStartNewRound" | "sendThrowProjectile" | "sendNudge" | "sendLeaveRoom">(
  method: K,
  ...args: K extends "sendThrowProjectile" ? [string, ProjectileType] : K extends "sendNudge" ? [string, NudgeId] : []
): boolean {
  const socket = useSession.getState().socket as unknown as Record<
    K,
    (...a: never[]) => boolean
  > | null;
  if (!socket || typeof socket[method] !== "function") return false;
  try {
    // Chamada como método (sem desestruturar) para preservar o `this`.
    return (socket[method] as (...a: unknown[]) => boolean)(...args);
  } catch {
    return false;
  }
}

/** Envia `reveal_votes` pelo socket da sessão (qualquer Player pode revelar). */
function sendRevealThroughSession(): boolean {
  return sendThroughSession("sendRevealVotes");
}

/** Envia `start_new_round` pelo socket da sessão (qualquer Player pode abrir). */
function sendNewRoundThroughSession(): boolean {
  return sendThroughSession("sendStartNewRound");
}

/** Envia `throw_projectile` pelo socket da sessão em qualquer fase. */
function sendProjectileThroughSession(
  targetPlayerId: string,
  projectileType: ProjectileType,
): boolean {
  return sendThroughSession("sendThrowProjectile", targetPlayerId, projectileType);
}

/** Envia `send_nudge` pelo socket da sessão em qualquer fase (issue #172). */
function sendNudgeThroughSession(
  targetPlayerId: string,
  nudgeId: NudgeId,
): boolean {
  return sendThroughSession("sendNudge", targetPlayerId, nudgeId);
}

/**
 * Miniatura do espectador na lista de presentes (AV-08): foto quando há
 * avatar válido, iniciais como fallback (mesmo contrato da mesa).
 */
function SpectatorAvatar({ player }: { player: Player }): React.ReactElement {
  const [broken, setBroken] = useState(false);
  if (player.avatar && !broken) {
    return (
      <img
        src={player.avatar}
        alt=""
        aria-hidden="true"
        className="arena-spectator-avatar"
        onError={() => setBroken(true)}
      />
    );
  }
  return (
    <span
      className="arena-spectator-avatar arena-spectator-initials"
      aria-hidden="true"
    >
      {player.nick.slice(0, 2).toUpperCase()}
    </span>
  );
}

export function ArenaPage({
  lang = "pt-BR",
}: {
  lang?: Lang;
}): React.ReactElement {
  const content = ARENA_CONTENT[lang];
  const errorCopy = SOCKET_ERROR_COPY[lang];
  const phaseLabel = (phase: Phase): string => content.phase[phase] ?? phase;
  const { code = "" } = useParams();
  const navigate = useNavigate();
  const sala = useSession((state) => state.sala);
  const playerId = useSession((state) => state.playerId);
  const nick = useSession((state) => state.nick);
  const socket = useSession((state) => state.socket);
  const disconnect = useSession((state) => state.disconnect);

  const [inviteHidden, setInviteHidden] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [resultsCopied, setResultsCopied] = useState(false);
  const [resultsCopyError, setResultsCopyError] = useState(false);
  const [connectionLost, setConnectionLost] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [revealError, setRevealError] = useState<string | null>(null);
  const [confirmingNewRound, setConfirmingNewRound] = useState(false);
  const [newRoundError, setNewRoundError] = useState<string | null>(null);
  // Projéteis em qualquer fase: cooldown de 1s e voos confirmados pelo servidor.
  const [projectileError, setProjectileError] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [projectileCooldownUntil, setProjectileCooldownUntil] = useState(0);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const projectileKeyRef = useRef(0);
  const arenaRef = useRef<HTMLDivElement>(null);
  const [projectileFlights, setProjectileFlights] = useState<ProjectileFlightEvent[]>([]);
  const removeProjectileFlight = useCallback((key: number) => {
    setProjectileFlights((flights) => flights.filter((flight) => flight.key !== key));
  }, []);
  // Cutucadas efêmeras (issue #172): balões sobre o alvo, sem feed e sem
  // persistência — somem sozinhos via `onDone` do próprio balão.
  const [nudgeBalloons, setNudgeBalloons] = useState<NudgeBalloonEvent[]>([]);
  const nudgeKeyRef = useRef(0);
  const removeNudgeBalloon = useCallback((key: number) => {
    setNudgeBalloons((balloons) => balloons.filter((balloon) => balloon.key !== key));
  }, []);
  // Ticket 09: F5 reconecta com o mesmo UUID a partir da sessão
  // persistida (sem duplicar o Player · o servidor reidrata voto,
  // assento e fase). `rejoinError` mantém a Arena legível com retry
  // quando a sala sumiu (restart) ou a rede falhou.
  const [rejoining, setRejoining] = useState(false);
  const [rejoinError, setRejoinError] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);
  const rejoinKeyRef = useRef<string | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultsCopyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const newRoundTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Espelho mutável do `confirmingNewRound` para os handlers de teclado
  // (o listener lê o valor fresco sem re-subscrever a cada render).
  const confirmingRef = useRef(false);
  confirmingRef.current = confirmingNewRound;

  const routeCode = code.toUpperCase();
  const sessionCode = sala?.code ?? "";
  const hasSession =
    sala !== null && socket !== null && sessionCode === routeCode;

  // Assina room_state no socket herdado da entrada: presença e votos ao
  // vivo (<1s) sem recriar a conexão.
  useEffect(() => {
    if (!socket) return;
    socket.setHandlers({
      onRoomState: (next) => {
        useSession.getState().updateSala(next);
        // Reveal confirmado pelo servidor (manual):
        // limpa o erro de reveal pendente.
        if (next.phase === "revealed") {
          setRevealError(null);
        } else if (confirmingRef.current) {
          // Nova rodada confirmada (round incrementado, votos
          // limpos): volta ao estado inicial.
          if (newRoundTimer.current) {
            clearTimeout(newRoundTimer.current);
            newRoundTimer.current = null;
          }
          setConfirmingNewRound(false);
          setNewRoundError(null);
        }
      },
      onClose: () => {
        setReconnecting(false);
        setConnectionLost(true);
      },
      onReconnecting: (attempt) => {
        setConnectionLost(false);
        setReconnecting(true);
        setReconnectAttempt(attempt);
      },
      onReconnected: () => {
        setReconnecting(false);
        setReconnectAttempt(0);
        setConnectionLost(false);
      },
      onReconnectFailed: () => {
        setReconnecting(false);
        setConnectionLost(true);
      },
      onProjectileThrown: (event) => {
        // Só o voo visual importa — sem lista/feed de arremessos.
        projectileKeyRef.current += 1;
        const key = projectileKeyRef.current;
        const receivedAt = Date.now();
        setProjectileFlights((prev) => [...prev, { ...event, key, receivedAt }].slice(-32));
        if (event.senderPlayerId === useSession.getState().playerId) {
          setProjectileError(null);
          setProjectileCooldownUntil(receivedAt + cooldownFor(event.projectileType));
          setNowMs(receivedAt);
        }
      },
      onNudgeSent: (event) => {
        // Balão efêmero sobre o alvo — sem feed, sem persistência.
        nudgeKeyRef.current += 1;
        const key = nudgeKeyRef.current;
        const receivedAt = Date.now();
        setNudgeBalloons((prev) => [...prev, { ...event, key, receivedAt }].slice(-8));
        if (event.senderPlayerId === useSession.getState().playerId) {
          // Mesmo portão do projétil: o gate local também recarrega.
          setProjectileError(null);
          setProjectileCooldownUntil(receivedAt + PROJECTILE_COOLDOWN_MS);
          setNowMs(receivedAt);
        }
      },
      onError: (_code, message) => {
        const text = message || content.errors.genericAction;
        // Mensagens do servidor são pt-BR; em EN a arena usa copy local por
        // contexto, preservando o texto original no PT.
        const shown = (fallback: string): string =>
          lang === "en" ? fallback : text;
        // Erros de projétil/cutucada (cooldown/interação) vão para o alerta
        // de interações sem quebrar a sala (issues #157, #172).
        if (
          /projectile|throw|cooldown|arremess|recarreg|cutuc|nudge/i.test(text) ||
          /projectile|throw|cooldown|nudge/i.test(_code)
        ) {
          setProjectileError(shown(content.errors.interact));
        } else if (
          /new.?round|start_new|nova.?rodada/i.test(text) ||
          /new.?round|start_new/i.test(_code)
        ) {
          if (newRoundTimer.current) {
            clearTimeout(newRoundTimer.current);
            newRoundTimer.current = null;
          }
          setConfirmingNewRound(false);
          setNewRoundError(shown(content.errors.newRound));
        } else if (/reveal|revelar|revela/i.test(text) || /reveal/i.test(_code)) {
          // Erros de reveal (invalid_phase com "reveal") vão para o
          // alerta de reveal; o resto continua no alerta de voto.
          setRevealError(shown(content.errors.reveal));
        } else {
          setVoteError(shown(content.errors.vote));
        }
      },
    });
  }, [socket, lang, content]);

  // Liveness é do servidor (ping de protocolo — aba oculta não derruba).
  // Este poke cobre só morte REAL percebida ao voltar: se o socket está
  // `closed` (rede, sleep, página descartada pelo SO no mobile), retenta
  // na hora em vez de esperar o próximo tick do backoff de 5min.
  useEffect(() => {
    if (!socket) return;
    const live: NonNullable<typeof socket> = socket;
    function poke(): void {
      try {
        if (typeof document !== "undefined" && document.hidden) return;
        if (typeof live.getStatus !== "function") return;
        if (live.getStatus() !== "closed") return;
        if (typeof live.retryNow === "function") live.retryNow();
      } catch {
        // Poke é best-effort — o backoff cobre em seguida.
      }
    }
    document.addEventListener("visibilitychange", poke);
    window.addEventListener("focus", poke);
    window.addEventListener("pageshow", poke);
    window.addEventListener("online", poke);
    return () => {
      document.removeEventListener("visibilitychange", poke);
      window.removeEventListener("focus", poke);
      window.removeEventListener("pageshow", poke);
      window.removeEventListener("online", poke);
    };
  }, [socket]);

  // Ticker do cooldown de projéteis (issue #157): força re-render a cada
  // 500ms só enquanto há recarga ativa, para a contagem regressiva e a
  // liberação dos botões acompanharem o relógio sem polling permanente.
  useEffect(() => {
    if (projectileCooldownUntil <= Date.now()) return;
    const id = setInterval(() => {
      setNowMs(Date.now());
    }, 500);
    return () => clearInterval(id);
  }, [projectileCooldownUntil, nowMs]);

  // Atalho R revela (qualquer Player, após pelo menos um voto). Ignora
  // inputs, repeat e modificadores · mesmo guard do botão.
  useEffect(() => {
    function onKey(event: KeyboardEvent): void {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      if (isTypingTarget(event)) return;
      if (event.key !== "r" && event.key !== "R") return;
      const current = useSession.getState().sala;
      if (!current) return;
      if (current.phase !== "voting" && current.phase !== "revealable") {
        return;
      }
      const hasVotes = hasAnyVotes(current.players, current.votes);
      // Sem nenhum voto o reveal fica indisponível (também no teclado).
      if (!hasVotes) return;
      event.preventDefault();
      setRevealError(null);
      const sent = sendRevealThroughSession();
      if (sent) trackVotesRevealed();
      else setRevealError(errorCopy.reveal);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [errorCopy]);

  // Atalho N pede/confirma nova rodada (qualquer Player, só após o
  // reveal). Exige a mesma confirmação dupla do botão: a primeira
  // ativação arma, a segunda dentro da janela envia; sem a segunda a
  // tempo o comando volta ao estado inicial. Ignora inputs, repeat e
  // modificadores · mesmo guard do botão.
  useEffect(() => {
    function onKey(event: KeyboardEvent): void {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      if (isTypingTarget(event)) return;
      if (event.key !== "n" && event.key !== "N") return;
      const current = useSession.getState().sala;
      if (!current || current.phase !== "revealed") return;
      event.preventDefault();
      if (!confirmingRef.current) {
        setNewRoundError(null);
        setConfirmingNewRound(true);
        if (newRoundTimer.current) clearTimeout(newRoundTimer.current);
        newRoundTimer.current = setTimeout(() => {
          newRoundTimer.current = null;
          setConfirmingNewRound(false);
        }, NEW_ROUND_CONFIRM_TIMEOUT_MS);
        return;
      }
      if (newRoundTimer.current) {
        clearTimeout(newRoundTimer.current);
        newRoundTimer.current = null;
      }
      setConfirmingNewRound(false);
      setNewRoundError(null);
      const sent = sendNewRoundThroughSession();
      if (sent) trackNewRound();
      else setNewRoundError(errorCopy.newRound);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [errorCopy]);

  useEffect(() => {
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
      if (resultsCopyTimer.current) clearTimeout(resultsCopyTimer.current);
      if (newRoundTimer.current) clearTimeout(newRoundTimer.current);
    };
  }, []);

  // Ticket 09: sem sessão em memória, tenta recuperar via sessão
  // persistida (F5 no meio da votação mantém voto, assento e fase sem
  // duplicar o Player · o `hello` reusa o mesmo UUID e o servidor
  // reidrata). Sem sessão persistida para esta rota, volta para a
  // entrada com o código já preenchido (convite entra direto na sala).
  // Sala inexistente (restart do servidor) limpa a sessão e volta.
  useEffect(() => {
    if (hasSession) return;
    const target = routeCode ? `/join?code=${routeCode}` : "/join";
    const persisted = loadSession();
    if (!persisted || persisted.code !== routeCode) {
      navigate(target, { replace: true });
      return;
    }
    const key = `${routeCode}:${retryNonce}`;
    if (rejoinKeyRef.current === key) return;
    rejoinKeyRef.current = key;
    let cancelled = false;
    let liveSocket: PointlySocket | null = null;
    setRejoining(true);
    setRejoinError(null);
    const storedAvatar = loadAvatar();
    void (async () => {
      const { uuid } = useSession.getState();
      const socket = new PointlySocket({
        onRoomState: (next) => {
          useSession.getState().updateSala(next);
        },
      });
      liveSocket = socket;
      try {
        const welcome = await socket.connect(resolveWsUrl(), {
          uuid,
          nick: persisted.nick,
          code: persisted.code,
          ...(storedAvatar ? { avatar: storedAvatar } : {}),
        });
        if (cancelled) {
          socket.close({ silent: true });
          return;
        }
        useSession.getState().setConnected({
          nick: persisted.nick,
          code: welcome.sala.code,
          playerId: welcome.playerId,
          role: welcome.role,
          sala: welcome.sala,
          socket,
        });
      } catch (error) {
        if (cancelled) return;
        if (
          error instanceof JoinError &&
          error.code === "sala_nao_encontrada"
        ) {
          safeClear(clearSession);
          navigate(target, { replace: true });
          return;
        }
        const message =
          error instanceof JoinError
            ? friendlyJoinMessage(error.code, error.message, lang)
            : genericJoinMessage(lang);
        setRejoinError(message);
      } finally {
        if (!cancelled) setRejoining(false);
      }
    })();
    return () => {
      cancelled = true;
      // Remount do StrictMode antes do welcome: libera nova tentativa;
      // após conectado o socket vive no store e não deve ser derrubado.
      if (useSession.getState().socket === null) {
        if (rejoinKeyRef.current === key) rejoinKeyRef.current = null;
      }
      try {
        // Só fecha o socket ainda órfão (pré-welcome). Pós-welcome o
        // socket está no store e pertence à sessão.
        if (useSession.getState().socket !== liveSocket) {
          liveSocket?.close({ silent: true });
        }
      } catch {
        // Socket já morto · nada a fazer.
      }
    };
  }, [hasSession, lang, navigate, routeCode, retryNonce]);

  const inviteUrl = useMemo(() => {
    if (!sala) return "";
    return `${window.location.origin}/join?code=${sala.code}`;
  }, [sala]);

  // Celebração de Unânime (14.3): dispara só na transição ao vivo para
  // `revealed` com sinal unânime (14.1). O sinal é estado; a celebração é o
  // evento do reveal — edição pós-reveal, reload e join não re-disparam.
  const [unanimousCelebrationKey, setUnanimousCelebrationKey] = useState(0);
  const previousPhaseRef = useRef<Phase | null>(sala?.phase ?? null);
  useEffect(() => {
    const phase = sala?.phase ?? null;
    const previous = previousPhaseRef.current;
    previousPhaseRef.current = phase;
    const cameFromVoting =
      previous === "idle" || previous === "voting" || previous === "revealable";
    if (
      cameFromVoting &&
      phase === "revealed" &&
      consensusSignal(Object.values(sala?.votes ?? {})) === "unanimous"
    ) {
      setUnanimousCelebrationKey((key) => key + 1);
    }
  }, [sala]);

  if (!hasSession || !sala) {
    if (rejoinError) {
      return (
        <Card className="arena-connection">
          <CardHeader>
            <CardTitle className="text-base">
              {content.loading.reconnectTitle}
            </CardTitle>
            <CardDescription data-testid="rejoin-error">
              {rejoinError}
            </CardDescription>
          </CardHeader>
          <CardPanel className="flex flex-wrap gap-2">
            <Button
              type="button"
              data-testid="rejoin-retry"
              onClick={() => setRetryNonce((n) => n + 1)}
            >
              {content.loading.retry}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                safeClear(clearSession);
                navigate(routeCode ? `/join?code=${routeCode}` : "/join", {
                  replace: true,
                });
              }}
            >
              {content.loading.backToJoin}
            </Button>
          </CardPanel>
        </Card>
      );
    }
    return (
      <Card className="arena-connection">
        <CardPanel className="flex items-center gap-3" role="status">
          <Spinner
            aria-label={
              rejoining
                ? content.loading.reconnectingAria
                : content.loading.loadingAria
            }
          />
          <p className="text-sm text-muted-foreground">
            {rejoining ? content.loading.reconnecting : content.loading.loading}
          </p>
        </CardPanel>
      </Card>
    );
  }

  const players = sala.players;
  const connected = players.filter((p) => p.status === "connected");
  const voters = players.filter((p) => p.role !== "spectator");
  const spectators = players.filter((p) => p.role === "spectator");
  const connectedVoters = voters.filter((p) => p.status === "connected");
  const connectedSpectators = spectators.filter(
    (p) => p.status === "connected",
  );
  const voted = connectedVoters.filter((p) => p.hasVoted).length;
  const solo = connected.length <= 1;
  const showInvite = !inviteHidden || !solo;
  const self = players.find((p) => p.id === playerId) ?? null;
  const isSpectator = self?.role === "spectator";
  const host = players.find((p) => p.id === sala.hostId) ?? null;
  // Papel derivado do snapshot ao vivo (promoção de host chega via
  // room_state) · nunca do `role` guardado no welcome.
  const isSelfHost = playerId !== null && sala.hostId === playerId;

  const bySeat = new Map(
    voters.filter((p) => p.seatIndex >= 0).map((p) => [p.seatIndex, p] as const),
  );
  const seats: Array<Player | null> = Array.from(
    { length: SEAT_COUNT },
    (_, index) => bySeat.get(index) ?? null,
  );

  const currentVote = (self?.value ?? null) as Vote | null;

  // Resultados (issue 07): espelho client-side do consenso do servidor,
  // calculado do `room_state` (source of truth). Pausa e ausência ficam
  // fora dos cálculos; ½ vale 0,5 e 0 é voto válido.
  const revealedVotes = Object.values(sala.votes ?? {});
  const {
    consensus,
    noNumerics,
    isSingleNumeric,
    isUnanimousSignal,
    voteGroups,
    resultsAriaLabel,
  } = useConsensusStats(revealedVotes, lang);

  // Reveal (issue 06): qualquer Player revela após pelo menos um
  // voto; sala "pronta para revelar" quando todos votaram sem revelar de
  // imediato.
  const totalVoted = players.filter((p) => p.hasVoted).length;
  const canReveal =
    totalVoted > 0 && (sala.phase === "voting" || sala.phase === "revealable");
  const isReadyToReveal = sala.phase === "revealable";
  const isRevealed = sala.phase === "revealed";

  // Dado da mesa (14.6): pós-reveal divergente, o sorteio determinístico
  // aponta um assento para justificar primeiro. Derivado do snapshot —
  // mesmo assento em todos os clientes, sem servidor e sem replay no
  // reload; nova Rodada re-sorteia. Pool: assentos com voto numérico.
  const numericSeatIndexes = [...bySeat.values()]
    .filter((p) => {
      const vote = sala.votes?.[p.id];
      return vote != null && voteToNumber(vote) !== null;
    })
    .map((p) => p.seatIndex);
  const justifySeatIndex =
    isRevealed && consensusSignal(revealedVotes) === "divergent"
      ? pickJustifySeat(sala.code, sala.round, numericSeatIndexes)
      : null;
  const justifyPlayer =
    justifySeatIndex === null ? null : (seats[justifySeatIndex] ?? null);

  // 16.C (#201): texto plano do resultado — mediana + lista plana
  // ascendente sem ☕ (pausa fica fora dos cálculos, como no consenso).
  // voteGroups vem em ordem do deck; reordena pelo valor numérico para
  // garantir ascendente mesmo se o deck mudar.
  const resultsCopyText = noNumerics
    ? ""
    : content.results.copyTemplate(
        formatMedian(consensus.median),
        voteGroups
          .filter((group) => voteToNumber(group.value) !== null)
          .sort(
            (a, b) =>
              (voteToNumber(a.value) ?? 0) - (voteToNumber(b.value) ?? 0),
          )
          .flatMap((group) => Array<string>(group.count).fill(group.value))
          .join(", "),
      );

  function handleReveal(): void {
    if (!canReveal) return;
    setRevealError(null);
    const sent = sendRevealThroughSession();
    if (sent) trackVotesRevealed();
    else setRevealError(errorCopy.reveal);
  }

  // Nova rodada (issue 08): qualquer Player abre após o reveal, mas com
  // segunda ativação de confirmação (botão ou N). A primeira ativação
  // arma e inicia a janela de expiração; sem a segunda a tempo o comando
  // volta ao estado inicial sem trafegar nada.
  function handleNewRoundRequest(): void {
    if (!isRevealed) return;
    if (!confirmingNewRound) {
      setNewRoundError(null);
      setConfirmingNewRound(true);
      if (newRoundTimer.current) clearTimeout(newRoundTimer.current);
      newRoundTimer.current = setTimeout(() => {
        newRoundTimer.current = null;
        setConfirmingNewRound(false);
      }, NEW_ROUND_CONFIRM_TIMEOUT_MS);
      return;
    }
    if (newRoundTimer.current) {
      clearTimeout(newRoundTimer.current);
      newRoundTimer.current = null;
    }
    setConfirmingNewRound(false);
    setNewRoundError(null);
    const sent = sendNewRoundThroughSession();
    if (sent) trackNewRound();
    else setNewRoundError(errorCopy.newRound);
  }

  function handleCardSelect(value: Vote): void {
    if (isSpectator) {
      setVoteError(
        content.deck.spectatorVoteError,
      );
      return;
    }
    // Mesma carta em duplo clique é no-op: mantém o voto sem
    // removê-lo e sem broadcast (espelha EVR-14 do servidor).
    if (currentVote === value) return;
    setVoteError(null);
    const sent = socket?.sendCastVote(value) ?? false;
    if (sent) trackVoteCast();
    else setVoteError(errorCopy.vote);
  }

  // Alvos = demais participantes conectados, incluindo espectadores.
  const projectileCooldownLeftMs = Math.max(0, projectileCooldownUntil - nowMs);
  const projectileCooldownSecs = Math.ceil(projectileCooldownLeftMs / 1000);

  /**
   * Troca ou remove o avatar sem sair da sala (AV-06/AV-07): envia
   * `update_avatar` e persiste no dispositivo. O novo valor chega via
   * `room_state`, então o anterior segue visível até o broadcast.
   * Falha de envio vira erro inline, sem reload e sem crash.
   */
  function handleAvatarChange(next: string | null): void {
    let sent = false;
    try {
      sent = socket?.updateAvatar(next) ?? false;
    } catch {
      sent = false;
    }
    if (!sent) {
      setAvatarError(content.sidebar.avatarError);
      return;
    }
    setAvatarError(null);
    if (next) saveAvatar(next);
    else clearAvatar();
  }

  function handleThrowProjectile(targetId: string, projectileType: ProjectileType): void {
    const remaining = projectileCooldownUntil - Date.now();
    if (remaining > 0) {
      // Segundo envio dentro do cooldown: recusa com feedback,
      // sem trafegar nada e sem quebrar (acceptance #157).
      setProjectileError(
        content.projectile.cooldown(Math.ceil(remaining / 1000)),
      );
      return;
    }
    if (connectionLost || reconnecting || targetId === playerId || !players.some((p) => p.id === targetId && p.status === "connected")) {
      setProjectileError(content.projectile.unavailable);
      return;
    }
    setProjectileError(null);
    const sent = sendProjectileThroughSession(targetId, projectileType);
    if (!sent) {
      setProjectileError(errorCopy.interact);
      return;
    }
    setProjectileCooldownUntil(Date.now() + cooldownFor(projectileType));
    setNowMs(Date.now());
  }

  /**
   * Cutucada (issue #172): mesma mecânica do arremesso — gate local de
   * cooldown (o servidor é o SSOT), alvo precisa estar conectado, e o
   * balão chega pelo broadcast `nudge_sent`.
   */
  function handleNudge(targetId: string, nudgeId: NudgeId): void {
    const remaining = projectileCooldownUntil - Date.now();
    if (remaining > 0) {
      setProjectileError(content.projectile.nudgeCooldown(Math.ceil(remaining / 1000)));
      return;
    }
    if (connectionLost || reconnecting || targetId === playerId || !players.some((p) => p.id === targetId && p.status === "connected")) {
      setProjectileError(content.projectile.nudgeUnavailable);
      return;
    }
    setProjectileError(null);
    const sent = sendNudgeThroughSession(targetId, nudgeId);
    if (!sent) {
      setProjectileError(errorCopy.interact);
      return;
    }
    setProjectileCooldownUntil(Date.now() + PROJECTILE_COOLDOWN_MS);
    setNowMs(Date.now());
  }

  async function handleCopy(): Promise<void> {
    setCopyError(false);
    try {
      await copyText(inviteUrl);
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopyError(true);
    }
  }

  async function handleCopyResults(): Promise<void> {
    if (noNumerics || resultsCopyText === "") return;
    setResultsCopyError(false);
    try {
      await copyText(resultsCopyText);
      setResultsCopied(true);
      if (resultsCopyTimer.current) clearTimeout(resultsCopyTimer.current);
      resultsCopyTimer.current = setTimeout(
        () => setResultsCopied(false),
        2500,
      );
    } catch {
      setResultsCopyError(true);
    }
  }

  function handleLeave(): void {
    // Ticket 09: saída voluntária avisa o servidor primeiro para a
    // presença atualizar em tempo real nos demais (e promover novo
    // Host quando o Host sai). F5 NÃO passa por aqui.
    sendThroughSession("sendLeaveRoom");
    try {
      socket?.close();
    } catch {
      // Socket já morto · só limpa a sessão.
    }
    disconnect();
    navigate("/join");
  }

  return (
    <div className="arena-page">
      <header className="arena-toolbar">
        <div className="arena-room-heading">
          <span className="arena-room-symbol" aria-hidden="true">
            <UsersIcon />
          </span>
          <div>
            <h1 data-testid="sala-code">
              {content.toolbar.room} <span>{sala.code}</span>
            </h1>
            <p data-testid="round-label">
              {content.toolbar.round(sala.round, phaseLabel(sala.phase))}
            </p>
          </div>
        </div>
        <div className="arena-live-status">
          <span data-testid="presence-line" aria-live="polite">
            <UsersIcon aria-hidden="true" />
            {connectedSpectators.length > 0
              ? content.toolbar.presenceSpectators(
                  connectedVoters.length,
                  connectedSpectators.length,
                  voted,
                )
              : content.toolbar.presence(connected.length, voted)}
          </span>
          <Button variant="ghost" onClick={handleLeave}>
            <LogOutIcon aria-hidden="true" />
            {content.toolbar.leave}
          </Button>
        </div>
      </header>
      {reconnecting && !connectionLost && (
        <Alert variant="warning">
          <AlertTitle>{content.reconnecting.title}</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-2">
            <span data-testid="reconnecting-hint">
              {content.reconnecting.hint(reconnectAttempt)}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid="reconnect-now"
              onClick={() => {
                try {
                  socket?.retryNow();
                } catch {
                  // Best-effort — o backoff cobre em seguida.
                }
              }}
            >
              {content.reconnecting.retryNow}
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {connectionLost && (
        <Alert variant="warning">
          <AlertTitle>{content.connectionLost.title}</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-2">
            <span>{content.connectionLost.hint}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid="reconnect-retry"
              onClick={() => {
                setConnectionLost(false);
                try {
                  socket?.retryNow();
                } catch {
                  // Best-effort — recarregar segue disponível.
                }
              }}
            >
              {content.connectionLost.retry}
            </Button>
          </AlertDescription>
        </Alert>
      )}
      <div className="arena-workspace" ref={arenaRef}>
        <div className="projectile-layer" aria-hidden="true">
          {projectileFlights.map((event) => (
            <ProjectileFlight key={event.key} event={event} arenaRef={arenaRef} onDone={removeProjectileFlight} />
          ))}
        </div>
        <div className="nudge-layer">
          {nudgeBalloons.map((event) => (
            <NudgeBalloon key={event.key} event={event} arenaRef={arenaRef} onDone={removeNudgeBalloon} lang={lang} />
          ))}
        </div>
        <section
          className="arena-play-area"
          aria-label={content.playArea.aria}
        >
          <div className="arena-table-caption">
            <span>{content.playArea.caption}</span>
            <span>
              {content.playArea.seatsLeft(connectedVoters.length, SEAT_COUNT)}
            </span>
          </div>
          <PokerTable
            seats={seats}
            playerId={playerId}
            hostId={sala.hostId}
            revealed={isRevealed}
            celebrateKey={unanimousCelebrationKey}
            justifySeatIndex={justifySeatIndex}
            onThrowProjectile={connectionLost || reconnecting ? undefined : handleThrowProjectile}
            onNudge={connectionLost || reconnecting ? undefined : handleNudge}
            projectileCooldownSecs={projectileCooldownSecs}
            lang={lang}
          >
            <Card className="arena-reveal">
              <CardHeader>
                <CardTitle className="text-base">
                  {isRevealed
                    ? content.reveal.titleRevealed
                    : isReadyToReveal
                      ? content.reveal.titleReady
                      : content.reveal.titleVoting}
                </CardTitle>
                <CardDescription data-testid="reveal-hint" aria-live="polite">
                  {isRevealed
                    ? content.reveal.descRevealed
                    : isReadyToReveal
                      ? content.reveal.descReady
                      : canReveal
                        ? content.reveal.descCanReveal
                        : content.reveal.descWaiting}
                </CardDescription>
              </CardHeader>
              <CardPanel className="flex flex-col gap-3">
                {!isRevealed && (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      data-testid="reveal-button"
                      disabled={!canReveal}
                      onClick={handleReveal}
                      aria-keyshortcuts="r"
                      aria-label={
                        canReveal
                          ? content.reveal.revealAria
                          : content.reveal.revealAriaWaiting
                      }
                    >
                      <EyeIcon aria-hidden="true" />
                      {content.reveal.reveal}
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      <kbd className="rounded border px-1 font-mono">R</kbd>{" "}
                      {content.reveal.revealHint}
                      {canReveal
                        ? content.reveal.revealHintReady
                        : content.reveal.revealHintWaiting}
                    </span>
                  </div>
                )}
                {isRevealed && (
                  <div className="flex flex-col items-center gap-2">
                    <Button
                      type="button"
                      data-testid="new-round-button"
                      data-confirming={confirmingNewRound ? "true" : "false"}
                      variant={
                        confirmingNewRound ? "destructive-outline" : "default"
                      }
                      onClick={handleNewRoundRequest}
                      aria-keyshortcuts="n"
                      aria-label={
                        confirmingNewRound
                          ? content.reveal.newRoundAriaConfirm
                          : content.reveal.newRoundAria
                      }
                    >
                      <RotateCcwIcon aria-hidden="true" />
                      {confirmingNewRound
                        ? content.reveal.newRoundConfirm
                        : content.reveal.newRound}
                    </Button>
                    <span
                      data-testid="new-round-hint"
                      aria-live="polite"
                      className="text-xs text-muted-foreground"
                    >
                      {confirmingNewRound
                        ? content.reveal.newRoundHintConfirm
                        : content.reveal.newRoundHint}
                    </span>
                    {confirmingNewRound ? (
                      <span
                        data-testid="new-round-countdown"
                        aria-hidden="true"
                        className="arena-confirm-countdown"
                        style={{
                          animationDuration: `${NEW_ROUND_CONFIRM_TIMEOUT_MS}ms`,
                        }}
                      />
                    ) : null}
                  </div>
                )}
                {revealError ? (
                  <Alert variant="error">
                    <AlertTitle>{content.reveal.errorTitle}</AlertTitle>
                    <AlertDescription data-testid="reveal-error">
                      {revealError}
                    </AlertDescription>
                  </Alert>
                ) : null}
                {newRoundError ? (
                  <Alert variant="error">
                    <AlertTitle>{content.reveal.newRoundErrorTitle}</AlertTitle>
                    <AlertDescription data-testid="new-round-error">
                      {newRoundError}
                    </AlertDescription>
                  </Alert>
                ) : null}
              </CardPanel>
            </Card>
          </PokerTable>
          <p className="arena-projectile-hint" data-testid="projectile-hint">
            {content.projectile.hint}
          </p>
          {projectileError ? (
            <Alert variant="error">
              <AlertTitle>{content.projectile.errorTitle}</AlertTitle>
              <AlertDescription data-testid="projectile-error">{projectileError}</AlertDescription>
            </Alert>
          ) : null}
          <Card className="arena-deck">
            <CardHeader>
              <CardTitle className="text-base">
                {isSpectator ? content.deck.spectatorTitle : content.deck.title}
              </CardTitle>
              <CardDescription data-testid="deck-selection" aria-live="polite">
                {isSpectator
                  ? content.deck.spectatorDesc
                  : !isRevealed && currentVote === null
                    ? content.deck.pickAdjustable
                    : voteSelectionText(currentVote, {
                        revealed: isRevealed,
                        adjustable: true,
                        lang,
                      })}
              </CardDescription>
            </CardHeader>
            <CardPanel className="flex flex-col gap-3">
              <Deck
                currentVote={currentVote}
                onSelect={handleCardSelect}
                disabled={isSpectator}
                lang={lang}
              />
              {voteError ? (
                <Alert variant="error">
                  <AlertTitle>{content.deck.errorTitle}</AlertTitle>
                  <AlertDescription data-testid="vote-error">
                    {voteError}
                  </AlertDescription>
                </Alert>
              ) : null}
            </CardPanel>
          </Card>

          <div className="arena-table-note">
            <span>{content.tableNote.estimate}</span>
            <span>
              <kbd>R</kbd> {content.tableNote.revealShortcut} · <kbd>N</kbd>{" "}
              {content.tableNote.newRoundShortcut}
            </span>
          </div>
        </section>
        <aside className="arena-sidebar" aria-label={content.sidebar.aria}>
          <div className="arena-self" data-testid="self-line">
            {content.sidebar.youAre} <strong>{self?.nick ?? nick}</strong>
            {isSpectator ? content.sidebar.watching : ""}
            {!isSpectator && isSelfHost ? content.sidebar.selfHost : ""}
            {host && host.id !== playerId ? (
              <>
                {content.sidebar.hostLead}
                <strong>{host.nick}</strong>
              </>
            ) : null}
          </div>
          <AvatarPicker
            value={self?.avatar ?? null}
            onChange={handleAvatarChange}
            compact
            lang={lang}
          />
          {avatarError ? (
            <Alert variant="error">
              <AlertTitle>{content.sidebar.avatarErrorTitle}</AlertTitle>
              <AlertDescription data-testid="avatar-error">
                {avatarError}
              </AlertDescription>
            </Alert>
          ) : null}
          {connectedSpectators.length > 0 ? (
            <div
              className="arena-spectators"
              data-testid="spectators-line"
              aria-live="polite"
            >
              <EyeIcon aria-hidden="true" />
              <span>
                {content.sidebar.spectators(connectedSpectators.length)}{" "}
                <strong>
                    {connectedSpectators.map((p, index) => (
                      <span key={p.id}>
                        {index > 0 ? ", " : ""}
                        {p.id !== playerId && !connectionLost && !reconnecting ? (
                          <ProjectileMenu target={p} cooldownSecs={projectileCooldownSecs} onThrow={handleThrowProjectile} onNudge={handleNudge} className="arena-spectator-target" align="left" side="bottom" lang={lang}>
                            <span className="arena-spectator-anchor" data-projectile-player={p.id}><SpectatorAvatar player={p} />{p.nick}</span>
                          </ProjectileMenu>
                        ) : <span className="arena-spectator-anchor" data-projectile-player={p.id}><SpectatorAvatar player={p} />{p.nick}</span>}
                      </span>
                    ))}
                </strong>
              </span>
            </div>
          ) : null}
          {isRevealed ? (
            <Card className="arena-results">
              <CardHeader>
                <CardTitle className="text-base">{content.results.title}</CardTitle>
                <CardDescription>
                  {content.results.description}
                </CardDescription>
              </CardHeader>
              <CardPanel>
                <output
                  aria-live="polite"
                  aria-label={resultsAriaLabel}
                  data-testid="stats-pill"
                  data-stats-unanimous={isUnanimousSignal ? "true" : "false"}
                  className="flex w-full flex-col gap-3"
                >
                  <div className="flex items-center gap-5">
                    <div className="flex flex-col items-center gap-1">
                      {isUnanimousSignal ? (
                        <span
                          data-testid="stats-unanimous-badge"
                          className="rounded-full bg-success/12 px-2.5 py-0.5 font-mono text-xs tracking-widest text-success-foreground uppercase"
                        >
                          {content.results.unanimous}
                        </span>
                      ) : (
                        <span
                          data-testid="stats-eyebrow"
                          className="text-xs text-muted-foreground"
                        >
                          {noNumerics
                            ? content.results.noNumerics
                            : isSingleNumeric
                              ? content.results.single
                              : content.results.median}
                        </span>
                      )}
                      <span
                        data-testid="stats-result-value"
                        className="font-mono text-4xl font-semibold tabular-nums"
                      >
                        {formatMedian(consensus.median)}
                      </span>
                    </div>
                    <span
                      aria-hidden="true"
                      className="h-12 w-px shrink-0 bg-border"
                    />
                    <div className="flex min-w-0 flex-col items-start gap-1.5">
                      <span
                        data-testid="stats-caption"
                        className="text-sm text-muted-foreground"
                      >
                        {content.results.mean}{" "}
                        <span
                          data-testid="stats-mean-value"
                          className="font-mono text-foreground tabular-nums"
                        >
                          {formatMean(consensus.mean)}
                        </span>{" "}
                        · {content.results.range}{" "}
                        <span
                          data-testid="stats-range-value"
                          className="font-mono text-foreground tabular-nums"
                        >
                          {formatRange(consensus.range)}
                        </span>
                      </span>
                      {voteGroups.length > 0 ? (
                        <span
                          data-testid="stats-distribution"
                          className="flex flex-wrap gap-1.5"
                        >
                          {voteGroups.map((group) => (
                            <span
                              key={group.value}
                              data-testid={`stats-pip-${group.value}`}
                              title={content.results.pipTitle(
                                group.count,
                                group.value,
                              )}
                              className="rounded-full bg-muted px-2 py-0.5 font-mono text-xs tabular-nums"
                            >
                              {group.count}×{group.value}
                            </span>
                          ))}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  {noNumerics ? (
                    <p
                      data-testid="stats-no-numerics"
                      className="text-sm text-muted-foreground"
                    >
                      {content.results.noNumericsNote}
                    </p>
                  ) : null}
                </output>
                <div className="flex flex-col gap-1.5">
                  <div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      data-testid="copy-results-button"
                      disabled={noNumerics}
                      onClick={() => {
                        void handleCopyResults();
                      }}
                    >
                      {resultsCopied ? (
                        <CheckIcon aria-hidden="true" />
                      ) : (
                        <CopyIcon aria-hidden="true" />
                      )}
                      {resultsCopied
                        ? content.results.copied
                        : content.results.copy}
                    </Button>
                  </div>
                  <div aria-live="polite" className="min-h-5 text-sm">
                    {resultsCopied ? (
                      <span
                        className="text-success-foreground"
                        data-testid="copy-results-feedback"
                      >
                        {content.results.copyFeedback}
                      </span>
                    ) : null}
                    {resultsCopyError ? (
                      <span className="text-destructive-foreground">
                        {content.results.copyError}
                      </span>
                    ) : null}
                  </div>
                </div>
                {justifyPlayer ? (
                  <p
                    role="status"
                    data-testid="justify-line"
                    className="flex items-center gap-1.5 text-sm text-muted-foreground"
                  >
                    <DicesIcon aria-hidden="true" className="size-4 shrink-0" />
                    {content.results.justifyLead}
                    <strong className="font-semibold text-foreground">
                      {justifyPlayer.nick}
                    </strong>
                  </p>
                ) : null}
              </CardPanel>
            </Card>
          ) : null}

          {showInvite ? (
            <Card className="arena-invite">
              <CardHeader>
                <CardTitle className="text-base">{content.invite.title}</CardTitle>
                <CardDescription>
                  {content.invite.description}
                </CardDescription>
              </CardHeader>
              <CardPanel className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={inviteUrl}
                    aria-label={content.invite.linkAria}
                    onFocus={(event) => event.currentTarget.select()}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      void handleCopy();
                    }}
                  >
                    {copied ? (
                      <CheckIcon aria-hidden="true" />
                    ) : (
                      <CopyIcon aria-hidden="true" />
                    )}
                    {copied ? content.invite.copied : content.invite.copy}
                  </Button>
                </div>
                <div aria-live="polite" className="min-h-5 text-sm">
                  {copied ? (
                    <span
                      className="text-success-foreground"
                      data-testid="copy-feedback"
                    >
                      {content.invite.copyFeedback}
                    </span>
                  ) : null}
                  {copyError ? (
                    <span className="text-destructive-foreground">
                      {content.invite.copyError}
                    </span>
                  ) : null}
                </div>
                {solo ? (
                  <div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setInviteHidden(true)}
                    >
                      <EyeOffIcon aria-hidden="true" />
                      {content.invite.hide}
                    </Button>
                  </div>
                ) : null}
              </CardPanel>
            </Card>
          ) : (
            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setInviteHidden(false)}
              >
                {content.invite.show}
              </Button>
            </div>
          )}

          {!isRevealed && (
            <div className="arena-waiting">
              <EyeOffIcon aria-hidden="true" />
              <h2>
                {isSpectator
                  ? content.waiting.spectatorTitle
                  : content.waiting.title}
              </h2>
              <p>
                {isSpectator
                  ? content.waiting.spectatorBody
                  : content.waiting.body}
              </p>
              {solo && (
                <p data-testid="solo-hint" className="arena-solo-hint">
                  <UsersIcon aria-hidden="true" />
                  <span>
                    {isSpectator
                      ? content.waiting.soloSpectator
                      : content.waiting.solo}
                  </span>
                </p>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
