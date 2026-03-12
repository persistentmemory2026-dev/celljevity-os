import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { db, pool } from "./index";
import { usersTable } from "./schema";

const SALT_ROUNDS = 12;

const seedUsers = [
  {
    email: "mz@dealteam-six.com",
    password: "Smerdon07?!",
    firstName: "MZ",
    lastName: "Admin",
    role: "SUPER_ADMIN" as const,
  },
];

async function seed() {
  console.log("Seeding users...\n");

  for (const user of seedUsers) {
    const passwordHash = await bcrypt.hash(user.password, SALT_ROUNDS);

    const [existing] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, user.email))
      .limit(1);

    if (existing) {
      await db
        .update(usersTable)
        .set({
          passwordHash,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(usersTable.id, existing.id));
      console.log(`  Updated: ${user.email} (${user.role})`);
    } else {
      await db.insert(usersTable).values({
        email: user.email,
        passwordHash,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      });
      console.log(`  Created: ${user.email} (${user.role})`);
    }
  }

  console.log("\nSeeding complete.");
}

seed()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
