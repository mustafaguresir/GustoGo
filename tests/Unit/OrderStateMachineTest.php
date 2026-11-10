<?php
declare(strict_types=1);

namespace App\Tests\Unit;

use PHPUnit\Framework\TestCase;
use App\Model\Order;
use App\Enum\OrderStatus;
use App\Service\OrderStateMachineService;
use App\Repository\InMemory\InMemoryOrderRepository;
use DomainException;

/**
 * Gereksinim Eşleştirmesi:
 * - FR-01: Sipariş durum makinesi sıralı ilerleme
 * - FR-02: Hazırlanmaya başlanan siparişin iptal kuralı
 * - FR-03: Geçersiz geçişlerin (yoldan mutfağa dönüş vb.) engellenmesi
 */
final class OrderStateMachineTest extends TestCase
{
    private OrderStateMachineService $stateMachine;
    private InMemoryOrderRepository $orderRepo;

    protected function setUp(): void
    {
        $this->orderRepo = new InMemoryOrderRepository();
        $this->stateMachine = new OrderStateMachineService($this->orderRepo);
    }

    public function testOrderStartsInReceivedState(): void
    {
        $order = new Order(1, 1, 1, null, OrderStatus::ALINDI, 150.0, 40.9850, 29.0280);
        $this->orderRepo->save($order);

        $this->assertSame(OrderStatus::ALINDI, $order->status);
    }

    public function testValidSequentialTransitionFlow(): void
    {
        $order = new Order(2, 1, 1, 1, OrderStatus::ALINDI, 200.0, 40.9850, 29.0280);
        $this->orderRepo->save($order);

        // alindi -> hazirlaniyor
        $this->stateMachine->transition($order, OrderStatus::HAZIRLANIYOR);
        $this->assertSame(OrderStatus::HAZIRLANIYOR, $order->status);

        // hazirlaniyor -> hazir
        $this->stateMachine->transition($order, OrderStatus::HAZIR);
        $this->assertSame(OrderStatus::HAZIR, $order->status);

        // hazir -> yolda
        $this->stateMachine->transition($order, OrderStatus::YOLDA);
        $this->assertSame(OrderStatus::YOLDA, $order->status);

        // yolda -> teslim_edildi
        $this->stateMachine->transition($order, OrderStatus::TESLIM_EDILDI);
        $this->assertSame(OrderStatus::TESLIM_EDILDI, $order->status);
    }

    public function testOrderCanBeCancelledBeforePreparation(): void
    {
        $order = new Order(3, 1, 1, null, OrderStatus::ALINDI, 120.0, 40.9850, 29.0280);
        $this->orderRepo->save($order);

        $result = $this->stateMachine->cancel($order);
        $this->assertTrue($result);
        $this->assertSame(OrderStatus::IPTAL, $order->status);
    }

    public function testOrderCannotBeCancelledWhilePreparing(): void
    {
        $order = new Order(4, 1, 1, null, OrderStatus::HAZIRLANIYOR, 180.0, 40.9850, 29.0280);
        $this->orderRepo->save($order);

        $this->expectException(DomainException::class);
        $this->expectExceptionMessage("Sipariş hazırlanmaya başlandıktan sonra iptal edilemez!");

        $this->stateMachine->cancel($order);
    }

    public function testReverseTransitionFromOnWayToPreparingIsRejected(): void
    {
        $order = new Order(5, 1, 1, 1, OrderStatus::YOLDA, 250.0, 40.9850, 29.0280);
        $this->orderRepo->save($order);

        $this->expectException(DomainException::class);
        $this->stateMachine->transition($order, OrderStatus::HAZIRLANIYOR);
    }

    public function testInvalidSkipTransitionThrowsException(): void
    {
        $order = new Order(6, 1, 1, null, OrderStatus::ALINDI, 300.0, 40.9850, 29.0280);
        $this->orderRepo->save($order);

        $this->expectException(DomainException::class);
        // alindi iken doğrudan yolda yapılamaz
        $this->stateMachine->transition($order, OrderStatus::YOLDA);
    }
}
