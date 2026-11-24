/**
 * Math in assistant replies.
 *
 * `remark-math` runs with single-dollar math off, because in pt-BR `$` is
 * mostly money ("R$ 10 e R$ 20" must not become a formula). Instead, this
 * normalizes every delimiter models use into the `$$` form remark-math reads:
 *
 * - `\[ … \]` and a line that is only `$$ … $$` → display math block
 * - `\( … \)` → inline math
 * - `$ … $` → inline math, only when it can't be currency (Pandoc's rules:
 *   no space inside the delimiters, no digit right after the closing `$`,
 *   and never right after a letter or digit, as in `R$`/`US$`)
 *
 * Code (fenced and inline) is left untouched.
 */

/** Fenced code (possibly still open) or an inline code span. */
const CODE = /(```[\s\S]*?(?:```|$)|~~~[\s\S]*?(?:~~~|$)|`[^`\n]*`)/;

const block = (tex: string) => `\n$$\n${tex.trim()}\n$$\n`;
const inline = (tex: string) => `$$${tex.trim()}$$`;

function normalizeProse(text: string) {
  return (
    text
      // `$$ x $$` alone on its line is meant as display math.
      .replace(/^[ \t]*\$\$([^\n]+?)\$\$[ \t]*$/gm, (_, tex) => block(tex))
      .replace(/\\\[([\s\S]+?)\\\]/g, (_, tex) => block(tex))
      .replace(/\\\(([\s\S]+?)\\\)/g, (_, tex) => inline(tex))
      .replace(
        /(?<![\\$\p{L}\p{N}])\$(?![\s$])([^$\n]+?)(?<![\s\\])\$(?![\p{N}$])/gu,
        (_, tex) => inline(tex),
      )
  );
}

/** Rewrites the reply's math delimiters into the form remark-math reads. */
export function normalizeMath(text: string) {
  if (!/[$\\]/.test(text)) return text;
  return text
    .split(CODE)
    .map((part, i) => (i % 2 === 1 ? part : normalizeProse(part)))
    .join("");
}

/**
 * While streaming, drops a formula whose closing delimiter hasn't arrived,
 * so a half-written expression doesn't flash as raw TeX or a KaTeX error.
 * Expects text already passed through `normalizeMath`.
 */
export function hideOpenMath(text: string) {
  const parts = text.split(CODE);
  // Splitting on a capture group always ends with prose (maybe empty), and
  // only the prose after the last code chunk can still be open.
  let prose = parts.pop() ?? "";

  const openDisplay = prose.lastIndexOf("\\[");
  if (openDisplay > prose.lastIndexOf("\\]")) {
    prose = prose.slice(0, openDisplay);
  }
  const openInline = prose.lastIndexOf("\\(");
  if (openInline > prose.lastIndexOf("\\)")) {
    prose = prose.slice(0, openInline);
  }
  const dollars = [...prose.matchAll(/\$\$/g)];
  if (dollars.length % 2 === 1) {
    prose = prose.slice(0, dollars[dollars.length - 1].index);
  }

  return parts.join("") + prose;
}
