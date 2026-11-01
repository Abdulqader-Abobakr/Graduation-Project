<?php

namespace App\Mail;

use App\Models\Brief;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NewDirectOrderMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Brief $brief,
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
            subject: "طلب خدمة جديد موجه إليك: {$this->brief->title} | {$appName}",
        );
    }

    public function content(): Content
    {
        $clientName = $this->client->clientCompany?->company_name ?? $this->client->user_name ?? 'رائد أعمال';
        $viewUrl = url('/freelancer/proposals');

        return new Content(
            view: 'emails.new_direct_order',
            with: [
                'freelancerName' => $this->freelancer->user_name ?? 'خبير صِلة',
                'clientName'     => $clientName,
                'briefTitle'     => $this->brief->title,
                'category'       => $this->brief->category,
                'description'    => $this->brief->description,
                'viewUrl'        => $viewUrl,
            ],
        );
    }
}

