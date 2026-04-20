import { useState, useEffect, useRef, useCallback } from 'react'
import axiosInstance from '../service/axiosInstance' // adjust path as needed

// ─── Haversine distance (km) ───────────────────────────────────────────────
function getDistance(lat1, lng1, lat2, lng2) {
    const R = 6371
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ─── Leaflet loader ────────────────────────────────────────────────────────
function loadLeaflet() {
    return new Promise((resolve, reject) => {
        if (window.L) { resolve(window.L); return }

        if (!document.getElementById('leaflet-css')) {
            const link = document.createElement('link')
            link.id = 'leaflet-css'
            link.rel = 'stylesheet'
            link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
            document.head.appendChild(link)
        }

        const script = document.createElement('script')
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'
        script.onload = () => resolve(window.L)
        script.onerror = reject
        document.head.appendChild(script)

        const routingScript = document.createElement('script')
        routingScript.src =
            'https://unpkg.com/leaflet-routing-machine@latest/dist/leaflet-routing-machine.js'
        document.head.appendChild(routingScript)

        const routingCss = document.createElement('link')
        routingCss.rel = 'stylesheet'
        routingCss.href =
            'https://unpkg.com/leaflet-routing-machine@latest/dist/leaflet-routing-machine.css'
        document.head.appendChild(routingCss)
    })
}

// ─── Map Modal ─────────────────────────────────────────────────────────────
export default function MapModalComponent({
    isOpen,
    onClose,
    userLat = 21.1458,
    userLng = 79.0882,
}) {
    const mapDivRef = useRef(null)
    const mapInstanceRef = useRef(null)
    const markersRef = useRef([])
    const userMarkerRef = useRef(null)
    const routeRef = useRef(null)

    const [stores, setStores] = useState([])
    const [search, setSearch] = useState('')
    const [activeStore, setActiveStore] = useState(null)
    const [leafletReady, setLeafletReady] = useState(!!window.L)
    const [loading, setLoading] = useState(false)
    const [apiError, setApiError] = useState(null)

    // ── 1. Fetch stores via axiosInstance ─────────────────────────────────
    useEffect(() => {
        if (!isOpen) return
        setLoading(true)
        setApiError(null)

        axiosInstance
            .get('/stores')                          // baseURL already has http://localhost:5002
            .then(res => {
                // Response shape: { success, count, data: [...] }
                const raw = res.data?.data ?? []
                const mapped = raw.map(row => ({
                    code: row.plant_code,
                    name: row.location,
                    lat: parseFloat(row.latitude),
                    lng: parseFloat(row.longitude),
                    status: row.status,
                }))
                setStores(mapped)
            })
            .catch(err => {
                console.error('Store fetch failed:', err)
                setApiError('Could not load stores. Showing cached data.')
                // fallback — at least show Nagpur cluster
                setStores([
                    { code: 'L102', name: 'Ajni', lat: 21.10382, lng: 79.05302, status: 'Live' },
                    { code: 'L126', name: 'Chatarpati', lat: 21.108334, lng: 79.082532, status: 'Live' },
                    { code: 'L122', name: 'Sadar', lat: 21.146633, lng: 79.08886, status: 'Live' },
                    { code: 'L105', name: 'Manish Nagar', lat: 21.090675, lng: 79.082206, status: 'Live' },
                    { code: 'L106', name: 'Manewada', lat: 21.118375, lng: 79.104537, status: 'Live' },
                ])
            })
            .finally(() => setLoading(false))
    }, [isOpen])

    // ── 2. Load Leaflet ───────────────────────────────────────────────────
    useEffect(() => {
        if (!isOpen || leafletReady) return
        loadLeaflet()
            .then(() => setLeafletReady(true))
            .catch(() => setApiError('Map library failed to load.'))
    }, [isOpen, leafletReady])

    // ── 3. Init map (needs: isOpen + leafletReady + stores loaded + div) ──
    const initMap = useCallback(() => {
        if (!mapDivRef.current || !window.L || mapInstanceRef.current) return

        const L = window.L
        const map = L.map(mapDivRef.current, {
            center: [userLat, userLng],
            zoom: 13,
            zoomControl: false,
        })
        mapInstanceRef.current = map

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
        }).addTo(map)

        // Red teardrop pin
        const makeRedPin = () => L.divIcon({
            className: '',
            html: `<div style="
        width:26px;height:26px;
        background:#e03030;
        border:3px solid #fff;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        box-shadow:0 3px 10px rgba(224,48,48,0.55);
      "></div>`,
            iconSize: [26, 26],
            iconAnchor: [13, 26],
        })

        // Blue user dot
        const bluePin = L.divIcon({
            className: '',
            html: `<div style="
        width:16px;height:16px;border-radius:50%;
        background:#4285F4;border:3px solid #fff;
        box-shadow:0 0 0 5px rgba(66,133,244,0.22);
      "></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
        })

        // User marker
        userMarkerRef.current = L.marker([userLat, userLng], { icon: bluePin })
            .addTo(map)
            .bindPopup('<b style="font-family:Segoe UI,sans-serif">You are here</b>')

        // Store markers (Live only)
        stores.filter(st => st.status === 'Live').forEach(store => {
            const m = L.marker([store.lat, store.lng], { icon: makeRedPin() }).addTo(map)
            m.on('click', () => {
                setActiveStore(store)
                drawRoute(store)
            })
            markersRef.current.push(m)
        })

        // ← CRITICAL: let DOM paint first, then tell Leaflet actual size
        setTimeout(() => map.invalidateSize(), 120)

    }, [userLat, userLng, stores])

    // Trigger initMap once everything is ready
    useEffect(() => {
        if (!isOpen || !leafletReady || stores.length === 0) return
        const t = setTimeout(initMap, 100)
        return () => clearTimeout(t)
    }, [isOpen, leafletReady, stores, initMap])

    // Destroy map when modal closes
    useEffect(() => {
        if (!isOpen && mapInstanceRef.current) {
            mapInstanceRef.current.remove()
            mapInstanceRef.current = null
            markersRef.current = []
            userMarkerRef.current = null
            setActiveStore(null)
            setSearch('')
        }
    }, [isOpen])

    // ── 4. Search ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (!mapInstanceRef.current || !search.trim()) return
        const q = search.toLowerCase()
        const found = stores.find(s =>
            s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)
        )
        if (found) {
            mapInstanceRef.current.flyTo([found.lat, found.lng], 15, { duration: 0.9 })
            setActiveStore(found)
        }
    }, [search, stores])

    // ── 5. Re-centre ──────────────────────────────────────────────────────
    const goToUser = () => {
        mapInstanceRef.current?.flyTo([userLat, userLng], 13, { duration: 0.9 })
        setActiveStore(null)
    }

    // ── 6. Nearest 5 ─────────────────────────────────────────────────────
    const nearest = stores
        .filter(s => s.status === 'Live')
        .map(s => ({ ...s, dist: getDistance(userLat, userLng, s.lat, s.lng) }))
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 5)

    const drawRoute = (store) => {
        if (!window.L || !mapInstanceRef.current) return

        const L = window.L

        // remove old route
        if (routeRef.current) {
            mapInstanceRef.current.removeControl(routeRef.current)
        }

        routeRef.current = L.Routing.control({
            waypoints: [
                L.latLng(userLat, userLng),
                L.latLng(store.lat, store.lng),
            ],
            lineOptions: {
                styles: [{ color: "#e03030", weight: 5 }],
            },
            addWaypoints: false,
            draggableWaypoints: false,
            fitSelectedRoutes: true,
            show: false, // hides instruction panel
        }).addTo(mapInstanceRef.current)

        
    }

    const clearRoute = () => {
            if (routeRef.current && mapInstanceRef.current) {
                mapInstanceRef.current.removeControl(routeRef.current)
                routeRef.current = null
            }
        }

    const openGoogleMaps = (store) => {
        const url = `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${store.lat},${store.lng}&travelmode=driving`
        window.open(url, "_blank")
    }

    if (!isOpen) return null

    return (
        <div style={s.overlay}>
            <div style={s.blurBg}><AppSkeleton /></div>
            <div style={s.dimmer} onClick={onClose} />

            <div style={s.sheet}>

                {/* Top bar */}
                <div style={s.topBar}>
                    <button style={s.backBtn} onClick={onClose}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                            stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div style={s.dragHandle} />
                    <div style={{ width: 40 }} />
                </div>

                {/* Search bar */}
                <div style={s.searchWrap}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
                        stroke="#aaa" strokeWidth="2.2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                    </svg>
                    <input
                        style={s.searchInput}
                        placeholder="Find a store near you..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <button style={s.targetBtn} onClick={goToUser}>
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="none"
                            stroke="#e03030" strokeWidth="2.2" strokeLinecap="round">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                            <circle cx="12" cy="12" r="9" strokeDasharray="2 3" />
                        </svg>
                    </button>
                </div>

                {/* Status messages */}
                {loading && (
                    <div style={s.statusMsg}>
                        <span style={s.spinner} /> Loading stores...
                    </div>
                )}
                {apiError && !loading && (
                    <div style={{ ...s.statusMsg, color: '#e03030', background: '#fff5f5' }}>
                        ⚠ {apiError}
                    </div>
                )}

                {/* Map */}
                <div style={s.mapWrap}>
                    <div ref={mapDivRef} style={s.mapDiv} />

                    {/* Active store card */}
                    {activeStore && (
                        <div style={s.pinCard}>
                            <span style={s.pinDot} />

                            <div style={{ flex: 1 }}>
                                <p style={s.pinName}>{activeStore.name}</p>
                                <p style={s.pinCode}>{activeStore.code}</p>
                            </div>

                            {/* Navigate Button */}
                            <button
                                style={s.navigateBtn}
                                onClick={() => openGoogleMaps(activeStore)}
                            >
                                Navigate
                            </button>

                            {/* Close */}
                            <button
                                style={s.pinClose}
                                onClick={() => {
                                    setActiveStore(null)
                                    clearRoute()
                                }}
                            >
                                ✕
                            </button>
                        </div>
                    )}

                    {/* Re-centre FAB */}
                    <button style={s.fab} onClick={goToUser}>
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="#e03030">
                            <polygon points="3 11 22 2 13 21 11 13 3 11" />
                        </svg>
                    </button>
                </div>

                {/* Nearest stores list */}
                <div style={s.list}>
                    <p style={s.listTitle}>Nearest Stores</p>
                    {nearest.length === 0 && !loading && (
                        <p style={{ color: '#bbb', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>
                            No stores found
                        </p>
                    )}
                    {nearest.map(st => (
                        <div key={st.code} style={s.listRow}
                            onClick={() => {
                                mapInstanceRef.current?.flyTo([st.lat, st.lng], 15, { duration: 0.8 })
                                setActiveStore(st)
                                drawRoute(st)
                            }}>
                            <span style={{ fontSize: 20 }}>📍</span>
                            <div style={{ flex: 1 }}>
                                <p style={s.listName}>{st.name}</p>
                                <p style={s.listDist}>{st.dist.toFixed(1)} km away</p>
                            </div>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                                stroke="#ccc" strokeWidth="2" strokeLinecap="round">
                                <path d="M9 18l6-6-6-6" />
                            </svg>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

// ─── Background skeleton ───────────────────────────────────────────────────
function AppSkeleton() {
    const b = (w, h, r = 8) => ({
        width: w, height: h, borderRadius: r,
        background: 'rgba(192,57,43,0.10)', flexShrink: 0,
    })
    return (
        <div style={{ padding: '28px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={b(20, 20, 5)} /><div style={b(120, 14, 7)} />
            </div>
            <div style={{ display: 'flex', gap: 14 }}>
                <div style={b('50%', 150, 20)} /><div style={b('50%', 150, 20)} />
            </div>
            <div style={b('55%', 18, 9)} />
            <div style={b('80%', 12, 6)} />
            <div style={b('65%', 12, 6)} />
            <div style={b('100%', 120, 20)} />
        </div>
    )
}

// ─── Styles ────────────────────────────────────────────────────────────────
const s = {
    overlay: {
        position: 'fixed', inset: 0, zIndex: 9999,
        fontFamily: "'Segoe UI', Arial, sans-serif",
        background: '#fdf4f0',
    },
    blurBg: {
        position: 'absolute', inset: 0,
        filter: 'blur(3px)', pointerEvents: 'none',
        background: '#fdf4f0',
    },
    dimmer: {
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.08)', zIndex: 1,
    },
    sheet: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: '#fff', borderRadius: '24px 24px 0 0',
        zIndex: 10, display: 'flex', flexDirection: 'column',
        maxHeight: '80vh', overflow: 'hidden',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.15)',
    },
    topBar: {
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 16px 4px', flexShrink: 0,
    },
    dragHandle: {
        width: 44, height: 5, borderRadius: 3, background: '#e0e0e0',
    },
    backBtn: {
        width: 40, height: 40, borderRadius: '50%',
        background: '#e03030', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(224,48,48,0.3)', flexShrink: 0,
    },
    searchWrap: {
        display: 'flex', alignItems: 'center', gap: 8,
        margin: '10px 16px',
        background: '#f8f8f8', border: '1.5px solid #eee',
        borderRadius: 50, padding: '0 14px', height: 48, flexShrink: 0,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    },
    searchInput: {
        flex: 1, border: 'none', background: 'transparent',
        fontSize: 14, color: '#333', outline: 'none', fontFamily: 'inherit',
    },
    targetBtn: {
        background: 'none', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', padding: 4,
    },
    statusMsg: {
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: 12, color: '#888',
        margin: '-4px 16px 6px', padding: '7px 14px',
        background: '#f8f8f8', borderRadius: 10,
    },
    spinner: {
        display: 'inline-block',
        width: 14, height: 14,
        border: '2px solid #ddd',
        borderTop: '2px solid #e03030',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
    },
    mapWrap: {
        flex: 1, position: 'relative',
        minHeight: 280, maxHeight: 340,
        overflow: 'hidden',
    },
    mapDiv: {
        position: 'absolute', inset: 0,   // fills parent exactly — Leaflet can measure this
    },
    pinCard: {
        position: 'absolute', bottom: 12, left: 12, right: 12,
        background: '#fff', borderRadius: 14, padding: '10px 14px',
        display: 'flex', alignItems: 'center', gap: 10,
        boxShadow: '0 4px 20px rgba(0,0,0,0.18)', zIndex: 999,
    },
    pinDot: {
        width: 10, height: 10, borderRadius: '50%',
        background: '#e03030', flexShrink: 0, display: 'block',
    },
    pinName: { fontSize: 14, fontWeight: 700, color: '#1a1a1a', margin: 0 },
    pinCode: { fontSize: 12, color: '#999', margin: '2px 0 0' },
    pinClose: {
        marginLeft: 'auto', background: 'none',
        border: 'none', color: '#bbb', fontSize: 16, cursor: 'pointer',
    },
    navigateBtn: {
        height: 32,
        padding: "0 12px",
        borderRadius: 20,
        border: "none",
        background: "#e03030",
        color: "#fff",
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 8px rgba(224,48,48,0.3)",
        marginRight: 6,
        transition: "all 0.2s ease",
    },
    fab: {
        position: 'absolute', bottom: 70, right: 14,
        width: 44, height: 44, borderRadius: '50%',
        background: '#fff', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 3px 14px rgba(0,0,0,0.2)', zIndex: 999,
    },
    list: {
        padding: '10px 16px 28px', flexShrink: 0,
        borderTop: '1px solid #f2f2f2',
        overflowY: 'auto', maxHeight: 200,
    },
    listTitle: {
        fontSize: 10, fontWeight: 700, letterSpacing: '1.5px',
        color: '#bbb', textTransform: 'uppercase', marginBottom: 8,
    },
    listRow: {
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '9px 0', borderBottom: '1px solid #f8f8f8', cursor: 'pointer',
    },
    listName: { fontSize: 14, fontWeight: 600, color: '#1a1a1a', margin: 0 },
    listDist: { fontSize: 12, color: '#999', margin: '2px 0 0' },
}