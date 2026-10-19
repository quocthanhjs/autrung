import React, { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, ShoppingCart, Package, Users, Truck, Plus, Edit, Trash2, Check, X, Image as ImageIcon, ShoppingBag, TrendingUp, AlertCircle, ArrowDownToLine, Phone, DollarSign, CheckCircle2, Printer, FileText, CreditCard, Lock, LogOut, ShieldAlert, User as UserIcon, Database, UserCog, KeyRound, MonitorSmartphone, Mail, Download, Upload, ArrowUpDown, Search, Eye, EyeOff, Bell, Award, BarChart3, Receipt, ChevronDown, ChevronUp, Image, Store, Sliders, HardDrive, ChevronLeft, ChevronRight } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail } from 'firebase/auth';
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

const PaginationControls = ({ currentPage, totalPages, rowsPerPage, onPageChange, onRowsChange, totalItems }) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-3 py-3 px-4 bg-white border-t text-sm">
      <div className="flex items-center gap-2">
        <span className="text-gray-500 font-medium">Hiển thị:</span>
        <select value={rowsPerPage} onChange={(e) => onRowsChange(e.target.value)} className="p-1.5 border rounded-lg bg-gray-50 font-bold outline-none text-xs">
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
          <option value="all">Tất cả</option>
        </select>
        <span className="text-gray-500 text-xs font-medium">/ Tổng số {totalItems} mục</span>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1 || rowsPerPage === 'all'} className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed bg-white"><ChevronLeft size={16}/></button>
        <span className="font-bold text-gray-700 px-2 text-xs">Trang {rowsPerPage === 'all' ? 1 : currentPage} / {rowsPerPage === 'all' ? 1 : (totalPages || 1)}</span>
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages || rowsPerPage === 'all'} className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed bg-white"><ChevronRight size={16}/></button>
      </div>
    </div>
  );
};

const ToggleSwitch = ({ checked, onChange, label }) => (
  <label className="flex items-center justify-between cursor-pointer w-full group py-1">
    <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">{label}</span>
    <div className="relative inline-flex items-center">
      <input type="checkbox" className="sr-only peer" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
    </div>
  </label>
);

const Modal = ({ isOpen, onClose, title, children, maxWidth = "max-w-md", hideHeaderInPrint = false }) => {
  if (!isOpen) return null;
  let containerClass = "bg-white rounded-xl shadow-2xl w-full " + maxWidth + " overflow-hidden flex flex-col max-h-[90vh]";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={containerClass}>
        {!hideHeaderInPrint && (
          <div className="flex justify-between items-center p-4 border-b shrink-0 bg-gray-50/80">
            <h3 className="text-lg font-bold text-gray-800">{title}</h3>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-red-500 bg-white shadow-sm border p-1 rounded-lg transition-colors"><X size={20} /></button>
          </div>
        )}
        <div className="p-4 overflow-y-auto bg-white">{children}</div>
      </div>
    </div>
  );
};

