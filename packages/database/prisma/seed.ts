import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export const UserRole = {
  AFFILIATE: 'AFFILIATE',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN'
} as const;

type UserRole = typeof UserRole[keyof typeof UserRole];

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
      role: UserRole.ADMIN,
      isActive: true,
      isVerified: true,
      phone: '+8801700000001',
    },
  });
  console.log(`🛵 Rider Admin seeded: ${deliveryAgent.email}`);

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
      description: 'Himsagar is a popular mango cultivar. It is known for its sweet aroma and fiberless pulpy texture.',
      sweetness: 5,
      isOrganic: true,
      originDistrict: 'Naogaon',
      imageUrl: '["https://images.unsplash.com/photo-1553279768-865429fa0078"]',
      seoTitle: 'Buy Premium Himsagar Mangoes Online | Direct Farm Delivery',
      seoDesc: 'Savor the authentic taste of Naogaon with fiberless, naturally sweetened premium Himsagar mangoes.',
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
      originDistrict: 'Naogaon',
      imageUrl: '["https://images.unsplash.com/photo-1553279768-865429fa0078"]',
      seoTitle: 'Buy Farm Fresh Langra Mangoes Online | Sapahar Naogaon Orchard',
      seoDesc: 'Original sweet and tangy Langra mangoes direct from Sapahar, Naogaon. Order online today!',
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
  const zones = [
    { name: 'Dhaka Metropolitan Central', district: 'Dhaka', baseCharge: 120.0, isActive: true },
    { name: 'Rajshahi Town Express', district: 'Rajshahi', baseCharge: 60.0, isActive: true },
    { name: 'Chittagong Central Coast', district: 'Chittagong', baseCharge: 150.0, isActive: true },
  ];

  for (const zone of zones) {
    const existing = await prisma.deliveryZone.findFirst({
      where: { name: zone.name }
    });
    if (!existing) {
      await prisma.deliveryZone.create({ data: zone });
    }
  }
  console.log('🚚 Shipping Logistics zones seeded.');

  // 6. Seed demo users with hashed passwords for Quick Role Switcher
  const demoPassword = await bcrypt.hash('password123', 10);

  const customer = await prisma.user.upsert({
    where: { email: 'customer@mangosteen.com' },
    update: { passwordHash: demoPassword },
    create: {
      email: 'customer@mangosteen.com',
      fullName: 'Customer Karim',
      role: UserRole.AFFILIATE,
      isActive: true,
      isVerified: true,
      phone: '+8801600000002',
      passwordHash: demoPassword,
    },
  });
  console.log(`👤 Demo Customer seeded: ${customer.email}`);

  const affiliateUser = await prisma.user.upsert({
    where: { email: 'affiliate1@mangosteen.com' },
    update: { passwordHash: demoPassword },
    create: {
      email: 'affiliate1@mangosteen.com',
      fullName: 'Affiliate Anis',
      role: UserRole.AFFILIATE,
      isActive: true,
      isVerified: true,
      phone: '+8801600000003',
      passwordHash: demoPassword,
    },
  });

  // Create affiliate profile if it doesn't exist
  const existingAffiliate = await prisma.affiliate.findUnique({ where: { userId: affiliateUser.id } });
  if (!existingAffiliate) {
    await prisma.affiliate.create({
      data: {
        userId: affiliateUser.id,
        referralCode: 'aff_DEMO01',
        walletBalance: 0,
        isActive: true,
      },
    });
  }
  console.log(`🤝 Demo Affiliate seeded: ${affiliateUser.email}`);

  // Also update Super Admin with password
  await prisma.user.update({
    where: { email: 'superadmin@mangosteen.com' },
    data: { passwordHash: demoPassword },
  });
  await prisma.user.update({
    where: { email: 'rider1@mangosteen.com' },
    data: { passwordHash: demoPassword },
  });
  console.log('🔑 Demo passwords applied to all seeded users (password123).');

  // 7. Seed Coupon Codes
  const coupons = [
    {
      code: 'MANGO10',
      discountPct: 10,
      discountAmount: 0,
      minCartValue: 0,
      expiryDate: new Date('2027-12-31'),
      usageLimit: 1000,
    },
    {
      code: 'FREE500',
      discountPct: 0,
      discountAmount: 500,
      minCartValue: 2000,
      expiryDate: new Date('2027-12-31'),
      usageLimit: 500,
    },
  ];

  for (const coupon of coupons) {
    await prisma.coupon.upsert({
      where: { code: coupon.code },
      update: {},
      create: { ...coupon, isActive: true },
    });
  }
  console.log('🎟️ Coupon codes seeded: MANGO10, FREE500.');

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
