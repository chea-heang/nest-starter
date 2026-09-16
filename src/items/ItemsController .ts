import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { CreateItemDto } from './dto/create-item.dto';

@Controller('items')
export class ItemsController {
  @Get()
  findFiltered(
    @Query('search') search?: string,
    @Query('limit') limit?: string,
  ) {
    return {
      search: search ?? 'none',
      limit: limit ? parseInt(limit, 10) : 10,
    };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return {
      message: `Fetching item with ID: ${id}`,
      id,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createItemDto: CreateItemDto) {
    return {
      status: 'success',
      data: createItemDto,
    };
  }

  @Put(':id')
  updateFull(@Param('id') id: string, @Body() body: any) {
    return { message: `Full update on item ${id}`, payload: body };
  }

  @Patch(':id')
  updatePartial(@Param('id') id: string, @Body() body: any) {
    return { message: `Partial update on item ${id}`, payload: body };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return {
      message: `Item with ID: ${id} has been deleted`,
      id,
    };
  }
}
