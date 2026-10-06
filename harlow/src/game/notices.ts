/**
 * A New lead card that starts under a close-up, a conversation, or the
 * chapter card runs its timer unseen. Hold the queue until that layer is gone.
 */
export function noticesAreHeld(overlay: {
  closeupOpen: boolean;
  conversationActive: boolean;
  chapterEndOpen: boolean;
}) {
  return overlay.closeupOpen || overlay.conversationActive || overlay.chapterEndOpen;
}
