import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Save, X, Search, Package, PlusCircle, MinusCircle } from 'lucide-react';

export default function ProductsTab() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  // Default empty product form
  const emptyForm = {
    id: '', name: '', slug: '', category: '', description: '', image: '',
    features: [''],
    specs: [{ key: '', value: '' }],
    subcategories: []
  };

  const [form, setForm] = useState<any>({ ...emptyForm });

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products');
      if (res.ok) setProducts(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const handleEdit = (product: any) => {
    setErr('');
    setEditingId(product.id);
    setShowAddForm(true);
    
    // Format specs from object to array of {key, value} if needed
    let formattedSpecs = [{ key: '', value: '' }];
    if (product.specs && typeof product.specs === 'object') {
      formattedSpecs = Object.entries(product.specs).map(([key, value]) => ({ key, value: String(value) }));
      if (formattedSpecs.length === 0) formattedSpecs = [{ key: '', value: '' }];
    }

    setForm({
      id: product.id || '',
      name: product.name || '',
      slug: product.slug || '',
      category: product.category || '',
      description: product.description || '',
      image: product.image || '',
      features: product.features?.length ? [...product.features] : [''],
      specs: formattedSpecs,
      subcategories: product.subcategories || []
    });
  };

  const handleAddNew = () => {
    setErr('');
    setEditingId(null);
    setForm({ ...emptyForm, id: 'p' + Date.now() });
    setShowAddForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    
    if (!form.name || !form.id) {
      setErr('Name and ID are required');
      return;
    }

    setSaving(true);
    try {
      // Re-map specs array to object
      const specsObj: any = {};
      form.specs.forEach((s: any) => {
        if (s.key.trim() && s.value.trim()) {
          specsObj[s.key.trim()] = s.value.trim();
        }
      });

      const payload = {
        ...form,
        features: form.features.filter((f: string) => f.trim() !== ''),
        specs: specsObj
      };

      const url = editingId ? `/api/products/${editingId}` : '/api/products';
      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save product');

      await loadProducts();
      setShowAddForm(false);
      setForm({ ...emptyForm });
    } catch (err: any) {
      setErr(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) await loadProducts();
      else alert('Failed to delete product');
    } catch (e) {
      alert('Error deleting product');
    }
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.category?.toLowerCase().includes(search.toLowerCase()));

  if (showAddForm) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 font-sans">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{editingId ? 'Edit Product' : 'Add New Product'}</h2>
            <p className="text-xs text-slate-500 mt-1">Fill out the product information below.</p>
          </div>
          <button onClick={() => setShowAddForm(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {err && <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">{err}</div>}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Product ID (Unique)</label>
              <input type="text" value={form.id} onChange={e => setForm({...form, id: e.target.value})} disabled={!!editingId} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none disabled:bg-slate-50 disabled:text-slate-500" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Product Name</label>
              <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Slug (URL friendly)</label>
              <input type="text" value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Category</label>
              <input type="text" value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" required />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Description</label>
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" required />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Image URL</label>
              <input type="text" value={form.image} onChange={e => setForm({...form, image: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" placeholder="https://res.cloudinary.com/..." />
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Features Dynamic List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Features</label>
              <button type="button" onClick={() => setForm({...form, features: [...form.features, '']})} className="text-emerald-600 hover:text-emerald-700 text-xs font-semibold flex items-center gap-1"><PlusCircle className="h-3.5 w-3.5"/> Add Feature</button>
            </div>
            <div className="space-y-2">
              {form.features.map((feat: string, idx: number) => (
                <div key={idx} className="flex items-center gap-2">
                  <input type="text" value={feat} onChange={e => {
                    const newF = [...form.features];
                    newF[idx] = e.target.value;
                    setForm({...form, features: newF});
                  }} className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" placeholder="E.g. AI monitoring + smart voltage correction" />
                  <button type="button" onClick={() => {
                    if (form.features.length > 1) {
                      const newF = form.features.filter((_:any, i:number) => i !== idx);
                      setForm({...form, features: newF});
                    }
                  }} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><MinusCircle className="h-4 w-4"/></button>
                </div>
              ))}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Specs Dynamic List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Specifications (Key / Value)</label>
              <button type="button" onClick={() => setForm({...form, specs: [...form.specs, {key: '', value: ''}]})} className="text-emerald-600 hover:text-emerald-700 text-xs font-semibold flex items-center gap-1"><PlusCircle className="h-3.5 w-3.5"/> Add Spec</button>
            </div>
            <div className="space-y-2">
              {form.specs.map((spec: any, idx: number) => (
                <div key={idx} className="flex items-center gap-2">
                  <input type="text" value={spec.key} onChange={e => {
                    const newS = [...form.specs];
                    newS[idx].key = e.target.value;
                    setForm({...form, specs: newS});
                  }} className="w-1/3 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" placeholder="E.g. Capacity Range" />
                  
                  <input type="text" value={spec.value} onChange={e => {
                    const newS = [...form.specs];
                    newS[idx].value = e.target.value;
                    setForm({...form, specs: newS});
                  }} className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" placeholder="E.g. 1 kVA - 3000 kVA" />
                  
                  <button type="button" onClick={() => {
                    if (form.specs.length > 1) {
                      const newS = form.specs.filter((_:any, i:number) => i !== idx);
                      setForm({...form, specs: newS});
                    }
                  }} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><MinusCircle className="h-4 w-4"/></button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 gap-3">
            <button type="button" onClick={() => setShowAddForm(false)} className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2">
              {saving ? 'Saving...' : <><Save className="h-4 w-4" /> Save Product</>}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Package className="h-6 w-6 text-emerald-600" />
              Products Management
            </h1>
            <p className="text-sm text-slate-500 mt-1">Manage the Voltrix product catalog</p>
          </div>
          <button onClick={handleAddNew} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all w-full sm:w-auto justify-center">
            <Plus className="h-4 w-4" /> Add Product
          </button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search products by name or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">No products found matching your search.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-3 px-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Image</th>
                  <th className="py-3 px-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Product details</th>
                  <th className="py-3 px-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Category</th>
                  <th className="py-3 px-4 text-[10px] font-black uppercase tracking-wider text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(product => (
                  <tr key={product.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="py-3 px-4">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-10 h-10 object-cover rounded-lg border border-slate-200" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                          <Package className="h-5 w-5 text-slate-300" />
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-sm">{product.name}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{product.id}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                        {product.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Edit Product"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
