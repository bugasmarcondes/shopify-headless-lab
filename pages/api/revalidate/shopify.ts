import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextApiRequest, NextApiResponse } from "next";

// Shopify signs the exact bytes it sent, so we need the raw body, not parsed JSON.
export const config = { api: { bodyParser: false } };

async function readRawBody(req: NextApiRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

function isValidHmac(rawBody: Buffer, header: string | undefined, secret: string): boolean {
  if (!header) return false;
  const expected = Buffer.from(
    createHmac("sha256", secret).update(rawBody).digest("base64"),
  );
  const received = Buffer.from(header);
  // timingSafeEqual throws on different lengths, so check that first.
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[webhook] SHOPIFY_WEBHOOK_SECRET is not set");
    return res.status(500).json({ error: "Server misconfigured" });
  }

  const topic = req.headers["x-shopify-topic"];
  const rawBody = await readRawBody(req);
  const hmacHeader = req.headers["x-shopify-hmac-sha256"];

  // Reject before doing any work: no parsing, no revalidation.
  if (!isValidHmac(rawBody, typeof hmacHeader === "string" ? hmacHeader : undefined, secret)) {
    console.warn(`[webhook] topic=${topic} result=unauthorized`);
    return res.status(401).json({ error: "Invalid signature" });
  }

  let handle: unknown;
  try {
    handle = JSON.parse(rawBody.toString("utf8")).handle;
  } catch {
    return res.status(400).json({ error: "Invalid JSON" });
  }
  if (typeof handle !== "string" || !handle) {
    return res.status(400).json({ error: "Missing handle" });
  }

  try {
    await res.revalidate(`/products/${handle}`);
    console.log(`[webhook] topic=${topic} handle=${handle} result=ok`);
    return res.status(200).json({ revalidated: true });
  } catch (error) {
    // 500 makes Shopify retry the delivery later.
    console.error(`[webhook] topic=${topic} handle=${handle} result=error`, error);
    return res.status(500).json({ error: "Revalidation failed" });
  }
}
