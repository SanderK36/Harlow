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

export type NoticeCard = {
  key: string;
  kind: "lead" | "notice";
  label: string;
  message: string;
};

export type NoticeQueueState = {
  queue: NoticeCard[];
  showing: NoticeCard | null;
  announced: string[];
};

export function emptyNoticeQueue(): NoticeQueueState {
  return { queue: [], showing: null, announced: [] };
}

/**
 * Show the next card unless one is already up or an overlay is holding the
 * queue. Closing a conversation or a close-up calls this again.
 */
export function pumpNoticeQueue(state: NoticeQueueState, held: boolean): NoticeQueueState {
  if (state.showing || held || state.queue.length === 0) return state;
  const [next, ...rest] = state.queue;
  return { queue: rest, showing: next, announced: state.announced };
}

/** Deduped. A card queued while an overlay is up stays queued until the pump. */
export function enqueueNoticeCard(
  state: NoticeQueueState,
  card: NoticeCard,
  held: boolean,
): NoticeQueueState {
  if (state.announced.includes(card.key)) return state;
  return pumpNoticeQueue(
    {
      queue: [...state.queue, card],
      showing: state.showing,
      announced: [...state.announced, card.key],
    },
    held,
  );
}

/** A card already on screen goes back to the front when a close-up opens over it. */
export function pauseNoticeQueue(state: NoticeQueueState): NoticeQueueState {
  if (!state.showing) return state;
  return {
    queue: [state.showing, ...state.queue],
    showing: null,
    announced: state.announced,
  };
}

/** The hold timer finished. The next card shows unless an overlay is up. */
export function finishShowingNotice(state: NoticeQueueState, held: boolean): NoticeQueueState {
  return pumpNoticeQueue({ ...state, showing: null }, held);
}
