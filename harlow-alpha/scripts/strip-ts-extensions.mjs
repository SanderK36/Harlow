import path from "node:path";
import { register } from "node:module";
import { pathToFileURL } from "node:url";

register(pathToFileURL(path.join(import.meta.dirname, "strip-ts-hooks.mjs")).href, {
  parentURL: import.meta.url,
});
