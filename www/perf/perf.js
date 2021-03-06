
class Perfboard {

    constructor(canvas) {
        this.ROT_0   = 0;
        this.ROT_90  = 1;
        this.ROT_180 = 2;
        this.ROT_270 = 3;

        this.SHIFT_KEY = 1;
        this.CTRL_KEY  = 2;
        this.ALT_KEY   = 4;

        this.MOUSE_L   = 8;
        this.MOUSE_R   = 16;
        this.MOUSE_M   = 32;

        this.si_prefixes = [ 'f', 'p', 'n', 'u', 'm', '*', 'K', 'M', 'G', 'T', 'P' ];
        
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.popup_handlers = {
            'help'         : new PopupHelp(this),
            'about'        : new PopupAbout(this),
            'board-config' : new PopupBoardConfig(this),
            'zoom-config'  : new PopupZoom(this),
            'menu-new'     : new PopupMenuNew(this),
            'menu-import'  : new PopupMenuImport(this),
            'menu-export'  : new PopupMenuExport(this),
        };
        
        this.tools = {
            'move'          : { name: 'move',          dom: null, is_element: false, title: 'Select'},
            'resistor'      : { name: 'resistor',      dom: null, is_element: true, config: new ResistorConfig(this, 4, 1) },
            'resistor-tall' : { name: 'resistor-tall', dom: null, is_element: true, config: new ResistorConfig(this, 2, 1) },
            'led'           : { name: 'led',           dom: null, is_element: true, config: new LEDConfig(this) }, 
            'ecap-small'    : { name: 'ecap-small',    dom: null, is_element: true, config: new ECapConfig(this, 2, 1) },
            'ecap-big'      : { name: 'ecap-big',      dom: null, is_element: true, config: new ECapConfig(this, 2, 2) },
            'male-header'   : { name: 'male-header',   dom: null, is_element: true, config: new HeaderConfig(this, 'Male Header') },
            'female-header' : { name: 'female-header', dom: null, is_element: true, config: new HeaderConfig(this, 'Female Header') },
            'ic4'           : { name: 'ic4',           dom: null, is_element: true, config: new ICConfig(this,  4, 4, '555') },
            'ic7'           : { name: 'ic7',           dom: null, is_element: true, config: new ICConfig(this, 12, 7, '28C16') },
            'arduino-nano'  : { name: 'arduino-nano',  dom: null, is_element: true, config: new NoConfig(this, 18, 7, 'Arduino Nano') },
            'other'         : { name: 'other',         dom: null, is_element: true, config: new MiscConfig(this) },
        };

        for (let tool_name in this.tools) {
            let tool = this.tools[tool_name];
            tool.dom = document.createElement('div');
            document.getElementById('toolbox').appendChild(tool.dom);
            tool.dom.title = (tool.title !== undefined) ? tool.title : tool.config.getToolName();
            tool.dom.onclick = () => { this.selectTool(tool.name); }
            tool.dom.className = 'tool';
            tool.dom.style.background = "url('img/tool-" + tool.name + ".png') 1px 1px";
            if (tool.is_element) {
                this.loadImage('img/' + tool_name + '.png').then((img) => { tool.img = img; });
            }
        };
        
        this.tool = this.tools.move;
        this.tool_rot = this.ROT_0;
        this.scale = 1.5;
        this.border_w = 0;
        this.border_h = 0;
        this.hole_size = 16;
        this.filename = 'perfboard.txt';
        
        this.elements = [];
        this.floating_element = { type:'none', x:0, y:0, rot:0 };
        this.drag_element = null;
        this.drag_element_moved = false;
        this.config_element = null;
        this.popup_is_open = false;
        this.clipboard = {
            elements: [],
        };
        this.mouse_down_x = 0;
        this.mouse_down_y = 0;
        this.mouse_down_key_mods = 0;

        this.mask_canvas = document.createElement('canvas');
        this.mask_canvas.width = 512;
        this.mask_canvas.height = 512;
        this.mask_ctx = this.mask_canvas.getContext('2d');
        if (false) {      // for debugging
            this.mask_canvas.style.backgroundColor = '#f0f';
            document.body.appendChild(this.mask_canvas);
        }
        
        this.canvas.addEventListener('mousedown',  (e) => { this.mouseDown(e.offsetX/this.scale, e.offsetY/this.scale, this.getKeyModifiers(e)); });
        this.canvas.addEventListener('mouseup',    (e) => { this.mouseUp(e.offsetX/this.scale, e.offsetY/this.scale, this.getKeyModifiers(e)); });
        this.canvas.addEventListener('mousemove',  (e) => { this.mouseMove(e.offsetX/this.scale, e.offsetY/this.scale, this.getKeyModifiers(e)); });
        this.canvas.addEventListener('mouseleave', (e) => { this.mouseLeave(this.getKeyModifiers(e)); });
        this.canvas.addEventListener('click',      (e) => { this.mouseClick(e.offsetX/this.scale, e.offsetY/this.scale, this.getKeyModifiers(e)); });
        this.canvas.addEventListener('dblclick',   (e) => { this.mouseDoubleClick(e.offsetX/this.scale, e.offsetY/this.scale, this.getKeyModifiers(e)); });
        document.addEventListener('keydown',       (e) => { this.keyDown(e); });
    }

