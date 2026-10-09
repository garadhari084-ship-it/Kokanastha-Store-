import { PageHeader } from './PageHeader';
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
  Check,
  Salad,
  Flame,
  Apple,
  ExternalLink,
  Phone,
  Save
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { dbStore, isComboProduct } from '../services/store';
import { Product, Category, UserProfile, ComboItem, ComboHistoryLog } from '../types/erp';
import { safeStorage } from '../utils/safeStorage';
import { Camera } from 'lucide-react';
import { BarcodeScanner } from './BarcodeScanner';
import ReactBarcode from 'react-barcode';
import { ProductNutritionModal } from './ProductNutritionModal';

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

interface SearchableProductSelectForComboProps {
  products: Product[];
  value: string;
  onChange: (productId: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const SearchableProductSelectForCombo: React.FC<SearchableProductSelectForComboProps> = ({
  products,
  value,
  onChange,
  placeholder = "-- Search or select available product --",
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedProduct = products.find(p => p.id === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const regularProducts = products.filter(p => !isComboProduct(p));

  const filteredProducts = regularProducts.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.barcode && p.barcode.toLowerCase().includes(q)) ||
      (p.brand && p.brand.toLowerCase().includes(q))
    );
  });

  const handleSelect = (prodId: string) => {
    onChange(prodId);
    setSearchQuery('');
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
        className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-[11px] font-bold rounded-lg border border-slate-300 dark:border-slate-700 flex items-center justify-between cursor-pointer hover:border-purple-400 dark:hover:border-purple-500 transition-colors shadow-2xs ${
          isOpen ? 'ring-2 ring-purple-500/20 border-purple-500' : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex-1 truncate flex items-center gap-2">
          <Package size={13} className="text-purple-600 shrink-0" />
          {selectedProduct ? (
            <div className="flex items-center gap-2 truncate">
              <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                {selectedProduct.name}
              </span>
              <span className="text-[10px] text-slate-400 font-mono shrink-0">
                ({selectedProduct.sku})
              </span>
              <span className="text-purple-600 dark:text-purple-400 font-bold shrink-0">
                ₹{selectedProduct.selling_price}
              </span>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded font-black shrink-0 border ${
                  selectedProduct.current_stock > 0
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                }`}
              >
                Stock: {selectedProduct.current_stock} {selectedProduct.unit}
                {selectedProduct.current_stock <= 0 ? ' (Negative Allowed)' : ''}
              </span>
            </div>
          ) : (
            <span className="text-slate-400 font-medium">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-2">
          {selectedProduct && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
                setSearchQuery('');
              }}
              className="p-0.5 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
              title="Clear selection"
            >
              <X size={13} />
            </button>
          )}
          <ChevronDown
            size={14}
            className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-2 space-y-2 animate-in fade-in zoom-in-95 duration-100 max-h-72 flex flex-col">
          {/* Search Input */}
          <div className="relative flex items-center shrink-0">
            <Search size={13} className="absolute left-2.5 text-slate-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product by Name, SKU, Barcode, Brand..."
              className="w-full pl-8 pr-7 py-1.5 bg-slate-100 dark:bg-slate-800 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-purple-500 dark:text-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Products List */}
          <div className="overflow-y-auto space-y-1 text-[11px] custom-scrollbar flex-1 max-h-56 pr-0.5">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((p) => {
                const isSelected = p.id === value;
                const isOutOfStock = p.current_stock <= 0;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelect(p.id)}
                    className={`w-full text-left px-2.5 py-2 rounded-lg font-medium flex items-center justify-between gap-2 transition-colors cursor-pointer border ${
                      isSelected
                        ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800'
                        : isOutOfStock
                        ? 'bg-amber-50/40 dark:bg-amber-950/20 text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/40 border-slate-100 dark:border-slate-800'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border-transparent'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[11px] text-slate-900 dark:text-slate-100 truncate">
                          {p.name}
                        </span>
                        {p.brand && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
                            {p.brand}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                        <span>SKU: {p.sku}</span>
                        <span>•</span>
                        <span className="text-purple-600 dark:text-purple-400 font-bold">₹{p.selling_price}</span>
                        <span>•</span>
                        <span>Cost: ₹{p.purchase_price}</span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2 text-right">
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded font-black border ${
                          p.current_stock > 0
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                            : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800'
                        }`}
                      >
                        {p.current_stock > 0
                          ? `Stock: ${p.current_stock} ${p.unit}`
                          : `Stock: ${p.current_stock} ${p.unit} (Negative Allowed)`}
                      </span>
                      {isSelected && <Check size={14} className="text-purple-600 dark:text-purple-400" />}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="py-6 text-center text-slate-400 text-[11px]">
                <Package size={20} className="mx-auto mb-1 opacity-40" />
                No regular products match "{searchQuery}"
              </div>
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
  initialCategoryId?: string;
}

export const getThermalDimensions = (
  size: '50x25' | '50x38' | '38x25' | '40x25' | '50x30' | '50x50' | '50x75' | '60x100' | '100x60' | '100x50' | '100x75' | '100x100' | 'standard',
  perRow: 1 | 2
) => {
  let stickerWidthMm = '50mm';
  let stickerHeightMm = '25mm';
  let rowHeightMm = '25mm';
  let rollWidthMm = perRow === 2 ? '104mm' : '50mm';

  switch (size) {
    case '38x25':
      stickerWidthMm = '38mm';
      stickerHeightMm = '25mm';
      rowHeightMm = '25mm';
      rollWidthMm = perRow === 2 ? '80mm' : '38mm';
      break;
    case '40x25':
      stickerWidthMm = '40mm';
      stickerHeightMm = '25mm';
      rowHeightMm = '25mm';
      rollWidthMm = perRow === 2 ? '84mm' : '40mm';
      break;
    case '50x30':
      stickerWidthMm = '50mm';
      stickerHeightMm = '30mm';
      rowHeightMm = '30mm';
      rollWidthMm = perRow === 2 ? '104mm' : '50mm';
      break;
    case '50x38':
      stickerWidthMm = '50mm';
      stickerHeightMm = '38mm';
      rowHeightMm = '38mm';
      rollWidthMm = perRow === 2 ? '104mm' : '50mm';
      break;
    case '50x50':
      stickerWidthMm = '50mm';
      stickerHeightMm = '50mm';
      rowHeightMm = '50mm';
      rollWidthMm = perRow === 2 ? '104mm' : '50mm';
      break;
    case '50x75':
      stickerWidthMm = '50mm';
      stickerHeightMm = '75mm';
      rowHeightMm = '75mm';
      rollWidthMm = perRow === 2 ? '104mm' : '50mm';
      break;
    case '60x100':
      stickerWidthMm = '60mm';
      stickerHeightMm = '100mm';
      rowHeightMm = '100mm';
      rollWidthMm = perRow === 2 ? '124mm' : '60mm';
      break;
    case '100x60':
      stickerWidthMm = '100mm';
      stickerHeightMm = '60mm';
      rowHeightMm = '60mm';
      rollWidthMm = perRow === 2 ? '204mm' : '100mm';
      break;
    case '100x50':
      stickerWidthMm = '100mm';
      stickerHeightMm = '50mm';
      rowHeightMm = '50mm';
      rollWidthMm = perRow === 2 ? '204mm' : '100mm';
      break;
    case '100x75':
      stickerWidthMm = '100mm';
      stickerHeightMm = '75mm';
      rowHeightMm = '75mm';
      rollWidthMm = perRow === 2 ? '204mm' : '100mm';
      break;
    case '100x100':
      stickerWidthMm = '100mm';
      stickerHeightMm = '100mm';
      rowHeightMm = '100mm';
      rollWidthMm = perRow === 2 ? '204mm' : '100mm';
      break;
    case '50x25':
    default:
      stickerWidthMm = '50mm';
      stickerHeightMm = '25mm';
      rowHeightMm = '25mm';
      rollWidthMm = perRow === 2 ? '104mm' : '50mm';
      break;
  }

  return { stickerWidthMm, stickerHeightMm, rowHeightMm, rollWidthMm };
};

export const LABEL_SIZE_INFO: Record<string, { label: string; desc: string; defaultPerRow: 1 | 2 }> = {
  '50x25': { label: '50 × 25 mm', desc: 'Standard 2"x1" Dual Roll (Double Line)', defaultPerRow: 2 },
  '38x25': { label: '38 × 25 mm', desc: '1.5"x1" Compact Dual Roll', defaultPerRow: 2 },
  '40x25': { label: '40 × 25 mm', desc: '40x25 mm Retail Roll', defaultPerRow: 2 },
  '50x30': { label: '50 × 30 mm', desc: '2"x1.2" Roll', defaultPerRow: 2 },
  '50x38': { label: '50 × 38 mm', desc: '2"x1.5" Large MRP/Exp', defaultPerRow: 2 },
  '50x50': { label: '50 × 50 mm', desc: '2"x2" Food & Nutrition', defaultPerRow: 1 },
  '50x75': { label: '50 × 75 mm', desc: '2"x3" Food Master', defaultPerRow: 1 },
  '60x100': { label: '60 × 100 mm', desc: '2.4"x4" Tall Master (1-Up Vertical)', defaultPerRow: 1 },
  '100x60': { label: '100 × 60 mm', desc: '4"x2.4" Horizontal Master', defaultPerRow: 1 },
  '100x50': { label: '100 × 50 mm', desc: '4"x2" Box / Pack', defaultPerRow: 1 },
  '100x75': { label: '100 × 75 mm', desc: '4"x3" Kokanastha Nutri', defaultPerRow: 1 },
  '100x100': { label: '100 × 100 mm', desc: '4"x4" Big Box', defaultPerRow: 1 },
  'standard': { label: 'Standard', desc: '50 × 25 mm Card', defaultPerRow: 2 }
};

export const getPrintPageDimensions = (
  size: '50x25' | '50x38' | '38x25' | '40x25' | '50x30' | '50x50' | '50x75' | '60x100' | '100x60' | '100x50' | '100x75' | '100x100' | 'standard',
  perRow: 1 | 2,
  orientation: 'auto' | 'landscape' | 'portrait' | 'rotated90' | 'thermal-portrait-fix' | 'thermal-270-fix',
  printerType: 'thermal' | 'a4' = 'thermal'
) => {
  if (printerType === 'a4') {
    return {
      pageWidthMm: '210mm',
      pageHeightMm: '297mm',
      pageWidthNum: 210,
      pageHeightNum: 297,
      cssPageSize: '210mm 297mm',
      isRotated: false,
      rotationDeg: 0,
      baseDims: getThermalDimensions('50x25', 1),
      labelDescription: 'A4 Sheet (210 × 297 mm)'
    };
  }

  const baseDims = getThermalDimensions(size, perRow);
  const wNum = parseFloat(baseDims.rollWidthMm);
  const hNum = parseFloat(baseDims.rowHeightMm);
  const isNaturallyPortrait = hNum > wNum;
  const isNaturallyLandscape = wNum > hNum;

  let pageWidthNum = wNum;
  let pageHeightNum = hNum;
  let rotationDeg = 0;
  let cssPageSize = `${wNum}mm ${hNum}mm`;

  if (orientation === 'thermal-portrait-fix' || orientation === 'rotated90') {
    // FIX FOR THERMAL PRINTERS:
    // Some printers require a Portrait feed to avoid auto-rotation issues.
    pageWidthNum = Math.min(wNum, hNum);
    pageHeightNum = Math.max(wNum, hNum);
    rotationDeg = 90;
    cssPageSize = `${pageWidthNum}mm ${pageHeightNum}mm portrait`;
  } else if (orientation === 'thermal-270-fix') {
    pageWidthNum = Math.min(wNum, hNum);
    pageHeightNum = Math.max(wNum, hNum);
    rotationDeg = 270;
    cssPageSize = `${pageWidthNum}mm ${pageHeightNum}mm portrait`;
  } else if (orientation === 'landscape') {
    // Standard Horizontal printing (Wide): formats page horizontally across roll (104x25mm / 50x25mm)
    pageWidthNum = Math.max(wNum, hNum);
    pageHeightNum = Math.min(wNum, hNum);
    rotationDeg = 0;
    cssPageSize = `${pageWidthNum}mm ${pageHeightNum}mm landscape`;
  } else if (orientation === 'portrait') {
    // Vertical printing (Tall roll feed or tall stickers)
    pageWidthNum = Math.min(wNum, hNum);
    pageHeightNum = Math.max(wNum, hNum);
    rotationDeg = 0;
    cssPageSize = `${pageWidthNum}mm ${pageHeightNum}mm`;
  } else {
    // 'auto'
    pageWidthNum = wNum;
    pageHeightNum = hNum;
    rotationDeg = 0;
    cssPageSize = `${wNum}mm ${hNum}mm`;
  }

  const isRotated = rotationDeg !== 0;

  return {
    pageWidthMm: `${pageWidthNum}mm`,
    pageHeightMm: `${pageHeightNum}mm`,
    pageWidthNum,
    pageHeightNum,
    cssPageSize,
    isRotated,
    rotationDeg,
    baseDims,
    labelDescription: `${pageWidthNum} × ${pageHeightNum} mm (${perRow}-Up Roll - ${isRotated ? `${rotationDeg}° Rotation Fix` : 'Standard Wide'})`
  };
};

export interface ThermalBarcodeStickerProps {
  product: Product;
  size: '50x25' | '50x38' | '38x25' | '40x25' | '50x30' | '50x50' | '50x75' | '60x100' | '100x60' | '100x50' | '100x75' | '100x100' | 'standard';
  companyName?: string;
  showCompanyName?: boolean;
  mrp: number | string;
  salePrice: number | string;
  packedOn: string;
  expiryOn?: string;
  fssaiNumber?: string;
  address?: string;
  phone?: string;
  otherInfo?: string;
  ingredients?: string;
  orientation?: 'auto' | 'landscape' | 'portrait' | 'rotated90' | 'thermal-portrait-fix' | 'thermal-270-fix';
  mode?: 'preview' | 'print';
  boxBorder?: boolean;
  barcodeFrame?: boolean;
  barcodeOffsetMm?: number;
}

export const ThermalBarcodeSticker: React.FC<ThermalBarcodeStickerProps> = ({
  product,
  size,
  companyName = '',
  showCompanyName = false,
  mrp,
  salePrice,
  packedOn,
  expiryOn,
  fssaiNumber,
  address,
  phone,
  otherInfo,
  ingredients,
  orientation = 'auto',
  mode = 'preview',
  boxBorder = true,
  barcodeFrame = true,
  barcodeOffsetMm = 0
}) => {
  const barcodeValue = product.barcode || product.sku || '12345678';
  const effectiveCompany = showCompanyName && companyName && companyName.trim().length > 0 
    ? companyName.trim() 
    : '';
  const effectiveMrp = (mrp !== undefined && mrp !== null) 
    ? (mrp === '' ? '' : mrp) 
    : (product.mrp !== undefined && product.mrp !== null ? product.mrp : (product.selling_price || 0));
  const effectiveSale = (salePrice !== undefined && salePrice !== null) 
    ? (salePrice === '' ? '' : salePrice) 
    : (product.selling_price || 0);
  const isVeg = product.food_packaging?.dietary_type ? product.food_packaging.dietary_type === 'veg' : product.food_packaging?.is_vegetarian !== false;
  const netWeight = product.food_packaging?.net_weight || product.unit || (size === '100x100' ? '1000g' : size === '100x75' ? '500g' : size === '60x100' ? '500g' : size === '50x75' ? '250g' : '100g');
  
  // Business fallback from dbStore if not passed in props
  const biz = product?.business_id ? dbStore.getBusiness(product.business_id) : undefined;
  const bizPhone = (biz?.barcode_phone || (biz as any)?.mobile_number || biz?.phone || '').trim();
  const bizAddress = (biz?.barcode_address || biz?.mfg_address || biz?.billing_address || biz?.shipping_address || '').trim();

  const effectiveFssai = fssaiNumber || product.food_packaging?.fssai_license || (product.food_packaging as any)?.fssai_license_number || biz?.fssai_number || (biz as any)?.barcode_fssai || '11521018000123';
  const effectivePhone = phone || (product.food_packaging as any)?.customer_care_phone || (product as any)?.phone || bizPhone || '';
  const effectiveAddress = address || product.food_packaging?.mfg_by || bizAddress || 'Shop 14, Station Road, Borivali West, Mumbai, MH 400092';
  const effectiveOtherInfo = otherInfo || (product.food_packaging as any)?.other_info || (biz as any)?.barcode_other_info || '';
  const effectiveIngredients = ingredients || product.food_packaging?.ingredients || 'Roasted Rice Flour, Bengal Gram, Spices, Edible Oil, Salt';

  // Base preview pixel dimensions (width x height)
  const previewSizeDims: Record<string, { w: number; h: number }> = {
    '50x25': { w: 189, h: 95 },
    '40x25': { w: 189, h: 95 },
    '38x25': { w: 144, h: 95 },
    '50x30': { w: 189, h: 113 },
    '50x38': { w: 189, h: 143 },
    '50x50': { w: 200, h: 200 },
    '50x75': { w: 200, h: 280 },
    '60x100': { w: 240, h: 400 },
    '100x60': { w: 360, h: 216 },
    '100x50': { w: 360, h: 180 },
    '100x75': { w: 360, h: 270 },
    '100x100': { w: 340, h: 340 },
    'standard': { w: 220, h: 220 }
  };

  const previewSizeClasses: Record<string, string> = {
    '50x25': 'w-[189px] h-[95px] p-1',
    '40x25': 'w-[189px] h-[95px] p-1.5',
    '38x25': 'w-[144px] h-[95px] p-1',
    '50x30': 'w-[189px] h-[113px] p-1.5',
    '50x38': 'w-[189px] h-[143px] p-2',
    '50x50': 'w-[200px] h-[200px] p-2',
    '50x75': 'w-[200px] h-[280px] p-2',
    '60x100': 'w-[240px] h-[400px] p-2',
    '100x60': 'w-[360px] h-[216px] p-2.5',
    '100x50': 'w-[360px] h-[180px] p-2.5',
    '100x75': 'w-[360px] h-[270px] p-2.5',
    '100x100': 'w-[340px] h-[340px] p-3',
    'standard': 'w-[220px] p-3'
  };

  const isTallStacked = ['50x75', '100x75', '100x100', '50x50'].includes(size);
  const flexJustify = isTallStacked ? 'justify-start' : 'justify-between';

  const containerClasses = mode === 'preview'
    ? `${previewSizeClasses[size] || 'w-[189px] h-[95px] p-1.5'} bg-white rounded-md ${boxBorder ? 'border-[1.5px] border-black' : 'border-2 border-indigo-400 dark:border-indigo-500'} shadow-md flex flex-col ${flexJustify} items-center text-center overflow-hidden font-sans select-none relative shrink-0 text-black`
    : `w-full h-full p-[0.8mm] bg-white flex flex-col ${flexJustify} items-center text-center overflow-hidden font-sans text-black box-border ${boxBorder ? 'border-[1px] border-black rounded-[2px]' : ''}`;

  const valLen = String(barcodeValue).length;
  // Calibrated bar module width to ensure barcode never exceeds box or bleeds
  const getBarWidth = (targetSize: string) => {
    if (targetSize === '38x25') return valLen > 12 ? 0.85 : valLen > 8 ? 0.92 : 1.0;
    if (targetSize === '50x25' || targetSize === '60x100') {
      return valLen > 14 ? 1.05 : valLen > 11 ? 1.15 : 1.25;
    }
    if (targetSize === '40x25') return valLen > 13 ? 0.88 : valLen > 10 ? 0.95 : 1.05;
    if (targetSize === '50x30' || targetSize === '50x38') return valLen > 13 ? 0.95 : valLen > 10 ? 1.05 : 1.15;
    if (targetSize === '50x50' || targetSize === '50x75') return valLen > 13 ? 0.92 : 1.0;
    if (targetSize === '60x100') return valLen > 14 ? 1.05 : valLen > 11 ? 1.15 : 1.25;
    if (targetSize === '100x60' || targetSize === '100x50' || targetSize === '100x75' || targetSize === '100x100') return valLen > 13 ? 1.4 : 1.6;
    return valLen > 12 ? 0.95 : 1.1;
  };
  const barWidth = getBarWidth(size);

  // Dedicated Boxed Barcode with guaranteed white quiet zone margin and safe digit clearance
  const renderBarcodeBox = (h: number, customW?: number) => (
    <div 
      className="w-full flex items-center justify-center shrink-0" 
      style={{ 
        margin: size === '50x25' ? '0' : '1px 0', 
        textAlign: 'center',
        ...(barcodeOffsetMm && barcodeOffsetMm !== 0 ? { transform: `translateX(${barcodeOffsetMm}mm)` } : {})
      }}
    >
      <div 
        className="barcode-inner-box bg-white flex flex-col items-center justify-center w-full max-w-full"
        style={{ backgroundColor: '#ffffff', boxSizing: 'border-box', margin: '0 auto', textAlign: 'center', overflow: 'visible' }}
      >
        <ReactBarcode 
          renderer="svg"
          value={String(barcodeValue || '12345678').trim()} 
          height={h} 
          width={customW || barWidth}
          fontSize={size === '60x100' || size === '50x25' ? 8.5 : size === '38x25' ? 7 : size === '40x25' ? 7.5 : 8}
          margin={0}
          marginLeft={size === '50x25' ? 6 : 8}
          marginRight={size === '50x25' ? 6 : 8}
          marginTop={0}
          marginBottom={2}
          textMargin={2}
          fontOptions="bold"
          font="monospace"
          displayValue={true}
          background="#ffffff"
          lineColor="#000000"
        />
      </div>
    </div>
  );

  const renderStickerContent = () => {
    // 1. 38x25 mm Compact (1.5"x1")
    if (size === '38x25') {
      return (
        <div className={containerClasses}>
          <div className="w-full text-black shrink-0">
            {effectiveCompany && <div className="text-[7px] font-black uppercase leading-none truncate mb-0.5">{effectiveCompany}</div>}
            <div className="text-[7.5px] font-black uppercase tracking-tight leading-none truncate w-full border-b border-black pb-0.5">
              {product.name}
            </div>
          </div>
          {renderBarcodeBox(effectiveCompany ? 13 : 15)}
          <div className="w-full space-y-0.5 text-[6.5px] font-black border-t border-black pt-0.5 uppercase text-black shrink-0">
            <div className="flex justify-between items-center px-0.5">
              <span>MRP: ₹{effectiveMrp}</span>
              <span className="font-black text-black">SALE: ₹{effectiveSale}</span>
            </div>
            <div className="flex justify-between text-[6px] font-bold text-black px-0.5">
              <span>PKD: {packedOn}</span>
              {expiryOn && <span>EXP: {expiryOn}</span>}
            </div>
          </div>
        </div>
      );
    }

    // 2. 50x30 mm (2"x1.2")
    if (size === '50x30') {
      return (
        <div className={containerClasses}>
          <div className="w-full text-black shrink-0">
            {effectiveCompany && <div className="text-[8px] font-black uppercase leading-none truncate mb-0.5">{effectiveCompany}</div>}
            <div className="text-[8.5px] font-black uppercase tracking-tight leading-none truncate w-full px-0.5 border-b border-black pb-0.5">
              {product.name}
            </div>
          </div>
          {renderBarcodeBox(effectiveCompany ? 18 : 20)}
          <div className="w-full space-y-0.5 text-[7.5px] font-black uppercase border-t border-black pt-0.5 text-black shrink-0">
            <div className="flex justify-between px-1">
              <span>MRP: ₹{effectiveMrp}</span>
              <span className="font-black text-black">SALE: ₹{effectiveSale}</span>
            </div>
            <div className="flex justify-between text-[6.5px] font-bold text-black px-1">
              <span>PKD: {packedOn}</span>
              {expiryOn && <span>EXP: {expiryOn}</span>}
            </div>
          </div>
        </div>
      );
    }

    // 3. 50x38 mm MRP/Exp Box (2"x1.5")
    if (size === '50x38') {
      return (
        <div className={containerClasses}>
          <div className="w-full border-b border-black pb-0.5 text-black shrink-0">
            {effectiveCompany && <div className="text-[8px] font-black uppercase leading-none truncate mb-0.5">{effectiveCompany}</div>}
            <span className="text-[9px] font-black uppercase tracking-tight leading-tight truncate w-full block">
              {product.name}
            </span>
          </div>
          {renderBarcodeBox(22)}
          <div className="w-full space-y-0.5 text-[8px] font-black uppercase border-t border-black pt-0.5 text-black shrink-0">
            <div className="flex justify-between px-0.5">
              <span>MRP: ₹{effectiveMrp}</span>
              <span className="font-black text-black">SALE: ₹{effectiveSale}</span>
            </div>
            <div className="flex justify-between text-[7px] font-bold text-black px-0.5">
              <span>PKD: {packedOn}</span>
              {expiryOn && <span>EXP: {expiryOn}</span>}
            </div>
          </div>
        </div>
      );
    }

    // 4. 50x50 mm Food & Nutrition Sticker (2"x2")
    if (size === '50x50') {
      return (
        <div className={containerClasses}>
          <div className="w-full flex justify-between items-center border-b border-black pb-0.5 text-black shrink-0">
            <span className="text-[8px] font-black uppercase truncate max-w-[120px] text-left">{effectiveCompany}</span>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs border border-black flex items-center justify-center shrink-0">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isVeg ? 'bg-black' : 'bg-transparent border border-black'}`} />
              </span>
              <span className="text-[7px] font-black text-black">{netWeight}</span>
            </div>
          </div>
          
          <span className="text-[9px] font-black uppercase tracking-tight leading-tight truncate w-full my-0.5 text-black shrink-0">
            {product.name}
          </span>

          {renderBarcodeBox(16)}

          {/* Compact Nutrition Table */}
          <div className="w-full border border-black text-[6.5px] text-left leading-tight my-0.5 rounded-xs overflow-hidden text-black shrink-0">
            <div className="bg-black text-white px-1 py-0.5 font-black text-[6.5px] flex justify-between">
              <span>NUTRITION (per {product.nutrition_facts?.serving_size || '100g'})</span>
              <span>{product.nutrition_facts?.energy_kcal ?? '350'} kcal</span>
            </div>
            <div className="grid grid-cols-2 px-1 py-0.5 gap-x-1 text-[6px] bg-white text-black font-bold">
              <div>Protein: <b>{product.nutrition_facts?.protein_g ?? '8.5'}g</b></div>
              <div>Carbs: <b>{product.nutrition_facts?.carbohydrates_g ?? '60'}g</b></div>
              <div>Total Fat: <b>{product.nutrition_facts?.fat_total_g ?? '12'}g</b></div>
              <div>Sodium: <b>{product.nutrition_facts?.sodium_mg ?? '220'}mg</b></div>
            </div>
          </div>

          <div className="w-full text-[7px] font-black uppercase border-t border-black pt-0.5 text-black shrink-0">
            <div className="flex justify-between">
              <span>MRP: ₹{effectiveMrp}</span>
              <span className="font-black text-black">SALE: ₹{effectiveSale}</span>
            </div>
            <div className="flex justify-between text-[6px] font-bold text-black">
              <span>PKD: {packedOn}</span>
              <span>{expiryOn ? `EXP: ${expiryOn}` : (product.food_packaging?.best_before_days ? `Best: ${product.food_packaging.best_before_days}d` : 'Best: 60d')}</span>
            </div>
          </div>
        </div>
      );
    }

    // 5. 50x75 mm Food Master Sticker (2"x3")
    if (size === '50x75') {
      return (
        <div className={containerClasses}>
          <div className="w-full flex justify-between items-center border-b border-black pb-0.5 text-black shrink-0">
            <span className="text-[8.5px] font-black uppercase truncate max-w-[120px] text-left">{effectiveCompany}</span>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs border border-black flex items-center justify-center shrink-0">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isVeg ? 'bg-black' : 'bg-transparent border border-black'}`} />
              </span>
              <span className="text-[7.5px] font-black text-black">{netWeight}</span>
            </div>
          </div>
          
          <span className="text-[10px] font-black uppercase tracking-tight leading-tight truncate w-full my-0.5 text-black shrink-0">
            {product.name}
          </span>

          {renderBarcodeBox(18)}

          {/* Detailed Nutrition Table */}
          <div className="w-full border border-black text-[6.5px] text-left leading-tight my-0.5 rounded-xs overflow-hidden text-black shrink-0">
            <div className="bg-black text-white px-1 py-0.5 font-black text-[7px] flex justify-between">
              <span>NUTRITIONAL FACTS</span>
              <span>Per {product.nutrition_facts?.serving_size || '100g'}</span>
            </div>
            <div className="divide-y divide-black bg-white text-black">
              <div className="flex justify-between px-1 py-0.2"><span>Energy / Calories</span><b>{product.nutrition_facts?.energy_kcal ?? '420'} kcal</b></div>
              <div className="flex justify-between px-1 py-0.2"><span>Protein</span><b>{product.nutrition_facts?.protein_g ?? '9.2'} g</b></div>
              <div className="flex justify-between px-1 py-0.2"><span>Total Carbohydrates</span><b>{product.nutrition_facts?.carbohydrates_g ?? '58'} g</b></div>
              <div className="flex justify-between px-1 py-0.2 text-[6px] pl-2 text-black"><span>- Added Sugars</span><b>{product.nutrition_facts?.added_sugars_g ?? '0'} g</b></div>
              <div className="flex justify-between px-1 py-0.2"><span>Total Fat</span><b>{product.nutrition_facts?.fat_total_g ?? '18'} g</b></div>
              <div className="flex justify-between px-1 py-0.2"><span>Dietary Fiber</span><b>{product.nutrition_facts?.dietary_fiber_g ?? '3.5'} g</b></div>
              <div className="flex justify-between px-1 py-0.2"><span>Sodium</span><b>{product.nutrition_facts?.sodium_mg ?? '380'} mg</b></div>
            </div>
          </div>

          {product.food_packaging?.ingredients && (
            <div className="w-full text-left text-[6px] text-black line-clamp-1 border-t border-black pt-0.5 shrink-0">
              <b>Ing:</b> {ingredients}
            </div>
          )}

          <div className="w-full text-[7.5px] font-black uppercase border-t border-black pt-0.5 text-black shrink-0">
            <div className="flex justify-between">
              <span>MRP: ₹{effectiveMrp}</span>
              <span className="font-black text-black">SALE: ₹{effectiveSale}</span>
            </div>
            <div className="flex justify-between text-[6.5px] font-bold text-black">
              <span>PKD: {packedOn}</span>
              <span>{expiryOn ? `EXP: ${expiryOn}` : 'Best before 60 days'}</span>
            </div>
            {product.food_packaging?.fssai_license_number && (
              <div className="text-[6px] text-black tracking-wider text-left font-mono">
                FSSAI Lic: {product.food_packaging.fssai_license_number}
              </div>
            )}
          </div>
        </div>
      );
    }

    // 6. 60x100 mm Tall Master Sticker (2.4"x4")
    if (size === '60x100') {
      return (
        <div 
          className={`${containerClasses} sticker-60x100`}
          data-size="60x100" 
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            color: '#000000',
            ...(mode === 'print' 
              ? { 
                  padding: '1.2mm 1.2mm', 
                  width: '100%', 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between', 
                  boxSizing: 'border-box',
                  overflow: 'hidden'
                } 
              : { 
                  justifyContent: 'space-between', 
                  padding: '6px 7px', 
                  height: '100%', 
                  minHeight: '395px' 
                }
            )
          }}
        >
          {/* 1. Header (Brand Name, SKU, Dietary Symbol & Net Weight) */}
          <div className="w-full flex flex-col items-center border-b-[1.5px] border-black pb-1 shrink-0 text-black">
            {effectiveCompany ? (
              <span className="text-[11px] font-black uppercase text-center block w-full leading-tight mb-0.5 tracking-wider truncate text-black">
                {effectiveCompany}
              </span>
            ) : null}
            <div className="flex items-center justify-between w-full px-0.5 text-[8.5px] font-bold text-black leading-none">
              <span className="shrink-0 font-mono font-bold text-black">SKU: {product.sku || 'SKU-001'}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <span 
                  className="w-3.5 h-3.5 rounded-xs border border-black flex items-center justify-center shrink-0 bg-white"
                  style={{
                    width: '13px',
                    height: '13px',
                    minWidth: '13px',
                    minHeight: '13px',
                    border: '1.2px solid #000000',
                    borderRadius: '2px',
                    backgroundColor: '#ffffff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxSizing: 'border-box',
                    flexShrink: 0
                  }}
                >
                  <svg width="8" height="8" viewBox="0 0 8 8" className="shrink-0" style={{ display: 'block', margin: '0 auto', flexShrink: 0 }}>
                    <circle cx="4" cy="4" r={isVeg ? "3.2" : "0"} fill="#000000" stroke="#000000" strokeWidth="0.8" />
                    {!isVeg && <circle cx="4" cy="4" r="3.2" fill="none" stroke="#000000" strokeWidth="0.8" />}
                  </svg>
                </span>
                <span 
                  className="text-[8px] font-black bg-black text-white px-1.5 py-0.5 rounded-xs border border-black uppercase tracking-tight flex items-center"
                  style={{ backgroundColor: '#000000', color: '#ffffff', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                >
                  {netWeight || 'Pkt'}
                </span>
              </div>
            </div>
          </div>
          
          {/* 2. Product Name & Title */}
          <div className="w-full text-center shrink-0 text-black border-b-[1.5px] border-black py-1 bg-white">
            <span className="text-[12px] font-black uppercase tracking-tight leading-tight text-center block w-full px-0.5 line-clamp-2 text-black">
              {product.name}
            </span>
          </div>

          {/* 3. Barcode Box - Scannable & Bold Monospace Digits */}
          <div className="w-full flex justify-center shrink-0 border-b-[1.5px] border-black pb-1">
            {renderBarcodeBox(20)}
          </div>

          {/* 4. Commercial Pricing & Dates (MRP clean without strikethrough/erasing, PKD & EXP under MRP) */}
          <div className="w-full border-[1.5px] border-black rounded-xs overflow-hidden shrink-0 text-black bg-white">
            <div className="flex justify-between items-center w-full px-2 py-0.8 bg-white border-b border-black leading-tight">
              <span className="text-[10px] font-bold text-black">
                {effectiveMrp !== '' ? (
                  <>MRP (Incl. taxes): <span className="font-black text-[11.5px] text-black">₹{effectiveMrp}</span></>
                ) : (
                  <span className="font-bold text-[10px] text-slate-500 uppercase">MRP: N/A</span>
                )}
              </span>
              <span className="text-[12.5px] font-black text-black tracking-tight">
                {effectiveSale !== '' ? `SALE: ₹${effectiveSale}` : ''}
              </span>
            </div>
            <div className="flex justify-between items-center w-full px-2 py-0.5 text-[8px] font-bold text-black bg-white leading-tight">
              <span>PKD: {packedOn}</span>
              <span>{expiryOn ? `EXP: ${expiryOn}` : 'BEST BEFORE 12M'}</span>
            </div>
          </div>

          {/* 5. NUTRITIONAL INFORMATION TABLE - Single Line Header */}
          <div className="w-full border-[1.5px] border-black rounded-xs overflow-hidden shrink-0 text-black bg-white">
            <div 
              className="bg-black text-white px-2 py-0.5 text-[7.5px] font-black flex justify-between items-center tracking-tight border-b border-black whitespace-nowrap overflow-hidden"
              style={{ backgroundColor: '#000000', color: '#ffffff', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
            >
              <span className="font-black text-white uppercase tracking-tight text-[7.5px] whitespace-nowrap" style={{ color: '#ffffff' }}>NUTRITIONAL INFORMATION</span>
              <span className="font-bold text-[7px] text-white opacity-95 shrink-0 ml-1 whitespace-nowrap" style={{ color: '#ffffff' }}>Per {product.nutrition_facts?.serving_size || '100g'} Approx.</span>
            </div>
            <div className="bg-white text-black text-[8px]">
              <div className="flex justify-between items-center px-2 py-[2px] border-b border-black leading-tight">
                <span className="text-black">Energy / Calories</span>
                <span className="font-black font-mono text-black">{product.nutrition_facts?.energy_kcal ?? '420'} kcal</span>
              </div>
              <div className="flex justify-between items-center px-2 py-[2px] border-b border-black leading-tight">
                <span className="text-black">Protein</span>
                <span className="font-black font-mono text-black">{product.nutrition_facts?.protein_g ?? '9.2'} g</span>
              </div>
              <div className="flex justify-between items-center px-2 py-[2px] border-b border-black leading-tight">
                <span className="text-black">Carbohydrates</span>
                <span className="font-black font-mono text-black">{product.nutrition_facts?.carbohydrates_g ?? '58.0'} g</span>
              </div>
              <div className="flex justify-between items-center px-2 py-[2px] border-b border-black leading-tight">
                <span className="text-black">Total Fat</span>
                <span className="font-black font-mono text-black">{product.nutrition_facts?.fat_total_g ?? '18.0'} g</span>
              </div>
              <div className="flex justify-between items-center px-2 py-[2px] border-b border-black leading-tight">
                <span className="text-black">Dietary Fibre</span>
                <span className="font-black font-mono text-black">{product.nutrition_facts?.dietary_fiber_g ?? '4.5'} g</span>
              </div>
              <div className="flex justify-between items-center px-2 py-[2px] leading-tight">
                <span className="text-black">Sodium</span>
                <span className="font-black font-mono text-black">{product.nutrition_facts?.sodium_mg ?? '380'} mg</span>
              </div>
            </div>
          </div>

          {/* 6. FSSAI & 100% VEG BADGE */}
          <div className="w-full text-left bg-white rounded-xs border-[1.5px] border-black overflow-hidden shrink-0 text-black text-[8px]">
            <div className="flex justify-between items-center px-2 py-1 bg-white">
              <div className="flex items-center gap-1.5 min-w-0 pr-1">
                <span className="font-black text-[8px] shrink-0 text-black">FSSAI Lic No:</span>
                <span className="font-mono font-bold text-[8.5px] text-black tracking-tight">{effectiveFssai}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-1">
                <span 
                  className="w-3.5 h-3.5 rounded-xs border border-black flex items-center justify-center shrink-0 bg-white"
                  style={{
                    width: '13px',
                    height: '13px',
                    minWidth: '13px',
                    minHeight: '13px',
                    border: '1.2px solid #000000',
                    borderRadius: '2px',
                    backgroundColor: '#ffffff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxSizing: 'border-box',
                    flexShrink: 0
                  }}
                >
                  <svg width="8" height="8" viewBox="0 0 8 8" className="shrink-0" style={{ display: 'block', margin: '0 auto', flexShrink: 0 }}>
                    <circle cx="4" cy="4" r={isVeg ? "3.2" : "0"} fill="#000000" stroke="#000000" strokeWidth="0.8" />
                    {!isVeg && <circle cx="4" cy="4" r="3.2" fill="none" stroke="#000000" strokeWidth="0.8" />}
                  </svg>
                </span>
                <span className="text-[7.5px] font-black text-black uppercase tracking-tight">
                  {isVeg ? '100% VEG' : 'NON-VEG'}
                </span>
              </div>
            </div>
          </div>

          {/* 7. MANUFACTURER, PACKER & CUSTOMER CARE */}
          <div className="w-full text-left bg-white rounded-xs border-[1.5px] border-black overflow-hidden shrink-0 text-black text-[8px]">
            {/* Address & Facility (Mob number removed per user request) */}
            {effectiveAddress ? (
              <div className="px-2 py-0.5 border-b border-black leading-tight bg-white text-black">
                <span className="font-black text-[8px] uppercase text-black block mb-0.5">Mfg & Packed By:</span>
                <div className="font-medium text-[7.5px] leading-tight break-words text-black">
                  {effectiveAddress}
                </div>
              </div>
            ) : null}

            {/* Helpline / Customer Care Row */}
            {effectivePhone ? (
              <div className="flex items-center justify-between px-2 py-0.5 border-b border-black leading-tight bg-white text-black">
                <span className="font-black text-[8px] text-black uppercase">Customer Care / Helpline:</span>
                <span className="font-mono font-bold text-[8.5px] text-black">{effectivePhone}</span>
              </div>
            ) : null}

            {/* Ingredients & Allergen Declaration */}
            {effectiveIngredients ? (
              <div className={`px-2 py-0.5 leading-tight text-[7.5px] bg-white text-black ${effectiveOtherInfo ? 'border-b border-black' : ''}`}>
                <div>
                  <span className="font-black text-black">Ingredients: </span>
                  <span className="font-medium break-words text-black">{effectiveIngredients}</span>
                </div>
                <div className="mt-0.5 text-[7px] text-black font-medium">
                  <span className="font-bold">Allergen Advice: </span>
                  <span>Handled in a facility that also packs cereals, nuts & milk solids.</span>
                </div>
              </div>
            ) : null}

            {/* Other Info */}
            {effectiveOtherInfo ? (
              <div className="px-2 py-0.5 text-[7.5px] text-black leading-tight bg-white">
                <span className="font-black text-black">Other Info: </span>
                <span className="break-words text-black">{effectiveOtherInfo}</span>
              </div>
            ) : null}
          </div>

          {/* 8. COMPLIANCE & QUALITY FOOTER BAR */}
          <div 
            className="w-full bg-black text-white px-2 py-1 rounded-xs flex items-center justify-between text-[7.5px] font-bold shrink-0"
            style={{ backgroundColor: '#000000', color: '#ffffff', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
          >
            <span className="uppercase tracking-wider">Country of Origin: India</span>
            <span className="uppercase tracking-tight">100% Quality Assured</span>
          </div>
        </div>
      );
    }

    // 6.5. 100x60 mm Horizontal Master Sticker (4"x2.4")
    if (size === '100x60') {
      return (
        <div className={containerClasses}>
          <div className="w-full flex justify-between items-center border-b border-black pb-1 shrink-0 text-black">
            <div className="text-left">
              <div className="text-[12px] font-black uppercase tracking-wider">{effectiveCompany}</div>
              <div className="text-[8px] text-black font-mono font-bold">SKU: {product.sku || 'SKU-001'}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-xs border border-black flex items-center justify-center shrink-0">
                <span className={`w-2 h-2 rounded-full shrink-0 ${isVeg ? 'bg-black' : 'bg-transparent border border-black'}`} />
              </span>
              <span className="text-[9.5px] font-black bg-white px-2 py-0.5 rounded border border-black">
                {netWeight}
              </span>
            </div>
          </div>

          <div className="w-full grid grid-cols-12 gap-3 my-1 items-start text-black">
            {/* Left: Product & Barcode */}
            <div className="col-span-7 flex flex-col items-start text-left">
              <span className="text-[13px] font-black uppercase tracking-tight leading-tight w-full truncate mb-1 text-black">
                {product.name}
              </span>
              {renderBarcodeBox(28)}
              <div className="w-full bg-white border border-black rounded p-1.5 space-y-1 text-left mt-1 text-black text-[7.5px] font-normal leading-tight">
                <div className="border-b border-black pb-0.8 flex justify-between items-center text-[8px] font-bold text-black">
                  <span>FSSAI Lic: <span className="font-mono font-black">{effectiveFssai}</span></span>
                  {effectivePhone ? <span>Care: <span className="font-mono font-black">{effectivePhone}</span></span> : null}
                </div>
                {effectiveAddress ? (
                  <div className={`leading-tight break-words text-black ${effectiveOtherInfo ? 'border-b border-black pb-0.8' : ''}`}>
                    <span className="font-bold">Mfg By: </span><span>{effectiveAddress}</span>
                  </div>
                ) : null}
                {effectiveOtherInfo ? (
                  <div className="leading-tight break-words pt-0.5 text-black">
                    <span className="font-bold">Info: </span><span>{effectiveOtherInfo}</span>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Right: Nutrition & Pricing */}
            <div className="col-span-5 flex flex-col gap-1 text-black">
              <div className="border border-black rounded overflow-hidden text-[7.5px] text-left text-black font-normal">
                <div className="bg-black text-white px-1.5 py-0.5 font-black text-[7.5px] flex justify-between">
                  <span>NUTRITION</span>
                  <span>(100g)</span>
                </div>
                <div className="bg-white text-black px-1.5 py-0.5 font-normal">
                  <div className="flex justify-between border-b border-black py-0.5"><span>Energy</span><span className="font-bold font-mono">{product.nutrition_facts?.energy_kcal ?? '420'} kcal</span></div>
                  <div className="flex justify-between border-b border-black py-0.5"><span>Protein</span><span className="font-bold font-mono">{product.nutrition_facts?.protein_g ?? '9.2'}g</span></div>
                  <div className="flex justify-between border-b border-black py-0.5"><span>Carbs</span><span className="font-bold font-mono">{product.nutrition_facts?.carbohydrates_g ?? '58'}g</span></div>
                  <div className="flex justify-between py-0.5"><span>Fat</span><span className="font-bold font-mono">{product.nutrition_facts?.fat_total_g ?? '18'}g</span></div>
                </div>
              </div>
              <div className="bg-white border border-black rounded p-1 text-black font-normal">
                <div className="flex justify-between items-center text-[9px] font-bold text-black">
                  <span>MRP:</span>
                  <span className="line-through font-bold">₹{effectiveMrp}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] font-black text-black">
                  <span>SALE:</span>
                  <span className="font-black text-black">₹{effectiveSale}</span>
                </div>
                <div className="text-[7.5px] font-bold mt-0.5 border-t border-black pt-0.5 flex justify-between text-black">
                  <span>PKD: {packedOn}</span>
                  <span>EXP: {expiryOn || '90D'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full text-[7.5px] text-black text-left border-t border-black pt-1 flex justify-between items-center shrink-0 font-bold">
            <span className="font-black text-black">Professional Grade Quality</span>
            <span>Batch No: {product.sku || 'B2023'}</span>
          </div>
        </div>
      );
    }

    // 7. 100x75 mm Food Master Sticker (4"x3")
    if (size === '100x75') {
      return (
        <div className={containerClasses}>
          <div className="w-full flex justify-between items-center border-b border-black pb-1 shrink-0 text-black">
            <div className="text-left">
              <div className="text-[11px] font-black uppercase tracking-wider">{effectiveCompany}</div>
              <div className="text-[7.5px] text-black font-mono font-bold">SKU: {product.sku || 'SKU-001'}</div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-xs border border-black flex items-center justify-center shrink-0">
                <span className={`w-2 h-2 rounded-full shrink-0 ${isVeg ? 'bg-black' : 'bg-transparent border border-black'}`} />
              </span>
              <span className="text-[9px] font-black bg-white px-1.5 py-0.5 rounded border border-black">
                {netWeight}
              </span>
            </div>
          </div>

          <div className="w-full grid grid-cols-2 gap-2 my-1 items-start text-black">
            {/* Left: Product & Barcode in the Box */}
            <div className="flex flex-col items-center justify-start text-left">
              <span className="text-[12px] font-black uppercase tracking-tight leading-tight w-full truncate mb-0.5 text-black">
                {product.name}
              </span>
              {renderBarcodeBox(20)}
              {/* UNDER BARCODE: FSSAI NUMBER, PHONE, ADDRESS, OTHER INFO, INGREDIENTS */}
              <div className="w-full bg-white border border-black rounded p-1 space-y-0.8 text-left my-1 text-black text-[7px] font-normal leading-tight">
                <div className="border-b border-black pb-0.8 flex justify-between items-center text-[7.5px] font-bold text-black">
                  <span>FSSAI Lic. No: <span className="font-mono font-black">{effectiveFssai}</span></span>
                  {effectivePhone ? <span>Care: <span className="font-mono font-black">{effectivePhone}</span></span> : null}
                </div>
                {effectiveAddress ? (
                  <div className={`break-words text-black ${effectiveIngredients || effectiveOtherInfo ? 'border-b border-black pb-0.8' : ''}`}>
                    <span className="font-bold">Mfg By: </span><span>{effectiveAddress}</span>
                  </div>
                ) : null}
                {effectiveIngredients ? (
                  <div className={`break-words text-black ${effectiveOtherInfo ? 'border-b border-black pb-0.8' : ''}`}>
                    <span className="font-bold">Ingredients: </span><span>{effectiveIngredients}</span>
                  </div>
                ) : null}
                {effectiveOtherInfo ? (
                  <div className="break-words pt-0.5 text-black">
                    <span className="font-bold">Other Info: </span><span>{effectiveOtherInfo}</span>
                  </div>
                ) : null}
              </div>
              <div className="text-[8.5px] font-black text-black w-full space-y-0.5 pt-0.5 border-t border-black">
                <div className="flex justify-between"><span>MRP: <b className="line-through font-bold">₹{effectiveMrp}</b></span> <span className="font-black text-black">SALE: <b className="font-black text-black text-[9.5px]">₹{effectiveSale}</b></span></div>
                <div className="flex justify-between text-[7.5px] text-black font-bold"><span>PKD: {packedOn}</span> <span>{expiryOn ? `EXP: ${expiryOn}` : 'Best: 90 Days'}</span></div>
              </div>
            </div>

            {/* Right: Nutrition Table */}
            <div className="border border-black rounded overflow-hidden text-[7px] text-left text-black">
              <div className="bg-black text-white px-1.5 py-0.5 font-black text-[8px] flex justify-between">
                <span>NUTRITIONAL INFORMATION</span>
                <span>(Per 100g)</span>
              </div>
              <div className="bg-white text-black px-1 py-0.5">
                <div className="flex justify-between border-b border-black py-0.5"><span>Energy / Calories</span><b className="font-mono">{product.nutrition_facts?.energy_kcal ?? '460'} kcal</b></div>
                <div className="flex justify-between border-b border-black py-0.5"><span>Protein</span><b className="font-mono">{product.nutrition_facts?.protein_g ?? '9.8'} g</b></div>
                <div className="flex justify-between border-b border-black py-0.5"><span>Carbohydrates</span><b className="font-mono">{product.nutrition_facts?.carbohydrates_g ?? '64'} g</b></div>
                <div className="flex justify-between border-b border-black py-0.5 text-[6.5px] pl-2 text-black"><span>- Added Sugars</span><b className="font-mono">{product.nutrition_facts?.added_sugars_g ?? '0'} g</b></div>
                <div className="flex justify-between border-b border-black py-0.5"><span>Total Fat</span><b className="font-mono">{product.nutrition_facts?.fat_total_g ?? '16'} g</b></div>
                <div className="flex justify-between border-b border-black py-0.5"><span>Dietary Fiber</span><b className="font-mono">{product.nutrition_facts?.dietary_fiber_g ?? '4.2'} g</b></div>
                <div className="flex justify-between py-0.5"><span>Sodium</span><b className="font-mono">{product.nutrition_facts?.sodium_mg ?? '310'} mg</b></div>
              </div>
              <div className="bg-white p-1 text-[7px] text-black border-t border-black font-bold">
                <div>Store in airtight container after opening.</div>
                <div>Customer Care: <b>{effectivePhone || 'ops@kokanasthafaral.com'}</b></div>
              </div>
            </div>
          </div>

          <div className="w-full text-[6.5px] text-black text-left border-t border-black pt-0.5 flex justify-between items-center shrink-0 font-bold">
            <span className="font-black text-black">Quality Certified</span>
            <span>Made in India</span>
          </div>
        </div>
      );
    }

    // 8. 100x100 mm Big Box Sticker (4"x4")
    if (size === '100x100') {
      return (
        <div className={containerClasses}>
          <div className="w-full flex justify-between items-center border-b border-black pb-1 shrink-0 text-black">
            <div className="text-left">
              <div className="text-[12px] font-black uppercase tracking-wider">{effectiveCompany}</div>
              <div className="text-[8px] text-black font-mono font-bold">SKU: {product.sku || 'SKU-001'}</div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-xs border border-black flex items-center justify-center shrink-0">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isVeg ? 'bg-black' : 'bg-transparent border border-black'}`} />
              </span>
              <span className="text-[10px] font-black bg-white px-2 py-0.5 rounded border border-black">
                {netWeight}
              </span>
            </div>
          </div>

          <span className="text-[14px] font-black uppercase tracking-tight leading-tight w-full my-0.5 truncate shrink-0 text-black">
            {product.name}
          </span>

          {renderBarcodeBox(24)}

          {/* UNDER BARCODE: FSSAI NUMBER, PHONE, ADDRESS, OTHER INFO, INGREDIENTS */}
          <div className="w-full bg-white border border-black rounded p-1.5 space-y-1 text-left my-1 text-black shrink-0 text-[8px] font-normal leading-snug">
            <div className="flex justify-between items-center border-b border-black pb-0.8 text-[8.5px] font-bold">
              <span>FSSAI Lic. No: <span className="font-mono font-black">{effectiveFssai}</span></span>
              <span className="text-[7.5px] bg-white text-black px-1.5 py-0.2 rounded border border-black font-bold">
                {isVeg ? '🌱 100% Vegetarian' : 'Non-Vegetarian'}
              </span>
            </div>
            {effectivePhone ? (
              <div className="flex items-start gap-1 border-b border-black pb-0.8">
                <span className="font-bold">Customer Care / Helpline: </span><span className="font-mono font-black">{effectivePhone}</span>
              </div>
            ) : null}
            {effectiveAddress ? (
              <div className={`flex items-start gap-1 ${effectiveIngredients || effectiveOtherInfo ? 'border-b border-black pb-0.8' : ''}`}>
                <span className="font-bold">Packer & Mfg Address: </span><span>{effectiveAddress}</span>
              </div>
            ) : null}
            {effectiveIngredients ? (
              <div className={`flex items-start gap-1 ${effectiveOtherInfo ? 'border-b border-black pb-0.8' : ''}`}>
                <span className="font-bold">Ingredients: </span><span>{effectiveIngredients}</span>
              </div>
            ) : null}
            {effectiveOtherInfo ? (
              <div className="flex items-start gap-1 pt-0.5">
                <span className="font-bold">Other Info: </span><span>{effectiveOtherInfo}</span>
              </div>
            ) : null}
          </div>

          {/* Detailed Full Box Nutrition Table */}
          <div className="w-full border border-black rounded overflow-hidden text-[7.5px] text-left my-0.5 shrink-0 text-black">
            <div className="bg-black text-white px-2 py-0.5 font-black text-[8px] flex justify-between">
              <span>NUTRITION FACTS & COMPLIANCE</span>
              <span>Per 100g Serving</span>
            </div>
            <div className="grid grid-cols-2 divide-x divide-black bg-white text-black p-1 gap-x-2">
              <div className="space-y-0.5">
                <div className="flex justify-between border-b border-black/40 pb-0.5"><span>Energy (Calories):</span><b className="font-mono">{product.nutrition_facts?.energy_kcal ?? '480'} kcal</b></div>
                <div className="flex justify-between border-b border-black/40 pb-0.5"><span>Total Protein:</span><b className="font-mono">{product.nutrition_facts?.protein_g ?? '11'} g</b></div>
                <div className="flex justify-between border-b border-black/40 pb-0.5"><span>Carbohydrates:</span><b className="font-mono">{product.nutrition_facts?.carbohydrates_g ?? '62'} g</b></div>
                <div className="flex justify-between text-black pl-1 text-[6.5px]"><span>- Added Sugars:</span><b className="font-mono">{product.nutrition_facts?.added_sugars_g ?? '0'} g</b></div>
              </div>
              <div className="space-y-0.5 pl-1.5">
                <div className="flex justify-between border-b border-black/40 pb-0.5"><span>Total Fat:</span><b className="font-mono">{product.nutrition_facts?.fat_total_g ?? '18'} g</b></div>
                <div className="flex justify-between border-b border-black/40 pb-0.5 text-black pl-1 text-[6.5px]"><span>- Saturated Fat:</span><b className="font-mono">{product.nutrition_facts?.saturated_fat_g ?? '4.5'} g</b></div>
                <div className="flex justify-between border-b border-black/40 pb-0.5"><span>Dietary Fiber:</span><b className="font-mono">{product.nutrition_facts?.dietary_fiber_g ?? '5.0'} g</b></div>
                <div className="flex justify-between"><span>Sodium:</span><b className="font-mono">{product.nutrition_facts?.sodium_mg ?? '320'} mg</b></div>
              </div>
            </div>
          </div>

          <div className="w-full text-[8.5px] font-black uppercase border-t border-black pt-1 shrink-0 text-black">
            <div className="flex justify-between items-center text-[11px]">
              <div>MRP: <b className="text-black line-through">₹{effectiveMrp}</b></div>
              <div>SPECIAL OFFER: <b className="text-black text-sm font-black">₹{effectiveSale}</b></div>
            </div>
            <div className="flex justify-between text-[7.5px] text-black mt-0.5 font-bold">
              <span>PKD DATE: {packedOn}</span>
              <span>EXPIRY DATE: {expiryOn || 'Best before 90 days from packing'}</span>
            </div>
          </div>
        </div>
      );
    }

    // 9. 100x50 mm Box/Pack Sticker (4"x2")
    if (size === '100x50') {
      return (
        <div className={containerClasses}>
          {/* Top Header */}
          <div className="w-full flex justify-between items-center border-b border-black pb-0.5 shrink-0 text-black">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-black">{effectiveCompany}</span>
              <span className="text-[7.5px] font-mono bg-white px-1 py-0.2 rounded border border-black font-bold">SKU: {product.sku || 'SKU-001'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs border border-black flex items-center justify-center shrink-0">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isVeg ? 'bg-black' : 'bg-transparent border border-black'}`} />
              </span>
              <span className="text-[8.5px] font-black text-black">{netWeight}</span>
            </div>
          </div>

          {/* Product Name */}
          <span className="text-[12px] font-black uppercase tracking-tight leading-tight truncate w-full my-0.5 shrink-0 text-black">
            {product.name}
          </span>

          {/* 2-Column Split: Left = Barcode in Box + Under-barcode details, Right = Pricing + Dates */}
          <div className="w-full grid grid-cols-12 gap-2 my-0.5 items-start text-black">
            <div className="col-span-7 flex flex-col items-center text-left">
              {renderBarcodeBox(18)}
              {/* UNDER BARCODE: FSSAI NUMBER, ADDRESS, INGREDIENTS */}
              <div className="w-full mt-1 bg-white p-1 rounded border border-black text-left space-y-0.8 text-black">
                <div className="text-[7.5px] font-black text-black flex items-center justify-between border-b border-black pb-0.5">
                  <span>FSSAI Lic. No: <b className="font-mono text-black">{effectiveFssai}</b></span>
                </div>
                <div className={`text-[7px] text-black leading-tight line-clamp-1 ${effectiveIngredients ? 'border-b border-black pb-0.5' : ''}`}>
                  <b>Address:</b> {effectiveAddress}
                </div>
                {effectiveIngredients ? (
                  <div className="text-[7px] text-black leading-tight line-clamp-1">
                    <b>Ingredients:</b> {effectiveIngredients}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="col-span-5 flex flex-col justify-between h-full border-l border-black pl-1.5 text-left text-black">
              <div className="bg-white p-1 rounded border border-black space-y-0.5">
                <div className="flex justify-between items-center text-[8px] font-bold text-black">
                  <span>MRP:</span>
                  <span className="line-through font-bold">₹{effectiveMrp}</span>
                </div>
                <div className="flex justify-between items-center text-[9px] font-black text-black">
                  <span>SALE:</span>
                  <span className="font-black text-[11px] text-black">₹{effectiveSale}</span>
                </div>
              </div>
              <div className="text-[7px] text-black space-y-0.5 pt-0.5 font-bold">
                <div><b>PKD:</b> {packedOn}</div>
                <div><b>EXP:</b> {expiryOn || 'Best before 90 days'}</div>
                <div className="font-black truncate">Mfg: {effectiveCompany}</div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="w-full flex justify-between items-center text-[6.5px] font-black uppercase border-t border-black pt-0.5 text-black shrink-0">
            <span>Customer Care: +91 98200 12345</span>
            <span>Store in Cool & Dry Place</span>
          </div>
        </div>
      );
    }

    // 10. Standard 220px Card
    if (size === 'standard') {
      return (
        <div className={containerClasses}>
          <div className="text-[9px] font-black uppercase mb-0.5 text-black shrink-0">{effectiveCompany}</div>
          <span className="text-[11px] font-black uppercase mb-1 leading-tight text-black shrink-0">{product.name}</span>
          {renderBarcodeBox(24)}
          <div className="flex flex-col items-center gap-0.5 mt-1 font-black uppercase text-[9.5px] w-full border-t border-black pt-1 text-black shrink-0">
            <div className="flex justify-between w-full px-2">
              <span>MRP: ₹{effectiveMrp}</span>
              <span className="font-black text-black">SALE: ₹{effectiveSale}</span>
            </div>
            <div className="text-[7.5px] font-bold text-black">
              PKD: {packedOn} {expiryOn ? `| EXP: ${expiryOn}` : ''}
            </div>
          </div>
        </div>
      );
    }

    // 11. 50x25 mm Standard Retail Label (Standard 2"x1" Thermal Sticker Roll - Double Line / 2-Up)
    if (size === '50x25') {
      return (
        <div 
          className={`${containerClasses} sticker-50x25`}
          data-size="50x25" 
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            color: '#000000',
            fontWeight: 400,
            ...(mode === 'print' 
              ? { 
                  padding: '0.4mm 0.6mm', 
                  width: '100%', 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between', 
                  boxSizing: 'border-box',
                  overflow: 'hidden'
                } 
              : { 
                  justifyContent: 'space-between', 
                  padding: '2px 3px', 
                  height: '100%', 
                  minHeight: '88px',
                  maxHeight: '94px',
                  boxSizing: 'border-box',
                  overflow: 'hidden'
                }
            )
          }}
        >
          {/* 1. Header (Brand Name, SKU, Dietary Symbol & Net Weight/Pkt badge) */}
          <div 
            className="w-full flex items-center justify-between border-b border-black pb-0.5 shrink-0 text-black leading-none font-normal px-0.5"
            style={{ borderBottom: '1px solid #000000', boxSizing: 'border-box' }}
          >
            <div className="flex items-center gap-1 min-w-0 truncate">
              {effectiveCompany ? (
                <span className="text-[7px] font-bold uppercase tracking-wider truncate text-black block leading-none">
                  {effectiveCompany}
                </span>
              ) : null}
              <span className="shrink-0 font-mono font-normal text-[5.5px] text-black">{product.sku ? `SKU: ${product.sku}` : ''}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span 
                className="w-2 h-2 rounded-xs border border-black flex items-center justify-center shrink-0 bg-white"
                style={{
                  width: '7.5px',
                  height: '7.5px',
                  minWidth: '7.5px',
                  minHeight: '7.5px',
                  border: '0.8px solid #000000',
                  borderRadius: '1px',
                  backgroundColor: '#ffffff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxSizing: 'border-box',
                  flexShrink: 0
                }}
              >
                <svg width="4.5" height="4.5" viewBox="0 0 8 8" className="shrink-0" style={{ display: 'block', margin: '0 auto', flexShrink: 0 }}>
                  <circle cx="4" cy="4" r={isVeg ? "3.2" : "0"} fill="#000000" stroke="#000000" strokeWidth="0.8" />
                  {!isVeg && <circle cx="4" cy="4" r="3.2" fill="none" stroke="#000000" strokeWidth="0.8" />}
                </svg>
              </span>
              <span 
                className="text-[5.5px] font-bold bg-black text-white px-1 py-0.2 rounded-xs border border-black uppercase tracking-tight flex items-center leading-none"
                style={{ backgroundColor: '#000000', color: '#ffffff', border: '0.8px solid #000000', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
              >
                {netWeight || 'Pkt'}
              </span>
            </div>
          </div>
          
          {/* 2. Product Name - Bold */}
          <div 
            className="w-full text-center shrink-0 text-black border-b border-black py-0.5 bg-white leading-none"
            style={{ borderBottom: '1px solid #000000', boxSizing: 'border-box' }}
          >
            <span className="text-[8.5px] font-bold uppercase tracking-tight leading-none text-center block w-full px-0.2 line-clamp-1 text-black">
              {product.name}
            </span>
          </div>

          {/* 3. Barcode Box - Scannable with Solid Border-b Under Barcode */}
          <div 
            className="w-full flex justify-center items-center shrink-0 border-b border-black py-0.5"
            style={{ borderBottom: '1px solid #000000', boxSizing: 'border-box', textAlign: 'center', overflow: 'visible' }}
          >
            {renderBarcodeBox(mode === 'print' ? 10 : 12)}
          </div>

          {/* 4. Commercial Pricing Box (MRP and SALE BOLD with PKD & EXP inside without ANY cut!) */}
          <div 
            className="w-full border border-black rounded-xs overflow-hidden shrink-0 text-black bg-white"
            style={{ 
              border: '1px solid #000000', 
              borderRadius: '2px', 
              boxSizing: 'border-box',
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact'
            }}
          >
            {/* MRP & SALE: Both BOLD and Prominent */}
            <div 
              className="flex justify-between items-center w-full px-1.5 py-0.5 bg-white border-b border-black leading-none"
              style={{ borderBottom: '0.8px solid #000000', boxSizing: 'border-box' }}
            >
              <span className="text-[8.5px] font-black text-black leading-none">
                {effectiveMrp !== '' ? `MRP: ₹${effectiveMrp}` : 'MRP: N/A'}
              </span>
              <span className="text-[9px] font-black text-black tracking-tight leading-none">
                {effectiveSale !== '' ? `SALE: ₹${effectiveSale}` : ''}
              </span>
            </div>
            {/* PKD & EXP Dates: Guaranteed inside the box, never cut off! */}
            <div className="flex justify-between items-center w-full px-1.5 py-0.5 text-[6.5px] font-bold text-black bg-white leading-none">
              <span>PKD: {packedOn}</span>
              {expiryOn ? <span>EXP: {expiryOn}</span> : <span>BEST BEFORE 12M</span>}
            </div>
          </div>
        </div>
      );
    }

    // 12. Default / 40x25 mm Retail Roll Label
    return (
      <div className={containerClasses}>
        <div className="w-full text-black shrink-0">
          {effectiveCompany && <div className="text-[7px] font-black uppercase leading-none truncate mb-0.5">{effectiveCompany}</div>}
          <div className="text-[8px] font-black uppercase tracking-tight leading-none truncate w-full px-0.5 border-b border-black pb-0.5">
            {product.name}
          </div>
        </div>
        
        {/* BARCODE IN THE BOX */}
        {renderBarcodeBox(effectiveCompany ? (size === '40x25' ? 14 : 15) : (size === '40x25' ? 16 : 17))}

        <div className="w-full text-[7.5px] font-black leading-none pt-0.5 uppercase border-t border-black text-black shrink-0">
          <div className="flex justify-between items-center px-0.5 mb-0.5">
            <span>MRP: ₹{effectiveMrp}</span>
            <span className="font-black text-black">SALE: ₹{effectiveSale}</span>
          </div>
          <div className="flex justify-between items-center px-0.5 text-[6.5px] font-bold text-black">
            <span>PKD: {packedOn}</span>
            <span>{expiryOn ? `EXP: ${expiryOn}` : ''}</span>
          </div>
        </div>
      </div>
    );
  };

  const stickerMarkup = renderStickerContent();

  const origDim = previewSizeDims[size] || { w: 189, h: 95 };
  const isNaturallyPortrait = origDim.h > origDim.w;
  const isNaturallyLandscape = origDim.w > origDim.h;

  let rotationDeg = 0;
  if (orientation === 'rotated90' || orientation === 'thermal-portrait-fix') {
    rotationDeg = 90;
  } else if (orientation === 'thermal-270-fix') {
    rotationDeg = 270;
  }

  const isRotated = rotationDeg !== 0;

  if (mode === 'print') {
    // Return markup without JS rotation. Rotation is handled via CSS @media print in the print template 
    // to ensure the on-screen preview stays horizontal while the physical print is rotated.
    return stickerMarkup;
  }

  return (
    <div 
      className="relative flex items-center justify-center shrink-0 transition-all duration-300 my-1"
      style={{ width: `${origDim.w}px`, height: `${origDim.h}px` }}
    >
      <div 
        className="transition-all duration-300 origin-center flex items-center justify-center"
        style={{
          width: `${origDim.w}px`,
          height: `${origDim.h}px`
        }}
      >
        {stickerMarkup}
      </div>
      {orientation !== 'auto' && orientation !== 'landscape' && (
        <div className={`absolute -top-1.5 -right-1.5 text-[7.5px] font-black px-1.5 py-0.2 rounded shadow-xs z-20 pointer-events-none flex items-center gap-0.5 border ${
          isRotated 
            ? 'bg-emerald-600 text-white border-emerald-300 ring-1 ring-emerald-400' 
            : 'bg-indigo-600 text-white border-indigo-300 ring-1 ring-indigo-400'
        }`}>
          <span>{rotationDeg === 90 ? '🌟 Thermal Fix' : rotationDeg === 270 ? '🔄 270° Fix' : '⬇ Vertical'}</span>
        </div>
      )}
    </div>
  );
};

export const ProductModule: React.FC<ProductModuleProps> = ({ 
  businessId, 
  user, 
  triggerToast,
  openAddModalInitially = false,
  initialCategoryId = ''
}) => {
  const [products, setProducts] = useState<Product[]>(dbStore.getProducts(businessId));
  const [categories, setCategories] = useState<Category[]>(dbStore.getCategories(businessId));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStockStatus, setSelectedStockStatus] = useState('All');
  const [selectedType, setSelectedType] = useState<'All' | 'Product' | 'Combo'>('All');

  // Nutrition Facts Modal State
  const [nutritionModalProduct, setNutritionModalProduct] = useState<Product | null>(null);

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
  const [printerType, setPrinterType] = useState<'thermal' | 'a4'>('thermal');
  const [printLabelSize, setPrintLabelSize] = useState<'50x25' | '50x38' | '38x25' | '40x25' | '50x30' | '50x50' | '50x75' | '60x100' | '100x50' | '100x75' | '100x100' | 'standard'>('50x25');
  const [printLabelsPerRow, setPrintLabelsPerRow] = useState<1 | 2>(2);
  const [printOrientation, setPrintOrientation] = useState<'auto' | 'landscape' | 'portrait' | 'rotated90' | 'thermal-portrait-fix' | 'thermal-270-fix'>('landscape');
  const [printHorizontalOffsetMm, setPrintHorizontalOffsetMm] = useState<number>(0);
  const [printAlignmentTarget, setPrintAlignmentTarget] = useState<'barcode' | 'all'>('all');
  const [printBoxBorder, setPrintBoxBorder] = useState(true);
  const [printBarcodeFrame, setPrintBarcodeFrame] = useState(true);
  const [showPrintHelp, setShowPrintHelp] = useState(false);
  const [printIncludeNutrition, setPrintIncludeNutrition] = useState(true);
  const [printIncludeCompanyName, setPrintIncludeCompanyName] = useState<boolean>(false);
  const [printSalePrice, setPrintSalePrice] = useState<number | string>('');
  const [printMrp, setPrintMrp] = useState<number | string>('');
  const [printPackedOn, setPrintPackedOn] = useState(new Date().toISOString().split('T')[0]);
  const [printExpiryOn, setPrintExpiryOn] = useState('');
  const [printCompanyName, setPrintCompanyName] = useState('');
  const [printFssaiNumber, setPrintFssaiNumber] = useState('');
  const [printPhone, setPrintPhone] = useState('');
  const [printAddress, setPrintAddress] = useState('');
  const [printOtherInfo, setPrintOtherInfo] = useState('');
  const [printIngredients, setPrintIngredients] = useState('');

  const saveBarcodeDefaults = (updates: {
    phone?: string;
    address?: string;
    other_info?: string;
    fssai?: string;
    ingredients?: string;
    company_name?: string;
    show_company?: boolean;
    label_size?: any;
    horizontal_offset_mm?: number;
    alignment_target?: 'barcode' | 'all';
  }) => {
    let existingDefaults: any = {};
    try {
      const raw = safeStorage.getItem(`omnipack_barcode_defaults_${businessId}`);
      if (raw) existingDefaults = JSON.parse(raw);
    } catch (e) {}

    const newDefaults = {
      ...existingDefaults,
      ...updates
    };

    safeStorage.setItem(`omnipack_barcode_defaults_${businessId}`, JSON.stringify(newDefaults));

    const bizUpdates: any = {};
    if (updates.phone !== undefined) {
      bizUpdates.barcode_phone = updates.phone;
      bizUpdates.mobile_number = updates.phone;
    }
    if (updates.address !== undefined) {
      bizUpdates.barcode_address = updates.address;
      bizUpdates.mfg_address = updates.address;
    }
    if (updates.other_info !== undefined) bizUpdates.barcode_other_info = updates.other_info;
    if (updates.fssai !== undefined) {
      bizUpdates.barcode_fssai = updates.fssai;
      bizUpdates.fssai_number = updates.fssai;
    }
    if (updates.ingredients !== undefined) bizUpdates.barcode_ingredients = updates.ingredients;
    if (updates.company_name !== undefined) bizUpdates.barcode_company_name = updates.company_name;
    if (updates.show_company !== undefined) bizUpdates.barcode_show_company = updates.show_company;
    if (updates.label_size !== undefined) bizUpdates.barcode_label_size = updates.label_size;

    try {
      dbStore.updateBusiness(businessId, bizUpdates);
    } catch (e) {
      console.warn('Failed to update business defaults', e);
    }
  };

  const handleSaveAllBarcodeDefaults = () => {
    saveBarcodeDefaults({
      phone: printPhone,
      address: printAddress,
      other_info: printOtherInfo,
      fssai: printFssaiNumber,
      ingredients: printIngredients,
      company_name: printCompanyName,
      show_company: printIncludeCompanyName,
      label_size: printLabelSize,
      horizontal_offset_mm: printHorizontalOffsetMm,
      alignment_target: printAlignmentTarget
    });

    if (printingBarcodeProduct) {
      const updatedProduct = {
        ...printingBarcodeProduct,
        food_packaging: {
          ...printingBarcodeProduct.food_packaging,
          customer_care_phone: printPhone,
          mfg_by: printAddress,
          other_info: printOtherInfo,
          fssai_license: printFssaiNumber,
          ingredients: printIngredients
        }
      };
      dbStore.updateProduct(printingBarcodeProduct.id, updatedProduct);
    }

    triggerToast('Barcode address, phone number, and other info saved! They will now always show in barcode stickers until you change them.', 'success');
  };

  useEffect(() => {
    if (printingBarcodeProduct) {
      setPrintSalePrice(printingBarcodeProduct.selling_price || '');
      setPrintMrp(printingBarcodeProduct.mrp || printingBarcodeProduct.selling_price || '');
      setPrintPackedOn(printingBarcodeProduct.food_packaging?.mfg_date || new Date().toISOString().split('T')[0]);
      
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 6);
      setPrintExpiryOn(expiryDate.toISOString().split('T')[0]);
      
      const currentBiz = dbStore.getBusiness(businessId);
      
      let savedDefaults: any = {};
      try {
        const raw = safeStorage.getItem(`omnipack_barcode_defaults_${businessId}`);
        if (raw) savedDefaults = JSON.parse(raw);
      } catch (e) {}

      // Company name & print company checkbox
      const savedCompany = savedDefaults.company_name ?? currentBiz?.barcode_company_name ?? currentBiz?.name ?? '';
      setPrintCompanyName(savedCompany);
      if (typeof savedDefaults.show_company === 'boolean') {
        setPrintIncludeCompanyName(savedDefaults.show_company);
      } else if (typeof currentBiz?.barcode_show_company === 'boolean') {
        setPrintIncludeCompanyName(currentBiz.barcode_show_company);
      }

      // Barcode Phone / Helpline (Priority: saved default if not empty > business settings phone/mobile > product food packaging)
      const settingsPhone = (
        currentBiz?.barcode_phone ||
        (currentBiz as any)?.mobile_number ||
        currentBiz?.phone ||
        ''
      ).trim();

      const initialPhone = 
        (savedDefaults.phone && savedDefaults.phone.trim().length > 0 ? savedDefaults.phone.trim() : '') ||
        settingsPhone ||
        (printingBarcodeProduct.food_packaging as any)?.customer_care_phone ||
        (printingBarcodeProduct as any)?.phone ||
        '';
      setPrintPhone(initialPhone);

      // Barcode Address (Priority: saved default if not empty > business settings address > product mfg_by)
      const settingsAddress = (
        currentBiz?.barcode_address ||
        currentBiz?.mfg_address ||
        currentBiz?.billing_address || 
        currentBiz?.shipping_address || 
        ''
      ).trim();

      const initialAddress = 
        (savedDefaults.address && savedDefaults.address.trim().length > 0 ? savedDefaults.address.trim() : '') ||
        settingsAddress ||
        printingBarcodeProduct.food_packaging?.mfg_by ||
        'Shop 14, Station Road, Borivali West, Mumbai, MH 400092';
      setPrintAddress(initialAddress);

      // Barcode Other Info (under phone & address)
      const initialOtherInfo = 
        savedDefaults.other_info ||
        currentBiz?.barcode_other_info ||
        (printingBarcodeProduct.food_packaging as any)?.other_info ||
        '';
      setPrintOtherInfo(initialOtherInfo);

      // Barcode FSSAI
      const initialFssai = 
        savedDefaults.fssai ||
        currentBiz?.barcode_fssai ||
        printingBarcodeProduct.food_packaging?.fssai_license ||
        (printingBarcodeProduct.food_packaging as any)?.fssai_license_number ||
        currentBiz?.fssai_number || 
        '11521018000123';
      setPrintFssaiNumber(initialFssai);

      // Ingredients
      const initialIngredients = 
        printingBarcodeProduct.food_packaging?.ingredients ||
        savedDefaults.ingredients ||
        currentBiz?.barcode_ingredients ||
        'Roasted Rice Flour, Bengal Gram, Spices, Edible Oil, Salt';
      setPrintIngredients(initialIngredients);

      // Label Size if saved
      if (savedDefaults.label_size) {
        setPrintLabelSize(savedDefaults.label_size);
        if (savedDefaults.label_size === '50x25') {
          setPrintLabelsPerRow(2);
          setPrintOrientation('landscape');
          setPrintAlignmentTarget('all');
        } else if (savedDefaults.label_size === '60x100') {
          setPrintLabelsPerRow(1);
          setPrintOrientation('portrait');
          setPrintIncludeNutrition(true);
          setPrintAlignmentTarget('all');
        }
      }

      if (savedDefaults.horizontal_offset_mm !== undefined) {
        setPrintHorizontalOffsetMm(Number(savedDefaults.horizontal_offset_mm));
      }

      if (savedDefaults.alignment_target) {
        setPrintAlignmentTarget(savedDefaults.alignment_target);
      }

      if (printingBarcodeProduct.nutrition_facts) {
        setPrintIncludeNutrition(true);
      }
    }
  }, [printingBarcodeProduct, businessId]);
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
  const [formCategory, setFormCategory] = useState(initialCategoryId || '');
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
    if (openAddModalInitially) {
      resetForm();
      if (initialCategoryId) {
        setFormCategory(initialCategoryId);
      }
    }
  }, [openAddModalInitially, initialCategoryId]);

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

    // Validate component product existence (out of stock and negative stock are allowed)
    let hasNegativeComponents = false;
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
      if (totalReqQty > 0 && prod.current_stock < totalReqQty) {
        hasNegativeComponents = true;
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

        triggerToast(`Combo Box "${formName}" updated successfully.${hasNegativeComponents ? ' (Note: Component stock reduced to negative)' : ''}`, 'success');
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

        triggerToast(`New Combo Box "${formName}" created and added to catalog.${hasNegativeComponents ? ' (Component stock reduced to negative)' : ''}`, 'success');
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
      let exportRows: any[] = [];
      const currentProducts = dbStore.getProducts(businessId);
      
      if (currentProducts.length > 0) {
        exportRows = currentProducts.map(p => {
          const category = dbStore.getCategories(businessId).find(c => c.id === p.category_id)?.name || 'General';
          return {
            'Product Name': p.name,
            'SKU': p.sku,
            'Barcode': p.barcode,
            'Category': category,
            'Purchase Price': p.purchase_price,
            'Selling Price': p.selling_price,
            'MRP': p.mrp,
            'GST Rate (%)': p.gst_rate,
            'Opening Stock': p.opening_stock,
            'Minimum Stock': p.minimum_stock,
            'Purchase Unit': p.purchase_unit || 'Pcs',
            'Selling Unit': p.selling_unit || 'Pcs',
            'Description': p.description || ''
          };
        });
      } else {
        exportRows = [
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
      }

      const ws = XLSX.utils.json_to_sheet(exportRows, {
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
      XLSX.utils.book_append_sheet(wb, ws, 'Products');
      XLSX.writeFile(wb, `Product_List_${new Date().toISOString().slice(0, 10)}.xlsx`);

      triggerToast('Product list exported as Excel successfully.', 'success');
      dbStore.logActivity(user.id, user.name, user.role, 'Export Catalog', 'Exported product list to Excel', businessId);
    } catch (err: any) {
      console.error('Failed to export excel:', err);
      triggerToast('Failed to export excel.', 'error');
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
        const existingNames = new Set(currentProducts.map(p => String(p.name || '').trim().toLowerCase()).filter(Boolean));
        const existingSkus = new Set(currentProducts.map(p => String(p.sku || '').trim().toLowerCase()).filter(Boolean));
        const existingBarcodes = new Set(currentProducts.map(p => String(p.barcode || '').trim().toLowerCase()).filter(Boolean));

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

  const handleSaveNutrition = (updatedProduct: Product) => {
    try {
      const allProducts = dbStore.getProducts(businessId);
      const originalProduct = allProducts.find(p => p.id === updatedProduct.id);

      const companyInfoChanged = 
        updatedProduct.food_packaging?.mfg_by !== originalProduct?.food_packaging?.mfg_by ||
        updatedProduct.food_packaging?.customer_care !== originalProduct?.food_packaging?.customer_care ||
        updatedProduct.food_packaging?.mkt_by !== originalProduct?.food_packaging?.mkt_by ||
        updatedProduct.food_packaging?.fssai_license !== originalProduct?.food_packaging?.fssai_license;

      dbStore.updateProduct(updatedProduct.id, {
        nutrition_facts: updatedProduct.nutrition_facts,
        food_packaging: updatedProduct.food_packaging
      });

      if (companyInfoChanged && updatedProduct.food_packaging) {
        const updatesArray: { id: string, updates: Partial<Product> }[] = [];
        allProducts.forEach(prod => {
          if (prod.id !== updatedProduct.id) {
            updatesArray.push({
              id: prod.id,
              updates: {
                food_packaging: {
                  ...(prod.food_packaging || {}),
                  fssai_license: updatedProduct.food_packaging!.fssai_license,
                  mfg_by: updatedProduct.food_packaging!.mfg_by,
                  mkt_by: updatedProduct.food_packaging!.mkt_by,
                  customer_care: updatedProduct.food_packaging!.customer_care
                }
              }
            });
          }
        });
        if (updatesArray.length > 0) {
          dbStore.bulkUpdateProducts(updatesArray);
        }
      }

      setProducts(dbStore.getProducts(businessId));
      if (editingProduct?.id === updatedProduct.id) {
        setEditingProduct(updatedProduct);
      }
      if (printingBarcodeProduct?.id === updatedProduct.id) {
        setPrintingBarcodeProduct(updatedProduct);
      }
      setNutritionModalProduct(null);
      triggerToast(`Nutrition & packaging facts saved for "${updatedProduct.name}"!`, 'success');
      dbStore.logActivity(
        user.id,
        user.name,
        user.role,
        'Update Nutrition',
        `Updated nutrition facts and packaging compliance for product: ${updatedProduct.name} (${updatedProduct.sku})`,
        businessId
      );
    } catch (err) {
      console.error('Error saving nutrition facts:', err);
      triggerToast('Failed to save nutrition facts.', 'error');
    }
  };

  const handleOpenBarcodeModal = (prod: Product) => {
    setPrintingBarcodeProduct(prod);
    setPrintLabelSize('60x100');
    setPrintLabelsPerRow(1);
    setPrintOrientation('portrait');
    setPrintAlignmentTarget('all');
    setPrintIncludeCompanyName(false);
    setPrintLabelCount(prod.current_stock > 0 ? (prod.current_stock > 20 ? 20 : prod.current_stock) : 10);
    setPrintSalePrice(prod.selling_price !== undefined && prod.selling_price !== null ? prod.selling_price : '');
    setPrintMrp(prod.mrp !== undefined && prod.mrp !== null ? prod.mrp : (prod.selling_price || ''));
    setPrintPackedOn(new Date().toISOString().split('T')[0]);
    setPrintExpiryOn((prod as any).expiry_date ? new Date((prod as any).expiry_date).toISOString().split('T')[0] : '');
    if (prod.nutrition_facts) {
      setPrintIncludeNutrition(true);
    }
  };

  const handlePrintBarcodeSubmit = (targetMode: 'iframe' | 'popup' = 'iframe') => {
    if (!printingBarcodeProduct) return;

    const count = Math.max(1, Number(printLabelCount) || 1);
    const pageDims = getPrintPageDimensions(printLabelSize, printLabelsPerRow, printOrientation, printerType);
    const sizeInfo = LABEL_SIZE_INFO[printLabelSize] || { label: printLabelSize, desc: '' };
    const orientationLabel = 
      printOrientation === 'landscape' ? 'Horizontal (Standard Wide - Recommended)' :
      printOrientation === 'thermal-portrait-fix' || printOrientation === 'rotated90' ? '90° Thermal Fix (Vertical Page Feed)' :
      printOrientation === 'thermal-270-fix' ? '270° Reverse Fix' :
      printOrientation === 'portrait' ? 'Vertical (Tall Roll Feed)' :
      'Auto (Exact Dimensions)';

    triggerToast(`Opening ${count} label(s) for "${printingBarcodeProduct.name}" (${sizeInfo.label} • ${pageDims.pageWidthMm}×${pageDims.pageHeightMm} • ${orientationLabel})...`, 'info');
    dbStore.logActivity(
      user.id,
      user.name,
      user.role,
      'Print Barcode',
      `Printed ${count} barcodes (${sizeInfo.label} • ${pageDims.pageWidthMm}×${pageDims.pageHeightMm} [${printOrientation}]) for SKU: ${printingBarcodeProduct.sku || printingBarcodeProduct.barcode}`,
      businessId
    );

    // If popup mode requested, open popup immediately on click to prevent browser popup blocker
    let popupWindow: Window | null = null;
    if (targetMode === 'popup') {
      try {
        popupWindow = window.open('', '_blank', 'width=980,height=820,menubar=no,toolbar=no,location=no,status=no');
        if (popupWindow) {
          popupWindow.document.title = '\u200B';
        }
      } catch (e) {
        console.warn('Popup window blocked or error:', e);
      }
    }

    setTimeout(() => {
      const printableEl = document.getElementById('barcode-printable-area');
      if (!printableEl) {
        window.print();
        return;
      }

      const totalRows = Math.ceil(count / printLabelsPerRow);

      const printHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>&#8203;</title>
  <style>
    *, *:before, *:after {
      box-sizing: border-box !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html {
      background: white;
      color: #000000;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
      margin: 0;
      padding: 0;
      text-rendering: geometricPrecision !important;
      -webkit-font-smoothing: antialiased !important;
      -moz-osx-font-smoothing: grayscale !important;
      font-smoothing: antialiased !important;
      letter-spacing: 0.01em !important;
    }
    body {
      margin: 0;
      padding: 0;
      background: white;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    /* EXACT PAPER SIZE SPECIFICATION - ENFORCES CUSTOM THERMAL ROLL SIZE INSTEAD OF A4 */
    @page {
      size: ${pageDims.cssPageSize} !important;
      margin: 0mm !important;
      padding: 0mm !important;
      @top-left { content: "" !important; display: none !important; }
      @top-right { content: "" !important; display: none !important; }
      @top-center { content: "" !important; display: none !important; }
      @bottom-left { content: "" !important; display: none !important; }
      @bottom-right { content: "" !important; display: none !important; }
      @bottom-center { content: "" !important; display: none !important; }
    }
    @page :first { margin: 0mm !important; }
    @page :left { margin: 0mm !important; }
    @page :right { margin: 0mm !important; }

    @media print {
      @page {
        size: ${pageDims.cssPageSize} !important;
        margin: 0mm !important;
        padding: 0mm !important;
        @top-left { content: "" !important; display: none !important; }
        @top-right { content: "" !important; display: none !important; }
        @top-center { content: "" !important; display: none !important; }
        @bottom-left { content: "" !important; display: none !important; }
        @bottom-right { content: "" !important; display: none !important; }
        @bottom-center { content: "" !important; display: none !important; }
      }
      @page :first { margin: 0mm !important; }
      @page :left { margin: 0mm !important; }
      @page :right { margin: 0mm !important; }
      .no-print, [class*="no-print"], header, .popup-header, .print-guidance-banner {
        display: none !important;
      }
      html, body {
        margin: 0mm !important;
        padding: 0mm !important;
        background: #ffffff !important;
        color: #000000 !important;
        width: 100% !important;
        height: auto !important;
        min-height: 0 !important;
        display: block !important;
        overflow: visible !important;
      }
      .barcode-print-portal {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        border: none !important;
        background: #ffffff !important;
        width: 100% !important;
      }
      .barcode-print-portal * {
        visibility: visible !important;
      }
      .border, [class*="border"] {
        border-color: #000000 !important;
      }
      .border-b, [class*="border-b"] {
        border-bottom-color: #000000 !important;
      }
      .border-t, [class*="border-t"] {
        border-top-color: #000000 !important;
      }
    }

    /* Screen Preview Toolbar */
    .popup-header {
      position: sticky;
      top: 0;
      left: 0;
      right: 0;
      width: 100%;
      background: #0f172a;
      color: #ffffff;
      padding: 12px 20px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      z-index: 99999;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
      border-bottom: 2px solid #6366f1;
    }
    .popup-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    .badge-size {
      background: #312e81;
      color: #c7d2fe;
      border: 1px solid #4f46e5;
    }
    .badge-roll {
      background: #064e3b;
      color: #a7f3d0;
      border: 1px solid #059669;
    }
    .badge-orient {
      background: #78350f;
      color: #fde68a;
      border: 1px solid #d97706;
    }
    .badge-nota4 {
      background: #1e1b4b;
      color: #818cf8;
      border: 1px solid #6366f1;
    }
    .badge-box {
      background: #1e293b;
      color: #38bdf8;
      border: 1px solid #0284c7;
    }
    .btn-print {
      background: linear-gradient(135deg, #4f46e5, #3b82f6);
      color: #ffffff;
      border: none;
      padding: 9px 22px;
      border-radius: 8px;
      font-weight: 800;
      font-size: 13px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 2px 10px rgba(79,70,229,0.5);
      transition: transform 0.1s, opacity 0.1s;
    }
    .btn-print:hover {
      opacity: 0.95;
    }
    .btn-print:active {
      transform: scale(0.97);
    }
    .btn-close {
      background: #334155;
      color: #cbd5e1;
      border: 1px solid #475569;
      padding: 9px 16px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-close:hover {
      background: #475569;
      color: #ffffff;
    }

    /* Screen Paper Roll Container - Always Horizontal Preview */
    .barcode-print-portal {
      margin: 24px auto;
      background: #ffffff;
      box-shadow: 0 10px 30px rgba(0,0,0,0.6);
      border-radius: 6px;
      overflow: hidden;
      width: ${pageDims.isRotated ? pageDims.pageHeightMm : pageDims.pageWidthMm};
      display: block;
    }

    /* Print Row & Sticker Styles */
    .barcode-print-row {
      display: flex !important;
      flex-direction: row !important; /* Row for horizontal screen preview */
      justify-content: center !important;
      align-items: center !important;
      width: ${pageDims.isRotated ? pageDims.pageHeightMm : pageDims.pageWidthMm} !important;
      height: ${pageDims.isRotated ? pageDims.pageWidthMm : pageDims.pageHeightMm} !important;
      page-break-after: always !important;
      page-break-inside: avoid !important;
      break-after: page !important;
      break-inside: avoid !important;
      margin: 0 auto !important;
      padding: 0 !important;
      overflow: visible !important;
      box-sizing: border-box !important;
      background: #ffffff !important;
      border-bottom: 1px dashed #cbd5e1;
      ${printAlignmentTarget === 'all' && printHorizontalOffsetMm !== 0 ? `transform: translateX(${printHorizontalOffsetMm}mm) !important;` : ''}
    }
    @media print {
      .barcode-print-row {
        flex-direction: ${pageDims.isRotated ? 'column' : 'row'} !important; /* Column for Portrait Fix */
        width: ${pageDims.pageWidthMm} !important;
        height: ${pageDims.pageHeightMm} !important;
        border-bottom: none !important;
        margin: 0 auto !important;
        padding: 0 !important;
        display: flex !important;
        justify-content: ${printLabelsPerRow === 2 ? 'space-around' : 'center'} !important;
        align-items: center !important;
        box-sizing: border-box !important;
        overflow: visible !important;
        ${printAlignmentTarget === 'all' && printHorizontalOffsetMm !== 0 ? `transform: translateX(${printHorizontalOffsetMm}mm) !important;` : ''}
      }
    }
    .barcode-print-row:last-child {
      page-break-after: auto !important;
      break-after: auto !important;
      border-bottom: none;
    }

    .barcode-label-sticker {
      box-sizing: border-box !important;
      margin: 0 auto !important;
      padding: 0 !important;
      border: none !important;
      display: flex !important;
      flex-direction: column !important;
      justifyContent: flex-start !important;
      align-items: center !important;
      text-align: center !important;
      overflow: hidden !important;
      background: #ffffff !important;
      color: #000000 !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      /* Screen Dimensions updated to match printing boundaries */
      width: ${printLabelsPerRow === 2 && !pageDims.isRotated 
        ? `calc(${pageDims.baseDims.stickerWidthMm} - 1mm)` 
        : `calc(${pageDims.pageWidthMm} - 1.2mm)`} !important;
      height: calc(${pageDims.baseDims.stickerHeightMm} - 1.2mm) !important;
    }
    @media print {
      .barcode-label-sticker {
        width: ${printLabelsPerRow === 2 && !pageDims.isRotated 
          ? `calc(${pageDims.baseDims.stickerWidthMm} - 1mm)` 
          : `calc(${pageDims.pageWidthMm} - 1.2mm)`} !important;
        height: calc(${pageDims.baseDims.stickerHeightMm} - 1.2mm) !important;
        max-height: calc(${pageDims.baseDims.stickerHeightMm} - 1.2mm) !important;
        margin: 0 auto !important;
        padding: 0 !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: flex-start !important;
        align-items: center !important;
        text-align: center !important;
        box-sizing: border-box !important;
        overflow: hidden !important;
        /* Print Rotation Fix */
        ${pageDims.isRotated ? `
          width: calc(${pageDims.baseDims.stickerHeightMm} - 1.2mm) !important;
          height: calc(${pageDims.baseDims.stickerWidthMm} - 1mm) !important;
          max-height: calc(${pageDims.baseDims.stickerWidthMm} - 1mm) !important;
          transform: rotate(${pageDims.rotationDeg}deg) !important;
          transform-origin: center !important;
        ` : ''}
      }
    }
    .barcode-label-placeholder {
      visibility: hidden !important;
      opacity: 0 !important;
    }
    .barcode-label-sticker img,
    .barcode-label-sticker svg {
      display: block !important;
      margin: 0 auto !important;
      max-width: 100% !important;
      background-color: #ffffff !important;
      image-rendering: -webkit-optimize-contrast !important;
      image-rendering: crisp-edges !important;
      image-rendering: pixelated !important;
      shape-rendering: crispEdges !important;
      overflow: visible !important;
    }
    .barcode-label-sticker svg text {
      fill: #000000 !important;
      color: #000000 !important;
      font-family: monospace, "Courier New", Courier !important;
      letter-spacing: 0.04em !important;
    }
    .barcode-inner-box {
      background-color: #ffffff !important;
      box-sizing: border-box !important;
    }

    /* Embedded Standard Utilities for Crisp Thermal Printing */
    *, html, body, .barcode-print-portal, .barcode-label-sticker, table, tr, td, th, div, span, p, b, strong {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
      color: #000000 !important;
      text-rendering: geometricPrecision !important;
      -webkit-font-smoothing: antialiased !important;
    }
    .text-\\[2px\\] { font-size: 2px !important; line-height: 1 !important; }
    .text-\\[2\\.5px\\] { font-size: 2.5px !important; line-height: 1 !important; }
    .text-\\[2\\.8px\\] { font-size: 2.8px !important; line-height: 1 !important; }
    .text-\\[3px\\] { font-size: 3px !important; line-height: 1 !important; }
    .text-\\[3\\.5px\\] { font-size: 3.5px !important; line-height: 1.05 !important; }
    .text-\\[4px\\] { font-size: 4px !important; line-height: 1.05 !important; }
    .text-\\[4\\.5px\\] { font-size: 4.5px !important; line-height: 1.1 !important; }
    .text-\\[5px\\] { font-size: 5px !important; line-height: 1.1 !important; }
    .text-\\[5\\.5px\\] { font-size: 5.5px !important; line-height: 1.1 !important; }
    .text-\\[6px\\] { font-size: 6px !important; line-height: 1.15 !important; }
    .text-\\[6\\.5px\\] { font-size: 6.5px !important; line-height: 1.15 !important; }
    .text-\\[7px\\] { font-size: 7px !important; line-height: 1.15 !important; }
    .text-\\[7\\.5px\\] { font-size: 7.5px !important; line-height: 1.15 !important; }
    .text-\\[8px\\] { font-size: 8px !important; line-height: 1.2 !important; }
    .text-\\[8\\.5px\\] { font-size: 8.5px !important; line-height: 1.2 !important; }
    .text-\\[9px\\] { font-size: 9px !important; line-height: 1.25 !important; }
    .text-\\[9\\.5px\\] { font-size: 9.5px !important; line-height: 1.25 !important; }
    .text-\\[10px\\] { font-size: 10px !important; line-height: 1.25 !important; }
    .text-\\[10\\.5px\\] { font-size: 10.5px !important; line-height: 1.3 !important; }
    .text-\\[11px\\] { font-size: 11px !important; line-height: 1.3 !important; }
    .text-\\[11\\.5px\\] { font-size: 11.5px !important; line-height: 1.3 !important; }
    .text-\\[12px\\] { font-size: 12px !important; line-height: 1.3 !important; }
    .text-\\[12\\.5px\\] { font-size: 12.5px !important; line-height: 1.3 !important; }
    .text-\\[13px\\] { font-size: 13px !important; line-height: 1.3 !important; }
    .text-\\[13\\.5px\\] { font-size: 13.5px !important; line-height: 1.3 !important; }
    .text-\\[14px\\] { font-size: 14px !important; line-height: 1.3 !important; }
    .text-\\[14\\.5px\\] { font-size: 14.5px !important; line-height: 1.3 !important; }
    .text-\\[15px\\] { font-size: 15px !important; line-height: 1.3 !important; }
    .bg-black { background-color: #000000 !important; color: #ffffff !important; }
    .text-white { color: #ffffff !important; }
    .max-w-\\[120px\\] { max-width: 120px !important; }
    .max-w-\\[125px\\] { max-width: 125px !important; }
    .max-w-\\[130px\\] { max-width: 130px !important; }
    .w-full { width: 100% !important; }
    .h-full { height: 100% !important; }
    .flex { display: flex !important; }
    .flex-col { flex-direction: column !important; }
    .flex-row { flex-direction: row !important; }
    .justify-between { justify-content: space-between !important; }
    .justify-start { justify-content: flex-start !important; }
    .justify-center { justify-content: center !important; }
    .barcode-label-sticker > div { justify-content: flex-start !important; }
    .barcode-label-sticker > div.sticker-60x100,
    .barcode-label-sticker > div[data-size="60x100"],
    .barcode-label-sticker > div.sticker-50x25,
    .barcode-label-sticker > div[data-size="50x25"] {
      justify-content: space-between !important;
      height: 100% !important;
      box-sizing: border-box !important;
    }
    .items-center { align-items: center !important; }
    .items-start { align-items: flex-start !important; }
    .items-end { align-items: flex-end !important; }
    .text-center { text-align: center !important; }
    .text-left { text-align: left !important; }
    .text-right { text-align: right !important; }
    .truncate { overflow: hidden !important; text-overflow: ellipsis !important; white-space: nowrap !important; }
    .shrink-0 { flex-shrink: 0 !important; }
    .grow { flex-grow: 1 !important; }
    .grid { display: grid !important; }
    .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
    .grid-cols-12 { grid-template-columns: repeat(12, minmax(0, 1fr)) !important; }
    .col-span-5 { grid-column: span 5 / span 5 !important; }
    .col-span-7 { grid-column: span 7 / span 7 !important; }
    .col-span-12 { grid-column: span 12 / span 12 !important; }
    .gap-0\\.5 { gap: 2px !important; }
    .gap-1 { gap: 4px !important; }
    .gap-1\\.5 { gap: 6px !important; }
    .gap-2 { gap: 8px !important; }
    .gap-3 { gap: 12px !important; }
    .my-0\\.5 { margin-top: 2px !important; margin-bottom: 2px !important; }
    .my-1 { margin-top: 4px !important; margin-bottom: 4px !important; }
    .my-1\\.5 { margin-top: 6px !important; margin-bottom: 6px !important; }
    .my-2 { margin-top: 8px !important; margin-bottom: 8px !important; }
    .mt-0\\.5 { margin-top: 2px !important; }
    .mt-1 { margin-top: 4px !important; }
    .mt-1\\.5 { margin-top: 6px !important; }
    .mt-auto { margin-top: auto !important; }
    .mb-0\\.5 { margin-bottom: 2px !important; }
    .mb-1 { margin-bottom: 4px !important; }
    .mb-1\\.5 { margin-bottom: 6px !important; }
    .mb-2 { margin-bottom: 8px !important; }
    .p-0\\.5 { padding: 2px !important; }
    .p-1 { padding: 4px !important; }
    .p-1\\.5 { padding: 6px !important; }
    .p-2 { padding: 8px !important; }
    .p-2\\.5 { padding: 10px !important; }
    .p-3 { padding: 12px !important; }
    .px-0\\.5 { padding-left: 2px !important; padding-right: 2px !important; }
    .px-1 { padding-left: 4px !important; padding-right: 4px !important; }
    .px-1\\.5 { padding-left: 6px !important; padding-right: 6px !important; }
    .px-2 { padding-left: 8px !important; padding-right: 8px !important; }
    .px-2\\.5 { padding-left: 10px !important; padding-right: 10px !important; }
    .py-0\\.2 { padding-top: 1px !important; padding-bottom: 1px !important; }
    .py-0\\.5 { padding-top: 2px !important; padding-bottom: 2px !important; }
    .py-0\\.8 { padding-top: 3.2px !important; padding-bottom: 3.2px !important; }
    .py-1 { padding-top: 4px !important; padding-bottom: 4px !important; }
    .py-1\\.2 { padding-top: 4.8px !important; padding-bottom: 4.8px !important; }
    .py-1\\.5 { padding-top: 6px !important; padding-bottom: 6px !important; }
    .py-2 { padding-top: 8px !important; padding-bottom: 8px !important; }
    .pb-0\\.5 { padding-bottom: 2px !important; }
    .pb-0\\.8 { padding-bottom: 3.2px !important; }
    .pb-1 { padding-bottom: 4px !important; }
    .pt-0\\.5 { padding-top: 2px !important; }
    .pt-1 { padding-top: 4px !important; }
    .pl-1 { padding-left: 4px !important; }
    .pl-1\\.5 { padding-left: 6px !important; }
    .pl-2 { padding-left: 8px !important; }
    .space-y-0\\.5 > :not([hidden]) ~ :not([hidden]) { margin-top: 2px !important; }
    .space-y-0\\.8 > :not([hidden]) ~ :not([hidden]) { margin-top: 3.2px !important; }
    .space-y-1 > :not([hidden]) ~ :not([hidden]) { margin-top: 4px !important; }
    .border, [class*="border"] { border-color: #000000 !important; }
    .border, [class~="border"] { border: 1px solid #000000 !important; }
    .border-b, [class~="border-b"], [class*="border-b"] { border-bottom-color: #000000 !important; }
    .border-t, [class~="border-t"], [class*="border-t"] { border-top-color: #000000 !important; }
    .border-l, [class~="border-l"], [class*="border-l"] { border-left-color: #000000 !important; }
    .border-r, [class~="border-r"], [class*="border-r"] { border-right-color: #000000 !important; }
    .border-b { border-bottom: 1px solid #000000 !important; }
    .border-t { border-top: 1px solid #000000 !important; }
    .border-l { border-left: 1px solid #000000 !important; }
    .border-r { border-right: 1px solid #000000 !important; }
    .border-y { border-top: 1px solid #000000 !important; border-bottom: 1px solid #000000 !important; }
    .border-\\[0\\.5px\\], [class*="border-[0.5px]"] { border: 1px solid #000000 !important; }
    .border-b-\\[0\\.5px\\], [class*="border-b-[0.5px]"] { border-bottom: 1px solid #000000 !important; }
    .border-t-\\[0\\.5px\\], [class*="border-t-[0.5px]"] { border-top: 1px solid #000000 !important; }
    .border-\\[1px\\], [class*="border-[1px]"] { border: 1px solid #000000 !important; }
    .border-b-\\[1px\\], [class*="border-b-[1px]"] { border-bottom: 1px solid #000000 !important; }
    .border-t-\\[1px\\], [class*="border-t-[1px]"] { border-top: 1px solid #000000 !important; }
    .border-\\[1\\.2px\\] { border: 1.2px solid #000000 !important; }
    .border-\\[1\\.5px\\] { border: 1.5px solid #000000 !important; }
    .border-b-\\[1\\.2px\\] { border-bottom: 1.2px solid #000000 !important; }
    .border-b-\\[1\\.5px\\] { border-bottom: 1.5px solid #000000 !important; }
    .border-t-\\[1\\.2px\\] { border-top: 1.2px solid #000000 !important; }
    .border-t-\\[1\\.5px\\] { border-top: 1.5px solid #000000 !important; }
    .border-y-\\[1\\.5px\\] { border-top: 1.5px solid #000000 !important; border-bottom: 1.5px solid #000000 !important; }
    .border-2 { border: 2px solid #000000 !important; }
    .border-b-2 { border-bottom: 2px solid #000000 !important; }
    .border-t-2 { border-top: 2px solid #000000 !important; }
    .border-black { border-color: #000000 !important; }
    .border-slate-300, .border-slate-400, .border-slate-600, .border-slate-700, .border-slate-800, .border-slate-900 { border-color: #000000 !important; }
    .divide-y > :not([hidden]) ~ :not([hidden]) { border-top: 1px solid #000000 !important; }
    .divide-y-2 > :not([hidden]) ~ :not([hidden]) { border-top: 2px solid #000000 !important; }
    .divide-black > :not([hidden]) ~ :not([hidden]) { border-color: #000000 !important; }
    .divide-x > :not([hidden]) ~ :not([hidden]) { border-left: 1px solid #000000 !important; }
    .bg-white { background-color: #ffffff !important; }
    .bg-black { background-color: #000000 !important; color: #ffffff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    .text-white { color: #ffffff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    .bg-black span, .bg-black div, .bg-black p, .bg-black b, .bg-black strong, .bg-black * { color: #ffffff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    .bg-slate-50, .bg-slate-100 { background-color: #ffffff !important; }
    .text-black { color: #000000 !important; }
    .text-slate-900, .text-slate-800, .text-slate-700, .text-slate-600, .text-slate-500, .text-slate-400, .text-indigo-700, .text-indigo-600, .text-emerald-700, .text-emerald-600 { color: #000000 !important; }
    .border-emerald-600, .border-rose-600 { border-color: #000000 !important; }
    .bg-emerald-600, .bg-rose-600 { background-color: #000000 !important; }
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important; }
    .font-sans { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important; }
    .font-normal { font-weight: 400 !important; }
    .font-medium { font-weight: 500 !important; }
    .font-semibold { font-weight: 600 !important; }
    .font-bold { font-weight: 700 !important; }
    .font-extrabold { font-weight: 800 !important; }
    .font-black { font-weight: 900 !important; }
    .uppercase { text-transform: uppercase !important; }
    .line-through { text-decoration: line-through !important; }
    .break-words { overflow-wrap: break-word !important; word-break: break-word !important; }
    .overflow-hidden { overflow: hidden !important; }
    .line-clamp-1 { display: -webkit-box !important; -webkit-line-clamp: 1 !important; -webkit-box-orient: vertical !important; overflow: hidden !important; }
    .line-clamp-2 { display: -webkit-box !important; -webkit-line-clamp: 2 !important; -webkit-box-orient: vertical !important; overflow: hidden !important; }
    .rounded { border-radius: 4px !important; }
    .rounded-xs { border-radius: 2px !important; }
    .rounded-md { border-radius: 6px !important; }
    .rounded-full { border-radius: 9999px !important; }
    .leading-none { line-height: 1 !important; }
    .leading-tight { line-height: 1.25 !important; }
    .leading-snug { line-height: 1.35 !important; }
    .leading-relaxed { line-height: 1.5 !important; }
    .tracking-tight { letter-spacing: -0.025em !important; }
    .tracking-wide { letter-spacing: 0.025em !important; }
    .tracking-wider { letter-spacing: 0.05em !important; }
    .box-border { box-sizing: border-box !important; }
    .w-1\.5 { width: 6px !important; }
    .h-1\.5 { height: 6px !important; }
    .w-2 { width: 8px !important; }
    .h-2 { height: 8px !important; }
    .w-2\.5 { width: 10px !important; }
    .h-2\.5 { height: 10px !important; }
    .w-3 { width: 12px !important; }
    .h-3 { height: 12px !important; }
    .w-3\.5 { width: 14px !important; }
    .h-3\.5 { height: 14px !important; }
    .whitespace-nowrap { white-space: nowrap !important; }
  </style>
</head>
<body>
  <!-- Interactive Browser Popup Print Header (Hidden on actual print) -->
  <header class="popup-header no-print">
    <div style="display: flex; flex-direction: column; gap: 6px; width: 100%;">
      <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px;">
        <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 8px;">
          <span style="font-weight: 900; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #ffffff;">🖨️ Thermal Barcode Print Station</span>
          <span class="popup-badge badge-size">📏 Selected Size: ${sizeInfo.label} (${sizeInfo.desc})</span>
          <span class="popup-badge badge-nota4">✅ Paper Size: ${pageDims.pageWidthMm} × ${pageDims.pageHeightMm} (Not A4)</span>
          <span class="popup-badge badge-box">📦 Box Border: ${printBoxBorder ? 'Active' : 'Off'}</span>
          <span class="popup-badge badge-box">🔲 Barcode Box: ${printBarcodeFrame ? 'Active' : 'Off'}</span>
          ${printHorizontalOffsetMm !== 0 ? `<span class="popup-badge badge-orient" style="background: #1e3a8a; color: #93c5fd; border: 1px solid #3b82f6;">📐 Alignment Offset: ${printHorizontalOffsetMm > 0 ? `+${printHorizontalOffsetMm}` : printHorizontalOffsetMm}mm</span>` : ''}
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <button class="btn-print" onclick="try{document.title='\u200B';if(window.opener&&window.opener.document)window.opener.document.title='\u200B';}catch(e){}window.print()">
            <span>🖨️ Print Now (${pageDims.pageWidthMm} × ${pageDims.pageHeightMm})</span>
          </button>
          <button class="btn-close" onclick="window.close()">
            <span>✕ Close</span>
          </button>
        </div>
      </div>
      <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-size: 11px; color: #94a3b8;">
        <span>Item: <b>${printingBarcodeProduct.name}</b> (${printingBarcodeProduct.sku || printingBarcodeProduct.barcode || 'No SKU'})</span>
        <span>•</span>
        <span class="popup-badge badge-roll" style="font-size: 10px; padding: 2px 6px;">${printLabelsPerRow}-Up Roll</span>
        <span>•</span>
        <span class="popup-badge badge-orient" style="font-size: 10px; padding: 2px 6px;">${orientationLabel}</span>
        <span>•</span>
        <span>Total: <b>${count} Labels</b> (${totalRows} Rows)</span>
      </div>
      <!-- Print Setup Guidance for Clean Label Feed & Removing Application Name -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 6px; margin-top: 4px;">
        <div style="background: #fef2f2; color: #991b1b; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 700; border: 1px solid #f87171; display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 14px;">🚫</span>
          <span><b>To Remove App Name & Fix 3mm Right Shift:</b> In Chrome Print Dialog ➔ Click <b>More settings</b> ➔ <b>UNCHECK "Headers and footers"</b> & set <b>Margins: "None"</b>. (Default margins shift print 3mm to the right).</span>
        </div>
        <div style="background: #eff6ff; color: #1e40af; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 700; border: 1px solid #60a5fa; display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 14px;">📐</span>
          <span><b>Horizontal Print Fix:</b> In Chrome Print Dialog ➔ Set <b>Layout to "LANDSCAPE"</b> for wide rolls (50×25mm) or <b>"PORTRAIT"</b> for tall rolls (60×100mm). This ensures stickers fit inside the box perfectly without any cut!</span>
        </div>
      </div>
    </div>
  </header>

  <!-- Printable Area Wrapped in .barcode-print-portal -->
  <div id="barcode-printable-area" class="barcode-print-portal">
    ${printableEl.innerHTML}
  </div>

  <script>
    window.addEventListener('load', function() {
      try {
        document.title = '\u200B';
        if (window.opener && window.opener.document) {
          window.opener.document.title = '\u200B';
        }
      } catch(e) {}
      setTimeout(function() {
        try {
          document.title = '\u200B';
          window.print();
        } catch(e) {
          console.warn('Auto-print error:', e);
        }
      }, 350);
    });
    window.addEventListener('afterprint', function() {
      try {
        if (window.opener && window.opener.document) {
          window.opener.document.title = 'Kokanastha Operation';
        }
      } catch(e) {}
    });
  </script>
</body>
</html>`;

      if (targetMode === 'popup' && popupWindow) {
        try {
          popupWindow.document.open();
          popupWindow.document.write(printHtml);
          popupWindow.document.close();
          popupWindow.focus();
          return;
        } catch (err) {
          console.warn('Popup write failed, falling back to iframe', err);
        }
      }

      // Default: print via isolated print iframe with non-zero geometry
      let printFrame = document.getElementById('barcode-print-hidden-frame') as HTMLIFrameElement;
      if (printFrame) {
        printFrame.remove();
      }
      printFrame = document.createElement('iframe');
      printFrame.id = 'barcode-print-hidden-frame';
      printFrame.style.position = 'fixed';
      printFrame.style.top = '-9999px';
      printFrame.style.left = '-9999px';
      printFrame.style.width = '350px';
      printFrame.style.height = '300px';
      printFrame.style.opacity = '0';
      printFrame.style.border = '0';
      printFrame.style.pointerEvents = 'none';
      document.body.appendChild(printFrame);

      const frameDoc = printFrame.contentWindow?.document || printFrame.contentDocument;
      if (frameDoc) {
        frameDoc.open();
        frameDoc.write(printHtml);
        frameDoc.close();
        setTimeout(() => {
          const origDocTitle = document.title;
          try {
            document.title = '\u200B';
            if (printFrame.contentWindow?.document) {
              printFrame.contentWindow.document.title = '\u200B';
            }
            printFrame.contentWindow?.focus();
            printFrame.contentWindow?.print();
          } catch (e) {
            console.warn('Iframe print failed, falling back to window.print', e);
            try { document.title = '\u200B'; } catch (err) {}
            window.print();
          } finally {
            setTimeout(() => {
              try { document.title = origDocTitle || 'Kokanastha Operation'; } catch (err) {}
            }, 2500);
          }
        }, 300);
      } else {
        const origDocTitle = document.title;
        try { document.title = '\u200B'; } catch (err) {}
        window.print();
        setTimeout(() => {
          try { document.title = origDocTitle || 'Kokanastha Operation'; } catch (err) {}
        }, 2500);
      }
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
        (selectedStockStatus === 'Out' && p.current_stock <= 0) ||
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
            title="Download Product List as Excel"
          >
            <FileDown size={14} className="text-amber-400" />
            <span>Export Excel</span>
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

          <button 
            type="button"
            onClick={() => {
              const prodToPrint = products[0];
              if (prodToPrint) {
                handleOpenBarcodeModal(prodToPrint);
              } else {
                triggerToast('Please add or select a product to print barcodes.', 'info');
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl text-[10px] sm:text-[11px] font-bold cursor-pointer shadow-md transition-all whitespace-nowrap shrink-0 border border-indigo-400/30 active:scale-95"
            title="Open Barcode Label & Thermal Print Station (Popup Console)"
          >
            <Printer size={14} />
            <span>🖨️ Barcode Print Station</span>
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
                const isNegative = prod.current_stock < 0;
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
                          <span className={`font-black text-[12px] ${isNegative ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-300 dark:border-rose-800' : isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {prod.current_stock}
                          </span>
                          <span className="text-[9px] text-slate-500 font-bold">{prod.unit}</span>
                        </div>
                        {isNegative ? (
                          <span className="text-[8px] font-black text-rose-500 uppercase tracking-wider">
                            Negative Stock
                          </span>
                        ) : isComboProduct(prod) ? (
                          <span className="text-[8px] font-bold text-purple-600 uppercase">
                            Packed Stock
                          </span>
                        ) : null}
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
                              onClick={() => setNutritionModalProduct(prod)}
                              className={`p-2 rounded-lg transition-colors border shadow-xs active:scale-95 ${
                                prod.nutrition_facts 
                                  ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800' 
                                  : 'text-slate-500 hover:text-emerald-600 bg-slate-50 hover:bg-emerald-50 border-slate-200'
                              }`}
                              title={prod.nutrition_facts ? "Edit Nutrition & Packaging Compliance (Configured)" : "Add Nutrition Facts & Food Compliance"}
                            >
                              <Salad size={15} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenBarcodeModal(prod)}
                              className="p-2 text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-lg transition-colors border border-slate-200 shadow-xs active:scale-95"
                              title="Print Barcode & Labels"
                            >
                              <Barcode size={15} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => setNutritionModalProduct(prod)}
                              className={`p-2 rounded-lg transition-colors border shadow-xs active:scale-95 ${
                                prod.nutrition_facts 
                                  ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800' 
                                  : 'text-slate-500 hover:text-emerald-600 bg-slate-50 hover:bg-emerald-50 border-slate-200'
                              }`}
                              title={prod.nutrition_facts ? "Edit Nutrition & Food Compliance (Configured)" : "Add Nutrition Facts & Packaging Compliance"}
                            >
                              <Salad size={15} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenBarcodeModal(prod)}
                              className="p-2 text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-lg transition-colors border border-slate-200 shadow-xs active:scale-95"
                              title="Print Barcode & Labels"
                            >
                              <Barcode size={15} />
                            </button>
                          </>
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

            <form onSubmit={handleSaveCombo} onKeyDown={(e) => { if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') e.preventDefault(); }} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
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

                {/* Dropdown Product Quick-Add Bar with Search Option */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                  <div className="flex-1 space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Select Available Product (Search Option Included) *</label>
                    <SearchableProductSelectForCombo
                      products={products}
                      value={selectedDropdownProdId}
                      onChange={(val) => setSelectedDropdownProdId(val)}
                      placeholder="-- Type name, SKU, or barcode to search product --"
                    />
                  </div>

                  <div className="w-full sm:w-24 space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Quantity *</label>
                    <input 
                      type="number"
                      min="1"
                      value={selectedDropdownQty}
                      onChange={(e) => setSelectedDropdownQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-2 py-2 bg-slate-50 dark:bg-slate-800 text-[11px] font-bold text-center rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-hidden text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div className="sm:self-end pt-1 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => {
                        if (!selectedDropdownProdId) {
                          triggerToast('Please search or select a product from the dropdown list', 'warning');
                          return;
                        }

                        const selProd = products.find(p => p.id === selectedDropdownProdId);
                        if (!selProd) {
                          triggerToast('Selected product not found', 'error');
                          return;
                        }

                        const existingIndex = comboItems.findIndex(ci => ci.product_id === selectedDropdownProdId);
                        const existingQty = existingIndex >= 0 ? comboItems[existingIndex].qty : 0;
                        const totalRequested = existingQty + selectedDropdownQty;

                        if (existingIndex >= 0) {
                          const updated = [...comboItems];
                          updated[existingIndex].qty = totalRequested;
                          setComboItems(updated);
                          if (selProd.current_stock <= 0) {
                            triggerToast(`Updated "${selProd.name}" quantity to ${totalRequested}. (Product is out of stock: negative stock allowed)`, 'info');
                          } else {
                            triggerToast(`Updated "${selProd.name}" quantity to ${totalRequested}`, 'info');
                          }
                        } else {
                          setComboItems([...comboItems, { product_id: selectedDropdownProdId, qty: selectedDropdownQty }]);
                          if (selProd.current_stock <= 0) {
                            triggerToast(`Added ${selectedDropdownQty} x "${selProd.name}" to combo bundle. (Out of stock: negative stock allowed)`, 'success');
                          } else {
                            triggerToast(`Added ${selectedDropdownQty} x "${selProd.name}" to combo bundle`, 'success');
                          }
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
                        const avail = products.filter(p => !isComboProduct(p) && !comboItems.some(ci => ci.product_id === p.id));
                        if (avail.length === 0) {
                          triggerToast('All available regular products have already been added to this combo.', 'warning');
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
                      No products added to combo yet. Select or search a product from the dropdown above and click "+ Add to Combo".
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

                              {/* Searchable dropdown to change component product */}
                              <div className="flex-1 min-w-0">
                                <SearchableProductSelectForCombo
                                  products={products}
                                  value={ci.product_id}
                                  onChange={(targetId) => {
                                    if (!targetId) return;
                                    const updated = [...comboItems];
                                    updated[idx].product_id = targetId;
                                    setComboItems(updated);
                                  }}
                                />
                              </div>
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
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          {/* Dynamic Print Styles for thermal sticker sizes & paper rolls */}
          <style>{`
            @media print {
              @page { 
                size: ${getPrintPageDimensions(printLabelSize, printLabelsPerRow, printOrientation, printerType).cssPageSize} !important; 
                margin: 0mm !important; 
              }

              /* Hide the main React application root completely so it takes 0 layout height and 0 extra blank pages! */
              #root, .no-print, [class*="no-print"] {
                display: none !important;
              }

              /* Hide all other direct children of body except the barcode portal */
              body > *:not(.barcode-print-portal) {
                display: none !important;
              }

              html, body { 
                margin: 0 !important; 
                padding: 0 !important; 
                background: #ffffff !important;
                color: #000000 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                width: ${getPrintPageDimensions(printLabelSize, printLabelsPerRow, printOrientation, printerType).pageWidthMm} !important;
                height: auto !important;
                overflow: visible !important;
              }

              .barcode-print-portal { 
                display: block !important; 
                position: static !important;
                width: ${getPrintPageDimensions(printLabelSize, printLabelsPerRow, printOrientation, printerType).pageWidthMm} !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                opacity: 1 !important;
                pointer-events: auto !important;
                visibility: visible !important;
                overflow: visible !important;
              }
              
              .barcode-print-portal * {
                visibility: visible !important;
              }

              .barcode-print-row { 
                display: flex !important; 
                flex-direction: row !important;
                justify-content: ${printLabelsPerRow === 2 && !getPrintPageDimensions(printLabelSize, printLabelsPerRow, printOrientation, printerType).isRotated ? 'space-between' : 'center'} !important;
                align-items: center !important;
                width: ${getPrintPageDimensions(printLabelSize, printLabelsPerRow, printOrientation, printerType).pageWidthMm} !important;
                height: ${getPrintPageDimensions(printLabelSize, printLabelsPerRow, printOrientation, printerType).pageHeightMm} !important;
                page-break-after: always !important;
                page-break-inside: avoid !important;
                break-after: page !important;
                break-inside: avoid !important;
                box-sizing: border-box !important;
                margin: 0 !important;
                padding: 0 !important;
                padding-left: ${printAlignmentTarget === 'all' && printHorizontalOffsetMm > 0 ? `${printHorizontalOffsetMm}mm` : '0'} !important;
                padding-right: ${printAlignmentTarget === 'all' && printHorizontalOffsetMm < 0 ? `${Math.abs(printHorizontalOffsetMm)}mm` : '0'} !important;
                overflow: visible !important;
              }

              .barcode-print-row:last-child {
                page-break-after: auto !important;
                break-after: auto !important;
              }
              
              .barcode-label-sticker {
                width: ${printLabelsPerRow === 2 && !getPrintPageDimensions(printLabelSize, printLabelsPerRow, printOrientation, printerType).isRotated 
                  ? `calc(${getPrintPageDimensions(printLabelSize, printLabelsPerRow, printOrientation, printerType).baseDims.stickerWidthMm} - ${printAlignmentTarget === 'all' && printHorizontalOffsetMm !== 0 ? Math.abs(printHorizontalOffsetMm) + 1.2 : 1}mm)` 
                  : `calc(${getPrintPageDimensions(printLabelSize, printLabelsPerRow, printOrientation, printerType).pageWidthMm} - ${printAlignmentTarget === 'all' && printHorizontalOffsetMm !== 0 ? Math.abs(printHorizontalOffsetMm) + 1.2 : 1}mm)`} !important;
                height: calc(${getPrintPageDimensions(printLabelSize, printLabelsPerRow, printOrientation, printerType).pageHeightMm} - 1.2mm) !important;
                max-width: ${printLabelsPerRow === 2 && !getPrintPageDimensions(printLabelSize, printLabelsPerRow, printOrientation, printerType).isRotated 
                  ? `calc(${getPrintPageDimensions(printLabelSize, printLabelsPerRow, printOrientation, printerType).baseDims.stickerWidthMm} - ${printAlignmentTarget === 'all' && printHorizontalOffsetMm !== 0 ? Math.abs(printHorizontalOffsetMm) + 1.2 : 1}mm)` 
                  : `calc(${getPrintPageDimensions(printLabelSize, printLabelsPerRow, printOrientation, printerType).pageWidthMm} - ${printAlignmentTarget === 'all' && printHorizontalOffsetMm !== 0 ? Math.abs(printHorizontalOffsetMm) + 1.2 : 1}mm)`} !important;
                max-height: calc(${getPrintPageDimensions(printLabelSize, printLabelsPerRow, printOrientation, printerType).pageHeightMm} - 1.2mm) !important;
                margin: 0.6mm auto !important;
                padding: 0 !important;
                border: none !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: flex-start !important;
                align-items: center !important;
                text-align: center !important;
                overflow: visible !important;
                background: #ffffff !important;
                color: #000000 !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                box-sizing: border-box !important;
                ${getPrintPageDimensions(printLabelSize, printLabelsPerRow, printOrientation, printerType).isRotated ? `
                  width: calc(${getPrintPageDimensions(printLabelSize, printLabelsPerRow, printOrientation, printerType).baseDims.stickerHeightMm} - 1.2mm) !important;
                  height: calc(${getPrintPageDimensions(printLabelSize, printLabelsPerRow, printOrientation, printerType).baseDims.stickerWidthMm} - 1mm) !important;
                  max-width: calc(${getPrintPageDimensions(printLabelSize, printLabelsPerRow, printOrientation, printerType).baseDims.stickerHeightMm} - 1.2mm) !important;
                  max-height: calc(${getPrintPageDimensions(printLabelSize, printLabelsPerRow, printOrientation, printerType).baseDims.stickerWidthMm} - 1mm) !important;
                  transform: rotate(${getPrintPageDimensions(printLabelSize, printLabelsPerRow, printOrientation, printerType).rotationDeg}deg) !important;
                  transform-origin: center !important;
                ` : ''}
              }
              .barcode-label-sticker > div {
                justify-content: flex-start !important;
              }
              .barcode-label-sticker > div.sticker-60x100,
              .barcode-label-sticker > div[data-size="60x100"],
              .barcode-label-sticker > div.sticker-50x25,
              .barcode-label-sticker > div[data-size="50x25"] {
                justify-content: space-between !important;
                height: 100% !important;
                box-sizing: border-box !important;
              }
              .justify-start {
                justify-content: flex-start !important;
              }
              
              .barcode-label-sticker * {
                color: #000000 !important;
              }
              .bg-black, .bg-black *, .text-white {
                color: #ffffff !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }

              /* Barcode crisp rendering */
              .barcode-label-sticker img,
              .barcode-label-sticker svg {
                visibility: visible !important;
                display: block !important;
                margin: 0 auto !important;
                max-width: 100% !important;
                background-color: #ffffff !important;
                image-rendering: -webkit-optimize-contrast !important;
                image-rendering: crisp-edges !important;
                image-rendering: pixelated !important;
                shape-rendering: crispEdges !important;
              }

              .barcode-label-sticker svg text {
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
                font-weight: 700 !important;
              }

              .barcode-inner-box {
                background-color: #ffffff !important;
                box-sizing: border-box !important;
              }

              .text-\\[2px\\] { font-size: 2px !important; line-height: 1 !important; }
              .text-\\[2\\.5px\\] { font-size: 2.5px !important; line-height: 1 !important; }
              .text-\\[2\\.8px\\] { font-size: 2.8px !important; line-height: 1 !important; }
              .text-\\[3px\\] { font-size: 3px !important; line-height: 1 !important; }
              .text-\\[3\\.5px\\] { font-size: 3.5px !important; line-height: 1.05 !important; }
              .text-\\[4px\\] { font-size: 4px !important; line-height: 1.05 !important; }
              .text-\\[4\\.5px\\] { font-size: 4.5px !important; line-height: 1.1 !important; }
              .text-\\[5px\\] { font-size: 5px !important; line-height: 1.1 !important; }
              .text-\\[5\\.5px\\] { font-size: 5.5px !important; line-height: 1.1 !important; }
              .text-\\[6px\\] { font-size: 6px !important; line-height: 1.1 !important; }
              .text-\\[6\\.5px\\] { font-size: 6.5px !important; line-height: 1.1 !important; }
              .text-\\[7px\\] { font-size: 7px !important; line-height: 1.1 !important; }
              .text-\\[7\\.5px\\] { font-size: 7.5px !important; line-height: 1.1 !important; }
              .text-\\[8px\\] { font-size: 8px !important; line-height: 1.15 !important; }
              .text-\\[8\\.5px\\] { font-size: 8.5px !important; line-height: 1.15 !important; }
              .text-\\[9px\\] { font-size: 9px !important; line-height: 1.2 !important; }
              .text-\\[10px\\] { font-size: 10px !important; line-height: 1.2 !important; }
              .text-\\[11px\\] { font-size: 11px !important; line-height: 1.2 !important; }
              .text-\\[12px\\] { font-size: 12px !important; line-height: 1.2 !important; }
              .bg-black { background-color: #000000 !important; color: #ffffff !important; }
              .text-white { color: #ffffff !important; }
              .max-w-\\[125px\\] { max-width: 125px !important; }
              .max-w-\\[130px\\] { max-width: 130px !important; }
              .w-1\\.5 { width: 6px !important; }
              .h-1\\.5 { height: 6px !important; }
              .w-2 { width: 8px !important; }
              .h-2 { height: 8px !important; }
              .w-2\\.5 { width: 10px !important; }
              .h-2\\.5 { height: 10px !important; }
              .w-3 { width: 12px !important; }
              .h-3 { height: 12px !important; }
              .w-3\\.5 { width: 14px !important; }
              .h-3\\.5 { height: 14px !important; }
              .rounded-full { border-radius: 9999px !important; }
              .rounded-xs { border-radius: 2px !important; }
              .whitespace-nowrap { white-space: nowrap !important; }
            }
          `}</style>

          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-5xl lg:max-w-6xl overflow-hidden shadow-2xl animate-in zoom-in duration-150 my-auto border border-slate-200 dark:border-slate-800 flex flex-col max-h-[94vh]">
            <div className="bg-slate-950 text-white px-5 py-3 flex items-center justify-between shrink-0 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                  <Printer size={16} />
                </div>
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                    <span>Barcode Label & Thermal Print Station</span>
                    <span className="text-[9px] bg-indigo-600/40 text-indigo-300 px-1.5 py-0.5 rounded font-mono">Popup Console</span>
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-slate-400">Select Item:</span>
                    <select
                      value={printingBarcodeProduct.id}
                      onChange={(e) => {
                        const sel = products.find(p => p.id === e.target.value);
                        if (sel) handleOpenBarcodeModal(sel);
                      }}
                      className="bg-slate-900 text-indigo-200 border border-indigo-500/40 rounded px-1.5 py-0.5 text-[10px] font-bold outline-hidden cursor-pointer max-w-[200px] truncate"
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku || p.barcode || 'No SKU'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handlePrintBarcodeSubmit('popup')}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                  title="Open Print Window in Dedicated Popup"
                >
                  <ExternalLink size={12} />
                  <span>Popup Window</span>
                </button>
                <button 
                  onClick={() => setPrintingBarcodeProduct(null)} 
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Close Station"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Media Format Selector: Thermal Sticker Roll vs A4 Grid */}
              <div className="no-print space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Printer Format</span>
                  <span className="text-[9px] font-normal text-indigo-600 dark:text-indigo-400">Direct Roll Sizing</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPrinterType('thermal');
                      setPrintLabelsPerRow(2);
                    }}
                    className={`py-2 px-3 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      printerType === 'thermal'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Printer size={14} />
                    <span>🖨️ Thermal Sticker Roll</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrinterType('a4')}
                    className={`py-2 px-3 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      printerType === 'a4'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <FileSpreadsheet size={14} />
                    <span>📄 Standard A4 Sheet</span>
                  </button>
                </div>
              </div>

              {/* Thermal Settings: Size & Columns per Row */}
              {printerType === 'thermal' && (
                <div className="no-print space-y-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  {/* Roll Label Size */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                        Thermal Label Size
                      </label>
                      <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                        {LABEL_SIZE_INFO[printLabelSize] ? `${LABEL_SIZE_INFO[printLabelSize].label} (${LABEL_SIZE_INFO[printLabelSize].desc})` : printLabelSize}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {[
                        { id: '50x25', label: '50 × 25 mm', desc: 'Standard 2"x1"' },
                        { id: '38x25', label: '38 × 25 mm', desc: '1.5"x1" Compact' },
                        { id: '40x25', label: '40 × 25 mm', desc: '40x25 mm' },
                        { id: '50x30', label: '50 × 30 mm', desc: '2"x1.2"' },
                        { id: '50x38', label: '50 × 38 mm', desc: '2"x1.5" Large' },
                        { id: '50x50', label: '50 × 50 mm', desc: '2"x2" Food/Nutri' },
                        { id: '50x75', label: '50 × 75 mm', desc: '2"x3" Food Master' },
                        { id: '60x100', label: '60 × 100 mm', desc: '2.4"x4" Tall Master' },
                        { id: '100x60', label: '100 × 60 mm', desc: '4"x2.4" Horizontal Master' },
                        { id: '100x50', label: '100 × 50 mm', desc: '4"x2" Box/Pack' },
                        { id: '100x75', label: '100 × 75 mm', desc: '4"x3" Kokanastha Nutri' },
                        { id: '100x100', label: '100 × 100 mm', desc: '4"x4" Big Box' }
                      ].map(sz => (
                        <button
                          key={sz.id}
                          type="button"
                          onClick={() => {
                            setPrintLabelSize(sz.id as any);
                            if (sz.id === '60x100') {
                              setPrintLabelsPerRow(1);
                              setPrintOrientation('portrait');
                              setPrintIncludeNutrition(true);
                              setPrintAlignmentTarget('all');
                            } else if (['50x50', '50x75', '100x60', '100x50', '100x75', '100x100'].includes(sz.id)) {
                              setPrintIncludeNutrition(true);
                              setPrintLabelsPerRow(1);
                            } else if (sz.id === '50x25') {
                              setPrintLabelsPerRow(2);
                              setPrintOrientation('landscape');
                              setPrintAlignmentTarget('all');
                            }
                          }}
                          className={`py-1.5 px-2 rounded-lg text-left transition-all cursor-pointer flex flex-col ${
                            printLabelSize === sz.id
                              ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-500/30'
                              : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'
                          }`}
                        >
                          <span className="text-[10.5px] font-bold leading-tight truncate">{sz.label}</span>
                          <span className={`text-[8.5px] truncate ${printLabelSize === sz.id ? 'text-indigo-100' : 'text-slate-400'}`}>{sz.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Columns Per Row */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                        Thermal Roll Columns (Labels Across / Row)
                      </label>
                      <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400">
                        {printLabelsPerRow === 1 ? '50mm Width (1-Up Single Roll)' : '104mm Width (2-Up Dual Roll)'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPrintLabelsPerRow(1)}
                        className={`py-2 px-3 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                          printLabelsPerRow === 1
                            ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-500/30'
                            : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span className="flex items-center gap-1.5 font-black">☝️ 1-Up Roll (Single)</span>
                        <span className={`text-[8.5px] ${printLabelsPerRow === 1 ? 'text-indigo-200' : 'text-slate-400'}`}>1 Across • 50mm Roll Width</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrintLabelsPerRow(2)}
                        className={`py-2 px-3 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                          printLabelsPerRow === 2
                            ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-500/30'
                            : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span className="flex items-center gap-1.5 font-black">✌️ 2-Up Roll (Dual)</span>
                        <span className={`text-[8.5px] ${printLabelsPerRow === 2 ? 'text-indigo-200' : 'text-slate-400'}`}>2 Across • 104mm Roll Width</span>
                      </button>
                    </div>
                  </div>

                  {/* Orientation Mode */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                        <span>Page Orientation & Feed Direction</span>
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold px-1.5 py-0.2 rounded-full">
                          Horizontal Fix Active
                        </span>
                      </label>
                      <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">
                        {printOrientation === 'thermal-portrait-fix' || printOrientation === 'rotated90' ? 'Horizontal (90° Thermal Fix - Recommended)' :
                         printOrientation === 'thermal-270-fix' ? 'Horizontal (270° Reverse Fix)' :
                         printOrientation === 'landscape' ? 'Standard Wide (0° Feed)' :
                         printOrientation === 'portrait' ? 'Vertical (Tall Roll Feed)' :
                         'Auto (Exact Dimensions)'}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPrintOrientation('landscape')}
                        className={`py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                          printOrientation === 'landscape'
                            ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-500/30'
                            : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-[10px] font-black">➡ Horizontal</span>
                        <span className={`text-[8px] ${printOrientation === 'landscape' ? 'text-emerald-100' : 'text-slate-400'}`}>Recommended</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrintOrientation('thermal-portrait-fix')}
                        className={`py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                          printOrientation === 'thermal-portrait-fix' || printOrientation === 'rotated90'
                            ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-500/30'
                            : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-[10px] font-bold">🌟 90° Fix</span>
                        <span className={`text-[8px] ${printOrientation === 'thermal-portrait-fix' || printOrientation === 'rotated90' ? 'text-amber-100' : 'text-slate-400'}`}>Vertical Page</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrintOrientation('thermal-270-fix')}
                        className={`py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                          printOrientation === 'thermal-270-fix'
                            ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-500/30'
                            : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-[10px] font-bold">🔄 270° Fix</span>
                        <span className={`text-[8px] ${printOrientation === 'thermal-270-fix' ? 'text-amber-100' : 'text-slate-400'}`}>Reverse</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrintOrientation('portrait')}
                        className={`py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                          printOrientation === 'portrait'
                            ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-500/30'
                            : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-[10px] font-bold">⬇ Vertical</span>
                        <span className={`text-[8px] ${printOrientation === 'portrait' ? 'text-indigo-100' : 'text-slate-400'}`}>Tall Feed</span>
                      </button>
                    </div>
                  </div>

                  {/* Horizontal Alignment Calibration (Fix Chrome 3mm Shift / Printer Margins) */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                        <span>📐 Horizontal Print Alignment (Left / Right Offset)</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                          printHorizontalOffsetMm === 0 
                            ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200' 
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        }`}>
                          {printHorizontalOffsetMm === 0 ? 'Centered (0mm)' : printHorizontalOffsetMm > 0 ? `+${printHorizontalOffsetMm}mm Right` : `${printHorizontalOffsetMm}mm Left`}
                        </span>
                      </label>
                      <span className="text-[9px] text-slate-500 font-mono">Compensates Chrome margins</span>
                    </div>

                    {/* Alignment Target: Barcode Only (Safe - Never cuts outer border) vs Entire Label */}
                    <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700">
                      <span className="text-[9.5px] font-bold text-slate-600 dark:text-slate-300 pl-1 shrink-0">Shift Target:</span>
                      <button
                        type="button"
                        onClick={() => setPrintAlignmentTarget('barcode')}
                        className={`flex-1 py-1 px-2 rounded-md text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                          printAlignmentTarget === 'barcode'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                        title="Recommended: Safely shifts barcode lines and number without cutting the outer label border"
                      >
                        <span>🎯 Barcode Only</span>
                        <span className="text-[8px] opacity-80">(Safe • No Border Cut)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrintAlignmentTarget('all')}
                        className={`flex-1 py-1 px-2 rounded-md text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                          printAlignmentTarget === 'all'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                        title="Shifts entire sticker row"
                      >
                        <span>📦 Entire Label Box</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPrintHorizontalOffsetMm(-3)}
                        className={`py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                          printHorizontalOffsetMm === -3
                            ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-500/30'
                            : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-[10px] font-black">⬅ -3 mm Left</span>
                        <span className={`text-[8px] ${printHorizontalOffsetMm === -3 ? 'text-blue-100' : 'text-slate-400'}`}>Fix Chrome Shift</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrintHorizontalOffsetMm(0)}
                        className={`py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                          printHorizontalOffsetMm === 0
                            ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-500/30'
                            : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-[10px] font-black">🎯 0 mm Center</span>
                        <span className={`text-[8px] ${printHorizontalOffsetMm === 0 ? 'text-blue-100' : 'text-slate-400'}`}>Default Center</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrintHorizontalOffsetMm(3)}
                        className={`py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                          printHorizontalOffsetMm === 3
                            ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-500/30'
                            : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-[10px] font-black">➡ +3 mm Right</span>
                        <span className={`text-[8px] ${printHorizontalOffsetMm === 3 ? 'text-blue-100' : 'text-slate-400'}`}>Shift Right</span>
                      </button>
                      <div className="flex items-center justify-center gap-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-2">
                        <button 
                          type="button"
                          onClick={() => setPrintHorizontalOffsetMm(prev => Math.max(-10, prev - 1))}
                          className="text-[12px] font-black px-1.5 py-1 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 rounded cursor-pointer"
                          title="Decrease 1mm"
                        >
                          -
                        </button>
                        <span className="text-[10px] font-mono font-bold text-slate-800 dark:text-slate-100 min-w-[28px] text-center">
                          {printHorizontalOffsetMm > 0 ? `+${printHorizontalOffsetMm}` : printHorizontalOffsetMm}mm
                        </span>
                        <button 
                          type="button"
                          onClick={() => setPrintHorizontalOffsetMm(prev => Math.min(10, prev + 1))}
                          className="text-[12px] font-black px-1.5 py-1 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 rounded cursor-pointer"
                          title="Increase 1mm"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Box & Border Framing Controls ("Barcode in the Box") */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                        <span>📦 Label Box & Framing Style</span>
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold px-1.5 py-0.2 rounded-full">
                          Professional Print
                        </span>
                      </label>
                      <span className="text-[9px] text-slate-500 font-mono">100% Crisp Thermal Alignment</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <label className={`p-2 rounded-lg border flex items-center gap-2 cursor-pointer transition-all ${
                        printBoxBorder ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700' : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600'
                      }`}>
                        <input 
                          type="checkbox"
                          checked={printBoxBorder}
                          onChange={(e) => setPrintBoxBorder(e.target.checked)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                        />
                        <div className="flex flex-col">
                          <span className="text-[10.5px] font-bold text-slate-900 dark:text-slate-100">📦 Label Outer Box Border</span>
                          <span className="text-[8.5px] text-slate-500 dark:text-slate-400">Crisp solid black boundary outline around sticker</span>
                        </div>
                      </label>
                      <label className={`p-2 rounded-lg border flex items-center gap-2 cursor-pointer transition-all ${
                        printBarcodeFrame ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700' : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600'
                      }`}>
                        <input 
                          type="checkbox"
                          checked={printBarcodeFrame}
                          onChange={(e) => setPrintBarcodeFrame(e.target.checked)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                        />
                        <div className="flex flex-col">
                          <span className="text-[10.5px] font-bold text-slate-900 dark:text-slate-100">🔲 Barcode in the Box</span>
                          <span className="text-[8.5px] text-slate-500 dark:text-slate-400">Enclose barcode in dedicated framed box</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Exact Print Calculation Banner */}
                  <div className="bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-lg p-2.5 text-[11px] text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
                    <Info size={15} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <div className="text-[10.5px] leading-tight">
                      Printing <b>{printLabelCount} label(s)</b> across <b>{Math.ceil(printLabelCount / printLabelsPerRow)} row(s)</b> on <b>{printLabelsPerRow}-Up roll ({getPrintPageDimensions(printLabelSize, printLabelsPerRow, printOrientation, printerType).pageWidthMm} × {getPrintPageDimensions(printLabelSize, printLabelsPerRow, printOrientation, printerType).pageHeightMm})</b> • Custom thermal roll (Not A4).
                    </div>
                  </div>
                </div>
              )}

              {/* Nutrition & Food Compliance Settings (Kokanastha Style) */}
              <div className="no-print bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-600 text-white rounded-lg">
                      <Salad size={15} />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                        <span>Nutrition & Food Packaging Information</span>
                        {printingBarcodeProduct.nutrition_facts ? (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 font-bold px-1.5 py-0.2 rounded-full">
                            Configured
                          </span>
                        ) : (
                          <span className="text-[9px] bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 font-bold px-1.5 py-0.2 rounded-full">
                            Not Set
                          </span>
                        )}
                      </div>
                      <div className="text-[9.5px] text-emerald-700 dark:text-emerald-400">
                        Print FSSAI Lic, Veg icon, Net Wt, and Nutrition table (Calories, Protein, Fat, Carbs) with Kokanastha Standard.
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setNutritionModalProduct(printingBarcodeProduct)}
                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10.5px] font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs shrink-0"
                  >
                    <Salad size={13} />
                    <span>{printingBarcodeProduct.nutrition_facts ? 'Edit Nutrition Data' : 'Add Nutrition Data'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-emerald-200/60 dark:border-emerald-800/40">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={printIncludeNutrition}
                      onChange={(e) => setPrintIncludeNutrition(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                    />
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                      Include Nutrition Facts on Printed Label / Sticker
                    </span>
                  </label>

                  {printIncludeNutrition && (
                    <span className="text-[9px] font-mono text-emerald-700 dark:text-emerald-300 font-bold">
                      Best on 50×50, 50×75, 100×75, 100×100 or A4 Sheet
                    </span>
                  )}
                </div>

                {/* Quick preview pills if configured */}
                {printingBarcodeProduct.nutrition_facts && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5 text-[9px] text-emerald-900 dark:text-emerald-200">
                    <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 font-mono">
                      <b>Serving:</b> {printingBarcodeProduct.nutrition_facts.serving_size || '100g'}
                    </span>
                    <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 font-mono">
                      <b>Energy:</b> {printingBarcodeProduct.nutrition_facts.energy_kcal ?? '-'} kcal
                    </span>
                    <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 font-mono">
                      <b>Protein:</b> {printingBarcodeProduct.nutrition_facts.protein_g ?? '-'}g
                    </span>
                    <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 font-mono">
                      <b>Carbs:</b> {printingBarcodeProduct.nutrition_facts.carbohydrates_g ?? '-'}g
                    </span>
                    <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 font-mono">
                      <b>Fat:</b> {printingBarcodeProduct.nutrition_facts.fat_total_g ?? '-'}g
                    </span>
                    {printingBarcodeProduct.food_packaging?.fssai_license_number && (
                      <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 font-mono">
                        <b>FSSAI:</b> {printingBarcodeProduct.food_packaging.fssai_license_number}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* LIVE STICKER PREVIEW */}
              <div className="flex flex-col items-center justify-center no-print bg-slate-100 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex flex-wrap items-center justify-between w-full mb-2.5 px-1 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      {printerType === 'thermal' ? `Live Preview: ${printLabelsPerRow}-Up Row` : 'Live A4 Grid Preview'}
                    </span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider transition-all flex items-center gap-1 shadow-xs ${
                      printOrientation === 'auto' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800' :
                      printOrientation === 'landscape' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800' :
                      printOrientation === 'portrait' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' :
                      'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-400 dark:border-amber-700 ring-2 ring-amber-400/40'
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                      <span>
                        {printOrientation === 'auto' ? 'Auto (TSC Default)' :
                         printOrientation === 'landscape' ? 'Landscape (Forced Wide)' :
                         printOrientation === 'portrait' ? 'Portrait (Forced Tall)' :
                         '🔄 Swap W/H (Sideways Fix)'}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600 font-bold">
                      {(() => {
                        const pageDims = getPrintPageDimensions(printLabelSize, printLabelsPerRow, printOrientation, printerType);
                        return `${pageDims.pageWidthMm} × ${pageDims.pageHeightMm} (${printLabelsPerRow}-Up Roll • Not A4)`;
                      })()}
                    </span>
                  </div>
                </div>
                
                {/* 2-Up Dual Sticker Row Preview */}
                {printerType === 'thermal' && printLabelsPerRow === 2 ? (
                  <div 
                    className="flex items-center gap-2 p-3 bg-slate-200 dark:bg-slate-900/60 rounded-xl border border-slate-300 dark:border-slate-700 overflow-x-auto max-w-full justify-center transition-transform duration-150"
                    style={printAlignmentTarget === 'all' && printHorizontalOffsetMm !== 0 ? { transform: `translateX(${printHorizontalOffsetMm * 3.78}px)` } : undefined}
                  >
                    <ThermalBarcodeSticker
                      product={printingBarcodeProduct}
                      size={printLabelSize}
                      companyName={printIncludeCompanyName ? printCompanyName : ''}
                      showCompanyName={printIncludeCompanyName}
                      mrp={printMrp}
                      salePrice={printSalePrice}
                      packedOn={printPackedOn}
                      expiryOn={printExpiryOn}
                      fssaiNumber={printFssaiNumber}
                      phone={printPhone}
                      address={printAddress}
                      otherInfo={printOtherInfo}
                      ingredients={printIngredients}
                      orientation={printOrientation}
                      mode="preview"
                      boxBorder={printBoxBorder}
                      barcodeFrame={printBarcodeFrame}
                      barcodeOffsetMm={printAlignmentTarget === 'barcode' ? printHorizontalOffsetMm : 0}
                    />
                    <div className="text-[9px] text-slate-500 font-bold px-0.5">2-Up</div>
                    <ThermalBarcodeSticker
                      product={printingBarcodeProduct}
                      size={printLabelSize}
                      companyName={printIncludeCompanyName ? printCompanyName : ''}
                      showCompanyName={printIncludeCompanyName}
                      mrp={printMrp}
                      salePrice={printSalePrice}
                      packedOn={printPackedOn}
                      expiryOn={printExpiryOn}
                      fssaiNumber={printFssaiNumber}
                      phone={printPhone}
                      address={printAddress}
                      otherInfo={printOtherInfo}
                      ingredients={printIngredients}
                      orientation={printOrientation}
                      mode="preview"
                      boxBorder={printBoxBorder}
                      barcodeFrame={printBarcodeFrame}
                      barcodeOffsetMm={printAlignmentTarget === 'barcode' ? printHorizontalOffsetMm : 0}
                    />
                  </div>
                ) : (
                  <div 
                    className="p-3 bg-slate-200 dark:bg-slate-900/60 rounded-xl border border-slate-300 dark:border-slate-700 flex justify-center items-center overflow-x-auto max-w-full transition-transform duration-150"
                    style={printAlignmentTarget === 'all' && printHorizontalOffsetMm !== 0 ? { transform: `translateX(${printHorizontalOffsetMm * 3.78}px)` } : undefined}
                  >
                    <ThermalBarcodeSticker
                      product={printingBarcodeProduct}
                      size={printLabelSize}
                      companyName={printIncludeCompanyName ? printCompanyName : ''}
                      showCompanyName={printIncludeCompanyName}
                      mrp={printMrp}
                      salePrice={printSalePrice}
                      packedOn={printPackedOn}
                      expiryOn={printExpiryOn}
                      fssaiNumber={printFssaiNumber}
                      phone={printPhone}
                      address={printAddress}
                      otherInfo={printOtherInfo}
                      ingredients={printIngredients}
                      orientation={printOrientation}
                      mode="preview"
                      boxBorder={printBoxBorder}
                      barcodeFrame={printBarcodeFrame}
                      barcodeOffsetMm={printAlignmentTarget === 'barcode' ? printHorizontalOffsetMm : 0}
                    />
                  </div>
                )}

                {/* Real-time Orientation Status & Quick-select bar */}
                <div className="w-full mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between text-[10px] text-slate-600 dark:text-slate-400 px-1 gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Feed Output:</span>
                    <span className="font-mono text-slate-900 dark:text-slate-100 font-bold">
                      {printOrientation === 'portrait' && '⬇ Portrait Roll Feed (Recommended - Stops Chrome Auto-Landscape)'}
                      {printOrientation === 'auto' && '📐 Exact Size Feed (104mm × 25mm)'}
                      {printOrientation === 'landscape' && '➡ Wide Landscape Feed'}
                      {printOrientation === 'rotated90' && '🔄 90° Rotated Feed (Sideways Fix)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[9px]">
                    <span className="text-slate-400 font-bold uppercase tracking-wider">Orientation:</span>
                    {(['portrait', 'auto', 'rotated90', 'landscape'] as const).map(mode => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setPrintOrientation(mode)}
                        className={`px-2 py-0.5 rounded cursor-pointer transition-all font-bold ${
                          printOrientation === mode
                            ? mode === 'portrait'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : mode === 'rotated90'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600'
                        }`}
                      >
                        {mode === 'portrait' ? 'Portrait (Roll)' : mode === 'auto' ? 'Auto (104×25)' : mode === 'rotated90' ? 'Rotate 90°' : 'Landscape'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Editable Label Metadata Inputs */}
              <div className="grid grid-cols-2 gap-3 no-print">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">MRP (₹)</label>
                  <input 
                    type="number"
                    value={printMrp}
                    onChange={(e) => setPrintMrp(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Sale Price (₹)</label>
                  <input 
                    type="number"
                    value={printSalePrice}
                    onChange={(e) => setPrintSalePrice(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Packed On</label>
                  <input 
                    type="date"
                    value={printPackedOn}
                    onChange={(e) => setPrintPackedOn(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Expiry On</label>
                  <input 
                    type="date"
                    value={printExpiryOn}
                    onChange={(e) => setPrintExpiryOn(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Brand / Company Name</label>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={printIncludeCompanyName}
                        onChange={(e) => setPrintIncludeCompanyName(e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                      />
                      <span className="text-[9.5px] font-bold text-indigo-600 dark:text-indigo-400">
                        Print on Label
                      </span>
                    </label>
                  </div>
                  <input 
                    type="text"
                    disabled={!printIncludeCompanyName}
                    value={printCompanyName}
                    onChange={(e) => setPrintCompanyName(e.target.value)}
                    placeholder="Unchecked = No company name printed"
                    className={`w-full px-3 py-1.5 text-[11px] font-bold rounded-lg border transition-all ${
                      printIncludeCompanyName 
                        ? 'bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700' 
                        : 'bg-slate-100 dark:bg-slate-800/40 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-60'
                    }`}
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Phone / Helpline</label>
                    <button
                      type="button"
                      onClick={() => {
                        saveBarcodeDefaults({ phone: printPhone });
                        triggerToast('Phone / Helpline saved as default.', 'success');
                      }}
                      className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                      title="Save this phone number as default for all barcode stickers"
                    >
                      Save as Default
                    </button>
                  </div>
                  <input 
                    type="text"
                    value={printPhone}
                    onChange={(e) => setPrintPhone(e.target.value)}
                    placeholder="e.g. +91 9876543210 / 022-28901234"
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-[11px] font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">FSSAI License No.</label>
                    <button
                      type="button"
                      onClick={() => {
                        saveBarcodeDefaults({ fssai: printFssaiNumber });
                        triggerToast('FSSAI Number saved as business default.', 'success');
                      }}
                      className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                      title="Save this FSSAI number as the default for the business"
                    >
                      Save as Default
                    </button>
                  </div>
                  <input 
                    type="text"
                    value={printFssaiNumber}
                    onChange={(e) => setPrintFssaiNumber(e.target.value)}
                    placeholder="e.g. 11521018000123"
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-[11px] font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Barcode Address / Facility</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (!printingBarcodeProduct) return;
                          const updated = {
                            ...printingBarcodeProduct,
                            food_packaging: {
                              ...printingBarcodeProduct.food_packaging,
                              mfg_by: printAddress
                            }
                          };
                          dbStore.updateProduct(printingBarcodeProduct.id, updated);
                          triggerToast('Address saved to this product.', 'success');
                        }}
                        className="text-[9px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                        title="Save this address only for this specific product"
                      >
                        Save to Product
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          saveBarcodeDefaults({ address: printAddress });
                          triggerToast('Barcode address saved as default.', 'success');
                        }}
                        className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer border-l border-slate-200 dark:border-slate-700 pl-2"
                        title="Save this address as the default for all future stickers"
                      >
                        Save as Default
                      </button>
                    </div>
                  </div>
                  <input 
                    type="text"
                    value={printAddress}
                    onChange={(e) => setPrintAddress(e.target.value)}
                    placeholder="e.g. Shop 14, Station Road, Borivali West, Mumbai, MH 400092"
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Other Info / Notes (Under Phone & Address in 60*100)</label>
                    <button
                      type="button"
                      onClick={() => {
                        saveBarcodeDefaults({ other_info: printOtherInfo });
                        triggerToast('Other info saved as default.', 'success');
                      }}
                      className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                      title="Save this info as default so it always appears under phone and address in 60*100"
                    >
                      Save as Default
                    </button>
                  </div>
                  <input 
                    type="text"
                    value={printOtherInfo}
                    onChange={(e) => setPrintOtherInfo(e.target.value)}
                    placeholder="e.g. Email: care@kokanastha.com • Web: www.kokanastha.com • Support 10am-6pm"
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Ingredients List</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (!printingBarcodeProduct) return;
                          const updated = {
                            ...printingBarcodeProduct,
                            food_packaging: {
                              ...printingBarcodeProduct.food_packaging,
                              ingredients: printIngredients
                            }
                          };
                          dbStore.updateProduct(printingBarcodeProduct.id, updated);
                          triggerToast('Ingredients saved to this product.', 'success');
                        }}
                        className="text-[9px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                      >
                        Save to Product
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          saveBarcodeDefaults({ ingredients: printIngredients });
                          triggerToast('Ingredients saved as default.', 'success');
                        }}
                        className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer border-l border-slate-200 dark:border-slate-700 pl-2"
                      >
                        Save as Default
                      </button>
                    </div>
                  </div>
                  <input 
                    type="text"
                    value={printIngredients}
                    onChange={(e) => setPrintIngredients(e.target.value)}
                    placeholder="e.g. Roasted Rice Flour, Bengal Gram, Spices, Edible Oil, Salt"
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                  />
                </div>
                {/* Permanent Save Action Bar */}
                <div className="col-span-2 p-3 bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-300 dark:border-emerald-700/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 text-xs font-black text-emerald-900 dark:text-emerald-100">
                      <span>💾 Save Barcode Address & Info as Default</span>
                      <span className="text-[9px] bg-emerald-200 dark:bg-emerald-800 text-emerald-950 dark:text-emerald-100 px-2 py-0.5 rounded-full font-extrabold uppercase">Always Show</span>
                    </div>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium leading-relaxed">
                      Saves your phone number, barcode address, other info, and FSSAI so they will <b>always show in 60*100 and barcode stickers</b> until you change them.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveAllBarcodeDefaults}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-extrabold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <span>Save All Barcode Info</span>
                  </button>
                </div>
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Labels to Print</label>
                    <button
                      type="button"
                      onClick={() => setPrintLabelCount(Math.max(1, printingBarcodeProduct.current_stock || 1))}
                      className="text-[9px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                    >
                      Stock: {printingBarcodeProduct.current_stock || 0}
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input 
                      type="number"
                      min="1"
                      max="1000"
                      value={printLabelCount}
                      onChange={(e) => setPrintLabelCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Quantity Quick-Select Presets */}
              <div className="no-print space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Quick Quantity Presets</label>
                <div className="flex flex-wrap gap-1.5">
                  {[1, 2, 5, 10, 20, 50, 100].map(qty => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => setPrintLabelCount(qty)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                        printLabelCount === qty
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {qty} pcs
                    </button>
                  ))}
                  {printingBarcodeProduct.current_stock && printingBarcodeProduct.current_stock > 0 && (
                    <button
                      type="button"
                      onClick={() => setPrintLabelCount(printingBarcodeProduct.current_stock)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer border ${
                        printLabelCount === printingBarcodeProduct.current_stock
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                      }`}
                    >
                      Full Stock ({printingBarcodeProduct.current_stock})
                    </button>
                  )}
                </div>
              </div>

              {/* Render printable area directly on document.body using React Portal so it is isolated from #root */}
              {createPortal(
                <div id="barcode-printable-area" className="barcode-print-portal fixed -left-[9999px] top-0 opacity-0 pointer-events-none">
                  {printerType === 'thermal' ? (
                    (() => {
                      const pageDims = getPrintPageDimensions(printLabelSize, printLabelsPerRow, printOrientation, printerType);
                      const dims = pageDims.baseDims;
                      const totalRows = Math.ceil(printLabelCount / printLabelsPerRow);
                      return Array.from({ length: totalRows }).map((_, rIdx) => {
                        const countInThisRow = Math.min(printLabelsPerRow, printLabelCount - rIdx * printLabelsPerRow);
                        const isLastRow = rIdx === totalRows - 1;

                        return (
                          <div 
                            key={rIdx} 
                            className="barcode-print-row"
                            style={{
                              display: 'flex',
                              pageBreakAfter: isLastRow ? 'avoid' : 'always',
                              pageBreakInside: 'avoid',
                              breakAfter: isLastRow ? 'avoid' : 'page',
                              breakInside: 'avoid'
                            }}
                          >
                            {Array.from({ length: countInThisRow }).map((_, cIdx) => (
                              <div 
                                key={cIdx} 
                                className="barcode-label-sticker"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  overflow: 'hidden',
                                  boxSizing: 'border-box'
                                }}
                              >
                                <ThermalBarcodeSticker
                                  product={printingBarcodeProduct}
                                  size={printLabelSize}
                                  companyName={printIncludeCompanyName ? printCompanyName : ''}
                                  showCompanyName={printIncludeCompanyName}
                                  mrp={printMrp}
                                  salePrice={printSalePrice}
                                  packedOn={printPackedOn}
                                  expiryOn={printExpiryOn}
                                  fssaiNumber={printFssaiNumber}
                                  phone={printPhone}
                                  address={printAddress}
                                  otherInfo={printOtherInfo}
                                  ingredients={printIngredients}
                                  orientation={printOrientation}
                                  mode="print"
                                  boxBorder={printBoxBorder}
                                  barcodeFrame={printBarcodeFrame}
                                  barcodeOffsetMm={printAlignmentTarget === 'barcode' ? printHorizontalOffsetMm : 0}
                                />
                              </div>
                            ))}
                            {/* Empty spacer if odd number of labels in last row of a 2-up roll */}
                            {printLabelsPerRow === 2 && countInThisRow === 1 && (
                              <div 
                                className="barcode-label-sticker barcode-label-placeholder"
                                style={{ 
                                  visibility: 'hidden',
                                  opacity: 0
                                }} 
                              />
                            )}
                          </div>
                        );
                      });
                    })()
                  ) : (
                    /* A4 Sheet Grid */
                    <div className="grid grid-cols-3 gap-4 p-4 bg-white w-[210mm]">
                      {Array.from({ length: printLabelCount }).map((_, idx) => (
                        <div key={idx} className="barcode-label-sticker p-2 border border-black rounded bg-white flex flex-col items-center">
                          <ThermalBarcodeSticker
                            product={printingBarcodeProduct}
                            size="standard"
                            companyName={printIncludeCompanyName ? printCompanyName : ''}
                            showCompanyName={printIncludeCompanyName}
                            mrp={printMrp}
                            salePrice={printSalePrice}
                            packedOn={printPackedOn}
                            expiryOn={printExpiryOn}
                            fssaiNumber={printFssaiNumber}
                            phone={printPhone}
                            address={printAddress}
                            otherInfo={printOtherInfo}
                            ingredients={printIngredients}
                            orientation={printOrientation}
                            mode="print"
                            boxBorder={printBoxBorder}
                            barcodeFrame={printBarcodeFrame}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>,
                document.body
              )}

              {/* Essential Browser Print Dialog Guidance (Fix for Auto-Landscape, App Name, & Blank Page Feed) */}
              <div className="no-print bg-amber-50/90 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/80 rounded-xl p-3.5 text-[11px] space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-amber-950 dark:text-amber-200 font-black text-[12px]">
                    <span className="text-base">🖨️</span>
                    <span>Thermal Printer (TSC / Zebra / TVS): 4 Essential Chrome Print Settings</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPrintHelp(!showPrintHelp)}
                    className="text-[10.5px] text-amber-800 dark:text-amber-300 underline font-bold cursor-pointer hover:text-amber-950"
                  >
                    {showPrintHelp ? 'Hide Detailed Guide' : 'Read Paper Size & Setup Guide'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border-2 border-blue-500 dark:border-blue-600 shadow-2xs">
                    <div className="font-black text-blue-700 dark:text-blue-300 text-[10.5px] flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-blue-600 text-white inline-flex items-center justify-center text-[9px] font-black shrink-0">1</span>
                      <span>Layout: LANDSCAPE (Horizontal)</span>
                    </div>
                    <p className="text-[9.5px] text-slate-700 dark:text-slate-300 mt-1 leading-tight">
                      In Chrome Print Dialog, select <b>Layout: LANDSCAPE</b>. This forces <b>horizontal printing</b> across the width of the label roll so barcodes and text fit in the rectangular sticker box very perfectly and professionally!
                    </p>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border-2 border-rose-400 dark:border-rose-600 shadow-2xs">
                    <div className="font-black text-rose-700 dark:text-rose-400 text-[10.5px] flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-rose-600 text-white inline-flex items-center justify-center text-[9px] font-black shrink-0">2</span>
                      <span>Remove Application Name</span>
                    </div>
                    <p className="text-[9.5px] text-slate-700 dark:text-slate-300 mt-1 leading-tight">
                      Click <b>More settings</b> ➔ <b>UNCHECK "Headers and footers"</b>. This stops Chrome from printing the Application Name ("Kokanastha Operation"), Date, URL, and page count on your labels!
                    </p>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-amber-200/90 dark:border-amber-800/60 shadow-2xs">
                    <div className="font-black text-slate-900 dark:text-slate-100 text-[10.5px] flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-amber-500 text-white inline-flex items-center justify-center text-[9px] font-black shrink-0">3</span>
                      <span>Paper Size Selection</span>
                    </div>
                    <p className="text-[9.5px] text-slate-700 dark:text-slate-300 mt-1 leading-tight">
                      Select your <b>Thermal Printer</b> as Destination. If your printer driver has the roll size configured, keep <b>Paper size: Default</b>, or select <b>104×25mm / USER</b>.
                    </p>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border-2 border-emerald-500 dark:border-emerald-600 shadow-2xs">
                    <div className="font-black text-emerald-700 dark:text-emerald-300 text-[10.5px] flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-emerald-600 text-white inline-flex items-center justify-center text-[9px] font-black shrink-0">4</span>
                      <span>Margins: NONE (Fixes 3mm Shift)</span>
                    </div>
                    <p className="text-[9.5px] text-slate-700 dark:text-slate-300 mt-1 leading-tight">
                      Chrome default margins shift the barcode <b>3mm to the right</b>! In Chrome Print, set <b>Margins to "None"</b> and <b>Scale to 100%</b>, or click our <b>⬅ -3mm Left</b> alignment button.
                    </p>
                  </div>
                </div>

                {showPrintHelp && (
                  <div className="mt-2.5 pt-2.5 border-t border-amber-200 dark:border-amber-800/60 text-[10.5px] text-amber-950 dark:text-amber-200 space-y-2 bg-amber-100/50 dark:bg-amber-900/30 p-2.5 rounded-lg">
                    <p className="font-bold">🔍 Thermal Roll FAQs & Driver Tips:</p>
                    <div className="space-y-1 text-[10px] leading-relaxed">
                      <p>
                        <b>Q: Why does the barcode in Chrome print preview move 3 mm right side?</b><br />
                        Chrome print dialog defaults to <b>Margins: Default</b>, which automatically adds ~3mm unprintable margin on the left side of thermal rolls. To fix this, click <b>More settings ➔ set Margins to "None"</b>, or use our <b>⬅ -3 mm Left</b> offset button above.
                      </p>
                      <p>
                        <b>Q: Why was it printing vertically instead of horizontally?</b><br />
                        Thermal label rolls (50×25mm or 104×25mm) are wide horizontal boxes. If Chrome's layout is set to Portrait, it rotates the label vertically. Selecting <b>Layout: LANDSCAPE</b> in Chrome print dialog ensures 100% horizontal printing that fits inside the box perfectly.
                      </p>
                      <p>
                        <b>Q: What if my printer driver requires a Portrait feed?</b><br />
                        If selecting Landscape in Chrome still doesn't work, select our <b>🌟 90° Thermal Fix</b> above. This will format the job on a vertical page but rotate the stickers so they emerge horizontal on your printer.
                      </p>
                      <p>
                        <b>Q: Do I need to select paper size when I print?</b><br />
                        If your printer (e.g. TSC TTP-244 Pro, TVS, Zebra) already has a 104×25mm / 50×25mm 2-Up stock defined in Windows Printer Properties, leave <b>Paper size: Default</b>. If you see blank stickers rolling out, select the custom 104×25mm / 50×25mm stock from the Paper size dropdown.
                      </p>
                      <p>
                        <b>Q: How do I remove the app title "Kokanastha Operation"?</b><br />
                        In the Chrome print preview panel on the right, expand <b>More settings</b> and uncheck the <b>Headers and footers</b> checkbox.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 no-print">
                <button 
                  onClick={() => setPrintingBarcodeProduct(null)}
                  className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-[11px] font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={() => handlePrintBarcodeSubmit('popup')}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl text-[11px] font-bold hover:from-indigo-700 hover:to-blue-700 cursor-pointer flex items-center gap-2 shadow-sm transition-transform active:scale-95"
                    title="Open thermal print dialog in a dedicated popup window"
                  >
                    <ExternalLink size={14} />
                    <span>🖨️ Print in Popup Window ({printLabelCount} labels)</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => handlePrintBarcodeSubmit('iframe')}
                    className="px-3.5 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-[11px] font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 cursor-pointer flex items-center gap-1.5"
                    title="Direct Browser Print Dialog"
                  >
                    <Printer size={14} />
                    <span>Direct Print</span>
                  </button>
                </div>
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

            <form onSubmit={handleSaveProduct} onKeyDown={(e) => { if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') e.preventDefault(); }} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
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

      {/* Product Nutrition & Food Packaging Modal (Kokanastha Style) */}
      {nutritionModalProduct && (
        <ProductNutritionModal
          product={nutritionModalProduct}
          isOpen={!!nutritionModalProduct}
          onClose={() => setNutritionModalProduct(null)}
          onSave={handleSaveNutrition}
          onOpenPrintStation={(prod) => {
            setNutritionModalProduct(null);
            handleOpenBarcodeModal(prod);
          }}
          userRole={user.role}
          businessName={dbStore.getBusiness(businessId)?.name || 'KOKANASTHA'}
        />
      )}
    </div>
  );
};
