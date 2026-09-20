import { CircleAlertIcon, EyeIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { OTPField, OTPFieldInput } from "@/components/ui/otp-field";
import { AvatarPicker } from "@/components/avatar-picker";
import { checkSala, resolveWsUrl } from "@/lib/api";
import { clearAvatar, loadAvatar, saveAvatar } from "@/lib/avatar";
import {
  JoinError,
  friendlyJoinMessage,
  genericJoinMessage,
} from "@/lib/errors";
import { firstIssueMessage } from "@/lib/forms";
import type { Lang } from "@/lib/i18n";
import { codeSchema, nickSchema, loadNickDraft, normalizeCode, saveNickDraft } from "@/lib/identity";
import { PointlySocket } from "@/lib/ws-client";
import { useSession } from "@/store/session";
import { JOIN_CONTENT } from "./join-content";
import "./join.css";

type Mode = "create" | "join";

export function JoinPage({
  lang = "pt-BR",
}: {
  lang?: Lang;
}): React.ReactElement {
  const content = JOIN_CONTENT[lang];
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const uuid = useSession((state) => state.uuid);
  const sessionNick = useSession((state) => state.nick);
  const setConnected = useSession((state) => state.setConnected);

  const [mode, setMode] = useState<Mode>(() =>
    searchParams.get("code") || searchParams.get("mode") === "join"
      ? "join"
      : "create",
  );
  const [nick, setNick] = useState(() => sessionNick || loadNickDraft());
  const [code, setCode] = useState(() =>
    normalizeCode(searchParams.get("code") ?? ""),
  );
  const [spectate, setSpectate] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(() => loadAvatar());
  const [nickError, setNickError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const socketRef = useRef<PointlySocket | null>(null);
  const navigatedRef = useRef(false);

  useEffect(() => {
    setMode(
      searchParams.get("code") || searchParams.get("mode") === "join"
        ? "join"
        : "create",
    );
    setCode(normalizeCode(searchParams.get("code") ?? ""));
    setCodeError(null);
    setFormError(null);
  }, [searchParams]);

  useEffect(() => {
    return () => {
      if (!navigatedRef.current) {
        socketRef.current?.close({ silent: true });
        socketRef.current = null;
      }
    };
  }, []);

  function handleNickChange(value: string): void {
    setNick(value);
    saveNickDraft(value);
    if (nickError) setNickError(null);
  }

  function handleCodeChange(value: string): void {
    setCode(normalizeCode(value));
    if (codeError) setCodeError(null);
  }

  /** Persiste na hora para o reload mostrar a foto no picker (AV-02). */
  function handleAvatarChange(next: string | null): void {
    setAvatar(next);
    if (next) saveAvatar(next);
    else clearAvatar();
  }

  function switchMode(next: Mode): void {
    setMode(next);
    setFormError(null);
    setCodeError(null);
  }

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (busy) return;

    const nickResult = nickSchema(lang).safeParse(nick);
    if (!nickResult.success) {
      setNickError(firstIssueMessage(nickResult.error, lang));
    } else {
      setNickError(null);
    }

    let codeValue: string | undefined;
    if (mode === "join") {
      const codeResult = codeSchema(lang).safeParse(code);
      if (!codeResult.success) {
        setCodeError(firstIssueMessage(codeResult.error, lang));
      } else {
        setCodeError(null);
        codeValue = codeResult.data;
      }
    }

    if (!nickResult.success || (mode === "join" && !codeValue)) return;

    setBusy(true);
    setFormError(null);
    try {
      if (mode === "join" && codeValue) {
        const check = await checkSala(codeValue);
        if (check.status === "missing") {
          setFormError(friendlyJoinMessage("sala_nao_encontrada", undefined, lang));
          setBusy(false);
          return;
        }
        if (check.status === "invalid") {
          setCodeError(friendlyJoinMessage("invalid_code", undefined, lang));
          setBusy(false);
          return;
        }
      }

      const socket = new PointlySocket({
        onRoomState: (sala) => {
          // Ticket 04: presença/votos ao vivo — o primeiro navegador
          // recebe room_state quando o segundo entra (<1s).
          useSession.getState().updateSala(sala);
        },
        onClose: () => {
          if (!navigatedRef.current) {
            setFormError(friendlyJoinMessage("connection_failed", undefined, lang));
            setBusy(false);
          }
        },
      });
      socketRef.current = socket;
      const welcome = await socket.connect(resolveWsUrl(), {
        uuid,
        nick: nickResult.data,
        ...(codeValue ? { code: codeValue } : {}),
        ...(spectate ? { spectate: true as const } : {}),
        ...(avatar ? { avatar } : {}),
      });
      setConnected({
        nick: nickResult.data,
        code: welcome.sala.code,
        playerId: welcome.playerId,
        role: welcome.role,
        sala: welcome.sala,
        socket,
        spectate: welcome.role === "spectator",
      });
      navigatedRef.current = true;
      navigate(`/s/${welcome.sala.code}`);
    } catch (error) {
      if (error instanceof JoinError) {
        setFormError(friendlyJoinMessage(error.code, error.message, lang));
      } else {
        setFormError(genericJoinMessage(lang));
      }
      setBusy(false);
    }
  }

  return (
    <div className="join-page">
      <section className="join-intro" aria-labelledby="join-intro-title">
        <h1 id="join-intro-title">
          {content.intro.h1Line1}
          <br />
          {content.intro.h1Line2}
        </h1>
        <p className="join-intro-copy">{content.intro.copy}</p>
        <ol className="join-ritual" aria-label={content.intro.stepsAria}>
          {content.intro.steps.map((step, index) => (
            <li key={step.title}>
              <span className="join-ritual-index" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="join-ritual-text">
                <strong>{step.title}</strong>
                <span>{step.body}</span>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <Card className="join-card">
        <CardHeader className="join-card-header">
          <CardTitle>
            {mode === "create" ? content.card.titleCreate : content.card.titleJoin}
          </CardTitle>
          <CardDescription>{content.card.description}</CardDescription>
        </CardHeader>
        <CardPanel className="join-card-panel">
          <form
            id="join-form"
            className="join-form"
            aria-busy={busy}
            onSubmit={(event) => {
              void handleSubmit(event);
            }}
          >
            <fieldset className="join-fields" disabled={busy}>
              <div
                className="join-mode-switch"
                role="radiogroup"
                aria-label={content.card.modesAria}
              >
                <label className="join-mode-button">
                  <input
                    type="radio"
                    name="join-mode"
                    className="sr-only"
                    checked={mode === "create"}
                    aria-label={content.card.createRoom}
                    onChange={() => switchMode("create")}
                  />
                  <span>{content.card.createRoom}</span>
                </label>
                <label className="join-mode-button">
                  <input
                    type="radio"
                    name="join-mode"
                    className="sr-only"
                    checked={mode === "join"}
                    aria-label={content.card.joinWithCode}
                    onChange={() => switchMode("join")}
                  />
                  <span>{content.card.joinWithCode}</span>
                </label>
              </div>

              <Field invalid={nickError !== null}>
                <FieldLabel htmlFor="nick">{content.card.nickLabel}</FieldLabel>
                <Input
                  className="join-input"
                  id="nick"
                  name="nick"
                  size="lg"
                  value={nick}
                  maxLength={20}
                  autoComplete="nickname"
                  autoCapitalize="words"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint={mode === "join" ? "next" : "go"}
                  disabled={busy}
                  placeholder={content.card.nickPlaceholder}
                  aria-invalid={nickError ? true : undefined}
                  aria-describedby={nickError ? "nick-error" : "nick-hint"}
                  onChange={(event) => handleNickChange(event.target.value)}
                />
                <FieldDescription id="nick-hint">
                  {content.card.nickHint}
                </FieldDescription>
                {nickError ? (
                  <FieldError id="nick-error" match={true}>
                    {nickError}
                  </FieldError>
                ) : null}
              </Field>

              {mode === "join" ? (
                <Field invalid={codeError !== null}>
                  <FieldLabel htmlFor="code">{content.card.codeLabel}</FieldLabel>
                  <OTPField
                    className="join-otp"
                    id="code"
                    name="code"
                    length={4}
                    validationType="alphanumeric"
                    normalizeValue={(value) => value.toUpperCase()}
                    value={code}
                    onValueChange={handleCodeChange}
                    autoComplete="one-time-code"
                    aria-invalid={codeError ? true : undefined}
                    aria-describedby={codeError ? "code-error" : "code-hint"}
                  >
                    {[0, 1, 2, 3].map((index) => (
                      <OTPFieldInput
                        key={index}
                        aria-label={
                          index === 0
                            ? undefined
                            : content.card.codeCharAria(index)
                        }
                      />
                    ))}
                  </OTPField>
                  <FieldDescription id="code-hint">
                    {content.card.codeHint}
                  </FieldDescription>
                  {codeError ? (
                    <FieldError id="code-error" match={true}>
                      {codeError}
                    </FieldError>
                  ) : null}
                </Field>
              ) : null}

              <AvatarPicker
                value={avatar}
                onChange={handleAvatarChange}
                lang={lang}
              />

              {mode === "join" ? (
                <label className="join-spectate" htmlFor="spectate">
                  <input
                    id="spectate"
                    name="spectate"
                    type="checkbox"
                    checked={spectate}
                    disabled={busy}
                    onChange={(event) => setSpectate(event.target.checked)}
                  />
                  <span className="join-spectate-text">
                    <span className="join-spectate-title">
                      <EyeIcon aria-hidden="true" />
                      {content.card.spectatorTitle}
                    </span>
                    <span className="join-spectate-hint">
                      {content.card.spectatorHint}
                    </span>
                  </span>
                </label>
              ) : null}

              {formError ? (
                <Alert variant="error">
                  <CircleAlertIcon aria-hidden="true" />
                  <AlertTitle>{content.card.errorTitle}</AlertTitle>
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              ) : null}
            </fieldset>
          </form>
        </CardPanel>
        <CardFooter className="join-card-footer">
          <Button
            className="join-submit"
            type="submit"
            form="join-form"
            loading={busy}
          >
            {mode === "create"
              ? content.card.submitCreate
              : content.card.submitJoin}
          </Button>
          <span role="status" className="join-busy-note">
            {busy
              ? mode === "create"
                ? content.card.statusCreating
                : content.card.statusJoining
              : ""}
          </span>
        </CardFooter>
      </Card>
    </div>
  );
}
