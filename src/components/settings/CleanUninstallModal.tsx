import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Folder,
  Loader2,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import type { AppLeftoverItem, LeftoverCategory } from '~types';
import { useLauncherDispatch, useLauncherState } from '@/context/LauncherStateContext';
import { moveToTrashBatch, scanAppLeftovers } from '@/services/tauriBridge';
import AppIcon from '@/components/grid/AppIcon';

export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = bytes / Math.pow(k, i);
  return `${parseFloat(val.toFixed(1))} ${sizes[i]}`;
}

const CATEGORY_META: Record<
  LeftoverCategory,
  { label: string; badgeClass: string }
> = {
  app_support: {
    label: 'Application Support',
    badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  },
  caches: {
    label: 'Cache & Dati Temporanei',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  preferences: {
    label: 'Preferenze (.plist)',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  containers: {
    label: 'Sandbox Containers',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
  saved_state: {
    label: 'Stato Sessione',
    badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  },
  logs: {
    label: 'Log di Sistema',
    badgeClass: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30',
  },
  other: {
    label: 'Altri Residui',
    badgeClass: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  },
};

export const CleanUninstallModal: React.FC = () => {
  const dispatch = useLauncherDispatch();
  const { uninstallingAppId, apps, iconRevision } = useLauncherState();

  const targetApp = useMemo(() => {
    return uninstallingAppId ? apps.find((a) => a.id === uninstallingAppId) : undefined;
  }, [uninstallingAppId, apps]);

  const [leftovers, setLeftovers] = useState<AppLeftoverItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!targetApp) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    const performScan = async () => {
      try {
        const items = await scanAppLeftovers(targetApp.id, targetApp.name);
        if (!isMounted) return;
        setLeftovers(items);
        setSelectedPaths(new Set(items.map((it) => it.path)));
      } catch (err) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[CleanUninstaller] Errore durante la scansione:', err);
        setError(msg);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void performScan();

    return () => {
      isMounted = false;
    };
  }, [targetApp]);

  if (!targetApp) return null;

  const handleClose = () => {
    if (isDeleting) return;
    dispatch({ type: 'CLOSE_UNINSTALLER' });
  };

  const toggleSelect = (path: string) => {
    setSelectedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedPaths.size === leftovers.length) {
      setSelectedPaths(new Set());
    } else {
      setSelectedPaths(new Set(leftovers.map((l) => l.path)));
    }
  };

  const totalBytes = useMemo(() => {
    return leftovers
      .filter((l) => selectedPaths.has(l.path))
      .reduce((acc, curr) => acc + curr.sizeBytes, 0);
  }, [leftovers, selectedPaths]);

  const handleConfirmUninstall = async () => {
    if (!targetApp || isDeleting) return;

    setIsDeleting(true);
    setError(null);

    const pathsToTrash = [targetApp.path, ...Array.from(selectedPaths)];

    try {
      await moveToTrashBatch(pathsToTrash);
      dispatch({ type: 'APP_UNINSTALLED', appId: targetApp.id });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[CleanUninstaller] Errore durante lo spostamento nel Cestino:', err);
      setError(`Errore: ${msg}`);
      setIsDeleting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="clean-uninstall-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl max-h-[88vh] flex flex-col gap-4 p-6 rounded-3xl bg-neutral-900/90 border border-white/20 shadow-2xl text-white select-none">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 shrink-0">
              <AppIcon
                id={targetApp.id}
                name={targetApp.name}
                iconCachePath={targetApp.iconCachePath}
                sizePx={48}
                iconRevision={iconRevision}
              />
            </div>
            <div>
              <h2 id="clean-uninstall-title" className="text-base font-semibold flex items-center gap-2">
                <span>Disinstalla {targetApp.name}</span>
                <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-bold uppercase tracking-wider">
                  Clean
                </span>
              </h2>
              <p className="text-xs text-white/50 font-mono truncate max-w-sm">
                {targetApp.path}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isDeleting}
            className="p-1 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-30"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[48vh]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-white/60">
              <Loader2 size={28} className="animate-spin text-red-400" />
              <div className="text-center">
                <p className="text-xs font-semibold text-white/80">
                  Scansione approfondita in corso...
                </p>
                <p className="text-[11px] text-white/40">
                  Controllo cache, preferenze orfane, application support e sandbox
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-200 text-xs space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <AlertTriangle size={14} />
                <span>Errore durante l'operazione</span>
              </div>
              <p className="text-red-300/80">{error}</p>
            </div>
          ) : leftovers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
              <ShieldCheck size={28} className="text-emerald-400" />
              <p className="text-xs font-medium text-white/80">
                Nessun file residuo aggiuntivo rilevato
              </p>
              <p className="text-[11px] text-white/40 max-w-xs">
                Verrà disinstallato unicamente il pacchetto principale dell'applicazione.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-medium text-white/70">
                  File e cartelle residui trovati ({leftovers.length})
                </span>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-[11px] text-red-400 hover:text-red-300 transition-colors"
                >
                  {selectedPaths.size === leftovers.length ? 'Deseleziona tutti' : 'Seleziona tutti'}
                </button>
              </div>

              <div className="space-y-1.5">
                {leftovers.map((item) => {
                  const isChecked = selectedPaths.has(item.path);
                  const meta =
                    CATEGORY_META[item.category as LeftoverCategory] ??
                    CATEGORY_META.other;

                  return (
                    <div
                      key={item.path}
                      onClick={() => toggleSelect(item.path)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-red-500/15 border-red-500/40 text-white'
                          : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden flex-1 mr-2">
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center border shrink-0 transition-colors ${
                            isChecked
                              ? 'bg-red-500 border-red-400 text-white'
                              : 'border-white/30 bg-white/5'
                          }`}
                        >
                          {isChecked && <Check size={12} />}
                        </div>

                        <div className="p-1 rounded bg-white/5 text-white/50 shrink-0">
                          <Folder size={14} />
                        </div>

                        <div className="flex flex-col overflow-hidden flex-1">
                          <span className="text-xs font-medium text-white/90 truncate">
                            {item.name}
                          </span>
                          <span
                            className="text-[10px] text-white/40 font-mono truncate"
                            title={item.path}
                          >
                            {item.path}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${meta.badgeClass}`}
                        >
                          {meta.label}
                        </span>
                        <span className="text-xs font-mono text-white/70 w-16 text-right">
                          {formatBytes(item.sizeBytes)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Safe Trash Notice */}
          <div className="flex items-start gap-2 p-3 rounded-2xl bg-white/5 border border-white/10 text-[11px] text-white/60">
            <ShieldCheck size={16} className="text-emerald-400 shrink-0 mt-0.5" />
            <p>
              <strong>Safe Trash garantito:</strong> i file verranno spostati nel{' '}
              <strong>Cestino di macOS</strong> anziché essere cancellati definitivamente.
              Potrai ripristinarli in qualsiasi momento tramite il Finder ("Ripristina").
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <div className="flex flex-col">
            <span className="text-xs text-white/40">Spazio totale recuperabile</span>
            <span className="text-sm font-bold font-mono text-emerald-400">
              {formatBytes(totalBytes)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isDeleting}
              className="px-4 py-2 rounded-xl text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-40"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={handleConfirmUninstall}
              disabled={isLoading || isDeleting}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold shadow-lg transition-all cursor-pointer ${
                isLoading || isDeleting
                  ? 'bg-red-500/50 text-white/50 cursor-not-allowed'
                  : 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30'
              }`}
            >
              {isDeleting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Spostamento in corso...</span>
                </>
              ) : (
                <>
                  <Trash2 size={14} />
                  <span>Sposta nel Cestino</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CleanUninstallModal;
