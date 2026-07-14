export interface User {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
}

export interface AssetMetadata {
  width: number | null;
  height: number | null;
  format: string | null;
  cameraMake: string | null;
  cameraModel: string | null;
  focalLength: string | null;
  exposureTime: string | null;
  iso: number | null;
  aperture: number | null;
  latitude: number | null;
  longitude: number | null;
  takenAt: string | null;
}

export interface Asset {
  id: string;
  userId: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string | null;
  mediumPath: string | null;
  thumbnailPath: string | null;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  metadata: AssetMetadata | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    email: string;
  };
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  pagination?: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
}
