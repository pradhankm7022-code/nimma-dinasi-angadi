// ============================================================
//  Nimma Dinasi Angadi — Google Apps Script Backend
//  Deploy as: Web App → Execute as Me → Anyone can access
// ============================================================

var SS = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID'));

// Sheet helpers
function sheet(name) { return SS.getSheetByName(name); }

function sheetData(name) {
  var s = sheet(name);
  var rows = s.getDataRange().getValues();
  var headers = rows[0];
  return rows.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) { obj[h] = row[i]; });
    return obj;
  });
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
//  Single GET handler — all actions to avoid CORS preflight
//  Complex params are JSON-encoded as query string values
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
    if (action === 'getBootstrap')         return getBootstrap();
    if (action === 'getSettings')         return getSettings();
    if (action === 'getProducts')         return getProducts();
    if (action === 'getMyOrders')         return getMyOrders(p.customerId);
    if (action === 'getAllOrders')         return getAllOrders();
    if (action === 'signUp')              return signUp({ name: p.name, email: p.email, password: p.password, phone: p.phone });
    if (action === 'signIn')              return signIn({ email: p.email, password: p.password });
    if (action === 'forgotPassword')      return forgotPassword({ email: p.email });
    if (action === 'verifyOTP')           return verifyOTP({ email: p.email, otp: p.otp, newPassword: p.newPassword });
    if (action === 'placeOrder')          return placeOrder({ customerId: p.customerId, items: p.items });
    if (action === 'updateOrderStatus')   return updateOrderStatus({ orderId: p.orderId, status: p.status });
    if (action === 'finishBagging')       return finishBagging({ orderId: p.orderId, items: p.items });
    if (action === 'staffLogin')          return staffLogin({ pin: p.pin });
    if (action === 'createProduct')       return createProduct({ name_en: p.name_en, name_kn: p.name_kn, category_id: p.category_id, image_url: p.image_url, in_stock: p.in_stock, variants: p.variants, search_keys: p.search_keys });
    if (action === 'updateProduct')       return updateProduct({ id: p.id, name_en: p.name_en, name_kn: p.name_kn, category_id: p.category_id, image_url: p.image_url, in_stock: p.in_stock, variants: p.variants, search_keys: p.search_keys });
    if (action === 'deleteProduct')       return deleteProduct({ id: p.id });
    if (action === 'createCategory')      return createCategory({ name: p.name, image_url: p.image_url });
    if (action === 'updateCategory')      return updateCategory({ id: p.id, name: p.name, image_url: p.image_url });
    if (action === 'deleteCategory')      return deleteCategory({ id: p.id });
    if (action === 'savePushSubscription') return savePushSubscription({ subscription: p.subscription });
    return err('Unknown action: ' + action);
  } catch (ex) {
    return err(ex.message);
  }
}

// Combined bootstrap — settings + categories + products in one call
function getBootstrap() {
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

  return ok({
    store_name: map['store_name'] || 'Nimma Dinasi Angadi',
    store_logo_url: map['store_logo_url'] || '',
    staff_pin: map['staff_pin'] || '0000',
    categories: categories,
    products: products,
  });
}

function getSettings() {
  var rows = sheetData('Settings');
  var map = {};
  rows.forEach(function(r) { map[r.key] = r.value; });

  var catRows = sheetData('Categories');
  var categories = catRows.map(function(r) {
    return { id: r.id, name: r.name, name_kn: r.name_kn || r.name, image_url: r.image_url };
  });

  return ok({
    store_name: map['store_name'] || 'Nimma Dinasi Angadi',
    store_logo_url: map['store_logo_url'] || '',
    categories: categories,
    staff_pin: map['staff_pin'] || '0000',
  });
}

// ============================================================
//  Products
// ============================================================
function getProducts() {
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
  return ok({ products: products });
}

function createCategory(body) {
  var s = sheet('Categories');
  var id = uuid();
  s.appendRow([id, body.name, body.image_url || '']);
  return ok({ id: id });
}

function updateCategory(body) {
  var s = sheet('Categories');
  var data = s.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === body.id) {
      s.getRange(i + 1, 1, 1, 3).setValues([[body.id, body.name, body.image_url || '']]);
      return ok();
    }
  }
  return err('Category not found');
}

function deleteCategory(body) {
  var s = sheet('Categories');
  var data = s.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === body.id) {
      s.deleteRow(i + 1);
      return ok();
    }
  }
  return err('Category not found');
}

function createProduct(body) {
  var s = sheet('Products');
  var id = uuid();
  s.appendRow([
    id, body.name_en, body.name_kn, body.category_id, body.image_url || '',
    body.in_stock ? 'TRUE' : 'FALSE',
    JSON.stringify(body.variants || []),
    body.search_keys || '',
    0,
  ]);
  return ok({ id: id });
}

function updateProduct(body) {
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
      return ok();
    }
  }
  return err('Product not found');
}

function deleteProduct(body) {
  var s = sheet('Products');
  var data = s.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === body.id) {
      s.deleteRow(i + 1);
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
  return ok({ user: { id: id, name: body.name, email: body.email, phone: body.phone } });
}

