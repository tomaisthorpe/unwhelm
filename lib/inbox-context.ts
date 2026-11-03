import "server-only";

import { prisma } from "./prisma";

// Internal helpers: callers must supply a trusted user ID from the session
// or the user record they have just created during signup.
export async function createInboxContext(userId: string) {
  try {
    const inboxContext = await prisma.context.create({
      data: {
        name: "Inbox",
        description: "Default context for new tasks",
        icon: "Inbox",
        color: "bg-blue-500",
        coefficient: 0.0,
        isInbox: true,
        userId,
      },
    });
    return inboxContext;
  } catch (error) {
    console.error("Error creating inbox context:", error);
    throw error;
  }
}

export async function getOrCreateInboxContext(userId: string) {
  let inboxContext = await prisma.context.findFirst({
    where: { userId, isInbox: true },
  });

  if (!inboxContext) {
    inboxContext = await createInboxContext(userId);
  }

  return inboxContext;
}
