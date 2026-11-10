<?php
declare(strict_types=1);

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

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->userId,
            'name' => $this->name,
            'current_x' => $this->currentX,
            'current_y' => $this->currentY,
            'active_orders_count' => $this->activeOrdersCount,
            'status' => $this->status->value,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'neighborhood' => $this->neighborhood,
            'distance_km' => $this->distanceKm,
            'score' => $this->score
        ];
    }

    public static function fromArray(array $data): self
    {
        $statusStr = $data['status'] ?? 'musait';
        $status = CourierStatus::tryFrom($statusStr) ?? CourierStatus::MUSAIT;

        return new self(
            id: (int)$data['id'],
            userId: (int)($data['user_id'] ?? $data['id']),
            name: (string)$data['name'],
            currentX: (int)($data['current_x'] ?? $data['currentX'] ?? 0),
            currentY: (int)($data['current_y'] ?? $data['currentY'] ?? 0),
            activeOrdersCount: (int)($data['active_orders_count'] ?? $data['activeOrdersCount'] ?? 0),
            status: $status,
            latitude: (float)($data['latitude'] ?? 0.0),
            longitude: (float)($data['longitude'] ?? 0.0),
            neighborhood: (string)($data['neighborhood'] ?? ''),
            distanceKm: (float)($data['distance_km'] ?? $data['distanceKm'] ?? 0.0),
            score: (float)($data['score'] ?? 0.0)
        );
    }
}
