import axios from "axios";
import React, { useState } from "react";

const Add_product = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [images, setImages] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("price", price);
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
      setImages([]);

    } catch (error) {
      console.error("Error:", error);
    }
  };
  return (
    <>
     <div className="min-h-screen bg-[#064e3b]/90 flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-8">

        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          Add Product
        </h2>

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
            <input
              type="text"
              placeholder="Enter product description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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