import { useState } from 'react'

const styleTag = document.createElement('style')
styleTag.textContent = `
  @keyframes slideUp {
    from { transform: translateY(100%); opacity: 0; }
    to   { transform: translateY(0); opacity: 1; }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`
if (!document.head.querySelector('#loc-styles')) {
  styleTag.id = 'loc-styles'
  document.head.appendChild(styleTag)
}

export default function LocationAccessComponent({ onGranted }) {
  const [status, setStatus] = useState('idle')

  const requestLocation = () => {
  if (!navigator.geolocation) {
    setStatus("denied");
    return;
  }

  setStatus("loading");

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;

      setStatus("granted");

      // send to next screen
      onGranted?.({ latitude, longitude });
    },
    (error) => {
      console.error(error);
      setStatus("denied");
    }
  );
};

  return (
    <div style={s.page}>
      {/* Full-screen blurred skeleton background */}
      <div style={s.skeletonBg}>
        <AppSkeleton />
      </div>

      {/* Dark overlay */}
      <div style={s.backdrop} />

      {/* Bottom sheet — fixed to viewport bottom */}
      <div style={s.sheet}>
        <button style={s.closeBtn} onClick={() => onGranted?.()}>✕</button>

        <div style={s.iconCircle}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
              fill="#c0392b"
            />
            <circle cx="12" cy="9" r="2.5" fill="#fff" />
          </svg>
        </div>

        <h2 style={s.title}>Allow Location Access</h2>
        <p style={s.desc}>
          We need your location to find the nearest store and personalise your coupon experience.
        </p>

        {status === 'denied' && (
          <p style={s.deniedMsg}>
            ⚠️ Location denied. Please allow access in your browser settings and try again.
          </p>
        )}

        <button
          style={{ ...s.allowBtn, ...(status === 'loading' ? s.btnDisabled : {}) }}
          onClick={requestLocation}
          disabled={status === 'loading'}
        >
          {status === 'loading'
            ? <span style={s.spinner} />
            : status === 'denied' ? 'Try Again' : 'Allow Location'}
        </button>
      </div>
    </div>
  )
}

function AppSkeleton() {
  return (
    <div style={s.skeleton}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <div style={{ ...s.skBlock, width: 18, height: 18, borderRadius: 4 }} />
        <div style={{ ...s.skBlock, width: 130, height: 14, borderRadius: 7 }} />
      </div>
      <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
        <div style={{ ...s.skBlock, flex: 1, height: 150, borderRadius: 20 }} />
        <div style={{ ...s.skBlock, flex: 1, height: 150, borderRadius: 20 }} />
      </div>
      <div style={{ ...s.skBlock, width: '55%', height: 18, borderRadius: 9, marginBottom: 10 }} />
      <div style={{ ...s.skBlock, width: '80%', height: 12, borderRadius: 6, marginBottom: 8 }} />
      <div style={{ ...s.skBlock, width: '65%', height: 12, borderRadius: 6, marginBottom: 20 }} />
      <div style={{ ...s.skBlock, width: '100%', height: 130, borderRadius: 20 }} />
    </div>
  )
}

const s = {
  page: {
    width: '100%',
    minHeight: '100vh',
    background: '#fdf4f0',
    fontFamily: "'Segoe UI', Arial, sans-serif",
    position: 'relative',
    overflow: 'hidden',
  },
  skeletonBg: {
    position: 'fixed',
    inset: 0,
    filter: 'blur(2px)',
    pointerEvents: 'none',
    background: '#fdf4f0',
  },
  skeleton: {
    padding: '28px 20px',
    display: 'flex',
    flexDirection: 'column',
  },
  skBlock: {
    background: 'rgba(192,57,43,0.13)',
    flexShrink: 0,
  },
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.08)',
    zIndex: 10,
  },

  /* KEY FIX: position fixed so it anchors to viewport, not parent */
  sheet: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    background: '#fff',
    borderRadius: '24px 24px 0 0',
    padding: '28px 24px 44px',
    zIndex: 20,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxShadow: '0 -8px 40px rgba(0,0,0,0.12)',
    animation: 'slideUp 0.35s cubic-bezier(.22,.68,0,1.2) both',
  },
  closeBtn: {
    position: 'absolute',
    top: 18,
    right: 20,
    background: 'none',
    border: 'none',
    fontSize: 18,
    color: '#999',
    cursor: 'pointer',
    lineHeight: 1,
    padding: '4px 8px',
    fontWeight: 400,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    background: '#ffe0e0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  title: {
    color: '#e03030',
    fontSize: 22,
    fontWeight: 800,
    marginBottom: 12,
    textAlign: 'center',
  },
  desc: {
    color: '#777',
    fontSize: 14,
    lineHeight: 1.6,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 300,
  },
  deniedMsg: {
    color: '#e03030',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 14,
    background: '#fde8e8',
    padding: '10px 16px',
    borderRadius: 10,
    lineHeight: 1.5,
    width: '100%',
  },
  allowBtn: {
    width: '100%',
    height: 56,
    background: 'linear-gradient(90deg, #e03030 0%, #ff4444 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: 28,
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 6px 20px rgba(224,48,48,0.35)',
  },
  btnDisabled: { opacity: 0.75, cursor: 'not-allowed' },
  spinner: {
    width: 22,
    height: 22,
    border: '3px solid rgba(255,255,255,0.4)',
    borderTop: '3px solid #fff',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
    display: 'inline-block',
  },
}