<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Portfolio extends Model
{
    protected $table = 'sila_p.portfolios';

    use HasUuids;

    protected $fillable = [
        'freelancer_id',
        'title',
        'marketing_domain',
        'images',
    ];

    protected $casts = [
        'images' => 'array',
    ];

    public function freelancer(): BelongsTo
    {
        return $this->belongsTo(Freelancer::class, 'freelancer_id', 'id');
    }
}
