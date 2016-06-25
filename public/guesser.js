var WILL = {
  backgroundColor: Module.Color.WHITE,
  strokes: new Array(),

  init: function(width, height) {
    this.initInkEngine(width, height);
    this.initEvents();
  },

  initInkEngine: function(width, height) {
    this.canvas = new Module.InkCanvas(document.getElementById("canvas"), width, height);
    this.strokesLayer = this.canvas.createLayer();

    this.brush = new Module.SolidColorBrush();

    this.pathBuilder = new Module.SpeedPathBuilder();
    this.pathBuilder.setNormalizationConfig(182, 3547);
    this.pathBuilder.setPropertyConfig(Module.PropertyName.Width, 2.05, 34.53, 0.72, NaN, Module.PropertyFunction.Power, 1.19, false);

    this.smoothener = new Module.MultiChannelSmoothener(this.pathBuilder.stride);

    this.viewArea = this.strokesLayer.bounds;

    client.init();

    this.writer = new Writer(client.id);
    client.writers[client.id] = this.writer;

    this.clearCanvas();
  },

  initEvents: function() {
    var self = this;
    socket.on('showData',function (obj) {
      var data = Object.keys(obj).map(function (key) {return obj[key]});
      data = new Uint8Array(data);
      // console.log(data);
      client.receive(1, data)
    });
    socket.on('clear',function () {
      WILL.clearCanvas();
    })
  },

  beginStroke: function(e) {
  },

  moveStroke: function(e) {
  },

  endStroke: function(e) {
  },

  buildPath: function(pos) {
    if (this.writer.inputPhase == Module.InputPhase.Begin)
      this.smoothener.reset();

    var pathPart = this.pathBuilder.addPoint(this.writer.inputPhase, pos, Date.now()/1000);
    var smoothedPathPart = this.smoothener.smooth(pathPart, this.writer.inputPhase == Module.InputPhase.End);
    var pathContext = this.pathBuilder.addPathPart(smoothedPathPart);

    this.pathPart = pathContext.getPathPart();
    this.path = pathContext.getPath();

    if (this.writer.inputPhase == Module.InputPhase.Move) {
      var preliminaryPathPart = this.pathBuilder.createPreliminaryPath();
      var preliminarySmoothedPathPart = this.smoothener.smooth(preliminaryPathPart, true);

      this.preliminaryPathPart = this.pathBuilder.finishPreliminaryPath(preliminarySmoothedPathPart);
    }
  },

  drawPath: function() {
    this.writer.compose(this.pathPart, this.writer.inputPhase == Module.InputPhase.End);
  },

  refresh: function(dirtyArea) {
    if (!dirtyArea) dirtyArea = this.canvas.bounds;
    dirtyArea = Module.RectTools.ceil(dirtyArea);

    this.canvas.clear(dirtyArea, this.backgroundColor);
    this.canvas.blend(this.strokesLayer, {rect: dirtyArea});
  },

  clear: function() {
    server.clear();
  },

  clearCanvas: function() {
    this.strokes = new Array();

    this.strokesLayer.clear(this.backgroundColor);
    this.canvas.clear(this.backgroundColor);
  }
};

function Writer(id) {
  this.id = id;

  this.strokeRenderer = new Module.StrokeRenderer(WILL.canvas);
  this.strokeRenderer.configure({brush: WILL.brush, color: ((id == 0)?Module.Color.BLUE:Module.Color.GREEN)});
}

Writer.prototype.refresh = function() {
  if (this.id == client.id && this.inputPhase == Module.InputPhase.Move)
    this.strokeRenderer.drawPreliminary(WILL.preliminaryPathPart);

  WILL.canvas.clear(this.strokeRenderer.updatedArea, WILL.backgroundColor);
  WILL.canvas.blend(WILL.strokesLayer, {rect: this.strokeRenderer.updatedArea});

  this.strokeRenderer.blendUpdatedArea();
}

Writer.prototype.compose = function(path, endStroke) {
  if (path.points.length == 0)
    return;

  this.strokeRenderer.draw(path, endStroke, this.id != client.id);

  if (this.id == client.id) {
    if (this.strokeRenderer.updatedArea)
      this.refresh();

    if (endStroke)
      delete this.inputPhase;

    client.encoder.encodeComposePathPart(path, this.strokeRenderer.color, true, false, endStroke);
    client.send();
  }
}

Writer.prototype.abort = function() {
  var dirtyArea = Module.RectTools.union(this.strokeRenderer.strokeBounds, this.strokeRenderer.preliminaryDirtyArea);

  this.strokeRenderer.abort();
  delete this.inputPhase;

  WILL.refresh(dirtyArea);

  if (this.id == client.id) {
    client.encoder.encodeComposeAbort();
    client.send();
  }
}

var client = {
  name: window.name,
  writers: [],

  init: function() {
    this.id = 2;

    this.encoder = new Module.PathOperationEncoder();
    this.decoder = new Module.PathOperationDecoder(Module.PathOperationDecoder.getPathOperationDecoderCallbacksHandler(this.callbacksHandlerImplementation));
  },
  
  receive: function(sender, data) {
    var writer = this.writers[sender];

    if (!writer) {
      writer = new Writer(sender);
      this.writers[sender] = writer;
    }

    Module.writeBytes(data, function(int64Ptr) {
      this.decoder.decode(writer, int64Ptr);
    }, this);
  },

  callbacksHandlerImplementation: {
    onComposeStyle: function(writer, style) {
      if (writer.id == client.id) return;
      writer.strokeRenderer.configure(style);
    },

    onComposePathPart: function(writer, path, endStroke) {
      if (writer.id == client.id) return;

      writer.compose(path, endStroke);
      writer.refresh();
    },

    onComposeAbort: function(writer) {
      if (writer.id == client.id) return;
      writer.abort();
    },

    onAdd: function(writer, strokes) {
      strokes.forEach(function(stroke) {
        WILL.strokes.push(stroke);
        writer.strokeRenderer.blendStroke(WILL.strokesLayer, stroke.blendMode);
      }, this);

      WILL.refresh();
    },

    onRemove: function(writer, group) {},

    onUpdateColor: function(writer, group, color) {},

    onUpdateBlendMode: function(writer, group, blendMode) {},

    onSplit: function(writer, splits) {},

    onTransform: function(writer, group, mat) {}
  }
};


Module.addPostScript(function() {
  Module.InkDecoder.getStrokeBrush = function(paint, writer) {
    return WILL.brush;
  };

  WILL.init(1600,600);
});