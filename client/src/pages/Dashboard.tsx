import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Search, Filter, RefreshCw, FolderPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useAssets } from '../context/AssetContext.js';
import { UploadArea } from '../components/UploadArea.js';
import { ImageGrid } from '../components/ImageGrid.js';
import { MetadataPanel } from '../components/MetadataPanel.js';

export const Dashboard: React.FC = () => {
  const { logout, user } = useAuth();
  const {
    fetchAssets,
    searchAssets,
    mimeTypeFilter,
    setMimeTypeFilter,
  } = useAssets();

  const [localSearch, setLocalSearch] = useState('');

  // Initial asset loading & filter changes hook
  useEffect(() => {
    fetchAssets(1);
  }, [fetchAssets, mimeTypeFilter]);

  // Search execution hook
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchAssets(localSearch);
  };

  const handleClearSearch = () => {
    setLocalSearch('');
    searchAssets('');
  };

  return (
    <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Sleek Glassmorphic Navbar */}
      <header
        className="glass-panel"
        style={{
          padding: '16px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FolderPlus size={24} style={{ color: 'hsl(var(--primary-hover))' }} />
          <h1 className="title-glow" style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '0.02em' }}>
            COSMICA
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ fontSize: '14px', color: 'hsl(var(--text-secondary))', fontWeight: 500 }}>
            Logged in as <strong style={{ color: '#fff' }}>{user?.email.split('@')[0]}</strong>
          </span>
          {user?.role === 'ADMIN' && (
            <Link
              to="/admin"
              className="btn btn-secondary"
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                borderColor: 'hsl(var(--accent) / 0.3)',
                color: 'hsl(var(--accent))',
                fontWeight: 600,
              }}
            >
              Admin View
            </Link>
          )}
          <button
            onClick={logout}
            className="btn btn-secondary"
            style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <LogOut size={14} /> Log Out
          </button>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main style={{ flex: 1, padding: '40px 40px 0', maxWidth: '1440px', width: '100%', margin: '0 auto' }}>
        {/* Upload Ingestion area */}
        <UploadArea />

        {/* Filters and Search Bar Row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px',
            marginBottom: '32px',
          }}
        >
          {/* Search form */}
          <form
            onSubmit={handleSearchSubmit}
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(10, 10, 15, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-sm)',
              padding: '2px 8px 2px 14px',
              maxWidth: '400px',
              width: '100%',
              transition: 'border-color var(--transition-fast)',
            }}
            onFocusCapture={(e) => (e.currentTarget.style.borderColor = 'hsl(var(--primary))')}
            onBlurCapture={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)')}
          >
            <Search size={18} style={{ color: 'hsl(var(--text-muted))', marginRight: '8px' }} />
            <input
              type="text"
              placeholder="Search filename, brand, format..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              style={{
                background: 'none',
                border: 'none',
                outline: 'none',
                color: '#fff',
                fontSize: '14px',
                height: '38px',
                width: '100%',
              }}
            />
            {localSearch && (
              <button
                type="button"
                onClick={handleClearSearch}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'hsl(var(--text-muted))',
                  cursor: 'pointer',
                  fontSize: '12px',
                  marginRight: '8px',
                }}
              >
                Clear
              </button>
            )}
            <button
              type="submit"
              className="btn btn-primary"
              style={{ padding: '6px 12px', fontSize: '13px', borderRadius: '4px' }}
            >
              Search
            </button>
          </form>

          {/* Filtering buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', marginRight: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Filter size={14} /> Filter:
            </span>
            {[
              { label: 'All Media', value: '' },
              { label: 'JPEG', value: 'jpeg' },
              { label: 'PNG', value: 'png' },
              { label: 'WebP', value: 'webp' },
              { label: 'GIF', value: 'gif' },
              { label: 'AVIF', value: 'avif' },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => setMimeTypeFilter(item.value)}
                className="btn"
                style={{
                  padding: '6px 14px',
                  fontSize: '13px',
                  borderRadius: '20px',
                  backgroundColor: mimeTypeFilter === item.value ? 'hsl(var(--primary))' : 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid',
                  borderColor: mimeTypeFilter === item.value ? 'hsl(var(--primary))' : 'rgba(255, 255, 255, 0.05)',
                  color: mimeTypeFilter === item.value ? '#fff' : 'hsl(var(--text-secondary))',
                  fontWeight: mimeTypeFilter === item.value ? 600 : 500,
                }}
                onMouseOver={(e) => {
                  if (mimeTypeFilter !== item.value) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.color = '#fff';
                  }
                }}
                onMouseOut={(e) => {
                  if (mimeTypeFilter !== item.value) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.color = 'hsl(var(--text-secondary))';
                  }
                }}
              >
                {item.label}
              </button>
            ))}

            <button
              onClick={() => fetchAssets(1)}
              className="btn btn-secondary"
              style={{ padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Refresh Asset Grid"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Gallery Image Grid */}
        <ImageGrid />
      </main>

      {/* Slide-over EXIF Inspector Panel */}
      <MetadataPanel />
    </div>
  );
};
