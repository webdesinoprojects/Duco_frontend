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

const currencySymbols = {
  INR: "₹", // Indian Rupee
  USD: "$", // US Dollar
  AED: "د.إ", // UAE Dirham
  EUR: "€", // Euro
  GBP: "£", // British Pound
  AUD: "A$", // Australian Dollar 🇦🇺
  CAD: "C$", // Canadian Dollar 🇨🇦
  SGD: "S$", // Singapore Dollar 🇸🇬
  NZD: "NZ$", // New Zealand Dollar 🇳🇿
  CHF: "CHF", // Swiss Franc 🇨🇭
  JPY: "¥", // Japanese Yen 🇯🇵
  CNY: "¥", // Chinese Yuan 🇨🇳
  HKD: "HK$", // Hong Kong Dollar 🇭🇰
  MYR: "RM", // Malaysian Ringgit 🇲🇾
  THB: "฿", // Thai Baht 🇹🇭
  SAR: "﷼", // Saudi Riyal 🇸🇦
  QAR: "ر.ق", // Qatari Riyal 🇶🇦
  KWD: "KD", // Kuwaiti Dinar 🇰🇼
  BHD: "BD", // Bahraini Dinar 🇧🇭
  OMR: "﷼", // Omani Rial 🇴🇲
  ZAR: "R", // South African Rand 🇿🇦
  PKR: "₨", // Pakistani Rupee 🇵🇰
  LKR: "Rs", // Sri Lankan Rupee 🇱🇰
  BDT: "৳", // Bangladeshi Taka 🇧🇩
  NPR: "रू", // Nepalese Rupee 🇳🇵
  PHP: "₱", // Philippine Peso 🇵🇭
  IDR: "Rp", // Indonesian Rupiah 🇮🇩
  KRW: "₩", // South Korean Won 🇰🇷
};

/* ----------------- Helpers ----------------- */
const safeNum = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

// ✅ Apply location-based pricing to a base price
const applyLocationPricing = (basePrice, priceIncrease, conversionRate) => {
  let price = safeNum(basePrice);
  
  // Step 1: Apply percentage increase (location markup)
  if (priceIncrease) {
    price += (price * safeNum(priceIncrease)) / 100;
  }
  
  // Step 2: Apply currency conversion
  if (conversionRate && conversionRate !== 1) {
    price *= conversionRate;
  }
  
  return Math.round(price);
};

// ✅ Count printed sides
const countDesignSides = (item) => {
  const d = item?.design || {};
  const sides = ["front", "back", "left", "right"];
  let used = 0;
  sides.forEach((s) => {
    const side = d[s] || {};
    if (side?.uploadedImage) used += 1;
  });
  return used;
};

// ✅ Pick slab from plan
const pickSlab = (plan, qty) => {
  const slabs = plan?.slabs || [];
  return (
    slabs.find((s) => qty >= s.min && qty <= s.max) ||
    slabs[slabs.length - 1] || { printingPerSide: 0, pnfPerUnit: 0, pnfFlat: 0 }
  );
};

/* ----------------- Invoice UI ----------------- */
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
              <td style={{ padding: "6px" }}>
                {data.formatCurrency(it.price)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ textAlign: "right", marginTop: "10px" }}>
        Subtotal: {data.formatCurrency(data.subtotal)}
      </h2>

      {data.locationTax?.percentage > 0 && (
        <h2 style={{ textAlign: "right", marginTop: "5px" }}>
          Location Adjustment ({data.locationTax.country}){" "}
          {data.locationTax.percentage}%{" "}
          {data.locationTax.currency?.country
            ? `(${data.locationTax.currency.country})`
            : ""}
        </h2>
      )}

      {/* ✅ GST Breakdown */}
      <h2 style={{ textAlign: "right", marginTop: "5px" }}>
        CGST ({(data.gstPercent / 2).toFixed(1)}%):{" "}
        {data.formatCurrency((data.subtotal * (data.gstPercent / 100)) / 2)}
      </h2>
      <h2 style={{ textAlign: "right", marginTop: "5px" }}>
        SGST ({(data.gstPercent / 2).toFixed(1)}%):{" "}
        {data.formatCurrency((data.subtotal * (data.gstPercent / 100)) / 2)}
      </h2>
      <h2 style={{ textAlign: "right", marginTop: "5px" }}>
        Total GST ({data.gstPercent}%):{" "}
        {data.formatCurrency(data.subtotal * (data.gstPercent / 100))}
      </h2>

      <h2 style={{ textAlign: "right", marginTop: "5px" }}>
        Grand Total: {data.formatCurrency(data.total)}
      </h2>
    </div>
  );
};

