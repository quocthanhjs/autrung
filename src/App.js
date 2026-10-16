import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, ShoppingCart, Package, Users, Truck, Plus, 
  Edit, Trash2, Check, X, Image as ImageIcon, ShoppingBag, 
  TrendingUp, AlertCircle, ArrowDownToLine, Phone, 
  DollarSign, CheckCircle2, Printer, FileText, CreditCard,
  Lock, LogOut, ShieldAlert, User as UserIcon, Database,
  UserCog, KeyRound, MonitorSmartphone, Mail, Download, Upload, ArrowUpDown, Search, Eye, BarChart3, AlertTriangle
} from 'lucide-react';

import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInWithEmailAndPassword, signOut, 
  onAuthStateChanged, sendPasswordResetEmail, createUserWithEmailAndPassword
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, onSnapshot, collection, writeBatch, query, orderBy, where } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyClQogCLby6OYpVzRwJ9181rmg1Lho5FV8",
  authDomain: "smartpos-5f5cf.firebaseapp.com",
  projectId: "smartpos-5f5cf",
  storageBucket: "smartpos-5f5cf.firebasestorage.app",
  messagingSenderId: "458225351603",
  appId: "1:458225351603:web:f67d06427def5a33dca9c6",
  measurementId: "G-0YW45XF8QL"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const PERMISSION_TREE = [
  { module: 'Tổng quan', perms: [{ id: 'tong_quan_xem', label: 'Xem tổng quan' }] },
  { module: 'Hàng hóa', perms: [{ id: 'hh_danh_sach', label: 'Danh sách hàng hóa' }, { id: 'hh_gia', label: 'Thiết lập giá' }] },
  { module: 'Mua hàng', perms: [{ id: 'mua_ncc', label: 'Danh sách nhà cung cấp' }, { id: 'mua_nhap_hang', label: 'Nhập hàng' }] },
  { module: 'Khách hàng', perms: [{ id: 'kh_danh_sach', label: 'Danh sách khách hàng' }] },
  { module: 'Sổ quỹ', perms: [{ id: 'quy_so_quy', label: 'Sổ quỹ / Chi phí' }] }
];

const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
const formatDate = (iso) => new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso));
const getDaysDifference = (isoDate) => Math.floor(Math.abs(new Date() - new Date(isoDate)) / (1000 * 60 * 60 * 24));
const getDeviceInfo = () => {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "Android";
  if (/iPad|iPhone|iPod/.test(ua)) return "iOS";
  return "Máy tính";
};

const Modal = ({ isOpen, onClose, title, children, maxWidth = "max-w-md", hideHeaderInPrint = false }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm print:bg-transparent print:p-0">
      <div className={"bg-white rounded-xl shadow-2xl w-full " + maxWidth + " overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:rounded-none print:w-full"}>
        {!hideHeaderInPrint && (
          <div className="flex justify-between items-center p-4 border-b shrink-0 print:hidden">
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
          </div>
        )}
        <div className="p-4 overflow-y-auto print:overflow-visible print:p-0">{children}</div>
      </div>
    </div>
  );
};

