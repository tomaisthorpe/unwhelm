const PUSHOVER_MESSAGES_URL = "https://api.pushover.net/1/messages.json";

type PushoverMessage = {
  user: string;
  title: string;
  message: string;
  url?: string;
  urlTitle?: string;
};

export function isPushoverConfigured() {
  return Boolean(process.env.PUSHOVER_APP_TOKEN);
}

export async function sendPushoverMessage(message: PushoverMessage) {
  const token = process.env.PUSHOVER_APP_TOKEN;

  if (!token) {
    throw new Error("Pushover is not configured");
  }

  const body = new URLSearchParams({
    token,
    user: message.user,
    title: message.title,
    message: message.message,
    priority: "0",
  });

  if (message.url) body.set("url", message.url);
  if (message.urlTitle) body.set("url_title", message.urlTitle);

  const response = await fetch(PUSHOVER_MESSAGES_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const result = (await response.json()) as {
    status?: number;
    request?: string;
    errors?: string[];
  };

  if (!response.ok || result.status !== 1 || !result.request) {
    throw new Error(
      result.errors?.join(", ") ||
        `Pushover returned HTTP ${response.status}`
    );
  }

  return { request: result.request };
}
