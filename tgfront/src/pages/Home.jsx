// src/components/Home.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "http://localhost:3000/api"; // Adjust if deployed

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`${API_URL}/categories`);
        setCategories(data);
        setError(null);
      } catch (err) {
        setError("Failed to load categories. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Fetch products when a category is selected
  const fetchProducts = async (categoryId) => {
    setLoading(true);
    setSelectedCategory(categoryId);
    setSelectedProduct(null); // Reset product view
    try {
      const { data } = await axios.get(`${API_URL}/products/${categoryId}`);
      setProducts(data);
      setError(null);
    } catch (err) {
      setError("Failed to load products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch product details when a product is selected
  const fetchProduct = async (productId) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/product/${productId}`);
      setSelectedProduct(data);
      setError(null);
    } catch (err) {
      setError("Failed to load product details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle purchase (dummy user ID for web)
  const handlePurchase = async (product) => {
    const userId = "web_user_" + Math.random().toString(36).substr(2, 9);
    try {
      await axios.post(`${API_URL}/orders`, {
        userId,
        productId: product._id,
        productName: product.name,
        price: product.price,
      });
      alert(`Purchased ${product.name} for $${product.price}!`);
    } catch (err) {
      setError("Failed to process purchase. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
        Shop
      </h1>

      {loading && (
        <div className="text-center text-lg text-gray-600">Loading...</div>
      )}
      {error && (
        <div className="text-center text-red-500 text-base mb-4">{error}</div>
      )}

      {/* Categories */}
      {!selectedProduct && (
        <div className="flex flex-wrap justify-center gap-4 mb-6">
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => fetchProducts(cat._id)}
              className={`px-4 py-2 rounded-md text-white font-medium transition-colors ${
                selectedCategory === cat._id
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Products */}
      {!selectedProduct && selectedCategory && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((prod) => (
            <div
              key={prod._id}
              onClick={() => fetchProduct(prod._id)}
              className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-transform transform hover:-translate-y-1 cursor-pointer"
            >
              <img
                src={prod.imageUrl || "https://via.placeholder.com/150"}
                alt={prod.name}
                className="w-full h-40 object-cover rounded-md mb-2"
              />
              <h3 className="text-lg font-semibold text-gray-800">
                {prod.name}
              </h3>
              <p className="text-gray-600">${prod.price}</p>
            </div>
          ))}
          <button
            onClick={() => setSelectedCategory(null)}
            className="col-span-full mt-4 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            Back to Categories
          </button>
        </div>
      )}

      {/* Product Details */}
      {selectedProduct && (
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
          <img
            src={selectedProduct.imageUrl || "https://via.placeholder.com/150"}
            alt={selectedProduct.name}
            className="w-full h-64 object-cover rounded-md mb-4"
          />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            {selectedProduct.name}
          </h3>
          <p className="text-gray-600 mb-4">${selectedProduct.price}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => handlePurchase(selectedProduct)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Purchase
            </button>
            <button
              onClick={() => fetchProducts(selectedCategory)}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Back to Products
            </button>
            <button
              onClick={() => setSelectedProduct(null)}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Back to Categories
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
