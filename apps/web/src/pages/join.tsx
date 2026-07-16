/**
 * Join page — T28 (Phase 6) + sala-existence pre-check (validate-room-existence).
 *
 * Tela de entrada com prompt de apelido. Editorial-lite:
 *  - Topbar metadata strip
 *  - FIG. 02 · ENTRAR (mono ink-faint)
 *  - Card central bone-fill: mark Ø + headline + input nick + botão coral
 *
 * **Flow**:
 *  1. User digita nick (2-20 chars, sem espaços duplos, sem ponta)
 *  2. Click 'Entrar' → pre-check `GET /api/v1/salas/:code` (somente em join com code).
 *     - 200 → navega para `/arena?code=XXXX` (ws-client real abre WS e envia hello).
 *     - 404 → inline error perto do code input; NÃO navega.
 *     - 5xx / network → fall through: navega (defesa em profundidade via WS hello).
 *  3. (Host=1) pula o pre-check — server gera code no `hello`.
 *  4. ws.send({ type: 'hello', payload: { uuid, nick, code } })
 *  5. Server responde welcome → store.setCurrentPlayerId + setSala
 *  6. Redirect /arena?code=XXXX (T38 wire)
 *  7. error { code: 'sala_cheia' } → redirect /full
 *  8. error { code: 'sala_nao_encontrada' } (race após pre-check) → toast retry
 *
 * **UUID strategy** (ADR-0009): gerado client-side via `crypto.randomUUID()`,
 * persistido em localStorage para suportar reconnect (T37).
 *
 * **A11y**: input com label associado, aria-invalid em erro, aria-live em
 * status (conexão), error com role='alert'.
 *
 * @see .specs/features/validate-room-existence/spec.md
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

/**
 * Estado do pre-check de existência da sala (validate-room-existence).
 *  - 'idle'         : estado inicial / após o usuário editar o code
 *  - 'checking'     : fetch em voo (submit desabilitado, label "Verificando…")
 *  - 'not-found'    : server respondeu 404 → erro inline, sem navegação
 *  - 'ok'           : 200 (ou fallback) → navegação prossegue
 *
 * Mantido fora do store porque é puramente UI local e some quando o
 * componente desmonta (sala-end-loop ou navigate). Sem valor de
 * rehidratação entre páginas.
 */
