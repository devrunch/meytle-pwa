import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  IconCamera, IconLoader2, IconCheck, IconUser,
  IconMail, IconShield, IconChevronRight, IconUserStar,
  IconLayoutDashboard, IconEdit, IconTrash, IconPlus,
  IconHeart, IconPhoto, IconInfoCircle,
} from '@tabler/icons-react';
import toast from 'react-hot-toast';
import { client } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { DatePicker } from '../../components/ui/DatePicker';
import type { User } from '../../types';

// ── Interest options ───────────────────────────────────────────────────────────

const INTERESTS = [
  { id: 'travel',     label: 'Travel',     emoji: '✈️' },
  { id: 'coffee',     label: 'Coffee',     emoji: '☕' },
  { id: 'dining',     label: 'Dining',     emoji: '🍽️' },
  { id: 'music',      label: 'Music',      emoji: '🎵' },
  { id: 'movies',     label: 'Movies',     emoji: '🎬' },
  { id: 'fitness',    label: 'Fitness',    emoji: '🏃' },
  { id: 'gaming',     label: 'Gaming',     emoji: '🎮' },
  { id: 'art',        label: 'Art',        emoji: '🎨' },
  { id: 'books',      label: 'Books',      emoji: '📚' },
  { id: 'nature',     label: 'Nature',     emoji: '🌿' },
  { id: 'shopping',   label: 'Shopping',   emoji: '🛍️' },
  { id: 'culture',    label: 'Culture',    emoji: '🎭' },
  { id: 'cooking',    label: 'Cooking',    emoji: '🍳' },
  { id: 'photography',label: 'Photography',emoji: '📷' },
  { id: 'yoga',       label: 'Yoga',       emoji: '🧘' },
  { id: 'dancing',    label: 'Dancing',    emoji: '💃' },
  { id: 'sports',     label: 'Sports',     emoji: '⚽' },
  { id: 'tech',       label: 'Tech',       emoji: '💻' },
  { id: 'fashion',    label: 'Fashion',    emoji: '👗' },
  { id: 'pets',       label: 'Pets',       emoji: '🐾' },
];

type Tab = 'info' | 'about' | 'photos';

// ── Left identity column (shared across tabs) ─────────────────────────────────

