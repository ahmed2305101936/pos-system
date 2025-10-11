import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from '../models/Product.js';
import { auth, adminAuth } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/'))
  },
  filename: function (req, file, cb) {
    // Create unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Get all products
router.get('/', auth, async (req, res) => {
  try {
    const products = await Product.find({ isActive: true });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get product by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create product (Admin only) with image upload
router.post('/', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, cost, stock, category, barcode } = req.body;

    const productData = {
      name,
      description,
      price: parseFloat(price),
      cost: parseFloat(cost),
      stock: parseInt(stock),
      category,
      barcode
    };

    // If image was uploaded, add filename to product data
    if (req.file) {
      productData.image = req.file.filename;
    }

    const product = new Product(productData);
    await product.save();
    
    res.status(201).json(product);
  } catch (error) {
    console.error('Product creation error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update product (Admin only) with optional image upload
router.put('/:id', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, cost, stock, category, barcode } = req.body;

    const updateData = {
      name,
      description,
      price: parseFloat(price),
      cost: parseFloat(cost),
      stock: parseInt(stock),
      category,
      barcode
    };

    // If new image was uploaded, update the image filename
    if (req.file) {
      updateData.image = req.file.filename;
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Product update error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete product (Admin only - soft delete)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;