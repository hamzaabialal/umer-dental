import { lines, normPhone, prettyDate } from "@/lib/format";
import type { BranchInfo, Patient, Settings } from "@/lib/data";
import { DocFooter, DocHeader, DocTitle, NAVY, PatientBox, QR, Sheet, SignatureBlock, WhatsAppIcon } from "./parts";

export type RxData = {
  date: string;
  diagnosis: string;
  treatment_done: string;
  advice: string;
  items: { medicine: string; dose: string; instructions: string; days: string }[];
};

const Bullets = ({ items }: { items: string[] }) => (
  <ul style={{ margin: 0, paddingLeft: 32, fontSize: 14.5, lineHeight: 1.6, listStyle: "disc" }}>
    {items.map((t, i) => (
      <li key={i}>{t}</li>
    ))}
  </ul>
);

export async function RxDoc({
  rx,
  patient,
  settings,
  branch,
}: {
  rx: RxData;
  patient: Patient;
  settings: Settings;
  branch: BranchInfo;
}) {
  const treatment = lines(rx.treatment_done);
  const advice = lines(rx.advice);
  const wa = normPhone(settings.whatsapp_number);

  return (
    <Sheet>
      <div className="doc-body">
        <DocHeader settings={settings} branch={branch} />
        <DocTitle
          title="PRESCRIPTION"
          tagline={settings.tagline}
          meta={[
            ["Date", prettyDate(rx.date)],
            ["MR No.", patient.mr],
          ]}
        />
        <PatientBox patient={patient} watermark />

        {rx.diagnosis && (
          <>
            <div className="doc-h">DIAGNOSIS / CLINICAL NOTES</div>
            <div
              style={{
                background: "#eef3f9",
                borderRadius: 8,
                padding: "11px 14px",
                fontSize: 14,
                minHeight: 46,
                whiteSpace: "pre-wrap",
              }}
            >
              {rx.diagnosis}
            </div>
          </>
        )}

        {treatment.length > 0 && (
          <>
            <div className="doc-h">TREATMENT DONE TODAY</div>
            <Bullets items={treatment} />
          </>
        )}

        {rx.items.length > 0 && (
          <>
            <div className="doc-h">PRESCRIPTION</div>
            <table className="doc-table">
              <thead>
                <tr>
                  <th style={{ width: "35%" }}>Medicine</th>
                  <th style={{ width: "15%" }}>Dose</th>
                  <th>Instructions</th>
                  <th style={{ width: 80 }}>Days</th>
                </tr>
              </thead>
              <tbody>
                {rx.items.map((m, i) => (
                  <tr key={i}>
                    <td>{m.medicine}</td>
                    <td>{m.dose}</td>
                    <td>{m.instructions}</td>
                    <td>{m.days}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {advice.length > 0 && (
          <>
            <div className="doc-h">ADVICE / INSTRUCTIONS</div>
            <Bullets items={advice} />
          </>
        )}

        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 18 }}>
          {wa ? (
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <QR value={`https://wa.me/${wa}`} size={80} />
              <div style={{ color: NAVY, fontWeight: 700, fontSize: 15, lineHeight: 1.25 }}>
                Follow Us
                <br />
                on WhatsApp
              </div>
              <WhatsAppIcon size={40} />
            </div>
          ) : (
            <div />
          )}
          <SignatureBlock settings={settings} />
        </div>
      </div>
      <DocFooter settings={settings} branch={branch} />
    </Sheet>
  );
}
