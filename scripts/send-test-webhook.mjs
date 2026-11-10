// Sends a fake products/update webhook, signed like Shopify does.
// Usage: node --env-file=.env.local scripts/send-test-webhook.mjs <handle> [--wrong-signature | --tampered] [--url <url>]
import { createHmac } from "node:crypto";

const args = process.argv.slice(2);
const handle = args.find((arg) => !arg.startsWith("--"));
const urlFlag = args.indexOf("--url");
const url = urlFlag >= 0 ? args[urlFlag + 1] : "http://localhost:3000/api/revalidate/shopify";
const secret = process.env.SHOPIFY_WEBHOOK_SECRET;

if (!handle || !secret) {
  console.error("Usage: node --env-file=.env.local scripts/send-test-webhook.mjs <handle> [--wrong-signature | --tampered]");
  console.error("SHOPIFY_WEBHOOK_SECRET must be set.");
  process.exit(1);
}

const sign = (body, key) => createHmac("sha256", key).update(body).digest("base64");

let body = JSON.stringify({ id: 1, handle, title: "Test" });
let signature = sign(body, secret);

if (args.includes("--wrong-signature")) {
  signature = sign(body, "not-the-real-secret");
}
if (args.includes("--tampered")) {
  // Keep the original signature but change the body after signing.
  body = JSON.stringify({ id: 1, handle: "the-minimal-snowboard", title: "Test" });
}

const res = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Shopify-Topic": "products/update",
    "X-Shopify-Hmac-Sha256": signature,
  },
  body,
});

console.log(res.status, await res.text());
