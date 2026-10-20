<?php
namespace App\Service;

use App\Model\Order;
use App\Model\Courier;
use App\Model\Restaurant;
use App\Service\Courier\AssignmentStrategyInterface;
use App\Service\Courier\ScoreBasedAssignmentStrategy;
use App\Repository\CourierRepositoryInterface;
use App\Repository\RestaurantRepositoryInterface;
use RuntimeException;

final class CourierAssignmentService
{
    private AssignmentStrategyInterface $strategy;
    private HaversineDistanceService $haversine;

    public function __construct(
        private ?CourierRepositoryInterface $courierRepo = null,
        private ?RestaurantRepositoryInterface $restaurantRepo = null,
        ?AssignmentStrategyInterface $strategy = null,
        ?HaversineDistanceService $haversine = null
    ) {
        $this->haversine = $haversine ?? new HaversineDistanceService();
        $this->strategy = $strategy ?? new ScoreBasedAssignmentStrategy($this->haversine);
    }

    /**
     * Haversine Mesafe Hesabı (Şartname Gereksinimi)
     */
    public function calculateHaversineDistance(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        return $this->haversine->calculate($lat1, $lon1, $lat2, $lon2);
    }

    public function calculateHaversineFromGrid(int $x1, int $y1, int $x2, int $y2): float
    {
        return $this->haversine->calculateFromGrid($x1, $y1, $x2, $y2);
    }

    /**
     * Manhattan Mesafesi (Karşılaştırma ve Izgara gösterimi için)
     */
    public function calculateManhattanDistance(int $x1, int $y1, int $x2, int $y2): int
    {
        return abs($x1 - $x2) + abs($y1 - $y2);
    }

    public function assignBestCourier(Order $order, Restaurant $restaurant, array $availableCouriers): Courier
    {
        $bestCourier = $this->strategy->findBestCourier($availableCouriers, $restaurant, $order->deliveryX, $order->deliveryY);

        if (!$bestCourier) {
            throw new RuntimeException("Uygun kurye bulunamadı!");
        }

        return $bestCourier;
    }
}
