
class ICConfig {
    
    constructor(board, sx, sy, name) {
        this.board = board;
        this.title = 'IC (0.' + (sy-1) + '" row spacing)';
        this.sx = sx;
        this.sy = sy;
        this.name = name;
    }

    getToolName() { return this.title;  }
    
    getDefaultSize() { return { sx:this.sx, sy:this.sy }; }
    
    getDefaultInfo() {
        return {
            name: this.name,
        };
    }
    
    prepareConfig(el, options) {
        this.config_element = el;
        
        let edit_npins = document.getElementById('ic-config-npins');
        edit_npins.value = 2*el.sx;

        let edit_name = document.getElementById('ic-config-name');
        edit_name.value = el.info.name;

        let edit_rot = document.getElementById('ic-config-rot');
        while (edit_rot.options.length > 0) edit_rot.remove(0);
        for (let rot of this.board.getElementAllowedRotations(el)) {
            edit_rot.add(new Option(rot*90, rot, rot==el.rot, rot==el.rot));
        }
        
        options.panel = document.getElementById('ic-config');
        options.focus = edit_npins;
    }

    confirm() {
        let edit_npins = document.getElementById('ic-config-npins');
        this.config_element.sx = Math.floor(parseInt(edit_npins.value)/2);

        let edit_name = document.getElementById('ic-config-name');
        this.config_element.info.name = edit_name.value;

        let edit_rot = document.getElementById('ic-config-rot');
        this.board.rotateElement(this.config_element, parseInt(edit_rot.value));
        
        this.board.closePopup();
    }
    
    handleKeyPress() {
        switch (event.key) {
        case 'Enter':  this.confirm(); break;
        default:       /* console.log(event); */ break;
        }
    }

    draw(ctx, el) {
        ctx.fillStyle = '#555';
        ctx.beginPath();
        ctx.arc(-this.board.hole_size/2, el.sy*this.board.hole_size/2-this.board.hole_size/2, el.sy*1.5, -Math.PI/2, Math.PI/2);
        ctx.fill();
        
        if (! el.info) return;
        ctx.font = 'bold 14px monospace';
        ctx.textBaseline = 'middle'; 
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.fillText(el.info.name, (el.sx-1)*this.board.hole_size/2, (el.sy-1)*this.board.hole_size/2);
    }
    
}
