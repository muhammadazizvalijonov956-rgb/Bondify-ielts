import { NextRequest, NextResponse } from 'next/server';
import { R2StorageService } from '@/lib/services/r2-service';

/**
 * Route Handler to generate a presigned UPLOAD URL for R2.
 */
export async function POST(req: NextRequest) {
  try {
    // You should add authentication here to ensure only Admins can upload!
    // Example: const { user } = await getAuthContext(); if (!user.isAdmin)...

    const { filename, contentType, folder = 'uploads' } = await req.json();

    if (!filename || !contentType) {
      return NextResponse.json({ error: 'Filename and content type are required.' }, { status: 400 });
    }

    // Generate a unique key based on the folder/type
    // If it's a release, we might want to keep the name predictable (e.g. releases/Bondify-Setup.exe)
    const fileKey = folder === 'releases' 
      ? `releases/${filename}` // Use original name for releases
      : `${folder}/${Date.now()}_${filename.replace(/[^a-zA-Z0-9.]/g, '')}`;

    const uploadUrl = await R2StorageService.getPresignedUploadUrl(fileKey, contentType);
    const publicUrl = R2StorageService.getPublicUrl(fileKey);

    return NextResponse.json({
      uploadUrl,
      publicUrl,
      fileKey
    });

  } catch (error: any) {
    console.error('Error generating presigned URL:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
