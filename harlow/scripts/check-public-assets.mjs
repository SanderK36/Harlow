/**
 * Case-sensitive check that every public image/sound path quoted in src
 * exists under harlow/public. The quest-log plate may be missing; the
 * notebook keeps its CSS paper. Every sound file that is present must
 * be referenced.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const harlowRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(harlowRoot, "public");
const srcDir = path.join(harlowRoot, "src");

/** Referenced on purpose, and safe when the file has not been delivered yet. */
const OPTIONAL = new Set([
  "images/locations/cemetery/emilyStone.png",
  "images/locations/home/hallwayPhone.png",
]);

const QUOTED = /["'`]([^"'`\n]+\.(?:png|jpe?g|webp|gif|svg|mp3|wav|ogg|mp4|mov))["'`]/g;

function walkSource(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules") continue;
      walkSource(full, acc);
    } else if (/\.(?:ts|tsx|css|js|mjs)$/.test(entry.name)) {
      acc.push(full);
    }
  }
  return acc;
}

function toPublicRel(raw) {
  let value = raw.trim().replace(/^\.\//, "");
  if (value.startsWith("data:") || value.startsWith("http:") || value.startsWith("https:")) {
    return null;
  }
  if (value.startsWith("/")) value = value.slice(1);
  if (!value || value.includes("..")) return null;
  if (value.startsWith("images/") || value.startsWith("sounds/") || !value.includes("/")) {
    return value;
  }
  return null;
}

function existsExact(rel) {
  let current = publicDir;
  for (const part of rel.split("/")) {
    let names;
    try {
      names = fs.readdirSync(current);
    } catch {
      return false;
    }
    if (!names.includes(part)) return false;
    current = path.join(current, part);
  }
  try {
    return fs.statSync(current).isFile();
  } catch {
    return false;
  }
}

function soundFiles(dir, prefix, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) soundFiles(path.join(dir, entry.name), rel, acc);
    else if (/\.(?:mp3|wav|ogg)$/i.test(entry.name)) acc.push(`sounds/${rel}`);
  }
  return acc;
}

const refs = new Set();
for (const file of walkSource(srcDir)) {
  const text = fs.readFileSync(file, "utf8");
  for (const match of text.matchAll(QUOTED)) {
    const rel = toPublicRel(match[1]);
    if (rel) refs.add(rel);
  }
}

const missing = [...refs].filter((rel) => !OPTIONAL.has(rel) && !existsExact(rel)).sort();
const optionalMissing = [...refs].filter((rel) => OPTIONAL.has(rel) && !existsExact(rel)).sort();
const unreferencedSounds = soundFiles(path.join(publicDir, "sounds"), "")
  .filter((rel) => !refs.has(rel))
  .sort();

if (missing.length || unreferencedSounds.length) {
  if (missing.length) {
    console.error("Missing referenced public assets:");
    for (const item of missing) console.error(`  ${item}`);
  }
  if (unreferencedSounds.length) {
    console.error("Sound files present but not referenced:");
    for (const item of unreferencedSounds) console.error(`  ${item}`);
  }
  process.exit(1);
}

if (optionalMissing.length) {
  console.log("Optional assets still missing:");
  for (const item of optionalMissing) console.log(`  ${item}`);
}
console.log(`Checked ${refs.size} public asset references.`);
