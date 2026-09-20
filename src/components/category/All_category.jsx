import axios from "axios";
import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";
const All_category = () => {
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
   axios.get(`${import.meta.env.VITE_API_URL}/products/allCategory`, { withCredentials: true })
      .then((response) => {
        setCategories(response.data.data);
        
      })
      .catch((error) => {
        console.error("Error fetching categories:", error);
      });
  }, []);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/products/delete-category/${id}`);
      setCategories((current) => current.filter((item) => item._id !== id));
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to delete category");
    }
  };
  return (
    <>
    <div className="min-h-screen bg-[#064e3b]/90 p-6">
      <h2 className="text-2xl font-bold text-white mb-6">
        All Categories
      </h2>
      {error && <p className="mb-4 text-red-200">{error}</p>}

      <div className="grid md:grid-cols-3 gap-6">

        {categories.map((category) => (
          <div
            key={category._id}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-4 shadow-lg hover:scale-105 transition"
          >
            {/* Image */}
            <img
              src={category.image}
              alt="category"
              className="w-full h-40 object-cover rounded-lg"
            />

            {/* Info */}
            <div className="mt-3 space-y-1 flex items-center gap-2">
              <h3>category :</h3>
              <p className="text-gray-300 text-sm truncate">
                {category.name}
              </p>
              
            </div>
            <div className="mt-3 space-y-1 flex items-center gap-2">
              <h3>slug :</h3>
              <p className="text-gray-300 text-sm truncate">
                {category.slug}
              </p>
              
            </div>
            <div className="mt-3 space-y-1 flex items-center gap-2">
              <h3>discount :</h3>
              <p className="text-gray-300 text-sm truncate">
                ${category.discount}
              </p>
              
              
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => window.open(category.image, "_blank")}
                className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm"
              >
                Visit
              </button>

              <button
                onClick={() => handleDelete(category._id)}
                className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}

      </div>
    </div>
    </>
  )
}

export default All_category