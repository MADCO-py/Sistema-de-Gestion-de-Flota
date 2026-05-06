CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE,
  role VARCHAR(10) NOT NULL CHECK (role IN ('HOST', 'ADMIN', 'PILOT')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plate VARCHAR(20) UNIQUE NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('car', 'truck', 'van', 'motorcycle')),
  brand VARCHAR(50),
  model VARCHAR(50),
  year INT,
  current_km INT NOT NULL DEFAULT 0,
  maintenance_km INT NOT NULL DEFAULT 5000,
  status VARCHAR(15) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vehicle_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  pilot_id UUID NOT NULL REFERENCES users(id),
  route TEXT NOT NULL,
  km_start INT NOT NULL,
  km_end INT,
  checkin_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checkout_at TIMESTAMPTZ,
  status VARCHAR(10) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  km_suspicious BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  vehicle_id UUID REFERENCES vehicles(id),
  usage_id UUID REFERENCES vehicle_usage(id),
  type VARCHAR(30) NOT NULL CHECK (type IN ('maintenance', 'suspicious_km', 'no_checkout', 'info')),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE system_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity VARCHAR(50),
  entity_id UUID,
  details JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vehicle_usage_pilot ON vehicle_usage(pilot_id);
CREATE INDEX idx_vehicle_usage_vehicle ON vehicle_usage(vehicle_id);
CREATE INDEX idx_vehicle_usage_status ON vehicle_usage(status);
CREATE INDEX idx_alerts_user ON alerts(user_id);
CREATE INDEX idx_alerts_read ON alerts(is_read);
CREATE INDEX idx_logs_user ON system_logs(user_id);
CREATE INDEX idx_logs_created ON system_logs(created_at);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

INSERT INTO users (username, password_hash, full_name, email, role) VALUES
('host',   '$2b$10$btSz6HbW5aQmngaud6JCl.a12b20oTWKsrif7P.RZnpOS4orUpxn.', 'System Host',  'host@fleetcontrol.com',  'HOST'),
('admin',  '$2b$10$btSz6HbW5aQmngaud6JCl.a12b20oTWKsrif7P.RZnpOS4orUpxn.', 'Fleet Admin',  'admin@fleetcontrol.com', 'ADMIN'),
('pilot1', '$2b$10$btSz6HbW5aQmngaud6JCl.a12b20oTWKsrif7P.RZnpOS4orUpxn.', 'Juan García',  'juan@fleetcontrol.com',  'PILOT');

INSERT INTO vehicles (plate, type, brand, model, year, current_km, maintenance_km) VALUES
('ABC-123', 'car',        'Toyota',   'Corolla',  2022, 45000, 50000),
('XYZ-456', 'truck',      'Ford',     'F-150',    2021, 78000, 80000),
('VAN-789', 'van',        'Mercedes', 'Sprinter', 2023, 12000, 15000),
('MOT-001', 'motorcycle', 'Honda',    'CB500',    2022,  8000, 10000);
