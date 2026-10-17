import React, { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, ShoppingCart, Package, Users, Truck, Edit, Trash2, Check, X, ShoppingBag, TrendingUp, AlertCircle, ArrowDownToLine, DollarSign, Receipt, CreditCard, LogOut, Database, UserCog, Printer, Image as ImageIcon, Save } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, onSnapshot, collection, writeBatch, query, where } from 'firebase/firestore';

const app = initializeApp({
  apiKey: "AIzaSyClQogCLby6OYpVzRwJ9181rmg1Lho5FV8", authDomain: "smartpos-5f5cf.firebaseapp.com",
  projectId: "smartpos-5f5cf", storageBucket: "smartpos-5f5cf.firebasestorage.app",
  messagingSenderId: "458225351603", appId: "1:458225351603:web:f67d06427def5a33dca9c6"
});
const auth = getAuth(app); const db = getFirestore(app);
const formatCurrency = (amt) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amt || 0);
const formatDate = (iso) => new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso));

const Modal = ({ isOpen, onClose, title, children, mw="max-w-md", noHeader=false }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 print:p-0 print:bg-white print:absolute print:inset-0">
      <div className={`bg-white rounded-xl shadow-2xl w-full ${mw} flex flex-col max-h-[90vh] print:max-h-none print:shadow-none`}>
        {!noHeader && <div className="flex justify-between p-4 border-b no-print"><h3 className="font-bold text-lg">{title}</h3><button type="button" onClick={onClose}><X/></button></div>}
        <div className="p-4 overflow-y-auto print:p-0 print:overflow-visible">{children}</div>
      </div>
    </div>
  );
};

