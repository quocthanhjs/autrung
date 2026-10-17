function InventoryView({ products, suppliers, orders, imports, db, storeId, showToast }) {
  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [form, setForm] = useState({ name: '', category: '', price: '', cost: '', stock: '', supplierId: '' });
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ field: null, direction: 'none' });
  const [detailProduct, setDetailProduct] = useState(null);
  const currentDate = new Date();
  const [filterMonth, setFilterMonth] = useState((currentDate.getMonth() + 1).toString());
  const [filterYear, setFilterYear] = useState(currentDate.getFullYear().toString());

  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [newSupplierForm, setNewSupplierForm] = useState({ name: '', phone: '', address: '' });

  const handleAddSupplierQuick = async (e) => {
    e.preventDefault();
    try {
      const nowIso = new Date().toISOString();
      const docRef = await addDoc(collection(db, 'stores', storeId, 'suppliers'), { 
        name: newSupplierForm.name, 
        phone: newSupplierForm.phone || '', 
        address: newSupplierForm.address || '', 
        totalDebt: 0, 
        createdAt: nowIso 
      });
      setForm({...form, supplierId: docRef.id}); 
      setShowAddSupplierModal(false); 
      setNewSupplierForm({ name: '', phone: '', address: '' }); 
      showToast("Đã thêm và chọn nhà cung cấp mới!");
    } catch (err) { showToast("Lỗi thêm nhà cung cấp", "error"); }
  };

  const handleSave = async (e) => { 
    e.preventDefault(); 
    try { 
      const nowIso = new Date().toISOString();
      let supplierName = '';
      if (form.supplierId) {
        const s = suppliers.find(sup => sup.id === form.supplierId);
        if (s) supplierName = s.name;
      }

      const d = { 
        name: form.name, 
        category: form.category || '', 
        price: Number(form.price), 
        cost: Number(form.cost || 0), 
        stock: Number(form.stock), 
        createdAt: form.createdAt || nowIso 
      }; 

      if (form.supplierId) {
        d.lastSupplierId = form.supplierId;
        d.lastSupplierName = supplierName;
      }

      if (form.id) { await updateDoc(doc(db, 'stores', storeId, 'products', form.id), d); } 
      else { await addDoc(collection(db, 'stores', storeId, 'products'), d); }
      setIsModalOpen(false); showToast("Đã lưu Hàng hóa"); 
    } catch (e) { showToast("Lỗi", "error"); } 
  };

  const handleDelete = async (id) => { if (window.confirm("Xác nhận xóa sản phẩm này?")) { await deleteDoc(doc(db, 'stores', storeId, 'products', id)); showToast("Đã xóa sản phẩm"); } };
  const handleBatchDelete = async () => { if (selectedIds.length === 0) return; const confirmMsg = "Xác nhận xóa " + selectedIds.length + " sản phẩm đã chọn?"; if (window.confirm(confirmMsg)) { let batch = writeBatch(db); selectedIds.forEach(id => { batch.delete(doc(db, 'stores', storeId, 'products', id)); }); await batch.commit(); setSelectedIds([]); showToast("Đã xóa các sản phẩm đã chọn"); } };

  const bannerStats = useMemo(() => {
    const totalStock = products.reduce((s, p) => s + (Number(p.stock) || 0), 0);
    const totalValue = products.reduce((s, p) => s + (Number(p.price) * (Number(p.stock) || 0)), 0);
    return { totalStock, totalValue, count: products.length };
  }, [products]);

  const handleSort = (field) => {
    setSortConfig(prev => {
      if (prev.field === field) {
        if (prev.direction === 'none') return { field, direction: 'desc' };
        if (prev.direction === 'desc') return { field, direction: 'asc' };
        return { field: null, direction: 'none' };
      }
      return { field, direction: 'desc' };
    });
  };

  const filteredProducts = useMemo(() => {
    let list = products.filter(p => p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (sortConfig.field && sortConfig.direction !== 'none') {
      list.sort((a, b) => {
        let aVal = a[sortConfig.field] || 0;
        let bVal = b[sortConfig.field] || 0;
        if (sortConfig.field === 'name') {
          aVal = (a.name || '').toLowerCase();
          bVal = (b.name || '').toLowerCase();
          if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
          if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
        } else {
          return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
      });
    }
    return list;
  }, [products, searchTerm, sortConfig]);

  const productHistory = useMemo(() => {
    if (!detailProduct) return { sales: [], imports: [], totalSoldQty: 0, totalImportQty: 0, totalSoldAmount: 0, totalImportAmount: 0, totalPaid: 0, totalDebtRemain: 0 };
    
    const matchTime = (dateStr) => {
      const d = new Date(dateStr);
      return (filterMonth === 'ALL' || (d.getMonth() + 1).toString() === filterMonth) && d.getFullYear().toString() === filterYear;
    };

    const sales = (orders || [])
      .filter(o => matchTime(o.date))
      .flatMap(o => (o.items || []).filter(item => item.id === detailProduct.id).map(it => ({ ...it, date: o.date, status: o.status, customerName: o.customerName || 'Khách lẻ' })))
      .sort((a,b) => new Date(b.date) - new Date(a.date));
      
    const imp = (imports || [])
      .filter(i => matchTime(i.date))
      .flatMap(i => (i.items || []).filter(item => item.id === detailProduct.id).map(it => ({ ...it, date: i.date, status: i.status, supplierName: i.supplierName || 'NCC Ẩn' })))
      .sort((a,b) => new Date(b.date) - new Date(a.date));

    let totalSoldQty = sales.reduce((s, x) => s + (Number(x.quantity) || 0), 0);
    let totalImportQty = imp.reduce((s, x) => s + (Number(x.qty) || 0), 0);
    let totalSoldAmount = sales.reduce((s, x) => s + ((Number(x.quantity) || 0) * (Number(x.price) || 0)), 0);
    let totalImportAmount = imp.reduce((s, x) => s + ((Number(x.qty) || 0) * (Number(x.importCost) || 0)), 0);
    
    let totalPaid = sales.filter(s => s.status === 'PAID').reduce((sum, x) => sum + (x.quantity * x.price), 0);
    let totalDebtRemain = sales.filter(s => s.status === 'DEBT').reduce((sum, x) => sum + (x.quantity * x.price), 0);

    return { sales, imports: imp, totalSoldQty, totalImportQty, totalSoldAmount, totalImportAmount, totalPaid, totalDebtRemain };
  }, [detailProduct, orders, imports, filterMonth, filterYear]);

  const modalProductTitle = "Lịch sử mua bán: " + (detailProduct?.name || '');

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 bg-gray-50 overflow-hidden h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <h2 className="text-2xl font-bold text-gray-800">Kho Hàng</h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64"><Search size={16} className="absolute left-3 top-3 text-gray-400"/><input placeholder="Tìm kiếm trực tiếp sản phẩm..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-2 border rounded-lg bg-white outline-none text-sm"/></div>
          <button onClick={() => {setForm({name:'', category:'', price:'', cost:'', stock:'', supplierId: ''}); setIsModalOpen(true);}} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shrink-0"><Plus size={18}/> Thêm mới</button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div className="bg-white p-4 rounded-2xl border shadow-sm"><p className="text-xs text-gray-500 font-bold uppercase">Tổng Số Sản Phẩm</p><p className="text-xl font-bold text-gray-800">{bannerStats.count}</p></div>
        <div className="bg-white p-4 rounded-2xl border shadow-sm"><p className="text-xs text-blue-600 font-bold uppercase">Tổng Tồn Kho</p><p className="text-xl font-bold text-blue-600">{bannerStats.totalStock}</p></div>
        <div className="bg-white p-4 rounded-2xl border shadow-sm"><p className="text-xs text-green-600 font-bold uppercase">Tổng Giá Trị Kho</p><p className="text-xl font-bold text-green-600">{formatCurrency(bannerStats.totalValue)}</p></div>
      </div>
      {selectedIds.length > 0 && (
        <div className="bg-red-50 border border-red-200 p-2.5 rounded-xl mb-3 flex justify-between items-center">
          <span className="text-xs font-bold text-red-700">Đã chọn {selectedIds.length} mục</span>
          <button onClick={handleBatchDelete} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1"><Trash2 size={14}/> Xóa đã chọn</button>
        </div>
      )}
      <div className="flex-1 bg-white rounded-xl border shadow-sm overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 sticky top-0 border-b select-none">
            <tr>
              <th className="p-4 w-10"><input type="checkbox" onChange={() => setSelectedIds(selectedIds.length === products.length ? [] : products.map(p=>p.id))} checked={products.length > 0 && selectedIds.length === products.length} className="w-4 h-4"/></th>
              <th className="p-4 font-bold text-gray-600 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('name')}>
                <div className="flex items-center gap-1">Sản phẩm {sortConfig.field === 'name' && sortConfig.direction !== 'none' && <ArrowUpDown size={14} className={sortConfig.direction==='desc' ? 'text-red-500' : 'text-green-500'} />}</div>
              </th>
              <th className="p-4 font-bold text-gray-600">Nhóm & Nguồn Gốc</th>
              <th className="p-4 font-bold text-gray-600 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('cost')}>
                <div className="flex items-center gap-1">Giá vốn {sortConfig.field === 'cost' && sortConfig.direction !== 'none' && <ArrowUpDown size={14} className={sortConfig.direction==='desc' ? 'text-red-500' : 'text-green-500'} />}</div>
              </th>
              <th className="p-4 font-bold text-gray-600 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('price')}>
                <div className="flex items-center gap-1">Giá bán {sortConfig.field === 'price' && sortConfig.direction !== 'none' && <ArrowUpDown size={14} className={sortConfig.direction==='desc' ? 'text-red-500' : 'text-green-500'} />}</div>
              </th>
              <th className="p-4 font-bold text-gray-600 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('stock')}>
                <div className="flex items-center gap-1">Tồn {sortConfig.field === 'stock' && sortConfig.direction !== 'none' && <ArrowUpDown size={14} className={sortConfig.direction==='desc' ? 'text-red-500' : 'text-green-500'} />}</div>
              </th>
              <th className="p-4 font-bold text-gray-600 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(p => {
              const stockClass = p.stock < 0 ? 'text-red-600' : 'text-gray-800';
              return (
                <tr key={p.id} className="border-b hover:bg-blue-50/50 cursor-pointer" onClick={() => setDetailProduct(p)}>
                  <td className="p-4" onClick={e=>e.stopPropagation()}><input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => setSelectedIds(prev => prev.includes(p.id) ? prev.filter(x=>x!==p.id) : [...prev, p.id])} className="w-4 h-4"/></td>
                  <td className="p-4 font-medium text-blue-600 underline">{p.name}</td>
                  <td className="p-4">
                    <p className="text-[11px] bg-gray-100 border inline-block px-1.5 py-0.5 rounded text-gray-600">{p.category || 'Chưa phân nhóm'}</p>
                    {p.lastSupplierName && <p className="text-[10px] text-gray-400 mt-1">Từ: {p.lastSupplierName}</p>}
                  </td>
                  <td className="p-4 text-gray-600">{formatCurrency(p.cost)}</td><td className="p-4 font-bold text-blue-600">{formatCurrency(p.price)}</td><td className={"p-4 font-bold " + stockClass}>{p.stock}</td>
                  <td className="p-4 text-right flex justify-end gap-1" onClick={e=>e.stopPropagation()}><button onClick={() => setDetailProduct(p)} title="Xem chi tiết nhập/bán" className="text-gray-600 bg-gray-100 p-2 rounded-lg hover:bg-gray-200"><Eye size={16}/></button><button onClick={() => {setForm({...p, supplierId: p.lastSupplierId || ''}); setIsModalOpen(true);}} className="text-blue-600 bg-blue-50 p-2 rounded-lg hover:bg-blue-100"><Edit size={16}/></button><button onClick={() => handleDelete(p.id)} className="text-red-600 bg-red-50 p-2 rounded-lg hover:bg-red-100"><Trash2 size={16}/></button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal isOpen={!!detailProduct} onClose={() => setDetailProduct(null)} title={modalProductTitle} maxWidth="max-w-4xl">
        {detailProduct && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border">
              <div><p className="text-xs text-gray-500">Giá bán:</p><p className="font-bold text-blue-600">{formatCurrency(detailProduct.price)}</p></div>
              <div><p className="text-xs text-gray-500">Tồn kho:</p><p className={"font-bold " + (detailProduct.stock < 0 ? 'text-red-600' : 'text-gray-800')}>{detailProduct.stock}</p></div>
              <div className="flex items-center gap-1 bg-white p-1 rounded border">
                <select value={filterMonth} onChange={e=>setFilterMonth(e.target.value)} className="bg-transparent text-xs outline-none"><option value="ALL">Cả năm</option>{Array.from({length: 12}, (_, i) => <option key={i+1} value={i+1}>Tháng {i+1}</option>)}</select>
                <select value={filterYear} onChange={e=>setFilterYear(e.target.value)} className="bg-transparent text-xs outline-none">{Array.from({length: 5}, (_, i) => new Date().getFullYear() - i).map(y => <option key={y} value={y}>{y}</option>)}</select>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-blue-50 p-2 rounded-lg border border-blue-100"><p className="text-[10px] text-blue-600 font-bold uppercase">Tổng Bán</p><p className="text-xs font-bold text-blue-800">{formatCurrency(productHistory.totalSoldAmount)}</p></div>
              <div className="bg-green-50 p-2 rounded-lg border border-green-100"><p className="text-[10px] text-green-600 font-bold uppercase">Đã Thanh Toán</p><p className="text-xs font-bold text-green-700">{formatCurrency(productHistory.totalPaid)}</p></div>
              <div className="bg-orange-50 p-2 rounded-lg border border-orange-100"><p className="text-[10px] text-orange-600 font-bold uppercase">Đang Nợ</p><p className="text-xs font-bold text-orange-700">{formatCurrency(productHistory.totalDebtRemain)}</p></div>
              <div className="bg-purple-50 p-2 rounded-lg border border-purple-100"><p className="text-[10px] text-purple-700 font-bold uppercase">Tổng Nhập</p><p className="text-xs font-bold text-purple-700">{formatCurrency(productHistory.totalImportAmount)}</p></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-bold text-sm text-green-700 mb-2 border-b pb-1">Lịch sử Bán hàng:</h4>
                <div className="max-h-64 overflow-y-auto border rounded-xl shadow-sm">
                  <table className="w-full text-left text-xs bg-white">
                    <thead className="bg-green-50 sticky top-0 border-b border-green-100">
                      <tr><th className="p-2.5 text-green-800">Khách mua</th><th className="p-2.5 text-green-800">Thời gian</th><th className="p-2.5 text-green-800">Số lượng</th></tr>
                    </thead>
                    <tbody>
                      {productHistory.sales.map((s, idx) => (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          <td className="p-2.5 font-bold text-blue-700">{s.customerName}</td>
                          <td className="p-2.5 text-gray-500 whitespace-nowrap">{formatDate(s.date)}</td>
                          <td className="p-2.5 font-bold text-green-600">Bán ra {s.quantity}</td>
                        </tr>
                      ))}
                      {productHistory.sales.length === 0 && (<tr><td colSpan="3" className="p-4 text-center text-gray-400">Không có phát sinh bán</td></tr>)}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-sm text-purple-700 mb-2 border-b pb-1">Lịch sử Nhập hàng:</h4>
                <div className="max-h-64 overflow-y-auto border rounded-xl shadow-sm">
                  <table className="w-full text-left text-xs bg-white">
                    <thead className="bg-purple-50 sticky top-0 border-b border-purple-100">
                      <tr><th className="p-2.5 text-purple-800">Nhà cung cấp</th><th className="p-2.5 text-purple-800">Thời gian</th><th className="p-2.5 text-purple-800">Số lượng</th></tr>
                    </thead>
                    <tbody>
                      {productHistory.imports.map((im, idx) => (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          <td className="p-2.5 font-bold text-orange-700">{im.supplierName}</td>
                          <td className="p-2.5 text-gray-500 whitespace-nowrap">{formatDate(im.date)}</td>
                          <td className="p-2.5 font-bold text-purple-600">Nhập vào {im.qty}</td>
                        </tr>
                      ))}
                      {productHistory.imports.length === 0 && (<tr><td colSpan="3" className="p-4 text-center text-gray-400">Không có phát sinh nhập</td></tr>)}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={form.id ? "Sửa thông tin Hàng hóa" : "Thêm Hàng hóa mới"}>
        <form onSubmit={handleSave} className="space-y-4">
          <input required placeholder="Tên sản phẩm *" value={form.name||''} onChange={e=>setForm({...form,name:e.target.value})} className="w-full p-2.5 border rounded-lg outline-none"/>
          <input placeholder="Nhóm hàng (VD: Ốp lưng, Điện thoại, Sạc...)" value={form.category||''} onChange={e=>setForm({...form,category:e.target.value})} className="w-full p-2.5 border rounded-lg outline-none"/>
          
          <div className="flex gap-2">
            <select value={form.supplierId || ''} onChange={e=>setForm({...form,supplierId:e.target.value})} className="flex-1 p-2.5 border rounded-lg outline-none text-sm bg-white">
              <option value="">-- Chọn Nhà cung cấp (Tùy chọn) --</option>
              {suppliers && suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button type="button" onClick={() => setShowAddSupplierModal(true)} className="bg-blue-50 text-blue-600 border border-blue-200 px-3 rounded-lg font-bold text-xs flex items-center gap-1 shrink-0">
              <Plus size={14}/> Thêm NCC
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input required type="number" placeholder="Giá vốn *" value={form.cost||''} onChange={e=>setForm({...form,cost:e.target.value})} className="p-2.5 border rounded-lg outline-none"/>
            <input required type="number" placeholder="Giá bán *" value={form.price||''} onChange={e=>setForm({...form,price:e.target.value})} className="p-2.5 border rounded-lg outline-none"/>
          </div>
          <input required type="number" placeholder="Tồn kho *" value={form.stock||''} onChange={e=>setForm({...form,stock:e.target.value})} className="w-full p-2.5 border rounded-lg outline-none"/>
          <button className="w-full bg-blue-600 text-white font-bold p-3 rounded-lg">Lưu lại</button>
        </form>
      </Modal>

      <Modal isOpen={showAddSupplierModal} onClose={() => setShowAddSupplierModal(false)} title="Thêm Nhà Cung Cấp Nhanh">
        <form onSubmit={handleAddSupplierQuick} className="space-y-4">
          <input required placeholder="Tên nhà cung cấp *" value={newSupplierForm.name} onChange={e=>setNewSupplierForm({...newSupplierForm, name:e.target.value})} className="w-full p-2.5 border rounded-lg outline-none text-sm"/>
          <input placeholder="Số điện thoại" value={newSupplierForm.phone} onChange={e=>setNewSupplierForm({...newSupplierForm, phone:e.target.value})} className="w-full p-2.5 border rounded-lg outline-none text-sm"/>
          <input placeholder="Địa chỉ" value={newSupplierForm.address} onChange={e=>setNewSupplierForm({...newSupplierForm, address:e.target.value})} className="w-full p-2.5 border rounded-lg outline-none text-sm"/>
          <button type="submit" className="w-full bg-blue-600 text-white font-bold p-3 rounded-lg text-sm">Lưu & Chọn Nhà Cung Cấp</button>
        </form>
      </Modal>
    </div>
  );
}
