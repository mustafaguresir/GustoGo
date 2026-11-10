<?php
declare(strict_types=1);

namespace App\Model;

use App\Enum\OrderStatus;

final class Order
{
    /** @var OrderItem[] */
    public array $items = [];

    public function __construct(
        public int $id,
        public int $customerId,
        public int $restaurantId,
        public ?int $courierId,
        public OrderStatus $status,
        public float $totalAmount,
        public float $deliveryLatitude,
        public float $deliveryLongitude,
        public ?string $estimatedDeliveryTime = null,
        public ?string $createdAt = null,
        array $items = []
    ) {
        $this->items = $items;
        $this->createdAt = $createdAt ?? date('Y-m-d H:i:s');
    }

    public function addItem(OrderItem $item): void
    {
        $this->items[] = $item;
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'customer_id' => $this->customerId,
            'restaurant_id' => $this->restaurantId,
            'courier_id' => $this->courierId,
            'status' => $this->status->value,
            'total_amount' => $this->totalAmount,
            'delivery_latitude' => $this->deliveryLatitude,
            'delivery_longitude' => $this->deliveryLongitude,
            'estimated_delivery_time' => $this->estimatedDeliveryTime,
            'created_at' => $this->createdAt,
            'items' => array_map(fn(OrderItem $i) => $i->toArray(), $this->items)
        ];
    }

    public static function fromArray(array $data): self
    {
        $items = [];
        if (!empty($data['items']) && is_array($data['items'])) {
            foreach ($data['items'] as $itemData) {
                $items[] = $itemData instanceof OrderItem ? $itemData : OrderItem::fromArray($itemData);
            }
        }

        $lat = (float)($data['delivery_latitude'] ?? $data['deliveryX'] ?? 40.9850);
        $lon = (float)($data['delivery_longitude'] ?? $data['deliveryY'] ?? 29.0280);

        return new self(
            id: (int)$data['id'],
            customerId: (int)$data['customer_id'],
            restaurantId: (int)$data['restaurant_id'],
            courierId: isset($data['courier_id']) && $data['courier_id'] !== null ? (int)$data['courier_id'] : null,
            status: OrderStatus::from((string)$data['status']),
            totalAmount: (float)$data['total_amount'],
            deliveryLatitude: $lat,
            deliveryLongitude: $lon,
            estimatedDeliveryTime: $data['estimated_delivery_time'] ?? null,
            createdAt: $data['created_at'] ?? null,
            items: $items
        );
    }
}
