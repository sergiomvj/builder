'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ShoppingCart, Package, DollarSign, TrendingUp, Plus, Search, Filter,
  Eye, Edit, Trash2, CheckCircle, XCircle, Clock, AlertCircle
} from 'lucide-react'

interface Product {
  id: string
  name: string
  sku: string
  description: string
  price: number
  costPrice: number
  stock: number
  category: string
  images: string[]
  status: 'active' | 'draft' | 'out_of_stock'
  createdAt: string
}

interface Order {
  id: string
  orderNumber: string
  customer: { name: string; email: string }
  items: { productId: string; quantity: number; price: number }[]
  total: number
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  paymentMethod: string
  shippingAddress: string
  createdAt: string
}

interface Category {
  id: string
  name: string
  description: string
  productCount: number
}

export default function EcommerceSystem() {
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(supabaseUrl, supabaseKey)

      const { data: prodData } = await supabase.from('ecommerce_products').select('*').order('created_at', { ascending: false })
      if (prodData) {
        setProducts(prodData.map((p: any) => ({
          id: p.id, name: p.name, sku: p.sku || '', description: p.description || '',
          price: parseFloat(p.price) || 0, costPrice: parseFloat(p.cost_price) || 0,
          stock: p.stock_quantity || 0, category: p.category || 'Geral',
          images: Array.isArray(p.images) ? p.images : [], status: p.status || 'active',
          createdAt: p.created_at
        })))
      }

      const { data: orderData } = await supabase.from('ecommerce_orders').select('*').order('created_at', { ascending: false }).limit(50)
      if (orderData) {
        setOrders(orderData.map((o: any) => ({
          id: o.id, orderNumber: o.order_number, customer: { name: o.customer_name || 'Cliente', email: o.customer_email || '' },
          items: Array.isArray(o.items) ? o.items : [], total: parseFloat(o.total_amount) || 0,
          status: o.status || 'pending', paymentMethod: o.payment_method || '', shippingAddress: o.shipping_address || '',
          createdAt: o.created_at
        })))
      }

      const { data: catData } = await supabase.from('ecommerce_categories').select('*').order('name')
      if (catData) {
        setCategories(catData.map((c: any) => ({
          id: c.id, name: c.name, description: c.description || '', productCount: c.product_count || 0
        })))
      }

      console.log('E-commerce System: Dados carregados')
    } catch (error) {
      console.error('Error loading ecommerce data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const configs: Record<string, any> = {
      active: { color: 'bg-green-100 text-green-800', label: 'Ativo', icon: CheckCircle },
      draft: { color: 'bg-gray-100 text-gray-800', label: 'Rascunho', icon: Edit },
      out_of_stock: { color: 'bg-red-100 text-red-800', label: 'Sem Estoque', icon: XCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pendente', icon: Clock },
      paid: { color: 'bg-blue-100 text-blue-800', label: 'Pago', icon: DollarSign },
      processing: { color: 'bg-purple-100 text-purple-800', label: 'Processando', icon: Package },
      shipped: { color: 'bg-indigo-100 text-indigo-800', label: 'Enviado', icon: Package },
      delivered: { color: 'bg-green-100 text-green-800', label: 'Entregue', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelado', icon: XCircle }
    }
    const config = configs[status] || configs.draft
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const totalRevenue = orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.total, 0)
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0
  const lowStockProducts = products.filter(p => p.stock < 10).length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">E-commerce System</h2>
          <p className="text-gray-600">Gestão de produtos, pedidos e vendas online</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" />Novo Produto</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card><CardContent className="p-6"><div className="flex items-center">
          <Package className="h-8 w-8 text-blue-600" /><div className="ml-4">
          <p className="text-sm font-medium text-gray-600">Produtos</p>
          <p className="text-2xl font-bold text-gray-900">{products.length}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center">
          <ShoppingCart className="h-8 w-8 text-green-600" /><div className="ml-4">
          <p className="text-sm font-medium text-gray-600">Pedidos</p>
          <p className="text-2xl font-bold text-gray-900">{orders.length}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center">
          <DollarSign className="h-8 w-8 text-purple-600" /><div className="ml-4">
          <p className="text-sm font-medium text-gray-600">Receita Total</p>
          <p className="text-2xl font-bold text-gray-900">R$ {(totalRevenue / 1000).toFixed(1)}k</p></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center">
          <AlertCircle className="h-8 w-8 text-orange-600" /><div className="ml-4">
          <p className="text-sm font-medium text-gray-600">Estoque Baixo</p>
          <p className="text-2xl font-bold text-gray-900">{lowStockProducts}</p></div></div></CardContent></Card>
      </div>

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="orders">Pedidos</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Catálogo de Produtos</CardTitle>
                <div className="flex gap-2">
                  <Input placeholder="Buscar produtos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-64" />
                  <Button variant="outline"><Filter className="h-4 w-4 mr-2" />Filtros</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {products.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum produto cadastrado</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(product => (
                    <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                          {product.images.length > 0 ? (
                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover rounded" />
                          ) : (
                            <Package className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{product.name}</h3>
                            {getStatusBadge(product.status)}
                          </div>
                          <p className="text-sm text-gray-600">{product.sku} • {product.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">R$ {product.price.toFixed(2)}</p>
                          <p className="text-sm text-gray-600">Estoque: {product.stock}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button size="sm" variant="outline"><Eye className="h-3 w-3" /></Button>
                        <Button size="sm" variant="outline"><Edit className="h-3 w-3" /></Button>
                        <Button size="sm" variant="outline"><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader><CardTitle>Pedidos Recentes</CardTitle></CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum pedido realizado</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map(order => (
                    <div key={order.id} className="p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">#{order.orderNumber}</h3>
                            {getStatusBadge(order.status)}
                          </div>
                          <p className="text-sm text-gray-600">{order.customer.name} • {order.customer.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">R$ {order.total.toFixed(2)}</p>
                          <p className="text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>{order.items.length} {order.items.length === 1 ? 'item' : 'itens'} • {order.paymentMethod}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Categorias</CardTitle>
                <Button><Plus className="h-4 w-4 mr-2" />Nova Categoria</Button>
              </div>
            </CardHeader>
            <CardContent>
              {categories.length === 0 ? (
                <div className="text-center py-12">
                  <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma categoria criada</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map(cat => (
                    <Card key={cat.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardHeader>
                        <CardTitle className="text-lg">{cat.name}</CardTitle>
                        <CardDescription>{cat.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600">{cat.productCount} produtos</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}