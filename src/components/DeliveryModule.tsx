import { PageHeader } from './PageHeader';
import React, { useState } from 'react';
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
  const [customers] = useState<Customer[]>(dbStore.getCustomers(businessId));
  const [searchQuery, setSearchQuery] = useState('');

  const reloadOrders = () => {
    setOrders(dbStore.getSalesOrders(businessId).filter(o => ['Packed', 'Dispatched', 'Delivered'].includes(o.status)));
  };

  const handleUpdateStatus = (order: SalesOrder, newStatus: OrderStatus) => {
    if (newStatus === 'Delivered') {
      const confirmed = window.confirm(`Mark order ${order.order_number} as Delivered?`);
      if (!confirmed) return;
    }

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
    <div className="space-y-6 max-w-full pb-12 px-0 font-sans text-slate-900 dark:text-slate-100 overflow-x-hidden" id="delivery-module-root">
      <PageHeader
        title="Delivery & Dispatch Operations"
        subtitle="Manage orders that are ready for dispatch and track delivery fulfillment."
        icon={Truck}
        rightContent={
          <>

          </>
        }
      />

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrders.length === 0 ? (
           <div className="col-span-full text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
             <Package size={48} className="mx-auto text-slate-300 mb-3" />
             <p className="text-xs font-semibold text-slate-500">No orders ready for delivery.</p>
             <p className="text-[11px] text-slate-400 mt-1">Orders must be packed in the Packing Verification module first.</p>
           </div>
        ) : (
          filteredOrders.map((o, idx) => {
            const cust = customers.find(c => c.id === o.customer_id);
            const totalItems = o.items.reduce((acc, it) => acc + it.qty, 0);
            
            return (
              <div key={`${o.id}-${idx}`} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50 dark:bg-slate-800/50">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">{o.order_number}</h3>
                    <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
                      <Calendar size={10} /> {o.order_date}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    o.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700' :
                    o.status === 'Dispatched' ? 'bg-indigo-100 text-indigo-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {o.status}
                  </span>
                </div>
                
                <div className="p-4 flex-1 space-y-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Destination</span>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{cust?.name}</p>
                    <div className="text-[11px] text-slate-500 mt-1 flex items-start gap-1.5">
                      <MapPin size={14} className="mt-0.5 shrink-0" />
                      <span className="leading-snug">{cust?.shipping_address || 'No shipping address provided'}</span>
                    </div>
                    {cust?.phone && (
                      <div className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1.5">
                        <Phone size={14} />
                        <span>{cust.phone}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-slate-500 block mb-0.5">Total Package Size</span>
                      <strong className="text-[11px] font-mono">{totalItems} {totalItems === 1 ? 'Unit' : 'Units'}</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block mb-0.5">Value</span>
                      <strong className="text-[11px] font-bold text-slate-900 dark:text-white">₹{o.total_amount.toLocaleString()}</strong>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800">
                  {o.status === 'Packed' && (
                    <button 
                      onClick={() => handleUpdateStatus(o, 'Dispatched')}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold transition flex justify-center items-center gap-1.5"
                    >
                      <Truck size={14} />
                      Mark as Dispatched
                    </button>
                  )}
                  {o.status === 'Dispatched' && (
                    <button 
                      onClick={() => handleUpdateStatus(o, 'Delivered')}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition flex justify-center items-center gap-1.5"
                    >
                      <CheckCircle2 size={14} />
                      Confirm Delivery
                    </button>
                  )}
                  {o.status === 'Delivered' && (
                    <div className="w-full py-2 bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-lg text-[11px] font-bold text-center flex justify-center items-center gap-1.5 cursor-default">
                      <CheckCircle2 size={14} />
                      Successfully Delivered
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
