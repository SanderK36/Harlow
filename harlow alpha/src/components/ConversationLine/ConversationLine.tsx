import styles from "./ConversationLine.module.css";

type ConversationLineProps = {
  character: string;
  text: string;
  portrait: string;
};

export default function ConversationLine({
  character,
  text,
  portrait,
}: ConversationLineProps) {
  const isEthan =
    character.toLowerCase() === "ethan";

  return (
    <div
      className={`${styles.conversationLine} ${
        isEthan
          ? styles.ethan
          : styles.other
      }`}
    >
      <img
        src={portrait}
        alt={character}
        className={styles.portrait}
      />

      <div className={styles.bubble}>
        <strong>{character}</strong>
        <p>{text}</p>
      </div>
    </div>
  );
}
