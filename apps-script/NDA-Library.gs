// ============================================================
//  NDA Library — shared logic for all Nimma Dinasi Angadi stores
//  Published as a GAS Library from developer account
//  Each store's Code.gs calls NDALib.init(ssId) then NDALib.doGet(e)
// ============================================================

var _spreadsheetId = null;
var _spreadsheet = null;   // cached per execution
var _sheetCache = {};      // cached sheet data per execution

function init(spreadsheetId) {
  _spreadsheetId = spreadsheetId;
  _spreadsheet = null;
  _sheetCache = {};
}

function getSpreadsheet() {
  if (!_spreadsheet) _spreadsheet = SpreadsheetApp.openById(_spreadsheetId);
  return _spreadsheet;
}

function sheet(name) {
  return getSpreadsheet().getSheetByName(name);
}

// Per-execution cache — avoids re-reading same sheet multiple times in one request
function sheetData(name) {
  if (_sheetCache[name]) return _sheetCache[name];
  var s = sheet(name);
  var rows = s.getDataRange().getValues();
  var headers = rows[0];
  var data = rows.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) { obj[h] = row[i]; });
    return obj;
  });
  _sheetCache[name] = data;
  return data;
}

// Invalidate a specific sheet from the execution cache (call after writes)
function invalidateCache(name) {
  delete _sheetCache[name];
}

function json(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function ok(extra) {
  return json(Object.assign({ ok: true }, extra || {}));
}

function err(msg) {
  return json({ ok: false, error: msg });
}

function uuid() {
  return Utilities.getUuid();
}

function hashPassword(pw) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, pw);
  return bytes.map(function(b) {
    return ('0' + (b & 0xff).toString(16)).slice(-2);
  }).join('');
}

// ============================================================
//  CacheService helpers
// ============================================================
function scriptCache() {
  return CacheService.getScriptCache();
}

function cacheGet(key) {
  try { return scriptCache().get(key); } catch(e) { return null; }
}

function cachePut(key, value, ttl) {
  try { scriptCache().put(key, value, ttl); } catch(e) {}
}

function cacheRemove(key) {
  try { scriptCache().remove(key); } catch(e) {}
}

// ============================================================
//  Staff token — stored in Subscriptions sheet (staff_token column)
// ============================================================
function generateStaffToken() {
  var token = uuid() + '-' + uuid();
  var s = sheet('Subscriptions');
  var data = s.getDataRange().getValues();
  var headers = data[0];
  var tokenCol = headers.indexOf('staff_token');
  if (tokenCol === -1) return token;
  for (var i = 1; i < data.length; i++) {
    s.getRange(i + 1, tokenCol + 1).setValue(token);
  }
  PropertiesService.getScriptProperties().setProperty('STAFF_TOKEN_FALLBACK', token);
  // Cache for fast verification (TTL: 12 hours)
  cachePut('staff_token', token, 43200);
  invalidateCache('Subscriptions');
  return token;
}

function verifyStaffToken(token) {
  if (!token) return false;
  // Check CacheService first — avoids sheet read on every staff request
  var cached = cacheGet('staff_token');
  if (cached && cached === token) return true;
  // Fall back to sheet
  var s = sheet('Subscriptions');
  var data = s.getDataRange().getValues();
  var headers = data[0];
  var tokenCol = headers.indexOf('staff_token');
  if (tokenCol !== -1) {
    for (var i = 1; i < data.length; i++) {
      if (data[i][tokenCol] === token) {
        cachePut('staff_token', token, 43200);
        return true;
      }
    }
  }
  var fb = PropertiesService.getScriptProperties().getProperty('STAFF_TOKEN_FALLBACK');
  return fb && fb === token;
}

// ============================================================
//  Customer session tokens — stored in Users sheet (session_token column)
// ============================================================
function generateUserToken(userId) {
  var token = uuid();
  var s = sheet('Users');
  var data = s.getDataRange().getValues();
  var headers = data[0];
  var tokenCol = headers.indexOf('session_token');
  if (tokenCol === -1) return token;
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === userId) {
      s.getRange(i + 1, tokenCol + 1).setValue(token);
      // Cache for fast verification (TTL: 24 hours)
      cachePut('user_token_' + userId, token, 86400);
      invalidateCache('Users');
      return token;
    }
  }
  return token;
}

