import { useEffect, useState } from 'react'
import { Plus, Edit, UserX, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { usersAPI } from '../../services/api'
import { Modal, PageLoader, PageHeader, EmptyState } from '../../components/ui'
import { useForm } from 'react-hook-form'

const ROLES = ['admin', 'manager', 'cashier', 'pharmacist']

export default function UsersPage() {
  const [users, setUsers]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [showModal, setModal]   = useState(false)
  const [editing, setEditing]   = useState(null)
  const { register, handleSubmit, reset } = useForm()

  const load = async () => {
    try { const res = await usersAPI.list(); setUsers(res.data) }
    catch { toast.error('Failed to load users') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); reset({}); setModal(true) }
  const openEdit   = (u)  => { setEditing(u);  reset(u);  setModal(true) }

  const onSubmit = async (data) => {
    try {
      if (editing) {
        if (!data.password) delete data.password
        await usersAPI.update(editing.id, data)
        toast.success('User updated')
      } else {
        await usersAPI.create(data)
        toast.success('User created')
      }
      setModal(false); load()
    } catch (err) { toast.error(err.response?.data?.detail || 'Error') }
  }

  const handleDeactivate = async (id) => {
    if (!confirm('Deactivate this user?')) return
    try { await usersAPI.delete(id); toast.success('User deactivated'); load() }
    catch { toast.error('Failed') }
  }

  const roleBadge = (role) => {
    const colors = { admin: 'badge-red', manager: 'badge-blue', cashier: 'badge-green', pharmacist: 'badge-yellow' }
    return <span className={colors[role] || 'badge-blue'}>{role}</span>
  }

  if (loading) return <PageLoader />

  return (
    <div className="p-6">
      <PageHeader
        title="User Management"
        subtitle={`${users.length} users`}
        action={
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add User
          </button>
        }
      />

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Name', 'Username', 'Email', 'Role', 'Status', ''].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.length === 0 ? (
              <tr><td colSpan={6}><EmptyState icon={Users} message="No users found" /></td></tr>
            ) : users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{u.full_name}</td>
                <td className="px-4 py-3 font-mono text-gray-600">{u.username}</td>
                <td className="px-4 py-3 text-gray-500">{u.email || '—'}</td>
                <td className="px-4 py-3">{roleBadge(u.role)}</td>
                <td className="px-4 py-3">
                  <span className={u.is_active ? 'badge-green' : 'badge-red'}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(u)} className="text-gray-400 hover:text-blue-600"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDeactivate(u.id)} className="text-gray-400 hover:text-red-600"><UserX className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal title={editing ? 'Edit User' : 'Add User'} onClose={() => setModal(false)}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name *</label>
              <input {...register('full_name', { required: true })} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Username *</label>
              <input {...register('username', { required: true })} className="input" disabled={!!editing} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input {...register('email')} type="email" className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password {editing ? '(leave blank to keep)' : '*'}</label>
              <input {...register('password', { required: !editing })} type="password" className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <select {...register('role')} className="input">
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-primary flex-1">{editing ? 'Update' : 'Create'}</button>
              <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}