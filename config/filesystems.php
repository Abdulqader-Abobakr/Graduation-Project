<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Filesystem Disk
    |--------------------------------------------------------------------------
    |
    | Here you may specify the default filesystem disk that should be used
    | by the framework. The "local" disk, as well as a variety of cloud
    | based disks are available to your application for file storage.
    |
    */

    'default' => env('FILESYSTEM_DISK', 'local'),

    /*
    |--------------------------------------------------------------------------
    | Filesystem Disks
    |--------------------------------------------------------------------------
    |
    | Below you may configure as many filesystem disks as necessary, and you
    | may even configure multiple disks for the same driver. Examples for
    | most supported storage drivers are configured here for reference.
    |
    | Supported drivers: "local", "ftp", "sftp", "s3"
    |
    */

    'disks' => [

        'local' => [
            'driver' => 'local',
            'root' => storage_path('app/private'),
            'serve' => true,
            'throw' => false,
            'report' => false,
        ],

        'public' => [
            'driver' => 'local',
            'root' => storage_path('app/public'),
            'url' => rtrim(env('APP_URL', 'http://localhost'), '/').'/storage',
            'visibility' => 'public',
            'throw' => false,
            'report' => false,
        ],

        's3' => [
            'driver' => 's3',
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            'region' => env('AWS_DEFAULT_REGION'),
            'bucket' => env('AWS_BUCKET'),
            'url' => env('AWS_URL'),
            'endpoint' => env('AWS_ENDPOINT'),
            'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false),
            'throw' => false,
            'report' => false,
        ],

        // 1. Deliverables Files
        'deliverables-files' => [
            'driver'                  => 's3',
            'key'                     => env('SUPABASE_KEY'),
            'secret'                  => env('SUPABASE_SECRET'),
            'region'                  => env('SUPABASE_REGION', 'eu-central-1'),
            'bucket'                  => env('SUPABASE_BUCKET', 'deliverables-files'),
            'endpoint'                => env('SUPABASE_ENDPOINT'),
            'use_path_style_endpoint' => true,
            'throw'                   => false,
            'report'                  => false,
        ],

        // 2. Verification Docs
        'verification-docs' => [
            'driver'                  => 's3',
            'key'                     => env('SUPABASE_KEY'),
            'secret'                  => env('SUPABASE_SECRET'),
            'region'                  => env('SUPABASE_REGION', 'eu-central-1'),
            'bucket'                  => env('SUPABASE_VERIFICATION_BUCKET', 'verification-docs'),
            'endpoint'                => env('SUPABASE_ENDPOINT'),
            'use_path_style_endpoint' => true,
            'throw'                   => false,
            'report'                  => false,
        ],

        // 3. Receipts
        'receipts' => [
            'driver'                  => 's3',
            'key'                     => env('SUPABASE_KEY'),
            'secret'                  => env('SUPABASE_SECRET'),
            'region'                  => env('SUPABASE_REGION', 'eu-central-1'),
            'bucket'                  => env('SUPABASE_RECEIPTS_BUCKET', 'receipts'),
            'endpoint'                => env('SUPABASE_ENDPOINT'),
            'use_path_style_endpoint' => true,
            'throw'                   => false,
            'report'                  => false,
        ],

        // 4. Avatars
        'avatars' => [
            'driver'                  => 's3',
            'key'                     => env('SUPABASE_KEY'),
            'secret'                  => env('SUPABASE_SECRET'),
            'region'                  => env('SUPABASE_REGION', 'eu-central-1'),
            'bucket'                  => env('SUPABASE_AVATARS_BUCKET', 'avatars'),
            'endpoint'                => env('SUPABASE_ENDPOINT'),
            'use_path_style_endpoint' => true,
            'throw'                   => false,
            'report'                  => false,
        ],

        // 5. Portfolio Images
        'portfolio-images' => [
            'driver'                  => 's3',
            'key'                     => env('SUPABASE_KEY'),
            'secret'                  => env('SUPABASE_SECRET'),
            'region'                  => env('SUPABASE_REGION', 'eu-central-1'),
            'bucket'                  => env('SUPABASE_PORTFOLIO_BUCKET', 'portfolio-images'),
            'endpoint'                => env('SUPABASE_ENDPOINT'),
            'use_path_style_endpoint' => true,
            'throw'                   => false,
            'report'                  => false,
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Symbolic Links
    |--------------------------------------------------------------------------
    |
    | Here you may configure the symbolic links that will be created when the
    | `storage:link` Artisan command is executed. The array keys should be
    | the locations of the links and the values should be their targets.
    |
    */

    'links' => [
        public_path('storage') => storage_path('app/public'),
    ],

];
