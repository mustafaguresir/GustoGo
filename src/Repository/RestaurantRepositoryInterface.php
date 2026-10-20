<?php
namespace App\Repository;

use App\Model\Restaurant;

interface RestaurantRepositoryInterface
{
    public function findAll(): array;
    public function findById(int $id): ?Restaurant;
}
