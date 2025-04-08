import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { API_URL } from "../api";

// const API_URL = "http://localhost:3000/api/admin";

const OrdersTable = ({ orders = [] }) => {
  const [orderData, setOrderData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`${API_URL}/orders`);
        setOrderData(data.data || []);
        setError(null);
      } catch (err) {
        setError("Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const requestSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "ETB",
    }).format(amount || 0);
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      paid: "bg-green-100 text-green-800 border-green-200",
      shipped: "bg-blue-100 text-blue-800 border-blue-200",
      processing: "bg-yellow-100 text-yellow-800 border-yellow-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
    };

    const statusIcons = {
      paid: "✅",
      shipped: "🚚",
      processing: "⏳",
      cancelled: "❌",
    };

    const style =
      statusStyles[status] || "bg-gray-100 text-gray-800 border-gray-200";
    const icon = statusIcons[status] || "ℹ️";

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}
      >
        {icon} <span className="ml-1 capitalize">{status}</span>
      </span>
    );
  };

  const sortedOrders = useMemo(() => {
    const sortableOrders = [...(orderData.length ? orderData : orders)];
    if (sortConfig.key) {
      sortableOrders.sort((a, b) => {
        let aValue =
          sortConfig.key === "customer" ? a.userId : a[sortConfig.key];
        let bValue =
          sortConfig.key === "customer" ? b.userId : b[sortConfig.key];

        if (sortConfig.key === "createdAt") {
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
        }

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sortableOrders;
  }, [orderData, orders, sortConfig]);

  const getSortIndicator = (key) =>
    sortConfig.key === key ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↕";

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );

  if (error)
    return (
      <div className="text-red-500 text-center p-4 bg-red-50 rounded-lg">
        {error}
      </div>
    );

  return (
    <div className="shadow-lg rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              {[
                { key: "customer", label: "Customer" },
                { key: "createdAt", label: "Date" },
                { key: "products", label: "Products", hideMobile: true },
                { key: "price", label: "Price", hideMobile: true },
                { key: "phone", label: "Phone", hideMobile: true },
                { key: "status", label: "Status" },
              ].map((header) => (
                <th
                  key={header.key}
                  className={`py-3 px-6 text-left font-semibold ${
                    header.hideMobile ? "hidden md:table-cell" : ""
                  } 
                    ${
                      header.key !== "products" && header.key !== "phone"
                        ? "cursor-pointer hover:bg-gray-100"
                        : ""
                    }`}
                  onClick={() =>
                    header.key !== "products" &&
                    header.key !== "phone" &&
                    requestSort(header.key)
                  }
                >
                  {header.label}{" "}
                  {header.key !== "products" &&
                    header.key !== "phone" &&
                    getSortIndicator(header.key)}
                </th>
              ))}
              <th className="py-3 px-6 text-center font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {sortedOrders.map((order) => (
              <tr
                key={order.id || order._id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="py-4 px-6">
                  <Link
                    to={`/order/${order._id}`}
                    className="flex items-center space-x-2 text-blue-600 hover:underline"
                  >
                    <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                      {order.userId?.substring(0, 2).toUpperCase()}
                    </span>
                    <span>{order.userId}</span>
                  </Link>
                </td>
                <td className="py-4 px-6">{formatDate(order.createdAt)}</td>
                <td className="py-4 px-6 hidden md:table-cell">
                  <span className="text-gray-600">{order.productId?.name}</span>
                </td>
                <td className="py-4 px-6 hidden md:table-cell">
                  {formatCurrency(order.productId?.price)}
                </td>
                <td className="py-4 px-6 hidden md:table-cell">
                  {order.phone}
                </td>
                <td className="py-4 px-6">{getStatusBadge(order.status)}</td>
                <td className="py-4 px-6">
                  <div className="flex justify-center space-x-2">
                    <button className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs font-medium">
                      View
                    </button>
                    <button className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-xs font-medium hidden sm:inline-flex">
                      Edit
                    </button>
                    <button className="px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-xs font-medium hidden md:inline-flex">
                      Print
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sortedOrders.length === 0 && (
        <div className="text-center py-10 text-gray-500">No orders found</div>
      )}
    </div>
  );
};

export default OrdersTable;
