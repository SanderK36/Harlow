import ActionButton from "@/components/ActionButton/ActionButton";
import styles from "./TravelWindow.module.css";

type Choice = {
  label: string;
  action: string;
  nextScene: string;
  timeCost: number;
  travel?: boolean;
  requirements?: {
    money?: number;
  };
};

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
  const menu = initialMenu;

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

  if (menu === "bus") {
    return (
      <div className={styles.overlay}>
        <div className={styles.window}>
          <h2>BUS</h2>

          <div className={styles.buttons}>
            {busChoices.map((choice) => (
              <ActionButton
                key={choice.action}
                label={choice.label}
                onClick={() =>
                  handleTravelChoice(choice)
                }
                disabled={isDisabled(choice)}
              />
            ))}

            <ActionButton
              label="Back"
              onClick={onClose}
            />
          </div>
        </div>
      </div>
    );
  }

  if (menu === "walk") {
    return (
      <div className={styles.overlay}>
        <div className={styles.window}>
          <h2>WALK</h2>

          <div className={styles.buttons}>
            {walkingChoices.map((choice) => (
              <ActionButton
                key={choice.action}
                label={choice.label}
                onClick={() =>
                  handleTravelChoice(choice)
                }
                disabled={isDisabled(choice)}
              />
            ))}

            <ActionButton
              label="Back"
              onClick={onClose}
            />
          </div>
        </div>
      </div>
    );
  }

}
