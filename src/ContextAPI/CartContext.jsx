import React, { createContext, useState, useEffect } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  // Load cart from localStorage when component mounts
  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('cart'));
    if (savedCart) {
      setCart(savedCart);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

const addToCart = (product) => {
  const {
  id,
  design,
  quantity = {
    "S":0,
    "M": 0,
    "L": 0,
    "XL": 0,
    "2XL": 0,
    "3XL": 0
  },
  color = '#ffffff',
   
  price = 0,
  colortext = 'white',
  gender = 'Male'
} = product;

  const exists = cart.find(
    (item) =>
      item.id === id &&
    
      item.color === color &&
      item.design === design &&
      item.colortext === colortext &&
      item.gender === gender
  );

  if (exists) {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === id &&

        item.color === color &&
        item.design === design &&
        item.colortext === colortext &&
        item.gender === gender
          ? { ...item, quantity: item.quantity + quantity }
          : item
      )
    );
  } else {
    const data = { id, design, color, quantity, price, colortext,gender };
    setCart((prevCart) => [...prevCart, data]);
  }
};


const removeFromCart = (id,quantity, color = null, design = null) => {
  setCart((prevCart) =>
    prevCart.filter((item) => {
      // If size/color/design are provided, match all fields
      if (quantity && color && design) {
        return !(
          item.id === id &&
        
          item.color === color &&
          item.design === design
        );
      }

      // If only id is provided, remove all matching this id
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


  // at bottom of CartProvider.js
return (
  <CartContext.Provider
    value={{ cart, addtocart: addToCart, removeFromCart, clearCart, updateQuantity }}
  >
    {children}
  </CartContext.Provider>
);

};
