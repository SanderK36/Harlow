import { useLayoutEffect, useRef } from "react";

import { placeSceneChrome } from "@/game/captionPlace";

/** Moves the SCENE box after layout. Hotspot positions stay on the art. */
export default function CaptionPlacer({
  sceneId,
  signature,
  thought,
  lead,
}: {
  sceneId: string;
  signature: string;
  thought: string;
  lead: string;
}) {
  const marker = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const frame = marker.current?.closest<HTMLElement>(".scene-image-frame");
    if (!frame) return;
    const place = () => placeSceneChrome(frame);
    place();
    const raf = window.requestAnimationFrame(place);
    const observer = new ResizeObserver(place);
    const art = frame.querySelector(".scene-art");
    if (art) observer.observe(art);
    // A lead card grows the stack. Place again so it does not cover a hotspot.
    const stack = frame.querySelector(".scene-info-stack");
    const leads = new MutationObserver(place);
    if (stack) leads.observe(stack, { childList: true });
    return () => {
      window.cancelAnimationFrame(raf);
      observer.disconnect();
      leads.disconnect();
    };
  }, [sceneId, signature, thought, lead]);
  return <span ref={marker} hidden />;
}
