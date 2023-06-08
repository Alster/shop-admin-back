import { Controller, Get, Logger, Param } from '@nestjs/common';
import { OrderService } from '../../../shop_shared_server/service/order/order.service';
import { OrderAdminDto } from '../../../shop_shared/dto/order/order.dto';
import { mapOrderDocumentToOrderAdminDto } from '../../../shop_shared_server/mapper/order/map.orderDocument-to-orderAdminDto';

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
}
