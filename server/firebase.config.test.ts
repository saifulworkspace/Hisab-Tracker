import { describe, expect, it } from "vitest";

describe("Firebase Web App configuration", () => {
  it("accepts the configured API key at the Firebase Auth endpoint", async () => {
    const apiKey = process.env.VITE_FIREBASE_API_KEY;
    expect(apiKey, "VITE_FIREBASE_API_KEY must be configured").toBeTruthy();

    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey!)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "hisab-config-smoke-test@example.invalid", password: "not-a-real-password", returnSecureToken: true }),
    });
    const payload = await response.json() as { error?: { message?: string } };
    expect(response.status).toBe(400);
    expect(payload.error?.message).not.toBe("API_KEY_INVALID");
  });
});
