/** Split authored paragraphs without summarizing, translating or inventing details. */
export function splitRichParagraphs(value: string): string[] {
  return value.replace(/\r\n?/g, '\n').split(/\n\s*\n|\n/g).map((part) => part.trim()).filter(Boolean)
}
