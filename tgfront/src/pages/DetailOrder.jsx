import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

const API_URL = "http://localhost:3000/api/admin";

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState({
    fetch: true,
    action: false,
  });
  const [error, setError] = useState(null);
  const [actionData, setActionData] = useState({
    phone: "",
    description: "",
  });

  // Memoized fetch function
  const fetchOrderDetails = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/order/${id}`);
      setOrder(data.data);
      setActionData((prev) => ({ ...prev, phone: data.data?.phone || "" }));
    } catch (err) {
      setError("Failed to load order details");
      console.error(err);
    } finally {
      setLoading((prev) => ({ ...prev, fetch: false }));
    }
  }, [id]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setActionData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAction = useCallback(
    async (actionType) => {
      if (!actionData.phone.trim()) {
        setError("Phone number is required");
        return;
      }

      setLoading((prev) => ({ ...prev, action: true }));
      setError(null);

      try {
        const payload = {
          phone: actionData.phone,
          description: actionData.description,
          action: actionType,
          orderId: id,
        };

        const res = await axios.post(
          `${API_URL}/order/process/${order?.userId}`,
          payload
        );

        navigate("/orders", {
          state: {
            message: `Order ${
              actionType === "accept" ? "accepted" : "rejected"
            } successfully`,
            type: "success",
          },
        });
      } catch (err) {
        setError(
          `Failed to ${actionType} order: ${
            err.response?.data?.message || err.message
          }`
        );
      } finally {
        setLoading((prev) => ({ ...prev, action: false }));
      }
    },
    [actionData, id, order?.userId, navigate]
  );

  // Format date helper
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  if (loading.fetch)
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );

  if (error && !order)
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );

  if (!order)
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
          <p className="text-yellow-700">Order not found</p>
        </div>
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h1 className="text-2xl font-bold text-gray-900">
            Order #{order._id}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Created: {formatDate(order.createdAt)}
          </p>
        </div>

        {/* Order Details */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DetailItem label="Customer ID" value={order.userId || "N/A"} />
            <DetailItem label="Customer" value={order.name || "N/A"} />
            <DetailItem
              label="Product"
              value={order.productId?.name || "N/A"}
            />
            <DetailItem
              label="Status"
              value={
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    order.status === "paid"
                      ? "bg-green-100 text-green-800"
                      : order.status === "shipped"
                      ? "bg-blue-100 text-blue-800"
                      : order.status === "processing"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {order.status}
                </span>
              }
            />
          </div>

          {/* Action Form */}
          <div className="mt-8 pt-6 border-t">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Process Order
            </h2>

            <div className="space-y-6">
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Contact Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  value={actionData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter customer phone number"
                  disabled={loading.action}
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Additional Notes
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  value={actionData.description}
                  onChange={handleInputChange}
                  placeholder="Enter any additional notes"
                  disabled={loading.action}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row justify-end gap-4">
              <button
                onClick={() => navigate("/orders")}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                disabled={loading.action}
              >
                Back to Orders
              </button>
              <button
                onClick={() => handleAction("reject")}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                disabled={loading.action}
              >
                {loading.action ? "Processing..." : "Reject Order"}
              </button>
              <button
                onClick={() => handleAction("accept")}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                disabled={loading.action}
              >
                {loading.action ? "Processing..." : "Accept Order"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable Detail Item Component
const DetailItem = ({ label, value }) => (
  <div>
    <p className="text-sm text-gray-500">{label}</p>
    <p className="mt-1 font-medium text-gray-900">{value}</p>
  </div>
);

export default OrderDetail;
