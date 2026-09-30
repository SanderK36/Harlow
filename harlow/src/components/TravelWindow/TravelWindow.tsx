import ActionButton from "@/components/ActionButton/ActionButton";
import type { Choice } from "@/game/choices";
import styles from "./TravelWindow.module.css";

type TravelWindowProps = {
  walkingChoices: Choice[];
  busChoices: Choice[];
  onChoice: (choice: Choice) => void;
  onClose: () => void;
  onTravelStart: () => void;
  playerMoney: number;
  initialMenu: Menu;
};

type Menu = "bus" | "walk";

export default function TravelWindow({
  walkingChoices,
  busChoices,
  onChoice,
  onClose,
  onTravelStart,
  playerMoney,
  initialMenu,
}: TravelWindowProps) {
  const choices = initialMenu === "bus" ? busChoices : walkingChoices;
  const title = initialMenu === "bus" ? "BUS" : "WALK";

  function isDisabled(choice: Choice) {
    return (
      choice.requirements?.money !== undefined &&
      playerMoney < choice.requirements.money
    );
  }

  function handleTravelChoice(choice: Choice) {
    onTravelStart();
    onChoice(choice);
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.window}>
        <h2>{title}</h2>
        <div className={styles.buttons}>
          {choices.map((choice) => (
            <ActionButton
              key={choice.action}
              label={choice.label}
              onClick={() => handleTravelChoice(choice)}
              disabled={isDisabled(choice)}
            />
          ))}
          <ActionButton label="Back" onClick={onClose} />
        </div>
      </div>
    </div>
  );
}
