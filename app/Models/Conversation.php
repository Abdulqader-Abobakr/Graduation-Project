<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Conversation extends Model
{
    protected $table = 'sila_p.conversations';

    use HasUuids;

    protected $fillable = [
        'brief_id',
        'client_id',
        'freelancer_id',
        'subject',
        'unread_count',
        'client_read_at',
        'freelancer_read_at',
    ];

    protected $casts = [
        'unread_count' => 'integer',
        'client_read_at' => 'datetime',
        'freelancer_read_at' => 'datetime',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'client_id', 'id');
    }

    public function freelancer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'freelancer_id', 'id');
    }

    public function brief(): BelongsTo
    {
        return $this->belongsTo(Brief::class, 'brief_id', 'id');
    }

    public function latestMessage(): HasOne
    {
        return $this->hasOne(Message::class, 'conversation_id', 'id')->latestOfMany('created_at');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class, 'conversation_id', 'id')->oldest();
    }
}
