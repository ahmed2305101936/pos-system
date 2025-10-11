import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ExclamationTriangleIcon, FunnelIcon } from '@heroicons/react/24/outline';

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique categories from products
  const categories = ['all', ...new Set(products
    .filter(product => product.category && product.category.trim() !== '')
    .map(product => product.category)
    .sort()
  )];

  // Filter products based on category and search term
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.barcode?.includes(searchTerm);
    return matchesCategory && matchesSearch;
  });

  const getStockStatus = (stock) => {
    if (stock === 0) return { status: 'Out of Stock', color: 'text-red-600 bg-red-50', badgeColor: 'bg-red-100 text-red-800' };
    if (stock <= 10) return { status: 'Low Stock', color: 'text-orange-600 bg-orange-50', badgeColor: 'bg-orange-100 text-orange-800' };
    return { status: 'In Stock', color: 'text-green-600 bg-green-50', badgeColor: 'bg-green-100 text-green-800' };
  };

  // Calculate category-wise statistics
  const categoryStats = {};
  products.forEach(product => {
    const category = product.category || 'Uncategorized';
    if (!categoryStats[category]) {
      categoryStats[category] = {
        totalProducts: 0,
        totalStock: 0,
        totalValue: 0,
        lowStock: 0,
        outOfStock: 0
      };
    }
    
    categoryStats[category].totalProducts += 1;
    categoryStats[category].totalStock += product.stock;
    categoryStats[category].totalValue += product.stock * product.cost;
    
    if (product.stock === 0) {
      categoryStats[category].outOfStock += 1;
    } else if (product.stock <= 10) {
      categoryStats[category].lowStock += 1;
    }
  });

  const lowStockProducts = products.filter(product => product.stock <= 10);
  const outOfStockProducts = products.filter(product => product.stock === 0);

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
        <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
      </div>

      {/* Category Overview */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Categories Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(categoryStats).map(([category, stats]) => (
              <div key={category} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900">{category}</h4>
                <div className="mt-2 space-y-1 text-sm">
                  <p>Products: {stats.totalProducts}</p>
                  <p>Total Stock: {stats.totalStock}</p>
                  <p>Value: ${stats.totalValue.toFixed(2)}</p>
                  {stats.lowStock > 0 && (
                    <p className="text-orange-600">Low Stock: {stats.lowStock}</p>
                  )}
                  {stats.outOfStock > 0 && (
                    <p className="text-red-600">Out of Stock: {stats.outOfStock}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stock Alerts */}
      {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-orange-500 mr-2" />
              Stock Alerts
            </h3>
            
            {outOfStockProducts.length > 0 && (
              <div className="mb-4">
                <h4 className="text-red-700 font-medium mb-2">Out of Stock ({outOfStockProducts.length})</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {outOfStockProducts.map(product => (
                    <div key={product._id} className="flex justify-between items-center p-2 bg-red-50 rounded">
                      <span className="text-red-800">{product.name}</span>
                      <span className="text-red-600 font-medium">0 in stock</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {lowStockProducts.length > 0 && (
              <div>
                <h4 className="text-orange-700 font-medium mb-2">Low Stock ({lowStockProducts.length})</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {lowStockProducts.map(product => (
                    <div key={product._id} className="flex justify-between items-center p-2 bg-orange-50 rounded">
                      <span className="text-orange-800">{product.name}</span>
                      <span className="text-orange-600 font-medium">{product.stock} in stock</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <FunnelIcon className="h-5 w-5 text-gray-500 mr-2" />
            Filter Products
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Products
              </label>
              <input
                type="text"
                placeholder="Search by name, description, or barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.filter(cat => cat !== 'all').map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {filteredProducts.length} of {products.length} products
              {selectedCategory !== 'all' && ` in "${selectedCategory}"`}
            </p>
            
            {(selectedCategory !== 'all' || searchTerm) && (
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchTerm('');
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Products {selectedCategory !== 'all' ? `- ${selectedCategory}` : ''}
          </h3>
          
          {filteredProducts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">No products found</p>
              <p className="text-gray-400 text-sm mt-2">
                {selectedCategory !== 'all' || searchTerm 
                  ? 'Try changing your filters or search term' 
                  : 'No products in inventory'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Stock
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cost
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProducts.map((product) => {
                    const stockStatus = getStockStatus(product.stock);
                    const inventoryValue = product.stock * product.cost;
                    
                    return (
                      <tr key={product._id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {product.image && (
                              <img
                                src={`http://localhost:5000/uploads/${product.image}`}
                                alt={product.name}
                                className="h-10 w-10 rounded-lg object-cover mr-3"
                              />
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">{product.name}</div>
                              {product.description && (
                                <div className="text-sm text-gray-500">{product.description}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {product.category || 'Uncategorized'}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.stock}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.badgeColor}`}>
                            {stockStatus.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${product.price.toFixed(2)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${product.cost.toFixed(2)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ${inventoryValue.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Inventory Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Total Products</h3>
          <p className="text-3xl font-bold text-blue-600">{products.length}</p>
          <p className="text-sm text-gray-500 mt-1">{categories.length - 1} categories</p>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Total Inventory Value</h3>
          <p className="text-3xl font-bold text-green-600">
            ${products.reduce((sum, product) => sum + (product.stock * product.cost), 0).toFixed(2)}
          </p>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Low Stock Items</h3>
          <p className="text-3xl font-bold text-orange-600">
            {lowStockProducts.length}
          </p>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Out of Stock</h3>
          <p className="text-3xl font-bold text-red-600">
            {outOfStockProducts.length}
          </p>
        </div>
      </div>

      {/* Category Statistics */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Category Statistics</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Products
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Stock
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inventory Value
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Low Stock
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Out of Stock
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Object.entries(categoryStats).map(([category, stats]) => (
                  <tr key={category}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {category}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stats.totalProducts}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stats.totalStock}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${stats.totalValue.toFixed(2)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-orange-600">
                      {stats.lowStock}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-red-600">
                      {stats.outOfStock}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}