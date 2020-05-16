
class LEDConfig {
    
    constructor(board) {
        this.board = board;

        this.colors = {
            'red'    : [ 220,   0,   0 ],
            'green'  : [   0, 220,   0 ],
            'blue'   : [   0,   0, 220 ],
            'yellow' : [ 220, 220,   0 ],
            'white'  : [ 200, 200, 200 ],
        };
    }

    getToolName() { return 'LED';  }

    getDefaultSize() { return { sx:2, sy:1 }; }
    
    getDefaultInfo() {
        return {
            size: 2,
            color: 'red',
        };
    }
    
    prepareConfig(el, options) {
        this.config_element = el;
        
        let edit_size = document.getElementById('led-config-size');
        edit_size.value = el.info.size;

        let edit_color = document.getElementById('led-config-color');
        edit_color.value = el.info.color;

        let edit_rot = document.getElementById('led-config-rot');
        while (edit_rot.options.length > 0) edit_rot.remove(0);
        for (let rot of this.board.getElementAllowedRotations(el)) {
            edit_rot.add(new Option(rot*90, rot, rot==el.rot, rot==el.rot));
        }
        
        options.panel = document.getElementById('led-config');
        options.focus = null;
    }

    handleKeyPress() {
        switch (event.key) {
        case 'Enter':  this.confirm(); break;
        default:       /* console.log(event); */ break;
        }
    }

    confirm() {
        let edit_size = document.getElementById('led-config-size');
        this.config_element.info.size = edit_size.value;
        
        let edit_color = document.getElementById('led-config-color');
        this.config_element.info.color = edit_color.value;

        let edit_rot = document.getElementById('led-config-rot');
        this.board.rotateElement(this.config_element, parseInt(edit_rot.value));
        
        this.board.closePopup();
    }

    // ===========================================================================
    // === draw ==================================================================

    drawArc(ctx, mode, cx, cy, radius, start, end, color) {
        //console.log(color, '->', '#' + color.map(n => ('00' + n.toString(16)).substr(-2)).join(''));
        if (mode == 'fill') {
            ctx.lineWidth = 4;
            ctx.fillStyle = '#' + color.map(n => ('00' + n.toString(16)).substr(-2)).join('');
        } else
            ctx.strokeStyle = '#' + color.map(n => ('00' + n.toString(16)).substr(-2)).join('');
        
        ctx.beginPath();
        ctx.arc(cx, cy, radius, start, end);
        if (mode == 'fill')
            ctx.fill();
        else
            ctx.stroke();
    }

    clamp(val, low, high) {
        return (val < low) ? low : (val > high) ? high : val;
    }
    
    draw(ctx, el) {
        let radius = (el.info && el.info.size == 1) ? 10 : 18;
        let color = (el.info && this.colors[el.info.color]) ? this.colors[el.info.color] : this.colors.red;

        //console.log('drawing with color', color, (el.info) ? el.info.color : 'default');
        
        let low_color = color.map((c) => Math.floor(c*0.8));
        let high_color = color.map((c) => this.clamp(c+192, 0, 255));

        let cx = el.sx*this.board.hole_size/2-this.board.hole_size/2;
        let cy = el.sy*this.board.hole_size/2-this.board.hole_size/2;

        this.drawArc(ctx, 'fill',   cx, cy,     radius,  0.1*Math.PI, -0.1*Math.PI, low_color);
        this.drawArc(ctx, 'fill',   cx, cy, 0.8*radius,  0.1*Math.PI, -0.1*Math.PI, color);
        this.drawArc(ctx, 'stroke', cx, cy, 0.5*radius,  1.1*Math.PI - el.rot/2*Math.PI,  1.5*Math.PI - el.rot/2*Math.PI, high_color);
    }
        
}
