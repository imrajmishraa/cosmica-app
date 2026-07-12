import React, { useState, useRef } from 'react';
import { UploadCloud, FileImage, X, AlertTriangle } from 'lucide-react';
import { useAssets } from '../context/AssetContext.js';

export const UploadArea: React.FC = () => {
  const { uploadAssetFile } = useAssets();
  const [dragging, setDragging] = useState(false);
  const [uploads, setUploads] = useState<{ id: string; name: string; progress: number; error?: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragging(true);
    } else if (e.type === 'dragleave') {
      setDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const processFiles = (fileList: FileList) => {
    Array.from(fileList).forEach((file) => {
      // Basic client-side check
      if (!file.type.startsWith('image/')) {
        const id = Math.random().toString(36).substring(7);
        setUploads((prev) => [...prev, { id, name: file.name, progress: 0, error: 'Only image uploads are allowed' }]);
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        const id = Math.random().toString(36).substring(7);
        setUploads((prev) => [...prev, { id, name: file.name, progress: 0, error: 'Image exceeds 10MB limit' }]);
        return;
      }

      const uploadId = Math.random().toString(36).substring(7);
      const newUpload = { id: uploadId, name: file.name, progress: 0 };
      setUploads((prev) => [...prev, newUpload]);

      uploadAssetFile(file, (progress) => {
        setUploads((prev) =>
          prev.map((item) => (item.id === uploadId ? { ...item, progress } : item))
        );
      })
        .then(() => {
          // Remove from active uploads list after 2.5 seconds upon success
          setTimeout(() => {
            setUploads((prev) => prev.filter((item) => item.id !== uploadId));
          }, 2500);
        })
        .catch((err) => {
          setUploads((prev) =>
            prev.map((item) => (item.id === uploadId ? { ...item, error: err.message || 'Upload failed' } : item))
          );
        });
    });
  };

  const removeUpload = (id: string) => {
    setUploads((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div style={{ marginBottom: '32px' }}>
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        className="glass-panel"
        style={{
          border: dragging ? '2px dashed hsl(var(--accent))' : '2px dashed rgba(255, 255, 255, 0.1)',
          borderRadius: 'var(--radius-lg)',
          padding: '40px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all var(--transition-normal)',
          backgroundColor: dragging ? 'rgba(0, 240, 255, 0.02)' : 'rgba(25, 25, 35, 0.15)',
          boxShadow: dragging ? '0 0 30px 0 hsl(var(--accent) / 0.05)' : 'none',
        }}
        onMouseOver={(e) => {
          if (!dragging) {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.backgroundColor = 'rgba(25, 25, 35, 0.25)';
          }
        }}
        onMouseOut={(e) => {
          if (!dragging) {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.backgroundColor = 'rgba(25, 25, 35, 0.15)';
          }
        }}
      >
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
        <UploadCloud
          size={48}
          style={{
            color: dragging ? 'hsl(var(--accent))' : 'hsl(var(--text-secondary))',
            marginBottom: '16px',
            transition: 'color var(--transition-fast)',
          }}
        />
        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
          Drag & Drop Images Here
        </h3>
        <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '14px' }}>
          Supports JPEG, PNG, WebP, GIF, TIFF, and AVIF up to 10MB (sniffs magic bytes)
        </p>
      </div>

      {uploads.length > 0 && (
        <div
          style={{
            marginTop: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {uploads.map((item) => (
            <div
              key={item.id}
              className="glass-panel"
              style={{
                borderRadius: 'var(--radius-sm)',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                backgroundColor: 'rgba(20, 20, 28, 0.5)',
              }}
            >
              <FileImage size={24} style={{ color: item.error ? 'hsl(var(--error))' : 'hsl(var(--accent))' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '6px',
                  }}
                >
                  <p
                    style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.name}
                  </p>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: item.error ? 'hsl(var(--error))' : 'hsl(var(--text-secondary))',
                    }}
                  >
                    {item.error ? 'Failed' : `${item.progress}%`}
                  </span>
                </div>

                {item.error ? (
                  <p
                    style={{
                      fontSize: '12px',
                      color: 'hsl(var(--error))',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <AlertTriangle size={12} />
                    {item.error}
                  </p>
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '4px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '2px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${item.progress}%`,
                        height: '100%',
                        backgroundColor: item.progress === 100 ? 'hsl(var(--success))' : 'hsl(var(--accent))',
                        borderRadius: '2px',
                        transition: 'width 0.2s ease',
                      }}
                    />
                  </div>
                )}
              </div>
              <button
                onClick={() => removeUpload(item.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'hsl(var(--text-muted))',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseOver={(e) => (e.currentTarget.style.color = 'hsl(var(--text-primary))')}
                onMouseOut={(e) => (e.currentTarget.style.color = 'hsl(var(--text-muted))')}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
