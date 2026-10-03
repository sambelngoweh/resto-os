import { db } from "@/db";
import { orders, orderItems, restaurants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, id),
    with: {
      restaurant: true
    }
  });

  if (!order) {
    return notFound();
  }

  const items = await db.query.orderItems.findMany({
    where: eq(orderItems.orderId, id)
  });

  return (
    <div className="min-h-screen bg-slate-200 flex items-center justify-center p-4 font-mono text-slate-900">
      <div className="bg-white w-full max-w-sm p-8 shadow-2xl relative overflow-hidden">
        {/* Receipt Zig-Zag Top Edge (CSS Trick) */}
        <div className="absolute top-0 left-0 right-0 h-3 bg-[radial-gradient(circle,transparent_4px,#ffffff_5px)] bg-[length:10px_10px] -mt-1.5" />
        
        {/* Header */}
        <div className="text-center mb-6 mt-4">
          <h1 className="font-black text-2xl uppercase tracking-widest mb-1">{order.restaurant?.name || "SAMBEL NGOWEH"}</h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
            {order.restaurant?.address || "Original Branch"}
          </p>
          <div className="mt-4 border-b-2 border-dashed border-slate-300 pb-4">
            <p className="text-sm font-bold">RECEIPT: {order.orderNumber}</p>
            <p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleString('id-ID')}</p>
            <p className="text-xs font-bold mt-1 bg-slate-100 inline-block px-2 py-0.5 rounded uppercase">{order.orderType.replace("_", " ")}</p>
          </div>
        </div>

        {/* Items */}
        <div className="mb-6 space-y-3">
          {items.map(item => (
            <div key={item.id} className="text-sm">
              <div className="flex justify-between font-bold">
                <span>{item.quantity}x {item.productName}</span>
                <span>{(item.quantity * item.price).toLocaleString('id-ID')}</span>
              </div>
              {item.note && (
                <div className="text-xs text-slate-500 italic mt-0.5 ml-4">
                  * {item.note}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t-2 border-dashed border-slate-300 pt-4 space-y-2 text-sm font-bold">
          <div className="flex justify-between text-slate-500">
            <span>Subtotal</span>
            <span>{order.total.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between text-xl font-black mt-2">
            <span>TOTAL</span>
            <span>Rp {order.total.toLocaleString('id-ID')}</span>
          </div>
        </div>

        {/* Payment Info */}
        <div className="mt-6 border-t-2 border-dashed border-slate-300 pt-4 text-xs font-bold space-y-1">
          <div className="flex justify-between">
            <span>STATUS</span>
            <span className="text-emerald-600">{order.status}</span>
          </div>
          {order.amountTendered && order.amountTendered > 0 && (
            <div className="flex justify-between text-slate-500">
              <span>CASH</span>
              <span>{order.amountTendered.toLocaleString('id-ID')}</span>
            </div>
          )}
          {order.changeDue && order.changeDue > 0 && (
            <div className="flex justify-between text-slate-500">
              <span>CHANGE</span>
              <span>{order.changeDue.toLocaleString('id-ID')}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-slate-400 font-bold">
          <p>TERIMA KASIH ATAS KUNJUNGAN ANDA!</p>
          <p className="mt-2 text-[10px]">Powered by Resto OS</p>
        </div>

        {/* Receipt Zig-Zag Bottom Edge */}
        <div className="absolute bottom-0 left-0 right-0 h-3 bg-[radial-gradient(circle,transparent_4px,#ffffff_5px)] bg-[length:10px_10px] bg-bottom rotate-180 -mb-1.5" />
      </div>
    </div>
  );
}
