import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth/next";
import { prisma } from "../prisma";
import { changePasswordAction } from "../server-actions";

jest.mock("../auth", () => ({ authOptions: {} }));
jest.mock("../inbox-context", () => ({ getOrCreateInboxContext: jest.fn() }));
jest.mock("next-auth/next", () => ({ getServerSession: jest.fn() }));
jest.mock("next/navigation", () => ({
  redirect: jest.fn(() => { throw new Error("Sign in required"); }),
}));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("bcryptjs", () => ({ compare: jest.fn(), hash: jest.fn() }));

const findUser = jest.fn();
const updateUser = jest.fn();
Object.assign(prisma.user, { findUnique: findUser, update: updateUser });

describe("password changes revoke sessions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getServerSession).mockResolvedValue({ user: { id: "user-1" } });
    findUser.mockResolvedValue({ password: "stored-hash" });
    jest.mocked(bcrypt.compare).mockImplementation(async () => true);
    jest.mocked(bcrypt.hash).mockImplementation(async () => "new-hash");
  });

  it("updates the password and increments the session version in one write", async () => {
    await changePasswordAction("CurrentPassword1!", "NewPassword2!");
    expect(updateUser).toHaveBeenCalledTimes(1);
    expect(updateUser).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { password: "new-hash", sessionVersion: { increment: 1 } },
    });
  });

  it("does not change the password or session version for an incorrect password", async () => {
    jest.mocked(bcrypt.compare).mockImplementation(async () => false);
    await expect(changePasswordAction("WrongPassword1!", "NewPassword2!"))
      .rejects.toThrow("Current password is incorrect");
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("requires an authenticated session", async () => {
    jest.mocked(getServerSession).mockResolvedValue(null);
    await expect(changePasswordAction("CurrentPassword1!", "NewPassword2!"))
      .rejects.toThrow("Sign in required");
    expect(findUser).not.toHaveBeenCalled();
    expect(updateUser).not.toHaveBeenCalled();
  });
});
