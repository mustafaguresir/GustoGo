<?php
namespace App\Repository;

use App\Model\Courier;

interface CourierRepositoryInterface
{
    public function findAvailable(): array;
    public function findById(int $id): ?Courier;
    public function incrementActiveOrders(int $courierId): void;
    public function decrementActiveOrders(int $courierId): void;
}
