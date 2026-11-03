import bcrypt from "bcryptjs";
import { authOptions } from "../auth";
import { prisma } from "../prisma";

jest.mock("@auth/prisma-adapter", () => ({ PrismaAdapter: jest.fn() }));
jest.mock("next-auth/providers/credentials", () => ({
  __esModule: true,
  default: (options: unknown) => options,
}));
jest.mock("bcryptjs", () => ({ compare: jest.fn() }));

const findUser = jest.fn();
Object.assign(prisma.user, { findUnique: findUser });

describe("session versioning", () => {
  beforeEach(() => jest.clearAllMocks());

  it.each([
    [undefined, 0, true],
    [0, 0, true],
    [undefined, 1, false],
    [0, 1, false],
    [1, 1, true],
    [1, 2, false],
  ])("validates token version %s against account version %s", async (tokenVersion, accountVersion, valid) => {
    findUser.mockResolvedValue({ id: "user-1", sessionVersion: accountVersion });
    const session = { user: {} };
    const result = await authOptions.callbacks.session({
      session,
      token: { id: "user-1", sessionVersion: tokenVersion },
    });

    expect(result).toEqual(valid ? { user: { id: "user-1" } } : null);
  });

  it("keeps legacy and stale tokens unchanged when refreshing a session", async () => {
    for (const token of [{ id: "user-1" }, { id: "user-1", sessionVersion: 0 }]) {
      const original = { ...token };
      const result = await authOptions.callbacks.jwt({ token, user: undefined });
      expect(result).toEqual(original);
    }
    expect(findUser).not.toHaveBeenCalled();
  });

  it("copies the account version into a new login token", async () => {
    findUser.mockResolvedValue({
      id: "user-1", email: "user@example.test", name: "User",
      password: "stored-hash", sessionVersion: 2,
    });
    jest.mocked(bcrypt.compare).mockImplementation(async () => true);
    const user = await authOptions.providers[0].authorize(
      { email: "user@example.test", password: "Password1!" },
      {},
    );
    expect(user).toMatchObject({ id: "user-1", sessionVersion: 2 });
    const token = await authOptions.callbacks.jwt({ token: {}, user });
    expect(token).toEqual({ id: "user-1", sessionVersion: 2 });
    expect(await authOptions.callbacks.session({ session: { user: {} }, token }))
      .toEqual({ user: { id: "user-1" } });
  });
});
