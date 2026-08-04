import os

file_path = 'src/components/DeliveryModule.tsx'
with open(file_path, 'r') as f:
    content = f.read()

# 1. Add import
import_target = "import { SalesOrder, Customer, UserProfile, OrderStatus } from '../types/erp';"
import_replacement = import_target + "\nimport { TodayDeliveryModal } from './TodayDeliveryModal';"

if import_target in content:
    content = content.replace(import_target, import_replacement)

# 2. Add state and useEffect
state_target = "const [trackingNumber, setTrackingNumber] = useState<string>('');"
state_replacement = """  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [showTodayModal, setShowTodayModal] = useState(false);

  useEffect(() => {
    // Show modal on module load to highlight today's priorities
    const timer = setTimeout(() => {
      setShowTodayModal(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleModalAction = (order: SalesOrder) => {
    setShowTodayModal(false);
    if (order.status === 'Dispatched') {
      setConfirmingOrder(order);
      setSelectedPaymentMode(null);
    } else {
      setDispatchingOrder(order);
      // Reset dispatch form defaults
      setDeliveryPartner('Rapido');
      setPersonName('');
      setPersonPhone('');
      setTrackingNumber('');
    }
  };"""

if state_target in content:
    content = content.replace(state_target, state_replacement)

# 3. Add Modal JSX
jsx_target = "{/* Order Details Modal */}"
jsx_replacement = """      {/* Today's Delivery Summary Modal - Auto triggered */}
      <TodayDeliveryModal 
        isOpen={showTodayModal}
        onClose={() => setShowTodayModal(false)}
        businessId={businessId}
        orders={orders}
        customers={customers}
        onAction={handleModalAction}
      />

      {/* Order Details Modal */}"""

if jsx_target in content:
    content = content.replace(jsx_target, jsx_replacement)

with open(file_path, 'w') as f:
    f.write(content)

print("Patch applied successfully")
