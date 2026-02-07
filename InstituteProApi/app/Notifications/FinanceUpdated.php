<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;
use YieldStudio\LaravelExpoNotifier\ExpoNotificationsChannel;
use YieldStudio\LaravelExpoNotifier\Dto\ExpoMessage;

class FinanceUpdated extends Notification
{
    protected string $title;
    protected string $body;
    protected array $data;

    public function __construct(string $title, string $body, array $data = [])
    {
        $this->title = $title;
        $this->body = $body;
        $this->data = $data;
    }

    public function via($notifiable): array
    {
        return [ExpoNotificationsChannel::class];
    }

    public function toExpoNotification($notifiable): ExpoMessage
    {
        $tokens = $notifiable->expoTokens()->pluck('value')->all();

        return (new ExpoMessage())
            ->to($tokens)
            ->title($this->title)
            ->body($this->body)
            ->jsonData($this->data)
            ->channelId('default');
    }
}
