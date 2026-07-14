import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Database, Users, HardDrive, RefreshCw, Trash2, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import type { Asset, ApiResponse } from '../types/index.js';

interface StatsData {
  totalAssets: number;
  totalUsers: number;
  totalSize: number;
  statusCounts: {
    PENDING: number;
    COMPLETED: number;
    FAILED: number;
  };
}

export const AdminDashboard: React.FC = () => {
  const { logout, apiFetch } = useAuth();

  const [stats, setStats] = useState<StatsData | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [, setLoadingStats] = useState(false);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Fetch Stats callback
  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await apiFetch('/api/v1/admin/stats');
      if (res.ok) {
        const body: ApiResponse<StatsData> = await res.json();
        setStats(body.data);
      }
    } catch (err) {
      console.error('Failed to load global metrics:', err);
    } finally {
      setLoadingStats(false);
    }
  }, [apiFetch]);

  // Fetch Assets callback
  const fetchAllAssets = useCallback(async () => {
    setLoadingAssets(true);
    try {
      let url = '/api/v1/admin/assets';
      if (statusFilter) {
        url += `?status=${statusFilter}`;
      }
      const res = await apiFetch(url);
      if (res.ok) {
        const body: ApiResponse<{ assets: Asset[] }> = await res.json();
        setAssets(body.data.assets);
      }
    } catch (err) {
      console.error('Failed to load global assets log:', err);
    } finally {
      setLoadingAssets(false);
    }
  }, [apiFetch, statusFilter]);

  // Initial load
  useEffect(() => {
    fetchStats();
    fetchAllAssets();
  }, [fetchStats, fetchAllAssets]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to force-delete this asset? This action will permanently remove files from the storage service and wipe the database record.')) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await apiFetch(`/api/v1/admin/assets/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        // Refresh local listings and stats
        setAssets((prev) => prev.filter((item) => item.id !== id));
        fetchStats();
      }
    } catch (err) {
      alert('Delete override failed.');
    } finally {
      setDeletingId(null);
    }
  };

  // Size formatting helper
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Thumbnail source generator
  const getThumbnailSrc = (asset: Asset) => {
    if (asset.status === 'COMPLETED' && asset.thumbnailPath) {
      const parts = asset.thumbnailPath.split('/');
      const filename = parts[parts.length - 1];
      return `/uploads/${filename}`;
    }
    return '';
  };

  return (
    <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Admin Navbar */}
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
          <Database size={24} style={{ color: 'hsl(var(--accent))' }} />
          <h1 className="title-glow" style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '0.02em' }}>
            COSMICA <span style={{ color: 'hsl(var(--accent))', fontSize: '14px', fontWeight: 600 }}>ADMIN CONTROL</span>
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link
            to="/"
            className="btn btn-secondary"
            style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowLeft size={14} /> Back to Gallery
          </Link>
          <button
            onClick={logout}
            className="btn btn-secondary"
            style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <LogOut size={14} /> Log Out
          </button>
        </div>
      </header>

      {/* Admin Workspace */}
      <main style={{ flex: 1, padding: '40px', maxWidth: '1440px', width: '100%', margin: '0 auto' }}>
        
        {/* Metrics Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '24px',
            marginBottom: '40px',
          }}
        >
          {/* Card 1: Total Storage */}
          <div className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ backgroundColor: 'rgba(0, 240, 255, 0.08)', padding: '12px', borderRadius: 'var(--radius-md)', color: 'hsl(var(--accent))' }}>
              <HardDrive size={28} />
            </div>
            <div>
              <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                StorageFootprint
              </p>
              <h3 style={{ fontSize: '24px', fontWeight: 700 }}>
                {stats ? formatBytes(stats.totalSize) : '...'}
              </h3>
            </div>
          </div>

          {/* Card 2: Total Assets */}
          <div className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ backgroundColor: 'rgba(124, 58, 237, 0.08)', padding: '12px', borderRadius: 'var(--radius-md)', color: 'hsl(var(--primary-hover))' }}>
              <Database size={28} />
            </div>
            <div>
              <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                Total Assets
              </p>
              <h3 style={{ fontSize: '24px', fontWeight: 700 }}>
                {stats ? stats.totalAssets : '...'}
              </h3>
            </div>
          </div>

          {/* Card 3: Total Accounts */}
          <div className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: 'var(--radius-md)', color: '#fff' }}>
              <Users size={28} />
            </div>
            <div>
              <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                User Accounts
              </p>
              <h3 style={{ fontSize: '24px', fontWeight: 700 }}>
                {stats ? stats.totalUsers : '...'}
              </h3>
            </div>
          </div>

          {/* Card 4: Status Distribution */}
          <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <p style={{ fontSize: '12px', color: 'hsl(var(--text-secondary))', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              Queue Distribution
            </p>
            <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
              <div>
                <span className="badge badge-success" style={{ padding: '2px 8px', fontSize: '10px' }}>COMP</span>:{' '}
                <strong style={{ color: '#fff' }}>{stats?.statusCounts.COMPLETED ?? 0}</strong>
              </div>
              <div>
                <span className="badge badge-pending" style={{ padding: '2px 8px', fontSize: '10px' }}>PEND</span>:{' '}
                <strong style={{ color: '#fff' }}>{stats?.statusCounts.PENDING ?? 0}</strong>
              </div>
              <div>
                <span className="badge badge-error" style={{ padding: '2px 8px', fontSize: '10px' }}>FAIL</span>:{' '}
                <strong style={{ color: '#fff' }}>{stats?.statusCounts.FAILED ?? 0}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Global Asset Table Log Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Global Media Registry</h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))' }}>Filter Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                backgroundColor: 'rgba(10, 10, 15, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#fff',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                outline: 'none',
              }}
            >
              <option value="">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>

            <button
              onClick={() => {
                fetchStats();
                fetchAllAssets();
              }}
              className="btn btn-secondary"
              style={{ padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Global Registry Table */}
        <div className="glass-panel" style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          {loadingAssets && assets.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <Loader2 size={32} className="animate-spin" style={{ color: 'hsl(var(--accent))', margin: '0 auto 12px' }} />
              <p style={{ color: 'hsl(var(--text-secondary))' }}>Loading system logs...</p>
            </div>
          ) : assets.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
              <AlertCircle size={32} style={{ margin: '0 auto 12px' }} />
              <p>No asset records match the filter.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                    <th style={{ padding: '16px 20px', color: 'hsl(var(--text-secondary))', fontWeight: 600 }}>Media</th>
                    <th style={{ padding: '16px 20px', color: 'hsl(var(--text-secondary))', fontWeight: 600 }}>Original Name</th>
                    <th style={{ padding: '16px 20px', color: 'hsl(var(--text-secondary))', fontWeight: 600 }}>Size</th>
                    <th style={{ padding: '16px 20px', color: 'hsl(var(--text-secondary))', fontWeight: 600 }}>Owner Account</th>
                    <th style={{ padding: '16px 20px', color: 'hsl(var(--text-secondary))', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '16px 20px', color: 'hsl(var(--text-secondary))', fontWeight: 600 }}>Date Ingested</th>
                    <th style={{ padding: '16px 20px', color: 'hsl(var(--text-secondary))', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((item) => (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                        transition: 'background-color var(--transition-fast)',
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.01)')}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '14px 20px' }}>
                        <div
                          style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '4px',
                            backgroundColor: '#07070b',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            overflow: 'hidden',
                            border: '1px solid rgba(255,255,255,0.05)',
                          }}
                        >
                          {item.status === 'COMPLETED' ? (
                            <img src={getThumbnailSrc(item)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <Loader2 size={16} className={item.status === 'PENDING' ? 'animate-spin' : ''} style={{ color: item.status === 'PENDING' ? 'hsl(var(--primary))' : 'hsl(var(--error))' }} />
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px', fontWeight: 500, maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.originalName}
                      </td>
                      <td style={{ padding: '14px 20px', color: 'hsl(var(--text-secondary))' }}>
                        {formatBytes(item.size)}
                      </td>
                      <td style={{ padding: '14px 20px', color: 'hsl(var(--accent))', fontWeight: 500 }}>
                        {item.user?.email || 'Unknown User'}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        {item.status === 'COMPLETED' ? (
                          <span className="badge badge-success" style={{ padding: '2px 8px', fontSize: '10px' }}>Completed</span>
                        ) : item.status === 'PENDING' ? (
                          <span className="badge badge-pending" style={{ padding: '2px 8px', fontSize: '10px' }}>Pending</span>
                        ) : (
                          <span className="badge badge-error" style={{ padding: '2px 8px', fontSize: '10px' }}>Failed</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 20px', color: 'hsl(var(--text-secondary))' }}>
                        {new Date(item.createdAt).toLocaleString()}
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <button
                          disabled={deletingId === item.id}
                          onClick={() => handleDelete(item.id)}
                          className="btn btn-danger"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          {deletingId === item.id ? 'Deleting...' : <Trash2 size={13} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
