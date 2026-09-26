"use client";

import { useLayoutEffect, useRef, type ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { label: string };

export default function SceneHotspot({ label, ...props }: Props) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const button = buttonRef.current;
    const caption = labelRef.current;
    const frame = button?.parentElement;
    if (!button || !caption || !frame) return;

    const fit = () => {
      caption.style.fontSize = "";
      caption.style.setProperty("--caption-offset", "0px");
      const bounds = button.getBoundingClientRect();
      const frameBounds = frame.getBoundingClientRect();
      const naturalWidth = caption.getBoundingClientRect().width;
      const fontSize = Number.parseFloat(getComputedStyle(caption).fontSize);
      const available = Math.max(0, bounds.width - 12);
      if (naturalWidth > available) {
        caption.style.fontSize = `${Math.max(11, Math.min(fontSize, fontSize * available / naturalWidth))}px`;
      }
      const width = caption.getBoundingClientRect().width;
      const center = bounds.left + bounds.width / 2;
      const left = Math.max(frameBounds.left + 8, Math.min(center - width / 2, frameBounds.right - width - 8));
      caption.style.setProperty("--caption-offset", `${left + width / 2 - center}px`);
    };

    const observer = new ResizeObserver(fit);
    observer.observe(button);
    observer.observe(frame);
    fit();
    void document.fonts.ready.then(() => {
      if (button.isConnected) fit();
    });
    return () => observer.disconnect();
  }, [label]);

  return (
    <button {...props} ref={buttonRef}>
      <span ref={labelRef}>{label}</span>
    </button>
  );
}
