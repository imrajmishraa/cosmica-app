import React, { useState, useEffect } from 'react';
import { X, Trash2, Download, Check, Edit2, MapPin, Calendar, Camera, Info } from 'lucide-react';
import { useAssets } from '../context/AssetContext.js';

export const MetadataPanel: React.FC = () => {
  const { activeAsset, setActiveAsset, updateAssetOriginalName, deleteAssetById } = useAssets();
  const [newName, setNewName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Sync filename when asset changes
  useEffect(() => {
    if (activeAsset) {
      setNewName(activeAsset.originalName);
      setIsEditing(false);
      setConfirmDelete(false);
    }
  }, [activeAsset]);

  if (!activeAsset) return null;

  const handleRename = async () => {
    if (!newName.trim() || newName === activeAsset.originalName) {
      setIsEditing(false);
      return;
    }
    setRenaming(true);
    try {
      await updateAssetOriginalName(activeAsset.id, newName.trim());
      setIsEditing(false);
    } catch (err) {
      alert('Failed to rename asset. Ensure filename is valid.');
    } finally {
      setRenaming(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteAssetById(activeAsset.id);
      setActiveAsset(null);
    } catch (err) {
      alert('Failed to delete asset.');
    } finally {
      setDeleting(false);
    }
  };

  // Extract medium size filename
  const getMediumSrc = () => {
    if (activeAsset.mediumPath) {
      const parts = activeAsset.mediumPath.split('/');
      return `/uploads/${parts[parts.length - 1]}`;
    }
    // Fallback to original path if medium is missing
    if (activeAsset.path) {
      const parts = activeAsset.path.split('/');
      return `/uploads/${parts[parts.length - 1]}`;
    }
    return '';
  };

  // Extract original size filename for download
  const getOriginalSrc = () => {
    if (activeAsset.path) {
      const parts = activeAsset.path.split('/');
      return `/uploads/${parts[parts.length - 1]}`;
    }
    return '';
  };

  const hasGPS = activeAsset.metadata?.latitude !== null && activeAsset.metadata?.longitude !== null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: 100,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      {/* Backdrop blur */}
      <div
        onClick={() => setActiveAsset(null)}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(5, 5, 8, 0.65)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      />

      {/* Slide-over panel */}
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '460px',
          height: '100%',
          zIndex: 101,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.8)',
        }}
      >
        {/* Header bar */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Asset Inspector</h2>
          <button
            onClick={() => setActiveAsset(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'hsl(var(--text-secondary))',
              cursor: 'pointer',
              display: 'flex',
              padding: '6px',
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseOut={(e) => (e.currentTarget.style.color = 'hsl(var(--text-secondary))')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable details */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {/* Main Preview */}
          <div
            style={{
              width: '100%',
              height: '240px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#07070b',
              overflow: 'hidden',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              marginBottom: '24px',
            }}
          >
            <img
              src={getMediumSrc()}
              alt={activeAsset.originalName}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>

          {/* Action Row */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              marginBottom: '28px',
            }}
          >
            <a
              href={getOriginalSrc()}
              download={activeAsset.originalName}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
              style={{ flex: 1, fontSize: '14px', padding: '10px 16px' }}
            >
              <Download size={16} /> Download
            </a>

            {confirmDelete ? (
              <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                <button
                  disabled={deleting}
                  onClick={handleDelete}
                  className="btn btn-danger"
                  style={{ flex: 1, fontSize: '13px', padding: '10px 8px' }}
                >
                  {deleting ? 'Deleting...' : 'Confirm'}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="btn btn-secondary"
                  style={{ fontSize: '13px', padding: '10px 12px' }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="btn btn-danger"
                style={{ flex: 0.8, fontSize: '14px', padding: '10px 16px' }}
              >
                <Trash2 size={16} /> Delete
              </button>
            )}
          </div>

          {/* Rename Section */}
          <div style={{ marginBottom: '28px' }}>
            <h4
              style={{
                fontSize: '13px',
                color: 'hsl(var(--text-muted))',
                textTransform: 'uppercase',
                fontWeight: 600,
                letterSpacing: '0.05em',
                marginBottom: '10px',
              }}
            >
              File Name
            </h4>
            {isEditing ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="form-input"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  style={{ flex: 1, padding: '8px 12px', fontSize: '14px' }}
                  autoFocus
                />
                <button
                  disabled={renaming}
                  onClick={handleRename}
                  className="btn btn-primary"
                  style={{ padding: '8px 12px' }}
                >
                  {renaming ? '...' : <Check size={16} />}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '16px', fontWeight: 600, wordBreak: 'break-all' }}>
                  {activeAsset.originalName}
                </span>
                <button
                  onClick={() => setIsEditing(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'hsl(var(--accent))',
                    cursor: 'pointer',
                    padding: '6px',
                  }}
                >
                  <Edit2 size={16} />
                </button>
              </div>
            )}
          </div>

          {/* EXIF Information Grid */}
          <div>
            <h4
              style={{
                fontSize: '13px',
                color: 'hsl(var(--text-muted))',
                textTransform: 'uppercase',
                fontWeight: 600,
                letterSpacing: '0.05em',
                marginBottom: '14px',
              }}
            >
              EXIF & Physical Metadata
            </h4>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {/* Properties row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <span style={{ color: 'hsl(var(--text-secondary))', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Info size={14} /> Dimensions
                </span>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>
                  {activeAsset.metadata?.width && activeAsset.metadata?.height
                    ? `${activeAsset.metadata.width} × ${activeAsset.metadata.height}`
                    : 'Unknown'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <span style={{ color: 'hsl(var(--text-secondary))', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Camera size={14} /> Camera Brand
                </span>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>
                  {activeAsset.metadata?.cameraMake || 'Unknown'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <span style={{ color: 'hsl(var(--text-secondary))', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Camera size={14} /> Camera Model
                </span>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>
                  {activeAsset.metadata?.cameraModel || 'Unknown'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <span style={{ color: 'hsl(var(--text-secondary))', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Camera size={14} /> Aperture / ISO
                </span>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>
                  {activeAsset.metadata?.aperture ? `f/${activeAsset.metadata.aperture}` : '—'}
                  {activeAsset.metadata?.iso ? ` · ISO ${activeAsset.metadata.iso}` : ''}
                  {!activeAsset.metadata?.aperture && !activeAsset.metadata?.iso ? 'Unknown' : ''}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <span style={{ color: 'hsl(var(--text-secondary))', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Camera size={14} /> Exposure Time
                </span>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>
                  {activeAsset.metadata?.exposureTime || 'Unknown'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <span style={{ color: 'hsl(var(--text-secondary))', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={14} /> Capture Date
                </span>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>
                  {activeAsset.metadata?.takenAt
                    ? new Date(activeAsset.metadata.takenAt).toLocaleString()
                    : 'Unknown'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
                <span style={{ color: 'hsl(var(--text-secondary))', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={14} /> Geolocation
                </span>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>
                  {hasGPS ? (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${activeAsset.metadata?.latitude},${activeAsset.metadata?.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: 'hsl(var(--accent))', textDecoration: 'none', fontWeight: 600 }}
                      onMouseOver={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                      onMouseOut={(e) => (e.currentTarget.style.textDecoration = 'none')}
                    >
                      View on Maps
                    </a>
                  ) : (
                    'None'
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
