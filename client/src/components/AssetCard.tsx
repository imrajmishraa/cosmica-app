import React, { useEffect, useState, useRef } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import type { Asset, ApiResponse } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';
import { useAssets } from '../context/AssetContext.js';

interface AssetCardProps {
  asset: Asset;
}

export const AssetCard: React.FC<AssetCardProps> = ({ asset }) => {
  const { apiFetch } = useAuth();
  const { updateAssetInList, setActiveAsset } = useAssets();
  const [currentAsset, setCurrentAsset] = useState<Asset>(asset);
  const pollerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync state if prop changes from parent (e.g., search refresh)
  useEffect(() => {
    setCurrentAsset(asset);
  }, [asset]);

  // Poller effect for background processing updates
  useEffect(() => {
    if (currentAsset.status === 'PENDING') {
      const pollStatus = async () => {
        try {
          const res = await apiFetch(`/api/v1/assets/${currentAsset.id}`);
          if (res.ok) {
            const body: ApiResponse<Asset> = await res.json();
            const updated = body.data;
            if (updated.status !== 'PENDING') {
              setCurrentAsset(updated);
              updateAssetInList(updated);
              if (pollerRef.current) {
                clearInterval(pollerRef.current);
                pollerRef.current = null;
              }
            }
          }
        } catch (error) {
          console.error('Polling status check failed:', error);
        }
      };

      pollerRef.current = setInterval(pollStatus, 2500);
    }

    return () => {
      if (pollerRef.current) {
        clearInterval(pollerRef.current);
        pollerRef.current = null;
      }
    };
  }, [currentAsset.id, currentAsset.status, apiFetch, updateAssetInList]);

  // Format file size utility
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const getStatusBadge = () => {
    switch (currentAsset.status) {
      case 'PENDING':
        return (
          <span className="badge badge-pending">
            <Loader2 size={10} className="animate-spin" /> Processing
          </span>
        );
      case 'FAILED':
        return (
          <span className="badge badge-error">
            <AlertCircle size={10} /> Failed
          </span>
        );
      default:
        return (
          <span className="badge badge-success" style={{ padding: '2px 8px', fontSize: '10px' }}>
            {currentAsset.metadata?.format || currentAsset.mimeType.split('/')[1] || 'image'}
          </span>
        );
    }
  };

  // Determine thumbnail path: backend uses static /uploads
  const getThumbnailSrc = () => {
    if (currentAsset.status === 'COMPLETED' && currentAsset.thumbnailPath) {
      // Backend thumbnailPath is saved as relative (e.g. uploads/thumbnail-xxx.webp)
      // Since server app.use('/uploads', express.static(ENV.UPLOAD_DIR)) is mapped:
      // The local URL should point to /uploads/thumbnail-xxx.webp
      const parts = currentAsset.thumbnailPath.split('/');
      const filename = parts[parts.length - 1];
      return `/uploads/${filename}`;
    }
    return '';
  };

  return (
    <div
      onClick={() => currentAsset.status !== 'PENDING' && setActiveAsset(currentAsset)}
      className="glass-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '280px',
        overflow: 'hidden',
        cursor: currentAsset.status === 'PENDING' ? 'not-allowed' : 'pointer',
        position: 'relative',
        opacity: currentAsset.status === 'PENDING' ? 0.75 : 1,
      }}
    >
      {/* Thumbnail Preview Area */}
      <div
        style={{
          flex: 1,
          backgroundColor: '#07070b',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {currentAsset.status === 'COMPLETED' ? (
          <img
            src={getThumbnailSrc()}
            alt={currentAsset.originalName}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform var(--transition-normal)',
            }}
            onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          />
        ) : currentAsset.status === 'PENDING' ? (
          <div style={{ textAlign: 'center', padding: '16px' }}>
            <Loader2 size={36} className="animate-spin" style={{ color: 'hsl(var(--primary))', marginBottom: '12px' }} />
            <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', fontWeight: 500 }}>
              Optimizing Image...
            </p>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '16px', color: 'hsl(var(--error))' }}>
            <AlertCircle size={36} style={{ marginBottom: '8px' }} />
            <p style={{ fontSize: '13px', fontWeight: 500 }}>Processing failed</p>
          </div>
        )}

        {/* Top Floating Badges */}
        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            right: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 1,
          }}
        >
          {getStatusBadge()}
        </div>
      </div>

      {/* Info Card Footer */}
      <div
        style={{
          padding: '14px 16px',
          backgroundColor: 'rgba(15, 15, 22, 0.4)',
          borderTop: '1px solid rgba(255, 255, 255, 0.03)',
        }}
      >
        <p
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'hsl(var(--text-primary))',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginBottom: '4px',
          }}
          title={currentAsset.originalName}
        >
          {currentAsset.originalName}
        </p>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            color: 'hsl(var(--text-secondary))',
          }}
        >
          <span>{formatBytes(currentAsset.size)}</span>
          {currentAsset.metadata?.width && currentAsset.metadata?.height && (
            <span>
              {currentAsset.metadata.width} × {currentAsset.metadata.height}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
