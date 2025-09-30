import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const OrderProcessing = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { paymentId, orderData, paymentmode } = location.state || {};
  const API_BASE = "https://duco-backend.onrender.com/";

  useEffect(() => {
    if (!paymentId || !orderData) {
      navigate("/payment"); // if missing data → go back to payment page
      return;
    }

    const completeOrder = async () => {
      try {
        const { data } = await axios.post(`${API_BASE}api/completedorder`, {
          paymentId,
          orderData,
          paymentmode,
        });

        if (data.success) {
          const orderId = data.orderId || data._id || orderData?.id;
          toast.success("✅ Order completed successfully!");
          // redirect to invoice thank-you page
          navigate(`/order-success/${orderId}`, { replace: true });
        } else {
          toast.error("❌ Order failed. Please try again.");
          navigate("/payment", { replace: true });
        }
      } catch (e) {
        console.error("Order processing error:", e);
        toast.error("Something went wrong. Please try again.");
        navigate("/payment", { replace: true });
      }
    };

    completeOrder();
  }, [navigate, orderData, paymentId, paymentmode]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] text-white text-xl font-semibold">
      Processing your order, please wait...
    </div>
  );
};

export default OrderProcessing;
