
let res_cur_selection = [ 1, 0, 2, 10 ];

const si_prefixes = [
    { exp: -3, name: 'm' },
    { exp:  0,  name: ''  },
    { exp:  3,  name: 'k' },
    { exp:  6,  name: 'M' },
    { exp:  9,  name: 'G' },
];

const res_bands = [
    { num: 0, type: 'digit',       },
    { num: 1, type: 'digit',       },
    { num: 2, type: 'multiplier',  },
    { num: 3, type: 'tolerance',   },
];

const res_colors = [
    { num: 0,   name: 'black',   color: '#000000',  bg: '#fff',  digit: 0,     mult: 1e00,  tolerance: null  },
    { num: 1,   name: 'brown',   color: '#663800',  bg: '#fff',  digit: 1,     mult: 1e01,  tolerance: 1     },
    { num: 2,   name: 'red',     color: '#c00000',  bg: '#fff',  digit: 2,     mult: 1e02,  tolerance: 2     },
    { num: 3,   name: 'orange',  color: '#ee7700',  bg: '#000',  digit: 3,     mult: 1e03,  tolerance: 0.05  },
    { num: 4,   name: 'yellow',  color: '#cccc00',  bg: '#000',  digit: 4,     mult: 1e04,  tolerance: 0.02  },
    { num: 5,   name: 'green',   color: '#009933',  bg: '#000',  digit: 5,     mult: 1e05,  tolerance: 0.5   },
    { num: 6,   name: 'blue',    color: '#0000aa',  bg: '#fff',  digit: 6,     mult: 1e06,  tolerance: 0.25  },
    { num: 7,   name: 'violet',  color: '#8800aa',  bg: '#fff',  digit: 7,     mult: 1e07,  tolerance: 0.1   },
    { num: 8,   name: 'grey',    color: '#555555',  bg: '#fff',  digit: 8,     mult: 1e08,  tolerance: 0.05  },
    { num: 9,   name: 'white',   color: '#dddddd',  bg: '#000',  digit: 9,     mult: 1e09,  tolerance: null  },
    { num: 10,  name: 'gold',    color: '#b1a700',  bg: '#000',  digit: null,  mult: 1e-1,  tolerance: 5     },
    { num: 11,  name: 'silver',  color: '#ccccdd',  bg: '#000',  digit: null,  mult: 1e-2,  tolerance: 10    },
];

function format_resistance(number) {
    let exp = 0;

    while (number < 1 && exp > -3) {
        exp -= 3;
        number *= 1000;
    }
    while (number >= 1000 && exp < 9) {
        exp += 3;
        number /= 1000;
    }

    for (let prefix of si_prefixes) {
        if (exp == prefix.exp) {
            return number + ' ' + prefix.name;
        }
    }
    return number + ' ';
}

function calc_resistor_value() {
    var resistance = ((res_colors[res_cur_selection[0]].digit * 10 + res_colors[res_cur_selection[1]].digit) * 
                      res_colors[res_cur_selection[2]].mult);
    var tolerance = res_colors[res_cur_selection[3]].tolerance;

    document.getElementById('resistor-value-resistance').textContent = format_resistance(resistance);
    document.getElementById('resistor-value-tolerance').textContent = tolerance;
}

function apply_band_color(band, color) {
    res_cur_selection[band.num] = color.num;
    
    let band_el = document.getElementById("band" + band.num);
    let edit_el = document.getElementById("edit" + band.num);
    let disp_el = document.getElementById("disp" + band.num);
    band_el.style.backgroundColor = color.color;

    switch (band.type) {
    case 'digit':      disp_el.textContent = color.digit; break;
    case 'multiplier': disp_el.innerHTML = "10<sup>" + Math.log10(color.mult) + "</sup>"; break;
    case 'tolerance':  disp_el.textContent = color.tolerance + '%'; break;
    default:           disp_el.textContent = '?'; break;
    }

    calc_resistor_value();
}

function color_shows_in_band(color, band) {
    switch (band.type) {
    case 'digit':      return color.digit !== null;
    case 'multiplier': return color.mult !== null;
    case 'tolerance':  return color.tolerance !== null;
    default:           return false;
    }
}

function build_band_editor(band) {
    let band_el = document.getElementById("band" + band.num);
    let edit_el = document.getElementById("edit" + band.num);

    if (! band_el || ! edit_el) {
        console.log("ERROR: can't find divs for band", band.num);
        return;
    }

    band_el.style.backgroundColor = res_colors[0].color;

    let display_el = document.createElement('div');
    display_el.id = 'disp' + band.num;
    display_el.className = 'band-editor-display';
    edit_el.appendChild(display_el);
    
    for (let color of res_colors) {
        let color_el = document.createElement('div');

        if (color_shows_in_band(color, band)) {
            color_el.className = 'band-editor';
            color_el.style.backgroundColor = color.color;
            color_el.style.color = color.bg;
            color_el.textContent = color.name;
            color_el.onclick = () => {
                apply_band_color(band, color);
            };
        } else {
            color_el.className = 'band-editor-space';
        }
        
        edit_el.appendChild(color_el);
    }
}

function init() {
    for (let band of res_bands) {
        build_band_editor(band);
        apply_band_color(band, res_colors[res_cur_selection[band.num]]);
    }
}
