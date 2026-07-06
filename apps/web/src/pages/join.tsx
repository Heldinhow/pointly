/**
 * Join page — T28 (Phase 6).
 *
 * Tela de entrada com prompt de apelido. Editorial-lite:
 *  - Topbar metadata strip
 *  - FIG. 02 · ENTRAR (mono ink-faint)
 *  - Card central bone-fill: mark Ø + headline + input nick + botão coral
 *
 * **Flow**:
 *  1. User digita nick (2-20 chars, sem espaços duplos, sem ponta)
 *  2. Click 'Entrar' → ws.send({ type: 'hello', payload: { uuid, nick, code } })
 *  3. Server responde welcome → store.setCurrentPlayerId + setSala
 *  4. Redirect /arena?code=XXXX (T38 wire)
 *  5. error { code: 'sala_cheia' } → redirect /full
 *  6. error { code: 'sala_nao_encontrada' } → toast retry
 *
 * **UUID strategy** (ADR-0009): gerado client-side via `crypto.randomUUID()`,
 * persistido em localStorage para suportar reconnect (T37).
 *
 * **A11y**: input com label associado, aria-invalid em erro, aria-live em
 * status (conexão), error com role='alert'.
 *
 * @see .specs/features/planning-poker-v1/tasks.md T28
 * @see .specs/features/planning-poker-v1/spec.md F-001, F-002, F-008
 */
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { ConnectionStatus } from "../components/ui/connection-status";
import { useToast } from "../components/ui/toast";
import { useSalaStore } from "../store/sala";
import { getNick, getUUID, setCode, setNick } from "../lib/storage";

const NICK_MIN = 2;
const NICK_MAX = 20;

/** Resultado de validação do apelido. */
export type NickValidation =
	| { ok: true; value: string }
	| { ok: false; error: string };

/** Função pura exportada para uso em testes unitários (T28 done-when). */
export function validateNick(input: string): NickValidation {
	const v = input;
	if (v.length === 0) {
		return { ok: false, error: "" }; // empty: no error yet (UX)
	}
	if (v.length < NICK_MIN) {
		return { ok: false, error: "Mínimo 2 caracteres." };
	}
	if (v.length > NICK_MAX) {
		return { ok: false, error: "Máximo 20 caracteres." };
	}
	if (/ {2,}/.test(v)) {
		return { ok: false, error: "Sem espaços duplos." };
	}
	if (v !== v.trim()) {
		return { ok: false, error: "Sem espaços no início ou fim." };
	}
	return { ok: true, value: v };
}

