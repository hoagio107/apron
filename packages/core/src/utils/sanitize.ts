const DANGEROUS_TAGS = new Set([
  'script',
  'iframe',
  'object',
  'embed',
  'form',
  'base',
  'meta',
  'link',
  'style',
  'applet',
  'foreignobject',
]);

const URL_ATTRIBUTES = new Set(['href', 'src', 'xlink:href', 'action', 'formaction', 'Poster']);

function isDangerousUri(val: string): boolean {
  const normalized = val.replace(/[\u0000-\u0020]+/g, '').toLowerCase();
  return (
    normalized.startsWith('javascript:') ||
    normalized.startsWith('vbscript:') ||
    normalized.startsWith('data:text/html') ||
    normalized.startsWith('data:application/')
  );
}

function regexFallbackSanitize(dirty: string): string {
  return dirty
    .replace(/<(script|iframe|object|embed|form|base|meta|link|style|applet|foreignobject)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<(script|iframe|object|embed|form|base|meta|link|style|applet|foreignobject)\b[^>]*\/?>/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s+(href|src|xlink:href|action|formaction)\s*=\s*(?:"\s*(?:javascript|vbscript|data:text\/html)[^"]*"|'\s*(?:javascript|vbscript|data:text\/html)[^']*')/gi, '');
}

/**
 * Làm sạch chuỗi HTML (chống Stored XSS từ file JSON import hoặc AI output)
 */
export function sanitizeHtml(dirty?: string | null): string {
  if (!dirty) return '';
  if (typeof DOMParser === 'undefined') {
    return regexFallbackSanitize(dirty);
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(dirty, 'text/html');
    const elements = Array.from(doc.body.querySelectorAll('*'));

    for (const el of elements) {
      const tag = el.tagName.toLowerCase();
      if (DANGEROUS_TAGS.has(tag)) {
        el.remove();
        continue;
      }

      for (const attr of Array.from(el.attributes)) {
        const attrName = attr.name.toLowerCase();
        if (attrName.startsWith('on') || attrName === 'srcdoc') {
          el.removeAttribute(attr.name);
        } else if (URL_ATTRIBUTES.has(attrName) && isDangerousUri(attr.value)) {
          el.removeAttribute(attr.name);
        }
      }
    }

    return doc.body.innerHTML;
  } catch {
    return regexFallbackSanitize(dirty);
  }
}

/**
 * Làm sạch chuỗi SVG tùy chỉnh trước khi render
 */
export function sanitizeSvg(dirty?: string | null): string {
  if (!dirty) return '';
  return sanitizeHtml(dirty);
}

/**
 * Kiểm tra và chuyển đổi URL YouTube sang dạng embed an toàn (chống iframe injection)
 */
export function getSafeYoutubeEmbedUrl(rawUrl?: string | null): string | null {
  if (!rawUrl) return null;
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return null;
    }
    const host = parsed.hostname.toLowerCase();
    let videoId: string | null = null;

    if (host === 'youtu.be') {
      videoId = parsed.pathname.slice(1).split('/')[0] || null;
    } else if (host === 'youtube.com' || host === 'www.youtube.com' || host === 'm.youtube.com') {
      if (parsed.pathname === '/watch') {
        videoId = parsed.searchParams.get('v');
      } else if (parsed.pathname.startsWith('/embed/') || parsed.pathname.startsWith('/shorts/')) {
        videoId = parsed.pathname.split('/')[2] || null;
      }
    }

    if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return null;
  } catch {
    return null;
  }
}

