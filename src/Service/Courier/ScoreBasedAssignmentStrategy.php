<?php
namespace App\Service\Courier;

use App\Model\Courier;
use App\Model\Restaurant;
use App\Service\HaversineDistanceService;

final class ScoreBasedAssignmentStrategy implements AssignmentStrategyInterface
{
    private HaversineDistanceService $haversine;

    public function __construct(?HaversineDistanceService $haversine = null)
    {
        $this->haversine = $haversine ?? new HaversineDistanceService();
    }

    /**
     * Kural:
     * Mesafe = Haversine Büyük Daire Küresel Mesafesi (km cinsinden)
     * Puan = Mesafe (km) + 2 * kuryenin aktif sipariş sayısı
     * En düşük puanlı müsait kurye seçilir.
     */
    public function findBestCourier(array $candidates, Restaurant $restaurant, int $targetX, int $targetY): ?Courier
    {
        if (empty($candidates)) {
            return null;
        }

        $bestCourier = null;
        $lowestScore = PHP_FLOAT_MAX;

        foreach ($candidates as $courier) {
            // Eğer lat/lon tanımlıysa doğrudan coğrafi Haversine, yoksa ızgara eşlemeli Haversine hesaplanır
            if ($courier->latitude != 0.0 && $restaurant->latitude != 0.0) {
                $distanceKm = $this->haversine->calculate(
                    $courier->latitude,
                    $courier->longitude,
                    $restaurant->latitude,
                    $restaurant->longitude
                );
            } else {
                $distanceKm = $this->haversine->calculateFromGrid(
                    $courier->currentX,
                    $courier->currentY,
                    $restaurant->locationX,
                    $restaurant->locationY
                );
            }

            // Puan Formülü: Mesafe (km) + 2 * Aktif Sipariş İş Yükü
            $score = round($distanceKm + (2.0 * $courier->activeOrdersCount), 2);
            $courier->distanceKm = $distanceKm;
            $courier->score = $score;

            if ($score < $lowestScore) {
                $lowestScore = $score;
                $bestCourier = $courier;
            }
        }

        return $bestCourier;
    }
}
