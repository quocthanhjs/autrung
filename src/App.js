import React, { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, ShoppingCart, Package, Users, Truck, Edit, Trash2, X, ShoppingBag, TrendingUp, AlertCircle, ArrowDownToLine, DollarSign, Receipt, CreditCard, LogOut, Database, UserCog, Printer, Image as ImageIcon, Save, Plus, Eye } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, onSnapshot, collection, writeBatch, query, where } from 'firebase/firestore';

const app = initializeApp({ apiKey: "AIzaSyClQogCLby6OYpVzRwJ9181rmg1Lho5FV8", authDomain: "smartpos-5f5cf.firebaseapp.com", projectId: "smartpos-5f5cf", storageBucket: "smartpos-5f5cf.firebasestorage.app", messagingSenderId: "458225351603", appId: "1:458225351603:web:f67d06427def5a33dca9c6" });
const auth = getAuth(app);
const db = getFirestore(app);

const formatMoney = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
const formatDate = (isoString) => new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(isoString));

const Modal = ({ isOpen, onClose, title, children, maxWidth = "max-w-md", noHeader = false }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 print:p-0 print:bg-white print:absolute">
      <div className={`bg-white rounded-xl shadow-2xl w-full ${maxWidth} flex flex-col max-h-[90vh] print:max-h-none print:shadow-none`}>
        {!noHeader && (
          <div className="flex justify-between p-4 border-b no-print">
            <h3 className="font-bold text-lg">{title}</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-red-500"><X /></button>
          </div>
        )}
        <div className="p-4 overflow-y-auto print:p-0 print:overflow-visible">{children}</div>
      </div>
    </div>
  );
};

export default function EnhancedPOS() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({ role: null, name: '', perms: {} });
  const [activeTab, setActiveTab] = useState('pos');
  const [storeConfig, setStoreConfig] = useState({ name: 'SmartPOS', address: '', phone: '', logo: '' });
  const [data, setData] = useState({ products: [], orders: [], imports: [], customers: [], suppliers: [], expenses: [], staff: [] });
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);
  const storeId = 'main_store';

  useEffect(() => {
    if (!document.getElementById('html2canvas-script')) {
      const script = document.createElement('script');
      script.id = 'html2canvas-script';
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      document.head.appendChild(script);
    }
    return onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const docSnap = await getDoc(doc(db, 'users_db', u.uid));
        if (docSnap.exists()) {
          setUserData(docSnap.data());
          setActiveTab(docSnap.data().role === 'admin' ? 'dashboard' : 'pos');
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubStore = onSnapshot(doc(db, 'stores', storeId), (docSnap) => {
      if (docSnap.exists()) setStoreConfig(prev => ({ ...prev, ...docSnap.data() }));
    });

    const collections = ['products', 'orders', 'imports', 'customers', 'suppliers', 'expenses'];
    const unsubs = collections.map(col =>
      onSnapshot(collection(db, 'stores', storeId, col), snap => {
        setData(prev => ({ ...prev, [col]: snap.docs.map(d => ({ id: d.id, ...d.data() })) }));
      })
    );
    const unsubStaff = onSnapshot(collection(db, 'users_db'), snap => {
      setData(prev => ({ ...prev, staff: snap.docs.map(d => ({ id: d.id, ...d.data() })) }));
    });

    return () => { unsubStore(); unsubs.forEach(fn => fn()); unsubStaff(); };
  }, [user]);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  if (loading) return <div className="flex h-screen items-center justify-center">Đang tải hệ thống...</div>;

  if (!user) {
    const handleLogin = async (e) => {
      e.preventDefault();
      try {
        let email = e.target.username.value;
        if (!email.includes('@')) {
          const q = await getDocs(query(collection(db, 'users_db'), where('username', '==', email)));
          if (!q.empty) email = q.docs[0].data().email;
        }
        await signInWithEmailAndPassword(auth, email, e.target.password.value);
      } catch (err) { alert("Sai tài khoản hoặc mật khẩu!"); }
    };
    return (
      <div className="h-screen bg-gray-100 flex items-center justify-center">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-xl w-96 space-y-4 text-center">
          {storeConfig.logo && <img src={storeConfig.logo} alt="Logo" className="max-h-16 mx-auto object-contain mb-2" />}
          <h1 className="text-xl font-bold text-blue-800">{storeConfig.name || 'SmartPOS'}</h1>
          <input required name="username" placeholder="Tên đăng nhập hoặc Email" className="w-full p-3 border rounded outline-none focus:ring-2 focus:ring-blue-500" />
          <input required name="password" type="password" placeholder="Mật khẩu" className="w-full p-3 border rounded outline-none focus:ring-2 focus:ring-blue-500" />
          <button className="w-full bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700">Đăng nhập</button>
        </form>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Báo cáo', perm: 'tong_quan_xem' },
    { id: 'pos', icon: ShoppingCart, label: 'Bán hàng', perm: 'ALWAYS' },
    { id: 'sales_history', icon: Receipt, label: 'QL Bán Hàng', perm: 'ban_hang' },
    { id: 'imports', icon: ArrowDownToLine, label: 'Nhập hàng', perm: 'mua_nhap_hang' },
    { id: 'products', icon: Package, label: 'Kho hàng', perm: 'hh_danh_sach' },
    { id: 'customers', icon: Users, label: 'Khách hàng', perm: 'kh_danh_sach' },
    { id: 'suppliers', icon: Truck, label: 'Nhà cung cấp', perm: 'mua_ncc' },
    { id: 'expenses', icon: CreditCard, label: 'Chi phí', perm: 'quy_so_quy' },
    { id: 'settings', icon: Database, label: 'Cài đặt', adminOnly: true },
    { id: 'staff', icon: UserCog, label: 'Nhân viên', adminOnly: true },
  ];

  const visibleTabs = tabs.filter(t => userData.role === 'admin' || t.perm === 'ALWAYS' || (t.perm && userData.perms?.[t.perm]));

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-sm print:bg-white print:block">
      <aside className="w-56 bg-white border-r flex flex-col shrink-0 no-print">
        <div className="p-4 border-b font-bold text-blue-800 text-lg flex items-center gap-2 truncate">
          {storeConfig.logo ? <img src={storeConfig.logo} alt="Logo" className="max-h-8 object-contain" /> : <ShoppingBag />}
          <span className="truncate">{storeConfig.name || 'SmartPOS'}</span>
        </div>
        <nav className="flex-1 p-3 overflow-y-auto space-y-2">
          {visibleTabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`w-full flex items-center gap-3 p-3 rounded-lg ${activeTab === t.id ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
              <t.icon size={18} /> {t.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t flex justify-between items-center bg-gray-50">
          <div className="truncate text-sm">
            <b className="block">{userData.name}</b>
            <span className="text-xs text-gray-500">{userData.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}</span>
          </div>
          <button onClick={() => signOut(auth)} className="text-red-500 hover:bg-red-100 p-2 rounded-full" title="Đăng xuất">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden print:overflow-visible">
        {toastMessage && (
          <div className={`absolute top-4 right-4 z-50 p-4 rounded-lg text-white font-bold shadow-lg ${toastMessage.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
            {toastMessage.msg}
          </div>
        )}
        
        {activeTab === 'dashboard' && <DashboardView data={data} />}
        {activeTab === 'pos' && <POSView data={data} storeId={storeId} user={user} storeConfig={storeConfig} showToast={showToast} />}
        {activeTab === 'sales_history' && <SalesHistoryView data={data} storeId={storeId} storeConfig={storeConfig} showToast={showToast} />}
        {activeTab === 'imports' && <ImportView data={data} storeId={storeId} user={user} showToast={showToast} />}
        {activeTab === 'products' && <InventoryView data={data.products} storeId={storeId} showToast={showToast} />}
        {activeTab === 'customers' && <ContactView type="customers" dataList={data.customers} orders={data.orders} storeId={storeId} showToast={showToast} />}
        {activeTab === 'suppliers' && <ContactView type="suppliers" dataList={data.suppliers} orders={data.imports} storeId={storeId} showToast={showToast} />}
        {activeTab === 'expenses' && <ExpenseView data={data.expenses} storeId={storeId} showToast={showToast} />}
        {activeTab === 'settings' && <SettingsView config={storeConfig} storeId={storeId} showToast={showToast} />}
        {activeTab === 'staff' && <StaffView staffList={data.staff} showToast={showToast} />}
      </main>
    </div>
  );
}

