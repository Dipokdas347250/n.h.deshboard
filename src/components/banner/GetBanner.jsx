import axios from "axios";
import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";

const GetBanner = () => {
  const [banners, setBanners] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
   axios.get(`${import.meta.env.VITE_API_URL}/banner/all-banner`, { withCredentials: true })
      .then((response) => {
        setBanners(response.data.data);
        
      })
      .catch((error) => {
        console.error("Error fetching banners:", error);
      });
  }, []);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/banner/delete-banner/${id}`);
      setBanners((current) => current.filter((item) => item._id !== id));
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to delete banner");
    }
  };

  return (
    <div className="min-h-screen bg-[#064e3b]/90 p-6">
      <h2 className="text-2xl font-bold text-white mb-6">
        All Banners
      </h2>
      {error && <p className="mb-4 text-red-200">{error}</p>}

      <div className="grid md:grid-cols-3 gap-6">

        {banners.map((banner) => (
          <div
            key={banner._id}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-4 shadow-lg hover:scale-105 transition"
          >
            {/* Image */}
            <img
              src={banner.image}
              alt="banner"
              className="w-full h-40 object-cover rounded-lg"
            />

            {/* Info */}
            <div className="mt-3 space-y-1">
              <p className="text-gray-300 text-sm truncate">
                {banner.url}
              </p>
              
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => window.open(banner.url)}
                className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm"
              >
                Visit
              </button>

              <button
                onClick={() => handleDelete(banner._id)}
                className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}

      </div>
    </div>
  );
};

export default GetBanner;