import { Gift } from "lucide-react";
import { useEffect, useState } from "react";
import axiosInstance from "../service/axiosInstance";


export default function NewCustomerComponent({ onSubmit, location }) {
    const [mobile, setMobile] = useState("");
    const [name, setName] = useState("");
    const [triedChicken, setTriedChicken] = useState("");
    const [isVerified, setIsVerified] = useState(false);
    const [checking, setChecking] = useState(false);

    const checkCustomer = async (mobileNumber) => {
        try {
            setChecking(true);

            const res = await axiosInstance.get(`/customer/${mobileNumber}`);

            const data = res.data?.data;

            if (data) {
                setIsVerified(true);

                // autofill
                setName(data.name || "");
                setTriedChicken(data.triedChicken || "yes");
            }
        } catch (error) {
            // if not found → reset
            setIsVerified(false);
        } finally {
            setChecking(false);
        }
    };

    useEffect(() => {
        if (mobile.length === 10) {
            const timer = setTimeout(() => {
                checkCustomer(mobile);
            }, 500); // debounce

            return () => clearTimeout(timer);
        } else {
            setIsVerified(false);
        }
    }, [mobile]);

    const handleSubmit = async () => {
        if (isVerified) {
            onSubmit({ mobile, name, triedChicken });
            return;
        }

        if (!mobile || !name) {
            alert("Please fill in all required fields.");
            return;
        }

        try {
            const res = await axiosInstance.post("/create-customer", {
                name: name,
                mobilenumber: mobile,
                triedChicken: triedChicken,
                customerLatitude: location?.latitude,
                customerLongitude: location?.longitude,
            });

            console.log("Customer created:", res.data);

            // move to next screen
            onSubmit({ mobile, name, triedChicken });
        } catch (error) {
            console.error(error);

            const message =
                error?.response?.data?.message || "Failed to submit customer";

            alert(message);
        }
    };

    return (
        <div style={styles.body}>

            {/* ── HERO ── */}
            <div style={styles.hero}>
                <img
                    src="/header_image_with_logo.png"
                    alt="Abis Pro Chicken Store"
                    style={styles.heroImg}
                />
            </div>

            {/* ── CARD ── */}
            <div style={styles.card}>
                <div style={styles.detailcard}>
                    {/* Badge */}
                    <div style={styles.badge}>
                        <span style={{ fontSize: 13 }}><Gift /></span>
                        UNLOCK YOUR COUPON
                    </div>

                    <h1 style={styles.title}>Just a few details</h1>
                    <p style={styles.subtitle}>
                        Fill in the information below to receive your exclusive welcome gift.
                    </p>

                </div>

                <div style={{ marginTop: "10px" }}>
                    {/* Mobile */}
                    <label style={styles.label}>
                        MOBILE NUMBER <span style={styles.req}>*</span>
                    </label>
                    <div style={{ position: "relative", marginBottom: 22 }}>
                        {checking && (
                            <div style={styles.statusBadge}>
                                Checking...
                            </div>
                        )}

                        {isVerified && !checking && (
                            <div style={styles.statusBadgeVerified}>
                                ✔ Verified
                            </div>
                        )}

                        <div style={styles.inputRow}>
                            <div style={styles.countryCode}>+91</div>

                            <input
                                style={styles.phoneInput}
                                type="tel"
                                placeholder="Enter mobile number"
                                maxLength={10}
                                value={mobile}
                                onChange={(e) =>
                                    setMobile(e.target.value.replace(/\D/g, ""))
                                }
                            />
                        </div>
                    </div>

                    {/* Full Name */}
                    <label style={styles.label}>
                        FULL NAME <span style={styles.req}>*</span>
                    </label>
                    <input
                        style={styles.plainInput}
                        type="text"
                        placeholder="Enter your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />

                    {/* Yes / No */}
                    <p style={styles.question}>
                        Have you tried Abis Pro Chicken?{" "}
                        <span style={styles.req}>*</span>
                    </p>
                    <div style={styles.toggleGroup}>
                        <button
                            style={
                                triedChicken === "yes"
                                    ? { ...styles.toggleBtn, ...styles.toggleActive }
                                    : styles.toggleBtn
                            }
                            onClick={() => setTriedChicken("yes")}
                        >
                            {triedChicken === "yes" && (
                                <span style={styles.checkCircle}>✔</span>
                            )}
                            Yes
                        </button>
                        <button
                            style={
                                triedChicken === "no"
                                    ? { ...styles.toggleBtn, ...styles.toggleActive }
                                    : styles.toggleBtn
                            }
                            onClick={() => setTriedChicken("no")}
                        >
                            {triedChicken === "no" && (
                                <span style={styles.checkCircle}>✔</span>
                            )}
                            No
                        </button>
                    </div>
                </div>

                {/* Submit */}
                <button style={styles.submitBtn} onClick={handleSubmit}>
                    Submit Response &nbsp;
                    <span style={styles.submitArrow}>➤</span>
                </button>
            </div>
        </div>
    );
}

