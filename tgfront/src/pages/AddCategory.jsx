import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { API_URL } from "../api";

// const API_URL = "http://localhost:3000/api";

const AddCategory = () => {
  const [name, setName] = useState("");
  const [detail, setDetail] = useState("");
  const queryClient = useQueryClient();

  // Add category mutation
  const addCategoryMutation = useMutation({
    mutationFn: async (categoryData) => {
      const response = await axios.post(
        `${API_URL}/category`,
        categoryData
      );
      return response.data;
    },
    onSuccess: () => {
      // Reset form on success
      setName("");
      setDetail("");
      // Invalidate categories query to refresh any category lists
      queryClient.invalidateQueries(["categories"]);
    },
    onError: (error) => {
      console.error("Error adding category:", error);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name) {
      alert("Category name is required");
      return;
    }

    const categoryData = {
      name,
      detail,
    };

    addCategoryMutation.mutate(categoryData);
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow-lg rounded-xl mt-10">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Add New Category
      </h2>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Category Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            required
            disabled={addCategoryMutation.isPending}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Detail
          </label>
          <textarea
            placeholder="Category Details"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            rows={4}
            disabled={addCategoryMutation.isPending}
          />
        </div>

        {/* Submission Status */}
        {addCategoryMutation.isError && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            Error adding category: {addCategoryMutation.error.message}
          </div>
        )}
        {addCategoryMutation.isSuccess && (
          <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm">
            Category added successfully!
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-all disabled:bg-blue-400 disabled:cursor-not-allowed"
          disabled={addCategoryMutation.isPending}
        >
          {addCategoryMutation.isPending
            ? "Adding Category..."
            : "Add Category"}
        </button>
      </form>
    </div>
  );
};

export default AddCategory;
