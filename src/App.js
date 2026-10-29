import React, { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, ShoppingCart, Package, Users, Truck, Plus, Edit, Trash2, Check, X, Image as ImageIcon, ShoppingBag, TrendingUp, AlertCircle, ArrowDownToLine, Phone, DollarSign, CheckCircle2, Printer, FileText, CreditCard, Lock, LogOut, ShieldAlert, User as UserIcon, Database, UserCog, KeyRound, MonitorSmartphone, Mail, Download, Upload, ArrowUpDown, Search, Eye, EyeOff, Bell, Award, BarChart3, Receipt, ChevronDown, ChevronUp, Image, Store, Sliders, HardDrive, ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, onSnapshot, collection, writeBatch, query, orderBy, where, limit } from 'firebase/firestore';

const firebaseConfig = {
 apiKey: "AIzaSyC9nnxzOOWIDTym9Lzo2Kn2J1gS0ro-QQs",
    authDomain: "autrung-7d8be.firebaseapp.com",
    projectId: "autrung-7d8be",
    storageBucket: "autrung-7d8be.firebasestorage.app",
    messagingSenderId: "682074587160",
    appId: "1:682074587160:web:24da7989f82d94d589c36d",
  measurementId: "G-0YW45XF8QL"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const PERMISSION_TREE = [
  { module: 'Tổng quan', perms: [{ id: 'tong_quan_xem', label: 'Xem tổng quan' }, { id: 'dash_stat_revenue', label: 'Tổng quan: thẻ Doanh thu' }, { id: 'dash_stat_cost', label: 'Tổng quan: thẻ Tổng giá vốn' }, { id: 'dash_stat_expense', label: 'Tổng quan: thẻ Tổng chi phí' }, { id: 'dash_stat_profit', label: 'Tổng quan: thẻ Lãi ròng' }, { id: 'dash_activity_date', label: 'Tổng quan: cột Thời gian giao dịch' }, { id: 'dash_activity_type', label: 'Tổng quan: cột Loại giao dịch' }, { id: 'dash_activity_staff', label: 'Tổng quan: cột Người thực hiện' }, { id: 'dash_activity_partner', label: 'Tổng quan: cột Khách hàng/Nhà cung cấp' }, { id: 'dash_activity_items', label: 'Tổng quan: cột Chi tiết hàng hóa' }, { id: 'dash_activity_amount', label: 'Tổng quan: cột Thành tiền' }, { id: 'dash_warranty_date', label: 'Tổng quan: cột Thời gian bảo hành' }, { id: 'dash_warranty_customer', label: 'Tổng quan: cột Khách hàng bảo hành' }, { id: 'dash_warranty_location', label: 'Tổng quan: cột Nơi bảo hành' }, { id: 'dash_warranty_items', label: 'Tổng quan: cột Sản phẩm bảo hành' }, { id: 'dash_warranty_status', label: 'Tổng quan: cột Tình trạng bảo hành' }, { id: 'dash_overdue_customer', label: 'Tổng quan: cột Khách hàng nợ' }, { id: 'dash_overdue_date', label: 'Tổng quan: cột Ngày mua nợ' }, { id: 'dash_overdue_days', label: 'Tổng quan: cột Số ngày nợ' }, { id: 'dash_overdue_amount', label: 'Tổng quan: cột Số tiền nợ' }] },
  { module: 'Quản lý Bán hàng', perms: [{ id: 'ban_hang', label: 'Quản lý bán hàng & Hóa đơn' }] },
  { module: 'Hàng hóa', perms: [{ id: 'hh_danh_sach', label: 'Danh sách hàng hóa' }, { id: 'hh_gia', label: 'Thiết lập giá' }] },
  { module: 'Mua hàng', perms: [{ id: 'mua_ncc', label: 'Danh sách nhà cung cấp' }, { id: 'mua_nhap_hang', label: 'Nhập hàng' }] },
  { module: 'Khách hàng / Nhà cung cấp', perms: [{ id: 'kh_danh_sach', label: 'Danh sách khách hàng' }, { id: 'contact_edit_detail_amounts', label: 'Cho phép sửa số tiền giao dịch/đã thanh toán/đang nợ trong chi tiết khách hàng và nhà cung cấp' }] },
  { module: 'Sổ quỹ', perms: [{ id: 'quy_so_quy', label: 'Sổ quỹ / Chi phí' }] }
];

const VIETNAM_TIME_ZONE = 'Asia/Ho_Chi_Minh';
const getVietnamDateParts = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: VIETNAM_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(date);
  return Object.fromEntries(parts.filter(part => part.type !== 'literal').map(part => [part.type, Number(part.value)]));
};
const getVietnamDateKey = (date = new Date()) => {
  const p = getVietnamDateParts(date);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
};
const generateInvoiceCode = (orders = [], date = new Date()) => {
  const vietnamDate = getVietnamDateParts(date);
  const prefix = `${String(vietnamDate.month).padStart(2, '0')}${String(vietnamDate.year).slice(-2)}`;
  const existing = orders.map(o => o.invoiceCode || '').filter(code => code.startsWith(`AT${prefix}`));
  const maxSeq = existing.reduce((max, code) => {
    const seq = Number(code.slice(6));
    return Number.isFinite(seq) ? Math.max(max, seq) : max;
  }, 0);
  return `AT${prefix}${String(maxSeq + 1).padStart(8, '0')}`;
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
};

const formatDate = (iso) => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('vi-VN', { timeZone: VIETNAM_TIME_ZONE, dateStyle: 'short', timeStyle: 'medium', hourCycle: 'h23' }).format(date);
};

const formatDateOnly = (iso) => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('vi-VN', { timeZone: VIETNAM_TIME_ZONE, day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
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
  // Render existing modal content as a dedicated full-page view rather than an overlay.
  const containerClass = "bg-white w-full min-h-full overflow-hidden flex flex-col";
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white">
      <div className={containerClass}>
        {!hideHeaderInPrint && (
          <div className="sticky top-0 z-10 flex items-center gap-2 p-3 border-b bg-white shadow-sm print:hidden">
            <button type="button" onClick={() => { if (typeof window !== 'undefined' && window.history.length > 1) window.history.back(); else onClose(); }} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"><ChevronLeft size={18}/> Lùi</button>
            <button type="button" onClick={() => { if (typeof window !== 'undefined') window.history.forward(); }} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"><ChevronRight size={18}/> Tiến</button>
            <h3 className="ml-2 flex-1 text-lg font-bold text-gray-800">{title}</h3>
            <button type="button" onClick={onClose} className="rounded-lg border bg-white p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-blue-500" aria-label="Đóng trang"><X size={20} /></button>
          </div>
        )}
        <div className={'mx-auto w-full ' + maxWidth + ' p-4 bg-white'}>{children}</div>
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
      <div className="border-b border-dashed border-gray-400 pb-3 mb-3 relative z-10">
        {isA4A5 ? (
          <div className="flex items-center gap-4 mb-3">
            {cfg.printShowLogo && storeConfig.printTopLogoEnabled === true && storeConfig.logo && (
              <div className="shrink-0">
                <img src={storeConfig.logo} alt="Logo" style={{width:`${Number(cfg.printLogoWidth)||75}px`,height:`${Number(cfg.printLogoHeight)||64}px`,maxWidth:`${Number(cfg.printLogoWidth)||75}px`,maxHeight:`${Number(cfg.printLogoHeight)||64}px`,objectFit:'contain'}} />
              </div>
            )}
            <div className="flex flex-col flex-1">
              {cfg.printShowStoreName && (
                <h2 className="font-bold uppercase" style={{fontSize: fsStoreName, transform: `translateX(${Number(cfg.storeNameXOffset || 0)}px)`}}>
                  {cfg.printStoreName ?? storeConfig.name ?? 'QUẢN LÝ BÁN HÀNG'}
                </h2>
              )}
              {cfg.printShowStoreAddress && <p className="mt-0.5" style={{fontSize: fsStoreAddress, transform: `translateX(${Number(cfg.storeAddressXOffset || 0)}px)`}}> {cfg.printAddressLabel ?? 'Địa chỉ'}: {cfg.printStoreAddress ?? storeConfig.address}</p>}
              {cfg.printShowStorePhone && <p style={{fontSize: fsStorePhone, transform: `translateX(${Number(cfg.storePhoneXOffset || 0)}px)`}}> {cfg.printPhoneLabel ?? 'SĐT'}: {cfg.printStorePhone ?? storeConfig.phone}</p>}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center mb-2">
            {cfg.printShowLogo && storeConfig.printTopLogoEnabled === true && storeConfig.logo && (
              <div className="mb-2">
                <img src={storeConfig.logo} alt="Logo" style={{width:`${Number(cfg.printLogoWidth)||75}px`,height:`${Number(cfg.printLogoHeight)||64}px`,maxWidth:`${Number(cfg.printLogoWidth)||75}px`,maxHeight:`${Number(cfg.printLogoHeight)||64}px`,objectFit:'contain'}} />
              </div>
            )}
            {cfg.printShowStoreName && (
              <h2 className="font-bold uppercase" style={{fontSize: fsStoreName, transform: `translateX(${Number(cfg.storeNameXOffset || 0)}px)`}}>
                {cfg.printStoreName ?? storeConfig.name ?? 'QUẢN LÝ BÁN HÀNG'}
              </h2>
            )}
            {cfg.printShowStoreAddress && <p className="mt-0.5" style={{fontSize: fsStoreAddress, transform: `translateX(${Number(cfg.storeAddressXOffset || 0)}px)`}}> {cfg.printAddressLabel ?? 'Địa chỉ'}: {cfg.printStoreAddress ?? storeConfig.address}</p>}
            {cfg.printShowStorePhone && <p style={{fontSize: fsStorePhone, transform: `translateX(${Number(cfg.storePhoneXOffset || 0)}px)`}}> {cfg.printPhoneLabel ?? 'SĐT'}: {cfg.printStorePhone ?? storeConfig.phone}</p>}
          </div>
        )}

        <div className="text-center mt-3">
          <h1 className="font-bold uppercase" style={{fontSize: fsInvoiceTitle}}>
            {cfg.printInvoiceTitle || 'HÓA ĐƠN BÁN HÀNG'}
          </h1>
          {cfg.printShowDate && <div className="text-center mt-1 text-gray-800" style={{fontSize: `${baseFontSize + (cfg.fsMetaOffset ?? 0)}px`}}>{cfg.printDateLabel ?? 'Ngày lập phiếu'}: {order?.date ? formatDateOnly(order.date) : formatDateOnly(new Date())}</div>}
          {cfg.printShowInvoiceId && <div className="text-center mt-1 text-gray-800" style={{fontSize: fsMeta}}>{cfg.printInvoiceIdLabel ?? 'Mã HĐ'}: {order?.invoiceCode || order?.id?.slice(0,6).toUpperCase() || 'HD12345'}</div>}
        </div>
      </div>

      <div className="mb-3 space-y-1" style={{fontSize: `${baseFontSize}px`}}>
        {cfg.printShowCustomer && <p><strong>{cfg.printCustomerLabel ?? 'Khách hàng'}:</strong> {order?.customerName || 'Anh Nguyễn Văn A'}</p>}
        {cfg.printShowCustomerPhone && <p><strong>{cfg.printCustomerPhoneLabel ?? 'SĐT'}:</strong> {order?.phone || '0987.654.321'}</p>}
        {cfg.printShowCashier && <p><strong>{cfg.printCashierLabel ?? 'Thu ngân'}:</strong> Bán hàng</p>}
        {cfg.printShowStatus && <p><strong>{cfg.printStatusLabel ?? 'Trạng thái'}:</strong> {order?.status === 'PAID' ? 'Đã thanh toán' : (order?.status === 'DEBT' ? 'Ghi nợ' : 'Đã thanh toán')}</p>}
      </div>

      <table className="w-full mb-3 border-collapse">
        <thead>
          <tr className="border-b border-gray-400 bg-gray-100/50">
            {isA4A5 && <th style={{...thStyle, width: wStt}} className="border border-gray-300">STT</th>}
            <th style={{...thStyle, width: wProd}} className={`border border-gray-300`}>{cfg.printProductLabel ?? 'Tên hàng'}</th>
            <th style={{...thStyle, width: wQty}} className={`border border-gray-300`}>{cfg.printQtyLabel ?? 'SL'}</th>
            <th style={{...thStyle, width: wPrice}} className={`border border-gray-300`}>{cfg.printPriceLabel ?? 'Đơn giá'}</th>
            {showBH && <th style={{...thStyle, width: wWarranty}} className="border border-gray-300">{cfg.printWarrantyLabel ?? 'Bảo hành'}</th>}
            {showGC && <th style={{...thStyle, width: wNote}} className="border border-gray-300">{cfg.printNoteLabel ?? 'Ghi chú'}</th>}
            <th style={{...thStyle, width: wTotal}} className={`border border-gray-300`}>{cfg.printTotalLabel ?? 'Thành tiền'}</th>
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
                    {cfg.printShowWarranty !== false && i.warrantyValue && <div>- {cfg.printWarrantyLabel ?? 'BH'}: {i.warrantyValue} {i.warrantyUnit}</div>}
                    {cfg.printShowNote !== false && i.note && <div>- {cfg.printNoteLabel ?? 'GC'}: {i.note}</div>}
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
            <td colSpan={isA4A5 ? a4a5ColSpan : 3} className={`py-3 px-1 text-right uppercase ${isA4A5 ? 'border border-gray-300' : ''}`}>{cfg.printSubtotalLabel ?? 'Tổng tiền hàng'}:</td>
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
  const [loginLogo, setLoginLogo] = useState('');
  useEffect(() => { getDoc(doc(db, 'stores', 'main_store')).then(snap => { if (snap.exists()) setLoginLogo(snap.data().logo || ''); }).catch(() => {}); }, []);

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
          {loginLogo ? <img src={loginLogo} alt="Logo" className="w-20 h-20 object-contain mx-auto mb-4" /> : <div className="bg-blue-100 text-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><Lock size={32} /></div>}
          <h1 className="text-2xl font-bold text-gray-800">QUẢN LÝ BÁN HÀNG</h1>
          <p className="text-gray-500 text-sm mt-2">{isForgot ? 'Khôi phục mật khẩu' : 'Đăng nhập hệ thống'}</p>
        </div>
        {error && <div className="bg-blue-50 text-blue-600 p-3 rounded-lg flex items-center gap-2 mb-4 text-sm"><ShieldAlert size={16} /> {error}</div>}
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


const getRequestedDetailRoute = () => {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const tab = params.get('detailTab') || '';
  const id = params.get('detailId') || '';
  const name = params.get('detailName') || '';
  return ['products', 'customers', 'suppliers'].includes(tab) && (id || name) ? { tab, id, name, nonce: Date.now() } : null;
};
const openEntityInNewTab = (tab, entity, entityName = '') => {
  if (typeof window === 'undefined') return;
  const target = typeof entity === 'string' ? { id: entity, name: entityName } : (entity || {});
  const url = new URL(window.location.href);
  url.searchParams.set('detailTab', tab);
  if (target.id) url.searchParams.set('detailId', String(target.id)); else url.searchParams.delete('detailId');
  if (target.name) url.searchParams.set('detailName', String(target.name)); else url.searchParams.delete('detailName');
  window.open(url.toString(), '_blank', 'noopener,noreferrer');
};
const navigateMainTab = (tab, entity = null, entityName = '') => {
  if (typeof window === 'undefined') return;
  const target = typeof entity === 'string' ? { id: entity, name: entityName } : entity;
  if (target && ['products', 'customers', 'suppliers'].includes(tab)) { openEntityInNewTab(tab, target); return; }
  const detail = { tab, entity: target, recordId: target?.id || '', recordName: target?.name || '' };
  window.history.pushState({ ...(window.history.state || {}), appPopupNavigation: { tab, entity: target || null } }, '');
  window.dispatchEvent(new CustomEvent('app:navigate-tab', { detail }));
  window.setTimeout(() => window.dispatchEvent(new CustomEvent('app:navigate-tab', { detail })), 80);
};

const DATA_EXCEL_TYPES = {
  sales_history: { key: 'orders', label: 'Đơn hàng', file: 'Don_Hang.xlsx' },
  imports: { key: 'imports', label: 'Nhập hàng', file: 'Nhap_Hang.xlsx' },
  products: { key: 'products', label: 'Sản phẩm', file: 'San_Pham.xlsx' },
  warranty: { key: 'warrantyRequests', label: 'Bảo hành', file: 'Bao_Hanh.xlsx' },
  customers: { key: 'customers', label: 'Khách hàng', file: 'Khach_Hang.xlsx' },
  suppliers: { key: 'suppliers', label: 'Nhà cung cấp', file: 'Nha_Cung_Cap.xlsx' },
  expenses: { key: 'expenses', label: 'Chi phí', file: 'Chi_Phi.xlsx' }
};
const DATA_EXCEL_PAYLOAD = '__DU_LIEU_PHUC_HOI__';
const ensureXLSXLibrary = () => new Promise((resolve, reject) => {
  if (typeof window !== 'undefined' && window.XLSX) return resolve(window.XLSX);
  const existing = document.querySelector('script[data-app-xlsx="1"]');
  if (existing) { existing.addEventListener('load', () => resolve(window.XLSX), { once: true }); existing.addEventListener('error', () => reject(new Error('Không tải được thư viện Excel.')), { once: true }); return; }
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
  script.dataset.appXlsx = '1';
  script.onload = () => window.XLSX ? resolve(window.XLSX) : reject(new Error('Thư viện Excel chưa sẵn sàng.'));
  script.onerror = () => reject(new Error('Không tải được thư viện Excel.'));
  document.head.appendChild(script);
});
const flattenExcelDisplay = (data, prefix = '', output = {}) => {
  Object.entries(data || {}).forEach(([key, value]) => {
    if (value === undefined) return;
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date) && prefix.split('.').length < 1) flattenExcelDisplay(value, path, output);
    else if (Array.isArray(value)) output[path] = value.map(item => item && typeof item === 'object' ? Object.entries(item).filter(([,v])=>v==null||typeof v!=='object').map(([k,v])=>`${k}: ${v ?? ''}`).join(' | ') : String(item ?? '')).join(' ; ');
    else if (value && typeof value === 'object') output[path] = Object.entries(value).filter(([,v])=>v==null||typeof v!=='object').map(([k,v])=>`${k}: ${v ?? ''}`).join(' | ');
    else output[path] = value == null ? '' : value;
  });
  return output;
};
function DataExcelToolbar({ activeTab, db, storeId, showToast }) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const config = DATA_EXCEL_TYPES[activeTab];
  if (!config) return null;
  const exportExcel = async () => {
    if (busy) return;
    setBusy(true); setStatus('Đang xuất dữ liệu...');
    try {
      const XLSX = await ensureXLSXLibrary();
      const snap = await getDocs(collection(db, 'stores', storeId, config.key));
      const records = snap.docs.map(d => ({ id: d.id, data: d.data() }));
      const rows = records.map(({id,data}) => ({ ID: id, ...flattenExcelDisplay(data), [DATA_EXCEL_PAYLOAD]: JSON.stringify(data) }));
      const keys = Array.from(new Set(rows.flatMap(r => Object.keys(r))));
      const orderedKeys = ['ID', ...keys.filter(k => k !== 'ID' && k !== DATA_EXCEL_PAYLOAD), DATA_EXCEL_PAYLOAD];
      const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ ID: '', [DATA_EXCEL_PAYLOAD]: '' }], { header: orderedKeys });
      ws['!cols'] = orderedKeys.map(k => k === DATA_EXCEL_PAYLOAD ? { wch: 0, hidden: true } : { wch: Math.min(34, Math.max(12, k.length + 2)) });
      ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: Math.max(0, rows.length), c: orderedKeys.length - 1 } }) };
      ws['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft', state: 'frozen' };
      const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, config.label.slice(0,31));
      XLSX.writeFile(wb, config.file);
      setStatus(`Đã xuất ${records.length} bản ghi ${config.label} ra Excel.`);
      showToast(`Đã xuất Excel ${config.label}.`);
    } catch (err) { setStatus(`Xuất Excel thất bại: ${err.message || 'Lỗi không xác định'}`); showToast(`Không xuất được Excel: ${err.message || 'Lỗi'}`, 'error'); }
    finally { setBusy(false); }
  };
  const importExcel = async event => {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file || busy) return;
    setBusy(true); setStatus('Đang đọc file Excel...');
    try {
      const XLSX = await ensureXLSXLibrary();
      const wb = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: true });
      const parsed = rows.map(row => {
        const id = String(row.ID || row.id || '').trim();
        let data = null;
        try { data = JSON.parse(row[DATA_EXCEL_PAYLOAD] || row['__DỮ_LIỆU_PHỤC_HỒI__'] || 'null'); } catch (_) {}
        return id && data && typeof data === 'object' && !Array.isArray(data) ? { id, data } : null;
      }).filter(Boolean);
      if (!parsed.length) throw new Error('File không có dữ liệu phục hồi hợp lệ. Hãy dùng file Excel được xuất từ chính thẻ này.');
      const deduped = Array.from(new Map(parsed.map(row => [row.id, row])).values());
      const ok = window.confirm(`Nhập Excel ${config.label}\nFile: ${file.name}\nBản ghi hợp lệ: ${parsed.length}\nID trùng trong file đã gộp: ${parsed.length - deduped.length}\n\nID đã tồn tại sẽ được cập nhật; ID mới sẽ được thêm. Bản ghi không có trong file sẽ được giữ nguyên. Tiếp tục?`);
      if (!ok) { setStatus('Đã hủy nhập; Firebase chưa thay đổi.'); return; }
      let saved = 0;
      for (let i = 0; i < deduped.length; i += 400) {
        const batch = writeBatch(db);
        deduped.slice(i, i + 400).forEach(row => { const clean = { ...row.data }; delete clean.id; batch.set(doc(db, 'stores', storeId, config.key, row.id), clean); });
        await batch.commit(); saved += Math.min(400, deduped.length - i);
        setStatus(`Đã ghi ${saved}/${deduped.length} bản ghi...`);
      }
      setStatus(`Đã nhập ${saved} bản ghi ${config.label}. Bản ghi khác không bị xóa.`);
      showToast(`Đã nhập ${saved} bản ghi ${config.label}.`);
    } catch (err) { setStatus(`Nhập Excel thất bại: ${err.message || 'Lỗi không xác định'}`); showToast(`Không nhập được Excel: ${err.message || 'Lỗi'}`, 'error'); }
    finally { setBusy(false); }
  };
  return <section className="mx-3 mt-3 md:mx-5 bg-white border border-blue-100 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center gap-3 shadow-sm"><div className="flex-1 min-w-0"><div className="font-bold text-gray-800 text-sm">Nhập / xuất Excel · {config.label}</div><div className="text-xs text-gray-500 mt-1">Excel có tiêu đề cột và dữ liệu chi tiết; có thể nhập lại file đã xuất để khôi phục bản ghi.</div>{status && <div className="text-xs text-blue-700 mt-1" role="status">{status}</div>}</div><div className="flex gap-2"><label className={`relative overflow-hidden inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border font-semibold text-sm cursor-pointer ${busy?'opacity-50 pointer-events-none':'hover:bg-blue-50'}`}><Upload size={15}/> Nhập Excel<input type="file" accept=".xlsx,.xls" onChange={importExcel} disabled={busy} className="absolute inset-0 opacity-0 cursor-pointer"/></label><button type="button" onClick={exportExcel} disabled={busy} className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-green-600 text-white font-semibold text-sm disabled:opacity-50"><Download size={15}/> Xuất Excel</button></div></section>;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({ role: null, name: '', perms: {} });
  const [activeTab, setActiveTab] = useState(() => getRequestedDetailRoute()?.tab || 'pos');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [debtPaymentReports, setDebtPaymentReports] = useState([]);
  const [navigationTarget, setNavigationTarget] = useState(() => getRequestedDetailRoute());
  useEffect(() => { const handlePopupNavigate = (event) => { const tab = event?.detail?.tab; if (['products','customers','suppliers','warranty','sales_history','imports'].includes(tab)) { setNavigationTarget({ tab, id: event?.detail?.entity?.id || event?.detail?.recordId || '', name: event?.detail?.entity?.name || event?.detail?.recordName || '', nonce: Date.now() }); setActiveTab(tab); } }; const handleBrowserBack = (event) => { const nav = event.state?.appPopupNavigation; if (nav?.tab) { const detail = { tab: nav.tab, entity: nav.entity || null, recordId: nav.entity?.id || '', recordName: nav.entity?.name || '' }; window.dispatchEvent(new CustomEvent('app:navigate-tab', { detail })); } else { window.dispatchEvent(new CustomEvent('app:close-popups')); } }; window.addEventListener('app:navigate-tab', handlePopupNavigate); window.addEventListener('popstate', handleBrowserBack); return () => { window.removeEventListener('app:navigate-tab', handlePopupNavigate); window.removeEventListener('popstate', handleBrowserBack); }; }, []);
  const [storeConfig, setStoreConfig] = useState({
    name: 'QUẢN LÝ BÁN HÀNG', address: '', phone: '', logo: '', costCalcMethod: 'LATEST',
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
  const [warrantyRequests, setWarrantyRequests] = useState([]);
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
          setActiveTab(getRequestedDetailRoute()?.tab || (data.role === 'admin' ? 'dashboard' : 'pos'));
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
    const unsubWarranty = fetchCol('warrantyRequests', setWarrantyRequests);
    const unsubDebtPaymentReports = fetchCol('debtPaymentReports', setDebtPaymentReports);

    return () => { unsubStore(); unsubProducts(); unsubOrders(); unsubImports(); unsubCustomers(); unsubSuppliers(); unsubExpenses(); unsubWarranty(); unsubDebtPaymentReports(); };
  }, [user]);

  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  if (!user) return <LoginView onLoginSuccess={(userInfo) => { setUser(userInfo); setUserData({ role: userInfo.role, name: userInfo.name, perms: userInfo.perms }); setActiveTab(getRequestedDetailRoute()?.tab || (userInfo.role === 'admin' ? 'dashboard' : 'pos')); }} />;

  const allTabs = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Tổng quan', permId: 'tong_quan_xem' },
    { id: 'reports', icon: FileText, label: 'Báo cáo', permId: 'tong_quan_xem' },
    { id: 'sales_history', icon: Receipt, label: 'Đơn hàng', permId: 'ban_hang' },
    { id: 'imports', icon: ArrowDownToLine, label: 'Nhập hàng', permId: 'mua_nhap_hang' },
    { id: 'products', icon: Package, label: 'Sản phẩm', permId: 'hh_danh_sach' },
    { id: 'warranty', icon: ShieldAlert, label: 'Bảo hành', permId: 'hh_danh_sach' },
    { id: 'customers', icon: Users, label: 'Khách hàng', permId: 'kh_danh_sach' },
    { id: 'suppliers', icon: Truck, label: 'Nhà cung cấp', permId: 'mua_ncc' },
    { id: 'expenses', icon: CreditCard, label: 'Chi phí', permId: 'quy_so_quy' },
    { id: 'settings', icon: Database, label: 'Cài đặt', permId: 'ADMIN_ONLY' },
  ];

  const visibleTabs = allTabs.filter(t => {
    if (userData.role === 'admin') return true;
    if (t.permId === 'ADMIN_ONLY') return false;
    if (t.permId === 'ALWAYS') return true;
    return userData.perms[t.permId];
  });

  return (
    <div className="min-h-screen bg-[#f3f5f7] flex flex-col font-sans text-sm md:text-base selection:bg-blue-200">
      <header className="h-[58px] bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 shrink-0 z-30 shadow-sm">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <button type="button" aria-label="Mở menu chính" title="Menu" onClick={() => setMobileMenuOpen(v => !v)} className="md:hidden p-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 shrink-0"><Menu size={22}/></button>
          {storeConfig.logo ? <img src={storeConfig.logo} alt="Logo công ty" className="w-8 h-8 md:w-10 md:h-10 object-contain rounded bg-white" /> : <div className="bg-blue-600 text-white p-1.5 md:p-2 rounded-lg"><ShoppingBag size={21} /></div>}
          <div className="min-w-0"><h1 className="text-base md:text-xl font-extrabold tracking-tight text-[#1769c2] truncate">{storeConfig.name || 'QUẢN LÝ BÁN HÀNG'}</h1><p className="hidden sm:block text-[10px] uppercase tracking-[0.18em] text-gray-400 font-bold">Hệ thống quản lý cửa hàng</p></div>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden md:flex items-center gap-2 text-gray-500 text-xs"><span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100"><Users size={16}/></span><span className="max-w-36 truncate font-semibold">{userData.name}</span><span className="text-gray-300">|</span><span>{userData.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}</span></div>
          <button title="Đăng xuất" onClick={() => { signOut(auth); setUser(null); }} className="p-2 rounded-full text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"><LogOut size={19}/></button>
        </div>
      </header>
      <nav className={`${mobileMenuOpen ? 'flex' : 'hidden'} md:flex bg-white text-gray-700 px-2 md:px-3 py-2 md:py-1 items-stretch md:items-center flex-col md:flex-row gap-1 md:gap-1 overflow-x-visible md:overflow-x-auto scrollbar-hide shadow-sm shrink-0`}>
        {visibleTabs.map(tab => {
          const activeClass = activeTab === tab.id ? 'bg-blue-800 text-white shadow ring-1 ring-blue-300' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm';
          return <button key={tab.id} onClick={() => { setActiveTab(tab.id); setMobileMenuOpen(false); }} className={'box-border w-full md:w-auto flex items-center justify-start md:justify-center gap-3 px-5 md:px-[19px] py-4 md:py-[12.5px] min-h-[58px] md:min-h-[60px] rounded-lg whitespace-nowrap font-semibold text-lg md:text-[15px] transition-all duration-150 border border-white/40 ' + activeClass}><tab.icon size={22}/><span>{tab.label}</span></button>;
        })}
        <button onClick={() => { setActiveTab('pos'); setMobileMenuOpen(false); }} className="box-border w-full md:w-auto md:ml-auto flex items-center justify-start md:justify-center gap-3 px-5 md:px-[19px] py-4 md:py-[12.5px] min-h-[58px] md:min-h-[60px] rounded-lg bg-yellow-400 text-yellow-950 hover:bg-yellow-300 font-extrabold whitespace-nowrap shadow-sm border border-yellow-200 text-lg md:text-[15px]"><ShoppingCart size={22}/> Bán hàng</button>
      </nav>
      <main className="flex-1 min-w-0 overflow-auto flex flex-col min-h-[calc(100vh-104px)] relative">
        {toast && <div className={"fixed top-4 right-4 z-50 px-6 py-3.5 rounded-xl shadow-xl flex items-center gap-2 text-white animate-in slide-in-from-top-2 " + (toast.type === 'success' ? 'bg-emerald-600' : 'bg-blue-600')}><div className="bg-white/20 p-1 rounded-full">{toast.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}</div><span className="font-bold text-sm tracking-wide">{toast.msg}</span></div>}
        {['sales_history','imports','products','warranty','customers','suppliers','expenses'].includes(activeTab) && <DataExcelToolbar activeTab={activeTab} db={db} storeId={storeId} showToast={showToast} />}
        {activeTab === 'reports' && <ReportsView orders={orders} imports={imports} expenses={expenses} debtPaymentReports={debtPaymentReports} />}
        {activeTab === 'dashboard' && <DashboardView orders={orders} imports={imports} expenses={expenses} customers={customers} suppliers={suppliers} products={products} warrantyRequests={warrantyRequests} showToast={showToast} userData={userData} />}
        {activeTab === 'pos' && <POSView products={products} orders={orders} customers={customers} db={db} storeId={storeId} user={user} storeConfig={storeConfig} showToast={showToast} userData={userData} />}
        {activeTab === 'sales_history' && <SalesHistoryView orders={orders} imports={imports} products={products} customers={customers} storeConfig={storeConfig} db={db} storeId={storeId} user={user} userData={userData} showToast={showToast} />}
        {activeTab === 'imports' && <ImportView products={products} orders={orders} imports={imports} suppliers={suppliers} db={db} storeId={storeId} user={user} userData={userData} showToast={showToast} storeConfig={storeConfig} setActiveTab={setActiveTab} />}
        {activeTab === 'products' && <InventoryView products={products} orders={orders} imports={imports} warrantyRequests={warrantyRequests} customers={customers} suppliers={suppliers} navigationTarget={navigationTarget} storeConfig={storeConfig} db={db} storeId={storeId} showToast={showToast} />}
        {activeTab === 'warranty' && <WarrantyView products={products} customers={customers} suppliers={suppliers} warrantyRequests={warrantyRequests} storeConfig={storeConfig} db={db} storeId={storeId} showToast={showToast} />}
        {activeTab === 'customers' && <ContactManager type="customers" data={customers} products={products} orders={orders} navigationTarget={navigationTarget} storeConfig={storeConfig} db={db} storeId={storeId} showToast={showToast} userData={userData} />}
        {activeTab === 'suppliers' && <ContactManager type="suppliers" data={suppliers} products={products} orders={imports} navigationTarget={navigationTarget} storeConfig={storeConfig} db={db} storeId={storeId} showToast={showToast} userData={userData} />}
        {activeTab === 'expenses' && <ExpenseView expenses={expenses} db={db} storeId={storeId} showToast={showToast} />}
        {activeTab === 'settings' && <SettingsView db={db} storeId={storeId} showToast={showToast} storeConfig={storeConfig} />}
      </main>
    </div>
  );
}

function DashboardView({ orders, imports, expenses, customers, suppliers, products = [], warrantyRequests = [], showToast, userData = {} }) {
  const canShowColumn = (id) => userData.role === 'admin' || userData.perms?.[id] !== false;
  const currentDate = new Date();
  const currentVietnamDate = getVietnamDateParts(currentDate);
  const [activityRows, setActivityRows] = useState('10');
  const [warrantyRows, setWarrantyRows] = useState('10');
  const [warrantySortOrder, setWarrantySortOrder] = useState('oldest');
  const [filterMonth, setFilterMonth] = useState(currentVietnamDate.month.toString());
  const [filterYear, setFilterYear] = useState(currentVietnamDate.year.toString());
  // Bộ lọc riêng cho hai bảng nhắc nợ, không phụ thuộc bộ lọc tổng quan chung.
  const [custDebtMonth, setCustDebtMonth] = useState('ALL');
  const [custDebtYear, setCustDebtYear] = useState(currentVietnamDate.year.toString());
  const [suppDebtMonth, setSuppDebtMonth] = useState('ALL');
  const [suppDebtYear, setSuppDebtYear] = useState(currentVietnamDate.year.toString());
  const [filterDay, setFilterDay] = useState(getVietnamDateKey(currentDate));
  const [statsPeriodMode, setStatsPeriodMode] = useState('day');
  const [chartPeriodMode, setChartPeriodMode] = useState('day');
  const [selectedChartPeriod, setSelectedChartPeriod] = useState(null);
  const [custSortOrder, setCustSortOrder] = useState('desc');
  const [suppSortOrder, setSuppSortOrder] = useState('desc');
  const [dashboardColumnSort, setDashboardColumnSort] = useState({});
  const toggleDashboardColumnSort = (table, field) => setDashboardColumnSort(prev => ({ ...prev, [table]: { field, direction: prev[table]?.field === field && prev[table]?.direction === 'asc' ? 'desc' : 'asc' } }));
  const sortDashboardRows = (rows, table, getter) => { const config = dashboardColumnSort[table]; if (!config) return rows; return [...rows].sort((a,b) => { const av=getter(a,config.field), bv=getter(b,config.field); const an=Number(av), bn=Number(bv); const cmp=av!=='' && bv!=='' && Number.isFinite(an) && Number.isFinite(bn) ? an-bn : String(av??'').localeCompare(String(bv??''),'vi',{numeric:true,sensitivity:'base'}); return config.direction==='asc'?cmp:-cmp; }); };
  const [showAllCust, setShowAllCust] = useState('10');
  const [showAllSupp, setShowAllSupp] = useState('10');
  const [overdueMonth, setOverdueMonth] = useState('ALL');
  const [overdueYear, setOverdueYear] = useState(currentVietnamDate.year.toString());
  const [overdueRows, setOverdueRows] = useState('10');
  const [chartFilter, setChartFilter] = useState('7days');

  const stats = useMemo(() => {
    // Bốn chỉ số dùng chung một khoảng thời gian; ngày được hiểu theo múi giờ Việt Nam.
    const anchor = filterDay ? new Date(`${filterDay}T12:00:00+07:00`) : new Date();
    const anchorParts = getVietnamDateParts(anchor);
    let rangeStart = filterDay || getVietnamDateKey(currentDate);
    let rangeEnd = rangeStart;
    if (statsPeriodMode === 'week') {
      const startDate = new Date(Date.UTC(anchorParts.year, anchorParts.month - 1, anchorParts.day));
      startDate.setUTCDate(startDate.getUTCDate() - ((startDate.getUTCDay() + 6) % 7));
      const endDate = new Date(startDate); endDate.setUTCDate(endDate.getUTCDate() + 6);
      const key = d => `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
      rangeStart = key(startDate); rangeEnd = key(endDate);
    } else if (statsPeriodMode === 'month') {
      rangeStart = `${anchorParts.year}-${String(anchorParts.month).padStart(2,'0')}-01`;
      const endDate = new Date(Date.UTC(anchorParts.year, anchorParts.month, 0));
      rangeEnd = `${endDate.getUTCFullYear()}-${String(endDate.getUTCMonth()+1).padStart(2,'0')}-${String(endDate.getUTCDate()).padStart(2,'0')}`;
    } else if (statsPeriodMode === 'year') {
      rangeStart = `${anchorParts.year}-01-01`; rangeEnd = `${anchorParts.year}-12-31`;
    }
    const inStatsRange = value => { if (!value) return false; const key = getVietnamDateKey(new Date(value)); return key >= rangeStart && key <= rangeEnd; };
    const fOrders = orders.filter(o => inStatsRange(o.date));
    const fImports = imports.filter(i => inStatsRange(i.date));
    const fExpenses = expenses.filter(e => inStatsRange(e.date));

    const totalRev = fOrders.reduce((s, o) => s + (Number(o.total) || 0), 0);
    // Tính giá vốn theo FIFO: ưu tiên lô nhập cũ nhất còn số lượng (> 0) tại thời điểm bán.
    const inventoryLayers = new Map();
    const inventoryEvents = [
      ...(imports || []).map(rec => ({ type: 'import', date: new Date(rec.date || 0).getTime(), id: rec.id || '', rec })),
      ...(orders || []).map(rec => ({ type: 'sale', date: new Date(rec.date || 0).getTime(), id: rec.id || '', rec }))
    ].sort((a, b) => a.date - b.date || String(a.id).localeCompare(String(b.id)) || (a.type === 'import' ? -1 : 1));
    const orderCosts = new Map();
    inventoryEvents.forEach(event => {
      const items = event.rec.items || [];
      if (event.type === 'import') {
        items.forEach(item => {
          const key = item.id || item.productId || item.name;
          const qty = Math.max(0, Number(item.qty ?? item.quantity ?? 0));
          if (!key || qty <= 0) return;
          if (!inventoryLayers.has(key)) inventoryLayers.set(key, []);
          inventoryLayers.get(key).push({ qty, cost: Math.max(0, Number(item.importCost ?? item.cost ?? 0)), date: event.date });
        });
      } else {
        let costForOrder = 0;
        items.forEach(item => {
          const key = item.id || item.productId || item.name;
          let qty = Math.max(0, Number(item.quantity ?? item.qty ?? 0));
          if (!key || qty <= 0) return;
          const layers = inventoryLayers.get(key) || [];
          while (qty > 0 && layers.length) {
            const layer = layers[0];
            if (layer.qty <= 0) { layers.shift(); continue; }
            const used = Math.min(qty, layer.qty);
            costForOrder += used * (Number(layer.cost) || 0);
            layer.qty -= used;
            qty -= used;
            if (layer.qty <= 0) layers.shift();
          }
          // Với hàng tồn đầu kỳ không có lịch sử nhập, chỉ dùng giá vốn hiện tại khi sản phẩm còn tồn (> 0).
          if (qty > 0) {
            const product = (products || []).find(p => (p.id && (p.id === item.id || p.id === item.productId)) || (!item.id && !item.productId && p.name === item.name));
            if (product && Number(product.stock) > 0 && !layers.length) costForOrder += qty * (Number(product.cost) || 0);
            else if (!product) {
              const savedCost = Number(item.cost ?? item.importCost);
              if (Number.isFinite(savedCost) && savedCost > 0) costForOrder += qty * savedCost;
            }
          }
        });
        orderCosts.set(event.rec, costForOrder);
      }
    });
    const totalCost = fOrders.reduce((sum, order) => sum + (orderCosts.get(order) || 0), 0);
    const totalExp = fExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const netProfit = totalRev - totalCost - totalExp;

    const filteredCustDebt = (customers || []).filter(c => {
      if (Number(c.totalDebt || 0) <= 0) return false;
      if (!c.createdAt) return custDebtMonth === 'ALL';
      const d = getVietnamDateParts(new Date(c.createdAt));
      return (custDebtMonth === 'ALL' || d.month.toString() === custDebtMonth) && d.year.toString() === custDebtYear;
    }).sort((a, b) => {
      const timeA = new Date(a.createdAt || 0);
      const timeB = new Date(b.createdAt || 0);
      return custSortOrder === 'desc' ? timeA - timeB : timeB - timeA;
    });

    const filteredSuppDebt = (suppliers || []).filter(s => {
      if (Number(s.totalDebt || 0) <= 0) return false;
      if (!s.createdAt) return suppDebtMonth === 'ALL';
      const d = getVietnamDateParts(new Date(s.createdAt));
      return (suppDebtMonth === 'ALL' || d.month.toString() === suppDebtMonth) && d.year.toString() === suppDebtYear;
    }).sort((a, b) => {
      const timeA = new Date(a.createdAt || 0);
      const timeB = new Date(b.createdAt || 0);
      return suppSortOrder === 'desc' ? timeA - timeB : timeB - timeA;
    });

    const overdueCust = orders.filter(o => o.status === 'DEBT').sort((a,b) => new Date(b.date) - new Date(a.date));
    const overdueCust1Week = overdueCust.filter(o => getDaysDifference(o.date) >= 7);

    // Các cột có thể chuyển giữa ngày, tuần, tháng và năm; bấm cột sẽ xem chi tiết mặt hàng đã bán.
    const chartData = {};
    const chartMeta = {};
    const todayParts = getVietnamDateParts(new Date());
    const todayUtc = new Date(Date.UTC(todayParts.year, todayParts.month - 1, todayParts.day));
    const makeKey = d => `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
    const addBucket = (key, label, startKey, endKey) => { chartData[label] = 0; chartMeta[label] = { key, label, startKey, endKey }; };
    if (chartPeriodMode === 'day') {
      const start = new Date(todayUtc); start.setUTCDate(start.getUTCDate() - 9);
      for (let i=0;i<10;i++) { const d=new Date(start); d.setUTCDate(start.getUTCDate()+i); const key=makeKey(d); addBucket(key, `${d.getUTCDate()}/${d.getUTCMonth()+1}`, key, key); }
    } else if (chartPeriodMode === 'week') {
      const thisMonday = new Date(todayUtc); const dow=(thisMonday.getUTCDay()+6)%7; thisMonday.setUTCDate(thisMonday.getUTCDate()-dow);
      for(let i=7;i>=0;i--){const st=new Date(thisMonday);st.setUTCDate(st.getUTCDate()-i*7);const en=new Date(st);en.setUTCDate(en.getUTCDate()+6);const sk=makeKey(st),ek=makeKey(en);addBucket(sk,`${st.getUTCDate()}/${st.getUTCMonth()+1}–${en.getUTCDate()}/${en.getUTCMonth()+1}`,sk,ek);}
    } else if (chartPeriodMode === 'month') {
      for(let i=11;i>=0;i--){const d=new Date(Date.UTC(todayParts.year,todayParts.month-1-i,1));const st=makeKey(d);const enDate=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0));addBucket(st,`${d.getUTCMonth()+1}/${d.getUTCFullYear()}`,st,makeKey(enDate));}
    } else {
      for(let i=4;i>=0;i--){const year=todayParts.year-i;addBucket(String(year),String(year),`${year}-01-01`,`${year}-12-31`);}
    }
    orders.forEach(o => {
      const orderDateKey = getVietnamDateKey(new Date(o.date));
      const bucket = Object.keys(chartMeta).find(label => orderDateKey >= chartMeta[label].startKey && orderDateKey <= chartMeta[label].endKey);
      if (bucket !== undefined) chartData[bucket] += Number(o.total) || 0;
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

    return { totalRev, totalCost, totalExp, netProfit, overdueCust, overdueCust1Week, chartData, chartMeta, topProducts, filteredCustDebt, filteredSuppDebt };
  }, [orders, imports, expenses, customers, suppliers, products, filterMonth, filterYear, filterDay, statsPeriodMode, custDebtMonth, custDebtYear, suppDebtMonth, suppDebtYear, custSortOrder, suppSortOrder, chartFilter, chartPeriodMode]);

  const years = Array.from({length: 5}, (_, i) => currentVietnamDate.year - i);
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
        <h2 className="text-2xl font-bold text-gray-800">Tổng quan kinh doanh & Nhắc nợ</h2>
        <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-200">
          <label className="text-xs font-semibold text-gray-500">Xem theo
            <select value={statsPeriodMode} onChange={e=>setStatsPeriodMode(e.target.value)} className="ml-2 bg-white font-medium outline-none border rounded p-1">
              <option value="day">Ngày</option><option value="week">Tuần</option><option value="month">Tháng</option><option value="year">Năm</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-gray-500">Ngày chọn <input type="date" value={filterDay} onChange={e=>setFilterDay(e.target.value)} className="ml-1 bg-transparent font-medium outline-none border rounded p-1"/></label>
          <button type="button" onClick={()=>{setFilterDay(getVietnamDateKey(new Date()));setStatsPeriodMode('day');}} className="text-xs text-blue-600 font-bold">Hôm nay</button>
        </div>
      </div>




      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {canShowColumn('dash_stat_revenue') && <StatCard icon={<TrendingUp />} title={"Doanh thu (" + (statsPeriodMode === 'day' ? filterDay : statsPeriodMode === 'week' ? 'tuần' : statsPeriodMode === 'month' ? filterDay.slice(0,7) : filterDay.slice(0,4)) + ")"} value={formatCurrency(stats.totalRev)} color="bg-blue-100 text-blue-600" />}
        {canShowColumn('dash_stat_cost') && <StatCard icon={<Package />} title="Tổng Giá Vốn" value={formatCurrency(stats.totalCost)} color="bg-gray-200 text-gray-700" />}
        {canShowColumn('dash_stat_expense') && <StatCard icon={<CreditCard />} title="Tổng Chi Phí" value={formatCurrency(stats.totalExp)} color="bg-orange-100 text-orange-600" />}
        {canShowColumn('dash_stat_profit') && <StatCard icon={<DollarSign />} title="Lãi Ròng (Đã trừ phí)" value={formatCurrency(stats.netProfit)} color="bg-green-100 text-green-600" highlight={true} />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 lg:col-span-2 flex flex-col">
          <div className="mb-4 border-b border-gray-100 pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"><h3 className="font-bold text-gray-800 flex items-center gap-2"><BarChart3 size={20} className="text-blue-600"/> Biểu đồ doanh thu theo {chartPeriodMode==='day'?'ngày':chartPeriodMode==='week'?'tuần':chartPeriodMode==='month'?'tháng':'năm'}</h3><div className="flex gap-1 flex-wrap">{[['day','Ngày'],['week','Tuần'],['month','Tháng'],['year','Năm']].map(([v,label])=><button key={v} type="button" onClick={()=>{setChartPeriodMode(v);setSelectedChartPeriod(null);}} className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${chartPeriodMode===v?'bg-blue-600 text-white border-blue-600':'bg-white text-gray-600'}`}>{label}</button>)}</div></div>
          </div>
          <div className="h-[300px] flex min-w-0 gap-2 pt-2">
            <div className="w-16 shrink-0 flex flex-col justify-between text-[10px] text-gray-500 text-right pb-6 pr-1">
              {[100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0].map(v => (
                <span key={v} className="leading-none">{v === 0 ? '0' : Math.round((Math.max(0,...Object.values(stats.chartData).map(Number)) || 1)*v/100/1000000) + 'tr'}</span>
              ))}
            </div>
            <div className="relative flex-1 min-w-0 flex items-stretch border-b border-gray-200">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {Array.from({ length: 11 }, (_, i) => <div key={i} className="border-t border-gray-100 w-full" />)}
              </div>
              <div className="relative z-[1] w-full flex items-end justify-around gap-1 px-1">
                {Object.entries(stats.chartData).map(([label, val], idx) => {
                  const chartMax = Math.max(1, ...Object.values(stats.chartData).map(Number));
                  const heightPercent = (Number(val) / chartMax) * 100;
                  const meta = stats.chartMeta[label];
                  return (
                    <button type="button" key={idx} onClick={()=>setSelectedChartPeriod(meta)} className={`h-full flex-1 min-w-0 flex flex-col justify-end items-center group relative focus:outline-none ${selectedChartPeriod?.key===meta?.key?'ring-2 ring-blue-400 rounded-t-md':''}`} title={`Bấm xem chi tiết ${label}`}> 
                      <div className="absolute bottom-[calc(100%+4px)] bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap shadow-md z-10 pointer-events-none">{label}: {formatCurrency(val)}</div>
                      <div className={"w-full max-w-10 rounded-t-md transition-all duration-300 " + (val > 0 ? "bg-blue-500 group-hover:bg-blue-600" : "bg-gray-200")} style={{ height: heightPercent + '%', minHeight: val > 0 ? '2px' : '0px' }} />
                      <span className="absolute top-full pt-2 text-[10px] text-gray-500 whitespace-nowrap">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          {selectedChartPeriod && <div className="mt-8 border rounded-xl overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-2 bg-blue-50 px-4 py-3"><div><h4 className="font-bold text-blue-900">Chi tiết bán hàng: {selectedChartPeriod.label}</h4><p className="text-xs text-blue-700">{selectedChartPeriod.startKey===selectedChartPeriod.endKey?selectedChartPeriod.startKey:`${selectedChartPeriod.startKey} đến ${selectedChartPeriod.endKey}`}</p></div><button type="button" onClick={()=>setSelectedChartPeriod(null)} className="text-sm font-bold text-blue-700">Đóng</button></div><div className="max-h-64 overflow-auto"><table className="w-full text-sm text-left"><thead className="bg-gray-50 sticky top-0"><tr><th className="p-2">Ngày</th><th className="p-2">Khách hàng</th><th className="p-2">Sản phẩm đã bán</th><th className="p-2 text-right">Thành tiền</th></tr></thead><tbody>{orders.filter(o=>{const k=getVietnamDateKey(new Date(o.date));return k>=selectedChartPeriod.startKey&&k<=selectedChartPeriod.endKey;}).sort((a,b)=>new Date(a.date)-new Date(b.date)).map(o=><tr key={o.id} className="border-t align-top"><td className="p-2 whitespace-nowrap">{formatDate(o.date)}</td><td className="p-2"><button type="button" onClick={() => { setProductTarget(null); navigateMainTab('customers'); }} className="text-blue-700 underline text-left">{o.customerName||'Khách lẻ'} · Mở thẻ</button></td><td className="p-2">{(o.items||[]).map((it,i)=><div key={i}>{it.name||'Sản phẩm'} × {Number(it.quantity??it.qty??1)}</div>)}</td><td className="p-2 text-right font-bold whitespace-nowrap">{formatCurrency(o.total)}</td></tr>)}{!orders.some(o=>{const k=getVietnamDateKey(new Date(o.date));return k>=selectedChartPeriod.startKey&&k<=selectedChartPeriod.endKey;})&&<tr><td colSpan="4" className="p-5 text-center text-gray-400">Không có đơn bán trong khoảng thời gian này.</td></tr>}</tbody></table></div></div>}
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

      {(() => {
        const overdueFiltered = stats.overdueCust1Week.filter(o => {
          const d = getVietnamDateParts(new Date(o.date));
          return d.year.toString() === overdueYear && (overdueMonth === 'ALL' || d.month.toString() === overdueMonth);
        });
        const overdueSorted = sortDashboardRows(overdueFiltered, 'overdue', (o, f) => f === 'customer' ? o.customerName : f === 'date' ? o.date : f === 'days' ? getDaysDifference(o.date) : Number(o.total) || 0);
        const overdueVisible = overdueRows === 'all' ? overdueSorted : overdueSorted.slice(0, Number(overdueRows) || 10);
        return (
          <div className="bg-blue-50 border-2 border-blue-500 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 bg-blue-600 flex flex-wrap justify-between items-center gap-3 text-white">
              <h3 className="font-bold flex items-center gap-2 text-lg"><Bell size={24}/> CẢNH BÁO: KHÁCH HÀNG NỢ QUÁ HẠN 1 TUẦN ({overdueFiltered.length})</h3>
              <div className="flex flex-wrap gap-2 items-center">
                <select aria-label="Tháng cảnh báo nợ quá hạn" value={overdueMonth} onChange={e=>setOverdueMonth(e.target.value)} className="rounded-lg px-2 py-1.5 bg-white text-gray-800 text-xs"><option value="ALL">Tất cả tháng</option>{Array.from({length:12},(_,i)=><option key={i+1} value={String(i+1)}>Tháng {i+1}</option>)}</select>
                <select aria-label="Năm cảnh báo nợ quá hạn" value={overdueYear} onChange={e=>setOverdueYear(e.target.value)} className="rounded-lg px-2 py-1.5 bg-white text-gray-800 text-xs">{Array.from({length:8},(_,i)=>currentVietnamDate.year-i).map(y=><option key={y} value={String(y)}>Năm {y}</option>)}</select>
                <label className="text-xs flex items-center gap-1">Hiển thị <select value={overdueRows} onChange={e=>setOverdueRows(e.target.value)} className="rounded-lg px-2 py-1.5 bg-white text-gray-800"><option value="10">10</option><option value="20">20</option><option value="50">50</option><option value="100">100</option><option value="all">Tất cả</option></select></label>
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-left text-sm bg-white">
                <thead className="bg-blue-50 sticky top-0 border-b border-blue-200"><tr>{[['customer','Khách hàng','dash_overdue_customer'],['date','Ngày mua','dash_overdue_date'],['days','Số ngày nợ','dash_overdue_days'],['amount','Số tiền','dash_overdue_amount']].filter(([, ,perm])=>canShowColumn(perm)).map(([field,label])=><th key={field} onClick={()=>toggleDashboardColumnSort('overdue',field)} className="p-3 text-blue-800 cursor-pointer select-none hover:bg-blue-100">{label} <ArrowUpDown size={11} className="inline"/></th>)}</tr></thead>
                <tbody>{overdueVisible.map(o => <tr key={o.id} className="border-b hover:bg-blue-50/50">{canShowColumn('dash_overdue_customer') && <td className="p-3 font-bold text-gray-800">{o.customerName}</td>}{canShowColumn('dash_overdue_date') && <td className="p-3 text-gray-600">{formatDate(o.date)}</td>}{canShowColumn('dash_overdue_days') && <td className="p-3 font-bold text-blue-600">{getDaysDifference(o.date)} ngày</td>}{canShowColumn('dash_overdue_amount') && <td className="p-3 font-bold text-blue-600 text-lg">{formatCurrency(o.total)}</td>}</tr>)}
                  {overdueVisible.length === 0 && <tr><td colSpan="4" className="p-4 text-center text-gray-400">Không có khách hàng nợ quá hạn trong tháng/năm đã chọn.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div><h3 className="font-bold text-gray-800 text-lg flex items-center gap-2"><ShieldAlert size={20} className="text-purple-600"/> Hàng đã gửi bảo hành chưa hoàn thành</h3><p className="text-xs text-gray-500 mt-1">Ưu tiên hiển thị phiếu gửi lâu nhất trước.</p></div>
          <div className="flex items-center gap-2"><button onClick={()=>setWarrantySortOrder(v=>v==='oldest'?'newest':'oldest')} className="text-xs bg-gray-100 px-3 py-2 rounded-lg font-bold">{warrantySortOrder==='oldest'?'Lâu nhất trước':'Gần nhất trước'}</button><label className="flex items-center gap-2 text-sm font-semibold text-gray-600">Hiển thị <select value={warrantyRows} onChange={e=>setWarrantyRows(e.target.value)} className="border rounded-lg px-3 py-2 bg-white"><option value="10">10 dòng</option><option value="20">20 dòng</option><option value="50">50 dòng</option><option value="all">Tất cả</option></select></label></div>
        </div>
        {(() => { const pending = (warrantyRequests || []).filter(w => w.status !== 'COMPLETED').sort((a,b)=>warrantySortOrder==='oldest'?new Date(a.sentAt || a.createdAt || 0)-new Date(b.sentAt || b.createdAt || 0):new Date(b.sentAt || b.createdAt || 0)-new Date(a.sentAt || a.createdAt || 0)); const sortedPending = sortDashboardRows(pending,'pendingWarranty',(w,f)=>f==='date'?(w.sentAt||w.createdAt||''):f==='customer'?(w.customerName||''):f==='location'?(w.warrantyLocation||''):f==='items'?(w.items||[]).map(i=>i.name||'').join(', '):(w.status||'')); const shown = warrantyRows === 'all' ? sortedPending : sortedPending.slice(0, Number(warrantyRows) || 10); return <div className="overflow-auto border rounded-xl"><table className="w-full text-left text-sm min-w-[700px]"><thead className="bg-purple-50"><tr>{[['date','Thời gian gửi','dash_warranty_date'],['customer','Khách hàng','dash_warranty_customer'],['location','Nơi bảo hành','dash_warranty_location'],['items','Sản phẩm','dash_warranty_items'],['status','Tình trạng','dash_warranty_status']].filter(([, ,perm])=>canShowColumn(perm)).map(([field,label])=><th key={field} onClick={()=>toggleDashboardColumnSort('pendingWarranty',field)} className="p-3 cursor-pointer select-none hover:bg-purple-100">{label} <ArrowUpDown size={11} className="inline"/></th>)}</tr></thead><tbody>{shown.map(w=><tr key={w.id} className="border-t">{canShowColumn('dash_warranty_date') && <td className="p-3 whitespace-nowrap">{formatDate(w.sentAt || w.createdAt)}</td>}{canShowColumn('dash_warranty_customer') && <td className="p-3 font-bold">{w.customerName || 'Khách lẻ'}<p className="text-xs text-gray-500">{w.phone || ''}</p></td>}{canShowColumn('dash_warranty_location') && <td className="p-3">{w.warrantyLocation || '—'}</td>}{canShowColumn('dash_warranty_items') && <td className="p-3">{(w.items || []).map(i=>`${i.name} × ${i.quantity || 1}`).join(', ')}</td>}{canShowColumn('dash_warranty_status') && <td className="p-3"><span className="px-2 py-1 rounded bg-amber-100 text-amber-800 text-xs font-bold">Đang bảo hành</span></td>}</tr>)}{shown.length===0 && <tr><td colSpan="5" className="p-6 text-center text-gray-400">Không có phiếu bảo hành đang chờ nhận hàng.</td></tr>}</tbody></table></div>; })()}
      </section>

      <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div><h3 className="font-bold text-gray-800 text-lg">Theo dõi bán hàng và nhập hàng</h3><p className="text-xs text-gray-500 mt-1">Lịch sử giao dịch mới nhất, gồm nhân viên, khách hàng/nhà cung cấp, hàng hóa, số lượng và số tiền.</p></div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-600">Hiển thị
            <select value={activityRows} onChange={e=>setActivityRows(e.target.value)} className="border rounded-lg px-3 py-2 bg-white">
              <option value="10">10 dòng mới nhất</option><option value="20">20 dòng</option><option value="50">50 dòng</option><option value="all">Tất cả</option>
            </select>
          </label>
        </div>
        {(() => {
          const activity = [
            ...(orders || []).map(o => ({ ...o, activityType: 'Bán hàng', activityName: o.sellerName || o.sellerUid || 'Chưa lưu nhân viên', partner: o.customerName || 'Khách lẻ', amount: Number(o.total) || 0, date: o.date, rowKey: `sale-${o.id}` })),
            ...(imports || []).map(i => ({ ...i, activityType: 'Nhập hàng', activityName: i.createdByName || i.createdByUid || 'Chưa lưu nhân viên', partner: i.supplierName || 'Chưa rõ nhà cung cấp', amount: Number(i.total) || 0, date: i.date, rowKey: `import-${i.id}` }))
          ].sort((a,b) => new Date(b.date || 0) - new Date(a.date || 0));
          const sortedActivity = sortDashboardRows(activity,'activity',(a,f)=>f==='date'?(a.date||''):f==='type'?a.activityType:f==='staff'?a.activityName:f==='partner'?a.partner:f==='items'?(a.items||[]).map(it=>it.name||'').join(', '):Number(a.amount)||0);
          const visibleActivity = activityRows === 'all' ? sortedActivity : sortedActivity.slice(0, Number(activityRows) || 10);
          return <div className="overflow-auto border rounded-xl"><table className="w-full text-left text-sm min-w-[900px]"><thead className="bg-gray-100 text-gray-600"><tr>{[['date','Thời gian','dash_activity_date'],['type','Loại giao dịch','dash_activity_type'],['staff','Người thực hiện','dash_activity_staff'],['partner','Khách hàng / Nhà cung cấp','dash_activity_partner'],['items','Chi tiết hàng hóa & số lượng','dash_activity_items'],['amount','Thành tiền','dash_activity_amount']].filter(([, ,perm])=>canShowColumn(perm)).map(([field,label])=><th key={field} onClick={()=>toggleDashboardColumnSort('activity',field)} className="p-3 cursor-pointer select-none hover:bg-gray-200">{label} <ArrowUpDown size={11} className="inline"/></th>)}</tr></thead><tbody>{visibleActivity.map(a => <tr key={a.rowKey} className="border-t hover:bg-gray-50 align-top">{canShowColumn('dash_activity_date') && <td className="p-3 whitespace-nowrap">{a.date ? formatDate(a.date) : '—'}</td>}{canShowColumn('dash_activity_type') && <td className="p-3"><span className={`px-2 py-1 rounded-lg text-xs font-bold ${a.activityType === 'Bán hàng' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>{a.activityType}</span></td>}{canShowColumn('dash_activity_staff') && <td className="p-3 font-medium">{a.activityName}</td>}{canShowColumn('dash_activity_partner') && <td className="p-3">{a.partner}</td>}{canShowColumn('dash_activity_items') && <td className="p-3">{(a.items || []).length ? <div className="space-y-1">{a.items.map((it, idx) => <div key={`${a.rowKey}-item-${idx}`}>{it.name || 'Sản phẩm'} × {Number(it.quantity ?? it.qty ?? 1)}</div>)}</div> : 'Không có chi tiết hàng hóa'}</td>}{canShowColumn('dash_activity_amount') && <td className="p-3 text-right font-bold whitespace-nowrap">{formatCurrency(a.amount)}</td>}</tr>)}{visibleActivity.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-gray-400">Chưa có giao dịch bán hàng hoặc nhập hàng.</td></tr>}</tbody></table></div>;
        })()}
      </section>
    </div>
  );
}

function POSView({ products, orders = [], customers, db, storeId, user, storeConfig, showToast, userData }) {
  const [cart, setCart] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
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
      return [{ ...product, quantity: 1, price: product.price, warrantyValue: '', warrantyUnit: 'tháng', note: '' }, ...prev];
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
        invoiceCode: generateInvoiceCode(orders),
        customerId: customerId || null, customerName: c ? c.name : 'Khách lẻ', sellerUid: user.uid, sellerName: userData?.name || user?.displayName || user?.email || 'Nhân viên', note: orderNote,
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
              const stockClass = p.stock < 0 ? 'text-blue-500 font-bold' : 'text-gray-500';
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
              <div className="flex justify-between items-start"><h4 className="font-bold text-sm text-gray-800 pr-2">{item.name}</h4><button onClick={() => setCart(c => c.filter(i => i.id !== item.id))} className="text-blue-400 hover:text-blue-600 bg-blue-50 p-1 rounded"><X size={14}/></button></div>
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
            <div className="flex-1 min-w-0 space-y-1"><div className="relative"><Search size={15} className="absolute left-3 top-3 text-gray-400"/><input value={customerSearchTerm} onChange={e=>setCustomerSearchTerm(e.target.value)} placeholder="Tìm khách hàng..." className="w-full pl-9 pr-3 p-2.5 border border-gray-300 rounded-xl text-sm"/>{customerSearchTerm.trim() && <div className="absolute z-40 top-full mt-1 left-0 right-0 max-h-56 overflow-auto rounded-xl border bg-white shadow-xl">{customers.filter(c=>(c.name||'').toLocaleLowerCase('vi').includes(customerSearchTerm.toLocaleLowerCase('vi')) || (c.phone||'').includes(customerSearchTerm)).slice(0,50).map(c=><button type="button" key={c.id} onClick={()=>{setCustomerId(c.id);setCustomerSearchTerm('');}} className="w-full text-left px-3 py-2.5 hover:bg-blue-50 border-b last:border-b-0"><span className="block text-sm font-bold">{c.name}</span><span className="block text-xs text-gray-500">{c.phone || 'Không có số điện thoại'}</span></button>)}{!customers.some(c=>(c.name||'').toLocaleLowerCase('vi').includes(customerSearchTerm.toLocaleLowerCase('vi')) || (c.phone||'').includes(customerSearchTerm)) && <div className="p-3 text-sm text-gray-500">Không tìm thấy khách hàng phù hợp.</div>}</div>}</div><select value={customerId} onChange={e=>setCustomerId(e.target.value)} className="w-full min-w-0 p-2.5 border border-gray-300 rounded-xl outline-none text-sm bg-gray-50 focus:bg-white font-medium"><option value="">-- Khách lẻ (Tiền mặt) --</option>{customers.filter(c=>(c.name||'').toLocaleLowerCase('vi').includes(customerSearchTerm.toLocaleLowerCase('vi')) || (c.phone||'').includes(customerSearchTerm)).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
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
            <div id="print-invoice-area-pos" className={`bg-white shadow-xl border border-gray-200 mx-auto transition-all relative overflow-hidden ${paperWidthClass}`} style={{ fontSize: `${baseFontSize}px`, padding: isA4A5 ? '20px' : '15px', color: '#000', fontFamily: 'sans-serif' }}>
              {storeConfig?.watermarkLogoEnabled !== false && storeConfig?.logo && <img src={storeConfig.logo} alt="Logo chìm" className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{width:`${Math.max(20,Math.min(100,Number(storeConfig.watermarkLogoSize)||55))}%`,maxWidth:'80%',maxHeight:'75%',objectFit:'contain',opacity:Number(storeConfig.watermarkLogoOpacity??0.12),zIndex:0}} />}
              <div className="relative z-10"><ReceiptTemplate order={completedOrder} storeConfig={storeConfig} isA4A5={isA4A5} baseFontSize={baseFontSize} /></div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function SalesHistoryView({ orders, imports = [], products, customers, storeConfig, db, storeId, user, userData, showToast }) {
  const currentDate = new Date();
  const currentVietnamDate = getVietnamDateParts(currentDate);
  const [filterType, setFilterType] = useState('day');
  const [selectedDate, setSelectedDate] = useState(getVietnamDateKey(currentDate));
  const [filterMonth, setFilterMonth] = useState(currentVietnamDate.month.toString());
  const [filterYear, setFilterYear] = useState(currentVietnamDate.year.toString());
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
  const [historyTarget, setHistoryTarget] = useState(null);
  const [productTarget, setProductTarget] = useState(null);
  const [orderCustomerSearch, setOrderCustomerSearch] = useState('');
  const [orderProductSearch, setOrderProductSearch] = useState({});

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
      const d = getVietnamDateParts(new Date(o.date));
      let matchTime = true;
      if (filterType === 'day') { matchTime = getVietnamDateKey(new Date(o.date)) === selectedDate; }
      else if (filterType === 'month') { matchTime = d.year.toString() === filterYear; }
      else if (filterType === 'year') { matchTime = d.year.toString() === filterYear; }
      const matchSearch = (o.customerName && o.customerName.toLowerCase().includes(searchTerm.toLowerCase())) || ((o.invoiceCode || o.id || '').toLowerCase().includes(searchTerm.toLowerCase()));
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
        invoiceCode: generateInvoiceCode(orders),
        customerId: newOrderForm.customerId || null, customerName: c ? c.name : 'Khách lẻ', sellerUid: user.uid, sellerName: userData?.name || user?.displayName || user?.email || 'Nhân viên', note: newOrderForm.note,
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
  const normalizeOrderSearch = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').trim().toLocaleLowerCase('vi');
  // Index supplier names once when import data changes, instead of scanning every import
  // row on every keystroke in the direct-order product search.
  const productSupplierIndex = useMemo(() => {
    const byId = new Map();
    const byName = new Map();
    const add = (map, key, supplier) => {
      if (!key || !supplier) return;
      if (!map.has(key)) map.set(key, new Set());
      map.get(key).add(supplier);
    };
    (imports || []).forEach(imp => (imp.items || []).forEach(item => {
      const supplier = imp.supplierName || imp.supplier;
      if (!supplier) return;
      if (item.productId) add(byId, String(item.productId), supplier);
      if (item.id) add(byId, String(item.id), supplier);
      if (item.name) add(byName, String(item.name).trim().toLocaleLowerCase('vi'), supplier);
    }));
    return { byId, byName };
  }, [imports]);
  const getProductSupplierNames = (product) => {
    const names = new Set();
    if (product?.id) (productSupplierIndex.byId.get(String(product.id)) || []).forEach(n => names.add(n));
    if (product?.name) (productSupplierIndex.byName.get(String(product.name).trim().toLocaleLowerCase('vi')) || []).forEach(n => names.add(n));
    if (product?.supplierName || product?.supplier) names.add(product.supplierName || product.supplier);
    return Array.from(names);
  };
  // Normalize product and supplier text only when the product/import data changes.
  const orderProductSearchIndex = useMemo(() => (products || []).map(product => {
    const supplierNames = getProductSupplierNames(product);
    return {
      product,
      supplierNames,
      normalizedName: normalizeOrderSearch(product.name),
      normalizedSuppliers: supplierNames.map(normalizeOrderSearch),
    };
  }), [products, imports, productSupplierIndex]);

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
          <button onClick={() => { setNewOrderForm({ customerId: '', status: 'PAID', note: '', items: [] }); setOrderCustomerSearch(''); setOrderProductSearch({}); setShowCreateOrderModal(true); }} className="bg-blue-600 text-white px-4 py-2.5 rounded-lg font-bold flex gap-2 shrink-0 items-center shadow-sm whitespace-nowrap"> <Plus size={16}/> <span>Tạo đơn</span> </button>
          <div className="relative flex-1 sm:w-72">
            <Search size={16} className="absolute left-3 top-3.5 text-gray-400"/>
            <input placeholder="Tìm mã HĐ hoặc tên khách..." value={searchTerm} onChange={e=>{ setSearchTerm(e.target.value); setSalesCurrentPage(1); }} className="w-full pl-9 pr-3 py-2.5 border rounded-xl bg-white outline-none shadow-sm focus:ring-2 focus:ring-blue-500 transition-all"/>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border shadow-sm mb-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex flex-wrap items-center gap-2 bg-gray-100 p-1 rounded-xl">
          <button onClick={() => { setFilterType('day'); setSalesCurrentPage(1); }} className={"px-4 py-2 rounded-lg text-sm font-bold transition-all " + (filterType==='day'?'bg-white text-blue-600 shadow-sm':'text-gray-600 hover:bg-white/50')}>Ngày</button>
          <button onClick={() => { setFilterType('year'); setSalesCurrentPage(1); }} className={"px-4 py-2 rounded-lg text-sm font-bold transition-all " + (filterType==='year'?'bg-white text-blue-600 shadow-sm':'text-gray-600 hover:bg-white/50')}>Năm</button>
          <button onClick={() => { setFilterType('all'); setSalesCurrentPage(1); }} className={"px-4 py-2 rounded-lg text-sm font-bold transition-all " + (filterType==='all'?'bg-white text-blue-600 shadow-sm':'text-gray-600 hover:bg-white/50')}>Tất cả</button>
        </div>
        <div className="flex items-center gap-2">
          {filterType === 'day' && (<input type="date" value={selectedDate} onChange={e=>{ setSelectedDate(e.target.value); setSalesCurrentPage(1); }} className="p-2 border rounded-xl text-sm bg-gray-50 font-bold outline-none"/>)}
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
                    <td className="p-4"><p className="font-bold text-blue-600">#{o.invoiceCode || o.id.slice(0,6).toUpperCase()}</p><p className="text-xs text-gray-400 mt-0.5">{formatDate(o.date)}</p></td>
                    <td className="p-4 font-bold text-gray-800"><button type="button" className="text-blue-600 underline" onClick={() => setHistoryTarget({ id: o.customerId, name: o.customerName || 'Khách lẻ' })}>{o.customerName || 'Khách lẻ'}</button></td>
                    <td className="p-4">
                      <div className="space-y-1.5">
                        {o.items?.map((it, idx) => {
                          const itemQty = Number(it.quantity || 1); const itemPrice = Number(it.price || 0);
                          return (
                            <div key={idx} className="text-xs bg-gray-50 p-2.5 rounded-lg border border-gray-100 flex flex-col gap-1">
                              <div className="flex justify-between items-center"><button type="button" className="font-semibold text-blue-600 underline text-left" onClick={() => setProductTarget(it)}>{it.name} (x{itemQty})</button><span className="text-blue-600 font-bold">{formatCurrency(itemPrice * itemQty)}</span></div>
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
                        <button onClick={() => handleDeleteOrder(o)} title="Xóa hóa đơn" className="text-blue-600 bg-blue-50 p-2 rounded-lg hover:bg-blue-100 transition-colors"><Trash2 size={18}/></button>
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
              <div className="flex flex-row items-start gap-2 w-full">
                <div className="relative flex-1 min-w-0">
                  <Search size={16} className="absolute left-3 top-3.5 text-gray-400" />
                  <input value={orderCustomerSearch} onChange={e=>setOrderCustomerSearch(e.target.value)} placeholder={newOrderForm.customerId ? (customers.find(c=>c.id===newOrderForm.customerId)?.name || 'Tìm khách hàng...') : 'Tìm khách hàng... (để trống là khách lẻ)'} className="w-full pl-9 pr-3 p-3 border rounded-xl outline-none text-sm font-bold bg-gray-50 focus:bg-white transition-all" />
                  {orderCustomerSearch.trim() && <div className="absolute z-30 top-full mt-1 left-0 right-0 max-h-52 overflow-auto rounded-xl border bg-white shadow-xl">{customers.filter(c=>normalizeOrderSearch(c.name).includes(normalizeOrderSearch(orderCustomerSearch)) || normalizeOrderSearch(c.phone).includes(normalizeOrderSearch(orderCustomerSearch))).slice(0,50).map(c=><button type="button" key={c.id} onClick={()=>{setNewOrderForm(prev=>({...prev,customerId:c.id}));setOrderCustomerSearch('');}} className="w-full text-left px-3 py-2.5 hover:bg-blue-50 border-b last:border-b-0"><span className="block font-bold text-sm">{c.name}</span><span className="block text-xs text-gray-500">{c.phone || 'Không có số điện thoại'}</span></button>)}{!customers.some(c=>normalizeOrderSearch(c.name).includes(normalizeOrderSearch(orderCustomerSearch)) || normalizeOrderSearch(c.phone).includes(normalizeOrderSearch(orderCustomerSearch))) && <div className="p-3 text-sm text-gray-500">Không tìm thấy khách hàng phù hợp.</div>}</div>}
                  <div className="mt-1 text-xs text-gray-500">Đang chọn: {newOrderForm.customerId ? (customers.find(c=>c.id===newOrderForm.customerId)?.name || 'Khách hàng') : 'Khách lẻ (Tiền mặt)'}</div>
                </div>
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
                  <button type="button" onClick={() => setNewOrderForm(prev => ({...prev, items: prev.items.filter((_, i) => i !== idx)}))} className="absolute top-3 right-3 text-blue-400 hover:text-blue-600"><X size={18}/></button>
                  <div className="relative">
                    <label className="text-[10px] text-gray-500 font-bold uppercase">Tìm sản phẩm / nhà cung cấp</label>
                    <Search size={15} className="absolute left-3 top-[34px] text-gray-400" />
                    <input required={!it.id} value={orderProductSearch[idx] ?? (it.name || '')} onChange={e=>setOrderProductSearch(prev=>({...prev,[idx]:e.target.value}))} placeholder="Gõ tên sản phẩm hoặc nhà cung cấp..." className="w-full pl-9 pr-3 p-2 border rounded-lg text-sm font-bold bg-gray-50" />
                    {(orderProductSearch[idx] || '').trim() && <div className="absolute z-30 top-full mt-1 left-0 right-0 max-h-56 overflow-auto rounded-xl border bg-white shadow-xl">{(() => { const q = normalizeOrderSearch(orderProductSearch[idx]); const matches = orderProductSearchIndex.filter(entry => entry.normalizedName.includes(q) || entry.normalizedSuppliers.some(n => n.includes(q))); return <>{matches.slice(0,60).map(({product:p, supplierNames})=><button type="button" key={p.id} onClick={()=>{const newItems=[...newOrderForm.items];newItems[idx]={...newItems[idx],id:p.id,name:p.name,price:p.price,cost:p.cost};setNewOrderForm({...newOrderForm,items:newItems});setOrderProductSearch(prev=>{const next={...prev};delete next[idx];return next;});}} className="w-full text-left px-3 py-2.5 hover:bg-blue-50 border-b last:border-b-0"><span className="block text-sm font-bold">{p.name}</span><span className="block text-xs text-gray-600">Giá bán: {formatCurrency(p.price)}{supplierNames.length ? ` · Nhà cung cấp: ${supplierNames.join(', ')}` : ''}</span></button>)}{matches.length===0 && <div className="p-3 text-sm text-gray-500">Không tìm thấy sản phẩm hoặc nhà cung cấp phù hợp.</div>}</>; })()}</div>}
                    {it.id && <div className="mt-1 text-xs text-gray-500">Đã chọn: {it.name} {getProductSupplierNames(products.find(p=>p.id===it.id)||{}).length ? `· Nhà cung cấp: ${getProductSupplierNames(products.find(p=>p.id===it.id)||{}).join(', ')}` : ''}</div>}
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
            <div id="print-invoice-area" className={`bg-white shadow-xl border border-gray-200 mx-auto transition-all relative overflow-hidden ${paperWidthClass}`} style={{ fontSize: `${baseFontSize}px`, padding: isA4A5 ? '20px' : '15px', color: '#000', fontFamily: 'sans-serif' }}>
              {storeConfig?.watermarkLogoEnabled !== false && storeConfig?.logo && <img src={storeConfig.logo} alt="Logo chìm" className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{width:`${Math.max(20,Math.min(100,Number(storeConfig.watermarkLogoSize)||55))}%`,maxWidth:'80%',maxHeight:'75%',objectFit:'contain',opacity:Number(storeConfig.watermarkLogoOpacity??0.12),zIndex:0}} />}
              <div className="relative z-10"><ReceiptTemplate order={viewingOrderPrint} storeConfig={storeConfig} isA4A5={isA4A5} baseFontSize={baseFontSize} /></div>
            </div>
          </div>
        )}
      </Modal>
      <Modal isOpen={!!historyTarget} onClose={() => setHistoryTarget(null)} title={`Lịch sử mua hàng: ${historyTarget?.name || ''}`} maxWidth="max-w-4xl">
        {historyTarget && (() => {
          const history = (orders || []).filter(o => historyTarget.id ? o.customerId === historyTarget.id : o.customerName === historyTarget.name).sort((a,b) => new Date(b.date)-new Date(a.date));
          return <div className="space-y-3"><p className="text-sm text-gray-500">Lịch sử sản phẩm khách đã mua theo thời gian.</p><div className="overflow-auto"><table className="w-full text-sm"><thead className="bg-gray-100"><tr><th className="p-2 text-left">Mã hóa đơn</th><th className="p-2 text-left">Thời gian</th><th className="p-2 text-left">Sản phẩm</th><th className="p-2 text-right">Tổng tiền</th></tr></thead><tbody>{history.map(o => <tr key={o.id} className="border-b"><td className="p-2">{o.invoiceCode || o.id}</td><td className="p-2">{formatDate(o.date)}</td><td className="p-2">{(o.items||[]).map((it,i)=><button key={i} className="block text-blue-600 underline" onClick={() => setProductTarget(it)}>{it.name} × {it.quantity}</button>)}</td><td className="p-2 text-right">{formatCurrency(o.total)}</td></tr>)}</tbody></table></div>{history.length===0 && <p className="p-4 text-center text-gray-500">Chưa có lịch sử mua hàng.</p>}</div>;
        })()}
      </Modal>
      <Modal isOpen={!!productTarget} onClose={() => setProductTarget(null)} title={`Lịch sử sản phẩm: ${productTarget?.name || ''}`} maxWidth="max-w-4xl">
        {productTarget && (() => {
          const selectedYear = productTarget.importYear || 'ALL';
          const inRange = d => selectedYear === 'ALL' || (d && !Number.isNaN(new Date(d).getTime()) && String(new Date(d).getFullYear()) === String(selectedYear));
          const sold = (orders||[]).filter(o => inRange(o.date) && (o.items||[]).some(it => (productTarget.id && it.id === productTarget.id) || it.name === productTarget.name)).sort((a,b)=>new Date(b.date)-new Date(a.date));
          const bought = (imports||[]).filter(im => inRange(im.date) && (im.items||[]).some(it => (productTarget.id && (it.id === productTarget.id || it.productId === productTarget.id)) || it.name === productTarget.name)).sort((a,b)=>new Date(b.date)-new Date(a.date));
          const matchedProduct = (products || []).find(p => (productTarget.id && p.id === productTarget.id) || p.name === productTarget.name);
          const latestImport = (imports || []).flatMap(im => (im.items || []).filter(item => (productTarget.id && item.id === productTarget.id) || (!productTarget.id && item.name === productTarget.name)).map(item => ({ ...item, date: im.date, supplierName: im.supplierName || 'Chưa rõ nhà cung cấp', supplierId: im.supplierId || '' }))).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))[0];
          return <div className="space-y-4">
            <div className="flex gap-3 flex-wrap items-center">
              <label className="text-sm font-semibold">Xem lịch sử theo năm <select className="border rounded-lg p-2 bg-white" value={selectedYear} onChange={e=>setProductTarget(v=>({...v,importYear:e.target.value,from:'',to:''}))}>
                <option value="ALL">Tất cả các năm</option>
                {[...new Set([new Date().getFullYear(), ...(imports||[]).map(im=>im.date ? new Date(im.date).getFullYear() : null), ...(orders||[]).map(o=>o.date ? new Date(o.date).getFullYear() : null)].filter(y=>Number.isFinite(y)))].sort((a,b)=>b-a).map(y=><option key={y} value={String(y)}>{y}</option>)}
              </select></label>
            </div>
            <h4 className="font-bold">Khách hàng đã mua</h4>
            <div className="overflow-auto"><table className="w-full text-sm"><thead className="bg-gray-100"><tr><th className="p-2 text-left">Khách hàng</th><th className="p-2 text-left">Mã hóa đơn</th><th className="p-2 text-left">Thời gian</th><th className="p-2">Số lượng</th></tr></thead><tbody>
              {sold.slice(0, productTarget.showAllSales ? sold.length : 5).map(o=><tr key={o.id} className="border-b"><td className="p-2"><button type="button" className="text-blue-700 underline text-left" onClick={() => { setProductTarget(null); navigateMainTab('customers', { id: o.customerId, name: o.customerName }); }}>{o.customerName||'Khách lẻ'} · Mở khách hàng</button></td><td className="p-2">{o.invoiceCode||o.id}</td><td className="p-2">{formatDate(o.date)}</td><td className="p-2">{(o.items||[]).filter(it=>(productTarget.id&&(it.id===productTarget.id||it.productId===productTarget.id))||it.name===productTarget.name).reduce((n,it)=>n+Number(it.quantity??it.qty??0),0)}</td></tr>)}
              {sold.length===0&&<tr><td colSpan={4} className="p-4 text-center text-gray-400">Không có phát sinh bán trong năm đã chọn.</td></tr>}
            </tbody></table></div>
            {sold.length > 5 && <button type="button" onClick={() => setProductTarget(v => ({...v, showAllSales: !v.showAllSales}))} className="text-sm font-semibold text-blue-600 hover:underline">{productTarget.showAllSales ? 'Thu gọn' : `Xem thêm ${sold.length - 5} dòng thời gian`}</button>}
            <div className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-2"><h4 className="font-bold">Lịch sử nhập hàng từ nhà cung cấp</h4><label className="text-sm flex items-center gap-2">Hiển thị <select className="border rounded-lg p-1.5 bg-white" value={productTarget.importLimit || '5'} onChange={e=>setProductTarget(v=>({...v,importLimit:e.target.value}))}><option value="5">5 lần gần nhất</option><option value="10">10 lần gần nhất</option><option value="all">Tất cả</option></select></label></div>
              {(() => { const isThisProduct = it => (productTarget.id && (it.id === productTarget.id || it.productId === productTarget.id)) || it.name === productTarget.name; const rows = (imports||[]).flatMap(im=>(im.items||[]).filter(isThisProduct).map((it,idx)=>({key:`${im.id||im.date}-${idx}`,date:im.date||'',time:new Date(im.date||0).getTime(),supplierName:im.supplierName||'Chưa rõ nhà cung cấp',supplierId:im.supplierId||'',qty:Math.max(0,Number(it.qty??it.quantity??0)),cost:Number(it.importCost??it.cost??0),code:im.invoiceCode||im.receiptCode||im.id||''}))).filter(row=>inRange(row.date)).sort((a,b)=>b.time-a.time); const totalQty = rows.reduce((sum,row)=>sum+row.qty,0); const visibleRows = productTarget.importLimit==='all'?rows:rows.slice(0,Number(productTarget.importLimit||5)); return <>
                <div className="bg-gray-50 border rounded-lg p-3"><p className="text-xs text-gray-500">Tổng số lượng nhập {selectedYear==='ALL'?'(tất cả năm)':`năm ${selectedYear}`}</p><p className="text-xl font-extrabold text-gray-800">{totalQty} sản phẩm</p></div>
                <div className="overflow-auto"><table className="w-full text-sm min-w-[620px]"><thead className="bg-gray-100"><tr><th className="p-2 text-left">Thời gian nhập</th><th className="p-2 text-left">Nhà cung cấp</th><th className="p-2 text-left">Mã phiếu</th><th className="p-2 text-right">Số lượng nhập</th><th className="p-2 text-right">Giá nhập/đơn vị</th></tr></thead><tbody>
                  {visibleRows.map(row=><tr key={row.key} className="border-b"><td className="p-2 whitespace-nowrap">{formatDate(row.date)}</td><td className="p-2"><button type="button" className="text-blue-700 underline text-left" onClick={()=>{setProductTarget(null);navigateMainTab('suppliers',{id:row.supplierId,name:row.supplierName});}}>{row.supplierName} · Mở NCC</button></td><td className="p-2">{String(row.code).slice(0,16)||'—'}</td><td className="p-2 text-right font-semibold">{row.qty}</td><td className="p-2 text-right">{formatCurrency(row.cost)}</td></tr>)}
                  {visibleRows.length===0&&<tr><td colSpan={5} className="p-4 text-center text-gray-400">Không có lịch sử nhập hàng trong năm đã chọn.</td></tr>}
                </tbody></table></div>
              </>; })()}
            </div>
          </div>;
        })()}
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


  const handleUndoDebtPayment = async (payment) => {
    if (!detailTarget?.id || !payment?.id || savingDebtPayment) return;
    if (!window.confirm(`Hoàn tác giao dịch ${formatCurrency(payment.amount)}? Số tiền sẽ được cộng trở lại công nợ.`)) return;
    setSavingDebtPayment(true);
    try {
      const contactRef = doc(db, 'stores', storeId, type, detailTarget.id);
      const paymentRef = doc(db, 'stores', storeId, type, detailTarget.id, 'debtPayments', payment.id);
      await updateDoc(contactRef, { totalDebt: Math.max(0, Number(detailTarget.totalDebt || 0) + Number(payment.amount || 0)) });
      await deleteDoc(paymentRef);
      await deleteDoc(doc(db, 'stores', storeId, 'debtPaymentReports', `${type}_${detailTarget.id}_${payment.id}`)).catch(() => {});
      setDetailTarget(prev => prev ? { ...prev, totalDebt: Math.max(0, Number(prev.totalDebt || 0) + Number(payment.amount || 0)) } : prev);
      if (editingDebtPayment?.id === payment.id) setEditingDebtPayment(null);
      showToast('Đã hoàn tác giao dịch công nợ');
    } catch (err) { showToast('Không thể hoàn tác giao dịch công nợ', 'error'); }
    finally { setSavingDebtPayment(false); }
  };

  const handleEditDetailStat = (key, label, currentValue) => {
    if (!detailTarget?.id || savingDebtPayment) return;
    const value = Math.max(0, Number(currentValue) || 0);
    setEditDetailStat({ key, label, currentValue: value, newValue: String(value), note: '' });
  };

  const handleSaveDetailStat = async (e) => {
    e.preventDefault();
    if (!editDetailStat || !detailTarget?.id || savingDebtPayment) return;
    const { key, label, currentValue } = editDetailStat;
    const rawValue = String(editDetailStat.newValue ?? '').trim();
    const nextValue = Number(rawValue.replace(/[ ,\s]/g, ''));
    if (!rawValue || !Number.isFinite(nextValue) || nextValue < 0) { showToast('Số tiền không hợp lệ. Vui lòng nhập số từ 0 trở lên.', 'error'); return; }
    const note = String(editDetailStat.note || '').trim();
    if (!note) { showToast('Vui lòng nhập ghi chú để lưu lịch sử điều chỉnh.', 'error'); return; }
    setSavingDebtPayment(true);
    try {
      const now = new Date().toISOString();
      const contactRef = doc(db, 'stores', storeId, type, detailTarget.id);
      const update = {
        ...(key === 'totalAmount' ? { manualTotalAmount: nextValue } : {}),
        ...(key === 'totalPaid' ? { manualTotalPaid: nextValue } : {}),
        ...(key === 'totalDebt' ? { totalDebt: nextValue } : {}),
        debtUpdatedAt: now,
        lastManualAdjustmentNote: `${label}: ${formatCurrency(currentValue)} → ${formatCurrency(nextValue)}. Lý do: ${note}`,
        lastManualAdjustmentAt: now
      };
      await setDoc(contactRef, update, { merge: true });
      await addDoc(collection(db, 'stores', storeId, type, detailTarget.id, 'debtAdjustments'), {
        field: key, label, oldValue: currentValue, newValue: nextValue,
        note, date: now, createdAt: now
      });
      setDetailTarget(prev => prev ? { ...prev, ...update } : prev);
      setEditDetailStat(null);
      showToast(`Đã điều chỉnh ${label}; ghi chú đã được lưu.`);
    } catch (err) {
      showToast('Không thể điều chỉnh số liệu: ' + (err?.message || 'Lỗi không xác định'), 'error');
    } finally { setSavingDebtPayment(false); }
  };

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
                const roleClass = s.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-blue-100 text-blue-700';
                return (
                  <tr key={s.id} className="border-b hover:bg-gray-50">
                    <td className="p-3"><p className="font-bold text-gray-800">{s.name}</p><p className="text-xs text-gray-500">@{s.username}</p></td>
                    <td className="p-3"><span className={"px-2 py-1 rounded text-xs font-bold " + roleClass}>{s.role.toUpperCase()}</span></td>
                    <td className="p-3 text-right flex justify-end gap-1.5">
                      <button onClick={() => openEditModal(s)} className="text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg font-medium text-xs">Sửa quyền / Đổi MK</button>
                      <button onClick={() => handleDeleteStaff(s)} className="text-blue-600 bg-blue-50 p-1.5 rounded-lg hover:bg-blue-100" title="Xóa nhân viên"><Trash2 size={16}/></button>
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
                {PERMISSION_TREE.map(g => (<div key={g.module} className="border-b pb-2"><p className="font-bold text-blue-800 text-sm mb-2 uppercase">{g.module}</p>{g.perms.map(p => (<label key={p.id} className="flex items-center gap-2 text-sm mb-1.5 cursor-pointer hover:bg-gray-200 p-1 rounded"><input type="checkbox" checked={p.id.startsWith('dash_') ? form.perms[p.id] !== false : !!form.perms[p.id]} onChange={() => setForm({...form, perms: {...form.perms, [p.id]: p.id.startsWith('dash_') ? form.perms[p.id] === false : !form.perms[p.id]}})} className="w-4 h-4 text-blue-600"/> {p.label}</label>))}</div>))}
              </div>
            </div>
          )}
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold p-3 rounded-lg">{loading ? 'Đang xử lý...' : 'Lưu Dữ Liệu'}</button>
        </form>
      </Modal>
    </div>
  );
}

function ContactManager({ type, data, orders, products = [], navigationTarget, storeConfig, db, storeId, showToast, userData = {} }) {
  const canEditDetailAmounts = userData.role === 'admin' || userData.perms?.contact_edit_detail_amounts === true;
  const isCus = type === 'customers'; const title = isCus ? "Khách Hàng" : "Nhà Cung Cấp";
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({});
  const [sortOrder, setSortOrder] = useState('none');
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [detailTarget, setDetailTarget] = useState(null);
  const [detailRowsPerPage, setDetailRowsPerPage] = useState('5');
  const [detailCurrentPage, setDetailCurrentPage] = useState(1);
  const [debtPayments, setDebtPayments] = useState([]);
  const [deletedContactTransactions, setDeletedContactTransactions] = useState([]);
  const [selectedPaymentIds, setSelectedPaymentIds] = useState([]);
  const [selectedTransactionIds, setSelectedTransactionIds] = useState([]);
  const [debtPaymentMode, setDebtPaymentMode] = useState('partial');
  const [debtPaymentAmount, setDebtPaymentAmount] = useState('');
  const [debtPaymentDate, setDebtPaymentDate] = useState(() => getVietnamDateKey(new Date()));
  const [debtPaymentMethod, setDebtPaymentMethod] = useState('cash');
  const [debtPaymentNote, setDebtPaymentNote] = useState('');
  const [selectedDebtInvoiceIds, setSelectedDebtInvoiceIds] = useState([]);
  const [editingDebtPayment, setEditingDebtPayment] = useState(null);
  const [savingDebtPayment, setSavingDebtPayment] = useState(false);
  const [editDetailStat, setEditDetailStat] = useState(null);
  const [editingContactTransaction, setEditingContactTransaction] = useState(null);
  const [viewingContactTransaction, setViewingContactTransaction] = useState(null);
  const [editingContactTransactionOriginal, setEditingContactTransactionOriginal] = useState(null);
  const [savedContactTransactions, setSavedContactTransactions] = useState({});

  // Keep these handlers inside ContactManager so the customer/supplier detail
  // buttons use this component's own state and selected contact.
  const handleEditDetailStat = (key, label, currentValue) => {
    if (!(userData.role === 'admin' || userData.perms?.contact_edit_detail_amounts === true)) { showToast('Bạn chưa được cấp quyền sửa số tiền.', 'error'); return; }
    if (!detailTarget?.id || savingDebtPayment) return;
    const value = Math.max(0, Number(currentValue) || 0);
    setEditDetailStat({ key, label, currentValue: value, newValue: String(value), note: '' });
  };

  const handleSaveDetailStat = async (e) => {
    e.preventDefault();
    if (!(userData.role === 'admin' || userData.perms?.contact_edit_detail_amounts === true)) { showToast('Bạn chưa được cấp quyền sửa số tiền.', 'error'); return; }
    if (!editDetailStat || !detailTarget?.id || savingDebtPayment) return;
    const { key, label, currentValue } = editDetailStat;
    const rawValue = String(editDetailStat.newValue ?? '').trim();
    const nextValue = Number(rawValue.replace(/[ ,\s]/g, ''));
    if (!rawValue || !Number.isFinite(nextValue) || nextValue < 0) {
      showToast('Số tiền không hợp lệ. Vui lòng nhập số từ 0 trở lên.', 'error');
      return;
    }
    const note = String(editDetailStat.note || '').trim();
    if (!note) {
      showToast('Vui lòng nhập ghi chú để lưu lịch sử điều chỉnh.', 'error');
      return;
    }
    setSavingDebtPayment(true);
    try {
      const now = new Date().toISOString();
      const contactRef = doc(db, 'stores', storeId, type, detailTarget.id);
      const update = {
        ...(key === 'totalAmount' ? { manualTotalAmount: nextValue } : {}),
        ...(key === 'totalPaid' ? { manualTotalPaid: nextValue } : {}),
        ...(key === 'totalDebt' ? { totalDebt: nextValue } : {}),
        debtUpdatedAt: now,
        lastManualAdjustmentNote: `${label}: ${formatCurrency(currentValue)} → ${formatCurrency(nextValue)}. Lý do: ${note}`,
        lastManualAdjustmentAt: now
      };
      await setDoc(contactRef, update, { merge: true });
      await addDoc(collection(db, 'stores', storeId, type, detailTarget.id, 'debtAdjustments'), {
        field: key, label, oldValue: currentValue, newValue: nextValue,
        note, date: now, createdAt: now
      });
      setDetailTarget(prev => prev ? { ...prev, ...update } : prev);
      setEditDetailStat(null);
      showToast(`Đã điều chỉnh ${label}; ghi chú đã được lưu.`);
    } catch (err) {
      showToast('Không thể điều chỉnh số liệu: ' + (err?.message || 'Lỗi không xác định'), 'error');
    } finally {
      setSavingDebtPayment(false);
    }
  };

  useEffect(() => {
    if (!detailTarget?.id) { setDebtPayments([]); setDeletedContactTransactions([]); return; }
    const paymentsRef = collection(db, 'stores', storeId, type, detailTarget.id, 'debtPayments');
    const deletedRef = collection(db, 'stores', storeId, type, detailTarget.id, 'deletedTransactions');
    const stopPayments = onSnapshot(paymentsRef, snap => setDebtPayments(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => new Date(b.date || 0) - new Date(a.date || 0))), () => showToast('Không tải được lịch sử trừ công nợ', 'error'));
    const stopDeleted = onSnapshot(deletedRef, snap => setDeletedContactTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => new Date(b.deletedAt || 0) - new Date(a.deletedAt || 0))), () => showToast('Không tải được lịch sử xóa hóa đơn', 'error'));
    return () => { stopPayments(); stopDeleted(); };
  }, [db, storeId, type, detailTarget?.id, showToast]);
  useEffect(() => {
    const closeOnBrowserBack = () => setDetailTarget(null);
    window.addEventListener('app:close-popups', closeOnBrowserBack);
    const onNavigate = (event) => {
      const detail = event?.detail || {};
      const expectedTab = isCus ? 'customers' : 'suppliers';
      if (detail.tab !== expectedTab || !detail.entity) return;
      const target = detail.entity;
      const match = (data || []).find(row => (target.id && row.id === target.id) || (target.name && String(row.name || '').trim().toLowerCase() === String(target.name).trim().toLowerCase()));
      if (match) { setSearchTerm(''); setCurrentPage(1); setDetailRowsPerPage('5'); setDetailCurrentPage(1); setDetailTarget(match); }
    };
    window.addEventListener('app:navigate-tab', onNavigate);
    return () => window.removeEventListener('app:navigate-tab', onNavigate);
  }, [data, isCus]);
  const currentDate = new Date();
  const [filterMonth, setFilterMonth] = useState('ALL');
  const [filterYear, setFilterYear] = useState('ALL');
  const [rowsPerPage, setRowsPerPage] = useState('10');
  const [currentPage, setCurrentPage] = useState(1);
  useEffect(() => { if (navigationTarget?.tab === type && (navigationTarget.id || navigationTarget.name)) { const match = (data || []).find(item => navigationTarget.id && item.id === navigationTarget.id) || (data || []).find(item => navigationTarget.name && (item.name || '').trim().toLocaleLowerCase('vi') === navigationTarget.name.trim().toLocaleLowerCase('vi')); if (match) { setDetailTarget(match); setDetailRowsPerPage('5'); setDetailCurrentPage(1); setSearchTerm(''); setCurrentPage(1); } } }, [navigationTarget?.nonce, navigationTarget?.tab, navigationTarget?.id, navigationTarget?.name, type, data]);

  const getContactTransactionsForDebt = () => {
    const idField = isCus ? 'customerId' : 'supplierId';
    const nameField = isCus ? 'customerName' : 'supplierName';
    const normalizeName = value => String(value || '').trim().toLocaleLowerCase('vi');
    const targetName = normalizeName(detailTarget?.name);
    // Kết hợp cả liên kết bằng ID và tên để không bỏ sót giao dịch cũ/import Excel
    // vốn thiếu ID hoặc dùng ID khác với hồ sơ hiện tại.
    const sourceTransactions = orders || []; // Parent passes orders for customers and imports for suppliers.
    const matches = sourceTransactions.filter(transaction =>
      (detailTarget?.id && transaction[idField] && transaction[idField] === detailTarget.id) ||
      (targetName && normalizeName(transaction[nameField]) === targetName)
    );
    const unique = Array.from(new Map(matches.map(transaction => [transaction.id, transaction])).values());
    return unique.filter(transaction => getOrderRemainingDebt(transaction) > 0)
      .sort((a,b) => new Date(a.date || 0) - new Date(b.date || 0));
  };

  const applyDebtAllocations = async (allocations, direction = 'reverse') => {
    // direction='reverse' returns previously allocated payments to the transaction debt;
    // direction='apply' subtracts the allocation from the transaction debt.
    for (const allocation of (allocations || [])) {
      const sourceTransactions = orders || []; // Parent passes orders for customers and imports for suppliers.
      const transaction = sourceTransactions.find(o => o.id === allocation.transactionId);
      if (!transaction) continue;
      const total = Math.max(0, Number(transaction.total) || 0);
      const currentRemaining = getOrderRemainingDebt(transaction);
      const amount = Math.max(0, Number(allocation.amount) || 0);
      const nextRemaining = direction === 'reverse'
        ? Math.min(total, currentRemaining + amount)
        : Math.max(0, currentRemaining - amount);
      await updateDoc(doc(db, 'stores', storeId, isCus ? 'orders' : 'imports', transaction.id), {
        remainingDebt: nextRemaining,
        paidAmount: Math.max(0, total - nextRemaining),
        status: nextRemaining > 0 ? 'DEBT' : 'PAID',
        debtUpdatedAt: new Date().toISOString(),
        debtPaymentNote: direction === 'apply' ? (allocation.note || '') : (transaction.debtPaymentNote || '')
      });
    }
  };

  const handleUndoDebtPayment = async (payment) => {
    if (!detailTarget?.id || !payment?.id || savingDebtPayment) return;
    if (!window.confirm(`Hoàn tác giao dịch ${formatCurrency(payment.amount)}? Công nợ sẽ được khôi phục và các đơn đã phân bổ sẽ trở lại trạng thái nợ tương ứng.`)) return;
    setSavingDebtPayment(true);
    try {
      if (payment.allocations?.length) await applyDebtAllocations(payment.allocations, 'reverse');
      const restoredDebt = Math.max(0, Number(detailTarget.totalDebt || 0) + Number(payment.amount || 0));
      await updateDoc(doc(db, 'stores', storeId, type, detailTarget.id), { totalDebt: restoredDebt, debtNote: `Hoàn tác trừ công nợ ${formatCurrency(payment.amount)}: ${payment.note || ''}`, debtUpdatedAt: new Date().toISOString() });
      await deleteDoc(doc(db, 'stores', storeId, type, detailTarget.id, 'debtPayments', payment.id));
      await deleteDoc(doc(db, 'stores', storeId, 'debtPaymentReports', `${type}_${detailTarget.id}_${payment.id}`)).catch(() => {});
      setDetailTarget(prev => prev ? { ...prev, totalDebt: restoredDebt } : prev);
      if (editingDebtPayment?.id === payment.id) { setEditingDebtPayment(null); setDebtPaymentNote(''); }
      showToast('Đã hoàn tác giao dịch công nợ');
    } catch (err) { showToast('Không thể hoàn tác giao dịch công nợ: ' + (err?.message || ''), 'error'); }
    finally { setSavingDebtPayment(false); }
  };

  const handleDeleteSelectedPayments = async () => {
    if (!selectedPaymentIds.length || savingDebtPayment) return;
    const chosen = debtPayments.filter(payment => selectedPaymentIds.includes(payment.id));
    if (chosen.length !== 1) { showToast('Để tránh tính sai số dư, vui lòng chọn và xóa từng lần thanh toán một.', 'error'); return; }
    if (!window.confirm(`Xóa lần thanh toán ${formatCurrency(chosen[0].amount)} đã chọn? Hệ thống sẽ hoàn tác lần này để cập nhật lại công nợ và các giao dịch liên quan.`)) return;
    await handleUndoDebtPayment(chosen[0]);
    setSelectedPaymentIds([]);
  };

  const handleSaveContactTransaction = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!editingContactTransaction || savingDebtPayment) return;
    const transaction = editingContactTransaction;
    const collectionName = isCus ? 'orders' : 'imports';
    const originalRef = doc(db, 'stores', storeId, collectionName, transaction.id);
    setSavingDebtPayment(true);
    try {
      const currentSnapshot = await getDoc(originalRef);
      const sourceWasMissing = !currentSnapshot.exists();
      // Khi chứng từ gốc đã mất, dùng ID thay thế cố định để bấm lưu lại không tạo nhiều chứng từ.
      const replacementId = `${transaction.id}_recovered`;
      const replacementRef = doc(db, 'stores', storeId, collectionName, replacementId);
      const replacementSnapshot = sourceWasMissing ? await getDoc(replacementRef) : null;
      const replacementAlreadyExists = !!replacementSnapshot?.exists();
      const transactionRef = sourceWasMissing ? replacementRef : originalRef;
      const baseData = sourceWasMissing
        ? (replacementAlreadyExists ? replacementSnapshot.data() : editingContactTransactionOriginal)
        : currentSnapshot.data();
      if (!baseData || !Array.isArray(baseData.items)) {
        throw new Error('Không còn dữ liệu gốc để đối chiếu. Đơn hàng chưa được thay đổi; vui lòng gửi mã đơn để kiểm tra bản sao lưu.');
      }
      const original = { ...baseData, id: sourceWasMissing && replacementAlreadyExists ? replacementId : transaction.id };
      const items = (transaction.items || []).map(item => {
        const quantity = Math.max(0, Number(item.quantity ?? item.qty) || 0);
        const price = Math.max(0, Number(item.price ?? item.importCost ?? item.cost) || 0);
        const cost = Math.max(0, Number(item.cost ?? item.importCost) || 0);
        return {
          ...item,
          name: String(item.name || item.productName || '').trim(),
          quantity, qty: quantity, price, cost,
          ...(!isCus ? { importCost: price } : {})
        };
      });
      if (!items.length || items.some(item => !item.name || item.quantity <= 0)) {
        throw new Error('Đơn hàng/phiếu nhập phải có ít nhất một sản phẩm; mỗi dòng cần tên và số lượng lớn hơn 0.');
      }
      const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
      const totalCost = items.reduce((sum, item) => sum + item.quantity * item.cost, 0);
      const oldTotal = Math.max(0, Number(original.total ?? original.totalAmount) || 0);
      const oldRemaining = getOrderRemainingDebt(original);
      const paidAmount = Math.max(0, Number(original.paidAmount ?? (oldTotal - oldRemaining)) || 0);
      if (paidAmount > total) throw new Error('Tổng tiền mới nhỏ hơn số đã thanh toán. Hãy điều chỉnh thanh toán trước khi lưu.');
      const newRemaining = Math.max(0, total - paidAmount);
      const confirmText = sourceWasMissing
        ? `Không tìm thấy chứng từ gốc trên Firebase. Hệ thống sẽ tạo chứng từ thay thế, giữ thời gian và thông tin thanh toán gốc, rồi điều chỉnh tồn kho/công nợ theo đơn mới. Mã chứng từ thay thế: ${replacementId}. Tổng tiền mới: ${formatCurrency(total)}. Tiếp tục?`
        : `Lưu thay đổi ${isCus ? 'đơn hàng' : 'phiếu nhập'}? Tổng tiền mới: ${formatCurrency(total)}. Công nợ và tồn kho sẽ được điều chỉnh theo chênh lệch.`;
      if (!window.confirm(confirmText)) return;

      const batch = writeBatch(db);
      const resolveProduct = item => {
        const candidates = [item.productId, item.productID, item.productCode, item.code, item.name, item.productName, item.product];
        for (const candidate of candidates) {
          const value = String(candidate || '').trim().toLowerCase();
          if (!value) continue;
          const found = products.find(p => [p.id, p.code, p.productCode, p.name].some(v => String(v || '').trim().toLowerCase() === value));
          if (found) return found;
        }
        return null;
      };
      const stockDeltas = new Map();
      const addStockDelta = (item, delta) => {
        const product = resolveProduct(item);
        if (!product) throw new Error('Không tìm thấy sản phẩm trong kho: ' + String(item.name || item.productName || item.code || item.productCode || 'không rõ tên') + '. Hãy chọn lại sản phẩm từ danh sách gợi ý rồi lưu.');
        if (delta) stockDeltas.set(product.id, (stockDeltas.get(product.id) || 0) + delta);
      };
      // Đưa kho về trạng thái trước đơn cũ rồi áp dụng lại số lượng của đơn mới trong cùng batch.
      const oldItems = Array.isArray(original.items) ? original.items : [];
      oldItems.forEach(item => addStockDelta(item, isCus ? Number(item.quantity ?? item.qty ?? 0) : -Number(item.quantity ?? item.qty ?? 0)));
      items.forEach(item => addStockDelta(item, isCus ? -item.quantity : item.quantity));
      for (const [productId, delta] of stockDeltas.entries()) {
        if (!delta) continue;
        const product = products.find(p => String(p.id) === String(productId));
        if (!product) throw new Error('Không tìm thấy sản phẩm trong kho để điều chỉnh tồn: ' + productId);
        const stock = Number(product.stock ?? product.quantity ?? 0) || 0;
        if (stock + delta < 0) throw new Error('Tồn kho không đủ để điều chỉnh: ' + (product.name || productId));
        batch.update(doc(db, 'stores', storeId, 'products', product.id), { stock: stock + delta, updatedAt: new Date().toISOString() });
      }
      const transactionUpdate = {
        ...original,
        id: undefined,
        items, total, totalAmount: total, paidAmount, remainingDebt: newRemaining,
        status: newRemaining > 0 ? 'DEBT' : 'PAID',
        ...(isCus ? { totalCost, customerName: detailTarget?.name || transaction.customerName } : { supplierName: detailTarget?.name || transaction.supplierName }),
        debtUpdatedAt: new Date().toISOString(),
        ...(sourceWasMissing ? { recoveredFromTransactionId: transaction.id, recoveredAt: new Date().toISOString() } : {})
      };
      delete transactionUpdate.id;
      if (sourceWasMissing) {
        // Tạo chứng từ mới thay thế, giữ nguyên timestamp/metadata của bản gốc; ID thay thế ổn định để tránh tạo trùng khi thử lại.
        batch.set(transactionRef, transactionUpdate, { merge: true });
      } else {
        batch.update(transactionRef, transactionUpdate);
      }
      const contactDebtDelta = newRemaining - oldRemaining;
      if (contactDebtDelta !== 0 && detailTarget?.id) {
        batch.set(doc(db, 'stores', storeId, type, detailTarget.id), {
          totalDebt: Math.max(0, (Number(detailTarget.totalDebt) || 0) + contactDebtDelta),
          debtUpdatedAt: new Date().toISOString(),
          debtNote: `Điều chỉnh công nợ sau khi sửa ${isCus ? 'đơn hàng' : 'phiếu nhập'} ${transaction.id}`
        }, { merge: true });
      }
      await batch.commit();
      const savedSnapshot = await getDoc(transactionRef);
      if (!savedSnapshot.exists()) throw new Error('Đã gửi lệnh lưu nhưng không đọc lại được chứng từ. Tải lại trang để kiểm tra trước khi thử lại.');
      const saved = { ...savedSnapshot.data(), id: transactionRef.id };
      const savedItems = Array.isArray(saved.items) ? saved.items : [];
      const itemsMatch = savedItems.length === items.length && items.every((item, index) => {
        const stored = savedItems[index] || {};
        return String(stored.name || stored.productName || '') === item.name && Number(stored.quantity ?? stored.qty) === item.quantity && Number(stored.price ?? stored.importCost ?? stored.cost) === item.price;
      });
      if (Number(saved.total ?? saved.totalAmount) !== total || !itemsMatch) throw new Error('Firebase chưa xác nhận đúng nội dung vừa sửa. Vui lòng tải lại trang và kiểm tra dữ liệu trước khi thử lại.');
      setSavedContactTransactions(prev => ({ ...prev, [transaction.id]: saved, [saved.id]: saved }));
      // savedContactTransactions supplies the updated/recreated record to the detail list.
      // Do not call setOrders/setImports here: ContactManager owns no such setters.
      setDetailTarget(prev => prev ? { ...prev, totalDebt: Math.max(0, (Number(prev.totalDebt) || 0) + contactDebtDelta) } : prev);
      setEditingContactTransaction(null);
      setEditingContactTransactionOriginal(null);
      showToast(sourceWasMissing ? `Đã tạo chứng từ thay thế ${saved.id}, giữ thời gian gốc và điều chỉnh tồn kho/công nợ.` : 'Đã lưu thay đổi và xác minh lại dữ liệu trên Firebase.');
    } catch (err) {
      console.error('Lỗi lưu giao dịch chi tiết khách hàng/nhà cung cấp:', err);
      const errorMessage = 'Không lưu được: ' + (err?.message || 'Lỗi không xác định.');
      showToast(errorMessage, 'error');
      if (typeof window !== 'undefined') window.alert(errorMessage);
    } finally {
      setSavingDebtPayment(false);
    }
  };

  const handleUndoDeletedContactTransaction = async (deletedRecord) => {
    if (!deletedRecord || deletedRecord.status === 'restored' || savingDebtPayment || !detailTarget?.id) return;
    const transactionData = deletedRecord.transactionData;
    const transactionId = deletedRecord.transactionId || deletedRecord.id;
    if (!transactionData || !transactionId) { showToast('Không đủ dữ liệu để hoàn tác hóa đơn đã xóa.', 'error'); return; }
    if (!window.confirm(`Khôi phục hóa đơn ${deletedRecord.transactionCode || transactionId}? Công nợ sẽ được cộng lại ${formatCurrency(deletedRecord.debtRemoved || 0)}. Tồn kho sẽ giữ nguyên như lúc xóa.`)) return;
    setSavingDebtPayment(true);
    try {
      const collectionName = deletedRecord.collectionName || (isCus ? 'orders' : 'imports');
      const transactionRef = doc(db, 'stores', storeId, collectionName, transactionId);
      const current = await getDoc(transactionRef);
      if (current.exists()) throw new Error('Hóa đơn này đã tồn tại trở lại. Không thể khôi phục trùng mã.');
      const archivedRef = doc(db, 'stores', storeId, type, detailTarget.id, 'deletedTransactions', deletedRecord.id);
      const debtRemoved = Math.max(0, Number(deletedRecord.debtRemoved) || 0);
      const nextDebt = Math.max(0, (Number(detailTarget.totalDebt) || 0) + debtRemoved);
      const nowIso = new Date().toISOString();
      const batch = writeBatch(db);
      const restoredData = { ...transactionData };
      delete restoredData.id;
      batch.set(transactionRef, { ...restoredData, restoredFromDeletedHistory: true, restoredAt: nowIso }, { merge: false });
      batch.update(archivedRef, { status: 'restored', restoredAt: nowIso, restoredBy: userData.email || userData.username || 'user' });
      batch.set(doc(db, 'stores', storeId, type, detailTarget.id), {
        totalDebt: nextDebt,
        debtUpdatedAt: nowIso,
        debtNote: `Đã hoàn tác xóa hóa đơn ${deletedRecord.transactionCode || transactionId}; khôi phục công nợ ${formatCurrency(debtRemoved)}`
      }, { merge: true });
      await batch.commit();
      setSavedContactTransactions(prev => ({ ...prev, [transactionId]: { ...transactionData, id: transactionId } }));
      setDetailTarget(prev => prev ? { ...prev, totalDebt: nextDebt, debtNote: `Đã hoàn tác xóa hóa đơn ${deletedRecord.transactionCode || transactionId}; khôi phục công nợ ${formatCurrency(debtRemoved)}` } : prev);
      showToast('Đã hoàn tác xóa hóa đơn và khôi phục công nợ; tồn kho giữ nguyên.');
    } catch (err) {
      showToast('Không thể hoàn tác xóa hóa đơn: ' + (err?.message || 'Lỗi không xác định'), 'error');
    } finally { setSavingDebtPayment(false); }
  };

  const handleDeleteOneContactTransaction = async (transaction) => {
    if (!transaction || savingDebtPayment || !detailTarget?.id) return;
    if (!window.confirm(`Xóa ${isCus ? 'đơn hàng' : 'phiếu nhập'} này khỏi lịch sử? Hệ thống sẽ lưu bản sao để có thể hoàn tác; tồn kho không thay đổi. Bạn có chắc chắn không?`)) return;
    setSavingDebtPayment(true);
    try {
      const remaining = getOrderRemainingDebt(transaction);
      const nextDebt = Math.max(0, (Number(detailTarget.totalDebt) || 0) - remaining);
      const collectionName = isCus ? 'orders' : 'imports';
      const nowIso = new Date().toISOString();
      const archiveRef = doc(db, 'stores', storeId, type, detailTarget.id, 'deletedTransactions', transaction.id);
      const transactionRef = doc(db, 'stores', storeId, collectionName, transaction.id);
      const batch = writeBatch(db);
      batch.set(archiveRef, {
        transactionId: transaction.id,
        transactionCode: transaction.invoiceCode || transaction.receiptCode || transaction.code || transaction.id,
        transactionData: { ...transaction },
        collectionName,
        deletedAt: nowIso,
        deletedBy: userData.email || userData.username || 'user',
        debtRemoved: remaining,
        status: 'deleted',
        deleteNote: `Đã xóa hóa đơn ${transaction.invoiceCode || transaction.receiptCode || transaction.code || transaction.id}; giảm công nợ ${formatCurrency(remaining)}`
      }, { merge: true });
      batch.delete(transactionRef);
      batch.set(doc(db, 'stores', storeId, type, detailTarget.id), {
        totalDebt: nextDebt,
        debtUpdatedAt: nowIso,
        debtNote: `Đã xóa hóa đơn ${transaction.invoiceCode || transaction.receiptCode || transaction.code || transaction.id}; giảm công nợ ${formatCurrency(remaining)}. Có thể hoàn tác tại Lịch sử xóa hóa đơn.`
      }, { merge: true });
      await batch.commit();
      setSelectedTransactionIds(prev => prev.filter(id => id !== transaction.id));
      setDetailTarget(prev => prev ? { ...prev, totalDebt: nextDebt, debtNote: `Đã xóa hóa đơn ${transaction.invoiceCode || transaction.receiptCode || transaction.code || transaction.id}; giảm công nợ ${formatCurrency(remaining)}. Có thể hoàn tác tại Lịch sử xóa hóa đơn.` } : prev);
      setSavedContactTransactions(prev => { const next = { ...prev }; delete next[transaction.id]; return next; });
      showToast('Đã xóa hóa đơn; ghi chú đã cập nhật và có thể hoàn tác. Tồn kho không thay đổi.');
    } catch (err) { showToast('Không thể xóa giao dịch: ' + (err?.message || 'Lỗi không xác định'), 'error'); }
    finally { setSavingDebtPayment(false); }
  };

  const handleDeleteSelectedTransactions = async () => {
    if (!selectedTransactionIds.length || savingDebtPayment || !detailTarget?.id) return;
    const chosen = (detailData?.list || []).filter(transaction => selectedTransactionIds.includes(transaction.id));
    if (!chosen.length) { setSelectedTransactionIds([]); return; }
    if (!window.confirm(`Bạn sắp xóa ${chosen.length} giao dịch khỏi lịch sử. Hệ thống sẽ lưu bản sao từng hóa đơn để có thể hoàn tác; tồn kho không thay đổi. Tiếp tục?`)) return;
    setSavingDebtPayment(true);
    try {
      const batch = writeBatch(db);
      let debtReduction = 0;
      const nowIso = new Date().toISOString();
      const collectionName = isCus ? 'orders' : 'imports';
      for (const transaction of chosen) {
        const remaining = getOrderRemainingDebt(transaction);
        debtReduction += remaining;
        const code = transaction.invoiceCode || transaction.receiptCode || transaction.code || transaction.id;
        batch.set(doc(db, 'stores', storeId, type, detailTarget.id, 'deletedTransactions', transaction.id), {
          transactionId: transaction.id,
          transactionCode: code,
          transactionData: { ...transaction },
          collectionName,
          deletedAt: nowIso,
          deletedBy: userData.email || userData.username || 'user',
          debtRemoved: remaining,
          status: 'deleted',
          deleteNote: `Đã xóa hóa đơn ${code}; giảm công nợ ${formatCurrency(remaining)}`
        }, { merge: true });
        batch.delete(doc(db, 'stores', storeId, collectionName, transaction.id));
      }
      const nextDebt = Math.max(0, (Number(detailTarget.totalDebt) || 0) - debtReduction);
      batch.set(doc(db, 'stores', storeId, type, detailTarget.id), {
        totalDebt: nextDebt,
        debtUpdatedAt: nowIso,
        debtNote: `Đã xóa ${chosen.length} hóa đơn; giảm công nợ ${formatCurrency(debtReduction)}. Có thể hoàn tác từng hóa đơn tại Lịch sử xóa hóa đơn.`,
        ...(detailTarget.name ? { name: detailTarget.name } : {}),
        ...(detailTarget.code ? { code: detailTarget.code } : {}),
        ...(detailTarget.phone ? { phone: detailTarget.phone } : {}),
        ...(detailTarget.address ? { address: detailTarget.address } : {})
      }, { merge: true });
      await batch.commit();
      const ids = new Set(chosen.map(row => row.id));
      setSavedContactTransactions(prev => { const next = { ...prev }; ids.forEach(id => delete next[id]); return next; });
      setSelectedTransactionIds([]);
      setDetailTarget(prev => prev ? { ...prev, totalDebt: nextDebt, debtNote: `Đã xóa ${chosen.length} hóa đơn; giảm công nợ ${formatCurrency(debtReduction)}. Có thể hoàn tác từng hóa đơn tại Lịch sử xóa hóa đơn.` } : prev);
      showToast(`Đã xóa ${chosen.length} hóa đơn; ghi chú đã cập nhật và có thể hoàn tác. Tồn kho giữ nguyên.`);
    } catch (err) {
      showToast(`Không thể xóa giao dịch: ${err?.message || 'Lỗi không xác định'}`, 'error');
    } finally { setSavingDebtPayment(false); }
  };

  const handleDebtPaymentSave = async (e) => {
    e.preventDefault();
    if (!detailTarget?.id || savingDebtPayment) {
      if (!detailTarget?.id) showToast('Chưa chọn hồ sơ khách hàng/nhà cung cấp để trừ công nợ.', 'error');
      return;
    }

    // Tính số nợ ngay trong try để mọi lỗi khi đọc/tính dữ liệu đều được báo,
    // kể cả trường hợp tổng nợ trên hồ sơ khác 0 nhưng các đơn/phiếu đều đã PAID.
    setSavingDebtPayment(true);
    try {
      const transactionDebt = getContactTransactionsForDebt().reduce((sum, transaction) => sum + getOrderRemainingDebt(transaction), 0);
      const hasContactDebtBalance = detailTarget.totalDebt !== undefined && detailTarget.totalDebt !== null && detailTarget.totalDebt !== '';
      const contactDebt = Math.max(0, Number(detailTarget.totalDebt) || 0);
      // Số dư trên hồ sơ là nguồn chính thức (đặc biệt sau khi nhập Excel/KiotViet).
      // Chỉ dùng tổng nợ giao dịch cũ khi hồ sơ chưa có trường totalDebt.
      const currentDebt = hasContactDebtBalance ? contactDebt : transactionDebt;
      const oldAmount = editingDebtPayment ? Math.max(0, Number(editingDebtPayment.amount) || 0) : 0;
      const debtBeforeEdit = currentDebt + oldAmount;
      // Khi chọn “Trừ trên tổng nợ”, tất toán theo số dư trên hồ sơ hoặc
      // số dư giao dịch còn mở — không phụ thuộc trạng thái đơn/phiếu cũ.
      const amount = debtPaymentMode === 'all' ? debtBeforeEdit : Number(debtPaymentAmount);
      if (!Number.isFinite(amount) || amount <= 0 || amount > debtBeforeEdit) {
        showToast(`Số tiền trừ công nợ không hợp lệ. Số nợ hiện tại: ${formatCurrency(debtBeforeEdit)}.`, 'error');
        return;
      }

      const now = new Date();
      const nowIso = now.toISOString();
      const selectedPaymentDate = String(debtPaymentDate || getVietnamDateKey(now));
      if (!/^\d{4}-\d{2}-\d{2}$/.test(selectedPaymentDate) || Number.isNaN(new Date(`${selectedPaymentDate}T12:00:00+07:00`).getTime())) {
        showToast('Ngày thanh toán không hợp lệ.', 'error');
        return;
      }
      // Lưu ngày do người dùng chọn theo múi giờ Việt Nam; dùng 12:00 để tránh lệch ngày khi hiển thị.
      const paymentDateIso = new Date(`${selectedPaymentDate}T12:00:00+07:00`).toISOString();
      const paymentDateText = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'short' }).format(new Date(paymentDateIso));
      const userNote = String(debtPaymentNote || '').trim();
      const collectionName = isCus ? 'orders' : 'imports';
      const oldAllocations = Array.isArray(editingDebtPayment?.allocations) ? editingDebtPayment.allocations : [];
      const restoredByTransaction = new Map();
      oldAllocations.forEach((allocation) => {
        restoredByTransaction.set(allocation.transactionId, (restoredByTransaction.get(allocation.transactionId) || 0) + Math.max(0, Number(allocation.amount) || 0));
      });

      // Prepare every transaction update in memory first, then commit all Firestore
      // writes atomically so a quota/permission error cannot leave half a payment saved.
      const sourceTransactions = orders || []; // Parent passes orders for customers and imports for suppliers.
      const transactionsById = new Map(sourceTransactions.map(transaction => [transaction.id, transaction]));
      const transactionUpdates = new Map();
      for (const transactionId of restoredByTransaction.keys()) {
        const transaction = transactionsById.get(transactionId);
        if (!transaction) continue;
        const total = Math.max(0, Number(transaction.total) || 0);
        const restoredRemaining = Math.min(total, getOrderRemainingDebt(transaction) + restoredByTransaction.get(transactionId));
        transactionUpdates.set(transactionId, { transaction, total, remaining: restoredRemaining, note: transaction.debtPaymentNote || '' });
      }

      const debtTransactionMap = new Map((getContactTransactionsForDebt() || []).map(transaction => [transaction.id, transaction]));
      // Include transactions restored by an edited payment even if their current
      // remaining debt is zero; they may need to be allocated again in this save.
      for (const transactionId of restoredByTransaction.keys()) {
        const transaction = transactionsById.get(transactionId);
        if (transaction) debtTransactionMap.set(transactionId, transaction);
      }

      // Some legacy/imported rows remain in the UI state even though their
      // Firestore document no longer exists (or their ID came from an import).
      // Verify documents before building batch.update operations so one stale
      // reference cannot cancel the entire customer/supplier payment.
      const verifiedDebtTransactionMap = new Map();
      const missingTransactionIds = new Set();
      for (const [transactionId, transaction] of debtTransactionMap) {
        try {
          const transactionRef = doc(db, 'stores', storeId, collectionName, transactionId);
          const transactionSnapshot = await getDoc(transactionRef);
          if (transactionSnapshot.exists()) {
            verifiedDebtTransactionMap.set(transactionId, { ...transaction, ...transactionSnapshot.data(), id: transactionId });
          } else {
            missingTransactionIds.add(transactionId);
            transactionUpdates.delete(transactionId);
          }
        } catch (readError) {
          throw new Error(`Không kiểm tra được ${isCus ? 'đơn hàng' : 'phiếu nhập'} ${transactionId}: ${readError?.message || 'lỗi đọc dữ liệu'}`);
        }
      }
      // Only allocate money to transaction documents that really exist. Any
      // remaining amount is still recorded against the contact's total debt.
      const debtTransactions = Array.from(verifiedDebtTransactionMap.values()).map(transaction => {
        const existing = transactionUpdates.get(transaction.id);
        const total = Math.max(0, Number(transaction.total ?? transaction.totalAmount ?? transaction.grandTotal) || 0);
        const remaining = existing ? existing.remaining : getOrderRemainingDebt(transaction);
        return { ...transaction, total, _baseRemaining: Math.min(total, remaining) };
      }).filter(transaction => transaction._baseRemaining > 0)
        .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));

      const allocations = [];
      let amountToAllocate = amount;
      const selectedInvoiceSet = new Set(selectedDebtInvoiceIds || []);
      // Có chọn hóa đơn thì chỉ phân bổ vào các hóa đơn đã chọn. Không chọn thì
      // phân bổ theo thứ tự cũ nhất; chế độ tổng nợ phân bổ qua các hóa đơn còn nợ.
      const allocationCandidates = debtTransactions.filter(transaction => selectedInvoiceSet.size === 0 || selectedInvoiceSet.has(transaction.id));
      for (const transaction of allocationCandidates) {
        if (amountToAllocate <= 0) break;
        const remaining = Math.max(0, Number(transaction._baseRemaining) || 0);
        const applied = Math.min(remaining, amountToAllocate);
        if (applied <= 0) continue;
        const nextRemaining = Math.max(0, remaining - applied);
        const transactionCode = transaction.invoiceCode || transaction.receiptCode || transaction.code || transaction.id;
        const allocationNote = `Đã trừ ${formatCurrency(applied)} vào ${isCus ? 'đơn hàng' : 'phiếu nhập'} ${transactionCode} ngày ${paymentDateText}${userNote ? `; Ghi chú: ${userNote}` : ''}`;
        transactionUpdates.set(transaction.id, { transaction, total: transaction.total, remaining: nextRemaining, note: allocationNote });
        allocations.push({ transactionId: transaction.id, transactionCode, transactionDate: transaction.date || '', amount: applied, note: allocationNote });
        amountToAllocate = Math.max(0, amountToAllocate - applied);
      }
      const outsideDebtNote = amountToAllocate > 0
        ? `; Phần công nợ không phân bổ vào hóa đơn đã chọn ${formatCurrency(amountToAllocate)} vẫn được trừ vào tổng công nợ`
        : '';
      const allocationSummary = allocations.length
        ? `; Đã phân bổ: ${allocations.map(a => `${a.transactionCode}: ${formatCurrency(a.amount)}`).join('; ')}`
        : '';
      const note = `${userNote || (debtPaymentMode === 'all' ? 'Trừ tổng nợ' : 'Trừ công nợ theo giao dịch cũ nhất')} ${formatCurrency(amount)} ngày ${paymentDateText}${allocationSummary}${outsideDebtNote}`;
      const paymentPayload = {
        amount,
        method: debtPaymentMethod,
        mode: debtPaymentMode,
        note,
        userNote,
        allocations,
        date: paymentDateIso,
        updatedAt: nowIso,
        contactId: detailTarget.id,
        contactName: detailTarget.name,
        contactType: type
      };

      const paymentRef = editingDebtPayment?.id
        ? doc(db, 'stores', storeId, type, detailTarget.id, 'debtPayments', editingDebtPayment.id)
        : doc(collection(db, 'stores', storeId, type, detailTarget.id, 'debtPayments'));
      const paymentId = paymentRef.id;
      const reportId = `${type}_${detailTarget.id}_${paymentId}`;
      const reportRef = doc(db, 'stores', storeId, 'debtPaymentReports', reportId);
      const contactRef = doc(db, 'stores', storeId, type, detailTarget.id);
      const remainingDebt = Math.max(0, debtBeforeEdit - amount);
      const batch = writeBatch(db);

      if (transactionUpdates.size > 495) {
        throw new Error('Giao dịch liên quan quá nhiều đơn/phiếu để lưu an toàn cùng lúc. Vui lòng liên hệ quản trị viên; chưa có thay đổi nào được ghi.');
      }
      for (const [transactionId, update] of transactionUpdates) {
        batch.update(doc(db, 'stores', storeId, collectionName, transactionId), {
          remainingDebt: update.remaining,
          paidAmount: Math.max(0, update.total - update.remaining),
          status: update.remaining > 0 ? 'DEBT' : 'PAID',
          debtUpdatedAt: nowIso,
          lastPaymentAt: paymentDateIso,
          paidAt: update.remaining === 0 ? paymentDateIso : null,
          debtPaymentNote: update.note
        });
      }
      batch.set(paymentRef, { ...paymentPayload, ...(editingDebtPayment?.id ? {} : { createdAt: nowIso }) }, { merge: true });
      batch.set(reportRef, {
        ...paymentPayload,
        id: reportId,
        sourcePaymentId: paymentId,
        source: 'contactDebt',
        direction: type === 'customers' ? 'Khách hàng trả nợ' : 'Trả nợ nhà cung cấp',
        date: paymentPayload.date || nowIso
      }, { merge: true });
      // set(..., merge) để ghi nhận thanh toán theo số dư hồ sơ ngay cả khi
      // một hồ sơ cũ chưa có document tương ứng hoặc không còn đơn/phiếu liên quan.
      batch.set(contactRef, {
        totalDebt: remainingDebt,
        debtNote: note,
        debtUpdatedAt: nowIso,
        ...(detailTarget.name ? { name: detailTarget.name } : {}),
        ...(detailTarget.code ? { code: detailTarget.code } : {}),
        ...(detailTarget.phone ? { phone: detailTarget.phone } : {}),
        ...(detailTarget.address ? { address: detailTarget.address } : {})
      }, { merge: true });
      await batch.commit();

      setDetailTarget(prev => prev ? { ...prev, totalDebt: remainingDebt } : prev);
      setDebtPaymentAmount('');
      setDebtPaymentDate(getVietnamDateKey(new Date()));
      setDebtPaymentMode('partial');
      setDebtPaymentMethod('cash');
      setDebtPaymentNote('');
      setSelectedDebtInvoiceIds([]);
      setEditingDebtPayment(null);
      showToast(editingDebtPayment ? 'Đã cập nhật giao dịch công nợ' : 'Đã ghi nhận trừ công nợ');
    } catch (err) {
      const code = err?.code ? ` (${err.code})` : '';
      const rawMessage = err?.message || 'Lỗi không xác định';
      const message = err?.code === 'permission-denied'
        ? 'Không đủ quyền ghi dữ liệu. Kiểm tra đăng nhập và Firestore Rules.'
        : err?.code === 'resource-exhausted'
          ? 'Firestore đã vượt hạn mức đọc/ghi hiện tại. Chưa ghi nhận thanh toán; thử lại khi hạn mức được khôi phục.'
          : err?.code === 'not-found'
            ? 'Không tìm thấy hồ sơ khách hàng/nhà cung cấp trên Firestore. Hãy tải lại danh sách và mở lại hồ sơ; giao dịch chưa được ghi nhận.'
            : rawMessage;
      showToast(`Không thể lưu giao dịch công nợ${code}: ${message}`, 'error');
    } finally {
      setSavingDebtPayment(false);
    }
  };

  const getOrderRemainingDebt = (ord) => {
    if (!ord) return 0;
    // Hỗ trợ cả dữ liệu mới và phiếu cũ/Excel có tên trường tổng tiền khác nhau.
    const rawTotal = ord.total ?? ord.totalAmount ?? ord.grandTotal ?? ord.amount ?? ord.finalTotal;
    const total = Math.max(0, Number(rawTotal) || 0);
    const hasRemainingDebt = ord.remainingDebt !== undefined && ord.remainingDebt !== null && ord.remainingDebt !== '' && Number.isFinite(Number(ord.remainingDebt));
    if (hasRemainingDebt) return Math.max(0, Math.min(total > 0 ? total : Number(ord.remainingDebt), Number(ord.remainingDebt)));
    const status = String(ord.status || '').trim().toLocaleUpperCase('vi');
    const isDebt = ['DEBT', 'UNPAID', 'NỢ', 'NO', 'CHƯA THANH TOÁN', 'CHUA THANH TOAN'].includes(status);
    if (!isDebt) return 0;
    const paid = Math.max(0, Number(ord.paidAmount ?? ord.amountPaid ?? ord.paid ?? 0) || 0);
    return Math.max(0, total - paid);
  };

  const updateTransactionDebt = async (ord, nextRemainingDebt, successMessage) => {
    if (!ord?.id || savingDebtPayment) return;
    const total = Math.max(0, Number(ord.total) || 0);
    const nextRemaining = Math.max(0, Math.min(total, Number(nextRemainingDebt) || 0));
    const oldRemaining = getOrderRemainingDebt(ord);
    const delta = nextRemaining - oldRemaining;
    const collectionName = isCus ? 'orders' : 'imports';
    setSavingDebtPayment(true);
    try {
      const batch = writeBatch(db);
      const autoDebtNote = `${successMessage || 'Cập nhật công nợ'}: ${formatCurrency(Math.abs(delta))}; ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`;
      // Một số giao dịch cũ vẫn hiện trong danh sách nhưng tài liệu Firestore đã bị xóa/mất.
      // Dùng set + merge để có thể lưu trạng thái lại từ bản ghi đang hiển thị, thay vì
      // updateDoc/batch.update gây lỗi 'No document to update'. Không cập nhật tồn kho.
      const transactionRef = doc(db, 'stores', storeId, collectionName, ord.id);
      const transactionSnap = await getDoc(transactionRef);
      if (transactionSnap.exists()) {
        batch.set(transactionRef, {
          remainingDebt: nextRemaining,
          paidAmount: Math.max(0, total - nextRemaining),
          status: nextRemaining > 0 ? 'DEBT' : 'PAID',
          debtUpdatedAt: new Date().toISOString(),
          lastPaymentAt: delta < 0 ? new Date().toISOString() : (ord.lastPaymentAt || ord.paidAt || null),
          paidAt: nextRemaining === 0 && oldRemaining > 0 ? new Date().toISOString() : (ord.paidAt || null),
          debtPaymentNote: autoDebtNote
        }, { merge: true });
      } else {
        // Giao dịch không còn trong Firestore: không tạo lại để tránh sinh đơn trùng.
        // Chỉ điều chỉnh số dư trên hồ sơ và ghi chú lịch sử điều chỉnh.
        await addDoc(collection(db, 'stores', storeId, type, detailTarget.id, 'debtAdjustments'), {
          field: 'totalDebt', label: 'Điều chỉnh công nợ do giao dịch thiếu',
          oldValue: Math.max(0, Number(detailTarget.totalDebt) || 0),
          newValue: Math.max(0, (Number(detailTarget.totalDebt) || 0) + delta),
          note: `${autoDebtNote}. Không tìm thấy giao dịch ${ord.id}; không tạo lại đơn/phiếu nhập.`,
          transactionId: ord.id, date: new Date().toISOString()
        });
      }
      if (delta !== 0) batch.set(doc(db, 'stores', storeId, type, detailTarget.id), {
        totalDebt: Math.max(0, (Number(detailTarget.totalDebt) || 0) + delta),
        ...(detailTarget.name ? { name: detailTarget.name } : {}),
        ...(detailTarget.code ? { code: detailTarget.code } : {}),
        ...(detailTarget.phone ? { phone: detailTarget.phone } : {}),
        ...(detailTarget.address ? { address: detailTarget.address } : {})
      }, { merge: true });
      await batch.commit();
      if (nextRemaining < oldRemaining) { const paidAmount = oldRemaining - nextRemaining; await addDoc(collection(db, 'stores', storeId, 'debtPaymentReports'), { contactId: detailTarget.id, contactName: detailTarget.name, contactType: type, direction: isCus ? 'Khách hàng trả nợ' : 'Trả nợ nhà cung cấp', amount: paidAmount, date: new Date().toISOString(), method: 'transaction', source: 'transactionDebt', transactionId: ord.id, transactionCode: ord.invoiceCode || ord.receiptCode || ord.code || ord.id, note: autoDebtNote, createdAt: new Date().toISOString() }); }
      setDetailTarget(prev => prev ? { ...prev, totalDebt: Math.max(0, (Number(prev.totalDebt) || 0) + delta) } : prev);
      showToast(successMessage || 'Đã cập nhật công nợ');
    } catch (err) {
      showToast('Không thể cập nhật công nợ: ' + (err?.message || ''), 'error');
    } finally { setSavingDebtPayment(false); }
  };

  const handlePartialTransactionPayment = async (ord) => {
    const remaining = getOrderRemainingDebt(ord);
    if (remaining <= 0) { showToast('Giao dịch này đã thanh toán đủ'); return; }
    const raw = window.prompt(`Còn nợ ${formatCurrency(remaining)}. Nhập số tiền thanh toán lần này (VNĐ):`, String(remaining));
    if (raw === null) return;
    const amount = Number(String(raw).replace(/[,\s]/g, ''));
    if (!Number.isFinite(amount) || amount <= 0 || amount > remaining) { showToast('Số tiền thanh toán không hợp lệ', 'error'); return; }
    await updateTransactionDebt(ord, remaining - amount, amount >= remaining ? 'Đã thanh toán hết giao dịch' : 'Đã ghi nhận thanh toán một phần');
  };

  const handleChangeTransactionStatus = async (ord) => {
    const remaining = getOrderRemainingDebt(ord);
    const currentlyDebt = remaining > 0;
    const nextRemaining = currentlyDebt ? 0 : Math.max(0, Number(ord.total) || 0);
    const nextLabel = currentlyDebt ? 'Đã thanh toán' : 'Đang nợ';
    if (!window.confirm(`Đổi trạng thái giao dịch này thành “${nextLabel}”? Công nợ ${isCus ? 'khách hàng' : 'nhà cung cấp'} sẽ được điều chỉnh tương ứng.`)) return;
    await updateTransactionDebt(ord, nextRemaining, `Đã đổi trạng thái thành ${nextLabel}`);
  };

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
      return filterYear === 'ALL' || d.getFullYear().toString() === filterYear;
    });
    const totalDebt = data.reduce((s, i) => s + (Number(i.totalDebt) || 0), 0);
    const totalTraded = filteredOrders.reduce((s, o) => s + (Number(o.total) || 0), 0);
    const totalPaid = filteredOrders.filter(o => o.status === 'PAID').reduce((s, o) => s + (Number(o.total) || 0), 0);
    return { totalDebt, totalTraded, totalPaid, balance: totalTraded - totalPaid };
  }, [data, orders, filterYear]);

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
    // Ưu tiên liên kết bằng ID; nếu dữ liệu đơn cũ không cùng ID (hoặc thiếu ID),
    // dùng tên khách hàng/nhà cung cấp để không làm popup chi tiết bị trống.
    const idField = isCus ? 'customerId' : 'supplierId';
    const nameField = isCus ? 'customerName' : 'supplierName';
    const sameName = value => String(value || '').trim().toLocaleLowerCase('vi') === String(detailTarget.name || '').trim().toLocaleLowerCase('vi');
    const mappedOrders = (orders || []).map(o => savedContactTransactions[o.id] || savedContactTransactions[o.recoveredFromTransactionId] || o);
    // Gộp chứng từ gốc và chứng từ thay thế để không cộng đôi tổng tiền/công nợ.
    const byOriginalTransaction = new Map();
    mappedOrders.forEach(order => {
      const rootId = String(order.recoveredFromTransactionId || order.id || '');
      const previous = byOriginalTransaction.get(rootId);
      if (!previous || order.recoveredFromTransactionId || String(order.id) !== rootId) byOriginalTransaction.set(rootId, order);
    });
    const allOrders = Array.from(byOriginalTransaction.values());
    const idMatches = detailTarget.id ? allOrders.filter(o => o[idField] && o[idField] === detailTarget.id) : [];
    const baseMatches = idMatches.length
      ? idMatches
      : allOrders.filter(o => sameName(o[nameField]));
    const matched = baseMatches.filter(o => {
      const d = new Date(o.date);
      const validDate = !Number.isNaN(d.getTime());
      const matchTime = validDate && (filterYear === 'ALL' || d.getFullYear().toString() === filterYear);
      return matchTime;
    }).sort((a,b) => new Date(b.date) - new Date(a.date));
    // Giữ nguyên tập giao dịch gốc để tính tổng tiền/đã thanh toán; chỉ ẩn khỏi
    // bảng chi tiết các giao dịch không có tên sản phẩm thực tế (dòng trống).
    // Không xóa document Firebase và không đụng đến tồn kho/công nợ.
    const hasVisibleProductDetail = order => {
      const items = Array.isArray(order.items) ? order.items : [];
      return items.some(item => {
        const name = String(item?.name || item?.productName || item?.product || item?.code || item?.productCode || '').trim();
        return Boolean(name);
      });
    };
    const visibleMatched = matched.filter(hasVisibleProductDetail);
    let totalAmount = detailTarget.manualTotalAmount !== undefined
      ? Math.max(0, Number(detailTarget.manualTotalAmount) || 0)
      : matched.reduce((s, o) => s + (Number(o.total) || 0), 0);
    let totalPaid = detailTarget.manualTotalPaid !== undefined
      ? Math.max(0, Number(detailTarget.manualTotalPaid) || 0)
      : matched.reduce((s, o) => s + (Number(o.paidAmount) || (o.status === 'PAID' ? (Number(o.total) || 0) : 0)), 0);
    // Công nợ hiển thị theo số dư hồ sơ đã xác nhận, không cộng lại giao dịch cũ.
    let totalDebtRemain = Math.max(0, Number(detailTarget.totalDebt) || 0);
    return { list: visibleMatched, totalAmount, totalPaid, totalDebtRemain };
  }, [detailTarget, orders, filterYear, isCus, savedContactTransactions]);
  const detailPageList = detailRowsPerPage === 'all' ? detailData.list : detailData.list.slice((detailCurrentPage - 1) * Number(detailRowsPerPage), detailCurrentPage * Number(detailRowsPerPage));
  const detailTotalPages = detailRowsPerPage === 'all' ? 1 : Math.max(1, Math.ceil(detailData.list.length / Number(detailRowsPerPage)));

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 bg-gray-50 overflow-hidden h-full">
      {!detailTarget && <>
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
          <select value={filterYear} onChange={e=>setFilterYear(e.target.value)} className="bg-transparent text-sm font-medium outline-none">{Array.from({length: 5}, (_, i) => new Date().getFullYear() - i).map(y => (<option key={y} value={y}>Năm {y}</option>))}</select>
        </div>
      </div>
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-xl mb-3 flex justify-between items-center"><span className="text-xs font-bold text-blue-700">Đã chọn {selectedIds.length} mục</span><button onClick={handleBatchDelete} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1"><Trash2 size={14}/> Xóa đã chọn</button></div>
      )}
      <div className="flex-1 bg-white rounded-xl border shadow-sm overflow-auto flex flex-col justify-between">
        <div className="overflow-auto flex-1">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 sticky top-0 border-b">
              <tr>
                <th className="p-4 w-10"><input type="checkbox" onChange={() => setSelectedIds(selectedIds.length === data.length ? [] : data.map(i=>i.id))} checked={data.length > 0 && selectedIds.length === data.length} className="w-4 h-4"/></th>
                <th className="p-4 font-bold text-gray-600">Tên {title}</th><th className="p-4 font-bold text-gray-600">SĐT</th>
                <th className="p-4 font-bold text-gray-600 cursor-pointer hover:bg-gray-200 flex items-center gap-1 select-none" onClick={() => setSortOrder(p => p === 'none' ? 'desc' : p === 'desc' ? 'asc' : 'none')}> Tổng Nợ {sortOrder !== 'none' && <ArrowUpDown size={14} className={sortOrder==='desc' ? 'text-blue-500' : 'text-green-500'} />} </th>
                <th className="p-4 font-bold text-gray-600 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map(i => {
                const textDebtClass = i.totalDebt > 0 ? (isCus ? 'text-blue-600' : 'text-orange-600') : 'text-gray-400';
                return (
                  <tr key={i.id} className="border-b hover:bg-blue-50/50 cursor-pointer" onClick={() => openEntityInNewTab(type, { id: i.id, name: i.name })}>
                    <td className="p-4" onClick={e=>e.stopPropagation()}><input type="checkbox" checked={selectedIds.includes(i.id)} onChange={() => setSelectedIds(prev => prev.includes(i.id) ? prev.filter(x=>x!==i.id) : [...prev, i.id])} className="w-4 h-4"/></td>
                    <td className="p-4 font-medium text-blue-600 underline">{i.name}</td><td className="p-4 text-gray-600">{i.phone}</td><td className={"p-4 font-bold " + textDebtClass}>{formatCurrency(i.totalDebt)}</td>
                    <td className="p-4 text-right flex justify-end gap-1" onClick={e=>e.stopPropagation()}><button onClick={() => openEntityInNewTab(type, { id: i.id, name: i.name })} title="Xem chi tiết giao dịch" className="text-gray-600 bg-gray-100 p-2 rounded-lg hover:bg-gray-200"><Eye size={16}/></button><button onClick={() => {setForm(i);setIsModalOpen(true);}} className="text-blue-600 bg-blue-50 p-2 rounded-lg hover:bg-blue-100"><Edit size={16}/></button><button onClick={() => handleDelete(i.id)} className="text-blue-600 bg-blue-50 p-2 rounded-lg hover:bg-blue-100"><Trash2 size={16}/></button></td>
                  </tr>
                );
              })}
              {paginatedData.length === 0 && (<tr><td colSpan="5" className="p-8 text-center text-gray-400">Không tìm thấy dữ liệu</td></tr>)}
            </tbody>
          </table>
        </div>
        <div className="border-t shrink-0"><PaginationControls currentPage={currentPage} totalPages={totalPages} rowsPerPage={rowsPerPage} onPageChange={(p) => setCurrentPage(p)} onRowsChange={(r) => { setRowsPerPage(r); setCurrentPage(1); }} totalItems={sortedData.length} /></div>
      </div>
      </>}
      {detailTarget && <div className="flex-1 overflow-y-auto bg-gray-50/50 border rounded-xl p-4 md:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white border rounded-xl p-3"><h2 className="text-xl font-bold text-gray-800">Chi tiết: {detailTarget.name}</h2><div className="flex gap-2"><button type="button" onClick={() => { if (window.history.state?.appPopupNavigation?.tab === type) window.history.back(); else setDetailTarget(null); }} className="border rounded-lg px-3 py-2 text-sm font-semibold">← Lùi</button><button type="button" onClick={() => window.history.forward()} className="border rounded-lg px-3 py-2 text-sm font-semibold">Tiến →</button><button type="button" onClick={() => { setDetailTarget(null); const url = new URL(window.location.href); ['detailTab','detailId','detailName'].forEach(k=>url.searchParams.delete(k)); window.history.replaceState({ ...(window.history.state || {}), appPopupNavigation: { tab: type, entity: null } }, '', url.toString()); }} className="bg-gray-700 text-white rounded-lg px-3 py-2 text-sm font-semibold">Danh sách {isCus ? 'khách hàng' : 'nhà cung cấp'}</button></div></div>
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border">
              <div><p className="text-xs text-gray-500">SĐT:</p><p className="font-bold">{detailTarget.phone || 'Trống'}</p></div>
              <div><p className="text-xs text-gray-500">Tổng Nợ Gốc:</p><p className="font-bold text-blue-600">{formatCurrency(detailTarget.totalDebt)}</p></div>
              <div className="flex items-center gap-2">
                <button onClick={handlePrintDetail} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"><Printer size={14}/> In Phiếu</button>
                <div className="flex items-center gap-1 bg-white p-1 rounded border">
                  <select value={filterYear} onChange={e=>setFilterYear(e.target.value)} className="bg-transparent text-xs outline-none"><option value="ALL">Tất cả năm</option>{Array.from({length: 10}, (_, i) => new Date().getFullYear() - i).map(y => <option key={y} value={y}>{y}</option>)}</select>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-blue-50 p-2.5 rounded-lg border border-blue-100"><p className="text-[10px] text-blue-600 font-bold uppercase">Tổng Giao Dịch</p><p className="text-sm font-bold text-blue-800">{formatCurrency(detailData.totalAmount)}</p>{canEditDetailAmounts && <button type="button" onClick={()=>handleEditDetailStat('totalAmount','Tổng Giao Dịch',detailData.totalAmount)} className="mt-1 text-[10px] text-blue-700 underline">Sửa số tiền</button>}</div>
              <div className="bg-green-50 p-2.5 rounded-lg border border-green-100"><p className="text-[10px] text-green-600 font-bold uppercase">Đã Thanh Toán</p><p className="text-sm font-bold text-green-700">{formatCurrency(detailData.totalPaid)}</p>{canEditDetailAmounts && <button type="button" onClick={()=>handleEditDetailStat('totalPaid','Đã Thanh Toán',detailData.totalPaid)} className="mt-1 text-[10px] text-green-700 underline">Sửa số tiền</button>}</div>
              <div className="bg-orange-50 p-2.5 rounded-lg border border-orange-100"><p className="text-[10px] text-orange-600 font-bold uppercase">Đang Nợ</p><p className="text-sm font-bold text-orange-700">{formatCurrency(detailData.totalDebtRemain)}</p>{canEditDetailAmounts && <button type="button" onClick={()=>handleEditDetailStat('totalDebt','Đang Nợ',detailData.totalDebtRemain)} className="mt-1 text-[10px] text-orange-700 underline">Sửa số tiền</button>}</div>
            </div>
            {(detailTarget.debtNote || detailTarget.lastManualAdjustmentNote) && <div className="rounded-lg border bg-amber-50 p-3 text-xs text-gray-700"><span className="font-bold">Ghi chú cập nhật công nợ/số tiền:</span> {detailTarget.lastManualAdjustmentNote || detailTarget.debtNote}</div>}
            {deletedContactTransactions.length > 0 && <section className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-2"><div className="font-bold text-sm text-red-800">Lịch sử xóa hóa đơn (có thể hoàn tác)</div><div className="space-y-2 max-h-56 overflow-y-auto">{deletedContactTransactions.map(record => <div key={record.id} className="flex flex-wrap items-center justify-between gap-2 rounded border bg-white p-2 text-xs"><div className="min-w-0 flex-1"><div className="font-semibold">{record.deleteNote || `Đã xóa hóa đơn ${record.transactionCode || record.transactionId || record.id}`}</div><div className="text-gray-500">{formatDate(record.deletedAt)} · {record.status === 'restored' ? 'Đã hoàn tác' : `Công nợ đã giảm ${formatCurrency(record.debtRemoved || 0)}`}</div></div>{record.status !== 'restored' && <button type="button" disabled={savingDebtPayment} onClick={() => handleUndoDeletedContactTransaction(record)} className="rounded bg-blue-600 px-3 py-1.5 font-semibold text-white disabled:opacity-50">Hoàn tác</button>}</div>)}</div></section>}
            <section className="border rounded-xl bg-white p-4 space-y-3">
              <div className="flex flex-wrap justify-between items-center gap-2"><h3 className="font-bold text-gray-800">Trừ công nợ</h3><span className="text-sm font-bold text-blue-600">Còn nợ: {formatCurrency(Math.max(0, Number(detailTarget.totalDebt) || 0))}</span></div>
              <form onSubmit={handleDebtPaymentSave} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                <label className="text-xs font-semibold text-gray-600">Cách trừ công nợ<select value={debtPaymentMode} onChange={e=>{setDebtPaymentMode(e.target.value); if(e.target.value==='all') setDebtPaymentAmount('');}} className="mt-1 w-full border rounded-lg p-2 bg-white text-sm"><option value="partial">Trừ từng phần</option><option value="all">Trừ trên tổng nợ</option></select></label>
                <label className="text-xs font-semibold text-gray-600">Số tiền (VNĐ)<input type="number" min="1" step="any" value={debtPaymentMode==='all' ? Math.max(0, Number(detailTarget.totalDebt)||0) : debtPaymentAmount} onChange={e=>setDebtPaymentAmount(e.target.value)} disabled={debtPaymentMode==='all'} required={debtPaymentMode==='partial'} className="mt-1 w-full border rounded-lg p-2 text-sm disabled:bg-gray-100" placeholder="Nhập số tiền" /></label>
                <label className="text-xs font-semibold text-gray-600">Ngày thanh toán<input type="date" value={debtPaymentDate} onChange={e=>setDebtPaymentDate(e.target.value)} required className="mt-1 w-full border rounded-lg p-2 bg-white text-sm" /></label>
                <label className="text-xs font-semibold text-gray-600">Phương thức<select value={debtPaymentMethod} onChange={e=>setDebtPaymentMethod(e.target.value)} className="mt-1 w-full border rounded-lg p-2 bg-white text-sm"><option value="cash">Tiền mặt</option><option value="transfer">Chuyển khoản</option></select></label>
                <label className="text-xs font-semibold text-gray-600 md:col-span-3">Ghi chú giao dịch<textarea value={debtPaymentNote} onChange={e=>setDebtPaymentNote(e.target.value)} rows={2} className="mt-1 w-full border rounded-lg p-2 text-sm" placeholder="Ví dụ: trừ từng phần / trừ tổng nợ, nội dung đối chiếu..." /></label>
                <button type="submit" disabled={savingDebtPayment || (Math.max(0, Number(detailTarget.totalDebt) || 0)<=0 && !editingDebtPayment)} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-lg p-2.5 text-sm">{savingDebtPayment ? 'Đang lưu...' : editingDebtPayment ? 'Lưu chỉnh sửa' : 'Xác nhận trừ nợ'}</button>
              </form>
              <div className="rounded-lg border bg-gray-50 p-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-bold text-gray-700">Chọn hóa đơn/phiếu cần phân bổ thanh toán</p><div className="flex gap-3"><button type="button" onClick={()=>setSelectedDebtInvoiceIds(getContactTransactionsForDebt().map(t=>t.id))} className="text-xs text-blue-700 underline">Chọn tất cả</button><button type="button" onClick={()=>setSelectedDebtInvoiceIds([])} className="text-xs text-gray-600 underline">Bỏ chọn</button></div></div>
                <p className="text-[11px] text-gray-500">Nếu không chọn hóa đơn, khoản trừ sẽ phân bổ theo các hóa đơn còn nợ từ cũ đến mới. Nếu chọn, chỉ phân bổ vào hóa đơn đã chọn.</p>
                <div className="max-h-44 overflow-y-auto space-y-1">
                  {getContactTransactionsForDebt().map(invoice => <label key={invoice.id} className="flex items-start gap-2 rounded border bg-white p-2 text-xs"><input type="checkbox" className="mt-0.5" checked={selectedDebtInvoiceIds.includes(invoice.id)} onChange={e=>setSelectedDebtInvoiceIds(prev=>e.target.checked?[...prev,invoice.id]:prev.filter(id=>id!==invoice.id))}/><span className="flex-1"><span className="font-semibold">{invoice.invoiceCode || invoice.receiptCode || invoice.code || invoice.id}</span><span className="block text-gray-500">{formatDate(invoice.date)} · Còn nợ: {formatCurrency(getOrderRemainingDebt(invoice))}</span></span></label>)}
                  {getContactTransactionsForDebt().length===0 && <p className="text-xs text-gray-400">Không có hóa đơn/phiếu còn nợ để chọn.</p>}
                </div>
              </div>
              {editingDebtPayment && <button type="button" onClick={()=>{setEditingDebtPayment(null);setDebtPaymentAmount('');setDebtPaymentDate(getVietnamDateKey(new Date()));setDebtPaymentMode('partial');setDebtPaymentMethod('cash');setDebtPaymentNote('');setSelectedDebtInvoiceIds([]);}} className="text-xs text-gray-600 underline">Hủy chỉnh sửa</button>}
              {selectedPaymentIds.length > 0 && <div className="flex items-center justify-between gap-2 bg-red-50 border border-red-200 rounded-lg p-2 text-xs"><span>Đã chọn {selectedPaymentIds.length} lần thanh toán</span><button type="button" disabled={savingDebtPayment} onClick={handleDeleteSelectedPayments} className="bg-red-600 text-white rounded px-3 py-1.5 font-bold disabled:opacity-50">Xóa lần thanh toán đã chọn</button></div>}
              <div className="border rounded-lg overflow-x-auto"><table className="w-full text-xs text-left"><thead className="bg-gray-100"><tr><th className="p-2">Chọn</th><th className="p-2">Thời gian thanh toán</th><th className="p-2">Số tiền</th><th className="p-2">Cách trừ</th><th className="p-2">Phương thức</th><th className="p-2">Ghi chú</th><th className="p-2">Thao tác</th></tr></thead><tbody>
                {debtPayments.map(payment => <tr key={payment.id} className="border-t"><td className="p-2"><input type="checkbox" checked={selectedPaymentIds.includes(payment.id)} onChange={e=>setSelectedPaymentIds(prev=>e.target.checked?[...prev,payment.id]:prev.filter(id=>id!==payment.id))} aria-label="Chọn lần thanh toán" /></td><td className="p-2 whitespace-nowrap">{formatDate(payment.date || payment.createdAt)}</td><td className="p-2 font-bold">{formatCurrency(payment.amount)}</td><td className="p-2">{payment.mode==='all'?'Trừ trên tổng nợ':'Trừ từng phần'}</td><td className="p-2">{payment.method==='transfer'?'Chuyển khoản':'Tiền mặt'}</td><td className="p-2 min-w-[180px]">{payment.note || '—'}</td><td className="p-2"><div className="flex flex-wrap gap-2"><button type="button" onClick={()=>{setEditingDebtPayment(payment);setDebtPaymentMode(payment.mode==='all'?'all':'partial');setDebtPaymentAmount(String(payment.amount||''));setDebtPaymentDate(payment.date ? getVietnamDateKey(new Date(payment.date)) : getVietnamDateKey(new Date()));setDebtPaymentMethod(payment.method||'cash');setDebtPaymentNote(payment.userNote ?? payment.note ?? '');setSelectedDebtInvoiceIds((payment.allocations||[]).map(a=>a.transactionId));}} className="text-blue-600 underline font-semibold">Chỉnh sửa</button><button type="button" disabled={savingDebtPayment} onClick={()=>handleUndoDebtPayment(payment)} className="text-red-600 underline font-semibold disabled:opacity-50">Hoàn tác</button></div></td></tr>)}
                {debtPayments.length===0 && <tr><td colSpan="7" className="p-3 text-center text-gray-400">Chưa có giao dịch trừ công nợ</td></tr>}
              </tbody></table></div>
            </section>
            <div>
              <h4 className="font-bold text-sm text-gray-800 mb-2">Chi tiết sản phẩm đã {isCus ? "mua" : "cung cấp"}:</h4>
              <div className="border rounded-xl overflow-hidden">
                {selectedTransactionIds.length > 0 && <div className="flex flex-wrap items-center justify-between gap-2 bg-red-50 border-b border-red-200 p-2 text-xs"><span>Đã chọn {selectedTransactionIds.length} giao dịch</span><button type="button" disabled={savingDebtPayment} onClick={handleDeleteSelectedTransactions} className="bg-red-600 text-white rounded px-3 py-1.5 font-bold disabled:opacity-50">Xóa giao dịch đã chọn</button></div>}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2 border-b bg-gray-50"><span className="text-xs text-gray-500">{detailData.list.length} giao dịch</span><label className="text-xs flex items-center gap-2">Hiển thị <select className="border rounded-lg p-1.5 bg-white" value={detailRowsPerPage} onChange={e=>{setDetailRowsPerPage(e.target.value);setDetailCurrentPage(1);}}><option value="5">5 dòng</option><option value="10">10 dòng</option><option value="20">20 dòng</option><option value="all">Tất cả</option></select></label></div>
                <div className="max-h-80 overflow-auto"><table className="w-full text-xs text-left">
                  <thead className="bg-gray-100 sticky top-0 border-b"><tr><th className="p-2.5">Chọn</th><th className="p-2.5">Thời gian giao dịch</th><th className="p-2.5">Thời gian thanh toán</th><th className="p-2.5">Mặt hàng & Ghi chú/BH</th><th className="p-2.5">Giá nhập</th><th className="p-2.5">Giá bán</th><th className="p-2.5">Giá trị đơn</th><th className="p-2.5">Trạng thái nợ</th></tr></thead>
                  <tbody>
                    {detailPageList.map(ord => {
                      const statusClass = ord.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700';
                      return (
                        <tr key={ord.id} className="border-b hover:bg-gray-50">
                          <td className="p-2.5"><input type="checkbox" checked={selectedTransactionIds.includes(ord.id)} onChange={e=>setSelectedTransactionIds(prev=>e.target.checked?[...prev,ord.id]:prev.filter(id=>id!==ord.id))} aria-label="Chọn giao dịch để xóa" /></td>
                          <td className="p-2.5 whitespace-nowrap">{formatDate(ord.date)}</td>
                          <td className="p-2.5 whitespace-nowrap">{formatDate(ord.lastPaymentAt || ord.paidAt || ord.paymentDate || ord.paidDate || ord.debtUpdatedAt) || '—'}</td>
                          <td className="p-2.5">
                            <ul className="space-y-1.5">
                              {ord.items?.map((it, idx) => {
                                const qty = it.quantity || it.qty || 1; const itemPrice = Number(it.price) || 0; const itemCost = Number(it.importCost ?? it.cost) || 0;
                                return (
                                  <li key={idx} className="bg-gray-50 p-1.5 rounded border border-gray-100">
                                    <div className="font-medium text-gray-800"><span><button type="button" onClick={() => navigateMainTab('products', it.id || it.productId || '', it.name || '')} className="text-blue-700 underline font-bold">{it.name}</button> × {qty}</span></div>
                                    {(it.warrantyValue || it.note) && (<div className="text-[10px] text-gray-500 mt-0.5 flex gap-2">{it.warrantyValue && <span>🛡️ BH: {it.warrantyValue} {it.warrantyUnit}</span>}{it.note && <span>📝 {it.note}</span>}</div>)}
                                  </li>
                                );
                              })}
                            </ul>
                          </td>
                          <td className="p-2.5 align-top">{(ord.items || []).map((it, idx) => <div key={idx} className="mb-1 whitespace-nowrap">{formatCurrency(Number(it.importCost ?? it.cost) || 0)}</div>)}</td>
                          <td className="p-2.5 align-top">{(ord.items || []).map((it, idx) => <div key={idx} className="mb-1 whitespace-nowrap">{formatCurrency(Number(it.price) || 0)}</div>)}</td>
                          <td className="p-2.5 font-bold text-gray-800 align-top">{formatCurrency(ord.total)}</td>
                          <td className="p-2.5 align-top">
                            <div className="flex flex-col items-start gap-1.5">
                              <div className="flex items-center gap-2"><span className={"px-2 py-0.5 rounded text-[10px] font-bold " + (getOrderRemainingDebt(ord) > 0 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700')}>{getOrderRemainingDebt(ord) > 0 ? 'Đang nợ' : 'Đã thanh toán'}</span><button type="button" onClick={() => setViewingContactTransaction(ord)} className="inline-flex items-center gap-1 rounded border border-blue-200 px-2 py-1 text-blue-700 hover:bg-blue-50" title="Xem đơn hàng"><Eye size={14}/><span className="text-[10px]">Xem</span></button></div>
                              {getOrderRemainingDebt(ord) > 0 && <span className="font-semibold text-orange-700">Còn: {formatCurrency(getOrderRemainingDebt(ord))}</span>}
                              <button type="button" disabled={savingDebtPayment || getOrderRemainingDebt(ord) <= 0} onClick={() => handlePartialTransactionPayment(ord)} className="text-blue-700 underline font-semibold disabled:opacity-40">Thanh toán một phần</button>
                              <button type="button" disabled={savingDebtPayment} onClick={() => handleChangeTransactionStatus(ord)} className="text-red-600 underline font-semibold disabled:opacity-40">Sửa trạng thái</button>
                              <button type="button" disabled={savingDebtPayment} onClick={() => { const original = JSON.parse(JSON.stringify(ord)); setEditingContactTransactionOriginal(original); setEditingContactTransaction(JSON.parse(JSON.stringify(ord))); }} className="text-blue-700 underline font-semibold disabled:opacity-40">Sửa đơn hàng</button>
                              <button type="button" disabled={savingDebtPayment} onClick={() => handleDeleteOneContactTransaction(ord)} className="text-red-700 underline font-semibold disabled:opacity-40">Xóa đơn hàng</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {detailData.list.length === 0 && (<tr><td colSpan="8" className="p-4 text-center text-gray-400">Không có phát sinh giao dịch</td></tr>)}
                  </tbody>
                </table></div>
                <div className="flex flex-wrap items-center justify-between gap-2 p-2 border-t bg-gray-50"><span className="text-xs text-gray-500">Trang {detailRowsPerPage === 'all' ? 1 : detailCurrentPage} / {detailTotalPages}</span><div className="flex gap-2"><button type="button" onClick={()=>setDetailCurrentPage(p=>Math.max(1,p-1))} disabled={detailCurrentPage===1 || detailRowsPerPage==='all'} className="border rounded px-3 py-1 text-xs disabled:opacity-40">Lùi</button><button type="button" onClick={()=>setDetailCurrentPage(p=>Math.min(detailTotalPages,p+1))} disabled={detailCurrentPage>=detailTotalPages || detailRowsPerPage==='all'} className="border rounded px-3 py-1 text-xs disabled:opacity-40">Tiến</button></div></div>
              </div>
            </div>
          </div>
        </div>}
      <Modal isOpen={!!viewingContactTransaction} onClose={() => setViewingContactTransaction(null)} title={`Chi tiết ${isCus ? 'đơn hàng' : 'phiếu nhập'} ${viewingContactTransaction?.invoiceCode || viewingContactTransaction?.receiptCode || viewingContactTransaction?.id?.slice(0, 8) || ''}`} maxWidth="max-w-3xl">
        {viewingContactTransaction && <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg border bg-gray-50 p-3"><p className="text-xs text-gray-500">Mã chứng từ</p><p className="font-semibold">{viewingContactTransaction.invoiceCode || viewingContactTransaction.receiptCode || viewingContactTransaction.code || viewingContactTransaction.id || '—'}</p></div>
            <div className="rounded-lg border bg-gray-50 p-3"><p className="text-xs text-gray-500">Thời gian</p><p className="font-semibold">{viewingContactTransaction.date ? formatDate(viewingContactTransaction.date) : '—'}</p></div>
            <div className="rounded-lg border bg-gray-50 p-3"><p className="text-xs text-gray-500">{isCus ? 'Khách hàng' : 'Nhà cung cấp'}</p><p className="font-semibold">{isCus ? (viewingContactTransaction.customerName || detailTarget?.name || '—') : (viewingContactTransaction.supplierName || detailTarget?.name || '—')}</p></div>
            <div className="rounded-lg border bg-gray-50 p-3"><p className="text-xs text-gray-500">Trạng thái</p><p className={`font-semibold ${getOrderRemainingDebt(viewingContactTransaction) > 0 ? 'text-orange-700' : 'text-green-700'}`}>{getOrderRemainingDebt(viewingContactTransaction) > 0 ? `Đang nợ ${formatCurrency(getOrderRemainingDebt(viewingContactTransaction))}` : 'Đã thanh toán'}</p></div>
          </div>
          <div className="overflow-x-auto rounded-xl border"><table className="w-full text-sm"><thead className="bg-gray-100"><tr><th className="p-2 text-left">STT</th><th className="p-2 text-left">Sản phẩm</th><th className="p-2 text-right">Số lượng</th><th className="p-2 text-right">Đơn giá</th><th className="p-2 text-right">Thành tiền</th></tr></thead><tbody>{(viewingContactTransaction.items || []).map((item,i)=>{const qty=Number(item.quantity??item.qty??0)||0;const price=Number(item.price??item.importCost??item.cost??0)||0;return <tr key={item.productId||item.id||i} className="border-t"><td className="p-2">{i+1}</td><td className="p-2">{item.name||item.productName||'Sản phẩm'}{item.note ? <div className="text-xs text-gray-500">{item.note}</div> : null}</td><td className="p-2 text-right">{qty}</td><td className="p-2 text-right whitespace-nowrap">{formatCurrency(price)}</td><td className="p-2 text-right font-semibold whitespace-nowrap">{formatCurrency(qty*price)}</td></tr>})}{!(viewingContactTransaction.items||[]).length&&<tr><td colSpan={5} className="p-4 text-center text-gray-400">Chứng từ không có chi tiết sản phẩm.</td></tr>}</tbody></table></div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3"><div className="text-sm">Đã thanh toán: <strong>{formatCurrency(viewingContactTransaction.paidAmount ?? (Number(viewingContactTransaction.total||viewingContactTransaction.totalAmount||0)-getOrderRemainingDebt(viewingContactTransaction)))}</strong><div className="mt-1 text-lg">Tổng tiền: <strong>{formatCurrency(Number(viewingContactTransaction.total??viewingContactTransaction.totalAmount)||0)}</strong></div></div><div className="flex gap-2"><button type="button" onClick={()=>{const t=viewingContactTransaction;const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const rows=(t.items||[]).map((it,i)=>{const q=Number(it.quantity??it.qty??0)||0;const p=Number(it.price??it.importCost??it.cost??0)||0;return `<tr><td>${i+1}</td><td>${esc(it.name||it.productName||'Sản phẩm')}</td><td style="text-align:right">${q}</td><td style="text-align:right">${p.toLocaleString('vi-VN')} đ</td><td style="text-align:right">${(q*p).toLocaleString('vi-VN')} đ</td></tr>`}).join('');const win=window.open('','_blank','width=900,height=700');if(!win){showToast('Trình duyệt đã chặn cửa sổ in. Hãy cho phép cửa sổ bật lên rồi thử lại.','error');return;}win.document.write(`<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Chi tiết chứng từ</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#111}h1{text-align:center;font-size:20px}table{width:100%;border-collapse:collapse;margin-top:18px}th,td{border:1px solid #777;padding:8px}th{background:#eee}.right{text-align:right}.total{text-align:right;font-size:18px;font-weight:bold;margin-top:18px}@media print{button{display:none}}</style></head><body><h1>${esc(isCus?'CHI TIẾT ĐƠN HÀNG':'CHI TIẾT PHIẾU NHẬP')}</h1><p><b>Mã chứng từ:</b> ${esc(t.invoiceCode||t.receiptCode||t.code||t.id)}</p><p><b>Ngày giờ:</b> ${esc(t.date?formatDate(t.date):'—')}</p><p><b>${esc(isCus?'Khách hàng':'Nhà cung cấp')}:</b> ${esc(isCus?(t.customerName||detailTarget?.name):(t.supplierName||detailTarget?.name))}</p><table><thead><tr><th>STT</th><th>Sản phẩm</th><th>Số lượng</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead><tbody>${rows}</tbody></table><p class="total">Tổng tiền: ${(Number(t.total??t.totalAmount)||0).toLocaleString('vi-VN')} đ</p><p>Đã thanh toán: ${(Number(t.paidAmount??((Number(t.total??t.totalAmount)||0)-getOrderRemainingDebt(t)))||0).toLocaleString('vi-VN')} đ</p><p>Còn nợ: ${getOrderRemainingDebt(t).toLocaleString('vi-VN')} đ</p><p style="margin-top:48px;text-align:right">Ngày in: ${esc(new Date().toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'}))}</p><script>window.onload=()=>window.print()</script></body></html>`);win.document.close();}} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white"><Printer size={16}/> In đơn hàng</button><button type="button" onClick={()=>setViewingContactTransaction(null)} className="rounded-lg border px-4 py-2 text-sm">Đóng</button></div></div>
        </div>}
      </Modal>
      <Modal isOpen={!!editingContactTransaction} onClose={() => { if (!savingDebtPayment) { setEditingContactTransaction(null); setEditingContactTransactionOriginal(null); } }} title={`Sửa ${isCus ? 'đơn hàng' : 'phiếu nhập'}`} maxWidth="max-w-3xl">
        {editingContactTransaction && <form onSubmit={handleSaveContactTransaction} className="space-y-4">
          <p className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg p-3">Tìm và chọn sản phẩm từ danh sách gợi ý. Có thể xóa từng dòng; khi lưu, hệ thống tính lại tổng tiền, công nợ và điều chỉnh tồn kho theo chênh lệch.</p>
          <datalist id={`contact-product-suggestions-${type}`}>{products.map(product => <option key={product.id} value={product.name || ''}>{[product.code, product.stock != null ? `Tồn: ${product.stock}` : ''].filter(Boolean).join(' · ')}</option>)}</datalist>
          <div className="space-y-3 max-h-[55vh] overflow-y-auto">
            {(editingContactTransaction.items || []).map((item, index) => <div key={index} className="border rounded-lg p-3 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div className="sm:col-span-2"><label className="block text-xs font-semibold mb-1">Tên sản phẩm (gõ để xem gợi ý)</label><input required list={`contact-product-suggestions-${type}`} value={item.name || item.productName || ''} onChange={e=>{const value=e.target.value; const matched=products.find(p=>String(p.name||'').toLowerCase()===value.trim().toLowerCase()); setEditingContactTransaction(prev=>({...prev,items:prev.items.map((it,i)=>i===index?{...it,name:value,productId:matched?.id||'',productCode:matched?.code||matched?.productCode||'',code:matched?.code||matched?.productCode||'',cost:matched?Number(matched.cost??matched.importCost??it.cost??0):it.cost}:it)}));}} className="w-full border rounded p-2 text-sm" placeholder="Nhập mã hoặc tên sản phẩm..." /></div>
                <div><label className="block text-xs font-semibold mb-1">Số lượng</label><input required type="number" min="1" value={item.quantity ?? item.qty ?? 1} onChange={e=>setEditingContactTransaction(prev=>({...prev,items:prev.items.map((it,i)=>i===index?{...it,quantity:e.target.value}:it)}))} className="w-full border rounded p-2 text-sm" /></div>
                <div><label className="block text-xs font-semibold mb-1">{isCus ? 'Giá bán' : 'Giá nhập'}</label><input required type="number" min="0" value={item.price ?? item.importCost ?? 0} onChange={e=>setEditingContactTransaction(prev=>({...prev,items:prev.items.map((it,i)=>i===index?{...it,price:e.target.value}:it)}))} className="w-full border rounded p-2 text-sm" /></div>
              </div>
              <div className="flex justify-between items-center gap-2"><span className="text-xs text-gray-500">Thành tiền: {formatCurrency((Number(item.quantity ?? item.qty) || 0) * (Number(item.price ?? item.importCost) || 0))}</span><button type="button" disabled={savingDebtPayment} onClick={()=>setEditingContactTransaction(prev=>({...prev,items:(prev.items||[]).filter((_,i)=>i!==index)}))} className="inline-flex items-center gap-1 text-red-600 border border-red-200 rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-red-50"><Trash2 size={14}/> Xóa sản phẩm</button></div>
            </div>)}
          </div>
          <button type="button" disabled={savingDebtPayment} onClick={()=>setEditingContactTransaction(prev=>({...prev,items:[...(prev.items||[]),{name:'',quantity:1,price:0,cost:0}]}))} className="inline-flex items-center gap-2 border border-blue-200 text-blue-700 rounded-lg px-3 py-2 font-semibold text-sm"><Plus size={16}/> Thêm sản phẩm</button>
          <div className="flex justify-between items-center rounded-lg bg-gray-50 p-3 font-bold"><span>Tổng tiền mới</span><span>{formatCurrency((editingContactTransaction.items||[]).reduce((sum,item)=>sum+(Number(item.quantity??item.qty)||0)*(Number(item.price??item.importCost)||0),0))}</span></div>
          <div className="flex gap-2"><button type="button" disabled={savingDebtPayment} onClick={()=>setEditingContactTransaction(null)} className="flex-1 border rounded-lg p-3">Hủy</button><button type="submit" disabled={savingDebtPayment} className="flex-1 bg-blue-600 text-white rounded-lg p-3 font-bold">{savingDebtPayment?'Đang lưu...':'Lưu thay đổi'}</button></div>
        </form>}
      </Modal>
      <Modal isOpen={!!editDetailStat} onClose={() => { if (!savingDebtPayment) setEditDetailStat(null); }} title={editDetailStat ? `Sửa số tiền: ${editDetailStat.label}` : 'Sửa số tiền'}>
        {editDetailStat && <form onSubmit={handleSaveDetailStat} className="space-y-4">
          <div><label className="block text-sm font-semibold text-gray-700 mb-1">Số tiền mới (VNĐ)</label><input autoFocus type="number" min="0" step="1" inputMode="numeric" required value={editDetailStat.newValue} onChange={e=>setEditDetailStat(v=>({...v,newValue:e.target.value}))} className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nhập số tiền" /></div>
          <div><label className="block text-sm font-semibold text-gray-700 mb-1">Ghi chú lý do điều chỉnh (bắt buộc)</label><textarea required rows={3} value={editDetailStat.note} onChange={e=>setEditDetailStat(v=>({...v,note:e.target.value}))} className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nhập lý do điều chỉnh" /></div>
          <div className="flex gap-2"><button type="button" disabled={savingDebtPayment} onClick={()=>setEditDetailStat(null)} className="flex-1 border rounded-xl p-3 font-semibold disabled:opacity-50">Hủy</button><button type="submit" disabled={savingDebtPayment} className="flex-1 bg-blue-600 text-white rounded-xl p-3 font-bold disabled:opacity-50">{savingDebtPayment ? 'Đang lưu...' : 'Lưu điều chỉnh'}</button></div>
        </form>}
      </Modal>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={form.id ? `Cập nhật ${title}` : `Thêm ${title}`}>
        <form onSubmit={handleSave} className="space-y-4">
          <input required placeholder="Tên *" value={form.name||''} onChange={e=>setForm({...form,name:e.target.value})} className="w-full p-2.5 border rounded-lg outline-none"/>
          <input placeholder="SĐT" value={form.phone||''} onChange={e=>setForm({...form,phone:e.target.value})} className="w-full p-2.5 border rounded-lg outline-none"/>
          <input placeholder="Địa chỉ" value={form.address||''} onChange={e=>setForm({...form,address:e.target.value})} className="w-full p-2.5 border rounded-lg outline-none"/>
          <div><label className="text-xs font-bold text-gray-500">Nợ hiện tại</label><input type="number" placeholder="Nợ hiện tại" value={form.totalDebt||0} onChange={e=>setForm({...form,totalDebt:e.target.value})} className={"w-full p-2.5 border rounded-lg outline-none font-bold " + (isCus ? 'text-blue-600' : 'text-orange-600')}/></div>
          <button className="w-full bg-blue-600 text-white font-bold p-3 rounded-lg">Lưu thông tin</button>
        </form>
      </Modal>
    </div>
  );
}

function GroupManagementView({ products, db, storeId, showToast }) {
  const [groups, setGroups] = useState([]);
  const [groupSearch, setGroupSearch] = useState('');
  const visibleGroups = useMemo(() => {
    const byName = new Map();
    (groups || []).forEach(g => { const name = String(g.name || '').trim(); if (name) byName.set(name.toLocaleLowerCase(), { ...g, name }); });
    (products || []).forEach(p => { const name = String(p.category || '').trim(); if (name && !byName.has(name.toLocaleLowerCase())) byName.set(name.toLocaleLowerCase(), { id: `category-${name.toLocaleLowerCase()}`, name, derivedFromProducts: true }); });
    return [...byName.values()].sort((a,b)=>a.name.localeCompare(b.name, 'vi'));
  }, [groups, products]);
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupProductIds, setGroupProductIds] = useState([]);
  useEffect(() => onSnapshot(collection(db, 'stores', storeId, 'product_groups'), snap => setGroups(snap.docs.map(d => ({ id: d.id, ...d.data() }))), () => showToast('Không tải được danh sách nhóm hàng', 'error')), [db, storeId]);
  const saveGroup = async () => {
    const name = newGroupName.trim();
    if (!name) return showToast('Vui lòng nhập tên nhóm hàng', 'error');
    try {
      if (editingGroup) {
        await updateDoc(doc(db, 'stores', storeId, 'product_groups', editingGroup.id), { name, updatedAt: new Date().toISOString() });
        const batch = writeBatch(db);
        products.filter(p => p.category === editingGroup.name).forEach(p => batch.update(doc(db, 'stores', storeId, 'products', p.id), { category: name }));
        groupProductIds.forEach(id => batch.update(doc(db, 'stores', storeId, 'products', id), { category: name }));
        await batch.commit();
        showToast('Đã cập nhật nhóm hàng và sản phẩm');
      } else {
        await addDoc(collection(db, 'stores', storeId, 'product_groups'), { name, createdAt: new Date().toISOString() });
        if (groupProductIds.length) { const batch = writeBatch(db); groupProductIds.forEach(id => batch.update(doc(db, 'stores', storeId, 'products', id), { category: name })); await batch.commit(); }
        showToast('Đã tạo nhóm hàng và cập nhật sản phẩm');
      }
      setNewGroupName(''); setGroupProductIds([]); setEditingGroup(null);
    } catch (e) { showToast('Lỗi lưu nhóm hàng', 'error'); }
  };
  const deleteGroup = async (g) => {
    if (!window.confirm(`Xóa nhóm hàng "${g.name}"? Sản phẩm trong nhóm sẽ chuyển về chưa phân nhóm.`)) return;
    try { const batch = writeBatch(db); if (!g.derivedFromProducts) batch.delete(doc(db, 'stores', storeId, 'product_groups', g.id)); products.filter(p => String(p.category||'').trim().toLocaleLowerCase() === String(g.name||'').trim().toLocaleLowerCase()).forEach(p => batch.update(doc(db, 'stores', storeId, 'products', p.id), { category: '' })); await batch.commit(); if (editingGroup?.id === g.id) { setEditingGroup(null); setNewGroupName(''); setGroupProductIds([]); } showToast('Đã xóa nhóm hàng'); } catch(e) { showToast('Lỗi xóa nhóm hàng', 'error'); }
  };
  return <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50/50 space-y-5">
    <div><h2 className="text-2xl font-bold text-gray-800">Quản lý nhóm hàng</h2><p className="text-sm text-gray-500 mt-1">Tạo nhóm và chọn sản phẩm để đưa vào nhóm.</p></div>
    <section className="bg-white rounded-2xl border border-blue-100 shadow-md p-5 space-y-4">
      <h3 className="font-bold text-gray-800">{editingGroup ? `Chỉnh sửa nhóm hàng: ${editingGroup.name}` : 'Tạo nhóm hàng mới'}</h3>
      <div className="flex flex-col sm:flex-row gap-2"><input value={newGroupName} onChange={e=>setNewGroupName(e.target.value)} placeholder="Tên nhóm hàng mới" className="flex-1 border rounded-lg p-2.5"/><button type="button" onClick={saveGroup} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold">{editingGroup ? 'Lưu chỉnh sửa' : 'Tạo nhóm'}</button>{editingGroup && <button type="button" onClick={()=>{setEditingGroup(null);setNewGroupName('');setGroupProductIds([]);}} className="border px-4 py-2.5 rounded-lg font-bold">Hủy</button>}</div>
      <p className="text-sm text-gray-500">Chọn sản phẩm bên dưới trước khi bấm “Tạo nhóm”. Sản phẩm đã chọn sẽ được cập nhật nhóm tương ứng.</p>
      <div className="max-h-80 overflow-y-auto border rounded-xl divide-y">{products.map(p=><label key={p.id} className="flex items-center gap-3 p-3 hover:bg-gray-50"><input type="checkbox" checked={groupProductIds.includes(p.id)} onChange={e=>setGroupProductIds(v=>e.target.checked?[...v,p.id]:v.filter(id=>id!==p.id))} className="w-4 h-4"/><span className="flex-1 font-medium">{p.name}</span><span className="text-xs text-gray-500">{p.category||'Chưa phân nhóm'}</span></label>)}{products.length===0&&<p className="p-5 text-center text-gray-400">Chưa có sản phẩm trong kho.</p>}</div>
    </section>
    <section className="bg-white rounded-2xl border border-blue-100 shadow-md p-5"><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3"><h3 className="font-bold text-gray-800">Nhóm hàng hiện có ({visibleGroups.length})</h3><div className="relative w-full sm:w-72"><Search size={16} className="absolute left-3 top-3 text-gray-400"/><input value={groupSearch} onChange={e=>setGroupSearch(e.target.value)} placeholder="Tìm nhóm hàng..." className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"/></div></div>{visibleGroups.length ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{visibleGroups.map(g=><div key={g.id} className="p-4 border rounded-xl"><p className="font-bold text-gray-800">{g.name}</p><p className="text-sm text-gray-500 mt-1">{products.filter(p=>String(p.category||'').trim().toLocaleLowerCase()===String(g.name||'').trim().toLocaleLowerCase()).length} sản phẩm</p><div className="flex gap-2 mt-3"><button type="button" onClick={()=>{setEditingGroup(g.derivedFromProducts ? null : g);setNewGroupName(g.name);setGroupProductIds(products.filter(p=>String(p.category||'').trim().toLocaleLowerCase()===String(g.name||'').trim().toLocaleLowerCase()).map(p=>p.id));}} className="text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"><Edit size={14}/> Sửa</button><button type="button" onClick={()=>deleteGroup(g)} className="text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"><Trash2 size={14}/> Xóa</button></div></div>)}</div> : <p className="text-sm text-gray-500">Chưa có nhóm hàng.</p>}</section>
  </div>;
}

function InventoryView({ products, orders, imports, warrantyRequests = [], customers = [], suppliers = [], navigationTarget, storeConfig, db, storeId, showToast }) {
  const [groups, setGroups] = useState([]);
  useEffect(() => onSnapshot(collection(db, 'stores', storeId, 'product_groups'), snap => setGroups(snap.docs.map(d => ({ id: d.id, ...d.data() })))), [db, storeId]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', category: '', price: '', cost: '', stock: '' });
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ field: null, direction: 'none' });
  const [detailProduct, setDetailProduct] = useState(null);
  const [productImportYear, setProductImportYear] = useState(String(getVietnamDateParts(new Date()).year));
  useEffect(() => {
    const onNavigate = (event) => {
      const detail = event?.detail || {};
      if (detail.tab !== 'products') return;
      if (!detail.entity) { setDetailProduct(null); return; }
      const target = detail.entity;
      const match = (products || []).find(row => (target.id && row.id === target.id) || (target.name && String(row.name || '').trim().toLowerCase() === String(target.name).trim().toLowerCase()));
      if (match) { setSearchTerm(''); setInvCurrentPage(1); setDetailProduct(match); setProductImportYear(String(getVietnamDateParts(new Date()).year)); setShowAllDetailSales(true); }
    };
    const onCloseProductPage = () => setDetailProduct(null);
    window.addEventListener('app:navigate-tab', onNavigate);
    window.addEventListener('app:close-popups', onCloseProductPage);
    return () => { window.removeEventListener('app:navigate-tab', onNavigate); window.removeEventListener('app:close-popups', onCloseProductPage); };
  }, [products]);
  useEffect(() => {
    if (navigationTarget?.tab !== 'products' || !(navigationTarget.id || navigationTarget.name)) return;
    const match = (products || []).find(row => navigationTarget.id && row.id === navigationTarget.id) || (products || []).find(row => navigationTarget.name && String(row.name || '').trim().toLocaleLowerCase('vi') === navigationTarget.name.trim().toLocaleLowerCase('vi'));
    if (match) { setSearchTerm(''); setInvCurrentPage(1); setDetailProduct(match); setProductImportYear(String(getVietnamDateParts(new Date()).year)); setShowAllDetailSales(true); }
  }, [navigationTarget?.nonce, navigationTarget?.tab, navigationTarget?.id, navigationTarget?.name, products]);
  const [showAllDetailSales, setShowAllDetailSales] = useState(false);
  const [productSalesRows, setProductSalesRows] = useState('5');
  const [productSalesPage, setProductSalesPage] = useState(1);
  const [productImportRows, setProductImportRows] = useState('5');
  const [productImportPage, setProductImportPage] = useState(1);
  const openProductHistory = (product) => {
    openEntityInNewTab('products', { id: product.id, name: product.name });
  };
  const currentDate = new Date();
  const currentVietnamDate = getVietnamDateParts(currentDate);
  const [filterMonth, setFilterMonth] = useState(currentVietnamDate.month.toString());
  const [filterYear, setFilterYear] = useState(currentVietnamDate.year.toString());
  const [invRowsPerPage, setInvRowsPerPage] = useState('10');
  const [invCurrentPage, setInvCurrentPage] = useState(1);
  const [showInventoryColumns, setShowInventoryColumns] = useState(false);
  const [inventoryColumns, setInventoryColumns] = useState({ time: true, category: true, cost: true, price: true, stock: true });
  const [stockTotalPeriod, setStockTotalPeriod] = useState('month');
  const [stockTotalMonth, setStockTotalMonth] = useState(String(getVietnamDateParts(new Date()).month));
  const [stockTotalYear, setStockTotalYear] = useState(String(getVietnamDateParts(new Date()).year));
  const [stockTotalDay, setStockTotalDay] = useState(getVietnamDateKey(new Date()));

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

  const stockImportTotals = useMemo(() => {
    const rows = (imports || []).filter(im => {
      if (!im.date) return false;
      const d = getVietnamDateParts(new Date(im.date));
      if (stockTotalPeriod === 'day') return getVietnamDateKey(new Date(im.date)) === stockTotalDay;
      if (stockTotalPeriod === 'year') return String(d.year) === stockTotalYear;
      return String(d.month) === stockTotalMonth && String(d.year) === stockTotalYear;
    });
    return { count: rows.length, amount: rows.reduce((sum, im) => sum + (Number(im.total) || 0), 0) };
  }, [imports, stockTotalPeriod, stockTotalDay, stockTotalMonth, stockTotalYear]);

  const handleSort = (field) => {
    setSortConfig(prev => ({
      field,
      // Bấm lần đầu sắp xếp từ cao xuống thấp; bấm lại đảo chiều, không tắt sắp xếp.
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const filteredProducts = useMemo(() => {
    let list = products.filter(p => p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (sortConfig.field && sortConfig.direction !== 'none') {
      list.sort((a, b) => {
        let aVal = a[sortConfig.field] ?? 0; let bVal = b[sortConfig.field] ?? 0;
        if (sortConfig.field === 'name' || sortConfig.field === 'category') {
          aVal = String(aVal || '').toLowerCase(); bVal = String(bVal || '').toLowerCase();
          if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
          if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
        }
        if (sortConfig.field === 'createdAt') {
          const at = new Date(aVal || 0).getTime() || 0; const bt = new Date(bVal || 0).getTime() || 0;
          return sortConfig.direction === 'asc' ? at - bt : bt - at;
        }
        const an = Number(aVal) || 0; const bn = Number(bVal) || 0;
        return sortConfig.direction === 'asc' ? an - bn : bn - an;
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
    const norm = value => String(value || '').trim().toLocaleLowerCase('vi');
    const isThisProduct = item => {
      const itemId = item?.id || item?.productId || item?.product_id || '';
      return (itemId && itemId === detailProduct.id) || norm(item?.name) === norm(detailProduct.name);
    };
    const matchTime = dateStr => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return !Number.isNaN(d.getTime()) && getVietnamDateParts(d).year.toString() === filterYear;
    };
    const orderSales = (orders || []).filter(o => matchTime(o.date)).flatMap(o => (o.items || []).filter(isThisProduct).map(it => ({
      ...it, date: o.date, status: o.status, customerName: o.customerName || 'Khách lẻ', customerId: o.customerId || '', source: 'order'
    })));
    // Thẻ khách hàng (phiếu lưu bảo hành) cũng ghi nhận sản phẩm đã bán và ngày bán,
    // nhưng trước đây lịch sử kho chỉ đọc collection orders nên những dòng này bị bỏ sót.
    const cardSales = (warrantyRequests || []).filter(w =>
      (w.recordType === 'customer' || (!w.recordType && !w.supplierName)) && w.customerName
    ).flatMap(w => (w.items || []).filter(isThisProduct).map(it => {
      const date = it.saleDate || w.saleDate || w.createdAt || w.sentAt || '';
      if (!matchTime(date)) return null;
      return { ...it, date, quantity: Number(it.quantity ?? it.qty ?? 1) || 1, status: w.status === 'DEBT' ? 'DEBT' : 'PAID', customerName: w.customerName, customerId: w.customerId || '', source: 'customer-card' };
    }).filter(Boolean));
    // Tránh hiện hai lần cùng một giao dịch nếu người dùng đã ghi cả hóa đơn bán và thẻ khách hàng.
    const sales = [...orderSales];
    for (const cardSale of cardSales) {
      const cardDay = String(cardSale.date).slice(0, 10);
      const duplicate = sales.some(s => norm(s.customerName) === norm(cardSale.customerName)
        && norm(s.name) === norm(cardSale.name)
        && String(s.date || '').slice(0, 10) === cardDay
        && Number(s.quantity ?? s.qty ?? 1) === Number(cardSale.quantity));
      if (!duplicate) sales.push(cardSale);
    }
    sales.sort((a,b) => new Date(b.date) - new Date(a.date));
    const imp = (imports || []).filter(i => matchTime(i.date)).flatMap(i => (i.items || []).filter(isThisProduct).map(it => ({ ...it, date: i.date, status: i.status, supplierName: i.supplierName || 'NCC Ẩn', supplierId: i.supplierId || '' }))).sort((a,b) => new Date(b.date) - new Date(a.date));
    const totalSoldQty = sales.reduce((s, x) => s + (Number(x.quantity ?? x.qty) || 0), 0);
    const totalImportQty = imp.reduce((s, x) => s + (Number(x.qty ?? x.quantity) || 0), 0);
    const totalSoldAmount = sales.reduce((s, x) => s + ((Number(x.quantity ?? x.qty) || 0) * (Number(x.price) || 0)), 0);
    const totalImportAmount = imp.reduce((s, x) => s + ((Number(x.qty ?? x.quantity) || 0) * (Number(x.importCost) || 0)), 0);
    const totalPaid = sales.filter(s => s.status === 'PAID').reduce((sum, x) => sum + ((Number(x.quantity ?? x.qty) || 0) * (Number(x.price) || 0)), 0);
    const totalDebtRemain = sales.filter(s => s.status === 'DEBT').reduce((sum, x) => sum + ((Number(x.quantity ?? x.qty) || 0) * (Number(x.price) || 0)), 0);
    return { sales, imports: imp, totalSoldQty, totalImportQty, totalSoldAmount, totalImportAmount, totalPaid, totalDebtRemain };
  }, [detailProduct, orders, imports, warrantyRequests, filterYear]);

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 bg-gray-50 overflow-hidden h-full">
      {!detailProduct && <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <div><h2 className="text-2xl font-bold text-gray-800">Sản phẩm</h2></div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64"><Search size={16} className="absolute left-3 top-3 text-gray-400"/><input placeholder="Tìm kiếm trực tiếp sản phẩm..." value={searchTerm} onChange={e=>{ setSearchTerm(e.target.value); setInvCurrentPage(1); }} className="w-full pl-9 pr-3 py-2 border rounded-lg bg-white outline-none text-sm"/></div>
          <button onClick={() => {setForm({name:'', category:'', price:'', cost:'', stock:''}); setIsModalOpen(true);}} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shrink-0"><Plus size={18}/> Thêm mới</button>
        </div>
      </div>
      <details className="mb-4 rounded-2xl border border-blue-200 bg-white shadow-md overflow-hidden">
        <summary className="cursor-pointer list-none px-4 py-3 bg-blue-50 text-blue-800 font-extrabold flex items-center justify-between"><span className="flex items-center gap-2"><Package size={18}/> Nhóm hàng</span><span className="text-xs font-semibold">Quản lý nhóm và sản phẩm trong nhóm ▾</span></summary>
        <div className="p-2 sm:p-3"><GroupManagementView products={products} db={db} storeId={storeId} showToast={showToast} /></div>
      </details>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
        <div className="bg-white p-4 rounded-2xl border shadow-sm"><p className="text-xs text-gray-500 font-bold uppercase">Tổng Số Sản Phẩm</p><p className="text-xl font-bold text-gray-800">{bannerStats.count}</p></div>
        <div className="bg-white p-4 rounded-2xl border shadow-sm"><p className="text-xs text-blue-600 font-bold uppercase">Tổng Tồn Kho</p><p className="text-xl font-bold text-blue-600">{bannerStats.totalStock}</p></div>
        <div className="bg-white p-4 rounded-2xl border shadow-sm"><p className="text-xs text-green-600 font-bold uppercase">Tổng Giá Vốn Tồn Kho</p><p className="text-xl font-bold text-green-600">{formatCurrency(bannerStats.totalValue)}</p></div>
        <div className="bg-white p-4 rounded-2xl border shadow-sm"><div className="flex items-center justify-between gap-2"><p className="text-xs text-purple-600 font-bold uppercase">Tổng tiền nhập hàng</p><select value={stockTotalPeriod} onChange={e=>setStockTotalPeriod(e.target.value)} className="text-xs border rounded p-1"><option value="year">Năm</option></select></div><div className="flex gap-1 mt-2"><select value={stockTotalYear} onChange={e=>setStockTotalYear(e.target.value)} className="text-xs border rounded p-1 flex-1">{Array.from({length:8},(_,i)=>getVietnamDateParts(new Date()).year-i).map(y=><option key={y} value={String(y)}>{y}</option>)}</select></div><p className="text-xl font-bold text-purple-700 mt-1">{formatCurrency(stockImportTotals.amount)}</p><p className="text-[11px] text-gray-500">{stockImportTotals.count} phiếu nhập</p></div>
      </div>
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-xl mb-3 flex justify-between items-center"><span className="text-xs font-bold text-blue-700">Đã chọn {selectedIds.length} mục</span><button onClick={handleBatchDelete} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1"><Trash2 size={14}/> Xóa đã chọn</button></div>
      )}
      <div className="flex-1 bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col justify-between">
        <div className="overflow-auto flex-1">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 sticky top-0 border-b select-none">
              <tr>
                <th className="p-4 w-10"><input type="checkbox" onChange={() => setSelectedIds(selectedIds.length === products.length ? [] : products.map(p=>p.id))} checked={products.length > 0 && selectedIds.length === products.length} className="w-4 h-4"/></th>
                <th className="p-4 font-bold text-gray-600 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('name')}><div className="flex items-center gap-1">Sản phẩm {sortConfig.field === 'name' && sortConfig.direction !== 'none' && <ArrowUpDown size={14} className={sortConfig.direction==='desc' ? 'text-blue-500' : 'text-green-500'} />}</div></th>
                <th className="p-4 font-bold text-gray-600 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('cost')}><div className="flex items-center gap-1">Giá vốn {sortConfig.field === 'cost' && <ArrowUpDown size={14} className={sortConfig.direction==='desc' ? 'text-blue-500' : 'text-green-500'} />}</div></th>
                <th className="p-4 font-bold text-gray-600 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('price')}><div className="flex items-center gap-1">Giá bán {sortConfig.field === 'price' && <ArrowUpDown size={14} className={sortConfig.direction==='desc' ? 'text-blue-500' : 'text-green-500'} />}</div></th>
                <th className="p-4 font-bold text-gray-600 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('stock')}><div className="flex items-center gap-1">Tồn {sortConfig.field === 'stock' && <ArrowUpDown size={14} className={sortConfig.direction==='desc' ? 'text-blue-500' : 'text-green-500'} />}</div></th>
                <th className="p-4 font-bold text-gray-600 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map(p => {
                const stockClass = p.stock < 0 ? 'text-blue-600' : 'text-gray-800';
                return (
                  <tr key={p.id} className="border-b hover:bg-blue-50/50 cursor-pointer" onClick={() => openProductHistory(p, false)}>
                    <td className="p-4" onClick={e=>e.stopPropagation()}><input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => setSelectedIds(prev => prev.includes(p.id) ? prev.filter(x=>x!==p.id) : [...prev, p.id])} className="w-4 h-4"/></td>
                    <td className="p-4 font-medium text-blue-600 underline">{p.name}</td>
                    <td className="p-4 text-gray-600">{formatCurrency(p.cost)}</td><td className="p-4 font-bold text-blue-600">{formatCurrency(p.price)}</td><td className={"p-4 font-bold " + stockClass}>{p.stock}</td>
                    <td className="p-4 text-right flex justify-end gap-1" onClick={e=>e.stopPropagation()}><button onClick={() => openProductHistory(p, false)} title="Xem chi tiết nhập/bán" className="text-gray-600 bg-gray-100 p-2 rounded-lg hover:bg-gray-200"><Eye size={16}/></button><button onClick={() => {setForm(p); setIsModalOpen(true);}} className="text-blue-600 bg-blue-50 p-2 rounded-lg hover:bg-blue-100"><Edit size={16}/></button><button onClick={() => handleDelete(p.id)} className="text-blue-600 bg-blue-50 p-2 rounded-lg hover:bg-blue-100"><Trash2 size={16}/></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="border-t shrink-0"><PaginationControls currentPage={invCurrentPage} totalPages={totalInvPages} rowsPerPage={invRowsPerPage} onPageChange={(p) => setInvCurrentPage(p)} onRowsChange={(r) => { setInvRowsPerPage(r); setInvCurrentPage(1); }} totalItems={filteredProducts.length} /></div>
      </div>
      </>}
      {detailProduct && <div className="flex-1 overflow-y-auto bg-gray-50/50 p-4 md:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white border rounded-xl p-3">
          <div><h2 className="text-xl font-bold text-gray-800">Lịch sử: {detailProduct.name || ''}</h2><p className="text-sm text-gray-500">Chi tiết sản phẩm</p></div>
          <div className="flex gap-2"><button type="button" onClick={() => { if (window.history.state?.appPopupNavigation?.tab === 'products') window.history.back(); else setDetailProduct(null); }} className="border rounded-lg px-3 py-2 text-sm font-semibold hover:bg-gray-100">← Lùi</button><button type="button" onClick={() => window.history.forward()} className="border rounded-lg px-3 py-2 text-sm font-semibold hover:bg-gray-100">Tiến →</button><button type="button" onClick={() => { setDetailProduct(null); const url = new URL(window.location.href); ['detailTab','detailId','detailName'].forEach(k=>url.searchParams.delete(k)); window.history.replaceState({ ...(window.history.state || {}), appPopupNavigation: { tab: 'products', entity: null } }, '', url.toString()); }} className="bg-gray-700 text-white rounded-lg px-3 py-2 text-sm font-semibold">Danh sách sản phẩm</button></div>
        </div>
        {detailProduct && <div className="px-1 pt-2"><button type="button" onClick={() => { setDetailProduct(null); navigateMainTab('products'); }} className="text-blue-700 underline text-sm font-semibold">Mở thẻ lưu sản phẩm</button></div>}
        {detailProduct && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border">
              <div><p className="text-xs text-gray-500">Giá bán:</p><p className="font-bold text-blue-600">{formatCurrency(detailProduct.price)}</p></div>
              <div><p className="text-xs text-gray-500">Giá vốn hiện tại:</p><p className="font-bold text-gray-600">{formatCurrency(detailProduct.cost)}</p></div>
              <div><p className="text-xs text-gray-500">Tồn kho:</p><p className={"font-bold " + (detailProduct.stock < 0 ? 'text-blue-600' : 'text-gray-800')}>{detailProduct.stock}</p></div>
              <div className="flex items-center gap-2">
                <button onClick={handlePrintProductDetail} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"><Printer size={14}/> In Thẻ Kho</button>
                <div className="flex items-center gap-1 bg-white p-1 rounded border">
                  <select value={filterYear} onChange={e=>setFilterYear(e.target.value)} className="bg-transparent text-xs outline-none">{Array.from({length: 5}, (_, i) => getVietnamDateParts(new Date()).year - i).map(y => <option key={y} value={y}>{y}</option>)}</select>
                </div>
              </div>
            </div>
            <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 space-y-3">
              {(() => {
                const allProductImports = (imports || []).flatMap(im => (im.items || []).filter(item => {
                  const itemId = item.id || item.productId || item.product_id || '';
                  return (itemId && itemId === detailProduct.id) || String(item?.name || '').trim().toLocaleLowerCase('vi') === String(detailProduct.name || '').trim().toLocaleLowerCase('vi');
                }).map(item => ({ date: im.date, supplierName: im.supplierName || 'Chưa rõ nhà cung cấp', supplierId: im.supplierId || '', qty: Number(item.qty ?? item.quantity ?? 0), importCost: Number(item.importCost) || 0 })));
                const selectedImports = allProductImports.filter(imp => {
                  if (productImportYear === 'ALL') return true;
                  if (!imp.date) return false;
                  const year = getVietnamDateParts(new Date(imp.date)).year;
                  return String(year) === productImportYear;
                });
                const totalQty = selectedImports.reduce((sum, imp) => sum + (Number(imp.qty) || 0), 0);
                const yearOptions = Array.from(new Set([getVietnamDateParts(new Date()).year, ...allProductImports.map(imp => imp.date ? getVietnamDateParts(new Date(imp.date)).year : null).filter(Boolean)])).sort((a,b) => b-a);
                const recentImports = [...allProductImports].sort((a,b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 5);
                return <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div><p className="text-[11px] text-orange-800 font-bold uppercase">Tổng số lượng nhập</p><p className="text-xl font-black text-orange-900">{totalQty.toLocaleString('vi-VN')} sản phẩm</p><p className="text-xs text-orange-700">{productImportYear === 'ALL' ? 'Tất cả các năm' : `Năm ${productImportYear}`}</p></div>
                    <label className="text-xs font-semibold text-orange-900 flex items-center gap-2">Xem tổng nhập
                      <select value={productImportYear} onChange={e => setProductImportYear(e.target.value)} className="border border-orange-200 rounded-lg p-2 bg-white text-sm">
                        {yearOptions.map(y => <option key={y} value={String(y)}>Năm {y}</option>)}
                        <option value="ALL">Tất cả các năm</option>
                      </select>
                    </label>
                  </div>
                </>;
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
                    <thead className="bg-green-50 sticky top-0 border-b border-green-100"><tr><th className="p-2.5 text-green-800">Khách mua</th><th className="p-2.5 text-green-800">Ngày bán</th><th className="p-2.5 text-green-800">Số lượng</th><th className="p-2.5 text-green-800 text-right">Số tiền</th></tr></thead>
                    <tbody>
                      {(productSalesRows === 'all' ? productHistory.sales : productHistory.sales.slice((productSalesPage - 1) * Number(productSalesRows), productSalesPage * Number(productSalesRows))).map((s, idx) => (<tr key={idx} className="border-b hover:bg-gray-50"><td className="p-2.5 font-bold"><button type="button" onClick={() => { setDetailProduct(null); navigateMainTab('customers', s.customerId, s.customerName); }} className="text-blue-700 underline text-left">{s.customerName} · Mở khách</button></td><td className="p-2.5 text-gray-500 whitespace-nowrap">{formatDate(s.date)}</td><td className="p-2.5 font-bold text-green-600">Bán ra {Number(s.quantity ?? s.qty ?? 1)}</td><td className="p-2.5 text-right font-bold whitespace-nowrap">{formatCurrency((Number(s.quantity ?? s.qty ?? 1) || 0) * (Number(s.price) || 0))}</td></tr>))}
                      {productHistory.sales.length === 0 && (<tr><td colSpan="4" className="p-4 text-center text-gray-400">Không có phát sinh bán</td></tr>)}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 p-2 border-t bg-white"><label className="text-xs flex items-center gap-2">Hiển thị <select value={productSalesRows} onChange={e=>{setProductSalesRows(e.target.value);setProductSalesPage(1);}} className="border rounded p-1"><option value="5">5 dòng</option><option value="10">10 dòng</option><option value="20">20 dòng</option><option value="all">Tất cả</option></select></label><div className="flex items-center gap-2 text-xs"><span>Trang {productSalesRows==='all'?1:productSalesPage} / {productSalesRows==='all'?1:Math.max(1,Math.ceil(productHistory.sales.length/Number(productSalesRows)))}</span><button type="button" onClick={()=>setProductSalesPage(v=>Math.max(1,v-1))} disabled={productSalesPage===1||productSalesRows==='all'} className="border rounded px-2 py-1 disabled:opacity-40">Lùi</button><button type="button" onClick={()=>setProductSalesPage(v=>Math.min(Math.max(1,Math.ceil(productHistory.sales.length/Number(productSalesRows))),v+1))} disabled={productSalesRows==='all'||productSalesPage>=Math.max(1,Math.ceil(productHistory.sales.length/Number(productSalesRows)))} className="border rounded px-2 py-1 disabled:opacity-40">Tiến</button></div></div>
              </div>
              <div>
                <h4 className="font-bold text-sm text-purple-700 mb-2 border-b pb-1">Lịch sử Nhập hàng:</h4>
                <div className="max-h-64 overflow-y-auto border rounded-xl shadow-sm">
                  <table className="w-full text-left text-xs bg-white">
                    <thead className="bg-purple-50 sticky top-0 border-b border-purple-100"><tr><th className="p-2.5 text-purple-800">Nhà cung cấp</th><th className="p-2.5 text-purple-800">Ngày nhập</th><th className="p-2.5 text-purple-800">Số lượng</th><th className="p-2.5 text-purple-800 text-right">Số tiền</th></tr></thead>
                    <tbody>
                      {(productImportRows === 'all' ? productHistory.imports : productHistory.imports.slice((productImportPage - 1) * Number(productImportRows), productImportPage * Number(productImportRows))).map((im, idx) => (<tr key={idx} className="border-b hover:bg-gray-50"><td className="p-2.5 font-bold"><button type="button" onClick={() => { setDetailProduct(null); navigateMainTab('suppliers', im.supplierId, im.supplierName); }} className="text-orange-700 underline text-left">{im.supplierName} · Mở NCC</button></td><td className="p-2.5 text-gray-500 whitespace-nowrap">{formatDate(im.date)}</td><td className="p-2.5 font-bold text-purple-600">Nhập vào {Number(im.qty ?? im.quantity ?? 0)}</td><td className="p-2.5 text-right font-bold whitespace-nowrap">{formatCurrency((Number(im.qty ?? im.quantity ?? 0) || 0) * (Number(im.importCost) || 0))}</td></tr>))}
                      {productHistory.imports.length === 0 && (<tr><td colSpan="4" className="p-4 text-center text-gray-400">Không có phát sinh nhập</td></tr>)}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 p-2 border-t bg-white"><label className="text-xs flex items-center gap-2">Hiển thị <select value={productImportRows} onChange={e=>{setProductImportRows(e.target.value);setProductImportPage(1);}} className="border rounded p-1"><option value="5">5 dòng</option><option value="10">10 dòng</option><option value="20">20 dòng</option><option value="all">Tất cả</option></select></label><div className="flex items-center gap-2 text-xs"><span>Trang {productImportRows==='all'?1:productImportPage} / {productImportRows==='all'?1:Math.max(1,Math.ceil(productHistory.imports.length/Number(productImportRows)))}</span><button type="button" onClick={()=>setProductImportPage(v=>Math.max(1,v-1))} disabled={productImportPage===1||productImportRows==='all'} className="border rounded px-2 py-1 disabled:opacity-40">Lùi</button><button type="button" onClick={()=>setProductImportPage(v=>Math.min(Math.max(1,Math.ceil(productHistory.imports.length/Number(productImportRows))),v+1))} disabled={productImportRows==='all'||productImportPage>=Math.max(1,Math.ceil(productHistory.imports.length/Number(productImportRows)))} className="border rounded px-2 py-1 disabled:opacity-40">Tiến</button></div></div>
              </div>
            </div>
          </div>
        )}
      </div>}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={form.id ? "Sửa thông tin Hàng hóa" : "Thêm Hàng hóa mới"}>
        <form onSubmit={handleSave} className="space-y-4">
          <input required placeholder="Tên sản phẩm *" value={form.name||''} onChange={e=>setForm({...form,name:e.target.value})} className="w-full p-2.5 border rounded-lg outline-none"/>
          <select value={form.category||''} onChange={e=>setForm({...form,category:e.target.value})} className="w-full p-2.5 border rounded-lg outline-none"><option value="">Chưa phân nhóm</option>{[...new Set([...groups.map(g=>g.name), ...products.map(p=>p.category).filter(Boolean)])].map(g=><option key={g} value={g}>{g}</option>)}</select>
          <div className="grid grid-cols-2 gap-4"><input required type="number" placeholder="Giá vốn *" value={form.cost||''} onChange={e=>setForm({...form,cost:e.target.value})} className="p-2.5 border rounded-lg outline-none"/><input required type="number" placeholder="Giá bán *" value={form.price||''} onChange={e=>setForm({...form,price:e.target.value})} className="p-2.5 border rounded-lg outline-none"/></div>
          <input required type="number" placeholder="Tồn kho *" value={form.stock||''} onChange={e=>setForm({...form,stock:e.target.value})} className="w-full p-2.5 border rounded-lg outline-none"/>
          <button className="w-full bg-blue-600 text-white font-bold p-3 rounded-lg">Lưu lại</button>
        </form>
      </Modal>
    </div>
  );
}

function WarrantyAutocomplete({ value, options = [], onChange, onSelect, placeholder = '', required = false, className = '' }) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const normalized = (v) => String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').trim().toLocaleLowerCase('vi');
  const getName = (option) => typeof option === 'string' ? option : (option?.name || '');
  const hasQuery = String(value ?? '').trim().length > 0;
  const filtered = hasQuery ? options.filter(option => getName(option) && normalized(getName(option)).includes(normalized(value))).slice(0, 8) : [];
  return <div className="relative min-w-0 flex-1">
    <input value={value} required={required} autoComplete="off" placeholder={placeholder} className={className || 'w-full p-2 border rounded-lg font-normal'}
      onFocus={() => { setOpen(!!String(value ?? '').trim()); setActiveIndex(0); }}
      onBlur={() => setTimeout(() => setOpen(false), 140)}
      onChange={e => { const nextValue = e.target.value; onChange(nextValue); setOpen(!!nextValue.trim()); setActiveIndex(0); }}
      onKeyDown={e => {
        if (e.key === 'ArrowDown' && filtered.length) { e.preventDefault(); setOpen(true); setActiveIndex(i => (i + 1) % filtered.length); }
        else if (e.key === 'ArrowUp' && filtered.length) { e.preventDefault(); setActiveIndex(i => (i - 1 + filtered.length) % filtered.length); }
        else if (e.key === 'Enter' && open && filtered.length) { e.preventDefault(); onSelect(filtered[activeIndex] || filtered[0]); setOpen(false); }
        else if (e.key === 'Escape') setOpen(false);
      }} />
    {open && hasQuery && <div className="absolute z-[80] left-0 right-0 top-full mt-1 max-h-60 overflow-y-auto overscroll-contain rounded-lg border border-gray-200 bg-white shadow-xl">
      {filtered.length ? filtered.map((option, index) => <button type="button" key={`${getName(option)}-${option?.id || index}`} onMouseDown={e => e.preventDefault()} onClick={() => { onSelect(option); setOpen(false); }} className={`block w-full text-left px-3 py-2.5 text-sm border-b last:border-b-0 hover:bg-purple-50 ${index === activeIndex ? 'bg-purple-50' : ''}`}>
        <span className="block font-semibold text-gray-800">{getName(option)}</span>
        {(option?.phone || option?.address) && <span className="block text-xs text-gray-500">{[option.phone, option.address].filter(Boolean).join(' · ')}</span>}
      </button>) : <div className="px-3 py-3 text-sm text-gray-500">Không tìm thấy dữ liệu đã lưu. Bạn có thể bấm “+ Thêm mới”.</div>}
    </div>}
  </div>;
}

function WarrantyQuoteManager({ products = [], customers = [], storeConfig = {}, db, storeId, showToast, onBack }) {
  const [quotes, setQuotes] = useState([]);
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState('10');
  const [editing, setEditing] = useState(null);
  const [viewingQuote, setViewingQuote] = useState(null);
  const [busy, setBusy] = useState(false);
  const empty = () => ({ customerName:'', customerPhone:'', customerAddress:'', note:'', items:[{ productId:'', name:'', quantity:1, price:0, warrantyValue:'', warrantyUnit:'tháng', note:'' }] });
  const [form, setForm] = useState(empty);
  useEffect(() => { let alive=true; getDocs(collection(db,'stores',storeId,'quotes')).then(snap=>{if(alive)setQuotes(snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||''))));}).catch(()=>showToast('Không tải được danh sách báo giá','error')); return ()=>{alive=false}; }, [db,storeId]);
  const total = form.items.reduce((n,it)=>n+(Number(it.quantity)||0)*(Number(it.price)||0),0);
  const filtered = quotes.filter(q => `${q.code||''} ${q.customerName||''} ${q.customerPhone||''}`.toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi')));
  const shown = pageSize==='all' ? filtered : filtered.slice(0,Number(pageSize)||10);
  const money = n => (Number(n)||0).toLocaleString('vi-VN')+' đ';
  const updateItem = (idx, key, val) => setForm(prev=>({...prev,items:prev.items.map((it,i)=>i===idx?{...it,[key]:val}:it)}));
  const selectProduct = (idx,name) => { const p=products.find(x=>String(x.name||'').toLocaleLowerCase('vi')===String(name).toLocaleLowerCase('vi')); setForm(prev=>({...prev,items:prev.items.map((it,i)=>i===idx?{...it,name,productId:p?.id||'',price:p?.price??it.price}:it)})); };
  const startNew = () => { setEditing(null); setForm(empty()); };
  const saveQuote = async e => { e?.preventDefault?.(); if(!form.customerName.trim()) return showToast('Vui lòng nhập tên khách hàng','error'); if(!form.items.some(i=>i.name.trim())) return showToast('Vui lòng nhập ít nhất một sản phẩm','error'); setBusy(true); try { const now=new Date().toISOString(); const items=form.items.filter(i=>i.name.trim()).map(i=>({...i,quantity:Math.max(1,Number(i.quantity)||1),price:Math.max(0,Number(i.price)||0),lineTotal:(Math.max(1,Number(i.quantity)||1)*Math.max(0,Number(i.price)||0))})); const data={...form,items,total:items.reduce((n,i)=>n+i.lineTotal,0),updatedAt:now,createdAt:editing?.createdAt||now,code:editing?.code||`BG${Date.now()}`,status:editing?.status||'BÁO GIÁ'}; if(editing?.id) await updateDoc(doc(db,'stores',storeId,'quotes',editing.id),data); else { const ref=await addDoc(collection(db,'stores',storeId,'quotes'),data); data.id=ref.id; } const snap=await getDocs(collection(db,'stores',storeId,'quotes')); setQuotes(snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')))); setEditing(null); setForm(empty()); showToast('Đã lưu báo giá'); } catch(err){showToast('Lỗi lưu báo giá','error')} finally{setBusy(false)} };
  const printQuote = q => {
    const cfg = storeConfig.quotePrintA4 || {};
    const customer = q.customerName || form.customerName;
    const items = q.items || form.items;
    const sum = q.total ?? items.reduce((n, i) => n + (Number(i.quantity) || 0) * (Number(i.price) || 0), 0);
    const w = window.open('', '_blank', 'width=1000,height=800');
    if (!w) return showToast('Trình duyệt đã chặn cửa sổ in', 'error');
    const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
    const showWarranty = cfg.printShowWarranty !== false;
    const showNote = cfg.printShowNote !== false;
    const showLogo = cfg.printShowLogo === true && storeConfig.printTopLogoEnabled === true && !!storeConfig.logo;
    const widthStt = cfg.colWidthStt ?? 5, widthProduct = cfg.colWidthProduct ?? 35, widthQty = cfg.colWidthQty ?? 8, widthPrice = cfg.colWidthPrice ?? 12, widthWarranty = cfg.colWidthWarranty ?? 12, widthNote = cfg.colWidthNote ?? 13, widthTotal = cfg.colWidthTotal ?? 15;
    w.document.write(`<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${esc(q.code || 'Báo giá')}</title><style>
      @page{size:A4 portrait;margin:${Number(cfg.printPageMargin)||18}mm}
      *{box-sizing:border-box}body{position:relative;isolation:isolate;font-family:Arial,sans-serif;color:#222;font-size:${Number(cfg.printFontSize)||12}px;line-height:1.45;margin:0}body:before{content:'';position:absolute;top:0;left:0;width:100%;height:100%;z-index:0;pointer-events:none;background-image:${storeConfig.logo && storeConfig.watermarkLogoEnabled !== false ? `url('${esc(storeConfig.logo)}')` : 'none'};background-repeat:no-repeat;background-position:center center;background-size:${Math.max(20,Math.min(100,Number(storeConfig.watermarkLogoSize)||55))}%;opacity:${Math.max(0.03,Math.min(0.4,Number(storeConfig.watermarkLogoOpacity ?? 0.12)))};-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .store{display:flex;align-items:center;gap:16px;border-bottom:1px dashed #999;padding-bottom:12px;margin-bottom:12px}
      .logo{width:${Number(cfg.printLogoWidth)||75}px;height:${Number(cfg.printLogoHeight)||64}px;object-fit:contain}
      .store-info{flex:1;transform:translateX(${Number(cfg.storeNameXOffset)||0}px)}
      .store h2{font-size:${(Number(cfg.printFontSize)||12)+(Number(cfg.fsStoreNameOffset)||2)}px;margin:0 0 3px;text-transform:uppercase}
      .store p{margin:1px 0;transform:translateX(${Number(cfg.storeAddressXOffset)||0}px)}
      h1{text-align:center;font-size:${(Number(cfg.printFontSize)||12)+(Number(cfg.fsInvoiceTitleOffset)||4)}px;margin:20px 0 8px}
      .meta{display:flex;justify-content:center;gap:18px;flex-wrap:wrap;margin-bottom:18px}
      .customer p{margin:4px 0}
      table{width:100%;border-collapse:collapse;table-layout:fixed;margin-top:18px}
      th,td{border:1px solid #777;padding:${Number(cfg.printTablePaddingY)||6}px ${Number(cfg.printTablePaddingX)||4}px;overflow-wrap:anywhere;vertical-align:top}
      th{text-align:center;background:#f1f1f1;font-size:${(Number(cfg.printFontSize)||12)*(Number(cfg.printDetailFontScale||80)/100)}px}
      td{font-size:${(Number(cfg.printFontSize)||12)*(Number(cfg.printDetailFontScale||80)/100)}px}
      .center{text-align:center}.right{text-align:right}.total{text-align:right;font-size:${(Number(cfg.printFontSize)||12)+2}px;font-weight:bold;margin-top:16px}
      .footer{margin-top:30px;padding-top:12px;border-top:1px dashed #aaa;white-space:pre-wrap;text-align:center}
      .signatures{display:flex;justify-content:space-between;margin-top:35px;text-align:center}.signatures div{width:40%}
    </style></head><body>
    <header class="store">
      ${showLogo ? `<img class="logo" src="${esc(storeConfig.logo)}" alt="Logo">` : ''}
      <div class="store-info">
        ${cfg.printShowStoreName !== false ? `<h2>${esc(cfg.printStoreName ?? storeConfig.name ?? '')}</h2>` : ''}
        ${cfg.printShowStoreAddress !== false ? `<p>${esc(cfg.printAddressLabel || 'Địa chỉ')}: ${esc(cfg.printStoreAddress ?? storeConfig.address ?? '')}</p>` : ''}
        ${cfg.printShowStorePhone !== false ? `<p>${esc(cfg.printPhoneLabel || 'SĐT')}: ${esc(cfg.printStorePhone ?? storeConfig.phone ?? '')}</p>` : ''}
      </div>
    </header>
    <h1>${esc(cfg.printInvoiceTitle || 'BÁO GIÁ')}</h1>
    ${cfg.printShowDate !== false ? `<p style="text-align:center;margin:0 0 6px;font-size:${(Number(cfg.printFontSize)||12)+(Number(cfg.fsMetaOffset)||0)}px"><b>${esc(cfg.printDateLabel || 'Ngày lập phiếu')}:</b> ${esc(new Date(q.createdAt || Date.now()).toLocaleDateString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',day:'2-digit',month:'2-digit',year:'numeric'}))}</p>` : ''}
    ${cfg.printShowInvoiceId !== false ? `<p style="text-align:center;margin:0 0 18px;font-size:${(Number(cfg.printFontSize)||12)+(Number(cfg.fsMetaOffset)||0)}px"><b>${esc(cfg.printInvoiceIdLabel || 'Mã báo giá')}:</b> ${esc(q.code || 'Bản nháp')}</p>` : ''}
    <section class="customer">
      ${cfg.printShowCustomer !== false ? `<p><b>${esc(cfg.printCustomerLabel || 'Khách hàng')}:</b> ${esc(customer || '')}</p>` : ''}
      ${cfg.printShowCustomerPhone !== false ? `<p><b>${esc(cfg.printCustomerPhoneLabel || 'Điện thoại')}:</b> ${esc(q.customerPhone || form.customerPhone || '—')}</p>` : ''}
      ${cfg.printShowCustomerAddress !== false ? `<p><b>${esc(cfg.printCustomerAddressLabel || 'Địa chỉ')}:</b> ${esc(q.customerAddress || form.customerAddress || '—')}</p>` : ''}
    </section>
    <table><colgroup><col style="width:${widthStt}%"><col style="width:${widthProduct}%"><col style="width:${widthQty}%"><col style="width:${widthPrice}%">${showWarranty?`<col style="width:${widthWarranty}%">`:''}${showNote?`<col style="width:${widthNote}%">`:''}<col style="width:${widthTotal}%"></colgroup>
      <thead><tr><th>${esc(cfg.printSttLabel || 'STT')}</th><th>${esc(cfg.printProductLabel || 'Tên sản phẩm')}</th><th>${esc(cfg.printQtyLabel || 'SL')}</th><th>${esc(cfg.printPriceLabel || 'Đơn giá')}</th>${showWarranty?`<th>${esc(cfg.printWarrantyLabel || 'Bảo hành')}</th>`:''}${showNote?`<th>${esc(cfg.printNoteLabel || 'Ghi chú')}</th>`:''}<th>${esc(cfg.printTotalLabel || 'Thành tiền')}</th></tr></thead>
      <tbody>${items.filter(i=>i.name).map((i,n)=>`<tr><td class="center">${n+1}</td><td><b>${esc(i.name)}</b></td><td class="center">${Number(i.quantity)||0}</td><td class="right">${esc(money(i.price))}</td>${showWarranty?`<td class="center">${esc(i.warrantyValue ? `${i.warrantyValue} ${i.warrantyUnit || 'tháng'}` : '')}</td>`:''}${showNote?`<td>${esc(i.note||'')}</td>`:''}<td class="right">${esc(money((Number(i.quantity)||0)*(Number(i.price)||0)))}</td></tr>`).join('')}</tbody>
    </table>
    <div class="total">${esc(cfg.printSubtotalLabel || 'Tổng cộng')}: ${esc(money(sum))}</div>
    ${cfg.printShowNote !== false && (q.note || form.note) ? `<p><b>${esc(cfg.printQuoteNoteLabel || 'Ghi chú báo giá')}:</b> ${esc(q.note || form.note)}</p>` : ''}
    ${cfg.printFooter ? `<div class="footer">${esc(cfg.printFooter)}</div>` : ''}
    ${cfg.printShowSignatures ? '<div class="signatures"><div><b>Khách hàng</b><br><small>(Ký, ghi rõ họ tên)</small></div><div><b>Người lập báo giá</b><br><small>(Ký, ghi rõ họ tên)</small></div></div>' : ''}
    <script>window.onload=()=>window.print()<\/script></body></html>`);
    w.document.close();
  };
  const deleteQuote = async q => {
    if (!q?.id) return;
    const message = q.orderId || q.status === 'ĐÃ CHUYỂN ĐƠN HÀNG'
      ? `Báo giá ${q.code} đã được chuyển thành đơn hàng. Xóa chỉ xóa phiếu báo giá, KHÔNG xóa đơn hàng đã tạo. Bạn có chắc muốn tiếp tục?`
      : `Bạn có chắc muốn xóa báo giá ${q.code || ''} của khách ${q.customerName || ''}?`;
    if (!window.confirm(message)) return;
    setBusy(true);
    try {
      await deleteDoc(doc(db, 'stores', storeId, 'quotes', q.id));
      setQuotes(prev => prev.filter(item => item.id !== q.id));
      if (viewingQuote?.id === q.id) setViewingQuote(null);
      if (editing?.id === q.id) { setEditing(null); setForm(empty()); }
      showToast('Đã xóa báo giá');
    } catch (err) {
      showToast('Không xóa được báo giá: ' + (err.message || 'Lỗi không xác định'), 'error');
    } finally { setBusy(false); }
  };
  const convert = async q => { if(q.status==='ĐÃ CHUYỂN ĐƠN HÀNG'||q.orderId) return showToast('Báo giá này đã chuyển thành đơn hàng','error'); if(!window.confirm(`Xác nhận chuyển báo giá ${q.code} thành đơn hàng? Sau khi xác nhận hệ thống sẽ cập nhật kho.`))return; setBusy(true); try { let customer=customers.find(c=>String(c.name||'').trim().toLocaleLowerCase('vi')===String(q.customerName||'').trim().toLocaleLowerCase('vi')); if(!customer){const cr=await addDoc(collection(db,'stores',storeId,'customers'),{name:q.customerName,phone:q.customerPhone||'',address:q.customerAddress||'',totalDebt:0,createdAt:new Date().toISOString()}); customer={id:cr.id,name:q.customerName,phone:q.customerPhone||'',address:q.customerAddress||'',totalDebt:0};} const batch=writeBatch(db); const orderItems=[]; for(const it of q.items||[]){let prod=products.find(p=>p.id===it.productId)||products.find(p=>String(p.name||'').trim().toLocaleLowerCase('vi')===String(it.name||'').trim().toLocaleLowerCase('vi')); if(!prod){const pr=doc(collection(db,'stores',storeId,'products')); const newProd={name:it.name,category:'',cost:0,price:Number(it.price)||0,stock:-(Number(it.quantity)||0),createdAt:new Date().toISOString()}; batch.set(pr,newProd); prod={id:pr.id,...newProd};} else { batch.update(doc(db,'stores',storeId,'products',prod.id),{stock:(Number(prod.stock)||0)-(Number(it.quantity)||0)}); } orderItems.push({id:prod.id,name:it.name,price:Number(it.price)||0,cost:Number(prod.cost)||0,quantity:Number(it.quantity)||1,warrantyValue:it.warrantyValue||'',warrantyUnit:it.warrantyUnit||'tháng',note:it.note||''}); } const total=orderItems.reduce((n,i)=>n+i.price*i.quantity,0); const orderRef=doc(collection(db,'stores',storeId,'orders')); batch.set(orderRef,{invoiceCode:`BG-${q.code}`,quoteId:q.id,customerId:customer.id,customerName:customer.name,phone:customer.phone||'',note:`Chuyển từ báo giá ${q.code}. ${q.note||''}`,items:orderItems,total,totalCost:orderItems.reduce((n,i)=>n+i.cost*i.quantity,0),status:'PAID',date:new Date().toISOString(),sellerName:'Báo giá'}); batch.update(doc(db,'stores',storeId,'quotes',q.id),{status:'ĐÃ CHUYỂN ĐƠN HÀNG',orderId:orderRef.id,convertedAt:new Date().toISOString()}); await batch.commit(); const snap=await getDocs(collection(db,'stores',storeId,'quotes')); setQuotes(snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')))); showToast('Đã chuyển báo giá thành đơn hàng'); }catch(err){showToast('Lỗi chuyển thành đơn hàng: '+(err.message||''),'error')}finally{setBusy(false)} };
  return <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 bg-gray-50"><div className="flex flex-wrap justify-between items-center gap-3 mb-4"><div><button onClick={onBack} className="text-sm text-purple-700 font-bold mb-2">← Quay lại Bảo hành</button><h2 className="text-2xl font-bold">Báo giá</h2><p className="text-sm text-gray-500">Tạo, lưu, tìm kiếm và in báo giá khổ A4.</p></div><button onClick={startNew} className="bg-purple-600 text-white rounded-xl px-4 py-2 font-bold"><Plus size={16} className="inline mr-1"/>Tạo báo giá</button></div>
  <section className="bg-white rounded-xl border p-4 mb-4"><div className="flex flex-wrap gap-2 mb-3"><input className="border rounded-lg p-2 flex-1 min-w-[220px]" placeholder="Tìm mã báo giá, khách hàng, điện thoại..." value={search} onChange={e=>setSearch(e.target.value)}/><select className="border rounded-lg p-2" value={pageSize} onChange={e=>setPageSize(e.target.value)}><option value="10">10 dòng</option><option value="20">20 dòng</option><option value="all">Tất cả</option></select></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-100"><tr><th className="p-2 text-left">Mã báo giá</th><th className="p-2 text-left">Ngày</th><th className="p-2 text-left">Khách hàng</th><th className="p-2 text-right">Tổng tiền</th><th className="p-2 text-left">Trạng thái</th><th className="p-2">Thao tác</th></tr></thead><tbody>{shown.map(q=><tr key={q.id} className="border-t"><td className="p-2 font-bold">{q.code}</td><td className="p-2">{new Date(q.createdAt).toLocaleDateString('vi-VN')}</td><td className="p-2">{q.customerName}</td><td className="p-2 text-right">{money(q.total)}</td><td className="p-2">{q.status||'BÁO GIÁ'}</td><td className="p-2"><div className="flex flex-wrap justify-center gap-1"><button className="px-2 py-1 border rounded" onClick={()=>setViewingQuote(q)}>Xem</button><button className="px-2 py-1 border rounded" onClick={()=>{setEditing(q);setForm({...empty(),...q,items:q.items||empty().items});}}>Sửa</button><button className="px-2 py-1 border rounded" onClick={()=>printQuote(q)}>In A4</button><button disabled={busy} className="px-2 py-1 border border-red-200 text-red-700 rounded" onClick={()=>deleteQuote(q)}>Xóa</button>{q.status!=='ĐÃ CHUYỂN ĐƠN HÀNG'&&<button disabled={busy} className="px-2 py-1 bg-green-600 text-white rounded" onClick={()=>convert(q)}>Thành đơn hàng</button>}</div></td></tr>)}</tbody></table>{!shown.length&&<p className="p-4 text-center text-gray-400">Chưa có báo giá phù hợp.</p>}</div></section>
  {viewingQuote && <div className="fixed inset-0 z-[90] bg-black/40 overflow-y-auto p-3 md:p-6"><div className="mx-auto max-w-4xl bg-white rounded-xl shadow-xl p-4 md:p-6"><div className="flex items-center justify-between gap-3 mb-4"><h3 className="text-xl font-bold">Chi tiết báo giá {viewingQuote.code}</h3><button type="button" onClick={()=>setViewingQuote(null)} className="border rounded-lg px-3 py-2">Đóng</button></div><div className="grid md:grid-cols-3 gap-3 text-sm mb-4"><p><b>Khách hàng:</b> {viewingQuote.customerName}</p><p><b>Điện thoại:</b> {viewingQuote.customerPhone||'—'}</p><p><b>Ngày lập:</b> {new Date(viewingQuote.createdAt||Date.now()).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'})}</p></div><div className="overflow-x-auto"><table className="w-full text-sm border-collapse"><thead><tr className="bg-gray-100"><th className="border p-2">STT</th><th className="border p-2 text-left">Sản phẩm</th><th className="border p-2">SL</th><th className="border p-2">Đơn giá</th><th className="border p-2">Thời gian BH</th><th className="border p-2">Thành tiền</th></tr></thead><tbody>{(viewingQuote.items||[]).map((it,i)=><tr key={i}><td className="border p-2 text-center">{i+1}</td><td className="border p-2">{it.name}</td><td className="border p-2 text-center">{it.quantity}</td><td className="border p-2 text-right">{money(it.price)}</td><td className="border p-2 text-center">{it.warrantyValue?`${it.warrantyValue} ${it.warrantyUnit||'tháng'}`:'—'}</td><td className="border p-2 text-right">{money((Number(it.price)||0)*(Number(it.quantity)||0))}</td></tr>)}</tbody></table></div><div className="text-right font-bold text-lg mt-4">Tổng cộng: {money(viewingQuote.total)}</div><p className="mt-3"><b>Ghi chú:</b> {viewingQuote.note||'—'}</p><div className="flex flex-wrap justify-end gap-2 mt-5"><button type="button" className="border rounded-lg px-4 py-2" onClick={()=>{setEditing(viewingQuote);setForm({...empty(),...viewingQuote,items:viewingQuote.items||empty().items});setViewingQuote(null);}}>Sửa báo giá</button><button type="button" className="bg-indigo-600 text-white rounded-lg px-4 py-2 font-bold" onClick={()=>printQuote(viewingQuote)}>In báo giá A4</button>{viewingQuote.status!=='ĐÃ CHUYỂN ĐƠN HÀNG'&&<button type="button" disabled={busy} className="bg-green-600 text-white rounded-lg px-4 py-2 font-bold" onClick={()=>convert(viewingQuote)}>Chuyển thành đơn hàng</button>}</div></div></div>}
  {(editing||form!==null)&&<form onSubmit={saveQuote} className="bg-white rounded-xl border p-4 space-y-3"><h3 className="font-bold text-lg">{editing?'Chỉnh sửa báo giá':'Tạo báo giá mới'} {editing?.code||''}</h3><div className="grid md:grid-cols-3 gap-2"><input required list="quote-customers" className="border rounded-lg p-2" placeholder="Tên khách hàng (gõ để gợi ý)" value={form.customerName} onChange={e=>setForm({...form,customerName:e.target.value})}/><datalist id="quote-customers">{customers.map(c=><option key={c.id} value={c.name}/>)}</datalist><input className="border rounded-lg p-2" placeholder="Số điện thoại" value={form.customerPhone||''} onChange={e=>setForm({...form,customerPhone:e.target.value})}/><input className="border rounded-lg p-2" placeholder="Địa chỉ" value={form.customerAddress||''} onChange={e=>setForm({...form,customerAddress:e.target.value})}/></div><div className="space-y-2">{form.items.map((it,idx)=><div key={idx} className="grid grid-cols-2 md:grid-cols-12 gap-2 border rounded-lg p-2"><input list="quote-products" className="border rounded p-2 col-span-2 md:col-span-4" placeholder="Tên sản phẩm (gõ để gợi ý)" value={it.name} onChange={e=>selectProduct(idx,e.target.value)}/><datalist id="quote-products">{products.map(p=><option key={p.id} value={p.name}/>)}</datalist><input type="number" min="1" className="border rounded p-2 md:col-span-2" value={it.quantity} onChange={e=>updateItem(idx,'quantity',e.target.value)} placeholder="Số lượng"/><input type="number" min="0" className="border rounded p-2 md:col-span-2" value={it.price} onChange={e=>updateItem(idx,'price',e.target.value)} placeholder="Đơn giá"/><div className="md:col-span-3 grid grid-cols-2 gap-1"><input type="number" min="0" className="border rounded p-2 min-w-0" value={it.warrantyValue||''} onChange={e=>updateItem(idx,'warrantyValue',e.target.value)} placeholder="Thời hạn BH"/><select className="border rounded p-2 min-w-0" value={it.warrantyUnit||'tháng'} onChange={e=>updateItem(idx,'warrantyUnit',e.target.value)}><option value="ngày">Ngày</option><option value="tháng">Tháng</option><option value="năm">Năm</option></select></div><div className="p-2 md:col-span-3 text-right font-semibold">{money((Number(it.quantity)||0)*(Number(it.price)||0))}</div><button type="button" className="text-red-600" onClick={()=>setForm(prev=>({...prev,items:prev.items.filter((_,i)=>i!==idx)}))}>×</button></div>)}</div><button type="button" className="border rounded-lg px-3 py-2" onClick={()=>setForm(prev=>({...prev,items:[...prev.items,{productId:'',name:'',quantity:1,price:0,note:''}]}))}>+ Thêm sản phẩm</button><textarea className="w-full border rounded-lg p-2" placeholder="Ghi chú báo giá" value={form.note||''} onChange={e=>setForm({...form,note:e.target.value})}/><div className="flex flex-wrap justify-between items-center gap-3"><b className="text-lg">Tổng cộng: {money(total)}</b><div className="flex gap-2"><button type="button" className="border rounded-lg px-4 py-2" onClick={()=>printQuote({...form,total,code:editing?.code||'Bản nháp',createdAt:editing?.createdAt||new Date().toISOString()})}>In A4</button><button disabled={busy} className="bg-purple-600 text-white rounded-lg px-4 py-2 font-bold">{busy?'Đang lưu...':'Lưu báo giá'}</button></div></div></form>}</div>;
}

function WarrantyView({ products = [], customers = [], suppliers = [], warrantyRequests = [], storeConfig = {}, db, storeId, showToast }) {
  const [activeWarrantySection, setActiveWarrantySection] = useState('warranty');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [quickAddType, setQuickAddType] = useState('');
  const [quickAddName, setQuickAddName] = useState('');
  const [quickAddAddress, setQuickAddAddress] = useState('');
  const [quickAddPhone, setQuickAddPhone] = useState('');
  const [quickAddProductIndex, setQuickAddProductIndex] = useState(0);
  const [recordType, setRecordType] = useState('customer');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [supplierAddress, setSupplierAddress] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [printTarget, setPrintTarget] = useState(null);
  const [shippingLabelPickerOpen, setShippingLabelPickerOpen] = useState(false);
  const [selectedShippingLabelIds, setSelectedShippingLabelIds] = useState([]);
  const [showPrintSaleDate, setShowPrintSaleDate] = useState(true);
  const [showPrintWarrantyDuration, setShowPrintWarrantyDuration] = useState(true);
  const [showPrintLogo, setShowPrintLogo] = useState(true);
  const [saleDate, setSaleDate] = useState(getVietnamDateKey(new Date()));
  const [purchaseDate, setPurchaseDate] = useState(getVietnamDateKey(new Date()));
  const [sentDate, setSentDate] = useState(getVietnamDateKey(new Date()));
  const [warrantyLocation, setWarrantyLocation] = useState('');
  const [carrierName, setCarrierName] = useState('');
  const [newCarrierName, setNewCarrierName] = useState('');
  const [editingCarrierName, setEditingCarrierName] = useState('');
  const [editingWarrantyCustomerId, setEditingWarrantyCustomerId] = useState('');
  const [editingWarrantyCustomerName, setEditingWarrantyCustomerName] = useState('');
  const [editingWarrantyCustomerAddress, setEditingWarrantyCustomerAddress] = useState('');
  const [editingWarrantyCustomerPhone, setEditingWarrantyCustomerPhone] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newLocationAddress, setNewLocationAddress] = useState('');
  const [newLocationPhone, setNewLocationPhone] = useState('');
  const [editingLocationName, setEditingLocationName] = useState('');
  const [notes, setNotes] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [locationNotes, setLocationNotes] = useState('');
  const [items, setItems] = useState([{ productId: '', name: '', quantity: 1, warranty: '', note: '' }]);
  const [filter, setFilter] = useState('PENDING');
  const [rowsPerPage, setRowsPerPage] = useState('10');
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [sortField, setSortField] = useState('sentAt');
  const [paperSize, setPaperSize] = useState(storeConfig.warrantyPrintSize || 'A4');
  const locations = Array.isArray(storeConfig.warrantyLocations) ? storeConfig.warrantyLocations : [];
  const carriers = Array.isArray(storeConfig.warrantyCarriers) ? storeConfig.warrantyCarriers : [];
  const warrantyAddedCustomers = (customers || []).filter(c => c.warrantyCardCreated === true);
  const locationName = l => typeof l === 'string' ? l : (l?.name || '');
  const selectedLocation = locations.find(l => locationName(l) === warrantyLocation);
  // Chỉ lấy khách hàng từ phiếu thẻ khách hàng còn đang bảo hành; phiếu đã hoàn thành không xuất hiện.
  const activeCustomerWarrantyRequests = (warrantyRequests || []).filter(w =>
    w.customerName && w.status !== 'COMPLETED' &&
    (w.recordType === 'customer' || (!w.recordType && !w.supplierName))
  );
  const relatedCustomerOptions = [...activeCustomerWarrantyRequests.reduce((map, w) => {
    const key = String(w.customerName || '').trim().toLocaleLowerCase('vi');
    if (!key) return map;
    if (!map.has(key)) map.set(key, { name: String(w.customerName || '').trim(), address: w.customerAddress || '', phone: w.phone || '', items: [] });
    const customer = map.get(key);
    if (!customer.address && w.customerAddress) customer.address = w.customerAddress;
    if (!customer.phone && w.phone) customer.phone = w.phone;
    customer.items.push(...(w.items || []).map(it => ({ ...it, quantity: it.quantity || 1 })));
    return map;
  }, new Map()).values()];
  const linkedCustomerNames = new Set((warrantyRequests || [])
    .filter(w => w.id !== editingId && w.customerName && (w.recordType === 'location' || (!w.recordType && w.supplierName)))
    .map(w => String(w.customerName).trim().toLocaleLowerCase('vi')));
  const availableRelatedCustomers = relatedCustomerOptions.filter(c =>
    !linkedCustomerNames.has(String(c.name || '').trim().toLocaleLowerCase('vi')) ||
    String(c.name || '').trim().toLocaleLowerCase('vi') === String(customerName || '').trim().toLocaleLowerCase('vi')
  );
  const updateItem = (idx, key, value) => setItems(prev => prev.map((it,i)=>i===idx?{...it,[key]:value}:it));
  const resetForm = () => {
    setEditingId(null); setRecordType('customer'); setCustomerName(''); setCustomerAddress(''); setPhone('');
    setSupplierName(''); setSupplierAddress(''); setSupplierPhone(''); setSaleDate(getVietnamDateKey(new Date())); setPurchaseDate(getVietnamDateKey(new Date()));
    setSentDate(getVietnamDateKey(new Date())); setWarrantyLocation(''); setCarrierName(''); setNewCarrierName(''); setNotes('');
    setCustomerNotes(''); setLocationNotes(''); setItems([{productId:'',name:'',quantity:1,warranty:'',note:''}]);
  };
  const addCarrier = async (value) => {
    const name = String(value ?? newCarrierName).trim();
    if (!name) return showToast('Vui lòng nhập tên nhà vận chuyển', 'error');
    const found = carriers.find(c => String(typeof c === 'string' ? c : c?.name || '').trim().toLocaleLowerCase('vi') === name.toLocaleLowerCase('vi'));
    const next = editingCarrierName ? carriers.map(c => String(typeof c === 'string' ? c : c?.name || '') === editingCarrierName ? { ...(typeof c === 'object' ? c : {}), name } : c) : (found ? carriers : [...carriers, { name, createdAt: new Date().toISOString(), warrantyCardCreated: true }]);
    try {
      await setDoc(doc(db, 'stores', storeId), { warrantyCarriers: next }, { merge: true });
      setCarrierName(name); setNewCarrierName(''); setEditingCarrierName('');
      showToast(editingCarrierName ? 'Đã sửa nhà vận chuyển' : (found ? 'Đã chọn nhà vận chuyển đã lưu' : 'Đã thêm nhà vận chuyển'));
    } catch (e) { showToast('Không lưu được nhà vận chuyển', 'error'); }
  };
  const editWarrantyCarrier = (carrier) => { const name = String(typeof carrier === 'string' ? carrier : carrier?.name || ''); setEditingCarrierName(name); setNewCarrierName(name); };
  const deleteWarrantyCarrier = async (carrier) => {
    const name = String(typeof carrier === 'string' ? carrier : carrier?.name || '');
    if (!name || !window.confirm(`Xóa nhà vận chuyển “${name}” khỏi danh mục riêng của thẻ bảo hành? Phiếu đã lưu không bị xóa.`)) return;
    try { await setDoc(doc(db, 'stores', storeId), { warrantyCarriers: carriers.filter(c => String(typeof c === 'string' ? c : c?.name || '') !== name) }, { merge: true }); if (carrierName === name) setCarrierName(''); if (editingCarrierName === name) { setEditingCarrierName(''); setNewCarrierName(''); } showToast('Đã xóa nhà vận chuyển khỏi thẻ bảo hành'); } catch(e) { showToast('Không xóa được nhà vận chuyển', 'error'); }
  };
  const editWarrantyCustomer = (customer) => { setEditingWarrantyCustomerId(customer.id); setEditingWarrantyCustomerName(customer.name || ''); setEditingWarrantyCustomerAddress(customer.address || ''); setEditingWarrantyCustomerPhone(customer.phone || ''); };
  const saveWarrantyCustomerEdit = async () => { if (!editingWarrantyCustomerName.trim()) return showToast('Vui lòng nhập tên khách hàng', 'error'); try { await updateDoc(doc(db, 'stores', storeId, 'customers', editingWarrantyCustomerId), { name: editingWarrantyCustomerName.trim(), address: editingWarrantyCustomerAddress.trim(), phone: editingWarrantyCustomerPhone.trim() }); if (customerName === customers.find(c => c.id === editingWarrantyCustomerId)?.name) { setCustomerName(editingWarrantyCustomerName.trim()); setCustomerAddress(editingWarrantyCustomerAddress.trim()); setPhone(editingWarrantyCustomerPhone.trim()); } setEditingWarrantyCustomerId(''); showToast('Đã sửa khách hàng được tạo từ thẻ bảo hành'); } catch(e) { showToast('Không sửa được khách hàng', 'error'); } };
  const deleteWarrantyCustomer = async (customer) => { if (!window.confirm(`Xóa khách hàng “${customer.name}” được tạo từ thẻ bảo hành?`)) return; try { await deleteDoc(doc(db, 'stores', storeId, 'customers', customer.id)); if (customerName === customer.name) { setCustomerName(''); setCustomerAddress(''); setPhone(''); } if (editingWarrantyCustomerId === customer.id) setEditingWarrantyCustomerId(''); showToast('Đã xóa khách hàng khỏi dữ liệu được tạo từ thẻ bảo hành'); } catch(e) { showToast('Không xóa được khách hàng', 'error'); } };
  const addLocation = async () => {
    const name = newLocation.trim();
    if (!name || !newLocationAddress.trim() || !newLocationPhone.trim()) {
      return showToast('Vui lòng nhập tên, địa chỉ và số điện thoại nơi bảo hành','error');
    }
    const next = [...locations.filter(l => locationName(l) !== (editingLocationName || name) && locationName(l) !== name), { name, address: newLocationAddress.trim(), phone: newLocationPhone.trim() }];
    try {
      await setDoc(doc(db,'stores',storeId), { warrantyLocations: next }, { merge:true });
      if (warrantyLocation === editingLocationName) setWarrantyLocation(name);
      setWarrantyLocation(name); setNewLocation(''); setNewLocationAddress(''); setNewLocationPhone(''); setEditingLocationName('');
      showToast(editingLocationName ? 'Đã cập nhật nơi bảo hành' : 'Đã thêm nơi bảo hành');
    } catch(e) { showToast('Không lưu được nơi bảo hành','error'); }
  };
  const editWarrantyLocation = (location) => {
    setEditingLocationName(locationName(location));
    setNewLocation(locationName(location));
    setNewLocationAddress(location?.address || '');
    setNewLocationPhone(location?.phone || '');
  };
  const deleteWarrantyLocation = async (location) => {
    const name = locationName(location);
    if (!window.confirm(`Xóa nơi bảo hành “${name}”? Các phiếu bảo hành đã lưu không bị xóa.`)) return;
    try {
      await setDoc(doc(db, 'stores', storeId), { warrantyLocations: locations.filter(l => locationName(l) !== name) }, { merge: true });
      if (warrantyLocation === name) setWarrantyLocation('');
      if (editingLocationName === name) { setEditingLocationName(''); setNewLocation(''); setNewLocationAddress(''); setNewLocationPhone(''); }
      showToast('Đã xóa nơi bảo hành');
    } catch(e) { showToast('Không xóa được nơi bảo hành','error'); }
  };
  const closeQuickAdd = () => { setQuickAddType(''); setQuickAddName(''); setQuickAddAddress(''); setQuickAddPhone(''); };
  const saveQuickAdd = async () => {
    const name = quickAddName.trim();
    if (!name) return showToast('Vui lòng nhập tên trước khi thêm mới', 'error');
    try {
      if (quickAddType === 'customer') {
        const found = customers.find(c => (c.name || '').trim().toLowerCase() === name.toLowerCase());
        let saved = found;
        if (!found) {
          const ref = await addDoc(collection(db, 'stores', storeId, 'customers'), { name, address: quickAddAddress.trim(), phone: quickAddPhone.trim(), totalDebt: 0, createdAt: new Date().toISOString(), warrantyCardCreated: true });
          saved = { id: ref.id, name, address: quickAddAddress.trim(), phone: quickAddPhone.trim() };
        }
        setCustomerName(saved.name); setCustomerAddress(saved.address || ''); setPhone(saved.phone || '');
      } else if (quickAddType === 'supplier') {
        const found = suppliers.find(c => (c.name || '').trim().toLowerCase() === name.toLowerCase());
        let saved = found;
        if (!found) {
          const ref = await addDoc(collection(db, 'stores', storeId, 'suppliers'), { name, address: quickAddAddress.trim(), phone: quickAddPhone.trim(), totalDebt: 0, createdAt: new Date().toISOString() });
          saved = { id: ref.id, name, address: quickAddAddress.trim(), phone: quickAddPhone.trim() };
        }
        setSupplierName(saved.name); setSupplierAddress(saved.address || ''); setSupplierPhone(saved.phone || '');
        setWarrantyLocation(saved.name);
      } else if (quickAddType === 'product') {
        const found = products.find(p => (p.name || '').trim().toLowerCase() === name.toLowerCase());
        let saved = found;
        if (!found) {
          const ref = await addDoc(collection(db, 'stores', storeId, 'products'), { name, category: '', cost: 0, price: 0, stock: 0, createdAt: new Date().toISOString() });
          saved = { id: ref.id, name };
        }
        setItems(prev => prev.map((it, i) => i === quickAddProductIndex ? { ...it, productId: saved.id || '', name: saved.name } : it));
      } else if (quickAddType === 'location') {
        if (!quickAddAddress.trim() || !quickAddPhone.trim()) return showToast('Vui lòng nhập địa chỉ và số điện thoại nơi nhận bảo hành', 'error');
        const found = locations.find(l => locationName(l).trim().toLowerCase() === name.toLowerCase());
        const next = found ? locations : [...locations, { name, address: quickAddAddress.trim(), phone: quickAddPhone.trim() }];
        if (!found) await setDoc(doc(db, 'stores', storeId), { warrantyLocations: next }, { merge: true });
        setWarrantyLocation(name);
      }
      showToast('Đã thêm/chọn dữ liệu'); closeQuickAdd();
    } catch (err) { showToast('Không thể thêm dữ liệu. Vui lòng thử lại', 'error'); }
  };
  const saveRequest = async (e) => {
    e.preventDefault();
    if (recordType === 'customer' && !customerName.trim()) return showToast('Vui lòng nhập tên khách hàng','error');
    if (recordType === 'location' && !customerName.trim()) return showToast('Vui lòng chọn khách hàng đã nhận bảo hành','error');
    if (recordType === 'location' && !warrantyLocation.trim()) return showToast('Vui lòng chọn nơi nhận bảo hành','error');
    const cleanItems = items.filter(it=>String(it.name||'').trim()).map(it=>({...it, name:it.name.trim(), quantity:Math.max(1,Number(it.quantity)||1)}));
    if (!cleanItems.length) return showToast('Vui lòng thêm ít nhất một sản phẩm','error');
    const now = new Date().toISOString();
    const location = locations.find(l=>locationName(l)===warrantyLocation) || suppliers.find(l=>l.name===warrantyLocation);
    const existingRequest = (warrantyRequests || []).find(w => w.id === editingId);
    const linkedCustomerRequest = !editingId && recordType === 'location' ? (warrantyRequests || []).filter(w => (w.recordType === 'customer' || (!w.recordType && !w.supplierName)) && w.status !== 'COMPLETED' && String(w.customerName || '').trim().toLocaleLowerCase('vi') === customerName.trim().toLocaleLowerCase('vi')).sort((a,b)=>new Date(b.createdAt || 0)-new Date(a.createdAt || 0))[0] : null;
    const requestToUpdate = existingRequest || linkedCustomerRequest;
    const payload = {
      recordType, customerName: customerName.trim(),
      createdByName: requestToUpdate?.createdByName || auth.currentUser?.displayName || auth.currentUser?.email || 'Không rõ tài khoản',
      createdByUid: requestToUpdate?.createdByUid || auth.currentUser?.uid || '',
      customerAddress: recordType === 'customer' ? customerAddress.trim() : (requestToUpdate?.customerAddress || customerAddress.trim()),
      phone: recordType === 'customer' ? phone.trim() : (requestToUpdate?.phone || phone.trim()),
      supplierName: '',
      supplierAddress: '',
      supplierPhone: '',
      warrantyLocation: recordType === 'location' ? warrantyLocation : '',
      carrierName: recordType === 'location' ? carrierName.trim() : (requestToUpdate?.carrierName || ''),
      warrantyLocationAddress: recordType === 'location' && typeof location === 'object' ? location.address || '' : '',
      warrantyLocationPhone: recordType === 'location' && typeof location === 'object' ? location.phone || '' : '',
      saleDate: recordType === 'customer' ? (saleDate || '') : (requestToUpdate?.saleDate || saleDate || ''),
      purchaseDate: recordType === 'location' ? (purchaseDate || '') : (requestToUpdate?.purchaseDate || purchaseDate || ''),
      sentAt: sentDate ? (() => { const parts = getVietnamDateParts(new Date()); return new Date(`${sentDate}T${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}:${String(parts.second).padStart(2, '0')}+07:00`).toISOString(); })() : now,
      notes: recordType === 'customer' ? customerNotes.trim() : locationNotes.trim(), customerNotes: recordType === 'customer' ? customerNotes.trim() : (requestToUpdate?.customerNotes || ''), locationNotes: recordType === 'location' ? locationNotes.trim() : (requestToUpdate?.locationNotes || ''),
      items: cleanItems, updatedAt: now
    };
    try {
      let savedRequestId = editingId || linkedCustomerRequest?.id || '';
      if (editingId || linkedCustomerRequest) {
        await updateDoc(doc(db,'stores',storeId,'warrantyRequests',savedRequestId), payload);
        showToast(linkedCustomerRequest ? 'Đã cập nhật phiếu khách hàng thành phiếu gửi bảo hành' : 'Đã cập nhật phiếu bảo hành');
      } else {
        const savedRef = await addDoc(collection(db,'stores',storeId,'warrantyRequests'), { ...payload, status:'PENDING', createdAt:now, completedAt:null });
        savedRequestId = savedRef.id;
        showToast('Đã lập phiếu gửi bảo hành');
      }
      if (recordType === 'location') setPrintTarget({ ...payload, id: savedRequestId, warrantyCode: existingRequest?.warrantyCode || linkedCustomerRequest?.warrantyCode || '' });
      resetForm(); setShowForm(false);
    } catch(e) { showToast('Lỗi lưu phiếu bảo hành','error'); }
  };
  const editRequest = w => {
    setEditingId(w.id); setRecordType(w.recordType || (w.supplierName && !w.customerName ? 'location' : 'customer'));
    setCustomerName(w.customerName || ''); setCustomerAddress(w.customerAddress || ''); setPhone(w.phone || '');
    setSupplierName(w.supplierName || ''); setSupplierAddress(w.supplierAddress || ''); setSupplierPhone(w.supplierPhone || '');
    setSaleDate((w.saleDate || '').slice(0,10) || getVietnamDateKey(new Date()));
    setPurchaseDate((w.purchaseDate || '').slice(0,10) || getVietnamDateKey(new Date()));
    setSentDate((w.sentAt || w.createdAt) ? getVietnamDateKey(new Date(w.sentAt || w.createdAt)) : getVietnamDateKey(new Date()));
    setWarrantyLocation(w.warrantyLocation || ''); setCarrierName(w.carrierName || ''); setNewCarrierName(''); setNotes(w.notes || '');
    setCustomerNotes(w.customerNotes || ((w.recordType || 'customer') === 'customer' ? (w.notes || '') : '')); setLocationNotes(w.locationNotes || ((w.recordType || 'customer') === 'location' ? (w.notes || '') : ''));
    setItems((w.items || []).map(it=>({...it, quantity:it.quantity || 1})).concat([]).length ? (w.items || []).map(it=>({...it, quantity:it.quantity || 1})) : [{productId:'',name:'',quantity:1,warranty:'',note:''}]);
    setShowForm(true);
  };
  const completeRequest = async (w) => {
    if (!window.confirm(`Xác nhận đã nhận hàng bảo hành của phiếu ${w.customerName || w.supplierName || ''}?`)) return;
    try { await updateDoc(doc(db,'stores',storeId,'warrantyRequests',w.id), { status:'COMPLETED', completedAt:new Date().toISOString() }); showToast('Đã hoàn thành phiếu bảo hành'); }
    catch(e) { showToast('Không cập nhật được phiếu','error'); }
  };
  const toggleWarrantyStatus = async (w) => {
    const nextStatus = w.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    const ids = w.groupedRequestIds || [w.id];
    try {
      await Promise.all(ids.map(id => updateDoc(doc(db, 'stores', storeId, 'warrantyRequests', id), {
        status: nextStatus,
        ...(nextStatus === 'COMPLETED' ? { completedAt: new Date().toISOString() } : { completedAt: null })
      })));
      showToast(nextStatus === 'COMPLETED' ? 'Đã chuyển sang đã bảo hành' : 'Đã chuyển lại đang bảo hành');
    } catch (e) { showToast('Không cập nhật được trạng thái bảo hành', 'error'); }
  };
  const deleteRequest = async (w) => {
    const displayName = w.customerName || w.supplierName || w.warrantyLocation || 'phiếu bảo hành';
    if (!window.confirm(`Bạn có chắc muốn xóa phiếu bảo hành của ${displayName}? Thao tác này không thể hoàn tác.`)) return;
    try {
      await deleteDoc(doc(db, 'stores', storeId, 'warrantyRequests', w.id));
      if (editingId === w.id) { resetForm(); setShowForm(false); }
      showToast('Đã xóa phiếu bảo hành');
    } catch (e) {
      showToast('Không xóa được phiếu bảo hành', 'error');
    }
  };
  const printRequest = (w, printMode = 'customer', printOptions = {}) => {
    const cfg = storeConfig[`warrantyPrint${paperSize}`] || storeConfig[paperSize] || {};
    const showDate = printOptions.showDate !== undefined ? printOptions.showDate : cfg.printShowDate !== false;
    const showDuration = printOptions.showDuration !== undefined ? printOptions.showDuration : cfg.printShowWarrantyDuration !== false;
    const showNotes = cfg.printShowNote !== false;
    const showLogo = printOptions.showLogo !== false && cfg.printShowLogo === true && storeConfig.printTopLogoEnabled === true && storeConfig.logo;
    const showCompany = cfg.printShowStoreName !== false;
    const showCompanyAddress = cfg.printShowStoreAddress !== false;
    const showCompanyPhone = cfg.printShowStorePhone !== false;
    const printStoreName = cfg.printStoreName ?? storeConfig.name;
    const printStoreAddress = cfg.printStoreAddress ?? storeConfig.address;
    const printStorePhone = cfg.printStorePhone ?? storeConfig.phone;
    const dateValue = printMode === 'customer' ? (w.saleDate || '') : (w.purchaseDate || '');
    const width = paperSize === 'A5' ? '148mm' : '210mm';
    const safe = v => String(v ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const personName = printMode === 'customer' ? (w.customerName || '') : (w.warrantyLocation || w.supplierName || '');
    const personAddress = printMode === 'customer' ? (w.customerAddress || '') : (w.warrantyLocationAddress || w.supplierAddress || '');
    const personPhone = printMode === 'customer' ? (w.phone || '') : (w.warrantyLocationPhone || w.supplierPhone || '');
    const visibleNote = printMode === 'customer' ? (w.customerNotes || w.notes || '') : (w.locationNotes || '');
    const rows = (w.items||[]).map((it,i)=>`<tr><td>${i+1}</td><td>${safe(it.name)}</td><td>${showDate?safe(((printMode==='customer' ? (it.saleDate || dateValue) : (it.purchaseDate || dateValue))) ? formatDateOnly(printMode==='customer' ? (it.saleDate || dateValue) : (it.purchaseDate || dateValue)) : '—'):'—'}</td><td>${showDuration?safe(it.warranty||'—'):'—'}</td><td>${showNotes?safe(it.note||''):''}</td></tr>`).join('');
    const win = window.open('','_blank'); if(!win) return;
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>PHIẾU BẢO HÀNH</title><style>@page{size:${paperSize};margin:12mm}*{box-sizing:border-box}body{position:relative;isolation:isolate;font-family:Arial,sans-serif;font-size:${Number(cfg.printFontSize)||12}px;color:#111;width:100%;max-width:${width};margin:0 auto}body:before{content:'';position:absolute;top:0;left:0;width:100%;height:100%;z-index:0;pointer-events:none;background-image:${storeConfig.logo && storeConfig.watermarkLogoEnabled !== false ? `url('${safe(storeConfig.logo)}')` : 'none'};background-repeat:no-repeat;background-position:center center;background-size:${Math.max(20,Math.min(100,Number(storeConfig.watermarkLogoSize)||55))}%;opacity:${Math.max(0.03,Math.min(0.4,Number(storeConfig.watermarkLogoOpacity ?? 0.12)))};-webkit-print-color-adjust:exact;print-color-adjust:exact}.company{display:flex;align-items:center;gap:16px;border-bottom:1px dashed #777;padding-bottom:12px}.logo{width:${Number(cfg.printLogoWidth)||100}px;height:${Number(cfg.printLogoHeight)||75}px;max-width:100%;object-fit:contain}.company-info{flex:1}.company-info h3{margin:0 0 5px;font-size:calc(1.25em + ${(Number(cfg.fsStoreNameOffset)||0)}px);transform:translateX(${Number(cfg.storeNameXOffset||0)}px)}.company-info .company-address{transform:translateX(${Number(cfg.storeAddressXOffset||0)}px)}.company-info .company-phone{transform:translateX(${Number(cfg.storePhoneXOffset||0)}px)}.company-info p{margin:3px 0}h2{text-align:center;margin:18px 0 20px;font-size:1.5em}.meta p{margin:7px 0}table{width:100%;border-collapse:collapse;margin-top:18px;table-layout:fixed}th,td{border:1px solid #555;padding:${Number(cfg.printTablePaddingX ?? 7)}px;text-align:left;overflow-wrap:anywhere;font-size:${(Number(cfg.printFontSize)||12)*(Number(cfg.printDetailFontScale||100)/100)}px}th{text-align:center;background:#f2f2f2}th:first-child,td:first-child{width:8%;text-align:center}th:nth-child(3),td:nth-child(3){width:22%}th:nth-child(4),td:nth-child(4){width:18%}.sign{display:flex;justify-content:space-between;margin-top:55px;text-align:center}.sign div{width:40%}@media print{body{max-width:none}}</style></head><body>
    ${(showLogo || showCompany || (showCompanyAddress && printStoreAddress) || (showCompanyPhone && printStorePhone)) ? `<header class="company">${showLogo?`<img class="logo" style="width:${Number(cfg.printLogoWidth)||100}px;height:${Number(cfg.printLogoHeight)||75}px;max-width:100%;object-fit:contain" src="${safe(storeConfig.logo)}" alt="Logo">`:''}<div class="company-info">${showCompany?`<h3>${safe(printStoreName || 'QUẢN LÝ BÁN HÀNG')}</h3>`:''}${showCompanyAddress&&printStoreAddress?`<p class="company-address">${safe(cfg.printAddressLabel || 'Địa chỉ')}: ${safe(printStoreAddress)}</p>`:''}${showCompanyPhone&&printStorePhone?`<p class="company-phone">${safe(cfg.printPhoneLabel || 'Số điện thoại')}: ${safe(printStorePhone)}</p>`:''}</div></header>`:''}
    <h2>${safe(cfg.printInvoiceTitle || (printMode==='customer'?'PHIẾU NHẬN BẢO HÀNH / SỬA CHỮA':'PHIẾU GỞI BẢO HÀNH / SỬA CHỮA'))}</h2>${printMode==='customer'?`<p style="text-align:center;margin:-12px 0 16px;font-size:${(Number(cfg.printFontSize)||12)+(Number(cfg.fsMetaOffset)||0)}px">Ngày lập phiếu: ${safe(formatDateOnly(w.createdAt || w.sentAt || new Date()))}</p>`:''}<div class="meta"><p><b>Mã phiếu:</b> ${safe(w.warrantyCode || ('BH'+String(w.id||'').slice(-8).toUpperCase()))}</p><p><b>Thời gian gửi:</b> ${safe(w.sentAt?formatDateOnly(w.sentAt):'—')}</p><p><b>${printMode==='customer'?'Khách hàng':'Nơi nhận'}:</b> ${safe(personName)}</p>${personAddress?`<p><b>Địa chỉ:</b> ${safe(personAddress)}</p>`:''}${personPhone?`<p><b>Số điện thoại:</b> ${safe(personPhone)}</p>`:''}${visibleNote?`<p><b>Ghi chú:</b> ${safe(visibleNote)}</p>`:''}</div>
    <table><thead><tr><th>STT</th><th>Sản phẩm</th><th>${printMode==='customer'?'Thời gian đã bán':'Thời gian nhập'}</th><th>Thời gian bảo hành</th><th>${showNotes?'Ghi chú':''}</th></tr></thead><tbody>${rows}</tbody></table><div class="sign"><div>${printMode==='customer'?'Khách hàng':'Người gửi'}<br><br><br>(Ký, ghi rõ họ tên)</div><div>${printMode==='customer'?'Người tiếp nhận':'Nơi nhận bảo hành'}<br><br><br>(Ký, ghi rõ họ tên)</div></div>${cfg.printFooter?`<p style="text-align:center;margin-top:20px">${safe(cfg.printFooter)}</p>`:''}<script>window.onload=()=>window.print()</script></body></html>`);
    win.document.close();
  };
  const pendingShippingLabelRequests = [...(warrantyRequests || [])]
    .filter(w => w.status !== 'COMPLETED' && (
      w.recordType === 'location' || (!w.recordType && Boolean(w.warrantyLocation || w.supplierName))
    ))
    .sort((a, b) => new Date(b.sentAt || b.createdAt || b.updatedAt || 0) - new Date(a.sentAt || a.createdAt || a.updatedAt || 0));
  const printShippingLabels = (requests) => {
    const list = (requests || []).slice(0, 4);
    if (!list.length) return showToast('Vui lòng chọn ít nhất một đơn gửi bảo hành chưa hoàn thành', 'error');
    const safe = v => String(v ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const labelCfg = storeConfig[`warrantyPrint${paperSize}`] || storeConfig[paperSize] || {};
    const senderName = labelCfg.printStoreName ?? storeConfig.name ?? storeConfig.storeName ?? 'CTY TNHH TIN HỌC ÂU TRÙNG';
    const senderAddress = labelCfg.printStoreAddress ?? storeConfig.address ?? '';
    const senderPhone = labelCfg.printStorePhone ?? storeConfig.phone ?? storeConfig.mobile ?? '';
    const addressLabel = labelCfg.printAddressLabel || 'Địa chỉ';
    const phoneLabel = labelCfg.printPhoneLabel || 'Điện thoại';
    const showSenderName = labelCfg.printShowStoreName !== false;
    const showSenderAddress = labelCfg.printShowStoreAddress !== false;
    const showSenderPhone = labelCfg.printShowStorePhone !== false;
    const labels = list.map(w => {
      const location = locations.find(l => locationName(l) === (w.warrantyLocation || '')) || suppliers.find(l => (l.name || '') === (w.warrantyLocation || '')) || {};
      const recipientName = w.warrantyLocation || w.supplierName || location.name || '';
      const recipientAddress = w.warrantyLocationAddress || w.supplierAddress || location.address || '';
      const recipientPhone = w.warrantyLocationPhone || w.supplierPhone || location.phone || '';
      if (!recipientName) return null;
      return `<section class="label"><div class="row"><div class="tag">NƠI<br>GỬI</div><div class="details">${showSenderName ? `<div class="name">${safe(senderName)}</div>` : ''}${showSenderAddress && senderAddress ? `<div class="detail">${safe(addressLabel)}: ${safe(senderAddress)}</div>` : ''}${showSenderPhone && senderPhone ? `<div class="detail">${safe(phoneLabel)}: ${safe(senderPhone)}</div>` : ''}</div></div><div class="row"><div class="tag">NƠI<br>NHẬN</div><div class="details"><div class="name">${safe(recipientName)}</div>${recipientAddress ? `<div class="detail">${safe(recipientAddress).replace(/\r?\n/g, '<br>')}</div>` : `<div class="detail">Địa chỉ: ................................................................</div>`}${recipientPhone ? `<div class="detail">${safe(phoneLabel)}: ${safe(recipientPhone)}</div>` : `<div class="detail">${safe(phoneLabel)}: ........................................</div>`}</div></div><div class="warning">HÀNG DỄ VỠ XIN NHẸ TAY, CÁM ƠN !!!</div></section>`;
    });
    if (labels.some(x => x === null)) return showToast('Có đơn gửi bảo hành chưa có tên nơi nhận. Vui lòng bổ sung trước khi in.', 'error');
    const win = window.open('', '_blank');
    if (!win) return showToast('Trình duyệt đã chặn cửa sổ in. Vui lòng cho phép cửa sổ bật lên rồi thử lại.', 'error');
    const labelMarkup = labels.join('<div class=\"cut-line\" aria-hidden=\"true\"></div>');
    win.document.write(`<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Những nhãn gửi bảo hành</title><style>
      @page{size:A4 portrait;margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0;color:#000;font-family:Arial,Helvetica,sans-serif}.sheet{width:210mm;margin:0 auto;padding-top:10mm;box-sizing:border-box}.label{width:190mm;margin:0 auto;border:0.3mm solid #777;display:flex;flex-direction:column;overflow:visible;break-inside:avoid;page-break-inside:avoid}.row{display:grid;grid-template-columns:21% 79%;border-bottom:0.25mm solid #999;min-height:0}.row:last-of-type{border-bottom:0}.tag{border-right:0.25mm solid #999;display:flex;align-items:center;justify-content:center;text-align:center;font-size:17pt;font-weight:700;padding:3mm;line-height:1.1}.details{padding:3mm 4mm;display:flex;flex-direction:column;justify-content:center;gap:1.5mm;min-width:0}.name{font-size:17pt;line-height:1.15;font-weight:700;text-transform:uppercase;overflow-wrap:anywhere;word-break:normal;margin-bottom:0.5mm}.detail{font-size:11pt;line-height:1.25;overflow-wrap:anywhere;word-break:normal}.warning{min-height:11mm;display:flex;align-items:center;justify-content:center;text-align:center;padding:2mm;font-size:15pt;line-height:1.15;font-weight:700;border-top:0.25mm solid #999;overflow-wrap:anywhere}.cut-line{height:20mm;position:relative;break-inside:avoid;page-break-inside:avoid}.cut-line:after{content:"";position:absolute;left:0;right:0;top:50%;border-top:0.3mm dashed #555}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
      </style></head><body><main class="sheet">${labelMarkup}</main><script>window.onload=()=>window.print()</script></body></html>`);
    win.document.close();
  };
  const printShippingLabel = (w) => printShippingLabels([w]);
  const filtered = (warrantyRequests||[]).filter((w, idx)=>(filter==='ALL'||(filter==='PENDING'?w.status!=='COMPLETED':w.status==='COMPLETED')) && `${idx+1} ${w.customerName||''} ${w.phone||''} ${w.supplierName||''} ${w.supplierPhone||''} ${w.warrantyLocation||''} ${(w.items||[]).map(it=>it.name).join(' ')} ${w.notes||''} ${w.id||''}`.toLowerCase().includes(search.toLowerCase())).sort((a,b)=>{
    const getValue = w => sortField==='customerName' ? (w.customerName || w.supplierName || '') : sortField==='warrantyLocation' ? (w.warrantyLocation || '') : sortField==='items' ? (w.items||[]).map(it=>it.name||'').join(', ') : sortField==='notes' ? (w.notes||w.customerNotes||w.locationNotes||'') : sortField==='status' ? (w.status==='COMPLETED'?'Đã hoàn thành':'Đang bảo hành') : (w.sentAt || w.createdAt || '');
    const av=getValue(a), bv=getValue(b);
    const cmp = sortField==='sentAt' ? new Date(av||0)-new Date(bv||0) : String(av).localeCompare(String(bv),'vi',{numeric:true,sensitivity:'base'});
    return sortOrder==='asc' ? cmp : -cmp;
  });
  // Gộp các phiếu nhận bảo hành của cùng một khách thành một dòng hiển thị;
  // không xóa hay sửa các phiếu gốc trong Firebase. Sản phẩm của các phiếu được gom để dùng khi gửi nơi nhận.
  const groupedFiltered = [...filtered.reduce((map, w) => {
    const type = w.recordType || (w.supplierName ? 'location' : 'customer');
    const key = [type, String(w.customerName || w.supplierName || '').trim().toLocaleLowerCase('vi'), w.status || 'PENDING', type === 'location' ? (w.warrantyLocation || '') : ''].join('|');
    if (!map.has(key)) map.set(key, { ...w, items: [...(w.items || [])], groupedRequestIds: [w.id], groupedRequests: [w] });
    else {
      const group = map.get(key);
      group.groupedRequestIds.push(w.id);
      group.groupedRequests.push(w);
      group.items.push(...(w.items || []));
      if (new Date(w.sentAt || w.createdAt || 0) < new Date(group.sentAt || group.createdAt || 0)) {
        group.sentAt = w.sentAt || group.sentAt;
        group.createdAt = w.createdAt || group.createdAt;
      }
    }
    return map;
  }, new Map()).values()];
  const visible = rowsPerPage==='all'?groupedFiltered:groupedFiltered.slice(0,Number(rowsPerPage)||10);
  if (activeWarrantySection === 'quotes') return <WarrantyQuoteManager products={products} customers={customers} storeConfig={storeConfig} db={db} storeId={storeId} showToast={showToast} onBack={()=>setActiveWarrantySection('warranty')} />;
  return <div className="flex-1 flex flex-col p-4 md:p-6 bg-gray-50 overflow-hidden h-full">
    <div className="flex flex-col sm:flex-row justify-between gap-3 mb-4"><div><h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><ShieldAlert className="text-purple-600"/> Bảo hành</h2><p className="text-sm text-gray-500">Lập, chỉnh sửa, in lại phiếu bảo hành theo thẻ khách hàng hoặc nơi nhận bảo hành.</p></div><div className="flex flex-wrap gap-2"><button onClick={()=>setActiveWarrantySection('quotes')} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2"><FileText size={18}/>Báo giá</button><button onClick={()=>{if(showForm){resetForm();setShowForm(false)}else{resetForm();setShowForm(true)}}} className="bg-purple-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2"><Plus size={18}/>{showForm?'Đóng biểu mẫu':'Lập phiếu bảo hành'}</button></div></div>
    <section className="bg-white rounded-2xl border shadow-sm p-4 mb-4 space-y-3"><div><h3 className="text-lg font-bold text-gray-800">Địa chỉ bảo hành</h3><p className="text-sm text-gray-500">Quản lý tên, địa chỉ và số điện thoại nơi nhận bảo hành.</p></div><div className="grid grid-cols-1 md:grid-cols-3 gap-2"><input value={newLocation} onChange={e=>setNewLocation(e.target.value)} className="p-2 border rounded-lg" placeholder="Tên nơi bảo hành"/><input value={newLocationAddress} onChange={e=>setNewLocationAddress(e.target.value)} className="p-2 border rounded-lg" placeholder="Địa chỉ"/><input value={newLocationPhone} onChange={e=>setNewLocationPhone(e.target.value)} className="p-2 border rounded-lg" placeholder="Số điện thoại"/></div><div className="flex flex-wrap gap-2"><button type="button" onClick={addLocation} className="px-4 py-2 rounded-lg bg-purple-600 text-white font-bold">{editingLocationName?'Lưu chỉnh sửa':'Thêm nơi bảo hành'}</button>{editingLocationName&&<button type="button" onClick={()=>{setEditingLocationName('');setNewLocation('');setNewLocationAddress('');setNewLocationPhone('');}} className="px-4 py-2 rounded-lg border font-bold">Hủy sửa</button>}</div>{locations.length>0&&<div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-gray-100"><tr><th className="p-2">Tên nơi bảo hành</th><th className="p-2">Địa chỉ</th><th className="p-2">Số điện thoại</th><th className="p-2">Thao tác</th></tr></thead><tbody>{locations.map((loc,i)=><tr key={locationName(loc)||i} className="border-t"><td className="p-2 font-semibold">{locationName(loc)}</td><td className="p-2">{loc?.address||'—'}</td><td className="p-2">{loc?.phone||'—'}</td><td className="p-2"><div className="flex gap-2"><button type="button" onClick={()=>editWarrantyLocation(loc)} className="px-3 py-1 rounded border font-bold"><Edit size={13} className="inline mr-1"/>Sửa</button><button type="button" onClick={()=>deleteWarrantyLocation(loc)} className="px-3 py-1 rounded border border-blue-200 text-blue-600 font-bold"><Trash2 size={13} className="inline mr-1"/>Xóa</button></div></td></tr>)}</tbody></table></div>}</section>
    <section className="bg-white rounded-2xl border shadow-sm p-4 mb-4 space-y-4"><div><h3 className="text-lg font-bold">Sửa / xóa dữ liệu thêm mới trong thẻ bảo hành</h3><p className="text-sm text-gray-500">Chỉ quản lý mục được tạo mới từ thẻ bảo hành. Xóa danh mục không xóa phiếu đã lưu và không thay đổi thẻ khác.</p></div><div><h4 className="font-bold mb-2">Khách hàng thêm mới</h4>{warrantyAddedCustomers.length===0?<p className="text-sm text-gray-400">Chưa có khách hàng mới được đánh dấu là tạo từ thẻ bảo hành.</p>:warrantyAddedCustomers.map(c=><div key={c.id} className="border rounded-lg p-3 mb-2">{editingWarrantyCustomerId===c.id?<div className="grid grid-cols-1 md:grid-cols-3 gap-2"><input className="p-2 border rounded" value={editingWarrantyCustomerName} onChange={e=>setEditingWarrantyCustomerName(e.target.value)} placeholder="Tên"/><input className="p-2 border rounded" value={editingWarrantyCustomerAddress} onChange={e=>setEditingWarrantyCustomerAddress(e.target.value)} placeholder="Địa chỉ"/><input className="p-2 border rounded" value={editingWarrantyCustomerPhone} onChange={e=>setEditingWarrantyCustomerPhone(e.target.value)} placeholder="Số điện thoại"/><button type="button" onClick={saveWarrantyCustomerEdit} className="px-3 py-1 bg-purple-600 text-white rounded">Lưu</button><button type="button" onClick={()=>setEditingWarrantyCustomerId('')} className="px-3 py-1 border rounded">Hủy</button></div>:<div className="flex flex-wrap items-center justify-between gap-2"><div><b>{c.name}</b><div className="text-xs text-gray-500">{c.phone||'—'} · {c.address||'—'}</div></div><div className="flex gap-2"><button type="button" onClick={()=>editWarrantyCustomer(c)} className="px-3 py-1 border rounded">Sửa</button><button type="button" onClick={()=>deleteWarrantyCustomer(c)} className="px-3 py-1 border border-red-200 text-red-600 rounded">Xóa</button></div></div>}</div>)}</div><div><h4 className="font-bold mb-2">Nhà vận chuyển thêm mới</h4>{carriers.filter(c=>typeof c==='object'&&c?.warrantyCardCreated).length===0?<p className="text-sm text-gray-400">Chưa có nhà vận chuyển mới được đánh dấu là tạo từ thẻ bảo hành.</p>:carriers.filter(c=>typeof c==='object'&&c?.warrantyCardCreated).map((c,i)=><div key={c.name||i} className="flex items-center justify-between gap-2 border rounded-lg p-3 mb-2">{editingCarrierName===c.name?<div className="flex flex-1 gap-2"><input className="p-2 border rounded flex-1" value={newCarrierName} onChange={e=>setNewCarrierName(e.target.value)}/><button type="button" onClick={()=>addCarrier(newCarrierName)} className="px-3 py-1 bg-purple-600 text-white rounded">Lưu</button><button type="button" onClick={()=>{setEditingCarrierName('');setNewCarrierName('')}} className="px-3 py-1 border rounded">Hủy</button></div>:<><b>{c.name}</b><div className="flex gap-2"><button type="button" onClick={()=>editWarrantyCarrier(c)} className="px-3 py-1 border rounded">Sửa</button><button type="button" onClick={()=>deleteWarrantyCarrier(c)} className="px-3 py-1 border border-red-200 text-red-600 rounded">Xóa</button></div></>}</div>)}</div></section>
    {showForm&&<form onSubmit={saveRequest} className="bg-white p-4 rounded-2xl border shadow-sm mb-4 space-y-3 overflow-y-auto max-h-[55vh]">
      <div className="flex gap-2"><button type="button" onClick={()=>setRecordType('customer')} className={`px-4 py-2 rounded-lg font-bold ${recordType==='customer'?'bg-purple-600 text-white':'border'}`}>Thẻ khách hàng</button><button type="button" onClick={()=>setRecordType('location')} className={`px-4 py-2 rounded-lg font-bold ${recordType==='location'?'bg-blue-600 text-white':'border'}`}>Thẻ nơi gửi bảo hành</button></div>
      {recordType==='customer'?<div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div><label className="text-sm font-bold">Tên khách hàng</label><div className="mt-1 flex gap-2"><WarrantyAutocomplete value={customerName} options={customers} onChange={setCustomerName} onSelect={c=>{setCustomerName(c.name||'');setCustomerAddress(c.address||'');setPhone(c.phone||'');}} required placeholder="Gõ để tìm khách hàng đã lưu" className="min-w-0 w-full p-2 border rounded-lg font-normal"/><button type="button" onClick={()=>{setQuickAddType('customer');setQuickAddName(customerName);setQuickAddAddress(customerAddress);setQuickAddPhone(phone);}} className="px-3 rounded-lg border text-purple-700 font-bold whitespace-nowrap">+ Thêm mới</button></div></div><label className="text-sm font-bold">Số điện thoại khách hàng<input value={phone} onChange={e=>setPhone(e.target.value)} className="mt-1 w-full p-2 border rounded-lg font-normal" placeholder="Số điện thoại"/></label><label className="text-sm font-bold md:col-span-2">Địa chỉ khách hàng<input value={customerAddress} onChange={e=>setCustomerAddress(e.target.value)} className="mt-1 w-full p-2 border rounded-lg font-normal" placeholder="Địa chỉ"/></label></div>:<div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div className="md:col-span-2"><label className="text-sm font-bold">Khách hàng liên quan (chỉ quản lý, không in)</label><div className="mt-1"><WarrantyAutocomplete value={customerName} options={availableRelatedCustomers} onChange={value=>{setCustomerName(value);if(!value.trim()){setItems([{productId:'',name:'',quantity:1,warranty:'',note:''}]);}}} onSelect={c=>{setCustomerName(c.name||'');setCustomerAddress(c.address||'');setPhone(c.phone||'');const linkedItems=(c.items||[]).map(it=>({...it,quantity:it.quantity||1}));setItems(linkedItems.length?linkedItems:[{productId:'',name:'',quantity:1,warranty:'',note:''}]);}} placeholder="Bấm chọn khách hàng còn đang bảo hành" className="w-full p-2 border rounded-lg font-normal"/></div><p className="mt-1 text-xs text-gray-500">Chỉ hiện khách hàng có phiếu nhận bảo hành chưa hoàn thành. Chọn khách hàng sẽ tự điền các sản phẩm còn bảo hành.</p></div></div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3"><label className="text-sm font-bold">{recordType==='customer'?'Thời gian bán':'Thời gian nhập'}<input type="date" value={recordType==='customer'?saleDate:purchaseDate} onChange={e=>recordType==='customer'?setSaleDate(e.target.value):setPurchaseDate(e.target.value)} className="mt-1 w-full p-2 border rounded-lg font-normal"/></label><label className="text-sm font-bold">Thời gian gửi bảo hành<input type="date" value={sentDate} onChange={e=>setSentDate(e.target.value)} className="mt-1 w-full p-2 border rounded-lg font-normal"/></label>{recordType==='location'&&<><div><label className="text-sm font-bold">Nơi nhận bảo hành (gồm nhà cung cấp)</label><div className="mt-1 flex gap-2"><WarrantyAutocomplete value={warrantyLocation} options={[...locations.map(l=>({name:locationName(l),address:l?.address||'',phone:l?.phone||''})),...suppliers]} onChange={setWarrantyLocation} onSelect={l=>{setWarrantyLocation(l.name||locationName(l));setSupplierAddress(l.address||supplierAddress);setSupplierPhone(l.phone||supplierPhone);}} required placeholder="Bấm chọn hoặc gõ tên nơi bảo hành" className="min-w-0 w-full p-2 border rounded-lg font-normal"/><button type="button" onClick={()=>{setQuickAddType('location');setQuickAddName(newLocation);setQuickAddAddress(newLocationAddress);setQuickAddPhone(newLocationPhone);}} className="px-3 rounded-lg border text-purple-700 font-bold whitespace-nowrap">+ Thêm mới</button></div></div>
      <div className="md:col-span-2"><label className="text-sm font-bold">Nhà vận chuyển</label><div className="mt-1 flex gap-2"><input list="warranty-carrier-options" value={carrierName} onChange={e=>setCarrierName(e.target.value)} className="min-w-0 flex-1 p-2 border rounded-lg font-normal" placeholder="Bấm chọn hoặc gõ tên nhà vận chuyển"/><datalist id="warranty-carrier-options">{carriers.map((c,i)=><option key={i} value={typeof c==='string'?c:(c.name||'')}/>)}</datalist><button type="button" onClick={()=>addCarrier(carrierName)} className="px-3 rounded-lg border text-purple-700 font-bold whitespace-nowrap">+ Thêm mới</button></div><div className="mt-2 flex gap-2">{!carriers.some(c=>String(typeof c==='string'?c:c?.name||'').trim().toLocaleLowerCase('vi')===carrierName.trim().toLocaleLowerCase('vi'))&&carrierName.trim()&&<button type="button" onClick={()=>addCarrier(carrierName)} className="text-xs text-purple-700 underline">Lưu tên vừa nhập vào danh sách</button>}</div></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3 border rounded-xl bg-gray-50"><input value={newLocation} onChange={e=>setNewLocation(e.target.value)} className="p-2 border rounded-lg" placeholder="Tên nơi nhận bảo hành mới"/><input value={newLocationAddress} onChange={e=>setNewLocationAddress(e.target.value)} className="p-2 border rounded-lg" placeholder="Địa chỉ nơi nhận"/><div className="flex gap-2"><input value={newLocationPhone} onChange={e=>setNewLocationPhone(e.target.value)} className="min-w-0 flex-1 p-2 border rounded-lg" placeholder="Số điện thoại"/><button type="button" onClick={addLocation} className="bg-gray-800 text-white px-3 rounded-lg font-bold">Thêm</button></div></div>
      {selectedLocation&&typeof selectedLocation==='object'&&<p className="text-xs text-gray-500">Địa chỉ nơi nhận: {selectedLocation.address||'—'} · SĐT: {selectedLocation.phone||'—'}</p>}</>}</div>
      <div className="space-y-2"><div className="flex justify-between items-center"><h3 className="font-bold">Chi tiết sản phẩm</h3><button type="button" onClick={()=>setItems(prev=>[...prev,{productId:'',name:'',quantity:1,warranty:'',note:''}])} className="text-purple-700 font-bold text-sm">+ Thêm dòng</button></div>{items.map((it,idx)=><div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-2 border rounded-lg p-2"><div className="md:col-span-2 flex gap-2"><WarrantyAutocomplete value={it.name} options={products} onChange={value=>{updateItem(idx,'name',value);const p=products.find(x=>(x.name||'').toLocaleLowerCase('vi')===value.trim().toLocaleLowerCase('vi'));updateItem(idx,'productId',p?.id||'');}} onSelect={p=>{updateItem(idx,'name',p.name||'');updateItem(idx,'productId',p.id||'');}} placeholder="Gõ để tìm sản phẩm đã lưu" className="min-w-0 w-full p-2 border rounded-lg"/><button type="button" onClick={()=>{setQuickAddType('product');setQuickAddName(it.name||'');setQuickAddProductIndex(idx);}} className="px-3 rounded-lg border text-purple-700 font-bold whitespace-nowrap">+ Thêm mới</button></div><input type="date" value={recordType==='customer'?(it.saleDate||saleDate):(it.purchaseDate||purchaseDate)} onChange={e=>updateItem(idx,recordType==='customer'?'saleDate':'purchaseDate',e.target.value)} className="p-2 border rounded-lg" title={recordType==='customer'?'Thời gian bán':'Thời gian nhập'}/><input value={it.warranty} onChange={e=>updateItem(idx,'warranty',e.target.value)} placeholder="Thời gian bảo hành" className="p-2 border rounded-lg"/><input value={it.note} onChange={e=>updateItem(idx,'note',e.target.value)} placeholder="Ghi chú sản phẩm" className="p-2 border rounded-lg md:col-span-5"/><button type="button" onClick={()=>setItems(prev=>prev.filter((_,i)=>i!==idx))} className="text-blue-600 text-xs font-bold justify-self-start">Xóa dòng</button></div>)}</div>
      <div className="grid grid-cols-1 gap-3"><label className="text-sm font-bold">{recordType==='customer'?'Ghi chú thẻ khách hàng':'Ghi chú thẻ nơi nhận bảo hành'}<textarea value={recordType==='customer'?customerNotes:locationNotes} onChange={e=>recordType==='customer'?setCustomerNotes(e.target.value):setLocationNotes(e.target.value)} className="mt-1 w-full p-2 border rounded-lg font-normal" rows="2"/></label></div>
      {quickAddType && <div className="border border-purple-200 bg-purple-50 rounded-xl p-3 space-y-2"><div className="flex items-center justify-between"><h3 className="font-bold text-purple-800">Thêm mới {quickAddType==='customer'?'khách hàng':quickAddType==='supplier'?'nhà cung cấp':quickAddType==='product'?'sản phẩm':'nơi nhận bảo hành'}</h3><button type="button" onClick={closeQuickAdd} className="p-1 rounded hover:bg-purple-100"><X size={18}/></button></div><input autoFocus value={quickAddName} onChange={e=>setQuickAddName(e.target.value)} placeholder="Tên" className="w-full p-2 border rounded-lg bg-white"/>{quickAddType!=='product'&&<div className="grid grid-cols-1 md:grid-cols-2 gap-2"><input value={quickAddAddress} onChange={e=>setQuickAddAddress(e.target.value)} placeholder="Địa chỉ" className="p-2 border rounded-lg bg-white"/><input value={quickAddPhone} onChange={e=>setQuickAddPhone(e.target.value)} placeholder="Số điện thoại" className="p-2 border rounded-lg bg-white"/></div>}<div className="flex gap-2"><button type="button" onClick={saveQuickAdd} className="px-4 py-2 rounded-lg bg-purple-600 text-white font-bold">Lưu và chọn</button><button type="button" onClick={closeQuickAdd} className="px-4 py-2 rounded-lg border bg-white font-bold">Hủy</button></div></div>}
      <button type="submit" className="bg-purple-600 text-white px-5 py-2.5 rounded-lg font-bold">{editingId?'Lưu chỉnh sửa':'Lưu phiếu bảo hành'}</button>{editingId&&<button type="button" onClick={()=>{resetForm();setShowForm(false)}} className="ml-2 px-5 py-2.5 border rounded-lg font-bold">Hủy sửa</button>}
    </form>}
    <div className="flex flex-col lg:flex-row gap-3 mb-3"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm nhanh STT, tên khách hàng, số điện thoại, sản phẩm, nơi bảo hành..." className="flex-1 p-2.5 border rounded-xl bg-white"/><select value={filter} onChange={e=>setFilter(e.target.value)} className="p-2.5 border rounded-xl bg-white"><option value="PENDING">Chưa hoàn thành</option><option value="COMPLETED">Đã hoàn thành</option><option value="ALL">Tất cả phiếu</option></select><select value={sortField} onChange={e=>setSortField(e.target.value)} className="p-2.5 border rounded-xl bg-white"><option value="customerName">Sắp xếp tên khách hàng</option><option value="warrantyLocation">Sắp xếp nơi nhận bảo hành</option><option value="sentAt">Sắp xếp thời gian gửi</option></select><button onClick={()=>setSortOrder(v=>v==='asc'?'desc':'asc')} className="p-2.5 border rounded-xl bg-white font-bold"><ArrowUpDown size={15} className="inline mr-1"/>{sortOrder==='asc'?'Tăng dần':'Giảm dần'}</button><select value={rowsPerPage} onChange={e=>setRowsPerPage(e.target.value)} className="p-2.5 border rounded-xl bg-white"><option value="10">10 dòng</option><option value="20">20 dòng</option><option value="50">50 dòng</option><option value="all">Tất cả</option></select><div className="flex items-center gap-2"><span className="text-sm">Khổ giấy</span><select value={paperSize} onChange={e=>setPaperSize(e.target.value)} className="p-2.5 border rounded-xl bg-white"><option>A4</option><option>A5</option></select></div></div>
    <section className="flex-1 overflow-auto bg-white rounded-xl border shadow-sm mb-4">
      <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"><div><h3 className="text-lg font-bold text-gray-800">Chi tiết bảo hành</h3><p className="text-sm text-gray-500">Tập trung phiếu nhận bảo hành của khách hàng và phiếu gửi đến nơi bảo hành trong cùng một danh sách.</p></div><button type="button" onClick={()=>{setSelectedShippingLabelIds([]);setShippingLabelPickerOpen(true);}} className="px-4 py-2 rounded-xl bg-amber-500 text-white font-bold whitespace-nowrap"><Printer size={16} className="inline mr-2"/>Chọn đơn in nhãn (tối đa 4)</button></div>
      <div className="overflow-x-auto"><table className="w-full text-left text-sm min-w-[1300px]"><thead className="bg-gray-100 sticky top-0"><tr><th className="p-3">STT</th><th className="p-3">Tên khách hàng</th><th className="p-3">Sản phẩm bảo hành</th><th className="p-3">Nơi nhận bảo hành</th><th className="p-3">Thời gian nhận</th><th className="p-3">Thời gian gửi</th><th className="p-3">Số điện thoại khách hàng</th><th className="p-3">Nhà vận chuyển</th><th className="p-3">Trạng thái bảo hành</th><th className="p-3">Tài khoản lập phiếu</th><th className="p-3">Thao tác</th></tr></thead><tbody>
        {visible.map((w, i) => { const type = w.recordType || (w.supplierName ? 'location' : 'customer'); const isLocation = type === 'location'; return <tr key={w.id} className="border-t hover:bg-gray-50 align-top"><td className="p-3">{i+1}</td><td className="p-3 font-bold">{w.customerName || '—'}</td><td className="p-3">{(w.items || []).map((it, j) => <div key={j}>{it.name || '—'}</div>)}</td><td className="p-3">{w.warrantyLocation || '—'}</td><td className="p-3 whitespace-nowrap">{formatDate(w.createdAt || w.updatedAt || w.saleDate || '')}</td><td className="p-3 whitespace-nowrap">{w.sentAt ? formatDate(w.sentAt) : '—'}</td><td className="p-3">{w.phone || '—'}</td><td className="p-3">{isLocation ? (w.carrierName || '—') : '—'}</td><td className="p-3">{w.status === 'COMPLETED' ? <span className="px-2 py-1 rounded-lg text-xs font-bold bg-green-100 text-green-700">Hoàn thành</span> : <span className="px-2 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-800">{isLocation ? 'Đang gửi bảo hành' : 'Đang nhận bảo hành'}</span>}</td><td className="p-3">{w.createdByName || w.createdByEmail || w.createdByUid || '—'}</td><td className="p-3"><div className="flex flex-col gap-2"><button onClick={()=>toggleWarrantyStatus(w)} className="px-3 py-1.5 rounded-lg border font-bold whitespace-nowrap">{w.status === 'COMPLETED' ? 'Chuyển lại đang bảo hành' : 'Đánh dấu hoàn thành'}</button><button onClick={()=>editRequest(w)} className="px-3 py-1.5 rounded-lg border font-bold flex items-center gap-1"><Edit size={14}/> Sửa chi tiết</button><button onClick={()=>setPrintTarget(w)} className="px-3 py-1.5 rounded-lg border font-bold flex items-center gap-1"><Printer size={14}/> In lại phiếu</button><button onClick={()=>printShippingLabel(w)} className="px-3 py-1.5 rounded-lg border border-amber-300 text-amber-800 font-bold flex items-center gap-1"><Printer size={14}/> In nhãn gửi bảo hành</button><button onClick={()=>deleteRequest(w)} className="px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 font-bold flex items-center gap-1"><Trash2 size={14}/> Xóa phiếu</button></div></td></tr>; })}
        {visible.length===0 && <tr><td colSpan={11} className="p-8 text-center text-gray-400">Chưa có lịch sử bảo hành.</td></tr>}
      </tbody></table></div>
    </section>
    <div className="flex flex-wrap gap-2 text-xs"><button type="button" onClick={() => navigateMainTab('products')} className="text-blue-700 underline">Mở thẻ Sản phẩm</button><button type="button" onClick={() => navigateMainTab('customers')} className="text-blue-700 underline">Mở thẻ Khách hàng</button><button type="button" onClick={() => navigateMainTab('suppliers')} className="text-blue-700 underline">Mở thẻ Nhà cung cấp</button></div>
    {shippingLabelPickerOpen && <div className="fixed inset-0 z-[110] bg-black/50 flex items-center justify-center p-3"><div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"><div className="p-4 border-b flex items-start justify-between gap-3"><div><h3 className="text-lg font-black">Chọn đơn gửi bảo hành để in nhãn</h3><p className="text-sm text-gray-600">Chỉ hiện đơn gửi bảo hành chưa hoàn thành, sắp xếp từ mới nhất đến cũ hơn. Chọn tối đa 4 địa chỉ.</p></div><button type="button" onClick={()=>setShippingLabelPickerOpen(false)} className="px-3 py-1 border rounded-lg font-bold">Đóng</button></div><div className="p-3 overflow-y-auto space-y-2">{pendingShippingLabelRequests.map((w,i)=>{const selected=selectedShippingLabelIds.includes(w.id);return <label key={w.id} className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer ${selected?'border-amber-400 bg-amber-50':'border-gray-200'}`}><input type="checkbox" className="mt-1" checked={selected} onChange={e=>setSelectedShippingLabelIds(prev=>e.target.checked?(prev.length>=4?(showToast('Chỉ được chọn tối đa 4 địa chỉ','error'),prev):[...prev,w.id]):prev.filter(id=>id!==w.id))}/><div className="min-w-0 flex-1"><div className="font-bold">{i+1}. {w.warrantyLocation || w.supplierName || 'Chưa có tên nơi nhận'}</div><div className="text-sm text-gray-600">{w.warrantyLocationAddress || w.supplierAddress || 'Chưa có địa chỉ'} · {w.warrantyLocationPhone || w.supplierPhone || 'Chưa có số điện thoại'}</div><div className="text-xs text-gray-500 mt-1">Khách liên quan: {w.customerName || '—'} · Ngày gửi: {formatDate(w.sentAt || w.createdAt || '')}</div></div></label>})}{pendingShippingLabelRequests.length===0&&<div className="p-8 text-center text-gray-500">Không có đơn gửi bảo hành nào đang xử lý.</div>}</div><div className="p-4 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"><div className="text-sm font-semibold">Đã chọn {selectedShippingLabelIds.length}/4 địa chỉ <span className="text-gray-500 font-normal">· mỗi nhãn chiếm 1/4 trang A4 dọc</span></div><div className="flex gap-2"><button type="button" onClick={()=>setSelectedShippingLabelIds([])} className="px-3 py-2 rounded-lg border font-bold">Bỏ chọn</button><button type="button" disabled={!selectedShippingLabelIds.length} onClick={()=>{const chosen=selectedShippingLabelIds.map(id=>pendingShippingLabelRequests.find(w=>w.id===id)).filter(Boolean).sort((a,b)=>new Date(b.sentAt||b.createdAt||b.updatedAt||0)-new Date(a.sentAt||a.createdAt||a.updatedAt||0));printShippingLabels(chosen);setShippingLabelPickerOpen(false);}} className="px-4 py-2 rounded-lg bg-amber-500 text-white font-bold disabled:opacity-50">In {selectedShippingLabelIds.length} nhãn</button></div></div></div></div>}
    {printTarget && <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"><div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5 space-y-4"><h3 className="text-lg font-black">Chọn thẻ in phiếu bảo hành</h3><p className="text-sm text-gray-600">Mã phiếu: {printTarget.warrantyCode || printTarget.id}</p><div className="space-y-2 rounded-xl border bg-gray-50 p-3"><label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={showPrintSaleDate} onChange={e=>setShowPrintSaleDate(e.target.checked)}/> Hiển thị thời gian đã bán / đã mua</label><label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={showPrintWarrantyDuration} onChange={e=>setShowPrintWarrantyDuration(e.target.checked)}/> Hiển thị thời gian bảo hành</label><label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={showPrintLogo} onChange={e=>setShowPrintLogo(e.target.checked)}/> Hiển thị logo công ty</label></div><button onClick={()=>{printRequest(printTarget,'customer',{showDate:showPrintSaleDate,showDuration:showPrintWarrantyDuration,showLogo:showPrintLogo});setPrintTarget(null);}} className="w-full p-3 rounded-xl bg-purple-600 text-white font-bold">Thẻ khách hàng<span className="block text-xs font-normal">Chỉ hiện thông tin và ghi chú của khách hàng</span></button><button onClick={()=>{printRequest(printTarget,'location',{showDate:showPrintSaleDate,showDuration:showPrintWarrantyDuration,showLogo:showPrintLogo});setPrintTarget(null);}} className="w-full p-3 rounded-xl bg-blue-600 text-white font-bold">Thẻ nơi gửi bảo hành<span className="block text-xs font-normal">Ẩn thông tin khách hàng, chỉ hiện thông tin nơi gửi</span></button><button onClick={()=>{printShippingLabel(printTarget);setPrintTarget(null);}} className="w-full p-3 rounded-xl bg-amber-500 text-white font-bold">In nhãn gửi bảo hành<span className="block text-xs font-normal">Nhãn A4 độc lập, dán ngoài thùng hàng</span></button><button onClick={()=>setPrintTarget(null)} className="w-full p-2 rounded-xl border font-bold">Hủy</button></div></div>}
  </div>;
}
function ReportsView({ orders = [], imports = [], expenses = [], debtPaymentReports = [] }) {
  const now = getVietnamDateParts(new Date());
  const todayKey = getVietnamDateKey(new Date());
  const [periodMode, setPeriodMode] = useState('day');
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [selectedMonth, setSelectedMonth] = useState(`${now.year}-${String(now.month).padStart(2,'0')}`);
  const [selectedYear, setSelectedYear] = useState(String(now.year));
  const [rowsByReport, setRowsByReport] = useState({ sales: '10', imports: '10', expenses: '10' });
  const dateMatches = (value) => {
    if (!value) return false;
    const key = getVietnamDateKey(new Date(value));
    if (periodMode === 'day') return key === selectedDate;
    if (periodMode === 'month') return key.slice(0,7) === selectedMonth;
    return key.slice(0,4) === selectedYear;
  };
  const salesRows = orders.filter(o => dateMatches(o.date)).map(o => ({ date:o.date, name:o.customerName || o.customer || 'Khách lẻ', detail:(o.items||[]).map(i=>`${i.name||'Sản phẩm'} × ${i.quantity||1}`).join(', '), amount:Number(o.total ?? o.totalAmount ?? 0), id:o.invoiceCode || o.code || o.id }));
  const importRows = imports.filter(i => dateMatches(i.date)).map(i => ({ date:i.date, name:i.supplierName || i.supplier || 'Chưa có nhà cung cấp', detail:(i.items||[]).map(p=>`${p.name||'Sản phẩm'} × ${p.quantity||1}`).join(', '), amount:Number(i.total ?? i.totalAmount ?? i.totalCost ?? (i.items||[]).reduce((sum,p)=>sum+(Number(p.quantity)||0)*(Number(p.importCost ?? p.costPrice ?? p.cost)||0),0)), id:i.code || i.id }));
  const expenseRows = expenses.filter(e => dateMatches(e.date)).map(e => ({ date:e.date, name:e.note || e.description || 'Chi phí', detail:e.note || e.description || '', amount:Number(e.amount)||0, id:e.id }));
  const money = value => `${(Number(value)||0).toLocaleString('vi-VN')} đ`;
  const printReport = (title, rows, total) => {
    const safe = value => String(value ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const win = window.open('', '_blank'); if (!win) return;
    win.document.write(`<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${safe(title)}</title><style>body{font-family:Arial,sans-serif;padding:20px;color:#111}h1{text-align:center;font-size:20px}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #555;padding:7px;text-align:left}th{background:#eee}.total{text-align:right;font-weight:bold;margin-top:14px}@media print{button{display:none}}</style></head><body><h1>${safe(title)}</h1><p>Thời gian: ${safe(periodMode==='day'?selectedDate:periodMode==='month'?selectedMonth:selectedYear)}</p><table><thead><tr><th>STT</th><th>Ngày</th><th>Khách hàng/Nội dung</th><th>Chi tiết</th><th>Số tiền</th></tr></thead><tbody>${rows.map((r,i)=>`<tr><td>${i+1}</td><td>${safe(r.date?formatDate(r.date):'—')}</td><td>${safe(r.name)}</td><td>${safe(r.detail)}</td><td>${safe(money(r.amount))}</td></tr>`).join('')}</tbody></table><p class="total">Tổng: ${safe(money(total))}</p><script>window.onload=()=>window.print()</script></body></html>`);
    win.document.close();
  };
  const renderReport = (key, title, rows) => {
    const limit = rowsByReport[key] === 'all' ? rows.length : Number(rowsByReport[key]) || 10;
    const shown = rows.slice(0, limit);
    const total = rows.reduce((sum, row)=>sum+row.amount,0);
    return <section key={key} className="bg-white rounded-2xl border shadow-sm p-4 space-y-3"><div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"><div><h3 className="text-lg font-bold text-gray-800">{title}</h3><p className="text-sm text-gray-500">Số tiền: <strong className="text-blue-600">{money(total)}</strong> · {rows.length} dòng</p></div><div className="flex flex-wrap items-center gap-2"><label className="text-sm">Hiển thị <select className="border rounded-lg p-2" value={rowsByReport[key]} onChange={e=>setRowsByReport(prev=>({...prev,[key]:e.target.value}))}><option value="10">10</option><option value="20">20</option><option value="50">50</option><option value="all">Tất cả</option></select></label><button onClick={()=>printReport(title, rows, total)} className="px-3 py-2 rounded-lg bg-blue-600 text-white font-bold flex items-center gap-2"><Printer size={16}/> In báo cáo</button></div></div><div className="overflow-x-auto"><table className="w-full text-sm min-w-[600px]"><thead className="bg-blue-50"><tr><th className="p-2 text-left">STT</th><th className="p-2 text-left">Ngày</th><th className="p-2 text-left">Khách hàng/Nội dung</th><th className="p-2 text-left">Chi tiết</th><th className="p-2 text-right">Số tiền</th></tr></thead><tbody>{shown.map((r,i)=><tr key={r.id||`${key}-${i}`} className="border-t"><td className="p-2">{i+1}</td><td className="p-2 whitespace-nowrap">{r.date?formatDate(r.date):'—'}</td><td className="p-2">{r.name}</td><td className="p-2">{r.detail||'—'}</td><td className="p-2 text-right font-semibold">{money(r.amount)}</td></tr>)}{shown.length===0&&<tr><td colSpan="5" className="p-5 text-center text-gray-400">Không có dữ liệu trong khoảng thời gian đã chọn.</td></tr>}</tbody></table></div></section>;
  };
  return <div className="p-4 md:p-6 space-y-4 overflow-auto"><div><h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><FileText className="text-blue-600"/> Báo cáo</h2><p className="text-sm text-gray-500">Báo cáo bán hàng, nhập hàng và chi phí theo khoảng thời gian.</p></div><section className="bg-white rounded-2xl border shadow-sm p-4"><div className="flex flex-wrap items-end gap-3"><label className="text-sm font-semibold">Xem theo<select value={periodMode} onChange={e=>setPeriodMode(e.target.value)} className="block mt-1 border rounded-lg p-2"><option value="day">Ngày</option><option value="month">Tháng</option><option value="year">Năm</option></select></label>{periodMode==='day'&&<label className="text-sm font-semibold">Ngày<input type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)} className="block mt-1 border rounded-lg p-2"/></label>}{periodMode==='month'&&<label className="text-sm font-semibold">Tháng<input type="month" value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)} className="block mt-1 border rounded-lg p-2"/></label>}{periodMode==='year'&&<label className="text-sm font-semibold">Năm<select value={selectedYear} onChange={e=>setSelectedYear(e.target.value)} className="block mt-1 border rounded-lg p-2">{Array.from({length:12},(_,i)=>now.year-i).map(y=><option key={y} value={String(y)}>{y}</option>)}</select></label>}</div></section>{renderReport('sales','Báo cáo bán hàng',salesRows)}{renderReport('imports','Báo cáo nhập hàng',importRows)}{renderReport('expenses','Báo cáo chi phí',expenseRows)}<DebtPaymentReportView payments={debtPaymentReports} /></div>;
}

function DebtPaymentReportView({ payments = [] }) {
  const today = getVietnamDateKey(new Date());
  const [fromDate, setFromDate] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 6); return getVietnamDateKey(d); });
  const [toDate, setToDate] = useState(today);
  const [partyType, setPartyType] = useState('all');
  const [rowsPerPage, setRowsPerPage] = useState('20');
  const paymentDateValue = (p) => {
    const value = p?.date || p?.createdAt || p?.updatedAt;
    if (!value) return null;
    if (typeof value?.toDate === 'function') return value.toDate();
    if (typeof value === 'object' && Number.isFinite(value.seconds)) return new Date(value.seconds * 1000);
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };
  const filtered = useMemo(() => (payments || []).filter(p => {
    const paymentDate = paymentDateValue(p);
    const key = paymentDate ? getVietnamDateKey(paymentDate) : '';
    const rawType = String(p.contactType || p.type || '').toLowerCase();
    const normalizedType = rawType.includes('supplier') || rawType.includes('nhà cung cấp') ? 'suppliers' : rawType.includes('customer') || rawType.includes('khách hàng') ? 'customers' : rawType;
    const typeOk = partyType === 'all' || normalizedType === partyType;
    return key && key >= fromDate && key <= toDate && typeOk;
  }).sort((a,b) => (paymentDateValue(b)?.getTime() || 0) - (paymentDateValue(a)?.getTime() || 0)), [payments, fromDate, toDate, partyType]);
  const total = filtered.reduce((sum,p) => sum + (Number(p.amount) || 0), 0);
  const shown = rowsPerPage === 'all' ? filtered : filtered.slice(0, Number(rowsPerPage) || 20);
  return <div className="p-3 md:p-5 space-y-4 overflow-auto"><div><h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2"><CreditCard className="text-blue-600"/> Báo cáo thanh toán công nợ</h2><p className="text-sm text-gray-500 mt-1">Theo dõi khách hàng trả nợ và các khoản trả nhà cung cấp.</p></div><section className="bg-white border rounded-xl shadow-sm p-3 md:p-4"><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"><label className="text-xs font-bold text-gray-600">Từ ngày<input type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)} className="mt-1 w-full border rounded-lg p-2 text-sm"/></label><label className="text-xs font-bold text-gray-600">Đến ngày<input type="date" value={toDate} onChange={e=>setToDate(e.target.value)} className="mt-1 w-full border rounded-lg p-2 text-sm"/></label><div className="flex items-end gap-2"><button type="button" onClick={()=>{const d=new Date();const day=(d.getDay()+6)%7;d.setDate(d.getDate()-day);setFromDate(getVietnamDateKey(d));const end=new Date(d);end.setDate(end.getDate()+6);setToDate(getVietnamDateKey(end));}} className="border rounded-lg px-3 py-2 text-xs font-bold hover:bg-gray-50">Tuần này</button><button type="button" onClick={()=>{const d=new Date();const day=(d.getDay()+6)%7;d.setDate(d.getDate()-day-7);setFromDate(getVietnamDateKey(d));const end=new Date(d);end.setDate(end.getDate()+6);setToDate(getVietnamDateKey(end));}} className="border rounded-lg px-3 py-2 text-xs font-bold hover:bg-gray-50">Tuần trước</button></div><label className="text-xs font-bold text-gray-600">Loại giao dịch<select value={partyType} onChange={e=>setPartyType(e.target.value)} className="mt-1 w-full border rounded-lg p-2 text-sm"><option value="all">Tất cả</option><option value="customers">Khách hàng trả nợ</option><option value="suppliers">Trả nợ nhà cung cấp</option></select></label><label className="text-xs font-bold text-gray-600">Số dòng<select value={rowsPerPage} onChange={e=>setRowsPerPage(e.target.value)} className="mt-1 w-full border rounded-lg p-2 text-sm"><option value="10">10</option><option value="20">20</option><option value="50">50</option><option value="all">Tất cả</option></select></label></div><div className="mt-4 rounded-lg bg-blue-50 p-3"><div className="text-xs text-blue-700 font-semibold">Tổng thanh toán trong khoảng ngày đã chọn</div><div className="text-xl md:text-2xl font-extrabold text-blue-800">{formatCurrency(total)}</div><div className="text-xs text-gray-500">{filtered.length} giao dịch · mặc định 7 ngày gần nhất</div></div></section><section className="bg-white border rounded-xl shadow-sm overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm min-w-[760px]"><thead className="bg-gray-100 text-gray-600"><tr><th className="p-3 text-left">Ngày giờ</th><th className="p-3 text-left">Loại</th><th className="p-3 text-left">Khách hàng/Nhà cung cấp</th><th className="p-3 text-left">Mã giao dịch</th><th className="p-3 text-left">Phương thức</th><th className="p-3 text-right">Số tiền</th></tr></thead><tbody>{shown.map((p,i)=><tr key={p.id || `${p.contactId}-${i}`} className="border-t"><td className="p-3 whitespace-nowrap">{formatDate(paymentDateValue(p))}</td><td className="p-3">{p.direction || ((p.contactType==='customers'||String(p.type||'').toLowerCase().includes('customer'))?'Khách hàng trả nợ':'Trả nợ nhà cung cấp')}</td><td className="p-3">{p.contactName || '—'}</td><td className="p-3">{p.transactionCode || p.sourcePaymentId || '—'}</td><td className="p-3">{p.method==='transfer'?'Chuyển khoản':p.method==='cash'?'Tiền mặt':p.method==='transaction'?'Thanh toán trên giao dịch':'—'}</td><td className="p-3 text-right font-bold whitespace-nowrap">{formatCurrency(p.amount)}</td></tr>)}{shown.length===0&&<tr><td colSpan="6" className="p-8 text-center text-gray-400">Chưa có giao dịch thanh toán trong khoảng thời gian này.</td></tr>}</tbody></table></div></section></div>;
}

function ExpenseView({ expenses, db, storeId, showToast }) {
  const [form, setForm] = useState({ id: '', amount: '', note: '' });
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [detailExpense, setDetailExpense] = useState(null);
  const currentDate = new Date();
  const [filterMonth, setFilterMonth] = useState((currentDate.getMonth() + 1).toString());
  const [filterYear, setFilterYear] = useState(currentDate.getFullYear().toString());

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (form.id) { await updateDoc(doc(db, 'stores', storeId, 'expenses', form.id), { amount: Number(form.amount), note: form.note }); showToast('Đã cập nhật chi phí'); }
      else { await addDoc(collection(db, 'stores', storeId, 'expenses'), { amount: Number(form.amount), note: form.note, date: new Date().toISOString() }); showToast('Đã thêm chi phí'); }
      setForm({ id: '', amount: '', note: '' });
    } catch (e) { showToast('Không lưu được chi phí', 'error'); }
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
      const matchTime = d.getFullYear().toString() === filterYear;
      const matchSearch = e.note && e.note.toLowerCase().includes(searchTerm.toLowerCase());
      return matchTime && matchSearch;
    }).sort((a,b) => new Date(b.date) - new Date(a.date));
  }, [expenses, filterYear, searchTerm]);

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
          <select value={filterYear} onChange={e=>setFilterYear(e.target.value)} className="bg-transparent text-sm font-medium outline-none"><option value="ALL">Tất cả năm</option>{Array.from({length: 10}, (_, i) => new Date().getFullYear() - i).map(y => <option key={y} value={y}>{y}</option>)}</select>
        </div>
      </div>
      <form onSubmit={handleSave} className="bg-white p-4 rounded-xl border shadow-sm mb-4 flex flex-col md:flex-row gap-4 shrink-0">
        <input required type="number" placeholder="Số tiền chi *" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} className="p-2.5 border rounded-lg outline-none flex-1"/>
        <input required placeholder="Nội dung chi (VD: Trả tiền điện) *" value={form.note} onChange={e=>setForm({...form,note:e.target.value})} className="p-2.5 border rounded-lg outline-none flex-1 md:flex-[2]"/>
        <button className="bg-orange-600 text-white px-8 rounded-lg font-bold py-2.5">{form.id ? 'Lưu chỉnh sửa' : 'Ghi Nhận'}</button>{form.id && <button type="button" onClick={()=>setForm({id:'',amount:'',note:''})} className="border px-4 rounded-lg font-bold">Hủy</button>}
      </form>
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-xl mb-3 flex justify-between items-center"><span className="text-xs font-bold text-blue-700">Đã chọn {selectedIds.length} mục</span><button onClick={handleBatchDelete} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1"><Trash2 size={14}/> Xóa đã chọn</button></div>
      )}
      <div className="bg-white rounded-xl border shadow-sm flex-1 overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 sticky top-0 border-b"><tr><th className="p-4 w-10"><input type="checkbox" onChange={() => setSelectedIds(selectedIds.length === filteredExpenses.length ? [] : filteredExpenses.map(e=>e.id))} checked={filteredExpenses.length > 0 && selectedIds.length === filteredExpenses.length} className="w-4 h-4"/></th><th className="p-4 font-bold text-gray-600">Thời gian</th><th className="p-4 font-bold text-gray-600">Nội dung</th><th className="p-4 font-bold text-gray-600">Số tiền</th><th className="p-4 font-bold text-gray-600 text-right">Thao tác</th></tr></thead>
          <tbody>
            {filteredExpenses.map(e => (
              <tr key={e.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => setDetailExpense(e)}>
                <td className="p-4" onClick={evt=>evt.stopPropagation()}><input type="checkbox" checked={selectedIds.includes(e.id)} onChange={() => setSelectedIds(prev => prev.includes(e.id) ? prev.filter(x=>x!==e.id) : [...prev, e.id])} className="w-4 h-4"/></td>
                <td className="p-4 text-gray-500">{formatDate(e.date)}</td><td className="p-4 font-medium text-blue-600 underline">{e.note}</td><td className="p-4 font-bold text-orange-600">{formatCurrency(e.amount)}</td>
                <td className="p-4 text-right" onClick={evt=>evt.stopPropagation()}><div className="flex justify-end gap-1"><button onClick={() => {setForm({id:e.id,amount:String(e.amount ?? ''),note:e.note || ''});setDetailExpense(null);}} title="Chỉnh sửa chi phí" className="text-blue-600 bg-blue-50 p-2 rounded-lg hover:bg-blue-100"><Edit size={16}/></button><button onClick={() => handleDelete(e.id)} className="text-blue-500 bg-blue-50 p-2 rounded-lg hover:bg-blue-100"><Trash2 size={16}/></button></div></td>
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

function ImportView({ products, orders = [], imports = [], suppliers, db, storeId, user, userData, showToast, storeConfig, setActiveTab }) {
  const [activeImportTab, setActiveImportTab] = useState('history');
  const [cart, setCart] = useState([]);
  const [supplierId, setSupplierId] = useState('');
  const [isDebt, setIsDebt] = useState(false);
  const [editingImport, setEditingImport] = useState(null);
  const [detailImport, setDetailImport] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddSuppModal, setShowAddSuppModal] = useState(false);
  const [newSuppForm, setNewSuppForm] = useState({ name: '', phone: '', address: '' });
  const [showAddProdModal, setShowAddProdModal] = useState(false);
  const [isAddingNewProduct, setIsAddingNewProduct] = useState(false);
  const [newProdForm, setNewProdForm] = useState({ name: '', category: '', cost: '0', price: '0' });
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);
  const [bulkImportFile, setBulkImportFile] = useState(null);
  const [bulkImportRows, setBulkImportRows] = useState([]);
  const [bulkImportSelected, setBulkImportSelected] = useState([]);
  const [bulkImportSort, setBulkImportSort] = useState({ field: 'rowNumber', direction: 'asc' });
  const [bulkImportSupplierId, setBulkImportSupplierId] = useState('');
  const [bulkImportDate, setBulkImportDate] = useState(getVietnamDateKey(new Date()));
  const [bulkImportDebt, setBulkImportDebt] = useState(false);
  const [bulkImportBusy, setBulkImportBusy] = useState(false);
  const [bulkImportProgress, setBulkImportProgress] = useState({ done: 0, total: 0 });
  const [bulkImportPreviewLimit, setBulkImportPreviewLimit] = useState(100);
  const toggleBulkImportSort = (field) => setBulkImportSort(prev => ({ field, direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc' }));
  const sortedBulkImportRows = useMemo(() => [...bulkImportRows].sort((a,b) => { const f=bulkImportSort.field; let av=f==='rowNumber'?a.rowNumber:f==='productName'?(a.matchedName||a.productName||''):f==='qty'?Number(a.qty)||0:f==='importCost'?Number(a.importCost)||0:f==='total'?(Number(a.qty)||0)*(Number(a.importCost)||0):f==='supplierName'?(a.supplierName||''):f==='date'?(new Date(a.date||0).getTime()||0):f==='receiptCode'?(a.receiptCode||''):f==='match'?(a.valid?1:0):''; let bv=f==='rowNumber'?b.rowNumber:f==='productName'?(b.matchedName||b.productName||''):f==='qty'?Number(b.qty)||0:f==='importCost'?Number(b.importCost)||0:f==='total'?(Number(b.qty)||0)*(Number(b.importCost)||0):f==='supplierName'?(b.supplierName||''):f==='date'?(new Date(b.date||0).getTime()||0):f==='receiptCode'?(b.receiptCode||''):f==='match'?(b.valid?1:0):''; const cmp=typeof av==='number'&&typeof bv==='number'?av-bv:String(av).localeCompare(String(bv),'vi',{numeric:true,sensitivity:'base'}); return bulkImportSort.direction==='asc'?cmp:-cmp; }), [bulkImportRows, bulkImportSort]);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [showSupplierSuggestions, setShowSupplierSuggestions] = useState(false);
  const [groupSearch, setGroupSearch] = useState('');
  const [showGroupSuggestions, setShowGroupSuggestions] = useState(false);
  const [showAddGroupForm, setShowAddGroupForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  const [importRowsPerPage, setImportRowsPerPage] = useState('10');
  const [importCurrentPage, setImportCurrentPage] = useState(1);
  const [historyRowsPerPage, setHistoryRowsPerPage] = useState('10');
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1);
  const [showImportColumns, setShowImportColumns] = useState(false);
  const [importColumns, setImportColumns] = useState({ date: true, code: true, supplier: true, items: true, total: true, status: true, actions: true });
  const [historySort, setHistorySort] = useState({ field: 'date', direction: 'desc' });
  const [historySearch, setHistorySearch] = useState('');
  const [historySupplierFilter, setHistorySupplierFilter] = useState('ALL');
  const [historyFromDate, setHistoryFromDate] = useState('');
  const [historyToDate, setHistoryToDate] = useState('');
  const handleHistorySort = (field) => setHistorySort(prev => ({ field, direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc' }));
  const [importTotalPeriod, setImportTotalPeriod] = useState('month');
  const [importTotalMonth, setImportTotalMonth] = useState(String(getVietnamDateParts(new Date()).month));
  const [importTotalYear, setImportTotalYear] = useState(String(getVietnamDateParts(new Date()).year));
  const [importTotalDay, setImportTotalDay] = useState(getVietnamDateKey(new Date()));

  const normalizeImportSearch = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').trim().toLocaleLowerCase('vi');
  const filteredProducts = useMemo(() => { const q = normalizeImportSearch(searchTerm); return (products || []).filter(p => p.name && (!q || normalizeImportSearch(p.name).includes(q) || normalizeImportSearch(p.category).includes(q))); }, [products, searchTerm]);
  const visibleSuppliers = useMemo(() => (suppliers || []).filter(s => String(s.name || '').toLocaleLowerCase('vi').includes(supplierSearch.toLocaleLowerCase('vi'))), [suppliers, supplierSearch]);
  const visibleGroups = useMemo(() => [...new Set((products || []).map(p => String(p.category || '').trim()).filter(Boolean))].filter(g => g.toLocaleLowerCase('vi').includes(groupSearch.toLocaleLowerCase('vi'))), [products, groupSearch]);

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
      setSupplierId(docRef.id); setSupplierSearch(newSuppForm.name); setShowAddSuppModal(false); setShowSupplierSuggestions(false); setNewSuppForm({ name: '', phone: '', address: '' });
      showToast("Đã thêm và chọn nhà cung cấp mới!");
    } catch (err) { showToast("Lỗi thêm nhà cung cấp", "error"); }
  };

  const handleAddGroupQuick = () => {
    const name = String(newGroupName || groupSearch || newProdForm.category || '').trim();
    if (!name) { showToast('Vui lòng nhập tên nhóm hàng', 'error'); return; }
    setNewProdForm(prev => ({ ...prev, category: name }));
    setGroupSearch(name);
    setShowGroupSuggestions(false);
    setShowAddGroupForm(false);
    setNewGroupName('');
    showToast('Đã chọn nhóm hàng mới. Nhóm sẽ được lưu cùng sản phẩm khi bạn lưu sản phẩm.');
  };

  const handleAddNewProductInImport = async (e) => {
    e.preventDefault();
    if (isAddingNewProduct) return;
    setIsAddingNewProduct(true);
    try {
      const costVal = Number(newProdForm.cost) || 0;
      const priceVal = Number(newProdForm.price) || 0;
      if (!newProdForm.name.trim()) { showToast('Vui lòng nhập tên sản phẩm', 'error'); return; }
      // San pham moi luon bat dau voi ton kho 0; so luong chi tang khi luu phieu nhap.
      const newProdData = { name: newProdForm.name.trim(), category: newProdForm.category.trim(), cost: costVal, price: priceVal, stock: 0, createdAt: new Date().toISOString() };
      const docRef = await addDoc(collection(db, 'stores', storeId, 'products'), newProdData);
      setCart(c => [...c, { id: docRef.id, name: newProdData.name, category: newProdData.category, qty: 0, importCost: costVal, price: priceVal }]);
      setShowAddProdModal(false); setShowGroupSuggestions(false); setShowAddGroupForm(false); setGroupSearch(''); setNewProdForm({ name: '', category: '', cost: '0', price: '0' }); showToast("Đã thêm hàng mới và đưa vào phiếu nhập! Số lượng mặc định là 0.");
    } catch (err) {
      console.error('Loi them san pham moi trong phieu nhap:', err);
      showToast("Lỗi thêm sản phẩm mới", "error");
    } finally {
      setIsAddingNewProduct(false);
    }
  };

  const handleImport = async () => {
    if (cart.length === 0 || !supplierId) { showToast("Vui lòng chọn hoặc thêm mới Nhà cung cấp và có ít nhất 1 sản phẩm trước khi nhập hàng!", "error"); return; }
    try {
      const s = suppliers.find(sup => sup.id === supplierId);
      const total = cart.reduce((sum, i) => sum + Number(i.importCost || 0) * Number(i.qty ?? 0), 0);
      const batch = writeBatch(db);
      const importPayload = { supplierId, supplierName: s?.name || supplierSearch || newSuppForm.name || 'Nhà cung cấp', createdByUid: editingImport?.createdByUid || user?.uid || '', createdByName: editingImport?.createdByName || userData?.name || user?.displayName || user?.email || 'Nhân viên', items: cart, total, status: isDebt ? 'DEBT' : 'PAID', date: editingImport?.date || new Date().toISOString() };
      if (editingImport) {
        const oldItems = editingImport.items || [];
        const allProductIds = [...new Set([...oldItems.map(i => i.id || i.productId), ...cart.map(i => i.id || i.productId)].filter(Boolean))];
        allProductIds.forEach(pid => {
          const p = products.find(prod => prod.id === pid);
          if (!p) return;
          const oldQty = oldItems.filter(i => (i.id || i.productId) === pid).reduce((n, i) => n + Number(i.qty ?? i.quantity ?? 0), 0);
          const newQty = cart.filter(i => (i.id || i.productId) === pid).reduce((n, i) => n + Number(i.qty ?? i.quantity ?? 0), 0);
          const stockDelta = newQty - oldQty;
          if (stockDelta) batch.update(doc(db, 'stores', storeId, 'products', pid), { stock: Number(p.stock || 0) + stockDelta });
        });
        const oldSupplier = suppliers.find(x => x.id === editingImport.supplierId);
        if (editingImport.status === 'DEBT' && oldSupplier) batch.update(doc(db, 'stores', storeId, 'suppliers', oldSupplier.id), { totalDebt: Math.max(0, Number(oldSupplier.totalDebt || 0) - Number(editingImport.total || 0)) });
        if (isDebt) batch.update(doc(db, 'stores', storeId, 'suppliers', supplierId), { totalDebt: Number(s.totalDebt || 0) + total - (editingImport.status === 'DEBT' && editingImport.supplierId === supplierId ? Number(editingImport.total || 0) : 0) });
        batch.update(doc(db, 'stores', storeId, 'imports', editingImport.id), importPayload);
      } else {
        const importRef = doc(collection(db, 'stores', storeId, 'imports'));
        batch.set(importRef, importPayload);
        for (const item of cart) {
          let p = products.find(prod => prod.id === item.id);
          // Danh sach products cap nhat qua onSnapshot co the chua co san pham vua tao.
          // Doc truc tiep Firestore de khong bo qua cap nhat ton kho khi luu phieu ngay sau khi tao.
          if (!p && item.id) {
            const productSnap = await getDoc(doc(db, 'stores', storeId, 'products', item.id));
            if (productSnap.exists()) p = { id: productSnap.id, ...productSnap.data() };
          }
          if (p) {
            let newCost = Number(item.importCost || 0);
            const oldCost = Number(p.cost || 0);
            const currentStock = Number(p.stock || 0);
            const importQty = Number(item.qty ?? 0);
            const method = storeConfig?.costCalcMethod || 'LATEST';
            if (method === 'AVERAGE') { if (currentStock + importQty > 0) newCost = Math.round(((currentStock * oldCost) + (importQty * newCost)) / (currentStock + importQty)); }
            else if (method === 'HIGHEST') newCost = Math.max(oldCost, newCost);
            else if (method === 'LOWEST') newCost = oldCost === 0 ? newCost : Math.min(oldCost, newCost);
            batch.update(doc(db, 'stores', storeId, 'products', p.id), { stock: currentStock + importQty, cost: newCost, lastSupplierId: supplierId, lastSupplierName: s?.name || supplierSearch || newSuppForm.name || '' });
          }
        }
        if (isDebt && s) batch.update(doc(db, 'stores', storeId, 'suppliers', supplierId), { totalDebt: Number(s.totalDebt || 0) + total });
      }
      await batch.commit();
      setCart([]); setSupplierId(''); setIsDebt(false); setEditingImport(null); setActiveImportTab('history'); showToast(editingImport ? 'Đã cập nhật phiếu nhập!' : 'Nhập hàng thành công!');
    } catch (e) { showToast("Lỗi nhập hàng", "error"); }
  };

  const loadXlsxLibrary = () => new Promise((resolve, reject) => {
    if (window.XLSX) return resolve(window.XLSX);
    const existing = document.querySelector('script[data-import-xlsx="true"]');
    if (existing) { existing.addEventListener('load', () => resolve(window.XLSX), { once: true }); existing.addEventListener('error', reject, { once: true }); return; }
    const script = document.createElement('script'); script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'; script.async = true; script.dataset.importXlsx = 'true';
    script.onload = () => window.XLSX ? resolve(window.XLSX) : reject(new Error('Không tải được thư viện Excel')); script.onerror = () => reject(new Error('Không tải được thư viện Excel')); document.head.appendChild(script);
  });
  const findColumnValue = (row, aliases) => {
    const norm = value => normalizeImportSearch(String(value || '')).replace(/[^a-z0-9]/g, '');
    const key = Object.keys(row || {}).find(k => aliases.some(alias => norm(k).includes(norm(alias))));
    return key ? row[key] : '';
  };
  const handleBulkExcelSelect = async (event) => {
    const file = event.target.files?.[0]; if (!file) return;
    setBulkImportFile(file); setBulkImportRows([]); setBulkImportSelected([]);
    try {
      const XLSX = await loadXlsxLibrary(); const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
      const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '', raw: false });
      if (!rawRows.length) throw new Error('File Excel không có dòng dữ liệu.');
      const parsed = rawRows.map((row, index) => {
        const productName = String(findColumnValue(row, ['tenhang','tensanpham','sanpham','productname','hanghoa','tenhanghoa']) || '').trim();
        const productCode = String(findColumnValue(row, ['mahang','masanpham','barcode','sku','productcode']) || '').trim();
        const receiptCode = String(findColumnValue(row, ['maphieunhap','sophieu','mavoucher','receiptcode','invoicecode','mahoadon']) || '').trim();
        const supplierName = String(findColumnValue(row, ['nhacungcap','tennhacungcap','supplier','suppliername','nhaphangtu']) || '').trim();
        const rawDate = findColumnValue(row, ['thoigiannhap','ngaynhap','thoigian','ngaytao','date','createdat']);
        let date = '';
        if (rawDate instanceof Date && !Number.isNaN(rawDate.getTime())) date = rawDate.toISOString();
        else if (typeof rawDate === 'number' && rawDate > 20000 && rawDate < 80000) date = new Date(Math.round((rawDate - 25569) * 86400000)).toISOString();
        else if (String(rawDate || '').trim()) {
          const rawText=String(rawDate).trim();
          const dm=rawText.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
          const parsed=dm?new Date(Number(dm[3]),Number(dm[2])-1,Number(dm[1]),Number(dm[4]||0),Number(dm[5]||0),Number(dm[6]||0)):new Date(rawText);
          if(!Number.isNaN(parsed.getTime())) date=parsed.toISOString();
        }
        const qtyRaw = findColumnValue(row, ['soluongnhap','soluong','quantity','qty']);
        const costRaw = findColumnValue(row, ['gianhap','dongianhap','giavon','cost','importprice','unitprice']);
        const parseNumber = value => {
          if(typeof value==='number') return value;
          let t=String(value??'').trim().replace(/[^0-9,.-]/g,'');
          if(t.includes(',')&&t.includes('.')) t=t.lastIndexOf(',')>t.lastIndexOf('.')?t.replace(/\./g,'').replace(',','.'):t.replace(/,/g,'');
          else if(t.includes(',') && !/,[0-9]{1,2}$/.test(t)) t=t.replace(/,/g,'');
          else t=t.replace(',','.');
          return Number(t);
        };
        const qty = parseNumber(qtyRaw); const importCost = parseNumber(costRaw);
        const product = (products || []).find(p => (productCode && [p.code,p.barcode,p.sku,p.productCode].some(v => String(v || '').trim().toLowerCase() === productCode.toLowerCase())) || (productName && normalizeImportSearch(p.name) === normalizeImportSearch(productName)));
        const supplierMatch=(suppliers||[]).find(s=>supplierName&&normalizeImportSearch(s.name)===normalizeImportSearch(supplierName));
        return { rowNumber:index+2, productName, productCode, receiptCode, supplierName, supplierId:supplierMatch?.id||'', date:date||new Date(`${bulkImportDate||getVietnamDateKey(new Date())}T12:00:00+07:00`).toISOString(), qty, importCost, productId:product?.id || '', matchedName:product?.name || '', valid:!!product && Number.isFinite(qty) && qty>0 && Number.isFinite(importCost) && importCost>=0 };
      }).filter(row => row.productName || row.productCode);
      if (!parsed.length) throw new Error('Không tìm thấy dòng hàng hóa. File cần có cột Tên sản phẩm, Số lượng và Giá nhập.');
      setBulkImportRows(parsed); setBulkImportSelected(parsed.map(row=>row.rowNumber)); showToast(`Đã đọc đủ ${parsed.length} dòng hàng trong file (không giới hạn 200 dòng). Đã chọn tất cả; hệ thống tự chia đợt ghi 50 dòng để tránh quá tải.`);
    } catch (error) { showToast(error.message || 'Không đọc được file Excel.', 'error'); setBulkImportFile(null); setBulkImportRows([]); }
    finally { event.target.value = ''; }
  };
  const handleBulkImportSubmit = async () => {
    if (!bulkImportSelected.length) { showToast('Hãy đánh dấu ít nhất một dòng cần nhập.', 'error'); return; }
    const selectedRows=bulkImportRows.filter(row=>bulkImportSelected.includes(row.rowNumber));
    const invalid=selectedRows.filter(row=>!row.valid);
    const validSelectedRows=selectedRows.filter(row=>row.valid);
    if(!validSelectedRows.length){showToast(`Không có dòng hợp lệ để nhập. ${invalid.length ? `Có ${invalid.length} dòng cần sửa tên/mã sản phẩm, số lượng hoặc giá nhập.` : ''}`, 'error');return;}
    const unresolvedSuppliers=validSelectedRows.filter(row=>row.supplierName&&!row.supplierId&&!bulkImportSupplierId);
    if(unresolvedSuppliers.length){showToast(`Có ${unresolvedSuppliers.length} dòng hợp lệ nhưng tên nhà cung cấp chưa khớp. Hãy sửa tên hoặc chọn nhà cung cấp mặc định trước khi nhập.`, 'error');return;}
    // Chống nhập trùng dựa trên nội dung thực tế, không chỉ tên file/số dòng.
    // Tránh bỏ nhầm dữ liệu khi người dùng dùng lại tên file Excel cho dữ liệu mới.
    const makeBulkRowSignature = (productId, qty, importCost, receiptCode, date) => [
      String(productId || ''), Number(qty || 0), Number(importCost || 0),
      String(receiptCode || '').trim().toLocaleLowerCase('vi'), String(date || '').slice(0, 10)
    ].join('|');
    const existingSignatures=new Set();
    (imports||[]).forEach(im=>{
      (im.items||[]).forEach(it=>existingSignatures.add(makeBulkRowSignature(
        it.id||it.productId, it.qty??it.quantity, it.importCost??it.cost, im.receiptCode||it.receiptCode||'', im.date
      )));
      (im.sourceRowSignatures||[]).forEach(signature=>existingSignatures.add(String(signature)));
    });
    const duplicateRowNumbers=new Set();
    for(const row of validSelectedRows){
      const signature=makeBulkRowSignature(row.productId,row.qty,row.importCost,row.receiptCode,row.date);
      if(existingSignatures.has(signature)) duplicateRowNumbers.add(Number(row.rowNumber));
    }
    const rows=[...validSelectedRows].filter(row=>!duplicateRowNumbers.has(Number(row.rowNumber))).sort((a,b)=>new Date(a.date)-new Date(b.date));
    if(!rows.length){showToast(`Không có dòng mới để nhập. Đã tự bỏ qua ${duplicateRowNumbers.size} dòng trùng${invalid.length?` và ${invalid.length} dòng không hợp lệ`:''}.`, 'error');return;}
    const skippedSummary=[duplicateRowNumbers.size?`tự bỏ qua ${duplicateRowNumbers.size} dòng trùng`:null,invalid.length?`bỏ qua ${invalid.length} dòng không hợp lệ`:null].filter(Boolean).join(', ');
    if(!window.confirm(`Sẽ nhập ${rows.length} dòng hợp lệ chưa trùng theo thời gian nhập tăng dần. Không giới hạn tổng số dòng; hệ thống tự chia đợt ghi 50 dòng để giảm nguy cơ lỗi.${skippedSummary?` Hệ thống sẽ ${skippedSummary}.`:''} Tồn kho sẽ được đối chiếu với đơn hàng hiện có. Tiếp tục?`))return;
    setBulkImportBusy(true);setBulkImportProgress({done:0,total:rows.length});
    try{
      const salesByProduct=new Map();
      (orders||[]).forEach(order=>{const orderDate=new Date(order.date||order.createdAt||0).getTime();(order.items||[]).forEach(item=>{const pid=item.id||item.productId;if(!pid||!Number.isFinite(orderDate))return;const list=salesByProduct.get(pid)||[];list.push({date:orderDate,qty:Number(item.qty??item.quantity??1)||0});salesByProduct.set(pid,list);});});
      salesByProduct.forEach(list=>list.sort((a,b)=>a.date-b.date));
      // Only the remaining portion of newly reconstructed historical lots is added to current stock.
      const remainingByRow=new Map();
      const stockDeltasByProduct=new Map();
      const debtDeltasBySupplier=new Map();
      const rowsByProduct=new Map();rows.forEach(row=>{const list=rowsByProduct.get(row.productId)||[];list.push(row);rowsByProduct.set(row.productId,list);});
      rowsByProduct.forEach((productRows,pid)=>{
        const sales=[...(salesByProduct.get(pid)||[])];
        productRows.sort((a,b)=>new Date(a.date)-new Date(b.date));
        productRows.forEach(row=>{let lotQty=Number(row.qty)||0;const lotDate=new Date(row.date).getTime();for(const sale of sales){if(sale.qty<=0)continue;if(sale.date<lotDate)continue;const used=Math.min(lotQty,sale.qty);lotQty-=used;sale.qty-=used;if(lotQty<=0)break;}remainingByRow.set(row.rowNumber,lotQty);});
      });
      const supplierFallback=(suppliers||[]).find(item=>item.id===bulkImportSupplierId);
      for(let offset=0;offset<rows.length;offset+=50){
        const chunk=rows.slice(offset,offset+50);const batch=writeBatch(db);const groups=new Map();
        chunk.forEach(row=>{const sid=row.supplierId||bulkImportSupplierId||'';const supplier=(suppliers||[]).find(x=>x.id===sid)||supplierFallback;const groupKey=[sid,row.receiptCode||'',String(row.date||'').slice(0,10)].join('|');const group=groups.get(groupKey)||{sid,supplier,receiptCode:row.receiptCode||'',date:row.date,rows:[]};group.rows.push(row);groups.set(groupKey,group);});
        for(const group of groups.values()){
          const items=group.rows.map(row=>{const product=(products||[]).find(p=>p.id===row.productId);return{id:row.productId,productId:row.productId,name:row.matchedName||row.productName,qty:row.qty,quantity:row.qty,importCost:row.importCost,cost:row.importCost,price:Number(product?.price||0),category:product?.category||''};});
          const total=items.reduce((sum,item)=>sum+item.qty*item.importCost,0);const importRef=doc(collection(db,'stores',storeId,'imports'));
          batch.set(importRef,{invoiceCode:`EXCEL-${Date.now()}-${offset}-${groups.size}`,receiptCode:group.receiptCode,supplierId:group.sid,supplierName:group.supplier?.name||group.rows[0].supplierName||'Nhà cung cấp chưa xác định',createdByUid:user?.uid||'',createdByName:userData?.name||user?.displayName||user?.email||'Nhân viên',items,total,status:bulkImportDebt?'DEBT':'PAID',date:group.date,source:'excel-bulk',sourceFileName:bulkImportFile?.name||'',sourceRows:group.rows.map(row=>row.rowNumber),sourceRowSignatures:group.rows.map(row=>makeBulkRowSignature(row.productId,row.qty,row.importCost,row.receiptCode,row.date)),bulkImportChunk:Math.floor(offset/50)+1});
          if(bulkImportDebt&&group.sid&&group.supplier)debtDeltasBySupplier.set(group.sid,(debtDeltasBySupplier.get(group.sid)||0)+total);
        }
        const productDelta=new Map();chunk.forEach(row=>productDelta.set(row.productId,(productDelta.get(row.productId)||0)+(remainingByRow.get(row.rowNumber)||0)));
        for(const [pid,delta] of productDelta){if(delta<=0)continue;const product=(products||[]).find(p=>p.id===pid);if(!product)continue;const cumulative=(stockDeltasByProduct.get(pid)||0)+delta;stockDeltasByProduct.set(pid,cumulative);const latest=[...chunk].filter(r=>r.productId===pid).sort((a,b)=>new Date(a.date)-new Date(b.date)).at(-1);batch.update(doc(db,'stores',storeId,'products',pid),{stock:Number(product.stock||0)+cumulative,cost:latest?.importCost??Number(product.cost||0),lastSupplierId:latest?.supplierId||bulkImportSupplierId||'',lastSupplierName:(suppliers||[]).find(x=>x.id===(latest?.supplierId||bulkImportSupplierId))?.name||latest?.supplierName||''});}
        // Supplier debt is updated after all rows are processed to avoid overwriting increments within a batch.
        await batch.commit();setBulkImportProgress({done:Math.min(offset+chunk.length,rows.length),total:rows.length});
      }
      if(bulkImportDebt){for(const [sid,delta] of debtDeltasBySupplier){const supplier=(suppliers||[]).find(x=>x.id===sid);if(supplier&&delta>0)await updateDoc(doc(db,'stores',storeId,'suppliers',sid),{totalDebt:Number(supplier.totalDebt||0)+delta});}}
      showToast(`Đã nhập ${rows.length} dòng theo từng đợt 50 dòng${duplicateRowNumbers.size?`, tự bỏ qua ${duplicateRowNumbers.size} dòng trùng`:''}${invalid.length?`, bỏ qua ${invalid.length} dòng không hợp lệ`:''}. Tồn kho đã được xử lý theo logic đối chiếu hiện có.`);setBulkImportRows([]);setBulkImportSelected([]);setBulkImportFile(null);setActiveImportTab('history');
    }catch(error){showToast(`Nhập Excel bị gián đoạn. Không chạy lại toàn bộ file; hãy kiểm tra lịch sử nhập trước. ${error.message||''}`,'error');}
    finally{setBulkImportBusy(false);}
  };

  const addProductToCart = (p) => setCart(c => c.find(i => i.id === p.id) ? c : [...c, { id: p.id, name: p.name, category: p.category || '', qty: 1, importCost: p.cost || 0, price: p.price || 0 }]);

  const sortedImports = [...(imports || [])].sort((a, b) => {
    const field = historySort.field;
    let av = field === 'date' ? new Date(a.date || 0).getTime() : field === 'code' ? (a.invoiceCode || a.receiptCode || a.id || '') : field === 'supplier' ? (a.supplierName || '') : field === 'total' ? (Number(a.total) || 0) : field === 'status' ? (a.status || '') : (a.items || []).map(x => x.name || '').join(' ');
    let bv = field === 'date' ? new Date(b.date || 0).getTime() : field === 'code' ? (b.invoiceCode || b.receiptCode || b.id || '') : field === 'supplier' ? (b.supplierName || '') : field === 'total' ? (Number(b.total) || 0) : field === 'status' ? (b.status || '') : (b.items || []).map(x => x.name || '').join(' ');
    const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv), 'vi', {numeric:true, sensitivity:'base'});
    return historySort.direction === 'asc' ? cmp : -cmp;
  });
  const filteredHistoryImports = sortedImports.filter(im => {
    const haystack = `${im.invoiceCode || ''} ${im.receiptCode || ''} ${im.id || ''} ${im.supplierName || ''} ${(im.items || []).map(it => it.name || '').join(' ')}`.toLocaleLowerCase('vi');
    const dateKey = im.date ? getVietnamDateKey(new Date(im.date)) : '';
    return haystack.includes(historySearch.toLocaleLowerCase('vi')) && (historySupplierFilter === 'ALL' || im.supplierId === historySupplierFilter || im.supplierName === historySupplierFilter) && (!historyFromDate || dateKey >= historyFromDate) && (!historyToDate || dateKey <= historyToDate);
  });
  const paginatedImports = historyRowsPerPage === 'all' ? filteredHistoryImports : filteredHistoryImports.slice((historyCurrentPage - 1) * (Number(historyRowsPerPage) || 10), historyCurrentPage * (Number(historyRowsPerPage) || 10));
  const totalHistoryPages = historyRowsPerPage === 'all' ? 1 : Math.ceil(filteredHistoryImports.length / (Number(historyRowsPerPage) || 10));
  const importPeriodRows = sortedImports.filter(im => {
    if (!im.date) return false;
    const d = getVietnamDateParts(new Date(im.date));
    if (importTotalPeriod === 'day') return getVietnamDateKey(new Date(im.date)) === importTotalDay;
    if (importTotalPeriod === 'year') return String(d.year) === importTotalYear;
    return String(d.month) === importTotalMonth && String(d.year) === importTotalYear;
  });
  const importPeriodTotal = importPeriodRows.reduce((sum, im) => sum + (Number(im.total) || 0), 0);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 h-full">
      <div className="flex items-center gap-2 px-4 md:px-6 pt-4 bg-white border-b shrink-0">
        <button onClick={() => setActiveImportTab('history')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeImportTab === 'history' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>Lịch sử nhập hàng</button>
        <button onClick={() => setActiveImportTab('create')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeImportTab === 'create' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>Nhập hàng</button>
        <button onClick={() => setActiveImportTab('bulk')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeImportTab === 'bulk' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>Nhập hàng hàng loạt Excel</button>
      </div>
      {activeImportTab === 'history' ? (
        <div className="flex-1 overflow-auto p-4 md:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold text-gray-800">Lịch sử nhập hàng</h2><p className="text-sm text-gray-500 mt-1">Danh sách các phiếu nhập hàng đã ghi nhận, bao gồm phiếu nhập từ Excel.</p></div><div className="flex flex-wrap gap-2"><button onClick={() => setActiveImportTab('create')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2"><Plus size={16}/> Tạo phiếu nhập</button></div></div>
          <div className="bg-white rounded-xl border shadow-sm p-4"><div className="flex flex-wrap items-center gap-2 mb-2"><span className="font-bold text-sm text-purple-700">Tổng tiền nhập theo</span><select value={importTotalPeriod} onChange={e=>setImportTotalPeriod(e.target.value)} className="border rounded p-1.5 text-sm"><option value="year">Năm</option></select><select value={importTotalYear} onChange={e=>setImportTotalYear(e.target.value)} className="border rounded p-1.5 text-sm">{Array.from({length:8},(_,i)=>getVietnamDateParts(new Date()).year-i).map(y=><option key={y} value={String(y)}>{y}</option>)}</select></div><div className="text-2xl font-extrabold text-purple-700">{formatCurrency(importPeriodTotal)}</div><div className="text-xs text-gray-500">{importPeriodRows.length} phiếu nhập trong khoảng đã chọn · mặc định tháng hiện tại</div></div>
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden"><div className="p-3 border-b bg-gray-50 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2"><div className="relative"><Search size={16} className="absolute left-3 top-3 text-gray-400"/><input value={historySearch} onChange={e=>{setHistorySearch(e.target.value);setHistoryCurrentPage(1);}} placeholder="Tìm mã phiếu, nhà cung cấp, chi tiết hàng hóa..." className="w-full pl-9 pr-3 py-2 border rounded-lg bg-white text-sm"/></div><select value={historySupplierFilter} onChange={e=>{setHistorySupplierFilter(e.target.value);setHistoryCurrentPage(1);}} className="p-2 border rounded-lg bg-white text-sm"><option value="ALL">Tất cả nhà cung cấp</option>{suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select><label className="flex items-center gap-2 text-xs font-semibold">Từ ngày<input type="date" value={historyFromDate} onChange={e=>{setHistoryFromDate(e.target.value);setHistoryCurrentPage(1);}} className="min-w-0 flex-1 p-2 border rounded-lg bg-white"/></label><label className="flex items-center gap-2 text-xs font-semibold">Đến ngày<input type="date" value={historyToDate} onChange={e=>{setHistoryToDate(e.target.value);setHistoryCurrentPage(1);}} className="min-w-0 flex-1 p-2 border rounded-lg bg-white"/></label></div><div className="overflow-auto"><table className="w-full text-left text-sm min-w-[850px]"><thead className="bg-gray-100 text-gray-600"><tr><th className="p-3 cursor-pointer hover:bg-gray-200 whitespace-nowrap" onClick={() => handleHistorySort('date')}>Ngày nhập {historySort.field==='date' ? (historySort.direction==='asc' ? '↑' : '↓') : '↕'}</th><th className="p-3 cursor-pointer hover:bg-gray-200" onClick={() => handleHistorySort('code')}>Mã phiếu {historySort.field==='code' ? (historySort.direction==='asc' ? '↑' : '↓') : '↕'}</th><th className="p-3 cursor-pointer hover:bg-gray-200" onClick={() => handleHistorySort('supplier')}>Nhà cung cấp {historySort.field==='supplier' ? (historySort.direction==='asc' ? '↑' : '↓') : '↕'}</th><th className="p-3 cursor-pointer hover:bg-gray-200" onClick={() => handleHistorySort('items')}>Chi tiết hàng hóa {historySort.field==='items' ? (historySort.direction==='asc' ? '↑' : '↓') : '↕'}</th><th className="p-3 text-right cursor-pointer hover:bg-gray-200" onClick={() => handleHistorySort('total')}>Tổng tiền {historySort.field==='total' ? (historySort.direction==='asc' ? '↑' : '↓') : '↕'}</th><th className="p-3 cursor-pointer hover:bg-gray-200" onClick={() => handleHistorySort('status')}>Trạng thái {historySort.field==='status' ? (historySort.direction==='asc' ? '↑' : '↓') : '↕'}</th>{importColumns.actions && <th className="p-3 text-right">Thao tác</th>}</tr></thead><tbody>{paginatedImports.map((im, idx) => <tr key={im.id || idx} className="border-t hover:bg-gray-50 align-top"><td className="p-3 whitespace-nowrap">{im.date ? formatDate(im.date) : '—'}</td><td className="p-3 font-semibold">{im.invoiceCode || im.receiptCode || (im.id ? im.id.slice(0, 8) : '—')}</td><td className="p-3">{im.supplierName || 'Chưa rõ nhà cung cấp'}</td><td className="p-3">{(im.items || []).length ? <div className="space-y-1">{im.items.map((it, i) => <div key={i}>{it.name || 'Sản phẩm'} × {Number(it.qty ?? it.quantity ?? 0)}</div>)}</div> : 'Không có chi tiết hàng hóa'}</td><td className="p-3 text-right font-bold whitespace-nowrap">{formatCurrency(Number(im.total) || 0)}</td><td className="p-3"><span className={`px-2 py-1 rounded-lg text-xs font-bold ${im.status === 'DEBT' ? 'bg-orange-50 text-orange-700' : 'bg-green-50 text-green-700'}`}>{im.status === 'DEBT' ? 'Ghi nợ' : 'Đã thanh toán'}</span></td>{importColumns.actions && <td className="p-3"><div className="flex justify-end gap-1"><button onClick={() => setDetailImport(im)} className="text-gray-600 bg-gray-100 p-2 rounded-lg hover:bg-gray-200" title="Xem chi tiết phiếu nhập"><Eye size={15}/></button><button onClick={() => { setEditingImport(im); setSupplierId(im.supplierId || suppliers.find(x => x.name === im.supplierName)?.id || ''); setCart((im.items || []).map(it => ({...it, id: it.id || it.productId, qty: Number(it.qty ?? it.quantity ?? 1), importCost: Number(it.importCost ?? it.cost ?? 0)}))); setIsDebt(im.status === 'DEBT'); setActiveImportTab('create'); }} className="text-blue-600 bg-blue-50 p-2 rounded-lg hover:bg-blue-100" title="Sửa phiếu nhập"><Edit size={15}/></button><button onClick={async () => { if (!window.confirm('Xóa phiếu nhập này? Tồn kho và công nợ nhà cung cấp sẽ được điều chỉnh lại.')) return; try { const batch = writeBatch(db); (im.items || []).forEach(it => { const pid = it.id || it.productId; const p = products.find(prod => prod.id === pid); if (p) batch.update(doc(db, 'stores', storeId, 'products', pid), { stock: Number(p.stock || 0) - Number(it.qty ?? it.quantity ?? 0) }); }); const sup = suppliers.find(x => x.id === im.supplierId); if (im.status === 'DEBT' && sup) batch.update(doc(db, 'stores', storeId, 'suppliers', sup.id), { totalDebt: Math.max(0, Number(sup.totalDebt || 0) - Number(im.total || 0)) }); batch.delete(doc(db, 'stores', storeId, 'imports', im.id)); await batch.commit(); showToast('Đã xóa phiếu nhập'); } catch (err) { showToast('Không xóa được phiếu nhập: ' + err.message, 'error'); } }} className="text-blue-600 bg-blue-50 p-2 rounded-lg hover:bg-blue-100" title="Xóa phiếu nhập"><Trash2 size={15}/></button></div></td>}</tr>)}{paginatedImports.length === 0 && <tr><td colSpan={7} className="p-10 text-center text-gray-400">Chưa có lịch sử nhập hàng.</td></tr>}</tbody></table><PaginationControls currentPage={historyCurrentPage} totalPages={totalHistoryPages} rowsPerPage={historyRowsPerPage} onPageChange={setHistoryCurrentPage} onRowsChange={r=>{setHistoryRowsPerPage(r);setHistoryCurrentPage(1);}} totalItems={filteredHistoryImports.length}/></div></div>
        </div>
      ) : activeImportTab === 'bulk' ? (
        <div className="flex-1 overflow-auto p-4 md:p-6 space-y-4"><div className="bg-white border rounded-xl shadow-sm p-4 md:p-6 space-y-4">
          <div><h2 className="text-xl font-bold text-gray-800">Nhập hàng hàng loạt từ Excel</h2><p className="text-sm text-gray-500 mt-1">Hỗ trợ .xlsx/.xls không giới hạn 200 dòng. Đọc toàn bộ dòng dữ liệu trong sheet; hệ thống tự chia thành các đợt ghi nhỏ để tránh quá tải Firestore. Tên hoặc mã sản phẩm phải khớp hàng hóa có sẵn.</p></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3"><label className="block text-sm font-semibold">Nhà cung cấp *<select value={bulkImportSupplierId} onChange={e=>setBulkImportSupplierId(e.target.value)} className="mt-1 w-full p-3 border rounded-lg bg-white"><option value="">Chọn nhà cung cấp</option>{(suppliers||[]).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label><label className="block text-sm font-semibold">Ngày nhập<input type="date" value={bulkImportDate} onChange={e=>setBulkImportDate(e.target.value)} className="mt-1 w-full p-3 border rounded-lg bg-white"/></label><label className="block text-sm font-semibold">Chọn file Excel<input type="file" accept=".xlsx,.xls" onChange={handleBulkExcelSelect} className="mt-1 block w-full p-2 border rounded-lg bg-white text-sm"/></label></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={bulkImportDebt} onChange={e=>setBulkImportDebt(e.target.checked)}/> Ghi nợ nhà cung cấp</label><p className="text-xs text-gray-500">Cột cần có: Tên hàng/Tên sản phẩm, Số lượng, Giá nhập/Đơn giá nhập. Có thể có cột Mã hàng.</p>
          {bulkImportFile&&<div className="rounded-lg border bg-gray-50 p-3 text-sm"><b>{bulkImportFile.name}</b> · {bulkImportRows.length} dòng hàng đọc được</div>}
          {bulkImportRows.length>0&&<><div className="flex flex-wrap justify-between items-center gap-2"><b className="text-sm">Xem trước dữ liệu</b><div className="flex items-center gap-2 text-xs"><button type="button" onClick={()=>setBulkImportSelected(bulkImportRows.map(r=>r.rowNumber))} className="px-3 py-2 rounded border bg-white">Chọn tất cả</button><button type="button" onClick={()=>setBulkImportSelected([])} className="px-3 py-2 rounded border bg-white">Bỏ chọn</button><label>Hiển thị <select value={bulkImportPreviewLimit} onChange={e=>setBulkImportPreviewLimit(Number(e.target.value))} className="border rounded p-1"><option value={100}>100 dòng</option><option value={300}>300 dòng</option><option value={1000}>1000 dòng</option><option value={-1}>Tất cả dòng</option></select></label></div></div><div className="overflow-auto border rounded-lg max-h-[50vh]"><table className="w-full min-w-[1250px] text-sm"><thead className="sticky top-0 bg-gray-100"><tr><th className="p-2"><input aria-label="Chọn tất cả dòng đang hiển thị" type="checkbox" checked={(bulkImportPreviewLimit === -1 ? sortedBulkImportRows : sortedBulkImportRows.slice(0,bulkImportPreviewLimit)).length>0&&(bulkImportPreviewLimit === -1 ? sortedBulkImportRows : sortedBulkImportRows.slice(0,bulkImportPreviewLimit)).every(r=>bulkImportSelected.includes(r.rowNumber))} onChange={e=>setBulkImportSelected(prev=>e.target.checked?[...new Set([...prev,...(bulkImportPreviewLimit === -1 ? sortedBulkImportRows : sortedBulkImportRows.slice(0,bulkImportPreviewLimit)).map(r=>r.rowNumber)])]:prev.filter(id=>!(bulkImportPreviewLimit === -1 ? sortedBulkImportRows : sortedBulkImportRows.slice(0,bulkImportPreviewLimit)).some(r=>r.rowNumber===id)))} /></th>{[['rowNumber','Dòng'],['productName','Sản phẩm'],['qty','Số lượng'],['importCost','Giá nhập'],['total','Thành tiền'],['supplierName','Nhà cung cấp'],['date','Thời gian nhập'],['receiptCode','Mã phiếu'],['match','Đối chiếu']].map(([field,label])=><th key={field} onClick={()=>toggleBulkImportSort(field)} className="p-2 text-left cursor-pointer select-none whitespace-nowrap hover:bg-gray-200">{label} <span>{bulkImportSort.field===field?(bulkImportSort.direction==='asc'?'↑':'↓'):'↕'}</span></th>)}</tr></thead><tbody>{(bulkImportPreviewLimit === -1 ? sortedBulkImportRows : sortedBulkImportRows.slice(0,bulkImportPreviewLimit)).map((row,i)=><tr key={`${row.rowNumber}-${i}`} className="border-t"><td className="p-2"><input aria-label={`Chọn dòng ${row.rowNumber}`} type="checkbox" checked={bulkImportSelected.includes(row.rowNumber)} onChange={e=>setBulkImportSelected(prev=>e.target.checked?[...prev,row.rowNumber]:prev.filter(id=>id!==row.rowNumber))}/></td><td className="p-2">{row.rowNumber}</td><td className="p-2 min-w-[190px]">{row.matchedName||row.productName||row.productCode}</td><td className="p-2"><input type="number" min="0.0001" step="any" value={row.qty} onChange={e=>setBulkImportRows(prev=>prev.map(r=>r.rowNumber===row.rowNumber?{...r,qty:Number(e.target.value),valid:!!r.productId&&Number(e.target.value)>0&&Number.isFinite(Number(e.target.value))&&Number.isFinite(Number(r.importCost))&&Number(r.importCost)>=0}:r))} className="w-24 border rounded p-1"/></td><td className="p-2"><input type="number" min="0" step="any" value={row.importCost} onChange={e=>setBulkImportRows(prev=>prev.map(r=>r.rowNumber===row.rowNumber?{...r,importCost:Number(e.target.value),valid:!!r.productId&&Number(r.qty)>0&&Number.isFinite(Number(r.qty))&&Number.isFinite(Number(e.target.value))&&Number(e.target.value)>=0}:r))} className="w-28 border rounded p-1"/></td><td className="p-2 text-right whitespace-nowrap">{Number.isFinite(row.qty)&&Number.isFinite(row.importCost)?formatCurrency(row.qty*row.importCost):'—'}</td><td className="p-2 min-w-[170px]"><input value={row.supplierName||''} onChange={e=>{const value=e.target.value;const matched=(suppliers||[]).find(s=>normalizeImportSearch(s.name)===normalizeImportSearch(value));setBulkImportRows(prev=>prev.map(r=>r.rowNumber===row.rowNumber?{...r,supplierName:value,supplierId:matched?.id||''}:r));}} className="w-40 border rounded p-1" list="bulk-import-suppliers" placeholder="Tên nhà cung cấp"/><datalist id="bulk-import-suppliers">{(suppliers||[]).map(s=><option key={s.id} value={s.name}/>)}</datalist></td><td className="p-2"><input type="datetime-local" value={row.date?(()=>{const d=new Date(row.date);return Number.isNaN(d.getTime())?'':new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16)})():''} onChange={e=>{const d=new Date(e.target.value);if(!Number.isNaN(d.getTime()))setBulkImportRows(prev=>prev.map(r=>r.rowNumber===row.rowNumber?{...r,date:d.toISOString()}:r));}} className="min-w-[190px] border rounded p-1"/></td><td className="p-2"><input value={row.receiptCode||''} onChange={e=>setBulkImportRows(prev=>prev.map(r=>r.rowNumber===row.rowNumber?{...r,receiptCode:e.target.value}:r))} className="w-32 border rounded p-1"/></td><td className={`p-2 font-semibold ${row.valid?'text-green-700':'text-red-700'}`}>{row.valid?`Khớp: ${row.matchedName}`:'Không khớp / dữ liệu lỗi'}</td></tr>)}</tbody></table></div><div className="text-sm">Tổng dòng: <b>{bulkImportRows.length}</b> · Đã chọn: <b>{bulkImportSelected.length}</b> · Hợp lệ đã chọn: <b className="text-green-700">{bulkImportRows.filter(r=>bulkImportSelected.includes(r.rowNumber)&&r.valid).length}</b> · Cần sửa đã chọn: <b className="text-red-700">{bulkImportRows.filter(r=>bulkImportSelected.includes(r.rowNumber)&&!r.valid).length}</b> · Số đợt ghi an toàn (50 dòng/đợt): <b>{Math.ceil(bulkImportSelected.length/50)}</b> · Không giới hạn tổng số dòng của file</div>
          {bulkImportBusy&&<div><div className="text-sm font-semibold mb-1">Đã xử lý {bulkImportProgress.done}/{bulkImportProgress.total} dòng</div><div className="h-2 rounded-full bg-gray-200 overflow-hidden"><div className="h-full bg-blue-600" style={{width:`${bulkImportProgress.total?bulkImportProgress.done/bulkImportProgress.total*100:0}%`}}/></div></div>}
          <button type="button" disabled={bulkImportBusy||bulkImportSelected.length===0} onClick={handleBulkImportSubmit} className="w-full md:w-auto px-5 py-3 rounded-xl bg-blue-600 text-white font-bold disabled:bg-gray-300">{bulkImportBusy?'Đang nhập Excel…':`Xác nhận nhập ${bulkImportSelected.length} dòng đã chọn`}</button></>}
        </div></div>
      ) : (
      <Modal isOpen={activeImportTab === 'create'} onClose={() => setActiveImportTab('history')} title={editingImport ? 'Sửa phiếu nhập hàng' : 'Tạo phiếu nhập hàng'} maxWidth="max-w-6xl">
      <div className="flex flex-col lg:flex-row overflow-hidden min-h-0 h-[80vh] max-h-[80vh] lg:h-[75vh] lg:max-h-[75vh]">
      <div className="flex-1 min-w-0 min-h-0 p-4 md:p-6 flex flex-col overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3 shrink-0">
          <div className="flex items-center gap-2"><h2 className="text-xl font-bold text-gray-800">Chọn sản phẩm nhập</h2><button type="button" onClick={() => { setShowAddProdModal(v => !v); setNewProdForm(v => ({ ...v, name: v.name || searchTerm })); setGroupSearch(''); setShowGroupSuggestions(false); }} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow"><Plus size={14}/> {showAddProdModal ? 'Đóng thêm mới' : 'Sản phẩm mới'}</button></div>
          <div className="relative z-[110] w-full sm:w-64"><Search size={16} className="absolute left-3 top-3 text-gray-400"/><input placeholder="Tìm kiếm sản phẩm nhập..." value={searchTerm} onFocus={()=>setShowProductSuggestions(!!searchTerm.trim())} onBlur={()=>setTimeout(()=>setShowProductSuggestions(false),120)} onChange={e=>{const value=e.target.value;setSearchTerm(value);setImportCurrentPage(1);setShowProductSuggestions(!!value.trim());}} className="w-full pl-9 pr-3 py-2 border rounded-lg bg-white outline-none text-sm"/>
            {showProductSuggestions && <div className="absolute left-0 right-0 top-full mt-1 z-[120] max-h-64 overflow-auto overscroll-contain bg-white border rounded-lg shadow-xl">{filteredProducts.slice(0,8).map(p=><button type="button" key={p.id} onMouseDown={e=>e.preventDefault()} onClick={()=>{addProductToCart(p);setSearchTerm('');setShowProductSuggestions(false);}} className="block w-full text-left px-4 py-3.5 text-sm hover:bg-blue-50 touch-manipulation min-h-[52px]"><span className="font-semibold">{p.name}</span><span className="block text-xs text-gray-500">{p.category || 'Chưa phân nhóm'} · Tồn: {p.stock}</span></button>)}{filteredProducts.length===0 && <div className="px-3 py-2 text-sm text-gray-500">Không tìm thấy sản phẩm phù hợp.</div>}<button type="button" onClick={()=>{setShowAddProdModal(true);setShowProductSuggestions(false);setNewProdForm(v=>({...v,name:searchTerm}));}} className="w-full text-left px-3 py-2 text-sm text-blue-700 font-semibold border-t"><Plus size={14} className="inline mr-1"/>Thêm sản phẩm mới</button></div>}
          </div>
        </div>

        {showAddProdModal && <form onSubmit={handleAddNewProductInImport} className="mb-3 bg-white border border-blue-200 rounded-xl p-3 sm:p-4 space-y-3 shadow-sm">
          <div className="font-bold text-sm text-blue-700">Thêm sản phẩm mới ngay trong phiếu nhập</div>
          <div><label className="block text-xs font-bold text-gray-500 mb-1">Tên sản phẩm *</label><input required placeholder="Nhập tên sản phẩm..." value={newProdForm.name} onChange={e=>setNewProdForm(v=>({...v,name:e.target.value}))} className="w-full p-2.5 border rounded-lg outline-none text-sm"/></div>
          <div className="relative"><label className="block text-xs font-bold text-gray-500 mb-1">Nhóm hàng</label><input placeholder="Tìm hoặc chọn nhóm hàng..." value={groupSearch} onFocus={()=>setShowGroupSuggestions(true)} onBlur={()=>setTimeout(()=>setShowGroupSuggestions(false),120)} onChange={e=>{const value=e.target.value;setGroupSearch(value);setNewProdForm(v=>({...v,category:value}));setShowGroupSuggestions(!!value.trim());if(!value.trim())setShowAddGroupForm(false);}} className="w-full p-2.5 border rounded-lg outline-none text-sm"/>
            {showGroupSuggestions && <div className="absolute left-0 right-0 top-full z-[130] mt-1 border rounded-lg max-h-48 overflow-auto overscroll-contain bg-white shadow-xl">{visibleGroups.slice(0,8).map((g,i)=><button type="button" key={`${g}-${i}`} onClick={()=>{setNewProdForm(v=>({...v,category:g}));setGroupSearch(g);setShowGroupSuggestions(false);}} className="block w-full text-left px-3 py-2 text-sm hover:bg-blue-50">{g}</button>)}<button type="button" onClick={()=>{setNewGroupName(groupSearch || newProdForm.category);setShowAddGroupForm(v=>!v);}} className="w-full text-left px-3 py-2 text-sm text-blue-700 font-semibold border-t"><Plus size={14} className="inline mr-1"/>Thêm nhóm hàng mới</button></div>}
            {showAddGroupForm && <div className="mt-2 flex gap-2"><input value={newGroupName} onChange={e=>setNewGroupName(e.target.value)} placeholder="Tên nhóm hàng mới" className="min-w-0 flex-1 p-2 border rounded-lg text-sm"/><button type="button" onClick={handleAddGroupQuick} className="px-3 rounded-lg bg-blue-600 text-white text-sm font-bold">Chọn nhóm</button></div>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><div><label className="block text-xs font-bold text-gray-500 mb-1">Giá vốn (đ) *</label><input type="number" step="any" placeholder="0" value={newProdForm.cost} onChange={e=>setNewProdForm(v=>({...v,cost:e.target.value}))} className="w-full min-w-0 p-3 border rounded-lg text-sm"/></div><div><label className="block text-xs font-bold text-gray-500 mb-1">Giá bán (đ) *</label><input type="number" step="any" placeholder="0" value={newProdForm.price} onChange={e=>setNewProdForm(v=>({...v,price:e.target.value}))} className="w-full min-w-0 p-3 border rounded-lg text-sm"/></div></div>
          <button type="submit" disabled={isAddingNewProduct} className="w-full bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold p-2.5 rounded-lg text-sm">{isAddingNewProduct ? 'Đang lưu sản phẩm...' : 'Lưu & đưa vào phiếu nhập'}</button>
        </form>}
        <div className="flex-1 min-h-0 bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col justify-between">
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
                  const stockClass = p.stock < 0 ? 'text-blue-600' : 'text-gray-800';
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
      
      <div className="w-full lg:w-[460px] bg-white border-l shadow-lg z-20 flex flex-col flex-1 min-h-0 lg:flex-none lg:h-full">
        <div className="p-4 border-b bg-gray-50"><h2 className="font-bold flex items-center gap-2"><ArrowDownToLine size={20} className="text-gray-600"/> {editingImport ? `Sửa phiếu nhập ${editingImport.invoiceCode || editingImport.id?.slice(0,8) || ""}` : "Phiếu Nhập Kho"}</h2>{editingImport && <button onClick={() => { setEditingImport(null); setCart([]); setSupplierId(''); setIsDebt(false); }} className="text-xs text-blue-600 mt-2">Hủy chỉnh sửa</button>}</div>
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
          {cart.map(item => (
            <div key={item.id} className="bg-gray-50 p-3 rounded-xl border space-y-2 shadow-sm">
              <div className="flex justify-between items-center"><h4 className="font-bold text-sm text-gray-800 truncate">{item.name}</h4><button onClick={() => setCart(c => c.filter(i => i.id !== item.id))} className="text-blue-400 hover:text-blue-600"><X size={16}/></button></div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><label className="text-[10px] text-gray-500 font-bold">Số lượng nhập</label><input type="number" value={item.qty} onChange={e => setCart(c => c.map(i => i.id === item.id ? {...i, qty: Number(e.target.value)} : i))} className="w-full p-1.5 border rounded outline-none font-bold text-center bg-white" /></div>
                <div><label className="text-[10px] text-gray-500 font-bold">Đơn giá nhập (đ)</label><input type="number" step="any" value={item.importCost} onChange={e => setCart(c => c.map(i => i.id === item.id ? {...i, importCost: e.target.value === '' ? 0 : Number(e.target.value)} : i))} className="w-full p-1.5 border rounded outline-none font-bold text-blue-600 text-center bg-white" /></div>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-gray-200"><span className="text-[11px] text-gray-500">Thành tiền:</span><span className="font-bold text-xs text-gray-900">{formatCurrency(Number(item.qty || 0) * Number(item.importCost || 0))}</span></div>
            </div>
          ))}
          {cart.length === 0 && <div className="text-center text-gray-400 py-12">Chưa chọn sản phẩm nào để nhập</div>}
        </div>
        <div className="p-4 border-t bg-gray-50 space-y-3">
          <div className="relative">
            <label className="block text-xs font-bold text-gray-500 mb-1">Nhà cung cấp *</label>
            <input required value={supplierSearch || ((suppliers || []).find(s=>s.id===supplierId)?.name || '')} onFocus={()=>setShowSupplierSuggestions(!!supplierSearch.trim())} onBlur={()=>setTimeout(()=>setShowSupplierSuggestions(false),120)} onChange={e=>{const value=e.target.value;setSupplierSearch(value);setSupplierId('');setShowSupplierSuggestions(!!value.trim());}} placeholder="Tìm hoặc chọn nhà cung cấp..." className="w-full p-2.5 border rounded-lg outline-none text-sm bg-white font-medium"/>
            {showSupplierSuggestions && <div className="absolute z-30 top-full left-0 right-0 mt-1 max-h-56 overflow-auto overscroll-contain bg-white border rounded-lg shadow-lg">{visibleSuppliers.slice(0,8).map(s=><button type="button" key={s.id} onClick={()=>{setSupplierId(s.id);setSupplierSearch(s.name);setShowSupplierSuggestions(false);}} className="block w-full text-left px-3 py-2 text-sm hover:bg-blue-50">{s.name}</button>)}<button type="button" onClick={()=>{setNewSuppForm(v=>({...v,name:supplierSearch}));setShowAddSuppModal(v=>!v);setShowSupplierSuggestions(false);}} className="w-full text-left px-3 py-2 text-sm text-blue-700 font-semibold border-t"><Plus size={14} className="inline mr-1"/>Thêm nhà cung cấp mới</button></div>}
          </div>
          {showAddSuppModal && <form onSubmit={handleAddSupplierQuick} className="border border-blue-200 bg-white rounded-xl p-3 space-y-2">
            <div className="font-bold text-sm text-blue-700">Thêm nhà cung cấp mới</div>
            <input required placeholder="Tên nhà cung cấp *" value={newSuppForm.name} onChange={e=>setNewSuppForm({...newSuppForm,name:e.target.value})} className="w-full p-2.5 border rounded-lg outline-none text-sm"/>
            <input placeholder="Số điện thoại" value={newSuppForm.phone} onChange={e=>setNewSuppForm({...newSuppForm,phone:e.target.value})} className="w-full p-2.5 border rounded-lg outline-none text-sm"/>
            <input placeholder="Địa chỉ" value={newSuppForm.address} onChange={e=>setNewSuppForm({...newSuppForm,address:e.target.value})} className="w-full p-2.5 border rounded-lg outline-none text-sm"/>
            <button type="submit" className="w-full bg-blue-600 text-white font-bold p-2.5 rounded-lg text-sm">Lưu & chọn nhà cung cấp</button>
          </form>}
          <div className="flex gap-2"><button onClick={() => setIsDebt(false)} className={"flex-1 py-2 rounded-lg border font-bold text-xs " + (!isDebt ? 'bg-blue-600 text-white' : 'bg-white')}>Tiền mặt</button><button onClick={() => setIsDebt(true)} className={"flex-1 py-2 rounded-lg border font-bold text-xs " + (isDebt ? 'bg-orange-500 text-white' : 'bg-white')}>Ghi nợ NCC</button></div>
          <div className="flex justify-between items-center px-1"><span className="text-sm font-bold text-gray-700">Tổng tiền nhập:</span><span className="text-lg font-bold text-blue-600">{formatCurrency(cart.reduce((sum, i) => sum + (Number(i.qty || 0) * Number(i.importCost || 0)), 0))}</span></div>
          <button onClick={handleImport} disabled={!supplierId || cart.length === 0} className="w-full bg-gray-800 disabled:bg-gray-300 text-white py-3 rounded-xl font-bold mt-1 shadow-sm">{editingImport ? "Lưu chỉnh sửa phiếu nhập" : "Hoàn tất Nhập Hàng"}</button>
        </div>
      </div>

      </div>
      </Modal>
      )}
      <Modal isOpen={!!detailImport} onClose={() => setDetailImport(null)} title={`Chi tiết phiếu nhập ${detailImport?.invoiceCode || detailImport?.receiptCode || detailImport?.id?.slice(0, 8) || ''}`} maxWidth="max-w-3xl">
        {detailImport && <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-gray-50 border p-3"><p className="text-xs text-gray-500">Ngày nhập</p><p className="font-semibold">{detailImport.date ? formatDate(detailImport.date) : '—'}</p></div>
            <div className="rounded-lg bg-gray-50 border p-3"><p className="text-xs text-gray-500">Mã phiếu</p><p className="font-semibold">{detailImport.invoiceCode || detailImport.receiptCode || detailImport.id?.slice(0, 8) || '—'}</p></div>
            <div className="rounded-lg bg-gray-50 border p-3"><p className="text-xs text-gray-500">Nhà cung cấp</p><button type="button" onClick={() => { setDetailImport(null); navigateMainTab('suppliers', { id: detailImport.supplierId, name: detailImport.supplierName }); }} className="font-semibold text-blue-700 underline text-left">{detailImport.supplierName || 'Chưa rõ nhà cung cấp'} · Mở thẻ nhà cung cấp</button></div>
            <div className="rounded-lg bg-gray-50 border p-3"><p className="text-xs text-gray-500">Trạng thái</p><p className={`font-semibold ${detailImport.status === 'DEBT' ? 'text-orange-700' : 'text-green-700'}`}>{detailImport.status === 'DEBT' ? 'Ghi nợ NCC' : 'Đã thanh toán'}</p></div>
          </div>
          <div className="overflow-auto border rounded-xl"><table className="w-full text-sm min-w-[560px]"><thead className="bg-gray-100"><tr><th className="p-3 text-left">STT</th><th className="p-3 text-left">Sản phẩm</th><th className="p-3 text-right">Số lượng</th><th className="p-3 text-right">Đơn giá nhập</th><th className="p-3 text-right">Thành tiền</th></tr></thead><tbody>{(detailImport.items || []).map((it, i) => { const qty = Number(it.qty ?? it.quantity ?? 0); const price = Number(it.importCost ?? it.cost ?? 0); return <tr key={it.id || it.productId || i} className="border-t"><td className="p-3">{i + 1}</td><td className="p-3 font-medium"><button type="button" onClick={() => { setDetailImport(null); navigateMainTab('products', it.id || it.productId || '', it.name || ''); }} className="text-blue-700 underline text-left">{it.name || 'Sản phẩm'} · Mở thẻ hàng hóa</button></td><td className="p-3 text-right">{qty}</td><td className="p-3 text-right whitespace-nowrap">{formatCurrency(price)}</td><td className="p-3 text-right font-semibold whitespace-nowrap">{formatCurrency(qty * price)}</td></tr>; })}{!(detailImport.items || []).length && <tr><td colSpan={5} className="p-5 text-center text-gray-400">Phiếu nhập không có chi tiết hàng hóa.</td></tr>}</tbody></table></div>
          <div className="flex items-center justify-between border-t pt-3"><span className="font-bold text-gray-700">Tổng tiền nhập</span><span className="text-xl font-extrabold text-blue-700">{formatCurrency(Number(detailImport.total) || (detailImport.items || []).reduce((sum, it) => sum + Number(it.qty ?? it.quantity ?? 0) * Number(it.importCost ?? it.cost ?? 0), 0))}</span></div>
          <div className="flex justify-end"><button onClick={() => setDetailImport(null)} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 font-semibold text-sm">Đóng</button></div>
        </div>}
      </Modal>

    </div>
  );
}

function SettingsView({ db, storeId, showToast, storeConfig }) {
  const [activeSubTab, setActiveSubTab] = useState('general');
  const [editPaperSize, setEditPaperSize] = useState('K80');
  const [editingWarrantyPrint, setEditingWarrantyPrint] = useState(false);
  const [editingQuotePrint, setEditingQuotePrint] = useState(false);
  
  const [form, setForm] = useState({
    name: storeConfig?.name || '', address: storeConfig?.address || '', phone: storeConfig?.phone || '', logo: storeConfig?.logo || '',
    costCalcMethod: storeConfig?.costCalcMethod || 'LATEST',
    quotePrintA4: { printFontSize: 12, printPageMargin: 18, printTablePaddingX: 4, printTablePaddingY: 6, printDetailFontScale: 80, colWidthStt: 5, colWidthProduct: 35, colWidthQty: 8, colWidthPrice: 12, colWidthWarranty: 12, colWidthNote: 13, colWidthTotal: 15, printLogoWidth: 75, printLogoHeight: 64, printShowLogo: true, printShowStoreName: true, printShowStoreAddress: true, printShowStorePhone: true, printShowDate: true, printShowInvoiceId: true, printShowCustomer: true, printShowCustomerPhone: true, printShowCustomerAddress: true, printShowWarranty: true, printShowNote: true, printShowSignatures: true, printInvoiceTitle: 'BÁO GIÁ', printFooter: 'Báo giá có hiệu lực theo thỏa thuận.', ...(storeConfig?.quotePrintA4 || {}) },
    printPaperSize: storeConfig?.printPaperSize || 'K80',
    K80: storeConfig?.K80 || { printFontSize: 12, printTablePaddingX: 4, printTablePaddingY: 6, printDetailFontScale: 80, colWidthStt: 5, colWidthProduct: 35, colWidthQty: 8, colWidthPrice: 12, colWidthWarranty: 12, colWidthNote: 13, colWidthTotal: 15, printShowLogo: true, printShowStoreName: true, printShowStoreAddress: true, printShowStorePhone: true, printInvoiceTitle: 'HÓA ĐƠN BÁN HÀNG', printShowInvoiceId: true, printShowDate: true, printShowCashier: true, printShowCustomer: true, printShowCustomerPhone: true, printShowStatus: true, printShowWarranty: true, printShowNote: true, printFooter: 'Cảm ơn quý khách và hẹn gặp lại!', fsStoreNameOffset: 2, fsStoreAddressOffset: 0, fsStorePhoneOffset: 0, fsInvoiceTitleOffset: 4, fsMetaOffset: 0 },
    A4: storeConfig?.A4 || { printFontSize: 12, printTablePaddingX: 4, printTablePaddingY: 6, printDetailFontScale: 80, colWidthStt: 5, colWidthProduct: 35, colWidthQty: 8, colWidthPrice: 12, colWidthWarranty: 12, colWidthNote: 13, colWidthTotal: 15, printShowLogo: true, printShowStoreName: true, printShowStoreAddress: true, printShowStorePhone: true, printInvoiceTitle: 'HÓA ĐƠN BÁN HÀNG', printShowInvoiceId: true, printShowDate: true, printShowCashier: true, printShowCustomer: true, printShowCustomerPhone: true, printShowStatus: true, printShowWarranty: true, printShowNote: true, printFooter: 'Cảm ơn quý khách và hẹn gặp lại!', fsStoreNameOffset: 2, fsStoreAddressOffset: 0, fsStorePhoneOffset: 0, fsInvoiceTitleOffset: 4, fsMetaOffset: 0 },
    A5: storeConfig?.A5 || { printFontSize: 12, printTablePaddingX: 4, printTablePaddingY: 6, printDetailFontScale: 80, colWidthStt: 5, colWidthProduct: 35, colWidthQty: 8, colWidthPrice: 12, colWidthWarranty: 12, colWidthNote: 13, colWidthTotal: 15, printShowLogo: true, printShowStoreName: true, printShowStoreAddress: true, printShowStorePhone: true, printInvoiceTitle: 'HÓA ĐƠN BÁN HÀNG', printShowInvoiceId: true, printShowDate: true, printShowCashier: true, printShowCustomer: true, printShowCustomerPhone: true, printShowStatus: true, printShowWarranty: true, printShowNote: true, printFooter: 'Cảm ơn quý khách và hẹn gặp lại!', fsStoreNameOffset: 2, fsStoreAddressOffset: 0, fsStorePhoneOffset: 0, fsInvoiceTitleOffset: 4, fsMetaOffset: 0 }
  });

  const [loadingFile, setLoadingFile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletePasswordConfirm, setDeletePasswordConfirm] = useState('');
  const [deletingData, setDeletingData] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState('');
  const [stockFileBusy, setStockFileBusy] = useState(false);
  const [stockPreview, setStockPreview] = useState(null);
  const [stockImportProgress, setStockImportProgress] = useState('');
  const [contactDebtPreview, setContactDebtPreview] = useState(null);
  const [contactDebtBusy, setContactDebtBusy] = useState(false);
  const [duplicateRepairPreview, setDuplicateRepairPreview] = useState(null);
  const [duplicateRepairBusy, setDuplicateRepairBusy] = useState(false);
  const [zipBusy, setZipBusy] = useState(false);
  const [zipRestorePreview, setZipRestorePreview] = useState(null);
  const [zipRestoreProgress, setZipRestoreProgress] = useState('');

  useEffect(() => {
    if (storeConfig) {
      setForm(prev => ({
        ...prev,
        ...storeConfig,
        K80: { ...(prev.K80 || {}), ...(storeConfig.K80 || {}) },
        A4: { ...(prev.A4 || {}), ...(storeConfig.A4 || {}) },
        A5: { ...(prev.A5 || {}), ...(storeConfig.A5 || {}) },
        warrantyPrintA4: { ...(prev.warrantyPrintA4 || { printFontSize: 12 }), ...(storeConfig.warrantyPrintA4 || {}) },
        warrantyPrintA5: { ...(prev.warrantyPrintA5 || { printFontSize: 11 }), ...(storeConfig.warrantyPrintA5 || {}) }
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

  // Rà chi tiết trùng trong các giao dịch đơn hàng/nhập hàng và lịch sử theo khách/NCC.
  // Một số dữ liệu cũ lưu giao dịch của nhà cung cấp trong collection orders, vì vậy
  // cần rà cả supplierId/supplierName trên orders, không chỉ customerId.
  const duplicateNormalize = value => String(value ?? '').trim().toLocaleLowerCase('vi').replace(/\s+/g, ' ');
  const duplicateNormalizeTime = value => {
    if (value === undefined || value === null || value === '') return '';
    let parsed;
    if (typeof value?.toDate === 'function') parsed = value.toDate();
    else if (value instanceof Date) parsed = value;
    else if (typeof value === 'number') parsed = new Date(value);
    else {
      const raw = String(value).trim();
      const local = raw.match(/^(?:(\d{1,2}):(\d{2})(?::(\d{2}))?\s+)?(\d{1,2})[\/. -](\d{1,2})[\/. -](\d{2,4})$/);
      if (local) {
        const hour=Number(local[1]||0), minute=Number(local[2]||0), second=Number(local[3]||0), day=Number(local[4]), month=Number(local[5]);
        let year=Number(local[6]); if(year<100) year += year>=70 ? 1900 : 2000;
        parsed = new Date(year, month-1, day, hour, minute, second);
      } else parsed = new Date(raw);
    }
    return parsed && !Number.isNaN(parsed.getTime()) ? String(Math.floor(parsed.getTime() / 1000) * 1000) : duplicateNormalize(value);
  };
  const duplicateNormalizeNumber = value => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
    let raw=String(value ?? '0').trim().replace(/[^0-9,.-]/g,''); if(!raw) return 0;
    if(raw.includes('.')&&raw.includes(',')) raw=raw.lastIndexOf(',')>raw.lastIndexOf('.') ? raw.replace(/\./g,'').replace(',','.') : raw.replace(/,/g,'');
    else if(raw.includes(',')&&!raw.includes('.')) raw=/,\d{1,2}$/.test(raw)?raw.replace(',','.'):raw.replace(/,/g,'');
    else if((raw.match(/\./g)||[]).length>1||/\.\d{3}$/.test(raw)) raw=raw.replace(/\./g,'');
    return Number(raw);
  };
  const duplicateDetailSignatures = (type, data, item) => {
    // Ưu tiên tên/mã hiển thị ổn định vì dữ liệu cũ đôi khi có productId khác nhau
    // nhưng cùng một mặt hàng. Nếu không có tên/mã mới dùng ID.
    const productKey = duplicateNormalize(item.name || item.productName || item.product || item.code || item.productCode || item.productId || item.id);
    const rawTime = item.transactionTime || item.date || item.createdAt || item.saleDate || item.purchaseDate || data.date || data.createdAt || data.importDate || data.time || '';
    const timeKey = duplicateNormalizeTime(rawTime);
    const qty = duplicateNormalizeNumber(item.qty ?? item.quantity ?? item.count ?? 0);
    if (!productKey || !timeKey || !Number.isFinite(qty) || qty <= 0) return [];
    const roles = [];
    const customer = data.customerId || data.customerCode || data.customerName || data.customer;
    const supplier = data.supplierId || data.supplierCode || data.supplierName || data.supplier;
    if (customer) roles.push({ role: 'customer', contact: customer, price: item.salePrice ?? item.price ?? item.unitPrice ?? 0 });
    if (supplier) roles.push({ role: 'supplier', contact: supplier, price: item.importCost ?? item.cost ?? item.importPrice ?? item.price ?? 0 });
    // Phiếu nhập thường chỉ có NCC; đơn bán thường chỉ có khách. Nếu không có contact
    // rõ ràng thì không xóa tự động vì chưa đủ căn cứ.
    return roles.map(({role,contact,price}) => {
      const normalizedPrice = duplicateNormalizeNumber(price);
      if (!Number.isFinite(normalizedPrice)) return null;
      return [type, role, duplicateNormalize(contact), productKey, timeKey, qty, normalizedPrice].join('::');
    }).filter(Boolean);
  };

  const findDuplicateProductDetails = async () => {
    setDuplicateRepairBusy(true);
    try {
      const foundByDoc = new Map();
      const seenDetails = new Map();
      for (const type of ['orders', 'imports']) {
        const snap = await getDocs(collection(db, 'stores', storeId, type));
        const docs = snap.docs.map(d => ({ id:d.id, data:d.data() }));
        docs.sort((a,b)=>String(a.data.date||a.data.createdAt||a.id).localeCompare(String(b.data.date||b.data.createdAt||b.id)));
        for (const {id,data} of docs) {
          const items = Array.isArray(data.items) ? data.items : [];
          items.forEach((item,index) => {
            const signatures = duplicateDetailSignatures(type,data,item);
            for (const signature of signatures) {
              if (!seenDetails.has(signature)) { seenDetails.set(signature,{id,index}); continue; }
              const docKey=`${type}::${id}`;
              if (!foundByDoc.has(docKey)) foundByDoc.set(docKey,{type,id,data,duplicateIndexes:[],duplicateSignatures:{},duplicateLineCount:0});
              const record=foundByDoc.get(docKey);
              if (!record.duplicateIndexes.includes(index)) {
                record.duplicateIndexes.push(index);
                record.duplicateLineCount++;
              }
              record.duplicateSignatures[index] = [...new Set([...(record.duplicateSignatures[index]||[]),signature])];
              break;
            }
          });
        }
      }
      const found=[...foundByDoc.values()];
      setDuplicateRepairPreview({records:found,scannedAt:new Date().toISOString()});
      const total=found.reduce((n,r)=>n+r.duplicateLineCount,0);
      showToast(total ? `Tìm thấy ${total} dòng chi tiết có khả năng trùng trong ${found.length} giao dịch, gồm lịch sử khách hàng và nhà cung cấp. Chưa thay đổi dữ liệu.` : 'Không tìm thấy dòng trùng đủ điều kiện. Lưu ý: nếu dữ liệu lịch sử được lưu ở collection khác orders/imports, cần bổ sung nguồn đó; chưa có dữ liệu nào bị thay đổi.');
    } catch(err) {
      console.error(err);
      showToast('Không thể rà dữ liệu trùng: '+(err?.message||'Lỗi Firestore'),'error');
    } finally { setDuplicateRepairBusy(false); }
  };

  const applyDuplicateProductRepair = async () => {
    if (!duplicateRepairPreview || duplicateRepairBusy) return;
    const records=duplicateRepairPreview.records||[];
    const totalLines=records.reduce((n,r)=>n+(r.duplicateIndexes||[]).length,0);
    if(!totalLines){showToast('Không có dữ liệu trùng để xử lý.');return;}
    if(!window.confirm(`Tìm thấy ${totalLines} dòng chi tiết có khả năng trùng trong ${records.length} giao dịch. Hệ thống sẽ sao lưu bản gốc vào repairArchive và chỉ loại bỏ dòng trùng đã khớp đối tượng, sản phẩm, thời gian, số lượng, đơn giá. Không xóa hóa đơn và không cập nhật tổng tiền, công nợ hoặc tồn kho. Tiếp tục?`)) return;
    setDuplicateRepairBusy(true);
    let repaired=0,removedLines=0;
    try {
      for(const record of records){
        const sourceRef=doc(db,'stores',storeId,record.type,record.id);
        const latestSnap=await getDoc(sourceRef); if(!latestSnap.exists()) continue;
        const current=latestSnap.data(); const items=Array.isArray(current.items)?current.items:[];
        const indexes=[...new Set(record.duplicateIndexes||[])].filter(i=>{
          if(!Number.isInteger(i)||i<0||i>=items.length) return false;
          const currentSignatures=duplicateDetailSignatures(record.type,current,items[i]);
          const savedSignatures=record.duplicateSignatures?.[i]||[];
          return savedSignatures.some(sig=>currentSignatures.includes(sig));
        }).sort((a,b)=>a-b);
        if(!indexes.length) continue;
        const archiveRef=doc(collection(db,'stores',storeId,'repairArchive'));
        await setDoc(archiveRef,{sourceCollection:record.type,sourceId:record.id,originalData:current,archivedAt:new Date().toISOString(),reason:'duplicate-product-detail-repair-customer-supplier-history',removedIndexes:indexes});
        const removeSet=new Set(indexes);
        await updateDoc(sourceRef,{items:items.filter((_,index)=>!removeSet.has(index)),duplicateRepairArchiveId:archiveRef.id,duplicateRepairAt:new Date().toISOString()});
        repaired++; removedLines+=indexes.length;
      }
      setDuplicateRepairPreview(null);
      showToast(`Đã loại bỏ ${removedLines} dòng chi tiết trùng trong ${repaired} giao dịch. Bản gốc đã sao lưu vào repairArchive; tổng tiền, công nợ và tồn kho không bị ghi đè.`);
    } catch(err) {
      console.error(err);
      showToast(`Đã xử lý ${repaired} giao dịch trước khi gặp lỗi. Kiểm tra repairArchive trước khi chạy lại: ${err?.message||'Lỗi Firestore'}`,'error');
    } finally { setDuplicateRepairBusy(false); }
  };

  const parseContactDebtNumber = value => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    let x = String(value ?? '').trim().replace(/\s/g, '').replace(/[^0-9,.-]/g, '');
    if (!x) return 0;
    if (x.includes('.') && x.includes(',')) x = x.lastIndexOf(',') > x.lastIndexOf('.') ? x.replace(/\./g, '').replace(',', '.') : x.replace(/,/g, '');
    else if (x.includes(',')) x = /,\d{1,2}$/.test(x) ? x.replace(',', '.') : x.replace(/,/g, '');
    else if ((x.match(/\./g) || []).length > 1 || /\.\d{3}$/.test(x)) x = x.replace(/\./g, '');
    const n = Number(x); return Number.isFinite(n) ? n : 0;
  };
  const handleContactDebtExcelSelect = async (e, type) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!window.XLSX) { showToast('Thư viện Excel chưa tải xong. Hãy tải lại trang rồi thử lại.', 'error'); e.target.value = ''; return; }
    if (file.size > 25 * 1024 * 1024) { showToast('File Excel lớn hơn 25 MB. Vui lòng tách file.', 'error'); e.target.value = ''; return; }
    setLoadingFile(true);
    try {
      const wb = window.XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
      const sheetName = wb.SheetNames.find(n => ['DanhBa','Danh bạ','Data'].includes(n)) || wb.SheetNames[0];
      const rows = window.XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '', blankrows: false });
      if (!rows.length) throw new Error('Sheet danh bạ không có dữ liệu.');
      const isCustomer = type === 'customers';
      const codeKeys = isCustomer ? ['Mã khách hàng','Mã'] : ['Mã nhà cung cấp','Mã'];
      const nameKeys = isCustomer ? ['Tên khách hàng','Tên'] : ['Tên nhà cung cấp','Tên'];
      const first = (row, keys) => { for (const k of keys) if (row[k] !== undefined && String(row[k]).trim() !== '') return row[k]; return ''; };
      let skippedJson = 0;
      const parsed = rows.map((r,i) => {
        const code = String(first(r,codeKeys)||'').trim(), name = String(first(r,nameKeys)||'').trim();
        const json = value => {
          if (value === undefined || value === null || String(value).trim() === '') return [];
          try { const out = typeof value === 'string' ? JSON.parse(value) : value; if (!Array.isArray(out)) throw new Error(); return out; }
          catch { skippedJson++; return []; }
        };
        if (!code && !name) return null;
        const totalDebt = Math.max(0,parseContactDebtNumber(r['Tổng nợ']));
        const remainingRaw = r['Nợ còn lại'];
        const remainingDebt = Math.max(0,parseContactDebtNumber(remainingRaw !== undefined && String(remainingRaw).trim() !== '' ? remainingRaw : r['Tổng nợ']));
        return { sourceRow:i+2, code, name, phone:String(r['Điện thoại']||r['Số điện thoại']||''), address:String(r['Địa chỉ']||''), totalDebt, remainingDebt, debtDetails:json(r['Chi tiết nợ (JSON)']), payments:json(r['Lịch sử thanh toán (JSON)']) };
      }).filter(Boolean);
      if (!parsed.length) throw new Error('Không tìm thấy dòng nào có mã hoặc tên.');
      // If duplicate rows exist, keep the first row and skip later duplicates instead of failing the whole import.
      const seen = new Set();
      const uniqueParsed = parsed.filter(row => { const key = (row.code || row.name).trim().toLocaleLowerCase('vi'); if (seen.has(key)) return false; seen.add(key); return true; });
      setContactDebtPreview({ type, fileName:file.name, rows:uniqueParsed, sourceRows:rows.length, skippedDuplicates:parsed.length-uniqueParsed.length, skippedJson });
      showToast(`Đã đọc trước ${uniqueParsed.length} ${isCustomer?'khách hàng':'nhà cung cấp'}. Dòng trùng và JSON lỗi sẽ được bỏ qua; số nợ còn lại lấy theo Excel. Chưa ghi dữ liệu; kiểm tra rồi xác nhận.`);
    } catch(err) { console.error(err); showToast('Không đọc được file công nợ: '+(err?.message||'Lỗi không xác định'), 'error'); }
    finally { setLoadingFile(false); e.target.value = ''; }
  };
  const applyContactDebtImport = async () => {
    if (!contactDebtPreview || contactDebtBusy) return;
    const {type,rows}=contactDebtPreview; const label=type==='customers'?'khách hàng':'nhà cung cấp';
    if (!window.confirm(`XÁC NHẬN THAY THẾ ${label.toLocaleUpperCase('vi')} VÀ CÔNG NỢ THEO EXCEL?\n\n- Danh bạ và lịch sử thanh toán của loại này sẽ được thay theo file.\n- Đơn hàng/phiếu nhập cũ không bị xóa.\n- Giao dịch chỉ được liên kết khi đối chiếu chính xác mã giao dịch.\n- Nên sao lưu trước khi tiếp tục.`)) return;
    setContactDebtBusy(true); setLoadingFile(true);
    try {
      const base = ['stores',storeId,type];
      const snap = await getDocs(collection(db,...base));
      const old = snap.docs.map(d=>({id:d.id,...d.data()}));
      const norm = v => String(v||'').trim().toLocaleLowerCase('vi');
      const byCode = new Map(old.filter(x=>x.code).map(x=>[norm(x.code),x]));
      const byName = new Map(old.filter(x=>x.name).map(x=>[norm(x.name),x]));
      const usedIds = new Set(); const mapped=[];
      for (const row of rows) {
        const existing = (row.code && byCode.get(norm(row.code))) || (row.name && byName.get(norm(row.name)));
        const id = existing?.id || doc(collection(db,...base)).id;
        if (existing) usedIds.add(id);
        mapped.push({...row,id, existing:!!existing});
      }
      // Contact documents are replaced from the workbook. Old orders/imports remain untouched.
      let batch=writeBatch(db), count=0;
      for (const row of mapped) {
        const {id,sourceRow,debtDetails,payments,remainingDebt,...contact}=row;
        batch.set(doc(db,...base,id),{code:contact.code,name:contact.name,phone:contact.phone,address:contact.address,totalDebt:row.remainingDebt,originalDebt:row.totalDebt,updatedAt:new Date().toISOString()},{merge:false}); count++;
        if(count>=300){await batch.commit();batch=writeBatch(db);count=0;}
      }
      if(count) await batch.commit();
      // Keep historical orders/imports untouched. The Excel contact balance is the authoritative balance
      // shown on the web; malformed or unmatched historical details must not block or alter that balance.
      const collectionName = type==='customers'?'orders':'imports';
      // Replace payment subcollections for imported contacts; keep old transaction documents.
      for (const row of mapped) {
        const payRef=collection(db,...base,row.id,'debtPayments'); const paySnap=await getDocs(payRef);
        for(let i=0;i<paySnap.docs.length;i+=400){const b=writeBatch(db);paySnap.docs.slice(i,i+400).forEach(d=>b.delete(d.ref));await b.commit();}
        const reportSnap=await getDocs(collection(db,'stores',storeId,'debtPaymentReports'));
        const oldReports=reportSnap.docs.filter(d=>d.data().contactType===type && d.data().contactId===row.id);
        for(let i=0;i<oldReports.length;i+=400){const b=writeBatch(db);oldReports.slice(i,i+400).forEach(d=>b.delete(d.ref));await b.commit();}
        const payments=row.payments||[];
        for(let i=0;i<payments.length;i+=400){const b=writeBatch(db);payments.slice(i,i+400).forEach((pay,j)=>{const clean={...pay};delete clean.id;const ref=doc(db,...base,row.id,'debtPayments',String(pay.id||doc(collection(db,...base,row.id,'debtPayments')).id));b.set(ref,{...clean,contactId:row.id,contactName:row.name,contactType:type});const reportId=`${type}_${row.id}_${ref.id}`;b.set(doc(db,'stores',storeId,'debtPaymentReports',reportId),{...clean,id:reportId,sourcePaymentId:ref.id,source:'contactDebt',contactId:row.id,contactName:row.name,contactType:type,direction:type==='customers'?'Khách hàng trả nợ':'Trả nợ nhà cung cấp',date:clean.date||clean.createdAt||new Date().toISOString()});});await b.commit();}
      }
      // Delete contacts absent from the workbook after clearing their payment subcollections.
      const absent=old.filter(x=>!usedIds.has(x.id) && !mapped.some(m=>m.id===x.id));
      for(const row of absent){const ps=await getDocs(collection(db,...base,row.id,'debtPayments'));for(let i=0;i<ps.docs.length;i+=400){const b=writeBatch(db);ps.docs.slice(i,i+400).forEach(d=>b.delete(d.ref));await b.commit();}await deleteDoc(doc(db,...base,row.id));}
      setContactDebtPreview(null); showToast(`Đã cố định công nợ theo Excel cho ${mapped.length} ${label}; giữ nguyên ${collectionName==='orders'?'đơn hàng':'phiếu nhập'} cũ. Chi tiết lịch sử không khớp sẽ không làm thay đổi số dư đã nhập.`);
    } catch(err) { console.error(err); showToast('Nhập công nợ chưa hoàn tất: '+(err?.message||'Lỗi Firestore/kết nối. Kiểm tra dữ liệu trước khi chạy lại.'), 'error'); }
    finally { setContactDebtBusy(false); setLoadingFile(false); }
  };

  const handleImport = async (e, type) => {
    if (type === 'customers' || type === 'suppliers') return handleContactDebtExcelSelect(e, type);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!window.XLSX) {
      showToast('Thư viện Excel chưa tải xong. Hãy tải lại trang rồi thử lại.', 'error');
      e.target.value = '';
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      showToast('File Excel lớn hơn 25 MB. Vui lòng tách file thành các phần nhỏ rồi nhập lại.', 'error');
      e.target.value = '';
      return;
    }
    setLoadingFile(true);
    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const wb = window.XLSX.read(evt.target.result, { type: 'binary', cellDates: true });
          const sheet = wb.Sheets[wb.SheetNames[0]];
          const data = window.XLSX.utils.sheet_to_json(sheet, { defval: '', blankrows: false });
          // Không cắt mảng dữ liệu theo số dòng cố định: xử lý toàn bộ các dòng có dữ liệu trong sheet.
          const sourceRowCount = data.length;
          if (!sourceRowCount) { showToast('Sheet Excel không có dòng dữ liệu để nhập.', 'error'); setLoadingFile(false); e.target.value = ''; return; }
          if (!window.confirm(`File Excel có ${sourceRowCount.toLocaleString('vi-VN')} dòng dữ liệu. Hệ thống sẽ đọc toàn bộ file, không giới hạn 200 dòng. Tiếp tục nhập?`)) { setLoadingFile(false); e.target.value = ''; return; }
          const textVal = v => String(v ?? '').trim();
          const norm = v => textVal(v).toLocaleLowerCase('vi');
          const numberVal = v => {
            if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
            let x = textVal(v).replace(/\s/g, '').replace(/[^0-9,.-]/g, '');
            if (!x) return 0;
            if (x.includes('.') && x.includes(',')) x = x.lastIndexOf(',') > x.lastIndexOf('.') ? x.replace(/\./g, '').replace(',', '.') : x.replace(/,/g, '');
            else if (x.includes(',')) x = /,\d{1,2}$/.test(x) ? x.replace(',', '.') : x.replace(/,/g, '');
            else if ((x.match(/\./g) || []).length > 1 || /\.\d{3}$/.test(x)) x = x.replace(/\./g, '');
            const n = Number(x); return Number.isFinite(n) ? n : 0;
          };
          const dateVal = v => {
            if (v instanceof Date && !Number.isNaN(v.getTime())) return v.toISOString();
            if (typeof v === 'number') return new Date(Math.round((v - 25569) * 86400 * 1000)).toISOString();
            const raw = textVal(v); if (!raw) return new Date().toISOString();
            const m = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
            if (m) return new Date(Number(m[3]), Number(m[2])-1, Number(m[1]), Number(m[4]||0), Number(m[5]||0), Number(m[6]||0)).toISOString();
            const d = new Date(raw); return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
          };
          let success = 0;
          let skippedDuplicates = 0;

          // Danh mục khách hàng: chỉ lưu mã + tên; dòng đầu tiên hợp lệ được ưu tiên.
          if (type === 'customers' || type === 'suppliers') {
            const isCustomer = type === 'customers';
            const codeCol = isCustomer ? 'Mã khách hàng' : 'Mã nhà cung cấp';
            const nameCol = isCustomer ? 'Tên khách hàng' : 'Tên nhà cung cấp';
            const snap = await getDocs(collection(db, 'stores', storeId, type));
            const existingByKey = new Map();
            snap.docs.forEach(d => {
              const x = d.data();
              if (textVal(x.code)) existingByKey.set('c:' + norm(x.code), d.id);
              if (textVal(x.name)) existingByKey.set('n:' + norm(x.name), d.id);
            });
            const seen = new Set();
            let batch = writeBatch(db), writes = 0;
            for (const row of data) {
              const code = textVal(row[codeCol]);
              const name = textVal(row[nameCol]);
              if (!code && !name) continue;
              const keys = [code && 'c:' + norm(code), name && 'n:' + norm(name)].filter(Boolean);
              if (keys.some(k => seen.has(k))) continue;
              keys.forEach(k => seen.add(k));
              const phone = textVal(row['Điện thoại'] || row['Số điện thoại'] || row['SĐT'] || row['Số ĐT']);
              const address = textVal(row['Địa chỉ'] || row['Địa chỉ giao hàng'] || row['Địa chỉ khách hàng']);
              const debtRaw = isCustomer
                ? (row['Tổng nợ'] ?? row['Tổng Nợ'] ?? row['Nợ phải thu'] ?? row['Nợ cần thu hiện tại'] ?? 0)
                : (row['Tổng nợ'] ?? row['Tổng Nợ'] ?? row['Nợ phải trả'] ?? row['Nợ cần trả hiện tại'] ?? 0);
              const totalDebt = Math.max(0, numberVal(debtRaw));
              const contactPayload = { code, name, phone, address, totalDebt };
              const matchedId = keys.map(k => existingByKey.get(k)).find(Boolean);
              if (matchedId) {
                batch.update(doc(db, 'stores', storeId, type, matchedId), contactPayload); writes++; success++;
              } else {
                const ref = doc(collection(db, 'stores', storeId, type));
                batch.set(ref, contactPayload); writes++; success++;
                keys.forEach(k => existingByKey.set(k, ref.id));
              }
              if (writes >= 300) { await batch.commit(); batch = writeBatch(db); writes = 0; }
            }
            if (writes) await batch.commit();
          }
          // Sản phẩm: chỉ đọc Mã hàng, Tên hàng, Giá bán, Giá vốn, Tồn kho.
          // Tồn kho trong file là số chuẩn thay thế tồn cũ, không cộng dồn.
          else if (type === 'products') {
            const snap = await getDocs(collection(db, 'stores', storeId, 'products'));
            const existing = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            const byCode = new Map(), byName = new Map();
            existing.forEach(p => { if (textVal(p.code)) byCode.set(norm(p.code), p); if (textVal(p.name)) byName.set(norm(p.name), p); });
            // Xóa số tồn cũ của các sản phẩm đang có; các dòng trong file sẽ thiết lập lại tồn chính xác.
            let batch = writeBatch(db), writes = 0;
            for (const p of existing) {
              batch.update(doc(db, 'stores', storeId, 'products', p.id), { stock: 0 }); writes++;
              if (writes >= 300) { await batch.commit(); batch = writeBatch(db); writes = 0; }
            }
            if (writes) { await batch.commit(); batch = writeBatch(db); writes = 0; }
            const seen = new Set();
            for (const row of data) {
              const code = textVal(row['Mã hàng'] || row['Mã sản phẩm']);
              const name = textVal(row['Tên hàng'] || row['Tên sản phẩm']);
              if (!code && !name) continue;
              const keys = [code && 'c:' + norm(code), name && 'n:' + norm(name)].filter(Boolean);
              if (keys.some(key => seen.has(key))) continue;
              keys.forEach(key => seen.add(key));
              const current = (code && byCode.get(norm(code))) || byName.get(norm(name));
              const productData = {
                code, name,
                price: numberVal(row['Giá bán']),
                cost: numberVal(row['Giá vốn']),
                stock: Math.max(0, numberVal(row['Tồn kho']))
              };
              if (current) {
                batch.update(doc(db, 'stores', storeId, 'products', current.id), productData);
                current.stock = productData.stock; current.code = code; current.name = name;
                if (code) byCode.set(norm(code), current); if (name) byName.set(norm(name), current);
              } else {
                const ref = doc(collection(db, 'stores', storeId, 'products'));
                batch.set(ref, productData);
                const added = { id: ref.id, ...productData };
                if (code) byCode.set(norm(code), added); if (name) byName.set(norm(name), added);
              }
              writes++; success++;
              if (writes >= 300) { await batch.commit(); batch = writeBatch(db); writes = 0; }
            }
            if (writes) await batch.commit();
          }
          // Hóa đơn: chỉ lấy đúng các cột người dùng chỉ định; gom các dòng theo Mã hóa đơn.
          else if (type === 'orders') {
            const ordersMap = new Map();
            const [customerSnap, productSnap, existingOrderSnap] = await Promise.all([
              getDocs(collection(db, 'stores', storeId, 'customers')),
              getDocs(collection(db, 'stores', storeId, 'products')),
              getDocs(collection(db, 'stores', storeId, 'orders'))
            ]);
            const customerByCode = new Map(customerSnap.docs.map(d => [norm(d.data().code), { id: d.id, ...d.data() }]).filter(([k]) => k));
            const customerByName = new Map(customerSnap.docs.map(d => [norm(d.data().name), { id: d.id, ...d.data() }]));
            const productByCode = new Map(productSnap.docs.map(d => [norm(d.data().code), { id: d.id, ...d.data() }]).filter(([k]) => k));
            const productByName = new Map(productSnap.docs.map(d => [norm(d.data().name), { id: d.id, ...d.data() }]));
            const existingOrderByCode = new Map(existingOrderSnap.docs.map(d => [textVal(d.data().invoiceCode || d.data().id), d.id]).filter(([k]) => k));
            for (const row of data) {
              const invoiceCode = textVal(row['Mã hóa đơn']);
              const itemName = textVal(row['Tên hàng']);
              if (!invoiceCode) continue;
              if (!ordersMap.has(invoiceCode)) {
                const customerCode = textVal(row['Mã khách hàng']);
                const customerName = textVal(row['Tên khách hàng']) || 'Khách lẻ';
                const matchedCustomer = (customerCode && customerByCode.get(norm(customerCode))) || customerByName.get(norm(customerName));
                ordersMap.set(invoiceCode, {
                  id: invoiceCode, invoiceCode,
                  date: dateVal(row['Thời gian']),
                  customerCode,
                  customerId: matchedCustomer?.id || null,
                  customerName,
                  sellerName: textVal(row['Người bán']),
                  total: numberVal(row['Tổng tiền hàng']),
                  paidAmount: numberVal(row['Khách đã trả']),
                  status: numberVal(row['Khách đã trả']) >= numberVal(row['Tổng tiền hàng']) ? 'PAID' : 'DEBT',
                  totalCost: 0, items: []
                });
              }
              const order = ordersMap.get(invoiceCode);
              if (itemName) {
                const qty = numberVal(row['Số lượng']);
                const unitPrice = numberVal(row['Giá bán']) || numberVal(row['Đơn giá']);
                const itemCode = textVal(row['Mã hàng']);
                const matchedProduct = (itemCode && productByCode.get(norm(itemCode))) || productByName.get(norm(itemName));
                order.items.push({
                  id: matchedProduct?.id || '', productId: matchedProduct?.id || '',
                  code: itemCode, name: itemName,
                  category: textVal(row['Nhóm hàng']) || textVal(matchedProduct?.category), unit: textVal(row['ĐVT']),
                  quantity: qty, price: unitPrice, salePrice: numberVal(row['Giá bán']),
                  lineTotal: numberVal(row['Thành tiền']), cost: 0,
                  warrantyValue: '', warrantyUnit: 'tháng'
                });
              }
            }
            let batch = writeBatch(db), writes = 0;
            for (const order of ordersMap.values()) {
              // Mã hóa đơn là khóa đối chiếu: nếu đã có thì bỏ qua, không ghi đè đơn hàng đang tồn tại.
              if (existingOrderByCode.has(order.invoiceCode)) { skippedDuplicates++; continue; }
              const orderRef = doc(collection(db, 'stores', storeId, 'orders'));
              batch.set(orderRef, order, { merge: true }); writes++; success++;
              existingOrderByCode.set(order.invoiceCode, orderRef.id);
              if (writes >= 300) { await batch.commit(); batch = writeBatch(db); writes = 0; }
            }
            if (writes) await batch.commit();
          }
          // Nhập hàng: chỉ dùng các cột nhập hàng đã chỉ định và so khớp mã hàng/tên hàng với danh mục.
          else if (type === 'imports') {
            // Đọc danh mục song song và giới hạn thời gian chờ trước khi bắt đầu ghi.
            // Nếu Firestore đang chậm/hết hạn mức, báo lỗi rõ ràng thay vì quay vô hạn.
            const readTimeout = (promise, label, timeoutMs = 60000) => Promise.race([
              promise,
              new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} quá 60 giây. Kiểm tra kết nối hoặc hạn mức Firestore rồi thử lại.`)), timeoutMs))
            ]);
            const [productSnap, supplierSnap, existingImportSnap] = await Promise.all([
              readTimeout(getDocs(collection(db, 'stores', storeId, 'products')), 'Đọc danh mục sản phẩm'),
              readTimeout(getDocs(collection(db, 'stores', storeId, 'suppliers')), 'Đọc danh mục nhà cung cấp'),
              readTimeout(getDocs(collection(db, 'stores', storeId, 'imports')), 'Đọc lịch sử nhập hàng')
            ]);
            const productDocs = productSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            const productByCode = new Map(productDocs.filter(p => textVal(p.code)).map(p => [norm(p.code), p]));
            const productByName = new Map(productDocs.map(p => [norm(p.name), p]));
            const supplierByCode = new Map(supplierSnap.docs.map(d => [norm(d.data().code), { id: d.id, ...d.data() }]).filter(([k]) => k));
            const supplierByName = new Map(supplierSnap.docs.map(d => [norm(d.data().name), { id: d.id, ...d.data() }]));
            const existingReceiptCodes = new Set(existingImportSnap.docs.map(d => norm(d.data().receiptCode || d.data().invoiceCode)).filter(Boolean));
            const fingerprint = (supplier, date, items) => `${norm(supplier)}|${getVietnamDateKey(new Date(date))}|${(items || []).map(it => `${norm(it.code || it.name)}:${numberVal(it.qty ?? it.quantity)}:${numberVal(it.importCost ?? it.cost)}`).sort().join(';')}`;
            const existingImportFingerprints = new Set(existingImportSnap.docs.filter(d => !d.data().receiptCode && !d.data().invoiceCode).map(d => fingerprint(d.data().supplierCode || d.data().supplierName, d.data().date, d.data().items)));
            const receipts = new Map();
            for (const row of data) {
              const itemName = textVal(row['Tên hàng']);
              const qty = numberVal(row['Số lượng']);
              if (!itemName || qty <= 0) continue;
              const supplierCode = textVal(row['Mã nhà cung cấp']);
              const supplierName = textVal(row['Tên nhà cung cấp']) || 'Nhà cung cấp';
              const date = dateVal(row['Thời gian']);
              const receiptCode = textVal(row['Mã phiếu nhập'] || row['Mã phiếu nhập hàng'] || row['Mã chứng từ'] || row['Mã phiếu'] || row['Số phiếu'] || row['Mã nhập hàng']);
              const groupKey = receiptCode ? `code:${norm(receiptCode)}` : `${supplierCode || norm(supplierName)}|${date.slice(0, 16)}|${norm(textVal(row['Người nhập']))}|${norm(textVal(row['Ghi chú']))}|${numberVal(row['Tổng tiền hàng'])}|${numberVal(row['Cần trả NCC'])}`;
              if (!receipts.has(groupKey)) receipts.set(groupKey, {
                receiptCode, date, supplierCode, supplierName, phone: textVal(row['Điện thoại']),
                createdByName: textVal(row['Người nhập']), note: textVal(row['Ghi chú']),
                total: numberVal(row['Tổng tiền hàng']), payable: numberVal(row['Cần trả NCC']),
                totalQty: numberVal(row['Tổng số lượng']), totalItems: numberVal(row['Tổng số mặt hàng']), items: []
              });
              const receipt = receipts.get(groupKey);
              const productCode = textVal(row['Mã hàng']);
              const product = (productCode && productByCode.get(norm(productCode))) || productByName.get(norm(itemName));
              const unitCost = numberVal(row['Giá nhập']) || numberVal(row['Đơn giá']);
              receipt.items.push({
                id: product?.id || '', productId: product?.id || '', code: productCode || textVal(product?.code),
                name: itemName, unit: textVal(row['ĐVT']), qty, quantity: qty,
                price: numberVal(row['Đơn giá']), importCost: unitCost,
                lineTotal: numberVal(row['Thành tiền']) || qty * unitCost,
                category: textVal(product?.category)
              });
            }
            let batch = writeBatch(db), writes = 0;
            const flushImportBatch = async () => { if (writes) { await batch.commit(); batch = writeBatch(db); writes = 0; } };
            for (const receipt of receipts.values()) {
              const receiptFingerprint = fingerprint(receipt.supplierCode || receipt.supplierName, receipt.date, receipt.items);
              if ((receipt.receiptCode && existingReceiptCodes.has(norm(receipt.receiptCode))) || (!receipt.receiptCode && existingImportFingerprints.has(receiptFingerprint))) {
                skippedDuplicates++;
                continue;
              }
              let supplier = (receipt.supplierCode && supplierByCode.get(norm(receipt.supplierCode))) || supplierByName.get(norm(receipt.supplierName));
              if (!supplier) {
                const ref = doc(collection(db, 'stores', storeId, 'suppliers'));
                supplier = { id: ref.id, code: receipt.supplierCode, name: receipt.supplierName };
                batch.set(ref, supplier); writes++;
                if (receipt.supplierCode) supplierByCode.set(norm(receipt.supplierCode), supplier);
                supplierByName.set(norm(receipt.supplierName), supplier);
              }
              const total = receipt.total || receipt.items.reduce((sum, it) => sum + numberVal(it.lineTotal), 0);
              const ref = doc(collection(db, 'stores', storeId, 'imports'));
              batch.set(ref, {
                date: receipt.date, receiptCode: receipt.receiptCode || '', supplierId: supplier.id, supplierCode: receipt.supplierCode,
                supplierName: receipt.supplierName, supplierPhone: receipt.phone,
                createdByName: receipt.createdByName, total, payable: receipt.payable,
                note: receipt.note, totalQty: receipt.totalQty || receipt.items.reduce((sum, it) => sum + it.qty, 0),
                totalItems: receipt.totalItems || receipt.items.length, items: receipt.items,
                status: 'PAID', source: 'Excel'
              }); writes++; success++;
              // Nhập hàng là lịch sử nhập, vì vậy tăng tồn đúng theo số lượng đã nhập.
              for (const it of receipt.items) {
                const product = it.productId && productDocs.find(p => p.id === it.productId);
                if (!product) continue;
                const nextStock = numberVal(product.stock) + it.qty;
                batch.update(doc(db, 'stores', storeId, 'products', product.id), { stock: nextStock, cost: it.importCost || numberVal(product.cost), lastSupplierId: supplier.id, lastSupplierName: receipt.supplierName });
                product.stock = nextStock; writes++;
                if (writes >= 300) await flushImportBatch();
              }
              if (writes >= 300) await flushImportBatch();
              if (receipt.receiptCode) existingReceiptCodes.add(norm(receipt.receiptCode));
              else existingImportFingerprints.add(receiptFingerprint);
            }
            if (writes) await batch.commit();
          }
          else if (type === 'expenses') {
            const existingExpenseSnap = await getDocs(collection(db, 'stores', storeId, 'expenses'));
            // Chỉ dùng mã phiếu làm khóa chống trùng. Không loại giao dịch chỉ vì trùng ngày/số tiền/nội dung.
            const existingVouchers = new Set(existingExpenseSnap.docs.map(d => textVal(d.data().voucherCode || d.data().voucher || d.data().receiptCode)).filter(Boolean).map(norm));
            const seenVouchers = new Set();
            let batch = writeBatch(db), writes = 0;
            for (const row of data) {
              const amount = numberVal(row['Giá trị'] !== '' ? row['Giá trị'] : row['Số tiền']);
              const typeText = textVal(row['Loại thu chi']);
              const voucher = textVal(row['Mã phiếu'] || row['Mã chứng từ'] || row['Số phiếu']);
              if (row['Giá trị'] !== undefined && !typeText.toLowerCase().includes('chi') && amount >= 0) continue;
              if (!voucher && !textVal(row['Nội dung']) && !textVal(row['Ghi chú'])) continue;
              const voucherKey = norm(voucher);
              if (voucherKey && (existingVouchers.has(voucherKey) || seenVouchers.has(voucherKey))) { skippedDuplicates++; continue; }
              if (voucherKey) seenVouchers.add(voucherKey);
              batch.set(doc(collection(db, 'stores', storeId, 'expenses')), {
                amount: Math.abs(amount), voucherCode: voucher,
                note: textVal(row['Nội dung'] || row['Ghi chú'] || [typeText, textVal(row['Người nộp/nhận']), voucher].filter(Boolean).join(' - ')),
                date: dateVal(row['Thời gian'] || row['Ngày'] || row['Ngày tạo'])
              }); writes++; success++;
              if (writes >= 300) { await batch.commit(); batch = writeBatch(db); writes = 0; }
            }
            if (writes) await batch.commit();
          }
          showToast(`Đã đọc ${sourceRowCount.toLocaleString('vi-VN')} dòng Excel; nhập ${success} dòng/mục. Bỏ qua ${skippedDuplicates} mục trùng theo khóa đối chiếu. Các cột ngoài danh sách quy định đã được bỏ qua.`);
          setLoadingFile(false); e.target.value = '';
        } catch (err) {
          console.error(err);
          showToast('Nhập Excel chưa hoàn tất: ' + (err?.message || 'Kiểm tra kết nối và hạn mức Firestore.'), 'error');
          setLoadingFile(false);
          e.target.value = '';
        }
      };
      reader.onerror = () => {
        console.error('Excel FileReader error:', reader.error);
        showToast('Không đọc được file Excel. Hãy thử lưu lại file .xlsx rồi nhập lại.', 'error');
        setLoadingFile(false);
        e.target.value = '';
      };
      reader.onabort = () => {
        showToast('Đã hủy đọc file Excel.', 'error');
        setLoadingFile(false);
        e.target.value = '';
      };
      reader.readAsBinaryString(file);
    } catch (err) {
      console.error('Excel import setup error:', err);
      showToast('Không thể bắt đầu nhập Excel: ' + (err?.message || 'Lỗi không xác định'), 'error');
      setLoadingFile(false);
      if (e?.target) e.target.value = '';
    }
  };
  const normalizeStockHeader = value => String(value ?? '').trim().toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]/g, '');
  const normalizeStockMatch = value => String(value ?? '').trim().toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]/g, '');
  const parseStockNumber = value => {
    if (typeof value === 'number') return value;
    let text = String(value ?? '').trim().replace(/\s/g, '').replace(/[^0-9,.-]/g, '');
    if (!text) return NaN;
    if (text.includes(',') && text.includes('.')) {
      if (text.lastIndexOf(',') > text.lastIndexOf('.')) text = text.replace(/\./g, '').replace(',', '.');
      else text = text.replace(/,/g, '');
    } else if (text.includes(',')) {
      const parts = text.split(',');
      text = parts.length === 2 && parts[1].length <= 2 ? `${parts[0]}.${parts[1]}` : parts.join('');
    } else if ((text.match(/\./g) || []).length > 1 || /\.\d{3}$/.test(text)) {
      text = text.replace(/\./g, '');
    }
    return Number(text);
  };
  const handleStockExcelSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!window.XLSX) { showToast('Thư viện Excel chưa tải xong. Tải lại trang rồi thử lại.', 'error'); e.target.value = ''; return; }
    if (file.size > 25 * 1024 * 1024) { showToast('File vượt quá 25 MB. Hãy chia nhỏ file.', 'error'); e.target.value = ''; return; }
    setStockFileBusy(true); setStockImportProgress('Đang đọc file Excel...');
    try {
      const buffer = await file.arrayBuffer();
      const wb = window.XLSX.read(buffer, { type: 'array', cellDates: true });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = window.XLSX.utils.sheet_to_json(sheet, { defval: '', blankrows: false, raw: false });
      if (!rows.length) throw new Error('File không có dòng dữ liệu.');
      const first = rows[0];
      const keys = Object.keys(first);
      const findKey = patterns => keys.find(k => patterns.includes(normalizeStockHeader(k)));
      const codeKey = findKey(['masanpham','mahang','masp','productcode','code']);
      const nameKey = findKey(['tensanpham','tenhang','tensp','productname','name']);
      const qtyKey = findKey(['tonkho','soluongton','tonhientai','stock','quantity','soluong']);
      if (!nameKey || !qtyKey) throw new Error('Không nhận diện được cột Tên sản phẩm hoặc Tồn kho. Cần các cột: Mã sản phẩm, Tên sản phẩm, Tồn kho.');
      const parsed = [];
      const seenCodes = new Set();
      const seenNames = new Set();
      let invalid = 0, duplicates = 0;
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const code = codeKey ? String(row[codeKey] ?? '').trim() : '';
        const name = String(row[nameKey] ?? '').trim();
        const rawQty = row[qtyKey];
        if (!code && !name && (rawQty === '' || rawQty == null)) continue;
        const qty = parseStockNumber(rawQty);
        if (!name || rawQty === '' || rawQty == null || !Number.isFinite(qty) || qty < 0) { invalid++; continue; }
        const ckey = code.toLocaleLowerCase('vi');
        const nkey = name.toLocaleLowerCase('vi');
        if ((code && seenCodes.has(ckey)) || (!code && seenNames.has(nkey))) { duplicates++; continue; }
        if (code) seenCodes.add(ckey); else seenNames.add(nkey);
        parsed.push({ code, name, stock: qty, sourceRow: i + 2 });
      }
      if (!parsed.length) throw new Error('Không có dòng tồn kho hợp lệ để đối chiếu.');
      setStockPreview({ fileName: file.name, rows: parsed, invalid, duplicates });
      setStockImportProgress(`Đã đọc ${parsed.length} dòng hợp lệ; ${invalid} dòng lỗi; ${duplicates} dòng trùng trong file.`);
    } catch (err) {
      showToast('Không đọc được file tồn kho: ' + (err?.message || 'Lỗi không xác định'), 'error');
      setStockPreview(null);
    } finally { setStockFileBusy(false); e.target.value = ''; }
  };

  const handleApplyStockExcel = async () => {
    if (!stockPreview?.rows?.length || stockFileBusy) return;
    const confirmed = window.confirm(`Bạn sắp ĐÈ SỐ TỒN ĐANG LƯU TRÊN WEB bằng số lượng trong file ${stockPreview.fileName}.\n\nChỉ sản phẩm khớp được mới cập nhật; tồn kho của sản phẩm không có trong Excel sẽ giữ nguyên. Không sửa lịch sử đơn hàng, phiếu nhập, nhà cung cấp hoặc công nợ.\n\nBạn đã sao lưu dữ liệu và muốn tiếp tục chưa?`);
    if (!confirmed) return;
    setStockFileBusy(true); setStockImportProgress('Đang đọc danh mục sản phẩm hiện tại và đối chiếu mã/tên...');
    try {
      const snap = await getDocs(collection(db, 'stores', storeId, 'products'));
      const byCode = new Map(), byName = new Map();
      const duplicateCodes = new Set(), duplicateNames = new Set();
      snap.docs.forEach(d => {
        const x = d.data();
        const code = normalizeStockMatch(x.code);
        const name = normalizeStockMatch(x.name);
        if (code) { if (byCode.has(code)) duplicateCodes.add(code); else byCode.set(code, d); }
        if (name) { if (byName.has(name)) duplicateNames.add(name); else byName.set(name, d); }
      });
      let matchedByCode = 0, matchedByName = 0, missing = 0, ambiguous = 0, updated = 0;
      const updates = [];
      for (const row of stockPreview.rows) {
        const codeKey = normalizeStockMatch(row.code);
        const nameKey = normalizeStockMatch(row.name);
        let productDoc = null;
        let matchType = '';
        if (codeKey && duplicateCodes.has(codeKey)) { ambiguous++; continue; }
        if (codeKey) {
          productDoc = byCode.get(codeKey) || null;
          if (productDoc) matchType = 'mã';
        }
        // If Excel contains a code that does not exist in the catalog, safely fall back to a unique exact normalized name.
        if (!productDoc && nameKey) {
          if (duplicateNames.has(nameKey)) { ambiguous++; continue; }
          productDoc = byName.get(nameKey) || null;
          if (productDoc) matchType = 'tên duy nhất';
        }
        if (!productDoc) { missing++; continue; }
        const current = productDoc.data();
        if (matchType === 'mã') matchedByCode++; else matchedByName++;
        updates.push({ ref: productDoc.ref, stock: row.stock, code: current.code || row.code || '', name: current.name || row.name, oldStock: Number(current.stock) || 0, matchType, sourceRow: row.sourceRow });
      }
      if (!updates.length) {
        setStockImportProgress(`Không có sản phẩm nào được cập nhật. Không khớp: ${missing}; mã/tên trùng, không an toàn để ghép: ${ambiguous}.`);
        showToast('Không tìm được sản phẩm khớp để cập nhật tồn kho.', 'error');
        return;
      }
      const sample = updates.slice(0, 8).map(x => `• ${x.code || x.name}: tồn web ${x.oldStock} → tồn Excel ${x.stock} (khớp theo ${x.matchType})`).join('\n');
      const proceed = window.confirm(`KẾT QUẢ ĐỐI CHIẾU\n- Khớp mã sản phẩm: ${matchedByCode}\n- Khớp tên duy nhất: ${matchedByName}\n- Không tìm thấy: ${missing}\n- Mã/tên trùng, bỏ qua: ${ambiguous}\n\nVí dụ tồn kho sẽ bị thay thế:\n${sample}${updates.length > 8 ? `\n... và ${updates.length - 8} sản phẩm khác` : ''}\n\nSẽ thay trường stock trên web bằng đúng số trong Excel cho ${updates.length} sản phẩm khớp. Sản phẩm không có trong Excel được giữ nguyên. Lịch sử đơn hàng/phiếu nhập/công nợ không thay đổi.\n\nXác nhận cập nhật?`);
      if (!proceed) { setStockImportProgress('Đã hủy cập nhật; dữ liệu chưa thay đổi.'); return; }
      const chunkSize = 400;
      for (let i = 0; i < updates.length; i += chunkSize) {
        const batch = writeBatch(db);
        const chunk = updates.slice(i, i + chunkSize);
        chunk.forEach(item => batch.update(item.ref, { stock: item.stock }));
        await batch.commit();
        updated += chunk.length;
        setStockImportProgress(`Đã thay số tồn theo Excel: ${updated}/${updates.length} sản phẩm...`);
      }
      setStockImportProgress(`Hoàn tất: đã thay tồn web bằng tồn Excel cho ${updated} sản phẩm (khớp mã ${matchedByCode}, khớp tên ${matchedByName}); không tìm thấy ${missing}; trùng/không an toàn ${ambiguous}.`);
      showToast(`Đã thay số tồn web bằng số tồn trong Excel cho ${updated} sản phẩm. Lịch sử đơn hàng, phiếu nhập và công nợ không bị sửa.`);
      setStockPreview(null);
    } catch (err) {
      console.error('Stock Excel update error:', err);
      setStockImportProgress('Cập nhật chưa hoàn tất. Một số lô trước đó có thể đã lưu; hãy kiểm tra tồn kho trước khi chạy lại.');
      showToast('Cập nhật tồn kho chưa hoàn tất: ' + (err?.code || err?.message || 'Lỗi Firestore'), 'error');
    } finally { setStockFileBusy(false); }
  };

  const handleExportCurrentStock = async () => {
    if (!window.XLSX || stockFileBusy) { showToast('Thư viện Excel chưa sẵn sàng.', 'error'); return; }
    setStockFileBusy(true); setStockImportProgress('Đang xuất tồn kho...');
    try {
      const snap = await getDocs(collection(db, 'stores', storeId, 'products'));
      const data = snap.docs.map(d => { const p = d.data(); return { 'Mã sản phẩm': p.code || '', 'Tên sản phẩm': p.name || '', 'Tồn kho': Number(p.stock) || 0 }; });
      const ws = window.XLSX.utils.json_to_sheet(data);
      const wb = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(wb, ws, 'TonKho');
      window.XLSX.writeFile(wb, 'Ton_Kho_San_Pham.xlsx');
      setStockImportProgress(`Đã xuất ${data.length} sản phẩm ra Excel.`);
      showToast('Đã xuất file tồn kho Excel.');
    } catch (err) {
      showToast('Không xuất được tồn kho: ' + (err?.code || err?.message || 'Lỗi Firestore'), 'error');
    } finally { setStockFileBusy(false); }
  };

  const ZIP_GROUPS = [
    { key: 'orders', file: '02_Don_Hang.xlsx', label: 'Đơn hàng' },
    { key: 'imports', file: '03_Nhap_Hang.xlsx', label: 'Nhập hàng' },
    { key: 'products', file: '04_San_Pham.xlsx', label: 'Sản phẩm' },
    { key: 'warrantyRequests', file: '05_Bao_Hanh.xlsx', label: 'Bảo hành' },
    { key: 'customers', file: '06_Khach_Hang.xlsx', label: 'Khách hàng' },
    { key: 'suppliers', file: '07_Nha_Cung_Cap.xlsx', label: 'Nhà cung cấp' },
    { key: 'expenses', file: '08_Chi_Phi.xlsx', label: 'Chi phí' }
  ];
  const ensureJSZip = async () => {
    if (window.JSZip) return window.JSZip;
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
      script.onload = resolve; script.onerror = () => reject(new Error('Không tải được thư viện ZIP'));
      document.head.appendChild(script);
    });
    if (!window.JSZip) throw new Error('Thư viện ZIP chưa sẵn sàng');
    return window.JSZip;
  };
  const ZIP_RESTORE_COLUMN = '__DỮ_LIỆU_PHỤC_HỒI';
  const ZIP_FIELD_LABELS = {
    id: 'ID', invoiceCode: 'Mã hóa đơn', receiptCode: 'Mã phiếu', code: 'Mã', name: 'Tên',
    customerName: 'Tên khách hàng', customerPhone: 'SĐT khách hàng', customerCode: 'Mã khách hàng',
    supplierName: 'Tên nhà cung cấp', supplierPhone: 'SĐT nhà cung cấp', supplierCode: 'Mã nhà cung cấp',
    productName: 'Tên sản phẩm', productCode: 'Mã sản phẩm', quantity: 'Số lượng', qty: 'Số lượng',
    price: 'Đơn giá', importCost: 'Giá nhập', salePrice: 'Giá bán', total: 'Tổng tiền', totalAmount: 'Tổng tiền',
    paid: 'Đã thanh toán', paidAmount: 'Đã thanh toán', debt: 'Còn nợ', totalDebt: 'Tổng công nợ',
    status: 'Trạng thái', paymentMethod: 'Phương thức thanh toán', note: 'Ghi chú',
    date: 'Thời gian', createdAt: 'Thời gian tạo', updatedAt: 'Thời gian cập nhật', createdByName: 'Người tạo',
    warrantyStatus: 'Trạng thái bảo hành', location: 'Nơi bảo hành', carrier: 'Nhà vận chuyển', amount: 'Số tiền', stock: 'Tồn kho'
  };
  const zipDateValue = (data) => {
    const keys = ['date', 'createdAt', 'created_at', 'createdTime', 'createdDate', 'time', 'timestamp', 'updatedAt', 'sentAt', 'saleDate', 'importDate'];
    for (const key of keys) {
      const value = data?.[key];
      if (value == null || value === '') continue;
      if (typeof value === 'number' && Number.isFinite(value)) return value < 1e12 ? value * 1000 : value;
      const parsed = new Date(value).getTime();
      if (Number.isFinite(parsed)) return parsed;
    }
    return 0;
  };
  const sortZipRows = (rows) => [...rows].sort((a, b) => zipDateValue(b.data) - zipDateValue(a.data) || String(a.id).localeCompare(String(b.id), 'vi'));
  const zipReadableValue = (value) => {
    if (value == null) return '';
    if (typeof value === 'boolean') return value ? 'Có' : 'Không';
    if (Array.isArray(value)) {
      return value.map(item => {
        if (item == null) return '';
        if (typeof item !== 'object') return String(item);
        const name = item.productName || item.name || item.product || item.title || item.code || '';
        const qty = item.quantity ?? item.qty ?? item.count;
        const price = item.price ?? item.salePrice ?? item.importCost ?? item.cost;
        const total = item.total ?? item.amount ?? item.subtotal;
        const parts = [];
        if (name) parts.push(String(name));
        if (qty != null) parts.push(`SL ${qty}`);
        if (price != null) parts.push(`ĐG ${price}`);
        if (total != null) parts.push(`TT ${total}`);
        return parts.length ? parts.join(' | ') : Object.entries(item).filter(([k,v])=>v!=null && typeof v!=='object').map(([k,v])=>`${k}: ${v}`).join('; ');
      }).filter(Boolean).join(' || ');
    }
    if (typeof value === 'object') return Object.entries(value).filter(([k,v])=>v!=null && typeof v!=='object').map(([k,v])=>`${ZIP_FIELD_LABELS[k] || k}: ${zipReadableValue(v)}`).join('; ');
    return value;
  };
  const flattenZipRecord = (data, prefix = '', out = {}) => {
    Object.entries(data || {}).forEach(([key, value]) => {
      if (value === undefined) return;
      const path = prefix ? `${prefix}.${key}` : key;
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        const entries = Object.entries(value);
        if (entries.length && prefix.split('.').length < 2) flattenZipRecord(value, path, out);
        else out[ZIP_FIELD_LABELS[path] || ZIP_FIELD_LABELS[key] || path] = zipReadableValue(value);
      } else {
        const label = ZIP_FIELD_LABELS[path] || ZIP_FIELD_LABELS[key] || path;
        out[label] = zipReadableValue(value);
      }
    });
    return out;
  };
  const makeZipWorkbook = (rows) => {
    const XLSX = window.XLSX;
    const orderedRows = sortZipRows(rows);
    const displayRows = orderedRows.map(row => ({ ...flattenZipRecord(row.data), ID: row.id, [ZIP_RESTORE_COLUMN]: JSON.stringify(row.data) }));
    // Giữ nguyên thứ tự cột ổn định: ID, các cột nghiệp vụ, rồi cột phục hồi bị ẩn.
    const keys = Array.from(new Set(displayRows.flatMap(row => Object.keys(row))));
    const visibleKeys = keys.filter(key => key !== ZIP_RESTORE_COLUMN);
    const columnOrder = ['ID', ...visibleKeys.filter(key => key !== 'ID'), ZIP_RESTORE_COLUMN];
    const ws = XLSX.utils.json_to_sheet(displayRows.length ? displayRows : [{ ID: '', [ZIP_RESTORE_COLUMN]: '' }], { header: columnOrder });
    ws['!cols'] = columnOrder.map(key => key === ZIP_RESTORE_COLUMN ? { wch: 0, hidden: true } : ({ wch: Math.min(32, Math.max(12, key.length + 2)) }));
    ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: Math.max(0, displayRows.length), c: columnOrder.length - 1 } }) };
    ws['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft', state: 'frozen' };
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DuLieu');
    return XLSX.write(wb, { bookType: 'xlsx', type: 'array', compression: true });
  };
  const handleExportAllZip = async () => {
    if (zipBusy) return;
    setZipBusy(true); setZipRestoreProgress('Đang chuẩn bị xuất ZIP...');
    try {
      if (!window.XLSX) throw new Error('Thư viện Excel chưa sẵn sàng; hãy tải lại trang.');
      const JSZip = await ensureJSZip();
      const all = {};
      for (let i = 0; i < ZIP_GROUPS.length; i++) {
        const group = ZIP_GROUPS[i];
        setZipRestoreProgress(`Đang đọc ${group.label} từ Firebase (${i + 1}/${ZIP_GROUPS.length})...`);
        const snap = await getDocs(collection(db, 'stores', storeId, group.key));
        all[group.key] = sortZipRows(snap.docs.map(d => ({ id: d.id, data: d.data() })));
        setZipRestoreProgress(`Đã đọc ${group.label}: ${all[group.key].length} bản ghi. Đang tiếp tục...`);
        await new Promise(resolve => setTimeout(resolve, 0));
      }
      const orders = all.orders || [], importsData = all.imports || [], products = all.products || [];
      const customers = all.customers || [], suppliers = all.suppliers || [], expenses = all.expenses || [], warranties = all.warrantyRequests || [];
      const reportRows = [
        { 'Chỉ tiêu': 'Số đơn hàng', 'Giá trị': orders.length },
        { 'Chỉ tiêu': 'Tổng tiền đơn hàng', 'Giá trị': orders.reduce((sum,r)=>sum+Number(r.data.total ?? r.data.totalAmount ?? 0),0) },
        { 'Chỉ tiêu': 'Số phiếu nhập', 'Giá trị': importsData.length },
        { 'Chỉ tiêu': 'Tổng tiền nhập', 'Giá trị': importsData.reduce((sum,r)=>sum+Number(r.data.total ?? 0),0) },
        { 'Chỉ tiêu': 'Số sản phẩm', 'Giá trị': products.length },
        { 'Chỉ tiêu': 'Số phiếu bảo hành', 'Giá trị': warranties.length },
        { 'Chỉ tiêu': 'Số khách hàng', 'Giá trị': customers.length },
        { 'Chỉ tiêu': 'Tổng công nợ khách hàng', 'Giá trị': customers.reduce((sum,r)=>sum+Number(r.data.totalDebt||0),0) },
        { 'Chỉ tiêu': 'Số nhà cung cấp', 'Giá trị': suppliers.length },
        { 'Chỉ tiêu': 'Tổng công nợ nhà cung cấp', 'Giá trị': suppliers.reduce((sum,r)=>sum+Number(r.data.totalDebt||0),0) },
        { 'Chỉ tiêu': 'Số khoản chi phí', 'Giá trị': expenses.length },
        { 'Chỉ tiêu': 'Tổng chi phí', 'Giá trị': expenses.reduce((sum,r)=>sum+Number(r.data.amount||r.data.total||0),0) }
      ];
      const zip = new JSZip();
      const reportWb = window.XLSX.utils.book_new();
      const reportWs = window.XLSX.utils.json_to_sheet(reportRows);
      reportWs['!cols'] = [{wch:34},{wch:22}];
      window.XLSX.utils.book_append_sheet(reportWb, reportWs, 'BaoCaoTongHop');
      zip.file('01_Bao_Cao_Tong_Hop.xlsx', window.XLSX.write(reportWb,{bookType:'xlsx',type:'array',compression:true}));
      for (let i = 0; i < ZIP_GROUPS.length; i++) {
        const group = ZIP_GROUPS[i];
        setZipRestoreProgress(`Đang tạo Excel ${group.label} (${i + 1}/${ZIP_GROUPS.length})...`);
        zip.file(group.file, makeZipWorkbook(all[group.key] || []));
        await new Promise(resolve => setTimeout(resolve, 0));
      }
      zip.file('README.txt', 'Sao lưu QUẢN LÝ BÁN HÀNG: gồm 8 file Excel. Các cột nghiệp vụ được hiển thị và sắp xếp theo thời gian mới nhất trước. Cột __DỮ_LIỆU_PHỤC_HỒI bị ẩn trong Excel để giữ nguyên toàn bộ dữ liệu gốc phục hồi. Khi nhập ZIP, ID trùng sẽ được cập nhật; ID chưa có sẽ được tạo mới. Bản ghi không nằm trong ZIP không bị xóa. File Báo cáo tổng hợp chỉ để xem, không nhập vào Firebase.');
      setZipRestoreProgress('Đã tạo 8 file Excel. Đang nén ZIP, vui lòng giữ trang mở...');
      const blob = await zip.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:3}}, metadata => {
        setZipRestoreProgress(`Đang nén ZIP: ${Math.round(metadata.percent)}%...`);
      });
      const url = URL.createObjectURL(blob); const a = document.createElement('a');
      a.href = url; a.download = `Sao_Luu_Du_Lieu_${getVietnamDateKey()}.zip`; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      setZipRestoreProgress(`Đã xuất ZIP gồm 8 file Excel. Đơn hàng: ${orders.length}; Nhập hàng: ${importsData.length}; Sản phẩm: ${products.length}; Bảo hành: ${warranties.length}; Khách hàng: ${customers.length}; Nhà cung cấp: ${suppliers.length}; Chi phí: ${expenses.length}.`);
      showToast('Đã xuất ZIP gồm 8 file Excel; các bảng đã được sắp xếp theo thời gian.');
    } catch (err) { console.error(err); setZipRestoreProgress(`Xuất ZIP thất bại: ${err.message||'Lỗi không xác định'}`); showToast(`Không xuất được ZIP: ${err.message||'Lỗi'}`, 'error'); }
    finally { setZipBusy(false); }
  };
  const handleZipRestoreSelect = async (event) => {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    setZipBusy(true); setZipRestorePreview(null); setZipRestoreProgress('Đang đọc ZIP và đếm bản ghi; chưa ghi Firebase...');
    try {
      if (!window.XLSX) throw new Error('Thư viện Excel chưa sẵn sàng; hãy tải lại trang.');
      const JSZip = await ensureJSZip(); const zip = await JSZip.loadAsync(file);
      const entries = [];
      for (const group of ZIP_GROUPS) {
        const zipFile = zip.file(group.file);
        if (!zipFile) { entries.push({...group, rows:[], missing:true}); continue; }
        const buffer = await zipFile.async('arraybuffer');
        const wb = window.XLSX.read(buffer,{type:'array'});
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const raw = window.XLSX.utils.sheet_to_json(sheet,{defval:'',raw:true});
        const rows = raw.map(row => {
          let data = null; try { data = JSON.parse(row[ZIP_RESTORE_COLUMN] || row['Dữ liệu JSON'] || 'null'); } catch (_) {}
          const id = String(row.ID || row.id || '').trim();
          return id && data && typeof data === 'object' ? {id,data} : null;
        }).filter(Boolean);
        entries.push({...group,rows,missing:false});
      }
      const preview = entries.map(g=>({key:g.key,label:g.label,count:g.rows.length,missing:g.missing}));
      setZipRestorePreview({fileName:file.name,entries,counts:preview,total:entries.reduce((n,g)=>n+g.rows.length,0)});
      setZipRestoreProgress('Đã đọc ZIP. Chưa có dữ liệu nào được ghi vào Firebase.');
    } catch (err) { setZipRestoreProgress(`Không đọc được ZIP: ${err.message||'File không hợp lệ'}`); showToast(`Không đọc được ZIP: ${err.message||'File không hợp lệ'}`, 'error'); }
    finally { setZipBusy(false); }
  };
  const confirmZipRestore = async () => {
    if (!zipRestorePreview || zipBusy) return;
    const summary = zipRestorePreview.counts.map(g=>`${g.label}: ${g.count}${g.missing?' (không có file)':''}`).join('\n');
    if (!window.confirm(`XÁC NHẬN PHỤC HỒI ZIP\n${summary}\n\nTổng bản ghi hợp lệ: ${zipRestorePreview.total}. Bản ghi có cùng ID sẽ được cập nhật, ID chưa có sẽ được tạo. Bản ghi hiện có không nằm trong ZIP sẽ KHÔNG bị xóa. Tiếp tục ghi Firebase?`)) return;
    setZipBusy(true); let written = 0;
    try {
      for (const group of zipRestorePreview.entries) {
        for (let i=0;i<group.rows.length;i+=400) {
          const batch = writeBatch(db);
          group.rows.slice(i,i+400).forEach(row => { batch.set(doc(db,'stores',storeId,group.key,row.id),row.data,{merge:false}); });
          await batch.commit(); written += Math.min(400,group.rows.length-i);
          setZipRestoreProgress(`Đang phục hồi ${group.label}: ${written}/${zipRestorePreview.total} bản ghi...`);
        }
      }
      setZipRestoreProgress(`Hoàn tất phục hồi ${written} bản ghi. Không xóa bản ghi nào nằm ngoài ZIP.`);
      showToast(`Đã phục hồi ${written} bản ghi từ ZIP. Bản ghi không có trong ZIP được giữ nguyên.`); setZipRestorePreview(null);
    } catch (err) { console.error(err); setZipRestoreProgress(`Phục hồi bị gián đoạn sau ${written} bản ghi. Kiểm tra dữ liệu trước khi chạy lại: ${err.message||'Lỗi Firebase'}`); showToast('Phục hồi chưa hoàn tất; hãy kiểm tra Firebase trước khi chạy lại.', 'error'); }
    finally { setZipBusy(false); }
  };

  const handleExport = async (type) => {
    if (!window.XLSX) return showToast("Hệ thống chưa sẵn sàng", "error");
    setLoadingFile(true);
    try {
      if (type === 'customers' || type === 'suppliers') {
        const isCustomer=type==='customers'; const contactsSnap=await getDocs(collection(db,'stores',storeId,type));
        const txCollection=isCustomer?'orders':'imports'; const txSnap=await getDocs(collection(db,'stores',storeId,txCollection));
        const norm=v=>String(v||'').trim().toLocaleLowerCase('vi');
        const contactRows=[];
        for(const d of contactsSnap.docs){
          const c={id:d.id,...d.data()}; const linked=txSnap.docs.filter(td=>{const t=td.data();return (isCustomer && (t.customerId===c.id || (norm(t.customerName)===norm(c.name) && norm(t.customerCode)===norm(c.code))) ) || (!isCustomer && (t.supplierId===c.id || (norm(t.supplierName)===norm(c.name) && norm(t.supplierCode)===norm(c.code))));});
          const debtDetails=linked.map(td=>{const t=td.data();return {'Mã giao dịch':t.invoiceCode||t.receiptCode||t.code||td.id,transactionId:td.id,'Ngày':t.date||'', 'Tổng tiền':Number(t.total??t.totalAmount)||0,'Đã trả':Number(t.paidAmount)||0,'Nợ còn lại':Number(t.remainingDebt ?? (Number(t.total ?? t.totalAmount ?? 0)-Number(t.paidAmount||0)))||0,'Ghi chú':t.debtPaymentNote||t.note||''};});
          const paySnap=await getDocs(collection(db,'stores',storeId,type,c.id,'debtPayments'));
          const payments=paySnap.docs.map(pd=>({id:pd.id,...pd.data()}));
          const totalDebt=debtDetails.reduce((a,x)=>a+Number(x['Tổng tiền']||0),0);
          const debtSum=Number(c.totalDebt)||debtDetails.reduce((a,x)=>a+Number(x['Nợ còn lại']||0),0);
          contactRows.push({[isCustomer?'Mã khách hàng':'Mã nhà cung cấp']:c.code||'', [isCustomer?'Tên khách hàng':'Tên nhà cung cấp']:c.name||'', 'Tổng nợ':Number(c.originalDebt)||totalDebt||Number(c.totalDebt)||0,'Nợ còn lại':Number(c.totalDebt)||debtSum,'Điện thoại':c.phone||'','Địa chỉ':c.address||'','Chi tiết nợ (JSON)':JSON.stringify(debtDetails),'Lịch sử thanh toán (JSON)':JSON.stringify(payments)});
        }
        const wb=window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(wb,window.XLSX.utils.json_to_sheet(contactRows),'DanhBa');
        window.XLSX.writeFile(wb,`CongNo_${type}_${new Date().toISOString().slice(0,10)}.xlsx`);
        showToast(`Đã xuất ${contactRows.length} mục kèm chi tiết nợ và lịch sử thanh toán. Hãy giữ nguyên cột JSON nếu muốn nhập phục hồi đầy đủ.`); setLoadingFile(false); return;
      }
      const snap = await getDocs(collection(db, 'stores', storeId, type));
      let exportData = [];
      snap.docs.forEach(d => {
        const item = d.data();
        if (type === 'products') exportData.push({ 'Mã hàng': item.code || '', 'Tên hàng': item.name || '', 'Giá bán': Number(item.price) || 0, 'Giá vốn': Number(item.cost) || 0, 'Tồn kho': Number(item.stock) || 0 });
        if (type === 'customers') exportData.push({ 'Mã khách hàng': item.code || '', 'Tên khách hàng': item.name || '', 'Tổng nợ': Number(item.totalDebt) || 0, 'Địa chỉ': item.address || '', 'Điện thoại': item.phone || '' });
        if (type === 'suppliers') exportData.push({ 'Mã nhà cung cấp': item.code || '', 'Tên nhà cung cấp': item.name || '', 'Tổng nợ': Number(item.totalDebt) || 0, 'Địa chỉ': item.address || '', 'Điện thoại': item.phone || '' });
        if (type === 'expenses') exportData.push({ 'Ngày': formatDate(item.date), 'Nội dung': item.note, 'Số tiền': item.amount });
        if (type === 'orders') (item.items || []).forEach(it => exportData.push({ 'Mã hóa đơn': item.invoiceCode || '', 'Thời gian': item.date || '', 'Mã khách hàng': item.customerId || '', 'Tên khách hàng': item.customerName || 'Khách lẻ', 'Người bán': item.sellerName || '', 'Tổng tiền hàng': Number(item.total) || 0, 'Khách đã trả': Number(item.paidAmount) || 0, 'Nhóm hàng': it.category || '', 'Tên hàng': it.name || '', 'ĐVT': it.unit || '', 'Số lượng': Number(it.quantity ?? it.qty) || 0, 'Đơn giá': Number(it.price) || 0, 'Giá bán': Number(it.salePrice ?? it.price) || 0, 'Thành tiền': Number(it.lineTotal) || (Number(it.quantity ?? it.qty) || 0) * (Number(it.salePrice ?? it.price) || 0) }));
        if (type === 'imports') (item.items || []).forEach(it => exportData.push({ 'Thời gian': item.date || '', 'Mã nhà cung cấp': item.supplierCode || '', 'Tên nhà cung cấp': item.supplierName || '', 'Điện thoại': item.supplierPhone || '', 'Người nhập': item.createdByName || '', 'Tổng tiền hàng': Number(item.total) || 0, 'Cần trả NCC': Number(item.payable) || 0, 'Ghi chú': item.note || '', 'Tổng số lượng': Number(item.totalQty) || 0, 'Tổng số mặt hàng': Number(item.totalItems) || (item.items || []).length, 'Mã hàng': it.code || '', 'Tên hàng': it.name || '', 'ĐVT': it.unit || '', 'Đơn giá': Number(it.price) || 0, 'Giá nhập': Number(it.importCost) || 0, 'Thành tiền': Number(it.lineTotal) || (Number(it.qty ?? it.quantity) || 0) * (Number(it.importCost) || 0), 'Số lượng': Number(it.qty ?? it.quantity) || 0 }));
      });
      const ws = window.XLSX.utils.json_to_sheet(exportData); const wb = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(wb, ws, "Data"); window.XLSX.writeFile(wb, "Xuat_Du_Lieu_" + type + ".xlsx");
      showToast("Đã XUẤT file Excel thành công!");
    } catch(e) { showToast("Lỗi xuất file", "error"); } setLoadingFile(false);
  };

  const menuItems = [
    { id: 'customers', label: 'Khách hàng' }, 
    { id: 'suppliers', label: 'Nhà cung cấp' }, 
    { id: 'products', label: 'Sản phẩm' }, 
    { id: 'orders', label: 'Hóa đơn' },
    { id: 'imports', label: 'Nhập hàng' },
    { id: 'expenses', label: 'Lịch sử Chi phí' }
  ];

  const openDeleteConfirmation = (target) => {
    setDeleteTarget(target);
    setDeletePassword('');
    setDeletePasswordConfirm('');
  };

  const handleConfirmedDelete = async (e) => {
    e?.preventDefault?.();
    if (!deleteTarget || deletingData) return;
    if (!deletePassword || !deletePasswordConfirm) {
      showToast('Vui lòng nhập và xác nhận mật khẩu.', 'error');
      return;
    }
    if (deletePassword !== deletePasswordConfirm) {
      showToast('Mật khẩu xác nhận không khớp.', 'error');
      return;
    }
    const currentUser = auth.currentUser;
    if (!currentUser?.email) {
      showToast('Không xác định được tài khoản quản trị đang đăng nhập. Vui lòng đăng nhập lại.', 'error');
      return;
    }
    setDeletingData(true);
    try {
      // Re-authenticate with Firebase Auth; matching two text fields alone is not sufficient.
      const credential = EmailAuthProvider.credential(currentUser.email, deletePassword);
      await reauthenticateWithCredential(currentUser, credential);

      const collectionsToDelete = deleteTarget === 'all'
        ? ['products', 'orders', 'imports', 'customers', 'suppliers', 'expenses', 'warrantyRequests']
        : [deleteTarget];

      // Delete in small pages instead of loading an entire collection into memory.
      // Re-query the first page after each batch so large stores don't stall the UI.
      let totalDeleted = 0;
      for (let collectionIndex = 0; collectionIndex < collectionsToDelete.length; collectionIndex++) {
        const collectionName = collectionsToDelete[collectionIndex];
        setDeleteProgress(`Đang xóa nhóm ${collectionIndex + 1}/${collectionsToDelete.length}: ${collectionName} (đã xóa ${totalDeleted} bản ghi)`);
        const collectionRef = collection(db, 'stores', storeId, collectionName);
        while (true) {
          const snapshot = await getDocs(query(collectionRef, limit(300)));
          if (snapshot.empty) break;
          const batch = writeBatch(db);
          snapshot.docs.forEach((item) => batch.delete(item.ref));
          await batch.commit();
          totalDeleted += snapshot.size;
          setDeleteProgress(`Đang xóa nhóm ${collectionIndex + 1}/${collectionsToDelete.length}: ${collectionName} (đã xóa ${totalDeleted} bản ghi)`);
          // Yield to the browser between batches so the page can repaint.
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
      const deletedLabel = deleteTarget === 'all' ? 'toàn bộ dữ liệu' : ({ products: 'toàn bộ sản phẩm', orders: 'hóa đơn', imports: 'lịch sử nhập hàng', expenses: 'lịch sử chi phí', customers: 'khách hàng', suppliers: 'nhà cung cấp' }[deleteTarget] || deleteTarget);
      showToast(`Đã xóa ${deletedLabel} thành công.`);
      setDeleteTarget(null);
      setDeletePassword('');
      setDeletePasswordConfirm('');
      setDeleteProgress('');
    } catch (err) {
      console.error('Delete data failed:', err);
      if (err?.code === 'auth/invalid-credential' || err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-login-credentials') {
        showToast('Mật khẩu tài khoản Firebase không đúng.', 'error');
      } else if (err?.code === 'auth/requires-recent-login') {
        showToast('Phiên đăng nhập đã cũ. Vui lòng đăng xuất, đăng nhập lại rồi thử lại.', 'error');
      } else {
        showToast('Không thể xóa dữ liệu. Vui lòng kiểm tra quyền Firebase và thử lại.', 'error');
      }
    } finally {
      setDeletingData(false);
      setDeleteProgress('');
    }
  };

  const activeCfg = form[editPaperSize] || {};
  const isA4A5 = editPaperSize === 'A4' || editPaperSize === 'A5';
  const paperWidthClass = editPaperSize === 'K80' ? 'w-[300px]' : (editPaperSize === 'A4' ? 'w-[210mm]' : 'w-[148mm]');
  const baseFontSize = Number(activeCfg.printFontSize) || 12;

  const LivePreviewReceipt = () => {
    if (editingQuotePrint) {
      const quoteCfg = form.quotePrintA4 || {};
      const quoteFontSize = Number(quoteCfg.printFontSize) || 12;
      const quoteStoreName = quoteCfg.printStoreName ?? form.name ?? 'CÔNG TY';
      const quoteAddress = quoteCfg.printStoreAddress ?? form.address ?? '';
      const quotePhone = quoteCfg.printStorePhone ?? form.phone ?? '';
      const showLogo = quoteCfg.printShowLogo !== false && form.printTopLogoEnabled === true && !!form.logo;
      const showName = quoteCfg.printShowStoreName !== false;
      const showAddress = quoteCfg.printShowStoreAddress !== false && !!quoteAddress;
      const showPhone = quoteCfg.printShowStorePhone !== false && !!quotePhone;
      const showWarranty = quoteCfg.printShowWarranty !== false;
      const showNote = quoteCfg.printShowNote !== false;
      return (
        <div className="bg-white shadow-2xl border border-gray-200 mx-auto relative overflow-hidden" style={{width:'210mm',maxWidth:'100%',minHeight:'297mm',boxSizing:'border-box',padding:'18mm',fontSize:`${quoteFontSize}px`,color:'#111',fontFamily:'Arial,sans-serif'}}>
          {form.watermarkLogoEnabled !== false && form.logo && <img src={form.logo} alt="Logo chìm" style={{position:'absolute',width:`${Number(form.watermarkLogoSize)||55}%`,height:'auto',maxHeight:'75%',objectFit:'contain',left:'50%',top:'50%',transform:'translate(-50%,-50%)',opacity:Number(form.watermarkLogoOpacity??0.12),pointerEvents:'none',zIndex:0}}/>}
          <div style={{position:'relative',zIndex:1}}>
          {(showLogo || showName || showAddress || showPhone) && <div style={{display:'flex',alignItems:'center',gap:'16px',borderBottom:'1px dashed #777',paddingBottom:'12px'}}>
            {showLogo && <img src={form.logo} alt="Logo" style={{width:`${Number(quoteCfg.printLogoWidth)||75}px`,height:`${Number(quoteCfg.printLogoHeight)||64}px`,objectFit:'contain'}}/>}
            <div style={{flex:1}}>{showName&&<div style={{fontWeight:700,fontSize:`${quoteFontSize+3}px`}}>{quoteStoreName}</div>}{showAddress&&<div>Địa chỉ: {quoteAddress}</div>}{showPhone&&<div>Điện thoại: {quotePhone}</div>}</div>
          </div>}
          <h2 style={{textAlign:'center',fontSize:`${quoteFontSize+7}px`,fontWeight:700,margin:'22px 0'}}>{quoteCfg.printInvoiceTitle||'BÁO GIÁ'}</h2>
          <div style={{lineHeight:1.8}}><div><b>Mã báo giá:</b> BGXXXXXXXX</div><div><b>Ngày lập:</b> 28/10/2026</div><div><b>Khách hàng:</b> Tên khách hàng</div><div><b>Điện thoại:</b> 0xxx xxx xxx</div><div><b>Địa chỉ:</b> Địa chỉ khách hàng</div></div>
          <table style={{width:'100%',borderCollapse:'collapse',tableLayout:'fixed',marginTop:'20px'}}><thead><tr>{['STT','Sản phẩm','SL','Đơn giá',...(showWarranty?['Thời gian bảo hành']:[]),...(showNote?['Ghi chú']:[]),'Thành tiền'].map(h=><th key={h} style={{border:'1px solid #666',padding:'7px',background:'#f2f2f2',textAlign:'center'}}>{h}</th>)}</tr></thead><tbody>{[1,2,3].map(n=><tr key={n}>{[''+n,'Tên sản phẩm','1','0 đ',...(showWarranty?['12 tháng']:[]),...(showNote?['Ghi chú']:[]),'0 đ'].map((v,i)=><td key={i} style={{border:'1px solid #666',padding:'7px',height:'30px',textAlign:i===0||i===2?'center':'left',overflowWrap:'anywhere'}}>{v}</td>)}</tr>)}</tbody></table>
          <div style={{textAlign:'right',fontWeight:700,fontSize:`${quoteFontSize+2}px`,marginTop:'18px'}}>TỔNG CỘNG: 0 đ</div>
          <div style={{marginTop:'18px'}}>Ghi chú: —</div><div style={{textAlign:'center',marginTop:'40px',whiteSpace:'pre-wrap'}}>{quoteCfg.printFooter||'Báo giá có hiệu lực theo thỏa thuận.'}</div>
          </div>
        </div>
      );
    }
    if (editingWarrantyPrint) {
      const warrantySize = form.warrantyPrintSize || 'A4';
      const warrantyCfg = form[`warrantyPrint${warrantySize}`] || {};
      const warrantyWidth = warrantySize === 'A5' ? '148mm' : '210mm';
      const warrantyFontSize = Number(warrantyCfg.printFontSize) || 12;
      const showLogo = warrantyCfg.printShowLogo !== false && form.printTopLogoEnabled === true && !!form.logo;
      const showStoreName = warrantyCfg.printShowStoreName !== false;
      const warrantyStoreAddress = warrantyCfg.printStoreAddress ?? form.address;
      const warrantyStorePhone = warrantyCfg.printStorePhone ?? form.phone;
      const warrantyStoreName = warrantyCfg.printStoreName ?? form.name;
      const showAddress = warrantyCfg.printShowStoreAddress !== false && !!warrantyStoreAddress;
      const showPhone = warrantyCfg.printShowStorePhone !== false && !!warrantyStorePhone;
      const showDate = warrantyCfg.printShowDate !== false;
      const showDuration = warrantyCfg.printShowWarrantyDuration !== false;
      const showNote = warrantyCfg.printShowNote !== false;
      const offsetName = Number(warrantyCfg.storeNameXOffset) || 0;
      const offsetAddress = Number(warrantyCfg.storeAddressXOffset) || 0;
      const offsetPhone = Number(warrantyCfg.storePhoneXOffset) || 0;
      return (
        <div className="bg-white shadow-2xl border border-gray-200 mx-auto transition-all overflow-hidden" style={{ width: warrantyWidth, maxWidth: '100%', minHeight: warrantySize === 'A5' ? '210mm' : '297mm', fontSize: `${warrantyFontSize}px`, padding: '12mm', color: '#000', fontFamily: 'Arial, sans-serif', boxSizing: 'border-box' }}>
          {(showLogo || showStoreName || showAddress || showPhone) && <div style={{display:'flex',alignItems:'center',gap:'16px',borderBottom:'1px dashed #777',paddingBottom:'12px'}}>
            {showLogo && <img src={form.logo} alt="Logo" style={{width:`${Number(warrantyCfg.printLogoWidth)||100}px`,height:`${Number(warrantyCfg.printLogoHeight)||75}px`,maxWidth:'100%',objectFit:'contain'}}/>}
            <div style={{flex:1,minWidth:0}}>
              {showStoreName && <div style={{fontWeight:700,fontSize:`${warrantyFontSize + 3}px`,transform:`translateX(${offsetName}px)`,overflowWrap:'anywhere'}}>{warrantyStoreName || 'QUẢN LÝ BÁN HÀNG'}</div>}
              {showAddress && <div style={{marginTop:'3px',transform:`translateX(${offsetAddress}px)`,overflowWrap:'anywhere'}}>Địa chỉ: {warrantyStoreAddress}</div>}
              {showPhone && <div style={{marginTop:'3px',transform:`translateX(${offsetPhone}px)`}}>Điện thoại: {warrantyStorePhone}</div>}
            </div>
          </div>}
          <h2 style={{textAlign:'center',fontSize:`${warrantyFontSize + 5}px`,margin:'18px 0',fontWeight:700}}>{warrantyCfg.printInvoiceTitle || 'PHIẾU GỞI BẢO HÀNH'}</h2>
          <div style={{lineHeight:1.7}}><div><b>Mã phiếu:</b> BHXXXXXXXX</div><div><b>Thời gian gửi:</b> 22/10/2026</div><div><b>Nơi nhận:</b> Tên nơi bảo hành</div><div><b>Địa chỉ:</b> Địa chỉ nơi bảo hành</div><div><b>Số điện thoại:</b> 0xxx xxx xxx</div></div>
          <table style={{width:'100%',borderCollapse:'collapse',tableLayout:'fixed',marginTop:'18px',fontSize:`${warrantyFontSize}px`}}><thead><tr>{['STT','Sản phẩm',...(showDate?['Thời gian nhập']:[]),...(showDuration?['Thời gian bảo hành']:[]),...(showNote?['Ghi chú']:[])].map(h=><th key={h} style={{border:'1px solid #555',padding:'6px',background:'#f2f2f2',textAlign:'center',overflowWrap:'anywhere'}}>{h}</th>)}</tr></thead><tbody>{[1,2,3].map((n)=><tr key={n}>{[''+n,'Tên sản phẩm',...(showDate?['22/10/2026']:[]),...(showDuration?['12 tháng']:[]),...(showNote?['Ghi chú']:[])].map((v,i)=><td key={i} style={{border:'1px solid #555',padding:'6px',height:'30px',overflowWrap:'anywhere'}}>{v}</td>)}</tr>)}</tbody></table>
          <div style={{display:'flex',justifyContent:'space-between',marginTop:'45px',textAlign:'center'}}><div style={{width:'40%'}}>Người gửi<br/><br/><br/>(Ký, ghi rõ họ tên)</div><div style={{width:'40%'}}>Nơi nhận bảo hành<br/><br/><br/>(Ký, ghi rõ họ tên)</div></div>
          {warrantyCfg.printFooter && <div style={{textAlign:'center',marginTop:'20px'}}>{warrantyCfg.printFooter}</div>}
        </div>
      );
    }
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
          <button onClick={() => setActiveSubTab('staff')} className={`flex-1 md:w-40 py-2 text-sm font-bold rounded-lg flex justify-center items-center gap-2 transition-all ${activeSubTab==='staff' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><UserCog size={16}/> Quản trị nhân viên</button>
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
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-3">
                  <h4 className="font-bold text-blue-900">Logo chìm dùng chung cho tất cả mẫu in</h4>
                  <p className="text-xs text-gray-600">Dùng ảnh tại Cài đặt → Thông tin cơ bản → Ảnh Logo cửa hàng. Logo chìm mặc định nằm giữa trang; logo góc trái được tắt.</p>
                  <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={form.watermarkLogoEnabled !== false} onChange={e=>setForm(prev=>({...prev,watermarkLogoEnabled:e.target.checked}))}/> Bật logo chìm</label>
                  <label className="block text-sm">Độ mờ: {Math.round((Number(form.watermarkLogoOpacity ?? 0.12))*100)}%<input type="range" min="3" max="40" value={Math.round(Number(form.watermarkLogoOpacity ?? 0.12)*100)} onChange={e=>setForm(prev=>({...prev,watermarkLogoOpacity:Number(e.target.value)/100}))} className="w-full accent-blue-600"/></label>
                  <label className="block text-sm">Kích thước logo: {Number(form.watermarkLogoSize)||55}% chiều ngang trang<input type="range" min="20" max="100" value={Number(form.watermarkLogoSize)||55} onChange={e=>setForm(prev=>({...prev,watermarkLogoSize:Number(e.target.value)}))} className="w-full accent-blue-600"/></label>
                </div>
                <div className="flex flex-wrap gap-2"><button type="button" onClick={()=>{setEditingWarrantyPrint(false);setEditingQuotePrint(false)}} className={`flex-1 py-2 rounded-lg text-sm font-bold border ${!editingWarrantyPrint&&!editingQuotePrint?'bg-blue-600 text-white':'bg-white'}`}>Mẫu in hóa đơn</button><button type="button" onClick={()=>{setEditingWarrantyPrint(true);setEditingQuotePrint(false)}} className={`flex-1 py-2 rounded-lg text-sm font-bold border ${editingWarrantyPrint?'bg-purple-600 text-white':'bg-white'}`}>Mẫu in bảo hành</button><button type="button" onClick={()=>{setEditingWarrantyPrint(false);setEditingQuotePrint(true)}} className={`flex-1 py-2 rounded-lg text-sm font-bold border ${editingQuotePrint?'bg-indigo-600 text-white':'bg-white'}`}>Mẫu báo giá A4</button></div>
                {editingQuotePrint ? <div className="space-y-4 bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                  <h4 className="font-black text-indigo-800">MẪU BÁO GIÁ A4</h4><p className="text-xs text-gray-600">Mẫu độc lập khổ A4. Các chỉnh sửa tại đây chỉ áp dụng cho báo giá, không thay đổi mẫu in hóa đơn hoặc bảo hành.</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3 rounded-lg border bg-white p-3">
                      <p className="font-bold text-sm">Bố cục và chữ</p>
                      {[
                        ['printFontSize','Cỡ chữ cơ bản',8,24,1],
                        ['printPageMargin','Lề trang (mm)',5,30,1],
                        ['printTablePaddingX','Lề ngang ô bảng (px)',1,16,1],
                        ['printTablePaddingY','Lề dọc ô bảng (px)',1,16,1],
                        ['printDetailFontScale','Cỡ chữ bảng (%)',50,130,5],
                        ['printLogoWidth','Chiều ngang logo (px)',20,240,5],
                        ['printLogoHeight','Chiều cao logo (px)',20,180,5],
                        ['fsStoreNameOffset','Cỡ chữ tên cửa hàng (+px)',-4,16,1],
                        ['fsInvoiceTitleOffset','Cỡ chữ tiêu đề (+px)',-4,24,1],
                        ['fsMetaOffset','Cỡ chữ ngày lập phiếu (+px)',-4,12,1],
                        ['storeNameXOffset','Căn ngang tên cửa hàng (px)',-150,150,1],
                        ['storeAddressXOffset','Căn ngang địa chỉ (px)',-150,150,1]
                      ].map(([field,label,min,max,step])=><label key={field} className="block text-xs font-semibold text-gray-700">{label}: {form.quotePrintA4?.[field] ?? (field==='printFontSize'?12:field==='printPageMargin'?18:field==='printDetailFontScale'?80:field==='printLogoWidth'?75:field==='printLogoHeight'?64:field==='fsStoreNameOffset'?2:field==='fsInvoiceTitleOffset'?4:0)}<input type="range" min={min} max={max} step={step} value={form.quotePrintA4?.[field] ?? (field==='printFontSize'?12:field==='printPageMargin'?18:field==='printDetailFontScale'?80:field==='printLogoWidth'?75:field==='printLogoHeight'?64:field==='fsStoreNameOffset'?2:field==='fsInvoiceTitleOffset'?4:0)} onChange={e=>setForm(prev=>({...prev,quotePrintA4:{...(prev.quotePrintA4||{}),[field]:Number(e.target.value)}}))} className="w-full accent-indigo-600"/></label>)}
                    </div>
                    <div className="space-y-3 rounded-lg border bg-white p-3">
                      <p className="font-bold text-sm">Nội dung hiển thị</p>
                      {[
                        ['printShowLogo','In logo'],['printShowStoreName','In tên cửa hàng'],['printShowStoreAddress','In địa chỉ cửa hàng'],['printShowStorePhone','In số điện thoại cửa hàng'],
                        ['printShowDate','In ngày lập'],['printShowInvoiceId','In mã báo giá'],['printShowCustomer','In tên khách hàng'],['printShowCustomerPhone','In số điện thoại khách hàng'],['printShowCustomerAddress','In địa chỉ khách hàng'],
                        ['printShowWarranty','In thời gian bảo hành'],['printShowNote','In ghi chú'],['printShowSignatures','In khu vực chữ ký']
                      ].map(([field,label])=><label key={field} className="flex items-center justify-between gap-2 text-sm"><span>{label}</span><input type="checkbox" checked={form.quotePrintA4?.[field] !== false} onChange={e=>setForm(prev=>({...prev,quotePrintA4:{...(prev.quotePrintA4||{}),[field]:e.target.checked}}))}/></label>)}
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3 rounded-lg border bg-white p-3">
                    {[
                      ['printInvoiceTitle','Tiêu đề báo giá','BÁO GIÁ'],['printStoreName','Tên cửa hàng',form.name||''],['printStoreAddress','Địa chỉ cửa hàng',form.address||''],['printStorePhone','Số điện thoại cửa hàng',form.phone||''],
                      ['printDateLabel','Nhãn ngày lập','Ngày lập'],['printInvoiceIdLabel','Nhãn mã báo giá','Mã báo giá'],['printCustomerLabel','Nhãn khách hàng','Khách hàng'],['printCustomerPhoneLabel','Nhãn điện thoại','Điện thoại'],
                      ['printCustomerAddressLabel','Nhãn địa chỉ khách hàng','Địa chỉ'],['printSttLabel','Tiêu đề cột STT','STT'],['printProductLabel','Tiêu đề cột sản phẩm','Tên sản phẩm'],['printQtyLabel','Tiêu đề cột số lượng','SL'],
                      ['printPriceLabel','Tiêu đề cột đơn giá','Đơn giá'],['printWarrantyLabel','Tiêu đề cột bảo hành','Thời gian bảo hành'],['printNoteLabel','Tiêu đề cột ghi chú','Ghi chú'],['printTotalLabel','Tiêu đề cột thành tiền','Thành tiền'],['printSubtotalLabel','Nhãn tổng cộng','Tổng cộng'],['printQuoteNoteLabel','Nhãn ghi chú báo giá','Ghi chú báo giá']
                    ].map(([field,label,placeholder])=><label key={field} className="block text-xs font-semibold">{label}<input value={form.quotePrintA4?.[field] ?? placeholder} onChange={e=>setForm(prev=>({...prev,quotePrintA4:{...(prev.quotePrintA4||{}),[field]:e.target.value}}))} className="mt-1 w-full p-2 border rounded-lg text-sm"/></label>)}
                    <label className="block text-xs font-semibold md:col-span-2">Lời cuối phiếu<textarea value={form.quotePrintA4?.printFooter ?? 'Báo giá có hiệu lực theo thỏa thuận.'} onChange={e=>setForm(prev=>({...prev,quotePrintA4:{...(prev.quotePrintA4||{}),printFooter:e.target.value}}))} className="mt-1 w-full p-2 border rounded-lg text-sm" rows={2}/></label>
                  </div>
                  <div className="rounded-lg border bg-white p-3"><p className="font-bold text-sm mb-2">Độ rộng các cột (%)</p><div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[['colWidthStt','STT',3,10,5],['colWidthProduct','Sản phẩm',20,55,35],['colWidthQty','Số lượng',5,15,8],['colWidthPrice','Đơn giá',8,20,12],['colWidthWarranty','Bảo hành',8,22,12],['colWidthNote','Ghi chú',8,25,13],['colWidthTotal','Thành tiền',10,25,15]].map(([field,label,min,max,def])=><label key={field} className="text-xs">{label}: {form.quotePrintA4?.[field]??def}<input type="range" min={min} max={max} value={form.quotePrintA4?.[field]??def} onChange={e=>setForm(prev=>({...prev,quotePrintA4:{...(prev.quotePrintA4||{}),[field]:Number(e.target.value)}}))} className="w-full accent-indigo-600"/></label>)}</div></div>
                  <div className="rounded-lg bg-white border p-3"><p className="font-bold text-sm mb-2">Xem trước mẫu A4</p><div className="mx-auto max-w-[560px] border shadow-sm bg-white p-5 text-gray-800" style={{fontSize:`${form.quotePrintA4?.printFontSize||12}px`,minHeight:'360px'}}><div className="flex items-center gap-3 border-b border-dashed pb-3">{form.quotePrintA4?.printShowLogo!==false&&form.logo&&<img src={form.logo} alt="Logo" style={{width:form.quotePrintA4?.printLogoWidth||75,height:form.quotePrintA4?.printLogoHeight||64,objectFit:'contain'}}/>}<div className="flex-1">{form.quotePrintA4?.printShowStoreName!==false&&<b className="block uppercase">{form.quotePrintA4?.printStoreName??form.name??'QUẢN LÝ BÁN HÀNG'}</b>}{form.quotePrintA4?.printShowStoreAddress!==false&&<div>{form.quotePrintA4?.printStoreAddress??form.address}</div>}{form.quotePrintA4?.printShowStorePhone!==false&&<div>{form.quotePrintA4?.printStorePhone??form.phone}</div>}</div></div><h2 className="text-center font-black my-5" style={{fontSize:`${(form.quotePrintA4?.printFontSize||12)+(form.quotePrintA4?.fsInvoiceTitleOffset??4)}px`}}>{form.quotePrintA4?.printInvoiceTitle||'BÁO GIÁ'}</h2><p>Mã báo giá: BG-DEMO · Ngày lập: 28/10/2026</p><p>Khách hàng: Khách hàng mẫu</p><table className="w-full border-collapse mt-3"><thead><tr>{['STT','Tên sản phẩm','SL','Đơn giá',...(form.quotePrintA4?.printShowWarranty!==false?['Bảo hành']:[]),...(form.quotePrintA4?.printShowNote!==false?['Ghi chú']:[]),'Thành tiền'].map(t=><th key={t} className="border p-1 bg-gray-100">{t}</th>)}</tr></thead><tbody><tr>{['1','Sản phẩm mẫu','1','1.000.000 đ',...(form.quotePrintA4?.printShowWarranty!==false?['12 tháng']:[]),...(form.quotePrintA4?.printShowNote!==false?['']:[]),'1.000.000 đ'].map((t,i)=><td key={i} className="border p-1">{t}</td>)}</tr></tbody></table><p className="text-right font-bold mt-3">Tổng cộng: 1.000.000 đ</p>{form.quotePrintA4?.printFooter&&<p className="text-center border-t border-dashed mt-6 pt-3">{form.quotePrintA4.printFooter}</p>}</div></div>
                  <p className="text-xs text-gray-500">Nhấn “Lưu mẫu” phía trên để lưu. Thiết lập báo giá được tách riêng khỏi mẫu hóa đơn và bảo hành.</p>
                </div> : editingWarrantyPrint ? <div className="space-y-4 bg-purple-50 border border-purple-100 rounded-xl p-4"><h4 className="font-black text-purple-800">PHIẾU GỞI BẢO HÀNH</h4><p className="text-xs text-gray-600">Thiết lập khổ giấy và cỡ chữ riêng cho phiếu bảo hành. Phiếu không in cột số tiền hoặc thành tiền.</p><div className="flex gap-2">{['A4','A5'].map(size=><button key={size} onClick={()=>setForm(prev=>({...prev, warrantyPrintSize:size}))} className={`flex-1 py-2 rounded-lg border font-bold ${(form.warrantyPrintSize||'A4')===size?'bg-purple-600 text-white':'bg-white'}`}>Giấy {size}</button>)}</div><label className="block text-sm font-bold">Cỡ chữ ({form.warrantyPrintSize||'A4'})</label><input type="range" min="8" max="24" value={(form[`warrantyPrint${form.warrantyPrintSize||'A4'}`]||{}).printFontSize||12} onChange={e=>{const size=form.warrantyPrintSize||'A4';setForm(prev=>({...prev,[`warrantyPrint${size}`]:{...(prev[`warrantyPrint${size}`]||{}),printFontSize:Number(e.target.value)}}));}} className="w-full accent-purple-600"/><label className="block text-sm font-semibold mt-2">Cỡ chữ ngày lập phiếu (+px)<input type="range" min="-4" max="12" step="1" value={(form[`warrantyPrint${form.warrantyPrintSize||'A4'}`]||{}).fsMetaOffset||0} onChange={e=>{const size=form.warrantyPrintSize||'A4';setForm(prev=>({...prev,[`warrantyPrint${size}`]:{...(prev[`warrantyPrint${size}`]||{}),fsMetaOffset:Number(e.target.value)}}));}} className="w-full accent-purple-600"/></label><div className="space-y-3 rounded-lg border bg-white p-3"><p className="text-sm font-bold">Căn chỉnh trái/phải thông tin cửa hàng (A4/A5)</p>{[['storeNameXOffset','Tên cửa hàng'],['storeAddressXOffset','Địa chỉ'],['storePhoneXOffset','Số điện thoại']].map(([field,label])=><label key={field} className="block text-sm">{label} ({(form[`warrantyPrint${form.warrantyPrintSize||'A4'}`]||{})[field]||0}px)<input type="range" min="-150" max="150" step="1" value={(form[`warrantyPrint${form.warrantyPrintSize||'A4'}`]||{})[field]||0} onChange={e=>{const size=form.warrantyPrintSize||'A4';setForm(prev=>({...prev,[`warrantyPrint${size}`]:{...(prev[`warrantyPrint${size}`]||{}),[field]:Number(e.target.value)}}));}} className="w-full accent-blue-600"/></label>)}</div><div className="space-y-2 mt-3 rounded-lg border bg-white p-3"><p className="text-sm font-bold">Kích thước logo trên phiếu bảo hành ({form.warrantyPrintSize||'A4'})</p><label className="block text-sm font-semibold">Chiều ngang logo ({(form[`warrantyPrint${form.warrantyPrintSize||'A4'}`]||{}).printLogoWidth ?? 100}px)<input type="range" min="20" max="240" step="5" value={(form[`warrantyPrint${form.warrantyPrintSize||'A4'}`]||{}).printLogoWidth ?? 100} onChange={e=>{const size=form.warrantyPrintSize||'A4';setForm(prev=>({...prev,[`warrantyPrint${size}`]:{...(prev[`warrantyPrint${size}`]||{}),printLogoWidth:Number(e.target.value)}}));}} className="w-full accent-purple-600"/></label><label className="block text-sm font-semibold">Chiều cao logo ({(form[`warrantyPrint${form.warrantyPrintSize||'A4'}`]||{}).printLogoHeight ?? 75}px)<input type="range" min="20" max="180" step="5" value={(form[`warrantyPrint${form.warrantyPrintSize||'A4'}`]||{}).printLogoHeight ?? 75} onChange={e=>{const size=form.warrantyPrintSize||'A4';setForm(prev=>({...prev,[`warrantyPrint${size}`]:{...(prev[`warrantyPrint${size}`]||{}),printLogoHeight:Number(e.target.value)}}));}} className="w-full accent-purple-600"/></label></div><div className="space-y-2 mt-3 rounded-lg border bg-white p-3"><p className="text-sm font-bold">Hiển thị trên phiếu bảo hành</p>{[['printShowLogo','In logo'],['printShowStoreName','In tên cửa hàng'],['printShowStoreAddress','In địa chỉ cửa hàng'],['printShowStorePhone','In số điện thoại cửa hàng'],['printShowDate','In thời gian bán/nhập'],['printShowWarrantyDuration','In thời hạn bảo hành'],['printShowNote','In ghi chú sản phẩm']].map(([field,label])=><label key={field} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={(form[`warrantyPrint${form.warrantyPrintSize||'A4'}`]||{})[field] !== false} onChange={e=>{const size=form.warrantyPrintSize||'A4';setForm(prev=>({...prev,[`warrantyPrint${size}`]:{...(prev[`warrantyPrint${size}`]||{}),[field]:e.target.checked}}));}}/>{label}</label>)}<label className="block text-sm font-semibold">Tiêu đề phiếu<input value={(form[`warrantyPrint${form.warrantyPrintSize||'A4'}`]||{}).printInvoiceTitle || 'PHIẾU GỞI BẢO HÀNH'} onChange={e=>{const size=form.warrantyPrintSize||'A4';setForm(prev=>({...prev,[`warrantyPrint${size}`]:{...(prev[`warrantyPrint${size}`]||{}),printInvoiceTitle:e.target.value}}));}} className="mt-1 w-full p-2 border rounded-lg"/></label><label className="block text-sm font-semibold">Tên cửa hàng trên phiếu<input value={(form[`warrantyPrint${form.warrantyPrintSize||'A4'}`]||{}).printStoreName ?? form.name ?? ''} onChange={e=>{const size=form.warrantyPrintSize||'A4';setForm(prev=>({...prev,[`warrantyPrint${size}`]:{...(prev[`warrantyPrint${size}`]||{}),printStoreName:e.target.value}}));}} className="mt-1 w-full p-2 border rounded-lg"/></label><label className="block text-sm font-semibold">Địa chỉ trên phiếu<input value={(form[`warrantyPrint${form.warrantyPrintSize||'A4'}`]||{}).printStoreAddress ?? form.address ?? ''} onChange={e=>{const size=form.warrantyPrintSize||'A4';setForm(prev=>({...prev,[`warrantyPrint${size}`]:{...(prev[`warrantyPrint${size}`]||{}),printStoreAddress:e.target.value}}));}} className="mt-1 w-full p-2 border rounded-lg"/></label><label className="block text-sm font-semibold">Số điện thoại trên phiếu<input value={(form[`warrantyPrint${form.warrantyPrintSize||'A4'}`]||{}).printStorePhone ?? form.phone ?? ''} onChange={e=>{const size=form.warrantyPrintSize||'A4';setForm(prev=>({...prev,[`warrantyPrint${size}`]:{...(prev[`warrantyPrint${size}`]||{}),printStorePhone:e.target.value}}));}} className="mt-1 w-full p-2 border rounded-lg"/></label><label className="block text-sm font-semibold">Lời cuối phiếu<textarea value={(form[`warrantyPrint${form.warrantyPrintSize||'A4'}`]||{}).printFooter || ''} onChange={e=>{const size=form.warrantyPrintSize||'A4';setForm(prev=>({...prev,[`warrantyPrint${size}`]:{...(prev[`warrantyPrint${size}`]||{}),printFooter:e.target.value}}));}} className="mt-1 w-full p-2 border rounded-lg" rows={2}/></label></div><p className="text-xs text-gray-500">Các tùy chọn được lưu theo khổ giấy cùng nút “Lưu mẫu”.</p></div> : <> <div className="space-y-4">
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
                    <div><label className="text-xs font-bold text-gray-700">Căn trái/phải Tên cửa hàng ({activeCfg.storeNameXOffset ?? 0}px)</label><input type="range" min="-150" max="150" step="1" value={activeCfg.storeNameXOffset ?? 0} onChange={e=>updateActiveSizeConfig('storeNameXOffset', Number(e.target.value))} className="w-full accent-blue-600"/></div>
                    <div><label className="text-xs font-bold text-gray-700">Căn trái/phải Địa chỉ ({activeCfg.storeAddressXOffset ?? 0}px)</label><input type="range" min="-150" max="150" step="1" value={activeCfg.storeAddressXOffset ?? 0} onChange={e=>updateActiveSizeConfig('storeAddressXOffset', Number(e.target.value))} className="w-full accent-blue-600"/></div>
                    <div><label className="text-xs font-bold text-gray-700">Căn trái/phải Số điện thoại ({activeCfg.storePhoneXOffset ?? 0}px)</label><input type="range" min="-150" max="150" step="1" value={activeCfg.storePhoneXOffset ?? 0} onChange={e=>updateActiveSizeConfig('storePhoneXOffset', Number(e.target.value))} className="w-full accent-blue-600"/></div>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg bg-white border p-3"><label className="block text-sm font-semibold">Chiều ngang logo ({activeCfg.printLogoWidth ?? 75}px)<input type="range" min="20" max="240" step="5" value={activeCfg.printLogoWidth ?? 75} onChange={e=>updateActiveSizeConfig('printLogoWidth',Number(e.target.value))} className="w-full accent-blue-600"/></label><label className="block text-sm font-semibold">Chiều cao logo ({activeCfg.printLogoHeight ?? 64}px)<input type="range" min="20" max="180" step="5" value={activeCfg.printLogoHeight ?? 64} onChange={e=>updateActiveSizeConfig('printLogoHeight',Number(e.target.value))} className="w-full accent-blue-600"/></label></div>
                    <ToggleSwitch label="In Tên cửa hàng" checked={activeCfg.printShowStoreName ?? true} onChange={(val) => updateActiveSizeConfig('printShowStoreName', val)} />
                    <ToggleSwitch label="In Địa chỉ cửa hàng" checked={activeCfg.printShowStoreAddress ?? true} onChange={(val) => updateActiveSizeConfig('printShowStoreAddress', val)} />
                    <ToggleSwitch label="In Số điện thoại" checked={activeCfg.printShowStorePhone ?? true} onChange={(val) => updateActiveSizeConfig('printShowStorePhone', val)} />
                  </div>
                  <div><label className="block text-sm font-bold text-gray-700 mb-1">Tiêu đề hóa đơn</label><input value={activeCfg.printInvoiceTitle || ''} onChange={e=>updateActiveSizeConfig('printInvoiceTitle', e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold uppercase text-gray-800"/></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl border bg-blue-50/50 p-3"><label className="block text-sm font-semibold">Tên cửa hàng trên hóa đơn<input value={activeCfg.printStoreName ?? form.name ?? ''} onChange={e=>updateActiveSizeConfig('printStoreName',e.target.value)} className="mt-1 w-full p-2 border rounded-lg bg-white"/></label><label className="block text-sm font-semibold">Địa chỉ trên hóa đơn<input value={activeCfg.printStoreAddress ?? form.address ?? ''} onChange={e=>updateActiveSizeConfig('printStoreAddress',e.target.value)} className="mt-1 w-full p-2 border rounded-lg bg-white"/></label><label className="block text-sm font-semibold">Số điện thoại trên hóa đơn<input value={activeCfg.printStorePhone ?? form.phone ?? ''} onChange={e=>updateActiveSizeConfig('printStorePhone',e.target.value)} className="mt-1 w-full p-2 border rounded-lg bg-white"/></label><label className="block text-sm font-semibold">Nhãn địa chỉ<input value={activeCfg.printAddressLabel ?? 'Địa chỉ'} onChange={e=>updateActiveSizeConfig('printAddressLabel',e.target.value)} className="mt-1 w-full p-2 border rounded-lg bg-white"/></label><label className="block text-sm font-semibold">Nhãn số điện thoại cửa hàng<input value={activeCfg.printPhoneLabel ?? 'SĐT'} onChange={e=>updateActiveSizeConfig('printPhoneLabel',e.target.value)} className="mt-1 w-full p-2 border rounded-lg bg-white"/></label>{[['printDateLabel','Nhãn ngày tạo','Ngày tạo'],['printInvoiceIdLabel','Nhãn mã hóa đơn','Mã HĐ'],['printCustomerLabel','Nhãn khách hàng','Khách hàng'],['printCustomerPhoneLabel','Nhãn SĐT khách hàng','SĐT'],['printCashierLabel','Nhãn thu ngân','Thu ngân'],['printStatusLabel','Nhãn trạng thái','Trạng thái'],['printProductLabel','Nhãn sản phẩm','Tên hàng'],['printQtyLabel','Nhãn số lượng','SL'],['printPriceLabel','Nhãn đơn giá','Đơn giá'],['printWarrantyLabel','Nhãn bảo hành','Bảo hành'],['printNoteLabel','Nhãn ghi chú','Ghi chú'],['printTotalLabel','Nhãn thành tiền','Thành tiền'],['printSubtotalLabel','Nhãn tổng tiền hàng','Tổng tiền hàng']].map(([key,label,defaultValue])=><label key={key} className="block text-sm font-semibold">{label}<input value={activeCfg[key] ?? defaultValue} onChange={e=>updateActiveSizeConfig(key,e.target.value)} className="mt-1 w-full p-2 border rounded-lg bg-white"/></label>)}</div>
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
                </>}
              </div>
            </div>
            <div className="w-full lg:w-7/12 xl:w-2/3 bg-gray-200 rounded-2xl flex items-start justify-center p-6 overflow-y-auto relative border border-gray-300 shadow-inner">
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 shadow flex items-center gap-1.5"><Eye size={14} className="text-blue-500"/> Xem trước trực tiếp ({editingQuotePrint ? 'A4' : (editingWarrantyPrint ? (form.warrantyPrintSize || 'A4') : editPaperSize)})</div>
              <LivePreviewReceipt />
            </div>
          </div>
        )}
        {activeSubTab === 'staff' && <StaffManagerView db={db} showToast={showToast} />}
        {activeSubTab === 'data' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200 shadow-sm">
              <h3 className="text-lg font-black text-amber-900 mb-2 flex items-center gap-2"><Search size={20}/> RÀ SOÁT CHI TIẾT SẢN PHẨM TRÙNG</h3>
              <p className="text-sm text-amber-900 mb-4">Rà chi tiết trùng trong cùng hoặc giữa nhiều đơn hàng/phiếu nhập khi khớp khách hàng hoặc nhà cung cấp, sản phẩm, thời gian, số lượng và đơn giá. Chỉ xóa dòng chi tiết trùng; không xóa hóa đơn, không ghi đè tổng tiền, công nợ hoặc tồn kho. Bản gốc được sao lưu vào repairArchive trước khi sửa.</p>
              <div className="flex flex-wrap gap-3"><button type="button" onClick={findDuplicateProductDetails} disabled={duplicateRepairBusy} className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-3 disabled:opacity-50">{duplicateRepairBusy ? 'Đang rà dữ liệu...' : 'Rà chi tiết trùng'}</button>{duplicateRepairPreview && <button type="button" onClick={applyDuplicateProductRepair} disabled={duplicateRepairBusy || !duplicateRepairPreview.records.length} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-3 disabled:opacity-50">{duplicateRepairBusy ? 'Đang xử lý...' : 'Sao lưu và sửa chi tiết trùng'}</button>}</div>
              {duplicateRepairPreview && <div className="mt-4 rounded-xl border bg-white p-4"><p className="font-bold text-gray-800">Kết quả rà soát: {duplicateRepairPreview.records.length} giao dịch có dòng trùng</p>{duplicateRepairPreview.records.length === 0 ? <p className="text-sm text-gray-600 mt-2">Không có dòng trùng phù hợp. Không có dữ liệu nào bị thay đổi.</p> : <div className="mt-3 max-h-64 overflow-auto"><table className="w-full text-sm"><thead className="bg-gray-100 sticky top-0"><tr><th className="p-2 text-left">Loại</th><th className="p-2 text-left">Mã giao dịch</th><th className="p-2 text-left">Tên khách/NCC</th><th className="p-2 text-left">Thời gian</th><th className="p-2 text-right">Dòng trùng cần gộp</th></tr></thead><tbody>{duplicateRepairPreview.records.map(r=><tr key={`${r.type}-${r.id}`} className="border-t"><td className="p-2">{r.type === 'orders' ? 'Đơn hàng' : 'Nhập hàng'}</td><td className="p-2">{r.data.invoiceCode || r.data.receiptCode || r.id}</td><td className="p-2">{r.data.customerName || r.data.supplierName || '—'}</td><td className="p-2">{r.data.date || '—'}</td><td className="p-2 text-right">{r.duplicateLineCount}</td></tr>)}</tbody></table></div>}<p className="text-xs text-gray-500 mt-3">Lưu ý: chỉ xử lý khi khớp khách/NCC, sản phẩm, thời gian, số lượng và đơn giá. Không xóa cả hóa đơn; các trường tổng tiền, công nợ và tồn kho được giữ nguyên.</p></div>}
            </div>
            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200 shadow-sm relative overflow-hidden">
              <div className="absolute -right-4 -top-4 text-blue-100 rotate-12"><HardDrive size={120} /></div>
              <div className="relative z-10">
                <h3 className="text-lg font-black text-blue-800 mb-2 flex items-center gap-2"><ShieldAlert size={20}/> KHU VỰC NGUY HIỂM</h3>
                <p className="text-sm text-blue-700 mb-5 font-medium max-w-lg">Mọi thao tác xóa đều yêu cầu nhập mật khẩu tài khoản đang đăng nhập và xác nhận lại mật khẩu. Dữ liệu đã xóa không thể khôi phục.</p>
                <button type="button" onClick={() => openDeleteConfirmation('all')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-md transition-colors">Xóa sạch toàn bộ dữ liệu</button>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                  <button type="button" onClick={() => openDeleteConfirmation('products')} className="bg-white border border-blue-300 text-blue-700 hover:bg-blue-100 font-bold py-2.5 px-4 rounded-xl transition-colors">Xóa toàn bộ sản phẩm</button>
                  <button type="button" onClick={() => openDeleteConfirmation('orders')} className="bg-white border border-blue-300 text-blue-700 hover:bg-blue-100 font-bold py-2.5 px-4 rounded-xl transition-colors">Xóa hóa đơn</button>
                  <button type="button" onClick={() => openDeleteConfirmation('imports')} className="bg-white border border-blue-300 text-blue-700 hover:bg-blue-100 font-bold py-2.5 px-4 rounded-xl transition-colors">Xóa lịch sử nhập hàng</button>
                  <button type="button" onClick={() => openDeleteConfirmation('expenses')} className="bg-white border border-blue-300 text-blue-700 hover:bg-blue-100 font-bold py-2.5 px-4 rounded-xl transition-colors">Xóa lịch sử chi phí</button>
                  <button type="button" onClick={() => openDeleteConfirmation('customers')} className="bg-white border border-blue-300 text-blue-700 hover:bg-blue-100 font-bold py-2.5 px-4 rounded-xl transition-colors">Xóa khách hàng</button>
                  <button type="button" onClick={() => openDeleteConfirmation('suppliers')} className="bg-white border border-blue-300 text-blue-700 hover:bg-blue-100 font-bold py-2.5 px-4 rounded-xl transition-colors">Xóa nhà cung cấp</button>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-sm">
              <h3 className="font-bold text-gray-800 flex items-center gap-2"><Package className="text-emerald-600"/> Đối chiếu & cập nhật tồn kho bằng Excel</h3>
              <p className="text-sm text-gray-600 mt-2 mb-4">File cần có các cột <b>Mã sản phẩm</b>, <b>Tên sản phẩm</b>, <b>Tồn kho</b>. Hệ thống ưu tiên mã sản phẩm; nếu mã không khớp thì chỉ ghép theo tên đã chuẩn hóa khi tên duy nhất. Số tồn trong Excel sẽ <b>thay thế</b> số tồn đang lưu trên web cho sản phẩm khớp, không cộng dồn. Sản phẩm không có trong file Excel được giữ nguyên. Không sửa lịch sử nhà cung cấp, đơn hàng hoặc công nợ.</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <label className="relative overflow-hidden cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-3"> <Upload size={17}/> Chọn file Excel <input type="file" accept=".xls,.xlsx" onChange={handleStockExcelSelect} disabled={stockFileBusy} className="absolute inset-0 opacity-0 cursor-pointer"/> </label>
                <button type="button" onClick={handleExportCurrentStock} disabled={stockFileBusy} className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-3 font-bold text-emerald-700 disabled:opacity-50"><Download size={17}/> Xuất tồn kho Excel</button>
              </div>
              {stockImportProgress && <div className="mt-3 rounded-lg bg-gray-50 border p-3 text-sm text-gray-700" role="status">{stockImportProgress}</div>}
              {stockPreview && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
                <div className="font-bold text-amber-900">File: {stockPreview.fileName}</div>
                <div className="text-sm text-amber-900">Dòng hợp lệ: {stockPreview.rows.length} · Dòng lỗi: {stockPreview.invalid} · Dòng trùng trong file đã bỏ qua: {stockPreview.duplicates}</div>
                <div className="max-h-64 overflow-auto rounded-lg border bg-white"><table className="w-full text-sm"><thead className="sticky top-0 bg-gray-100"><tr><th className="p-2 text-left">Mã sản phẩm</th><th className="p-2 text-left">Tên sản phẩm</th><th className="p-2 text-right">Tồn kho Excel</th></tr></thead><tbody>{stockPreview.rows.slice(0,100).map((row,idx)=><tr key={`${row.code}-${row.sourceRow}`} className="border-t"><td className="p-2">{row.code || '—'}</td><td className="p-2">{row.name}</td><td className="p-2 text-right">{row.stock}</td></tr>)}</tbody></table></div>
                {stockPreview.rows.length > 100 && <p className="text-xs text-gray-600">Đang xem trước 100 dòng đầu; khi cập nhật sẽ xử lý toàn bộ {stockPreview.rows.length} dòng hợp lệ.</p>}
                <div className="flex flex-col sm:flex-row gap-2"><button type="button" onClick={handleApplyStockExcel} disabled={stockFileBusy} className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-3 disabled:opacity-50">Đối chiếu và cập nhật tồn kho</button><button type="button" onClick={()=>{setStockPreview(null);setStockImportProgress('Đã hủy file xem trước; chưa thay đổi dữ liệu.');}} disabled={stockFileBusy} className="rounded-xl border bg-white px-4 py-3 font-bold text-gray-700">Hủy</button></div>
              </div>}
              <p className="text-xs text-gray-500 mt-3">Lưu ý: đây là cập nhật số tồn hiện tại, không tái dựng lịch sử tồn theo từng lần nhập/bán. Hãy sao lưu và kiểm tra file trước khi xác nhận. Nếu Firestore ngắt giữa các lô, kiểm tra tồn kho trước khi chạy lại.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-violet-200 shadow-sm mb-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2"><Database className="text-violet-600"/> Sao lưu / Phục hồi toàn bộ dữ liệu bằng ZIP</h3>
              <p className="text-sm text-gray-600 mt-2 mb-4">Xuất một file ZIP gồm đúng 8 file Excel: Báo cáo tổng hợp, Đơn hàng, Nhập hàng, Sản phẩm, Bảo hành, Khách hàng, Nhà cung cấp và Chi phí. Khi nhập ZIP, hệ thống đọc trước và đếm bản ghi từng nhóm; chỉ ghi Firebase sau khi bạn xác nhận. ID trùng sẽ được cập nhật; bản ghi không có trong ZIP không bị xóa.</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button type="button" onClick={handleExportAllZip} disabled={zipBusy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold px-4 py-3 disabled:opacity-50"><Download size={17}/> {zipBusy?'Đang xử lý...':'Xuất tất cả dữ liệu thành ZIP'}</button>
                <label className={`relative overflow-hidden cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl border border-violet-300 bg-white text-violet-700 font-bold px-4 py-3 ${zipBusy?'opacity-50 pointer-events-none':''}`}><Upload size={17}/> Chọn ZIP để phục hồi<input type="file" accept=".zip,application/zip" onChange={handleZipRestoreSelect} disabled={zipBusy} className="absolute inset-0 opacity-0 cursor-pointer"/></label>
              </div>
              {zipRestoreProgress && <div className="mt-3 rounded-lg bg-gray-50 border p-3 text-sm text-gray-700" role="status">{zipRestoreProgress}</div>}
              {zipRestorePreview && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
                <div className="font-bold text-amber-900">Xem trước ZIP: {zipRestorePreview.fileName}</div>
                <div className="text-sm text-amber-900">Tổng cộng {zipRestorePreview.total} bản ghi hợp lệ. Chưa ghi dữ liệu vào Firebase.</div>
                <div className="overflow-auto rounded-lg border bg-white"><table className="w-full text-sm"><thead className="bg-gray-100"><tr><th className="p-2 text-left">Nhóm dữ liệu</th><th className="p-2 text-right">Số bản ghi</th><th className="p-2 text-left">Trạng thái file</th></tr></thead><tbody>{zipRestorePreview.counts.map(g=><tr key={g.key} className="border-t"><td className="p-2">{g.label}</td><td className="p-2 text-right font-semibold">{g.count}</td><td className="p-2">{g.missing?'Không có file trong ZIP': 'Đã đọc'}</td></tr>)}</tbody></table></div>
                <p className="text-xs text-amber-900">Khi xác nhận, bản ghi cùng ID sẽ được thay bằng dữ liệu trong ZIP. Bản ghi hiện có không xuất hiện trong ZIP sẽ được giữ nguyên. File Báo cáo tổng hợp chỉ để xem, không được nhập vào Firebase.</p>
                <div className="flex flex-col sm:flex-row justify-end gap-2"><button type="button" onClick={()=>setZipRestorePreview(null)} disabled={zipBusy} className="rounded-xl border bg-white px-4 py-3 font-bold">Hủy</button><button type="button" onClick={confirmZipRestore} disabled={zipBusy||!zipRestorePreview.total} className="rounded-xl bg-violet-600 text-white px-4 py-3 font-bold disabled:opacity-50">{zipBusy?'Đang phục hồi...':'Xác nhận phục hồi vào Firebase'}</button></div>
              </div>}
            </div>

          </div>
        )}
            {contactDebtPreview && (
              <div className="fixed inset-0 z-[95] bg-black/60 flex items-center justify-center p-3" role="dialog" aria-modal="true" aria-labelledby="contact-debt-preview-title">
                <div className="bg-white w-full max-w-5xl max-h-[92vh] overflow-auto rounded-2xl shadow-2xl p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3"><div><h3 id="contact-debt-preview-title" className="text-xl font-black text-gray-900">Xem trước nhập danh bạ & công nợ</h3><p className="text-sm text-gray-600 mt-1">{contactDebtPreview.fileName} · {contactDebtPreview.rows.length} mục sẽ nhập · {contactDebtPreview.skippedDuplicates||0} dòng trùng bỏ qua · {contactDebtPreview.skippedJson||0} ô JSON lỗi bỏ qua · chưa ghi dữ liệu</p></div><button type="button" className="border rounded-lg px-3 py-2" onClick={()=>setContactDebtPreview(null)} disabled={contactDebtBusy}>Đóng</button></div>
                  <p className="text-sm rounded-lg bg-amber-50 border border-amber-200 p-3">Khi xác nhận, danh bạ và lịch sử thanh toán của loại đang nhập sẽ thay theo Excel. Số nợ còn lại trên web lấy trực tiếp từ Excel; JSON lỗi, dòng trùng và chi tiết không khớp được bỏ qua. Đơn hàng/phiếu nhập cũ được giữ nguyên, không sửa. Nên xuất file sao lưu trước.</p>
                  <div className="max-h-[48vh] overflow-auto border rounded-xl"><table className="w-full text-sm"><thead className="sticky top-0 bg-gray-100"><tr><th className="p-2 text-left">Mã</th><th className="p-2 text-left">Tên</th><th className="p-2 text-left">Điện thoại</th><th className="p-2 text-right">Tổng nợ</th><th className="p-2 text-right">Nợ còn lại</th><th className="p-2 text-right">Chi tiết nợ</th><th className="p-2 text-right">Thanh toán</th></tr></thead><tbody>{contactDebtPreview.rows.slice(0,200).map((r,i)=><tr key={`${r.code}-${i}`} className="border-t"><td className="p-2">{r.code||'—'}</td><td className="p-2">{r.name||'—'}</td><td className="p-2">{r.phone||'—'}</td><td className="p-2 text-right">{formatCurrency(r.totalDebt)}</td><td className="p-2 text-right">{formatCurrency(r.remainingDebt)}</td><td className="p-2 text-right">{r.debtDetails.length}</td><td className="p-2 text-right">{r.payments.length}</td></tr>)}</tbody></table></div>
                  {contactDebtPreview.rows.length>200&&<p className="text-xs text-gray-500">Bảng xem trước hiển thị 200 dòng đầu; khi xác nhận sẽ xử lý toàn bộ {contactDebtPreview.rows.length} mục.</p>}
                  <div className="flex flex-col sm:flex-row gap-2 justify-end"><button type="button" className="border rounded-xl px-4 py-3 font-bold" onClick={()=>setContactDebtPreview(null)} disabled={contactDebtBusy}>Hủy, chưa ghi</button><button type="button" className="bg-blue-600 text-white rounded-xl px-4 py-3 font-bold disabled:opacity-50" onClick={applyContactDebtImport} disabled={contactDebtBusy}>{contactDebtBusy?'Đang cập nhật...':'Xác nhận thay danh bạ & công nợ'}</button></div>
                </div>
              </div>
            )}
            {deleteTarget && (
              <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="delete-confirm-title">
                <form onSubmit={handleConfirmedDelete} className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 text-blue-600 p-3 rounded-xl"><ShieldAlert size={24}/></div>
                    <div className="flex-1">
                      <h3 id="delete-confirm-title" className="text-lg font-black text-gray-900">Xác nhận xóa dữ liệu</h3>
                      <p className="text-sm text-gray-600 mt-1">Bạn đang chọn: <strong>{({ all: 'Xóa sạch toàn bộ dữ liệu', products: 'Xóa toàn bộ sản phẩm', orders: 'Xóa hóa đơn', imports: 'Xóa lịch sử nhập hàng', expenses: 'Xóa lịch sử chi phí', customers: 'Xóa toàn bộ khách hàng', suppliers: 'Xóa toàn bộ nhà cung cấp' })[deleteTarget]}</strong>. Thao tác này không thể hoàn tác.</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Mật khẩu tài khoản quản trị đang đăng nhập</label>
                    <input type="password" autoComplete="current-password" value={deletePassword} onChange={e => setDeletePassword(e.target.value)} required className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nhập mật khẩu hiện tại" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Nhập lại mật khẩu để xác nhận</label>
                    <input type="password" autoComplete="current-password" value={deletePasswordConfirm} onChange={e => setDeletePasswordConfirm(e.target.value)} required className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nhập lại mật khẩu" />
                  </div>
                  <p className="text-xs text-gray-500">Mật khẩu sẽ được xác thực với Firebase Authentication trước khi xóa. Mật khẩu không được lưu vào cơ sở dữ liệu.</p>
                  {deletingData && <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800" role="status"><div className="font-bold">Đang xử lý, vui lòng không đóng trang...</div><div className="mt-1">{deleteProgress || 'Đang xác thực và chuẩn bị xóa dữ liệu.'}</div></div>}
                  <div className="flex gap-3 pt-1">
                    <button type="button" disabled={deletingData} onClick={() => setDeleteTarget(null)} className="flex-1 border border-gray-300 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 disabled:opacity-50">Hủy</button>
                    <button type="submit" disabled={deletingData} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl disabled:opacity-50">{deletingData ? 'Đang xóa...' : 'Xác nhận xóa'}</button>
                  </div>
                </form>
              </div>
            )}

      </div>
    </div>
  );
}
