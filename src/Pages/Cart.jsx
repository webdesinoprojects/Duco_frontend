import React, { useState, useEffect, useContext, useMemo, useRef } from "react";
import CartItem from "../Components/CartItem.jsx";
import AddressManager from "../Components/AddressManager";
import Loading from "../Components/Loading";
import { CartContext } from "../ContextAPI/CartContext";
import { getproducts, getChargePlanRates } from "../Service/APIservice";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { usePriceContext } from "../ContextAPI/PriceContext.jsx";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import JsBarcode from "jsbarcode";

const safeNum = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

// ✅ Invoice component
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
        Subtotal: ₹{data.subtotal}
      </h2>
      <h2 style={{ textAlign: "right", marginTop: "5px" }}>
        Grand Total: ₹{data.total}
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

const Cart = () => {
  const { cart, removeFromCart, updateQuantity } = useContext(CartContext);
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingRates, setLoadingRates] = useState(false);
  const [address, setAddress] = useState(null);

  const navigate = useNavigate();
  const { toConvert } = usePriceContext();

  const invoiceRef = useRef();

  const [pfPerUnit, setPfPerUnit] = useState(0);
  const [printPerUnit, setPrintPerUnit] = useState(0);
  const [gstPercent, setGstPercent] = useState(0);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    } catch (e) {
      console.error("Invalid user in localStorage", e);
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        setLoadingProducts(true);
        const fetched = await getproducts();
        if (Array.isArray(fetched)) setProducts(fetched);
      } catch (e) {
        toast.error("Failed to load products. Please refresh.");
      } finally {
        setLoadingProducts(false);
      }
    };
    run();
  }, []);

  const actualData = useMemo(() => {
    if (!Array.isArray(cart)) return [];
    return cart.map((ci) => {
      const p = Array.isArray(products)
        ? products.find((x) => x._id === ci.id)
        : null;
      return p ? { ...p, ...ci } : ci;
    });
  }, [cart, products]);

  const totalQuantity = useMemo(
    () =>
      actualData.reduce(
        (sum, item) =>
          sum +
          Object.values(item.quantity || {}).reduce(
            (a, q) => a + safeNum(q, 0),
            0
          ),
        0
      ),
    [actualData]
  );

  const subtotal = useMemo(
    () =>
      actualData.reduce((sum, item) => {
        const qty = Object.values(item.quantity || {}).reduce(
          (a, q) => a + safeNum(q, 0),
          0
        );
        return sum + safeNum(item.price, 0) * qty;
      }, 0),
    [actualData]
  );

  useEffect(() => {
    const fetchRates = async () => {
      try {
        setLoadingRates(true);
        // ✅ Pass subtotal to backend
        const res = await getChargePlanRates(totalQuantity, subtotal);
        if (res?.success) {
          setPfPerUnit(safeNum(res.data?.perUnit?.pakageingandforwarding, 0));
          setPrintPerUnit(safeNum(res.data?.perUnit?.printingcost, 0));
          setGstPercent(safeNum(res?.data?.gstPercent, 0));
        }
      } finally {
        setLoadingRates(false);
      }
    };
    if (totalQuantity > 0) fetchRates();
  }, [totalQuantity, subtotal]);

  const pfTotal = pfPerUnit;
  const printTotal = printPerUnit;
  const gstTotal = (safeNum(subtotal, 0) * safeNum(gstPercent, 0)) / 100;
  const grandTotal = subtotal + pfTotal + printTotal + gstTotal;

  const convert = (amt) =>
    (safeNum(amt, 0) * safeNum(toConvert, 1)).toFixed(2);

  const orderPayload = useMemo(
    () => ({
      items: actualData,
      totalPay: grandTotal * safeNum(toConvert, 1),
      address,
      user,
      pf: pfPerUnit,
      gst: gstPercent,
      printing: printPerUnit,
    }),
    [actualData, grandTotal, toConvert, address, user]
  );

  // ✅ Invoice data with correct tax
  const invoiceData = {
    company: {
      name: "DUCO ART PRIVATE LIMITED",
      address: "123 Teen Murti Marg, New Delhi, India",
      gstin: "22AAICD1719N1ZM",
      email: "support@ducoart.com",
    },
    invoice: {
      number: "TEST-" + Math.floor(Math.random() * 10000),
      date: new Date().toLocaleDateString(),
      placeOfSupply: address?.state || "Delhi",
      copyType: "Original Copy",
    },
    billTo: {
      name: user?.name || "Guest User",
      address: address?.full || "Not provided",
      phone: user?.phone || "N/A",
    },
    items: actualData.map((item, idx) => {
      const sizes = Object.entries(item.quantity || {})
        .filter(([size, qty]) => qty > 0)
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
    charges: { pf: pfTotal, printing: printTotal },
    tax: {
      cgstRate: gstPercent / 2,
      sgstRate: gstPercent / 2,
      cgstAmount: gstTotal / 2,
      sgstAmount: gstTotal / 2,
    },
    terms: [
      "Thank you for shopping with DucoArt!",
      "Goods once sold will not be taken back.",
    ],
    forCompany: "DUCO ART PRIVATE LIMITED",
    subtotal: subtotal,
    total: grandTotal,
  };

  const downloadPDF = async () => {
    const input = invoiceRef.current;
    if (!input) return;

    const canvas = await html2canvas(input, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const ratio = Math.min(
      pageWidth / canvas.width,
      pageHeight / canvas.height
    );
    const imgWidth = canvas.width * ratio;
    const imgHeight = canvas.height * ratio;
    const marginX = (pageWidth - imgWidth) / 2;

    pdf.addImage(imgData, "PNG", marginX, 10, imgWidth, imgHeight);
    pdf.save("Invoice_Test.pdf");
  };

  if (loadingProducts || loadingRates) return <Loading />;

  return (
    <div className="min-h-screen text-white p-8">
      <h1 className="text-3xl font-bold mb-8">SHOPPING CART</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          {actualData.length > 0 ? (
            actualData.map((item, i) => (
              <CartItem
                key={`${item._id}-${i}`}
                item={item}
                removeFromCart={() =>
                  removeFromCart(
                    item.id,
                    item.quantity,
                    item.color,
                    item.design
                  )
                }
                updateQuantity={(newQty) =>
                  updateQuantity(
                    item.id,
                    item.quantity,
                    item.color,
                    item.design,
                    newQty
                  )
                }
              />
            ))
          ) : (
            <div className="text-gray-400 text-center mt-16 text-xl">
              Your cart is empty.
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="lg:w-96 flex flex-col">
          <div
            className="lg:w-96 h-fit rounded-sm p-6"
            style={{ backgroundColor: "#112430" }}
          >
            <h2 className="text-2xl font-bold mb-6 text-white">ORDER SUMMARY</h2>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between">
                <span className="text-gray-300">Subtotal</span>
                <span>{convert(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">P&F Charges</span>
                <span>{convert(pfTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Printing</span>
                <span>{convert(printTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">GST ({gstPercent}%)</span>
                <span>{convert(gstTotal)}</span>
              </div>
            </div>

            <div className="flex justify-between border-t border-gray-600 pt-4 mb-6">
              <span className="font-bold">Total</span>
              <span className="font-bold">{convert(grandTotal)}</span>
            </div>

            <button
              className="w-full py-4 font-bold bg-yellow-400 text-black hover:bg-yellow-300 cursor-pointer"
              onClick={() => {
                if (!address) {
                  toast.error("⚠️ Please select a delivery address");
                  return;
                }
                navigate("/payment", { state: orderPayload });
              }}
            >
              CHECK OUT
            </button>

            <button
              onClick={downloadPDF}
              disabled={!actualData.length}
              className="mt-4 w-full py-3 rounded bg-black text-white hover:opacity-90 disabled:opacity-40 cursor-pointer"
            >
              Download Sample Invoice (PDF)
            </button>
          </div>

          <AddressManager
            addresss={address}
            setAddresss={setAddress}
            user={user}
            setUser={setUser}
          />
        </div>
      </div>

      {/* Hidden invoice */}
      <div ref={invoiceRef} style={{ display: "block" }}>
        <InvoiceDucoTailwind data={invoiceData} />
      </div>
    </div>
  );
};

export default Cart;
