<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WithdrawalRequest extends Model
{
    protected $table = 'sila_p.withdrawal_requests';

    use HasUuids;

    protected $fillable = [
        'freelancer_id',
        'amount',
        'method',
        'details',
        'status',
    ];

    protected $casts = [
        'details' => 'array',
        'amount'  => 'decimal:2',
    ];

    public function freelancer(): BelongsTo
    {
        return $this->belongsTo(Freelancer::class, 'freelancer_id', 'id');
    }
}
