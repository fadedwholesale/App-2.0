-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  date_of_birth DATE,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stock INTEGER DEFAULT 0,
  thc VARCHAR(50),
  cbd VARCHAR(50),
  supplier VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create drivers table
CREATE TABLE IF NOT EXISTS drivers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  is_online BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT false,
  current_location JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  order_id VARCHAR(50) UNIQUE NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  address TEXT NOT NULL,
  items JSONB NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for products
CREATE POLICY "Anyone can view active products" ON products FOR SELECT USING (status = 'active');
CREATE POLICY "Admin can manage products" ON products FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Create RLS policies for drivers
CREATE POLICY "Drivers can view own profile" ON drivers FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Drivers can update own profile" ON drivers FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admin can manage drivers" ON drivers FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Create RLS policies for orders
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Drivers can view assigned orders" ON orders FOR SELECT USING (auth.uid() = driver_id);
CREATE POLICY "Admin can manage all orders" ON orders FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Insert sample data
INSERT INTO products (name, category, price, stock, thc, cbd, supplier, status) VALUES
('OG Kush', 'Flower', 45.00, 50, '22%', '0.1%', 'Premium Farms', 'active'),
('Blue Dream', 'Flower', 42.00, 45, '20%', '0.2%', 'Sunset Growers', 'active'),
('Sour Diesel', 'Flower', 48.00, 30, '24%', '0.1%', 'Urban Cultivators', 'active'),
('Girl Scout Cookies', 'Flower', 50.00, 25, '23%', '0.3%', 'Elite Genetics', 'active'),
('Pineapple Express', 'Flower', 44.00, 40, '21%', '0.2%', 'Tropical Farms', 'active'),
('CBD Relief Tincture', 'Tincture', 35.00, 100, '0.3%', '15%', 'Wellness Labs', 'active'),
('THC Gummies', 'Edibles', 25.00, 75, '10mg', '0%', 'Sweet Treats Co', 'active'),
('Vape Cartridge - Sativa', 'Vape', 55.00, 60, '85%', '0.5%', 'Vape Masters', 'active'),
('Pre-Roll Pack', 'Pre-Rolls', 30.00, 80, '18%', '0.2%', 'Rolling Co', 'active'),
('CBD Topical Cream', 'Topicals', 28.00, 50, '0.1%', '8%', 'Healing Touch', 'active');

-- Create indexes for better performance
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_driver_id ON orders(driver_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_drivers_online ON drivers(is_online, is_available);
