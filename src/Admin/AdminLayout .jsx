import React from 'react';
import { Outlet, Link ,useNavigate } from 'react-router-dom';
import {clearAdmin} from  './auth/adminAuth'


const AdminLayout = () => {

  const navigate = useNavigate()

    const handleLogout = async () => {
  
    clearAdmin();
  
    localStorage.removeItem('user');

 
    navigate('/admin/login', { replace: true });
  };
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white p-5">
        <h2 className="text-2xl font-bold mb-6">Admin Panel</h2>
        <nav className="space-y-2">
          <Link to="/admin" className="block hover:text-blue-300">Invertory</Link>
          <Link to="/admin/products" className="block hover:text-blue-300">Products</Link>
        
          <Link to="/admin/category" className="block hover:text-blue-300">Category</Link>
             <Link to="/admin/moneyset" className="block hover:text-blue-300">Set Money</Link>
               <Link to="/admin/order" className="block hover:text-blue-300">Manage Order</Link>
                <Link to="/admin/bulkorder" className="block hover:text-blue-300">Bulk Order</Link>
                       <Link to="/admin/logistic" className="block hover:text-blue-300">Logistic</Link>
                           <Link to="/admin/charges" className="block hover:text-blue-300">charges Paln</Link>
                         <Link to="/admin/" className="block hover:text-blue-300">Logistic</Link>
                           <Link to="/admin/bankdetails" className="block hover:text-blue-300">Bank Details</Link>
                             <Link to="/admin/employess" className="block hover:text-blue-300">Employess Mangamnets</Link>
                                              <Link to="/admin/invoice" className="block hover:text-blue-300">Invoice</Link>
                            
                
                 <Link to="/admin/users" className="block hover:text-blue-300">Users</Link>
                   <Link
  to="https://dashboard.qikink.com/index.php/client/orders/newOrder"
  target="_blank"
  rel="noopener noreferrer"
  className="block hover:text-blue-300"
>
  Qikink
</Link>
<Link to="/admin/sales" className="block hover:text-blue-300">Analysis</Link>
<Link to="/admin/bannersetup" className="block hover:text-blue-300">Banner</Link>

        </nav>
          <button
          onClick={handleLogout}
          className="mt-4 w-full rounded-lg bg-red-600 py-2 font-medium text-white hover:bg-red-700 transition"
        >
          Logout
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-gray-50 p-6">
        <Outlet /> {/* Render nested routes here */}
      </main>
    </div>
  );
};

export default AdminLayout;
