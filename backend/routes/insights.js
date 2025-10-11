import express from 'express';
import Sale from '../models/Sale.js';
import Product from '../models/Product.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

// Get sales insights
router.get('/', auth, async (req, res) => {
  try {
    const { period = 'daily' } = req.query;
    
    let startDate = new Date();
    let endDate = new Date();
    
    // Set date range based on period
    switch (period) {
      case 'daily':
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'weekly':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      default:
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
    }

    // Get sales data
    const sales = await Sale.find({
      createdAt: { $gte: startDate, $lte: endDate },
      status: 'completed'
    })
    .populate('items.product', 'name cost')
    .sort({ createdAt: -1 });

    // Calculate insights
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    
    // Calculate profit (total - cost of goods sold)
    let totalCost = 0;
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const cost = item.product.cost * item.quantity;
        totalCost += cost;
      });
    });
    
    const totalProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    // Get top selling products
    const productSales = {};
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const productId = item.product._id.toString();
        if (!productSales[productId]) {
          productSales[productId] = {
            product: item.product,
            quantity: 0,
            revenue: 0
          };
        }
        productSales[productId].quantity += item.quantity;
        productSales[productId].revenue += item.price * item.quantity;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Sales by hour (for daily view)
    const hourlySales = {};
    if (period === 'daily') {
      for (let i = 0; i < 24; i++) {
        hourlySales[i] = { hour: i, sales: 0, revenue: 0 };
      }
      
      sales.forEach(sale => {
        const hour = new Date(sale.createdAt).getHours();
        hourlySales[hour].sales += 1;
        hourlySales[hour].revenue += sale.total;
      });
    }

    res.json({
      period,
      dateRange: { start: startDate, end: endDate },
      summary: {
        totalSales,
        totalRevenue,
        totalCost,
        totalProfit,
        profitMargin: parseFloat(profitMargin.toFixed(2)),
        averageOrderValue: totalSales > 0 ? totalRevenue / totalSales : 0
      },
      topProducts,
      hourlySales: period === 'daily' ? Object.values(hourlySales) : null,
      recentSales: sales.slice(0, 10) // Last 10 sales
    });
  } catch (error) {
    console.error('Insights error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Clear recent sales data (Admin only)
router.delete('/sales', adminAuth, async (req, res) => {
  try {
    const { days = 1 } = req.body;
    
    if (days > 30) {
      return res.status(400).json({ message: 'Cannot delete more than 30 days of data' });
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const result = await Sale.deleteMany({
      createdAt: { $gte: cutoffDate },
      status: 'completed'
    });

    res.json({
      message: `Successfully deleted ${result.deletedCount} sales from the last ${days} day(s)`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Clear sales error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;