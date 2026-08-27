import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';

@Injectable()
export class PurchasesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(startDate?: string, endDate?: string) {
    const where: any = {};
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    return this.prisma.purchase.findMany({
      where,
      include: {
        items: { include: { rawMaterial: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findById(id: string) {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id },
      include: {
        items: { include: { rawMaterial: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });
    if (!purchase) {
      throw new NotFoundException(`Purchase with id ${id} not found`);
    }
    return purchase;
  }

  async create(dto: CreatePurchaseDto, userId: string) {
    const total = dto.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );

    const purchase = await this.prisma.purchase.create({
      data: {
        date: dto.date ? new Date(dto.date) : new Date(),
        notes: dto.notes,
        userId,
        total,
        items: {
          create: dto.items.map((item) => ({
            rawMaterialId: item.rawMaterialId ?? null,
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
          })),
        },
      },
      include: {
        items: { include: { rawMaterial: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    // Update referencePrice on related RawMaterials
    for (const item of dto.items) {
      if (item.rawMaterialId) {
        await this.prisma.rawMaterial
          .update({
            where: { id: item.rawMaterialId },
            data: { referencePrice: item.unitPrice },
          })
          .catch(() => {
            // Ignore if raw material not found
          });
      }
    }

    return purchase;
  }

  async update(id: string, dto: UpdatePurchaseDto) {
    await this.findById(id);
    return this.prisma.purchase.update({
      where: { id },
      data: {
        ...(dto.date ? { date: new Date(dto.date) } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      },
      include: {
        items: { include: { rawMaterial: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.purchase.delete({ where: { id } });
  }

  async getSummaryByPeriod(startDate?: string, endDate?: string) {
    const purchases = await this.findAll(startDate, endDate);

    const totalSpent = purchases.reduce((sum, p) => sum + p.total, 0);
    const count = purchases.length;

    const byCategory = new Map<string, number>();
    for (const purchase of purchases) {
      for (const item of purchase.items) {
        const category = item.rawMaterial?.category ?? 'OTROS';
        byCategory.set(category, (byCategory.get(category) ?? 0) + item.total);
      }
    }

    return {
      startDate,
      endDate,
      totalSpent,
      count,
      breakdown: Object.fromEntries(byCategory),
    };
  }
}
