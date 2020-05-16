
class ECapConfig {

    constructor(board, sx, sy) {
        this.board = board;
        this.title =  'Electrolytic Capacitor (' + ((sy == 1) ? 'thin' : 'fat') + ')';
        this.sx = sx;
        this.sy = sy;
    }

    getToolName() { return this.title;  }
    
    getDefaultSize() { return { sx:this.sx, sy:this.sy }; }
    
    getDefaultInfo() {
        return {
            value : 0.000470,
        };
    }

    prepareConfig(el, options) {
        this.config_element = el;
        
        let edit_value = document.getElementById('ecap-config-value');
        edit_value.value = this.board.unparseSIValue(el.info.value);

        let edit_rot = document.getElementById('ecap-config-rot');
        while (edit_rot.options.length > 0) edit_rot.remove(0);
        for (let rot of this.board.getElementAllowedRotations(el)) {
            edit_rot.add(new Option(rot*90, rot, rot==el.rot, rot==el.rot));
        }
        
        options.panel = document.getElementById('ecap-config');
        options.focus = edit_value;
        return true;
    }

    confirm() {
        let edit_value = document.getElementById('ecap-config-value');
        this.config_element.info.value = this.board.parseSIValue(edit_value.value);

        let edit_rot = document.getElementById('ecap-config-rot');
        this.board.rotateElement(this.config_element, parseInt(edit_rot.value));
        
        this.board.closePopup();
    }

    handleKeyPress() {
        switch (event.key) {
        case 'Enter':  this.confirm(); break;
        default:       /* console.log(event); */ break;
        }
    }

    drawArc(ctx, cx, cy, radius, start, end, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, start, end);
        ctx.lineTo(cx, cy);
        ctx.fill();
    }
    
    draw(ctx, el) {
        let radius = (el.sy == 1) ? 15 : 26;

        let neg1 = (el.sy == 1) ? -0.15*Math.PI : -0.15*Math.PI + Math.PI/4;
        let neg2 = (el.sy == 1) ?  0.15*Math.PI :  0.15*Math.PI + Math.PI/4;

        let cx = el.sx*this.board.hole_size/2-this.board.hole_size/2;
        let cy = el.sy*this.board.hole_size/2-this.board.hole_size/2;
        
        this.drawArc(ctx, cx, cy, radius,     0,    2*Math.PI,  '#000');
        this.drawArc(ctx, cx, cy, radius,     neg1, neg2,       '#888');
        this.drawArc(ctx, cx, cy, radius/1.5, 0,    2*Math.PI,  '#bbb');

        if (el.sy == 2) {
            ctx.strokeStyle = '#ccc';
            ctx.beginPath();
            ctx.moveTo(cx, cy-radius/1.5);
            ctx.lineTo(cx, cy+radius/1.5);
            ctx.moveTo(cx-radius/1.5, cy);
            ctx.lineTo(cx+radius/1.5, cy);
            ctx.stroke();
        }
    }
    
}
