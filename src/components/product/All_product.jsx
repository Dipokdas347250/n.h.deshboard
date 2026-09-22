import axios from "axios";
import React, { useEffect, useState } from "react";
const All_product = () => {
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: "", description: "", price: "", discountPrice: "", offer: "", sku: "", images: [] });
  const [error, setError] = useState("");

  useEffect(() => {
  axios.get(`${import.meta.env.VITE_API_URL}/mainproduct/all-product`, { withCredentials: true })
      .then((response) => {
        setCategories(response.data.data);
        
      })
      .catch((error) => {
        console.error("Error fetching categories:", error);
      });
  }, []);

  const handleDelete = (id) => {
    axios.delete(`${import.meta.env.VITE_API_URL}/mainproduct/delete-product/${id}`, { withCredentials: true })
      .then(() => setCategories((current) => current.filter((item) => item._id !== id)))
      .catch((error) => console.error("Unable to delete product", error));
  };

  const startEdit = (product) => {
    setError("");
    setEditing(product._id);
    setForm({ title: product.title || "", description: product.description || "", price: product.price || "", discountPrice: product.discountPrice ?? product.diccountprice ?? "", offer: product.offer || "", sku: product.sku || "", images: [] });
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    const data = new FormData();
    data.append("title", form.title);
    data.append("description", form.description);
    data.append("price", form.price);
    data.append("discountPrice", form.discountPrice);
    data.append("offer", form.offer);
    data.append("sku", form.sku);
    form.images.forEach((image) => data.append("images", image));
    try {
      const response = await axios.patch(`${import.meta.env.VITE_API_URL}/mainproduct/update-product/${editing}`, data, { withCredentials: true });
      setCategories((current) => current.map((item) => item._id === editing ? response.data.data : item));
      setEditing(null);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update product");
    }
  };
  return (
    <>
    <div className="min-h-screen bg-[#062B63]/95 p-6">
      <h2 className="text-2xl font-bold text-white mb-6">
        All product
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
              src={category.image?.[0] || category.image}
              alt={category.title}
              className="w-full h-40 object-cover rounded-lg"
            />

            {editing === category._id ? <form onSubmit={saveEdit} className="mt-3 space-y-2">
              <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="w-full rounded bg-white/20 p-2 text-white" placeholder="Title" required />
              <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="w-full rounded bg-white/20 p-2 text-white" placeholder="Description" required />
              <input type="number" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} className="w-full rounded bg-white/20 p-2 text-white" placeholder="Price" required />
              <input type="number" min="0" max={form.price || undefined} value={form.discountPrice} onChange={(event) => setForm({ ...form, discountPrice: event.target.value })} className="w-full rounded bg-white/20 p-2 text-white" placeholder="Offer price (optional)" />
              <input value={form.offer} onChange={(event) => setForm({ ...form, offer: event.target.value })} className="w-full rounded bg-white/20 p-2 text-white" placeholder="Offer label (optional)" />
              <input value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} className="w-full rounded bg-white/20 p-2 text-white" placeholder="SKU" />
              <input type="file" multiple onChange={(event) => setForm({ ...form, images: Array.from(event.target.files || []) })} className="w-full text-sm text-white" />
              <div className="flex gap-2"><button type="submit" className="flex-1 rounded bg-green-500 py-2 text-white">Save</button><button type="button" onClick={() => setEditing(null)} className="flex-1 rounded bg-white/20 py-2 text-white">Cancel</button></div>
            </form> : <>
            {/* Info */}
            <div className="mt-3 space-y-1 flex items-center gap-2">
              <h3>title :</h3>
              <p className="text-gray-300 text-sm truncate">
                {category.title}
              </p>
              
            </div>
            <div className="mt-3 space-y-1 flex items-center gap-2">
              <h3>SKU :</h3>
              <p className="text-gray-300 text-sm truncate">
                {category.sku || category.slug}
              </p>
              
            </div>
            <div className="mt-3 space-y-1 flex items-center gap-2">
              <h3>price :</h3>
              <p className="text-gray-300 text-sm truncate">
                BDT {category.price || 0}
              </p>
            </div>
            <div className="mt-3 space-y-1 flex items-center gap-2">
              <h3>offer :</h3>
              <p className="text-gray-300 text-sm truncate">
                {category.discountPrice ?? category.diccountprice ?? "—"} {category.offer ? `(${category.offer})` : ""}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4">
              <button onClick={() => startEdit(category)} className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm">Edit</button>
              <button
                onClick={() => window.open(category.image?.[0] || category.image, "_blank")}
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

export default All_product