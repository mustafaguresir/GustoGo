<?php
namespace App\Service\State;

use App\Model\Order;
use App\Enum\OrderStatus;
use DomainException;

final class ReadyState implements OrderStateInterface
{
    public function proceed(Order $order, OrderStatus $nextStatus): void
    {
        // Hazır durumundan sadece 'Yolda' aşamasına geçilebilir
        if ($nextStatus !== OrderStatus::YOLDA) {
            throw new DomainException("Hazır aşamasındaki sipariş yalnızca 'yolda' durumuna geçebilir. İstenen: {$nextStatus->value}");
        }
    }

    public function canCancel(Order $order): bool
    {
        return false;
    }
}