// ==========================================
// 1. DASHBOARD VIEW
// ==========================================
function DashboardView({ data }) {
  const [filterMonth, setFilterMonth] = useState('ALL');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [sortCustomerDebt, setSortCustomerDebt] = useState('amt_desc');
  const [sortSupplierDebt, setSortSupplierDebt] = useState('amt_desc');

  const stats = useMemo(() => {
    const validOrders = data.orders.filter(o => {
      const d = new Date(o.date);
      return (filterMonth === 'ALL' || (d.getMonth() + 1).toString() === filterMonth) && d.getFullYear().toString() === filterYear;
    });
    const validExpenses = data.expenses.filter(e => {
      const d = new Date(e.date);
      return (filterMonth === 'ALL' || (d.getMonth() + 1).toString() === filterMonth) && d.getFullYear().toString() === filterYear;
    });

    const revenue = validOrders.reduce((sum, o) => sum + o.total, 0);
    const cogs = validOrders.reduce((sum, o) => sum + (o.totalCost || 0), 0);
    const expenses = validExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    return { revenue, cogs, expenses, netProfit: revenue - cogs - expenses };
  }, [data, filterMonth, filterYear]);

  const customerDebts = useMemo(() => {
    return data.customers.filter(c => c.totalDebt > 0).map(c => {
      const debtOrders = data.orders.filter(o => o.customerId === c.id && o.status === 'DEBT');
      const oldestDate = debtOrders.length > 0 ? Math.min(...debtOrders.map(o => new Date(o.date).getTime())) : Date.now();
      return { ...c, oldestDebtTime: oldestDate };
    }).sort((a, b) => {
      if (sortCustomerDebt === 'amt_desc') return b.totalDebt - a.totalDebt;
      if (sortCustomerDebt === 'amt_asc') return a.totalDebt - b.totalDebt;
      if (sortCustomerDebt === 'time_asc') return a.oldestDebtTime - b.oldestDebtTime;
      if (sortCustomerDebt === 'time_desc') return b.oldestDebtTime - a.oldestDebtTime;
      return 0;
    });
  }, [data.customers, data.orders, sortCustomerDebt]);

  const supplierDebts = useMemo(() => {
    return data.suppliers.filter(s => s.totalDebt > 0).map(s => {
      const debtImports = data.imports.filter(i => i.supplierId === s.id && i.status === 'DEBT');
      const oldestDate = debtImports.length > 0 ? Math.min(...debtImports.map(i => new Date(i.date).getTime())) : Date.now();
      return { ...s, oldestDebtTime: oldestDate };
    }).sort((a, b) => {
      if (sortSupplierDebt === 'amt_desc') return b.totalDebt - a.totalDebt;
      if (sortSupplierDebt === 'amt_asc') return a.totalDebt - b.totalDebt;
      if (sortSupplierDebt === 'time_asc') return a.oldestDebtTime - b.oldestDebtTime;
      if (sortSupplierDebt === 'time_desc') return b.oldestDebtTime - a.oldestDebtTime;
      return 0;
    });
  }, [data.suppliers, data.imports, sortSupplierDebt]);

  return (
    <div className="p-6 flex-1 overflow-auto bg-gray-50 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Báo Cáo Tổng Quan</h2>
        <div className="flex gap-2">
          <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="p-2 border rounded-lg bg-white outline-none">
            <option value="ALL">Cả năm</option>
            {[...Array(12)].map((_, i) => <option key={i} value={i + 1}>Tháng {i + 1}</option>)}
          </select>
          <input type="number" value={filterYear} onChange={e => setFilterYear(e.target.value)} className="p-2 border rounded-lg w-24 outline-none" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <p className="text-gray-500 font-bold mb-1 flex items-center gap-2"><TrendingUp size={16} className="text-blue-500" /> DOANH THU</p>
          <p className="text-2xl font-black text-blue-600">{formatMoney(stats.revenue)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <p className="text-gray-500 font-bold mb-1 flex items-center gap-2"><Package size={16} className="text-gray-500" /> GIÁ VỐN</p>
          <p className="text-2xl font-black text-gray-800">{formatMoney(stats.cogs)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <p className="text-gray-500 font-bold mb-1 flex items-center gap-2"><CreditCard size={16} className="text-orange-500" /> CHI PHÍ</p>
          <p className="text-2xl font-black text-orange-600">{formatMoney(stats.expenses)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm ring-2 ring-green-500">
          <p className="text-gray-500 font-bold mb-1 flex items-center gap-2"><DollarSign size={16} className="text-green-500" /> LÃI RÒNG</p>
          <p className="text-2xl font-black text-green-600">{formatMoney(stats.netProfit)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 border rounded-xl shadow-sm flex flex-col max-h-80">
          <div className="flex justify-between mb-4 items-center border-b pb-2">
            <h3 className="font-bold text-red-600 flex items-center gap-2"><AlertCircle size={18} /> Khách đang nợ</h3>
            <select value={sortCustomerDebt} onChange={e => setSortCustomerDebt(e.target.value)} className="text-sm p-1.5 border rounded bg-gray-50 outline-none">
              <option value="amt_desc">Nợ nhiều nhất</option>
              <option value="amt_asc">Nợ ít nhất</option>
              <option value="time_asc">Nợ lâu nhất (Cũ nhất)</option>
              <option value="time_desc">Nợ mới nhất</option>
            </select>
          </div>
          <div className="flex-1 overflow-auto space-y-2 pr-2">
            {customerDebts.map(c => (
              <div key={c.id} className="flex justify-between border-b pb-2 text-sm hover:bg-gray-50">
                <span>{c.name} <span className="text-xs text-gray-400 block">Nợ từ: {formatDate(c.oldestDebtTime)}</span></span>
                <b className="text-red-600">{formatMoney(c.totalDebt)}</b>
              </div>
            ))}
            {customerDebts.length === 0 && <p className="text-center text-gray-500">Không có khách nợ</p>}
          </div>
        </div>

        <div className="bg-white p-4 border rounded-xl shadow-sm flex flex-col max-h-80">
          <div className="flex justify-between mb-4 items-center border-b pb-2">
            <h3 className="font-bold text-orange-600 flex items-center gap-2"><AlertCircle size={18} /> Đang nợ NCC</h3>
            <select value={sortSupplierDebt} onChange={e => setSortSupplierDebt(e.target.value)} className="text-sm p-1.5 border rounded bg-gray-50 outline-none">
              <option value="amt_desc">Nợ nhiều nhất</option>
              <option value="amt_asc">Nợ ít nhất</option>
              <option value="time_asc">Nợ lâu nhất (Cũ nhất)</option>
              <option value="time_desc">Nợ mới nhất</option>
            </select>
          </div>
          <div className="flex-1 overflow-auto space-y-2 pr-2">
            {supplierDebts.map(s => (
              <div key={s.id} className="flex justify-between border-b pb-2 text-sm hover:bg-gray-50">
                <span>{s.name} <span className="text-xs text-gray-400 block">Nợ từ: {formatDate(s.oldestDebtTime)}</span></span>
                <b className="text-orange-600">{formatMoney(s.totalDebt)}</b>
              </div>
            ))}
            {supplierDebts.length === 0 && <p className="text-center text-gray-500">Không nợ NCC</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. POS VIEW (Thêm khách trực tiếp)
// ==========================================
function POSView({ data, storeId, user, storeConfig, showToast }) {
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [printOrder, setPrintOrder] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({ name: '', phone: '' });

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1, cost: product.cost || 0, note: '', warrantyValue: '', warrantyUnit: 'tháng' }];
    });
  };

  const updateCartItem = (id, field, value) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, [field]: (field === 'price' || field === 'quantity') ? Number(value) : value } : item));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async (status) => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    try {
      const orderId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const batch = writeBatch(db);

      cart.forEach(item => {
        batch.update(doc(db, 'stores', storeId, 'products', item.id), { stock: (item.stock || 0) - item.quantity });
      });

      batch.set(doc(collection(db, 'stores', storeId, 'orders'), orderId), {
        id: orderId,
        date: new Date().toISOString(),
        items: cart,
        total: cartTotal,
        totalCost: cart.reduce((sum, i) => sum + (i.cost * i.quantity), 0),
        status: status,
        customerId: selectedCustomer?.id || null,
        customerName: selectedCustomer?.name || 'Khách lẻ',
        userId: user.uid
      });

      if (status === 'DEBT' && selectedCustomer) {
        batch.update(doc(db, 'stores', storeId, 'customers', selectedCustomer.id), {
          totalDebt: (selectedCustomer.totalDebt || 0) + cartTotal
        });
      }

      await batch.commit();
      showToast("Đã thanh toán đơn hàng thành công!");
      setCart([]);
      setSelectedCustomer(null);
    } catch (error) {
      showToast("Có lỗi xảy ra khi lưu đơn hàng!", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const saveNewCustomer = async (e) => {
    e.preventDefault();
    try {
      const res = await addDoc(collection(db, 'stores', storeId, 'customers'), {
        name: newCustomerForm.name,
        phone: newCustomerForm.phone,
        totalDebt: 0
      });
      setSelectedCustomer({ id: res.id, name: newCustomerForm.name, phone: newCustomerForm.phone });
      setShowAddCustomer(false);
      setNewCustomerForm({ name: '', phone: '' });
      showToast("Đã thêm khách hàng mới!");
    } catch (err) { showToast("Lỗi thêm khách!", "error"); }
  };

  return (
    <div className="flex h-full bg-gray-100">
      <div className="flex-1 flex flex-col p-4 border-r">
        <input placeholder="Tìm kiếm sản phẩm..." value={search} onChange={e => setSearch(e.target.value)} className="w-full p-3 mb-4 border rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-blue-500 text-lg" />
        <div className="flex-1 overflow-auto grid grid-cols-2 lg:grid-cols-4 gap-4">
          {data.products.filter(p => p.name?.toLowerCase().includes(search.toLowerCase())).map(p => (
            <div key={p.id} onClick={() => addToCart(p)} className="bg-white p-4 border rounded-xl cursor-pointer hover:border-blue-500 hover:shadow-md transition-all flex flex-col justify-between">
              <p className="font-bold text-sm mb-3">{p.name}</p>
              <div className="flex justify-between border-t pt-2 items-center">
                <b className="text-blue-600 text-base">{formatMoney(p.price)}</b>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded font-bold">Tồn: {p.stock}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-[450px] flex flex-col bg-white shadow-2xl z-10">
        <div className="p-4 border-b flex gap-2 items-center bg-gray-50">
          <select value={selectedCustomer?.id || ''} onChange={e => setSelectedCustomer(data.customers.find(c => c.id === e.target.value) || null)} className="flex-1 p-2.5 border rounded-lg bg-white outline-none font-bold text-blue-800">
            <option value="">-- Khách lẻ --</option>
            {data.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button onClick={() => setShowAddCustomer(true)} className="bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 flex items-center justify-center font-bold shadow" title="Thêm khách hàng mới">
            <Plus size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-3 space-y-3 bg-gray-100">
          {cart.map(item => (
            <div key={item.id} className="bg-white p-3 border rounded-xl shadow-sm">
              <div className="flex justify-between mb-2 items-start">
                <b className="text-sm pr-2">{item.name}</b>
                <button onClick={() => setCart(prev => prev.filter(i => i.id !== item.id))} className="text-red-500 font-bold bg-red-50 px-2 py-1 rounded text-xs hover:bg-red-100">Xóa</button>
              </div>
              <div className="flex gap-2 mb-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 block mb-1">Giá bán</label>
                  <input type="number" value={item.price} onChange={e => updateCartItem(item.id, 'price', e.target.value)} className="w-full p-2 border rounded text-blue-600 font-bold text-sm outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div className="w-20">
                  <label className="text-xs text-gray-500 block mb-1">Số lượng</label>
                  <input type="number" value={item.quantity} onChange={e => updateCartItem(item.id, 'quantity', e.target.value)} className="w-full p-2 border rounded text-center font-bold text-sm outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex gap-2 mb-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 block mb-1">Ghi chú (Màu/IMEI)</label>
                  <input value={item.note} onChange={e => updateCartItem(item.id, 'note', e.target.value)} className="w-full p-1.5 border rounded text-xs outline-none" placeholder="Nhập ghi chú..." />
                </div>
                <div className="w-16">
                  <label className="text-xs text-gray-500 block mb-1">Bảo hành</label>
                  <input type="number" value={item.warrantyValue} onChange={e => updateCartItem(item.id, 'warrantyValue', e.target.value)} className="w-full p-1.5 border rounded text-xs text-center outline-none" placeholder="Số" />
                </div>
                <div className="w-20">
                  <label className="text-xs text-gray-500 block mb-1">Đơn vị</label>
                  <select value={item.warrantyUnit} onChange={e => updateCartItem(item.id, 'warrantyUnit', e.target.value)} className="w-full p-1.5 border rounded text-xs bg-white outline-none">
                    <option value="ngày">Ngày</option><option value="tuần">Tuần</option><option value="tháng">Tháng</option><option value="năm">Năm</option>
                  </select>
                </div>
              </div>
              <div className="text-right text-sm border-t pt-2 mt-2">
                <span className="text-gray-500">Thành tiền: </span>
                <b className="text-blue-800 text-lg">{formatMoney(item.price * item.quantity)}</b>
              </div>
            </div>
          ))}
          {cart.length === 0 && <div className="text-center text-gray-400 mt-20 text-lg">Giỏ hàng đang trống</div>}
        </div>

        <div className="p-4 bg-white border-t space-y-3">
          <div className="flex justify-between items-center p-3 bg-gray-50 border rounded-xl">
            <b className="text-gray-600 text-lg">Tổng tiền:</b>
            <b className="text-2xl text-blue-600">{formatMoney(cartTotal)}</b>
          </div>
          <button disabled={cart.length === 0} onClick={() => setPrintOrder({ id: 'NHAP', date: new Date().toISOString(), items: cart, total: cartTotal, customerName: selectedCustomer ? selectedCustomer.name : 'Khách lẻ' })} className="w-full bg-blue-50 text-blue-700 py-3 font-bold rounded-xl border flex justify-center items-center gap-2 hover:bg-blue-100 transition-colors">
            <ImageIcon size={20} /> Xem & In Hóa đơn
          </button>
          <div className="flex gap-2">
            <button disabled={isProcessing || cart.length === 0} onClick={() => handleCheckout('DEBT')} className="flex-1 bg-orange-100 text-orange-700 font-bold py-4 rounded-xl hover:bg-orange-200 transition-colors text-lg">GHI NỢ</button>
            <button disabled={isProcessing || cart.length === 0} onClick={() => handleCheckout('PAID')} className="flex-1 bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-green-700 transition-colors text-lg">LƯU ĐƠN (ĐÃ THU)</button>
          </div>
        </div>
      </div>

      <OrderPrintModal order={printOrder} storeConfig={storeConfig} onClose={() => setPrintOrder(null)} />

      <Modal isOpen={showAddCustomer} onClose={() => setShowAddCustomer(false)} title="Thêm Khách Hàng Mới">
        <form onSubmit={saveNewCustomer} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1">Tên khách hàng *</label>
            <input required placeholder="Nhập tên..." value={newCustomerForm.name} onChange={e => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })} className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Số điện thoại</label>
            <input placeholder="Nhập SĐT..." value={newCustomerForm.phone} onChange={e => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })} className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-lg shadow hover:bg-blue-700">Lưu thông tin</button>
        </form>
      </Modal>
    </div>
  );
}

// ==========================================
// 3. IN HÓA ĐƠN (Ghi chú và Bảo hành tách thành 2 cột dọc)
// ==========================================
function OrderPrintModal({ order, storeConfig, onClose }) {
  const [opt, setOpt] = useState({ s: storeConfig?.printDefaultSize || 'a4', l: true, n: true, b: true });
  const [loading, setLoading] = useState(false);

  const saveJPG = async () => {
    const el = document.getElementById('rcp');
    if (window.html2canvas && el) {
      setLoading(true);
      try {
        const cv = await window.html2canvas(el, { scale: 2, useCORS: true });
        const ln = document.createElement('a');
        ln.download = `HD_${order.id || 'NHAP'}.jpg`;
        ln.href = cv.toDataURL('image/jpeg', 0.9);
        ln.click();
      } catch (e) { alert("Lỗi lưu ảnh!"); } finally { setLoading(false); }
    } else {
      alert("Đang tải công cụ, thử lại sau 2 giây...");
    }
  };

  if (!order) return null;
  return (
    <Modal isOpen={true} onClose={onClose} noHeader={true} maxWidth="max-w-2xl">
      <div className="bg-blue-50 p-3 border-b flex flex-wrap gap-2 items-center justify-between no-print shadow-sm">
        <b className="text-blue-800">Cấu hình In / Lưu Ảnh</b>
        <div className="flex gap-3 items-center text-sm">
          <select value={opt.s} onChange={e => setOpt({ ...opt, s: e.target.value })} className="p-1.5 border rounded bg-white">
            <option value="bill">Máy in nhiệt K80</option>
            <option value="a4">Giấy A4</option>
          </select>
          <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={opt.l} onChange={e => setOpt({ ...opt, l: e.target.checked })} /> Logo</label>
          <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={opt.n} onChange={e => setOpt({ ...opt, n: e.target.checked })} /> Ghi chú</label>
          <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={opt.b} onChange={e => setOpt({ ...opt, b: e.target.checked })} /> Bảo hành</label>
          <button onClick={saveJPG} disabled={loading} className="bg-blue-600 text-white px-3 py-1.5 rounded font-bold flex items-center gap-1"><ImageIcon size={16} />{loading ? 'Đang xử lý...' : 'Lưu JPG'}</button>
          <button onClick={() => window.print()} className="bg-gray-700 text-white px-3 py-1.5 rounded font-bold flex items-center gap-1"><Printer size={16} />In giấy</button>
          <button onClick={onClose} className="text-red-500 font-bold hover:bg-red-100 p-1.5 rounded"><X size={20} /></button>
        </div>
      </div>
      <div className="p-6 bg-gray-200 flex justify-center overflow-auto print:p-0 print:bg-white min-h-[500px]">
        <div id="rcp" className="bg-white p-6 shadow-md print:shadow-none" style={{ width: opt.s === 'bill' ? '300px' : '794px' }}>
          <div className="text-center border-b-2 border-black pb-3 mb-4">
            {opt.l && storeConfig?.logo && <img src={storeConfig.logo} alt="Logo" className="max-h-16 mx-auto mb-2 object-contain" />}
            <h2 className="font-bold uppercase text-lg">{storeConfig?.name || 'Cửa hàng SmartPOS'}</h2>
            <p className="text-xs mt-1">ĐC: {storeConfig?.address}</p>
            <p className="text-xs mt-1">SĐT: {storeConfig?.phone}</p>
            <h1 className="font-bold mt-3 text-base underline">HÓA ĐƠN BÁN HÀNG</h1>
            <p className="text-[11px] mt-1">Mã HĐ: #{order.id} | Ngày: {formatDate(order.date)}</p>
          </div>
          <p className="text-sm mb-3"><b>Khách hàng:</b> {order.customerName}</p>
          <table className="w-full text-sm mb-6 border-collapse">
            <thead className="border-b-2 border-black">
              <tr>
                <th className="py-2 text-left">Sản phẩm</th>
                {opt.n && <th className="py-2 text-left">Ghi chú</th>}
                {opt.b && <th className="py-2 text-left">Bảo hành</th>}
                <th className="py-2 text-center w-12">SL</th>
                <th className="py-2 text-right w-24">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((i, idx) => (
                <tr key={idx} className="border-b border-gray-300 border-dashed">
                  <td className="py-2 font-bold">{i.name}</td>
                  {opt.n && <td className="py-2 italic text-gray-700">{i.note || '-'}</td>}
                  {opt.b && <td className="py-2 text-gray-700">{i.warrantyValue ? `${i.warrantyValue} ${i.warrantyUnit}` : '-'}</td>}
                  <td className="py-2 text-center">{i.quantity}</td>
                  <td className="py-2 text-right font-bold">{formatMoney(i.price * i.quantity)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-black">
              <tr>
                <td colSpan={1 + (opt.n ? 1 : 0) + (opt.b ? 1 : 0)} className="py-3 text-right font-bold">TỔNG CỘNG:</td>
                <td colSpan="2" className="py-3 text-right font-bold text-lg text-blue-800">{formatMoney(order.total)}</td>
              </tr>
            </tfoot>
          </table>
          <p className="text-center text-xs italic mt-8 border-t pt-4 border-dashed">{storeConfig?.printFooterText || 'Xin chân thành cảm ơn quý khách!'}</p>
        </div>
      </div>
    </Modal>
  );
}

// ==========================================
// 4. SALES HISTORY VIEW
// ==========================================
function SalesHistoryView({ data, storeId, storeConfig, showToast }) {
  const [search, setSearch] = useState('');
  const [printOrder, setPrintOrder] = useState(null);
  const [editOrder, setEditOrder] = useState(null);

  const filteredOrders = data.orders.filter(o => o.id.includes(search.toUpperCase()) || o.customerName?.toLowerCase().includes(search.toLowerCase())).sort((a, b) => new Date(b.date) - new Date(a.date));

  const handleDelete = async (o) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này và hoàn lại số lượng vào kho?")) return;
    const batch = writeBatch(db);
    o.items.forEach(i => {
      const p = data.products.find(x => x.id === i.id);
      if (p) batch.update(doc(db, 'stores', storeId, 'products', p.id), { stock: (p.stock || 0) + i.quantity });
    });
    batch.delete(doc(db, 'stores', storeId, 'orders', o.id));
    await batch.commit();
    showToast("Đã hủy đơn hàng thành công");
  };

  const handleSaveEdit = async () => {
    if (!editOrder) return;
    const newTotal = editOrder.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    await updateDoc(doc(db, 'stores', storeId, 'orders', editOrder.id), { items: editOrder.items, total: newTotal });
    setEditOrder(null);
    showToast("Đã cập nhật đơn hàng thành công!");
  };

  return (
    <div className="flex-1 p-6 bg-gray-50 flex flex-col h-full">
      <div className="flex justify-between mb-4 items-center">
        <h2 className="text-xl font-bold">Lịch sử Bán Hàng</h2>
        <input placeholder="Tìm theo mã đơn hoặc tên khách..." value={search} onChange={e => setSearch(e.target.value)} className="p-2 border rounded-lg w-80 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
      </div>
      <div className="flex-1 bg-white border rounded-xl shadow-sm overflow-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-100 sticky top-0 border-b">
            <tr>
              <th className="p-4">Mã Đơn / Ngày</th>
              <th className="p-4">Khách hàng</th>
              <th className="p-4 w-1/3">Chi tiết SP (Ghi chú/BH)</th>
              <th className="p-4 text-right">Tổng tiền</th>
              <th className="p-4 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(o => (
              <tr key={o.id} className="border-b align-top hover:bg-gray-50">
                <td className="p-4">
                  <b className="text-blue-600 block">#{o.id}</b>
                  <span className="text-xs text-gray-500 block mt-1">{formatDate(o.date)}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold mt-1 inline-block ${o.status === 'DEBT' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                    {o.status === 'DEBT' ? 'GHI NỢ' : 'ĐÃ THU'}
                  </span>
                </td>
                <td className="p-4 font-bold">{o.customerName}</td>
                <td className="p-4">
                  {o.items.map((i, idx) => (
                    <div key={idx} className="mb-2 border-b border-dashed border-gray-200 pb-2 last:border-0 last:mb-0 last:pb-0">
                      <b className="text-sm">{i.name}</b> <span className="text-blue-600 font-bold">(x{i.quantity})</span> <span className="text-gray-500 text-xs ml-1">[{formatMoney(i.price)}]</span>
                      {i.note && <div className="text-xs text-gray-500 mt-1 italic">GC: {i.note}</div>}
                      {i.warrantyValue && <div className="text-xs text-gray-500 mt-1">BH: {i.warrantyValue} {i.warrantyUnit}</div>}
                    </div>
                  ))}
                </td>
                <td className="p-4 font-black text-right text-blue-800">{formatMoney(o.total)}</td>
                <td className="p-4">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => setPrintOrder(o)} className="bg-blue-50 text-blue-600 p-2 rounded hover:bg-blue-100" title="In / Lưu ảnh"><Printer size={18} /></button>
                    <button onClick={() => setEditOrder(JSON.parse(JSON.stringify(o)))} className="bg-gray-100 text-gray-700 p-2 rounded hover:bg-gray-200" title="Sửa đơn"><Edit size={18} /></button>
                    <button onClick={() => handleDelete(o)} className="bg-red-50 text-red-600 p-2 rounded hover:bg-red-100" title="Hủy hoàn kho"><Trash2 size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <OrderPrintModal order={printOrder} storeConfig={storeConfig} onClose={() => setPrintOrder(null)} />

      {editOrder && (
        <Modal isOpen={true} onClose={() => setEditOrder(null)} title={`Sửa Hóa Đơn #${editOrder.id}`} maxWidth="max-w-2xl">
          <div className="space-y-4">
            {editOrder.items.map(item => (
              <div key={item.id} className="border p-4 rounded-xl bg-gray-50 shadow-sm">
                <p className="font-bold mb-3 text-blue-800">{item.name}</p>
                <div className="flex gap-3 mb-3">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 block mb-1">Giá bán mới</label>
                    <input type="number" value={item.price} onChange={e => setEditOrder({ ...editOrder, items: editOrder.items.map(x => x.id === item.id ? { ...x, price: Number(e.target.value) } : x) })} className="w-full p-2 border rounded-lg outline-none font-bold" />
                  </div>
                  <div className="w-24">
                    <label className="text-xs text-gray-500 block mb-1">Số lượng</label>
                    <input type="number" value={item.quantity} onChange={e => setEditOrder({ ...editOrder, items: editOrder.items.map(x => x.id === item.id ? { ...x, quantity: Number(e.target.value) } : x) })} className="w-full p-2 border rounded-lg text-center outline-none font-bold" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 block mb-1">Ghi chú mới</label>
                    <input value={item.note || ''} onChange={e => setEditOrder({ ...editOrder, items: editOrder.items.map(x => x.id === item.id ? { ...x, note: e.target.value } : x) })} className="w-full p-2 border rounded-lg text-sm outline-none" />
                  </div>
                  <div className="w-20">
                    <label className="text-xs text-gray-500 block mb-1">Bảo hành</label>
                    <input value={item.warrantyValue || ''} onChange={e => setEditOrder({ ...editOrder, items: editOrder.items.map(x => x.id === item.id ? { ...x, warrantyValue: e.target.value } : x) })} className="w-full p-2 border rounded-lg text-sm text-center outline-none" />
                  </div>
                  <div className="w-24">
                    <label className="text-xs text-gray-500 block mb-1">Đơn vị</label>
                    <select value={item.warrantyUnit || 'tháng'} onChange={e => setEditOrder({ ...editOrder, items: editOrder.items.map(x => x.id === item.id ? { ...x, warrantyUnit: e.target.value } : x) })} className="w-full p-2 border rounded-lg text-sm bg-white outline-none">
                      <option value="ngày">Ngày</option><option value="tuần">Tuần</option><option value="tháng">Tháng</option><option value="năm">Năm</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
            <div className="text-right font-black text-xl text-blue-800 py-3 border-t">
              Tổng tiền cập nhật: {formatMoney(editOrder.items.reduce((sum, i) => sum + (i.price * i.quantity), 0))}
            </div>
            <button onClick={handleSaveEdit} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg flex justify-center gap-2 items-center text-lg hover:bg-blue-700">
              <Save size={20} /> Lưu Thay Đổi
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ==========================================
// 5. IMPORT VIEW
// ==========================================
function ImportView({ data, storeId, user, showToast }) {
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  const updateCart = (id, field, value) => setCart(prev => prev.map(item => item.id === id ? { ...item, [field]: Number(value) } : item));
  const cartTotal = cart.reduce((sum, item) => sum + (item.importCost * item.quantity), 0);

  const handleImport = async (status) => {
    if (cart.length === 0) return;
    const importId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const batch = writeBatch(db);

    cart.forEach(item => {
      batch.update(doc(db, 'stores', storeId, 'products', item.id), {
        stock: (item.stock || 0) + item.quantity,
        cost: item.importCost 
      });
    });

    batch.set(doc(collection(db, 'stores', storeId, 'imports'), importId), {
      id: importId, date: new Date().toISOString(), items: cart, total: cartTotal, status,
      supplierId: selectedSupplier?.id || null, supplierName: selectedSupplier?.name || 'Nhà CC lẻ', userId: user.uid
    });

    if (status === 'DEBT' && selectedSupplier) {
      batch.update(doc(db, 'stores', storeId, 'suppliers', selectedSupplier.id), {
        totalDebt: (selectedSupplier.totalDebt || 0) + cartTotal
      });
    }

    await batch.commit();
    showToast("Đã lưu phiếu nhập hàng!");
    setCart([]);
    setSelectedSupplier(null);
  };

  return (
    <div className="flex h-full bg-gray-50">
      <div className="flex-1 p-4 border-r overflow-auto flex flex-col">
        <input placeholder="Tìm sản phẩm để nhập kho..." value={search} onChange={e => setSearch(e.target.value)} className="w-full p-3 mb-4 border rounded-xl outline-none focus:ring-2 focus:ring-purple-500 shadow-sm" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 flex-1 overflow-auto content-start">
          {data.products.filter(p => p.name?.toLowerCase().includes(search.toLowerCase())).map(p => (
            <div key={p.id} onClick={() => setCart(prev => prev.find(x => x.id === p.id) ? prev.map(x => x.id === p.id ? { ...x, quantity: x.quantity + 1 } : x) : [...prev, { ...p, quantity: 1, importCost: p.cost || 0 }])} className="bg-white p-3 border rounded-xl cursor-pointer hover:border-purple-500 shadow-sm">
              <b className="text-sm block mb-1">{p.name}</b>
              <span className="text-purple-600 text-xs font-bold block">Vốn HT: {formatMoney(p.cost)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="w-[400px] bg-white flex flex-col shadow-xl z-10">
        <div className="p-4 border-b bg-gray-50">
          <select value={selectedSupplier?.id || ''} onChange={e => setSelectedSupplier(data.suppliers.find(x => x.id === e.target.value) || null)} className="w-full p-2.5 border rounded-lg bg-white outline-none font-bold text-purple-800">
            <option value="">-- Nhà cung cấp lẻ --</option>
            {data.suppliers.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
        </div>
        <div className="flex-1 p-3 overflow-auto space-y-3 bg-gray-100">
          {cart.map(item => (
            <div key={item.id} className="bg-white p-3 rounded-xl border shadow-sm">
              <div className="flex justify-between mb-2">
                <b className="text-sm">{item.name}</b>
                <button onClick={() => setCart(prev => prev.filter(x => x.id !== item.id))} className="text-red-500 font-bold bg-red-50 px-2 rounded text-xs hover:bg-red-100">Xóa</button>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 block mb-1">Giá nhập mới</label>
                  <input type="number" value={item.importCost} onChange={e => updateCart(item.id, 'importCost', e.target.value)} className="w-full p-2 border rounded font-bold text-purple-600 outline-none focus:ring-1 focus:ring-purple-500" />
                </div>
                <div className="w-20">
                  <label className="text-xs text-gray-500 block mb-1">Số lượng</label>
                  <input type="number" value={item.quantity} onChange={e => updateCart(item.id, 'quantity', e.target.value)} className="w-full p-2 border rounded font-bold text-center outline-none focus:ring-1 focus:ring-purple-500" />
                </div>
              </div>
            </div>
          ))}
          {cart.length === 0 && <p className="text-center text-gray-400 mt-10">Phiếu nhập trống</p>}
        </div>
        <div className="p-4 border-t bg-white space-y-4">
          <div className="flex justify-between items-center p-3 bg-gray-50 border rounded-xl">
            <span className="font-bold text-gray-600">Tổng tiền nhập:</span>
            <b className="text-2xl text-purple-600">{formatMoney(cartTotal)}</b>
          </div>
          <div className="flex gap-2">
            <button disabled={cart.length === 0} onClick={() => handleImport('DEBT')} className="flex-1 bg-orange-100 text-orange-700 py-3 rounded-xl font-bold text-lg hover:bg-orange-200">GHI NỢ</button>
            <button disabled={cart.length === 0} onClick={() => handleImport('PAID')} className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-bold text-lg shadow hover:bg-purple-700">ĐÃ THANH TOÁN</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 6. INVENTORY VIEW
// ==========================================
function InventoryView({ data, storeId, showToast }) {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [sortOrder, setSortOrder] = useState('name_asc');

  const handleSave = async (e) => {
    e.preventDefault();
    const productData = { name: formData.name, category: formData.category || '', price: Number(formData.price), cost: Number(formData.cost || 0), stock: Number(formData.stock) };
    if (formData.id) await updateDoc(doc(db, 'stores', storeId, 'products', formData.id), productData);
    else await addDoc(collection(db, 'stores', storeId, 'products'), productData);
    setShowModal(false);
    showToast("Đã lưu hàng hóa thành công");
  };

  const handleDelete = async (id) => {
    if (window.confirm("Chắc chắn xóa sản phẩm này?")) {
      await deleteDoc(doc(db, 'stores', storeId, 'products', id));
      showToast("Đã xóa sản phẩm");
    }
  };

  const sortedData = [...data].filter(x => x.name?.toLowerCase().includes(search.toLowerCase())).sort((a, b) => {
    const [key, direction] = sortOrder.split('_');
    if (key === 'name') return direction === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    return direction === 'asc' ? a[key] - b[key] : b[key] - a[key];
  });

  return (
    <div className="p-6 bg-gray-50 flex-1 h-full flex flex-col">
      <div className="flex justify-between mb-4 items-center">
        <h2 className="text-2xl font-bold">Quản Lý Kho Hàng</h2>
        <div className="flex gap-3 items-center">
          <select value={sortOrder} onChange={e => setSortOrder(e.target.value)} className="p-2.5 border rounded-lg outline-none bg-white font-medium shadow-sm">
            <option value="name_asc">Tên A-Z</option>
            <option value="name_desc">Tên Z-A</option>
            <option value="price_desc">Giá bán: Cao đến Thấp</option>
            <option value="price_asc">Giá bán: Thấp đến Cao</option>
            <option value="cost_desc">Giá vốn: Cao đến Thấp</option>
            <option value="cost_asc">Giá vốn: Thấp đến Cao</option>
            <option value="stock_desc">Tồn kho: Nhiều nhất</option>
            <option value="stock_asc">Tồn kho: Ít nhất</option>
          </select>
          <input placeholder="Tìm kiếm hàng hóa..." value={search} onChange={e => setSearch(e.target.value)} className="p-2.5 border rounded-lg w-64 outline-none shadow-sm focus:ring-2 focus:ring-blue-500" />
          <button onClick={() => { setFormData({}); setShowModal(true); }} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold shadow hover:bg-blue-700 flex items-center gap-2"><Plus size={18}/> Thêm mới</button>
        </div>
      </div>
      <div className="bg-white border rounded-xl shadow-sm overflow-auto flex-1">
        <table className="w-full text-left">
          <thead className="bg-gray-100 border-b sticky top-0">
            <tr>
              <th className="p-4">Tên hàng hóa</th>
              <th className="p-4">Nhóm</th>
              <th className="p-4 text-right">Giá Vốn</th>
              <th className="p-4 text-right">Giá Bán</th>
              <th className="p-4 text-center">Tồn kho</th>
              <th className="p-4 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map(p => (
              <tr key={p.id} className="border-b hover:bg-gray-50 transition-colors">
                <td className="p-4 font-bold">{p.name}</td>
                <td className="p-4 text-gray-600">{p.category || '-'}</td>
                <td className="p-4 text-right">{formatMoney(p.cost)}</td>
                <td className="p-4 text-right font-bold text-blue-600">{formatMoney(p.price)}</td>
                <td className="p-4 text-center">
                  <span className={`px-3 py-1 rounded-full font-bold text-sm ${p.stock <= 5 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-700'}`}>{p.stock}</span>
                </td>
                <td className="p-4 text-center">
                  <button onClick={() => { setFormData(p); setShowModal(true); }} className="text-blue-600 bg-blue-50 p-2 rounded hover:bg-blue-100 mr-2"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(p.id)} className="text-red-600 bg-red-50 p-2 rounded hover:bg-red-100"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={formData.id ? "Sửa hàng hóa" : "Thêm hàng hóa mới"}>
        <form onSubmit={handleSave} className="space-y-4">
          <div><label className="block text-sm font-bold mb-1">Tên hàng hóa *</label><input required value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div><label className="block text-sm font-bold mb-1">Nhóm hàng</label><input value={formData.category || ''} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-bold mb-1">Giá vốn *</label><input required type="number" value={formData.cost || ''} onChange={e => setFormData({ ...formData, cost: e.target.value })} className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="block text-sm font-bold mb-1">Giá bán *</label><input required type="number" value={formData.price || ''} onChange={e => setFormData({ ...formData, price: e.target.value })} className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
          </div>
          <div><label className="block text-sm font-bold mb-1">Tồn kho ban đầu *</label><input required type="number" value={formData.stock || ''} onChange={e => setFormData({ ...formData, stock: e.target.value })} className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-blue-700 mt-2">Lưu thông tin</button>
        </form>
      </Modal>
    </div>
  );
}

// ==========================================
// 7. CONTACT VIEW (Khách hàng & NCC + Lịch sử chi tiết)
// ==========================================
function ContactView({ type, dataList, orders, storeId, showToast }) {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [sortOrder, setSortOrder] = useState('debt_desc');

  const [historyContact, setHistoryContact] = useState(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const isCustomer = type === 'customers';

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = { name: formData.name, phone: formData.phone || '', totalDebt: Number(formData.totalDebt || 0) };
    if (formData.id) await updateDoc(doc(db, 'stores', storeId, type, formData.id), payload);
    else await addDoc(collection(db, 'stores', storeId, type), payload);
    setShowModal(false);
    showToast("Đã lưu thông tin liên hệ");
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn chắc chắn muốn xóa liên hệ này?")) {
      await deleteDoc(doc(db, 'stores', storeId, type, id));
      showToast("Đã xóa liên hệ");
    }
  };

  const sortedList = [...dataList].filter(x => x.name?.toLowerCase().includes(search.toLowerCase())).sort((a, b) => {
    const [key, direction] = sortOrder.split('_');
    if (key === 'name') return direction === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    return direction === 'asc' ? a.totalDebt - b.totalDebt : b.totalDebt - a.totalDebt;
  });

  const historyTransactions = useMemo(() => {
    if (!historyContact) return [];
    let list = orders.filter(x => isCustomer ? x.customerId === historyContact.id : x.supplierId === historyContact.id);
    if (dateFrom) list = list.filter(x => x.date >= dateFrom);
    if (dateTo) list = list.filter(x => x.date <= dateTo + 'T23:59:59');
    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [historyContact, dateFrom, dateTo, orders, isCustomer]);

  const generatedDebt = historyTransactions.filter(x => x.status === 'DEBT').reduce((sum, x) => sum + x.total, 0);

  return (
    <div className="p-6 bg-gray-50 flex-1 h-full flex flex-col">
      <div className="flex justify-between mb-4 items-center">
        <h2 className="text-2xl font-bold">Quản lý {isCustomer ? 'Khách hàng' : 'Nhà cung cấp'}</h2>
        <div className="flex gap-3 items-center">
          <select value={sortOrder} onChange={e => setSortOrder(e.target.value)} className="p-2.5 border rounded-lg bg-white outline-none shadow-sm">
            <option value="debt_desc">Tiền Nợ: Cao đến Thấp</option>
            <option value="debt_asc">Tiền Nợ: Thấp đến Cao</option>
            <option value="name_asc">Tên A-Z</option>
            <option value="name_desc">Tên Z-A</option>
          </select>
          <input placeholder="Tìm kiếm tên..." value={search} onChange={e => setSearch(e.target.value)} className="p-2.5 border rounded-lg w-64 outline-none shadow-sm focus:ring-2 focus:ring-blue-500" />
          <button onClick={() => { setFormData({}); setShowModal(true); }} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold shadow hover:bg-blue-700 flex items-center gap-2"><Plus size={18}/> Thêm mới</button>
        </div>
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-auto flex-1">
        <table className="w-full text-left">
          <thead className="bg-gray-100 border-b sticky top-0">
            <tr>
              <th className="p-4">Tên</th>
              <th className="p-4">Số điện thoại</th>
              <th className="p-4 text-right">Tổng Nợ hiện tại</th>
              <th className="p-4 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {sortedList.map(c => (
              <tr key={c.id} className="border-b hover:bg-gray-50">
                <td className="p-4 font-bold text-lg">{c.name}</td>
                <td className="p-4 text-gray-600">{c.phone || '-'}</td>
                <td className="p-4 text-right font-black text-red-600 text-lg">{formatMoney(c.totalDebt)}</td>
                <td className="p-4 text-center">
                  <button onClick={() => setHistoryContact(c)} className="text-green-600 bg-green-50 p-2.5 rounded-lg hover:bg-green-100 mr-2 border border-green-200 shadow-sm" title="Xem chi tiết lịch sử mua bán và nợ"><Eye size={18} /></button>
                  <button onClick={() => { setFormData(c); setShowModal(true); }} className="text-blue-600 bg-blue-50 p-2.5 rounded-lg hover:bg-blue-100 mr-2"><Edit size={18} /></button>
                  <button onClick={() => handleDelete(c.id)} className="text-red-600 bg-red-50 p-2.5 rounded-lg hover:bg-red-100"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={isCustomer ? "Khách hàng" : "Nhà cung cấp"}>
        <form onSubmit={handleSave} className="space-y-4">
          <div><label className="block text-sm font-bold mb-1">Tên *</label><input required value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div><label className="block text-sm font-bold mb-1">Số điện thoại</label><input value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div><label className="block text-sm font-bold mb-1">Thiết lập lại tổng Nợ (nếu cần)</label><input type="number" value={formData.totalDebt || 0} onChange={e => setFormData({ ...formData, totalDebt: e.target.value })} className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-bold text-red-600" /></div>
          <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-blue-700">Lưu thông tin</button>
        </form>
      </Modal>

      <Modal isOpen={!!historyContact} onClose={() => { setHistoryContact(null); setDateFrom(''); setDateTo(''); }} title={`Lịch sử giao dịch: ${historyContact?.name}`} maxWidth="max-w-4xl">
        <div className="bg-gray-50 p-4 rounded-xl border mb-4 flex gap-4 items-end shadow-sm">
          <div><label className="block text-xs font-bold text-gray-500 mb-1">Từ ngày</label><input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="p-2 border rounded outline-none" /></div>
          <div><label className="block text-xs font-bold text-gray-500 mb-1">Đến ngày</label><input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="p-2 border rounded outline-none" /></div>
          <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="bg-gray-200 text-gray-700 px-4 py-2 rounded font-bold hover:bg-gray-300">Bỏ lọc</button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-red-50 p-3 rounded-lg border border-red-100"><p className="text-red-800 text-sm font-bold mb-1">Nợ phát sinh trong kỳ lọc:</p><p className="text-2xl font-black text-red-600">{formatMoney(generatedDebt)}</p></div>
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100"><p className="text-blue-800 text-sm font-bold mb-1">Tổng Nợ hiện tại (toàn thời gian):</p><p className="text-2xl font-black text-blue-600">{formatMoney(historyContact?.totalDebt)}</p></div>
        </div>

        <div className="max-h-96 overflow-auto border rounded-xl shadow-sm bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 sticky top-0 border-b">
              <tr>
                <th className="p-3">Ngày giao dịch</th>
                <th className="p-3">Chi tiết {isCustomer ? 'Bán' : 'Nhập'}</th>
                <th className="p-3 text-right">Tổng tiền phiếu</th>
                <th className="p-3 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {historyTransactions.map(tx => (
                <tr key={tx.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 text-gray-600">{formatDate(tx.date)}</td>
                  <td className="p-3">
                    {tx.items.map((i, idx) => (
                      <div key={idx} className="mb-1"><b className="text-gray-800">{i.name}</b> <span className="text-blue-600 text-xs font-bold">(x{i.quantity || i.q})</span></div>
                    ))}
                  </td>
                  <td className="p-3 text-right font-black">{formatMoney(tx.total)}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-1 rounded font-bold text-xs ${tx.status === 'DEBT' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                      {tx.status === 'DEBT' ? 'GHI NỢ' : 'ĐÃ THANH TOÁN'}
                    </span>
                  </td>
                </tr>
              ))}
              {historyTransactions.length === 0 && <tr><td colSpan="4" className="p-6 text-center text-gray-400">Không có dữ liệu giao dịch trong khoảng thời gian này.</td></tr>}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
}

// ==========================================
// 8. EXPENSES VIEW
// ==========================================
function ExpenseView({ data, storeId, showToast }) {
  const [form, setForm] = useState({ amount: '', note: '' });
  const [sortOrder, setSortOrder] = useState('date_desc');

  const handleAdd = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, 'stores', storeId, 'expenses'), { amount: Number(form.amount), note: form.note, date: new Date().toISOString() });
    setForm({ amount: '', note: '' });
    showToast("Đã thêm phiếu chi thành công!");
  };

  const handleDelete = async (id) => {
    if (window.confirm("Xóa phiếu chi này?")) {
      await deleteDoc(doc(db, 'stores', storeId, 'expenses', id));
      showToast("Đã xóa phiếu chi");
    }
  };

  const sortedData = [...data].sort((a, b) => {
    const [key, direction] = sortOrder.split('_');
    if (key === 'date') return direction === 'asc' ? new Date(a.date) - new Date(b.date) : new Date(b.date) - new Date(a.date);
    return direction === 'asc' ? a.amount - b.amount : b.amount - a.amount;
  });

  return (
    <div className="p-6 bg-gray-50 flex-1 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Quản lý Chi Phí</h2>
        <select value={sortOrder} onChange={e => setSortOrder(e.target.value)} className="p-2.5 border rounded-lg bg-white outline-none shadow-sm">
          <option value="date_desc">Ngày gần nhất</option>
          <option value="date_asc">Ngày xa nhất</option>
          <option value="amt_desc">Số tiền: Cao đến Thấp</option>
          <option value="amt_asc">Số tiền: Thấp đến Cao</option>
        </select>
      </div>

      <form onSubmit={handleAdd} className="bg-white p-4 rounded-xl border shadow-sm mb-6 flex gap-3">
        <input required type="number" placeholder="Nhập số tiền..." value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="p-3 border rounded-lg outline-none focus:ring-2 focus:ring-orange-500 w-48 font-bold text-orange-600" />
        <input required placeholder="Nội dung chi phí (ví dụ: Tiền điện, Cơm trưa...)" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} className="p-3 border rounded-lg flex-1 outline-none focus:ring-2 focus:ring-orange-500" />
        <button type="submit" className="bg-orange-600 text-white px-8 rounded-lg font-bold shadow hover:bg-orange-700 flex items-center gap-2"><Plus size={18} /> Thêm khoản chi</button>
      </form>

      <div className="bg-white border rounded-xl shadow-sm overflow-auto flex-1">
        <table className="w-full text-left">
          <thead className="bg-gray-100 border-b sticky top-0">
            <tr>
              <th className="p-4">Ngày chi</th>
              <th className="p-4">Nội dung</th>
              <th className="p-4 text-right">Số tiền</th>
              <th className="p-4 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map(e => (
              <tr key={e.id} className="border-b hover:bg-gray-50">
                <td className="p-4 text-gray-500">{formatDate(e.date)}</td>
                <td className="p-4 font-bold text-gray-800">{e.note}</td>
                <td className="p-4 text-orange-600 font-black text-right text-lg">{formatMoney(e.amount)}</td>
                <td className="p-4 text-center">
                  <button onClick={() => handleDelete(e.id)} className="text-red-600 bg-red-50 p-2 rounded hover:bg-red-100"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==========================================
// 9. SETTINGS VIEW
// ==========================================
function SettingsView({ config, storeId, showToast }) {
  const [formData, setFormData] = useState(config);
  const handleSave = async (e) => {
    e.preventDefault();
    await setDoc(doc(db, 'stores', storeId), formData, { merge: true });
    showToast("Đã lưu cấu hình cửa hàng thành công!");
  };
  return (
    <div className="p-6 bg-gray-50 flex-1 overflow-auto">
      <h2 className="text-2xl font-bold mb-6">Cài đặt Cửa hàng</h2>
      <form onSubmit={handleSave} className="bg-white p-6 rounded-xl border shadow-sm max-w-lg space-y-4">
        <div><label className="block text-sm font-bold mb-1">Tên Cửa hàng</label><input value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-bold" /></div>
        <div><label className="block text-sm font-bold mb-1">Địa chỉ</label><input value={formData.address || ''} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
        <div><label className="block text-sm font-bold mb-1">Số điện thoại</label><input value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
        <div><label className="block text-sm font-bold mb-1">Link Logo (URL hình ảnh)</label><input value={formData.logo || ''} onChange={e => setFormData({ ...formData, logo: e.target.value })} className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="https://..." /></div>
        <div>
          <label className="block text-sm font-bold mb-1">Khổ giấy in mặc định</label>
          <select value={formData.printDefaultSize || 'a4'} onChange={e => setFormData({ ...formData, printDefaultSize: e.target.value })} className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="a4">Giấy A4</option><option value="bill">Máy in nhiệt K80</option>
          </select>
        </div>
        <div><label className="block text-sm font-bold mb-1">Lời cảm ơn trên Hóa đơn</label><input value={formData.printFooterText || ''} onChange={e => setFormData({ ...formData, printFooterText: e.target.value })} className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
        <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-lg shadow hover:bg-blue-700 mt-4">Lưu Cấu Hình</button>
      </form>
    </div>
  );
}

// ==========================================
// 10. STAFF VIEW
// ==========================================
function StaffView({ staffList, showToast }) {
  const [formData, setFormData] = useState({ id: '', username: '', password: '', email: '', role: 'staff', name: '' });
  const [permissions, setPermissions] = useState({});
  const [showModal, setShowModal] = useState(false);

  const permissionList = [
    { id: 'tong_quan_xem', label: 'Tab Báo cáo' }, { id: 'ban_hang', label: 'Tab Lịch sử bán' },
    { id: 'mua_nhap_hang', label: 'Tab Nhập hàng' }, { id: 'hh_danh_sach', label: 'Tab Kho hàng' },
    { id: 'kh_danh_sach', label: 'Tab Khách hàng' }, { id: 'mua_ncc', label: 'Tab Nhà cung cấp' },
    { id: 'quy_so_quy', label: 'Tab Chi phí' }
  ];

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await updateDoc(doc(db, 'users_db', formData.id), { name: formData.name, role: formData.role, perms: formData.role === 'admin' ? {} : permissions });
        showToast("Cập nhật quyền Nhân viên thành công!");
        setShowModal(false);
      } else {
        const { getApp, initializeApp } = await import('firebase/app');
        const { getAuth, createUserWithEmailAndPassword } = await import('firebase/auth');
        let secondaryApp;
        try { secondaryApp = initializeApp(getApp().options, "Secondary"); } catch { secondaryApp = getApp("Secondary"); }
        const cred = await createUserWithEmailAndPassword(getAuth(secondaryApp), formData.email, formData.password);
        await setDoc(doc(db, 'users_db', cred.user.uid), { username: formData.username, email: formData.email, name: formData.name, role: formData.role, perms: formData.role === 'admin' ? {} : permissions });
        await getAuth(secondaryApp).signOut();
        setShowModal(false);
        showToast("Đã tạo Nhân viên mới thành công!");
      }
    } catch (err) { showToast("Lỗi khi tạo hoặc sửa nhân viên!", "error"); }
  };

  const handleResetPassword = async () => {
    if (!formData.email) return;
    try {
      await sendPasswordResetEmail(auth, formData.email);
      showToast(`Đã gửi đường link đặt lại mật khẩu vào email: ${formData.email}`);
    } catch (e) { showToast("Lỗi gửi link reset mật khẩu", "error"); }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Cảnh báo: Bạn chỉ đang xóa nhân viên khỏi hệ thống phân quyền của ứng dụng. Tiếp tục?")) {
      await deleteDoc(doc(db, 'users_db', id));
      showToast("Đã xóa nhân viên");
    }
  };

  return (
    <div className="p-6 bg-gray-50 flex-1 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Quản lý Nhân viên & Phân quyền</h2>
        <button onClick={() => { setFormData({ id: '', username: '', password: '', email: '', role: 'staff', name: '' }); setPermissions({}); setShowModal(true); }} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold shadow hover:bg-blue-700 flex items-center gap-2"><Plus size={18} /> Thêm tài khoản</button>
      </div>
      
      <div className="bg-white border rounded-xl shadow-sm overflow-auto flex-1">
        <table className="w-full text-left">
          <thead className="bg-gray-100 border-b sticky top-0">
            <tr>
              <th className="p-4">Tên Nhân viên</th>
              <th className="p-4">Tài khoản (Username / Email)</th>
              <th className="p-4">Vai trò (Role)</th>
              <th className="p-4 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {staffList.map(s => (
              <tr key={s.id} className="border-b hover:bg-gray-50">
                <td className="p-4 font-bold text-gray-800">{s.name}</td>
                <td className="p-4 text-blue-600">{s.email || s.username}</td>
                <td className="p-4">
                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${s.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>{s.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}</span>
                </td>
                <td className="p-4 text-center">
                  {s.role !== 'admin' && (
                    <div className="flex justify-center gap-2">
                      <button onClick={() => { setFormData({ id: s.id, username: s.username || '', email: s.email || '', role: s.role, name: s.name }); setPermissions(s.perms || {}); setShowModal(true); }} className="text-blue-600 bg-blue-50 p-2.5 rounded-lg hover:bg-blue-100 border border-blue-200"><Edit size={18} /></button>
                      <button onClick={() => handleDelete(s.id)} className="text-red-600 bg-red-50 p-2.5 rounded-lg hover:bg-red-100 border border-red-200"><Trash2 size={18} /></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={formData.id ? "Sửa phân quyền Nhân viên" : "Tạo Nhân viên mới"}>
        <form onSubmit={handleSave} className="space-y-4">
          <div><label className="block text-sm font-bold mb-1">Tên hiển thị *</label><input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div><label className="block text-sm font-bold mb-1">Tên đăng nhập (Username) *</label><input required disabled={!!formData.id} value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} className={`w-full p-2.5 border rounded-lg outline-none ${formData.id ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500'}`} /></div>
          <div><label className="block text-sm font-bold mb-1">Email *</label><input required disabled={!!formData.id} type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className={`w-full p-2.5 border rounded-lg outline-none ${formData.id ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500'}`} /></div>
          {!formData.id && <div><label className="block text-sm font-bold mb-1">Mật khẩu (Ít nhất 6 ký tự) *</label><input required type="password" onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>}
          
          <div>
            <label className="block text-sm font-bold mb-1">Cấp quyền (Vai trò)</label>
            <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="staff">Nhân viên (Bị giới hạn)</option>
              <option value="admin">Quản trị viên (Toàn quyền)</option>
            </select>
          </div>

          {formData.role === 'staff' && (
            <div className="border p-4 rounded-xl bg-gray-50 shadow-inner">
              <p className="font-bold text-sm mb-3 text-blue-800">Cấp quyền xem các Tab:</p>
              <div className="grid grid-cols-2 gap-3">
                {permissionList.map(p => (
                  <label key={p.id} className="flex items-center gap-2 cursor-pointer p-1">
                    <input type="checkbox" checked={permissions[p.id] || false} onChange={e => setPermissions({ ...permissions, [p.id]: e.target.checked })} className="w-4 h-4 text-blue-600 rounded" /> 
                    <span className="text-sm font-medium">{p.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4 border-t">
            {formData.id && (
              <button type="button" onClick={handleResetPassword} className="flex-1 bg-orange-100 text-orange-700 py-3 rounded-lg font-bold hover:bg-orange-200 transition-colors">
                Gửi link Reset Mật khẩu
              </button>
            )}
            <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold shadow hover:bg-blue-700 transition-colors">
              Lưu thông tin
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
