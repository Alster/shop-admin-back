import { Controller, Get, Logger, Param, Post, Query } from "@nestjs/common";

import { ORDER_STATUS } from "../../../shop-shared/constants/order";
import { OrderAdminDto } from "../../../shop-shared/dto/order/order.dto";
import { OrderListAdminResponseDto } from "../../../shop-shared/dto/product/orderList.admin.response.dto";
import { mapOrderDocumentToOrderAdminDto } from "../../../shop-shared-server/mapper/order/map.orderDocument.to.orderAdminDto";
import { OrderService } from "../../../shop-shared-server/service/order/order.service";
import { FilterQuery } from "mongoose";
import { OrderDocument } from "../../../shop-shared-server/schema/order.schema";

@Controller("order")
export class OrderController {
	constructor(private readonly orderService: OrderService) {}

	private logger: Logger = new Logger(OrderController.name);

	@Get("get/:id")
	async getOrder(@Param("id") id: string): Promise<OrderAdminDto> {
		const result = await this.orderService.getOrder(id);
		if (!result) {
			throw new Error(`Order not found with id ${id}`);
		}
		return mapOrderDocumentToOrderAdminDto(result);
	}

	@Get("list")
	async list(
		@Query("sortField") sortField: string,
		@Query("sortOrder") sortOrder: number,
		@Query("skip") skip: number,
		@Query("limit") limit: number,
		@Query("search") search: string,
		@Query("status") status: string,
	): Promise<OrderListAdminResponseDto> {
		const query: FilterQuery<OrderDocument> = {};
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

		const result = await this.orderService.find(query, sort, skip, limit);

		return {
			orders: result.orders.map((order) => mapOrderDocumentToOrderAdminDto(order)),
			total: result.total,
		};
	}

	@Post(":id/mark_finished")
	async markFinished(@Param("id") id: string): Promise<OrderAdminDto> {
		const order = await this.orderService.updateOrderStatus(id, ORDER_STATUS.FINISHED);
		return mapOrderDocumentToOrderAdminDto(order);
	}
}
