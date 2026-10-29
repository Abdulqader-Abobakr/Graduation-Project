<?php

use Inertia\Inertia;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\ForgotPasswordController;
use App\Http\Controllers\Freelancer;
use App\Http\Controllers\Company\BriefController;
use App\Http\Controllers\Company\ProfileController;
use App\Http\Controllers\Company\ProposalController as CompanyProposalController;
use App\Http\Controllers\PlatformAssistantController;

Route::get('/', function () {
    return Inertia::render('Landing');
})->name('home');

Route::get('/register', [RegisterController::class, 'create'])->name('register');
Route::post('/register', [RegisterController::class, 'store']);

Route::get('/login', [LoginController::class, 'create'])->name('login');
Route::post('/login', [LoginController::class, 'store']);
Route::post('/forgot-password', [ForgotPasswordController::class, 'sendResetLinkEmail'])->name('password.email');
Route::get('/reset-password', [ForgotPasswordController::class, 'showResetForm'])->name('password.reset');
Route::post('/reset-password', [ForgotPasswordController::class, 'reset'])->name('password.update');

Route::post('/logout', [LoginController::class, 'destroy'])->name('logout');

Route::post('/assistant/ask', [PlatformAssistantController::class, 'ask'])->name('assistant.ask');

Route::middleware(['auth', 'role:company'])->group(function () {
    Route::get('/company', [BriefController::class, 'index'])
        ->name('company.dashboard');
    Route::get('/company/freelancers/{id}', [BriefController::class, 'showFreelancer'])
        ->name('company.freelancers.show');
    Route::get('/company/profile', [ProfileController::class, 'show'])
        ->name('company.profile');
    Route::put('/company/profile', [ProfileController::class, 'update'])
        ->name('company.profile.update');
    Route::get('/company/settings', [ProfileController::class, 'settings'])
        ->name('company.settings');
    Route::put('/company/settings/password', [ProfileController::class, 'updatePassword'])
        ->name('company.settings.password');
    Route::put('/company/settings/alternative-email', [ProfileController::class, 'updateAlternativeEmail'])
        ->name('company.settings.alternative_email');
    Route::put('/company/settings/notifications', [ProfileController::class, 'updateNotifications'])
        ->name('company.settings.notifications');
    Route::get('/company/requests-poll', [BriefController::class, 'requestsPoll'])
        ->name('company.briefs.poll');
    Route::post('/company/briefs', [BriefController::class, 'store'])
        ->name('company.briefs.store');
    Route::put('/company/briefs/{id}', [BriefController::class, 'update'])
        ->name('company.briefs.update');
    Route::delete('/company/briefs/{id}', [BriefController::class, 'destroy'])
        ->name('company.briefs.destroy');
    Route::post('/company/proposals/{id}/accept', [CompanyProposalController::class, 'accept'])
        ->name('company.proposals.accept');
    Route::post('/company/proposals/{id}/deny', [CompanyProposalController::class, 'deny'])
        ->name('company.proposals.deny');
    Route::post('/company/proposals/{id}/chat', [CompanyProposalController::class, 'startChat'])
        ->name('company.proposals.chat');
    Route::post('/company/conversations/{id}/messages', [CompanyProposalController::class, 'sendMessage'])
        ->name('company.conversations.messages');
    Route::get('/company/chat-list', [\App\Http\Controllers\Company\ChatController::class, 'conversations'])
        ->name('company.chat.conversations');
    Route::get('/company/chat/{conversation}', [\App\Http\Controllers\Company\ChatController::class, 'show'])
        ->name('company.chat.show');
    Route::get('/company/chat/{conversation}/messages', [\App\Http\Controllers\Company\ChatController::class, 'messages'])
        ->name('company.chat.messages');
    Route::post('/company/chat/{conversation}', [\App\Http\Controllers\Company\ChatController::class, 'store'])
        ->name('company.chat.store');
    Route::delete('/company/chat/{conversation}', [\App\Http\Controllers\Company\ChatController::class, 'destroy'])
        ->name('company.chat.destroy');
    Route::get('/company/projects/{project}/pay', [\App\Http\Controllers\Company\PaymentController::class, 'create'])
        ->name('company.projects.pay');
    Route::post('/company/projects/{project}/pay', [\App\Http\Controllers\Company\PaymentController::class, 'store'])
        ->name('company.projects.pay.store');

    Route::get('/company/projects/{project}', [\App\Http\Controllers\Company\ProjectController::class, 'show'])
        ->name('company.projects.show');
    Route::post('/company/projects/{project}/deliverables/{deliverable}/review', [\App\Http\Controllers\Company\ProjectController::class, 'reviewDeliverable'])
        ->name('company.projects.deliverables.review');
    Route::get('/company/projects/{project}/deliverables/{deliverable}/download', [\App\Http\Controllers\Company\ProjectController::class, 'downloadDeliverable'])
        ->name('company.projects.deliverables.download');
    Route::get('/company/projects/{project}/deliverables/{deliverable}/view', [\App\Http\Controllers\Company\ProjectController::class, 'viewDeliverable'])
        ->name('company.projects.deliverables.view');
    Route::post('/company/projects/{project}/disputes', [\App\Http\Controllers\Company\ProjectController::class, 'storeDispute'])
        ->name('company.projects.disputes.store');
});

Route::get('/auth/confirm', function () {
    return redirect('/login');
});

