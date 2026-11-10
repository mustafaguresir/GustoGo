<?php
declare(strict_types=1);

namespace App\Model;

use App\Enum\UserRole;

final class User
{
    public function __construct(
        public int $id,
        public string $username,
        public string $passwordHash,
        public string $fullName,
        public string $phone,
        public UserRole $role,
        public ?string $createdAt = null
    ) {
        $this->createdAt = $createdAt ?? date('Y-m-d H:i:s');
    }

    public function verifyPassword(string $plainPassword): bool
    {
        return password_verify($plainPassword, $this->passwordHash);
    }

    public static function hashPassword(string $plainPassword): string
    {
        return password_hash($plainPassword, PASSWORD_DEFAULT);
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'username' => $this->username,
            'password_hash' => $this->passwordHash,
            'full_name' => $this->fullName,
            'phone' => $this->phone,
            'role' => $this->role->value,
            'created_at' => $this->createdAt,
        ];
    }

    public static function fromArray(array $data): self
    {
        return new self(
            id: (int)$data['id'],
            username: (string)$data['username'],
            passwordHash: (string)$data['password_hash'],
            fullName: (string)$data['full_name'],
            phone: (string)($data['phone'] ?? ''),
            role: UserRole::from((string)$data['role']),
            createdAt: $data['created_at'] ?? null
        );
    }
}
