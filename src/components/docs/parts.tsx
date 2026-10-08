import QRCode from "qrcode";
import { LogoLockup, LogoMark } from "../Logo";
import type { BranchInfo, Patient, Settings } from "@/lib/data";
import { prettyPhone } from "@/lib/format";

export const NAVY = "#123a6b";

const ico = { width: 15, height: 15, fill: NAVY, flex: "none" } as const;
export const PinIcon = ({ color = NAVY, size = 15 }: { color?: string; size?: number }) => (
  <svg viewBox="0 0 24 24" style={{ ...ico, width: size, height: size, fill: color }}>
    <path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
  </svg>
);
export const PhoneIcon = ({ color = NAVY, size = 15 }: { color?: string; size?: number }) => (
  <svg viewBox="0 0 24 24" style={{ ...ico, width: size, height: size, fill: color }}>
    <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z" />
  </svg>
);
export const MailIcon = () => (
  <svg viewBox="0 0 24 24" style={ico}>
    <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5z" />
  </svg>
);
export const GlobeIcon = ({ color = NAVY, size = 15 }: { color?: string; size?: number }) => (
  <svg viewBox="0 0 24 24" style={{ ...ico, width: size, height: size, fill: color }}>
    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.9 6h-3a15.7 15.7 0 0 0-1.4-3.6A8 8 0 0 1 18.9 8zM12 4c.8 1.2 1.5 2.5 1.9 4h-3.8c.4-1.5 1.1-2.8 1.9-4zM4.3 14a8 8 0 0 1 0-4h3.4a16.5 16.5 0 0 0 0 4zm.8 2h3a15.7 15.7 0 0 0 1.4 3.6A8 8 0 0 1 5.1 16zm3-8h-3a8 8 0 0 1 4.4-3.6C8.9 5.5 8.4 6.7 8.1 8zM12 20c-.8-1.2-1.5-2.5-1.9-4h3.8c-.4 1.5-1.1 2.8-1.9 4zm2.3-6H9.7a14.7 14.7 0 0 1 0-4h4.6a14.7 14.7 0 0 1 0 4zm.3 5.6c.6-1.1 1.1-2.3 1.4-3.6h3a8 8 0 0 1-4.4 3.6zM16.3 14a16.5 16.5 0 0 0 0-4h3.4a8 8 0 0 1 0 4z" />
  </svg>
);
export const WhatsAppIcon = ({ size = 40 }: { size?: number }) => (
  <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
    <circle cx="16" cy="16" r="16" fill="#25D366" />
    <path
      fill="#fff"
      d="M16.1 6.4a9.5 9.5 0 0 0-8.2 14.4l.2.3-.9 3.4 3.5-.9.3.2a9.5 9.5 0 1 0 5.1-17.4zm0 17.3c-1.5 0-3-.4-4.2-1.2l-.3-.2-2.1.6.6-2-.2-.3a7.9 7.9 0 1 1 6.2 3.1zm4.3-5.9c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1l-.8.9c-.1.2-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.2-.4.2-.4.7-1.2.1-.1 0-.3 0-.4l-.7-1.7c-.2-.4-.4-.4-.5-.4h-.5a.9.9 0 0 0-.6.3c-.2.2-.8.8-.8 2s.9 2.3 1 2.5c.1.2 1.7 2.7 4.2 3.7 1.6.7 2.2.7 3 .6.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1l-.4-.2z"
    />
  </svg>
);

export async function QR({ value, size = 92 }: { value: string; size?: number }) {
  const svg = await QRCode.toString(value || " ", { type: "svg", margin: 0, errorCorrectionLevel: "M" });
  return <div style={{ width: size, height: size }} dangerouslySetInnerHTML={{ __html: svg }} />;
}

/** A4 sheet wrapper. Colours are forced to print exactly as on screen. */
export function Sheet({ children }: { children: React.ReactNode }) {
  return (
    <div className="doc-sheet">
      <style>{`
        .doc-sheet{width:210mm;min-height:297mm;margin:0 auto;background:#fff;color:#1d2b3e;display:flex;flex-direction:column;
          font-family:var(--font-geist-sans),Arial,sans-serif;box-shadow:0 10px 40px #0f172a22;-webkit-print-color-adjust:exact;print-color-adjust:exact}
        .doc-body{padding:11mm 11mm 6mm;flex:1;display:flex;flex-direction:column}
        .doc-table{width:100%;border-collapse:separate;border-spacing:0;border:1px solid #d5deea;border-radius:8px;overflow:hidden;font-size:13.5px}
        .doc-table th{background:${NAVY};color:#fff;font-weight:700;text-align:left;padding:8px 12px}
        .doc-table td{padding:7px 12px;border-top:1px solid #dfe6ef}
        .doc-table th+th,.doc-table td+td{border-left:1px solid #dfe6ef}
        .doc-h{color:${NAVY};font-weight:800;font-size:15.5px;letter-spacing:.2px;margin:18px 0 8px}
        @media print{@page{size:A4;margin:0}.doc-sheet{box-shadow:none;margin:0;height:297mm;min-height:0;overflow:hidden}}
      `}</style>
      {children}
    </div>
  );
}