// --- XUẤT ẢNH JPG & IN HÓA ĐƠN ---
function OrderPrintModal({ order, storeConfig, onClose }) {
  const [opt, setOpt] = useState({ size: storeConfig?.printDefaultSize || 'a4', logo: true, note: true, bh: true });
  const [loading, setLoading] = useState(false);
  const saveJPG = async () => {
    const el = document.getElementById('receipt-content');
    if (window.html2canvas && el) {
      setLoading(true);
      try {
        const canvas = await window.html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#fff' });
        const link = document.createElement('a'); link.download = `HD_${order.id || 'NHAP'}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.9); link.click();
      } catch (e) { alert("Lỗi lưu ảnh!"); } finally { setLoading(false); }
    } else alert("Đang tải công cụ ảnh, đợi 2 giây...");
  };
  if (!order) return null;
  return (
    <Modal isOpen={true} onClose={onClose} noHeader={true} mw="max-w-2xl">
      <div className="bg-blue-50 p-3 border-b flex flex-wrap gap-3 items-center justify-between no-print shrink-0">
        <b className="text-blue-800">Tùy chọn Lưu Ảnh/In</b>
        <div className="flex gap-3 items-center text-sm">
          <select value={opt.size} onChange={e=>setOpt({...opt, size: e.target.value})} className="p-1 border bg-white"><option value="bill">In nhiệt K80</option><option value="a4">Giấy A4</option></select>
          <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={opt.logo} onChange={e=>setOpt({...opt, logo: e.target.checked})}/> Logo</label>
          <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={opt.note} onChange={e=>setOpt({...opt, note: e.target.checked})}/> G.Chú</label>
          <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={opt.bh} onChange={e=>setOpt({...opt, bh: e.target.checked})}/> B.Hành</label>
          <button onClick={saveJPG} disabled={loading} className="bg-blue-600 text-white px-3 py-1.5 rounded flex items-center gap-1 font-bold"><ImageIcon size={16}/> {loading ? 'Đang xuất...' : 'Lưu JPG'}</button>
          <button onClick={() => window.print()} className="bg-gray-600 text-white px-3 py-1.5 rounded flex items-center gap-1 font-bold"><Printer size={16}/> In giấy</button>
          <button onClick={onClose} className="text-red-500 font-bold ml-2">X</button>
        </div>
      </div>
      <div className="p-4 bg-gray-100 flex justify-center overflow-auto print:p-0 print:bg-white print:overflow-visible">
        <div id="receipt-content" className="bg-white p-4" style={{ width: opt.size === 'bill' ? '300px' : '794px' }}>
          <div className="text-center border-b-2 border-black pb-3 mb-3">
            {opt.logo && storeConfig?.logo && <img src={storeConfig.logo} alt="Logo" className="max-h-16 mx-auto mb-1 object-contain"/>}
            <h2 className="font-bold uppercase text-lg">{storeConfig?.name || 'SmartPOS'}</h2>
            <p className="text-xs">ĐC: {storeConfig?.address}</p><p className="text-xs">SĐT: {storeConfig?.phone}</p>
            <h1 className="font-bold mt-2 text-base">HÓA ĐƠN BÁN HÀNG</h1>
            <p className="text-[10px]">Mã HD: #{order.id} | Ngày: {formatDate(order.date)}</p>
          </div>
          <p className="text-sm mb-2"><b>Khách hàng:</b> {order.customerName}</p>
          <table className="w-full text-sm mb-4 border-collapse">
            <thead className="border-b border-black"><tr><th className="py-1 text-left">Sản phẩm</th><th className="py-1 text-center">SL</th><th className="py-1 text-right">Tiền</th></tr></thead>
            <tbody>
              {order.items.map((i,x) => (
                <tr key={x} className="border-b border-gray-200 border-dashed">
                  <td className="py-1.5">
                    <b>{i.name}</b>
                    {opt.note && i.note && <div className="text-[10px] italic">GC: {i.note}</div>}
                    {opt.bh && i.warrantyValue && <div className="text-[10px]">BH: {i.warrantyValue} {i.warrantyUnit}</div>}
                  </td>
                  <td className="py-1.5 text-center">{i.quantity}</td>
                  <td className="py-1.5 text-right font-bold">{formatCurrency(i.price*i.quantity)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-black"><tr><td colSpan="2" className="py-2 text-right font-bold">TỔNG CỘNG:</td><td className="py-2 text-right font-bold text-base text-blue-800">{formatCurrency(order.total)}</td></tr></tfoot>
          </table>
          <p className="text-center text-[10px] italic mt-6">{storeConfig?.printFooterText || 'Cảm ơn quý khách!'}</p>
        </div>
      </div>
    </Modal>
  );
}

function StatCard({ icon, title, value, color, highlight }) {
  return (
    <div className={`p-4 rounded-xl border shadow-sm flex flex-col justify-between bg-white ${highlight ? 'ring-2 ring-green-500' : ''}`}>
      <div className="flex items-center gap-3 mb-2"><div className={`p-2 rounded-lg ${color}`}>{icon}</div><h3 className="text-xs font-bold text-gray-500 uppercase">{title}</h3></div>
      <p className="text-xl font-black text-gray-800">{value}</p>
    </div>
  );
}

// --- MAIN COMPONENT ---
export default function EnhancedPOS() {
  const [user, setUser] = useState(null); const [userData, setUserData] = useState({ role: null, name: '', perms: {} });
  const [activeTab, setActiveTab] = useState('pos');
  const [storeConfig, setStoreConfig] = useState({ name: 'SmartPOS', address: '', phone: '', logo: '', printDefaultSize: 'bill', printFooterText: 'Xin cảm ơn!' });
  const [data, setData] = useState({ products: [], orders: [], imports: [], customers: [], suppliers: [], expenses: [], staff: [] });
  const [loading, setLoading] = useState(true); const [toast, setToast] = useState(null);
  const storeId = 'main_store';

  useEffect(() => {
    if (!document.getElementById('h2c')) { const s = document.createElement('script'); s.id='h2c'; s.src='https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'; document.head.appendChild(s); }
    return onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u); const d = await getDoc(doc(db, 'users_db', u.uid));
        if (d.exists()) { setUserData(d.data()); setActiveTab(d.data().role === 'admin' ? 'dashboard' : 'pos'); }
      } else { setUser(null); }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubStore = onSnapshot(doc(db, 'stores', storeId), (d) => { if (d.exists()) setStoreConfig(prev => ({...prev, ...d.data()})); });
    const subs = ['products', 'orders', 'imports', 'customers', 'suppliers', 'expenses'].map(col => 
      onSnapshot(collection(db, 'stores', storeId, col), (snap) => setData(p => ({...p, [col]: snap.docs.map(d=>({id:d.id, ...d.data()}))})))
    );
    const uSub = onSnapshot(collection(db, 'users_db'), snap => setData(p => ({...p, staff: snap.docs.map(d=>({id:d.id, ...d.data()}))})));
    return () => { unsubStore(); subs.forEach(u=>u()); uSub(); };
  }, [user]);

  const showToast = (msg, type='success') => { setToast({msg, type}); setTimeout(()=>setToast(null), 3000); };
  if (loading) return <div className="min-h-screen flex items-center justify-center">Đang tải...</div>;
  
  if (!user) {
    const handleLogin = async (e, u, p) => {
      e.preventDefault();
      try {
        let em = u; if (!em.includes('@')) { const q = await getDocs(query(collection(db, 'users_db'), where('username', '==', u))); if (!q.empty) em = q.docs[0].data().email; }
        await signInWithEmailAndPassword(auth, em, p);
      } catch (err) { alert("Sai tài khoản/mật khẩu!"); }
    };
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <form onSubmit={(e)=>handleLogin(e, e.target.u.value, e.target.p.value)} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm space-y-4">
          <h1 className="text-xl font-bold text-center">ĐĂNG NHẬP</h1>
          <input required name="u" placeholder="Tên đăng nhập / Email" className="w-full p-3 border rounded-lg" />
          <input required name="p" type="password" placeholder="Mật khẩu" className="w-full p-3 border rounded-lg" />
          <button className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg">Đăng nhập</button>
        </form>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', i: LayoutDashboard, l: 'Báo cáo', pId: 'tong_quan_xem' }, { id: 'pos', i: ShoppingCart, l: 'Bán hàng', pId: 'ALWAYS' },
    { id: 'sales_history', i: Receipt, l: 'QL Bán Hàng', pId: 'ban_hang' }, { id: 'imports', i: ArrowDownToLine, l: 'Nhập hàng', pId: 'mua_nhap_hang' },
    { id: 'products', i: Package, l: 'Kho hàng', pId: 'hh_danh_sach' }, { id: 'customers', i: Users, l: 'Khách hàng', pId: 'kh_danh_sach' },
    { id: 'suppliers', i: Truck, l: 'Nhà cung cấp', pId: 'mua_ncc' }, { id: 'expenses', i: CreditCard, l: 'Chi phí', pId: 'quy_so_quy' },
    { id: 'settings', i: Database, l: 'Cài đặt', admin: true }, { id: 'staff', i: UserCog, l: 'Nhân viên', admin: true },
  ];
  
  const visibleTabs = tabs.filter(t => userData.role === 'admin' || t.pId === 'ALWAYS' || (t.pId && userData.perms?.[t.pId]));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans text-sm print:bg-white print:block">
      <aside className="w-full md:w-56 bg-white border-r flex flex-col shadow-sm shrink-0 no-print">
        <div className="p-4 border-b font-bold text-lg text-blue-800 flex items-center gap-2"><ShoppingBag/>{storeConfig.name}</div>
        <nav className="flex-1 p-2 flex flex-row md:flex-col overflow-x-auto gap-1">
          {visibleTabs.map(t => (
            <button key={t.id} onClick={()=>setActiveTab(t.id)} className={`flex items-center gap-2 p-3 rounded-lg whitespace-nowrap ${activeTab===t.id?'bg-blue-50 text-blue-700 font-bold':'text-gray-600 hover:bg-gray-50'}`}><t.i size={18}/>{t.l}</button>
          ))}
        </nav>
        <div className="p-3 border-t flex justify-between items-center"><div className="truncate"><b className="block">{userData.name}</b><span className="text-xs text-gray-500">{userData.role==='admin'?'Quản trị':'Nhân viên'}</span></div><button onClick={()=>signOut(auth)} className="text-red-500"><LogOut size={18}/></button></div>
      </aside>
      <main className="flex-1 overflow-hidden h-screen flex flex-col relative print:h-auto print:block">
        {toast && <div className={`absolute top-4 right-4 z-[200] p-4 rounded text-white font-bold shadow-lg ${toast.type==='success'?'bg-green-600':'bg-red-600'}`}>{toast.msg}</div>}
        {activeTab === 'dashboard' && <DashboardView d={data} />}
        {activeTab === 'pos' && <POSView d={data} db={db} stId={storeId} u={user} cfg={storeConfig} t={showToast} />}
        {activeTab === 'sales_history' && <SalesHistoryView d={data} db={db} stId={storeId} cfg={storeConfig} t={showToast} />}
        {activeTab === 'imports' && <ImportView d={data} db={db} stId={storeId} u={user} t={showToast} />}
        {activeTab === 'products' && <InventoryView d={data} db={db} stId={storeId} t={showToast} />}
        {activeTab === 'customers' && <ContactManager type="customers" d={data.customers} db={db} stId={storeId} t={showToast} />}
        {activeTab === 'suppliers' && <ContactManager type="suppliers" d={data.suppliers} db={db} stId={storeId} t={showToast} />}
        {activeTab === 'expenses' && <ExpenseView d={data.expenses} db={db} stId={storeId} t={showToast} />}
        {activeTab === 'settings' && <SettingsView cfg={storeConfig} db={db} stId={storeId} t={showToast} />}
        {activeTab === 'staff' && <StaffManagerView d={data.staff} auth={auth} db={db} t={showToast} />}
      </main>
    </div>
  );
}

// 1. DASHBOARD
function DashboardView({ d }) {
  const [fm, setFm] = useState((new Date().getMonth()+1).toString()); const [fy, setFy] = useState(new Date().getFullYear().toString());
  const stats = useMemo(() => {
    const fo = d.orders.filter(o => { const dt = new Date(o.date); return (fm==='ALL'||(dt.getMonth()+1).toString()===fm) && dt.getFullYear().toString()===fy; });
    const fe = d.expenses.filter(e => { const dt = new Date(e.date); return (fm==='ALL'||(dt.getMonth()+1).toString()===fm) && dt.getFullYear().toString()===fy; });
    const tr = fo.reduce((s,o)=>s+o.total,0); const tc = fo.reduce((s,o)=>s+(o.totalCost||0),0); const te = fe.reduce((s,e)=>s+(Number(e.amount)||0),0);
    return { tr, tc, te, net: tr - tc - te };
  }, [d, fm, fy]);
  const cDebt = d.customers.filter(c => c.totalDebt > 0).sort((a,b)=>b.totalDebt-a.totalDebt);
  const sDebt = d.suppliers.filter(s => s.totalDebt > 0).sort((a,b)=>b.totalDebt-a.totalDebt);

  return (
    <div className="p-4 overflow-auto bg-gray-50 flex-1 space-y-4">
      <div className="flex justify-between"><h2 className="text-xl font-bold">Báo Cáo</h2><div className="flex gap-2"><select value={fm} onChange={e=>setFm(e.target.value)} className="p-1 border rounded bg-white"><option value="ALL">Cả năm</option>{[...Array(12)].map((_,i)=><option key={i} value={i+1}>Tháng {i+1}</option>)}</select><input type="number" value={fy} onChange={e=>setFy(e.target.value)} className="p-1 border rounded w-20"/></div></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<TrendingUp/>} title="Doanh Thu" value={formatCurrency(stats.tr)} color="bg-blue-100 text-blue-600"/>
        <StatCard icon={<Package/>} title="Giá Vốn" value={formatCurrency(stats.tc)} color="bg-gray-200"/>
        <StatCard icon={<CreditCard/>} title="Chi Phí" value={formatCurrency(stats.te)} color="bg-orange-100 text-orange-600"/>
        <StatCard icon={<DollarSign/>} title="Lãi Ròng" value={formatCurrency(stats.net)} color="bg-green-100 text-green-600" highlight={true}/>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white p-4 border rounded-xl shadow-sm">
          <h3 className="font-bold mb-4">Tỷ trọng</h3>
          <div className="space-y-4">
            <div><div className="flex justify-between text-xs mb-1"><b className="text-blue-600">Doanh thu</b><span>{formatCurrency(stats.tr)}</span></div><div className="w-full bg-gray-200 h-2 rounded"><div className="bg-blue-500 h-2 rounded" style={{width:`${(stats.tr/(Math.max(stats.tr,stats.tc,stats.te)||1))*100}%`}}></div></div></div>
            <div><div className="flex justify-between text-xs mb-1"><b className="text-gray-600">Giá vốn</b><span>{formatCurrency(stats.tc)}</span></div><div className="w-full bg-gray-200 h-2 rounded"><div className="bg-gray-500 h-2 rounded" style={{width:`${(stats.tc/(Math.max(stats.tr,stats.tc,stats.te)||1))*100}%`}}></div></div></div>
            <div><div className="flex justify-between text-xs mb-1"><b className="text-orange-600">Chi phí</b><span>{formatCurrency(stats.te)}</span></div><div className="w-full bg-gray-200 h-2 rounded"><div className="bg-orange-500 h-2 rounded" style={{width:`${(stats.te/(Math.max(stats.tr,stats.tc,stats.te)||1))*100}%`}}></div></div></div>
          </div>
        </div>
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          <div className="bg-white p-4 border rounded-xl shadow-sm"><h3 className="font-bold text-red-600 mb-2 flex items-center gap-1"><AlertCircle size={16}/> Khách nợ</h3><div className="max-h-40 overflow-auto">{cDebt.map(c=><div key={c.id} className="flex justify-between py-1 border-b text-xs"><span>{c.name}</span><b className="text-red-600">{formatCurrency(c.totalDebt)}</b></div>)}</div></div>
          <div className="bg-white p-4 border rounded-xl shadow-sm"><h3 className="font-bold text-orange-600 mb-2 flex items-center gap-1"><AlertCircle size={16}/> Nợ NCC</h3><div className="max-h-40 overflow-auto">{sDebt.map(s=><div key={s.id} className="flex justify-between py-1 border-b text-xs"><span>{s.name}</span><b className="text-orange-600">{formatCurrency(s.totalDebt)}</b></div>)}</div></div>
        </div>
      </div>
    </div>
  );
}

// 2. POS
function POSView({ d, db, stId, u, cfg, t }) {
  const [cart, setCart] = useState([]); const [search, setSearch] = useState(''); const [selCus, setSelCus] = useState(null);
  const [printOrd, setPrintOrd] = useState(null); const [isProc, setIsProc] = useState(false);
  const [moCus, setMoCus] = useState(false); const [fc, setFc] = useState({n:'',p:''});

  const addCart = (p) => setCart(pr => pr.find(i=>i.id===p.id) ? pr.map(i=>i.id===p.id?{...i, quantity:i.quantity+1}:i) : [...pr, {...p, quantity:1, cost: p.cost||0, note:'', warrantyValue:'', warrantyUnit:'tháng'}]);
  const updateCart = (id, f, v) => setCart(pr => pr.map(i=>i.id===id?{...i, [f]: (f==='price'||f==='quantity')?Number(v):v}:i));
  const tot = cart.reduce((s, i) => s + (i.price*i.quantity), 0);
  
  const checkout = async (status) => {
    if(cart.length===0) return; setIsProc(true);
    try {
      const oId = Math.random().toString(36).substring(2,8).toUpperCase();
      const oData = { id: oId, date: new Date().toISOString(), items: cart, total: tot, totalCost: cart.reduce((s,i)=>s+(i.cost*i.quantity),0), status, customerId: selCus?selCus.id:null, customerName: selCus?selCus.name:'Khách lẻ', userId: u.uid };
      const batch = writeBatch(db);
      cart.forEach(i => batch.update(doc(db, 'stores', stId, 'products', i.id), { stock: (i.stock||0)-i.quantity }));
      batch.set(doc(collection(db, 'stores', stId, 'orders'), oId), oData);
      if(status==='DEBT'&&selCus) batch.update(doc(db, 'stores', stId, 'customers', selCus.id), { totalDebt: (selCus.totalDebt||0)+tot });
      await batch.commit(); t("Đã thanh toán!"); setCart([]); setSelCus(null);
    } catch(e) { t("Lỗi thanh toán!", "error"); } finally { setIsProc(false); }
  };

  const saveCus = async(e) => { e.preventDefault(); const res = await addDoc(collection(db,'stores',stId,'customers'), {name:fc.n, phone:fc.p, totalDebt:0}); setSelCus({id:res.id, name:fc.n, phone:fc.p}); setMoCus(false); t("Đã thêm khách"); };

  return (
    <div className="flex h-full bg-gray-50">
      <div className="flex-1 flex flex-col p-3 border-r">
        <input placeholder="Tìm sản phẩm..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full p-2.5 mb-3 border rounded shadow-sm outline-none"/>
        <div className="flex-1 overflow-auto grid grid-cols-2 lg:grid-cols-3 gap-3">
          {d.products.filter(p=>p.name?.toLowerCase().includes(search.toLowerCase())).map(p=>(
            <div key={p.id} onClick={()=>addCart(p)} className="bg-white p-3 border rounded-lg cursor-pointer hover:border-blue-500 flex flex-col justify-between shadow-sm">
              <p className="font-bold text-sm mb-2 max-h-10 overflow-hidden">{p.name}</p>
              <div className="flex justify-between border-t pt-2"><b className="text-blue-600">{formatCurrency(p.price)}</b><span className="text-[10px] bg-gray-100 px-1 rounded">Tồn:{p.stock}</span></div>
            </div>
          ))}
        </div>
      </div>
      <div className="w-[420px] flex flex-col bg-white shadow-xl">
        <div className="p-3 border-b flex gap-2">
          <select value={selCus?selCus.id:''} onChange={e=>setSelCus(d.customers.find(c=>c.id===e.target.value)||null)} className="flex-1 p-2 border rounded bg-white outline-none"><option value="">-- Khách lẻ --</option>{d.customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <button onClick={()=>setMoCus(true)} className="bg-blue-600 text-white px-4 rounded font-bold hover:bg-blue-700">+</button>
        </div>
        <div className="flex-1 overflow-auto p-3 space-y-2 bg-gray-50">
          {cart.map(i => (
            <div key={i.id} className="bg-white p-2 border rounded shadow-sm">
              <div className="flex justify-between mb-1"><b className="text-sm">{i.name}</b><button onClick={()=>setCart(pr=>pr.filter(x=>x.id!==i.id))} className="text-red-500 font-bold bg-red-50 px-2 rounded text-xs">Xóa</button></div>
              <div className="flex gap-2 mb-1">
                <div className="flex-1"><label className="text-[10px] text-gray-500">Giá bán</label><input type="number" value={i.price} onChange={e=>updateCart(i.id, 'price', e.target.value)} className="w-full p-1.5 border rounded text-blue-600 font-bold text-sm outline-none"/></div>
                <div className="w-16"><label className="text-[10px] text-gray-500">SL</label><input type="number" value={i.quantity} onChange={e=>updateCart(i.id, 'quantity', e.target.value)} className="w-full p-1.5 border rounded text-center font-bold text-sm outline-none"/></div>
              </div>
              <div className="flex gap-1 mb-1">
                <div className="flex-1"><label className="text-[10px] text-gray-500">Ghi chú(Màu/IMEI)</label><input value={i.note} onChange={e=>updateCart(i.id, 'note', e.target.value)} className="w-full p-1 border rounded text-xs outline-none"/></div>
                <div className="w-12"><label className="text-[10px] text-gray-500">B.Hành</label><input type="number" value={i.warrantyValue} onChange={e=>updateCart(i.id, 'warrantyValue', e.target.value)} className="w-full p-1 border rounded text-xs text-center outline-none"/></div>
                <div className="w-16"><label className="text-[10px] text-gray-500">Đ.Vị</label><select value={i.warrantyUnit} onChange={e=>updateCart(i.id, 'warrantyUnit', e.target.value)} className="w-full p-1 border rounded text-xs bg-white outline-none"><option value="ngày">Ngày</option><option value="tuần">Tuần</option><option value="tháng">Tháng</option><option value="năm">Năm</option></select></div>
              </div>
              <div className="text-right text-xs"><span className="text-gray-500">Thành tiền: </span><b className="text-blue-800 text-sm">{formatCurrency(i.price*i.quantity)}</b></div>
            </div>
          ))}
          {cart.length===0 && <div className="text-center text-gray-400 mt-10">Giỏ hàng trống</div>}
        </div>
        <div className="p-3 bg-white border-t space-y-2">
          <div className="flex justify-between items-center p-2 bg-gray-50 border rounded"><b className="text-gray-600">Tổng tiền:</b><b className="text-xl text-blue-600">{formatCurrency(tot)}</b></div>
          <button disabled={cart.length===0} onClick={()=>setPrintOrd({id:'NHAP', date:new Date().toISOString(), items:cart, total:tot, customerName:selCus?selCus.name:'Khách lẻ'})} className="w-full bg-blue-100 text-blue-700 py-2 font-bold rounded border flex justify-center items-center gap-1"><ImageIcon size={18}/> Xem & In Hóa đơn</button>
          <div className="flex gap-2">
            <button disabled={isProc||cart.length===0} onClick={()=>checkout('DEBT')} className="flex-1 bg-orange-100 text-orange-700 font-bold py-3 rounded">GHI NỢ</button>
            <button disabled={isProc||cart.length===0} onClick={()=>checkout('PAID')} className="flex-1 bg-green-600 text-white font-bold py-3 rounded shadow">LƯU ĐƠN</button>
          </div>
        </div>
      </div>
      <OrderPrintModal order={printOrd} storeConfig={cfg} onClose={()=>setPrintOrd(null)} />
      <Modal isOpen={moCus} onClose={()=>setMoCus(false)} title="Thêm Khách Hàng Mới">
        <form onSubmit={saveCus} className="space-y-3">
          <input required placeholder="Tên khách hàng *" onChange={e=>setFc({...fc,n:e.target.value})} className="w-full p-2 border rounded outline-none"/>
          <input placeholder="Số điện thoại" onChange={e=>setFc({...fc,p:e.target.value})} className="w-full p-2 border rounded outline-none"/>
          <button className="w-full bg-blue-600 text-white py-2 rounded font-bold">Lưu lại</button>
        </form>
      </Modal>
    </div>
  );
}

// 3. SALES HISTORY (SỬA ĐƠN & IN)
function SalesHistoryView({ d, db, stId, cfg, t }) {
  const [search, setSearch] = useState(''); const [printOrd, setPrintOrd] = useState(null);
  const [editOrd, setEditOrd] = useState(null);
  const ords = d.orders.filter(o=>o.id.includes(search.toUpperCase())||o.customerName?.toLowerCase().includes(search.toLowerCase())).sort((a,b)=>new Date(b.date)-new Date(a.date));
  
  const handleDel = async (o) => {
    if(!window.confirm("Hủy đơn này và hoàn kho?")) return;
    const batch = writeBatch(db);
    o.items.forEach(i=>{ const p=d.products.find(x=>x.id===i.id); if(p) batch.update(doc(db, 'stores', stId, 'products', p.id), {stock:(p.stock||0)+i.quantity}); });
    batch.delete(doc(db, 'stores', stId, 'orders', o.id)); await batch.commit(); t("Đã hủy đơn");
  };

  const handleSaveEdit = async () => {
    if(!editOrd) return;
    const newTot = editOrd.items.reduce((s, i)=>s+(i.price*i.quantity), 0);
    await updateDoc(doc(db, 'stores', stId, 'orders', editOrd.id), { items: editOrd.items, total: newTot });
    setEditOrd(null); t("Đã cập nhật!");
  };

  return (
    <div className="flex-1 p-4 bg-gray-50 flex flex-col h-full overflow-hidden">
      <div className="flex justify-between mb-4"><h2 className="text-xl font-bold">Lịch sử Bán Hàng</h2><input placeholder="Tìm mã / khách..." value={search} onChange={e=>setSearch(e.target.value)} className="p-2 border rounded w-64 shadow-sm outline-none"/></div>
      <div className="flex-1 bg-white border rounded shadow-sm overflow-auto">
        <table className="w-full text-left"><thead className="bg-gray-100 sticky top-0"><tr><th className="p-3">Mã/Ngày</th><th className="p-3">Khách hàng</th><th className="p-3 w-1/3">Chi tiết (GC/BH)</th><th className="p-3">Tổng</th><th className="p-3 text-right">Thao tác</th></tr></thead><tbody>
          {ords.map(o=>(
            <tr key={o.id} className="border-b align-top hover:bg-gray-50">
              <td className="p-3"><b className="text-blue-600">#{o.id}</b><p className="text-xs text-gray-500">{formatDate(o.date)}</p></td><td className="p-3">{o.customerName}</td>
              <td className="p-3">{o.items.map((i, idx)=><div key={idx} className="mb-1 border-b border-dashed pb-1"><b className="text-sm">{i.name}</b> <span className="text-blue-600 text-xs">(x{i.quantity})</span> <span className="text-gray-500 text-xs">[{formatCurrency(i.price)}]</span>{i.note&&<div className="text-[10px] text-gray-500">GC: {i.note}</div>}{i.warrantyValue&&<div className="text-[10px] text-gray-500">BH: {i.warrantyValue} {i.warrantyUnit}</div>}</div>)}</td>
              <td className="p-3 font-bold">{formatCurrency(o.total)}</td>
              <td className="p-3 text-right">
                <div className="flex justify-end gap-1">
                  <button onClick={()=>setPrintOrd(o)} className="bg-blue-50 text-blue-600 p-2 rounded"><Printer size={16}/></button>
                  <button onClick={()=>setEditOrd(JSON.parse(JSON.stringify(o)))} className="bg-gray-100 text-gray-700 p-2 rounded"><Edit size={16}/></button>
                  <button onClick={()=>handleDel(o)} className="bg-red-50 text-red-600 p-2 rounded"><Trash2 size={16}/></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody></table>
      </div>
      <OrderPrintModal order={printOrd} storeConfig={cfg} onClose={()=>setPrintOrd(null)} />
      {editOrd && (
        <Modal isOpen={true} onClose={()=>setEditOrd(null)} title={`Sửa đơn #${editOrd.id}`} mw="max-w-xl">
          <div className="space-y-3">
            {editOrd.items.map(i => (
              <div key={i.id} className="border p-3 rounded bg-gray-50">
                <p className="font-bold mb-2">{i.name}</p>
                <div className="flex gap-2 mb-2">
                  <div className="flex-1"><label className="text-xs text-gray-500">Giá mới</label><input type="number" value={i.price} onChange={e=>setEditOrd({...editOrd, items: editOrd.items.map(x=>x.id===i.id?{...x, price:Number(e.target.value)}:x)})} className="w-full p-2 border rounded outline-none"/></div>
                  <div className="w-24"><label className="text-xs text-gray-500">Số lượng</label><input type="number" value={i.quantity} onChange={e=>setEditOrd({...editOrd, items: editOrd.items.map(x=>x.id===i.id?{...x, quantity:Number(e.target.value)}:x)})} className="w-full p-2 border rounded text-center outline-none"/></div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1"><input placeholder="Ghi chú" value={i.note||''} onChange={e=>setEditOrd({...editOrd, items: editOrd.items.map(x=>x.id===i.id?{...x, note:e.target.value}:x)})} className="w-full p-1.5 border rounded text-xs outline-none"/></div>
                  <div className="w-16"><input placeholder="BH" value={i.warrantyValue||''} onChange={e=>setEditOrd({...editOrd, items: editOrd.items.map(x=>x.id===i.id?{...x, warrantyValue:e.target.value}:x)})} className="w-full p-1.5 border rounded text-xs text-center outline-none"/></div>
                  <div className="w-20"><select value={i.warrantyUnit||'tháng'} onChange={e=>setEditOrd({...editOrd, items: editOrd.items.map(x=>x.id===i.id?{...x, warrantyUnit:e.target.value}:x)})} className="w-full p-1.5 border rounded text-xs bg-white outline-none"><option value="ngày">Ngày</option><option value="tuần">Tuần</option><option value="tháng">Tháng</option><option value="năm">Năm</option></select></div>
                </div>
              </div>
            ))}
            <div className="text-right font-bold text-lg text-blue-600 py-2 border-t">Tổng mới: {formatCurrency(editOrd.items.reduce((s,i)=>s+(i.price*i.quantity),0))}</div>
            <button onClick={handleSaveEdit} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg flex justify-center gap-2 items-center"><Save size={18}/> Lưu Thay Đổi</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// 4. CÁC COMPONENT KHÁC
function ImportView({ d, db, stId, u, t }) {
  const [c, setC] = useState([]); const [s, setS] = useState(''); const [sup, setSup] = useState(null);
  const upC = (id, f, v) => setC(pr=>pr.map(i=>i.id===id?{...i,[f]:Number(v)}:i));
  const tot = c.reduce((sum, i) => sum+(i.ic*i.q), 0);
  const handleImp = async(status) => {
    if(c.length===0) return; const iId = Math.random().toString(36).substring(2,8).toUpperCase(); const batch = writeBatch(db);
    c.forEach(i=>batch.update(doc(db,'stores',stId,'products',i.id), {stock:(i.stock||0)+i.q, cost:i.ic}));
    batch.set(doc(collection(db,'stores',stId,'imports'),iId), {id:iId, date:new Date().toISOString(), items:c, total:tot, status, supplierId:sup?.id||null, supplierName:sup?.name||'Lẻ', userId:u.uid});
    if(status==='DEBT'&&sup) batch.update(doc(db,'stores',stId,'suppliers',sup.id), {totalDebt:(sup.totalDebt||0)+tot});
    await batch.commit(); t("Đã nhập hàng"); setC([]); setSup(null);
  };
  return (
    <div className="flex h-full bg-gray-50">
      <div className="flex-1 p-4 border-r overflow-auto"><input placeholder="Tìm..." value={s} onChange={e=>setS(e.target.value)} className="w-full p-2 mb-3 border rounded outline-none"/><div className="grid grid-cols-3 gap-3">{d.products.filter(p=>p.name?.toLowerCase().includes(s.toLowerCase())).map(p=><div key={p.id} onClick={()=>setC(pr=>pr.find(x=>x.id===p.id)?pr.map(x=>x.id===p.id?{...x,q:x.q+1}:x):[...pr,{...p,q:1,ic:p.cost||0}])} className="bg-white p-3 border rounded cursor-pointer hover:border-purple-500"><b>{p.name}</b><br/><span className="text-purple-600 text-xs">{formatCurrency(p.cost)}</span></div>)}</div></div>
      <div className="w-[350px] bg-white flex flex-col"><div className="p-3 border-b"><select value={sup?.id||''} onChange={e=>setSup(d.suppliers.find(x=>x.id===e.target.value)||null)} className="w-full p-2 border rounded bg-white outline-none"><option value="">-- NCC Lẻ --</option>{d.suppliers.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></div><div className="flex-1 p-3 overflow-auto">{c.map(i=><div key={i.id} className="bg-purple-50 p-2 mb-2 rounded border flex flex-col gap-1"><div className="flex justify-between"><b>{i.name}</b><button onClick={()=>setC(pr=>pr.filter(x=>x.id!==i.id))} className="text-red-500 text-xs">Xóa</button></div><div className="flex gap-2"><input type="number" value={i.ic} onChange={e=>upC(i.id,'ic',e.target.value)} className="w-full p-1 border rounded text-xs outline-none"/><input type="number" value={i.q} onChange={e=>upC(i.id,'q',e.target.value)} className="w-16 p-1 border rounded text-xs text-center outline-none"/></div></div>)}</div><div className="p-3 border-t"><b className="text-purple-600 text-lg block mb-2">{formatCurrency(tot)}</b><div className="flex gap-2"><button onClick={()=>handleImp('DEBT')} className="flex-1 bg-orange-100 text-orange-700 py-2 rounded font-bold">Nợ</button><button onClick={()=>handleImp('PAID')} className="flex-1 bg-purple-600 text-white py-2 rounded font-bold">Đã Trả</button></div></div></div>
    </div>
  );
}

function InventoryView({ d, db, stId, t }) {
  const [s, setS] = useState(''); const [mo, setMo] = useState(false); const [f, setF] = useState({});
  const save = async(e) => { e.preventDefault(); const p = {name:f.name, category:f.category||'', price:Number(f.price), cost:Number(f.cost||0), stock:Number(f.stock)}; if(f.id) await updateDoc(doc(db,'stores',stId,'products',f.id), p); else await addDoc(collection(db,'stores',stId,'products'), p); setMo(false); t("Đã lưu"); };
  const del = async(id) => { if(window.confirm("Xóa?")) { await deleteDoc(doc(db,'stores',stId,'products',id)); t("Đã xóa"); } };
  return (
    <div className="p-4 bg-gray-50 flex-1 h-full flex flex-col"><div className="flex justify-between mb-4"><h2 className="text-xl font-bold">Kho Hàng</h2><div className="flex gap-2"><input placeholder="Tìm..." value={s} onChange={e=>setS(e.target.value)} className="p-2 border rounded outline-none"/><button onClick={()=>{setF({});setMo(true);}} className="bg-blue-600 text-white px-4 rounded font-bold">+ Thêm</button></div></div><div className="bg-white border rounded overflow-auto flex-1"><table className="w-full text-left text-sm"><thead className="bg-gray-100 border-b"><tr><th className="p-3">Tên</th><th className="p-3">Giá Vốn</th><th className="p-3">Giá Bán</th><th className="p-3">Tồn</th><th className="p-3 text-right">Hành động</th></tr></thead><tbody>{d.products.filter(x=>x.name?.toLowerCase().includes(s.toLowerCase())).map(p=><tr key={p.id} className="border-b"><td className="p-3 font-bold">{p.name}</td><td className="p-3">{formatCurrency(p.cost)}</td><td className="p-3 font-bold text-blue-600">{formatCurrency(p.price)}</td><td className="p-3">{p.stock}</td><td className="p-3 text-right"><button onClick={()=>{setF(p);setMo(true);}} className="text-blue-600 mr-3">Sửa</button><button onClick={()=>del(p.id)} className="text-red-600">Xóa</button></td></tr>)}</tbody></table></div><Modal isOpen={mo} onClose={()=>setMo(false)} title="Hàng hóa"><form onSubmit={save} className="space-y-3"><input required placeholder="Tên" value={f.name||''} onChange={e=>setF({...f,name:e.target.value})} className="w-full p-2 border rounded outline-none"/><input placeholder="Nhóm hàng" value={f.category||''} onChange={e=>setF({...f,category:e.target.value})} className="w-full p-2 border rounded outline-none"/><input required type="number" placeholder="Giá vốn" value={f.cost||''} onChange={e=>setF({...f,cost:e.target.value})} className="w-full p-2 border rounded outline-none"/><input required type="number" placeholder="Giá bán" value={f.price||''} onChange={e=>setF({...f,price:e.target.value})} className="w-full p-2 border rounded outline-none"/><input required type="number" placeholder="Tồn kho" value={f.stock||''} onChange={e=>setF({...f,stock:e.target.value})} className="w-full p-2 border rounded outline-none"/><button className="w-full bg-blue-600 text-white py-2 rounded font-bold">Lưu</button></form></Modal></div>
  );
}

function ContactManager({ type, d, db, stId, t }) {
  const [s, setS] = useState(''); const [mo, setMo] = useState(false); const [f, setF] = useState({});
  const save = async(e) => { e.preventDefault(); const p = {name:f.name, phone:f.phone||'', totalDebt:Number(f.totalDebt||0)}; if(f.id) await updateDoc(doc(db,'stores',stId,type,f.id), p); else await addDoc(collection(db,'stores',stId,type), p); setMo(false); t("Đã lưu"); };
  const del = async(id) => { if(window.confirm("Xóa?")) { await deleteDoc(doc(db,'stores',stId,type,id)); t("Đã xóa"); } };
  return (
    <div className="p-4 bg-gray-50 flex-1 h-full flex flex-col"><div className="flex justify-between mb-4"><h2 className="text-xl font-bold">QL Liên hệ</h2><div className="flex gap-2"><input placeholder="Tìm..." value={s} onChange={e=>setS(e.target.value)} className="p-2 border rounded outline-none"/><button onClick={()=>{setF({});setMo(true);}} className="bg-blue-600 text-white px-4 rounded font-bold">+ Thêm</button></div></div><div className="bg-white border rounded overflow-auto flex-1"><table className="w-full text-left text-sm"><thead className="bg-gray-100 border-b"><tr><th className="p-3">Tên</th><th className="p-3">SĐT</th><th className="p-3">Nợ</th><th className="p-3 text-right">Hành động</th></tr></thead><tbody>{d.filter(x=>x.name?.toLowerCase().includes(s.toLowerCase())).map(c=><tr key={c.id} className="border-b"><td className="p-3 font-bold">{c.name}</td><td className="p-3">{c.phone}</td><td className="p-3 font-bold text-red-600">{formatCurrency(c.totalDebt)}</td><td className="p-3 text-right"><button onClick={()=>{setF(c);setMo(true);}} className="text-blue-600 mr-3">Sửa</button><button onClick={()=>del(c.id)} className="text-red-600">Xóa</button></td></tr>)}</tbody></table></div><Modal isOpen={mo} onClose={()=>setMo(false)} title="Liên hệ"><form onSubmit={save} className="space-y-3"><input required placeholder="Tên" value={f.name||''} onChange={e=>setF({...f,name:e.target.value})} className="w-full p-2 border rounded outline-none"/><input placeholder="SĐT" value={f.phone||''} onChange={e=>setF({...f,phone:e.target.value})} className="w-full p-2 border rounded outline-none"/><input type="number" placeholder="Nợ ban đầu" value={f.totalDebt||0} onChange={e=>setF({...f,totalDebt:e.target.value})} className="w-full p-2 border rounded outline-none"/><button className="w-full bg-blue-600 text-white py-2 rounded font-bold">Lưu</button></form></Modal></div>
  );
}

function ExpenseView({ d, db, stId, t }) {
  const [f, setF] = useState({a:'',n:''});
  const save = async(e) => { e.preventDefault(); await addDoc(collection(db,'stores',stId,'expenses'), {amount:Number(f.a), note:f.n, date:new Date().toISOString()}); setF({a:'',n:''}); t("Đã thêm"); };
  const del = async(id) => { if(window.confirm("Xóa?")) { await deleteDoc(doc(db,'stores',stId,'expenses',id)); t("Đã xóa"); } };
  return (
    <div className="p-4 bg-gray-50 flex-1 h-full flex flex-col"><h2 className="text-xl font-bold mb-4">Chi phí</h2><form onSubmit={save} className="bg-white p-3 rounded border mb-4 flex gap-2"><input required type="number" placeholder="Số tiền" value={f.a} onChange={e=>setF({...f,a:e.target.value})} className="p-2 border rounded outline-none"/><input required placeholder="Nội dung" value={f.n} onChange={e=>setF({...f,n:e.target.value})} className="p-2 border rounded flex-1 outline-none"/><button className="bg-orange-600 text-white px-6 rounded font-bold">Thêm</button></form><div className="bg-white border rounded overflow-auto flex-1"><table className="w-full text-left text-sm"><thead className="bg-gray-100 border-b"><tr><th className="p-3">Ngày</th><th className="p-3">Nội dung</th><th className="p-3">Tiền</th><th className="p-3 text-right">Xóa</th></tr></thead><tbody>{d.sort((a,b)=>new Date(b.date)-new Date(a.date)).map(e=><tr key={e.id} className="border-b"><td className="p-3">{formatDate(e.date)}</td><td className="p-3 font-bold">{e.note}</td><td className="p-3 text-orange-600 font-bold">{formatCurrency(e.amount)}</td><td className="p-3 text-right"><button onClick={()=>del(e.id)} className="text-red-600"><Trash2 size={16}/></button></td></tr>)}</tbody></table></div></div>
  );
}

function SettingsView({ cfg, db, stId, t }) {
  const [f, setF] = useState(cfg);
  const save = async(e) => { e.preventDefault(); await setDoc(doc(db,'stores',stId), f, {merge:true}); t("Đã lưu cài đặt"); };
  return (
    <div className="p-4 bg-gray-50 flex-1 overflow-auto"><h2 className="text-xl font-bold mb-4">Cài đặt</h2><form onSubmit={save} className="bg-white p-6 rounded border max-w-lg space-y-4"><div><input placeholder="Tên CH" value={f.name||''} onChange={e=>setF({...f,name:e.target.value})} className="w-full p-2 border rounded mb-2 outline-none"/><input placeholder="ĐC" value={f.address||''} onChange={e=>setF({...f,address:e.target.value})} className="w-full p-2 border rounded mb-2 outline-none"/><input placeholder="SĐT" value={f.phone||''} onChange={e=>setF({...f,phone:e.target.value})} className="w-full p-2 border rounded mb-2 outline-none"/><input placeholder="Logo URL" value={f.logo||''} onChange={e=>setF({...f,logo:e.target.value})} className="w-full p-2 border rounded mb-2 outline-none"/><select value={f.printDefaultSize||'a4'} onChange={e=>setF({...f,printDefaultSize:e.target.value})} className="w-full p-2 border rounded mb-2 bg-white outline-none"><option value="a4">Giấy A4</option><option value="bill">Máy Bill K80</option></select><input placeholder="Lời cảm ơn" value={f.printFooterText||''} onChange={e=>setF({...f,printFooterText:e.target.value})} className="w-full p-2 border rounded outline-none"/></div><button className="bg-blue-600 text-white w-full py-2 rounded font-bold">Lưu Cấu Hình</button></form></div>
  );
}

// 5. SỬA ĐỔI NHÂN VIÊN & PHÂN QUYỀN
function StaffManagerView({ d, db, auth, t }) {
  const [f, setF] = useState({id:'', u:'',p:'',e:'',r:'staff',n:''});
  const [perms, setPerms] = useState({});
  const [mo, setMo] = useState(false);
  
  const permList = [
    {id:'tong_quan_xem', l:'Báo cáo'}, {id:'ban_hang', l:'QL Bán Hàng'},
    {id:'mua_nhap_hang', l:'Nhập hàng'}, {id:'hh_danh_sach', l:'Kho hàng'},
    {id:'kh_danh_sach', l:'Khách hàng'}, {id:'mua_ncc', l:'Nhà cung cấp'},
    {id:'quy_so_quy', l:'Chi phí'}
  ];

  const save = async(e) => {
    e.preventDefault(); 
    try {
      if(f.id) {
        await updateDoc(doc(db,'users_db',f.id), {name:f.n, role:f.r, permissions: f.r==='admin'?{}:perms});
        t("Đã cập nhật Nhân viên!"); setMo(false);
      } else {
        const { getApp, initializeApp } = await import('firebase/app'); const { getAuth, createUserWithEmailAndPassword } = await import('firebase/auth');
        let sApp; try { sApp = initializeApp(getApp().options, "SA"); } catch { sApp = getApp("SA"); }
        const cr = await createUserWithEmailAndPassword(getAuth(sApp), f.e, f.p);
        await setDoc(doc(db,'users_db',cr.user.uid), {username:f.u, email:f.e, name:f.n, role:f.r, permissions: f.r==='admin'?{}:perms});
        await getAuth(sApp).signOut(); setMo(false); t("Đã thêm NV");
      }
    } catch(err) { t("Lỗi tạo/sửa NV", "error"); }
  };

  const resetPw = async () => {
    if(!f.e) return;
    try { await sendPasswordResetEmail(auth, f.e); t("Đã gửi link Reset MK vào Email!"); } 
    catch(e) { t("Lỗi gửi link", "error"); }
  };

  return (
    <div className="p-4 bg-gray-50 flex-1"><div className="flex justify-between mb-4"><h2 className="text-xl font-bold">Nhân viên</h2><button onClick={()=>{setF({id:'', u:'',p:'',e:'',r:'staff',n:''}); setPerms({}); setMo(true);}} className="bg-blue-600 text-white px-4 py-2 rounded font-bold">+ Thêm NV</button></div><div className="bg-white border rounded overflow-auto"><table className="w-full text-left text-sm"><thead className="bg-gray-100 border-b"><tr><th className="p-3">Tên</th><th className="p-3">User/Email</th><th className="p-3">Quyền</th><th className="p-3 text-right">Thao tác</th></tr></thead><tbody>{d.map(s=><tr key={s.id} className="border-b"><td className="p-3 font-bold">{s.name}</td><td className="p-3 text-blue-600">{s.email||s.username}</td><td className="p-3">{s.role}</td><td className="p-3 text-right flex justify-end gap-2">{s.role!=='admin'&&<button onClick={()=>{setF({id:s.id, u:s.username||'', e:s.email||'', r:s.role, n:s.name}); setPerms(s.permissions||{}); setMo(true);}} className="text-blue-600 bg-blue-50 p-2 rounded"><Edit size={16}/></button>}{s.role!=='admin'&&<button onClick={()=>deleteDoc(doc(db,'users_db',s.id))} className="text-red-600 bg-red-50 p-2 rounded"><Trash2 size={16}/></button>}</td></tr>)}</tbody></table></div>
    <Modal isOpen={mo} onClose={()=>setMo(false)} title={f.id ? "Sửa Nhân Viên" : "Thêm Nhân Viên"}>
      <form onSubmit={save} className="space-y-3">
        <input required placeholder="Tên" value={f.n} onChange={e=>setF({...f,n:e.target.value})} className="w-full p-2 border rounded outline-none"/>
        <input required disabled={!!f.id} placeholder="User" value={f.u} onChange={e=>setF({...f,u:e.target.value})} className={`w-full p-2 border rounded outline-none ${f.id?'bg-gray-100 text-gray-500':''}`}/>
        <input required disabled={!!f.id} type="email" placeholder="Email" value={f.e} onChange={e=>setF({...f,e:e.target.value})} className={`w-full p-2 border rounded outline-none ${f.id?'bg-gray-100 text-gray-500':''}`}/>
        {!f.id && <input required type="password" placeholder="Pass (từ 6 ký tự)" onChange={e=>setF({...f,p:e.target.value})} className="w-full p-2 border rounded outline-none"/>}
        <select value={f.r} onChange={e=>setF({...f,r:e.target.value})} className="w-full p-2 border rounded bg-white outline-none"><option value="staff">Nhân viên</option><option value="admin">Quản trị viên</option></select>
        {f.r === 'staff' && (
          <div className="border p-3 rounded bg-gray-50"><p className="font-bold text-xs mb-2 text-blue-800">Cấp quyền Tab cho Nhân viên này:</p><div className="grid grid-cols-2 gap-2 text-xs">{permList.map(p=><label key={p.id} className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={perms[p.id]||false} onChange={e=>setPerms({...perms, [p.id]: e.target.checked})}/> {p.l}</label>)}</div></div>
        )}
        <div className="flex gap-2 pt-2">
          {f.id && <button type="button" onClick={resetPw} className="flex-1 bg-orange-100 text-orange-700 py-2 rounded font-bold">Gửi Email Reset MK</button>}
          <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded font-bold">Lưu lại</button>
        </div>
      </form>
    </Modal>
    </div>
  );
}
