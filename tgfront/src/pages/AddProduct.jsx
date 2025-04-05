import { useState, useEffect } from "react";
import axios from "axios";
const API_URL = "http://localhost:3000/api"; // Adjust if deployed
import MDEditor from "@uiw/react-md-editor";
const AddProduct = () => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
   const fetchCategories = async () => {
     try {
       const { data } = await axios.get(`${API_URL}/categories`);
       setCategories(data);
     } catch (err) {
      console.log(err)
     }
   };
   fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newProduct = { name, price, category, description, imageUrl };
    try {
      await axios.post(`${API_URL}/products`, newProduct);
      alert("Product added successfully");
      // setName("");
      // setPrice("");
      // setCategory("");
      // setDescription("");
      // setImageUrl("");
    } catch (error) {
      console.error("Error adding product:", error);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow-lg rounded-lg mt-10">
      <h2 className="text-2xl font-bold mb-4">Add New Product</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Product Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            Description
          </label>
          <MDEditor
            value={description}
            onChange={(value) =>
              setDescription(value || "")
            }
            className="mt-1"
            preview="edit"
          />
        </div>
        <input
          type="number"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full p-2 border rounded"
          required
        >
          <option value="">Select Category</option>
          {categories &&
            categories?.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
        </select>
        {/* <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 border rounded"
        ></textarea> */}
        <input
          type="text"
          placeholder="Image URL"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Add Product
        </button>
      </form>
    </div>
  );
};

export default AddProduct;
