"use node";

import { AgentMailClient } from "agentmail";

let _client: AgentMailClient | null = null;

function getClient(): AgentMailClient {
  if (!_client) {
    const apiKey = process.env.AGENTMAIL_API_KEY;
    if (!apiKey) throw new Error("AGENTMAIL_API_KEY not set");
    _client = new AgentMailClient({ apiKey });
  }
  return _client;
}

export async function createInbox(username: string, displayName: string) {
  const client = getClient();
  const inbox = await client.inboxes.create({
    username,
    displayName,
  });
  return inbox;
}

export async function sendEmail(inboxId: string, opts: {
  to: string[];
  subject: string;
  text: string;
  html: string;
  attachments?: Array<{ content: string; filename: string; contentType: string }>;
}) {
  const client = getClient();
  const result = await client.inboxes.messages.send(inboxId, {
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
    attachments: opts.attachments as any,
  });
  return result;
}

export async function getAttachment(inboxId: string, messageId: string, attachmentId: string, contentType: string): Promise<Blob> {
  const client = getClient();
  const response = await client.inboxes.messages.getAttachment(inboxId, messageId, attachmentId);
  // Always re-wrap with explicit content type to ensure valid Blob.type
  if (response instanceof Blob) {
    const buffer = await response.arrayBuffer();
    return new Blob([buffer], { type: contentType });
  }
  return new Blob([response as any], { type: contentType });
}

export async function registerWebhook(url: string, eventTypes: string[]) {
  const client = getClient();
  return await client.webhooks.create({
    url,
    eventTypes: eventTypes as any,
  });
}
