<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClientCompany extends Model
{
    protected $table = 'sila_p.client_companies';

    use HasUuids;

    protected $fillable = [
        'user_id',
        'business_name',
        'industry',
        'commercial_register_path',
        'company_description',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }
}
