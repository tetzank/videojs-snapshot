function snapshot(options) {
// 	"use strict";

	// globals
	var player = this;
	var video = player.el().querySelector('video');
	var container, scale;
	//FIXME: add some kind of assert for video, if flash is used it's not working

	//TODO: add better prefix for all new css class, probably vjs-snapshot
	//TODO: add scale display, not really needed but nice to have
	//TODO: center canvas or at least use some colored background, otherwise video still image distracts too much
	//TODO: break this large file up into smaller ones, e.g. container,

	function updateScale(){
		var rect = video.getBoundingClientRect();
		var scalew = canvas_draw.el().width / rect.width;
		var scaleh = canvas_draw.el().height / rect.height;
		scale = Math.max(Math.max(scalew, scaleh), 1);
// 		scale_txt.innerHTML = (Math.round(1/scale*100)/100) +"x";
	}

	// take snapshot of video and show all drawing elements
	// added to player object to be callable from outside, e.g. shortcut
	player.snap = function(){
		player.pause();
		// loose keyboard focus
		player.el().blur();
		// switch control bar to drawing controls
		player.controlBar.hide();
		drawCtrl.show();
		// display canvas
		container.show();

		// canvas for drawing, it's separate from snapshot because of delete
		canvas_draw.el().width = video.videoWidth;
		canvas_draw.el().height = video.videoHeight;
		context_draw.strokeStyle = color.el().value;
		context_draw.lineWidth = size.el().value / 2;
		context_draw.lineCap = "round";
		// calculate scale
		updateScale();

		// background canvas containing snapshot from video
		canvas_bg.el().width = video.videoWidth;
		canvas_bg.el().height = video.videoHeight;
		context_bg.drawImage(video, 0, 0);

		// still fit into player element
		var rect = video.getBoundingClientRect(); // use bounding rect instead of player.width/height because of fullscreen
		canvas_draw.el().style.maxWidth  = rect.width  +"px";
		canvas_draw.el().style.maxHeight = rect.height +"px";
		canvas_bg.el().style.maxWidth  = rect.width  +"px";
		canvas_bg.el().style.maxHeight = rect.height +"px";
	};
	// camera icon on normal player control bar
	var snap_btn = player.controlBar.addChild('button');
	snap_btn.addClass("vjs-snapshot-button");
	snap_btn.on('click', player.snap);

	// drawing controls
	var tool = 'crop';
	function toolChange(event){
		var active_tool = drawCtrl.el().querySelector('.vjs-tool-active');
		active_tool.classList.remove('vjs-tool-active');
		event.target.classList.add('vjs-tool-active');
		tool = event.target.dataset.value;
	}

	//draw control bar
	var drawCtrl = player.addChild(
		new videojs.Component(player, {
			el: videojs.Component.prototype.createEl(null, {
				className: 'vjs-control-bar vjs-drawing-ctrl',
			}),
		})
	);
	drawCtrl.hide();

	// choose color, used everywhere: painting, border color of cropbox, ...
	var color = drawCtrl.addChild(
		new videojs.Component(player, {
			el: videojs.Component.prototype.createEl('input', {
				className: 'vjs-control', type: 'color', value: '#df4b26', title: 'color'
			}),
		})
	);
	color.on('change', function(e){
		context_draw.strokeStyle = color.el().value;
	});

	// choose size, used everywhere: line width, text size
	var size = drawCtrl.addChild(
		new videojs.Component(player, {
			el: videojs.Component.prototype.createEl('input', {
				className: 'vjs-control', type: 'number', value: '10', title: 'line width, text size, ...'
			}),
		})
	);
	size.on('change', function(e){
		context_draw.lineWidth = size.el().value / 2;
	});

	videojs.ToolButton = videojs.Button.extend({
		init: function(p, options) {
			videojs.Button.call(this, p, options);

			this.addClass("vjs-drawing-"+ options.tool);
			this.el().dataset.value = options.tool;
			this.el().title = options.title;

			this.on('click', toolChange);
		}
	});
	var brush  = drawCtrl.addChild(new videojs.ToolButton(player, {tool: "brush", title: "freehand drawing"}));
	var rect   = drawCtrl.addChild(new videojs.ToolButton(player, {tool: "rect",  title: "draw rectangle from top left to bottom right"}));
	var crop   = drawCtrl.addChild(new videojs.ToolButton(player, {tool: "crop",  title: "select area and click selection to crop"}));
	crop.addClass("vjs-tool-active");
	var text   = drawCtrl.addChild(new videojs.ToolButton(player, {tool: "text",  title: "select area, type message and then click somewhere else"}));
	var eraser = drawCtrl.addChild(new videojs.ToolButton(player, {tool: "eraser",title: "erase drawing in clicked location"}));

	function combineDrawing(encoding){
		//blit canvas and open new tab with image
		var canvas_tmp = document.createElement('canvas');
		canvas_tmp.width = canvas_draw.el().width;
		canvas_tmp.height = canvas_draw.el().height;
		var ctx_tmp = canvas_tmp.getContext("2d");
		ctx_tmp.drawImage(canvas_bg.el(), 0, 0);
		ctx_tmp.drawImage(canvas_draw.el(), 0, 0);
		window.open(canvas_tmp.toDataURL(encoding));
	}

	var dljpeg = drawCtrl.addChild(
		new videojs.Component(player, {
			el: videojs.Component.prototype.createEl(null, {
				className: 'vjs-control vjs-button', innerHTML: 'JPEG', title: 'open new tab with jpeg image'
			}),
		})
	);
	dljpeg.on('click', function(){ combineDrawing("image/jpeg"); });
	var dlpng = drawCtrl.addChild(
		new videojs.Component(player, {
			el: videojs.Component.prototype.createEl(null, {
				className: 'vjs-control vjs-button', innerHTML: 'PNG', title: 'open new tab with png image'
			}),
		})
	);
	dlpng.on('click', function(){ combineDrawing("image/png"); });

	//TODO: scale display

	var close = drawCtrl.addChild('button');
	close.addClass("vjs-drawing-close");
	close.el().title = "close screenshot and return to video";
	close.on('click', function(){
		// hide all canvas stuff
		container.hide();
		// switch back to normal player controls
		drawCtrl.hide();
		player.controlBar.show();
		player.el().focus();
	});

	// canvas stuff
	container = player.addChild(
		new videojs.Component(player, {
			el: videojs.Component.prototype.createEl(null, {
				className: 'vjs-canvas-container' /*TODO*/
			}),
		})
	);
	var canvas_bg = container.addChild( //FIXME: it's quite silly to use a component here
		new videojs.Component(player, {
			el: videojs.Component.prototype.createEl('canvas', {
			}),
		})
	);
	var context_bg = canvas_bg.el().getContext("2d");
	var canvas_draw = container.addChild(
		new videojs.Component(player, {
			el: videojs.Component.prototype.createEl('canvas', {
			}),
		})
	);
	var context_draw = canvas_draw.el().getContext("2d");
	var canvas_rect = container.addChild(
		new videojs.Component(player, {
			el: videojs.Component.prototype.createEl('canvas', {
			}),
		})
	);
	canvas_rect.el().style.zIndex = "1"; // always on top of other canvas elements
	var context_rect = canvas_rect.el().getContext("2d");
	var cropbox = container.addChild(
		new videojs.Component(player, {
			el: videojs.Component.prototype.createEl('div', {
				innerHTML: "crop"
			}),
		})
	);
	// crop handling, create new canvas and replace old one
	function cropCanvas(canvas, context){
// 		var newcanvas = document.createElement('canvas');
		var newcanvas = new videojs.Component(player, { // FIXME: that's quite silly
			el: videojs.Component.prototype.createEl('canvas', {
			}),
		});
		newcanvas.el().width = scale * cropbox.el().offsetWidth;
		newcanvas.el().height = scale * cropbox.el().offsetHeight;
		var rect = player.el().getBoundingClientRect();
		newcanvas.el().style.maxWidth  = rect.width  +"px";
		newcanvas.el().style.maxHeight = rect.height +"px";

		var ctx = newcanvas.el().getContext("2d");
		ctx.drawImage(canvas.el(), scale*cropbox.el().offsetLeft, scale*cropbox.el().offsetTop,
						newcanvas.el().width, newcanvas.el().height, 0, 0, newcanvas.el().width, newcanvas.el().height);

// 		container.replaceChild(newcanvas, canvas);
		container.removeChild(canvas);
		container.addChild(newcanvas);
// 		canvas = newcanvas;
		ctx.lineCap = context.lineCap; // transfer context states
		ctx.strokeStyle = context.strokeStyle;
		ctx.lineWidth = context.lineWidth;
// 		context = ctx;
		// javascript has no pass-by-reference -> do stupid stuff
		return [newcanvas, ctx];
	}
	cropbox.on('mousedown', function(e){
		var r = cropCanvas(canvas_bg, context_bg);
		canvas_bg = r[0]; context_bg = r[1];
		r = cropCanvas(canvas_draw, context_draw);
		canvas_draw = r[0]; context_draw = r[1];
		updateScale();

		cropbox.hide();
		e.stopPropagation(); //otherwise canvas below gets mousedown
	});

	var textbox = container.addChild(
		new videojs.Component(player, {
			el: videojs.Component.prototype.createEl('textarea', {
			}),
		})
	);
	textbox.on('keydown', function(e){ // don't fire player shortcuts when textbox has focus
		e.stopPropagation();
	});
	// draw text when textbox looses focus
	textbox.on('blur', function(e){
		context_draw.fillStyle = color.el().value;
		context_draw.font = scale*size.el().value +"px sans-serif";
		context_draw.textBaseline = "top";
		context_draw.fillText(textbox.el().value,
				scale*textbox.el().offsetLeft + scale,
				scale*textbox.el().offsetTop + scale); //+1 for border?
		//FIXME: there's still a minor shift when scale isn't 1, in firefox more and also when scale is 1
		textbox.hide();
		textbox.el().value = "";
	});

	container.hide();
	canvas_rect.hide();
	cropbox.hide();
	textbox.hide();

	// TODO: draw functions
	var paint = false;
	container.on('mousedown', function(e){
		paint = true;
		var pos = container.el().getBoundingClientRect();
		var x = e.clientX - pos.left;
		var y = e.clientY - pos.top;
		switch(tool){
			case "brush":
				x *= scale; y *= scale;
				context_draw.beginPath();
				context_draw.moveTo(x-1, y);
				context_draw.lineTo(x, y);
				context_draw.stroke();
				break;
			case "rect":
				// rectangle is scaled when blitting, not when dragging
				canvas_rect.el().width = 0;
				canvas_rect.el().height = 0;
				canvas_rect.el().style.left = x + "px";
				canvas_rect.el().style.top = y + "px";
				canvas_rect.show();
				break;
			case "crop":
				cropbox.el().style.width = 0;
				cropbox.el().style.height = 0;
				cropbox.el().style.display = "flex";
				cropbox.el().style.left = x + "px";
				cropbox.el().style.top = y + "px";

				cropbox.el().style.border = "1px dashed "+ color.el().value;
				cropbox.el().style.color = color.el().value;
				break;
			case "text":
				// if shown already, loose focus and draw it first, otherwise it gets drawn at mousedown
				if(textbox.el().style.display == "none"){
					textbox.el().style.width = 0;
					textbox.el().style.height = 0;
					textbox.el().style.left = x + "px";
					textbox.el().style.top = y + "px";
					textbox.show();

					textbox.el().style.border = "1px dashed "+ color.el().value;
					textbox.el().style.color = color.el().value;
					textbox.el().style.font = size.el().value +"px sans-serif";
// 					textbox.el().style.lineHeight = size.el().value +"px";
				}
				break;
			case "eraser":
				var s = size.el().value;
				context_draw.clearRect(scale*x - s/2, scale*y - s/2, s, s);
				break;
		}
// 		e.preventDefault();
	});
	container.on('mousemove', function(e){
		if(paint){
			var pos = container.el().getBoundingClientRect();
			var x = e.clientX - pos.left;
			var y = e.clientY - pos.top;
			switch(tool){
				case "brush":
					context_draw.lineTo(scale * x, scale * y);
					context_draw.stroke();
					break;
				case "rect":
					context_rect.clearRect(0, 0, context_rect.canvas.width, context_rect.canvas.height);
					// this way it's only possible to drag to the right and down, mousedown sets top left
					canvas_rect.el().width = x - canvas_rect.el().offsetLeft; // resize canvas
					canvas_rect.el().height = y - canvas_rect.el().offsetTop;
					context_rect.strokeStyle = color.el().value; //looks like its reset when resizing canvas
					context_rect.lineWidth = size.el().value / scale; // scale lineWidth
					context_rect.strokeRect(0, 0, context_rect.canvas.width, context_rect.canvas.height);
					break;
				case "crop":
					cropbox.el().style.width = (x - cropbox.el().offsetLeft) +"px"; // resize
					cropbox.el().style.height = (y - cropbox.el().offsetTop) +"px";
					break;
				case "text":
					textbox.el().style.width = (x - textbox.el().offsetLeft) +"px"; // resize
					textbox.el().style.height = (y - textbox.el().offsetTop) +"px";
					break;
				case "eraser":
					var s = size.el().value;
					context_draw.clearRect(scale*x - s/2, scale*y - s/2, s, s);
					break;
			}
			e.preventDefault();
		}
	});
	function finish(){
		if(paint){
			paint = false;
			if(tool == "rect"){
				//blit canvas_rect on canvas, scaled
				context_draw.drawImage(canvas_rect.el(),
						scale*canvas_rect.el().offsetLeft, scale*canvas_rect.el().offsetTop,
						scale*context_rect.canvas.width, scale*context_rect.canvas.height);
				canvas_rect.hide();
			}else if(tool == "text"){
				player.el().blur();
				textbox.el().focus();
			}
		}
	}
	container.on('mouseup', finish);
	container.on('mouseleave', finish);
}

videojs.plugin('snapshot', snapshot);
