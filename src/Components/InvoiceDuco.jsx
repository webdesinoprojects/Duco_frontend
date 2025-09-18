// InvoiceDucoTailwind.jsx — React + TailwindCSS invoice (A4), fully dynamic
// Usage:
//   import InvoiceDucoTailwind, { DEMO_INVOICE } from "./InvoiceDucoTailwind";
//   <InvoiceDucoTailwind data={DEMO_INVOICE} editable />

import React, { useMemo, useEffect, useState } from "react";

// ---------- helpers ----------
const r2 = (n) => Math.round((Number(n || 0) + Number.EPSILON) * 100) / 100;
const fmtINR = (n) => {
  const parts = Number(n || 0).toFixed(2).split(".");
  let x = parts[0];
  const last3 = x.slice(-3);
  const other = x.slice(0, -3);
  const withCommas =
    (other ? other.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," : "") + last3;
  return `${withCommas}.${parts[1]}`;
};
const toWordsIndian = (amount) => {
  const a = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  let num = Math.floor(Math.max(0, Number(amount || 0)));
  if (num === 0) return "Zero";
  const two = (n) => (n < 20 ? a[n] : b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : ""));
  const three = (n) =>
    n >= 100 ? a[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + two(n % 100) : "") : two(n);
  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const hundred = num;
  let str = "";
  if (crore) str += three(crore) + " Crore ";
  if (lakh) str += three(lakh) + " Lakh ";
  if (thousand) str += three(thousand) + " Thousand ";
  if (hundred) str += three(hundred);
  return str.trim();
};

