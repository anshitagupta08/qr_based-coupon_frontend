import { Gift } from "lucide-react";
import { useEffect, useState } from "react";
import axiosInstance from "../service/axiosInstance"; // local API — disabled for now

// External API base (encrypt + promotions)
const ENCRYPT_KEY_ID = "12334311";

/** Encrypts a single value via the webhook-keys/encrypt endpoint */
async function encryptValue(value) {
    const res = await axiosInstance.post(`/webhook-keys/encrypt`, {
        keyId: ENCRYPT_KEY_ID,
        webhookKey: String(value),
    });
    return res.data?.encryptedKey ?? res.data?.data ?? res.data;
}

/** Fires the SMS notification — silent fail so it never blocks the UI */
async function sendPromoSms(mobile, promoCode, discountName) {
    if (!promoCode) return;
    try {
        await fetch("https://api-abispro.abisexport.com/api/v1/sms/send", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": "e3756f9708d4062d6b75b6654a1194f433787ab5cc1bc22b8b101f0a5c4b59",
            },
            body: JSON.stringify({
                mobile: `+91${mobile}`,
                message: "ABISPRO: FREE 6 Eggs on your chicken buy on a spend of ₹299. Use code ABISPRO at your nearest Abis Pro store — walk in or call 9109993507 to order.",
            }),
        });
    } catch (err) {
        console.error("SMS send failed:", err);
    }
}


export default function NewCustomerComponent({ onSubmit, location, qrGuid = "" }) {
    const [mobile, setMobile] = useState("");
    const [mobileError, setMobileError] = useState("");
    const [name, setName] = useState("abc");
    const [triedChicken, setTriedChicken] = useState("Y");
    const [isVerified, setIsVerified] = useState(false);
    const [checking, setChecking] = useState(false);
    const [email, setEmail] = useState("customer@absc.com");
    const [submitting, setSubmitting] = useState(false);


    const checkCustomer = async (mobileNumber) => {
        try {
            setChecking(true);

            const res = await axiosInstance.get(`/customer/${mobileNumber}`);

            const data = res.data?.data;

            if (data) {
                setIsVerified(true);

                // autofill
                setName(data.name || "");
                setTriedChicken(data.triedChicken || "Y");
            }
        } catch (error) {
            setIsVerified(false);
        } finally {
            setChecking(false);
        }
    };

    useEffect(() => {
        if (mobile.length === 10) {
            setMobileError("");
            const timer = setTimeout(() => {
                checkCustomer(mobile);
            }, 500);
            return () => clearTimeout(timer);
        } else {
            setIsVerified(false);
        }
    }, [mobile]);

    const handleMobileChange = (e) => {
        const val = e.target.value.replace(/\D/g, "");
        setMobile(val);
        if (mobileError && val.length === 10) setMobileError("");
    };

    const handleSubmit = async () => {
        if (mobile.length !== 10) {
            setMobileError("Please enter a valid 10-digit mobile number.");
            return;
        }

        try {
            setSubmitting(true);

            // ── Step 1: Encrypt sensitive fields ──
            const [encMobile, encName, encEmail, encQ1] = await Promise.all([
                encryptValue(mobile),
                encryptValue(name),
                encryptValue(email),
                encryptValue(triedChicken)
            ]);

            // ── Step 2: Submit to Promotions API ──
            const promoRes = await axiosInstance.post(`/Promotions/UpsertPromotion`, {
                id: "",
                promotionDetailId: qrGuid,
                mobile: encMobile,
                customerName: encName,
                email: encEmail,
                q1Ans: encQ1,
                createdDate: new Date().toISOString(),
            });

            let rawData = promoRes.data;
            if (typeof rawData === "string") {
                try {
                    rawData = JSON.parse(`[${rawData}]`);
                } catch (e) {
                    console.error("Failed to parse promo response:", e);
                }
            }
            const responseData = Array.isArray(rawData)
                ? rawData[rawData.length - 1]
                : rawData;
            const promoCode = responseData?.PromoCode ?? responseData?.promoCode ?? "";
            const discountName = responseData?.DiscountName ?? responseData?.discountName ?? "";
            const validToDate = responseData?.ValidToDate ?? responseData?.validToDate ?? "";
            console.log("Extracted promoCode:", promoCode);

            // ── Step 3: Send SMS now that we have a confirmed promoCode ──
            await sendPromoSms(mobile, promoCode, discountName);

            // ── Step 4: Move to next screen ──
            onSubmit({ mobile, name, triedChicken, promoCode, discountName, validToDate });
        } catch (error) {
            console.error(error);
            const message =
                error?.response?.data?.message || "Failed to submit. Please try again.";
            alert(message);
        } finally {
            setSubmitting(false);
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
                    <div style={{ position: "relative", marginBottom: mobileError ? 8 : 22 }}>
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

                        <div style={{
                            ...styles.inputRow,
                            borderColor: mobileError ? "#e03030" : "#f0d0d0",
                            marginBottom: 0,
                        }}>
                            <div style={styles.countryCode}>+91</div>

                            <input
                                style={styles.phoneInput}
                                type="tel"
                                placeholder="Enter mobile number"
                                maxLength={10}
                                value={mobile}
                                onChange={handleMobileChange}
                            />
                        </div>
                    </div>

                    {mobileError && (
                        <p style={styles.errorMsg}>{mobileError}</p>
                    )}
                </div>

                {/* Submit */}
                <button
                    style={{
                        ...styles.submitBtn,
                        opacity: submitting ? 0.7 : 1,
                        cursor: submitting ? "not-allowed" : "pointer",
                    }}
                    onClick={handleSubmit}
                    disabled={submitting}
                >
                    {submitting ? "Submitting..." : "Submit Response"}&nbsp;
                    {!submitting && <span style={styles.submitArrow}>➤</span>}
                </button>
            </div>
        </div>
    );
}

/* ── Styles ── */
const styles = {
    body: {
        minHeight: "100vh",
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

    card: {
        maxWidth: 420,
        margin: "-100px 15px 40px",
        background: "#fff",
        borderRadius: 20,
        padding: 20,
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        position: "relative",
        zIndex: 2,
    },

    detailcard: {
        maxWidth: 420,
        background: "#fff",
        borderRadius: 20,
        padding: 20,
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        position: "relative",
        zIndex: 2,
        textAlign: "justify"
    },

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

    errorMsg: {
        color: "#e03030",
        fontSize: 12,
        fontWeight: 500,
        marginBottom: 16,
        marginTop: 4,
    },

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

    plainInput: {
        border: "1.5px solid #f0d0d0",
        borderRadius: 12,
        width: "100%",
        padding: "0 16px",
        height: 52,
        fontSize: 15,
        color: "#222",
        backgroundColor: "#fff",
        outline: "none",
        marginBottom: 24,
        display: "block",
        boxSizing: "border-box",
    },

    question: {
        fontSize: 15,
        fontWeight: 600,
        color: "#222",
        marginBottom: 14,
        textAlign: "justify"
    },

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