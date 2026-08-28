import React, { useEffect, useState } from 'react';
import { Shield, CheckCircle2, XCircle, Clock, User, Building, RefreshCw, LogOut } from 'lucide-react';
import { apiGetPendingUsers, apiGetAllAdminUsers, apiVerifyUser, apiRejectUser } from '../services/authApi';

interface AdminViewProps {
  onNavigate: (view: string) => void;
  onLogout: () => void;
}

interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
  organization: string;
  designation: string;
  account_status: string;
  is_verified: boolean;
  created_at: string;
}

const ROLE_LABELS: Record<string, string> = {
  ISRO_SCIENTIST: 'ISRO Scientist',
  MARINE_ANALYST: 'Marine Analyst',
  COAST_GUARD: 'Coast Guard',
  FISHERMAN: 'Fisherman',
  PUBLIC_RESEARCHER: 'Public Researcher',
  ADMIN: 'Admin',
};

const STATUS_CHIP: Record<string, string> = {
  PENDING_VERIFICATION: 'bg-amber-100 text-amber-800',
  ACTIVE: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-red-100 text-red-700',
};

const STATUS_LABEL: Record<string, string> = {
  PENDING_VERIFICATION: 'Pending',
  ACTIVE: 'Active',
  REJECTED: 'Rejected',
};

export const AdminView: React.FC<AdminViewProps> = ({ onNavigate, onLogout }) => {
  const [pendingUsers, setPendingUsers] = useState<AdminUser[]>([]);
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [tab, setTab] = useState<'pending' | 'all'>('pending');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);

  const load = async () => {
    setLoading(true);
    const [pending, all] = await Promise.all([apiGetPendingUsers(), apiGetAllAdminUsers()]);
    setPendingUsers(pending);
    setAllUsers(all);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const showToast = (text: string, ok: boolean) => {
    setToast({ text, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const handleVerify = async (user: AdminUser) => {
    setActionId(user.id);
    const ok = await apiVerifyUser(user.id);
    showToast(ok ? `${user.full_name} verified and activated` : 'Verification failed', ok);
    if (ok) await load();
    setActionId(null);
  };

  const handleReject = async (user: AdminUser) => {
    setActionId(user.id);
    const ok = await apiRejectUser(user.id);
    showToast(ok ? `${user.full_name} rejected` : 'Rejection failed', ok);
    if (ok) await load();
    setActionId(null);
  };

  const displayUsers = tab === 'pending' ? pendingUsers : allUsers;

  return (
    <div className="min-h-screen bg-[#F7F7F5] p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#111111] rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h1 className="text-lg font-black text-[#111111]">MATSYA AI Admin</h1>
              <p className="text-xs text-[#666666]">User Verification Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              disabled={loading}
              className="p-2 text-[#666666] hover:text-[#111111] hover:bg-white rounded-lg transition disabled:opacity-40"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => onNavigate('home')}
              className="px-3 py-1.5 bg-white border border-[#E5E5E5] rounded-lg text-xs font-semibold text-[#111111] hover:bg-[#F0F0F0] transition"
            >
              Home
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111111] text-white rounded-lg text-xs font-semibold hover:bg-black transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`mb-4 p-3 rounded-xl text-sm font-medium border ${toast.ok ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
            {toast.text}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-[#E5E5E5] rounded-xl p-1 mb-4 w-fit">
          <button
            onClick={() => setTab('pending')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${tab === 'pending' ? 'bg-[#111111] text-white' : 'text-[#666666] hover:text-[#111111]'}`}
          >
            <Clock className="w-3 h-3" />
            Pending
            {pendingUsers.length > 0 && (
              <span className="bg-amber-500 text-white rounded-full px-1.5 py-0.5 text-[10px] leading-none">
                {pendingUsers.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('all')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${tab === 'all' ? 'bg-[#111111] text-white' : 'text-[#666666] hover:text-[#111111]'}`}
          >
            All Users ({allUsers.length})
          </button>
        </div>

        {/* Table card */}
        <div className="bg-white border border-[#E5E5E5] rounded-2xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-[#CCCCCC] border-t-[#111111] rounded-full animate-spin" />
            </div>
          ) : displayUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              <p className="text-sm font-semibold text-[#333333]">
                {tab === 'pending' ? 'No pending verifications' : 'No users found'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E5E5E5] bg-[#F7F7F5]">
                    <th className="text-left text-[10px] font-bold text-[#888888] uppercase tracking-wide px-4 py-3">User</th>
                    <th className="text-left text-[10px] font-bold text-[#888888] uppercase tracking-wide px-4 py-3 hidden sm:table-cell">Role</th>
                    <th className="text-left text-[10px] font-bold text-[#888888] uppercase tracking-wide px-4 py-3 hidden md:table-cell">Organization</th>
                    <th className="text-left text-[10px] font-bold text-[#888888] uppercase tracking-wide px-4 py-3 hidden lg:table-cell">Registered</th>
                    <th className="text-left text-[10px] font-bold text-[#888888] uppercase tracking-wide px-4 py-3">
                      {tab === 'pending' ? 'Actions' : 'Status'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayUsers.map((user, idx) => (
                    <tr key={user.id} className={`border-b border-[#F0F0F0] last:border-0 ${idx % 2 ? 'bg-[#FAFAFA]' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                            <User className="w-3.5 h-3.5 text-teal-700" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-[#111111] leading-tight">{user.full_name}</p>
                            <p className="text-[10px] text-[#888888]">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-xs text-[#555555]">{ROLE_LABELS[user.role] ?? user.role}</span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex items-center gap-1 text-xs text-[#555555]">
                          <Building className="w-3 h-3 text-[#AAAAAA] shrink-0" />
                          <span className="truncate max-w-[160px]">{user.organization || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-[10px] text-[#888888]">
                          {new Date(user.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {tab === 'pending' ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleVerify(user)}
                              disabled={actionId === user.id}
                              className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              Verify
                            </button>
                            <button
                              onClick={() => handleReject(user)}
                              disabled={actionId === user.id}
                              className="flex items-center gap-1 px-2.5 py-1 bg-white border border-red-300 hover:bg-red-50 text-red-700 text-[10px] font-bold rounded-lg transition disabled:opacity-50"
                            >
                              <XCircle className="w-3 h-3" />
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_CHIP[user.account_status] ?? 'bg-gray-100 text-gray-600'}`}>
                            {STATUS_LABEL[user.account_status] ?? user.account_status}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
