import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, ShoppingCart, Package, Users, Truck, Plus, 
  Edit, Trash2, Check, X, Image as ImageIcon, ShoppingBag, 
  TrendingUp, AlertCircle, ArrowDownToLine, Phone, 
  DollarSign, CheckCircle2, Printer, FileText, CreditCard,
  Lock, LogOut, ShieldAlert, User as UserIcon, Database,
  UserCog, KeyRound, MonitorSmartphone, Mail, Download, Upload, ArrowUpDown, Search, Eye, Bell, Award, BarChart3, Receipt, ChevronDown, ChevronUp
} from 'lucide-react';

import { initializeApp, getApp } from 'firebase/app';
import { 
  getAuth, signInWithEmailAndPassword, signOut, 
  onAuthStateChanged, sendPasswordResetEmail, createUserWithEmailAndPassword, updatePassword 
} from 'firebase/auth';
import { 
  getFirestore, doc, setDoc, getDoc, getDocs, addDoc, updateDoc, 
  deleteDoc, onSnapshot, collection, writeBatch, query, orderBy, where 
} from 'firebase/firestore';

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
  { module: 'Quản lý Bán hàng', perms: [{ id: 'ban_hang', label: 'Quản lý bán hàng & Hóa đơn' }] },
  { module: 'Hàng hóa', perms: [{ id: 'hh_danh_sach', label: 'Danh sách hàng hóa' }, { id: 'hh_gia', label: 'Thiết lập giá' }] },
  { module: 'Mua hàng', perms: [{ id: 'mua_ncc', label: 'Danh sách nhà cung cấp' }, { id: 'mua_nhap_hang', label: 'Nhập hàng' }] },
  { module: 'Khách hàng', perms: [{ id: 'kh_danh_sach', label: 'Danh sách khách hàng' }] },
  { module: 'Sổ quỹ', perms: [{ id: 'quy_so_quy', label: 'Sổ quỹ / Chi phí' }] }
];

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
};

const formatDate = (iso) => {
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso));
};

const getDaysDifference = (isoDate) => {
  return Math.floor(Math.abs(new Date() - new Date(isoDate)) / (1000 * 60 * 60 * 24));
};

const getDeviceInfo = () => {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "Android";
  if (/iPad|iPhone|iPod/.test(ua)) return "iOS";
  return "Máy tính";
};

