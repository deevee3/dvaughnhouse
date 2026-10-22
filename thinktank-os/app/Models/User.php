<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'password', 'role'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasUuids, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Check if user is an institutional Orchestrator.
     */
    public function isOrchestrator(): bool
    {
        return in_array($this->role, ['orchestrator', 'admin'], true);
    }

    /**
     * Check if user can edit/review manuscripts in the Portfolio Matrix.
     */
    public function canPolishManuscripts(): bool
    {
        return in_array($this->role, ['orchestrator', 'admin', 'editor'], true);
    }

    /**
     * Manuscripts submitted by this scholar/user.
     */
    public function manuscripts(): HasMany
    {
        return $this->hasMany(Manuscript::class);
    }

    /**
     * Attestations this user has issued as a verifier.
     */
    public function attestations(): HasMany
    {
        return $this->hasMany(Attestation::class, 'verifier_id');
    }

    /**
     * Check if user can issue or revoke Glenride attestations.
     */
    public function canIssueAttestations(): bool
    {
        return $this->canPolishManuscripts();
    }
}
