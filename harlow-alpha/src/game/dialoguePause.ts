/**
 * How long a spoken line stays up before the next one.
 * Phone holds are kept when motion is reduced. Other lines still skip ahead.
 */
export function dialoguePauseMs(
  pauseAfter: number | undefined,
  reducedMotion: boolean,
  keepPauses: boolean,
  fallback: number,
) {
  if (pauseAfter != null && (keepPauses || !reducedMotion)) return pauseAfter;
  if (reducedMotion) return 0;
  return pauseAfter ?? fallback;
}
