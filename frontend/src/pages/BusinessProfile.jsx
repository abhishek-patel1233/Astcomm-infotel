import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { ArrowLeft, ImagePlus, Plus, Share2, Phone, Mail, MapPin, Lightbulb, Eraser } from 'lucide-react';
import Navbar from '../components/Navbar';

const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu & Kashmir', 'Ladakh',
  'Chandigarh', 'Puducherry',
];

const BUSINESS_TYPES = ['Retailer', 'Wholesaler', 'Distributor', 'Manufacturer', 'Services', 'Other'];

const THEMES = [
  { name: 'Maroon', bg: 'linear-gradient(135deg,#2e0711,#6b1226)', accent: '#f4c27a', dot: '#6b1226' },
  { name: 'Navy', bg: 'linear-gradient(135deg,#0b1f3a,#1d4e89)', accent: '#9bd1ff', dot: '#1d4e89' },
  { name: 'Emerald', bg: 'linear-gradient(135deg,#053b2f,#0f9d74)', accent: '#c8f7e4', dot: '#0f9d74' },
  { name: 'Sunset', bg: 'linear-gradient(135deg,#6b1d0b,#e8870e)', accent: '#ffe7b8', dot: '#e8870e' },
];

const emptyProfile = () => ({
  businessName: '',
  gstin: '',
  showGstin: false,
  phone1: '',
  phone2: '',
  email: '',
  address: '',
  pincode: '',
  description: '',
  logo: '',
  signature: '',
  theme: 0,
  businessType: '',
  category: '',
  state: '',
  pan: '',
  website: '',
  terms: '',
});

