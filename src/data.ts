import type { Product, Order } from './types'

export const initialProducts: Product[] = [
  { id: 1, name: 'MacBook Air M3', category: 'Laptops', price: 1299, stock: 8, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=85', description: 'Portatil ultraligero con chip M3 y pantalla Liquid Retina.', featured: true },
  { id: 2, name: 'iPhone 15 Pro', category: 'Telefonos', price: 999, stock: 12, image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=900&q=85', description: 'Titanio, camara profesional y rendimiento sin limites.', featured: true },
  { id: 3, name: 'Sony WH-1000XM5', category: 'Audio', price: 349, stock: 20, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85', description: 'Auriculares con cancelacion de ruido y 30 horas de bateria.', featured: true },
  { id: 4, name: 'Apple Watch Ultra', category: 'Wearables', price: 799, stock: 7, image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=900&q=85', description: 'Diseno resistente para deporte, aventura y estilo diario.', featured: true },
  { id: 5, name: 'Logitech MX Master 3S', category: 'Accesorios', price: 99, stock: 30, image: 'https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=900&q=85', description: 'Precision silenciosa y flujo de trabajo entre dispositivos.', featured: false },
  { id: 6, name: 'Samsung Odyssey G7', category: 'Monitores', price: 649, stock: 5, image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=900&q=85', description: 'Monitor curvo 4K con una experiencia visual ultrafluida.', featured: false },
  { id: 7, name: 'Nintendo Switch OLED', category: 'Gaming', price: 349, stock: 14, image: 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?auto=format&fit=crop&w=900&q=85', description: 'Pantalla OLED vibrante para jugar en casa o en movimiento.', featured: false },
  { id: 8, name: 'DJI Mini 4 Pro', category: 'Drones', price: 759, stock: 4, image: 'https://images.unsplash.com/photo-1506947411487-a56738267384?auto=format&fit=crop&w=900&q=85', description: 'Dron compacto con grabacion 4K y deteccion omnidireccional.', featured: false },
]

export const initialOrders: Order[] = [
  { id: 1048, customer_name: 'Sofia Ramirez', customer_email: 'sofia@email.com', customer_phone: '+1 555 0123', address: 'Av. Central 245', total: 1348, status: 'processing', items: [{ ...initialProducts[2], quantity: 1 }, { ...initialProducts[4], quantity: 1 }], created_at: '2026-11-23T14:20:00.000Z' },
  { id: 1047, customer_name: 'Daniel Torres', customer_email: 'daniel@email.com', customer_phone: '+1 555 0188', address: 'Calle Norte 18', total: 999, status: 'completed', items: [{ ...initialProducts[1], quantity: 1 }], created_at: '2026-11-22T16:45:00.000Z' },
]
