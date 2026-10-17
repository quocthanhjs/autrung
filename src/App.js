import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, ShoppingCart, Package, Users, Truck, Plus, 
  Edit, Trash2, Check, X, ShoppingBag, TrendingUp, AlertCircle, 
  ArrowDownToLine, DollarSign, CheckCircle2, Printer, Receipt, 
  CreditCard, LogOut, ShieldAlert, Database, UserCog, Search, Eye
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, onSnapshot, collection, writeBatch, query, where } from 'firebase/firestore';

// --- CONFIG FIREBASE ---
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

// --- UTILS ---
const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
const formatDate = (iso) => new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso));

// --- COMPONENTS CHUNG ---
const Modal = ({ isOpen, onClose, title, children, maxWidth = "max-w-md", hideHeaderInPrint = false }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm print:absolute print:inset-0 print:bg-white print:p-0 print:items-start print:justify-center">
      <div className={`bg-white rounded-xl shadow-2xl w-full ${maxWidth} overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:overflow-visible print:shadow-none print:w-full print:max-w-none print:m-0`}>
        {!hideHeaderInPrint && (
          <div className="flex justify-between items-center p-4 border-b shrink-0 no-print">
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
          </div>
        )}
        <div className="p-4 overflow-y-auto print:p-0 print:overflow-visible">{children}</div>
      </div>
    </div>
  );
};

