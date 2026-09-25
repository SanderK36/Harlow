import ActionButton from "@/components/ActionButton/ActionButton";
import type { GameChoice } from "@/game/choices";
import styles from "./ActionList.module.css";

type ActionListProps = {
  title: string;
  choices: GameChoice[];
  onChoice: (choice: GameChoice) => void;
  onWalk: () => void;
  onBus: () => void;
  onGoToBusStop: () => void;
  isBusStop: boolean;
  canTravel: boolean;
  playerMoney: number;
  layout?: "default" | "home" | "overlay";
};

export default function ActionList({
  title,
  choices,
  onChoice,
  onWalk,
  onBus,
  onGoToBusStop,
  isBusStop,
  canTravel,
  playerMoney,
  layout = "default",
}: ActionListProps) {
  const localChoices = choices.filter(
    (choice) => "response" in choice || !choice.travel
  );
  const isConversation = choices.some(
    (choice) => "response" in choice
  );

  function isDisabled(choice: GameChoice) {
    return (
      "requirements" in choice &&
      choice.requirements?.money !== undefined &&
      playerMoney <
        choice.requirements.money
    );
  }

  return (
    <div
      className={`${styles.actionList} ${
        layout === "overlay" ? styles.overlayActionList : ""
      }`}
    >
      <h2>{title}</h2>

      <div
        className={`${styles.actionButtons} ${
          layout === "home"
            ? styles.homeActionButtons
            : layout === "overlay"
              ? styles.overlayActionButtons
              : ""
        }`}
      >
        {localChoices.map((choice) => (
          <ActionButton
            key={"response" in choice ? choice.label : choice.action}
            label={choice.label}
            onClick={() => onChoice(choice)}
            disabled={isDisabled(choice)}
          />
        ))}

        {!isConversation && canTravel && isBusStop ? (
          <>
            <ActionButton label="Walk" onClick={onWalk} />
            <ActionButton
              label="Take the bus"
              onClick={onBus}
            />
          </>
        ) : !isConversation && canTravel ? (
          <>
            <ActionButton label="Walk" onClick={onWalk} />
            <ActionButton
              label="Go to bus stop"
              onClick={onGoToBusStop}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
