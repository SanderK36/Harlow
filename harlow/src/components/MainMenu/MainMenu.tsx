import Image from "next/image";

export default function MainMenu({
  onNewGame,
  onContinue,
}: {
  onNewGame: () => void;
  onContinue: () => void;
}) {
  return (
    <main className="mainMenu">
      <div className="mainMenuArtwork" aria-hidden="true" />
      <div className="mainMenuShade" aria-hidden="true" />
      <div className="mainMenuBranding">
        <a
          className="mainMenuStudioLogoLink"
          href="https://www.lostfrequencygames.com/"
          target="_blank"
          rel="noreferrer"
        >
          <Image
            className="mainMenuStudioLogo"
            src="/LostFrequencyGames-transparent.png"
            alt="Lost Frequency Games"
            width={1254}
            height={1254}
          />
        </a>
        <a
          className="mainMenuSocialLink"
          href="https://x.com/HarlowTheGame"
          target="_blank"
          rel="noreferrer"
          aria-label="Follow Harlow: 1982 on X"
        >
          <Image src="/X.png" alt="" width={1500} height={1500} />
        </a>
      </div>

      <section className="mainMenuContent" aria-labelledby="game-title">
        <p className="mainMenuEyebrow">A small-town mystery unfolds</p>
        <h1 id="game-title">Harlow: 1982</h1>
        <div className="mainMenuActions">
          <button className="mainMenuStart" onClick={onNewGame}>
            New Game
          </button>
          <button
            className="mainMenuStart mainMenuContinue"
            onClick={onContinue}
          >
            Continue
          </button>
        </div>
      </section>
      <p className="mainMenuCopyright">
        © 2026 Lost Frequency Games. All rights reserved.
      </p>
    </main>
  );
}
