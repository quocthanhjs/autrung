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

  // Cỡ chữ độc lập cho từng dòng ở phần đầu trang
  const fsStoreName = `${baseFontSize + (cfg.fsStoreNameOffset ?? 2)}px`;
  const fsStoreAddress = `${baseFontSize + (cfg.fsStoreAddressOffset ?? 0)}px`;
  const fsStorePhone = `${baseFontSize + (cfg.fsStorePhoneOffset ?? 0)}px`;
  const fsInvoiceTitle = `${baseFontSize + (cfg.fsInvoiceTitleOffset ?? 4)}px`;
  const fsMeta = `${baseFontSize + (cfg.fsMetaOffset ?? 0)}px`;

  return (
    <>
      <div className="border-b border-dashed border-gray-400 pb-3 mb-3">
        {/* Khối riêng cho Logo nằm bên trái đối với A4, A5 (hoặc theo cấu hình), Bill K80 giữ nguyên căn giữa */}
        {cfg.printShowLogo && storeConfig.logo && (
          <div className={isA4A5 ? "flex justify-start mb-2" : "flex flex-col items-center text-center mb-2"}>
            <img src={storeConfig.logo} alt="Logo" className="max-h-16 object-contain" />
          </div>
        )}

        {/* Khối thông tin Tên, Địa chỉ, SĐT căn giữa thẳng hàng */}
        <div className="flex flex-col items-center text-center">
          {cfg.printShowStoreName && (
            <h2 className="font-bold uppercase" style={{fontSize: fsStoreName}}>
              {storeConfig.name || 'SmartPOS Pro'}
            </h2>
          )}
          {cfg.printShowStoreAddress && <p className="mt-0.5" style={{fontSize: fsStoreAddress}}>ĐC: {storeConfig.address}</p>}
          {cfg.printShowStorePhone && <p style={{fontSize: fsStorePhone}}>SĐT: {storeConfig.phone}</p>}
        </div>

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
}