const ReceiptTemplate = ({ order, storeConfig, isA4A5, baseFontSize }) => {
  const sizeKey = storeConfig?.printPaperSize || 'K80';
  const cfg = storeConfig?.[sizeKey] || storeConfig || {};

  const padX = cfg.printTablePaddingX ?? 4;
  const padY = cfg.printTablePaddingY ?? 6;
  const detailFontScale = (cfg.printDetailFontScale ?? 80) / 100;
  const detailFontSize = `${baseFontSize * detailFontScale}px`;
  
  const thStyle = { padding: `${padY}px ${padX}px`, fontSize: detailFontSize, textAlign: 'center' };
  const tdStyle = { padding: `${padY}px ${padX}px`, fontSize: detailFontSize };

  const showBH = isA4A5 && cfg.printShowWarranty !== false;
  const showGC = isA4A5 && cfg.printShowNote !== false;
  const a4a5ColSpan = 4 + (showBH ? 1 : 0) + (showGC ? 1 : 0);

  const wStt = isA4A5 ? `${cfg.colWidthStt ?? 5}%` : 'auto';
  const wProd = isA4A5 ? `${cfg.colWidthProduct ?? 35}%` : '45%';
  const wQty = isA4A5 ? `${cfg.colWidthQty ?? 8}%` : '10%';
  const wPrice = isA4A5 ? `${cfg.colWidthPrice ?? 12}%` : '20%';
  const wWarranty = isA4A5 ? `${cfg.colWidthWarranty ?? 12}%` : 'auto';
  const wNote = isA4A5 ? `${cfg.colWidthNote ?? 13}%` : 'auto';
  const wTotal = isA4A5 ? `${cfg.colWidthTotal ?? 15}%` : '25%';

  const fsStoreName = `${baseFontSize + (cfg.fsStoreNameOffset ?? 2)}px`;
  const fsStoreAddress = `${baseFontSize + (cfg.fsStoreAddressOffset ?? 0)}px`;
  const fsStorePhone = `${baseFontSize + (cfg.fsStorePhoneOffset ?? 0)}px`;
  const fsInvoiceTitle = `${baseFontSize + (cfg.fsInvoiceTitleOffset ?? 4)}px`;
  const fsMeta = `${baseFontSize + (cfg.fsMetaOffset ?? 0)}px`;

  return (
    <>
      <div className="border-b border-dashed border-gray-400 pb-3 mb-3">
        {isA4A5 ? (
          <div className="flex items-center gap-4 mb-3">
            {cfg.printShowLogo && storeConfig.logo && (
              <div className="shrink-0">
                <img src={storeConfig.logo} alt="Logo" className="max-h-16 object-contain" />
              </div>
            )}
            <div className="flex flex-col flex-1">
              {cfg.printShowStoreName && (
                <h2 className="font-bold uppercase" style={{fontSize: fsStoreName}}>
                  {storeConfig.name || 'SmartPOS Pro'}
                </h2>
              )}
              {cfg.printShowStoreAddress && <p className="mt-0.5" style={{fontSize: fsStoreAddress}}>ĐC: {storeConfig.address}</p>}
              {cfg.printShowStorePhone && <p style={{fontSize: fsStorePhone}}>SĐT: {storeConfig.phone}</p>}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center mb-2">
            {cfg.printShowLogo && storeConfig.logo && (
              <div className="mb-2">
                <img src={storeConfig.logo} alt="Logo" className="max-h-16 object-contain" />
              </div>
            )}
            {cfg.printShowStoreName && (
              <h2 className="font-bold uppercase" style={{fontSize: fsStoreName}}>
                {storeConfig.name || 'SmartPOS Pro'}
              </h2>
            )}
            {cfg.printShowStoreAddress && <p className="mt-0.5" style={{fontSize: fsStoreAddress}}>ĐC: {storeConfig.address}</p>}
            {cfg.printShowStorePhone && <p style={{fontSize: fsStorePhone}}>SĐT: {storeConfig.phone}</p>}
          </div>
        )}

        <div className="text-center mt-3">
          <h1 className="font-bold uppercase" style={{fontSize: fsInvoiceTitle}}>
            {cfg.printInvoiceTitle || 'HÓA ĐƠN BÁN HÀNG'}
          </h1>
          <div className="flex justify-center items-center gap-3 mt-1 text-gray-800" style={{fontSize: fsMeta}}>
            {cfg.printShowDate && <span>Ngày tạo: {order?.date ? formatDate(order.date) : '20/10/2026 14:30'}</span>}
            {cfg.printShowInvoiceId && <span>Mã HĐ: {order?.id?.slice(0,6).toUpperCase() || 'HD12345'}</span>}
          </div>
        </div>
      </div>

      <div className="mb-3 space-y-1" style={{fontSize: `${baseFontSize}px`}}>
        {cfg.printShowCustomer && <p><strong>Khách hàng:</strong> {order?.customerName || 'Anh Nguyễn Văn A'}</p>}
        {cfg.printShowCustomerPhone && <p><strong>SĐT:</strong> {order?.phone || '0987.654.321'}</p>}
        {cfg.printShowCashier && <p><strong>Thu ngân:</strong> Bán hàng</p>}
        {cfg.printShowStatus && <p><strong>Trạng thái:</strong> {order?.status === 'PAID' ? 'Đã thanh toán' : (order?.status === 'DEBT' ? 'Ghi nợ' : 'Đã thanh toán')}</p>}
      </div>

      <table className="w-full mb-3 border-collapse">
        <thead>
          <tr className="border-b border-gray-400 bg-gray-100/50">
            {isA4A5 && <th style={{...thStyle, width: wStt}} className="border border-gray-300">STT</th>}
            <th style={{...thStyle, width: wProd}} className={`border border-gray-300`}>Tên hàng</th>
            <th style={{...thStyle, width: wQty}} className={`border border-gray-300`}>SL</th>
            <th style={{...thStyle, width: wPrice}} className={`border border-gray-300`}>Đơn giá</th>
            {showBH && <th style={{...thStyle, width: wWarranty}} className="border border-gray-300">Bảo hành</th>}
            {showGC && <th style={{...thStyle, width: wNote}} className="border border-gray-300">Ghi chú</th>}
            <th style={{...thStyle, width: wTotal}} className={`border border-gray-300`}>Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          {(order?.items || [{name: 'Điện thoại Demo', price: 8500000, quantity: 1, warrantyValue: '12', warrantyUnit: 'tháng', note: 'Màu đen'}]).map((i, x) => (
            <tr key={x} className="border-b border-gray-200 border-dashed">
              {isA4A5 && <td style={tdStyle} className="text-center align-top border border-gray-300">{x + 1}</td>}
              <td style={tdStyle} className={`align-top ${isA4A5 ? 'border border-gray-300' : ''}`}>
                <strong>{i.name}</strong>
                {!isA4A5 && (
                  <div className="text-[0.85em] text-gray-700 mt-1 space-y-0.5">
                    {cfg.printShowWarranty !== false && i.warrantyValue && <div>- BH: {i.warrantyValue} {i.warrantyUnit}</div>}
                    {cfg.printShowNote !== false && i.note && <div>- GC: {i.note}</div>}
                  </div>
                )}
              </td>
              <td style={tdStyle} className={`text-center align-top ${isA4A5 ? 'border border-gray-300' : ''}`}>{i.quantity}</td>
              <td style={tdStyle} className={`text-right align-top ${isA4A5 ? 'border border-gray-300' : ''}`}>{formatCurrency(i.price)}</td>
              {showBH && <td style={tdStyle} className="text-center align-top border border-gray-300">{i.warrantyValue ? `${i.warrantyValue} ${i.warrantyUnit}` : ''}</td>}
              {showGC && <td style={tdStyle} className="text-left align-top border border-gray-300">{i.note || ''}</td>}
              <td style={tdStyle} className={`text-right align-top font-bold ${isA4A5 ? 'border border-gray-300' : ''}`}>{formatCurrency(i.price * i.quantity)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-gray-800 font-bold bg-gray-50">
            <td colSpan={isA4A5 ? a4a5ColSpan : 3} className={`py-3 px-1 text-right uppercase ${isA4A5 ? 'border border-gray-300' : ''}`}>Tổng tiền hàng:</td>
            <td className={`py-3 px-1 text-right ${isA4A5 ? 'border border-gray-300' : ''}`} style={{fontSize: `${baseFontSize + 2}px`}}>{formatCurrency(order?.total || 8500000)}</td>
          </tr>
        </tfoot>
      </table>

      {cfg.printFooter && <div className="text-center mt-4 pt-3 border-t border-dashed border-gray-400" style={{fontSize: `${baseFontSize}px`}}><p className="italic font-medium">{cfg.printFooter}</p></div>}
    </>
  );
};

function LoginView({ onLoginSuccess }) {
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [resetMsg, setResetMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      let cleanInput = loginInput.trim().toLowerCase();
      if (cleanInput === 'admin' || cleanInput.includes('@')) {
        let loginEmail = cleanInput === 'admin' ? "admin@smartpos.com" : cleanInput;
        const userCredential = await signInWithEmailAndPassword(auth, loginEmail, password);
        const user = userCredential.user;
        const userDocRef = doc(db, 'users_db', user.uid);
        const userDoc = await getDoc(userDocRef);
        let role = 'admin', name = loginEmail, perms = {};
        if (userDoc.exists()) {
          role = userDoc.data().role; name = userDoc.data().name; perms = userDoc.data().permissions || {};
        } else {
          await setDoc(userDocRef, { username: loginEmail, email: loginEmail, role: 'admin', name: 'Admin', createdAt: new Date().toISOString() });
        }
        onLoginSuccess({ uid: user.uid, role, name, perms });
        return;
      }

      const q = query(collection(db, 'users_db'), where('username', '==', cleanInput));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) throw new Error("Không tìm thấy Tên đăng nhập này!");
      
      const staffDoc = querySnapshot.docs[0];
      const staffData = staffDoc.data();
      if (staffData.password !== password) throw new Error("Mật khẩu không đúng!");

      let ip = "Không xác định";
      try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        ip = data.ip;
      } catch (err) {}

      await addDoc(collection(db, 'login_logs'), { uid: staffDoc.id, username: staffData.username, name: staffData.name, role: staffData.role, loginTime: new Date().toISOString(), ip, device: getDeviceInfo() });
      
      onLoginSuccess({ uid: staffDoc.id, role: staffData.role, name: staffData.name, perms: staffData.permissions || {} });
    } catch (err) {
      setError(err.message || "Tài khoản hoặc mật khẩu không đúng!");
    } finally { setLoading(false); }
  };

  const handleReset = async (e) => {
    e.preventDefault(); setError(''); setResetMsg(''); setLoading(true);
    try {
      await sendPasswordResetEmail(auth, loginInput);
      setResetMsg("Link khôi phục đã gửi vào Email!");
    } catch (err) {
      setError("Vui lòng nhập Email Admin thật đã đăng ký để khôi phục.");
    } finally { setLoading(false); }
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
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập (Username / Email)</label><input type="text" value={loginInput} onChange={(e) => setLoginInput(e.target.value)} className="w-full p-3 border rounded-lg outline-none" required placeholder="Ví dụ: nhanvien1" /></div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 border rounded-lg outline-none" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
            </div>
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

export default function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({ role: null, name: '', perms: {} });
  const [activeTab, setActiveTab] = useState('pos');
  const [storeConfig, setStoreConfig] = useState({
    name: 'SmartPOS Pro', address: '', phone: '', logo: '', costCalcMethod: 'LATEST',
    printPaperSize: 'K80',
    K80: { printFontSize: 12, printTablePaddingX: 4, printTablePaddingY: 6, printDetailFontScale: 80, colWidthStt: 5, colWidthProduct: 35, colWidthQty: 8, colWidthPrice: 12, colWidthWarranty: 12, colWidthNote: 13, colWidthTotal: 15, printShowLogo: true, printShowStoreName: true, printShowStoreAddress: true, printShowStorePhone: true, printInvoiceTitle: 'HÓA ĐƠN BÁN HÀNG', printShowInvoiceId: true, printShowDate: true, printShowCashier: true, printShowCustomer: true, printShowCustomerPhone: true, printShowStatus: true, printShowWarranty: true, printShowNote: true, printFooter: 'Cảm ơn quý khách và hẹn gặp lại!', fsStoreNameOffset: 2, fsStoreAddressOffset: 0, fsStorePhoneOffset: 0, fsInvoiceTitleOffset: 4, fsMetaOffset: 0 },
    A4: { printFontSize: 12, printTablePaddingX: 4, printTablePaddingY: 6, printDetailFontScale: 80, colWidthStt: 5, colWidthProduct: 35, colWidthQty: 8, colWidthPrice: 12, colWidthWarranty: 12, colWidthNote: 13, colWidthTotal: 15, printShowLogo: true, printShowStoreName: true, printShowStoreAddress: true, printShowStorePhone: true, printInvoiceTitle: 'HÓA ĐƠN BÁN HÀNG', printShowInvoiceId: true, printShowDate: true, printShowCashier: true, printShowCustomer: true, printShowCustomerPhone: true, printShowStatus: true, printShowWarranty: true, printShowNote: true, printFooter: 'Cảm ơn quý khách và hẹn gặp lại!', fsStoreNameOffset: 2, fsStoreAddressOffset: 0, fsStorePhoneOffset: 0, fsInvoiceTitleOffset: 4, fsMetaOffset: 0 },
    A5: { printFontSize: 12, printTablePaddingX: 4, printTablePaddingY: 6, printDetailFontScale: 80, colWidthStt: 5, colWidthProduct: 35, colWidthQty: 8, colWidthPrice: 12, colWidthWarranty: 12, colWidthNote: 13, colWidthTotal: 15, printShowLogo: true, printShowStoreName: true, printShowStoreAddress: true, printShowStorePhone: true, printInvoiceTitle: 'HÓA ĐƠN BÁN HÀNG', printShowInvoiceId: true, printShowDate: true, printShowCashier: true, printShowCustomer: true, printShowCustomerPhone: true, printShowStatus: true, printShowWarranty: true, printShowNote: true, printFooter: 'Cảm ơn quý khách và hẹn gặp lại!', fsStoreNameOffset: 2, fsStoreAddressOffset: 0, fsStorePhoneOffset: 0, fsInvoiceTitleOffset: 4, fsMetaOffset: 0 }
  });

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [imports, setImports] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const storeId = 'main_store';

  useEffect(() => {
    if (!window.html2canvas) {
      const s = document.createElement('script');
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
      document.body.appendChild(s);
    }
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users_db', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUser(currentUser);
          setUserData({ role: data.role, name: data.name || data.username, perms: data.permissions || {} });
          setActiveTab(data.role === 'admin' ? 'dashboard' : 'pos');
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubStore = onSnapshot(doc(db, 'stores', storeId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setStoreConfig(prev => ({
          ...prev,
          ...data,
          K80: { ...(prev.K80 || {}), ...(data.K80 || {}) },
          A4: { ...(prev.A4 || {}), ...(data.A4 || {}) },
          A5: { ...(prev.A5 || {}), ...(data.A5 || {}) }
        }));
      }
    });

    const fetchCol = (colName, setter) => onSnapshot(collection(db, 'stores', storeId, colName), (snap) => setter(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubProducts = fetchCol('products', setProducts);
    const unsubOrders = fetchCol('orders', setOrders);
    const unsubImports = fetchCol('imports', setImports);
    const unsubCustomers = fetchCol('customers', setCustomers);
    const unsubSuppliers = fetchCol('suppliers', setSuppliers);
    const unsubExpenses = fetchCol('expenses', setExpenses);

    return () => { unsubStore(); unsubProducts(); unsubOrders(); unsubImports(); unsubCustomers(); unsubSuppliers(); unsubExpenses(); };
  }, [user]);

  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  if (!user) return <LoginView onLoginSuccess={(userInfo) => { setUser(userInfo); setUserData({ role: userInfo.role, name: userInfo.name, perms: userInfo.perms }); setActiveTab(userInfo.role === 'admin' ? 'dashboard' : 'pos'); }} />;

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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans text-sm md:text-base selection:bg-blue-200">
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 flex flex-col shadow-[2px_0_8px_-3px_rgba(0,0,0,0.05)] z-20 shrink-0">
        <div className="p-5 border-b border-gray-100 flex items-center gap-3">
          {storeConfig.logo ? <img src={storeConfig.logo} alt="Logo" className="w-10 h-10 object-contain rounded bg-white shadow-sm border border-gray-100" /> : <div className="bg-blue-600 text-white p-2.5 rounded-xl shadow-md"><ShoppingBag size={22} /></div>}
          <div className="min-w-0"><h1 className="text-lg font-black tracking-tight text-gray-800 truncate">{storeConfig.name || 'SmartPOS'}</h1></div>
        </div>
        <nav className="flex-1 p-3 flex flex-row md:flex-col gap-1.5 overflow-x-auto md:overflow-visible scrollbar-hide">
          {visibleTabs.map(tab => {
            const activeClass = activeTab === tab.id ? 'bg-blue-50 text-blue-700 font-bold shadow-sm border-blue-100' : 'text-gray-600 hover:bg-gray-50 font-semibold border-transparent hover:border-gray-100';
            const iconClass = activeTab === tab.id ? "text-blue-600" : "text-gray-400";
            return <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={"flex items-center gap-3 px-4 py-3 rounded-xl transition-all border whitespace-nowrap md:whitespace-normal " + activeClass}><tab.icon size={20} className={iconClass} />{tab.label}</button>;
          })}
        </nav>
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <div className="flex flex-col min-w-0"><p className="text-sm font-bold text-gray-800 truncate">{userData.name}</p><p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">{userData.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}</p></div>
            <button onClick={() => { signOut(auth); setUser(null); }} className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"><LogOut size={18} /></button>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-hidden flex flex-col h-[calc(100vh-80px)] md:h-screen relative">
        {toast && <div className={"absolute top-4 right-4 z-50 px-6 py-3.5 rounded-xl shadow-xl flex items-center gap-2 text-white animate-in slide-in-from-top-2 " + (toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600')}><div className="bg-white/20 p-1 rounded-full">{toast.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}</div><span className="font-bold text-sm tracking-wide">{toast.msg}</span></div>}
        {activeTab === 'dashboard' && <DashboardView orders={orders} imports={imports} expenses={expenses} customers={customers} suppliers={suppliers} showToast={showToast} />}
        {activeTab === 'pos' && <POSView products={products} customers={customers} db={db} storeId={storeId} user={user} storeConfig={storeConfig} showToast={showToast} userData={userData} />}
        {activeTab === 'sales_history' && <SalesHistoryView orders={orders} products={products} customers={customers} storeConfig={storeConfig} db={db} storeId={storeId} user={user} showToast={showToast} />}
        {activeTab === 'imports' && <ImportView products={products} suppliers={suppliers} db={db} storeId={storeId} user={user} showToast={showToast} storeConfig={storeConfig} />}
        {activeTab === 'products' && <InventoryView products={products} orders={orders} imports={imports} storeConfig={storeConfig} db={db} storeId={storeId} showToast={showToast} />}
        {activeTab === 'customers' && <ContactManager type="customers" data={customers} orders={orders} storeConfig={storeConfig} db={db} storeId={storeId} showToast={showToast} />}
        {activeTab === 'suppliers' && <ContactManager type="suppliers" data={suppliers} orders={imports} storeConfig={storeConfig} db={db} storeId={storeId} showToast={showToast} />}
        {activeTab === 'expenses' && <ExpenseView expenses={expenses} db={db} storeId={storeId} showToast={showToast} />}
        {activeTab === 'settings' && <SettingsView db={db} storeId={storeId} showToast={showToast} storeConfig={storeConfig} />}
        {activeTab === 'staff' && <StaffManagerView db={db} showToast={showToast} />}
      </main>
    </div>
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
  const [chartFilter, setChartFilter] = useState('7days');

  const stats = useMemo(() => {
    const fOrders = orders.filter(o => {
      const d = new Date(o.date);
      return (filterMonth === 'ALL' || (d.getMonth() + 1).toString() === filterMonth) && d.getFullYear().toString() === filterYear;
    });
    const fImports = imports.filter(i => {
      const d = new Date(i.date);
      return (filterMonth === 'ALL' || (d.getMonth() + 1).toString() === filterMonth) && d.getFullYear().toString() === filterYear;
    });
    const fExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return (filterMonth === 'ALL' || (d.getMonth() + 1).toString() === filterMonth) && d.getFullYear().toString() === filterYear;
    });

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
      return custSortOrder === 'desc' ? timeA - timeB : timeB - timeA;
    });

    const filteredSuppDebt = (suppliers || []).filter(s => {
      if (!s.createdAt) return filterMonth === 'ALL';
      const d = new Date(s.createdAt);
      return (filterMonth === 'ALL' || (d.getMonth() + 1).toString() === filterMonth) && d.getFullYear().toString() === filterYear;
    }).sort((a, b) => {
      const timeA = new Date(a.createdAt || 0);
      const timeB = new Date(b.createdAt || 0);
      return suppSortOrder === 'desc' ? timeA - timeB : timeB - timeA;
    });

    const overdueCust = orders.filter(o => o.status === 'DEBT').sort((a,b) => new Date(b.date) - new Date(a.date));
    const overdueCust1Week = overdueCust.filter(o => getDaysDifference(o.date) >= 7);

    let chartData = {};
    if (chartFilter === '7days') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        chartData[d.getDate() + '/' + (d.getMonth() + 1)] = 0;
      }
    } else if (chartFilter === 'month') {
      const targetMonth = filterMonth !== 'ALL' ? parseInt(filterMonth) : currentDate.getMonth() + 1;
      const targetYear = parseInt(filterYear);
      const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) { chartData[i + '/' + targetMonth] = 0; }
    } else if (chartFilter === 'year') {
      ['Th 1', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7', 'Th 8', 'Th 9', 'Th 10', 'Th 11', 'Th 12'].forEach(m => chartData[m] = 0);
    }

    orders.forEach(o => {
      const d = new Date(o.date);
      const oDay = d.getDate(); const oMonth = d.getMonth() + 1; const oYear = d.getFullYear();
      if (chartFilter === '7days') {
        const today = new Date(); today.setHours(23, 59, 59, 999);
        const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(today.getDate() - 6); sevenDaysAgo.setHours(0, 0, 0, 0);
        if (d >= sevenDaysAgo && d <= today) {
          const dayKey = oDay + '/' + oMonth;
          if (chartData[dayKey] !== undefined) chartData[dayKey] += o.total;
        }
      } else if (chartFilter === 'month') {
        const targetMonth = filterMonth !== 'ALL' ? parseInt(filterMonth) : currentDate.getMonth() + 1;
        const targetYear = parseInt(filterYear);
        if (oMonth === targetMonth && oYear === targetYear) {
          const dayKey = oDay + '/' + targetMonth;
          if (chartData[dayKey] !== undefined) chartData[dayKey] += o.total;
        }
      } else if (chartFilter === 'year') {
        if (oYear === parseInt(filterYear)) {
          const mKey = 'Th ' + oMonth;
          if (chartData[mKey] !== undefined) chartData[mKey] += o.total;
        }
      }
    });

    let productSalesMap = {};
    fOrders.forEach(o => {
      (o.items || []).forEach(it => {
        const qty = Number(it.quantity || it.qty || 1);
        const rev = qty * (Number(it.price) || 0);
        if (!productSalesMap[it.name]) productSalesMap[it.name] = { name: it.name, totalQty: 0, totalRev: 0 };
        productSalesMap[it.name].totalQty += qty;
        productSalesMap[it.name].totalRev += rev;
      });
    });
    const topProducts = Object.values(productSalesMap).sort((a, b) => b.totalQty - a.totalQty).slice(0, 5);

    return { totalRev, totalCost, totalExp, netProfit, overdueCust, overdueCust1Week, chartData, topProducts, filteredCustDebt, filteredSuppDebt };
  }, [orders, imports, expenses, customers, suppliers, filterMonth, filterYear, custSortOrder, suppSortOrder, chartFilter]);

  const years = Array.from({length: 5}, (_, i) => currentDate.getFullYear() - i);
  const StatCard = ({ icon, title, value, color, highlight = false }) => {
    const borderClass = highlight ? 'border-green-300 ring-2 ring-green-100 shadow-md' : 'border-gray-200';
    const textClass = highlight ? 'text-green-700' : 'text-gray-900';
    return (
      <div className={"bg-white p-5 rounded-2xl shadow-sm border flex items-center gap-4 " + borderClass}>
        <div className={"w-14 h-14 rounded-xl shadow-sm flex items-center justify-center shrink-0 " + color}>{React.cloneElement(icon, { size: 24 })}</div>
        <div className="min-w-0"><p className="text-gray-500 text-sm font-bold mb-1 truncate uppercase tracking-wider">{title}</p><p className={"text-xl font-black truncate " + textClass}>{value}</p></div>
      </div>
    );
  };

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
            <h3 className="font-bold text-gray-800 flex items-center gap-2 text-blue-600"> <Users size={18}/> Nhắc nợ Khách hàng ({filterMonth === 'ALL' ? `Năm ${filterYear}` : `Tháng ${filterMonth}/${filterYear}`}) </h3>
            <button onClick={() => setCustSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition" > <ArrowUpDown size={12}/> {custSortOrder === 'desc' ? 'Lâu nhất trước' : 'Gần nhất trước'} </button>
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
                {stats.filteredCustDebt.length === 0 && ( <tr><td colSpan="3" className="p-4 text-center text-gray-400">Không có khách hàng nợ trong kỳ này</td></tr> )}
              </tbody>
            </table>
          </div>
          {stats.filteredCustDebt.length > 10 && (
            <button onClick={() => setShowAllCust(!showAllCust)} className="mt-3 text-xs text-blue-600 font-bold hover:underline flex items-center justify-center gap-1 py-1" > {showAllCust ? <><ChevronUp size={14}/> Thu gọn</> : <><ChevronDown size={14}/> Xem thêm ({stats.filteredCustDebt.length - 10} khách hàng khác)</>} </button>
          )}
        </div>
        
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-800 flex items-center gap-2 text-orange-600"> <Truck size={18}/> Nhắc nợ Nhà cung cấp ({filterMonth === 'ALL' ? `Năm ${filterYear}` : `Tháng ${filterMonth}/${filterYear}`}) </h3>
            <button onClick={() => setSuppSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition" > <ArrowUpDown size={12}/> {suppSortOrder === 'desc' ? 'Lâu nhất trước' : 'Gần nhất trước'} </button>
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
                {stats.filteredSuppDebt.length === 0 && ( <tr><td colSpan="3" className="p-4 text-center text-gray-400">Không có nhà cung cấp nợ trong kỳ này</td></tr> )}
              </tbody>
            </table>
          </div>
          {stats.filteredSuppDebt.length > 10 && (
            <button onClick={() => setShowAllSupp(!showAllSupp)} className="mt-3 text-xs text-orange-600 font-bold hover:underline flex items-center justify-center gap-1 py-1" > {showAllSupp ? <><ChevronUp size={14}/> Thu gọn</> : <><ChevronDown size={14}/> Xem thêm ({stats.filteredSuppDebt.length - 10} nhà cung cấp khác)</>} </button>
          )}
        </div>
      </div>

      {stats.overdueCust1Week.length > 0 && (
        <div className="bg-red-50 border-2 border-red-500 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 bg-red-600 flex justify-between items-center text-white"> <h3 className="font-bold flex items-center gap-2 text-lg"><Bell size={24}/> CẢNH BÁO: KHÁCH HÀNG NỢ QUÁ HẠN 1 TUẦN ({stats.overdueCust1Week.length})</h3> </div>
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b border-gray-100 pb-3 gap-3">
            <h3 className="font-bold text-gray-800 flex items-center gap-2"><BarChart3 size={20} className="text-blue-600"/> Biểu đồ doanh thu</h3>
            <select value={chartFilter} onChange={e=>setChartFilter(e.target.value)} className="text-xs bg-gray-50 border border-gray-200 text-gray-700 font-bold rounded-lg px-2.5 py-2 outline-none focus:border-blue-500 w-full sm:w-auto">
              <option value="7days">7 ngày gần nhất</option>
              <option value="month">Theo ngày trong Tháng {filterMonth !== 'ALL' ? filterMonth : (new Date().getMonth() + 1)}/{filterYear}</option>
              <option value="year">Theo tháng trong Năm {filterYear}</option>
            </select>
          </div>
          <div className="flex-1 min-h-[220px] flex items-end gap-1 overflow-x-auto pt-6 pb-2 px-2 border-b border-gray-100 scrollbar-hide">
            {(() => {
              const values = Object.values(stats.chartData);
              const maxVal = Math.max(...values, 1000);
              return Object.entries(stats.chartData).map(([label, val], idx) => {
                const heightPercent = Math.max((val / maxVal) * 100, 4);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 min-w-[24px] group relative">
                    <div className="absolute -top-8 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap shadow-md z-10">{label}: {formatCurrency(val)}</div>
                    <div className={"w-full rounded-t-lg transition-all duration-500 hover:bg-blue-600 " + (val > 0 ? "bg-blue-500" : "bg-gray-200")} style={{ height: heightPercent + '%' }}></div>
                    <span className="text-[10px] text-gray-500 truncate w-full text-center" style={{fontSize: chartFilter === 'month' ? '8px' : '10px'}}>{label}</span>
                  </div>
                );
              });
            })()}
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Award size={20} className="text-amber-500"/> Hàng bán chạy nhất</h3>
          <div className="flex-1 overflow-y-auto space-y-3">
            {stats.topProducts.map((p, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className={"w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-sm " + (idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-gray-200 text-gray-700' : 'bg-orange-100 text-orange-700')}>{idx + 1}</div>
                  <div><p className="font-bold text-gray-800 text-sm truncate max-w-[120px]">{p.name}</p><p className="text-xs text-gray-500">Đã bán: <strong className="text-blue-600">{p.totalQty}</strong></p></div>
                </div>
                <span className="font-bold text-sm text-green-700">{formatCurrency(p.totalRev)}</span>
              </div>
            ))}
            {stats.topProducts.length === 0 && (<div className="text-center text-gray-400 py-12">Chưa có sản phẩm nào</div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

function POSView({ products, customers, db, storeId, user, storeConfig, showToast, userData }) {
  const [cart, setCart] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [isDebt, setIsDebt] = useState(false);
  const [orderNote, setOrderNote] = useState('');
  const [completedOrder, setCompletedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [printInvoice, setPrintInvoice] = useState(true);
  const [showAddCusModal, setShowAddCusModal] = useState(false);
  const [newCusForm, setNewCusForm] = useState({ name: '', phone: '', address: '' });
  const [posRowsPerPage, setPosRowsPerPage] = useState('10');
  const [posCurrentPage, setPosCurrentPage] = useState(1);
  const [localPrintSize, setLocalPrintSize] = useState(storeConfig.printPaperSize || 'K80');

  useEffect(() => { setLocalPrintSize(storeConfig.printPaperSize || 'K80'); }, [storeConfig.printPaperSize]);
  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === 'Escape') setShowModal(false); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const categories = useMemo(() => [...new Set(products.map(p => p.category).filter(Boolean))], [products]);
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const paginatedProducts = useMemo(() => {
    if (posRowsPerPage === 'all') return filteredProducts;
    const limit = parseInt(posRowsPerPage) || 10;
    const start = (posCurrentPage - 1) * limit;
    return filteredProducts.slice(start, start + limit);
  }, [filteredProducts, posRowsPerPage, posCurrentPage]);
  const totalPosPages = posRowsPerPage === 'all' ? 1 : Math.ceil(filteredProducts.length / (parseInt(posRowsPerPage) || 10));

  const addToCart = (product) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === product.id);
      if (ex) return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...product, quantity: 1, price: product.price, warrantyValue: '', warrantyUnit: 'tháng', note: '' }];
    });
  };

  const updateQty = (id, delta) => setCart(prev => prev.map(i => {
    if (i.id === id) { const nq = i.quantity + delta; if (nq > 0) return { ...i, quantity: nq }; }
    return i;
  }));

  const updatePrice = (id, newPrice) => setCart(prev => prev.map(i => i.id === id ? { ...i, price: Number(newPrice) || 0 } : i));
  const updateItemField = (id, field, val) => setCart(prev => prev.map(i => i.id === id ? { ...i, [field]: val } : i));
  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const handleAddCustomerQuick = async (e) => {
    e.preventDefault();
    try {
      const docRef = await addDoc(collection(db, 'stores', storeId, 'customers'), { name: newCusForm.name, phone: newCusForm.phone || '', address: newCusForm.address || '', totalDebt: 0, createdAt: new Date().toISOString() });
      setCustomerId(docRef.id);
      setShowAddCusModal(false);
      setNewCusForm({ name: '', phone: '', address: '' });
      showToast("Đã thêm và chọn khách hàng mới!");
    } catch (err) { showToast("Lỗi thêm khách hàng", "error"); }
  };

  const handleCheckout = async () => {
    if (cart.length === 0 || (isDebt && !customerId)) return;
    try {
      const c = customers.find(cust => cust.id === customerId);
      const orderData = {
        customerId: customerId || null, customerName: c ? c.name : 'Khách lẻ', sellerUid: user.uid, note: orderNote,
        items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, cost: i.cost || 0, quantity: i.quantity, warrantyValue: i.warrantyValue || '', warrantyUnit: i.warrantyUnit || 'tháng', note: i.note || '' })),
        total: cartTotal, totalCost: cart.reduce((s, item) => s + ((item.cost || 0) * item.quantity), 0),
        status: isDebt ? 'DEBT' : 'PAID', date: new Date().toISOString()
      };
      const orderRef = await addDoc(collection(db, 'stores', storeId, 'orders'), orderData);
      
      let batch = writeBatch(db);
      cart.forEach(item => {
        const p = products.find(prod => prod.id === item.id);
        if (p) batch.update(doc(db, 'stores', storeId, 'products', p.id), { stock: p.stock - item.quantity });
      });
      if (isDebt && c) batch.update(doc(db, 'stores', storeId, 'customers', customerId), { totalDebt: (c.totalDebt || 0) + cartTotal });
      await batch.commit();
      
      const newOrder = { id: orderRef.id, ...orderData, phone: c?.phone || '' };
      setCart([]); setCustomerId(''); setIsDebt(false); setOrderNote('');
      showToast("Thanh toán thành công!");
      if (printInvoice) { setCompletedOrder(newOrder); setShowModal(true); }
    } catch (e) { showToast("Lỗi thanh toán", "error"); }
  };

  const handlePrintAsImage = async () => {
    if (!window.html2canvas) return showToast("Đang tải thư viện...", "error");
    const element = document.getElementById("print-invoice-area-pos");
    if (!element) return;
    try {
      const canvas = await window.html2canvas(element, { scale: 2, useCORS: true });
      const dataUrl = canvas.toDataURL("image/png");
      const win = window.open('', '_blank');
      win.document.write(`<html><head><title>In Hóa Đơn</title><style>@media print { .no-print { display: none !important; } body { background: #fff !important; padding: 0 !important; margin:0; } img { box-shadow: none !important; max-width: 100% !important; } }</style></head><body style="background:#f3f4f6; display:flex; flex-direction:column; align-items:center; padding:20px; font-family:sans-serif;"><div class="no-print" style="margin-bottom:20px; display:flex; gap:10px;"><button onclick="window.print()" style="padding:10px 20px; font-size:14px; font-weight:bold; cursor:pointer; background:#2563eb; color:white; border:none; border-radius:8px;">🖨️ Tiến Hành In</button><a href="${dataUrl}" download="HoaDon_${completedOrder?.id.slice(0,6)}.png" style="text-decoration:none; padding:10px 20px; font-size:14px; font-weight:bold; cursor:pointer; background:#10b981; color:white; border:none; border-radius:8px;">💾 Tải Ảnh Xuống</a></div><img src="${dataUrl}" style="max-width:100%; object-fit:contain; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" /></body></html>`);
      win.document.close();
    } catch (error) { showToast("Lỗi khi tạo ảnh hóa đơn", "error"); }
  };

  const isA4A5 = localPrintSize === 'A4' || localPrintSize === 'A5';
  const paperWidthClass = localPrintSize === 'K80' ? 'max-w-[300px]' : (localPrintSize === 'A4' ? 'max-w-[210mm]' : 'max-w-[148mm]');
  const activeCfg = storeConfig?.[localPrintSize] || storeConfig || {};
  const baseFontSize = Number(activeCfg.printFontSize) || 12;

  return (
    <div className="flex-1 flex flex-col lg:flex-row bg-gray-50 h-full overflow-hidden">
      <div className="flex-1 p-4 md:p-6 overflow-y-auto flex flex-col justify-between">
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
            <h2 className="text-xl font-bold text-gray-800">Sản phẩm bán hàng</h2>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select value={selectedCategory} onChange={e=>{ setSelectedCategory(e.target.value); setPosCurrentPage(1); }} className="p-2 border rounded-lg text-sm bg-white font-medium outline-none w-full sm:w-40"><option value="ALL">-- Tất cả Nhóm --</option>{categories.map((c, i) => <option key={i} value={c}>{c}</option>)}</select>
              <div className="relative flex-1 sm:w-64"><Search size={16} className="absolute left-3 top-3 text-gray-400"/><input placeholder="Tìm nhanh sản phẩm..." value={searchTerm} onChange={e=>{ setSearchTerm(e.target.value); setPosCurrentPage(1); }} className="w-full pl-9 pr-3 py-2 border rounded-lg bg-white outline-none text-sm"/></div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedProducts.map(p => {
              const stockClass = p.stock < 0 ? 'text-red-500 font-bold' : 'text-gray-500';
              return (
                <div key={p.id} onClick={() => addToCart(p)} className="bg-white p-3 rounded-xl border cursor-pointer hover:border-blue-400 shadow-sm transition transform hover:-translate-y-0.5">
                  {p.category && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold mb-1 inline-block">{p.category}</span>}
                  <h3 className="font-semibold text-sm text-gray-800 line-clamp-2">{p.name}</h3>
                  <div className="flex justify-between items-end mt-2"><p className="text-blue-600 font-bold">{formatCurrency(p.price)}</p><p className={"text-xs " + stockClass}>Kho: {p.stock}</p></div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-4 shrink-0 bg-white rounded-xl border shadow-sm">
          <PaginationControls currentPage={posCurrentPage} totalPages={totalPosPages} rowsPerPage={posRowsPerPage} onPageChange={(p) => setPosCurrentPage(p)} onRowsChange={(r) => { setPosRowsPerPage(r); setPosCurrentPage(1); }} totalItems={filteredProducts.length} />
        </div>
      </div>
      
      <div className="w-full lg:w-[420px] xl:w-[460px] bg-white border-l shadow-2xl shrink-0 flex flex-col z-20 h-[65vh] lg:h-auto">
        <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-white"><h2 className="font-black flex items-center gap-2 text-gray-800"><ShoppingCart size={20} className="text-blue-600"/> Giỏ hàng thanh toán</h2></div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
          {cart.map(item => (
            <div key={item.id} className="bg-white p-3 border border-gray-200 rounded-xl shadow-sm space-y-2.5">
              <div className="flex justify-between items-start"><h4 className="font-bold text-sm text-gray-800 pr-2">{item.name}</h4><button onClick={() => setCart(c => c.filter(i => i.id !== item.id))} className="text-red-400 hover:text-red-600 bg-red-50 p-1 rounded"><X size={14}/></button></div>
              <div className="flex justify-between items-center gap-2">
                <div><label className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Giá bán (đ)</label><input type="number" value={item.price} onChange={e => updatePrice(item.id, e.target.value)} className="w-28 p-1.5 border border-gray-300 rounded-lg text-sm font-bold text-blue-600 outline-none focus:border-blue-500"/></div>
                <div className="flex bg-gray-100 rounded-lg p-1 items-center border border-gray-200 shadow-inner"><button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 bg-white rounded-md shadow-sm text-gray-600 font-bold hover:bg-gray-50">-</button><span className="w-8 text-center text-sm font-bold">{item.quantity}</span><button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 bg-white rounded-md shadow-sm text-gray-600 font-bold hover:bg-gray-50">+</button></div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                <div><label className="text-[10px] text-gray-500 font-bold block mb-0.5">Bảo hành</label><div className="flex gap-1"><input type="number" placeholder="Số" value={item.warrantyValue || ''} onChange={e => updateItemField(item.id, 'warrantyValue', e.target.value)} className="w-12 p-1.5 border border-gray-300 rounded bg-gray-50 text-xs outline-none text-center font-bold"/><select value={item.warrantyUnit || 'tháng'} onChange={e => updateItemField(item.id, 'warrantyUnit', e.target.value)} className="p-1 border border-gray-300 rounded bg-gray-50 text-xs outline-none flex-1"><option value="ngày">Ngày</option><option value="tuần">Tuần</option><option value="tháng">Tháng</option><option value="năm">Năm</option></select></div></div>
                <div><label className="text-[10px] text-gray-500 font-bold block mb-0.5">Ghi chú (IMEI...)</label><input type="text" placeholder="Ghi chú..." value={item.note || ''} onChange={e => updateItemField(item.id, 'note', e.target.value)} className="w-full p-1.5 border border-gray-300 rounded bg-gray-50 text-xs outline-none"/></div>
              </div>
            </div>
          ))}
          {cart.length === 0 && <div className="text-center text-gray-400 py-10 text-sm font-medium">Chưa có sản phẩm nào trong giỏ</div>}
        </div>
        <div className="p-4 border-t bg-white space-y-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="flex flex-row items-center gap-2 w-full">
            <select value={customerId} onChange={e=>setCustomerId(e.target.value)} className="flex-1 min-w-0 p-2.5 border border-gray-300 rounded-xl outline-none text-sm bg-gray-50 focus:bg-white font-medium focus:ring-2 focus:ring-blue-500 transition-all"><option value="">-- Khách lẻ (Tiền mặt) --</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            <button type="button" onClick={() => setShowAddCusModal(true)} className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 shrink-0 whitespace-nowrap transition-colors shadow-sm"><Plus size={16}/> Thêm KH</button>
          </div>
          <textarea value={orderNote} onChange={e=>setOrderNote(e.target.value)} placeholder="Ghi chú đơn hàng..." className="w-full p-2.5 border border-gray-300 rounded-xl outline-none text-sm resize-none h-12 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"></textarea>
          <div className="flex gap-2"><button onClick={() => setIsDebt(false)} className={"flex-1 py-2.5 rounded-xl border-2 font-bold transition-all " + (!isDebt ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50')}>Tiền mặt</button><button onClick={() => setIsDebt(true)} className={"flex-1 py-2.5 rounded-xl border-2 font-bold transition-all " + (isDebt ? 'bg-orange-500 text-white border-orange-500 shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50')}>Ghi nợ</button></div>
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100 mt-2">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 cursor-pointer select-none"><input type="checkbox" checked={printInvoice} onChange={e => setPrintInvoice(e.target.checked)} className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"/> In hóa đơn</label>
            <div className="flex items-center gap-2"><span className="text-xs text-gray-500 font-bold">Khổ:</span><select value={localPrintSize} onChange={e => setLocalPrintSize(e.target.value)} className="text-xs bg-gray-100 px-2 py-1.5 rounded text-blue-700 font-bold border outline-none"><option value="K80">Bill (K80)</option><option value="A4">Giấy A4</option><option value="A5">Giấy A5</option></select></div>
          </div>
          <div className="flex justify-between items-end py-1"><span className="font-bold text-gray-500 text-sm uppercase tracking-wide">Cần thanh toán</span><span className="text-3xl font-black text-blue-600">{formatCurrency(cartTotal)}</span></div>
          <button onClick={handleCheckout} disabled={cart.length === 0 || (isDebt && !customerId)} className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white font-black py-4 rounded-xl shadow-lg hover:shadow-xl transition-all tracking-wider text-lg uppercase">Thanh Toán Ngay</button>
        </div>
      </div>

      <Modal isOpen={showAddCusModal} onClose={() => setShowAddCusModal(false)} title="Thêm Khách Hàng Nhanh">
        <form onSubmit={handleAddCustomerQuick} className="space-y-4">
          <input required placeholder="Tên khách hàng *" value={newCusForm.name} onChange={e=>setNewCusForm({...newCusForm, name:e.target.value})} className="w-full p-3 border rounded-xl outline-none text-sm bg-gray-50 focus:bg-white"/>
          <input placeholder="Số điện thoại" value={newCusForm.phone} onChange={e=>setNewCusForm({...newCusForm, phone:e.target.value})} className="w-full p-3 border rounded-xl outline-none text-sm bg-gray-50 focus:bg-white"/>
          <input placeholder="Địa chỉ" value={newCusForm.address} onChange={e=>setNewCusForm({...newCusForm, address:e.target.value})} className="w-full p-3 border rounded-xl outline-none text-sm bg-gray-50 focus:bg-white"/>
          <button type="submit" className="w-full bg-blue-600 text-white font-bold p-3.5 rounded-xl text-sm shadow-md hover:shadow-lg transition-all">Lưu & Chọn Khách Hàng</button>
        </form>
      </Modal>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Hóa đơn Bán hàng" maxWidth="max-w-2xl">
        {completedOrder && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-emerald-50 border border-emerald-100 p-3 rounded-xl shadow-sm">
              <span className="text-sm font-bold text-emerald-800 flex items-center gap-1"><CheckCircle2 size={16}/> Thanh toán thành công!</span>
              <div className="flex gap-2"><button onClick={handlePrintAsImage} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors"><Printer size={16}/> In Hóa Đơn</button></div>
            </div>
            <div id="print-invoice-area-pos" className={`bg-white shadow-xl border border-gray-200 mx-auto transition-all ${paperWidthClass}`} style={{ fontSize: `${baseFontSize}px`, padding: isA4A5 ? '20px' : '15px', color: '#000', fontFamily: 'sans-serif' }}>
              <ReceiptTemplate order={completedOrder} storeConfig={storeConfig} isA4A5={isA4A5} baseFontSize={baseFontSize} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function SalesHistoryView({ orders, products, customers, storeConfig, db, storeId, user, showToast }) {
  const currentDate = new Date();
  const [filterType, setFilterType] = useState('day');
  const [selectedDate, setSelectedDate] = useState(currentDate.toISOString().split('T')[0]);
  const [filterMonth, setFilterMonth] = useState((currentDate.getMonth() + 1).toString());
  const [filterYear, setFilterYear] = useState(currentDate.getFullYear().toString());
  const [searchTerm, setSearchTerm] = useState('');
  const [salesRowsPerPage, setSalesRowsPerPage] = useState('10');
  const [salesCurrentPage, setSalesCurrentPage] = useState(1);
  const [editingOrder, setEditingOrder] = useState(null);
  const [viewingOrderPrint, setViewingOrderPrint] = useState(null);
  const [localPrintSize, setLocalPrintSize] = useState(storeConfig.printPaperSize || 'K80');
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const [newOrderForm, setNewOrderForm] = useState({ customerId: '', status: 'PAID', note: '', items: [] });
  const [showAddCusModal, setShowAddCusModal] = useState(false);
  const [newCusForm, setNewCusForm] = useState({ name: '', phone: '', address: '' });

  useEffect(() => { setLocalPrintSize(storeConfig.printPaperSize || 'K80'); }, [storeConfig.printPaperSize]);
  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === 'Escape') setViewingOrderPrint(null); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handlePrintAsImage = async () => {
    if (!window.html2canvas) return showToast("Đang tải thư viện xử lý ảnh...", "error");
    const element = document.getElementById("print-invoice-area");
    if (!element) return;
    try {
      const canvas = await window.html2canvas(element, { scale: 2, useCORS: true });
      const dataUrl = canvas.toDataURL("image/png");
      const win = window.open('', '_blank');
      win.document.write(`<html><head><title>Hóa Đơn Bán Hàng</title><style>@media print { .no-print { display: none !important; } body { background: #fff !important; padding: 0 !important; margin:0;} img { box-shadow: none !important; max-width: 100% !important; } }</style></head><body style="background:#f3f4f6; display:flex; flex-direction:column; align-items:center; padding:20px; font-family:sans-serif;"><div class="no-print" style="margin-bottom:20px; display:flex; gap:10px;"><button onclick="window.print()" style="padding:10px 20px; font-size:14px; font-weight:bold; cursor:pointer; background:#2563eb; color:white; border:none; border-radius:8px;">🖨️ Tiến Hành In</button><a href="${dataUrl}" download="HoaDon_${viewingOrderPrint?.id.slice(0,6)}.png" style="text-decoration:none; padding:10px 20px; font-size:14px; font-weight:bold; cursor:pointer; background:#10b981; color:white; border:none; border-radius:8px;">💾 Tải Ảnh Xuống</a></div><img src="${dataUrl}" style="max-width:100%; object-fit:contain; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" /></body></html>`);
      win.document.close();
    } catch (error) { showToast("Lỗi khi tạo ảnh hóa đơn", "error"); }
  };

  const filteredOrders = useMemo(() => {
    return (orders || []).filter(o => {
      const d = new Date(o.date);
      let matchTime = true;
      if (filterType === 'day') { matchTime = d.toISOString().split('T')[0] === selectedDate; }
      else if (filterType === 'month') { matchTime = (d.getMonth() + 1).toString() === filterMonth && d.getFullYear().toString() === filterYear; }
      else if (filterType === 'year') { matchTime = d.getFullYear().toString() === filterYear; }
      const matchSearch = (o.customerName && o.customerName.toLowerCase().includes(searchTerm.toLowerCase())) || (o.id && o.id.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchTime && matchSearch;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [orders, filterType, selectedDate, filterMonth, filterYear, searchTerm]);

  const paginatedOrders = useMemo(() => {
    if (salesRowsPerPage === 'all') return filteredOrders;
    const limit = parseInt(salesRowsPerPage) || 10;
    const start = (salesCurrentPage - 1) * limit;
    return filteredOrders.slice(start, start + limit);
  }, [filteredOrders, salesRowsPerPage, salesCurrentPage]);
  const totalSalesPages = salesRowsPerPage === 'all' ? 1 : Math.ceil(filteredOrders.length / (parseInt(salesRowsPerPage) || 10));

  const summaryStats = useMemo(() => {
    let totalRevenue = 0; let totalCost = 0;
    filteredOrders.forEach(o => { totalRevenue += (Number(o.total) || 0); totalCost += (Number(o.totalCost) || 0); });
    return { count: filteredOrders.length, revenue: totalRevenue, cost: totalCost, profit: totalRevenue - totalCost };
  }, [filteredOrders]);

  const handleDeleteOrder = async (order) => {
    if (window.confirm("CẢNH BÁO: Xóa hóa đơn này sẽ hoàn lại tồn kho cho sản phẩm. Bạn có chắc chắn muốn xóa?")) {
      try {
        let batch = writeBatch(db);
        for (let item of (order.items || [])) {
          const matchedProd = products.find(p => p.id === item.id);
          if (matchedProd) batch.update(doc(db, 'stores', storeId, 'products', matchedProd.id), { stock: Number(matchedProd.stock || 0) + Number(item.quantity || 1) });
        }
        batch.delete(doc(db, 'stores', storeId, 'orders', order.id));
        await batch.commit();
        showToast("Đã xóa hóa đơn và hoàn kho thành công!");
      } catch (err) { showToast("Lỗi khi xóa hóa đơn", "error"); }
    }
  };

  const handleSaveEditOrder = async (e) => {
    e.preventDefault();
    try {
      let newTotal = 0; let newTotalCost = 0;
      const updatedItems = editingOrder.items.map(it => {
        const qty = Number(it.quantity) || 0; const price = Number(it.price) || 0; const cost = Number(it.cost) || 0;
        newTotal += (price * qty); newTotalCost += (cost * qty);
        return {...it, quantity: qty, price: price};
      });
      await updateDoc(doc(db, 'stores', storeId, 'orders', editingOrder.id), { customerName: editingOrder.customerName, note: editingOrder.note, status: editingOrder.status, items: updatedItems, total: newTotal, totalCost: newTotalCost });
      setEditingOrder(null);
      showToast("Cập nhật hóa đơn thành công!");
    } catch (err) { showToast("Lỗi cập nhật hóa đơn", "error"); }
  };

  const handleAddCustomerQuick = async (e) => {
    e.preventDefault();
    try {
      const docRef = await addDoc(collection(db, 'stores', storeId, 'customers'), { name: newCusForm.name, phone: newCusForm.phone || '', address: newCusForm.address || '', totalDebt: 0, createdAt: new Date().toISOString() });
      setNewOrderForm(prev => ({...prev, customerId: docRef.id}));
      setShowAddCusModal(false); setNewCusForm({ name: '', phone: '', address: '' });
      showToast("Đã thêm và chọn khách hàng mới!");
    } catch (err) { showToast("Lỗi thêm khách hàng", "error"); }
  };

  const handleSaveNewOrder = async (e) => {
    e.preventDefault();
    if (newOrderForm.items.length === 0) return showToast("Vui lòng thêm ít nhất 1 sản phẩm vào đơn", "error");
    try {
      let total = 0; let totalCost = 0;
      const itemsToSave = newOrderForm.items.map(it => {
        const qty = Number(it.quantity) || 0; const price = Number(it.price) || 0; const cost = Number(it.cost) || 0;
        total += (qty * price); totalCost += (qty * cost);
        return { ...it, quantity: qty, price, cost };
      });
      const c = customers.find(cust => cust.id === newOrderForm.customerId);
      const orderData = {
        customerId: newOrderForm.customerId || null, customerName: c ? c.name : 'Khách lẻ', sellerUid: user.uid, note: newOrderForm.note,
        items: itemsToSave, total: total, totalCost: totalCost, status: newOrderForm.status, date: new Date().toISOString()
      };
      await addDoc(collection(db, 'stores', storeId, 'orders'), orderData);
      
      let batch = writeBatch(db);
      itemsToSave.forEach(item => {
        const p = products.find(prod => prod.id === item.id);
        if (p) batch.update(doc(db, 'stores', storeId, 'products', p.id), { stock: p.stock - item.quantity });
      });
      if (newOrderForm.status === 'DEBT' && c) batch.update(doc(db, 'stores', storeId, 'customers', newOrderForm.customerId), { totalDebt: (c.totalDebt || 0) + total });
      await batch.commit();
      
      setShowCreateOrderModal(false); showToast("Tạo đơn hàng mới thành công!");
    } catch (err) { showToast("Lỗi khi tạo đơn hàng", "error"); }
  };

  const handleAddNewItemToForm = () => setNewOrderForm(prev => ({ ...prev, items: [...prev.items, { id: '', name: '', price: 0, cost: 0, quantity: 1, warrantyValue: '', warrantyUnit: 'tháng', note: '' }] }));

  const isA4A5 = localPrintSize === 'A4' || localPrintSize === 'A5';
  const paperWidthClass = localPrintSize === 'K80' ? 'max-w-[300px]' : (localPrintSize === 'A4' ? 'max-w-[210mm]' : 'max-w-[148mm]');
  const activeCfg = storeConfig?.[localPrintSize] || storeConfig || {};
  const baseFontSize = Number(activeCfg.printFontSize) || 12;

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 bg-gray-50 overflow-hidden h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Receipt className="text-blue-600"/> Quản lý Bán Hàng</h2>
          <p className="text-sm text-gray-500 mt-0.5">Theo dõi lịch sử giao dịch và in lại hóa đơn (Theo cấu hình mẫu in)</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button onClick={() => { setNewOrderForm({ customerId: '', status: 'PAID', note: '', items: [] }); setShowCreateOrderModal(true); }} className="bg-blue-600 text-white px-4 py-2.5 rounded-lg font-bold flex gap-2 shrink-0 items-center shadow-sm whitespace-nowrap"> <Plus size={16}/> <span>Tạo đơn</span> </button>
          <div className="relative flex-1 sm:w-72">
            <Search size={16} className="absolute left-3 top-3.5 text-gray-400"/>
            <input placeholder="Tìm mã HĐ hoặc tên khách..." value={searchTerm} onChange={e=>{ setSearchTerm(e.target.value); setSalesCurrentPage(1); }} className="w-full pl-9 pr-3 py-2.5 border rounded-xl bg-white outline-none shadow-sm focus:ring-2 focus:ring-blue-500 transition-all"/>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border shadow-sm mb-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex flex-wrap items-center gap-2 bg-gray-100 p-1 rounded-xl">
          <button onClick={() => { setFilterType('day'); setSalesCurrentPage(1); }} className={"px-4 py-2 rounded-lg text-sm font-bold transition-all " + (filterType==='day'?'bg-white text-blue-600 shadow-sm':'text-gray-600 hover:bg-white/50')}>Ngày</button>
          <button onClick={() => { setFilterType('month'); setSalesCurrentPage(1); }} className={"px-4 py-2 rounded-lg text-sm font-bold transition-all " + (filterType==='month'?'bg-white text-blue-600 shadow-sm':'text-gray-600 hover:bg-white/50')}>Tháng</button>
          <button onClick={() => { setFilterType('year'); setSalesCurrentPage(1); }} className={"px-4 py-2 rounded-lg text-sm font-bold transition-all " + (filterType==='year'?'bg-white text-blue-600 shadow-sm':'text-gray-600 hover:bg-white/50')}>Năm</button>
          <button onClick={() => { setFilterType('all'); setSalesCurrentPage(1); }} className={"px-4 py-2 rounded-lg text-sm font-bold transition-all " + (filterType==='all'?'bg-white text-blue-600 shadow-sm':'text-gray-600 hover:bg-white/50')}>Tất cả</button>
        </div>
        <div className="flex items-center gap-2">
          {filterType === 'day' && (<input type="date" value={selectedDate} onChange={e=>{ setSelectedDate(e.target.value); setSalesCurrentPage(1); }} className="p-2 border rounded-xl text-sm bg-gray-50 font-bold outline-none"/>)}
          {filterType === 'month' && (
            <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border">
              <select value={filterMonth} onChange={e=>{ setFilterMonth(e.target.value); setSalesCurrentPage(1); }} className="bg-transparent text-sm font-bold outline-none">{Array.from({length: 12}, (_, i) => <option key={i+1} value={i+1}>Tháng {i+1}</option>)}</select>
              <span className="text-gray-300">|</span>
              <select value={filterYear} onChange={e=>{ setFilterYear(e.target.value); setSalesCurrentPage(1); }} className="bg-transparent text-sm font-bold outline-none">{Array.from({length: 5}, (_, i) => currentDate.getFullYear() - i).map(y => <option key={y} value={y}>{y}</option>)}</select>
            </div>
          )}
          {filterType === 'year' && (<select value={filterYear} onChange={e=>{ setFilterYear(e.target.value); setSalesCurrentPage(1); }} className="p-2.5 border rounded-xl text-sm bg-gray-50 font-bold outline-none">{Array.from({length: 5}, (_, i) => currentDate.getFullYear() - i).map(y => <option key={y} value={y}>Năm {y}</option>)}</select>)}
        </div>
        <div className="grid grid-cols-3 gap-3 w-full lg:w-auto">
          <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 text-center"><p className="text-[10px] text-blue-600 font-bold uppercase">Tổng Hóa Đơn</p><p className="text-base font-black text-blue-800">{summaryStats.count}</p></div>
          <div className="bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 text-center"><p className="text-[10px] text-gray-500 font-bold uppercase">Doanh Thu</p><p className="text-base font-black text-gray-800">{formatCurrency(summaryStats.revenue)}</p></div>
          <div className="bg-green-50 px-4 py-2 rounded-xl border border-green-100 text-center"><p className="text-[10px] text-green-600 font-bold uppercase">Tiền Lãi</p><p className="text-base font-black text-green-700">{formatCurrency(summaryStats.profit)}</p></div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col justify-between">
        <div className="overflow-auto flex-1">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/80 sticky top-0 border-b backdrop-blur-sm z-10">
              <tr>
                <th className="p-4 font-bold text-gray-600">Mã HĐ / Thời gian</th><th className="p-4 font-bold text-gray-600">Khách hàng</th><th className="p-4 font-bold text-gray-600">Chi tiết hàng bán & Bảo hành / Ghi chú</th><th className="p-4 font-bold text-gray-600">Tổng Tiền</th><th className="p-4 font-bold text-gray-600">Tiền Lãi</th><th className="p-4 font-bold text-gray-600">Trạng thái</th><th className="p-4 font-bold text-gray-600 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.map(o => {
                let orderTotalCost = o.totalCost || 0;
                if (!orderTotalCost && o.items) orderTotalCost = o.items.reduce((sum, it) => sum + (Number(it.cost || 0) * Number(it.quantity || 1)), 0);
                const orderProfit = (Number(o.total) || 0) - orderTotalCost;
                const statusClass = o.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700';
                return (
                  <tr key={o.id} className="border-b hover:bg-blue-50/50 transition-colors">
                    <td className="p-4"><p className="font-bold text-blue-600">#{o.id.slice(0,6).toUpperCase()}</p><p className="text-xs text-gray-400 mt-0.5">{formatDate(o.date)}</p></td>
                    <td className="p-4 font-bold text-gray-800">{o.customerName || 'Khách lẻ'}</td>
                    <td className="p-4">
                      <div className="space-y-1.5">
                        {o.items?.map((it, idx) => {
                          const itemQty = Number(it.quantity || 1); const itemPrice = Number(it.price || 0);
                          return (
                            <div key={idx} className="text-xs bg-gray-50 p-2.5 rounded-lg border border-gray-100 flex flex-col gap-1">
                              <div className="flex justify-between items-center"><span className="font-semibold text-gray-800">{it.name} (x{itemQty})</span><span className="text-blue-600 font-bold">{formatCurrency(itemPrice * itemQty)}</span></div>
                              {(it.warrantyValue || it.note) && ( <div className="text-[11px] text-gray-500 flex gap-3 mt-0.5 border-t pt-1">{it.warrantyValue && <span>🛡️ BH: <strong className="text-gray-700">{it.warrantyValue} {it.warrantyUnit}</strong></span>}{it.note && <span>📝 Ghi chú: <strong className="text-gray-700">{it.note}</strong></span>}</div> )}
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td className="p-4 font-black text-gray-900">{formatCurrency(o.total)}</td>
                    <td className="p-4 font-black text-green-600">{formatCurrency(orderProfit)}</td>
                    <td className="p-4"><span className={"px-3 py-1 rounded-lg text-xs font-bold " + statusClass}>{o.status === 'PAID' ? 'Đã thanh toán' : 'Ghi nợ'}</span></td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => setViewingOrderPrint(o)} title="In Hóa Đơn" className="text-emerald-600 bg-emerald-50 p-2 rounded-lg hover:bg-emerald-100 transition-colors"><Printer size={18}/></button>
                        <button onClick={() => setEditingOrder(JSON.parse(JSON.stringify(o)))} title="Chỉnh sửa hóa đơn" className="text-blue-600 bg-blue-50 p-2 rounded-lg hover:bg-blue-100 transition-colors"><Edit size={18}/></button>
                        <button onClick={() => handleDeleteOrder(o)} title="Xóa hóa đơn" className="text-red-600 bg-red-50 p-2 rounded-lg hover:bg-red-100 transition-colors"><Trash2 size={18}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginatedOrders.length === 0 && (<tr><td colSpan="7" className="p-12 text-center text-gray-400 font-medium">Không tìm thấy hóa đơn nào trong thời điểm này</td></tr>)}
            </tbody>
          </table>
        </div>
        <div className="border-t shrink-0"><PaginationControls currentPage={salesCurrentPage} totalPages={totalSalesPages} rowsPerPage={salesRowsPerPage} onPageChange={(p) => setSalesCurrentPage(p)} onRowsChange={(r) => { setSalesRowsPerPage(r); setSalesCurrentPage(1); }} totalItems={filteredOrders.length} /></div>
      </div>

      <Modal isOpen={showCreateOrderModal} onClose={() => setShowCreateOrderModal(false)} title="Tạo Đơn Hàng Mới (Trực tiếp)" maxWidth="max-w-3xl">
        <form onSubmit={handleSaveNewOrder} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Khách hàng</label>
              <div className="flex flex-row items-center gap-2 w-full">
                <select value={newOrderForm.customerId} onChange={e=>setNewOrderForm({...newOrderForm, customerId: e.target.value})} className="flex-1 min-w-0 p-3 border rounded-xl outline-none text-sm font-bold bg-gray-50 focus:bg-white transition-all"><option value="">-- Khách lẻ (Tiền mặt) --</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                <button type="button" onClick={() => setShowAddCusModal(true)} className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 px-3.5 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1 shrink-0 whitespace-nowrap transition-colors shadow-sm"><Plus size={16}/> Thêm KH</button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Trạng thái thanh toán</label>
              <select value={newOrderForm.status} onChange={e=>setNewOrderForm({...newOrderForm, status: e.target.value})} className="w-full p-3 border rounded-xl outline-none text-sm font-bold bg-gray-50 focus:bg-white"><option value="PAID">Đã thanh toán (Tiền mặt)</option><option value="DEBT">Ghi nợ</option></select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Ghi chú chung đơn hàng</label>
            <textarea value={newOrderForm.note} onChange={e=>setNewOrderForm({...newOrderForm, note: e.target.value})} className="w-full p-3 border rounded-xl outline-none text-sm resize-none h-16 bg-gray-50 focus:bg-white"></textarea>
          </div>
          <div className="border rounded-xl bg-gray-50 p-4 shadow-inner">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-bold text-gray-700">Chi tiết sản phẩm</label>
              <button type="button" onClick={handleAddNewItemToForm} className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"><Plus size={14}/> Thêm SP</button>
            </div>
            <div className="max-h-[40vh] overflow-y-auto space-y-3">
              {newOrderForm.items.map((it, idx) => (
                <div key={idx} className="flex flex-col gap-2 p-3 border rounded-xl bg-white shadow-sm relative pr-10">
                  <button type="button" onClick={() => setNewOrderForm(prev => ({...prev, items: prev.items.filter((_, i) => i !== idx)}))} className="absolute top-3 right-3 text-red-400 hover:text-red-600"><X size={18}/></button>
                  <div>
                    <label className="text-[10px] text-gray-500 font-bold uppercase">Chọn sản phẩm</label>
                    <select required value={it.id} onChange={e => { const p = products.find(x => x.id === e.target.value); const newItems = [...newOrderForm.items]; newItems[idx] = { ...newItems[idx], id: p.id, name: p.name, price: p.price, cost: p.cost }; setNewOrderForm({...newOrderForm, items: newItems}); }} className="w-full p-2 border rounded-lg text-sm font-bold bg-gray-50"><option value="">-- Chọn sản phẩm có sẵn --</option>{products.map(p => <option key={p.id} value={p.id}>{p.name} - {formatCurrency(p.price)}</option>)}</select>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div><label className="text-[10px] text-gray-500 font-bold uppercase">Số lượng</label><input type="number" min="1" required value={it.quantity} onChange={e => { const newItems = [...newOrderForm.items]; newItems[idx].quantity = e.target.value; setNewOrderForm({...newOrderForm, items: newItems}); }} className="w-full p-2 border rounded-lg text-sm font-bold text-center bg-gray-50" /></div>
                    <div><label className="text-[10px] text-gray-500 font-bold uppercase">Giá bán (đ)</label><input type="number" required value={it.price} onChange={e => { const newItems = [...newOrderForm.items]; newItems[idx].price = e.target.value; setNewOrderForm({...newOrderForm, items: newItems}); }} className="w-full p-2 border rounded-lg text-sm font-bold text-blue-600 text-center bg-gray-50" /></div>
                    <div><label className="text-[10px] text-gray-500 font-bold uppercase">Bảo hành</label><input type="number" placeholder="Số" value={it.warrantyValue} onChange={e => { const newItems = [...newOrderForm.items]; newItems[idx].warrantyValue = e.target.value; setNewOrderForm({...newOrderForm, items: newItems}); }} className="w-full p-2 border rounded-lg text-sm text-center bg-gray-50" /></div>
                    <div><label className="text-[10px] text-gray-500 font-bold uppercase">Đơn vị BH</label><select value={it.warrantyUnit} onChange={e => { const newItems = [...newOrderForm.items]; newItems[idx].warrantyUnit = e.target.value; setNewOrderForm({...newOrderForm, items: newItems}); }} className="w-full p-2 border rounded-lg text-sm bg-gray-50"><option value="ngày">Ngày</option><option value="tuần">Tuần</option><option value="tháng">Tháng</option><option value="năm">Năm</option></select></div>
                  </div>
                  <div><label className="text-[10px] text-gray-500 font-bold uppercase">Ghi chú riêng (IMEI, Serial...)</label><input type="text" placeholder="Nhập IMEI, Màu sắc..." value={it.note} onChange={e => { const newItems = [...newOrderForm.items]; newItems[idx].note = e.target.value; setNewOrderForm({...newOrderForm, items: newItems}); }} className="w-full p-2 border rounded-lg text-sm bg-gray-50" /></div>
                </div>
              ))}
              {newOrderForm.items.length === 0 && <div className="text-center text-gray-400 py-4 text-sm font-medium">Bạn chưa chọn sản phẩm nào</div>}
            </div>
            <div className="mt-4 pt-3 border-t flex justify-between items-center"><span className="font-bold text-gray-700">Tổng cộng:</span><span className="font-black text-blue-600 text-lg">{formatCurrency(newOrderForm.items.reduce((s, it) => s + (Number(it.quantity)||0) * (Number(it.price)||0), 0))}</span></div>
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-4 rounded-xl shadow-lg transition-all text-lg uppercase tracking-wider">Hoàn tất Tạo Đơn Hàng</button>
        </form>
      </Modal>

      <Modal isOpen={showAddCusModal} onClose={() => setShowAddCusModal(false)} title="Thêm Khách Hàng Nhanh">
        <form onSubmit={handleAddCustomerQuick} className="space-y-4">
          <input required placeholder="Tên khách hàng *" value={newCusForm.name} onChange={e=>setNewCusForm({...newCusForm, name:e.target.value})} className="w-full p-3 border rounded-xl outline-none text-sm bg-gray-50 focus:bg-white"/>
          <input placeholder="Số điện thoại" value={newCusForm.phone} onChange={e=>setNewCusForm({...newCusForm, phone:e.target.value})} className="w-full p-3 border rounded-xl outline-none text-sm bg-gray-50 focus:bg-white"/>
          <input placeholder="Địa chỉ" value={newCusForm.address} onChange={e=>setNewCusForm({...newCusForm, address:e.target.value})} className="w-full p-3 border rounded-xl outline-none text-sm bg-gray-50 focus:bg-white"/>
          <button type="submit" className="w-full bg-blue-600 text-white font-bold p-3.5 rounded-xl text-sm shadow-md hover:shadow-lg transition-all">Lưu & Chọn Khách Hàng</button>
        </form>
      </Modal>

      <Modal isOpen={!!editingOrder} onClose={() => setEditingOrder(null)} title="Chỉnh sửa Hóa đơn" maxWidth="max-w-2xl">
        {editingOrder && (
          <form onSubmit={handleSaveEditOrder} className="space-y-5">
            <div><label className="block text-sm font-bold text-gray-700 mb-1">Tên khách hàng</label><input required value={editingOrder.customerName || ''} onChange={e=>setEditingOrder({...editingOrder, customerName: e.target.value})} className="w-full p-3 border rounded-xl outline-none text-sm font-bold bg-gray-50 focus:bg-white"/></div>
            <div><label className="block text-sm font-bold text-gray-700 mb-1">Trạng thái thanh toán</label><select value={editingOrder.status} onChange={e=>setEditingOrder({...editingOrder, status: e.target.value})} className="w-full p-3 border rounded-xl outline-none text-sm font-bold bg-gray-50 focus:bg-white"><option value="PAID">Đã thanh toán (Tiền mặt)</option><option value="DEBT">Ghi nợ</option></select></div>
            <div><label className="block text-sm font-bold text-gray-700 mb-1">Ghi chú đơn hàng chung</label><textarea value={editingOrder.note || ''} onChange={e=>setEditingOrder({...editingOrder, note: e.target.value})} className="w-full p-3 border rounded-xl outline-none text-sm resize-none h-16 bg-gray-50 focus:bg-white"></textarea></div>
            <div className="max-h-[30vh] overflow-y-auto space-y-3 p-4 border rounded-xl bg-gray-50 shadow-inner">
              <label className="block text-sm font-bold text-gray-700">Chi tiết sản phẩm trong đơn</label>
              {editingOrder.items?.map((it, idx) => (
                <div key={idx} className="flex flex-col gap-2 p-4 border rounded-xl bg-white shadow-sm">
                  <div className="font-bold text-sm text-blue-700">{it.name}</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div><label className="text-[10px] text-gray-500 font-bold uppercase">Số lượng</label><input type="number" value={it.quantity} onChange={e => { const newItems = [...editingOrder.items]; newItems[idx].quantity = e.target.value; setEditingOrder({...editingOrder, items: newItems}); }} className="w-full p-2 border rounded-lg text-sm font-bold text-center bg-gray-50" /></div>
                    <div><label className="text-[10px] text-gray-500 font-bold uppercase">Giá bán (đ)</label><input type="number" value={it.price} onChange={e => { const newItems = [...editingOrder.items]; newItems[idx].price = e.target.value; setEditingOrder({...editingOrder, items: newItems}); }} className="w-full p-2 border rounded-lg text-sm font-bold text-blue-600 text-center bg-gray-50" /></div>
                    <div><label className="text-[10px] text-gray-500 font-bold uppercase">Bảo hành</label><input type="number" placeholder="Số" value={it.warrantyValue||''} onChange={e => { const newItems = [...editingOrder.items]; newItems[idx].warrantyValue = e.target.value; setEditingOrder({...editingOrder, items: newItems}); }} className="w-full p-2 border rounded-lg text-sm text-center bg-gray-50" /></div>
                    <div><label className="text-[10px] text-gray-500 font-bold uppercase">Đơn vị BH</label><select value={it.warrantyUnit||'tháng'} onChange={e => { const newItems = [...editingOrder.items]; newItems[idx].warrantyUnit = e.target.value; setEditingOrder({...editingOrder, items: newItems}); }} className="w-full p-2 border rounded-lg text-sm bg-gray-50"><option value="ngày">Ngày</option><option value="tuần">Tuần</option><option value="tháng">Tháng</option><option value="năm">Năm</option></select></div>
                  </div>
                  <div><label className="text-[10px] text-gray-500 font-bold uppercase">Ghi chú riêng</label><input type="text" placeholder="IMEI, Serial..." value={it.note||''} onChange={e => { const newItems = [...editingOrder.items]; newItems[idx].note = e.target.value; setEditingOrder({...editingOrder, items: newItems}); }} className="w-full p-2 border rounded-lg text-sm bg-gray-50" /></div>
                </div>
              ))}
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-3.5 rounded-xl text-sm shadow-md transition-all">Lưu Thay Đổi</button>
          </form>
        )}
      </Modal>

      <Modal isOpen={!!viewingOrderPrint} onClose={() => setViewingOrderPrint(null)} title="In Hóa Đơn (Theo Cấu hình)" maxWidth="max-w-2xl">
        {viewingOrderPrint && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-gray-100 p-3 rounded-xl border">
              <div className="flex items-center gap-2"><span className="text-xs font-bold text-gray-600">Khổ in:</span><select value={localPrintSize} onChange={e => setLocalPrintSize(e.target.value)} className="text-xs font-bold text-blue-700 bg-white px-2 py-1.5 rounded shadow-sm border outline-none"><option value="K80">Bill (K80)</option><option value="A4">Giấy A4</option><option value="A5">Giấy A5</option></select></div>
              <div className="flex gap-2"><button onClick={handlePrintAsImage} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5 shadow-md"><Printer size={16}/> In Ảnh Trực Tiếp</button></div>
            </div>
            <div id="print-invoice-area" className={`bg-white shadow-xl border border-gray-200 mx-auto transition-all ${paperWidthClass}`} style={{ fontSize: `${baseFontSize}px`, padding: isA4A5 ? '20px' : '15px', color: '#000', fontFamily: 'sans-serif' }}>
              <ReceiptTemplate order={viewingOrderPrint} storeConfig={storeConfig} isA4A5={isA4A5} baseFontSize={baseFontSize} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function StaffManagerView({ db, showToast }) {
  const [staff, setStaff] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ id: '', name: '', username: '', password: '', confirmPassword: '', role: 'seller', perms: {} });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubStaff = onSnapshot(collection(db, 'users_db'), (s) => setStaff(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const qLogs = query(collection(db, 'login_logs'), orderBy('loginTime', 'desc'));
    const unsubLogs = onSnapshot(qLogs, (s) => setLogs(s.docs.map(d => ({ id: d.id, ...d.data() })).slice(0, 50)));
    return () => { unsubStaff(); unsubLogs(); };
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (form.password && form.password !== form.confirmPassword) { showToast("Mật khẩu và Xác nhận mật khẩu không khớp!", "error"); return; }
    setLoading(true);
    try {
      if (form.id) {
        await updateDoc(doc(db, 'users_db', form.id), { role: form.role, permissions: form.perms, ...(form.password ? { password: form.password } : {}) });
        showToast("Đã cập nhật thông tin & mật khẩu nhân viên thành công!");
        setIsModalOpen(false);
      } else {
        const cleanUsername = form.username.toLowerCase().trim();
        const q = query(collection(db, 'users_db'), where('username', '==', cleanUsername));
        const checkExist = await getDocs(q);
        if (!checkExist.empty) throw new Error("Tên đăng nhập (username) này đã tồn tại!");
        await addDoc(collection(db, 'users_db'), { username: cleanUsername, password: form.password, name: form.name.trim(), role: form.role, permissions: form.perms || {}, createdAt: new Date().toISOString() });
        showToast("Tạo tài khoản nhân viên mới thành công!");
        setIsModalOpen(false);
      }
    } catch (err) { showToast("Lỗi: " + (err.message || "Không thể lưu nhân viên"), "error"); } finally { setLoading(false); }
  };

  const handleDeleteStaff = async (staffMember) => {
    if (window.confirm(`CẢNH BÁO: Bạn có chắc chắn muốn xóa tài khoản nhân viên "${staffMember.name}" khỏi hệ thống không?`)) {
      try { await deleteDoc(doc(db, 'users_db', staffMember.id)); showToast("Đã xóa nhân viên thành công!"); } catch (err) { showToast("Lỗi khi xóa nhân viên", "error"); }
    }
  };

  const openAddModal = () => { setForm({ id: '', name: '', username: '', password: '', confirmPassword: '', role: 'seller', perms: {} }); setShowPassword(false); setShowConfirmPassword(false); setIsModalOpen(true); };
  const openEditModal = (s) => { setForm({ id: s.id, name: s.name, username: s.username, password: '', confirmPassword: '', role: s.role, perms: s.permissions || {} }); setShowPassword(false); setShowConfirmPassword(false); setIsModalOpen(true); };
  const modalTitle = form.id ? "Sửa quyền & Reset mật khẩu: " + form.name : "Thêm Nhân Viên Mới";

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 bg-gray-50 overflow-auto h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2"><UserCog/> Quản trị Nhân viên</h2>
        <button onClick={openAddModal} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"><Plus size={18}/> Thêm Nhân viên</button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full min-h-[500px]">
        <div className="bg-white border rounded-xl overflow-auto shadow-sm">
          <div className="p-3 bg-gray-100 font-bold sticky top-0 border-b">Danh sách Tài khoản</div>
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b"> <tr><th className="p-3">Tên & Username</th><th className="p-3">Quyền</th><th className="p-3 text-right">Thao tác</th></tr> </thead>
            <tbody>
              {staff.map(s => {
                const roleClass = s.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700';
                return (
                  <tr key={s.id} className="border-b hover:bg-gray-50">
                    <td className="p-3"><p className="font-bold text-gray-800">{s.name}</p><p className="text-xs text-gray-500">@{s.username}</p></td>
                    <td className="p-3"><span className={"px-2 py-1 rounded text-xs font-bold " + roleClass}>{s.role.toUpperCase()}</span></td>
                    <td className="p-3 text-right flex justify-end gap-1.5">
                      <button onClick={() => openEditModal(s)} className="text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg font-medium text-xs">Sửa quyền / Đổi MK</button>
                      <button onClick={() => handleDeleteStaff(s)} className="text-red-600 bg-red-50 p-1.5 rounded-lg hover:bg-red-100" title="Xóa nhân viên"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="bg-white border rounded-xl overflow-auto shadow-sm">
          <div className="p-3 bg-gray-100 font-bold sticky top-0 border-b">Lịch sử Đăng nhập (Giám sát)</div>
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 border-b"><tr><th className="p-3">Thời gian</th><th className="p-3">Username</th><th className="p-3">Thiết bị & IP</th></tr></thead>
            <tbody>{logs.map(l => (<tr key={l.id} className="border-b hover:bg-gray-50"><td className="p-3 text-gray-500">{formatDate(l.loginTime)}</td><td className="p-3 font-bold text-blue-600">{l.username}</td><td className="p-3"><p>{l.device}</p><p className="text-gray-400 font-mono">{l.ip}</p></td></tr>))}</tbody>
          </table>
        </div>
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalTitle} maxWidth="max-w-2xl">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
            <div className="col-span-2"><input required placeholder="Tên nhân viên *" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} className="w-full p-2.5 border rounded outline-none text-sm bg-white"/></div>
            <div><input required placeholder="Username đăng nhập *" value={form.username} onChange={e=>setForm({...form, username:e.target.value})} disabled={!!form.id} className="w-full p-2.5 border rounded outline-none text-sm bg-white disabled:bg-gray-100"/></div>
            <div>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} placeholder={form.id ? "Mật khẩu mới (Bỏ trống nếu không đổi)" : "Mật khẩu *"} required={!form.id} value={form.password} onChange={e=>setForm({...form, password:e.target.value})} className="w-full p-2.5 pr-10 border rounded outline-none text-sm bg-white font-medium" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"> {showPassword ? <EyeOff size={16} /> : <Eye size={16} />} </button>
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-500 mb-1">Xác nhận mật khẩu</label>
              <div className="relative">
                <input type={showConfirmPassword ? "text" : "password"} placeholder="Nhập lại mật khẩu *" required={!form.id || !!form.password} value={form.confirmPassword} onChange={e=>setForm({...form, confirmPassword:e.target.value})} className="w-full p-2.5 pr-10 border rounded outline-none text-sm bg-white font-medium" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"> {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />} </button>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Vai trò tài khoản</label>
            <select value={form.role} onChange={e=>setForm({...form, role: e.target.value})} className="w-full p-2.5 border rounded font-bold outline-none text-sm bg-white">
              <option value="seller">Nhân viên (Theo check-box phân quyền bên dưới)</option>
              <option value="admin">Quản trị viên (Toàn quyền)</option>
            </select>
          </div>
          {form.role === 'seller' && (
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Phân quyền chức năng</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[40vh] overflow-y-auto p-4 border rounded bg-gray-50">
                {PERMISSION_TREE.map(g => (<div key={g.module} className="border-b pb-2"><p className="font-bold text-blue-800 text-sm mb-2 uppercase">{g.module}</p>{g.perms.map(p => (<label key={p.id} className="flex items-center gap-2 text-sm mb-1.5 cursor-pointer hover:bg-gray-200 p-1 rounded"><input type="checkbox" checked={!!form.perms[p.id]} onChange={() => setForm({...form, perms: {...form.perms, [p.id]: !form.perms[p.id]}})} className="w-4 h-4 text-blue-600"/> {p.label}</label>))}</div>))}
              </div>
            </div>
          )}
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold p-3 rounded-lg">{loading ? 'Đang xử lý...' : 'Lưu Dữ Liệu'}</button>
        </form>
      </Modal>
    </div>
  );
}

function ContactManager({ type, data, orders, storeConfig, db, storeId, showToast }) {
  const isCus = type === 'customers'; const title = isCus ? "Khách Hàng" : "Nhà Cung Cấp";
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({});
  const [sortOrder, setSortOrder] = useState('none');
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [detailTarget, setDetailTarget] = useState(null);
  const currentDate = new Date();
  const [filterMonth, setFilterMonth] = useState((currentDate.getMonth() + 1).toString());
  const [filterYear, setFilterYear] = useState(currentDate.getFullYear().toString());
  const [rowsPerPage, setRowsPerPage] = useState('10');
  const [currentPage, setCurrentPage] = useState(1);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const nowIso = new Date().toISOString();
      const p = { name: form.name, phone: form.phone || '', address: form.address || '', totalDebt: Number(form.totalDebt || 0), createdAt: form.createdAt || nowIso };
      if (form.id) await updateDoc(doc(db, 'stores', storeId, type, form.id), p);
      else await addDoc(collection(db, 'stores', storeId, type), p);
      setIsModalOpen(false); showToast("Đã lưu thành công");
    } catch (e) { showToast("Lỗi", "error"); }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa?")) {
      await deleteDoc(doc(db, 'stores', storeId, type, id)); showToast("Đã xóa thành công");
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm("Xác nhận xóa " + selectedIds.length + " mục đã chọn?")) {
      let batch = writeBatch(db);
      selectedIds.forEach(id => batch.delete(doc(db, 'stores', storeId, type, id)));
      await batch.commit(); setSelectedIds([]); showToast("Đã xóa các mục đã chọn");
    }
  };

  const handlePrintDetail = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>In Thông Tin Chi Tiết - ${title}</title><style>body { font-family: sans-serif; padding: 20px; color: #333; } h2 { text-align: center; color: #1e3a8a; } .info { margin-bottom: 20px; border-bottom: 1px solid #ddd; padding-bottom: 10px; } table { width: 100%; border-collapse: collapse; margin-top: 10px; } th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; } th { background-color: #f3f4f6; } .text-right { text-align: right; }</style></head><body>
      <h2>CHI TIẾT ${title.toUpperCase()}</h2>
      <div class="info"><p><strong>Tên:</strong> ${detailTarget?.name}</p><p><strong>SĐT:</strong> ${detailTarget?.phone || 'Trống'}</p><p><strong>Địa chỉ:</strong> ${detailTarget?.address || 'Trống'}</p><p><strong>Tổng Nợ:</strong> ${formatCurrency(detailTarget?.totalDebt)}</p></div>
      <h3>Lịch sử giao dịch trong kỳ</h3>
      <table><thead><tr><th>Thời gian</th><th>Mặt hàng</th><th class="text-right">Giá trị</th><th>Trạng thái</th></tr></thead>
      <tbody>${detailData.list.map(ord => `<tr><td>${formatDate(ord.date)}</td><td>${(ord.items || []).map(i => `${i.name} (x${i.quantity || i.qty || 1})`).join(', ')}</td><td class="text-right">${formatCurrency(ord.total)}</td><td>${ord.status === 'PAID' ? 'Đã trả' : 'Đang nợ'}</td></tr>`).join('')}</tbody></table>
      <script>window.print();</script></body></html>
    `);
    printWindow.document.close();
  };

  const bannerStats = useMemo(() => {
    const filteredOrders = (orders || []).filter(o => {
      const d = new Date(o.date);
      return (filterMonth === 'ALL' || (d.getMonth() + 1).toString() === filterMonth) && d.getFullYear().toString() === filterYear;
    });
    const totalDebt = data.reduce((s, i) => s + (Number(i.totalDebt) || 0), 0);
    const totalTraded = filteredOrders.reduce((s, o) => s + (Number(o.total) || 0), 0);
    const totalPaid = filteredOrders.filter(o => o.status === 'PAID').reduce((s, o) => s + (Number(o.total) || 0), 0);
    return { totalDebt, totalTraded, totalPaid, balance: totalTraded - totalPaid };
  }, [data, orders, filterMonth, filterYear]);

  const filteredData = useMemo(() => {
    return data.filter(i => {
      const matchName = i.name && i.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchPhone = i.phone && i.phone.includes(searchTerm);
      return matchName || matchPhone;
    });
  }, [data, searchTerm]);

  const sortedData = useMemo(() => {
    if (sortOrder === 'none') return filteredData;
    return [...filteredData].sort((a, b) => sortOrder === 'asc' ? a.totalDebt - b.totalDebt : b.totalDebt - a.totalDebt);
  }, [filteredData, sortOrder]);

  const paginatedData = useMemo(() => {
    if (rowsPerPage === 'all') return sortedData;
    const limit = parseInt(rowsPerPage) || 10;
    const start = (currentPage - 1) * limit;
    return sortedData.slice(start, start + limit);
  }, [sortedData, rowsPerPage, currentPage]);
  const totalPages = rowsPerPage === 'all' ? 1 : Math.ceil(sortedData.length / (parseInt(rowsPerPage) || 10));

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

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 bg-gray-50 overflow-hidden h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <h2 className="text-2xl font-bold text-gray-800">Quản lý {title}</h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64"><Search size={16} className="absolute left-3 top-3 text-gray-400"/><input placeholder={`Tìm kiếm ${title.toLowerCase()}...`} value={searchTerm} onChange={e=>{ setSearchTerm(e.target.value); setCurrentPage(1); }} className="w-full pl-9 pr-3 py-2 border rounded-lg bg-white outline-none text-sm"/></div>
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
        <div className="bg-red-50 border border-red-200 p-2.5 rounded-xl mb-3 flex justify-between items-center"><span className="text-xs font-bold text-red-700">Đã chọn {selectedIds.length} mục</span><button onClick={handleBatchDelete} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1"><Trash2 size={14}/> Xóa đã chọn</button></div>
      )}
      <div className="flex-1 bg-white rounded-xl border shadow-sm overflow-auto flex flex-col justify-between">
        <div className="overflow-auto flex-1">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 sticky top-0 border-b">
              <tr>
                <th className="p-4 w-10"><input type="checkbox" onChange={() => setSelectedIds(selectedIds.length === data.length ? [] : data.map(i=>i.id))} checked={data.length > 0 && selectedIds.length === data.length} className="w-4 h-4"/></th>
                <th className="p-4 font-bold text-gray-600">Tên {title}</th><th className="p-4 font-bold text-gray-600">SĐT</th>
                <th className="p-4 font-bold text-gray-600 cursor-pointer hover:bg-gray-200 flex items-center gap-1 select-none" onClick={() => setSortOrder(p => p === 'none' ? 'desc' : p === 'desc' ? 'asc' : 'none')}> Tổng Nợ {sortOrder !== 'none' && <ArrowUpDown size={14} className={sortOrder==='desc' ? 'text-red-500' : 'text-green-500'} />} </th>
                <th className="p-4 font-bold text-gray-600 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map(i => {
                const textDebtClass = i.totalDebt > 0 ? (isCus ? 'text-red-600' : 'text-orange-600') : 'text-gray-400';
                return (
                  <tr key={i.id} className="border-b hover:bg-blue-50/50 cursor-pointer" onClick={() => setDetailTarget(i)}>
                    <td className="p-4" onClick={e=>e.stopPropagation()}><input type="checkbox" checked={selectedIds.includes(i.id)} onChange={() => setSelectedIds(prev => prev.includes(i.id) ? prev.filter(x=>x!==i.id) : [...prev, i.id])} className="w-4 h-4"/></td>
                    <td className="p-4 font-medium text-blue-600 underline">{i.name}</td><td className="p-4 text-gray-600">{i.phone}</td><td className={"p-4 font-bold " + textDebtClass}>{formatCurrency(i.totalDebt)}</td>
                    <td className="p-4 text-right flex justify-end gap-1" onClick={e=>e.stopPropagation()}><button onClick={() => setDetailTarget(i)} title="Xem chi tiết giao dịch" className="text-gray-600 bg-gray-100 p-2 rounded-lg hover:bg-gray-200"><Eye size={16}/></button><button onClick={() => {setForm(i);setIsModalOpen(true);}} className="text-blue-600 bg-blue-50 p-2 rounded-lg hover:bg-blue-100"><Edit size={16}/></button><button onClick={() => handleDelete(i.id)} className="text-red-600 bg-red-50 p-2 rounded-lg hover:bg-red-100"><Trash2 size={16}/></button></td>
                  </tr>
                );
              })}
              {paginatedData.length === 0 && (<tr><td colSpan="5" className="p-8 text-center text-gray-400">Không tìm thấy dữ liệu</td></tr>)}
            </tbody>
          </table>
        </div>
        <div className="border-t shrink-0"><PaginationControls currentPage={currentPage} totalPages={totalPages} rowsPerPage={rowsPerPage} onPageChange={(p) => setCurrentPage(p)} onRowsChange={(r) => { setRowsPerPage(r); setCurrentPage(1); }} totalItems={sortedData.length} /></div>
      </div>
      <Modal isOpen={!!detailTarget} onClose={() => setDetailTarget(null)} title={`Chi tiết: ${detailTarget?.name || ''}`} maxWidth="max-w-4xl">
        {detailTarget && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border">
              <div><p className="text-xs text-gray-500">SĐT:</p><p className="font-bold">{detailTarget.phone || 'Trống'}</p></div>
              <div><p className="text-xs text-gray-500">Tổng Nợ Gốc:</p><p className="font-bold text-red-600">{formatCurrency(detailTarget.totalDebt)}</p></div>
              <div className="flex items-center gap-2">
                <button onClick={handlePrintDetail} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"><Printer size={14}/> In Phiếu</button>
                <div className="flex items-center gap-1 bg-white p-1 rounded border">
                  <select value={filterMonth} onChange={e=>setFilterMonth(e.target.value)} className="bg-transparent text-xs outline-none"><option value="ALL">Cả năm</option>{Array.from({length: 12}, (_, i) => <option key={i+1} value={i+1}>Tháng {i+1}</option>)}</select>
                  <select value={filterYear} onChange={e=>setFilterYear(e.target.value)} className="bg-transparent text-xs outline-none">{Array.from({length: 5}, (_, i) => new Date().getFullYear() - i).map(y => <option key={y} value={y}>{y}</option>)}</select>
                </div>
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
                  <thead className="bg-gray-100 sticky top-0 border-b"><tr><th className="p-2.5">Thời gian</th><th className="p-2.5">Mặt hàng & Ghi chú/BH</th><th className="p-2.5">Giá trị đơn</th><th className="p-2.5">Trạng thái nợ</th></tr></thead>
                  <tbody>
                    {detailData.list.map(ord => {
                      const statusClass = ord.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700';
                      return (
                        <tr key={ord.id} className="border-b hover:bg-gray-50">
                          <td className="p-2.5 whitespace-nowrap">{formatDate(ord.date)}</td>
                          <td className="p-2.5">
                            <ul className="space-y-1.5">
                              {ord.items?.map((it, idx) => {
                                const qty = it.quantity || it.qty || 1; const itemPrice = it.price || it.importCost || 0;
                                return (
                                  <li key={idx} className="bg-gray-50 p-1.5 rounded border border-gray-100">
                                    <div className="flex justify-between font-medium text-gray-800"><span><strong className="text-blue-600">{it.name}</strong> x {qty}</span><span>{formatCurrency(itemPrice * qty)}</span></div>
                                    {(it.warrantyValue || it.note) && (<div className="text-[10px] text-gray-500 mt-0.5 flex gap-2">{it.warrantyValue && <span>🛡️ BH: {it.warrantyValue} {it.warrantyUnit}</span>}{it.note && <span>📝 {it.note}</span>}</div>)}
                                  </li>
                                );
                              })}
                            </ul>
                          </td>
                          <td className="p-2.5 font-bold text-gray-800 align-top">{formatCurrency(ord.total)}</td>
                          <td className="p-2.5 align-top"><span className={"px-2 py-0.5 rounded text-[10px] font-bold " + statusClass}>{ord.status === 'PAID' ? 'Đã trả' : 'Đang nợ'}</span></td>
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
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={form.id ? `Cập nhật ${title}` : `Thêm ${title}`}>
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

function InventoryView({ products, orders, imports, storeConfig, db, storeId, showToast }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', category: '', price: '', cost: '', stock: '' });
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ field: null, direction: 'none' });
  const [detailProduct, setDetailProduct] = useState(null);
  const currentDate = new Date();
  const [filterMonth, setFilterMonth] = useState((currentDate.getMonth() + 1).toString());
  const [filterYear, setFilterYear] = useState(currentDate.getFullYear().toString());
  const [invRowsPerPage, setInvRowsPerPage] = useState('10');
  const [invCurrentPage, setInvCurrentPage] = useState(1);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const nowIso = new Date().toISOString();
      const d = { name: form.name, category: form.category || '', price: Number(form.price), cost: Number(form.cost || 0), stock: Number(form.stock), createdAt: form.createdAt || nowIso };
      if (form.id) await updateDoc(doc(db, 'stores', storeId, 'products', form.id), d);
      else await addDoc(collection(db, 'stores', storeId, 'products'), d);
      setIsModalOpen(false); showToast("Đã lưu Hàng hóa");
    } catch (e) { showToast("Lỗi", "error"); }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Xác nhận xóa sản phẩm này?")) { await deleteDoc(doc(db, 'stores', storeId, 'products', id)); showToast("Đã xóa sản phẩm"); }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm("Xác nhận xóa " + selectedIds.length + " sản phẩm đã chọn?")) {
      let batch = writeBatch(db);
      selectedIds.forEach(id => batch.delete(doc(db, 'stores', storeId, 'products', id)));
      await batch.commit(); setSelectedIds([]); showToast("Đã xóa các sản phẩm đã chọn");
    }
  };

  const handlePrintProductDetail = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>In Thẻ Kho - ${detailProduct?.name}</title><style>body { font-family: sans-serif; padding: 20px; color: #333; } h2 { text-align: center; color: #1e3a8a; } .info { margin-bottom: 20px; border-bottom: 1px solid #ddd; padding-bottom: 10px; } table { width: 100%; border-collapse: collapse; margin-top: 10px; } th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; } th { background-color: #f3f4f6; } .text-right { text-align: right; }</style></head><body>
      <h2>THẺ KHO / LỊCH SỬ SẢN PHẨM</h2>
      <div class="info"><p><strong>Tên sản phẩm:</strong> ${detailProduct?.name}</p><p><strong>Nhóm hàng:</strong> ${detailProduct?.category || 'Chưa phân nhóm'}</p><p><strong>Giá bán:</strong> ${formatCurrency(detailProduct?.price)}</p><p><strong>Tồn kho hiện tại:</strong> ${detailProduct?.stock}</p></div>
      <h3>Lịch sử bán ra</h3><table><thead><tr><th>Khách hàng</th><th>Thời gian</th><th>Số lượng</th></tr></thead><tbody>${productHistory.sales.map(s => `<tr><td>${s.customerName}</td><td>${formatDate(s.date)}</td><td>${s.quantity}</td></tr>`).join('')}</tbody></table>
      <h3 style="margin-top: 20px;">Lịch sử nhập hàng</h3><table><thead><tr><th>Nhà cung cấp</th><th>Thời gian</th><th>Số lượng</th></tr></thead><tbody>${productHistory.imports.map(im => `<tr><td>${im.supplierName}</td><td>${formatDate(im.date)}</td><td>${im.qty}</td></tr>`).join('')}</tbody></table>
      <script>window.print();</script></body></html>
    `);
    printWindow.document.close();
  };

  const bannerStats = useMemo(() => {
    const totalStock = products.reduce((s, p) => s + (Number(p.stock) || 0), 0);
    const totalValue = products.reduce((s, p) => s + (Number(p.cost || p.price) * (Number(p.stock) || 0)), 0);
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
        let aVal = a[sortConfig.field] || 0; let bVal = b[sortConfig.field] || 0;
        if (sortConfig.field === 'name') {
          aVal = (a.name || '').toLowerCase(); bVal = (b.name || '').toLowerCase();
          if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
          if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
        } else { return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal; }
      });
    }
    return list;
  }, [products, searchTerm, sortConfig]);

  const paginatedProducts = useMemo(() => {
    if (invRowsPerPage === 'all') return filteredProducts;
    const limit = parseInt(invRowsPerPage) || 10;
    const start = (invCurrentPage - 1) * limit;
    return filteredProducts.slice(start, start + limit);
  }, [filteredProducts, invRowsPerPage, invCurrentPage]);
  const totalInvPages = invRowsPerPage === 'all' ? 1 : Math.ceil(filteredProducts.length / (parseInt(invRowsPerPage) || 10));

  const productHistory = useMemo(() => {
    if (!detailProduct) return { sales: [], imports: [], totalSoldQty: 0, totalImportQty: 0, totalSoldAmount: 0, totalImportAmount: 0, totalPaid: 0, totalDebtRemain: 0 };
    const matchTime = (dateStr) => { const d = new Date(dateStr); return (filterMonth === 'ALL' || (d.getMonth() + 1).toString() === filterMonth) && d.getFullYear().toString() === filterYear; };
    const sales = (orders || []).filter(o => matchTime(o.date)).flatMap(o => (o.items || []).filter(item => item.id === detailProduct.id).map(it => ({ ...it, date: o.date, status: o.status, customerName: o.customerName || 'Khách lẻ' }))).sort((a,b) => new Date(b.date) - new Date(a.date));
    const imp = (imports || []).filter(i => matchTime(i.date)).flatMap(i => (i.items || []).filter(item => item.id === detailProduct.id).map(it => ({ ...it, date: i.date, status: i.status, supplierName: i.supplierName || 'NCC Ẩn' }))).sort((a,b) => new Date(b.date) - new Date(a.date));
    let totalSoldQty = sales.reduce((s, x) => s + (Number(x.quantity) || 0), 0); let totalImportQty = imp.reduce((s, x) => s + (Number(x.qty) || 0), 0);
    let totalSoldAmount = sales.reduce((s, x) => s + ((Number(x.quantity) || 0) * (Number(x.price) || 0)), 0); let totalImportAmount = imp.reduce((s, x) => s + ((Number(x.qty) || 0) * (Number(x.importCost) || 0)), 0);
    let totalPaid = sales.filter(s => s.status === 'PAID').reduce((sum, x) => sum + (x.quantity * x.price), 0); let totalDebtRemain = sales.filter(s => s.status === 'DEBT').reduce((sum, x) => sum + (x.quantity * x.price), 0);
    return { sales, imports: imp, totalSoldQty, totalImportQty, totalSoldAmount, totalImportAmount, totalPaid, totalDebtRemain };
  }, [detailProduct, orders, imports, filterMonth, filterYear]);

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 bg-gray-50 overflow-hidden h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <h2 className="text-2xl font-bold text-gray-800">Kho Hàng</h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64"><Search size={16} className="absolute left-3 top-3 text-gray-400"/><input placeholder="Tìm kiếm trực tiếp sản phẩm..." value={searchTerm} onChange={e=>{ setSearchTerm(e.target.value); setInvCurrentPage(1); }} className="w-full pl-9 pr-3 py-2 border rounded-lg bg-white outline-none text-sm"/></div>
          <button onClick={() => {setForm({name:'', category:'', price:'', cost:'', stock:''}); setIsModalOpen(true);}} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shrink-0"><Plus size={18}/> Thêm mới</button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div className="bg-white p-4 rounded-2xl border shadow-sm"><p className="text-xs text-gray-500 font-bold uppercase">Tổng Số Sản Phẩm</p><p className="text-xl font-bold text-gray-800">{bannerStats.count}</p></div>
        <div className="bg-white p-4 rounded-2xl border shadow-sm"><p className="text-xs text-blue-600 font-bold uppercase">Tổng Tồn Kho</p><p className="text-xl font-bold text-blue-600">{bannerStats.totalStock}</p></div>
        <div className="bg-white p-4 rounded-2xl border shadow-sm"><p className="text-xs text-green-600 font-bold uppercase">Tổng Giá Vốn Tồn Kho</p><p className="text-xl font-bold text-green-600">{formatCurrency(bannerStats.totalValue)}</p></div>
      </div>
      {selectedIds.length > 0 && (
        <div className="bg-red-50 border border-red-200 p-2.5 rounded-xl mb-3 flex justify-between items-center"><span className="text-xs font-bold text-red-700">Đã chọn {selectedIds.length} mục</span><button onClick={handleBatchDelete} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1"><Trash2 size={14}/> Xóa đã chọn</button></div>
      )}
      <div className="flex-1 bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col justify-between">
        <div className="overflow-auto flex-1">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 sticky top-0 border-b select-none">
              <tr>
                <th className="p-4 w-10"><input type="checkbox" onChange={() => setSelectedIds(selectedIds.length === products.length ? [] : products.map(p=>p.id))} checked={products.length > 0 && selectedIds.length === products.length} className="w-4 h-4"/></th>
                <th className="p-4 font-bold text-gray-600 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('name')}><div className="flex items-center gap-1">Sản phẩm {sortConfig.field === 'name' && sortConfig.direction !== 'none' && <ArrowUpDown size={14} className={sortConfig.direction==='desc' ? 'text-red-500' : 'text-green-500'} />}</div></th>
                <th className="p-4 font-bold text-gray-600">Nhóm & Nguồn Gốc</th>
                <th className="p-4 font-bold text-gray-600 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('cost')}><div className="flex items-center gap-1">Giá vốn {sortConfig.field === 'cost' && sortConfig.direction !== 'none' && <ArrowUpDown size={14} className={sortConfig.direction==='desc' ? 'text-red-500' : 'text-green-500'} />}</div></th>
                <th className="p-4 font-bold text-gray-600 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('price')}><div className="flex items-center gap-1">Giá bán {sortConfig.field === 'price' && sortConfig.direction !== 'none' && <ArrowUpDown size={14} className={sortConfig.direction==='desc' ? 'text-red-500' : 'text-green-500'} />}</div></th>
                <th className="p-4 font-bold text-gray-600 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('stock')}><div className="flex items-center gap-1">Tồn {sortConfig.field === 'stock' && sortConfig.direction !== 'none' && <ArrowUpDown size={14} className={sortConfig.direction==='desc' ? 'text-red-500' : 'text-green-500'} />}</div></th>
                <th className="p-4 font-bold text-gray-600 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map(p => {
                const stockClass = p.stock < 0 ? 'text-red-600' : 'text-gray-800';
                return (
                  <tr key={p.id} className="border-b hover:bg-blue-50/50 cursor-pointer" onClick={() => setDetailProduct(p)}>
                    <td className="p-4" onClick={e=>e.stopPropagation()}><input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => setSelectedIds(prev => prev.includes(p.id) ? prev.filter(x=>x!==p.id) : [...prev, p.id])} className="w-4 h-4"/></td>
                    <td className="p-4 font-medium text-blue-600 underline">{p.name}</td>
                    <td className="p-4"><p className="text-[11px] bg-gray-100 border inline-block px-1.5 py-0.5 rounded text-gray-600">{p.category || 'Chưa phân nhóm'}</p>{p.lastSupplierName && <p className="text-[10px] text-gray-400 mt-1">Từ: {p.lastSupplierName}</p>}</td>
                    <td className="p-4 text-gray-600">{formatCurrency(p.cost)}</td><td className="p-4 font-bold text-blue-600">{formatCurrency(p.price)}</td><td className={"p-4 font-bold " + stockClass}>{p.stock}</td>
                    <td className="p-4 text-right flex justify-end gap-1" onClick={e=>e.stopPropagation()}><button onClick={() => setDetailProduct(p)} title="Xem chi tiết nhập/bán" className="text-gray-600 bg-gray-100 p-2 rounded-lg hover:bg-gray-200"><Eye size={16}/></button><button onClick={() => {setForm(p); setIsModalOpen(true);}} className="text-blue-600 bg-blue-50 p-2 rounded-lg hover:bg-blue-100"><Edit size={16}/></button><button onClick={() => handleDelete(p.id)} className="text-red-600 bg-red-50 p-2 rounded-lg hover:bg-red-100"><Trash2 size={16}/></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="border-t shrink-0"><PaginationControls currentPage={invCurrentPage} totalPages={totalInvPages} rowsPerPage={invRowsPerPage} onPageChange={(p) => setInvCurrentPage(p)} onRowsChange={(r) => { setInvRowsPerPage(r); setInvCurrentPage(1); }} totalItems={filteredProducts.length} /></div>
      </div>
      <Modal isOpen={!!detailProduct} onClose={() => setDetailProduct(null)} title={`Lịch sử: ${detailProduct?.name || ''}`} maxWidth="max-w-4xl">
        {detailProduct && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border">
              <div><p className="text-xs text-gray-500">Giá bán:</p><p className="font-bold text-blue-600">{formatCurrency(detailProduct.price)}</p></div>
              <div><p className="text-xs text-gray-500">Giá vốn hiện tại:</p><p className="font-bold text-gray-600">{formatCurrency(detailProduct.cost)}</p></div>
              <div><p className="text-xs text-gray-500">Tồn kho:</p><p className={"font-bold " + (detailProduct.stock < 0 ? 'text-red-600' : 'text-gray-800')}>{detailProduct.stock}</p></div>
              <div className="flex items-center gap-2">
                <button onClick={handlePrintProductDetail} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"><Printer size={14}/> In Thẻ Kho</button>
                <div className="flex items-center gap-1 bg-white p-1 rounded border">
                  <select value={filterMonth} onChange={e=>setFilterMonth(e.target.value)} className="bg-transparent text-xs outline-none"><option value="ALL">Cả năm</option>{Array.from({length: 12}, (_, i) => <option key={i+1} value={i+1}>Tháng {i+1}</option>)}</select>
                  <select value={filterYear} onChange={e=>setFilterYear(e.target.value)} className="bg-transparent text-xs outline-none">{Array.from({length: 5}, (_, i) => new Date().getFullYear() - i).map(y => <option key={y} value={y}>{y}</option>)}</select>
                </div>
              </div>
            </div>
            <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
              <p className="text-[11px] text-orange-800 font-bold uppercase mb-2">Lịch sử 3 giá nhập gần nhất</p>
              {(() => {
                const last3 = (imports || []).flatMap(i => (i.items || []).filter(item => item.id === detailProduct.id).map(it => ({ date: i.date, importCost: it.importCost }))).sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 3);
                if (last3.length === 0) return <p className="text-xs text-orange-600/70">Chưa có dữ liệu nhập hàng đợt nào.</p>;
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {last3.map((imp, idx) => (<div key={idx} className="flex justify-between items-center text-xs bg-white p-2 rounded-lg border border-orange-100 shadow-sm"><span className="text-gray-500">{formatDate(imp.date)}</span><span className="font-bold text-orange-600">{formatCurrency(imp.importCost)}</span></div>))}
                  </div>
                );
              })()}
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
                    <thead className="bg-green-50 sticky top-0 border-b border-green-100"><tr><th className="p-2.5 text-green-800">Khách mua</th><th className="p-2.5 text-green-800">Thời gian</th><th className="p-2.5 text-green-800">Số lượng</th></tr></thead>
                    <tbody>
                      {productHistory.sales.map((s, idx) => (<tr key={idx} className="border-b hover:bg-gray-50"><td className="p-2.5 font-bold text-blue-700">{s.customerName}</td><td className="p-2.5 text-gray-500 whitespace-nowrap">{formatDate(s.date)}</td><td className="p-2.5 font-bold text-green-600">Bán ra {s.quantity}</td></tr>))}
                      {productHistory.sales.length === 0 && (<tr><td colSpan="3" className="p-4 text-center text-gray-400">Không có phát sinh bán</td></tr>)}
                    </tbody>
                  </table>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-sm text-purple-700 mb-2 border-b pb-1">Lịch sử Nhập hàng:</h4>
                <div className="max-h-64 overflow-y-auto border rounded-xl shadow-sm">
                  <table className="w-full text-left text-xs bg-white">
                    <thead className="bg-purple-50 sticky top-0 border-b border-purple-100"><tr><th className="p-2.5 text-purple-800">Nhà cung cấp</th><th className="p-2.5 text-purple-800">Thời gian</th><th className="p-2.5 text-purple-800">Số lượng</th></tr></thead>
                    <tbody>
                      {productHistory.imports.map((im, idx) => (<tr key={idx} className="border-b hover:bg-gray-50"><td className="p-2.5 font-bold text-orange-700">{im.supplierName}</td><td className="p-2.5 text-gray-500 whitespace-nowrap">{formatDate(im.date)}</td><td className="p-2.5 font-bold text-purple-600">Nhập vào {im.qty}</td></tr>))}
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
          <input placeholder="Nhóm hàng (VD: Ốp lưng, Điện thoại...)" value={form.category||''} onChange={e=>setForm({...form,category:e.target.value})} className="w-full p-2.5 border rounded-lg outline-none"/>
          <div className="grid grid-cols-2 gap-4"><input required type="number" placeholder="Giá vốn *" value={form.cost||''} onChange={e=>setForm({...form,cost:e.target.value})} className="p-2.5 border rounded-lg outline-none"/><input required type="number" placeholder="Giá bán *" value={form.price||''} onChange={e=>setForm({...form,price:e.target.value})} className="p-2.5 border rounded-lg outline-none"/></div>
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

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm("Xác nhận xóa " + selectedIds.length + " mục đã chọn?")) {
      let batch = writeBatch(db);
      selectedIds.forEach(id => batch.delete(doc(db, 'stores', storeId, 'expenses', id)));
      await batch.commit(); setSelectedIds([]); showToast("Đã xóa các chi phí đã chọn");
    }
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const d = new Date(e.date);
      const matchTime = (filterMonth === 'ALL' || (d.getMonth() + 1).toString() === filterMonth) && d.getFullYear().toString() === filterYear;
      const matchSearch = e.note && e.note.toLowerCase().includes(searchTerm.toLowerCase());
      return matchTime && matchSearch;
    }).sort((a,b) => new Date(b.date) - new Date(a.date));
  }, [expenses, filterMonth, filterYear, searchTerm]);

  const totalExpense = useMemo(() => filteredExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0), [filteredExpenses]);

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
          <select value={filterYear} onChange={e=>setFilterYear(e.target.value)} className="bg-transparent text-sm font-medium outline-none">{Array.from({length: 5}, (_, i) => new Date().getFullYear() - i).map(y => <option key={y} value={y}>{y}</option>)}</select>
        </div>
      </div>
      <form onSubmit={handleSave} className="bg-white p-4 rounded-xl border shadow-sm mb-4 flex flex-col md:flex-row gap-4 shrink-0">
        <input required type="number" placeholder="Số tiền chi *" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} className="p-2.5 border rounded-lg outline-none flex-1"/>
        <input required placeholder="Nội dung chi (VD: Trả tiền điện) *" value={form.note} onChange={e=>setForm({...form,note:e.target.value})} className="p-2.5 border rounded-lg outline-none flex-1 md:flex-[2]"/>
        <button className="bg-orange-600 text-white px-8 rounded-lg font-bold py-2.5">Ghi Nhận</button>
      </form>
      {selectedIds.length > 0 && (
        <div className="bg-red-50 border border-red-200 p-2.5 rounded-xl mb-3 flex justify-between items-center"><span className="text-xs font-bold text-red-700">Đã chọn {selectedIds.length} mục</span><button onClick={handleBatchDelete} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1"><Trash2 size={14}/> Xóa đã chọn</button></div>
      )}
      <div className="bg-white rounded-xl border shadow-sm flex-1 overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 sticky top-0 border-b"><tr><th className="p-4 w-10"><input type="checkbox" onChange={() => setSelectedIds(selectedIds.length === filteredExpenses.length ? [] : filteredExpenses.map(e=>e.id))} checked={filteredExpenses.length > 0 && selectedIds.length === filteredExpenses.length} className="w-4 h-4"/></th><th className="p-4 font-bold text-gray-600">Thời gian</th><th className="p-4 font-bold text-gray-600">Nội dung</th><th className="p-4 font-bold text-gray-600">Số tiền</th><th className="p-4 font-bold text-gray-600 text-right">Thao tác</th></tr></thead>
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
        {detailExpense && (<div className="space-y-4"><div className="bg-orange-50 p-4 rounded-xl border border-orange-100 text-center"><p className="text-xs text-orange-600 font-bold uppercase mb-1">Số tiền chi</p><p className="text-2xl font-bold text-orange-700">{formatCurrency(detailExpense.amount)}</p></div><div className="space-y-2 text-sm"><p><strong className="text-gray-500">Nội dung:</strong> {detailExpense.note}</p><p><strong className="text-gray-500">Thời gian ghi nhận:</strong> {formatDate(detailExpense.date)}</p></div></div>)}
      </Modal>
    </div>
  );
}

