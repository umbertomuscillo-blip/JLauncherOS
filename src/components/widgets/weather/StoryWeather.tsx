import { type FC } from 'react';
import type { WeatherReport, WidgetSize } from '~types';
import { generateWeatherStory } from '@/services/weatherService';
import { BookOpen } from 'lucide-react';
import { WeatherIconView } from './WeatherIconView';

interface WeatherStyleProps {
  report: WeatherReport;
  size?: WidgetSize;
}

export const StoryWeather: FC<WeatherStyleProps> = ({ report }) => {
  const { current, cityName } = report;
  const story = generateWeatherStory(report);

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-3.5 rounded-3xl bg-neutral-900/80 backdrop-blur-2xl border border-white/20 shadow-2xl overflow-hidden text-white select-none">
      <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
        <span className="text-[11px] font-semibold text-amber-300 flex items-center gap-1.5">
          <BookOpen size={13} />
          Meteo Story • {cityName.split(',')[0]}
        </span>
        <div className="flex items-center gap-1">
          <WeatherIconView iconName={current.weatherIcon} size={16} />
          <span className="text-xs font-bold text-white">{Math.round(current.temperature)}°C</span>
        </div>
      </div>

      <div className="my-auto py-1">
        <p className="text-xs text-white/90 leading-relaxed font-serif italic">
          "{story}"
        </p>
      </div>

      <div className="flex justify-between items-center text-[10px] text-white/50 pt-1 border-t border-white/5 font-mono">
        <span>Vento: {Math.round(current.windSpeed)} km/h</span>
        <span>Umidità: {current.humidity}%</span>
      </div>
    </div>
  );
};
