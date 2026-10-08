export function sceneAfterPickups(
  sceneId: string,
  save: {
    deskCigarettesPickedUp?: boolean;
    scrapyardKnifePickedUp?: boolean;
    garageFlashlightPickedUp?: boolean;
  } | null,
) {
  if (sceneId === "ethan-room-desk" && save?.deskCigarettesPickedUp) return "ethan-room-desk-empty";
  if (sceneId === "scrapyard-desk" && save?.scrapyardKnifePickedUp) return "scrapyard-desk-empty";
  if (sceneId === "garage-bench" && save?.garageFlashlightPickedUp) return "garage-bench-empty";
  return sceneId;
}
