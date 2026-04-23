import { PrismaClient, Role, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user (secretary)
  const adminPassword = await bcrypt.hash("Not Used", 12);
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

  // Create contact categories
  const contactCategories = [
    { name: "Electrician",      slug: "electrician",      icon: "zap",             color: "#f59e0b", order: 1 },
    { name: "Plumber",          slug: "plumber",          icon: "wrench",          color: "#3b82f6", order: 2 },
    { name: "Carpenter",        slug: "carpenter",        icon: "hammer",          color: "#78716c", order: 3 },
    { name: "Tile Work",        slug: "tile-work",        icon: "grid-3x3",        color: "#8b5cf6", order: 4 },
    { name: "Painting",         slug: "painting",         icon: "paintbrush",      color: "#ec4899", order: 5 },
    { name: "Curtain Provider", slug: "curtain-provider", icon: "blinds",          color: "#06b6d4", order: 6 },
    { name: "Pest Control",     slug: "pest-control",     icon: "bug",             color: "#22c55e", order: 7 },
    { name: "Cleaning Service", slug: "cleaning-service", icon: "sparkles",        color: "#f97316", order: 8 },
    { name: "AC / Appliance",   slug: "ac-appliance",     icon: "thermometer",     color: "#64748b", order: 9 },
    { name: "Other",            slug: "other",            icon: "more-horizontal", color: "#94a3b8", order: 10 },
  ];

  for (const cat of contactCategories) {
    await prisma.contactCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log(`✅ ${contactCategories.length} contact categories created`);

  console.log("\n🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
