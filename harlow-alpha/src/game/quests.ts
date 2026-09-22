export type JobId = "needle-groove" | "gas-station" | "scrapyard";

export const jobDetails: Record<JobId, { name: string; employer: string; benefit: string }> = {
  "needle-groove": {
    name: "Needle & Groove",
    employer: "Johnny at Needle & Groove",
    benefit: "Johnny shares extra town information in conversation.",
  },
  "gas-station": {
    name: "Harlow Gas & Service",
    employer: "Ray Mercer at the gas station",
    benefit: "50% off gas-station shop items.",
  },
  scrapyard: {
    name: "Scrapyard",
    employer: "Big Roy at the scrapyard",
    benefit: "A sturdy crowbar for prying open locks and as a weapon.",
  },
};

export const findAJobQuest = {
  title: "Find a Job",
  objective: "Look at the hiring flyers on the light pole outside home.",
};
