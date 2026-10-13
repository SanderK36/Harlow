/** Dialogue portrait for a speaker. Add each new NPC name and portrait here. */
export function getPortrait(character: string) {
  switch (character.toLowerCase()) {
    case "ethan":
      return "/images/characters/ethanParker/ethanParker.jpg";

    case "linda":
      return "/images/characters/lindaParker/lindaParker.png";

    case "marlene":
      return "/images/characters/marleneWhitaker/marleneWhitaker.png";

    case "johnny":
      return "/images/characters/johnnyDalton/johnnyDalton.png";

    case "walter":
      return "/images/characters/walterHarrington/walterHarrington.jpg";

    case "margaret":
      return "/images/characters/margaretSullivan/margaretSullivan.png";

    case "earl":
      return "/images/characters/earlGivens/earlGivens.png";

    case "big roy":
      return "/images/characters/bigRoy/bigRoy.png";

    case "ray":
      return "/images/characters/rayMercer/rayMercer.png";

    case "tommy":
      return "/images/characters/tommyVance/tommyVance.png";

    case "rachel":
      return "/images/characters/rachelBennett/rachelBennett.png";

    case "emily":
      return "/images/characters/emilyParker/emilyParker.png";

    default:
      return "/images/characters/ethanParker/ethanParker.jpg";
  }
}
