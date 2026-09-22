import type { GameState } from "./types";
import {
  getNextDay,
  getDaysInMonth,
  getNextMonth,
} from "./utils";

const weatherChances: Array<{
  weather: GameState["weather"];
  weight: number;
}> = [
  { weather: "Sunny", weight: 35 },
  { weather: "Cloudy", weight: 30 },
  { weather: "Rainy", weight: 18 },
  { weather: "Heavy rain", weight: 11 },
  { weather: "Thunderstorm", weight: 6 },
];

export function rollDailyWeather(): GameState["weather"] {
  const roll = Math.random() * 100;
  let threshold = 0;

  for (const chance of weatherChances) {
    threshold += chance.weight;

    if (roll < threshold) {
      return chance.weather;
    }
  }

  return "Sunny";
}

export function advanceTime(
  currentTime: number,
  minutes: number
) {
  const newTime = currentTime + minutes;

  if (newTime >= 1440) {
    const timeAfterMidnight =
      newTime - 1440;

    return {
      time: timeAfterMidnight,
      dayChanged: true,
    };
  }

  return {
    time: newTime,
    dayChanged: false,
  };
}

export function advanceGameTime(
  gameState: GameState,
  minutes: number
): GameState {
  const timeResult = advanceTime(
    gameState.time,
    minutes
  );

  const newGameState = {
    ...gameState,
    time: timeResult.time,
  };

  if (!timeResult.dayChanged) {
    return newGameState;
  }

  if (
    gameState.dayNumber ===
    getDaysInMonth(gameState.currentMonth)
  ) {
    return {
      ...newGameState,
      dayNumber: 1,
      dayOfWeek: getNextDay(
        gameState.dayOfWeek
      ),
      currentMonth: getNextMonth(
        gameState.currentMonth
      ),
      weather: rollDailyWeather(),
    };
  }

  return {
    ...newGameState,
    dayNumber:
      gameState.dayNumber + 1,
    dayOfWeek: getNextDay(
      gameState.dayOfWeek
    ),
    weather: rollDailyWeather(),
  };
}
