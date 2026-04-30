/**
 * pdf.ts — Shared PDF generation utility
 * Uses the server-side /api/pdf/generate endpoint (puppeteer)
 * Falls back to window.print() if the server fails
 */

export interface PdfOptions {
  /** HTML content to convert */
  html: string;
  /** Suggested filename without extension */
  filename?: string;
  /** Open in new tab for printing instead of downloading */
  mode?: "download" | "print";
}

/**
 * Generate a real PDF from HTML via the server-side puppeteer endpoint.
 * Returns true on success, false on failure (caller can fall back to window.print).
 */
export async function generatePdf(options: PdfOptions): Promise<boolean> {
  const { html, filename = "report", mode = "download" } = options;
  try {
    const res = await fetch("/api/pdf/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ html }),
    });
    if (!res.ok) return false;

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    if (mode === "print") {
      // Open in new tab so user can print
      const win = window.open(url, "_blank");
      if (win) {
        win.onload = () => {
          setTimeout(() => win.print(), 500);
        };
      }
    } else {
      // Download directly
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

    setTimeout(() => URL.revokeObjectURL(url), 10000);
    return true;
  } catch {
    return false;
  }
}

/**
 * Capture the inner HTML of a DOM element and send it to the PDF generator.
 * Inlines computed styles into a clone (matching the live tree) and embeds CSS for Puppeteer.
 */
export async function generatePdfFromElement(
  element: HTMLElement,
  options: Omit<PdfOptions, "html">
): Promise<boolean> {
  const clonedElement = element.cloneNode(true) as HTMLElement;

  /** Apply computed styles from the live `original` node to the parallel node in `clone`. */
  const applyComputedToClone = (original: Element, clone: Element) => {
    const computedStyle = window.getComputedStyle(original as HTMLElement);
    const styleString = Array.from(computedStyle).reduce((str, property) => {
      return `${str}${property}:${computedStyle.getPropertyValue(property)};`;
    }, "");
    (clone as HTMLElement).setAttribute("style", styleString);

    const origChildren = original.children;
    const cloneChildren = clone.children;
    for (let i = 0; i < origChildren.length; i++) {
      const c = cloneChildren[i];
      if (c) applyComputedToClone(origChildren[i], c);
    }
  };

  applyComputedToClone(element, clonedElement);

  const inlineStyleTags = Array.from(document.querySelectorAll("style"))
    .map((el) => el.outerHTML)
    .join("\n");

  const externalStyles = await Promise.all(
    Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(async (link) => {
      const href = (link as HTMLLinkElement).href;
      try {
        const response = await fetch(href);
        const css = await response.text();
        return `<style>${css}</style>`;
      } catch {
        return "";
      }
    })
  );

  const html = `<!DOCTYPE html>
<html dir="${document.documentElement.dir || "rtl"}" lang="${document.documentElement.lang || "ar"}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${externalStyles.join("\n")}
  ${inlineStyleTags}
  <style>
    @page { margin: 10mm; }
    body { margin: 0; padding: 0; background: white; }
    .print\\:hidden { display: none !important; }
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
  </style>
</head>
<body>
  ${clonedElement.innerHTML}
</body>
</html>`;

  return generatePdf({ ...options, html });
}
