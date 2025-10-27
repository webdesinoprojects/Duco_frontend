import React, { useState, useEffect } from 'react';
<<<<<<< HEAD
import Navbar from '../Admin/Navbar';
import AdminCartItem from './Components/AdminCartItem';
import tshirt from '../assets/gloomy-young-black-model-clean-white-unlabeled-cotton-t-shirt-removebg-preview.png';
import axios from 'axios';
=======
import Navbar from "../Admin/Navbar";
import AdminCartItem from './Components/AdminCartItem';
import tshirt from "../assets/gloomy-young-black-model-clean-white-unlabeled-cotton-t-shirt-removebg-preview.png";
import axios from "axios";
>>>>>>> 2d517d099835553b4a53c6a9d813579d4901f949

const Home = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
<<<<<<< HEAD
        const res = await axios.get('http://localhost:3000/products/get');
        setProducts(res.data); // ✅ use res.data
      } catch (err) {
        console.error('Failed to fetch products:', err);
=======
        const res = await axios.get("https://duco-backend.onrender.com/products/get");
        setProducts(res.data); // ✅ use res.data
      } catch (err) {
        console.error("Failed to fetch products:", err);
>>>>>>> 2d517d099835553b4a53c6a9d813579d4901f949
      }
    };

    fetchData();
  }, []);

  // Additional state or functions from previous updates can go here
  const handleDelete = async (id) => {
    try {
<<<<<<< HEAD
      await axios.delete(`http://localhost:3000/products/delete/${id}`);
      setProducts((prev) => prev.filter((p) => p._id !== id));
      console.log('Deleted product:', id);
    } catch (err) {
      console.error('Failed to delete product:', err);
=======
      await axios.delete(`https://duco-backend.onrender.com/products/delete/${id}`);
      setProducts((prev) => prev.filter((p) => p._id !== id));
      console.log("Deleted product:", id);
    } catch (err) {
      console.error("Failed to delete product:", err);
>>>>>>> 2d517d099835553b4a53c6a9d813579d4901f949
    }
  };

  return (
    <>
      {/* Added Navbar from previous updates */}
      <Navbar />

<<<<<<< HEAD
      <h1 className="text-2xl font-bold text-center mt-4">
        Welcome to Admin Dashboard
      </h1>

=======
      <h1 className="text-2xl font-bold text-center mt-4">Welcome to Admin Dashboard</h1>
      
>>>>>>> 2d517d099835553b4a53c6a9d813579d4901f949
      <div className="max-w-4xl mx-auto mt-6 p-4">
        {products?.map((p, i) => (
          <AdminCartItem
            key={i}
            product={{
              id: p._id,
              products_name: p.products_name,
              Stock: p.Stock,
              image: p.image_url?.[0].url[0],
              image_url: p.image_url,
              fulldetails: p,
            }}
<<<<<<< HEAD
            onEdit={(id) => console.log('Edit clicked for:', id)}
=======
            onEdit={(id) => console.log("Edit clicked for:", id)}
>>>>>>> 2d517d099835553b4a53c6a9d813579d4901f949
            onDelete={handleDelete} // Added delete functionality
          />
        ))}
      </div>
    </>
  );
};

export default Home;
