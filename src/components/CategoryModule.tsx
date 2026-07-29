import { PageHeader } from './PageHeader';
import React, { useEffect, useState } from 'react';
import { Layers, FolderPlus, Edit, Trash2, Search, X, Network, Database, Hexagon, FolderTree, Package, Filter, SearchX } from 'lucide-react';
import { dbStore } from '../services/store';
import { Category, UserProfile, Product } from '../types/erp';

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
  const [products, setProducts] = useState<Product[]>(dbStore.getProducts(businessId));
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  // Form states
  const [formName, setFormName] = useState('');
  const [formParentId, setFormParentId] = useState<string>('');

  useEffect(() => {
    return dbStore.subscribe(() => {
      setCategories(dbStore.getCategories(businessId));
      setProducts(dbStore.getProducts(businessId));
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
      try {
        const result = dbStore.deleteCategory(id);
        if (result.success) {
          dbStore.logActivity(user.id, user.name, user.role, 'Delete Category', `Deleted category: ${name}`, businessId);
          triggerToast('Category removed successfully.', 'success');
          // Manual update for immediate feedback
          setCategories(dbStore.getCategories(businessId));
        } else {
          triggerToast(result.error || 'Category could not be deleted.', 'error');
        }
      } catch (err: any) {
        triggerToast(err.message || 'Error deleting category.', 'error');
      }
    }
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const topLevelCount = categories.filter(c => !c.parent_id).length;
  const subCategoryCount = categories.filter(c => c.parent_id).length;
  
  // Create hierarchical view for categories
  const getHierarchyDisplay = (catId: string, depth = 0): string => {
    const cat = categories.find(c => c.id === catId);
    if (!cat || !cat.parent_id) return '';
    const parent = categories.find(c => c.id === cat.parent_id);
    if (!parent) return '';
    return `${parent.name} > ${cat.name}`;
  };

  return (
    <div className="space-y-4 max-w-full pb-8 px-0 font-sans text-slate-900 dark:text-slate-100 overflow-x-hidden" id="category-module-root">
      <PageHeader
        title="Inventory Categories Master"
        subtitle="Configure parent-child taxonomies for cleaner SKU organization."
        icon={Layers}
        rightContent={
          <div className="flex flex-wrap gap-2">
            {user.role !== 'Viewer' && (
              <button 
                onClick={handleOpenAddModal}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-semibold cursor-pointer transition-colors shadow-sm"
              >
                <FolderPlus size={16} />
                <span>Create Category</span>
              </button>
            )}
          </div>
        }
      />

      <div className="px-0.5 sm:px-1 space-y-4">
        {/* KPI Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-2 sm:p-3 rounded-xl shadow-xs hover:shadow-md hover:border-slate-400 dark:hover:border-slate-600 transition-all cursor-default group flex flex-col justify-between gap-1">
            <div className="flex items-center gap-1.5">
              <div className="p-1.5 bg-slate-500/10 dark:bg-slate-500/20 text-slate-600 dark:text-slate-400 rounded-lg group-hover:scale-110 transition-transform shrink-0">
                <Database size={14} />
              </div>
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">TOTAL CATEGORIES</span>
            </div>
            <div className="text-right mt-1">
              <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {categories.length}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-2 sm:p-3 rounded-xl shadow-xs hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-600 transition-all cursor-default group flex flex-col justify-between gap-1">
            <div className="flex items-center gap-1.5">
              <div className="p-1.5 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg group-hover:scale-110 transition-transform shrink-0">
                <Network size={14} />
              </div>
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">PRIMARY LEVEL</span>
            </div>
            <div className="text-right mt-1">
              <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {topLevelCount}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-2 sm:p-3 rounded-xl shadow-xs hover:shadow-md hover:border-emerald-400 dark:hover:border-emerald-600 transition-all cursor-default group flex flex-col justify-between gap-1">
            <div className="flex items-center gap-1.5">
              <div className="p-1.5 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg group-hover:scale-110 transition-transform shrink-0">
                <FolderTree size={14} />
              </div>
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">SUBCATEGORIES</span>
            </div>
            <div className="text-right mt-1">
              <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {subCategoryCount}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-2 sm:p-3 rounded-xl shadow-xs hover:shadow-md hover:border-sky-400 dark:hover:border-sky-600 transition-all cursor-default group flex flex-col justify-between gap-1">
            <div className="flex items-center gap-1.5">
              <div className="p-1.5 bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 rounded-lg group-hover:scale-110 transition-transform shrink-0">
                <Hexagon size={14} />
              </div>
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">UNUSED</span>
            </div>
            <div className="text-right mt-1">
              <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {categories.filter(c => !products.some(p => p.category_id === c.id)).length}
              </span>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <div className="relative flex-1 flex items-center">
            <Search size={14} className="absolute left-3 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search category name or hierarchy..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-900 text-[11px] font-medium rounded-xl border border-black dark:border-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Compact List View */}
        <div className="bg-white dark:bg-slate-900 overflow-x-auto rounded-3xl border border-black dark:border-white shadow-sm mt-5">
          <table className="w-full text-left text-[11px] whitespace-nowrap">
            <thead className="bg-slate-700 dark:bg-slate-600 text-white font-bold uppercase tracking-wider border-b border-black dark:border-white text-[11px]">
              <tr>
                <th className="py-2.5 px-4">Category Name</th>
                <th className="py-2.5 px-4">Hierarchy Type</th>
                <th className="py-2.5 px-4">Usage Stats</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black dark:divide-white bg-white dark:bg-slate-900 text-[11px]">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                      <SearchX size={24} className="mb-2 opacity-50" />
                      <p className="font-bold text-xs">No categories found.</p>
                      <p className="text-[10px]">Try adjusting filters or create a new category.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat, idx) => {
                  const parent = categories.find(p => p.id === cat.parent_id);
                  const isPrimary = !parent;
                  const usageCount = products.filter(p => p.category_id === cat.id).length;
                  const subCount = categories.filter(c => c.parent_id === cat.id).length;

                  return (
                    <tr key={`${cat.id}-${idx}`} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1 text-[12px] flex items-center gap-1.5">
                            {!isPrimary && <FolderTree size={12} className="text-slate-400" />}
                            {cat.name}
                          </span>
                          {!isPrimary && (
                            <span className="text-[9px] text-slate-500 font-bold mt-0.5 flex items-center gap-1">
                              Parent: <span className="text-indigo-600 dark:text-indigo-400">{parent.name}</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isPrimary 
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300' 
                            : 'bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                        }`}>
                          {isPrimary ? 'Primary Level' : 'Subcategory'}
                        </span>
                      </td>
                      <td className="py-2 px-4">
                        <div className="flex gap-2 items-center">
                          <div className="flex items-center gap-1 text-[10px] text-slate-600 dark:text-slate-400">
                            <Package size={12} />
                            <span className="font-bold">{usageCount} items</span>
                          </div>
                          {isPrimary && subCount > 0 && (
                            <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 rounded">
                              <Network size={10} />
                              <span className="font-bold">{subCount} subs</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-4 text-right">
                        <div className="flex justify-end gap-1.5 items-center">
                          {user.role !== 'Viewer' && (
                            <>
                              <button
                                onClick={() => handleOpenEditModal(cat)}
                                className="p-1.5 text-slate-500 hover:text-sky-600 bg-slate-50 hover:bg-sky-50 dark:bg-slate-800 dark:hover:bg-sky-900/30 rounded transition-colors border border-slate-200 dark:border-slate-700"
                                title="Edit Category"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                className="p-1.5 text-slate-500 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-900/30 rounded transition-colors border border-slate-200 dark:border-slate-700"
                                title="Delete Category"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Add/Edit Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md flex flex-col overflow-hidden shadow-xl animate-in zoom-in duration-150">
            <div className="bg-slate-50 dark:bg-slate-800 px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between shrink-0">
              <h2 className="text-xs font-bold uppercase tracking-wider">
                {editingCategory ? 'Update Category' : 'Register New Category'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer transition-colors">
                <X size={18} />
              </button>
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
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-shadow"
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Parent Category (Optional)</label>
                <select 
                  value={formParentId}
                  onChange={(e) => setFormParentId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                >
                  <option value="">No Parent (Top-level Category)</option>
                  {categories
                    .filter(c => !editingCategory || c.id !== editingCategory.id) // avoid self parenting
                    .map((c, idx) => {
                       // prevent nesting into a child of this category (simple check)
                       if (editingCategory && c.parent_id === editingCategory.id) return null;
                       return (
                        <option key={`${c.id}-${idx}`} value={c.id}>
                          {c.parent_id ? '  ↳ ' : ''}{c.name}
                        </option>
                       );
                    })
                  }
                </select>
                <p className="text-[10px] text-slate-500 mt-1">Select a parent to create a subcategory hierarchy.</p>
              </div>
              
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-[11px] font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[11px] font-semibold hover:bg-indigo-700 cursor-pointer shadow-sm transition-colors"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
