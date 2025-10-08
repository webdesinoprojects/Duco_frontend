import React, { useState, useMemo, useEffect } from "react";
import PaymentButton from "../Components/PaymentButton";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import NetbankingPanel from "../Components/NetbankingPanel.jsx";
import { completeOrder } from "../Service/APIservice"; // ✅ new import
import { useCart } from "../ContextAPI/CartContext.jsx";

const PaymentPage = () => {
  const [paymentMethod, setPaymentMethod] = useState("");
  const [showPayNow, setShowPayNow] = useState(false);
  const [netbankingType, setNetbankingType] = useState("");
  const locations = useLocation();
  const navigate = useNavigate();
  const { cart } = useCart();

  const [cartLoaded, setCartLoaded] = useState(false);

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem("cart"));
    if (savedCart && savedCart.length > 0) {
      console.log("🛒 Using localStorage cart as fallback:", savedCart);
    }
    setCartLoaded(true);
  }, []);

  const orderpayload = locations.state || {};

  // ✅ DEBUG: Log order payload on load
  useEffect(() => {
    if (!orderpayload) return;

    console.group("🧾 AUTO ORDER PAYLOAD PREVIEW");
    console.log("📦 Full order payload that will be sent to backend:");
    console.log(JSON.stringify(orderpayload, null, 2));

    const summary = {
      user: orderpayload?.user?._id || "❌ Missing",
      address: orderpayload?.address?.fullName || "❌ Missing",
      itemCount: orderpayload?.items?.length || 0,
      totalPay: orderpayload?.totalPay || 0,
    };
    console.table(summary);
    console.groupEnd();
  }, [orderpayload]);

  // ✅ Ensure email present (backend requires)
  if (orderpayload?.address && !orderpayload.address.email) {
    orderpayload.address.email =
      orderpayload?.user?.email || "noemail@placeholder.com";
  }

  // ✅ When selecting method
  const handlePaymentChange = (method) => {
    setPaymentMethod(method);
    setShowPayNow(method === "online" || method === "50%");
  };

  // ✅ Handle Netbanking & 50% payment order creation
  const handleSubmit = async () => {
    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    try {
      if (paymentMethod === "netbanking") {
        const res = await completeOrder(
          "manual_payment",
          "netbanking",
          orderpayload
        );
        toast.success("✅ Order placed successfully!");
        navigate("/order-success", { state: { order: res.order } });
      } else if (paymentMethod === "50%") {
        const res = await completeOrder("half_payment", "50%", orderpayload);
        toast.success("✅ 50% order placed successfully!");
        navigate("/order-success", { state: { order: res.order } });
      } else if (paymentMethod === "") {
        toast.error("Please select a payment method");
      }
    } catch (err) {
      console.error("Order creation failed:", err);
      toast.error("❌ Failed to place order");
    }
  };

  // ✅ detect bulk order
  const isBulkOrder = useMemo(() => {
    const items = orderpayload?.items ?? [];
    return items.some((item) =>
      Object.values(item?.quantity ?? {}).some((qty) => Number(qty) >= 50)
    );
  }, [orderpayload]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] px-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-lg">
        <h1 className="text-2xl font-semibold text-center text-[#0A0A0A] mb-6">
          Select Payment Method
        </h1>

        <div className="space-y-4">
          {/* ✅ Online payment (Razorpay full) */}
          <div>
            <label className="flex items-center text-lg text-[#0A0A0A]">
              <input
                type="radio"
                name="paymentMethod"
                value="online"
                checked={paymentMethod === "online"}
                onChange={() => handlePaymentChange("online")}
                className="mr-2"
              />
              Pay Online
            </label>
          </div>

          {/* ✅ Bulk orders → allow 50% and Netbanking */}
          {isBulkOrder && (
            <>
              <div>
                <label className="flex items-center text-lg text-[#0A0A0A]">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="50%"
                    checked={paymentMethod === "50%"}
                    onChange={() => handlePaymentChange("50%")}
                    className="mr-2"
                  />
                  50% Pay Online
                </label>
              </div>

              <div>
                <label className="flex items-start gap-3 text-lg text-[#0A0A0A]">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="netbanking"
                    checked={paymentMethod === "netbanking"}
                    onChange={() => handlePaymentChange("netbanking")}
                    className="mt-1"
                  />
                  <div className="w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <span className="font-semibold">Netbanking</span>
                      <select
                        value={netbankingType}
                        onChange={(e) => setNetbankingType(e.target.value)}
                        className="sm:ml-3 rounded-lg border border-gray-300 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#E5C870]"
                        disabled={paymentMethod !== "netbanking"}
                      >
                        <option value="upi">UPI</option>
                        <option value="bank">Account Details</option>
                      </select>
                    </div>

                    <NetbankingPanel
                      paymentMethod={paymentMethod}
                      netbankingType={netbankingType}
                    />
                  </div>
                </label>
              </div>
            </>
          )}

          {showPayNow && paymentMethod === "online" && (
            <div className="mt-6 space-y-3">
              {/* 🔍 PREVIEW PAYLOAD BUTTON */}
              {import.meta.env.MODE !== "production" && (
                <button
                  onClick={() => {
                    console.group("🧾 ORDER PAYLOAD PREVIEW BEFORE PAYMENT");

                    console.log("🔹 paymentmode:", paymentMethod);
                    console.log(
                      "🔹 Will be sent to backend after payment success:"
                    );

                    // ✅ Use live cart if available
                    const localCart =
                      JSON.parse(localStorage.getItem("cart")) || [];
                    const itemsSource =
                      cart?.length > 0
                        ? cart
                        : localCart.length > 0
                        ? localCart
                        : orderpayload?.items || [];

                    console.log(
                      "🧩 Using items from:",
                      cart?.length > 0
                        ? "CartContext"
                        : localCart.length > 0
                        ? "LocalStorage"
                        : "orderpayload.state"
                    );

                    const orderPayload = {
                      items: itemsSource.map((item, idx) => {
                        const missing = [];

                        if (!item.printroveProductId)
                          missing.push("printroveProductId");
                        if (!item.printroveVariantId)
                          missing.push("printroveVariantId");
                        if (!item.previewImages?.front)
                          missing.push("previewImages.front");

                        if (missing.length > 0) {
                          console.warn(
                            `⚠️ Item ${idx + 1}: Missing ${missing.join(", ")}`
                          );
                        }

                        return {
                          id: item.id,
                          productId: item.productId || item._id,
                          name:
                            item.products_name || item.name || "Custom T-shirt",
                          printroveProductId: item.printroveProductId || null,
                          printroveVariantId: item.printroveVariantId || null,
                          color: item.color,
                          colortext: item.colortext,
                          gender: item.gender,
                          price: item.price,
                          quantity: item.quantity,
                          previewImages: {
                            front: item.previewImages?.front || null,
                            back: item.previewImages?.back || null,
                            left: item.previewImages?.left || null,
                            right: item.previewImages?.right || null,
                          },
                          design: item.design || {},
                        };
                      }),

                      address: {
                        name: orderpayload?.address?.fullName || "Unknown",
                        phone: orderpayload?.address?.phone || "",
                        email: orderpayload?.address?.email || "",
                        street: orderpayload?.address?.street || "",
                        city: orderpayload?.address?.city || "",
                        state: orderpayload?.address?.state || "",
                        postalCode: orderpayload?.address?.pincode || "",
                        country: orderpayload?.address?.country || "India",
                        houseNumber:
                          orderpayload?.address?.houseNumber || "N/A",
                      },

                      user: orderpayload?.user || {},
                      paymentmode: paymentMethod || "online",
                      totalPay: orderpayload?.totalPay || 0,
                    };

                    console.log(JSON.stringify(orderPayload, null, 2));

                    const issues = [];
                    orderPayload.items.forEach((item, idx) => {
                      if (!item.printroveProductId)
                        issues.push(
                          `❌ Item ${idx + 1}: Missing printroveProductId`
                        );
                      if (!item.printroveVariantId)
                        issues.push(
                          `❌ Item ${idx + 1}: Missing printroveVariantId`
                        );
                      if (!item.previewImages?.front)
                        issues.push(
                          `⚠️ Item ${idx + 1}: Missing previewImages.front`
                        );
                    });

                    if (issues.length > 0) {
                      console.warn("⚠️ Found issues:", issues);
                      alert(
                        `⚠️ ${issues.length} issue(s) found. Check console.`
                      );
                    } else {
                      console.log("✅ All required fields look good!");
                      alert("✅ Everything looks perfect!");
                    }

                    console.groupEnd();
                  }}
                  className="w-full py-2 px-4 bg-gray-700 text-white rounded-lg hover:bg-gray-800 font-semibold"
                >
                  Preview Order Payload (Console)
                </button>
              )}

              {/* 🧾 ACTUAL PAYMENT BUTTON */}
              <PaymentButton
                orderData={{
                  ...orderpayload,
                  items: cart?.length > 0 ? cart : orderpayload?.items || [],
                }}
              />
            </div>
          )}

          {/* ✅ For 50% and Netbanking → Continue button (non-Razorpay flow) */}
          {!showPayNow && paymentMethod === "netbanking" && (
            <button
              onClick={handleSubmit}
              className="w-full mt-6 py-2 px-4 bg-[#E5C870] text-black rounded-lg hover:bg-[#D4B752] font-semibold"
            >
              Continue
            </button>
          )}

          {!showPayNow && paymentMethod === "50%" && (
            <button
              onClick={handleSubmit}
              className="w-full mt-6 py-2 px-4 bg-[#E5C870] text-black rounded-lg hover:bg-[#D4B752] font-semibold"
            >
              Continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Optional: Reusable Row Components
function DetailRow({ label, value, canCopy }) {
  const copy = () => navigator.clipboard.writeText(value);
  return (
    <div className="flex items-center justify-between rounded-lg border px-3 py-2">
      <div className="text-sm">
        <div className="text-gray-500">{label}</div>
        <div className="font-medium text-[#0A0A0A]">{value}</div>
      </div>
      {canCopy && (
        <button
          type="button"
          onClick={copy}
          className="ml-3 rounded-lg border px-2 py-1 text-xs hover:bg-[#E5C870] hover:text-black"
          title="Copy"
        >
          Copy
        </button>
      )}
    </div>
  );
}

function CopyRow({ label, value }) {
  const copy = () => navigator.clipboard.writeText(value);
  return (
    <div className="flex items-center justify-between rounded-lg border bg-gray-50 px-3 py-2">
      <div>
        <div className="text-gray-500">{label}</div>
        <div className="font-medium text-[#0A0A0A]">{value}</div>
      </div>
      <button
        type="button"
        onClick={copy}
        className="ml-3 rounded-lg border px-2 py-1 text-xs hover:bg-[#E5C870] hover:text-black"
        title="Copy"
      >
        Copy
      </button>
    </div>
  );
}

export default PaymentPage;
