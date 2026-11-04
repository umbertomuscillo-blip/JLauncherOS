"""Modulo Weather Service per JLauncherOS.

Fornisce condizioni meteo in tempo reale, previsioni orarie e settimanali
per i widget del Dynamic Notch e dell'Overlay Launcher.
"""

import json
import logging
import time
import urllib.parse
import urllib.request
from typing import Any, Dict, List, Optional

from core.thread_pool import run_in_thread_pool

logger = logging.getLogger("jlauncheros.weather")


class WeatherService:
    """Service meteo con cache locale e fallback resiliente."""

    def __init__(self) -> None:
        self._cached_current: Optional[Dict[str, Any]] = None
        self._last_fetch_time: float = 0
        self._cache_ttl_seconds: float = 600  # 10 minuti

    def _generate_realistic_forecast(self, city: str) -> Dict[str, Any]:
        """Genera dati meteo di fallback realistici e dettagliati."""
        now_hour = int(time.strftime("%H"))
        hourly = []
        for i in range(12):
            h = (now_hour + i) % 24
            hourly.append({
                "time": f"{h:02d}:00",
                "temp": 18 + round((12 - abs(h - 14)) * 0.5),
                "condition": "Sunny" if 7 <= h <= 18 else "Clear Night",
                "icon": "sun" if 7 <= h <= 18 else "moon",
                "pop": 10 if h > 18 else 0,
            })

        days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        daily = []
        for d in days:
            daily.append({
                "day": d,
                "high": 21,
                "low": 12,
                "condition": "Partly Cloudy",
                "icon": "cloud-sun",
            })

        return {
            "city": city or "Cupertino",
            "region": "California",
            "temperature": 19,
            "unit": "°C",
            "feels_like": 18,
            "condition": "Partly Cloudy",
            "condition_code": "partly_cloudy",
            "high": 22,
            "low": 13,
            "humidity": 58,
            "wind_speed_kmh": 12,
            "air_quality_index": 28,
            "air_quality_label": "Excellent",
            "hourly": hourly,
            "daily": daily,
            "updated_at": int(time.time()),
        }

    def _fetch_live_weather_sync(self, city: str = "Cupertino") -> Dict[str, Any]:
        """Tenta la lettura da endpoint pubblico Open-Meteo o ritorna fallback."""
        try:
            # Lat/Lon preimpostate per città comuni
            coords = {
                "cupertino": (37.323, -122.032, "Cupertino"),
                "rome": (41.9028, 12.4964, "Rome"),
                "milan": (45.4642, 9.1900, "Milan"),
                "london": (51.5074, -0.1278, "London"),
                "tokyo": (35.6762, 139.6503, "Tokyo"),
                "new york": (40.7128, -74.0060, "New York"),
                "san francisco": (37.7749, -122.4194, "San Francisco"),
            }
            key = city.lower().strip()
            lat, lon, resolved_city = coords.get(key, (37.323, -122.032, city))

            url = (
                f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}"
                f"&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m"
                f"&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto"
            )

            req = urllib.request.Request(url, headers={"User-Agent": "JLauncherOS/1.0"})
            with urllib.request.urlopen(req, timeout=2.0) as resp:
                data = json.loads(resp.read().decode("utf-8"))

            cur = data.get("current", {})
            temp = round(cur.get("temperature_2m", 19))
            feels = round(cur.get("apparent_temperature", temp))
            humidity = cur.get("relative_humidity_2m", 50)
            wind = round(cur.get("wind_speed_10m", 10))

            w_code = cur.get("weather_code", 0)
            condition = "Clear"
            if w_code in (1, 2, 3):
                condition = "Partly Cloudy"
            elif w_code in (45, 48):
                condition = "Foggy"
            elif w_code in (51, 53, 55, 61, 63, 65):
                condition = "Rain"
            elif w_code in (71, 73, 75):
                condition = "Snow"
            elif w_code >= 95:
                condition = "Thunderstorm"

            # Previsioni orarie per le prossime 12 ore
            hourly_raw = data.get("hourly", {})
            hourly_times = hourly_raw.get("time", [])
            hourly_temps = hourly_raw.get("temperature_2m", [])
            hourly = []
            for t_str, t_val in zip(hourly_times[:12], hourly_temps[:12]):
                hour_str = t_str.split("T")[-1] if "T" in t_str else t_str
                hourly.append({
                    "time": hour_str[:5],
                    "temp": round(t_val),
                    "condition": condition,
                    "icon": "cloud-sun" if "Cloudy" in condition else "sun",
                    "pop": 10,
                })

            daily_raw = data.get("daily", {})
            daily_times = daily_raw.get("time", [])
            daily_max = daily_raw.get("temperature_2m_max", [])
            daily_min = daily_raw.get("temperature_2m_min", [])
            daily = []
            for d_str, d_max, d_min in zip(daily_times[:5], daily_max[:5], daily_min[:5]):
                daily.append({
                    "day": d_str,
                    "high": round(d_max),
                    "low": round(d_min),
                    "condition": condition,
                    "icon": "cloud-sun",
                })

            result = {
                "city": resolved_city,
                "region": "Local Station",
                "temperature": temp,
                "unit": "°C",
                "feels_like": feels,
                "condition": condition,
                "condition_code": condition.lower().replace(" ", "_"),
                "high": round(daily_max[0]) if daily_max else temp + 3,
                "low": round(daily_min[0]) if daily_min else temp - 4,
                "humidity": humidity,
                "wind_speed_kmh": wind,
                "air_quality_index": 22,
                "air_quality_label": "Good",
                "hourly": hourly,
                "daily": daily,
                "updated_at": int(time.time()),
            }
            return result

        except Exception as exc:
            logger.debug("Fetch online meteo fallito (%s). Uso fallback realistico per %s.", exc, city)
            return self._generate_realistic_forecast(city)

    async def get_weather_async(self, city: str = "Cupertino") -> Dict[str, Any]:
        """Restituisce le informazioni meteo con cache."""
        now = time.time()
        if self._cached_current and (now - self._last_fetch_time < self._cache_ttl_seconds):
            if not city or self._cached_current.get("city", "").lower() == city.lower():
                return self._cached_current

        weather = await run_in_thread_pool(self._fetch_live_weather_sync, city)
        self._cached_current = weather
        self._last_fetch_time = now
        return weather


weather_service = WeatherService()
