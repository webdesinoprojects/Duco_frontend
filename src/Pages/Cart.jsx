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

// ✅ Safe number parser
const safeNum = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

// ✅ INR Formatter
const formatINR = (num) =>
  "₹" +
  safeNum(num, 0)
    .toFixed(2)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/* ------------------------- Helpers for printing logic ------------------------- */
// ✅ Count how many printed sides ONLY by checking for an uploaded image.
//    (No preview image, no text; no minimum enforced.)
const countDesignSides = (item) => {
  const d = item?.design || {};
  const sides = ["front", "back", "left", "right"];
  let used = 0;
  sides.forEach((s) => {
    const side = d[s] || {};
    const hasImage = !!side?.uploadedImage;
    if (hasImage) used += 1;
  });
  return used;
};

// Pick slab from a plan
const pickSlab = (plan, qty) => {
  const slabs = plan?.slabs || [];
  return (
    slabs.find((s) => qty >= s.min && qty <= s.max) ||
    slabs[slabs.length - 1] || { printingPerSide: 0, pnfPerUnit: 0, pnfFlat: 0 }
  );
};

/* =============================== INVOICE UI =============================== */
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
          <tr style={{ borderBottom: "2px solid #000", background: "#f2f2f2" }}>
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
              <td style={{ padding: "6px" }}>{formatINR(it.price)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: "10px" }}>
        <p>
          P&F Charges: {formatINR(data.charges.pf)}
          {data.charges.pfFlat > 0 ? ` (includes flat ₹${safeNum(data.charges.pfFlat).toFixed(2)})` : ""}
        </p>
        <p>Printing Charges: {formatINR(data.charges.printing)}</p>
        <p>
          CGST {data.tax.cgstRate}% = {formatINR(data.tax.cgstAmount)} <br />
          SGST {data.tax.sgstRate}% = {formatINR(data.tax.sgstAmount)}
        </p>
      </div>

      <h2 style={{ textAlign: "right", marginTop: "10px" }}>
        Subtotal: {formatINR(data.subtotal)}
      </h2>
      <h2 style={{ textAlign: "right", marginTop: "5px" }}>
        Grand Total: {formatINR(data.total)}
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

