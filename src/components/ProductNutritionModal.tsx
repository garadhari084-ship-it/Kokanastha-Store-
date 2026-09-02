import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Printer, 
  Save, 
  Info, 
  ShieldCheck, 
  Check, 
  RefreshCw, 
  Flame, 
  Wheat, 
  Eye, 
  FileText,
  Clock,
  MapPin,
  Phone,
  ChevronDown
} from 'lucide-react';
import ReactBarcode from 'react-barcode';
import { Product, NutritionFacts, FoodPackagingInfo, UserProfile } from '../types/erp';

interface ProductNutritionModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedProduct: Product) => void;
  onOpenPrintStation?: (product: Product) => void;
  userRole?: string;
  businessName?: string;
}

// Common Food Presets for fast 1-click population
const NUTRITION_PRESETS: {
  name: string;
  icon: string;
  nutrition: NutritionFacts;
  packaging: Partial<FoodPackagingInfo>;
}[] = [
  {
    name: 'Savoury Snacks / Chakli / Farsan',
    icon: '🥨',
    nutrition: {
      serving_size: '30g',
      servings_per_container: '16',
      energy_kcal: 490,
      protein_g: 9.5,
      carbohydrates_g: 58.0,
      total_sugars_g: 1.5,
      added_sugars_g: 0,
      total_fat_g: 25.0,
      saturated_fat_g: 8.0,
      trans_fat_g: 0,
      cholesterol_mg: 0,
      sodium_mg: 460,
      dietary_fiber_g: 4.2
    },
    packaging: {
      dietary_type: 'veg',
      shelf_life_days: 90,
      best_before_text: 'Best Before 90 Days from packaging',
      storage_instructions: 'Store in a cool, hygienic & dry place away from direct sunlight. Keep in an airtight container.'
    }
  },
  {
    name: 'Traditional Sweets / Laddus / Barfi',
    icon: '🍬',
    nutrition: {
      serving_size: '40g',
      servings_per_container: '12',
      energy_kcal: 515,
      protein_g: 10.5,
      carbohydrates_g: 55.0,
      total_sugars_g: 34.0,
      added_sugars_g: 32.0,
      total_fat_g: 28.5,
      saturated_fat_g: 16.0,
      trans_fat_g: 0.1,
      cholesterol_mg: 30,
      sodium_mg: 80,
      dietary_fiber_g: 2.8
    },
    packaging: {
      dietary_type: 'veg',
      shelf_life_days: 60,
      best_before_text: 'Best Before 60 Days from packaging',
      storage_instructions: 'Store in a cool and dry place. Do not refrigerate.'
    }
  },
  {
    name: 'Roasted Chivda / Poha Mixture',
    icon: '🥣',
    nutrition: {
      serving_size: '30g',
      servings_per_container: '16',
      energy_kcal: 455,
      protein_g: 8.0,
      carbohydrates_g: 63.0,
      total_sugars_g: 4.2,
      added_sugars_g: 3.0,
      total_fat_g: 19.5,
      saturated_fat_g: 5.0,
      trans_fat_g: 0,
      cholesterol_mg: 0,
      sodium_mg: 380,
      dietary_fiber_g: 3.6
    },
    packaging: {
      dietary_type: 'veg',
      shelf_life_days: 90,
      best_before_text: 'Best Before 3 Months from packaging',
      storage_instructions: 'Keep in an airtight container after opening to retain crispiness.'
    }
  },
  {
    name: 'Dry Fruits & Nuts / Masala Cashews',
    icon: '🥜',
    nutrition: {
      serving_size: '28g',
      servings_per_container: '8',
      energy_kcal: 580,
      protein_g: 18.0,
      carbohydrates_g: 30.0,
      total_sugars_g: 5.0,
      added_sugars_g: 0,
      total_fat_g: 44.0,
      saturated_fat_g: 8.5,
      trans_fat_g: 0,
      cholesterol_mg: 0,
      sodium_mg: 240,
      dietary_fiber_g: 6.0
    },
    packaging: {
      dietary_type: 'veg',
      shelf_life_days: 180,
      best_before_text: 'Best Before 6 Months from packaging',
      storage_instructions: 'Store in a cool, dark and dry place or refrigerate for enhanced shelf life.'
    }
  },
  {
    name: 'Bakery / Cookies / Biscuits',
    icon: '🍪',
    nutrition: {
      serving_size: '25g',
      servings_per_container: '10',
      energy_kcal: 475,
      protein_g: 6.5,
      carbohydrates_g: 68.0,
      total_sugars_g: 26.0,
      added_sugars_g: 24.0,
      total_fat_g: 20.0,
      saturated_fat_g: 9.5,
      trans_fat_g: 0,
      cholesterol_mg: 15,
      sodium_mg: 210,
      dietary_fiber_g: 1.8
    },
    packaging: {
      dietary_type: 'veg',
      shelf_life_days: 90,
      best_before_text: 'Best Before 3 Months from packaging',
      storage_instructions: 'Store in an airtight jar in a cool, dry place.'
    }
  }
];

