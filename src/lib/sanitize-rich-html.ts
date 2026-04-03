const ALLOWED_TAGS = new Set([
  "A",
  "B",
  "BR",
  "EM",
  "FIGCAPTION",
  "FIGURE",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "IMG",
  "LI",
  "OL",
  "P",
  "STRONG",
  "UL",
]);

const ALLOWED_ATTRS = new Set([
  "alt",
  "class",
  "href",
  "rel",
  "src",
  "style",
  "target",
  "title",
]);

function isSafeUrl(value: string) {
  const normalized = value.trim().replace(/[\u0000-\u001F\u007F-\u009F\s]+/g, "").toLowerCase();

  if (!normalized) return false;
  if (normalized.startsWith("javascript:")) return false;
  if (normalized.startsWith("data:")) return false;
  if (normalized.startsWith("vbscript:")) return false;

  return (
    normalized.startsWith("http://") ||
    normalized.startsWith("https://") ||
    normalized.startsWith("/") ||
    normalized.startsWith("#")
  );
}

function stripUnsafeAttributes(element: Element) {
  const attrs = Array.from(element.attributes);

  for (const attr of attrs) {
    const name = attr.name.toLowerCase();
    const value = attr.value;

    if (name.startsWith("on")) {
      element.removeAttribute(attr.name);
      continue;
    }

    if (!ALLOWED_ATTRS.has(name)) {
      element.removeAttribute(attr.name);
      continue;
    }

    if ((name === "href" || name === "src") && !isSafeUrl(value)) {
      element.removeAttribute(attr.name);
      continue;
    }
  }

  if (element.tagName === "A") {
    const href = element.getAttribute("href");
    if (!href) {
      element.removeAttribute("target");
      element.removeAttribute("rel");
    } else if (element.getAttribute("target") === "_blank") {
      element.setAttribute("rel", "noopener noreferrer");
    }
  }
}

function sanitizeNode(node: Node, document: Document): Node | null {
  if (node.nodeType === Node.TEXT_NODE) {
    return document.createTextNode(node.textContent || "");
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  const element = node as Element;
  const tagName = element.tagName.toUpperCase();

  if (tagName === "SCRIPT") {
    return null;
  }

  if (!ALLOWED_TAGS.has(tagName)) {
    const fragment = document.createDocumentFragment();
    for (const child of Array.from(element.childNodes)) {
      const sanitizedChild = sanitizeNode(child, document);
      if (sanitizedChild) {
        fragment.appendChild(sanitizedChild);
      }
    }
    return fragment;
  }

  const cleanElement = document.createElement(tagName.toLowerCase());

  for (const attr of Array.from(element.attributes)) {
    cleanElement.setAttribute(attr.name, attr.value);
  }
  stripUnsafeAttributes(cleanElement);

  for (const child of Array.from(element.childNodes)) {
    const sanitizedChild = sanitizeNode(child, document);
    if (sanitizedChild) {
      cleanElement.appendChild(sanitizedChild);
    }
  }

  return cleanElement;
}

function basicFallbackSanitize(html: string) {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son[a-z]+\s*=\s*(['"]).*?\1/gi, "")
    .replace(/\s(href|src)\s*=\s*(['"])\s*javascript:[\s\S]*?\2/gi, "")
    .replace(/\s(href|src)\s*=\s*(['"])\s*data:[\s\S]*?\2/gi, "");
}

export function sanitizeRichHtml(html: string) {
  if (!html) return "";

  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return basicFallbackSanitize(html);
  }

  const parser = new DOMParser();
  const parsed = parser.parseFromString(html, "text/html");
  const cleanDocument = document.implementation.createHTMLDocument("");
  const container = cleanDocument.createElement("div");

  for (const child of Array.from(parsed.body.childNodes)) {
    const sanitizedChild = sanitizeNode(child, cleanDocument);
    if (sanitizedChild) {
      container.appendChild(sanitizedChild);
    }
  }

  return container.innerHTML;
}
