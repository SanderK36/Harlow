import path from "node:path";
import { pathToFileURL } from "node:url";

const srcUrl = pathToFileURL(path.resolve(import.meta.dirname, "../src") + path.sep).href;

export async function resolve(specifier, context, nextResolve) {
  let next = specifier;
  if (specifier.startsWith("@/")) {
    next = new URL(specifier.slice(2), srcUrl).href;
  }
  if (
    (next.startsWith("./") || next.startsWith("../") || next.startsWith("file:"))
    && !/\.(tsx?|jsx?|mjs|cjs|json)$/.test(next)
  ) {
    next += ".ts";
  }
  return nextResolve(next, context);
}