function verifyUserToken(userId, token) {
  if (!userId || !token) return false;
  // Check CacheService first — avoids Users sheet read on every customer request
  var cached = cacheGet('user_token_' + userId);
  if (cached && cached === token) return true;
  // Fall back to sheet
  var s = sheet('Users');
  var data = s.getDataRange().getValues();
  var headers = data[0];
  var tokenCol = headers.indexOf('session_token');
  if (tokenCol === -1) return false;
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === userId && data[i][tokenCol] === token) {
      cachePut('user_token_' + userId, token, 86400);
      return true;
    }
  }
  return false;
}

// ============================================================
//  Main router — called by each store's doGet
// ============================================================
function doGet(e) {
  var action = e.parameter.action;
  var p = {};
  try {
    p = JSON.parse(e.parameter.payload || '{}');
  } catch(_) {
    p = e.parameter;
  }

  try {
    if (action === 'getBootstrap')          return getBootstrap();
    if (action === 'getSettings')           return getSettings();
    if (action === 'getProducts')           return getProducts();
    if (action === 'getMyOrders')           return getMyOrders(p.customerId, p.token);
    if (action === 'getAllOrders')          return getAllOrders(p.staffToken);
    if (action === 'signUp')               return signUp({ name: p.name, email: p.email, password: p.password, phone: p.phone });
    if (action === 'signIn')               return signIn({ email: p.email, password: p.password });
    if (action === 'forgotPassword')        return forgotPassword({ email: p.email });
    if (action === 'verifyOTP')             return verifyOTP({ email: p.email, otp: p.otp, newPassword: p.newPassword });
    if (action === 'updatePhone')           return updatePhone({ customerId: p.customerId, token: p.token, phone: p.phone });
    if (action === 'placeOrder')            return placeOrder({ customerId: p.customerId, token: p.token, items: p.items, photoUrls: p.photoUrls });
    if (action === 'updateOrderStatus')     return updateOrderStatus({ orderId: p.orderId, status: p.status, staffToken: p.staffToken });
    if (action === 'finishBagging')         return finishBagging({ orderId: p.orderId, items: p.items, staffToken: p.staffToken });
    if (action === 'staffLogin')            return staffLogin({ pin: p.pin });
    if (action === 'createProduct')         return createProduct({ name_en: p.name_en, name_kn: p.name_kn, category_id: p.category_id, image_url: p.image_url, in_stock: p.in_stock, variants: p.variants, search_keys: p.search_keys, staffToken: p.staffToken });
    if (action === 'updateProduct')         return updateProduct({ id: p.id, name_en: p.name_en, name_kn: p.name_kn, category_id: p.category_id, image_url: p.image_url, in_stock: p.in_stock, variants: p.variants, search_keys: p.search_keys, staffToken: p.staffToken });
    if (action === 'deleteProduct')         return deleteProduct({ id: p.id, staffToken: p.staffToken });
    if (action === 'createCategory')        return createCategory({ name: p.name, name_kn: p.name_kn, image_url: p.image_url, staffToken: p.staffToken });
    if (action === 'updateCategory')        return updateCategory({ id: p.id, name: p.name, name_kn: p.name_kn, image_url: p.image_url, staffToken: p.staffToken });
    if (action === 'deleteCategory')        return deleteCategory({ id: p.id, staffToken: p.staffToken });
    if (action === 'savePushSubscription')  return savePushSubscription({ subscription: p.subscription });
    if (action === 'getStoreUrl')           return getStoreUrl(p.slug);
    if (action === 'registerStore')         return registerStore(p.slug, p.url);
    return err('Unknown action: ' + action);
  } catch (ex) {
    return err(ex.message);
  }
}

