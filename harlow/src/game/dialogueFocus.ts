/** Who is lit in a conversation. An inner thought greys both portraits. */
export function dialogueFocus(speaker: string | null): "thought" | "ethan" | "partner" | "quiet" {
  if (speaker === "Thought") return "thought";
  if (speaker?.toLowerCase() === "ethan") return "ethan";
  if (speaker) return "partner";
  return "quiet";
}
