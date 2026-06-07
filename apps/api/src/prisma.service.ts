import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@mangosteen/database';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  public extended!: ReturnType<typeof this.extendPrisma>;

  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],
    });
    this.extended = this.extendPrisma();
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private extendPrisma() {
    const prisma = this;
    return this.$extends({
      query: {
        $allModels: {
          async findMany({ model, args, query }: any) {
            // Apply soft-delete check if table has deletedAt column
            if ('deletedAt' in (prisma as any)[model].fields) {
              args.where = { ...args.where, deletedAt: null } as any;
            }
            return query(args);
          },
          async findFirst({ model, args, query }: any) {
            if ('deletedAt' in (prisma as any)[model].fields) {
              args.where = { ...args.where, deletedAt: null } as any;
            }
            return query(args);
          },
          async findUnique({ model, args, query }: any) {
            if ('deletedAt' in (prisma as any)[model].fields) {
              args.where = { ...args.where, deletedAt: null } as any;
            }
            return query(args);
          },
        },
      },
    });
  }
}
