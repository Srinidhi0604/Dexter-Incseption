import { compare, hash } from "bcryptjs";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "replace-with-a-long-random-secret",
);

export interface AuthTokenPayload extends JWTPayload {
  sub: string;
  email: string;
  name: string;
}

export async function hashPassword(password: string) {
  return hash(password, 10);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return compare(password, passwordHash);
}

export async function signAuthToken(payload: {
  sub: string;
  email: string;
  name: string;
}) {
  return new SignJWT({
    email: payload.email,
    name: payload.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyAuthToken(token: string): Promise<AuthTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as AuthTokenPayload;
  } catch {
    return null;
  }
}
