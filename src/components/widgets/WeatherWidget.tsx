import { memo, useCallback, useEffect, useState, type FC } from 'react';
import type { WeatherReport, WeatherWidgetStyle, WidgetConfig, WidgetSize } from '~types';
import { useVisibilityPause } from '@/context/VisibilityPauseContext';
import { fetchWeatherData, getOfflineFallbackReport } from '@/services/weatherService';
import { MinimalWeather } from './weather/MinimalWeather';
import { CompactWeather } from './weather/CompactWeather';
import { ForecastWeather } from './weather/ForecastWeather';
import { PanelWeather } from './weather/PanelWeather';
import { AlmanacWeather } from './weather/AlmanacWeather';
import { HorizonWeather } from './weather/HorizonWeather';
import { BoldWeather } from './weather/BoldWeather';
import { StoryWeather } from './weather/StoryWeather';

interface WeatherWidgetProps {
  widget: WidgetConfig;
  size?: WidgetSize;
  onUpdateWidget?: (patch: Partial<WidgetConfig>) => void;
}

export const WeatherWidget: FC<WeatherWidgetProps> = memo(({ widget, size = widget.size }) => {
  const { isAnimationPaused } = useVisibilityPause();
  const [report, setReport] = useState<WeatherReport>(() =>
    getOfflineFallbackReport(
      (widget.settings?.cityName as string) || 'Bari, Italia',
      (widget.settings?.latitude as number) || 41.1171,
      (widget.settings?.longitude as number) || 16.8719,
    ),
  );

  const style: WeatherWidgetStyle =
    (widget.settings?.style as WeatherWidgetStyle) || 'compact';

  const loadWeather = useCallback(async () => {
    const lat = (widget.settings?.latitude as number) || 41.1171;
    const lon = (widget.settings?.longitude as number) || 16.8719;
    const city = (widget.settings?.cityName as string) || 'Bari, Italia';

    try {
      const data = await fetchWeatherData(lat, lon, city);
      setReport(data);
    } catch (err) {
      console.warn('[WeatherWidget] Errore caricamento meteo:', err);
    }
  }, [widget.settings]);

  useEffect(() => {
    if (isAnimationPaused) return;

    void loadWeather();
    // Refresh ogni 15 minuti quando visibile
    const interval = window.setInterval(() => {
      void loadWeather();
    }, 15 * 60 * 1000);

    return () => window.clearInterval(interval);
  }, [isAnimationPaused, loadWeather]);

  switch (style) {
    case 'minimal':
      return <MinimalWeather report={report} size={size} />;
    case 'forecast':
      return <ForecastWeather report={report} size={size} />;
    case 'panel':
      return <PanelWeather report={report} size={size} />;
    case 'almanac':
      return <AlmanacWeather report={report} size={size} />;
    case 'horizon':
      return <HorizonWeather report={report} size={size} />;
    case 'bold':
      return <BoldWeather report={report} size={size} />;
    case 'story':
      return <StoryWeather report={report} size={size} />;
    case 'compact':
    default:
      return <CompactWeather report={report} size={size} />;
  }
});

WeatherWidget.displayName = 'WeatherWidget';
export default WeatherWidget;
