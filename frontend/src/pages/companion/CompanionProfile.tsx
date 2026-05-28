import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconArrowLeft, IconCamera, IconLoader2, IconCheck, IconX,
  IconUser, IconFileText, IconLayoutGrid, IconCurrencyRupee,
  IconMapPin, IconStar,
  IconCoffee, IconToolsKitchen2, IconMusic, IconPlane, IconRun,
  IconPalette, IconLeaf, IconMovie, IconShoppingBag, IconDeviceGamepad,
} from '@tabler/icons-react';
import toast from 'react-hot-toast';
import { client } from '../../api/client';
import type { ServiceType, CompanionProfile } from '../../types';

// ── Constants ──────────────────────────────────────────────────────────────────

const SERVICES: { value: ServiceType; label: string; icon: React.ElementType }[] = [
  { value: 'coffee',   label: 'Coffee',   icon: IconCoffee },
  { value: 'dining',   label: 'Dining',   icon: IconToolsKitchen2 },
  { value: 'concert',  label: 'Concerts', icon: IconMusic },
  { value: 'travel',   label: 'Travel',   icon: IconPlane },
  { value: 'fitness',  label: 'Fitness',  icon: IconRun },
  { value: 'culture',  label: 'Culture',  icon: IconPalette },
  { value: 'nature',   label: 'Nature',   icon: IconLeaf },
  { value: 'movies',   label: 'Movies',   icon: IconMovie },
  { value: 'shopping', label: 'Shopping', icon: IconShoppingBag },
  { value: 'gaming',   label: 'Gaming',   icon: IconDeviceGamepad },
];

const RATE_PRESETS = [500, 800, 1000, 1500, 2000];
const RADIUS_OPTIONS = [5, 10, 15, 20, 30, 50];

// ── Section wrapper ────────────────────────────────────────────────────────────

