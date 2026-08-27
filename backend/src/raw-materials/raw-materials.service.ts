import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRawMaterialDto } from './dto/create-raw-material.dto';
import { UpdateRawMaterialDto } from './dto/update-raw-material.dto';

@Injectable()
export class RawMaterialsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(category?: string) {
    return this.prisma.rawMaterial.findMany({
      where: {
        active: true,
        ...(category ? { category } : {}),
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  async findAllCategories(): Promise<string[]> {
    const results = await this.prisma.rawMaterial.findMany({
      where: { active: true },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });
    return results.map((r) => r.category);
  }

  async findById(id: string) {
    const rawMaterial = await this.prisma.rawMaterial.findUnique({
      where: { id },
    });
    if (!rawMaterial) {
      throw new NotFoundException(`Raw material with id ${id} not found`);
    }
    return rawMaterial;
  }

  async create(dto: CreateRawMaterialDto) {
    return this.prisma.rawMaterial.create({ data: dto });
  }

  async update(id: string, dto: UpdateRawMaterialDto) {
    await this.findById(id);
    return this.prisma.rawMaterial.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.rawMaterial.update({
      where: { id },
      data: { active: false },
    });
  }
}
