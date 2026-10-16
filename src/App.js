import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, ShoppingCart, Package, Users, Truck, Plus, 
  Edit, Trash2, Check, X, Image as ImageIcon, ShoppingBag, 
  TrendingUp, AlertCircle, ArrowDownToLine, Phone, 
  DollarSign, CheckCircle2, Printer, FileText, CreditCard,
  Lock, LogOut, ShieldAlert, User as UserIcon, Database
} from 'lucide-react';

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, addDoc, updateDoc, deleteDoc, onSnapshot, collection, writeBatch } from 'firebase/firestore';

let app, auth, db, appId;
try {
  const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  appId = typeof __app_id !== 'undefined' ? __app_id : 'default-pos-app';
} catch (error) {
  console.error("Firebase init error:", error);
}

const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
const formatDate = (iso) => new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso));
const getDaysDifference = (isoDate) => {
  const diffTime = Math.abs(new Date() - new Date(isoDate));
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

const Modal = ({ isOpen, onClose, title, children, maxWidth = "max-w-md", hideHeaderInPrint = false }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm print:bg-transparent print:p-0">
      <div className={`bg-white rounded-xl shadow-2xl w-full ${maxWidth} overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:rounded-none print:w-full`}>
        {!hideHeaderInPrint && (
          <div className="flex justify-between items-center p-4 border-b shrink-0 print:hidden">
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
          </div>
        )}
        <div className="p-4 overflow-y-auto print:overflow-visible print:p-0">{children}</div>
      </div>
    </div>
  );
};

