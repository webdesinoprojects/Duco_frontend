// FULL MULTI-VIEW DESIGNER — Responsive for mobile
import React, { useEffect, useState, useRef, useCallback } from "react";
import { toPng } from "html-to-image";
import {
  DndContext,
  useDraggable,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
} from "@dnd-kit/core";
import { MdNavigateNext, MdMenu, MdClose } from "react-icons/md";
import menstshirt from "../assets/men_s_white_polo_shirt_mockup-removebg-preview.png";
import axios from "axios";
import { createDesign, getproductssingle } from "../Service/APIservice";
import { useParams, useNavigate } from "react-router-dom";

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
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [side, setSide] = useState("front");
  const [sideimage, setSideimage] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
  const colorWithHash = `#${color}`;

  const getViewIndex = (s) =>
    ({ front: 0, back: 1, left: 2, right: 3 }[s] ?? 0);

  // ======================== EFFECTS ========================
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile && sidebarOpen) setSidebarOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [sidebarOpen]);

  useEffect(() => {
    const getdata = async () => {
      try {
        const data = await getproductssingle(proid);
        const match = data?.image_url?.find(
          (e) => e.colorcode === colorWithHash
        );
        setSideimage(match?.designtshirt || []);
      } catch (e) {
        console.error("Failed to fetch product images", e);
      }
    };
    getdata();
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

  const viewHasContent = (view) => {
    const d = allDesigns[view];
    return !!(d?.uploadedImage || (d?.customText && d.customText.trim() !== ""));
  };

  const uploadToImageKit = async (base64DataUrl, view, isUploadedLogo = false) => {
    if (!base64DataUrl?.startsWith("data:image"))
      throw new Error("Invalid image data");

    const fileName = `${isUploadedLogo ? "logo" : "tshirt"}_${view}_${Date.now()}.png`;
    const authRes = await axios.get(
      "https://duco-backend.onrender.com/api/imagekit/auth"
    );
    const { signature, expire, token } = authRes.data;

    const formData = new FormData();
    formData.append("file", base64DataUrl);
    formData.append("fileName", fileName);
    formData.append("token", token);
    formData.append("expire", String(expire));
    formData.append("signature", signature);
    formData.append("useUniqueFileName", "true");
    formData.append("folder", "/tshirt-designs");
    formData.append("publicKey", "public_pxbUbZQmz2LGTkhrvGgUMelJZbg=");

    const res = await axios.post(
      "https://upload.imagekit.io/api/v1/files/upload",
      formData,
      {
        onUploadProgress: (e) => {
          const percent = Math.round((e.loaded * 100) / e.total);
          setUploadProgress((prev) => ({ ...prev, [view]: percent }));
        },
      }
    );

    return res.data?.url;
  };

  const captureSelectedViews = async () => {
    setIsSaving(true);
    setUploadProgress({});
    const result = [];

    for (const view of views) {
      if (!viewHasContent(view)) continue;

      const ref = designRefs[view]?.current;
      if (!ref) continue;

      await new Promise((r) => setTimeout(r, 120));
      const dataUrl = await toPng(ref, { cacheBust: true, pixelRatio: 2 });
      if (!dataUrl?.startsWith("data:image")) continue;

      const url = await uploadToImageKit(dataUrl, view);
      const logoBase64 = allDesigns[view]?.uploadedImage || null;
      const logoImageUrl = logoBase64
        ? await uploadToImageKit(logoBase64, view, true)
        : null;

      result.push({ view, url, uploadedImage: logoImageUrl });
    }

    setIsSaving(false);
    return result;
  };

  const saveSelectedViews = async () => {
    try {
      const designArrayRaw = await captureSelectedViews();
      if (designArrayRaw.length === 0) return;

      const designArrayWithDetails = designArrayRaw.map((item) => {
        const d = allDesigns[item.view];
        return {
          ...item,
          positions: d?.positions || {},
          if_text: {
            customText: d?.customText || "",
            textSize: d?.textSize || 0,
            textColor: d?.textColor || "#000000",
            font: d?.font || "font-sans",
          },
        };
      });

      const stored = localStorage.getItem("user");
      const user = stored ? JSON.parse(stored) : null;

      const payload = {
        ...(user && { user: user._id }),
        products: proid,
        design: designArrayWithDetails,
      };

      const result = await createDesign(payload);
      if (result) navigate(-1);
    } catch (err) {
      console.error("Failed to save designs:", err);
      setIsSaving(false);
    }
  };

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
                  width: `${
                    isMobile ? design.imageSize * 0.7 : design.imageSize
                  }px`,
                  height: `${
                    isMobile ? design.imageSize * 0.7 : design.imageSize
                  }px`,
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
                  fontSize: `${
                    isMobile ? design.textSize * 0.8 : design.textSize
                  }px`,
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

      {/* Mobile Header */}
      {isMobile && (
        <div className="lg:hidden flex items-center justify-between p-4 bg-white shadow-md">
          <h1 className="text-xl font-bold">T-Shirt Designer</h1>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg bg-gray-100"
          >
            {sidebarOpen ? <MdClose size={24} /> : <MdMenu size={24} />}
          </button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row p-0 lg:p-4 relative">
        {/* Sidebar */}
        <aside
          className={`w-full lg:w-80 bg-white rounded-2xl shadow-xl p-6 border border-gray-300
            lg:static fixed top-0 left-0 h-full z-40 overflow-y-auto transition-transform duration-300
            ${
              isMobile
                ? sidebarOpen
                  ? "translate-x-0"
                  : "-translate-x-full"
                : ""
            }`}
        >
          {/* Close for mobile */}
          {isMobile && (
            <div className="flex justify-end mb-4 lg:hidden">
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-full bg-gray-100"
              >
                <MdClose size={20} />
              </button>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-2">
                Upload Logo
              </h3>
              <label className="flex flex-col items-center px-4 py-3 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 hover:bg-gray-100 cursor-pointer transition-all">
                <svg
                  className="w-6 h-6 text-gray-500 mb-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-xs text-gray-600">Click to upload</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            {allDesigns[side].uploadedImage && (
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-2">
                  Logo Size
                </h3>
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
                <span className="text-xs text-gray-600">
                  {allDesigns[side].imageSize}px
                </span>
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-2">
                Custom Text
              </h3>
              <input
                type="text"
                value={allDesigns[side].customText}
                onChange={(e) =>
                  updateCurrentDesign("customText", e.target.value)
                }
                placeholder="Your slogan here"
                className="w-full px-3 py-2 border border-gray-400 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-2">
                  Text Size
                </h3>
                <input
                  type="number"
                  value={allDesigns[side].textSize}
                  onChange={(e) =>
                    updateCurrentDesign("textSize", Number(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-gray-400 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-700"
                />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-2">
                  Text Color
                </h3>
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

            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-2">
                Font Style
              </h3>
              <select
                onChange={(e) => updateCurrentDesign("font", e.target.value)}
                value={allDesigns[side].font}
                className="w-full px-3 py-2 border border-gray-400 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-700"
              >
                <option value="font-sans">Sans - Modern</option>
                <option value="font-serif">Serif - Classic</option>
                <option value="font-mono">Mono - Minimal</option>
              </select>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                {views.map((view) => (
                  <button
                    key={view}
                    onClick={() => {
                      setSide(view);
                      if (isMobile) setSidebarOpen(false);
                    }}
                    className={`px-3 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm font-medium transition-all ${
                      side === view
                        ? "bg-yellow-500 text-black"
                        : "bg-gray-800 text-white"
                    } rounded-md`}
                  >
                    {view.charAt(0).toUpperCase() + view.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {isMobile && sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="flex-1 flex items-center justify-center mt-4 lg:mt-0 relative p-4">
          <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
            <div className="relative w-full max-w-2xl h-96 sm:h-[30rem] md:h-[38rem] rounded-3xl overflow-hidden mx-auto">
              {views.map((view) => renderDesignArea(view))}
            </div>
          </DndContext>

          <button
            onClick={saveSelectedViews}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-sm
              py-3 px-6 flex items-center justify-center
              bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-lg z-10
              md:w-auto md:bottom-6 md:right-6 md:left-auto md:translate-x-0
              lg:absolute lg:bottom-[100px] lg:right-7"
          >
            Submit <MdNavigateNext size={20} className="ml-2" />
          </button>
        </main>
      </div>
    </>
  );
};

export default TshirtDesigner;
