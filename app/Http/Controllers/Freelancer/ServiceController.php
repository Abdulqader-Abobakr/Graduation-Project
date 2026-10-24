<?php

namespace App\Http\Controllers\Freelancer;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use App\Models\Portfolio;

class ServiceController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        
        // Load the freelancer profile with targeted portfolios
        $freelancer = $user->freelancer()
            ->select(['id', 'user_id', 'marketing_specialties', 'experienced_sectors'])
            ->with(['portfolios:id,freelancer_id,title,marketing_domain,images'])
            ->first();
        
        // If the freelancer doesn't exist yet, we can pass empty defaults
        if (!$freelancer) {
            $specialties = [];
            $sectors = [];
            $portfolios = [];
        } else {
            // Format specialties for the UI
            $specialties = $freelancer->marketing_specialties ?? [];
            $sectors = $freelancer->experienced_sectors ?? [];
            $portfolios = $freelancer->portfolios->map(function($portfolio) {
                return [
                    'id' => (string) $portfolio->id,
                    'title' => $portfolio->title,
                    'marketing_domain' => $portfolio->marketing_domain,
                    'images' => $portfolio->images ?? [],
                    'desc' => $portfolio->marketing_domain // as a fallback for the UI
                ];
            });
        }

        return Inertia::render('freelancer/Services', [
            'pageTitle' => 'خدماتي',
            'specialties' => $specialties,
            'sectors' => $sectors,
            'portfolios' => $portfolios
        ]);
    }

    public function updateSpecialties(Request $request)
    {
        $request->validate([
            'marketing_specialties' => 'nullable|array',
            'marketing_specialties.*' => 'string|max:100',
            'experienced_sectors' => 'nullable|array',
            'experienced_sectors.*' => 'string|max:100',
        ]);

        $user = auth()->user();
        $freelancer = $user->freelancer;

        if (!$freelancer) {
            // Create a new freelancer profile if it doesn't exist yet
            $freelancer = $user->freelancer()->create([
                'marketing_specialties' => $request->marketing_specialties ?? [],
                'experienced_sectors' => $request->experienced_sectors ?? [],
            ]);
        } else {
            $freelancer->update([
                'marketing_specialties' => $request->marketing_specialties ?? [],
                'experienced_sectors' => $request->experienced_sectors ?? [],
            ]);
        }

        return redirect()->back()->with('success', 'تم حفظ التخصصات بنجاح.');
    }

    public function storePortfolio(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'marketing_domain' => 'required|string|max:255',
            'images.*' => 'image|mimes:jpeg,png,jpg,gif,webp|max:5120', // Up to 5MB
        ]);

        $freelancer = auth()->user()->freelancer;

        if (!$freelancer) {
            return redirect()->back()->withErrors(['message' => 'Freelancer profile not found.']);
        }

        $imagePaths = [];
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                // Generate a consistent, clean filename
                $ext = strtolower($image->getClientOriginalExtension());
                $originalName = pathinfo($image->getClientOriginalName(), PATHINFO_FILENAME);
                $sanitizedName = \Illuminate\Support\Str::slug($originalName, '-');
                $sanitizedName = \Illuminate\Support\Str::limit($sanitizedName, 60, '');
                $timestamp = now()->timestamp;
                $uniqueId = \Illuminate\Support\Str::uuid()->toString();

                $fileName = "{$uniqueId}-{$timestamp}-{$sanitizedName}.{$ext}";
                
                // Store inside the 'portfolio-images' bucket
                $storagePath = "{$freelancer->id}";

                try {
                    Storage::disk('portfolio-images')->putFileAs($storagePath, $image, $fileName);
                    
                    // Build public URL using the portfolio-images bucket
                    $filePath = "{$storagePath}/{$fileName}";
                    $publicUrl = rtrim(env('SUPABASE_ENDPOINT'), '/')
                        . '/../object/public/'
                        . 'portfolio-images' 
                        . '/' . $filePath;

                    $imagePaths[] = $publicUrl;
                } catch (\Exception $e) {
                    return back()->withErrors(['images' => 'فشل رفع بعض الصور: ' . $e->getMessage()]);
                }
            }
        }

        Portfolio::create([
            'freelancer_id' => $freelancer->id,
            'title' => $request->title,
            'marketing_domain' => $request->marketing_domain,
            'images' => $imagePaths,
        ]);

        return redirect()->back()->with('success', 'تم إضافة العمل لمعرض أعمالك بنجاح.');
    }

    public function updatePortfolio(Request $request, $id)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'marketing_domain' => 'required|string|max:255',
            'images.*' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120', // Up to 5MB
        ]);

        $freelancer = auth()->user()->freelancer;

        if (!$freelancer) {
            return redirect()->back()->withErrors(['message' => 'Freelancer profile not found.']);
        }

        $portfolio = Portfolio::where('freelancer_id', $freelancer->id)->findOrFail($id);

        $imagePaths = $portfolio->images ?? []; // Default to existing images

        // If new files are uploaded, replace the old ones (or you could merge, but replacing is standard for simple edits unless handled otherwise in UI)
        if ($request->hasFile('images')) {
            $imagePaths = []; // Clear old images and replace with new ones
            foreach ($request->file('images') as $image) {
                // Generate a consistent, clean filename
                $ext = strtolower($image->getClientOriginalExtension());
                $originalName = pathinfo($image->getClientOriginalName(), PATHINFO_FILENAME);
                $sanitizedName = \Illuminate\Support\Str::slug($originalName, '-');
                $sanitizedName = \Illuminate\Support\Str::limit($sanitizedName, 60, '');
                $timestamp = now()->timestamp;
                $uniqueId = \Illuminate\Support\Str::uuid()->toString();

                $fileName = "{$uniqueId}-{$timestamp}-{$sanitizedName}.{$ext}";
                
                // Store inside the 'portfolio-images' bucket
                $storagePath = "{$freelancer->id}";

                try {
                    Storage::disk('portfolio-images')->putFileAs($storagePath, $image, $fileName);
                    
                    $filePath = "{$storagePath}/{$fileName}";
                    $publicUrl = rtrim(env('SUPABASE_ENDPOINT'), '/')
                        . '/../object/public/'
                        . 'portfolio-images' 
                        . '/' . $filePath;

                    $imagePaths[] = $publicUrl;
                } catch (\Exception $e) {
                    return back()->withErrors(['images' => 'فشل رفع بعض الصور: ' . $e->getMessage()]);
                }
            }
        }

        $portfolio->update([
            'title' => $request->title,
            'marketing_domain' => $request->marketing_domain,
            'images' => $imagePaths,
        ]);

        return redirect()->back()->with('success', 'تم تحديث العمل بنجاح.');
    }
}
