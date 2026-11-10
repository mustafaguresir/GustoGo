<?php
/**
 * GustoGo — Aşama 2 Front Controller (Tek Giriş Noktası)
 *
 * Şartname Gereksinimleri:
 * - Tarayıcıdan erişilen PHP dosyaları tek bir giriş noktasından yönlendirilmelidir.
 * - Router, Controller, Service, Repository ve View sorumlulukları ayrılmalıdır.
 * - Form hatalarında anlaşılır mesajlar ve eski değerlerin korunması (old input).
 * - POST-Redirect-GET (PRG) akışı ve flash mesajlar.
 * - XSS önleme: htmlspecialchars ile kaçışlama.
 */

declare(strict_types=1);

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// PSR-4 Autoloader
spl_autoload_register(function ($class) {
    $prefix = 'App\\';
    $base_dir = __DIR__ . '/../src/';
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }
    $relative_class = substr($class, $len);
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';
    if (file_exists($file)) {
        require_once $file;
    }
});

use App\Enum\UserRole;
use App\Service\AuthService;
use App\Repository\Json\JsonUserRepository;
use App\Repository\Json\JsonOrderRepository;
use App\Repository\Json\JsonRestaurantRepository;

// Flash Mesaj ve PRG Yardımcıları
function setFlash(string $type, string $message): void {
    $_SESSION['flash'] = ['type' => $type, 'message' => $message];
}

function getFlash(): ?array {
    if (isset($_SESSION['flash'])) {
        $flash = $_SESSION['flash'];
        unset($_SESSION['flash']);
        return $flash;
    }
    return null;
}

function setOldInput(array $data): void {
    $_SESSION['old_input'] = $data;
}

function getOldInput(string $key, string $default = ''): string {
    return htmlspecialchars((string)($_SESSION['old_input'][$key] ?? $default), ENT_QUOTES, 'UTF-8');
}

function clearOldInput(): void {
    unset($_SESSION['old_input']);
}

// URI ve Metot Ayrıştırma
$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// JSON Repository ve Servisler
$userRepo = new JsonUserRepository();
$authService = new AuthService($userRepo);
$orderRepo = new JsonOrderRepository();
$restaurantRepo = new JsonRestaurantRepository();

// --- ROUTER & PRG AKIŞI ---

