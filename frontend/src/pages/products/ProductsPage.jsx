import { useEffect, useState } from 'react'
import { Plus, Search, Edit, Trash2, Package, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { productsAPI, categoriesAPI, suppliersAPI } from '../../services/api'
import { Modal, PageLoader, PageHeader, EmptyState } from '../../components/ui'
import { formatCurrency, STORE_MODULES } from '../../utils/helpers'
import { useForm } from 'react-hook-form'

export default function ProductsPage() {
  const [products, setProducts]     = useState([])
  const [categories, setCategories] = useState([])
  const [suppliers, setSuppliers]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [showModal, setShowModal]   = useState(false)
  const [editing, setEditing]       = useState(null)
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const load = async (q = '') => {
    try {
      const [pRes, cRes, sRes] = await Promise.all([
        productsAPI.list({ search: q }),
        categoriesAPI.list(),
        suppliersAPI.list(),
      ])
      setProducts(pRes.data)
      setCategories(cRes.data)
      setSuppliers(sRes.data)
    } catch { toast.error('Failed to load products') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    const t = setTimeout(() => load(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const openCreate = () => { setEditing(null); reset({}); setShowModal(true) }
  const openEdit   = (p)  => { setEditing(p); reset(p); setShowModal(true) }

  const onSubmit = async (data) => {
    try {
      if (editing) {
        await productsAPI.update(editing.id, data)
        toast.success('Product updated')
      } else {
        await productsAPI.create(data)
        toast.success('Product created')
      }
      setShowModal(false)
      load(search)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error saving product')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this product?')) return
    try {
      await productsAPI.delete(id)
      toast.success('Product deactivated')
      load(search)
    } catch { toast.error('Failed to delete') }
  }

  if (loading) return <PageLoader />

  return (
    <div className="p-6">
      <PageHeader
        title="Products"
        subtitle={`${products.length} products`}
        action={
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Product
          </button>
        }
      />

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-9"
          placeholder="Search by name or barcode..."
        />
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Product', 'Barcode', 'Category', 'Price', 'Stock', 'Module', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.length === 0 ? (
                <tr><td colSpan={7} className="py-4"><EmptyState icon={Package} message="No products found" /></td></tr>
              ) : products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-gray-500">{p.barcode || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{categories.find(c => c.id === p.category_id)?.name || '—'}</td>
                  <td className="px-4 py-3 font-semibold text-blue-600">{formatCurrency(p.selling_price)}</td>
                  <td className="px-4 py-3">
                    <span className={p.quantity_in_stock <= p.reorder_level ? 'text-red-600 font-medium flex items-center gap-1' : ''}>
                      {p.quantity_in_stock <= p.reorder_level && <AlertTriangle className="w-3 h-3" />}
                      {p.quantity_in_stock} {p.unit}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge-blue capitalize">{p.module}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(p)} className="text-gray-400 hover:text-blue-600">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="text-gray-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <Modal title={editing ? 'Edit Product' : 'Add Product'} onClose={() => setShowModal(false)} size="lg">
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Product Name *</label>
              <input {...register('name', { required: true })} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Barcode</label>
              <input {...register('barcode')} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">SKU</label>
              <input {...register('sku')} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cost Price *</label>
              <input {...register('cost_price', { required: true, valueAsNumber: true })} type="number" step="0.01" className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Selling Price *</label>
              <input {...register('selling_price', { required: true, valueAsNumber: true })} type="number" step="0.01" className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tax Rate (%)</label>
              <input {...register('tax_rate', { valueAsNumber: true })} type="number" step="0.01" defaultValue={0} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Stock Quantity</label>
              <input {...register('quantity_in_stock', { valueAsNumber: true })} type="number" step="0.01" defaultValue={0} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Reorder Level</label>
              <input {...register('reorder_level', { valueAsNumber: true })} type="number" defaultValue={10} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Unit</label>
              <input {...register('unit')} defaultValue="pcs" className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select {...register('category_id', { valueAsNumber: true })} className="input">
                <option value="">— None —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Supplier</label>
              <select {...register('supplier_id', { valueAsNumber: true })} className="input">
                <option value="">— None —</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Module</label>
              <select {...register('module')} className="input">
                {STORE_MODULES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Expiry Date</label>
              <input {...register('expiry_date')} type="date" className="input" />
            </div>
            <div className="col-span-2 flex items-center gap-3 pt-2">
              <input {...register('requires_prescription')} type="checkbox" id="rx" className="w-4 h-4" />
              <label htmlFor="rx" className="text-sm">Requires Prescription (Pharmacy)</label>
              <input {...register('is_weighable')} type="checkbox" id="weigh" className="w-4 h-4 ml-4" />
              <label htmlFor="weigh" className="text-sm">Weighable Item (Supermarket)</label>
            </div>
            <div className="col-span-2 flex gap-3 pt-2">
              <button type="submit" className="btn-primary flex-1">
                {editing ? 'Update Product' : 'Create Product'}
              </button>
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}