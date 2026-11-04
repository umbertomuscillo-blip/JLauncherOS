import type {
  CurrentWeather,
  DailyForecast,
  HourlyForecast,
  WeatherReport,
} from '~types';

export interface WmoInfo {
  description: string;
  iconName:
    | 'Sun'
    | 'Moon'
    | 'CloudSun'
    | 'CloudMoon'
    | 'Cloud'
    | 'CloudRain'
    | 'CloudDrizzle'
    | 'CloudLightning'
    | 'Snowflake'
    | 'CloudFog';
  gradient: string;
  accentColor: string;
}

export function getWmoInfo(code: number, isDay: boolean = true): WmoInfo {
  switch (code) {
    case 0:
      return isDay
        ? {
            description: 'Sereno',
            iconName: 'Sun',
            gradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
            accentColor: '#f59e0b',
          }
        : {
            description: 'Sereno notturno',
            iconName: 'Moon',
            gradient: 'from-indigo-600/25 via-slate-900/40 to-transparent',
            accentColor: '#818cf8',
          };
    case 1:
      return {
        description: 'Prevalentemente sereno',
        iconName: isDay ? 'CloudSun' : 'CloudMoon',
        gradient: 'from-amber-400/15 via-blue-500/10 to-transparent',
        accentColor: '#fbbf24',
      };
    case 2:
      return {
        description: 'Parzialmente nuvoloso',
        iconName: isDay ? 'CloudSun' : 'CloudMoon',
        gradient: 'from-slate-400/20 via-blue-500/10 to-transparent',
        accentColor: '#93c5fd',
      };
    case 3:
      return {
        description: 'Coperto',
        iconName: 'Cloud',
        gradient: 'from-slate-500/25 via-slate-700/20 to-transparent',
        accentColor: '#94a3b8',
      };
    case 45:
    case 48:
      return {
        description: 'Nebbia',
        iconName: 'CloudFog',
        gradient: 'from-zinc-400/25 via-zinc-600/15 to-transparent',
        accentColor: '#a1a1aa',
      };
    case 51:
    case 53:
    case 55:
      return {
        description: 'Pioggerella',
        iconName: 'CloudDrizzle',
        gradient: 'from-teal-500/20 via-cyan-600/10 to-transparent',
        accentColor: '#2dd4bf',
      };
    case 61:
    case 63:
    case 65:
      return {
        description: 'Pioggia',
        iconName: 'CloudRain',
        gradient: 'from-blue-600/25 via-indigo-900/30 to-transparent',
        accentColor: '#60a5fa',
      };
    case 71:
    case 73:
    case 75:
      return {
        description: 'Neve',
        iconName: 'Snowflake',
        gradient: 'from-sky-300/30 via-indigo-400/15 to-transparent',
        accentColor: '#bae6fd',
      };
    case 80:
    case 81:
    case 82:
      return {
        description: 'Rovesci di pioggia',
        iconName: 'CloudRain',
        gradient: 'from-blue-700/30 via-slate-900/40 to-transparent',
        accentColor: '#3b82f6',
      };
    case 95:
    case 96:
    case 99:
      return {
        description: 'Temporale',
        iconName: 'CloudLightning',
        gradient: 'from-purple-600/30 via-violet-900/40 to-transparent',
        accentColor: '#c084fc',
      };
    default:
      return {
        description: 'Variabile',
        iconName: 'CloudSun',
        gradient: 'from-blue-500/20 via-slate-600/10 to-transparent',
        accentColor: '#60a5fa',
      };
  }
}

export function generateWeatherStory(report: WeatherReport): string {
  const { current, daily, cityName } = report;
  const today = daily[0];
  const max = today ? Math.round(today.tempMax) : Math.round(current.high);
  const min = today ? Math.round(today.tempMin) : Math.round(current.low);
  const temp = Math.round(current.temperature);

  const base = `A ${cityName} attualmente ci sono ${temp}°C con cielo ${current.weatherDescription.toLowerCase()}.`;
  const range = `La massima prevista è di ${max}°C con minima a ${min}°C.`;
  const extra =
    current.humidity > 70
      ? `Umidità elevata (${current.humidity}%).`
      : current.windSpeed > 20
      ? `Vento sostenuto a ${Math.round(current.windSpeed)} km/h.`
      : current.uvIndex > 5
      ? `Indice UV alto (${Math.round(current.uvIndex)}).`
      : `Vento moderato a ${Math.round(current.windSpeed)} km/h.`;

  return `${base} ${range} ${extra}`;
}

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minuti

