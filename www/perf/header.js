
class HeaderConfig {

    constructor(board, title) {
        this.board = board;
        this.title = title;
    }

    getToolName() { return this.title;  }
    
    getDefaultSize() { return { sx:4, sy:1 }; }
    
    getDefaultInfo() {
        return {};
    }
    
    prepareConfig(el, options) {
        this.config_element = el;
        
        let edit_sx = document.getElementById('header-config-sx');
        edit_sx.value = el.sx;

        let edit_sy = document.getElementById('header-config-sy');
        edit_sy.value = el.sy;
        
        let edit_rot = document.getElementById('header-config-rot');
        while (edit_rot.options.length > 0) edit_rot.remove(0);
        for (let rot of this.board.getElementAllowedRotations(el)) {
            edit_rot.add(new Option(rot*90, rot, rot==el.rot, rot==el.rot));
        }

        let title = document.getElementById('header-config-title');
        title.textContent = this.title;
        
        options.panel = document.getElementById('header-config');
        options.focus = edit_sx;
        return true;
    }

    handleKeyPress() {
        switch (event.key) {
        case 'Enter':  this.confirm(); break;
        default:       /* console.log(event); */ break;
        }
    }

    confirm() {
        let edit_sx = document.getElementById('header-config-sx');
        this.config_element.sx = parseInt(edit_sx.value);

        let edit_sy = document.getElementById('header-config-sy');
        this.config_element.sy = parseInt(edit_sy.value);

        let edit_rot = document.getElementById('header-config-rot');
        this.board.rotateElement(this.config_element, parseInt(edit_rot.value));
        
        this.board.closePopup();
    }
    
    draw(ctx, el) {
    }
    
}
