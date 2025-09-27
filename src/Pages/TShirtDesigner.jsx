// FULL MULTI-VIEW DESIGNER — Responsive for mobile
import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useContext,
} from "react";
import { CartContext } from "../ContextAPI/CartContext";
import { toPng } from "html-to-image";
import {
  DndContext,
  useDraggable,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
} from "@dnd-kit/core";
import { MdNavigateNext } from "react-icons/md";
import menstshirt from "../assets/men_s_white_polo_shirt_mockup-removebg-preview.png";
import axios from "axios";
import { createDesign, getproductssingle } from "../Service/APIservice";
import { useParams, useNavigate } from "react-router-dom";
import { FaUpload, FaFont, FaRegKeyboard, FaTimes } from "react-icons/fa";

// ======================== DRAGGABLE ITEM ========================
const DraggableItem = ({ id, children, position = { x: 0, y: 0 } }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });

  const style = {
    position: "absolute",
    left: `${position.x}%`,
    top: `${position.y}%`,
    transform: transform
      ? `translate(${transform.x}px, ${transform.y}px)`
      : "translate(0, 0)",
    cursor: "move",
    zIndex: 20,
    touchAction: "none",
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </div>
  );
};

// ======================== MAIN COMPONENT ========================
const TshirtDesigner = () => {
  const { addToCart } = useContext(CartContext);

  const [isSaving, setIsSaving] = useState(false);
  const [productDetails, setProductDetails] = useState(null);
  const [additionalFiles, setAdditionalFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [side, setSide] = useState("front");
  const [sideimage, setSideimage] = useState([]);
  const [activeTab, setActiveTab] = useState("none");

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);

  const views = ["front", "back", "left", "right"];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    })
  );

  const defaultSideState = (view) => {
    let defaultTextPos = { x: 50, y: 100 };
    if (view === "front") defaultTextPos = { x: 55, y: 25 };
    else if (view === "back") defaultTextPos = { x: 42, y: 12 };
    else if (view === "left" || view === "right")
      defaultTextPos = { x: 45, y: 25 };

    return {
      uploadedImage: null,
      customText: "",
      textSize: 20,
      textColor: "#000000",
      font: "font-sans",
      imageSize: 120,
      positions: {
        [`uploaded-image-${view}`]: { x: 50, y: 50 },
        [`custom-text-${view}`]: defaultTextPos,
      },
    };
  };

  const [allDesigns, setAllDesigns] = useState({
    front: defaultSideState("front"),
    back: defaultSideState("back"),
    left: defaultSideState("left"),
    right: defaultSideState("right"),
  });

  const designRefs = {
    front: useRef(null),
    back: useRef(null),
    left: useRef(null),
    right: useRef(null),
  };

  const { proid, color } = useParams();
  const navigate = useNavigate();
  const colorWithHash = color ? (color.startsWith("#") ? color : `#${color}`) : "";

  const getViewIndex = (s) =>
    ({ front: 0, back: 1, left: 2, right: 3 }[s] ?? 0);

  // ======================== EFFECTS ========================
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const getdata = async () => {
      try {
        const data = await getproductssingle(proid);
        console.log("PRODUCT DETAILS:", data); // ✅ log full response

        setProductDetails(data); // ✅ save full product

        const match = data?.image_url?.find(
          (e) => e.colorcode === colorWithHash
        );
        setSideimage(match?.designtshirt || []);
      } catch (e) {
        console.error("Failed to fetch product images", e);
      }
    };
    if (proid) getdata();
  }, [proid, color, colorWithHash]);

  // ======================== HANDLERS ========================
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAllDesigns((prev) => ({
        ...prev,
        [side]: { ...prev[side], uploadedImage: reader.result },
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleAdditionalFilesUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setAdditionalFiles((prevFiles) => [
      ...prevFiles,
      ...files.map((file) => ({ name: file.name, file })),
    ]);
  };

  const updateCurrentDesign = (property, value) => {
    setAllDesigns((prev) => ({
      ...prev,
      [side]: { ...prev[side], [property]: value },
    }));
  };

  const handleDragEnd = useCallback(
    (event) => {
      const { active, delta } = event;
      const id = active.id;
      const container = designRefs[side]?.current;
      if (!container) return;

      const { offsetWidth: w, offsetHeight: h } = container;

      setAllDesigns((prev) => {
        const pos = prev[side].positions[id] || { x: 0, y: 0 };
        return {
          ...prev,
          [side]: {
            ...prev[side],
            positions: {
              ...prev[side].positions,
              [id]: {
                x: pos.x + (delta.x / w) * 100,
                y: pos.y + (delta.y / h) * 100,
              },
            },
          },
        };
      });
    },
    [side]
  );

  // ======================== HELPER: WAIT FOR IMAGES ========================
  const waitForImages = (container) => {
    const images = container.querySelectorAll("img");
    return Promise.all(
      Array.from(images).map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete) resolve();
            else img.onload = img.onerror = resolve;
          })
      )
    );
  };

  // ======================== SAVE LOGIC ========================

  const saveSelectedViews = async () => {
    try {
      setIsSaving(true);
      const images = {};

      for (let view of views) {
        const node = designRefs[view]?.current;
        if (!node) continue;

        await waitForImages(node);

        const dataUrl = await toPng(node, {
          cacheBust: true,
          pixelRatio: 2,
          backgroundColor: "#fff",
        });

        images[view] = dataUrl;
      }

      await createDesign({
        productId: proid,
        color: colorWithHash,
        designs: allDesigns,
        previewImages: images,
      });

      const customProduct = {
        id: `custom-tshirt-${Date.now()}`,
        productId: productDetails?._id || proid, // ✅ keep original product id
        name: productDetails?.title || "Custom T-Shirt",
        design: allDesigns,
        previewImages: images,
        color: colorWithHash,
        colortext: productDetails?.colortext || "Custom",
        gender: productDetails?.gender || "Unisex",
        price: Math.round(productDetails?.pricing?.[0]?.price_per || 499),
        quantity: allDesigns?.quantity || { M: 1 }, // use actual selected quantity per size
      };

      console.log("Adding custom product:", customProduct);

      addToCart(customProduct);

      alert("Design saved and added to cart!");
      navigate("/cart");
    } catch (error) {
      console.error("Error saving design:", error);
      alert("Failed to save design. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // ======================== CONTROLS ========================
  const renderControls = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-2">
          Upload Logo
        </h3>
        <label className="flex flex-col items-center px-4 py-3 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 hover:bg-gray-100 cursor-pointer transition-all">
          <span className="text-xs text-gray-600">Click to upload</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Additional Files */}
      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-2">
          Upload Additional Files
        </h3>
        <label className="flex flex-col items-center px-4 py-3 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 hover:bg-gray-100 cursor-pointer transition-all">
          <span className="text-xs text-gray-600">Click to select files</span>
          <input
            type="file"
            multiple
            onChange={handleAdditionalFilesUpload}
            className="hidden"
          />
        </label>
        <ul className="mt-2 max-h-24 overflow-auto text-xs text-gray-600">
          {additionalFiles.map((fileObj, i) => (
            <li key={i} className="truncate" title={fileObj.name}>
              {fileObj.name}
            </li>
          ))}
        </ul>
      </div>

      {allDesigns[side].uploadedImage && (
        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Logo Size</h3>
          <input
            type="range"
            min="50"
            max="300"
            value={allDesigns[side].imageSize}
            onChange={(e) =>
              updateCurrentDesign("imageSize", Number(e.target.value))
            }
            className="w-full"
          />
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-2">Custom Text</h3>
        <input
          type="text"
          value={allDesigns[side].customText}
          onChange={(e) => updateCurrentDesign("customText", e.target.value)}
          placeholder="Your slogan here"
          className="w-full px-3 py-2 border border-gray-400 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-700"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Text Size</h3>
          <input
            type="number"
            value={allDesigns[side].textSize}
            onChange={(e) =>
              updateCurrentDesign("textSize", Number(e.target.value))
            }
            className="w-full px-3 py-2 border border-gray-400 rounded-md text-sm"
          />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Text Color</h3>
          <input
            type="color"
            value={allDesigns[side].textColor}
            onChange={(e) => updateCurrentDesign("textColor", e.target.value)}
            className="w-10 h-10 rounded-full cursor-pointer"
          />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-2">Font Style</h3>
        <select
          onChange={(e) => updateCurrentDesign("font", e.target.value)}
          value={allDesigns[side].font}
          className="w-full px-3 py-2 border border-gray-400 rounded-md text-sm"
        >
          <option value="font-sans">Sans - Modern</option>
          <option value="font-serif">Serif - Classic</option>
          <option value="font-mono">Mono - Minimal</option>
        </select>
      </div>
    </div>
  );

  // ======================== RENDER DESIGN AREA ========================
  const renderDesignArea = (view) => {
    const design = allDesigns[view];
    const isActive = view === side;
    return (
      <div
        ref={designRefs[view]}
        className={`absolute top-0 left-0 w-full h-full transition-opacity duration-300 ${
          isActive
            ? "relative z-10 opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <img
          src={sideimage[getViewIndex(view)] || menstshirt}
          alt={`${view} T-shirt`}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none z-0"
        />
        <div className="relative w-full h-full z-10">
          {design.uploadedImage && (
            <DraggableItem
              id={`uploaded-image-${view}`}
              position={design.positions[`uploaded-image-${view}`]}
            >
              <img
                src={design.uploadedImage}
                alt="Uploaded"
                style={{
                  width: `${isMobile ? design.imageSize * 0.7 : design.imageSize}px`,
                  height: `${isMobile ? design.imageSize * 0.7 : design.imageSize}px`,
                }}
                className="object-contain touch-none"
              />
            </DraggableItem>
          )}
          {design.customText && (
            <DraggableItem
              id={`custom-text-${view}`}
              position={design.positions[`custom-text-${view}`]}
            >
              <p
                className={`select-none ${design.font} font-semibold touch-none`}
                style={{
                  fontSize: `${isMobile ? design.textSize * 0.8 : design.textSize}px`,
                  color: design.textColor,
                  whiteSpace: "nowrap",
                }}
              >
                {design.customText}
              </p>
            </DraggableItem>
          )}
        </div>
      </div>
    );
  };

  // ======================== JSX ========================
  return (
    <>
      {isSaving && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="text-white text-lg font-semibold bg-gray-800 px-6 py-3 rounded-lg shadow-lg">
            Saving your design...
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row p-0 lg:p-4 relative">
        {/* Sidebar (desktop only) */}
        <aside className="hidden lg:block w-80 bg-white rounded-2xl shadow-xl p-6 border border-gray-300">
          {renderControls()}
          <button
            onClick={saveSelectedViews}
            className="mt-6 py-3 px-6 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-lg w-full hidden lg:block"
          >
            Submit <MdNavigateNext size={20} className="ml-2 inline" />
          </button>
        </aside>

        <main className="flex-1 flex items-center justify-center mt-4 lg:mt-0 relative p-4">
          <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
            <div className="relative w-full max-w-2xl h-96 sm:h-[30rem] md:h-[38rem] rounded-3xl overflow-hidden mx-auto pt-20">
              {/* View Switcher */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                {views.map((view) => (
                  <button
                    key={view}
                    onClick={() => setSide(view)}
                    className={`px-3 py-1 text-sm sm:px-4 sm:py-2 sm:text-base font-medium transition-all ${
                      side === view
                        ? "bg-yellow-500 text-black"
                        : "bg-gray-800 text-white"
                    } rounded-md`}
                  >
                    {view.charAt(0).toUpperCase() + view.slice(1)}
                  </button>
                ))}
              </div>

              {views.map((view) => renderDesignArea(view))}
            </div>
          </DndContext>
        </main>
      </div>

      {/* Bottom Panel (mobile only) */}
      {isMobile && (
        <>
          {/* Active Panel */}
          {activeTab !== "none" && (
            <div className="fixed bottom-30 left-0 w-full bg-white border-t border-gray-300 shadow-lg z-40">
              <div className="p-4 space-y-4 max-h-[40vh] overflow-y-auto">
                {activeTab === "upload" && (
                  <>
                    <h3 className="text-sm font-semibold text-gray-800 mb-2">
                      Upload Logo
                    </h3>
                    <label className="flex flex-col items-center px-4 py-3 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 hover:bg-gray-100 cursor-pointer transition-all">
                      <span className="text-xs text-gray-600">Click to upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    {allDesigns[side].uploadedImage && (
                      <>
                        <h3 className="text-sm font-semibold text-gray-800 mb-2">Logo Size</h3>
                        <input
                          type="range"
                          min="50"
                          max="300"
                          value={allDesigns[side].imageSize}
                          onChange={(e) =>
                            updateCurrentDesign(
                              "imageSize",
                              Number(e.target.value)
                            )
                          }
                          className="w-full"
                        />
                      </>
                    )}
                  </>
                )}

                {activeTab === "additional" && (
                  <>
                    <h3 className="text-sm font-semibold text-gray-800 mb-2">Upload Additional Files</h3>
                    <label className="flex flex-col items-center px-4 py-3 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 hover:bg-gray-100 cursor-pointer transition-all">
                      <span className="text-xs text-gray-600">Click to select files</span>
                      <input
                        type="file"
                        multiple
                        onChange={handleAdditionalFilesUpload}
                        className="hidden"
                      />
                    </label>
                    <ul className="mt-2 max-h-24 overflow-auto text-xs text-gray-600">
                      {additionalFiles.map((fileObj, i) => (
                        <li key={i} className="truncate" title={fileObj.name}>
                          {fileObj.name}
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {activeTab === "text" && (
                  <>
                    <h3 className="text-sm font-semibold text-gray-800 mb-2">Custom Text</h3>
                    <input
                      type="text"
                      value={allDesigns[side].customText}
                      onChange={(e) =>
                        updateCurrentDesign("customText", e.target.value)
                      }
                      placeholder="Your slogan here"
                      className="w-full px-3 py-2 border border-gray-400 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-700"
                    />

                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-800 mb-2">Text Size</h3>
                        <input
                          type="number"
                          value={allDesigns[side].textSize}
                          onChange={(e) =>
                            updateCurrentDesign("textSize", Number(e.target.value))
                          }
                          className="w-full px-3 py-2 border border-gray-400 rounded-md text-sm"
                        />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-800 mb-2">Text Color</h3>
                        <input
                          type="color"
                          value={allDesigns[side].textColor}
                          onChange={(e) =>
                            updateCurrentDesign("textColor", e.target.value)
                          }
                          className="w-10 h-10 rounded-full cursor-pointer"
                        />
                      </div>
                    </div>
                  </>
                )}

                {activeTab === "font" && (
                  <>
                    <h3 className="text-sm font-semibold text-gray-800 mb-2">Font Style</h3>
                    <select
                      onChange={(e) => updateCurrentDesign("font", e.target.value)}
                      value={allDesigns[side].font}
                      className="w-full px-3 py-2 border border-gray-400 rounded-md text-sm"
                    >
                      <option value="font-sans">Sans - Modern</option>
                      <option value="font-serif">Serif - Classic</option>
                      <option value="font-mono">Mono - Minimal</option>
                    </select>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={saveSelectedViews}
            className="fixed bottom-0 left-0 w-full py-4 bg-green-600 text-white text-lg font-semibold rounded-none hover:bg-green-700 shadow-lg z-50 lg:static lg:w-auto lg:rounded-lg lg:mt-6 lg:px-6 lg:py-3"
          >
            Submit <MdNavigateNext size={22} className="ml-2 inline" />
          </button>
          {/* Tab Bar */}
          <div className="fixed bottom-14 left-0 w-full bg-gray-800 text-white flex justify-around py-2 z-50">
            <button
              onClick={() => setActiveTab("upload")}
              className="flex flex-col items-center"
            >
              <FaUpload size={20} />
              <span className="text-[10px]">Upload</span>
            </button>
            <button
              onClick={() => setActiveTab("text")}
              className="flex flex-col items-center"
            >
              <FaRegKeyboard size={20} />
              <span className="text-[10px]">Text</span>
            </button>
            <button
              onClick={() => setActiveTab("font")}
              className="flex flex-col items-center"
            >
              <FaFont size={20} />
              <span className="text-[10px]">Font</span>
            </button>
            <button
              onClick={() => setActiveTab("none")}
              className="flex flex-col items-center"
            >
              <FaTimes size={20} />
              <span className="text-[10px]">Close</span>
            </button>

            <button
              onClick={() => setActiveTab("additional")}
              className="flex flex-col items-center"
            >
              <FaUpload size={20} />
              <span className="text-[10px]">Files</span>
            </button>
          </div>
        </>
      )}
    </>
  );
};

export default TshirtDesigner;