    parseSIValue(str) {
        let val = (str + "").trim();
        for (let i = 0; i < this.si_prefixes.length; i++) {
            var prefix = this.si_prefixes[i];
            var exp = 3 * (i-(this.si_prefixes.length-1)/2);
            if (val.endsWith(prefix) || (prefix == 'K' && val.endsWith('k'))) {
                return parseFloat(val) * Math.pow(10, exp);
            }
        }
        return parseFloat(val);
    }

    unparseSIValue(val) {
        for (let i = this.si_prefixes.length-1; i >= 0; i--) {
            var prefix = this.si_prefixes[i];
            var exp = 3 * (i-(this.si_prefixes.length-1)/2);
            var prefix_val = Math.pow(10, exp);
            if (val >= prefix_val) {
                return Math.round(val/prefix_val*100)/100 + (prefix == '*' ? '' : prefix);
            }
        }
        return parseFloat(val);
    }
    
    selectTool(name) {
        for (let t in this.tools) {
            var tool = this.tools[t];
            if (tool.name == name) {
                tool.dom.classList.add('selected');
                this.tool = tool;
                this.tool_rot = this.ROT_0;
            } else {
                tool.dom.classList.remove('selected');
            }
        }
    }
    
    loadImage(url) {
        return new Promise((accept) => {
            let img = new Image();
            img.addEventListener('load', () => { accept(img); });
            img.src = url;
        });
    }

    getKeyModifiers(e) {
        let mod = 0;

        // keyboard
        if (e.shiftKey) mod |= this.SHIFT_KEY;
        if (e.ctrlKey)  mod |= this.CTRL_KEY;
        if (e.altKey)   mod |= this.ALT_KEY;

        // mouse
        if (e.buttons & 1) mod |= this.MOUSE_L;
        if (e.buttons & 2) mod |= this.MOUSE_R;
        if (e.buttons & 4) mod |= this.MOUSE_M;

        return mod;
    }

    setMouseDownLocation(x, y, key_mods) {
        this.mouse_down_x = x;
        this.mouse_down_y = y;
        this.mouse_down_key_mods = key_mods;
    }
    
    getCanvasPositionInWindow() {
        let rect = this.canvas.getBoundingClientRect();
        return {
            x : rect.left,
            y : rect.top,
        };
    }

    exportData() {
        let data = {
            board_w  : this.board_w,
            board_h  : this.board_h,
            elements : [],
        };
        for (let el of this.elements) {
            data.elements.push({
                type : el.type,
                x    : el.x,
                y    : el.y,
                sx   : el.sx,
                sy   : el.sy,
                rot  : el.rot*90,
                info : el.info,
            });
        }
        return JSON.stringify(data, null, 2);
    }

