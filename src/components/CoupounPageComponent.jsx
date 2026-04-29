import { useState } from 'react'
import MapModalComponent from './MapModalComponent'

export default function CouponPageComponent({ formData, location }) {
    const [copied, setCopied] = useState(false)
    const [showMap, setShowMap] = useState(false)

    const promoCode = formData?.promoCode || '';
    const discountName = formData?.discountName || '';
    const validToDate = formData?.validToDate || '';


    const handleCopy = () => {
        navigator.clipboard?.writeText(promoCode).catch(() => { })
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleFindStores = () => {
        setShowMap(true)
    }

    const validTo = validToDate
        ? new Date(validToDate).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        })
        : '—';

    return (
        <div style={s.page}>

            {/* ── HERO: header image full width ── */}
            <div style={s.hero}>
                <img
                    src="/header_image.png"
                    alt=""
                    style={s.heroImg}
                />
            </div>

            {/* ── CARD overlapping hero ── */}
            <div style={s.card}>

                {/* Confetti spans full card top */}
                <img
                    src="/coupoun_confetti.png"
                    alt=""
                    aria-hidden
                    style={s.confettiImg}
                />

                {/* Gift icon centered over confetti */}
                <div style={s.giftWrapper}>
                    <img
                        src="/gift_image.png"
                        alt="Gift"
                        style={s.giftImg}
                    />
                </div>

                {/* Title */}
                <h1 style={s.title}>
                    Your Reward is{"\n"}Here!
                </h1>

                {/* Ticket */}
                <div style={s.ticket}>
                    <div style={{ ...s.notch, left: -14 }} />
                    <div style={{ ...s.notch, right: -14 }} />

                    <p style={s.exclusiveLabel}>EXCLUSIVE VOUCHER</p>
                    <p style={s.discountText}>{discountName || '—'}</p>
                    <p style={s.validDesc}>
                        Valid on all professional tier subscriptions
                    </p>
                </div>

                {/* Dashed line */}
                <div style={s.dashedLine} />

                {/* Code */}
                <p style={s.redeemLabel}>REDEEM CODE</p>
                <div style={s.codeRow}>
                    <span style={s.codeText}>{promoCode || '—'}</span>
                    <button style={s.copyBtn} onClick={handleCopy} disabled={!promoCode}>
                        {copied ? <span style={s.copiedTick}>✔</span> : <CopyIcon />}
                    </button>
                </div>

                {copied && <p style={s.copiedMsg}>Copied to clipboard!</p>}

                <p style={s.validity}>
                    Valid until <strong>{validTo}</strong>
                </p>
            </div>

            {/* ── Find Stores Button ── */}
            <div style={s.findBtnWrapper}>
                <button style={s.findBtn} onClick={handleFindStores}>
                    <span style={s.findBtnIcon}>
                        <LocationIcon />
                    </span>
                    Find Stores Nearby
                </button>
            </div>

            <MapModalComponent
                isOpen={showMap}
                userLat={location?.latitude}
                userLng={location?.longitude}
                onClose={() => setShowMap(false)}
            />

        </div>
    )
}

function CopyIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="#e03030" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
    )
}

function LocationIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="3 11 22 2 13 21 11 13 3 11" />
        </svg>
    )
}

const s = {
    page: {
        minHeight: '100vh',
        background: '#fdf4f0',
        fontFamily: "'Segoe UI', Arial, sans-serif",
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },

    /* Hero — full width, header image */
    hero: {
        width: '100%',
        height: 260,              // ← taller so overlap doesn't cut content
        overflow: 'visible',      // ← KEY: don't clip children
        flexShrink: 0,
        position: 'relative',
        zIndex: 0,
    },
    heroImg: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition: 'top center',
        display: 'block',
    },

    /* Card overlapping hero */
    card: {
        width: 'calc(100% - 45px)',
        maxWidth: 420,
        margin: '-170px auto 20px',
        position: 'relative',
        zIndex: 1,
        background: '#fff',
        borderRadius: 20,
        padding: '0 0 28px',           // no top padding — confetti fills it
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        position: 'relative',
        overflow: 'hidden',
    },

    /* Confetti — top of card, full width */
    confettiImg: {
        width: '100%',
        display: 'block',
        borderRadius: '20px 20px 0 0',
        zIndex: 0,
        flexShrink: 0,
    },

    /* Gift sits centered, pulled up over confetti */
    giftWrapper: {
        zIndex: 1,
        marginTop: -160,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    giftImg: {
        width: 72,
        height: 72,
        objectFit: 'contain',
        filter: 'drop-shadow(0 4px 12px rgba(192,57,43,0.25))',
    },

    title: {
        fontSize: 28,
        fontWeight: 900,
        color: '#1a1a1a',
        textAlign: 'center',
        lineHeight: 1.25,
        marginBottom: 22,
        whiteSpace: 'pre-line',
        zIndex: 1,
    },

    /* Ticket */
    ticket: {
        width: 'calc(100% - 48px)',
        background: 'linear-gradient(135deg,#e03030 0%,#ff4444 100%)',
        borderRadius: 16,
        // padding: '22px 28px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        marginBottom: 4,
    },
    notch: {
        position: 'absolute',
        top: '50%',
        transform: 'translateY(-50%)',
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: '#fff',
        zIndex: 3,
    },
    exclusiveLabel: {
        color: 'rgba(255,255,255,0.75)',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '2px',
        marginBottom: 10,
        textTransform: 'uppercase',
    },
    discountText: {
        color: '#fff',
        fontSize: 38,
        fontWeight: 900,
        textAlign: 'center',
        lineHeight: 1.15,
        marginBottom: 12,
        textShadow: '0 2px 8px rgba(0,0,0,0.15)',
        whiteSpace: 'pre-line',
    },
    validDesc: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 1.5,
    },

    dashedLine: {
        width: 'calc(100% - 48px)',
        borderTop: '2px dashed #f5c6c6',
        margin: '22px 0 18px',
    },
    redeemLabel: {
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '2px',
        color: '#aaa',
        marginBottom: 12,
        textTransform: 'uppercase',
    },
    codeRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        border: '1.5px solid #ffcccc',
        borderRadius: 30,
        padding: '10px 18px',
        marginBottom: 6,
        background: '#fff9f9',
    },
    codeText: {
        color: '#e03030',
        fontSize: 18,
        fontWeight: 800,
        letterSpacing: '1.5px',
    },
    copyBtn: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    copiedTick: { color: '#27ae60', fontSize: 18, fontWeight: 700 },
    copiedMsg: { color: '#27ae60', fontSize: 12, fontWeight: 600, marginBottom: 4 },
    validity: {
        color: '#e03030',
        fontSize: 13,
        marginTop: 10,
        textAlign: 'center',
    },

    /* Find Stores */
    findBtnWrapper: {
        width: 'calc(100% - 32px)',
        maxWidth: 420,
        marginBottom: 40,
    },
    findBtn: {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: '16px 24px',
        border: '1.5px solid #e8e8e8',
        borderRadius: 30,
        background: '#fff',
        fontSize: 16,
        fontWeight: 700,
        color: '#1a1a1a',
        cursor: 'pointer',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    },
    findBtnIcon: {
        background: '#e03030',
        color: '#fff',
        width: 34,
        height: 34,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
}