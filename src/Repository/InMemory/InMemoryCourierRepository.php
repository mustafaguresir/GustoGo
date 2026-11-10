<?php
declare(strict_types=1);

namespace App\Repository\InMemory;

use App\Model\Courier;
use App\Enum\CourierStatus;
use App\Repository\CourierRepositoryInterface;

final class InMemoryCourierRepository implements CourierRepositoryInterface
{
    /** @var array<int, Courier> */
    public array $couriers = [];
    private int $autoIncrementId = 1;

    public function findAvailable(): array
    {
        $result = [];
        foreach ($this->couriers as $courier) {
            if ($courier->status === CourierStatus::MUSAIT) {
                $result[] = $courier;
            }
        }
        return $result;
    }

    public function findById(int $id): ?Courier
    {
        return $this->couriers[$id] ?? null;
    }

    public function incrementActiveOrders(int $courierId): void
    {
        if (isset($this->couriers[$courierId])) {
            $this->couriers[$courierId]->activeOrdersCount++;
        }
    }

    public function decrementActiveOrders(int $courierId): void
    {
        if (isset($this->couriers[$courierId])) {
            $this->couriers[$courierId]->activeOrdersCount = max(0, $this->couriers[$courierId]->activeOrdersCount - 1);
        }
    }

    public function save(Courier $courier): int
    {
        if ($courier->id <= 0) {
            $courier->id = $this->autoIncrementId++;
        }
        $this->couriers[$courier->id] = $courier;
        return $courier->id;
    }
}
