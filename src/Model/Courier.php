<?php
namespace App\Model;

use App\Enum\CourierStatus;

final class Courier
{
    public function __construct(
        public int $id,
        public int $userId,
        public string $name,
        public int $currentX,
        public int $currentY,
        public int $activeOrdersCount,
        public CourierStatus $status = CourierStatus::MUSAIT,
        public float $latitude = 0.0,
        public float $longitude = 0.0,
        public string $neighborhood = '',
        public float $distanceKm = 0.0,
        public float $score = 0.0
    ) {}
}
