/**
 * Join — entrada/criação de sala.
 *
 * Modos vindos da querystring:
 *  - `?host=1`  → create  (só nick; server gera o código no hello)
 *  - `?code=` válido → invite (nick + código travado do link)
 *  - senão      → manual (nick + input de código)
 *
 * Fluxo de submit: valida nick → valida código (host pula) → convidados
 * fazem pre-check `GET /api/v1/salas/:code` (200 navega; 404 erro inline
 * sem navegar; rede/5xx toasta mas navega) → persiste uuid/nick/code →
 * navega com 200ms de delay (timeout limpo no unmount).
 *
 * Visual segue a landing: mesma base dark, header, botões, passos e footer.
 * A lógica e os testids são os mesmos de antes.
 */
import {
	useCallback,
	useEffect,
	useRef,
	useState,
	type FormEvent,
} from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { CopyButton } from "@/components/spell/copy-button";
import { Spinner } from "@/components/spell/spinner";
import { toast } from "@/components/feedback/toast";
import {
	API_BASE,
	NICK_MAX,
	getOrCreateUUID,
	isValidCode,
	normalizeCode,
	getNick as readNick,
	setCode as saveCode,
	setNick as saveNick,
	validateNick,
} from "@/lib/identity";
import { useTheme } from "@/theme/theme";

type JoinMode = "create" | "invite" | "manual";

const MODE_LABEL: Record<JoinMode, string> = {
	create: "Nova sala",
	invite: "Convite",
	manual: "Entrar",
};

const STEPS = [
	{ title: "Crie", body: "Abra uma sala e compartilhe o código com o time." },
	{ title: "Vote", body: "Cada pessoa escolhe uma carta em segredo." },
	{ title: "Revele", body: "Revelem juntos e conversem sobre as diferenças." },
] as const;

const CONTROL = "inline-flex min-h-12 items-center justify-center rounded-lg px-5 text-sm font-medium focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090b] motion-safe:transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40";
const INPUT = "h-12 w-full rounded-lg border border-zinc-700 bg-[#17171b] px-4 text-base placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090b] disabled:opacity-60 [html.light_&]:border-zinc-300 [html.light_&]:bg-white [html.light_&]:placeholder:text-zinc-500";

