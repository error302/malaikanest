import { useEffect, useState } from "react";
import { api, Banner, SiteSettings } from "./api";
import { useUnsavedChanges } from "./useUnsavedChanges";
import { useObjectUrl } from "./useObjectUrl";
import { validatePhotos } from "./productDraft";

export function StorefrontSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [activeBanner, setActiveBanner] = useState<Banner | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Logo form state
  const [siteName, setSiteName] = useState("");
  const [siteDesc, setSiteDesc] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  // Hero banner form state
  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerSubtitle, setBannerSubtitle] = useState("");
  const [bannerBtnText, setBannerBtnText] = useState("");
  const [bannerBtnLink, setBannerBtnLink] = useState("");
  const [bannerImgUrl, setBannerImgUrl] = useState("");
  const [bannerMobileImgUrl, setBannerMobileImgUrl] = useState("");
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  const identityDirty = !!settings && (siteName !== (settings.site_name || "Malaika Nest") || siteDesc !== (settings.site_description || "") || logoUrl !== (settings.logo_url || "") || phone !== (settings.contact_phone || "") || email !== (settings.contact_email || "") || address !== (settings.address || "") || !!logoFile);
  const bannerDirty = !loading && (bannerTitle !== (activeBanner?.title || "") || bannerSubtitle !== (activeBanner?.subtitle || "") || bannerBtnText !== (activeBanner?.button_text || "") || bannerBtnLink !== (activeBanner ? activeBanner.button_link || "/products/" : "") || bannerImgUrl !== (activeBanner?.image_url || "") || bannerMobileImgUrl !== (activeBanner?.mobile_image_url || "") || !!bannerFile);
  useUnsavedChanges(identityDirty || bannerDirty, busy);
  const logoPreview = useObjectUrl(logoFile);
  const bannerPreview = useObjectUrl(bannerFile);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [s, b] = await Promise.all([api.settings(), api.banners()]);
      setSettings(s);
      setSiteName(s.site_name || "Malaika Nest");
      setSiteDesc(s.site_description || "");
      setLogoUrl(s.logo_url || "");
      setPhone(s.contact_phone || "");
      setEmail(s.contact_email || "");
      setAddress(s.address || "");

      const active = b.find((item) => item.is_active) || b[0] || null;
      setActiveBanner(active);
      if (active) {
        setBannerTitle(active.title || "");
        setBannerSubtitle(active.subtitle || "");
        setBannerBtnText(active.button_text || "");
        setBannerBtnLink(active.button_link || "/products/");
        setBannerImgUrl(active.image_url || "");
        setBannerMobileImgUrl(active.mobile_image_url || "");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !settings) return;
    setBusy(true);
    setError("");
    setMessage("");

    try {
      if (logoFile) {
        const saved = await api.saveSettingsMultipart(
          {
            site_name: siteName,
            site_description: siteDesc,
            logo_url: logoUrl,
            contact_phone: phone,
            contact_email: email,
            address: address,
          },
          logoFile
        );
        setSettings(saved);
      } else {
        const saved = await api.saveSettings({
          site_name: siteName,
          site_description: siteDesc,
          logo_url: logoUrl,
          contact_phone: phone,
          contact_email: email,
          address: address,
        });
        setSettings(saved);
      }
      setMessage("Store branding and settings updated successfully!");
      setLogoFile(null);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update settings");
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveBanner(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !settings) return;
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const bannerPayload = {
        title: bannerTitle,
        subtitle: bannerSubtitle,
        button_text: bannerBtnText,
        button_link: bannerBtnLink || "/products/",
        image_url: bannerImgUrl,
        mobile_image_url: bannerMobileImgUrl,
        is_active: activeBanner?.is_active ?? true,
      };

      if (bannerFile) {
        const saved = await api.saveBannerMultipart(
          activeBanner?.id || null,
          {
            title: bannerTitle,
            subtitle: bannerSubtitle,
            button_text: bannerBtnText,
            button_link: bannerBtnLink || "/products/",
            image_url: bannerImgUrl,
            mobile_image_url: bannerMobileImgUrl,
            is_active: String(activeBanner?.is_active ?? true),
          },
          bannerFile
        );
        setActiveBanner(saved);
        setBannerBtnLink(saved.button_link || "");
      } else {
        const saved = await api.saveBanner(activeBanner?.id || null, bannerPayload);
        setActiveBanner(saved);
        setBannerBtnLink(saved.button_link || "");
      }

      setMessage("Front page hero banner updated successfully!");
      setBannerFile(null);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update banner");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p role="status">Loading settings…</p>;
  if (!settings) return <div className="error" role="alert">{error || "Settings are unavailable."} <button className="btn ghost" onClick={() => void load()}>Retry</button></div>;

  const currentLogo = logoFile
    ? logoPreview
    : logoUrl || settings?.logo_full_url || settings?.logo;

  const currentBannerImg = bannerFile
    ? bannerPreview
    : bannerImgUrl || activeBanner?.image_full_url || activeBanner?.image;

  return (
    <div style={{ maxWidth: "860px", paddingBottom: "4rem" }}>
      <div className="bar" style={{ marginBottom: "1.5rem" }}>
        <h2>Storefront &amp; Branding</h2>
      </div>

      {message && (
        <div
          role="status"
          style={{
            padding: "0.75rem 1rem",
            background: "#ECFDF5",
            color: "#065F46",
            border: "1px solid #A7F3D0",
            borderRadius: "8px",
            marginBottom: "1.5rem",
            fontWeight: 500,
          }}
        >
          {message}
        </div>
      )}

      {error && <div className="error" role="alert" style={{ marginBottom: "1.5rem" }}>{error}</div>}

      {/* 1. BRANDING & LOGO */}
      <div className="card" style={{ padding: "1.5rem", marginBottom: "2rem" }}>
        <h3 style={{ marginTop: 0, color: "var(--navy)", fontSize: "1.2rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem" }}>
          1. Store Identity &amp; Logo
        </h3>
        <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "1.25rem" }}>
          Update the logo displayed in the storefront navigation bar, emails, and invoices.
        </p>

        <form onSubmit={handleSaveSettings}><fieldset className="product-fields" disabled={busy}>
          <div className="branding-preview">
            {currentLogo ? (
              <img
                src={currentLogo}
                alt="Logo preview"
                style={{
                  width: "90px",
                  height: "90px",
                  objectFit: "contain",
                  borderRadius: "12px",
                  background: "var(--blue-wash)",
                  border: "1px solid var(--border)",
                  padding: "6px",
                }}
              />
            ) : (
              <div
                style={{
                  width: "90px",
                  height: "90px",
                  borderRadius: "12px",
                  background: "var(--blue-wash)",
                  border: "1px dashed #879caa",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  color: "var(--blue-dark)",
                }}
              >
                MN Logo
              </div>
            )}
            <div style={{ flex: 1 }}>
              <label className="field" style={{ marginBottom: "0.5rem" }}>
                <span>Paste Cloudinary / Web Logo URL</span>
                <input
                  type="url"
                  placeholder="https://res.cloudinary.com/..."
                  value={logoUrl}
                  onChange={(e) => {
                    setLogoUrl(e.target.value);
                    setLogoFile(null);
                  }}
                />
              </label>
              <label className="field">
                <span>Or Upload Logo File</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) { const problem = validatePhotos([f]); if (problem) { setError(problem); e.target.value = ""; return; } setLogoFile(f); setLogoUrl(""); setError(""); }
                  }}
                />
              </label>
            </div>
          </div>

          <div className="form-grid">
            <label className="field">
              <span>Store Name</span>
              <input
                type="text"
                required
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
              />
            </label>
            <label className="field">
              <span>Contact Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="field">
              <span>Phone / WhatsApp Number</span>
              <input
                type="tel"
                autoComplete="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+254 726 771 321"
              />
            </label>
            <label className="field">
              <span>Shop Address (Mombasa)</span>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Tawakal Toto Shop, Mombasa"
              />
            </label>
          </div>

          <label className="field" style={{ marginTop: "1rem" }}>
            <span>Store Tagline / Description</span>
            <input
              type="text"
              value={siteDesc}
              onChange={(e) => setSiteDesc(e.target.value)}
              placeholder="Boutique baby and children's clothing in Mombasa & across Kenya"
            />
          </label>

          <button
            type="submit"
            className="btn"
            disabled={busy}
            style={{ marginTop: "1.25rem" }}
          >
            {busy ? "Saving…" : "Save Store Identity"}
          </button>
        </fieldset></form>
      </div>

      {/* 2. HOMEPAGE HERO BANNER (FRONT PAGE WRITING) */}
      <div className="card" style={{ padding: "1.5rem" }}>
        <h3 style={{ marginTop: 0, color: "var(--navy)", fontSize: "1.2rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem" }}>
          2. Front Page Hero Copy &amp; Banner
        </h3>
        <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "1.25rem" }}>
          Control the prominent headline, writing, call-to-action button, and background image shown on the storefront homepage.
        </p>

        <form onSubmit={handleSaveBanner}><fieldset className="product-fields" disabled={busy}>
          <label className="field" style={{ marginBottom: "1rem" }}>
            <span>Hero Headline (Main Title)</span>
            <input
              type="text"
              required
              value={bannerTitle}
              onChange={(e) => setBannerTitle(e.target.value)}
              placeholder="e.g. Gentle, pure cotton clothing for your little angel"
            />
          </label>

          <label className="field" style={{ marginBottom: "1rem" }}>
            <span>Hero Subtitle (Paragraph Text)</span>
            <textarea
              rows={3}
              value={bannerSubtitle}
              onChange={(e) => setBannerSubtitle(e.target.value)}
              placeholder="e.g. Hand-picked babywear, soft sleepsuits, nursery gear, and quality pre-loved mtumba in Mombasa with delivery across Kenya."
            />
          </label>

          <div className="form-grid" style={{ marginBottom: "1rem" }}>
            <label className="field">
              <span>Button Text</span>
              <input
                type="text"
                value={bannerBtnText}
                onChange={(e) => setBannerBtnText(e.target.value)}
                placeholder="e.g. Shop Collection"
              />
            </label>
            <label className="field">
              <span>Button Link</span>
              <input
                type="text"
                value={bannerBtnLink}
                onChange={(e) => setBannerBtnLink(e.target.value)}
                placeholder="/products/"
              />
            </label>
          </div>

          <div style={{ borderTop: "1px dashed var(--border)", paddingTop: "1rem", marginTop: "1rem" }}>
            <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.95rem", color: "var(--navy)" }}>
              Banner Background Image
            </h4>

            {currentBannerImg && (
              <div style={{ marginBottom: "1rem" }}>
                <img
                  src={currentBannerImg}
                  alt="Banner preview"
                  style={{
                    width: "100%",
                    maxHeight: "180px",
                    objectFit: "cover",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                  }}
                />
              </div>
            )}

            <label className="field" style={{ marginBottom: "0.75rem" }}>
              <span>Paste Cloudinary / Web Image URL</span>
              <input
                type="url"
                placeholder="https://res.cloudinary.com/..."
                value={bannerImgUrl}
                onChange={(e) => {
                  setBannerImgUrl(e.target.value);
                  setBannerFile(null);
                }}
              />
            </label>

            <label className="field" style={{ marginBottom: "0.75rem" }}>
              <span>Mobile Background Image URL (Optional)</span>
              <input
                type="url"
                placeholder="https://res.cloudinary.com/... (optional mobile version)"
                value={bannerMobileImgUrl}
                onChange={(e) => setBannerMobileImgUrl(e.target.value)}
              />
            </label>

            <label className="field">
              <span>Or Upload Banner File</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) { const problem = validatePhotos([f]); if (problem) { setError(problem); e.target.value = ""; return; } setBannerFile(f); setBannerImgUrl(""); setError(""); }
                }}
              />
            </label>
          </div>

          <button
            type="submit"
            className="btn"
            disabled={busy}
            style={{ marginTop: "1.5rem" }}
          >
            {busy ? "Saving…" : "Save Front Page Writing"}
          </button>
        </fieldset></form>
      </div>
    </div>
  );
}
