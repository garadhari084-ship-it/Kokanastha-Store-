import React, { useEffect, useState } from 'react';
import { dbStore } from '../services/store';
import { SalesOrder, Customer, Business, Product } from '../types/erp';
import { BillOfSupplyView } from './BillOfSupplyView';
import { Printer, MessageCircle, LogIn, ArrowLeft, ShieldCheck, CheckCircle, AlertCircle, Clock, Package, Truck, Sparkles } from 'lucide-react';
import { formatWhatsAppPhone, formatDisplayPhone } from '../utils/formatters';

interface PublicInvoiceViewProps {
  orderNumber: string;
  onGoToLogin?: () => void;
}

export const PublicInvoiceView: React.FC<PublicInvoiceViewProps> = ({
  orderNumber,
  onGoToLogin
}) => {
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<SalesOrder | null>(null);
  const [customer, setCustomer] = useState<Customer | undefined>(undefined);
  const [business, setBusiness] = useState<Business | undefined>(undefined);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchOrder = async () => {
      setLoading(true);
      const found = await dbStore.findSalesOrderByNumber(orderNumber);
      if (isMounted) {
        if (found) {
          setOrder(found);
          const biz = dbStore.getBusiness(found.business_id) || dbStore.getBusinesses()[0];
          setBusiness(biz);
          const custs = dbStore.getCustomers(found.business_id);
          const cust = custs.find(c => c.id === found.customer_id || (c.name && c.name.toLowerCase() === (found.customer_name || '').toLowerCase()));
          setCustomer(cust);
          const prods = dbStore.getProducts(found.business_id);
          setProducts(prods);
        } else {
          setOrder(null);
        }
        setLoading(false);
      }
    };

    fetchOrder();

    return () => {
      isMounted = false;
    };
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-700 dark:text-slate-300">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-bold tracking-wide">Loading Invoice #{orderNumber}...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-md w-full text-center shadow-xl space-y-4">
          <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle size={32} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Invoice Not Found</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              We couldn't find an order with invoice reference <span className="font-mono font-bold text-slate-700 dark:text-slate-200">#{orderNumber}</span>.
            </p>
          </div>

          <div className="pt-4 flex flex-col gap-2">
            <button
              onClick={() => {
                if (onGoToLogin) {
                  onGoToLogin();
                } else {
                  window.location.href = window.location.origin;
                }
              }}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20"
            >
              <LogIn size={16} /> Open Business Portal / Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  const storePhone = business?.phone || '9820769697';
  const cleanStorePhone = formatWhatsAppPhone(storePhone);

  const getStatusBadge = () => {
    switch (order.status) {
      case 'Delivered':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300"><CheckCircle size={14} /> Delivered</span>;
      case 'Dispatched':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300"><Truck size={14} /> Out For Delivery</span>;
      case 'Packed':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300"><Package size={14} /> Packed & Ready</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300"><Clock size={14} /> Order Confirmed</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 py-6 px-2 sm:px-4 print:bg-white print:p-0">
      {/* Top Floating Bar (Hidden in Print) */}
      <div className="max-w-2xl mx-auto mb-4 print:hidden flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-md">
        <div className="flex items-center gap-2">
          {onGoToLogin && (
            <button
              onClick={onGoToLogin}
              className="p-2 text-slate-500 hover:text-indigo-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Staff Login"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">Verified Customer Invoice</span>
            <h1 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              {business?.name || 'KOKANASTHA'} <ShieldCheck size={14} className="text-emerald-500 inline" />
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Printer size={15} /> <span className="hidden sm:inline">Print / Save PDF</span>
          </button>
          <a
            href={`https://wa.me/${cleanStorePhone}?text=${encodeURIComponent(`Hello, I have an inquiry regarding my order ${order.order_number}`)}`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <MessageCircle size={15} /> <span className="hidden sm:inline">Support</span>
          </a>
        </div>
      </div>

      {/* Customer Status Banner */}
      <div className="max-w-2xl mx-auto mb-4 print:hidden bg-gradient-to-br from-indigo-900 to-indigo-950 text-white rounded-2xl p-4 shadow-lg border border-indigo-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-widest text-indigo-300 block">Status Overview</span>
          <div className="flex items-center gap-2 mt-1">
            {getStatusBadge()}
            {order.payment_status === 'Paid' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500 text-white"><CheckCircle size={12} /> Paid</span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-500 text-white">Payment Due</span>
            )}
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-indigo-300 uppercase block font-mono">Invoice Number</span>
          <span className="font-mono text-base font-black text-white">{order.order_number}</span>
        </div>
      </div>

      {/* Main Bill of Supply Sheet */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden print:shadow-none">
        <BillOfSupplyView
          order={order}
          customer={customer}
          businessObj={business}
          products={products}
        />
      </div>

      {/* Footer Navigation (Hidden in Print) */}
      <div className="max-w-2xl mx-auto mt-6 print:hidden flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-indigo-500" />
          <span>Kokanastha Store Customer Portal</span>
        </div>
        <button
          onClick={() => {
            if (onGoToLogin) {
              onGoToLogin();
            } else {
              window.location.href = window.location.origin;
            }
          }}
          className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
        >
          <LogIn size={14} /> Staff / Business Portal Sign In
        </button>
      </div>
    </div>
  );
};
