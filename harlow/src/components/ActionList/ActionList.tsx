import type { Ref } from "react";

import ActionButton from "@/components/ActionButton/ActionButton";
import type { GameChoice } from "@/game/choices";
import styles from "./ActionList.module.css";

type ActionListProps = {
  title: string;
  choices: GameChoice[];
  onChoice: (choice: GameChoice) => void;
  /** True when this choice should show the new-lead mark. */
  leadsQuest?: (choice: GameChoice) => boolean;
  onOpenMap: () => void;
  mapButtonRef?: Ref<HTMLButtonElement>;
  canTravel: boolean;
  playerMoney: number;
  layout?: "default" | "home" | "overlay";
};

export default function ActionList({
  title,
  choices,
  onChoice,
  onOpenMap,
  mapButtonRef,
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

        {!isConversation && canTravel && (
          <ActionButton label="Map" buttonRef={mapButtonRef} onClick={onOpenMap} />
        )}
      </div>
    </div>
  );
}
