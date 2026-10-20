<?php
namespace App\Enum;

enum UserRole: string
{
    case CUSTOMER = 'customer';
    case RESTAURANT = 'restaurant';
    case COURIER = 'courier';
    case ADMIN = 'admin';
}