// ============================================================
//  Bootstrap + Settings
// ============================================================
function getBootstrap() {
  // Cache full bootstrap response — invalidated on product/category/settings writes
  var cacheKey = 'bootstrap_' + _spreadsheetId;
  var cached = cacheGet(cacheKey);
  if (cached) return json(JSON.parse(cached));

  var settingRows = sheetData('Settings');
  var map = {};
  settingRows.forEach(function(r) { map[r.key] = r.value; });

  var categories = sheetData('Categories').map(function(r) {
    return { id: r.id, name: r.name, name_kn: r.name_kn || r.name, image_url: r.image_url };
  });

  var catMap = {};
  categories.forEach(function(c) { catMap[c.id] = c.name; });

  var products = sheetData('Products')
    .filter(function(r) { return r.id; })
    .map(function(r) {
      var variants = [];
      try { variants = JSON.parse(r.variants_json || '[]'); } catch(e) {}
      return {
        id: r.id,
        name_en: r.name_en,
        name_kn: r.name_kn,
        category_id: r.category_id,
        category: catMap[r.category_id] || '',
        image_url: r.image_url,
        in_stock: r.in_stock === true || r.in_stock === 'TRUE',
        variants: variants,
        search_keys: r.search_keys || '',
      };
    });

  var result = {
    ok: true,
    store_name: map['store_name'] || '',
    store_logo_url: map['store_logo_url'] || '',
    categories: categories,
    products: products,
  };
  cachePut(cacheKey, JSON.stringify(result), 300); // 5 min TTL
  return json(result);
}

function getSettings() {
  var cacheKey = 'settings_' + _spreadsheetId;
  var cached = cacheGet(cacheKey);
  if (cached) return json(JSON.parse(cached));

  var rows = sheetData('Settings');
  var map = {};
  rows.forEach(function(r) { map[r.key] = r.value; });

  var categories = sheetData('Categories').map(function(r) {
    return { id: r.id, name: r.name, name_kn: r.name_kn || r.name, image_url: r.image_url };
  });

  var result = {
    ok: true,
    store_name: map['store_name'] || '',
    store_logo_url: map['store_logo_url'] || '',
    store_config: map['store_config'] || '{}',
    categories: categories,
  };
  cachePut(cacheKey, JSON.stringify(result), 300);
  return json(result);
}

// ============================================================
//  Products
// ============================================================
function getProducts() {
  var cacheKey = 'products_' + _spreadsheetId;
  var cached = cacheGet(cacheKey);
  if (cached) return json(JSON.parse(cached));

  var rows = sheetData('Products');
  var categories = sheetData('Categories');
  var catMap = {};
  categories.forEach(function(c) { catMap[c.id] = c.name; });

  var products = rows
    .filter(function(r) { return r.id; })
    .map(function(r) {
      var variants = [];
      try { variants = JSON.parse(r.variants_json || '[]'); } catch(e) {}
      return {
        id: r.id,
        name_en: r.name_en,
        name_kn: r.name_kn,
        category_id: r.category_id,
        category: catMap[r.category_id] || '',
        image_url: r.image_url,
        in_stock: r.in_stock === true || r.in_stock === 'TRUE',
        variants: variants,
        search_keys: r.search_keys || '',
        order_count: Number(r.order_count) || 0,
      };
    });

  var result = { ok: true, products: products };
  cachePut(cacheKey, JSON.stringify(result), 300); // 5 min TTL
  return json(result);
}

function invalidateProductCache() {
  cacheRemove('products_' + _spreadsheetId);
  cacheRemove('bootstrap_' + _spreadsheetId);
}

function invalidateCategoryCache() {
  cacheRemove('products_' + _spreadsheetId);
  cacheRemove('bootstrap_' + _spreadsheetId);
  cacheRemove('settings_' + _spreadsheetId);
}

function invalidateOrdersCache() {
  cacheRemove('orders_' + _spreadsheetId);
}

function createCategory(body) {
  if (!verifyStaffToken(body.staffToken)) return err('Unauthorized');
  var s = sheet('Categories');
  var id = uuid();
  s.appendRow([id, body.name, body.name_kn || '', body.image_url || '']);
  invalidateCategoryCache();
  return ok({ id: id });
}

function updateCategory(body) {
  if (!verifyStaffToken(body.staffToken)) return err('Unauthorized');
  var s = sheet('Categories');
  var data = s.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === body.id) {
      s.getRange(i + 1, 1, 1, 4).setValues([[body.id, body.name, body.name_kn || '', body.image_url || '']]);
      invalidateCategoryCache();
      return ok();
    }
  }
  return err('Category not found');
}

function deleteCategory(body) {
  if (!verifyStaffToken(body.staffToken)) return err('Unauthorized');
  var s = sheet('Categories');
  var data = s.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === body.id) {
      s.deleteRow(i + 1);
      invalidateCategoryCache();
      return ok();
    }
  }
  return err('Category not found');
}

