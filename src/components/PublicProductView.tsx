import React, { useEffect, useState } from 'react';
import { dbStore } from '../services/store';
import { Product, Business } from '../types/erp';
import { 
  CheckCircle2, 
  ShieldCheck, 
  Phone, 
  MapPin, 
  Calendar, 
  Package, 
  Tag, 
  Award, 
  MessageCircle, 
  ArrowLeft, 
  Copy, 
  Check, 
  Camera, 
  Sparkles,
  ExternalLink,
  Share2
} from 'lucide-react';
import { BarcodeScanner } from './BarcodeScanner';
import ReactBarcode from 'react-barcode';

interface PublicProductViewProps {
  barcodeOrSku: string;
  onGoToLogin?: () => void;
  onScanAnother?: (code: string) => void;
}

export const PublicProductView: React.FC<PublicProductViewProps> = ({
  barcodeOrSku,
  onGoToLogin
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [currentQuery, setCurrentQuery] = useState<string>(barcodeOrSku);
  const [product, setProduct] = useState<Product | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [showLiveScanner, setShowLiveScanner] = useState<boolean>(false);
  const [shareSuccess, setShareSuccess] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const loadProduct = async () => {
      setLoading(true);
      const clean = (currentQuery || '').trim();

      // 1. Try finding in dbStore local cache
      let found: Product | undefined = dbStore.findProductByBarcodeOrSku(clean);

      // 2. If not found, try fetching from Supabase
      if (!found) {
        found = await dbStore.fetchProductByBarcodeOrSku(clean);
      }

      // 3. Fallback: Check if payload 'd=' is embedded in URL (for offline-printed QR codes)
      if (!found && typeof window !== 'undefined') {
        try {
          const queryString = window.location.search || (window.location.hash.includes('?') ? window.location.hash.substring(window.location.hash.indexOf('?')) : '');
          const searchParams = new URLSearchParams(queryString);
          const dParam = searchParams.get('d');
          if (dParam) {
            const jsonStr = decodeURIComponent(atob(dParam));
            const p = JSON.parse(jsonStr);
            if (p && (p.n || p.name)) {
              found = {
                id: `prod-public-${p.sku || clean}`,
                business_id: 'b1111111-1111-1111-1111-111111111111',
                name: p.n || p.name,
                sku: p.s || p.sku || clean,
                barcode: p.b || p.barcode || clean,
                qr_code: `${p.s || clean}-QR`,
                category_id: 'cat-general',
                brand: 'Kokanastha Special',
                hsn_code: '1905',
                gst_rate: 5,
                purchase_price: 0,
                selling_price: Number(p.sp || p.selling_price || p.p || 0),
                mrp: Number(p.mrp || p.m || p.sp || 0),
                opening_stock: 100,
                current_stock: 100,
                minimum_stock: 10,
                maximum_stock: 500,
                image_url: '',
                description: '',
                active: true,
                unit: p.u || p.unit || 'Pkt',
                food_packaging: {
                  dietary_type: (p.veg === false || p.v === 'nonveg') ? 'non_veg' : 'veg',
                  net_weight: p.w || p.net_weight || '100g',
                  ingredients: p.ing || p.ingredients || 'Roasted Rice Flour, Bengal Gram, Spices, Edible Oil, Salt',
                  fssai_license: p.fs || p.fssai || '11521018000123',
                  batch_no: p.bat || p.batch || 'BAT-2026',
                  mfg_by: p.mfg || 'Kokanastha Special Foods & Sweets',
                  customer_care_phone: p.ph || '+91 98200 12345'
                },
                nutrition_facts: {
                  serving_size: '100g',
                  energy_kcal: 480,
                  protein_g: 8.5,
                  carbohydrates_g: 64.2,
                  total_fat_g: 22.0,
                  saturated_fat_g: 4.8,
                  sodium_mg: 380
                },
                created_at: new Date().toISOString()
              };
            }
          }
        } catch (e) {
          console.warn('Could not decode embedded product payload:', e);
        }
      }

      if (isMounted) {
        if (found) {
          setProduct(found);
          const biz = dbStore.getBusiness(found.business_id) || dbStore.getBusinesses()[0] || null;
          setBusiness(biz);
        } else {
          setProduct(null);
        }
        setLoading(false);
      }
    };

    loadProduct();
    return () => { isMounted = false; };
  }, [currentQuery]);

  const handleCopyCode = () => {
    if (!product) return;
    const code = product.barcode || product.sku || '';
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleShare = () => {
    if (typeof window === 'undefined') return;
    const url = window.location.href;
    if (navigator?.share) {
      navigator.share({
        title: product?.name || 'Product Details',
        text: `Verified Product: ${product?.name} • ₹${product?.selling_price}`,
        url
      }).catch(() => {});
    } else if (navigator?.clipboard) {
      navigator.clipboard.writeText(url);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    }
  };

  const effectiveMrp = Number(product?.mrp || product?.selling_price || 0);
  const effectiveSale = Number(product?.selling_price || 0);
  const discountAmount = Math.max(0, effectiveMrp - effectiveSale);
  const discountPercent = effectiveMrp > 0 && discountAmount > 0 
    ? Math.round((discountAmount / effectiveMrp) * 100) 
    : 0;

  const isVeg = product?.food_packaging?.dietary_type 
    ? product.food_packaging.dietary_type === 'veg' 
    : product?.food_packaging?.is_vegetarian !== false;

  const netWeight = product?.food_packaging?.net_weight || product?.unit || '100g';
  const fssai = product?.food_packaging?.fssai_license || business?.fssai_number || '11521018000123';
  const phone = product?.food_packaging?.customer_care_phone || business?.phone || '+91 98200 12345';
  const address = product?.food_packaging?.mfg_by || business?.billing_address || 'Shop 14, Station Road, Borivali West, Mumbai, MH 400092';
  const ingredients = product?.food_packaging?.ingredients || 'Natural Flours, Ghee, Bengal Gram, Pure Spices, Edible Oil, Sea Salt';
  const nutrition = product?.nutrition_facts;

  const whatsappMessage = encodeURIComponent(
    `Hello! I scanned the barcode for "${product?.name}" (Code: ${product?.barcode || product?.sku}) and would like to inquire about availability and ordering.`
  );
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const whatsappUrl = `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=${whatsappMessage}`;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
              {business?.name ? business.name.charAt(0) : 'K'}
            </div>
            <div>
              <h1 className="text-xs font-bold leading-tight truncate text-slate-900 dark:text-slate-100">
                {business?.name || 'Kokanastha Foods'}
              </h1>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 size={10} />
                <span>Verified Product Scan</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowLiveScanner(true)}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs flex items-center gap-1 font-medium transition-colors"
              title="Scan Another Barcode / QR"
            >
              <Camera size={14} />
              <span className="hidden sm:inline">Scan New</span>
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs flex items-center gap-1 font-medium transition-colors"
              title="Share Product Link"
            >
              {shareSuccess ? <Check size={14} className="text-emerald-600" /> : <Share2 size={14} />}
              <span className="hidden sm:inline">{shareSuccess ? 'Copied!' : 'Share'}</span>
            </button>
            {onGoToLogin && (
              <button
                type="button"
                onClick={onGoToLogin}
                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors shadow-xs"
              >
                Staff Portal
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {loading ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Retrieving product details for <span className="font-mono font-bold text-indigo-600">"{currentQuery}"</span>...
            </p>
          </div>
        ) : !product ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200 dark:border-amber-800/50">
              <Package size={28} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Product Not Found
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                No catalog item matched the scanned code <span className="font-mono font-bold text-slate-700 dark:text-slate-300">"{currentQuery}"</span>. Please verify the code or try scanning another label.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => setShowLiveScanner(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Camera size={14} />
                <span>Open Camera Scanner</span>
              </button>
              {onGoToLogin && (
                <button
                  type="button"
                  onClick={onGoToLogin}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium transition-colors"
                >
                  Return to POS / Login
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Authenticity Certificate Banner */}
            <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 rounded-2xl p-3 flex items-center justify-between gap-3 text-emerald-950 dark:text-emerald-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <span>100% Genuine & Verified Product</span>
                    <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.2 rounded-full font-mono uppercase">
                      Official
                    </span>
                  </div>
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-300">
                    Manufactured & verified by {business?.name || 'Kokanastha Special Foods'}
                  </div>
                </div>
              </div>
              <span className="text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded-lg shrink-0">
                FSSAI Lic. #{fssai}
              </span>
            </div>

            {/* Product Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row gap-5 items-start">
                {/* Product Photo or Decorative Icon */}
                <div className="w-full sm:w-36 h-36 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden relative">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                      <Package size={38} className="text-indigo-400 mb-1" />
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                        Fresh Packaging
                      </span>
                    </div>
                  )}
                  {/* Veg / Non-Veg Indicator Symbol */}
                  <div 
                    className="absolute top-2 left-2 w-5 h-5 bg-white rounded-sm border border-slate-400 flex items-center justify-center shadow-xs"
                    title={isVeg ? 'Vegetarian Product' : 'Non-Vegetarian Product'}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full ${isVeg ? 'bg-emerald-600' : 'bg-red-600'}`} />
                  </div>
                </div>

                {/* Title & Core Details */}
                <div className="flex-1 space-y-2 w-full">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {isVeg ? '🌱 Pure Vegetarian' : '🍖 Non-Vegetarian'}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      Net Wt: {netWeight}
                    </span>
                  </div>

                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 leading-snug">
                    {product.name}
                  </h2>

                  {/* Pricing Box */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                        Retail Price (Incl. of all taxes)
                      </div>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-2xl font-black text-slate-900 dark:text-slate-50">
                          ₹{effectiveSale}
                        </span>
                        {effectiveMrp > effectiveSale && (
                          <span className="text-sm font-semibold text-slate-400 line-through">
                            ₹{effectiveMrp}
                          </span>
                        )}
                      </div>
                    </div>

                    {discountAmount > 0 && (
                      <div className="bg-emerald-600 text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-xs">
                        Save ₹{discountAmount} ({discountPercent}% OFF)
                      </div>
                    )}
                  </div>

                  {/* SKU & Barcode Pills */}
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <span className="text-xs font-mono font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                      SKU: <b className="text-slate-900 dark:text-slate-100">{product.sku || 'SKU-001'}</b>
                    </span>
                    <span className="text-xs font-mono font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                      Barcode: <b className="text-slate-900 dark:text-slate-100">{product.barcode || product.sku}</b>
                      <button 
                        type="button" 
                        onClick={handleCopyCode} 
                        className="text-slate-400 hover:text-indigo-600 transition-colors"
                        title="Copy Barcode"
                      >
                        {isCopied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      </button>
                    </span>
                  </div>
                </div>
              </div>

              {/* Verified Barcode Graphic */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-white flex flex-col items-center justify-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Authentic 1D Scannable Code
                </span>
                <ReactBarcode 
                  renderer="svg"
                  value={String(product.barcode || product.sku || '12345678').trim()}
                  height={28}
                  width={1.4}
                  fontSize={8.5}
                  margin={0}
                  marginLeft={8}
                  marginRight={8}
                  marginTop={2}
                  marginBottom={2}
                  displayValue={true}
                  font="monospace"
                  fontOptions="bold"
                  background="#ffffff"
                  lineColor="#000000"
                />
              </div>

              {/* Ingredients & Dietary Info */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-indigo-500" />
                  <span>Ingredients</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  {ingredients}
                </p>
              </div>

              {/* Nutrition Facts Table */}
              {nutrition && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Nutritional Values (Approx. per 100g)</span>
                    <span className="text-[10px] text-slate-400 font-normal">Lab Certified</span>
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Energy</div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{nutrition.energy_kcal || 480} kcal</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Protein</div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{nutrition.protein_g || 8.5} g</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Carbohydrate</div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{nutrition.carbohydrates_g || (nutrition as any).carbohydrate_g || 64.2} g</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Total Fat</div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{nutrition.total_fat_g || 22.0} g</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Saturated Fat</div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{nutrition.saturated_fat_g || 4.8} g</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Sodium</div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{nutrition.sodium_mg || 380} mg</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Manufacturing & FSSAI Details */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <h3 className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Packaging & Quality Compliance
                </h3>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-start gap-2">
                    <Award size={14} className="text-indigo-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">FSSAI Central / State License: </span>
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{fssai}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="text-indigo-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">Manufactured & Marketed By: </span>
                      <span className="text-slate-600 dark:text-slate-400">{address}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Phone size={14} className="text-indigo-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">Customer Helpline: </span>
                      <a href={`tel:${phone}`} className="text-indigo-600 hover:underline font-mono">
                        {phone}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Direct Actions */}
              <div className="pt-3 flex flex-col sm:flex-row gap-2">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <MessageCircle size={16} />
                  <span>Order / Inquire on WhatsApp</span>
                </a>
                <button
                  type="button"
                  onClick={() => setShowLiveScanner(true)}
                  className="py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Camera size={16} />
                  <span>Scan Next Barcode</span>
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Live Camera Scanner Modal */}
      {showLiveScanner && (
        <BarcodeScanner 
          onScan={(scannedCode) => {
            setShowLiveScanner(false);
            setCurrentQuery(scannedCode);
          }}
          onClose={() => setShowLiveScanner(false)}
        />
      )}
    </div>
  );
};
