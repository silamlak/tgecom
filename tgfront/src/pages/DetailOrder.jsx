import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import { API_URL } from "../api";

// const API_URL = "http://localhost:3000/api/admin";

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [actionData, setActionData] = useState({
    phone: "",
    description: "",
  });

  // Fetch order details using useQuery
  const {
    data: order,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/order/${id}`);
      return data;
    },
  });

  // Mutation for processing order
  const processOrderMutation = useMutation({
    mutationFn: async ({ actionType }) => {
      if (!actionData.phone.trim()) throw new Error("Phone number is required");

      const payload = {
        phone: actionData.phone,
        description: actionData.description,
        action: actionType,
        orderId: id,
      };
      return axios.post(`${API_URL}/order/process/${order?.data.userId}`, payload);
    },
    onSuccess: (_, { actionType }) => {
      navigate("/order", {
        state: {
          message: `Order ${actionType} successfully`,
          type: "success",
        },
      });
    },
    onError: (err) => console.error(err), // Log error instead of returning it
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setActionData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAction = (actionType) => {
    processOrderMutation.mutate({ actionType });
  };

  // Format date helper
  const formatDate = (dateString) =>
    new Date(dateString).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  if (isLoading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
      </div>
    );

  if (error || !order)
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-100 border-l-4 border-red-500 p-4 rounded-lg">
          <p className="text-red-700">{error?.message || "Order not found"}</p>
        </div>
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b">
          <h1 className="text-2xl font-bold text-gray-900">
            Order #{order._id}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Created: {formatDate(order.data.createdAt)}
          </p>
        </div>

        {/* Order Details */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DetailItem
              label="Customer ID"
              value={order.user.userId || "N/A"}
            />
            <DetailItem
              label="Customer"
              value={order.user.firstName || "N/A"}
            />
            <DetailItem
              label="Product"
              value={order.data.productId?.name || "N/A"}
            />
            <DetailItem
              label="Status"
              value={
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    order.data.status === "paid"
                      ? "bg-green-100 text-green-800"
                      : order.data.status === "shipped"
                      ? "bg-blue-100 text-blue-800"
                      : order.data.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : order.data.status === "accept"
                      ? "bg-teal-100 text-teal-800"
                      : "bg-red-100 text-red-800" // reject
                  }`}
                >
                  {order.data.status}
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100"
                  value={actionData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter customer phone number"
                  disabled={processOrderMutation.isPending}
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100"
                  value={actionData.description}
                  onChange={handleInputChange}
                  placeholder="Enter any additional notes"
                  disabled={processOrderMutation.isPending}
                />
              </div>
            </div>

            {/* Error Message */}
            {processOrderMutation.isError && (
              <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg text-sm">
                {processOrderMutation.error.message}
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row justify-end gap-4">
              {/* Always show Back to Orders */}
              <button
                onClick={() => navigate("/orders")}
                className="px-4 py-2 bg-gray-100 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-200 transition-all focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                disabled={processOrderMutation.isPending}
              >
                Back to Orders
              </button>

              {/* Show Accept/Reject only for 'pending' status */}
              {order?.data.status === "pending" && (
                <>
                  <button
                    onClick={() => handleAction("reject")}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                    disabled={processOrderMutation.isPending}
                  >
                    {processOrderMutation.isPending
                      ? "Processing..."
                      : "Reject Order"}
                  </button>
                  <button
                    onClick={() => handleAction("accept")}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                    disabled={processOrderMutation.isPending}
                  >
                    {processOrderMutation.isPending
                      ? "Processing..."
                      : "Accept Order"}
                  </button>
                </>
              )}

              {/* Show Ship only for 'accept' status */}
              {order?.data.status === "accept" && (
                <button
                  onClick={() => handleAction("reject")}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  disabled={processOrderMutation.isPending}
                >
                  {processOrderMutation.isPending
                    ? "Processing..."
                    : "Reject Order"}
                </button>
              )}
              {/* Show Ship only for 'accept' status */}
              {order?.data.status === "accept" && (
                <button
                  onClick={() => handleAction("paid")}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  disabled={processOrderMutation.isPending}
                >
                  {processOrderMutation.isPending
                    ? "Processing..."
                    : "Mark as Paid"}
                </button>
              )}

              {/* Show Mark as Paid only for 'paid' status */}
              {order?.data.status === "paid" && (
                <button
                  onClick={() => handleAction("shipped")}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                  disabled={processOrderMutation.isPending}
                >
                  {processOrderMutation.isPending
                    ? "Processing..."
                    : "ship order"}
                </button>
              )}
              {/* Show Mark as Paid only for 'shipped' status */}
              {order?.data.status === "shipped" && (
                <button
                  onClick={() => handleAction("completed")}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                  disabled={processOrderMutation.isPending}
                >
                  {processOrderMutation.isPending
                    ? "Processing..."
                    : "Make Complete"}
                </button>
              )}

              {/* No additional buttons for 'reject' or 'paid' status as they are terminal states */}
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