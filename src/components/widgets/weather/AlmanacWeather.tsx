import { type FC } from 'react';
import type { WeatherReport, WidgetSize } from '~types';
import { Sunrise, Sunset, Sun } from 'lucide-react';

interface WeatherStyleProps {
  report: WeatherReport;
  size?: WidgetSize;
}

export const AlmanacWeather: FC<WeatherStyleProps> = ({ report }) => {
  const { current, daily, cityName } = report;
  const today = daily[0];

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-3.5 rounded-3xl bg-neutral-900/75 backdrop-blur-2xl border border-white/20 shadow-2xl overflow-hidden text-white select-none">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1">
          <Sun size={12} />
          Almanacco Solare
        </span>
        <span className="text-xs text-white/60">{cityName.split(',')[0]}</span>
      </div>

      {/* Sun Arc Graphic */}
      <div className="relative my-2 flex flex-col items-center">
        <div className="w-full h-8 border-b-2 border-dashed border-amber-400/30 flex items-end justify-center relative">
          <div className="w-5 h-5 rounded-full bg-amber-400 shadow-lg shadow-amber-500/50 flex items-center justify-center -mb-2.5 animate-pulse">
            <div className="w-2 h-2 rounded-full bg-white" />
          </div>
        </div>
        <div className="w-full flex justify-between text-[11px] font-medium text-white/80 pt-2 px-1">
          <span className="flex items-center gap-1">
            <Sunrise size={13} className="text-amber-400" /> {today?.sunrise || '07:15'}
          </span>
          <span className="flex items-center gap-1">
            {today?.sunset || '18:10'} <Sunset size={13} className="text-orange-400" />
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[10px] text-white/50">
        <span>UV Max: {today?.uvIndexMax || 4}</span>
        <span>Arco: {current.isDay ? 'Giorno' : 'Notte'}</span>
        <span>{Math.round(current.temperature)}°C</span>
      </div>
    </div>
  );
};
