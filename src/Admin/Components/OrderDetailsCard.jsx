import { useState, useEffect } from "react";

const SIZE_ORDER = ["S", "M", "L", "XL", "2XL", "3XL"];

function sortedEntries(quantity = {}) {
  return Object.entries(quantity || {}).sort(
    ([a], [b]) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b)
  );
}
function totalQty(quantity = {}) {
  return Object.values(quantity || {}).reduce((s, n) => s + Number(n || 0), 0);
}
function QuantityChips({ quantity }) {
  const entries = sortedEntries(quantity);
  if (!entries.length) return <span className="text-slate-400">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {entries.map(([size, count]) =>
        Number(count) > 0 ? (
          <span key={size} className="px-1 py-0.5 text-xs rounded border">
            {size} × {count}
          </span>
        ) : null
      )}
    </div>
  );
}

const OrderDetailsCard = ({ orderId }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const statusOptions = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

  const handleStatusChange = async (newStatus) => {
    setOrder((prev) => ({ ...prev, status: newStatus }));
    try {
      await fetch(`https://duco-backend.onrender.com/api/order/update/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  
  const getStatusColor = (status) => {
    switch (status) {
      case "Pending": return "bg-yellow-100 text-yellow-800";
      case "Processing": return "bg-blue-100 text-blue-800";
      case "Shipped": return "bg-indigo-100 text-indigo-800";
      case "Delivered": return "bg-green-100 text-green-800";
      case "Cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`https://duco-backend.onrender.com/api/order/${orderId}`);
        const data = await res.json();
        setOrder(data);
      } catch (err) {
        console.error("Failed to fetch order", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId]);

  if (loading) return <div className="p-4 text-center">Loading...</div>;
  if (!order) return <div className="p-4 text-center">Order not found</div>;

  return (
    <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Order #{order._id}</h2>
          <p className="text-gray-600">
            Placed on{" "}
            {new Date(order.createdAt).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}>
            {order.status}
          </span>
          <select
            value={order.status ?? ""}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="block w-40 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Customer / Payment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Customer Information</h3>
          <div className="space-y-1">
            <p>{order.address?.fullName}</p>
            <p className="text-blue-600">{order.address?.mobileNumber}</p>
            <p className="text-gray-600">
              {order.address?.houseNumber}, {order.address?.street}, {order.address?.city},{" "}
              {order.address?.state} - {order.address?.pincode}
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Payment Information</h3>
          <div className="space-y-2">
            <p>Total Amount: ₹{Number(order.price || order.amount || 0).toFixed(2)}</p>
            <p className={`font-medium ${order.razorpayPaymentId ? "text-green-600" : "text-yellow-600"}`}>
              Payment Status: {order.razorpayPaymentId ? "Paid" : "Unpaid"}
            </p>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Order Items</h3>

        <div className="space-y-5">
          {order.items?.map((item, index) => {
            const qtySum = totalQty(item.quantity);
            return (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 bg-white rounded border border-gray-200 overflow-hidden flex items-center justify-center">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                    ) : (
                      <div className="text-xs text-gray-400">No image</div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{item.name}</p>

                    <div className="text-sm text-gray-600 mt-1">
                      Color: <span className="font-medium">{item.colortext || item.color || "-"}</span>
                      &nbsp;|&nbsp; Qty:&nbsp;
                      <span className="font-medium">{item.qty || qtySum}</span>
                    </div>

                    <div className="mt-2">
                      <QuantityChips quantity={item.quantity} />
                    </div>

                    <p className="text-gray-800 font-semibold mt-2">
                      ₹{Number(item.price || 0).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* ✅ Design Previews */}
                {item.design && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-800 mb-2">Design Preview</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {["frontView", "backView", "leftView", "rightView"].map((view) =>
                        item.design[view] ? (
                          <div key={view} className="bg-white border border-gray-200 rounded p-2 flex flex-col items-center">
                            <div className="w-full aspect-square overflow-hidden flex items-center justify-center">
                              <img src={item.design[view]} alt={`${view} preview`} className="w-full h-full object-contain" />
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-[11px] text-gray-600 capitalize">{view.replace("View", "")}</span>
                              <a href={item.design[view]} target="_blank" rel="noreferrer" className="text-[11px] text-blue-600 hover:underline">
                                Open
                              </a>
                            </div>
                          </div>
                        ) : null
                      )}
                    </div>

                    {/* ✅ Uploaded Logo + Extra Files */}
                    <div className="mt-3 space-y-1">
                      {item.design.uploadedLogo && (
                        <p className="text-xs">
                          Logo File:{" "}
                          <a href={item.design.uploadedLogo} target="_blank" className="text-blue-600 underline">
                            View Logo
                          </a>
                        </p>
                      )}
                      {Array.isArray(item.design.extraFiles) && item.design.extraFiles.length > 0 && (
                        <div className="text-xs">
                          <p className="font-medium">Extra Files:</p>
                          <ul className="list-disc pl-4">
                            {item.design.extraFiles.map((f, i) => (
                              <li key={i}>
                                <a href={f.url || "#"} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                                  {f.name}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsCard;
