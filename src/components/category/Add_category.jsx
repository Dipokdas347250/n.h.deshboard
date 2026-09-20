import axios from "axios";
import React, { useState } from "react";

const AddCategory = () => {
  const [name, setName] = useState("");
  const [discount, setDiscount] = useState("");
  const [image, setImage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", name); 
    formData.append("discount", discount);
    formData.append("image", image);

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/products/allproducts`,
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Success:", res.data);
      setName("");
      setDiscount("");
      setImage(null);

    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#064e3b]/90 flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-8">

        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          Add Category
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label className="block text-gray-300 mb-2">
              Category Name
            </label>
            <input
              type="text"
              placeholder="Enter category name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 rounded-lg bg-white/20 text-white outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-2">
             discount
            </label>
            <input
              type="text"
              placeholder="Enter discount"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="w-full p-3 rounded-lg bg-white/20 text-white outline-none"
              required
            />
          </div>

          <div >
            <label className="block text-gray-300 mb-2">
              Upload Image
            </label>
            <input
              type="file"
              onChange={(e) => setImage(e.target.files[0])}
              className="w-full p-2 rounded-lg bg-white/20 text-white file:bg-green-500 file:border-none file:px-4 file:py-2 file:rounded-md cursor-pointer"
              required
            />
          </div>

          {image && (
            <div>
              <p className="text-gray-300 mb-2">Preview:</p>
              <img
                src={URL.createObjectURL(image)}
                alt="preview"
                className="w-full h-40 object-cover rounded-lg"
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition cursor-pointer"
          >
            Add Category
          </button>

        </form>
      </div>
    </div>
  );
};

export default AddCategory;