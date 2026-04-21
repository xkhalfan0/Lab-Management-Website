/**
 * Tests for internal authentication and user management
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock DB helpers ──────────────────────────────────────────────────────────
vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getUserByUsername: vi.fn(),
    createInternalUser: vi.fn(),
    updateInternalUser: vi.fn(),
    deleteUser: vi.fn(),
    getAllUsers: vi.fn(),
    getTechnicians: vi.fn(),
    updateUserRole: vi.fn(),
    // keep other helpers as-is (they won't be called in these tests)
  };
});

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(async (pw: string) => `hashed:${pw}`),
    compare: vi.fn(async (pw: string, hash: string) => hash === `hashed:${pw}`),
  },
}));

import * as db from "./db";

// ─── Helper: build a mock tRPC context ───────────────────────────────────────
function makeAdminCtx(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "local:admin",
      name: "Admin",
      email: null,
      loginMethod: "local",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function makeUserCtx(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "local:user1",
      name: "Regular User",
      email: null,
      loginMethod: "local",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("users.create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("admin can create a new user", async () => {
    vi.mocked(db.getUserByUsername).mockResolvedValue(undefined);
    vi.mocked(db.createInternalUser).mockResolvedValue({
      id: 10,
      openId: "local:newtech",
      name: "New Technician",
      username: "newtech",
      passwordHash: "hashed:pass123",
      role: "technician",
      specialty: "Concrete",
      permissions: null,
      isActive: true,
      email: null,
      loginMethod: "local",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    });

    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.users.create({
      name: "New Technician",
      username: "newtech",
      password: "pass123",
      role: "technician",
      specialty: "Concrete",
    });

    expect(result.success).toBe(true);
    expect(result.userId).toBe(10);
    expect(db.getUserByUsername).toHaveBeenCalledWith("newtech");
    expect(db.createInternalUser).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "New Technician",
        username: "newtech",
        role: "technician",
        specialty: "Concrete",
      })
    );
  });

  it("throws CONFLICT when username already exists", async () => {
    vi.mocked(db.getUserByUsername).mockResolvedValue({
      id: 5,
      openId: "local:existing",
      name: "Existing",
      username: "newtech",
      passwordHash: "hashed:x",
      role: "user",
      specialty: null,
      permissions: null,
      isActive: true,
      email: null,
      loginMethod: "local",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    });

    const caller = appRouter.createCaller(makeAdminCtx());
    await expect(
      caller.users.create({
        name: "Another",
        username: "newtech",
        password: "pass123",
        role: "user",
      })
    ).rejects.toThrow("Username already exists");
  });

  it("non-admin cannot create users", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    await expect(
      caller.users.create({
        name: "X",
        username: "xuser",
        password: "pass123",
        role: "user",
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("users.update", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("admin can update user basic info", async () => {
    vi.mocked(db.getUserByUsername).mockResolvedValue(undefined);
    vi.mocked(db.updateInternalUser).mockResolvedValue(undefined);

    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.users.update({
      userId: 3,
      name: "Updated Name",
      isActive: false,
    });

    expect(result.success).toBe(true);
    expect(db.updateInternalUser).toHaveBeenCalledWith(
      3,
      expect.objectContaining({ name: "Updated Name", isActive: false })
    );
  });

  it("non-admin cannot update other users", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    await expect(
      caller.users.update({ userId: 3, name: "Hacked" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("users.updateRole", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("admin can update user role", async () => {
    vi.mocked(db.updateUserRole).mockResolvedValue(undefined);

    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.users.updateRole({
      userId: 3,
      role: "technician",
    });

    expect(result.success).toBe(true);
    expect(db.updateUserRole).toHaveBeenCalledWith(3, "technician", undefined);
  });

  it("non-admin cannot update role", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    await expect(
      caller.users.updateRole({ userId: 3, role: "technician" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("users.updatePermissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("admin can update user permissions (view/edit levels)", async () => {
    vi.mocked(db.updateInternalUser).mockResolvedValue(undefined);

    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.users.updatePermissions({
      userId: 3,
      permissions: { results: "edit", samples: "view", distribution: false },
    });

    expect(result.success).toBe(true);
    expect(db.updateInternalUser).toHaveBeenCalledWith(
      3,
      expect.objectContaining({ permissions: expect.any(Object) })
    );
  });

  it("non-admin cannot update permissions", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    await expect(
      caller.users.updatePermissions({ userId: 3, permissions: { results: "edit" } })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("users.delete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("admin can delete another user", async () => {
    vi.mocked(db.deleteUser).mockResolvedValue(undefined);

    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.users.delete({ userId: 5 });

    expect(result.success).toBe(true);
    expect(db.deleteUser).toHaveBeenCalledWith(5);
  });

  it("admin cannot delete their own account", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    await expect(
      caller.users.delete({ userId: 1 }) // same as admin id
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("non-admin cannot delete users", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    await expect(
      caller.users.delete({ userId: 5 })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("users.list", () => {
  it("admin can list all users (passwordHash stripped)", async () => {
    vi.mocked(db.getAllUsers).mockResolvedValue([
      {
        id: 1, openId: "local:admin", name: "Admin", username: "admin",
        passwordHash: "secret_hash", role: "admin", specialty: null,
        permissions: null, isActive: true, email: null, loginMethod: "local",
        createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
      },
    ]);

    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.users.list();

    expect(result).toHaveLength(1);
    // passwordHash must be stripped
    expect((result[0] as any).passwordHash).toBeUndefined();
  });

  it("non-admin cannot list users", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    await expect(caller.users.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
