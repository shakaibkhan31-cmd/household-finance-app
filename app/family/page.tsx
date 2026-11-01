'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  Users, UserPlus, Shield, Trash2, CheckCircle2, 
  ArrowLeft, ToggleLeft, ToggleRight, Search, Edit3, X, Check, Lock
} from 'lucide-react';

interface Permissions {
  dashboard: boolean;
  transactions: boolean;
  accounts: boolean;
  income: boolean;
  budgets: boolean;
  goals: boolean;
  bills: boolean;
  debts: boolean;
}

interface FamilyMember {
  id: string;
  member_name: string;
  member_email: string;
  role: 'admin' | 'editor' | 'viewer';
  permissions: Permissions;
  created_at: string;
}

const defaultPermissions: Permissions = {
  dashboard: true,
  transactions: true,
  accounts: false,
  income: true,
  budgets: true,
  goals: false,
  bills: true,
  debts: false
};

export default function FamilyManagementPage() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'editor' | 'viewer'>('editor');
  const [perms, setPerms] = useState<Permissions>(defaultPermissions);
  
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) console.error(error.message);
      else setMembers(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (members.length >= 5) {
      setError('Aap max 5 family members hi add kar sakte hain.');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('family_members').insert([
        {
          owner_id: user.id,
          member_name: name.trim(),
          member_email: email.trim().toLowerCase(),
          role,
          permissions: perms
        }
      ]);

      if (error) {
        setError(error.message);
      } else {
        setMessage('Family member access privileges ke sath successfully add ho gaya!');
        resetForm();
        setIsAdding(false);
        fetchMembers();
        setTimeout(() => setMessage(''), 4000);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    try {
      const { error } = await supabase
        .from('family_members')
        .update({
          member_name: editingMember.member_name,
          role: editingMember.role,
          permissions: editingMember.permissions
        })
        .eq('id', editingMember.id);

      if (error) {
        setError(error.message);
      } else {
        setMessage('Member access rights update ho gaye hain!');
        setEditingMember(null);
        fetchMembers();
        setTimeout(() => setMessage(''), 4000);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!confirm('Kya aap is family member ka access revoke karna chahte hain?')) return;

    const { error } = await supabase.from('family_members').delete().eq('id', id);
    if (!error) {
      fetchMembers();
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setRole('editor');
    setPerms(defaultPermissions);
  };

  const togglePermission = (key: keyof Permissions, isEditMode = false) => {
    if (isEditMode && editingMember) {
      setEditingMember({
        ...editingMember,
        permissions: {
          ...editingMember.permissions,
          [key]: !editingMember.permissions[key]
        }
      });
    } else {
      setPerms(prev => ({ ...prev, [key]: !prev[key] }));
    }
  };

  const filteredMembers = members.filter(m => 
    m.member_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.member_email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6 md:p-12 transition-colors">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-6 gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
              <Users className="w-4 h-4" /> FAMILY & TEAM ACCESS
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Family Access Control Centre
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Apne account ka up to 5 family members tak granular module-level access set karein.
            </p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-sm self-start md:self-auto"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
        </div>

        {message && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* Controls Bar: Search & Add Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search member name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-slate-100 placeholder-slate-400"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Members: <span className="text-indigo-600 dark:text-indigo-400">{members.length}</span>/5
            </span>
            {members.length < 5 && (
              <button
                onClick={() => { setIsAdding(!isAdding); setEditingMember(null); }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20"
              >
                <UserPlus className="w-4 h-4" /> Add Family Member
              </button>
            )}
          </div>
        </div>

        {/* Add Member Form Panel */}
        {isAdding && (
          <form onSubmit={handleAddMember} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> New Member Configuration
              </h3>
              <button type="button" onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 text-xs rounded-xl">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Member Name</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Wajiha Khan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Member Email</label>
                <input
                  type="email"
                  required
                  placeholder="family@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Access Role</label>
                <select
                  value={role}
                  onChange={(e: any) => setRole(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500"
                >
                  <option value="editor">Editor (Can add & view)</option>
                  <option value="viewer">Viewer (Read-only)</option>
                  <option value="admin">Admin (Full Control)</option>
                </select>
              </div>
            </div>

            {/* Granular Module Toggles */}
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <label className="block text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                Module Visibility Permissions:
              </label>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.keys(perms).map((key) => {
                  const permKey = key as keyof Permissions;
                  const isAllowed = perms[permKey];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => togglePermission(permKey)}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                        isAllowed 
                          ? 'bg-indigo-600/10 border-indigo-500/40 text-indigo-900 dark:text-white font-semibold' 
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      <span className="text-xs capitalize">{key}</span>
                      {isAllowed ? (
                        <ToggleRight className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-slate-400 dark:text-slate-600" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition shadow-md shadow-indigo-600/20"
              >
                Save Member Access
              </button>
            </div>
          </form>
        )}

        {/* Edit Permissions Modal */}
        {editingMember && (
          <form onSubmit={handleUpdateMember} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Edit Permissions: {editingMember.member_name}
              </h3>
              <button type="button" onClick={() => setEditingMember(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Member Name</label>
                <input
                  type="text"
                  required
                  value={editingMember.member_name}
                  onChange={(e) => setEditingMember({ ...editingMember, member_name: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Access Role</label>
                <select
                  value={editingMember.role}
                  onChange={(e: any) => setEditingMember({ ...editingMember, role: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500"
                >
                  <option value="editor">Editor (Can add & view)</option>
                  <option value="viewer">Viewer (Read-only)</option>
                  <option value="admin">Admin (Full Control)</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <label className="block text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                Module Visibility Permissions:
              </label>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.keys(editingMember.permissions).map((key) => {
                  const permKey = key as keyof Permissions;
                  const isAllowed = editingMember.permissions[permKey];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => togglePermission(permKey, true)}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                        isAllowed 
                          ? 'bg-indigo-600/10 border-indigo-500/40 text-indigo-900 dark:text-white font-semibold' 
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      <span className="text-xs capitalize">{key}</span>
                      {isAllowed ? (
                        <ToggleRight className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-slate-400 dark:text-slate-600" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition shadow-md shadow-indigo-600/20"
              >
                Update Rights
              </button>
            </div>
          </form>
        )}

        {/* Member List Table */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading family members...</div>
          ) : filteredMembers.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <Users className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto" />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {searchQuery ? 'Koi matching family member nahi mila.' : 'Abhi tak koi family member add nahi kiya gaya hai.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="p-4">Member Details</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Allowed Tabs Access</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                  {filteredMembers.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                      <td className="p-4">
                        <div className="font-bold text-slate-900 dark:text-white">{m.member_name}</div>
                        <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-mono">{m.member_email}</div>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase">
                          {m.role || 'Editor'}
                        </span>
                      </td>
                      <td className="p-4 max-w-xs">
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(m.permissions || {}).map(([tab, allowed]) => (
                            allowed ? (
                              <span key={tab} className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] capitalize font-medium">
                                {tab}
                              </span>
                            ) : (
                              <span key={tab} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 text-[10px] capitalize font-medium line-through">
                                {tab}
                              </span>
                            )
                          ))}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setEditingMember(m); setIsAdding(false); }}
                            className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition cursor-pointer"
                            title="Edit Permissions"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMember(m.id)}
                            className="p-1.5 text-rose-500 dark:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                            title="Revoke Access"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
}