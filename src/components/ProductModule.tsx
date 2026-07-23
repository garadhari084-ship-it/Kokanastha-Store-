import { PageHeader } from './PageHeader';
import React, { useState } from 'react';
import { 
  Package, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  FileSpreadsheet, 
  Printer, 
  Barcode, 
  CheckCircle, 
  AlertTriangle, 
  X,
  Upload,
  Layers,
  Sparkles
} from 'lucide-react';
import { dbStore } from '../services/store';
import { Product, Category, UserProfile } from '../types/erp';
import { Camera } from 'lucide-react';
import { BarcodeScanner } from './BarcodeScanner';

interface ProductModuleProps {
  businessId: string;
  user: UserProfile;
  triggerToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  openAddModalInitially?: boolean;
}

export const ProductModule: React.FC<ProductModuleProps> = ({ 
  businessId, 
  user, 
  triggerToast,
  openAddModalInitially = false
}) => {
  const [products, setProducts] = useState<Product[]>(dbStore.getProducts(businessId));
  const [categories] = useState<Category[]>(dbStore.getCategories(businessId));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStockStatus, setSelectedStockStatus] = useState('All');

  // Modal controls
  const [isModalOpen, setIsModalOpen] = useState(openAddModalInitially);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [printingBarcodeProduct, setPrintingBarcodeProduct] = useState<Product | null>(null);
  const [printLabelCount, setPrintLabelCount] = useState(10);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  // Form parameters
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formBarcode, setFormBarcode] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [formCategory, setFormCategory] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [formUnit, setFormUnit] = useState('Pcs');
  const [formHsn, setFormHsn] = useState('');
  const [formGst, setFormGst] = useState(18);
  const [formPurchasePrice, setFormPurchasePrice] = useState(0);
  const [formSellingPrice, setFormSellingPrice] = useState(0);
  const [formMrp, setFormMrp] = useState(0);
  const [formOpeningStock, setFormOpeningStock] = useState(0);
  const [formMinStock, setFormMinStock] = useState(5);
  const [formMaxStock, setFormMaxStock] = useState(1000);
  const [formImage, setFormImage] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formActive, setFormActive] = useState(true);

  const resetForm = () => {
    setFormName('');
    setFormSku('');
    setFormBarcode('');
    setFormCategory(categories[0]?.id || '');
    setFormBrand('');
    setFormUnit('Pcs');
    setFormHsn('');
    setFormGst(18);
    setFormPurchasePrice(0);
    setFormSellingPrice(0);
    setFormMrp(0);
    setFormOpeningStock(0);
    setFormMinStock(5);
    setFormMaxStock(1000);
    setFormImage('');
    setFormDescription('');
    setFormActive(true);
    setEditingProduct(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setFormName(prod.name);
    setFormSku(prod.sku);
    setFormBarcode(prod.barcode);
    setFormCategory(prod.category_id);
    setFormBrand(prod.brand || '');
    setFormUnit(prod.unit);
    setFormHsn(prod.hsn_code || '');
    setFormGst(prod.gst_rate);
    setFormPurchasePrice(prod.purchase_price);
    setFormSellingPrice(prod.selling_price);
    setFormMrp(prod.mrp);
    setFormOpeningStock(prod.opening_stock);
    setFormMinStock(prod.minimum_stock);
    setFormMaxStock(prod.maximum_stock);
    setFormImage(prod.image_url);
    setFormDescription(prod.description);
    setFormActive(prod.active);
    setIsModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim() || !formSku.trim() || !formBarcode.trim()) {
      triggerToast('Product Name, SKU, and Barcode are required parameters.', 'error');
      return;
    }

    try {
      if (editingProduct) {
        dbStore.updateProduct(editingProduct.id, {
          name: formName.trim(),
          sku: formSku.trim(),
          barcode: formBarcode.trim(),
          category_id: formCategory,
          brand: formBrand.trim(),
          unit: formUnit,
          hsn_code: formHsn.trim(),
          gst_rate: Number(formGst),
          purchase_price: Number(formPurchasePrice),
          selling_price: Number(formSellingPrice),
          mrp: Number(formMrp),
          minimum_stock: Number(formMinStock),
          maximum_stock: Number(formMaxStock),
          image_url: formImage.trim() || 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=300&q=80',
          description: formDescription.trim(),
          active: formActive
        });

        dbStore.logActivity(user.id, user.name, user.role, 'Update Product', `Updated product metadata for SKU: ${formSku}`, businessId);
        triggerToast('Product details updated successfully.', 'success');
      } else {
        // Create product
        dbStore.createProduct({
          name: formName.trim(),
          sku: formSku.trim(),
          barcode: formBarcode.trim(),
          qr_code: `${formSku}-QR`,
          category_id: formCategory,
          brand: formBrand.trim(),
          unit: formUnit,
          hsn_code: formHsn.trim(),
          gst_rate: Number(formGst),
          purchase_price: Number(formPurchasePrice),
          selling_price: Number(formSellingPrice),
          mrp: Number(formMrp),
          opening_stock: Number(formOpeningStock),
          minimum_stock: Number(formMinStock),
          maximum_stock: Number(formMaxStock),
          image_url: formImage.trim() || 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=300&q=80',
          description: formDescription.trim(),
          active: formActive,
          business_id: businessId
        });

        dbStore.logActivity(user.id, user.name, user.role, 'Create Product', `Added new product SKU: ${formSku} named: ${formName}`, businessId);
        triggerToast('Product registered in catalog successfully.', 'success');
      }

      setProducts(dbStore.getProducts(businessId));
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      triggerToast(err.message || 'Error occurred.', 'error');
    }
  };

  const handleDeleteProduct = (id: string, name: string) => {
    if (user.role === 'Viewer') {
      triggerToast('Unauthorized: Viewer accounts cannot modify inventory.', 'error');
      return;
    }

    if (window.confirm(`Are you sure you want to delete "${name}" from catalog?`)) {
      dbStore.deleteProduct(id);
      dbStore.logActivity(user.id, user.name, user.role, 'Delete Product', `Deleted catalog item: ${name}`, businessId);
      triggerToast('Product deleted from database.', 'success');
      setProducts(dbStore.getProducts(businessId));
    }
  };

  // Generate SKU / Barcode randomizer helpers
  const handleAutoGenerateCodes = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const prefix = dbStore.getSettings(businessId).invoice_prefix || 'ERP-';
    
    setFormSku(`${prefix}PROD-${randomSuffix}`);
    setFormBarcode(`890${Math.floor(1000000000 + Math.random() * 9000000000)}`);
    triggerToast('Randomized unique SKU & EAN Barcode identifiers generated.', 'info');
  };

  // Excel Bulk Export simulation
  const handleBulkExport = () => {
    dbStore.logActivity(user.id, user.name, user.role, 'Export Excel', 'Bulk exported entire product catalog', businessId);
    
    const headers = ['SKU', 'Product Name', 'Barcode', 'Brand', 'Unit', 'Purchase Price', 'Selling Price', 'Current Stock'];
    const rows = filteredProducts.map(p => [
      p.sku,
      p.name,
      p.barcode,
      p.brand || '',
      p.unit,
      p.purchase_price,
      p.selling_price,
      p.current_stock
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `catalog_export_${businessId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    triggerToast('Bulk product list exported to CSV sheet format.', 'success');
  };

  // Excel Bulk Import simulation
  const handleTriggerBulkImport = () => {
    // Add 3 beautiful tech/groceries products
    const initialLen = products.length;
    const isTech = businessId === 'b1111111-1111-1111-1111-111111111111';

    try {
      if (isTech) {
        dbStore.createProduct({
          name: 'Quantum Wireless Mouse v2',
          sku: 'ZTL-ACC-091',
          barcode: '4512938475999',
          qr_code: 'ZTL-ACC-091-QR',
          category_id: 'cat1_2',
          brand: 'SonicAura',
          unit: 'Pcs',
          hsn_code: '84716060',
          gst_rate: 18,
          purchase_price: 1500,
          selling_price: 2999,
          mrp: 3499,
          opening_stock: 40,
          minimum_stock: 5,
          maximum_stock: 200,
          image_url: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=300&q=80',
          description: 'Ergonomic multi-device mouse with adjustable DPI levels and silent buttons.',
          active: true,
          business_id: businessId
        });
        dbStore.createProduct({
          name: 'PixelView Portable Monitor 15.6',
          sku: 'ZTL-SMP-008',
          barcode: '4512938475888',
          qr_code: 'ZTL-SMP-008-QR',
          category_id: 'cat1_1',
          brand: 'AeroCorp',
          unit: 'Pcs',
          hsn_code: '85285200',
          gst_rate: 18,
          purchase_price: 9500,
          selling_price: 14999,
          mrp: 17999,
          opening_stock: 15,
          minimum_stock: 3,
          maximum_stock: 50,
          image_url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=300&q=80',
          description: 'Ultra-thin portable screen with HDMI and USB-C inputs, full HD resolution.',
          active: true,
          business_id: businessId
        });
      } else {
        dbStore.createProduct({
          name: 'Whole Grain Wheat Flour 10kg',
          sku: 'CFG-GRA-099',
          barcode: '8901234567103',
          qr_code: 'CFG-GRA-099-QR',
          category_id: 'cat2_2',
          brand: 'DeccanFields',
          unit: 'Bags',
          hsn_code: '11010000',
          gst_rate: 5,
          purchase_price: 310,
          selling_price: 450,
          mrp: 499,
          opening_stock: 80,
          minimum_stock: 15,
          maximum_stock: 300,
          image_url: 'https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?w=300&q=80',
          description: 'Premium quality organic whole wheat atta ground in traditional stone chakkis.',
          active: true,
          business_id: businessId
        });
      }

      dbStore.logActivity(user.id, user.name, user.role, 'Bulk Import', 'Uploaded sheet with bulk product data', businessId);
      triggerToast('Bulk import sheet processed. 2 new product rows appended.', 'success');
      setProducts(dbStore.getProducts(businessId));
      setIsBulkImportOpen(false);
    } catch (e: any) {
      triggerToast(e.message || 'Import failed.', 'error');
    }
  };

  // Barcode CSS-Based Vector Pattern Generator
  // Standard CODE-128 contains sequences of vertical bars with 4 thickness values.
  // We can generate a highly convincing real barcode visual by converting a string hash into a loop of 1px to 4px wide dark lines!
  const renderVisualBarcodeLines = (codeStr: string) => {
    // Basic deterministic mapping loop to render barcode columns
    const columns: React.ReactElement[] = [];
    const codeVal = codeStr || '890123456789';
    let lineIdx = 0;

    for (let charIdx = 0; charIdx < codeVal.length; charIdx++) {
      const numericVal = parseInt(codeVal[charIdx]) || (codeVal.charCodeAt(charIdx) % 10);
      
      // alternate dark lines and white lines
      const darkWidth = ((numericVal % 3) + 1) * 1.5; // 1.5px to 4.5px
      const spaceWidth = (((numericVal + 2) % 3) + 1) * 1.5;

      columns.push(
        <span 
          key={`bar-${charIdx}`} 
          className="bg-black inline-block h-12" 
          style={{ width: `${darkWidth}px` }}
        />
      );
      columns.push(
        <span 
          key={`space-${charIdx}`} 
          className="bg-white inline-block h-12" 
          style={{ width: `${spaceWidth}px` }}
        />
      );
    }

    return (
      <div className="flex bg-white p-2 border border-slate-200 justify-center items-center overflow-hidden h-16 rounded-sm">
        {columns}
      </div>
    );
  };

  // Barcode Printing Action
  const handlePrintBarcodeSubmit = () => {
    triggerToast(`Sent barcode template containing ${printLabelCount} sheets of "${printingBarcodeProduct?.name}" to print queue.`, 'success');
    dbStore.logActivity(user.id, user.name, user.role, 'Print Barcode', `Printed ${printLabelCount} barcodes for SKU: ${printingBarcodeProduct?.sku}`, businessId);
    setPrintingBarcodeProduct(null);
  };

  // Filters & Searches
  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery);

    const matchesCategory = selectedCategory === 'All' || p.category_id === selectedCategory;

    const lowLimit = dbStore.getSettings(businessId).low_stock_limit;
    const matchesStock = 
      selectedStockStatus === 'All' ||
      (selectedStockStatus === 'Low' && p.current_stock > 0 && p.current_stock <= lowLimit) ||
      (selectedStockStatus === 'Out' && p.current_stock === 0) ||
      (selectedStockStatus === 'Healthy' && p.current_stock > lowLimit);

    return matchesSearch && matchesCategory && matchesStock;
  });

  return (
    <div className="space-y-6 max-w-full pb-12 px-0 font-sans text-slate-900 dark:text-slate-100 overflow-x-hidden" id="product-catalog-root">
      <PageHeader
        title="Product Catalog & Barcode Master"
        subtitle="Track and manage inventory items, pricing margins, SKU catalogs, and barcode rendering."
        icon={Package}
        rightContent={
          <>
<div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setIsBulkImportOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold cursor-pointer"
          >
            <Upload size={16} className="text-indigo-600" />
            <span>Import Excel</span>
          </button>
          <button 
            onClick={handleBulkExport} 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold cursor-pointer"
          >
            <FileSpreadsheet size={16} className="text-emerald-600" />
            <span>Export Catalog</span>
          </button>
          {user.role !== 'Viewer' && (
            <button 
              onClick={handleOpenAddModal} 
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-semibold cursor-pointer"
            >
              <Plus size={16} />
              <span>Add Product</span>
            </button>
          )}
        </div>
          </>
        }
      />

      {/* Filter and Search Layout */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by product name, SKU SKU, barcode..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden"
          />
        </div>
        
        <div>
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden"
          >
            <option value="All">All Categories</option>
            {categories.map((c, idx) => (
              <option key={`${c.id}-${idx}`} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <select 
            value={selectedStockStatus}
            onChange={(e) => setSelectedStockStatus(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden"
          >
            <option value="All">All Stock Statuses</option>
            <option value="Healthy">Healthy Stock Level</option>
            <option value="Low">Low Stock Level Alerts</option>
            <option value="Out">Out Of Stock Logs</option>
          </select>
        </div>
      </div>

      {/* Main Catalog Cards / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((prod, idx) => {
          const category = categories.find(c => c.id === prod.category_id);
          const isLow = prod.current_stock > 0 && prod.current_stock <= dbStore.getSettings(businessId).low_stock_limit;
          const isOut = prod.current_stock === 0;

          return (
            <div 
              key={`${prod.id}-${idx}`} 
              className={`bg-white dark:bg-slate-900 rounded-xl overflow-x-auto border transition-all duration-150 relative ${
                isOut ? 'border-rose-100 dark:border-rose-950/20 shadow-xs ring-1 ring-rose-50' : 
                isLow ? 'border-amber-100 dark:border-amber-950/20 shadow-xs ring-1 ring-amber-50' : 
                'border-slate-100 dark:border-slate-800 hover:shadow-md'
              }`}
            >
              {/* Image thumbnail and status tags */}
              <div className="h-40 bg-slate-100 dark:bg-slate-800 relative">
                <img 
                  src={prod.image_url} 
                  alt={prod.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                
                {/* Out / Low labels */}
                {isOut && (
                  <span className="absolute top-2 left-2 bg-rose-600 text-white text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                    <AlertTriangle size={10} /> OUT OF STOCK
                  </span>
                )}
                {isLow && (
                  <span className="absolute top-2 left-2 bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                    <AlertTriangle size={10} /> LOW STOCK ({prod.current_stock})
                  </span>
                )}
                {!isOut && !isLow && (
                  <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                    <CheckCircle size={10} /> HEALTHY ({prod.current_stock})
                  </span>
                )}

                <span className="absolute bottom-2 right-2 bg-slate-950/70 text-white text-[10px] font-mono px-2 py-0.5 rounded">
                  {prod.unit}
                </span>
              </div>

              {/* Product Info details */}
              <div className="p-4 space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold uppercase">{category?.name || 'General'}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{prod.brand}</span>
                  </div>
                  <h3 className="text-[11px] font-bold text-slate-900 dark:text-slate-100 line-clamp-1" title={prod.name}>
                    {prod.name}
                  </h3>
                  <p className="text-[10px] text-slate-500 line-clamp-1">{prod.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 border-t border-b border-slate-100 dark:border-slate-800 py-2 font-mono text-[11px]">
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase">SKU:</span>
                    <strong className="text-slate-700 dark:text-slate-200">{prod.sku}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase">BARCODE:</span>
                    <strong className="text-slate-700 dark:text-slate-200">{prod.barcode}</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase">Purchase Price:</span>
                    <span className="font-mono text-slate-500">₹{prod.purchase_price.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase">Selling Price:</span>
                    <strong className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">₹{prod.selling_price.toLocaleString()}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase">MRP:</span>
                    <span className="font-mono text-slate-500 line-through">₹{prod.mrp.toLocaleString()}</span>
                  </div>
                </div>

                {/* Print Barcodes Button & Catalog controls */}
                <div className="flex items-center gap-1.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button 
                    onClick={() => setPrintingBarcodeProduct(prod)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold transition border border-slate-200 dark:border-slate-700 cursor-pointer"
                  >
                    <Barcode size={14} className="text-slate-500" />
                    <span>Barcode Sheet</span>
                  </button>
                  {user.role !== 'Viewer' && (
                    <>
                      <button 
                        onClick={() => handleOpenEditModal(prod)}
                        className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg cursor-pointer"
                        title="Edit"
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(prod.id, prod.name)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredProducts.length === 0 && (
          <div className="col-span-full text-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            <Package size={48} className="mx-auto mb-3 text-slate-300" />
            <p className="text-slate-400 text-xs">No items matching current filter conditions exist in your inventory.</p>
          </div>
        )}
      </div>

      {/* Barcode Print Setup Modal */}
      {printingBarcodeProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-in zoom-in duration-150">
            <div className="bg-slate-950 text-white px-6 py-4 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <Printer />
                <span>Barcode Generator & Print Station</span>
              </h2>
              <button onClick={() => setPrintingBarcodeProduct(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                <h3 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-2">{printingBarcodeProduct.name}</h3>
                
                {/* Dynamically Styled Barcode Lines */}
                {renderVisualBarcodeLines(printingBarcodeProduct.barcode)}
                
                <span className="font-mono text-[11px] text-slate-400 block mt-1 tracking-widest">{printingBarcodeProduct.barcode}</span>
                <span className="text-[10px] text-slate-400 font-mono">SKU: {printingBarcodeProduct.sku}</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Number of Labels to Print</label>
                <input 
                  type="number" 
                  min={1} 
                  max={500} 
                  value={printLabelCount}
                  onChange={(e) => setPrintLabelCount(Math.min(500, Math.max(1, Number(e.target.value))))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                />
                <span className="text-[10px] text-slate-400">Fits 24 labels per sheet (A4 standard format)</span>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  onClick={() => setPrintingBarcodeProduct(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold hover:bg-slate-200 cursor-pointer"
                >
                  Close
                </button>
                <button 
                  onClick={handlePrintBarcodeSubmit}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[11px] font-semibold hover:bg-indigo-700 cursor-pointer"
                >
                  Send to Printer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Dialog Modal */}
      {isBulkImportOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg overflow-hidden shadow-xl animate-in zoom-in duration-150">
            <div className="bg-slate-50 dark:bg-slate-800 px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                <Upload />
                <span>Bulk Import via Excel / CSV</span>
              </h2>
              <button onClick={() => setIsBulkImportOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-xl transition text-center space-y-2 cursor-pointer" onClick={handleTriggerBulkImport}>
                <Upload size={32} className="mx-auto text-slate-400" />
                <h3 className="text-[11px] font-bold text-slate-700 dark:text-slate-200">Drag & Drop Inventory Spreadsheet</h3>
                <p className="text-[10px] text-slate-400">or click here to search local directory files (.csv, .xlsx supported)</p>
                <div className="inline-block bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded text-[10px] font-semibold text-indigo-600 mt-2">
                  Use Preset Sample Sheet
                </div>
              </div>

              <div className="space-y-1 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg text-[11px] text-slate-500">
                <p className="font-semibold text-slate-700 dark:text-slate-300">Mandatory CSV Columns:</p>
                <p className="font-mono text-[10px]">SKU, Name, Barcode, SellingPrice, PurchasePrice, OpeningStock</p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button 
                  onClick={() => setIsBulkImportOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Add/Edit Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-3xl overflow-hidden shadow-xl animate-in zoom-in duration-150">
            <div className="bg-slate-50 dark:bg-slate-800 px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider">
                {editingProduct ? 'Update Inventory Catalog details' : 'Register New Catalog Item'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Product Name / Trade Title *</label>
                  <input 
                    type="text" 
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. AeroMax Pro 5G Phone"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Brand / Manufacturer</label>
                  <input 
                    type="text" 
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    placeholder="e.g. AeroCorp"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">SKU Code *</label>
                  <div className="flex gap-1.5">
                    <input 
                      type="text" 
                      required
                      value={formSku}
                      onChange={(e) => setFormSku(e.target.value)}
                      placeholder="ZTL-SMP-001"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden font-mono"
                    />
                    <button 
                      type="button"
                      onClick={handleAutoGenerateCodes}
                      className="px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-[11px]"
                      title="Auto Generate Codes"
                    >
                      <Sparkles size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1 col-span-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Scan Verification Barcode (Unique EAN/UPC) *</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      required
                      value={formBarcode}
                      onChange={(e) => setFormBarcode(e.target.value)}
                      placeholder="e.g. 4512938475012"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setIsScannerOpen(true)}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-lg text-[11px] font-semibold cursor-pointer shrink-0 flex items-center gap-1.5"
                      title="Scan Barcode with Camera"
                    >
                      <Camera size={14} />
                      <span className="hidden sm:inline">Scan</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Category Group</label>
                  <select 
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                  >
                    {categories.map((c, idx) => (
                      <option key={`${c.id}-${idx}`} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Unit of Measure (UOM)</label>
                  <select 
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                  >
                    <option value="Pcs">Pcs (Pieces)</option>
                    <option value="Bottles">Bottles</option>
                    <option value="Bags">Bags</option>
                    <option value="Boxes">Boxes</option>
                    <option value="Kg">Kg (Kilograms)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">HSN Tariff Code</label>
                  <input 
                    type="text" 
                    value={formHsn}
                    onChange={(e) => setFormHsn(e.target.value)}
                    placeholder="85171300"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">GST Rate %</label>
                  <select 
                    value={formGst}
                    onChange={(e) => setFormGst(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                  >
                    <option value={0}>0% (Tax Exempt)</option>
                    <option value={5}>5% (Grains/Essential)</option>
                    <option value={12}>12% (Dairy/Processed)</option>
                    <option value={18}>18% (Electronics/IT)</option>
                    <option value={28}>28% (Luxury Goods)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Purchase Cost (₹) *</label>
                  <input 
                    type="number" 
                    required
                    value={formPurchasePrice}
                    onChange={(e) => setFormPurchasePrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Selling Price (₹) *</label>
                  <input 
                    type="number" 
                    required
                    value={formSellingPrice}
                    onChange={(e) => setFormSellingPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">MRP (Maximum Retail) (₹) *</label>
                  <input 
                    type="number" 
                    required
                    value={formMrp}
                    onChange={(e) => setFormMrp(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden font-mono"
                  />
                </div>

                {!editingProduct && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Opening Stock Qty</label>
                    <input 
                      type="number" 
                      value={formOpeningStock}
                      onChange={(e) => setFormOpeningStock(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden font-mono"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Min Stock (Low-Stock Limit)</label>
                  <input 
                    type="number" 
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Max Stock (Safety limit)</label>
                  <input 
                    type="number" 
                    value={formMaxStock}
                    onChange={(e) => setFormMaxStock(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden font-mono"
                  />
                </div>

                <div className="space-y-1 col-span-3">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Product Image URL</label>
                  <input 
                    type="url" 
                    value={formImage}
                    onChange={(e) => setFormImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1 col-span-3">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Full Product Specifications</label>
                  <textarea 
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Detailed dimensions, features, notes..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                  />
                </div>

                <div className="col-span-3 flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="form-active" 
                    checked={formActive} 
                    onChange={(e) => setFormActive(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="form-active" className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">Mark as Active in Catalog</label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[11px] font-semibold hover:bg-indigo-700 cursor-pointer"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isScannerOpen && (
        <BarcodeScanner 
          onClose={() => setIsScannerOpen(false)}
          onScan={async (scannedData) => {
            setIsScannerOpen(false);
            try {
              // Try to parse as JSON if it's a rich QR code containing product info
              const data = JSON.parse(scannedData);
              
              if (data.barcode) setFormBarcode(data.barcode);
              else setFormBarcode(scannedData);
              
              if (data.name) setFormName(data.name);
              if (data.sku) setFormSku(data.sku);
              if (data.brand) setFormBrand(data.brand);
              if (data.unit) setFormUnit(data.unit);
              if (data.hsn_code) setFormHsn(data.hsn_code);
              if (data.gst_rate !== undefined) setFormGst(Number(data.gst_rate));
              if (data.purchase_price !== undefined) setFormPurchasePrice(Number(data.purchase_price));
              if (data.selling_price !== undefined) setFormSellingPrice(Number(data.selling_price));
              if (data.mrp !== undefined) setFormMrp(Number(data.mrp));
              if (data.description) setFormDescription(data.description);
              
              triggerToast('QR code scanned: Product info populated!', 'success');
            } catch (e) {
              // Not JSON, assume it's just a standard barcode string (EAN/UPC)
              setFormBarcode(scannedData);
              triggerToast('Barcode scanned successfully', 'success');
              
              // If it's a numeric barcode, let's try to fetch basic info from OpenFoodFacts
              if (/^\d{8,14}$/.test(scannedData)) {
                try {
                  triggerToast('Looking up product details online...', 'info');
                  const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${scannedData}.json`);
                  if (response.ok) {
                    const json = await response.json();
                    if (json && json.product) {
                      if (json.product.product_name) setFormName(json.product.product_name);
                      if (json.product.brands) setFormBrand(json.product.brands.split(',')[0]);
                      if (json.product.image_url) setFormImage(json.product.image_url);
                      triggerToast('Product details found and populated!', 'success');
                    } else {
                      triggerToast('Product not found in global database.', 'info');
                    }
                  }
                } catch (fetchErr) {
                  console.error('Failed to fetch from OpenFoodFacts', fetchErr);
                }
              }
            }
          }}
        />
      )}
    </div>
  );
};
