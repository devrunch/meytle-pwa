import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IconArrowLeft, IconLoader2, IconDeviceFloppy, IconCheck, IconX } from '@tabler/icons-react';
import toast from 'react-hot-toast';
import { client } from '../../api/client';
import type { CompanionProfile } from '../../types';

const ALL_SERVICES = ['coffee', 'dining', 'concert', 'travel', 'fitness', 'culture', 'nature', 'movies', 'shopping', 'gaming'];
const STATUS_OPTIONS = ['pending_verification', 'active', 'inactive', 'rejected'];

const STATUS_CFG: Record<string, { color: string; bg: string }> = {
  pending_verification: { color: '#F59E0B', bg: '#F59E0B18' },
  active:               { color: '#10B981', bg: '#10B98118' },
  inactive:             { color: '#6B7280', bg: '#6B728018' },
  rejected:             { color: '#EF4444', bg: '#EF444418' },
};

const INPUT = "w-full px-3.5 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-1 focus:ring-teal-500/40 transition";
const INPUT_STYLE = { background: '#0B1120', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)' };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</label>
      {children}
    </div>
  );
}

function ReadonlyField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</p>
      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{value ?? '—'}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border p-6" style={{ background: '#131E30', borderColor: 'rgba(255,255,255,0.07)' }}>
      <p className="text-xs font-bold uppercase tracking-wider mb-5" style={{ color: 'rgba(255,255,255,0.4)' }}>{title}</p>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between p-3 rounded-xl cursor-pointer border transition-colors"
      style={{ background: checked ? 'rgba(0,212,170,0.06)' : 'rgba(255,255,255,0.03)', borderColor: checked ? 'rgba(0,212,170,0.2)' : 'rgba(255,255,255,0.07)' }}>
      <span className="text-sm" style={{ color: checked ? '#5EEAD4' : 'rgba(255,255,255,0.5)' }}>{label}</span>
      <div
        onClick={() => onChange(!checked)}
        className="w-9 h-5 rounded-full relative transition-colors shrink-0"
        style={{ background: checked ? '#00D4AA' : 'rgba(255,255,255,0.15)' }}>
        <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
          style={{ left: checked ? '18px' : '2px' }} />
      </div>
    </label>
  );
}

