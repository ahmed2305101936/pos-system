import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
  ArrowTrendingUpIcon, // Fixed: Changed from TrendingUpIcon to ArrowTrendingUpIcon
  TrashIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

export default function Insights() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('daily');
  const [clearDays, setClearDays] = useState(1);
  const [showClearModal, setShowClearModal] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchInsights();
  }, [period]);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/insights?period=${period}`);
      setInsights(response.data);
    } catch (error) {
      console.error('Error fetching insights:', error);
      alert('Error loading insights data');
    } finally {
      setLoading(false);
    }
  };

  const handleClearSales = async () => {
    if (!window.confirm(`Are you sure you want to delete sales data from the last ${clearDays} day(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await axios.delete('/insights/sales', {
        data: { days: clearDays }
      });
      
      alert(response.data.message);
      setShowClearModal(false);
      fetchInsights(); // Refresh data
    } catch (error) {
      console.error('Error clearing sales:', error);
      alert('Error clearing sales data: ' + (error.response?.data?.message || error.message));
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Business Insights</h1>
          <p className="text-gray-600">Track your sales performance and profits</p>
        </div>
        
        <div className="flex space-x-4">
          {/* Period Selector */}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="daily">Today</option>
            <option value="weekly">Last 7 Days</option>
            <option value="monthly">Last 30 Days</option>
          </select>

          {/* Clear Data Button (Admin only) */}
          {user?.role === 'admin' && (
            <button
              onClick={() => setShowClearModal(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center"
            >
              <TrashIcon className="h-5 w-5 mr-2" />
              Clear Data
            </button>
          )}
        </div>
      </div>

      {insights && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ShoppingCartIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Sales</p>
                  <p className="text-2xl font-bold text-gray-900">{insights.summary.totalSales}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(insights.summary.totalRevenue)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ArrowTrendingUpIcon className="h-8 w-8 text-purple-600" /> {/* Fixed here */}
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Profit</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(insights.summary.totalProfit)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-8 w-8 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Profit Margin</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {insights.summary.profitMargin}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Products */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-4 py-5 sm:p-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Top Selling Products
                </h3>
              </div>
              <div className="px-4 py-5 sm:p-6">
                {insights.topProducts.length > 0 ? (
                  <div className="space-y-4">
                    {insights.topProducts.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.product.name}</p>
                          <p className="text-sm text-gray-500">
                            Sold: {item.quantity} units
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(item.revenue)}
                          </p>
                          <p className="text-sm text-gray-500">Revenue</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No sales data available</p>
                )}
              </div>
            </div>

            {/* Recent Sales */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-4 py-5 sm:p-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Recent Sales
                </h3>
              </div>
              <div className="px-4 py-5 sm:p-6">
                {insights.recentSales.length > 0 ? (
                  <div className="space-y-3">
                    {insights.recentSales.map((sale) => (
                      <div key={sale._id} className="flex justify-between items-center border-b pb-3 last:border-b-0 last:pb-0">
                        <div>
                          <p className="font-medium text-gray-900">
                            {sale.invoiceNumber}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(sale.createdAt)} {formatTime(sale.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(sale.total)}
                          </p>
                          <p className="text-sm text-gray-500 capitalize">
                            {sale.paymentMethod}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No recent sales</p>
                )}
              </div>
            </div>
          </div>

          {/* Hourly Sales Chart (Daily only) */}
          {insights.hourlySales && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-4 py-5 sm:p-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Sales by Hour
                </h3>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <div className="grid grid-cols-6 md:grid-cols-12 gap-4">
                  {insights.hourlySales.map((hourData) => (
                    <div key={hourData.hour} className="text-center">
                      <div className="bg-blue-50 rounded-lg p-2">
                        <p className="text-sm font-medium text-blue-900">
                          {hourData.sales}
                        </p>
                        <p className="text-xs text-blue-600">
                          {hourData.hour}:00
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatCurrency(hourData.revenue)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Detailed Summary */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-4 py-5 sm:p-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Financial Summary
              </h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Revenue:</span>
                    <span className="font-semibold">
                      {formatCurrency(insights.summary.totalRevenue)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cost of Goods:</span>
                    <span className="font-semibold text-red-600">
                      -{formatCurrency(insights.summary.totalCost)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-600 font-medium">Gross Profit:</span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(insights.summary.totalProfit)}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Number of Orders:</span>
                    <span className="font-semibold">{insights.summary.totalSales}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average Order Value:</span>
                    <span className="font-semibold">
                      {formatCurrency(insights.summary.averageOrderValue)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Profit Margin:</span>
                    <span className="font-semibold">
                      {insights.summary.profitMargin}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Clear Data Modal */}
      {showClearModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Clear Sales Data
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delete sales from the last:
                  </label>
                  <select
                    value={clearDays}
                    onChange={(e) => setClearDays(parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>1 day</option>
                    <option value={7}>7 days</option>
                    <option value={30}>30 days</option>
                  </select>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Warning: This action cannot be undone. All sales data from the selected period will be permanently deleted.
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowClearModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleClearSales}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                  >
                    Delete Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}