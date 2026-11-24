export type Product = {
  id: number
  name: string
  category: string
  price: number
  stock: number
  image: string
  description: string
  featured: boolean
}

export type CartItem = Product & { quantity: number }

export type Order = {
  id: number
  customer_name: string
  customer_email: string
  customer_phone: string
  address: string
  total: number
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  items: CartItem[]
  created_at: string
}
