// Renders every notification email to email-preview-<name>-<locale>.html
// in the project root so you can open them in a browser.
//   npm run email:preview
import fs from "node:fs";
import path from "node:path";
import { emailCopy } from "../src/care-desk/host/email-copy.ts";
import {
  renderStatusEmail,
  renderTicketAssignedEmail,
  renderTicketCreatedEmail,
  type RenderedEmail,
} from "../src/care-desk/host/email-template.ts";

const brand = "Care Desk";
const theme = { accentColor: "#2563eb" };
const base = "http://localhost:3000";

for (const locale of ["en", "ru"]) {
  const copy = emailCopy(locale);
  const previews: Record<string, RenderedEmail> = {
    status: renderStatusEmail({
      brand,
      copy,
      theme,
      requesterName: "Alex Morgan",
      number: "#002",
      subject: "Payslip for <August> not received",
      status: "resolved",
      comment: "The payslip was sent again.\nCheck the <b>Spam</b> folder if it is not in your inbox.",
    }),
    assigned: renderTicketAssignedEmail({
      brand,
      copy,
      theme,
      operatorName: "Sam Lee",
      number: "#012",
      subject: "VPN does not connect <from home>",
      priority: "high",
      requesterName: "Alex Morgan",
      dueDate: new Date(2026, 8, 15),
      url: `${base}/${locale}/desk/8b0f0c1e-0000-4000-8000-000000000012`,
    }),
    created: renderTicketCreatedEmail({
      brand,
      copy,
      theme,
      number: "#014",
      subject: "No access to the accounting system <since morning>",
      description: "Hello!\nSince this morning I cannot sign in, it says “wrong password”. I did not change it.",
      category: "IT",
      requesterName: "Alex Morgan",
      requesterEmail: "alex.morgan@example.com",
      requesterPhone: "+1 555 000 00 00",
      url: `${base}/${locale}/desk/8b0f0c1e-0000-4000-8000-000000000014`,
    }),
  };

  for (const [name, mail] of Object.entries(previews)) {
    let html = mail.html;
    for (const a of mail.attachments) {
      if (a.cid && Buffer.isBuffer(a.content)) {
        html = html.replace(`cid:${a.cid}`, `data:image/png;base64,${a.content.toString("base64")}`);
      }
    }
    const out = path.join(process.cwd(), `email-preview-${name}-${locale}.html`);
    fs.writeFileSync(out, html, "utf8");
    console.log(`[${name}/${locale}] ${mail.subject} -> ${out}`);
  }
}
