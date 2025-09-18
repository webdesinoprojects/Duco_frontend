import React from 'react'
import tshirt from "../assets/gloomy-young-black-model-clean-white-unlabeled-cotton-t-shirt-removebg-preview.png"
import { Link } from 'react-router-dom'
import { FaFilter } from "react-icons/fa";

const Prodcuts = () => {
  return (
   <div className=" text-white min-h-screen p-4">
      {/* Breadcrumb */}
      

      {/* Heading and product count */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl md:block hidden  font-bold">Filters</h1>
        <span className="text-gray-500">120 Products</span>
      </div>

      {/* Main content */}
      <div className="flex gap-6">
        {/* Filters */}
        <aside className=" md:block hidden  w-1/5 space-y-6 ">
    <div>
      <h2 className="font-semibold mb-2">Gender</h2>
      <div className="space-y-1">
        <label className="block"><input type="checkbox" className="mr-2" />Men</label>
        <label className="block"><input type="checkbox" className="mr-2" />Women</label>
      </div>
    </div>
    <hr className="border-t border-gray-100" />
    <div>
      <h2 className="font-semibold mb-2">Category</h2>
      <div className="space-y-1">
        <label className="block"><input type="checkbox" className="mr-2" />T-Shirt</label>
        <label className="block"><input type="checkbox" className="mr-2" />Vest</label>
        <label className="block"><input type="checkbox" className="mr-2" />Hoodies</label>
      </div>
    </div>
    <hr className="border-t border-gray-100" />
    <div>
      <h2 className="font-semibold mb-2">Sizes</h2>
      <div className="space-y-1">
        {['XS', 'S', 'M', 'L', 'XL'].map(size => (
          <label key={size} className="block">
            <input type="checkbox" className="mr-2" />{size}
          </label>
        ))}
      </div>
    </div>
  </aside>

        {/* Right content */}
        <div className="flex-1">
          {/* Bulk order banner */}
          <div className="bg-black text-white p-6 rounded-xl mb-6 relative">
            <h2 className="text-xl font-bold mb-2">Enquire about <span className="text-yellow-400">Bulk Orders</span> at</h2>
            <div className="bg-white text-black inline-block px-4 py-2 rounded text-sm font-mono">
              business@duco.com
            </div>
            <p className="text-sm mt-2">*Min. 30 units order | Grab exciting deals & offers</p>
          </div>

          {/* Sort bar */}
          <div className="flex    justify-between   mb-4">
             <FaFilter />
             <div>
              <label className="text-sm mr-2">Sort by:</label>
            <select className="border border-gray-300 rounded px-2 py-1  bg-black text-sm">
              <option>Popularity</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
            </select>

             </div>
            
           
          </div>
          
          

          {/* Product grid */}
           <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-6">
    {[1, 2, 3, 4, 5, 6].map((item) => (
      <Link to={`/products/1`} key={item} className="border rounded-xl overflow-hidden shadow-sm hover:shadow-md">
        <div className="relative">
          <img
            src={tshirt}
            alt="T-Shirt Design"
            className="w-[200px]  object-contain"
          />
          <div className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded">Oversized Fit</div>
        </div>
        <div className="p-4">
          <h3 className="text-sm font-semibold">Custom T-Shirt {item}</h3>
          <p className="text-gray-500 text-xs">Your design, your style</p>
          <p className=" text-sm font-bold mt-2">₹499</p>
        </div>
      </Link>
    ))}
  </div>

        </div>
      </div>
    </div>
  )
}

export default Prodcuts