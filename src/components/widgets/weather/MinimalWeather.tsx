import { type FC } from 'react';
import type { WeatherReport, WidgetSize } from '~types';
import { WeatherIconView } from './WeatherIconView';

interface WeatherStyleProps {
  report: WeatherReport;
  size: WidgetSize;
}

export const MinimalWeather: FC<WeatherStyleProps> = ({ report, size }) => {
  const { current, cityName } = report;
  const is1x1 = size === '1x1';

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-3 rounded-3xl bg-neutral-900/70 backdrop-blur-2xl border border-white/20 shadow-2xl overflow-hidden text-white select-none">
      <div className="w-full flex items-center justify-between text-xs text-white/70">
        <span className="truncate max-w-[120px] font-medium">{cityName.split(',')[0]}</span>
        <WeatherIconView iconName={current.weatherIcon} size={is1x1 ? 20 : 24} />
      </div>

      <div className="flex flex-col items-center my-auto">
        <span className={`${is1x1 ? 'text-2xl' : 'text-3xl font-extrabold'} text-white tracking-tight`}>
          {Math.round(current.temperature)}°
        </span>
        <span className="text-[11px] text-white/80 font-medium text-center truncate max-w-[140px]">
          {current.weatherDescription}
        </span>
      </div>

      <div className="w-full flex justify-between text-[10px] text-white/50 font-mono">
        <span>H: {Math.round(current.high)}°</span>
        <span>L: {Math.round(current.low)}°</span>
      </div>
    </div>
  );
};
