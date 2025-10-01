import React, { useState, useMemo } from "react";
import PaymentButton from "../Components/PaymentButton"; // Import the component
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import NetbankingPanel from "../Components/NetbankingPanel.jsx";

const PaymentPage = () => {
  const [paymentMethod, setPaymentMethod] = useState("");
  const [showPayNow, setShowPayNow] = useState(false);
  const [netbankingType, setNetbankingType] = useState("");
  const locations = useLocation();

  const orderpayload = locations.state || {};
  const navigate = useNavigate();

  // ✅ Ensure email is present in address (backend requires it)
  if (orderpayload?.address && !orderpayload.address.email) {
    orderpayload.address.email =
      orderpayload?.user?.email || "noemail@placeholder.com";
  }

  const handlePaymentChange = (method) => {
    setPaymentMethod(method);
    // ✅ show PayNow only for Razorpay payments
    setShowPayNow(method === "online" || method === "50%");
  };

  const handleSubmit = () => {
    if (paymentMethod === "netbanking") {
      navigate("/order-processing", {
        state: {
          orderData: orderpayload,
          paymentmode: "netbanking", // ✅ backend expects lowercase
        },
      });
      toast.success("Order Placed!");
    } else if (paymentMethod === "") {
      toast.error("Please select a payment method");
    }
  };

  // ✅ detect bulk orders
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

          {/* ✅ For online → Razorpay PayNow button */}
          {showPayNow && paymentMethod === "online" && (
            <div className="mt-6">
              <PaymentButton orderData={orderpayload} />
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
        </div>
      </div>
    </div>
  );
};

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