const Modal = ({ isOpen, onClose, title, children, maxWidth = "max-w-md", hideHeaderInPrint = false }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm modal-overlay">
      <div className={`bg-white rounded-xl shadow-2xl w-full ${maxWidth} overflow-hidden flex flex-col max-h-[90vh] modal-content`}>
        {!hideHeaderInPrint && (
          <div className="flex justify-between items-center p-4 border-b shrink-0 no-print">
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 no-print"><X size={20} /></button>
          </div>
        )}
        <div className="p-4 overflow-y-auto">{children}</div>
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
  
  const [storeName, setStoreName] = useState('QUẢN LÝ BÁN HÀNG');
  const [storeLogo, setStoreLogo] = useState('');

  useEffect(() => {
    const fetchStoreInfo = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'stores', 'main_store'));
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.name) setStoreName(data.name);
          if (data.logo) setStoreLogo(data.logo);
        }
      } catch (err) {}
    };
    fetchStoreInfo();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      let loginEmail = loginInput.trim();
      if (!loginEmail.includes('@')) {
        const q = query(collection(db, 'users_db'), where('username', '==', loginEmail));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) { loginEmail = querySnapshot.docs[0].data().email; } 
        else { throw new Error("Không tìm thấy Tên đăng nhập này!"); }
      }
      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, password);
      const user = userCredential.user;
      let ip = "Không xác định";
      try { const res = await fetch('https://api.ipify.org?format=json'); const data = await res.json(); ip = data.ip; } catch (err) {}
      const userDocRef = doc(db, 'users_db', user.uid);
      const userDoc = await getDoc(userDocRef);
      let role = 'admin', name = loginInput, perms = {};
      if (userDoc.exists()) { role = userDoc.data().role; name = userDoc.data().name; perms = userDoc.data().permissions || {}; } 
      else { await setDoc(userDocRef, { username: 'admin', email: loginEmail, role: 'admin', name: 'Admin', createdAt: new Date().toISOString() }); }
      await addDoc(collection(db, 'login_logs'), { uid: user.uid, username: userDoc.exists() ? userDoc.data().username : 'admin', name: name, role: role, loginTime: new Date().toISOString(), ip: ip, device: getDeviceInfo() });
      onLoginSuccess(user, role, name, perms);
    } catch (err) {
      if (err.message === "Không tìm thấy Tên đăng nhập này!") setError(err.message);
      else setError("Tài khoản hoặc mật khẩu không đúng!");
    } finally { setLoading(false); }
  };

  const handleReset = async (e) => {
    e.preventDefault(); setError(''); setResetMsg(''); setLoading(true);
    try { await sendPasswordResetEmail(auth, loginInput); setResetMsg("Link khôi phục đã gửi vào Email!"); } 
    catch (err) { setError("Vui lòng nhập Email thật đã đăng ký để khôi phục."); } 
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg">
        <div className="text-center mb-8">
          {storeLogo ? (
            <img src={storeLogo} alt="Logo Cửa Hàng" className="h-24 w-24 mx-auto mb-4 object-cover rounded-full shadow-sm border border-gray-100" />
          ) : (
            <img src="/784.jpg" alt="Logo Mặc Định" className="h-24 w-24 mx-auto mb-4 object-cover rounded-full shadow-sm" onError={(e) => e.target.style.display = 'none'} />
          )}
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 uppercase">{storeName}</h1>
          <p className="text-gray-500 text-sm mt-2">{isForgot ? 'Khôi phục mật khẩu' : 'Đăng nhập hệ thống'}</p>
        </div>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 mb-4 text-sm"><ShieldAlert size={16} /> {error}</div>}
        {resetMsg && <div className="bg-green-50 text-green-700 p-3 rounded-lg flex items-center gap-2 mb-4 text-sm"><CheckCircle2 size={16} /> {resetMsg}</div>}
        {!isForgot ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập (hoặc Email)</label><input type="text" value={loginInput} onChange={(e) => setLoginInput(e.target.value)} className="w-full p-3 border rounded-lg outline-none" required placeholder="Ví dụ: nhanvien1" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 border rounded-lg outline-none" required /></div>
            <div className="flex justify-end"><button type="button" onClick={() => setIsForgot(true)} className="text-sm text-blue-600 hover:underline">Quên mật khẩu?</button></div>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg">{loading ? 'Đang xử lý...' : 'Đăng nhập'}</button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <input type="email" value={loginInput} onChange={(e) => setLoginInput(e.target.value)} className="w-full p-3 border rounded-lg outline-none" required placeholder="Nhập Email thật..." />
            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg">Gửi xác nhận</button>
            <div className="text-center mt-4"><button type="button" onClick={() => setIsForgot(false)} className="text-sm text-gray-500 hover:underline">Quay lại</button></div>
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
  const [storeConfig, setStoreConfig] = useState({ name: 'SmartPOS Pro', address: '', phone: '', logo: '', printDefaultSize: 'a4', printFooterText: 'Cảm ơn quý khách và hẹn gặp lại!' });
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
      } else { 
        setUser(null); 
        setUserData({ role: null, name: '', perms: {} }); 
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubStore = onSnapshot(doc(db, 'stores', storeId), (docSnap) => { if (docSnap.exists()) setStoreConfig({ name: 'SmartPOS Pro', printDefaultSize: 'a4', printFooterText: 'Cảm ơn quý khách và hẹn gặp lại!', ...docSnap.data() }); });
    const fetchCol = (colName, setter) => onSnapshot(collection(db, 'stores', storeId, colName), (snap) => setter(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
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
    { id: 'sales_history', icon: Receipt, label: 'Quản lý Bán Hàng', permId: 'ban_hang' },
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

  // GIẢI PHÁP IN ẤN MẠNH NHẤT - ẨN MỌI THỨ NGOẠI TRỪ CONTAINER IN
  const printStyle = `
    @media print {
      html, body, #root, main, .min-h-screen {
        height: auto !important;
        min-height: auto !important;
        overflow: visible !important;
        position: static !important;
        background: white !important;
      }
      body * { visibility: hidden !important; }
      .print-container, .print-container * { visibility: visible !important; }
      .print-container {
        position: absolute !important; 
        left: 0 !important; 
        top: 0 !important;
        width: 100% !important; 
        margin: 0 !important; 
        padding: 0 !important;
      }
      .modal-overlay, .modal-content {
        position: static !important; background: transparent !important;
        box-shadow: none !important; border: none !important; overflow: visible !important;
      }
      .no-print { display: none !important; }
      @page { margin: 5mm; }
    }
  `;

  return (
    <>
      <style>{printStyle}</style>
      <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans text-sm md:text-base">
        <aside className="w-full md:w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm z-10 shrink-0 no-print">
          <div className="p-5 border-b border-gray-100 flex items-center gap-3">
            {storeConfig.logo ? <img src={storeConfig.logo} alt="Logo" className="w-10 h-10 object-contain rounded bg-white p-1 shadow-sm" /> : <div className="bg-blue-600 text-white p-2 rounded-lg"><ShoppingBag size={24} /></div>}
            <div className="min-w-0"><h1 className="text-lg font-bold tracking-tight text-gray-800 truncate uppercase">{storeConfig.name || 'SmartPOS'}</h1></div>
          </div>
          <nav className="flex-1 p-3 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible scrollbar-hide">
            {visibleTabs.map(tab => {
              const activeClass = activeTab === tab.id ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-50 font-medium';
              const iconClass = activeTab === tab.id ? "text-blue-600" : "text-gray-400";
              return <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={"flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap md:whitespace-normal " + activeClass}><tab.icon size={20} className={iconClass} />{tab.label}</button>;
            })}
          </nav>
          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex flex-col min-w-0"><p className="text-sm font-bold text-gray-800 truncate">{userData.name}</p><p className="text-xs text-gray-500 uppercase">{userData.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}</p></div>
              <button onClick={() => signOut(auth)} className="text-gray-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-50"><LogOut size={18} /></button>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-hidden flex flex-col h-[calc(100vh-80px)] md:h-screen relative">
          {toast && <div className={"absolute top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 text-white no-print " + (toast.type === 'success' ? 'bg-green-600' : 'bg-red-600')}>{toast.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}<span className="font-medium">{toast.msg}</span></div>}
          
          {activeTab === 'dashboard' && <DashboardView orders={orders} imports={imports} expenses={expenses} customers={customers} suppliers={suppliers} showToast={showToast} />}
          {activeTab === 'pos' && <POSView products={products} customers={customers} db={db} storeId={storeId} user={user} storeConfig={storeConfig} showToast={showToast} />}
          {activeTab === 'sales_history' && <SalesHistoryView orders={orders} products={products} storeConfig={storeConfig} db={db} storeId={storeId} showToast={showToast} />}
          {activeTab === 'imports' && <ImportView products={products} suppliers={suppliers} db={db} storeId={storeId} user={user} showToast={showToast} />}
          {activeTab === 'products' && <InventoryView products={products} orders={orders} imports={imports} db={db} storeId={storeId} showToast={showToast} />}
          {activeTab === 'customers' && <ContactManager type="customers" data={customers} orders={orders} db={db} storeId={storeId} showToast={showToast} />}
          {activeTab === 'suppliers' && <ContactManager type="suppliers" data={suppliers} orders={imports} db={db} storeId={storeId} showToast={showToast} />}
          {activeTab === 'expenses' && <ExpenseView expenses={expenses} db={db} storeId={storeId} showToast={showToast} />}
          {activeTab === 'settings' && <SettingsView db={db} storeId={storeId} showToast={showToast} storeConfig={storeConfig} user={user} auth={auth} />}
          {activeTab === 'staff' && <StaffManagerView db={db} showToast={showToast} />}
        </main>
      </div>
    </>
  );
}

function DashboardView({ orders, imports, expenses, customers, suppliers, showToast }) {
  const currentDate = new Date();
  const [filterMonth, setFilterMonth] = useState((currentDate.getMonth() + 1).toString());
  const [filterYear, setFilterYear] = useState(currentDate.getFullYear().toString());

  const [custSortOrder, setCustSortOrder] = useState('desc');
  const [suppSortOrder, setSuppSortOrder] = useState('desc');
  
  const [showAllCust, setShowAllCust] = useState(false);
  const [showAllSupp, setShowAllSupp] = useState(false);

  const stats = useMemo(() => {
    const fOrders = orders.filter(o => { const d = new Date(o.date); return (filterMonth === 'ALL' || (d.getMonth() + 1).toString() === filterMonth) && d.getFullYear().toString() === filterYear; });
    const fImports = imports.filter(i => { const d = new Date(i.date); return (filterMonth === 'ALL' || (d.getMonth() + 1).toString() === filterMonth) && d.getFullYear().toString() === filterYear; });
    const fExpenses = expenses.filter(e => { const d = new Date(e.date); return (filterMonth === 'ALL' || (d.getMonth() + 1).toString() === filterMonth) && d.getFullYear().toString() === filterYear; });
    
    const totalRev = fOrders.reduce((s, o) => s + o.total, 0);
    const totalCost = fOrders.reduce((s, o) => s + (o.totalCost || 0), 0);
    const totalExp = fExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const netProfit = totalRev - totalCost - totalExp;
    
    const filteredCustDebt = (customers || []).filter(c => {
      if (!c.createdAt) return filterMonth === 'ALL';
      const d = new Date(c.createdAt);
      return (filterMonth === 'ALL' || (d.getMonth() + 1).toString() === filterMonth) && d.getFullYear().toString() === filterYear;
    }).sort((a, b) => {
      const timeA = new Date(a.createdAt || 0);
      const timeB = new Date(b.createdAt || 0);
      if (custSortOrder === 'desc') {
        return timeA - timeB; 
      } else {
        return timeB - timeA;
      }
    });

    const filteredSuppDebt = (suppliers || []).filter(s => {
      if (!s.createdAt) return filterMonth === 'ALL';
      const d = new Date(s.createdAt);
      return (filterMonth === 'ALL' || (d.getMonth() + 1).toString() === filterMonth) && d.getFullYear().toString() === filterYear;
    }).sort((a, b) => {
      const timeA = new Date(a.createdAt || 0);
      const timeB = new Date(b.createdAt || 0);
      if (suppSortOrder === 'desc') {
        return timeA - timeB;
      } else {
        return timeB - timeA;
      }
    });

    const overdueCust = orders.filter(o => o.status === 'DEBT').sort((a,b) => new Date(b.date) - new Date(a.date));
    const overdueSupp = imports.filter(i => i.status === 'DEBT').sort((a,b) => new Date(b.date) - new Date(a.date));
    const overdueCust1Week = overdueCust.filter(o => getDaysDifference(o.date) >= 7);

    let chartData = {};
    if (filterMonth !== 'ALL') {
      fOrders.forEach(o => {
        const d = new Date(o.date);
        const dayKey = d.getDate() + '/' + (d.getMonth() + 1);
        chartData[dayKey] = (chartData[dayKey] || 0) + o.total;
      });
    } else {
      const monthNames = ['Th 1', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7', 'Th 8', 'Th 9', 'Th 10', 'Th 11', 'Th 12'];
      monthNames.forEach((m) => { chartData[m] = 0; });
      fOrders.forEach(o => {
        const d = new Date(o.date);
        const mKey = monthNames[d.getMonth()];
        chartData[mKey] = (chartData[mKey] || 0) + o.total;
      });
    }

    let productSalesMap = {};
    fOrders.forEach(o => {
      (o.items || []).forEach(it => {
        const qty = Number(it.quantity || it.qty || 1);
        const rev = qty * (Number(it.price) || 0);
        if (!productSalesMap[it.name]) {
          productSalesMap[it.name] = { name: it.name, totalQty: 0, totalRev: 0 };
        }
        productSalesMap[it.name].totalQty += qty;
        productSalesMap[it.name].totalRev += rev;
      });
    });
    const topProducts = Object.values(productSalesMap).sort((a, b) => b.totalQty - a.totalQty).slice(0, 5);

    return { totalRev, totalCost, totalExp, netProfit, overdueCust, overdueSupp, overdueCust1Week, chartData, topProducts, filteredCustDebt, filteredSuppDebt };
  }, [orders, imports, expenses, customers, suppliers, filterMonth, filterYear, custSortOrder, suppSortOrder]);

  const years = Array.from({length: 5}, (_, i) => currentDate.getFullYear() - i);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50/50 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Báo cáo Kinh doanh & Biểu đồ Nhắc nợ</h2>
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-200">
          <select value={filterMonth} onChange={e=>setFilterMonth(e.target.value)} className="bg-transparent font-medium outline-none">
            <option value="ALL">Cả năm</option>{Array.from({length: 12}, (_, i) => (<option key={i+1} value={i+1}>Tháng {i+1}</option>))}
          </select>
          <div className="w-px h-5 bg-gray-300"></div>
          <select value={filterYear} onChange={e=>setFilterYear(e.target.value)} className="bg-transparent font-medium outline-none">
            {years.map(y => (<option key={y} value={y}>Năm {y}</option>))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-800 flex items-center gap-2 text-blue-600">
              <Users size={18}/> Nhắc nợ Khách hàng ({filterMonth === 'ALL' ? `Năm ${filterYear}` : `Tháng ${filterMonth}/${filterYear}`})
            </h3>
            <button 
              onClick={() => setCustSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')} 
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition"
            >
              <ArrowUpDown size={12}/> {custSortOrder === 'desc' ? 'Lâu nhất trước' : 'Gần nhất trước'}
            </button>
          </div>
          <div className="overflow-y-auto border rounded-xl flex-1 max-h-72">
            <table className="w-full text-left text-xs">
              <thead className="bg-blue-50 sticky top-0 border-b">
                <tr><th className="p-2.5">Khách hàng</th><th className="p-2.5">Thời gian chưa trả</th><th className="p-2.5 text-right">Tổng Nợ</th></tr>
              </thead>
              <tbody>
                {(showAllCust ? stats.filteredCustDebt : stats.filteredCustDebt.slice(0, 10)).map(c => {
                  const daysAgo = c.createdAt ? getDaysDifference(c.createdAt) : 0;
                  return (
                    <tr key={c.id} className="border-b hover:bg-gray-50">
                      <td className="p-2.5 font-bold text-gray-800">{c.name}<p className="text-[10px] text-gray-400 font-normal">{c.phone || 'Không có SĐT'}</p></td>
                      <td className="p-2.5 font-semibold text-orange-600">{daysAgo} ngày trước</td>
                      <td className="p-2.5 text-right font-bold text-red-600">{formatCurrency(c.totalDebt)}</td>
                    </tr>
                  );
                })}
                {stats.filteredCustDebt.length === 0 && (
                  <tr><td colSpan="3" className="p-4 text-center text-gray-400">Không có khách hàng nợ trong kỳ này</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {stats.filteredCustDebt.length > 10 && (
            <button 
              onClick={() => setShowAllCust(!showAllCust)} 
              className="mt-3 text-xs text-blue-600 font-bold hover:underline flex items-center justify-center gap-1 py-1"
            >
              {showAllCust ? <><ChevronUp size={14}/> Thu gọn</> : <><ChevronDown size={14}/> Xem thêm ({stats.filteredCustDebt.length - 10} khách hàng khác)</>}
            </button>
          )}
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-800 flex items-center gap-2 text-orange-600">
              <Truck size={18}/> Nhắc nợ Nhà cung cấp ({filterMonth === 'ALL' ? `Năm ${filterYear}` : `Tháng ${filterMonth}/${filterYear}`})
            </h3>
            <button 
              onClick={() => setSuppSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')} 
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition"
            >
              <ArrowUpDown size={12}/> {suppSortOrder === 'desc' ? 'Lâu nhất trước' : 'Gần nhất trước'}
            </button>
          </div>
          <div className="overflow-y-auto border rounded-xl flex-1 max-h-72">
            <table className="w-full text-left text-xs">
              <thead className="bg-orange-50 sticky top-0 border-b">
                <tr><th className="p-2.5">Nhà cung cấp</th><th className="p-2.5">Thời gian chưa trả</th><th className="p-2.5 text-right">Cần trả</th></tr>
              </thead>
              <tbody>
                {(showAllSupp ? stats.filteredSuppDebt : stats.filteredSuppDebt.slice(0, 10)).map(s => {
                  const daysAgo = s.createdAt ? getDaysDifference(s.createdAt) : 0;
                  return (
                    <tr key={s.id} className="border-b hover:bg-gray-50">
                      <td className="p-2.5 font-bold text-gray-800">{s.name}<p className="text-[10px] text-gray-400 font-normal">{s.phone || 'Không có SĐT'}</p></td>
                      <td className="p-2.5 font-semibold text-orange-600">{daysAgo} ngày trước</td>
                      <td className="p-2.5 text-right font-bold text-orange-600">{formatCurrency(s.totalDebt)}</td>
                    </tr>
                  );
                })}
                {stats.filteredSuppDebt.length === 0 && (
                  <tr><td colSpan="3" className="p-4 text-center text-gray-400">Không có nhà cung cấp nợ trong kỳ này</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {stats.filteredSuppDebt.length > 10 && (
            <button 
              onClick={() => setShowAllSupp(!showAllSupp)} 
              className="mt-3 text-xs text-orange-600 font-bold hover:underline flex items-center justify-center gap-1 py-1"
            >
              {showAllSupp ? <><ChevronUp size={14}/> Thu gọn</> : <><ChevronDown size={14}/> Xem thêm ({stats.filteredSuppDebt.length - 10} nhà cung cấp khác)</>}
            </button>
          )}
        </div>
      </div>

      {stats.overdueCust1Week.length > 0 && (
        <div className="bg-red-50 border-2 border-red-500 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 bg-red-600 flex justify-between items-center text-white">
            <h3 className="font-bold flex items-center gap-2 text-lg"><Bell size={24}/> CẢNH BÁO: KHÁCH HÀNG NỢ QUÁ HẠN 1 TUẦN ({stats.overdueCust1Week.length})</h3>
          </div>
          <div className="max-h-60 overflow-y-auto">
            <table className="w-full text-left text-sm bg-white">
              <thead className="bg-red-50 sticky top-0 border-b border-red-200">
                <tr><th className="p-3 text-red-800">Khách hàng</th><th className="p-3 text-red-800">Ngày mua</th><th className="p-3 text-red-800">Số ngày nợ</th><th className="p-3 text-red-800">Số tiền</th></tr>
              </thead>
              <tbody>
                {stats.overdueCust1Week.map(o => (
                  <tr key={o.id} className="border-b hover:bg-red-50/50">
                    <td className="p-3 font-bold text-gray-800">{o.customerName}</td>
                    <td className="p-3 text-gray-600">{formatDate(o.date)}</td>
                    <td className="p-3 font-bold text-red-600">{getDaysDifference(o.date)} ngày</td>
                    <td className="p-3 font-bold text-red-600 text-lg">{formatCurrency(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<TrendingUp />} title={"Doanh Thu (T" + (filterMonth==='ALL'?'ổng':filterMonth) + ")"} value={formatCurrency(stats.totalRev)} color="bg-blue-100 text-blue-600" />
        <StatCard icon={<Package />} title="Tổng Giá Vốn" value={formatCurrency(stats.totalCost)} color="bg-gray-200 text-gray-700" />
        <StatCard icon={<CreditCard />} title="Tổng Chi Phí" value={formatCurrency(stats.totalExp)} color="bg-orange-100 text-orange-600" />
        <StatCard icon={<DollarSign />} title="Lãi Ròng (Đã trừ phí)" value={formatCurrency(stats.netProfit)} color="bg-green-100 text-green-600" highlight={true} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 lg:col-span-2 flex flex-col">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><BarChart3 size={20} className="text-blue-600"/> Biểu đồ doanh thu {filterMonth === 'ALL' ? 'theo các tháng trong năm' : 'theo các ngày trong tháng'}</h3>
          <div className="flex-1 min-h-[220px] flex items-end gap-1 overflow-x-auto pt-6 pb-2 px-2 border-b border-gray-100">
            {Object.keys(stats.chartData).length === 0 ? (
              <div className="w-full text-center text-gray-400 py-16">Chưa có dữ liệu bán hàng trong khoảng thời gian này</div>
            ) : (
              (() => {
                const values = Object.values(stats.chartData);
                const maxVal = Math.max(...values, 1000);
                return Object.entries(stats.chartData).map(([label, val], idx) => {
                  const heightPercent = Math.max((val / maxVal) * 100, 4);
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 min-w-[32px] group relative">
                      <div className="absolute -top-8 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap shadow-md z-10">
                        {label}: {formatCurrency(val)}
                      </div>
                      <div className="w-full bg-blue-500 rounded-t-lg transition-all duration-500 hover:bg-blue-600" style={{ height: heightPercent + '%' }}></div>
                      <span className="text-[10px] text-gray-500 truncate w-full text-center">{label}</span>
                    </div>
                  );
                });
              })()
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Award size={20} className="text-amber-500"/> Hàng bán chạy nhất trong kỳ</h3>
          <div className="flex-1 overflow-y-auto space-y-3">
            {stats.topProducts.map((p, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className={"w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs " + (idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-gray-200 text-gray-700' : 'bg-orange-100 text-orange-700')}>{idx + 1}</div>
                  <div><p className="font-bold text-gray-800 text-sm">{p.name}</p><p className="text-xs text-gray-500">Đã bán: <strong className="text-blue-600">{p.totalQty}</strong> sản phẩm</p></div>
                </div>
                <span className="font-bold text-sm text-green-700">{formatCurrency(p.totalRev)}</span>
              </div>
            ))}
            {stats.topProducts.length === 0 && (<div className="text-center text-gray-400 py-12">Chưa có sản phẩm nào được bán</div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

function SalesHistoryView({ orders, products, storeConfig, db, storeId, showToast }) {
  const currentDate = new Date();
  const [filterType, setFilterType] = useState('day'); 
  const [selectedDate, setSelectedDate] = useState(currentDate.toISOString().split('T')[0]);
  const [filterMonth, setFilterMonth] = useState((currentDate.getMonth() + 1).toString());
  const [filterYear, setFilterYear] = useState(currentDate.getFullYear().toString());
  const [searchTerm, setSearchTerm] = useState('');
  
  const [editingOrder, setEditingOrder] = useState(null);
  const [viewingOrderPrint, setViewingOrderPrint] = useState(null);
  const [printType, setPrintType] = useState(storeConfig?.printDefaultSize || 'a4');
  const [printOptions, setPrintOptions] = useState({ showLogo: true, showNote: true, showWarranty: true });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setViewingOrderPrint(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredOrders = useMemo(() => {
    return (orders || []).filter(o => {
      const d = new Date(o.date);
      let matchTime = true;
      if (filterType === 'day') {
        const orderDateStr = d.toISOString().split('T')[0];
        matchTime = orderDateStr === selectedDate;
      } else if (filterType === 'month') {
        matchTime = (d.getMonth() + 1).toString() === filterMonth && d.getFullYear().toString() === filterYear;
      } else if (filterType === 'year') {
        matchTime = d.getFullYear().toString() === filterYear;
      }

      const matchSearch = (o.customerName && o.customerName.toLowerCase().includes(searchTerm.toLowerCase())) || 
                          (o.id && o.id.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchTime && matchSearch;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [orders, filterType, selectedDate, filterMonth, filterYear, searchTerm]);

  const summaryStats = useMemo(() => {
    let totalRevenue = 0;
    let totalCost = 0;
    filteredOrders.forEach(o => {
      totalRevenue += (Number(o.total) || 0);
      totalCost += (Number(o.totalCost) || 0);
    });
    return {
      count: filteredOrders.length,
      revenue: totalRevenue,
      cost: totalCost,
      profit: totalRevenue - totalCost
    };
  }, [filteredOrders]);

  const handleDeleteOrder = async (order) => {
    if (window.confirm("CẢNH BÁO: Xóa hóa đơn này sẽ hoàn lại tồn kho cho sản phẩm. Bạn có chắc chắn muốn xóa?")) {
      try {
        let batch = writeBatch(db);
        for (let item of (order.items || [])) {
          const matchedProd = products.find(p => p.id === item.id);
          if (matchedProd) {
            batch.update(doc(db, 'stores', storeId, 'products', matchedProd.id), {
              stock: Number(matchedProd.stock || 0) + Number(item.quantity || 1)
            });
          }
        }
        batch.delete(doc(db, 'stores', storeId, 'orders', order.id));
        await batch.commit();
        showToast("Đã xóa hóa đơn và hoàn kho thành công!");
      } catch (err) {
        showToast("Lỗi khi xóa hóa đơn", "error");
      }
    }
  };

  const handleSaveEditOrder = async (e) => {
    e.preventDefault();
    try {
      const newTotal = editingOrder.items.reduce((sum, it) => sum + (Number(it.price || 0) * Number(it.quantity || 1)), 0);
      
      await updateDoc(doc(db, 'stores', storeId, 'orders', editingOrder.id), {
        customerName: editingOrder.customerName,
        note: editingOrder.note,
        status: editingOrder.status,
        items: editingOrder.items,
        total: newTotal
      });
      setEditingOrder(null);
      showToast("Cập nhật hóa đơn thành công!");
    } catch (err) {
      showToast("Lỗi cập nhật hóa đơn", "error");
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 bg-gray-50 overflow-hidden h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3 no-print">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Receipt className="text-blue-600"/> Quản lý Bán Hàng</h2>
          <p className="text-xs text-gray-500 mt-0.5">Theo dõi chi tiết giá nhập, giá bán, tiền lãi, bảo hành, ghi chú và in ấn chuẩn KiotViet</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search size={16} className="absolute left-3 top-3 text-gray-400"/>
          <input placeholder="Tìm mã HĐ hoặc tên khách..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-2 border rounded-lg bg-white outline-none text-sm"/>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border shadow-sm mb-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 no-print">
        <div className="flex flex-wrap items-center gap-2 bg-gray-100 p-1 rounded-xl">
          <button onClick={() => setFilterType('day')} className={"px-3 py-1.5 rounded-lg text-xs font-bold transition " + (filterType==='day'?'bg-blue-600 text-white shadow':'text-gray-600 hover:bg-white')}>Theo Ngày</button>
          <button onClick={() => setFilterType('month')} className={"px-3 py-1.5 rounded-lg text-xs font-bold transition " + (filterType==='month'?'bg-blue-600 text-white shadow':'text-gray-600 hover:bg-white')}>Theo Tháng</button>
          <button onClick={() => setFilterType('year')} className={"px-3 py-1.5 rounded-lg text-xs font-bold transition " + (filterType==='year'?'bg-blue-600 text-white shadow':'text-gray-600 hover:bg-white')}>Theo Năm</button>
          <button onClick={() => setFilterType('all')} className={"px-3 py-1.5 rounded-lg text-xs font-bold transition " + (filterType==='all'?'bg-blue-600 text-white shadow':'text-gray-600 hover:bg-white')}>Tất cả</button>
        </div>

        <div className="flex items-center gap-2">
          {filterType === 'day' && (
            <input type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)} className="p-2 border rounded-lg text-sm bg-white font-medium outline-none"/>
          )}
          {filterType === 'month' && (
            <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border">
              <select value={filterMonth} onChange={e=>setFilterMonth(e.target.value)} className="bg-transparent text-sm font-medium outline-none">
                {Array.from({length: 12}, (_, i) => <option key={i+1} value={i+1}>Tháng {i+1}</option>)}
              </select>
              <span className="text-gray-400">/</span>
              <select value={filterYear} onChange={e=>setFilterYear(e.target.value)} className="bg-transparent text-sm font-medium outline-none">
                {Array.from({length: 5}, (_, i) => currentDate.getFullYear() - i).map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          )}
          {filterType === 'year' && (
            <select value={filterYear} onChange={e=>setFilterYear(e.target.value)} className="p-2 border rounded-lg text-sm bg-white font-medium outline-none">
              {Array.from({length: 5}, (_, i) => currentDate.getFullYear() - i).map(y => <option key={y} value={y}>Năm {y}</option>)}
            </select>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 w-full lg:w-auto">
          <div className="bg-blue-50 px-3 py-2 rounded-xl border border-blue-100 text-center"><p className="text-[10px] text-blue-600 font-bold uppercase">Tổng Hóa Đơn</p><p className="text-sm font-bold text-blue-800">{summaryStats.count}</p></div>
          <div className="bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 text-center"><p className="text-[10px] text-gray-500 font-bold uppercase">Doanh Thu</p><p className="text-sm font-bold text-gray-800">{formatCurrency(summaryStats.revenue)}</p></div>
          <div className="bg-green-50 px-3 py-2 rounded-xl border border-green-100 text-center"><p className="text-[10px] text-green-600 font-bold uppercase">Tiền Lãi</p><p className="text-sm font-bold text-green-700">{formatCurrency(summaryStats.profit)}</p></div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl border shadow-sm overflow-auto no-print">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 sticky top-0 border-b">
            <tr>
              <th className="p-3">Mã HĐ / Thời gian</th>
              <th className="p-3">Khách hàng</th>
              <th className="p-3">Chi tiết hàng bán & Bảo hành / Ghi chú</th>
              <th className="p-3">Tổng Tiền</th>
              <th className="p-3">Tiền Lãi</th>
              <th className="p-3">Trạng thái</th>
              <th className="p-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(o => {
              let orderTotalCost = o.totalCost || 0;
              if (!orderTotalCost && o.items) {
                orderTotalCost = o.items.reduce((sum, it) => sum + (Number(it.cost || 0) * Number(it.quantity || 1)), 0);
              }
              const orderProfit = (Number(o.total) || 0) - orderTotalCost;
              const statusClass = o.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700';

              return (
                <tr key={o.id} className="border-b hover:bg-blue-50/30">
                  <td className="p-3">
                    <p className="font-bold text-blue-600">#{o.id.slice(0,6).toUpperCase()}</p>
                    <p className="text-xs text-gray-400">{formatDate(o.date)}</p>
                  </td>
                  <td className="p-3 font-medium text-gray-800">{o.customerName || 'Khách lẻ'}</td>
                  <td className="p-3">
                    <div className="space-y-1">
                      {o.items?.map((it, idx) => {
                        const itemQty = Number(it.quantity || 1);
                        const itemPrice = Number(it.price || 0);
                        return (
                          <div key={idx} className="text-xs bg-gray-50 p-2 rounded border border-gray-100 flex flex-col gap-0.5">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-gray-700">{it.name} (x{itemQty})</span>
                              <span className="text-blue-600 font-mono font-bold">{formatCurrency(itemPrice * itemQty)}</span>
                            </div>
                            {(it.warrantyValue || it.note) && (
                              <div className="text-[11px] text-gray-500 flex gap-3 mt-0.5">
                                {it.warrantyValue && <span>🛡️ BH: <strong className="text-gray-700">{it.warrantyValue} {it.warrantyUnit}</strong></span>}
                                {it.note && <span>📝 Ghi chú: <strong className="text-gray-700">{it.note}</strong></span>}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </td>
                  <td className="p-3 font-bold text-gray-900">{formatCurrency(o.total)}</td>
                  <td className="p-3 font-bold text-green-600">{formatCurrency(orderProfit)}</td>
                  <td className="p-3">
                    <span className={"px-2 py-0.5 rounded text-[10px] font-bold " + statusClass}>
                      {o.status === 'PAID' ? 'Đã thanh toán' : 'Ghi nợ'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setViewingOrderPrint(o)} title="In lại hóa đơn" className="text-green-600 bg-green-50 p-2 rounded-lg hover:bg-green-100"><Printer size={16}/></button>
                      <button onClick={() => setEditingOrder(o)} title="Chỉnh sửa hóa đơn" className="text-blue-600 bg-blue-50 p-2 rounded-lg hover:bg-blue-100"><Edit size={16}/></button>
                      <button onClick={() => handleDeleteOrder(o)} title="Xóa hóa đơn" className="text-red-600 bg-red-50 p-2 rounded-lg hover:bg-red-100"><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredOrders.length === 0 && (
              <tr><td colSpan="7" className="p-8 text-center text-gray-400">Không tìm thấy hóa đơn nào trong thời điểm này</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={!!editingOrder} onClose={() => setEditingOrder(null)} title="Chỉnh sửa Hóa đơn" maxWidth="max-w-2xl">
        {editingOrder && (
          <form onSubmit={handleSaveEditOrder} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Tên khách hàng</label>
                <input required value={editingOrder.customerName || ''} onChange={e=>setEditingOrder({...editingOrder, customerName: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none text-sm font-medium"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Trạng thái thanh toán</label>
                <select value={editingOrder.status} onChange={e=>setEditingOrder({...editingOrder, status: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none text-sm font-medium bg-white">
                  <option value="PAID">Đã thanh toán (Tiền mặt)</option>
                  <option value="DEBT">Ghi nợ</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Ghi chú đơn hàng (Toàn bộ Bill)</label>
              <textarea value={editingOrder.note || ''} onChange={e=>setEditingOrder({...editingOrder, note: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none text-sm resize-none h-16 bg-white"></textarea>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-800 mb-2 border-b pb-1">Chi tiết hàng hóa & Ghi chú bảo hành</label>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {editingOrder.items?.map((item, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg border flex flex-col md:flex-row gap-3">
                    <div className="flex-1">
                      <p className="font-bold text-sm text-blue-700">{item.name}</p>
                      <div className="flex flex-wrap gap-2 mt-1 items-center">
                        <div className="flex items-center gap-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">SL</label>
                          <input type="number" value={item.quantity} onChange={(e) => {
                            const newItems = [...editingOrder.items];
                            newItems[index] = {...item, quantity: Number(e.target.value)};
                            setEditingOrder({...editingOrder, items: newItems});
                          }} className="w-14 p-1 text-xs border rounded font-bold outline-none text-center" />
                        </div>
                        <div className="flex items-center gap-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Giá</label>
                          <input type="number" value={item.price} onChange={(e) => {
                            const newItems = [...editingOrder.items];
                            newItems[index] = {...item, price: Number(e.target.value)};
                            setEditingOrder({...editingOrder, items: newItems});
                          }} className="w-24 p-1 text-xs border rounded font-bold text-blue-600 outline-none" />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-col lg:flex-row">
                      <div>
                        <label className="text-[10px] text-gray-500 block mb-0.5 font-bold">Bảo hành</label>
                        <div className="flex gap-1">
                          <input type="number" placeholder="Số" value={item.warrantyValue || ''} onChange={(e) => {
                            const newItems = [...editingOrder.items];
                            newItems[index] = {...item, warrantyValue: e.target.value};
                            setEditingOrder({...editingOrder, items: newItems});
                          }} className="w-12 p-1.5 border rounded text-xs outline-none text-center"/>
                          <select value={item.warrantyUnit || 'tháng'} onChange={(e) => {
                            const newItems = [...editingOrder.items];
                            newItems[index] = {...item, warrantyUnit: e.target.value};
                            setEditingOrder({...editingOrder, items: newItems});
                          }} className="p-1.5 border rounded text-xs bg-white outline-none w-20">
                            <option value="ngày">Ngày</option><option value="tuần">Tuần</option><option value="tháng">Tháng</option><option value="năm">Năm</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] text-gray-500 block mb-0.5 font-bold">Ghi chú (IMEI/Mã)</label>
                        <input type="text" placeholder="VD: Serial..." value={item.note || ''} onChange={(e) => {
                          const newItems = [...editingOrder.items];
                          newItems[index] = {...item, note: e.target.value};
                          setEditingOrder({...editingOrder, items: newItems});
                        }} className="w-full p-1.5 border rounded text-xs outline-none"/>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" className="w-full bg-blue-600 text-white font-bold p-3 rounded-lg text-sm">Lưu Thay Đổi</button>
          </form>
        )}
      </Modal>

      <Modal isOpen={!!viewingOrderPrint} onClose={() => setViewingOrderPrint(null)} title="In Lại Hóa Đơn" maxWidth="max-w-2xl" hideHeaderInPrint={true}>
        {viewingOrderPrint && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl no-print mb-4 space-y-3">
              <div className="flex justify-between items-center border-b border-blue-100 pb-2">
                <span className="font-bold text-blue-800">Tùy chọn in ấn (Chuẩn KiotViet)</span>
                <div className="flex gap-2">
                  <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow"><Printer size={14}/> In Hóa Đơn</button>
                  <button onClick={() => setViewingOrderPrint(null)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold">Thoát (ESC)</button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-700">
                <div className="flex items-center gap-2">
                  <span>Khổ giấy:</span>
                  <select value={printType} onChange={e => setPrintType(e.target.value)} className="p-1 border rounded bg-white outline-none">
                    <option value="bill">Máy in nhiệt (K80)</option>
                    <option value="a4">Giấy A4</option>
                    <option value="a5">Giấy A5</option>
                  </select>
                </div>
                <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={printOptions.showLogo} onChange={e=>setPrintOptions({...printOptions, showLogo: e.target.checked})} className="w-3.5 h-3.5"/> In Logo</label>
                <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={printOptions.showNote} onChange={e=>setPrintOptions({...printOptions, showNote: e.target.checked})} className="w-3.5 h-3.5"/> In Ghi chú</label>
                <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={printOptions.showWarranty} onChange={e=>setPrintOptions({...printOptions, showWarranty: e.target.checked})} className="w-3.5 h-3.5"/> In Bảo hành</label>
              </div>
            </div>

            <div className="p-6 bg-white print-container text-gray-900 font-sans">
              {printType === 'bill' ? (
                <div>
                  <div className="text-center mb-4 border-b pb-3">
                    {printOptions.showLogo && storeConfig?.logo && (<img src={storeConfig.logo} alt="Logo" className="max-h-16 mx-auto mb-1 object-contain grayscale" />)}
                    <h2 className="text-base font-bold uppercase">{storeConfig?.name || 'SmartPOS Pro'}</h2>
                    <p className="text-xs text-gray-600">ĐC: {storeConfig?.address || '...'}</p>
                    <p className="text-xs text-gray-600">SĐT: {storeConfig?.phone || '...'}</p>
                    <h1 className="text-sm font-bold mt-2 uppercase tracking-wide">HÓA ĐƠN BÁN HÀNG</h1>
                    <p className="text-[10px] text-gray-500">Mã: #{viewingOrderPrint.id.slice(0,6).toUpperCase()} | Ngày: {formatDate(viewingOrderPrint.date)}</p>
                  </div>
                  <div className="mb-3 text-xs">
                    <p><strong>Khách hàng:</strong> {viewingOrderPrint.customerName}</p>
                    {viewingOrderPrint.phone && <p><strong>SĐT:</strong> {viewingOrderPrint.phone}</p>}
                  </div>
                  <table className="w-full text-xs mb-4">
                    <thead className="border-b border-gray-800">
                      <tr><th className="py-1.5 text-left">Sản phẩm</th><th className="py-1.5 text-center">SL</th><th className="py-1.5 text-right">Thành tiền</th></tr>
                    </thead>
                    <tbody>
                      {viewingOrderPrint.items.map((i, x) => (
                        <tr key={x} className="border-b border-dashed border-gray-200">
                          <td className="py-1.5">
                            <p className="font-bold">{i.name}</p>
                            {((printOptions.showWarranty && i.warrantyValue) || (printOptions.showNote && i.note)) && (
                              <p className="text-[10px] text-gray-500">
                                {printOptions.showWarranty && i.warrantyValue ? `BH: ${i.warrantyValue} ${i.warrantyUnit} ` : ''}
                                {printOptions.showNote && i.note ? `| ${i.note}` : ''}
                              </p>
                            )}
                          </td>
                          <td className="py-1.5 text-center align-top">{i.quantity}</td>
                          <td className="py-1.5 text-right align-top font-medium">{formatCurrency(i.price * i.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t border-gray-800 font-bold">
                      <tr><td colSpan="2" className="py-2 text-right">TỔNG CỘNG:</td><td className="py-2 text-right text-sm">{formatCurrency(viewingOrderPrint.total)}</td></tr>
                    </tfoot>
                  </table>
                  <div className="text-center text-[10px] text-gray-500 mt-6 pt-2 border-t border-dashed">
                    <p>{storeConfig?.printFooterText || 'Cảm ơn quý khách và hẹn gặp lại!'}</p>
                  </div>
                </div>
              ) : (
                <div className={printType === 'a4' ? 'max-w-[210mm] mx-auto p-4' : 'max-w-[148mm] mx-auto p-2'}>
                  <div className="text-center border-b-2 border-gray-800 pb-4 mb-4">
                    {printOptions.showLogo && storeConfig?.logo && (<img src={storeConfig.logo} alt="Logo" className="max-h-20 mx-auto mb-2 object-contain" />)}
                    <h2 className="text-xl font-bold uppercase">{storeConfig?.name || 'SmartPOS Pro'}</h2>
                    <p className="text-sm text-gray-700">Địa chỉ: {storeConfig?.address || '...'}</p>
                    <p className="text-sm text-gray-700">Điện thoại: {storeConfig?.phone || '...'}</p>
                    
                    <h1 className="text-2xl font-bold uppercase text-blue-800 tracking-wide mt-4">PHIẾU BÁN HÀNG</h1>
                    <p className="text-xs text-gray-500 mt-1">Mã HĐ: #{viewingOrderPrint.id.slice(0,6).toUpperCase()} | Ngày: {formatDate(viewingOrderPrint.date)}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs mb-4">
                    <div><span className="text-gray-500">Khách hàng:</span> <strong className="text-gray-800 text-sm">{viewingOrderPrint.customerName}</strong></div>
                    <div><span className="text-gray-500">Trạng thái:</span> <strong className="text-blue-600">{viewingOrderPrint.status === 'PAID' ? 'Đã thanh toán' : 'Ghi nợ'}</strong></div>
                  </div>

                  <table className="w-full text-xs mb-6 border-collapse">
                    <thead>
                      <tr className="bg-gray-100 border-y-2 border-gray-800">
                        <th className="py-2.5 px-2 text-left">STT</th>
                        <th className="py-2.5 px-2 text-left">Tên sản phẩm</th>
                        <th className="py-2.5 px-2 text-center">SL</th>
                        <th className="py-2.5 px-2 text-right">Đơn giá</th>
                        <th className="py-2.5 px-2 text-right">Thành tiền</th>
                        <th className="py-2.5 px-2 text-center">Bảo hành</th>
                        <th className="py-2.5 px-2 text-left">Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewingOrderPrint.items.map((i, x) => (
                        <tr key={x} className="border-b border-gray-200">
                          <td className="py-2.5 px-2 text-center">{x + 1}</td>
                          <td className="py-2.5 px-2 font-medium">{i.name}</td>
                          <td className="py-2.5 px-2 text-center font-bold">{i.quantity}</td>
                          <td className="py-2.5 px-2 text-right">{formatCurrency(i.price)}</td>
                          <td className="py-2.5 px-2 text-right font-bold">{formatCurrency(i.price * i.quantity)}</td>
                          <td className="py-2.5 px-2 text-center text-gray-600">{printOptions.showWarranty && i.warrantyValue ? `${i.warrantyValue} ${i.warrantyUnit}` : '-'}</td>
                          <td className="py-2.5 px-2 text-gray-600">{printOptions.showNote && i.note ? i.note : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-gray-800 font-bold text-sm bg-gray-50">
                        <td colSpan="4" className="py-3 px-2 text-right">TỔNG CỘNG THANH TOÁN:</td>
                        <td colSpan="3" className="py-3 px-2 text-right text-blue-600 text-base">{formatCurrency(viewingOrderPrint.total)}</td>
                      </tr>
                    </tfoot>
                  </table>

                  <div className="grid grid-cols-2 gap-8 text-center pt-8 text-xs">
                    <div>
                      <p className="font-bold">Khách hàng ký nhận</p>
                      <p className="text-gray-400 italic mt-1">(Ký, ghi rõ họ tên)</p>
                    </div>
                    <div>
                      <p className="font-bold">Người bán hàng</p>
                      <p className="text-gray-400 italic mt-1">(Ký, ghi rõ họ tên)</p>
                    </div>
                  </div>
                  
                  <div className="text-center text-xs text-gray-500 mt-12 italic">
                    <p>{storeConfig?.printFooterText || 'Cảm ơn quý khách và hẹn gặp lại!'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function POSView({ products, customers, db, storeId, user, storeConfig, showToast }) {
  const [cart, setCart] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [isDebt, setIsDebt] = useState(false);
  const [orderNote, setOrderNote] = useState('');
  const [completedOrder, setCompletedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [printType, setPrintType] = useState(storeConfig?.printDefaultSize || 'a4');
  const [printOptions, setPrintOptions] = useState({ showLogo: true, showNote: true, showWarranty: true });
  const [showAddCusModal, setShowAddCusModal] = useState(false);
  const [newCusForm, setNewCusForm] = useState({ name: '', phone: '', address: '' });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredProducts = useMemo(() => { return products.filter(p => p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())); }, [products, searchTerm]);

  const addToCart = (product) => { 
    setCart(prev => { 
      const ex = prev.find(i => i.id === product.id); 
      if (ex) return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i); 
      return [...prev, { ...product, quantity: 1, price: product.price, warrantyValue: '', warrantyUnit: 'tháng', note: '' }]; 
    }); 
  };
  const updateQty = (id, delta) => setCart(prev => prev.map(i => { if (i.id === id) { const nq = i.quantity + delta; if (nq > 0) return { ...i, quantity: nq }; } return i; }));
  const updatePrice = (id, newPrice) => setCart(prev => prev.map(i => i.id === id ? { ...i, price: Number(newPrice) || 0 } : i));
  const updateItemField = (id, field, val) => setCart(prev => prev.map(i => i.id === id ? { ...i, [field]: val } : i));
  
  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const handleAddCustomerQuick = async (e) => {
    e.preventDefault();
    try { 
      const nowIso = new Date().toISOString();
      const docRef = await addDoc(collection(db, 'stores', storeId, 'customers'), { name: newCusForm.name, phone: newCusForm.phone || '', address: newCusForm.address || '', totalDebt: 0, createdAt: nowIso }); 
      setCustomerId(docRef.id); setShowAddCusModal(false); setNewCusForm({ name: '', phone: '', address: '' }); showToast("Đã thêm và chọn khách hàng mới!"); 
    } 
    catch (err) { showToast("Lỗi thêm khách hàng", "error"); }
  };

  const handleCheckout = async () => {
    if (cart.length === 0 || (isDebt && !customerId)) return;
    try {
      const c = customers.find(cust => cust.id === customerId);
      const orderData = { 
        customerId: customerId || null, 
        customerName: c ? c.name : 'Khách lẻ', 
        sellerUid: user.uid, 
        note: orderNote, 
        items: cart.map(i => ({ 
          id: i.id, 
          name: i.name, 
          price: i.price, 
          cost: i.cost || 0, 
          quantity: i.quantity,
          warrantyValue: i.warrantyValue || '',
          warrantyUnit: i.warrantyUnit || 'tháng',
          note: i.note || ''
        })), 
        total: cartTotal, 
        totalCost: cart.reduce((s, item) => s + ((item.cost || 0) * item.quantity), 0), 
        status: isDebt ? 'DEBT' : 'PAID', 
        date: new Date().toISOString() 
      };
      const orderRef = await addDoc(collection(db, 'stores', storeId, 'orders'), orderData);
      
      let batch = writeBatch(db);
      cart.forEach(item => { const p = products.find(prod => prod.id === item.id); if (p) { batch.update(doc(db, 'stores', storeId, 'products', p.id), { stock: p.stock - item.quantity }); } });
      if (isDebt && c) { batch.update(doc(db, 'stores', storeId, 'customers', customerId), { totalDebt: (c.totalDebt || 0) + cartTotal }); }
      await batch.commit();

      const newOrder = { id: orderRef.id, ...orderData, phone: c?.phone || '' };
      setCart([]); setCustomerId(''); setIsDebt(false); setOrderNote(''); showToast("Thanh toán thành công!");
      setCompletedOrder(newOrder); setShowModal(true);
    } catch (e) { showToast("Lỗi thanh toán", "error"); }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row bg-gray-50 h-full overflow-hidden">
      <div className="flex-1 p-4 md:p-6 overflow-y-auto flex flex-col no-print">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <h2 className="text-xl font-bold text-gray-800">Sản phẩm bán hàng</h2>
          <div className="relative w-full sm:w-64"><Search size={16} className="absolute left-3 top-3 text-gray-400"/><input placeholder="Tìm nhanh sản phẩm..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-2 border rounded-lg bg-white outline-none text-sm"/></div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map(p => {
            const stockClass = p.stock < 0 ? 'text-red-500 font-bold' : 'text-gray-500';
            return (
              <div key={p.id} onClick={() => addToCart(p)} className="bg-white p-3 rounded-xl border cursor-pointer hover:border-blue-400 shadow-sm">
                <h3 className="font-semibold text-sm truncate text-gray-800">{p.name}</h3>
                <div className="flex justify-between items-end mt-2"><p className="text-blue-600 font-bold">{formatCurrency(p.price)}</p><p className={"text-xs " + stockClass}>Kho: {p.stock}</p></div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="w-full lg:w-[460px] bg-white border-l shadow-lg shrink-0 flex flex-col z-20 h-[65vh] lg:h-auto no-print">
        <div className="p-4 border-b bg-blue-50/50"><h2 className="font-bold flex items-center gap-2"><ShoppingCart size={20} className="text-blue-600"/> Giỏ hàng</h2></div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.map(item => (
            <div key={item.id} className="bg-white p-3 border rounded-xl shadow-sm space-y-2.5">
              <div className="flex justify-between items-start"><h4 className="font-semibold text-sm text-gray-800 truncate">{item.name}</h4><button onClick={() => setCart(c => c.filter(i => i.id !== item.id))} className="text-red-400"><X size={16}/></button></div>
              <div className="flex justify-between items-center gap-2">
                <div><label className="text-[10px] text-gray-400 uppercase font-bold">Giá bán</label><input type="number" value={item.price} onChange={e => updatePrice(item.id, e.target.value)} className="w-28 p-1.5 border rounded text-sm font-bold text-blue-600 outline-none"/></div>
                <div className="flex bg-gray-50 rounded p-1 items-center"><button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 border bg-white rounded shadow-sm text-gray-600">-</button><span className="w-6 text-center text-sm font-medium">{item.quantity}</span><button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 border bg-white rounded shadow-sm text-gray-600">+</button></div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100">
                <div>
                  <label className="text-[10px] text-gray-500 font-bold block mb-0.5">Bảo hành</label>
                  <div className="flex gap-1">
                    <input type="number" placeholder="Số" value={item.warrantyValue || ''} onChange={e => updateItemField(item.id, 'warrantyValue', e.target.value)} className="w-12 p-1 border rounded text-xs outline-none text-center font-bold"/>
                    <select value={item.warrantyUnit || 'tháng'} onChange={e => updateItemField(item.id, 'warrantyUnit', e.target.value)} className="p-1 border rounded text-xs bg-white outline-none flex-1">
                      <option value="ngày">Ngày</option>
                      <option value="tuần">Tuần</option>
                      <option value="tháng">Tháng</option>
                      <option value="năm">Năm</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 font-bold block mb-0.5">Ghi chú sản phẩm</label>
                  <input type="text" placeholder="IMEI, Serial..." value={item.note || ''} onChange={e => updateItemField(item.id, 'note', e.target.value)} className="w-full p-1 border rounded text-xs outline-none"/>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t bg-gray-50 space-y-3">
          <div className="flex gap-2">
            <select value={customerId} onChange={e=>setCustomerId(e.target.value)} className="flex-1 p-2.5 border rounded-lg outline-none text-sm bg-white"><option value="">-- Khách lẻ (Tiền mặt) --</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            <button onClick={() => setShowAddCusModal(true)} className="bg-blue-50 text-blue-600 border border-blue-200 px-3 rounded-lg font-bold text-xs flex items-center gap-1 shrink-0"><Plus size={14}/> Thêm KH</button>
          </div>
          <textarea value={orderNote} onChange={e=>setOrderNote(e.target.value)} placeholder="Ghi chú đơn hàng..." className="w-full p-2.5 border rounded-lg outline-none text-sm resize-none h-12 bg-white"></textarea>
          <div className="flex gap-2"><button onClick={() => setIsDebt(false)} className={"flex-1 py-2 rounded-lg border font-bold " + (!isDebt ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300')}>Tiền mặt</button><button onClick={() => setIsDebt(true)} className={"flex-1 py-2 rounded-lg border font-bold " + (isDebt ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-300')}>Ghi nợ</button></div>
          <div className="flex justify-between items-center py-1"><span className="font-medium text-gray-600">Tổng tiền:</span><span className="text-2xl font-bold text-blue-600">{formatCurrency(cartTotal)}</span></div>
          <button onClick={handleCheckout} disabled={cart.length === 0 || (isDebt && !customerId)} className="w-full bg-green-600 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl shadow-sm">Thanh toán</button>
        </div>
      </div>

      <Modal isOpen={showAddCusModal} onClose={() => setShowAddCusModal(false)} title="Thêm Khách Hàng Nhanh">
        <form onSubmit={handleAddCustomerQuick} className="space-y-4">
          <input required placeholder="Tên khách hàng *" value={newCusForm.name} onChange={e=>setNewCusForm({...newCusForm, name:e.target.value})} className="w-full p-2.5 border rounded-lg outline-none text-sm"/>
          <input placeholder="Số điện thoại" value={newCusForm.phone} onChange={e=>setNewCusForm({...newCusForm, phone:e.target.value})} className="w-full p-2.5 border rounded-lg outline-none text-sm"/>
          <input placeholder="Địa chỉ" value={newCusForm.address} onChange={e=>setNewCusForm({...newCusForm, address:e.target.value})} className="w-full p-2.5 border rounded-lg outline-none text-sm"/>
          <button type="submit" className="w-full bg-blue-600 text-white font-bold p-3 rounded-lg text-sm">Lưu & Chọn Khách Hàng</button>
        </form>
      </Modal>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Hóa đơn" maxWidth="max-w-2xl" hideHeaderInPrint={true}>
        {completedOrder && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl no-print mb-4 space-y-3">
              <div className="flex justify-between items-center border-b border-blue-100 pb-2">
                <span className="font-bold text-blue-800">Tùy chọn in ấn (Chuẩn KiotViet)</span>
                <div className="flex gap-2">
                  <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow"><Printer size={14}/> In Hóa Đơn</button>
                  <button onClick={() => setShowModal(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold">Thoát (ESC)</button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-700">
                <div className="flex items-center gap-2">
                  <span>Khổ giấy:</span>
                  <select value={printType} onChange={e => setPrintType(e.target.value)} className="p-1 border rounded bg-white outline-none">
                    <option value="bill">Máy in nhiệt (K80)</option>
                    <option value="a4">Giấy A4</option>
                    <option value="a5">Giấy A5</option>
                  </select>
                </div>
                <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={printOptions.showLogo} onChange={e=>setPrintOptions({...printOptions, showLogo: e.target.checked})} className="w-3.5 h-3.5"/> In Logo</label>
                <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={printOptions.showNote} onChange={e=>setPrintOptions({...printOptions, showNote: e.target.checked})} className="w-3.5 h-3.5"/> In Ghi chú</label>
                <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={printOptions.showWarranty} onChange={e=>setPrintOptions({...printOptions, showWarranty: e.target.checked})} className="w-3.5 h-3.5"/> In Bảo hành</label>
              </div>
            </div>

            <div className="p-6 bg-white print-container text-gray-900 font-sans">
              {printType === 'bill' ? (
                <div>
                  <div className="text-center mb-4 border-b pb-3">
                    {printOptions.showLogo && storeConfig?.logo && (<img src={storeConfig.logo} alt="Logo" className="max-h-12 mx-auto mb-1 object-contain grayscale" />)}
                    <h2 className="text-base font-bold uppercase">{storeConfig?.name || 'SmartPOS Pro'}</h2>
                    <p className="text-xs text-gray-600">ĐC: {storeConfig?.address || '...'}</p>
                    <p className="text-xs text-gray-600">SĐT: {storeConfig?.phone || '...'}</p>
                    <h1 className="text-sm font-bold mt-2 uppercase tracking-wide">HÓA ĐƠN BÁN HÀNG</h1>
                    <p className="text-[10px] text-gray-500">Mã: #{completedOrder.id.slice(0,6).toUpperCase()} | Ngày: {formatDate(completedOrder.date)}</p>
                  </div>
                  <div className="mb-3 text-xs">
                    <p><strong>Khách hàng:</strong> {completedOrder.customerName}</p>
                    {completedOrder.phone && <p><strong>SĐT:</strong> {completedOrder.phone}</p>}
                  </div>
                  <table className="w-full text-xs mb-4">
                    <thead className="border-b border-gray-800">
                      <tr><th className="py-1.5 text-left">Sản phẩm</th><th className="py-1.5 text-center">SL</th><th className="py-1.5 text-right">Thành tiền</th></tr>
                    </thead>
                    <tbody>
                      {completedOrder.items.map((i, x) => (
                        <tr key={x} className="border-b border-dashed border-gray-200">
                          <td className="py-1.5">
                            <p className="font-bold">{i.name}</p>
                            {((printOptions.showWarranty && i.warrantyValue) || (printOptions.showNote && i.note)) && (
                              <p className="text-[10px] text-gray-500">
                                {printOptions.showWarranty && i.warrantyValue ? `BH: ${i.warrantyValue} ${i.warrantyUnit} ` : ''}
                                {printOptions.showNote && i.note ? `| ${i.note}` : ''}
                              </p>
                            )}
                          </td>
                          <td className="py-1.5 text-center align-top">{i.quantity}</td>
                          <td className="py-1.5 text-right align-top font-medium">{formatCurrency(i.price * i.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t border-gray-800 font-bold">
                      <tr><td colSpan="2" className="py-2 text-right">TỔNG CỘNG:</td><td className="py-2 text-right text-sm">{formatCurrency(completedOrder.total)}</td></tr>
                    </tfoot>
                  </table>
                  <div className="text-center text-[10px] text-gray-500 mt-6 pt-2 border-t border-dashed">
                    <p>{storeConfig?.printFooterText || 'Cảm ơn quý khách và hẹn gặp lại!'}</p>
                  </div>
                </div>
              ) : (
                <div className={printType === 'a4' ? 'max-w-[210mm] mx-auto p-4' : 'max-w-[148mm] mx-auto p-2'}>
                  <div className="text-center border-b-2 border-gray-800 pb-4 mb-4">
                    {printOptions.showLogo && storeConfig?.logo && (<img src={storeConfig.logo} alt="Logo" className="max-h-20 mx-auto mb-2 object-contain" />)}
                    <h2 className="text-xl font-bold uppercase">{storeConfig?.name || 'SmartPOS Pro'}</h2>
                    <p className="text-sm text-gray-700">Địa chỉ: {storeConfig?.address || '...'}</p>
                    <p className="text-sm text-gray-700">Điện thoại: {storeConfig?.phone || '...'}</p>
                    
                    <h1 className="text-2xl font-bold uppercase text-blue-800 tracking-wide mt-4">PHIẾU BÁN HÀNG</h1>
                    <p className="text-xs text-gray-500 mt-1">Mã HĐ: #{completedOrder.id.slice(0,6).toUpperCase()} | Ngày: {formatDate(completedOrder.date)}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs mb-4">
                    <div><span className="text-gray-500">Khách hàng:</span> <strong className="text-gray-800 text-sm">{completedOrder.customerName}</strong></div>
                    <div><span className="text-gray-500">Trạng thái:</span> <strong className="text-blue-600">{completedOrder.status === 'PAID' ? 'Đã thanh toán' : 'Ghi nợ'}</strong></div>
                  </div>

                  <table className="w-full text-xs mb-6 border-collapse">
                    <thead>
                      <tr className="bg-gray-100 border-y-2 border-gray-800">
                        <th className="py-2.5 px-2 text-left">STT</th>
                        <th className="py-2.5 px-2 text-left">Tên sản phẩm</th>
                        <th className="py-2.5 px-2 text-center">SL</th>
                        <th className="py-2.5 px-2 text-right">Đơn giá</th>
                        <th className="py-2.5 px-2 text-right">Thành tiền</th>
                        <th className="py-2.5 px-2 text-center">Bảo hành</th>
                        <th className="py-2.5 px-2 text-left">Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody>
                      {completedOrder.items.map((i, x) => (
                        <tr key={x} className="border-b border-gray-200">
                          <td className="py-2.5 px-2 text-center">{x + 1}</td>
                          <td className="py-2.5 px-2 font-medium">{i.name}</td>
                          <td className="py-2.5 px-2 text-center font-bold">{i.quantity}</td>
                          <td className="py-2.5 px-2 text-right">{formatCurrency(i.price)}</td>
                          <td className="py-2.5 px-2 text-right font-bold">{formatCurrency(i.price * i.quantity)}</td>
                          <td className="py-2.5 px-2 text-center text-gray-600">{printOptions.showWarranty && i.warrantyValue ? `${i.warrantyValue} ${i.warrantyUnit}` : '-'}</td>
                          <td className="py-2.5 px-2 text-gray-600">{printOptions.showNote && i.note ? i.note : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-gray-800 font-bold text-sm bg-gray-50">
                        <td colSpan="4" className="py-3 px-2 text-right">TỔNG CỘNG THANH TOÁN:</td>
                        <td colSpan="3" className="py-3 px-2 text-right text-blue-600 text-base">{formatCurrency(completedOrder.total)}</td>
                      </tr>
                    </tfoot>
                  </table>

                  <div className="grid grid-cols-2 gap-8 text-center pt-8 text-xs">
                    <div>
                      <p className="font-bold">Khách hàng ký nhận</p>
                      <p className="text-gray-400 italic mt-1">(Ký, ghi rõ họ tên)</p>
                    </div>
                    <div>
                      <p className="font-bold">Người bán hàng</p>
                      <p className="text-gray-400 italic mt-1">(Ký, ghi rõ họ tên)</p>
                    </div>
                  </div>
                  
                  <div className="text-center text-xs text-gray-500 mt-12 italic">
                    <p>{storeConfig?.printFooterText || 'Cảm ơn quý khách và hẹn gặp lại!'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function ImportView({ products, suppliers, db, storeId, user, showToast }) {
  const [cart, setCart] = useState([]);
  const [supplierId, setSupplierId] = useState('');
  const [isDebt, setIsDebt] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = useMemo(() => { return products.filter(p => p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())); }, [products, searchTerm]);

  const handleImport = async () => {
    if (cart.length === 0 || !supplierId) return;
    try {
      const s = suppliers.find(sup => sup.id === supplierId);
      const total = cart.reduce((sum, i) => sum + i.importCost * i.qty, 0);
      await addDoc(collection(db, 'stores', storeId, 'imports'), { supplierId: supplierId, supplierName: s.name, items: cart, total: total, status: isDebt ? 'DEBT' : 'PAID', date: new Date().toISOString() });
      
      let batch = writeBatch(db);
      cart.forEach(item => { const p = products.find(prod => prod.id === item.id); if (p) { batch.update(doc(db, 'stores', storeId, 'products', p.id), { stock: p.stock + item.qty, cost: item.importCost }); } });
      if (isDebt) { batch.update(doc(db, 'stores', storeId, 'suppliers', supplierId), { totalDebt: (s.totalDebt || 0) + total }); }
      await batch.commit();
      
      setCart([]); setSupplierId(''); setIsDebt(false); showToast("Nhập hàng thành công!");
    } catch (e) { showToast("Lỗi nhập hàng", "error"); }
  };

  const addProductToCart = (p) => { setCart(c => { if (c.find(i => i.id === p.id)) return c; return [...c, { ...p, qty: 1, importCost: p.cost || 0 }]; }); };

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-gray-50 h-full">
      <div className="flex-1 p-4 md:p-6 overflow-y-auto flex flex-col no-print">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <h2 className="text-xl font-bold text-gray-800">Hàng cần nhập</h2>
          <div className="relative w-full sm:w-64"><Search size={16} className="absolute left-3 top-3 text-gray-400"/><input placeholder="Tìm kiếm sản phẩm nhập..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-2 border rounded-lg bg-white outline-none text-sm"/></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {filteredProducts.map(p => (
            <div key={p.id} onClick={() => addProductToCart(p)} className="bg-white p-3 rounded-xl border cursor-pointer hover:border-blue-400 shadow-sm"><h3 className="font-semibold text-sm truncate">{p.name}</h3><p className="text-xs text-gray-500 mt-1">Tồn: {p.stock}</p></div>
          ))}
        </div>
      </div>
      
      <div className="w-full lg:w-[420px] bg-white border-l shadow-lg shrink-0 z-20 flex flex-col h-[65vh] lg:h-auto no-print">
        <div className="p-4 border-b bg-gray-50"><h2 className="font-bold flex items-center gap-2"><ArrowDownToLine size={20} className="text-gray-600"/> Phiếu Nhập Kho</h2></div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.map(item => (
            <div key={item.id} className="bg-gray-50 p-3 rounded-lg border space-y-2">
              <div className="flex justify-between"><h4 className="font-medium text-sm">{item.name}</h4><button onClick={() => setCart(c => c.filter(i => i.id !== item.id))} className="text-red-400"><X size={16}/></button></div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><label className="text-xs text-gray-500">Số lượng</label><input type="number" value={item.qty} onChange={e => setCart(c => c.map(i => i.id === item.id ? {...i, qty: Number(e.target.value)} : i))} className="w-full p-1.5 border rounded outline-none" /></div>
                <div><label className="text-xs text-gray-500">Đơn giá nhập</label><input type="number" value={item.importCost} onChange={e => setCart(c => c.map(i => i.id === item.id ? {...i, importCost: Number(e.target.value)} : i))} className="w-full p-1.5 border rounded outline-none" /></div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t bg-gray-50 space-y-3">
          <select value={supplierId} onChange={e=>setSupplierId(e.target.value)} className="w-full p-2.5 border rounded-lg outline-none text-sm bg-white"><option value="">-- Chọn NCC --</option>{suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
          <div className="flex gap-2"><button onClick={() => setIsDebt(false)} className={"flex-1 py-2 rounded-lg border font-bold " + (!isDebt ? 'bg-blue-600 text-white' : 'bg-white')}>Tiền mặt</button><button onClick={() => setIsDebt(true)} className={"flex-1 py-2 rounded-lg border font-bold " + (isDebt ? 'bg-orange-500 text-white' : 'bg-white')}>Ghi nợ NCC</button></div>
          <button onClick={handleImport} disabled={!supplierId || cart.length === 0} className="w-full bg-gray-800 disabled:bg-gray-300 text-white py-3 rounded-xl font-bold mt-2 shadow-sm">Hoàn tất Nhập Hàng</button>
        </div>
      </div>
    </div>
  );
}

function InventoryView({ products, orders, imports, db, storeId, showToast }) {
  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [form, setForm] = useState({ category: '' });
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [sortConfig, setSortConfig] = useState({ field: null, direction: 'none' });

  const [detailProduct, setDetailProduct] = useState(null);
