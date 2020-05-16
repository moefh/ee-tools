
const led_table = [
    { num: 0,  color: '#ff0000',  fg: '#fff',  name: "Red",           voltage: 1.9 },
    { num: 1,  color: '#ffff00',  fg: '#000',  name: "Yellow",        voltage: 2.0 },
    { num: 2,  color: '#00ff00',  fg: '#000',  name: "Green (fat)",   voltage: 2.0 },
    { num: 3,  color: '#00ff00',  fg: '#000',  name: "Green (slim)",  voltage: 2.6 },
    { num: 4,  color: '#0000ff',  fg: '#fff',  name: "Blue",          voltage: 2.8 },
    { num: 5,  color: '#ffffff',  fg: '#000',  name: "White",         voltage: 2.8 },
];

function $(id) {
    let el = document.getElementById(id);
    if (el == null) throw "element '" + id + "' not found";
    return el;
}

function calculate_resistor(led_voltage) {
    let current        = parseFloat($('led-current').value) / 1000;
    let supply_voltage = parseFloat($('supply-voltage').value);

    if (led_voltage > supply_voltage) return 0;

    return (supply_voltage - led_voltage) / current;
}

function update_values() {
    $('custom-resistor-value').textContent = Math.round(calculate_resistor(parseFloat($('custom-led-voltage-input').value)));
    for (let led_info of led_table) {
        $('resistor-value-' + led_info.num).textContent = Math.round(calculate_resistor(parseFloat(led_info.voltage)));
    }
}

function add_led_editor(info) {
    if (info.voltage === null) return;

    let tr = document.createElement('tr');

    let td_name = document.createElement('td');
    td_name.textContent           = info.name;
    td_name.style.backgroundColor = info.color;
    td_name.style.color           = info.fg;
    tr.appendChild(td_name);

    let td_voltage = document.createElement('td');
    td_voltage.className   = 'tt center';
    td_voltage.textContent = info.voltage.toFixed(2) + ' V';
    tr.appendChild(td_voltage);

    let td_res = document.createElement('td');
    td_res.className = 'tt center';
    let span_res = document.createElement('span');
    span_res.id        = 'resistor-value-' + info.num;
    span_res.className = 'tt';
    td_res.appendChild(span_res);
    td_res.appendChild(document.createTextNode(' \u2126'));
    tr.appendChild(td_res);

    $('led-table').getElementsByTagName('tbody')[0].appendChild(tr);
}

function init() {
    $('supply-voltage-dropdown').onchange = () => {
        $('supply-voltage').value = $('supply-voltage-dropdown').value;
        update_values();
    };
    $('led-current-dropdown').onchange = () => {
        $('led-current').value = $('led-current-dropdown').value;
        update_values();
    };
    $('custom-led-voltage-input').onchange = () => {
        update_values();
    };
    $('supply-voltage').onchange = update_values;
    $('led-current').onchange = update_values;

    for (let led_info of led_table) {
        add_led_editor(led_info);
    }

    update_values();
}
