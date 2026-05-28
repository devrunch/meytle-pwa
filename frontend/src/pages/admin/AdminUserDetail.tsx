import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IconArrowLeft, IconLoader2, IconDeviceFloppy, IconAlertCircle } from '@tabler/icons-react';
import toast from 'react-hot-toast';
import { client } from '../../api/client';
import type { User, UserRole } from '../../types';

const ALL_ROLES: UserRole[] = ['user', 'companion', 'admin'];

const ROLE_COLORS: Record<string, { border: string; bg: string; text: string }> = {
  admin:     { border: '#7C3AED', bg: '#7C3AED15', text: '#C4B5FD' },
  companion: { border: '#0369A1', bg: '#0369A115', text: '#7DD3FC' },
  user:      { border: '#064720', bg: '#06472015', text: '#6EE7B7' },
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const INPUT = "w-full px-3.5 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-1 focus:ring-teal-500/40 transition";
const INPUT_STYLE = { background: '#0B1120', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)' };

export function AdminUserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [interests, setInterests] = useState('');
  const [roles, setRoles] = useState<UserRole[]>([]);

  useEffect(() => {
    if (!id) return;
    client.get<User>(`/admin/users/${id}`)
      .then(({ data }) => {
        setUser(data);
        setFullName(data.fullName);
        setEmail(data.email);
        setBio(data.bio ?? '');
        setAvatarUrl(data.avatarUrl ?? '');
        setDateOfBirth(data.dateOfBirth ?? '');
        setInterests((data.interests ?? []).join(', '));
        setRoles(data.roles);
      })
      .catch(() => { toast.error('User not found'); navigate('/admin/users'); })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const toggleRole = (r: UserRole) =>
    setRoles((prev) => prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const interestsList = interests.split(',').map((s) => s.trim()).filter(Boolean);
      const { data } = await client.patch<User>(`/admin/users/${id}`, {
        fullName, email, bio: bio || null, avatarUrl: avatarUrl || null,
        dateOfBirth: dateOfBirth || null,
        interests: interestsList.length ? interestsList : null,
        roles,
      });
      setUser(data);
      toast.success('User saved');
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <IconLoader2 size={28} className="animate-spin" style={{ color: '#00D4AA' }} />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="p-8 max-w-2xl">
      {/* Back + title */}
      <div className="flex items-center gap-3 mb-7">
        <button onClick={() => navigate('/admin/users')}
          className="w-8 h-8 rounded-xl flex items-center justify-center border transition-colors hover:bg-white/5"
          style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
          <IconArrowLeft size={15} />
        </button>
        <div>
          <h1 className="text-xl font-extrabold text-white">{user.fullName}</h1>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {user.email} · ID: {user.id.slice(0, 8)}…
          </p>
        </div>
      </div>

      <div className="rounded-2xl border p-6 space-y-5" style={{ background: '#131E30', borderColor: 'rgba(255,255,255,0.07)' }}>
        <p className="text-xs font-bold text-white/50 uppercase tracking-wider">Profile</p>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Full Name">
            <input className={INPUT} style={INPUT_STYLE} value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </Field>
          <Field label="Email">
            <input className={INPUT} style={INPUT_STYLE} value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
        </div>

        <Field label="Bio">
          <textarea className={INPUT} style={{ ...INPUT_STYLE, resize: 'none' }} rows={3}
            value={bio} onChange={(e) => setBio(e.target.value)} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Date of Birth">
            <input type="date" className={INPUT} style={INPUT_STYLE}
              value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
          </Field>
          <Field label="Avatar URL">
            <input className={INPUT} style={INPUT_STYLE} placeholder="https://…"
              value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
          </Field>
        </div>

        <Field label="Interests (comma-separated)">
          <input className={INPUT} style={INPUT_STYLE} placeholder="e.g. travel, coffee, music"
            value={interests} onChange={(e) => setInterests(e.target.value)} />
        </Field>

        {/* Avatar preview */}
        {avatarUrl && (
          <div className="flex items-center gap-3">
            <img src={avatarUrl} alt="" className="w-12 h-12 rounded-xl object-cover border" style={{ borderColor: 'rgba(255,255,255,0.1)' }} />
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Avatar preview</p>
          </div>
        )}
      </div>

      {/* Roles */}
      <div className="rounded-2xl border p-6 mt-4" style={{ background: '#131E30', borderColor: 'rgba(255,255,255,0.07)' }}>
        <p className="text-xs font-bold text-white/50 uppercase tracking-wider mb-4">Roles</p>
        <div className="flex gap-3">
          {ALL_ROLES.map((r) => {
            const active = roles.includes(r);
            const cfg = ROLE_COLORS[r];
            return (
              <button key={r} onClick={() => toggleRole(r)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all capitalize"
                style={{
                  borderColor: active ? cfg.border : 'rgba(255,255,255,0.1)',
                  background: active ? cfg.bg : 'transparent',
                  color: active ? cfg.text : 'rgba(255,255,255,0.35)',
                }}>
                {r}
              </button>
            );
          })}
        </div>
        {roles.includes('admin') && (
          <div className="flex items-center gap-2 mt-3 p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <IconAlertCircle size={13} style={{ color: '#F87171' }} />
            <p className="text-xs" style={{ color: '#F87171' }}>This user has full admin access to the platform.</p>
          </div>
        )}
      </div>

      {/* Save */}
      <div className="flex justify-end mt-5">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition"
          style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}>
          <IconDeviceFloppy size={15} />
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
