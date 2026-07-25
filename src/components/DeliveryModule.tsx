import { PageHeader } from './PageHeader';
import React, { useEffect, useState } from 'react';
import { 
  Truck, 
  Search, 
  MapPin, 
  CheckCircle2, 
  Calendar,
  Package,
  Phone,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { dbStore } from '../services/store';
import { SalesOrder, Customer, UserProfile, OrderStatus } from '../types/erp';

interface DeliveryModuleProps {
  businessId: string;
  user: UserProfile;
  triggerToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const DeliveryModule: React.FC<DeliveryModuleProps> = ({ 
  businessId, 
  user, 
  triggerToast
}) => {
  const [orders, setOrders] = useState<SalesOrder[]>(
    dbStore.getSalesOrders(businessId).filter(o => ['Packed', 'Dispatched', 'Delivered'].includes(o.status))
  );
  const [customers, setCustomers] = useState<Customer[]>(dbStore.getCustomers(businessId));
  const [searchQuery, setSearchQuery] = useState('');

  const reloadOrders = () => {
    setOrders(dbStore.getSalesOrders(businessId).filter(o => ['Packed', 'Dispatched', 'Delivered'].includes(o.status)));
  };
  useEffect(() => {
    return dbStore.subscribe(() => {
      setCustomers(dbStore.getCustomers(businessId));
      reloadOrders();
    });
  }, [businessId]);


  const [confirmingOrder, setConfirmingOrder] = useState<SalesOrder | null>(null);

  const handleUpdateStatus = (order: SalesOrder, newStatus: OrderStatus) => {
    if (newStatus === 'Delivered') {
      setConfirmingOrder(order);
      return;
    }
    performStatusUpdate(order, newStatus);
  };

  const performStatusUpdate = (order: SalesOrder, newStatus: OrderStatus) => {
    try {
      dbStore.updateSalesOrder(order.id, { 
        status: newStatus,
        delivery_status: newStatus
      });
      
      dbStore.logActivity(
        user.id,
        user.name,
        user.role,
        'Update Delivery Status',
        `Updated order ${order.order_number} delivery status to ${newStatus}`,
        businessId
      );

      triggerToast(`Order ${order.order_number} marked as ${newStatus}.`, 'success');
      reloadOrders();
    } catch (err: any) {
      triggerToast(err.message || 'Failed to update order status.', 'error');
    }
  };

  const filteredOrders = orders.filter(o => {
    const cust = customers.find(c => c.id === o.customer_id);
    return o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) || 
           (cust && cust.name.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  return (
    <div className="space-y-4 max-w-full pb-10 px-0 font-sans text-slate-900 dark:text-slate-100 overflow-x-hidden" id="delivery-module-root">
      <PageHeader
        title="Delivery & Dispatch Operations"
        subtitle="Manage orders that are ready for dispatch and track delivery fulfillment."
        icon={Truck}
        rightContent={
          <>

          </>
        }
      />

      <div className="px-4 sm:px-6 space-y-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs flex items-center gap-3">
        <Search size={16} className="text-slate-400" />
        <input 
          type="text" 
          placeholder="Search ready or dispatched orders by order number or customer..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent text-[11px] outline-hidden text-slate-800 dark:text-slate-100"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {filteredOrders.length === 0 ? (
           <div className="col-span-full text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
             <Package size={48} className="mx-auto text-slate-300 mb-3" />
             <p className="text-xs font-semibold text-slate-500">No orders ready for delivery.</p>
             <p className="text-[11px] text-slate-400 mt-1">Orders must be packed in the Packing Verification module first.</p>
           </div>
        ) : (
          filteredOrders.map((o, idx) => {
            const cust = customers.find(c => c.id === o.customer_id);
            const totalItems = (o.items || []).reduce((acc, it) => acc + (it.qty || 0), 0);
            
            return (
              <div key={`${o.id}-${idx}`} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col hover:border-indigo-200 dark:hover:border-indigo-900 transition-colors">
                <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50/50 dark:bg-slate-800/40">
                  <div>
                    <h3 className="font-black text-[13px] text-slate-950 dark:text-white leading-none tracking-tight">{o.order_number}</h3>
                    <p className="text-[9px] font-bold text-slate-400 flex items-center gap-1 mt-1.5 uppercase tracking-tighter">
                      <Calendar size={10} /> {o.order_date}
                    </p>
                  </div>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                    o.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                    o.status === 'Dispatched' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                    'bg-amber-50 text-amber-700 border-amber-100'
                  }`}>
                    {o.status.toUpperCase()}
                  </span>
                </div>
                
                <div className="p-3 flex-1 space-y-3.5">
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Destination</span>
                    <p className="text-[11px] font-bold text-slate-900 dark:text-slate-200 mt-0.5 truncate">{cust?.name}</p>
                    <div className="text-[10px] text-slate-500 mt-1 flex items-start gap-1.5 min-h-[32px]">
                      <MapPin size={12} className="mt-0.5 shrink-0 text-slate-400" />
                      <span className="leading-tight line-clamp-2">{cust?.shipping_address || 'No shipping address'}</span>
                    </div>
                    {cust?.phone && (
                      <div className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1.5">
                        <Phone size={11} className="text-slate-300" />
                        <span className="font-mono tracking-tighter">{cust.phone}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-slate-50/50 dark:bg-slate-800/30 rounded-lg p-2.5 border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter block mb-0.5">Package</span>
                      <strong className="text-[10px] font-black text-slate-700 dark:text-slate-300">{totalItems} {totalItems === 1 ? 'Unit' : 'Units'}</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter block mb-0.5">Value</span>
                      <strong className="text-[11px] font-black text-slate-950 dark:text-white">₹{o.total_amount.toLocaleString()}</strong>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                  {o.status === 'Packed' && (
                    <button 
                      onClick={() => handleUpdateStatus(o, 'Dispatched')}
                      className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black transition-all flex justify-center items-center gap-1.5 shadow-sm shadow-indigo-200 dark:shadow-none active:scale-[0.98]"
                    >
                      <Truck size={12} />
                      Dispatch Order
                    </button>
                  )}
                  {o.status === 'Dispatched' && (
                    <button 
                      onClick={() => handleUpdateStatus(o, 'Delivered')}
                      className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black transition-all flex justify-center items-center gap-1.5 shadow-sm shadow-emerald-200 dark:shadow-none active:scale-[0.98]"
                    >
                      <CheckCircle2 size={12} />
                      Confirm Delivery
                    </button>
                  )}
                  {o.status === 'Delivered' && (
                    <div className="w-full py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-lg text-[10px] font-black text-center flex justify-center items-center gap-1.5 cursor-default border border-slate-200 dark:border-slate-700">
                      <CheckCircle2 size={12} />
                      Delivered
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-xl border border-slate-200 dark:border-slate-800 p-6 animate-in zoom-in duration-150 flex flex-col max-h-[90vh]">
            <div className="flex flex-col items-center text-center overflow-y-auto flex-1">
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4 shrink-0">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-lg font-black text-slate-950 dark:text-white">Confirm Delivery</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Are you sure you want to mark order <span className="font-bold text-slate-900 dark:text-slate-200">{confirmingOrder.order_number}</span> as Delivered? This will update the stock ledger and close the delivery cycle.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3 w-full mt-6 shrink-0">
              <button
                onClick={() => setConfirmingOrder(null)}
                className="py-2 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-[11px] font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  performStatusUpdate(confirmingOrder, 'Delivered');
                  setConfirmingOrder(null);
                }}
                className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold transition-all shadow-sm shadow-emerald-200 dark:shadow-none cursor-pointer"
              >
                Yes, Delivered
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
  );
};
