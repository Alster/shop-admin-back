import { Controller, Get, Logger, Param, Query } from '@nestjs/common';
import { OrderService } from '../../../shop_shared_server/service/order/order.service';
import { OrderAdminDto } from '../../../shop_shared/dto/order/order.dto';
import { mapOrderDocumentToOrderAdminDto } from '../../../shop_shared_server/mapper/order/map.orderDocument-to-orderAdminDto';
import { ProductListAdminResponseDto } from '../../../shop_shared/dto/product/product-list.admin.response.dto';
import { ObjectId } from 'mongodb';
import { LanguageEnum } from '../../../shop_shared/constants/localization';
import { mapProductDocumentToProductAdminDto } from '../../../shop_shared_server/mapper/product/map.productDocument-to-productAdminDto';
import { OrderListAdminResponseDto } from '../../../shop_shared/dto/product/order-list.admin.response.dto';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  private logger: Logger = new Logger(OrderController.name);

  @Get('get/:id')
  async getOrder(@Param('id') id: string): Promise<OrderAdminDto> {
    const res = await this.orderService.getOrder(id);
    if (!res) {
      throw new Error(`Order not found with id ${id}`);
    }
    return mapOrderDocumentToOrderAdminDto(res);
  }

  @Get('list')
  async list(
    @Query('sortField') sortField: string,
    @Query('sortOrder') sortOrder: number,
    @Query('skip') skip: number,
    @Query('limit') limit: number,
    @Query('search') search: string,
  ): Promise<OrderListAdminResponseDto> {
    const query: any = {};
    if (search) {
      query.$text = {
        $search: search,
      };
    }

    const sort: any = {};
    if (sortField) {
      sort[sortField] = sortOrder;
    }

    const res = await this.orderService.find(query, sort, skip, limit);

    return {
      orders: res.orders.map((order) => mapOrderDocumentToOrderAdminDto(order)),
      total: res.total,
    };
  }
}
