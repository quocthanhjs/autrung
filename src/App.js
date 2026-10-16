import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, ShoppingCart, Package, Users, Truck, Plus, 
  Edit, Trash2, Check, X, Image as ImageIcon, ShoppingBag, 
  TrendingUp, AlertCircle, ArrowDownToLine, Phone, 
  DollarSign, CheckCircle2, Printer, FileText, CreditCard,
  Lock, LogOut, ShieldAlert, User as UserIcon, Database,
  UserCog, KeyRound, MonitorSmartphone, Mail, Download, Upload, ArrowUpDown, Search, Eye, Bell, Award, BarChart3
} from 'lucide-react';

import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInWithEmailAndPassword, signOut, 
  onAuthStateChanged, sendPasswordResetEmail, createUserWithEmailAndPassword
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
  let containerClass = "bg-white rounded-xl shadow-2xl w-full " + maxWidth + " overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:rounded-none print:w-full";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm print:bg-transparent print:p-0">
      <div className={containerClass}>
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
    const unsubStore = onSnapshot(doc(db, 'stores', storeId), (docSnap) => { if (docSnap.exists()) setStoreConfig({ name: 'SmartPOS Pro', ...docSnap.data() }); });
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

  const printStyle = "@media print { body * { visibility: hidden; } .print-container, .print-container * { visibility: visible; } .print-container { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; } .no-print { display: none !important; } }";

  return (
    <>
      <style>{printStyle}</style>
      <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans text-sm md:text-base print:hidden">
        <aside className="w-full md:w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm z-10 shrink-0">
          <div className="p-5 border-b border-gray-100 flex items-center gap-3">
            {storeConfig.logo ? <img src={storeConfig.logo} alt="Logo" className="w-10 h-10 object-contain rounded bg-white p-1 shadow-sm" /> : <div className="bg-blue-600 text-white p-2 rounded-lg"><ShoppingBag size={24} /></div>}
            <div className="min-w-0"><h1 className="text-lg font-bold tracking-tight text-gray-800 truncate">{storeConfig.name || 'SmartPOS'}</h1></div>
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

  const stats = useMemo(() => {
    const fOrders = orders.filter(o => { const d = new Date(o.date); return (filterMonth === 'ALL' || (d.getMonth() + 1).toString() === filterMonth) && d.getFullYear().toString() === filterYear; });
    const fImports = imports.filter(i => { const d = new Date(i.date); return (filterMonth === 'ALL' || (d.getMonth() + 1).toString() === filterMonth) && d.getFullYear().toString() === filterYear; });
    const fExpenses = expenses.filter(e => { const d = new Date(e.date); return (filterMonth === 'ALL' || (d.getMonth() + 1).toString() === filterMonth) && d.getFullYear().toString() === filterYear; });
    
    const totalRev = fOrders.reduce((s, o) => s + o.total, 0);
    const totalCost = fOrders.reduce((s, o) => s + (o.totalCost || 0), 0);
    const totalExp = fExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const netProfit = totalRev - totalCost - totalExp;
    
    const overdueCust = orders.filter(o => o.status === 'DEBT').sort((a,b) => new Date(b.date) - new Date(a.date));
    const overdueSupp = imports.filter(i => i.status === 'DEBT').sort((a,b) => new Date(b.date) - new Date(a.date));
    const overdueCust1Week = overdueCust.filter(o => getDaysDifference(o.date) >= 7);

    // TÍNH TOÁN BIỂU ĐỒ BÁN HÀNG THEO NGÀY (TRONG THÁNG ĐƯỢC CHỌN) HOẶC THEO THÁNG (NẾU CHỌN CẢ NĂM)
    let chartData = {};
    if (filterMonth !== 'ALL') {
      // Nhóm theo ngày trong tháng
      fOrders.forEach(o => {
        const d = new Date(o.date);
        const dayKey = d.getDate() + '/' + (d.getMonth() + 1);
        chartData[dayKey] = (chartData[dayKey] || 0) + o.total;
      });
    } else {
      // Nhóm theo tháng trong năm
      const monthNames = ['Th 1', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7', 'Th 8', 'Th 9', 'Th 10', 'Th 11', 'Th 12'];
      monthNames.forEach((m, idx) => { chartData[m] = 0; });
      fOrders.forEach(o => {
        const d = new Date(o.date);
        const mKey = monthNames[d.getMonth()];
        chartData[mKey] = (chartData[mKey] || 0) + o.total;
      });
    }

    // TÍNH TOÁN HÀNG HÓA BÁN CHẠY NHẤT TRONG KỲ LỌC
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

    return { totalRev, totalCost, totalExp, netProfit, overdueCust, overdueSupp, overdueCust1Week, chartData, topProducts };
  }, [orders, imports, expenses, filterMonth, filterYear]);

  const years = Array.from({length: 5}, (_, i) => currentDate.getFullYear() - i);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50/50 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Báo cáo Kinh doanh & Biểu đồ</h2>
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

      {stats.overdueCust1Week.length > 0 && (
        <div className="bg-red-50 border-2 border-red-500 rounded-2xl shadow-sm overflow-hidden animate-pulse-slow">
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

      {/* KHU VỰC BIỂU ĐỒ BÁN HÀNG VÀ TOP HÀNG BÁN CHẠY */}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b flex justify-between items-center font-bold text-gray-700">
            <div className="flex gap-2"><AlertCircle size={20}/> Toàn bộ Phải Thu (Khách nợ)</div>
          </div>
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white sticky top-0 shadow-sm">
                <tr><th className="p-3">Khách hàng</th><th className="p-3">Thời gian</th><th className="p-3">Số tiền</th></tr>
              </thead>
              <tbody>
                {stats.overdueCust.map(o => (
                  <tr key={o.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-bold">{o.customerName}</td>
                    <td className="p-3">{getDaysDifference(o.date)} ngày</td>
                    <td className="p-3 font-bold text-red-600">{formatCurrency(o.total)}</td>
                  </tr>
                ))}
                {stats.overdueCust.length === 0 && (<tr><td colSpan="3" className="p-4 text-center text-gray-500">Không có nợ khách hàng</td></tr>)}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b flex justify-between items-center font-bold text-gray-700">
            <div className="flex gap-2"><Truck size={20}/> Phải Trả (Nợ NCC)</div>
          </div>
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white sticky top-0 shadow-sm">
                <tr><th className="p-3">Nhà Cung Cấp</th><th className="p-3">Thời gian</th><th className="p-3">Số tiền</th></tr>
              </thead>
              <tbody>
                {stats.overdueSupp.map(i => (
                  <tr key={i.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-bold">{i.supplierName}</td>
                    <td className="p-3">{getDaysDifference(i.date)} ngày</td>
                    <td className="p-3 font-bold text-orange-600">{formatCurrency(i.total)}</td>
                  </tr>
                ))}
                {stats.overdueSupp.length === 0 && (<tr><td colSpan="3" className="p-4 text-center text-gray-500">Không có nợ nhà cung cấp</td></tr>)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ icon, title, value, color, highlight = false }) => {
  const borderClass = highlight ? 'border-green-300 ring-1 ring-green-100' : 'border-gray-200';
  const textClass = highlight ? 'text-green-700' : 'text-gray-900';
  return (
    <div className={"bg-white p-5 rounded-2xl shadow-sm border flex items-center gap-4 " + borderClass}>
      <div className={"w-14 h-14 rounded-full flex items-center justify-center shrink-0 " + color}>{React.cloneElement(icon, { size: 24 })}</div>
      <div className="min-w-0"><p className="text-gray-500 text-sm font-medium mb-1 truncate">{title}</p><p className={"text-xl font-bold truncate " + textClass}>{value}</p></div>
    </div>
  );
};

function StaffManagerView({ db, showToast }) {
  const [staff, setStaff] = useState([]); 
  const [logs, setLogs] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ id: '', name: '', username: '', email: '', password: '', role: 'seller', perms: {} });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubStaff = onSnapshot(collection(db, 'users_db'), (s) => setStaff(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const qLogs = query(collection(db, 'login_logs'), orderBy('loginTime', 'desc'));
    const unsubLogs = onSnapshot(qLogs, (s) => setLogs(s.docs.map(d => ({ id: d.id, ...d.data() })).slice(0, 50)));
    return () => { unsubStaff(); unsubLogs(); };
  }, []);

  const handleSave = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      if(form.id) { 
        await updateDoc(doc(db, 'users_db', form.id), { role: form.role, permissions: form.perms }); 
        showToast("Đã cập nhật quyền"); setIsModalOpen(false); 
      } else {
        const msg = "Hệ thống sẽ ĐĂNG XUẤT tài khoản Admin hiện tại để khởi tạo tài khoản Nhân viên mới. Bạn đồng ý chứ?";
        if(!window.confirm(msg)) { setLoading(false); return; }
        const res = await createUserWithEmailAndPassword(auth, form.email, form.password);
        await setDoc(doc(db, 'users_db', res.user.uid), { username: form.username, email: form.email, name: form.name, role: form.role, permissions: form.perms || {} });
        showToast("Tạo thành công! Vui lòng đăng nhập lại.", "success");
        await signOut(auth);
      }
    } catch (err) { showToast("Lỗi: " + err.message, "error"); } finally { setLoading(false); }
  };

  const openAddModal = () => { setForm({ id: '', name: '', username: '', email: '', password: '', role: 'seller', perms: {} }); setIsModalOpen(true); };
  const openEditModal = (s) => { setForm({ id: s.id, name: s.name, username: s.username, email: s.email, role: s.role, perms: s.permissions || {} }); setIsModalOpen(true); };
  const modalTitle = form.id ? "Sửa quyền: " + form.name : "Thêm Nhân Viên Mới";

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 bg-gray-50 overflow-auto h-full">
      <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold flex items-center gap-2"><UserCog/> Quản trị Nhân viên</h2><button onClick={openAddModal} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"><Plus size={18}/> Thêm Nhân viên</button></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full min-h-[500px]">
        <div className="bg-white border rounded-xl overflow-auto shadow-sm"><div className="p-3 bg-gray-100 font-bold sticky top-0 border-b">Danh sách Tài khoản</div>
          <table className="w-full text-sm text-left"><thead className="bg-gray-50 border-b"><tr><th className="p-3">Tên & Username</th><th className="p-3">Quyền</th><th className="p-3 text-right">Thao tác</th></tr></thead>
            <tbody>{staff.map(s => { const roleClass = s.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'; return (<tr key={s.id} className="border-b hover:bg-gray-50"><td className="p-3"><p className="font-bold text-gray-800">{s.name}</p><p className="text-xs text-gray-500">@{s.username}</p></td><td className="p-3"><span className={"px-2 py-1 rounded text-xs font-bold " + roleClass}>{s.role.toUpperCase()}</span></td><td className="p-3 text-right"><button onClick={() => openEditModal(s)} className="text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg font-medium">Sửa quyền</button></td></tr>); })}</tbody>
          </table>
        </div>
        <div className="bg-white border rounded-xl overflow-auto shadow-sm"><div className="p-3 bg-gray-100 font-bold sticky top-0 border-b">Lịch sử Đăng nhập (Giám sát)</div>
          <table className="w-full text-xs text-left"><thead className="bg-gray-50 border-b"><tr><th className="p-3">Thời gian</th><th className="p-3">Username</th><th className="p-3">Thiết bị & IP</th></tr></thead>
            <tbody>{logs.map(l => (<tr key={l.id} className="border-b hover:bg-gray-50"><td className="p-3 text-gray-500">{formatDate(l.loginTime)}</td><td className="p-3 font-bold text-blue-600">{l.username}</td><td className="p-3"><p>{l.device}</p><p className="text-gray-400 font-mono">{l.ip}</p></td></tr>))}</tbody>
          </table>
        </div>
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalTitle} maxWidth="max-w-2xl">
        <form onSubmit={handleSave} className="space-y-4">
          {!form.id && (
            <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
              <div className="col-span-2"><input required placeholder="Tên nhân viên *" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} className="w-full p-2.5 border rounded outline-none"/></div>
              <div><input required placeholder="Username đăng nhập *" value={form.username} onChange={e=>setForm({...form, username:e.target.value.toLowerCase().replace(/\s/g,'')})} className="w-full p-2.5 border rounded outline-none"/></div>
              <div><input required type="password" placeholder="Mật khẩu *" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} className="w-full p-2.5 border rounded outline-none"/></div>
              <div className="col-span-2"><input required type="email" placeholder="Email thực (Để lấy lại MK) *" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} className="w-full p-2.5 border rounded outline-none"/></div>
            </div>
          )}
          <select value={form.role} onChange={e=>setForm({...form, role: e.target.value})} className="w-full p-2.5 border rounded font-bold outline-none"><option value="seller">Nhân viên (Theo check-box bên dưới)</option><option value="admin">Quản trị viên (Toàn quyền)</option></select>
          {form.role === 'seller' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[40vh] overflow-y-auto p-4 border rounded bg-gray-50">
              {PERMISSION_TREE.map(g => (<div key={g.module} className="border-b pb-2"><p className="font-bold text-blue-800 text-sm mb-2 uppercase">{g.module}</p>{g.perms.map(p => (<label key={p.id} className="flex items-center gap-2 text-sm mb-1.5 cursor-pointer hover:bg-gray-200 p-1 rounded"><input type="checkbox" checked={!!form.perms[p.id]} onChange={() => setForm({...form, perms: {...form.perms, [p.id]: !form.perms[p.id]}})} className="w-4 h-4 text-blue-600"/> {p.label}</label>))}</div>))}
            </div>
          )}
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold p-3 rounded-lg">{loading ? 'Đang xử lý...' : 'Lưu Dữ Liệu'}</button>
        </form>
      </Modal>
    </div>
  );
}

