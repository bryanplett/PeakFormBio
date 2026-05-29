// api-client.js — Drop-in replacement for @supabase/supabase-js
// Provides the same interface (sb.from, sb.auth, sb.storage, sb.rpc)
// but talks to our own Express + PostgreSQL backend.
(function (global) {
  'use strict';

  const API = '/api';

  // Parse a fetch Response as JSON, tolerating empty or non-JSON bodies
  // (e.g. a plain-text "404 page not found" when the backend isn't reachable).
  async function safeParse(res) {
    const text = await res.text().catch(() => '');
    try { return text ? JSON.parse(text) : null; } catch { return null; }
  }
  function reachError(res) {
    if (res && res.status === 404) return { message: "Couldn't reach the server (404). Make sure the backend is running and /api is available." };
    if (res && res.status >= 500) return { message: 'Server error (' + res.status + '). Please try again shortly.' };
    return { message: "Couldn't reach the server. Check your connection and try again." };
  }

  class QueryBuilder {
    constructor(table, getToken) {
      this._table    = table;
      this._getToken = getToken;
      this._method   = 'GET';
      this._body     = null;
      this._filters  = {};
      this._inF      = {};
      this._isF      = {};
      this._select   = null;
      this._order    = null;
      this._limit    = null;
      this._single   = false;
      this._maybe    = false;
      this._conflict = null;
    }

    // ── Query modifiers ──────────────────────────────────────────────────────
    select(cols) { this._select = cols || '*'; return this; }
    eq(col, val) { this._filters[col] = val; return this; }
    in(col, vals) { this._inF[col] = vals; return this; }
    is(col, val) { this._isF[col] = val; return this; }
    order(col, opts) {
      const dir = (opts && opts.ascending === false) ? 'desc' : 'asc';
      this._order = col + ':' + dir;
      return this;
    }
    limit(n) { this._limit = n; return this; }

    // ── Write operations ─────────────────────────────────────────────────────
    insert(data)       { this._method = 'POST';   this._body = data; return this; }
    update(data)       { this._method = 'PATCH';  this._body = data; return this; }
    delete()           { this._method = 'DELETE'; return this; }
    upsert(data, opts) {
      this._method   = 'PUT';
      this._body     = data;
      this._conflict = (opts && opts.onConflict) || null;
      return this;
    }

    // ── Terminal methods ─────────────────────────────────────────────────────
    single()      { this._single = true; return this._run(); }
    maybeSingle() { this._maybe  = true; return this._run(); }

    // Make the builder thenable so `await sb.from(t).select()` works
    then(res, rej) { return this._run().then(res, rej); }
    catch(rej)     { return this._run().catch(rej); }

    // ── Execution ─────────────────────────────────────────────────────────────
    _buildUrl() {
      const base = API + '/data/' + this._table;
      const p = new URLSearchParams();

      for (const [k, v] of Object.entries(this._filters)) p.set(k, v);
      for (const [k, v] of Object.entries(this._inF))     p.set(k + '__in', Array.isArray(v) ? v.join(',') : v);
      for (const [k, v] of Object.entries(this._isF))     p.set(k + '__is', v === null ? 'null' : v);
      if (this._select) p.set('_select', this._select);
      if (this._order)  p.set('_order',  this._order);
      if (this._limit)  p.set('_limit',  this._limit);
      if (this._single) p.set('_single', '1');
      if (this._maybe)  p.set('_single', 'maybe');
      if (this._conflict) p.set('_onConflict', this._conflict);

      const qs = p.toString();
      return qs ? base + '?' + qs : base;
    }

    async _run() {
      const token = this._getToken();
      const url   = this._buildUrl();
      const opts  = {
        method:  this._method,
        headers: { 'Content-Type': 'application/json' },
      };
      if (token) opts.headers['Authorization'] = 'Bearer ' + token;
      if (this._body !== null) opts.body = JSON.stringify(this._body);

      try {
        const res  = await fetch(url, opts);
        const json = await res.json().catch(() => null);
        if (!res.ok) return { data: null, error: json || { message: 'Request failed.' } };
        return { data: json, error: null };
      } catch (err) {
        return { data: null, error: { message: err.message } };
      }
    }
  }

  // ── Auth ─────────────────────────────────────────────────────────────────────
  class Auth {
    constructor() {
      this._listeners = [];
      this._token     = localStorage.getItem('_pfb_token') || null;
      this._user      = null;
      const stored    = localStorage.getItem('_pfb_user');
      if (stored) { try { this._user = JSON.parse(stored); } catch {} }
    }

    _save(token, user) {
      this._token = token;
      this._user  = user;
      localStorage.setItem('_pfb_token', token);
      localStorage.setItem('_pfb_user',  JSON.stringify(user));
    }

    _clear() {
      this._token = null;
      this._user  = null;
      localStorage.removeItem('_pfb_token');
      localStorage.removeItem('_pfb_user');
    }

    _notify(event, session) {
      this._listeners.forEach(cb => { try { cb(event, session); } catch {} });
    }

    getToken() { return this._token; }

    async signInWithPassword({ email, password }) {
      try {
        const res  = await fetch(API + '/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const json = await safeParse(res);
        if (!res.ok || json === null) return { data: null, error: (json && (json.error || json)) || reachError(res) };
        this._save(json.token, json.user);
        const session = { access_token: json.token, user: json.user };
        this._notify('SIGNED_IN', session);
        return { data: { user: json.user, session }, error: null };
      } catch (err) {
        return { data: null, error: { message: err.message } };
      }
    }

    // OTP is not supported in self-hosted mode — callers should use password login
    async signInWithOtp() {
      return { error: { message: 'Email OTP is not available in self-hosted mode. Please use email & password.' } };
    }
    async verifyOtp() {
      return { data: null, error: { message: 'Email OTP is not available. Please use email & password.' } };
    }

    async signUp({ email, password, options }) {
      const token = this._token;
      try {
        const res = await fetch(API + '/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': 'Bearer ' + token } : {}),
          },
          body: JSON.stringify({
            email, password,
            name:  options && options.data && options.data.name,
            phone: options && options.data && options.data.phone,
          }),
        });
        const json = await safeParse(res);
        if (!res.ok || json === null) return { data: null, error: (json && (json.error || json)) || reachError(res) };
        return { data: {}, error: null };
      } catch (err) {
        return { data: null, error: { message: err.message } };
      }
    }

    async signOut() {
      this._clear();
      this._notify('SIGNED_OUT', null);
      return { error: null };
    }

    getSession() {
      if (!this._token || !this._user) return Promise.resolve({ data: { session: null }, error: null });
      return Promise.resolve({
        data: { session: { access_token: this._token, user: this._user } },
        error: null,
      });
    }

    getUser() {
      return Promise.resolve({
        data: { user: this._user || null },
        error: null,
      });
    }

    onAuthStateChange(cb) {
      this._listeners.push(cb);
      // Notify immediately with current state
      if (this._token && this._user) {
        const session = { access_token: this._token, user: this._user };
        setTimeout(() => cb('SIGNED_IN', session), 0);
      } else {
        setTimeout(() => cb('SIGNED_OUT', null), 0);
      }
      const self = this;
      return {
        data: {
          subscription: {
            unsubscribe() {
              self._listeners = self._listeners.filter(l => l !== cb);
            },
          },
        },
        error: null,
      };
    }

    // Admin: reset a client's password (no email sent — returns new temp password)
    async resetPasswordForEmail(email) {
      return { error: { message: 'Password reset emails are not available in self-hosted mode. Use "Set password" in the client profile to set a new password directly.' } };
    }

    // Admin: set a client's password directly
    async adminSetPassword(email, password) {
      const token = this._token;
      try {
        const res = await fetch(API + '/auth/admin-set-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': 'Bearer ' + token } : {}),
          },
          body: JSON.stringify({ email, password }),
        });
        const json = await safeParse(res);
        if (!res.ok || json === null) return { error: (json && (json.error || json)) || reachError(res) };
        return { error: null };
      } catch (err) {
        return { error: { message: err.message } };
      }
    }
  }

  // ── Storage ───────────────────────────────────────────────────────────────────
  class StorageBucket {
    constructor(bucket, getToken) {
      this._bucket   = bucket;
      this._getToken = getToken;
    }

    async upload(filePath, file) {
      const token = this._getToken();
      const form  = new FormData();
      form.append('file', file);
      form.append('path', filePath);
      try {
        const res = await fetch(API + '/storage/' + this._bucket, {
          method: 'POST',
          headers: token ? { 'Authorization': 'Bearer ' + token } : {},
          body: form,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ message: 'Upload failed.' }));
          return { error: err };
        }
        return { data: { path: filePath }, error: null };
      } catch (err) {
        return { error: { message: err.message } };
      }
    }

    getPublicUrl(filePath) {
      return { data: { publicUrl: API + '/storage/' + this._bucket + '/' + filePath } };
    }
  }

  // ── Client factory ────────────────────────────────────────────────────────────
  function createApiClient() {
    const auth = new Auth();

    return {
      auth,

      from(table) {
        return new QueryBuilder(table, () => auth.getToken());
      },

      storage: {
        from(bucket) {
          return new StorageBucket(bucket, () => auth.getToken());
        },
      },

      async rpc(fnName, params) {
        const token = auth.getToken();
        try {
          const res = await fetch(API + '/rpc/' + fnName, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': 'Bearer ' + token } : {}),
            },
            body: JSON.stringify(params || {}),
          });
          const json = await res.json().catch(() => null);
          if (!res.ok) return { data: null, error: json };
          return { data: json, error: null };
        } catch (err) {
          return { data: null, error: { message: err.message } };
        }
      },
    };
  }

  global.createApiClient = createApiClient;
})(window);
