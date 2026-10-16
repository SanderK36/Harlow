import { MAP_MARKERS, MAP_PINS } from "@/game/map";

function at(id: (typeof MAP_PINS)[number]["id"] | keyof typeof MAP_MARKERS) {
  const pin = MAP_PINS.find((item) => item.id === id);
  if (pin) return { x: pin.x, y: pin.y };
  return MAP_MARKERS[id as keyof typeof MAP_MARKERS];
}

/** A slightly bowed road so the ink does not look ruled. */
function road(points: { x: number; y: number }[]) {
  if (points.length === 0) return "";
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const next = points[index];
    const dx = next.x - previous.x;
    const dy = next.y - previous.y;
    const length = Math.hypot(dx, dy) || 1;
    const bend = length > 18 ? 1.8 : 0.8;
    const cx = (previous.x + next.x) / 2 + (-dy / length) * bend;
    const cy = (previous.y + next.y) / 2 + (dx / length) * bend;
    path += ` Q ${cx.toFixed(2)} ${cy.toFixed(2)} ${next.x} ${next.y}`;
  }
  return path;
}

const home = at("front-yard");
const street = at("street");
const bus = at("bus-stop");
const diner = at("diner");
const gas = at("gas-station");
const motel = at("motel");
const needle = at("needle-and-groove");
const sanatorium = at("sanatorium");
const police = at("police-station");
const cemetery = at("cementary");
const hospital = at("hospital");
const scrapyard = at("scrapyard");

const mainRoad = road([home, street, bus, diner, gas, motel]);
const ridgeRoad = road([bus, needle, sanatorium]);
const civicRoad = road([diner, police, cemetery]);
const hospitalRoad = road([gas, hospital]);
const yardRoad = road([diner, scrapyard]);

/**
 * A 1982 town plat drawn in ink. Place names and pins sit in HTML on top
 * so they stay in the notebook face and keep a real hit target.
 */
export default function HarlowMapArt() {
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <filter id="harlow-map-grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <pattern id="harlow-map-hatch" width="2.2" height="2.2" patternUnits="userSpaceOnUse">
          <path d="M0 2.2 L2.2 0" stroke="rgba(70,48,24,.28)" strokeWidth="0.25" />
        </pattern>
      </defs>

      <rect width="100" height="100" fill="#e4cfaa" />
      <rect width="100" height="100" fill="url(#harlow-map-hatch)" opacity="0.35" />
      <rect width="100" height="100" filter="url(#harlow-map-grain)" opacity="0.16" />

      <ellipse cx="18" cy="22" rx="16" ry="12" fill="rgba(86, 62, 28, 0.08)" />
      <ellipse cx="14" cy="14" rx="9" ry="6.2" fill="none" stroke="rgba(48,32,16,.35)" strokeWidth="0.7" vectorEffect="non-scaling-stroke" />
      <ellipse cx="14" cy="14" rx="13.5" ry="9" fill="none" stroke="rgba(48,32,16,.22)" strokeWidth="0.6" vectorEffect="non-scaling-stroke" />

      <path
        d="M0 93 C18 90, 28 96, 46 92 S74 88, 100 94"
        fill="none"
        stroke="rgba(48, 62, 70, 0.45)"
        strokeWidth="1.4"
        vectorEffect="non-scaling-stroke"
      />

      <path
        d={yardRoad}
        fill="none"
        stroke="#1c140e"
        strokeWidth="1.3"
        strokeDasharray="5 4"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />

      <path d={ridgeRoad} fill="none" stroke="#1c140e" strokeWidth="2.1" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <path d={civicRoad} fill="none" stroke="#1c140e" strokeWidth="2.1" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <path d={hospitalRoad} fill="none" stroke="#1c140e" strokeWidth="2.1" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <path d={mainRoad} fill="none" stroke="#1c140e" strokeWidth="3.4" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <path d={mainRoad} fill="none" stroke="#e7d3b0" strokeWidth="1" strokeLinecap="round" vectorEffect="non-scaling-stroke" />

      <rect x="1.4" y="1.4" width="97.2" height="97.2" fill="none" stroke="#2a1c12" strokeWidth="1.1" vectorEffect="non-scaling-stroke" />
      <rect x="2.6" y="2.6" width="94.8" height="94.8" fill="none" stroke="#2a1c12" strokeWidth="0.4" vectorEffect="non-scaling-stroke" />

      <ellipse cx="78" cy="78" rx="7.5" ry="5.2" fill="none" stroke="rgba(92, 54, 24, 0.22)" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
