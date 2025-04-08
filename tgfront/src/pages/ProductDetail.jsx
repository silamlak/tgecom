import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import { API_URL } from "../api";

// const API_URL = "http://localhost:3000/api/admin";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // State for editable product data
  const [editedProduct, setEditedProduct] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch product data using useQuery
  const {
    data: product,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/product/${id}`);
      return data;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Sync editedProduct with fetched product data
  useEffect(() => {
    if (product && !editedProduct) {
      setEditedProduct(product);
    }
  }, [product, editedProduct]);

  // Mutation for updating product
  const updateMutation = useMutation({
    mutationFn: async (updatedProduct) => {
      await axios.post(`${API_URL}/product/update/${id}`, updatedProduct);
    },
    onSuccess: () => {
      alert("Product updated successfully!");
      setHasChanges(false);
    },
    onError: (err) => {
      console.error("Update error:", err);
      // Do not return a value here; handle error in UI via mutation state
    },
  });

  // Mutation for deleting product
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await axios.delete(`${API_URL}/product/${id}`);
    },
    onSuccess: () => {
      alert("Product deleted successfully!");
      navigate("/products");
    },
    onError: (err) => {
      console.error("Delete error:", err);
      // Do not return a value here; handle error in UI via mutation state
    },
  });

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedProduct((prev) => ({ ...prev, [name]: value }));
  };

  // Check for changes
  useEffect(() => {
    if (!product || !editedProduct) return;
    const isDifferent =
      JSON.stringify(product) !== JSON.stringify(editedProduct);
    setHasChanges(isDifferent);
  }, [product, editedProduct]);

  // Loading state
  if (isLoading || !editedProduct) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-red-100 p-4 rounded-lg text-red-700">
          {error.message || "Product not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="md:flex">
          {/* Product Images (Array) */}
          <div className="md:w-1/2 p-4">
            {editedProduct.imageUrl && editedProduct.imageUrl.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {editedProduct.imageUrl.map((url, index) => (
                  <img
                    key={index}
                    src={url || "https://via.placeholder.com/300"}
                    alt={`${editedProduct.name} ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                ))}
              </div>
            ) : (
              <img
                src="https://via.placeholder.com/300"
                alt="No image available"
                className="w-full h-96 object-cover rounded-lg"
              />
            )}
          </div>

          {/* Product Details */}
          <div className="p-8 md:w-1/2">
            <input
              type="text"
              name="name"
              value={editedProduct.name || ""}
              onChange={handleInputChange}
              className="w-full text-3xl font-bold text-gray-900 mb-4 border-b border-gray-300 focus:outline-none focus:border-indigo-500"
            />
            <input
              type="number"
              name="price"
              value={editedProduct.price || ""}
              onChange={handleInputChange}
              className="w-full text-2xl text-gray-700 mb-6 border-b border-gray-300 focus:outline-none focus:border-indigo-500"
              step="0.01"
            />
            <textarea
              name="description"
              value={editedProduct.description || ""}
              onChange={handleInputChange}
              className="w-full text-gray-600 mb-6 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows="4"
            />

            {/* Error Messages */}
            {(updateMutation.isError || deleteMutation.isError) && (
              <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
                {updateMutation.isError
                  ? updateMutation.error.message || "Failed to update product"
                  : deleteMutation.error.message || "Failed to delete product"}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate(-1)}
                className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors duration-200 font-semibold"
              >
                Back to Products
              </button>

              {hasChanges && (
                <button
                  onClick={() => updateMutation.mutate(editedProduct)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 font-semibold"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? "Updating..." : "Update Product"}
                </button>
              )}

              <button
                onClick={() => deleteMutation.mutate()}
                className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200 font-semibold"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete Product"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