function LoginView({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin') {
      onLogin('admin');
    } else if (username === 'nhanvien' && password === '123456') {
      onLogin('seller');
    } else {
      setError('Tài khoản hoặc mật khẩu không đúng!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-blue-100 text-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Đăng nhập Hệ thống</h1>
          <p className="text-gray-500 text-sm mt-2">SmartPOS Pro</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 mb-4 text-sm">
            <ShieldAlert size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tài khoản</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-500" required />
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors mt-2">Đăng nhập</button>
        </form>

        <div className="mt-6 border-t pt-4 text-sm text-gray-500">
          <p>Tài khoản dùng thử:</p>
          <ul className="mt-1 list-disc pl-5">
            <li>Quản lý: <b>admin</b> / pass: <b>admin</b></li>
            <li>Bán hàng: <b>nhanvien</b> / pass: <b>123456</b></li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function EnhancedPOS() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [activeTab, setActiveTab] = useState('pos');
  
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [imports, setImports] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) { console.error("Auth failed:", error); }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchCol = (colName, setter) => onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, colName), 
      (snap) => setter(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
      (err) => console.error(`Error fetching ${colName}:`, err)
    );

    const unsubProducts = fetchCol('products', setProducts);
    const unsubOrders = fetchCol('orders', setOrders);
    const unsubImports = fetchCol('imports', setImports);
    const unsubCustomers = fetchCol('customers', setCustomers);
    const unsubSuppliers = fetchCol('suppliers', setSuppliers);
    const unsubExpenses = fetchCol('expenses', setExpenses);

    setLoading(false);
    return () => { unsubProducts(); unsubOrders(); unsubImports(); unsubCustomers(); unsubSuppliers(); unsubExpenses(); };
  }, [user]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLoginSuccess = (role) => {
    setUserRole(role);
    if (role === 'admin') setActiveTab('dashboard');
    else setActiveTab('pos'); 
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  if (!userRole) return <LoginView onLogin={handleLoginSuccess} />;

  const allTabs = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Báo cáo & Nhắc nợ', roles: ['admin'] },
    { id: 'pos', icon: ShoppingCart, label: 'Bán hàng (POS)', roles: ['admin', 'seller'] },
    { id: 'imports', icon: ArrowDownToLine, label: 'Nhập hàng', roles: ['admin'] },
    { id: 'products', icon: Package, label: 'Kho hàng', roles: ['admin'] },
    { id: 'customers', icon: Users, label: 'Khách hàng', roles: ['admin', 'seller'] },
    { id: 'suppliers', icon: Truck, label: 'Nhà cung cấp', roles: ['admin'] },
    { id: 'expenses', icon: CreditCard, label: 'Chi phí', roles: ['admin'] },
    { id: 'settings', icon: Database, label: 'Cài đặt & Dữ liệu', roles: ['admin'] },
  ];

  const visibleTabs = allTabs.filter(tab => tab.roles.includes(userRole));

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-container, .print-container * { visibility: visible; }
          .print-container { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans text-sm md:text-base print:hidden">
        <aside className="w-full md:w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm z-10 shrink-0">
          <div className="p-5 border-b border-gray-100 flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2 rounded-lg"><ShoppingBag size={24} /></div>
            <div><h1 className="text-xl font-bold tracking-tight text-gray-800">SmartPOS<span className="text-blue-600">Pro</span></h1></div>
          </div>
          
          <nav className="flex-1 p-3 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible scrollbar-hide">
            {visibleTabs.map(tab => (
              <button 
                key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap md:whitespace-normal ${activeTab === tab.id ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium'}`}
              >
                <tab.icon size={20} className={activeTab === tab.id ? "text-blue-600" : "text-gray-400"} />
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                <div className="bg-gray-200 p-1.5 rounded-full"><UserIcon size={16} /></div>
                {userRole === 'admin' ? 'Quản trị viên' : 'Nhân viên bán hàng'}
              </div>
              <button onClick={() => setUserRole(null)} className="text-gray-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-50" title="Đăng xuất"><LogOut size={18} /></button>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-hidden flex flex-col h-[calc(100vh-80px)] md:h-screen relative">
          {toast && (
            <div className={`absolute top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-top-5 text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
              {toast.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
              <span className="font-medium">{toast.msg}</span>
            </div>
          )}

          {activeTab === 'dashboard' && userRole === 'admin' && <DashboardView orders={orders} imports={imports} customers={customers} products={products} expenses={expenses} db={db} appId={appId} user={user} showToast={showToast} />}
          {activeTab === 'pos' && <POSView products={products} customers={customers} db={db} appId={appId} user={user} showToast={showToast} />}
          {activeTab === 'imports' && userRole === 'admin' && <ImportView products={products} suppliers={suppliers} db={db} appId={appId} user={user} showToast={showToast} />}
          {activeTab === 'products' && userRole === 'admin' && <InventoryView products={products} db={db} appId={appId} user={user} showToast={showToast} />}
          {activeTab === 'customers' && <ContactManager type="customers" data={customers} db={db} appId={appId} user={user} showToast={showToast} />}
          {activeTab === 'suppliers' && userRole === 'admin' && <ContactManager type="suppliers" data={suppliers} db={db} appId={appId} user={user} showToast={showToast} />}
          {activeTab === 'expenses' && userRole === 'admin' && <ExpenseView expenses={expenses} db={db} appId={appId} user={user} showToast={showToast} />}
          {activeTab === 'settings' && userRole === 'admin' && <SettingsView db={db} appId={appId} user={user} showToast={showToast} />}
        </main>
      </div>
    </>
  );
}

function SettingsView({ db, appId, user, showToast }) {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleImport = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setImporting(true);
    setProgress(0);
    try {
      const XLSX = await new Promise((resolve, reject) => {
        if (window.XLSX) return resolve(window.XLSX);
        const script = document.createElement('script');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
        script.onload = () => resolve(window.XLSX);
        script.onerror = reject;
        document.body.appendChild(script);
      });

      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const bstr = evt.target.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);
          
          let successCount = 0;
          const batchSize = 400;
          let batch = writeBatch(db);
          let currentBatchCount = 0;
          
          for (let i = 0; i < data.length; i++) {
            const row = data[i];
            let payload = null;
            
            if (type === 'products') {
              if (row['Tên hàng']) {
                payload = {
                  name: String(row['Tên hàng']),
                  price: Number(row['Giá bán']) || 0,
                  cost: Number(row['Giá vốn']) || 0,
                  stock: Number(row['Tồn kho']) || 0,
                  image: ''
                };
              }
            } else if (type === 'customers') {
              if (row['Tên khách hàng']) {
                payload = {
                  name: String(row['Tên khách hàng']),
                  phone: row['Điện thoại'] ? String(row['Điện thoại']).replace('.0', '') : '',
                  address: row['Địa chỉ'] ? String(row['Địa chỉ']) : '',
                  totalDebt: Number(row['Nợ cần thu hiện tại']) || 0
                };
              }
            } else if (type === 'suppliers') {
              if (row['Tên nhà cung cấp']) {
                payload = {
                  name: String(row['Tên nhà cung cấp']),
                  phone: row['Điện thoại'] ? String(row['Điện thoại']).replace('.0', '') : '',
                  address: row['Địa chỉ'] ? String(row['Địa chỉ']) : '',
                  totalDebt: Number(row['Nợ cần trả hiện tại']) || 0
                };
              }
            }

            if (payload) {
              const docRef = doc(collection(db, 'artifacts', appId, 'users', user.uid, type));
              batch.set(docRef, payload);
              currentBatchCount++;
              successCount++;
            }
            
            if (currentBatchCount === batchSize || i === data.length - 1) {
              if (currentBatchCount > 0) {
                await batch.commit();
                batch = writeBatch(db);
                currentBatchCount = 0;
              }
              setProgress(Math.floor(((i + 1) / data.length) * 100));
            }
          }
          
          setProgress(100);
          showToast(`Thành công! Đã thêm ${successCount} dòng.`);
          setImporting(false);
          e.target.value = ''; 
        } catch (err) {
          console.error(err);
          showToast("Lỗi khi ghi dữ liệu.", "error");
          setImporting(false);
        }
      };
      reader.readAsBinaryString(file);
    } catch (err) {
      console.error(err);
      showToast("Lỗi tải bộ đọc Excel", "error");
      setImporting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 p-4 md:p-6 overflow-hidden h-full">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Cài đặt & Dữ liệu</h2>
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm max-w-3xl">
        <h3 className="font-bold text-lg mb-4 text-blue-800">Nhập Cơ Sở Dữ Liệu Hàng Loạt Từ Excel</h3>
        <p className="text-sm text-gray-600 mb-6">Tải lên các file .xlsx để thêm dữ liệu hàng loạt tự động vào hệ thống.</p>

        {importing && (
          <div className="mb-6 p-4 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
            <p className="font-bold mb-2 flex items-center gap-2">
              <span className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></span> 
              Đang đẩy dữ liệu lên hệ thống... {progress}%
            </p>
            <div className="w-full bg-blue-200 rounded-full h-2.5">
              <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{width: `${progress}%`}}></div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="border border-gray-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div><p className="font-semibold text-gray-800">1. Nhập file Khách hàng</p></div>
            <input type="file" accept=".xlsx, .xls" onChange={(e) => handleImport(e, 'customers')} disabled={importing} className="text-sm cursor-pointer" />
          </div>
          <div className="border border-gray-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div><p className="font-semibold text-gray-800">2. Nhập file Nhà cung cấp</p></div>
            <input type="file" accept=".xlsx, .xls" onChange={(e) => handleImport(e, 'suppliers')} disabled={importing} className="text-sm cursor-pointer" />
          </div>
          <div className="border border-gray-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div><p className="font-semibold text-gray-800">3. Nhập file Sản phẩm</p></div>
            <input type="file" accept=".xlsx, .xls" onChange={(e) => handleImport(e, 'products')} disabled={importing} className="text-sm cursor-pointer" />
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardView({ orders, imports, customers, products, expenses, db, appId, user, showToast }) {
  const currentDate = new Date();
  const [filterMonth, setFilterMonth] = useState((currentDate.getMonth() + 1).toString());
  const [filterYear, setFilterYear] = useState(currentDate.getFullYear().toString());

  const stats = useMemo(() => {
    const filteredOrders = orders.filter(o => {
      const d = new Date(o.date);
      return (filterMonth === 'ALL' || (d.getMonth() + 1).toString() === filterMonth) && d.getFullYear().toString() === filterYear;
    });

    const filteredExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return (filterMonth === 'ALL' || (d.getMonth() + 1).toString() === filterMonth) && d.getFullYear().toString() === filterYear;
    });

    const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);
    const totalCOGS = filteredOrders.reduce((sum, o) => sum + (o.totalCost || 0), 0);
    const totalOperatingExpense = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalRevenue - totalCOGS - totalOperatingExpense;
    
    const overdueDebts = orders.filter(o => 
      o.status === 'DEBT' && getDaysDifference(o.date) >= 7
    ).sort((a, b) => new Date(a.date) - new Date(b.date));

    return { totalRevenue, totalCOGS, totalOperatingExpense, netProfit, overdueDebts };
  }, [orders, expenses, products, filterMonth, filterYear]);

  const handleMarkAsPaid = async (order) => {
    if(!user || !order.customerId) return;
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'orders', order.id), { status: 'PAID', paidDate: new Date().toISOString() });
      const customer = customers.find(c => c.id === order.customerId);
      if(customer) {
        await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'customers', customer.id), {
          totalDebt: Math.max(0, (customer.totalDebt || 0) - order.total)
        });
      }
      showToast("Đã thu nợ thành công");
    } catch (err) { showToast("Lỗi khi thu nợ", "error"); }
  };

  const years = Array.from({length: 5}, (_, i) => currentDate.getFullYear() - i);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50/50">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Báo cáo Kinh doanh</h2>
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-200">
          <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="bg-transparent font-medium text-gray-700 outline-none cursor-pointer">
            <option value="ALL">Cả năm</option>
            {Array.from({length: 12}, (_, i) => <option key={i+1} value={i+1}>Tháng {i+1}</option>)}
          </select>
          <div className="w-px h-5 bg-gray-300"></div>
          <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="bg-transparent font-medium text-gray-700 outline-none cursor-pointer">
            {years.map(y => <option key={y} value={y}>Năm {y}</option>)}
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<TrendingUp />} title="Tổng Doanh Thu" value={formatCurrency(stats.totalRevenue)} color="bg-blue-100 text-blue-600" />
        <StatCard icon={<Package />} title="Tổng Giá Vốn" value={formatCurrency(stats.totalCOGS)} color="bg-gray-200 text-gray-700" />
        <StatCard icon={<CreditCard />} title="Tổng Chi Phí" value={formatCurrency(stats.totalOperatingExpense)} color="bg-orange-100 text-orange-600" />
        <StatCard icon={<DollarSign />} title="Lãi Ròng" value={formatCurrency(stats.netProfit)} color={stats.netProfit >= 0 ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"} highlight={true} />
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="text-red-500" />
          <h3 className="text-lg font-bold text-red-600">Cảnh báo: Công nợ chưa thanh toán quá 1 tuần</h3>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-red-200 overflow-hidden">
          {stats.overdueDebts.length === 0 ? (
            <div className="p-8 text-center text-gray-500 flex flex-col items-center">
              <CheckCircle2 size={40} className="text-green-400 mb-2" />
              Không có khoản nợ nào quá hạn 7 ngày.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-red-50 text-red-700">
                  <tr>
                    <th className="p-4 font-semibold">Khách hàng</th>
                    <th className="p-4 font-semibold">Ngày bán</th>
                    <th className="p-4 font-semibold">Ghi chú</th>
                    <th className="p-4 font-semibold">Quá hạn</th>
                    <th className="p-4 font-semibold">Số tiền nợ</th>
                    <th className="p-4 font-semibold text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stats.overdueDebts.map(order => (
                    <tr key={order.id} className="hover:bg-red-50/30">
                      <td className="p-4 font-medium text-gray-800">{order.customerName}</td>
                      <td className="p-4 text-gray-600">{formatDate(order.date)}</td>
                      <td className="p-4 text-gray-500 text-xs max-w-xs truncate">{order.note || '-'}</td>
                      <td className="p-4">
                        <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs font-bold">{getDaysDifference(order.date)} ngày</span>
                      </td>
                      <td className="p-4 font-bold text-gray-900">{formatCurrency(order.total)}</td>
                      <td className="p-4 text-right">
                        <button onClick={() => handleMarkAsPaid(order)} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-sm">Đã thu tiền</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ icon, title, value, color, highlight = false }) => (
  <div className={`bg-white p-5 rounded-2xl shadow-sm border ${highlight ? 'border-green-300 ring-1 ring-green-100' : 'border-gray-200'} flex items-center gap-4`}>
    <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${color}`}>{React.cloneElement(icon, { size: 24 })}</div>
    <div className="min-w-0">
      <p className="text-gray-500 text-sm font-medium mb-1 truncate">{title}</p>
      <p className={`text-xl md:text-2xl font-bold truncate ${highlight ? 'text-green-700' : 'text-gray-900'}`}>{value}</p>
    </div>
  </div>
);

function POSView({ products, customers, db, appId, user, showToast }) {
  const [cart, setCart] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [isDebt, setIsDebt] = useState(false);
  const [orderNote, setOrderNote] = useState('');
  const [completedOrder, setCompletedOrder] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const addToCart = (product) => {
    if (product.stock <= 0) return showToast("Sản phẩm đã hết hàng", "error");
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return existing.quantity >= product.stock ? prev : prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQty = (id, delta) => setCart(prev => prev.map(i => {
    if (i.id === id) {
      const p = products.find(p => p.id === id);
      const nq = i.quantity + delta;
      if (nq > 0 && nq <= (p?.stock || 0)) return { ...i, quantity: nq };
    }
    return i;
  }));

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const handleCheckout = async () => {
    if (!user || cart.length === 0) return;
    if (isDebt && !customerId) return showToast("Vui lòng chọn khách hàng để ghi nợ", "error");
    
    try {
      const c = customers.find(c => c.id === customerId);
      const cName = c ? c.name : 'Khách lẻ';
      const totalCost = cart.reduce((sum, item) => sum + ((item.cost || 0) * item.quantity), 0);

      const orderData = {
        customerId: customerId || null,
        customerName: cName,
        items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, cost: i.cost || 0, quantity: i.quantity })),
        total: cartTotal,
        totalCost: totalCost, 
        status: isDebt ? 'DEBT' : 'PAID',
        note: orderNote,
        date: new Date().toISOString()
      };

      const orderRef = await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'orders'), orderData);
      let batch = writeBatch(db);
      for (const item of cart) {
        const p = products.find(p => p.id === item.id);
        if (p) {
          const pRef = doc(db, 'artifacts', appId, 'users', user.uid, 'products', p.id);
          batch.update(pRef, { stock: Math.max(0, p.stock - item.quantity) });
        }
      }
      if (isDebt && customerId && c) {
        const cRef = doc(db, 'artifacts', appId, 'users', user.uid, 'customers', customerId);
        batch.update(cRef, { totalDebt: (c.totalDebt || 0) + cartTotal });
      }
      await batch.commit();

      setCompletedOrder({ id: orderRef.id, ...orderData, customerPhone: c?.phone || '' });
      setShowInvoiceModal(true);

      setCart([]); setCustomerId(''); setIsDebt(false); setOrderNote('');
      showToast("Thanh toán thành công!");
    } catch (error) {
      console.error(error);
      showToast("Lỗi thanh toán", "error");
    }
  };

  const handlePrint = () => window.print();

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-gray-50 h-full">
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Sản phẩm</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map(p => (
            <div key={p.id} onClick={() => addToCart(p)} className={`bg-white rounded-xl border ${p.stock > 0 ? 'border-gray-200 hover:border-blue-400 cursor-pointer shadow-sm hover:shadow' : 'border-gray-200 opacity-60'} overflow-hidden transition-all flex flex-col`}>
              <div className="aspect-video bg-gray-100 overflow-hidden relative">
                {p.image ? <img src={p.image} className="w-full h-full object-cover" alt={p.name} /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={30} /></div>}
                {p.stock <= 0 && <div className="absolute inset-0 bg-white/60 flex items-center justify-center"><span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">Hết hàng</span></div>}
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-gray-800 line-clamp-2 text-sm">{p.name}</h3>
                <div className="flex justify-between items-end mt-2">
                  <p className="text-blue-600 font-bold">{formatCurrency(p.price)}</p>
                  <p className="text-xs text-gray-500">Kho: {p.stock}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full lg:w-[400px] bg-white border-l border-gray-200 flex flex-col shadow-lg lg:shadow-none h-[60vh] lg:h-auto shrink-0 z-20">
        <div className="p-4 border-b border-gray-100 bg-blue-50/50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><ShoppingCart size={20} className="text-blue-600"/> Giỏ hàng</h2>
          <span className="bg-blue-600 text-white text-xs py-1 px-2.5 rounded-full font-medium">{cart.reduce((s, i) => s + i.quantity, 0)} món</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.map(item => (
            <div key={item.id} className="flex items-center gap-3 bg-white p-2 border border-gray-100 rounded-lg shadow-sm">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm text-gray-800 truncate">{item.name}</h4>
                <p className="text-xs text-blue-600 font-semibold">{formatCurrency(item.price)}</p>
              </div>
              <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
                <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 flex items-center justify-center rounded bg-white border text-gray-600 shadow-sm">-</button>
                <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 flex items-center justify-center rounded bg-white border text-gray-600 shadow-sm">+</button>
              </div>
              <button onClick={() => setCart(c => c.filter(i => i.id !== item.id))} className="text-red-400 p-1"><X size={18} /></button>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-100 space-y-4 bg-gray-50">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Khách hàng</label>
            <select value={customerId} onChange={e => setCustomerId(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:border-blue-500">
              <option value="">-- Khách lẻ (Không lưu nợ) --</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1"><FileText size={14}/> Ghi chú đơn / Bảo hành</label>
            <textarea value={orderNote} onChange={e => setOrderNote(e.target.value)} placeholder="VD: Bảo hành 24 tháng..." className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:border-blue-500 resize-none h-16"></textarea>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setIsDebt(false)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border ${!isDebt ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300'}`}>Tiền mặt</button>
            <button onClick={() => setIsDebt(true)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border ${isDebt ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-300'}`}>Ghi nợ</button>
          </div>
          <div className="flex justify-between items-center pt-2">
            <span className="text-gray-600 font-medium">Tổng tiền:</span>
            <span className="text-2xl font-bold text-blue-600">{formatCurrency(cartTotal)}</span>
          </div>
          <button onClick={handleCheckout} disabled={cart.length === 0 || (isDebt && !customerId)} className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-3 rounded-xl font-bold text-lg transition-colors flex justify-center items-center gap-2 shadow-sm">
            Thanh toán {isDebt ? '(Nợ)' : ''}
          </button>
        </div>
      </div>

      <Modal isOpen={showInvoiceModal} onClose={() => setShowInvoiceModal(false)} title="Hóa đơn & Bảo hành" maxWidth="max-w-2xl" hideHeaderInPrint={true}>
        {completedOrder && (
          <div className="p-6 bg-white print-container">
            <div className="text-center mb-6 border-b pb-4">
              <h1 className="text-2xl font-bold text-gray-900 uppercase">HÓA ĐƠN BÁN HÀNG</h1>
            </div>
            <div className="flex justify-between mb-6 text-sm text-gray-700">
              <div>
                <p><span className="font-semibold">Mã ĐH:</span> #{completedOrder.id.slice(0, 8).toUpperCase()}</p>
                <p><span className="font-semibold">Ngày:</span> {formatDate(completedOrder.date)}</p>
              </div>
              <div className="text-right">
                <p><span className="font-semibold">Khách hàng:</span> {completedOrder.customerName}</p>
              </div>
            </div>
            <table className="w-full mb-6 text-sm">
              <thead className="border-b-2 border-gray-800 text-left">
                <tr>
                  <th className="py-2">Sản phẩm</th>
                  <th className="py-2 text-center">SL</th>
                  <th className="py-2 text-right">Đơn giá</th>
                  <th className="py-2 text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {completedOrder.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-3 font-medium">{item.name}</td>
                    <td className="py-3 text-center">{item.quantity}</td>
                    <td className="py-3 text-right">{formatCurrency(item.price)}</td>
                    <td className="py-3 text-right font-semibold">{formatCurrency(item.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-gray-800">
                <tr>
                  <td colSpan="3" className="py-3 text-right font-bold text-lg">TỔNG CỘNG:</td>
                  <td className="py-3 text-right font-bold text-lg">{formatCurrency(completedOrder.total)}</td>
                </tr>
              </tfoot>
            </table>
            <div className="mt-8 flex justify-end gap-3 no-print">
              <button onClick={() => setShowInvoiceModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Đóng</button>
              <button onClick={handlePrint} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium">
                <Printer size={18} /> In Phiếu
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function ImportView({ products, suppliers, db, appId, user, showToast }) {
  const [cart, setCart] = useState([]);
  const [supplierId, setSupplierId] = useState('');
  const [isDebt, setIsDebt] = useState(false);
  const [importNote, setImportNote] = useState('');
  
  const addToCart = (product) => {
    setCart(prev => {
      if (prev.find(i => i.id === product.id)) return prev;
      return [...prev, { ...product, qty: 1, importCost: product.cost || 0 }];
    });
  };

  const updateItem = (id, field, val) => setCart(prev => prev.map(i => i.id === id ? { ...i, [field]: Math.max(0, Number(val)) } : i));
  const cartTotal = cart.reduce((sum, i) => sum + i.importCost * i.qty, 0);

  const handleImport = async () => {
    if (!user || cart.length === 0 || !supplierId) return showToast("Vui lòng chọn NCC và thêm hàng", "error");
    try {
      const s = suppliers.find(s => s.id === supplierId);
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'imports'), {
        supplierId, supplierName: s.name, items: cart, total: cartTotal, status: isDebt ? 'DEBT' : 'PAID', note: importNote, date: new Date().toISOString()
      });

      let batch = writeBatch(db);
      for (const item of cart) {
        const p = products.find(p => p.id === item.id);
        if (p) {
          const pRef = doc(db, 'artifacts', appId, 'users', user.uid, 'products', p.id);
          batch.update(pRef, { stock: p.stock + item.qty, cost: item.importCost });
        }
      }
      if (isDebt) {
        const sRef = doc(db, 'artifacts', appId, 'users', user.uid, 'suppliers', supplierId);
        batch.update(sRef, { totalDebt: (s.totalDebt || 0) + cartTotal });
      }
      await batch.commit();

      setCart([]); setSupplierId(''); setIsDebt(false); setImportNote('');
      showToast("Nhập hàng thành công!");
    } catch (error) { showToast("Lỗi nhập hàng", "error"); }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-gray-50 h-full">
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><ArrowDownToLine size={20}/> Chọn hàng cần nhập</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {products.map(p => (
            <div key={p.id} onClick={() => addToCart(p)} className="bg-white p-3 rounded-xl border border-gray-200 hover:border-purple-400 cursor-pointer shadow-sm">
              <h3 className="font-semibold text-sm truncate">{p.name}</h3>
              <p className="text-xs text-gray-500 mt-1">Tồn: {p.stock}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="w-full lg:w-[450px] bg-white border-l border-gray-200 flex flex-col shadow-lg shrink-0 z-20 h-[60vh] lg:h-auto">
        <div className="p-4 border-b border-gray-100 bg-purple-50 flex justify-between">
          <h2 className="font-bold text-purple-800">Phiếu nhập kho</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.map(item => (
            <div key={item.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-2">
              <div className="flex justify-between items-start">
                <h4 className="font-medium text-sm text-gray-800">{item.name}</h4>
                <button onClick={() => setCart(c => c.filter(i => i.id !== item.id))} className="text-red-400"><X size={16}/></button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <label className="text-xs text-gray-500 block">Số lượng</label>
                  <input type="number" min="1" value={item.qty} onChange={e => updateItem(item.id, 'qty', e.target.value)} className="w-full p-1.5 border rounded outline-none" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block">Đơn giá nhập</label>
                  <input type="number" min="0" value={item.importCost} onChange={e => updateItem(item.id, 'importCost', e.target.value)} className="w-full p-1.5 border rounded outline-none" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-gray-100 bg-gray-50 space-y-3">
           <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Nhà cung cấp *</label>
            <select value={supplierId} onChange={e => setSupplierId(e.target.value)} className="w-full p-2 border rounded-lg outline-none text-sm">
              <option value="">-- Chọn NCC --</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setIsDebt(false)} className={`flex-1 py-2 rounded-lg text-sm font-medium border ${!isDebt ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-300'}`}>Tiền mặt</button>
            <button onClick={() => setIsDebt(true)} className={`flex-1 py-2 rounded-lg text-sm font-medium border ${isDebt ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-300'}`}>Ghi nợ NCC</button>
          </div>
          <div className="flex justify-between items-center pt-2">
            <span className="font-medium text-gray-600">Tổng thanh toán:</span>
            <span className="text-2xl font-bold text-purple-700">{formatCurrency(cartTotal)}</span>
          </div>
          <button onClick={handleImport} className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-bold shadow-sm mt-2">Hoàn tất Nhập Hàng</button>
        </div>
      </div>
    </div>
  );
}

function InventoryView({ products, db, appId, user, showToast }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({});

  const openModal = (p = null) => {
    setForm(p ? { ...p } : { name: '', price: '', cost: '', stock: '', image: '' });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;
    try {
      const data = { name: form.name, price: Number(form.price), cost: Number(form.cost || 0), stock: Number(form.stock), image: form.image || '' };
      if (form.id) await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'products', form.id), data);
      else await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'products'), data);
      setIsModalOpen(false); showToast("Đã lưu sản phẩm");
    } catch (e) { showToast("Lỗi lưu sản phẩm", "error"); }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 p-4 md:p-6 overflow-hidden h-full">
      <div className="flex justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Kho Hàng</h2>
        <button onClick={() => openModal()} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex gap-2"><Plus size={20}/> Thêm mới</button>
      </div>
      <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b sticky top-0 z-10">
              <tr>
                <th className="p-4 font-semibold text-gray-600">Sản phẩm</th>
                <th className="p-4 font-semibold text-gray-600">Giá nhập (Vốn)</th>
                <th className="p-4 font-semibold text-gray-600">Giá bán</th>
                <th className="p-4 font-semibold text-gray-600">Tồn kho</th>
                <th className="p-4 font-semibold text-gray-600 text-right">Sửa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/50">
                  <td className="p-4 font-medium">{p.name}</td>
                  <td className="p-4 text-gray-600">{formatCurrency(p.cost)}</td>
                  <td className="p-4 text-blue-600 font-medium">{formatCurrency(p.price)}</td>
                  <td className="p-4 font-bold">{p.stock}</td>
                  <td className="p-4 text-right">
                    <button onClick={() => openModal(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit size={18}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={form.id ? "Sửa sản phẩm" : "Thêm sản phẩm"}>
        <form onSubmit={handleSave} className="space-y-4">
          <input required placeholder="Tên sản phẩm *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none focus:border-blue-500" />
          <div className="grid grid-cols-2 gap-3">
             <input required type="number" placeholder="Giá vốn *" value={form.cost} onChange={e => setForm({...form, cost: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none focus:border-blue-500" />
             <input required type="number" placeholder="Giá bán *" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none focus:border-blue-500" />
          </div>
          <input required type="number" placeholder="Tồn kho *" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none focus:border-blue-500" />
          <button type="submit" className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700">Lưu thông tin</button>
        </form>
      </Modal>
    </div>
  );
}

function ContactManager({ type, data, db, appId, user, showToast }) {
  const isCus = type === 'customers';
  const title = isCus ? "Khách Hàng" : "Nhà Cung Cấp";
  const btnColor = isCus ? "bg-blue-600 hover:bg-blue-700" : "bg-purple-600 hover:bg-purple-700";
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({});

  const openModal = (item = null) => {
    setForm(item ? { ...item } : { name: '', phone: '', address: '', totalDebt: 0 });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;
    try {
      const payload = { name: form.name, phone: form.phone, address: form.address, totalDebt: Number(form.totalDebt || 0) };
      if (form.id) await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, type, form.id), payload);
      else await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, type), payload);
      setIsModalOpen(false); showToast(`Đã lưu ${title.toLowerCase()}`);
    } catch (e) { showToast("Lỗi hệ thống", "error"); }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 p-4 md:p-6 overflow-hidden h-full">
      <div className="flex justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Quản lý {title}</h2>
        <button onClick={() => openModal()} className={`${btnColor} text-white px-4 py-2 rounded-lg font-medium flex gap-2`}><Plus size={20}/> Thêm mới</button>
      </div>
      <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b sticky top-0">
              <tr>
                <th className="p-4 font-semibold text-gray-600">Tên {title}</th>
                <th className="p-4 font-semibold text-gray-600">Điện thoại</th>
                <th className="p-4 font-semibold text-gray-600">Tổng Nợ</th>
                <th className="p-4 font-semibold text-gray-600 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map(item => (
                <tr key={item.id} className="hover:bg-gray-50/50">
                  <td className="p-4 font-medium">{item.name}</td>
                  <td className="p-4 text-gray-600">{item.phone}</td>
                  <td className={`p-4 font-bold ${item.totalDebt > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(item.totalDebt)}</td>
                  <td className="p-4 text-right">
                    <button onClick={() => openModal(item)} className="p-2 text-gray-500 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded-lg"><Edit size={18}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={form.id ? `Cập nhật ${title}` : `Thêm ${title}`}>
        <form onSubmit={handleSave} className="space-y-4">
          <input required placeholder="Tên *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none" />
          <input placeholder="Điện thoại" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none" />
          <input placeholder="Địa chỉ" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none" />
          <button type="submit" className={`w-full ${btnColor} text-white py-2.5 rounded-lg font-medium mt-2`}>Lưu thông tin</button>
        </form>
      </Modal>
    </div>
  );
}

function ExpenseView({ expenses, db, appId, user, showToast }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ amount: '', note: '' });

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'expenses'), { 
        amount: Number(form.amount), note: form.note, date: new Date().toISOString() 
      });
      setIsModalOpen(false); setForm({amount: '', note: ''});
      showToast("Đã thêm chi phí");
    } catch (e) { showToast("Lỗi lưu chi phí", "error"); }
  };

  const handleDelete = async (id) => {
    if(!user || !confirm("Xóa chi phí này?")) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'expenses', id));
      showToast("Đã xóa chi phí");
    } catch (e) { showToast("Lỗi xóa", "error"); }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 p-4 md:p-6 overflow-hidden h-full">
      <div className="flex justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Chi phí hoạt động</h2>
        <button onClick={() => setIsModalOpen(true)} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium flex gap-2"><Plus size={20}/> Thêm</button>
      </div>
      <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b sticky top-0 z-10">
              <tr>
                <th className="p-4 font-semibold text-gray-600">Ngày</th>
                <th className="p-4 font-semibold text-gray-600">Nội dung</th>
                <th className="p-4 font-semibold text-gray-600">Số tiền</th>
                <th className="p-4 font-semibold text-gray-600 text-right">Xóa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {expenses.sort((a,b) => new Date(b.date) - new Date(a.date)).map(e => (
                <tr key={e.id} className="hover:bg-gray-50/50">
                  <td className="p-4 text-gray-600">{formatDate(e.date)}</td>
                  <td className="p-4 font-medium text-gray-800">{e.note}</td>
                  <td className="p-4 font-bold text-orange-600">{formatCurrency(e.amount)}</td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleDelete(e.id)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 size={18}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Thêm Chi Phí Mới">
        <form onSubmit={handleSave} className="space-y-4">
          <input required type="number" min="0" placeholder="Số tiền *" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none" />
          <textarea required value={form.note} onChange={e => setForm({...form, note: e.target.value})} placeholder="Nội dung chi phí *" className="w-full p-2.5 border rounded-lg outline-none resize-none h-24"></textarea>
          <button type="submit" className="w-full bg-orange-600 text-white py-2.5 rounded-lg font-medium">Lưu</button>
        </form>
      </Modal>
    </div>
  );
}
