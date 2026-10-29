<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Dispute extends Model
{
    use HasUuids;

    protected $table = 'sila_p.disputes';

    protected $fillable = [
        'project_id',
        'initiated_by_user_id',
        'against_user_id',
        'reason',
        'details',
        'status',
        'resolution_decision',
        'freelancer_payout_amount',
        'client_refund_amount',
        'admin_notes',
        'resolved_by_admin_id',
        'resolved_at',
    ];

    protected $casts = [
        'freelancer_payout_amount' => 'decimal:2',
        'client_refund_amount'     => 'decimal:2',
        'resolved_at'              => 'datetime',
        'created_at'               => 'datetime',
        'updated_at'               => 'datetime',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class, 'project_id', 'id');
    }

    public function initiatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'initiated_by_user_id', 'id');
    }

    public function againstUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'against_user_id', 'id');
    }

    public function resolvedByAdmin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by_admin_id', 'id');
    }

    /**
     * Human-friendly Arabic status label.
     */
    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            'open'         => 'مفتوح وقيد الانتظار',
            'under_review' => 'قيد التحكيم والفحص الإداري',
            'resolved'     => 'تم الفصل في النزاع',
            'dismissed'    => 'ملغي',
            default        => $this->status ?? 'غير محدد',
        };
    }

    /**
     * Human-friendly Arabic resolution decision label.
     */
    public function getResolutionDecisionLabelAttribute(): ?string
    {
        return match ($this->resolution_decision) {
            'refund_client'      => 'استرداد لصالح رائد الأعمال',
            'release_freelancer' => 'تحرير المبلغ لصالح الخبير',
            'partial_split'      => 'تسوية مالية جزئية بين الطرفين',
            default              => null,
        };
    }
}

