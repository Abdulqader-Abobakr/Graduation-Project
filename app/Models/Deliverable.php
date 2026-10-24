<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Deliverable extends Model
{
    protected $table = 'sila_p.deliverables';

    use HasUuids;

    protected $fillable = [
        'project_id',
        'title',
        'file_path',
        'external_link',
        'notes',
        'remaining_revisions',
        'status',
        'client_feedback',
    ];

    protected $casts = [
        'remaining_revisions' => 'integer',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class, 'project_id', 'id');
    }
}
