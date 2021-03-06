pv.SvgScene.bar = function(scenes) {
  var e = scenes.$g.firstChild;

  this.removeFillStyleDefinitions(scenes);

  for (var i = 0; i < scenes.length; i++) {
    var s = scenes[i];

    /* visible */
    if (!s.visible || Math.abs(s.width) <= 1E-10 || Math.abs(s.height) <= 1E-10) continue;
    var fill = s.fillStyle, stroke = s.strokeStyle;
    if (!fill.opacity && !stroke.opacity) continue;

    if (fill.type && fill.type !== 'solid') {
        this.addFillStyleDefinition(scenes,fill);
    }

    if (stroke.type && stroke.type != 'solid') {
        this.addFillStyleDefinition(scenes,stroke);
    }

    e = this.expect(e, "rect", scenes, i, {
        "shape-rendering": s.antialias ? null : "crispEdges",
        "pointer-events": s.events,
        "cursor": s.cursor,
        "x": s.left,
        "y": s.top,
        "width": Math.max(1E-10, s.width),
        "height": Math.max(1E-10, s.height),
        "fill": fill.color,
        "fill-opacity": fill.opacity || null,
        "stroke": stroke.color,
        "stroke-opacity": stroke.opacity || null,
        "stroke-width": stroke.opacity ? s.lineWidth / this.scale : null
      });

    if(s.svg) this.setAttributes(e, s.svg);
    if(s.css) this.setStyle(e, s.css);

    e = this.append(e, scenes, i);
  }
  return e;
};