    importData(data_str) {
        let data = null;
        try {
            data = JSON.parse(data_str);
        } catch (e) {
            alert("Syntax error in import data (invalid JSON).");
            return false;
        }
        if (! data.board_w || ! data.board_h || ! data.elements) {
            alert("Import data is incomplete");
            return false;
        }
        this.setSize(data.board_w, data.board_h);
        this.elements = [];
        for (let el of data.elements) {
            this.addElement(el.type, el.x, el.y, el.sx, el.sy, Math.floor(el.rot/90), el.info);
        }
        this.draw();
        return true;
    }
    
    debug(str) {
        document.getElementById('debug').textContent = str;
    }

    setSize(w, h, scale) {
        this.board_w = w;
        this.board_h = h;
        if (scale !== undefined) {
            this.scale = scale;
        }
        this.canvas.width  = this.scale * (2*this.border_w + w*this.hole_size);
        this.canvas.height = this.scale * (2*this.border_h + h*this.hole_size);
        this.ctx.scale(this.scale, this.scale);
        this.canvas.style.borderWidth = (16*this.scale) + 'px';
        this.canvas.style.backgroundSize = (16*this.scale)+'px ' + (16*this.scale)+'px';

        this.mask_canvas.width  = this.scale * 512;
        this.mask_canvas.height = this.scale * 512;
    }

    getHoleAt(x, y) {
        return {
            x : Math.floor((x - this.border_w) / this.hole_size),
            y : Math.floor((y - this.border_h) / this.hole_size),
        };
    }

    clampValue(val, min, max) {
        if (val < min) return min;
        if (val > max) return max;
        return val;
    }
    
    clampToBoard(point) {
        if (point.x < 0) point.x = 0;
        if (point.y < 0) point.y = 0;
        if (point.x >= this.board_w) point.x = this.board_w - 1;
        if (point.y >= this.board_h) point.y = this.board_h - 1;
    }

    deepCopy(data) {
        if (typeof(data) != 'object') return data;

        if (Array.isArray(data)) {
            let ret = [];
            for (let item of data) ret.push(this.deepCopy(item));
            return ret;
        }

        let ret = {};
        for (let key in data) {
            ret[key] = this.deepCopy(data[key]);
        }
        return ret;
    }
    
    copyElement(el) {
        return {
            type     : el.type,
            x        : el.x,
            y        : el.y,
            sx       : el.sx,
            sy       : el.sy,
            rot      : el.rot,
            info     : this.deepCopy(el.info),
            selected : !!el.selected,
        };
    }
    
    addElement(type, x, y, sx, sy, rot, info) {
        let el = { type:type, x:x, y:y, sx:sx, sy:sy, rot:rot, info:this.deepCopy(info), selected:false };
        this.elements.push(el);
        return el;
    }

    deleteElement(el) {
        let index = this.elements.findIndex(e => e==el);
        if (index >= 0) {
            this.elements.splice(index, 1);
        }
    }

    clearSelection() {
        for (let el of this.elements) {
            el.selected = false;
        }
    }

    setSelection(els) {
        this.clearSelection();
        for (el of els) {
            el.selected = true;
        }
    }

    selectElementsInRect(x1, y1, x2, y2) {
        if (x1 > x2) { let t = x1; x1 = x2; x2 = t; }
        if (y1 > y2) { let t = y1; y1 = y2; y2 = t; }

        let start = this.getHoleAt(x1, y1);
        let end   = this.getHoleAt(x2, y2);
        for (let y = start.y; y <= end.y; y++) {
            for (let x = start.x; x <= end.x; x++) {
                let el = this.getElementOverHole(x, y);
                if (el != null) el.selected = true;
            }
        }
    }
    
    getSelection() {
        let sel = [];
        for (let el of this.elements) {
            if (el.selected) {
                sel.push(el);
            }
        }
        return sel;
    }