export default function InvoiceDucoTailwind({ data, editable = false }) {
  console.log("[InvoiceDucoTailwind] render start", { editable, data });
  useEffect(() => {
    console.log("[InvoiceDucoTailwind] mounted");
    return () => console.log("[InvoiceDucoTailwind] unmounted");
  }, []);
  useEffect(() => {
    console.log("[InvoiceDucoTailwind] props changed", { editable, data });
  }, [editable, data]);

  // ✅ Safe base: if DEMO_INVOICE isn't imported, we still work
  const base = typeof DEMO_INVOICE === "object" ? DEMO_INVOICE : {}; // eslint-disable-line no-undef
  const d = useMemo(() => ({ ...base, ...(data || {}) }), [base, data]);

  // local state for charges in edit mode
  const [pf, setPf] = useState(Number(d.charges?.pf || 0));
  const [printing, setPrinting] = useState(Number(d.charges?.printing || 0));
  const charges = editable
    ? { pf, printing }
    : { pf: Number(d.charges?.pf || 0), printing: Number(d.charges?.printing || 0) };
  useEffect(() => {
    console.log("[InvoiceDucoTailwind] charges updated", { pf, printing });
  }, [pf, printing]);

  const calc = useMemo(() => {
    const items = (d.items || []).map((it, i) => ({
      sno: it.sno ?? i + 1,
      description: it.description || "",
      barcode: it.barcode || "",
      hsn: it.hsn || "",
      qty: Number(it.qty || 0),
      unit: it.unit || "Pcs.",
      price: Number(it.price || 0),
    }));
    const sub = r2(items.reduce((s, it) => s + it.qty * it.price, 0));
    const pf = r2(Number(charges.pf || 0));
    const printing = r2(Number(charges.printing || 0));
    const taxable = r2(sub + pf + printing);
    const cgstRate = Number(d.tax?.cgstRate || 0);
    const sgstRate = Number(d.tax?.sgstRate || 0);
    const cgst = r2((taxable * cgstRate) / 100);
    const sgst = r2((taxable * sgstRate) / 100);
    const grand = r2(taxable + cgst + sgst);
    const totalQty = r2(items.reduce((s, it) => s + Number(it.qty || 0), 0));
    console.table(
      items.map((it) => ({
        sno: it.sno,
        qty: it.qty,
        price: it.price,
        amount: r2(it.qty * it.price),
      }))
    );
    console.log("[InvoiceDucoTailwind] totals", {
      sub,
      pf,
      printing,
      taxable,
      cgstRate,
      sgstRate,
      cgst,
      sgst,
      grand,
      totalQty,
    });
    return { items, sub, pf, printing, taxable, cgstRate, sgstRate, cgst, sgst, grand, totalQty };
  }, [d, charges]);

  return (
    <div className="w-full min-h-screen bg-neutral-100 text-black print:bg-white">
      {/* ✅ Print sizing (A4) */}
      <style>{`@page{ size:A4; margin:10mm }`}</style>

      {/* Always-visible toolbar (hidden on print) */}
      <div className="w-[210mm] mx-auto mt-12 mb-4 flex justify-end gap-2 print:hidden">
        <button
          onClick={() => {
            console.log("[InvoiceDucoTailwind] Download PDF clicked (toolbar)");
            window.print();
          }}
          className="px-3 py-1.5 rounded-lg border border-neutral-900 bg-neutral-900 text-white text-sm"
        >
          Download PDF
        </button>
      </div>

      {/* Optional inline editor (P&F / Printing) */}
      {editable && (
        <div className="w-[210mm] mx-auto mb-4 bg-white border border-neutral-200 rounded-lg p-3 print:hidden">
          <div className="flex items-center justify-between">
            <strong className="text-sm">Quick Edit</strong>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                <span className="w-[110px] text-neutral-700">P&F Charges</span>
                <input
                  type="number"
                  step="0.01"
                  value={pf}
                  onChange={(e) => {
                    const v = Number(e.target.value || 0);
                    console.log("[InvoiceDucoTailwind] P&F change ->", v);
                    setPf(v);
                  }}
                  className="px-2 py-1 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <span className="w-[110px] text-neutral-700">Printing Charge</span>
                <input
                  type="number"
                  step="0.01"
                  value={printing}
                  onChange={(e) => {
                    const v = Number(e.target.value || 0);
                    console.log("[InvoiceDucoTailwind] Printing change ->", v);
                    setPrinting(v);
                  }}
                  className="px-2 py-1 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* A4 page */}
      <div className="w-[210mm] min-h-[297mm] mx-auto my-12 bg-white border border-neutral-300 shadow print:shadow-none print:my-0 print:border-0 p-[10mm] pt-[10mm] pr-[12mm] pb-[12mm] pl-[12mm]">
        {/* Topline */}
        <div className="grid grid-cols-[1fr_auto] items-center gap-3 text-[12px]">
          <div>
            GSTIN : <strong>{d.company?.gstin}</strong>
          </div>
          <div className="border border-neutral-900 px-2 py-0.5 font-semibold text-[12px]">
            {d.invoice?.copyType || "Original Copy"}
          </div>
        </div>
        <div className="h-px bg-neutral-300 my-1" />

        {/* Company block */}
        <div className="mt-1 grid gap-0.5 text-[12px]">
          <div className="text-[18px] font-extrabold tracking-wide">{d.company?.name}</div>
          <div className="whitespace-pre-line">{d.company?.address}</div>
          <div>
            CIN : <span>{d.company?.cin}</span>
            <span className="mx-2" /> email : <span>{d.company?.email}</span>
          </div>
          <div>
            PAN : <span>{d.company?.pan}</span>
            <span className="mx-2" /> IEC : <span>{d.company?.iec}</span>
          </div>
         
        </div>

        {/* Invoice meta */}
        <div className="grid grid-cols-2 gap-10 mt-2 text-[12px]">
          <table className="w-full">
            <tbody>
              <tr>
                <td className="text-neutral-500 w-[42%]">Invoice No.</td>
                <td>{d.invoice?.number}</td>
              </tr>
              <tr>
                <td className="text-neutral-500">Dated</td>
                <td>{d.invoice?.date}</td>
              </tr>
            </tbody>
          </table>
          <table className="w-full">
            <tbody>
              <tr>
                <td className="text-neutral-500 w-[42%]">Place of Supply</td>
                <td>{d.invoice?.placeOfSupply}</td>
              </tr>
              <tr>
                <td className="text-neutral-500">Reverse Charge</td>
                <td>{d.invoice?.reverseCharge ? "Y" : "N"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Parties */}
        <div className="grid grid-cols-2 gap-8 mt-2 text-[12px]">
          <div className="border border-neutral-300 rounded p-6">
            <h3 className="m-0 mb-1 text-[12px] uppercase tracking-wide">Billed to :</h3>
            <div className="whitespace-pre-line font-medium">{d.billTo?.name}</div>
            {d.billTo?.address && <div className="whitespace-pre-line">{d.billTo.address}</div>}
            <div className="mt-1">
              GSTIN / UIN : <span>{d.billTo?.gstin}</span>
            </div>
            {d.billTo?.pan && (
              <div className="mt-0.5">
                PAN : <span>{d.billTo.pan}</span>
              </div>
            )}
            {d.billTo?.iec && (
              <div className="mt-0.5">
                IEC : <span>{d.billTo.iec}</span>
              </div>
            )}
          </div>
        </div>

        {/* Items table */}
        <table className="w-full border-collapse mt-2 text-[12px]">
          <thead>
            <tr>
              <th className="border border-neutral-300 bg-neutral-50 p-1 text-center w-[22mm]">S.N.</th>
              <th className="border border-neutral-300 bg-neutral-50 p-1 text-left">
                Description of Goods
              </th>
              <th className="border border-neutral-300 bg-neutral-50 p-1 text-center w-[30mm]">
                BARCODE NO.
              </th>
              <th className="border border-neutral-300 bg-neutral-50 p-1 text-center w-[22mm]">
                HSN
              </th>
              <th className="border border-neutral-300 bg-neutral-50 p-1 text-center w-[22mm]">
                Qty.
              </th>
              <th className="border border-neutral-300 bg-neutral-50 p-1 text-center w-[22mm]">
                Unit
              </th>
              <th className="border border-neutral-300 bg-neutral-50 p-1 text-right w-[28mm]">
                Price
              </th>
              <th className="border border-neutral-300 bg-neutral-50 p-1 text-right w-[30mm]">
                Amount (₹)
              </th>
            </tr>
          </thead>
          <tbody>
            {calc.items.map((it) => (
              <tr key={it.sno}>
                <td className="border border-neutral-300 p-1 text-center">{it.sno}</td>
                <td className="border border-neutral-300 p-1">{it.description}</td>
                <td className="border border-neutral-300 p-1 text-center">{it.barcode}</td>
                <td className="border border-neutral-300 p-1 text-center">{it.hsn}</td>
                <td className="border border-neutral-300 p-1 text-center">
                  {Number.isInteger(it.qty) ? it.qty : it.qty.toFixed(2)}
                </td>
                <td className="border border-neutral-300 p-1 text-center">{it.unit}</td>
                <td className="border border-neutral-300 p-1 text-right">{fmtINR(it.price)}</td>
                <td className="border border-neutral-300 p-1 text-right">
                  {fmtINR(it.qty * it.price)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="grid grid-cols-[1fr_70mm] gap-10 mt-2">
          <div />
          <table className="w-full border-collapse text-[12px]">
            <tbody>
              <tr>
                <td className="border border-neutral-300 p-1 text-neutral-500 w-[55%]">Sub Total</td>
                <td className="border border-neutral-300 p-1 text-right">{fmtINR(calc.sub)}</td>
              </tr>
              <tr>
                <td className="border border-neutral-300 p-1 text-neutral-500">P&F Charges</td>
                <td className="border border-neutral-300 p-1 text-right">{fmtINR(calc.pf)}</td>
              </tr>
              <tr>
                <td className="border border-neutral-300 p-1 text-neutral-500">Printing Charge</td>
                <td className="border border-neutral-300 p-1 text-right">
                  {fmtINR(calc.printing)}
                </td>
              </tr>
              <tr>
                <td className="border border-neutral-300 p-1 text-neutral-500">
                  Add : SGST @ {calc.sgstRate.toFixed(2)} %
                </td>
                <td className="border border-neutral-300 p-1 text-right">{fmtINR(calc.sgst)}</td>
              </tr>
              <tr>
                <td className="border border-neutral-300 p-1 text-neutral-500">
                  Add : CGST @ {calc.cgstRate.toFixed(2)} %
                </td>
                <td className="border border-neutral-300 p-1 text-right">{fmtINR(calc.cgst)}</td>
              </tr>
              <tr className="font-extrabold">
                <td className="border border-neutral-300 p-1">
                  Grand Total <small className="text-neutral-500">({fmtINR(calc.totalQty)} Pcs.)</small>
                </td>
                <td className="border border-neutral-300 p-1 text-right">{fmtINR(calc.grand)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Tax summary */}
        <table className="ml-auto mt-2 w-[80mm] border-collapse text-[12px]">
          <thead>
            <tr>
              <th className="border border-neutral-300 bg-neutral-50 p-1 text-center">Tax Rate</th>
              <th className="border border-neutral-300 bg-neutral-50 p-1 text-right">Taxable Amt.</th>
              <th className="border border-neutral-300 bg-neutral-50 p-1 text-right">CGST Amt.</th>
              <th className="border border-neutral-300 bg-neutral-50 p-1 text-right">SGST Amt.</th>
              <th className="border border-neutral-300 bg-neutral-50 p-1 text-right">Total Tax</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-neutral-300 p-1 text-center">
                {(calc.cgstRate + calc.sgstRate).toFixed(0)}%
              </td>
              <td className="border border-neutral-300 p-1 text-right">{fmtINR(calc.taxable)}</td>
              <td className="border border-neutral-300 p-1 text-right">{fmtINR(calc.cgst)}</td>
              <td className="border border-neutral-300 p-1 text-right">{fmtINR(calc.sgst)}</td>
              <td className="border border-neutral-300 p-1 text-right">
                {fmtINR(calc.cgst + calc.sgst)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Amount in words */}
        <div className="mt-2 text-[12px] font-semibold">Rupees {toWordsIndian(calc.grand)} Only</div>

        {/* Footer */}
        <div className="grid grid-cols-2 gap-10 mt-3 text-[11px]">
          <div className="border border-neutral-300 rounded p-6">
            <h4 className="m-0 mb-1 text-[12px] font-semibold">Terms & Conditions</h4>
            <ol className="list-decimal ml-4 m-0 p-0">
              {(d.terms || []).map((t, i) => (
                <li key={i} className="mb-0.5">
                  {t}
                </li>
              ))}
            </ol>
          </div>
          <div className="border border-neutral-300 rounded p-6 grid grid-rows-[auto_1fr_auto]">
            <div className="text-right">Receiver's Signature :</div>
            <div
              className="border-b border-dashed border-neutral-300 my-2"
              style={{ height: "28mm" }}
            />
            <div className="text-right font-semibold">
              For {d.forCompany}
              <br />
              Authorised Signatory
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// // ---------- demo data & field template ----------
// export const DEMO_INVOICE = { // ✅ now exported
//   company: {
//     name: "DUCO ART PRIVATE LIMITED",
//     address: "SADIJA COMPOUND AVANTI VIHAR LIG 64\nNEAR BANK OF BARODA, RAIPUR C.G",
//     gstin: "22AAICD1719N1ZM",
//     cin: "U52601CT2020PTC010997",
//     email: "ducoart1@gmail.com",
//     pan: "ABCDE1234F",
//     iec: "1234567890",
//     gst: "dkcndjskcn",
//   },
//   invoice: {
//     number: "209",
//     date: "26-08-2025",
//     placeOfSupply: "Chhattisgarh (22)",
//     reverseCharge: false,
//     copyType: "Original Copy",
//   },
//   billTo: {
//     name: "R D TRACTORS KARAGAD\nKARAGAD",
//     address: "",
//     gstin: "22BAJPG6536R2Z8",
//   },
//   items: [{ description: "CANOPI 4X4X7", barcode: "000015", hsn: "7307", qty: 1, unit: "Pcs.", price: 4800 }],
//   charges: { pf: 0, printing: 0 },
//   tax: { cgstRate: 9, sgstRate: 9 },
//   terms: [
//     "Goods once sold will not be taken back.",
//     "Interest @ 18% p.a. will be charged if the payment is not made within the stipulated time.",
//     "Subject to 'Chhattisgarh' Jurisdiction only.",
//   ],
//   forCompany: "DUCO ART PRIVATE LIMITED",
// };

// export const INVOICE_FIELDS_TEMPLATE = {
//   company: { name: "", address: "", gstin: "", cin: "", email: "", pan: "", iec: "", gst: "" },
//   invoice: { number: "", date: "", placeOfSupply: "", reverseCharge: false, copyType: "Original Copy" },
//   billTo: { name: "", address: "", gstin: "" },
//   items: [{ description: "", barcode: "", hsn: "", qty: 0, unit: "Pcs.", price: 0 }],
//   charges: { pf: 0, printing: 0 },
//   tax: { cgstRate: 0, sgstRate: 0 },
//   terms: [""],
//   forCompany: "",
// };
