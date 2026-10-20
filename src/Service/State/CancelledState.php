<?php
namespace App\Service\State;

use App\Model\Order;
use App\Enum\OrderStatus;
use DomainException;

final class CancelledState implements OrderStateInterface
{
    public function proceed(Order $order, OrderStatus $nextStatus): void
    {
        throw new DomainException("İptal edilmiş sipariş yeniden açılamaz!");
    }

    public function canCancel(Order $order): bool
    {
        return false;
    }
}
