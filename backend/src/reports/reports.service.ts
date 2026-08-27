import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDailySummary(date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        items: { include: { product: true } },
        payments: true,
        customer: true,
        user: { select: { id: true, name: true } },
      },
    });

    const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
    const totalPayments = orders.reduce(
      (sum, o) => sum + o.payments.reduce((s, p) => s + p.amount, 0),
      0,
    );

    const productBreakdown = new Map<
      string,
      { name: string; quantity: number; total: number }
    >();
    for (const order of orders) {
      for (const item of order.items) {
        const existing = productBreakdown.get(item.productId);
        if (existing) {
          existing.quantity += item.quantity;
          existing.total += item.subtotal;
        } else {
          productBreakdown.set(item.productId, {
            name: item.product.name,
            quantity: item.quantity,
            total: item.subtotal,
          });
        }
      }
    }

    const paymentMethodBreakdown = new Map<string, number>();
    for (const order of orders) {
      for (const payment of order.payments) {
        const existing = paymentMethodBreakdown.get(payment.method) || 0;
        paymentMethodBreakdown.set(payment.method, existing + payment.amount);
      }
    }

    return {
      date: startOfDay.toISOString().split('T')[0],
      totalOrders: orders.length,
      totalSales,
      totalPayments,
      pendingPayment: totalSales - totalPayments,
      productBreakdown: Array.from(productBreakdown.values()),
      paymentMethodBreakdown: Object.fromEntries(paymentMethodBreakdown),
    };
  }

  async getDateRangeSummary(startDate: string, endDate: string) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: start, lte: end },
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

    const productBreakdown = new Map<
      string,
      { name: string; quantity: number; total: number }
    >();
    for (const order of orders) {
      for (const item of order.items) {
        const existing = productBreakdown.get(item.productId);
        if (existing) {
          existing.quantity += item.quantity;
          existing.total += item.subtotal;
        } else {
          productBreakdown.set(item.productId, {
            name: item.product.name,
            quantity: item.quantity,
            total: item.subtotal,
          });
        }
      }
    }

    const paymentMethodBreakdown = new Map<string, number>();
    for (const order of orders) {
      for (const payment of order.payments) {
        const existing = paymentMethodBreakdown.get(payment.method) || 0;
        paymentMethodBreakdown.set(payment.method, existing + payment.amount);
      }
    }

    return {
      startDate,
      endDate,
      totalOrders: orders.length,
      totalSales,
      totalPayments,
      pendingPayment: totalSales - totalPayments,
      productBreakdown: Array.from(productBreakdown.values()),
      paymentMethodBreakdown: Object.fromEntries(paymentMethodBreakdown),
    };
  }

  async getCustomerDebts() {
    const orders = await this.prisma.order.findMany({
      where: {
        status: { in: ['PENDIENTE', 'PARCIAL'] },
        customerId: { not: null },
      },
      include: {
        customer: true,
        payments: true,
      },
    });

    const customerDebts = new Map<
      string,
      {
        customerId: string;
        customerName: string;
        phone: string | null;
        totalOwed: number;
        ordersCount: number;
        orders: Array<{
          orderId: string;
          total: number;
          paid: number;
          remaining: number;
          status: string;
          createdAt: Date;
        }>;
      }
    >();

    for (const order of orders) {
      if (!order.customer) continue;

      const paid = order.payments.reduce((sum, p) => sum + p.amount, 0);
      const remaining = order.total - paid;

      if (remaining <= 0) continue;

      const existing = customerDebts.get(order.customerId!);
      const orderDetail = {
        orderId: order.id,
        total: order.total,
        paid,
        remaining,
        status: order.status,
        createdAt: order.createdAt,
      };

      if (existing) {
        existing.totalOwed += remaining;
        existing.ordersCount += 1;
        existing.orders.push(orderDetail);
      } else {
        customerDebts.set(order.customerId!, {
          customerId: order.customerId!,
          customerName: order.customer.name,
          phone: order.customer.phone,
          totalOwed: remaining,
          ordersCount: 1,
          orders: [orderDetail],
        });
      }
    }

    return Array.from(customerDebts.values()).sort(
      (a, b) => b.totalOwed - a.totalOwed,
    );
  }

  async getTopProducts(startDate?: string, endDate?: string) {
    const where: any = {};
    if (startDate || endDate) {
      where.order = { createdAt: {} };
      if (startDate) {
        where.order.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.order.createdAt.lte = end;
      }
    }

    const orderItems = await this.prisma.orderItem.findMany({
      where,
      include: { product: true },
    });

    const productStats = new Map<
      string,
      { name: string; category: string | null; quantity: number; total: number }
    >();

    for (const item of orderItems) {
      const existing = productStats.get(item.productId);
      if (existing) {
        existing.quantity += item.quantity;
        existing.total += item.subtotal;
      } else {
        productStats.set(item.productId, {
          name: item.product.name,
          category: item.product.category,
          quantity: item.quantity,
          total: item.subtotal,
        });
      }
    }

    return Array.from(productStats.values()).sort(
      (a, b) => b.quantity - a.quantity,
    );
  }

  async getProfits(startDate?: string, endDate?: string) {
    const where: any = { status: { not: 'CANCELADO' } };
    const purchaseWhere: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      purchaseWhere.date = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
        purchaseWhere.date.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
        purchaseWhere.date.lte = end;
      }
    }

    const [orders, purchases] = await Promise.all([
      this.prisma.order.findMany({ where, select: { total: true } }),
      this.prisma.purchase.findMany({ where: purchaseWhere, select: { total: true } }),
    ]);

    const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
    const totalPurchases = purchases.reduce((sum, p) => sum + p.total, 0);
    const grossProfit = totalSales - totalPurchases;
    const profitMargin = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;

    return {
      period: { startDate, endDate },
      totalSales,
      totalPurchases,
      grossProfit,
      profitMargin: Math.round(profitMargin * 100) / 100,
    };
  }

  async getProfitsByPeriod(groupBy: 'day' | 'week' | 'month' = 'day') {
    const since = new Date();
    since.setDate(since.getDate() - 30);
    since.setHours(0, 0, 0, 0);

    const [orders, purchases] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          status: { not: 'CANCELADO' },
          createdAt: { gte: since },
        },
        select: { total: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.purchase.findMany({
        where: { date: { gte: since } },
        select: { total: true, date: true },
        orderBy: { date: 'asc' },
      }),
    ]);

    const getPeriodKey = (date: Date): string => {
      if (groupBy === 'month') {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      if (groupBy === 'week') {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - d.getDay());
        return d.toISOString().split('T')[0];
      }
      return date.toISOString().split('T')[0];
    };

    const periodMap = new Map<string, { sales: number; purchases: number }>();

    for (const order of orders) {
      const key = getPeriodKey(order.createdAt);
      const existing = periodMap.get(key) ?? { sales: 0, purchases: 0 };
      existing.sales += order.total;
      periodMap.set(key, existing);
    }

    for (const purchase of purchases) {
      const key = getPeriodKey(purchase.date);
      const existing = periodMap.get(key) ?? { sales: 0, purchases: 0 };
      existing.purchases += purchase.total;
      periodMap.set(key, existing);
    }

    return Array.from(periodMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        sales: data.sales,
        purchases: data.purchases,
        profit: data.sales - data.purchases,
      }));
  }

  async getSalesByUser(startDate?: string, endDate?: string) {
    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    const userSales = new Map<
      string,
      { userId: string; userName: string; email: string; ordersCount: number; totalSales: number }
    >();

    for (const order of orders) {
      const existing = userSales.get(order.userId);
      if (existing) {
        existing.ordersCount += 1;
        existing.totalSales += order.total;
      } else {
        userSales.set(order.userId, {
          userId: order.userId,
          userName: order.user.name,
          email: order.user.email,
          ordersCount: 1,
          totalSales: order.total,
        });
      }
    }

    return Array.from(userSales.values()).sort(
      (a, b) => b.totalSales - a.totalSales,
    );
  }
}