function createProduct(body) {
  if (!verifyStaffToken(body.staffToken)) return err('Unauthorized');
  var s = sheet('Products');
  var id = uuid();
  s.appendRow([
    id, body.name_en, body.name_kn, body.category_id, body.image_url || '',
    body.in_stock ? 'TRUE' : 'FALSE',
    JSON.stringify(body.variants || []),
    body.search_keys || '',
    0,
  ]);
  invalidateProductCache();
  return ok({ id: id });
}

function updateProduct(body) {
  if (!verifyStaffToken(body.staffToken)) return err('Unauthorized');
  var s = sheet('Products');
  var data = s.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === body.id) {
      var existingCount = Number(data[i][8]) || 0;
      s.getRange(i + 1, 1, 1, 9).setValues([[
        body.id, body.name_en, body.name_kn, body.category_id, body.image_url || '',
        body.in_stock ? 'TRUE' : 'FALSE',
        JSON.stringify(body.variants || []),
        body.search_keys || '',
        existingCount,
      ]]);
      invalidateProductCache();
      return ok();
    }
  }
  return err('Product not found');
}

function deleteProduct(body) {
  if (!verifyStaffToken(body.staffToken)) return err('Unauthorized');
  var s = sheet('Products');
  var data = s.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === body.id) {
      s.deleteRow(i + 1);
      invalidateProductCache();
      return ok();
    }
  }
  return err('Product not found');
}

// ============================================================
//  Auth
// ============================================================
function signUp(body) {
  var users = sheetData('Users');
  var exists = users.some(function(u) { return u.email === body.email; });
  if (exists) return err('Email already registered');

  var id = uuid();
  sheet('Users').appendRow([
    id, body.name, body.email, hashPassword(body.password),
    body.phone, new Date().toISOString(), '', '',
  ]);
  var token = generateUserToken(id);
  return ok({ user: { id: id, name: body.name, email: body.email, phone: body.phone }, token: token });
}

function signIn(body) {
  var users = sheetData('Users');
  var user = users.find(function(u) {
    return u.email === body.email && u.password_hash === hashPassword(body.password);
  });
  if (!user) return err('Invalid email or password');
  var token = generateUserToken(user.id);
  return ok({ user: { id: user.id, name: user.name, email: user.email, phone: user.phone }, token: token });
}

function forgotPassword(body) {
  var users = sheetData('Users');
  var user = users.find(function(u) { return u.email === body.email; });
  if (!user) return err('No account with that email');

  var otp = Math.floor(100000 + Math.random() * 900000).toString();
  var expiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  var s = sheet('Users');
  var data = s.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][2] === body.email) {
      s.getRange(i + 1, 7, 1, 2).setValues([[otp, expiry]]);
      break;
    }
  }

  GmailApp.sendEmail(body.email, 'Your OTP',
    'Your OTP to reset your password is: ' + otp + '\n\nValid for 10 minutes.');
  return ok();
}

function verifyOTP(body) {
  var s = sheet('Users');
  var data = s.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][2] === body.email) {
      var storedOTP = data[i][6];
      var expiry = new Date(data[i][7]);
      if (String(storedOTP) !== String(body.otp)) return err('Invalid OTP');
      if (new Date() > expiry) return err('OTP expired');
      s.getRange(i + 1, 4, 1, 1).setValues([[hashPassword(body.newPassword)]]);
      s.getRange(i + 1, 7, 1, 2).setValues([['', '']]);
      return ok();
    }
  }
  return err('User not found');
}

// ============================================================
//  Staff login
// ============================================================
function staffLogin(body) {
  var rows = sheetData('Settings');
  var map = {};
  rows.forEach(function(r) { map[r.key] = r.value; });
  if (String(body.pin) !== String(map['staff_pin'])) return err('Invalid PIN');
  var token = generateStaffToken();
  return ok({ staffToken: token });
}

function updatePhone(body) {
  if (!verifyUserToken(body.customerId, body.token)) return err('Unauthorized');
  var s = sheet('Users');
  var data = s.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === body.customerId) {
      s.getRange(i + 1, 5, 1, 1).setValues([[body.phone]]);
      return ok({ phone: body.phone });
    }
  }
  return err('User not found');
}

