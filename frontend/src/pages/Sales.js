import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PhotoIcon } from '@heroicons/react/24/outline'; // Add this import

export default function Sales() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('/customers');
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode?.includes(searchTerm)
  );

  const addToCart = (product) => {
    if (product.stock <= 0) {
      alert('Product out of stock!');
      return;
    }

    const existingItem = cart.find(item => item.product._id === product._id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        alert('Not enough stock available!');
        return;
      }
      setCart(cart.map(item =>
        item.product._id === product._id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        product,
        quantity: 1,
        price: product.price,
        discount: 0
      }]);
    }
  };

  const updateQuantity = (productId, quantity) => {
    const product = products.find(p => p._id === productId);
    if (quantity > product.stock) {
      alert('Not enough stock available!');
      return;
    }

    if (quantity === 0) {
      removeFromCart(productId);
    } else {
      setCart(cart.map(item =>
        item.product._id === productId
          ? { ...item, quantity }
          : item
      ));
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product._id !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = Math.max(0, subtotal - discount);

  const processSale = async () => {
    if (cart.length === 0) {
      alert('Please add products to cart');
      return;
    }

    setLoading(true);
    try {
      const saleData = {
        items: cart.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount
        })),
        customer: selectedCustomer || undefined,
        subtotal,
        discount,
        total,
        paymentMethod
      };

      const response = await axios.post('/sales', saleData);
      
      // Print invoice (simple version)
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice ${response.data.invoiceNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 20px; }
              .section { margin-bottom: 15px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f5f5f5; }
              .total { font-weight: bold; font-size: 1.1em; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>POS SYSTEM INVOICE</h2>
              <p>Invoice: ${response.data.invoiceNumber}</p>
              <p>Date: ${new Date().toLocaleString()}</p>
            </div>
            <div class="section">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${response.data.items.map(item => `
                    <tr>
                      <td>${item.product.name}</td>
                      <td>${item.quantity}</td>
                      <td>$${item.price.toFixed(2)}</td>
                      <td>$${(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            <div class="section">
              <p>Subtotal: $${subtotal.toFixed(2)}</p>
              <p>Discount: $${discount.toFixed(2)}</p>
              <p class="total">Total: $${total.toFixed(2)}</p>
              <p>Payment Method: ${paymentMethod}</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();

      // Reset cart
      setCart([]);
      setSelectedCustomer('');
      setDiscount(0);
      setPaymentMethod('cash');
      setSearchTerm('');
      
      // Refresh products to update stock
      fetchProducts();
      
      alert('Sale completed successfully!');
    } catch (error) {
      console.error('Error processing sale:', error);
      alert('Error processing sale: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Product Search and Selection */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Products</h2>
          
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search products by name or barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto p-2">
            {filteredProducts.map(product => (
              <div
                key={product._id}
                className="border border-gray-200 rounded-lg p-3 cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-colors"
                onClick={() => addToCart(product)}
              >
                {product.image ? (
                  <img
                    src={`http://localhost:5000/uploads/${product.image}`}
                    alt={product.name}
                    className="w-full h-24 object-cover rounded mb-2"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-24 bg-gray-200 rounded mb-2 flex items-center justify-center">
                    <PhotoIcon className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <h3 className="font-medium text-sm mb-1 line-clamp-2">{product.name}</h3>
                <p className="text-green-600 font-semibold">${product.price}</p>
                <p className={`text-xs ${product.stock > 0 ? 'text-gray-500' : 'text-red-500'}`}>
                  Stock: {product.stock}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Cart</h2>
        
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer
            </label>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Walk-in Customer</option>
              {customers.map(customer => (
                <option key={customer._id} value={customer._id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>
        </div>

        <div className="space-y-3 max-h-64 overflow-y-auto mb-6">
          {cart.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Cart is empty</p>
          ) : (
            cart.map(item => (
              <div key={item.product._id} className="flex items-center justify-between border-b pb-3">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{item.product.name}</h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <button
                      onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                      className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                    >
                      -
                    </button>
                    <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                      className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                  <button
                    onClick={() => removeFromCart(item.product._id)}
                    className="text-red-500 text-sm hover:text-red-700 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-2 border-t pt-4">
          <div className="flex justify-between text-sm">
            <span>Subtotal:</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span>Discount:</span>
            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
              className="w-20 text-right border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
              min="0"
              max={subtotal}
            />
          </div>
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Total:</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={processSale}
          disabled={cart.length === 0 || loading}
          className="w-full mt-6 bg-green-600 text-white py-3 rounded-md font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Processing...' : 'Complete Sale'}
        </button>
      </div>
    </div>
  );
}