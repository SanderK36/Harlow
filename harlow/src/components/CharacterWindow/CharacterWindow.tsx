"use client";

import { useState } from "react";

import styles from "./CharacterWindow.module.css";

type Character = {
  name: string;
  role: string;
  image: string;
  bio: string;
};

// Keep this directory in sync when a new NPC is introduced in scene data.
const characters: Character[] = [
  {
    name: "Linda Parker",
    role: "Ethan's mother",
    image: "/images/characters/LindaParker/LindaParker.png",
    bio: "Ethan's caring mother. She is usually at home in the morning and worries when he stays out too late.",
  },
  {
    name: "Johnny Dalton",
    role: "Needle & Groove owner",
    image: "/images/characters/johnnyDalton/johnnyDalton.png",
    bio: "The laid-back owner of Needle & Groove. He knows his records and keeps an ear on the town's gossip.",
  },
  {
    name: "Ray Mercer",
    role: "Gas station attendant",
    image: "/images/characters/RayMercer/rayMercer.png",
    bio: "The familiar face behind the gas-station counter during the day.",
  },
  {
    name: "Walter Harrington",
    role: "Sheriff",
    image: "/images/characters/WalterHarrington/WalterHarrington.jpg",
    bio: "Harlow's sheriff. Walter keeps his answers measured and his cards close to his chest.",
  },
  {
    name: "Marlene Whitaker",
    role: "Hospital receptionist",
    image: "/images/characters/MarleneWhitaker/marleneWhitaker.png",
    bio: "A busy hospital receptionist with little patience for interruptions during her shift.",
  },
  {
    name: "Margaret Sullivan",
    role: "Diner server",
    image: "/images/characters/MargaretSullivan/maragetSullivan.png",
    bio: "A warm presence at the diner who hears more about Harlow than she lets on.",
  },
  {
    name: "Earl Givens",
    role: "Motel manager",
    image: "/images/characters/EarlGivens/EarlGivens.png",
    bio: "The motel's gruff manager. He prefers customers with reservations and short questions.",
  },
  {
    name: "Big Roy",
    role: "Scrapyard worker",
    image: "/images/characters/BigRoy/BigRoy.png",
    bio: "A big-hearted, funny presence at the scrapyard. Roy works from 07:00 to 15:00 and treats every rusty part like it has a story.",
  },
];

type CharacterWindowProps = {
  onClose: () => void;
};

export default function CharacterWindow({ onClose }: CharacterWindowProps) {
  const [selectedCharacter, setSelectedCharacter] = useState(characters[0]);

  return (
    <div className={styles.backdrop} onMouseDown={onClose}>
      <section
        className={styles.window}
        role="dialog"
        aria-modal="true"
        aria-labelledby="character-directory-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <div>
            <p>People of Harlow</p>
            <h2 id="character-directory-title">Character Directory</h2>
          </div>
          <button className={styles.closeButton} type="button" onClick={onClose} aria-label="Close character directory">
            ×
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.portraitGrid} aria-label="Character list">
            {characters.map((character) => (
              <button
                className={character.name === selectedCharacter.name ? styles.activePortrait : styles.portraitButton}
                type="button"
                key={character.name}
                onClick={() => setSelectedCharacter(character)}
                aria-pressed={character.name === selectedCharacter.name}
              >
                <img src={character.image} alt="" />
                <span>{character.name}</span>
              </button>
            ))}
          </div>

          <article className={styles.bio}>
            <img src={selectedCharacter.image} alt={selectedCharacter.name} />
            <div>
              <p className={styles.role}>{selectedCharacter.role}</p>
              <h3>{selectedCharacter.name}</h3>
              <p>{selectedCharacter.bio}</p>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