// ---------- small reusable pieces (bahar defined, taaki typing me focus na jaye) ----------
function FloatField({ label, value, onChange, error, type = 'text', maxLength, multiline, placeholder, children }) {
  const base =
    'w-full px-3.5 py-3.5 rounded-xl bg-white border text-slate-800 text-base focus:outline-none focus:border-blue-600 ' +
    (error ? 'border-rose-400' : 'border-slate-300');
  return (
    <div>
      <div className="relative">
        <span className="absolute -top-2 left-3 px-1 bg-white text-xs z-10 text-slate-400">{label}</span>
        {children ||
          (multiline ? (
            <textarea rows={3} value={value} maxLength={maxLength} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={base} />
          ) : (
            <input type={type} value={value} maxLength={maxLength} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={base} />
          ))}
      </div>
      {error && <p className="text-xs text-rose-500 mt-1 ml-1">{error}</p>}
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full p-0.5 transition ${checked ? 'bg-blue-600' : 'bg-slate-300'}`}
    >
      <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  );
}

function SignaturePad({ value, onChange }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);

  useEffect(() => {
    const c = canvasRef.current;
    const ratio = window.devicePixelRatio || 1;
    const w = c.parentElement.clientWidth;
    const h = 180;
    c.width = w * ratio;
    c.height = h * ratio;
    c.style.width = `${w}px`;
    c.style.height = `${h}px`;
    const ctx = c.getContext('2d');
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#111';
    if (value) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, w, h);
      img.src = value;
    }
    // eslint-disable-next-line
  }, []);

  const pos = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const down = (e) => {
    drawing.current = true;
    canvasRef.current.setPointerCapture(e.pointerId);
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 0.1, y + 0.1);
    ctx.stroke();
  };

  const move = (e) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const up = () => {
    if (!drawing.current) return;
    drawing.current = false;
    onChange(canvasRef.current.toDataURL('image/png'));
  };

  const clear = () => {
    const c = canvasRef.current;
    c.getContext('2d').clearRect(0, 0, c.clientWidth, c.clientHeight);
    onChange('');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-base font-semibold text-slate-700">Signature</h3>
        <button type="button" onClick={clear} className="flex items-center space-x-1 text-xs font-bold text-rose-500">
          <Eraser className="w-4 h-4" />
          <span>Clear</span>
        </button>
      </div>
      <div className="border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 overflow-hidden">
        <canvas
          ref={canvasRef}
          style={{ touchAction: 'none', display: 'block' }}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerLeave={up}
        />
      </div>
      <p className="text-[11px] text-slate-400 mt-1.5">Upar box me ungli ya mouse se sign karein. Ye invoice par "Authorised Signatory" me aayega.</p>
    </div>
  );
}

// logo ko chhota karke save karte hain (localStorage bhari na ho)
const resizeImage = (file, max = 300) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/png'));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

export default function BusinessProfile() {
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const fileRef = useRef(null);

  const [tab, setTab] = useState('basic');
  const [errors, setErrors] = useState({});
  const [sharing, setSharing] = useState(false);

  const [p, setP] = useState(() => {
    const user = JSON.parse(localStorage.getItem('user')) || {};
    const saved = JSON.parse(localStorage.getItem('businessProfile')) || {};
    return {
      ...emptyProfile(),
      businessName: user.fullName || '',
      phone1: user.mobileNumber || '',
      email: user.email || '',
      ...saved,
    };
  });

  const set = (key, value) => {
    setP((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: '' }));
  };

  const theme = THEMES[p.theme] || THEMES[0];

  // Profile completion
  const completion = useMemo(() => {
    const checks = [p.businessName, p.gstin, p.phone1, p.email, p.address, p.pincode, p.description, p.logo, p.signature, p.state, p.businessType];
    const filled = checks.filter((v) => String(v || '').trim()).length;
    return Math.round((filled / checks.length) * 100);
  }, [p]);

  const handleLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      set('logo', await resizeImage(file));
    } catch {
      alert('Logo load nahi ho paya');
    }
    e.target.value = '';
  };

  const validate = () => {
    const err = {};
    if (!p.businessName.trim()) err.businessName = 'Business name zaroori hai';
    if (p.gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(p.gstin.toUpperCase())) err.gstin = 'GSTIN galat hai (15 character)';
    if (p.phone1 && !/^[0-9]{10}$/.test(p.phone1)) err.phone1 = '10 digit ka number daalein';
    if (p.phone2 && !/^[0-9]{10}$/.test(p.phone2)) err.phone2 = '10 digit ka number daalein';
    if (p.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) err.email = 'Email sahi nahi hai';
    if (p.pincode && !/^[0-9]{6}$/.test(p.pincode)) err.pincode = '6 digit ka pincode daalein';
    if (p.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(p.pan.toUpperCase())) err.pan = 'PAN galat hai (jaise ABCDE1234F)';
    return err;
  };

  const handleSave = () => {
    const err = validate();
    setErrors(err);
    if (Object.keys(err).length) {
      // jis tab me error hai wahan le jao
      const basicKeys = ['businessName', 'gstin', 'phone1', 'phone2', 'email', 'pincode'];
      setTab(basicKeys.some((k) => err[k]) ? 'basic' : 'business');
      return;
    }

    const clean = { ...p, gstin: p.gstin.toUpperCase(), pan: p.pan.toUpperCase() };
    localStorage.setItem('businessProfile', JSON.stringify(clean));

    const user = JSON.parse(localStorage.getItem('user')) || {};
    localStorage.setItem(
      'user',
      JSON.stringify({ ...user, fullName: clean.businessName, mobileNumber: clean.phone1, email: clean.email })
    );

    alert('Business Profile saved successfully!');
    navigate('/home');
  };

  const cardText = () =>
    [
      p.businessName,
      p.phone1 && `Phone: ${[p.phone1, p.phone2].filter(Boolean).join(', ')}`,
      p.email && `Email: ${p.email}`,
      p.address && `Address: ${p.address}${p.pincode ? ' - ' + p.pincode : ''}`,
      p.showGstin && p.gstin && `GSTIN: ${p.gstin}`,
    ]
      .filter(Boolean)
      .join('\n');

  const handleShareCard = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const canvas = await html2canvas(cardRef.current, { scale: 2, backgroundColor: null, useCORS: true });
      const blob = await new Promise((r) => canvas.toBlob(r, 'image/png'));
      const file = new File([blob], 'visiting-card.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: p.businessName, text: cardText() });
          return;
        } catch (e) {
          if (e.name === 'AbortError') return;
        }
      }

      // Fallback: image download + WhatsApp text
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'visiting-card.png';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      window.open(`https://wa.me/?text=${encodeURIComponent(cardText())}`, '_blank');
    } catch (err) {
      console.error(err);
      alert('Card share nahi ho paya');
    } finally {
      setSharing(false);
    }
  };

  const phones = [p.phone1, p.phone2].filter(Boolean).join(', ');

  return (
    <div className="min-h-screen w-full bg-white flex flex-col pb-32 md:pb-24">
      <Navbar />

      {/* Header */}
      <header className="bg-white px-4 py-3 flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <button onClick={() => navigate('/home')} className="text-slate-700 hover:text-black">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 leading-tight">Business Profile</h1>
            <span className="text-xs text-slate-500">Astcomm Infotel Billing</span>
          </div>
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          className="relative w-11 h-11 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-center text-slate-500 hover:bg-slate-50"
          title="Logo upload"
        >
          <ImagePlus className="w-5 h-5" />
          <span className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full p-0.5">
            <Plus className="w-3 h-3" />
          </span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleLogo} className="hidden" />
      </header>

      {/* Visiting card section */}
      <section className="bg-blue-50 px-4 pt-5 pb-6">
        <div className="max-w-xl mx-auto">
          <div
            ref={cardRef}
            style={{
              background: theme.bg,
              borderRadius: 20,
              padding: '22px 22px 40px',
              position: 'relative',
              overflow: 'hidden',
              color: '#fff',
              minHeight: 210,
            }}
          >
            {/* decoration */}
            <div style={{ position: 'absolute', right: -50, top: -50, width: 170, height: 170, borderRadius: '50%', border: `18px solid ${theme.accent}`, opacity: 0.18 }} />
            <div style={{ position: 'absolute', left: -60, bottom: -60, width: 170, height: 170, borderRadius: '50%', border: `18px solid ${theme.accent}`, opacity: 0.15 }} />
            <div style={{ position: 'absolute', right: 14, bottom: 14, width: 60, height: 60, borderRadius: '50%', border: `8px solid ${theme.accent}`, opacity: 0.18 }} />

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                onClick={() => fileRef.current?.click()}
                style={{
                  width: 62, height: 62, borderRadius: 12, background: '#fff', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden',
                }}
              >
                {p.logo ? (
                  <img src={p.logo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <div style={{ textAlign: 'center', color: '#2563eb', fontSize: 11, fontWeight: 700, lineHeight: 1.2 }}>
                    <div style={{ fontSize: 18 }}>+</div>Logo
                  </div>
                )}
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 0.3, wordBreak: 'break-word' }}>
                {p.businessName || 'Your Business Name'}
              </div>
            </div>

            <div style={{ position: 'relative', marginTop: 18, fontSize: 13, lineHeight: 1.9 }}>
              {phones && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Phone size={15} color={theme.accent} /> <span>{phones}</span>
                </div>
              )}
              {p.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Mail size={15} color={theme.accent} /> <span>{p.email}</span>
                </div>
              )}
              {p.address && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MapPin size={15} color={theme.accent} /> <span>{p.address}{p.pincode ? ` - ${p.pincode}` : ''}</span>
                </div>
              )}
              {p.showGstin && p.gstin && (
                <div style={{ marginTop: 4, fontSize: 12, color: theme.accent, fontWeight: 700 }}>GSTIN: {p.gstin.toUpperCase()}</div>
              )}
            </div>
          </div>

          {/* Share button */}
          <div className="flex justify-center -mt-6 relative z-10">
            <button
              onClick={handleShareCard}
              disabled={sharing}
              className="flex items-center space-x-2 bg-rose-600 text-white px-8 py-3.5 rounded-full font-extrabold shadow-lg hover:bg-rose-700 transition disabled:opacity-60"
            >
              <Share2 className="w-5 h-5" />
              <span>{sharing ? 'Please wait...' : 'Share Card'}</span>
            </button>
          </div>

          {/* Theme picker */}
          <div className="flex items-center justify-center space-x-3 mt-4">
            {THEMES.map((t, i) => (
              <button
                key={t.name}
                onClick={() => set('theme', i)}
                title={t.name}
                className={`w-8 h-8 rounded-full border-2 transition ${p.theme === i ? 'border-slate-800 scale-110' : 'border-white'}`}
                style={{ background: t.bg }}
              />
            ))}
          </div>

          <div className="flex items-start space-x-3 mt-5 px-1">
            <Lightbulb className="w-8 h-8 text-amber-500 shrink-0" />
            <p className="text-sm text-slate-600">67% businessmen saw their business increase after sharing their visiting card</p>
          </div>
        </div>
      </section>

      {/* Profile completion */}
      <section className="px-4 pt-5 max-w-3xl mx-auto w-full">
        <h2 className="text-lg font-bold text-slate-800">Profile {completion}% complete.</h2>
        <div className="h-2 bg-slate-200 rounded-full mt-3 overflow-hidden">
          <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${completion}%` }} />
        </div>
      </section>

      {/* Tabs */}
      <div className="max-w-3xl mx-auto w-full mt-5 border-t border-dashed border-slate-300">
        <div className="grid grid-cols-2 border-b border-slate-200">
          {[['basic', 'Basic Details'], ['business', 'Business Details']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`py-3.5 text-base font-bold transition border-b-2 ${
                tab === key ? 'text-rose-600 border-rose-600' : 'text-slate-400 border-transparent'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <main className="max-w-3xl mx-auto w-full p-4 sm:p-6 space-y-6">
        {tab === 'basic' ? (
          <>
            <FloatField label="Business Name" value={p.businessName} onChange={(v) => set('businessName', v)} error={errors.businessName} />

            <div>
              <FloatField label="GSTIN" value={p.gstin} maxLength={15} onChange={(v) => set('gstin', v.toUpperCase())} error={errors.gstin} />
              <div className="flex justify-end items-center space-x-3 mt-2">
                <span className="text-sm text-slate-500">Show on card</span>
                <Toggle checked={p.showGstin} onChange={(v) => set('showGstin', v)} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <FloatField label="Phone Number 1" type="tel" maxLength={10} value={p.phone1} onChange={(v) => set('phone1', v.replace(/\D/g, ''))} error={errors.phone1} />
              <FloatField label="Phone Number 2" type="tel" maxLength={10} value={p.phone2} onChange={(v) => set('phone2', v.replace(/\D/g, ''))} error={errors.phone2} />
            </div>

            <FloatField label="Email ID" type="email" value={p.email} onChange={(v) => set('email', v)} error={errors.email} />
            <FloatField label="Business Address" value={p.address} onChange={(v) => set('address', v)} multiline />
            <FloatField label="Pincode" type="tel" maxLength={6} value={p.pincode} onChange={(v) => set('pincode', v.replace(/\D/g, ''))} error={errors.pincode} />
            <FloatField label="Business Description" value={p.description} onChange={(v) => set('description', v)} multiline />

            <SignaturePad value={p.signature} onChange={(v) => set('signature', v)} />
          </>
        ) : (
          <>
            <FloatField label="Business Type">
              <select
                value={p.businessType}
                onChange={(e) => set('businessType', e.target.value)}
                className="w-full px-3.5 py-3.5 rounded-xl bg-white border border-slate-300 text-slate-800 text-base focus:outline-none focus:border-blue-600"
              >
                <option value="">Select</option>
                {BUSINESS_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </FloatField>

            <FloatField label="Business Category" value={p.category} onChange={(v) => set('category', v)} placeholder="e.g. IT Services, Electronics" />

            <FloatField label="State">
              <select
                value={p.state}
                onChange={(e) => set('state', e.target.value)}
                className="w-full px-3.5 py-3.5 rounded-xl bg-white border border-slate-300 text-slate-800 text-base focus:outline-none focus:border-blue-600"
              >
                <option value="">Select State</option>
                {STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </FloatField>

            <FloatField label="PAN Number" maxLength={10} value={p.pan} onChange={(v) => set('pan', v.toUpperCase())} error={errors.pan} />
            <FloatField label="Website" value={p.website} onChange={(v) => set('website', v)} placeholder="www.example.com" />
            <FloatField label="Terms & Conditions (invoice par)" value={p.terms} onChange={(v) => set('terms', v)} multiline placeholder="1. Payment due as per agreed credit terms." />
          </>
        )}
      </main>

      {/* Bottom bar */}
      <div className=" pb-20 fixed bottom-0 left-0 right-0 grid grid-cols-2 bg-white border-t border-slate-200 z-20 shadow-lg">
        <button onClick={() => navigate('/home')} className="py-4 text-slate-500 font-bold text-base hover:bg-slate-50 transition">
          Cancel
        </button>
        <button onClick={handleSave} className="py-4 bg-rose-600 text-white font-bold text-base hover:bg-rose-700 transition ">
          Save
        </button>
      </div>
    </div>
  );
}