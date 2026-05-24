import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed script...');

  // 1. Create Default Administrative Users
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@mangosteen.com' },
    update: {},
    create: {
      email: 'superadmin@mangosteen.com',
      fullName: 'Super Administrator',
      role: UserRole.SUPER_ADMIN,
      isActive: true,
      isVerified: true,
      phone: '+15550199',
    },
  });
  console.log(`👤 Super Admin seeded: ${superAdmin.email}`);

  const deliveryAgent = await prisma.user.upsert({
    where: { email: 'rider1@mangosteen.com' },
    update: {},
    create: {
      email: 'rider1@mangosteen.com',
      fullName: 'Rider Rahim',
      role: UserRole.DELIVERY_AGENT,
      isActive: true,
      isVerified: true,
      phone: '+8801700000001',
    },
  });
  console.log(`🛵 Delivery Agent seeded: ${deliveryAgent.email}`);

  // 2. Create Categories
  const catOrganic = await prisma.category.upsert({
    where: { slug: 'organic-mangoes' },
    update: {},
    create: {
      name: 'Organic Farm Mangoes',
      slug: 'organic-mangoes',
      description: '100% organic, carbide-free premium mangoes sourced directly from orchards.',
      imageUrl: 'https://images.unsplash.com/photo-1553279768-865429fa0078',
    },
  });
  console.log(`📁 Category seeded: ${catOrganic.name}`);

  // 3. Create Products & Variants
  const himsagar = await prisma.product.upsert({
    where: { slug: 'himsagar-premium' },
    update: {},
    create: {
      categoryId: catOrganic.id,
      name: 'Premium Himsagar Mangoes',
      slug: 'himsagar-premium',
      description: 'Himsagar is a popular mango cultivar, originating from Rajshahi. It is known for its sweet aroma and fiberless pulpy texture.',
      sweetness: 5,
      isOrganic: true,
      originDistrict: 'Rajshahi',
      imageUrl: ['https://images.unsplash.com/photo-1553279768-865429fa0078'],
      seoTitle: 'Buy Premium Himsagar Mangoes Online | Direct Farm Delivery',
      seoDesc: 'Savor the authentic taste of Rajshahi with fiberless, naturally sweetened premium Himsagar mangoes.',
    },
  });

  const langra = await prisma.product.upsert({
    where: { slug: 'langra-special' },
    update: {},
    create: {
      categoryId: catOrganic.id,
      name: 'Orchard Special Langra Mangoes',
      slug: 'langra-special',
      description: 'Langra is highly appreciated for its sweet, slightly acidic taste and smooth texture.',
      sweetness: 4,
      isOrganic: true,
      originDistrict: 'Chapainawabganj',
      imageUrl: ['https://images.unsplash.com/photo-1553279768-865429fa0078'],
      seoTitle: 'Buy Farm Fresh Langra Mangoes Online | Chapainawabganj Orchard',
      seoDesc: 'Original sweet and tangy Langra mangoes direct from Chapainawabganj. Order online today!',
    },
  });
  console.log(`🥭 Mango Products seeded: ${himsagar.name}, ${langra.name}`);

  // 4. Seed Product Variants & Inventory
  const variantHimsagar5 = await prisma.productVariant.upsert({
    where: { sku: 'MNG-HIM-05K-ORG' },
    update: {},
    create: {
      productId: himsagar.id,
      sku: 'MNG-HIM-05K-ORG',
      weightKg: 5.0,
      boxCount: 1,
      price: 1500.0,
      discount: 100.0,
    },
  });

  await prisma.inventory.upsert({
    where: { variantId: variantHimsagar5.id },
    update: {},
    create: {
      variantId: variantHimsagar5.id,
      availableStock: 250,
      batchNumber: 'BATCH-2026-HIM01',
      harvestDate: new Date(),
      shelfLifeDays: 12,
    },
  });

  const variantLangra5 = await prisma.productVariant.upsert({
    where: { sku: 'MNG-LAN-05K-ORG' },
    update: {},
    create: {
      productId: langra.id,
      sku: 'MNG-LAN-05K-ORG',
      weightKg: 5.0,
      boxCount: 1,
      price: 1300.0,
    },
  });

  await prisma.inventory.upsert({
    where: { variantId: variantLangra5.id },
    update: {},
    create: {
      variantId: variantLangra5.id,
      availableStock: 400,
      batchNumber: 'BATCH-2026-LAN01',
      harvestDate: new Date(),
      shelfLifeDays: 14,
    },
  });
  console.log('📦 Product Variants & Inventory records seeded.');

  // 5. Seed Delivery Zones
  await prisma.deliveryZone.createMany({
    data: [
      { name: 'Dhaka Metropolitan Central', district: 'Dhaka', baseCharge: 120.0, isActive: true },
      { name: 'Rajshahi Town Express', district: 'Rajshahi', baseCharge: 60.0, isActive: true },
      { name: 'Chittagong Central Coast', district: 'Chittagong', baseCharge: 150.0, isActive: true },
    ],
    skipDuplicates: true,
  });
  console.log('🚚 Shipping Logistics zones seeded.');

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
