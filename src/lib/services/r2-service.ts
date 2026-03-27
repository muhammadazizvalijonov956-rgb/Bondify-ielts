import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2Client, R2_BUCKET_NAME } from '../r2';

/**
 * Cloudflare R2 Storage Service (Server-side)
 * This service provides helper methods to interact with R2 objects safely.
 */
export const R2StorageService = {
  /**
   * Generates a presigned URL for the client to UPLOAD a file directly to R2.
   * This is efficient as it avoids proxying the file through the server.
   */
  async getPresignedUploadUrl(key: string, contentType: string) {
    if (!R2_BUCKET_NAME) throw new Error('R2_BUCKET_NAME is not configured.');

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    try {
      // Direct URL to Cloudflare R2 worker-less upload
      // Valid for 1 hour (3600 seconds)
      const url = await getSignedUrl(r2Client, command, { expiresIn: 3600 });
      return url;
    } catch (error) {
      console.error('Failed to generate presigned upload URL:', error);
      throw error;
    }
  },

  /**
   * Generates a presigned URL for the client to DOWNLOAD an object.
   * Useful for private buckets where objects aren't public.
   */
  async getPresignedDownloadUrl(key: string) {
    if (!R2_BUCKET_NAME) throw new Error('R2_BUCKET_NAME is not configured.');

    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    try {
      // Valid for 1 hour (3600 seconds)
      const url = await getSignedUrl(r2Client, command, { expiresIn: 3600 });
      return url;
    } catch (error) {
      console.error('Failed to generate presigned download URL:', error);
      throw error;
    }
  },

  /**
   * Generates the public access URL if a public domain is configured.
   * Falls back to a default format if not.
   */
  getPublicUrl(key: string) {
    const publicDomain = process.env.R2_PUBLIC_DOMAIN;
    if (publicDomain) {
      return `${publicDomain.replace(/\/$/, '')}/${key}`;
    }
    // Standard R2 public dev domain format (if bucket is public)
    return `https://${R2_BUCKET_NAME}.r2.dev/${key}`;
  }
};
