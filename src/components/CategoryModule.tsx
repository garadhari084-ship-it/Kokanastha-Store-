import { PageHeader } from './PageHeader';
import React, { useEffect, useState } from 'react';
import { Layers, FolderPlus, Edit, Trash2, Search, X } from 'lucide-react';
import { dbStore } from '../services/store';
import { Category, UserProfile } from '../types/erp';

interface CategoryModuleProps {
  businessId: string;
  user: UserProfile;
  triggerToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const CategoryModule: React.FC<CategoryModuleProps> = ({ 
  businessId, 
  user, 
  triggerToast 
}) => {
  const [categories, setCategories] = useState<Category[]>(dbStore.getCategories(businessId));
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formParentId, setFormParentId] = useState<string>('');
  useEffect(() => {
    return dbStore.subscribe(() => {
      setCategories(dbStore.getCategories(businessId));
    });
  }, [businessId]);


  const handleOpenAddModal = () => {
    setFormName('');
    setFormParentId('');
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormParentId(cat.parent_id || '');
    setIsModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    try {
      if (editingCategory) {
        dbStore.updateCategory(editingCategory.id, {
          name: formName.trim(),
          parent_id: formParentId || null
        });
        dbStore.logActivity(user.id, user.name, user.role, 'Update Category', `Updated category: ${formName}`, businessId);
        triggerToast('Category updated successfully.', 'success');
      } else {
        dbStore.createCategory({
          name: formName.trim(),
          parent_id: formParentId || null,
          business_id: businessId,
          active: true
        });
        dbStore.logActivity(user.id, user.name, user.role, 'Create Category', `Created category: ${formName}`, businessId);
        triggerToast('Category created successfully.', 'success');
      }

      setCategories(dbStore.getCategories(businessId));
      setIsModalOpen(false);
    } catch (e: any) {
      triggerToast(e.message || 'An error occurred.', 'error');
    }
  };

  const handleDeleteCategory = (id: string, name: string) => {
    if (user.role === 'Viewer') {
      triggerToast('Unauthorized to perform deletion.', 'error');
      return;
    }

    if (window.confirm(`Are you sure you want to delete Category "${name}"?`)) {
      dbStore.deleteCategory(id);
      dbStore.logActivity(user.id, user.name, user.role, 'Delete Category', `Deleted category: ${name}`, businessId);
      triggerToast('Category removed.', 'success');
      setCategories(dbStore.getCategories(businessId));
    }
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-full pb-12 px-0 font-sans text-slate-900 dark:text-slate-100 overflow-x-hidden" id="category-module-root">
      <PageHeader
        title="Inventory Categories Master"
        subtitle="Configure parent-child taxonomies for cleaner SKU organization."
        icon={Layers}
        rightContent={
          <>
{user.role !== 'Viewer' && (
          <button 
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-semibold cursor-pointer"
          >
            <FolderPlus size={16} />
            <span>Create Category</span>
          </button>
        )}
          </>
        }
      />

      <div className="px-0.5 sm:px-1 space-y-6">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs flex items-center gap-3">
        <Search size={16} className="text-slate-400" />
        <input 
          type="text" 
          placeholder="Search categories..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent text-[11px] outline-hidden text-slate-800 dark:text-slate-100"
        />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs overflow-x-auto overflow-y-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800 text-[11px] font-semibold uppercase text-slate-500 border-b border-slate-100 dark:border-slate-800">
              <th className="p-4">Category Name</th>
              <th className="p-4">Hierarchy Type</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
            {filteredCategories.map((cat, idx) => {
              const parent = categories.find(p => p.id === cat.parent_id);
              return (
                <tr key={`${cat.id}-${idx}`} className="hover:bg-slate-50/50">
                  <td className="p-4 font-semibold text-slate-900 dark:text-slate-100">
                    {cat.name}
                  </td>
                  <td className="p-4 font-mono text-slate-500">
                    {parent ? `Subcategory of "${parent.name}"` : 'Primary Level'}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-2">
                      {user.role !== 'Viewer' && (
                        <>
                          <button onClick={() => handleOpenEditModal(cat)} className="p-1 text-indigo-600 hover:bg-indigo-50 rounded cursor-pointer"><Edit size={14} /></button>
                          <button onClick={() => handleDeleteCategory(cat.id, cat.name)} className="p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"><Trash2 size={14} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredCategories.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center py-10 text-slate-400">No categories found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-xl animate-in zoom-in duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-[11px] font-bold uppercase tracking-wider">{editingCategory ? 'Edit Category' : 'Add Category'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400"><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Category Title *</label>
                <input 
                  type="text" 
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Storage Media"
                  className="w-full px-3 py-2 bg-slate-50 text-[11px] rounded-lg border focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Parent Category (Optional)</label>
                <select 
                  value={formParentId}
                  onChange={(e) => setFormParentId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 text-[11px] rounded-lg border"
                >
                  <option value="">No Parent (Top-level Category)</option>
                  {categories
                    .filter(c => !editingCategory || c.id !== editingCategory.id) // avoid self parenting
                    .map((c, idx) => (
                      <option key={`${c.id}-${idx}`} value={c.id}>{c.name}</option>
                    ))
                  }
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[11px] font-semibold">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