interface CachedWeather {
  timestamp: number;
  data: WeatherReport;
}

let weatherCache: CachedWeather | null = null;

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

export async function fetchWeatherData(
  latitude = 41.1171,
  longitude = 16.8719,
  cityName = 'Bari, Italia',
): Promise<WeatherReport> {
  const now = Date.now();
  if (weatherCache && now - weatherCache.timestamp < CACHE_TTL_MS) {
    return weatherCache.data;
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,weather_code,apparent_temperature,precipitation_probability,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&timezone=auto`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Open-Meteo HTTP ${res.status}`);
    }

    const json = await res.json();
    const cw = json.current_weather ?? {};
    const hourlyRaw = json.hourly ?? {};
    const dailyRaw = json.daily ?? {};

    const isDay = cw.is_day === 1;
    const wCode = typeof cw.weathercode === 'number' ? cw.weathercode : 0;
    const wmo = getWmoInfo(wCode, isDay);

    // Trova l'ora attuale per estrarre umidità e UV orari
    const currentHourIso = (cw.time as string) || '';
    const hourlyTimes: string[] = hourlyRaw.time || [];
    let curIndex = hourlyTimes.findIndex((t) => t.startsWith(currentHourIso.slice(0, 13)));
    if (curIndex === -1) curIndex = 0;

    const humidity = hourlyRaw.relative_humidity_2m?.[curIndex] ?? 50;
    const apparentTemp = hourlyRaw.apparent_temperature?.[curIndex] ?? cw.temperature ?? 20;
    const uvIndex = hourlyRaw.uv_index?.[curIndex] ?? 3;

    const dailyHigh = dailyRaw.temperature_2m_max?.[0] ?? (cw.temperature ?? 20) + 3;
    const dailyLow = dailyRaw.temperature_2m_min?.[0] ?? (cw.temperature ?? 20) - 3;

    const current: CurrentWeather = {
      temperature: Math.round((cw.temperature ?? 20) * 10) / 10,
      apparentTemperature: Math.round(apparentTemp * 10) / 10,
      humidity: Math.round(humidity),
      weatherCode: wCode,
      weatherDescription: wmo.description,
      weatherIcon: wmo.iconName,
      windSpeed: Math.round((cw.windspeed ?? 10) * 10) / 10,
      uvIndex: Math.round(uvIndex * 10) / 10,
      isDay,
      high: Math.round(dailyHigh * 10) / 10,
      low: Math.round(dailyLow * 10) / 10,
    };

    // Costruisci le prossime 12 ore
    const hourly: HourlyForecast[] = [];
    const maxHourly = Math.min(hourlyTimes.length, curIndex + 12);
    for (let i = curIndex; i < maxHourly; i++) {
      const timeStr = hourlyTimes[i] || '';
      const hourPart = timeStr.slice(11, 16) || `${i % 24}:00`;
      const code = hourlyRaw.weather_code?.[i] ?? 0;
      const hWmo = getWmoInfo(code, true);

      hourly.push({
        time: hourPart,
        hour: parseInt(hourPart.slice(0, 2), 10) || 0,
        temperature: Math.round(hourlyRaw.temperature_2m?.[i] ?? 20),
        weatherCode: code,
        weatherIcon: hWmo.iconName,
        precipitationProbability: Math.round(hourlyRaw.precipitation_probability?.[i] ?? 0),
      });
    }

    // Costruisci i prossimi 5 giorni
    const daily: DailyForecast[] = [];
    const dailyDates: string[] = dailyRaw.time || [];
    const maxDays = Math.min(dailyDates.length, 5);
    for (let d = 0; d < maxDays; d++) {
      const dateStr = dailyDates[d] || '';
      const dateObj = new Date(dateStr);
      const dayName = d === 0 ? 'Oggi' : DAY_NAMES[dateObj.getDay()] || 'Giorno';
      const code = dailyRaw.weather_code?.[d] ?? 0;
      const dWmo = getWmoInfo(code, true);

      daily.push({
        date: dateStr,
        dayName,
        weatherCode: code,
        weatherDescription: dWmo.description,
        weatherIcon: dWmo.iconName,
        tempMax: Math.round(dailyRaw.temperature_2m_max?.[d] ?? 22),
        tempMin: Math.round(dailyRaw.temperature_2m_min?.[d] ?? 14),
        sunrise: (dailyRaw.sunrise?.[d] || '').slice(11, 16) || '06:30',
        sunset: (dailyRaw.sunset?.[d] || '').slice(11, 16) || '19:45',
        uvIndexMax: Math.round(dailyRaw.uv_index_max?.[d] ?? 4),
      });
    }

    const report: WeatherReport = {
      cityName,
      coordinates: { latitude, longitude },
      current,
      hourly,
      daily,
      updatedAt: now,
    };

    weatherCache = { timestamp: now, data: report };
    return report;
  } catch (err) {
    console.warn('[weatherService] Fetch fallito, uso cache o fallback offline:', err);
    if (weatherCache) {
      return weatherCache.data;
    }
    return getOfflineFallbackReport(cityName, latitude, longitude);
  }
}

