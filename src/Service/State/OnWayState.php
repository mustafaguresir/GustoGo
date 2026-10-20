<?php
namespace App\Service\State;

use App\Model\Order;
use App\Enum\OrderStatus;
use DomainException;

final class OnWayState implements OrderStateInterface
{
    public function proceed(Order $order, OrderStatus $nextStatus): void
    {
        // Yolda durumundan sadece 'Teslim Edildi' aşamasına geçilebilir
        if ($nextStatus !== OrderStatus::TESLIM_EDILDI) {
            throw new DomainException("Yoldaki sipariş yalnızca 'teslim_edildi' durumuna geçebilir. Geriye alınamaz! İstenen: {$nextStatus->value}");
        }
    }

    public function canCancel(Order $order): bool
    {
        return false;
    }
}