function SettingsView({ db, storeId, showToast, storeConfig }) {
  const [form, setForm] = useState(storeConfig);
  const [loadingFile, setLoadingFile] = useState(false);

  useEffect(() => { if (!window.XLSX) { const s = document.createElement('script'); s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"; document.body.appendChild(s); } }, []);

  const handleLogo = (e) => { const f = e.target.files[0]; if (f) { const r = new FileReader(); r.onloadend = () => setForm({...form, logo: r.result}); r.readAsDataURL(f); } };
  const handleSaveConfig = async (e) => { e.preventDefault(); await setDoc(doc(db, 'stores', storeId), form, { merge: true }); showToast("Đã lưu Cấu hình"); };

  const handleImport = async (e, type) => {
    const file = e.target.files[0]; if (!file || !window.XLSX) return; setLoadingFile(true);
    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const wb = window.XLSX.read(evt.target.result, { type: 'binary' });
          const data = window.XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
          let batch = writeBatch(db); let count = 0; let success = 0;
          for (let i = 0; i < data.length; i++) {
            let p = null; const row = data[i];
            if (type === 'products' && row['Tên hàng']) p = { name: String(row['Tên hàng']), price: Number(row['Giá bán']) || 0, cost: Number(row['Giá vốn']) || 0, stock: Number(row['Tồn kho']) || 0 };
            else if (type === 'customers' && row['Tên khách hàng']) { const rawPhone = row['Điện thoại'] ? String(row['Điện thoại']) : ''; p = { name: String(row['Tên khách hàng']), phone: rawPhone.replace('.0', ''), totalDebt: Number(row['Nợ cần thu hiện tại']) || 0 }; }
            else if (type === 'suppliers' && row['Tên nhà cung cấp']) { const rawPhone = row['Điện thoại'] ? String(row['Điện thoại']) : ''; p = { name: String(row['Tên nhà cung cấp']), phone: rawPhone.replace('.0', ''), totalDebt: Number(row['Nợ cần trả hiện tại']) || 0 }; }
            else if (type === 'expenses' && row['Số tiền']) p = { amount: Number(row['Số tiền']), note: row['Nội dung'] || '', date: new Date().toISOString() };
            if (p) { batch.set(doc(collection(db, 'stores', storeId, type)), p); count++; success++; }
            if (count === 400 || i === data.length - 1) { if (count > 0) { await batch.commit(); batch = writeBatch(db); count = 0; } }
          }
          showToast("Đã NHẬP thành công " + success + " dòng."); setLoadingFile(false); e.target.value = '';
        } catch(err) { showToast("Lỗi dữ liệu", "error"); setLoadingFile(false); }
      };
      reader.readAsBinaryString(file);
    } catch(err) { setLoadingFile(false); }
  };

  const handleExport = async (type) => {
    if (!window.XLSX) return showToast("Hệ thống chưa sẵn sàng", "error");
    setLoadingFile(true);
    try {
      const snap = await getDocs(collection(db, 'stores', storeId, type));
      let exportData = [];
      snap.docs.forEach(d => {
        const item = d.data();
        if (type === 'products') exportData.push({ 'Tên hàng': item.name, 'Giá bán': item.price, 'Giá vốn': item.cost, 'Tồn kho': item.stock });
        if (type === 'customers') exportData.push({ 'Tên khách hàng': item.name, 'Điện thoại': item.phone, 'Nợ cần thu hiện tại': item.totalDebt });
        if (type === 'suppliers') exportData.push({ 'Tên nhà cung cấp': item.name, 'Điện thoại': item.phone, 'Nợ cần trả hiện tại': item.totalDebt });
        if (type === 'expenses') exportData.push({ 'Ngày': formatDate(item.date), 'Nội dung': item.note, 'Số tiền': item.amount });
      });
      const ws = window.XLSX.utils.json_to_sheet(exportData);
      const wb = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(wb, ws, "Data");
      window.XLSX.writeFile(wb, "Xuat_Du_Lieu_" + type + ".xlsx");
      showToast("Đã XUẤT file Excel thành công!");
    } catch(e) { showToast("Lỗi xuất file", "error"); }
    setLoadingFile(false);
  };

  const menuItems = [{ id: 'customers', label: 'Khách hàng (Nợ phải thu)' }, { id: 'suppliers', label: 'Nhà cung cấp (Nợ phải trả)' }, { id: 'products', label: 'Hàng hóa & Kho' }, { id: 'expenses', label: 'Lịch sử Chi phí' }];

  return (
    <div className="flex-1 p-4 md:p-6 bg-gray-50 overflow-auto">
      <h2 className="text-2xl font-bold mb-6">Cài đặt & Dữ liệu Excel (Drive)</h2>
      <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl mb-6 shadow-sm">
        <strong className="flex items-center gap-2"><FileText size={18}/> Mẹo lưu trữ Google Drive:</strong> 
        Hệ thống đang tự động đồng bộ theo thời gian thực mọi thao tác qua máy chủ. Nếu anh muốn lưu file cứng lên Google Drive cá nhân, chỉ cần chọn nút <b>"Xuất"</b> ở dưới để tải file Excel về máy rồi đưa lên Drive.
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-bold border-b pb-2 mb-4 text-gray-800">Cấu hình Hóa đơn & Giao diện</h3>
          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div className="flex gap-4 items-center">
              {form.logo ? <img src={form.logo} className="w-16 h-16 object-contain border p-1 rounded bg-gray-50" alt="Logo" /> : <div className="w-16 h-16 bg-gray-100 border rounded flex items-center justify-center text-xs text-gray-400">Logo</div>}
              <div><input type="file" accept="image/*" onChange={handleLogo} className="text-sm" /><button type="button" onClick={() => setForm({...form, logo:''})} className="text-red-500 text-xs block mt-1 hover:underline">Xóa logo</button></div>
            </div>
            <input required placeholder="Tên cửa hàng" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full p-2.5 border rounded-lg outline-none"/>
            <input placeholder="Địa chỉ" value={form.address} onChange={e=>setForm({...form,address:e.target.value})} className="w-full p-2.5 border rounded-lg outline-none"/>
            <input placeholder="Số điện thoại" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className="w-full p-2.5 border rounded-lg outline-none"/>
            <button type="submit" className="bg-blue-600 text-white font-bold py-2.5 px-6 rounded-lg w-full">Lưu Thông Tin</button>
          </form>
        </div>
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-bold border-b pb-2 mb-4 text-gray-800">Quản lý File Excel (Xuất & Nhập)</h3>
          {loadingFile && <div className="mb-4 text-blue-600 font-bold flex items-center gap-2"><div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div> Đang xử lý file...</div>}
          <div className="space-y-3">
            {menuItems.map(item => (
              <div key={item.id} className="border border-gray-200 p-3 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-2"><span className="font-medium text-gray-700">{item.label}</span><div className="flex gap-2 w-full md:w-auto"><div className="relative overflow-hidden bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg border flex items-center gap-1 cursor-pointer flex-1 md:flex-none justify-center"><Upload size={16}/> Nhập<input type="file" accept=".xls,.xlsx" onChange={(e) => handleImport(e, item.id)} disabled={loadingFile} className="absolute inset-0 opacity-0 cursor-pointer"/></div><button onClick={() => handleExport(item.id)} disabled={loadingFile} className="bg-green-100 hover:bg-green-200 text-green-800 px-3 py-1.5 rounded-lg border border-green-200 flex items-center gap-1 flex-1 md:flex-none justify-center"><Download size={16}/> Xuất</button></div></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactManager({ type, data, orders, db, storeId, showToast }) {
  const isCus = type === 'customers'; 
  const title = isCus ? "Khách Hàng" : "Nhà Cung Cấp";
  
  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [form, setForm] = useState({});
  const [sortOrder, setSortOrder] = useState('none');
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [detailTarget, setDetailTarget] = useState(null);
  const currentDate = new Date();
  const [filterMonth, setFilterMonth] = useState((currentDate.getMonth() + 1).toString());
  const [filterYear, setFilterYear] = useState(currentDate.getFullYear().toString());

  const handleSave = async (e) => { 
    e.preventDefault(); 
    try { 
      const p = { name: form.name, phone: form.phone || '', address: form.address || '', totalDebt: Number(form.totalDebt || 0) }; 
      if (form.id) { await updateDoc(doc(db, 'stores', storeId, type, form.id), p); } 
      else { await addDoc(collection(db, 'stores', storeId, type), p); }
      setIsModalOpen(false); showToast("Đã lưu thành công"); 
    } catch (e) { showToast("Lỗi", "error"); } 
  };

  const handleDelete = async (id) => { if (window.confirm("Bạn có chắc chắn muốn xóa?")) { await deleteDoc(doc(db, 'stores', storeId, type, id)); showToast("Đã xóa thành công"); } };
  const handleBatchDelete = async () => { if (selectedIds.length === 0) return; const confirmMsg = "Xác nhận xóa " + selectedIds.length + " mục đã chọn?"; if (window.confirm(confirmMsg)) { let batch = writeBatch(db); selectedIds.forEach(id => { batch.delete(doc(db, 'stores', storeId, type, id)); }); await batch.commit(); setSelectedIds([]); showToast("Đã xóa các mục đã chọn"); } };

  const bannerStats = useMemo(() => {
    const filteredOrders = (orders || []).filter(o => { const d = new Date(o.date); return (filterMonth === 'ALL' || (d.getMonth() + 1).toString() === filterMonth) && d.getFullYear().toString() === filterYear; });
    const totalDebt = data.reduce((s, i) => s + (Number(i.totalDebt) || 0), 0);
    const totalTraded = filteredOrders.reduce((s, o) => s + (Number(o.total) || 0), 0);
    const totalPaid = filteredOrders.filter(o => o.status === 'PAID').reduce((s, o) => s + (Number(o.total) || 0), 0);
    return { totalDebt, totalTraded, totalPaid, balance: totalTraded - totalPaid };
  }, [data, orders, filterMonth, filterYear]);

  const filteredData = useMemo(() => { return data.filter(i => { const matchName = i.name && i.name.toLowerCase().includes(searchTerm.toLowerCase()); const matchPhone = i.phone && i.phone.includes(searchTerm); return matchName || matchPhone; }); }, [data, searchTerm]);
  const sortedData = useMemo(() => { if (sortOrder === 'none') return filteredData; return [...filteredData].sort((a, b) => { return sortOrder === 'asc' ? a.totalDebt - b.totalDebt : b.totalDebt - a.totalDebt; }); }, [filteredData, sortOrder]);

  const detailData = useMemo(() => {
    if (!detailTarget) return { list: [], totalAmount: 0, totalPaid: 0, totalDebtRemain: 0 };
    const matched = (orders || []).filter(o => {
      const matchTarget = isCus ? o.customerId === detailTarget.id : o.supplierId === detailTarget.id;
      const d = new Date(o.date);
      const matchTime = (filterMonth === 'ALL' || (d.getMonth() + 1).toString() === filterMonth) && d.getFullYear().toString() === filterYear;
      return matchTarget && matchTime;
    }).sort((a,b) => new Date(b.date) - new Date(a.date));

    let totalAmount = matched.reduce((s, o) => s + (Number(o.total) || 0), 0);
    let totalPaid = matched.filter(o => o.status === 'PAID').reduce((s, o) => s + (Number(o.total) || 0), 0);
    let totalDebtRemain = matched.filter(o => o.status === 'DEBT').reduce((s, o) => s + (Number(o.total) || 0), 0);

    return { list: matched, totalAmount, totalPaid, totalDebtRemain };
  }, [detailTarget, orders, filterMonth, filterYear, isCus]);

  const searchPlaceholder = "Tìm kiếm trực tiếp " + title.toLowerCase() + "...";
  const modalTargetTitle = "Chi tiết mua/bán của: " + (detailTarget?.name || '');
  const formModalTitle = form.id ? "Cập nhật " + title : "Thêm " + title;

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 bg-gray-50 overflow-hidden h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <h2 className="text-2xl font-bold text-gray-800">Quản lý {title}</h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64"><Search size={16} className="absolute left-3 top-3 text-gray-400"/><input placeholder={searchPlaceholder} value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-2 border rounded-lg bg-white outline-none text-sm"/></div>
          <button onClick={() => { setForm({}); setIsModalOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex gap-2 shrink-0"><Plus size={18}/> Thêm</button>
        </div>
      </div>
      <div className="bg-white p-4 rounded-2xl border shadow-sm mb-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1 w-full">
          <div className="bg-blue-50 p-3 rounded-xl border border-blue-100"><p className="text-xs text-blue-600 font-bold uppercase">Tổng Nợ</p><p className="text-lg font-bold text-blue-800">{formatCurrency(bannerStats.totalDebt)}</p></div>
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-200"><p className="text-xs text-gray-500 font-bold uppercase">Tổng Giao Dịch</p><p className="text-lg font-bold text-gray-800">{formatCurrency(bannerStats.totalTraded)}</p></div>
          <div className="bg-green-50 p-3 rounded-xl border border-green-100"><p className="text-xs text-green-600 font-bold uppercase">Đã Thanh Toán</p><p className="text-lg font-bold text-green-700">{formatCurrency(bannerStats.totalPaid)}</p></div>
          <div className="bg-orange-50 p-3 rounded-xl border border-orange-100"><p className="text-xs text-orange-600 font-bold uppercase">Số Dư Còn Lại</p><p className="text-lg font-bold text-orange-700">{formatCurrency(bannerStats.balance)}</p></div>
        </div>
        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border shrink-0">
          <select value={filterMonth} onChange={e=>setFilterMonth(e.target.value)} className="bg-transparent text-sm font-medium outline-none"><option value="ALL">Cả năm</option>{Array.from({length: 12}, (_, i) => (<option key={i+1} value={i+1}>Tháng {i+1}</option>))}</select>
          <div className="w-px h-4 bg-gray-300"></div>
          <select value={filterYear} onChange={e=>setFilterYear(e.target.value)} className="bg-transparent text-sm font-medium outline-none">{Array.from({length: 5}, (_, i) => new Date().getFullYear() - i).map(y => (<option key={y} value={y}>Năm {y}</option>))}</select>
        </div>
      </div>
      {selectedIds.length > 0 && (
        <div className="bg-red-50 border border-red-200 p-2.5 rounded-xl mb-3 flex justify-between items-center">
          <span className="text-xs font-bold text-red-700">Đã chọn {selectedIds.length} mục</span>
          <button onClick={handleBatchDelete} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1"><Trash2 size={14}/> Xóa đã chọn</button>
        </div>
      )}
      <div className="flex-1 bg-white rounded-xl border shadow-sm overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 sticky top-0 border-b">
            <tr>
              <th className="p-4 w-10"><input type="checkbox" onChange={() => setSelectedIds(selectedIds.length === data.length ? [] : data.map(i=>i.id))} checked={data.length > 0 && selectedIds.length === data.length} className="w-4 h-4"/></th>
              <th className="p-4 font-bold text-gray-600">Tên {title}</th><th className="p-4 font-bold text-gray-600">SĐT</th>
              <th className="p-4 font-bold text-gray-600 cursor-pointer hover:bg-gray-200 flex items-center gap-1 select-none" onClick={() => setSortOrder(p => p === 'none' ? 'desc' : p === 'desc' ? 'asc' : 'none')}>
                Tổng Nợ {sortOrder !== 'none' && <ArrowUpDown size={14} className={sortOrder==='desc' ? 'text-red-500' : 'text-green-500'} />}
              </th>
              <th className="p-4 font-bold text-gray-600 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map(i => {
              const textDebtClass = i.totalDebt > 0 ? (isCus ? 'text-red-600' : 'text-orange-600') : 'text-gray-400';
              return (
                <tr key={i.id} className="border-b hover:bg-blue-50/50 cursor-pointer" onClick={() => setDetailTarget(i)}>
                  <td className="p-4" onClick={e=>e.stopPropagation()}><input type="checkbox" checked={selectedIds.includes(i.id)} onChange={() => setSelectedIds(prev => prev.includes(i.id) ? prev.filter(x=>x!==i.id) : [...prev, i.id])} className="w-4 h-4"/></td>
                  <td className="p-4 font-medium text-blue-600 underline">{i.name}</td><td className="p-4 text-gray-600">{i.phone}</td><td className={"p-4 font-bold " + textDebtClass}>{formatCurrency(i.totalDebt)}</td>
                  <td className="p-4 text-right flex justify-end gap-1" onClick={e=>e.stopPropagation()}><button onClick={() => setDetailTarget(i)} title="Xem chi tiết giao dịch" className="text-gray-600 bg-gray-100 p-2 rounded-lg hover:bg-gray-200"><Eye size={16}/></button><button onClick={() => {setForm(i);setIsModalOpen(true);}} className="text-blue-600 bg-blue-50 p-2 rounded-lg hover:bg-blue-100"><Edit size={16}/></button><button onClick={() => handleDelete(i.id)} className="text-red-600 bg-red-50 p-2 rounded-lg hover:bg-red-100"><Trash2 size={16}/></button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal isOpen={!!detailTarget} onClose={() => setDetailTarget(null)} title={modalTargetTitle} maxWidth="max-w-4xl">
        {detailTarget && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border">
              <div><p className="text-xs text-gray-500">SĐT:</p><p className="font-bold">{detailTarget.phone || 'Trống'}</p></div>
              <div><p className="text-xs text-gray-500">Tổng Nợ Gốc:</p><p className="font-bold text-red-600">{formatCurrency(detailTarget.totalDebt)}</p></div>
              <div className="flex items-center gap-1 bg-white p-1 rounded border">
                <select value={filterMonth} onChange={e=>setFilterMonth(e.target.value)} className="bg-transparent text-xs outline-none"><option value="ALL">Cả năm</option>{Array.from({length: 12}, (_, i) => <option key={i+1} value={i+1}>Tháng {i+1}</option>)}</select>
                <select value={filterYear} onChange={e=>setFilterYear(e.target.value)} className="bg-transparent text-xs outline-none">{Array.from({length: 5}, (_, i) => new Date().getFullYear() - i).map(y => <option key={y} value={y}>Năm {y}</option>)}</select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-blue-50 p-2.5 rounded-lg border border-blue-100"><p className="text-[10px] text-blue-600 font-bold uppercase">Tổng Giao Dịch</p><p className="text-sm font-bold text-blue-800">{formatCurrency(detailData.totalAmount)}</p></div>
              <div className="bg-green-50 p-2.5 rounded-lg border border-green-100"><p className="text-[10px] text-green-600 font-bold uppercase">Đã Thanh Toán</p><p className="text-sm font-bold text-green-700">{formatCurrency(detailData.totalPaid)}</p></div>
              <div className="bg-orange-50 p-2.5 rounded-lg border border-orange-100"><p className="text-[10px] text-orange-600 font-bold uppercase">Đang Nợ</p><p className="text-sm font-bold text-orange-700">{formatCurrency(detailData.totalDebtRemain)}</p></div>
            </div>
            
            <div>
              <h4 className="font-bold text-sm text-gray-800 mb-2">Chi tiết sản phẩm đã {isCus ? "mua" : "cung cấp"}:</h4>
              <div className="max-h-80 overflow-y-auto border rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-100 sticky top-0 border-b">
                    <tr><th className="p-2.5">Thời gian</th><th className="p-2.5">Mặt hàng & Số lượng</th><th className="p-2.5">Giá trị đơn</th><th className="p-2.5">Trạng thái nợ</th></tr>
                  </thead>
                  <tbody>
                    {detailData.list.map(ord => {
                      const statusClass = ord.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700';
                      const statusText = ord.status === 'PAID' ? 'Đã trả' : 'Đang nợ';
                      return (
                        <tr key={ord.id} className="border-b hover:bg-gray-50">
                          <td className="p-2.5 whitespace-nowrap">{formatDate(ord.date)}</td>
                          <td className="p-2.5">
                            <ul className="list-disc pl-4 space-y-1">
                              {ord.items?.map((it, idx) => {
                                const qty = it.quantity || it.qty || 1;
                                const itemPrice = it.price || it.importCost || 0;
                                return (
                                  <li key={idx} className="font-medium text-gray-700">
                                    <span className="text-blue-600">{it.name}</span> x {qty} 
                                    <span className="text-gray-400 ml-1">({formatCurrency(itemPrice)}/sp)</span>
                                  </li>
                                );
                              })}
                            </ul>
                          </td>
                          <td className="p-2.5 font-bold text-gray-800">{formatCurrency(ord.total)}</td>
                          <td className="p-2.5"><span className={"px-2 py-0.5 rounded text-[10px] font-bold " + statusClass}>{statusText}</span></td>
                        </tr>
                      );
                    })}
                    {detailData.list.length === 0 && (<tr><td colSpan="4" className="p-4 text-center text-gray-400">Không có phát sinh giao dịch</td></tr>)}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={formModalTitle}>
        <form onSubmit={handleSave} className="space-y-4">
          <input required placeholder="Tên *" value={form.name||''} onChange={e=>setForm({...form,name:e.target.value})} className="w-full p-2.5 border rounded-lg outline-none"/>
          <input placeholder="SĐT" value={form.phone||''} onChange={e=>setForm({...form,phone:e.target.value})} className="w-full p-2.5 border rounded-lg outline-none"/>
          <input placeholder="Địa chỉ" value={form.address||''} onChange={e=>setForm({...form,address:e.target.value})} className="w-full p-2.5 border rounded-lg outline-none"/>
          <div><label className="text-xs font-bold text-gray-500">Nợ hiện tại</label><input type="number" placeholder="Nợ hiện tại" value={form.totalDebt||0} onChange={e=>setForm({...form,totalDebt:e.target.value})} className={"w-full p-2.5 border rounded-lg outline-none font-bold " + (isCus ? 'text-red-600' : 'text-orange-600')}/></div>
          <button className="w-full bg-blue-600 text-white font-bold p-3 rounded-lg">Lưu thông tin</button>
        </form>
      </Modal>
    </div>
  );
}

function InventoryView({ products, orders, imports, db, storeId, showToast }) {
  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [form, setForm] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [detailProduct, setDetailProduct] = useState(null);
  const currentDate = new Date();
  const [filterMonth, setFilterMonth] = useState((currentDate.getMonth() + 1).toString());
  const [filterYear, setFilterYear] = useState(currentDate.getFullYear().toString());

  const handleSave = async (e) => { 
    e.preventDefault(); 
    try { 
      const d = { name: form.name, price: Number(form.price), cost: Number(form.cost || 0), stock: Number(form.stock) }; 
      if (form.id) { await updateDoc(doc(db, 'stores', storeId, 'products', form.id), d); } else { await addDoc(collection(db, 'stores', storeId, 'products'), d); }
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

  const filteredProducts = useMemo(() => { return products.filter(p => p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())); }, [products, searchTerm]);

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
          <button onClick={() => {setForm({}); setIsModalOpen(true);}} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shrink-0"><Plus size={18}/> Thêm mới</button>
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
          <thead className="bg-gray-100 sticky top-0 border-b">
            <tr>
              <th className="p-4 w-10"><input type="checkbox" onChange={() => setSelectedIds(selectedIds.length === products.length ? [] : products.map(p=>p.id))} checked={products.length > 0 && selectedIds.length === products.length} className="w-4 h-4"/></th>
              <th className="p-4 font-bold text-gray-600">Sản phẩm</th><th className="p-4 font-bold text-gray-600">Giá vốn</th><th className="p-4 font-bold text-gray-600">Giá bán</th><th className="p-4 font-bold text-gray-600">Tồn</th><th className="p-4 font-bold text-gray-600 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(p => {
              const stockClass = p.stock < 0 ? 'text-red-600' : 'text-gray-800';
              return (
                <tr key={p.id} className="border-b hover:bg-blue-50/50 cursor-pointer" onClick={() => setDetailProduct(p)}>
                  <td className="p-4" onClick={e=>e.stopPropagation()}><input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => setSelectedIds(prev => prev.includes(p.id) ? prev.filter(x=>x!==p.id) : [...prev, p.id])} className="w-4 h-4"/></td>
                  <td className="p-4 font-medium text-blue-600 underline">{p.name}</td><td className="p-4 text-gray-600">{formatCurrency(p.cost)}</td><td className="p-4 font-bold text-blue-600">{formatCurrency(p.price)}</td><td className={"p-4 font-bold " + stockClass}>{p.stock}</td>
                  <td className="p-4 text-right flex justify-end gap-1" onClick={e=>e.stopPropagation()}><button onClick={() => setDetailProduct(p)} title="Xem chi tiết nhập/bán" className="text-gray-600 bg-gray-100 p-2 rounded-lg hover:bg-gray-200"><Eye size={16}/></button><button onClick={() => {setForm(p); setIsModalOpen(true);}} className="text-blue-600 bg-blue-50 p-2 rounded-lg hover:bg-blue-100"><Edit size={16}/></button><button onClick={() => handleDelete(p.id)} className="text-red-600 bg-red-50 p-2 rounded-lg hover:bg-red-100"><Trash2 size={16}/></button></td>
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
                <select value={filterYear} onChange={e=>setFilterYear(e.target.value)} className="bg-transparent text-xs outline-none">{Array.from({length: 5}, (_, i) => new Date().getFullYear() - i).map(y => <option key={y} value={y}>Năm {y}</option>)}</select>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-blue-50 p-2 rounded-lg border border-blue-100"><p className="text-[10px] text-blue-600 font-bold uppercase">Tổng Bán</p><p className="text-xs font-bold text-blue-800">{formatCurrency(productHistory.totalSoldAmount)}</p></div>
              <div className="bg-green-50 p-2 rounded-lg border border-green-100"><p className="text-[10px] text-green-600 font-bold uppercase">Đã Thanh Toán</p><p className="text-xs font-bold text-green-700">{formatCurrency(productHistory.totalPaid)}</p></div>
              <div className="bg-orange-50 p-2 rounded-lg border border-orange-100"><p className="text-[10px] text-orange-600 font-bold uppercase">Đang Nợ</p><p className="text-xs font-bold text-orange-700">{formatCurrency(productHistory.totalDebtRemain)}</p></div>
              <div className="bg-purple-50 p-2 rounded-lg border border-purple-100"><p className="text-[10px] text-purple-600 font-bold uppercase">Tổng Nhập</p><p className="text-xs font-bold text-purple-700">{formatCurrency(productHistory.totalImportAmount)}</p></div>
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Thông tin Hàng hóa">
        <form onSubmit={handleSave} className="space-y-4">
          <input required placeholder="Tên sản phẩm *" value={form.name||''} onChange={e=>setForm({...form,name:e.target.value})} className="w-full p-2.5 border rounded-lg outline-none"/>
          <div className="grid grid-cols-2 gap-4">
            <input required type="number" placeholder="Giá vốn *" value={form.cost||''} onChange={e=>setForm({...form,cost:e.target.value})} className="p-2.5 border rounded-lg outline-none"/>
            <input required type="number" placeholder="Giá bán *" value={form.price||''} onChange={e=>setForm({...form,price:e.target.value})} className="p-2.5 border rounded-lg outline-none"/>
          </div>
          <input required type="number" placeholder="Tồn kho *" value={form.stock||''} onChange={e=>setForm({...form,stock:e.target.value})} className="w-full p-2.5 border rounded-lg outline-none"/>
          <button className="w-full bg-blue-600 text-white font-bold p-3 rounded-lg">Lưu lại</button>
        </form>
      </Modal>
    </div>
  );
}

function ExpenseView({ expenses, db, storeId, showToast }) {
  const [form, setForm] = useState({ amount: '', note: '' });
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [detailExpense, setDetailExpense] = useState(null);
  
  const currentDate = new Date();
  const [filterMonth, setFilterMonth] = useState((currentDate.getMonth() + 1).toString());
  const [filterYear, setFilterYear] = useState(currentDate.getFullYear().toString());

  const handleSave = async (e) => { 
    e.preventDefault(); 
    await addDoc(collection(db, 'stores', storeId, 'expenses'), { amount: Number(form.amount), note: form.note, date: new Date().toISOString() }); 
    setForm({ amount: '', note: '' }); showToast("Đã thêm chi phí"); 
  };

  const handleDelete = async (id) => { if (window.confirm("Xác nhận xóa chi phí này?")) { await deleteDoc(doc(db, 'stores', storeId, 'expenses', id)); showToast("Đã xóa chi phí"); } };
  const handleBatchDelete = async () => { if (selectedIds.length === 0) return; const confirmMsg = "Xác nhận xóa " + selectedIds.length + " mục đã chọn?"; if (window.confirm(confirmMsg)) { let batch = writeBatch(db); selectedIds.forEach(id => { batch.delete(doc(db, 'stores', storeId, 'expenses', id)); }); await batch.commit(); setSelectedIds([]); showToast("Đã xóa các chi phí đã chọn"); } };

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const d = new Date(e.date);
      const matchTime = (filterMonth === 'ALL' || (d.getMonth() + 1).toString() === filterMonth) && d.getFullYear().toString() === filterYear;
      const matchSearch = e.note && e.note.toLowerCase().includes(searchTerm.toLowerCase());
      return matchTime && matchSearch;
    }).sort((a,b) => new Date(b.date) - new Date(a.date));
  }, [expenses, filterMonth, filterYear, searchTerm]);

  const totalExpense = useMemo(() => { return filteredExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0); }, [filteredExpenses]);

  return (
    <div className="flex-1 p-4 md:p-6 bg-gray-50 overflow-auto h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <h2 className="text-2xl font-bold text-gray-800">Quản lý Chi phí</h2>
        <div className="relative w-full sm:w-64"><Search size={16} className="absolute left-3 top-3 text-gray-400"/><input placeholder="Tìm kiếm nội dung chi..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-2 border rounded-lg bg-white outline-none text-sm"/></div>
      </div>
      <div className="bg-white p-4 rounded-2xl border shadow-sm mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div><p className="text-xs text-orange-600 font-bold uppercase">Tổng Chi Phí Kỳ Này</p><p className="text-2xl font-bold text-orange-700">{formatCurrency(totalExpense)}</p></div>
        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border">
          <select value={filterMonth} onChange={e=>setFilterMonth(e.target.value)} className="bg-transparent text-sm font-medium outline-none"><option value="ALL">Cả năm</option>{Array.from({length: 12}, (_, i) => <option key={i+1} value={i+1}>Tháng {i+1}</option>)}</select>
          <div className="w-px h-4 bg-gray-300"></div>
          <select value={filterYear} onChange={e=>setFilterYear(e.target.value)} className="bg-transparent text-sm font-medium outline-none">{Array.from({length: 5}, (_, i) => new Date().getFullYear() - i).map(y => <option key={y} value={y}>Năm {y}</option>)}</select>
        </div>
      </div>
      <form onSubmit={handleSave} className="bg-white p-4 rounded-xl border shadow-sm mb-4 flex flex-col md:flex-row gap-4 shrink-0">
        <input required type="number" placeholder="Số tiền chi *" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} className="p-2.5 border rounded-lg outline-none flex-1"/>
        <input required placeholder="Nội dung chi (VD: Trả tiền điện) *" value={form.note} onChange={e=>setForm({...form,note:e.target.value})} className="p-2.5 border rounded-lg outline-none flex-1 md:flex-[2]"/>
        <button className="bg-orange-600 text-white px-8 rounded-lg font-bold py-2.5">Ghi Nhận</button>
      </form>
      {selectedIds.length > 0 && (
        <div className="bg-red-50 border border-red-200 p-2.5 rounded-xl mb-3 flex justify-between items-center">
          <span className="text-xs font-bold text-red-700">Đã chọn {selectedIds.length} mục</span>
          <button onClick={handleBatchDelete} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1"><Trash2 size={14}/> Xóa đã chọn</button>
        </div>
      )}
      <div className="bg-white rounded-xl border shadow-sm flex-1 overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 sticky top-0 border-b">
            <tr>
              <th className="p-4 w-10"><input type="checkbox" onChange={() => setSelectedIds(selectedIds.length === filteredExpenses.length ? [] : filteredExpenses.map(e=>e.id))} checked={filteredExpenses.length > 0 && selectedIds.length === filteredExpenses.length} className="w-4 h-4"/></th>
              <th className="p-4 font-bold text-gray-600">Thời gian</th><th className="p-4 font-bold text-gray-600">Nội dung</th><th className="p-4 font-bold text-gray-600">Số tiền</th><th className="p-4 font-bold text-gray-600 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.map(e => (
              <tr key={e.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => setDetailExpense(e)}>
                <td className="p-4" onClick={evt=>evt.stopPropagation()}><input type="checkbox" checked={selectedIds.includes(e.id)} onChange={() => setSelectedIds(prev => prev.includes(e.id) ? prev.filter(x=>x!==e.id) : [...prev, e.id])} className="w-4 h-4"/></td>
                <td className="p-4 text-gray-500">{formatDate(e.date)}</td><td className="p-4 font-medium text-blue-600 underline">{e.note}</td><td className="p-4 font-bold text-orange-600">{formatCurrency(e.amount)}</td>
                <td className="p-4 text-right" onClick={evt=>evt.stopPropagation()}><button onClick={() => handleDelete(e.id)} className="text-red-500 bg-red-50 p-2 rounded-lg hover:bg-red-100"><Trash2 size={16}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={!!detailExpense} onClose={() => setDetailExpense(null)} title="Chi tiết Khoản Chi">
        {detailExpense && (
          <div className="space-y-4">
            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 text-center"><p className="text-xs text-orange-600 font-bold uppercase mb-1">Số tiền chi</p><p className="text-2xl font-bold text-orange-700">{formatCurrency(detailExpense.amount)}</p></div>
            <div className="space-y-2 text-sm"><p><strong className="text-gray-500">Nội dung:</strong> {detailExpense.note}</p><p><strong className="text-gray-500">Thời gian ghi nhận:</strong> {formatDate(detailExpense.date)}</p></div>
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
  const [printInvoice, setPrintInvoice] = useState(true);
  const [showAddCusModal, setShowAddCusModal] = useState(false);
  const [newCusForm, setNewCusForm] = useState({ name: '', phone: '', address: '' });

  const filteredProducts = useMemo(() => { return products.filter(p => p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())); }, [products, searchTerm]);

  const addToCart = (product) => { setCart(prev => { const ex = prev.find(i => i.id === product.id); if (ex) return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i); return [...prev, { ...product, quantity: 1, price: product.price }]; }); };
  const updateQty = (id, delta) => setCart(prev => prev.map(i => { if (i.id === id) { const nq = i.quantity + delta; if (nq > 0) return { ...i, quantity: nq }; } return i; }));
  const updatePrice = (id, newPrice) => setCart(prev => prev.map(i => i.id === id ? { ...i, price: Number(newPrice) || 0 } : i));
  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const handleAddCustomerQuick = async (e) => {
    e.preventDefault();
    try { const docRef = await addDoc(collection(db, 'stores', storeId, 'customers'), { name: newCusForm.name, phone: newCusForm.phone || '', address: newCusForm.address || '', totalDebt: 0 }); setCustomerId(docRef.id); setShowAddCusModal(false); setNewCusForm({ name: '', phone: '', address: '' }); showToast("Đã thêm và chọn khách hàng mới!"); } 
    catch (err) { showToast("Lỗi thêm khách hàng", "error"); }
  };

  const handleCheckout = async () => {
    if (cart.length === 0 || (isDebt && !customerId)) return;
    try {
      const c = customers.find(cust => cust.id === customerId);
      const orderData = { customerId: customerId || null, customerName: c ? c.name : 'Khách lẻ', sellerUid: user.uid, note: orderNote, items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, cost: i.cost || 0, quantity: i.quantity })), total: cartTotal, totalCost: cart.reduce((s, item) => s + ((item.cost || 0) * item.quantity), 0), status: isDebt ? 'DEBT' : 'PAID', date: new Date().toISOString() };
      const orderRef = await addDoc(collection(db, 'stores', storeId, 'orders'), orderData);
      
      let batch = writeBatch(db);
      cart.forEach(item => { const p = products.find(prod => prod.id === item.id); if (p) { batch.update(doc(db, 'stores', storeId, 'products', p.id), { stock: p.stock - item.quantity }); } });
      if (isDebt && c) { batch.update(doc(db, 'stores', storeId, 'customers', customerId), { totalDebt: (c.totalDebt || 0) + cartTotal }); }
      await batch.commit();

      const newOrder = { id: orderRef.id, ...orderData, phone: c?.phone || '' };
      setCart([]); setCustomerId(''); setIsDebt(false); setOrderNote(''); showToast("Thanh toán thành công!");
      if (printInvoice) { setCompletedOrder(newOrder); setShowModal(true); }
    } catch (e) { showToast("Lỗi thanh toán", "error"); }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row bg-gray-50 h-full overflow-hidden">
      <div className="flex-1 p-4 md:p-6 overflow-y-auto flex flex-col">
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
      
      <div className="w-full lg:w-[420px] bg-white border-l shadow-lg shrink-0 flex flex-col z-20 h-[65vh] lg:h-auto">
        <div className="p-4 border-b bg-blue-50/50"><h2 className="font-bold flex items-center gap-2"><ShoppingCart size={20} className="text-blue-600"/> Giỏ hàng</h2></div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.map(item => (
            <div key={item.id} className="bg-white p-3 border rounded-xl shadow-sm space-y-2">
              <div className="flex justify-between items-start"><h4 className="font-semibold text-sm text-gray-800 truncate">{item.name}</h4><button onClick={() => setCart(c => c.filter(i => i.id !== item.id))} className="text-red-400"><X size={16}/></button></div>
              <div className="flex justify-between items-center gap-2">
                <div><label className="text-[10px] text-gray-400 uppercase font-bold">Giá bán (Có thể sửa)</label><input type="number" value={item.price} onChange={e => updatePrice(item.id, e.target.value)} className="w-28 p-1.5 border rounded text-sm font-bold text-blue-600 outline-none"/></div>
                <div className="flex bg-gray-50 rounded p-1 items-center"><button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 border bg-white rounded shadow-sm text-gray-600">-</button><span className="w-6 text-center text-sm font-medium">{item.quantity}</span><button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 border bg-white rounded shadow-sm text-gray-600">+</button></div>
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
          <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer select-none pt-1"><input type="checkbox" checked={printInvoice} onChange={e => setPrintInvoice(e.target.checked)} className="w-4 h-4 text-blue-600 rounded"/> In phiếu mua hàng sau khi thanh toán</label>
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

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Hóa đơn" maxWidth="max-w-md" hideHeaderInPrint={true}>
        {completedOrder && (
          <div className="p-6 bg-white print-container">
            <div className="text-center mb-6 border-b pb-4">
              {storeConfig?.logo && (<img src={storeConfig.logo} alt="Logo" className="max-h-16 mx-auto mb-2 object-contain grayscale print:grayscale-0" />)}
              <h2 className="text-xl font-bold">{storeConfig?.name || 'SmartPOS Pro'}</h2>
              <p className="text-sm text-gray-600">ĐC: {storeConfig?.address || '...'}</p><p className="text-sm text-gray-600">SĐT: {storeConfig?.phone || '...'}</p>
              <h1 className="text-xl font-bold mt-4 uppercase">HÓA ĐƠN BÁN HÀNG</h1>
              <p className="text-xs">Mã: #{completedOrder.id.slice(0,6).toUpperCase()} | Ngày: {formatDate(completedOrder.date)}</p>
            </div>
            <div className="mb-4 text-sm text-gray-800"><p>Khách hàng: {completedOrder.customerName}</p>{completedOrder.phone && <p>SĐT: {completedOrder.phone}</p>}</div>
            <table className="w-full text-sm mb-6"><thead className="border-b-2 border-gray-800"><tr><th className="py-2 text-left">Sản phẩm</th><th className="py-2">SL</th><th className="py-2 text-right">Thành tiền</th></tr></thead>
              <tbody>{completedOrder.items.map((i, x) => (<tr key={x} className="border-b"><td className="py-2">{i.name}</td><td className="py-2 text-center">{i.quantity}</td><td className="py-2 text-right font-medium">{formatCurrency(i.price * i.quantity)}</td></tr>))}</tbody>
              <tfoot className="border-t-2 border-gray-800 font-bold"><tr><td colSpan="2" className="py-3 text-right">TỔNG CỘNG:</td><td className="py-3 text-right text-lg">{formatCurrency(completedOrder.total)}</td></tr></tfoot>
            </table>
            <div className="no-print flex justify-end"><button onClick={() => window.print()} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Printer size={18}/> In Phiếu</button></div>
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
      <div className="flex-1 p-4 md:p-6 overflow-y-auto flex flex-col">
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
      
      <div className="w-full lg:w-[420px] bg-white border-l shadow-lg shrink-0 z-20 flex flex-col h-[65vh] lg:h-auto">
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
