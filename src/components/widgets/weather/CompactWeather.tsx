import { type FC } from 'react';
import type { WeatherReport, WidgetSize } from '~types';
import { WeatherIconView } from './WeatherIconView';
import { MapPin } from 'lucide-react';

interface WeatherStyleProps {
  report: WeatherReport;
  size?: WidgetSize;
}

export const CompactWeather: FC<WeatherStyleProps> = ({ report }) => {
  const { current, cityName } = report;

  return (
    <div className="relative w-full h-full flex items-center justify-between p-3.5 rounded-3xl bg-neutral-900/70 backdrop-blur-2xl border border-white/20 shadow-2xl overflow-hidden text-white select-none">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-inner">
          <WeatherIconView iconName={current.weatherIcon} size={28} />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1 text-[11px] text-white/60">
            <MapPin size={11} className="text-amber-400" />
            <span className="truncate max-w-[100px] font-medium">{cityName.split(',')[0]}</span>
          </div>
          <span className="text-sm font-semibold text-white/95 truncate">
            {current.weatherDescription}
          </span>
          <span className="text-[10px] text-white/50">
            Percepiti {Math.round(current.apparentTemperature)}°
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end">
        <span className="text-3xl font-black text-white tracking-tighter">
          {Math.round(current.temperature)}°
        </span>
        <div className="flex gap-1.5 text-[10px] text-white/60 font-mono mt-0.5">
          <span className="text-amber-300">▲ {Math.round(current.high)}°</span>
          <span className="text-sky-300">▼ {Math.round(current.low)}°</span>
        </div>
      </div>
    </div>
  );
};
