import { useEffect, useRef, useState } from "react";

import {
  emptyNoticeQueue,
  enqueueNoticeCard,
  finishShowingNotice,
  pauseNoticeQueue,
  pumpNoticeQueue,
  type NoticeCard,
} from "./notices";

/** Slide in, then hold, then fade. The hold is the time the card sits still. */
const LEAD_ENTER_MS = 200;
const LEAD_HOLD_MS = 2000;
const LEAD_EXIT_MS = 300;

export type QuestNotice = {
  kind: "lead" | "notice";
  label: string;
  message: string;
};

export function useNoticeQueue(conversationActive: boolean, holdsNotices: () => boolean) {
  const noticesRef = useRef(emptyNoticeQueue());
  const questNotificationTimer = useRef<number | null>(null);
  const pumpNoticesRef = useRef<() => void>(() => {});
  const [questNotification, setQuestNotification] = useState<string | null>(null);
  const [questNotificationLabel, setQuestNotificationLabel] = useState("NEW LEAD");
  const [questNotificationKind, setQuestNotificationKind] = useState<QuestNotice["kind"]>("lead");
  const [questNotificationExiting, setQuestNotificationExiting] = useState(false);

  function clearQuestNotification() {
    if (questNotificationTimer.current !== null) window.clearTimeout(questNotificationTimer.current);
    questNotificationTimer.current = null;
    noticesRef.current = emptyNoticeQueue();
    setQuestNotification(null);
    setQuestNotificationLabel("NEW LEAD");
    setQuestNotificationKind("lead");
    setQuestNotificationExiting(false);
  }

  function showNoticeCard(card: NoticeCard) {
    setQuestNotification(card.message);
    setQuestNotificationLabel(card.label);
    setQuestNotificationKind(card.kind);
    setQuestNotificationExiting(false);
    if (questNotificationTimer.current !== null) window.clearTimeout(questNotificationTimer.current);
    questNotificationTimer.current = window.setTimeout(() => {
      setQuestNotificationExiting(true);
      questNotificationTimer.current = window.setTimeout(() => {
        questNotificationTimer.current = null;
        const next = finishShowingNotice(noticesRef.current, holdsNotices());
        noticesRef.current = next;
        if (next.showing) showNoticeCard(next.showing);
        else {
          setQuestNotification(null);
          setQuestNotificationLabel("NEW LEAD");
          setQuestNotificationKind("lead");
          setQuestNotificationExiting(false);
        }
      }, LEAD_EXIT_MS);
    }, LEAD_ENTER_MS + LEAD_HOLD_MS);
  }

  function pumpNotices() {
    const next = pumpNoticeQueue(noticesRef.current, holdsNotices());
    if (next === noticesRef.current) return;
    const started = !noticesRef.current.showing && next.showing;
    noticesRef.current = next;
    if (started && next.showing) showNoticeCard(next.showing);
  }

  /** Put a card that is already on screen back in the queue. Its timer stops. */
  function pauseNoticesForOverlay() {
    if (questNotificationTimer.current !== null) {
      window.clearTimeout(questNotificationTimer.current);
      questNotificationTimer.current = null;
    }
    noticesRef.current = pauseNoticeQueue(noticesRef.current);
    setQuestNotification(null);
    setQuestNotificationLabel("NEW LEAD");
    setQuestNotificationKind("lead");
    setQuestNotificationExiting(false);
  }

  function enqueueNotice(notice: QuestNotice, key?: string) {
    const card: NoticeCard = {
      key: key ?? `${notice.kind}:${notice.label}:${notice.message}`,
      kind: notice.kind,
      label: notice.label,
      message: notice.message,
    };
    const next = enqueueNoticeCard(noticesRef.current, card, holdsNotices());
    if (next === noticesRef.current) return;
    const started = !noticesRef.current.showing && next.showing;
    noticesRef.current = next;
    if (started && next.showing) showNoticeCard(next.showing);
  }

  pumpNoticesRef.current = pumpNotices;

  // Leads queued during a conversation wait until the dialogue layer is gone.
  // Pumping from the close itself is not enough: that timeout can be skipped
  // while the card is still marked announced.
  useEffect(() => {
    if (conversationActive) return;
    const timer = window.setTimeout(() => pumpNoticesRef.current(), 320);
    return () => window.clearTimeout(timer);
  }, [conversationActive]);

  useEffect(() => () => {
    if (questNotificationTimer.current !== null) window.clearTimeout(questNotificationTimer.current);
  }, []);

  return {
    questNotification,
    questNotificationLabel,
    questNotificationKind,
    questNotificationExiting,
    clearQuestNotification,
    pauseNoticesForOverlay,
    pumpNotices,
    enqueueNotice,
  };
}
