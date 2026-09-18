import { ImagePlusIcon, Trash2Icon, UserRoundIcon } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import {
  AvatarError,
  avatarErrorMessage,
  normalizeAvatar,
} from "@/lib/avatar";
import "./avatar-picker.css";

interface AvatarPickerProps {
  value: string | null;
  onChange: (value: string | null) => void;
  compact?: boolean;
}

/**
 * Picker de avatar (AV-05): input file escondido + preview circular +
 * remover + erro inline. Controlado — persistência e envio são do pai
 * (join/arena). Durante o processamento mantém o avatar anterior visível.
 */
export function AvatarPicker({
  value,
  onChange,
  compact = false,
}: AvatarPickerProps): React.ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File | undefined): Promise<void> {
    if (!file || busy) return;
    setBusy(true);
    try {
      const dataUrl = await normalizeAvatar(file);
      setError(null);
      onChange(dataUrl);
    } catch (err) {
      setError(
        err instanceof AvatarError
          ? avatarErrorMessage(err.code)
          : "Não foi possível ler a imagem. Tente outra.",
      );
    } finally {
      setBusy(false);
    }
  }

  function handleRemove(): void {
    setError(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <Field
      className={cn("avatar-picker", compact && "avatar-picker--compact")}
      invalid={error !== null}
    >
      <FieldLabel>Foto de perfil</FieldLabel>
      <div className="avatar-picker-row">
        <span className="avatar-picker-preview" data-testid="avatar-preview">
          {value ? (
            <img src={value} alt="Prévia do avatar" />
          ) : (
            <UserRoundIcon aria-hidden="true" />
          )}
        </span>
        <div className="avatar-picker-actions">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            hidden
            aria-label="Escolher foto"
            disabled={busy}
            onChange={(event) => {
              void handleFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={busy}
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlusIcon aria-hidden="true" />
            {value ? "Trocar foto" : "Escolher foto"}
          </Button>
          {value ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={handleRemove}
            >
              <Trash2Icon aria-hidden="true" />
              Remover
            </Button>
          ) : null}
        </div>
      </div>
      <FieldDescription aria-live="polite">
        {busy ? "Preparando sua foto…" : "Visível para todos na sala"}
      </FieldDescription>
      {error ? <FieldError match={true}>{error}</FieldError> : null}
    </Field>
  );
}
