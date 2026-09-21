import axios from "axios";
import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";
const All_category = () => {
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", discount: "", image: null });

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

  const startEdit = (category) => {
    setError("");
    setEditing(category._id);
    setForm({ name: category.name || "", discount: category.discount || 0, image: null });
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    const data = new FormData();
    data.append("name", form.name);
    data.append("discount", form.discount);
    if (form.image) data.append("image", form.image);
    try {
      const response = await api.patch(`/products/update-category/${editing}`, data);
      setCategories((current) => current.map((item) => item._id === editing ? response.data.data : item));
      setEditing(null);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update category");
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

            {editing === category._id ? <form onSubmit={saveEdit} className="mt-3 space-y-2">
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full rounded bg-white/20 p-2 text-white" placeholder="Category name" required />
              <input type="number" min="0" value={form.discount} onChange={(event) => setForm({ ...form, discount: event.target.value })} className="w-full rounded bg-white/20 p-2 text-white" placeholder="Discount" required />
              <input type="file" onChange={(event) => setForm({ ...form, image: event.target.files?.[0] || null })} className="w-full text-sm text-white" />
              <div className="flex gap-2"><button type="submit" className="flex-1 rounded bg-green-500 py-2 text-white">Save</button><button type="button" onClick={() => setEditing(null)} className="flex-1 rounded bg-white/20 py-2 text-white">Cancel</button></div>
            </form> : <>
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
              <button onClick={() => startEdit(category)} className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm">Edit</button>
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
            </>}
          </div>
        ))}

      </div>
    </div>
    </>
  )
}

export default All_category