import { type FC } from 'react';
import type { WeatherReport, WidgetSize } from '~types';
import { WeatherIconView } from './WeatherIconView';

interface WeatherStyleProps {
  report: WeatherReport;
  size?: WidgetSize;
}

export const BoldWeather: FC<WeatherStyleProps> = ({ report }) => {
  const { current, cityName } = report;

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-4 rounded-3xl bg-neutral-900/80 backdrop-blur-2xl border border-white/20 shadow-2xl overflow-hidden text-white select-none group">
      {/* Dynamic atmospheric gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/15 via-transparent to-blue-600/15 pointer-events-none" />

      <div className="relative z-10 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-white/70">
          {cityName.split(',')[0]}
        </span>
        <WeatherIconView iconName={current.weatherIcon} size={24} />
      </div>

      <div className="relative z-10 my-auto flex items-baseline gap-2">
        <span className="text-5xl font-black text-white tracking-tighter drop-shadow-md">
          {Math.round(current.temperature)}°
        </span>
        <span className="text-sm font-semibold text-white/80 leading-tight">
          {current.weatherDescription}
        </span>
      </div>

      <div className="relative z-10 flex justify-between text-[11px] text-white/60 font-mono border-t border-white/10 pt-1.5">
        <span>Massima {Math.round(current.high)}°</span>
        <span>Minima {Math.round(current.low)}°</span>
      </div>
    </div>
  );
};
