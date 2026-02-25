import type { ContentSection } from "@/types/campaigns"

export function renderSectionHtml(section: ContentSection, _index: number): string {
  switch (section.type) {
    case "text":
      return `<div style="padding: 8px 24px;">${section.html}</div>`

    case "image": {
      const widthMap: Record<string, string> = { full: "100%", medium: "70%", small: "40%" }
      const imgWidth = widthMap[section.width || "full"]
      const imgTag = `<img src="${section.src}" alt="${section.alt || ""}" style="width:${imgWidth};max-width:100%;border-radius:8px;display:block;margin:0 auto;" />`
      const wrapped = section.href
        ? `<a href="${section.href}" target="_blank">${imgTag}</a>`
        : imgTag
      return `<div style="padding:8px 24px;text-align:center;">${wrapped}</div>`
    }

    case "button":
      return `<div style="padding:12px 0;text-align:center;">
        <a href="${section.url}" target="_blank" style="display:inline-block;background-color:${section.backgroundColor || "#ff75a8"};color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
          ${section.text}
        </a>
      </div>`

    case "divider":
      return `<hr style="margin:8px 24px;border:none;border-top:1px solid #e5e7eb;" />`

    case "spacer":
      return `<div style="height:${section.height || 24}px;"></div>`

    default:
      return ""
  }
}

export function buildEmailPreviewHtml(opts: {
  heading?: string
  sections: ContentSection[]
  buttonText?: string
  buttonUrl?: string
  footerText?: string
}): string {
  const sectionsHtml = opts.sections.map((s, i) => renderSectionHtml(s, i)).join("\n")

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f3f4f6; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; }
    .header { background: #ff75a8; padding: 16px 24px; color: #fff; }
    .header h2 { margin: 0; font-size: 18px; font-weight: 700; }
    .content { padding: 24px 0; }
    .content h1 { margin: 0 0 8px; padding: 0 24px; font-size: 22px; color: #1f2937; text-align: center; }
    .cta { text-align: center; padding: 16px 0; }
    .cta a { display: inline-block; background: #ff75a8; color: #fff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; }
    .footer { background: #f9fafb; padding: 20px 24px; text-align: center; }
    .footer p { margin: 0; font-size: 13px; color: #6b7280; }
    .footer a { color: #ff75a8; }
    .copyright { margin-top: 12px; font-size: 11px; color: #9ca3af; }
    img { max-width: 100%; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Marcela Koury</h2>
    </div>
    <div class="content">
      ${opts.heading ? `<h1>${opts.heading}</h1>` : ""}
      ${sectionsHtml}
    </div>
    ${opts.buttonText && opts.buttonUrl ? `
    <div class="cta">
      <a href="${opts.buttonUrl}">${opts.buttonText}</a>
    </div>` : ""}
    <div class="footer">
      <p>${opts.footerText || "Si tenes alguna pregunta, ponete en contacto con nuestro equipo en"} <a href="mailto:info@marcelakoury.com">info@marcelakoury.com</a></p>
      <p class="copyright">&copy; ${new Date().getFullYear()} Marcela Koury. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>`
}