/*
|--------------------------------------------------------------------------
| Freelancer Module Routes
|--------------------------------------------------------------------------
*/
Route::prefix('freelancer')
    ->middleware(['auth', 'role:freelancer'])
    ->group(function () {
        Route::get('/', [Freelancer\DashboardController::class, 'index'])->name('freelancer.dashboard');
        Route::get('/briefs-poll', [Freelancer\DashboardController::class, 'briefsPoll'])->name('freelancer.briefs.poll');
        Route::get('/proposals', [Freelancer\ProposalController::class, 'index'])->name('freelancer.proposals');
        Route::get('/proposals-poll', [Freelancer\ProposalController::class, 'poll'])->name('freelancer.proposals.poll');
        Route::get('/proposals/{id}/edit', [Freelancer\ProposalController::class, 'edit'])->name('freelancer.proposals.edit');
        Route::put('/proposals/{id}', [Freelancer\ProposalController::class, 'update'])->name('freelancer.proposals.update');
        Route::delete('/proposals/{id}', [Freelancer\ProposalController::class, 'destroy'])->name('freelancer.proposals.destroy');
        Route::get('/proposals/create-for-brief/{briefId}', [Freelancer\ProposalController::class, 'createForBrief'])->name('freelancer.proposals.createForBrief');
        Route::post('/proposals/brief/{briefId}', [Freelancer\ProposalController::class, 'storeForBrief'])->name('freelancer.proposals.storeForBrief');
        Route::get('/proposals/create/{chatId}', [Freelancer\ProposalController::class, 'create'])->name('freelancer.proposals.create');
        Route::post('/proposals/create/{chatId}', [Freelancer\ProposalController::class, 'store'])->name('freelancer.proposals.store');
        Route::post('/orders/{id}/accept', [Freelancer\ProposalController::class, 'acceptOrder'])->name('freelancer.orders.accept');
        Route::post('/orders/{id}/reject', [Freelancer\ProposalController::class, 'rejectOrder'])->name('freelancer.orders.reject');
        Route::get('/projects', [Freelancer\ProjectController::class, 'index'])->name('freelancer.projects');
        Route::get('/projects/{id}', [Freelancer\ProjectController::class, 'show'])->name('freelancer.projects.show');
        Route::post('/projects/{id}/tasks/{taskId}', [Freelancer\ProjectController::class, 'submitTask'])->name('freelancer.projects.submitTask');
        Route::post('/projects/{id}/deliverables', [Freelancer\ProjectController::class, 'storeDeliverable'])->name('freelancer.projects.deliverables.store');
        Route::get('/projects/{project}/deliverables/{deliverable}/download', [Freelancer\ProjectController::class, 'downloadDeliverable'])->name('freelancer.projects.deliverables.download');
        Route::get('/projects/{project}/deliverables/{deliverable}/view', [Freelancer\ProjectController::class, 'viewDeliverable'])->name('freelancer.projects.deliverables.view');
        Route::post('/projects/{project}/disputes', [Freelancer\ProjectController::class, 'storeDispute'])->name('freelancer.projects.disputes.store');
        Route::get('/services', [Freelancer\ServiceController::class, 'index'])->name('freelancer.services');
        Route::post('/services/portfolio', [Freelancer\ServiceController::class, 'storePortfolio'])->name('freelancer.portfolio.store');
        Route::post('/services/portfolio/{id}', [Freelancer\ServiceController::class, 'updatePortfolio'])->name('freelancer.portfolio.update');
        Route::post('/services/specialties', [Freelancer\ServiceController::class, 'updateSpecialties'])->name('freelancer.specialties.update');
        Route::get('/earnings', [Freelancer\EarningsController::class, 'index'])->name('freelancer.earnings');
        Route::post('/earnings/withdraw', [Freelancer\EarningsController::class, 'withdraw'])->name('freelancer.earnings.withdraw');
        Route::get('/profile', [Freelancer\ProfileController::class, 'show'])->name('freelancer.profile');
        Route::put('/profile', [Freelancer\ProfileController::class, 'update'])->name('freelancer.profile.update');
        Route::get('/settings', [Freelancer\ProfileController::class, 'settings'])->name('freelancer.settings');
        Route::put('/settings/password', [Freelancer\ProfileController::class, 'updatePassword'])->name('freelancer.settings.password');
        Route::put('/settings/alternative-email', [Freelancer\ProfileController::class, 'updateAlternativeEmail'])->name('freelancer.settings.alternative_email');
        Route::put('/settings/notifications', [Freelancer\ProfileController::class, 'updateNotifications'])->name('freelancer.settings.notifications');
        Route::get('/chat', [Freelancer\ChatController::class, 'index'])->name('freelancer.chat.index');
        Route::get('/chat-list', [Freelancer\ChatController::class, 'conversations'])->name('freelancer.chat.conversations');
        Route::get('/chat/{conversation}', [Freelancer\ChatController::class, 'show'])->name('freelancer.chat.show');
        Route::get('/chat/{conversation}/messages', [Freelancer\ChatController::class, 'messages'])->name('freelancer.chat.messages');
        Route::post('/chat/{conversation}', [Freelancer\ChatController::class, 'store'])->name('freelancer.chat.store');
        Route::delete('/chat/{conversation}', [Freelancer\ChatController::class, 'destroy'])->name('freelancer.chat.destroy');
        Route::get('/companies/{id}', [Freelancer\CompanyController::class, 'show'])->name('freelancer.companies.show');
    });