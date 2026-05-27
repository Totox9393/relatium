import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';

interface DeleteConfirmationModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: (disableFutureConfirmations: boolean) => void;
}

export function DeleteConfirmationModal({
  title,
  message,
  confirmLabel = 'Supprimer',
  onCancel,
  onConfirm,
}: DeleteConfirmationModalProps) {
  const [disableFutureConfirmations, setDisableFutureConfirmations] = useState(false);

  return createPortal(
    <div className="fixed inset-0 z-[13000] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-[440px] rounded-2xl border border-rose-100 bg-white p-5 shadow-[0_28px_90px_rgba(15,23,42,0.35)]">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <AlertTriangle className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-bold leading-tight text-slate-950">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{message}</p>
          </div>
        </div>

        <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            checked={disableFutureConfirmations}
            onChange={event => setDisableFutureConfirmations(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
          />
          Ne plus me demander
        </label>

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => onConfirm(disableFutureConfirmations)}
            className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-700"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
