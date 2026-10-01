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
    name: "Tommy Vance",
    role: "Ethan's close friend / Garage mechanic",
    image: "/images/characters/TommyVance/TommyVance.png",
    bio: "Twenty. Ethan's closest friend, and the loudest guitar in Harlow. Long black hair, a leather jacket, and a radio that never shuts up. He acts like none of it matters. He still shows up. Gas-station garage, eight in the morning till five.",
  },
  {
    name: "Linda Parker",
    role: "Ethan's mother",
    image: "/images/characters/LindaParker/LindaParker.png",
    bio: "Ethan's mother. Home in the mornings. She worries when he's out late, and she doesn't say half of what she's thinking.",
  },
  {
    name: "Johnny Dalton",
    role: "Needle & Groove owner",
    image: "/images/characters/johnnyDalton/johnnyDalton.png",
    bio: "Owns Needle & Groove. Easygoing, knows his records, and hears more town talk than he repeats at the counter.",
  },
  {
    name: "Ray Mercer",
    role: "Gas station attendant",
    image: "/images/characters/RayMercer/rayMercer.png",
    bio: "Works the gas-station counter through the day. Plainspoken. He'll sell you a snack, or a job, if you ask.",
  },
  {
    name: "Walter Harrington",
    role: "Sheriff",
    image: "/images/characters/WalterHarrington/WalterHarrington.jpg",
    bio: "Sheriff of Harlow. Short answers. He decides what you get to know.",
  },
  {
    name: "Marlene Whitaker",
    role: "Hospital receptionist",
    image: "/images/characters/MarleneWhitaker/marleneWhitaker.png",
    bio: "Hospital reception. If she's on a shift, she has no time for you.",
  },
  {
    name: "Margaret Sullivan",
    role: "Diner server",
    image: "/images/characters/MargaretSullivan/maragetSullivan.png",
    bio: "Works the diner floor. Warm enough. She hears more than she'll repeat.",
  },
  {
    name: "Earl Givens",
    role: "Motel manager",
    image: "/images/characters/EarlGivens/EarlGivens.png",
    bio: "Runs the motel. Gruff. He likes a reservation and a short question.",
  },
  {
    name: "Big Roy",
    role: "Scrapyard worker",
    image: "/images/characters/BigRoy/BigRoy.png",
    bio: "Scrapyard, seven in the morning till three. Big laugh, dry jokes. He treats rusted parts like they still belong to somebody.",
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
