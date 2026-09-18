import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { CreateItemDto, GetItemsQueryDto, UpdateItemDto } from './dto/create-item.dto';
import { ItemsService } from './items.service';

@Controller('items')
export class ItemsController  {
  constructor(private readonly itemsService: ItemsService) {}

  @Get()
  findAll(@Query() query: GetItemsQueryDto) {
    return this.itemsService.findAll(query);
  }
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.itemsService.findOne(id);
  }
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createItemDto: CreateItemDto) {
    return {
      status: 'success',
      data: this.itemsService.create(createItemDto),
    };
  }
  @Put(':id')
  updateFull(@Param('id') id: string, @Body() body: UpdateItemDto) {
    return this.itemsService.update(id, body);
  }
  @Patch(':id')
  updatePartial(@Param('id') id: string, @Body() body: UpdateItemDto) {
    return this.itemsService.update(id, body);
  }
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.itemsService.remove(id);
  }
}
