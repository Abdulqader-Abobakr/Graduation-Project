<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Authenticatable
{
    protected $table = 'sila_p.users';

    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, HasUuids;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_name',
        'email',
        'alternative_email',
        'email_notifications',
        'password',
        'phone_number',
        'city',
        'id_document_path',
        'avatar_path',
        'role',
        'account_state',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

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
            'email_notifications' => 'boolean',
        ];
    }

    public function getAvatarPathAttribute(?string $value): ?string
    {
        if (! $value) {
            return null;
        }

        return str_replace(
            '/storage/v1/s3/../object/public/avatars/',
            '/storage/v1/object/public/avatars/',
            $value
        );
    }

    public function freelancer(): HasOne
    {
        return $this->hasOne(Freelancer::class, 'user_id', 'id');
    }

    public function wallet(): HasOne
    {
        return $this->hasOne(Wallet::class, 'user_id', 'id');
    }

    public function clientCompany(): HasOne
    {
        return $this->hasOne(ClientCompany::class, 'user_id', 'id');
    }

    public function proposals(): HasMany
    {
        return $this->hasMany(Proposal::class, 'freelancer_id', 'id');
    }

    public function freelancerProjects(): HasMany
    {
        return $this->hasMany(Project::class, 'freelancer_id', 'id');
    }

    public function clientProjects(): HasMany
    {
        return $this->hasMany(Project::class, 'client_id', 'id');
    }

    /**
     * Get the freelancer's rating statistics.
     *
     * @return array{rating_average: float|null, ratings_count: int}
     */
    public function getFreelancerRatingStats(): array
    {
        $stats = Project::where('freelancer_id', $this->id)
            ->where('status', 'completed')
            ->whereNotNull('rating')
            ->selectRaw('COUNT(rating) as count, ROUND(AVG(rating), 1) as avg')
            ->first();

        $count = (int) ($stats->count ?? 0);
        $avg = $count > 0 ? (float) $stats->avg : null;

        return [
            'rating_average' => $avg,
            'ratings_count'  => $count,
        ];
    }
}
