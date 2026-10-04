"use client"

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, ShoppingCart, CreditCard, Plus, Minus, Trash2, X, Receipt, QrCode, Banknote, Clock, PauseCircle, ListChecks, PenSquare, History, CheckCircle, Search, UserCheck } from "lucide-react";
import { fetchOpenOrders, fetchNextOrderNumber, deleteOpenOrder, fetchCompletedOrders, generateQris, checkOrderStatus, updateOrderCustomerName } from "./actions";

import { QRCodeCanvas } from "qrcode.react";
import html2canvas from "html2canvas";
import TerminalQrModal from "@/components/TerminalQrModal";

export default function PosTerminal({ branchName, initialProducts }: { branchName: string, initialProducts: any[] }) {
  const [cart, setCart] = useState<{product: any, qty: number, note?: string}[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  
  // Active Open Tab State
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [activeOrderNumber, setActiveOrderNumber] = useState<string | null>(null);
  const [activeCustomerName, setActiveCustomerName] = useState<string>("");
  const [draftOrderNumber, setDraftOrderNumber] = useState<string>("...");

  // Modals
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [showOpenTabsModal, setShowOpenTabsModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successOrderData, setSuccessOrderData] = useState<any | null>(null);
  const [showQrisModal, setShowQrisModal] = useState(false);
  const [qrisString, setQrisString] = useState<string>("");
  const [qrisPollingOrderId, setQrisPollingOrderId] = useState<string | null>(null);
  const [qrisStatus, setQrisStatus] = useState<"PENDING" | "PAID">("PENDING");
  
  // Checkout/Hold State
  const [orderType, setOrderType] = useState<"DINE_IN" | "TAKE_AWAY">("DINE_IN");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "QRIS">("CASH");
  const [amountTendered, setAmountTendered] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Open Tabs & History State
  const [openTabs, setOpenTabs] = useState<any[]>([]);
  const [expandedTabId, setExpandedTabId] = useState<string | null>(null);
  const [completedOrders, setCompletedOrders] = useState<any[]>([]);
  
  // Receipt Image Capture State
  const [receiptToRender, setReceiptToRender] = useState<any | null>(null);
  const [captureAction, setCaptureAction] = useState<"WA" | "PRINT" | null>(null);
  const [isGeneratingReceipt, setIsGeneratingReceipt] = useState(false);

  // Quick Attendance & Cashier Switch State
  const [terminalModalAction, setTerminalModalAction] = useState<"ATTENDANCE" | "SWITCH_CASHIER" | null>(null);
  const [activeCashierName, setActiveCashierName] = useState<string | null>(null);
  const [attendanceToast, setAttendanceToast] = useState<{ message: string, time: string } | null>(null);

  const params = useParams();
  const branchId = params.id as string;

  const total = cart.reduce((sum, item) => sum + (item.product.price * item.qty), 0);
  const changeDue = (parseInt(amountTendered) || 0) - total;

  const categories = ["All", ...Array.from(new Set(initialProducts.map(p => p.category)))];

  const filteredProducts = initialProducts.filter(p => {
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const loadNextNumber = async () => {
    const nextNum = await fetchNextOrderNumber(branchId);
    setDraftOrderNumber(nextNum);
  };

  useEffect(() => {
    loadNextNumber();
  }, []);

  // Poll Midtrans Payment Status
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showQrisModal && qrisPollingOrderId && qrisStatus === "PENDING") {
      interval = setInterval(async () => {
        const status = await checkOrderStatus(qrisPollingOrderId);
        if (status === "PAID") {
          setQrisStatus("PAID");
          clearInterval(interval);
          setTimeout(() => {
            setShowQrisModal(false);
            setQrisPollingOrderId(null);
            
            const finalOrderObj = {
              orderNumber: activeOrderNumber || "QRIS",
              createdAt: new Date().toISOString(),
              total,
              orderType,
              status: "PAID",
              paymentMethod: "QRIS",
              amountTendered: total,
              changeDue: 0,
              items: cart.map(c => ({
                productName: c.product.name,
                quantity: c.qty,
                price: c.product.price,
                note: c.note
              }))
            };
            setSuccessOrderData(finalOrderObj);
            setShowSuccessModal(true);
          }, 3000);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [showQrisModal, qrisPollingOrderId, qrisStatus, cart, total, orderType, activeOrderNumber]);

  const addToCart = (product: any) => {
    // Instantly apply the preloaded sequential draft number if starting a new cart
    if (cart.length === 0 && !activeOrderNumber) {
      setActiveOrderNumber(draftOrderNumber);
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const updateQty = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        return { ...item, qty: item.qty + delta };
      }
      return item;
    }).filter(item => item.qty > 0));
  };

  const updateNote = (productId: number) => {
    const item = cart.find(i => i.product.id === productId);
    if (!item) return;
    const note = window.prompt(`Enter special request for ${item.product.name}:`, item.note || "");
    if (note !== null) {
      setCart(prev => prev.map(i => i.product.id === productId ? { ...i, note } : i));
    }
  };

  const clearCart = () => {
    setCart([]);
    setActiveOrderId(null);
    setActiveOrderNumber(null);
    setActiveCustomerName("");
    loadNextNumber(); // Refresh for the next customer
  };


  const handleDeleteTab = async (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the row from clicking and resuming the tab
    if (!confirm("Are you sure you want to delete this held order?")) return;
    
    setIsProcessing(true);
    const result = await deleteOpenOrder(orderId);
    setIsProcessing(false);
    
    if (result.success) {
      loadOpenTabs(); // refresh the list
    } else {
      alert("Failed to delete: " + result.error);
    }
  };

  const handleRenameTab = async (orderId: string, newName: string) => {
    setOpenTabs(prev => prev.map(tab => tab.id === orderId ? { ...tab, customerName: newName } : tab));
    await updateOrderCustomerName(orderId, newName);
  };

  const loadOpenTabs = async () => {
    const tabs = await fetchOpenOrders(branchId);
    setOpenTabs(tabs);
    setShowOpenTabsModal(true);
  };

  const loadHistory = async () => {
    const history = await fetchCompletedOrders(branchId);
    setCompletedOrders(history);
    setShowHistoryModal(true);
  };

  const triggerReceiptCapture = async (order: any, action: "WA" | "PRINT") => {
    if (action === "WA") {
      setIsGeneratingReceipt(true);
      try {
        // Build the receipt DOM element synchronously in memory so we don't lose the User Gesture
        const container = document.createElement("div");
        container.style.position = "absolute";
        container.style.left = "-9999px";
        container.style.top = "-9999px";
        container.style.width = "380px";
        container.style.backgroundColor = "white";
        container.style.padding = "32px";
        container.style.fontFamily = "monospace";
        container.style.color = "black";
        
        let itemsHtml = order.items.map((i: any) => `
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; margin-bottom: 4px;">
            <span>${i.quantity}x ${i.productName}</span>
            <span>${(i.quantity * i.price).toLocaleString('id-ID')}</span>
          </div>
          ${i.note ? `<div style="font-size: 12px; color: #64748b; font-style: italic; margin-left: 16px;">* ${i.note}</div>` : ''}
        `).join("");

        container.innerHTML = `
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="font-weight: 900; font-size: 24px; margin: 0 0 4px 0;">SAMBEL NGOWEH</h1>
            <div style="border-bottom: 2px dashed #cbd5e1; padding-bottom: 16px; margin-top: 16px;">
              <div style="font-size: 14px; font-weight: bold;">RECEIPT: ${order.orderNumber}</div>
              <div style="font-size: 12px; color: #64748b;">${new Date(order.createdAt).toLocaleString('id-ID')}</div>
            </div>
          </div>
          <div style="margin-bottom: 24px;">${itemsHtml}</div>
          <div style="border-top: 2px dashed #cbd5e1; padding-top: 16px; font-size: 14px; font-weight: bold;">
            <div style="display: flex; justify-content: space-between; font-size: 20px; font-weight: 900; margin-top: 8px; margin-bottom: 12px;">
              <span>TOTAL</span><span>Rp ${order.total.toLocaleString('id-ID')}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 12px; color: #64748b; margin-top: 4px;">
              <span>Method</span><span>${order.paymentMethod || "CASH"}</span>
            </div>
            ${order.paymentMethod === "QRIS" ? `
            <div style="display: flex; justify-content: space-between; font-size: 12px; color: #64748b; margin-top: 4px;">
              <span>Provider</span><span>${order.issuer || "MOCK / SANDBOX"}</span>
            </div>` : ''}
          </div>
        `;
        
        document.body.appendChild(container);
        
        const html2canvas = (await import("html2canvas")).default;
        const canvas = await html2canvas(container, { scale: 2, backgroundColor: "#ffffff", logging: false });
        document.body.removeChild(container);
        
        canvas.toBlob(async (blob) => {
          if (!blob) throw new Error("Blob failed");
          const file = new File([blob], `Struk-${order.orderNumber}.png`, { type: 'image/png' });
          
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: `Struk ${order.orderNumber}`,
              files: [file]
            });
          } else {
            // Fallback for desktop Chrome if Share API fails
            const link = document.createElement("a");
            link.download = `Struk-${order.orderNumber}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
            alert("Your PC doesn't support the Native Share API. The image has been downloaded. Drag it into WhatsApp!");
          }
        }, "image/png");
        
      } catch (err) {
        console.error("Share error:", err);
        alert("Failed to capture receipt. Browser security blocked the action.");
      } finally {
        setIsGeneratingReceipt(false);
      }
    } 
    
    else if (action === "PRINT") {
      const printWindow = window.open('', '_blank', 'width=400,height=600');
      if (!printWindow) return alert("Please allow popups to print.");
      
      // Native HTML Thermal Print Layout
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Receipt ${order.orderNumber}</title>
            <style>
              @page {
                margin: 0;
              }
              body { 
                font-family: 'Courier New', Courier, monospace; 
                margin: 0 auto; 
                padding: 5mm; 
                color: black; 
                font-size: 12px;
                width: 100%;
                max-width: 58mm;
                box-sizing: border-box;
              }
              .center { text-align: center; }
              .bold { font-weight: bold; }
              .dashed { border-top: 1px dashed black; margin: 8px 0; }
              .row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px; }
              .item-name { flex: 1; padding-right: 8px; word-break: break-word; text-align: left; }
              .item-price { white-space: nowrap; text-align: right; }
              
              @media print {
                body {
                  padding: 2mm;
                }
              }
            </style>
          </head>
          <body>
            <div class="center bold" style="font-size: 1.2em; margin-bottom: 2px;">SAMBEL NGOWEH</div>
            <div class="center" style="font-size: 0.9em; margin-bottom: 10px;">Original Branch</div>
            
            <div class="row"><span>Order:</span><span class="bold">${order.orderNumber}</span></div>
            <div class="row"><span>Type:</span><span>${order.orderType.replace("_", " ")}</span></div>
            <div class="row"><span>Date:</span><span>${new Date(order.createdAt).toLocaleDateString('id-ID')}</span></div>
            <div class="row"><span>Time:</span><span>${new Date(order.createdAt).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}</span></div>
            
            <div class="dashed"></div>
            
            ${order.items.map((item: any) => `
              <div class="row bold">
                <span class="item-name">${item.quantity}x ${item.productName}</span>
                <span class="item-price">${(item.quantity * item.price).toLocaleString('id-ID')}</span>
              </div>
              ${item.note ? `<div style="font-size: 0.8em; margin-left: 15px; margin-bottom: 3px;">* ${item.note}</div>` : ''}
            `).join('')}
            
            <div class="dashed"></div>
            
            <div class="row bold" style="font-size: 1.1em; margin-top: 5px;"><span>TOTAL</span><span>Rp ${order.total.toLocaleString('id-ID')}</span></div>
            <div class="row" style="margin-top: 3px;"><span>Status</span><span>${order.status}</span></div>
            <div class="row"><span>Payment</span><span>${order.paymentMethod || "CASH"}</span></div>
            ${order.paymentMethod === "QRIS" ? `<div class="row"><span>Provider</span><span>${order.issuer || "MOCK / SANDBOX"}</span></div>` : ''}
            
            <div class="dashed" style="margin-top: 10px;"></div>
            <div class="center" style="margin-top: 10px; font-size: 0.9em;">TERIMA KASIH!</div>
            <div class="center" style="margin-top: 2px; font-size: 0.8em;">Powered by Resto OS</div>
            
            <script>
              window.onload = function() { 
                setTimeout(function() { 
                  window.print(); 
                  window.close(); 
                }, 250); 
              }
            </script>
          </body>
        </html>
      `;
      printWindow.document.write(html);
      printWindow.document.close();
    }
  };

  const resumeTab = (tab: any) => {
    // Reconstruct cart from saved items
    const restoredCart = tab.items.map((i: any) => {
      // Find the original product to get color, category etc
      const originalProduct = initialProducts.find(p => p.name === i.productName) || { id: Math.random(), name: i.productName, price: i.price };
      return { product: originalProduct, qty: i.quantity };
    });
    setCart(restoredCart);
    setActiveOrderId(tab.id);
    setActiveOrderNumber(tab.orderNumber);
    setActiveCustomerName(tab.customerName || "");
    setOrderType(tab.orderType as any);
    setShowOpenTabsModal(false);
  };

  const submitOrder = async (status: "OPEN" | "PAID") => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    
    const { processCheckout } = await import("./actions");

    const formattedCart = cart.map(c => ({
      name: c.product.name,
      qty: c.qty,
      price: c.product.price,
      note: c.note
    }));

    const details = {
      orderType,
      customerName: activeCustomerName,
      paymentMethod,
      amountTendered: paymentMethod === "CASH" ? (parseInt(amountTendered) || total) : total,
      changeDue: paymentMethod === "CASH" ? changeDue : 0,
      status, // OPEN or PAID
      orderNumber: activeOrderNumber || undefined
    };

    const result = await processCheckout(branchId, formattedCart, total, details, activeOrderId);
    
    if (result.success && result.orderId) {
      if (status === "PAID" && paymentMethod === "QRIS") {
        // Generate QRIS using Midtrans
        const qrisResult = await generateQris(result.orderId, total);
        if (qrisResult.success && qrisResult.qrString) {
          setQrisString(qrisResult.qrString);
          setQrisPollingOrderId(result.orderId);
          setActiveOrderId(result.orderId); // Bind the cart to this DB order!
          setQrisStatus("PENDING");
          setShowCheckoutModal(false);
          setShowQrisModal(true);
        } else {
          alert("Failed to generate QRIS: " + qrisResult.error);
        }
        setIsProcessing(false);
        return; // Don't clear cart yet, wait for payment
      } else {
        // Standard Cash or Hold Order
        setShowCheckoutModal(false);
        setShowHoldModal(false);
        setAmountTendered("");
        
        if (status === "PAID") {
          // Construct the order object for the receipt before clearing the cart
          const finalOrderObj = {
            orderNumber: result.orderNumber,
            createdAt: new Date().toISOString(),
            total,
            orderType,
            status: "PAID",
            paymentMethod,
            amountTendered: paymentMethod === "CASH" ? (parseInt(amountTendered) || total) : total,
            changeDue: paymentMethod === "CASH" ? changeDue : 0,
            items: cart.map(c => ({
              productName: c.product.name,
              quantity: c.qty,
              price: c.product.price,
              note: c.note
            }))
          };
          setSuccessOrderData(finalOrderObj);
          setShowSuccessModal(true);
        } else {
          // It's a Held Order
          clearCart();
          alert(`✅ Order Held (Queue: ${result.orderNumber})`);
        }
      }
    } else {
      alert("❌ Operation failed! " + (result.error || ""));
    }
    setIsProcessing(false);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-sans overflow-hidden relative">
      
      {/* Checkout Modal Overlay */}
      {showCheckoutModal && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-full">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">Finalize Payment</h2>
              <button onClick={() => setShowCheckoutModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500 dark:text-slate-400">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto space-y-8">
              {/* Payment Method */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Payment Method</label>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setPaymentMethod("CASH")} className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition-all ${paymentMethod === "CASH" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 dark:border-slate-800 hover:border-emerald-200 hover:bg-slate-50 dark:bg-slate-950 text-slate-600"}`}>
                    <Banknote className="w-6 h-6" />
                    <span className="font-bold text-lg">Cash</span>
                  </button>
                  <button onClick={() => setPaymentMethod("QRIS")} className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition-all ${paymentMethod === "QRIS" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 dark:border-slate-800 hover:border-blue-200 hover:bg-slate-50 dark:bg-slate-950 text-slate-600"}`}>
                    <QrCode className="w-6 h-6" />
                    <span className="font-bold text-lg">QRIS / E-Wallet</span>
                  </button>
                </div>
              </div>

              {/* Cash Tendered Logic */}
              {paymentMethod === "CASH" && (
                <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400 font-bold">Total Due:</span>
                    <span className="text-xl font-black text-slate-900 dark:text-white">Rp {total.toLocaleString('id-ID')}</span>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Cash Tendered</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-xl text-slate-400 dark:text-slate-500">Rp</span>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        value={amountTendered ? parseInt(amountTendered).toLocaleString('id-ID') : ""} 
                        onChange={e => {
                          const rawValue = e.target.value.replace(/\D/g, '');
                          setAmountTendered(rawValue);
                        }} 
                        placeholder={total.toLocaleString('id-ID')} 
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-12 pr-4 py-3 font-black text-xl text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:opacity-50" 
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-slate-500 dark:text-slate-400 font-bold">Change Due:</span>
                    <span className={`text-2xl font-black ${changeDue < 0 ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
                      Rp {changeDue > 0 ? changeDue.toLocaleString('id-ID') : '0'}
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
              <button 
                onClick={() => submitOrder("PAID")}
                disabled={isProcessing || (paymentMethod === "CASH" && changeDue < 0)}
                className="w-full bg-emerald-600 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:shadow-none disabled:text-slate-400 dark:disabled:text-slate-500 text-white py-5 rounded-xl font-black text-xl flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-[0.98]"
              >
                <Receipt className="w-6 h-6" />
                {isProcessing ? "PROCESSING..." : `CONFIRM ${paymentMethod} PAYMENT`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hold Order Modal */}
      {showHoldModal && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2"><Clock className="text-indigo-600" /> Hold Order (Open Tab)</h2>
              <button onClick={() => setShowHoldModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500 dark:text-slate-400">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Customer Name (Optional)</label>
                <input type="text" value={activeCustomerName} onChange={e => setActiveCustomerName(e.target.value)} placeholder="e.g. John Doe" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Order Type</label>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button onClick={() => setOrderType("DINE_IN")} className={`flex-1 py-2 font-bold text-sm rounded-lg transition-all ${orderType === "DINE_IN" ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300"}`}>Dine In</button>
                  <button onClick={() => setOrderType("TAKE_AWAY")} className={`flex-1 py-2 font-bold text-sm rounded-lg transition-all ${orderType === "TAKE_AWAY" ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300"}`}>Take Away</button>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex gap-4">
              <button onClick={() => setShowHoldModal(false)} className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 py-4 rounded-xl font-bold transition-all hover:bg-slate-100">Cancel</button>
              <button 
                onClick={() => submitOrder("OPEN")}
                disabled={isProcessing}
                className="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-md active:scale-95"
              >
                <PauseCircle className="w-5 h-5" /> Save Tab
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Open Tabs Modal */}
      {showOpenTabsModal && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-100 dark:bg-slate-950 rounded-3xl shadow-2xl w-full max-w-4xl h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2"><ListChecks className="text-indigo-600" /> Active Open Tabs</h2>
              <button onClick={() => setShowOpenTabsModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500 dark:text-slate-400">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-3">
              {openTabs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                  <Clock className="w-12 h-12 opacity-20 mb-3" />
                  <p className="font-bold text-lg">No open tabs found.</p>
                </div>
              ) : (
                openTabs.map(tab => (
                  <div key={tab.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col transition-all shrink-0">
                    <div 
                      onClick={() => setExpandedTabId(expandedTabId === tab.id ? null : tab.id)}
                      className="p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-6">
                        <span className="bg-indigo-100 text-indigo-700 font-black text-sm px-3 py-1.5 rounded-lg w-20 text-center">{tab.orderNumber}</span>
                        <div className="text-left flex flex-col justify-center">
                          <input 
                            type="text"
                            defaultValue={tab.customerName || ""}
                            placeholder="Guest"
                            onClick={(e) => e.stopPropagation()}
                            onBlur={(e) => {
                              const newName = e.target.value.trim();
                              if (newName !== (tab.customerName || "")) {
                                handleRenameTab(tab.id, newName);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') e.currentTarget.blur();
                            }}
                            className="font-extrabold text-slate-900 dark:text-white text-lg bg-transparent border-b-2 border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-0 px-1 -ml-1 w-48 transition-colors placeholder:text-slate-900 dark:placeholder:text-white placeholder:opacity-50 dark:placeholder:opacity-50"
                          />
                          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 px-1 -ml-1">{tab.items.length} items • <span className="uppercase text-xs font-bold text-slate-400 dark:text-slate-500">{tab.orderType.replace("_", " ")}</span></p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-black text-emerald-600 text-xl">Rp {tab.total.toLocaleString('id-ID')}</span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); resumeTab(tab); }}
                          className="bg-slate-100 dark:bg-slate-950 text-slate-600 font-bold px-4 py-2 rounded-xl hover:bg-indigo-600 hover:text-white transition-colors"
                        >
                          Resume →
                        </button>
                        <button 
                          onClick={(e) => handleDeleteTab(tab.id, e)}
                          className="p-3 text-slate-400 dark:text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all"
                          title="Delete Tab"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    
                    {expandedTabId === tab.id && (
                      <div className="bg-slate-50 dark:bg-slate-950 p-4 border-t border-slate-200 dark:border-slate-800 animate-in slide-in-from-top-2 fade-in duration-200">
                        <h4 className="font-bold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest mb-3">Order Items</h4>
                        <div className="space-y-2">
                          {tab.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center text-sm font-medium text-slate-700 dark:text-slate-300">
                              <span>{item.quantity}x {item.productName} {item.note && <span className="text-slate-400 italic">({item.note})</span>}</span>
                              <span className="font-bold">Rp {(item.quantity * item.price).toLocaleString('id-ID')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* QRIS Modal */}
      {showQrisModal && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col items-center p-10 text-center relative">
            <button onClick={() => { setShowQrisModal(false); setQrisPollingOrderId(null); }} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full text-slate-400 dark:text-slate-500">
              <X className="w-5 h-5" />
            </button>
            
            {qrisStatus === "PAID" ? (
              <div className="flex flex-col items-center animate-in zoom-in duration-300">
                <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle className="w-12 h-12" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Payment Success!</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium">The order has been completed.</p>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                  <QrCode className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Scan to Pay</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">Awaiting payment from customer...</p>
                
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border-2 border-slate-100 dark:border-slate-800 mb-6">
                  {qrisString ? <QRCodeCanvas value={qrisString} size={200} /> : <div className="w-[200px] h-[200px] bg-slate-100 animate-pulse rounded-lg" />}
                </div>
                
                <div className="flex items-center gap-2 text-indigo-600 font-bold bg-indigo-50 px-4 py-2 rounded-full text-sm animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                  Waiting for Midtrans...
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-100 dark:bg-slate-950 rounded-3xl shadow-2xl w-full max-w-4xl h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2"><History className="text-indigo-600" /> Completed Orders</h2>
              <button onClick={() => setShowHistoryModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500 dark:text-slate-400">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-3">
              {completedOrders.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                  <History className="w-12 h-12 opacity-20 mb-3" />
                  <p className="font-bold text-lg">No completed orders today.</p>
                </div>
              ) : (
                completedOrders.map(tab => (
                  <div key={tab.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col transition-all shrink-0">
                    <div 
                      onClick={() => setExpandedTabId(expandedTabId === tab.id ? null : tab.id)}
                      className="p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-6">
                        <span className="bg-emerald-100 text-emerald-700 font-black text-sm px-3 py-1.5 rounded-lg w-20 text-center">{tab.orderNumber}</span>
                        <div className="text-left flex flex-col justify-center">
                          <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">{tab.customerName || "Guest"}</h3>
                          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{tab.items.length} items • <span className="uppercase text-xs font-bold text-slate-400 dark:text-slate-500">{tab.orderType.replace("_", " ")}</span> • {new Date(tab.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-black text-emerald-600 text-xl mr-4">Rp {tab.total.toLocaleString('id-ID')}</span>
                        
                        <button onClick={(e) => { e.stopPropagation(); triggerReceiptCapture(tab, "PRINT"); }} className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-bold px-4 py-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors flex items-center gap-2">
                          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                          Print
                        </button>
                        
                        <button onClick={(e) => { e.stopPropagation(); triggerReceiptCapture(tab, "WA"); }} className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-bold px-4 py-2 rounded-xl hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 transition-colors flex items-center gap-2">
                          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="css-i6dzq1"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                          WA
                        </button>
                      </div>
                    </div>
                    
                    {expandedTabId === tab.id && (
                      <div className="bg-slate-50 dark:bg-slate-950 p-4 border-t border-slate-200 dark:border-slate-800 animate-in slide-in-from-top-2 fade-in duration-200">
                        <h4 className="font-bold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest mb-3">Order Items</h4>
                        <div className="space-y-2">
                          {tab.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center text-sm font-medium text-slate-700 dark:text-slate-300">
                              <span>{item.quantity}x {item.productName} {item.note && <span className="text-slate-400 italic">({item.note})</span>}</span>
                              <span className="font-bold">Rp {(item.quantity * item.price).toLocaleString('id-ID')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success / Receipt Modal */}
      {showSuccessModal && successOrderData && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="bg-emerald-50 dark:bg-emerald-900/30 p-8 flex flex-col items-center justify-center text-center border-b border-emerald-100 dark:border-emerald-800/50">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-800/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4 shadow-inner">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mb-1">Payment Successful!</h2>
              <p className="font-bold text-slate-500 dark:text-slate-400">Order <span className="text-slate-700 dark:text-slate-300">{successOrderData.orderNumber}</span></p>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="flex flex-col gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs">Total Paid</span>
                  <span className="font-black text-xl text-slate-900 dark:text-white">Rp {successOrderData.total.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs">Payment Method</span>
                  <div className="flex flex-col items-end">
                    <span className="font-bold text-sm text-slate-700 dark:text-slate-300">
                      {successOrderData.paymentMethod === "CASH" ? "CASH" : "QRIS"}
                    </span>
                    {successOrderData.paymentMethod === "QRIS" && (
                      <span className="text-[10px] font-black bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded mt-1 uppercase tracking-wider">
                        {successOrderData.issuer || "MOCK / SANDBOX"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {successOrderData.paymentMethod === "CASH" && (
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl p-6 border border-orange-100 dark:border-orange-800/30 flex flex-col items-center justify-center text-center shadow-sm">
                  <span className="text-orange-600 dark:text-orange-400 font-bold uppercase tracking-widest text-xs mb-2">Change Due</span>
                  <span className="font-black text-4xl text-orange-600 dark:text-orange-400">Rp {successOrderData.changeDue.toLocaleString('id-ID')}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => triggerReceiptCapture(successOrderData, "PRINT")}
                  disabled={isGeneratingReceipt}
                  className="flex-1 border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Receipt className="w-5 h-5" /> Print
                </button>
                <button 
                  onClick={() => triggerReceiptCapture(successOrderData, "WA")}
                  disabled={isGeneratingReceipt}
                  className="flex-1 bg-[#25D366] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#1EBE5C] shadow-md transition-colors disabled:opacity-50"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                  WhatsApp
                </button>
              </div>
              
              <button 
                onClick={() => {
                  setShowSuccessModal(false);
                  setSuccessOrderData(null);
                  clearCart();
                }}
                className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-xl font-black text-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-lg mt-2"
              >
                NEW ORDER
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dark Header */}
      <header className="bg-slate-900 text-white h-16 flex items-center justify-between px-6 shrink-0 z-20 shadow-md">
        <div className="flex items-center gap-4">
          <a href={`/branch/${branchId}`} className="hover:bg-slate-800 p-2 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </a>
          <h1 className="font-bold tracking-wide flex items-center gap-2">
            POS TERMINAL 
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-2"></span>
          </h1>
          <span className="bg-slate-800 px-3 py-1 rounded-full text-xs font-semibold text-slate-300 uppercase tracking-widest hidden sm:block">
            {branchName}
          </span>
          <button onClick={loadOpenTabs} className="ml-4 bg-indigo-600 hover:bg-indigo-700 px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
            <ListChecks className="w-4 h-4" /> OPEN TABS
          </button>
          <button onClick={loadHistory} className="bg-slate-700 hover:bg-slate-600 px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors text-white">
            <History className="w-4 h-4" /> HISTORY
          </button>
          <button 
            onClick={() => setTerminalModalAction("ATTENDANCE")} 
            className="bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors text-white shadow-sm"
            title="Kitchen Cooks & Runners Attendance"
          >
            <Clock className="w-4 h-4" /> ATTENDANCE
          </button>
          <button 
            onClick={() => setTerminalModalAction("SWITCH_CASHIER")} 
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors text-slate-300 hover:text-white"
            title="Switch Active Cashier"
          >
            <UserCheck className="w-4 h-4 text-indigo-400" />
            <span className="max-w-[120px] truncate">{activeCashierName || "SWITCH CASHIER"}</span>
          </button>
        </div>
        <div suppressHydrationWarning className="text-sm font-medium text-slate-300">
          {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
        </div>
      </header>

      {/* Attendance Celebration Floating Toast */}
      {attendanceToast && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-emerald-600 text-white font-extrabold text-sm px-6 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-3 animate-in slide-in-from-top-4 duration-300">
          <CheckCircle className="w-5 h-5 text-white" />
          <span>{attendanceToast.message} at {attendanceToast.time}</span>
        </div>
      )}

      {/* Dynamic Terminal QR Modal */}
      {terminalModalAction && (
        <TerminalQrModal
          isOpen={!!terminalModalAction}
          onClose={() => setTerminalModalAction(null)}
          action={terminalModalAction}
          branchId={branchId}
          onSuccess={(data) => {
            if (terminalModalAction === "SWITCH_CASHIER") {
              setActiveCashierName(data.userName);
            } else if (terminalModalAction === "ATTENDANCE") {
              setAttendanceToast({
                message: `${data.userName} (${data.attendanceType === 'CLOCK_OUT' ? 'Clocked Out' : 'Clocked In'})`,
                time: data.clockTime,
              });
              setTimeout(() => {
                setAttendanceToast(null);
              }, 4000);
            }
          }}
        />
      )}

      <div className="flex-1 flex overflow-hidden">
        
        {/* Products Grid (Left Side) */}
        <main className="flex-1 p-6 overflow-y-auto flex flex-col">
          
          {/* Controls: Search & Tabs */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Menu Items</h2>
              <div className="relative w-full sm:w-72">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search menu..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 transition-colors shadow-sm dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
            </div>
            
            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map(cat => (
                <button
                  key={cat as string}
                  onClick={() => setSelectedCategory(cat as string)}
                  className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors shadow-sm ${
                    selectedCategory === cat 
                      ? 'bg-indigo-600 text-white border border-indigo-700 dark:border-indigo-500' 
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {cat as string}
                </button>
              ))}
            </div>
          </div>

          {filteredProducts.length === 0 ? (
             <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-slate-500 font-medium">
               No items found for this category or search.
             </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
              {filteredProducts.map(p => {
                const isHex = p.color?.startsWith("#");
                const style = isHex ? { backgroundColor: p.color, borderColor: p.color } : {};
                const className = isHex 
                  ? "border-2 p-6 rounded-[2rem] flex flex-col items-center text-center justify-center gap-3 hover:scale-105 transition-transform active:scale-95 shadow-sm h-40 text-slate-900 dark:text-slate-100 dark:bg-opacity-20"
                  : `${p.color} border-2 p-6 rounded-[2rem] flex flex-col items-center text-center justify-center gap-3 hover:scale-105 transition-transform active:scale-95 shadow-sm h-40`;
                  
                return (
                  <button 
                    key={p.id} 
                    onClick={() => addToCart(p)}
                    className={className}
                    style={style}
                  >
                    <span className="font-extrabold text-lg leading-tight">{p.name}</span>
                    <span className="font-black opacity-80 text-sm">Rp {(p.price).toLocaleString('id-ID')}</span>
                  </button>
                );
              })}
            </div>
          )}
        </main>

        {/* Cart Panel (Right Side) */}
        <aside className="w-[400px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shadow-2xl shrink-0 z-10">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-3 bg-slate-50 dark:bg-slate-950">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-6 h-6 text-slate-700 dark:text-slate-300" />
                <h2 className="text-xl font-black text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-800 px-3 py-1 rounded-lg tracking-wider">
                  {activeOrderNumber ? `ORDER ${activeOrderNumber}` : "NEW ORDER"}
                </h2>
              </div>
              {cart.length > 0 && (
                <button onClick={clearCart} className="text-red-500 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
            
            <input 
              type="text" 
              placeholder="Customer Name (Optional)" 
              value={activeCustomerName} 
              onChange={e => setActiveCustomerName(e.target.value)} 
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm placeholder:font-medium" 
            />
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50 dark:bg-slate-950/50">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-3">
                <ShoppingCart className="w-12 h-12 opacity-20" />
                <p className="font-medium">Cart is empty</p>
                <p className="text-xs text-center px-4 opacity-60">Tap items on the left to add them to the order.</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.product.id} className="flex justify-between items-center bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm gap-3">
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <p className="font-bold text-slate-900 dark:text-white text-sm leading-tight">{item.product.name}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <p className="text-xs text-emerald-600 font-black">Rp {item.product.price.toLocaleString('id-ID')}</p>
                      <span className="text-slate-300 dark:text-slate-700 text-[10px] leading-none">•</span>
                      <button onClick={() => updateNote(item.product.id)} className="text-[11px] font-bold flex items-center gap-1 transition-colors truncate" style={{ color: item.note ? '#4f46e5' : '#94a3b8' }}>
                        <PenSquare className="w-3 h-3 shrink-0" />
                        <span className="truncate">{item.note ? `${item.note}` : "Add Note"}</span>
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-1 py-1 shadow-sm shrink-0">
                    <button onClick={() => updateQty(item.product.id, -1)} className="p-1 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm rounded-lg text-slate-600 dark:text-slate-400 transition-all">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-black w-5 text-center dark:text-white text-sm">{item.qty}</span>
                    <button onClick={() => updateQty(item.product.id, 1)} className="p-1 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm rounded-lg text-slate-600 dark:text-slate-400 transition-all">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Checkout Footer */}
          <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] space-y-3">
            <div className="flex justify-between items-end mb-2">
              <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-sm">Total</span>
              <span className="text-3xl font-black text-slate-900 dark:text-white">Rp {total.toLocaleString('id-ID')}</span>
            </div>
            
            <div className="flex gap-2">
              <button 
                disabled={cart.length === 0 || isProcessing}
                onClick={() => setShowHoldModal(true)}
                className="flex-1 bg-indigo-100 dark:bg-indigo-900/30 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 text-indigo-700 dark:text-indigo-400 py-4 rounded-xl font-extrabold text-sm flex flex-col items-center justify-center gap-1 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-all active:scale-95"
              >
                <PauseCircle className="w-5 h-5" />
                HOLD ORDER
              </button>
              
              <button 
                disabled={cart.length === 0 || isProcessing}
                onClick={() => setShowCheckoutModal(true)}
                className="flex-[2] bg-emerald-600 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:shadow-none disabled:text-slate-400 dark:disabled:text-slate-500 text-white py-4 rounded-xl font-black text-lg flex flex-col items-center justify-center gap-1 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-[0.98]"
              >
                <CreditCard className="w-5 h-5" />
                PAY NOW
              </button>
            </div>
          </div>
        </aside>

        {/* HIDDEN RECEIPT CAPTURE AREA */}
        {receiptToRender && (
          <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
            <div id="receipt-capture-area" className="bg-white dark:bg-slate-900 w-[380px] p-8 font-mono text-slate-900 dark:text-white border border-slate-100 dark:border-slate-800">
              <div className="text-center mb-6 mt-4">
                <h1 className="font-black text-2xl uppercase tracking-widest mb-1">{branchName}</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Original Branch</p>
                <div className="mt-4 border-b-2 border-dashed border-slate-300 pb-4">
                  <p className="text-sm font-bold">RECEIPT: {receiptToRender.orderNumber}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(receiptToRender.createdAt).toLocaleString('id-ID')}</p>
                  <p className="text-xs font-bold mt-1 bg-slate-100 inline-block px-2 py-0.5 rounded uppercase">{receiptToRender.orderType.replace("_", " ")}</p>
                </div>
              </div>
              <div className="mb-6 space-y-3">
                {receiptToRender.items.map((item: any) => (
                  <div key={item.id} className="text-sm">
                    <div className="flex justify-between font-bold">
                      <span>{item.quantity}x {item.productName}</span>
                      <span>{(item.quantity * item.price).toLocaleString('id-ID')}</span>
                    </div>
                    {item.note && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 italic mt-0.5 ml-4">* {item.note}</div>
                    )}
                  </div>
                ))}
              </div>
              <div className="border-t-2 border-dashed border-slate-300 pt-4 space-y-2 text-sm font-bold">
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Subtotal</span>
                  <span>{receiptToRender.total.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-xl font-black mt-2">
                  <span>TOTAL</span>
                  <span>Rp {receiptToRender.total.toLocaleString('id-ID')}</span>
                </div>
              </div>
              <div className="mt-8 text-center text-xs text-slate-400 dark:text-slate-500 font-bold">
                <p>TERIMA KASIH ATAS KUNJUNGAN ANDA!</p>
                <p className="mt-2 text-[10px]">Powered by Resto OS</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
