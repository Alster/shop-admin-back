import { Controller, Get, Logger, Param, Post, Query } from '@nestjs/common';
import { OrderService } from '../../../shop-shared-server/service/order/order.service';
import { OrderAdminDto } from '../../../shop-shared/dto/order/order.dto';
import { mapOrderDocumentToOrderAdminDto } from '../../../shop-shared-server/mapper/order/map.orderDocument-to-orderAdminDto';
import { OrderListAdminResponseDto } from '../../../shop-shared/dto/product/order-list.admin.response.dto';
import { ORDER_STATUS } from '../../../shop-shared/constants/order';

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
    @Query('status') status: string,
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

    if (status) {
      query.status = status;
    }

    const res = await this.orderService.find(query, sort, skip, limit);

    return {
      orders: res.orders.map((order) => mapOrderDocumentToOrderAdminDto(order)),
      total: res.total,
    };
  }

  @Post(':id/mark_finished')
  async markFinished(@Param('id') id: string): Promise<OrderAdminDto> {
    const order = await this.orderService.updateOrderStatus(
      id,
      ORDER_STATUS.FINISHED,
    );
    return mapOrderDocumentToOrderAdminDto(order);
  }
}
