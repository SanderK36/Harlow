/** Playtest tools stay available after ?debug=1, including a production build. */
const PLAYTEST_DEBUG_KEY = "harlow-debug";

export function persistPlaytestDebugQuery() {
  if (typeof window === "undefined") return;
  const flag = new URLSearchParams(window.location.search).get("debug");
  try {
    if (flag === "1") window.localStorage.setItem(PLAYTEST_DEBUG_KEY, "1");
    else if (flag === "0") window.localStorage.removeItem(PLAYTEST_DEBUG_KEY);
  } catch {
    // Storage can be blocked. The query string is checked again below.
  }
}

persistPlaytestDebugQuery();

export function subscribePlaytestDebug() {
  return () => {};
}

export function playtestDebugOnClient() {
  const flag = new URLSearchParams(window.location.search).get("debug");
  if (flag === "0") return false;
  try {
    return flag === "1" || window.localStorage.getItem(PLAYTEST_DEBUG_KEY) === "1";
  } catch {
    return flag === "1";
  }
}
