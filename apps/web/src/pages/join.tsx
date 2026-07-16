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
import {
	type FormEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ThemeToggle } from "../components/theme-toggle";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { ConnectionStatus } from "../components/ui/connection-status";
import { useToast } from "../components/ui/toast";
import { getNick, getUUID, setCode, setNick } from "../lib/storage";
import { useSalaStore } from "../store/sala";

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
		return { ok: false, error: "Use pelo menos 2 caracteres." };
	}
	if (v.length > NICK_MAX) {
		return { ok: false, error: "Use no máximo 20 caracteres." };
	}
	if (/ {2,}/.test(v)) {
		return { ok: false, error: "Evite espaços duplos no meio do nome." };
	}
	if (v !== v.trim()) {
		return { ok: false, error: "Remova espaços no início e no fim." };
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
		try {
			return getNick() ?? "";
		} catch {
			// sessionStorage indisponível (modo privado iOS / quota). Não crashar.
			return "";
		}
	});
	const [localCode, setLocalCode] = useState("");
	// IMPORTANT: validar o nick INICIAL — se ele veio pré-preenchido de
	// sessionStorage, ainda é string vazia "" e o botão fica desabilitado
	// mesmo com 5 chars válidos na tela. Sem isso o "Entrar" só destrava
	// após o usuário digitar (bug reportado em P1 do polish).
	const [validation, setValidation] = useState<NickValidation>(() =>
		validateNick(nick),
	);
	const [isConnecting, setIsConnecting] = useState(false);
	// TODO: remove on T38 — `connected` é falso-positive enquanto o WS não
	// fechou. Ver comentário P0 na handleSubmit.
	const [connectionState, setConnectionState] = useState<
		"idle" | "connecting" | "connected" | "error"
	>("idle");

	const showCodeInput = !code && !isHost;

	// Refs imperativos: codeInputRef para focus/select quando o código
	// submetido é mal-formado (UX padrão de formulários curtos).
	const codeInputRef = useRef<HTMLInputElement>(null);
	const nickInputRef = useRef<HTMLInputElement>(null);

	// -------------------------------------------------------------------------
	// Store hooks (apenas para aplicar welcome/error via reset)
	// -------------------------------------------------------------------------
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

	const handleCodeChange = useCallback((value: string) => {
		const clean = value
			.normalize("NFKD")
			.replace(/[^A-Za-z0-9]/g, "")
			.slice(0, 4)
			.toUpperCase();
		setLocalCode(clean);
	}, []);

	// Ref para o setTimeout de redirect — cancela no unmount pra evitar
	// setState em componente desmontado.
	const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	useEffect(() => {
		return () => {
			if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);
		};
	}, []);

	// Esc global: Escape volta pra landing. Não capturado durante submit
	// (isConnecting) pra não abortar mid-navigation.
	useEffect(() => {
		if (isConnecting) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				e.preventDefault();
				navigate("/");
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [isConnecting, navigate]);

	const handleSubmit = useCallback(
		async (e: FormEvent<HTMLFormElement>) => {
			e.preventDefault();
			const result = validateNick(nick);
			setValidation(result);
			if (!result.ok) return;

			const activeCode = code || localCode;
			const isCodeValid =
				isHost || (activeCode && /^[A-Z0-9]{4}$/.test(activeCode));
			if (!isCodeValid) {
				toast.push("Código da sala inválido.", "error");
				// UX padrão de forms curtos: traz o campo de volta pro foco
				// com o texto selecionado, pra usuário corrigir sem apagar.
				codeInputRef.current?.focus();
				codeInputRef.current?.select();
				return;
			}

			setIsConnecting(true);
			setConnectionState("connecting");

			// Gera/recupera UUID persistente (ADR-0009). T08: sessionStorage.
			// Será usado em T38 quando integrarmos com ws-client real.
			try {
				getUUID();
			} catch {
				// sessionStorage indisponível — seguimos sem UUID persistente;
				// usuário pode voltar a entrar, mas perderá o ID.
			}

			// Persiste nick na sessionStorage (UX: preenche se voltou na
			// mesma aba). Tab-close apaga automaticamente (ADR-006).
			try {
				setNick(result.value);
			} catch {
				// silencioso — nick é nice-to-have, não bloqueia entrada
			}
			// Só persiste o code se for bem-formado (4 alfanum, maiúsculas).
			// Defesa contra URL maliciosa tipo /join?code=<script>.
			if (activeCode && /^[A-Z0-9]{4}$/.test(activeCode)) {
				try {
					setCode(activeCode);
				} catch {
					/* idem */
				}
			}

			// Em produção: ws-client.connect() + ws.send({ type: 'hello', ... })
			// + listener pra 'welcome' / 'error' → store.setSala + setCurrentPlayerId
			// → navigate /arena?code=XXXX.
			//
			// Aqui (T28 stub): navegamos para arena sem WS. O ws-client real
			// é ativado pela arena em T38.
			//
			// P0 audit: NÃO emitir toast 'Bem-vindo' nem flash de
			// ConnectionStatus=connected antes da navegação — o WS ainda
			// não fechou; emitir success aqui é fake UX. // TODO: reabilitar
			// os toasts/indicadores em T38 quando o connect real responder.

			// Persistência mínima: nick ativo + code (host ou join)
			// - host=1: navega para /arena SEM code — server cria nova sala
			//   no `hello` (T13) e devolve `sala.code` no `welcome`.
			// - join com code: navega para /arena?code=XXXX — server faz
			//   `addPlayer` no `hello`.
			const target = isHost ? "/arena" : `/arena?code=${activeCode}`;
			redirectTimeoutRef.current = setTimeout(() => {
				// Cleanup: reseta connectionState para não vazar no destino.
				// TODO: remove on T38 — quando connect real responde
				// 'welcome'/'error' a partir do Arena, isso deixa de existir.
				setConnectionState("idle");
				navigate(target);
			}, 200);
		},
		[nick, code, localCode, isHost, toast, navigate],
	);

	const codeLabel = code || localCode || "—";
	// Em-dash acessível: leitores de tela anunciam "código pendente" em vez
	// de "traço" — copy intencional pro estado vazio.
	const codeDisplay =
		codeLabel === "—" ? <span aria-label="código pendente">—</span> : codeLabel;

	return (
		<div
			data-testid="page-join"
			className="surface-noise min-h-screen bg-bg text-ink flex flex-col"
		>
			{/* Header topbar — superfície sólida (sem glassmorphism). Tela de
			    formulário único não justifica sticky: o usuário percorre o card
			    inteiro dentro de uma viewport cabeçudo+rodapé, e o sticky só
			    comeria pixels verticais sem benefício. */}
			<header className="border-b border-ink/10 py-4 flex-shrink-0 bg-bg">
				<div className="max-w-[1360px] mx-auto px-4 sm:px-8 lg:px-16 flex items-center justify-between">
					<Link
						to="/"
						className="font-display font-extrabold text-nav-wordmark tracking-[-0.02em] flex items-baseline gap-2 hover:text-coral transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
						aria-label="Pointly — página inicial"
					>
						<span className="font-italic italic text-coral text-nav-mark">
							Ø
						</span>
						Pointly
					</Link>
					<div className="flex items-center gap-4">
						<ThemeToggle />
						<div className="font-sans text-caption text-ink-mute">Entrar</div>
					</div>
				</div>
			</header>

			{/* Header strip — só renderiza quando existe code de fato. */}
			{!isHost && code && (
				<div className="max-w-[1360px] mx-auto px-4 sm:px-8 lg:px-16 w-full py-3 sm:py-4 flex items-center justify-between text-caption text-ink-mute">
					<span>
						Sala{" "}
						<span
							className="font-mono text-body font-medium tracking-[0.08em] text-ink"
							data-testid="join-code-label"
						>
							{codeDisplay}
						</span>
					</span>
				</div>
			)}

			{/* Stage */}
			<main className="flex-1 flex items-center justify-center px-4 sm:px-8 lg:px-16 py-8 sm:py-12">
				<Card
					padding="lg"
					className="w-full max-w-[520px] flex flex-col gap-7 sm:gap-8"
					data-od-id="nick-card"
					data-testid="join-card"
				>
					{/* Ø glyph em 28px (text-brand-mark): fica ABAIXO do heading
					    (card-title 34px) — antes text-card-mark 36px deixava o
					    Ø visualmente MAIOR que o h1, invertendo a hierarquia. */}
					<div className="font-italic italic text-coral text-brand-mark">Ø</div>
					<h1 className="font-display font-extrabold text-card-title tracking-[-0.03em] text-balance">
						Entrar na sala<span className="text-coral-deep">.</span>
					</h1>

					<p className="max-w-[36ch] font-sans text-body leading-[1.55] text-ink-mute">
						Escolha como você quer aparecer para o time. Não precisa de conta.
					</p>

					{/* Status de conexão — só erro é informação útil durante o
					    stub T28. Connecting/connected ficam implícitos pelo
					    estado disabled + spinners dos controles (a11y: não
					    anunciar transições que ainda não confirmaram nada). */}
					{connectionState === "error" && (
						<div className="flex" role="alert">
							<ConnectionStatus
								variant="error"
								className="normal-case font-sans text-caption tracking-normal px-3 py-2"
							/>
						</div>
					)}

					<form
						onSubmit={handleSubmit}
						className="flex flex-col gap-1.5"
						autoComplete="off"
						data-testid="nick-form"
					>
						{showCodeInput && (
							<div
								className="flex flex-col gap-1.5 mb-3"
								data-testid="join-code-field"
							>
								<label
									htmlFor="code-input"
									className="font-sans font-medium text-caption text-ink"
								>
									Código da sala
								</label>
								<input
									id="code-input"
									ref={codeInputRef}
									type="text"
									maxLength={4}
									placeholder="ex. ABCD"
									value={localCode}
									onChange={(e) => handleCodeChange(e.target.value)}
									aria-describedby="code-input-hint"
									aria-invalid={
										!isHost &&
										showCodeInput &&
										localCode.length > 0 &&
										localCode.length !== 4
									}
									autoComplete="off"
									disabled={isConnecting}
									className="font-mono text-center text-body py-3.5 px-4 border border-ink/10 rounded-lg bg-paper-warm text-ink placeholder:text-caption placeholder:text-ink-faint focus:border-coral focus:outline-none focus-visible:ring-2 focus-visible:ring-coral-deep/40 transition-colors disabled:opacity-60 tracking-widest uppercase [&:-webkit-autofill]:bg-paper-warm [&:-webkit-autofill]:[-webkit-text-fill-color:var(--fg)] [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0_1000px_var(--paper-warm)_inset]"
									data-testid="join-code-input"
								/>
								<p
									id="code-input-hint"
									className="font-sans text-caption text-ink-mute leading-[1.55]"
								>
									Peça o código de 4 letras para quem criou a sala.
								</p>
							</div>
						)}

						<fieldset className="contents m-0 min-w-0 p-0 border-0">
							<legend className="sr-only">Como você quer ser chamado</legend>
							<label htmlFor="nick-input" className="sr-only">
								Como você quer ser chamado
							</label>
							<input
								id="nick-input"
								ref={nickInputRef}
								type="text"
								maxLength={NICK_MAX}
								placeholder="ex. Luna"
								value={nick}
								onChange={(e) => handleNickChange(e.target.value)}
								autoComplete="nickname"
								aria-invalid={!validation.ok && validation.error !== ""}
								aria-describedby={
									!validation.ok && validation.error
										? "nick-error"
										: "nick-hint"
								}
								disabled={isConnecting}
								className="font-sans text-body py-3.5 px-4 border border-ink/10 rounded-lg bg-paper-warm text-ink placeholder:text-caption placeholder:text-ink-faint focus:border-coral focus:outline-none focus-visible:ring-2 focus-visible:ring-coral-deep/40 transition-colors disabled:opacity-60 aria-[invalid=true]:border-coral-deep [&:-webkit-autofill]:bg-paper-warm [&:-webkit-autofill]:[-webkit-text-fill-color:var(--fg)] [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0_1000px_var(--paper-warm)_inset]"
								data-testid="nick-input"
							/>
							<div
								id="nick-error"
								role={!validation.ok && validation.error ? "alert" : undefined}
								aria-live="polite"
								className="font-sans text-caption text-coral-deep min-h-[22px] tracking-normal"
								data-testid="nick-error"
							>
								{!validation.ok && validation.error ? validation.error : ""}
							</div>
							<div
								id="nick-hint"
								className="font-sans text-caption text-ink-mute leading-[1.55] flex flex-wrap items-center justify-between gap-x-3 gap-y-1"
							>
								<span>De 2 a 20 caracteres · como você quer ser chamado</span>
								{validation.ok && (
									<span
										aria-hidden="true"
										className="text-olive font-medium tabular-nums inline-flex items-center gap-1"
									>
										<span className="leading-none">✓</span>
										{nick.length}/{NICK_MAX}
									</span>
								)}
							</div>
						</fieldset>

						<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-1.5">
							<Button
								type="submit"
								variant="coral"
								size="lg"
								disabled={
									!validation.ok ||
									isConnecting ||
									(showCodeInput && localCode.length !== 4)
								}
								aria-busy={isConnecting}
								className="w-full sm:w-auto"
								data-testid="join-submit"
							>
								{isConnecting ? "Conectando…" : "Entrar"}
								{!isConnecting && <span aria-hidden="true">↗</span>}
							</Button>
							<Button
								type="button"
								variant="default"
								size="lg"
								onClick={() => navigate("/")}
								className="w-full sm:w-auto"
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
