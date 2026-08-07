import { PageHeader } from './PageHeader';
import React, { useEffect, useState, useRef, useMemo } from 'react';
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
  FileDown,
  AlertCircle,
  Image as ImageIcon,
  Loader2,
  Layers,
  Sparkles,
  Boxes,
  PackagePlus,
  PackageCheck,
  History,
  ArrowDownUp,
  RefreshCw,
  Eye,
  Info,
  ChevronDown,
  Check
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { dbStore, isComboProduct } from '../services/store';
import { Product, Category, UserProfile, ComboItem, ComboHistoryLog } from '../types/erp';
import { Camera } from 'lucide-react';
import { BarcodeScanner } from './BarcodeScanner';
import ReactBarcode from 'react-barcode';

interface SearchableCategorySelectProps {
  categories: Category[];
  value: string;
  onChange: (catId: string) => void;
  onCategoryCreated?: (newCat: Category) => void;
  businessId: string;
  placeholder?: string;
}

const SearchableCategorySelect: React.FC<SearchableCategorySelectProps> = ({
  categories,
  value,
  onChange,
  onCategoryCreated,
  businessId,
  placeholder = "Search or select category..."
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedCategory = categories.find(c => c.id === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCategories = categories.filter(c => {
    const parent = categories.find(p => p.id === c.parent_id);
    const fullName = parent ? `${parent.name} > ${c.name}` : c.name;
    return fullName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const exactMatch = categories.some(c => c.name.toLowerCase() === searchQuery.trim().toLowerCase());

  const handleSelect = (catId: string) => {
    onChange(catId);
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleCreateNew = () => {
    if (!searchQuery.trim()) return;
    const newCat = dbStore.createCategory({
      name: searchQuery.trim(),
      parent_id: null,
      business_id: businessId,
      active: true,
    });
    if (onCategoryCreated) {
      onCategoryCreated(newCat);
    }
    onChange(newCat.id);
    setSearchQuery('');
    setIsOpen(false);
  };

  const getCategoryLabel = (c: Category) => {
    const parent = categories.find(p => p.id === c.parent_id);
    return parent ? `${parent.name} > ${c.name}` : c.name;
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors shadow-2xs"
      >
        <span className="truncate text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <Filter size={12} className="text-indigo-500 shrink-0" />
          {selectedCategory ? (
            getCategoryLabel(selectedCategory)
          ) : (
            <span className="text-slate-400 font-normal">{placeholder}</span>
          )}
        </span>
        <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-2 space-y-1.5 animate-in fade-in zoom-in-95 duration-100">
          <div className="relative flex items-center">
            <Search size={12} className="absolute left-2.5 text-slate-400" />
            <input 
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search or type category..."
              className="w-full pl-8 pr-7 py-1 bg-slate-100 dark:bg-slate-800 text-[11px] font-bold rounded-md border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-indigo-500 dark:text-white"
            />
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => setSearchQuery('')} 
                className="absolute right-2 text-slate-400 hover:text-slate-600"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div className="max-h-48 overflow-y-auto space-y-0.5 text-[11px] custom-scrollbar">
            {filteredCategories.length > 0 ? (
              filteredCategories.map(c => {
                const isSelected = c.id === value;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelect(c.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg font-bold flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected 
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50' 
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{getCategoryLabel(c)}</span>
                    {isSelected && <Check size={12} className="text-indigo-600 dark:text-indigo-400" />}
                  </button>
                );
              })
            ) : (
              <div className="px-2 py-2 text-center text-slate-400 text-[10px]">
                No matching category found
              </div>
            )}

            {searchQuery.trim() && !exactMatch && (
              <button
                type="button"
                onClick={handleCreateNew}
                className="w-full text-left px-2.5 py-1.5 rounded-lg font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 flex items-center gap-1.5 border border-indigo-200 dark:border-indigo-800 mt-1 cursor-pointer"
              >
                <Plus size={12} />
                <span>Create category "{searchQuery.trim()}"</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

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
  const [categories, setCategories] = useState<Category[]>(dbStore.getCategories(businessId));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStockStatus, setSelectedStockStatus] = useState('All');
  const [selectedType, setSelectedType] = useState<'All' | 'Product' | 'Combo'>('All');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedStockStatus, selectedType]);

  // Standard Product Modal controls
  const [isModalOpen, setIsModalOpen] = useState(openAddModalInitially);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [printingBarcodeProduct, setPrintingBarcodeProduct] = useState<Product | null>(null);
  const [printLabelCount, setPrintLabelCount] = useState(10);
  const [printLabelSize, setPrintLabelSize] = useState<'50x25' | '50x38' | '38x25' | 'standard'>('50x25');
  const [printLabelsPerRow, setPrintLabelsPerRow] = useState<1 | 2>(1);
  const [printSalePrice, setPrintSalePrice] = useState<number | string>('');
  const [printMrp, setPrintMrp] = useState<number | string>('');
  const [printPackedOn, setPrintPackedOn] = useState(new Date().toISOString().split('T')[0]);
  const [printExpiryOn, setPrintExpiryOn] = useState('');
  const [printCompanyName, setPrintCompanyName] = useState('KOKANASTHA');

  useEffect(() => {
    if (printingBarcodeProduct) {
      setPrintSalePrice(printingBarcodeProduct.selling_price || 0);
      setPrintMrp(printingBarcodeProduct.mrp || printingBarcodeProduct.selling_price || 0);
    }
  }, [printingBarcodeProduct]);
  // Excel Import controls
  const excelFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<{
    fileName: string;
    progressPercent: number;
    statusText: string;
    processedRows: number;
    totalRows: number;
  } | null>(null);

  const [importSummaryModal, setImportSummaryModal] = useState<{
    isOpen: boolean;
    importedCount: number;
    skippedCount: number;
    skippedDetails: { rowNum: number; name: string; reason: string }[];
  }>({
    isOpen: false,
    importedCount: 0,
    skippedCount: 0,
    skippedDetails: []
  });

  // Combo Box Modal Controls
  const [isComboModalOpen, setIsComboModalOpen] = useState(false);
  const [editingCombo, setEditingCombo] = useState<Product | null>(null);
  const [comboItems, setComboItems] = useState<ComboItem[]>([]);
  const [selectedDropdownProdId, setSelectedDropdownProdId] = useState('');
  const [selectedDropdownQty, setSelectedDropdownQty] = useState<number>(1);

  // Packing Modal State
  const [isPackModalOpen, setIsPackModalOpen] = useState(false);
  const [packingCombo, setPackingCombo] = useState<Product | null>(null);
  const [packQty, setPackQty] = useState<number>(1);
  const [packError, setPackError] = useState<{
    message: string;
    missingItems?: { productName: string; required: number; available: number; missing: number }[];
  } | null>(null);

  // Breaking/Unpacking Modal State
  const [isBreakModalOpen, setIsBreakModalOpen] = useState(false);
  const [breakingCombo, setBreakingCombo] = useState<Product | null>(null);
  const [breakQty, setBreakQty] = useState<number>(1);
  const [breakReason, setBreakReason] = useState<string>('Unpacking for individual loose product demand');

  // Combo Audit & Details Drawer State
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [viewingCombo, setViewingCombo] = useState<Product | null>(null);

  // Delete Confirmation State
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Standard Form parameters
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formBarcode, setFormBarcode] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [formCategory, setFormCategory] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [formUnit, setFormUnit] = useState('Pcs');
  const [formHsn, setFormHsn] = useState('');
  const [formGst, setFormGst] = useState<number>(() => {
    const biz = dbStore.getBusiness(businessId);
    return typeof biz?.tax_rate_default === 'number' && !isNaN(biz.tax_rate_default) ? biz.tax_rate_default : 0;
  });
  const [formPurchasePrice, setFormPurchasePrice] = useState<number | string>('');
  const [formSellingPrice, setFormSellingPrice] = useState<number | string>('');
  const [formRateLmr, setFormRateLmr] = useState<number | string>('');
  const [formRateAbr, setFormRateAbr] = useState<number | string>('');
  const [formRateDdr, setFormRateDdr] = useState<number | string>('');
  const [formMrp, setFormMrp] = useState<number | string>('');
  const [formOpeningStock, setFormOpeningStock] = useState<number | string>('');
  const [formMinStock, setFormMinStock] = useState<number | string>('');
  const [formMaxStock, setFormMaxStock] = useState<number | string>('');
  const [formImage, setFormImage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formPurchaseUnit, setFormPurchaseUnit] = useState('Kg');
  const [formSellingUnit, setFormSellingUnit] = useState('Packet');
  const [formPackSize, setFormPackSize] = useState<number | string>('');
  const [formAutoConversion, setFormAutoConversion] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, etc)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('File size too large. Please upload an image under 2MB.');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFormImage(base64);
      setIsUploading(false);
    };
    reader.onerror = () => {
      alert('Failed to read file');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const [formDescription, setFormDescription] = useState('');
  const [formActive, setFormActive] = useState(true);

  // Quick Category Inline Creation State
  const [isQuickCategoryOpen, setIsQuickCategoryOpen] = useState(false);
  const [quickCategoryName, setQuickCategoryName] = useState('');

  const handleCreateQuickCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCategoryName.trim()) {
      triggerToast('Please enter a category name.', 'error');
      return;
    }
    const newCat = dbStore.createCategory({
      name: quickCategoryName.trim(),
      parent_id: null,
      business_id: businessId,
      active: true,
    });
    const updatedCats = dbStore.getCategories(businessId);
    setCategories(updatedCats);
    setFormCategory(newCat.id);
    setQuickCategoryName('');
    setIsQuickCategoryOpen(false);
    triggerToast(`Created category "${newCat.name}" successfully!`, 'success');
  };

  const generateRandomBarcode = () => '89012345' + Math.floor(10000 + Math.random() * 90000);
  const generateRandomSku = () => 'SKU-PRD-' + Math.floor(100 + Math.random() * 900);

  const resetForm = () => {
    const currentBiz = dbStore.getBusiness(businessId);
    const currentCats = dbStore.getCategories(businessId);
    setCategories(currentCats);
    setFormName('');
    setFormSku(generateRandomSku());
    setFormBarcode(generateRandomBarcode());
    setFormCategory(currentCats[0]?.id || '');
    setFormBrand('');
    setFormUnit('Pcs');
    setFormHsn('');
    setFormGst(typeof currentBiz?.tax_rate_default === 'number' && !isNaN(currentBiz.tax_rate_default) ? currentBiz.tax_rate_default : 0);
    setFormPurchasePrice('');
    setFormSellingPrice('');
    setFormRateLmr('');
    setFormRateAbr('');
    setFormRateDdr('');
    setFormMrp('');
    setFormOpeningStock('');
    setFormMinStock('');
    setFormMaxStock('');
    setFormImage('');
    setFormDescription('');
    setFormActive(true);
    setFormPurchaseUnit('Kg');
    setFormSellingUnit('Packet');
    setFormPackSize('');
    setFormAutoConversion(false);
    setEditingProduct(null);
  };

  useEffect(() => {
    return dbStore.subscribe(() => {
      setProducts(dbStore.getProducts(businessId));
      setCategories(dbStore.getCategories(businessId));
    });
  }, [businessId]);

  useEffect(() => {
    if (printingBarcodeProduct) {
      setPrintSalePrice(printingBarcodeProduct.selling_price || '');
      setPrintMrp(printingBarcodeProduct.mrp || '');
      setPrintPackedOn(new Date().toISOString().split('T')[0]);
      // Default expiry to 6 months later
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 6);
      setPrintExpiryOn(expiryDate.toISOString().split('T')[0]);
      setPrintCompanyName('KOKANASTHA');
    }
  }, [printingBarcodeProduct]);

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (prod: Product) => {
    if (isComboProduct(prod)) {
      handleOpenEditComboModal(prod);
      return;
    }
    setEditingProduct(prod);
    setFormName(prod.name);
    setFormSku(prod.sku || generateRandomSku());
    setFormBarcode(prod.barcode || generateRandomBarcode());
    setFormCategory(prod.category_id || categories[0]?.id || '');
    setFormBrand(prod.brand || '');
    setFormUnit(prod.unit);
    setFormHsn(prod.hsn_code || '');
    setFormGst(prod.gst_rate);
    setFormPurchasePrice(prod.purchase_price);
    setFormSellingPrice(prod.selling_price);
    setFormRateLmr(prod.rate_lmr ?? prod.selling_price);
    setFormRateAbr(prod.rate_abr ?? prod.selling_price);
    setFormRateDdr(prod.rate_ddr ?? prod.selling_price);
    setFormMrp(prod.mrp);
    setFormOpeningStock(prod.opening_stock);
    setFormMinStock(prod.minimum_stock);
    setFormMaxStock(prod.maximum_stock);
    setFormImage(prod.image_url);
    setFormDescription(prod.description);
    setFormActive(prod.active);
    setFormPurchaseUnit(prod.purchase_unit || 'Kg');
    setFormSellingUnit(prod.selling_unit || 'Packet');
    setFormPackSize(prod.pack_size || '');
    setFormAutoConversion(prod.auto_conversion || false);
    setIsModalOpen(true);
  };

  // ==================== COMBO BOX HANDLERS ====================
  const handleOpenAddComboModal = () => {
    setEditingCombo(null);
    setFormName('');
    setFormSku('SKU-CMB-' + Math.floor(100 + Math.random() * 900));
    setFormBarcode('890123450' + Math.floor(1000 + Math.random() * 9000));
    setFormCategory(categories[0]?.id || '');
    setFormBrand('Festive Hampers');
    setFormUnit('Box');
    setFormGst(5);
    setFormPurchasePrice('');
    setFormSellingPrice('');
    setFormRateLmr('');
    setFormRateAbr('');
    setFormRateDdr('');
    setFormMrp('');
    setFormOpeningStock(10);
    setFormImage('https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=400&q=80');
    setFormDescription('Curated festive product bundle hamper box.');
    setFormActive(true);

    const looseProds = products.filter(p => !isComboProduct(p));
    setComboItems([]);
    setSelectedDropdownProdId('');
    setSelectedDropdownQty(1);
    setIsComboModalOpen(true);
  };

  const handleOpenEditComboModal = (combo: Product) => {
    setEditingCombo(combo);
    setFormName(combo.name);
    setFormSku(combo.sku);
    setFormBarcode(combo.barcode);
    setFormCategory(combo.category_id);
    setFormBrand(combo.brand || 'Festive Hampers');
    setFormUnit(combo.unit || 'Box');
    setFormGst(combo.gst_rate || 5);
    setFormPurchasePrice(combo.purchase_price);
    setFormSellingPrice(combo.selling_price);
    setFormRateLmr(combo.rate_lmr ?? combo.selling_price);
    setFormRateAbr(combo.rate_abr ?? combo.selling_price);
    setFormRateDdr(combo.rate_ddr ?? combo.selling_price);
    setFormMrp(combo.mrp);
    setFormOpeningStock(combo.opening_stock ?? combo.current_stock);
    setFormImage(combo.image_url);
    setFormDescription(combo.description);
    setFormActive(combo.active);
    setComboItems(combo.combo_items || []);
    setSelectedDropdownProdId('');
    setSelectedDropdownQty(1);
    setIsComboModalOpen(true);
  };

  const handleSaveCombo = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim() || !formSku.trim() || !formBarcode.trim()) {
      triggerToast('Combo Name, SKU, and Barcode are required.', 'error');
      return;
    }

    if (comboItems.length === 0) {
      triggerToast('Please add at least one component product to this Combo Box.', 'error');
      return;
    }

    const openingStockVal = formOpeningStock !== '' && !isNaN(Number(formOpeningStock)) ? Number(formOpeningStock) : 0;

    // Validate component product stock availability
    for (const ci of comboItems) {
      const prod = products.find(p => p.id === ci.product_id);
      if (!prod) {
        triggerToast('One or more component products in the bundle are invalid.', 'error');
        return;
      }
      
      const stockToAllocate = editingCombo 
        ? Math.max(0, openingStockVal - editingCombo.current_stock) 
        : openingStockVal;
      
      const totalReqQty = ci.qty * stockToAllocate;

      if (prod.current_stock <= 0 && totalReqQty > 0) {
        triggerToast(`Cannot create combo box. "${prod.name}" is out of stock (Available: 0 ${prod.unit}).`, 'error');
        return;
      }
      if (totalReqQty > prod.current_stock) {
        triggerToast(`Cannot allocate stock for ${openingStockVal} combo box(es). "${prod.name}" has only ${prod.current_stock} ${prod.unit} available in stock (Required: ${totalReqQty} ${prod.unit}).`, 'error');
        return;
      }
    }

    // Calculate total cost price from components
    const componentCost = comboItems.reduce((acc, ci) => {
      const p = products.find(prod => prod.id === ci.product_id);
      return acc + (p ? p.purchase_price * ci.qty : 0);
    }, 0);

    const costPrice = formPurchasePrice !== '' && !isNaN(Number(formPurchasePrice)) ? Number(formPurchasePrice) : componentCost;
    const sellPrice = formSellingPrice !== '' && !isNaN(Number(formSellingPrice)) ? Number(formSellingPrice) : componentCost;
    const mrpVal = formMrp !== '' && !isNaN(Number(formMrp)) ? Number(formMrp) : sellPrice * 1.2;

    try {
      if (editingCombo) {
        dbStore.updateComboBox(editingCombo.id, {
          name: formName.trim(),
          sku: formSku.trim(),
          barcode: formBarcode.trim(),
          category_id: formCategory,
          brand: formBrand.trim(),
          unit: formUnit.trim() || 'Box',
          gst_rate: Number(formGst),
          purchase_price: costPrice,
          selling_price: sellPrice,
          rate_nr: sellPrice,
          rate_lmr: formRateLmr !== '' && !isNaN(Number(formRateLmr)) ? Number(formRateLmr) : sellPrice,
          rate_abr: formRateAbr !== '' && !isNaN(Number(formRateAbr)) ? Number(formRateAbr) : sellPrice,
          rate_ddr: formRateDdr !== '' && !isNaN(Number(formRateDdr)) ? Number(formRateDdr) : sellPrice,
          mrp: mrpVal,
          opening_stock: openingStockVal,
          current_stock: openingStockVal,
          image_url: formImage.trim() || 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=400&q=80',
          description: formDescription.trim(),
          active: formActive,
          combo_items: comboItems
        }, user.name);

        triggerToast(`Combo Box "${formName}" updated successfully.`, 'success');
        setSelectedType('Combo');
      } else {
        dbStore.createComboBox({
          name: formName.trim(),
          sku: formSku.trim(),
          barcode: formBarcode.trim(),
          qr_code: `${formSku.trim()}-QR`,
          category_id: formCategory,
          brand: formBrand.trim(),
          unit: formUnit.trim() || 'Box',
          hsn_code: formHsn.trim() || '2106',
          gst_rate: Number(formGst),
          purchase_price: costPrice,
          selling_price: sellPrice,
          rate_nr: sellPrice,
          rate_lmr: formRateLmr !== '' && !isNaN(Number(formRateLmr)) ? Number(formRateLmr) : sellPrice,
          rate_abr: formRateAbr !== '' && !isNaN(Number(formRateAbr)) ? Number(formRateAbr) : sellPrice,
          rate_ddr: formRateDdr !== '' && !isNaN(Number(formRateDdr)) ? Number(formRateDdr) : sellPrice,
          mrp: mrpVal,
          opening_stock: openingStockVal,
          minimum_stock: Number(formMinStock) || 2,
          maximum_stock: Number(formMaxStock) || 50,
          image_url: formImage.trim() || 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=400&q=80',
          description: formDescription.trim(),
          active: formActive,
          business_id: businessId,
          combo_items: comboItems
        }, user.name);

        triggerToast(`New Combo Box "${formName}" created and added to catalog.`, 'success');
        setSelectedType('Combo');
      }

      setProducts(dbStore.getProducts(businessId));
      setSelectedType('Combo');
      setIsComboModalOpen(false);
    } catch (err: any) {
      triggerToast(err.message || 'Failed to save Combo Box', 'error');
    }
  };

  // Pack Combo Action
  const handlePackComboSubmit = () => {
    if (!packingCombo) return;
    setPackError(null);

    const result = dbStore.packCombo(businessId, packingCombo.id, packQty, user.name);
    if (!result.success) {
      setPackError({
        message: result.error || 'Failed to pack combo box.',
        missingItems: result.missingItems
      });
      triggerToast(result.error || 'Insufficient stock to pack combo.', 'error');
      return;
    }

    triggerToast(`Successfully packed ${packQty} units of "${packingCombo.name}". Component stocks updated.`, 'success');
    setProducts(dbStore.getProducts(businessId));
    setIsPackModalOpen(false);
    setPackingCombo(null);
  };

  // Unpack / Break Combo Action
  const handleBreakComboSubmit = () => {
    if (!breakingCombo) return;

    const result = dbStore.breakCombo(businessId, breakingCombo.id, breakQty, user.name, breakReason);
    if (!result.success) {
      triggerToast(result.error || 'Failed to break combo box.', 'error');
      return;
    }

    triggerToast(`Successfully unpacked ${breakQty} units of "${breakingCombo.name}". Components returned to loose inventory.`, 'success');
    setProducts(dbStore.getProducts(businessId));
    setIsBreakModalOpen(false);
    setBreakingCombo(null);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();

    const barcodeVal = formBarcode.trim() || generateRandomBarcode();
    const skuVal = formSku.trim() || generateRandomSku();
    const categoryVal = formCategory || categories[0]?.id || '';

    if (!formName.trim()) {
      triggerToast('Product Name is required parameter.', 'error');
      return;
    }

    try {
      const getAutoImage = (name: string) => {
        const keywords = name.toLowerCase().split(' ').slice(0, 3).join(',');
        return `https://loremflickr.com/400/400/${keywords}?lock=${Math.floor(Math.random() * 1000)}`;
      };

      if (editingProduct) {
        dbStore.updateProduct(editingProduct.id, {
          name: formName.trim(),
          sku: skuVal,
          barcode: barcodeVal,
          category_id: categoryVal,
          brand: formBrand.trim(),
          unit: formUnit,
          hsn_code: formHsn.trim(),
          gst_rate: Number(formGst),
          purchase_price: Number(formPurchasePrice),
          selling_price: Number(formSellingPrice),
          rate_nr: Number(formSellingPrice),
          rate_lmr: formRateLmr !== '' && !isNaN(Number(formRateLmr)) ? Number(formRateLmr) : Number(formSellingPrice),
          rate_abr: formRateAbr !== '' && !isNaN(Number(formRateAbr)) ? Number(formRateAbr) : Number(formSellingPrice),
          rate_ddr: formRateDdr !== '' && !isNaN(Number(formRateDdr)) ? Number(formRateDdr) : Number(formSellingPrice),
          mrp: Number(formMrp),
          minimum_stock: Number(formMinStock),
          maximum_stock: Number(formMaxStock),
          image_url: formImage.trim() || getAutoImage(formName.trim()),
          description: formDescription.trim(),
          active: formActive,
          purchase_unit: formPurchaseUnit,
          selling_unit: formSellingUnit,
          pack_size: Number(formPackSize) || undefined,
          auto_conversion: formAutoConversion
        });

        dbStore.logActivity(user.id, user.name, user.role, 'Update Product', `Updated product metadata for SKU: ${formSku}`, businessId);
        triggerToast('Product details updated successfully.', 'success');
      } else {
        dbStore.createProduct({
          name: formName.trim(),
          sku: skuVal,
          barcode: barcodeVal,
          qr_code: `${skuVal}-QR`,
          category_id: categoryVal,
          brand: formBrand.trim(),
          unit: formUnit,
          hsn_code: formHsn.trim(),
          gst_rate: Number(formGst),
          purchase_price: Number(formPurchasePrice),
          selling_price: Number(formSellingPrice),
          rate_nr: Number(formSellingPrice),
          rate_lmr: formRateLmr !== '' && !isNaN(Number(formRateLmr)) ? Number(formRateLmr) : Number(formSellingPrice),
          rate_abr: formRateAbr !== '' && !isNaN(Number(formRateAbr)) ? Number(formRateAbr) : Number(formSellingPrice),
          rate_ddr: formRateDdr !== '' && !isNaN(Number(formRateDdr)) ? Number(formRateDdr) : Number(formSellingPrice),
          mrp: Number(formMrp),
          opening_stock: Number(formOpeningStock) || 0,
          minimum_stock: Number(formMinStock) || 5,
          maximum_stock: Number(formMaxStock) || 100,
          image_url: formImage.trim() || getAutoImage(formName.trim()),
          description: formDescription.trim(),
          active: formActive,
          business_id: businessId,
          purchase_unit: formPurchaseUnit,
          selling_unit: formSellingUnit,
          pack_size: Number(formPackSize) || undefined,
          auto_conversion: formAutoConversion
        });

        dbStore.logActivity(user.id, user.name, user.role, 'Create Product', `Created new SKU: ${formSku}`, businessId);
        triggerToast('New product added to inventory catalog.', 'success');
        setSelectedType('Product');
      }

      setProducts(dbStore.getProducts(businessId));
      setIsModalOpen(false);
      resetForm();
    } catch (e: any) {
      triggerToast(e.message || 'Operation failed.', 'error');
    }
  };

  const handleDownloadSampleExcel = () => {
    try {
      const sampleRows = [
        {
          'Product Name': 'Basmati Rice 5kg',
          'SKU': 'RICE-BAS-5K',
          'Barcode': '8901234567890',
          'Category': 'Grocery',
          'Purchase Price': 350,
          'Selling Price': 420,
          'MRP': 450,
          'GST Rate (%)': 5,
          'Opening Stock': 50,
          'Minimum Stock': 10,
          'Purchase Unit': 'BAG',
          'Selling Unit': 'BAG',
          'Description': 'Premium long grain basmati rice'
        },
        {
          'Product Name': 'Refined Sunflower Oil 1L',
          'SKU': 'OIL-SUN-1L',
          'Barcode': '8901234567891',
          'Category': 'Edible Oils',
          'Purchase Price': 120,
          'Selling Price': 145,
          'MRP': 160,
          'GST Rate (%)': 5,
          'Opening Stock': 100,
          'Minimum Stock': 20,
          'Purchase Unit': 'BOTTLE',
          'Selling Unit': 'BOTTLE',
          'Description': '100% Pure refined sunflower oil'
        },
        {
          'Product Name': 'Chakki Fresh Atta 10kg',
          'SKU': 'ATTA-CHK-10K',
          'Barcode': '8901234567892',
          'Category': 'Flour & Atta',
          'Purchase Price': 310,
          'Selling Price': 360,
          'MRP': 390,
          'GST Rate (%)': 0,
          'Opening Stock': 40,
          'Minimum Stock': 10,
          'Purchase Unit': 'BAG',
          'Selling Unit': 'BAG',
          'Description': 'Whole wheat fresh chakki atta'
        }
      ];

      const ws = XLSX.utils.json_to_sheet(sampleRows, {
        header: [
          'Product Name', 'SKU', 'Barcode', 'Category', 
          'Purchase Price', 'Selling Price', 'MRP', 'GST Rate (%)', 
          'Opening Stock', 'Minimum Stock', 'Purchase Unit', 'Selling Unit', 'Description'
        ]
      });

      ws['!cols'] = [
        { wch: 25 },
        { wch: 16 },
        { wch: 16 },
        { wch: 18 },
        { wch: 15 },
        { wch: 15 },
        { wch: 12 },
        { wch: 14 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 35 }
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sample_Products');
      XLSX.writeFile(wb, 'Product_Import_Sample.xlsx');

      triggerToast('Sample product Excel template downloaded successfully.', 'success');
      dbStore.logActivity(user.id, user.name, user.role, 'Download Template', 'Downloaded Product Import Excel sample template', businessId);
    } catch (err: any) {
      console.error('Failed to download sample excel:', err);
      triggerToast('Failed to download sample excel template.', 'error');
    }
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadProgress({
      fileName: file.name,
      progressPercent: 5,
      statusText: 'Reading Excel file...',
      processedRows: 0,
      totalRows: 0
    });

    const reader = new FileReader();

    reader.onerror = () => {
      triggerToast('Failed to read file. Please try again.', 'error');
      setUploadProgress(null);
    };

    reader.onload = (evt) => {
      try {
        const arrayBuffer = evt.target?.result;
        if (!arrayBuffer) {
          triggerToast('Empty file uploaded.', 'error');
          setUploadProgress(null);
          return;
        }

        setUploadProgress({
          fileName: file.name,
          progressPercent: 20,
          statusText: 'Parsing Excel workbook...',
          processedRows: 0,
          totalRows: 0
        });

        const wb = XLSX.read(arrayBuffer, { type: 'array', cellFormula: false, raw: false, cellDates: true });
        const wsName = wb.SheetNames[0];
        if (!wsName) {
          triggerToast('Invalid or empty Excel file.', 'error');
          setUploadProgress(null);
          return;
        }
        const ws = wb.Sheets[wsName];

        const rawMatrix = XLSX.utils.sheet_to_json<any>(ws, { header: 1, raw: false, defval: '' });

        if (!rawMatrix || rawMatrix.length === 0) {
          triggerToast('The uploaded Excel file contains no data.', 'error');
          setUploadProgress(null);
          return;
        }

        let startIdx = 0;
        let nameIdx = -1;
        let skuIdx = -1;
        let barcodeIdx = -1;
        let categoryIdx = -1;
        let purchasePriceIdx = -1;
        let sellingPriceIdx = -1;
        let mrpIdx = -1;
        let gstIdx = -1;
        let stockIdx = -1;
        let minStockIdx = -1;
        let purchaseUnitIdx = -1;
        let sellingUnitIdx = -1;
        let descIdx = -1;

        const firstRow = rawMatrix[0];
        if (Array.isArray(firstRow) && firstRow.some(cell => {
          const str = String(cell || '').toLowerCase();
          return str.includes('product') || str.includes('name') || str.includes('sku') || str.includes('barcode') || str.includes('category') || str.includes('price');
        })) {
          startIdx = 1;
          firstRow.forEach((cell, colIdx) => {
            const str = String(cell || '').toLowerCase().trim();
            if (/name|product|title|item/i.test(str) && !/unit|price|category|code|sku|barcode/i.test(str) && nameIdx === -1) nameIdx = colIdx;
            else if (/sku|code/i.test(str) && !/barcode/i.test(str) && skuIdx === -1) skuIdx = colIdx;
            else if (/barcode|upc|ean/i.test(str) && barcodeIdx === -1) barcodeIdx = colIdx;
            else if (/category|group|dept/i.test(str) && categoryIdx === -1) categoryIdx = colIdx;
            else if (/purchase|cost|buy/i.test(str) && purchasePriceIdx === -1) purchasePriceIdx = colIdx;
            else if (/selling|sell|sale|rate|price/i.test(str) && !/purchase|mrp|cost/i.test(str) && sellingPriceIdx === -1) sellingPriceIdx = colIdx;
            else if (/mrp/i.test(str) && mrpIdx === -1) mrpIdx = colIdx;
            else if (/gst|tax/i.test(str) && gstIdx === -1) gstIdx = colIdx;
            else if (/stock|opening|qty|quantity/i.test(str) && !/min|minimum/i.test(str) && stockIdx === -1) stockIdx = colIdx;
            else if (/min|minimum/i.test(str) && minStockIdx === -1) minStockIdx = colIdx;
            else if (/purchase unit|buy unit/i.test(str) && purchaseUnitIdx === -1) purchaseUnitIdx = colIdx;
            else if (/selling unit|unit/i.test(str) && sellingUnitIdx === -1) sellingUnitIdx = colIdx;
            else if (/desc|description|details/i.test(str) && descIdx === -1) descIdx = colIdx;
          });
        }

        if (nameIdx === -1) nameIdx = 0;
        if (skuIdx === -1) skuIdx = 1;
        if (barcodeIdx === -1) barcodeIdx = 2;
        if (categoryIdx === -1) categoryIdx = 3;

        const dataRows = rawMatrix.slice(startIdx).filter((row: any) => 
          Array.isArray(row) && row.some((cell: any) => cell !== null && cell !== undefined && String(cell).trim() !== '')
        );

        if (dataRows.length === 0) {
          triggerToast('No valid product data rows found in Excel sheet.', 'error');
          setUploadProgress(null);
          return;
        }

        const totalRows = dataRows.length;
        setUploadProgress({
          fileName: file.name,
          progressPercent: 50,
          statusText: `Processing ${totalRows} product records...`,
          processedRows: 0,
          totalRows
        });

        const currentProducts = dbStore.getProducts(businessId);
        const existingNames = new Set(currentProducts.map(p => p.name ? p.name.trim().toLowerCase() : '').filter(Boolean));
        const existingSkus = new Set(currentProducts.map(p => p.sku ? p.sku.trim().toLowerCase() : '').filter(Boolean));
        const existingBarcodes = new Set(currentProducts.map(p => p.barcode ? p.barcode.trim().toLowerCase() : '').filter(Boolean));

        const batchNames = new Set<string>();
        const batchSkus = new Set<string>();
        const batchBarcodes = new Set<string>();

        const existingCategories = dbStore.getCategories(businessId);
        const categoryMap = new Map<string, string>();
        existingCategories.forEach(c => categoryMap.set(c.name.trim().toLowerCase(), c.id));

        const newProductsToCreate: Omit<Product, 'id' | 'created_at' | 'current_stock'>[] = [];
        let skippedCount = 0;
        const skippedDetails: { rowNum: number; name: string; reason: string }[] = [];

        dataRows.forEach((row: any, idx: number) => {
          const rowNum = startIdx + idx + 1;
          const rawName = row[nameIdx] ?? '';
          let name = String(rawName).trim();

          if (!name) {
            skippedCount++;
            skippedDetails.push({ rowNum, name: 'Empty Name', reason: 'Product name is required' });
            return;
          }

          let cleanName = name.toLowerCase();

          let rawSku = skuIdx !== -1 && row[skuIdx] ? String(row[skuIdx]).trim() : '';
          const userProvidedSku = !!rawSku;
          let sku = rawSku;
          if (!sku) {
            const prefix = name.substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, 'X') || 'PROD';
            sku = `SKU-${prefix}-${idx + 1}-${Math.floor(1000 + Math.random() * 9000)}`;
          }
          let cleanSku = sku.toLowerCase();

          let skuCounter = 1;
          while (!userProvidedSku && (existingSkus.has(cleanSku) || batchSkus.has(cleanSku))) {
            const prefix = name.substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, 'X') || 'PROD';
            sku = `SKU-${prefix}-${idx + 1}-${skuCounter}-${Math.floor(1000 + Math.random() * 9000)}`;
            cleanSku = sku.toLowerCase();
            skuCounter++;
            if (skuCounter > 100) break;
          }

          let rawBarcode = barcodeIdx !== -1 && row[barcodeIdx] ? String(row[barcodeIdx]).trim() : '';
          const userProvidedBarcode = !!rawBarcode;
          let barcode = rawBarcode;
          if (!barcode) {
            barcode = '890' + String(Date.now()).slice(-5) + String(idx + 1000).slice(-4);
          }
          let cleanBarcode = barcode.toLowerCase();

          let barcodeCounter = 1;
          while (!userProvidedBarcode && (existingBarcodes.has(cleanBarcode) || batchBarcodes.has(cleanBarcode))) {
            barcode = '890' + String(Date.now()).slice(-5) + String(idx + 1000 + barcodeCounter).slice(-4);
            cleanBarcode = barcode.toLowerCase();
            barcodeCounter++;
            if (barcodeCounter > 100) break;
          }

          const skuExists = userProvidedSku && (existingSkus.has(cleanSku) || batchSkus.has(cleanSku));
          const barcodeExists = userProvidedBarcode && (existingBarcodes.has(cleanBarcode) || batchBarcodes.has(cleanBarcode));

          if (skuExists || barcodeExists) {
            skippedCount++;
            let reason = '';
            if (skuExists) reason = `SKU "${sku}" already exists`;
            else reason = `Barcode "${barcode}" already exists`;

            skippedDetails.push({ rowNum, name, reason });
            return;
          }

          if (existingNames.has(cleanName) || batchNames.has(cleanName)) {
            name = `${name} (${sku})`;
            cleanName = name.toLowerCase();
          }

          let catName = categoryIdx !== -1 && row[categoryIdx] ? String(row[categoryIdx]).trim() : 'General';
          if (!catName) catName = 'General';

          let categoryId = categoryMap.get(catName.toLowerCase());
          if (!categoryId) {
            const newCat = dbStore.createCategory({
              name: catName,
              parent_id: null,
              business_id: businessId,
              active: true
            });
            categoryId = newCat.id;
            categoryMap.set(catName.toLowerCase(), categoryId);
          }

          const purchasePrice = purchasePriceIdx !== -1 && row[purchasePriceIdx] ? Number(row[purchasePriceIdx]) || 0 : 0;
          const sellingPrice = sellingPriceIdx !== -1 && row[sellingPriceIdx] ? Number(row[sellingPriceIdx]) || purchasePrice : purchasePrice;
          const mrp = mrpIdx !== -1 && row[mrpIdx] ? Number(row[mrpIdx]) || sellingPrice : sellingPrice;
          const gstRate = gstIdx !== -1 && row[gstIdx] ? Number(row[gstIdx]) || 0 : 0;
          const openingStock = stockIdx !== -1 && row[stockIdx] ? Number(row[stockIdx]) || 0 : 0;
          const minStock = minStockIdx !== -1 && row[minStockIdx] ? Number(row[minStockIdx]) || 5 : 5;
          const purchaseUnit = purchaseUnitIdx !== -1 && row[purchaseUnitIdx] ? String(row[purchaseUnitIdx]).trim() : 'Pcs';
          const sellingUnit = sellingUnitIdx !== -1 && row[sellingUnitIdx] ? String(row[sellingUnitIdx]).trim() : purchaseUnit;
          const description = descIdx !== -1 && row[descIdx] ? String(row[descIdx]).trim() : '';

          batchNames.add(cleanName);
          if (cleanSku) batchSkus.add(cleanSku);
          if (cleanBarcode) batchBarcodes.add(cleanBarcode);

          newProductsToCreate.push({
            name,
            sku,
            barcode,
            category_id: categoryId,
            gst_rate: gstRate,
            purchase_price: purchasePrice,
            selling_price: sellingPrice,
            rate_nr: sellingPrice,
            rate_lmr: sellingPrice,
            rate_abr: sellingPrice,
            rate_ddr: sellingPrice,
            mrp,
            opening_stock: openingStock,
            minimum_stock: minStock,
            maximum_stock: 100,
            image_url: `https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=60`,
            description,
            active: true,
            qr_code: sku,
            brand: 'General',
            unit: sellingUnit,
            hsn_code: '',
            business_id: businessId,
            purchase_unit: purchaseUnit,
            selling_unit: sellingUnit,
            auto_conversion: false
          });

          existingNames.add(cleanName);
          batchNames.add(cleanName);
          existingSkus.add(cleanSku);
          batchSkus.add(cleanSku);
          existingBarcodes.add(cleanBarcode);
          batchBarcodes.add(cleanBarcode);
        });

        setUploadProgress({
          fileName: file.name,
          progressPercent: 90,
          statusText: `Saving ${newProductsToCreate.length} new products to database...`,
          processedRows: totalRows,
          totalRows
        });

        if (newProductsToCreate.length > 0) {
          dbStore.createProductsBatch(newProductsToCreate);
          dbStore.logActivity(
            user.id,
            user.name,
            user.role,
            'Import Products',
            `Bulk imported ${newProductsToCreate.length} products from ${file.name} (${skippedCount} skipped/duplicates)`,
            businessId
          );
        }

        setProducts(dbStore.getProducts(businessId));
        setCategories(dbStore.getCategories(businessId));
        setUploadProgress(null);

        if (excelFileInputRef.current) excelFileInputRef.current.value = '';

        if (skippedCount > 0) {
          setImportSummaryModal({
            isOpen: true,
            importedCount: newProductsToCreate.length,
            skippedCount,
            skippedDetails
          });
          triggerToast(`Imported ${newProductsToCreate.length} products. ${skippedCount} items skipped as duplicates.`, 'info');
        } else {
          triggerToast(`Successfully imported all ${newProductsToCreate.length} products!`, 'success');
        }
      } catch (err: any) {
        console.error('Failed to parse Excel import:', err);
        setUploadProgress(null);
        triggerToast('Failed to parse Excel file. Please check file format.', 'error');
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleBulkExport = () => {
    try {
      const csvHeader = "ID,Name,SKU,Barcode,Category,PurchasePrice,SellingPrice,CurrentStock,IsCombo\n";
      const csvRows = products.map(p => 
        `"${p.id}","${p.name}","${p.sku}","${p.barcode}","${p.category_id}",${p.purchase_price},${p.selling_price},${p.current_stock},${isComboProduct(p) ? 'Yes' : 'No'}`
      ).join("\n");

      const blob = new Blob([csvHeader + csvRows], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory_catalog_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();

      dbStore.logActivity(user.id, user.name, user.role, 'Export Catalog', 'Exported product inventory catalog to CSV', businessId);
      triggerToast('Product catalog exported as CSV file.', 'success');
    } catch (e) {
      triggerToast('Export failed.', 'error');
    }
  };

  const handlePrintBarcodeSubmit = () => {
    triggerToast(`Sent barcode template containing ${printLabelCount} sheets of "${printingBarcodeProduct?.name}" to print queue.`, 'success');
    dbStore.logActivity(user.id, user.name, user.role, 'Print Barcode', `Printed ${printLabelCount} barcodes for SKU: ${printingBarcodeProduct?.sku}`, businessId);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Filters & Searches
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const lowLimit = dbStore.getSettings(businessId).low_stock_limit || 10;

    return products.filter(p => {
      const matchesSearch = !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.includes(q);

      const matchesCategory = selectedCategory === 'All' || 
        p.category_id === selectedCategory ||
        categories.find(c => c.id === p.category_id)?.parent_id === selectedCategory;

      const matchesStock = 
        selectedStockStatus === 'All' ||
        (selectedStockStatus === 'Low' && p.current_stock > 0 && p.current_stock <= lowLimit) ||
        (selectedStockStatus === 'Out' && p.current_stock === 0) ||
        (selectedStockStatus === 'Healthy' && p.current_stock > lowLimit);

      const matchesType = 
        selectedType === 'All' ||
        (selectedType === 'Product' && !isComboProduct(p)) ||
        (selectedType === 'Combo' && isComboProduct(p));

      return matchesSearch && matchesCategory && matchesStock && matchesType;
    });
  }, [products, searchQuery, selectedCategory, selectedStockStatus, selectedType, businessId, categories]);

  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  return (
    <div className="space-y-4 max-w-full pb-8 px-0 font-sans text-slate-900 dark:text-slate-100 overflow-x-hidden" id="product-catalog-root">
      <PageHeader
        title="Product Catalog & Barcode Master"
        subtitle="Manage individual products, create Combo Box bundles, track packed vs virtual stock, and print barcodes."
        icon={Package}
      >
        <div className="flex flex-nowrap overflow-x-auto md:flex-wrap gap-2 hide-scrollbar w-full justify-end">
          <input 
            type="file" 
            ref={excelFileInputRef} 
            onChange={handleImportExcel} 
            accept=".xlsx, .xls, .csv" 
            className="hidden" 
          />

          <button 
            onClick={handleDownloadSampleExcel} 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl text-[10px] sm:text-[11px] font-bold cursor-pointer shadow-sm transition-all whitespace-nowrap shrink-0 border border-amber-400/30"
            title="Download Sample Product Excel Template"
          >
            <FileDown size={14} className="text-amber-400" />
            <span>Sample Excel</span>
          </button>

          {user.role !== 'Viewer' && (
            <button 
              onClick={() => excelFileInputRef.current?.click()} 
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 rounded-xl text-[10px] sm:text-[11px] font-bold cursor-pointer shadow-sm transition-all whitespace-nowrap shrink-0 border border-emerald-400/30"
              title="Import Products from Excel / CSV File"
            >
              <Upload size={14} className="text-emerald-400" />
              <span>Import Excel</span>
            </button>
          )}

          <button 
            onClick={handleBulkExport} 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] sm:text-[11px] font-bold cursor-pointer shadow-sm transition-all whitespace-nowrap shrink-0 border border-white/10"
          >
            <FileSpreadsheet size={14} className="text-emerald-400" />
            <span>Export Catalog</span>
          </button>
          {user.role !== 'Viewer' && (
            <>
              <button 
                onClick={handleOpenAddComboModal} 
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-[10px] sm:text-[11px] font-bold cursor-pointer shadow-md transition-all whitespace-nowrap shrink-0 border border-purple-400/30"
              >
                <Boxes size={14} />
                <span>Create Combo Box</span>
              </button>
              <button 
                onClick={handleOpenAddModal} 
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-[10px] sm:text-[11px] font-bold cursor-pointer shadow-md transition-all whitespace-nowrap shrink-0 border border-purple-400/30"
              >
                <Plus size={14} />
                <span>Add Product SKU</span>
              </button>
            </>
          )}
        </div>
      </PageHeader>

      <div className="px-0.5 sm:px-1 space-y-4">
      
      {/* Advanced Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-2 sm:p-3 rounded-xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-1">
          <div className="flex items-center gap-1.5">
            <div className="p-1.5 bg-slate-500/10 text-slate-600 dark:text-slate-400 rounded-lg shrink-0">
              <Package size={14} />
            </div>
            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">TOTAL PRODUCTS</span>
          </div>
          <div className="text-right mt-1">
            <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {products.filter(p => !isComboProduct(p)).length}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-2 sm:p-3 rounded-xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-1">
          <div className="flex items-center gap-1.5">
            <div className="p-1.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg shrink-0">
              <Boxes size={14} />
            </div>
            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">COMBO BOX BUNDLES</span>
          </div>
          <div className="text-right mt-1">
            <span className="text-lg sm:text-xl font-black text-purple-600 dark:text-purple-400 tracking-tight">
              {products.filter(p => isComboProduct(p)).length}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-2 sm:p-3 rounded-xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-1">
          <div className="flex items-center gap-1.5">
            <div className="p-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg shrink-0">
              <FileSpreadsheet size={14} />
            </div>
            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">STOCK VALUATION</span>
          </div>
          <div className="text-right mt-1">
            <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              ₹{products.reduce((acc, p) => acc + (p.current_stock * p.purchase_price), 0).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-2 sm:p-3 rounded-xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-1">
          <div className="flex items-center gap-1.5">
            <div className="p-1.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg shrink-0">
              <AlertTriangle size={14} />
            </div>
            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">LOW STOCK ALERTS</span>
          </div>
          <div className="text-right mt-1">
            <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {products.filter(p => p.current_stock <= (dbStore.getSettings(businessId).low_stock_limit || 10)).length}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-center gap-2">
        <div className="flex-1 flex items-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-full px-3 py-2 shadow-xs focus-within:ring-2 focus-within:ring-indigo-500 transition-shadow w-full">
          <Search size={16} className="text-slate-400 mr-2 shrink-0" />
          <input 
            type="text" 
            placeholder="Search products or combo bundles by name, SKU, barcode..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-[11px] sm:text-xs outline-hidden text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          {/* Item Type Filter Toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-full border border-slate-200 dark:border-slate-700 shrink-0">
            <button
              onClick={() => setSelectedType('All')}
              className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all ${selectedType === 'All' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}
            >
              All Items
            </button>
            <button
              onClick={() => setSelectedType('Product')}
              className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all ${selectedType === 'Product' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}
            >
              Regular
            </button>
            <button
              onClick={() => setSelectedType('Combo')}
              className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all ${selectedType === 'Combo' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}
            >
              Combo Boxes 📦
            </button>
          </div>

          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex-1 md:w-44 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-[11px] rounded-full px-3 py-1.5 font-bold cursor-pointer outline-hidden"
          >
            <option value="All">All Categories ({products.length})</option>
            {categories.map(c => {
              const parent = categories.find(p => p.id === c.parent_id);
              const count = products.filter(p => p.category_id === c.id || categories.find(sub => sub.id === p.category_id)?.parent_id === c.id).length;
              return (
                <option key={c.id} value={c.id}>
                  {parent ? `  ↳ ${c.name}` : c.name} ({count})
                </option>
              );
            })}
          </select>

          <select 
            value={selectedStockStatus}
            onChange={(e) => setSelectedStockStatus(e.target.value)}
            className="flex-1 md:w-32 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-[11px] rounded-full px-3 py-1.5 font-bold cursor-pointer outline-hidden"
          >
            <option value="All">All Stock</option>
            <option value="Healthy">Healthy</option>
            <option value="Low">Low Stock</option>
            <option value="Out">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Quick Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 hide-scrollbar">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0 mr-1 flex items-center gap-1">
          <Filter size={12} /> Categories:
        </span>
        <button
          type="button"
          onClick={() => setSelectedCategory('All')}
          className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 border ${
            selectedCategory === 'All'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-200 dark:ring-indigo-900'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          All ({products.length})
        </button>
        {categories.map(cat => {
          const count = products.filter(p => p.category_id === cat.id || categories.find(sub => sub.id === p.category_id)?.parent_id === cat.id).length;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 border ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-200 dark:ring-indigo-900'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600'
              }`}
            >
              {cat.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Active Category Filter Status Banner */}
      {selectedCategory !== 'All' && (
        <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 px-3.5 py-1.5 rounded-xl text-xs shadow-2xs">
          <span className="font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
            <Filter size={13} />
            Showing items in Category: <u className="underline underline-offset-2">{categories.find(c => c.id === selectedCategory)?.name || 'Category'}</u>
          </span>
          <button 
            type="button"
            onClick={() => setSelectedCategory('All')} 
            className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
          >
            <X size={12} /> Clear Category Filter
          </button>
        </div>
      )}

      {/* Catalog Table View */}
      <div className="bg-white dark:bg-slate-900 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs mt-3">
        <table className="w-full text-left text-[11px]">
          <thead className="bg-slate-800 text-white font-bold uppercase tracking-wider border-b border-slate-700 text-[10px]">
            <tr>
              <th className="py-2.5 px-3 w-12">Img</th>
              <th className="py-2.5 px-3">Item Details</th>
              <th className="py-2.5 px-3">Type</th>
              <th className="py-2.5 px-3">Pricing</th>
              <th className="py-2.5 px-3">Stock State</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 text-[11px]">
            {paginatedProducts.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-500">
                    <Package size={28} className="mb-2 opacity-50" />
                    <p className="font-bold text-xs">No matching items found.</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedProducts.map((prod) => {
                const category = categories.find(c => c.id === prod.category_id);
                const isOut = prod.current_stock === 0;
                const lowLimit = dbStore.getSettings(businessId).low_stock_limit || 10;
                const isLow = prod.current_stock > 0 && prod.current_stock <= lowLimit;

                return (
                  <tr key={prod.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-2 px-3">
                      <div className="w-9 h-9 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 relative">
                        <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 dark:text-white text-[12px]">{prod.name}</span>
                          {isComboProduct(prod) && (
                            <span className="px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded border border-purple-300 dark:border-purple-700">
                              Combo Bundle
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[9px] mt-0.5">
                          <span className="font-mono text-indigo-600 font-bold tracking-widest">{prod.sku}</span>
                          <span className="text-slate-300">•</span>
                          <span className="font-mono text-slate-500">{prod.barcode}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      {isComboProduct(prod) ? (
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-purple-700 dark:text-purple-300 flex items-center gap-1">
                            <Boxes size={12} /> {prod.combo_items?.length || 0} Component Items
                          </span>
                          <span className="text-[9px] text-slate-400">Packed Goods</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCategory(prod.category_id);
                          }}
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border transition-all cursor-pointer ${
                            selectedCategory === prod.category_id
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-300'
                              : 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 hover:text-indigo-600 border-slate-200 dark:border-slate-700'
                          }`}
                          title={`Click to filter catalog by category: ${category?.name || 'Standard'}`}
                        >
                          {category?.name || 'Standard'}
                        </button>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 dark:text-white text-[12px]">₹{prod.selling_price.toLocaleString()}</span>
                        <span className="text-[9px] text-slate-500 font-semibold">Cost: ₹{prod.purchase_price.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex flex-col items-start gap-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-black text-[12px] ${isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {prod.current_stock}
                          </span>
                          <span className="text-[9px] text-slate-500 font-bold">{prod.unit}</span>
                        </div>
                        {isComboProduct(prod) && (
                          <span className="text-[8px] font-bold text-purple-600 uppercase">
                            Packed Stock
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <div className="flex justify-end gap-1.5 items-center">
                        {isComboProduct(prod) ? (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setPackingCombo(prod);
                                setPackQty(1);
                                setPackError(null);
                                setIsPackModalOpen(true);
                              }}
                              className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-[10px] font-bold flex items-center gap-1 transition-colors shadow-xs"
                              title="Pack Combo in advance"
                            >
                              <PackagePlus size={12} />
                              <span>Pack</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setBreakingCombo(prod);
                                setBreakQty(1);
                                setIsBreakModalOpen(true);
                              }}
                              className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-bold flex items-center gap-1 transition-colors shadow-xs"
                              title="Unpack / Break combo into components"
                            >
                              <RefreshCw size={12} />
                              <span>Unpack</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setViewingCombo(prod);
                                setIsAuditModalOpen(true);
                              }}
                              className="p-2 text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-lg transition-colors border border-slate-200 shadow-xs active:scale-95"
                              title="View Bundle Details & Audit Trail"
                            >
                              <History size={15} />
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => {
                                setPrintingBarcodeProduct(prod);
                                setPrintLabelCount(prod.current_stock > 0 ? (prod.current_stock > 20 ? 20 : prod.current_stock) : 10);
                              }}
                              className="p-2 text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-lg transition-colors border border-slate-200 shadow-xs active:scale-95"
                              title="Print Barcode"
                            >
                              <Barcode size={15} />
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setPrintingBarcodeProduct(prod);
                              setPrintLabelCount(prod.current_stock > 0 ? (prod.current_stock > 20 ? 20 : prod.current_stock) : 10);
                            }}
                            className="p-2 text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-lg transition-colors border border-slate-200 shadow-xs active:scale-95"
                            title="Print Barcode"
                          >
                            <Barcode size={15} />
                          </button>
                        )}
                        
                        {user.role !== 'Viewer' && (
                          <>
                            <button
                              type="button"
                              onClick={() => isComboProduct(prod) ? handleOpenEditComboModal(prod) : handleOpenEditModal(prod)}
                              className="p-2 text-slate-500 hover:text-sky-600 bg-slate-50 hover:bg-sky-50 rounded-lg transition-colors border border-slate-200 shadow-xs active:scale-95"
                              title={isComboProduct(prod) ? "Edit Combo Box" : "Edit Product"}
                            >
                              <Edit size={15} />
                            </button>
                            {user.role === 'Super Admin' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setProductToDelete(prod);
                                  setIsDeleteConfirmOpen(true);
                                }}
                                className="p-2 text-slate-500 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-lg transition-colors border border-slate-200 shadow-xs active:scale-95"
                                title="Delete Item"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
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

        {/* Pagination Controls */}
        {filteredProducts.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-[11px] rounded-b-2xl">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium">
              <span>
                Showing <strong className="text-slate-900 dark:text-white font-black">{Math.min((currentPage - 1) * pageSize + 1, filteredProducts.length)}</strong> to <strong className="text-slate-900 dark:text-white font-black">{Math.min(currentPage * pageSize, filteredProducts.length)}</strong> of <strong className="text-slate-900 dark:text-white font-black">{filteredProducts.length}</strong> items
              </span>
              <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>
              <div className="flex items-center gap-1">
                <span className="hidden sm:inline">Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[11px] font-bold focus:outline-none"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={250}>250</option>
                  <option value={500}>500</option>
                  <option value={1000}>1000</option>
                  <option value={5000}>5000</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-bold text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="First Page"
              >
                « First
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-bold text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                ‹ Prev
              </button>

              <span className="px-2 font-bold text-slate-800 dark:text-slate-200">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage >= totalPages}
                className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-bold text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Next ›
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage >= totalPages}
                className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-bold text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Last Page"
              >
                Last »
              </button>
            </div>
          </div>
        )}
      </div>
      </div>

      {/* ==================== CREATE / EDIT COMBO BOX MODAL ==================== */}
      {isComboModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in zoom-in duration-150 border border-slate-200 dark:border-slate-800 my-8">
            <div className="bg-gradient-to-r from-purple-700 to-indigo-700 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Boxes size={20} />
                <h2 className="text-sm font-bold uppercase tracking-wider">
                  {editingCombo ? 'Edit Combo Box Bundle' : 'Create New Combo Box (Product Bundle)'}
                </h2>
              </div>
              <button onClick={() => setIsComboModalOpen(false)} className="text-white/80 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCombo} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
              {/* Section 1: Combo Master Details */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Package size={14} className="text-purple-600" /> Combo Box Master Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Combo Name */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Combo Name *</label>
                    <input 
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Festive Faral Hamper Box"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 text-[11px] font-bold rounded-lg border border-slate-300 dark:border-slate-700 focus:outline-hidden"
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Category *</label>
                    <SearchableCategorySelect
                      categories={categories}
                      value={formCategory || categories[0]?.id || ''}
                      onChange={(catId) => setFormCategory(catId)}
                      onCategoryCreated={(newCat) => {
                        const updatedCats = dbStore.getCategories(businessId);
                        setCategories(updatedCats);
                        triggerToast(`Category "${newCat.name}" created and selected!`, 'success');
                      }}
                      businessId={businessId}
                      placeholder="Search category..."
                    />
                  </div>

                  {/* SKU */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">SKU Code *</label>
                    <input 
                      type="text"
                      required
                      value={formSku}
                      onChange={(e) => setFormSku(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 text-[11px] font-mono rounded-lg border border-slate-300 dark:border-slate-700 focus:outline-hidden"
                    />
                  </div>

                  {/* Barcode */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Barcode *</label>
                    <input 
                      type="text"
                      required
                      value={formBarcode}
                      onChange={(e) => setFormBarcode(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 text-[11px] font-mono rounded-lg border border-slate-300 dark:border-slate-700 focus:outline-hidden"
                    />
                  </div>

                  {/* Unit of Measure */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Unit of Measure *</label>
                    <select 
                      value={formUnit}
                      onChange={(e) => setFormUnit(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 text-[11px] font-bold rounded-lg border border-slate-300 dark:border-slate-700 focus:outline-hidden"
                    >
                      <option value="Box">Box</option>
                      <option value="Set">Set</option>
                      <option value="Pkt">Pkt (Packet)</option>
                      <option value="Pcs">Pcs (Pieces)</option>
                      <option value="Kg">Kg (Kilogram)</option>
                      <option value="Combo">Combo</option>
                      <option value="Hamper">Hamper</option>
                      <option value="Unit">Unit</option>
                    </select>
                  </div>
                </div>

                {/* Price & Stock Fields Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-200/80 dark:border-slate-700/80">
                  {/* Purchase Price */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Purchase Price (₹)</label>
                      <button 
                        type="button" 
                        onClick={() => {
                          const componentCost = comboItems.reduce((acc, ci) => {
                            const p = products.find(prod => prod.id === ci.product_id);
                            return acc + (p ? p.purchase_price * ci.qty : 0);
                          }, 0);
                          setFormPurchasePrice(componentCost);
                        }}
                        className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                        title="Auto-fill from component sum"
                      >
                        Auto Calc
                      </button>
                    </div>
                    <input 
                      type="number"
                      min="0"
                      step="0.01"
                      value={formPurchasePrice}
                      onChange={(e) => setFormPurchasePrice(e.target.value)}
                      placeholder={comboItems.reduce((acc, ci) => {
                        const p = products.find(prod => prod.id === ci.product_id);
                        return acc + (p ? p.purchase_price * ci.qty : 0);
                      }, 0).toString()}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 text-[11px] font-bold text-amber-600 rounded-lg border border-slate-300 dark:border-slate-700 focus:outline-hidden"
                    />
                  </div>

                  {/* Selling Price - Normal Rate (NR) */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Normal Rate - NR (₹) *</label>
                    <input 
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formSellingPrice}
                      onChange={(e) => setFormSellingPrice(e.target.value)}
                      placeholder="e.g. 699"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 text-[11px] font-bold text-emerald-600 rounded-lg border border-slate-300 dark:border-slate-700 focus:outline-hidden"
                    />
                  </div>

                  {/* Loyal Membership Rate - LMR */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Loyal Member Rate - LMR (₹)</label>
                    <input 
                      type="number"
                      min="0"
                      step="0.01"
                      value={formRateLmr}
                      onChange={(e) => setFormRateLmr(e.target.value)}
                      placeholder={formSellingPrice ? `${formSellingPrice}` : 'Loyal rate'}
                      className="w-full px-3 py-1.5 bg-indigo-50/50 dark:bg-indigo-950/30 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 rounded-lg border border-indigo-200 dark:border-indigo-800 focus:outline-hidden"
                    />
                  </div>

                  {/* Advance Booking Rate - ABR */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Advance Booking Rate - ABR (₹)</label>
                    <input 
                      type="number"
                      min="0"
                      step="0.01"
                      value={formRateAbr}
                      onChange={(e) => setFormRateAbr(e.target.value)}
                      placeholder={formSellingPrice ? `${formSellingPrice}` : 'Advance rate'}
                      className="w-full px-3 py-1.5 bg-blue-50/50 dark:bg-blue-950/30 text-[11px] font-bold text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-800 focus:outline-hidden"
                    />
                  </div>

                  {/* Diwali Discount Rate - DDR */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Diwali Discount Rate - DDR (₹)</label>
                    <input 
                      type="number"
                      min="0"
                      step="0.01"
                      value={formRateDdr}
                      onChange={(e) => setFormRateDdr(e.target.value)}
                      placeholder={formSellingPrice ? `${formSellingPrice}` : 'Diwali rate'}
                      className="w-full px-3 py-1.5 bg-amber-50/50 dark:bg-amber-950/30 text-[11px] font-bold text-amber-700 dark:text-amber-300 rounded-lg border border-amber-200 dark:border-amber-800 focus:outline-hidden"
                    />
                  </div>

                  {/* MRP */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">MRP (₹)</label>
                    <input 
                      type="number"
                      min="0"
                      step="0.01"
                      value={formMrp}
                      onChange={(e) => setFormMrp(e.target.value)}
                      placeholder={formSellingPrice ? (Number(formSellingPrice) * 1.2).toFixed(0) : 'e.g. 799'}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 text-[11px] font-bold text-slate-700 dark:text-slate-300 rounded-lg border border-slate-300 dark:border-slate-700 focus:outline-hidden"
                    />
                  </div>

                  {/* Opening Stock */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Opening Stock *</label>
                    <input 
                      type="number"
                      min="0"
                      value={formOpeningStock}
                      onChange={(e) => setFormOpeningStock(e.target.value)}
                      placeholder="e.g. 10"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 text-[11px] font-bold text-purple-600 rounded-lg border border-slate-300 dark:border-slate-700 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Dropdown Product Selector & Bundle Components */}
              <div className="border border-purple-200 dark:border-purple-900/50 bg-purple-50/40 dark:bg-purple-950/20 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-[11px] font-black uppercase tracking-wider text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                      <Boxes size={14} /> Add Product to Combo Box (Select from Dropdown)
                    </h3>
                    <p className="text-[10px] text-slate-500">Choose a product from the dropdown list below and set quantity to include in this hamper bundle.</p>
                  </div>

                  <span className="text-[10px] font-bold bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full">
                    {comboItems.length} Products Selected
                  </span>
                </div>

                {/* Dropdown Product Quick-Add Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                  <div className="flex-1 space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Select Available Product *</label>
                    <select 
                      value={selectedDropdownProdId}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) {
                          const selectedProd = products.find(p => p.id === val);
                          if (selectedProd && selectedProd.current_stock <= 0) {
                            triggerToast(`"${selectedProd.name}" is OUT OF STOCK! (Available stock: 0 ${selectedProd.unit})`, 'error');
                            return;
                          }
                        }
                        setSelectedDropdownProdId(val);
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 text-[11px] font-bold rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-hidden text-slate-800 dark:text-slate-100"
                    >
                      <option value="">-- Select Regular Product from Dropdown --</option>
                      {products.filter(p => !isComboProduct(p)).map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} (SKU: {p.sku}) — ₹{p.selling_price} | Available Stock: {p.current_stock} {p.unit}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-full sm:w-24 space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Quantity *</label>
                    <input 
                      type="number"
                      min="1"
                      value={selectedDropdownQty}
                      onChange={(e) => setSelectedDropdownQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 text-[11px] font-bold text-center rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-hidden text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div className="sm:self-end pt-1 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => {
                        if (!selectedDropdownProdId) {
                          triggerToast('Please select a product from the dropdown list', 'warning');
                          return;
                        }

                        const selProd = products.find(p => p.id === selectedDropdownProdId);
                        if (!selProd) {
                          triggerToast('Selected product not found', 'error');
                          return;
                        }

                        if (selProd.current_stock <= 0) {
                          triggerToast(`Cannot add "${selProd.name}" — Product is OUT OF STOCK! (Available stock: 0 ${selProd.unit})`, 'error');
                          return;
                        }

                        const existingIndex = comboItems.findIndex(ci => ci.product_id === selectedDropdownProdId);
                        const existingQty = existingIndex >= 0 ? comboItems[existingIndex].qty : 0;
                        const totalRequested = existingQty + selectedDropdownQty;

                        if (totalRequested > selProd.current_stock) {
                          triggerToast(`Cannot add ${selectedDropdownQty} units. Only ${selProd.current_stock} ${selProd.unit} available in stock for "${selProd.name}"!`, 'error');
                          return;
                        }

                        if (existingIndex >= 0) {
                          const updated = [...comboItems];
                          updated[existingIndex].qty = totalRequested;
                          setComboItems(updated);
                          triggerToast(`Updated "${selProd.name}" quantity to ${totalRequested}`, 'info');
                        } else {
                          setComboItems([...comboItems, { product_id: selectedDropdownProdId, qty: selectedDropdownQty }]);
                          triggerToast(`Added ${selectedDropdownQty} x "${selProd.name}" to combo bundle`, 'success');
                        }
                        setSelectedDropdownProdId('');
                        setSelectedDropdownQty(1);
                      }}
                      className="w-full sm:w-auto px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
                    >
                      <Plus size={14} /> Add to Combo
                    </button>
                  </div>
                </div>

                {/* Selected Combo Products List */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Bundle Component Items ({comboItems.length})
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        const avail = products.filter(p => !isComboProduct(p) && p.current_stock > 0 && !comboItems.some(ci => ci.product_id === p.id));
                        if (avail.length === 0) {
                          triggerToast('No in-stock regular products available to add.', 'warning');
                          return;
                        }
                        setComboItems([...comboItems, { product_id: avail[0].id, qty: 1 }]);
                      }}
                      className="text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Plus size={12} /> Add New Row
                    </button>
                  </div>

                  {comboItems.length === 0 ? (
                    <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-[11px] text-slate-500">
                      No products added to combo yet. Select a product from the dropdown above and click "+ Add to Combo".
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {comboItems.map((ci, idx) => {
                        const prod = products.find(p => p.id === ci.product_id);
                        const itemCost = prod ? prod.purchase_price * ci.qty : 0;
                        const itemPrice = prod ? prod.selling_price * ci.qty : 0;

                        return (
                          <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                            <div className="flex-1 min-w-0 flex items-center gap-2">
                              <span className="w-5 h-5 flex items-center justify-center rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-black shrink-0">
                                {idx + 1}
                              </span>

                              {/* Dropdown to change product */}
                              <select
                                value={ci.product_id}
                                onChange={(e) => {
                                  const targetId = e.target.value;
                                  const targetProd = products.find(p => p.id === targetId);
                                  if (targetProd && targetProd.current_stock <= 0) {
                                    triggerToast(`"${targetProd.name}" is OUT OF STOCK! (Available stock: 0 ${targetProd.unit})`, 'error');
                                    return;
                                  }
                                  if (targetProd && ci.qty > targetProd.current_stock) {
                                    triggerToast(`Quantity adjusted to available stock (${targetProd.current_stock} ${targetProd.unit}) for "${targetProd.name}".`, 'warning');
                                    const updated = [...comboItems];
                                    updated[idx].product_id = targetId;
                                    updated[idx].qty = targetProd.current_stock;
                                    setComboItems(updated);
                                    return;
                                  }
                                  const updated = [...comboItems];
                                  updated[idx].product_id = targetId;
                                  setComboItems(updated);
                                }}
                                className="w-full bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-[11px] font-bold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-hidden truncate"
                              >
                                {products.filter(p => !isComboProduct(p)).map(p => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} (SKU: {p.sku} | Available Stock: {p.current_stock} {p.unit} | Cost: ₹{p.purchase_price})
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="flex items-center gap-3 justify-between sm:justify-end shrink-0">
                              <div className="text-[10px] text-slate-500 font-mono">
                                Cost: <span className="text-amber-600 font-bold">₹{itemCost}</span>
                                <span className="mx-1">•</span>
                                Sell: <span className="text-emerald-600 font-bold">₹{itemPrice}</span>
                              </div>

                              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                                <span className="text-[10px] text-slate-500 font-bold">Qty:</span>
                                <input
                                  type="number"
                                  min="1"
                                  value={ci.qty}
                                  onChange={(e) => {
                                    const newQty = parseInt(e.target.value) || 1;
                                    if (prod && newQty > prod.current_stock) {
                                      triggerToast(`Cannot set ${newQty} units. Only ${prod.current_stock} ${prod.unit} available in stock for "${prod.name}"!`, 'error');
                                      const updated = [...comboItems];
                                      updated[idx].qty = Math.max(1, prod.current_stock);
                                      setComboItems(updated);
                                      return;
                                    }
                                    const updated = [...comboItems];
                                    updated[idx].qty = Math.max(1, newQty);
                                    setComboItems(updated);
                                  }}
                                  className="w-10 text-center font-bold text-[11px] bg-transparent outline-hidden text-slate-800 dark:text-slate-100"
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setComboItems(comboItems.filter((_, i) => i !== idx));
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                                title="Remove from combo"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Real-time Component Cost Summary */}
                  {comboItems.length > 0 && (
                    <div className="flex flex-wrap items-center justify-between pt-2.5 border-t border-purple-200 dark:border-purple-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 gap-2">
                      <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800">
                        <span>Component Cost Total:</span>
                        <span className="text-amber-700 dark:text-amber-400 font-black">₹{comboItems.reduce((sum, ci) => {
                          const p = products.find(prod => prod.id === ci.product_id);
                          return sum + (p ? p.purchase_price * ci.qty : 0);
                        }, 0).toLocaleString()}</span>
                      </div>

                      <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                        <span>Component Selling Total:</span>
                        <span className="text-emerald-700 dark:text-emerald-400 font-black">₹{comboItems.reduce((sum, ci) => {
                          const p = products.find(prod => prod.id === ci.product_id);
                          return sum + (p ? p.selling_price * ci.qty : 0);
                        }, 0).toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Bundle Description</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Details of what is included inside this festive hamper box..."
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-lg border border-slate-300 dark:border-slate-700 focus:outline-hidden"
                />
              </div>

              {/* Footer Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsComboModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-[11px] font-bold hover:bg-purple-700 cursor-pointer shadow-md"
                >
                  Save Combo Box
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== PACK COMBO MODAL ==================== */}
      {isPackModalOpen && packingCombo && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in duration-150 border border-slate-200 dark:border-slate-800">
            <div className="bg-purple-700 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PackagePlus size={18} />
                <h2 className="text-xs font-bold uppercase tracking-wider">Pack Combo Boxes (Finished Goods)</h2>
              </div>
              <button onClick={() => setIsPackModalOpen(false)} className="text-white/80 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-800">
                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase">Combo Box Template</span>
                <p className="text-sm font-black text-slate-900 dark:text-white">{packingCombo.name}</p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">SKU: {packingCombo.sku} | Current Packed Stock: {packingCombo.current_stock} Box(es)</p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Quantity to Pack</label>
                <input
                  type="number"
                  min="1"
                  value={packQty}
                  onChange={(e) => {
                    setPackQty(Math.max(1, parseInt(e.target.value) || 1));
                    setPackError(null);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-sm font-bold rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-hidden"
                />
              </div>

              {/* Component Stock Check Preview */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Component Stock Requirements:</span>
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 divide-y divide-slate-200 dark:divide-slate-700 text-[11px]">
                  {packingCombo.combo_items?.map((ci, idx) => {
                    const prod = products.find(p => p.id === ci.product_id);
                    const reqTotal = ci.qty * packQty;
                    const avail = prod ? prod.current_stock : 0;
                    const isEnough = avail >= reqTotal;

                    return (
                      <div key={idx} className="py-1.5 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{prod?.name || 'Unknown'}</span>
                          <span className="text-[9px] text-slate-400 block">{ci.qty} per box × {packQty} boxes = {reqTotal} required</span>
                        </div>
                        <div className="text-right">
                          <span className={`font-black ${isEnough ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {avail} Available
                          </span>
                          {!isEnough && (
                            <span className="text-[9px] font-bold text-rose-500 block">Short by {reqTotal - avail}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Insufficient Stock Alert */}
              {packError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl space-y-2 text-[11px]">
                  <p className="font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                    <AlertTriangle size={14} /> {packError.message}
                  </p>
                  {packError.missingItems && (
                    <table className="w-full text-[10px] mt-1 border-t border-rose-200 dark:border-rose-800 pt-1">
                      <thead>
                        <tr className="text-left font-bold text-rose-800 dark:text-rose-400">
                          <th>Item</th>
                          <th>Needed</th>
                          <th>In Stock</th>
                          <th>Missing</th>
                        </tr>
                      </thead>
                      <tbody>
                        {packError.missingItems.map((mi, idx) => (
                          <tr key={idx}>
                            <td className="font-bold">{mi.productName}</td>
                            <td>{mi.required}</td>
                            <td>{mi.available}</td>
                            <td className="text-rose-600 font-bold">{mi.missing}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPackModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePackComboSubmit}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-[11px] font-bold hover:bg-purple-700 cursor-pointer shadow-md"
                >
                  Confirm & Pack Stock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== UNPACK / BREAK COMBO MODAL ==================== */}
      {isBreakModalOpen && breakingCombo && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in duration-150 border border-slate-200 dark:border-slate-800">
            <div className="bg-amber-600 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw size={18} />
                <h2 className="text-xs font-bold uppercase tracking-wider">Unpack / Break Combo Box (Reverse Packing)</h2>
              </div>
              <button onClick={() => setIsBreakModalOpen(false)} className="text-white/80 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
                <span className="text-[10px] font-bold text-amber-600 uppercase">Selected Bundle</span>
                <p className="text-sm font-black text-slate-900 dark:text-white">{breakingCombo.name}</p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">Available Packed Stock: {breakingCombo.current_stock} Box(es)</p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Quantity to Unpack/Break</label>
                <input
                  type="number"
                  min="1"
                  max={breakingCombo.current_stock}
                  value={breakQty}
                  onChange={(e) => setBreakQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-sm font-bold rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Reason for Breakdown</label>
                <input
                  type="text"
                  value={breakReason}
                  onChange={(e) => setBreakReason(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-lg border border-slate-300 dark:border-slate-700 focus:outline-hidden"
                />
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Components to be returned to loose stock:</span>
                <ul className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 space-y-0.5">
                  {breakingCombo.combo_items?.map((ci, idx) => {
                    const prod = products.find(p => p.id === ci.product_id);
                    return (
                      <li key={idx}>
                        • +{ci.qty * breakQty} {prod?.unit || 'units'} of {prod?.name || 'Item'}
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBreakModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBreakComboSubmit}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg text-[11px] font-bold hover:bg-amber-700 cursor-pointer shadow-md"
                >
                  Confirm & Break Bundle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== COMBO AUDIT TRAIL & DETAILS DRAWER ==================== */}
      {isAuditModalOpen && viewingCombo && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in duration-150 border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <History size={18} className="text-purple-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider">Combo Box Audit Trail & Specifications</h2>
              </div>
              <button onClick={() => setIsAuditModalOpen(false)} className="text-white/80 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Header Info */}
              <div className="flex items-start gap-4 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-800">
                <img src={viewingCombo.image_url} alt={viewingCombo.name} className="w-14 h-14 object-cover rounded-lg border border-purple-300" />
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">{viewingCombo.name}</h3>
                  <p className="text-[10px] text-slate-500 font-mono">SKU: {viewingCombo.sku} | Barcode: {viewingCombo.barcode}</p>
                  <div className="flex gap-3 text-[11px] font-bold text-purple-700 dark:text-purple-300 mt-1">
                    <span>Packed Goods Stock: {viewingCombo.current_stock} Box(es)</span>
                    <span>Selling Price: ₹{viewingCombo.selling_price}</span>
                  </div>
                </div>
              </div>

              {/* Component Specs Table */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500">Component Items Mapping</h4>
                <table className="w-full text-left text-[11px] bg-slate-50 dark:bg-slate-800/60 rounded-xl overflow-hidden">
                  <thead className="bg-slate-200 dark:bg-slate-700 font-bold uppercase text-[9px] text-slate-700 dark:text-slate-200">
                    <tr>
                      <th className="p-2">Component Product</th>
                      <th className="p-2">Qty per Combo</th>
                      <th className="p-2">Current Loose Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {viewingCombo.combo_items?.map((ci, idx) => {
                      const prod = products.find(p => p.id === ci.product_id);
                      return (
                        <tr key={idx}>
                          <td className="p-2 font-bold">{prod?.name || 'Product'}</td>
                          <td className="p-2 font-mono">x{ci.qty}</td>
                          <td className="p-2 font-bold text-indigo-600">{prod?.current_stock} {prod?.unit}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Transaction Audit Logs */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500">History & Audit Log</h4>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {dbStore.getComboLogs(businessId, viewingCombo.id).map((log) => (
                    <div key={log.id} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px]">
                      <div className="flex items-center justify-between">
                        <span className={`font-black uppercase tracking-wider px-1.5 py-0.5 rounded text-[8px] ${
                          log.action === 'Created' ? 'bg-blue-100 text-blue-700' :
                          log.action === 'Packed' ? 'bg-purple-100 text-purple-700' :
                          log.action === 'Unpacked' || log.action === 'Auto-Broken' ? 'bg-amber-100 text-amber-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {log.action}
                        </span>
                        <span className="text-slate-400 font-mono">{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1">{log.details}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">By {log.performed_by}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Print Setup Modal */}
      {printingBarcodeProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          {/* Dynamic Print Styles for thermal sticker sizes */}
          <style>{`
            @media print {
              @page { 
                size: ${printLabelsPerRow === 2 ? (printLabelSize === '38x25' ? '80mm' : '104mm') : (printLabelSize === '38x25' ? '40mm' : '52mm')} ${printLabelSize === '50x38' ? '38mm' : '25mm'}; 
                margin: 0mm !important; 
              }
              html, body { 
                margin: 0 !important; 
                padding: 0 !important; 
                background: #ffffff !important;
                color: #000000 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                width: 100% !important;
                height: auto !important;
                overflow: visible !important;
              }

              /* Prevent overflow hidden on parent containers from clipping print areas */
              *, div, section, main, article, body, #root {
                overflow: visible !important;
              }
              
              /* Hide all normal UI elements in print */
              body * {
                visibility: hidden !important;
              }

              .no-print, .no-print * {
                display: none !important;
                visibility: hidden !important;
              }

              /* Force printable barcode area to be visible and cover full page */
              .print-area, .print-area * {
                visibility: visible !important;
              }

              .print-area { 
                display: block !important; 
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: ${printLabelsPerRow === 2 ? (printLabelSize === '38x25' ? '80mm' : '104mm') : (printLabelSize === '38x25' ? '40mm' : '52mm')} !important;
                height: auto !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                z-index: 99999999 !important;
                overflow: visible !important;
              }
              
              .barcode-print-grid { 
                display: flex !important; 
                flex-wrap: wrap !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                align-content: flex-start !important;
              }
              
              .barcode-label-sticker {
                box-sizing: border-box !important;
                margin: 0 !important;
                border: none !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: flex-start !important;
                align-items: center !important;
                text-align: center !important;
                overflow: hidden !important;
                background: #ffffff !important;
                color: #000000 !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              
              .barcode-label-sticker * {
                color: #000000 !important;
              }
              ${printLabelsPerRow === 2 ? `
              .barcode-label-sticker:nth-child(odd) {
                margin-right: 4mm !important; /* Space between two columns */
              }
              ` : ''}

              /* SVG Barcode crisp rendering */
              .barcode-label-sticker svg {
                visibility: visible !important;
                display: block !important;
                margin: 0 auto !important;
                max-width: 100% !important;
                background-color: #ffffff !important;
              }

              .barcode-label-sticker svg rect,
              .barcode-label-sticker svg path,
              .barcode-label-sticker svg text {
                visibility: visible !important;
              }

              ${printLabelSize === '50x25' ? `
                .barcode-label-sticker {
                  width: 50mm !important;
                  height: 25mm !important;
                  padding: 1mm 1.5mm !important;
                }
              ` : printLabelSize === '50x38' ? `
                .barcode-label-sticker {
                  width: 50mm !important;
                  height: 38mm !important;
                  padding: 1.5mm 2mm !important;
                }
              ` : printLabelSize === '38x25' ? `
                .barcode-label-sticker {
                  width: 38mm !important;
                  height: 25mm !important;
                  padding: 1mm 1.5mm !important;
                }
              ` : `
                .barcode-label-sticker {
                  width: 220px !important;
                  padding: 10px !important;
                  border: 1px solid #eee !important;
                }
              `}
            }
          `}</style>

          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg overflow-hidden shadow-xl animate-in zoom-in duration-150 my-auto border border-slate-200 dark:border-slate-800">
            <div className="bg-slate-950 text-white px-6 py-4 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <Printer size={16} />
                <span>Barcode Generator & Thermal Print Station</span>
              </h2>
              <button onClick={() => setPrintingBarcodeProduct(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Size & Layout Selector */}
              <div className="no-print grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    Label Size
                  </label>
                  <div className="grid grid-cols-2 gap-1">
                    {(['50x25', '50x38', '38x25', 'standard'] as const).map(size => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setPrintLabelSize(size)}
                        className={`py-1.5 px-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          printLabelSize === size
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {size.replace('x', ' x ')} {size !== 'standard' && 'mm'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    Labels Per Row
                  </label>
                  <div className="grid grid-cols-2 gap-1">
                    {[1, 2].map(num => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setPrintLabelsPerRow(num as 1 | 2)}
                        className={`py-1.5 px-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          printLabelsPerRow === num
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {num} Column{num > 1 && 's'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* LIVE PREVIEW */}
              <div className="flex flex-col items-center justify-center no-print">
                <span className="text-[10px] font-bold text-slate-500 uppercase mb-2">Live Print Preview</span>
                
                {/* 50x25 mm Sticker Preview */}
                {printLabelSize === '50x25' && (
                  <div className="w-[189px] h-[95px] p-1 bg-white rounded-md border-2 border-indigo-400 shadow-md flex flex-col justify-between items-center text-center overflow-hidden font-sans select-none relative">
                    <div className="w-full">
                      <div className="text-[7.5px] font-black text-slate-900 uppercase leading-none truncate mb-0.5">{printCompanyName}</div>
                      <div className="text-[8.5px] font-black text-slate-900 uppercase tracking-tight leading-none truncate w-full px-0.5 border-b border-slate-100 pb-0.5">
                        {printingBarcodeProduct.name}
                      </div>
                    </div>
                    
                    <div className="my-0 flex items-center justify-center">
                      <ReactBarcode 
                        value={printingBarcodeProduct.barcode || printingBarcodeProduct.sku} 
                        height={24} 
                        width={1.05}
                        fontSize={7.5}
                        margin={0}
                        displayValue={true}
                      />
                    </div>

                    <div className="w-full text-[7.5px] font-black text-slate-900 leading-none pt-0.5 uppercase border-t border-slate-200">
                      <div className="flex justify-between items-center px-1 mb-0.5">
                        <span>MRP: ₹{printMrp}</span>
                        <span className="text-indigo-700">SALE: ₹{printSalePrice}</span>
                      </div>
                      <div className="flex justify-between items-center px-1 text-[6.5px] text-slate-600">
                        <span>PKD: {printPackedOn}</span>
                        <span>EXP: {printExpiryOn}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 50x38 mm Sticker Preview */}
                {printLabelSize === '50x38' && (
                  <div className="w-[189px] h-[143px] p-2 bg-white rounded-md border-2 border-indigo-400 shadow-md flex flex-col justify-between items-center text-center overflow-hidden font-sans select-none">
                    <span className="text-[9.5px] font-black text-slate-900 uppercase tracking-tight leading-tight truncate w-full">
                      {printingBarcodeProduct.name}
                    </span>
                    <div className="my-1">
                      <ReactBarcode 
                        value={printingBarcodeProduct.barcode || printingBarcodeProduct.sku} 
                        height={32} 
                        width={1.1}
                        fontSize={9}
                        margin={0}
                        displayValue={true}
                      />
                    </div>
                    <div className="w-full space-y-0.5 text-[8.5px] font-bold text-slate-900 uppercase border-t border-slate-200 pt-1">
                      <div className="flex justify-between">
                        <span>MRP: ₹{printMrp}</span>
                        <span>SALE: ₹{printSalePrice}</span>
                      </div>
                      <div className="flex justify-between text-[7.5px] text-slate-600">
                        <span>PKD: {printPackedOn}</span>
                        {printExpiryOn && <span>EXP: {printExpiryOn}</span>}
                      </div>
                      <div className="font-black tracking-widest text-[8px] text-indigo-900 truncate">
                        {printCompanyName}
                      </div>
                    </div>
                  </div>
                )}

                {/* 38x25 mm Sticker Preview */}
                {printLabelSize === '38x25' && (
                  <div className="w-[143px] h-[95px] p-1 bg-white rounded-md border-2 border-indigo-400 shadow-md flex flex-col justify-between items-center text-center overflow-hidden font-sans select-none">
                    <span className="text-[7.5px] font-black text-slate-900 uppercase tracking-tight leading-none truncate w-full border-b border-slate-100 mb-0.5">
                      {printingBarcodeProduct.name}
                    </span>
                    <div className="my-0.5">
                      <ReactBarcode 
                        value={printingBarcodeProduct.barcode || printingBarcodeProduct.sku} 
                        height={18} 
                        width={0.9}
                        fontSize={7}
                        margin={0}
                        displayValue={true}
                      />
                    </div>
                    <div className="w-full space-y-0.5 text-[6.5px] font-black text-slate-900 border-t border-slate-200 pt-0.5 uppercase">
                      <div className="flex justify-between">
                        <span>MRP: ₹{printMrp}</span>
                        <span>SALE: ₹{printSalePrice}</span>
                      </div>
                      <div className="text-[6px] text-slate-500 font-bold">
                        PKD: {printPackedOn} | EXP: {printExpiryOn}
                      </div>
                    </div>
                  </div>
                )}

                {/* 220px Standard Card Preview */}
                {printLabelSize === 'standard' && (
                  <div className="p-4 bg-white rounded-lg border-2 border-indigo-400 shadow-md flex flex-col items-center text-center w-[220px]">
                    <span className="text-[11px] font-black text-slate-900 uppercase mb-1 leading-tight">{printingBarcodeProduct.name}</span>
                    <div className="py-1">
                      <ReactBarcode 
                        value={printingBarcodeProduct.barcode || printingBarcodeProduct.sku} 
                        height={40} 
                        width={1.2}
                        fontSize={11}
                        margin={0}
                        displayValue={true}
                      />
                    </div>
                    <div className="flex flex-col items-center gap-0.5 mt-1 text-slate-900 font-bold uppercase" style={{ fontSize: '10px' }}>
                      <div className="flex items-center gap-1">
                        <span>MRP:</span>
                        <span className="font-black">₹{printMrp}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>Sale Price:</span>
                        <span className="font-black">₹{printSalePrice}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>PACKED ON:</span>
                        <span className="font-black">{printPackedOn}</span>
                      </div>
                      {printExpiryOn && (
                        <div className="flex items-center gap-1">
                          <span>EXPIRY ON:</span>
                          <span className="font-black">{printExpiryOn}</span>
                        </div>
                      )}
                      <div className="mt-1 font-black tracking-widest border-t border-slate-200 pt-0.5 w-full">
                        {printCompanyName}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Editable Controls */}
              <div className="grid grid-cols-2 gap-3 no-print">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">MRP (₹)</label>
                  <input 
                    type="number"
                    value={printMrp}
                    onChange={(e) => setPrintMrp(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Sale Price (₹)</label>
                  <input 
                    type="number"
                    value={printSalePrice}
                    onChange={(e) => setPrintSalePrice(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Packed On</label>
                  <input 
                    type="date"
                    value={printPackedOn}
                    onChange={(e) => setPrintPackedOn(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Expiry On</label>
                  <input 
                    type="date"
                    value={printExpiryOn}
                    onChange={(e) => setPrintExpiryOn(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Company / Brand</label>
                  <input 
                    type="text"
                    value={printCompanyName}
                    onChange={(e) => setPrintCompanyName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Labels to Print</label>
                  <input 
                    type="number"
                    min="1"
                    max="500"
                    value={printLabelCount}
                    onChange={(e) => setPrintLabelCount(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Printable Area */}
              <div className="print-area hidden">
                <div className="barcode-print-grid">
                  {Array.from({ length: printLabelCount }).map((_, idx) => (
                    <div key={idx} className="barcode-label-sticker bg-white">
                      {printLabelSize === '50x25' ? (
                        <div className="w-full h-full flex flex-col justify-start items-center text-center p-0 bg-white">
                          <div className="w-full mt-[1mm] px-[1mm]">
                            <div className="text-[10px] font-black text-black uppercase leading-tight truncate w-full">
                              {printingBarcodeProduct.name}
                            </div>
                          </div>
                          <div className="my-[1mm] flex items-center justify-center">
                            <ReactBarcode 
                              value={printingBarcodeProduct.barcode || printingBarcodeProduct.sku} 
                              height={26} 
                              width={1.2}
                              fontSize={10}
                              fontOptions="bold"
                              margin={0}
                              displayValue={true}
                            />
                          </div>
                          <div className="w-full text-[9px] font-bold text-black uppercase leading-[12px] flex flex-col items-center pb-[1mm]">
                            <div>Sale Price: RS.{printSalePrice}</div>
                            <div>PACKED DATE {printPackedOn}</div>
                            <div>EXPIRY ON {printExpiryOn}</div>
                            <div className="mt-[1mm] text-[10px] font-black tracking-widest">{printCompanyName}</div>
                          </div>
                        </div>
                      ) : printLabelSize === '50x38' ? (
                        <div className="w-full h-full flex flex-col justify-start items-center text-center p-0 bg-white">
                          <div className="w-full mt-[2mm] px-[2mm]">
                            <div className="text-[12px] font-black text-black uppercase leading-tight truncate w-full">
                              {printingBarcodeProduct.name}
                            </div>
                          </div>
                          <div className="my-[2mm] flex items-center justify-center">
                            <ReactBarcode 
                              value={printingBarcodeProduct.barcode || printingBarcodeProduct.sku} 
                              height={36} 
                              width={1.3}
                              fontSize={12}
                              fontOptions="bold"
                              margin={0}
                              displayValue={true}
                            />
                          </div>
                          <div className="w-full text-[11px] font-bold text-black uppercase leading-[14px] flex flex-col items-center">
                            <div>Sale Price: RS.{printSalePrice}</div>
                            <div>PACKED DATE {printPackedOn}</div>
                            <div>EXPIRY ON {printExpiryOn}</div>
                            <div className="mt-[2mm] text-[12px] font-black tracking-widest">{printCompanyName}</div>
                          </div>
                        </div>
                      ) : printLabelSize === '38x25' ? (
                        <div className="w-full h-full flex flex-col justify-start items-center text-center p-0 bg-white">
                          <div className="w-full mt-[1mm] px-[1mm]">
                            <div className="text-[8px] font-black text-black uppercase leading-tight truncate w-full">
                              {printingBarcodeProduct.name}
                            </div>
                          </div>
                          <div className="my-[1mm] flex items-center justify-center">
                            <ReactBarcode 
                              value={printingBarcodeProduct.barcode || printingBarcodeProduct.sku} 
                              height={20} 
                              width={1.05}
                              fontSize={8}
                              fontOptions="bold"
                              margin={0}
                              displayValue={true}
                            />
                          </div>
                          <div className="w-full text-[7px] font-bold text-black uppercase leading-[9px] flex flex-col items-center">
                            <div>Sale Price: RS.{printSalePrice}</div>
                            <div>PKD: {printPackedOn} | EXP: {printExpiryOn}</div>
                            <div className="mt-[1mm] text-[8px] font-black tracking-widest">{printCompanyName}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-white border border-slate-200 flex flex-col items-center text-center w-[220px]">
                          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{printCompanyName}</div>
                          <span className="text-[11px] font-black text-slate-900 uppercase mb-1 leading-tight">{printingBarcodeProduct.name}</span>
                          <div className="py-1">
                            <ReactBarcode 
                              value={printingBarcodeProduct.barcode || printingBarcodeProduct.sku} 
                              height={40} 
                              width={1.2}
                              fontSize={11}
                              margin={0}
                              displayValue={true}
                            />
                          </div>
                          <div className="flex flex-col items-center gap-0.5 mt-1 text-slate-900 font-bold uppercase" style={{ fontSize: '10px' }}>
                            <div className="flex items-center gap-1">
                              <span>MRP:</span>
                              <span className="font-black">₹{printMrp}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span>Sale Price:</span>
                              <span className="font-black">₹{printSalePrice}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span>PACKED ON:</span>
                              <span className="font-black">{printPackedOn}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span>EXPIRY ON:</span>
                              <span className="font-black">{printExpiryOn}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 no-print">
                <button 
                  onClick={() => setPrintingBarcodeProduct(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handlePrintBarcodeSubmit}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[11px] font-semibold hover:bg-indigo-700 cursor-pointer flex items-center gap-2 shadow-sm"
                >
                  <Printer size={14} />
                  <span>Send to Barcode Printer ({printLabelSize === '50x25' ? '50x25 mm' : printLabelSize})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Standard Add/Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in duration-150 border border-slate-200 dark:border-slate-800 my-8">
            <div className="bg-slate-950 text-white px-6 py-4 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <Package />
                <span>{editingProduct ? 'Edit Catalog Product Specifications' : 'New Individual Product Master'}</span>
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Product Name *</label>
                  <input 
                    type="text" 
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Bhajani Chakli 1kg"
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Category *</label>
                    <button
                      type="button"
                      onClick={() => setIsQuickCategoryOpen(!isQuickCategoryOpen)}
                      className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-0.5"
                      title="Add a new category"
                    >
                      <Plus size={10} /> {isQuickCategoryOpen ? 'Select Existing' : 'New Category'}
                    </button>
                  </div>

                  {isQuickCategoryOpen ? (
                    <div className="flex gap-1">
                      <input 
                        type="text"
                        autoFocus
                        value={quickCategoryName}
                        onChange={(e) => setQuickCategoryName(e.target.value)}
                        placeholder="Type new category name..."
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 text-[11px] font-bold rounded-lg border border-indigo-400 focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={handleCreateQuickCategory}
                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-bold hover:bg-indigo-700 cursor-pointer shrink-0 flex items-center gap-1 shadow-xs"
                      >
                        <Plus size={10} /> Add
                      </button>
                    </div>
                  ) : (
                    <SearchableCategorySelect
                      categories={categories}
                      value={formCategory || categories[0]?.id || ''}
                      onChange={(catId) => setFormCategory(catId)}
                      onCategoryCreated={(newCat) => {
                        const updatedCats = dbStore.getCategories(businessId);
                        setCategories(updatedCats);
                        triggerToast(`Category "${newCat.name}" created and selected!`, 'success');
                      }}
                      businessId={businessId}
                      placeholder="Search or select category..."
                    />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">SKU Identifier *</label>
                    <button
                      type="button"
                      onClick={() => setFormSku(generateRandomSku())}
                      className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-0.5"
                      title="Generate new SKU"
                    >
                      <RefreshCw size={10} /> Auto
                    </button>
                  </div>
                  <input 
                    type="text" 
                    required
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    placeholder="e.g. SKU-CHK-101"
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Barcode Number *</label>
                    <button
                      type="button"
                      onClick={() => setFormBarcode(generateRandomBarcode())}
                      className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-0.5"
                      title="Generate new EAN Barcode"
                    >
                      <RefreshCw size={10} /> Generate
                    </button>
                  </div>
                  <div className="flex gap-1">
                    <input 
                      type="text" 
                      required
                      value={formBarcode}
                      onChange={(e) => setFormBarcode(e.target.value)}
                      placeholder="8901234500001"
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-lg border border-indigo-300 dark:border-indigo-700 focus:outline-hidden font-mono font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50/20"
                    />
                    <button
                      type="button"
                      onClick={() => setIsScannerOpen(true)}
                      className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/40 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 rounded-lg border border-indigo-200 dark:border-indigo-700 font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                      title="Scan Barcode / QR Code via Camera"
                    >
                      <Camera size={14} />
                      <span className="hidden sm:inline">Scan</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Brand</label>
                  <input 
                    type="text" 
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    placeholder="Kokanastha Special"
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Unit of Measure</label>
                  <select 
                    value={formUnit} 
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                  >
                    <option value="Kg">Kg (Kilogram)</option>
                    <option value="Gram">Gram</option>
                    <option value="Pkt">Pkt (Packet)</option>
                    <option value="Box">Box</option>
                    <option value="Pcs">Pcs (Pieces)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Purchase Price (₹)</label>
                  <input 
                    type="number" 
                    value={formPurchasePrice}
                    onChange={(e) => setFormPurchasePrice(e.target.value)}
                    placeholder="220"
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">NR - Normal Rate (₹)</label>
                  <input 
                    type="number" 
                    value={formSellingPrice}
                    onChange={(e) => setFormSellingPrice(e.target.value)}
                    placeholder="320"
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">LMR - Loyal Member Rate (₹)</label>
                  <input 
                    type="number" 
                    value={formRateLmr}
                    onChange={(e) => setFormRateLmr(e.target.value)}
                    placeholder={formSellingPrice ? `${formSellingPrice}` : 'Loyal rate'}
                    className="w-full px-3 py-1.5 bg-indigo-50/50 dark:bg-indigo-950/30 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 rounded-lg border border-indigo-200 dark:border-indigo-800 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">ABR - Advance Booking Rate (₹)</label>
                  <input 
                    type="number" 
                    value={formRateAbr}
                    onChange={(e) => setFormRateAbr(e.target.value)}
                    placeholder={formSellingPrice ? `${formSellingPrice}` : 'Advance rate'}
                    className="w-full px-3 py-1.5 bg-blue-50/50 dark:bg-blue-950/30 text-[11px] font-bold text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-800 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">DDR - Diwali Discount Rate (₹)</label>
                  <input 
                    type="number" 
                    value={formRateDdr}
                    onChange={(e) => setFormRateDdr(e.target.value)}
                    placeholder={formSellingPrice ? `${formSellingPrice}` : 'Diwali rate'}
                    className="w-full px-3 py-1.5 bg-amber-50/50 dark:bg-amber-950/30 text-[11px] font-bold text-amber-700 dark:text-amber-300 rounded-lg border border-amber-200 dark:border-amber-800 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">MRP (₹)</label>
                  <input 
                    type="number" 
                    value={formMrp}
                    onChange={(e) => setFormMrp(e.target.value)}
                    placeholder="350"
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                  />
                </div>

                <div className="md:col-span-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      id="auto_conversion"
                      checked={formAutoConversion}
                      onChange={(e) => setFormAutoConversion(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                    <label htmlFor="auto_conversion" className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Enable Purchase to Inventory Auto Conversion
                    </label>
                  </div>
                  
                  {formAutoConversion && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/50 mt-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Purchase Unit</label>
                        <select 
                          value={formPurchaseUnit} 
                          onChange={(e) => setFormPurchaseUnit(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 text-[11px] rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-hidden"
                        >
                          <option value="Kg">Kg (Kilogram)</option>
                          <option value="Ltr">Liter</option>
                          <option value="Gram">Gram</option>
                          <option value="Box">Box</option>
                        </select>
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Selling Unit</label>
                        <select 
                          value={formSellingUnit} 
                          onChange={(e) => setFormSellingUnit(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 text-[11px] rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-hidden"
                        >
                          <option value="Packet">Packet</option>
                          <option value="Unit">Unit</option>
                          <option value="Pcs">Pieces</option>
                          <option value="Gram">Gram</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Pack Size</label>
                        <div className="flex gap-1 items-center">
                          <input 
                            type="number" 
                            required={formAutoConversion}
                            value={formPackSize}
                            onChange={(e) => setFormPackSize(e.target.value)}
                            placeholder="e.g. 250"
                            className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 text-[11px] rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-hidden"
                          />
                          <span className="text-[10px] font-bold text-slate-500">
                            {formPurchaseUnit === 'Kg' ? 'g' : formPurchaseUnit === 'Ltr' ? 'ml' : 'units'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="md:col-span-3 text-[10px] text-slate-500 italic">
                        Conversion Formula: {formPurchaseUnit === 'Kg' || formPurchaseUnit === 'Ltr' ? `(Purchase Qty * 1000) / Pack Size = ${formSellingUnit}s` : `Purchase Qty * Pack Size = ${formSellingUnit}s`}
                      </div>
                    </div>
                  )}
                </div>

                {!editingProduct && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Opening Loose Stock</label>
                    <input 
                      type="number" 
                      value={formOpeningStock}
                      onChange={(e) => setFormOpeningStock(e.target.value)}
                      placeholder="10"
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[11px] font-bold hover:bg-indigo-700 cursor-pointer shadow-md"
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
              const data = JSON.parse(scannedData);
              if (data.barcode) setFormBarcode(data.barcode);
              else setFormBarcode(scannedData);
              if (data.name) setFormName(data.name);
              if (data.sku) setFormSku(data.sku);
              triggerToast('QR code scanned: Product info populated!', 'success');
            } catch (e) {
              setFormBarcode(scannedData);
              triggerToast('Barcode scanned successfully', 'success');
            }
          }}
        />
      )}

      {/* ==================== DELETE CONFIRMATION MODAL ==================== */}
      {isDeleteConfirmOpen && productToDelete && (
        <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-200 border border-slate-200 dark:border-slate-800">
            <div className="bg-rose-50 dark:bg-rose-900/20 p-6 text-center">
              <div className="mx-auto w-16 h-16 bg-rose-100 dark:bg-rose-900/40 rounded-full flex items-center justify-center mb-4">
                <Trash2 size={32} className="text-rose-600 dark:text-rose-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Confirm Deletion</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Are you sure you want to delete <span className="font-bold text-slate-900 dark:text-white">"{productToDelete.name}"</span>?
              </p>
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-3 font-semibold bg-rose-50 dark:bg-rose-950/30 py-1.5 px-3 rounded-lg inline-block border border-rose-100 dark:border-rose-900/30">
                This action is permanent and cannot be undone.
              </p>
            </div>
            
            <div className="p-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteConfirmOpen(false);
                  setProductToDelete(null);
                }}
                className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                No
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    const result = dbStore.deleteProduct(productToDelete.id);
                    if (result.success) {
                      dbStore.logActivity(user.id, user.name, user.role, 'Delete Product', `Deleted product: ${productToDelete.name} (SKU: ${productToDelete.sku})`, businessId);
                      const updatedList = dbStore.getProducts(businessId);
                      setProducts(updatedList);
                      triggerToast('Product deleted successfully', 'success');
                      setIsDeleteConfirmOpen(false);
                      setProductToDelete(null);
                    } else {
                      triggerToast(result.error || 'Failed to delete product', 'error');
                    }
                  } catch (err: any) {
                    triggerToast(err.message || 'An error occurred', 'error');
                  }
                }}
                className="flex-1 px-4 py-3 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 transition-colors shadow-lg shadow-rose-200 dark:shadow-none cursor-pointer active:scale-95"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Progress Modal Overlay */}
      {uploadProgress && (
        <div className="fixed inset-0 z-[120] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <Loader2 size={24} className="animate-spin" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Importing Products</h4>
                <p className="text-xs text-slate-500 truncate max-w-[260px]">{uploadProgress.fileName}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                <span>{uploadProgress.statusText}</span>
                <span>{uploadProgress.progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress.progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Skipped Items Summary Modal */}
      {importSummaryModal.isOpen && (
        <div className="fixed inset-0 z-[110] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg">
                  <AlertCircle size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Import Summary Report</h3>
                  <p className="text-[11px] text-slate-500">
                    Imported: <span className="font-bold text-emerald-600 dark:text-emerald-400">{importSummaryModal.importedCount}</span> | Skipped: <span className="font-bold text-amber-600 dark:text-amber-400">{importSummaryModal.skippedCount}</span>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setImportSummaryModal(prev => ({ ...prev, isOpen: false }))}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                The following product rows were skipped to prevent duplicates or invalid entries:
              </p>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                    <tr>
                      <th className="py-2 px-3 border-b border-slate-200 dark:border-slate-700 w-16">Row #</th>
                      <th className="py-2 px-3 border-b border-slate-200 dark:border-slate-700">Product Name</th>
                      <th className="py-2 px-3 border-b border-slate-200 dark:border-slate-700">Reason Skipped</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {importSummaryModal.skippedDetails.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="py-2 px-3 font-mono text-slate-500">{item.rowNum}</td>
                        <td className="py-2 px-3 font-bold text-slate-800 dark:text-slate-200">{item.name}</td>
                        <td className="py-2 px-3 text-amber-600 dark:text-amber-400 font-medium">{item.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setImportSummaryModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors cursor-pointer shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
