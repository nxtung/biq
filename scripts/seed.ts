import { db } from "../lib/db"
import { users } from "../lib/db/schema"
import bcrypt from "bcryptjs"
import { createId } from "@paralleldrive/cuid2"

async function main() {
  console.log("🌱 Seeding database...")

  const adminPhone = "0123456789"
  const adminPassword = "admin"

  // Check if admin user already exists
  const existingAdmin = await db.query.users.findFirst({
    where: (table, { eq }) => eq(table.phone, adminPhone),
  })

  if (existingAdmin) {
    console.log("✅ Admin user already exists. Seeding skipped.")
    return
  }

  // Create admin user
  const passwordHash = await bcrypt.hash(adminPassword, 10)
  await db.insert(users).values({
    id: createId(),
    phone: adminPhone,
    name: "Admin User",
    passwordHash,
    role: "admin",
    isActive: true,
  })

  console.log(`✅ Seeded admin user with phone: ${adminPhone} and password: ${adminPassword}`)
  console.log("Database seeding complete.")
}

main().catch((e) => {
  console.error("❌ Error during seeding:", e)
  process.exit(1)
})