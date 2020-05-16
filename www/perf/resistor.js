
class ResistorConfig {

    constructor(board) {
        this.board = board;
    }

    getToolName() { return 'Resistor';  }

    getDefaultSize() { return { sx:4, sy:1 }; }
    
    getDefaultInfo() {
        return {
            val: 1000,
        };
    }
    
    prepareConfig(el, options) {
        this.config_element = el;
        
        let edit_value = document.getElementById('resistor-config-value');
        edit_value.value = this.unparseValue(el.info.val);

        let edit_rot = document.getElementById('resistor-config-rot');
        while (edit_rot.options.length > 0) edit_rot.remove(0);
        for (let rot of this.board.getElementAllowedRotations(el)) {
            edit_rot.add(new Option(rot*90, rot, rot==el.rot, rot==el.rot));
        }
        
        options.panel = document.getElementById('resistor-config');
        options.focus = edit_value;
    }

    // return human-readable version of resistor value (e.g. "1000" -> "1K")
    unparseValue(val) {
        if (val >= 1000000) return (val/1000000) + 'M';
        if (val >= 1000) return (val/1000) + 'K';
        return val;
    }

    // return number for resistor value text (e.g. "1k" -> 1000)
    parseValue(val) {
        val = (val + "").trim();
        if (val.endsWith('M')) return parseFloat(val) * 1000000;
        if (val.endsWith('K') || val.endsWith('k')) return parseFloat(val) * 1000;
        return parseFloat(val);
    }

    handleKeyPress() {
        switch (event.key) {
        case 'Enter':  this.confirm(); break;
        default:       /* console.log(event); */ break;
        }
    }

    confirm() {
        let edit_value = document.getElementById('resistor-config-value');
        this.config_element.info.val = this.parseValue(edit_value.value);

        let edit_rot = document.getElementById('resistor-config-rot');
        this.board.rotateElement(this.config_element, parseInt(edit_rot.value));
        
        this.board.closePopup();
    }

    // ===========================================================================
    // === draw ==================================================================

    getResistorDigitColor(n) {
        switch (n) {
        case 0:  return '#000000';
        case 1:  return '#663800';
        case 2:  return '#c00000';
        case 3:  return '#ee7700';
        case 4:  return '#cccc00';
        case 5:  return '#009933';
        case 6:  return '#0000aa';
        case 7:  return '#8800aa';
        case 8:  return '#555555';
        case 9:  return '#dddddd';
        default: return '#000';
        }
    }
    
    getResistorColors(val) {
        let digits = parseInt(val).toString();
        let c = [
            (digits.length < 1) ? 0 : parseInt(digits[0]),
            (digits.length < 2) ? 0 : parseInt(digits[1]),
            (digits.length < 3) ? 0 : parseInt(digits.length-2),
        ];
        return c.map((n) => this.getResistorDigitColor(n));
    }

    draw(ctx, el) {
        let colors = this.getResistorColors((el.info) ? el.info.val : 1000);
        ctx.fillStyle = colors[0];
        ctx.fillRect(11, 2-this.board.hole_size/2, 2, this.board.hole_size-5); 
        ctx.fillRect(13, 3-this.board.hole_size/2, 2, this.board.hole_size-7);
        ctx.fillStyle = colors[1];
        ctx.fillRect(18, 4-this.board.hole_size/2, 4, this.board.hole_size-9); 
        ctx.fillStyle = colors[2];
        ctx.fillRect(25, 4-this.board.hole_size/2, 4, this.board.hole_size-9); 
    }
        
}
