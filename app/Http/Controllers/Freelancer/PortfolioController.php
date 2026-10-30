<?php

namespace App\Http\Controllers\Freelancer;

use App\Http\Controllers\Controller;
use App\Models\Portfolio;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PortfolioController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => [
                'required',
                'string',
                'min:3',
                'max:120',
                'regex:/^[\x{0600}-\x{06FF}a-zA-Z0-9\s\.\,\-\(\)\/\#]+$/u',
            ],
            'marketing_domain' => [
                'required',
                'string',
                'min:2',
                'max:60',
                'regex:/^[\x{0600}-\x{06FF}a-zA-Z0-9\s\.\,\-\/\&]+$/u',
            ],
            'images' => [
                'required',
                'array',
                'min:1',
            ],
            'images.*' => [
                'required',
                'image',
                'mimes:jpeg,png,jpg,webp',
                'max:5120',
            ],
        ], [
            'title.required' => 'حقل اسم العمل مطلوب ولا يمكن تركه فارغاً.',
            'title.min' => 'يجب ألا يقل اسم العمل عن 3 أحرف.',
            'title.max' => 'يجب ألا يتجاوز اسم العمل 120 حرفاً.',
            'title.regex' => 'اسم العمل يحتوي على رموز غير مسموح بها، يرجى كتابة اسم صالح.',
            'marketing_domain.required' => 'حقل تصنيف العمل مطلوب ولا يمكن تركه فارغاً.',
            'marketing_domain.min' => 'يجب ألا يقل تصنيف العمل عن حرفين.',
            'marketing_domain.max' => 'يجب ألا يتجاوز تصنيف العمل 60 حرفاً.',
            'marketing_domain.regex' => 'تصنيف العمل يحتوي على رموز غير مسموح بها.',
            'images.required' => 'يرجى إرفاق صورة واحدة على الأقل لنموذج العمل.',
            'images.min' => 'يرجى إرفاق صورة واحدة على الأقل لنموذج العمل.',
            'images.*.required' => 'يرجى اختيار صور صالحة.',
            'images.*.image' => 'الملف المرفق يجب أن يكون صورة صالحة.',
            'images.*.mimes' => 'صيغ الصور المسموح بها هي: jpeg, png, jpg, webp.',
            'images.*.max' => 'الحد الأقصى لحجم كل صورة هو 5 ميجابايت.',
        ]);

        $user = auth()->user();
        $freelancer = $user->freelancer;

        if (!$freelancer) {
            $freelancer = $user->freelancer()->create();
        }

        $imagePaths = [];
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $ext = strtolower($image->getClientOriginalExtension());
                $originalName = pathinfo($image->getClientOriginalName(), PATHINFO_FILENAME);
                $sanitizedName = Str::slug($originalName, '-');
                $sanitizedName = Str::limit($sanitizedName, 60, '');
                $timestamp = now()->timestamp;
                $uniqueId = Str::uuid()->toString();

                $fileName = "{$uniqueId}-{$timestamp}-{$sanitizedName}.{$ext}";
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

        Portfolio::create([
            'freelancer_id' => $freelancer->id,
            'title' => trim($validated['title']),
            'marketing_domain' => trim($validated['marketing_domain']),
            'images' => $imagePaths,
        ]);

        return redirect()->back()->with('success', 'تم إضافة العمل لمعرض أعمالك بنجاح.');
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'title' => [
                'required',
                'string',
                'min:3',
                'max:120',
                'regex:/^[\x{0600}-\x{06FF}a-zA-Z0-9\s\.\,\-\(\)\/\#]+$/u',
            ],
            'marketing_domain' => [
                'required',
                'string',
                'min:2',
                'max:60',
                'regex:/^[\x{0600}-\x{06FF}a-zA-Z0-9\s\.\,\-\/\&]+$/u',
            ],
            'images' => [
                'nullable',
                'array',
            ],
            'images.*' => [
                'image',
                'mimes:jpeg,png,jpg,webp',
                'max:5120',
            ],
        ], [
            'title.required' => 'حقل اسم العمل مطلوب ولا يمكن تركه فارغاً.',
            'title.min' => 'يجب ألا يقل اسم العمل عن 3 أحرف.',
            'title.max' => 'يجب ألا يتجاوز اسم العمل 120 حرفاً.',
            'title.regex' => 'اسم العمل يحتوي على رموز غير مسموح بها.',
            'marketing_domain.required' => 'حقل تصنيف العمل مطلوب ولا يمكن تركه فارغاً.',
            'marketing_domain.min' => 'يجب ألا يقل تصنيف العمل عن حرفين.',
            'marketing_domain.max' => 'يجب ألا يتجاوز تصنيف العمل 60 حرفاً.',
            'marketing_domain.regex' => 'تصنيف العمل يحتوي على رموز غير مسموح بها.',
            'images.*.image' => 'الملف المرفق يجب أن يكون صورة صالحة.',
            'images.*.mimes' => 'صيغ الصور المسموح بها هي: jpeg, png, jpg, webp.',
            'images.*.max' => 'الحد الأقصى لحجم كل صورة هو 5 ميجابايت.',
        ]);

        $user = auth()->user();
        $freelancer = $user->freelancer;

        if (!$freelancer) {
            $freelancer = $user->freelancer()->create();
        }

        $portfolio = Portfolio::where('freelancer_id', $freelancer->id)->findOrFail($id);

        $imagePaths = $portfolio->images ?? [];

        if ($request->hasFile('images')) {
            $imagePaths = [];
            foreach ($request->file('images') as $image) {
                $ext = strtolower($image->getClientOriginalExtension());
                $originalName = pathinfo($image->getClientOriginalName(), PATHINFO_FILENAME);
                $sanitizedName = Str::slug($originalName, '-');
                $sanitizedName = Str::limit($sanitizedName, 60, '');
                $timestamp = now()->timestamp;
                $uniqueId = Str::uuid()->toString();

                $fileName = "{$uniqueId}-{$timestamp}-{$sanitizedName}.{$ext}";
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

    public function destroy($id)
    {
        $user = auth()->user();
        $freelancer = $user->freelancer;

        if (!$freelancer) {
            $freelancer = $user->freelancer()->create();
        }

        $portfolio = Portfolio::where('freelancer_id', $freelancer->id)->findOrFail($id);
        $portfolio->delete();

        return redirect()->back()->with('success', 'تم حذف العمل من معرض أعمالك بنجاح.');
    }
}

