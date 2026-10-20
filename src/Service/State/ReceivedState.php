<?php
namespace App\Service\State;

use App\Model\Order;
use App\Enum\OrderStatus;
use DomainException;

final class ReceivedState implements OrderStateInterface
{
    public function proceed(Order $order, OrderStatus $nextStatus): void
    {
        // Alındı durumundan sadece Hazırlanıyor veya İptal durumuna geçilebilir
        if ($nextStatus !== OrderStatus::HAZIRLANIYOR && $nextStatus !== OrderStatus::IPTAL) {
            throw new DomainException("Alındı aşamasındaki sipariş yalnızca 'hazırlanıyor' veya 'iptal' edilebilir. İstenen: {$nextStatus->value}");
        }
    }

    public function canCancel(Order $order): bool
    {
        // Hazırlanıyor'dan önce olduğu için iptal edilebilir!
        return true;
    }
}
