// src/components/Home.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "http://localhost:3000/api"; // Adjust if deployed

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]); // Store all products initially
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch categories and all products on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        // Fetch categories
        const { data: catData } = await axios.get(`${API_URL}/categories`);
        setCategories(catData);

        // Fetch all products
        const { data: prodData } = await axios.get(`${API_URL}/products/all`);
        setAllProducts(prodData);
        setProducts(prodData); // Display all products initially
        setError(null);
      } catch (err) {
        setError("Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // Fetch products by category when selected
  const fetchProductsByCategory = async (categoryId = 'all') => {
    setLoading(true);
    setSelectedCategory(categoryId || 'all');
    setSelectedProduct(null); // Reset product view
    try {
      if (categoryId === null) {
        // Show all products when no category is selected
        setProducts(allProducts);
      } else {
        const { data } = await axios.get(`${API_URL}/products/${categoryId}`);
        setProducts(data);
      }
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md py-6">
        <h1 className="text-4xl font-extrabold text-center text-gray-900">
          ShopSphere
        </h1>
        <p className="text-center text-gray-500 mt-2">
          Your one-stop shop for everything!
        </p>
      </header>

      <main className="container mx-auto p-6">
        {loading && (
          <div className="text-center text-lg text-gray-600 animate-pulse">
            Loading...
          </div>
        )}
        {error && (
          <div className="text-center text-red-600 bg-red-100 p-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {/* Categories */}
        {!selectedProduct && (
          <div className="mb-8">
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => fetchProductsByCategory(null)}
                className={`px-5 py-2 rounded-full font-medium transition-all duration-300 ${
                  selectedCategory === 'all'
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "bg-gray-200 text-gray-700 hover:bg-indigo-500 hover:text-white"
                }`}
              >
                All Products
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => fetchProductsByCategory(cat._id)}
                  className={`px-5 py-2 rounded-full font-medium transition-all duration-300 ${
                    selectedCategory === cat._id
                      ? "bg-indigo-600 text-white shadow-lg"
                      : "bg-gray-200 text-gray-700 hover:bg-indigo-500 hover:text-white"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Products */}
        {!selectedProduct && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((prod) => (
              <div
                key={prod._id}
                onClick={() => fetchProduct(prod._id)}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
              >
                <img
                  src={prod.imageUrl || "https://via.placeholder.com/150"}
                  alt={prod.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-800 truncate">
                    {prod.name}
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">${prod.price}</p>
                  <button className="mt-3 w-full bg-indigo-500 text-white py-2 rounded-md hover:bg-indigo-600 transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Product Details */}
        {selectedProduct && (
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md p-6">
            <img
              src={
                selectedProduct.imageUrl || "https://via.placeholder.com/150"
              }
              alt={selectedProduct.name}
              className="w-full h-72 object-cover rounded-lg mb-6"
            />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              {selectedProduct.name}
            </h3>
            <p className="text-gray-600 text-lg mb-4">
              ${selectedProduct.price}
            </p>
            <p className="text-gray-500 mb-6">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => fetchProductsByCategory(selectedCategory)}
                className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors font-medium"
              >
                Back to Products
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-4 mt-12">
        <p className="text-center">
          &copy; 2025 ShopSphere. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default Home;
