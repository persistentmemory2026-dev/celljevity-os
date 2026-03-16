import { db } from "./index";
import { users, services } from "./schema";
import bcrypt from "bcrypt";

async function seed() {
  console.log("🌱 Seeding database...");

  // 1. Create admin user
  const adminPassword = await bcrypt.hash("admin123", 10);
  
  await db.insert(users).values({
    email: "admin@celljevity.com",
    passwordHash: adminPassword,
    name: "Admin User",
    role: "admin",
  }).onConflictDoNothing();
  
  console.log("✅ Admin user created: admin@celljevity.com / admin123");

  // 2. Create default services
  const defaultServices = [
    {
      name: "Exosome Therapy - Basic",
      description: "Basic exosome treatment for cellular regeneration",
      price: "2500.00",
      category: "Exosomes",
      active: true,
    },
    {
      name: "Exosome Therapy - Premium",
      description: "Advanced exosome therapy with extended protocol",
      price: "4500.00",
      category: "Exosomes",
      active: true,
    },
    {
      name: "Prometheus Protocol",
      description: "Comprehensive longevity assessment and treatment",
      price: "8900.00",
      category: "Prometheus",
      active: true,
    },
    {
      name: "NK Cell Therapy",
      description: "Natural killer cell immunotherapy",
      price: "6200.00",
      category: "NK Cells",
      active: true,
    },
    {
      name: "Biomarker Panel - Standard",
      description: "Complete biomarker analysis (50 markers)",
      price: "1200.00",
      category: "Diagnostics",
      active: true,
    },
    {
      name: "Biomarker Panel - Premium",
      description: "Extended biomarker analysis (100+ markers)",
      price: "2400.00",
      category: "Diagnostics",
      active: true,
    },
    {
      name: "Consultation - Initial",
      description: "Initial consultation with medical provider",
      price: "250.00",
      category: "Other",
      active: true,
    },
    {
      name: "Consultation - Follow-up",
      description: "Follow-up consultation",
      price: "150.00",
      category: "Other",
      active: true,
    },
  ];

  for (const service of defaultServices) {
    await db.insert(services).values(service).onConflictDoNothing();
  }
  
  console.log(`✅ ${defaultServices.length} services created`);

  console.log("✅ Seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
