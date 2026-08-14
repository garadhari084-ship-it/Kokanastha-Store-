const fs = require('fs');
const file = 'src/components/DeliveryModule.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /const \[detailOrder, setDetailOrder\] = useState\<SalesOrder \| null\>\(null\);/,
  `const [detailOrder, setDetailOrder] = useState<SalesOrder | null>(null);
  const [editRackLocation, setEditRackLocation] = useState('');
  const [editRackSection, setEditRackSection] = useState('');
  const [editTotalBags, setEditTotalBags] = useState<number>(1);
  const [isEditingStorage, setIsEditingStorage] = useState(false);

  const openDetailModal = (o: SalesOrder) => {
    setDetailOrder(o);
    setEditRackLocation(o.rack_location || '');
    setEditRackSection(o.rack_section || '');
    setEditTotalBags(o.total_bags || 1);
    setIsEditingStorage(false);
  };
  
  const saveStorageInfo = () => {
    if (detailOrder) {
      dbStore.updateSalesOrder(detailOrder.id, {
        rack_location: editRackLocation,
        rack_section: editRackSection,
        total_bags: editTotalBags
      });
      triggerToast('Storage info updated successfully', 'success');
      setDetailOrder({...detailOrder, rack_location: editRackLocation, rack_section: editRackSection, total_bags: editTotalBags});
      setIsEditingStorage(false);
      reloadOrders();
    }
  };`
);

content = content.replace(/setDetailOrder\(o\)/g, "openDetailModal(o)");

fs.writeFileSync(file, content);
