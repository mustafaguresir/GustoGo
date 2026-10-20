<?php
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
        public bool $isAvailable = true
    ) {}
}
