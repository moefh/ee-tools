
class NoConfig {
    
    constructor(board, sx, sy, title) {
        this.board = board;
        this.title = title;
        this.sx = sx;
        this.sy = sy;
    }

    getToolName() { return this.title;  }
    
    getDefaultSize() { return { sx:this.sx, sy:this.sy }; }
    
    getDefaultInfo() {
        return {};
    }
    
    prepareConfig(el, options) {
        return false;
    }

    draw(ctx, el) {
    }
    
}
