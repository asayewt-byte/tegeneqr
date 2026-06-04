declare global {
  var __io: any;
}

export function getIO() {
  return globalThis.__io;
}

function getWaitersForOrder(orderId: number): number[] {
  const { getDb } = require('./db');
  const db = getDb();
  const order = db.prepare('SELECT waiter_id FROM orders WHERE id = ?').get(orderId) as any;
  return order?.waiter_id ? [order.waiter_id] : [];
}

export function emitNewOrder(order: any) {
  const io = getIO();
  if (!io) return;
  io.to('cashier').emit('new-order', order);
}

export function emitOrderUpdate(order: any) {
  const io = getIO();
  if (!io) return;
  io.to('cashier').emit('order-updated', order);
  io.to(`order-${order.id}`).emit('order-updated', order);
  if (order.waiter_id) {
    io.to(`waiter-${order.waiter_id}`).emit('order-updated', order);
  }
}

export function emitDailyReport(report: any) {
  const io = getIO();
  if (!io) return;
  io.to('admin').emit('daily-report', report);
}

export function emitStaffChanged() {
  const io = getIO();
  if (!io) return;
  io.to('admin').emit('staff-changed');
}

export function emitMenuChanged() {
  const io = getIO();
  if (!io) return;
  io.to('admin').emit('menu-changed');
}

export function emitTablesChanged() {
  const io = getIO();
  if (!io) return;
  io.to('admin').emit('tables-changed');
}