export type SalaCheckState = "idle" | "checking" | "not-found" | "ok";

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
	// Estado do pre-check de existência da sala (validate-room-existence).
	// 'idle' = ainda não checou / usuário editou o code; 'checking' = fetch em voo;
	// 'not-found' = 404 → erro inline; 'ok' = 200 (ou fallback) → navega.
	const [salaCheck, setSalaCheck] = useState<SalaCheckState>("idle");

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

	// A11y (FMR UX-polish C2): foco automático no campo certo no mount.
	// - Se o code veio via URL (?code=XXXX), o usuário só precisa digitar
	//   o nick → foca no nickInputRef.
	// - Se o code precisa ser digitado (showCodeInput=true), foca no
	//   codeInputRef.
	// - Se o nick já está pré-preenchido de sessionStorage (não vazio),
	//   mantém foco no body — usuário provavelmente só quer revisar.
	useEffect(() => {
		// Skip em prefers-reduced-motion NÃO se aplica aqui — foco é
		// diferente de animação. Mas respeitamos timing: defer pra próximo
		// frame pra não brigar com autoFocus do browser.
		const id = requestAnimationFrame(() => {
			if (showCodeInput && !code) {
				codeInputRef.current?.focus();
			} else if (!nick) {
				nickInputRef.current?.focus();
			}
		});
		return () => cancelAnimationFrame(id);
	}, [showCodeInput, code, nick]);

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
		// Editar o code limpa o erro de "sala não encontrada" — UX padrão
		// de forms curtos: enquanto o usuário digita, o erro anterior morre.
		// Não limpamos em `not-found` apenas para o caso dele apagar tudo e
		// re-digitar; qualquer edit conta como tentativa nova.
		if (salaCheck !== "idle") setSalaCheck("idle");
	}, [salaCheck]);

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

	// FMR-02: keyboard avoidance via visualViewport.
	// iOS Safari encolhe window.innerHeight quando teclado sobe, mas
	// melhor usar `visualViewport.height` que é o "true visible" — algumas
	// versões do iOS não atualizam window.innerHeight imediatamente.
	// Quando shrink detectado, setamos `--keyboard-inset` que aumenta o
	// padding-bottom do stage e mantém o CTA "Entrar" visível.
	useEffect(() => {
		if (typeof window === "undefined" || !window.visualViewport) return;
		const vv = window.visualViewport;
		const root = document.documentElement;
		const update = () => {
			const diff = window.innerHeight - vv.height;
			root.style.setProperty(
				"--keyboard-inset",
				`${Math.max(0, diff)}px`,
			);
		};
		update();
		vv.addEventListener("resize", update);
		vv.addEventListener("scroll", update);
		return () => {
			vv.removeEventListener("resize", update);
			vv.removeEventListener("scroll", update);
			root.style.setProperty("--keyboard-inset", "0px");
		};
	}, []);

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

			// -----------------------------------------------------------------
			// Pre-check de existência (validate-room-existence):
			// Só roda quando o usuário está ENTRANDO em sala existente.
			// Host=1 cria sala nova → server gera code no hello → pulamos.
			// -----------------------------------------------------------------
			if (!isHost && activeCode) {
				setSalaCheck("checking");
				setIsConnecting(true);
				setConnectionState("connecting");
				try {
					const resp = await fetch(`/api/v1/salas/${activeCode}`);
					if (resp.status === 404) {
						// Bloqueia navegação e mostra erro inline no code input.
						// Foco + select no campo pra editar sem apagar (mesmo
						// padrão do "código inválido").
						setSalaCheck("not-found");
						setIsConnecting(false);
						setConnectionState("idle");
						codeInputRef.current?.focus();
						codeInputRef.current?.select();
						return;
					}
					// 200 ou qualquer outro status (5xx, etc) → fall through
					// pra navega. WS `hello` é a defesa em profundidade: se a
					// sala sumiu entre o GET e o hello, sala-end-loop mostra
					// toast 'sala_nao_encontrada'.
					setSalaCheck("ok");
				} catch {
					// Rede caiu, CORS, etc — não bloqueia o usuário. Segue
					// pra arena; o WS vai lidar com a verdade.
					setSalaCheck("ok");
				}
			} else {
				// Host=1: pulou o pre-check.
				setIsConnecting(true);
				setConnectionState("connecting");
			}

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
			className="surface-noise min-h-[100dvh] bg-bg text-ink flex flex-col"
		>
			{/* Header topbar — superfície sólida (sem glassmorphism). Tela de
			    formulário único não justifica sticky: o usuário percorre o card
			    inteiro dentro de uma viewport cabeçudo+rodapé, e o sticky só
			    comeria pixels verticais sem benefício.
			    pt com safe-area-inset-top respeita notch iOS. */}
			<header className="border-b border-ink/10 py-4 flex-shrink-0 bg-bg pt-[max(env(safe-area-inset-top),1rem)]">
				<div className="max-w-[1360px] mx-auto px-4 sm:px-8 lg:px-16 flex items-center justify-between">
					<Link
						to="/"
						className="font-display font-extrabold text-nav-wordmark tracking-[-0.02em] flex items-baseline gap-2 hover:text-coral-deep transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-deep focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
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

			{/* Header strip — só renderiza quando existe code de fato.
			    Helper copy à direita ("Do link compartilhado pelo host") explica
			    a origem do código: o usuário abriu esta tela a partir de um link
			    /join?code=ABCD que veio do criador da sala. Sem esse caption o
			    número parece aleatório e o usuário hesita antes de digitar o nick
			    (a "parede do Jordan"). Text-ink-faint pra hierarquia secundária.

			    host=1 intencionalmente NÃO renderiza strip nem input: o servidor
			    gera o código no `hello`. Mostrar uma nota "você vai criar uma sala"
			    duplicaria a affordance do botão CTA (que já diz "Entrar") —
			    colapso decidido a favor do CTA único (Single CTA Rule). */}
			{!isHost && code && (
				<div className="max-w-[1360px] mx-auto px-4 sm:px-8 lg:px-16 w-full py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 text-caption text-ink-mute">
					<span>
						Sala{" "}
						{/* tracking 0 — text-body não tem tracking próprio. Code label
						    é tipograficamente "dado", não "tag mono upper"; o font-mono
						    já entrega a identidade de código sem precisar do tracking
						    apertado (que era off-ramp: arbitrary value). */}
						<span
							className="font-mono text-body font-medium text-ink"
							data-testid="join-code-label"
						>
							{codeDisplay}
						</span>
					</span>
					<span className="text-ink-faint">Do link compartilhado pelo host.</span>
				</div>
			)}

			{/* Stage
			 * FMR-01/02: min-h dinâmico via 100dvh (lida com barra URL iOS),
			 * padding-bottom com env(safe-area-inset-bottom) p/ home indicator. */}
			<main className="flex-1 flex items-center justify-center px-4 sm:px-8 lg:px-16 py-8 sm:py-12 pb-[max(env(safe-area-inset-bottom),2rem)]">
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

					{/* leading do token text-body (1.5) — leading-[1.55] era
					    off-ramp arbitrary value. O ganho era marginal e não justifica
					    quebrar a Ramp Rule (§3 DESIGN.md). */}
					<p className="max-w-[36ch] font-sans text-body text-ink-mute">
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
									aria-describedby={
										salaCheck === "not-found"
											? "code-input-error"
											: "code-input-hint"
									}
									aria-invalid={
										(!isHost &&
											showCodeInput &&
											localCode.length > 0 &&
											localCode.length !== 4) ||
										salaCheck === "not-found"
									}
									disabled={isConnecting}
									className="font-mono text-center text-body py-3.5 px-4 border border-ink/10 rounded-lg bg-paper-warm text-ink placeholder:text-caption placeholder:text-ink-faint focus:border-coral-deep focus:outline-none focus-visible:ring-2 focus-visible:ring-coral-deep focus-visible:ring-offset-1 focus-visible:ring-offset-bg transition-colors disabled:opacity-60 tracking-widest uppercase aria-[invalid=true]:border-coral-deep [&:-webkit-autofill]:bg-paper-warm [&:-webkit-autofill]:[-webkit-text-fill-color:var(--fg)] [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0_1000px_var(--paper-warm)_inset]"
									data-testid="join-code-input"
								/>
								{salaCheck === "not-found" ? (
									<p
										id="code-input-error"
										role="alert"
										data-testid="join-code-error"
										className="font-sans text-caption text-coral-deep"
									>
										Sala não encontrada. Confira o código.
									</p>
								) : (
									<p
										id="code-input-hint"
										className="font-sans text-caption text-ink-mute"
									>
										4 letras ou números · peça ao host que criou a sala.
									</p>
								)}
							</div>
						)}

						{/* Erro de "sala não encontrada" para o caso ?code=XXXX na URL.
						    Quando o code vem digitado pelo usuário (showCodeInput=true),
						    o erro já aparece logo abaixo do input acima. Quando o code
						    vem via querystring, o input não existe — então o erro é
						    renderizado aqui, no nível do form, com a mesma copy e
						    role='alert' pra feedback acessível. A11y: aria-describedby
						    do botão submit aponta pra cá também (futuro). */}
						{!showCodeInput && salaCheck === "not-found" && (
							<p
								role="alert"
								data-testid="join-code-error"
								className="font-sans text-caption text-coral-deep -mt-1"
							>
								Sala não encontrada. Confira o código.
							</p>
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
								className="font-sans text-body py-3.5 px-4 border border-ink/10 rounded-lg bg-paper-warm text-ink placeholder:text-caption placeholder:text-ink-faint focus:border-coral-deep focus:outline-none focus-visible:ring-2 focus-visible:ring-coral-deep focus-visible:ring-offset-1 focus-visible:ring-offset-bg transition-colors disabled:opacity-60 aria-[invalid=true]:border-coral-deep [&:-webkit-autofill]:bg-paper-warm [&:-webkit-autofill]:[-webkit-text-fill-color:var(--fg)] [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0_1000px_var(--paper-warm)_inset]"
								data-testid="nick-input"
							/>
							{/* min-h-[22px] = 1 linha de `text-caption` (14px × 1.55
							    = 21.7px). Reserva o slot pra evitar layout shift quando
							    o erro aparece/some. Não está na ramp de typography
							    porque é layout (height), não font-size. */}
							<div
								id="nick-error"
								role={!validation.ok && validation.error ? "alert" : undefined}
								aria-live={!validation.ok && validation.error ? "assertive" : undefined}
								className="font-sans text-caption text-coral-deep min-h-[22px] tracking-normal"
								data-testid="nick-error"
							>
								{!validation.ok && validation.error ? validation.error : ""}
							</div>
							<div
								id="nick-hint"
								className="font-sans text-caption text-ink-mute flex flex-wrap items-center justify-between gap-x-3 gap-y-1"
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
									salaCheck === "checking" ||
									(showCodeInput && localCode.length !== 4)
								}
								aria-busy={isConnecting || salaCheck === "checking"}
								className="w-full sm:w-auto"
								data-testid="join-submit"
							>
								{salaCheck === "checking"
									? "Verificando…"
									: isConnecting
										? "Conectando…"
										: "Entrar"}
								{!isConnecting && salaCheck !== "checking" && (
									<span aria-hidden="true">↗</span>
								)}
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
