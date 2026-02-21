'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { community, type User } from '@/lib/api';
import { ROLES } from '@/lib/permissions';
import { Trash2 } from 'lucide-react';

export default function CommunityMembersPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    community.getMembers().then((r) => {
      if (r.success && r.data) setMembers((r.data as { members: User[] }).members);
      setLoading(false);
    });
  };

  useEffect(() => {
    if (user?.role !== ROLES.Manager) return;
    load();
  }, [user?.role]);

  const handleRemove = async (userId: string, memberName: string) => {
    if (!confirm(`Remove ${memberName} from the community?`)) return;
    try {
      const r = await community.removeMember(userId);
      if (r.success) load();
      else alert((r as { message?: string }).message || 'Failed to remove');
    } catch {
      alert('Failed to remove member');
    }
  };

  if (user?.role !== ROLES.Manager) return null;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold neon-text">Community Members</h1>
      <p className="mt-1 text-zinc-600">View and manage your community members</p>

      {loading ? (
        <div className="mt-8 h-10 w-10 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-700 text-left text-sm text-zinc-600">
                <th className="pb-3 pr-4">Name</th>
                <th className="pb-3 pr-4">Email</th>
                <th className="pb-3 pr-4">Role</th>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m._id} className="border-b border-zinc-800 text-sm">
                  <td className="py-3 pr-4 text-zinc-900">{m.name}</td>
                  <td className="py-3 pr-4 text-zinc-600">{m.email}</td>
                  <td className="py-3 pr-4">
                    <span className="rounded bg-teal-100 px-2 py-0.5 text-teal-800">{m.role}</span>
                  </td>
                  <td className="py-3">
                    {m._id !== user?._id && !m.isCommunityAdmin && (
                      <button
                        onClick={() => handleRemove(m._id, m.name)}
                        className="rounded p-1.5 text-red-400 hover:bg-red-500/10"
                        title="Remove from community"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
