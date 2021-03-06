pv.SvgScene.dot = function(scenes) {
  var e = scenes.$g.firstChild;

  this.removeFillStyleDefinitions(scenes);

  for (var i = 0; i < scenes.length; i++) {
    var s = scenes[i];

    /* visible */
    if (!s.visible) continue;
    var fill = s.fillStyle, stroke = s.strokeStyle;
    if (!fill.opacity && !stroke.opacity) continue;

    if (fill.type && fill.type !== 'solid') {
        this.addFillStyleDefinition(scenes,fill);
    }

    if (stroke.type && stroke.type != 'solid') {
        this.addFillStyleDefinition(scenes,stroke);
    }

    /* points */
    var radius = s.shapeRadius, path = null;
    switch (s.shape) {
      case "cross": {
        path = "M" + -radius + "," + -radius
            + "L" + radius + "," + radius
            + "M" + radius + "," + -radius
            + "L" + -radius + "," + radius;
        break;
      }
      case "triangle": {
        var h = radius, w = radius * 1.1547; // 2 / Math.sqrt(3)
        path = "M0," + h
            + "L" + w +"," + -h
            + " " + -w + "," + -h
            + "Z";
        break;
      }
      case "diamond": {
        radius *= Math.SQRT2;
        path = "M0," + -radius
            + "L" + radius + ",0"
            + " 0," + radius
            + " " + -radius + ",0"
            + "Z";
        break;
      }
      case "square": {
        path = "M" + -radius + "," + -radius
            + "L" + radius + "," + -radius
            + " " + radius + "," + radius
            + " " + -radius + "," + radius
            + "Z";
        break;
      }
      case "tick": {
        path = "M0,0L0," + -s.shapeSize;
        break;
      }
      case "bar": {
        path = "M0," + (s.shapeSize / 2) + "L0," + -(s.shapeSize / 2);
        break;
      }
    }

    /* Use <circle> for circles, <path> for everything else. */
    var svg = {
      "shape-rendering": s.antialias ? null : "crispEdges",
      "pointer-events": s.events,
      "cursor": s.cursor,
      "fill": fill.color,
      "fill-opacity": fill.opacity || null,
      "stroke": stroke.color,
      "stroke-opacity": stroke.opacity || null,
      "stroke-width": stroke.opacity ? s.lineWidth / this.scale : null,
      "stroke-dasharray": s.strokeDasharray || 'none'
    };
    if (path) {
      svg.transform = "translate(" + s.left + "," + s.top + ")";
      if (s.shapeAngle) svg.transform += " rotate(" + 180 * s.shapeAngle / Math.PI + ")";
      svg.d = path;
      e = this.expect(e, "path", scenes, i, svg);
    } else {
      svg.cx = s.left;
      svg.cy = s.top;
      svg.r = radius;
      e = this.expect(e, "circle", scenes, i, svg);
    }

    if(s.svg) this.setAttributes(e, s.svg);
    if(s.css) this.setStyle(e, s.css);

    e = this.append(e, scenes, i);
  }
  return e;
};
