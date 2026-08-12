import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "p", "br", "strong", "b", "em", "i", "u", "s",
  "h1", "h2", "h3", "h4",
  "ul", "ol", "li", "a", "blockquote", "div", "span",
];

interface HtmlContentProps {
  html: string;
  className?: string;
}

/** Renders admin-authored rich text safely by stripping anything but a small allow-list of tags. */
export function HtmlContent({ html, className }: HtmlContentProps) {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ["href", "target", "rel"],
  });

  return (
    <div
      className={className}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
