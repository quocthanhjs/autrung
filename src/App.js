import React, { useState, useEffect, useMemo } from 'react';  
import {   
LayoutDashboard, ShoppingCart, Package, Users, Truck, Plus,   
Edit, Trash2, Check, X, Image as ImageIcon, ShoppingBag,   
TrendingUp, AlertCircle, ArrowDownToLine, Phone,   
DollarSign, CheckCircle2, Printer, FileText, CreditCard,  
 Lock, LogOut, ShieldAlert, User as UserIcon, Database,  
 UserCog, KeyRound, MonitorSmartphone, Mail, Download, Upload, ArrowUpDown, Search, Eye, Bell, Award, BarChart3, Receipt, ChevronDown, ChevronUp  
} from 'lucide-react';  
  
import { initializeApp } from 'firebase/app';  
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
  
 // States quản lý modal/form cho Khách hàng & Nhà cung cấp  
 const [showCustomerModal, setShowCustomerModal] = useState(false);  
 const [editingCustomer, setEditingCustomer] = useState(null);  
 const [customerForm, setCustomerForm] = useState({ name: '', phone: '', address: '', note: '' });  
 const [customerSearch, setCustomerSearch] = useState('');  
  
 const [showSupplierModal, setShowSupplierModal] = useState(false);  
 const [editingSupplier, setEditingSupplier] = useState(null);  
 const [supplierForm, setSupplierForm] = useState({ name: '', phone: '', address: '', note: '' });  
 const [supplierSearch, setSupplierSearch] = useState('');  
  
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
  
 // Xử lý Lưu Khách hàng  
 const handleSaveCustomer = async (e) => {  
 e.preventDefault();  
 try {  
 if (editingCustomer) {  
 await updateDoc(doc(db, 'stores', storeId, 'customers', editingCustomer.id), customerForm);  
 showToast('Cập nhật khách hàng thành công!');  
 } else {  
 await addDoc(collection(db, 'stores', storeId, 'customers'), { ...customerForm, createdAt: new Date().toISOString() });  
 showToast('Thêm khách hàng thành công!');  
 }  
 setShowCustomerModal(false);  
 setEditingCustomer(null);  
 setCustomerForm({ name: '', phone: '', address: '', note: '' });  
 } catch (err) {  
 showToast('Lỗi: ' + err.message, 'error');  
 }  
 };  
  
 // Xử lý Xóa Khách hàng  
 const handleDeleteCustomer = async (id) => {  
 if (window.confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) {  
 try {  
 await deleteDoc(doc(db, 'stores', storeId, 'customers', id));  
 showToast('Đã xóa khách hàng!');  
 } catch (err) {  
 showToast('Lỗi khi xóa', 'error');  
 }  
 }  
 };  
  
 // Xử lý Lưu Nhà cung cấp  
 const handleSaveSupplier = async (e) => {  
 e.preventDefault();  
 try {  
 if (editingSupplier) {  
 await updateDoc(doc(db, 'stores', storeId, 'suppliers', editingSupplier.id), supplierForm);  
 showToast('Cập nhật nhà cung cấp thành công!');  
 } else {  
 await addDoc(collection(db, 'stores', storeId, 'suppliers'), { ...supplierForm, createdAt: new Date().toISOString() });  
 showToast('Thêm nhà cung cấp thành công!');  
 }  
 setShowSupplierModal(false);  
 setEditingSupplier(null);  
 setSupplierForm({ name: '', phone: '', address: '', note: '' });  
 } catch (err) {  
 showToast('Lỗi: ' + err.message, 'error');  
 }  
 };  
  
 // Xử lý Xóa Nhà cung cấp  
 const handleDeleteSupplier = async (id) => {  
 if (window.confirm('Bạn có chắc chắn muốn xóa nhà cung cấp này?')) {  
 try {  
 await deleteDoc(doc(db, 'stores', storeId, 'suppliers', id));  
 showToast('Đã xóa nhà cung cấp!');  
 } catch (err) {  
 showToast('Lỗi khi xóa', 'error');  
 }  
 }  
 };  
  
 if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;  
 if (!user) return <LoginView onLoginSuccess={(u, r, n, p) => { setUser(u); setUserData({ role: r, name: n, perms: p }); setActiveTab(r === 'admin' ? 'dashboard' : 'pos'); }} />;  
  
 const allTabs = [  
 { id: 'dashboard', icon: LayoutDashboard, label: 'Báo cáo & Nhập xuất' },  
 { id: 'pos', icon: ShoppingCart, label: 'Bán hàng (POS)' },  
 { id: 'products', icon: Package, label: 'Hàng hóa' },  
 { id: 'customers', icon: Users, label: 'Khách hàng' },  
 { id: 'suppliers', icon: Truck, label: 'Nhà cung cấp' },  
 ];  
  
 return (  
 <div className="min-h-screen bg-gray-100 flex flex-col">  
 {/* Toast Notification */}  
 {toast && (  
 <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg text-white ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'} transition-all`}>  
 {toast.msg}  
 </div>  
 )}  
  
 {/* Top Navigation */}  
 <header className="bg-white shadow-sm border-b px-6 py-3 flex justify-between items-center">  
 <div className="flex items-center gap-3">  
 <div className="bg-blue-600 text-white p-2 rounded-lg font-bold"><ShoppingBag size={24} /></div>  
 <div>  
 <h1 className="font-bold text-gray-800 text-lg">{storeConfig.name}</h1>  
 <p className="text-xs text-gray-500">Xin chào, {userData.name} ({userData.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'})</p>  
 </div>  
 </div>  
 <button onClick={() => signOut(auth)} className="flex items-center gap-2 text-gray-600 hover:text-red-600 font-medium text-sm"><LogOut size={18} /> Đăng xuất</button>  
 </header>  
  
 {/* Main Tab Navigation */}  
 <div className="bg-white border-b px-6 flex gap-2 overflow-x-auto">  
 {allTabs.map(tab => {  
 const Icon = tab.icon;  
 return (  
 <button  
 key={tab.id}  
 onClick={() => setActiveTab(tab.id)}  
 className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}  
 >  
 <Icon size={18} /> {tab.label}  
 </button>  
 );  
 })}  
 </div>  
  
 {/* Tab Content Area */}  
 <main className="flex-1 p-6 max-w-7xl w-full mx-auto">  
 {activeTab === 'customers' && (  
 <div className="bg-white rounded-2xl shadow-sm p-6">  
 <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">  
 <div className="relative w-full md:w-80">  
 <Search className="absolute left-3 top-3 text-gray-400" size={18} />  
 <input  
 type="text"  
 placeholder="Tìm kiếm khách hàng..."  
 value={customerSearch}  
 onChange={(e) => setCustomerSearch(e.target.value)}  
 className="w-full pl-10 pr-4 py-2 border rounded-xl outline-none"  
 />  
 </div>  
 <button  
 onClick={() => { setEditingCustomer(null); setCustomerForm({ name: '', phone: '', address: '', note: '' }); setShowCustomerModal(true); }}  
 className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium hover:bg-blue-700 w-full md:w-auto justify-center"  
 >  
 <Plus size={18} /> Thêm khách hàng  
 </button>  
 </div>  
  
 <div className="overflow-x-auto">  
 <table className="w-full text-left border-collapse">  
 <thead>  
 <tr className="border-b bg-gray-50 text-gray-600 text-sm">  
 <th className="p-3">Tên khách hàng</th>  
 <th className="p-3">Số điện thoại</th>  
 <th className="p-3">Địa chỉ</th>  
 <th className="p-3">Ghi chú</th>  
 <th className="p-3 text-right">Thao tác</th>  
 </tr>  
 </thead>  
 <tbody className="divide-y text-sm">  
 {customers  
 .filter(c => c.name?.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone?.includes(customerSearch))  
 .map(c => (  
 <tr key={c.id} className="hover:bg-gray-50">  
 <td className="p-3 font-semibold text-gray-800">{c.name}</td>  
 <td className="p-3 text-gray-600">{c.phone || '-'}</td>  
 <td className="p-3 text-gray-600">{c.address || '-'}</td>  
 <td className="p-3 text-gray-500">{c.note || '-'}</td>  
 <td className="p-3 text-right flex justify-end gap-2">  
 <button  
 onClick={() => { setEditingCustomer(c); setCustomerForm({ name: c.name || '', phone: c.phone || '', address: c.address || '', note: c.note || '' }); setShowCustomerModal(true); }}  
 className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"  
 >  
 <Edit size={16} />  
 </button>  
 <button  
 onClick={() => handleDeleteCustomer(c.id)}  
 className="p-2 text-red-600 hover:bg-red-50 rounded-lg"  
 >  
 <Trash2 size={16} />  
 </button>  
 </td>  
 </tr>  
 ))}  
 {customers.length === 0 && (  
 <tr><td colSpan="5" className="text-center py-8 text-gray-400">Chưa có khách hàng nào</td></tr>  
 )}  
 </tbody>  
 </table>  
 </div>  
 </div>  
 )}  
  
 {activeTab === 'suppliers' && (  
 <div className="bg-white rounded-2xl shadow-sm p-6">  
 <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">  
 <div className="relative w-full md:w-80">  
 <Search className="absolute left-3 top-3 text-gray-400" size={18} />  
 <input  
 type="text"  
 placeholder="Tìm kiếm nhà cung cấp..."  
 value={supplierSearch}  
 onChange={(e) => setSupplierSearch(e.target.value)}  
 className="w-full pl-10 pr-4 py-2 border rounded-xl outline-none"  
 />  
 </div>  
 <button  
 onClick={() => { setEditingSupplier(null); setSupplierForm({ name: '', phone: '', address: '', note: '' }); setShowSupplierModal(true); }}  
 className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium hover:bg-blue-700 w-full md:w-auto justify-center"  
 >  
 <Plus size={18} /> Thêm nhà cung cấp  
 </button>  
 </div>  
  
 <div className="overflow-x-auto">  
 <table className="w-full text-left border-collapse">  
 <thead>  
 <tr className="border-b bg-gray-50 text-gray-600 text-sm">  
 <th className="p-3">Tên nhà cung cấp</th>  
 <th className="p-3">Số điện thoại</th>  
 <th className="p-3">Địa chỉ</th>  
 <th className="p-3">Ghi chú</th>  
 <th className="p-3 text-right">Thao tác</th>  
 </tr>  
 </thead>  
 <tbody className="divide-y text-sm">  
 {suppliers  
 .filter(s => s.name?.toLowerCase().includes(supplierSearch.toLowerCase()) || s.phone?.includes(supplierSearch))  
 .map(s => (  
 <tr key={s.id} className="hover:bg-gray-50">  
 <td className="p-3 font-semibold text-gray-800">{s.name}</td>  
 <td className="p-3 text-gray-600">{s.phone || '-'}</td>  
 <td className="p-3 text-gray-600">{s.address || '-'}</td>  
 <td className="p-3 text-gray-500">{s.note || '-'}</td>  
 <td className="p-3 text-right flex justify-end gap-2">  
 <button  
 onClick={() => { setEditingSupplier(s); setSupplierForm({ name: s.name || '', phone: s.phone || '', address: s.address || '', note: s.note || '' }); setShowSupplierModal(true); }}  
 className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"  
 >  
 <Edit size={16} />  
 </button>  
 <button  
 onClick={() => handleDeleteSupplier(s.id)}  
 className="p-2 text-red-600 hover:bg-red-50 rounded-lg"  
 >  
 <Trash2 size={16} />  
 </button>  
 </td>  
 </tr>  
 ))}  
 {suppliers.length === 0 && (  
 <tr><td colSpan="5" className="text-center py-8 text-gray-400">Chưa có nhà cung cấp nào</td></tr>  
 )}  
 </tbody>  
 </table>  
 </div>  
 </div>  
 )}  
  
 {activeTab !== 'customers' && activeTab !== 'suppliers' && (  
 <div className="bg-white rounded-2xl shadow-sm p-6 text-center text-gray-500">  
 <p>Nội dung tab [{activeTab}] đang hiển thị theo hệ thống hiện tại.</p>  
 </div>  
 )}  
 </main>  
  
 {/* Modal Khách hàng */}  
 <Modal isOpen={showCustomerModal} onClose={() => setShowCustomerModal(false)} title={editingCustomer ? "Sửa thông tin khách hàng" : "Thêm khách hàng mới"}>  
 <form onSubmit={handleSaveCustomer} className="space-y-4">  
 <div>  
 <label className="block text-sm font-medium text-gray-700 mb-1">Tên khách hàng *</label>  
 <input  
 type="text"  
 required  
 value={customerForm.name}  
 onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}  
 className="w-full p-2.5 border rounded-xl outline-none"  
 placeholder="Nhập tên khách hàng..."  
 />  
 </div>  
 <div>  
 <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>  
 <input  
 type="text"  
 value={customerForm.phone}  
 onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}  
 className="w-full p-2.5 border rounded-xl outline-none"  
 placeholder="Số điện thoại..."  
 />  
 </div>  
 <div>  
 <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>  
 <input  
 type="text"  
 value={customerForm.address}  
 onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}  
 className="w-full p-2.5 border rounded-xl outline-none"  
 placeholder="Địa chỉ..."  
 />  
 </div>  
 <div>  
 <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>  
 <textarea  
 value={customerForm.note}  
 onChange={(e) => setCustomerForm({ ...customerForm, note: e.target.value })}  
 className="w-full p-2.5 border rounded-xl outline-none"  
 placeholder="Ghi chú thêm..."  
 rows="3"  
 />  
 </div>  
 <div className="flex justify-end gap-3 pt-2">  
 <button  
 type="button"  
 onClick={() => setShowCustomerModal(false)}  
 className="px-4 py-2 border rounded-xl text-gray-600 hover:bg-gray-50"  
 >  
 Hủy  
 </button>  
 <button  
 type="submit"  
 className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"  
 >  
 Lưu khách hàng  
 </button>  
 </div>  
 </form>  
 </Modal>  
  
 {/* Modal Nhà cung cấp */}  
 <Modal isOpen={showSupplierModal} onClose={() => setShowSupplierModal(false)} title={editingSupplier ? "Sửa thông tin nhà cung cấp" : "Thêm nhà cung cấp mới"}>  
 <form onSubmit={handleSaveSupplier} className="space-y-4">  
 <div>  
 <label className="block text-sm font-medium text-gray-700 mb-1">Tên nhà cung cấp *</label>  
 <input  
 type="text"  
 required  
 value={supplierForm.name}  
 onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}  
 className="w-full p-2.5 border rounded-xl outline-none"  
 placeholder="Nhập tên nhà cung cấp..."  
 />  
 </div>  
 <div>  
 <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>  
 <input  
 type="text"  
 value={supplierForm.phone}  
 onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}  
 className="w-full p-2.5 border rounded-xl outline-none"  
 placeholder="Số điện thoại..."  
 />  
 </div>  
 <div>  
 <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>  
 <input  
 type="text"  
 value={supplierForm.address}  
 onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}  
 className="w-full p-2.5 border rounded-xl outline-none"  
 placeholder="Địa chỉ..."  
 />  
 </div>  
 <div>  
 <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>  
 <textarea  
 value={supplierForm.note}  
 onChange={(e) => setSupplierForm({ ...supplierForm, note: e.target.value })}  
 className="w-full p-2.5 border rounded-xl outline-none"  
 placeholder="Ghi chú thêm..."  
 rows="3"  
 />  
 </div>  
 <div className="flex justify-end gap-3 pt-2">  
 <button  
 type="button"  
 onClick={() => setShowSupplierModal(false)}  
 className="px-4 py-2 border rounded-xl text-gray-600 hover:bg-gray-50"  
 >  
 Hủy  
 </button>  
 <button  
 type="submit"  
 className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"  
 >  
 Lưu nhà cung cấp  
 </button>  
 </div>  
 </form>  
 </Modal>  
 </div>  
 );  
}
