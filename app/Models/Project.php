<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Project extends Model
{
    protected $table = 'sila_p.projects';

    use HasUuids;

    protected $fillable = [
        'brief_id',
        'client_id',
        'freelancer_id',
        'title',
        'status',
        'progress',
    ];

    protected $casts = [
        'progress' => 'integer',
    ];

    public function brief(): BelongsTo
    {
        return $this->belongsTo(Brief::class, 'brief_id', 'id');
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'client_id', 'id');
    }

    public function freelancer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'freelancer_id', 'id');
    }

    public function deliverables(): HasMany
    {
        return $this->hasMany(Deliverable::class, 'project_id', 'id')->orderBy('created_at', 'asc');
    }

    /**
     * The accepted proposal linked to this project.
     *
     * Primary:  proposals.project_id = projects.id  (set after acceptance)
     * Fallback: proposals.brief_id   = projects.brief_id + freelancer_id filter
     *
     * Using project_id makes eager loading reliable — the brief_id+where() approach
     * breaks with Eloquent's HasOne eager loading when the where() uses $this->.
     */
    public function originalProposal(): HasOne
    {
        return $this->hasOne(Proposal::class, 'project_id', 'id');
    }

    /**
     * Fallback relation via brief when project_id is not yet set on the proposal.
     */
    public function proposalViaBrief(): HasOne
    {
        return $this->hasOne(Proposal::class, 'brief_id', 'brief_id')
            ->where('status', 'accepted');
    }

    public function disputes(): HasMany
    {
        return $this->hasMany(Dispute::class, 'project_id', 'id')->orderBy('created_at', 'desc');
    }

    public function activeDispute(): HasOne
    {
        return $this->hasOne(Dispute::class, 'project_id', 'id')
            ->whereIn('status', ['open', 'under_review'])
            ->latestOfMany();
    }
}
