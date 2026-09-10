import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
    userId?: string;
  }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    return this.prisma.order.findMany({
      where,
      include: {
        customer: true,
        user: {
          select: { id: true, name: true, email: true },
        },
        items: { include: { product: true } },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        user: {
          select: { id: true, name: true, email: true },
        },
        items: { include: { product: true } },
        payments: true,
      },
    });
    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }
    return order;
  }

  async create(dto: CreateOrderDto, userId: string) {
    let customerId = dto.customerId;

    if (!customerId && dto.customerName) {
      const customer = await this.prisma.customer.create({
        data: {
          name: dto.customerName,
          phone: dto.customerPhone,
        },
      });
      customerId = customer.id;
    }

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException(
        'El pedido debe tener al menos un producto',
      );
    }

    const products = await this.prisma.product.findMany({
      where: {
        id: { in: dto.items.map((item) => item.productId) },
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    let total = 0;
    const itemsData = dto.items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new BadRequestException(
          `Producto ${item.productId} no encontrado`,
        );
      }
      const subtotal = product.price * item.quantity;
      total += subtotal;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product.price,
        subtotal,
      };
    });

    const [order] = await this.prisma.$transaction([
      this.prisma.order.create({
        data: {
          userId,
          customerId: customerId || null,
          notes: dto.notes,
          total,
          items: { create: itemsData },
        },
        include: {
          customer: true,
          user: { select: { id: true, name: true, email: true } },
          items: { include: { product: true } },
          payments: true,
        },
      }),
      ...dto.items.map((item) =>
        this.prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        }),
      ),
    ]);
    return order;
  }

  async update(id: string, dto: UpdateOrderDto) {
    await this.findById(id);
    return this.prisma.order.update({
      where: { id },
      data: dto,
      include: {
        customer: true,
        user: {
          select: { id: true, name: true, email: true },
        },
        items: { include: { product: true } },
        payments: true,
      },
    });
  }

  async addPayment(orderId: string, dto: CreatePaymentDto) {
    const order = await this.findById(orderId);

    const totalPaid =
      order.payments.reduce((sum, p) => sum + p.amount, 0) + dto.amount;

    if (totalPaid > order.total) {
      throw new BadRequestException(
        `El pago excede el total del pedido. Restante: ${order.total - order.payments.reduce((sum, p) => sum + p.amount, 0)}`,
      );
    }

    const payment = await this.prisma.payment.create({
      data: {
        orderId,
        amount: dto.amount,
        method: dto.method || 'EFECTIVO',
      },
    });

    let newStatus = order.status;
    if (totalPaid >= order.total) {
      newStatus = 'PAGADO';
    } else if (totalPaid > 0) {
      newStatus = 'PARCIAL';
    }

    if (newStatus !== order.status) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: { status: newStatus },
      });
    }

    return {
      payment,
      orderStatus: newStatus,
      totalPaid,
      remaining: order.total - totalPaid,
    };
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.order.delete({ where: { id } });
  }

  async getDailySummary(date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        items: { include: { product: true } },
        payments: true,
      },
    });

    const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
    const totalPayments = orders.reduce(
      (sum, o) => sum + o.payments.reduce((s, p) => s + p.amount, 0),
      0,
    );

    return {
      date: startOfDay.toISOString().split('T')[0],
      totalOrders: orders.length,
      totalSales,
      totalPayments,
      orders,
    };
  }
}