export const ProductNutritionModal: React.FC<ProductNutritionModalProps> = ({
  product,
  isOpen,
  onClose,
  onSave,
  onOpenPrintStation,
  userRole = 'Admin',
  businessName = 'KOKANASTHA'
}) => {
  const [activeTab, setActiveTab] = useState<'nutrition' | 'packaging' | 'preview'>('nutrition');
  
  // State for Nutrition Facts
  const [nutrition, setNutrition] = useState<NutritionFacts>({
    serving_size: product.nutrition_facts?.serving_size || '100g',
    servings_per_container: product.nutrition_facts?.servings_per_container || '1',
    energy_kcal: product.nutrition_facts?.energy_kcal !== undefined ? product.nutrition_facts.energy_kcal : 450,
    protein_g: product.nutrition_facts?.protein_g !== undefined ? product.nutrition_facts.protein_g : 8.5,
    carbohydrates_g: product.nutrition_facts?.carbohydrates_g !== undefined ? product.nutrition_facts.carbohydrates_g : 60,
    total_sugars_g: product.nutrition_facts?.total_sugars_g !== undefined ? product.nutrition_facts.total_sugars_g : 5,
    added_sugars_g: product.nutrition_facts?.added_sugars_g !== undefined ? product.nutrition_facts.added_sugars_g : 0,
    total_fat_g: product.nutrition_facts?.total_fat_g !== undefined ? product.nutrition_facts.total_fat_g : 20,
    saturated_fat_g: product.nutrition_facts?.saturated_fat_g !== undefined ? product.nutrition_facts.saturated_fat_g : 6,
    trans_fat_g: product.nutrition_facts?.trans_fat_g !== undefined ? product.nutrition_facts.trans_fat_g : 0,
    cholesterol_mg: product.nutrition_facts?.cholesterol_mg !== undefined ? product.nutrition_facts.cholesterol_mg : 0,
    sodium_mg: product.nutrition_facts?.sodium_mg !== undefined ? product.nutrition_facts.sodium_mg : 350,
    dietary_fiber_g: product.nutrition_facts?.dietary_fiber_g !== undefined ? product.nutrition_facts.dietary_fiber_g : 3.5,
    calcium_mg: product.nutrition_facts?.calcium_mg,
    iron_mg: product.nutrition_facts?.iron_mg,
  });

  // State for Food Packaging Compliance
  const [packaging, setPackaging] = useState<FoodPackagingInfo>({
    dietary_type: product.food_packaging?.dietary_type ?? 'veg',
    ingredients: product.food_packaging?.ingredients ?? (product.description || 'Wheat Flour, Edible Vegetable Oil, Sugar, Iodized Salt, Spices & Condiments'),
    allergen_info: product.food_packaging?.allergen_info ?? 'Manufactured in a facility that processes Wheat, Nuts and Dairy.',
    fssai_license: product.food_packaging?.fssai_license ?? '11521018000123',
    net_weight: product.food_packaging?.net_weight ?? (product.pack_size ? `${product.pack_size}g` : `${product.unit || '1 Pack'}`),
    batch_no: product.food_packaging?.batch_no ?? `BAT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    shelf_life_days: product.food_packaging?.shelf_life_days ?? 90,
    best_before_text: product.food_packaging?.best_before_text ?? 'Best Before 90 Days from packaging',
    storage_instructions: product.food_packaging?.storage_instructions ?? 'Store in a cool, hygienic and dry place away from moisture and direct sunlight.',
    mfg_by: product.food_packaging?.mfg_by ?? `${businessName} Special Foods, Pune - 411030`,
    mkt_by: product.food_packaging?.mkt_by ?? `${businessName} Enterprises`,
    customer_care: product.food_packaging?.customer_care ?? `care@${businessName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com | +91 9876543210`
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [packerMode, setPackerMode] = useState<'mfg' | 'mkt'>('mfg');
  const [isPackerDropdownOpen, setIsPackerDropdownOpen] = useState(false);
  const packerDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (packerDropdownRef.current && !packerDropdownRef.current.contains(event.target as Node)) {
        setIsPackerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const handleNutritionChange = (key: keyof NutritionFacts, value: any) => {
    setNutrition(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  };

  const handlePackagingChange = (key: keyof FoodPackagingInfo, value: any) => {
    setPackaging(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  };

  const handleApplyPreset = (preset: typeof NUTRITION_PRESETS[0]) => {
    setNutrition(preset.nutrition);
    setPackaging(prev => ({
      ...prev,
      ...preset.packaging
    }));
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    const updatedProduct: Product = {
      ...product,
      nutrition_facts: nutrition,
      food_packaging: packaging
    };
    onSave(updatedProduct);
    setHasUnsavedChanges(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] my-auto">
        {/* Header */}
        <div className="bg-slate-950 text-white px-5 py-3.5 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
              🥗
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black uppercase tracking-wider text-white">
                  Nutrition Facts & Food Packaging Master
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  Kokanastha / FSSAI Standard
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate max-w-md">
                Product: <b className="text-white">{product.name}</b> (SKU: {product.sku})
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-5 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('nutrition')}
              className={`py-2.5 px-4 text-[11px] font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'nutrition'
                  ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900 rounded-t-lg'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Flame size={14} className={activeTab === 'nutrition' ? 'text-emerald-500' : 'text-slate-400'} />
              <span>Nutrition Values</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('packaging')}
              className={`py-2.5 px-4 text-[11px] font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'packaging'
                  ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900 rounded-t-lg'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <ShieldCheck size={14} className={activeTab === 'packaging' ? 'text-emerald-500' : 'text-slate-400'} />
              <span>FSSAI & Packaging Info</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`py-2.5 px-4 text-[11px] font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'preview'
                  ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900 rounded-t-lg'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Eye size={14} className={activeTab === 'preview' ? 'text-emerald-500' : 'text-slate-400'} />
              <span>Live Kokanastha Label Preview</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                handleSave();
                onOpenPrintStation?.(product);
              }}
              className="py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900/60 rounded-lg text-[11px] font-bold border border-indigo-200 dark:border-indigo-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Printer size={13} />
              <span>Print Sticker with Nutrition</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          
          {/* TAB 1: NUTRITION VALUES */}
          {activeTab === 'nutrition' && (
            <div className="space-y-5">
              {/* Presets Bar */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Sparkles size={12} className="text-amber-500" />
                    Quick Food Presets (1-Click Auto-Fill)
                  </span>
                  <span className="text-[9px] text-slate-400">Click any category to pre-fill standard nutritional metrics</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  {NUTRITION_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="p-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-emerald-500 dark:hover:border-emerald-400 text-left transition-all cursor-pointer shadow-2xs group flex flex-col justify-between"
                    >
                      <div className="text-base mb-1">{preset.icon}</div>
                      <div className="text-[10px] font-bold text-slate-800 dark:text-slate-100 leading-tight group-hover:text-emerald-600">
                        {preset.name}
                      </div>
                      <div className="text-[9px] font-mono text-slate-400 mt-1">
                        ~{preset.nutrition.energy_kcal} kcal
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Serving Size & Containers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-200">
                    Serving Size Reference
                  </label>
                  <input
                    type="text"
                    value={nutrition.serving_size || ''}
                    onChange={(e) => handleNutritionChange('serving_size', e.target.value)}
                    placeholder="e.g. 100g or 30g (1/4 cup)"
                    className="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-800 text-xs font-bold rounded-lg border border-emerald-300 dark:border-emerald-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  />
                  <span className="text-[9px] text-emerald-700 dark:text-emerald-400 mt-0.5 block">
                    All nutrition values below are calculated per this serving size (standard: 100g).
                  </span>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-200">
                    Approx. Servings Per Container
                  </label>
                  <input
                    type="text"
                    value={nutrition.servings_per_container || ''}
                    onChange={(e) => handleNutritionChange('servings_per_container', e.target.value)}
                    placeholder="e.g. 5, 10 or 1"
                    className="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-800 text-xs font-bold rounded-lg border border-emerald-300 dark:border-emerald-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  />
                  <span className="text-[9px] text-emerald-700 dark:text-emerald-400 mt-0.5 block">
                    Total number of servings packed inside one packet/box.
                  </span>
                </div>
              </div>

              {/* Core Macro-Nutrients Grid */}
              <div className="space-y-2">
                <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <span>Energy & Macro Nutrients (per 100g / Serving)</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Energy */}
                  <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
                    <label className="text-[10px] font-black text-amber-900 dark:text-amber-200 uppercase flex items-center justify-between">
                      <span>Energy</span>
                      <span className="text-[9px] font-bold text-amber-600">kcal</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={nutrition.energy_kcal ?? ''}
                      onChange={(e) => handleNutritionChange('energy_kcal', parseFloat(e.target.value) || 0)}
                      placeholder="e.g. 450"
                      className="w-full mt-1 px-2.5 py-1.5 bg-white dark:bg-slate-800 text-sm font-black rounded-lg border border-amber-300 dark:border-amber-700 focus:outline-hidden dark:text-white"
                    />
                  </div>

                  {/* Protein */}
                  <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
                    <label className="text-[10px] font-black text-blue-900 dark:text-blue-200 uppercase flex items-center justify-between">
                      <span>Protein</span>
                      <span className="text-[9px] font-bold text-blue-600">g</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={nutrition.protein_g ?? ''}
                      onChange={(e) => handleNutritionChange('protein_g', parseFloat(e.target.value) || 0)}
                      placeholder="e.g. 8.5"
                      className="w-full mt-1 px-2.5 py-1.5 bg-white dark:bg-slate-800 text-sm font-black rounded-lg border border-blue-300 dark:border-blue-700 focus:outline-hidden dark:text-white"
                    />
                  </div>

                  {/* Carbohydrates */}
                  <div className="p-3 bg-purple-50/70 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-800">
                    <label className="text-[10px] font-black text-purple-900 dark:text-purple-200 uppercase flex items-center justify-between">
                      <span>Total Carbs</span>
                      <span className="text-[9px] font-bold text-purple-600">g</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={nutrition.carbohydrates_g ?? ''}
                      onChange={(e) => handleNutritionChange('carbohydrates_g', parseFloat(e.target.value) || 0)}
                      placeholder="e.g. 62.0"
                      className="w-full mt-1 px-2.5 py-1.5 bg-white dark:bg-slate-800 text-sm font-black rounded-lg border border-purple-300 dark:border-purple-700 focus:outline-hidden dark:text-white"
                    />
                  </div>

                  {/* Total Fat */}
                  <div className="p-3 bg-rose-50/70 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-800">
                    <label className="text-[10px] font-black text-rose-900 dark:text-rose-200 uppercase flex items-center justify-between">
                      <span>Total Fat</span>
                      <span className="text-[9px] font-bold text-rose-600">g</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={nutrition.total_fat_g ?? ''}
                      onChange={(e) => handleNutritionChange('total_fat_g', parseFloat(e.target.value) || 0)}
                      placeholder="e.g. 20.0"
                      className="w-full mt-1 px-2.5 py-1.5 bg-white dark:bg-slate-800 text-sm font-black rounded-lg border border-rose-300 dark:border-rose-700 focus:outline-hidden dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="space-y-2">
                <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  FSSAI Breakdown (Sugars, Fats & Sodium)
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <label className="text-[9.5px] font-bold text-slate-700 dark:text-slate-300 uppercase">Total Sugars</label>
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        type="number"
                        step="0.1"
                        value={nutrition.total_sugars_g ?? ''}
                        onChange={(e) => handleNutritionChange('total_sugars_g', parseFloat(e.target.value) || 0)}
                        placeholder="0.0"
                        className="w-full px-2 py-1 bg-white dark:bg-slate-700 text-xs font-bold rounded border border-slate-300 dark:border-slate-600 dark:text-white"
                      />
                      <span className="text-[10px] text-slate-500 font-bold">g</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <label className="text-[9.5px] font-bold text-slate-700 dark:text-slate-300 uppercase">Added Sugars</label>
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        type="number"
                        step="0.1"
                        value={nutrition.added_sugars_g ?? ''}
                        onChange={(e) => handleNutritionChange('added_sugars_g', parseFloat(e.target.value) || 0)}
                        placeholder="0.0"
                        className="w-full px-2 py-1 bg-white dark:bg-slate-700 text-xs font-bold rounded border border-slate-300 dark:border-slate-600 dark:text-white"
                      />
                      <span className="text-[10px] text-slate-500 font-bold">g</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <label className="text-[9.5px] font-bold text-slate-700 dark:text-slate-300 uppercase">Saturated Fat</label>
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        type="number"
                        step="0.1"
                        value={nutrition.saturated_fat_g ?? ''}
                        onChange={(e) => handleNutritionChange('saturated_fat_g', parseFloat(e.target.value) || 0)}
                        placeholder="0.0"
                        className="w-full px-2 py-1 bg-white dark:bg-slate-700 text-xs font-bold rounded border border-slate-300 dark:border-slate-600 dark:text-white"
                      />
                      <span className="text-[10px] text-slate-500 font-bold">g</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <label className="text-[9.5px] font-bold text-slate-700 dark:text-slate-300 uppercase">Trans Fat</label>
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        type="number"
                        step="0.01"
                        value={nutrition.trans_fat_g ?? ''}
                        onChange={(e) => handleNutritionChange('trans_fat_g', parseFloat(e.target.value) || 0)}
                        placeholder="0.0"
                        className="w-full px-2 py-1 bg-white dark:bg-slate-700 text-xs font-bold rounded border border-slate-300 dark:border-slate-600 dark:text-white"
                      />
                      <span className="text-[10px] text-slate-500 font-bold">g</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <label className="text-[9.5px] font-bold text-slate-700 dark:text-slate-300 uppercase">Dietary Fiber</label>
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        type="number"
                        step="0.1"
                        value={nutrition.dietary_fiber_g ?? ''}
                        onChange={(e) => handleNutritionChange('dietary_fiber_g', parseFloat(e.target.value) || 0)}
                        placeholder="0.0"
                        className="w-full px-2 py-1 bg-white dark:bg-slate-700 text-xs font-bold rounded border border-slate-300 dark:border-slate-600 dark:text-white"
                      />
                      <span className="text-[10px] text-slate-500 font-bold">g</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <label className="text-[9.5px] font-bold text-slate-700 dark:text-slate-300 uppercase">Sodium</label>
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        type="number"
                        step="1"
                        value={nutrition.sodium_mg ?? ''}
                        onChange={(e) => handleNutritionChange('sodium_mg', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full px-2 py-1 bg-white dark:bg-slate-700 text-xs font-bold rounded border border-slate-300 dark:border-slate-600 dark:text-white"
                      />
                      <span className="text-[10px] text-slate-500 font-bold">mg</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Optional Micro-Nutrients */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <label className="text-[9.5px] font-bold text-slate-700 dark:text-slate-300 uppercase">Cholesterol (mg)</label>
                  <input
                    type="number"
                    value={nutrition.cholesterol_mg ?? ''}
                    onChange={(e) => handleNutritionChange('cholesterol_mg', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full mt-1 px-2.5 py-1 bg-white dark:bg-slate-700 text-xs font-bold rounded border border-slate-300 dark:border-slate-600 dark:text-white"
                  />
                </div>

                <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <label className="text-[9.5px] font-bold text-slate-700 dark:text-slate-300 uppercase">Calcium (mg - Optional)</label>
                  <input
                    type="number"
                    value={nutrition.calcium_mg ?? ''}
                    onChange={(e) => handleNutritionChange('calcium_mg', parseFloat(e.target.value) || 0)}
                    placeholder="e.g. 120"
                    className="w-full mt-1 px-2.5 py-1 bg-white dark:bg-slate-700 text-xs font-bold rounded border border-slate-300 dark:border-slate-600 dark:text-white"
                  />
                </div>

                <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <label className="text-[9.5px] font-bold text-slate-700 dark:text-slate-300 uppercase">Iron (mg - Optional)</label>
                  <input
                    type="number"
                    value={nutrition.iron_mg ?? ''}
                    onChange={(e) => handleNutritionChange('iron_mg', parseFloat(e.target.value) || 0)}
                    placeholder="e.g. 2.5"
                    className="w-full mt-1 px-2.5 py-1 bg-white dark:bg-slate-700 text-xs font-bold rounded border border-slate-300 dark:border-slate-600 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PACKAGING & FSSAI INFO */}
          {activeTab === 'packaging' && (
            <div className="space-y-4">
              {/* Dietary Category Selector with Green / Red Symbol */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
                  Dietary Logo & Classification (FSSAI Mandatory)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handlePackagingChange('dietary_type', 'veg')}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      packaging.dietary_type === 'veg'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-400/40 shadow-xs'
                        : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {/* FSSAI Green Veg Emblem */}
                    <div className="w-5 h-5 border-2 border-emerald-600 rounded-xs flex items-center justify-center bg-white shrink-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900 dark:text-white leading-tight">100% Vegetarian</div>
                      <div className="text-[9px] text-emerald-700 dark:text-emerald-400 font-bold">Green Dot Emblem</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePackagingChange('dietary_type', 'non_veg')}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      packaging.dietary_type === 'non_veg'
                        ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 ring-2 ring-rose-400/40 shadow-xs'
                        : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {/* FSSAI Red Non-Veg Emblem */}
                    <div className="w-5 h-5 border-2 border-rose-700 rounded-xs flex items-center justify-center bg-white shrink-0">
                      <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px] border-b-rose-700" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900 dark:text-white leading-tight">Non-Vegetarian</div>
                      <div className="text-[9px] text-rose-700 dark:text-rose-400 font-bold">Brown Triangle Emblem</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePackagingChange('dietary_type', 'vegan')}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      packaging.dietary_type === 'vegan'
                        ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 ring-2 ring-teal-400/40 shadow-xs'
                        : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-base shrink-0">🌱</span>
                    <div>
                      <div className="text-xs font-black text-slate-900 dark:text-white leading-tight">100% Vegan</div>
                      <div className="text-[9px] text-teal-700 dark:text-teal-400 font-bold">Plant-Based</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePackagingChange('dietary_type', 'egg')}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      packaging.dietary_type === 'egg'
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 ring-2 ring-amber-400/40 shadow-xs'
                        : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-base shrink-0">🥚</span>
                    <div>
                      <div className="text-xs font-black text-slate-900 dark:text-white leading-tight">Contains Egg</div>
                      <div className="text-[9px] text-amber-700 dark:text-amber-400 font-bold">Eggitarian</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Ingredients & Allergen advice */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Ingredients Declaration</span>
                    <span className="text-[9px] font-bold text-indigo-600">Printed on Label</span>
                  </label>
                  <textarea
                    rows={3}
                    value={packaging.ingredients ?? ''}
                    onChange={(e) => handlePackagingChange('ingredients', e.target.value)}
                    placeholder="List all ingredients in descending order of weight (e.g. Whole Wheat Flour, Pure Cow Ghee, Cane Sugar, Cardamom, Cashews, Almonds...)"
                    className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 dark:text-white custom-scrollbar"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Allergen Warning / Advice</span>
                    <span className="text-[9px] font-bold text-amber-600">Compliance</span>
                  </label>
                  <textarea
                    rows={3}
                    value={packaging.allergen_info ?? ''}
                    onChange={(e) => handlePackagingChange('allergen_info', e.target.value)}
                    placeholder="e.g. Contains Wheat (Gluten), Tree Nuts (Cashews, Almonds). Made in a facility that processes Peanuts and Sesame."
                    className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 dark:text-white custom-scrollbar"
                  />
                </div>
              </div>

              {/* FSSAI, Batch, Net Weight, Shelf Life */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    FSSAI Lic. Number
                  </label>
                  <input
                    type="text"
                    value={packaging.fssai_license ?? ''}
                    onChange={(e) => handlePackagingChange('fssai_license', e.target.value)}
                    placeholder="e.g. 11521018000123"
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 focus:outline-hidden dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Net Weight
                  </label>
                  <input
                    type="text"
                    value={packaging.net_weight ?? ''}
                    onChange={(e) => handlePackagingChange('net_weight', e.target.value)}
                    placeholder="e.g. 250g, 500g, 1 Kg"
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 focus:outline-hidden dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Batch / Lot No.
                  </label>
                  <input
                    type="text"
                    value={packaging.batch_no ?? ''}
                    onChange={(e) => handlePackagingChange('batch_no', e.target.value)}
                    placeholder="e.g. BAT-2026-A1"
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 focus:outline-hidden dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Shelf Life (Days)
                  </label>
                  <input
                    type="number"
                    value={packaging.shelf_life_days ?? ''}
                    onChange={(e) => {
                      const days = parseInt(e.target.value) || 0;
                      handlePackagingChange('shelf_life_days', days);
                      if (days > 0) {
                        handlePackagingChange('best_before_text', `Best Before ${days} Days from packaging`);
                      }
                    }}
                    placeholder="90"
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 focus:outline-hidden dark:text-white"
                  />
                </div>
              </div>

              {/* Best Before Text & Storage Instructions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Best Before Declaration
                  </label>
                  <input
                    type="text"
                    value={packaging.best_before_text ?? ''}
                    onChange={(e) => handlePackagingChange('best_before_text', e.target.value)}
                    placeholder="e.g. Best Before 60 Days from packaging"
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 focus:outline-hidden dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Storage Conditions
                  </label>
                  <input
                    type="text"
                    value={packaging.storage_instructions ?? ''}
                    onChange={(e) => handlePackagingChange('storage_instructions', e.target.value)}
                    placeholder="e.g. Store in a cool, hygienic & dry place away from sunlight."
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 focus:outline-hidden dark:text-white"
                  />
                </div>
              </div>

              {/* Manufacturer & Customer Care */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex flex-col relative" ref={packerDropdownRef}>
                  <div 
                    onClick={() => setIsPackerDropdownOpen(!isPackerDropdownOpen)}
                    className="flex items-center gap-1.5 cursor-pointer pb-1 group"
                  >
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {packerMode === 'mfg' ? 'Manufactured & Packed By' : 'Packed & Marketed By'}
                    </span>
                    <ChevronDown className="w-3 h-3 text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                  </div>
                  
                  {isPackerDropdownOpen && (
                    <div className="absolute top-6 left-0 z-10 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      <button
                        onClick={() => {
                          setPackerMode('mfg');
                          setIsPackerDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-[11px] font-bold uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-between ${packerMode === 'mfg' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' : 'text-slate-700 dark:text-slate-300'}`}
                      >
                        Manufactured & Packed By
                        {packerMode === 'mfg' && <Check className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={() => {
                          setPackerMode('mkt');
                          setIsPackerDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-[11px] font-bold uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-between ${packerMode === 'mkt' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' : 'text-slate-700 dark:text-slate-300'}`}
                      >
                        Packed & Marketed By
                        {packerMode === 'mkt' && <Check className="w-3 h-3" />}
                      </button>
                    </div>
                  )}

                  <input
                    type="text"
                    value={packerMode === 'mfg' ? (packaging.mfg_by ?? '') : (packaging.mkt_by ?? '')}
                    onChange={(e) => handlePackagingChange(packerMode === 'mfg' ? 'mfg_by' : 'mkt_by', e.target.value)}
                    placeholder="Company Name & Facility Address"
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 focus:outline-hidden dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Customer Care Helpline / Email
                  </label>
                  <input
                    type="text"
                    value={packaging.customer_care ?? ''}
                    onChange={(e) => handlePackagingChange('customer_care', e.target.value)}
                    placeholder="care@company.com | +91 9876543210"
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 focus:outline-hidden dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LIVE PREVIEWS (KOKANASTHA & FSSAI BOX) */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Eye size={14} className="text-indigo-500" />
                  Exact Thermal Sticker Print Output (Kokanastha Food Label Format)
                </span>
                <span className="text-[9px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                  Size: 100mm × 75mm / 100mm × 50mm Food Sticker
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                
                {/* 1. Kokanastha Full Food Sticker Preview */}
                <div className="p-4 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col items-center">
                  <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-wider mb-2">
                    🏷️ Kokanastha Master Sticker (With Barcode & Nutrition)
                  </span>

                  {/* Printable Sticker Simulation Box */}
                  <div className="w-[320px] bg-white text-black p-3 rounded-lg border-2 border-black shadow-lg font-sans flex flex-col justify-between select-none">
                    
                    {/* Header: Company & FSSAI + Veg Emblem */}
                    <div className="flex justify-between items-start border-b border-black pb-1 mb-1">
                      <div className="text-left">
                        <div className="text-[11px] font-black uppercase leading-tight tracking-wider text-black">
                          {businessName || 'KOKANASTHA'}
                        </div>
                        <div className="text-[7.5px] font-bold text-slate-700 leading-none">
                          Lic No. <b>{packaging.fssai_license || '11521018000123'}</b>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {packaging.dietary_type === 'veg' && (
                          <div className="w-4 h-4 border border-emerald-700 rounded-xs flex items-center justify-center bg-white shrink-0" title="100% Veg">
                            <div className="w-2 h-2 rounded-full bg-emerald-700" />
                          </div>
                        )}
                        {packaging.dietary_type === 'non_veg' && (
                          <div className="w-4 h-4 border border-rose-700 rounded-xs flex items-center justify-center bg-white shrink-0" title="Non-Veg">
                            <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[6px] border-b-rose-700" />
                          </div>
                        )}
                        <span className="text-[8px] font-black uppercase px-1 py-0.2 bg-black text-white rounded">
                          {packaging.net_weight || `${product.unit || '1 Pack'}`}
                        </span>
                      </div>
                    </div>

                    {/* Product Title & Batch */}
                    <div className="text-left my-0.5">
                      <div className="text-[11px] font-black uppercase tracking-tight leading-tight text-black line-clamp-1">
                        {product.name}
                      </div>
                      <div className="text-[7.5px] font-mono text-slate-800 flex justify-between">
                        <span>SKU: <b>{product.sku}</b></span>
                        <span>BATCH: <b>{packaging.batch_no || 'BAT-01'}</b></span>
                      </div>
                    </div>

                    {/* Crisp Barcode */}
                    <div className="my-1 flex items-center justify-center bg-white">
                      <ReactBarcode 
                        value={product.barcode || product.sku || '12345678'} 
                        height={26} 
                        width={1.15}
                        fontSize={8.5}
                        fontOptions="bold"
                        margin={0}
                        displayValue={true}
                        background="#ffffff"
                        lineColor="#000000"
                      />
                    </div>

                    {/* Pricing and Dates */}
                    <div className="w-full text-[8px] font-black text-black uppercase leading-tight border-t border-b border-black py-0.5 my-0.5">
                      <div className="flex justify-between items-center">
                        <span>MRP: <b>₹{product.mrp || product.selling_price}</b> <span className="text-[6.5px] font-normal">(Incl. of all taxes)</span></span>
                        <span className="text-black font-black">SALE: <b>₹{product.selling_price}</b></span>
                      </div>
                      <div className="flex justify-between items-center text-[7px] text-slate-800 mt-0.5 font-bold">
                        <span>PKD: {new Date().toISOString().split('T')[0]}</span>
                        <span>{packaging.best_before_text || 'Best Before 90 Days'}</span>
                      </div>
                    </div>

                    {/* Nutrition Facts Miniature Table */}
                    <div className="my-1 border border-black rounded-xs overflow-hidden">
                      <div className="bg-black text-white text-[7.5px] font-black uppercase px-1 py-0.5 flex justify-between">
                        <span>Nutrition Facts</span>
                        <span>Per {nutrition.serving_size || '100g'}</span>
                      </div>
                      <div className="w-full text-[7px] font-bold text-left divide-y divide-slate-300">
                        <div className="flex justify-between px-1 py-0.5">
                          <span>Energy / Calories</span>
                          <span className="font-mono font-black">{nutrition.energy_kcal || 0} kcal</span>
                        </div>
                        <div className="flex justify-between px-1 py-0.5 bg-slate-50">
                          <span>Protein</span>
                          <span className="font-mono">{nutrition.protein_g || 0}g</span>
                        </div>
                        <div className="flex justify-between px-1 py-0.5">
                          <span>Carbohydrates (Sugars: {nutrition.total_sugars_g || 0}g)</span>
                          <span className="font-mono">{nutrition.carbohydrates_g || 0}g</span>
                        </div>
                        <div className="flex justify-between px-1 py-0.5 bg-slate-50">
                          <span>Total Fat (Sat: {nutrition.saturated_fat_g || 0}g)</span>
                          <span className="font-mono">{nutrition.total_fat_g || 0}g</span>
                        </div>
                        <div className="flex justify-between px-1 py-0.5">
                          <span>Sodium</span>
                          <span className="font-mono">{nutrition.sodium_mg || 0}mg</span>
                        </div>
                      </div>
                    </div>

                    {/* Ingredients & Storage Footer */}
                    <div className="text-[6.5px] text-slate-800 text-left leading-tight space-y-0.5 mt-0.5">
                      <p className="line-clamp-2">
                        <b>Ing:</b> {packaging.ingredients || 'Ingredients list'}
                      </p>
                      {packaging.allergen_info && (
                        <p className="font-bold text-black line-clamp-1">
                          <b>Allergens:</b> {packaging.allergen_info}
                        </p>
                      )}
                      <div className="flex justify-between text-[6px] text-slate-600 pt-0.5 border-t border-slate-200">
                        <span>{packaging.storage_instructions || 'Store in cool dry place'}</span>
                        <span>Customer Care: {packaging.customer_care || 'Helpline'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Standard FSSAI / FDA Nutrition Facts Panel (B&W High Contrast) */}
                <div className="p-4 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col items-center">
                  <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2">
                    📋 Standard FSSAI / FDA Nutrition Panel
                  </span>

                  <div className="w-[280px] bg-white text-black p-3.5 rounded-lg border-4 border-black shadow-lg font-sans">
                    <h3 className="text-xl font-black tracking-tighter uppercase leading-none border-b-8 border-black pb-1">
                      Nutrition Facts
                    </h3>
                    
                    <div className="text-[9px] font-bold py-1 border-b border-black flex justify-between">
                      <span>Serving Size</span>
                      <span className="font-black">{nutrition.serving_size || '100g'}</span>
                    </div>

                    <div className="text-[8px] text-slate-600 pb-1 border-b-4 border-black flex justify-between">
                      <span>Servings Per Container</span>
                      <span>About {nutrition.servings_per_container || '1'}</span>
                    </div>

                    <div className="py-1 border-b-4 border-black flex justify-between items-baseline">
                      <div>
                        <div className="text-[8px] font-black uppercase text-slate-600">Amount Per Serving</div>
                        <div className="text-base font-black uppercase">Calories / Energy</div>
                      </div>
                      <div className="text-2xl font-black font-mono">
                        {nutrition.energy_kcal || 0}
                      </div>
                    </div>

                    <div className="text-[7.5px] text-right font-bold py-0.5 border-b border-black">
                      % Daily Value*
                    </div>

                    <div className="w-full text-[9px] divide-y divide-black font-sans">
                      <div className="flex justify-between py-1 font-bold">
                        <span>Total Fat <b className="font-mono">{nutrition.total_fat_g || 0}g</b></span>
                        <span className="font-mono">{Math.round(((nutrition.total_fat_g || 0) / 65) * 100)}%</span>
                      </div>
                      <div className="flex justify-between py-0.5 pl-3 text-[8px]">
                        <span>Saturated Fat <b className="font-mono">{nutrition.saturated_fat_g || 0}g</b></span>
                        <span className="font-mono">{Math.round(((nutrition.saturated_fat_g || 0) / 20) * 100)}%</span>
                      </div>
                      <div className="flex justify-between py-0.5 pl-3 text-[8px]">
                        <span>Trans Fat <b className="font-mono">{nutrition.trans_fat_g || 0}g</b></span>
                        <span className="font-mono">-</span>
                      </div>
                      <div className="flex justify-between py-1 font-bold">
                        <span>Cholesterol <b className="font-mono">{nutrition.cholesterol_mg || 0}mg</b></span>
                        <span className="font-mono">{Math.round(((nutrition.cholesterol_mg || 0) / 300) * 100)}%</span>
                      </div>
                      <div className="flex justify-between py-1 font-bold">
                        <span>Sodium <b className="font-mono">{nutrition.sodium_mg || 0}mg</b></span>
                        <span className="font-mono">{Math.round(((nutrition.sodium_mg || 0) / 2400) * 100)}%</span>
                      </div>
                      <div className="flex justify-between py-1 font-bold">
                        <span>Total Carbohydrate <b className="font-mono">{nutrition.carbohydrates_g || 0}g</b></span>
                        <span className="font-mono">{Math.round(((nutrition.carbohydrates_g || 0) / 300) * 100)}%</span>
                      </div>
                      <div className="flex justify-between py-0.5 pl-3 text-[8px]">
                        <span>Dietary Fiber <b className="font-mono">{nutrition.dietary_fiber_g || 0}g</b></span>
                        <span className="font-mono">{Math.round(((nutrition.dietary_fiber_g || 0) / 25) * 100)}%</span>
                      </div>
                      <div className="flex justify-between py-0.5 pl-3 text-[8px]">
                        <span>Total Sugars <b className="font-mono">{nutrition.total_sugars_g || 0}g</b></span>
                        <span className="font-mono">-</span>
                      </div>
                      <div className="flex justify-between py-0.5 pl-5 text-[7.5px] text-slate-600">
                        <span>Includes <b className="font-mono">{nutrition.added_sugars_g || 0}g</b> Added Sugars</span>
                        <span className="font-mono">{Math.round(((nutrition.added_sugars_g || 0) / 50) * 100)}%</span>
                      </div>
                      <div className="flex justify-between py-1 font-bold border-t-4 border-black">
                        <span>Protein <b className="font-mono">{nutrition.protein_g || 0}g</b></span>
                        <span className="font-mono">{Math.round(((nutrition.protein_g || 0) / 50) * 100)}%</span>
                      </div>
                    </div>

                    <div className="text-[6.5px] text-slate-500 pt-1 border-t border-black leading-tight">
                      * The % Daily Value (DV) tells you how much a nutrient in a serving of food contributes to a daily diet of 2,000 calories a day.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-slate-100 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {hasUnsavedChanges && (
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <Info size={13} />
                Unsaved changes
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 transition-colors cursor-pointer"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
            >
              <Save size={14} />
              <span>Save Nutrition & Food Info</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
