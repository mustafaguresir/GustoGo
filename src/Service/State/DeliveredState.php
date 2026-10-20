<?php
namespace App\Service\State;

use App\Model\Order;
use App\Enum\OrderStatus;
use DomainException;

final class DeliveredState implements OrderStateInterface
{
    public function proceed(Order $order, OrderStatus $nextStatus): void
    {
        throw new DomainException("Teslim edilmiş sipariş nihai durumdadır, durumu değiştirilemez!");
    }

    public function canCancel(Order $order): bool
    {
        return false;
    }
}