function ImportView({ products, suppliers, db, storeId, user, showToast, storeConfig }) {
  const [cart, setCart] = useState([]);
  const [supplierId, setSupplierId] = useState('');
  const [isDebt, setIsDebt] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddSuppModal, setShowAddSuppModal] = useState(false);
  const [newSuppForm, setNewSuppForm] = useState({ name: '', phone: '', address: '' });
  const [showAddProdModal, setShowAddProdModal] = useState(false);
  const [newProdForm, setNewProdForm] = useState({ name: '', category: '', cost: '', price: '', stock: '' });

  const [importRowsPerPage, setImportRowsPerPage] = useState('10');
  const [importCurrentPage, setImportCurrentPage] = useState(1);

  const filteredProducts = useMemo(() => products.filter(p => p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())), [products, searchTerm]);

  const paginatedProducts = useMemo(() => {
    if (importRowsPerPage === 'all') return filteredProducts;
    const limit = parseInt(importRowsPerPage) || 10;
    const start = (importCurrentPage - 1) * limit;
    return filteredProducts.slice(start, start + limit);
  }, [filteredProducts, importRowsPerPage, importCurrentPage]);

  const totalImportPages = importRowsPerPage === 'all' ? 1 : Math.ceil(filteredProducts.length / (parseInt(importRowsPerPage) || 10));

  const handleAddSupplierQuick = async (e) => {
    e.preventDefault();
    try {
      const docRef = await addDoc(collection(db, 'stores', storeId, 'suppliers'), { name: newSuppForm.name, phone: newSuppForm.phone || '', address: newSuppForm.address || '', totalDebt: 0, createdAt: new Date().toISOString() });
      setSupplierId(docRef.id); setShowAddSuppModal(false); setNewSuppForm({ name: '', phone: '', address: '' });
      showToast("Đã thêm và chọn nhà cung cấp mới!");
    } catch (err) { showToast("Lỗi thêm nhà cung cấp", "error"); }
  };

  const handleAddNewProductInImport = async (e) => {
    e.preventDefault();
    try {
      const costVal = Number(newProdForm.cost) || 0; const priceVal = Number(newProdForm.price) || 0; const initStock = Number(newProdForm.stock) || 0;
      const newProdData = { name: newProdForm.name, category: newProdForm.category || '', cost: costVal, price: priceVal, stock: initStock, createdAt: new Date().toISOString() };
      const docRef = await addDoc(collection(db, 'stores', storeId, 'products'), newProdData);
      setCart(c => [...c, { id: docRef.id, name: newProdData.name, category: newProdData.category, qty: initStock > 0 ? initStock : 1, importCost: costVal, price: priceVal }]);
      setShowAddProdModal(false); setNewProdForm({ name: '', category: '', cost: '', price: '', stock: '' }); showToast("Đã thêm hàng mới và đưa vào phiếu nhập!");
    } catch (err) { showToast("Lỗi thêm sản phẩm mới", "error"); }
  };

  const handleImport = async () => {
    if (cart.length === 0 || !supplierId) { showToast("Vui lòng chọn hoặc thêm mới Nhà cung cấp và có ít nhất 1 sản phẩm trước khi nhập hàng!", "error"); return; }
    try {
      const s = suppliers.find(sup => sup.id === supplierId);
      const total = cart.reduce((sum, i) => sum + Number(i.importCost || 0) * Number(i.qty || 1), 0);
      await addDoc(collection(db, 'stores', storeId, 'imports'), { supplierId: supplierId, supplierName: s.name, items: cart, total: total, status: isDebt ? 'DEBT' : 'PAID', date: new Date().toISOString() });
      
      let batch = writeBatch(db);
      cart.forEach(item => {
        const p = products.find(prod => prod.id === item.id);
        if (p) {
          let newCost = Number(item.importCost || 0); const oldCost = Number(p.cost || 0); const currentStock = Number(p.stock || 0); const importQty = Number(item.qty || 1);
          const method = storeConfig?.costCalcMethod || 'LATEST';
          if (method === 'AVERAGE') { if (currentStock + importQty > 0) newCost = Math.round(((currentStock * oldCost) + (importQty * newCost)) / (currentStock + importQty)); }
          else if (method === 'HIGHEST') newCost = Math.max(oldCost, newCost);
          else if (method === 'LOWEST') newCost = oldCost === 0 ? newCost : Math.min(oldCost, newCost);
          batch.update(doc(db, 'stores', storeId, 'products', p.id), { stock: currentStock + importQty, cost: newCost, lastSupplierId: supplierId, lastSupplierName: s.name });
        }
      });
      if (isDebt) batch.update(doc(db, 'stores', storeId, 'suppliers', supplierId), { totalDebt: (s.totalDebt || 0) + total });
      await batch.commit();
      setCart([]); setSupplierId(''); setIsDebt(false); showToast("Nhập hàng thành công!");
    } catch (e) { showToast("Lỗi nhập hàng", "error"); }
  };

  const addProductToCart = (p) => setCart(c => c.find(i => i.id === p.id) ? c : [...c, { id: p.id, name: p.name, category: p.category || '', qty: 1, importCost: p.cost || 0, price: p.price || 0 }]);

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-gray-50 h-full">
      <div className="flex-1 p-4 md:p-6 flex flex-col overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3 shrink-0">
          <div className="flex items-center gap-2"><h2 className="text-xl font-bold text-gray-800">Chọn sản phẩm nhập</h2><button onClick={() => setShowAddProdModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow"><Plus size={14}/> Thêm mới</button></div>
          <div className="relative w-full sm:w-64"><Search size={16} className="absolute left-3 top-3 text-gray-400"/><input placeholder="Tìm kiếm sản phẩm nhập..." value={searchTerm} onChange={e=>{setSearchTerm(e.target.value); setImportCurrentPage(1);}} className="w-full pl-9 pr-3 py-2 border rounded-lg bg-white outline-none text-sm"/></div>
        </div>

        <div className="flex-1 bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="overflow-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100 sticky top-0 border-b select-none">
                <tr>
                  <th className="p-4 font-bold text-gray-600">Sản phẩm</th>
                  <th className="p-4 font-bold text-gray-600">Nhóm</th>
                  <th className="p-4 font-bold text-gray-600">Giá vốn</th>
                  <th className="p-4 font-bold text-gray-600">Tồn</th>
                  <th className="p-4 font-bold text-gray-600 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map(p => {
                  const stockClass = p.stock < 0 ? 'text-red-600' : 'text-gray-800';
                  return (
                    <tr key={p.id} className="border-b hover:bg-blue-50/50 cursor-pointer" onClick={() => addProductToCart(p)}>
                      <td className="p-4 font-medium text-blue-600">{p.name}</td>
                      <td className="p-4"><p className="text-[11px] bg-gray-100 border inline-block px-1.5 py-0.5 rounded text-gray-600">{p.category || 'Chưa phân nhóm'}</p></td>
                      <td className="p-4 text-gray-600">{formatCurrency(p.cost)}</td>
                      <td className={"p-4 font-bold " + stockClass}>{p.stock}</td>
                      <td className="p-4 text-right">
                         <button onClick={(e) => { e.stopPropagation(); addProductToCart(p); }} className="text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-100 text-xs">Chọn nhập</button>
                      </td>
                    </tr>
                  );
                })}
                {paginatedProducts.length === 0 && (<tr><td colSpan="5" className="p-8 text-center text-gray-400">Không tìm thấy sản phẩm</td></tr>)}
              </tbody>
            </table>
          </div>
          <div className="border-t shrink-0">
            <PaginationControls currentPage={importCurrentPage} totalPages={totalImportPages} rowsPerPage={importRowsPerPage} onPageChange={(p) => setImportCurrentPage(p)} onRowsChange={(r) => { setImportRowsPerPage(r); setImportCurrentPage(1); }} totalItems={filteredProducts.length} />
          </div>
        </div>
      </div>
      
      <div className="w-full lg:w-[460px] bg-white border-l shadow-lg shrink-0 z-20 flex flex-col h-[65vh] lg:h-auto">
        <div className="p-4 border-b bg-gray-50"><h2 className="font-bold flex items-center gap-2"><ArrowDownToLine size={20} className="text-gray-600"/> Phiếu Nhập Kho</h2></div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.map(item => (
            <div key={item.id} className="bg-gray-50 p-3 rounded-xl border space-y-2 shadow-sm">
              <div className="flex justify-between items-center"><h4 className="font-bold text-sm text-gray-800 truncate">{item.name}</h4><button onClick={() => setCart(c => c.filter(i => i.id !== item.id))} className="text-red-400 hover:text-red-600"><X size={16}/></button></div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><label className="text-[10px] text-gray-500 font-bold">Số lượng nhập</label><input type="number" value={item.qty} onChange={e => setCart(c => c.map(i => i.id === item.id ? {...i, qty: Number(e.target.value)} : i))} className="w-full p-1.5 border rounded outline-none font-bold text-center bg-white" /></div>
                <div><label className="text-[10px] text-gray-500 font-bold">Đơn giá nhập (đ)</label><input type="number" value={item.importCost} onChange={e => setCart(c => c.map(i => i.id === item.id ? {...i, importCost: Number(e.target.value)} : i))} className="w-full p-1.5 border rounded outline-none font-bold text-blue-600 text-center bg-white" /></div>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-gray-200"><span className="text-[11px] text-gray-500">Thành tiền:</span><span className="font-bold text-xs text-gray-900">{formatCurrency(Number(item.qty || 0) * Number(item.importCost || 0))}</span></div>
            </div>
          ))}
          {cart.length === 0 && <div className="text-center text-gray-400 py-12">Chưa chọn sản phẩm nào để nhập</div>}
        </div>
        <div className="p-4 border-t bg-gray-50 space-y-3">
          <div className="flex gap-2">
            <select required value={supplierId} onChange={e=>setSupplierId(e.target.value)} className="flex-1 p-2.5 border rounded-lg outline-none text-sm bg-white font-medium"><option value="">-- Bắt buộc chọn NCC --</option>{suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
            <button type="button" onClick={() => setShowAddSuppModal(true)} className="bg-blue-50 text-blue-600 border border-blue-200 px-3 rounded-lg font-bold text-xs flex items-center gap-1 shrink-0"><Plus size={14}/> Thêm NCC</button>
          </div>
          <div className="flex gap-2"><button onClick={() => setIsDebt(false)} className={"flex-1 py-2 rounded-lg border font-bold text-xs " + (!isDebt ? 'bg-blue-600 text-white' : 'bg-white')}>Tiền mặt</button><button onClick={() => setIsDebt(true)} className={"flex-1 py-2 rounded-lg border font-bold text-xs " + (isDebt ? 'bg-orange-500 text-white' : 'bg-white')}>Ghi nợ NCC</button></div>
          <div className="flex justify-between items-center px-1"><span className="text-sm font-bold text-gray-700">Tổng tiền nhập:</span><span className="text-lg font-bold text-blue-600">{formatCurrency(cart.reduce((sum, i) => sum + (Number(i.qty || 0) * Number(i.importCost || 0)), 0))}</span></div>
          <button onClick={handleImport} disabled={!supplierId || cart.length === 0} className="w-full bg-gray-800 disabled:bg-gray-300 text-white py-3 rounded-xl font-bold mt-1 shadow-sm">Hoàn tất Nhập Hàng</button>
        </div>
      </div>

      <Modal isOpen={showAddSuppModal} onClose={() => setShowAddSuppModal(false)} title="Thêm Nhà Cung Cấp Mới">
        <form onSubmit={handleAddSupplierQuick} className="space-y-4">
          <input required placeholder="Tên nhà cung cấp *" value={newSuppForm.name} onChange={e=>setNewSuppForm({...newSuppForm, name:e.target.value})} className="w-full p-2.5 border rounded-lg outline-none text-sm"/>
          <input placeholder="Số điện thoại" value={newSuppForm.phone} onChange={e=>setNewSuppForm({...newSuppForm, phone:e.target.value})} className="w-full p-2.5 border rounded-lg outline-none text-sm"/>
          <input placeholder="Địa chỉ" value={newSuppForm.address} onChange={e=>setNewSuppForm({...newSuppForm, address:e.target.value})} className="w-full p-2.5 border rounded-lg outline-none text-sm"/>
          <button type="submit" className="w-full bg-blue-600 text-white font-bold p-3 rounded-lg text-sm">Lưu & Chọn Nhà Cung Cấp</button>
        </form>
      </Modal>

      <Modal isOpen={showAddProdModal} onClose={() => setShowAddProdModal(false)} title="Thêm Hàng Hóa Mới (Nhập Kho)">
        <form onSubmit={handleAddNewProductInImport} className="space-y-4">
          <div><label className="block text-xs font-bold text-gray-500 mb-1">Tên sản phẩm *</label><input required placeholder="Nhập tên sản phẩm..." value={newProdForm.name} onChange={e=>setNewProdForm({...newProdForm, name: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none text-sm"/></div>
          <div><label className="block text-xs font-bold text-gray-500 mb-1">Nhóm hàng</label><input placeholder="VD: Điện thoại, Ốp lưng, Sạc..." value={newProdForm.category} onChange={e=>setNewProdForm({...newProdForm, category: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none text-sm"/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-bold text-gray-500 mb-1">Giá vốn (đ) *</label><input required type="number" placeholder="0" value={newProdForm.cost} onChange={e=>setNewProdForm({...newProdForm, cost: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none text-sm font-bold"/></div>
            <div><label className="block text-xs font-bold text-gray-500 mb-1">Giá bán (đ) *</label><input required type="number" placeholder="0" value={newProdForm.price} onChange={e=>setNewProdForm({...newProdForm, price: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none text-sm font-bold text-blue-600"/></div>
          </div>
          <div><label className="block text-xs font-bold text-gray-500 mb-1">Số lượng tồn ban đầu *</label><input required type="number" placeholder="0" value={newProdForm.stock} onChange={e=>setNewProdForm({...newProdForm, stock: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none text-sm font-bold"/></div>
          <button type="submit" className="w-full bg-blue-600 text-white font-bold p-3 rounded-lg text-sm">Lưu & Đưa Vào Phiếu Nhập</button>
        </form>
      </Modal>
    </div>
  );
}

function SettingsView({ db, storeId, showToast, storeConfig }) {
  const [activeSubTab, setActiveSubTab] = useState('general');
  const [editPaperSize, setEditPaperSize] = useState('K80');
  
  const [form, setForm] = useState({
    name: storeConfig?.name || '', address: storeConfig?.address || '', phone: storeConfig?.phone || '', logo: storeConfig?.logo || '',
    costCalcMethod: storeConfig?.costCalcMethod || 'LATEST',
    printPaperSize: storeConfig?.printPaperSize || 'K80',
    K80: storeConfig?.K80 || { printFontSize: 12, printTablePaddingX: 4, printTablePaddingY: 6, printDetailFontScale: 80, colWidthStt: 5, colWidthProduct: 35, colWidthQty: 8, colWidthPrice: 12, colWidthWarranty: 12, colWidthNote: 13, colWidthTotal: 15, printShowLogo: true, printShowStoreName: true, printShowStoreAddress: true, printShowStorePhone: true, printInvoiceTitle: 'HÓA ĐƠN BÁN HÀNG', printShowInvoiceId: true, printShowDate: true, printShowCashier: true, printShowCustomer: true, printShowCustomerPhone: true, printShowStatus: true, printShowWarranty: true, printShowNote: true, printFooter: 'Cảm ơn quý khách và hẹn gặp lại!', fsStoreNameOffset: 2, fsStoreAddressOffset: 0, fsStorePhoneOffset: 0, fsInvoiceTitleOffset: 4, fsMetaOffset: 0 },
    A4: storeConfig?.A4 || { printFontSize: 12, printTablePaddingX: 4, printTablePaddingY: 6, printDetailFontScale: 80, colWidthStt: 5, colWidthProduct: 35, colWidthQty: 8, colWidthPrice: 12, colWidthWarranty: 12, colWidthNote: 13, colWidthTotal: 15, printShowLogo: true, printShowStoreName: true, printShowStoreAddress: true, printShowStorePhone: true, printInvoiceTitle: 'HÓA ĐƠN BÁN HÀNG', printShowInvoiceId: true, printShowDate: true, printShowCashier: true, printShowCustomer: true, printShowCustomerPhone: true, printShowStatus: true, printShowWarranty: true, printShowNote: true, printFooter: 'Cảm ơn quý khách và hẹn gặp lại!', fsStoreNameOffset: 2, fsStoreAddressOffset: 0, fsStorePhoneOffset: 0, fsInvoiceTitleOffset: 4, fsMetaOffset: 0 },
    A5: storeConfig?.A5 || { printFontSize: 12, printTablePaddingX: 4, printTablePaddingY: 6, printDetailFontScale: 80, colWidthStt: 5, colWidthProduct: 35, colWidthQty: 8, colWidthPrice: 12, colWidthWarranty: 12, colWidthNote: 13, colWidthTotal: 15, printShowLogo: true, printShowStoreName: true, printShowStoreAddress: true, printShowStorePhone: true, printInvoiceTitle: 'HÓA ĐƠN BÁN HÀNG', printShowInvoiceId: true, printShowDate: true, printShowCashier: true, printShowCustomer: true, printShowCustomerPhone: true, printShowStatus: true, printShowWarranty: true, printShowNote: true, printFooter: 'Cảm ơn quý khách và hẹn gặp lại!', fsStoreNameOffset: 2, fsStoreAddressOffset: 0, fsStorePhoneOffset: 0, fsInvoiceTitleOffset: 4, fsMetaOffset: 0 }
  });

  const [loadingFile, setLoadingFile] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (storeConfig) {
      setForm(prev => ({
        ...prev,
        ...storeConfig,
        K80: { ...(prev.K80 || {}), ...(storeConfig.K80 || {}) },
        A4: { ...(prev.A4 || {}), ...(storeConfig.A4 || {}) },
        A5: { ...(prev.A5 || {}), ...(storeConfig.A5 || {}) }
      }));
    }
  }, [storeConfig]);

  useEffect(() => {
    if (!window.XLSX) {
      const s = document.createElement('script');
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
      document.body.appendChild(s);
    }
  }, []);

  const handleLogo = (e) => {
    const f = e.target.files[0];
    if (f) { const r = new FileReader(); r.onloadend = () => setForm({...form, logo: r.result}); r.readAsDataURL(f); }
  };

  const handleSaveConfig = async (e) => {
    if(e) e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'stores', storeId), form, { merge: true });
      showToast("Đã lưu Cấu hình thành công!");
    } catch(err) { showToast("Lỗi khi lưu cài đặt", "error"); } finally { setSaving(false); }
  };

  const updateActiveSizeConfig = (field, value) => {
    setForm(prev => ({
      ...prev,
      [editPaperSize]: {
        ...(prev[editPaperSize] || {}),
        [field]: value
      }
    }));
  };

  const handleColWidthChange = (field, newValueStr) => {
    let newValue = parseInt(newValueStr) || 1;
    const currentCfg = form[editPaperSize] || {};
    const cols = ['colWidthStt', 'colWidthProduct', 'colWidthQty', 'colWidthPrice', 'colWidthWarranty', 'colWidthNote', 'colWidthTotal'];
    const idx = cols.indexOf(field);
    if (idx === -1) return;
    const oldVal = currentCfg[field] ?? 10; let diff = newValue - oldVal;
    if (diff === 0) return;
    const nextIdx = idx === cols.length - 1 ? idx - 1 : idx + 1;
    const nextField = cols[nextIdx];
    if ((currentCfg[nextField] ?? 10) - diff < 1) { diff = (currentCfg[nextField] ?? 10) - 1; newValue = oldVal + diff; }
    
    setForm(prev => ({
      ...prev,
      [editPaperSize]: {
        ...(prev[editPaperSize] || {}),
        [field]: newValue,
        [nextField]: (prev[editPaperSize][nextField] ?? 10) - diff
      }
    }));
  };

  const handleImport = async (e, type) => {
    const file = e.target.files[0];
    if (!file || !window.XLSX) return;
    setLoadingFile(true);
    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const wb = window.XLSX.read(evt.target.result, { type: 'binary' });
          const data = window.XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
          let batch = writeBatch(db); let count = 0; let success = 0;
          for (let i = 0; i < data.length; i++) {
            let p = null; const row = data[i]; const nowIso = new Date().toISOString();
            if (type === 'products' && row['Tên hàng']) p = { name: String(row['Tên hàng']), category: row['Nhóm hàng'] || '', price: Number(row['Giá bán']) || 0, cost: Number(row['Giá vốn']) || 0, stock: Number(row['Tồn kho']) || 0, createdAt: nowIso };
            else if (type === 'customers' && row['Tên khách hàng']) { const rawPhone = row['Điện thoại'] ? String(row['Điện thoại']) : ''; p = { name: String(row['Tên khách hàng']), phone: rawPhone.replace('.0', ''), totalDebt: Number(row['Nợ cần thu hiện tại']) || 0, createdAt: nowIso }; }
            else if (type === 'suppliers' && row['Tên nhà cung cấp']) { const rawPhone = row['Điện thoại'] ? String(row['Điện thoại']) : ''; p = { name: String(row['Tên nhà cung cấp']), phone: rawPhone.replace('.0', ''), totalDebt: Number(row['Nợ cần trả hiện tại']) || 0, createdAt: nowIso }; }
            else if (type === 'expenses' && row['Số tiền']) p = { amount: Number(row['Số tiền']), note: row['Nội dung'] || '', date: nowIso };
            if (p) { batch.set(doc(collection(db, 'stores', storeId, type)), p); count++; success++; }
            if (count === 400 || i === data.length - 1) { if (count > 0) { await batch.commit(); batch = writeBatch(db); count = 0; } }
          }
          showToast("Đã NHẬP thành công " + success + " dòng.");
          setLoadingFile(false); e.target.value = '';
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
        if (type === 'products') exportData.push({ 'Tên hàng': item.name, 'Nhóm hàng': item.category || '', 'Giá bán': item.price, 'Giá vốn': item.cost, 'Tồn kho': item.stock });
        if (type === 'customers') exportData.push({ 'Tên khách hàng': item.name, 'Điện thoại': item.phone, 'Nợ cần thu hiện tại': item.totalDebt });
        if (type === 'suppliers') exportData.push({ 'Tên nhà cung cấp': item.name, 'Điện thoại': item.phone, 'Nợ cần trả hiện tại': item.totalDebt });
        if (type === 'expenses') exportData.push({ 'Ngày': formatDate(item.date), 'Nội dung': item.note, 'Số tiền': item.amount });
      });
      const ws = window.XLSX.utils.json_to_sheet(exportData); const wb = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(wb, ws, "Data"); window.XLSX.writeFile(wb, "Xuat_Du_Lieu_" + type + ".xlsx");
      showToast("Đã XUẤT file Excel thành công!");
    } catch(e) { showToast("Lỗi xuất file", "error"); } setLoadingFile(false);
  };

  const menuItems = [{ id: 'customers', label: 'Khách hàng (Nợ phải thu)' }, { id: 'suppliers', label: 'Nhà cung cấp (Nợ phải trả)' }, { id: 'products', label: 'Hàng hóa & Kho' }, { id: 'expenses', label: 'Lịch sử Chi phí' }];

  const activeCfg = form[editPaperSize] || {};
  const isA4A5 = editPaperSize === 'A4' || editPaperSize === 'A5';
  const paperWidthClass = editPaperSize === 'K80' ? 'w-[300px]' : (editPaperSize === 'A4' ? 'w-[210mm]' : 'w-[148mm]');
  const baseFontSize = Number(activeCfg.printFontSize) || 12;

  const LivePreviewReceipt = () => {
    return (
      <div className={`bg-white shadow-2xl border border-gray-200 mx-auto transition-all ${paperWidthClass}`} style={{ fontSize: `${baseFontSize}px`, padding: isA4A5 ? '20px' : '15px', color: '#000', fontFamily: 'sans-serif' }}>
        <ReceiptTemplate order={null} storeConfig={{...form, printPaperSize: editPaperSize}} isA4A5={isA4A5} baseFontSize={baseFontSize} />
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 h-full overflow-hidden">
      <div className="p-4 md:p-6 bg-white border-b shrink-0 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 z-10">
        <div><h2 className="text-2xl font-black text-gray-800">Cài đặt Hệ thống</h2><p className="text-sm text-gray-500 font-medium">Cấu hình thông tin cửa hàng, mẫu in KiotViet và dữ liệu Excel</p></div>
        <div className="flex bg-gray-100 p-1 rounded-xl shadow-inner border w-full md:w-auto">
          <button onClick={() => setActiveSubTab('general')} className={`flex-1 md:w-32 py-2 text-sm font-bold rounded-lg flex justify-center items-center gap-2 transition-all ${activeSubTab==='general' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><Store size={16}/> Thông tin</button>
          <button onClick={() => setActiveSubTab('print')} className={`flex-1 md:w-36 py-2 text-sm font-bold rounded-lg flex justify-center items-center gap-2 transition-all ${activeSubTab==='print' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><Printer size={16}/> Mẫu in</button>
          <button onClick={() => setActiveSubTab('data')} className={`flex-1 md:w-32 py-2 text-sm font-bold rounded-lg flex justify-center items-center gap-2 transition-all ${activeSubTab==='data' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><Database size={16}/> Dữ liệu</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {activeSubTab === 'general' && (
          <div className="max-w-2xl mx-auto bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold border-b pb-3 mb-5 text-gray-800 flex items-center gap-2"><Store className="text-blue-600"/> Thông tin cơ bản</h3>
            <div className="space-y-5">
              <div className="flex gap-4 items-center">
                <div className="w-20 h-20 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center overflow-hidden relative group">
                  {form.logo ? <img src={form.logo} className="w-full h-full object-contain" alt="Logo" /> : <span className="text-xs text-gray-400 font-bold">Thêm Logo</span>}
                  <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center"><button type="button" onClick={() => setForm({...form, logo:''})} className="text-white text-xs font-bold hover:underline">Xóa</button></div>
                </div>
                <div className="flex-1"><label className="block text-sm font-bold text-gray-700 mb-1">Ảnh Logo cửa hàng</label><input type="file" accept="image/*" onChange={handleLogo} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" /></div>
              </div>
              <div><label className="block text-sm font-bold text-gray-700 mb-1">Tên cửa hàng *</label><input required placeholder="Nhập tên cửa hàng..." value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-blue-800 bg-gray-50 focus:bg-white transition-all"/></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-1">Địa chỉ</label><input placeholder="Nhập địa chỉ..." value={form.address} onChange={e=>setForm({...form,address:e.target.value})} className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all"/></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-1">Số điện thoại</label><input placeholder="Nhập số điện thoại..." value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all"/></div>
              <div className="pt-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">Phương pháp tính Giá vốn (khi nhập kho)</label>
                <select value={form.costCalcMethod} onChange={e=>setForm({...form, costCalcMethod: e.target.value})} className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-blue-800 bg-gray-50 focus:bg-white transition-all">
                  <option value="LATEST">Lấy giá nhập mới nhất (Ghi đè - Mặc định)</option><option value="AVERAGE">Tính bình quân gia quyền (MAC)</option><option value="HIGHEST">Lấy giá cao nhất</option><option value="LOWEST">Lấy giá thấp nhất</option>
                </select>
                <p className="text-[11px] text-gray-500 mt-1.5 italic">Hệ thống sẽ dựa vào cài đặt này để tự động cập nhật lại Giá vốn của hàng hóa mỗi khi bạn tạo Phiếu Nhập Kho.</p>
              </div>
              <button onClick={handleSaveConfig} disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all">{saving ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div> : <CheckCircle2 size={20}/>} Lưu Thông Tin </button>
            </div>
          </div>
        )}
        {activeSubTab === 'print' && (
          <div className="flex flex-col lg:flex-row gap-6 h-full min-h-[600px]">
            <div className="w-full lg:w-5/12 xl:w-1/3 flex flex-col h-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 bg-gray-50 border-b flex justify-between items-center shrink-0">
                <h3 className="font-bold text-gray-800 flex items-center gap-2"><Sliders size={18} className="text-blue-600"/> Tùy chỉnh Mẫu In</h3>
                <button onClick={handleSaveConfig} disabled={saving} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow hover:bg-blue-700 transition-colors">{saving ? 'Đang lưu...' : 'Lưu mẫu'}</button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Chọn Khổ Giấy Đang Chỉnh Sửa Độc Lập</h4>
                  <div className="flex gap-2">
                    {['K80', 'A4', 'A5'].map(size => (
                      <button key={size} onClick={() => { setEditPaperSize(size); setForm({...form, printPaperSize: size}); }} className={`flex-1 py-2 text-sm font-bold rounded-lg border transition-all ${editPaperSize === size ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                        {size === 'K80' ? 'Bill K80' : `Giấy ${size}`}
                      </button>
                    ))}
                  </div>
                  <div><label className="block text-sm font-bold text-gray-700 mb-1">Cỡ chữ tổng thể ({editPaperSize}) (px)</label><div className="flex items-center gap-3"><input type="range" min="8" max="24" step="0.5" value={activeCfg.printFontSize || 12} onChange={(e) => updateActiveSizeConfig('printFontSize', Number(e.target.value))} className="flex-1 accent-blue-600" /><input type="number" step="0.5" value={activeCfg.printFontSize || 12} onChange={(e) => updateActiveSizeConfig('printFontSize', Number(e.target.value))} className="w-16 p-1.5 border rounded-lg text-center font-bold text-sm outline-none" /></div></div>
                </div>
                <hr className="border-gray-100" />
                <div className="space-y-4 mt-6">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Tăng giảm Cỡ chữ độc lập cho từng dòng (So với cỡ tổng thể)</h4>
                  <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div><label className="text-xs font-bold text-gray-700">Cỡ chữ Tên Cửa Hàng ({activeCfg.fsStoreNameOffset ?? 2}px)</label><input type="range" min="-4" max="10" step="1" value={activeCfg.fsStoreNameOffset ?? 2} onChange={e=>updateActiveSizeConfig('fsStoreNameOffset', Number(e.target.value))} className="w-full accent-blue-600"/></div>
                    <div><label className="text-xs font-bold text-gray-700">Cỡ chữ Địa Chỉ ({activeCfg.fsStoreAddressOffset ?? 0}px)</label><input type="range" min="-4" max="10" step="1" value={activeCfg.fsStoreAddressOffset ?? 0} onChange={e=>updateActiveSizeConfig('fsStoreAddressOffset', Number(e.target.value))} className="w-full accent-blue-600"/></div>
                    <div><label className="text-xs font-bold text-gray-700">Cỡ chữ Số Điện Thoại ({activeCfg.fsStorePhoneOffset ?? 0}px)</label><input type="range" min="-4" max="10" step="1" value={activeCfg.fsStorePhoneOffset ?? 0} onChange={e=>updateActiveSizeConfig('fsStorePhoneOffset', Number(e.target.value))} className="w-full accent-blue-600"/></div>
                    <div><label className="text-xs font-bold text-gray-700">Cỡ chữ Tiêu Đề Hóa Đơn ({activeCfg.fsInvoiceTitleOffset ?? 4}px)</label><input type="range" min="-4" max="12" step="1" value={activeCfg.fsInvoiceTitleOffset ?? 4} onChange={e=>updateActiveSizeConfig('fsInvoiceTitleOffset', Number(e.target.value))} className="w-full accent-blue-600"/></div>
                    <div><label className="text-xs font-bold text-gray-700">Cỡ chữ Ngày / Mã HĐ ({activeCfg.fsMetaOffset ?? 0}px)</label><input type="range" min="-4" max="8" step="1" value={activeCfg.fsMetaOffset ?? 0} onChange={e=>updateActiveSizeConfig('fsMetaOffset', Number(e.target.value))} className="w-full accent-blue-600"/></div>
                  </div>
                </div>
                <hr className="border-gray-100" />
                <div className="space-y-4 mt-6">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Tùy chỉnh Kích thước, Bảng chi tiết</h4>
                  <div><label className="block text-sm font-bold text-gray-700 mb-1">Tỷ lệ Cỡ chữ phần Chi tiết ({activeCfg.printDetailFontScale ?? 80}%)</label><input type="range" min="50" max="150" step="5" value={activeCfg.printDetailFontScale ?? 80} onChange={(e) => updateActiveSizeConfig('printDetailFontScale', Number(e.target.value))} className="w-full accent-blue-600" /></div>
                  <div><label className="block text-sm font-bold text-gray-700 mb-1">Chiều ngang (Padding X: {activeCfg.printTablePaddingX ?? 4}px)</label><input type="range" min="0" max="20" step="1" value={activeCfg.printTablePaddingX ?? 4} onChange={(e) => updateActiveSizeConfig('printTablePaddingX', Number(e.target.value))} className="w-full accent-blue-600" /></div>
                  <div><label className="block text-sm font-bold text-gray-700 mb-1">Chiều dọc (Padding Y: {activeCfg.printTablePaddingY ?? 6}px)</label><input type="range" min="0" max="20" step="1" value={activeCfg.printTablePaddingY ?? 6} onChange={(e) => updateActiveSizeConfig('printTablePaddingY', Number(e.target.value))} className="w-full accent-blue-600" /></div>
                </div>
                {isA4A5 && (
                  <>
                    <hr className="border-gray-100" />
                    <div className="space-y-4 mt-6">
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Độ rộng từng Cột ({editPaperSize})</h4>
                      <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div><label className="text-[10px] font-bold text-gray-600 uppercase">Cột STT ({activeCfg.colWidthStt ?? 5}%)</label><input type="range" min="1" max="90" value={activeCfg.colWidthStt ?? 5} onChange={e=>handleColWidthChange('colWidthStt', e.target.value)} className="w-full accent-blue-600"/></div>
                        <div><label className="text-[10px] font-bold text-gray-600 uppercase">Cột Sản phẩm ({activeCfg.colWidthProduct ?? 35}%)</label><input type="range" min="1" max="90" value={activeCfg.colWidthProduct ?? 35} onChange={e=>handleColWidthChange('colWidthProduct', e.target.value)} className="w-full accent-blue-600"/></div>
                        <div><label className="text-[10px] font-bold text-gray-600 uppercase">Cột SL ({activeCfg.colWidthQty ?? 8}%)</label><input type="range" min="1" max="90" value={activeCfg.colWidthQty ?? 8} onChange={e=>handleColWidthChange('colWidthQty', e.target.value)} className="w-full accent-blue-600"/></div>
                        <div><label className="text-[10px] font-bold text-gray-600 uppercase">Cột Đơn giá ({activeCfg.colWidthPrice ?? 12}%)</label><input type="range" min="1" max="90" value={activeCfg.colWidthPrice ?? 12} onChange={e=>handleColWidthChange('colWidthPrice', e.target.value)} className="w-full accent-blue-600"/></div>
                        <div><label className="text-[10px] font-bold text-gray-600 uppercase">Cột Bảo hành ({activeCfg.colWidthWarranty ?? 12}%)</label><input type="range" min="1" max="90" value={activeCfg.colWidthWarranty ?? 12} onChange={e=>handleColWidthChange('colWidthWarranty', e.target.value)} className="w-full accent-blue-600"/></div>
                        <div><label className="text-[10px] font-bold text-gray-600 uppercase">Cột Ghi chú ({activeCfg.colWidthNote ?? 13}%)</label><input type="range" min="1" max="90" value={activeCfg.colWidthNote ?? 13} onChange={e=>handleColWidthChange('colWidthNote', e.target.value)} className="w-full accent-blue-600"/></div>
                        <div className="col-span-2"><label className="text-[10px] font-bold text-gray-600 uppercase">Cột Thành tiền ({activeCfg.colWidthTotal ?? 15}%)</label><input type="range" min="1" max="90" value={activeCfg.colWidthTotal ?? 15} onChange={e=>handleColWidthChange('colWidthTotal', e.target.value)} className="w-full accent-blue-600"/></div>
                      </div>
                    </div>
                  </>
                )}
                <hr className="border-gray-100" />
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Đầu trang & Cửa hàng ({editPaperSize})</h4>
                  <div className="space-y-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <ToggleSwitch label="In Logo cửa hàng" checked={activeCfg.printShowLogo ?? true} onChange={(val) => updateActiveSizeConfig('printShowLogo', val)} />
                    <ToggleSwitch label="In Tên cửa hàng" checked={activeCfg.printShowStoreName ?? true} onChange={(val) => updateActiveSizeConfig('printShowStoreName', val)} />
                    <ToggleSwitch label="In Địa chỉ cửa hàng" checked={activeCfg.printShowStoreAddress ?? true} onChange={(val) => updateActiveSizeConfig('printShowStoreAddress', val)} />
                    <ToggleSwitch label="In Số điện thoại" checked={activeCfg.printShowStorePhone ?? true} onChange={(val) => updateActiveSizeConfig('printShowStorePhone', val)} />
                  </div>
                  <div><label className="block text-sm font-bold text-gray-700 mb-1">Tiêu đề hóa đơn</label><input value={activeCfg.printInvoiceTitle || ''} onChange={e=>updateActiveSizeConfig('printInvoiceTitle', e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold uppercase text-gray-800"/></div>
                </div>
                <hr className="border-gray-100" />
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Thông tin Hóa đơn & Hàng hóa ({editPaperSize})</h4>
                  <div className="space-y-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <ToggleSwitch label="In Mã hóa đơn" checked={activeCfg.printShowInvoiceId ?? true} onChange={(val) => updateActiveSizeConfig('printShowInvoiceId', val)} />
                    <ToggleSwitch label="In Ngày giờ bán" checked={activeCfg.printShowDate ?? true} onChange={(val) => updateActiveSizeConfig('printShowDate', val)} />
                    <ToggleSwitch label="In Tên Thu ngân" checked={activeCfg.printShowCashier ?? true} onChange={(val) => updateActiveSizeConfig('printShowCashier', val)} />
                    <ToggleSwitch label="In Tên Khách hàng" checked={activeCfg.printShowCustomer ?? true} onChange={(val) => updateActiveSizeConfig('printShowCustomer', val)} />
                    <ToggleSwitch label="In SĐT Khách hàng" checked={activeCfg.printShowCustomerPhone ?? true} onChange={(val) => updateActiveSizeConfig('printShowCustomerPhone', val)} />
                    <ToggleSwitch label="In Trạng thái (Đã thu/Ghi nợ)" checked={activeCfg.printShowStatus ?? true} onChange={(val) => updateActiveSizeConfig('printShowStatus', val)} />
                    <div className="h-px bg-gray-200 my-2"></div>
                    <ToggleSwitch label="Hiển thị thông tin Bảo hành" checked={activeCfg.printShowWarranty ?? true} onChange={(val) => updateActiveSizeConfig('printShowWarranty', val)} />
                    <ToggleSwitch label="Hiển thị Ghi chú từng món" checked={activeCfg.printShowNote ?? true} onChange={(val) => updateActiveSizeConfig('printShowNote', val)} />
                  </div>
                </div>
                <hr className="border-gray-100" />
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Chân trang ({editPaperSize})</h4>
                  <div><label className="block text-sm font-bold text-gray-700 mb-1">Lời cảm ơn / Ghi chú</label><textarea value={activeCfg.printFooter || ''} onChange={e=>updateActiveSizeConfig('printFooter', e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm h-20 resize-none"/></div>
                </div>
              </div>
            </div>
            <div className="w-full lg:w-7/12 xl:w-2/3 bg-gray-200 rounded-2xl flex items-start justify-center p-6 overflow-y-auto relative border border-gray-300 shadow-inner">
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 shadow flex items-center gap-1.5"><Eye size={14} className="text-blue-500"/> Xem trước trực tiếp ({editPaperSize})</div>
              <LivePreviewReceipt />
            </div>
          </div>
        )}
        {activeSubTab === 'data' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-red-50 p-6 rounded-2xl border border-red-200 shadow-sm relative overflow-hidden">
              <div className="absolute -right-4 -top-4 text-red-100 rotate-12"><HardDrive size={120} /></div>
              <div className="relative z-10">
                <h3 className="text-lg font-black text-red-800 mb-2 flex items-center gap-2"><ShieldAlert size={20}/> KHU VỰC NGUY HIỂM</h3>
                <p className="text-sm text-red-700 mb-5 font-medium max-w-lg">Thao tác này sẽ xóa sạch toàn bộ sản phẩm, hóa đơn, khách hàng, nhà cung cấp và chi phí trên cửa hàng. Dữ liệu KHÔNG THỂ KHÔI PHỤC.</p>
                <button onClick={async () => {
                  if (window.confirm("CẢNH BÁO TUYỆT ĐỐI: Bạn có chắc chắn muốn XÓA TRẮNG toàn bộ cơ sở dữ liệu không? Thao tác này không thể hoàn tác!")) {
                    try {
                      showToast("Đang tiến hành xóa dữ liệu...", "error");
                      const collections = ['products', 'orders', 'imports', 'customers', 'suppliers', 'expenses'];
                      for (let col of collections) {
                        const snap = await getDocs(collection(db, 'stores', storeId, col));
                        let batch = writeBatch(db); let count = 0;
                        snap.docs.forEach((d) => { batch.delete(d.ref); count++; if (count >= 400) { batch.commit(); batch = writeBatch(db); count = 0; } });
                        if (count > 0) await batch.commit();
                      }
                      showToast("Đã xóa trắng toàn bộ dữ liệu thành công!");
                    } catch(err) { showToast("Lỗi khi xóa dữ liệu", "error"); }
                  }
                }} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-md transition-colors" > Xóa Trắng Toàn Bộ Dữ Liệu </button>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border shadow-sm">
              <h3 className="font-bold border-b pb-3 mb-5 text-gray-800 flex items-center gap-2"><FileText className="text-green-600"/> Nhập / Xuất File Excel</h3>
              {loadingFile && <div className="mb-4 text-blue-600 font-bold flex items-center gap-2"><div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div> Đang xử lý file, vui lòng đợi...</div>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {menuItems.map(item => (
                  <div key={item.id} className="border border-gray-200 p-4 rounded-xl flex flex-col gap-3 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                    <span className="font-bold text-gray-800">{item.label}</span>
                    <div className="flex gap-2 w-full">
                      <div className="relative overflow-hidden bg-white text-gray-700 px-3 py-2 rounded-lg border shadow-sm hover:border-blue-400 flex items-center gap-2 cursor-pointer flex-1 justify-center transition-colors font-medium text-sm"> <Upload size={16} className="text-blue-500"/> Tải File Lên (Nhập) <input type="file" accept=".xls,.xlsx" onChange={(e) => handleImport(e, item.id)} disabled={loadingFile} className="absolute inset-0 opacity-0 cursor-pointer"/> </div>
                      <button onClick={() => handleExport(item.id)} disabled={loadingFile} className="bg-white hover:bg-green-50 text-gray-700 px-3 py-2 rounded-lg border shadow-sm hover:border-green-400 flex items-center gap-2 flex-1 justify-center transition-colors font-medium text-sm"> <Download size={16} className="text-green-600"/> Tải Xuống (Xuất) </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
