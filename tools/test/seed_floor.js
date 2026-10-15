/* Put a realistic moment in the test database: two sticks on tables, an add-on, an online order. */
var shim = require('./shim');
function rpc(fn, body, authed) { var r = shim.handle('POST', '/rest/v1/rpc/' + fn, {}, body, authed !== false); if (r.status >= 300) { throw new Error(fn + ': ' + JSON.stringify(r.json)); } return r.json; }
function one(sql) { return shim.psql(sql).out; }
exports.seed = function () {
  var id = function (n) { return one("select id from items where active and name->>'en'='" + n + "'"); };
  var ing = function (n) { return one("select id from ingredients where name->>'en'='" + n + "'"); };
  var tbl = function (l) { return one("select id from tables where label='" + l + "'"); };
  var plate = id('Full plate'), toast = id('Avocado toast'), latte = id('Iced latte'), latte2 = id('Latte'), bagel = id('Josie bagel'), bacon = ing('Bacon'), egg = ing('Egg'), tomato = ing('Tomato');
  var now = new Date().toISOString(), u = function (n) { return '00000000-0000-0000-0000-0000000000' + ('0' + n).slice(-2); };
  rpc('sync_order2', { p: { order: { id: u(1), device: 'A', number: '4', customer_name: 'Ana', order_type: 'here', status: 'paid', subtotal: 330, total: 330, tax: 43, staff_name: 'Dorcas', created_at: new Date(Date.now() - 6 * 60000).toISOString(), paid_at: now, has_bar: false, has_kitchen: true, stick_number: 4, diets: ['kosher_style'] },
    pieces: [{ id: u(11), station: 'kitchen', kind: 'original' }],
    items: [{ id: u(21), item_id: plate, name: 'Full plate', qty: 1, unit_price: 185, station: 'kitchen', piece_id: u(11), chips: [{ type: 'no', ingredient_id: bacon, diet: 'kosher_style' }] },
            { id: u(22), item_id: toast, name: 'Avocado toast', qty: 1, unit_price: 145, station: 'kitchen', piece_id: u(11), chips: [{ type: 'no', ingredient_id: egg }, { type: 'add', ingredient_id: tomato }] }],
    payments: [{ id: u(31), method: 'cash_hnl', amount: 330 }] } });
  rpc('place_stick', { p: { stick: 4, table_id: tbl('3') } });
  rpc('sync_order2', { p: { order: { id: u(2), device: 'A', number: '9', customer_name: 'Luis', order_type: 'here', status: 'open', total: 140, created_at: new Date(Date.now() - 2 * 60000).toISOString(), has_bar: true, has_kitchen: false, stick_number: 9 },
    pieces: [{ id: u(12), station: 'bar', kind: 'original' }],
    items: [{ id: u(23), item_id: latte, name: 'Iced latte', qty: 1, unit_price: 75, station: 'bar', piece_id: u(12), chips: [] }, { id: u(24), item_id: latte2, name: 'Latte', qty: 1, unit_price: 65, station: 'bar', piece_id: u(12), chips: [] }] } });
  rpc('place_stick', { p: { stick: 9, table_id: tbl('5') } });
  rpc('sync_order2', { p: { order: { id: u(3), device: 'A', number: '4+', customer_name: 'Ana', order_type: 'here', status: 'open', total: 75, created_at: new Date(Date.now() - 60000).toISOString(), has_bar: true, has_kitchen: false, stick_number: 4 },
    pieces: [{ id: u(13), station: 'bar', kind: 'addon' }], items: [{ id: u(25), item_id: latte, name: 'Iced latte', qty: 1, unit_price: 75, station: 'bar', piece_id: u(13), chips: [] }] } });
  rpc('sync_order2', { p: { order: { id: u(4), device: 'A', number: '7', customer_name: 'Marta', order_type: 'here', status: 'paid', total: 150, created_at: now, paid_at: now, has_bar: false, has_kitchen: true, stick_number: 7 },
    pieces: [{ id: u(14), station: 'kitchen', kind: 'original' }], items: [{ id: u(26), item_id: bagel, name: 'Josie bagel', qty: 1, unit_price: 150, station: 'kitchen', piece_id: u(14), chips: [] }], payments: [{ id: u(32), method: 'cash_hnl', amount: 150 }] } });
  rpc('place_stick', { p: { stick: 7, table_id: null } });
  rpc('place_online_order2', { p: { id: '00000000-0000-0000-0000-0000000000f1', name: 'Sam', order_type: 'togo', lines: [{ item_id: latte, qty: 2 }, { item_id: bagel, qty: 1 }] } }, false);
};
if (require.main === module) { require('./harness').reset(); exports.seed(); console.log('seeded'); }
