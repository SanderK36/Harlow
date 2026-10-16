/**
 * Measures real caption, lead-card, and hotspot boxes.
 * A hotspot must not sit under the caption or a New lead card.
 * Viewports: 1280x800 and 390x844. Needs the dev server on :3000.
 *
 *   node scripts/caption-hotspot-overlap.mjs
 */
import puppeteer from "puppeteer-core";

const BASE = process.env.HARLOW_URL ?? "http://localhost:3000/";
const VIEWPORTS = [
  { width: 1280, height: 800 },
  { width: 390, height: 844 },
];

const player = {
  name: "Ethan Parker",
  courage: 1,
  intelligence: 1,
  charisma: 1,
  athletics: 1,
  strength: 1,
  health: 55,
  maxHealth: 100,
  stamina: 86,
  maxStamina: 150,
  fear: 36,
  money: 10,
  inventory: ["House key"],
};

function save(overrides) {
  return {
    version: 1,
    gameState: {
      dayNumber: 2,
      dayOfWeek: "Saturday",
      time: 450,
      location: "Ethan's room",
      weather: "Rainy",
      currentMonth: "October",
      ...overrides.gameState,
    },
    playerState: player,
    currentSceneId: overrides.currentSceneId ?? "ethan-room",
    busStopReturnSceneId: "front-yard",
    marleneActive: false,
    deskCigarettesPickedUp: false,
    scrapyardKnifePickedUp: false,
    garageFlashlightPickedUp: false,
    momTalked: overrides.momTalked ?? false,
    quests: overrides.quests ?? [{ id: "talk-to-mom", status: "active" }],
    storyFlags: overrides.storyFlags ?? {},
    chapter: 1,
  };
}

const PROFILES = [
  save({}),
  save({
    momTalked: true,
    currentSceneId: "diner-inside",
    gameState: { time: 555, location: "Diner" },
    quests: [
      { id: "talk-to-mom", status: "completed" },
      { id: "the-tape", status: "active" },
      { id: "faded-poster", status: "active" },
      { id: "find-a-job", status: "active" },
    ],
    storyFlags: { momJobConcern: true, willHelpMom: true, coffeeErrandHeard: true },
  }),
  save({
    momTalked: true,
    currentSceneId: "ethan-room",
    gameState: { time: 195, location: "Home" },
    quests: [
      { id: "talk-to-mom", status: "completed" },
      { id: "the-tape", status: "completed" },
      { id: "find-a-job", status: "active" },
      { id: "light-on-the-hill", status: "active" },
    ],
    storyFlags: {
      rachelMet: true,
      walterStationTalk: true,
      sanatoriumSeenFromStreet: true,
      willHelpMom: true,
    },
  }),
];

