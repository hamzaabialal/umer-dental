import "server-only";
import { normPhone } from "./format";

/**
 * Sends a WhatsApp alert to the clinic (NOTIFY_WHATSAPP_TO). Two providers, picked by which env vars are set:
 *
 * - Meta WhatsApp Cloud API (official): WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_TEMPLATE.
 *   Business-initiated messages must use an approved template; `params` fill its body {{1}}, {{2}}, …
 * - CallMeBot (free, for alerts to your own number): CALLMEBOT_APIKEY. Sends `text` as-is.
 *
 * Never throws: a failed alert must not fail the booking.
 */
export async function notifyClinic(text: string, params: string[]): Promise<void> {
  const to = normPhone(process.env.NOTIFY_WHATSAPP_TO);
  const { WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_TEMPLATE, CALLMEBOT_APIKEY } = process.env;
  try {
    if (!to) {
      console.warn("notifyClinic: NOTIFY_WHATSAPP_TO is not set; skipping WhatsApp alert");
    } else if (WHATSAPP_TOKEN && WHATSAPP_PHONE_NUMBER_ID && WHATSAPP_TEMPLATE) {
      const version = process.env.WHATSAPP_API_VERSION || "v23.0";
      const res = await fetch(`https://graph.facebook.com/${version}/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "template",
          template: {
            name: WHATSAPP_TEMPLATE,
            language: { code: process.env.WHATSAPP_TEMPLATE_LANG || "en" },
            components: [
              {
                type: "body",
                // Template parameters may not contain newlines, tabs or long runs of spaces.
                parameters: params.map((p) => ({ type: "text", text: p.replace(/\s+/g, " ").trim() || "-" })),
              },
            ],
          },
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) console.error("notifyClinic: WhatsApp Cloud API", res.status, await res.text());
    } else if (CALLMEBOT_APIKEY) {
      const url =
        `https://api.callmebot.com/whatsapp.php?phone=%2B${to}` +
        `&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(CALLMEBOT_APIKEY)}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
      if (!res.ok) console.error("notifyClinic: CallMeBot", res.status, await res.text());
    } else {
      console.warn("notifyClinic: no WhatsApp provider configured; skipping alert");
    }
  } catch (e) {
    console.error("notifyClinic: failed", e);
  }
}
