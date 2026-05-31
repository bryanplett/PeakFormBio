/* orders-logic.js — order grouping, pricing & status helpers
   Ported verbatim (behavior-preserving) from Admin.html so the mobile
   app computes totals and statuses identically to the desktop admin. */
(function (global) {
  'use strict';

  const STATUS_COLORS = {
    pending:   { bg: 'rgba(255,159,10,0.16)', fg: '#ff9f0a' },
    invoiced:  { bg: 'rgba(41,151,255,0.16)', fg: '#2997ff' },
    paid:      { bg: 'rgba(52,199,89,0.16)',  fg: '#34c759' },
    reported:  { bg: 'rgba(41,151,255,0.16)', fg: '#2997ff' },
    shipped:   { bg: 'rgba(191,90,242,0.16)', fg: '#bf5af2' },
    delivered: { bg: 'rgba(255,255,255,0.12)', fg: 'rgba(255,255,255,0.75)' },
    completed: { bg: 'rgba(52,199,89,0.16)',  fg: '#34c759' },
    cancelled: { bg: 'rgba(255,69,58,0.16)',  fg: '#ff453a' },
    unpaid:    { bg: 'rgba(255,159,10,0.16)', fg: '#ff9f0a' },
  };

  const FULFILLMENT_OPTIONS = ['pending', 'shipped', 'delivered', 'completed', 'cancelled'];
  const PAYMENT_OPTIONS     = ['unpaid', 'reported', 'invoiced', 'paid'];

  function readStatuses(o) {
    const rawStatus = o.status || 'pending';
    const isLegacyPayment = rawStatus === 'paid' || rawStatus === 'invoiced';
    const fulfillment = isLegacyPayment ? 'pending' : rawStatus;
    let payment = o.payment_status || (isLegacyPayment ? rawStatus : null);
    return { fulfillment, payment: payment || 'unpaid' };
  }

  function priceFromLabel(label) {
    const m = (label || '').match(/\$([\d,.]+)/);
    return m ? parseFloat(m[1].replace(/,/g, '')) || 0 : 0;
  }

  function couponMatchesLabel(coupon, label) {
    if (!coupon) return false;
    if (coupon.scope === 'all') return true;
    if (coupon.scope === 'retatrutide') return /\bretatrutide\b/i.test(label || '');
    return false;
  }

  function computeGroupTotals(groupOrders, couponsByCode) {
    const first = groupOrders[0] || {};
    const coupon = first.coupon_code
      ? ((couponsByCode || {})[String(first.coupon_code).toLowerCase()] || null)
      : null;
    let original = 0, afterPctDiscount = 0;
    for (const o of groupOrders) {
      const label = o.product || o.item || '';
      const qty = parseInt(o.quantity ?? o.qty ?? 1, 10) || 1;
      const price = priceFromLabel(label);
      original += price * qty;
      if (coupon && coupon.kind === 'percent' && couponMatchesLabel(coupon, label)) {
        const pct = parseFloat(coupon.amount) || 0;
        afterPctDiscount += Math.max(0, price * (1 - pct / 100)) * qty;
      } else {
        afterPctDiscount += price * qty;
      }
    }
    let fixedDiscount = 0;
    if (coupon && coupon.kind === 'fixed') {
      const matchingSubtotal = groupOrders.reduce((s, o) => {
        const label = o.product || o.item || '';
        const qty = parseInt(o.quantity ?? o.qty ?? 1, 10) || 1;
        return couponMatchesLabel(coupon, label) ? s + priceFromLabel(label) * qty : s;
      }, 0);
      fixedDiscount = Math.min(matchingSubtotal, parseFloat(coupon.amount) || 0);
    }
    const subtotal = Math.max(0, afterPctDiscount - fixedDiscount);
    const discount = Math.max(0, original - subtotal);
    const shipping = Number(first.shipping_cost || 0) || 0;
    const total = subtotal + shipping;
    return { coupon, original, subtotal, discount, shipping, total };
  }

  function groupOrders(sorted) {
    const groups = [];
    for (const o of sorted) {
      const t = new Date(o.created_at || o.ordered_at || 0).getTime();
      const key = [
        o.client_id || '', o.payment_method || '', o.shipping_method || '',
        o.coupon_code || '', o.shipping_address || '',
      ].join('|');
      const last = groups[groups.length - 1];
      if (last && last.key === key && Math.abs(t - last.minT) <= 5 * 60 * 1000) {
        last.orders.push(o);
        last.minT = Math.min(last.minT, t);
        last.maxT = Math.max(last.maxT, t);
      } else {
        groups.push({ key, orders: [o], minT: t, maxT: t });
      }
    }
    return groups;
  }

  function canonicalProductName(label) {
    if (!label) return '';
    return String(label).replace(/\s+—\s+\$[\d,.]+\s*$/, '').trim();
  }

  // Sort newest-first and group.
  function sortAndGroup(orders) {
    const sorted = (orders || []).slice().sort((a, b) => {
      const ta = new Date(a.created_at || a.ordered_at || 0).getTime();
      const tb = new Date(b.created_at || b.ordered_at || 0).getTime();
      return tb - ta;
    });
    return groupOrders(sorted);
  }

  async function decrementInventoryForOrder(sb, order) {
    try {
      const { data: fresh, error: fetchErr } = await sb.from('orders')
        .select('id, product, item, quantity, qty, inventory_applied')
        .eq('id', order.id).single();
      if (fetchErr) return { ok: false, error: fetchErr.message };
      if (fresh.inventory_applied) return { ok: true, alreadyApplied: true };
      const productLabel = fresh.product || fresh.item || order.product || order.item || '';
      const qty = parseInt(fresh.quantity ?? fresh.qty ?? order.quantity ?? order.qty ?? 1, 10) || 1;
      const name = canonicalProductName(productLabel);
      if (!name) return { ok: false, error: 'No product name on order.' };
      const { data: inv } = await sb.from('inventory').select('stock').eq('product_name', name).maybeSingle();
      const current = inv?.stock ?? 0;
      const next = current - qty;
      const { error: upErr } = await sb.from('inventory').upsert(
        { product_name: name, stock: next, updated_at: new Date().toISOString() },
        { onConflict: 'product_name' });
      if (upErr) return { ok: false, error: upErr.message };
      const { error: flagErr } = await sb.from('orders').update({ inventory_applied: true }).eq('id', order.id);
      if (flagErr && !/column .* does not exist/i.test(flagErr.message)) return { ok: false, error: flagErr.message };
      return { ok: true, name, qty, newStock: next };
    } catch (err) {
      return { ok: false, error: err.message || String(err) };
    }
  }

  // Update fulfillment status for one order, with inventory side-effects.
  async function setOrderStatus(sb, order, status) {
    await sb.from('orders').update({ status }).eq('id', order.id);
    if (status === 'completed') {
      await decrementInventoryForOrder(sb, order);
    }
    if (status === 'cancelled' && typeof global.restockInventoryForOrder === 'function') {
      await global.restockInventoryForOrder(order);
    }
  }

  // Update payment status for one order (handles legacy schema fallback).
  async function setOrderPaymentStatus(sb, order, payment_status) {
    const val = payment_status && payment_status !== 'unpaid' ? payment_status : null;
    const { error } = await sb.from('orders').update({ payment_status: val }).eq('id', order.id);
    if (error && /column .* does not exist/i.test(error.message || '')) {
      if (val) await sb.from('orders').update({ status: val }).eq('id', order.id);
    }
  }

  async function setGroupStatus(sb, groupOrdersList, status) {
    await Promise.all(groupOrdersList.map(o => setOrderStatus(sb, o, status)));
  }
  async function setGroupPaymentStatus(sb, groupOrdersList, payment_status) {
    await Promise.all(groupOrdersList.map(o => setOrderPaymentStatus(sb, o, payment_status)));
  }

  function couponsByCode(coupons) {
    const m = {};
    (coupons || []).forEach(c => { if (c.code) m[String(c.code).toLowerCase()] = c; });
    return m;
  }

  global.PFBOrders = {
    STATUS_COLORS, FULFILLMENT_OPTIONS, PAYMENT_OPTIONS,
    readStatuses, priceFromLabel, couponMatchesLabel, computeGroupTotals,
    groupOrders, sortAndGroup, canonicalProductName, couponsByCode,
    decrementInventoryForOrder, setOrderStatus, setOrderPaymentStatus,
    setGroupStatus, setGroupPaymentStatus,
  };
})(window);
