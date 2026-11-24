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
  const [bannerBtnLink, setBannerBtnLink] = useState("/products/");
  const [bannerImgUrl, setBannerImgUrl] = useState("");
  const [bannerMobileImgUrl, setBannerMobileImgUrl] = useState("");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [mobileFile, setMobileFile] = useState<File | null>(null);

  const identityDirty = !!settings && (siteName !== (settings.site_name || "Malaika Nest") || siteDesc !== (settings.site_description || "") || logoUrl !== (settings.logo_url || "") || phone !== (settings.contact_phone || "") || email !== (settings.contact_email || "") || address !== (settings.address || "") || !!logoFile);
  const bannerDirty = !loading && (bannerTitle !== (activeBanner?.title || "") || bannerSubtitle !== (activeBanner?.subtitle || "") || bannerBtnText !== (activeBanner?.button_text || "") || bannerBtnLink !== (activeBanner?.button_link || "/products/") || bannerImgUrl !== (activeBanner?.image_url || "") || bannerMobileImgUrl !== (activeBanner?.mobile_image_url || "") || !!bannerFile || !!mobileFile);
  useUnsavedChanges(identityDirty || bannerDirty, busy);
  const logoPreview = useObjectUrl(logoFile);
  const bannerPreview = useObjectUrl(bannerFile);
  const mobilePreview = useObjectUrl(mobileFile);

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

      const active = b.filter(item => item.is_active).sort((a, b) => a.position - b.position || a.id.localeCompare(b.id))[0] ?? null;
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

  function choosePhoto(event: React.ChangeEvent<HTMLInputElement>, select: (file: File | null) => void) {
    const input = event.currentTarget;
    const file = input.files?.[0] ?? null;
    const problem = file && validatePhotos([file]);
    if (problem) {
      input.value = "";
      setError(problem);
      return;
    }
    select(file);
    setError("");
  }

  async function handleSaveBanner(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !settings) return;
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const fields = {
        title: bannerTitle,
        subtitle: bannerSubtitle,
        button_text: bannerBtnText,
        button_link: bannerBtnLink || "/products/",
        image_url: bannerFile ? "" : bannerImgUrl,
        mobile_image_url: mobileFile ? "" : bannerMobileImgUrl,
      };
      const id = activeBanner?.id ?? null;
      const saved = bannerFile || mobileFile
        ? await api.saveBannerMultipart(id, { ...fields, is_active: "true" }, bannerFile ?? undefined, mobileFile ?? undefined)
        : await api.saveBanner(id, { ...fields, is_active: true });
      setActiveBanner(saved);
      setBannerBtnLink(saved.button_link || "/products/");
      setBannerImgUrl(saved.image_url || "");
      setBannerMobileImgUrl(saved.mobile_image_url || "");
      setBannerFile(null);
      setMobileFile(null);
      setMessage("Homepage updated successfully.");
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
  const currentMobileImg = mobileFile
    ? mobilePreview
    : bannerMobileImgUrl || activeBanner?.mobile_image_full_url || activeBanner?.mobile_image || currentBannerImg;

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

      <div className="settings-stack">
        <section className="panel" aria-labelledby="homepage-title">
          <h3 id="homepage-title">Homepage photos and text</h3>
          <form className="product-fields" onSubmit={handleSaveBanner}>
            <fieldset className="product-fields" disabled={busy}>
              <div className="form-grid">
                <div>
                  {currentBannerImg && <img className="settings-preview" src={currentBannerImg} alt="Main homepage photo preview" />}
                  <label className="field">
                    <span>Main homepage photo</span>
                    <input key={activeBanner?.image_full_url ?? "main"} type="file" accept="image/jpeg,image/png,image/webp"
                      onChange={event => choosePhoto(event, setBannerFile)} />
                  </label>
                </div>
                <div>
                  {currentMobileImg && <img className="settings-preview mobile" src={currentMobileImg} alt="Phone homepage photo preview" />}
                  <label className="field">
                    <span>Phone photo (optional)</span>
                    <input key={activeBanner?.mobile_image_full_url ?? "mobile"} type="file" accept="image/jpeg,image/png,image/webp"
                      onChange={event => choosePhoto(event, setMobileFile)} />
                  </label>
                  <p className="variants-hint">If you leave this empty, the main photo is used on phones.</p>
                </div>
              </div>
              <label className="field">
                <span>Hero Headline</span>
                <input type="text" value={bannerTitle} onChange={event => setBannerTitle(event.target.value)} />
              </label>
              <label className="field">
                <span>Text under the headline</span>
                <textarea rows={3} value={bannerSubtitle} onChange={event => setBannerSubtitle(event.target.value)} />
              </label>
              <details className="editor-details">
                <summary>Photo links and shop button</summary>
                <div className="form-grid">
                  <label className="field"><span>Main photo web link</span><input type="url" value={bannerImgUrl} onChange={event => { setBannerFile(null); setBannerImgUrl(event.target.value); }} /></label>
                  <label className="field"><span>Phone photo web link</span><input type="url" value={bannerMobileImgUrl} onChange={event => { setMobileFile(null); setBannerMobileImgUrl(event.target.value); }} /></label>
                  <label className="field"><span>Button text</span><input type="text" value={bannerBtnText} onChange={event => setBannerBtnText(event.target.value)} /></label>
                  <label className="field"><span>Button link</span><input type="text" value={bannerBtnLink} onChange={event => setBannerBtnLink(event.target.value)} /></label>
                </div>
              </details>
              <button type="submit" className="btn">{busy ? "Saving…" : "Save homepage"}</button>
            </fieldset>
          </form>
        </section>
      <div className="card" style={{ padding: "1.25rem" }}>
        <h3 style={{ marginTop: 0, color: "var(--navy)", fontSize: "1.2rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem" }}>
          Store details and logo
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

      </div>
    </div>
  );
}
