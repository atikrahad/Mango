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
  const mangoesToSeed = [
    {
      name: 'Premium Himsagar Mangoes',
      slug: 'himsagar-premium',
      description: 'Himsagar is a popular mango cultivar. It is known for its sweet aroma and fiberless pulpy texture.',
      sweetness: 5,
      isOrganic: true,
      originDistrict: 'Naogaon',
      imageUrl: '["https://images.unsplash.com/photo-1553279768-865429fa0078"]',
      seoTitle: 'Buy Premium Himsagar Mangoes Online | Direct Farm Delivery',
      seoDesc: 'Savor the authentic taste of Naogaon with fiberless, naturally sweetened premium Himsagar mangoes.',
      basePricePerKg: 160.0,
      skuCode: 'HIM',
    },
    {
      name: 'Orchard Special Langra Mangoes',
      slug: 'langra-special',
      description: 'Langra is highly appreciated for its sweet, slightly acidic taste and smooth texture.',
      sweetness: 4,
      isOrganic: true,
      originDistrict: 'Naogaon',
      imageUrl: '["https://images.unsplash.com/photo-1553279768-865429fa0078"]',
      seoTitle: 'Buy Farm Fresh Langra Mangoes Online | Sapahar Naogaon Orchard',
      seoDesc: 'Original sweet and tangy Langra mangoes direct from Sapahar, Naogaon. Order online today!',
      basePricePerKg: 140.0,
      skuCode: 'LAN',
    },
    {
      name: 'Gopalbhog Sweet Mangoes',
      slug: 'gopalbhog-sweet',
      description: 'Gopalbhog is one of the earliest mango varieties of the season, famous for its rich yellow color and extremely sweet flavor.',
      sweetness: 5,
      isOrganic: true,
      originDistrict: 'Rajshahi',
      imageUrl: '["https://images.unsplash.com/photo-1553279768-865429fa0078"]',
      seoTitle: 'Buy Rajshahi Gopalbhog Mangoes Online | Fresh Orchard Pickup',
      seoDesc: 'Authentic early season Gopalbhog mangoes from Rajshahi. Rich color, sweet taste, order now!',
      basePricePerKg: 150.0,
      skuCode: 'GOP',
    },
    {
      name: 'Rangpur Haribhanga Mangoes',
      slug: 'haribhanga-rangpur',
      description: 'Haribhanga is a highly popular mid-season mango with a round shape, fiberless pulp, and delightful sweetness.',
      sweetness: 4,
      isOrganic: true,
      originDistrict: 'Rangpur',
      imageUrl: '["https://images.unsplash.com/photo-1553279768-865429fa0078"]',
      seoTitle: 'Buy Rangpur Haribhanga Mangoes Online | Direct from Orchards',
      seoDesc: 'Get fresh, fiberless Haribhanga mangoes from Rangpur. Naturally ripened, sweet & fleshy.',
      basePricePerKg: 130.0,
      skuCode: 'HAR',
    },
    {
      name: 'Premium Amrapali Mangoes',
      slug: 'amrapali-premium',
      description: 'Amrapali is a late-season hybrid mango famous for its deep orange-red pulp, rich flavor, and sweet fragrance.',
      sweetness: 5,
      isOrganic: true,
      originDistrict: 'Naogaon',
      imageUrl: '["https://images.unsplash.com/photo-1553279768-865429fa0078"]',
      seoTitle: 'Buy Premium Amrapali Mangoes Online | Farm Delivery',
      seoDesc: 'Indulge in sweet, rich deep orange-red pulp Amrapali mangoes direct from Naogaon orchards.',
      basePricePerKg: 140.0,
      skuCode: 'AMP',
    },
    {
      name: 'Giant Fazli Mangoes',
      slug: 'fazli-giant',
      description: 'Fazli is a late-season large mango variety, appreciated for its generous pulp size, sweet and slightly tangy flavor.',
      sweetness: 4,
      isOrganic: true,
      originDistrict: 'Chapainawabganj',
      imageUrl: '["https://images.unsplash.com/photo-1553279768-865429fa0078"]',
      seoTitle: 'Buy Giant Fazli Mangoes Online | Late Season Special',
      seoDesc: 'Try the giant, pulpy Fazli mangoes from Chapainawabganj. Perfect for desserts and direct eating.',
      basePricePerKg: 100.0,
      skuCode: 'FAZ',
    }
  ];

  const seededProducts = [];

  for (const m of mangoesToSeed) {
    const product = await prisma.product.upsert({
      where: { slug: m.slug },
      update: {},
      create: {
        categoryId: catOrganic.id,
        name: m.name,
        slug: m.slug,
        description: m.description,
        sweetness: m.sweetness,
        isOrganic: m.isOrganic,
        originDistrict: m.originDistrict,
        imageUrl: m.imageUrl,
        seoTitle: m.seoTitle,
        seoDesc: m.seoDesc,
      },
    });
    seededProducts.push(product);
    console.log(`🥭 Mango Product seeded: ${product.name}`);

    // Create 4 variants for each: 5kg, 10kg, 20kg, 40kg
    const sizes = [
      { weight: 5.0, discountFactor: 1.0, stock: 300, boxCount: 1 },
      { weight: 10.0, discountFactor: 0.95, stock: 200, boxCount: 1 },
      { weight: 20.0, discountFactor: 0.90, stock: 100, boxCount: 2 }, // 2 boxes of 10kg each
      { weight: 40.0, discountFactor: 0.85, stock: 50, boxCount: 4 },  // 4 boxes of 10kg each
    ];

    for (const size of sizes) {
      // Round to nearest 10 for neat pricing
      const rawPrice = size.weight * m.basePricePerKg * size.discountFactor;
      const finalPrice = Math.round(rawPrice / 10) * 10;
      
      const weightStr = size.weight < 10 ? `0${size.weight}` : `${size.weight}`;
      const sku = `MNG-${m.skuCode}-${weightStr}K-ORG`;

      const variant = await prisma.productVariant.upsert({
        where: { sku: sku },
        update: {},
        create: {
          productId: product.id,
          sku: sku,
          weightKg: size.weight,
          boxCount: size.boxCount,
          price: finalPrice,
          discount: 0.0,
        },
      });

      await prisma.inventory.upsert({
        where: { variantId: variant.id },
        update: {},
        create: {
          variantId: variant.id,
          availableStock: size.stock,
          batchNumber: `BATCH-2026-${m.skuCode}-${weightStr}K`,
          harvestDate: new Date(),
          shelfLifeDays: 14,
        },
      });
    }
    console.log(`📦 Variants (5kg, 10kg, 20kg, 40kg) & Inventory seeded for ${product.name}`);
  }

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
