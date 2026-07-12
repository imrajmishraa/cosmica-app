import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Asset, ApiResponse } from '../types/index.js';
import { useAuth } from './AuthContext.js';

interface AssetContextType {
  assets: Asset[];
  loading: boolean;
  searchQuery: string;
  mimeTypeFilter: string;
  activeAsset: Asset | null;
  pagination: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
  setSearchQuery: (query: string) => void;
  setMimeTypeFilter: (filter: string) => void;
  setActiveAsset: (asset: Asset | null) => void;
  fetchAssets: (page?: number, limit?: number) => Promise<void>;
  searchAssets: (query: string) => Promise<void>;
  uploadAssetFile: (file: File, onProgress: (progress: number) => void) => Promise<Asset>;
  updateAssetOriginalName: (id: string, originalName: string) => Promise<void>;
  deleteAssetById: (id: string) => Promise<void>;
  updateAssetInList: (asset: Asset) => void;
}

const AssetContext = createContext<AssetContextType | undefined>(undefined);

export const AssetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mimeTypeFilter, setMimeTypeFilter] = useState<string>('');
  const [activeAsset, setActiveAsset] = useState<Asset | null>(null);
  const [pagination, setPagination] = useState({
    totalCount: 0,
    totalPages: 0,
    currentPage: 1,
    limit: 20,
  });

  const { apiFetch, token } = useAuth();

  const fetchAssets = useCallback(async (page = 1, limit = 20) => {
    setLoading(true);
    try {
      let url = `/api/v1/assets?page=${page}&limit=${limit}`;
      if (mimeTypeFilter) {
        url += `&mimeType=${encodeURIComponent(mimeTypeFilter)}`;
      }

      const res = await apiFetch(url);
      if (res.ok) {
        const body: ApiResponse<{ assets: Asset[]; pagination: any }> = await res.json();
        setAssets(body.data.assets);
        setPagination(body.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    } finally {
      setLoading(false);
    }
  }, [apiFetch, mimeTypeFilter]);

  const searchAssets = useCallback(async (query: string) => {
    if (!query.trim()) {
      return fetchAssets(1);
    }
    setLoading(true);
    try {
      const res = await apiFetch(`/api/v1/assets/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const body: ApiResponse<Asset[]> = await res.json();
        setAssets(body.data);
        setPagination({
          totalCount: body.data.length,
          totalPages: 1,
          currentPage: 1,
          limit: body.data.length || 20,
        });
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  }, [apiFetch, fetchAssets]);

  const uploadAssetFile = (file: File, onProgress: (progress: number) => void): Promise<Asset> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', file);

      xhr.open('POST', '/api/v1/upload');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const body = JSON.parse(xhr.responseText);
            const asset: Asset = body.data;
            // Instantly insert pending asset at top of list
            setAssets((prev) => [asset, ...prev]);
            resolve(asset);
          } catch (err) {
            reject(new Error('Invalid server upload response'));
          }
        } else {
          try {
            const body = JSON.parse(xhr.responseText);
            reject(new Error(body.message || 'Upload failed'));
          } catch {
            reject(new Error('Upload failed'));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error occurred during image upload'));
      };

      xhr.send(formData);
    });
  };

  const updateAssetOriginalName = async (id: string, originalName: string) => {
    try {
      const res = await apiFetch(`/api/v1/assets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalName }),
      });

      if (res.ok) {
        const body: ApiResponse<Asset> = await res.json();
        const updated = body.data;
        setAssets((prev) => prev.map((item) => (item.id === id ? updated : item)));
        if (activeAsset?.id === id) {
          setActiveAsset(updated);
        }
      } else {
        const body = await res.json();
        throw new Error(body.message || 'Failed to update name');
      }
    } catch (error) {
      console.error('Error renaming asset:', error);
      throw error;
    }
  };

  const deleteAssetById = async (id: string) => {
    try {
      const res = await apiFetch(`/api/v1/assets/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setAssets((prev) => prev.filter((item) => item.id !== id));
        if (activeAsset?.id === id) {
          setActiveAsset(null);
        }
      } else {
        const body = await res.json();
        throw new Error(body.message || 'Failed to delete asset');
      }
    } catch (error) {
      console.error('Error deleting asset:', error);
      throw error;
    }
  };

  const updateAssetInList = useCallback((updatedAsset: Asset) => {
    setAssets((prev) => prev.map((item) => (item.id === updatedAsset.id ? updatedAsset : item)));
    // If it's currently open in the metadata panel, refresh details
    setActiveAsset((curr) => (curr?.id === updatedAsset.id ? updatedAsset : curr));
  }, []);

  return (
    <AssetContext.Provider
      value={{
        assets,
        loading,
        searchQuery,
        mimeTypeFilter,
        activeAsset,
        pagination,
        setSearchQuery,
        setMimeTypeFilter,
        setActiveAsset,
        fetchAssets,
        searchAssets,
        uploadAssetFile,
        updateAssetOriginalName,
        deleteAssetById,
        updateAssetInList,
      }}
    >
      {children}
    </AssetContext.Provider>
  );
};

export const useAssets = () => {
  const context = useContext(AssetContext);
  if (context === undefined) {
    throw new Error('useAssets must be used within an AssetProvider');
  }
  return context;
};
