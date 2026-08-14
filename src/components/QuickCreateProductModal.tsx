import React, { useState, useEffect } from 'react';
import { 
  X, 
  PackagePlus, 
  Sparkles, 
  Check, 
  Plus, 
  Layers, 
  DollarSign, 
  Tag, 
  Percent, 
  Boxes, 
  Barcode, 
  QrCode,
  ArrowRight,
  Info,
  RefreshCw
} from 'lucide-react';
import { dbStore } from '../services/store';
import { Product, Category, UserProfile } from '../types/erp';

interface QuickCreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  user: UserProfile;
  initialName?: string;
  currencySymbol: string;
  defaultTenantTax?: number;
  onProductCreated: (newProduct: Product, action: 'select' | 'add_to_order', initialQty: number) => void;
  triggerToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const QuickCreateProductModal: React.FC<QuickCreateProductModalProps> = ({
  isOpen,
  onClose,
  businessId,
  user,
  initialName = '',
  currencySymbol = '₹',
  defaultTenantTax = 0,
  onProductCreated,
  triggerToast
}) => {
  const [name, setName] = useState(initialName);
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brand, setBrand] = useState('');
  const [unit, setUnit] = useState('Packet');
  const [hsnCode, setHsnCode] = useState('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [mrp, setMrp] = useState<number | ''>('');
  const [purchasePrice, setPurchasePrice] = useState<number | ''>('');
  const [gstRate, setGstRate] = useState<number>(defaultTenantTax || 0);
  const [openingStock, setOpeningStock] = useState<number | ''>(0);
  const [minStock, setMinStock] = useState<number | ''>(5);
  const [description, setDescription] = useState('');
  const [addToOrderQty, setAddToOrderQty] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'basic' | 'pricing' | 'advanced'>('basic');

  // Multi-tier rates
  const [showMultiTier, setShowMultiTier] = useState(false);
  const [rateLmr, setRateLmr] = useState<number | ''>('');
  const [rateAbr, setRateAbr] = useState<number | ''>('');
  const [rateDdr, setRateDdr] = useState<number | ''>('');

  // Inline Category Creation
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Generate SKU helper
  const generateSkuFromName = (prodName: string) => {
    const clean = prodName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 5);
    const prefix = clean ? clean : 'SKU';
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${rand}`;
  };

  // Generate Barcode helper
  const generateBarcode = () => {
    const prefix = '890';
    const rand = Math.floor(100000000 + Math.random() * 900000000);
    return `${prefix}${rand}`;
  };

  useEffect(() => {
    if (isOpen) {
      const cats = dbStore.getCategories(businessId);
      setCategories(cats);
      if (cats.length > 0 && !categoryId) {
        setCategoryId(cats[0].id);
      }
      
      const initialVal = initialName.trim();
      setName(initialVal);
      const generatedSku = generateSkuFromName(initialVal);
      setSku(generatedSku);
      setBarcode(generateBarcode());
      setGstRate(defaultTenantTax || 0);
      setSellingPrice('');
      setMrp('');
      setPurchasePrice('');
      setRateLmr('');
      setRateAbr('');
      setRateDdr('');
      setOpeningStock(0);
      setAddToOrderQty(1);
      setShowMultiTier(false);
      setActiveTab('basic');
    }
  }, [isOpen, initialName, businessId, defaultTenantTax]);

  // When name changes, auto-suggest SKU if SKU was untouched or empty
  const handleNameChange = (val: string) => {
    setName(val);
    if (!sku || sku.startsWith('SKU-') || sku.includes('-')) {
      setSku(generateSkuFromName(val));
    }
  };

  // When selling price changes, auto-fill MRP if empty
  const handleSellingPriceChange = (val: string) => {
    if (val === '') {
      setSellingPrice('');
    } else {
      const num = parseFloat(val);
      const safeNum = isNaN(num) ? '' : num;
      setSellingPrice(safeNum);
      if (mrp === '' && typeof safeNum === 'number') {
        setMrp(safeNum);
      }
    }
  };

  // Quick Category creation
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      const created = dbStore.createCategory({
        name: newCategoryName.trim(),
        parent_id: null,
        business_id: businessId,
        active: true
      });
      const updatedCats = dbStore.getCategories(businessId);
      setCategories(updatedCats);
      setCategoryId(created.id);
      setNewCategoryName('');
      setIsCreatingCategory(false);
      triggerToast(`Category "${created.name}" created!`, 'success');
    } catch (err: any) {
      triggerToast(err.message || 'Failed to create category', 'error');
    }
  };

  const getAutoImage = (nameStr: string) => {
    const keywords = nameStr.toLowerCase().split(' ').slice(0, 3).join(',');
    return `https://loremflickr.com/400/400/${keywords}?lock=${Math.floor(Math.random() * 1000)}`;
  };

  const handleSaveProduct = (action: 'select' | 'add_to_order') => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      triggerToast('Product Name is required', 'error');
      setActiveTab('basic');
      return;
    }

    if (sellingPrice === '' || Number(sellingPrice) < 0) {
      triggerToast('Valid Selling Price is required', 'error');
      setActiveTab('basic');
      return;
    }

    const finalSku = sku.trim() || generateSkuFromName(trimmedName);
    const finalBarcode = barcode.trim() || generateBarcode();
    const finalSellingPrice = Number(sellingPrice) || 0;
    const finalMrp = mrp !== '' ? Number(mrp) : finalSellingPrice;
    const finalPurchasePrice = purchasePrice !== '' ? Number(purchasePrice) : 0;
    const finalOpeningStock = openingStock !== '' ? Number(openingStock) : 0;
    const finalMinStock = minStock !== '' ? Number(minStock) : 5;

    // Ensure category
    let finalCatId = categoryId;
    if (!finalCatId && categories.length > 0) {
      finalCatId = categories[0].id;
    }

    try {
      const newProduct = dbStore.createProduct({
        name: trimmedName,
        sku: finalSku,
        barcode: finalBarcode,
        qr_code: `${finalSku}-QR`,
        category_id: finalCatId,
        brand: brand.trim() || '',
        unit: unit || 'Packet',
        hsn_code: hsnCode.trim() || '',
        gst_rate: Number(gstRate) || 0,
        purchase_price: finalPurchasePrice,
        selling_price: finalSellingPrice,
        rate_nr: finalSellingPrice,
        rate_lmr: rateLmr !== '' && !isNaN(Number(rateLmr)) ? Number(rateLmr) : finalSellingPrice,
        rate_abr: rateAbr !== '' && !isNaN(Number(rateAbr)) ? Number(rateAbr) : finalSellingPrice,
        rate_ddr: rateDdr !== '' && !isNaN(Number(rateDdr)) ? Number(rateDdr) : finalSellingPrice,
        mrp: finalMrp,
        opening_stock: finalOpeningStock,
        minimum_stock: finalMinStock,
        maximum_stock: 500,
        image_url: getAutoImage(trimmedName),
        description: description.trim() || '',
        active: true,
        business_id: businessId,
        purchase_unit: unit,
        selling_unit: unit,
        auto_conversion: false
      });

      dbStore.logActivity(
        user.id,
        user.name,
        user.role,
        'Create Product',
        `Created product "${trimmedName}" (SKU: ${finalSku}) from Sales Order creation`,
        businessId
      );

      triggerToast(`Product "${trimmedName}" saved to Catalogue!`, 'success');
      onProductCreated(newProduct, action, Math.max(1, addToOrderQty || 1));
      onClose();
    } catch (err: any) {
      triggerToast(err.message || 'Failed to save product', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-xs border border-white/20">
              <PackagePlus size={20} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black tracking-wide uppercase">Quick Create Product</h3>
                <span className="bg-emerald-400/20 text-emerald-200 border border-emerald-300/30 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles size={10} /> Auto-Syncs to Catalogue
                </span>
              </div>
              <p className="text-[11px] text-indigo-100/80 font-medium">Create and instantly attach to your active Sales Order</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-indigo-100 hover:text-white hover:bg-white/15 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 px-4 pt-2 gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'basic'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <Tag size={13} />
            <span>Essential Details</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pricing')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'pricing'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <DollarSign size={13} />
            <span>Pricing & Multi-Tier Rates</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('advanced')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'advanced'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <Boxes size={13} />
            <span>Inventory & Codes</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* TAB 1: BASIC DETAILS */}
          {activeTab === 'basic' && (
            <div className="space-y-4 animate-in fade-in duration-100">
              
              {/* Product Name */}
              <div>
                <label className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider block mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder="e.g. Besan Ladoo 500g, Kaju Katli, Mixture..."
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-2 border-indigo-200 dark:border-indigo-900/60 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* SKU & Category Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider block">
                      Product SKU *
                    </label>
                    <button
                      type="button"
                      onClick={() => setSku(generateSkuFromName(name))}
                      className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                      title="Re-generate SKU"
                    >
                      <RefreshCw size={10} /> Auto-Gen
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. LADOO-500G"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs rounded-xl border border-slate-200 dark:border-slate-700 font-mono font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider block">
                      Category *
                    </label>
                    {!isCreatingCategory && (
                      <button
                        type="button"
                        onClick={() => setIsCreatingCategory(true)}
                        className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <Plus size={10} /> New Category
                      </button>
                    )}
                  </div>

                  {isCreatingCategory ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        placeholder="Category Name"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-indigo-300 rounded-lg focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleCreateCategory}
                        className="px-2.5 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700"
                      >
                        <Check size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCreatingCategory(false)}
                        className="p-1.5 text-slate-400 hover:text-slate-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs rounded-xl border border-slate-200 dark:border-slate-700 font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Selling Price & Unit Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 bg-indigo-50/40 dark:bg-indigo-950/20 p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
                <div className="sm:col-span-1">
                  <label className="text-[11px] font-black text-indigo-950 dark:text-indigo-200 uppercase tracking-wider block mb-1">
                    Selling Price ({currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    placeholder="0.00"
                    value={sellingPrice}
                    onChange={(e) => handleSellingPriceChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-black rounded-lg border border-indigo-200 dark:border-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1">
                    MRP ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    placeholder="0.00"
                    value={mrp}
                    onChange={(e) => setMrp(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none font-mono"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1">
                    Unit of Measure
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value="Packet">Packet</option>
                    <option value="Pcs">Pcs</option>
                    <option value="Kg">Kg</option>
                    <option value="Gm">Gm</option>
                    <option value="Box">Box</option>
                    <option value="Bottle">Bottle</option>
                    <option value="Litre">Litre</option>
                    <option value="Set">Set</option>
                    <option value="Unit">Unit</option>
                  </select>
                </div>
              </div>

              {/* GST Tax Rate quick pills */}
              <div>
                <label className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider block mb-1.5">
                  GST Tax Rate (%)
                </label>
                <div className="flex items-center gap-2">
                  {[0, 5, 12, 18, 28].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setGstRate(rate)}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
                        gstRate === rate
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {rate}%
                    </button>
                  ))}
                  <div className="w-20">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      placeholder="Custom %"
                      value={gstRate}
                      onChange={(e) => setGstRate(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 text-xs text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Add directly quantity selector */}
              <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200 dark:border-amber-800/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-500 text-white rounded-lg">
                    <Boxes size={14} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-amber-950 dark:text-amber-200">
                      Initial Quantity to Add
                    </div>
                    <div className="text-[10px] text-amber-700 dark:text-amber-400">
                      When clicking "Save & Add to Order"
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={1}
                    value={addToOrderQty}
                    onChange={(e) => setAddToOrderQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-16 px-2.5 py-1 text-center bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-lg text-xs font-black"
                  />
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-300">{unit}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRICING & MULTI-TIER RATES */}
          {activeTab === 'pricing' && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider block mb-1">
                    Normal Selling Price (NR) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    placeholder="0.00"
                    value={sellingPrice}
                    onChange={(e) => handleSellingPriceChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs rounded-xl border border-slate-200 dark:border-slate-700 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider block mb-1">
                    Purchase / Cost Price ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    placeholder="Cost price"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs rounded-xl border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Tag size={13} className="text-indigo-500" />
                    <span className="text-xs font-black uppercase text-slate-900 dark:text-slate-100">
                      Tiered Pricing Discounts (Optional)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowMultiTier(!showMultiTier)}
                    className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                  >
                    {showMultiTier ? 'Hide Tier Rates' : 'Configure Tier Rates'}
                  </button>
                </div>

                {showMultiTier ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase block mb-1">
                        Loyal Member Rate (LMR)
                      </label>
                      <input
                        type="number"
                        min={0}
                        placeholder={sellingPrice ? String(sellingPrice) : '0.00'}
                        value={rateLmr}
                        onChange={(e) => setRateLmr(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 text-xs rounded-lg border border-slate-200 dark:border-slate-700 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase block mb-1">
                        Advance Booking (ABR)
                      </label>
                      <input
                        type="number"
                        min={0}
                        placeholder={sellingPrice ? String(sellingPrice) : '0.00'}
                        value={rateAbr}
                        onChange={(e) => setRateAbr(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 text-xs rounded-lg border border-slate-200 dark:border-slate-700 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase block mb-1">
                        Diwali / Festive Rate (DDR)
                      </label>
                      <input
                        type="number"
                        min={0}
                        placeholder={sellingPrice ? String(sellingPrice) : '0.00'}
                        value={rateDdr}
                        onChange={(e) => setRateDdr(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 text-xs rounded-lg border border-slate-200 dark:border-slate-700 font-mono"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    If not specified, customer tier pricing will default to the normal selling price ({currencySymbol}{sellingPrice || '0'}).
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: INVENTORY & CODES */}
          {activeTab === 'advanced' && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider block">
                      Barcode / EAN
                    </label>
                    <button
                      type="button"
                      onClick={() => setBarcode(generateBarcode())}
                      className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <RefreshCw size={10} /> Auto-Gen
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. 8901234567890"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs rounded-xl border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider block mb-1">
                    HSN / SAC Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 21069099"
                    value={hsnCode}
                    onChange={(e) => setHsnCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs rounded-xl border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider block mb-1">
                    Opening Stock ({unit})
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={openingStock}
                    onChange={(e) => setOpeningStock(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs rounded-xl border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider block mb-1">
                    Min Stock Alert
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="5"
                    value={minStock}
                    onChange={(e) => setMinStock(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs rounded-xl border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider block mb-1">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. In-House / Brand"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs rounded-xl border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider block mb-1">
                  Product Description / Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional notes or packaging details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs rounded-xl border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleSaveProduct('select')}
              className="flex-1 sm:flex-none px-4 py-2 bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-slate-600 text-xs font-bold rounded-xl shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check size={14} />
              <span>Save & Select SKU</span>
            </button>

            <button
              type="button"
              onClick={() => handleSaveProduct('add_to_order')}
              className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} className="stroke-[3]" />
              <span>Save & Add to Order ({addToOrderQty})</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
