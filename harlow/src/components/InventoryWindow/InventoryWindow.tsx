import { useRef, useState } from "react";
import ActionButton from "@/components/ActionButton/ActionButton";
import styles from "./InventoryWindow.module.css";

type InventoryWindowProps = {
  inventory: string[];
  onClose: () => void;
  onUseItem: (item: string) => void;
};

const itemBios: Record<string, string> = {
  beer: "A bottle of beer to take the edge off. Lowers fear by 10 when consumed.",
  cigarettes: "A pack of cigarettes for a smoke break. Lowers fear by 5 when consumed.",
  "house key": "The key to Ethan’s home. No stat effect.",
  flashlight: "A handheld light for dark places. No stat effect.",
  knife: "A small, sharp blade found at the scrapyard. No stat effect.",
  "sturdy crowbar": "A solid tool received for taking the scrapyard job. No stat effect.",
  "steel maiden": "A Steel Maiden record from Needle & Groove. A collectible with no stat effect.",
  "high volts": "A High Volts record from Needle & Groove. A collectible with no stat effect.",
  "leopard hazard": "A Leopard Hazard record from Needle & Groove. A collectible with no stat effect.",
  "puppet masters": "A Puppet Masters record from Needle & Groove. A collectible with no stat effect.",
  "ricky valentine": "A Ricky Valentine record from Needle & Groove. A collectible with no stat effect.",
};

function getItemImage(item: string) {
  // Inventory uses item names as IDs. When adding an item, add its name/image
  // mapping here (or return null to display it without an image).
  switch (item.toLowerCase()) {
    case "house key":
      return "/images/items/HouseKey.png";

    case "cigarettes":
      return "/images/items/Cigarettes.png";

    case "flashlight":
      return "/images/items/Flashlight.png";

    case "knife":
      return "/images/items/Knife.png";

    case "beer":
      return "/images/items/beer.png";

    case "sturdy crowbar":
      return null;

    case "steel maiden":
      return "/images/locations/NeedleGroove/shop/SteelMaiden.png";

    case "high volts":
      return "/images/locations/NeedleGroove/shop/HighVolts.png";

    case "leopard hazard":
      return "/images/locations/NeedleGroove/shop/LeopardHazard.png";

    case "puppet masters":
      return "/images/locations/NeedleGroove/shop/PuppetMasters.png";

    case "ricky valentine":
      return "/images/locations/NeedleGroove/shop/RickyValentine.png";

    default:
      return null;
  }
}

export default function InventoryWindow({
  inventory,
  onClose,
  onUseItem,
}: InventoryWindowProps) {
  const feedbackRef = useRef<HTMLDialogElement>(null);
  const [consumedItem, setConsumedItem] = useState("Beer");
  const items = Object.entries(
    inventory.reduce<Record<string, number>>(
      (counts, item) => ({
        ...counts,
        [item]: (counts[item] ?? 0) + 1,
      }),
      {}
    )
  );

  return (
    <div className={styles.overlay}>
      <div className={styles.window}>

        <h2>INVENTORY</h2>

        <div className={styles.grid}>
          {items.map(([item, quantity]) => {
            const image = getItemImage(item);
            const isBeer = item === "Beer";
            const isConsumable = isBeer || item === "Cigarettes";
            const Slot = isConsumable ? "button" : "div";
            const bio = itemBios[item.toLowerCase()] ?? "An item in your inventory. No stat effect.";

            return (
              <div key={item} className={styles.itemCard}>
              <Slot
                className={styles.slot}
                type={isConsumable ? "button" : undefined}
                title={bio}
                aria-label={isConsumable ? `${isBeer ? "Drink a beer" : "Smoke cigarettes"}. ${bio}` : undefined}
                onClick={isConsumable ? () => {
                  if (feedbackRef.current?.open) return;
                  setConsumedItem(item);
                  onUseItem(item);
                  feedbackRef.current?.showModal();
                } : undefined}
              >
                <div className={styles.itemVisual}>
                  {image && (
                    <img
                      src={image}
                      alt={item}
                      className={styles.itemImage}
                    />
                  )}
                  <span className={styles.quantity}>{quantity}</span>
                </div>
                <span className={styles.itemName}>{item}</span>
              </Slot>
              <details className={styles.itemBio}>
                <summary aria-label={`About ${item}`}>Item info</summary>
                <p>{bio}</p>
              </details>
              </div>
            );
          })}
        </div>

        <dialog ref={feedbackRef} className={styles.feedback} aria-labelledby="beer-feedback-title">
          <h2 id="beer-feedback-title">{consumedItem} consumed</h2>
          <p>{consumedItem === "Beer" ? "You drank a beer. Your fear lowered by 10" : "You smoked cigarettes. Your fear lowered by 5"} (minimum 0).</p>
          <form method="dialog">
            <button className={styles.dismiss} autoFocus>Continue</button>
          </form>
        </dialog>

        <div className={styles.closeButton}>
          <ActionButton
            label="Close"
            onClick={onClose}
          />
        </div>

      </div>
    </div>
  );
}
