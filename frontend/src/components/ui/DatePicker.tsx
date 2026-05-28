import { useState, useRef, useEffect } from 'react';
import { IconChevronLeft, IconChevronRight, IconCalendar, IconX } from '@tabler/icons-react';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTH_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['S','M','T','W','T','F','S'];

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export function DatePicker({ value, onChange, placeholder = 'Select date' }: Props) {
  const maxDate = (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 18); return d; })();
  const selected = value ? new Date(value + 'T00:00:00') : null;

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'day' | 'month' | 'year'>('day');
  const [cursor, setCursor] = useState(() => {
    const d = selected ? new Date(selected) : new Date(maxDate);
    d.setDate(1);
    return d;
  });

  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const firstDOW   = new Date(cursor.getFullYear(), cursor.getMonth(), 1).getDay();
  const daysInMon  = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const totalCells = Math.ceil((firstDOW + daysInMon) / 7) * 7;
  const cells      = Array.from({ length: totalCells }, (_, i) => { const d = i - firstDOW + 1; return d >= 1 && d <= daysInMon ? d : null; });

  const isSelected = (d: number) => selected && selected.getFullYear() === cursor.getFullYear() && selected.getMonth() === cursor.getMonth() && selected.getDate() === d;
  const isDisabled = (d: number) => new Date(cursor.getFullYear(), cursor.getMonth(), d) > maxDate;
  const isToday    = (d: number) => { const t = new Date(); return t.getFullYear() === cursor.getFullYear() && t.getMonth() === cursor.getMonth() && t.getDate() === d; };

  const select = (d: number) => {
    if (isDisabled(d)) return;
    const iso = `${cursor.getFullYear()}-${String(cursor.getMonth()+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    onChange(iso);
    setOpen(false);
    setView('day');
  };

  const canGoNext = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1) <= maxDate;
  const yearRange = Array.from({ length: 83 }, (_, i) => new Date().getFullYear() - 18 - i);

  const formatted = selected
    ? selected.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button type="button" onClick={() => { setOpen(o => !o); setView('day'); }}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-sm transition-all ${
          open ? 'border-accent-green/60 ring-2 ring-accent-green/15 bg-surface' : 'border-border bg-surface-alt hover:border-accent-green/30'
        }`}>
        <span className={selected ? 'text-body font-medium' : 'text-muted text-sm'}>{formatted || placeholder}</span>
        <div className="flex items-center gap-1">
          {value && (
            <span onClick={(e) => { e.stopPropagation(); onChange(''); }}
              className="p-0.5 rounded-full hover:bg-border text-muted hover:text-body transition-colors cursor-pointer">
              <IconX size={12} />
            </span>
          )}
          <IconCalendar size={14} className={open ? 'text-accent-green' : 'text-muted'} />
        </div>
      </button>

      {/* Popover — compact */}
      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-50 bg-surface rounded-xl border border-border shadow-xl overflow-hidden w-64">

          {/* Day view */}
          {view === 'day' && (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-3 pt-3 pb-1.5">
                <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
                  className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-surface-alt text-muted hover:text-body transition-colors">
                  <IconChevronLeft size={13} />
                </button>
                <div className="flex items-center gap-1 text-xs font-bold text-heading">
                  <button onClick={() => setView('month')}
                    className="hover:text-accent-green transition-colors px-1.5 py-0.5 rounded-md hover:bg-surface-alt">
                    {MONTH_FULL[cursor.getMonth()]}
                  </button>
                  <button onClick={() => setView('year')}
                    className="hover:text-accent-green transition-colors px-1.5 py-0.5 rounded-md hover:bg-surface-alt">
                    {cursor.getFullYear()}
                  </button>
                </div>
                <button onClick={() => { const n = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1); if (n <= maxDate) setCursor(n); }}
                  disabled={!canGoNext}
                  className={`w-6 h-6 flex items-center justify-center rounded-lg transition-colors ${canGoNext ? 'hover:bg-surface-alt text-muted hover:text-body' : 'text-border cursor-not-allowed'}`}>
                  <IconChevronRight size={13} />
                </button>
              </div>

              {/* DOW labels */}
              <div className="grid grid-cols-7 px-2 pb-0.5">
                {DAYS.map((d, i) => (
                  <div key={i} className="text-center text-[9px] font-bold text-muted py-1">{d}</div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 px-2 pb-3 gap-y-0.5">
                {cells.map((d, i) => {
                  if (!d) return <div key={i} />;
                  const active   = !!isSelected(d);
                  const disabled = isDisabled(d);
                  const today    = isToday(d);
                  return (
                    <button key={i} onClick={() => select(d)} disabled={disabled}
                      className={`relative h-7 w-full rounded-lg text-[11px] font-medium transition-all
                        ${active ? 'text-white font-bold' : ''}
                        ${!active && !disabled ? 'hover:bg-surface-alt text-body' : ''}
                        ${disabled ? 'text-muted/25 cursor-not-allowed' : ''}
                      `}
                      style={active ? { background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' } : {}}>
                      {d}
                      {today && !active && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                          style={{ background: '#00D4AA' }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Month view */}
          {view === 'month' && (
            <div className="p-3">
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-xs font-bold text-heading">{cursor.getFullYear()}</p>
                <button onClick={() => setView('day')} className="text-[10px] text-accent-green hover:underline">← Back</button>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {MONTHS.map((m, i) => {
                  const active   = cursor.getMonth() === i;
                  const disabled = new Date(cursor.getFullYear(), i, 1) > maxDate;
                  return (
                    <button key={m} disabled={disabled}
                      onClick={() => { setCursor(new Date(cursor.getFullYear(), i, 1)); setView('day'); }}
                      className={`py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                        active ? 'text-white' : disabled ? 'text-muted/25 cursor-not-allowed' : 'bg-surface-alt text-body hover:bg-border/60'
                      }`}
                      style={active ? { background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' } : {}}>
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Year view */}
          {view === 'year' && (
            <div className="p-3">
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-xs font-bold text-heading">Select Year</p>
                <button onClick={() => setView('day')} className="text-[10px] text-accent-green hover:underline">← Back</button>
              </div>
              <div className="grid grid-cols-4 gap-1.5 max-h-44 overflow-y-auto scrollbar-thin pr-0.5">
                {yearRange.map((y) => {
                  const active = cursor.getFullYear() === y;
                  return (
                    <button key={y}
                      onClick={() => { setCursor(new Date(y, cursor.getMonth(), 1)); setView('day'); }}
                      className={`py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                        active ? 'text-white' : 'bg-surface-alt text-body hover:bg-border/60'
                      }`}
                      style={active ? { background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' } : {}}>
                      {y}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
