import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("finance authentication", () => {
  it("rejects dashboard access without a signed-in user", async () => {
    const ctx: TrpcContext = {
      user: undefined,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    await expect(caller.finance.dashboard()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
