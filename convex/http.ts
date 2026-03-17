import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";

const http = httpRouter();

// HTTP action for file download (public via share token)
http.route({
  path: "/downloadDocument",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    
    if (!token) {
      return new Response("Missing token", { status: 400 });
    }
    
    const doc = await ctx.runQuery(api.documents.validateShare, { token });
    
    if (!doc) {
      return new Response("Invalid or expired token", { status: 403 });
    }
    
    if (!doc.storageId) {
      return new Response("File not found", { status: 404 });
    }
    
    const blob = await ctx.storage.get(doc.storageId);
    
    return new Response(blob, {
      headers: {
        "Content-Type": doc.mimeType,
        "Content-Disposition": `attachment; filename="${doc.originalName}"`,
      },
    });
  }),
});

// AgentMail webhook — receives inbound email notifications
http.route({
  path: "/agentmail/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      // Verify webhook signature if secret is configured
      const bodyText = await request.text();
      const webhookSecret = process.env.AGENTMAIL_WEBHOOK_SECRET;
      if (webhookSecret) {
        const signature = request.headers.get("X-Signature");
        if (!signature) {
          return new Response("Missing signature", { status: 401 });
        }
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
          "raw",
          encoder.encode(webhookSecret),
          { name: "HMAC", hash: "SHA-256" },
          false,
          ["sign"]
        );
        const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(bodyText));
        const expectedSig = Array.from(new Uint8Array(sig))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        if (signature !== expectedSig) {
          return new Response("Invalid signature", { status: 401 });
        }
      } else {
        console.warn("[SECURITY] AGENTMAIL_WEBHOOK_SECRET not set — skipping signature verification");
      }

      const body = JSON.parse(bodyText);

      if (body.event_type !== "message.received" || !body.message) {
        return new Response("OK", { status: 200 });
      }

      const msg = body.message;
      const fromEmail =
        msg.from_?.[0]?.email ?? msg.from_?.email ?? "";
      const toEmail =
        msg.to?.[0]?.email ?? msg.to?.email ?? "";

      const attachments = (msg.attachments ?? [])
        .filter((a: any) => !a.inline)
        .map((a: any) => ({
          attachmentId: a.attachment_id,
          filename: a.filename ?? "attachment",
          contentType: a.content_type ?? "application/octet-stream",
          size: a.size ?? 0,
        }));

      // Schedule async processing (return 200 immediately)
      await ctx.scheduler.runAfter(0, internal.emailActions.processInboundEmail, {
        inboxId: msg.inbox_id,
        messageId: msg.message_id,
        threadId: msg.thread_id,
        fromEmail,
        toEmail,
        subject: msg.subject ?? "(no subject)",
        textBody: msg.text?.slice(0, 500),
        attachments,
      });

      return new Response("OK", { status: 200 });
    } catch (error: any) {
      console.error("Webhook error:", error);
      return new Response("Internal error", { status: 500 });
    }
  }),
});

export default http;
