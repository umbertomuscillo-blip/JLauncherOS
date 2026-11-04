import { type FC } from 'react';
import type { WeatherReport, WidgetSize } from '~types';
import { Droplets, Wind, SunMedium, Thermometer } from 'lucide-react';

interface WeatherStyleProps {
  report: WeatherReport;
  size?: WidgetSize;
}

export const PanelWeather: FC<WeatherStyleProps> = ({ report }) => {
  const { current, cityName } = report;

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-3.5 rounded-3xl bg-neutral-900/75 backdrop-blur-2xl border border-white/20 shadow-2xl overflow-hidden text-white select-none">
      <div className="flex items-center justify-between pb-1">
        <span className="text-xs font-semibold text-white/90">{cityName.split(',')[0]} • Meteo Panel</span>
        <span className="text-sm font-bold text-amber-300">{Math.round(current.temperature)}°C</span>
      </div>

      {/* 2x2 Grid of weather metrics */}
      <div className="grid grid-cols-2 gap-2 flex-1 pt-1">
        <div className="flex flex-col justify-center p-2 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-1.5 text-sky-400 text-[10px]">
            <Droplets size={12} />
            <span className="font-medium text-white/60">Umidità</span>
          </div>
          <span className="text-sm font-bold text-white mt-0.5">{current.humidity}%</span>
        </div>

        <div className="flex flex-col justify-center p-2 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-1.5 text-teal-400 text-[10px]">
            <Wind size={12} />
            <span className="font-medium text-white/60">Vento</span>
          </div>
          <span className="text-sm font-bold text-white mt-0.5">{Math.round(current.windSpeed)} km/h</span>
        </div>

        <div className="flex flex-col justify-center p-2 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-1.5 text-amber-400 text-[10px]">
            <SunMedium size={12} />
            <span className="font-medium text-white/60">Indice UV</span>
          </div>
          <span className="text-sm font-bold text-white mt-0.5">{Math.round(current.uvIndex)} / 10</span>
        </div>

        <div className="flex flex-col justify-center p-2 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-1.5 text-orange-400 text-[10px]">
            <Thermometer size={12} />
            <span className="font-medium text-white/60">Percepita</span>
          </div>
          <span className="text-sm font-bold text-white mt-0.5">{Math.round(current.apparentTemperature)}°C</span>
        </div>
      </div>
    </div>
  );
};
