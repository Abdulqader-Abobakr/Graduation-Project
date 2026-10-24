<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Wallet extends Model
{
    protected $table = 'sila_p.wallets';

    use HasUuids;

    protected $fillable = [
        'user_id',
        'available_balance',
        'pending_balance',
    ];

    protected $casts = [
        'available_balance' => 'decimal:2',
        'pending_balance'   => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }
}
