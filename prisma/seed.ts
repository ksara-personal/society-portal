import { PrismaClient, Role, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user (secretary)
  const adminPassword = await bcrypt.hash("AmberMeadows@2026", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@ambermeadows.com" },
    update: {},
    create: {
      name: "Society Secretary",
      email: "admin@ambermeadows.com",
      password: adminPassword,
      role: Role.ADMIN,
      approvalStatus: UserStatus.APPROVED,
      approvedAt: new Date(),
    },
  });
  console.log(`✅ Admin created: ${admin.email}`);

  // Create categories relevant to Amber Meadows
  const categories = [
    {
      name: "Plumbing",
      slug: "plumbing",
      description: "Water leaks, pipe bursts, drainage blockages, tap issues",
      icon: "droplets",
    },
    {
      name: "Electrical",
      slug: "electrical",
      description: "Wiring faults, lighting outages, power fluctuations",
      icon: "zap",
    },
    {
      name: "Amenities",
      slug: "amenities",
      description: "Amenity maintenance, pool issues, gym equipment, clubhouse concerns",
      icon: "arrow-up-down",
    },
    {
      name: "Basement",
      slug: "basement",
      description: "Basement flooding, water seepage, sump pump failure, dampness and structural issues",
      icon: "car",
    },
    {
      name: "Common Areas",
      slug: "common-areas",
      description: "Lobby, corridors, garden, gym, terrace maintenance",
      icon: "building-2",
    },
    {
      name: "Security",
      slug: "security",
      description: "CCTV faults, intercom issues, access control, guard concerns",
      icon: "shield",
    },
    {
      name: "Structural",
      slug: "structural",
      description: "Wall cracks, seepage, ceiling damage, flooring issues",
      icon: "hammer",
    }
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log(`✅ ${categories.length} categories created`);

  console.log("\n🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
