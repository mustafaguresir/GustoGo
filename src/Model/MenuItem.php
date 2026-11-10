<?php
declare(strict_types=1);

namespace App\Model;

final class MenuItem
{
    public function __construct(
        public int $id,
        public int $restaurantId,
        public string $name,
        public string $description,
        public float $price,
        public string $category,
        public bool $isAvailable = true,
        public ?string $image = null
    ) {}

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'restaurant_id' => $this->restaurantId,
            'name' => $this->name,
            'description' => $this->description,
            'price' => $this->price,
            'category' => $this->category,
            'is_available' => $this->isAvailable,
            'image' => $this->image
        ];
    }

    public static function fromArray(array $data): self
    {
        return new self(
            id: (int)$data['id'],
            restaurantId: (int)$data['restaurant_id'],
            name: (string)$data['name'],
            description: (string)($data['description'] ?? ''),
            price: (float)$data['price'],
            category: (string)($data['category'] ?? 'Genel'),
            isAvailable: (bool)($data['is_available'] ?? $data['isAvailable'] ?? true),
            image: $data['image'] ?? null
        );
    }
}
