<?php
namespace App\Enum;

enum OrderStatus: string
{
    case ALINDI = 'alindi';
    case HAZIRLANIYOR = 'hazirlaniyor';
    case HAZIR = 'hazir';
    case YOLDA = 'yolda';
    case TESLIM_EDILDI = 'teslim_edildi';
    case IPTAL = 'iptal';

    public function label(): string
    {
        return match($this) {
            self::ALINDI => 'Sipariş Alındı',
            self::HAZIRLANIYOR => 'Hazırlanıyor',
            self::HAZIR => 'Hazır (Kurye Bekleniyor)',
            self::YOLDA => 'Kurye Yolda',
            self::TESLIM_EDILDI => 'Teslim Edildi',
            self::IPTAL => 'İptal Edildi',
        };
    }
}
