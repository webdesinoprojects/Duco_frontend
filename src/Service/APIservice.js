import axios from 'axios';

const API_BASE = 'https://duco-backend.onrender.com/'; // Set if you have a different baseURL

export const fetchAllPrices = async () => {
  const response = await axios.get(`${API_BASE}money/get_money`);
  return response.data;
};

export const createOrUpdatePrice = async (data) => {
  const response = await axios.post(`${API_BASE}money/create_location_price_increase`, data);
  return response.data;
};

// src/Service/designAPI.js

export const fetchPreviousDesigns = async (userId) => {
  try {
    const res = await fetch(`https://duco-backend.onrender.com/api/designs/user/${userId}`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Failed to fetch designs", err);
    return [];
  }
};





export const fetchPreviousDesignswithpreoduts = async (userId,productId) => {
  try {
    const res = await fetch(`https://duco-backend.onrender.com/api/designs/user/${userId}/${productId}`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Failed to fetch designs", err);
    return [];
  }
};




export const createDesign = async (payload) => {
  try {
    const res = await axios.post('https://duco-backend.onrender.com/api/designs', payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return res.data;
  } catch (err) {
    console.error('Design creation failed:', err.response?.data || err.message);
    return null;
  }
};

export const getCategories = async () => {
    try {
      const res = await axios.get("https://duco-backend.onrender.com/category/getall");
      return res.data.category || [];
    } catch (err) {
      console.error("Error fetching categories:", err);
      return null
    }
  };


  export const getSubcategoriesByCategoryId = async (categoryId) => {
  try {
    const res = await axios.get(`https://duco-backend.onrender.com/subcategory/subcat/${categoryId}`);
    return res.data.data || []; // Assuming controller sends { data: [...] }
  } catch (err) {
    console.error("Error fetching subcategories:", err);
    return null;
  }
};

  export const getproducts = async () => {
  try {
    const res = await axios.get(`https://duco-backend.onrender.com/products/get/`);
    return res.data || []; // Assuming controller sends { data: [...] }
  } catch (err) {
    console.error("Error fetching subcategories:", err);
    return null;
  }
};


export const getproductssingle = async (id) => {
  try {
    const res = await axios.get(`https://duco-backend.onrender.com/products/get/${id}`);
    return res.data || []; // Assuming controller sends { data: [...] }
  } catch (err) {
    console.error("Error fetching subcategories:", err);
    return null;
  }
};





export const getproductcategory = async (idsub) => {
  try {
    const res = await axios.get(`https://duco-backend.onrender.com/products/getsub/${idsub}`);
    return res.data || []; // Assuming controller sends { data: [...] }
  } catch (err) {
    console.error("Error fetching subcategories:", err);
    return null;
  }
};


export const Updateproductcate = async (id,updates) => {
  try {
    const res = await axios.put(`https://duco-backend.onrender.com/products/update/:${id}`,updates);
    return res.data || []; // Assuming controller sends { data: [...] }
  } catch (err) {
    console.error("Error fetching subcategories:", err);
    return null;
  }
};


export const fetchOrdersByUser = async (userId) => {
  try {
    const res = await fetch(`https://duco-backend.onrender.com/api/order/user/${userId}`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Failed to fetch orders", err);
    return [];
  }
};
// /Service/APIservi


// CREATE: POST /api/banners  -> { success, banner }
export async function createBanner(link) {
  try {
    const { data } = await axios.post(`${API_BASE}api/banners`, { link });
    return { success: true, data: data.banner, error: null };
  } catch (err) {
    const message = err.response?.data?.error || err.message || "Failed to create banner";
    return { success: false, data: null, error: message };
  }
}

// READ: GET /api/banners  -> { success, banners:[{_id, link}] }
export async function listBanners() {
  try {
    const { data } = await axios.get(`${API_BASE}api/banners`);
    return { success: true, data: data.banners, error: null };
  } catch (err) {
    const message = err.response?.data?.error || err.message || "Failed to fetch banners";
    return { success: false, data: null, error: message };
  }
}

// UPDATE: PUT /api/banners/:id  -> { success, banner:{_id, link} }
export async function updateBanner(id, link) {
  try {
    const { data } = await axios.put(`${API_BASE}api/banners/${id}`, { link });
    return { success: true, data: data.banner, error: null };
  } catch (err) {
    const message = err.response?.data?.error || err.message || "Failed to update banner";
    return { success: false, data: null, error: message };
  }
}

export async function adminLogin(userid, password) {
  const { data } = await axios.post(`${API_BASE}api/admin/check`, { userid, password });
  return !!data?.ok;          // boolean true/false
}

export const getChargePlanRates = async (qty) => {
  const res = await axios.get(`${API_BASE}api/chargeplan/rates?qty=${qty}`);
  return res.data;
};







async function handle(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

/** GET all bank details */
export async function getBankDetails(signal) {
  const res = await fetch(`${API_BASE}api/bankdetails`, { signal });
  return handle(res);
}

/** Convenience: return FIRST record with isactive === true (or null) */
export async function getActiveBankDetails(signal) {
  const data = await getBankDetails(signal);
  const list = Array.isArray(data) ? data : data?.items || data?.data || [];
  return list.find((x) => x?.isactive === true) || null;
}

export async function getInvoiceByOrder(orderId) {
  if (!orderId) throw new Error("orderId is required");
 
    const res = await axios.get(`${API_BASE}api/invoice/${orderId}`);
    return res.data; // { invoice, totals }
 
}
export async function getWallet(userId) {
  if (!userId) throw new Error("Missing userId for getWallet");
  const url = `${API_BASE}api/wallet/${userId}`;
  const res = await axios.get(url);
  return res.data; // { _id, user, balance?, transactions: [...] }
}



export const deleteProduct = async (productId) => {
  if (!productId) throw new Error("productId is required");
  try {
    const res = await axios.delete(`${API_BASE}/products/deleted/${productId}`);
    return res.data;
  } catch (err) {
    // Normalize error
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to delete product";
    throw new Error(msg);
  }
};