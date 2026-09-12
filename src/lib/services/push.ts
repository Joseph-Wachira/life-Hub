import { db } from "@/lib/db";

const EXPO_PUSH_ENDPOINT = "https://exp.host/--/api/v2/push/send";

interface ExpoPushMessage {
  to: string;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
}

/**
 * Sends a push notification to every device a user has registered, via
 * Expo's push service (no server-side credentials needed beyond the Expo
 * push tokens themselves — see https://docs.expo.dev/push-notifications/sending-notifications/).
 *
 * Implemented against Expo's documented HTTP API but NOT verified
 * end-to-end against a real device or EAS build in this environment — there
 * was no physical device/EAS project available to confirm delivery. Treat
 * this as "wired up, unverified" rather than "working." See the mobile
 * README section on push notifications for what would remain to confirm it.
 */
export async function sendExpoPushToUser(
  userId: string,
  input: { title: string; body?: string; data?: Record<string, unknown> }
): Promise<void> {
  const tokens = await db.pushToken.findMany({ where: { userId }, select: { token: true } });
  if (tokens.length === 0) return;

  const messages: ExpoPushMessage[] = tokens.map((t) => ({
    to: t.token,
    title: input.title,
    body: input.body,
    data: input.data,
  }));

  const response = await fetch(EXPO_PUSH_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
    },
    body: JSON.stringify(messages),
  });

  if (!response.ok) {
    throw new Error(`Expo push service responded with ${response.status}`);
  }
}

export async function registerPushToken(
  userId: string,
  token: string,
  platform: "ios" | "android",
  deviceName?: string
): Promise<void> {
  await db.pushToken.upsert({
    where: { token },
    update: { userId, platform, deviceName },
    create: { userId, token, platform, deviceName },
  });
}

export async function unregisterPushToken(userId: string, token: string): Promise<void> {
  await db.pushToken.deleteMany({ where: { token, userId } });
}