export function getOfflineFallbackReport(
  cityName = 'Bari, Italia',
  latitude = 41.1171,
  longitude = 16.8719,
): WeatherReport {
  const current: CurrentWeather = {
    temperature: 21,
    apparentTemperature: 21.5,
    humidity: 58,
    weatherCode: 0,
    weatherDescription: 'Sereno',
    weatherIcon: 'Sun',
    windSpeed: 14,
    uvIndex: 4,
    isDay: true,
    high: 23,
    low: 15,
  };

  const hourly: HourlyForecast[] = [
    { time: '12:00', hour: 12, temperature: 21, weatherCode: 0, weatherIcon: 'Sun', precipitationProbability: 0 },
    { time: '14:00', hour: 14, temperature: 23, weatherCode: 0, weatherIcon: 'Sun', precipitationProbability: 0 },
    { time: '16:00', hour: 16, temperature: 22, weatherCode: 1, weatherIcon: 'CloudSun', precipitationProbability: 5 },
    { time: '18:00', hour: 18, temperature: 19, weatherCode: 1, weatherIcon: 'CloudSun', precipitationProbability: 10 },
    { time: '20:00', hour: 20, temperature: 17, weatherCode: 0, weatherIcon: 'Moon', precipitationProbability: 0 },
    { time: '22:00', hour: 22, temperature: 16, weatherCode: 0, weatherIcon: 'Moon', precipitationProbability: 0 },
  ];

  const daily: DailyForecast[] = [
    { date: '2026-10-23', dayName: 'Oggi', weatherCode: 0, weatherDescription: 'Sereno', weatherIcon: 'Sun', tempMax: 23, tempMin: 15, sunrise: '07:15', sunset: '18:10', uvIndexMax: 4 },
    { date: '2026-10-24', dayName: 'Sab', weatherCode: 1, weatherDescription: 'Poco nuvoloso', weatherIcon: 'CloudSun', tempMax: 22, tempMin: 14, sunrise: '07:16', sunset: '18:08', uvIndexMax: 4 },
    { date: '2026-10-25', dayName: 'Dom', weatherCode: 2, weatherDescription: 'Parzialmente nuvoloso', weatherIcon: 'CloudSun', tempMax: 20, tempMin: 13, sunrise: '07:17', sunset: '18:07', uvIndexMax: 3 },
    { date: '2026-10-26', dayName: 'Lun', weatherCode: 61, weatherDescription: 'Pioggia leggera', weatherIcon: 'CloudRain', tempMax: 18, tempMin: 12, sunrise: '07:18', sunset: '18:05', uvIndexMax: 2 },
    { date: '2026-10-27', dayName: 'Mar', weatherCode: 0, weatherDescription: 'Sereno', weatherIcon: 'Sun', tempMax: 21, tempMin: 13, sunrise: '07:19', sunset: '18:04', uvIndexMax: 4 },
  ];

  return {
    cityName,
    coordinates: { latitude, longitude },
    current,
    hourly,
    daily,
    updatedAt: Date.now(),
  };
}
