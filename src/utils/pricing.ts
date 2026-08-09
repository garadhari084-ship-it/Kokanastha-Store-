import { Product, Customer, SalesItem, Business } from '../types/erp';

export interface PriceCalculationResult {
  appliedPrice: number;
  normalRate: number;
  rateType: 'LMR' | 'ABR' | 'DDR' | 'NR';
  rateReason: string;
  unitSavings: number;
}

export function isLoyalMember(customer?: Customer | null): boolean {
  if (!customer) return false;
  if (customer.is_loyal_member) return true;
  if (customer.loyalty_tier === 'Gold' || customer.loyalty_tier === 'Platinum') return true;
  if (customer.group && (customer.group.toLowerCase().includes('loyal') || customer.group.toLowerCase().includes('member'))) return true;
  return false;
}

export function isDdrDateActive(business?: Business | null, checkDateStr?: string): boolean {
  if (!business || !business.enable_ddr) return false;
  if (!business.ddr_start_date || !business.ddr_end_date) return true; // Enabled without strict date restriction

  const targetDate = checkDateStr ? new Date(checkDateStr) : new Date();
  const startDate = new Date(business.ddr_start_date + 'T00:00:00');
  const endDate = new Date(business.ddr_end_date + 'T23:59:59');

  return targetDate >= startDate && targetDate <= endDate;
}

export function calculateApplicablePrice(
  product: Product,
  options: {
    isLoyalMember?: boolean;
    isAdvanceBooking?: boolean;
    isDiwaliSale?: boolean;
    business?: Business | null;
    orderDate?: string;
  }
): PriceCalculationResult {
  const normalRate = typeof product.selling_price === 'number' && !isNaN(product.selling_price) 
    ? product.selling_price 
    : (typeof product.rate_nr === 'number' && !isNaN(product.rate_nr) ? product.rate_nr : 0);

  // Priority Order for special pricing:
  // 1. Loyal Member -> LMR (if set)
  // 2. Advance Booking -> ABR (if set)
  // 3. Festive / Diwali Sale -> DDR (if set)
  // 4. Fallback -> NR (Normal Rate)
  const hasLmr = typeof product.rate_lmr === 'number' && !isNaN(product.rate_lmr) && product.rate_lmr > 0;
  const hasAbr = typeof product.rate_abr === 'number' && !isNaN(product.rate_abr) && product.rate_abr > 0;
  const hasDdr = typeof product.rate_ddr === 'number' && !isNaN(product.rate_ddr) && product.rate_ddr > 0;

  const isDdrActive = Boolean(options.isDiwaliSale) || (Boolean(options.business?.enable_ddr) && isDdrDateActive(options.business, options.orderDate));

  // Priority Order when setting Diwali Discount Rate (DDR) Auto-Festival Pricing is ON:
  // 1. Loyal Member -> LMR (if updated in product)
  // 2. Advance Booking -> ABR (if updated in product)
  // 3. Diwali Sale -> DDR (if updated in product)
  // 4. Fallback -> NR
  if (options.isLoyalMember && hasLmr) {
    const lmr = product.rate_lmr!;
    const unitSavings = Math.max(0, normalRate - lmr);
    return {
      appliedPrice: lmr,
      normalRate,
      rateType: 'LMR',
      rateReason: 'Loyal Membership Discount',
      unitSavings
    };
  }

  if (options.isAdvanceBooking && hasAbr) {
    const abr = product.rate_abr!;
    const unitSavings = Math.max(0, normalRate - abr);
    return {
      appliedPrice: abr,
      normalRate,
      rateType: 'ABR',
      rateReason: 'Advance Booking Benefit',
      unitSavings
    };
  }

  if (isDdrActive && hasDdr) {
    const ddr = product.rate_ddr!;
    const unitSavings = Math.max(0, normalRate - ddr);
    return {
      appliedPrice: ddr,
      normalRate,
      rateType: 'DDR',
      rateReason: 'Diwali Festival Discount (DDR)',
      unitSavings
    };
  }

  return {
    appliedPrice: normalRate,
    normalRate,
    rateType: 'NR',
    rateReason: 'Normal Rate',
    unitSavings: 0
  };
}

export function calculateOrderSavings(items: SalesItem[], products: Product[]) {
  let totalNormalAmount = 0;
  let totalAppliedAmount = 0;
  let totalSavings = 0;
  
  const reasons: Set<string> = new Set();
  const rateTypes: Set<string> = new Set();

  items.forEach(it => {
    const p = products.find(prod => prod.id === it.product_id);
    const qty = Number(it.qty) || 0;
    const normalRate = typeof it.normal_rate === 'number' && !isNaN(it.normal_rate) && it.normal_rate > 0
      ? it.normal_rate
      : (p ? (typeof p.selling_price === 'number' ? p.selling_price : 0) : Number(it.selling_price) || 0);
    
    const appliedRate = Number(it.selling_price) || 0;
    const lineNormal = qty * normalRate;
    const lineApplied = qty * appliedRate;

    totalNormalAmount += lineNormal;
    totalAppliedAmount += lineApplied;
    
    if (it.rate_reason && lineNormal > lineApplied) {
      reasons.add(it.rate_reason);
    }
    if (it.rate_type) {
      rateTypes.add(it.rate_type);
    }
  });

  totalSavings = Math.max(0, totalNormalAmount - totalAppliedAmount);

  let primaryType = 'NR';
  if (rateTypes.has('LMR')) primaryType = 'LMR';
  else if (rateTypes.has('ABR')) primaryType = 'ABR';
  else if (rateTypes.has('DDR')) primaryType = 'DDR';

  let bannerMessage = '';
  if (totalSavings > 0) {
    if (primaryType === 'LMR') {
      bannerMessage = `You Saved ₹${totalSavings.toLocaleString()} because you are a Loyal Member.`;
    } else if (primaryType === 'ABR') {
      bannerMessage = `Advance Booking Benefit: You Saved ₹${totalSavings.toLocaleString()}`;
    } else if (primaryType === 'DDR') {
      bannerMessage = `Diwali Festival Savings: ₹${totalSavings.toLocaleString()}`;
    } else {
      bannerMessage = `Total Savings: ₹${totalSavings.toLocaleString()}`;
    }
  }

  return {
    totalNormalAmount,
    totalAppliedAmount,
    totalSavings,
    reasons: Array.from(reasons),
    primaryType,
    bannerMessage
  };
}
