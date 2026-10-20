<?php
namespace App\Controller;

use App\Model\Order;
use App\Enum\OrderStatus;
use App\Service\OrderStateMachineService;
use App\Service\CourierAssignmentService;
use App\Repository\OrderRepositoryInterface;
use App\Repository\CourierRepositoryInterface;
use App\Repository\RestaurantRepositoryInterface;
use DomainException;
use RuntimeException;

final class OrderController
{
    public function __construct(
        private OrderStateMachineService $stateMachine,
        private CourierAssignmentService $assignmentService,
        private OrderRepositoryInterface $orderRepo,
        private ?CourierRepositoryInterface $courierRepo = null,
        private ?RestaurantRepositoryInterface $restaurantRepo = null
    ) {}

    public function createOrder(int $customerId, int $restaurantId, float $totalAmount, int $delX, int $delY, array $items = []): array
    {
        $order = new Order(
            id: 0,
            customerId: $customerId,
            restaurantId: $restaurantId,
            courierId: null,
            status: OrderStatus::ALINDI,
            totalAmount: $totalAmount,
            deliveryX: $delX,
            deliveryY: $delY
        );

        // PDO Transaction ile sipariş ve sipariş kalemleri atomik kaydedilir
        $orderId = $this->orderRepo->saveWithTransaction($order, $items);
        $order->id = $orderId;

        // Kurye Atama (Haversine & İş Yükü Algoritması)
        if ($this->courierRepo && $this->restaurantRepo) {
            $restaurant = $this->restaurantRepo->findById($restaurantId);
            $available = $this->courierRepo->findAvailable();

            if ($restaurant && !empty($available)) {
                $courier = $this->assignmentService->assignBestCourier($order, $restaurant, $available);
                $this->orderRepo->assignCourier($orderId, $courier->id);
                $this->courierRepo->incrementActiveOrders($courier->id);
                $order->courierId = $courier->id;
            }
        }

        return [
            'status' => 'success',
            'order_id' => $orderId,
            'current_status' => $order->status->value
        ];
    }

    /**
     * Rol Bazlı Yetkilendirme (RBAC) ile Durum Değiştirme
     * Müşteri: Sadece iptal edebilir (hazırlanmadan önce)
     * Restoran: 'hazirlaniyor' ve 'hazir' durumuna geçirebilir
     * Kurye: 'yolda' ve 'teslim_edildi' durumuna geçirebilir
     */
    public function changeStatus(int $orderId, string $targetStatusStr, string $actorRole = 'restaurant'): array
    {
        $order = $this->orderRepo->findById($orderId);
        if (!$order) {
            return ['status' => 'error', 'message' => 'Sipariş bulunamadı!'];
        }

        $targetStatus = OrderStatus::tryFrom($targetStatusStr);
        if (!$targetStatus) {
            return ['status' => 'error', 'message' => 'Geçersiz hedef durum!'];
        }

        // Rol Bazlı Yetki Kontrolü
        if ($actorRole === 'customer') {
            return ['status' => 'error', 'message' => 'Müşteri sipariş durumunu ilerletemez! Sadece hazırlık öncesi iptal edebilir.'];
        }

        if ($actorRole === 'restaurant' && !in_array($targetStatus, [OrderStatus::HAZIRLANIYOR, OrderStatus::HAZIR])) {
            return ['status' => 'error', 'message' => 'Restoran yetkilisi sadece "hazırlanıyor" veya "hazır" durumuna geçirebilir.'];
        }

        if ($actorRole === 'courier' && !in_array($targetStatus, [OrderStatus::YOLDA, OrderStatus::TESLIM_EDILDI])) {
            return ['status' => 'error', 'message' => 'Kurye sadece "yolda" veya "teslim edildi" durumuna geçirebilir.'];
        }

        try {
            $this->stateMachine->transition($order, $targetStatus);

            // Teslim edildiğinde kurye iş yükünü azalt
            if ($targetStatus === OrderStatus::TESLIM_EDILDI && $order->courierId && $this->courierRepo) {
                $this->courierRepo->decrementActiveOrders($order->courierId);
            }

            return [
                'status' => 'success',
                'order_id' => $orderId,
                'new_status' => $targetStatus->value
            ];
        } catch (DomainException $e) {
            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }

    public function cancelOrder(int $orderId, string $actorRole = 'customer'): array
    {
        $order = $this->orderRepo->findById($orderId);
        if (!$order) {
            return ['status' => 'error', 'message' => 'Sipariş bulunamadı!'];
        }

        try {
            $this->stateMachine->cancel($order);
            return [
                'status' => 'success',
                'order_id' => $orderId,
                'message' => 'Sipariş başarıyla iptal edildi.'
            ];
        } catch (DomainException $e) {
            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }

    public function getOrderDetails(int $orderId): array
    {
        $details = $this->orderRepo->getOrderWithDetails($orderId);
        if (!$details) {
            return ['status' => 'error', 'message' => 'Sipariş detayları bulunamadı!'];
        }
        return ['status' => 'success', 'data' => $details];
    }
}
