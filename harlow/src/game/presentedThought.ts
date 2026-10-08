export function presentedThought(input: {
  lateNight: boolean;
  momTalked: boolean;
  sceneId: string;
  dayNumber: number;
  openingDay: number;
  thought: string | null;
}) {
  if (input.lateNight) return "It's late. I should get to bed.";
  if (
    input.momTalked
    && input.sceneId === "ethan-room"
    && input.dayNumber > input.openingDay
  ) {
    return "Another day. Better get moving.";
  }
  if (input.momTalked) return input.thought;
  if (input.sceneId === "living-room-relaxing") return "I need to talk to Mom first.";
  return "I should talk to Mom.";
}
