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
    const { page = 1, limit = 10, search, district, sweetness, organic, categorySlug } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (district) {
      where.originDistrict = { equals: district, mode: 'insensitive' };
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
            include: {
              inventory: true,
            },
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    const mappedProducts = products.map((p) => this.mapProductImage(p));

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
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        variants: {
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
    const { categoryId, name, slug, description, sweetness, isOrganic, originDistrict, imageUrl, seoTitle, seoDesc } = body;
    
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
      },
    });

    return {
      success: true,
      data: this.mapProductImage(product),
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

    const variant = await this.prisma.$transaction(async (tx) => {
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
}
