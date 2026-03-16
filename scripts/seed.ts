import { db } from "../lib/db"
import { users } from "../lib/db/schema"
import bcrypt from "bcryptjs"
import { createId } from "@paralleldrive/cuid2"
import { eq } from "drizzle-orm"

async function main() {
  console.log("🌱 Seeding database...")

  // Lấy thông tin admin từ biến môi trường, nếu không có thì dùng giá trị mặc định
  const adminPhone = process.env.SEED_ADMIN_PHONE || "0123456789"
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "admin"

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Please check your .env.local file.")
  }

  // Check if admin user already exists
  const existingAdmin = await db.query.users.findFirst({
    where: eq(users.phone, adminPhone),
  })

  if (existingAdmin) {
    console.log(`✅ Admin user with phone ${adminPhone} already exists. Seeding skipped.`)
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