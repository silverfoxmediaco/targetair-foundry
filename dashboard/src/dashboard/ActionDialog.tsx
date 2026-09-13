import React, { useEffect, useRef, useState } from "react";
import css from "./Dashboard.module.css";

/**
 * The form that applies an ontology action.
 *
 * Three things here are deliberate.
 *
 * The submit is not optimistic. The dialog waits for Foundry, then asks the
 * page to re-read. On a write path the interesting failure is the one the
 * ontology rejects, and showing the new value before the ontology has accepted
 * it teaches the user to trust a number that may be about to disappear.
 *
 * Failures surface Foundry's own message rather than "Something went wrong".
 * An action can be refused for reasons the client cannot know — submission
 * criteria, a validation rule, a permission — and the platform's wording is
 * the only thing that tells the user which.
 *
 * Required-ness is enforced here because the ontology does not enforce it.
 * Foundry created every property parameter as nullable, so the SDK would
 * happily submit a re-forecast with no date. That is a gap in the model and
 * this is a patch over it, not a substitute for fixing it.
 */

export type FieldSpec =
  | { name: string; label: string; kind: "date"; required?: boolean; initial?: string }
  | { name: string; label: string; kind: "text"; required?: boolean; initial?: string }
  | {
      name: string;
      label: string;
      kind: "select";
      options: readonly string[];
      required?: boolean;
      initial?: string;
    };

interface Props {
  title: string;
  subject: string;
  /** The ontology action this form applies, shown so the write path is as
   *  legible as the read paths are on the rest of the screen. */
  actionApiName: string;
  fields: readonly FieldSpec[];
  submitLabel: string;
  onSubmit: (values: Record<string, string>) => Promise<void>;
  onClose: () => void;
  onApplied: () => void;
}

function ActionDialog({
  title,
  subject,
  actionApiName,
  fields,
  submitLabel,
  onSubmit,
  onClose,
  onApplied,
}: Props): React.ReactElement {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.name, f.initial ?? ""])),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const firstFieldRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  useEffect(() => {
    firstFieldRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape" && !submitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, submitting]);

  const missing = fields.filter((f) => f.required === true && values[f.name].trim() === "");

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (missing.length > 0 || submitting) {
      return;
    }
    setSubmitting(true);
    setError(undefined);
    try {
      await onSubmit(values);
      onApplied();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setSubmitting(false);
    }
  }

  return (
    <div className={css.taScrim}>
      <div className={css.taDialog} role="dialog" aria-modal="true" aria-label={title}>
        <header className={css.taDialogHead}>
          <div>
            <h2 className={css.taDialogTitle}>{title}</h2>
            <span className={css.taDialogSubject}>{subject}</span>
          </div>
          <span className={css.taTraversal}>{actionApiName}</span>
        </header>

        <form className={css.taDialogBody} onSubmit={handleSubmit}>
          {fields.map((field, i) => (
            <label className={css.taField} key={field.name}>
              <span className={css.taFieldLabel}>
                {field.label}
                {field.required === true ? <span className={css.taRequired}> required</span> : null}
              </span>

              {field.kind === "select" ? (
                <select
                  className={css.taInput}
                  ref={i === 0 ? (firstFieldRef as React.RefObject<HTMLSelectElement>) : undefined}
                  value={values[field.name]}
                  disabled={submitting}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [field.name]: e.target.value }))
                  }
                >
                  <option value="">—</option>
                  {field.options.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className={css.taInput}
                  ref={i === 0 ? (firstFieldRef as React.RefObject<HTMLInputElement>) : undefined}
                  type={field.kind === "date" ? "date" : "text"}
                  value={values[field.name]}
                  disabled={submitting}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [field.name]: e.target.value }))
                  }
                />
              )}
            </label>
          ))}

          {error != null ? <p className={css.taDialogError}>{error}</p> : null}

          <div className={css.taDialogActions}>
            <button
              type="button"
              className={css.taButtonQuiet}
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={css.taButton}
              disabled={submitting || missing.length > 0}
            >
              {submitting ? "Applying…" : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ActionDialog;
