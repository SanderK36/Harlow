import styles from "./TravelOverlay.module.css";

type TravelOverlayProps = {
  location: string;
  method: "walk" | "bus" | "work";
  isNight: boolean;
  /** Current weather is rain and the travel plate is not rain art. */
  rainy?: boolean;
};

export default function TravelOverlay({
  location,
  method,
  isNight,
  rainy = false,
}: TravelOverlayProps) {
  const image =
    method === "work"
      ? "/images/locations/NeedleGroove/ethan_working.jpg"
      : method === "bus"
      ? isNight
        ? "/images/Travel/busTravelNight.png"
        : "/images/Travel/busTravelDay.png"
      : "/images/Travel/walking.jpg";
  // The only walk plate is a dry night street. By day it is lifted so 8am
  // does not read as midnight; rain tints whatever plate is showing.
  const plateClass = [
    styles.travelImage,
    method === "walk" && !isNight ? styles.travelImageDay : "",
    rainy && isNight ? styles.travelImageRainNight : "",
    rainy && !isNight ? styles.travelImageRainDay : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={styles.overlay}>
      <div
        className={styles.travelBackdrop}
        style={{ backgroundImage: `url(${image})` }}
      />
      <img
        className={plateClass}
        src={image}
        alt=""
      />
      {rainy && (
        <div
          className={`${styles.travelSky} ${isNight ? styles.travelSkyNight : ""}`}
          aria-hidden="true"
        />
      )}
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
