<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NewChatMessageMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $recipient,
        public User $sender,
        public string $subjectTitle,
        public string $messageBody,
        public string $conversationId,
    ) {}

    public function envelope(): Envelope
    {
        $appName = config('app.name', 'منصة صِلة');
        $fromAddress = config('mail.from.address', 'notifications@sila.platform');
        $fromName = config('mail.from.name', 'منصة صِلة');
        $senderName = $this->sender->clientCompany?->company_name ?? $this->sender->user_name ?? 'مستخدم صِلة';

        return new Envelope(
            from: new Address($fromAddress, $fromName),
            subject: "رسالة جديدة من {$senderName}: {$this->subjectTitle} | {$appName}",
        );
    }

    public function content(): Content
    {
        $senderName = $this->sender->clientCompany?->company_name ?? $this->sender->user_name ?? 'مستخدم صِلة';
        $recipientName = $this->recipient->user_name ?? 'مستخدم صِلة';

        $isFreelancer = $this->recipient->role === 'freelancer';
        $viewUrl = $isFreelancer
            ? url("/freelancer/chat?conversation={$this->conversationId}")
            : url("/company/chat/{$this->conversationId}");

        return new Content(
            view: 'emails.new_chat_message',
            with: [
                'recipientName' => $recipientName,
                'senderName'    => $senderName,
                'subjectTitle'  => $this->subjectTitle,
                'messageBody'   => $this->messageBody,
                'viewUrl'       => $viewUrl,
            ],
        );
    }
}

