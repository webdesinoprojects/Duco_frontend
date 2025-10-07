// 📁 src/Pages/OrderProcessing.jsx
import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import LZString from "lz-string"; // ✅ Added for decompression

const OrderProcessing = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ Safely extract data from location.state
  const paymentId = location.state?.paymentId || null;
  let orderData = location.state?.orderData || null; // ✅ changed to let for decompression
  let paymentmode = location.state?.paymentmode || "online";
  const compressed = location.state?.compressed || false; // ✅ added flag if sent

  // ✅ Decompress if needed
  if (compressed && typeof orderData === "string") {
    try {
      const jsonString = LZString.decompressFromBase64(orderData);
      orderData = JSON.parse(jsonString);
      console.log("✅ Order data decompressed successfully (frontend)");
    } catch (e) {
      console.error("❌ Decompression failed:", e);
      toast.error("Order data corrupted. Redirecting...");
      navigate("/payment", { replace: true });
    }
  }

  // ✅ Normalize paymentmode (backend expects lowercase)
  paymentmode = paymentmode.toLowerCase();

  const API_BASE = "https://duco-backend.onrender.com/";

  useEffect(() => {
    if (!paymentId || !orderData) {
      toast.error("Missing payment details. Redirecting...");
      navigate("/payment", { replace: true });
      return;
    }

    // ✅ Ensure address has email (backend requires it)
    if (!orderData?.address?.email) {
      orderData.address = {
        ...orderData.address,
        email: orderData?.user?.email || "noemail@placeholder.com",
      };
    }

    const completeOrder = async () => {
      try {
        console.log("🔄 Sending order completion request:", {
          paymentId,
          paymentmode,
          items: orderData?.items?.length || 0,
          totalPay: orderData?.totalPay,
        });

        const response = await axios.post(`${API_BASE}api/completedorder`, {
          paymentId,
          orderData,
          paymentmode,
        });

        const data = response?.data;
        console.log("✅ Order completion response:", data);

        if (data?.success) {
          const orderId =
            data?.order?._id || data?.orderId || orderData?.id || "UNKNOWN";
          toast.success("✅ Order completed successfully!");
          navigate(`/order-success/${orderId}`, { replace: true });
        } else {
          toast.error(data?.message || "❌ Order failed. Please try again.");
          navigate("/payment", { replace: true });
        }
      } catch (error) {
        console.error("❌ Order processing error:", error);

        const errMsg =
          error.response?.data?.message ||
          error.message ||
          "Something went wrong. Please try again.";

        toast.error(errMsg);
        navigate("/payment", { replace: true });
      }
    };

    completeOrder();
  }, [navigate, paymentId, orderData, paymentmode]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] text-white text-xl font-semibold">
      Processing your order, please wait...
    </div>
  );
};

export default OrderProcessing;
