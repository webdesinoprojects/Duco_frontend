import React, { createContext, useState, useEffect, useContext } from "react"; // ✅ added useContext here

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  // Load cart from localStorage when component mounts
  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem("cart"));
    if (savedCart) {
      setCart(savedCart);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    console.log("🛒 Cart updated:", cart); // ✅ log full cart every time it changes
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const mergeQuantities = (oldQty, newQty) => {
    const merged = { ...oldQty };
    for (let size in newQty) {
      merged[size] = (merged[size] || 0) + (newQty[size] || 0);
    }
    return merged;
  };

  const addToCart = (product) => {
    const {
      id,
      design,
      quantity = { S: 0, M: 0, L: 0, XL: 0, "2XL": 0, "3XL": 0 },
      color = "#ffffff",
      price = 0,
      colortext = "white",
      gender = "Male",
      name,
      products_name,
      image_url,
      previewImages,
      productId,
      description,
    } = product;

    const exists = cart.find(
      (item) =>
        item.id === id &&
        item.color === color &&
        JSON.stringify(item.design) === JSON.stringify(design) &&
        item.colortext === colortext &&
        item.gender === gender
    );

    if (exists) {
      setCart((prevCart) =>
        prevCart.map((item) =>
          item.id === id &&
          item.color === color &&
          JSON.stringify(item.design) === JSON.stringify(design) &&
          item.colortext === colortext &&
          item.gender === gender
            ? { ...item, quantity: mergeQuantities(item.quantity, quantity) }
            : item
        )
      );
    } else {
      const data = {
        id,
        design,
        color,
        quantity,
        price,
        colortext,
        gender,
        name,
        products_name,
        image_url,
        previewImages,
        productId,
        description,
      };
      setCart((prevCart) => [...prevCart, data]);
    }
  };

  const removeFromCart = (id, quantity, color = null, design = null) => {
    setCart((prevCart) =>
      prevCart.filter((item) => {
        if (quantity && color && design) {
          return !(
            item.id === id &&
            item.color === color &&
            item.design === design
          );
        }
        return item.id !== id;
      })
    );
  };

  // Clear all items
  const clearCart = () => {
    setCart([]);
  };

  // Example updateQuantity inside CartContext
  function updateQuantity(productId, sizeQty) {
    setCart((prev) =>
      prev.map((item) =>
        item.id === productId || item._id === productId
          ? { ...item, quantity: sizeQty }
          : item
      )
    );
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        updateQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// ✅ custom hook (now works since useContext is imported)
export const useCart = () => useContext(CartContext);
