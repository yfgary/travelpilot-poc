/** Keep authored multi-paragraph travel descriptions verbatim, in logical paragraphs.
 * This renderer does not shorten, translate, invent or fetch missing content.
 */
export function splitRichParagraphs(value: string): string[] {
  return value.replace(/\r\n?/g, '\n').split(/\n\s*\n|\n/g).map((part) => part.trim()).filter(Boolean)
}

export function RichText({ value }: { value: string }) {
  return <div className="place-rich-text">{splitRichParagraphs(value).map((part, index) =>
    <p key={index}>{part}</p>)}</div>
}
