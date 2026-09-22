import ActionButton from "@/components/ActionButton/ActionButton";
import styles from "./ShopWindow.module.css";

type ShopWindowProps = {
  shop: "gas-station" | "needle-groove";
  playerMoney: number;
  hasEmployeeDiscount?: boolean;
  onPurchase: (item: string, price: number) => void;
  onClose: () => void;
};

// Add purchasable items here. Their `name` is also the inventory item ID.
const shops = {
  "gas-station": {
    title: "GAS STATION SHOP",
    items: [
      {
        name: "Cigarettes",
        price: 5,
        image: "/images/items/Cigarettes.png",
      },
      {
        name: "Beer",
        price: 4,
        image: "/images/items/beer.png",
      },
    ],
  },
  "needle-groove": {
    title: "NEEDLE & GROOVE",
    items: [
      {
        name: "Steel Maiden",
        price: 8,
        image: "/images/locations/NeedleGroove/shop/SteelMaiden.png",
      },
      {
        name: "High Volts",
        price: 9,
        image: "/images/locations/NeedleGroove/shop/HighVolts.png",
      },
      {
        name: "Leopard Hazard",
        price: 10,
        image: "/images/locations/NeedleGroove/shop/LeopardHazard.png",
      },
      {
        name: "Puppet Masters",
        price: 9,
        image: "/images/locations/NeedleGroove/shop/PuppetMasters.png",
      },
      {
        name: "Ricky Valentine",
        price: 11,
        image: "/images/locations/NeedleGroove/shop/RickyValentine.png",
      },
    ],
  },
};

export default function ShopWindow({
  shop,
  playerMoney,
  hasEmployeeDiscount = false,
  onPurchase,
  onClose,
}: ShopWindowProps) {
  const currentShop = shops[shop];

  return (
    <div className={styles.overlay}>
      <div className={styles.window} role="dialog" aria-modal="true">
        <div className={styles.header}>
          <h2>{currentShop.title}</h2>
          <span>${playerMoney}</span>
        </div>

        <div className={styles.items}>
          {currentShop.items.map((item) => {
            const price = shop === "gas-station" && hasEmployeeDiscount
              ? Math.ceil(item.price / 2)
              : item.price;
            const canAfford = playerMoney >= price;

            return (
              <div className={styles.item} key={item.name}>
                <img src={item.image} alt={item.name} />
                <div className={styles.itemDetails}>
                  <strong>{item.name}</strong>
                  <span>{price === item.price ? `$${price}` : <><s>${item.price}</s> ${price}</>}</span>
                </div>
                <ActionButton
                  label={`Buy for $${price}`}
                  onClick={() => onPurchase(item.name, price)}
                  disabled={!canAfford}
                />
              </div>
            );
          })}
        </div>

        <div className={styles.closeButton}>
          <ActionButton label="Close" onClick={onClose} />
        </div>
      </div>
    </div>
  );
}
