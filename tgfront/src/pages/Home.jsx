import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import Navbar from "../component/Navbar";
import { API_URL } from "../api";

// const API_URL = "http://localhost:3000/api";

const Home = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = React.useState("all");
  const [selectedProduct, setSelectedProduct] = React.useState(null);

  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/categories`);
      return data;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Fetch all products initially
  const { data: allProducts = [], isLoading: productsLoading } = useQuery({
    queryKey: ["products", "all"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/products/all`);
      return data;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Fetch products by category (refetch only when category changes)
  const { data: filteredProducts = allProducts, refetch: refetchProducts } =
    useQuery({
      queryKey: ["products", selectedCategory],
      queryFn: async () => {
        if (selectedCategory === "all") return allProducts;
        const { data } = await axios.get(
          `${API_URL}/products/${selectedCategory}`
        );
        return data;
      },
      enabled: !!allProducts.length, // Only run after allProducts is loaded
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });

  // Mutation for purchasing a product
  const purchaseMutation = useMutation({
    mutationFn: async (product) => {
      const userId = "web_user_" + Math.random().toString(36).substr(2, 9);
      await axios.post(`${API_URL}/orders`, {
        userId,
        productId: product._id,
        productName: product.name,
        price: product.price,
      });
    },
    onSuccess: (_, product) => {
      alert(`Purchased ${product.name} for $${product.price}!`);
    },
    onError: () => "Failed to process purchase. Please try again.",
  });

  // Handle category selection
  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId || "all");
    setSelectedProduct(null);
    refetchProducts();
  };

  // Handle product selection
  const handleProductSelect = (id) => {
    // setSelectedProduct(product);
    navigate(`/product/${id}`);
  };

  if (categoriesLoading || productsLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">

      <main className="container mx-auto px-4 py-8">
        {/* Error Display */}
        {purchaseMutation.isError && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg text-center">
            {purchaseMutation.error}
          </div>
        )}

        {!selectedProduct && (
          <div className="mb-8">
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => handleCategoryChange("all")}
                className={`px-6 py-2 rounded-full font-semibold transition-all duration-200 ${
                  selectedCategory === "all"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-gray-200 text-gray-700 hover:bg-indigo-500 hover:text-white"
                }`}
              >
                All Products
              </button>
              {categories?.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => handleCategoryChange(cat._id)}
                  className={`px-6 py-2 rounded-full font-semibold transition-all duration-200 ${
                    selectedCategory === cat._id
                      ? "bg-indigo-600 text-white shadow-md"
                      : "bg-gray-200 text-gray-700 hover:bg-indigo-500 hover:text-white"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {!selectedProduct && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((prod) => (
              <div
                key={prod._id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
              >
                <img
                  src={
                    prod.imageUrl[0] ||
                    prod.imageUrl[0] ||
                   "https://via.placeholder.com/150"
                  }
                  alt={prod.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-800 truncate">
                    {prod.name}
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">ETB {prod.price}</p>
                  <button
                    onClick={() => handleProductSelect(prod._id)}
                    className="mt-4 w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition-colors duration-200"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-6">
        <div className="container mx-auto px-4 text-center">
          <p>© {new Date().getFullYear()} ShopSphere. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
