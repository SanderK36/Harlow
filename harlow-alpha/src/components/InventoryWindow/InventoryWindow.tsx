import ActionButton from "@/components/ActionButton/ActionButton";
import styles from "./InventoryWindow.module.css";

type InventoryWindowProps = {
  inventory: string[];
  onClose: () => void;
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
}: InventoryWindowProps) {
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

            return (
              <div
                className={styles.slot}
                key={item}
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
              </div>
            );
          })}
        </div>

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
