import React, { useState, useMemo } from "react";
import PaymentButton from "../Components/PaymentButton";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import NetbankingPanel from "../Components/NetbankingPanel.jsx";
import { completeOrder } from "../Service/APIservice";

const PaymentPage = () => {
  const [paymentMethod, setPaymentMethod] = useState("");
  const [showPayNow, setShowPayNow] = useState(false);
  const [netbankingType, setNetbankingType] = useState("");
  const locations = useLocation();
  const navigate = useNavigate();

  const orderpayload = locations.state || {};
  const { paymentOptions = ["Pay Online"], isB2B = false } = orderpayload; // ✅ from Cart.jsx

  console.log("💳 Payment options received:", paymentOptions);
  console.log("🏢 Order Type:", isB2B ? "B2B Corporate" : "B2C Retail");

  // ✅ Ensure email present (backend requires)
  if (orderpayload?.address && !orderpayload.address.email) {
    orderpayload.address.email =
      orderpayload?.user?.email || "noemail@placeholder.com";
  }

  // ✅ When selecting method
  const handlePaymentChange = (method) => {
    setPaymentMethod(method);
    // For Pay Online, trigger Razorpay button
    setShowPayNow(method === "Pay Online" || method === "online" || method === "50%");
  };

  // ✅ Handle Manual (non-Razorpay) payments
  const handleSubmit = async () => {
    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    try {
      if (paymentMethod === "Netbanking") {
        const res = await completeOrder("manual_payment", "netbanking", orderpayload);
        toast.success("✅ Order placed successfully via Netbanking!");
        navigate("/order-success", { state: { order: res.order } });
      } else if (paymentMethod === "Pickup from Store") {
        const res = await completeOrder("manual_payment", "pickup", orderpayload);
        toast.success("🏬 Pickup order confirmed successfully!");
        navigate("/order-success", { state: { order: res.order } });
      } else if (paymentMethod === "50%" || paymentMethod === "half_payment") {
        const res = await completeOrder("half_payment", "50%", orderpayload);
        toast.success("✅ 50% advance order placed successfully!");
        navigate("/order-success", { state: { order: res.order } });
      }
    } catch (err) {
      console.error("Order creation failed:", err);
      toast.error("❌ Failed to place order");
    }
  };

  // ✅ detect bulk order (still supported)
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
          {/* 💡 Render dynamically based on paymentOptions array */}
          {paymentOptions.map((option) => (
            <div key={option}>
              <label className="flex items-start gap-3 text-lg text-[#0A0A0A]">
                <input
                  type="radio"
                  name="paymentMethod"
                  value={option}
                  checked={paymentMethod === option}
                  onChange={() => handlePaymentChange(option)}
                  className="mt-1"
                />
                <div className="w-full">
                  <span className="font-semibold">{option}</span>

                  {/* For Netbanking → show details */}
                  {option === "Netbanking" && paymentMethod === "Netbanking" && (
                    <div className="mt-3">
                      <select
                        value={netbankingType}
                        onChange={(e) => setNetbankingType(e.target.value)}
                        className="rounded-lg border border-gray-300 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#E5C870]"
                      >
                        <option value="upi">UPI</option>
                        <option value="bank">Account Details</option>
                      </select>

                      <NetbankingPanel
                        paymentMethod={paymentMethod}
                        netbankingType={netbankingType}
                      />
                    </div>
                  )}
                </div>
              </label>
            </div>
          ))}

          {/* 🟡 Razorpay Pay Online Button */}
          {showPayNow && paymentMethod === "Pay Online" && (
            <div className="mt-6">
              <PaymentButton orderData={orderpayload} />
            </div>
          )}

          {/* 🟢 For Netbanking and Pickup and 50% advance → Continue button */}
          {!showPayNow &&
            (paymentMethod === "Netbanking" ||
              paymentMethod === "Pickup from Store" ||
              paymentMethod === "50%") && (
              <button
                onClick={handleSubmit}
                className="w-full mt-6 py-2 px-4 bg-[#E5C870] text-black rounded-lg hover:bg-[#D4B752] font-semibold"
              >
                Continue
              </button>
            )}
        </div>

        {/* ⚙️ Debug Info */}
        <div className="mt-8 p-3 bg-gray-50 border rounded text-sm text-gray-700">
          <div>Order Type: {isB2B ? "Corporate (B2B)" : "Retail (B2C)"}</div>
          <div>Available Options: {paymentOptions.join(", ")}</div>
        </div>
      </div>
    </div>
  );
};

// Optional reusable rows (unchanged)
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
