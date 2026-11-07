<?php

namespace App\Mail;

use App\Models\Proposal;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NewProposalMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Proposal $proposal,
        public User $client,
        public User $freelancer,
    ) {}

    public function envelope(): Envelope
    {
        $appName = config('app.name', 'منصة صِلة');
        $fromAddress = config('mail.from.address', 'notifications@sila.platform');
        $fromName = config('mail.from.name', 'منصة صِلة');

        return new Envelope(
            from: new Address($fromAddress, $fromName),
            subject: "عرض جديد مقدم على طلبك: {$this->proposal->title} | {$appName}",
        );
    }

    public function content(): Content
    {
        $clientName = $this->client->clientCompany?->company_name ?? $this->client->user_name ?? 'رائد أعمال';
        $viewUrl = url('/company/requests');

        return new Content(
            view: 'emails.new_proposal',
            with: [
                'clientName'     => $clientName,
                'freelancerName' => $this->freelancer->user_name ?? 'الخبير',
                'proposalTitle'  => $this->proposal->title,
                'price'          => number_format((float) $this->proposal->price, 2),
                'timeline'       => $this->proposal->timeline,
                'viewUrl'        => $viewUrl,
            ],
        );
    }
}

