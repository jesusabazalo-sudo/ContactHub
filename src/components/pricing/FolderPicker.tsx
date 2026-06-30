import { Check, Loader2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getCatalogCategories } from '../../services/catalogService';
import type { Category } from '../../types';
import Icon from '../ui/Icon';

type FolderPickerProps = {
  planName: string;
  max: number; // folderLimit del plan
  onConfirm: (categoryIds: string[]) => void;
  onClose: () => void;
};

/**
 * Modal para que el cliente elija hasta `max` carpetas antes de pagar un plan
 * multi-carpeta. Devuelve los categoryIds elegidos a CulqiPayButton, que los
 * envía a la Edge Function (que vuelve a validar el límite en el servidor).
 */
export default function FolderPicker({ planName, max, onConfirm, onClose }: FolderPickerProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    void getCatalogCategories().then((cats) => {
      if (mounted) {
        setCategories(cats);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const atLimit = selected.length >= max;
  const canConfirm = selected.length >= 1 && selected.length <= max;

  function toggle(id: string) {
    setSelected((current) => {
      if (current.includes(id)) return current.filter((x) => x !== id);
      if (current.length >= max) return current; // no exceder el límite
      return [...current, id];
    });
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-card-lg">
        <div className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div>
            <h2 className="font-display text-xl font-bold text-content">Elige tus carpetas — {planName}</h2>
            <p className="mt-1 text-sm text-content-secondary">
              Selecciona hasta <span className="font-semibold text-content">{max}</span> carpetas para desbloquear con este plan.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring flex-none rounded-full border border-border bg-muted p-2 text-content-secondary transition hover:text-content"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <span className="text-sm font-semibold text-brand-text">{selected.length} / {max} seleccionadas</span>
          {atLimit ? <span className="text-xs text-content-muted">Límite alcanzado</span> : null}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-content-secondary">
              <Loader2 className="h-5 w-5 animate-spin" /> Cargando carpetas…
            </div>
          ) : (
            <div className="grid gap-2.5 sm:grid-cols-2">
              {categories.map((category) => {
                const checked = selectedSet.has(category.id);
                const disabled = !checked && atLimit;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => toggle(category.id)}
                    disabled={disabled}
                    className={`focus-ring flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                      checked
                        ? 'border-brand/50 bg-brand/[0.08]'
                        : disabled
                          ? 'cursor-not-allowed border-border bg-surface opacity-50'
                          : 'border-border bg-surface hover:border-brand/40'
                    }`}
                  >
                    <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-brand/[0.1] text-brand-text">
                      <Icon name={category.icon} className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-content">{category.name}</span>
                      <span className="block truncate text-xs text-content-muted">{category.contactsCount} contactos</span>
                    </span>
                    <span className={`flex h-5 w-5 flex-none items-center justify-center rounded-full border ${checked ? 'border-brand bg-brand text-brand-contrast' : 'border-border'}`}>
                      {checked ? <Check className="h-3 w-3" /> : null}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border p-5">
          <button
            type="button"
            onClick={onClose}
            className="focus-ring rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-content-secondary transition hover:text-content"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={() => onConfirm(selected)}
            className="focus-ring inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-brand-contrast transition hover:bg-brand-hover disabled:opacity-50"
          >
            Continuar al pago
          </button>
        </div>
      </div>
    </div>
  );
}
