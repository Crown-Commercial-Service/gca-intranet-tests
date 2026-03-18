import Chance from "chance";

const chance = new Chance();

export function buildRealisticBodyContent(
  type: "compact" | "short" | "long" = "short",
): string {
  const paragraphs = type === "long" ? 5 : type === "short" ? 2 : 1;

  return `
    <div>
      ${Array.from({ length: paragraphs })
        .map(() => `<p>${chance.paragraph({ sentences: 3 })}</p>`)
        .join("")}

      <p>${chance.paragraph({ sentences: 2 })} <a href="${chance.url()}">Read more</a>.</p>

      <figure>
        <img src="/wp-content/uploads/2026/03/featured.jpg" alt="Example content image" />
        <figcaption>${chance.sentence({ words: 6 })}</figcaption>
      </figure>

      <ul>
        <li>${chance.sentence({ words: 5 })}</li>
        <li>${chance.sentence({ words: 6 })}</li>
        <li>${chance.sentence({ words: 7 })}</li>
      </ul>

      <p><strong>${chance.sentence({ words: 4 })}</strong></p>
    </div>
  `.trim();
}
