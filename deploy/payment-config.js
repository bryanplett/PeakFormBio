/* payment-config.js — PeakForm Bio direct-payment configuration
   ────────────────────────────────────────────────────────────────────────────
   Default payment methods + business settings. These DEFAULTS are baked into the
   site so buyers always see valid instructions even before the Admin → Payments
   panel has saved anything to the server.

   At runtime, window.loadPaymentMethods(sb) (in payment-instructions.jsx) reads
   the admin-saved version from the `app_settings` table (key = 'payment_methods')
   and falls back to these defaults if the table/row isn't there yet.

   To change handles WITHOUT redeploying: use Admin → Payments.
   To change the baked-in defaults: edit the `handle` values below.

   method.kind:
     'handle'  — a username/email/phone the buyer sends to (Venmo, PayPal, …)
     'crypto'  — a wallet address (shows the network)
     'invoice' — no handle; buyer is invoiced later (card)
     'note'    — freeform ("Other"); buyer contacts you to arrange
   A 'handle'/'crypto' method with an empty handle is hidden from BUYERS
   (still shown in the Admin panel so you can fill it in).
   ──────────────────────────────────────────────────────────────────────────── */
(function (global) {
  global.PFB_PAYMENT = {
    businessName: 'PeakForm Bio',
    refPrefix: 'PFB',
    // Memo line buyers are asked to include so you can match payments to orders.
    memoNote: 'Include your order reference in the payment note so we can match it.',
    methods: [
      { id: 'venmo',     label: 'Venmo',   kind: 'handle', handle: '@Pepsoc',          hint: 'Send as “Friends & Family” if prompted.', enabled: true },
      { id: 'paypal',    label: 'PayPal',  kind: 'handle', handle: '@bryanplett',      hint: 'Use “Friends & Family” to avoid fees.',   enabled: true },
      { id: 'cashapp',   label: 'Cash App',kind: 'handle', handle: '$santacruzstyle',  hint: '',                                         enabled: true },
      { id: 'zelle',     label: 'Zelle',   kind: 'handle', handle: '',                 hint: 'Email or phone for Zelle.',                enabled: true },
      { id: 'bitcoin',   label: 'Bitcoin', kind: 'crypto', network: 'Bitcoin (BTC)',  handle: '', hint: '',                            enabled: true },
      { id: 'usdt_sol',  label: 'USDT',    kind: 'crypto', network: 'Solana (SPL)',   handle: '', hint: 'Send only on the Solana network.', enabled: true },
      { id: 'pyusd_sol', label: 'PYUSD',   kind: 'crypto', network: 'Solana (SPL)',   handle: '', hint: 'Send only on the Solana network.', enabled: true },
      { id: 'card',      label: 'Card — we’ll send an invoice', kind: 'invoice', handle: '', hint: 'No payment now. We’ll email/text a secure invoice.', enabled: true },
      { id: 'other',     label: 'Other',   kind: 'note',   handle: '', hint: 'Reply to your confirmation and we’ll arrange payment.', enabled: true },
    ],
  };

  // Methods a BUYER should see: enabled, and either no handle needed
  // (invoice/note) or a handle that's actually been filled in.
  global.visiblePaymentMethods = function (methods) {
    const list = methods || (global.PFB_PAYMENT && global.PFB_PAYMENT.methods) || [];
    return list.filter(m => m && m.enabled && (
      m.kind === 'invoice' || m.kind === 'note' || (m.handle && String(m.handle).trim())
    ));
  };

  // Build a tap-to-pay URL for a method, prefilling the amount where supported.
  // Returns null when the method has no public payment link (e.g. Zelle, crypto).
  global.paymentLink = function (m, amount) {
    if (!m || !m.handle) return null;
    const h = String(m.handle).trim();
    const bare = h.replace(/^@/, '');
    const tag = h.startsWith('$') ? h : '$' + bare;        // cashtag
    const amt = (amount && Number(amount) > 0) ? Number(amount).toFixed(2) : null;
    switch (m.id) {
      case 'venmo':   return 'https://venmo.com/u/' + encodeURIComponent(bare);
      case 'paypal':  return 'https://paypal.me/' + encodeURIComponent(bare) + (amt ? '/' + amt : '');
      case 'cashapp': return 'https://cash.app/' + tag + (amt ? '/' + amt : '');
      default:        return null; // Zelle / crypto have no universal web link
    }
  };
})(window);
