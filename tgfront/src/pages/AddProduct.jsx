import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import MDEditor from "@uiw/react-md-editor";
import { API_URL } from "../api";

// const API_URL = "http://localhost:3000/api";

const AddProduct = () => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);
  const queryClient = useQueryClient();

  // Fetch categories using useQuery
  const {
    data: categories = [],
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/categories`);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes stale time
  });

  // Add product mutation
  const addProductMutation = useMutation({
    mutationFn: async (formData) => {
      const response = await axios.post(`${API_URL}/products`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    },
    onSuccess: () => {
      // Reset form on success
      setName("");
      setPrice("");
      setCategory("");
      setDescription("");
      setFiles([]);
      // Invalidate products query to refresh any product lists
      queryClient.invalidateQueries(["products"]);
    },
    onError: (error) => {
      console.error("Error adding product:", error);
    },
  });

  const handleFileChange = (e) => {
    setFiles([...e.target.files]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name || !price || !category) {
      alert("Please fill all required fields");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("price", price);
    formData.append("category", category);
    formData.append("description", description);
    files.forEach((file) => formData.append("images", file));

    addProductMutation.mutate(formData);
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow-lg rounded-xl mt-10">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Product</h2>

      {/* Loading State */}
      {categoriesLoading && (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Error State */}
      {categoriesError && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          Failed to load categories: {categoriesError.message}
        </div>
      )}

      {/* Form */}
      {!categoriesLoading && !categoriesError && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Product Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              required
              disabled={addProductMutation.isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <MDEditor
              value={description}
              onChange={(value) => setDescription(value || "")}
              className="mt-1"
              preview="edit"
              height={200}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              placeholder="Price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              required
              min="0"
              step="0.01"
              disabled={addProductMutation.isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              required
              disabled={addProductMutation.isLoading}
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Images
            </label>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="mt-1 block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
              disabled={addProductMutation.isLoading}
            />
            {files.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                Selected: {files.map((file) => file.name).join(", ")}
              </div>
            )}
          </div>

          {/* Submission Status */}
          {addProductMutation.isError && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              Error adding product: {addProductMutation.error.message}
            </div>
          )}
          {addProductMutation.isSuccess && (
            <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm">
              Product added successfully!
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-all disabled:bg-blue-400 disabled:cursor-not-allowed"
            disabled={addProductMutation.isPending}
          >
            {addProductMutation.isPending ? "Adding Product..." : "Add Product"}
          </button>
        </form>
      )}
    </div>
  );
};

export default AddProduct;
