import DOMPurify from "isomorphic-dompurify";
import { cn } from "@/lib/utils";

const ALLOWED_TAGS = [
  "p", "br", "strong", "b", "em", "i", "u", "s",
  "h1", "h2", "h3", "h4",
  "ul", "ol", "li", "a", "blockquote", "div", "span", "hr",
  "table", "thead", "tbody", "tr", "th", "td", "img", "mark",
];

// `style` is allow-listed only for the color/highlight/text-align inline styles
// Tiptap emits (DOMPurify still strips any unsafe values, e.g. url()/expression()).
const ALLOWED_ATTR = [
  "href", "target", "rel", "style", "src", "alt", "width", "height", "colspan", "rowspan",
];

// Shared so the editor (rich-text-editor.tsx) and this read-only renderer render identically.
export const MEETING_CONTENT_CLASSES =
  "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 " +
  "[&_h1]:text-xl [&_h1]:font-semibold [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:text-base [&_h3]:font-semibold " +
  "[&_a]:text-primary [&_a]:underline " +
  "[&_blockquote]:border-l-2 [&_blockquote]:border-gray-300 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-gray-600 " +
  "[&_table]:my-2 [&_table]:w-full [&_table]:border-collapse " +
  "[&_th]:border [&_th]:border-gray-300 [&_th]:bg-gray-100 [&_th]:p-1.5 [&_th]:text-left " +
  "[&_td]:border [&_td]:border-gray-300 [&_td]:p-1.5 " +
  "[&_img]:max-w-full [&_img]:rounded [&_mark]:rounded-sm [&_mark]:px-0.5";

interface HtmlContentProps {
  html: string;
  className?: string;
}

/** Renders admin-authored rich text safely by stripping anything but a small allow-list of tags. */
export function HtmlContent({ html, className }: HtmlContentProps) {
  const clean = DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR });

  return (
    <div
      className={cn(MEETING_CONTENT_CLASSES, className)}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
