import { describe, test, expect } from "vitest";
import { emailCopy } from "@/care-desk/host/email-copy";
import {
  renderStatusEmail,
  renderTicketAssignedEmail,
  renderTicketCreatedEmail,
} from "@/care-desk/host/email-template";

const brand = "Acme Desk";
const ru = emailCopy("ru");
const en = emailCopy("en");

describe("emailCopy", () => {
  test("unknown or missing locale falls back to English", () => {
    expect(emailCopy("kk")).toBe(en);
    expect(emailCopy(null)).toBe(en);
    expect(emailCopy("ru")).not.toBe(en);
  });
});

describe("renderStatusEmail", () => {
  test("ru: subject, headline, escaped subject and comment", () => {
    const mail = renderStatusEmail({
      brand,
      copy: ru,
      requesterName: "Иван",
      number: "#002",
      subject: "Лист <за август>",
      status: "resolved",
      comment: "Проверьте <b>Спам</b>\nвторая строка",
    });
    expect(mail.subject).toBe("Acme Desk — обращение #002: статус обновлён");
    expect(mail.html).toContain('<html lang="ru">');
    expect(mail.html).toContain("Статус вашего обращения обновлён");
    expect(mail.html).toContain("«Решено»");
    expect(mail.html).toContain("Лист &lt;за август&gt;");
    expect(mail.html).toContain("Проверьте &lt;b&gt;Спам&lt;/b&gt;<br>вторая строка");
    expect(mail.html).not.toContain("<b>Спам</b>");
    expect(mail.text).toContain("Здравствуйте, Иван!");
    expect(mail.text).toContain("Статус вашего обращения #002 «Лист <за август>» изменён: «Решено».");
  });

  test("en: same email in English", () => {
    const mail = renderStatusEmail({
      brand,
      copy: en,
      requesterName: "Ivan",
      number: "#002",
      subject: "Payslip <August>",
      status: "pending",
      comment: "Check <b>Spam</b>",
    });
    expect(mail.subject).toBe("Acme Desk — request #002: status updated");
    expect(mail.html).toContain('<html lang="en">');
    expect(mail.html).toContain("Request #002 “Payslip &lt;August&gt;”");
    expect(mail.html).toContain("Operator&#39;s comment:");
    expect(mail.text).toContain("The status of your request #002 “Payslip <August>” changed to Pending.");
    expect(mail.text).toContain("This is an automated notification from Acme Desk.");
  });

  test("no comment -> no comment panel", () => {
    const mail = renderStatusEmail({
      brand,
      copy: ru,
      requesterName: "Иван",
      number: "#003",
      subject: "x",
      status: "open",
    });
    expect(mail.html).not.toContain("Комментарий оператора");
  });

  test("a value containing {placeholder} text is not expanded again", () => {
    const mail = renderStatusEmail({
      brand,
      copy: en,
      requesterName: "{brand}",
      number: "#004",
      subject: "{status}",
      status: "closed",
    });
    expect(mail.text).toContain("Hello, {brand}!");
    expect(mail.text).toContain("“{status}” changed to Closed.");
  });

  test("no logo configured -> brand name as text, nothing attached", () => {
    const mail = renderStatusEmail({
      brand: "A & B",
      copy: en,
      requesterName: "R",
      number: "#001",
      subject: "s",
      status: "open",
    });
    expect(mail.attachments).toEqual([]);
    expect(mail.html).not.toContain("cid:");
    expect(mail.html).toContain(">A &amp; B</span>");
  });
});

describe("renderTicketAssignedEmail", () => {
  test("links to the ticket and lists details", () => {
    const url = "http://localhost:3000/ru/desk/abc";
    const mail = renderTicketAssignedEmail({
      brand,
      copy: ru,
      theme: { accentColor: "#123456" },
      operatorName: "Алишер",
      number: "#012",
      subject: "VPN <дома>",
      priority: "high",
      requesterName: "Иван & Ко",
      dueDate: new Date(2026, 8, 15),
      url,
    });
    expect(mail.subject).toBe("Acme Desk — вам назначено обращение #012");
    expect(mail.html).toContain("Новое обращение назначено вам");
    expect(mail.html).toContain("#012");
    expect(mail.html).toContain("«VPN &lt;дома&gt;»");
    expect(mail.html).toContain("<strong>Высокий</strong>");
    expect(mail.html).toContain("Иван &amp; Ко");
    expect(mail.html).toContain("Срок: 15.09.2026");
    expect(mail.html).toContain(`href="${url}"`);
    expect(mail.html).toContain("background-color: #123456");
    expect(mail.html).toContain(">Открыть обращение</a>");
    expect(mail.text).toContain(`Открыть обращение: ${url}`);
  });

  test("omits the due date line when absent, greets a nameless operator as a colleague", () => {
    const mail = renderTicketAssignedEmail({
      brand,
      copy: ru,
      operatorName: null,
      number: "#001",
      subject: "s",
      priority: "low",
      requesterName: "R",
      url: "http://x",
    });
    expect(mail.html).not.toContain("Срок:");
    expect(mail.text).not.toContain("Срок:");
    expect(mail.text).toContain("Здравствуйте, коллега!");
  });
});

describe("renderTicketCreatedEmail", () => {
  test("links to the ticket in the desk and lists escaped details", () => {
    const url = "http://localhost:3000/ru/desk/abc";
    const mail = renderTicketCreatedEmail({
      brand,
      copy: ru,
      number: "#014",
      subject: "Нет доступа <1С>",
      description: "Не могу войти\n<b>с утра</b>",
      category: "IT & связь",
      requesterName: "Иван Петров",
      requesterEmail: "ivan@example.com",
      requesterPhone: "+77010000000",
      url,
    });
    expect(mail.subject).toBe("Acme Desk — новое обращение #014");
    expect(mail.html).toContain("Новое обращение в Acme Desk");
    expect(mail.html).toContain("#014");
    expect(mail.html).toContain("«Нет доступа &lt;1С&gt;»");
    expect(mail.html).toContain("<strong>Иван Петров</strong>");
    expect(mail.html).toContain("Email: ivan@example.com");
    expect(mail.html).toContain("Телефон: +77010000000");
    expect(mail.html).toContain("Категория: IT &amp; связь");
    expect(mail.html).toContain("Не могу войти<br>&lt;b&gt;с утра&lt;/b&gt;");
    expect(mail.html).not.toContain("<b>с утра</b>");
    expect(mail.html).toContain(`href="${url}"`);
    expect(mail.html).toContain(">Открыть в Acme Desk</a>");
    expect(mail.text).toContain("Описание:\nНе могу войти\n<b>с утра</b>");
    expect(mail.text).toContain(`Открыть в Acme Desk: ${url}`);
  });

  test("omits optional contact and category lines when absent", () => {
    const mail = renderTicketCreatedEmail({
      brand,
      copy: ru,
      number: "#001",
      subject: "s",
      description: "d",
      requesterName: "R",
      url: "http://x",
    });
    expect(mail.html).not.toContain("Email:");
    expect(mail.html).not.toContain("Телефон:");
    expect(mail.html).not.toContain("Категория:");
    expect(mail.text).not.toContain("Категория:");
  });
});
