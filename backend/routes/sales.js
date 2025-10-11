import express from 'express';
import Sale from '../models/Sale.js';
import Product from '../models/Product.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get all sales
router.get('/', auth, async (req, res) => {
  try {
    const sales = await Sale.find()
      .populate('customer', 'name email phone')
      .populate('cashier', 'name email')
      .populate('items.product', 'name price')
      .sort({ createdAt: -1 });
    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get sale by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('customer', 'name email phone address')
      .populate('cashier', 'name email')
      .populate('items.product', 'name price barcode');
    
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }
    res.json(sale);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new sale
router.post('/', auth, async (req, res) => {
  try {
    const { items, customer, discount, paymentMethod } = req.body;
    
    // Calculate totals
    let subtotal = 0;
    
    // Update product stock and calculate subtotal
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Product ${item.product} not found` });
      }
      
      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}` 
        });
      }
      
      // Update product stock
      product.stock -= item.quantity;
      await product.save();
      
      // Calculate item total
      subtotal += item.price * item.quantity;
    }
    
    const total = subtotal - (discount || 0);
    
    const sale = new Sale({
      items,
      customer: customer || undefined,
      subtotal,
      discount: discount || 0,
      total,
      paymentMethod: paymentMethod || 'cash',
      cashier: req.user._id
    });
    
    await sale.save();
    
    // Populate the sale for response
    const populatedSale = await Sale.findById(sale._id)
      .populate('customer', 'name email phone')
      .populate('cashier', 'name email')
      .populate('items.product', 'name price');
    
    res.status(201).json(populatedSale);
  } catch (error) {
    console.error('Sale creation error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Refund sale
router.post('/:id/refund', auth, async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }
    
    if (sale.status === 'refunded') {
      return res.status(400).json({ message: 'Sale already refunded' });
    }
    
    // Restore product stock
    for (const item of sale.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock += item.quantity;
        await product.save();
      }
    }
    
    // Update sale status
    sale.status = 'refunded';
    await sale.save();
    
    res.json({ message: 'Sale refunded successfully', sale });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;