<?php

namespace App\Http\Controllers\Freelancer;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Transaction;
use App\Models\WithdrawalRequest;
use App\Models\Wallet;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EarningsController extends Controller
{
    public function index()
    {
        $user   = auth()->user();
        $wallet = $user->wallet;

        // 1. Fetch withdrawal requests once (used for both totalWithdrawn and transaction history)
        $withdrawals = WithdrawalRequest::where('freelancer_id', $user->id)
            ->select(['id', 'freelancer_id', 'amount', 'method', 'status', 'created_at'])
            ->orderBy('created_at', 'desc')
            ->get();

        // ── Wallet balances ───────────────────────────────────────────────
        $availableBalance = (float) ($wallet?->available_balance ?? 0);
        $pendingBalance   = (float) ($wallet?->pending_balance   ?? 0);

        // Total withdrawn = SUM of all withdrawal_requests that are NOT rejected (computed in memory)
        $totalWithdrawn = (float) $withdrawals
            ->whereIn('status', ['approved', 'pending'])
            ->sum('amount');

        // Gross lifetime earnings
        $totalLifetimeEarnings = $availableBalance + $pendingBalance + $totalWithdrawn;

        $walletData = [
            'available_balance'       => $availableBalance,
            'pending_balance'         => $pendingBalance,
            'total_withdrawn'         => $totalWithdrawn,
            'total_lifetime_earnings' => $totalLifetimeEarnings,
        ];

        // ── Transaction log & Chart data (1 single JOIN query instead of 4) ──
        $transactions = [];

        $projectPayments = Transaction::query()
            ->join('sila_p.projects as p', 'sila_p.transactions.project_id', '=', 'p.id')
            ->leftJoin('sila_p.users as client', 'p.client_id', '=', 'client.id')
            ->where('p.freelancer_id', $user->id)
            ->where('sila_p.transactions.verification_status', 'verified')
            ->select([
                'sila_p.transactions.id',
                'sila_p.transactions.project_id',
                'sila_p.transactions.amount',
                'sila_p.transactions.verification_status',
                'sila_p.transactions.created_at',
                'p.title as project_title',
                'p.status as project_status',
                'client.user_name as client_user_name',
            ])
            ->orderByDesc('sila_p.transactions.created_at')
            ->get();

        foreach ($projectPayments as $tx) {
            $projectStatus = $tx->project_status ?? 'active';
            $isCompleted   = $projectStatus === 'completed';

            $transactions[] = [
                'id'         => $tx->id,
                'timestamp'  => $tx->created_at?->timestamp ?? 0,
                'raw_date'   => $tx->created_at?->toIso8601String() ?? '',
                'date'       => $tx->created_at ? $tx->created_at->format('d M Y') : '',
                'desc'       => $tx->project_title ?? 'مشروع',
                'client'     => $tx->client_user_name ?? '-',
                'amount'     => '+' . number_format($tx->amount, 0) . ' ر.ي',
                'status'     => $isCompleted ? 'تم الاستلام' : 'معلق في الضمان',
                'statusType' => $isCompleted ? 'success' : 'escrow',
            ];
        }

        foreach ($withdrawals as $w) {
            $statusType = match ($w->status) {
                'approved' => 'withdrawn_approved',
                'pending'  => 'pending',
                'rejected' => 'rejected',
                default    => 'withdrawn_approved',
            };
            $statusName = match ($w->status) {
                'approved' => 'تم التحويل',
                'pending'  => 'قيد المراجعة',
                'rejected' => 'مرفوض',
                default    => $w->status,
            };

            $transactions[] = [
                'id'         => $w->id,
                'timestamp'  => $w->created_at?->timestamp ?? 0,
                'raw_date'   => $w->created_at?->toIso8601String() ?? '',
                'date'       => $w->created_at ? $w->created_at->format('d M Y') : '',
                'desc'       => 'سحب رصيد — ' . match ($w->method) {
                    'bank'  => 'بنك الكريمي',
                    'jeeb'  => 'جيب',
                    'local' => 'محلي',
                    default => $w->method,
                },
                'client'     => '-',
                'amount'     => '-' . number_format($w->amount, 0) . ' ر.ي',
                'status'     => $statusName,
                'statusType' => $statusType,
            ];
        }

        // Sort combined list chronologically by timestamp descending
        usort($transactions, fn($a, $b) => $b['timestamp'] <=> $a['timestamp']);

        // ── Compute chart data in memory from $projectPayments (0 extra SQL queries!) ──
        $startOfYear      = now()->startOfYear();
        $startOfNextYear  = (clone $startOfYear)->addYear();
        $startOfMonth     = now()->startOfMonth();
        $startOfNextMonth = (clone $startOfMonth)->addMonth();

        $monthlyData = [];
        $dailyData   = [];

        foreach ($projectPayments as $tx) {
            if (! $tx->created_at) {
                continue;
            }
            if ($tx->created_at >= $startOfYear && $tx->created_at < $startOfNextYear) {
                $m = $tx->created_at->format('m');
                $monthlyData[$m] = ($monthlyData[$m] ?? 0.0) + (float) $tx->amount;
            }
            if ($tx->created_at >= $startOfMonth && $tx->created_at < $startOfNextMonth) {
                $d = (int) $tx->created_at->format('j');
                $dailyData[$d] = ($dailyData[$d] ?? 0.0) + (float) $tx->amount;
            }
        }

        $monthNames = [
            '01' => 'يناير',
            '02' => 'فبراير',
            '03' => 'مارس',
            '04' => 'أبريل',
            '05' => 'مايو',
            '06' => 'يونيو',
            '07' => 'يوليو',
            '08' => 'أغسطس',
            '09' => 'سبتمبر',
            '10' => 'أكتوبر',
            '11' => 'نوفمبر',
            '12' => 'ديسمبر',
        ];

        $chartMonthly = array_map(
            fn($num, $name) => ['name' => $name, 'value' => (float) ($monthlyData[$num] ?? 0)],
            array_keys($monthNames),
            array_values($monthNames)
        );

        $daysInMonth = now()->daysInMonth;
        $chartDaily  = array_map(
            fn($day) => ['name' => (string) $day, 'value' => (float) ($dailyData[$day] ?? 0)],
            range(1, $daysInMonth)
        );

        return Inertia::render('freelancer/Earnings', [
            'pageTitle'    => 'الأرباح',
            'wallet'       => $walletData,
            'transactions' => array_values($transactions),
            'chartData'    => [
                'monthly' => $chartMonthly,
                'daily'   => $chartDaily,
            ],
        ]);
    }

    public function withdraw(Request $request)
    {
        $request->validate([
            'amount'  => 'required|numeric|min:1',
            'method'  => 'required|string|in:bank,jeeb,local',
            'details' => 'required|array',
        ]);

        $user   = auth()->user();
        $wallet = $user->wallet;

        if (! $wallet || $wallet->available_balance < $request->amount) {
            return redirect()->back()->withErrors([
                'amount' => 'الرصيد المتاح غير كافٍ لإتمام عملية السحب.',
            ]);
        }

        $wallet->decrement('available_balance', $request->amount);

        // Fix #4: freelancer_id FK points to users.id — use $user->id
        WithdrawalRequest::create([
            'freelancer_id' => $user->id,
            'amount'        => $request->amount,
            'method'        => $request->method,
            'details'       => $request->details,
            'status'        => 'pending',
        ]);

        return redirect()->back()->with('success', 'تم إرسال طلب السحب بنجاح، وهو قيد المراجعة.');
    }
}
