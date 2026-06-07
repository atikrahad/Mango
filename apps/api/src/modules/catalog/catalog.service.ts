import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

  async getCategories() {
    const categories = await this.prisma.category.findMany();
    return {
      success: true,
      data: categories,
    };
  }

  async getProducts(query: any) {
    const { page = 1, limit = 10, search, district, sweetness, organic, categorySlug, includeInactive } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {
      deletedAt: null,
    };

    if (includeInactive !== 'true' && includeInactive !== true) {
      where.isActive = true;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (district) {
      where.originDistrict = { equals: district };
    }

    if (sweetness) {
      where.sweetness = Number(sweetness);
    }

    if (organic !== undefined) {
      where.isOrganic = organic === 'true' || organic === true;
    }

    if (categorySlug) {
      where.category = { slug: categorySlug };
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take,
        include: {
          category: true,
          variants: {
            where: { deletedAt: null },
            include: {
              inventory: true,
            },
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    const mappedProducts = products.map((p: any) => this.mapProductImage(p));

    return {
      success: true,
      data: {
        items: mappedProducts,
        meta: {
          totalItems: total,
          itemCount: products.length,
          itemsPerPage: take,
          totalPages: Math.ceil(total / take),
          currentPage: Number(page),
        },
      },
    };
  }

  async getProductBySlug(slug: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    const product = await this.prisma.product.findFirst({
      where: isUuid ? { id: slug, deletedAt: null } : { slug, deletedAt: null },
      include: {
        category: true,
        variants: {
          where: { deletedAt: null },
          include: {
            inventory: true,
          },
        },
      },
    });

    if (!product) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'STOCK_INSUFFICIENT',
          message: 'Product not found.',
        },
      });
    }

    return {
      success: true,
      data: this.mapProductImage(product),
    };
  }

  async createProduct(body: any) {
    const { categoryId, name, slug, description, sweetness, isOrganic, originDistrict, imageUrl, seoTitle, seoDesc, commissionPercentage } = body;
    
    // Check if slug unique
    const existing = await this.prisma.product.findFirst({
      where: { slug, deletedAt: null },
    });
    if (existing) {
      throw new BadRequestException('A product with this slug already exists.');
    }

    // Stringify array or use string
    const dbImageUrl = Array.isArray(imageUrl) ? JSON.stringify(imageUrl) : JSON.stringify([imageUrl || '']);

    const product = await this.prisma.product.create({
      data: {
        categoryId,
        name,
        slug,
        description,
        sweetness: Number(sweetness || 3),
        isOrganic: isOrganic === true || isOrganic === 'true',
        originDistrict,
        imageUrl: dbImageUrl,
        seoTitle,
        seoDesc,
        commissionPercentage: commissionPercentage !== undefined ? Number(commissionPercentage) : undefined,
      },
    });

    return {
      success: true,
      data: this.mapProductImage(product),
    };
  }

  async updateProduct(id: string, body: any) {
    const { categoryId, name, slug, description, sweetness, isOrganic, originDistrict, imageUrl, seoTitle, seoDesc, isActive, commissionPercentage } = body;

    // Check if product exists and isn't deleted
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
    });
    if (!product) {
      throw new BadRequestException('Product not found.');
    }

    // If slug is changing, verify uniqueness
    if (slug && slug !== product.slug) {
      const existing = await this.prisma.product.findFirst({
        where: { slug, deletedAt: null },
      });
      if (existing) {
        throw new BadRequestException('A product with this slug already exists.');
      }
    }

    const data: any = {};
    if (categoryId !== undefined) data.categoryId = categoryId;
    if (name !== undefined) data.name = name;
    if (slug !== undefined) data.slug = slug;
    if (description !== undefined) data.description = description;
    if (sweetness !== undefined) data.sweetness = Number(sweetness);
    if (isOrganic !== undefined) data.isOrganic = isOrganic === true || isOrganic === 'true';
    if (originDistrict !== undefined) data.originDistrict = originDistrict;
    
    if (imageUrl !== undefined) {
      data.imageUrl = Array.isArray(imageUrl) ? JSON.stringify(imageUrl) : JSON.stringify([imageUrl || '']);
    }

    if (seoTitle !== undefined) data.seoTitle = seoTitle;
    if (seoDesc !== undefined) data.seoDesc = seoDesc;
    if (isActive !== undefined) data.isActive = isActive === true || isActive === 'true';
    if (commissionPercentage !== undefined) data.commissionPercentage = Number(commissionPercentage);

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data,
    });

    return {
      success: true,
      data: this.mapProductImage(updatedProduct),
    };
  }

  async softDeleteProduct(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
    });
    if (!product) {
      throw new BadRequestException('Product not found.');
    }

    await this.prisma.product.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    return {
      success: true,
      message: 'Product deleted successfully.',
    };
  }

  private mapProductImage(product: any) {
    if (!product) return product;
    let imageUrlArray: string[] = [];
    if (product.imageUrl) {
      if (product.imageUrl.startsWith('[')) {
        try {
          imageUrlArray = JSON.parse(product.imageUrl);
        } catch (e) {
          imageUrlArray = [product.imageUrl];
        }
      } else {
        imageUrlArray = [product.imageUrl];
      }
    }
    return {
      ...product,
      imageUrl: imageUrlArray,
    };
  }

  async createVariant(body: any) {
    const { productId, sku, weightKg, boxCount, price, discount = 0, initialStock = 100 } = body;

    // Check if variant SKU already exists
    const existing = await this.prisma.productVariant.findFirst({
      where: { sku, deletedAt: null },
    });
    if (existing) {
      throw new BadRequestException('A product variant with this SKU already exists.');
    }

    const variant = await this.prisma.$transaction(async (tx: any) => {
      const newVariant = await tx.productVariant.create({
        data: {
          productId,
          sku,
          weightKg: Number(weightKg),
          boxCount: Number(boxCount || 1),
          price: Number(price),
          discount: Number(discount),
        },
      });

      await tx.inventory.create({
        data: {
          variantId: newVariant.id,
          availableStock: Number(initialStock),
          batchNumber: `BATCH-${Date.now()}`,
          harvestDate: new Date(),
          shelfLifeDays: 14,
        },
      });

      return newVariant;
    });

    return {
      success: true,
      data: variant,
    };
  }

  async updateVariant(id: string, body: any) {
    const { sku, weightKg, boxCount, price, discount, availableStock } = body;

    const variant = await this.prisma.productVariant.findFirst({
      where: { id, deletedAt: null },
    });
    if (!variant) {
      throw new BadRequestException('Product variant not found.');
    }

    if (sku && sku !== variant.sku) {
      const existing = await this.prisma.productVariant.findFirst({
        where: { sku, deletedAt: null },
      });
      if (existing) {
        throw new BadRequestException('A product variant with this SKU already exists.');
      }
    }

    const updatedVariant = await this.prisma.$transaction(async (tx: any) => {
      const data: any = {};
      if (sku !== undefined) data.sku = sku;
      if (weightKg !== undefined) data.weightKg = Number(weightKg);
      if (boxCount !== undefined) data.boxCount = Number(boxCount);
      if (price !== undefined) data.price = Number(price);
      if (discount !== undefined) data.discount = Number(discount);

      const v = await tx.productVariant.update({
        where: { id },
        data,
      });

      if (availableStock !== undefined) {
        await tx.inventory.upsert({
          where: { variantId: id },
          update: {
            availableStock: Number(availableStock),
          },
          create: {
            variantId: id,
            availableStock: Number(availableStock),
            batchNumber: `BATCH-${Date.now()}`,
            harvestDate: new Date(),
            shelfLifeDays: 14,
          },
        });
      }

      return v;
    });

    return {
      success: true,
      data: updatedVariant,
    };
  }

  async softDeleteVariant(id: string) {
    const variant = await this.prisma.productVariant.findFirst({
      where: { id, deletedAt: null },
    });
    if (!variant) {
      throw new BadRequestException('Variant not found.');
    }

    await this.prisma.productVariant.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Product variant deleted successfully.',
    };
  }
}