// 1. GİRİŞ SAYFASI (GET /login)
if ($uri === '/login' && $method === 'GET') {
    $flash = getFlash();
    $oldUsername = getOldInput('username');
    clearOldInput();
    ?>
    <!DOCTYPE html>
    <html lang="tr">
    <head>
        <meta charset="UTF-8">
        <title>GustoGo — Giriş Yap (Aşama 2 Prototip)</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <style>
            body { background: #0F172A; color: #F8FAFC; min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: sans-serif; }
            .card { background: #1E293B; border: 1px solid #334155; border-radius: 16px; color: #F8FAFC; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
            .btn-primary { background: #FA4A0C; border-color: #FA4A0C; }
            .btn-primary:hover { background: #E03E00; border-color: #E03E00; }
        </style>
    </head>
    <body>
        <div class="container" style="max-width: 440px;">
            <div class="card p-4">
                <div class="text-center mb-4">
                    <h3 class="fw-bold" style="color:#FA4A0C;">GustoGo</h3>
                    <p class="text-secondary small">Aşama 2: Veritabanısız Giriş Paneli</p>
                </div>
                <?php if ($flash): ?>
                    <div class="alert alert-<?= htmlspecialchars($flash['type']) ?> py-2 small"><?= htmlspecialchars($flash['message']) ?></div>
                <?php endif; ?>
                <form action="/login" method="POST">
                    <div class="mb-3">
                        <label class="form-label small">Kullanıcı Adı</label>
                        <input type="text" name="username" class="form-control bg-dark text-white border-secondary" value="<?= $oldUsername ?>" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label small">Parola</label>
                        <input type="password" name="password" class="form-control bg-dark text-white border-secondary" required>
                    </div>
                    <button type="submit" class="btn btn-primary w-100 py-2 fw-bold">Giriş Yap (PRG Flow)</button>
                </form>
                <div class="mt-3 text-center small text-secondary">
                    Hesabınız yok mu? <a href="/register" class="text-warning">Kayıt Ol</a> | <a href="/" class="text-info">Canlı Web Paneline Dön</a>
                </div>
                <div class="mt-3 p-2 bg-dark rounded small text-secondary">
                    <strong>Demo Kullanıcılar:</strong><br>
                    • Müşteri: <code>ahmet_musteri</code> / <code>hash123</code><br>
                    • Restoran: <code>restoran_lezzet</code> / <code>hash123</code><br>
                    • Kurye: <code>kurye_ali</code> / <code>hash123</code><br>
                    • Yönetici: <code>admin_mustafa</code> / <code>hash123</code>
                </div>
            </div>
        </div>
    </body>
    </html>
    <?php
    exit;
}

// 2. GİRİŞ İŞLEMİ (POST /login -> PRG POST-Redirect-GET)
if ($uri === '/login' && $method === 'POST') {
    $username = trim((string)($_POST['username'] ?? ''));
    $password = (string)($_POST['password'] ?? '');

    $user = $authService->login($username, $password);
    if ($user === null) {
        setOldInput(['username' => $username]);
        setFlash('danger', 'Hatalı kullanıcı adı veya parola!');
        header('Location: /login', true, 303); // 303 See Other (PRG)
        exit;
    }

    $_SESSION['user_id'] = $user->id;
    $_SESSION['username'] = $user->username;
    $_SESSION['role'] = $user->role->value;
    $_SESSION['full_name'] = $user->fullName;

    setFlash('success', "Hoş geldiniz, {$user->fullName}! Başarıyla giriş yaptınız.");
    header('Location: /', true, 303);
    exit;
}

// 3. KAYIT SAYFASI (GET /register)
if ($uri === '/register' && $method === 'GET') {
    $flash = getFlash();
    $old = [
        'username' => getOldInput('username'),
        'full_name' => getOldInput('full_name'),
        'phone' => getOldInput('phone')
    ];
    clearOldInput();
    ?>
    <!DOCTYPE html>
    <html lang="tr">
    <head>
        <meta charset="UTF-8">
        <title>GustoGo — Kayıt Ol (Aşama 2 Prototip)</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <style>
            body { background: #0F172A; color: #F8FAFC; min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: sans-serif; }
            .card { background: #1E293B; border: 1px solid #334155; border-radius: 16px; color: #F8FAFC; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
            .btn-primary { background: #FA4A0C; border-color: #FA4A0C; }
            .btn-primary:hover { background: #E03E00; border-color: #E03E00; }
        </style>
    </head>
    <body>
        <div class="container" style="max-width: 460px;">
            <div class="card p-4">
                <div class="text-center mb-4">
                    <h3 class="fw-bold" style="color:#FA4A0C;">GustoGo Kayıt</h3>
                    <p class="text-secondary small">JSON Depolama ve password_hash ile Güvenli Kayıt</p>
                </div>
                <?php if ($flash): ?>
                    <div class="alert alert-<?= htmlspecialchars($flash['type']) ?> py-2 small"><?= htmlspecialchars($flash['message']) ?></div>
                <?php endif; ?>
                <form action="/register" method="POST">
                    <div class="mb-3">
                        <label class="form-label small">Ad Soyad</label>
                        <input type="text" name="full_name" class="form-control bg-dark text-white border-secondary" value="<?= $old['full_name'] ?>" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label small">Kullanıcı Adı</label>
                        <input type="text" name="username" class="form-control bg-dark text-white border-secondary" value="<?= $old['username'] ?>" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label small">Telefon</label>
                        <input type="text" name="phone" class="form-control bg-dark text-white border-secondary" value="<?= $old['phone'] ?>" placeholder="0555...">
                    </div>
                    <div class="mb-3">
                        <label class="form-label small">Parola (En az 6 karakter)</label>
                        <input type="password" name="password" class="form-control bg-dark text-white border-secondary" required>
                    </div>
                    <button type="submit" class="btn btn-primary w-100 py-2 fw-bold">Kayıt Ol (POST-Redirect-GET)</button>
                </form>
                <div class="mt-3 text-center small text-secondary">
                    Zaten hesabınız var mı? <a href="/login" class="text-warning">Giriş Yap</a>
                </div>
            </div>
        </div>
    </body>
    </html>
    <?php
    exit;
}

// 4. KAYIT İŞLEMİ (POST /register -> PRG)
if ($uri === '/register' && $method === 'POST') {
    $username = trim((string)($_POST['username'] ?? ''));
    $password = (string)($_POST['password'] ?? '');
    $fullName = trim((string)($_POST['full_name'] ?? ''));
    $phone = trim((string)($_POST['phone'] ?? ''));

    try {
        $authService->register($username, $password, $fullName, $phone, UserRole::CUSTOMER);
        setFlash('success', 'Hesabınız başarıyla oluşturuldu! Şimdi giriş yapabilirsiniz.');
        header('Location: /login', true, 303);
        exit;
    } catch (\InvalidArgumentException $e) {
        setOldInput([
            'username' => $username,
            'full_name' => $fullName,
            'phone' => $phone
        ]);
        setFlash('danger', $e->getMessage());
        header('Location: /register', true, 303);
        exit;
    }
}

// 5. ÇIKIŞ YAP (GET /logout)
if ($uri === '/logout') {
    session_unset();
    session_destroy();
    setFlash('info', 'Başarıyla çıkış yaptınız.');
    header('Location: /login', true, 303);
    exit;
}

// 6. ANA SAYFA VE DİĞER İSTEKLER:
// Web uygulamasının SPA / dashboard görünümünü sunar
require_once __DIR__ . '/index.html';
