<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Brief extends Model
{
    protected $table = 'sila_p.briefs';

    use HasUuids;

    protected $fillable = [
        'client_id',
        'targeted_freelancer_id',
        'title',
        'description',
        'category',
        'provider_type',
        'status',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'client_id', 'id');
    }

    public function proposals(): HasMany
    {
        return $this->hasMany(Proposal::class, 'brief_id', 'id');
    }

    public function conversations(): HasMany
    {
        return $this->hasMany(Conversation::class, 'brief_id', 'id');
    }

    public function targetedFreelancer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'targeted_freelancer_id', 'id');
    }
}
