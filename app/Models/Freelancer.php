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
}
