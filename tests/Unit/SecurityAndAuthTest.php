<?php
declare(strict_types=1);

namespace App\Tests\Unit;

use PHPUnit\Framework\TestCase;
use App\Model\User;
use App\Enum\UserRole;
use App\Service\AuthService;
use App\Repository\InMemory\InMemoryUserRepository;
use InvalidArgumentException;
use RuntimeException;

/**
 * Gereksinim Eşleştirmesi:
 * - FR-13: Kullanıcı kaydı, girişi ve password_hash
 * - NFR-02 / Aşama 2 Güvenlik: IDOR (Insecure Direct Object Reference) ve Sahiplik kontrolü
 * - Sınır Durumları: Kısa kullanıcı adı / geçersiz parola
 */
final class SecurityAndAuthTest extends TestCase
{
    private AuthService $authService;
    private InMemoryUserRepository $userRepo;

    protected function setUp(): void
    {
        $this->userRepo = new InMemoryUserRepository();
        $this->authService = new AuthService($this->userRepo);
    }

    public function testUserPasswordHashingAndVerification(): void
    {
        $user = $this->authService->register('test_user', 'guvenliSifre123', 'Test Kullanıcı', '05559998877', UserRole::CUSTOMER);

        $this->assertNotEmpty($user->passwordHash);
        $this->assertNotSame('guvenliSifre123', $user->passwordHash);
        $this->assertTrue(password_verify('guvenliSifre123', $user->passwordHash));

        // Başarılı giriş
        $loggedIn = $this->authService->login('test_user', 'guvenliSifre123');
        $this->assertNotNull($loggedIn);
        $this->assertSame('test_user', $loggedIn->username);

        // Hatalı parola ile giriş
        $failed = $this->authService->login('test_user', 'yanlisSifre');
        $this->assertNull($failed);
    }

    public function testShortPasswordOrUsernameThrowsException(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->authService->register('ab', '12345', 'Kısa Giriş', '05551112233');
    }

    public function testIdorProtectionPreventsUnauthorizedOrderAccess(): void
    {
        $customerA = new User(1, 'musteri_a', 'hash', 'Müşteri A', '0555', UserRole::CUSTOMER);
        $customerBOrderId = 2; // Bu sipariş Müşteri B'ye ait (customerId = 2)

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage("Yetkisiz erişim denemesi engellendi! (Sahiplik ve IDOR güvenlik kontrolü)");

        // Müşteri A, müşteri B'nin siparişine erişmeye çalışıyor
        $this->authService->assertCanAccessOrder($customerA, $customerBOrderId);
    }

    public function testAdminRoleCanAccessAnyOrder(): void
    {
        $admin = new User(99, 'admin_user', 'hash', 'Sistem Yöneticisi', '0555', UserRole::ADMIN);

        // İstisna fırlatılmamalıdır
        $this->authService->assertCanAccessOrder($admin, 5, 3, 2);
        $this->assertTrue(true);
    }
}
