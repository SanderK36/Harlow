import { useEffect, useRef } from "react";

import styles from "./StoryLog.module.css";
import type { StoryEntry } from "@/game/story";
import ConversationLine from "@/components/ConversationLine/ConversationLine";

function getPortrait(character: string) {
  // Add each new NPC name and portrait here so their dialogue has an image.
  switch (character.toLowerCase()) {
    case "ethan":
      return "/images/characters/EthanParker/EthanParker.jpg";

    case "linda":
      return "/images/characters/LindaParker/LindaParker.png";

    case "marlene":
      return "/images/characters/MarleneWhitaker/marleneWhitaker.png";

    case "johnny":
      return "/images/characters/johnnyDalton/johnnyDalton.png";

    case "walter":
      return "/images/characters/WalterHarrington/WalterHarrington.jpg";

    case "margaret":
      return "/images/characters/MargaretSullivan/maragetSullivan.png";

    case "earl":
      return "/images/characters/EarlGivens/EarlGivens.png";

    case "big roy":
      return "/images/characters/BigRoy/BigRoy.png";

    case "tommy":
      return "/images/characters/TommyVance/TommyVance.png";

    default:
      return "/images/characters/EthanParker/EthanParker.jpg";
  }
}

type StoryLogProps = {
  entries: StoryEntry[];
  title?: string;
  variant?: "narration" | "conversation";
};

export default function StoryLog({
  entries,
  title,
  variant = "narration",
}: StoryLogProps) {
  const logRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (variant !== "conversation" || !logRef.current) {
      return;
    }

    logRef.current.scrollTo({
      top: logRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [entries, variant]);

  return (
    <section
      ref={logRef}
      className={`${styles.storyLog} ${
        variant === "conversation"
          ? styles.conversationLog
          : styles.narrationLog
      }`}
      aria-live={variant === "conversation" ? "polite" : undefined}
    >
      {title && <h2 className={styles.title}>{title}</h2>}
      {entries.map((entry, index) => {
        if (entry.type === "thought") {
          return null;
        }

        if (entry.type === "conversation") {
          return (
            <ConversationLine
              key={index}
              character={entry.character}
              text={entry.text}
              portrait={getPortrait(entry.character)}
            />
          );
        }

        if (entry.type === "effect") {
          return null;
        }

        const effects: Extract<
          StoryEntry,
          { type: "effect" }
        >[] = [];

        let previousIndex = index - 1;

        while (
          previousIndex >= 0 &&
          entries[previousIndex].type === "effect"
        ) {
          effects.unshift(
            entries[
              previousIndex
            ] as Extract<
              StoryEntry,
              { type: "effect" }
            >
          );

          previousIndex--;
        }

        return (
          <p
            className={styles.storyEntry}
            key={index}
          >
            {entry.text}

            {effects.map(
              (effect, effectIndex) => (
                <span
                  className={`${styles.effect} ${styles[effect.stat]}`}
                  key={effectIndex}
                >
                  {effect.amount > 0
                    ? "+"
                    : ""}
                  {effect.amount}{" "}
                  {effect.stat.toUpperCase()}
                </span>
              )
            )}
          </p>
        );
      })}
    </section>
  );
}
