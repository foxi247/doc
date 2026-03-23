import type { ChatMessage } from "@/lib/store/chat";

export function exportChatToPdf(messages: ChatMessage[], locale: string) {
  const isRu = locale === "ru";
  const title = isRu ? "MedNavigator AI — История чата" : "MedNavigator AI — Chat History";
  const date = new Date().toLocaleDateString(isRu ? "ru-RU" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const messagesHtml = messages
    .filter((m) => !m.isLoading && m.content.trim())
    .map((m) => {
      const role = m.role === "user" ? (isRu ? "Вы" : "You") : "MedNavigator AI";
      const bg = m.role === "user" ? "#eff6ff" : "#f8fafc";
      const align = m.role === "user" ? "right" : "left";
      const content = m.content.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
      return `
        <div style="margin-bottom:12px;text-align:${align}">
          <div style="display:inline-block;max-width:80%;background:${bg};padding:10px 14px;border-radius:12px;font-size:14px;line-height:1.6;text-align:left">
            <div style="font-size:11px;color:#94a3b8;margin-bottom:4px;font-weight:600">${role}</div>
            ${content}
          </div>
        </div>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html lang="${isRu ? "ru" : "en"}">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:700px;margin:40px auto;padding:0 20px;color:#1e293b}
    h1{font-size:20px;margin-bottom:4px}
    .meta{color:#64748b;font-size:13px;margin-bottom:32px}
    .disclaimer{margin-top:32px;padding:12px;background:#fef9c3;border-radius:8px;font-size:12px;color:#854d0e}
    @media print{body{margin:0}}
  </style>
</head>
<body>
  <h1>${title}</h1>
  <div class="meta">${date}</div>
  ${messagesHtml}
  <div class="disclaimer">⚠️ ${isRu ? "Этот чат является информационным и не заменяет консультацию врача." : "This chat is informational only and does not replace medical advice."}</div>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  }
}
