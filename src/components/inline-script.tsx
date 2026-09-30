/**
 * Script that runs while the HTML is parsed, before React hydrates.
 * The type swap keeps React from warning about a <script> rendered on the client.
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
