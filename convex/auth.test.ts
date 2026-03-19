import { describe, it, expect, vi } from "vitest";
import { requireRole, requirePatientSelfOrRole } from "./auth";

// Mock the Convex db context
function mockCtx(users: Record<string, any>) {
  return {
    db: {
      get: vi.fn(async (id: string) => users[id] ?? null),
    },
  };
}

describe("requireRole", () => {
  it("passes when user has an allowed role", async () => {
    const ctx = mockCtx({
      user1: { _id: "user1", role: "coordinator", email: "c@test.com" },
    });
    const result = await requireRole(ctx, "user1", ["admin", "coordinator"]);
    expect(result.role).toBe("coordinator");
  });

  it("throws Forbidden when user role not in allowed list", async () => {
    const ctx = mockCtx({
      user1: { _id: "user1", role: "patient", email: "p@test.com" },
    });
    await expect(
      requireRole(ctx, "user1", ["admin", "coordinator"])
    ).rejects.toThrow("Forbidden");
  });

  it("throws Unauthorized when user does not exist", async () => {
    const ctx = mockCtx({});
    await expect(
      requireRole(ctx, "nonexistent", ["admin"])
    ).rejects.toThrow("Unauthorized");
  });
});

describe("requirePatientSelfOrRole", () => {
  it("passes when patient accesses own data", async () => {
    const ctx = mockCtx({
      user1: { _id: "user1", role: "patient", linkedPatientId: "patient1" },
    });
    const result = await requirePatientSelfOrRole(ctx, "user1", "patient1", ["admin", "coordinator"]);
    expect(result.role).toBe("patient");
  });

  it("throws Forbidden when patient accesses other patient data", async () => {
    const ctx = mockCtx({
      user1: { _id: "user1", role: "patient", linkedPatientId: "patient1" },
    });
    await expect(
      requirePatientSelfOrRole(ctx, "user1", "patient2", ["admin", "coordinator"])
    ).rejects.toThrow("Forbidden");
  });

  it("passes when coordinator accesses any patient", async () => {
    const ctx = mockCtx({
      user1: { _id: "user1", role: "coordinator" },
    });
    const result = await requirePatientSelfOrRole(ctx, "user1", "patient1", ["admin", "coordinator"]);
    expect(result.role).toBe("coordinator");
  });

  it("throws Forbidden when patient has no linkedPatientId", async () => {
    const ctx = mockCtx({
      user1: { _id: "user1", role: "patient" },
    });
    await expect(
      requirePatientSelfOrRole(ctx, "user1", "patient1", ["admin", "coordinator"])
    ).rejects.toThrow("Forbidden");
  });

  it("throws Unauthorized when caller does not exist", async () => {
    const ctx = mockCtx({});
    await expect(
      requirePatientSelfOrRole(ctx, "nonexistent", "patient1", ["admin"])
    ).rejects.toThrow("Unauthorized");
  });
});