// ============================================================
//  Orders
// ============================================================
function placeOrder(body) {
  if (!verifyUserToken(body.customerId, body.token)) return err('Unauthorized');

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  var orderNumber;
  try {
    var s = sheet('Orders');
    var existing = s.getLastRow() - 1;
    var year = new Date().getFullYear();
    var seq = String(existing + 1).padStart(4, '0');
    orderNumber = 'NDA-' + year + '-' + seq;
    var id = uuid();
    s.appendRow([
      id, orderNumber, body.customerId,
      JSON.stringify(body.items), 'Pending', new Date().toISOString(),
      JSON.stringify(body.photoUrls || []),
    ]);
  } finally {
    lock.releaseLock();
  }

  invalidateOrdersCache();
  incrementOrderCounts(body.items);
  try { notifyStaff(orderNumber); } catch(e) { Logger.log('notifyStaff error: ' + e); }
  return ok({ order_number: orderNumber });
}

function getMyOrders(customerId, token) {
  if (!verifyUserToken(customerId, token)) return err('Unauthorized');
  var rows = sheetData('Orders');
  var orders = rows
    .filter(function(r) { return r.customer_id === customerId; })
    .map(parseOrder)
    .sort(function(a, b) { return new Date(b.created_at) - new Date(a.created_at); });
  return ok({ orders: orders });
}

function getAllOrders(staffToken) {
  if (!verifyStaffToken(staffToken)) return err('Unauthorized');

  // 20-second cache — reduces sheet reads from staff polling every 30s
  var cacheKey = 'orders_' + _spreadsheetId;
  var cached = cacheGet(cacheKey);
  if (cached) return json(JSON.parse(cached));

  var rows = sheetData('Orders');
  var users = sheetData('Users');
  var userMap = {};
  users.forEach(function(u) { userMap[u.id] = u; });
  var orders = rows.map(function(r) {
    var order = parseOrder(r);
    var user = userMap[r.customer_id];
    order.customer_name = user ? user.name : '';
    order.customer_phone = user ? user.phone : '';
    return order;
  }).sort(function(a, b) { return new Date(b.created_at) - new Date(a.created_at); });

  var result = { ok: true, orders: orders };
  cachePut(cacheKey, JSON.stringify(result), 21600); // 6hr max — invalidated on order mutations
  return json(result);
}

function parseOrder(r) {
  var items = [];
  try { items = JSON.parse(r.items_json || '[]'); } catch(e) {}
  var photoUrls = [];
  try { photoUrls = JSON.parse(r.photo_urls || '[]'); } catch(e) {}
  return {
    id: r.id,
    order_number: r.order_number,
    customer_id: r.customer_id,
    items: items,
    photo_urls: photoUrls,
    status: r.status,
    created_at: r.created_at,
  };
}

function updateOrderStatus(body) {
  if (!verifyStaffToken(body.staffToken)) return err('Unauthorized');
  var s = sheet('Orders');
  var data = s.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === body.orderId) {
      s.getRange(i + 1, 5).setValue(body.status);
      invalidateOrdersCache();
      return ok();
    }
  }
  return err('Order not found');
}

function finishBagging(body) {
  if (!verifyStaffToken(body.staffToken)) return err('Unauthorized');
  var s = sheet('Orders');
  var data = s.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === body.orderId) {
      s.getRange(i + 1, 4, 1, 2).setValues([[JSON.stringify(body.items), 'Ready']]);
      invalidateOrdersCache();
      return ok();
    }
  }
  return err('Order not found');
}

// ============================================================
//  Push Notifications
// ============================================================
function savePushSubscription(body) {
  var sub = body.subscription;
  if (!sub || !sub.endpoint) return err('Invalid subscription');

  var s = sheet('Subscriptions');
  var data = s.getDataRange().getValues();
  var headers = data[0];
  var tokenCol = headers.indexOf('staff_token');

  // Get current staff token to stamp into rows
  var currentToken = cacheGet('staff_token') ||
    PropertiesService.getScriptProperties().getProperty('STAFF_TOKEN_FALLBACK') || '';

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === sub.endpoint) {
      if (tokenCol !== -1) {
        s.getRange(i + 1, 1, 1, 5).setValues([[
          sub.endpoint, sub.keys.p256dh, sub.keys.auth, new Date().toISOString(), currentToken
        ]]);
      } else {
        s.getRange(i + 1, 1, 1, 4).setValues([[
          sub.endpoint, sub.keys.p256dh, sub.keys.auth, new Date().toISOString()
        ]]);
      }
      invalidateCache('Subscriptions');
      return ok();
    }
  }

  if (tokenCol !== -1) {
    s.appendRow([sub.endpoint, sub.keys.p256dh, sub.keys.auth, new Date().toISOString(), currentToken]);
  } else {
    s.appendRow([sub.endpoint, sub.keys.p256dh, sub.keys.auth, new Date().toISOString()]);
  }
  invalidateCache('Subscriptions');
  return ok();
}