function IdentityCard({
  fullName, avatarUrl, uploading, user, isCompanion, onClickAvatar,
}: {
  fullName: string; avatarUrl: string; uploading: boolean;
  user: User | null;
  isCompanion: boolean;
  onClickAvatar: () => void;
}) {
  const initial = fullName.trim()[0]?.toUpperCase() ?? '?';
  const formattedDob = user?.dateOfBirth
    ? new Date(user.dateOfBirth + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        {/* Banner */}
        <div className="h-20 relative" style={{ background: 'linear-gradient(135deg,#00D4AA,#00C2D8 50%,#4F8CFF)' }}>
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 70% 50%,white,transparent 60%)' }} />
        </div>

        <div className="px-5 pb-5">
          {/* Avatar */}
          <div className="relative -mt-10 mb-3 w-fit">
            <div className="relative group cursor-pointer" onClick={onClickAvatar}>
              <div className="w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-surface shadow-lg">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold"
                    style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}>
                    {initial}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                  {uploading ? <IconLoader2 size={18} className="text-white animate-spin" /> : <IconCamera size={18} className="text-white" />}
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-surface flex items-center justify-center text-white shadow"
                style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}>
                {uploading ? <IconLoader2 size={10} className="animate-spin" /> : <IconEdit size={10} />}
              </div>
            </div>
          </div>

          <p className="font-bold text-heading">{fullName || 'Your Name'}</p>
          <p className="text-xs text-muted mt-0.5">{user?.email}</p>
          {formattedDob && <p className="text-xs text-muted mt-1">🎂 {formattedDob}</p>}
          {user?.bio && <p className="text-xs text-muted mt-2 line-clamp-2 italic">"{user.bio}"</p>}

          <div className="flex gap-1.5 flex-wrap mt-3">
            {user?.roles.map((r) => (
              <span key={r} className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize"
                style={r === 'companion'
                  ? { background: 'linear-gradient(135deg,#00D4AA18,#4F8CFF18)', color: '#00C2D8', border: '1px solid #00D4AA30' }
                  : { background: '#F7FBFA', color: '#64748B', border: '1px solid #E8F1F0' }}>
                {r}
              </span>
            ))}
          </div>

          {user?.interests && user.interests.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-3">
              {user.interests.slice(0, 5).map((id) => {
                const opt = INTERESTS.find(i => i.id === id);
                return opt ? (
                  <span key={id} className="text-[10px] bg-surface-alt text-muted px-2 py-0.5 rounded-full">
                    {opt.emoji} {opt.label}
                  </span>
                ) : null;
              })}
            </div>
          )}
        </div>
      </div>

      {/* Companion CTA */}
      {isCompanion ? (
        <Link to="/companion/profile"
          className="flex items-center justify-between px-4 py-3.5 bg-surface rounded-2xl border border-border hover:border-accent-green/50 hover:shadow-md transition-all group">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#00D4AA18,#4F8CFF18)' }}>
              <IconLayoutDashboard size={17} className="text-accent-green" />
            </div>
            <div>
              <p className="text-sm font-semibold text-heading">Companion Profile</p>
              <p className="text-xs text-muted">Edit rates, bio & services</p>
            </div>
          </div>
          <IconChevronRight size={15} className="text-muted group-hover:text-accent-green transition-colors" />
        </Link>
      ) : (
        <Link to="/become-companion"
          className="flex items-center justify-between px-4 py-3.5 rounded-2xl border border-dashed border-accent-green/30 hover:shadow-md transition-all group"
          style={{ background: 'linear-gradient(135deg,#00D4AA06,#4F8CFF06)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}>
              <IconUserStar size={17} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-heading">Become a Companion</p>
              <p className="text-xs text-muted">Start earning on Meytle</p>
            </div>
          </div>
          <IconChevronRight size={15} className="text-muted group-hover:text-accent-green transition-colors" />
        </Link>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export function ProfilePage() {
  const { user, setAuth } = useAuthStore();
  const isCompanion = useAuthStore((s) => s.isCompanion)();
  const token = useAuthStore((s) => s.token);

  const [tab, setTab] = useState<Tab>('info');

  // Info tab state
  const [fullName,  setFullName]  = useState(user?.fullName    ?? '');
  const [dob,       setDob]       = useState(user?.dateOfBirth ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl   ?? '');

  // About tab state
  const [bio,       setBio]       = useState(user?.bio         ?? '');
  const [interests, setInterests] = useState<string[]>(user?.interests ?? []);

  // Photos tab state
  const [photos, setPhotos] = useState<string[]>(user?.photos ?? []);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [saving,    setSaving]    = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved,     setSaved]     = useState(false);

  const avatarRef = useRef<HTMLInputElement>(null);
  const photoRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFullName(user?.fullName    ?? '');
    setDob(user?.dateOfBirth      ?? '');
    setAvatarUrl(user?.avatarUrl  ?? '');
    setBio(user?.bio              ?? '');
    setInterests(user?.interests  ?? []);
    setPhotos(user?.photos        ?? []);
  }, [user]);

  // ── Avatar upload ────────────────────────────────────────────────────────────

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    try {
      const { data } = await client.post<{ url: string }>('/uploads/photo', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAvatarUrl(data.url);
      const updated = await client.patch('/users/me', { avatarUrl: data.url });
      if (token && user) setAuth(token, updated.data);
      toast.success('Photo updated');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      if (avatarRef.current) avatarRef.current.value = '';
    }
  };

  // ── Gallery photo upload ─────────────────────────────────────────────────────

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    if (photos.length + files.length > 9) { toast.error('Max 9 photos allowed'); return; }
    setUploadingPhoto(true);
    try {
      const urls: string[] = [];
      for (const file of files) {
        const form = new FormData();
        form.append('file', file);
        const { data } = await client.post<{ url: string }>('/uploads/photo', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        urls.push(data.url);
      }
      const next = [...photos, ...urls];
      setPhotos(next);
      const updated = await client.patch('/users/me', { photos: next });
      if (token) setAuth(token, updated.data);
      toast.success(`${urls.length} photo${urls.length > 1 ? 's' : ''} added`);
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploadingPhoto(false);
      if (photoRef.current) photoRef.current.value = '';
    }
  };

  const removePhoto = async (url: string) => {
    const next = photos.filter(p => p !== url);
    setPhotos(next);
    try {
      const updated = await client.patch('/users/me', { photos: next });
      if (token) setAuth(token, updated.data);
      toast.success('Photo removed');
    } catch {
      toast.error('Failed to remove');
      setPhotos(photos); // revert
    }
  };

  // ── Toggle interest ──────────────────────────────────────────────────────────

  const toggleInterest = (id: string) => {
    setInterests(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // ── Save (info or about) ─────────────────────────────────────────────────────

  const handleSave = async () => {
    if (tab === 'info' && !fullName.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {};
      if (tab === 'info') {
        payload.fullName = fullName.trim();
        if (dob) payload.dateOfBirth = dob;
      } else if (tab === 'about') {
        payload.bio = bio.trim();
        payload.interests = interests;
      }
      const { data } = await client.patch('/users/me', payload);
      if (token) setAuth(token, data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      toast.success('Saved!');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const TABS: { id: Tab; label: string; icon: typeof IconUser }[] = [
    { id: 'info',   label: 'Info',      icon: IconUser },
    { id: 'about',  label: 'About',     icon: IconHeart },
    { id: 'photos', label: 'Photos',    icon: IconPhoto },
  ];

  return (
    <div className="pb-12">
      {/* Page header */}
      <div className="mb-7">
        <h1 className="text-2xl font-extrabold text-heading">Your Profile</h1>
        <p className="text-sm text-muted mt-1">Manage your personal information and public presence</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* ── Left: identity card ──────────────────────────────────────── */}
        <div className="w-full lg:w-72 xl:w-80 shrink-0">
          <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          <IdentityCard
            fullName={fullName} avatarUrl={avatarUrl} uploading={uploading}
            user={user} isCompanion={isCompanion}
            onClickAvatar={() => avatarRef.current?.click()}
          />
        </div>

        {/* ── Right: tabs + content ─────────────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* Tab bar */}
          <div className="flex gap-1 bg-surface-alt rounded-2xl p-1 mb-5 border border-border">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  tab === id ? 'text-white shadow-sm' : 'text-muted hover:text-body'
                }`}
                style={tab === id ? { background: 'linear-gradient(135deg,#00D4AA,#00C2D8 50%,#4F8CFF)' } : {}}>
                <Icon size={15} stroke={tab === id ? 2.2 : 1.8} />
                {label}
              </button>
            ))}
          </div>

          {/* ── Info tab ─────────────────────────────────────────────── */}
          {tab === 'info' && (
            <div className="bg-surface rounded-2xl border border-border divide-y divide-border/60">
              <div className="px-6 py-5">
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-muted uppercase tracking-widest mb-3">
                  <IconUser size={11} /> Full Name
                </label>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name"
                  className="w-full text-sm text-body bg-surface-alt border border-border rounded-xl px-4 py-3 outline-none placeholder:text-muted/40 focus:ring-2 focus:ring-accent-green/30 focus:border-accent-green/50 transition" />
              </div>

              <div className="px-6 py-5">
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-muted uppercase tracking-widest mb-3">
                  <IconMail size={11} /> Email Address
                </label>
                <div className="flex items-center gap-3 bg-surface-alt border border-border rounded-xl px-4 py-3">
                  <p className="text-sm text-body flex-1">{user?.email}</p>
                  <span className="flex items-center gap-1 text-[10px] text-accent-green font-semibold shrink-0">
                    <IconShield size={11} /> Verified
                  </span>
                </div>
              </div>

              <div className="px-6 py-5">
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-muted uppercase tracking-widest mb-3">
                  🎂 Date of Birth
                </label>
                <DatePicker value={dob} onChange={setDob} placeholder="Select your date of birth" />
                <p className="text-[11px] text-muted mt-2">Must be 18 or older to use Meytle</p>
              </div>

              <div className="px-6 py-5">
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-muted uppercase tracking-widest mb-3">
                  <IconShield size={11} /> Account Type
                </label>
                <div className="flex gap-2 flex-wrap">
                  {user?.roles.map((r) => (
                    <span key={r} className="text-xs font-semibold px-3 py-1.5 rounded-full capitalize"
                      style={r === 'companion'
                        ? { background: 'linear-gradient(135deg,#00D4AA18,#4F8CFF18)', color: '#00C2D8', border: '1px solid #00D4AA30' }
                        : { background: '#F7FBFA', color: '#64748B', border: '1px solid #E8F1F0' }}>
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── About tab ────────────────────────────────────────────── */}
          {tab === 'about' && (
            <div className="space-y-5">
              {/* Bio */}
              <div className="bg-surface rounded-2xl border border-border px-6 py-5">
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-muted uppercase tracking-widest mb-3">
                  <IconInfoCircle size={11} /> Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={500}
                  rows={4}
                  placeholder="Write a short bio about yourself — your personality, what you enjoy, what makes you you…"
                  className="w-full text-sm text-body bg-surface-alt border border-border rounded-xl px-4 py-3 outline-none placeholder:text-muted/40 focus:ring-2 focus:ring-accent-green/30 focus:border-accent-green/50 transition resize-none leading-relaxed"
                />
                <p className="text-[11px] text-muted mt-1.5 text-right">{bio.length}/500</p>
              </div>

              {/* Interests */}
              <div className="bg-surface rounded-2xl border border-border px-6 py-5">
                <div className="flex items-center justify-between mb-4">
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-muted uppercase tracking-widest">
                    <IconHeart size={11} /> Interests
                  </label>
                  <span className="text-[11px] text-muted">{interests.length} selected</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map(({ id, label, emoji }) => {
                    const active = interests.includes(id);
                    return (
                      <button key={id} onClick={() => toggleInterest(id)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold border transition-all ${
                          active ? 'text-white border-transparent shadow-sm' : 'bg-surface-alt border-border text-muted hover:border-accent-green/40 hover:text-body'
                        }`}
                        style={active ? { background: 'linear-gradient(135deg,#00D4AA,#00C2D8 50%,#4F8CFF)' } : {}}>
                        <span>{emoji}</span>{label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Photos tab ───────────────────────────────────────────── */}
          {tab === 'photos' && (
            <div className="bg-surface rounded-2xl border border-border p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-sm font-bold text-heading">Your Photos</p>
                  <p className="text-xs text-muted mt-0.5">{photos.length}/9 photos · shown on your public profile</p>
                </div>
                {photos.length < 9 && (
                  <button onClick={() => photoRef.current?.click()} disabled={uploadingPhoto}
                    className="flex items-center gap-1.5 text-xs font-semibold text-white px-3.5 py-2 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}>
                    {uploadingPhoto ? <IconLoader2 size={13} className="animate-spin" /> : <IconPlus size={13} />}
                    Add Photos
                  </button>
                )}
              </div>

              <input ref={photoRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />

              {photos.length === 0 ? (
                <button onClick={() => photoRef.current?.click()} disabled={uploadingPhoto}
                  className="w-full border-2 border-dashed border-border rounded-2xl py-16 flex flex-col items-center gap-3 hover:border-accent-green/40 transition-colors group">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"
                    style={{ background: 'linear-gradient(135deg,#00D4AA18,#4F8CFF18)' }}>
                    {uploadingPhoto
                      ? <IconLoader2 size={22} className="text-accent-green animate-spin" />
                      : <IconPhoto size={22} className="text-accent-green" />}
                  </div>
                  <p className="text-sm font-semibold text-heading">Add your first photo</p>
                  <p className="text-xs text-muted">JPG, PNG or WebP · max 8 MB each</p>
                </button>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {photos.map((url, idx) => (
                    <div key={url} className="group relative aspect-square rounded-2xl overflow-hidden bg-surface-alt">
                      <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button onClick={() => removePhoto(url)}
                          className="w-9 h-9 rounded-full bg-red-500/90 flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-lg">
                          <IconTrash size={15} />
                        </button>
                      </div>
                      {idx === 0 && (
                        <div className="absolute top-2 left-2 text-[10px] font-bold text-white bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full">
                          Cover
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add more slot */}
                  {photos.length < 9 && (
                    <button onClick={() => photoRef.current?.click()} disabled={uploadingPhoto}
                      className="aspect-square rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1.5 hover:border-accent-green/40 transition-colors group">
                      {uploadingPhoto
                        ? <IconLoader2 size={20} className="text-accent-green animate-spin" />
                        : <IconPlus size={20} className="text-muted group-hover:text-accent-green transition-colors" />}
                      <p className="text-[10px] text-muted group-hover:text-accent-green transition-colors">Add</p>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Save button (not on photos tab — photos auto-save) */}
          {tab !== 'photos' && (
            <button onClick={handleSave} disabled={saving || (tab === 'info' && !fullName.trim())}
              className="mt-5 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 hover:opacity-90 active:scale-[0.99] shadow-md"
              style={{ background: 'linear-gradient(135deg,#00D4AA 0%,#00C2D8 50%,#4F8CFF 100%)' }}>
              {saving
                ? <><IconLoader2 size={15} className="animate-spin" /> Saving…</>
                : saved
                ? <><IconCheck size={15} /> Saved!</>
                : 'Save Changes'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