    getSelectedElement() {
        let sel = null;
        for (let el of this.elements) {
            if (el.selected) {
                if (sel !== null) return null; // more than one element selected
                sel = el;
            }
        }
        return sel;
    }

    getSelectionCount() {
        let count = 0;
        for (let el of this.elements) {
            if (el.selected) count++;
        }
        return count;
    }

    moveSelectionBy(dx, dy) {
        // check if all elements can move
        for (let el of this.elements) {
            if ((el.selected || el === this.drag_element) &&
                this.elementIsBlocked(el.x+dx, el.y+dy, el.sx, el.sy, el.rot, this.drag_element, true)) {
                // element is blocked, can't move
                return false;
            }
        }

        // move elements
        for (let el of this.elements) {
            if (el.selected || el === this.drag_element) {
                el.x += dx;
                el.y += dy;
            }
        }
        return true;
    }
    
    clearFloatingElement() {
        this.floating_element.type = 'none';
        this.floating_element.x = 0;
        this.floating_element.y = 0;
        this.floating_element.rot = this.tool_rot;
    }
    
    setFloatingElement(type, x, y, sx, sy) {
        this.floating_element.type = type;
        this.floating_element.x    = x;
        this.floating_element.y    = y;
        this.floating_element.sx   = sx;
        this.floating_element.sy   = sy;
        this.floating_element.rot  = this.tool_rot;
    }

    getRotatedPositionDelta(sx, sy, rot) {
        var cx = Math.floor((sx-1) / 2);
        var cy = Math.floor((sy-1) / 2);
        for (let i = 0; i < rot; i++) {
            let tmp = cx;
            cx = -cy;
            cy = tmp;
        }
        return {
            x : cx + cy, // cx - rot(cx)
            y : cy - cx, // cy - rot(cy)
        };
    }
        
    getRotatedElement(x, y, sx, sy, rot, num_turns, sel_element, ignore_selection) {
        let delta = {x:0, y:0};
        for (let i = 0; i < num_turns; i++) {
            let d = this.getRotatedPositionDelta(sx, sy, rot);
            delta.x += d.x;
            delta.y += d.y;
            rot = (rot+1) % 4;
        }
        
        if (this.elementIsBlocked(x+delta.x, y+delta.y, sx, sy, rot, sel_element, ignore_selection)) {
            return null;
        }
        return {
            x : x + delta.x,
            y : y + delta.y,
            rot : rot,
        };
    }

    getElementAllowedRotations(el) {
        let ret = [];
        for (let i = 0; i < 4; i++) {
            let num_turns = (i - el.rot + 4) % 4;
            if (board.getRotatedElement(el.x, el.y, el.sx, el.sy, el.rot, num_turns, el)) {
                ret.push(i);
            }
        }
        return ret;
    }
    
    rotateElement(el, new_rot) {
        let new_state = this.getRotatedElement(el.x, el.y, el.sx, el.sy, el.rot, (new_rot - el.rot + 4) % 4, el);
        if (! new_state) {
            return false;
        }
        el.x = new_state.x;
        el.y = new_state.y;
        el.rot = new_state.rot;
        return true;
    }
    
    getElementBox(x, y, sx, sy, rot) {
        sx--;
        sy--;
        for (let i = 0; i < rot; i++) {
            let tmp = sx;
            sx = -sy;
            sy = tmp;
        }
        let x1 = x;
        let y1 = y;
        let x2 = x + sx;
        let y2 = y + sy;
        return {
            x1 : (x1 <= x2) ? x1 : x2,
            y1 : (y1 <= y2) ? y1 : y2,
            x2 : (x1 >  x2) ? x1 : x2,
            y2 : (y1 >  y2) ? y1 : y2,
        };
    }

    rectsOverlap(a, b) {
        return (a.x1 <= b.x2 &&
                a.x2 >= b.x1 &&
                a.y1 <= b.y2 &&
                a.y2 >= b.y1);
    }
    
