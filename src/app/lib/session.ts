import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE = "care_desk_session";
const MAX_AGE_SECONDS = 60 * 60 * 12;

export interface SessionPayload {
  userId: string;
}

function key(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET is missing or it is shorter than 32");
  }
  return new TextEncoder().encode(secret);
}

export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(key());
}

export async function decrypt(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), {
      algorithms: ["HS256"],
    });
    return typeof payload.userId === "string"
      ? { userId: payload.userId }
      : null;
  } catch {
    return null;
  }
}

export async function createSession(
  userId: string
): Promise<void> {
  const token = await encrypt({ userId });
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return decrypt(store.get(COOKIE)?.value)
}

export async function deleteSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE)
}
