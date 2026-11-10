<?php
declare(strict_types=1);

namespace App\Service;

use App\Model\User;
use App\Enum\UserRole;
use App\Repository\UserRepositoryInterface;
use InvalidArgumentException;
use RuntimeException;

final class AuthService
{
    public function __construct(
        private UserRepositoryInterface $userRepo
    ) {}

    public function register(string $username, string $plainPassword, string $fullName, string $phone, UserRole $role = UserRole::CUSTOMER): User
    {
        $username = trim($username);
        if (strlen($username) < 3) {
            throw new InvalidArgumentException("Kullanıcı adı en az 3 karakter olmalıdır.");
        }

        if (strlen($plainPassword) < 6) {
            throw new InvalidArgumentException("Parola en az 6 karakter olmalıdır.");
        }

        if ($this->userRepo->findByUsername($username) !== null) {
            throw new InvalidArgumentException("Bu kullanıcı adı zaten kullanımda.");
        }

        $passwordHash = password_hash($plainPassword, PASSWORD_DEFAULT);
        $user = new User(
            id: 0,
            username: $username,
            passwordHash: $passwordHash,
            fullName: trim($fullName),
            phone: trim($phone),
            role: $role
        );

        $id = $this->userRepo->save($user);
        $user->id = $id;

        return $user;
    }

    public function login(string $username, string $plainPassword): ?User
    {
        $user = $this->userRepo->findByUsername(trim($username));
        if ($user === null) {
            return null;
        }

        if (!$user->verifyPassword($plainPassword)) {
            return null;
        }

        return $user;
    }

    /**
     * Aşama 2 Güvenlik Kuralı:
     * "URL’deki veya formdaki bir id değerini değiştirerek başka bir kullanıcının verisine erişilememelidir."
     * IDOR (Insecure Direct Object Reference) ve Sahiplik Kontrolü
     */
    public function assertCanAccessOrder(User $currentUser, int $orderCustomerId, ?int $orderCourierId = null, ?int $orderRestaurantUserId = null): void
    {
        // Admin her veriye erişebilir
        if ($currentUser->role === UserRole::ADMIN) {
            return;
        }

        // Müşteri sadece kendi siparişine erişebilir
        if ($currentUser->role === UserRole::CUSTOMER && $currentUser->id === $orderCustomerId) {
            return;
        }

        // Kurye sadece kendisine atanan siparişe erişebilir
        if ($currentUser->role === UserRole::COURIER && $orderCourierId !== null && $currentUser->id === $orderCourierId) {
            return;
        }

        // Restoran yetkilisi sadece kendi restoranının siparişine erişebilir
        if ($currentUser->role === UserRole::RESTAURANT && $orderRestaurantUserId !== null && $currentUser->id === $orderRestaurantUserId) {
            return;
        }

        throw new RuntimeException("Yetkisiz erişim denemesi engellendi! (Sahiplik ve IDOR güvenlik kontrolü)");
    }
}
