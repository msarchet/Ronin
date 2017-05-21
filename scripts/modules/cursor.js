function Cursor(rune)
{
  Module.call(this,rune);
  
  this.settings = {};

  this.mode = null;
  this.position = new Position();

  this.passive = function(cmd)
  {
    if(!this.layer){ this.create_layer(); }
  }

  this.active = function(cmd)
  {
  }

  this.draw_pointer_arrow = function(position,size = 1)
  {
    if(!this.layer){ this.create_layer(); }

    this.pointer_last = this.pointer_last ? this.pointer_last : position;

    this.layer.context().beginPath();
    
    this.layer.context().moveTo(position.x,position.y);
    this.layer.context().lineTo(position.x + 5,position.y);
    this.layer.context().moveTo(position.x,position.y);
    this.layer.context().lineTo(position.x,position.y + 5);
    
    this.layer.context().lineCap="round";
    this.layer.context().lineWidth = 1;
    this.layer.context().strokeStyle = "white";
    this.layer.context().stroke();
    this.layer.context().closePath();

    this.pointer_last = position;
  }

  this.draw_pointer_circle = function(position,size = 1)
  {
    if(!this.layer){ this.create_layer(); }

    this.pointer_last = this.pointer_last ? this.pointer_last : position;

    this.layer.context().beginPath();
    this.layer.context().moveTo(this.pointer_last.x,this.pointer_last.y);
    this.layer.context().lineTo(position.x,position.y);
    this.layer.context().lineCap="round";
    this.layer.context().lineWidth = 1;
    this.layer.context().strokeStyle = "white";
    this.layer.context().stroke();
    this.layer.context().closePath();

    this.layer.context().beginPath();
    this.layer.context().arc(position.x, position.y, size/2, 0, 2 * Math.PI, false);
    this.layer.context().lineWidth = 1;
    this.layer.context().strokeStyle = "white";
    this.layer.context().stroke();
    this.layer.context().closePath();

    this.layer.context().beginPath();
    this.layer.context().arc(position.x, position.y, (size/2)+1, 0, 2 * Math.PI, false);
    this.layer.context().lineWidth = 1;
    this.layer.context().strokeStyle = "black";
    this.layer.context().stroke();
    this.layer.context().closePath();

    this.pointer_last = position;
  }

  this.draw_pointer_drag = function(position)
  {
    if(!this.layer){ this.create_layer(); }

    this.pointer_last = this.pointer_last ? this.pointer_last : position;

    this.layer.context().beginPath();
    
    this.layer.context().moveTo(position.x,position.y - 3);
    this.layer.context().lineTo(position.x,position.y + 3);
    this.layer.context().moveTo(position.x - 2,position.y - 3);
    this.layer.context().lineTo(position.x - 2,position.y + 3);
    this.layer.context().moveTo(position.x + 2,position.y - 3);
    this.layer.context().lineTo(position.x + 2,position.y + 3);
    
    this.layer.context().lineCap="round";
    this.layer.context().lineWidth = 1;
    this.layer.context().strokeStyle = "white";
    this.layer.context().stroke();
    this.layer.context().closePath();

    this.pointer_last = position;
  }

  this.draw_pointer = function(position,size = 1)
  {
    if(!this.layer){ this.create_layer(); }

    this.pointer_last = this.pointer_last ? this.pointer_last : position;

    this.layer.context().beginPath();
    this.layer.context().moveTo(this.pointer_last.x,this.pointer_last.y);
    this.layer.context().lineTo(position.x,position.y);
    this.layer.context().lineCap="round";
    this.layer.context().lineWidth = 1;
    this.layer.context().strokeStyle = "white";
    this.layer.context().stroke();
    this.layer.context().closePath();

    this.layer.context().beginPath();
    this.layer.context().arc(position.x, position.y, 0.5, 0, 2 * Math.PI, false);
    this.layer.context().fillStyle = 'white';
    this.layer.context().fill();
    this.layer.context().closePath();

    this.layer.context().beginPath();
    
    this.layer.context().moveTo(position.x + 2,position.y);
    this.layer.context().lineTo(position.x + 5,position.y);
    this.layer.context().moveTo(position.x,position.y + 2);
    this.layer.context().lineTo(position.x,position.y + 5);
    this.layer.context().moveTo(position.x - 2,position.y);
    this.layer.context().lineTo(position.x - 5,position.y);
    this.layer.context().moveTo(position.x,position.y - 2);
    this.layer.context().lineTo(position.x,position.y - 5);
    
    this.layer.context().lineCap="round";
    this.layer.context().lineWidth = 1;
    this.layer.context().strokeStyle = "white";
    this.layer.context().stroke();
    this.layer.context().closePath();

    this.pointer_last = position;
  }

  this.update = function(event)
  {
    // this.set_mode(ronin.brush);
    return;
    if(event.altKey == true && event.shiftKey == true){
      this.set_mode(ronin.frame.active_layer);
    }
    else if(event.altKey == true){
      this.set_mode(ronin.default);
    }
    else{
      this.set_mode(ronin.brush);
    }
  }
  
  this.set_mode = function(mode = ronin.brush)
  {
    if(!mode){ mode = ronin.brush; }

    if(this.mode == mode){ return; }
    this.mode = mode;
    document.body.setAttribute("class",this.mode.name);
    ronin.widget.update();
  }
  
  this.mouse_down = function(position)
  {
    if(this.layer){ this.layer.clear(); }

    this.position = ronin.magnet.update_mouse(position);

    if(this.mode.constructor.name != Cursor.name){
      this.mode.mouse_from = this.position;
      this.mode.mouse_held = true;
      if(!position.is_outside()){
        this.mode.mouse_down(this.position);  
      }
    }
  }
  
  this.mouse_move = function(position)
  {
    if(!this.layer){ this.create_layer(); }
      
    this.layer.clear();

    this.position = ronin.magnet.update_mouse(position);

    if(this.mode){this.mode.mouse_pointer(this.position);}
    else{ this.mouse_pointer(this.position);}

    if(this.mode.mouse_from == null){ return; }

    var rect = new Rect();
    rect.width = this.position.x - this.mode.mouse_from.x;
    rect.height = this.position.y - this.mode.mouse_from.y;

    if(this.mode.constructor.name != Cursor.name){
      this.mode.mouse_move(this.position,rect);  
      this.mode.mouse_prev = this.position;
    }
    // ronin.terminal.update_hint();
  }
  
  this.mouse_up = function(position)
  {
    this.position = ronin.magnet.update_mouse(position);

    var rect = new Rect();
    rect.width = this.position.x - this.mode.mouse_from.x;
    rect.height = this.position.y - this.mode.mouse_from.y;

    if(!this.mode){ return; }

    if(this.mode.constructor.name != Cursor.name){
      if(!position.is_outside()){
        this.mode.mouse_up(this.position,rect);  
      }
      this.mode.mouse_held = false;
    }
    this.mode.mouse_from = null;
  }

  this.release = function()
  {
    this.mode.mouse_held = false;
    this.mode.mouse_from = null;
    this.mode = ronin.brush;
    ronin.terminal.input.focus();
  }

  this.widget = function()
  {
    return this.mode.mouse_mode();
  }
}