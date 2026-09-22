import type { DayOfWeek, Month } from "./types";

const days: DayOfWeek[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const months: Month[] = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
]

export function formatTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const minutesLeft = minutes % 60;
  const formattedMinutes = minutesLeft.toString().padStart(2, "0");
  const formattedHours = hours.toString().padStart(2, "0");

  return `${formattedHours}:${formattedMinutes}`;
}

export function getNextDay(day: DayOfWeek) {
    const index = days.indexOf(day);
    const nextIndex = (index + 1) % days.length;

    return days[nextIndex];
}

export function getDaysInMonth(month: Month) {
    switch (month) {
        case "January":
        case "March":
        case "May":
        case "July":
        case "August":
        case "October":
        case "December":
            return 31;

        case "September":
        case "November":
        case "April":
        case "June":
            return 30;

        case "February":
            return 28;
    }
}

export function getNextMonth(month: Month) {
    const index = months.indexOf(month);
    const nextIndex = (index + 1) % months.length;

    return months[nextIndex];
}

export function isNightTime(minutes: number) {
  return minutes >= 1080 || minutes < 360;
}