export function Join() {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const toast = useToast();

	/** Code da sala (querystring). Vazio = vai criar nova sala. */
	const code = (searchParams.get("code") || "").toUpperCase();
	/** Flag `host=1` indica que veio do 'Criar sala' (server gera code). */
	const isHost = searchParams.get("host") === "1";

	// -------------------------------------------------------------------------
	// State local
	// -------------------------------------------------------------------------
	const [nick, setNickState] = useState<string>(() => {
		// T08: nick pré-preenchido vem de sessionStorage (privacidade-by-default).
		return getNick() ?? "";
	});
	const [validation, setValidation] = useState<NickValidation>({
		ok: false,
		error: "",
	});
	const [isConnecting, setIsConnecting] = useState(false);
	const [connectionState, setConnectionState] = useState<
		"idle" | "connecting" | "connected" | "error"
	>("idle");

	// -------------------------------------------------------------------------
	// Store hooks (apenas para aplicar welcome/error via setSalaEnded)
	// -------------------------------------------------------------------------
	const setSalaEnded = useSalaStore((s) => s.setSalaEnded);
	const reset = useSalaStore((s) => s.reset);

	// Limpa store no mount (caso esteja entrando de outra sala)
	useEffect(() => {
		reset();
	}, [reset]);

	// -------------------------------------------------------------------------
	// Handlers
	// -------------------------------------------------------------------------
	const handleNickChange = useCallback((value: string) => {
		setNickState(value);
		setValidation(validateNick(value));
	}, []);

	const handleSubmit = useCallback(
		async (e: FormEvent<HTMLFormElement>) => {
			e.preventDefault();
			const result = validateNick(nick);
			setValidation(result);
			if (!result.ok) return;

			setIsConnecting(true);
			setConnectionState("connecting");

			// Gera/recupera UUID persistente (ADR-0009). T08: sessionStorage.
			// Será usado em T38 quando integrarmos com ws-client real.
			getUUID();

			// Persiste nick + code na sessionStorage (UX: preenche se voltou
			// na mesma aba). Tab-close apaga automaticamente (ADR-006).
			setNick(result.value);
			if (code) setCode(code);

			toast.push(`Bem-vindo, ${result.value}.`, "success");

			// Em produção: ws-client.connect() + ws.send({ type: 'hello', ... })
			// + listener pra 'welcome' / 'error' → store.setSala + setCurrentPlayerId
			// → navigate /arena?code=XXXX.
			//
			// Aqui (T28 stub): navegamos para arena sem WS. O ws-client real
			// é ativado pela arena em T38.
			setConnectionState("connected");

			// Persistência mínima: nick ativo + code (host ou join)
			// - host=1: navega para /arena SEM code — server cria nova sala
			//   no `hello` (T13) e devolve `sala.code` no `welcome`.
			// - join com code: navega para /arena?code=XXXX — server faz
			//   `addPlayer` no `hello`.
			const target = code ? `/arena?code=${code}` : "/arena";
			setTimeout(() => {
				navigate(target);
			}, 200);
		},
		[nick, code, toast, navigate, setSalaEnded],
	);

	const codeLabel = code || "—";
	const showHostNote = isHost;

	return (
		<div
			data-testid="page-join"
			className="surface-noise min-h-screen bg-bg text-ink flex flex-col"
		>
			{/* Header topbar */}
			<header className="border-b border-ink/10 py-4 flex-shrink-0 bg-bg/95 backdrop-blur-sm sticky top-0 z-10">
				<div className="max-w-[1360px] mx-auto px-16 flex items-center justify-between">
					<Link
						to="/"
						className="font-display font-extrabold text-[18px] tracking-[-0.02em] flex items-baseline gap-2 hover:text-coral transition-colors"
						aria-label="Pointly — página inicial"
					>
						<span className="font-italic italic text-coral text-[22px] leading-none">
							Ø
						</span>
						Pointly
					</Link>
					<div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
						Entrar
					</div>
				</div>
			</header>

			{/* Header strip */}
			<div className="max-w-[1360px] mx-auto px-16 w-full py-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-ink-faint">
				<span>
					Sala:{" "}
					<span className="text-ink font-medium" data-testid="join-code-label">
						{isHost && !code ? "será gerada ao entrar" : codeLabel}
					</span>
				</span>
			</div>

			{/* Stage */}
			<main className="flex-1 flex items-center justify-center px-16 py-10">
				<Card
					padding="lg"
					className="w-[520px] flex flex-col gap-5"
					data-od-id="nick-card"
					data-testid="join-card"
				>
					<div className="font-italic italic text-coral text-[36px] leading-none">
						Ø
					</div>
					<h1 className="font-display font-extrabold text-[34px] leading-[1.05] tracking-tight">
						Seu nome na sala<span className="text-coral">.</span>
					</h1>

					<p
						id="nick-help"
						className="font-sans text-[14px] leading-[1.55] text-ink-mute"
					>
						Apelido visível para os outros jogadores na mesa. Sem conta, sem
						email — só como você quer ser chamado nesta rodada.
					</p>

					{showHostNote && (
						<div
							data-testid="host-note"
							className="font-mono text-[11px] tracking-[0.04em] text-ink-faint uppercase py-2.5 px-3.5 border border-ink/5 rounded-lg bg-paper-warm"
						>
							Você está criando esta sala.
						</div>
					)}

					{/* Status de conexão */}
					{connectionState !== "idle" && (
						<div className="flex">
							<ConnectionStatus
								variant={
									connectionState === "error"
										? "error"
										: connectionState === "connected"
											? "connected"
											: "loading"
								}
							/>
						</div>
					)}

					<form
						onSubmit={handleSubmit}
						className="flex flex-col gap-1.5"
						autoComplete="off"
						data-testid="nick-form"
					>
						<label
							htmlFor="nick-input"
							className="font-display font-semibold text-[11px] tracking-[0.22em] uppercase text-ink-faint"
						>
							Apelido
						</label>
						<input
							id="nick-input"
							type="text"
							maxLength={NICK_MAX}
							placeholder="ex. Helder"
							value={nick}
							onChange={(e) => handleNickChange(e.target.value)}
							autoComplete="off"
							aria-invalid={!validation.ok && validation.error !== ""}
							aria-describedby={
								[
									"nick-help",
									!validation.ok && validation.error ? "nick-error" : "",
								]
									.filter(Boolean)
									.join(" ") || undefined
							}
							disabled={isConnecting}
							className="font-sans text-[16px] py-3.5 px-4 border border-ink/10 rounded-lg bg-paper text-ink placeholder:text-ink-faint focus:border-coral focus:outline-none transition-colors disabled:opacity-60"
							data-testid="nick-input"
						/>
						<div
							id="nick-error"
							role="alert"
							className="font-mono text-[11px] text-coral min-h-[14px] tracking-[0.02em]"
							data-testid="nick-error"
						>
							{!validation.ok ? validation.error : ""}
						</div>

						<div className="flex items-center gap-3 mt-1.5">
							<Button
								type="submit"
								variant="coral"
								size="md"
								disabled={!validation.ok || isConnecting}
								data-testid="join-submit"
							>
								{isConnecting ? "Conectando…" : "Entrar"}
								{!isConnecting && <span aria-hidden="true">↗</span>}
							</Button>
							<Button
								type="button"
								variant="default"
								size="md"
								onClick={() => navigate("/")}
								data-testid="join-back"
							>
								Voltar
							</Button>
						</div>
					</form>
				</Card>
			</main>
		</div>
	);
}