/* ----------------- Main Cart ----------------- */
const Cart = () => {
  const { cart, setCart, removeFromCart, updateQuantity } =
    useContext(CartContext);
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingRates, setLoadingRates] = useState(false);
  const [address, setAddress] = useState(null);

  const navigate = useNavigate();
  const invoiceRef = useRef();

  const [currencySymbol, setCurrencySymbol] = useState("₹");
  const [conversionRate, setConversionRate] = useState(1);

  // ✅ Dynamic Currency Formatter (now has access to states)
  const formatCurrency = (num) =>
    `${currencySymbol}${Math.round(safeNum(num, 0) * safeNum(conversionRate, 1))
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

  // ✅ Load user from localStorage so address API has userId
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  // ✅ PriceContext
  const { priceIncrease, currency, resolvedLocation } = usePriceContext();

  useEffect(() => {
    if (!currency) return;
    setCurrencySymbol(currencySymbols[currency] || "₹");
    const cached = JSON.parse(localStorage.getItem("locationPricing"));
    if (cached && cached.currency?.toconvert) {
      setConversionRate(Number(cached.currency.toconvert));
    } else {
      setConversionRate(1);
    }
  }, [currency]);

  /* ---------- Products ---------- */
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

  /* ---------- Merge cart ---------- */
  useEffect(() => {
    if (products.length && cart.length) {
      const merged = cart.map((ci) => {
        const p = products.find((x) => x._id === ci.id);
        return p ? { ...p, ...ci } : ci;
      });
      setCart(merged);
    }
  }, [products]);

  const actualData = useMemo(() => {
    if (!cart.length) return [];
    return cart.map((ci) => {
      const p = products.find((x) => x._id === ci.id);
      return p ? { ...p, ...ci } : ci;
    });
  }, [cart, products]);

  /* ---------- Quantity & Costs ---------- */
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

  const printingUnits = useMemo(() => {
    return actualData.reduce((acc, item) => {
      const qty =
        Object.values(item.quantity || {}).reduce(
          (a, q) => a + safeNum(q),
          0
        ) || 0;
      const sides = countDesignSides(item);
      return acc + qty * sides;
    }, 0);
  }, [actualData]);

  // ✅ Calculate printing cost based on the number of sides
  const calculatePrintingCost = (item) => {
    const sides = countDesignSides(item);
    const costPerSide = 10; // You can change this value based on your pricing
    return sides * costPerSide; // Total printing cost for the item
  };

  // ✅ Calculate custom design cost (for text or uploaded image)
  const calculateDesignCost = (item) => {
    const textCost = item?.design?.customText ? 20 : 0; // Example: ₹20 for custom text
    const imageCost = item?.design?.uploadedImage ? 30 : 0; // Example: ₹30 for uploaded image
    return textCost + imageCost; // Total design cost
  };

  const itemsSubtotal = useMemo(() => {
    return actualData.reduce((sum, item) => {
      const qty = Object.values(item.quantity || {}).reduce(
        (a, q) => a + safeNum(q),
        0
      );
      const basePrice = safeNum(item.price); // Base price from the product details
      const printingCost = calculatePrintingCost(item); // Printing cost based on the sides
      const designCost = calculateDesignCost(item); // Custom design cost (text/image)

      // ✅ Apply location pricing to the total item price (base + printing + design)
      const itemTotalBeforeLocation = basePrice + printingCost + designCost;
      const itemTotalWithLocation = applyLocationPricing(
        itemTotalBeforeLocation,
        priceIncrease,
        conversionRate
      );

      return sum + itemTotalWithLocation * qty; // Total price per item with location adjustment
    }, 0);
  }, [actualData, priceIncrease, conversionRate]);

  const [pfPerUnit, setPfPerUnit] = useState(0);
  const [pfFlat, setPfFlat] = useState(0);
  const [printPerUnit, setPrintPerUnit] = useState(0);
  const [printingPerSide, setPrintingPerSide] = useState(0);
  const [gstPercent, setGstPercent] = useState(0);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        setLoadingRates(true);
        const res = await getChargePlanRates(totalQuantity || 1);

        if (res?.success && res?.data) {
          setPfPerUnit(safeNum(res.data?.perUnit?.pakageingandforwarding, 0));
          setPrintPerUnit(safeNum(res.data?.perUnit?.printingcost, 0));
          setGstPercent(safeNum(res?.data?.gstPercent, 5));
          setPfFlat(0);
          setPrintingPerSide(0);
          return;
        }

        if (res && (Array.isArray(res.slabs) || res.gstRate != null)) {
          const slab = pickSlab(res, totalQuantity || 0);
          setPfPerUnit(safeNum(slab?.pnfPerUnit, 0));
          setPfFlat(safeNum(slab?.pnfFlat, 0));
          setPrintingPerSide(
            safeNum(slab?.printingPerSide ?? slab?.printingPerUnit, 0)
          );
          setPrintPerUnit(0);
          setGstPercent(safeNum((res.gstRate ?? 0.05) * 100, 5));
          return;
        }
      } catch {
        console.warn("Could not fetch charge plan; using defaults");
        setGstPercent(5);
      } finally {
        setLoadingRates(false);
      }
    };

    if (itemsSubtotal > 0 && totalQuantity > 0) fetchRates();
  }, [itemsSubtotal, totalQuantity]);

  const printingCost = useMemo(() => {
    const a = safeNum(printPerUnit) * safeNum(totalQuantity);
    const b = safeNum(printingPerSide) * safeNum(printingUnits);
    return a + b;
  }, [printPerUnit, printingPerSide, totalQuantity, printingUnits]);

  const pfCost = useMemo(() => {
    return safeNum(pfPerUnit) * safeNum(totalQuantity) + safeNum(pfFlat);
  }, [pfPerUnit, pfFlat, totalQuantity]);

  const taxableAmount = useMemo(() => {
    return safeNum(itemsSubtotal) + safeNum(printingCost) + safeNum(pfCost);
  }, [itemsSubtotal, printingCost, pfCost]);

  const gstTotal = useMemo(() => {
    return (safeNum(taxableAmount) * safeNum(gstPercent)) / 100;
  }, [taxableAmount, gstPercent]);

  const baseTotal = useMemo(
    () => safeNum(taxableAmount) + safeNum(gstTotal),
    [taxableAmount, gstTotal]
  );

  const grandTotal = useMemo(() => {
    // ✅ Since itemsSubtotal already has location pricing applied,
    // we only need to apply it to printing and P&F costs
    const printingWithLocation = applyLocationPricing(printingCost, priceIncrease, conversionRate);
    const pfWithLocation = applyLocationPricing(pfCost, priceIncrease, conversionRate);
    
    // Taxable amount = items (already adjusted) + printing + P&F (both adjusted)
    const adjustedTaxable = safeNum(itemsSubtotal) + printingWithLocation + pfWithLocation;
    
    // GST on adjusted taxable amount
    const adjustedGst = (adjustedTaxable * safeNum(gstPercent)) / 100;
    
    return Math.round(adjustedTaxable + adjustedGst);
  }, [itemsSubtotal, printingCost, pfCost, gstPercent, priceIncrease, conversionRate]);

  if (loadingProducts) return <Loading />;
  if (!cart.length)
    return (
      <div className="p-8 text-center text-gray-400 text-xl">
        Your cart is empty.
      </div>
    );

  return (
    <div className="min-h-screen text-white p-8">
      <h1 className="text-3xl font-bold mb-8">SHOPPING CART</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Items */}
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

        {/* Summary */}
        <div className="lg:w-96 flex flex-col">
          <div
            className="lg:w-96 h-fit rounded-sm p-6"
            style={{ backgroundColor: "#112430" }}
          >
            <h2 className="text-2xl font-bold mb-6">ORDER SUMMARY</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span>{formatCurrency(itemsSubtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Printing ({printingUnits} sides)</span>
                <span>{formatCurrency(applyLocationPricing(printingCost, priceIncrease, conversionRate))}</span>
              </div>
              <div className="flex justify-between">
                <span>P&F</span>
                <span>{formatCurrency(applyLocationPricing(pfCost, priceIncrease, conversionRate))}</span>
              </div>
              <div className="flex justify-between">
                <span>GST ({safeNum(gstPercent)}%)</span>
                <span>{formatCurrency((itemsSubtotal + applyLocationPricing(printingCost, priceIncrease, conversionRate) + applyLocationPricing(pfCost, priceIncrease, conversionRate)) * (safeNum(gstPercent) / 100))}</span>
              </div>
              {priceIncrease && (
                <div className="flex justify-between text-yellow-400">
                  <span>
                    ✓ Location Pricing Applied ({resolvedLocation}, {currency})
                  </span>
                  <span>+{safeNum(priceIncrease)}%</span>
                </div>
              )}
            </div>

            <div className="flex justify-between border-t pt-4 mb-6">
              <span className="font-bold">Total</span>
              <span className="font-bold">{formatCurrency(grandTotal)}</span>
            </div>

            <button
              className="w-full py-4 font-bold bg-yellow-400 text-black hover:bg-yellow-300 cursor-pointer"
              onClick={() => {
                if (!address) {
                  toast.error("⚠ Please select a delivery address");
                  return;
                }
                navigate("/payment", {
                  state: {
                    items: actualData,
                    totals: {
                      itemsSubtotal,
                      printingCost,
                      pfCost,
                      taxableAmount,
                      gstPercent,
                      gstTotal,
                      locationIncreasePercent: priceIncrease || 0,
                      grandTotal,
                    },
                    address,
                    user,
                  },
                });
              }}
            >
              CHECK OUT
            </button>

            <button
              onClick={() => {
                const input = invoiceRef.current;
                if (!input) return;
                html2canvas(input, { scale: 2, useCORS: true }).then(
                  (canvas) => {
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
                    pdf.save("Invoice.pdf");
                  }
                );
              }}
              disabled={!actualData.length}
              className="mt-4 w-full py-3 rounded bg-black text-white hover:opacity-90 disabled:opacity-40 cursor-pointer"
            >
              Download Invoice (PDF)
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

      {/* ✅ Off-screen Invoice */}
      <div
        ref={invoiceRef}
        style={{
          position: "absolute",
          top: "-9999px",
          left: "-9999px",
          background: "#fff",
        }}
      >
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
            subtotal: itemsSubtotal,
            total: grandTotal,
            gstPercent,
            locationTax: {
              country: resolvedLocation,
              percentage: priceIncrease || 0,
              currency: { country: currency, toconvert: conversionRate },
            },
            formatCurrency,
          }}
        />
      </div>
    </div>
  );
};

export default Cart;
