/** Dialogue portrait for a speaker. Add each new NPC name and portrait here. */
export function getPortrait(character: string) {
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

    case "ray":
      return "/images/characters/RayMercer/rayMercer.png";

    case "tommy":
      return "/images/characters/TommyVance/TommyVance.png";

    default:
      return "/images/characters/EthanParker/EthanParker.jpg";
  }
}
