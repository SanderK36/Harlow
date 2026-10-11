"use client";

import { useEffect, useState } from "react";

import ConfirmDialog from "@/components/ConfirmDialog/ConfirmDialog";
import SettingsScreen from "@/components/SettingsScreen/SettingsScreen";
import { continuePreview } from "@/game/continuePreview";
import { MENU_BACKGROUND_FALLBACK, MENU_BACKGROUND_PATH } from "@/game/menuArt";
import type { SavedGame } from "@/game/save";

type MainMenuProps = {
  continueSave: SavedGame | null;
  onNewGame: () => void;
  onContinue: () => void;
};

export default function MainMenu({ continueSave, onNewGame, onContinue }: MainMenuProps) {
  const [background, setBackground] = useState(MENU_BACKGROUND_PATH);
  const [confirming, setConfirming] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const preview = continueSave ? continuePreview(continueSave) : null;

  useEffect(() => {
    const probe = new window.Image();
    probe.onload = () => setBackground(MENU_BACKGROUND_PATH);
    probe.onerror = () => setBackground(MENU_BACKGROUND_FALLBACK);
    probe.src = MENU_BACKGROUND_PATH;
  }, []);

  return (
    <main className="mainMenu">
      <div
        className="mainMenuArtwork"
        aria-hidden="true"
        style={{ backgroundImage: `url("${background}")` }}
      />
      <div className="mainMenuRain" aria-hidden="true" />
      <div className="mainMenuShade" aria-hidden="true" />

      <section className="mainMenuContent" aria-labelledby="game-title">
        <h1 id="game-title">HARLOW</h1>
        <p className="mainMenuYear">1982</p>
        <div className="mainMenuActions">
          {preview && (
            <button
              type="button"
              className="mainMenuContinueCard"
              onClick={onContinue}
              aria-label={`Continue. ${preview.location}, ${preview.weekday}, ${preview.time}`}
            >
              {preview.thumbnail && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview.thumbnail} alt="" width={160} height={120} />
              )}
              <span className="mainMenuContinueCopy">
                <span className="mainMenuContinueLabel">Continue</span>
                <span className="mainMenuContinuePlace">{preview.location}</span>
                <span>{preview.weekday}</span>
                <span>{preview.time}</span>
              </span>
            </button>
          )}
          <button
            type="button"
            className="mainMenuStart"
            onClick={() => {
              if (continueSave) setConfirming(true);
              else onNewGame();
            }}
          >
            New Game
          </button>
          <button type="button" className="mainMenuStart mainMenuQuiet" onClick={() => setSettingsOpen(true)}>
            Settings
          </button>
        </div>
      </section>

      <p className="mainMenuCopyright">© 2026 Lost Frequency Games. All rights reserved.</p>

      {confirming && (
        <ConfirmDialog
          title="New game"
          message="Start over? Your saved game will be lost."
          confirmLabel="Start over"
          cancelLabel="Cancel"
          onConfirm={() => {
            setConfirming(false);
            onNewGame();
          }}
          onCancel={() => setConfirming(false)}
        />
      )}
      {settingsOpen && <SettingsScreen onBack={() => setSettingsOpen(false)} />}
    </main>
  );
}