function notifyStaff(orderNumber) {
  var subs = sheetData('Subscriptions');
  if (!subs.length) return;
  var workerUrl = PropertiesService.getScriptProperties().getProperty('PUSH_WORKER_URL');
  if (!workerUrl) { Logger.log('PUSH_WORKER_URL not set in library Script Properties'); return; }

  var settingRows = sheetData('Settings');
  var map = {};
  settingRows.forEach(function(r) { map[r.key] = r.value; });
  var slug = map['store_slug'] || '';
  var url = slug ? '/s/' + slug + '/staff/orders' : '/staff/orders';

  var payload = JSON.stringify({ title: 'New Order', body: orderNumber + ' — tap to view', url: url });

  var expiredEndpoints = [];
  subs.forEach(function(sub) {
    try {
      var res = UrlFetchApp.fetch(workerUrl, {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify({
          endpoint: sub.endpoint,
          p256dh: sub.keys_p256dh,
          auth: sub.keys_auth,
          payload: payload,
        }),
        muteHttpExceptions: true,
      });
      var resBody = res.getContentText();
      if (resBody.indexOf('410') !== -1) {
        expiredEndpoints.push(sub.endpoint);
      }
    } catch(e) {
      Logger.log('Push send error: ' + e.message);
    }
  });

  if (expiredEndpoints.length) {
    var s = sheet('Subscriptions');
    var data = s.getDataRange().getValues();
    for (var i = data.length - 1; i >= 1; i--) {
      if (expiredEndpoints.indexOf(data[i][0]) !== -1) {
        s.deleteRow(i + 1);
      }
    }
    invalidateCache('Subscriptions');
  }
}

function incrementOrderCounts(items) {
  if (!items || !items.length) return;
  var s = sheet('Products');
  var data = s.getDataRange().getValues();
  var headers = data[0];
  var idCol = headers.indexOf('id');
  var countCol = headers.indexOf('order_count');
  if (idCol === -1 || countCol === -1) return;

  var qtyMap = {};
  items.forEach(function(item) {
    qtyMap[item.product_id] = (qtyMap[item.product_id] || 0) + (item.qty || 1);
  });

  var updates = [];
  for (var i = 1; i < data.length; i++) {
    var pid = data[i][idCol];
    if (qtyMap[pid]) {
      data[i][countCol] = (Number(data[i][countCol]) || 0) + qtyMap[pid];
      updates.push({ row: i + 1, col: countCol + 1, val: data[i][countCol] });
    }
  }

  updates.forEach(function(u) {
    s.getRange(u.row, u.col).setValue(u.val);
  });

  // Invalidate product cache since order_counts changed
  invalidateProductCache();
}

// ============================================================
//  keepWarm — called by time-based trigger every 10 minutes
// ============================================================
function keepWarm() {
  // intentionally empty — keeps GAS warm
}

// ============================================================
//  Stores — slug → Web App URL, stored in developer sheet
// ============================================================
function getRegistrySheet() {
  var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('SPREADSHEET_ID not set in Script Properties');
  return SpreadsheetApp.openById(id).getSheetByName('Registry');
}

function getStoreUrl(slug) {
  if (!slug) return err('slug required');
  var s = getRegistrySheet();
  var rows = s.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === slug) return ok({ url: rows[i][1] });
  }
  return err('Store not found');
}

function registerStore(slug, url) {
  if (!slug || !url) return err('slug and url required');
  var s = getRegistrySheet();
  var rows = s.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === slug) {
      s.getRange(i + 1, 2).setValue(url);
      return ok();
    }
  }
  s.appendRow([slug, url]);
  return ok();
}
