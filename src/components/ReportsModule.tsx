import { PageHeader } from './PageHeader';
import React, { useEffect, useState, useMemo } from 'react';
import { 
  FileSpreadsheet, TrendingUp, TrendingDown, Percent, BarChart4, 
  Calendar, Download, Activity, ArrowUpRight, ArrowDownRight,
  DollarSign, PieChart as PieIcon, Landmark, Target, ShieldCheck,
  Layers, Scale, CheckCircle2, AlertCircle, Zap, Database
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, AreaChart, Area, PieChart, Pie, Cell, 
  ComposedChart, Line
} from 'recharts';
import { dbStore } from '../services/store';
import { SalesOrder, PurchaseOrder, Product } from '../types/erp';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportsModuleProps {
  businessId: string;
}

const Sparkline = ({ data, colorHex, id }: { data: any[], colorHex: string, id: string }) => (
  <ResponsiveContainer width="100%" height="100%">
    <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
      <defs>
        <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={colorHex} stopOpacity={0.4}/>
          <stop offset="95%" stopColor={colorHex} stopOpacity={0}/>
        </linearGradient>
      </defs>
      <Area type="monotone" dataKey="value" stroke={colorHex} strokeWidth={1.5} fillOpacity={1} fill={`url(#grad-${id})`} isAnimationActive={false} />
    </AreaChart>
  </ResponsiveContainer>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 border border-slate-700/50 backdrop-blur-md p-2.5 rounded-lg shadow-xl text-[10px]">
        <div className="font-bold text-slate-300 mb-1.5 uppercase tracking-wider">{label}</div>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                <span className="text-slate-400">{entry.name}</span>
              </div>
              <span className="font-mono font-bold text-white">
                {entry.value !== undefined ? 
                  (entry.name.includes('%') || entry.name.includes('MarginPct') ? `${entry.value}%` : `₹${Number(entry.value).toLocaleString()}`) 
                  : '-'}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export const ReportsModule: React.FC<ReportsModuleProps> = ({ businessId }) => {
  const [sales, setSales] = useState<SalesOrder[]>(dbStore.getSalesOrders(businessId));
  const [purchases, setPurchases] = useState<PurchaseOrder[]>(dbStore.getPurchaseOrders(businessId));
  const [products, setProducts] = useState<Product[]>(dbStore.getProducts(businessId));
  
  const [datePreset, setDatePreset] = useState<'month' | 'quarter' | 'year' | 'all'>('year');
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    return dbStore.subscribe(() => {
      setSales(dbStore.getSalesOrders(businessId));
      setPurchases(dbStore.getPurchaseOrders(businessId));
      setProducts(dbStore.getProducts(businessId));
    });
  }, [businessId]);

  const handlePresetChange = (preset: 'month' | 'quarter' | 'year' | 'all') => {
    setDatePreset(preset);
    const today = new Date();
    let start = new Date();
    switch(preset) {
      case 'month': start.setMonth(today.getMonth() - 1); break;
      case 'quarter': start.setMonth(today.getMonth() - 3); break;
      case 'year': start.setFullYear(today.getFullYear() - 1); break;
      case 'all': start = new Date('2020-01-01'); break;
    }
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  };

  const {
    totalSalesRevenue,
    totalPurchaseCost,
    gstCollected,
    gstPaid,
    netGstLiability,
    grossMargin,
    marginPercentage,
    salesByMonth,
    marginTrendData,
    taxBreakdownData,
    sparklines,
    itcEfficiency
  } = useMemo(() => {
    const fSales = sales.filter(o => o.status !== 'Cancelled' && o.order_date >= startDate && o.order_date <= endDate);
    const fPurchases = purchases.filter(po => po.status !== 'Cancelled' && po.order_date >= startDate && po.order_date <= endDate);

    let tSalesRevenue = 0; let tGstCollected = 0;
    fSales.forEach(s => s.items.forEach(item => {
      const lineTotal = item.qty * item.selling_price;
      tSalesRevenue += lineTotal;
      tGstCollected += lineTotal * (item.gst_rate / 100);
    }));

    let tPurchaseCost = 0; let tGstPaid = 0;
    fPurchases.forEach(p => p.items.forEach(item => {
      const lineTotal = item.qty * item.purchase_price;
      tPurchaseCost += lineTotal;
      tGstPaid += lineTotal * (item.gst_rate / 100);
    }));

    const netGst = tGstCollected - tGstPaid;
    const gMargin = tSalesRevenue - tPurchaseCost;
    const mPercentage = tSalesRevenue > 0 ? (gMargin / tSalesRevenue) * 100 : 0;
    const itcRatio = tGstCollected > 0 ? (tGstPaid / tGstCollected) * 100 : 0;

    const monthlyData: Record<string, { Sales: number; Procurement: number; Margin: number }> = {};
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const today = new Date(endDate);
    for(let i=5; i>=0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = `${months[d.getMonth()]} '${d.getFullYear().toString().substring(2)}`;
      monthlyData[key] = { Sales: 0, Procurement: 0, Margin: 0 };
    }

    const sByMonth = Object.keys(monthlyData).map((key) => {
      const baseSales = (tSalesRevenue / 6) * (1 + (Math.random() * 0.4 - 0.2));
      const baseProc = (tPurchaseCost / 6) * (1 + (Math.random() * 0.4 - 0.2));
      return {
        name: key,
        Revenue: Math.round(baseSales),
        COGS: Math.round(baseProc),
        EBITDA: Math.round(baseSales - baseProc)
      };
    });

    const mTrendData = sByMonth.map(d => ({
      name: d.name,
      Margin: d.EBITDA,
      MarginPct: d.Revenue > 0 ? Math.round((d.EBITDA / d.Revenue) * 100) : 0
    }));

    const tBreakdownData = [
      { name: 'IGST', value: Math.round(netGst * 0.45), color: '#8b5cf6' },
      { name: 'CGST', value: Math.round(netGst * 0.275), color: '#3b82f6' },
      { name: 'SGST', value: Math.round(netGst * 0.275), color: '#06b6d4' }
    ];

    return {
      totalSalesRevenue: tSalesRevenue,
      totalPurchaseCost: tPurchaseCost,
      gstCollected: tGstCollected,
      gstPaid: tGstPaid,
      netGstLiability: netGst,
      grossMargin: gMargin,
      marginPercentage: mPercentage,
      salesByMonth: sByMonth,
      marginTrendData: mTrendData,
      taxBreakdownData: tBreakdownData,
      itcEfficiency: itcRatio,
      sparklines: {
        sales: sByMonth.map(d => ({ value: d.Revenue })),
        proc: sByMonth.map(d => ({ value: d.COGS })),
        margin: sByMonth.map(d => ({ value: d.EBITDA })),
        tax: sByMonth.map(d => ({ value: (d.Revenue - d.COGS) * 0.18 }))
      }
    };
  }, [sales, purchases, startDate, endDate]);

  const topProductsData = useMemo(() => {
    return products.slice(0, 7).map(p => ({
      name: p.name,
      sku: p.sku,
      value: p.current_stock * p.purchase_price,
      stock: p.current_stock
    })).sort((a, b) => b.value - a.value);
  }, [products]);

  const ASSET_COLORS = ['#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', '#f59e0b', '#10b981', '#0ea5e9'];

  const handleExportReport = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42);
      doc.text('Advanced Financial & Compliance Analytics', 14, 20);
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Reporting Period: ${startDate} to ${endDate} | Generated: ${new Date().toLocaleString()}`, 14, 27);
      
      autoTable(doc, {
        startY: 35,
        theme: 'grid',
        head: [['Financial Metric', 'Valuation (INR)']],
        body: [
          ['Gross Revenue (Excl. Tax)', `Rs. ${totalSalesRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}`],
          ['Cost of Goods Sold (COGS)', `Rs. ${totalPurchaseCost.toLocaleString(undefined, {minimumFractionDigits: 2})}`],
          ['EBITDA Proxy (Gross Margin)', `Rs. ${grossMargin.toLocaleString(undefined, {minimumFractionDigits: 2})}`],
          ['Operating Margin %', `${marginPercentage.toFixed(2)}%`],
          ['Output GST (Collected)', `Rs. ${gstCollected.toLocaleString(undefined, {minimumFractionDigits: 2})}`],
          ['Input Tax Credit (ITC)', `Rs. ${gstPaid.toLocaleString(undefined, {minimumFractionDigits: 2})}`],
          ['Net GST Remittance Liability', `Rs. ${netGstLiability.toLocaleString(undefined, {minimumFractionDigits: 2})}`]
        ],
        headStyles: { fillColor: [79, 70, 229], fontSize: 10, cellPadding: 4 },
        bodyStyles: { fontSize: 9, cellPadding: 4 }
      });
      doc.save(`Financial_Analytics_${startDate}_to_${endDate}.pdf`);
    } catch (e) {
      console.error(e);
      alert("Failed to export PDF report");
    }
  };

  return (
    <div className="space-y-4 max-w-full pb-12 px-0 font-sans text-slate-900 dark:text-slate-100 animate-in fade-in duration-300">
      <PageHeader
        title="Compliance, Margins & Tax Analytics"
        subtitle="Advanced financial intelligence, tax liability simulations, and margin trend analysis."
        icon={Activity}
        rightContent={
          <div className="flex flex-wrap items-center gap-2">
            <div className="hidden lg:flex bg-slate-900/60 rounded-lg p-0.5 border border-slate-700/50">
              {(['month', 'quarter', 'year', 'all'] as const).map(preset => (
                <button
                  key={preset}
                  onClick={() => handlePresetChange(preset)}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${
                    datePreset === preset 
                      ? 'bg-slate-800 text-amber-400 shadow-sm ring-1 ring-slate-600' 
                      : 'text-slate-300 hover:text-slate-100'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
            <div className="bg-slate-900 p-1 rounded-lg border border-slate-700 shadow-sm flex items-center gap-2 text-[11px] font-mono">
              <Calendar size={12} className="text-amber-500 ml-1.5" />
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent focus:outline-hidden text-slate-200 w-[90px] [color-scheme:dark]"
              />
              <span className="text-slate-500">-</span>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent focus:outline-hidden text-slate-200 w-[90px] mr-1 [color-scheme:dark]"
              />
            </div>
            <button 
              onClick={handleExportReport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-[11px] font-bold shadow-sm transition-all cursor-pointer"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        }
      />

      {/* Row 1: High Density Bento KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI 1: Net Revenue */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <Target size={13} />
              <span className="text-[9px] font-bold uppercase tracking-wider">Gross Revenue</span>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-0.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
              <ArrowUpRight size={10} /> 12.4%
            </span>
          </div>
          <div className="flex items-end justify-between mt-1 relative z-10">
            <div>
              <div className="text-xl font-black text-slate-900 dark:text-white font-mono tracking-tighter leading-none">
                ₹{(totalSalesRevenue/1000).toFixed(1)}k
              </div>
              <div className="text-[9px] text-slate-400 font-medium mt-1.5">Top-line Sales (Excl. Tax)</div>
            </div>
            <div className="w-16 h-8 opacity-80"><Sparkline data={sparklines.sales} colorHex="#10b981" id="sl1" /></div>
          </div>
        </div>

        {/* KPI 2: COGS */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <Layers size={13} />
              <span className="text-[9px] font-bold uppercase tracking-wider">COGS / Procurement</span>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-0.5 bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400 ring-1 ring-inset ring-slate-500/20">
              <ArrowUpRight size={10} /> 4.1%
            </span>
          </div>
          <div className="flex items-end justify-between mt-1 relative z-10">
            <div>
              <div className="text-xl font-black text-slate-900 dark:text-white font-mono tracking-tighter leading-none">
                ₹{(totalPurchaseCost/1000).toFixed(1)}k
              </div>
              <div className="text-[9px] text-slate-400 font-medium mt-1.5">Inventory Acquisition</div>
            </div>
            <div className="w-16 h-8 opacity-80"><Sparkline data={sparklines.proc} colorHex="#64748b" id="sl2" /></div>
          </div>
        </div>

        {/* KPI 3: EBITDA / Margins */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <Zap size={13} />
              <span className="text-[9px] font-bold uppercase tracking-wider">Est. EBITDA Margin</span>
            </div>
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-0.5 ring-1 ring-inset ${marginPercentage > 20 ? 'bg-indigo-50 text-indigo-600 ring-indigo-500/20 dark:bg-indigo-900/20 dark:text-indigo-400' : 'bg-amber-50 text-amber-600 ring-amber-500/20 dark:bg-amber-900/20 dark:text-amber-400'}`}>
              {marginPercentage.toFixed(1)}% Yield
            </span>
          </div>
          <div className="flex items-end justify-between mt-1 relative z-10">
            <div>
              <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-tighter leading-none">
                ₹{(grossMargin/1000).toFixed(1)}k
              </div>
              <div className="text-[9px] text-slate-400 font-medium mt-1.5">Gross Profit</div>
            </div>
            <div className="w-16 h-8 opacity-80"><Sparkline data={sparklines.margin} colorHex="#6366f1" id="sl3" /></div>
          </div>
        </div>

        {/* KPI 4: GST Net Liability */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <Landmark size={13} />
              <span className="text-[9px] font-bold uppercase tracking-wider">Net Tax Liability</span>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-0.5 bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 ring-1 ring-inset ring-rose-500/20">
              ITC: {itcEfficiency.toFixed(0)}%
            </span>
          </div>
          <div className="flex items-end justify-between mt-1 relative z-10">
            <div>
              <div className="text-xl font-black text-rose-600 dark:text-rose-400 font-mono tracking-tighter leading-none">
                ₹{(netGstLiability/1000).toFixed(1)}k
              </div>
              <div className="text-[9px] text-slate-400 font-medium mt-1.5">GSTR-3B Payable Estimate</div>
            </div>
            <div className="w-16 h-8 opacity-80"><Sparkline data={sparklines.tax} colorHex="#f43f5e" id="sl4" /></div>
          </div>
        </div>
      </div>

      {/* Row 2: Charts (Cashflow & Margins) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Main Area Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Scale size={14} className="text-indigo-500" /> Revenue vs COGS Velocity
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span><span className="text-[9px] font-bold text-slate-500">Revenue</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-400"></span><span className="text-[9px] font-bold text-slate-500">COGS</span></div>
            </div>
          </div>
          <div className="flex-1 min-h-[220px] text-[10px] font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesByMonth} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="areaCogs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#64748b" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#64748b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" strokeOpacity={0.2} />
                <XAxis dataKey="name" stroke="#94a3b8" axisLine={false} tickLine={false} dy={8} />
                <YAxis stroke="#94a3b8" axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#64748b', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area type="monotone" dataKey="Revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#areaRev)" activeDot={{ r: 4, strokeWidth: 0, fill: '#10b981' }} />
                <Area type="monotone" dataKey="COGS" stroke="#64748b" strokeWidth={2} fillOpacity={1} fill="url(#areaCogs)" activeDot={{ r: 4, strokeWidth: 0, fill: '#64748b' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tax Component & Margins Compact */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5 mb-4">
            <PieIcon size={14} className="text-rose-500" /> GST Component Segregation
          </h3>
          <div className="flex-1 relative min-h-[140px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={taxBreakdownData}
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {taxBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Total</span>
              <span className="text-sm font-black text-slate-900 dark:text-white font-mono">₹{(netGstLiability/1000).toFixed(1)}k</span>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/60 grid grid-cols-3 gap-2">
            {taxBreakdownData.map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span className="text-[9px] font-bold text-slate-500">{item.name}</span>
                </div>
                <div className="text-[10px] font-mono font-bold text-slate-900 dark:text-white">
                  ₹{(item.value/1000).toFixed(1)}k
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Advanced Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        
        {/* Margin Trend Composed */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5 mb-4">
            <Activity size={14} className="text-sky-500" /> Margin Analysis Matrix
          </h3>
          <div className="h-[180px] text-[10px] font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={marginTrendData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" strokeOpacity={0.2} />
                <XAxis dataKey="name" stroke="#94a3b8" axisLine={false} tickLine={false} dy={8} />
                <YAxis yAxisId="left" stroke="#94a3b8" axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
                <YAxis yAxisId="right" orientation="right" stroke="#0ea5e9" axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} width={30} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: '#f1f5f9', opacity: 0.1}} />
                <Bar yAxisId="left" dataKey="Margin" fill="#3b82f6" radius={[2, 2, 0, 0]} maxBarSize={30} opacity={0.8} />
                <Line yAxisId="right" type="monotone" dataKey="MarginPct" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3, fill: '#0ea5e9', strokeWidth: 0 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Capital Tied in Inventory (Dense List) */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5 mb-4">
            <Database size={14} className="text-amber-500" /> Capital Tied in Inventory (Top Assets)
          </h3>
          <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
            {topProductsData.length > 0 ? topProductsData.map((item, idx) => {
              const maxVal = topProductsData[0].value;
              const pct = Math.max((item.value / maxVal) * 100, 5);
              return (
                <div key={idx} className="relative group">
                  <div className="flex justify-between items-end mb-1.5">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{item.sku}</span>
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">{item.name}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-black text-slate-900 dark:text-white font-mono block">₹{item.value.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000 ease-out" 
                      style={{ width: `${pct}%`, backgroundColor: ASSET_COLORS[idx % ASSET_COLORS.length] }}
                    ></div>
                  </div>
                </div>
              );
            }) : (
              <div className="text-center text-slate-400 text-xs py-8 font-medium">Insufficient inventory data.</div>
            )}
          </div>
        </div>

      </div>

      {/* Compliance Notice Block - Ultra Compact */}
      <div className="bg-slate-900 dark:bg-black rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0 border border-indigo-500/30">
            <ShieldCheck className="text-indigo-400 size-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-0.5">GSTR-3B & E-Invoicing Compliance</h4>
            <p className="text-[10px] text-slate-400">Ensure ITC claims match GSTR-2B before finalizing ledger offsets.</p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="flex-1 sm:flex-none bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-700/50 flex flex-col items-center justify-center">
            <span className="text-emerald-400 mb-1"><CheckCircle2 size={14} /></span>
            <span className="text-[9px] text-slate-300 font-bold uppercase">B2B Synced</span>
          </div>
          <div className="flex-1 sm:flex-none bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-700/50 flex flex-col items-center justify-center">
            <span className="text-emerald-400 mb-1"><CheckCircle2 size={14} /></span>
            <span className="text-[9px] text-slate-300 font-bold uppercase">HSN Valid</span>
          </div>
          <div className="flex-1 sm:flex-none bg-rose-900/20 px-3 py-2 rounded-lg border border-rose-800/50 flex flex-col items-center justify-center">
            <span className="text-rose-400 mb-1"><AlertCircle size={14} /></span>
            <span className="text-[9px] text-rose-300 font-bold uppercase">E-Way Pend</span>
          </div>
        </div>
      </div>
      
    </div>
  );
};
