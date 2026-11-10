<?php
declare(strict_types=1);

namespace App\Model;

final class OrderItem
{
    public function __construct(
        public int $id,
        public int $orderId,
        public int $menuItemId,
        public string $name,
        public int $quantity,
        public float $unitPrice,
        public float $subtotal
    ) {}

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'order_id' => $this->orderId,
            'menu_item_id' => $this->menuItemId,
            'name' => $this->name,
            'quantity' => $this->quantity,
            'unit_price' => $this->unitPrice,
            'subtotal' => $this->subtotal,
        ];
    }

    public static function fromArray(array $data): self
    {
        return new self(
            id: (int)$data['id'],
            orderId: (int)$data['order_id'],
            menuItemId: (int)$data['menu_item_id'],
            name: (string)($data['name'] ?? ''),
            quantity: (int)$data['quantity'],
            unitPrice: (float)$data['unit_price'],
            subtotal: (float)($data['subtotal'] ?? ($data['quantity'] * $data['unit_price']))
        );
    }
}
