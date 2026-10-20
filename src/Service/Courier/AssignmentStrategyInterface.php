<?php
namespace App\Service\Courier;

use App\Model\Courier;
use App\Model\Restaurant;

interface AssignmentStrategyInterface
{
    /**
     * @param Courier[] $candidates
     * @param Restaurant $restaurant
     * @param int $targetX
     * @param int $targetY
     * @return Courier|null
     */
    public function findBestCourier(array $candidates, Restaurant $restaurant, int $targetX, int targetY): ?Courier;
}
