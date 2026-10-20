<?php
namespace App\Service;

/**
 * Haversine Mesafe Hesaplama Servisi
 * Şartname Gereksinimi: "mesafe hesabı (Haversine)"
 * Kapsam Sınırı: "Harita servisi, canlı konum takibi ve ödeme yok; konumlar sabit koordinat veya mahalle olarak tutulur."
 */
final class HaversineDistanceService
{
    public const EARTH_RADIUS_KM = 6371.0;

    /**
     * İki coğrafi koordinat (enlem/boylam derece) arasındaki küresel mesafeyi kilometre olarak hesaplar.
     *
     * @param float $lat1 Başlangıç enlemi (Latitude)
     * @param float $lon1 Başlangıç boylamı (Longitude)
     * @param float $lat2 Hedef enlemi (Latitude)
     * @param float $lon2 Hedef boylamı (Longitude)
     * @return float Mesafe (kilometre cinsinden, 2 ondalık basamak)
     */
    public function calculate(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return round(self::EARTH_RADIUS_KM * $c, 2);
    }

    /**
     * Sabit ızgara koordinatlarını sabit mahalle koordinatlarına eşleyerek Haversine mesafesi hesaplar.
     * İstanbul Anadolu/Avrupa yakası referans merkezi (Kadıköy: 40.9900 N, 29.0250 E)
     */
    public function calculateFromGrid(int $x1, int $y1, int $x2, int $y2, float $scale = 0.005): float
    {
        $lat1 = 40.9900 + ($y1 * $scale);
        $lon1 = 29.0250 + ($x1 * $scale);
        $lat2 = 40.9900 + ($y2 * $scale);
        $lon2 = 29.0250 + ($x2 * $scale);

        return $this->calculate($lat1, $lon1, $lat2, $lon2);
    }
}