    getElementOverHole(x, y) {
        for (let el of this.elements) {
            let box = this.getElementBox(el.x, el.y, el.sx, el.sy, el.rot);
            if (x >= box.x1 && x <= box.x2 && y >= box.y1 && y <= box.y2) {
                return el;
            }
        }
        return null;
    }

    elementIsBlocked(x, y, sx, sy, rot, ignore_element, ignore_selection) {
        let box = this.getElementBox(x, y, sx, sy, rot);
        if (box.x1 < 0 || box.x1 >= this.board_w ||
            box.x2 < 0 || box.x2 >= this.board_w ||
            box.y1 < 0 || box.y1 >= this.board_h ||
            box.y2 < 0 || box.y2 >= this.board_h) {
            return true;
        }
        for (let el of this.elements) {
            if (el == ignore_element || (ignore_selection && el.selected)) continue;
            let b = this.getElementBox(el.x, el.y, el.sx, el.sy, el.rot);
            if (this.rectsOverlap(b, box)) {
                return true;
            }
        }
        return false;
    }
    
    drawImageGrid(ctx, image, sx, sy) {
        for (let y = 0; y < sy; y += image.height / this.hole_size) {
            for (let x = 0; x < sx; x += image.width / this.hole_size) {
                ctx.drawImage(image, -this.hole_size/2 + x*this.hole_size, -this.hole_size/2 + y*this.hole_size);
            }
        }
    }
    
    buildMask(el, color) {
        let image = this.tools[el.type].img;
        this.mask_ctx.save();
        this.mask_ctx.clearRect(0, 0, el.sx*image.width, el.sy*image.height);

        for (let y = 0; y < el.sy; y += image.height / this.hole_size) {
            for (let x = 0; x < el.sx; x += image.width / this.hole_size) {
                this.mask_ctx.drawImage(image, x*this.hole_size, y*this.hole_size);
            }
        }

        this.mask_ctx.globalCompositeOperation = 'source-in';
        this.mask_ctx.fillStyle = color;
        this.mask_ctx.fillRect(0, 0, el.sx*this.hole_size, el.sy*this.hole_size);
        this.mask_ctx.restore();
    }
    
    drawElement(el, color, alpha) {
        let tool  = this.tools[el.type];
        let image = tool.img;
        if (! image) return;
        let x = el.x * this.hole_size + this.hole_size/2 + 0;
        let y = el.y * this.hole_size + this.hole_size/2 + 0;
        
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(el.rot*Math.PI/2);
        this.drawImageGrid(this.ctx, image, el.sx, el.sy);

        tool.config.draw(this.ctx, el);

        if (color !== null) {
            this.buildMask(el, color);
            this.ctx.globalAlpha = alpha;
            this.ctx.drawImage(this.mask_canvas,
                               0, 0, el.sx*this.hole_size, el.sy*this.hole_size,
                               -this.hole_size/2, -this.hole_size/2, el.sx*this.hole_size, el.sy*this.hole_size);
        }
    
        this.ctx.restore();
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (let el of this.elements) {
            this.drawElement(el, (el.selected) ? '#fff' : null, 0.75);
        }
        if (this.floating_element.type != 'none') {
            if (this.elementIsBlocked(this.floating_element.x,  this.floating_element.y,
                                      this.floating_element.sx, this.floating_element.sy,
                                      this.floating_element.rot)) {
                this.drawElement(this.floating_element, '#f00', 1);
            } else {
                this.drawElement(this.floating_element, '#ddd', 1);
            }
        }
    }

    drawSelectionRect(x1, y1, x2, y2) {
        if (x1 > x2) { let t = x1; x1 = x2; x2 = t; }
        if (y1 > y2) { let t = y1; y1 = y2; y2 = t; }
        x1 = this.clampValue(x1, 0, this.hole_size*this.board_w);
        x2 = this.clampValue(x2, 0, this.hole_size*this.board_w);
        y1 = this.clampValue(y1, 0, this.hole_size*this.board_h);
        y2 = this.clampValue(y2, 0, this.hole_size*this.board_h);

        this.ctx.save();
        this.ctx.strokeStyle = '#fff';
        this.ctx.strokeRect(x1, y1, x2-x1, y2-y1);
        this.ctx.globalAlpha = 0.3;
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(x1, y1, x2-x1, y2-y1);
        this.ctx.restore();
    }

