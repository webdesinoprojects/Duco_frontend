<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import axios from 'axios';
=======
import React, { useState, useEffect } from "react";
import axios from "axios";
>>>>>>> 2d517d099835553b4a53c6a9d813579d4901f949

const ProductsCreated = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [subcategories, setSubcategories] = useState([]);
  const [printroveProducts, setPrintroveProducts] = useState([]);
  const [variants, setVariants] = useState([]);

  // 🔹 Fetch subcategories
  useEffect(() => {
    const getSubCategories = async () => {
      try {
        const res = await axios.get(
<<<<<<< HEAD
          'http://localhost:3000/subcategory/getallsubctg'
        );
        setSubcategories(res.data.subCategory || []);
      } catch (err) {
        console.error('Error fetching subcategories:', err);
=======
          "https://duco-backend.onrender.com/subcategory/getallsubctg"
        );
        setSubcategories(res.data.subCategory || []);
      } catch (err) {
        console.error("Error fetching subcategories:", err);
>>>>>>> 2d517d099835553b4a53c6a9d813579d4901f949
      }
    };
    getSubCategories();
  }, []);

  // 🔹 Fetch Printrove catalog
  useEffect(() => {
    const fetchPrintroveCatalog = async () => {
      try {
<<<<<<< HEAD
        const res = await axios.get('http://localhost:3000/api/printrove/sync');
        setPrintroveProducts(res.data.products || []);
      } catch (err) {
        console.error('Error fetching Printrove catalog:', err);
=======
        const res = await axios.get(
          "https://duco-backend.onrender.com/api/printrove/sync"
        );
        setPrintroveProducts(res.data.products || []);
      } catch (err) {
        console.error("Error fetching Printrove catalog:", err);
>>>>>>> 2d517d099835553b4a53c6a9d813579d4901f949
      }
    };
    fetchPrintroveCatalog();
  }, []);

  const [formData, setFormData] = useState({
<<<<<<< HEAD
    products_name: '',
    image_url: [
      {
        url: [''],
        color: '',
        colorcode: '',
        videolink: '',
        content: [{ size: '', minstock: 1 }],
      },
    ],
    pricing: [{ quantity: '', price_per: '', discount: 0 }],
    Desciptions: [''],
    subcategory: '',
    gender: 'Male',
    printroveProductId: '', // ✅ NEW
    printroveVariantId: '', // ✅ NEW
=======
    products_name: "",
    image_url: [
      {
        url: [""],
        color: "",
        colorcode: "",
        videolink: "",
        content: [{ size: "", minstock: 1 }],
      },
    ],
    pricing: [{ quantity: "", price_per: "", discount: 0 }],
    Desciptions: [""],
    subcategory: "",
    gender: "Male",
    printroveProductId: "", // ✅ NEW
    printroveVariantId: "", // ✅ NEW
>>>>>>> 2d517d099835553b4a53c6a9d813579d4901f949
    isCorporate: false, // ✅ NEW FIELD
  });

  // 🔹 Step Navigation
  const nextStep = () => setCurrentStep((prev) => prev + 1);
  const prevStep = () => setCurrentStep((prev) => prev - 1);

  const handleChange = (e, field) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  // 🔹 Printrove mapping
  const handlePrintroveProductChange = (e) => {
    const selectedId = e.target.value;
    const selectedProduct = printroveProducts.find(
      (p) => p.id === Number(selectedId)
    );
    setVariants(selectedProduct?.variants || []);
    setFormData({
      ...formData,
      printroveProductId: selectedId,
<<<<<<< HEAD
      printroveVariantId: '',
=======
      printroveVariantId: "",
>>>>>>> 2d517d099835553b4a53c6a9d813579d4901f949
    });
  };

  const handlePrintroveVariantChange = (e) => {
    setFormData({ ...formData, printroveVariantId: e.target.value });
  };

  // 🔹 Nested field handlers
  const handleNestedChange = (e, field, index, subField) => {
    const updated = [...formData[field]];
    updated[index][subField] = e.target.value;
    setFormData({ ...formData, [field]: updated });
  };

  const handleImageUrlChange = (e, imgIndex, urlIndex) => {
    const updated = [...formData.image_url];
    updated[imgIndex].url[urlIndex] = e.target.value;
    setFormData({ ...formData, image_url: updated });
  };

  const handleContentChange = (e, imgIndex, contentIndex, field) => {
    const updated = [...formData.image_url];
    updated[imgIndex].content[contentIndex][field] = e.target.value;
    setFormData({ ...formData, image_url: updated });
  };

  // 🔹 Add new fields
  const addImageField = () => {
    setFormData({
      ...formData,
      image_url: [
        ...formData.image_url,
        {
<<<<<<< HEAD
          url: [''],
          color: '',
          colorcode: '',
          videolink: '',
          content: [{ size: '', minstock: 1 }],
=======
          url: [""],
          color: "",
          colorcode: "",
          videolink: "",
          content: [{ size: "", minstock: 1 }],
>>>>>>> 2d517d099835553b4a53c6a9d813579d4901f949
        },
      ],
    });
  };

  const addImageUrl = (imgIndex) => {
    const updated = [...formData.image_url];
<<<<<<< HEAD
    updated[imgIndex].url.push('');
=======
    updated[imgIndex].url.push("");
>>>>>>> 2d517d099835553b4a53c6a9d813579d4901f949
    setFormData({ ...formData, image_url: updated });
  };

  const addContentField = (imgIndex) => {
    const updated = [...formData.image_url];
<<<<<<< HEAD
    updated[imgIndex].content.push({ size: '', minstock: 1 });
=======
    updated[imgIndex].content.push({ size: "", minstock: 1 });
>>>>>>> 2d517d099835553b4a53c6a9d813579d4901f949
    setFormData({ ...formData, image_url: updated });
  };

  const handleDescriptionChange = (e, index) => {
    const updated = [...formData.Desciptions];
    updated[index] = e.target.value;
    setFormData({ ...formData, Desciptions: updated });
  };

  const addPricingField = () => {
    setFormData({
      ...formData,
      pricing: [
        ...formData.pricing,
<<<<<<< HEAD
        { quantity: '', price_per: '', discount: 0 },
=======
        { quantity: "", price_per: "", discount: 0 },
>>>>>>> 2d517d099835553b4a53c6a9d813579d4901f949
      ],
    });
  };

  const addDescriptionField = () => {
    setFormData({
      ...formData,
<<<<<<< HEAD
      Desciptions: [...formData.Desciptions, ''],
=======
      Desciptions: [...formData.Desciptions, ""],
>>>>>>> 2d517d099835553b4a53c6a9d813579d4901f949
    });
  };

  // 🔹 Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
