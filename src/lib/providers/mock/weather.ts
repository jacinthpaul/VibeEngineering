import type { Coordinates, DailyWeather, WeatherData } from "@/lib/domain/types";
import type { WeatherProvider } from "@/lib/providers/types";
import { Rng } from "@/lib/util/rng";

function addDays(iso: string, delta: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

function makeDay(rng: Rng, date: string, baseTemp: number): DailyWeather {
  const rainChancePct = Math.round(rng.range(0, 100));
  const rainfallMm = rainChancePct > 55 ? Number(rng.range(2, 40).toFixed(1)) : 0;
  const condition =
    rainChancePct > 80
      ? rng.pick(["Thunderstorm", "Heavy Rain"])
      : rainChancePct > 55
        ? "Light Rain"
        : rng.pick(["Clear", "Partly Cloudy", "Cloudy"]);
  return {
    date,
    tempMinC: Math.round(baseTemp - rng.range(3, 7)),
    tempMaxC: Math.round(baseTemp + rng.range(2, 6)),
    rainfallMm,
    rainChancePct,
    windKph: Math.round(rng.range(5, 35)),
    condition,
  };
}

export const mockWeather: WeatherProvider = {
  async getWeather(coords: Coordinates, date: string): Promise<WeatherData> {
    const rng = new Rng(`weather:${coords.lat.toFixed(2)},${coords.lng.toFixed(2)}:${date}`);
    const baseTemp = 30 - (coords.lat - 15) * 0.6; // cooler further north/uphill

    const historical: DailyWeather[] = [];
    for (let i = 7; i >= 1; i--) {
      historical.push(makeDay(rng, addDays(date, -i), baseTemp));
    }
    const forecast: DailyWeather[] = [];
    for (let i = 0; i < 7; i++) {
      forecast.push(makeDay(rng, addDays(date, i), baseTemp));
    }

    const travelDay = forecast[0];
    const stormy = travelDay.rainChancePct > 70;
    const riderRisk: WeatherData["riderRisk"] = stormy
      ? "High"
      : travelDay.rainChancePct > 45
        ? "Medium"
        : "Low";

    // Weather score: penalize rain chance, rainfall and high wind.
    const weatherScore = Math.max(
      20,
      Math.round(
        100 - travelDay.rainChancePct * 0.5 - travelDay.rainfallMm - travelDay.windKph * 0.4,
      ),
    );

    const summary = stormy
      ? `Heavy rain likely near the destination on ${travelDay.date}. Expect reduced visibility in the afternoon — an early start before sunrise is strongly recommended.`
      : riderRisk === "Medium"
        ? `Scattered showers possible (${travelDay.rainChancePct}% chance). Carry rain gear and plan stops around midday cells.`
        : `Largely dry with ${travelDay.condition.toLowerCase()} skies and highs near ${travelDay.tempMaxC}°C. Great conditions for the drive.`;

    return { historical, forecast, summary, riderRisk, weatherScore };
  },
};
