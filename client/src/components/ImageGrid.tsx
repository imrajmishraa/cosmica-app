import React from 'react';
import { Image } from 'lucide-react';
import { useAssets } from '../context/AssetContext.js';
import { AssetCard } from './AssetCard.js';

export const ImageGrid: React.FC = () => {
  const { assets, loading } = useAssets();

  if (loading && assets.length === 0) {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '24px',
          width: '100%',
        }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="glass-card"
            style={{
              height: '280px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'pulse-glow 1.5s infinite ease-in-out',
            }}
          >
            <div style={{ flex: 1, backgroundColor: '#07070b' }} />
            <div style={{ padding: '16px', backgroundColor: 'rgba(15, 15, 22, 0.4)' }}>
              <div style={{ height: '14px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px', marginBottom: '8px', width: '70%' }} />
              <div style={{ height: '12px', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '4px', width: '40%' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div
        className="glass-panel"
        style={{
          borderRadius: 'var(--radius-lg)',
          padding: '64px 24px',
          textAlign: 'center',
          backgroundColor: 'rgba(25, 25, 35, 0.1)',
        }}
      >
        <Image
          size={56}
          style={{
            color: 'hsl(var(--text-muted))',
            marginBottom: '20px',
          }}
        />
        <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>
          No Media Assets Found
        </h3>
        <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '15px', maxWidth: '400px', margin: '0 auto' }}>
          Drag and drop images into the ingestion area above to process them and generate detailed EXIF metadata.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '24px',
        width: '100%',
        paddingBottom: '40px',
      }}
    >
      {assets.map((asset) => (
        <AssetCard key={asset.id} asset={asset} />
      ))}
    </div>
  );
};
