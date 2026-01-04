import { prisma } from "@/lib/prisma";

async function migrateInboxContexts() {
  console.log("Starting migration to add inbox contexts for existing users...");

  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    console.log(`Found ${users.length} users to check`);

    for (const user of users) {
      // Check if user already has an inbox context
      const existingInbox = await prisma.context.findFirst({
        where: {
          userId: user.id,
          isInbox: true,
        },
      });

      if (existingInbox) {
        console.log(`User ${user.email} already has an inbox context`);
        continue;
      }

      // Create inbox context for this user
      try {
        const inboxContext = await prisma.context.create({
          data: {
            name: "Inbox",
            description: "Default context for new tasks",
            icon: "Inbox",
            color: "bg-blue-500",
            coefficient: 0.0,
            isInbox: true,
            userId: user.id,
          },
        });

        console.log(
          `✅ Created inbox context for user ${user.email} (ID: ${inboxContext.id})`,
        );
      } catch (error) {
        console.error(
          `❌ Failed to create inbox context for user ${user.email}:`,
          error,
        );
      }
    }

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  migrateInboxContexts()
    .then(() => {
      console.log("✅ Migration script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Migration script failed:", error);
      process.exit(1);
    });
}

export { migrateInboxContexts };

