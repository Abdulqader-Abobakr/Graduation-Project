<?php

namespace App\Http\Controllers\Freelancer;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Brief;
use App\Models\Project;
use Illuminate\Http\JsonResponse;

class CompanyController extends Controller
{
    public function show(string $id): JsonResponse
    {
        $client = User::query()
            ->where('role', 'client')
            ->with('clientCompany')
            ->findOrFail($id);

        $company = $client->clientCompany;

        $totalBriefs = Brief::where('client_id', $client->id)->count();
        $completedProjects = Project::where('client_id', $client->id)
            ->where('status', 'completed')
            ->count();

        return response()->json([
            'id' => (string) $client->id,
            'name' => $company?->business_name ?: ($client->user_name ?? 'شركة'),
            'businessName' => $company?->business_name,
            'userName' => $client->user_name,
            'email' => $client->email,
            'phone' => $client->phone_number,
            'city' => $client->city ?? 'غير محدد',
            'industry' => $company?->industry ?? 'عام',
            'description' => $company?->company_description ?? 'لا يوجد وصف متاح للشركة حالياً.',
            'avatar' => $client->avatar_path,
            'createdAt' => $client->created_at ? 'عضو منذ ' . $client->created_at->locale('ar')->translatedFormat('F Y') : 'عضو جديد',
            'totalBriefs' => $totalBriefs,
            'completedProjects' => $completedProjects,
        ]);
    }
}

