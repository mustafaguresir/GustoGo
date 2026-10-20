<?php
namespace App\Service\State;

use App\Model\Order;
use App\Enum\OrderStatus;

interface OrderStateInterface
{
    public function proceed(Order $order, OrderStatus $nextStatus): void;
    public function canCancel(Order $order): bool;
}
