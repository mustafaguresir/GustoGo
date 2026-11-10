<?php
declare(strict_types=1);

namespace App\Repository\Json;

use App\Model\Restaurant;
use App\Model\MenuItem;
use App\Repository\RestaurantRepositoryInterface;
use App\Storage\JsonStorageHelper;

final class JsonRestaurantRepository implements RestaurantRepositoryInterface
{
    private string $restaurantsFile;
    private string $menuItemsFile;

    public function __construct(?string $restaurantsFile = null, ?string $menuItemsFile = null)
    {
        $base = dirname(__DIR__, 3) . '/storage/';
        $this->restaurantsFile = $restaurantsFile ?? $base . 'restaurants.json';
        $this->menuItemsFile = $menuItemsFile ?? $base . 'menu_items.json';
    }

    public function findAll(): array
    {
        $records = JsonStorageHelper::read($this->restaurantsFile);
        return array_map(fn(array $row) => Restaurant::fromArray($row), $records);
    }

    public function findById(int $id): ?Restaurant
    {
        $records = JsonStorageHelper::read($this->restaurantsFile);
        foreach ($records as $row) {
            if ((int)$row['id'] === $id) {
                return Restaurant::fromArray($row);
            }
        }
        return null;
    }

    public function findByUserId(int $userId): ?Restaurant
    {
        $records = JsonStorageHelper::read($this->restaurantsFile);
        foreach ($records as $row) {
            if ((int)($row['user_id'] ?? 0) === $userId) {
                return Restaurant::fromArray($row);
            }
        }
        return null;
    }

    public function save(Restaurant $restaurant): int
    {
        $records = JsonStorageHelper::read($this->restaurantsFile);
        $maxId = 0;
        $foundIndex = -1;

        foreach ($records as $index => $row) {
            $id = (int)$row['id'];
            if ($id > $maxId) {
                $maxId = $id;
            }
            if ($restaurant->id > 0 && $id === $restaurant->id) {
                $foundIndex = $index;
            }
        }

        if ($restaurant->id <= 0) {
            $restaurant->id = $maxId + 1;
        }

        $data = $restaurant->toArray();
        if ($foundIndex >= 0) {
            $records[$foundIndex] = $data;
        } else {
            $records[] = $data;
        }

        JsonStorageHelper::write($this->restaurantsFile, $records);
        return $restaurant->id;
    }

    public function getMenuItems(int $restaurantId): array
    {
        $records = JsonStorageHelper::read($this->menuItemsFile);
        $items = [];
        foreach ($records as $row) {
            if ((int)$row['restaurant_id'] === $restaurantId) {
                $items[] = MenuItem::fromArray($row);
            }
        }
        return $items;
    }

    public function findMenuItemById(int $id): ?MenuItem
    {
        $records = JsonStorageHelper::read($this->menuItemsFile);
        foreach ($records as $row) {
            if ((int)$row['id'] === $id) {
                return MenuItem::fromArray($row);
            }
        }
        return null;
    }

    public function saveMenuItem(MenuItem $item): int
    {
        $records = JsonStorageHelper::read($this->menuItemsFile);
        $maxId = 0;
        $foundIndex = -1;

        foreach ($records as $index => $row) {
            $id = (int)$row['id'];
            if ($id > $maxId) {
                $maxId = $id;
            }
            if ($item->id > 0 && $id === $item->id) {
                $foundIndex = $index;
            }
        }

        if ($item->id <= 0) {
            $item->id = $maxId + 1;
        }

        $data = $item->toArray();
        if ($foundIndex >= 0) {
            $records[$foundIndex] = $data;
        } else {
            $records[] = $data;
        }

        JsonStorageHelper::write($this->menuItemsFile, $records);
        return $item->id;
    }
}
