<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Freelancer extends Model
{
    protected $table = 'sila_p.freelancers';

    use HasUuids;

    protected $fillable = [
        'user_id',
        'job_title',
        'bio',
        'experienced_sectors',
        'marketing_specialties',
    ];

    protected $casts = [
        'experienced_sectors' => 'array',
        'marketing_specialties' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    public function portfolios(): HasMany
    {
        return $this->hasMany(Portfolio::class, 'freelancer_id', 'id');
    }

    /**
     * Proposals submitted by this freelancer.
     * Note: proposals.freelancer_id → users.id (UUID), so we query via the user relationship.
     */
    public function proposals(): HasMany
    {
        return $this->hasMany(Proposal::class, 'freelancer_id', 'user_id');
    }

    /**
     * Withdrawal requests made by this freelancer.
     * withdrawal_requests.freelancer_id → freelancers.id (UUID).
     */
    public function withdrawalRequests(): HasMany
    {
        return $this->hasMany(WithdrawalRequest::class, 'freelancer_id', 'id');
    }

    /**
     * Projects assigned to this freelancer.
     */
    public function projects(): HasMany
    {
        return $this->hasMany(Project::class, 'freelancer_id', 'user_id');
    }

    /**
     * Get the rating statistics for this freelancer.
     *
     * @return array{rating_average: float|null, ratings_count: int}
     */
    public function getRatingStats(): array
    {
        $stats = Project::where('freelancer_id', $this->user_id)
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
