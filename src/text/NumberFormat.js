/**
 * Returns a default number format.
 *
 * @class Represents a number format, converting between a <tt>number</tt> and a
 * <tt>string</tt>. This class allows numbers to be formatted with variable
 * precision (both for the integral and fractional part of the number), optional
 * thousands grouping, and optional padding. The thousands (",") and decimal
 * (".") separator can be customized.
 *
 * @returns {pv.Format.number} a number format.
 */
pv.Format.number = function() {
  var mini = 0, // default minimum integer digits
      maxi = Infinity, // default maximum integer digits
      mins = 0, // mini, including group separators
      minf = 0, // default minimum fraction digits
      maxf = 0, // default maximum fraction digits
      maxk = 1, // 10^maxf
      padi = "0", // default integer pad
      padf = "0", // default fraction pad
      padg = true, // whether group separator affects integer padding
      decimal = ".", // default decimal separator
      group = ",", // default group separator
      np = "\u2212", // default negative prefix
      ns = "",
      prettyFormatBigNumbers = false;


  /** @private */
  function format(x) {
    /* Round the fractional part, and split on decimal separator. */
    if (Infinity > maxf) x = Math.round(x * maxk) / maxk;
    if (prettyFormatBigNumbers) {
      /* If less than 10k, don't do anything */
      if (x < 1e4 && x > -1e4) {
        x = parseFloat(x).toFixed(1);
        return (((x * 10) % 10) > 0) ? x : Math.round(x);
      }

      x = parseInt(x, 10);
      return x < -1e12 && (x/1e12).toPrecision(4) + ' T' ||
            x < -1e9 && (x/1e9).toPrecision(4) + ' B' ||
            x < -1e6 && (x/1e6).toPrecision(4) + ' M' ||
            x < -1e3 && (x/1e3).toPrecision(4) + 'K' ||
            x < 1e3 && x ||
            x < 1e6 && (x/1e3).toPrecision(4) + ' K' ||
            x < 1e9 && (x/1e6).toPrecision(4) + ' M' ||
            x < 1e12 && (x/1e9).toPrecision(4) + ' B' ||
            x < 1e15 && (x/1e12).toPrecision(4) + ' T' ||
            x;
    }

    var s = String(Math.abs(x)).split(".");

    /* Pad, truncate and group the integral part. */
    var i = s[0];

    if (i.length > maxi) i = i.substring(i.length - maxi);
    if (padg && (i.length < mini)) i = new Array(mini - i.length + 1).join(padi) + i;
    if (i.length > 3) i = i.replace(/\B(?=(?:\d{3})+(?!\d))/g, group);
    if (!padg && (i.length < mins)) i = new Array(mins - i.length + 1).join(padi) + i;
    s[0] = x < 0 ? np + i + ns : i;

    /* Pad the fractional part. */
    var f = s[1] || "";
    if (f.length < minf) s[1] = f + new Array(minf - f.length + 1).join(padf);

    return s.join(decimal);
  }

  /**
   * @function
   * @name pv.Format.number.prototype.format
   * @param {number} x
   * @returns {string}
   */
  format.format = format;

  /**
   * Parses the specified string as a number. Before parsing, leading and
   * trailing padding is removed. Group separators are also removed, and the
   * decimal separator is replaced with the standard point ("."). The integer
   * part is truncated per the maximum integer digits, and the fraction part is
   * rounded per the maximum fraction digits.
   *
   * @function
   * @name pv.Format.number.prototype.parse
   * @param {string} x the string to parse.
   * @returns {number} the parsed number.
   */
  format.parse = function(x) {
    var re = pv.Format.re;

    /* Remove leading and trailing padding. Split on the decimal separator, if exists. */
    var s = String(x).split(decimal);
    if(s.length == 1)
      s[1]="";
    s[0].replace(new RegExp("^(" + re(padi) + ")*"), "");
    s[1].replace(new RegExp("(" + re(padf) + ")*$"), "");

    /* Remove grouping and truncate the integral part. */
    var i = s[0].replace(new RegExp(re(group), "g"), "");
    if (i.length > maxi) i = i.substring(i.length - maxi);

    /* Round the fractional part. */
    var f = s[1] ? Number("0." + s[1]) : 0;
    if (Infinity > maxf) f = Math.round(f * maxk) / maxk;

    return Math.round(i) + f;
  };

  /**
   * Sets or gets the minimum and maximum number of integer digits. This
   * controls the number of decimal digits to display before the decimal
   * separator for the integral part of the number. If the number of digits is
   * smaller than the minimum, the digits are padded; if the number of digits is
   * larger, the digits are truncated, showing only the lower-order digits. The
   * default range is [0, Infinity].
   *
   * <p>If only one argument is specified to this method, this value is used as
   * both the minimum and maximum number. If no arguments are specified, a
   * two-element array is returned containing the minimum and the maximum.
   *
   * @function
   * @name pv.Format.number.prototype.integerDigits
   * @param {number} [min] the minimum integer digits.
   * @param {number} [max] the maximum integer digits.
   * @returns {pv.Format.number} <tt>this</tt>, or the current integer digits.
   */
  format.integerDigits = function(min, max) {
    if (arguments.length) {
      mini = Number(min);
      maxi = (arguments.length > 1) ? Number(max) : mini;
      mins = mini + Math.floor(mini / 3) * group.length;
      return this;
    }
    return [mini, maxi];
  };

  /**
   * Sets or gets the minimum and maximum number of fraction digits. The
   * controls the number of decimal digits to display after the decimal
   * separator for the fractional part of the number. If the number of digits is
   * smaller than the minimum, the digits are padded; if the number of digits is
   * larger, the fractional part is rounded, showing only the higher-order
   * digits. The default range is [0, 0].
   *
   * <p>If only one argument is specified to this method, this value is used as
   * both the minimum and maximum number. If no arguments are specified, a
   * two-element array is returned containing the minimum and the maximum.
   *
   * @function
   * @name pv.Format.number.prototype.fractionDigits
   * @param {number} [min] the minimum fraction digits.
   * @param {number} [max] the maximum fraction digits.
   * @returns {pv.Format.number} <tt>this</tt>, or the current fraction digits.
   */
  format.fractionDigits = function(min, max) {
    if (arguments.length) {
      minf = Number(min);
      maxf = (arguments.length > 1) ? Number(max) : minf;
      maxk = Math.pow(10, maxf);
      return this;
    }
    return [minf, maxf];
  };

  /**
   * Sets or gets the character used to pad the integer part. The integer pad is
   * used when the number of integer digits is smaller than the minimum. The
   * default pad character is "0" (zero).
   *
   * @param {string} [x] the new pad character.
   * @returns {pv.Format.number} <tt>this</tt> or the current pad character.
   */
  format.integerPad = function(x) {
    if (arguments.length) {
      padi = String(x);
      padg = /\d/.test(padi);
      return this;
    }
    return padi;
  };

  /**
   * Sets or gets the character used to pad the fration part. The fraction pad
   * is used when the number of fraction digits is smaller than the minimum. The
   * default pad character is "0" (zero).
   *
   * @param {string} [x] the new pad character.
   * @returns {pv.Format.number} <tt>this</tt> or the current pad character.
   */
  format.fractionPad = function(x) {
    if (arguments.length) {
      padf = String(x);
      return this;
    }
    return padf;
  };

  /**
   * Sets or gets the character used as the decimal point, separating the
   * integer and fraction parts of the number. The default decimal point is ".".
   *
   * @param {string} [x] the new decimal separator.
   * @returns {pv.Format.number} <tt>this</tt> or the current decimal separator.
   */
  format.decimal = function(x) {
    if (arguments.length) {
      decimal = String(x);
      return this;
    }
    return decimal;
  };

  /**
   * Sets or gets the character used as the group separator, grouping integer
   * digits by thousands. The default decimal point is ",". Grouping can be
   * disabled by using "" for the separator.
   *
   * @param {string} [x] the new group separator.
   * @returns {pv.Format.number} <tt>this</tt> or the current group separator.
   */
  format.group = function(x) {
    if (arguments.length) {
      group = x ? String(x) : "";
      mins = mini + Math.floor(mini / 3) * group.length;
      return this;
    }
    return group;
  };

  /**
   * Returns a pretty formatted version of the integer if it's > 1K
   * For large numbers, 3000 --> 3K, 10000 -> 10K, 10100 -> 10.1K,
   * 3000000 -> 3M, etc.
   * @param {boolean} on - whether or not to use pretty formatting for big numbers
   * @returns {pv.Format.number} <tt>this</tt> or the state
   */
  format.bigNumbers = function(on) {
    if (arguments.length) {
      prettyFormatBigNumbers = on;
      return this;
    }
    return on;
  };

  /**
   * Sets or gets the negative prefix and suffix. The default negative prefix is
   * "&minus;", and the default negative suffix is the empty string.
   *
   * @param {string} [x] the negative prefix.
   * @param {string} [y] the negative suffix.
   * @returns {pv.Format.number} <tt>this</tt> or the current negative format.
   */
  format.negativeAffix = function(x, y) {
    if (arguments.length) {
      np = String(x || "");
      ns = String(y || "");
      return this;
    }
    return [np, ns];
  };

  return format;
};
