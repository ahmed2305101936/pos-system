import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ShoppingCartIcon,
  CurrencyDollarIcon,
  UsersIcon,
  CubeIcon
} from '@heroicons/react/24/outline';

const stats = [
  { name: 'Total Sales', value: '$0', icon: ShoppingCartIcon, color: 'bg-green-500' },
  { name: 'Revenue', value: '$0', icon: CurrencyDollarIcon, color: 'bg-blue-500' },
  { name: 'Customers', value: '0', icon: UsersIcon, color: 'bg-purple-500' },
  { name: 'Products', value: '0', icon: CubeIcon, color: 'bg-orange-500' },
];

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState({
    totalSales: 0,
    revenue: 0,
    customers: 0,
    products: 0
  });
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [productsRes, customersRes, salesRes] = await Promise.all([
        axios.get('/products'),
        axios.get('/customers'),
        axios.get('/sales?limit=5')
      ]);

      const totalRevenue = salesRes.data.reduce((sum, sale) => sum + sale.total, 0);

      setDashboardData({
        products: productsRes.data.length,
        customers: customersRes.data.length,
        totalSales: salesRes.data.length,
        revenue: totalRevenue
      });

      setRecentSales(salesRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-600">Welcome back!</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { ...stats[0], value: dashboardData.totalSales.toString() },
          { ...stats[1], value: `$${dashboardData.revenue.toFixed(2)}` },
          { ...stats[2], value: dashboardData.customers.toString() },
          { ...stats[3], value: dashboardData.products.toString() },
        ].map((stat) => (
          <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`${stat.color} rounded-md p-3`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                    <dd className="text-lg font-semibold text-gray-900">{stat.value}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Sales */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Sales</h3>
        </div>
        <div className="px-4 py-5 sm:p-6">
          {recentSales.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No recent sales</p>
          ) : (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentSales.map((sale) => (
                    <tr key={sale._id}>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {sale.invoiceNumber}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(sale.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {sale.customer?.name || 'Walk-in Customer'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        ${sale.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}