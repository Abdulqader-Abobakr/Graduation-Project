<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Proposal extends Model
{
    protected $table = 'sila_p.proposals';

    use HasUuids;

    protected $fillable = [
        'brief_id',
        'project_id',
        'freelancer_id',
        'title',
        'price',
        'revision_limit',
        'timeline',
        'validity',
        'additional_terms',
        'status',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'revision_limit' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relationship to Freelancer
     */
    public function freelancer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'freelancer_id');
    }

    /**
     * Relationship to Project
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class, 'project_id', 'id');
    }

    /**
     * Relationship to Brief
     */
    public function brief(): BelongsTo
    {
        return $this->belongsTo(Brief::class, 'brief_id', 'id');
    }

    /**
     * Proposal Milestones
     */
    public function milestones(): HasMany
    {
        return $this->hasMany(ProposalMilestone::class, 'proposal_id', 'id');
    }

    /**
     * Get the Client (via Project or Brief)
     */
    public function getClientAttribute()
    {
        if ($this->project_id && $this->project) {
            return $this->project->client;
        }
        if ($this->brief_id && $this->brief) {
            return $this->brief->client;
        }
        return null;
    }
}
