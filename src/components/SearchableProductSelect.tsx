import React, { useState, useRef, useEffect } from 'react';
import { Search, X, ChevronDown, Package, Tag, Check, Boxes } from 'lucide-react';

export interface ProductItem {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  category_id?: string;
  brand?: string;
  unit?: string;
  gst_rate?: number;
  purchase_price?: number;
  selling_price?: number;
  stock_quantity?: number;
  current_stock?: number;
  [key: string]: any;
}

interface SearchableProductSelectProps {
  products: ProductItem[];
  selectedProductId: string;
  onSelectProduct: (product: ProductItem | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const SearchableProductSelect: React.FC<SearchableProductSelectProps> = ({
  products,
  selectedProductId,
  onSelectProduct,
  placeholder = "-- Search or Select Product --",
  className = "",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const filteredProducts = products.filter((p) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const nameMatch = p.name?.toLowerCase().includes(term);
    const skuMatch = p.sku?.toLowerCase().includes(term);
    const barcodeMatch = p.barcode?.toLowerCase().includes(term);
    const brandMatch = p.brand?.toLowerCase().includes(term);
    return nameMatch || skuMatch || barcodeMatch || brandMatch;
  });

  const handleSelect = (product: ProductItem) => {
    onSelectProduct(product);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectProduct(null);
    setSearchTerm('');
  };

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      {/* Trigger Box */}
      <div
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
        className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border ${
          isOpen
            ? 'border-indigo-500 ring-2 ring-indigo-500/20'
            : 'border-slate-300 dark:border-slate-600 hover:border-slate-400'
        } rounded-lg flex items-center justify-between cursor-pointer text-xs transition-all ${
          disabled ? 'opacity-60 cursor-not-allowed' : ''
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden mr-1">
          <Package size={15} className="text-indigo-500 shrink-0" />
          {selectedProduct ? (
            <div className="flex items-center gap-2 truncate">
              <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                {selectedProduct.name}
              </span>
              {selectedProduct.sku && (
                <span className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] rounded font-mono shrink-0">
                  #{selectedProduct.sku}
                </span>
              )}
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                ₹{selectedProduct.purchase_price ?? 0}
              </span>
            </div>
          ) : (
            <span className="text-slate-400 dark:text-slate-500 italic truncate">
              {placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {selectedProduct && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full transition-colors"
              title="Clear selection"
            >
              <X size={13} />
            </button>
          )}
          <ChevronDown
            size={14}
            className={`text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-indigo-500' : ''
            }`}
          />
        </div>
      </div>

      {/* Search Dropdown Overlay */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1 z-50 w-full min-w-full sm:min-w-[420px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Search Bar Input */}
          <div className="p-2 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
            <Search size={14} className="text-slate-400 shrink-0 ml-1" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Type to search product name, SKU, or barcode..."
              className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-100 focus:outline-none placeholder-slate-400"
              onKeyDown={(e) => {
                if (e.key === 'Escape') setIsOpen(false);
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Product Items List */}
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {filteredProducts.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
                No products found matching &ldquo;<span className="font-semibold">{searchTerm}</span>&rdquo;
              </div>
            ) : (
              filteredProducts.map((prod) => {
                const isSelected = prod.id === selectedProductId;
                const stock = prod.stock_quantity ?? prod.current_stock ?? 0;
                return (
                  <div
                    key={prod.id}
                    onClick={() => handleSelect(prod)}
                    className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-semibold'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                      <div className={`p-1.5 rounded-lg shrink-0 ${
                        isSelected 
                          ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        <Boxes size={14} />
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {prod.name}
                          </span>
                          {prod.sku && (
                            <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono rounded border border-slate-200 dark:border-slate-700">
                              #{prod.sku}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-0.5">
                          <span>Unit: {prod.unit || 'Pcs'}</span>
                          <span>GST: {prod.gst_rate ?? 0}%</span>
                          {prod.brand && <span>Brand: {prod.brand}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          ₹{prod.purchase_price ?? 0}
                        </span>
                        <span className={`text-[10px] font-semibold ${
                          stock > 10 
                            ? 'text-slate-500 dark:text-slate-400' 
                            : stock > 0 
                              ? 'text-amber-600 dark:text-amber-400' 
                              : 'text-rose-500 dark:text-rose-400'
                        }`}>
                          Stock: {stock}
                        </span>
                      </div>
                      {isSelected && (
                        <Check size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer info */}
          <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-[10px] text-slate-400">
            <span>Showing {filteredProducts.length} of {products.length} products</span>
            <span>Click to select</span>
          </div>
        </div>
      )}
    </div>
  );
};
