<?php
declare(strict_types=1);

namespace App\Storage;

use RuntimeException;

/**
 * Aşama 2 Şartname Kuralı:
 * "Eşzamanlı yazma ihtimali bulunan dosyalarda dosya kilidi (flock) kullanın.
 *  Veriyi doğrudan asıl dosyaya yazmak yerine geçici dosyaya yazıp ardından
 *  dosyayı güvenli biçimde (atomic rename) değiştirin."
 */
final class JsonStorageHelper
{
    public static function read(string $filePath): array
    {
        if (!file_exists($filePath)) {
            return [];
        }

        $fp = fopen($filePath, 'rb');
        if ($fp === false) {
            throw new RuntimeException("Dosya okumak için açılamadı: {$filePath}");
        }

        // Paylaşımlı kilit (Shared Lock - LOCK_SH)
        flock($fp, LOCK_SH);
        $contents = stream_get_contents($fp);
        flock($fp, LOCK_UN);
        fclose($fp);

        if ($contents === false || trim($contents) === '') {
            return [];
        }

        $decoded = json_decode($contents, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new RuntimeException("JSON ayrıştırma hatası ({$filePath}): " . json_last_error_msg());
        }

        return is_array($decoded) ? $decoded : [];
    }

    public static function write(string $filePath, array $data): bool
    {
        $dir = dirname($filePath);
        if (!is_dir($dir) && !mkdir($dir, 0777, true) && !is_dir($dir)) {
            throw new RuntimeException("Hedef klasör oluşturulamadı: {$dir}");
        }

        $jsonString = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);

        // 1. Geçici dosyaya yaz (Atomic write preparation)
        $tempFilePath = $filePath . '.tmp.' . bin2hex(random_bytes(6));
        $fp = fopen($tempFilePath, 'wb');
        if ($fp === false) {
            throw new RuntimeException("Geçici dosya oluşturulamadı: {$tempFilePath}");
        }

        // 2. Özel kilit al (Exclusive Lock - LOCK_EX)
        if (!flock($fp, LOCK_EX)) {
            fclose($fp);
            @unlink($tempFilePath);
            throw new RuntimeException("Dosya kilidi (flock LOCK_EX) alınamadı: {$tempFilePath}");
        }

        fwrite($fp, $jsonString);
        fflush($fp);
        flock($fp, LOCK_UN);
        fclose($fp);

        // 3. Atomik yeniden adlandırma (Atomic Rename)
        // Windows ve Unix üzerinde dosya bütünlüğünü korur
        if (DIRECTORY_SEPARATOR === '\\' && file_exists($filePath)) {
            @unlink($filePath);
        }

        if (!rename($tempFilePath, $filePath)) {
            @unlink($tempFilePath);
            throw new RuntimeException("Atomik dosya değiştirme (rename) başarısız oldu: {$filePath}");
        }

        return true;
    }
}