function Section({ icon: Icon, title, children }: {
  icon: React.ElementType; title: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-black/[0.05]"
        style={{ background: 'linear-gradient(135deg,#F7FBFA,#F6FAFF)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}>
          <Icon size={15} className="text-white" />
        </div>
        <p className="text-sm font-bold text-heading">{title}</p>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export function CompanionProfilePage() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [uploading, setUploading] = useState(false);

  const [displayName, setDisplayName]   = useState('');
  const [bio, setBio]                   = useState('');
  const [profilePhotoUrl, setPhotoUrl]  = useState('');
  const [services, setServices]         = useState<ServiceType[]>([]);
  const [hourlyRate, setHourlyRate]     = useState(1000);
  const [radiusKm, setRadiusKm]         = useState(10);
  const [areaLabel, setAreaLabel]       = useState('');

  useEffect(() => {
    client.get<CompanionProfile>('/companions/me/profile')
      .then(({ data: p }) => {
        setDisplayName(p.displayName ?? '');
        setBio(p.bio ?? '');
        setPhotoUrl(p.profilePhotoUrl ?? '');
        setServices((p.services ?? []).map((s) => s.serviceType));
        setHourlyRate(Math.round((p.hourlyRatePaisa ?? 100000) / 100));
        setRadiusKm(p.serviceAreaRadiusKm ?? 10);
        // Parse area label from EWKT if present
        if (p.serviceAreaCentre) {
          setAreaLabel('Current area');
        }
      })
      .catch(() => toast.error('Could not load profile'))
      .finally(() => setLoading(false));
  }, []);

  const toggleService = (v: ServiceType) => {
    setServices((prev) => prev.includes(v) ? prev.filter((s) => s !== v) : [...prev, v]);
  };

  const handlePhotoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    try {
      const { data } = await client.post<{ url: string }>('/uploads/photo', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPhotoUrl(data.url);
      toast.success('Photo updated!');
    } catch {
      toast.error('Upload failed, try again');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!displayName.trim()) { toast.error('Display name is required'); return; }
    if (services.length === 0) { toast.error('Select at least one service'); return; }
    if (hourlyRate < 500) { toast.error('Minimum rate is ₹500/hr'); return; }

    setSaving(true);
    try {
      await client.patch('/companions/me/profile', {
        displayName:         displayName.trim(),
        bio:                 bio.trim() || undefined,
        profilePhotoUrl:     profilePhotoUrl || undefined,
        hourlyRatePaisa:     hourlyRate * 100,
        serviceAreaRadiusKm: radiusKm,
        services,
      });
      toast.success('Profile updated!');
      navigate('/companion/dashboard');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(typeof msg === 'string' ? msg : 'Could not save changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <IconLoader2 size={32} className="animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/companion/dashboard')}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-muted hover:bg-black/[0.04] hover:text-body transition-colors">
          <IconArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-lg font-extrabold text-heading leading-tight">Edit Profile</h1>
          <p className="text-xs text-muted">Changes are visible to clients immediately after saving</p>
        </div>
      </div>

      {/* Photo */}
      <Section icon={IconCamera} title="Profile Photo">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoFile} />
        <div className="flex items-center gap-5">
          <button onClick={() => fileRef.current?.click()} disabled={uploading} className="group relative flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-dashed border-border group-hover:border-accent-green/50 transition-colors">
              {profilePhotoUrl ? (
                <img src={profilePhotoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-surface-alt">
                  {uploading
                    ? <IconLoader2 size={22} className="text-accent-green animate-spin" />
                    : <IconCamera size={22} className="text-muted group-hover:text-accent-green transition-colors" />}
                </div>
              )}
              {profilePhotoUrl && (
                <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <IconCamera size={18} className="text-white" />
                </div>
              )}
            </div>
          </button>
          <div className="flex-1">
            <p className="text-sm font-semibold text-heading mb-1">
              {profilePhotoUrl ? 'Looking good!' : 'Add a photo'}
            </p>
            <p className="text-xs text-muted mb-3">Profiles with photos get 3× more bookings</p>
            <div className="flex gap-2">
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}>
                {uploading ? 'Uploading…' : profilePhotoUrl ? 'Change' : 'Upload'}
              </button>
              {profilePhotoUrl && (
                <button onClick={() => setPhotoUrl('')}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border text-muted hover:text-red-500 hover:border-red-300 transition-colors flex items-center gap-1">
                  <IconX size={11} /> Remove
                </button>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* Basic info */}
      <Section icon={IconUser} title="Basic Info">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted uppercase tracking-wide mb-1.5 block">Display Name</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={40}
              placeholder="Your name or alias"
              className="w-full text-sm font-semibold text-heading bg-surface-alt border-2 border-border rounded-xl px-4 py-3 outline-none placeholder:text-muted/40 focus:border-accent-green/60 focus:ring-4 focus:ring-accent-green/10 transition-all"
            />
            {displayName && (
              <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-surface-mint border border-border rounded-xl">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}>
                  {displayName[0].toUpperCase()}
                </div>
                <p className="text-xs text-muted">Shows as <span className="text-heading font-semibold">{displayName}</span> on your card</p>
                <IconStar size={11} className="ml-auto text-yellow-400 fill-yellow-400" />
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-muted uppercase tracking-wide mb-1.5 block">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={300}
              rows={4}
              placeholder="Tell clients a bit about yourself…"
              className="w-full text-sm text-body bg-surface-alt border-2 border-border rounded-xl px-4 py-3 outline-none placeholder:text-muted/40 focus:border-accent-green/60 focus:ring-4 focus:ring-accent-green/10 transition-all resize-none leading-relaxed"
            />
            <p className={`text-right text-[11px] mt-1 font-medium ${bio.length > 260 ? 'text-amber-500' : 'text-muted'}`}>
              {bio.length}/300
            </p>
          </div>
        </div>
      </Section>

      {/* Services */}
      <Section icon={IconLayoutGrid} title="Services Offered">
        <div className="grid grid-cols-2 gap-2">
          {SERVICES.map(({ value, label, icon: Icon }) => {
            const active = services.includes(value);
            return (
              <button key={value} onClick={() => toggleService(value)}
                className={`relative flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all ${
                  active ? 'border-transparent shadow-sm' : 'border-border bg-surface hover:border-accent-green/30'
                }`}
                style={active ? { background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' } : {}}>
                <Icon size={16} className={`shrink-0 ${active ? 'text-white' : 'text-muted'}`} />
                <span className={`text-sm font-semibold ${active ? 'text-white' : 'text-heading'}`}>{label}</span>
                {active && (
                  <div className="absolute top-2 right-2 w-3.5 h-3.5 rounded-full bg-white/30 flex items-center justify-center">
                    <IconCheck size={9} className="text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
        {services.length > 0 && (
          <p className="text-center text-xs text-accent-green font-semibold mt-3">
            {services.length} experience{services.length > 1 ? 's' : ''} selected
          </p>
        )}
      </Section>

      {/* Rate */}
      <Section icon={IconCurrencyRupee} title="Hourly Rate">
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-1">
            <span className="text-2xl font-bold text-muted">₹</span>
            <input
              type="number"
              value={hourlyRate}
              min={500}
              max={10000}
              onChange={(e) => setHourlyRate(Math.max(500, +e.target.value || 500))}
              className="text-4xl font-extrabold text-heading w-32 text-center bg-transparent outline-none border-b-2 border-border focus:border-accent-green/60 transition-colors [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-lg text-muted self-end mb-1">/hr</span>
          </div>
        </div>
        <div className="flex gap-2 justify-center flex-wrap">
          {RATE_PRESETS.map((r) => (
            <button key={r} onClick={() => setHourlyRate(r)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                hourlyRate === r ? 'text-white border-transparent' : 'border-border text-muted hover:border-accent-green/40'
              }`}
              style={hourlyRate === r ? { background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' } : {}}>
              ₹{r.toLocaleString('en-IN')}
            </button>
          ))}
        </div>
      </Section>

      {/* Service area */}
      <Section icon={IconMapPin} title="Service Area">
        <div>
          <p className="text-xs text-muted mb-3">
            Clients within your radius can discover and book you.
            {areaLabel && <span className="text-heading font-medium"> Currently: {areaLabel}.</span>}
          </p>
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Radius</p>
          <div className="flex gap-2 flex-wrap">
            {RADIUS_OPTIONS.map((r) => (
              <button key={r} onClick={() => setRadiusKm(r)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                  radiusKm === r ? 'text-white border-transparent' : 'border-border text-muted hover:border-accent-green/40'
                }`}
                style={radiusKm === r ? { background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' } : {}}>
                {r} km
              </button>
            ))}
          </div>
          <p className="text-[11px] text-muted mt-3">
            To change your city or service zones, go through the companion onboarding again.
          </p>
        </div>
      </Section>

      {/* Save */}
      <div className="pb-6">
        <button onClick={handleSave} disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-bold text-sm shadow-lg hover:opacity-90 disabled:opacity-60 active:scale-95 transition-all"
          style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}>
          {saving
            ? <><IconLoader2 size={16} className="animate-spin" /> Saving…</>
            : <><IconCheck size={16} /> Save Changes</>}
        </button>
      </div>
    </div>
  );
}
