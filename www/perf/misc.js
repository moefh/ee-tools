
class MiscConfig {

    constructor(board) {
        this.board = board;
    }

    getToolName() { return 'User Component';  }

    getDefaultSize() { return { sx:3, sy:2 }; }
    
    getDefaultInfo() {
        return {
            name  : '',
            color : '#000',
        };
    }
    
    prepareConfig(el, options) {
        this.config_element = el;
        
        let edit_sx = document.getElementById('other-config-sx');
        edit_sx.value = el.sx;

        let edit_sy = document.getElementById('other-config-sy');
        edit_sy.value = el.sy;

        let edit_name = document.getElementById('other-config-name');
        edit_name.value = el.info.name;

        let edit_color = document.getElementById('other-config-color');
        edit_color.value = el.info.color;

        let edit_rot = document.getElementById('other-config-rot');
        while (edit_rot.options.length > 0) edit_rot.remove(0);
        for (let rot of this.board.getElementAllowedRotations(el)) {
            edit_rot.add(new Option(rot*90, rot, rot==el.rot, rot==el.rot));
        }
        
        options.panel = document.getElementById('other-config');
        options.focus = edit_sx;
        return true;
    }

    confirm() {
        let edit_sx = document.getElementById('other-config-sx');
        this.config_element.sx = parseInt(edit_sx.value);

        let edit_sy = document.getElementById('other-config-sy');
        this.config_element.sy = parseInt(edit_sy.value);

        let edit_name = document.getElementById('other-config-name');
        this.config_element.info.name = edit_name.value;

        let edit_color = document.getElementById('other-config-color');
        this.config_element.info.color = edit_color.value;

        let edit_rot = document.getElementById('other-config-rot');
        this.board.rotateElement(this.config_element, parseInt(edit_rot.value));
        
        this.board.closePopup();
    }

    handleKeyPress() {
        switch (event.key) {
        case 'Enter':  this.confirm(); break;
        default:       /* console.log(event); */ break;
        }
    }

    // ===========================================================================
    // === draw ==================================================================

    draw(ctx, el) {
        ctx.fillStyle = (el.info) ? el.info.color : '#000';
        ctx.fillRect(-this.board.hole_size/2, -this.board.hole_size/2, el.sx*this.board.hole_size, el.sy*this.board.hole_size);

        if (! el.info) return;
        ctx.font = 'bold 14px monospace';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.fillText(el.info.name, (el.sx-1)*this.board.hole_size/2, (el.sy-1)*this.board.hole_size/2);
    }
        
}
