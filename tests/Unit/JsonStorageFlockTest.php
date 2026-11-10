<?php
declare(strict_types=1);

namespace App\Tests\Unit;

use PHPUnit\Framework\TestCase;
use App\Storage\JsonStorageHelper;
use RuntimeException;

/**
 * Gereksinim Eşleştirmesi:
 * - Aşama 2 Kuralı: JSON ile veri saklama, flock(LOCK_EX) ve atomik temp dosya değişimi
 * - Sınır Durumu: Bozuk JSON ayrıştırma hatası yönetimi
 */
final class JsonStorageFlockTest extends TestCase
{
    private string $testFile;

    protected function setUp(): void
    {
        $this->testFile = sys_get_temp_dir() . '/gustogo_test_' . uniqid() . '.json';
    }

    protected function tearDown(): void
    {
        if (file_exists($this->testFile)) {
            @unlink($this->testFile);
        }
    }

    public function testAtomicWriteAndReadWithFlock(): void
    {
        $sampleData = [
            ['id' => 1, 'name' => 'Pizza', 'price' => 250.0],
            ['id' => 2, 'name' => 'Burger', 'price' => 240.0]
        ];

        $written = JsonStorageHelper::write($this->testFile, $sampleData);
        $this->assertTrue($written);
        $this->assertFileExists($this->testFile);

        $readData = JsonStorageHelper::read($this->testFile);
        $this->assertCount(2, $readData);
        $this->assertSame('Pizza', $readData[0]['name']);
        $this->assertSame(240.0, $readData[1]['price']);
    }

    public function testCorruptedJsonThrowsRuntimeException(): void
    {
        file_put_contents($this->testFile, "{ bozuk_json_formati: eksik_parantez ");

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage("JSON ayrıştırma hatası");

        JsonStorageHelper::read($this->testFile);
    }
}
