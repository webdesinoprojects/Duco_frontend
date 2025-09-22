import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaFilter } from "react-icons/fa";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get(
          "https://duco-backend.onrender.com/products/get"
        );
        setProducts(res.data || []);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="text-white min-h-screen flex justify-center items-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="text-white min-h-screen p-4">
      {/* Heading and product count */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl md:block hidden font-bold">Filters</h1>
        <span className="text-gray-500">{products.length} Products</span>
      </div>

      <div className="flex gap-6">
        {/* Filters */}
        <aside className="md:block hidden w-1/5 space-y-6">
          <div>
            <h2 className="font-semibold mb-2">Gender</h2>
            <div className="space-y-1">
              <label className="block">
                <input type="checkbox" className="mr-2" />
                Men
              </label>
              <label className="block">
                <input type="checkbox" className="mr-2" />
                Women
              </label>
            </div>
          </div>
          <hr className="border-t border-gray-100" />
          <div>
            <h2 className="font-semibold mb-2">Category</h2>
            <div className="space-y-1">
              <label className="block">
                <input type="checkbox" className="mr-2" />
                T-Shirt
              </label>
              <label className="block">
                <input type="checkbox" className="mr-2" />
                Vest
              </label>
              <label className="block">
                <input type="checkbox" className="mr-2" />
                Hoodies
              </label>
            </div>
          </div>
          <hr className="border-t border-gray-100" />
          <div>
            <h2 className="font-semibold mb-2">Sizes</h2>
            <div className="space-y-1">
              {["XS", "S", "M", "L", "XL"].map((size) => (
                <label key={size} className="block">
                  <input type="checkbox" className="mr-2" />
                  {size}
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Products */}
        <div className="flex-1">
          {/* Bulk order banner */}
          <div className="bg-black text-white p-6 rounded-xl mb-6 relative">
            <h2 className="text-xl font-bold mb-2">
              Enquire about <span className="text-yellow-400">Bulk Orders</span>{" "}
              at
            </h2>
            <div className="bg-white text-black inline-block px-4 py-2 rounded text-sm font-mono">
              business@duco.com
            </div>
            <p className="text-sm mt-2">
              *Min. 30 units order | Grab exciting deals & offers
            </p>
          </div>

          {/* Sort bar */}
          <div className="flex justify-between mb-4">
            <FaFilter />
            <div>
              <label className="text-sm mr-2">Sort by:</label>
              <select className="border border-gray-300 rounded px-2 py-1 bg-black text-sm">
                <option>Popularity</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Product grid */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {products.map((product, index) => {
              // Safely get the first image
              const imageUrl =
                product.image_url?.[0]?.url?.[0] ||
                "https://via.placeholder.co/400";

              return (
                <Link
                  to={`/products/${product._id}`}
                  key={product._id || index}
                  className="border rounded-xl overflow-hidden shadow-sm hover:shadow-md"
                >
                  <div className="relative">
                    <img
                      src={imageUrl}
                      alt={product.products_name || "Product"}
                      className="w-[200px] h-[200px] object-contain mx-auto"
                    />
                    {product.image_url?.[0]?.color && (
                      <div
                        className="absolute top-2 left-2 text-white text-xs px-2 py-1 rounded"
                        style={{
                          backgroundColor: product.image_url[0].colorcode,
                        }}
                      >
                        {product.image_url[0].color}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-semibold">
                      {product.products_name || "Unnamed Product"}
                    </h3>
                    {/* <p className="text-gray-500 text-xs">
                      {product.Desciptions || "No Description available"}
                    </p> */}
                    <p className="text-sm font-bold mt-2">
                      {product.pricing?.[0]?.price_per
                        ? `₹${product.pricing[0].price_per}`
                        : "₹N/A"}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
