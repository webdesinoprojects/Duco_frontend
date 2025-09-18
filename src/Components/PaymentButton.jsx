import React from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const PaymentButton = ({ orderData, paymentMethod }) => {
  const navigate = useNavigate();
  const API_BASE = "https://duco-backend.onrender.com/";

  // Load Razorpay checkout script
  const loadScript = (src) => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    const isScriptLoaded = await loadScript(
      "https://checkout.razorpay.com/v1/checkout.js"
    );

    if (!isScriptLoaded) {
      alert("Failed to load Razorpay SDK. Check your connection.");
      return;
    }

    try {
      // 1. Create Razorpay order
      const { data } = await axios.post(`${API_BASE}api/payment/create-order`, {
        amount: orderData.totalPay,
        half: paymentMethod == "50%" ? true : false,
      });

      const { orderId, amount } = data;

      // 2. Configure Razorpay options
      const options = {
        key: "rzp_live_RIY5FnqUMjz8c1", // 🔑 Replace with your actual Razorpay public key
        amount: amount,
        currency: "INR",
        name: "Your Brand Name",
        description: "T-shirt Order",
        order_id: orderId,
        handler: async function (response) {
          const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
            response;

          const verifyRes = await axios.post(`${API_BASE}api/payment/verify`, {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
          });

          if (verifyRes.data.success) {
            // 3. Redirect to Order Processing Page
            navigate("/order-processing", {
              state: {
                paymentId: razorpay_payment_id,
                orderData: orderData,
                paymentmode: paymentMethod,
              },
            });
          } else {
            alert("Payment verification failed.");
          }
        },
        prefill: {
          name: orderData?.shippingAddress?.name || "",
          contact: orderData?.shippingAddress?.phone || "",
          email: orderData?.shippingAddress?.email || "",
        },
        theme: {
          color: "#E5C870",
        },
      };

      // 4. Open Razorpay Checkout
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Payment Error", error);
      alert("Something went wrong. Try again.");
    }
  };

  return (
    <button
      className="bg-[#E5C870] text-black px-4 py-2 rounded font-semibold w-full"
      onClick={handlePayment}
    >
      Pay Now
    </button>
  );
};

export default PaymentButton;
