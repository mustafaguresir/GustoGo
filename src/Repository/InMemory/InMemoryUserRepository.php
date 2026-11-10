<?php
declare(strict_types=1);

namespace App\Repository\InMemory;

use App\Model\User;
use App\Repository\UserRepositoryInterface;

final class InMemoryUserRepository implements UserRepositoryInterface
{
    /** @var array<int, User> */
    public array $users = [];
    private int $autoIncrementId = 1;

    public function findById(int $id): ?User
    {
        return $this->users[$id] ?? null;
    }

    public function findByUsername(string $username): ?User
    {
        foreach ($this->users as $user) {
            if (strcasecmp($user->username, $username) === 0) {
                return $user;
            }
        }
        return null;
    }

    public function save(User $user): int
    {
        if ($user->id <= 0) {
            $user->id = $this->autoIncrementId++;
        }
        $this->users[$user->id] = $user;
        return $user->id;
    }

    public function findAll(): array
    {
        return array_values($this->users);
    }

    public function delete(int $id): bool
    {
        if (isset($this->users[$id])) {
            unset($this->users[$id]);
            return true;
        }
        return false;
    }
}