export function DocHeader({ settings, branch }: { settings: Settings; branch: BranchInfo }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 20 }}>
      <LogoLockup name={settings.clinic_name} subtitle={settings.clinic_subtitle} size={82} />
      <div style={{ width: 225, fontSize: 12.5, lineHeight: 1.35 }}>
        <div style={{ color: NAVY, fontWeight: 800, fontSize: 15, marginBottom: 6 }}>{branch.name}</div>
        <div style={{ display: "flex", gap: 7, marginBottom: 5 }}>
          <PinIcon />
          <span>{branch.address}</span>
        </div>
        <div style={{ display: "flex", gap: 7, marginBottom: 5 }}>
          <PhoneIcon />
          <span>{prettyPhone(branch.phone)}</span>
        </div>
        {settings.email && (
          <div style={{ display: "flex", gap: 7 }}>
            <MailIcon />
            <span>{settings.email}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function DocTitle({
  title,
  tagline,
  meta,
}: {
  title: string;
  tagline: string;
  meta: [string, string][];
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 22 }}>
      <div>
        <div style={{ color: NAVY, fontWeight: 900, fontSize: 36, lineHeight: 1, letterSpacing: 0.3 }}>{title}</div>
        <div style={{ color: "#5d7393", fontSize: 12, letterSpacing: "0.32em", marginTop: 8 }}>{tagline}</div>
      </div>
      <table style={{ fontSize: 14, borderCollapse: "collapse" }}>
        <tbody>
          {meta.map(([k, v]) => (
            <tr key={k}>
              <td style={{ fontWeight: 700, paddingRight: 10, paddingBottom: 2 }}>{k}:</td>
              <td style={{ paddingBottom: 2 }}>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PatientBox({ patient, watermark = false }: { patient: Patient; watermark?: boolean }) {
  const ageGender = [patient.age ? `${patient.age} Years` : "", patient.gender ?? ""].filter(Boolean).join("  /  ") || "—";
  const rows: [string, string][] = [
    ["Patient Name", patient.name],
    ["Age / Gender", ageGender],
    ["Phone", patient.phone || "—"],
    ["Address", patient.address || "—"],
  ];
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        background: "#e8f0fa",
        borderRadius: 10,
        padding: "12px 20px",
        marginTop: 14,
        fontSize: 14.5,
      }}
    >
      {watermark && (
        <div style={{ position: "absolute", right: 30, top: 6, opacity: 0.08 }}>
          <LogoMark size={100} />
        </div>
      )}
      <table style={{ borderCollapse: "collapse", position: "relative" }}>
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k}>
              <td style={{ width: 138, padding: "2.5px 0", fontWeight: 600 }}>{k}:</td>
              <td style={{ padding: "2.5px 0", fontWeight: k === "Patient Name" ? 700 : 400 }}>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SignatureBlock({ settings }: { settings: Settings }) {
  return (
    <div style={{ width: 245, textAlign: "center", fontSize: 13.5 }}>
      <div style={{ height: 64, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
        {settings.signature_data_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={settings.signature_data_url} alt="" style={{ maxHeight: 64, maxWidth: 200 }} />
        )}
      </div>
      <div style={{ borderTop: "1.5px solid #3b4a5e", paddingTop: 6 }}>
        <div style={{ color: NAVY, fontWeight: 800, fontSize: 16 }}>{settings.doctor_name}</div>
        <div>{settings.doctor_qualification}</div>
        <div>
          {titleCase(settings.clinic_name)} {titleCase(settings.clinic_subtitle)}
        </div>
      </div>
    </div>
  );
}

export function DocFooter({ settings, branch }: { settings: Settings; branch: BranchInfo }) {
  const branchLabel = `${branch.code} Branch`;
  return (
    <div
      style={{
        background: NAVY,
        color: "#fff",
        padding: "11px 11mm",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        fontSize: 12,
      }}
    >
      <div style={{ display: "flex", gap: 9, alignItems: "center", maxWidth: 330 }}>
        <PinIcon color="#fff" size={20} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 13 }}>{branchLabel}</div>
          <div style={{ opacity: 0.9 }}>{branch.address}</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <PhoneIcon color="#fff" size={18} />
        {prettyPhone(branch.phone)}
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {settings.website ? (
          <>
            <GlobeIcon color="#fff" size={18} />
            {settings.website}
          </>
        ) : (
          <span style={{ opacity: 0.9 }}>{settings.hours}</span>
        )}
      </div>
    </div>
  );
}

export function titleCase(s: string) {
  return s.toLowerCase().replace(/(^|[\s(&])([a-z])/g, (_, a, b) => a + b.toUpperCase());
}
