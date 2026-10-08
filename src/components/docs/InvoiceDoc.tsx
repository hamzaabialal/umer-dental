import { prettyDate, rs } from "@/lib/format";
import type { BranchInfo, Patient, Settings } from "@/lib/data";
import { DocFooter, DocHeader, DocTitle, NAVY, PatientBox, QR, Sheet, SignatureBlock } from "./parts";

export type InvoiceData = {
  invoice_no: string;
  date: string;
  total_charges: number;
  discount: number;
  net: number;
  paid_cash: number;
  paid_card: number;
  payment_method: string | null;
  remarks: string;
  items: { procedure: string; tooth: string; qty: number; rate: number; amount: number }[];
};

const dash = (n: number) => (n ? rs(n) : "-");

export async function InvoiceDoc({
  invoice: x,
  patient,
  settings,
  branch,
}: {
  invoice: InvoiceData;
  patient: Patient;
  settings: Settings;
  branch: BranchInfo;
}) {
  const totalPaid = x.paid_cash + x.paid_card;
  const pending = Math.max(0, x.net - totalPaid);
  const checked = (m: string) =>
    x.payment_method === m || (m === "Cash" && x.paid_cash > 0) || (m === "Card" && x.paid_card > 0 && !x.payment_method);

  const totals: { label: string; value: string; style?: React.CSSProperties }[] = [
    { label: "Total Charges", value: rs(x.total_charges) },
    { label: "Discount / Adjustment", value: rs(x.discount) },
    { label: "Net Amount", value: rs(x.net), style: { background: "#dbe7f6", fontWeight: 800, fontSize: 15 } },
    { label: "Amount Paid (Cash)", value: rs(x.paid_cash) },
    { label: "Amount Paid (Card/Online)", value: rs(x.paid_card) },
    { label: "Total Paid", value: rs(totalPaid), style: { fontWeight: 800, fontSize: 15 } },
    {
      label: "Pending Amount",
      value: rs(pending),
      style: { background: pending > 0 ? "#f9d4d8" : "#d7f2e3", fontWeight: 800, fontSize: 15, color: NAVY },
    },
  ];

  return (
    <Sheet>
      <div className="doc-body">
        <DocHeader settings={settings} branch={branch} />
        <DocTitle
          title="INVOICE / RECEIPT"
          tagline={settings.tagline}
          meta={[
            ["Invoice No.", x.invoice_no],
            ["Date", prettyDate(x.date)],
            ["MR No.", patient.mr],
          ]}
        />
        <PatientBox patient={patient} />

        <table className="doc-table" style={{ marginTop: 14 }}>
          <thead>
            <tr>
              <th style={{ width: 38, textAlign: "center" }}>#</th>
              <th>Procedure / Service</th>
              <th style={{ width: 118, textAlign: "center", whiteSpace: "nowrap" }}>Tooth / Area</th>
              <th style={{ width: 55, textAlign: "center" }}>Qty</th>
              <th style={{ width: 105, textAlign: "right" }}>Rate (Rs.)</th>
              <th style={{ width: 115, textAlign: "right" }}>Amount (Rs.)</th>
            </tr>
          </thead>
          <tbody>
            {x.items.map((it, i) => (
              <tr key={i}>
                <td style={{ textAlign: "center" }}>{i + 1}</td>
                <td>{it.procedure}</td>
                <td style={{ textAlign: "center" }}>{it.tooth || "–"}</td>
                <td style={{ textAlign: "center" }}>{it.qty}</td>
                <td style={{ textAlign: "right" }}>{dash(it.rate)}</td>
                <td style={{ textAlign: "right" }}>{dash(it.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: "flex", justifyContent: "space-between", gap: 24, marginTop: 14 }}>
          <div style={{ flex: 1, fontSize: 14 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Payment Method:</div>
            {["Cash", "Card", "Bank Transfer", "Other"].map((m) => (
              <div key={m} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 3,
                    border: `1.5px solid ${checked(m) ? NAVY : "#55657a"}`,
                    background: checked(m) ? NAVY : "#fff",
                    color: "#fff",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 13,
                    lineHeight: 1,
                  }}
                >
                  {checked(m) ? "✓" : ""}
                </span>
                {m}
              </div>
            ))}
            {x.remarks && (
              <>
                <div style={{ fontWeight: 700, marginTop: 18 }}>Remarks:</div>
                <div style={{ marginTop: 4 }}>{x.remarks}</div>
              </>
            )}
          </div>
          <table className="doc-table" style={{ width: 340, fontSize: 14 }}>
            <tbody>
              {totals.map((t, i) => (
                <tr key={t.label}>
                  <td style={{ ...t.style, borderTop: i ? undefined : "none" }}>{t.label}</td>
                  <td style={{ ...t.style, borderTop: i ? undefined : "none", textAlign: "right", width: 110 }}>
                    {t.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 18 }}>
          {branch.review_url ? (
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <QR value={branch.review_url} />
              <div>
                <div style={{ color: NAVY, fontWeight: 700, fontSize: 18, lineHeight: 1.2 }}>
                  Scan for
                  <br />
                  Google Review
                </div>
                <div style={{ color: "#f5b301", fontSize: 24, letterSpacing: 3, marginTop: 4 }}>★★★★★</div>
              </div>
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
