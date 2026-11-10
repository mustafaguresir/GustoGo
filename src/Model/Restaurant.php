<?php
declare(strict_types=1);

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

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->userId,
            'name' => $this->name,
            'location_x' => $this->locationX,
            'location_y' => $this->locationY,
            'phone' => $this->phone,
            'is_active' => $this->isActive,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'neighborhood' => $this->neighborhood
        ];
    }

    public static function fromArray(array $data): self
    {
        return new self(
            id: (int)$data['id'],
            userId: (int)($data['user_id'] ?? $data['id']),
            name: (string)$data['name'],
            locationX: (int)($data['location_x'] ?? $data['locationX'] ?? 0),
            locationY: (int)($data['location_y'] ?? $data['locationY'] ?? 0),
            phone: (string)($data['phone'] ?? ''),
            isActive: (bool)($data['is_active'] ?? $data['isActive'] ?? true),
            latitude: (float)($data['latitude'] ?? 0.0),
            longitude: (float)($data['longitude'] ?? 0.0),
            neighborhood: (string)($data['neighborhood'] ?? '')
        );
    }
}