    setCursor(cursor) {
        this.canvas.style.cursor = cursor;
    }

    // =================================================================================
    // === POPUP WINDOW ================================================================
    // =================================================================================

    openPopup(options) {
        if (this.popup_is_open) return;

        this.popup_is_open = true;
        this.clearFloatingElement();

        let popup    = document.getElementById('popup');
        let popup_bg = document.getElementById('popup-background');

        // display only current panel
        for (let child of popup.children) child.style.display = 'none';
        if (options.panel) options.panel.style.display = 'block';

        // set position and enable display
        if (options.popup_x) {
            popup.style.left = options.popup_x + 'px';
            popup.style.top  = options.popup_y + 'px';
        } else {
            popup.style.left = '';
            popup.style.top  = '';
        }
        popup.style.display = 'block';
        popup_bg.style.display = 'block';

        // focus initial element
        if (options.focus) options.focus.focus();
    }
    
    closePopup() {
        if (this.popup_is_open) {
            this.popup_is_open = false;
            document.getElementById('popup').style.display = 'none';
            document.getElementById('popup-background').style.display = 'none';
            this.draw();
        }
    }

    openPopupWindow(name) {
        this.popup_handler = this.popup_handlers[name];
        if (! this.popup_handler) {
            console.log("popup handler '" + name + "' not found");
            return;
        }

        let options = {
            popup_x : 200,
            popup_y : 150,
            focus   : null,
        };
        if (! this.popup_handler.prepare(options)) {
            return;
        }

        this.openPopup(options);
    }

    openElementConfigPopup(el) {
        let canvas_pos = this.getCanvasPositionInWindow();
        let options = {
            popup_x : Math.floor(canvas_pos.x + this.scale*(this.border_w + el.x*this.hole_size + 3*this.hole_size/2)),
            popup_y : Math.floor(canvas_pos.y + this.scale*(this.border_h + el.y*this.hole_size + 3*this.hole_size/2)),
        };

        this.popup_handler = this.tools[el.type].config;
        if (! this.popup_handler) {
            console.log("don't know how to configure element '" + el.type + "'");
            return;
        }
        if (! this.popup_handler.prepareConfig(el, options)) {
            // element has no configuration
            return;
        }
        
        this.openPopup(options);
    }

    popupKeyPress() {
        this.popup_handler.handleKeyPress();
    }

    confirmPopup() {
        this.popup_handler.confirm();
    }
    
    // =================================================================================
    // === MENU HANDLERS ===============================================================
    // =================================================================================

    menuNew()       { this.openPopupWindow('menu-new'); }
    menuImport()    { this.openPopupWindow('menu-import'); }
    menuExport()    { this.openPopupWindow('menu-export'); }
    menuBoardSize() { this.openPopupWindow('board-config'); }
    menuZoom()      { this.openPopupWindow('zoom-config'); }
    menuHelp()      { this.openPopupWindow('help'); }
    menuAbout()     { this.openPopupWindow('about'); }
    
    menuSave() {
        let blob = new Blob([ this.exportData() ], { type:'text/plain; charset=utf-8' });
	let url = window.URL.createObjectURL(blob);
        let link = document.createElement('a');
        link.download = this.filename;
        link.href = url;
        link.click();        
	window.URL.revokeObjectURL(url);
    }

    menuOpen() {
        let file = document.createElement('input');
        file.type = 'file';
        file.name = 'files[]';
        file.accept = 'text/plain';

        file.onchange = (change_ev) => {
            let reader = new FileReader();
            reader.onload = (load_ev) => {
                if (load_ev.target.readyState != 2) return;
                if (load_ev.target.error) {
                    alert('Error reading file');
                    return;
                }
                this.importData(load_ev.target.result);
                this.filename = change_ev.target.files[0].name;
            };
            reader.readAsText(change_ev.target.files[0]);
        };
        file.click();
    }

