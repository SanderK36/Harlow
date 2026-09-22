import type { GameChoice } from "./choices";

export function resolveAction(choice: GameChoice) {
  if ("response" in choice) {
    return;
  }

  // Reserved for choice-specific behavior that does not belong in scene data.
  console.log(`Action: ${choice.action}`);
}