function LoginView({ onLoginSuccess }) {
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [resetMsg, setResetMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      let loginEmail = loginInput.trim();
      if (!loginEmail.includes('@')) {
        const q = query(collection(db, 'users_db'), where('username', '==', loginEmail));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          loginEmail = querySnapshot.docs[0].data().email;
        } else {
          throw new Error("Không tìm thấy Tên đăng nhập này!");
        }
      }

      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, password);
      const user = userCredential.user;

      let ip = "Không xác định";
      try { const res = await fetch('https://api.ipify.org?format=json'); ip = (await res.json()).ip; } catch (err) {}

      const userDocRef = doc(db, 'users_db', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      let role = 'admin', name = loginInput, perms = {};
      if (userDoc.exists()) {
        role = userDoc.data().role; name = userDoc.data().name; perms = userDoc.data().permissions || {};
      } else {
        await setDoc(userDocRef, { username: 'admin', email: loginEmail, role: 'admin', name: 'Admin', createdAt: new Date().toISOString() });
      }

      await addDoc(collection(db, 'login_logs'), { uid: user.uid, username: userDoc.exists() ? userDoc.data().username : 'admin', name, role, loginTime: new Date().toISOString(), ip, device: getDeviceInfo() });
      onLoginSuccess(user, role, name, perms);
    } catch (err) {
      setError(err.message === "Không tìm thấy Tên đăng nhập này!" ? err.message : "Tài khoản hoặc mật khẩu không đúng!");
    } finally { setLoading(false); }
  };

  const handleReset = async (e) => {
    e.preventDefault(); setError(''); setResetMsg(''); setLoading(true);
    try { await sendPasswordResetEmail(auth, loginInput); setResetMsg("Link khôi phục đã gửi vào Email!"); } 
    catch (err) { setError("Vui lòng nhập Email thật đã đăng ký để khôi phục."); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-blue-100 text-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><Lock size={32} /></div>
          <h1 className="text-2xl font-bold text-gray-800">SmartPOS Pro</h1>
          <p className="text-gray-500 text-sm mt-2">{isForgot ? 'Khôi phục mật khẩu' : 'Đăng nhập hệ thống'}</p>
        </div>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 mb-4 text-sm"><ShieldAlert size={16} /> {error}</div>}
        {resetMsg && <div className="bg-green-50 text-green-700 p-3 rounded-lg flex items-center gap-2 mb-4 text-sm"><CheckCircle2 size={16} /> {resetMsg}</div>}

        {!isForgot ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập (hoặc Email)</label><input type="text" value={loginInput} onChange={e=>setLoginInput(e.target.value)} className="w-full p-3 border rounded-lg outline-none" required placeholder="Ví dụ: nhanvien1" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full p-3 border rounded-lg outline-none" required /></div>
            <div className="flex justify-end"><button type="button" onClick={()=>setIsForgot(true)} className="text-sm text-blue-600 hover:underline">Quên mật khẩu?</button></div>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg">{loading ? 'Đang xử lý...' : 'Đăng nhập'}</button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <input type="email" value={loginInput} onChange={e=>setLoginInput(e.target.value)} className="w-full p-3 border rounded-lg outline-none" required placeholder="Nhập Email thật..." />
            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg">Gửi xác nhận</button>
            <div className="text-center mt-4"><button type="button" onClick={()=>setIsForgot(false)} className="text-sm text-gray-500 hover:underline">Quay lại</button></div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function EnhancedPOS() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({ role: null, name: '', perms: {} });
  const [activeTab, setActiveTab] = useState('pos');
  
  const [storeConfig, setStoreConfig] = useState({ name: 'SmartPOS Pro', address: '', phone: '', logo: '' });
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [imports, setImports] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  
  const storeId = 'main_store';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDoc = await getDoc(doc(db, 'users_db', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData({ role: data.role, name: data.name || data.username, perms: data.permissions || {} });
          setActiveTab(data.role === 'admin' ? 'dashboard' : 'pos');
        }
      } else { setUser(null); setUserData({ role: null, name: '', perms: {} }); }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubStore = onSnapshot(doc(db, 'stores', storeId), (docSnap) => {
      if (docSnap.exists()) setStoreConfig({ name: 'SmartPOS Pro', ...docSnap.data() });
    });

    const fetchCol = (colName, setter) => onSnapshot(collection(db, 'stores', storeId, colName), 
      (snap) => setter(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    const unsubProducts = fetchCol('products', setProducts);
    const unsubOrders = fetchCol('orders', setOrders);
    const unsubImports = fetchCol('imports', setImports);
    const unsubCustomers = fetchCol('customers', setCustomers);
    const unsubSuppliers = fetchCol('suppliers', setSuppliers);
    const unsubExpenses = fetchCol('expenses', setExpenses);

    return () => { unsubStore(); unsubProducts(); unsubOrders(); unsubImports(); unsubCustomers(); unsubSuppliers(); unsubExpenses(); };
  }, [user]);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  if (!user) return <LoginView onLoginSuccess={(u, r, n, p) => { setUser(u); setUserData({ role: r, name: n, perms: p }); setActiveTab(r === 'admin' ? 'dashboard' : 'pos'); }} />;

  const allTabs = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Báo cáo & Nhắc nợ', permId: 'tong_quan_xem' },
    { id: 'pos', icon: ShoppingCart, label: 'Bán hàng (POS)', permId: 'ALWAYS' },
    { id: 'imports', icon: ArrowDownToLine, label: 'Nhập hàng', permId: 'mua_nhap_hang' },
    { id: 'products', icon: Package, label: 'Kho hàng', permId: 'hh_danh_sach' },
    { id: 'customers', icon: Users, label: 'Khách hàng', permId: 'kh_danh_sach' },
    { id: 'suppliers', icon: Truck, label: 'Nhà cung cấp', permId: 'mua_ncc' },
    { id: 'expenses', icon: CreditCard, label: 'Chi phí', permId: 'quy_so_quy' },
    { id: 'settings', icon: Database, label: 'Cài đặt & Dữ liệu', permId: 'ADMIN_ONLY' },
    { id: 'staff', icon: UserCog, label: 'Quản trị Nhân viên', permId: 'ADMIN_ONLY' },
  ];

  const visibleTabs = allTabs.filter(t => {
    if (userData.role === 'admin') return true;
    if (t.permId === 'ADMIN_ONLY') return false;
    if (t.permId === 'ALWAYS') return true;
    return userData.perms[t.permId];
  });

  return (
    <>
      <style>{`@media print { body * { visibility: hidden; } .print-container, .print-container * { visibility: visible; } .print-container { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; } .no-print { display: none !important; } }`}</style>
      
      <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans text-sm md:text-base print:hidden">
        <aside className="w-full md:w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm z-10 shrink-0">
          <div className="p-5 border-b border-gray-100 flex items-center gap-3">
            {storeConfig.logo ? (
              <img src={storeConfig.logo} alt="Logo" className="w-10 h-10 object-contain rounded bg-white p-1 shadow-sm" />
            ) : (
              <div className="bg-blue-600 text-white p-2 rounded-lg"><ShoppingBag size={24} /></div>
            )}
            <div className="min-w-0"><h1 className="text-lg font-bold tracking-tight text-gray-800 truncate">{storeConfig.name || 'SmartPOS'}</h1></div>
          </div>
          
          <nav className="flex-1 p-3 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible scrollbar-hide">
            {visibleTabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={"flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap md:whitespace-normal " + (activeTab === tab.id ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-50 font-medium')}>
                <tab.icon size={20} className={activeTab === tab.id ? "text-blue-600" : "text-gray-400"} />{tab.label}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex flex-col min-w-0">
                <p className="text-sm font-bold text-gray-800 truncate">{userData.name}</p>
                <p className="text-xs text-gray-500 uppercase">{userData.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}</p>
              </div>
              <button onClick={() => signOut(auth)} className="text-gray-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-50"><LogOut size={18} /></button>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-hidden flex flex-col h-[calc(100vh-80px)] md:h-screen relative">
          {toast && <div className={"absolute top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 text-white " + (toast.type === 'success' ? 'bg-green-600' : 'bg-red-600')}>{toast.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}<span className="font-medium">{toast.msg}</span></div>}

          {activeTab === 'dashboard' && <DashboardView orders={orders} imports={imports} expenses={expenses} showToast={showToast} />}
          {activeTab === 'pos' && <POSView products={products} customers={customers} db={db} storeId={storeId} user={user} storeConfig={storeConfig} showToast={showToast} />}
          {activeTab === 'imports' && <ImportView products={products} suppliers={suppliers} db={db} storeId={storeId} user={user} showToast={showToast} />}
          {activeTab === 'products' && <InventoryView products={products} orders={orders} imports={imports} db={db} storeId={storeId} showToast={showToast} />}
          {activeTab === 'customers' && <ContactManager type="customers" data={customers} orders={orders} db={db} storeId={storeId} showToast={showToast} />}
          {activeTab === 'suppliers' && <ContactManager type="suppliers" data={suppliers} orders={imports} db={db} storeId={storeId} showToast={showToast} />}
          {activeTab === 'expenses' && <ExpenseView expenses={expenses} db={db} storeId={storeId} showToast={showToast} />}
          {activeTab === 'settings' && <SettingsView db={db} storeId={storeId} showToast={showToast} storeConfig={storeConfig} />}
          {activeTab === 'staff' && <StaffManagerView db={db} showToast={showToast} />}
        </main>
      </div>
    </>
  );
}

function DashboardView({ orders, imports, expenses, showToast }) {
  const currentDate = new Date();
  const [filterMonth, setFilterMonth] = useState((currentDate.getMonth() + 1).toString());
  const [filterYear, setFilterYear] = useState(currentDate.getFullYear().toString());
  const [chartViewMode, setChartViewMode] = useState('DAY'); // 'DAY', 'MONTH', 'YEAR'

  const stats = useMemo(() => {
    const fOrders = orders.filter(o => { const d = new Date(o.date); return (filterMonth === 'ALL' || (d.getMonth() + 1).toString() === filterMonth) && d.getFullYear().toString() === filterYear; });
    const fImports = imports.filter(i => { const d = new Date(i.date); return (filterMonth === 'ALL' || (d.getMonth() + 1).toString() === filterMonth) && d.getFullYear().toString() === filterYear; });
    const fExpenses = expenses.filter(e => { const d = new Date(e.date); return (filterMonth === 'ALL' || (d.getMonth() + 1).toString() === filterMonth) && d.getFullYear().toString() === filterYear; });
    
    const totalRev = fOrders.reduce((s, o) => s + o.total, 0);
    const totalCost = fOrders.reduce((s, o) => s + (o.totalCost || 0), 0);
    const totalExp = fExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const netProfit = totalRev - totalCost - totalExp;
    
    const overdueCust = orders.filter(o => o.status === 'DEBT').sort((a,b)=>new Date(b.date)-new Date(a.date));
    const overdueSupp = imports.filter(i => i.status === 'DEBT').sort((a,b)=>new Date(b.date)-new Date(a.date));

    // TOP PRODUCTS (Dựa trên fOrders - theo tháng/năm đã chọn)
    const productSales = {};
    fOrders.forEach(o => {
      (o.items || []).forEach(item => {
        if (!productSales[item.id]) productSales[item.id] = { name: item.name, qty: 0, revenue: 0 };
        productSales[item.id].qty += item.quantity;
        productSales[item.id].revenue += (item.quantity * item.price);
      });
    });
    const topProducts = Object.values(productSales).sort((a,b) => b.qty - a.qty).slice(0, 10); // Lấy top 10

    // SẢN PHẨM BÁN TRONG NGÀY HÔM NAY (Không phụ thuộc filter tháng/năm)
    const todayStr = currentDate.toDateString();
    const todayOrders = orders.filter(o => new Date(o.date).toDateString() === todayStr);
    const todaySales = {};
    todayOrders.forEach(o => {
      (o.items || []).forEach(item => {
        if (!todaySales[item.id]) todaySales[item.id] = { name: item.name, qty: 0, revenue: 0 };
        todaySales[item.id].qty += item.quantity;
        todaySales[item.id].revenue += (item.quantity * item.price);
      });
    });
    const todayProducts = Object.values(todaySales).sort((a,b) => b.qty - a.qty);

    return { totalRev, totalCost, totalExp, netProfit, overdueCust, overdueSupp, topProducts, todayProducts };
  }, [orders, imports, expenses, filterMonth, filterYear]);

  const chartData = useMemo(() => {
    let dataMap = {};
    
    if (chartViewMode === 'DAY') {
      // Group by day of the selected month/year
      orders.forEach(o => {
        const d = new Date(o.date);
        if (d.getFullYear().toString() === filterYear && (filterMonth === 'ALL' || (d.getMonth() + 1).toString() === filterMonth)) {
          const day = d.getDate();
          dataMap[day] = (dataMap[day] || 0) + o.total;
        }
      });
      const daysInMonth = new Date(Number(filterYear), filterMonth === 'ALL' ? currentDate.getMonth()+1 : Number(filterMonth), 0).getDate();
      let arr = [];
      for (let i = 1; i <= (filterMonth === 'ALL' ? 31 : daysInMonth); i++) {
        arr.push({ label: i.toString(), value: dataMap[i] || 0 });
      }
      return arr;
    } 
    else if (chartViewMode === 'MONTH') {
      // Group by month of selected year
      orders.forEach(o => {
        const d = new Date(o.date);
        if (d.getFullYear().toString() === filterYear) {
          const m = d.getMonth() + 1;
          dataMap[m] = (dataMap[m] || 0) + o.total;
        }
      });
      let arr = [];
      for (let i = 1; i <= 12; i++) {
        arr.push({ label: "T" + i, value: dataMap[i] || 0 });
      }
      return arr;
    } 
    else {
      // Group by year (last 5 years)
      orders.forEach(o => {
        const year = new Date(o.date).getFullYear();
        dataMap[year] = (dataMap[year] || 0) + o.total;
      });
      let arr = [];
      const currentY = currentDate.getFullYear();
      for (let i = currentY - 4; i <= currentY; i++) {
        arr.push({ label: i.toString(), value: dataMap[i] || 0 });
      }
      return arr;
    }
  }, [orders, chartViewMode, filterMonth, filterYear]);

  const maxChartValue = Math.max(...chartData.map(d => d.value), 1000); // Tránh chia cho 0
  const years = Array.from({length: 5}, (_, i) => currentDate.getFullYear() - i);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50/50">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Báo cáo Kinh doanh</h2>
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-200">
          <select value={filterMonth} onChange={e=>setFilterMonth(e.target.value)} className="bg-transparent font-medium outline-none"><option value="ALL">Cả năm</option>{Array.from({length: 12}, (_, i) => <option key={i+1} value={i+1}>Tháng {i+1}</option>)}</select>
          <div className="w-px h-5 bg-gray-300"></div>
          <select value={filterYear} onChange={e=>setFilterYear(e.target.value)} className="bg-transparent font-medium outline-none">{years.map(y => <option key={y} value={y}>Năm {y}</option>)}</select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<TrendingUp />} title="Tổng Doanh Thu" value={formatCurrency(stats.totalRev)} color="bg-blue-100 text-blue-600" />
        <StatCard icon={<Package />} title="Tổng Giá Vốn" value={formatCurrency(stats.totalCost)} color="bg-gray-200 text-gray-700" />
        <StatCard icon={<CreditCard />} title="Tổng Chi Phí" value={formatCurrency(stats.totalExp)} color="bg-orange-100 text-orange-600" />
        <StatCard icon={<DollarSign />} title="Lãi Ròng (Đã trừ chi phí)" value={formatCurrency(stats.netProfit)} color="bg-green-100 text-green-600" highlight={true} />
      </div>

      {/* TÍNH NĂNG BIỂU ĐỒ BÁN HÀNG */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-6">
        <div className="flex justify-between items-center border-b pb-4 mb-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2"><BarChart3 size={20} className="text-blue-600"/> Biểu đồ Doanh Thu</h3>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button onClick={()=>setChartViewMode('DAY')} className={"px-3 py-1 text-xs font-bold rounded " + (chartViewMode==='DAY'?'bg-white shadow text-blue-600':'text-gray-500 hover:bg-gray-200')}>Ngày</button>
            <button onClick={()=>setChartViewMode('MONTH')} className={"px-3 py-1 text-xs font-bold rounded " + (chartViewMode==='MONTH'?'bg-white shadow text-blue-600':'text-gray-500 hover:bg-gray-200')}>Tháng</button>
            <button onClick={()=>setChartViewMode('YEAR')} className={"px-3 py-1 text-xs font-bold rounded " + (chartViewMode==='YEAR'?'bg-white shadow text-blue-600':'text-gray-500 hover:bg-gray-200')}>Năm</button>
          </div>
        </div>
        <div className="h-48 flex items-end gap-1 sm:gap-2">
          {chartData.map((d, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
              {/* Tooltip khi hover */}
              <div className="absolute -top-8 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                {formatCurrency(d.value)}
              </div>
              {/* Cột biểu đồ */}
              <div className={"w-full rounded-t transition-all duration-500 " + (d.value > 0 ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-100")} style={{height: Math.max((d.value / maxChartValue) * 100, d.value>0?5:0) + "%"}}></div>
              <span className="text-[10px] text-gray-500 font-medium truncate w-full text-center">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SẢN PHẨM BÁN TRONG NGÀY & TOP BÁN CHẠY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b flex justify-between items-center font-bold text-gray-800">
            <div className="flex gap-2"><ShoppingCart size={20} className="text-green-600"/> Sản Phẩm Bán Hôm Nay</div>
            <span className="text-xs font-normal text-gray-500">{new Date().toLocaleDateString('vi-VN')}</span>
          </div>
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white sticky top-0 border-b shadow-sm"><tr><th className="p-3 text-gray-500">Tên Hàng Hóa</th><th className="p-3 text-center text-gray-500">SL</th><th className="p-3 text-right text-gray-500">Thành Tiền</th></tr></thead>
              <tbody>{stats.todayProducts.map((p, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium text-gray-800">{p.name}</td>
                  <td className="p-3 text-center font-bold text-green-600">+{p.qty}</td>
                  <td className="p-3 text-right font-medium text-gray-700">{formatCurrency(p.revenue)}</td>
                </tr>
              ))}
              {stats.todayProducts.length === 0 && <tr><td colSpan="3" className="p-6 text-center text-gray-400">Chưa có giao dịch bán hàng nào trong hôm nay</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b flex justify-between items-center font-bold text-gray-800">
            <div className="flex gap-2"><TrendingUp size={20} className="text-purple-600"/> Top 10 Bán Chạy Nhất</div>
            <span className="text-xs font-normal text-gray-500">Theo kỳ đã chọn</span>
          </div>
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white sticky top-0 border-b shadow-sm"><tr><th className="p-3 text-gray-500">Tên Hàng Hóa</th><th className="p-3 text-center text-gray-500">Đã bán</th><th className="p-3 text-right text-gray-500">Doanh thu</th></tr></thead>
              <tbody>{stats.topProducts.map((p, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium text-gray-800">
                    <span className={"inline-block w-5 h-5 text-center rounded text-xs font-bold text-white mr-2 " + (idx===0?'bg-yellow-500':idx===1?'bg-gray-400':idx===2?'bg-amber-600':'bg-gray-200 text-gray-600')}>{idx+1}</span>
                    {p.name}
                  </td>
                  <td className="p-3 text-center font-bold text-purple-600">{p.qty}</td>
                  <td className="p-3