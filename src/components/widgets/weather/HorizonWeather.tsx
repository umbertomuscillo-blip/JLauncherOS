import { type FC } from 'react';
import type { WeatherReport, WidgetSize } from '~types';
import { WeatherIconView } from './WeatherIconView';

interface WeatherStyleProps {
  report: WeatherReport;
  size?: WidgetSize;
}

export const HorizonWeather: FC<WeatherStyleProps> = ({ report }) => {
  const { current, hourly, cityName } = report;
  const hoursToShow = hourly.slice(0, 6);

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-3.5 rounded-3xl bg-neutral-900/75 backdrop-blur-2xl border border-white/20 shadow-2xl overflow-hidden text-white select-none">
      <div className="flex items-center justify-between pb-1">
        <span className="text-xs font-semibold text-white/90">{cityName.split(',')[0]} • Orizzonte Orario</span>
        <span className="text-xs font-bold text-amber-300">Ora: {Math.round(current.temperature)}°</span>
      </div>

      {/* Hourly trend strip */}
      <div className="flex items-center justify-between gap-1 py-1">
        {hoursToShow.map((h, i) => (
          <div
            key={h.time + i}
            className="flex-1 flex flex-col items-center p-1 rounded-xl bg-white/5 border border-white/5 text-center"
          >
            <span className="text-[9px] text-white/60 font-mono">{h.time}</span>
            <div className="my-1">
              <WeatherIconView iconName={h.weatherIcon} size={15} />
            </div>
            <span className="text-xs font-bold text-white">{h.temperature}°</span>
          </div>
        ))}
      </div>

      <div className="text-[10px] text-white/40 text-center font-mono">
        Previsione continua a 6 ore
      </div>
    </div>
  );
};
