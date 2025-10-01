import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getInvoiceByOrder } from "../Service/APIservice";
import { useCart } from "../ContextAPI/CartContext";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import JsBarcode from "jsbarcode";

// ✅ Invoice Component
const InvoiceDucoTailwind = ({ data }) => {
  const barcodeRef = useRef(null);

  useEffect(() => {
    if (barcodeRef.current && data?.invoice?.number) {
      JsBarcode(barcodeRef.current, data.invoice.number, {
        format: "CODE128",
        width: 2,
        height: 40,
        displayValue: true,
      });
    }
  }, [data?.invoice?.number]);

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        color: "#000",
        backgroundColor: "#fff",
        padding: "20px",
        width: "800px",
        margin: "0 auto",
        border: "1px solid #ccc",
      }}
    >
      <h1 style={{ textAlign: "center", fontSize: "22px", fontWeight: "bold" }}>
        Tax Invoice
      </h1>

      <div style={{ textAlign: "center", marginBottom: "10px" }}>
        <h2 style={{ fontSize: "18px", marginBottom: "4px" }}>
          {data.company.name}
        </h2>
        <p>{data.company.address}</p>
        <p>GSTIN: {data.company.gstin}</p>
        <p>Email: {data.company.email}</p>
      </div>

      {/* ✅ Barcode */}
      <svg ref={barcodeRef}></svg>

      <hr style={{ margin: "15px 0" }} />

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <p>
            Invoice No: <b>{data.invoice.number}</b>
          </p>
          <p>Date: {data.invoice.date}</p>
          <p>Place of Supply: {data.invoice.placeOfSupply}</p>
        </div>
        <div>
          <p>Copy Type: {data.invoice.copyType}</p>
        </div>
      </div>

      <hr style={{ margin: "15px 0" }} />

      <div>
        <h3>Bill To:</h3>
        <p>{data.billTo.name}</p>
        <p>{data.billTo.address}</p>
        <p>{data.billTo.phone}</p>
      </div>

      <hr style={{ margin: "15px 0" }} />

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr
            style={{
              borderBottom: "2px solid #000",
              background: "#f2f2f2",
            }}
          >
            <th style={{ textAlign: "left", padding: "6px" }}>S.No</th>
            <th style={{ textAlign: "left", padding: "6px" }}>Description</th>
            <th style={{ textAlign: "left", padding: "6px" }}>Qty</th>
            <th style={{ textAlign: "left", padding: "6px" }}>Unit</th>
            <th style={{ textAlign: "left", padding: "6px" }}>Price</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((it) => (
            <tr key={it.sno} style={{ borderBottom: "1px solid #ddd" }}>
              <td style={{ padding: "6px" }}>{it.sno}</td>
              <td style={{ padding: "6px" }}>{it.description}</td>
              <td style={{ padding: "6px" }}>{it.qty}</td>
              <td style={{ padding: "6px" }}>{it.unit}</td>
              <td style={{ padding: "6px" }}>₹{it.price}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: "10px" }}>
        <p>P&F Charges: ₹{data.charges.pf}</p>
        <p>Printing Charges: ₹{data.charges.printing}</p>
        <p>
          CGST {data.tax.cgstRate}% = ₹{data.tax.cgstAmount} <br />
          SGST {data.tax.sgstRate}% = ₹{data.tax.sgstAmount}
        </p>
      </div>

      <h2 style={{ textAlign: "right", marginTop: "10px" }}>
        Total: ₹{data.total}
      </h2>

      <hr style={{ margin: "15px 0" }} />

      <ul>
        {data.terms.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>

      <p style={{ marginTop: "30px", fontWeight: "bold", textAlign: "right" }}>
        For {data.forCompany}
      </p>
    </div>
  );
};

export default function OrderSuccess() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [invoiceData, setInvoiceData] = useState(null);
  const { clearCart } = useCart();
  const invoiceRef = useRef();

  useEffect(() => {
    async function fetchInvoice() {
      try {
        const res = await getInvoiceByOrder(orderId);
        if (res?.invoice) {
          // ✅ Format invoice properly
          const subtotal = res.invoice.subtotal || 0;
          const pf = res.invoice.charges?.pf || 0;
          const printing = res.invoice.charges?.printing || 0;
          const gstRate = res.invoice.gst || 0;
          const gstTotal = (subtotal * gstRate) / 100;

          const formattedInvoice = {
            ...res.invoice,
            items: res.invoice.items.map((item, idx) => {
              const sizes = Object.entries(item.quantity || {})
                .filter(([_, qty]) => qty > 0)
                .map(([size, qty]) => `${size} × ${qty}`)
                .join(", ");
              return {
                sno: idx + 1,
                description: `${item.name || "Product"}${
                  sizes ? ` (Sizes: ${sizes})` : ""
                }${item.color ? `, Color: ${item.color}` : ""}`,
                qty: Object.values(item.quantity || {}).reduce(
                  (a, b) => a + Number(b || 0),
                  0
                ),
                unit: "Pcs.",
                price: item.price,
              };
            }),
            tax: {
              cgstRate: gstRate / 2,
              sgstRate: gstRate / 2,
              cgstAmount: gstTotal / 2,
              sgstAmount: gstTotal / 2,
              gstTotal,
            },
            subtotal,
            total: subtotal + pf + printing + gstTotal,
          };
          setInvoiceData(formattedInvoice);
          clearCart();
        }
      } catch (err) {
        console.error("Error fetching invoice:", err);
        navigate("/");
      }
    }
    fetchInvoice();
  }, [orderId, clearCart, navigate]);

  const downloadPDF = async () => {
    const input = invoiceRef.current;
    if (!input) return;

    const canvas = await html2canvas(input, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
    const imgWidth = canvas.width * ratio;
    const imgHeight = canvas.height * ratio;
    const marginX = (pageWidth - imgWidth) / 2;

    pdf.addImage(imgData, "PNG", marginX, 10, imgWidth, imgHeight);
    pdf.save(`Invoice_${orderId}.pdf`);
  };

  if (!invoiceData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Loading your order…</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="mx-auto max-w-4xl text-center mb-10">
        <h1 className="text-2xl font-bold text-green-600">
          ✅ Thank you for buying from DucoArt.com!
        </h1>
        <p className="mt-2 text-gray-700">
          Your order <span className="font-semibold">#{orderId}</span> has been
          placed successfully. A confirmation email & invoice have been sent to
          your registered email address.
        </p>
        <button
          onClick={downloadPDF}
          className="mt-4 px-6 py-2 rounded-lg bg-black text-white hover:opacity-90 cursor-pointer"
        >
          Download Invoice (PDF)
        </button>
      </div>

      {/* Invoice section */}
      <div ref={invoiceRef} className="bg-white shadow rounded-lg p-4">
        <InvoiceDucoTailwind data={invoiceData} />
      </div>
    </div>
  );
}