/* ── Styles ── */
const styles = {
    body: {
        minHeight: "100vh",
        // background: "#fbe8e8",
        background: "#fff",
        fontFamily: "'Segoe UI', Arial, sans-serif",
    },
    phoneWrapper: {
        width: 390,
        minHeight: 780,
        background: "#fbe8e8",
        borderRadius: 36,
        overflow: "hidden",
        boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
        position: "relative",
    },

    /* HERO (Full width banner) */
    hero: {
        height: 260,
        width: "100%",
        overflow: "hidden",
    },
    heroImg: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
    },

    /* CARD (overlapping hero) */
    card: {
        maxWidth: 420,
        margin: "-100px 15px 40px", // 🔥 THIS creates overlap
        background: "#fff",
        borderRadius: 20,
        padding: 20,
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        position: "relative",
        zIndex: 2,
    },

    detailcard: {
        maxWidth: 420,
        // margin: "-100px 15px 40px", // 🔥 THIS creates overlap
        background: "#fff",
        borderRadius: 20,
        padding: 20,
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        position: "relative",
        zIndex: 2,
        textAlign: "justify"
    },

    /* Badge */
    badge: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "#fde8e8",
        color: "#e03030",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "1.2px",
        padding: "6px 14px",
        borderRadius: 20,
        marginBottom: 14,
    },

    title: {
        color: "#e03030",
        fontSize: 26,
        fontWeight: 800,
        lineHeight: 1.2,
        marginBottom: 10,
    },
    subtitle: {
        color: "#555",
        fontSize: 14,
        lineHeight: 1.55,
        marginBottom: 26,
    },

    /* Labels */
    label: {
        display: "block",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "1px",
        color: "#333",
        marginBottom: 8,
        textTransform: "uppercase",
        textAlign: "justify"
    },
    req: { color: "#e03030" },

    /* Phone input row */
    inputRow: {
        display: "flex",
        alignItems: "center",
        border: "1.5px solid #f0d0d0",
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: 22,
        background: "#fff",
        gap: 8,
    },
    countryCode: {
        padding: "0 14px",
        fontSize: 15,
        fontWeight: 600,
        color: "#333",
        background: "#fce8e8",
        height: 52,
        display: "flex",
        alignItems: "center",
        borderRight: "1.5px solid #f0d0d0",
        minWidth: 56,
        justifyContent: "center",
        flexShrink: 0,
    },
    phoneInput: {
        border: "none",
        outline: "none",
        flex: 1,
        padding: "0 14px",
        fontSize: 15,
        color: "#222",
        height: 52,
        background: "transparent",
    },

    /// Status badge (for verification)
    statusBadge: {
        position: "absolute",
        top: -18,
        right: 0,
        fontSize: 12,
        color: "#999",
        fontWeight: 500,
    },

    statusBadgeVerified: {
        position: "absolute",
        top: -18,
        right: 0,
        fontSize: 12,
        fontWeight: 700,
        color: "#16a34a",
        background: "#dcfce7",
        padding: "2px 8px",
        borderRadius: 12,
    },

    /* Plain input */
    plainInput: {
        border: "1.5px solid #f0d0d0",
        borderRadius: 12,
        width: "100%",
        padding: "0 16px",
        height: 52,
        fontSize: 15,
        color: "#222",
        outline: "none",
        marginBottom: 24,
        display: "block",
        boxSizing: "border-box",
    },

    /* Question */
    question: {
        fontSize: 15,
        fontWeight: 600,
        color: "#222",
        marginBottom: 14,
        textAlign: "justify"
    },

    /* Toggle */
    toggleGroup: {
        display: "flex",
        gap: 14,
        marginBottom: 32,
    },
    toggleBtn: {
        flex: 1,
        height: 52,
        borderRadius: 26,
        border: "1.5px solid #ddd",
        fontSize: 15,
        fontWeight: 700,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        background: "#fff",
        color: "#555",
        transition: "all 0.2s",
    },
    toggleActive: {
        background: "#e03030",
        borderColor: "#e03030",
        color: "#fff",
        boxShadow: "0 4px 16px rgba(192,57,43,0.30)",
    },
    checkCircle: {
        width: 20,
        height: 20,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.25)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 11,
    },

    /* Submit */
    submitBtn: {
        width: "100%",
        height: 56,
        background: "linear-gradient(90deg, #e03030 0%, #e74c3c 100%)",
        color: "#fff",
        border: "none",
        borderRadius: 16,
        fontSize: 16,
        fontWeight: 700,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 6px 20px rgba(192,57,43,0.35)",
        letterSpacing: 0.3,
    },
    submitArrow: {
        width: 24,
        height: 24,
        borderRadius: "50%",
        border: "2px solid rgba(255,255,255,0.55)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        marginLeft: 6,
    },
};