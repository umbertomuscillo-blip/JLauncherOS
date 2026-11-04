import { type FC } from 'react';
import {
  Sun,
  Moon,
  CloudSun,
  CloudMoon,
  Cloud,
  CloudRain,
  CloudDrizzle,
  CloudLightning,
  Snowflake,
  CloudFog,
} from 'lucide-react';

interface WeatherIconViewProps {
  iconName: string;
  size?: number;
  className?: string;
}

export const WeatherIconView: FC<WeatherIconViewProps> = ({
  iconName,
  size = 24,
  className = '',
}) => {
  switch (iconName) {
    case 'Sun':
      return <Sun size={size} className={`text-amber-400 ${className}`} />;
    case 'Moon':
      return <Moon size={size} className={`text-indigo-300 ${className}`} />;
    case 'CloudSun':
      return <CloudSun size={size} className={`text-amber-300 ${className}`} />;
    case 'CloudMoon':
      return <CloudMoon size={size} className={`text-indigo-200 ${className}`} />;
    case 'Cloud':
      return <Cloud size={size} className={`text-slate-300 ${className}`} />;
    case 'CloudRain':
      return <CloudRain size={size} className={`text-blue-400 ${className}`} />;
    case 'CloudDrizzle':
      return <CloudDrizzle size={size} className={`text-teal-400 ${className}`} />;
    case 'CloudLightning':
      return <CloudLightning size={size} className={`text-purple-400 ${className}`} />;
    case 'Snowflake':
      return <Snowflake size={size} className={`text-sky-300 ${className}`} />;
    case 'CloudFog':
      return <CloudFog size={size} className={`text-zinc-400 ${className}`} />;
    default:
      return <CloudSun size={size} className={`text-amber-300 ${className}`} />;
  }
};