export function AdminCompanionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [companion, setCompanion] = useState<CompanionProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingServices, setSavingServices] = useState(false);

  // Form fields
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');
  const [hourlyRateRupees, setHourlyRateRupees] = useState('');
  const [profileStatus, setProfileStatus] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [serviceAreaRadiusKm, setServiceAreaRadiusKm] = useState('');
  const [isAvailableNow, setIsAvailableNow] = useState(false);
  const [identityVerifiedByAdmin, setIdentityVerifiedByAdmin] = useState(false);
  const [stripePayoutsEnabled, setStripePayoutsEnabled] = useState(false);
  const [ratingAvg, setRatingAvg] = useState('');
  const [ratingCount, setRatingCount] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  useEffect(() => {
    if (!id) return;
    client.get<CompanionProfile>(`/admin/companions/${id}`)
      .then(({ data: c }) => {
        setCompanion(c);
        setDisplayName(c.displayName);
        setBio(c.bio ?? '');
        setProfilePhotoUrl(c.profilePhotoUrl ?? '');
        setHourlyRateRupees(String(c.hourlyRatePaisa / 100));
        setProfileStatus(c.profileStatus);
        setDateOfBirth(c.dateOfBirth ? String(c.dateOfBirth).slice(0, 10) : '');
        setServiceAreaRadiusKm(String(c.serviceAreaRadiusKm ?? 10));
        setIsAvailableNow(c.isAvailableNow);
        setIdentityVerifiedByAdmin(c.identityVerifiedByAdmin ?? false);
        setStripePayoutsEnabled(c.stripePayoutsEnabled ?? false);
        setRatingAvg(c.ratingAvg != null ? String(c.ratingAvg) : '');
        setRatingCount(String(c.ratingCount ?? 0));
        setSelectedServices((c.services ?? []).map((s: any) => s.serviceType));
      })
      .catch(() => { toast.error('Companion not found'); navigate('/admin/companions'); })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await client.patch<CompanionProfile>(`/admin/companions/${id}`, {
        displayName,
        bio: bio || null,
        profilePhotoUrl: profilePhotoUrl || null,
        hourlyRatePaisa: Math.round(parseFloat(hourlyRateRupees) * 100),
        profileStatus,
        dateOfBirth: dateOfBirth || null,
        serviceAreaRadiusKm: parseFloat(serviceAreaRadiusKm),
        isAvailableNow,
        identityVerifiedByAdmin,
        stripePayoutsEnabled,
        ratingAvg: ratingAvg ? parseFloat(ratingAvg) : undefined,
        ratingCount: ratingCount ? parseInt(ratingCount) : undefined,
      });
      setCompanion((prev) => ({ ...prev!, ...data }));
      toast.success('Companion saved');
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Save failed');
    } finally { setSaving(false); }
  };

  const handleSaveServices = async () => {
    setSavingServices(true);
    try {
      await client.post(`/admin/companions/${id}/services`, { serviceTypes: selectedServices });
      toast.success('Services updated');
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Failed');
    } finally { setSavingServices(false); }
  };

  const toggleService = (s: string) =>
    setSelectedServices((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <IconLoader2 size={28} className="animate-spin" style={{ color: '#00D4AA' }} />
      </div>
    );
  }
  if (!companion) return null;

  const cfg = STATUS_CFG[profileStatus] ?? STATUS_CFG.inactive;

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-7">
        <button onClick={() => navigate('/admin/companions')}
          className="w-8 h-8 rounded-xl flex items-center justify-center border transition-colors hover:bg-white/5"
          style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
          <IconArrowLeft size={15} />
        </button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center text-white font-bold"
            style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}>
            {companion.profilePhotoUrl
              ? <img src={companion.profilePhotoUrl} alt="" className="w-full h-full object-cover" />
              : companion.displayName[0]}
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white">{companion.displayName}</h1>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {(companion as any).user?.email} · ID: {companion.id.slice(0, 8)}…
            </p>
          </div>
          <span className="ml-auto text-[11px] font-bold px-3 py-1 rounded-full"
            style={{ background: cfg.bg, color: cfg.color }}>
            {profileStatus.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Profile */}
        <Section title="Profile">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Display Name">
                <input className={INPUT} style={INPUT_STYLE} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              </Field>
              <Field label="Status">
                <select className={INPUT} style={INPUT_STYLE} value={profileStatus} onChange={(e) => setProfileStatus(e.target.value)}>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s} className="bg-slate-900 capitalize">{s.replace('_', ' ')}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Bio">
              <textarea className={INPUT} style={{ ...INPUT_STYLE, resize: 'none' }} rows={3}
                value={bio} onChange={(e) => setBio(e.target.value)} />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Hourly Rate (₹)">
                <input type="number" className={INPUT} style={INPUT_STYLE}
                  value={hourlyRateRupees} onChange={(e) => setHourlyRateRupees(e.target.value)} />
              </Field>
              <Field label="Date of Birth">
                <input type="date" className={INPUT} style={INPUT_STYLE}
                  value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Profile Photo URL">
                <input className={INPUT} style={INPUT_STYLE} placeholder="https://…"
                  value={profilePhotoUrl} onChange={(e) => setProfilePhotoUrl(e.target.value)} />
              </Field>
              <Field label="Service Area Radius (km)">
                <input type="number" className={INPUT} style={INPUT_STYLE}
                  value={serviceAreaRadiusKm} onChange={(e) => setServiceAreaRadiusKm(e.target.value)} />
              </Field>
            </div>

            {profilePhotoUrl && (
              <div className="flex items-center gap-3">
                <img src={profilePhotoUrl} alt="" className="w-14 h-14 rounded-xl object-cover border" style={{ borderColor: 'rgba(255,255,255,0.1)' }} />
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Photo preview</p>
              </div>
            )}
          </div>
        </Section>

        {/* Availability & Verification */}
        <Section title="Availability & Verification">
          <div className="space-y-2.5">
            <Toggle label="Available Now" checked={isAvailableNow} onChange={setIsAvailableNow} />
            <Toggle label="Identity Verified by Admin" checked={identityVerifiedByAdmin} onChange={setIdentityVerifiedByAdmin} />
            <Toggle label="Stripe Payouts Enabled" checked={stripePayoutsEnabled} onChange={setStripePayoutsEnabled} />
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
            <ReadonlyField
              label="ID Verified by Stripe"
              value={companion.identityVerifiedByStripe
                ? <span style={{ color: '#10B981' }}>✓ Yes</span>
                : <span style={{ color: 'rgba(255,255,255,0.3)' }}>No</span>} />
            <ReadonlyField
              label="ID Verified by Veriff"
              value={companion.identityVerifiedByVeriff
                ? <span style={{ color: '#10B981' }}>✓ Yes</span>
                : <span style={{ color: 'rgba(255,255,255,0.3)' }}>No</span>} />
          </div>
        </Section>

        {/* Ratings */}
        <Section title="Ratings">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Rating Average (0–5)">
              <input type="number" step="0.1" min="0" max="5" className={INPUT} style={INPUT_STYLE}
                value={ratingAvg} onChange={(e) => setRatingAvg(e.target.value)} />
            </Field>
            <Field label="Rating Count">
              <input type="number" min="0" className={INPUT} style={INPUT_STYLE}
                value={ratingCount} onChange={(e) => setRatingCount(e.target.value)} />
            </Field>
          </div>
        </Section>

        {/* Stripe (read-only) */}
        <Section title="Stripe">
          <div className="grid grid-cols-2 gap-4">
            <ReadonlyField label="Connected Account ID"
              value={companion.stripeConnectedAccountId
                ? <span className="font-mono text-xs">{companion.stripeConnectedAccountId}</span>
                : 'Not connected'} />
            <ReadonlyField label="Payouts Enabled"
              value={companion.stripePayoutsEnabled
                ? <span style={{ color: '#10B981' }}>✓ Enabled</span>
                : <span style={{ color: 'rgba(255,255,255,0.3)' }}>Not enabled</span>} />
          </div>
        </Section>

        {/* Save profile */}
        <div className="flex justify-end">
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}>
            <IconDeviceFloppy size={15} />
            {saving ? 'Saving…' : 'Save Profile'}
          </button>
        </div>

        {/* Services */}
        <Section title="Offered Services">
          <div className="flex flex-wrap gap-2 mb-4">
            {ALL_SERVICES.map((s) => {
              const active = selectedServices.includes(s);
              return (
                <button key={s} onClick={() => toggleService(s)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all border"
                  style={{
                    background: active ? 'rgba(0,212,170,0.12)' : 'rgba(255,255,255,0.04)',
                    borderColor: active ? 'rgba(0,212,170,0.35)' : 'rgba(255,255,255,0.08)',
                    color: active ? '#5EEAD4' : 'rgba(255,255,255,0.4)',
                  }}>
                  {active && <IconCheck size={10} className="inline mr-1" />}
                  {s}
                </button>
              );
            })}
          </div>
          <button onClick={handleSaveServices} disabled={savingServices}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-50 border transition-colors"
            style={{ borderColor: 'rgba(0,212,170,0.3)', color: '#00D4AA' }}>
            {savingServices ? 'Saving…' : 'Update Services'}
          </button>
        </Section>
      </div>
    </div>
  );
}
