<?php
namespace App\Model;

use App\Enum\OrderStatus;

final class Order
{
    public function __construct(
        public int $id,
        public int $customerId,
        public int $restaurantId,
        public ?int $courierId,
        public OrderStatus $status,
        public float $totalAmount,
        public int $deliveryX,
        public int $deliveryY,
        public ?string $estimatedDeliveryTime = null,
        public ?string $createdAt = null
    ) {}
}
