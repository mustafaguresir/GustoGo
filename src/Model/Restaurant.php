<?php
namespace App\Model;

final class Restaurant
{
    public function __construct(
        public int $id,
        public int $userId,
        public string $name,
        public int $locationX,
        public int $locationY,
        public string $phone,
        public bool $isActive = true,
        public float $latitude = 0.0,
        public float $longitude = 0.0,
        public string $neighborhood = ''
    ) {}
}
