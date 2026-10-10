import { splitRichParagraphs } from '../../data/richText'

/** Display all authored paragraphs without truncation. */
export function RichText({ value }: { value: string }) {
  return <div className="place-rich-text">{splitRichParagraphs(value).map((part, index) =>
    <p key={index}>{part}</p>)}</div>
}
