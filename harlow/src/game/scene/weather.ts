import type { DayOfWeek, Weather } from "../types";

/** The weather states that count as rain (for rain-on-the-window art). */
export const RAIN_WEATHER: Weather[] = ["Rainy", "Heavy rain", "Thunderstorm"];

// Weather groups for weather-gated narration and thoughts. They apply day
// and night (it still rains after dark), unless a line also has a time range.
export const RAIN: Weather[] = ["Rainy", "Heavy rain"];
export const STORM: Weather[] = ["Thunderstorm"];
export const WET: Weather[] = RAIN_WEATHER;
export const DRY: Weather[] = ["Sunny", "Cloudy"];
export const HEAVY: Weather[] = ["Heavy rain", "Thunderstorm"];
export const WEEKDAYS: DayOfWeek[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];
export const WEEKEND: DayOfWeek[] = ["Saturday", "Sunday"];

/** Rain art for every rainy weather state (thunder art for storms if given). */
export function rainArt(
  rain: string,
  thunder = rain,
): Partial<Record<Weather, string>> {
  return { Rainy: rain, "Heavy rain": rain, Thunderstorm: thunder };
}
