import nodemailer from "nodemailer";
import { env } from "../../config/env";

const hasSmtpConfig = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);

const transporter = hasSmtpConfig
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS
      }
    })
  : nodemailer.createTransport({
      jsonTransport: true
    });

type OrderEmailItem = {
  title: string;
  quantity: number;
  price?: number;
  lineTotal?: number;
  note?: string;
};

type OrderEmailDetail = {
  label: string;
  value: string;
};

type OrderEmailPayload = {
  orderId: string;
  orderType: "monthly-plan" | "store-order";
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  planTitle?: string;
  deliverySummary?: string;
  paymentStatus?: string;
  orderDetails?: OrderEmailDetail[];
  items: OrderEmailItem[];
  totals: {
    subtotal?: number;
    discount?: number;
    vat?: number;
    safetyBag?: number;
    total: number;
  };
};

function getFromAddress() {
  return env.SMTP_FROM_EMAIL
    ? `"${env.SMTP_FROM_NAME}" <${env.SMTP_FROM_EMAIL}>`
    : undefined;
}

function getAdminOrderRecipient() {
  return env.ORDER_NOTIFICATION_EMAIL.trim();
}

function parseEmailList(value: string) {
  return value
    .split(/[;,]/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function assertTransactionalSmtpConfigured() {
  if (!hasSmtpConfig) {
    throw new Error("SMTP is not configured for transactional order emails.");
  }
}

function assertAdminOrderRecipientConfigured() {
  const recipient = getAdminOrderRecipient();
  if (!recipient) {
    throw new Error("ORDER_NOTIFICATION_EMAIL is not configured for admin order notifications.");
  }

  const recipients = parseEmailList(recipient);
  const sender = env.SMTP_FROM_EMAIL.trim().toLowerCase();
  if (sender && recipients.length > 0 && recipients.every((email) => email === sender)) {
    throw new Error("ORDER_NOTIFICATION_EMAIL must be a real admin inbox, not the SMTP_FROM_EMAIL sender address.");
  }
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatMad(value: unknown) {
  const amount = Number(value);
  return `MAD ${Number.isFinite(amount) ? amount.toFixed(2) : "0.00"}`;
}

function renderItemsText(items: OrderEmailItem[]) {
  return items
    .map((item) => {
      const amount = item.lineTotal ?? item.price;
      const priceText = amount !== undefined ? ` - ${formatMad(amount)}` : "";
      const noteText = item.note ? ` (${item.note})` : "";
      return `- ${item.title} x${item.quantity}${priceText}${noteText}`;
    })
    .join("\n");
}

function renderItemsHtml(items: OrderEmailItem[]) {
  return items
    .map((item) => {
      const amount = item.lineTotal ?? item.price;
      const priceText = amount !== undefined ? `<span>${escapeHtml(formatMad(amount))}</span>` : "";
      const noteText = item.note ? `<div style="color:#6b7280;font-size:13px;">${escapeHtml(item.note)}</div>` : "";
      return `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;">
            <strong>${escapeHtml(item.title)}</strong>
            ${noteText}
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;text-align:center;">${escapeHtml(item.quantity)}</td>
          <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;text-align:right;">${priceText}</td>
        </tr>
      `;
    })
    .join("");
}

function renderDetailsText(details: OrderEmailDetail[] = []) {
  return details
    .filter((detail) => detail.label && detail.value)
    .map((detail) => `${detail.label}: ${detail.value}`)
    .join("\n");
}

function renderDetailsHtml(details: OrderEmailDetail[] = []) {
  const rows = details.filter((detail) => detail.label && detail.value);
  if (!rows.length) return "";

  return `
    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:14px;margin:18px 0;">
      <div style="font-weight:700;margin-bottom:8px;">Order details</div>
      ${rows
        .map(
          (detail) => `
            <div style="display:flex;gap:10px;justify-content:space-between;border-top:1px solid #ffedd5;padding:7px 0;">
              <span style="color:#6b7280;">${escapeHtml(detail.label)}</span>
              <strong style="text-align:right;">${escapeHtml(detail.value)}</strong>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderTotalsText(totals: OrderEmailPayload["totals"]) {
  return [
    totals.subtotal !== undefined ? `Subtotal: ${formatMad(totals.subtotal)}` : "",
    totals.discount ? `Discount: -${formatMad(totals.discount)}` : "",
    totals.vat !== undefined ? `VAT: ${formatMad(totals.vat)}` : "",
    totals.safetyBag !== undefined ? `Safety bag: ${formatMad(totals.safetyBag)}` : "",
    `Total: ${formatMad(totals.total)}`
  ].filter(Boolean).join("\n");
}

function renderTotalsHtml(totals: OrderEmailPayload["totals"]) {
  const rows = [
    totals.subtotal !== undefined ? ["Subtotal", formatMad(totals.subtotal)] : null,
    totals.discount ? ["Discount", `-${formatMad(totals.discount)}`] : null,
    totals.vat !== undefined ? ["VAT", formatMad(totals.vat)] : null,
    totals.safetyBag !== undefined ? ["Safety bag", formatMad(totals.safetyBag)] : null,
    ["Total", formatMad(totals.total)]
  ].filter((item): item is string[] => Boolean(item));

  return rows
    .map(([label, value], index) => `
      <tr>
        <td style="padding:6px 0;${index === rows.length - 1 ? "font-weight:700;" : ""}">${escapeHtml(label)}</td>
        <td style="padding:6px 0;text-align:right;${index === rows.length - 1 ? "font-weight:700;" : ""}">${escapeHtml(value)}</td>
      </tr>
    `)
    .join("");
}

export async function sendLoginCodeEmail({
  email,
  code
}: {
  email: string;
  code: string;
}) {
  const result = await transporter.sendMail({
    from: getFromAddress(),
    to: email,
    subject: "Your Proteinbar login code",
    text: `Your Proteinbar verification code is ${code}. It expires in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2 style="margin-bottom: 12px;">Proteinbar Login Code</h2>
        <p>Use the verification code below to continue your login.</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px; margin: 18px 0;">${code}</p>
        <p>This code expires in 10 minutes.</p>
      </div>
    `
  });

  if (!hasSmtpConfig) {
    console.log("NodeMailer fallback payload:", JSON.stringify(result));
  }

  return result;
}

export async function sendCustomerOrderConfirmationEmail(order: OrderEmailPayload) {
  assertTransactionalSmtpConfigured();

  const subject = `Proteinbar order confirmation ${order.orderId}`;
  const intro =
    order.orderType === "monthly-plan"
      ? "Your payment was confirmed and your meal plan order is now confirmed."
      : "Your order has been received by Proteinbar.";
  const planLine = order.planTitle ? `Plan: ${order.planTitle}\n` : "";
  const deliveryLine = order.deliverySummary ? `Delivery/Pickup: ${order.deliverySummary}\n` : "";

  const result = await transporter.sendMail({
    from: getFromAddress(),
    to: order.customerEmail,
    subject,
    text: [
      `Hi ${order.customerName || "there"},`,
      "",
      intro,
      "",
      `Order ID: ${order.orderId}`,
      planLine.trim(),
      deliveryLine.trim(),
      order.paymentStatus ? `Payment: ${order.paymentStatus}` : "",
      renderDetailsText(order.orderDetails),
      "",
      "Items:",
      renderItemsText(order.items),
      "",
      renderTotalsText(order.totals),
      "",
      "Thank you for ordering from Proteinbar."
    ].filter(Boolean).join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:640px;">
        <h2 style="margin:0 0 12px;">Proteinbar order confirmed</h2>
        <p>Hi ${escapeHtml(order.customerName || "there")},</p>
        <p>${escapeHtml(intro)}</p>
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:14px;margin:18px 0;">
          <div><strong>Order ID:</strong> ${escapeHtml(order.orderId)}</div>
          ${order.planTitle ? `<div><strong>Plan:</strong> ${escapeHtml(order.planTitle)}</div>` : ""}
          ${order.deliverySummary ? `<div><strong>Delivery/Pickup:</strong> ${escapeHtml(order.deliverySummary)}</div>` : ""}
          ${order.paymentStatus ? `<div><strong>Payment:</strong> ${escapeHtml(order.paymentStatus)}</div>` : ""}
        </div>
        ${renderDetailsHtml(order.orderDetails)}
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr>
              <th style="text-align:left;padding-bottom:8px;">Item</th>
              <th style="text-align:center;padding-bottom:8px;">Qty</th>
              <th style="text-align:right;padding-bottom:8px;">Amount</th>
            </tr>
          </thead>
          <tbody>${renderItemsHtml(order.items)}</tbody>
        </table>
        <table style="width:100%;border-collapse:collapse;margin-top:14px;">${renderTotalsHtml(order.totals)}</table>
        <p style="margin-top:20px;">Thank you for ordering from Proteinbar.</p>
      </div>
    `
  });

  if (!hasSmtpConfig) {
    console.log("NodeMailer fallback payload:", JSON.stringify(result));
  }

  return result;
}

export async function sendAdminNewOrderNotificationEmail(order: OrderEmailPayload) {
  assertTransactionalSmtpConfigured();
  assertAdminOrderRecipientConfigured();

  const to = getAdminOrderRecipient();
  const subject = `New Proteinbar order ${order.orderId}`;
  const result = await transporter.sendMail({
    from: getFromAddress(),
    to,
    subject,
    text: [
      "A new order was placed.",
      "",
      `Order ID: ${order.orderId}`,
      `Order type: ${order.orderType}`,
      `Customer: ${order.customerName}`,
      `Email: ${order.customerEmail}`,
      order.customerPhone ? `Phone: ${order.customerPhone}` : "",
      order.planTitle ? `Plan: ${order.planTitle}` : "",
      order.deliverySummary ? `Delivery/Pickup: ${order.deliverySummary}` : "",
      order.paymentStatus ? `Payment: ${order.paymentStatus}` : "",
      renderDetailsText(order.orderDetails),
      "",
      "Items:",
      renderItemsText(order.items),
      "",
      renderTotalsText(order.totals)
    ].filter(Boolean).join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:680px;">
        <h2 style="margin:0 0 12px;">New Proteinbar order</h2>
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:14px;margin:18px 0;">
          <div><strong>Order ID:</strong> ${escapeHtml(order.orderId)}</div>
          <div><strong>Order type:</strong> ${escapeHtml(order.orderType)}</div>
          <div><strong>Customer:</strong> ${escapeHtml(order.customerName)}</div>
          <div><strong>Email:</strong> ${escapeHtml(order.customerEmail)}</div>
          ${order.customerPhone ? `<div><strong>Phone:</strong> ${escapeHtml(order.customerPhone)}</div>` : ""}
          ${order.planTitle ? `<div><strong>Plan:</strong> ${escapeHtml(order.planTitle)}</div>` : ""}
          ${order.deliverySummary ? `<div><strong>Delivery/Pickup:</strong> ${escapeHtml(order.deliverySummary)}</div>` : ""}
          ${order.paymentStatus ? `<div><strong>Payment:</strong> ${escapeHtml(order.paymentStatus)}</div>` : ""}
        </div>
        ${renderDetailsHtml(order.orderDetails)}
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr>
              <th style="text-align:left;padding-bottom:8px;">Item</th>
              <th style="text-align:center;padding-bottom:8px;">Qty</th>
              <th style="text-align:right;padding-bottom:8px;">Amount</th>
            </tr>
          </thead>
          <tbody>${renderItemsHtml(order.items)}</tbody>
        </table>
        <table style="width:100%;border-collapse:collapse;margin-top:14px;">${renderTotalsHtml(order.totals)}</table>
      </div>
    `
  });

  if (!hasSmtpConfig) {
    console.log("NodeMailer fallback payload:", JSON.stringify(result));
  }

  return result;
}