/* =============================== MAIN CART =============================== */
const Cart = () => {
  const { cart, setCart, removeFromCart, updateQuantity } =
    useContext(CartContext);
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingRates, setLoadingRates] = useState(false);
  const [address, setAddress] = useState(null);

  const navigate = useNavigate();
  const { toConvert } = usePriceContext();
  const invoiceRef = useRef();

  // Pricing knobs (persisted)
  const [pfPerUnit, setPfPerUnit] = useState(0);
  const [pfFlat, setPfFlat] = useState(0);
  const [printPerUnit, setPrintPerUnit] = useState(0);
  const [printingPerSide, setPrintingPerSide] = useState(0);
  const [gstPercent, setGstPercent] = useState(0);

  // ✅ Restore values from localStorage
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("orderSummary"));
    if (saved) {
      setPfPerUnit(safeNum(saved.pfPerUnit, 0));
      setPfFlat(safeNum(saved.pfFlat, 0));
      setPrintPerUnit(safeNum(saved.printPerUnit, 0));
      setPrintingPerSide(safeNum(saved.printingPerSide, 0));
      setGstPercent(safeNum(saved.gstPercent, 0));
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  // ✅ Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);
        const data = await getproducts();
        if (Array.isArray(data)) setProducts(data);
      } catch (e) {
        toast.error("Failed to load products. Please refresh.");
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  // ✅ Merge product info into cart
  useEffect(() => {
    if (products.length && cart.length) {
      const merged = cart.map((ci) => {
        const p = products.find((x) => x._id === ci.id);
        return p ? { ...p, ...ci } : ci; // ✅ correct order (cart overrides product fields)
      });
      setCart(merged);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products]);

  const actualData = useMemo(() => {
    if (!cart.length) return [];
    return cart.map((ci) => {
      const p = products.find((x) => x._id === ci.id);
      return p ? { ...p, ...ci } : ci;
    });
  }, [cart, products]);

  // ✅ Totals
  const totalQuantity = useMemo(
    () =>
      actualData.reduce(
        (sum, item) =>
          sum +
          Object.values(item.quantity || {}).reduce(
            (a, q) => a + safeNum(q),
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
          (a, q) => a + safeNum(q),
          0
        );
        return sum + safeNum(item.price) * qty;
      }, 0),
    [actualData]
  );

  // ✅ Compute "printing units" = quantity × sides (counting only sides with an uploaded image)
  const printingUnits = useMemo(() => {
    return actualData.reduce((acc, item) => {
      const qty =
        Object.values(item.quantity || {}).reduce((a, q) => a + safeNum(q), 0) ||
        0;
      const sides = countDesignSides(item);
      return acc + qty * sides;
    }, 0);
  }, [actualData]);

  // ✅ Fetch P&F, Printing, GST logic
  useEffect(() => {
    const fetchRates = async () => {
      try {
        setLoadingRates(true);
        const res = await getChargePlanRates(totalQuantity || 1);

        // Legacy shape with perUnit costs
        if (res?.success && res?.data) {
          const pf = safeNum(res.data?.perUnit?.pakageingandforwarding, 0);
          const print = safeNum(res.data?.perUnit?.printingcost, 0);
          const gst = safeNum(res?.data?.gstPercent, 5);
          setPfPerUnit(pf);
          setPfFlat(0);
          setPrintPerUnit(print);
          setPrintingPerSide(0);
          setGstPercent(gst);

          localStorage.setItem(
            "orderSummary",
            JSON.stringify({
              pfPerUnit: pf,
              pfFlat: 0,
              printPerUnit: print,
              printingPerSide: 0,
              gstPercent: gst,
            })
          );
          return;
        }

        // New plan shape with slabs + gstRate
        if (res && (Array.isArray(res.slabs) || res.gstRate != null)) {
          const slab = pickSlab(res, totalQuantity || 0);
          const pfUnit = safeNum(slab?.pnfPerUnit, 0);
          const pfF = safeNum(slab?.pnfFlat, 0);
          const perSide = safeNum(
            slab?.printingPerSide ?? slab?.printingPerUnit,
            0
          );
          const gst = safeNum((res.gstRate ?? 0.05) * 100, 5);

          setPfPerUnit(pfUnit);
          setPfFlat(pfF);
          setPrintingPerSide(perSide); // preferred per-side pricing
          setPrintPerUnit(0); // legacy off
          setGstPercent(gst);

          localStorage.setItem(
            "orderSummary",
            JSON.stringify({
              pfPerUnit: pfUnit,
              pfFlat: pfF,
              printPerUnit: 0,
              printingPerSide: perSide,
              gstPercent: gst,
            })
          );
          return;
        }
      } catch {
        console.warn("Could not fetch charge plan, using saved ones");
      } finally {
        setLoadingRates(false);
      }
    };

    if (subtotal > 0 && totalQuantity > 0) fetchRates();
  }, [subtotal, totalQuantity]);

  // ✅ Calculate totals
  const pfTotal = safeNum(pfPerUnit) * totalQuantity + safeNum(pfFlat);
  const printingTotalBySide = safeNum(printingPerSide) * printingUnits;
  const printingTotalByUnit = safeNum(printPerUnit) * totalQuantity;
  const printTotal =
    printingPerSide > 0 ? printingTotalBySide : printingTotalByUnit;

  const gstTotal =
    ((subtotal + pfTotal + printTotal) * safeNum(gstPercent)) / 100;
  const grandTotal = subtotal + pfTotal + printTotal + gstTotal;

  const orderPayload = {
    items: actualData,
    totalPay: grandTotal,
    address,
    user,
    pf: pfPerUnit,
    pfFlat,
    gst: gstPercent,
    printing: printPerUnit,
    printingPerSide,
    printingUnits,
    breakdown: {
      subtotal,
      pfTotal,
      printTotal,
      gstTotal,
      grandTotal,
    },
  };

  const isB2B = actualData.some((x) => x.isCorporate);
  const paymentOptions = isB2B
    ? ["Netbanking", "Pickup from Store", "Pay Online"]
    : ["Pay Online"];

  if (loadingProducts) return <Loading />;

  if (!cart.length)
    return (
      <div className="p-8 text-center text-gray-400 text-xl">
        Your cart is empty.
      </div>
    );

  const printingRateLabel =
    printingPerSide > 0
      ? `₹${safeNum(printingPerSide).toFixed(2)}/side`
      : `${safeNum(printPerUnit).toFixed(2)}/unit`;
  const pfLabel =
    pfFlat > 0
      ? `${safeNum(pfPerUnit).toFixed(2)}/unit + flat ₹${safeNum(pfFlat).toFixed(
          2
        )}`
      : `${safeNum(pfPerUnit).toFixed(2)}/unit`;

  return (
    <div className="min-h-screen text-white p-8">
      <h1 className="text-3xl font-bold mb-8">SHOPPING CART</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          {actualData.map((item, i) => (
            <CartItem
              key={`${item._id}-${i}`}
              item={item}
              removeFromCart={() =>
                removeFromCart(item.id, item.quantity, item.color, item.design)
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
          ))}
        </div>

        {/* ✅ ORDER SUMMARY */}
        <div className="lg:w-96 flex flex-col">
          <div
            className="lg:w-96 h-fit rounded-sm p-6"
            style={{ backgroundColor: "#112430" }}
          >
            <h2 className="text-2xl font-bold mb-6 text-white">ORDER SUMMARY</h2>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between">
                <span className="text-gray-300">Subtotal</span>
                <span>{formatINR(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">P&F ({pfLabel})</span>
                <span>{formatINR(pfTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">
                  Printing ({printingRateLabel}
                  {printingPerSide > 0 ? ` • ${printingUnits} sides` : ""})
                </span>
                <span>{formatINR(printTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">GST ({safeNum(gstPercent).toFixed(2)}%)</span>
                <span>{formatINR(gstTotal)}</span>
              </div>
            </div>

            <div className="flex justify-between border-t border-gray-600 pt-4 mb-6">
              <span className="font-bold">Total</span>
              <span className="font-bold">{formatINR(grandTotal)}</span>
            </div>

            <button
              className="w-full py-4 font-bold bg-yellow-400 text-black hover:bg-yellow-300 cursor-pointer"
              onClick={() => {
                if (!address) {
                  toast.error("⚠ Please select a delivery address");
                  return;
                }
                localStorage.removeItem("orderSummary");
                navigate("/payment", {
                  state: { ...orderPayload, paymentOptions, isB2B },
                });
              }}
            >
              CHECK OUT
            </button>

            <button
              onClick={() => {
                const input = invoiceRef.current;
                if (!input) return;
                html2canvas(input, { scale: 2, useCORS: true }).then((canvas) => {
                  const imgData = canvas.toDataURL("image/png");
                  const pdf = new jsPDF("p", "mm", "a4");
                  const pageWidth = pdf.internal.pageSize.getWidth();
                  const ratio = pageWidth / canvas.width;
                  pdf.addImage(
                    imgData,
                    "PNG",
                    0,
                    10,
                    pageWidth,
                    canvas.height * ratio
                  );
                  pdf.save("Invoice_Test.pdf");
                });
              }}
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

      {/* ✅ Hidden Invoice */}
      <div ref={invoiceRef} style={{ display: "block" }}>
        <InvoiceDucoTailwind
          data={{
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
            charges: { pf: pfTotal, pfFlat, printing: printTotal },
            tax: {
              cgstRate: safeNum(gstPercent / 2),
              sgstRate: safeNum(gstPercent / 2),
              cgstAmount: safeNum(gstTotal / 2),
              sgstAmount: safeNum(gstTotal / 2),
            },
            terms: [
              "Thank you for shopping with DucoArt!",
              "Goods once sold will not be taken back.",
            ],
            forCompany: "DUCO ART PRIVATE LIMITED",
            subtotal,
            total: grandTotal,
          }}
        />
      </div>
    </div>
  );
};

export default Cart;
