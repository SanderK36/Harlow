import ActionButton from "@/components/ActionButton/ActionButton";
import type { GameChoice } from "@/game/choices";
import styles from "./ActionList.module.css";

type ActionListProps = {
  title: string;
  choices: GameChoice[];
  onChoice: (choice: GameChoice) => void;
  /** True when this choice should show the new-lead mark. */
  leadsQuest?: (choice: GameChoice) => boolean;
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
  leadsQuest,
}: ActionListProps) {
  const localChoices = choices.filter(
    (choice) => "response" in choice || !choice.travel
  );
  const isConversation = choices.some(
    (choice) => "response" in choice
  );
  const hasButtons = localChoices.length > 0 || (!isConversation && canTravel);
  if (!hasButtons) return null;

  function isDisabled(choice: GameChoice) {
    // Dialogue replies are omitted entirely when they don't apply. A greyed
    // button would give away a line the player isn't meant to see yet.
    if ("response" in choice) return false;
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
        layout === "overlay" ? `${styles.overlayActionList} overlayActionList` : ""
      }`}
    >
      <h2>{title}</h2>

      <div
        className={`${styles.actionButtons} ${
          layout === "home"
            ? styles.homeActionButtons
            : layout === "overlay"
              ? `${styles.overlayActionButtons} overlayActionButtons`
              : ""
        }`}
      >
        {localChoices.map((choice) => (
          <ActionButton
            key={"response" in choice ? choice.label : choice.action}
            label={choice.label}
            onClick={() => onChoice(choice)}
            disabled={isDisabled(choice)}
            leadsQuest={leadsQuest?.(choice) ?? false}
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
              label="Go to the bus stop"
              onClick={onGoToBusStop}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
