import React, { useState, useEffect, useContext, useMemo } from "react";
import CartItem from "../Components/CartItem.jsx";
import AddressManager from "../Components/AddressManager";
import Loading from "../Components/Loading";
import { CartContext } from "../ContextAPI/CartContext";
``;
import { getproducts, getChargePlanRates } from "../Service/APIservice";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { usePriceContext } from "../ContextAPI/PriceContext.jsx";

const safeNum = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const Cart = () => {
  const { cart, clear, removeFromCart, updateQuantity } =
    useContext(CartContext);
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingRates, setLoadingRates] = useState(false);
  const [address, setAddress] = useState(null);

  const navigate = useNavigate();
  const { toConvert } = usePriceContext();

  // per-unit charges from /chargeplan/rates
  const [pfPerUnit, setPfPerUnit] = useState(0);
  const [printPerUnit, setPrintPerUnit] = useState(0);
  const [gstPercent, setGstPercent] = useState(0);

  // read user from localStorage once
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    } catch (e) {
      console.error("Invalid user in localStorage", e);
    }
  }, []);

  // fetch products
  useEffect(() => {
    const run = async () => {
      try {
        setLoadingProducts(true);
        const fetched = await getproducts();
        if (Array.isArray(fetched)) setProducts(fetched);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load products. Please refresh.");
      } finally {
        setLoadingProducts(false);
      }
    };
    run();
  }, []);

  // enrich cart items with product data
  const actualData = useMemo(() => {
    if (!Array.isArray(cart)) return [];

    return cart.map((ci) => {
      const p = Array.isArray(products)
        ? products.find((x) => x._id === ci.id)
        : null;

      // If product exists in backend → merge
      if (p) return { ...p, ...ci };

      // If custom product (not in backend) → just return cart item as-is
      return ci;
    });
  }, [cart, products]);

  // total quantity across all items (sum of nested quantity object values)
  const totalQuantity = useMemo(() => {
    return actualData.reduce((sum, item) => {
      const inner = Object.values(item.quantity || {}).reduce(
        (acc, q) => acc + safeNum(q, 0),
        0
      );
      return sum + inner;
    }, 0);
  }, [actualData]);

  // subtotal of products (price * per-item quantities)
  const subtotal = useMemo(() => {
    return actualData.reduce((sum, item) => {
      const qty = Object.values(item.quantity || {}).reduce(
        (acc, q) => acc + safeNum(q, 0),
        0
      );
      return sum + safeNum(item.price, 0) * qty;
    }, 0);
  }, [actualData]);

  // fetch per-unit rates when totalQuantity changes (≥ 1)
  useEffect(() => {
    const fetchRates = async () => {
      try {
        setLoadingRates(true);
        const qty = totalQuantity > 0 ? totalQuantity : 0;
        const res = await getChargePlanRates(qty);
        if (res?.success) {
          setPfPerUnit(safeNum(res.data?.perUnit?.pakageingandforwarding, 0));
          setPrintPerUnit(safeNum(res.data?.perUnit?.printingcost, 0));
          setGstPercent(
            safeNum(
              res?.data?.gstPercent ??
                res?.data?.percent?.gst ??
                res?.data?.perUnit?.gst,
              0
            )
          );
        } else {
          // If backend uses different shape, fall back to zeros
          setPfPerUnit(0);
          setPrintPerUnit(0);
          setGstPercent(0);
        }
      } catch (e) {
        console.error(e);
        toast.error("Failed to load charges. Please refresh.");
        setPfPerUnit(0);
        setPrintPerUnit(0);
      } finally {
        setLoadingRates(false);
      }
    };

    // If there are no items, don't call the API; zero out charges
    if (totalQuantity > 0) {
      fetchRates();
    } else {
      setPfPerUnit(0);
      setPrintPerUnit(0);
      setGstPercent(0);
    }
  }, [totalQuantity]);

  // totals for charges (per-unit * totalQuantity)
  const pfTotal = useMemo(() => pfPerUnit, [pfPerUnit, totalQuantity]);
  const printTotal = useMemo(() => printPerUnit, [printPerUnit, totalQuantity]);
  const gstTotal = useMemo(
    () => (safeNum(subtotal, 0) * safeNum(gstPercent, 0)) / 100,
    [subtotal, gstPercent]
  );

  // grand total in base units
  const grandTotal = useMemo(() => {
    return (
      safeNum(subtotal, 0) +
      safeNum(pfTotal, 0) +
      safeNum(printTotal, 0) +
      safeNum(gstTotal, 0)
    );
  }, [subtotal, pfTotal, printTotal, gstTotal]);

  // conversion helper for display
  const convert = (amount) =>
    (safeNum(amount, 0) * safeNum(toConvert, 0)).toFixed(2);

  const orderPayload = useMemo(
    () => ({
      items: actualData, // enriched items (frontend only)
      totalPay: safeNum(grandTotal, 0) * safeNum(toConvert, 0),
      address,
      user,
      pf: pfPerUnit,
      gst: gstPercent,
      printing: printPerUnit,
    }),
    [actualData, grandTotal, toConvert, address, user]
  );
  console.log(orderPayload);

  const handleCheckout = () => {
    if (!user) {
      toast.error("Please log in to continue.");
      return;
    }
    if (!actualData.length) {
      toast.error("Your cart is empty. Add some products first.");
      navigate("/home");
      return;
    }
    if (!address || Object.keys(address || {}).length === 0) {
      toast.error("Please select a delivery address.");
      return;
    }
    navigate("/payment", { state: orderPayload });
  };

  const isLoading = loadingProducts || loadingRates;
  if (isLoading) return <Loading />;

  return (
    <div className="min-h-screen text-white p-8">
      <h1 className="text-3xl font-bold mb-8">SHOPPING CART</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart Items */}
        <div className="flex-1">
          {actualData.length > 0 ? (
            actualData.map((item, i) => (
              <CartItem
                key={`${item._id}-${item.size}-${item.color}-${i}`}
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
            <h2 className="text-2xl font-bold mb-6 text-white">
              ORDER SUMMARY
            </h2>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between">
                <span className="text-gray-300">Subtotal</span>
                <span className="text-white">{convert(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">P&F Charges</span>
                <span className="text-white">{convert(pfTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Printing Charge</span>
                <span className="text-white">{convert(printTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">GST Charge</span>
                <span className="text-white">{convert(gstTotal)}</span>
              </div>
            </div>

            <div className="flex justify-between border-t border-gray-600 pt-4 mb-6">
              <span className="text-white font-bold">Total</span>
              <span className="text-white font-bold">
                {convert(grandTotal)}
              </span>
            </div>

            <button
              className="w-full py-4 font-bold hover:bg-opacity-90 transition-all"
              style={{ backgroundColor: "#FDC305", color: "#112430" }}
              onClick={handleCheckout}
            >
              CHECK OUT
            </button>
          </div>

          {/* Address */}
          <AddressManager
            addresss={address}
            setAddresss={setAddress}
            user={user}
            setUser={setUser}
          />
        </div>
      </div>
    </div>
  );
};

export default Cart;