async function measure(page) {
  return page.evaluate(() => {
    const frame = document.querySelector("[class*='scene-image-frame-']");
    const panel = document.querySelector(".scene-info-panel");
    const stack = document.querySelector(".scene-info-stack");
    if (!frame || !panel || !stack) return { sceneId: null, hits: [] };
    const sceneClass = [...frame.classList].find((name) =>
      name.startsWith("scene-image-frame-")
      && name !== "scene-image-frame"
      && !name.startsWith("scene-image-frame-weather")
      && !name.startsWith("scene-image-frame-caption")
      && !name.startsWith("scene-image-frame-has")
      && !name.startsWith("scene-image-frame-conversation")
      && !name.startsWith("scene-image-frame-interim")
      && !name.startsWith("scene-image-frame-synthetic"),
    );
    const sceneId = sceneClass?.replace("scene-image-frame-", "") ?? "unknown";
    const hits = [];
    const hit = (cover, target, overlap) => {
      hits.push({ sceneId, cover, hotspot: target, overlap });
    };
    const art = document.querySelector(".scene-art");
    // Caption and card are measured in the same layout as the hotspots.
    // On a phone the stack is in normal flow, so inserting the card and
    // then removing it before reading hotspots made the caption look like
    // it covered the picture.
    const compareCovers = (covers) => {
      const artRect = art?.getBoundingClientRect();
      for (const hotspot of document.querySelectorAll(".scene-hotspot")) {
        const rect = hotspot.getBoundingClientRect();
        if (rect.width < 2 || rect.height < 2) continue;
        const box = { top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom };
        const name = hotspot.getAttribute("aria-label") || hotspot.className;
        for (const cover of covers) {
          if (artRect) {
            const ax = Math.min(cover.right, artRect.right) - Math.max(cover.left, artRect.left);
            const ay = Math.min(cover.bottom, artRect.bottom) - Math.max(cover.top, artRect.top);
            if (ax <= 1 || ay <= 1) continue;
          }
          const ix = Math.min(cover.right, box.right) - Math.max(cover.left, box.left);
          const iy = Math.min(cover.bottom, box.bottom) - Math.max(cover.top, box.top);
          if (ix > 1 && iy > 1) hit(cover.kind, name, `${Math.round(ix)}x${Math.round(iy)}`);
        }
      }
    };
    const boxOf = (element, kind) => {
      const rect = element.getBoundingClientRect();
      return {
        kind,
        top: rect.top,
        left: rect.left,
        right: rect.right,
        bottom: rect.bottom,
      };
    };
    const viewport = window.innerWidth;
    const panelRect = panel.getBoundingClientRect();
    if (viewport > 640) {
      if (panelRect.width < 279) hit("width", "caption", `${Math.round(panelRect.width)}<280`);
      if (panelRect.width > 441) hit("width", "caption", `${Math.round(panelRect.width)}>440`);
    } else if (Math.abs(panelRect.width - (viewport - 32)) > 4) {
      hit("width", "caption", `${Math.round(panelRect.width)}!=${viewport - 32}`);
    }
    const vh = window.innerHeight;
    const inside = (el, name) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;
      if (rect.top < -1 || rect.left < -1 || rect.right > viewport + 1 || rect.bottom > vh + 1) {
        hit(
          "viewport",
          name,
          `${Math.round(rect.left)},${Math.round(rect.top)}-${Math.round(rect.right)},${Math.round(rect.bottom)}`,
        );
      }
    };
    inside(panel, "caption");
    inside(document.querySelector(".scene-caption-plate-row"), "caption-tab");
    inside(document.querySelector(".scene-caption-thought"), "caption-thought");
    inside(document.querySelector(".opening-thought"), "thought");
    inside(document.querySelector(".overlayActionButtons"), "choices");
    const buttonList = document.querySelector(".overlayActionButtons");
    const thoughtBar = document.querySelector(".opening-thought, .late-night-thought");
    const panelCovers = [buttonList, thoughtBar].filter(Boolean).map((element) =>
      boxOf(element, element === buttonList ? "choice-panel" : "thought-bar"),
    );
    compareCovers(panelCovers);
    compareCovers([boxOf(panel, "caption")]);
    for (const hotspot of document.querySelectorAll(".scene-hotspot")) {
      const label = hotspot.querySelector("span");
      if (label) label.style.opacity = "1";
    }
    const choice = document.querySelector(".overlayActionList");
    const heading = choice?.querySelector("h2");
    const buttons = choice?.querySelector(".overlayActionButtons");
    const obstacles = [buttons, heading].filter(Boolean).map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        kind: element === heading ? "heading" : "choices",
        top: rect.top,
        left: rect.left,
        right: rect.right,
        bottom: rect.bottom,
      };
    });
    for (const label of document.querySelectorAll(".scene-hotspot span")) {
      const rect = label.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) continue;
      const box = { top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom };
      const name = `label:${label.textContent?.trim() ?? ""}`;
      for (const obstacle of obstacles) {
        const ix = Math.min(obstacle.right, box.right) - Math.max(obstacle.left, box.left);
        const iy = Math.min(obstacle.bottom, box.bottom) - Math.max(obstacle.top, box.top);
        if (ix > 1 && iy > 1) hit(obstacle.kind, name, `${Math.round(ix)}x${Math.round(iy)}`);
      }
    }
    for (const thought of document.querySelectorAll(".late-night-thought, .opening-thought")) {
      const rect = thought.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) continue;
      const box = { top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom };
      for (const obstacle of obstacles) {
        const ix = Math.min(obstacle.right, box.right) - Math.max(obstacle.left, box.left);
        const iy = Math.min(obstacle.bottom, box.bottom) - Math.max(obstacle.top, box.top);
        if (ix > 1 && iy > 1) hit(obstacle.kind, thought.className, `${Math.round(ix)}x${Math.round(iy)}`);
      }
    }
    return { sceneId, hits };
  });
}

async function probeLead(page, sceneId) {
  await page.evaluate(() => {
    document.querySelector("[data-caption-probe]")?.remove();
    const stack = document.querySelector(".scene-info-stack");
    if (!stack) return;
    const fake = document.createElement("button");
    fake.className = "quest-lead";
    fake.dataset.captionProbe = "lead";
    fake.innerHTML = "<span>New lead</span><p>Coffee for Mom</p>";
    stack.appendChild(fake);
  });
  await new Promise((resolve) => setTimeout(resolve, 80));
  return page.evaluate((sceneId) => {
    const fake = document.querySelector("[data-caption-probe]");
    const art = document.querySelector(".scene-art");
    const hits = [];
    if (!fake || !art) return hits;
    const cover = fake.getBoundingClientRect();
    const artRect = art.getBoundingClientRect();
    for (const hotspot of document.querySelectorAll(".scene-hotspot")) {
      const rect = hotspot.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) continue;
      const ax = Math.min(cover.right, artRect.right) - Math.max(cover.left, artRect.left);
      const ay = Math.min(cover.bottom, artRect.bottom) - Math.max(cover.top, artRect.top);
      if (ax <= 1 || ay <= 1) continue;
      const ix = Math.min(cover.right, rect.right) - Math.max(cover.left, rect.left);
      const iy = Math.min(cover.bottom, rect.bottom) - Math.max(cover.top, rect.top);
      if (ix > 1 && iy > 1) {
        hits.push({
          sceneId,
          cover: "card",
          hotspot: hotspot.getAttribute("aria-label") || hotspot.className,
          overlap: `${Math.round(ix)}x${Math.round(iy)}`,
        });
      }
    }
    fake.remove();
    return hits;
  }, sceneId);
}

