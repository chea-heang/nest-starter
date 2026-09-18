import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateItemDto, GetItemsQueryDto, UpdateItemDto } from './dto/create-item.dto';
import { Item } from './interfaces/item.interface';

@Injectable()
export class ItemsService {
  // In-memory array to simulate a database
    private items: Item[] = [
    { id: '1', name: 'Mechanical Keyboard', price: 95, description: 'RGB mechanical switch' },
    { id: '2', name: 'Wireless Mouse', price: 45, description: 'Ergonomic 2.4G mouse' },
    { id: '3', name: 'USB-C Monitor', price: 299, description: '4K Ultra HD Display' },
  ];

  findAll(query: GetItemsQueryDto) {
    const { search, limit = 10, page = 1 } = query;
    let filtered = this.items;
    if (search) {
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase()),
      );
    }
    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const data = filtered.slice(startIndex, startIndex + limit);
    return {
      items: data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  findOne(id: string): Item {
    const item = this.items.find((item) => item.id === id);
    if (!item) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }
    return item;
  }

  create(dto: CreateItemDto): Item {
    const newItem: Item = {
      id: Date.now().toString(), // Simple unique ID generator
      ...dto,
    };
    this.items.push(newItem);
    return newItem;
  }

  update(id: string, updateData: UpdateItemDto): Item {
    const item = this.findOne(id);
    Object.assign(item, updateData);
    return item;
  }

  remove(id: string): { message: string; id: string } {
    const index = this.items.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }
    this.items.splice(index, 1);
    return { message: `Item with ID: ${id} has been deleted`, id };
  }
}
