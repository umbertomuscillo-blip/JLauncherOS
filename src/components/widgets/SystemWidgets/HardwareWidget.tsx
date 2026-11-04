import { memo, useCallback, useEffect, useState, type FC } from 'react';
import { Cpu, Activity, Battery, BatteryCharging, Zap } from 'lucide-react';
import type { HardwareStats, HardwareWidgetStyle, WidgetConfig, WidgetSize } from '~types';
import { useVisibilityPause } from '@/context/VisibilityPauseContext';
import { getHardwareStats } from '@/services/tauriBridge';

interface HardwareWidgetProps {
  widget: WidgetConfig;
  size?: WidgetSize;
}

const CircularGauge: FC<{
  value: number;
  label: string;
  sublabel?: string;
  colorClass: string;
  icon?: React.ReactNode;
  sizePx?: number;
}> = ({ value, label, sublabel, colorClass, icon, sizePx = 76 }) => {
  const strokeWidth = 6;
  const radius = (sizePx - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.min(100, Math.max(0, value));
  const offset = circumference - (clampedValue / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center select-none">
      <div className="relative flex items-center justify-center" style={{ width: sizePx, height: sizePx }}>
        <svg className="w-full h-full -rotate-90">
          <circle
            cx={sizePx / 2}
            cy={sizePx / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={sizePx / 2}
            cy={sizePx / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={`${colorClass} transition-all duration-500 ease-out`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {icon && <div className="mb-0.5">{icon}</div>}
          <span className="text-xs font-bold text-white tracking-tight">{Math.round(value)}%</span>
        </div>
      </div>
      <span className="text-[10px] font-semibold text-white/80 uppercase tracking-wider mt-1">{label}</span>
      {sublabel && <span className="text-[9px] text-white/50 font-mono truncate max-w-[80px]">{sublabel}</span>}
    </div>
  );
};

export const HardwareWidget: FC<HardwareWidgetProps> = memo(({ widget, size = widget.size }) => {
  const { isAnimationPaused } = useVisibilityPause();
  const [stats, setStats] = useState<HardwareStats>({
    cpuUsage: 14.2,
    memoryUsedGb: 16.0,
    memoryTotalGb: 32.0,
    memoryPercentage: 50.0,
    battery: {
      percentage: 100,
      isCharging: false,
      isPlugged: true,
    },
  });

  const [cpuHistory, setCpuHistory] = useState<number[]>([12, 14, 18, 15, 22, 19, 14]);

  const style: HardwareWidgetStyle =
    (widget.settings?.style as HardwareWidgetStyle) || 'gauges';

  const pollStats = useCallback(async () => {
    try {
      const data = await getHardwareStats();
      setStats(data);
      setCpuHistory((prev) => {
        const next = [...prev, data.cpuUsage];
        if (next.length > 25) next.shift();
        return next;
      });
    } catch (err) {
      console.warn('[HardwareWidget] Errore lettura hardware:', err);
    }
  }, []);

  useEffect(() => {
    if (isAnimationPaused) return;

    void pollStats();
    const interval = window.setInterval(() => {
      void pollStats();
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isAnimationPaused, pollStats]);

  const batteryColor =
    stats.battery?.isCharging
      ? 'text-emerald-400'
      : (stats.battery?.percentage ?? 100) <= 20
      ? 'text-red-400'
      : (stats.battery?.percentage ?? 100) <= 40
      ? 'text-amber-400'
      : 'text-emerald-400';

  // ───────────────────────── 1. GAUGES STYLE ─────────────────────────
  if (style === 'gauges') {
    if (size === '1x1') {
      return (
        <div className="relative w-full h-full flex flex-col items-center justify-between p-2.5 rounded-3xl bg-neutral-900/75 backdrop-blur-2xl border border-white/20 shadow-2xl overflow-hidden text-white select-none">
          <div className="w-full flex items-center justify-between text-[10px] text-white/60 font-mono">
            <span className="flex items-center gap-1 font-semibold text-white/80">
              <Cpu size={12} className="text-cyan-400" />
              M4
            </span>
            <span>{Math.round(stats.cpuUsage)}%</span>
          </div>

          <div className="my-auto">
            <CircularGauge
              value={stats.cpuUsage}
              label="CPU"
              colorClass="text-cyan-400"
              sizePx={64}
            />
          </div>

          <div className="w-full flex justify-between text-[9px] text-white/50 font-mono border-t border-white/10 pt-1">
            <span>RAM {Math.round(stats.memoryPercentage)}%</span>
            <span>BAT {stats.battery ? `${stats.battery.percentage}%` : 'AC'}</span>
          </div>
        </div>
      );
    }

    return (
      <div className="relative w-full h-full flex flex-col justify-between p-3.5 rounded-3xl bg-neutral-900/75 backdrop-blur-2xl border border-white/20 shadow-2xl overflow-hidden text-white select-none">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-white/90">
            <Activity size={14} className="text-cyan-400 animate-pulse" />
            <span>Monitor di Sistema Apple Silicon</span>
          </div>
          <div className="text-[10px] text-white/50 font-mono">1.0s Refresh</div>
        </div>

        {/* 3 Radial Gauges */}
        <div className="flex items-center justify-around gap-2 my-auto py-1">
          <CircularGauge
            value={stats.cpuUsage}
            label="CPU"
            sublabel={`${Math.round(stats.cpuUsage)}%`}
            colorClass="text-cyan-400"
            icon={<Cpu size={13} className="text-cyan-300" />}
          />

          <CircularGauge
            value={stats.memoryPercentage}
            label="RAM"
            sublabel={`${stats.memoryUsedGb.toFixed(1)}/${stats.memoryTotalGb.toFixed(0)} GB`}
            colorClass="text-purple-400"
            icon={<Activity size={13} className="text-purple-300" />}
          />

          <CircularGauge
            value={stats.battery ? stats.battery.percentage : 100}
            label="Batteria"
            sublabel={stats.battery?.isCharging ? 'In Carica' : stats.battery?.timeRemaining || 'Alimentato'}
            colorClass={batteryColor}
            icon={
              stats.battery?.isCharging ? (
                <Zap size={13} className="text-amber-400 animate-bounce" />
              ) : (
                <Battery size={13} className={batteryColor} />
              )
            }
          />
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center text-[10px] text-white/50 pt-1 border-t border-white/5 font-mono">
          <span>Memoria: {stats.memoryUsedGb.toFixed(1)} GB usati</span>
          <span>{stats.battery ? `Stato: ${stats.battery.isCharging ? 'In carica' : 'Batteria'}` : 'Alimentazione: Rete AC'}</span>
        </div>
      </div>
    );
  }

  // ───────────────────────── 2. GRAPHS STYLE (Area Chart) ─────────────────────────
  if (style === 'graphs') {
    const maxVal = Math.max(100, ...cpuHistory);
    const points = cpuHistory
      .map((val, idx) => {
        const x = (idx / (cpuHistory.length - 1 || 1)) * 100;
        const y = 100 - (val / maxVal) * 80;
        return `${x},${y}`;
      })
      .join(' ');

    const areaPoints = `0,100 ${points} 100,100`;

    return (
      <div className="relative w-full h-full flex flex-col justify-between p-3.5 rounded-3xl bg-neutral-900/80 backdrop-blur-2xl border border-white/20 shadow-2xl overflow-hidden text-white select-none">
        <div className="flex items-center justify-between pb-1">
          <span className="text-xs font-semibold text-white/90 flex items-center gap-1.5">
            <Cpu size={14} className="text-blue-400" />
            Attività CPU Live
          </span>
          <span className="text-sm font-mono font-bold text-blue-400">{stats.cpuUsage.toFixed(1)}%</span>
        </div>

        {/* SVG Area Chart */}
        <div className="relative w-full h-20 my-1 rounded-xl bg-black/30 border border-white/5 overflow-hidden flex items-end">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <polygon points={areaPoints} fill="url(#cpuGradient)" />
            <polyline
              points={points}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* RAM & Battery horizontal progress bars */}
        <div className="flex flex-col gap-1.5 pt-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-white/60">RAM ({stats.memoryUsedGb.toFixed(1)} / {stats.memoryTotalGb.toFixed(0)} GB)</span>
            <span className="font-mono text-purple-300 font-bold">{Math.round(stats.memoryPercentage)}%</span>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-400 rounded-full transition-all duration-500"
              style={{ width: `${stats.memoryPercentage}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  // ───────────────────────── 3. MINIMAL STYLE ─────────────────────────
  return (
    <div className="relative w-full h-full flex flex-col justify-between p-3.5 rounded-3xl bg-neutral-900/75 backdrop-blur-2xl border border-white/20 shadow-2xl overflow-hidden text-white select-none">
      <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
        <span className="text-xs font-semibold text-white/90">Hardware Status</span>
        <span className="text-[10px] text-white/50 font-mono">Apple Silicon</span>
      </div>

      <div className="flex flex-col gap-2 my-auto py-1">
        {/* CPU row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-white/80">
            <Cpu size={14} className="text-cyan-400" />
            <span>CPU</span>
          </div>
          <div className="flex-1 max-w-[120px] h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-400 rounded-full transition-all duration-300"
              style={{ width: `${stats.cpuUsage}%` }}
            />
          </div>
          <span className="text-xs font-mono font-bold text-cyan-300 w-10 text-right">
            {Math.round(stats.cpuUsage)}%
          </span>
        </div>

        {/* RAM row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-white/80">
            <Activity size={14} className="text-purple-400" />
            <span>RAM</span>
          </div>
          <div className="flex-1 max-w-[120px] h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-400 rounded-full transition-all duration-300"
              style={{ width: `${stats.memoryPercentage}%` }}
            />
          </div>
          <span className="text-xs font-mono font-bold text-purple-300 w-10 text-right">
            {Math.round(stats.memoryPercentage)}%
          </span>
        </div>

        {/* Battery row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-white/80">
            {stats.battery?.isCharging ? (
              <BatteryCharging size={14} className="text-emerald-400" />
            ) : (
              <Battery size={14} className={batteryColor} />
            )}
            <span>Batteria</span>
          </div>
          <div className="flex-1 max-w-[120px] h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full ${stats.battery?.isCharging ? 'bg-emerald-400' : 'bg-emerald-500'} rounded-full transition-all duration-300`}
              style={{ width: `${stats.battery?.percentage ?? 100}%` }}
            />
          </div>
          <span className="text-xs font-mono font-bold text-emerald-300 w-10 text-right">
            {stats.battery ? `${stats.battery.percentage}%` : 'AC'}
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center text-[10px] text-white/50 pt-1 border-t border-white/5 font-mono">
        <span>RAM: {stats.memoryUsedGb.toFixed(1)} GB</span>
        <span>{stats.battery?.isCharging ? 'In ricarica rapida' : 'Pronto'}</span>
      </div>
    </div>
  );
});

HardwareWidget.displayName = 'HardwareWidget';
export default HardwareWidget;