    menuCut() {
        let sel_elements = this.getSelection();
        if (sel_elements.length == 0) return;
        
        this.menuCopy();
        for (let el of sel_elements) {
            this.deleteElement(el);
        }
        this.draw();
    }
    
    menuCopy() {
        let sel_elements = this.getSelection();
        if (sel_elements.length == 0) return;

        this.clipboard.elements = [];
        let min_x = null;
        let min_y = null;
        for (let el of sel_elements) {
            if (min_x === null || el.x < min_x) min_x = el.x;
            if (min_y === null || el.y < min_y) min_y = el.y;
            this.clipboard.elements.push(this.copyElement(el));
        }
        for (let el of this.clipboard.elements) {
            el.x -= min_x;
            el.y -= min_y;
        }
    }
    
    menuPaste() {
        if (this.clipboard.elements.length == 0) return;
        
        let x, y;
        let blocked = false;
        for (y = 0; y < this.board_h; y++) {
            for (x = 0; x < this.board_w; x++) {
                blocked = false;
                for (let el of this.clipboard.elements) {
                    if (this.elementIsBlocked(el.x + x, el.y + y, el.sx, el.sy, el.rot)) {
                        blocked = true;
                        break;
                    }
                }
                if (! blocked) break;
            }
            if (! blocked) break;
        }
        
        if (blocked) {
            alert("No free space on board");
            return false;
        }
        this.clearSelection();
        for (let el of this.clipboard.elements) {
            let new_el = this.addElement(el.type, el.x + x, el.y + y, el.sx, el.sy, el.rot, el.info);
            new_el.selected = true;
        }
        this.draw();
        return true;
    }
    
    // =================================================================================
    // === ELEMENT CONFIG ==============================================================
    // =================================================================================

    // =================================================================================
    // === EVENT HANDLERS ==============================================================
    // =================================================================================
    
    keyDown(e) {
        if (this.popup_is_open) {
            if (e.key == 'Escape') {
                this.closePopup();
            }
            return;
        }
        
        switch (e.key) {
        case 'r':
        case 'R':
            this.tool_rot = (this.tool_rot+1) % 4;
            let redraw = false;
            if (this.floating_element.type != 'none') {
                this.floating_element.rot = this.tool_rot;
                redraw = true;
            }
            if (this.tool.name == 'move') {
                let sel_element = this.getSelectedElement();
                if (sel_element) {
                    let new_state = this.getRotatedElement(sel_element.x, sel_element.y, sel_element.sx, sel_element.sy, sel_element.rot, 1, sel_element);
                    if (new_state) {
                        sel_element.x = new_state.x;
                        sel_element.y = new_state.y;
                        sel_element.rot = new_state.rot;
                        redraw = true;
                    }
                }
            }
            if (redraw) {
                this.draw();
            }
            break;

        case 'Delete':
            let sel_elements = this.getSelection();
            for (let el of sel_elements) {
                this.deleteElement(el);
                this.draw();
            }
            break;

        case 'X':
        case 'x':
            if (e.ctrlKey) this.menuPaste();
            break;
            
        case 'C':
        case 'c':
            if (e.ctrlKey) this.menuCopy();
            break;
            
        case 'V':
        case 'v':
            if (e.ctrlKey) this.menuPaste();
            break;
            
        default:
            //console.log(e, e.ctrlKey);
            break;
        }
    }

    mouseLeave(key_mods) {
        if (this.popup_is_open) return;
        this.clearFloatingElement();
        this.draw();
    }
    
