/** Dialogue portrait for a speaker. Add each new NPC name and portrait here. */
export function getPortrait(character: string) {
  switch (character.toLowerCase()) {
    case "ethan":
      return "/images/characters/ethan_parker/ethanParker.jpg";

    case "linda":
      return "/images/characters/linda_parker/lindaParker.png";

    case "marlene":
      return "/images/characters/marlene_whitaker/marleneWhitaker.png";

    case "johnny":
      return "/images/characters/johnny_dalton/johnnyDalton.png";

    case "walter":
      return "/images/characters/walter_harrington/walterHarrington.jpg";

    case "margaret":
      return "/images/characters/margaret_sullivan/margaretSullivan.png";

    case "earl":
      return "/images/characters/earl_givens/earlGivens.png";

    case "big roy":
      return "/images/characters/big_roy/bigRoy.png";

    case "ray":
      return "/images/characters/ray_mercer/rayMercer.png";

    case "tommy":
      return "/images/characters/tommy_vance/tommyVance.png";

    case "rachel":
      return "/images/characters/rachel_bennett/rachelBennett.png";

    case "emily":
      return "/images/characters/emily_parker/emilyParker.png";

    default:
      return "/images/characters/ethan_parker/ethanParker.jpg";
  }
}
