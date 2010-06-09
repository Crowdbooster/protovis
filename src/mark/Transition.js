pv.Transition = function(mark) {
  var that = this,
      ease = pv.ease("cubic-in-out"),
      duration = 250,
      timer;

  var supported = {
    top: 1,
    left: 1,
    right: 1,
    bottom: 1,
    width: 1,
    height: 1,
    innerRadius: 1,
    outerRadius: 1,
    radius: 1,
    startAngle: 1,
    endAngle: 1,
    angle: 1,
    fillStyle: 1,
    strokeStyle: 1,
    lineWidth: 1,
    eccentricity: 1,
    tension: 1,
    textStyle: 1,
    textMargin: 1
  };

  var none = pv.Color.transparent;

  that.ease = function(x) {
    return arguments.length
        ? (ease = typeof x == "function" ? x : pv.ease(x), that)
        : ease;
  };

  that.duration = function(x) {
    return arguments.length
        ? (duration = Number(x), that)
        : duration;
  };

  that.start = function() {
    if (timer) return;
    if (mark.parent) fail(); // TODO allow partial rendering
    var before = mark.scene,
        after,
        start = Date.now(),
        interpolators;

    // TODO clearing the scene like this forces total re-build
    mark.scene = null;
    mark.bind();
    mark.build();
    after = mark.scene;
    mark.scene = before;

    /** @private */
    function ids(marks) {
      var map = {};
      for (var i = 0; i < marks.length; i++) {
        var mark = marks[i];
        if (mark.id) map[mark.id] = mark;
      }
      return map;
    }

    /** @private */
    function interpolateProperty(name, before, after) {
      if (before[name] == after[name]) return;
      if (name in supported) {
        var i = pv.Scale.interpolator(before[name], after[name]);
        return function(t) {
          before[name] = i(t);
        };
      } else {
        return function(t) {
          if (t > .5) {
            before[name] = after[name];
          }
        };
      }
    }

    /** @private */
    function interpolateInstance(before, after) {
      for (var name in before) {
        if (name == "children") continue; // ignore
        var i = interpolateProperty(name, before, after);
        if (i) {
          i.next = interpolators;
          interpolators = i;
        }
      }
      if (before.children) {
        for (var j = 0; j < before.children.length; j++) {
          interpolate(before.children[j], after.children[j]);
        }
      }
    }

    /** @private */
    function interpolate(before, after) {
      var mark = before.mark, bi = ids(before), ai = ids(after);
      for (var i = 0; i < before.length; i++) {
        var b = before[i], a = b.id ? ai[b.id] : after[i];
        if (!a) {
          a = override(before, i, mark.$exit);
          b.exit = true;
        }
        interpolateInstance(b, a);
      }
      for (var i = 0; i < after.length; i++) {
        var a = after[i], b = a.id ? bi[a.id] : before[i];
        if (!b) {
          before.push(b = override(after, i, mark.$enter));
          interpolateInstance(b, a);
        }
      }
    }

    /** @private */
    function override(scene, index, proto) {
      if (!proto) return scene[index];
      var s = pv.extend(scene[index]),
          r = scene.mark.root.scene;
      scene.mark.context(scene, index, function() {
        this.buildProperties(s, proto.$properties);
        // TODO need to detect and recompute implied properties!
      });
      scene.mark.root.scene = r;
      return s;
    }

    /** @private */
    function cleanup(scene) {
      for (var i = 0, j = 0; i < scene.length; i++) {
        var s = scene[i];
        if (!s.exit) {
          scene[j++] = s;
          if (s.children) s.children.forEach(cleanup);
        }
      }
      scene.length = j;
    }

    interpolate(before, after);

    timer = setInterval(function() {
      var t = Math.max(0, Math.min(1, (Date.now() - start) / duration)),
          e = ease(t);
      for (var i = interpolators; i; i = i.next) i(e);
      if (t == 1) {
        cleanup(before);
        that.stop();
      }
      pv.Scene.updateAll(before);
    }, 24);
  };

  that.stop = function() {
    clearInterval(timer);
  };
};