import ImageText from "@/components/ImageText/ImageText";
import { IMAGE_TEXT_DEMO, paperDataUri } from "@/components/ImageText/imageText";
import styles from "./demo.module.css";

const headline = IMAGE_TEXT_DEMO.find((item) => item.kind === "headline");
const caption = IMAGE_TEXT_DEMO.find((item) => item.kind === "caption");
const note = IMAGE_TEXT_DEMO.find((item) => item.kind === "note");

/**
 * Standalone look at text drawn on pictures. Not linked from the game.
 */
export default function ImageTextDemoPage() {
  return (
    <main className={styles.page}>
      <h1>Text on pictures</h1>
      <p>These plates are not in a scene. The words are drawn on the image.</p>
      {headline && (
        <section>
          <h2>Newspaper</h2>
          <ImageText
            src={paperDataUri("#e4d3b0")}
            alt="Blank newsprint"
            inscriptions={[headline]}
          />
        </section>
      )}
      {caption && (
        <section>
          <h2>Photograph</h2>
          <ImageText
            src="/images/characters/ethanParker/ethanParker.jpg"
            alt="A photograph of Ethan Parker"
            inscriptions={[caption]}
          />
        </section>
      )}
      {note && (
        <section>
          <h2>Handwritten note</h2>
          <ImageText
            src={paperDataUri("#efe2c6")}
            alt="Blank note paper"
            inscriptions={[note]}
          />
        </section>
      )}
    </main>
  );
}
