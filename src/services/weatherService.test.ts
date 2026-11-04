import { describe, expect, it } from 'vitest';
import {
  fetchWeatherData,
  generateWeatherStory,
  getOfflineFallbackReport,
  getWmoInfo,
} from './weatherService';

describe('weatherService', () => {
  it('correctly maps WMO codes to descriptions and icons', () => {
    const sun = getWmoInfo(0, true);
    expect(sun.description).toBe('Sereno');
    expect(sun.iconName).toBe('Sun');

    const moon = getWmoInfo(0, false);
    expect(moon.description).toBe('Sereno notturno');
    expect(moon.iconName).toBe('Moon');

    const rain = getWmoInfo(61, true);
    expect(rain.description).toBe('Pioggia');
    expect(rain.iconName).toBe('CloudRain');

    const snow = getWmoInfo(71, true);
    expect(snow.description).toBe('Neve');
    expect(snow.iconName).toBe('Snowflake');

    const storm = getWmoInfo(95, true);
    expect(storm.description).toBe('Temporale');
    expect(storm.iconName).toBe('CloudLightning');
  });

  it('generates offline fallback report with valid Bari data', () => {
    const report = getOfflineFallbackReport('Bari, Italia', 41.1171, 16.8719);
    expect(report.cityName).toBe('Bari, Italia');
    expect(report.current.temperature).toBeGreaterThan(0);
    expect(report.hourly.length).toBeGreaterThanOrEqual(5);
    expect(report.daily.length).toBe(5);
    expect(report.current.weatherDescription).toBe('Sereno');
  });

  it('generates an informative story description', () => {
    const report = getOfflineFallbackReport('Bari, Italia');
    const story = generateWeatherStory(report);
    expect(story).toContain('Bari');
    expect(story).toContain('°C');
    expect(story).toContain('massima');
  });

  it('fetches weather data or returns fallback gracefully', async () => {
    const report = await fetchWeatherData(41.1171, 16.8719, 'Bari, Italia');
    expect(report).toBeDefined();
    expect(report.cityName).toBe('Bari, Italia');
    expect(typeof report.current.temperature).toBe('number');
  });
});
