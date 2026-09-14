import {
  CheckIcon,
  CopyIcon,
  EyeIcon,
  EyeOffIcon,
  LogOutIcon,
  RotateCcwIcon,
  TimerIcon,
  UsersIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { PokerTable } from "@/components/poker-table";
import "./arena.css";
import { Spinner } from "@/components/ui/spinner";
import {
  formatMean,
  formatMedian,
  formatRange,
} from "@/lib/deck";
import {
  hasAnyVotes,
  useConsensusStats,
  voteSelectionText,
} from "@/lib/stats";
import type { Phase, Player, Vote } from "@/lib/protocol";
import {
  type ProjectileThrownPayload,
  type ProjectileType,
} from "@/lib/protocol";
import { useSession } from "@/store/session";
import { JoinError, friendlyJoinMessage } from "@/lib/errors";
import { SOCKET_ERROR_COPY } from "@/lib/forms";
import { clearSession, loadSession } from "@/lib/identity";
import { safeClear } from "@/lib/storage";
import { copyText } from "@/lib/clipboard";
import { resolveWsUrl } from "@/lib/api";
import {
  PROJECTILE_CATALOG,
  PROJECTILE_COOLDOWN_MS,
  PROJECTILE_FEED_LIMIT,
  projectileFeedText,
} from "@/lib/projectiles";
import { PointlySocket } from "@/lib/ws-client";

/** Limite duro do domínio: 12 assentos por sala. */
export const SEAT_COUNT = 12;

/**
 * Janela da confirmação dupla de nova rodada: a primeira ativação (botão
 * ou N) arma o estado de confirmação; sem a segunda ativação a tempo o
 * comando volta ao estado inicial sem trafegar nada.
 */
export const NEW_ROUND_CONFIRM_TIMEOUT_MS = 5000;

// Re-exports de compat (SSOT em `@/lib/projectiles`).
export {
  PROJECTILE_CATALOG,
  PROJECTILE_COOLDOWN_MS,
  PROJECTILE_FEED_LIMIT,
  projectileFeedText,
};

export interface ProjectileFeedItem extends ProjectileThrownPayload {
  key: number;
  senderNick: string;
  targetNick: string;
}

function resolveNick(
  players: readonly Player[],
  playerId: string,
  fallback: string,
): string {
  return players.find((p) => p.id === playerId)?.nick ?? fallback;
}

const PHASE_LABEL: Record<Phase, string> = {
  idle: "Aguardando votos",
  voting: "Votando",
  revealable: "Pronta para revelar",
  revealed: "Revelada",
};

function phaseLabel(phase: Phase): string {
  return PHASE_LABEL[phase] ?? phase;
}

/** Timer crítico na reta final (espelha `Sala.isCritical` do servidor). */
function isTimerCritical(phase: Phase, timer: number): boolean {
  return (
    (phase === "voting" || phase === "revealable") && timer > 0 && timer <= 30
  );
}

function isTypingTarget(event: KeyboardEvent): boolean {
  const target = event.target as
    | (HTMLElement & {
        tagName?: string;
      })
    | null;
  if (!target) return false;
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
function sendThroughSession<K extends "sendRevealVotes" | "sendStartNewRound" | "sendThrowProjectile" | "sendLeaveRoom">(
  method: K,
  ...args: K extends "sendThrowProjectile" ? [string, ProjectileType] : []
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

/** Envia `throw_projectile` pelo socket da sessão (pós-reveal, issue #157). */
function sendProjectileThroughSession(
  targetPlayerId: string,
  projectileType: ProjectileType,
): boolean {
  return sendThroughSession("sendThrowProjectile", targetPlayerId, projectileType);
}

export function ArenaPage(): React.ReactElement {
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
  const [connectionLost, setConnectionLost] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [revealError, setRevealError] = useState<string | null>(null);
  const [confirmingNewRound, setConfirmingNewRound] = useState(false);
  const [newRoundError, setNewRoundError] = useState<string | null>(null);
  // Issue #157 · Projéteis pós-reveal: alvo selecionado, erro de envio,
  // cooldown client-side (espelho dos 5s do servidor) e feed de
  // interações com origem/destino claros (broadcast para a Sala).
  const [projectileTarget, setProjectileTarget] = useState<string | null>(null);
  const [projectileError, setProjectileError] = useState<string | null>(null);
  const [projectileCooldownUntil, setProjectileCooldownUntil] = useState(0);
  const [projectileFeed, setProjectileFeed] = useState<ProjectileFeedItem[]>(
    [],
  );
  const [nowMs, setNowMs] = useState(() => Date.now());
  const projectileKeyRef = useRef(0);
  // Ticket 09: F5 reconecta com o mesmo UUID a partir da sessão
  // persistida (sem duplicar o Player · o servidor reidrata voto,
  // assento e fase). `rejoinError` mantém a Arena legível com retry
  // quando a sala sumiu (restart) ou a rede falhou.
  const [rejoining, setRejoining] = useState(false);
  const [rejoinError, setRejoinError] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);
  const rejoinKeyRef = useRef<string | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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
        // Reveal confirmado pelo servidor (manual ou auto no zero):
        // limpa o erro de reveal pendente.
        if (next.phase === "revealed") {
          setRevealError(null);
        } else if (confirmingRef.current) {
          // Nova rodada confirmada (round incrementado, votos
          // limpos, timer em 60s): volta ao estado inicial.
          if (newRoundTimer.current) {
            clearTimeout(newRoundTimer.current);
            newRoundTimer.current = null;
          }
          setConfirmingNewRound(false);
          setNewRoundError(null);
        }
      },
      onClose: () => {
        setConnectionLost(true);
      },
      onProjectileThrown: (event) => {
        // Broadcast da Sala (issue #157): origem e destino claros
        // para todos · remetente, alvo e quem só assiste veem o
        // mesmo feed com o desfecho sorteado pelo servidor.
        const current = useSession.getState().sala;
        const players = current?.players ?? [];
        projectileKeyRef.current += 1;
        const item: ProjectileFeedItem = {
          ...event,
          key: projectileKeyRef.current,
          senderNick: resolveNick(players, event.senderPlayerId, "Alguém"),
          targetNick: resolveNick(players, event.targetPlayerId, "alguém"),
        };
        setProjectileFeed((prev) =>
          [...prev, item].slice(-PROJECTILE_FEED_LIMIT),
        );
      },
      onError: (_code, message) => {
        const text = message || "Não foi possível completar a ação.";
        // Erros de projétil (cooldown/arremesso) vão para o alerta
        // de interações sem quebrar a sala (issue #157).
        if (
          /projectile|throw|cooldown|arremess|recarreg/i.test(text) ||
          /projectile|throw|cooldown/i.test(_code)
        ) {
          setProjectileError(text);
        } else if (
          /new.?round|start_new|nova.?rodada/i.test(text) ||
          /new.?round|start_new/i.test(_code)
        ) {
          if (newRoundTimer.current) {
            clearTimeout(newRoundTimer.current);
            newRoundTimer.current = null;
          }
          setConfirmingNewRound(false);
          setNewRoundError(text);
        } else if (/reveal/i.test(text) || /reveal/i.test(_code)) {
          // Erros de reveal (invalid_phase com "reveal") vão para o
          // alerta de reveal; o resto continua no alerta de voto.
          setRevealError(text);
        } else {
          setVoteError(text || "Não foi possível registrar o voto.");
        }
      },
    });
  }, [socket]);

  // Ticker local do timer: espelha o countdown do servidor (60s parados
  // até o primeiro voto, contagem compartilhada depois). Cada navegador
  // decrementa a partir do mesmo baseline do `room_state`, então os dois
  // mostram o mesmo valor durante a contagem; o próximo `room_state`
  // reconcilia (o servidor continua source of truth e dispara o
  // auto-reveal no zero mesmo com faltantes).
  useEffect(() => {
    const id = setInterval(() => {
      const current = useSession.getState().sala;
      if (!current) return;
      if (current.phase !== "voting" && current.phase !== "revealable") {
        return;
      }
      if (current.timer <= 0) return;
      // Sem nenhum voto a rodada fica parada nos 60s.
      if (!hasAnyVotes(current.players, current.votes)) return;
      useSession
        .getState()
        .updateSala({ ...current, timer: current.timer - 1 });
    }, 1000);
    return () => clearInterval(id);
  }, []);

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
      if (!sent) {
        setRevealError(SOCKET_ERROR_COPY.reveal);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
      if (!sent) {
        setNewRoundError(SOCKET_ERROR_COPY.newRound);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
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
            ? friendlyJoinMessage(error.code, error.message)
            : "Algo deu errado. Tente de novo.";
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
  }, [hasSession, navigate, routeCode, retryNonce]);

  const inviteUrl = useMemo(() => {
    if (!sala) return "";
    return `${window.location.origin}/join?code=${sala.code}`;
  }, [sala]);

  if (!hasSession || !sala) {
    if (rejoinError) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Não foi possível reconectar
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
              Tentar de novo
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
              Voltar à entrada
            </Button>
          </CardPanel>
        </Card>
      );
    }
    return (
      <Card>
        <CardPanel className="flex items-center gap-3">
          <Spinner
            aria-label={rejoining ? "Reconectando" : "Carregando sala"}
          />
          <p className="text-sm text-muted-foreground">
            {rejoining ? "Reconectando…" : "Carregando sala…"}
          </p>
        </CardPanel>
      </Card>
    );
  }

  const players = sala.players;
  const connected = players.filter((p) => p.status === "connected");
  const voted = connected.filter((p) => p.hasVoted).length;
  const solo = connected.length <= 1;
  const critical = isTimerCritical(sala.phase, sala.timer);
  const showInvite = !inviteHidden || !solo;
  const self = players.find((p) => p.id === playerId) ?? null;
  const host = players.find((p) => p.id === sala.hostId) ?? null;
  // Papel derivado do snapshot ao vivo (promoção de host chega via
  // room_state) · nunca do `role` guardado no welcome.
  const isSelfHost = playerId !== null && sala.hostId === playerId;

  const bySeat = new Map(players.map((p) => [p.seatIndex, p] as const));
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
  } = useConsensusStats(revealedVotes);

  // Timer e Reveal (issue 06): qualquer Player revela após pelo menos um
  // voto; sala "pronta para revelar" quando todos votaram sem revelar de
  // imediato; auto-reveal no zero chega via room_state (phase revealed).
  const totalVoted = players.filter((p) => p.hasVoted).length;
  const canReveal =
    totalVoted > 0 && (sala.phase === "voting" || sala.phase === "revealable");
  const isReadyToReveal = sala.phase === "revealable";
  const isRevealed = sala.phase === "revealed";

  function handleReveal(): void {
    if (!canReveal) return;
    setRevealError(null);
    const sent = sendRevealThroughSession();
    if (!sent) {
      setRevealError(SOCKET_ERROR_COPY.reveal);
    }
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
    if (!sent) {
      setNewRoundError(SOCKET_ERROR_COPY.newRound);
    }
  }

  function handleCardSelect(value: Vote): void {
    // Mesma carta em duplo clique é no-op: mantém o voto sem
    // removê-lo e sem broadcast (espelha EVR-14 do servidor).
    if (currentVote === value) return;
    setVoteError(null);
    const sent = socket?.sendCastVote(value) ?? false;
    if (!sent) {
      setVoteError(SOCKET_ERROR_COPY.vote);
    }
  }

  // Projéteis (issue #157): interações pós-reveal com cooldown de 5s.
  // Alvos = demais players conectados (nunca a si mesmo). Durante a
  // votação o envio fica indisponível com explicação; o segundo envio
  // dentro do cooldown é recusado com feedback e sem quebrar a sala.
  const availableTargets = players.filter(
    (p) => p.id !== playerId && p.status === "connected",
  );
  const effectiveTargetId =
    projectileTarget && availableTargets.some((p) => p.id === projectileTarget)
      ? projectileTarget
      : (availableTargets[0]?.id ?? null);
  const effectiveTargetNick = effectiveTargetId
    ? resolveNick(players, effectiveTargetId, "alvo")
    : "alvo";
  const projectileCooldownLeftMs = Math.max(0, projectileCooldownUntil - nowMs);
  const isProjectileCooling = projectileCooldownLeftMs > 0;
  const projectileCooldownSecs = Math.ceil(projectileCooldownLeftMs / 1000);

  function handleThrowProjectile(projectileType: ProjectileType): void {
    if (!isRevealed) return;
    const remaining = projectileCooldownUntil - Date.now();
    if (remaining > 0) {
      // Segundo envio dentro do cooldown: recusa com feedback,
      // sem trafegar nada e sem quebrar (acceptance #157).
      setProjectileError(
        `Recarregando · aguarde ${Math.ceil(remaining / 1000)}s para arremessar de novo.`,
      );
      return;
    }
    const targetId = effectiveTargetId;
    if (!targetId) {
      setProjectileError("Escolha outro player como alvo para interagir.");
      return;
    }
    if (targetId === playerId) {
      setProjectileError("Não é possível arremessar em si mesmo.");
      return;
    }
    setProjectileError(null);
    const sent = sendProjectileThroughSession(targetId, projectileType);
    if (!sent) {
      setProjectileError(SOCKET_ERROR_COPY.interact);
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
            <h1 data-testid="sala-code">Sala {sala.code}</h1>
            <p data-testid="round-label">
              Rodada {sala.round} · {phaseLabel(sala.phase)}
            </p>
          </div>
        </div>
        <div className="arena-live-status">
          <span data-testid="presence-line" aria-live="polite">
            <UsersIcon aria-hidden="true" />
            {connected.length} na sala · {voted}{" "}
            {voted === 1 ? "votou" : "votaram"}
          </span>
          <span
            className={
              critical
                ? "arena-clock arena-clock--critical text-destructive-foreground"
                : "arena-clock"
            }
            data-testid="timer-line"
            aria-live={critical ? "assertive" : "off"}
          >
            <TimerIcon aria-hidden="true" />
            {sala.timer}s
          </span>
          <Button variant="ghost" onClick={handleLeave}>
            <LogOutIcon aria-hidden="true" />
            Sair da sala
          </Button>
        </div>
      </header>
      {connectionLost && (
        <Alert variant="warning">
          <AlertTitle>Conexão perdida</AlertTitle>
          <AlertDescription>
            O placar pode estar desatualizado. Recarregue a página para
            reconectar.
          </AlertDescription>
        </Alert>
      )}
      <div className="arena-workspace">
        <section
          className="arena-play-area"
          aria-label="Mesa de planning poker"
        >
          <div className="arena-table-caption">
            <span>Mesa de planning poker</span>
            <span>{connected.length} de 12 lugares</span>
          </div>
          <PokerTable
            seats={seats}
            playerId={playerId}
            hostId={sala.hostId}
            revealed={isRevealed}
          >
            <Card className="arena-reveal">
              <CardHeader>
                <CardTitle className="text-base">
                  {isRevealed
                    ? "Cartas na mesa"
                    : isReadyToReveal
                      ? "Vamos revelar?"
                      : "Qual é a sua estimativa?"}
                </CardTitle>
                <CardDescription data-testid="reveal-hint" aria-live="polite">
                  {isRevealed
                    ? "Votos revelados. Discutam as diferenças."
                    : isReadyToReveal
                      ? sala.timer > 0
                        ? "Todos votaram · no zero, revela sozinho."
                        : "Todos votaram."
                      : canReveal
                        ? "Com votos na mesa, qualquer player pode revelar."
                        : "Aguardando o primeiro voto para liberar o reveal."}
                </CardDescription>
              </CardHeader>
              {!isRevealed || revealError ? (
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
                            ? "Revelar votos (atalho R)"
                            : "Aguardando votos para revelar"
                        }
                        title={canReveal ? "Atalho: R" : undefined}
                      >
                        <EyeIcon aria-hidden="true" />
                        Revelar votos
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        <kbd className="rounded border px-1 font-mono">R</kbd>{" "}
                        revela
                        {canReveal
                          ? " · encerra a contagem e vai à discussão."
                          : " · disponível após o primeiro voto."}
                      </span>
                    </div>
                  )}
                  {revealError ? (
                    <Alert variant="error">
                      <AlertTitle>Não foi possível revelar</AlertTitle>
                      <AlertDescription data-testid="reveal-error">
                        {revealError}
                      </AlertDescription>
                    </Alert>
                  ) : null}
                </CardPanel>
              ) : null}
            </Card>
          </PokerTable>
          <Card className="arena-deck">
            <CardHeader>
              <CardTitle className="text-base">Sua estimativa</CardTitle>
              <CardDescription data-testid="deck-selection" aria-live="polite">
                {!isRevealed && currentVote === null
                  ? "Escolha uma carta para votar. Dá para trocar até o reveal."
                  : voteSelectionText(currentVote, {
                      revealed: isRevealed,
                      adjustable: true,
                    })}
              </CardDescription>
            </CardHeader>
            <CardPanel className="flex flex-col gap-3">
              <Deck currentVote={currentVote} onSelect={handleCardSelect} />
              {voteError ? (
                <Alert variant="error">
                  <AlertTitle>Não foi possível votar</AlertTitle>
                  <AlertDescription data-testid="vote-error">
                    {voteError}
                  </AlertDescription>
                </Alert>
              ) : null}
            </CardPanel>
          </Card>

          <div className="arena-table-note">
            <span>Estimativas independentes. Conversas em conjunto.</span>
            <span>
              <kbd>R</kbd> revelar · <kbd>N</kbd> nova rodada
            </span>
          </div>
        </section>
        <aside className="arena-sidebar" aria-label="Informações da sala">
          <div className="arena-self" data-testid="self-line">
            Você é <strong>{self?.nick ?? nick}</strong>
            {isSelfHost ? " · Host da sala" : ""}
            {host && host.id !== playerId ? (
              <>
                {" "}
                · Host: <strong>{host.nick}</strong>
              </>
            ) : null}
          </div>
          {showInvite ? (
            <Card className="arena-invite">
              <CardHeader>
                <CardTitle className="text-base">Convidar o time</CardTitle>
                <CardDescription>
                  Compartilhe o link e reúna o time à mesa.
                </CardDescription>
              </CardHeader>
              <CardPanel className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={inviteUrl}
                    aria-label="Link de convite"
                    onFocus={(event) => event.currentTarget.select()}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      void handleCopy();
                    }}
                  >
                    {copied ? (
                      <CheckIcon aria-hidden="true" />
                    ) : (
                      <CopyIcon aria-hidden="true" />
                    )}
                    {copied ? "Copiado!" : "Copiar"}
                  </Button>
                </div>
                <div aria-live="polite" className="min-h-5 text-sm">
                  {copied ? (
                    <span
                      className="text-success-foreground"
                      data-testid="copy-feedback"
                    >
                      Link copiado! É só enviar ao time.
                    </span>
                  ) : null}
                  {copyError ? (
                    <span className="text-destructive-foreground">
                      Não foi possível copiar. Selecione o link e copie
                      manualmente.
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
                      Ocultar convite
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
                Mostrar convite
              </Button>
            </div>
          )}

          {isRevealed ? (
            <Card className="arena-results">
              <CardHeader>
                <CardTitle className="text-base">Resultados</CardTitle>
                <CardDescription>
                  Média, mediana, menor e maior estimativa · pausa e ausência
                  ficam fora dos cálculos.
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
                          Unânime
                        </span>
                      ) : (
                        <span
                          data-testid="stats-eyebrow"
                          className="text-xs text-muted-foreground"
                        >
                          {noNumerics
                            ? "Sem votos numéricos"
                            : isSingleNumeric
                              ? "Voto único"
                              : "Mediana"}
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
                        média{" "}
                        <span
                          data-testid="stats-mean-value"
                          className="font-mono text-foreground tabular-nums"
                        >
                          {formatMean(consensus.mean)}
                        </span>{" "}
                        · intervalo{" "}
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
                              title={`${group.count} ${group.count > 1 ? "votos" : "voto"} em ${group.value}`}
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
                      Só pausa ou ninguém votou · sem média, mediana nem
                      intervalo.
                    </p>
                  ) : null}
                </output>
              </CardPanel>
            </Card>
          ) : null}

          {isRevealed ? (
            <Card className="arena-next-round">
              <CardHeader>
                <CardTitle className="text-base">Nova rodada</CardTitle>
                <CardDescription
                  data-testid="new-round-hint"
                  aria-live="polite"
                >
                  {confirmingNewRound
                    ? "Tem certeza? Ative de novo para confirmar · expira em alguns segundos."
                    : "Prontos para a próxima estimativa? Clique duas vezes para começar."}
                </CardDescription>
              </CardHeader>
              <CardPanel className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    data-testid="new-round-button"
                    data-confirming={confirmingNewRound ? "true" : "false"}
                    variant={confirmingNewRound ? "destructive" : "outline"}
                    onClick={handleNewRoundRequest}
                    aria-keyshortcuts="n"
                    aria-label={
                      confirmingNewRound
                        ? "Confirmar nova rodada (atalho N)"
                        : "Nova rodada (atalho N, exige confirmação)"
                    }
                    title="Atalho: N (duas vezes)"
                  >
                    <RotateCcwIcon aria-hidden="true" />
                    {confirmingNewRound
                      ? "Confirmar nova rodada"
                      : "Nova rodada"}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    <kbd className="rounded border px-1 font-mono">N</kbd>{" "}
                    {confirmingNewRound
                      ? "pressione de novo para confirmar."
                      : "pede confirmação · um toque só não abre."}
                  </span>
                </div>
                {newRoundError ? (
                  <Alert variant="error">
                    <AlertTitle>Não foi possível abrir nova rodada</AlertTitle>
                    <AlertDescription data-testid="new-round-error">
                      {newRoundError}
                    </AlertDescription>
                  </Alert>
                ) : null}
              </CardPanel>
            </Card>
          ) : null}

          {!isRevealed && (
            <div className="arena-waiting">
              <EyeOffIcon aria-hidden="true" />
              <h2>Cada opinião conta.</h2>
              <p>
                As cartas ficam escondidas até a revelação. Escolha sem
                influência do time.
              </p>
              {solo && (
                <p data-testid="solo-hint">
                  Você está sozinho. Copie o convite para chamar o time. Dá para
                  votar sozinho para testar o fluxo.
                </p>
              )}
            </div>
          )}
          <Card className="arena-reactions">
            <CardHeader>
              <CardTitle className="text-base">Interações</CardTitle>
              <CardDescription data-testid="projectile-hint" aria-live="polite">
                {isRevealed
                  ? "Escolha alguém do time e envie uma reação."
                  : "Envie uma reação ao time depois de revelar as cartas."}
              </CardDescription>
            </CardHeader>
            <CardPanel className="flex flex-col gap-3">
              {!isRevealed ? (
                <p
                  className="text-sm text-muted-foreground"
                  data-testid="projectile-unavailable"
                >
                  Envio indisponível durante a votação. Aguarde o reveal para
                  interagir com a Sala.
                </p>
              ) : availableTargets.length === 0 ? (
                <p
                  className="text-sm text-muted-foreground"
                  data-testid="projectile-no-targets"
                >
                  Sem alvos por enquanto · chame o time para a Sala para
                  interagir.
                </p>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <label
                      htmlFor="projectile-target"
                      className="text-sm text-muted-foreground"
                    >
                      Alvo
                    </label>
                    <select
                      id="projectile-target"
                      data-testid="projectile-target"
                      value={effectiveTargetId ?? ""}
                      onChange={(event) => {
                        setProjectileTarget(event.target.value || null);
                        setProjectileError(null);
                      }}
                      className="h-8 rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
                    >
                      {availableTargets.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nick}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div
                    role="group"
                    aria-label={`Interações para ${effectiveTargetNick}`}
                    className="flex flex-wrap gap-2"
                  >
                    {PROJECTILE_CATALOG.map(({ type, label, emoji }) => (
                      <Button
                        key={type}
                        type="button"
                        variant="outline"
                        size="sm"
                        data-testid={`projectile-${type}`}
                        disabled={!isRevealed}
                        onClick={() => handleThrowProjectile(type)}
                        aria-label={`${label} em ${effectiveTargetNick}`}
                        title={
                          isProjectileCooling
                            ? `Recarregando · aguarde ${projectileCooldownSecs}s`
                            : `${label} em ${effectiveTargetNick}`
                        }
                      >
                        <span aria-hidden="true">{emoji}</span>
                        {label}
                      </Button>
                    ))}
                  </div>
                  {isProjectileCooling ? (
                    <p
                      className="text-xs text-muted-foreground"
                      data-testid="projectile-cooldown"
                      aria-live="polite"
                    >
                      Recarregando · aguarde {projectileCooldownSecs}s para
                      arremessar de novo.
                    </p>
                  ) : null}
                </>
              )}
              {projectileError ? (
                <Alert variant="error">
                  <AlertTitle>Não foi possível interagir</AlertTitle>
                  <AlertDescription data-testid="projectile-error">
                    {projectileError}
                  </AlertDescription>
                </Alert>
              ) : null}
              {projectileFeed.length > 0 ? (
                <ul
                  aria-live="polite"
                  aria-label="Interações recentes da Sala"
                  data-testid="projectile-feed"
                  className="flex flex-col gap-1.5"
                >
                  {projectileFeed.map((item) => (
                    <li
                      key={item.key}
                      data-testid="projectile-feed-item"
                      data-sender={item.senderPlayerId}
                      data-target={item.targetPlayerId}
                      data-outcome={item.outcome}
                      className="rounded-lg border bg-card px-3 py-2 text-sm"
                    >
                      {projectileFeedText(item)}
                    </li>
                  ))}
                </ul>
              ) : null}
            </CardPanel>
          </Card>
        </aside>
      </div>
    </div>
  );
}
