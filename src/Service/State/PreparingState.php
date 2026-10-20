<?php
namespace App\Service\State;

use App\Model\Order;
use App\Enum\OrderStatus;
use DomainException;

final class PreparingState implements OrderStateInterface
{
    public function proceed(Order $order, OrderStatus $nextStatus): void
    {
        // Hazırlanıyor durumundan sadece 'Hazır' aşamasına geçilebilir
        if ($nextStatus !== OrderStatus::HAZIR) {
            throw new DomainException("Hazırlanıyor aşamasındaki sipariş yalnızca 'hazır' durumuna geçebilir. İptal edilemez! İstenen: {$nextStatus->value}");
        }
    }

    public function canCancel(Order $order): bool
    {
        // Kural: İptal yalnızca 'hazırlanıyor'dan önce yapılabilir. Hazırlanıyor iken iptal EDİLEMEZ!
        return false;
    }
}
