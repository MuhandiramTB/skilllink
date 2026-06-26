import { Injectable } from '@nestjs/common';

export interface PresignedUpload {
  uploadUrl: string; // where the client PUTs the file (mock: a placeholder)
  fileUrl: string; // the URL we store after upload completes
}

/**
 * Abstraction over media storage (NIC/selfie/certificates). Real impl =
 * Cloudinary signed uploads; mock returns deterministic fake URLs so onboarding
 * is testable without an account. Select via env MEDIA_UPLOADER=mock|cloudinary.
 */
export abstract class MediaUploader {
  abstract presign(kind: string, providerId: string): Promise<PresignedUpload>;
}

@Injectable()
export class MockMediaUploader extends MediaUploader {
  async presign(kind: string, providerId: string): Promise<PresignedUpload> {
    const stamp = providerId.slice(0, 8);
    return {
      uploadUrl: `https://mock-upload.local/${kind}/${providerId}`,
      fileUrl: `https://mock-cdn.local/${kind}/${stamp}-${kind}.jpg`,
    };
  }
}
