import React, { memo } from 'react';
import { Zap } from 'lucide-react';
import type { WorkflowItem } from '~types';

interface WorkflowIconProps {
  workflow: WorkflowItem;
  sizePx?: number;
}

export const WorkflowIcon: React.FC<WorkflowIconProps> = memo(({ workflow, sizePx = 80 }) => {
  const { iconStyle } = workflow;
  const totalActions = workflow.targetAppPaths.length + workflow.targetFinderPaths.length;
  const badgeSize = Math.max(16, Math.floor(sizePx * 0.28));

  // Stile Emoji
  if (iconStyle.type === 'emoji' && iconStyle.emoji) {
    return (
      <div
        style={{ width: sizePx, height: sizePx }}
        className="relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/25 to-fuchsia-500/25 backdrop-blur-2xl border border-white/25 shadow-xl shadow-black/40 group-hover:scale-105 transition-transform"
      >
        <span style={{ fontSize: Math.floor(sizePx * 0.48) }} role="img" aria-label={workflow.name}>
          {iconStyle.emoji}
        </span>

        {/* Badge conteggio azioni */}
        <div
          style={{ width: badgeSize, height: badgeSize }}
          className="absolute -top-1.5 -right-1.5 flex items-center justify-center rounded-full bg-amber-400 text-black font-bold text-[10px] shadow-md border border-black/20"
          title={`${totalActions} azioni collegate`}
        >
          {totalActions}
        </div>
      </div>
    );
  }

  // Stile Colore Custom
  if (iconStyle.type === 'color' && iconStyle.colorHex) {
    return (
      <div
        style={{
          width: sizePx,
          height: sizePx,
          backgroundColor: `${iconStyle.colorHex}33`,
          borderColor: `${iconStyle.colorHex}88`,
          boxShadow: `0 8px 24px ${iconStyle.colorHex}40`,
        }}
        className="relative flex items-center justify-center rounded-2xl backdrop-blur-2xl border group-hover:scale-105 transition-transform"
      >
        <Zap
          size={Math.floor(sizePx * 0.46)}
          style={{ color: iconStyle.colorHex }}
          className="drop-shadow-lg"
        />

        {/* Badge conteggio azioni */}
        <div
          style={{ width: badgeSize, height: badgeSize }}
          className="absolute -top-1.5 -right-1.5 flex items-center justify-center rounded-full bg-amber-400 text-black font-bold text-[10px] shadow-md border border-black/20"
          title={`${totalActions} azioni collegate`}
        >
          {totalActions}
        </div>
      </div>
    );
  }

  // Stile Predefinito: Gradiente Automazione Liquid Glass
  return (
    <div
      style={{ width: sizePx, height: sizePx }}
      className="relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/30 via-indigo-500/30 to-purple-600/30 backdrop-blur-2xl border border-white/30 shadow-xl shadow-indigo-500/20 group-hover:scale-105 transition-transform"
    >
      <Zap size={Math.floor(sizePx * 0.46)} className="text-yellow-300 drop-shadow-md" />

      {/* Badge conteggio azioni */}
      <div
        style={{ width: badgeSize, height: badgeSize }}
        className="absolute -top-1.5 -right-1.5 flex items-center justify-center rounded-full bg-amber-400 text-black font-bold text-[10px] shadow-md border border-black/20"
        title={`${totalActions} azioni collegate`}
      >
        {totalActions}
      </div>
    </div>
  );
});

WorkflowIcon.displayName = 'WorkflowIcon';
export default WorkflowIcon;
