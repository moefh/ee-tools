
class PopupAbout {

    constructor(board) {
        this.board = board;
    }

    prepare(options) {
        options.panel = document.getElementById('about-popup');
        return true;
    }

    handleKeyPress() {
        if (event.key == 'Enter') this.confirm();
    }

    confirm() {
        this.board.closePopup();
    }
}

class PopupHelp {

    constructor(board) {
        this.board = board;
    }

    prepare(options) {
        document.getElementById('help-popup-text').scrollTop = 0;

        options.panel = document.getElementById('help-popup');
        return true;
    }

    handleKeyPress() {
        if (event.key == 'Enter') this.confirm();
    }

    confirm() {
        this.board.closePopup();
    }
}

class PopupBoardConfig {

    constructor(board) {
        this.board = board;
    }

    prepare(options) {
        document.getElementById('board-config-w').value = this.board.board_w;
        document.getElementById('board-config-h').value = this.board.board_h;
        
        options.panel = document.getElementById('board-config');
        options.focus = document.getElementById('board-config-w');
        return true;
    }

    handleKeyPress() {
        if (event.key == 'Enter') this.confirm();
    }

    confirm() {
        let w = parseInt(document.getElementById('board-config-w').value);
        let h = parseInt(document.getElementById('board-config-h').value);
        if (! isNaN(w) && ! isNaN(h)) {
            this.board.setSize(w, h);
            this.board.draw();
        }
        this.board.closePopup();
    }
    
}

class PopupZoom {

    constructor(board) {
        this.board = board;
    }

    prepare(options) {
        document.getElementById('zoom-config-zoom').value = this.board.scale;
        
        options.panel = document.getElementById('zoom-config');
        options.focus = document.getElementById('zoom-config-zoom');
        return true;
    }

    handleKeyPress() {
        if (event.key == 'Enter') this.confirm();
    }

    confirm() {
        let zoom = parseFloat(document.getElementById('zoom-config-zoom').value);
        if (isNaN(zoom) || zoom < 1 || zoom > 10) {
            alert("Invalid zoom value, must be between 1 and 10");
            return;
        }
        this.board.setSize(this.board.board_w, this.board.board_h, zoom);
        this.board.draw();
        this.board.closePopup();
    }

}

class PopupMenuNew {
    
    constructor(board) {
        this.board = board;
    }

    prepare(options) {
        document.getElementById('board-new-w').value = this.board.board_w;
        document.getElementById('board-new-h').value = this.board.board_h;
        
        options.panel = document.getElementById('new-board-popup');
        options.focus = document.getElementById('board-new-w');
        return true;
    }

    handleKeyPress() {
        if (event.key == 'Enter') this.confirm();
    }

    confirm() {
        let w = parseInt(document.getElementById('board-new-w').value);
        let h = parseInt(document.getElementById('board-new-h').value);
        if (w && h) {
            this.board.closePopup();
            this.board.setSize(w, h);
            this.board.elements = [];
            this.board.draw();
        } else {
            alert('Invalid size');
        }
    }
}

class PopupMenuImport {

    constructor(board) {
        this.board = board;
    }

    prepare(options) {
        document.getElementById('import-popup-data').value = '';
        
        options.panel = document.getElementById('import-popup');
        options.focus = document.getElementById('import-popup-data');
        return true;
    }

    handleKeyPress() {
        if (event.key == 'Enter') this.confirm();
    }

    confirm() {
        if (this.board.importData(document.getElementById('import-popup-data').value)) {
            this.board.closePopup();
        }
    }
}

class PopupMenuExport {

    constructor(board) {
        this.board = board;
    }

    prepare(options) {
        let export_data = document.getElementById('export-popup-data');
        export_data.value = this.board.exportData();
        export_data.setSelectionRange(0, export_data.value.length);

        options.panel = document.getElementById('export-popup');
        options.focus = export_data;
        return true;
    }
    
    handleKeyPress() {
        if (event.key == 'Enter') this.confirm();
    }

    confirm() {
        this.board.closePopup();
    }
}
