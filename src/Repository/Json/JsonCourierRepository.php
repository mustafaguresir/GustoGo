<?php
declare(strict_types=1);

namespace App\Repository\Json;

use App\Model\Courier;
use App\Enum\CourierStatus;
use App\Repository\CourierRepositoryInterface;
use App\Storage\JsonStorageHelper;

final class JsonCourierRepository implements CourierRepositoryInterface
{
    private string $filePath;

    public function __construct(?string $filePath = null)
    {
        $this->filePath = $filePath ?? dirname(__DIR__, 3) . '/storage/couriers.json';
    }

    public function findAvailable(): array
    {
        $records = JsonStorageHelper::read($this->filePath);
        $couriers = [];
        foreach ($records as $row) {
            $c = Courier::fromArray($row);
            if ($c->status === CourierStatus::MUSAIT) {
                $couriers[] = $c;
            }
        }
        return $couriers;
    }

    public function findById(int $id): ?Courier
    {
        $records = JsonStorageHelper::read($this->filePath);
        foreach ($records as $row) {
            if ((int)$row['id'] === $id) {
                return Courier::fromArray($row);
            }
        }
        return null;
    }

    public function findByUserId(int $userId): ?Courier
    {
        $records = JsonStorageHelper::read($this->filePath);
        foreach ($records as $row) {
            if ((int)($row['user_id'] ?? 0) === $userId) {
                return Courier::fromArray($row);
            }
        }
        return null;
    }

    public function incrementActiveOrders(int $courierId): void
    {
        $records = JsonStorageHelper::read($this->filePath);
        foreach ($records as &$row) {
            if ((int)$row['id'] === $courierId) {
                $row['active_orders_count'] = (int)($row['active_orders_count'] ?? 0) + 1;
                break;
            }
        }
        JsonStorageHelper::write($this->filePath, $records);
    }

    public function decrementActiveOrders(int $courierId): void
    {
        $records = JsonStorageHelper::read($this->filePath);
        foreach ($records as &$row) {
            if ((int)$row['id'] === $courierId) {
                $cnt = (int)($row['active_orders_count'] ?? 0);
                $row['active_orders_count'] = max(0, $cnt - 1);
                break;
            }
        }
        JsonStorageHelper::write($this->filePath, $records);
    }

    public function save(Courier $courier): int
    {
        $records = JsonStorageHelper::read($this->filePath);
        $maxId = 0;
        $foundIndex = -1;

        foreach ($records as $index => $row) {
            $id = (int)$row['id'];
            if ($id > $maxId) {
                $maxId = $id;
            }
            if ($courier->id > 0 && $id === $courier->id) {
                $foundIndex = $index;
            }
        }

        if ($courier->id <= 0) {
            $courier->id = $maxId + 1;
        }

        $data = $courier->toArray();
        if ($foundIndex >= 0) {
            $records[$foundIndex] = $data;
        } else {
            $records[] = $data;
        }

        JsonStorageHelper::write($this->filePath, $records);
        return $courier->id;
    }
}
