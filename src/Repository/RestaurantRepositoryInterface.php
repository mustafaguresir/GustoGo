<?php
declare(strict_types=1);

namespace App\Repository;

use App\Model\Restaurant;
use App\Model\MenuItem;

interface RestaurantRepositoryInterface
{
    /** @return Restaurant[] */
    public function findAll(): array;
    public function findById(int $id): ?Restaurant;
    public function findByUserId(int $userId): ?Restaurant;
    public function save(Restaurant $restaurant): int;
    /** @return MenuItem[] */
    public function getMenuItems(int $restaurantId): array;
    public function findMenuItemById(int $id): ?MenuItem;
    public function saveMenuItem(MenuItem $item): int;
}