function StatCard({ icon, title, value, color, highlight }) {
  return (
    <div className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between h-full bg-white ${highlight ? 'ring-2 ring-green-500' : 'border-gray-200'}`}>
      <div className="flex items-center gap-3 mb-4"><div className={`p-3 rounded-xl flex items-center justify-center ${color}`}>{icon}</div><h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">{title}</h3></div>
      <p className="text-2xl font-black text-gray-800">{value}</p>
    </div>
  );
}

// --- GIAO DIỆN IN HÓA ĐƠN CHUNG (Dùng cho POS & Lịch sử) ---
function OrderPrintModal({ order, storeConfig, onClose }) {
  const [printType, setPrintType] = useState(storeConfig?.printDefaultSize || 'a4');
  const [printOptions, setPrintOptions] = useState({ showLogo: true, showNote: true, showWarranty: true });

  if (!order) return null;

  return (
    <Modal isOpen={true} onClose={onClose} hideHeaderInPrint={true} maxWidth="max-w-3xl">
      <div className="bg-blue-50 border-b border-blue-100 p-4 shrink-0 no-print space-y-3">
        <div className="flex justify-between items-center"><span className="font-bold text-blue-800">Tùy chọn In / Xuất PDF Hóa Đơn</span><button onClick={onClose} className="text-gray-500 font-bold hover:text-red-500">X Đóng</button></div>
        <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
          <div className="flex items-center gap-2"><span>Khổ giấy:</span><select value={printType} onChange={e=>setPrintType(e.target.value)} className="p-1.5 border rounded bg-white outline-none"><option value="bill">Máy in nhiệt (K80)</option><option value="a4">Giấy A4</option><option value="a5">Giấy A5</option></select></div>
          <div className="flex items-center gap-3 bg-white p-1.5 rounded border">
            <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={printOptions.showLogo} onChange={e=>setPrintOptions({...printOptions, showLogo: e.target.checked})} /> Logo</label>
            <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={printOptions.showNote} onChange={e=>setPrintOptions({...printOptions, showNote: e.target.checked})} /> Ghi chú</label>
            <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={printOptions.showWarranty} onChange={e=>setPrintOptions({...printOptions, showWarranty: e.target.checked})} /> Bảo hành</label>
          </div>
          <button onClick={() => window.print()} className="ml-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold shadow flex items-center gap-2"><Printer size={18}/> Mở hộp thoại In / Lưu PDF</button>
        </div>
        <p className="text-xs text-red-600 font-bold bg-red-50 p-2 rounded border border-red-100">
          💡 Mẹo xử lý lỗi trắng trang: Trong hộp thoại in của trình duyệt (Chrome/Edge), hãy chọn "Save as PDF" (Lưu dưới dạng PDF). Hoặc bấm vào "More settings" (Cài đặt thêm) và tích chọn "Print as image" (In dưới dạng hình ảnh).
        </p>
      </div>

      <div className="p-6 bg-white print-container font-sans print:w-full print:m-0 text-gray-900">
        {printType === 'bill' ? (
          <div className="max-w-[80mm] mx-auto print:w-[80mm]">
            <div className="text-center mb-4 border-b-2 border-gray-800 pb-3">
              {printOptions.showLogo && storeConfig?.logo && (<img src={storeConfig.logo} alt="Logo" className="max-h-16 mx-auto mb-1 object-contain grayscale print:grayscale-0" />)}
              <h2 className="text-base font-bold uppercase">{storeConfig?.name || 'SmartPOS Pro'}</h2>
              <p className="text-xs">ĐC: {storeConfig?.address || '...'}</p>
              <p className="text-xs">SĐT: {storeConfig?.phone || '...'}</p>
              <h1 className="text-sm font-bold mt-2 uppercase tracking-wide">HÓA ĐƠN BÁN HÀNG</h1>
              <p className="text-[10px] text-gray-500">Mã: #{order.id} | Ngày: {formatDate(order.date)}</p>
            </div>
            <div className="mb-3 text-xs"><p><strong>Khách hàng:</strong> {order.customerName}</p></div>
            <table className="w-full text-xs mb-4">
              <thead className="border-b border-gray-800"><tr><th className="py-1.5 text-left">Sản phẩm</th><th className="py-1.5 text-center">SL</th><th className="py-1.5 text-right">Tiền</th></tr></thead>
              <tbody>
                {order.items.map((i, x) => (
                  <tr key={x} className="border-b border-dashed border-gray-200">
                    <td className="py-2 pr-1">
                      <div className="font-bold">{i.name}</div>
                      {printOptions.showNote && i.note && <div className="text-[10px] italic text-gray-600">Ghi chú: {i.note}</div>}
                      {printOptions.showWarranty && i.warrantyValue && <div className="text-[10px] font-medium">BH: {i.warrantyValue} {i.warrantyUnit}</div>}
                    </td>
                    <td className="py-2 text-center align-top">{i.quantity}</td>
                    <td className="py-2 text-right align-top font-bold">{formatCurrency(i.price * i.quantity)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-gray-800">
                <tr><td colSpan="2" className="py-2 text-right font-bold">TỔNG CỘNG:</td><td className="py-2 text-right font-bold text-sm">{formatCurrency(order.total)}</td></tr>
              </tfoot>
            </table>
            <div className="text-center text-[10px] text-gray-500 mt-6 pt-2 border-t border-dashed"><p>{storeConfig?.printFooterText || 'Cảm ơn quý khách và hẹn gặp lại!'}</p></div>
          </div>
        ) : (
          <div className={printType === 'a4' ? 'max-w-[210mm] mx-auto p-4 print:max-w-[210mm]' : 'max-w-[148mm] mx-auto p-2 print:max-w-[148mm]'}>
            <div className="text-center border-b-2 border-gray-800 pb-4 mb-4">
              {printOptions.showLogo && storeConfig?.logo && (<img src={storeConfig.logo} alt="Logo" className="max-h-20 mx-auto mb-2 object-contain" />)}
              <h2 className="text-xl font-bold uppercase">{storeConfig?.name || 'SmartPOS Pro'}</h2>
              <p className="text-sm">Địa chỉ: {storeConfig?.address || '...'}</p>
              <p className="text-sm">Điện thoại: {storeConfig?.phone || '...'}</p>
              <h1 className="text-2xl font-bold uppercase text-blue-800 tracking-wide mt-4">PHIẾU BÁN HÀNG</h1>
              <p className="text-xs mt-1">Mã HĐ: #{order.id} | Ngày: {formatDate(order.date)}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border text-xs mb-4">
              <div><span className="text-gray-500">Khách hàng:</span> <strong className="text-sm">{order.customerName}</strong></div>
              <div><span className="text-gray-500">Trạng thái:</span> <strong className="text-blue-600">{order.status === 'PAID' ? 'Đã thanh toán' : 'Ghi nợ'}</strong></div>
            </div>
            <table className="w-full text-xs mb-6 border-collapse">
              <thead>
                <tr className="bg-gray-100 border-y-2 border-gray-800">
                  <th className="py-2.5 px-2 text-left">STT</th><th className="py-2.5 px-2 text-left">Tên sản phẩm & Chi tiết</th><th className="py-2.5 px-2 text-center">SL</th><th className="py-2.5 px-2 text-right">Đơn giá</th><th className="py-2.5 px-2 text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((i, x) => (
                  <tr key={x} className="border-b border-gray-200">
                    <td className="py-2.5 px-2 text-center align-top">{x + 1}</td>
                    <td className="py-2.5 px-2 align-top">
                      <div className="font-bold">{i.name}</div>
                      {printOptions.showNote && i.note && <div className="text-[11px] italic text-gray-600 mt-0.5">Ghi chú: {i.note}</div>}
                      {printOptions.showWarranty && i.warrantyValue && <div className="text-[11px] font-medium mt-0.5">Bảo hành: {i.warrantyValue} {i.warrantyUnit}</div>}
                    </td>
                    <td className="py-2.5 px-2 text-center align-top font-bold">{i.quantity}</td>
                    <td className="py-2.5 px-2 text-right align-top">{formatCurrency(i.price)}</td>
                    <td className="py-2.5 px-2 text-right align-top font-bold">{formatCurrency(i.price * i.quantity)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-800 font-bold text-sm bg-gray-50">
                  <td colSpan="4" className="py-3 px-2 text-right">TỔNG CỘNG THANH TOÁN:</td><td className="py-3 px-2 text-right text-blue-600 text-base">{formatCurrency(order.total)}</td>
                </tr>
              </tfoot>
            </table>
            <div className="grid grid-cols-2 gap-8 text-center pt-8 text-xs">
              <div><p className="font-bold">Khách hàng ký nhận</p><p className="text-gray-400 italic mt-1">(Ký, ghi rõ họ tên)</p></div>
              <div><p className="font-bold">Người bán hàng</p><p className="text-gray-400 italic mt-1">(Ký, ghi rõ họ tên)</p></div>
            </div>
            <div className="text-center text-xs text-gray-500 mt-12 italic"><p>{storeConfig?.printFooterText || 'Cảm ơn quý khách và hẹn gặp lại!'}</p></div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// --- MAIN APP COMPONENT ---
export default function EnhancedPOS() {
  const [user, setUser] = useState(null); const [userData, setUserData] = useState({ role: null, name: '', perms: {} });
  const [activeTab, setActiveTab] = useState('pos');
  const [storeConfig, setStoreConfig] = useState({ name: 'SmartPOS Pro', address: '', phone: '', logo: '', printDefaultSize: 'a4', printFooterText: 'Cảm ơn quý khách và hẹn gặp lại!' });
  const [products, setProducts] = useState([]); const [orders, setOrders] = useState([]); const [imports, setImports] = useState([]);
  const [customers, setCustomers] = useState([]); const [suppliers, setSuppliers] = useState([]); const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true); const [toast, setToast] = useState(null);
  const storeId = 'main_store';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDoc = await getDoc(doc(db, 'users_db', currentUser.uid));
        if (userDoc.exists()) { const data = userDoc.data(); setUserData({ role: data.role, name: data.name || data.username, perms: data.permissions || {} }); setActiveTab(data.role === 'admin' ? 'dashboard' : 'pos'); }
      } else { setUser(null); setUserData({ role: null, name: '', perms: {} }); }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubStore = onSnapshot(doc(db, 'stores', storeId), (docSnap) => { if (docSnap.exists()) setStoreConfig(prev => ({ ...prev, ...docSnap.data() })); });
    const fetchCol = (colName, setter) => onSnapshot(collection(db, 'stores', storeId, colName), (snap) => setter(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const u1 = fetchCol('products', setProducts); const u2 = fetchCol('orders', setOrders); const u3 = fetchCol('imports', setImports);
    const u4 = fetchCol('customers', setCustomers); const u5 = fetchCol('suppliers', setSuppliers); const u6 = fetchCol('expenses', setExpenses);
    return () => { unsubStore(); u1(); u2(); u3(); u4(); u5(); u6(); };
  }, [user]);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  if (!user) return <LoginView onLoginSuccess={(u, r, n, p) => { setUser(u); setUserData({ role: r, name: n, perms: p }); setActiveTab(r === 'admin' ? 'dashboard' : 'pos'); }} db={db} auth={auth} />;

  const allTabs = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Báo cáo', permId: 'tong_quan_xem' },
    { id: 'pos', icon: ShoppingCart, label: 'Bán hàng (POS)', permId: 'ALWAYS' },
    { id: 'sales_history', icon: Receipt, label: 'QL Bán Hàng', permId: 'ban_hang' },
    { id: 'imports', icon: ArrowDownToLine, label: 'Nhập hàng', permId: 'mua_nhap_hang' },
    { id: 'products', icon: Package, label: 'Kho hàng', permId: 'hh_danh_sach' },
    { id: 'customers', icon: Users, label: 'Khách hàng', permId: 'kh_danh_sach' },
    { id: 'suppliers', icon: Truck, label: 'Nhà cung cấp', permId: 'mua_ncc' },
    { id: 'expenses', icon: CreditCard, label: 'Chi phí', permId: 'quy_so_quy' },
    { id: 'settings', icon: Database, label: 'Cài đặt', permId: 'ADMIN_ONLY' },
    { id: 'staff', icon: UserCog, label: 'Nhân viên', permId: 'ADMIN_ONLY' },
  ];
  const visibleTabs = allTabs.filter(t => userData.role === 'admin' || t.permId === 'ALWAYS' || userData.perms[t.permId]);

  return (
    <>
      <style>{`@media print { @page { margin: 5mm; } html, body, #root, main { background: white !important; height: auto !important; overflow: visible !important; margin: 0 !important; padding: 0 !important; position: static !important; display: block !important; } .no-print { display: none !important; } }`}</style>
      <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans text-sm md:text-base print:block print:bg-white print:h-auto print:overflow-visible">
        <aside className="w-full md:w-56 bg-white border-r border-gray-200 flex flex-col shadow-sm z-10 shrink-0 no-print print:hidden">
          <div className="p-4 border-b border-gray-100 flex items-center gap-3">
            {storeConfig.logo ? <img src={storeConfig.logo} alt="Logo" className="w-10 h-10 object-contain rounded bg-white p-1 shadow-sm" /> : <div className="bg-blue-600 text-white p-2 rounded-lg"><ShoppingBag size={20} /></div>}
            <h1 className="text-base font-bold tracking-tight text-gray-800 truncate uppercase">{storeConfig.name || 'SmartPOS'}</h1>
          </div>
          <nav className="flex-1 p-2 flex flex-row md:flex-col gap-1 overflow-x-auto scrollbar-hide">
            {visibleTabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all whitespace-nowrap md:whitespace-normal ${activeTab === tab.id ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-50 font-medium'}`}>
                <tab.icon size={18} className={activeTab === tab.id ? "text-blue-600" : "text-gray-400"} />{tab.label}
              </button>
            ))}
          </nav>
          <div className="p-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <div className="flex flex-col min-w-0"><p className="text-xs font-bold text-gray-800 truncate">{userData.name}</p><p className="text-[10px] text-gray-500 uppercase">{userData.role === 'admin' ? 'Quản trị' : 'Nhân viên'}</p></div>
            <button onClick={() => signOut(auth)} className="text-gray-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-50"><LogOut size={16} /></button>
          </div>
        </aside>
        <main className="flex-1 overflow-hidden flex flex-col h-[calc(100vh-70px)] md:h-screen relative no-print print:block print:overflow-visible print:h-auto print:absolute print:inset-0 print:w-full">
          {toast && <div className={`absolute top-4 right-4 z-[200] px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 text-white no-print ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>{toast.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}<span className="font-medium">{toast.msg}</span></div>}
          
          {activeTab === 'dashboard' && <DashboardView orders={orders} expenses={expenses} />}
          {activeTab === 'pos' && <POSView products={products} customers={customers} db={db} storeId={storeId} user={user} storeConfig={storeConfig} showToast={showToast} />}
          {activeTab === 'sales_history' && <SalesHistoryView orders={orders} products={products} db={db} storeId={storeId} storeConfig={storeConfig} showToast={showToast} />}
          {activeTab === 'imports' && <ImportView products={products} suppliers={suppliers} db={db} storeId={storeId} user={user} showToast={showToast} />}
          {activeTab === 'products' && <InventoryView products={products} db={db} storeId={storeId} showToast={showToast} />}
          {activeTab === 'customers' && <ContactManager type="customers" data={customers} db={db} storeId={storeId} showToast={showToast} />}
          {activeTab === 'suppliers' && <ContactManager type="suppliers" data={suppliers} db={db} storeId={storeId} showToast={showToast} />}
          {activeTab === 'expenses' && <ExpenseView expenses={expenses} db={db} storeId={storeId} showToast={showToast} />}
          {activeTab === 'settings' && <SettingsView db={db} storeId={storeId} storeConfig={storeConfig} showToast={showToast} />}
          {activeTab === 'staff' && <StaffManagerView db={db} showToast={showToast} />}
        </main>
      </div>
    </>
  );
}

// ---------------- LOGIN VIEW ----------------
function LoginView({ onLoginSuccess, db, auth }) {
  const [loginInput, setLoginInput] = useState(''); const [password, setPassword] = useState('');
  const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  const handleLogin = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      let loginEmail = loginInput.trim();
      if (!loginEmail.includes('@')) {
        const q = query(collection(db, 'users_db'), where('username', '==', loginEmail));
        const snap = await getDocs(q);
        if (!snap.empty) { loginEmail = snap.docs[0].data().email; } else { throw new Error("Không tìm thấy Tên đăng nhập này!"); }
      }
      const uCred = await signInWithEmailAndPassword(auth, loginEmail, password);
      const uDoc = await getDoc(doc(db, 'users_db', uCred.user.uid));
      let role = 'admin', name = loginInput, perms = {};
      if (uDoc.exists()) { role = uDoc.data().role; name = uDoc.data().name; perms = uDoc.data().permissions || {}; }
      onLoginSuccess(uCred.user, role, name, perms);
    } catch (err) { setError("Tài khoản hoặc mật khẩu không đúng!"); } finally { setLoading(false); }
  };
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm space-y-4">
        <h1 className="text-xl font-bold text-center mb-6">ĐĂNG NHẬP HỆ THỐNG</h1>
        {error && <div className="bg-red-50 text-red-600 p-2 rounded text-sm">{error}</div>}
        <input required placeholder="Tên đăng nhập / Email" value={loginInput} onChange={e=>setLoginInput(e.target.value)} className="w-full p-3 border rounded-lg" />
        <input required type="password" placeholder="Mật khẩu" value={password} onChange={e=>setPassword(e.target.value)} className="w-full p-3 border rounded-lg" />
        <button disabled={loading} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg">{loading ? 'Đang...' : 'Đăng nhập'}</button>
      </form>
    </div>
  );
}

// ---------------- DASHBOARD VIEW ----------------
function DashboardView({ orders, expenses }) {
  const [filterMonth, setFilterMonth] = useState((new Date().getMonth() + 1).toString());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const stats = useMemo(() => {
    const fOrders = orders.filter(o => { const d = new Date(o.date); return (filterMonth === 'ALL' || (d.getMonth() + 1).toString() === filterMonth) && d.getFullYear().toString() === filterYear; });
    const fExpenses = expenses.filter(e => { const d = new Date(e.date); return (filterMonth === 'ALL' || (d.getMonth() + 1).toString() === filterMonth) && d.getFullYear().toString() === filterYear; });
    const totalRev = fOrders.reduce((s, o) => s + o.total, 0);
    const totalCost = fOrders.reduce((s, o) => s + (o.totalCost || 0), 0);
    const totalExp = fExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    return { totalRev, totalCost, totalExp, netProfit: totalRev - totalCost - totalExp };
  }, [orders, expenses, filterMonth, filterYear]);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50/50 space-y-6">
      <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-gray-800">Báo cáo Kinh doanh</h2>
        <div className="flex gap-2 bg-white p-2 rounded-xl border">
          <select value={filterMonth} onChange={e=>setFilterMonth(e.target.value)} className="bg-transparent outline-none"><option value="ALL">Cả năm</option>{[...Array(12)].map((_,i)=><option key={i+1} value={i+1}>Tháng {i+1}</option>)}</select>
          <select value={filterYear} onChange={e=>setFilterYear(e.target.value)} className="bg-transparent outline-none">{[...Array(5)].map((_,i)=><option key={i} value={new Date().getFullYear()-i}>{new Date().getFullYear()-i}</option>)}</select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<TrendingUp />} title="Doanh Thu" value={formatCurrency(stats.totalRev)} color="bg-blue-100 text-blue-600" />
        <StatCard icon={<Package />} title="Giá Vốn" value={formatCurrency(stats.totalCost)} color="bg-gray-200 text-gray-700" />
        <StatCard icon={<CreditCard />} title="Chi Phí" value={formatCurrency(stats.totalExp)} color="bg-orange-100 text-orange-600" />
        <StatCard icon={<DollarSign />} title="Lãi Ròng" value={formatCurrency(stats.netProfit)} color="bg-green-100 text-green-600" highlight={true} />
      </div>
    </div>
  );
}

// ---------------- POS VIEW (BÁN HÀNG HOÀN CHỈNH) ----------------
function POSView({ products, customers, db, storeId, user, storeConfig, showToast }) {
  const [cart, setCart] = useState([]); const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null); const [isProcessing, setIsProcessing] = useState(false);
  const [viewingOrderPrint, setViewingOrderPrint] = useState(null);

  const addToCart = (product) => { 
    setCart(prev => { 
      const ex = prev.find(i => i.id === product.id); 
      if (ex) return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i); 
      return [...prev, { ...product, quantity: 1, cost: product.cost || 0, warrantyValue: '', warrantyUnit: 'tháng', note: '' }]; 
    }); 
  };
  
  const updateCartItem = (id, field, value) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, [field]: (field === 'price' || field === 'quantity') ? Number(value) : value } : i));
  };
  
  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));
  const totalAmount = cart.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);

  const handleCheckout = async (status, shouldPrint) => {
    if (cart.length === 0) return showToast("Giỏ hàng trống", "error");
    setIsProcessing(true);
    try {
      const orderId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const orderData = { id: orderId, date: new Date().toISOString(), items: cart, total: totalAmount, totalCost: cart.reduce((s,i)=>s+(i.cost*i.quantity),0), status: status, customerId: selectedCustomer ? selectedCustomer.id : null, customerName: selectedCustomer ? selectedCustomer.name : 'Khách lẻ', userId: user.uid };
      const batch = writeBatch(db);
      cart.forEach(item => batch.update(doc(db, 'stores', storeId, 'products', item.id), { stock: (item.stock || 0) - item.quantity }));
      batch.set(doc(collection(db, 'stores', storeId, 'orders'), orderId), orderData);
      if (status === 'DEBT' && selectedCustomer) batch.update(doc(db, 'stores', storeId, 'customers', selectedCustomer.id), { totalDebt: (selectedCustomer.totalDebt || 0) + totalAmount });
      await batch.commit();
      
      if (shouldPrint) {
        setViewingOrderPrint(orderData);
      } else {
        showToast("Lưu đơn hàng thành công!");
      }
      setCart([]); setSelectedCustomer(null);
    } catch (error) { showToast("Lỗi thanh toán", "error"); } finally { setIsProcessing(false); }
  };

  const filteredProducts = products.filter(p => p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex flex-col md:flex-row h-full overflow-hidden bg-gray-50">
      <div className="flex-1 flex flex-col p-4 border-r overflow-hidden no-print">
        <input type="text" placeholder="Tìm tên sản phẩm..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-3 mb-4 border rounded-lg outline-none shadow-sm font-medium" />
        <div className="flex-1 overflow-auto grid grid-cols-2 lg:grid-cols-4 gap-4 pb-4">
          {filteredProducts.map(p => (
            <div key={p.id} onClick={() => addToCart(p)} className="bg-white p-3 rounded-xl border shadow-sm cursor-pointer hover:border-blue-500 transition">
              <p className="font-bold text-sm mb-2 h-10 overflow-hidden">{p.name}</p>
              <div className="flex justify-between items-center"><span className="text-blue-600 font-bold">{formatCurrency(p.price)}</span><span className="text-xs bg-gray-100 px-2 rounded">Tồn: {p.stock}</span></div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full md:w-[420px] flex flex-col bg-white border-l shadow-xl no-print">
        <div className="p-3 border-b bg-gray-50">
          <select className="w-full p-2.5 border rounded-lg outline-none text-sm font-medium bg-white" value={selectedCustomer ? selectedCustomer.id : ''} onChange={e => setSelectedCustomer(customers.find(c => c.id === e.target.value) || null)}>
            <option value="">-- Chọn Khách lẻ --</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}
          </select>
        </div>
        
        <div className="flex-1 overflow-auto p-3 space-y-3">
          {cart.map((item) => (
            <div key={item.id} className="border p-3 rounded-lg bg-gray-50 flex flex-col gap-2">
              <div className="flex justify-between items-start"><p className="font-bold text-sm text-gray-800">{item.name}</p><button onClick={() => removeFromCart(item.id)} className="text-red-500 font-bold px-2 py-0.5 bg-red-100 rounded text-xs hover:bg-red-200">Xóa</button></div>
              
              <div className="flex gap-2 items-center">
                <div className="flex flex-col flex-1"><label className="text-[10px] font-bold text-gray-500 uppercase">Giá bán</label><input type="number" value={item.price} onChange={(e) => updateCartItem(item.id, 'price', e.target.value)} className="w-full p-1.5 border rounded text-sm text-blue-600 font-bold outline-none" /></div>
                <div className="flex flex-col w-16"><label className="text-[10px] font-bold text-gray-500 uppercase">SL</label><input type="number" value={item.quantity} onChange={(e) => updateCartItem(item.id, 'quantity', e.target.value)} className="w-full p-1.5 border rounded text-sm outline-none text-center font-bold" /></div>
              </div>

              <div className="flex gap-2 items-center">
                <div className="flex flex-col flex-1"><label className="text-[10px] font-bold text-gray-500 uppercase">Ghi chú / IMEI</label><input type="text" value={item.note||''} onChange={(e) => updateCartItem(item.id, 'note', e.target.value)} className="w-full p-1.5 border rounded text-sm outline-none bg-white" placeholder="Màu, IMEI..." /></div>
                <div className="flex gap-1">
                  <div className="flex flex-col w-14"><label className="text-[10px] font-bold text-gray-500 uppercase">B.Hành</label><input type="number" value={item.warrantyValue||''} onChange={(e) => updateCartItem(item.id, 'warrantyValue', e.target.value)} className="w-full p-1.5 border rounded text-sm outline-none text-center" placeholder="Số..." /></div>
                  <div className="flex flex-col w-20"><label className="text-[10px] font-bold text-gray-500 uppercase">&nbsp;</label><select value={item.warrantyUnit||'tháng'} onChange={(e) => updateCartItem(item.id, 'warrantyUnit', e.target.value)} className="w-full p-1.5 border rounded text-sm outline-none bg-white"><option value="ngày">Ngày</option><option value="tháng">Tháng</option><option value="năm">Năm</option></select></div>
                </div>
              </div>

              <div className="text-right border-t pt-2 mt-1"><span className="text-[10px] text-gray-500 mr-2">Thành tiền:</span><span className="font-black text-blue-800 text-sm">{formatCurrency(item.price * item.quantity)}</span></div>
            </div>
          ))}
          {cart.length === 0 && <div className="text-center text-gray-400 mt-10 p-6 border-2 border-dashed rounded-xl">Chưa có sản phẩm nào trong giỏ</div>}
        </div>
        <div className="p-3 border-t bg-gray-50 space-y-3">
          <div className="flex justify-between items-center bg-white p-3 rounded-lg border"><span className="text-gray-600 font-bold uppercase text-sm">Tổng tiền:</span><span className="text-2xl font-black text-blue-600">{formatCurrency(totalAmount)}</span></div>
          <div className="grid grid-cols-2 gap-2">
            <button disabled={isProcessing || cart.length === 0} onClick={() => handleCheckout('DEBT', false)} className="bg-orange-100 text-orange-700 font-bold py-2.5 rounded-lg text-sm">Ghi Nợ (Không In)</button>
            <button disabled={isProcessing || cart.length === 0} onClick={() => handleCheckout('PAID', false)} className="bg-green-100 text-green-700 font-bold py-2.5 rounded-lg text-sm">Tiền Mặt (Không In)</button>
          </div>
          <button disabled={isProcessing || cart.length === 0} onClick={() => handleCheckout('PAID', true)} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg shadow-md text-sm uppercase">Thanh Toán & In/Xuất PDF</button>
        </div>
      </div>

      <OrderPrintModal order={viewingOrderPrint} storeConfig={storeConfig} onClose={() => setViewingOrderPrint(null)} />
    </div>
  );
}

// ---------------- SALES HISTORY VIEW (QUẢN LÝ BÁN HÀNG CÓ NÚT IN) ----------------
function SalesHistoryView({ orders, products, storeConfig, db, storeId, showToast }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingOrderPrint, setViewingOrderPrint] = useState(null);

  const filteredOrders = useMemo(() => orders.filter(o => (o.customerName||'').toLowerCase().includes(searchTerm.toLowerCase()) || (o.id||'').toLowerCase().includes(searchTerm.toLowerCase())).sort((a,b) => new Date(b.date) - new Date(a.date)), [orders, searchTerm]);
  
  const handleDelete = async (order) => {
    if (window.confirm("Hủy đơn này và hoàn lại kho?")) {
      try {
        let batch = writeBatch(db);
        order.items.forEach(it => { const p = products.find(x => x.id === it.id); if (p) batch.update(doc(db, 'stores', storeId, 'products', p.id), { stock: (p.stock || 0) + it.quantity }); });
        batch.delete(doc(db, 'stores', storeId, 'orders', order.id)); await batch.commit(); showToast("Đã hủy đơn và hoàn kho");
      } catch (e) { showToast("Lỗi xóa đơn", "error"); }
    }
  };

  return (
    <div className="flex-1 p-4 md:p-6 bg-gray-50 flex flex-col overflow-hidden h-full">
      <div className="flex justify-between mb-4"><h2 className="text-2xl font-bold">Quản lý Bán Hàng</h2><input placeholder="Tìm mã đơn hoặc tên khách..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="p-2 border rounded-lg outline-none w-64 text-sm" /></div>
      <div className="flex-1 bg-white border rounded-xl overflow-auto shadow-sm">
        <table className="w-full text-left text-sm"><thead className="bg-gray-100 sticky top-0 border-b"><tr><th className="p-3">Mã Đơn / Ngày</th><th className="p-3">Khách hàng</th><th className="p-3 w-1/3">Chi tiết sản phẩm</th><th className="p-3">Tổng Tiền</th><th className="p-3">Trạng thái</th><th className="p-3 text-right">Thao tác</th></tr></thead><tbody>
          {filteredOrders.map(o => (
            <tr key={o.id} className="border-b hover:bg-gray-50 align-top">
              <td className="p-3 font-bold text-blue-600">#{o.id}<p className="text-xs text-gray-500 font-normal">{formatDate(o.date)}</p></td>
              <td className="p-3">{o.customerName}</td>
              <td className="p-3">
                {o.items?.map((it, idx) => (
                  <div key={idx} className="mb-2 pb-2 border-b border-dashed border-gray-100 last:border-0 last:mb-0 last:pb-0">
                    <span className="font-bold">{it.name}</span> <span className="text-blue-600 text-xs font-bold">(x{it.quantity})</span>
                    {it.note && <div className="text-[11px] text-gray-500 italic mt-0.5">- GC: {it.note}</div>}
                    {it.warrantyValue && <div className="text-[11px] text-gray-500 mt-0.5">- BH: {it.warrantyValue} {it.warrantyUnit}</div>}
                  </div>
                ))}
              </td>
              <td className="p-3 font-bold">{formatCurrency(o.total)}</td>
              <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${o.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{o.status === 'PAID' ? 'Đã thu tiền' : 'Ghi nợ'}</span></td>
              <td className="p-3 text-right">
                <div className="flex justify-end gap-2">
                  <button onClick={() => setViewingOrderPrint(o)} className="text-blue-600 bg-blue-50 p-2 rounded-lg hover:bg-blue-100 flex items-center gap-1 font-bold text-xs"><Printer size={14}/> In lại</button>
                  <button onClick={() => handleDelete(o)} className="text-red-600 bg-red-50 p-2 rounded-lg hover:bg-red-100"><Trash2 size={16}/></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody></table>
      </div>

      <OrderPrintModal order={viewingOrderPrint} storeConfig={storeConfig} onClose={() => setViewingOrderPrint(null)} />
    </div>
  );
}

// ---------------- IMPORT VIEW (NHẬP HÀNG) ----------------
function ImportView({ products, suppliers, db, storeId, user, showToast }) {
  const [cart, setCart] = useState([]); const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState(null); const [isProcessing, setIsProcessing] = useState(false);

  const addToCart = (product) => { setCart(prev => { const ex = prev.find(i => i.id === product.id); if (ex) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i); return [...prev, { ...product, qty: 1, importCost: product.cost || 0 }]; }); };
  const updateCartItem = (id, field, value) => setCart(prev => prev.map(i => i.id === id ? { ...i, [field]: Number(value) } : i));
  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));
  const totalAmount = cart.reduce((sum, item) => sum + ((item.importCost || 0) * (item.qty || 1)), 0);

  const handleImport = async (status) => {
    if (cart.length === 0) return showToast("Giỏ hàng trống", "error");
    setIsProcessing(true);
    try {
      const importId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const importData = { id: importId, date: new Date().toISOString(), items: cart, total: totalAmount, status: status, supplierId: selectedSupplier ? selectedSupplier.id : null, supplierName: selectedSupplier ? selectedSupplier.name : 'NCC Lẻ', userId: user.uid };
      const batch = writeBatch(db);
      cart.forEach(item => batch.update(doc(db, 'stores', storeId, 'products', item.id), { stock: (item.stock || 0) + item.qty, cost: item.importCost }));
      batch.set(doc(collection(db, 'stores', storeId, 'imports'), importId), importData);
      if (status === 'DEBT' && selectedSupplier) batch.update(doc(db, 'stores', storeId, 'suppliers', selectedSupplier.id), { totalDebt: (selectedSupplier.totalDebt || 0) + totalAmount });
      await batch.commit(); showToast("Nhập hàng thành công!"); setCart([]); setSelectedSupplier(null);
    } catch (error) { showToast("Lỗi nhập hàng", "error"); } finally { setIsProcessing(false); }
  };
  const filteredProducts = products.filter(p => p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex flex-col md:flex-row h-full overflow-hidden bg-gray-50">
      <div className="flex-1 flex flex-col p-4 border-r overflow-hidden">
        <input type="text" placeholder="Tìm sản phẩm để nhập..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-3 mb-4 border rounded-lg outline-none shadow-sm font-medium" />
        <div className="flex-1 overflow-auto grid grid-cols-2 lg:grid-cols-4 gap-4 pb-4">
          {filteredProducts.map(p => (
            <div key={p.id} onClick={() => addToCart(p)} className="bg-white p-3 rounded-xl border shadow-sm cursor-pointer hover:border-purple-500 transition">
              <p className="font-bold text-sm mb-2 h-10 overflow-hidden">{p.name}</p>
              <div className="flex justify-between items-center"><span className="text-purple-600 font-bold">{formatCurrency(p.cost)}</span><span className="text-xs bg-gray-100 px-2 rounded">Tồn: {p.stock}</span></div>
            </div>
          ))}
        </div>
      </div>
      <div className="w-full md:w-[400px] flex flex-col bg-white border-l shadow-xl">
        <div className="p-3 border-b bg-gray-50">
          <select className="w-full p-2.5 border rounded-lg outline-none text-sm font-medium bg-white" value={selectedSupplier ? selectedSupplier.id : ''} onChange={e => setSelectedSupplier(suppliers.find(c => c.id === e.target.value) || null)}>
            <option value="">-- Chọn Nhà cung cấp --</option>{suppliers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex-1 overflow-auto p-4 space-y-3">
          {cart.map(item => (
            <div key={item.id} className="border p-3 rounded-lg bg-purple-50 flex flex-col gap-2">
              <div className="flex justify-between"><p className="font-bold text-sm">{item.name}</p><button onClick={() => removeFromCart(item.id)} className="text-red-500 font-bold px-2 rounded text-xs bg-white">Xóa</button></div>
              <div className="flex gap-2">
                <div className="flex-1"><label className="text-[10px] uppercase font-bold text-gray-500">Giá nhập (Cập nhật vốn)</label><input type="number" value={item.importCost} onChange={(e) => updateCartItem(item.id, 'importCost', e.target.value)} className="w-full p-1.5 border rounded text-sm font-bold text-purple-600 outline-none" /></div>
                <div className="w-16"><label className="text-[10px] uppercase font-bold text-gray-500">Số lượng</label><input type="number" value={item.qty} onChange={(e) => updateCartItem(item.id, 'qty', e.target.value)} className="w-full p-1.5 border rounded text-sm text-center font-bold outline-none" /></div>
              </div>
              <div className="text-right text-sm font-black text-purple-800">{formatCurrency((item.importCost||0) * item.qty)}</div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t bg-gray-50 space-y-3">
          <div className="flex justify-between bg-white p-3 rounded-lg border font-bold text-purple-600"><span>Tổng cộng:</span><span className="text-2xl">{formatCurrency(totalAmount)}</span></div>
          <div className="grid grid-cols-2 gap-2">
            <button disabled={isProcessing || cart.length===0} onClick={() => handleImport('DEBT')} className="bg-orange-100 text-orange-700 font-bold py-3 rounded-lg uppercase text-sm">Ghi Nợ NCC</button>
            <button disabled={isProcessing || cart.length===0} onClick={() => handleImport('PAID')} className="bg-purple-600 text-white font-bold py-3 rounded-lg uppercase shadow-md text-sm">Đã Trả Tiền</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------- KHO HÀNG ----------------
function InventoryView({ products, db, storeId, showToast }) {
  const [searchTerm, setSearchTerm] = useState(''); const [isModalOpen, setIsModalOpen] = useState(false); const [form, setForm] = useState({});
  const filteredProducts = products.filter(p => p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const d = { name: form.name, category: form.category || '', price: Number(form.price), cost: Number(form.cost || 0), stock: Number(form.stock), createdAt: new Date().toISOString() };
      if (form.id) await updateDoc(doc(db, 'stores', storeId, 'products', form.id), d); else await addDoc(collection(db, 'stores', storeId, 'products'), d);
      setIsModalOpen(false); showToast("Đã lưu hàng hóa");
    } catch (err) { showToast("Lỗi", "error"); }
  };
  const handleDelete = async (id) => { if (window.confirm("Xóa sản phẩm này?")) { await deleteDoc(doc(db, 'stores', storeId, 'products', id)); showToast("Đã xóa"); } };
  return (
    <div className="flex-1 p-4 md:p-6 bg-gray-50 flex flex-col overflow-hidden h-full">
      <div className="flex justify-between mb-4"><h2 className="text-2xl font-bold">Kho Hàng</h2><div className="flex gap-2"><input placeholder="Tìm sản phẩm..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="p-2 border rounded-lg outline-none text-sm w-64" /><button onClick={() => { setForm({}); setIsModalOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold">+ Thêm</button></div></div>
      <div className="flex-1 bg-white border rounded-xl overflow-auto shadow-sm">
        <table className="w-full text-left text-sm"><thead className="bg-gray-100 sticky top-0 border-b"><tr><th className="p-4">Tên hàng</th><th className="p-4">Nhóm</th><th className="p-4">Giá vốn</th><th className="p-4">Giá bán</th><th className="p-4">Tồn kho</th><th className="p-4 text-right">Thao tác</th></tr></thead><tbody>
          {filteredProducts.map(p => (
            <tr key={p.id} className="border-b hover:bg-gray-50"><td className="p-4 font-bold text-blue-600">{p.name}</td><td className="p-4">{p.category || 'Khác'}</td><td className="p-4">{formatCurrency(p.cost)}</td><td className="p-4 font-bold text-blue-600">{formatCurrency(p.price)}</td><td className="p-4 font-bold">{p.stock}</td><td className="p-4 text-right flex justify-end gap-1"><button onClick={() => { setForm(p); setIsModalOpen(true); }} className="text-blue-600 bg-blue-50 p-2 rounded-lg"><Edit size={16}/></button><button onClick={() => handleDelete(p.id)} className="text-red-600 bg-red-50 p-2 rounded-lg"><Trash2 size={16}/></button></td></tr>
          ))}
        </tbody></table>
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Thông tin Hàng hóa">
        <form onSubmit={handleSave} className="space-y-4">
          <input required placeholder="Tên sản phẩm *" value={form.name||''} onChange={e=>setForm({...form,name:e.target.value})} className="w-full p-2.5 border rounded-lg outline-none"/>
          <input placeholder="Nhóm hàng" value={form.category||''} onChange={e=>setForm({...form,category:e.target.value})} className="w-full p-2.5 border rounded-lg outline-none"/>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-bold text-gray-500 block mb-1">Giá vốn</label><input required type="number" value={form.cost||''} onChange={e=>setForm({...form,cost:e.target.value})} className="w-full p-2.5 border rounded-lg outline-none"/></div>
            <div><label className="text-xs font-bold text-gray-500 block mb-1">Giá bán</label><input required type="number" value={form.price||''} onChange={e=>setForm({...form,price:e.target.value})} className="w-full p-2.5 border rounded-lg outline-none"/></div>
          </div>
          <div><label className="text-xs font-bold text-gray-500 block mb-1">Tồn kho</label><input required type="number" value={form.stock||''} onChange={e=>setForm({...form,stock:e.target.value})} className="w-full p-2.5 border rounded-lg outline-none"/></div>
          <button className="w-full bg-blue-600 text-white font-bold p-3 rounded-lg">Lưu lại</button>
        </form>
      </Modal>
    </div>
  );
}

// ---------------- KHÁCH HÀNG / NCC ----------------
function ContactManager({ type, data, db, storeId, showToast }) {
  const isCus = type === 'customers'; const title = isCus ? "Khách Hàng" : "Nhà Cung Cấp";
  const [searchTerm, setSearchTerm] = useState(''); const [isModalOpen, setIsModalOpen] = useState(false); const [form, setForm] = useState({});
  const filteredData = data.filter(i => (i.name||'').toLowerCase().includes(searchTerm.toLowerCase()) || (i.phone||'').includes(searchTerm));
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const p = { name: form.name, phone: form.phone || '', totalDebt: Number(form.totalDebt || 0), createdAt: new Date().toISOString() };
      if (form.id) await updateDoc(doc(db, 'stores', storeId, type, form.id), p); else await addDoc(collection(db, 'stores', storeId, type), p);
      setIsModalOpen(false); showToast("Đã lưu thành công");
    } catch (err) { showToast("Lỗi", "error"); }
  };
  const handleDelete = async (id) => { if (window.confirm("Xóa liên hệ này?")) { await deleteDoc(doc(db, 'stores', storeId, type, id)); showToast("Đã xóa"); } };
  return (
    <div className="flex-1 p-4 md:p-6 bg-gray-50 flex flex-col overflow-hidden h-full">
      <div className="flex justify-between mb-4"><h2 className="text-2xl font-bold">Quản lý {title}</h2><div className="flex gap-2"><input placeholder="Tìm kiếm..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="p-2 border rounded-lg outline-none text-sm w-64" /><button onClick={() => { setForm({}); setIsModalOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold">+ Thêm</button></div></div>
      <div className="flex-1 bg-white border rounded-xl overflow-auto shadow-sm">
        <table className="w-full text-left text-sm"><thead className="bg-gray-100 sticky top-0 border-b"><tr><th className="p-4">Tên</th><th className="p-4">SĐT</th><th className="p-4">Nợ hiện tại</th><th className="p-4 text-right">Thao tác</th></tr></thead><tbody>
          {filteredData.map(i => (
            <tr key={i.id} className="border-b hover:bg-gray-50"><td className="p-4 font-bold text-blue-600">{i.name}</td><td className="p-4">{i.phone}</td><td className="p-4 font-bold text-red-600">{formatCurrency(i.totalDebt)}</td><td className="p-4 text-right"><button onClick={() => { setForm(i); setIsModalOpen(true); }} className="text-blue-600 bg-blue-50 p-2 rounded-lg mr-2"><Edit size={16}/></button><button onClick={() => handleDelete(i.id)} className="text-red-600 bg-red-50 p-2 rounded-lg"><Trash2 size={16}/></button></td></tr>
          ))}
        </tbody></table>
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={"Thông tin " + title}>
        <form onSubmit={handleSave} className="space-y-4">
          <input required placeholder="Tên *" value={form.name||''} onChange={e=>setForm({...form,name:e.target.value})} className="w-full p-2.5 border rounded-lg outline-none"/>
          <input placeholder="SĐT" value={form.phone||''} onChange={e=>setForm({...form,phone:e.target.value})} className="w-full p-2.5 border rounded-lg outline-none"/>
          <div><label className="text-xs font-bold text-gray-500 block mb-1">Nợ ban đầu</label><input type="number" value={form.totalDebt||0} onChange={e=>setForm({...form,totalDebt:e.target.value})} className="w-full p-2.5 border rounded-lg outline-none"/></div>
          <button className="w-full bg-blue-600 text-white font-bold p-3 rounded-lg">Lưu lại</button>
        </form>
      </Modal>
    </div>
  );
}

// ---------------- CHI PHÍ ----------------
function ExpenseView({ expenses, db, storeId, showToast }) {
  const [form, setForm] = useState({ amount: '', note: '' });
  const handleSave = async (e) => { e.preventDefault(); await addDoc(collection(db, 'stores', storeId, 'expenses'), { amount: Number(form.amount), note: form.note, date: new Date().toISOString() }); setForm({ amount: '', note: '' }); showToast("Đã thêm chi phí"); };
  const handleDelete = async (id) => { if (window.confirm("Xóa chi phí này?")) { await deleteDoc(doc(db, 'stores', storeId, 'expenses', id)); showToast("Đã xóa chi phí"); } };
  return (
    <div className="flex-1 p-4 md:p-6 bg-gray-50 flex flex-col overflow-hidden h-full">
      <h2 className="text-2xl font-bold mb-4">Quản lý Chi phí</h2>
      <form onSubmit={handleSave} className="bg-white p-4 rounded-xl border shadow-sm mb-4 flex gap-4 shrink-0">
        <input required type="number" placeholder="Số tiền chi *" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} className="p-2.5 border rounded-lg outline-none w-1/3"/>
        <input required placeholder="Nội dung chi (VD: Trả tiền điện) *" value={form.note} onChange={e=>setForm({...form,note:e.target.value})} className="p-2.5 border rounded-lg outline-none flex-1"/>
        <button className="bg-orange-600 text-white px-8 rounded-lg font-bold">Ghi Nhận</button>
      </form>
      <div className="flex-1 bg-white border rounded-xl overflow-auto shadow-sm">
        <table className="w-full text-left text-sm"><thead className="bg-gray-100 sticky top-0 border-b"><tr><th className="p-4">Ngày ghi nhận</th><th className="p-4">Nội dung</th><th className="p-4">Số tiền</th><th className="p-4 text-right">Thao tác</th></tr></thead><tbody>
          {expenses.sort((a,b)=>new Date(b.date)-new Date(a.date)).map(e => (
            <tr key={e.id} className="border-b hover:bg-gray-50"><td className="p-4 text-gray-500">{formatDate(e.date)}</td><td className="p-4 font-bold">{e.note}</td><td className="p-4 font-bold text-orange-600">{formatCurrency(e.amount)}</td><td className="p-4 text-right"><button onClick={() => handleDelete(e.id)} className="text-red-600 bg-red-50 p-2 rounded-lg"><Trash2 size={16}/></button></td></tr>
          ))}
        </tbody></table>
      </div>
    </div>
  );
}

// ---------------- CÀI ĐẶT ----------------
function SettingsView({ db, storeId, storeConfig, showToast }) {
  const [form, setForm] = useState(storeConfig);
  const handleLogo = (e) => { const f = e.target.files[0]; if (f) { const r = new FileReader(); r.onloadend = () => setForm({...form, logo: r.result}); r.readAsDataURL(f); } };
  const handleSaveConfig = async (e) => { e.preventDefault(); await setDoc(doc(db, 'stores', storeId), form, { merge: true }); showToast("Đã lưu Cấu hình"); };
  return (
    <div className="flex-1 p-4 md:p-6 bg-gray-50 overflow-auto h-full">
      <h2 className="text-2xl font-bold mb-4">Cài đặt Cửa hàng</h2>
      <div className="bg-white p-6 rounded-xl border shadow-sm max-w-2xl">
        <form onSubmit={handleSaveConfig} className="space-y-4">
          <div className="flex gap-4 items-center">
            {form.logo ? <img src={form.logo} className="w-16 h-16 object-contain border p-1 rounded" alt="Logo" /> : <div className="w-16 h-16 bg-gray-100 border rounded flex items-center justify-center text-xs text-gray-400">Logo</div>}
            <div><input type="file" accept="image/*" onChange={handleLogo} className="text-sm block" /><button type="button" onClick={() => setForm({...form, logo:''})} className="text-red-500 text-xs block mt-1 hover:underline">Xóa logo</button></div>
          </div>
          <div><label className="text-xs font-bold text-gray-500 block mb-1">Tên cửa hàng</label><input required value={form.name||''} onChange={e=>setForm({...form,name:e.target.value})} className="w-full p-2.5 border rounded-lg outline-none"/></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-bold text-gray-500 block mb-1">Địa chỉ</label><input value={form.address||''} onChange={e=>setForm({...form,address:e.target.value})} className="w-full p-2.5 border rounded-lg outline-none"/></div>
            <div><label className="text-xs font-bold text-gray-500 block mb-1">Số điện thoại</label><input value={form.phone||''} onChange={e=>setForm({...form,phone:e.target.value})} className="w-full p-2.5 border rounded-lg outline-none"/></div>
          </div>
          <div><label className="text-xs font-bold text-gray-500 block mb-1">Khổ giấy in mặc định</label><select value={form.printDefaultSize||'a4'} onChange={e=>setForm({...form, printDefaultSize: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none bg-white"><option value="a4">A4</option><option value="a5">A5</option><option value="bill">Máy in Bill (K80)</option></select></div>
          <div><label className="text-xs font-bold text-gray-500 block mb-1">Ghi chú cuối hóa đơn</label><input value={form.printFooterText||''} onChange={e=>setForm({...form,printFooterText:e.target.value})} className="w-full p-2.5 border rounded-lg outline-none"/></div>
          <button className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg mt-4">Lưu Thông Tin Cài Đặt</button>
        </form>
      </div>
    </div>
  );
}

// ---------------- NHÂN VIÊN ----------------
function StaffManagerView({ db, showToast }) {
  const [staffList, setStaffList] = useState([]); const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false); const [form, setForm] = useState({ username: '', email: '', password: '', role: 'staff', name: '' });

  useEffect(() => { const u = onSnapshot(collection(db, 'users_db'), (snap) => setStaffList(snap.docs.map(d => ({ id: d.id, ...d.data() })))); return () => u(); }, [db]);

  const handleSaveStaff = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const { getApp, initializeApp } = await import('firebase/app'); const { getAuth, createUserWithEmailAndPassword } = await import('firebase/auth');
      const mainApp = getApp(); let secondaryApp;
      try { secondaryApp = initializeApp(mainApp.options, "SecondaryApp"); } catch (err) { import('firebase/app').then(m => secondaryApp = m.getApp("SecondaryApp")); }
      const secondaryAuth = getAuth(secondaryApp);
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, form.email, form.password);
      await setDoc(doc(db, 'users_db', userCredential.user.uid), { username: form.username, email: form.email, name: form.name, role: form.role, createdAt: new Date().toISOString() });
      await secondaryAuth.signOut(); setIsModalOpen(false); showToast("Đã thêm nhân viên!"); setForm({ username: '', email: '', password: '', role: 'staff', name: '' });
    } catch (err) { showToast("Lỗi: Email này đã tồn tại!", "error"); } finally { setLoading(false); }
  };

  const handleDeleteStaff = async (id) => { if (window.confirm("Xóa nhân viên này?")) { await deleteDoc(doc(db, 'users_db', id)); showToast("Đã xóa!"); } };
  const handleResetPassword = async (email) => { if (!email) return showToast("Không có email!", "error"); if (window.confirm(`Gửi link reset mật khẩu về: ${email}?`)) { await sendPasswordResetEmail(auth, email); showToast("Đã gửi link vào email!"); } };

  return (
    <div className="p-4 md:p-6 bg-gray-50 flex-1 overflow-auto">
      <div className="flex justify-between mb-4"><h2 className="text-2xl font-bold">Quản trị Nhân viên</h2><button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold">+ Thêm Nhân Viên</button></div>
      <div className="bg-white rounded-xl border shadow-sm overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 border-b"><tr><th className="p-4">Tên hiển thị</th><th className="p-4">Tên đăng nhập / Email</th><th className="p-4">Vai trò</th><th className="p-4 text-right">Thao tác</th></tr></thead>
          <tbody>
            {staffList.map(staff => (
              <tr key={staff.id} className="border-b"><td className="p-4 font-bold">{staff.name}</td><td className="p-4 text-blue-600">{staff.email || staff.username}</td><td className="p-4"><span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">{staff.role}</span></td><td className="p-4 text-right space-x-2"><button onClick={() => handleResetPassword(staff.email)} className="bg-blue-50 text-blue-600 px-3 py-1 rounded font-bold">Khôi phục MK</button>{staff.role !== 'admin' && <button onClick={() => handleDeleteStaff(staff.id)} className="bg-red-50 text-red-600 px-3 py-1 rounded font-bold">Xóa</button>}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Thêm Nhân viên mới">
        <form onSubmit={handleSaveStaff} className="space-y-3">
          <input required placeholder="Tên hiển thị" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none"/>
          <input required placeholder="Tên đăng nhập (viết liền, VD: nhanvien1)" value={form.username} onChange={e=>setForm({...form, username: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none"/>
          <input required type="email" placeholder="Email thực (để lấy lại mật khẩu)" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none"/>
          <input required type="password" placeholder="Mật khẩu (ít nhất 6 ký tự)" value={form.password} onChange={e=>setForm({...form, password: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none"/>
          <select value={form.role} onChange={e=>setForm({...form, role: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none bg-white"><option value="staff">Nhân viên bán hàng</option><option value="admin">Quản trị viên (Toàn quyền)</option></select>
          <div className="flex gap-2 pt-2"><button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-200 text-gray-800 font-bold p-2.5 rounded-lg">Hủy</button><button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white font-bold p-2.5 rounded-lg">{loading ? 'Đang tạo...' : 'Lưu lại'}</button></div>
        </form>
      </Modal>
    </div>
  );
}
