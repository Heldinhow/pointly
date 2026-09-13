/**
 * Join — entrada/criação de sala (spell-rebuild).
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
 * O submit é RichButton `type="submit"` dentro do <form> (Enter e click
 * passam pelo onSubmit); onClick chama o mesmo `doSubmit` como redundância
 * e o `submittedRef` dedupa a chamada dupla do mesmo tick. data-testid é
 * atributo HTML padrão, repassado ao <button>.
 */
import {
	useCallback,
	useEffect,
	useRef,
	useState,
	type FormEvent,
} from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Badge } from "@/components/spell/badge";
import { CopyButton } from "@/components/spell/copy-button";
import { RichButton } from "@/components/spell/rich-button";
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

type JoinMode = "create" | "invite" | "manual";

const MODE_BADGE: Record<JoinMode, { variant: "violet" | "green" | "blue"; label: string }> = {
	create: { variant: "violet", label: "Nova sala" },
	invite: { variant: "green", label: "Convite" },
	manual: { variant: "blue", label: "Entrar" },
};

export function Join() {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();

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
	const badge = MODE_BADGE[mode];

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
		<main
			data-testid="page-join"
			className="flex min-h-dvh flex-col items-center bg-[#09090b] bg-[radial-gradient(ellipse_55%_30%_at_50%_0%,rgba(52,211,153,0.08),transparent_70%)] px-5 py-10 text-zinc-100 [html.light_&]:bg-zinc-100 [html.light_&]:text-zinc-900"
		>
			<div className="grid w-full max-w-4xl items-start gap-8 lg:grid-cols-[1.05fr_0.95fr]">
				<div className="w-full max-w-md justify-self-center lg:justify-self-end">
				<Link
					to="/"
					className="flex items-center gap-2.5 rounded-md font-mono text-sm font-semibold tracking-[0.08em] text-zinc-300 uppercase hover:text-zinc-100 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none [html.light_&]:text-zinc-600 [html.light_&]:hover:text-zinc-900"
				>
					<span aria-hidden="true" className="grid grid-cols-2 gap-[3px]">
						<span className="h-2 w-2 rounded-[3px] bg-zinc-300 [html.light_&]:bg-zinc-900" />
						<span className="h-2 w-2 rounded-[3px] bg-zinc-300 [html.light_&]:bg-zinc-900" />
						<span className="h-2 w-2 rounded-[3px] bg-zinc-300 [html.light_&]:bg-zinc-900" />
						<span className="h-2 w-2 rounded-[3px] bg-emerald-400" />
					</span>
					Pointly
				</Link>

				<div className="mt-6 rounded-2xl border border-[#26262c] bg-[#101013] p-6 shadow-[0_32px_80px_-40px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.05)] sm:p-8 [html.light_&]:border-zinc-200 [html.light_&]:bg-white">
					<Badge variant={badge.variant}>{badge.label}</Badge>
					<h1 className="mt-3 text-3xl font-medium tracking-tight">
						{mode === "create"
							? "Crie sua sala"
							: mode === "invite"
								? "Você foi convidado!"
								: "Entrar na sala"}
					</h1>
					<p className="mt-2 text-sm leading-relaxed text-zinc-400 [html.light_&]:text-zinc-600">
						{mode === "create"
							? "Escolha seu nome — o código da sala é gerado na hora para convidar o time."
							: mode === "invite"
								? "Escolha como você quer aparecer para o time."
								: "Informe o código da sala e escolha seu nome para entrar."}
					</p>

					{mode === "invite" && !codeEditable && inviteCode && (
						<div className="mt-5 flex items-center gap-3 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.06] px-4 py-3 [html.light_&]:border-emerald-700/25 [html.light_&]:bg-emerald-50">
							<span className="font-mono text-[11px] tracking-[0.16em] text-zinc-400 uppercase [html.light_&]:text-zinc-500">Sala</span>
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
									className="mb-1.5 block font-mono text-xs tracking-[0.08em] text-zinc-400 uppercase [html.light_&]:text-zinc-500"
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
									className="h-13 w-full rounded-xl border border-[#2b2b31] bg-[#0b0b0f] px-4 py-3 font-mono text-lg tracking-[0.28em] uppercase placeholder:text-zinc-600 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/30 focus:outline-none [html.light_&]:border-zinc-300 [html.light_&]:bg-zinc-50"
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
									<p id="join-code-hint" className="mt-1.5 text-xs text-zinc-500">
										4 letras ou números · peça ao host que criou a sala.
									</p>
								)}
							</div>
						)}

						<div>
							<label
								htmlFor="join-nick-input"
								className="mb-1.5 block font-mono text-xs tracking-[0.08em] text-zinc-400 uppercase [html.light_&]:text-zinc-500"
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
								className="h-13 w-full rounded-xl border border-[#2b2b31] bg-[#0b0b0f] px-4 py-3 text-base placeholder:text-zinc-600 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/30 focus:outline-none [html.light_&]:border-zinc-300 [html.light_&]:bg-zinc-50"
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
									className="mt-1.5 flex items-center justify-between text-xs text-zinc-500"
								>
									<span>De 2 a 20 caracteres</span>
									<span aria-hidden="true">
										{nick.length}/{NICK_MAX}
									</span>
								</p>
							)}
						</div>

						<div className="flex flex-col gap-3 sm:flex-row">
							<RichButton
								type="submit"
								color="emerald"
								size="lg"
								disabled={submitDisabled}
								onClick={() => void doSubmit()}
								data-testid="join-submit"
								className="rounded-full sm:flex-1"
							>
								{checking ? (
									<>
										<Spinner size="sm" /> Verificando…
									</>
								) : (
									submitLabel
								)}
							</RichButton>
							<RichButton
								color="zinc"
								size="lg"
								onClick={() => navigate("/")}
								data-testid="join-back"
								className="rounded-full"
							>
								Voltar
							</RichButton>
						</div>
					</form>
				</div>
				</div>

				<aside
					aria-label="O que acontece a seguir"
					className="hidden w-full max-w-md justify-self-start lg:block"
				>
					<div className="rounded-2xl border border-[#26262c] bg-gradient-to-b from-[#141419] to-[#0e0e12] p-6 [html.light_&]:border-zinc-200 [html.light_&]:from-white [html.light_&]:to-zinc-50">
						<p className="font-mono text-[11px] tracking-[0.18em] text-zinc-500 uppercase">
							Na mesa
						</p>
						<ul className="mt-4 flex flex-col gap-4">
							<li className="flex gap-3">
								<span aria-hidden="true" className="font-mono text-xs text-emerald-300 [html.light_&]:text-emerald-700">01</span>
								<div>
									<p className="text-sm font-medium">Entre com um apelido</p>
									<p className="text-sm text-zinc-400 [html.light_&]:text-zinc-600">Sem conta, sem e-mail. Só um nome para o time reconhecer você.</p>
								</div>
							</li>
							<li className="flex gap-3">
								<span aria-hidden="true" className="font-mono text-xs text-emerald-300 [html.light_&]:text-emerald-700">02</span>
								<div>
									<p className="text-sm font-medium">Vote em segredo</p>
									<p className="text-sm text-zinc-400 [html.light_&]:text-zinc-600">Cartas 0 · ½ · 1 · 2 · 3 · 5 · 8 · 13 · ☕. Ninguém vê até o reveal.</p>
								</div>
							</li>
							<li className="flex gap-3">
								<span aria-hidden="true" className="font-mono text-xs text-emerald-300 [html.light_&]:text-emerald-700">03</span>
								<div>
									<p className="text-sm font-medium">Revele e converse</p>
									<p className="text-sm text-zinc-400 [html.light_&]:text-zinc-600">Mediana, média e intervalo na mesa. Timer de 60s revela sozinho.</p>
								</div>
							</li>
						</ul>
						<div className="mt-5 flex items-center gap-2 border-t border-[#26262c] pt-4 [html.light_&]:border-zinc-200">
							<Badge variant="green">60s por rodada</Badge>
							<Badge variant="blue">Até 12 pessoas</Badge>
						</div>
					</div>
				</aside>
			</div>
		</main>
	);
}
