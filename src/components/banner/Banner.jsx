import axios from "axios";
import React, { useState } from "react";

const AddBanner = () => {
  const [image, setImage] = useState(null);
  const [url, setUrl] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("image", image);
    formData.append("url", url);

    console.log("Submitting:", image, url);

    
    await axios.post(`${import.meta.env.VITE_API_URL}/banner/add-banner`, formData, {
      withCredentials: true,
      headers: { "Content-Type": "multipart/form-data" },
    });
    setImage(null);
    setUrl("");
   

  };

  return (
    <div className="min-h-screen bg-[#064e3b]/90  flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-8">

       
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          Add New Banner
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className=" ">
            <label className="block text-gray-300 mb-2">Upload Image</label>
            <input
              type="file"
              onChange={(e) => setImage(e.target.files[0])}
              className="w-full p-2 rounded-lg bg-white/20 text-white file:bg-green-500 file:border-none file:px-4 file:py-2 file:rounded-md cursor-pointer"
              required
            />
          </div>

          {/* URL */}
          <div>
            <label className="block text-gray-300 mb-2">Redirect URL</label>
            <input
              type="text"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full p-3 rounded-lg bg-white/20 text-white outline-none"
            />
          </div>

          {/* Preview */}
          {image && (
            <div className="mt-4">
              <p className="text-gray-300 mb-2">Preview:</p>
              <img
                src={URL.createObjectURL(image)}
                alt="preview"
                className="w-full h-40 object-cover rounded-lg"
              />
            </div>
          )}

          {/* Button */}
          <button
            type="submit"
            className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition cursor-pointer"
          >
            Upload Banner
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddBanner;