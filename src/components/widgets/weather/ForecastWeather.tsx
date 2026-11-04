import { type FC } from 'react';
import type { WeatherReport, WidgetSize } from '~types';
import { WeatherIconView } from './WeatherIconView';

interface WeatherStyleProps {
  report: WeatherReport;
  size?: WidgetSize;
}

export const ForecastWeather: FC<WeatherStyleProps> = ({ report }) => {
  const { current, daily, cityName } = report;

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-3.5 rounded-3xl bg-neutral-900/75 backdrop-blur-2xl border border-white/20 shadow-2xl overflow-hidden text-white select-none">
      {/* Current Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <WeatherIconView iconName={current.weatherIcon} size={22} />
          <div>
            <h4 className="text-xs font-semibold text-white truncate max-w-[120px]">
              {cityName.split(',')[0]}
            </h4>
            <p className="text-[10px] text-white/60">{current.weatherDescription}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xl font-bold text-white">{Math.round(current.temperature)}°</span>
          <span className="text-[10px] text-white/50 block font-mono">
            {Math.round(current.high)}° / {Math.round(current.low)}°
          </span>
        </div>
      </div>

      {/* Forecast list */}
      <div className="grid grid-cols-4 gap-1.5 pt-1">
        {daily.slice(0, 4).map((d) => (
          <div
            key={d.date}
            className="flex flex-col items-center p-1.5 rounded-xl bg-white/5 border border-white/5"
          >
            <span className="text-[10px] text-white/60 font-medium">{d.dayName}</span>
            <div className="my-1">
              <WeatherIconView iconName={d.weatherIcon} size={16} />
            </div>
            <span className="text-xs font-bold text-white">{Math.round(d.tempMax)}°</span>
            <span className="text-[9px] text-white/40 font-mono">{Math.round(d.tempMin)}°</span>
          </div>
        ))}
      </div>
    </div>
  );
};
