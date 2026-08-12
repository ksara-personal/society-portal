import { PrismaClient, Role, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user (secretary)
  const adminPassword = await bcrypt.hash("Admin@1234", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@community.com" },
    update: {},
    create: {
      name: "Society Secretary",
      email: "admin@community.com",
      password: adminPassword,
      role: Role.ADMIN,
      approvalStatus: UserStatus.APPROVED,
      approvedAt: new Date(),
    },
  });
  console.log(`✅ Admin created: ${admin.email}`);

  // Create categories relevant to Society Portal
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

  // Create expense categories
  const expenseCategories = [
    { name: "Security", slug: "security", description: "Security service expense" },
    { name: "Housekeeping", slug: "housekeeping", description: "Housekeeping and cleaning expenses" },
    { name: "Gardening", slug: "gardening", description: "Gardening and landscaping expenses" },
    { name: "Electricity", slug: "electricity", description: "Electricity supply and meter expenses" },
    { name: "Diesel", slug: "diesel", description: "Diesel for generators and pumps" },
    { name: "Water Tanker", slug: "water-tanker", description: "Water tanker charges" },
    { name: "Water Softener", slug: "water-softener", description: "Water softener maintenance" },
    { name: "WTP", slug: "wtp", description: "Water treatment plant expenses" },
    { name: "Swimming Pool", slug: "swimming-pool", description: "Swimming pool maintenance" },
    { name: "Garbage Pickup", slug: "garbage-pickup", description: "Garbage collection expenses" },
    { name: "Fogging", slug: "fogging", description: "Pest and mosquito fogging services" },
    { name: "Pneumatic Pump", slug: "pneumatic-pump", description: "Pneumatic pump maintenance" },
    { name: "Motor Repair", slug: "motor-repair", description: "Motor repair and servicing" },
    { name: "Tank Cleaning", slug: "tank-cleaning", description: "Water tank cleaning" },
    { name: "Salary", slug: "salary", description: "Staff salary expenses" },
    { name: "NoBroker", slug: "nobroker", description: "Brokerage-free service expense" },
    { name: "Labour Water", slug: "labour-water", description: "Labor charges for water operations" },
    { name: "Butane Gas", slug: "butane-gas", description: "Butane gas cylinder expenses" },
    { name: "Pesticide", slug: "pesticide", description: "Pesticide and pest control supplies" },
    { name: "Miscellaneous", slug: "miscellaneous", description: "Miscellaneous expense items" },
    { name: "Other", slug: "other-expense", description: "Other expense items" },
  ];

  for (const cat of expenseCategories) {
    await prisma.expenseCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log(`✅ ${expenseCategories.length} expense categories created`);

  // Create expense types
  const expenseTypes = [
    { name: "One Time", slug: "one-time" },
    { name: "Regular", slug: "regular" },
  ];

  for (const expenseType of expenseTypes) {
    await prisma.expenseType.upsert({
      where: { slug: expenseType.slug },
      update: {},
      create: expenseType,
    });
  }
  console.log(`✅ ${expenseTypes.length} expense types created`);

  // Create payment types
  const paymentTypes = [
    { name: "Maintenance", slug: "maintenance" },
    { name: "Builder Funds", slug: "builder-funds" },
    { name: "Other Income", slug: "other-income" },
    { name: "Internal Transfer", slug: "internal-transfer" },
  ];

  for (const paymentType of paymentTypes) {
    await prisma.paymentType.upsert({
      where: { slug: paymentType.slug },
      update: {},
      create: paymentType,
    });
  }
  console.log(`✅ ${paymentTypes.length} payment types created`);

  // Create contact categories
  const contactCategories = [
    { name: "Electrician",     slug: "electrician",     icon: "zap",       color: "#f59e0b", order: 1 },
    { name: "Plumber",         slug: "plumber",         icon: "droplets",  color: "#3b82f6", order: 2 },
    { name: "Carpenter",       slug: "carpenter",       icon: "hammer",    color: "#a16207", order: 3 },
    { name: "Tile Work",       slug: "tile-work",       icon: "grid",      color: "#6366f1", order: 4 },
    { name: "Painting",        slug: "painting",        icon: "paintbrush",color: "#ec4899", order: 5 },
    { name: "Curtain Provider",slug: "curtain-provider",icon: "layout",    color: "#8b5cf6", order: 6 },
    { name: "Pest Control",    slug: "pest-control",    icon: "bug",       color: "#10b981", order: 7 },
    { name: "Cleaning Service",slug: "cleaning-service",icon: "sparkles",  color: "#06b6d4", order: 8 },
    { name: "AC/Appliance",    slug: "ac-appliance",    icon: "wind",      color: "#0ea5e9", order: 9 },
    { name: "Aquaguard Water Softener", slug: "aquaguard-water-softener", icon: "droplets", color: "#14b8a6", order: 10 },
    { name: "Aquaguard Water Purifier", slug: "aquaguard-water-purifier", icon: "droplets", color: "#0891b2", order: 11 },
    { name: "Washing Machine Service", slug: "washing-machine-service", icon: "settings", color: "#7c3aed", order: 12 },
    { name: "A/C Wiring", slug: "ac-wiring", icon: "zap", color: "#f97316", order: 13 },
    { name: "Newspaper", slug: "newspaper", icon: "newspaper", color: "#374151", order: 14 },
    { name: "Milk", slug: "milk", icon: "package", color: "#dbeafe", order: 15 },
    { name: "Car Cleaning", slug: "car-cleaning", icon: "car", color: "#22c55e", order: 16 },
    { name: "Gas Pipe Setup", slug: "gas-pipe-setup", icon: "flame", color: "#dc2626", order: 17 },
    { name: "Other",           slug: "other",           icon: "more-horizontal", color: "#6b7280", order: 18 },
  ];
/*
  for (const cat of contactCategories) {
    await prisma.contactCategory.upsert({
      where: { slug: cat.slug },
      update: { ...cat, isActive: true},
      create: { ...cat, isActive: true },
    });
  }
  console.log(`✅ ${contactCategories.length} contact categories created`);
*/
  // Add quarters
  const currentYear = 2026;
  const quarters = [
    { name: `Q1 ${currentYear}`, slug: `q1-${currentYear}`, startDate: `${currentYear}-01-01T00:00:00Z`, endDate: `${currentYear}-03-31T23:59:59Z`, year: currentYear, order: 1 },
    { name: `Q2 ${currentYear}`, slug: `q2-${currentYear}`, startDate: `${currentYear}-04-01T00:00:00Z`, endDate: `${currentYear}-06-30T23:59:59Z`, year: currentYear, order: 2 },
    { name: `Q3 ${currentYear}`, slug: `q3-${currentYear}`, startDate: `${currentYear}-07-01T00:00:00Z`, endDate: `${currentYear}-09-30T23:59:59Z`, year: currentYear, order: 3 },
    { name: `Q4 ${currentYear}`, slug: `q4-${currentYear}`, startDate: `${currentYear}-10-01T00:00:00Z`, endDate: `${currentYear}-12-31T23:59:59Z`, year: currentYear, order: 4 },
  ];

  for (const q of quarters) {
    await prisma.paymentQuarter.upsert({
      where: { slug: q.slug },
      update: {},
      create: q,
    });
  }
  console.log(`✅ ${quarters.length} payment quarters seeded`);

  // Seed the Flat master with the default wing/flat ranges (Wings A-E)
  const defaultWings = [
    { name: "A", flatStart: 1, flatEnd: 9 },
    { name: "B", flatStart: 10, flatEnd: 19 },
    { name: "C", flatStart: 20, flatEnd: 33 },
    { name: "D", flatStart: 34, flatEnd: 49 },
    { name: "E", flatStart: 50, flatEnd: 57 },
  ];

  let flatCount = 0;
  for (const wing of defaultWings) {
    for (let n = wing.flatStart; n <= wing.flatEnd; n++) {
      const flatNo = String(n).padStart(3, "0");
      await prisma.flat.upsert({
        where: { wing_flatNo: { wing: wing.name, flatNo } },
        update: {},
        create: { wing: wing.name, flatNo, eligibleForMaintenance: true },
      });
      flatCount++;
    }
  }
  console.log(`✅ ${flatCount} flats/villas seeded`);
}

main()
  .then(() => {
    console.log("✅ Seeding complete");
    process.exit(0);
  })
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