function signIn(body) {
  var users = sheetData('Users');
  var user = users.find(function(u) {
    return u.email === body.email && u.password_hash === hashPassword(body.password);
  });
  if (!user) return err('Invalid email or password');
  return ok({ user: { id: user.id, name: user.name, email: user.email, phone: user.phone } });
}

function forgotPassword(body) {
  var users = sheetData('Users');
  var user = users.find(function(u) { return u.email === body.email; });
  if (!user) return err('No account with that email');

  var otp = Math.floor(100000 + Math.random() * 900000).toString();
  var expiry = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

  // Update OTP columns (7 = otp, 8 = otp_expiry, 1-indexed)
  var s = sheet('Users');
  var data = s.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][2] === body.email) {
      s.getRange(i + 1, 7, 1, 2).setValues([[otp, expiry]]);
      break;
    }
  }

  GmailApp.sendEmail(body.email, 'Your OTP - Nimma Dinasi Angadi',
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
      if (storedOTP !== body.otp) return err('Invalid OTP');
      if (new Date() > expiry) return err('OTP expired');
      // Update password and clear OTP
      s.getRange(i + 1, 4, 1, 3).setValues([[hashPassword(body.newPassword), '', '']]);
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
  return ok();
}

// ============================================================
//  Orders
// ============================================================
function placeOrder(body) {
  var s = sheet('Orders');
  var id = uuid();

  // Generate order number NDA-YYYY-NNNN
  var existing = s.getLastRow() - 1;
  var year = new Date().getFullYear();
  var seq = String(existing + 1).padStart(4, '0');
  var orderNumber = 'NDA-' + year + '-' + seq;

  s.appendRow([
    id, orderNumber, body.customerId,
    JSON.stringify(body.items), 'Pending', new Date().toISOString(),
  ]);
  // Increment order_count for each ordered product
  incrementOrderCounts(body.items);
  try { notifyStaff(orderNumber); } catch(e) { Logger.log('notifyStaff error: ' + e); }
  return ok({ order_number: orderNumber });
}

function getMyOrders(customerId) {
  var rows = sheetData('Orders');
  var orders = rows
    .filter(function(r) { return r.customer_id === customerId; })
    .map(parseOrder)
    .sort(function(a, b) { return new Date(b.created_at) - new Date(a.created_at); });
  return ok({ orders: orders });
}

function getAllOrders() {
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
  return ok({ orders: orders });
}

function parseOrder(r) {
  var items = [];
  try { items = JSON.parse(r.items_json || '[]'); } catch(e) {}
  return {
    id: r.id,
    order_number: r.order_number,
    customer_id: r.customer_id,
    items: items,
    status: r.status,
    created_at: r.created_at,
  };
}

function updateOrderStatus(body) {
  var s = sheet('Orders');
  var data = s.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === body.orderId) {
      s.getRange(i + 1, 5).setValue(body.status);
      return ok();
    }
  }
  return err('Order not found');
}

function finishBagging(body) {
  var s = sheet('Orders');
  var data = s.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === body.orderId) {
      s.getRange(i + 1, 4).setValue(JSON.stringify(body.items));
      s.getRange(i + 1, 5).setValue('Ready');
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
  // Upsert by endpoint
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === sub.endpoint) {
      s.getRange(i + 1, 1, 1, 4).setValues([[
        sub.endpoint, sub.keys.p256dh, sub.keys.auth, new Date().toISOString()
      ]]);
      return ok();
    }
  }
  s.appendRow([sub.endpoint, sub.keys.p256dh, sub.keys.auth, new Date().toISOString()]);
  return ok();
}

function notifyStaff(orderNumber) {
  var subs = sheetData('Subscriptions');
  if (!subs.length) return;
  var props = PropertiesService.getScriptProperties().getProperties();
  var workerUrl = props['PUSH_WORKER_URL'];
  if (!workerUrl) { Logger.log('PUSH_WORKER_URL not set'); return; }
  var payload = JSON.stringify({ title: 'New Order', body: orderNumber + ' — tap to view' });
  subs.forEach(function(sub) {
    try {
      UrlFetchApp.fetch(workerUrl, {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify({
          endpoint: sub.endpoint,
          p256dh: sub.keys_p256dh,
          auth: sub.keys_auth,
          payload: payload
        }),
        muteHttpExceptions: true,
      });
    } catch(e) {
      Logger.log('Push send error: ' + e.message);
    }
  });
}

function incrementOrderCounts(items) {
  if (!items || !items.length) return;
  var s = sheet('Products');
  var data = s.getDataRange().getValues();
  var headers = data[0];
  var idCol = headers.indexOf('id');
  var countCol = headers.indexOf('order_count');
  if (idCol === -1 || countCol === -1) return;
  items.forEach(function(item) {
    for (var i = 1; i < data.length; i++) {
      if (data[i][idCol] === item.product_id) {
        var current = Number(data[i][countCol]) || 0;
        s.getRange(i + 1, countCol + 1).setValue(current + 1);
        data[i][countCol] = current + 1; // update local cache to avoid double-increment
        break;
      }
    }
  });
}

