<?php
declare(strict_types=1);

namespace App\Repository;

use App\Model\User;

interface UserRepositoryInterface
{
    public function findById(int $id): ?User;
    public function findByUsername(string $username): ?User;
    public function save(User $user): int;
    public function findAll(): array;
    public function delete(int $id): bool;
}
