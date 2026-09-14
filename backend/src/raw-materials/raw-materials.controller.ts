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
import { RawMaterialsService } from './raw-materials.service';
import { CreateRawMaterialDto } from './dto/create-raw-material.dto';
import { UpdateRawMaterialDto } from './dto/update-raw-material.dto';

@ApiTags('raw-materials')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('raw-materials')
export class RawMaterialsController {
  constructor(private readonly rawMaterialsService: RawMaterialsService) {}

  @Get()
  findAll(@Query('category') category?: string) {
    return this.rawMaterialsService.findAll(category);
  }

  @Get('categories')
  findAllCategories() {
    return this.rawMaterialsService.findAllCategories();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rawMaterialsService.findById(id);
  }

  @Post()
  create(@Body() dto: CreateRawMaterialDto) {
    return this.rawMaterialsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRawMaterialDto) {
    return this.rawMaterialsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rawMaterialsService.delete(id);
  }
}
