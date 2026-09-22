import axios from "axios";
import React, { useEffect, useState } from "react";

const Add_product = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [offer, setOffer] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [variants, setVariants] = useState([{ size: "", color: "", sku: "" }]);
  const [error, setError] = useState("");

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/products/allCategory`, { withCredentials: true })
      .then((response) => setCategories(response.data.data || []))
      .catch(() => setError("Unable to load categories"));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("price", price);
    formData.append("discountPrice", discountPrice);
    formData.append("offer", offer);
    formData.append("category", category);
    const selectedVariants = variants.filter((variant) => variant.size.trim() || variant.color.trim());
    formData.append("variants", JSON.stringify(selectedVariants));
    images.forEach((file) => formData.append("images", file));

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/mainproduct/all-main-product`,
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Success:", res.data);
      setTitle("");
      setDescription("");
      setPrice("");
      setDiscountPrice("");
      setOffer("");
      setCategory("");
      setImages([]);
      setVariants([{ size: "", color: "", sku: "" }]);
      setError("");

    } catch (error) {
      setError(error.response?.data?.message || "Unable to add product");
    }
  };
  return (
    <>
    <div className="flex min-h-screen items-center justify-center bg-[#062B63]/95 p-6">
      <div className="w-full max-w-xl bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-8">

        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          Add Product
        </h2>
        {error && <p className="mb-4 text-center text-red-200">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label className="block text-gray-300 mb-2">
              Product Name
            </label>
            <input
              type="text"
              placeholder="Enter product title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 rounded-lg bg-white/20 text-white outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-2">
             Description
            </label>
            <textarea
              placeholder="Enter product description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="4"
              className="w-full p-3 rounded-lg bg-white/20 text-white outline-none"
              required
            />
          </div>

          <div >
            <label className="block text-gray-300 mb-2">
              Price
            </label>
            <input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full p-3 rounded-lg bg-white/20 text-white outline-none" required />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Offer price</label>
            <input type="number" min="0" max={price || undefined} value={discountPrice} onChange={(e) => setDiscountPrice(e.target.value)} className="w-full p-3 rounded-lg bg-white/20 text-white outline-none" placeholder="Optional sale price" />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Offer label</label>
            <input type="text" value={offer} onChange={(e) => setOffer(e.target.value)} className="w-full p-3 rounded-lg bg-white/20 text-white outline-none" placeholder="Example: Eid special offer" />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 rounded-lg bg-white/20 text-white outline-none"
              required
            >
              <option value="" className="text-gray-900">Select a category</option>
              {categories.map((item) => (
                <option key={item._id} value={item._id} className="text-gray-900">
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Sizes and colors</label>
            <div className="space-y-2">
              {variants.map((variant, index) => (
                <div key={index} className="grid grid-cols-2 gap-2">
                  <input value={variant.size} onChange={(event) => setVariants((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, size: event.target.value } : item))} placeholder="Size" className="rounded-lg bg-white/20 p-2 text-white" />
                  <input value={variant.color} onChange={(event) => setVariants((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, color: event.target.value } : item))} placeholder="Color" className="rounded-lg bg-white/20 p-2 text-white" />
                  <input value={variant.sku} onChange={(event) => setVariants((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, sku: event.target.value } : item))} placeholder="SKU" className="rounded-lg bg-white/20 p-2 text-white" />
                  <button type="button" onClick={() => setVariants((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="rounded-lg bg-red-500 px-3 text-white" disabled={variants.length === 1}>Remove</button>
                </div>
              ))}
              <button type="button" onClick={() => setVariants((current) => [...current, { size: "", color: "", sku: "" }])} className="rounded-lg bg-blue-500 px-4 py-2 text-white">Add option</button>
            </div>
          </div>

          <div>
            <label className="block text-gray-300 mb-2">
              Upload Images
            </label>
            <input
              type="file"
              multiple
              onChange={(e) => setImages(Array.from(e.target.files || []))}
              className="w-full p-2 rounded-lg bg-white/20 text-white file:bg-green-500 file:border-none file:px-4 file:py-2 file:rounded-md cursor-pointer"
              required
            />
          </div>

          {images.length > 0 && (
            <div>
              <p className="text-gray-300 mb-2">Preview:</p>
              <img
                src={URL.createObjectURL(images[0])}
                alt="preview"
                className="w-full h-40 object-cover rounded-lg"
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition cursor-pointer"
          >
            Add Product
          </button>

        </form>
      </div>
    </div>
    </>
  )
}

export default Add_product