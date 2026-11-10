<?php
declare(strict_types=1);

namespace App\Tests\Unit;

use PHPUnit\Framework\TestCase;
use App\Model\Order;
use App\Model\Courier;
use App\Model\Restaurant;
use App\Enum\OrderStatus;
use App\Enum\CourierStatus;
use App\Service\HaversineDistanceService;
use App\Service\CourierAssignmentService;
use App\Service\Courier\ScoreBasedAssignmentStrategy;
use App\Repository\InMemory\InMemoryCourierRepository;
use RuntimeException;

/**
 * Gereksinim Eşleştirmesi:
 * - FR-07: Haversine küresel mesafe formülü
 * - FR-08: Kurye puanlama ve iş yükü optimizasyonu
 * - Sınır Durumu: Boşta kurye bulunamaması
 */
final class CourierAssignmentStrategyTest extends TestCase
{
    private CourierAssignmentService $assignmentService;
    private HaversineDistanceService $haversine;
    private ScoreBasedAssignmentStrategy $strategy;

    protected function setUp(): void
    {
        $this->haversine = new HaversineDistanceService();
        $this->strategy = new ScoreBasedAssignmentStrategy($this->haversine);
        $this->assignmentService = new CourierAssignmentService(
            new InMemoryCourierRepository(),
            null,
            $this->strategy,
            $this->haversine
        );
    }

    public function testHaversineDistanceCalculationIsAccurate(): void
    {
        // Kadıköy Moda (40.9850 N, 29.0280 E) ile Kadıköy Rıhtım (40.9910 N, 29.0250 E)
        $distance = $this->haversine->calculate(40.9850, 29.0280, 40.9910, 29.0250);

        $this->assertGreaterThan(0.5, $distance);
        $this->assertLessThan(1.5, $distance);
        $this->assertEqualsWithDelta(0.71, $distance, 0.1);
    }

    public function testLowerWorkloadCourierIsSelectedOverCloserBusyCourier(): void
    {
        $restaurant = new Restaurant(1, 4, 'Moda Kebap', 10, 15, '02163334455', true, 40.9850, 29.0280, 'Moda');
        $order = new Order(1, 1, 1, null, OrderStatus::HAZIR, 200.0, 40.9850, 29.0280);

        // Kurye 1 (Ali): Moda Rıhtım'da (0.71 km uzakta) ancak 2 aktif siparişi var -> Skor = 0.71 + (2*2) = 4.71
        $courier1 = new Courier(1, 7, 'Ali (Yakın ama Meşgul)', 15, 20, 2, CourierStatus::MUSAIT, 40.9910, 29.0250);

        // Kurye 2 (Veli): Fenerbahçe'de (1.26 km uzakta) ancak 0 aktif siparişi var -> Skor = 1.26 + (2*0) = 1.26
        $courier2 = new Courier(2, 8, 'Veli (Uzak ama Boşta)', 8, 10, 0, CourierStatus::MUSAIT, 40.9760, 29.0380);

        $best = $this->assignmentService->assignBestCourier($order, $restaurant, [$courier1, $courier2]);

        $this->assertSame(2, $best->id, 'Formül gereğince daha uzakta olmasına rağmen iş yükü boş olan Kurye Veli seçilmelidir!');
    }

    public function testEmptyCandidatesListThrowsException(): void
    {
        $restaurant = new Restaurant(1, 4, 'Moda Kebap', 10, 15, '02163334455', true, 40.9850, 29.0280, 'Moda');
        $order = new Order(2, 1, 1, null, OrderStatus::HAZIR, 150.0, 40.9850, 29.0280);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage("Uygun kurye bulunamadı!");

        $this->assignmentService->assignBestCourier($order, $restaurant, []);
    }

    public function testSameDistanceDifferentWorkloadSelectsIdleCourier(): void
    {
        $restaurant = new Restaurant(1, 4, 'Merkez Restoran', 10, 10, '02161111111', true, 40.9800, 29.0300);
        $order = new Order(3, 1, 1, null, OrderStatus::HAZIR, 100.0, 40.9800, 29.0300);

        // İkisi de aynı koordinatta (mesafe eşit)
        $cBusy = new Courier(10, 1, 'Meşgul Kurye', 10, 10, 3, CourierStatus::MUSAIT, 40.9850, 29.0350);
        $cIdle = new Courier(11, 2, 'Boş Kurye', 10, 10, 0, CourierStatus::MUSAIT, 40.9850, 29.0350);

        $selected = $this->assignmentService->assignBestCourier($order, $restaurant, [$cBusy, $cIdle]);
        $this->assertSame(11, $selected->id);
    }
}
