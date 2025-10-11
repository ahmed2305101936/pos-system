import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const User = mongoose.model('User', new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  isActive: Boolean
}));

const Product = mongoose.model('Product', new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  cost: Number,
  stock: Number,
  category: String,
  barcode: String,
  image: String,
  isActive: Boolean
}));

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});

    // Create admin user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@pos.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true
    });
    await adminUser.save();

    // Create cashier user
    const cashierPassword = await bcrypt.hash('cashier123', salt);
    const cashierUser = new User({
      name: 'Cashier User',
      email: 'cashier@pos.com',
      password: cashierPassword,
      role: 'cashier',
      isActive: true
    });
    await cashierUser.save();

    // Create sample products
    const sampleProducts = [
      {
        name: 'Laptop',
        description: 'High-performance laptop',
        price: 999.99,
        cost: 700.00,
        stock: 15,
        category: 'Electronics',
        barcode: '1234567890123',
        isActive: true
      },
      {
        name: 'Wireless Mouse',
        description: 'Ergonomic wireless mouse',
        price: 29.99,
        cost: 15.00,
        stock: 50,
        category: 'Electronics',
        barcode: '1234567890124',
        isActive: true
      },
      {
        name: 'Keyboard',
        description: 'Mechanical keyboard',
        price: 79.99,
        cost: 45.00,
        stock: 30,
        category: 'Electronics',
        barcode: '1234567890125',
        isActive: true
      },
      {
        name: 'Monitor',
        description: '24-inch LED monitor',
        price: 199.99,
        cost: 150.00,
        stock: 20,
        category: 'Electronics',
        barcode: '1234567890126',
        isActive: true
      }
    ];

    await Product.insertMany(sampleProducts);

    console.log('✅ Database seeded successfully!');
    console.log('👤 Admin Login: admin@pos.com / admin123');
    console.log('👥 Cashier Login: cashier@pos.com / cashier123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seedDatabase();