<<<<<<< HEAD
    console.log('🧾 Submitting product:', formData);
    try {
      const res = await axios.post(
        'http://localhost:3000/products/create',
        formData
      );
      alert(res?.data?.message || 'Product created successfully');
    } catch (error) {
      console.error('Error creating product:', error);
      alert('Something went wrong while creating product');
=======
    console.log("🧾 Submitting product:", formData);
    try {
      const res = await axios.post(
        "https://duco-backend.onrender.com/products/create",
        formData
      );
      alert(res?.data?.message || "Product created successfully");
    } catch (error) {
      console.error("Error creating product:", error);
      alert("Something went wrong while creating product");
>>>>>>> 2d517d099835553b4a53c6a9d813579d4901f949
    }
  };

  // 🔹 Navigation buttons
  const StepNavigation = () => (
    <div className="flex justify-between mt-6">
      {currentStep > 1 && (
        <button
          type="button"
          onClick={prevStep}
          className="bg-gray-200 hover:bg-gray-300 px-5 py-2 rounded shadow"
        >
          ⏪ Back
        </button>
      )}
      {currentStep < 6 && (
        <button
          type="button"
          onClick={nextStep}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded shadow"
        >
          Next ⏩
        </button>
      )}
      {currentStep === 6 && (
        <button
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded shadow"
        >
          ✅ Submit
        </button>
      )}
    </div>
  );

  // 🔹 Render
  return (
    <div className="max-w-5xl mx-auto p-8 bg-gradient-to-br from-white via-slate-50 to-white shadow-xl rounded-lg border border-slate-100">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
<<<<<<< HEAD
        🛍️ Create New Product{' '}
=======
        🛍️ Create New Product{" "}
>>>>>>> 2d517d099835553b4a53c6a9d813579d4901f949
        <span className="text-base block mt-1 text-gray-500">
          Step {currentStep} of 6
        </span>
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1 */}
        {currentStep === 1 && (
          <input
            type="text"
            placeholder="Product Name"
            className="w-full border border-gray-300 p-3 rounded-md shadow-sm focus:ring focus:ring-blue-200"
            value={formData.products_name}
<<<<<<< HEAD
            onChange={(e) => handleChange(e, 'products_name')}
=======
            onChange={(e) => handleChange(e, "products_name")}
>>>>>>> 2d517d099835553b4a53c6a9d813579d4901f949
            required
          />
        )}

        {/* Step 2 */}
        {currentStep === 2 && (
          <>
            <h3 className="font-semibold text-lg text-gray-700">
              Images, Color & Sizes
            </h3>
            {formData.image_url.map((img, imgIndex) => (
              <div
                key={imgIndex}
                className="border border-slate-200 p-5 bg-white mb-6 rounded-lg shadow"
              >
                <h4 className="text-sm font-semibold mb-3 text-blue-700">
                  Image Block #{imgIndex + 1}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="Color"
                    value={img.color}
                    onChange={(e) =>
<<<<<<< HEAD
                      handleNestedChange(e, 'image_url', imgIndex, 'color')
=======
                      handleNestedChange(e, "image_url", imgIndex, "color")
>>>>>>> 2d517d099835553b4a53c6a9d813579d4901f949
                    }
                    className="border p-2 rounded"
                  />
                  <input
                    type="text"
                    placeholder="Color Code"
                    value={img.colorcode}
                    onChange={(e) =>
<<<<<<< HEAD
                      handleNestedChange(e, 'image_url', imgIndex, 'colorcode')
=======
                      handleNestedChange(e, "image_url", imgIndex, "colorcode")
>>>>>>> 2d517d099835553b4a53c6a9d813579d4901f949
                    }
                    className="border p-2 rounded"
                  />
                  <input
                    type="text"
                    placeholder="Video Link"
                    value={img.videolink}
                    onChange={(e) =>
<<<<<<< HEAD
                      handleNestedChange(e, 'image_url', imgIndex, 'videolink')
=======
                      handleNestedChange(e, "image_url", imgIndex, "videolink")
>>>>>>> 2d517d099835553b4a53c6a9d813579d4901f949
                    }
                    className="border p-2 rounded"
                  />
                </div>
                <div className="mt-3 space-y-2">
                  {img.url.map((url, urlIndex) => (
                    <input
                      key={urlIndex}
                      type="text"
                      placeholder={`Image URL #${urlIndex + 1}`}
                      value={url}
                      onChange={(e) =>
                        handleImageUrlChange(e, imgIndex, urlIndex)
                      }
                      className="w-full border p-2 rounded"
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => addImageUrl(imgIndex)}
                    className="text-blue-500 text-sm"
                  >
                    + Add Image URL
                  </button>
                </div>
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700">
                    Size & Stock
                  </h4>
                  {img.content.map((contentItem, contentIndex) => (
                    <div key={contentIndex} className="flex gap-4 mt-2">
                      <input
                        type="text"
                        placeholder={`Size #${contentIndex + 1}`}
                        value={contentItem.size}
                        onChange={(e) =>
<<<<<<< HEAD
                          handleContentChange(e, imgIndex, contentIndex, 'size')
=======
                          handleContentChange(e, imgIndex, contentIndex, "size")
>>>>>>> 2d517d099835553b4a53c6a9d813579d4901f949
                        }
                        className="w-1/2 border p-2 rounded"
                      />
                      <input
                        type="number"
                        placeholder="Min Stock"
                        value={contentItem.minstock}
                        onChange={(e) =>
                          handleContentChange(
                            e,
                            imgIndex,
                            contentIndex,
<<<<<<< HEAD
                            'minstock'
=======
                            "minstock"
>>>>>>> 2d517d099835553b4a53c6a9d813579d4901f949
                          )
                        }
                        className="w-1/2 border p-2 rounded"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addContentField(imgIndex)}
                    className="text-blue-500 text-sm mt-2"
                  >
                    + Add Size
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addImageField}
              className="text-sm text-blue-600 font-medium"
            >
              + Add New Image Block
            </button>
          </>
        )}

        {/* Step 3 */}
        {currentStep === 3 && (
          <>
            <h3 className="font-semibold text-lg text-gray-700">
              Pricing Tiers
            </h3>
            {formData.pricing.map((item, i) => (
              <div key={i} className="grid grid-cols-3 gap-4 mb-3">
                <input
                  type="number"
                  placeholder={`Qty #${i + 1}`}
                  value={item.quantity}
                  onChange={(e) =>
<<<<<<< HEAD
                    handleNestedChange(e, 'pricing', i, 'quantity')
=======
                    handleNestedChange(e, "pricing", i, "quantity")
>>>>>>> 2d517d099835553b4a53c6a9d813579d4901f949
                  }
                  className="border p-2 rounded"
                />
                <input
                  type="number"
                  placeholder={`Price #${i + 1}`}
                  value={item.price_per}
                  onChange={(e) =>
<<<<<<< HEAD
                    handleNestedChange(e, 'pricing', i, 'price_per')
=======
                    handleNestedChange(e, "pricing", i, "price_per")
>>>>>>> 2d517d099835553b4a53c6a9d813579d4901f949
                  }
                  className="border p-2 rounded"
                />
                <input
                  type="number"
                  placeholder={`Discount (%) #${i + 1}`}
                  value={item.discount}
                  onChange={(e) =>
<<<<<<< HEAD
                    handleNestedChange(e, 'pricing', i, 'discount')
=======
                    handleNestedChange(e, "pricing", i, "discount")
>>>>>>> 2d517d099835553b4a53c6a9d813579d4901f949
                  }
                  className="border p-2 rounded"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={addPricingField}
              className="text-sm text-blue-600 font-medium"
            >
              + Add Price Tier
            </button>
          </>
        )}

        {/* Step 4 */}
        {currentStep === 4 && (
          <>
            <h3 className="font-semibold text-lg text-gray-700">
              Product Descriptions
            </h3>
            {formData.Desciptions.map((desc, i) => (
              <textarea
                key={i}
                placeholder={`Description #${i + 1}`}
                value={desc}
                onChange={(e) => handleDescriptionChange(e, i)}
                className="w-full border p-2 rounded mb-2"
              />
            ))}
            <button
              type="button"
              onClick={addDescriptionField}
              className="text-sm text-blue-600 font-medium"
            >
              + Add Description
            </button>
          </>
        )}

        {/* Step 5 */}
        {currentStep === 5 && (
          <>
            <h3 className="font-semibold text-lg text-gray-700">
              Subcategory Reference
            </h3>
            <select
              value={formData.subcategory}
<<<<<<< HEAD
              onChange={(e) => handleChange(e, 'subcategory')}
=======
              onChange={(e) => handleChange(e, "subcategory")}
>>>>>>> 2d517d099835553b4a53c6a9d813579d4901f949
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-green-200 mb-4"
            >
              <option value="">Select a Subcategory</option>
              {subcategories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.subcatogry}
                  {cat.categoryId?.length > 0 &&
                    ` (Belongs to: ${cat.categoryId[0]?.category})`}
                </option>
              ))}
            </select>

            <h3 className="font-semibold text-lg text-gray-700">
              Product Gender
            </h3>
            <select
              value={formData.gender}
<<<<<<< HEAD
              onChange={(e) => handleChange(e, 'gender')}
=======
              onChange={(e) => handleChange(e, "gender")}
>>>>>>> 2d517d099835553b4a53c6a9d813579d4901f949
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-green-200 mb-6"
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Unisex">Unisex</option>
            </select>

            {/* 🟢 Corporate Product Toggle */}
            <div className="flex items-center gap-2 mb-6">
              <input
                type="checkbox"
                id="isCorporate"
                checked={formData.isCorporate}
                onChange={(e) =>
                  setFormData({ ...formData, isCorporate: e.target.checked })
                }
                className="w-4 h-4 accent-blue-600"
              />
              <label htmlFor="isCorporate" className="text-gray-800 text-sm">
                Mark as Corporate Product (B2B)
              </label>
            </div>

            {/* 🟢 Printrove Mapping */}
            <h3 className="font-semibold text-lg text-gray-700 mt-4">
              Printrove Product
            </h3>
            <select
              value={formData.printroveProductId}
              onChange={handlePrintroveProductChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-200 mb-4"
            >
              <option value="">Select Printrove Product</option>
              {printroveProducts.map((prod) => (
                <option key={prod.id} value={prod.id}>
                  {prod.name}
                </option>
              ))}
            </select>

            {variants.length > 0 && (
              <>
                <h3 className="font-semibold text-lg text-gray-700">
                  Printrove Variant
                </h3>
                <select
                  value={formData.printroveVariantId}
                  onChange={handlePrintroveVariantChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-200"
                >
                  <option value="">Select Variant</option>
                  {variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {`${v.color} - ${v.size}`}
                    </option>
                  ))}
                </select>
              </>
            )}
          </>
        )}

        {/* Step 6 */}
        {currentStep === 6 && (
          <>
            <h3 className="text-xl font-semibold mb-3 text-gray-800">
              🧾 Review Your Product
            </h3>
            <div className="bg-gray-50 p-4 rounded space-y-3 text-sm">
              <p>
                <strong>Name:</strong> {formData.products_name}
              </p>
              <p>
                <strong>Gender:</strong> {formData.gender}
              </p>
              <p>
                <strong>Subcategory:</strong> {formData.subcategory}
              </p>
              <p>
<<<<<<< HEAD
                <strong>Corporate:</strong>{' '}
                {formData.isCorporate ? '✅ Yes (B2B)' : '❌ No (B2C)'}
=======
                <strong>Corporate:</strong>{" "}
                {formData.isCorporate ? "✅ Yes (B2B)" : "❌ No (B2C)"}
>>>>>>> 2d517d099835553b4a53c6a9d813579d4901f949
              </p>
            </div>
          </>
        )}

        <StepNavigation />
      </form>
    </div>
  );
};

export default ProductsCreated;
