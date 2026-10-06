import styles from "./TravelOverlay.module.css";
import { RAIN_WEATHER } from "@/game/scenes";
import type { Weather } from "@/game/types";

type TravelOverlayProps = {
  location: string;
  method: "walk" | "bus" | "work";
  isNight: boolean;
  weather: Weather;
};

export default function TravelOverlay({
  location,
  method,
  isNight,
  weather,
}: TravelOverlayProps) {
  const isRainy = RAIN_WEATHER.includes(weather);
  const image =
    method === "work"
      ? "/images/locations/NeedleGroove/ethan_working.jpg"
      : method === "bus"
      ? isRainy
        ? "/images/Travel/busTravelRainy.png"
        : isNight
        ? "/images/Travel/busTravelNight.png"
        : "/images/Travel/busTravelDay.png"
      : isRainy
        ? "/images/Travel/walkingRainy.png"
        : isNight
          ? "/images/Travel/walkingNight.jpg"
          : "/images/Travel/walkingDay.jpg";

  return (
    <div className={styles.overlay}>
      <div
        className={styles.travelBackdrop}
        style={{ backgroundImage: `url(${image})` }}
      />
      <img
        className={styles.travelImage}
        src={image}
        alt=""
      />
      <div className={styles.shade} />
      <div className={styles.content}>
        <p className={styles.method}>
          {method === "work" ? "On shift" : method === "bus" ? "On the bus" : "On foot"}
        </p>
        <div className={styles.text}>
          {method === "work" ? `Working at ${location}` : `Traveling to ${location}`}
        </div>
        <span className={styles.progress} />
      </div>
    </div>
  );
}