    mouseMove(x, y, key_mods) {
        if (this.popup_is_open) return;

        switch (this.tool.name) {
        case 'move':
            if (this.drag_element) {
                // dragging element
                let must_redraw = false;
                if (! this.drag_element.selected) {
                    this.clearSelection();
                    this.drag_element.selected = true;
                    must_redraw = true;
                }
                this.drag_element_moved = true;
                let hole = this.getHoleAt(x - this.drag_x_offset, y - this.drag_y_offset);
                this.clampToBoard(hole);
                let dx = hole.x - this.drag_element.x;
                let dy = hole.y - this.drag_element.y;
                if (this.moveSelectionBy(dx, dy)) {
                    must_redraw = true;
                }
                if (must_redraw) {
                    this.draw();
                }
            } else if (this.mouse_down_key_mods & this.MOUSE_L) {
                // dragging selection
                this.draw();
                this.drawSelectionRect(this.mouse_down_x, this.mouse_down_y, x, y);
            } else {
                // hovering mouse
                let hole = this.getHoleAt(x, y);
                let el = this.getElementOverHole(hole.x, hole.y);
                this.setCursor((el !== null) ? 'pointer' : 'default');
            }
            break;

        default:
            if (this.tool.is_element) {
                let hole = this.getHoleAt(x, y);
                let size = this.tool.config.getDefaultSize();
                this.clampToBoard(hole);
                this.setFloatingElement(this.tool.name, hole.x, hole.y, size.sx, size.sy);
                this.draw();
            }
            break;
        }
    }

    mouseUp(x, y, key_mods) {
        if (this.popup_is_open) return;

        
        if (this.drag_element !== null && ! this.drag_element_moved) {
            // an element was clicked but not moved -- select it
            if (! (key_mods & this.SHIFT_KEY)) {
                let sel_element = this.getSelectedElement();
                this.clearSelection();
                this.drag_element.selected = (sel_element == null || sel_element != this.drag_element);
            } else {
                this.drag_element.selected = ! this.drag_element.selected;
            }
            this.draw();
        } else if (this.drag_element === null && (this.mouse_down_key_mods & this.MOUSE_L)) {
            // a rectangle was selected -- select elements inside it
            this.selectElementsInRect(this.mouse_down_x, this.mouse_down_y, x, y);
        }
        
        this.drag_element = null;
        this.drag_element_moved = false;
        this.setMouseDownLocation(-1, -1, 0);
        this.draw();
    }
    
    mouseDown(x, y, key_mods) {
        if (this.popup_is_open) return;

        switch (this.tool.name) {
        case 'move':
            this.setMouseDownLocation(x, y, key_mods);
            let hole = this.getHoleAt(x, y);
            let el = this.getElementOverHole(hole.x, hole.y);
            if (el) {
                this.drag_element = el;
                this.drag_element_moved = false;
                this.drag_x_offset = x-this.border_w - el.x*this.hole_size - this.hole_size/2;
                this.drag_y_offset = y-this.border_h - el.y*this.hole_size - this.hole_size/2;
            } else if (! (key_mods & this.SHIFT_KEY)) {
                this.clearSelection();
            }
            break;
            
        default:
            if (this.floating_element.type != 'none' &&
                this.tool.is_element &&
                ! this.elementIsBlocked(this.floating_element.x,  this.floating_element.y,
                                        this.floating_element.sx, this.floating_element.sy,
                                        this.floating_element.rot)) {
                this.addElement(this.tool.name, this.floating_element.x, this.floating_element.y,
                                this.floating_element.sx, this.floating_element.sy, this.floating_element.rot,
                                this.tool.config.getDefaultInfo());
                this.draw();
            }
            break;
        }
    }

    mouseClick(x, y, key_mods) {
        if (this.popup_is_open) return;
    }
    
    mouseDoubleClick(x, y, key_mods) {
        if (this.popup_is_open) return;
        
        let hole = this.getHoleAt(x, y);
        let el = this.getElementOverHole(hole.x, hole.y);
        if (el) {
            this.openElementConfigPopup(el);
        }
    }
    
}

let board;

window.addEventListener('load', () => {
    let canvas = document.getElementById('board');
    board = new Perfboard(canvas);
    board.setSize(34, 15);
    board.selectTool('move');
    board.draw();
});
