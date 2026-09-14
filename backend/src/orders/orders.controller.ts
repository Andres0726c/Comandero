import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'VENDEDOR', 'COCINA')
  findAll(
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.ordersService.findAll({ status, startDate, endDate });
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'VENDEDOR', 'COCINA')
  findOne(@Param('id') id: string) {
    return this.ordersService.findById(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'VENDEDOR')
  create(@Body() dto: CreateOrderDto, @CurrentUser() user: any) {
    return this.ordersService.create(dto, user.id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'VENDEDOR', 'COCINA')
  update(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    return this.ordersService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.ordersService.delete(id);
  }

  @Post(':id/payments')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'VENDEDOR')
  addPayment(@Param('id') id: string, @Body() dto: CreatePaymentDto) {
    return this.ordersService.addPayment(id, dto);
  }
}