export function Join() {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const { theme, toggle } = useTheme();

	const isHost = searchParams.get("host") === "1";
	const urlCode = normalizeCode(searchParams.get("code") ?? "");
	const inviteCode = isValidCode(urlCode) ? urlCode : null;
	const mode: JoinMode = isHost ? "create" : inviteCode ? "invite" : "manual";

	const [nick, setNickValue] = useState<string>(() => readNick() ?? "");
	const [localCode, setLocalCode] = useState<string>(() => urlCode);
	const [nickError, setNickError] = useState<string | null>(() =>
		validateNick(readNick() ?? ""),
	);
	const [codeError, setCodeError] = useState<string | null>(null);
	const [checking, setChecking] = useState(false);
	// invite vira editável quando o pre-check dá 404 (revela o input).
	const [codeEditable, setCodeEditable] = useState(false);

	const nickRef = useRef<HTMLInputElement>(null);
	const codeRef = useRef<HTMLInputElement>(null);
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	// Dedupe: click no type="submit" dispara onClick + submit nativo no
	// mesmo tick; o ref barra a segunda chamada. Resetado nos caminhos
	// que permanecem na página (validação/404) para permitir retry.
	const submittedRef = useRef(false);

	const codeInputVisible = !isHost && (mode !== "invite" || codeEditable);

	// Autofoco: nick vazio → nick; nick pré-preenchido → código (manual).
	useEffect(() => {
		const prefilled = (readNick() ?? "").length > 0;
		if (prefilled && !isHost && mode !== "invite") {
			codeRef.current?.focus();
		} else {
			nickRef.current?.focus();
		}
	}, [isHost, mode]);

	// 404 / código inválido → foco + seleção no campo de código.
	useEffect(() => {
		if (codeError && codeInputVisible) {
			codeRef.current?.focus();
			codeRef.current?.select();
		}
	}, [codeError, codeInputVisible]);

	// Timeout de navegação limpo no unmount.
	useEffect(() => {
		return () => {
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
		};
	}, []);

	// Escape volta para a landing (fora do voo de verificação).
	useEffect(() => {
		if (checking) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				e.preventDefault();
				navigate("/");
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [checking, navigate]);

	const handleNickChange = useCallback((value: string) => {
		setNickValue(value);
		setNickError(validateNick(value));
	}, []);

	const handleCodeChange = useCallback((value: string) => {
		setLocalCode(normalizeCode(value));
		// Editar o código limpa o erro anterior (padrão de forms curtos).
		// React faz bail-out quando o valor é igual — sem render extra.
		setCodeError(null);
	}, []);

	// Fallback do CopyButton do convite quando não há Clipboard API:
	// copia via textarea + execCommand (mesmo padrão do share-pill).
	const handleInviteCopyFallback = useCallback(() => {
		const clipboard =
			typeof navigator !== "undefined"
				? (navigator.clipboard as unknown as
						| { writeText?: (text: string) => Promise<void> }
						| undefined)
				: undefined;
		if (clipboard?.writeText) return;
		if (!inviteCode) return;
		try {
			const ta = document.createElement("textarea");
			ta.value = inviteCode;
			ta.style.position = "fixed";
			ta.style.opacity = "0";
			document.body.appendChild(ta);
			ta.select();
			document.execCommand("copy");
			document.body.removeChild(ta);
		} catch {
			// sem feedback falso
		}
	}, [inviteCode]);

	const doSubmit = useCallback(async () => {
		if (submittedRef.current || checking) return;

		const nickErr = validateNick(nick);
		setNickError(nickErr);
		if (nickErr) {
			nickRef.current?.focus();
			return;
		}

		// Host cria sala nova — pula validação e pre-check de código.
		if (isHost) {
			submittedRef.current = true;
			setChecking(true);
			getOrCreateUUID();
			saveNick(nick);
			timeoutRef.current = setTimeout(() => navigate("/arena"), 200);
			return;
		}

		const activeCode =
			inviteCode && !codeEditable ? inviteCode : localCode;
		if (!isValidCode(activeCode)) {
			setCodeError("Código inválido. Use 4 letras ou números.");
			return;
		}

		submittedRef.current = true;
		setChecking(true);
		setCodeError(null);

		try {
			const resp = await fetch(`${API_BASE}/salas/${activeCode}`);
			if (resp.status === 404) {
				submittedRef.current = false;
				setChecking(false);
				setCodeError("Sala não encontrada. Confira o código.");
				if (inviteCode) setCodeEditable(true);
				return;
			}
			if (!resp.ok) {
				toast("Não foi possível confirmar a sala. Tentando entrar mesmo assim.", {
					variant: "error",
				});
			}
		} catch {
			toast("Sem conexão para verificar a sala. Tentando entrar mesmo assim.", {
				variant: "error",
			});
		}

		getOrCreateUUID();
		saveNick(nick);
		saveCode(activeCode);
		timeoutRef.current = setTimeout(
			() => navigate(`/arena?code=${activeCode}`),
			200,
		);
	}, [nick, isHost, inviteCode, codeEditable, localCode, checking, navigate]);

	const handleFormSubmit = useCallback(
		(e: FormEvent<HTMLFormElement>) => {
			e.preventDefault();
			void doSubmit();
		},
		[doSubmit],
	);

	const submitDisabled =
		nick.length === 0 || nickError !== null || checking;
	const submitLabel =
		mode === "create" ? "Criar sala" : "Entrar na sala";

	return (
		<div
			data-testid="page-join"
			className="flex min-h-dvh flex-col bg-[#09090b] font-sans text-zinc-100 [html.light_&]:bg-[#f5f5f5] [html.light_&]:text-zinc-900"
		>
			<header className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
				<Link
					to="/"
					aria-label="Pointly — página inicial"
					className="flex items-center gap-2.5 rounded-md font-mono text-sm font-semibold tracking-[0.08em] uppercase focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090b]"
				>
					<span aria-hidden="true" className="grid grid-cols-2 gap-[3px]">
						<span className="h-2 w-2 rounded-[3px] bg-current" />
						<span className="h-2 w-2 rounded-[3px] bg-current" />
						<span className="h-2 w-2 rounded-[3px] bg-current" />
						<span className="h-2 w-2 rounded-[3px] bg-emerald-400" />
					</span>
					Pointly
				</Link>
				<nav className="flex items-center gap-2" aria-label="navegação principal">
					<button
						type="button"
						data-testid="theme-toggle"
						onClick={toggle}
						aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
						title={theme === "dark" ? "Tema claro" : "Tema escuro"}
						className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-800 text-zinc-300 [html.light_&]:border-zinc-300 [html.light_&]:text-zinc-600"
					>
						{theme === "dark" ? (
							<Sun aria-hidden="true" className="h-5 w-5" />
						) : (
							<Moon aria-hidden="true" className="h-5 w-5" />
						)}
					</button>
				</nav>
			</header>

			<main className="mx-auto w-full max-w-6xl flex-1 px-5 pt-10 pb-12 sm:px-8 sm:pt-16">
				<div className="grid items-start gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
					<div className="min-w-0 lg:pt-8">
						<p className="font-mono text-xs tracking-[0.18em] text-zinc-500 uppercase">
							{MODE_LABEL[mode]}
						</p>
						<h1 className="mt-3 max-w-[15ch] text-4xl font-medium tracking-tight text-balance sm:text-5xl">
							{mode === "create"
								? "Crie sua sala"
								: mode === "invite"
									? "Você foi convidado!"
									: "Entrar na sala"}
						</h1>
						<p className="mt-4 max-w-[40ch] text-base leading-relaxed text-zinc-400 [html.light_&]:text-zinc-600">
							{mode === "create"
								? "Escolha seu nome — o código da sala é gerado na hora para convidar o time."
								: mode === "invite"
									? "Escolha como você quer aparecer para o time."
									: "Informe o código da sala e escolha seu nome para entrar."}
						</p>

						{mode === "invite" && !codeEditable && inviteCode && (
							<div className="mt-6 flex items-center gap-3 border-y border-[#26262c] py-4 [html.light_&]:border-zinc-300">
								<span className="font-mono text-xs tracking-[0.18em] text-zinc-500 uppercase">
									Sala
								</span>
								<strong
									data-testid="join-code-display"
									className="font-mono text-lg font-semibold tracking-[0.12em]"
								>
									{inviteCode}
								</strong>
								<span className="ml-auto">
									<CopyButton
										value={inviteCode}
										onClick={handleInviteCopyFallback}
									/>
								</span>
							</div>
						)}

						<form onSubmit={handleFormSubmit} className="mt-6 flex flex-col gap-5">
							{codeInputVisible && (
								<div>
									<label
										htmlFor="join-code-input"
										className="mb-2 block text-sm font-medium"
									>
										Código da sala
									</label>
									<input
										id="join-code-input"
										ref={codeRef}
										type="text"
										maxLength={4}
										placeholder="ABCD"
										autoComplete="off"
										autoCapitalize="characters"
										spellCheck={false}
										value={localCode}
										onChange={(e) => handleCodeChange(e.target.value)}
										aria-invalid={codeError !== null}
										aria-describedby={
											codeError ? "join-code-error" : "join-code-hint"
										}
										disabled={checking}
										data-testid="join-code"
										className={`${INPUT} font-mono text-lg tracking-[0.28em] uppercase`}
									/>
									{codeError ? (
										<p
											id="join-code-error"
											role="alert"
											data-testid="join-code-error"
											className="mt-1.5 text-sm text-red-400"
										>
											{codeError}
										</p>
									) : (
										<p id="join-code-hint" className="mt-1.5 text-sm text-zinc-400 [html.light_&]:text-zinc-600">
											4 letras ou números · peça ao host que criou a sala.
										</p>
									)}
								</div>
							)}

							<div>
								<label
									htmlFor="join-nick-input"
									className="mb-2 block text-sm font-medium"
								>
									Como você quer ser chamado
								</label>
								<input
									id="join-nick-input"
									ref={nickRef}
									type="text"
									maxLength={NICK_MAX}
									placeholder="ex. Luna"
									autoComplete="nickname"
									value={nick}
									onChange={(e) => handleNickChange(e.target.value)}
									aria-invalid={nickError !== null}
									aria-describedby={
										nickError ? "join-nick-error" : "join-nick-hint"
									}
									disabled={checking}
									data-testid="join-nick"
									className={INPUT}
								/>
								{nickError ? (
									<p
										id="join-nick-error"
										role="alert"
										data-testid="join-nick-error"
										className="mt-1.5 text-sm text-red-400"
									>
										{nickError}
									</p>
								) : (
									<p
										id="join-nick-hint"
										className="mt-1.5 flex items-center justify-between text-sm text-zinc-400 [html.light_&]:text-zinc-600"
									>
										<span>De 2 a 20 caracteres</span>
										<span aria-hidden="true">
											{nick.length}/{NICK_MAX}
										</span>
									</p>
								)}
							</div>

							<div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
								<button
									type="submit"
									disabled={submitDisabled}
									onClick={() => void doSubmit()}
									data-testid="join-submit"
									className={`${CONTROL} w-full bg-zinc-100 text-zinc-950 [html.light_&]:bg-zinc-900 [html.light_&]:text-white sm:flex-1`}
								>
									{checking ? (
										<>
											<Spinner size="sm" /> Verificando…
										</>
									) : (
										submitLabel
									)}
								</button>
								<button
									type="button"
									onClick={() => navigate("/")}
									data-testid="join-back"
									className={`${CONTROL} border border-zinc-700 [html.light_&]:border-zinc-300`}
								>
									Voltar
								</button>
							</div>
						</form>
					</div>

					<aside aria-label="Na mesa" className="min-w-0 lg:pt-8">
						<h2 className="text-lg font-medium">Na mesa</h2>
						<p className="mt-1 text-sm text-zinc-400 [html.light_&]:text-zinc-600">
							O que acontece depois que você entrar.
						</p>
						<ol className="mt-5 grid gap-7 border-t border-[#26262c] pt-8 [html.light_&]:border-zinc-300">
							{STEPS.map((step, index) => (
								<li key={step.title}>
									<h3 className="text-lg font-medium">
										<span className="mr-3 font-mono text-sm text-zinc-400 [html.light_&]:text-zinc-600">
											{index + 1}.
										</span>
										{step.title}
									</h3>
									<p className="mt-2 max-w-[32ch] text-sm leading-relaxed text-zinc-400 [html.light_&]:text-zinc-600">
										{step.body}
									</p>
								</li>
							))}
						</ol>
					</aside>
				</div>
			</main>

			<footer className="mx-auto w-full max-w-6xl px-5 py-6 text-sm text-zinc-400 sm:px-8 [html.light_&]:text-zinc-600">
				Pointly · A ferramenta some, a conversa fica.
			</footer>
		</div>
	);
}