async function clickText(page, text) {
  const clicked = await page.evaluate((label) => {
    const button = [...document.querySelectorAll("button")].find((entry) =>
      (entry.textContent ?? "").trim().startsWith(label),
    );
    if (!button) return false;
    button.click();
    return true;
  }, text);
  if (!clicked) throw new Error(`No button starting with ${text}`);
}

async function loadProfile(page, profile) {
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.evaluate((slot) => {
    localStorage.setItem("harlow-save-slots", JSON.stringify([slot]));
  }, {
    slot: 1,
    savedAt: new Date().toISOString(),
    save: profile,
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(() =>
    [...document.querySelectorAll("button")].some((button) =>
      (button.textContent ?? "").trim().startsWith("Continue")
    ),
    { timeout: 20000 },
  );
  await new Promise((resolve) => setTimeout(resolve, 300));
  await clickText(page, "Continue");
  await page.waitForSelector(".scene-image", { timeout: 20000 });
  await new Promise((resolve) => setTimeout(resolve, 400));
}

async function sceneIds(page) {
  await clickText(page, "Admin travel");
  await page.waitForSelector(".adminTravelPanel button");
  const ids = await page.evaluate(() =>
    [...document.querySelectorAll(".adminTravelPanel button")].map((button) => ({
      label: button.textContent ?? "",
    })),
  );
  await clickText(page, "Hide admin travel");
  return ids;
}

async function visit(page, label) {
  await clickText(page, "Admin travel");
  await page.waitForSelector(".adminTravelPanel button");
  await page.evaluate((wanted) => {
    const button = [...document.querySelectorAll(".adminTravelPanel button")]
      .find((entry) => (entry.textContent ?? "") === wanted);
    button?.click();
  }, label);
  await page.waitForSelector(".scene-image");
  await new Promise((resolve) => setTimeout(resolve, 800));
  return measure(page);
}

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const onlyScenes = (process.env.SCENES ?? "")
  .split(",")
  .map((entry) => entry.trim().toLowerCase())
  .filter(Boolean);
const onlyViewport = process.env.VIEWPORT ?? "";

const collisions = [];
try {
  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() => {
    sessionStorage.removeItem("harlow-active-session");
  });
  for (const viewport of VIEWPORTS) {
    const viewportName = `${viewport.width}x${viewport.height}`;
    if (onlyViewport && viewportName !== onlyViewport) continue;
    await page.setViewport(viewport);
    // Headless Chrome reports a coarse pointer, which would measure the
    // touch label layout on a desktop window. Match the viewport.
    const coarse = viewport.width < 641;
    const client = await page.createCDPSession();
    await client.send("Emulation.setEmulatedMedia", {
      features: [
        { name: "hover", value: coarse ? "none" : "hover" },
        { name: "pointer", value: coarse ? "coarse" : "fine" },
      ],
    });
    await client.detach();
    for (const profile of PROFILES) {
      await loadProfile(page, profile);
      const landing = await measure(page);
      landing.hits.push(...await probeLead(page, landing.sceneId));
      process.stderr.write(`  landing ${landing.sceneId} hits ${landing.hits.length}\n`);
      for (const hit of landing.hits) {
        collisions.push({ viewport: `${viewport.width}x${viewport.height}`, ...hit });
      }
      const labels = await sceneIds(page);
      process.stderr.write(`profile ${profile.gameState.time} ${viewport.width}x${viewport.height} scenes ${labels.length}\n`);
      for (const { label } of labels) {
        if (onlyScenes.length && !onlyScenes.some((id) => label.toLowerCase().includes(id))) {
          continue;
        }
        const result = await visit(page, label);
        result.hits.push(...await probeLead(page, result.sceneId));
        process.stderr.write(`  ${result.sceneId} hits ${result.hits.length}\n`);
        for (const hit of result.hits) {
          collisions.push({ viewport: `${viewport.width}x${viewport.height}`, ...hit });
        }
      }
    }
  }
} finally {
  await browser.close();
}

const unique = new Map();
for (const hit of collisions) {
  const key = `${hit.viewport}|${hit.sceneId}|${hit.cover}|${hit.hotspot}`;
  if (!unique.has(key)) unique.set(key, hit);
}
const list = [...unique.values()];
console.log(JSON.stringify(list, null, 2));
console.log(`${list.length} caption/hotspot collisions`);
if (list.length) process.exit(1);
