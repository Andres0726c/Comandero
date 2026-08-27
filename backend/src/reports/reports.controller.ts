import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/auth.guard';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('daily')
  getDailySummary(@Query('date') date?: string) {
    return this.reportsService.getDailySummary(date);
  }

  @Get('summary')
  getDateRangeSummary(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getDateRangeSummary(startDate, endDate);
  }

  @Get('debts')
  getCustomerDebts() {
    return this.reportsService.getCustomerDebts();
  }

  @Get('top-products')
  getTopProducts(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getTopProducts(startDate, endDate);
  }

  @Get('by-user')
  getSalesByUser(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getSalesByUser(startDate, endDate);
  }

  @Get('profits')
  getProfits(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getProfits(startDate, endDate);
  }

  @Get('profits-timeline')
  getProfitsByPeriod(
    @Query('groupBy') groupBy?: 'day' | 'week' | 'month',
  ) {
    return this.reportsService.getProfitsByPeriod(groupBy);
  }
}
