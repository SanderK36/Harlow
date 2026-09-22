# Harlow

## Adding game content

### Add a scene

1. Put the scene artwork in `public/images/locations/...`.
2. In `src/game/scenes.ts`, create a `Scene` object with a unique `id`, story,
   `location`, day/night images, and choices.
3. Add that object to the exported `scenes` map at the bottom of the file.
4. Add a choice in an existing scene whose `nextScene` equals the new id.
5. For an outdoor destination, also add it to `exteriorDestinations` so it
   appears in walk and bus menus.

### Add an item

1. Put its image in `public/images/items/`.
2. Add `itemToAdd: "Item name"` to a choice, or add it to a shop in
   `src/components/ShopWindow/ShopWindow.tsx`.
3. Add the same name and image path to `getItemImage` in
   `src/components/InventoryWindow/InventoryWindow.tsx`.

Item names are currently the inventory IDs, so capitalization and spelling must
match in all three places.

### Add an NPC

1. Put their portrait in `public/images/characters/`.
2. Add `{ name, image, from?, until? }` to a scene's `characters` list.
3. Add dialogue with `npc("Name", "Dialogue")` in the scene conversation.
4. Add the name/path to `getPortrait` in `src/components/StoryLog/StoryLog.tsx`.
5. If their conversation opens from a regular scene choice, add that choice's
   action to `CONVERSATION_ACTIONS` in `src/game/useGame.ts`.

`from` and `until` are minutes after midnight; for example, 480 is 08:00 and
1080 is 18:00.

## Run locally

### Start development

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
