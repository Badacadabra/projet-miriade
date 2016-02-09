//! moment.js
//! version : 2.9.0
//! authors : Tim Wood, Iskren Chernev, Moment.js contributors
//! license : MIT
//! momentjs.com

(function (undefined) {
    /************************************
        Constants
    ************************************/

    var moment,
        VERSION = '2.9.0',
        // the global-scope this is NOT the global object in Node.js
        globalScope = (typeof global !== 'undefined' && (typeof window === 'undefined' || window === global.window)) ? global : this,
        oldGlobalMoment,
        round = Math.round,
        hasOwnProperty = Object.prototype.hasOwnProperty,
        i,

        YEAR = 0,
        MONTH = 1,
        DATE = 2,
        HOUR = 3,
        MINUTE = 4,
        SECOND = 5,
        MILLISECOND = 6,

        // internal storage for locale config files
        locales = {},

        // extra moment internal properties (plugins register props here)
        momentProperties = [],

        // check for nodeJS
        hasModule = (typeof module !== 'undefined' && module && module.exports),

        // ASP.NET json date format regex
        aspNetJsonRegex = /^\/?Date\((\-?\d+)/i,
        aspNetTimeSpanJsonRegex = /(\-)?(?:(\d*)\.)?(\d+)\:(\d+)(?:\:(\d+)\.?(\d{3})?)?/,

        // from http://docs.closure-library.googlecode.com/git/closure_goog_date_date.js.source.html
        // somewhat more in line with 4.4.3.2 2004 spec, but allows decimal anywhere
        isoDurationRegex = /^(-)?P(?:(?:([0-9,.]*)Y)?(?:([0-9,.]*)M)?(?:([0-9,.]*)D)?(?:T(?:([0-9,.]*)H)?(?:([0-9,.]*)M)?(?:([0-9,.]*)S)?)?|([0-9,.]*)W)$/,

        // format tokens
        formattingTokens = /(\[[^\[]*\])|(\\)?(Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Q|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|mm?|ss?|S{1,4}|x|X|zz?|ZZ?|.)/g,
        localFormattingTokens = /(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g,

        // parsing token regexes
        parseTokenOneOrTwoDigits = /\d\d?/, // 0 - 99
        parseTokenOneToThreeDigits = /\d{1,3}/, // 0 - 999
        parseTokenOneToFourDigits = /\d{1,4}/, // 0 - 9999
        parseTokenOneToSixDigits = /[+\-]?\d{1,6}/, // -999,999 - 999,999
        parseTokenDigits = /\d+/, // nonzero number of digits
        parseTokenWord = /[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i, // any word (or two) characters or numbers including two/three word month in arabic.
        parseTokenTimezone = /Z|[\+\-]\d\d:?\d\d/gi, // +00:00 -00:00 +0000 -0000 or Z
        parseTokenT = /T/i, // T (ISO separator)
        parseTokenOffsetMs = /[\+\-]?\d+/, // 1234567890123
        parseTokenTimestampMs = /[\+\-]?\d+(\.\d{1,3})?/, // 123456789 123456789.123

        //strict parsing regexes
        parseTokenOneDigit = /\d/, // 0 - 9
        parseTokenTwoDigits = /\d\d/, // 00 - 99
        parseTokenThreeDigits = /\d{3}/, // 000 - 999
        parseTokenFourDigits = /\d{4}/, // 0000 - 9999
        parseTokenSixDigits = /[+-]?\d{6}/, // -999,999 - 999,999
        parseTokenSignedNumber = /[+-]?\d+/, // -inf - inf

        // iso 8601 regex
        // 0000-00-00 0000-W00 or 0000-W00-0 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000 or +00)
        isoRegex = /^\s*(?:[+-]\d{6}|\d{4})-(?:(\d\d-\d\d)|(W\d\d$)|(W\d\d-\d)|(\d\d\d))((T| )(\d\d(:\d\d(:\d\d(\.\d+)?)?)?)?([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/,

        isoFormat = 'YYYY-MM-DDTHH:mm:ssZ',

        isoDates = [
            ['YYYYYY-MM-DD', /[+-]\d{6}-\d{2}-\d{2}/],
            ['YYYY-MM-DD', /\d{4}-\d{2}-\d{2}/],
            ['GGGG-[W]WW-E', /\d{4}-W\d{2}-\d/],
            ['GGGG-[W]WW', /\d{4}-W\d{2}/],
            ['YYYY-DDD', /\d{4}-\d{3}/]
        ],

        // iso time formats and regexes
        isoTimes = [
            ['HH:mm:ss.SSSS', /(T| )\d\d:\d\d:\d\d\.\d+/],
            ['HH:mm:ss', /(T| )\d\d:\d\d:\d\d/],
            ['HH:mm', /(T| )\d\d:\d\d/],
            ['HH', /(T| )\d\d/]
        ],

        // timezone chunker '+10:00' > ['10', '00'] or '-1530' > ['-', '15', '30']
        parseTimezoneChunker = /([\+\-]|\d\d)/gi,

        // getter and setter names
        proxyGettersAndSetters = 'Date|Hours|Minutes|Seconds|Milliseconds'.split('|'),
        unitMillisecondFactors = {
            'Milliseconds' : 1,
            'Seconds' : 1e3,
            'Minutes' : 6e4,
            'Hours' : 36e5,
            'Days' : 864e5,
            'Months' : 2592e6,
            'Years' : 31536e6
        },

        unitAliases = {
            ms : 'millisecond',
            s : 'second',
            m : 'minute',
            h : 'hour',
            d : 'day',
            D : 'date',
            w : 'week',
            W : 'isoWeek',
            M : 'month',
            Q : 'quarter',
            y : 'year',
            DDD : 'dayOfYear',
            e : 'weekday',
            E : 'isoWeekday',
            gg: 'weekYear',
            GG: 'isoWeekYear'
        },

        camelFunctions = {
            dayofyear : 'dayOfYear',
            isoweekday : 'isoWeekday',
            isoweek : 'isoWeek',
            weekyear : 'weekYear',
            isoweekyear : 'isoWeekYear'
        },

        // format function strings
        formatFunctions = {},

        // default relative time thresholds
        relativeTimeThresholds = {
            s: 45,  // seconds to minute
            m: 45,  // minutes to hour
            h: 22,  // hours to day
            d: 26,  // days to month
            M: 11   // months to year
        },

        // tokens to ordinalize and pad
        ordinalizeTokens = 'DDD w W M D d'.split(' '),
        paddedTokens = 'M D H h m s w W'.split(' '),

        formatTokenFunctions = {
            M    : function () {
                return this.month() + 1;
            },
            MMM  : function (format) {
                return this.localeData().monthsShort(this, format);
            },
            MMMM : function (format) {
                return this.localeData().months(this, format);
            },
            D    : function () {
                return this.date();
            },
            DDD  : function () {
                return this.dayOfYear();
            },
            d    : function () {
                return this.day();
            },
            dd   : function (format) {
                return this.localeData().weekdaysMin(this, format);
            },
            ddd  : function (format) {
                return this.localeData().weekdaysShort(this, format);
            },
            dddd : function (format) {
                return this.localeData().weekdays(this, format);
            },
            w    : function () {
                return this.week();
            },
            W    : function () {
                return this.isoWeek();
            },
            YY   : function () {
                return leftZeroFill(this.year() % 100, 2);
            },
            YYYY : function () {
                return leftZeroFill(this.year(), 4);
            },
            YYYYY : function () {
                return leftZeroFill(this.year(), 5);
            },
            YYYYYY : function () {
                var y = this.year(), sign = y >= 0 ? '+' : '-';
                return sign + leftZeroFill(Math.abs(y), 6);
            },
            gg   : function () {
                return leftZeroFill(this.weekYear() % 100, 2);
            },
            gggg : function () {
                return leftZeroFill(this.weekYear(), 4);
            },
            ggggg : function () {
                return leftZeroFill(this.weekYear(), 5);
            },
            GG   : function () {
                return leftZeroFill(this.isoWeekYear() % 100, 2);
            },
            GGGG : function () {
                return leftZeroFill(this.isoWeekYear(), 4);
            },
            GGGGG : function () {
                return leftZeroFill(this.isoWeekYear(), 5);
            },
            e : function () {
                return this.weekday();
            },
            E : function () {
                return this.isoWeekday();
            },
            a    : function () {
                return this.localeData().meridiem(this.hours(), this.minutes(), true);
            },
            A    : function () {
                return this.localeData().meridiem(this.hours(), this.minutes(), false);
            },
            H    : function () {
                return this.hours();
            },
            h    : function () {
                return this.hours() % 12 || 12;
            },
            m    : function () {
                return this.minutes();
            },
            s    : function () {
                return this.seconds();
            },
            S    : function () {
                return toInt(this.milliseconds() / 100);
            },
            SS   : function () {
                return leftZeroFill(toInt(this.milliseconds() / 10), 2);
            },
            SSS  : function () {
                return leftZeroFill(this.milliseconds(), 3);
            },
            SSSS : function () {
                return leftZeroFill(this.milliseconds(), 3);
            },
            Z    : function () {
                var a = this.utcOffset(),
                    b = '+';
                if (a < 0) {
                    a = -a;
                    b = '-';
                }
                return b + leftZeroFill(toInt(a / 60), 2) + ':' + leftZeroFill(toInt(a) % 60, 2);
            },
            ZZ   : function () {
                var a = this.utcOffset(),
                    b = '+';
                if (a < 0) {
                    a = -a;
                    b = '-';
                }
                return b + leftZeroFill(toInt(a / 60), 2) + leftZeroFill(toInt(a) % 60, 2);
            },
            z : function () {
                return this.zoneAbbr();
            },
            zz : function () {
                return this.zoneName();
            },
            x    : function () {
                return this.valueOf();
            },
            X    : function () {
                return this.unix();
            },
            Q : function () {
                return this.quarter();
            }
        },

        deprecations = {},

        lists = ['months', 'monthsShort', 'weekdays', 'weekdaysShort', 'weekdaysMin'],

        updateInProgress = false;

    // Pick the first defined of two or three arguments. dfl comes from
    // default.
    function dfl(a, b, c) {
        switch (arguments.length) {
            case 2: return a != null ? a : b;
            case 3: return a != null ? a : b != null ? b : c;
            default: throw new Error('Implement me');
        }
    }

    function hasOwnProp(a, b) {
        return hasOwnProperty.call(a, b);
    }

    function defaultParsingFlags() {
        // We need to deep clone this object, and es5 standard is not very
        // helpful.
        return {
            empty : false,
            unusedTokens : [],
            unusedInput : [],
            overflow : -2,
            charsLeftOver : 0,
            nullInput : false,
            invalidMonth : null,
            invalidFormat : false,
            userInvalidated : false,
            iso: false
        };
    }

    function printMsg(msg) {
        if (moment.suppressDeprecationWarnings === false &&
                typeof console !== 'undefined' && console.warn) {
            console.warn('Deprecation warning: ' + msg);
        }
    }

    function deprecate(msg, fn) {
        var firstTime = true;
        return extend(function () {
            if (firstTime) {
                printMsg(msg);
                firstTime = false;
            }
            return fn.apply(this, arguments);
        }, fn);
    }

    function deprecateSimple(name, msg) {
        if (!deprecations[name]) {
            printMsg(msg);
            deprecations[name] = true;
        }
    }

    function padToken(func, count) {
        return function (a) {
            return leftZeroFill(func.call(this, a), count);
        };
    }
    function ordinalizeToken(func, period) {
        return function (a) {
            return this.localeData().ordinal(func.call(this, a), period);
        };
    }

    function monthDiff(a, b) {
        // difference in months
        var wholeMonthDiff = ((b.year() - a.year()) * 12) + (b.month() - a.month()),
            // b is in (anchor - 1 month, anchor + 1 month)
            anchor = a.clone().add(wholeMonthDiff, 'months'),
            anchor2, adjust;

        if (b - anchor < 0) {
            anchor2 = a.clone().add(wholeMonthDiff - 1, 'months');
            // linear across the month
            adjust = (b - anchor) / (anchor - anchor2);
        } else {
            anchor2 = a.clone().add(wholeMonthDiff + 1, 'months');
            // linear across the month
            adjust = (b - anchor) / (anchor2 - anchor);
        }

        return -(wholeMonthDiff + adjust);
    }

    while (ordinalizeTokens.length) {
        i = ordinalizeTokens.pop();
        formatTokenFunctions[i + 'o'] = ordinalizeToken(formatTokenFunctions[i], i);
    }
    while (paddedTokens.length) {
        i = paddedTokens.pop();
        formatTokenFunctions[i + i] = padToken(formatTokenFunctions[i], 2);
    }
    formatTokenFunctions.DDDD = padToken(formatTokenFunctions.DDD, 3);


    function meridiemFixWrap(locale, hour, meridiem) {
        var isPm;

        if (meridiem == null) {
            // nothing to do
            return hour;
        }
        if (locale.meridiemHour != null) {
            return locale.meridiemHour(hour, meridiem);
        } else if (locale.isPM != null) {
            // Fallback
            isPm = locale.isPM(meridiem);
            if (isPm && hour < 12) {
                hour += 12;
            }
            if (!isPm && hour === 12) {
                hour = 0;
            }
            return hour;
        } else {
            // thie is not supposed to happen
            return hour;
        }
    }

    /************************************
        Constructors
    ************************************/

    function Locale() {
    }

    // Moment prototype object
    function Moment(config, skipOverflow) {
        if (skipOverflow !== false) {
            checkOverflow(config);
        }
        copyConfig(this, config);
        this._d = new Date(+config._d);
        // Prevent infinite loop in case updateOffset creates new moment
        // objects.
        if (updateInProgress === false) {
            updateInProgress = true;
            moment.updateOffset(this);
            updateInProgress = false;
        }
    }

    // Duration Constructor
    function Duration(duration) {
        var normalizedInput = normalizeObjectUnits(duration),
            years = normalizedInput.year || 0,
            quarters = normalizedInput.quarter || 0,
            months = normalizedInput.month || 0,
            weeks = normalizedInput.week || 0,
            days = normalizedInput.day || 0,
            hours = normalizedInput.hour || 0,
            minutes = normalizedInput.minute || 0,
            seconds = normalizedInput.second || 0,
            milliseconds = normalizedInput.millisecond || 0;

        // representation for dateAddRemove
        this._milliseconds = +milliseconds +
            seconds * 1e3 + // 1000
            minutes * 6e4 + // 1000 * 60
            hours * 36e5; // 1000 * 60 * 60
        // Because of dateAddRemove treats 24 hours as different from a
        // day when working around DST, we need to store them separately
        this._days = +days +
            weeks * 7;
        // It is impossible translate months into days without knowing
        // which months you are are talking about, so we have to store
        // it separately.
        this._months = +months +
            quarters * 3 +
            years * 12;

        this._data = {};

        this._locale = moment.localeData();

        this._bubble();
    }

    /************************************
        Helpers
    ************************************/


    function extend(a, b) {
        for (var i in b) {
            if (hasOwnProp(b, i)) {
                a[i] = b[i];
            }
        }

        if (hasOwnProp(b, 'toString')) {
            a.toString = b.toString;
        }

        if (hasOwnProp(b, 'valueOf')) {
            a.valueOf = b.valueOf;
        }

        return a;
    }

    function copyConfig(to, from) {
        var i, prop, val;

        if (typeof from._isAMomentObject !== 'undefined') {
            to._isAMomentObject = from._isAMomentObject;
        }
        if (typeof from._i !== 'undefined') {
            to._i = from._i;
        }
        if (typeof from._f !== 'undefined') {
            to._f = from._f;
        }
        if (typeof from._l !== 'undefined') {
            to._l = from._l;
        }
        if (typeof from._strict !== 'undefined') {
            to._strict = from._strict;
        }
        if (typeof from._tzm !== 'undefined') {
            to._tzm = from._tzm;
        }
        if (typeof from._isUTC !== 'undefined') {
            to._isUTC = from._isUTC;
        }
        if (typeof from._offset !== 'undefined') {
            to._offset = from._offset;
        }
        if (typeof from._pf !== 'undefined') {
            to._pf = from._pf;
        }
        if (typeof from._locale !== 'undefined') {
            to._locale = from._locale;
        }

        if (momentProperties.length > 0) {
            for (i in momentProperties) {
                prop = momentProperties[i];
                val = from[prop];
                if (typeof val !== 'undefined') {
                    to[prop] = val;
                }
            }
        }

        return to;
    }

    function absRound(number) {
        if (number < 0) {
            return Math.ceil(number);
        } else {
            return Math.floor(number);
        }
    }

    // left zero fill a number
    // see http://jsperf.com/left-zero-filling for performance comparison
    function leftZeroFill(number, targetLength, forceSign) {
        var output = '' + Math.abs(number),
            sign = number >= 0;

        while (output.length < targetLength) {
            output = '0' + output;
        }
        return (sign ? (forceSign ? '+' : '') : '-') + output;
    }

    function positiveMomentsDifference(base, other) {
        var res = {milliseconds: 0, months: 0};

        res.months = other.month() - base.month() +
            (other.year() - base.year()) * 12;
        if (base.clone().add(res.months, 'M').isAfter(other)) {
            --res.months;
        }

        res.milliseconds = +other - +(base.clone().add(res.months, 'M'));

        return res;
    }

    function momentsDifference(base, other) {
        var res;
        other = makeAs(other, base);
        if (base.isBefore(other)) {
            res = positiveMomentsDifference(base, other);
        } else {
            res = positiveMomentsDifference(other, base);
            res.milliseconds = -res.milliseconds;
            res.months = -res.months;
        }

        return res;
    }

    // TODO: remove 'name' arg after deprecation is removed
    function createAdder(direction, name) {
        return function (val, period) {
            var dur, tmp;
            //invert the arguments, but complain about it
            if (period !== null && !isNaN(+period)) {
                deprecateSimple(name, 'moment().' + name  + '(period, number) is deprecated. Please use moment().' + name + '(number, period).');
                tmp = val; val = period; period = tmp;
            }

            val = typeof val === 'string' ? +val : val;
            dur = moment.duration(val, period);
            addOrSubtractDurationFromMoment(this, dur, direction);
            return this;
        };
    }

    function addOrSubtractDurationFromMoment(mom, duration, isAdding, updateOffset) {
        var milliseconds = duration._milliseconds,
            days = duration._days,
            months = duration._months;
        updateOffset = updateOffset == null ? true : updateOffset;

        if (milliseconds) {
            mom._d.setTime(+mom._d + milliseconds * isAdding);
        }
        if (days) {
            rawSetter(mom, 'Date', rawGetter(mom, 'Date') + days * isAdding);
        }
        if (months) {
            rawMonthSetter(mom, rawGetter(mom, 'Month') + months * isAdding);
        }
        if (updateOffset) {
            moment.updateOffset(mom, days || months);
        }
    }

    // check if is an array
    function isArray(input) {
        return Object.prototype.toString.call(input) === '[object Array]';
    }

    function isDate(input) {
        return Object.prototype.toString.call(input) === '[object Date]' ||
            input instanceof Date;
    }

    // compare two arrays, return the number of differences
    function compareArrays(array1, array2, dontConvert) {
        var len = Math.min(array1.length, array2.length),
            lengthDiff = Math.abs(array1.length - array2.length),
            diffs = 0,
            i;
        for (i = 0; i < len; i++) {
            if ((dontConvert && array1[i] !== array2[i]) ||
                (!dontConvert && toInt(array1[i]) !== toInt(array2[i]))) {
                diffs++;
            }
        }
        return diffs + lengthDiff;
    }

    function normalizeUnits(units) {
        if (units) {
            var lowered = units.toLowerCase().replace(/(.)s$/, '$1');
            units = unitAliases[units] || camelFunctions[lowered] || lowered;
        }
        return units;
    }

    function normalizeObjectUnits(inputObject) {
        var normalizedInput = {},
            normalizedProp,
            prop;

        for (prop in inputObject) {
            if (hasOwnProp(inputObject, prop)) {
                normalizedProp = normalizeUnits(prop);
                if (normalizedProp) {
                    normalizedInput[normalizedProp] = inputObject[prop];
                }
            }
        }

        return normalizedInput;
    }

    function makeList(field) {
        var count, setter;

        if (field.indexOf('week') === 0) {
            count = 7;
            setter = 'day';
        }
        else if (field.indexOf('month') === 0) {
            count = 12;
            setter = 'month';
        }
        else {
            return;
        }

        moment[field] = function (format, index) {
            var i, getter,
                method = moment._locale[field],
                results = [];

            if (typeof format === 'number') {
                index = format;
                format = undefined;
            }

            getter = function (i) {
                var m = moment().utc().set(setter, i);
                return method.call(moment._locale, m, format || '');
            };

            if (index != null) {
                return getter(index);
            }
            else {
                for (i = 0; i < count; i++) {
                    results.push(getter(i));
                }
                return results;
            }
        };
    }

    function toInt(argumentForCoercion) {
        var coercedNumber = +argumentForCoercion,
            value = 0;

        if (coercedNumber !== 0 && isFinite(coercedNumber)) {
            if (coercedNumber >= 0) {
                value = Math.floor(coercedNumber);
            } else {
                value = Math.ceil(coercedNumber);
            }
        }

        return value;
    }

    function daysInMonth(year, month) {
        return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    }

    function weeksInYear(year, dow, doy) {
        return weekOfYear(moment([year, 11, 31 + dow - doy]), dow, doy).week;
    }

    function daysInYear(year) {
        return isLeapYear(year) ? 366 : 365;
    }

    function isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    }

    function checkOverflow(m) {
        var overflow;
        if (m._a && m._pf.overflow === -2) {
            overflow =
                m._a[MONTH] < 0 || m._a[MONTH] > 11 ? MONTH :
                m._a[DATE] < 1 || m._a[DATE] > daysInMonth(m._a[YEAR], m._a[MONTH]) ? DATE :
                m._a[HOUR] < 0 || m._a[HOUR] > 24 ||
                    (m._a[HOUR] === 24 && (m._a[MINUTE] !== 0 ||
                                           m._a[SECOND] !== 0 ||
                                           m._a[MILLISECOND] !== 0)) ? HOUR :
                m._a[MINUTE] < 0 || m._a[MINUTE] > 59 ? MINUTE :
                m._a[SECOND] < 0 || m._a[SECOND] > 59 ? SECOND :
                m._a[MILLISECOND] < 0 || m._a[MILLISECOND] > 999 ? MILLISECOND :
                -1;

            if (m._pf._overflowDayOfYear && (overflow < YEAR || overflow > DATE)) {
                overflow = DATE;
            }

            m._pf.overflow = overflow;
        }
    }

    function isValid(m) {
        if (m._isValid == null) {
            m._isValid = !isNaN(m._d.getTime()) &&
                m._pf.overflow < 0 &&
                !m._pf.empty &&
                !m._pf.invalidMonth &&
                !m._pf.nullInput &&
                !m._pf.invalidFormat &&
                !m._pf.userInvalidated;

            if (m._strict) {
                m._isValid = m._isValid &&
                    m._pf.charsLeftOver === 0 &&
                    m._pf.unusedTokens.length === 0 &&
                    m._pf.bigHour === undefined;
            }
        }
        return m._isValid;
    }

    function normalizeLocale(key) {
        return key ? key.toLowerCase().replace('_', '-') : key;
    }

    // pick the locale from the array
    // try ['en-au', 'en-gb'] as 'en-au', 'en-gb', 'en', as in move through the list trying each
    // substring from most specific to least, but move to the next array item if it's a more specific variant than the current root
    function chooseLocale(names) {
        var i = 0, j, next, locale, split;

        while (i < names.length) {
            split = normalizeLocale(names[i]).split('-');
            j = split.length;
            next = normalizeLocale(names[i + 1]);
            next = next ? next.split('-') : null;
            while (j > 0) {
                locale = loadLocale(split.slice(0, j).join('-'));
                if (locale) {
                    return locale;
                }
                if (next && next.length >= j && compareArrays(split, next, true) >= j - 1) {
                    //the next array item is better than a shallower substring of this one
                    break;
                }
                j--;
            }
            i++;
        }
        return null;
    }

    function loadLocale(name) {
        var oldLocale = null;
        if (!locales[name] && hasModule) {
            try {
                oldLocale = moment.locale();
                require('./locale/' + name);
                // because defineLocale currently also sets the global locale, we want to undo that for lazy loaded locales
                moment.locale(oldLocale);
            } catch (e) { }
        }
        return locales[name];
    }

    // Return a moment from input, that is local/utc/utcOffset equivalent to
    // model.
    function makeAs(input, model) {
        var res, diff;
        if (model._isUTC) {
            res = model.clone();
            diff = (moment.isMoment(input) || isDate(input) ?
                    +input : +moment(input)) - (+res);
            // Use low-level api, because this fn is low-level api.
            res._d.setTime(+res._d + diff);
            moment.updateOffset(res, false);
            return res;
        } else {
            return moment(input).local();
        }
    }

    /************************************
        Locale
    ************************************/


    extend(Locale.prototype, {

        set : function (config) {
            var prop, i;
            for (i in config) {
                prop = config[i];
                if (typeof prop === 'function') {
                    this[i] = prop;
                } else {
                    this['_' + i] = prop;
                }
            }
            // Lenient ordinal parsing accepts just a number in addition to
            // number + (possibly) stuff coming from _ordinalParseLenient.
            this._ordinalParseLenient = new RegExp(this._ordinalParse.source + '|' + /\d{1,2}/.source);
        },

        _months : 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_'),
        months : function (m) {
            return this._months[m.month()];
        },

        _monthsShort : 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
        monthsShort : function (m) {
            return this._monthsShort[m.month()];
        },

        monthsParse : function (monthName, format, strict) {
            var i, mom, regex;

            if (!this._monthsParse) {
                this._monthsParse = [];
                this._longMonthsParse = [];
                this._shortMonthsParse = [];
            }

            for (i = 0; i < 12; i++) {
                // make the regex if we don't have it already
                mom = moment.utc([2000, i]);
                if (strict && !this._longMonthsParse[i]) {
                    this._longMonthsParse[i] = new RegExp('^' + this.months(mom, '').replace('.', '') + '$', 'i');
                    this._shortMonthsParse[i] = new RegExp('^' + this.monthsShort(mom, '').replace('.', '') + '$', 'i');
                }
                if (!strict && !this._monthsParse[i]) {
                    regex = '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
                    this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
                }
                // test the regex
                if (strict && format === 'MMMM' && this._longMonthsParse[i].test(monthName)) {
                    return i;
                } else if (strict && format === 'MMM' && this._shortMonthsParse[i].test(monthName)) {
                    return i;
                } else if (!strict && this._monthsParse[i].test(monthName)) {
                    return i;
                }
            }
        },

        _weekdays : 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_'),
        weekdays : function (m) {
            return this._weekdays[m.day()];
        },

        _weekdaysShort : 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
        weekdaysShort : function (m) {
            return this._weekdaysShort[m.day()];
        },

        _weekdaysMin : 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
        weekdaysMin : function (m) {
            return this._weekdaysMin[m.day()];
        },

        weekdaysParse : function (weekdayName) {
            var i, mom, regex;

            if (!this._weekdaysParse) {
                this._weekdaysParse = [];
            }

            for (i = 0; i < 7; i++) {
                // make the regex if we don't have it already
                if (!this._weekdaysParse[i]) {
                    mom = moment([2000, 1]).day(i);
                    regex = '^' + this.weekdays(mom, '') + '|^' + this.weekdaysShort(mom, '') + '|^' + this.weekdaysMin(mom, '');
                    this._weekdaysParse[i] = new RegExp(regex.replace('.', ''), 'i');
                }
                // test the regex
                if (this._weekdaysParse[i].test(weekdayName)) {
                    return i;
                }
            }
        },

        _longDateFormat : {
            LTS : 'h:mm:ss A',
            LT : 'h:mm A',
            L : 'MM/DD/YYYY',
            LL : 'MMMM D, YYYY',
            LLL : 'MMMM D, YYYY LT',
            LLLL : 'dddd, MMMM D, YYYY LT'
        },
        longDateFormat : function (key) {
            var output = this._longDateFormat[key];
            if (!output && this._longDateFormat[key.toUpperCase()]) {
                output = this._longDateFormat[key.toUpperCase()].replace(/MMMM|MM|DD|dddd/g, function (val) {
                    return val.slice(1);
                });
                this._longDateFormat[key] = output;
            }
            return output;
        },

        isPM : function (input) {
            // IE8 Quirks Mode & IE7 Standards Mode do not allow accessing strings like arrays
            // Using charAt should be more compatible.
            return ((input + '').toLowerCase().charAt(0) === 'p');
        },

        _meridiemParse : /[ap]\.?m?\.?/i,
        meridiem : function (hours, minutes, isLower) {
            if (hours > 11) {
                return isLower ? 'pm' : 'PM';
            } else {
                return isLower ? 'am' : 'AM';
            }
        },


        _calendar : {
            sameDay : '[Today at] LT',
            nextDay : '[Tomorrow at] LT',
            nextWeek : 'dddd [at] LT',
            lastDay : '[Yesterday at] LT',
            lastWeek : '[Last] dddd [at] LT',
            sameElse : 'L'
        },
        calendar : function (key, mom, now) {
            var output = this._calendar[key];
            return typeof output === 'function' ? output.apply(mom, [now]) : output;
        },

        _relativeTime : {
            future : 'in %s',
            past : '%s ago',
            s : 'a few seconds',
            m : 'a minute',
            mm : '%d minutes',
            h : 'an hour',
            hh : '%d hours',
            d : 'a day',
            dd : '%d days',
            M : 'a month',
            MM : '%d months',
            y : 'a year',
            yy : '%d years'
        },

        relativeTime : function (number, withoutSuffix, string, isFuture) {
            var output = this._relativeTime[string];
            return (typeof output === 'function') ?
                output(number, withoutSuffix, string, isFuture) :
                output.replace(/%d/i, number);
        },

        pastFuture : function (diff, output) {
            var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
            return typeof format === 'function' ? format(output) : format.replace(/%s/i, output);
        },

        ordinal : function (number) {
            return this._ordinal.replace('%d', number);
        },
        _ordinal : '%d',
        _ordinalParse : /\d{1,2}/,

        preparse : function (string) {
            return string;
        },

        postformat : function (string) {
            return string;
        },

        week : function (mom) {
            return weekOfYear(mom, this._week.dow, this._week.doy).week;
        },

        _week : {
            dow : 0, // Sunday is the first day of the week.
            doy : 6  // The week that contains Jan 1st is the first week of the year.
        },

        firstDayOfWeek : function () {
            return this._week.dow;
        },

        firstDayOfYear : function () {
            return this._week.doy;
        },

        _invalidDate: 'Invalid date',
        invalidDate: function () {
            return this._invalidDate;
        }
    });

    /************************************
        Formatting
    ************************************/


    function removeFormattingTokens(input) {
        if (input.match(/\[[\s\S]/)) {
            return input.replace(/^\[|\]$/g, '');
        }
        return input.replace(/\\/g, '');
    }

    function makeFormatFunction(format) {
        var array = format.match(formattingTokens), i, length;

        for (i = 0, length = array.length; i < length; i++) {
            if (formatTokenFunctions[array[i]]) {
                array[i] = formatTokenFunctions[array[i]];
            } else {
                array[i] = removeFormattingTokens(array[i]);
            }
        }

        return function (mom) {
            var output = '';
            for (i = 0; i < length; i++) {
                output += array[i] instanceof Function ? array[i].call(mom, format) : array[i];
            }
            return output;
        };
    }

    // format date using native date object
    function formatMoment(m, format) {
        if (!m.isValid()) {
            return m.localeData().invalidDate();
        }

        format = expandFormat(format, m.localeData());

        if (!formatFunctions[format]) {
            formatFunctions[format] = makeFormatFunction(format);
        }

        return formatFunctions[format](m);
    }

    function expandFormat(format, locale) {
        var i = 5;

        function replaceLongDateFormatTokens(input) {
            return locale.longDateFormat(input) || input;
        }

        localFormattingTokens.lastIndex = 0;
        while (i >= 0 && localFormattingTokens.test(format)) {
            format = format.replace(localFormattingTokens, replaceLongDateFormatTokens);
            localFormattingTokens.lastIndex = 0;
            i -= 1;
        }

        return format;
    }


    /************************************
        Parsing
    ************************************/


    // get the regex to find the next token
    function getParseRegexForToken(token, config) {
        var a, strict = config._strict;
        switch (token) {
        case 'Q':
            return parseTokenOneDigit;
        case 'DDDD':
            return parseTokenThreeDigits;
        case 'YYYY':
        case 'GGGG':
        case 'gggg':
            return strict ? parseTokenFourDigits : parseTokenOneToFourDigits;
        case 'Y':
        case 'G':
        case 'g':
            return parseTokenSignedNumber;
        case 'YYYYYY':
        case 'YYYYY':
        case 'GGGGG':
        case 'ggggg':
            return strict ? parseTokenSixDigits : parseTokenOneToSixDigits;
        case 'S':
            if (strict) {
                return parseTokenOneDigit;
            }
            /* falls through */
        case 'SS':
            if (strict) {
                return parseTokenTwoDigits;
            }
            /* falls through */
        case 'SSS':
            if (strict) {
                return parseTokenThreeDigits;
            }
            /* falls through */
        case 'DDD':
            return parseTokenOneToThreeDigits;
        case 'MMM':
        case 'MMMM':
        case 'dd':
        case 'ddd':
        case 'dddd':
            return parseTokenWord;
        case 'a':
        case 'A':
            return config._locale._meridiemParse;
        case 'x':
            return parseTokenOffsetMs;
        case 'X':
            return parseTokenTimestampMs;
        case 'Z':
        case 'ZZ':
            return parseTokenTimezone;
        case 'T':
            return parseTokenT;
        case 'SSSS':
            return parseTokenDigits;
        case 'MM':
        case 'DD':
        case 'YY':
        case 'GG':
        case 'gg':
        case 'HH':
        case 'hh':
        case 'mm':
        case 'ss':
        case 'ww':
        case 'WW':
            return strict ? parseTokenTwoDigits : parseTokenOneOrTwoDigits;
        case 'M':
        case 'D':
        case 'd':
        case 'H':
        case 'h':
        case 'm':
        case 's':
        case 'w':
        case 'W':
        case 'e':
        case 'E':
            return parseTokenOneOrTwoDigits;
        case 'Do':
            return strict ? config._locale._ordinalParse : config._locale._ordinalParseLenient;
        default :
            a = new RegExp(regexpEscape(unescapeFormat(token.replace('\\', '')), 'i'));
            return a;
        }
    }

    function utcOffsetFromString(string) {
        string = string || '';
        var possibleTzMatches = (string.match(parseTokenTimezone) || []),
            tzChunk = possibleTzMatches[possibleTzMatches.length - 1] || [],
            parts = (tzChunk + '').match(parseTimezoneChunker) || ['-', 0, 0],
            minutes = +(parts[1] * 60) + toInt(parts[2]);

        return parts[0] === '+' ? minutes : -minutes;
    }

    // function to convert string input to date
    function addTimeToArrayFromToken(token, input, config) {
        var a, datePartArray = config._a;

        switch (token) {
        // QUARTER
        case 'Q':
            if (input != null) {
                datePartArray[MONTH] = (toInt(input) - 1) * 3;
            }
            break;
        // MONTH
        case 'M' : // fall through to MM
        case 'MM' :
            if (input != null) {
                datePartArray[MONTH] = toInt(input) - 1;
            }
            break;
        case 'MMM' : // fall through to MMMM
        case 'MMMM' :
            a = config._locale.monthsParse(input, token, config._strict);
            // if we didn't find a month name, mark the date as invalid.
            if (a != null) {
                datePartArray[MONTH] = a;
            } else {
                config._pf.invalidMonth = input;
            }
            break;
        // DAY OF MONTH
        case 'D' : // fall through to DD
        case 'DD' :
            if (input != null) {
                datePartArray[DATE] = toInt(input);
            }
            break;
        case 'Do' :
            if (input != null) {
                datePartArray[DATE] = toInt(parseInt(
                            input.match(/\d{1,2}/)[0], 10));
            }
            break;
        // DAY OF YEAR
        case 'DDD' : // fall through to DDDD
        case 'DDDD' :
            if (input != null) {
                config._dayOfYear = toInt(input);
            }

            break;
        // YEAR
        case 'YY' :
            datePartArray[YEAR] = moment.parseTwoDigitYear(input);
            break;
        case 'YYYY' :
        case 'YYYYY' :
        case 'YYYYYY' :
            datePartArray[YEAR] = toInt(input);
            break;
        // AM / PM
        case 'a' : // fall through to A
        case 'A' :
            config._meridiem = input;
            // config._isPm = config._locale.isPM(input);
            break;
        // HOUR
        case 'h' : // fall through to hh
        case 'hh' :
            config._pf.bigHour = true;
            /* falls through */
        case 'H' : // fall through to HH
        case 'HH' :
            datePartArray[HOUR] = toInt(input);
            break;
        // MINUTE
        case 'm' : // fall through to mm
        case 'mm' :
            datePartArray[MINUTE] = toInt(input);
            break;
        // SECOND
        case 's' : // fall through to ss
        case 'ss' :
            datePartArray[SECOND] = toInt(input);
            break;
        // MILLISECOND
        case 'S' :
        case 'SS' :
        case 'SSS' :
        case 'SSSS' :
            datePartArray[MILLISECOND] = toInt(('0.' + input) * 1000);
            break;
        // UNIX OFFSET (MILLISECONDS)
        case 'x':
            config._d = new Date(toInt(input));
            break;
        // UNIX TIMESTAMP WITH MS
        case 'X':
            config._d = new Date(parseFloat(input) * 1000);
            break;
        // TIMEZONE
        case 'Z' : // fall through to ZZ
        case 'ZZ' :
            config._useUTC = true;
            config._tzm = utcOffsetFromString(input);
            break;
        // WEEKDAY - human
        case 'dd':
        case 'ddd':
        case 'dddd':
            a = config._locale.weekdaysParse(input);
            // if we didn't get a weekday name, mark the date as invalid
            if (a != null) {
                config._w = config._w || {};
                config._w['d'] = a;
            } else {
                config._pf.invalidWeekday = input;
            }
            break;
        // WEEK, WEEK DAY - numeric
        case 'w':
        case 'ww':
        case 'W':
        case 'WW':
        case 'd':
        case 'e':
        case 'E':
            token = token.substr(0, 1);
            /* falls through */
        case 'gggg':
        case 'GGGG':
        case 'GGGGG':
            token = token.substr(0, 2);
            if (input) {
                config._w = config._w || {};
                config._w[token] = toInt(input);
            }
            break;
        case 'gg':
        case 'GG':
            config._w = config._w || {};
            config._w[token] = moment.parseTwoDigitYear(input);
        }
    }

    function dayOfYearFromWeekInfo(config) {
        var w, weekYear, week, weekday, dow, doy, temp;

        w = config._w;
        if (w.GG != null || w.W != null || w.E != null) {
            dow = 1;
            doy = 4;

            // TODO: We need to take the current isoWeekYear, but that depends on
            // how we interpret now (local, utc, fixed offset). So create
            // a now version of current config (take local/utc/offset flags, and
            // create now).
            weekYear = dfl(w.GG, config._a[YEAR], weekOfYear(moment(), 1, 4).year);
            week = dfl(w.W, 1);
            weekday = dfl(w.E, 1);
        } else {
            dow = config._locale._week.dow;
            doy = config._locale._week.doy;

            weekYear = dfl(w.gg, config._a[YEAR], weekOfYear(moment(), dow, doy).year);
            week = dfl(w.w, 1);

            if (w.d != null) {
                // weekday -- low day numbers are considered next week
                weekday = w.d;
                if (weekday < dow) {
                    ++week;
                }
            } else if (w.e != null) {
                // local weekday -- counting starts from begining of week
                weekday = w.e + dow;
            } else {
                // default to begining of week
                weekday = dow;
            }
        }
        temp = dayOfYearFromWeeks(weekYear, week, weekday, doy, dow);

        config._a[YEAR] = temp.year;
        config._dayOfYear = temp.dayOfYear;
    }

    // convert an array to a date.
    // the array should mirror the parameters below
    // note: all values past the year are optional and will default to the lowest possible value.
    // [year, month, day , hour, minute, second, millisecond]
    function dateFromConfig(config) {
        var i, date, input = [], currentDate, yearToUse;

        if (config._d) {
            return;
        }

        currentDate = currentDateArray(config);

        //compute day of the year from weeks and weekdays
        if (config._w && config._a[DATE] == null && config._a[MONTH] == null) {
            dayOfYearFromWeekInfo(config);
        }

        //if the day of the year is set, figure out what it is
        if (config._dayOfYear) {
            yearToUse = dfl(config._a[YEAR], currentDate[YEAR]);

            if (config._dayOfYear > daysInYear(yearToUse)) {
                config._pf._overflowDayOfYear = true;
            }

            date = makeUTCDate(yearToUse, 0, config._dayOfYear);
            config._a[MONTH] = date.getUTCMonth();
            config._a[DATE] = date.getUTCDate();
        }

        // Default to current date.
        // * if no year, month, day of month are given, default to today
        // * if day of month is given, default month and year
        // * if month is given, default only year
        // * if year is given, don't default anything
        for (i = 0; i < 3 && config._a[i] == null; ++i) {
            config._a[i] = input[i] = currentDate[i];
        }

        // Zero out whatever was not defaulted, including time
        for (; i < 7; i++) {
            config._a[i] = input[i] = (config._a[i] == null) ? (i === 2 ? 1 : 0) : config._a[i];
        }

        // Check for 24:00:00.000
        if (config._a[HOUR] === 24 &&
                config._a[MINUTE] === 0 &&
                config._a[SECOND] === 0 &&
                config._a[MILLISECOND] === 0) {
            config._nextDay = true;
            config._a[HOUR] = 0;
        }

        config._d = (config._useUTC ? makeUTCDate : makeDate).apply(null, input);
        // Apply timezone offset from input. The actual utcOffset can be changed
        // with parseZone.
        if (config._tzm != null) {
            config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);
        }

        if (config._nextDay) {
            config._a[HOUR] = 24;
        }
    }

    function dateFromObject(config) {
        var normalizedInput;

        if (config._d) {
            return;
        }

        normalizedInput = normalizeObjectUnits(config._i);
        config._a = [
            normalizedInput.year,
            normalizedInput.month,
            normalizedInput.day || normalizedInput.date,
            normalizedInput.hour,
            normalizedInput.minute,
            normalizedInput.second,
            normalizedInput.millisecond
        ];

        dateFromConfig(config);
    }

    function currentDateArray(config) {
        var now = new Date();
        if (config._useUTC) {
            return [
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate()
            ];
        } else {
            return [now.getFullYear(), now.getMonth(), now.getDate()];
        }
    }

    // date from string and format string
    function makeDateFromStringAndFormat(config) {
        if (config._f === moment.ISO_8601) {
            parseISO(config);
            return;
        }

        config._a = [];
        config._pf.empty = true;

        // This array is used to make a Date, either with `new Date` or `Date.UTC`
        var string = '' + config._i,
            i, parsedInput, tokens, token, skipped,
            stringLength = string.length,
            totalParsedInputLength = 0;

        tokens = expandFormat(config._f, config._locale).match(formattingTokens) || [];

        for (i = 0; i < tokens.length; i++) {
            token = tokens[i];
            parsedInput = (string.match(getParseRegexForToken(token, config)) || [])[0];
            if (parsedInput) {
                skipped = string.substr(0, string.indexOf(parsedInput));
                if (skipped.length > 0) {
                    config._pf.unusedInput.push(skipped);
                }
                string = string.slice(string.indexOf(parsedInput) + parsedInput.length);
                totalParsedInputLength += parsedInput.length;
            }
            // don't parse if it's not a known token
            if (formatTokenFunctions[token]) {
                if (parsedInput) {
                    config._pf.empty = false;
                }
                else {
                    config._pf.unusedTokens.push(token);
                }
                addTimeToArrayFromToken(token, parsedInput, config);
            }
            else if (config._strict && !parsedInput) {
                config._pf.unusedTokens.push(token);
            }
        }

        // add remaining unparsed input length to the string
        config._pf.charsLeftOver = stringLength - totalParsedInputLength;
        if (string.length > 0) {
            config._pf.unusedInput.push(string);
        }

        // clear _12h flag if hour is <= 12
        if (config._pf.bigHour === true && config._a[HOUR] <= 12) {
            config._pf.bigHour = undefined;
        }
        // handle meridiem
        config._a[HOUR] = meridiemFixWrap(config._locale, config._a[HOUR],
                config._meridiem);
        dateFromConfig(config);
        checkOverflow(config);
    }

    function unescapeFormat(s) {
        return s.replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function (matched, p1, p2, p3, p4) {
            return p1 || p2 || p3 || p4;
        });
    }

    // Code from http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
    function regexpEscape(s) {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    // date from string and array of format strings
    function makeDateFromStringAndArray(config) {
        var tempConfig,
            bestMoment,

            scoreToBeat,
            i,
            currentScore;

        if (config._f.length === 0) {
            config._pf.invalidFormat = true;
            config._d = new Date(NaN);
            return;
        }

        for (i = 0; i < config._f.length; i++) {
            currentScore = 0;
            tempConfig = copyConfig({}, config);
            if (config._useUTC != null) {
                tempConfig._useUTC = config._useUTC;
            }
            tempConfig._pf = defaultParsingFlags();
            tempConfig._f = config._f[i];
            makeDateFromStringAndFormat(tempConfig);

            if (!isValid(tempConfig)) {
                continue;
            }

            // if there is any input that was not parsed add a penalty for that format
            currentScore += tempConfig._pf.charsLeftOver;

            //or tokens
            currentScore += tempConfig._pf.unusedTokens.length * 10;

            tempConfig._pf.score = currentScore;

            if (scoreToBeat == null || currentScore < scoreToBeat) {
                scoreToBeat = currentScore;
                bestMoment = tempConfig;
            }
        }

        extend(config, bestMoment || tempConfig);
    }

    // date from iso format
    function parseISO(config) {
        var i, l,
            string = config._i,
            match = isoRegex.exec(string);

        if (match) {
            config._pf.iso = true;
            for (i = 0, l = isoDates.length; i < l; i++) {
                if (isoDates[i][1].exec(string)) {
                    // match[5] should be 'T' or undefined
                    config._f = isoDates[i][0] + (match[6] || ' ');
                    break;
                }
            }
            for (i = 0, l = isoTimes.length; i < l; i++) {
                if (isoTimes[i][1].exec(string)) {
                    config._f += isoTimes[i][0];
                    break;
                }
            }
            if (string.match(parseTokenTimezone)) {
                config._f += 'Z';
            }
            makeDateFromStringAndFormat(config);
        } else {
            config._isValid = false;
        }
    }

    // date from iso format or fallback
    function makeDateFromString(config) {
        parseISO(config);
        if (config._isValid === false) {
            delete config._isValid;
            moment.createFromInputFallback(config);
        }
    }

    function map(arr, fn) {
        var res = [], i;
        for (i = 0; i < arr.length; ++i) {
            res.push(fn(arr[i], i));
        }
        return res;
    }

    function makeDateFromInput(config) {
        var input = config._i, matched;
        if (input === undefined) {
            config._d = new Date();
        } else if (isDate(input)) {
            config._d = new Date(+input);
        } else if ((matched = aspNetJsonRegex.exec(input)) !== null) {
            config._d = new Date(+matched[1]);
        } else if (typeof input === 'string') {
            makeDateFromString(config);
        } else if (isArray(input)) {
            config._a = map(input.slice(0), function (obj) {
                return parseInt(obj, 10);
            });
            dateFromConfig(config);
        } else if (typeof(input) === 'object') {
            dateFromObject(config);
        } else if (typeof(input) === 'number') {
            // from milliseconds
            config._d = new Date(input);
        } else {
            moment.createFromInputFallback(config);
        }
    }

    function makeDate(y, m, d, h, M, s, ms) {
        //can't just apply() to create a date:
        //http://stackoverflow.com/questions/181348/instantiating-a-javascript-object-by-calling-prototype-constructor-apply
        var date = new Date(y, m, d, h, M, s, ms);

        //the date constructor doesn't accept years < 1970
        if (y < 1970) {
            date.setFullYear(y);
        }
        return date;
    }

    function makeUTCDate(y) {
        var date = new Date(Date.UTC.apply(null, arguments));
        if (y < 1970) {
            date.setUTCFullYear(y);
        }
        return date;
    }

    function parseWeekday(input, locale) {
        if (typeof input === 'string') {
            if (!isNaN(input)) {
                input = parseInt(input, 10);
            }
            else {
                input = locale.weekdaysParse(input);
                if (typeof input !== 'number') {
                    return null;
                }
            }
        }
        return input;
    }

    /************************************
        Relative Time
    ************************************/


    // helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
    function substituteTimeAgo(string, number, withoutSuffix, isFuture, locale) {
        return locale.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
    }

    function relativeTime(posNegDuration, withoutSuffix, locale) {
        var duration = moment.duration(posNegDuration).abs(),
            seconds = round(duration.as('s')),
            minutes = round(duration.as('m')),
            hours = round(duration.as('h')),
            days = round(duration.as('d')),
            months = round(duration.as('M')),
            years = round(duration.as('y')),

            args = seconds < relativeTimeThresholds.s && ['s', seconds] ||
                minutes === 1 && ['m'] ||
                minutes < relativeTimeThresholds.m && ['mm', minutes] ||
                hours === 1 && ['h'] ||
                hours < relativeTimeThresholds.h && ['hh', hours] ||
                days === 1 && ['d'] ||
                days < relativeTimeThresholds.d && ['dd', days] ||
                months === 1 && ['M'] ||
                months < relativeTimeThresholds.M && ['MM', months] ||
                years === 1 && ['y'] || ['yy', years];

        args[2] = withoutSuffix;
        args[3] = +posNegDuration > 0;
        args[4] = locale;
        return substituteTimeAgo.apply({}, args);
    }


    /************************************
        Week of Year
    ************************************/


    // firstDayOfWeek       0 = sun, 6 = sat
    //                      the day of the week that starts the week
    //                      (usually sunday or monday)
    // firstDayOfWeekOfYear 0 = sun, 6 = sat
    //                      the first week is the week that contains the first
    //                      of this day of the week
    //                      (eg. ISO weeks use thursday (4))
    function weekOfYear(mom, firstDayOfWeek, firstDayOfWeekOfYear) {
        var end = firstDayOfWeekOfYear - firstDayOfWeek,
            daysToDayOfWeek = firstDayOfWeekOfYear - mom.day(),
            adjustedMoment;


        if (daysToDayOfWeek > end) {
            daysToDayOfWeek -= 7;
        }

        if (daysToDayOfWeek < end - 7) {
            daysToDayOfWeek += 7;
        }

        adjustedMoment = moment(mom).add(daysToDayOfWeek, 'd');
        return {
            week: Math.ceil(adjustedMoment.dayOfYear() / 7),
            year: adjustedMoment.year()
        };
    }

    //http://en.wikipedia.org/wiki/ISO_week_date#Calculating_a_date_given_the_year.2C_week_number_and_weekday
    function dayOfYearFromWeeks(year, week, weekday, firstDayOfWeekOfYear, firstDayOfWeek) {
        var d = makeUTCDate(year, 0, 1).getUTCDay(), daysToAdd, dayOfYear;

        d = d === 0 ? 7 : d;
        weekday = weekday != null ? weekday : firstDayOfWeek;
        daysToAdd = firstDayOfWeek - d + (d > firstDayOfWeekOfYear ? 7 : 0) - (d < firstDayOfWeek ? 7 : 0);
        dayOfYear = 7 * (week - 1) + (weekday - firstDayOfWeek) + daysToAdd + 1;

        return {
            year: dayOfYear > 0 ? year : year - 1,
            dayOfYear: dayOfYear > 0 ?  dayOfYear : daysInYear(year - 1) + dayOfYear
        };
    }

    /************************************
        Top Level Functions
    ************************************/

    function makeMoment(config) {
        var input = config._i,
            format = config._f,
            res;

        config._locale = config._locale || moment.localeData(config._l);

        if (input === null || (format === undefined && input === '')) {
            return moment.invalid({nullInput: true});
        }

        if (typeof input === 'string') {
            config._i = input = config._locale.preparse(input);
        }

        if (moment.isMoment(input)) {
            return new Moment(input, true);
        } else if (format) {
            if (isArray(format)) {
                makeDateFromStringAndArray(config);
            } else {
                makeDateFromStringAndFormat(config);
            }
        } else {
            makeDateFromInput(config);
        }

        res = new Moment(config);
        if (res._nextDay) {
            // Adding is smart enough around DST
            res.add(1, 'd');
            res._nextDay = undefined;
        }

        return res;
    }

    moment = function (input, format, locale, strict) {
        var c;

        if (typeof(locale) === 'boolean') {
            strict = locale;
            locale = undefined;
        }
        // object construction must be done this way.
        // https://github.com/moment/moment/issues/1423
        c = {};
        c._isAMomentObject = true;
        c._i = input;
        c._f = format;
        c._l = locale;
        c._strict = strict;
        c._isUTC = false;
        c._pf = defaultParsingFlags();

        return makeMoment(c);
    };

    moment.suppressDeprecationWarnings = false;

    moment.createFromInputFallback = deprecate(
        'moment construction falls back to js Date. This is ' +
        'discouraged and will be removed in upcoming major ' +
        'release. Please refer to ' +
        'https://github.com/moment/moment/issues/1407 for more info.',
        function (config) {
            config._d = new Date(config._i + (config._useUTC ? ' UTC' : ''));
        }
    );

    // Pick a moment m from moments so that m[fn](other) is true for all
    // other. This relies on the function fn to be transitive.
    //
    // moments should either be an array of moment objects or an array, whose
    // first element is an array of moment objects.
    function pickBy(fn, moments) {
        var res, i;
        if (moments.length === 1 && isArray(moments[0])) {
            moments = moments[0];
        }
        if (!moments.length) {
            return moment();
        }
        res = moments[0];
        for (i = 1; i < moments.length; ++i) {
            if (moments[i][fn](res)) {
                res = moments[i];
            }
        }
        return res;
    }

    moment.min = function () {
        var args = [].slice.call(arguments, 0);

        return pickBy('isBefore', args);
    };

    moment.max = function () {
        var args = [].slice.call(arguments, 0);

        return pickBy('isAfter', args);
    };

    // creating with utc
    moment.utc = function (input, format, locale, strict) {
        var c;

        if (typeof(locale) === 'boolean') {
            strict = locale;
            locale = undefined;
        }
        // object construction must be done this way.
        // https://github.com/moment/moment/issues/1423
        c = {};
        c._isAMomentObject = true;
        c._useUTC = true;
        c._isUTC = true;
        c._l = locale;
        c._i = input;
        c._f = format;
        c._strict = strict;
        c._pf = defaultParsingFlags();

        return makeMoment(c).utc();
    };

    // creating with unix timestamp (in seconds)
    moment.unix = function (input) {
        return moment(input * 1000);
    };

    // duration
    moment.duration = function (input, key) {
        var duration = input,
            // matching against regexp is expensive, do it on demand
            match = null,
            sign,
            ret,
            parseIso,
            diffRes;

        if (moment.isDuration(input)) {
            duration = {
                ms: input._milliseconds,
                d: input._days,
                M: input._months
            };
        } else if (typeof input === 'number') {
            duration = {};
            if (key) {
                duration[key] = input;
            } else {
                duration.milliseconds = input;
            }
        } else if (!!(match = aspNetTimeSpanJsonRegex.exec(input))) {
            sign = (match[1] === '-') ? -1 : 1;
            duration = {
                y: 0,
                d: toInt(match[DATE]) * sign,
                h: toInt(match[HOUR]) * sign,
                m: toInt(match[MINUTE]) * sign,
                s: toInt(match[SECOND]) * sign,
                ms: toInt(match[MILLISECOND]) * sign
            };
        } else if (!!(match = isoDurationRegex.exec(input))) {
            sign = (match[1] === '-') ? -1 : 1;
            parseIso = function (inp) {
                // We'd normally use ~~inp for this, but unfortunately it also
                // converts floats to ints.
                // inp may be undefined, so careful calling replace on it.
                var res = inp && parseFloat(inp.replace(',', '.'));
                // apply sign while we're at it
                return (isNaN(res) ? 0 : res) * sign;
            };
            duration = {
                y: parseIso(match[2]),
                M: parseIso(match[3]),
                d: parseIso(match[4]),
                h: parseIso(match[5]),
                m: parseIso(match[6]),
                s: parseIso(match[7]),
                w: parseIso(match[8])
            };
        } else if (duration == null) {// checks for null or undefined
            duration = {};
        } else if (typeof duration === 'object' &&
                ('from' in duration || 'to' in duration)) {
            diffRes = momentsDifference(moment(duration.from), moment(duration.to));

            duration = {};
            duration.ms = diffRes.milliseconds;
            duration.M = diffRes.months;
        }

        ret = new Duration(duration);

        if (moment.isDuration(input) && hasOwnProp(input, '_locale')) {
            ret._locale = input._locale;
        }

        return ret;
    };

    // version number
    moment.version = VERSION;

    // default format
    moment.defaultFormat = isoFormat;

    // constant that refers to the ISO standard
    moment.ISO_8601 = function () {};

    // Plugins that add properties should also add the key here (null value),
    // so we can properly clone ourselves.
    moment.momentProperties = momentProperties;

    // This function will be called whenever a moment is mutated.
    // It is intended to keep the offset in sync with the timezone.
    moment.updateOffset = function () {};

    // This function allows you to set a threshold for relative time strings
    moment.relativeTimeThreshold = function (threshold, limit) {
        if (relativeTimeThresholds[threshold] === undefined) {
            return false;
        }
        if (limit === undefined) {
            return relativeTimeThresholds[threshold];
        }
        relativeTimeThresholds[threshold] = limit;
        return true;
    };

    moment.lang = deprecate(
        'moment.lang is deprecated. Use moment.locale instead.',
        function (key, value) {
            return moment.locale(key, value);
        }
    );

    // This function will load locale and then set the global locale.  If
    // no arguments are passed in, it will simply return the current global
    // locale key.
    moment.locale = function (key, values) {
        var data;
        if (key) {
            if (typeof(values) !== 'undefined') {
                data = moment.defineLocale(key, values);
            }
            else {
                data = moment.localeData(key);
            }

            if (data) {
                moment.duration._locale = moment._locale = data;
            }
        }

        return moment._locale._abbr;
    };

    moment.defineLocale = function (name, values) {
        if (values !== null) {
            values.abbr = name;
            if (!locales[name]) {
                locales[name] = new Locale();
            }
            locales[name].set(values);

            // backwards compat for now: also set the locale
            moment.locale(name);

            return locales[name];
        } else {
            // useful for testing
            delete locales[name];
            return null;
        }
    };

    moment.langData = deprecate(
        'moment.langData is deprecated. Use moment.localeData instead.',
        function (key) {
            return moment.localeData(key);
        }
    );

    // returns locale data
    moment.localeData = function (key) {
        var locale;

        if (key && key._locale && key._locale._abbr) {
            key = key._locale._abbr;
        }

        if (!key) {
            return moment._locale;
        }

        if (!isArray(key)) {
            //short-circuit everything else
            locale = loadLocale(key);
            if (locale) {
                return locale;
            }
            key = [key];
        }

        return chooseLocale(key);
    };

    // compare moment object
    moment.isMoment = function (obj) {
        return obj instanceof Moment ||
            (obj != null && hasOwnProp(obj, '_isAMomentObject'));
    };

    // for typechecking Duration objects
    moment.isDuration = function (obj) {
        return obj instanceof Duration;
    };

    for (i = lists.length - 1; i >= 0; --i) {
        makeList(lists[i]);
    }

    moment.normalizeUnits = function (units) {
        return normalizeUnits(units);
    };

    moment.invalid = function (flags) {
        var m = moment.utc(NaN);
        if (flags != null) {
            extend(m._pf, flags);
        }
        else {
            m._pf.userInvalidated = true;
        }

        return m;
    };

    moment.parseZone = function () {
        return moment.apply(null, arguments).parseZone();
    };

    moment.parseTwoDigitYear = function (input) {
        return toInt(input) + (toInt(input) > 68 ? 1900 : 2000);
    };

    moment.isDate = isDate;

    /************************************
        Moment Prototype
    ************************************/


    extend(moment.fn = Moment.prototype, {

        clone : function () {
            return moment(this);
        },

        valueOf : function () {
            return +this._d - ((this._offset || 0) * 60000);
        },

        unix : function () {
            return Math.floor(+this / 1000);
        },

        toString : function () {
            return this.clone().locale('en').format('ddd MMM DD YYYY HH:mm:ss [GMT]ZZ');
        },

        toDate : function () {
            return this._offset ? new Date(+this) : this._d;
        },

        toISOString : function () {
            var m = moment(this).utc();
            if (0 < m.year() && m.year() <= 9999) {
                if ('function' === typeof Date.prototype.toISOString) {
                    // native implementation is ~50x faster, use it when we can
                    return this.toDate().toISOString();
                } else {
                    return formatMoment(m, 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
                }
            } else {
                return formatMoment(m, 'YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
            }
        },

        toArray : function () {
            var m = this;
            return [
                m.year(),
                m.month(),
                m.date(),
                m.hours(),
                m.minutes(),
                m.seconds(),
                m.milliseconds()
            ];
        },

        isValid : function () {
            return isValid(this);
        },

        isDSTShifted : function () {
            if (this._a) {
                return this.isValid() && compareArrays(this._a, (this._isUTC ? moment.utc(this._a) : moment(this._a)).toArray()) > 0;
            }

            return false;
        },

        parsingFlags : function () {
            return extend({}, this._pf);
        },

        invalidAt: function () {
            return this._pf.overflow;
        },

        utc : function (keepLocalTime) {
            return this.utcOffset(0, keepLocalTime);
        },

        local : function (keepLocalTime) {
            if (this._isUTC) {
                this.utcOffset(0, keepLocalTime);
                this._isUTC = false;

                if (keepLocalTime) {
                    this.subtract(this._dateUtcOffset(), 'm');
                }
            }
            return this;
        },

        format : function (inputString) {
            var output = formatMoment(this, inputString || moment.defaultFormat);
            return this.localeData().postformat(output);
        },

        add : createAdder(1, 'add'),

        subtract : createAdder(-1, 'subtract'),

        diff : function (input, units, asFloat) {
            var that = makeAs(input, this),
                zoneDiff = (that.utcOffset() - this.utcOffset()) * 6e4,
                anchor, diff, output, daysAdjust;

            units = normalizeUnits(units);

            if (units === 'year' || units === 'month' || units === 'quarter') {
                output = monthDiff(this, that);
                if (units === 'quarter') {
                    output = output / 3;
                } else if (units === 'year') {
                    output = output / 12;
                }
            } else {
                diff = this - that;
                output = units === 'second' ? diff / 1e3 : // 1000
                    units === 'minute' ? diff / 6e4 : // 1000 * 60
                    units === 'hour' ? diff / 36e5 : // 1000 * 60 * 60
                    units === 'day' ? (diff - zoneDiff) / 864e5 : // 1000 * 60 * 60 * 24, negate dst
                    units === 'week' ? (diff - zoneDiff) / 6048e5 : // 1000 * 60 * 60 * 24 * 7, negate dst
                    diff;
            }
            return asFloat ? output : absRound(output);
        },

        from : function (time, withoutSuffix) {
            return moment.duration({to: this, from: time}).locale(this.locale()).humanize(!withoutSuffix);
        },

        fromNow : function (withoutSuffix) {
            return this.from(moment(), withoutSuffix);
        },

        calendar : function (time) {
            // We want to compare the start of today, vs this.
            // Getting start-of-today depends on whether we're locat/utc/offset
            // or not.
            var now = time || moment(),
                sod = makeAs(now, this).startOf('day'),
                diff = this.diff(sod, 'days', true),
                format = diff < -6 ? 'sameElse' :
                    diff < -1 ? 'lastWeek' :
                    diff < 0 ? 'lastDay' :
                    diff < 1 ? 'sameDay' :
                    diff < 2 ? 'nextDay' :
                    diff < 7 ? 'nextWeek' : 'sameElse';
            return this.format(this.localeData().calendar(format, this, moment(now)));
        },

        isLeapYear : function () {
            return isLeapYear(this.year());
        },

        isDST : function () {
            return (this.utcOffset() > this.clone().month(0).utcOffset() ||
                this.utcOffset() > this.clone().month(5).utcOffset());
        },

        day : function (input) {
            var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
            if (input != null) {
                input = parseWeekday(input, this.localeData());
                return this.add(input - day, 'd');
            } else {
                return day;
            }
        },

        month : makeAccessor('Month', true),

        startOf : function (units) {
            units = normalizeUnits(units);
            // the following switch intentionally omits break keywords
            // to utilize falling through the cases.
            switch (units) {
            case 'year':
                this.month(0);
                /* falls through */
            case 'quarter':
            case 'month':
                this.date(1);
                /* falls through */
            case 'week':
            case 'isoWeek':
            case 'day':
                this.hours(0);
                /* falls through */
            case 'hour':
                this.minutes(0);
                /* falls through */
            case 'minute':
                this.seconds(0);
                /* falls through */
            case 'second':
                this.milliseconds(0);
                /* falls through */
            }

            // weeks are a special case
            if (units === 'week') {
                this.weekday(0);
            } else if (units === 'isoWeek') {
                this.isoWeekday(1);
            }

            // quarters are also special
            if (units === 'quarter') {
                this.month(Math.floor(this.month() / 3) * 3);
            }

            return this;
        },

        endOf: function (units) {
            units = normalizeUnits(units);
            if (units === undefined || units === 'millisecond') {
                return this;
            }
            return this.startOf(units).add(1, (units === 'isoWeek' ? 'week' : units)).subtract(1, 'ms');
        },

        isAfter: function (input, units) {
            var inputMs;
            units = normalizeUnits(typeof units !== 'undefined' ? units : 'millisecond');
            if (units === 'millisecond') {
                input = moment.isMoment(input) ? input : moment(input);
                return +this > +input;
            } else {
                inputMs = moment.isMoment(input) ? +input : +moment(input);
                return inputMs < +this.clone().startOf(units);
            }
        },

        isBefore: function (input, units) {
            var inputMs;
            units = normalizeUnits(typeof units !== 'undefined' ? units : 'millisecond');
            if (units === 'millisecond') {
                input = moment.isMoment(input) ? input : moment(input);
                return +this < +input;
            } else {
                inputMs = moment.isMoment(input) ? +input : +moment(input);
                return +this.clone().endOf(units) < inputMs;
            }
        },

        isBetween: function (from, to, units) {
            return this.isAfter(from, units) && this.isBefore(to, units);
        },

        isSame: function (input, units) {
            var inputMs;
            units = normalizeUnits(units || 'millisecond');
            if (units === 'millisecond') {
                input = moment.isMoment(input) ? input : moment(input);
                return +this === +input;
            } else {
                inputMs = +moment(input);
                return +(this.clone().startOf(units)) <= inputMs && inputMs <= +(this.clone().endOf(units));
            }
        },

        min: deprecate(
                 'moment().min is deprecated, use moment.min instead. https://github.com/moment/moment/issues/1548',
                 function (other) {
                     other = moment.apply(null, arguments);
                     return other < this ? this : other;
                 }
         ),

        max: deprecate(
                'moment().max is deprecated, use moment.max instead. https://github.com/moment/moment/issues/1548',
                function (other) {
                    other = moment.apply(null, arguments);
                    return other > this ? this : other;
                }
        ),

        zone : deprecate(
                'moment().zone is deprecated, use moment().utcOffset instead. ' +
                'https://github.com/moment/moment/issues/1779',
                function (input, keepLocalTime) {
                    if (input != null) {
                        if (typeof input !== 'string') {
                            input = -input;
                        }

                        this.utcOffset(input, keepLocalTime);

                        return this;
                    } else {
                        return -this.utcOffset();
                    }
                }
        ),

        // keepLocalTime = true means only change the timezone, without
        // affecting the local hour. So 5:31:26 +0300 --[utcOffset(2, true)]-->
        // 5:31:26 +0200 It is possible that 5:31:26 doesn't exist with offset
        // +0200, so we adjust the time as needed, to be valid.
        //
        // Keeping the time actually adds/subtracts (one hour)
        // from the actual represented time. That is why we call updateOffset
        // a second time. In case it wants us to change the offset again
        // _changeInProgress == true case, then we have to adjust, because
        // there is no such time in the given timezone.
        utcOffset : function (input, keepLocalTime) {
            var offset = this._offset || 0,
                localAdjust;
            if (input != null) {
                if (typeof input === 'string') {
                    input = utcOffsetFromString(input);
                }
                if (Math.abs(input) < 16) {
                    input = input * 60;
                }
                if (!this._isUTC && keepLocalTime) {
                    localAdjust = this._dateUtcOffset();
                }
                this._offset = input;
                this._isUTC = true;
                if (localAdjust != null) {
                    this.add(localAdjust, 'm');
                }
                if (offset !== input) {
                    if (!keepLocalTime || this._changeInProgress) {
                        addOrSubtractDurationFromMoment(this,
                                moment.duration(input - offset, 'm'), 1, false);
                    } else if (!this._changeInProgress) {
                        this._changeInProgress = true;
                        moment.updateOffset(this, true);
                        this._changeInProgress = null;
                    }
                }

                return this;
            } else {
                return this._isUTC ? offset : this._dateUtcOffset();
            }
        },

        isLocal : function () {
            return !this._isUTC;
        },

        isUtcOffset : function () {
            return this._isUTC;
        },

        isUtc : function () {
            return this._isUTC && this._offset === 0;
        },

        zoneAbbr : function () {
            return this._isUTC ? 'UTC' : '';
        },

        zoneName : function () {
            return this._isUTC ? 'Coordinated Universal Time' : '';
        },

        parseZone : function () {
            if (this._tzm) {
                this.utcOffset(this._tzm);
            } else if (typeof this._i === 'string') {
                this.utcOffset(utcOffsetFromString(this._i));
            }
            return this;
        },

        hasAlignedHourOffset : function (input) {
            if (!input) {
                input = 0;
            }
            else {
                input = moment(input).utcOffset();
            }

            return (this.utcOffset() - input) % 60 === 0;
        },

        daysInMonth : function () {
            return daysInMonth(this.year(), this.month());
        },

        dayOfYear : function (input) {
            var dayOfYear = round((moment(this).startOf('day') - moment(this).startOf('year')) / 864e5) + 1;
            return input == null ? dayOfYear : this.add((input - dayOfYear), 'd');
        },

        quarter : function (input) {
            return input == null ? Math.ceil((this.month() + 1) / 3) : this.month((input - 1) * 3 + this.month() % 3);
        },

        weekYear : function (input) {
            var year = weekOfYear(this, this.localeData()._week.dow, this.localeData()._week.doy).year;
            return input == null ? year : this.add((input - year), 'y');
        },

        isoWeekYear : function (input) {
            var year = weekOfYear(this, 1, 4).year;
            return input == null ? year : this.add((input - year), 'y');
        },

        week : function (input) {
            var week = this.localeData().week(this);
            return input == null ? week : this.add((input - week) * 7, 'd');
        },

        isoWeek : function (input) {
            var week = weekOfYear(this, 1, 4).week;
            return input == null ? week : this.add((input - week) * 7, 'd');
        },

        weekday : function (input) {
            var weekday = (this.day() + 7 - this.localeData()._week.dow) % 7;
            return input == null ? weekday : this.add(input - weekday, 'd');
        },

        isoWeekday : function (input) {
            // behaves the same as moment#day except
            // as a getter, returns 7 instead of 0 (1-7 range instead of 0-6)
            // as a setter, sunday should belong to the previous week.
            return input == null ? this.day() || 7 : this.day(this.day() % 7 ? input : input - 7);
        },

        isoWeeksInYear : function () {
            return weeksInYear(this.year(), 1, 4);
        },

        weeksInYear : function () {
            var weekInfo = this.localeData()._week;
            return weeksInYear(this.year(), weekInfo.dow, weekInfo.doy);
        },

        get : function (units) {
            units = normalizeUnits(units);
            return this[units]();
        },

        set : function (units, value) {
            var unit;
            if (typeof units === 'object') {
                for (unit in units) {
                    this.set(unit, units[unit]);
                }
            }
            else {
                units = normalizeUnits(units);
                if (typeof this[units] === 'function') {
                    this[units](value);
                }
            }
            return this;
        },

        // If passed a locale key, it will set the locale for this
        // instance.  Otherwise, it will return the locale configuration
        // variables for this instance.
        locale : function (key) {
            var newLocaleData;

            if (key === undefined) {
                return this._locale._abbr;
            } else {
                newLocaleData = moment.localeData(key);
                if (newLocaleData != null) {
                    this._locale = newLocaleData;
                }
                return this;
            }
        },

        lang : deprecate(
            'moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.',
            function (key) {
                if (key === undefined) {
                    return this.localeData();
                } else {
                    return this.locale(key);
                }
            }
        ),

        localeData : function () {
            return this._locale;
        },

        _dateUtcOffset : function () {
            // On Firefox.24 Date#getTimezoneOffset returns a floating point.
            // https://github.com/moment/moment/pull/1871
            return -Math.round(this._d.getTimezoneOffset() / 15) * 15;
        }

    });

    function rawMonthSetter(mom, value) {
        var dayOfMonth;

        // TODO: Move this out of here!
        if (typeof value === 'string') {
            value = mom.localeData().monthsParse(value);
            // TODO: Another silent failure?
            if (typeof value !== 'number') {
                return mom;
            }
        }

        dayOfMonth = Math.min(mom.date(),
                daysInMonth(mom.year(), value));
        mom._d['set' + (mom._isUTC ? 'UTC' : '') + 'Month'](value, dayOfMonth);
        return mom;
    }

    function rawGetter(mom, unit) {
        return mom._d['get' + (mom._isUTC ? 'UTC' : '') + unit]();
    }

    function rawSetter(mom, unit, value) {
        if (unit === 'Month') {
            return rawMonthSetter(mom, value);
        } else {
            return mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value);
        }
    }

    function makeAccessor(unit, keepTime) {
        return function (value) {
            if (value != null) {
                rawSetter(this, unit, value);
                moment.updateOffset(this, keepTime);
                return this;
            } else {
                return rawGetter(this, unit);
            }
        };
    }

    moment.fn.millisecond = moment.fn.milliseconds = makeAccessor('Milliseconds', false);
    moment.fn.second = moment.fn.seconds = makeAccessor('Seconds', false);
    moment.fn.minute = moment.fn.minutes = makeAccessor('Minutes', false);
    // Setting the hour should keep the time, because the user explicitly
    // specified which hour he wants. So trying to maintain the same hour (in
    // a new timezone) makes sense. Adding/subtracting hours does not follow
    // this rule.
    moment.fn.hour = moment.fn.hours = makeAccessor('Hours', true);
    // moment.fn.month is defined separately
    moment.fn.date = makeAccessor('Date', true);
    moment.fn.dates = deprecate('dates accessor is deprecated. Use date instead.', makeAccessor('Date', true));
    moment.fn.year = makeAccessor('FullYear', true);
    moment.fn.years = deprecate('years accessor is deprecated. Use year instead.', makeAccessor('FullYear', true));

    // add plural methods
    moment.fn.days = moment.fn.day;
    moment.fn.months = moment.fn.month;
    moment.fn.weeks = moment.fn.week;
    moment.fn.isoWeeks = moment.fn.isoWeek;
    moment.fn.quarters = moment.fn.quarter;

    // add aliased format methods
    moment.fn.toJSON = moment.fn.toISOString;

    // alias isUtc for dev-friendliness
    moment.fn.isUTC = moment.fn.isUtc;

    /************************************
        Duration Prototype
    ************************************/


    function daysToYears (days) {
        // 400 years have 146097 days (taking into account leap year rules)
        return days * 400 / 146097;
    }

    function yearsToDays (years) {
        // years * 365 + absRound(years / 4) -
        //     absRound(years / 100) + absRound(years / 400);
        return years * 146097 / 400;
    }

    extend(moment.duration.fn = Duration.prototype, {

        _bubble : function () {
            var milliseconds = this._milliseconds,
                days = this._days,
                months = this._months,
                data = this._data,
                seconds, minutes, hours, years = 0;

            // The following code bubbles up values, see the tests for
            // examples of what that means.
            data.milliseconds = milliseconds % 1000;

            seconds = absRound(milliseconds / 1000);
            data.seconds = seconds % 60;

            minutes = absRound(seconds / 60);
            data.minutes = minutes % 60;

            hours = absRound(minutes / 60);
            data.hours = hours % 24;

            days += absRound(hours / 24);

            // Accurately convert days to years, assume start from year 0.
            years = absRound(daysToYears(days));
            days -= absRound(yearsToDays(years));

            // 30 days to a month
            // TODO (iskren): Use anchor date (like 1st Jan) to compute this.
            months += absRound(days / 30);
            days %= 30;

            // 12 months -> 1 year
            years += absRound(months / 12);
            months %= 12;

            data.days = days;
            data.months = months;
            data.years = years;
        },

        abs : function () {
            this._milliseconds = Math.abs(this._milliseconds);
            this._days = Math.abs(this._days);
            this._months = Math.abs(this._months);

            this._data.milliseconds = Math.abs(this._data.milliseconds);
            this._data.seconds = Math.abs(this._data.seconds);
            this._data.minutes = Math.abs(this._data.minutes);
            this._data.hours = Math.abs(this._data.hours);
            this._data.months = Math.abs(this._data.months);
            this._data.years = Math.abs(this._data.years);

            return this;
        },

        weeks : function () {
            return absRound(this.days() / 7);
        },

        valueOf : function () {
            return this._milliseconds +
              this._days * 864e5 +
              (this._months % 12) * 2592e6 +
              toInt(this._months / 12) * 31536e6;
        },

        humanize : function (withSuffix) {
            var output = relativeTime(this, !withSuffix, this.localeData());

            if (withSuffix) {
                output = this.localeData().pastFuture(+this, output);
            }

            return this.localeData().postformat(output);
        },

        add : function (input, val) {
            // supports only 2.0-style add(1, 's') or add(moment)
            var dur = moment.duration(input, val);

            this._milliseconds += dur._milliseconds;
            this._days += dur._days;
            this._months += dur._months;

            this._bubble();

            return this;
        },

        subtract : function (input, val) {
            var dur = moment.duration(input, val);

            this._milliseconds -= dur._milliseconds;
            this._days -= dur._days;
            this._months -= dur._months;

            this._bubble();

            return this;
        },

        get : function (units) {
            units = normalizeUnits(units);
            return this[units.toLowerCase() + 's']();
        },

        as : function (units) {
            var days, months;
            units = normalizeUnits(units);

            if (units === 'month' || units === 'year') {
                days = this._days + this._milliseconds / 864e5;
                months = this._months + daysToYears(days) * 12;
                return units === 'month' ? months : months / 12;
            } else {
                // handle milliseconds separately because of floating point math errors (issue #1867)
                days = this._days + Math.round(yearsToDays(this._months / 12));
                switch (units) {
                    case 'week': return days / 7 + this._milliseconds / 6048e5;
                    case 'day': return days + this._milliseconds / 864e5;
                    case 'hour': return days * 24 + this._milliseconds / 36e5;
                    case 'minute': return days * 24 * 60 + this._milliseconds / 6e4;
                    case 'second': return days * 24 * 60 * 60 + this._milliseconds / 1000;
                    // Math.floor prevents floating point math errors here
                    case 'millisecond': return Math.floor(days * 24 * 60 * 60 * 1000) + this._milliseconds;
                    default: throw new Error('Unknown unit ' + units);
                }
            }
        },

        lang : moment.fn.lang,
        locale : moment.fn.locale,

        toIsoString : deprecate(
            'toIsoString() is deprecated. Please use toISOString() instead ' +
            '(notice the capitals)',
            function () {
                return this.toISOString();
            }
        ),

        toISOString : function () {
            // inspired by https://github.com/dordille/moment-isoduration/blob/master/moment.isoduration.js
            var years = Math.abs(this.years()),
                months = Math.abs(this.months()),
                days = Math.abs(this.days()),
                hours = Math.abs(this.hours()),
                minutes = Math.abs(this.minutes()),
                seconds = Math.abs(this.seconds() + this.milliseconds() / 1000);

            if (!this.asSeconds()) {
                // this is the same as C#'s (Noda) and python (isodate)...
                // but not other JS (goog.date)
                return 'P0D';
            }

            return (this.asSeconds() < 0 ? '-' : '') +
                'P' +
                (years ? years + 'Y' : '') +
                (months ? months + 'M' : '') +
                (days ? days + 'D' : '') +
                ((hours || minutes || seconds) ? 'T' : '') +
                (hours ? hours + 'H' : '') +
                (minutes ? minutes + 'M' : '') +
                (seconds ? seconds + 'S' : '');
        },

        localeData : function () {
            return this._locale;
        },

        toJSON : function () {
            return this.toISOString();
        }
    });

    moment.duration.fn.toString = moment.duration.fn.toISOString;

    function makeDurationGetter(name) {
        moment.duration.fn[name] = function () {
            return this._data[name];
        };
    }

    for (i in unitMillisecondFactors) {
        if (hasOwnProp(unitMillisecondFactors, i)) {
            makeDurationGetter(i.toLowerCase());
        }
    }

    moment.duration.fn.asMilliseconds = function () {
        return this.as('ms');
    };
    moment.duration.fn.asSeconds = function () {
        return this.as('s');
    };
    moment.duration.fn.asMinutes = function () {
        return this.as('m');
    };
    moment.duration.fn.asHours = function () {
        return this.as('h');
    };
    moment.duration.fn.asDays = function () {
        return this.as('d');
    };
    moment.duration.fn.asWeeks = function () {
        return this.as('weeks');
    };
    moment.duration.fn.asMonths = function () {
        return this.as('M');
    };
    moment.duration.fn.asYears = function () {
        return this.as('y');
    };

    /************************************
        Default Locale
    ************************************/


    // Set default locale, other locale will inherit from English.
    moment.locale('en', {
        ordinalParse: /\d{1,2}(th|st|nd|rd)/,
        ordinal : function (number) {
            var b = number % 10,
                output = (toInt(number % 100 / 10) === 1) ? 'th' :
                (b === 1) ? 'st' :
                (b === 2) ? 'nd' :
                (b === 3) ? 'rd' : 'th';
            return number + output;
        }
    });

    // moment.js locale configuration
// locale : afrikaans (af)
// author : Werner Mollentze : https://github.com/wernerm

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('af', {
        months : 'Januarie_Februarie_Maart_April_Mei_Junie_Julie_Augustus_September_Oktober_November_Desember'.split('_'),
        monthsShort : 'Jan_Feb_Mar_Apr_Mei_Jun_Jul_Aug_Sep_Okt_Nov_Des'.split('_'),
        weekdays : 'Sondag_Maandag_Dinsdag_Woensdag_Donderdag_Vrydag_Saterdag'.split('_'),
        weekdaysShort : 'Son_Maa_Din_Woe_Don_Vry_Sat'.split('_'),
        weekdaysMin : 'So_Ma_Di_Wo_Do_Vr_Sa'.split('_'),
        meridiemParse: /vm|nm/i,
        isPM : function (input) {
            return /^nm$/i.test(input);
        },
        meridiem : function (hours, minutes, isLower) {
            if (hours < 12) {
                return isLower ? 'vm' : 'VM';
            } else {
                return isLower ? 'nm' : 'NM';
            }
        },
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd, D MMMM YYYY LT'
        },
        calendar : {
            sameDay : '[Vandag om] LT',
            nextDay : '[MУДre om] LT',
            nextWeek : 'dddd [om] LT',
            lastDay : '[Gister om] LT',
            lastWeek : '[Laas] dddd [om] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : 'oor %s',
            past : '%s gelede',
            s : '\'n paar sekondes',
            m : '\'n minuut',
            mm : '%d minute',
            h : '\'n uur',
            hh : '%d ure',
            d : '\'n dag',
            dd : '%d dae',
            M : '\'n maand',
            MM : '%d maande',
            y : '\'n jaar',
            yy : '%d jaar'
        },
        ordinalParse: /\d{1,2}(ste|de)/,
        ordinal : function (number) {
            return number + ((number === 1 || number === 8 || number >= 20) ? 'ste' : 'de'); // Thanks to Joris RУЖling : https://github.com/jjupiter
        },
        week : {
            dow : 1, // Maandag is die eerste dag van die week.
            doy : 4  // Die week wat die 4de Januarie bevat is die eerste week van die jaar.
        }
    });
}));
// moment.js locale configuration
// locale : Moroccan Arabic (ar-ma)
// author : ElFadili Yassine : https://github.com/ElFadiliY
// author : Abdel Said : https://github.com/abdelsaid

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('ar-ma', {
        months : 'ййиЇйиБ_йиЈиБиЇйиБ_йиЇиБиГ_иЃиЈиБйй_йиЇй_ййййй_йййййиВ_иКиДиЊ_иДиЊйиЈиБ_иЃйиЊйиЈиБ_йййиЈиБ_иЏиЌйиЈиБ'.split('_'),
        monthsShort : 'ййиЇйиБ_йиЈиБиЇйиБ_йиЇиБиГ_иЃиЈиБйй_йиЇй_ййййй_йййййиВ_иКиДиЊ_иДиЊйиЈиБ_иЃйиЊйиЈиБ_йййиЈиБ_иЏиЌйиЈиБ'.split('_'),
        weekdays : 'иЇйиЃи­иЏ_иЇйиЅиЊййй_иЇйиЋйиЇиЋиЇиЁ_иЇйиЃиБиЈиЙиЇиЁ_иЇйиЎййиГ_иЇйиЌйиЙиЉ_иЇйиГиЈиЊ'.split('_'),
        weekdaysShort : 'иЇи­иЏ_иЇиЊййй_иЋйиЇиЋиЇиЁ_иЇиБиЈиЙиЇиЁ_иЎййиГ_иЌйиЙиЉ_иГиЈиЊ'.split('_'),
        weekdaysMin : 'и­_й_иЋ_иБ_иЎ_иЌ_иГ'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd D MMMM YYYY LT'
        },
        calendar : {
            sameDay: '[иЇйййй иЙйй иЇйиГиЇиЙиЉ] LT',
            nextDay: '[иКиЏиЇ иЙйй иЇйиГиЇиЙиЉ] LT',
            nextWeek: 'dddd [иЙйй иЇйиГиЇиЙиЉ] LT',
            lastDay: '[иЃйиГ иЙйй иЇйиГиЇиЙиЉ] LT',
            lastWeek: 'dddd [иЙйй иЇйиГиЇиЙиЉ] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : 'йй %s',
            past : 'ййиА %s',
            s : 'иЋйиЇй',
            m : 'иЏйййиЉ',
            mm : '%d иЏйиЇиІй',
            h : 'иГиЇиЙиЉ',
            hh : '%d иГиЇиЙиЇиЊ',
            d : 'ййй',
            dd : '%d иЃйиЇй',
            M : 'иДйиБ',
            MM : '%d иЃиДйиБ',
            y : 'иГйиЉ',
            yy : '%d иГййиЇиЊ'
        },
        week : {
            dow : 6, // Saturday is the first day of the week.
            doy : 12  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : Arabic Saudi Arabia (ar-sa)
// author : Suhail Alkowaileet : https://github.com/xsoh

(function (factory) {
    factory(moment);
}(function (moment) {
    var symbolMap = {
        '1': 'йЁ',
        '2': 'йЂ',
        '3': 'йЃ',
        '4': 'йЄ',
        '5': 'йЅ',
        '6': 'йІ',
        '7': 'йЇ',
        '8': 'йЈ',
        '9': 'йЉ',
        '0': 'й '
    }, numberMap = {
        'йЁ': '1',
        'йЂ': '2',
        'йЃ': '3',
        'йЄ': '4',
        'йЅ': '5',
        'йІ': '6',
        'йЇ': '7',
        'йЈ': '8',
        'йЉ': '9',
        'й ': '0'
    };

    return moment.defineLocale('ar-sa', {
        months : 'ййиЇйиБ_йиЈиБиЇйиБ_йиЇиБиГ_иЃиЈиБйй_йиЇйй_ййййй_ййййй_иЃиКиГиЗиГ_иГиЈиЊйиЈиБ_иЃйиЊйиЈиБ_ййййиЈиБ_иЏйиГйиЈиБ'.split('_'),
        monthsShort : 'ййиЇйиБ_йиЈиБиЇйиБ_йиЇиБиГ_иЃиЈиБйй_йиЇйй_ййййй_ййййй_иЃиКиГиЗиГ_иГиЈиЊйиЈиБ_иЃйиЊйиЈиБ_ййййиЈиБ_иЏйиГйиЈиБ'.split('_'),
        weekdays : 'иЇйиЃи­иЏ_иЇйиЅиЋййй_иЇйиЋйиЇиЋиЇиЁ_иЇйиЃиБиЈиЙиЇиЁ_иЇйиЎййиГ_иЇйиЌйиЙиЉ_иЇйиГиЈиЊ'.split('_'),
        weekdaysShort : 'иЃи­иЏ_иЅиЋййй_иЋйиЇиЋиЇиЁ_иЃиБиЈиЙиЇиЁ_иЎййиГ_иЌйиЙиЉ_иГиЈиЊ'.split('_'),
        weekdaysMin : 'и­_й_иЋ_иБ_иЎ_иЌ_иГ'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'HH:mm:ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd D MMMM YYYY LT'
        },
        meridiemParse: /иЕ|й/,
        isPM : function (input) {
            return 'й' === input;
        },
        meridiem : function (hour, minute, isLower) {
            if (hour < 12) {
                return 'иЕ';
            } else {
                return 'й';
            }
        },
        calendar : {
            sameDay: '[иЇйййй иЙйй иЇйиГиЇиЙиЉ] LT',
            nextDay: '[иКиЏиЇ иЙйй иЇйиГиЇиЙиЉ] LT',
            nextWeek: 'dddd [иЙйй иЇйиГиЇиЙиЉ] LT',
            lastDay: '[иЃйиГ иЙйй иЇйиГиЇиЙиЉ] LT',
            lastWeek: 'dddd [иЙйй иЇйиГиЇиЙиЉ] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : 'йй %s',
            past : 'ййиА %s',
            s : 'иЋйиЇй',
            m : 'иЏйййиЉ',
            mm : '%d иЏйиЇиІй',
            h : 'иГиЇиЙиЉ',
            hh : '%d иГиЇиЙиЇиЊ',
            d : 'ййй',
            dd : '%d иЃйиЇй',
            M : 'иДйиБ',
            MM : '%d иЃиДйиБ',
            y : 'иГйиЉ',
            yy : '%d иГййиЇиЊ'
        },
        preparse: function (string) {
            return string.replace(/[йЁйЂйЃйЄйЅйІйЇйЈйЉй ]/g, function (match) {
                return numberMap[match];
            }).replace(/и/g, ',');
        },
        postformat: function (string) {
            return string.replace(/\d/g, function (match) {
                return symbolMap[match];
            }).replace(/,/g, 'и');
        },
        week : {
            dow : 6, // Saturday is the first day of the week.
            doy : 12  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale  : Tunisian Arabic (ar-tn)

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('ar-tn', {
        months: 'иЌиЇййй_йййиБй_йиЇиБиГ_иЃйиБйй_йиЇй_иЌйиЇй_иЌййййиЉ_иЃйиЊ_иГиЈиЊйиЈиБ_иЃйиЊйиЈиБ_ййййиЈиБ_иЏйиГйиЈиБ'.split('_'),
        monthsShort: 'иЌиЇййй_йййиБй_йиЇиБиГ_иЃйиБйй_йиЇй_иЌйиЇй_иЌййййиЉ_иЃйиЊ_иГиЈиЊйиЈиБ_иЃйиЊйиЈиБ_ййййиЈиБ_иЏйиГйиЈиБ'.split('_'),
        weekdays: 'иЇйиЃи­иЏ_иЇйиЅиЋййй_иЇйиЋйиЇиЋиЇиЁ_иЇйиЃиБиЈиЙиЇиЁ_иЇйиЎййиГ_иЇйиЌйиЙиЉ_иЇйиГиЈиЊ'.split('_'),
        weekdaysShort: 'иЃи­иЏ_иЅиЋййй_иЋйиЇиЋиЇиЁ_иЃиБиЈиЙиЇиЁ_иЎййиГ_иЌйиЙиЉ_иГиЈиЊ'.split('_'),
        weekdaysMin: 'и­_й_иЋ_иБ_иЎ_иЌ_иГ'.split('_'),
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'LT:ss',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY LT',
            LLLL: 'dddd D MMMM YYYY LT'
        },
        calendar: {
            sameDay: '[иЇйййй иЙйй иЇйиГиЇиЙиЉ] LT',
            nextDay: '[иКиЏиЇ иЙйй иЇйиГиЇиЙиЉ] LT',
            nextWeek: 'dddd [иЙйй иЇйиГиЇиЙиЉ] LT',
            lastDay: '[иЃйиГ иЙйй иЇйиГиЇиЙиЉ] LT',
            lastWeek: 'dddd [иЙйй иЇйиГиЇиЙиЉ] LT',
            sameElse: 'L'
        },
        relativeTime: {
            future: 'йй %s',
            past: 'ййиА %s',
            s: 'иЋйиЇй',
            m: 'иЏйййиЉ',
            mm: '%d иЏйиЇиІй',
            h: 'иГиЇиЙиЉ',
            hh: '%d иГиЇиЙиЇиЊ',
            d: 'ййй',
            dd: '%d иЃйиЇй',
            M: 'иДйиБ',
            MM: '%d иЃиДйиБ',
            y: 'иГйиЉ',
            yy: '%d иГййиЇиЊ'
        },
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4 // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// Locale: Arabic (ar)
// Author: Abdel Said: https://github.com/abdelsaid
// Changes in months, weekdays: Ahmed Elkhatib
// Native plural forms: forabi https://github.com/forabi

(function (factory) {
    factory(moment);
}(function (moment) {
    var symbolMap = {
        '1': 'йЁ',
        '2': 'йЂ',
        '3': 'йЃ',
        '4': 'йЄ',
        '5': 'йЅ',
        '6': 'йІ',
        '7': 'йЇ',
        '8': 'йЈ',
        '9': 'йЉ',
        '0': 'й '
    }, numberMap = {
        'йЁ': '1',
        'йЂ': '2',
        'йЃ': '3',
        'йЄ': '4',
        'йЅ': '5',
        'йІ': '6',
        'йЇ': '7',
        'йЈ': '8',
        'йЉ': '9',
        'й ': '0'
    }, pluralForm = function (n) {
        return n === 0 ? 0 : n === 1 ? 1 : n === 2 ? 2 : n % 100 >= 3 && n % 100 <= 10 ? 3 : n % 100 >= 11 ? 4 : 5;
    }, plurals = {
        s : ['иЃйй йй иЋиЇййиЉ', 'иЋиЇййиЉ йиЇи­иЏиЉ', ['иЋиЇййиЊиЇй', 'иЋиЇййиЊйй'], '%d иЋйиЇй', '%d иЋиЇййиЉ', '%d иЋиЇййиЉ'],
        m : ['иЃйй йй иЏйййиЉ', 'иЏйййиЉ йиЇи­иЏиЉ', ['иЏйййиЊиЇй', 'иЏйййиЊйй'], '%d иЏйиЇиІй', '%d иЏйййиЉ', '%d иЏйййиЉ'],
        h : ['иЃйй йй иГиЇиЙиЉ', 'иГиЇиЙиЉ йиЇи­иЏиЉ', ['иГиЇиЙиЊиЇй', 'иГиЇиЙиЊйй'], '%d иГиЇиЙиЇиЊ', '%d иГиЇиЙиЉ', '%d иГиЇиЙиЉ'],
        d : ['иЃйй йй ййй', 'ййй йиЇи­иЏ', ['йййиЇй', 'ййййй'], '%d иЃйиЇй', '%d ййййиЇ', '%d ййй'],
        M : ['иЃйй йй иДйиБ', 'иДйиБ йиЇи­иЏ', ['иДйиБиЇй', 'иДйиБйй'], '%d иЃиДйиБ', '%d иДйиБиЇ', '%d иДйиБ'],
        y : ['иЃйй йй иЙиЇй', 'иЙиЇй йиЇи­иЏ', ['иЙиЇйиЇй', 'иЙиЇййй'], '%d иЃиЙйиЇй', '%d иЙиЇййиЇ', '%d иЙиЇй']
    }, pluralize = function (u) {
        return function (number, withoutSuffix, string, isFuture) {
            var f = pluralForm(number),
                str = plurals[u][pluralForm(number)];
            if (f === 2) {
                str = str[withoutSuffix ? 0 : 1];
            }
            return str.replace(/%d/i, number);
        };
    }, months = [
        'йиЇййй иЇйиЋиЇйй ййиЇйиБ',
        'иДиЈиЇиЗ йиЈиБиЇйиБ',
        'иЂиАиЇиБ йиЇиБиГ',
        'ййиГиЇй иЃиЈиБйй',
        'иЃйиЇиБ йиЇйй',
        'и­иВйиБиЇй ййййй',
        'иЊййиВ ййййй',
        'иЂиЈ иЃиКиГиЗиГ',
        'иЃйййй иГиЈиЊйиЈиБ',
        'иЊиДиБйй иЇйиЃйй иЃйиЊйиЈиБ',
        'иЊиДиБйй иЇйиЋиЇйй ййййиЈиБ',
        'йиЇййй иЇйиЃйй иЏйиГйиЈиБ'
    ];

    return moment.defineLocale('ar', {
        months : months,
        monthsShort : months,
        weekdays : 'иЇйиЃи­иЏ_иЇйиЅиЋййй_иЇйиЋйиЇиЋиЇиЁ_иЇйиЃиБиЈиЙиЇиЁ_иЇйиЎййиГ_иЇйиЌйиЙиЉ_иЇйиГиЈиЊ'.split('_'),
        weekdaysShort : 'иЃи­иЏ_иЅиЋййй_иЋйиЇиЋиЇиЁ_иЃиБиЈиЙиЇиЁ_иЎййиГ_иЌйиЙиЉ_иГиЈиЊ'.split('_'),
        weekdaysMin : 'и­_й_иЋ_иБ_иЎ_иЌ_иГ'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'HH:mm:ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd D MMMM YYYY LT'
        },
        meridiemParse: /иЕ|й/,
        isPM : function (input) {
            return 'й' === input;
        },
        meridiem : function (hour, minute, isLower) {
            if (hour < 12) {
                return 'иЕ';
            } else {
                return 'й';
            }
        },
        calendar : {
            sameDay: '[иЇйййй иЙйиЏ иЇйиГиЇиЙиЉ] LT',
            nextDay: '[иКиЏйиЇ иЙйиЏ иЇйиГиЇиЙиЉ] LT',
            nextWeek: 'dddd [иЙйиЏ иЇйиГиЇиЙиЉ] LT',
            lastDay: '[иЃйиГ иЙйиЏ иЇйиГиЇиЙиЉ] LT',
            lastWeek: 'dddd [иЙйиЏ иЇйиГиЇиЙиЉ] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : 'иЈиЙиЏ %s',
            past : 'ййиА %s',
            s : pluralize('s'),
            m : pluralize('m'),
            mm : pluralize('m'),
            h : pluralize('h'),
            hh : pluralize('h'),
            d : pluralize('d'),
            dd : pluralize('d'),
            M : pluralize('M'),
            MM : pluralize('M'),
            y : pluralize('y'),
            yy : pluralize('y')
        },
        preparse: function (string) {
            return string.replace(/[йЁйЂйЃйЄйЅйІйЇйЈйЉй ]/g, function (match) {
                return numberMap[match];
            }).replace(/и/g, ',');
        },
        postformat: function (string) {
            return string.replace(/\d/g, function (match) {
                return symbolMap[match];
            }).replace(/,/g, 'и');
        },
        week : {
            dow : 6, // Saturday is the first day of the week.
            doy : 12  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : azerbaijani (az)
// author : topchiyev : https://github.com/topchiyev

(function (factory) {
    factory(moment);
}(function (moment) {
    var suffixes = {
        1: '-inci',
        5: '-inci',
        8: '-inci',
        70: '-inci',
        80: '-inci',

        2: '-nci',
        7: '-nci',
        20: '-nci',
        50: '-nci',

        3: '-УМncУМ',
        4: '-УМncУМ',
        100: '-УМncУМ',

        6: '-ncФБ',

        9: '-uncu',
        10: '-uncu',
        30: '-uncu',

        60: '-ФБncФБ',
        90: '-ФБncФБ'
    };
    return moment.defineLocale('az', {
        months : 'yanvar_fevral_mart_aprel_may_iyun_iyul_avqust_sentyabr_oktyabr_noyabr_dekabr'.split('_'),
        monthsShort : 'yan_fev_mar_apr_may_iyn_iyl_avq_sen_okt_noy_dek'.split('_'),
        weekdays : 'Bazar_Bazar ertЩsi_УЩrХЩnbЩ axХamФБ_УЩrХЩnbЩ_CУМmЩ axХamФБ_CУМmЩ_ХЩnbЩ'.split('_'),
        weekdaysShort : 'Baz_BzE_УAx_УЩr_CAx_CУМm_ХЩn'.split('_'),
        weekdaysMin : 'Bz_BE_УA_УЩ_CA_CУМ_ХЩ'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD.MM.YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd, D MMMM YYYY LT'
        },
        calendar : {
            sameDay : '[bugУМn saat] LT',
            nextDay : '[sabah saat] LT',
            nextWeek : '[gЩlЩn hЩftЩ] dddd [saat] LT',
            lastDay : '[dУМnЩn] LT',
            lastWeek : '[keУЇЩn hЩftЩ] dddd [saat] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : '%s sonra',
            past : '%s ЩvvЩl',
            s : 'birneУЇЩ saniyyЩ',
            m : 'bir dЩqiqЩ',
            mm : '%d dЩqiqЩ',
            h : 'bir saat',
            hh : '%d saat',
            d : 'bir gУМn',
            dd : '%d gУМn',
            M : 'bir ay',
            MM : '%d ay',
            y : 'bir il',
            yy : '%d il'
        },
        meridiemParse: /gecЩ|sЩhЩr|gУМndУМz|axХam/,
        isPM : function (input) {
            return /^(gУМndУМz|axХam)$/.test(input);
        },
        meridiem : function (hour, minute, isLower) {
            if (hour < 4) {
                return 'gecЩ';
            } else if (hour < 12) {
                return 'sЩhЩr';
            } else if (hour < 17) {
                return 'gУМndУМz';
            } else {
                return 'axХam';
            }
        },
        ordinalParse: /\d{1,2}-(ФБncФБ|inci|nci|УМncУМ|ncФБ|uncu)/,
        ordinal : function (number) {
            if (number === 0) {  // special case for zero
                return number + '-ФБncФБ';
            }
            var a = number % 10,
                b = number % 100 - a,
                c = number >= 100 ? 100 : null;

            return number + (suffixes[a] || suffixes[b] || suffixes[c]);
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : belarusian (be)
// author : Dmitry Demidov : https://github.com/demidov91
// author: Praleska: http://praleska.pro/
// Author : Menelion ElensУКle : https://github.com/Oire

(function (factory) {
    factory(moment);
}(function (moment) {
    function plural(word, num) {
        var forms = word.split('_');
        return num % 10 === 1 && num % 100 !== 11 ? forms[0] : (num % 10 >= 2 && num % 10 <= 4 && (num % 100 < 10 || num % 100 >= 20) ? forms[1] : forms[2]);
    }

    function relativeTimeWithPlural(number, withoutSuffix, key) {
        var format = {
            'mm': withoutSuffix ? 'баВбаЛбаНаА_баВбаЛбаНб_баВбаЛбаН' : 'баВбаЛбаНб_баВбаЛбаНб_баВбаЛбаН',
            'hh': withoutSuffix ? 'аГаАаДаЗбаНаА_аГаАаДаЗбаНб_аГаАаДаЗбаН' : 'аГаАаДаЗбаНб_аГаАаДаЗбаНб_аГаАаДаЗбаН',
            'dd': 'аДаЗаЕаНб_аДаНб_аДаЗбаН',
            'MM': 'аМаЕббб_аМаЕбббб_аМаЕбббаАб',
            'yy': 'аГаОаД_аГаАаДб_аГаАаДаОб'
        };
        if (key === 'm') {
            return withoutSuffix ? 'баВбаЛбаНаА' : 'баВбаЛбаНб';
        }
        else if (key === 'h') {
            return withoutSuffix ? 'аГаАаДаЗбаНаА' : 'аГаАаДаЗбаНб';
        }
        else {
            return number + ' ' + plural(format[key], +number);
        }
    }

    function monthsCaseReplace(m, format) {
        var months = {
            'nominative': 'бббаДаЗаЕаНб_аЛббб_баАаКаАаВбаК_аКбаАбаАаВбаК_ббаАаВаЕаНб_бббаВаЕаНб_аЛбаПаЕаНб_аЖаНбаВаЕаНб_аВаЕбаАбаЕаНб_аКаАбббббаНбаК_аЛбббаАаПаАаД_баНаЕаЖаАаНб'.split('_'),
            'accusative': 'бббаДаЗаЕаНб_аЛббаАаГаА_баАаКаАаВбаКаА_аКбаАбаАаВбаКаА_ббаАбаНб_бббаВаЕаНб_аЛбаПаЕаНб_аЖаНббаНб_аВаЕбаАбаНб_аКаАбббббаНбаКаА_аЛбббаАаПаАаДаА_баНаЕаЖаНб'.split('_')
        },

        nounCase = (/D[oD]?(\[[^\[\]]*\]|\s+)+MMMM?/).test(format) ?
            'accusative' :
            'nominative';

        return months[nounCase][m.month()];
    }

    function weekdaysCaseReplace(m, format) {
        var weekdays = {
            'nominative': 'аНбаДаЗаЕаЛб_аПаАаНбаДаЗаЕаЛаАаК_аАббаОбаАаК_баЕбаАаДаА_баАбаВаЕб_аПббаНббаА_ббаБаОбаА'.split('_'),
            'accusative': 'аНбаДаЗаЕаЛб_аПаАаНбаДаЗаЕаЛаАаК_аАббаОбаАаК_баЕбаАаДб_баАбаВаЕб_аПббаНббб_ббаБаОбб'.split('_')
        },

        nounCase = (/\[ ?[ааВ] ?(?:аМбаНбаЛбб|аНаАбббаПаНбб)? ?\] ?dddd/).test(format) ?
            'accusative' :
            'nominative';

        return weekdays[nounCase][m.day()];
    }

    return moment.defineLocale('be', {
        months : monthsCaseReplace,
        monthsShort : 'бббаД_аЛбб_баАаК_аКбаАб_ббаАаВ_бббаВ_аЛбаП_аЖаНбаВ_аВаЕб_аКаАбб_аЛббб_баНаЕаЖ'.split('_'),
        weekdays : weekdaysCaseReplace,
        weekdaysShort : 'аНаД_аПаН_аАб_бб_бб_аПб_баБ'.split('_'),
        weekdaysMin : 'аНаД_аПаН_аАб_бб_бб_аПб_баБ'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD.MM.YYYY',
            LL : 'D MMMM YYYY аГ.',
            LLL : 'D MMMM YYYY аГ., LT',
            LLLL : 'dddd, D MMMM YYYY аГ., LT'
        },
        calendar : {
            sameDay: '[аЁбаНаНб б] LT',
            nextDay: '[ааАбббаА б] LT',
            lastDay: '[аЃбаОбаА б] LT',
            nextWeek: function () {
                return '[аЃ] dddd [б] LT';
            },
            lastWeek: function () {
                switch (this.day()) {
                case 0:
                case 3:
                case 5:
                case 6:
                    return '[аЃ аМбаНбаЛбб] dddd [б] LT';
                case 1:
                case 2:
                case 4:
                    return '[аЃ аМбаНбаЛб] dddd [б] LT';
                }
            },
            sameElse: 'L'
        },
        relativeTime : {
            future : 'аПбаАаЗ %s',
            past : '%s баАаМб',
            s : 'аНаЕаКаАаЛбаКб баЕаКбаНаД',
            m : relativeTimeWithPlural,
            mm : relativeTimeWithPlural,
            h : relativeTimeWithPlural,
            hh : relativeTimeWithPlural,
            d : 'аДаЗаЕаНб',
            dd : relativeTimeWithPlural,
            M : 'аМаЕббб',
            MM : relativeTimeWithPlural,
            y : 'аГаОаД',
            yy : relativeTimeWithPlural
        },
        meridiemParse: /аНаОбб|баАаНббб|аДаНб|аВаЕбаАбаА/,
        isPM : function (input) {
            return /^(аДаНб|аВаЕбаАбаА)$/.test(input);
        },
        meridiem : function (hour, minute, isLower) {
            if (hour < 4) {
                return 'аНаОбб';
            } else if (hour < 12) {
                return 'баАаНббб';
            } else if (hour < 17) {
                return 'аДаНб';
            } else {
                return 'аВаЕбаАбаА';
            }
        },

        ordinalParse: /\d{1,2}-(б|б|аГаА)/,
        ordinal: function (number, period) {
            switch (period) {
            case 'M':
            case 'd':
            case 'DDD':
            case 'w':
            case 'W':
                return (number % 10 === 2 || number % 10 === 3) && (number % 100 !== 12 && number % 100 !== 13) ? number + '-б' : number + '-б';
            case 'D':
                return number + '-аГаА';
            default:
                return number;
            }
        },

        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : bulgarian (bg)
// author : Krasen Borisov : https://github.com/kraz

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('bg', {
        months : 'баНбаАбаИ_баЕаВббаАбаИ_аМаАбб_аАаПбаИаЛ_аМаАаЙ_баНаИ_баЛаИ_аАаВаГббб_баЕаПбаЕаМаВбаИ_аОаКбаОаМаВбаИ_аНаОаЕаМаВбаИ_аДаЕаКаЕаМаВбаИ'.split('_'),
        monthsShort : 'баНб_баЕаВ_аМаАб_аАаПб_аМаАаЙ_баНаИ_баЛаИ_аАаВаГ_баЕаП_аОаКб_аНаОаЕ_аДаЕаК'.split('_'),
        weekdays : 'аНаЕаДаЕаЛб_аПаОаНаЕаДаЕаЛаНаИаК_аВбаОбаНаИаК_бббаДаА_баЕбаВббббаК_аПаЕббаК_ббаБаОбаА'.split('_'),
        weekdaysShort : 'аНаЕаД_аПаОаН_аВбаО_ббб_баЕб_аПаЕб_ббаБ'.split('_'),
        weekdaysMin : 'аНаД_аПаН_аВб_бб_бб_аПб_баБ'.split('_'),
        longDateFormat : {
            LT : 'H:mm',
            LTS : 'LT:ss',
            L : 'D.MM.YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd, D MMMM YYYY LT'
        },
        calendar : {
            sameDay : '[ааНаЕб аВ] LT',
            nextDay : '[аЃббаЕ аВ] LT',
            nextWeek : 'dddd [аВ] LT',
            lastDay : '[абаЕбаА аВ] LT',
            lastWeek : function () {
                switch (this.day()) {
                case 0:
                case 3:
                case 6:
                    return '[а аИаЗаМаИаНаАаЛаАбаА] dddd [аВ] LT';
                case 1:
                case 2:
                case 4:
                case 5:
                    return '[а аИаЗаМаИаНаАаЛаИб] dddd [аВ] LT';
                }
            },
            sameElse : 'L'
        },
        relativeTime : {
            future : 'баЛаЕаД %s',
            past : 'аПбаЕаДаИ %s',
            s : 'аНбаКаОаЛаКаО баЕаКбаНаДаИ',
            m : 'аМаИаНббаА',
            mm : '%d аМаИаНббаИ',
            h : 'баАб',
            hh : '%d баАбаА',
            d : 'аДаЕаН',
            dd : '%d аДаНаИ',
            M : 'аМаЕбаЕб',
            MM : '%d аМаЕбаЕбаА',
            y : 'аГаОаДаИаНаА',
            yy : '%d аГаОаДаИаНаИ'
        },
        ordinalParse: /\d{1,2}-(аЕаВ|аЕаН|баИ|аВаИ|баИ|аМаИ)/,
        ordinal : function (number) {
            var lastDigit = number % 10,
                last2Digits = number % 100;
            if (number === 0) {
                return number + '-аЕаВ';
            } else if (last2Digits === 0) {
                return number + '-аЕаН';
            } else if (last2Digits > 10 && last2Digits < 20) {
                return number + '-баИ';
            } else if (lastDigit === 1) {
                return number + '-аВаИ';
            } else if (lastDigit === 2) {
                return number + '-баИ';
            } else if (lastDigit === 7 || lastDigit === 8) {
                return number + '-аМаИ';
            } else {
                return number + '-баИ';
            }
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : Bengali (bn)
// author : Kaushik Gandhi : https://github.com/kaushikgandhi

(function (factory) {
    factory(moment);
}(function (moment) {
    var symbolMap = {
        '1': 'рЇЇ',
        '2': 'рЇЈ',
        '3': 'рЇЉ',
        '4': 'рЇЊ',
        '5': 'рЇЋ',
        '6': 'рЇЌ',
        '7': 'рЇ­',
        '8': 'рЇЎ',
        '9': 'рЇЏ',
        '0': 'рЇІ'
    },
    numberMap = {
        'рЇЇ': '1',
        'рЇЈ': '2',
        'рЇЉ': '3',
        'рЇЊ': '4',
        'рЇЋ': '5',
        'рЇЌ': '6',
        'рЇ­': '7',
        'рЇЎ': '8',
        'рЇЏ': '9',
        'рЇІ': '0'
    };

    return moment.defineLocale('bn', {
        months : 'рІрІОрІЈрЇрЇрІОрІАрЇ_рІЋрЇрІЌрЇрЇрІОрІАрЇ_рІЎрІОрІАрЇрІ_рІрІЊрЇрІАрІПрІВ_рІЎрЇ_рІрЇрІЈ_рІрЇрІВрІОрІ_рІрІрІОрІИрЇрІ_рІИрЇрІЊрЇрІрЇрІЎрЇрІЌрІА_рІрІрЇрІрЇрІЌрІА_рІЈрІ­рЇрІЎрЇрІЌрІА_рІЁрІПрІИрЇрІЎрЇрІЌрІА'.split('_'),
        monthsShort : 'рІрІОрІЈрЇ_рІЋрЇрІЌ_рІЎрІОрІАрЇрІ_рІрІЊрІА_рІЎрЇ_рІрЇрІЈ_рІрЇрІВ_рІрІ_рІИрЇрІЊрЇрІ_рІрІрЇрІрЇ_рІЈрІ­_рІЁрІПрІИрЇрІЎрЇ'.split('_'),
        weekdays : 'рІАрІЌрІПрІЌрІОрІА_рІИрЇрІЎрІЌрІОрІА_рІЎрІрЇрІрІВрІЌрІОрІА_рІЌрЇрІЇрІЌрІОрІА_рІЌрЇрІЙрІИрЇрІЊрІЄрЇрІЄрІПрІЌрІОрІА_рІЖрЇрІрЇрІАрЇрІЌрІОрІА_рІЖрІЈрІПрІЌрІОрІА'.split('_'),
        weekdaysShort : 'рІАрІЌрІП_рІИрЇрІЎ_рІЎрІрЇрІрІВ_рІЌрЇрІЇ_рІЌрЇрІЙрІИрЇрІЊрІЄрЇрІЄрІП_рІЖрЇрІрЇрІАрЇ_рІЖрІЈрІП'.split('_'),
        weekdaysMin : 'рІАрІЌ_рІИрІЎ_рІЎрІрЇрІ_рІЌрЇ_рІЌрЇрІАрІПрІЙ_рІЖрЇ_рІЖрІЈрІП'.split('_'),
        longDateFormat : {
            LT : 'A h:mm рІИрІЎрЇ',
            LTS : 'A h:mm:ss рІИрІЎрЇ',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY, LT',
            LLLL : 'dddd, D MMMM YYYY, LT'
        },
        calendar : {
            sameDay : '[рІрІ] LT',
            nextDay : '[рІрІрІОрІЎрЇрІрІОрІВ] LT',
            nextWeek : 'dddd, LT',
            lastDay : '[рІрІЄрІрІОрІВ] LT',
            lastWeek : '[рІрІЄ] dddd, LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : '%s рІЊрІАрЇ',
            past : '%s рІрІрЇ',
            s : 'рІрІрІ рІИрЇрІрЇрІЈрЇрІЁ',
            m : 'рІрІ рІЎрІПрІЈрІПрІ',
            mm : '%d рІЎрІПрІЈрІПрІ',
            h : 'рІрІ рІрІЈрЇрІрІО',
            hh : '%d рІрІЈрЇрІрІО',
            d : 'рІрІ рІІрІПрІЈ',
            dd : '%d рІІрІПрІЈ',
            M : 'рІрІ рІЎрІОрІИ',
            MM : '%d рІЎрІОрІИ',
            y : 'рІрІ рІЌрІрІА',
            yy : '%d рІЌрІрІА'
        },
        preparse: function (string) {
            return string.replace(/[рЇЇрЇЈрЇЉрЇЊрЇЋрЇЌрЇ­рЇЎрЇЏрЇІ]/g, function (match) {
                return numberMap[match];
            });
        },
        postformat: function (string) {
            return string.replace(/\d/g, function (match) {
                return symbolMap[match];
            });
        },
        meridiemParse: /рІАрІОрІЄ|рІЖрІрІОрІВ|рІІрЇрІЊрЇрІА|рІЌрІПрІрЇрІВ|рІАрІОрІЄ/,
        isPM: function (input) {
            return /^(рІІрЇрІЊрЇрІА|рІЌрІПрІрЇрІВ|рІАрІОрІЄ)$/.test(input);
        },
        //Bengali is a vast language its spoken
        //in different forms in various parts of the world.
        //I have just generalized with most common one used
        meridiem : function (hour, minute, isLower) {
            if (hour < 4) {
                return 'рІАрІОрІЄ';
            } else if (hour < 10) {
                return 'рІЖрІрІОрІВ';
            } else if (hour < 17) {
                return 'рІІрЇрІЊрЇрІА';
            } else if (hour < 20) {
                return 'рІЌрІПрІрЇрІВ';
            } else {
                return 'рІАрІОрІЄ';
            }
        },
        week : {
            dow : 0, // Sunday is the first day of the week.
            doy : 6  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : tibetan (bo)
// author : Thupten N. Chakrishar : https://github.com/vajradog

(function (factory) {
    factory(moment);
}(function (moment) {
    var symbolMap = {
        '1': 'рМЁ',
        '2': 'рМЂ',
        '3': 'рМЃ',
        '4': 'рМЄ',
        '5': 'рМЅ',
        '6': 'рМІ',
        '7': 'рМЇ',
        '8': 'рМЈ',
        '9': 'рМЉ',
        '0': 'рМ '
    },
    numberMap = {
        'рМЁ': '1',
        'рМЂ': '2',
        'рМЃ': '3',
        'рМЄ': '4',
        'рМЅ': '5',
        'рМІ': '6',
        'рМЇ': '7',
        'рМЈ': '8',
        'рМЉ': '9',
        'рМ ': '0'
    };

    return moment.defineLocale('bo', {
        months : 'рНрОГрМрНрМрНрНрМрНрНМ_рНрОГрМрНрМрНрНрНВрНІрМрН_рНрОГрМрНрМрНрНІрНДрНрМрН_рНрОГрМрНрМрНрНрНВрМрН_рНрОГрМрНрМрНЃрОрМрН_рНрОГрМрНрМрНрОВрНДрНрМрН_рНрОГрМрНрМрНрНрНДрНрМрН_рНрОГрМрНрМрНрНЂрОрОБрНрМрН_рНрОГрМрНрМрНрНрНДрМрН_рНрОГрМрНрМрНрНрНДрМрН_рНрОГрМрНрМрНрНрНДрМрНрНрНВрНрМрН_рНрОГрМрНрМрНрНрНДрМрНрНрНВрНІрМрН'.split('_'),
        monthsShort : 'рНрОГрМрНрМрНрНрМрНрНМ_рНрОГрМрНрМрНрНрНВрНІрМрН_рНрОГрМрНрМрНрНІрНДрНрМрН_рНрОГрМрНрМрНрНрНВрМрН_рНрОГрМрНрМрНЃрОрМрН_рНрОГрМрНрМрНрОВрНДрНрМрН_рНрОГрМрНрМрНрНрНДрНрМрН_рНрОГрМрНрМрНрНЂрОрОБрНрМрН_рНрОГрМрНрМрНрНрНДрМрН_рНрОГрМрНрМрНрНрНДрМрН_рНрОГрМрНрМрНрНрНДрМрНрНрНВрНрМрН_рНрОГрМрНрМрНрНрНДрМрНрНрНВрНІрМрН'.split('_'),
        weekdays : 'рНрНрН рМрНрНВрМрНрМ_рНрНрН рМрНрОГрМрНрМ_рНрНрН рМрНрНВрНрМрНрНрНЂрМ_рНрНрН рМрНЃрОЗрНрМрНрМ_рНрНрН рМрНрНДрНЂрМрНрНД_рНрНрН рМрНрМрНІрНрНІрМ_рНрНрН рМрНІрОЄрНКрНрМрНрМ'.split('_'),
        weekdaysShort : 'рНрНВрМрНрМ_рНрОГрМрНрМ_рНрНВрНрМрНрНрНЂрМ_рНЃрОЗрНрМрНрМ_рНрНДрНЂрМрНрНД_рНрМрНІрНрНІрМ_рНІрОЄрНКрНрМрНрМ'.split('_'),
        weekdaysMin : 'рНрНВрМрНрМ_рНрОГрМрНрМ_рНрНВрНрМрНрНрНЂрМ_рНЃрОЗрНрМрНрМ_рНрНДрНЂрМрНрНД_рНрМрНІрНрНІрМ_рНІрОЄрНКрНрМрНрМ'.split('_'),
        longDateFormat : {
            LT : 'A h:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY, LT',
            LLLL : 'dddd, D MMMM YYYY, LT'
        },
        calendar : {
            sameDay : '[рНрНВрМрНЂрНВрН] LT',
            nextDay : '[рНІрНрМрНрНВрН] LT',
            nextWeek : '[рНрНрНДрНрМрНрОВрНрМрНЂрОрНКрНІрМрН], LT',
            lastDay : '[рНрМрНІрН] LT',
            lastWeek : '[рНрНрНДрНрМрНрОВрНрМрНрНрН рМрН] dddd, LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : '%s рНЃрМ',
            past : '%s рНІрОрНрМрНЃ',
            s : 'рНЃрНрМрНІрН',
            m : 'рНІрОрНЂрМрНрМрНрНрНВрН',
            mm : '%d рНІрОрНЂрМрН',
            h : 'рНрНДрМрНрНМрНрМрНрНрНВрН',
            hh : '%d рНрНДрМрНрНМрН',
            d : 'рНрНВрНрМрНрНрНВрН',
            dd : '%d рНрНВрНрМ',
            M : 'рНрОГрМрНрМрНрНрНВрН',
            MM : '%d рНрОГрМрН',
            y : 'рНЃрНМрМрНрНрНВрН',
            yy : '%d рНЃрНМ'
        },
        preparse: function (string) {
            return string.replace(/[рМЁрМЂрМЃрМЄрМЅрМІрМЇрМЈрМЉрМ ]/g, function (match) {
                return numberMap[match];
            });
        },
        postformat: function (string) {
            return string.replace(/\d/g, function (match) {
                return symbolMap[match];
            });
        },
        meridiemParse: /рНрНрНрМрНрНМ|рНрНМрНрНІрМрНрНІ|рНрНВрНрМрНрНДрН|рНрНрНМрНрМрНрН|рНрНрНрМрНрНМ/,
        isPM: function (input) {
            return /^(рНрНВрНрМрНрНДрН|рНрНрНМрНрМрНрН|рНрНрНрМрНрНМ)$/.test(input);
        },
        meridiem : function (hour, minute, isLower) {
            if (hour < 4) {
                return 'рНрНрНрМрНрНМ';
            } else if (hour < 10) {
                return 'рНрНМрНрНІрМрНрНІ';
            } else if (hour < 17) {
                return 'рНрНВрНрМрНрНДрН';
            } else if (hour < 20) {
                return 'рНрНрНМрНрМрНрН';
            } else {
                return 'рНрНрНрМрНрНМ';
            }
        },
        week : {
            dow : 0, // Sunday is the first day of the week.
            doy : 6  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : breton (br)
// author : Jean-Baptiste Le Duigou : https://github.com/jbleduigou

(function (factory) {
    factory(moment);
}(function (moment) {
    function relativeTimeWithMutation(number, withoutSuffix, key) {
        var format = {
            'mm': 'munutenn',
            'MM': 'miz',
            'dd': 'devezh'
        };
        return number + ' ' + mutation(format[key], number);
    }

    function specialMutationForYears(number) {
        switch (lastNumber(number)) {
        case 1:
        case 3:
        case 4:
        case 5:
        case 9:
            return number + ' bloaz';
        default:
            return number + ' vloaz';
        }
    }

    function lastNumber(number) {
        if (number > 9) {
            return lastNumber(number % 10);
        }
        return number;
    }

    function mutation(text, number) {
        if (number === 2) {
            return softMutation(text);
        }
        return text;
    }

    function softMutation(text) {
        var mutationTable = {
            'm': 'v',
            'b': 'v',
            'd': 'z'
        };
        if (mutationTable[text.charAt(0)] === undefined) {
            return text;
        }
        return mutationTable[text.charAt(0)] + text.substring(1);
    }

    return moment.defineLocale('br', {
        months : 'Genver_C\'hwevrer_Meurzh_Ebrel_Mae_Mezheven_Gouere_Eost_Gwengolo_Here_Du_Kerzu'.split('_'),
        monthsShort : 'Gen_C\'hwe_Meu_Ebr_Mae_Eve_Gou_Eos_Gwe_Her_Du_Ker'.split('_'),
        weekdays : 'Sul_Lun_Meurzh_Merc\'her_Yaou_Gwener_Sadorn'.split('_'),
        weekdaysShort : 'Sul_Lun_Meu_Mer_Yao_Gwe_Sad'.split('_'),
        weekdaysMin : 'Su_Lu_Me_Mer_Ya_Gw_Sa'.split('_'),
        longDateFormat : {
            LT : 'h[e]mm A',
            LTS : 'h[e]mm:ss A',
            L : 'DD/MM/YYYY',
            LL : 'D [a viz] MMMM YYYY',
            LLL : 'D [a viz] MMMM YYYY LT',
            LLLL : 'dddd, D [a viz] MMMM YYYY LT'
        },
        calendar : {
            sameDay : '[Hiziv da] LT',
            nextDay : '[Warc\'hoazh da] LT',
            nextWeek : 'dddd [da] LT',
            lastDay : '[Dec\'h da] LT',
            lastWeek : 'dddd [paset da] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : 'a-benn %s',
            past : '%s \'zo',
            s : 'un nebeud segondennoУЙ',
            m : 'ur vunutenn',
            mm : relativeTimeWithMutation,
            h : 'un eur',
            hh : '%d eur',
            d : 'un devezh',
            dd : relativeTimeWithMutation,
            M : 'ur miz',
            MM : relativeTimeWithMutation,
            y : 'ur bloaz',
            yy : specialMutationForYears
        },
        ordinalParse: /\d{1,2}(aУБ|vet)/,
        ordinal : function (number) {
            var output = (number === 1) ? 'aУБ' : 'vet';
            return number + output;
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : bosnian (bs)
// author : Nedim Cholich : https://github.com/frontyard
// based on (hr) translation by Bojan MarkoviФ

(function (factory) {
    factory(moment);
}(function (moment) {
    function translate(number, withoutSuffix, key) {
        var result = number + ' ';
        switch (key) {
        case 'm':
            return withoutSuffix ? 'jedna minuta' : 'jedne minute';
        case 'mm':
            if (number === 1) {
                result += 'minuta';
            } else if (number === 2 || number === 3 || number === 4) {
                result += 'minute';
            } else {
                result += 'minuta';
            }
            return result;
        case 'h':
            return withoutSuffix ? 'jedan sat' : 'jednog sata';
        case 'hh':
            if (number === 1) {
                result += 'sat';
            } else if (number === 2 || number === 3 || number === 4) {
                result += 'sata';
            } else {
                result += 'sati';
            }
            return result;
        case 'dd':
            if (number === 1) {
                result += 'dan';
            } else {
                result += 'dana';
            }
            return result;
        case 'MM':
            if (number === 1) {
                result += 'mjesec';
            } else if (number === 2 || number === 3 || number === 4) {
                result += 'mjeseca';
            } else {
                result += 'mjeseci';
            }
            return result;
        case 'yy':
            if (number === 1) {
                result += 'godina';
            } else if (number === 2 || number === 3 || number === 4) {
                result += 'godine';
            } else {
                result += 'godina';
            }
            return result;
        }
    }

    return moment.defineLocale('bs', {
        months : 'januar_februar_mart_april_maj_juni_juli_august_septembar_oktobar_novembar_decembar'.split('_'),
        monthsShort : 'jan._feb._mar._apr._maj._jun._jul._aug._sep._okt._nov._dec.'.split('_'),
        weekdays : 'nedjelja_ponedjeljak_utorak_srijeda_Фetvrtak_petak_subota'.split('_'),
        weekdaysShort : 'ned._pon._uto._sri._Фet._pet._sub.'.split('_'),
        weekdaysMin : 'ne_po_ut_sr_Фe_pe_su'.split('_'),
        longDateFormat : {
            LT : 'H:mm',
            LTS : 'LT:ss',
            L : 'DD. MM. YYYY',
            LL : 'D. MMMM YYYY',
            LLL : 'D. MMMM YYYY LT',
            LLLL : 'dddd, D. MMMM YYYY LT'
        },
        calendar : {
            sameDay  : '[danas u] LT',
            nextDay  : '[sutra u] LT',

            nextWeek : function () {
                switch (this.day()) {
                case 0:
                    return '[u] [nedjelju] [u] LT';
                case 3:
                    return '[u] [srijedu] [u] LT';
                case 6:
                    return '[u] [subotu] [u] LT';
                case 1:
                case 2:
                case 4:
                case 5:
                    return '[u] dddd [u] LT';
                }
            },
            lastDay  : '[juФer u] LT',
            lastWeek : function () {
                switch (this.day()) {
                case 0:
                case 3:
                    return '[proХЁlu] dddd [u] LT';
                case 6:
                    return '[proХЁle] [subote] [u] LT';
                case 1:
                case 2:
                case 4:
                case 5:
                    return '[proХЁli] dddd [u] LT';
                }
            },
            sameElse : 'L'
        },
        relativeTime : {
            future : 'za %s',
            past   : 'prije %s',
            s      : 'par sekundi',
            m      : translate,
            mm     : translate,
            h      : translate,
            hh     : translate,
            d      : 'dan',
            dd     : translate,
            M      : 'mjesec',
            MM     : translate,
            y      : 'godinu',
            yy     : translate
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : catalan (ca)
// author : Juan G. Hurtado : https://github.com/juanghurtado

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('ca', {
        months : 'gener_febrer_marУЇ_abril_maig_juny_juliol_agost_setembre_octubre_novembre_desembre'.split('_'),
        monthsShort : 'gen._febr._mar._abr._mai._jun._jul._ag._set._oct._nov._des.'.split('_'),
        weekdays : 'diumenge_dilluns_dimarts_dimecres_dijous_divendres_dissabte'.split('_'),
        weekdaysShort : 'dg._dl._dt._dc._dj._dv._ds.'.split('_'),
        weekdaysMin : 'Dg_Dl_Dt_Dc_Dj_Dv_Ds'.split('_'),
        longDateFormat : {
            LT : 'H:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd D MMMM YYYY LT'
        },
        calendar : {
            sameDay : function () {
                return '[avui a ' + ((this.hours() !== 1) ? 'les' : 'la') + '] LT';
            },
            nextDay : function () {
                return '[demУ  a ' + ((this.hours() !== 1) ? 'les' : 'la') + '] LT';
            },
            nextWeek : function () {
                return 'dddd [a ' + ((this.hours() !== 1) ? 'les' : 'la') + '] LT';
            },
            lastDay : function () {
                return '[ahir a ' + ((this.hours() !== 1) ? 'les' : 'la') + '] LT';
            },
            lastWeek : function () {
                return '[el] dddd [passat a ' + ((this.hours() !== 1) ? 'les' : 'la') + '] LT';
            },
            sameElse : 'L'
        },
        relativeTime : {
            future : 'en %s',
            past : 'fa %s',
            s : 'uns segons',
            m : 'un minut',
            mm : '%d minuts',
            h : 'una hora',
            hh : '%d hores',
            d : 'un dia',
            dd : '%d dies',
            M : 'un mes',
            MM : '%d mesos',
            y : 'un any',
            yy : '%d anys'
        },
        ordinalParse: /\d{1,2}(r|n|t|УЈ|a)/,
        ordinal : function (number, period) {
            var output = (number === 1) ? 'r' :
                (number === 2) ? 'n' :
                (number === 3) ? 'r' :
                (number === 4) ? 't' : 'УЈ';
            if (period === 'w' || period === 'W') {
                output = 'a';
            }
            return number + output;
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : czech (cs)
// author : petrbela : https://github.com/petrbela

(function (factory) {
    factory(moment);
}(function (moment) {
    var months = 'leden_УКnor_bХezen_duben_kvФten_Фerven_Фervenec_srpen_zУЁХУ­_ХУ­jen_listopad_prosinec'.split('_'),
        monthsShort = 'led_УКno_bХe_dub_kvФ_Фvn_Фvc_srp_zУЁХ_ХУ­j_lis_pro'.split('_');

    function plural(n) {
        return (n > 1) && (n < 5) && (~~(n / 10) !== 1);
    }

    function translate(number, withoutSuffix, key, isFuture) {
        var result = number + ' ';
        switch (key) {
        case 's':  // a few seconds / in a few seconds / a few seconds ago
            return (withoutSuffix || isFuture) ? 'pУЁr sekund' : 'pУЁr sekundami';
        case 'm':  // a minute / in a minute / a minute ago
            return withoutSuffix ? 'minuta' : (isFuture ? 'minutu' : 'minutou');
        case 'mm': // 9 minutes / in 9 minutes / 9 minutes ago
            if (withoutSuffix || isFuture) {
                return result + (plural(number) ? 'minuty' : 'minut');
            } else {
                return result + 'minutami';
            }
            break;
        case 'h':  // an hour / in an hour / an hour ago
            return withoutSuffix ? 'hodina' : (isFuture ? 'hodinu' : 'hodinou');
        case 'hh': // 9 hours / in 9 hours / 9 hours ago
            if (withoutSuffix || isFuture) {
                return result + (plural(number) ? 'hodiny' : 'hodin');
            } else {
                return result + 'hodinami';
            }
            break;
        case 'd':  // a day / in a day / a day ago
            return (withoutSuffix || isFuture) ? 'den' : 'dnem';
        case 'dd': // 9 days / in 9 days / 9 days ago
            if (withoutSuffix || isFuture) {
                return result + (plural(number) ? 'dny' : 'dnУ­');
            } else {
                return result + 'dny';
            }
            break;
        case 'M':  // a month / in a month / a month ago
            return (withoutSuffix || isFuture) ? 'mФsУ­c' : 'mФsУ­cem';
        case 'MM': // 9 months / in 9 months / 9 months ago
            if (withoutSuffix || isFuture) {
                return result + (plural(number) ? 'mФsУ­ce' : 'mФsУ­cХЏ');
            } else {
                return result + 'mФsУ­ci';
            }
            break;
        case 'y':  // a year / in a year / a year ago
            return (withoutSuffix || isFuture) ? 'rok' : 'rokem';
        case 'yy': // 9 years / in 9 years / 9 years ago
            if (withoutSuffix || isFuture) {
                return result + (plural(number) ? 'roky' : 'let');
            } else {
                return result + 'lety';
            }
            break;
        }
    }

    return moment.defineLocale('cs', {
        months : months,
        monthsShort : monthsShort,
        monthsParse : (function (months, monthsShort) {
            var i, _monthsParse = [];
            for (i = 0; i < 12; i++) {
                // use custom parser to solve problem with July (Фervenec)
                _monthsParse[i] = new RegExp('^' + months[i] + '$|^' + monthsShort[i] + '$', 'i');
            }
            return _monthsParse;
        }(months, monthsShort)),
        weekdays : 'nedФle_pondФlУ­_УКterУН_stХeda_Фtvrtek_pУЁtek_sobota'.split('_'),
        weekdaysShort : 'ne_po_УКt_st_Фt_pУЁ_so'.split('_'),
        weekdaysMin : 'ne_po_УКt_st_Фt_pУЁ_so'.split('_'),
        longDateFormat : {
            LT: 'H:mm',
            LTS : 'LT:ss',
            L : 'DD.MM.YYYY',
            LL : 'D. MMMM YYYY',
            LLL : 'D. MMMM YYYY LT',
            LLLL : 'dddd D. MMMM YYYY LT'
        },
        calendar : {
            sameDay: '[dnes v] LT',
            nextDay: '[zУ­tra v] LT',
            nextWeek: function () {
                switch (this.day()) {
                case 0:
                    return '[v nedФli v] LT';
                case 1:
                case 2:
                    return '[v] dddd [v] LT';
                case 3:
                    return '[ve stХedu v] LT';
                case 4:
                    return '[ve Фtvrtek v] LT';
                case 5:
                    return '[v pУЁtek v] LT';
                case 6:
                    return '[v sobotu v] LT';
                }
            },
            lastDay: '[vФera v] LT',
            lastWeek: function () {
                switch (this.day()) {
                case 0:
                    return '[minulou nedФli v] LT';
                case 1:
                case 2:
                    return '[minulУЉ] dddd [v] LT';
                case 3:
                    return '[minulou stХedu v] LT';
                case 4:
                case 5:
                    return '[minulУН] dddd [v] LT';
                case 6:
                    return '[minulou sobotu v] LT';
                }
            },
            sameElse: 'L'
        },
        relativeTime : {
            future : 'za %s',
            past : 'pХed %s',
            s : translate,
            m : translate,
            mm : translate,
            h : translate,
            hh : translate,
            d : translate,
            dd : translate,
            M : translate,
            MM : translate,
            y : translate,
            yy : translate
        },
        ordinalParse : /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : chuvash (cv)
// author : Anatoly Mironov : https://github.com/mirontoli

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('cv', {
        months : 'аКФбаЛаАб_аНаАбФб_аПбб_аАаКаА_аМаАаЙ_УЇФббаМаЕ_ббФ_УЇббаЛаА_аАаВФаН_баПаА_бгГаК_баАббаАаВ'.split('_'),
        monthsShort : 'аКФб_аНаАб_аПбб_аАаКаА_аМаАаЙ_УЇФб_ббФ_УЇбб_аАаВ_баПаА_бгГаК_баАб'.split('_'),
        weekdays : 'аВбббаАбаНаИаКбаН_ббаНбаИаКбаН_ббаЛаАбаИаКбаН_баНаКбаН_аКФУЇаНаЕбаНаИаКбаН_ббаНаЕаКбаН_бФаМаАбаКбаН'.split('_'),
        weekdaysShort : 'аВбб_ббаН_ббаЛ_баН_аКФУЇ_ббаН_бФаМ'.split('_'),
        weekdaysMin : 'аВб_баН_бб_баН_аКУЇ_бб_баМ'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD-MM-YYYY',
            LL : 'YYYY [УЇбаЛбаИ] MMMM [баЙФбФаН] D[-аМФбФ]',
            LLL : 'YYYY [УЇбаЛбаИ] MMMM [баЙФбФаН] D[-аМФбФ], LT',
            LLLL : 'dddd, YYYY [УЇбаЛбаИ] MMMM [баЙФбФаН] D[-аМФбФ], LT'
        },
        calendar : {
            sameDay: '[ааАбаН] LT [баЕбаЕббаЕ]',
            nextDay: '[аЋбаАаН] LT [баЕбаЕббаЕ]',
            lastDay: '[ФаНаЕб] LT [баЕбаЕббаЕ]',
            nextWeek: '[УаИбаЕб] dddd LT [баЕбаЕббаЕ]',
            lastWeek: '[аббаНФ] dddd LT [баЕбаЕббаЕ]',
            sameElse: 'L'
        },
        relativeTime : {
            future : function (output) {
                var affix = /баЕбаЕб$/i.exec(output) ? 'баЕаН' : /УЇбаЛ$/i.exec(output) ? 'баАаН' : 'баАаН';
                return output + affix;
            },
            past : '%s аКаАбаЛаЛаА',
            s : 'аПФб-аИаК УЇаЕаКаКбаНб',
            m : 'аПФб аМаИаНбб',
            mm : '%d аМаИаНбб',
            h : 'аПФб баЕбаЕб',
            hh : '%d баЕбаЕб',
            d : 'аПФб аКбаН',
            dd : '%d аКбаН',
            M : 'аПФб баЙФб',
            MM : '%d баЙФб',
            y : 'аПФб УЇбаЛ',
            yy : '%d УЇбаЛ'
        },
        ordinalParse: /\d{1,2}-аМФб/,
        ordinal : '%d-аМФб',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : Welsh (cy)
// author : Robert Allen

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('cy', {
        months: 'Ionawr_Chwefror_Mawrth_Ebrill_Mai_Mehefin_Gorffennaf_Awst_Medi_Hydref_Tachwedd_Rhagfyr'.split('_'),
        monthsShort: 'Ion_Chwe_Maw_Ebr_Mai_Meh_Gor_Aws_Med_Hyd_Tach_Rhag'.split('_'),
        weekdays: 'Dydd Sul_Dydd Llun_Dydd Mawrth_Dydd Mercher_Dydd Iau_Dydd Gwener_Dydd Sadwrn'.split('_'),
        weekdaysShort: 'Sul_Llun_Maw_Mer_Iau_Gwe_Sad'.split('_'),
        weekdaysMin: 'Su_Ll_Ma_Me_Ia_Gw_Sa'.split('_'),
        // time formats are the same as en-gb
        longDateFormat: {
            LT: 'HH:mm',
            LTS : 'LT:ss',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY LT',
            LLLL: 'dddd, D MMMM YYYY LT'
        },
        calendar: {
            sameDay: '[Heddiw am] LT',
            nextDay: '[Yfory am] LT',
            nextWeek: 'dddd [am] LT',
            lastDay: '[Ddoe am] LT',
            lastWeek: 'dddd [diwethaf am] LT',
            sameElse: 'L'
        },
        relativeTime: {
            future: 'mewn %s',
            past: '%s yn УДl',
            s: 'ychydig eiliadau',
            m: 'munud',
            mm: '%d munud',
            h: 'awr',
            hh: '%d awr',
            d: 'diwrnod',
            dd: '%d diwrnod',
            M: 'mis',
            MM: '%d mis',
            y: 'blwyddyn',
            yy: '%d flynedd'
        },
        ordinalParse: /\d{1,2}(fed|ain|af|il|ydd|ed|eg)/,
        // traditional ordinal numbers above 31 are not commonly used in colloquial Welsh
        ordinal: function (number) {
            var b = number,
                output = '',
                lookup = [
                    '', 'af', 'il', 'ydd', 'ydd', 'ed', 'ed', 'ed', 'fed', 'fed', 'fed', // 1af to 10fed
                    'eg', 'fed', 'eg', 'eg', 'fed', 'eg', 'eg', 'fed', 'eg', 'fed' // 11eg to 20fed
                ];

            if (b > 20) {
                if (b === 40 || b === 50 || b === 60 || b === 80 || b === 100) {
                    output = 'fed'; // not 30ain, 70ain or 90ain
                } else {
                    output = 'ain';
                }
            } else if (b > 0) {
                output = lookup[b];
            }

            return number + output;
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : danish (da)
// author : Ulrik Nielsen : https://github.com/mrbase

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('da', {
        months : 'januar_februar_marts_april_maj_juni_juli_august_september_oktober_november_december'.split('_'),
        monthsShort : 'jan_feb_mar_apr_maj_jun_jul_aug_sep_okt_nov_dec'.split('_'),
        weekdays : 'sУИndag_mandag_tirsdag_onsdag_torsdag_fredag_lУИrdag'.split('_'),
        weekdaysShort : 'sУИn_man_tir_ons_tor_fre_lУИr'.split('_'),
        weekdaysMin : 'sУИ_ma_ti_on_to_fr_lУИ'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D. MMMM YYYY',
            LLL : 'D. MMMM YYYY LT',
            LLLL : 'dddd [d.] D. MMMM YYYY LT'
        },
        calendar : {
            sameDay : '[I dag kl.] LT',
            nextDay : '[I morgen kl.] LT',
            nextWeek : 'dddd [kl.] LT',
            lastDay : '[I gУЅr kl.] LT',
            lastWeek : '[sidste] dddd [kl] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : 'om %s',
            past : '%s siden',
            s : 'fУЅ sekunder',
            m : 'et minut',
            mm : '%d minutter',
            h : 'en time',
            hh : '%d timer',
            d : 'en dag',
            dd : '%d dage',
            M : 'en mУЅned',
            MM : '%d mУЅneder',
            y : 'et УЅr',
            yy : '%d УЅr'
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : austrian german (de-at)
// author : lluchs : https://github.com/lluchs
// author: Menelion ElensУКle: https://github.com/Oire
// author : Martin Groller : https://github.com/MadMG

(function (factory) {
    factory(moment);
}(function (moment) {
    function processRelativeTime(number, withoutSuffix, key, isFuture) {
        var format = {
            'm': ['eine Minute', 'einer Minute'],
            'h': ['eine Stunde', 'einer Stunde'],
            'd': ['ein Tag', 'einem Tag'],
            'dd': [number + ' Tage', number + ' Tagen'],
            'M': ['ein Monat', 'einem Monat'],
            'MM': [number + ' Monate', number + ' Monaten'],
            'y': ['ein Jahr', 'einem Jahr'],
            'yy': [number + ' Jahre', number + ' Jahren']
        };
        return withoutSuffix ? format[key][0] : format[key][1];
    }

    return moment.defineLocale('de-at', {
        months : 'JУЄnner_Februar_MУЄrz_April_Mai_Juni_Juli_August_September_Oktober_November_Dezember'.split('_'),
        monthsShort : 'JУЄn._Febr._Mrz._Apr._Mai_Jun._Jul._Aug._Sept._Okt._Nov._Dez.'.split('_'),
        weekdays : 'Sonntag_Montag_Dienstag_Mittwoch_Donnerstag_Freitag_Samstag'.split('_'),
        weekdaysShort : 'So._Mo._Di._Mi._Do._Fr._Sa.'.split('_'),
        weekdaysMin : 'So_Mo_Di_Mi_Do_Fr_Sa'.split('_'),
        longDateFormat : {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L : 'DD.MM.YYYY',
            LL : 'D. MMMM YYYY',
            LLL : 'D. MMMM YYYY LT',
            LLLL : 'dddd, D. MMMM YYYY LT'
        },
        calendar : {
            sameDay: '[Heute um] LT [Uhr]',
            sameElse: 'L',
            nextDay: '[Morgen um] LT [Uhr]',
            nextWeek: 'dddd [um] LT [Uhr]',
            lastDay: '[Gestern um] LT [Uhr]',
            lastWeek: '[letzten] dddd [um] LT [Uhr]'
        },
        relativeTime : {
            future : 'in %s',
            past : 'vor %s',
            s : 'ein paar Sekunden',
            m : processRelativeTime,
            mm : '%d Minuten',
            h : processRelativeTime,
            hh : '%d Stunden',
            d : processRelativeTime,
            dd : processRelativeTime,
            M : processRelativeTime,
            MM : processRelativeTime,
            y : processRelativeTime,
            yy : processRelativeTime
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : german (de)
// author : lluchs : https://github.com/lluchs
// author: Menelion ElensУКle: https://github.com/Oire

(function (factory) {
    factory(moment);
}(function (moment) {
    function processRelativeTime(number, withoutSuffix, key, isFuture) {
        var format = {
            'm': ['eine Minute', 'einer Minute'],
            'h': ['eine Stunde', 'einer Stunde'],
            'd': ['ein Tag', 'einem Tag'],
            'dd': [number + ' Tage', number + ' Tagen'],
            'M': ['ein Monat', 'einem Monat'],
            'MM': [number + ' Monate', number + ' Monaten'],
            'y': ['ein Jahr', 'einem Jahr'],
            'yy': [number + ' Jahre', number + ' Jahren']
        };
        return withoutSuffix ? format[key][0] : format[key][1];
    }

    return moment.defineLocale('de', {
        months : 'Januar_Februar_MУЄrz_April_Mai_Juni_Juli_August_September_Oktober_November_Dezember'.split('_'),
        monthsShort : 'Jan._Febr._Mrz._Apr._Mai_Jun._Jul._Aug._Sept._Okt._Nov._Dez.'.split('_'),
        weekdays : 'Sonntag_Montag_Dienstag_Mittwoch_Donnerstag_Freitag_Samstag'.split('_'),
        weekdaysShort : 'So._Mo._Di._Mi._Do._Fr._Sa.'.split('_'),
        weekdaysMin : 'So_Mo_Di_Mi_Do_Fr_Sa'.split('_'),
        longDateFormat : {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L : 'DD.MM.YYYY',
            LL : 'D. MMMM YYYY',
            LLL : 'D. MMMM YYYY LT',
            LLLL : 'dddd, D. MMMM YYYY LT'
        },
        calendar : {
            sameDay: '[Heute um] LT [Uhr]',
            sameElse: 'L',
            nextDay: '[Morgen um] LT [Uhr]',
            nextWeek: 'dddd [um] LT [Uhr]',
            lastDay: '[Gestern um] LT [Uhr]',
            lastWeek: '[letzten] dddd [um] LT [Uhr]'
        },
        relativeTime : {
            future : 'in %s',
            past : 'vor %s',
            s : 'ein paar Sekunden',
            m : processRelativeTime,
            mm : '%d Minuten',
            h : processRelativeTime,
            hh : '%d Stunden',
            d : processRelativeTime,
            dd : processRelativeTime,
            M : processRelativeTime,
            MM : processRelativeTime,
            y : processRelativeTime,
            yy : processRelativeTime
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : modern greek (el)
// author : Aggelos Karalias : https://github.com/mehiel

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('el', {
        monthsNominativeEl : 'ЮЮБЮНЮПЯЮЌЯЮЙЮПЯ_ЮІЮЕЮВЯЮПЯЮЌЯЮЙЮПЯ_ЮЮЌЯЯЮЙЮПЯ_ЮЯЯЮЏЮЛЮЙЮПЯ_ЮЮЌЮЙЮПЯ_ЮЮПЯЮНЮЙЮПЯ_ЮЮПЯЮЛЮЙЮПЯ_ЮЯЮГЮПЯЯЯЮПЯ_ЮЃЮЕЯЯЮ­ЮМЮВЯЮЙЮПЯ_ЮЮКЯЯЮВЯЮЙЮПЯ_ЮЮПЮ­ЮМЮВЯЮЙЮПЯ_ЮЮЕЮКЮ­ЮМЮВЯЮЙЮПЯ'.split('_'),
        monthsGenitiveEl : 'ЮЮБЮНЮПЯЮБЯЮЏЮПЯ_ЮІЮЕЮВЯЮПЯЮБЯЮЏЮПЯ_ЮЮБЯЯЮЏЮПЯ_ЮЯЯЮЙЮЛЮЏЮПЯ_ЮЮБЮЮПЯ_ЮЮПЯЮНЮЏЮПЯ_ЮЮПЯЮЛЮЏЮПЯ_ЮЯЮГЮПЯЯЯЮПЯ_ЮЃЮЕЯЯЮЕЮМЮВЯЮЏЮПЯ_ЮЮКЯЯЮВЯЮЏЮПЯ_ЮЮПЮЕЮМЮВЯЮЏЮПЯ_ЮЮЕЮКЮЕЮМЮВЯЮЏЮПЯ'.split('_'),
        months : function (momentToFormat, format) {
            if (/D/.test(format.substring(0, format.indexOf('MMMM')))) { // if there is a day number before 'MMMM'
                return this._monthsGenitiveEl[momentToFormat.month()];
            } else {
                return this._monthsNominativeEl[momentToFormat.month()];
            }
        },
        monthsShort : 'ЮЮБЮН_ЮІЮЕЮВ_ЮЮБЯ_ЮЯЯ_ЮЮБЯ_ЮЮПЯЮН_ЮЮПЯЮЛ_ЮЯЮГ_ЮЃЮЕЯ_ЮЮКЯ_ЮЮПЮЕ_ЮЮЕЮК'.split('_'),
        weekdays : 'ЮЯЯЮЙЮБЮКЮЎ_ЮЮЕЯЯЮ­ЯЮБ_ЮЄЯЮЏЯЮЗ_ЮЄЮЕЯЮЌЯЯЮЗ_Ю Ю­ЮМЯЯЮЗ_Ю ЮБЯЮБЯЮКЮЕЯЮЎ_ЮЃЮЌЮВЮВЮБЯЮП'.split('_'),
        weekdaysShort : 'ЮЯЯ_ЮЮЕЯ_ЮЄЯЮЙ_ЮЄЮЕЯ_Ю ЮЕЮМ_Ю ЮБЯ_ЮЃЮБЮВ'.split('_'),
        weekdaysMin : 'ЮЯ_ЮЮЕ_ЮЄЯ_ЮЄЮЕ_Ю ЮЕ_Ю ЮБ_ЮЃЮБ'.split('_'),
        meridiem : function (hours, minutes, isLower) {
            if (hours > 11) {
                return isLower ? 'ЮМЮМ' : 'ЮЮ';
            } else {
                return isLower ? 'ЯЮМ' : 'Ю Ю';
            }
        },
        isPM : function (input) {
            return ((input + '').toLowerCase()[0] === 'ЮМ');
        },
        meridiemParse : /[Ю Ю]\.?Ю?\.?/i,
        longDateFormat : {
            LT : 'h:mm A',
            LTS : 'h:mm:ss A',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd, D MMMM YYYY LT'
        },
        calendarEl : {
            sameDay : '[ЮЃЮЎЮМЮЕЯЮБ {}] LT',
            nextDay : '[ЮЯЯЮЙЮП {}] LT',
            nextWeek : 'dddd [{}] LT',
            lastDay : '[ЮЇЮИЮЕЯ {}] LT',
            lastWeek : function () {
                switch (this.day()) {
                    case 6:
                        return '[ЯЮП ЯЯЮПЮЗЮГЮПЯЮМЮЕЮНЮП] dddd [{}] LT';
                    default:
                        return '[ЯЮЗЮН ЯЯЮПЮЗЮГЮПЯЮМЮЕЮНЮЗ] dddd [{}] LT';
                }
            },
            sameElse : 'L'
        },
        calendar : function (key, mom) {
            var output = this._calendarEl[key],
                hours = mom && mom.hours();

            if (typeof output === 'function') {
                output = output.apply(mom);
            }

            return output.replace('{}', (hours % 12 === 1 ? 'ЯЯЮЗ' : 'ЯЯЮЙЯ'));
        },
        relativeTime : {
            future : 'ЯЮЕ %s',
            past : '%s ЯЯЮЙЮН',
            s : 'ЮЛЮЏЮГЮБ ЮДЮЕЯЯЮЕЯЯЮЛЮЕЯЯЮБ',
            m : 'Ю­ЮНЮБ ЮЛЮЕЯЯЯ',
            mm : '%d ЮЛЮЕЯЯЮЌ',
            h : 'ЮМЮЏЮБ ЯЯЮБ',
            hh : '%d ЯЯЮЕЯ',
            d : 'ЮМЮЏЮБ ЮМЮ­ЯЮБ',
            dd : '%d ЮМЮ­ЯЮЕЯ',
            M : 'Ю­ЮНЮБЯ ЮМЮЎЮНЮБЯ',
            MM : '%d ЮМЮЎЮНЮЕЯ',
            y : 'Ю­ЮНЮБЯ ЯЯЯЮНЮПЯ',
            yy : '%d ЯЯЯЮНЮЙЮБ'
        },
        ordinalParse: /\d{1,2}ЮЗ/,
        ordinal: '%dЮЗ',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : australian english (en-au)

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('en-au', {
        months : 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_'),
        monthsShort : 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
        weekdays : 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_'),
        weekdaysShort : 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
        weekdaysMin : 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
        longDateFormat : {
            LT : 'h:mm A',
            LTS : 'h:mm:ss A',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd, D MMMM YYYY LT'
        },
        calendar : {
            sameDay : '[Today at] LT',
            nextDay : '[Tomorrow at] LT',
            nextWeek : 'dddd [at] LT',
            lastDay : '[Yesterday at] LT',
            lastWeek : '[Last] dddd [at] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : 'in %s',
            past : '%s ago',
            s : 'a few seconds',
            m : 'a minute',
            mm : '%d minutes',
            h : 'an hour',
            hh : '%d hours',
            d : 'a day',
            dd : '%d days',
            M : 'a month',
            MM : '%d months',
            y : 'a year',
            yy : '%d years'
        },
        ordinalParse: /\d{1,2}(st|nd|rd|th)/,
        ordinal : function (number) {
            var b = number % 10,
                output = (~~(number % 100 / 10) === 1) ? 'th' :
                (b === 1) ? 'st' :
                (b === 2) ? 'nd' :
                (b === 3) ? 'rd' : 'th';
            return number + output;
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : canadian english (en-ca)
// author : Jonathan Abourbih : https://github.com/jonbca

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('en-ca', {
        months : 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_'),
        monthsShort : 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
        weekdays : 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_'),
        weekdaysShort : 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
        weekdaysMin : 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
        longDateFormat : {
            LT : 'h:mm A',
            LTS : 'h:mm:ss A',
            L : 'YYYY-MM-DD',
            LL : 'D MMMM, YYYY',
            LLL : 'D MMMM, YYYY LT',
            LLLL : 'dddd, D MMMM, YYYY LT'
        },
        calendar : {
            sameDay : '[Today at] LT',
            nextDay : '[Tomorrow at] LT',
            nextWeek : 'dddd [at] LT',
            lastDay : '[Yesterday at] LT',
            lastWeek : '[Last] dddd [at] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : 'in %s',
            past : '%s ago',
            s : 'a few seconds',
            m : 'a minute',
            mm : '%d minutes',
            h : 'an hour',
            hh : '%d hours',
            d : 'a day',
            dd : '%d days',
            M : 'a month',
            MM : '%d months',
            y : 'a year',
            yy : '%d years'
        },
        ordinalParse: /\d{1,2}(st|nd|rd|th)/,
        ordinal : function (number) {
            var b = number % 10,
                output = (~~(number % 100 / 10) === 1) ? 'th' :
                (b === 1) ? 'st' :
                (b === 2) ? 'nd' :
                (b === 3) ? 'rd' : 'th';
            return number + output;
        }
    });
}));
// moment.js locale configuration
// locale : great britain english (en-gb)
// author : Chris Gedrim : https://github.com/chrisgedrim

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('en-gb', {
        months : 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_'),
        monthsShort : 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
        weekdays : 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_'),
        weekdaysShort : 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
        weekdaysMin : 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'HH:mm:ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd, D MMMM YYYY LT'
        },
        calendar : {
            sameDay : '[Today at] LT',
            nextDay : '[Tomorrow at] LT',
            nextWeek : 'dddd [at] LT',
            lastDay : '[Yesterday at] LT',
            lastWeek : '[Last] dddd [at] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : 'in %s',
            past : '%s ago',
            s : 'a few seconds',
            m : 'a minute',
            mm : '%d minutes',
            h : 'an hour',
            hh : '%d hours',
            d : 'a day',
            dd : '%d days',
            M : 'a month',
            MM : '%d months',
            y : 'a year',
            yy : '%d years'
        },
        ordinalParse: /\d{1,2}(st|nd|rd|th)/,
        ordinal : function (number) {
            var b = number % 10,
                output = (~~(number % 100 / 10) === 1) ? 'th' :
                (b === 1) ? 'st' :
                (b === 2) ? 'nd' :
                (b === 3) ? 'rd' : 'th';
            return number + output;
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : esperanto (eo)
// author : Colin Dean : https://github.com/colindean
// komento: Mi estas malcerta se mi korekte traktis akuzativojn en tiu traduko.
//          Se ne, bonvolu korekti kaj avizi min por ke mi povas lerni!

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('eo', {
        months : 'januaro_februaro_marto_aprilo_majo_junio_julio_aХ­gusto_septembro_oktobro_novembro_decembro'.split('_'),
        monthsShort : 'jan_feb_mar_apr_maj_jun_jul_aХ­g_sep_okt_nov_dec'.split('_'),
        weekdays : 'DimanФo_Lundo_Mardo_Merkredo_ФДaХ­do_Vendredo_Sabato'.split('_'),
        weekdaysShort : 'Dim_Lun_Mard_Merk_ФДaХ­_Ven_Sab'.split('_'),
        weekdaysMin : 'Di_Lu_Ma_Me_ФДa_Ve_Sa'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'YYYY-MM-DD',
            LL : 'D[-an de] MMMM, YYYY',
            LLL : 'D[-an de] MMMM, YYYY LT',
            LLLL : 'dddd, [la] D[-an de] MMMM, YYYY LT'
        },
        meridiemParse: /[ap]\.t\.m/i,
        isPM: function (input) {
            return input.charAt(0).toLowerCase() === 'p';
        },
        meridiem : function (hours, minutes, isLower) {
            if (hours > 11) {
                return isLower ? 'p.t.m.' : 'P.T.M.';
            } else {
                return isLower ? 'a.t.m.' : 'A.T.M.';
            }
        },
        calendar : {
            sameDay : '[HodiaХ­ je] LT',
            nextDay : '[MorgaХ­ je] LT',
            nextWeek : 'dddd [je] LT',
            lastDay : '[HieraХ­ je] LT',
            lastWeek : '[pasinta] dddd [je] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : 'je %s',
            past : 'antaХ­ %s',
            s : 'sekundoj',
            m : 'minuto',
            mm : '%d minutoj',
            h : 'horo',
            hh : '%d horoj',
            d : 'tago',//ne 'diurno', Фar estas uzita por proksimumo
            dd : '%d tagoj',
            M : 'monato',
            MM : '%d monatoj',
            y : 'jaro',
            yy : '%d jaroj'
        },
        ordinalParse: /\d{1,2}a/,
        ordinal : '%da',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : spanish (es)
// author : Julio NapurУ­ : https://github.com/julionc

(function (factory) {
    factory(moment);
}(function (moment) {
    var monthsShortDot = 'ene._feb._mar._abr._may._jun._jul._ago._sep._oct._nov._dic.'.split('_'),
        monthsShort = 'ene_feb_mar_abr_may_jun_jul_ago_sep_oct_nov_dic'.split('_');

    return moment.defineLocale('es', {
        months : 'enero_febrero_marzo_abril_mayo_junio_julio_agosto_septiembre_octubre_noviembre_diciembre'.split('_'),
        monthsShort : function (m, format) {
            if (/-MMM-/.test(format)) {
                return monthsShort[m.month()];
            } else {
                return monthsShortDot[m.month()];
            }
        },
        weekdays : 'domingo_lunes_martes_miУЉrcoles_jueves_viernes_sУЁbado'.split('_'),
        weekdaysShort : 'dom._lun._mar._miУЉ._jue._vie._sУЁb.'.split('_'),
        weekdaysMin : 'Do_Lu_Ma_Mi_Ju_Vi_SУЁ'.split('_'),
        longDateFormat : {
            LT : 'H:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D [de] MMMM [de] YYYY',
            LLL : 'D [de] MMMM [de] YYYY LT',
            LLLL : 'dddd, D [de] MMMM [de] YYYY LT'
        },
        calendar : {
            sameDay : function () {
                return '[hoy a la' + ((this.hours() !== 1) ? 's' : '') + '] LT';
            },
            nextDay : function () {
                return '[maУБana a la' + ((this.hours() !== 1) ? 's' : '') + '] LT';
            },
            nextWeek : function () {
                return 'dddd [a la' + ((this.hours() !== 1) ? 's' : '') + '] LT';
            },
            lastDay : function () {
                return '[ayer a la' + ((this.hours() !== 1) ? 's' : '') + '] LT';
            },
            lastWeek : function () {
                return '[el] dddd [pasado a la' + ((this.hours() !== 1) ? 's' : '') + '] LT';
            },
            sameElse : 'L'
        },
        relativeTime : {
            future : 'en %s',
            past : 'hace %s',
            s : 'unos segundos',
            m : 'un minuto',
            mm : '%d minutos',
            h : 'una hora',
            hh : '%d horas',
            d : 'un dУ­a',
            dd : '%d dУ­as',
            M : 'un mes',
            MM : '%d meses',
            y : 'un aУБo',
            yy : '%d aУБos'
        },
        ordinalParse : /\d{1,2}ТК/,
        ordinal : '%dТК',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : estonian (et)
// author : Henry Kehlmann : https://github.com/madhenry
// improvements : Illimar Tambek : https://github.com/ragulka

(function (factory) {
    factory(moment);
}(function (moment) {
    function processRelativeTime(number, withoutSuffix, key, isFuture) {
        var format = {
            's' : ['mУЕne sekundi', 'mУЕni sekund', 'paar sekundit'],
            'm' : ['УМhe minuti', 'УМks minut'],
            'mm': [number + ' minuti', number + ' minutit'],
            'h' : ['УМhe tunni', 'tund aega', 'УМks tund'],
            'hh': [number + ' tunni', number + ' tundi'],
            'd' : ['УМhe pУЄeva', 'УМks pУЄev'],
            'M' : ['kuu aja', 'kuu aega', 'УМks kuu'],
            'MM': [number + ' kuu', number + ' kuud'],
            'y' : ['УМhe aasta', 'aasta', 'УМks aasta'],
            'yy': [number + ' aasta', number + ' aastat']
        };
        if (withoutSuffix) {
            return format[key][2] ? format[key][2] : format[key][1];
        }
        return isFuture ? format[key][0] : format[key][1];
    }

    return moment.defineLocale('et', {
        months        : 'jaanuar_veebruar_mУЄrts_aprill_mai_juuni_juuli_august_september_oktoober_november_detsember'.split('_'),
        monthsShort   : 'jaan_veebr_mУЄrts_apr_mai_juuni_juuli_aug_sept_okt_nov_dets'.split('_'),
        weekdays      : 'pУМhapУЄev_esmaspУЄev_teisipУЄev_kolmapУЄev_neljapУЄev_reede_laupУЄev'.split('_'),
        weekdaysShort : 'P_E_T_K_N_R_L'.split('_'),
        weekdaysMin   : 'P_E_T_K_N_R_L'.split('_'),
        longDateFormat : {
            LT   : 'H:mm',
            LTS : 'LT:ss',
            L    : 'DD.MM.YYYY',
            LL   : 'D. MMMM YYYY',
            LLL  : 'D. MMMM YYYY LT',
            LLLL : 'dddd, D. MMMM YYYY LT'
        },
        calendar : {
            sameDay  : '[TУЄna,] LT',
            nextDay  : '[Homme,] LT',
            nextWeek : '[JУЄrgmine] dddd LT',
            lastDay  : '[Eile,] LT',
            lastWeek : '[Eelmine] dddd LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : '%s pУЄrast',
            past   : '%s tagasi',
            s      : processRelativeTime,
            m      : processRelativeTime,
            mm     : processRelativeTime,
            h      : processRelativeTime,
            hh     : processRelativeTime,
            d      : processRelativeTime,
            dd     : '%d pУЄeva',
            M      : processRelativeTime,
            MM     : processRelativeTime,
            y      : processRelativeTime,
            yy     : processRelativeTime
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : euskara (eu)
// author : Eneko Illarramendi : https://github.com/eillarra

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('eu', {
        months : 'urtarrila_otsaila_martxoa_apirila_maiatza_ekaina_uztaila_abuztua_iraila_urria_azaroa_abendua'.split('_'),
        monthsShort : 'urt._ots._mar._api._mai._eka._uzt._abu._ira._urr._aza._abe.'.split('_'),
        weekdays : 'igandea_astelehena_asteartea_asteazkena_osteguna_ostirala_larunbata'.split('_'),
        weekdaysShort : 'ig._al._ar._az._og._ol._lr.'.split('_'),
        weekdaysMin : 'ig_al_ar_az_og_ol_lr'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'YYYY-MM-DD',
            LL : 'YYYY[ko] MMMM[ren] D[a]',
            LLL : 'YYYY[ko] MMMM[ren] D[a] LT',
            LLLL : 'dddd, YYYY[ko] MMMM[ren] D[a] LT',
            l : 'YYYY-M-D',
            ll : 'YYYY[ko] MMM D[a]',
            lll : 'YYYY[ko] MMM D[a] LT',
            llll : 'ddd, YYYY[ko] MMM D[a] LT'
        },
        calendar : {
            sameDay : '[gaur] LT[etan]',
            nextDay : '[bihar] LT[etan]',
            nextWeek : 'dddd LT[etan]',
            lastDay : '[atzo] LT[etan]',
            lastWeek : '[aurreko] dddd LT[etan]',
            sameElse : 'L'
        },
        relativeTime : {
            future : '%s barru',
            past : 'duela %s',
            s : 'segundo batzuk',
            m : 'minutu bat',
            mm : '%d minutu',
            h : 'ordu bat',
            hh : '%d ordu',
            d : 'egun bat',
            dd : '%d egun',
            M : 'hilabete bat',
            MM : '%d hilabete',
            y : 'urte bat',
            yy : '%d urte'
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : Persian (fa)
// author : Ebrahim Byagowi : https://github.com/ebraminio

(function (factory) {
    factory(moment);
}(function (moment) {
    var symbolMap = {
        '1': 'лБ',
        '2': 'лВ',
        '3': 'лГ',
        '4': 'лД',
        '5': 'лЕ',
        '6': 'лЖ',
        '7': 'лЗ',
        '8': 'лИ',
        '9': 'лЙ',
        '0': 'лА'
    }, numberMap = {
        'лБ': '1',
        'лВ': '2',
        'лГ': '3',
        'лД': '4',
        'лЕ': '5',
        'лЖ': '6',
        'лЗ': '7',
        'лИ': '8',
        'лЙ': '9',
        'лА': '0'
    };

    return moment.defineLocale('fa', {
        months : 'киЇййлй_ййиБлй_йиЇиБиГ_иЂйиБлй_йй_кйиІй_кйиІлй_иЇйиЊ_иГйОиЊиЇйиЈиБ_иЇкЉиЊиЈиБ_ййиЇйиЈиБ_иЏиГиЇйиЈиБ'.split('_'),
        monthsShort : 'киЇййлй_ййиБлй_йиЇиБиГ_иЂйиБлй_йй_кйиІй_кйиІлй_иЇйиЊ_иГйОиЊиЇйиЈиБ_иЇкЉиЊиЈиБ_ййиЇйиЈиБ_иЏиГиЇйиЈиБ'.split('_'),
        weekdays : 'лкЉ\u200cиДйиЈй_иЏйиДйиЈй_иГй\u200cиДйиЈй_кйиЇиБиДйиЈй_йОйиЌ\u200cиДйиЈй_иЌйиЙй_иДйиЈй'.split('_'),
        weekdaysShort : 'лкЉ\u200cиДйиЈй_иЏйиДйиЈй_иГй\u200cиДйиЈй_кйиЇиБиДйиЈй_йОйиЌ\u200cиДйиЈй_иЌйиЙй_иДйиЈй'.split('_'),
        weekdaysMin : 'л_иЏ_иГ_к_йО_иЌ_иД'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd, D MMMM YYYY LT'
        },
        meridiemParse: /йиЈй иЇиВ иИйиБ|иЈиЙиЏ иЇиВ иИйиБ/,
        isPM: function (input) {
            return /иЈиЙиЏ иЇиВ иИйиБ/.test(input);
        },
        meridiem : function (hour, minute, isLower) {
            if (hour < 12) {
                return 'йиЈй иЇиВ иИйиБ';
            } else {
                return 'иЈиЙиЏ иЇиВ иИйиБ';
            }
        },
        calendar : {
            sameDay : '[иЇйиБйиВ иГиЇиЙиЊ] LT',
            nextDay : '[йиБиЏиЇ иГиЇиЙиЊ] LT',
            nextWeek : 'dddd [иГиЇиЙиЊ] LT',
            lastDay : '[иЏлиБйиВ иГиЇиЙиЊ] LT',
            lastWeek : 'dddd [йОлиД] [иГиЇиЙиЊ] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : 'иЏиБ %s',
            past : '%s йОлиД',
            s : 'кйиЏлй иЋиЇйлй',
            m : 'лкЉ иЏйлйй',
            mm : '%d иЏйлйй',
            h : 'лкЉ иГиЇиЙиЊ',
            hh : '%d иГиЇиЙиЊ',
            d : 'лкЉ иБйиВ',
            dd : '%d иБйиВ',
            M : 'лкЉ йиЇй',
            MM : '%d йиЇй',
            y : 'лкЉ иГиЇй',
            yy : '%d иГиЇй'
        },
        preparse: function (string) {
            return string.replace(/[лА-лЙ]/g, function (match) {
                return numberMap[match];
            }).replace(/и/g, ',');
        },
        postformat: function (string) {
            return string.replace(/\d/g, function (match) {
                return symbolMap[match];
            }).replace(/,/g, 'и');
        },
        ordinalParse: /\d{1,2}й/,
        ordinal : '%dй',
        week : {
            dow : 6, // Saturday is the first day of the week.
            doy : 12 // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : finnish (fi)
// author : Tarmo Aidantausta : https://github.com/bleadof

(function (factory) {
    factory(moment);
}(function (moment) {
    var numbersPast = 'nolla yksi kaksi kolme neljУЄ viisi kuusi seitsemУЄn kahdeksan yhdeksУЄn'.split(' '),
        numbersFuture = [
            'nolla', 'yhden', 'kahden', 'kolmen', 'neljУЄn', 'viiden', 'kuuden',
            numbersPast[7], numbersPast[8], numbersPast[9]
        ];

    function translate(number, withoutSuffix, key, isFuture) {
        var result = '';
        switch (key) {
        case 's':
            return isFuture ? 'muutaman sekunnin' : 'muutama sekunti';
        case 'm':
            return isFuture ? 'minuutin' : 'minuutti';
        case 'mm':
            result = isFuture ? 'minuutin' : 'minuuttia';
            break;
        case 'h':
            return isFuture ? 'tunnin' : 'tunti';
        case 'hh':
            result = isFuture ? 'tunnin' : 'tuntia';
            break;
        case 'd':
            return isFuture ? 'pУЄivУЄn' : 'pУЄivУЄ';
        case 'dd':
            result = isFuture ? 'pУЄivУЄn' : 'pУЄivУЄУЄ';
            break;
        case 'M':
            return isFuture ? 'kuukauden' : 'kuukausi';
        case 'MM':
            result = isFuture ? 'kuukauden' : 'kuukautta';
            break;
        case 'y':
            return isFuture ? 'vuoden' : 'vuosi';
        case 'yy':
            result = isFuture ? 'vuoden' : 'vuotta';
            break;
        }
        result = verbalNumber(number, isFuture) + ' ' + result;
        return result;
    }

    function verbalNumber(number, isFuture) {
        return number < 10 ? (isFuture ? numbersFuture[number] : numbersPast[number]) : number;
    }

    return moment.defineLocale('fi', {
        months : 'tammikuu_helmikuu_maaliskuu_huhtikuu_toukokuu_kesУЄkuu_heinУЄkuu_elokuu_syyskuu_lokakuu_marraskuu_joulukuu'.split('_'),
        monthsShort : 'tammi_helmi_maalis_huhti_touko_kesУЄ_heinУЄ_elo_syys_loka_marras_joulu'.split('_'),
        weekdays : 'sunnuntai_maanantai_tiistai_keskiviikko_torstai_perjantai_lauantai'.split('_'),
        weekdaysShort : 'su_ma_ti_ke_to_pe_la'.split('_'),
        weekdaysMin : 'su_ma_ti_ke_to_pe_la'.split('_'),
        longDateFormat : {
            LT : 'HH.mm',
            LTS : 'HH.mm.ss',
            L : 'DD.MM.YYYY',
            LL : 'Do MMMM[ta] YYYY',
            LLL : 'Do MMMM[ta] YYYY, [klo] LT',
            LLLL : 'dddd, Do MMMM[ta] YYYY, [klo] LT',
            l : 'D.M.YYYY',
            ll : 'Do MMM YYYY',
            lll : 'Do MMM YYYY, [klo] LT',
            llll : 'ddd, Do MMM YYYY, [klo] LT'
        },
        calendar : {
            sameDay : '[tУЄnУЄУЄn] [klo] LT',
            nextDay : '[huomenna] [klo] LT',
            nextWeek : 'dddd [klo] LT',
            lastDay : '[eilen] [klo] LT',
            lastWeek : '[viime] dddd[na] [klo] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : '%s pУЄУЄstУЄ',
            past : '%s sitten',
            s : translate,
            m : translate,
            mm : translate,
            h : translate,
            hh : translate,
            d : translate,
            dd : translate,
            M : translate,
            MM : translate,
            y : translate,
            yy : translate
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : faroese (fo)
// author : Ragnar Johannesen : https://github.com/ragnar123

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('fo', {
        months : 'januar_februar_mars_aprУ­l_mai_juni_juli_august_september_oktober_november_desember'.split('_'),
        monthsShort : 'jan_feb_mar_apr_mai_jun_jul_aug_sep_okt_nov_des'.split('_'),
        weekdays : 'sunnudagur_mУЁnadagur_tУНsdagur_mikudagur_hУГsdagur_frУ­ggjadagur_leygardagur'.split('_'),
        weekdaysShort : 'sun_mУЁn_tУНs_mik_hУГs_frУ­_ley'.split('_'),
        weekdaysMin : 'su_mУЁ_tУН_mi_hУГ_fr_le'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd D. MMMM, YYYY LT'
        },
        calendar : {
            sameDay : '[У dag kl.] LT',
            nextDay : '[У morgin kl.] LT',
            nextWeek : 'dddd [kl.] LT',
            lastDay : '[У gjУЁr kl.] LT',
            lastWeek : '[sУ­УАstu] dddd [kl] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : 'um %s',
            past : '%s sУ­УАani',
            s : 'fУЁ sekund',
            m : 'ein minutt',
            mm : '%d minuttir',
            h : 'ein tУ­mi',
            hh : '%d tУ­mar',
            d : 'ein dagur',
            dd : '%d dagar',
            M : 'ein mУЁnaУАi',
            MM : '%d mУЁnaУАir',
            y : 'eitt УЁr',
            yy : '%d УЁr'
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : canadian french (fr-ca)
// author : Jonathan Abourbih : https://github.com/jonbca

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('fr-ca', {
        months : 'janvier_fУЉvrier_mars_avril_mai_juin_juillet_aoУЛt_septembre_octobre_novembre_dУЉcembre'.split('_'),
        monthsShort : 'janv._fУЉvr._mars_avr._mai_juin_juil._aoУЛt_sept._oct._nov._dУЉc.'.split('_'),
        weekdays : 'dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi'.split('_'),
        weekdaysShort : 'dim._lun._mar._mer._jeu._ven._sam.'.split('_'),
        weekdaysMin : 'Di_Lu_Ma_Me_Je_Ve_Sa'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'YYYY-MM-DD',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd D MMMM YYYY LT'
        },
        calendar : {
            sameDay: '[Aujourd\'hui У ] LT',
            nextDay: '[Demain У ] LT',
            nextWeek: 'dddd [У ] LT',
            lastDay: '[Hier У ] LT',
            lastWeek: 'dddd [dernier У ] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : 'dans %s',
            past : 'il y a %s',
            s : 'quelques secondes',
            m : 'une minute',
            mm : '%d minutes',
            h : 'une heure',
            hh : '%d heures',
            d : 'un jour',
            dd : '%d jours',
            M : 'un mois',
            MM : '%d mois',
            y : 'un an',
            yy : '%d ans'
        },
        ordinalParse: /\d{1,2}(er|)/,
        ordinal : function (number) {
            return number + (number === 1 ? 'er' : '');
        }
    });
}));
// moment.js locale configuration
// locale : french (fr)
// author : John Fischer : https://github.com/jfroffice

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('fr', {
        months : 'janvier_fУЉvrier_mars_avril_mai_juin_juillet_aoУЛt_septembre_octobre_novembre_dУЉcembre'.split('_'),
        monthsShort : 'janv._fУЉvr._mars_avr._mai_juin_juil._aoУЛt_sept._oct._nov._dУЉc.'.split('_'),
        weekdays : 'dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi'.split('_'),
        weekdaysShort : 'dim._lun._mar._mer._jeu._ven._sam.'.split('_'),
        weekdaysMin : 'Di_Lu_Ma_Me_Je_Ve_Sa'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd D MMMM YYYY LT'
        },
        calendar : {
            sameDay: '[Aujourd\'hui У ] LT',
            nextDay: '[Demain У ] LT',
            nextWeek: 'dddd [У ] LT',
            lastDay: '[Hier У ] LT',
            lastWeek: 'dddd [dernier У ] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : 'dans %s',
            past : 'il y a %s',
            s : 'quelques secondes',
            m : 'une minute',
            mm : '%d minutes',
            h : 'une heure',
            hh : '%d heures',
            d : 'un jour',
            dd : '%d jours',
            M : 'un mois',
            MM : '%d mois',
            y : 'un an',
            yy : '%d ans'
        },
        ordinalParse: /\d{1,2}(er|)/,
        ordinal : function (number) {
            return number + (number === 1 ? 'er' : '');
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : frisian (fy)
// author : Robin van der Vliet : https://github.com/robin0van0der0v

(function (factory) {
    factory(moment);
}(function (moment) {
    var monthsShortWithDots = 'jan._feb._mrt._apr._mai_jun._jul._aug._sep._okt._nov._des.'.split('_'),
        monthsShortWithoutDots = 'jan_feb_mrt_apr_mai_jun_jul_aug_sep_okt_nov_des'.split('_');

    return moment.defineLocale('fy', {
        months : 'jannewaris_febrewaris_maart_april_maaie_juny_july_augustus_septimber_oktober_novimber_desimber'.split('_'),
        monthsShort : function (m, format) {
            if (/-MMM-/.test(format)) {
                return monthsShortWithoutDots[m.month()];
            } else {
                return monthsShortWithDots[m.month()];
            }
        },
        weekdays : 'snein_moandei_tiisdei_woansdei_tongersdei_freed_sneon'.split('_'),
        weekdaysShort : 'si._mo._ti._wo._to._fr._so.'.split('_'),
        weekdaysMin : 'Si_Mo_Ti_Wo_To_Fr_So'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD-MM-YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd D MMMM YYYY LT'
        },
        calendar : {
            sameDay: '[hjoed om] LT',
            nextDay: '[moarn om] LT',
            nextWeek: 'dddd [om] LT',
            lastDay: '[juster om] LT',
            lastWeek: '[УДfrУЛne] dddd [om] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : 'oer %s',
            past : '%s lyn',
            s : 'in pear sekonden',
            m : 'ien minУКt',
            mm : '%d minuten',
            h : 'ien oere',
            hh : '%d oeren',
            d : 'ien dei',
            dd : '%d dagen',
            M : 'ien moanne',
            MM : '%d moannen',
            y : 'ien jier',
            yy : '%d jierren'
        },
        ordinalParse: /\d{1,2}(ste|de)/,
        ordinal : function (number) {
            return number + ((number === 1 || number === 8 || number >= 20) ? 'ste' : 'de');
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : galician (gl)
// author : Juan G. Hurtado : https://github.com/juanghurtado

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('gl', {
        months : 'Xaneiro_Febreiro_Marzo_Abril_Maio_XuУБo_Xullo_Agosto_Setembro_Outubro_Novembro_Decembro'.split('_'),
        monthsShort : 'Xan._Feb._Mar._Abr._Mai._XuУБ._Xul._Ago._Set._Out._Nov._Dec.'.split('_'),
        weekdays : 'Domingo_Luns_Martes_MУЉrcores_Xoves_Venres_SУЁbado'.split('_'),
        weekdaysShort : 'Dom._Lun._Mar._MУЉr._Xov._Ven._SУЁb.'.split('_'),
        weekdaysMin : 'Do_Lu_Ma_MУЉ_Xo_Ve_SУЁ'.split('_'),
        longDateFormat : {
            LT : 'H:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd D MMMM YYYY LT'
        },
        calendar : {
            sameDay : function () {
                return '[hoxe ' + ((this.hours() !== 1) ? 'УЁs' : 'УЁ') + '] LT';
            },
            nextDay : function () {
                return '[maУБУЁ ' + ((this.hours() !== 1) ? 'УЁs' : 'УЁ') + '] LT';
            },
            nextWeek : function () {
                return 'dddd [' + ((this.hours() !== 1) ? 'УЁs' : 'a') + '] LT';
            },
            lastDay : function () {
                return '[onte ' + ((this.hours() !== 1) ? 'УЁ' : 'a') + '] LT';
            },
            lastWeek : function () {
                return '[o] dddd [pasado ' + ((this.hours() !== 1) ? 'УЁs' : 'a') + '] LT';
            },
            sameElse : 'L'
        },
        relativeTime : {
            future : function (str) {
                if (str === 'uns segundos') {
                    return 'nuns segundos';
                }
                return 'en ' + str;
            },
            past : 'hai %s',
            s : 'uns segundos',
            m : 'un minuto',
            mm : '%d minutos',
            h : 'unha hora',
            hh : '%d horas',
            d : 'un dУ­a',
            dd : '%d dУ­as',
            M : 'un mes',
            MM : '%d meses',
            y : 'un ano',
            yy : '%d anos'
        },
        ordinalParse : /\d{1,2}ТК/,
        ordinal : '%dТК',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : Hebrew (he)
// author : Tomer Cohen : https://github.com/tomer
// author : Moshe Simantov : https://github.com/DevelopmentIL
// author : Tal Ater : https://github.com/TalAter

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('he', {
        months : 'зз зззЈ_зЄззЈзззЈ_ззЈзЅ_ззЄзЈзз_ззз_ззз з_зззз_зззззЁз_зЁзЄззззЈ_зззЇззззЈ_з зззззЈ_ззІзззЈ'.split('_'),
        monthsShort : 'зз ззГ_зЄззЈзГ_ззЈзЅ_ззЄзЈзГ_ззз_ззз з_зззз_ззззГ_зЁзЄззГ_зззЇзГ_з зззГ_ззІззГ'.split('_'),
        weekdays : 'зЈззЉзз_зЉз з_зЉзззЉз_зЈзззЂз_ззззЉз_зЉззЉз_зЉззЊ'.split('_'),
        weekdaysShort : 'ззГ_ззГ_ззГ_ззГ_ззГ_ззГ_зЉзГ'.split('_'),
        weekdaysMin : 'з_з_з_з_з_з_зЉ'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D [з]MMMM YYYY',
            LLL : 'D [з]MMMM YYYY LT',
            LLLL : 'dddd, D [з]MMMM YYYY LT',
            l : 'D/M/YYYY',
            ll : 'D MMM YYYY',
            lll : 'D MMM YYYY LT',
            llll : 'ddd, D MMM YYYY LT'
        },
        calendar : {
            sameDay : '[зззз зжО]LT',
            nextDay : '[зззЈ зжО]LT',
            nextWeek : 'dddd [ззЉзЂз] LT',
            lastDay : '[ззЊззз зжО]LT',
            lastWeek : '[зззз] dddd [ззззЈзз ззЉзЂз] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : 'ззЂзз %s',
            past : 'ззЄз з %s',
            s : 'ззЁзЄзЈ зЉз зззЊ',
            m : 'ззЇз',
            mm : '%d ззЇззЊ',
            h : 'зЉзЂз',
            hh : function (number) {
                if (number === 2) {
                    return 'зЉзЂзЊззз';
                }
                return number + ' зЉзЂззЊ';
            },
            d : 'ззз',
            dd : function (number) {
                if (number === 2) {
                    return 'зззззз';
                }
                return number + ' зззз';
            },
            M : 'ззззЉ',
            MM : function (number) {
                if (number === 2) {
                    return 'ззззЉззз';
                }
                return number + ' ззззЉзз';
            },
            y : 'зЉз з',
            yy : function (number) {
                if (number === 2) {
                    return 'зЉз зЊззз';
                } else if (number % 10 === 0 && number !== 10) {
                    return number + ' зЉз з';
                }
                return number + ' зЉз зз';
            }
        }
    });
}));
// moment.js locale configuration
// locale : hindi (hi)
// author : Mayank Singhal : https://github.com/mayanksinghal

(function (factory) {
    factory(moment);
}(function (moment) {
    var symbolMap = {
        '1': 'рЅЇ',
        '2': 'рЅЈ',
        '3': 'рЅЉ',
        '4': 'рЅЊ',
        '5': 'рЅЋ',
        '6': 'рЅЌ',
        '7': 'рЅ­',
        '8': 'рЅЎ',
        '9': 'рЅЏ',
        '0': 'рЅІ'
    },
    numberMap = {
        'рЅЇ': '1',
        'рЅЈ': '2',
        'рЅЉ': '3',
        'рЅЊ': '4',
        'рЅЋ': '5',
        'рЅЌ': '6',
        'рЅ­': '7',
        'рЅЎ': '8',
        'рЅЏ': '9',
        'рЅІ': '0'
    };

    return moment.defineLocale('hi', {
        months : 'рЄрЄЈрЄЕрЄАрЅ_рЄЋрЄМрЄАрЄЕрЄАрЅ_рЄЎрЄОрЄАрЅрЄ_рЄрЄЊрЅрЄАрЅрЄВ_рЄЎрЄ_рЄрЅрЄЈ_рЄрЅрЄВрЄОрЄ_рЄрЄрЄИрЅрЄЄ_рЄИрЄПрЄЄрЄЎрЅрЄЌрЄА_рЄрЄрЅрЄрЅрЄЌрЄА_рЄЈрЄЕрЄЎрЅрЄЌрЄА_рЄІрЄПрЄИрЄЎрЅрЄЌрЄА'.split('_'),
        monthsShort : 'рЄрЄЈ._рЄЋрЄМрЄА._рЄЎрЄОрЄАрЅрЄ_рЄрЄЊрЅрЄАрЅ._рЄЎрЄ_рЄрЅрЄЈ_рЄрЅрЄВ._рЄрЄ._рЄИрЄПрЄЄ._рЄрЄрЅрЄрЅ._рЄЈрЄЕ._рЄІрЄПрЄИ.'.split('_'),
        weekdays : 'рЄАрЄЕрЄПрЄЕрЄОрЄА_рЄИрЅрЄЎрЄЕрЄОрЄА_рЄЎрЄрЄрЄВрЄЕрЄОрЄА_рЄЌрЅрЄЇрЄЕрЄОрЄА_рЄрЅрЄАрЅрЄЕрЄОрЄА_рЄЖрЅрЄрЅрЄАрЄЕрЄОрЄА_рЄЖрЄЈрЄПрЄЕрЄОрЄА'.split('_'),
        weekdaysShort : 'рЄАрЄЕрЄП_рЄИрЅрЄЎ_рЄЎрЄрЄрЄВ_рЄЌрЅрЄЇ_рЄрЅрЄАрЅ_рЄЖрЅрЄрЅрЄА_рЄЖрЄЈрЄП'.split('_'),
        weekdaysMin : 'рЄА_рЄИрЅ_рЄЎрЄ_рЄЌрЅ_рЄрЅ_рЄЖрЅ_рЄЖ'.split('_'),
        longDateFormat : {
            LT : 'A h:mm рЄЌрЄрЅ',
            LTS : 'A h:mm:ss рЄЌрЄрЅ',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY, LT',
            LLLL : 'dddd, D MMMM YYYY, LT'
        },
        calendar : {
            sameDay : '[рЄрЄ] LT',
            nextDay : '[рЄрЄВ] LT',
            nextWeek : 'dddd, LT',
            lastDay : '[рЄрЄВ] LT',
            lastWeek : '[рЄЊрЄПрЄрЄВрЅ] dddd, LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : '%s рЄЎрЅрЄ',
            past : '%s рЄЊрЄЙрЄВрЅ',
            s : 'рЄрЅрЄ рЄЙрЅ рЄрЅрЄЗрЄЃ',
            m : 'рЄрЄ рЄЎрЄПрЄЈрЄ',
            mm : '%d рЄЎрЄПрЄЈрЄ',
            h : 'рЄрЄ рЄрЄрЄрЄО',
            hh : '%d рЄрЄрЄрЅ',
            d : 'рЄрЄ рЄІрЄПрЄЈ',
            dd : '%d рЄІрЄПрЄЈ',
            M : 'рЄрЄ рЄЎрЄЙрЅрЄЈрЅ',
            MM : '%d рЄЎрЄЙрЅрЄЈрЅ',
            y : 'рЄрЄ рЄЕрЄАрЅрЄЗ',
            yy : '%d рЄЕрЄАрЅрЄЗ'
        },
        preparse: function (string) {
            return string.replace(/[рЅЇрЅЈрЅЉрЅЊрЅЋрЅЌрЅ­рЅЎрЅЏрЅІ]/g, function (match) {
                return numberMap[match];
            });
        },
        postformat: function (string) {
            return string.replace(/\d/g, function (match) {
                return symbolMap[match];
            });
        },
        // Hindi notation for meridiems are quite fuzzy in practice. While there exists
        // a rigid notion of a 'Pahar' it is not used as rigidly in modern Hindi.
        meridiemParse: /рЄАрЄОрЄЄ|рЄИрЅрЄЌрЄЙ|рЄІрЅрЄЊрЄЙрЄА|рЄЖрЄОрЄЎ/,
        meridiemHour : function (hour, meridiem) {
            if (hour === 12) {
                hour = 0;
            }
            if (meridiem === 'рЄАрЄОрЄЄ') {
                return hour < 4 ? hour : hour + 12;
            } else if (meridiem === 'рЄИрЅрЄЌрЄЙ') {
                return hour;
            } else if (meridiem === 'рЄІрЅрЄЊрЄЙрЄА') {
                return hour >= 10 ? hour : hour + 12;
            } else if (meridiem === 'рЄЖрЄОрЄЎ') {
                return hour + 12;
            }
        },
        meridiem : function (hour, minute, isLower) {
            if (hour < 4) {
                return 'рЄАрЄОрЄЄ';
            } else if (hour < 10) {
                return 'рЄИрЅрЄЌрЄЙ';
            } else if (hour < 17) {
                return 'рЄІрЅрЄЊрЄЙрЄА';
            } else if (hour < 20) {
                return 'рЄЖрЄОрЄЎ';
            } else {
                return 'рЄАрЄОрЄЄ';
            }
        },
        week : {
            dow : 0, // Sunday is the first day of the week.
            doy : 6  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : hrvatski (hr)
// author : Bojan MarkoviФ : https://github.com/bmarkovic

// based on (sl) translation by Robert SedovХЁek

(function (factory) {
    factory(moment);
}(function (moment) {
    function translate(number, withoutSuffix, key) {
        var result = number + ' ';
        switch (key) {
        case 'm':
            return withoutSuffix ? 'jedna minuta' : 'jedne minute';
        case 'mm':
            if (number === 1) {
                result += 'minuta';
            } else if (number === 2 || number === 3 || number === 4) {
                result += 'minute';
            } else {
                result += 'minuta';
            }
            return result;
        case 'h':
            return withoutSuffix ? 'jedan sat' : 'jednog sata';
        case 'hh':
            if (number === 1) {
                result += 'sat';
            } else if (number === 2 || number === 3 || number === 4) {
                result += 'sata';
            } else {
                result += 'sati';
            }
            return result;
        case 'dd':
            if (number === 1) {
                result += 'dan';
            } else {
                result += 'dana';
            }
            return result;
        case 'MM':
            if (number === 1) {
                result += 'mjesec';
            } else if (number === 2 || number === 3 || number === 4) {
                result += 'mjeseca';
            } else {
                result += 'mjeseci';
            }
            return result;
        case 'yy':
            if (number === 1) {
                result += 'godina';
            } else if (number === 2 || number === 3 || number === 4) {
                result += 'godine';
            } else {
                result += 'godina';
            }
            return result;
        }
    }

    return moment.defineLocale('hr', {
        months : 'sjeФanj_veljaФa_oХОujak_travanj_svibanj_lipanj_srpanj_kolovoz_rujan_listopad_studeni_prosinac'.split('_'),
        monthsShort : 'sje._vel._oХОu._tra._svi._lip._srp._kol._ruj._lis._stu._pro.'.split('_'),
        weekdays : 'nedjelja_ponedjeljak_utorak_srijeda_Фetvrtak_petak_subota'.split('_'),
        weekdaysShort : 'ned._pon._uto._sri._Фet._pet._sub.'.split('_'),
        weekdaysMin : 'ne_po_ut_sr_Фe_pe_su'.split('_'),
        longDateFormat : {
            LT : 'H:mm',
            LTS : 'LT:ss',
            L : 'DD. MM. YYYY',
            LL : 'D. MMMM YYYY',
            LLL : 'D. MMMM YYYY LT',
            LLLL : 'dddd, D. MMMM YYYY LT'
        },
        calendar : {
            sameDay  : '[danas u] LT',
            nextDay  : '[sutra u] LT',

            nextWeek : function () {
                switch (this.day()) {
                case 0:
                    return '[u] [nedjelju] [u] LT';
                case 3:
                    return '[u] [srijedu] [u] LT';
                case 6:
                    return '[u] [subotu] [u] LT';
                case 1:
                case 2:
                case 4:
                case 5:
                    return '[u] dddd [u] LT';
                }
            },
            lastDay  : '[juФer u] LT',
            lastWeek : function () {
                switch (this.day()) {
                case 0:
                case 3:
                    return '[proХЁlu] dddd [u] LT';
                case 6:
                    return '[proХЁle] [subote] [u] LT';
                case 1:
                case 2:
                case 4:
                case 5:
                    return '[proХЁli] dddd [u] LT';
                }
            },
            sameElse : 'L'
        },
        relativeTime : {
            future : 'za %s',
            past   : 'prije %s',
            s      : 'par sekundi',
            m      : translate,
            mm     : translate,
            h      : translate,
            hh     : translate,
            d      : 'dan',
            dd     : translate,
            M      : 'mjesec',
            MM     : translate,
            y      : 'godinu',
            yy     : translate
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : hungarian (hu)
// author : Adam Brunner : https://github.com/adambrunner

(function (factory) {
    factory(moment);
}(function (moment) {
    var weekEndings = 'vasУЁrnap hУЉtfХn kedden szerdУЁn csУМtУЖrtУЖkУЖn pУЉnteken szombaton'.split(' ');

    function translate(number, withoutSuffix, key, isFuture) {
        var num = number,
            suffix;

        switch (key) {
        case 's':
            return (isFuture || withoutSuffix) ? 'nУЉhУЁny mУЁsodperc' : 'nУЉhУЁny mУЁsodperce';
        case 'm':
            return 'egy' + (isFuture || withoutSuffix ? ' perc' : ' perce');
        case 'mm':
            return num + (isFuture || withoutSuffix ? ' perc' : ' perce');
        case 'h':
            return 'egy' + (isFuture || withoutSuffix ? ' УГra' : ' УГrУЁja');
        case 'hh':
            return num + (isFuture || withoutSuffix ? ' УГra' : ' УГrУЁja');
        case 'd':
            return 'egy' + (isFuture || withoutSuffix ? ' nap' : ' napja');
        case 'dd':
            return num + (isFuture || withoutSuffix ? ' nap' : ' napja');
        case 'M':
            return 'egy' + (isFuture || withoutSuffix ? ' hУГnap' : ' hУГnapja');
        case 'MM':
            return num + (isFuture || withoutSuffix ? ' hУГnap' : ' hУГnapja');
        case 'y':
            return 'egy' + (isFuture || withoutSuffix ? ' УЉv' : ' УЉve');
        case 'yy':
            return num + (isFuture || withoutSuffix ? ' УЉv' : ' УЉve');
        }

        return '';
    }

    function week(isFuture) {
        return (isFuture ? '' : '[mУКlt] ') + '[' + weekEndings[this.day()] + '] LT[-kor]';
    }

    return moment.defineLocale('hu', {
        months : 'januУЁr_februУЁr_mУЁrcius_УЁprilis_mУЁjus_jУКnius_jУКlius_augusztus_szeptember_oktУГber_november_december'.split('_'),
        monthsShort : 'jan_feb_mУЁrc_УЁpr_mУЁj_jУКn_jУКl_aug_szept_okt_nov_dec'.split('_'),
        weekdays : 'vasУЁrnap_hУЉtfХ_kedd_szerda_csУМtУЖrtУЖk_pУЉntek_szombat'.split('_'),
        weekdaysShort : 'vas_hУЉt_kedd_sze_csУМt_pУЉn_szo'.split('_'),
        weekdaysMin : 'v_h_k_sze_cs_p_szo'.split('_'),
        longDateFormat : {
            LT : 'H:mm',
            LTS : 'LT:ss',
            L : 'YYYY.MM.DD.',
            LL : 'YYYY. MMMM D.',
            LLL : 'YYYY. MMMM D., LT',
            LLLL : 'YYYY. MMMM D., dddd LT'
        },
        meridiemParse: /de|du/i,
        isPM: function (input) {
            return input.charAt(1).toLowerCase() === 'u';
        },
        meridiem : function (hours, minutes, isLower) {
            if (hours < 12) {
                return isLower === true ? 'de' : 'DE';
            } else {
                return isLower === true ? 'du' : 'DU';
            }
        },
        calendar : {
            sameDay : '[ma] LT[-kor]',
            nextDay : '[holnap] LT[-kor]',
            nextWeek : function () {
                return week.call(this, true);
            },
            lastDay : '[tegnap] LT[-kor]',
            lastWeek : function () {
                return week.call(this, false);
            },
            sameElse : 'L'
        },
        relativeTime : {
            future : '%s mУКlva',
            past : '%s',
            s : translate,
            m : translate,
            mm : translate,
            h : translate,
            hh : translate,
            d : translate,
            dd : translate,
            M : translate,
            MM : translate,
            y : translate,
            yy : translate
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : Armenian (hy-am)
// author : Armendarabyan : https://github.com/armendarabyan

(function (factory) {
    factory(moment);
}(function (moment) {
    function monthsCaseReplace(m, format) {
        var months = {
            'nominative': 'еАеИжеЖеОеЁж_жеЅеПжеОеЁж_еДеЁжеП_еЁеКжеЋеЌ_еДеЁеЕеЋеН_еАеИжеЖеЋеН_еАеИжеЌеЋеН_жеЃеИеНеПеИеН_еНеЅеКеПеЅеДеЂеЅж_еАеИеЏеПеЅеДеЂеЅж_еЖеИеЕеЅеДеЂеЅж_еЄеЅеЏеПеЅеДеЂеЅж'.split('_'),
            'accusative': 'еАеИжеЖеОеЁжеЋ_жеЅеПжеОеЁжеЋ_еДеЁжеПеЋ_еЁеКжеЋеЌеЋ_еДеЁеЕеЋеНеЋ_еАеИжеЖеЋеНеЋ_еАеИжеЌеЋеНеЋ_жеЃеИеНеПеИеНеЋ_еНеЅеКеПеЅеДеЂеЅжеЋ_еАеИеЏеПеЅеДеЂеЅжеЋ_еЖеИеЕеЅеДеЂеЅжеЋ_еЄеЅеЏеПеЅеДеЂеЅжеЋ'.split('_')
        },

        nounCase = (/D[oD]?(\[[^\[\]]*\]|\s+)+MMMM?/).test(format) ?
            'accusative' :
            'nominative';

        return months[nounCase][m.month()];
    }

    function monthsShortCaseReplace(m, format) {
        var monthsShort = 'еАеЖеО_жеПж_еДжеП_еЁеКж_еДеЕеН_еАеЖеН_еАеЌеН_жеЃеН_еНеКеП_еАеЏеП_еЖеДеЂ_еЄеЏеП'.split('_');

        return monthsShort[m.month()];
    }

    function weekdaysCaseReplace(m, format) {
        var weekdays = 'еЏеЋжеЁеЏеЋ_еЅжеЏеИжеЗеЁеЂеЉеЋ_еЅжеЅжеЗеЁеЂеЉеЋ_еЙеИжеЅжеЗеЁеЂеЉеЋ_еАеЋеЖеЃеЗеЁеЂеЉеЋ_еИжжеЂеЁеЉ_еЗеЁеЂеЁеЉ'.split('_');

        return weekdays[m.day()];
    }

    return moment.defineLocale('hy-am', {
        months : monthsCaseReplace,
        monthsShort : monthsShortCaseReplace,
        weekdays : weekdaysCaseReplace,
        weekdaysShort : 'еЏжеЏ_еЅжеЏ_еЅжж_еЙжж_еАеЖеЃ_еИжжеЂ_еЗеЂеЉ'.split('_'),
        weekdaysMin : 'еЏжеЏ_еЅжеЏ_еЅжж_еЙжж_еАеЖеЃ_еИжжеЂ_еЗеЂеЉ'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD.MM.YYYY',
            LL : 'D MMMM YYYY еЉ.',
            LLL : 'D MMMM YYYY еЉ., LT',
            LLLL : 'dddd, D MMMM YYYY еЉ., LT'
        },
        calendar : {
            sameDay: '[еЁеЕеНжж] LT',
            nextDay: '[еОеЁеВеЈ] LT',
            lastDay: '[еЅжеЅеЏ] LT',
            nextWeek: function () {
                return 'dddd [жжеЈ еЊеЁеДеЈ] LT';
            },
            lastWeek: function () {
                return '[еЁеЖжеЁеЎ] dddd [жжеЈ еЊеЁеДеЈ] LT';
            },
            sameElse: 'L'
        },
        relativeTime : {
            future : '%s еАеЅеПеИ',
            past : '%s еЁеМеЁеЛ',
            s : 'еДеЋ жеЁеЖеЋ еОеЁеЕжеЏеЕеЁеЖ',
            m : 'жеИеКеЅ',
            mm : '%d жеИеКеЅ',
            h : 'еЊеЁеД',
            hh : '%d еЊеЁеД',
            d : 'жж',
            dd : '%d жж',
            M : 'еЁеДеЋеН',
            MM : '%d еЁеДеЋеН',
            y : 'еПеЁжеЋ',
            yy : '%d еПеЁжеЋ'
        },

        meridiemParse: /еЃеЋеЗеЅжеОеЁ|еЁеМеЁеОеИеПеОеЁ|жеЅжеЅеЏеОеЁ|еЅжеЅеЏеИеЕеЁеЖ/,
        isPM: function (input) {
            return /^(жеЅжеЅеЏеОеЁ|еЅжеЅеЏеИеЕеЁеЖ)$/.test(input);
        },
        meridiem : function (hour) {
            if (hour < 4) {
                return 'еЃеЋеЗеЅжеОеЁ';
            } else if (hour < 12) {
                return 'еЁеМеЁеОеИеПеОеЁ';
            } else if (hour < 17) {
                return 'жеЅжеЅеЏеОеЁ';
            } else {
                return 'еЅжеЅеЏеИеЕеЁеЖ';
            }
        },

        ordinalParse: /\d{1,2}|\d{1,2}-(еЋеЖ|жеЄ)/,
        ordinal: function (number, period) {
            switch (period) {
            case 'DDD':
            case 'w':
            case 'W':
            case 'DDDo':
                if (number === 1) {
                    return number + '-еЋеЖ';
                }
                return number + '-жеЄ';
            default:
                return number;
            }
        },

        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : Bahasa Indonesia (id)
// author : Mohammad Satrio Utomo : https://github.com/tyok
// reference: http://id.wikisource.org/wiki/Pedoman_Umum_Ejaan_Bahasa_Indonesia_yang_Disempurnakan

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('id', {
        months : 'Januari_Februari_Maret_April_Mei_Juni_Juli_Agustus_September_Oktober_November_Desember'.split('_'),
        monthsShort : 'Jan_Feb_Mar_Apr_Mei_Jun_Jul_Ags_Sep_Okt_Nov_Des'.split('_'),
        weekdays : 'Minggu_Senin_Selasa_Rabu_Kamis_Jumat_Sabtu'.split('_'),
        weekdaysShort : 'Min_Sen_Sel_Rab_Kam_Jum_Sab'.split('_'),
        weekdaysMin : 'Mg_Sn_Sl_Rb_Km_Jm_Sb'.split('_'),
        longDateFormat : {
            LT : 'HH.mm',
            LTS : 'LT.ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY [pukul] LT',
            LLLL : 'dddd, D MMMM YYYY [pukul] LT'
        },
        meridiemParse: /pagi|siang|sore|malam/,
        meridiemHour : function (hour, meridiem) {
            if (hour === 12) {
                hour = 0;
            }
            if (meridiem === 'pagi') {
                return hour;
            } else if (meridiem === 'siang') {
                return hour >= 11 ? hour : hour + 12;
            } else if (meridiem === 'sore' || meridiem === 'malam') {
                return hour + 12;
            }
        },
        meridiem : function (hours, minutes, isLower) {
            if (hours < 11) {
                return 'pagi';
            } else if (hours < 15) {
                return 'siang';
            } else if (hours < 19) {
                return 'sore';
            } else {
                return 'malam';
            }
        },
        calendar : {
            sameDay : '[Hari ini pukul] LT',
            nextDay : '[Besok pukul] LT',
            nextWeek : 'dddd [pukul] LT',
            lastDay : '[Kemarin pukul] LT',
            lastWeek : 'dddd [lalu pukul] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : 'dalam %s',
            past : '%s yang lalu',
            s : 'beberapa detik',
            m : 'semenit',
            mm : '%d menit',
            h : 'sejam',
            hh : '%d jam',
            d : 'sehari',
            dd : '%d hari',
            M : 'sebulan',
            MM : '%d bulan',
            y : 'setahun',
            yy : '%d tahun'
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : icelandic (is)
// author : Hinrik Уrn SigurУАsson : https://github.com/hinrik

(function (factory) {
    factory(moment);
}(function (moment) {
    function plural(n) {
        if (n % 100 === 11) {
            return true;
        } else if (n % 10 === 1) {
            return false;
        }
        return true;
    }

    function translate(number, withoutSuffix, key, isFuture) {
        var result = number + ' ';
        switch (key) {
        case 's':
            return withoutSuffix || isFuture ? 'nokkrar sekУКndur' : 'nokkrum sekУКndum';
        case 'm':
            return withoutSuffix ? 'mУ­nУКta' : 'mУ­nУКtu';
        case 'mm':
            if (plural(number)) {
                return result + (withoutSuffix || isFuture ? 'mУ­nУКtur' : 'mУ­nУКtum');
            } else if (withoutSuffix) {
                return result + 'mУ­nУКta';
            }
            return result + 'mУ­nУКtu';
        case 'hh':
            if (plural(number)) {
                return result + (withoutSuffix || isFuture ? 'klukkustundir' : 'klukkustundum');
            }
            return result + 'klukkustund';
        case 'd':
            if (withoutSuffix) {
                return 'dagur';
            }
            return isFuture ? 'dag' : 'degi';
        case 'dd':
            if (plural(number)) {
                if (withoutSuffix) {
                    return result + 'dagar';
                }
                return result + (isFuture ? 'daga' : 'dУЖgum');
            } else if (withoutSuffix) {
                return result + 'dagur';
            }
            return result + (isFuture ? 'dag' : 'degi');
        case 'M':
            if (withoutSuffix) {
                return 'mУЁnuУАur';
            }
            return isFuture ? 'mУЁnuУА' : 'mУЁnuУАi';
        case 'MM':
            if (plural(number)) {
                if (withoutSuffix) {
                    return result + 'mУЁnuУАir';
                }
                return result + (isFuture ? 'mУЁnuУАi' : 'mУЁnuУАum');
            } else if (withoutSuffix) {
                return result + 'mУЁnuУАur';
            }
            return result + (isFuture ? 'mУЁnuУА' : 'mУЁnuУАi');
        case 'y':
            return withoutSuffix || isFuture ? 'УЁr' : 'УЁri';
        case 'yy':
            if (plural(number)) {
                return result + (withoutSuffix || isFuture ? 'УЁr' : 'УЁrum');
            }
            return result + (withoutSuffix || isFuture ? 'УЁr' : 'УЁri');
        }
    }

    return moment.defineLocale('is', {
        months : 'janУКar_febrУКar_mars_aprУ­l_maУ­_jУКnУ­_jУКlУ­_УЁgУКst_september_oktУГber_nУГvember_desember'.split('_'),
        monthsShort : 'jan_feb_mar_apr_maУ­_jУКn_jУКl_УЁgУК_sep_okt_nУГv_des'.split('_'),
        weekdays : 'sunnudagur_mУЁnudagur_УОriУАjudagur_miУАvikudagur_fimmtudagur_fУЖstudagur_laugardagur'.split('_'),
        weekdaysShort : 'sun_mУЁn_УОri_miУА_fim_fУЖs_lau'.split('_'),
        weekdaysMin : 'Su_MУЁ_Уr_Mi_Fi_FУЖ_La'.split('_'),
        longDateFormat : {
            LT : 'H:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D. MMMM YYYY',
            LLL : 'D. MMMM YYYY [kl.] LT',
            LLLL : 'dddd, D. MMMM YYYY [kl.] LT'
        },
        calendar : {
            sameDay : '[У­ dag kl.] LT',
            nextDay : '[УЁ morgun kl.] LT',
            nextWeek : 'dddd [kl.] LT',
            lastDay : '[У­ gУІr kl.] LT',
            lastWeek : '[sУ­УАasta] dddd [kl.] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : 'eftir %s',
            past : 'fyrir %s sУ­УАan',
            s : translate,
            m : translate,
            mm : translate,
            h : 'klukkustund',
            hh : translate,
            d : translate,
            dd : translate,
            M : translate,
            MM : translate,
            y : translate,
            yy : translate
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : italian (it)
// author : Lorenzo : https://github.com/aliem
// author: Mattia Larentis: https://github.com/nostalgiaz

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('it', {
        months : 'gennaio_febbraio_marzo_aprile_maggio_giugno_luglio_agosto_settembre_ottobre_novembre_dicembre'.split('_'),
        monthsShort : 'gen_feb_mar_apr_mag_giu_lug_ago_set_ott_nov_dic'.split('_'),
        weekdays : 'Domenica_LunedУЌ_MartedУЌ_MercoledУЌ_GiovedУЌ_VenerdУЌ_Sabato'.split('_'),
        weekdaysShort : 'Dom_Lun_Mar_Mer_Gio_Ven_Sab'.split('_'),
        weekdaysMin : 'D_L_Ma_Me_G_V_S'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd, D MMMM YYYY LT'
        },
        calendar : {
            sameDay: '[Oggi alle] LT',
            nextDay: '[Domani alle] LT',
            nextWeek: 'dddd [alle] LT',
            lastDay: '[Ieri alle] LT',
            lastWeek: function () {
                switch (this.day()) {
                    case 0:
                        return '[la scorsa] dddd [alle] LT';
                    default:
                        return '[lo scorso] dddd [alle] LT';
                }
            },
            sameElse: 'L'
        },
        relativeTime : {
            future : function (s) {
                return ((/^[0-9].+$/).test(s) ? 'tra' : 'in') + ' ' + s;
            },
            past : '%s fa',
            s : 'alcuni secondi',
            m : 'un minuto',
            mm : '%d minuti',
            h : 'un\'ora',
            hh : '%d ore',
            d : 'un giorno',
            dd : '%d giorni',
            M : 'un mese',
            MM : '%d mesi',
            y : 'un anno',
            yy : '%d anni'
        },
        ordinalParse : /\d{1,2}ТК/,
        ordinal: '%dТК',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : japanese (ja)
// author : LI Long : https://github.com/baryon

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('ja', {
        months : '1ц_2ц_3ц_4ц_5ц_6ц_7ц_8ц_9ц_10ц_11ц_12ц'.split('_'),
        monthsShort : '1ц_2ц_3ц_4ц_5ц_6ц_7ц_8ц_9ц_10ц_11ц_12ц'.split('_'),
        weekdays : 'цЅццЅ_цццЅ_чЋццЅ_цАДццЅ_цЈццЅ_щццЅ_хццЅ'.split('_'),
        weekdaysShort : 'цЅ_ц_чЋ_цАД_цЈ_щ_х'.split('_'),
        weekdaysMin : 'цЅ_ц_чЋ_цАД_цЈ_щ_х'.split('_'),
        longDateFormat : {
            LT : 'Ahцmх',
            LTS : 'LTsчЇ',
            L : 'YYYY/MM/DD',
            LL : 'YYYYхЙДMцDцЅ',
            LLL : 'YYYYхЙДMцDцЅLT',
            LLLL : 'YYYYхЙДMцDцЅLT dddd'
        },
        meridiemParse: /хх|ххО/i,
        isPM : function (input) {
            return input === 'ххО';
        },
        meridiem : function (hour, minute, isLower) {
            if (hour < 12) {
                return 'хх';
            } else {
                return 'ххО';
            }
        },
        calendar : {
            sameDay : '[фЛцЅ] LT',
            nextDay : '[ццЅ] LT',
            nextWeek : '[цЅщБ]dddd LT',
            lastDay : '[цЈцЅ] LT',
            lastWeek : '[хщБ]dddd LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : '%sхО',
            past : '%sх',
            s : 'цАчЇ',
            m : '1х',
            mm : '%dх',
            h : '1цщ',
            hh : '%dцщ',
            d : '1цЅ',
            dd : '%dцЅ',
            M : '1уЖц',
            MM : '%dуЖц',
            y : '1хЙД',
            yy : '%dхЙД'
        }
    });
}));
// moment.js locale configuration
// locale : Georgian (ka)
// author : Irakli Janiashvili : https://github.com/irakli-janiashvili

(function (factory) {
    factory(moment);
}(function (moment) {
    function monthsCaseReplace(m, format) {
        var months = {
            'nominative': 'сссссс с_ссссс сссс_ссс сЂс_ссс ссс_ссссЁс_сссссЁс_сссссЁс_сссссЁсЂс_сЁссЅсЂссссс с_ссЅсЂссссс с_ссссссс с_сссссссс с'.split('_'),
            'accusative': 'сссссс сЁ_ссссс ссссЁ_ссс сЂсЁ_ссс ссссЁ_ссссЁсЁ_сссссЁсЁ_сссссЁсЁ_сссссЁсЂсЁ_сЁссЅсЂссссс сЁ_ссЅсЂссссс сЁ_ссссссс сЁ_сссссссс сЁ'.split('_')
        },

        nounCase = (/D[oD] *MMMM?/).test(format) ?
            'accusative' :
            'nominative';

        return months[nounCase][m.month()];
    }

    function weekdaysCaseReplace(m, format) {
        var weekdays = {
            'nominative': 'сссс с_сс сЈссссс_сЁсссЈссссс_сссЎсЈссссс_сЎсЃссЈссссс_ссс ссЁсссс_сЈссссс'.split('_'),
            'accusative': 'сссс ссЁ_сс сЈсссссЁ_сЁсссЈсссссЁ_сссЎсЈсссссЁ_сЎсЃссЈсссссЁ_ссс ссЁссссЁ_сЈсссссЁ'.split('_')
        },

        nounCase = (/(сЌссс|сЈссссс)/).test(format) ?
            'accusative' :
            'nominative';

        return weekdays[nounCase][m.day()];
    }

    return moment.defineLocale('ka', {
        months : monthsCaseReplace,
        monthsShort : 'ссс_ссс_ссс _ссс _ссс_ссс_ссс_ссс_сЁссЅ_ссЅсЂ_ссс_ссс'.split('_'),
        weekdays : weekdaysCaseReplace,
        weekdaysShort : 'ссс_сс сЈ_сЁсс_сссЎ_сЎсЃс_ссс _сЈсс'.split('_'),
        weekdaysMin : 'сс_сс _сЁс_сс_сЎсЃ_сс_сЈс'.split('_'),
        longDateFormat : {
            LT : 'h:mm A',
            LTS : 'h:mm:ss A',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd, D MMMM YYYY LT'
        },
        calendar : {
            sameDay : '[ссІссЁ] LT[-сс]',
            nextDay : '[сЎссс] LT[-сс]',
            lastDay : '[ссЃсЈсс] LT[-сс]',
            nextWeek : '[сЈссссс] dddd LT[-сс]',
            lastWeek : '[сЌссс] dddd LT-сс',
            sameElse : 'L'
        },
        relativeTime : {
            future : function (s) {
                return (/(сЌссс|сЌсЃсс|сЁсссс|сЌссс)/).test(s) ?
                    s.replace(/с$/, 'сЈс') :
                    s + 'сЈс';
            },
            past : function (s) {
                if ((/(сЌссс|сЌсЃсс|сЁсссс|ссІс|ссс)/).test(s)) {
                    return s.replace(/(с|с)$/, 'ссЁ сЌсс');
                }
                if ((/сЌссс/).test(s)) {
                    return s.replace(/сЌссс$/, 'сЌсссЁ сЌсс');
                }
            },
            s : 'с сссссссс сЌссс',
            m : 'сЌсЃсс',
            mm : '%d сЌсЃсс',
            h : 'сЁсссс',
            hh : '%d сЁсссс',
            d : 'ссІс',
            dd : '%d ссІс',
            M : 'ссс',
            MM : '%d ссс',
            y : 'сЌссс',
            yy : '%d сЌссс'
        },
        ordinalParse: /0|1-сс|сс-\d{1,2}|\d{1,2}-с/,
        ordinal : function (number) {
            if (number === 0) {
                return number;
            }

            if (number === 1) {
                return number + '-сс';
            }

            if ((number < 20) || (number <= 100 && (number % 20 === 0)) || (number % 100 === 0)) {
                return 'сс-' + number;
            }

            return number + '-с';
        },
        week : {
            dow : 1,
            doy : 7
        }
    });
}));
// moment.js locale configuration
// locale : khmer (km)
// author : Kruy Vanna : https://github.com/kruyvanna

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('km', {
        months: 'ссссЖ_ссЛсссс_ссЗссЖ_ссссЖ_сЇсссЖ_ссЗссЛссЖ_ссссссЖ_ссИс сЖ_сссссЖ_ссЛссЖ_ссЗссссЗссЖ_ссссМ'.split('_'),
        monthsShort: 'ссссЖ_ссЛсссс_ссЗссЖ_ссссЖ_сЇсссЖ_ссЗссЛссЖ_ссссссЖ_ссИс сЖ_сссссЖ_ссЛссЖ_ссЗссссЗссЖ_ссссМ'.split('_'),
        weekdays: 'сЂсЖссЗссс_ссссс_сЂссссЖс_ссЛс_сссс сссссЗс_ссЛссс_сссс'.split('_'),
        weekdaysShort: 'сЂсЖссЗссс_ссссс_сЂссссЖс_ссЛс_сссс сссссЗс_ссЛссс_сссс'.split('_'),
        weekdaysMin: 'сЂсЖссЗссс_ссссс_сЂссссЖс_ссЛс_сссс сссссЗс_ссЛссс_сссс'.split('_'),
        longDateFormat: {
            LT: 'HH:mm',
            LTS : 'LT:ss',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY LT',
            LLLL: 'dddd, D MMMM YYYY LT'
        },
        calendar: {
            sameDay: '[сссссс сссс] LT',
            nextDay: '[сссЂсс сссс] LT',
            nextWeek: 'dddd [сссс] LT',
            lastDay: '[ссссЗсссЗс сссс] LT',
            lastWeek: 'dddd [сссссЖс сссЛс] [сссс] LT',
            sameElse: 'L'
        },
        relativeTime: {
            future: '%sссс',
            past: '%sссЛс',
            s: 'сссЛссссЖсссЗссЖссИ',
            m: 'ссНсссЖссИ',
            mm: '%d ссЖссИ',
            h: 'ссНссссс',
            hh: '%d сссс',
            d: 'ссНссссс',
            dd: '%d сссс',
            M: 'ссНссс',
            MM: '%d сс',
            y: 'ссНсссссЖс',
            yy: '%d ссссЖс'
        },
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4 // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : korean (ko)
//
// authors
//
// - Kyungwook, Park : https://github.com/kyungw00k
// - Jeeeyul Lee <jeeeyul@gmail.com>
(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('ko', {
        months : '1ь_2ь_3ь_4ь_5ь_6ь_7ь_8ь_9ь_10ь_11ь_12ь'.split('_'),
        monthsShort : '1ь_2ь_3ь_4ь_5ь_6ь_7ь_8ь_9ь_10ь_11ь_12ь'.split('_'),
        weekdays : 'ьМььМ_ьььМ_эььМ_ьььМ_ыЊЉььМ_ъИььМ_э ььМ'.split('_'),
        weekdaysShort : 'ьМ_ь_э_ь_ыЊЉ_ъИ_э '.split('_'),
        weekdaysMin : 'ьМ_ь_э_ь_ыЊЉ_ъИ_э '.split('_'),
        longDateFormat : {
            LT : 'A hь mыЖ',
            LTS : 'A hь mыЖ sьД',
            L : 'YYYY.MM.DD',
            LL : 'YYYYы MMMM DьМ',
            LLL : 'YYYYы MMMM DьМ LT',
            LLLL : 'YYYYы MMMM DьМ dddd LT'
        },
        calendar : {
            sameDay : 'ьЄы LT',
            nextDay : 'ыДьМ LT',
            nextWeek : 'dddd LT',
            lastDay : 'ьДь  LT',
            lastWeek : 'ьЇыьЃМ dddd LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : '%s э',
            past : '%s ь ',
            s : 'ыЊьД',
            ss : '%dьД',
            m : 'ьМыЖ',
            mm : '%dыЖ',
            h : 'эьъА',
            hh : '%dьъА',
            d : 'эыЃЈ',
            dd : '%dьМ',
            M : 'эыЌ',
            MM : '%dыЌ',
            y : 'ьМы',
            yy : '%dы'
        },
        ordinalParse : /\d{1,2}ьМ/,
        ordinal : '%dьМ',
        meridiemParse : /ьЄь |ьЄэ/,
        isPM : function (token) {
            return token === 'ьЄэ';
        },
        meridiem : function (hour, minute, isUpper) {
            return hour < 12 ? 'ьЄь ' : 'ьЄэ';
        }
    });
}));
// moment.js locale configuration
// locale : Luxembourgish (lb)
// author : mweimerskirch : https://github.com/mweimerskirch, David Raison : https://github.com/kwisatz

// Note: Luxembourgish has a very particular phonological rule ('Eifeler Regel') that causes the
// deletion of the final 'n' in certain contexts. That's what the 'eifelerRegelAppliesToWeekday'
// and 'eifelerRegelAppliesToNumber' methods are meant for

(function (factory) {
    factory(moment);
}(function (moment) {
    function processRelativeTime(number, withoutSuffix, key, isFuture) {
        var format = {
            'm': ['eng Minutt', 'enger Minutt'],
            'h': ['eng Stonn', 'enger Stonn'],
            'd': ['een Dag', 'engem Dag'],
            'M': ['ee Mount', 'engem Mount'],
            'y': ['ee Joer', 'engem Joer']
        };
        return withoutSuffix ? format[key][0] : format[key][1];
    }

    function processFutureTime(string) {
        var number = string.substr(0, string.indexOf(' '));
        if (eifelerRegelAppliesToNumber(number)) {
            return 'a ' + string;
        }
        return 'an ' + string;
    }

    function processPastTime(string) {
        var number = string.substr(0, string.indexOf(' '));
        if (eifelerRegelAppliesToNumber(number)) {
            return 'viru ' + string;
        }
        return 'virun ' + string;
    }

    /**
     * Returns true if the word before the given number loses the '-n' ending.
     * e.g. 'an 10 Deeg' but 'a 5 Deeg'
     *
     * @param number {integer}
     * @returns {boolean}
     */
    function eifelerRegelAppliesToNumber(number) {
        number = parseInt(number, 10);
        if (isNaN(number)) {
            return false;
        }
        if (number < 0) {
            // Negative Number --> always true
            return true;
        } else if (number < 10) {
            // Only 1 digit
            if (4 <= number && number <= 7) {
                return true;
            }
            return false;
        } else if (number < 100) {
            // 2 digits
            var lastDigit = number % 10, firstDigit = number / 10;
            if (lastDigit === 0) {
                return eifelerRegelAppliesToNumber(firstDigit);
            }
            return eifelerRegelAppliesToNumber(lastDigit);
        } else if (number < 10000) {
            // 3 or 4 digits --> recursively check first digit
            while (number >= 10) {
                number = number / 10;
            }
            return eifelerRegelAppliesToNumber(number);
        } else {
            // Anything larger than 4 digits: recursively check first n-3 digits
            number = number / 1000;
            return eifelerRegelAppliesToNumber(number);
        }
    }

    return moment.defineLocale('lb', {
        months: 'Januar_Februar_MУЄerz_AbrУЋll_Mee_Juni_Juli_August_September_Oktober_November_Dezember'.split('_'),
        monthsShort: 'Jan._Febr._Mrz._Abr._Mee_Jun._Jul._Aug._Sept._Okt._Nov._Dez.'.split('_'),
        weekdays: 'Sonndeg_MУЉindeg_DУЋnschdeg_MУЋttwoch_Donneschdeg_Freideg_Samschdeg'.split('_'),
        weekdaysShort: 'So._MУЉ._DУЋ._MУЋ._Do._Fr._Sa.'.split('_'),
        weekdaysMin: 'So_MУЉ_DУЋ_MУЋ_Do_Fr_Sa'.split('_'),
        longDateFormat: {
            LT: 'H:mm [Auer]',
            LTS: 'H:mm:ss [Auer]',
            L: 'DD.MM.YYYY',
            LL: 'D. MMMM YYYY',
            LLL: 'D. MMMM YYYY LT',
            LLLL: 'dddd, D. MMMM YYYY LT'
        },
        calendar: {
            sameDay: '[Haut um] LT',
            sameElse: 'L',
            nextDay: '[Muer um] LT',
            nextWeek: 'dddd [um] LT',
            lastDay: '[GУЋschter um] LT',
            lastWeek: function () {
                // Different date string for 'DУЋnschdeg' (Tuesday) and 'Donneschdeg' (Thursday) due to phonological rule
                switch (this.day()) {
                    case 2:
                    case 4:
                        return '[Leschten] dddd [um] LT';
                    default:
                        return '[Leschte] dddd [um] LT';
                }
            }
        },
        relativeTime : {
            future : processFutureTime,
            past : processPastTime,
            s : 'e puer Sekonnen',
            m : processRelativeTime,
            mm : '%d Minutten',
            h : processRelativeTime,
            hh : '%d Stonnen',
            d : processRelativeTime,
            dd : '%d Deeg',
            M : processRelativeTime,
            MM : '%d MУЉint',
            y : processRelativeTime,
            yy : '%d Joer'
        },
        ordinalParse: /\d{1,2}\./,
        ordinal: '%d.',
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : Lithuanian (lt)
// author : Mindaugas MozХЋras : https://github.com/mmozuras

(function (factory) {
    factory(moment);
}(function (moment) {
    var units = {
        'm' : 'minutФ_minutФs_minutФ',
        'mm': 'minutФs_minuФiХГ_minutes',
        'h' : 'valanda_valandos_valandФ',
        'hh': 'valandos_valandХГ_valandas',
        'd' : 'diena_dienos_dienФ',
        'dd': 'dienos_dienХГ_dienas',
        'M' : 'mФnuo_mФnesio_mФnesФЏ',
        'MM': 'mФnesiai_mФnesiХГ_mФnesius',
        'y' : 'metai_metХГ_metus',
        'yy': 'metai_metХГ_metus'
    },
    weekDays = 'sekmadienis_pirmadienis_antradienis_treФiadienis_ketvirtadienis_penktadienis_ХЁeХЁtadienis'.split('_');

    function translateSeconds(number, withoutSuffix, key, isFuture) {
        if (withoutSuffix) {
            return 'kelios sekundФs';
        } else {
            return isFuture ? 'keliХГ sekundХОiХГ' : 'kelias sekundes';
        }
    }

    function translateSingular(number, withoutSuffix, key, isFuture) {
        return withoutSuffix ? forms(key)[0] : (isFuture ? forms(key)[1] : forms(key)[2]);
    }

    function special(number) {
        return number % 10 === 0 || (number > 10 && number < 20);
    }

    function forms(key) {
        return units[key].split('_');
    }

    function translate(number, withoutSuffix, key, isFuture) {
        var result = number + ' ';
        if (number === 1) {
            return result + translateSingular(number, withoutSuffix, key[0], isFuture);
        } else if (withoutSuffix) {
            return result + (special(number) ? forms(key)[1] : forms(key)[0]);
        } else {
            if (isFuture) {
                return result + forms(key)[1];
            } else {
                return result + (special(number) ? forms(key)[1] : forms(key)[2]);
            }
        }
    }

    function relativeWeekDay(moment, format) {
        var nominative = format.indexOf('dddd HH:mm') === -1,
            weekDay = weekDays[moment.day()];

        return nominative ? weekDay : weekDay.substring(0, weekDay.length - 2) + 'ФЏ';
    }

    return moment.defineLocale('lt', {
        months : 'sausio_vasario_kovo_balandХОio_geguХОФs_birХОelio_liepos_rugpjХЋФio_rugsФjo_spalio_lapkriФio_gruodХОio'.split('_'),
        monthsShort : 'sau_vas_kov_bal_geg_bir_lie_rgp_rgs_spa_lap_grd'.split('_'),
        weekdays : relativeWeekDay,
        weekdaysShort : 'Sek_Pir_Ant_Tre_Ket_Pen_Х eХЁ'.split('_'),
        weekdaysMin : 'S_P_A_T_K_Pn_Х '.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'YYYY-MM-DD',
            LL : 'YYYY [m.] MMMM D [d.]',
            LLL : 'YYYY [m.] MMMM D [d.], LT [val.]',
            LLLL : 'YYYY [m.] MMMM D [d.], dddd, LT [val.]',
            l : 'YYYY-MM-DD',
            ll : 'YYYY [m.] MMMM D [d.]',
            lll : 'YYYY [m.] MMMM D [d.], LT [val.]',
            llll : 'YYYY [m.] MMMM D [d.], ddd, LT [val.]'
        },
        calendar : {
            sameDay : '[Х iandien] LT',
            nextDay : '[Rytoj] LT',
            nextWeek : 'dddd LT',
            lastDay : '[Vakar] LT',
            lastWeek : '[PraФjusФЏ] dddd LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : 'po %s',
            past : 'prieХЁ %s',
            s : translateSeconds,
            m : translateSingular,
            mm : translate,
            h : translateSingular,
            hh : translate,
            d : translateSingular,
            dd : translate,
            M : translateSingular,
            MM : translate,
            y : translateSingular,
            yy : translate
        },
        ordinalParse: /\d{1,2}-oji/,
        ordinal : function (number) {
            return number + '-oji';
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : latvian (lv)
// author : Kristaps Karlsons : https://github.com/skakri

(function (factory) {
    factory(moment);
}(function (moment) {
    var units = {
        'mm': 'minХЋti_minХЋtes_minХЋte_minХЋtes',
        'hh': 'stundu_stundas_stunda_stundas',
        'dd': 'dienu_dienas_diena_dienas',
        'MM': 'mФnesi_mФneХЁus_mФnesis_mФneХЁi',
        'yy': 'gadu_gadus_gads_gadi'
    };

    function format(word, number, withoutSuffix) {
        var forms = word.split('_');
        if (withoutSuffix) {
            return number % 10 === 1 && number !== 11 ? forms[2] : forms[3];
        } else {
            return number % 10 === 1 && number !== 11 ? forms[0] : forms[1];
        }
    }

    function relativeTimeWithPlural(number, withoutSuffix, key) {
        return number + ' ' + format(units[key], number, withoutSuffix);
    }

    return moment.defineLocale('lv', {
        months : 'janvФris_februФris_marts_aprФЋlis_maijs_jХЋnijs_jХЋlijs_augusts_septembris_oktobris_novembris_decembris'.split('_'),
        monthsShort : 'jan_feb_mar_apr_mai_jХЋn_jХЋl_aug_sep_okt_nov_dec'.split('_'),
        weekdays : 'svФtdiena_pirmdiena_otrdiena_treХЁdiena_ceturtdiena_piektdiena_sestdiena'.split('_'),
        weekdaysShort : 'Sv_P_O_T_C_Pk_S'.split('_'),
        weekdaysMin : 'Sv_P_O_T_C_Pk_S'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD.MM.YYYY',
            LL : 'YYYY. [gada] D. MMMM',
            LLL : 'YYYY. [gada] D. MMMM, LT',
            LLLL : 'YYYY. [gada] D. MMMM, dddd, LT'
        },
        calendar : {
            sameDay : '[Х odien pulksten] LT',
            nextDay : '[RФЋt pulksten] LT',
            nextWeek : 'dddd [pulksten] LT',
            lastDay : '[Vakar pulksten] LT',
            lastWeek : '[PagФjuХЁФ] dddd [pulksten] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : '%s vФlФk',
            past : '%s agrФk',
            s : 'daХОas sekundes',
            m : 'minХЋti',
            mm : relativeTimeWithPlural,
            h : 'stundu',
            hh : relativeTimeWithPlural,
            d : 'dienu',
            dd : relativeTimeWithPlural,
            M : 'mФnesi',
            MM : relativeTimeWithPlural,
            y : 'gadu',
            yy : relativeTimeWithPlural
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : macedonian (mk)
// author : Borislav Mickov : https://github.com/B0k0

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('mk', {
        months : 'баАаНбаАбаИ_баЕаВббаАбаИ_аМаАбб_аАаПбаИаЛ_аМаАб_ббаНаИ_ббаЛаИ_аАаВаГббб_баЕаПбаЕаМаВбаИ_аОаКбаОаМаВбаИ_аНаОаЕаМаВбаИ_аДаЕаКаЕаМаВбаИ'.split('_'),
        monthsShort : 'баАаН_баЕаВ_аМаАб_аАаПб_аМаАб_ббаН_ббаЛ_аАаВаГ_баЕаП_аОаКб_аНаОаЕ_аДаЕаК'.split('_'),
        weekdays : 'аНаЕаДаЕаЛаА_аПаОаНаЕаДаЕаЛаНаИаК_аВбаОбаНаИаК_ббаЕаДаА_баЕбаВббаОаК_аПаЕбаОаК_баАаБаОбаА'.split('_'),
        weekdaysShort : 'аНаЕаД_аПаОаН_аВбаО_ббаЕ_баЕб_аПаЕб_баАаБ'.split('_'),
        weekdaysMin : 'аНe_аПo_аВб_бб_баЕ_аПаЕ_бa'.split('_'),
        longDateFormat : {
            LT : 'H:mm',
            LTS : 'LT:ss',
            L : 'D.MM.YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd, D MMMM YYYY LT'
        },
        calendar : {
            sameDay : '[ааЕаНаЕб аВаО] LT',
            nextDay : '[аЃббаЕ аВаО] LT',
            nextWeek : 'dddd [аВаО] LT',
            lastDay : '[абаЕбаА аВаО] LT',
            lastWeek : function () {
                switch (this.day()) {
                case 0:
                case 3:
                case 6:
                    return '[ааО аИаЗаМаИаНаАбаАбаА] dddd [аВаО] LT';
                case 1:
                case 2:
                case 4:
                case 5:
                    return '[ааО аИаЗаМаИаНаАбаИаОб] dddd [аВаО] LT';
                }
            },
            sameElse : 'L'
        },
        relativeTime : {
            future : 'аПаОбаЛаЕ %s',
            past : 'аПбаЕаД %s',
            s : 'аНаЕаКаОаЛаКб баЕаКбаНаДаИ',
            m : 'аМаИаНббаА',
            mm : '%d аМаИаНббаИ',
            h : 'баАб',
            hh : '%d баАбаА',
            d : 'аДаЕаН',
            dd : '%d аДаЕаНаА',
            M : 'аМаЕбаЕб',
            MM : '%d аМаЕбаЕбаИ',
            y : 'аГаОаДаИаНаА',
            yy : '%d аГаОаДаИаНаИ'
        },
        ordinalParse: /\d{1,2}-(аЕаВ|аЕаН|баИ|аВаИ|баИ|аМаИ)/,
        ordinal : function (number) {
            var lastDigit = number % 10,
                last2Digits = number % 100;
            if (number === 0) {
                return number + '-аЕаВ';
            } else if (last2Digits === 0) {
                return number + '-аЕаН';
            } else if (last2Digits > 10 && last2Digits < 20) {
                return number + '-баИ';
            } else if (lastDigit === 1) {
                return number + '-аВаИ';
            } else if (lastDigit === 2) {
                return number + '-баИ';
            } else if (lastDigit === 7 || lastDigit === 8) {
                return number + '-аМаИ';
            } else {
                return number + '-баИ';
            }
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : malayalam (ml)
// author : Floyd Pink : https://github.com/floydpink

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('ml', {
        months : 'рДрДЈрЕрДЕрДАрДП_рДЋрЕрДЌрЕрДАрЕрДЕрДАрДП_рДЎрДОрЕМрДрЕрДрЕ_рДрДЊрЕрДАрДПрЕН_рДЎрЕрДЏрЕ_рДрЕрЕК_рДрЕрДВрЕ_рДрДрДИрЕрДБрЕрДБрЕ_рДИрЕрДЊрЕрДБрЕрДБрДрДЌрЕМ_рДрДрЕрДрЕрДЌрЕМ_рДЈрДЕрДрДЌрЕМ_рДЁрДПрДИрДрДЌрЕМ'.split('_'),
        monthsShort : 'рДрДЈрЕ._рДЋрЕрДЌрЕрДАрЕ._рДЎрДОрЕМ._рДрДЊрЕрДАрДП._рДЎрЕрДЏрЕ_рДрЕрЕК_рДрЕрДВрЕ._рДрД._рДИрЕрДЊрЕрДБрЕрДБ._рДрДрЕрДрЕ._рДЈрДЕрД._рДЁрДПрДИрД.'.split('_'),
        weekdays : 'рДрДОрДЏрДБрДОрДДрЕрД_рДЄрДПрДрЕрДрДГрДОрДДрЕрД_рДрЕрДЕрЕрДЕрДОрДДрЕрД_рДЌрЕрДЇрДЈрДОрДДрЕрД_рДЕрЕрДЏрДОрДДрДОрДДрЕрД_рДЕрЕрДГрЕрДГрДПрДЏрДОрДДрЕрД_рДЖрДЈрДПрДЏрДОрДДрЕрД'.split('_'),
        weekdaysShort : 'рДрДОрДЏрЕМ_рДЄрДПрДрЕрДрЕО_рДрЕрДЕрЕрДЕ_рДЌрЕрДЇрЕЛ_рДЕрЕрДЏрДОрДДрД_рДЕрЕрДГрЕрДГрДП_рДЖрДЈрДП'.split('_'),
        weekdaysMin : 'рДрДО_рДЄрДП_рДрЕ_рДЌрЕ_рДЕрЕрДЏрДО_рДЕрЕ_рДЖ'.split('_'),
        longDateFormat : {
            LT : 'A h:mm -рДЈрЕ',
            LTS : 'A h:mm:ss -рДЈрЕ',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY, LT',
            LLLL : 'dddd, D MMMM YYYY, LT'
        },
        calendar : {
            sameDay : '[рДрДЈрЕрДЈрЕ] LT',
            nextDay : '[рДЈрДОрДГрЕ] LT',
            nextWeek : 'dddd, LT',
            lastDay : '[рДрДЈрЕрДЈрДВрЕ] LT',
            lastWeek : '[рДрДДрДПрДрЕрД] dddd, LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : '%s рДрДДрДПрДрЕрДрЕ',
            past : '%s рДЎрЕрЕЛрДЊрЕ',
            s : 'рДрЕНрДЊ рДЈрДПрДЎрДПрДЗрДрЕрДрЕО',
            m : 'рДрДАрЕ рДЎрДПрДЈрДПрДБрЕрДБрЕ',
            mm : '%d рДЎрДПрДЈрДПрДБрЕрДБрЕ',
            h : 'рДрДАрЕ рДЎрДЃрДПрДрЕрДрЕрЕМ',
            hh : '%d рДЎрДЃрДПрДрЕрДрЕрЕМ',
            d : 'рДрДАрЕ рДІрДПрДЕрДИрД',
            dd : '%d рДІрДПрДЕрДИрД',
            M : 'рДрДАрЕ рДЎрДОрДИрД',
            MM : '%d рДЎрДОрДИрД',
            y : 'рДрДАрЕ рДЕрЕМрДЗрД',
            yy : '%d рДЕрЕМрДЗрД'
        },
        meridiemParse: /рДАрДОрДЄрЕрДАрДП|рДАрДОрДЕрДПрДВрЕ|рДрДрЕрД рДрДДрДПрДрЕрДрЕ|рДЕрЕрДрЕрДЈрЕрДЈрЕрДАрД|рДАрДОрДЄрЕрДАрДП/i,
        isPM : function (input) {
            return /^(рДрДрЕрД рДрДДрДПрДрЕрДрЕ|рДЕрЕрДрЕрДЈрЕрДЈрЕрДАрД|рДАрДОрДЄрЕрДАрДП)$/.test(input);
        },
        meridiem : function (hour, minute, isLower) {
            if (hour < 4) {
                return 'рДАрДОрДЄрЕрДАрДП';
            } else if (hour < 12) {
                return 'рДАрДОрДЕрДПрДВрЕ';
            } else if (hour < 17) {
                return 'рДрДрЕрД рДрДДрДПрДрЕрДрЕ';
            } else if (hour < 20) {
                return 'рДЕрЕрДрЕрДЈрЕрДЈрЕрДАрД';
            } else {
                return 'рДАрДОрДЄрЕрДАрДП';
            }
        }
    });
}));
// moment.js locale configuration
// locale : Marathi (mr)
// author : Harshad Kale : https://github.com/kalehv

(function (factory) {
    factory(moment);
}(function (moment) {
    var symbolMap = {
        '1': 'рЅЇ',
        '2': 'рЅЈ',
        '3': 'рЅЉ',
        '4': 'рЅЊ',
        '5': 'рЅЋ',
        '6': 'рЅЌ',
        '7': 'рЅ­',
        '8': 'рЅЎ',
        '9': 'рЅЏ',
        '0': 'рЅІ'
    },
    numberMap = {
        'рЅЇ': '1',
        'рЅЈ': '2',
        'рЅЉ': '3',
        'рЅЊ': '4',
        'рЅЋ': '5',
        'рЅЌ': '6',
        'рЅ­': '7',
        'рЅЎ': '8',
        'рЅЏ': '9',
        'рЅІ': '0'
    };

    return moment.defineLocale('mr', {
        months : 'рЄрЄОрЄЈрЅрЄЕрЄОрЄАрЅ_рЄЋрЅрЄЌрЅрЄАрЅрЄЕрЄОрЄАрЅ_рЄЎрЄОрЄАрЅрЄ_рЄрЄЊрЅрЄАрЄПрЄВ_рЄЎрЅ_рЄрЅрЄЈ_рЄрЅрЄВрЅ_рЄрЄрЄИрЅрЄ_рЄИрЄЊрЅрЄрЅрЄрЄЌрЄА_рЄрЄрЅрЄрЅрЄЌрЄА_рЄЈрЅрЄЕрЅрЄЙрЅрЄрЄЌрЄА_рЄЁрЄПрЄИрЅрЄрЄЌрЄА'.split('_'),
        monthsShort: 'рЄрЄОрЄЈрЅ._рЄЋрЅрЄЌрЅрЄАрЅ._рЄЎрЄОрЄАрЅрЄ._рЄрЄЊрЅрЄАрЄП._рЄЎрЅ._рЄрЅрЄЈ._рЄрЅрЄВрЅ._рЄрЄ._рЄИрЄЊрЅрЄрЅрЄ._рЄрЄрЅрЄрЅ._рЄЈрЅрЄЕрЅрЄЙрЅрЄ._рЄЁрЄПрЄИрЅрЄ.'.split('_'),
        weekdays : 'рЄАрЄЕрЄПрЄЕрЄОрЄА_рЄИрЅрЄЎрЄЕрЄОрЄА_рЄЎрЄрЄрЄГрЄЕрЄОрЄА_рЄЌрЅрЄЇрЄЕрЄОрЄА_рЄрЅрЄАрЅрЄЕрЄОрЄА_рЄЖрЅрЄрЅрЄАрЄЕрЄОрЄА_рЄЖрЄЈрЄПрЄЕрЄОрЄА'.split('_'),
        weekdaysShort : 'рЄАрЄЕрЄП_рЄИрЅрЄЎ_рЄЎрЄрЄрЄГ_рЄЌрЅрЄЇ_рЄрЅрЄАрЅ_рЄЖрЅрЄрЅрЄА_рЄЖрЄЈрЄП'.split('_'),
        weekdaysMin : 'рЄА_рЄИрЅ_рЄЎрЄ_рЄЌрЅ_рЄрЅ_рЄЖрЅ_рЄЖ'.split('_'),
        longDateFormat : {
            LT : 'A h:mm рЄЕрЄОрЄрЄЄрЄО',
            LTS : 'A h:mm:ss рЄЕрЄОрЄрЄЄрЄО',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY, LT',
            LLLL : 'dddd, D MMMM YYYY, LT'
        },
        calendar : {
            sameDay : '[рЄрЄ] LT',
            nextDay : '[рЄрЄІрЅрЄЏрЄО] LT',
            nextWeek : 'dddd, LT',
            lastDay : '[рЄрЄОрЄВ] LT',
            lastWeek: '[рЄЎрЄОрЄрЅрЄВ] dddd, LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : '%s рЄЈрЄрЄЄрЄА',
            past : '%s рЄЊрЅрЄАрЅрЄЕрЅ',
            s : 'рЄИрЅрЄрЄрЄІ',
            m: 'рЄрЄ рЄЎрЄПрЄЈрЄПрЄ',
            mm: '%d рЄЎрЄПрЄЈрЄПрЄрЅ',
            h : 'рЄрЄ рЄЄрЄОрЄИ',
            hh : '%d рЄЄрЄОрЄИ',
            d : 'рЄрЄ рЄІрЄПрЄЕрЄИ',
            dd : '%d рЄІрЄПрЄЕрЄИ',
            M : 'рЄрЄ рЄЎрЄЙрЄПрЄЈрЄО',
            MM : '%d рЄЎрЄЙрЄПрЄЈрЅ',
            y : 'рЄрЄ рЄЕрЄАрЅрЄЗ',
            yy : '%d рЄЕрЄАрЅрЄЗрЅ'
        },
        preparse: function (string) {
            return string.replace(/[рЅЇрЅЈрЅЉрЅЊрЅЋрЅЌрЅ­рЅЎрЅЏрЅІ]/g, function (match) {
                return numberMap[match];
            });
        },
        postformat: function (string) {
            return string.replace(/\d/g, function (match) {
                return symbolMap[match];
            });
        },
        meridiemParse: /рЄАрЄОрЄЄрЅрЄАрЅ|рЄИрЄрЄОрЄГрЅ|рЄІрЅрЄЊрЄОрЄАрЅ|рЄИрЄОрЄЏрЄрЄрЄОрЄГрЅ/,
        meridiemHour : function (hour, meridiem) {
            if (hour === 12) {
                hour = 0;
            }
            if (meridiem === 'рЄАрЄОрЄЄрЅрЄАрЅ') {
                return hour < 4 ? hour : hour + 12;
            } else if (meridiem === 'рЄИрЄрЄОрЄГрЅ') {
                return hour;
            } else if (meridiem === 'рЄІрЅрЄЊрЄОрЄАрЅ') {
                return hour >= 10 ? hour : hour + 12;
            } else if (meridiem === 'рЄИрЄОрЄЏрЄрЄрЄОрЄГрЅ') {
                return hour + 12;
            }
        },
        meridiem: function (hour, minute, isLower)
        {
            if (hour < 4) {
                return 'рЄАрЄОрЄЄрЅрЄАрЅ';
            } else if (hour < 10) {
                return 'рЄИрЄрЄОрЄГрЅ';
            } else if (hour < 17) {
                return 'рЄІрЅрЄЊрЄОрЄАрЅ';
            } else if (hour < 20) {
                return 'рЄИрЄОрЄЏрЄрЄрЄОрЄГрЅ';
            } else {
                return 'рЄАрЄОрЄЄрЅрЄАрЅ';
            }
        },
        week : {
            dow : 0, // Sunday is the first day of the week.
            doy : 6  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : Bahasa Malaysia (ms-MY)
// author : Weldan Jamili : https://github.com/weldan

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('ms-my', {
        months : 'Januari_Februari_Mac_April_Mei_Jun_Julai_Ogos_September_Oktober_November_Disember'.split('_'),
        monthsShort : 'Jan_Feb_Mac_Apr_Mei_Jun_Jul_Ogs_Sep_Okt_Nov_Dis'.split('_'),
        weekdays : 'Ahad_Isnin_Selasa_Rabu_Khamis_Jumaat_Sabtu'.split('_'),
        weekdaysShort : 'Ahd_Isn_Sel_Rab_Kha_Jum_Sab'.split('_'),
        weekdaysMin : 'Ah_Is_Sl_Rb_Km_Jm_Sb'.split('_'),
        longDateFormat : {
            LT : 'HH.mm',
            LTS : 'LT.ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY [pukul] LT',
            LLLL : 'dddd, D MMMM YYYY [pukul] LT'
        },
        meridiemParse: /pagi|tengahari|petang|malam/,
        meridiemHour: function (hour, meridiem) {
            if (hour === 12) {
                hour = 0;
            }
            if (meridiem === 'pagi') {
                return hour;
            } else if (meridiem === 'tengahari') {
                return hour >= 11 ? hour : hour + 12;
            } else if (meridiem === 'petang' || meridiem === 'malam') {
                return hour + 12;
            }
        },
        meridiem : function (hours, minutes, isLower) {
            if (hours < 11) {
                return 'pagi';
            } else if (hours < 15) {
                return 'tengahari';
            } else if (hours < 19) {
                return 'petang';
            } else {
                return 'malam';
            }
        },
        calendar : {
            sameDay : '[Hari ini pukul] LT',
            nextDay : '[Esok pukul] LT',
            nextWeek : 'dddd [pukul] LT',
            lastDay : '[Kelmarin pukul] LT',
            lastWeek : 'dddd [lepas pukul] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : 'dalam %s',
            past : '%s yang lepas',
            s : 'beberapa saat',
            m : 'seminit',
            mm : '%d minit',
            h : 'sejam',
            hh : '%d jam',
            d : 'sehari',
            dd : '%d hari',
            M : 'sebulan',
            MM : '%d bulan',
            y : 'setahun',
            yy : '%d tahun'
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : Burmese (my)
// author : Squar team, mysquar.com

(function (factory) {
    factory(moment);
}(function (moment) {
    var symbolMap = {
        '1': 'с',
        '2': 'с',
        '3': 'с',
        '4': 'с',
        '5': 'с',
        '6': 'с',
        '7': 'с',
        '8': 'с',
        '9': 'с',
        '0': 'с'
    }, numberMap = {
        'с': '1',
        'с': '2',
        'с': '3',
        'с': '4',
        'с': '5',
        'с': '6',
        'с': '7',
        'с': '8',
        'с': '9',
        'с': '0'
    };
    return moment.defineLocale('my', {
        months: 'сссКсссЋссЎ_ссБссБсЌсКссЋссЎ_сссК_сЇссМсЎ_ссБ_ссНссК_ссАсс­сЏссК_ссМссЏссК_сссКсссКссЌ_сЁсБсЌссКсс­сЏссЌ_сс­сЏсссКссЌ_ссЎсссКссЌ'.split('_'),
        monthsShort: 'сссК_ссБ_сссК_ссМсЎ_ссБ_ссНссК_сс­сЏссК_ссМ_сссК_сЁсБсЌссК_сс­сЏ_ссЎ'.split('_'),
        weekdays: 'ссссКсЙсссНсБ_ссссКсЙссЌ_сЁссКсЙссЋ_ссЏссЙсссАсИ_ссМсЌссссБсИ_ссБсЌссМсЌ_сссБ'.split('_'),
        weekdaysShort: 'ссНсБ_ссЌ_ссКсЙссЋ_ссАсИ_ссМсЌ_ссБсЌ_ссБ'.split('_'),
        weekdaysMin: 'ссНсБ_ссЌ_ссКсЙссЋ_ссАсИ_ссМсЌ_ссБсЌ_ссБ'.split('_'),
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY LT',
            LLLL: 'dddd D MMMM YYYY LT'
        },
        calendar: {
            sameDay: '[сссБ.] LT [ссОсЌ]',
            nextDay: '[ссссКссМссК] LT [ссОсЌ]',
            nextWeek: 'dddd LT [ссОсЌ]',
            lastDay: '[сссБ.с] LT [ссОсЌ]',
            lastWeek: '[ссМсЎсИссВсЗссБсЌ] dddd LT [ссОсЌ]',
            sameElse: 'L'
        },
        relativeTime: {
            future: 'ссЌсссКсЗ %s ссОсЌ',
            past: 'ссНссКссВсЗссБсЌ %s с',
            s: 'сссЙсссК.сЁсссКсИсссК',
            m: 'сссКсс­сссК',
            mm: '%d сс­сссК',
            h: 'сссКссЌссЎ',
            hh: '%d ссЌссЎ',
            d: 'сссКсссК',
            dd: '%d сссК',
            M: 'сссКс',
            MM: '%d с',
            y: 'сссКссОссК',
            yy: '%d ссОссК'
        },
        preparse: function (string) {
            return string.replace(/[сссссссссс]/g, function (match) {
                return numberMap[match];
            });
        },
        postformat: function (string) {
            return string.replace(/\d/g, function (match) {
                return symbolMap[match];
            });
        },
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4 // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : norwegian bokmУЅl (nb)
// authors : Espen Hovlandsdal : https://github.com/rexxars
//           Sigurd Gartmann : https://github.com/sigurdga

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('nb', {
        months : 'januar_februar_mars_april_mai_juni_juli_august_september_oktober_november_desember'.split('_'),
        monthsShort : 'jan_feb_mar_apr_mai_jun_jul_aug_sep_okt_nov_des'.split('_'),
        weekdays : 'sУИndag_mandag_tirsdag_onsdag_torsdag_fredag_lУИrdag'.split('_'),
        weekdaysShort : 'sУИn_man_tirs_ons_tors_fre_lУИr'.split('_'),
        weekdaysMin : 'sУИ_ma_ti_on_to_fr_lУИ'.split('_'),
        longDateFormat : {
            LT : 'H.mm',
            LTS : 'LT.ss',
            L : 'DD.MM.YYYY',
            LL : 'D. MMMM YYYY',
            LLL : 'D. MMMM YYYY [kl.] LT',
            LLLL : 'dddd D. MMMM YYYY [kl.] LT'
        },
        calendar : {
            sameDay: '[i dag kl.] LT',
            nextDay: '[i morgen kl.] LT',
            nextWeek: 'dddd [kl.] LT',
            lastDay: '[i gУЅr kl.] LT',
            lastWeek: '[forrige] dddd [kl.] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : 'om %s',
            past : 'for %s siden',
            s : 'noen sekunder',
            m : 'ett minutt',
            mm : '%d minutter',
            h : 'en time',
            hh : '%d timer',
            d : 'en dag',
            dd : '%d dager',
            M : 'en mУЅned',
            MM : '%d mУЅneder',
            y : 'ett УЅr',
            yy : '%d УЅr'
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : nepali/nepalese
// author : suvash : https://github.com/suvash

(function (factory) {
    factory(moment);
}(function (moment) {
    var symbolMap = {
        '1': 'рЅЇ',
        '2': 'рЅЈ',
        '3': 'рЅЉ',
        '4': 'рЅЊ',
        '5': 'рЅЋ',
        '6': 'рЅЌ',
        '7': 'рЅ­',
        '8': 'рЅЎ',
        '9': 'рЅЏ',
        '0': 'рЅІ'
    },
    numberMap = {
        'рЅЇ': '1',
        'рЅЈ': '2',
        'рЅЉ': '3',
        'рЅЊ': '4',
        'рЅЋ': '5',
        'рЅЌ': '6',
        'рЅ­': '7',
        'рЅЎ': '8',
        'рЅЏ': '9',
        'рЅІ': '0'
    };

    return moment.defineLocale('ne', {
        months : 'рЄрЄЈрЄЕрЄАрЅ_рЄЋрЅрЄЌрЅрЄАрЅрЄЕрЄАрЅ_рЄЎрЄОрЄАрЅрЄ_рЄрЄЊрЅрЄАрЄПрЄВ_рЄЎрЄ_рЄрЅрЄЈ_рЄрЅрЄВрЄОрЄ_рЄрЄрЄЗрЅрЄ_рЄИрЅрЄЊрЅрЄрЅрЄЎрЅрЄЌрЄА_рЄрЄрЅрЄрЅрЄЌрЄА_рЄЈрЅрЄ­рЅрЄЎрЅрЄЌрЄА_рЄЁрЄПрЄИрЅрЄЎрЅрЄЌрЄА'.split('_'),
        monthsShort : 'рЄрЄЈ._рЄЋрЅрЄЌрЅрЄАрЅ._рЄЎрЄОрЄАрЅрЄ_рЄрЄЊрЅрЄАрЄП._рЄЎрЄ_рЄрЅрЄЈ_рЄрЅрЄВрЄОрЄ._рЄрЄ._рЄИрЅрЄЊрЅрЄ._рЄрЄрЅрЄрЅ._рЄЈрЅрЄ­рЅ._рЄЁрЄПрЄИрЅ.'.split('_'),
        weekdays : 'рЄрЄрЄЄрЄЌрЄОрЄА_рЄИрЅрЄЎрЄЌрЄОрЄА_рЄЎрЄрЅрЄрЄВрЄЌрЄОрЄА_рЄЌрЅрЄЇрЄЌрЄОрЄА_рЄЌрЄПрЄЙрЄПрЄЌрЄОрЄА_рЄЖрЅрЄрЅрЄАрЄЌрЄОрЄА_рЄЖрЄЈрЄПрЄЌрЄОрЄА'.split('_'),
        weekdaysShort : 'рЄрЄрЄЄ._рЄИрЅрЄЎ._рЄЎрЄрЅрЄрЄВ._рЄЌрЅрЄЇ._рЄЌрЄПрЄЙрЄП._рЄЖрЅрЄрЅрЄА._рЄЖрЄЈрЄП.'.split('_'),
        weekdaysMin : 'рЄрЄ._рЄИрЅ._рЄЎрЄрЅ_рЄЌрЅ._рЄЌрЄП._рЄЖрЅ._рЄЖ.'.split('_'),
        longDateFormat : {
            LT : 'AрЄрЅ h:mm рЄЌрЄрЅ',
            LTS : 'AрЄрЅ h:mm:ss рЄЌрЄрЅ',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY, LT',
            LLLL : 'dddd, D MMMM YYYY, LT'
        },
        preparse: function (string) {
            return string.replace(/[рЅЇрЅЈрЅЉрЅЊрЅЋрЅЌрЅ­рЅЎрЅЏрЅІ]/g, function (match) {
                return numberMap[match];
            });
        },
        postformat: function (string) {
            return string.replace(/\d/g, function (match) {
                return symbolMap[match];
            });
        },
        meridiemParse: /рЄАрЄОрЄЄрЅ|рЄЌрЄПрЄЙрЄОрЄЈ|рЄІрЄПрЄрЄрЄИрЅ|рЄЌрЅрЄВрЅрЄрЄО|рЄИрЄОрЄрЄ|рЄАрЄОрЄЄрЅ/,
        meridiemHour : function (hour, meridiem) {
            if (hour === 12) {
                hour = 0;
            }
            if (meridiem === 'рЄАрЄОрЄЄрЅ') {
                return hour < 3 ? hour : hour + 12;
            } else if (meridiem === 'рЄЌрЄПрЄЙрЄОрЄЈ') {
                return hour;
            } else if (meridiem === 'рЄІрЄПрЄрЄрЄИрЅ') {
                return hour >= 10 ? hour : hour + 12;
            } else if (meridiem === 'рЄЌрЅрЄВрЅрЄрЄО' || meridiem === 'рЄИрЄОрЄрЄ') {
                return hour + 12;
            }
        },
        meridiem : function (hour, minute, isLower) {
            if (hour < 3) {
                return 'рЄАрЄОрЄЄрЅ';
            } else if (hour < 10) {
                return 'рЄЌрЄПрЄЙрЄОрЄЈ';
            } else if (hour < 15) {
                return 'рЄІрЄПрЄрЄрЄИрЅ';
            } else if (hour < 18) {
                return 'рЄЌрЅрЄВрЅрЄрЄО';
            } else if (hour < 20) {
                return 'рЄИрЄОрЄрЄ';
            } else {
                return 'рЄАрЄОрЄЄрЅ';
            }
        },
        calendar : {
            sameDay : '[рЄрЄ] LT',
            nextDay : '[рЄ­рЅрЄВрЅ] LT',
            nextWeek : '[рЄрЄрЄрЄІрЅ] dddd[,] LT',
            lastDay : '[рЄЙрЄПрЄрЅ] LT',
            lastWeek : '[рЄрЄрЄрЅ] dddd[,] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : '%sрЄЎрЄО',
            past : '%s рЄрЄрЄОрЄЁрЅ',
            s : 'рЄрЅрЄЙрЅ рЄИрЄЎрЄЏ',
            m : 'рЄрЄ рЄЎрЄПрЄЈрЅрЄ',
            mm : '%d рЄЎрЄПрЄЈрЅрЄ',
            h : 'рЄрЄ рЄрЄЃрЅрЄрЄО',
            hh : '%d рЄрЄЃрЅрЄрЄО',
            d : 'рЄрЄ рЄІрЄПрЄЈ',
            dd : '%d рЄІрЄПрЄЈ',
            M : 'рЄрЄ рЄЎрЄЙрЄПрЄЈрЄО',
            MM : '%d рЄЎрЄЙрЄПрЄЈрЄО',
            y : 'рЄрЄ рЄЌрЄАрЅрЄЗ',
            yy : '%d рЄЌрЄАрЅрЄЗ'
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : dutch (nl)
// author : Joris RУЖling : https://github.com/jjupiter

(function (factory) {
    factory(moment);
}(function (moment) {
    var monthsShortWithDots = 'jan._feb._mrt._apr._mei_jun._jul._aug._sep._okt._nov._dec.'.split('_'),
        monthsShortWithoutDots = 'jan_feb_mrt_apr_mei_jun_jul_aug_sep_okt_nov_dec'.split('_');

    return moment.defineLocale('nl', {
        months : 'januari_februari_maart_april_mei_juni_juli_augustus_september_oktober_november_december'.split('_'),
        monthsShort : function (m, format) {
            if (/-MMM-/.test(format)) {
                return monthsShortWithoutDots[m.month()];
            } else {
                return monthsShortWithDots[m.month()];
            }
        },
        weekdays : 'zondag_maandag_dinsdag_woensdag_donderdag_vrijdag_zaterdag'.split('_'),
        weekdaysShort : 'zo._ma._di._wo._do._vr._za.'.split('_'),
        weekdaysMin : 'Zo_Ma_Di_Wo_Do_Vr_Za'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD-MM-YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd D MMMM YYYY LT'
        },
        calendar : {
            sameDay: '[vandaag om] LT',
            nextDay: '[morgen om] LT',
            nextWeek: 'dddd [om] LT',
            lastDay: '[gisteren om] LT',
            lastWeek: '[afgelopen] dddd [om] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : 'over %s',
            past : '%s geleden',
            s : 'een paar seconden',
            m : 'УЉУЉn minuut',
            mm : '%d minuten',
            h : 'УЉУЉn uur',
            hh : '%d uur',
            d : 'УЉУЉn dag',
            dd : '%d dagen',
            M : 'УЉУЉn maand',
            MM : '%d maanden',
            y : 'УЉУЉn jaar',
            yy : '%d jaar'
        },
        ordinalParse: /\d{1,2}(ste|de)/,
        ordinal : function (number) {
            return number + ((number === 1 || number === 8 || number >= 20) ? 'ste' : 'de');
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : norwegian nynorsk (nn)
// author : https://github.com/mechuwind

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('nn', {
        months : 'januar_februar_mars_april_mai_juni_juli_august_september_oktober_november_desember'.split('_'),
        monthsShort : 'jan_feb_mar_apr_mai_jun_jul_aug_sep_okt_nov_des'.split('_'),
        weekdays : 'sundag_mУЅndag_tysdag_onsdag_torsdag_fredag_laurdag'.split('_'),
        weekdaysShort : 'sun_mУЅn_tys_ons_tor_fre_lau'.split('_'),
        weekdaysMin : 'su_mУЅ_ty_on_to_fr_lУИ'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD.MM.YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd D MMMM YYYY LT'
        },
        calendar : {
            sameDay: '[I dag klokka] LT',
            nextDay: '[I morgon klokka] LT',
            nextWeek: 'dddd [klokka] LT',
            lastDay: '[I gУЅr klokka] LT',
            lastWeek: '[FУИregУЅande] dddd [klokka] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : 'om %s',
            past : 'for %s sidan',
            s : 'nokre sekund',
            m : 'eit minutt',
            mm : '%d minutt',
            h : 'ein time',
            hh : '%d timar',
            d : 'ein dag',
            dd : '%d dagar',
            M : 'ein mУЅnad',
            MM : '%d mУЅnader',
            y : 'eit УЅr',
            yy : '%d УЅr'
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : polish (pl)
// author : Rafal Hirsz : https://github.com/evoL

(function (factory) {
    factory(moment);
}(function (moment) {
    var monthsNominative = 'styczeХ_luty_marzec_kwiecieХ_maj_czerwiec_lipiec_sierpieХ_wrzesieХ_paХКdziernik_listopad_grudzieХ'.split('_'),
        monthsSubjective = 'stycznia_lutego_marca_kwietnia_maja_czerwca_lipca_sierpnia_wrzeХnia_paХКdziernika_listopada_grudnia'.split('_');

    function plural(n) {
        return (n % 10 < 5) && (n % 10 > 1) && ((~~(n / 10) % 10) !== 1);
    }

    function translate(number, withoutSuffix, key) {
        var result = number + ' ';
        switch (key) {
        case 'm':
            return withoutSuffix ? 'minuta' : 'minutФ';
        case 'mm':
            return result + (plural(number) ? 'minuty' : 'minut');
        case 'h':
            return withoutSuffix  ? 'godzina'  : 'godzinФ';
        case 'hh':
            return result + (plural(number) ? 'godziny' : 'godzin');
        case 'MM':
            return result + (plural(number) ? 'miesiФce' : 'miesiФcy');
        case 'yy':
            return result + (plural(number) ? 'lata' : 'lat');
        }
    }

    return moment.defineLocale('pl', {
        months : function (momentToFormat, format) {
            if (/D MMMM/.test(format)) {
                return monthsSubjective[momentToFormat.month()];
            } else {
                return monthsNominative[momentToFormat.month()];
            }
        },
        monthsShort : 'sty_lut_mar_kwi_maj_cze_lip_sie_wrz_paХК_lis_gru'.split('_'),
        weekdays : 'niedziela_poniedziaХek_wtorek_Хroda_czwartek_piФtek_sobota'.split('_'),
        weekdaysShort : 'nie_pon_wt_Хr_czw_pt_sb'.split('_'),
        weekdaysMin : 'N_Pn_Wt_Хr_Cz_Pt_So'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD.MM.YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd, D MMMM YYYY LT'
        },
        calendar : {
            sameDay: '[DziХ o] LT',
            nextDay: '[Jutro o] LT',
            nextWeek: '[W] dddd [o] LT',
            lastDay: '[Wczoraj o] LT',
            lastWeek: function () {
                switch (this.day()) {
                case 0:
                    return '[W zeszХФ niedzielФ o] LT';
                case 3:
                    return '[W zeszХФ ХrodФ o] LT';
                case 6:
                    return '[W zeszХФ sobotФ o] LT';
                default:
                    return '[W zeszХy] dddd [o] LT';
                }
            },
            sameElse: 'L'
        },
        relativeTime : {
            future : 'za %s',
            past : '%s temu',
            s : 'kilka sekund',
            m : translate,
            mm : translate,
            h : translate,
            hh : translate,
            d : '1 dzieХ',
            dd : '%d dni',
            M : 'miesiФc',
            MM : translate,
            y : 'rok',
            yy : translate
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : brazilian portuguese (pt-br)
// author : Caio Ribeiro Pereira : https://github.com/caio-ribeiro-pereira

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('pt-br', {
        months : 'janeiro_fevereiro_marУЇo_abril_maio_junho_julho_agosto_setembro_outubro_novembro_dezembro'.split('_'),
        monthsShort : 'jan_fev_mar_abr_mai_jun_jul_ago_set_out_nov_dez'.split('_'),
        weekdays : 'domingo_segunda-feira_terУЇa-feira_quarta-feira_quinta-feira_sexta-feira_sУЁbado'.split('_'),
        weekdaysShort : 'dom_seg_ter_qua_qui_sex_sУЁb'.split('_'),
        weekdaysMin : 'dom_2ТЊ_3ТЊ_4ТЊ_5ТЊ_6ТЊ_sУЁb'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D [de] MMMM [de] YYYY',
            LLL : 'D [de] MMMM [de] YYYY [У s] LT',
            LLLL : 'dddd, D [de] MMMM [de] YYYY [У s] LT'
        },
        calendar : {
            sameDay: '[Hoje У s] LT',
            nextDay: '[AmanhУЃ У s] LT',
            nextWeek: 'dddd [У s] LT',
            lastDay: '[Ontem У s] LT',
            lastWeek: function () {
                return (this.day() === 0 || this.day() === 6) ?
                    '[Уltimo] dddd [У s] LT' : // Saturday + Sunday
                    '[Уltima] dddd [У s] LT'; // Monday - Friday
            },
            sameElse: 'L'
        },
        relativeTime : {
            future : 'em %s',
            past : '%s atrУЁs',
            s : 'segundos',
            m : 'um minuto',
            mm : '%d minutos',
            h : 'uma hora',
            hh : '%d horas',
            d : 'um dia',
            dd : '%d dias',
            M : 'um mУЊs',
            MM : '%d meses',
            y : 'um ano',
            yy : '%d anos'
        },
        ordinalParse: /\d{1,2}ТК/,
        ordinal : '%dТК'
    });
}));
// moment.js locale configuration
// locale : portuguese (pt)
// author : Jefferson : https://github.com/jalex79

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('pt', {
        months : 'janeiro_fevereiro_marУЇo_abril_maio_junho_julho_agosto_setembro_outubro_novembro_dezembro'.split('_'),
        monthsShort : 'jan_fev_mar_abr_mai_jun_jul_ago_set_out_nov_dez'.split('_'),
        weekdays : 'domingo_segunda-feira_terУЇa-feira_quarta-feira_quinta-feira_sexta-feira_sУЁbado'.split('_'),
        weekdaysShort : 'dom_seg_ter_qua_qui_sex_sУЁb'.split('_'),
        weekdaysMin : 'dom_2ТЊ_3ТЊ_4ТЊ_5ТЊ_6ТЊ_sУЁb'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D [de] MMMM [de] YYYY',
            LLL : 'D [de] MMMM [de] YYYY LT',
            LLLL : 'dddd, D [de] MMMM [de] YYYY LT'
        },
        calendar : {
            sameDay: '[Hoje У s] LT',
            nextDay: '[AmanhУЃ У s] LT',
            nextWeek: 'dddd [У s] LT',
            lastDay: '[Ontem У s] LT',
            lastWeek: function () {
                return (this.day() === 0 || this.day() === 6) ?
                    '[Уltimo] dddd [У s] LT' : // Saturday + Sunday
                    '[Уltima] dddd [У s] LT'; // Monday - Friday
            },
            sameElse: 'L'
        },
        relativeTime : {
            future : 'em %s',
            past : 'hУЁ %s',
            s : 'segundos',
            m : 'um minuto',
            mm : '%d minutos',
            h : 'uma hora',
            hh : '%d horas',
            d : 'um dia',
            dd : '%d dias',
            M : 'um mУЊs',
            MM : '%d meses',
            y : 'um ano',
            yy : '%d anos'
        },
        ordinalParse: /\d{1,2}ТК/,
        ordinal : '%dТК',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : romanian (ro)
// author : Vlad Gurdiga : https://github.com/gurdiga
// author : Valentin Agachi : https://github.com/avaly

(function (factory) {
    factory(moment);
}(function (moment) {
    function relativeTimeWithPlural(number, withoutSuffix, key) {
        var format = {
                'mm': 'minute',
                'hh': 'ore',
                'dd': 'zile',
                'MM': 'luni',
                'yy': 'ani'
            },
            separator = ' ';
        if (number % 100 >= 20 || (number >= 100 && number % 100 === 0)) {
            separator = ' de ';
        }

        return number + separator + format[key];
    }

    return moment.defineLocale('ro', {
        months : 'ianuarie_februarie_martie_aprilie_mai_iunie_iulie_august_septembrie_octombrie_noiembrie_decembrie'.split('_'),
        monthsShort : 'ian._febr._mart._apr._mai_iun._iul._aug._sept._oct._nov._dec.'.split('_'),
        weekdays : 'duminicФ_luni_marШi_miercuri_joi_vineri_sУЂmbФtФ'.split('_'),
        weekdaysShort : 'Dum_Lun_Mar_Mie_Joi_Vin_SУЂm'.split('_'),
        weekdaysMin : 'Du_Lu_Ma_Mi_Jo_Vi_SУЂ'.split('_'),
        longDateFormat : {
            LT : 'H:mm',
            LTS : 'LT:ss',
            L : 'DD.MM.YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY H:mm',
            LLLL : 'dddd, D MMMM YYYY H:mm'
        },
        calendar : {
            sameDay: '[azi la] LT',
            nextDay: '[mУЂine la] LT',
            nextWeek: 'dddd [la] LT',
            lastDay: '[ieri la] LT',
            lastWeek: '[fosta] dddd [la] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : 'peste %s',
            past : '%s УЎn urmФ',
            s : 'cУЂteva secunde',
            m : 'un minut',
            mm : relativeTimeWithPlural,
            h : 'o orФ',
            hh : relativeTimeWithPlural,
            d : 'o zi',
            dd : relativeTimeWithPlural,
            M : 'o lunФ',
            MM : relativeTimeWithPlural,
            y : 'un an',
            yy : relativeTimeWithPlural
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : russian (ru)
// author : Viktorminator : https://github.com/Viktorminator
// Author : Menelion ElensУКle : https://github.com/Oire

(function (factory) {
    factory(moment);
}(function (moment) {
    function plural(word, num) {
        var forms = word.split('_');
        return num % 10 === 1 && num % 100 !== 11 ? forms[0] : (num % 10 >= 2 && num % 10 <= 4 && (num % 100 < 10 || num % 100 >= 20) ? forms[1] : forms[2]);
    }

    function relativeTimeWithPlural(number, withoutSuffix, key) {
        var format = {
            'mm': withoutSuffix ? 'аМаИаНббаА_аМаИаНббб_аМаИаНбб' : 'аМаИаНббб_аМаИаНббб_аМаИаНбб',
            'hh': 'баАб_баАбаА_баАбаОаВ',
            'dd': 'аДаЕаНб_аДаНб_аДаНаЕаЙ',
            'MM': 'аМаЕббб_аМаЕбббаА_аМаЕбббаЕаВ',
            'yy': 'аГаОаД_аГаОаДаА_аЛаЕб'
        };
        if (key === 'm') {
            return withoutSuffix ? 'аМаИаНббаА' : 'аМаИаНббб';
        }
        else {
            return number + ' ' + plural(format[key], +number);
        }
    }

    function monthsCaseReplace(m, format) {
        var months = {
            'nominative': 'баНаВаАбб_баЕаВбаАаЛб_аМаАбб_аАаПбаЕаЛб_аМаАаЙ_аИбаНб_аИбаЛб_аАаВаГббб_баЕаНббаБбб_аОаКббаБбб_аНаОбаБбб_аДаЕаКаАаБбб'.split('_'),
            'accusative': 'баНаВаАбб_баЕаВбаАаЛб_аМаАббаА_аАаПбаЕаЛб_аМаАб_аИбаНб_аИбаЛб_аАаВаГбббаА_баЕаНббаБбб_аОаКббаБбб_аНаОбаБбб_аДаЕаКаАаБбб'.split('_')
        },

        nounCase = (/D[oD]?(\[[^\[\]]*\]|\s+)+MMMM?/).test(format) ?
            'accusative' :
            'nominative';

        return months[nounCase][m.month()];
    }

    function monthsShortCaseReplace(m, format) {
        var monthsShort = {
            'nominative': 'баНаВ_баЕаВ_аМаАбб_аАаПб_аМаАаЙ_аИбаНб_аИбаЛб_аАаВаГ_баЕаН_аОаКб_аНаОб_аДаЕаК'.split('_'),
            'accusative': 'баНаВ_баЕаВ_аМаАб_аАаПб_аМаАб_аИбаНб_аИбаЛб_аАаВаГ_баЕаН_аОаКб_аНаОб_аДаЕаК'.split('_')
        },

        nounCase = (/D[oD]?(\[[^\[\]]*\]|\s+)+MMMM?/).test(format) ?
            'accusative' :
            'nominative';

        return monthsShort[nounCase][m.month()];
    }

    function weekdaysCaseReplace(m, format) {
        var weekdays = {
            'nominative': 'аВаОбаКбаЕбаЕаНбаЕ_аПаОаНаЕаДаЕаЛбаНаИаК_аВбаОбаНаИаК_ббаЕаДаА_баЕбаВаЕбаГ_аПббаНаИбаА_ббаБаБаОбаА'.split('_'),
            'accusative': 'аВаОбаКбаЕбаЕаНбаЕ_аПаОаНаЕаДаЕаЛбаНаИаК_аВбаОбаНаИаК_ббаЕаДб_баЕбаВаЕбаГ_аПббаНаИбб_ббаБаБаОбб'.split('_')
        },

        nounCase = (/\[ ?[ааВ] ?(?:аПбаОбаЛбб|баЛаЕаДббббб|ббб)? ?\] ?dddd/).test(format) ?
            'accusative' :
            'nominative';

        return weekdays[nounCase][m.day()];
    }

    return moment.defineLocale('ru', {
        months : monthsCaseReplace,
        monthsShort : monthsShortCaseReplace,
        weekdays : weekdaysCaseReplace,
        weekdaysShort : 'аВб_аПаН_аВб_бб_бб_аПб_баБ'.split('_'),
        weekdaysMin : 'аВб_аПаН_аВб_бб_бб_аПб_баБ'.split('_'),
        monthsParse : [/^баНаВ/i, /^баЕаВ/i, /^аМаАб/i, /^аАаПб/i, /^аМаА[аЙ|б]/i, /^аИбаН/i, /^аИбаЛ/i, /^аАаВаГ/i, /^баЕаН/i, /^аОаКб/i, /^аНаОб/i, /^аДаЕаК/i],
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD.MM.YYYY',
            LL : 'D MMMM YYYY аГ.',
            LLL : 'D MMMM YYYY аГ., LT',
            LLLL : 'dddd, D MMMM YYYY аГ., LT'
        },
        calendar : {
            sameDay: '[аЁаЕаГаОаДаНб аВ] LT',
            nextDay: '[ааАаВббаА аВ] LT',
            lastDay: '[абаЕбаА аВ] LT',
            nextWeek: function () {
                return this.day() === 2 ? '[ааО] dddd [аВ] LT' : '[а] dddd [аВ] LT';
            },
            lastWeek: function (now) {
                if (now.week() !== this.week()) {
                    switch (this.day()) {
                    case 0:
                        return '[а аПбаОбаЛаОаЕ] dddd [аВ] LT';
                    case 1:
                    case 2:
                    case 4:
                        return '[а аПбаОбаЛбаЙ] dddd [аВ] LT';
                    case 3:
                    case 5:
                    case 6:
                        return '[а аПбаОбаЛбб] dddd [аВ] LT';
                    }
                } else {
                    if (this.day() === 2) {
                        return '[ааО] dddd [аВ] LT';
                    } else {
                        return '[а] dddd [аВ] LT';
                    }
                }
            },
            sameElse: 'L'
        },
        relativeTime : {
            future : 'баЕбаЕаЗ %s',
            past : '%s аНаАаЗаАаД',
            s : 'аНаЕбаКаОаЛбаКаО баЕаКбаНаД',
            m : relativeTimeWithPlural,
            mm : relativeTimeWithPlural,
            h : 'баАб',
            hh : relativeTimeWithPlural,
            d : 'аДаЕаНб',
            dd : relativeTimeWithPlural,
            M : 'аМаЕббб',
            MM : relativeTimeWithPlural,
            y : 'аГаОаД',
            yy : relativeTimeWithPlural
        },

        meridiemParse: /аНаОбаИ|бббаА|аДаНб|аВаЕбаЕбаА/i,
        isPM : function (input) {
            return /^(аДаНб|аВаЕбаЕбаА)$/.test(input);
        },

        meridiem : function (hour, minute, isLower) {
            if (hour < 4) {
                return 'аНаОбаИ';
            } else if (hour < 12) {
                return 'бббаА';
            } else if (hour < 17) {
                return 'аДаНб';
            } else {
                return 'аВаЕбаЕбаА';
            }
        },

        ordinalParse: /\d{1,2}-(аЙ|аГаО|б)/,
        ordinal: function (number, period) {
            switch (period) {
            case 'M':
            case 'd':
            case 'DDD':
                return number + '-аЙ';
            case 'D':
                return number + '-аГаО';
            case 'w':
            case 'W':
                return number + '-б';
            default:
                return number;
            }
        },

        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : slovak (sk)
// author : Martin Minka : https://github.com/k2s
// based on work of petrbela : https://github.com/petrbela

(function (factory) {
    factory(moment);
}(function (moment) {
    var months = 'januУЁr_februУЁr_marec_aprУ­l_mУЁj_jУКn_jУКl_august_september_oktУГber_november_december'.split('_'),
        monthsShort = 'jan_feb_mar_apr_mУЁj_jУКn_jУКl_aug_sep_okt_nov_dec'.split('_');

    function plural(n) {
        return (n > 1) && (n < 5);
    }

    function translate(number, withoutSuffix, key, isFuture) {
        var result = number + ' ';
        switch (key) {
        case 's':  // a few seconds / in a few seconds / a few seconds ago
            return (withoutSuffix || isFuture) ? 'pУЁr sekУКnd' : 'pУЁr sekundami';
        case 'm':  // a minute / in a minute / a minute ago
            return withoutSuffix ? 'minУКta' : (isFuture ? 'minУКtu' : 'minУКtou');
        case 'mm': // 9 minutes / in 9 minutes / 9 minutes ago
            if (withoutSuffix || isFuture) {
                return result + (plural(number) ? 'minУКty' : 'minУКt');
            } else {
                return result + 'minУКtami';
            }
            break;
        case 'h':  // an hour / in an hour / an hour ago
            return withoutSuffix ? 'hodina' : (isFuture ? 'hodinu' : 'hodinou');
        case 'hh': // 9 hours / in 9 hours / 9 hours ago
            if (withoutSuffix || isFuture) {
                return result + (plural(number) ? 'hodiny' : 'hodУ­n');
            } else {
                return result + 'hodinami';
            }
            break;
        case 'd':  // a day / in a day / a day ago
            return (withoutSuffix || isFuture) ? 'deХ' : 'dХom';
        case 'dd': // 9 days / in 9 days / 9 days ago
            if (withoutSuffix || isFuture) {
                return result + (plural(number) ? 'dni' : 'dnУ­');
            } else {
                return result + 'dХami';
            }
            break;
        case 'M':  // a month / in a month / a month ago
            return (withoutSuffix || isFuture) ? 'mesiac' : 'mesiacom';
        case 'MM': // 9 months / in 9 months / 9 months ago
            if (withoutSuffix || isFuture) {
                return result + (plural(number) ? 'mesiace' : 'mesiacov');
            } else {
                return result + 'mesiacmi';
            }
            break;
        case 'y':  // a year / in a year / a year ago
            return (withoutSuffix || isFuture) ? 'rok' : 'rokom';
        case 'yy': // 9 years / in 9 years / 9 years ago
            if (withoutSuffix || isFuture) {
                return result + (plural(number) ? 'roky' : 'rokov');
            } else {
                return result + 'rokmi';
            }
            break;
        }
    }

    return moment.defineLocale('sk', {
        months : months,
        monthsShort : monthsShort,
        monthsParse : (function (months, monthsShort) {
            var i, _monthsParse = [];
            for (i = 0; i < 12; i++) {
                // use custom parser to solve problem with July (Фervenec)
                _monthsParse[i] = new RegExp('^' + months[i] + '$|^' + monthsShort[i] + '$', 'i');
            }
            return _monthsParse;
        }(months, monthsShort)),
        weekdays : 'nedeФОa_pondelok_utorok_streda_ХЁtvrtok_piatok_sobota'.split('_'),
        weekdaysShort : 'ne_po_ut_st_ХЁt_pi_so'.split('_'),
        weekdaysMin : 'ne_po_ut_st_ХЁt_pi_so'.split('_'),
        longDateFormat : {
            LT: 'H:mm',
            LTS : 'LT:ss',
            L : 'DD.MM.YYYY',
            LL : 'D. MMMM YYYY',
            LLL : 'D. MMMM YYYY LT',
            LLLL : 'dddd D. MMMM YYYY LT'
        },
        calendar : {
            sameDay: '[dnes o] LT',
            nextDay: '[zajtra o] LT',
            nextWeek: function () {
                switch (this.day()) {
                case 0:
                    return '[v nedeФОu o] LT';
                case 1:
                case 2:
                    return '[v] dddd [o] LT';
                case 3:
                    return '[v stredu o] LT';
                case 4:
                    return '[vo ХЁtvrtok o] LT';
                case 5:
                    return '[v piatok o] LT';
                case 6:
                    return '[v sobotu o] LT';
                }
            },
            lastDay: '[vФera o] LT',
            lastWeek: function () {
                switch (this.day()) {
                case 0:
                    return '[minulУК nedeФОu o] LT';
                case 1:
                case 2:
                    return '[minulУН] dddd [o] LT';
                case 3:
                    return '[minulУК stredu o] LT';
                case 4:
                case 5:
                    return '[minulУН] dddd [o] LT';
                case 6:
                    return '[minulУК sobotu o] LT';
                }
            },
            sameElse: 'L'
        },
        relativeTime : {
            future : 'za %s',
            past : 'pred %s',
            s : translate,
            m : translate,
            mm : translate,
            h : translate,
            hh : translate,
            d : translate,
            dd : translate,
            M : translate,
            MM : translate,
            y : translate,
            yy : translate
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : slovenian (sl)
// author : Robert SedovХЁek : https://github.com/sedovsek

(function (factory) {
    factory(moment);
}(function (moment) {
    function translate(number, withoutSuffix, key) {
        var result = number + ' ';
        switch (key) {
        case 'm':
            return withoutSuffix ? 'ena minuta' : 'eno minuto';
        case 'mm':
            if (number === 1) {
                result += 'minuta';
            } else if (number === 2) {
                result += 'minuti';
            } else if (number === 3 || number === 4) {
                result += 'minute';
            } else {
                result += 'minut';
            }
            return result;
        case 'h':
            return withoutSuffix ? 'ena ura' : 'eno uro';
        case 'hh':
            if (number === 1) {
                result += 'ura';
            } else if (number === 2) {
                result += 'uri';
            } else if (number === 3 || number === 4) {
                result += 'ure';
            } else {
                result += 'ur';
            }
            return result;
        case 'dd':
            if (number === 1) {
                result += 'dan';
            } else {
                result += 'dni';
            }
            return result;
        case 'MM':
            if (number === 1) {
                result += 'mesec';
            } else if (number === 2) {
                result += 'meseca';
            } else if (number === 3 || number === 4) {
                result += 'mesece';
            } else {
                result += 'mesecev';
            }
            return result;
        case 'yy':
            if (number === 1) {
                result += 'leto';
            } else if (number === 2) {
                result += 'leti';
            } else if (number === 3 || number === 4) {
                result += 'leta';
            } else {
                result += 'let';
            }
            return result;
        }
    }

    return moment.defineLocale('sl', {
        months : 'januar_februar_marec_april_maj_junij_julij_avgust_september_oktober_november_december'.split('_'),
        monthsShort : 'jan._feb._mar._apr._maj._jun._jul._avg._sep._okt._nov._dec.'.split('_'),
        weekdays : 'nedelja_ponedeljek_torek_sreda_Фetrtek_petek_sobota'.split('_'),
        weekdaysShort : 'ned._pon._tor._sre._Фet._pet._sob.'.split('_'),
        weekdaysMin : 'ne_po_to_sr_Фe_pe_so'.split('_'),
        longDateFormat : {
            LT : 'H:mm',
            LTS : 'LT:ss',
            L : 'DD. MM. YYYY',
            LL : 'D. MMMM YYYY',
            LLL : 'D. MMMM YYYY LT',
            LLLL : 'dddd, D. MMMM YYYY LT'
        },
        calendar : {
            sameDay  : '[danes ob] LT',
            nextDay  : '[jutri ob] LT',

            nextWeek : function () {
                switch (this.day()) {
                case 0:
                    return '[v] [nedeljo] [ob] LT';
                case 3:
                    return '[v] [sredo] [ob] LT';
                case 6:
                    return '[v] [soboto] [ob] LT';
                case 1:
                case 2:
                case 4:
                case 5:
                    return '[v] dddd [ob] LT';
                }
            },
            lastDay  : '[vФeraj ob] LT',
            lastWeek : function () {
                switch (this.day()) {
                case 0:
                case 3:
                case 6:
                    return '[prejХЁnja] dddd [ob] LT';
                case 1:
                case 2:
                case 4:
                case 5:
                    return '[prejХЁnji] dddd [ob] LT';
                }
            },
            sameElse : 'L'
        },
        relativeTime : {
            future : 'Фez %s',
            past   : '%s nazaj',
            s      : 'nekaj sekund',
            m      : translate,
            mm     : translate,
            h      : translate,
            hh     : translate,
            d      : 'en dan',
            dd     : translate,
            M      : 'en mesec',
            MM     : translate,
            y      : 'eno leto',
            yy     : translate
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : Albanian (sq)
// author : FlakУЋrim Ismani : https://github.com/flakerimi
// author: Menelion ElensУКle: https://github.com/Oire (tests)
// author : Oerd Cukalla : https://github.com/oerd (fixes)

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('sq', {
        months : 'Janar_Shkurt_Mars_Prill_Maj_Qershor_Korrik_Gusht_Shtator_Tetor_NУЋntor_Dhjetor'.split('_'),
        monthsShort : 'Jan_Shk_Mar_Pri_Maj_Qer_Kor_Gus_Sht_Tet_NУЋn_Dhj'.split('_'),
        weekdays : 'E Diel_E HУЋnУЋ_E MartУЋ_E MУЋrkurУЋ_E Enjte_E Premte_E ShtunУЋ'.split('_'),
        weekdaysShort : 'Die_HУЋn_Mar_MУЋr_Enj_Pre_Sht'.split('_'),
        weekdaysMin : 'D_H_Ma_MУЋ_E_P_Sh'.split('_'),
        meridiemParse: /PD|MD/,
        isPM: function (input) {
            return input.charAt(0) === 'M';
        },
        meridiem : function (hours, minutes, isLower) {
            return hours < 12 ? 'PD' : 'MD';
        },
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd, D MMMM YYYY LT'
        },
        calendar : {
            sameDay : '[Sot nУЋ] LT',
            nextDay : '[NesУЋr nУЋ] LT',
            nextWeek : 'dddd [nУЋ] LT',
            lastDay : '[Dje nУЋ] LT',
            lastWeek : 'dddd [e kaluar nУЋ] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : 'nУЋ %s',
            past : '%s mУЋ parУЋ',
            s : 'disa sekonda',
            m : 'njУЋ minutУЋ',
            mm : '%d minuta',
            h : 'njУЋ orУЋ',
            hh : '%d orУЋ',
            d : 'njУЋ ditУЋ',
            dd : '%d ditУЋ',
            M : 'njУЋ muaj',
            MM : '%d muaj',
            y : 'njУЋ vit',
            yy : '%d vite'
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : Serbian-cyrillic (sr-cyrl)
// author : Milan JanaФkoviФ<milanjanackovic@gmail.com> : https://github.com/milan-j

(function (factory) {
    factory(moment);
}(function (moment) {
    var translator = {
        words: { //Different grammatical cases
            m: ['баЕаДаАаН аМаИаНбб', 'баЕаДаНаЕ аМаИаНббаЕ'],
            mm: ['аМаИаНбб', 'аМаИаНббаЕ', 'аМаИаНббаА'],
            h: ['баЕаДаАаН баАб', 'баЕаДаНаОаГ баАбаА'],
            hh: ['баАб', 'баАбаА', 'баАбаИ'],
            dd: ['аДаАаН', 'аДаАаНаА', 'аДаАаНаА'],
            MM: ['аМаЕбаЕб', 'аМаЕбаЕбаА', 'аМаЕбаЕбаИ'],
            yy: ['аГаОаДаИаНаА', 'аГаОаДаИаНаЕ', 'аГаОаДаИаНаА']
        },
        correctGrammaticalCase: function (number, wordKey) {
            return number === 1 ? wordKey[0] : (number >= 2 && number <= 4 ? wordKey[1] : wordKey[2]);
        },
        translate: function (number, withoutSuffix, key) {
            var wordKey = translator.words[key];
            if (key.length === 1) {
                return withoutSuffix ? wordKey[0] : wordKey[1];
            } else {
                return number + ' ' + translator.correctGrammaticalCase(number, wordKey);
            }
        }
    };

    return moment.defineLocale('sr-cyrl', {
        months: ['баАаНбаАб', 'баЕаБббаАб', 'аМаАбб', 'аАаПбаИаЛ', 'аМаАб', 'ббаН', 'ббаЛ', 'аАаВаГббб', 'баЕаПбаЕаМаБаАб', 'аОаКбаОаБаАб', 'аНаОаВаЕаМаБаАб', 'аДаЕбаЕаМаБаАб'],
        monthsShort: ['баАаН.', 'баЕаБ.', 'аМаАб.', 'аАаПб.', 'аМаАб', 'ббаН', 'ббаЛ', 'аАаВаГ.', 'баЕаП.', 'аОаКб.', 'аНаОаВ.', 'аДаЕб.'],
        weekdays: ['аНаЕаДаЕбаА', 'аПаОаНаЕаДаЕбаАаК', 'ббаОбаАаК', 'ббаЕаДаА', 'баЕбаВббаАаК', 'аПаЕбаАаК', 'ббаБаОбаА'],
        weekdaysShort: ['аНаЕаД.', 'аПаОаН.', 'ббаО.', 'ббаЕ.', 'баЕб.', 'аПаЕб.', 'ббаБ.'],
        weekdaysMin: ['аНаЕ', 'аПаО', 'бб', 'бб', 'баЕ', 'аПаЕ', 'бб'],
        longDateFormat: {
            LT: 'H:mm',
            LTS : 'LT:ss',
            L: 'DD. MM. YYYY',
            LL: 'D. MMMM YYYY',
            LLL: 'D. MMMM YYYY LT',
            LLLL: 'dddd, D. MMMM YYYY LT'
        },
        calendar: {
            sameDay: '[аДаАаНаАб б] LT',
            nextDay: '[ббббаА б] LT',

            nextWeek: function () {
                switch (this.day()) {
                case 0:
                    return '[б] [аНаЕаДаЕбб] [б] LT';
                case 3:
                    return '[б] [ббаЕаДб] [б] LT';
                case 6:
                    return '[б] [ббаБаОбб] [б] LT';
                case 1:
                case 2:
                case 4:
                case 5:
                    return '[б] dddd [б] LT';
                }
            },
            lastDay  : '[бббаЕ б] LT',
            lastWeek : function () {
                var lastWeekDays = [
                    '[аПбаОбаЛаЕ] [аНаЕаДаЕбаЕ] [б] LT',
                    '[аПбаОбаЛаОаГ] [аПаОаНаЕаДаЕбаКаА] [б] LT',
                    '[аПбаОбаЛаОаГ] [ббаОбаКаА] [б] LT',
                    '[аПбаОбаЛаЕ] [ббаЕаДаЕ] [б] LT',
                    '[аПбаОбаЛаОаГ] [баЕбаВббаКаА] [б] LT',
                    '[аПбаОбаЛаОаГ] [аПаЕбаКаА] [б] LT',
                    '[аПбаОбаЛаЕ] [ббаБаОбаЕ] [б] LT'
                ];
                return lastWeekDays[this.day()];
            },
            sameElse : 'L'
        },
        relativeTime : {
            future : 'аЗаА %s',
            past   : 'аПбаЕ %s',
            s      : 'аНаЕаКаОаЛаИаКаО баЕаКбаНаДаИ',
            m      : translator.translate,
            mm     : translator.translate,
            h      : translator.translate,
            hh     : translator.translate,
            d      : 'аДаАаН',
            dd     : translator.translate,
            M      : 'аМаЕбаЕб',
            MM     : translator.translate,
            y      : 'аГаОаДаИаНб',
            yy     : translator.translate
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : Serbian-latin (sr)
// author : Milan JanaФkoviФ<milanjanackovic@gmail.com> : https://github.com/milan-j

(function (factory) {
    factory(moment);
}(function (moment) {
    var translator = {
        words: { //Different grammatical cases
            m: ['jedan minut', 'jedne minute'],
            mm: ['minut', 'minute', 'minuta'],
            h: ['jedan sat', 'jednog sata'],
            hh: ['sat', 'sata', 'sati'],
            dd: ['dan', 'dana', 'dana'],
            MM: ['mesec', 'meseca', 'meseci'],
            yy: ['godina', 'godine', 'godina']
        },
        correctGrammaticalCase: function (number, wordKey) {
            return number === 1 ? wordKey[0] : (number >= 2 && number <= 4 ? wordKey[1] : wordKey[2]);
        },
        translate: function (number, withoutSuffix, key) {
            var wordKey = translator.words[key];
            if (key.length === 1) {
                return withoutSuffix ? wordKey[0] : wordKey[1];
            } else {
                return number + ' ' + translator.correctGrammaticalCase(number, wordKey);
            }
        }
    };

    return moment.defineLocale('sr', {
        months: ['januar', 'februar', 'mart', 'april', 'maj', 'jun', 'jul', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar'],
        monthsShort: ['jan.', 'feb.', 'mar.', 'apr.', 'maj', 'jun', 'jul', 'avg.', 'sep.', 'okt.', 'nov.', 'dec.'],
        weekdays: ['nedelja', 'ponedeljak', 'utorak', 'sreda', 'Фetvrtak', 'petak', 'subota'],
        weekdaysShort: ['ned.', 'pon.', 'uto.', 'sre.', 'Фet.', 'pet.', 'sub.'],
        weekdaysMin: ['ne', 'po', 'ut', 'sr', 'Фe', 'pe', 'su'],
        longDateFormat: {
            LT: 'H:mm',
            LTS : 'LT:ss',
            L: 'DD. MM. YYYY',
            LL: 'D. MMMM YYYY',
            LLL: 'D. MMMM YYYY LT',
            LLLL: 'dddd, D. MMMM YYYY LT'
        },
        calendar: {
            sameDay: '[danas u] LT',
            nextDay: '[sutra u] LT',

            nextWeek: function () {
                switch (this.day()) {
                case 0:
                    return '[u] [nedelju] [u] LT';
                case 3:
                    return '[u] [sredu] [u] LT';
                case 6:
                    return '[u] [subotu] [u] LT';
                case 1:
                case 2:
                case 4:
                case 5:
                    return '[u] dddd [u] LT';
                }
            },
            lastDay  : '[juФe u] LT',
            lastWeek : function () {
                var lastWeekDays = [
                    '[proХЁle] [nedelje] [u] LT',
                    '[proХЁlog] [ponedeljka] [u] LT',
                    '[proХЁlog] [utorka] [u] LT',
                    '[proХЁle] [srede] [u] LT',
                    '[proХЁlog] [Фetvrtka] [u] LT',
                    '[proХЁlog] [petka] [u] LT',
                    '[proХЁle] [subote] [u] LT'
                ];
                return lastWeekDays[this.day()];
            },
            sameElse : 'L'
        },
        relativeTime : {
            future : 'za %s',
            past   : 'pre %s',
            s      : 'nekoliko sekundi',
            m      : translator.translate,
            mm     : translator.translate,
            h      : translator.translate,
            hh     : translator.translate,
            d      : 'dan',
            dd     : translator.translate,
            M      : 'mesec',
            MM     : translator.translate,
            y      : 'godinu',
            yy     : translator.translate
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : swedish (sv)
// author : Jens Alm : https://github.com/ulmus

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('sv', {
        months : 'januari_februari_mars_april_maj_juni_juli_augusti_september_oktober_november_december'.split('_'),
        monthsShort : 'jan_feb_mar_apr_maj_jun_jul_aug_sep_okt_nov_dec'.split('_'),
        weekdays : 'sУЖndag_mУЅndag_tisdag_onsdag_torsdag_fredag_lУЖrdag'.split('_'),
        weekdaysShort : 'sУЖn_mУЅn_tis_ons_tor_fre_lУЖr'.split('_'),
        weekdaysMin : 'sУЖ_mУЅ_ti_on_to_fr_lУЖ'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'YYYY-MM-DD',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd D MMMM YYYY LT'
        },
        calendar : {
            sameDay: '[Idag] LT',
            nextDay: '[Imorgon] LT',
            lastDay: '[IgУЅr] LT',
            nextWeek: 'dddd LT',
            lastWeek: '[FУЖrra] dddd[en] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : 'om %s',
            past : 'fУЖr %s sedan',
            s : 'nУЅgra sekunder',
            m : 'en minut',
            mm : '%d minuter',
            h : 'en timme',
            hh : '%d timmar',
            d : 'en dag',
            dd : '%d dagar',
            M : 'en mУЅnad',
            MM : '%d mУЅnader',
            y : 'ett УЅr',
            yy : '%d УЅr'
        },
        ordinalParse: /\d{1,2}(e|a)/,
        ordinal : function (number) {
            var b = number % 10,
                output = (~~(number % 100 / 10) === 1) ? 'e' :
                (b === 1) ? 'a' :
                (b === 2) ? 'a' :
                (b === 3) ? 'e' : 'e';
            return number + output;
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : tamil (ta)
// author : Arjunkumar Krishnamoorthy : https://github.com/tk120404

(function (factory) {
    factory(moment);
}(function (moment) {
    /*var symbolMap = {
            '1': 'рЏЇ',
            '2': 'рЏЈ',
            '3': 'рЏЉ',
            '4': 'рЏЊ',
            '5': 'рЏЋ',
            '6': 'рЏЌ',
            '7': 'рЏ­',
            '8': 'рЏЎ',
            '9': 'рЏЏ',
            '0': 'рЏІ'
        },
        numberMap = {
            'рЏЇ': '1',
            'рЏЈ': '2',
            'рЏЉ': '3',
            'рЏЊ': '4',
            'рЏЋ': '5',
            'рЏЌ': '6',
            'рЏ­': '7',
            'рЏЎ': '8',
            'рЏЏ': '9',
            'рЏІ': '0'
        }; */

    return moment.defineLocale('ta', {
        months : 'рЎрЎЉрЎЕрЎАрЎП_рЎЊрЎПрЎЊрЏрЎАрЎЕрЎАрЎП_рЎЎрЎОрЎАрЏрЎрЏ_рЎрЎЊрЏрЎАрЎВрЏ_рЎЎрЏ_рЎрЏрЎЉрЏ_рЎрЏрЎВрЏ_рЎрЎрЎИрЏрЎрЏ_рЎрЏрЎЊрЏрЎрЏрЎЎрЏрЎЊрЎАрЏ_рЎрЎрЏрЎрЏрЎОрЎЊрЎАрЏ_рЎЈрЎЕрЎЎрЏрЎЊрЎАрЏ_рЎрЎПрЎрЎЎрЏрЎЊрЎАрЏ'.split('_'),
        monthsShort : 'рЎрЎЉрЎЕрЎАрЎП_рЎЊрЎПрЎЊрЏрЎАрЎЕрЎАрЎП_рЎЎрЎОрЎАрЏрЎрЏ_рЎрЎЊрЏрЎАрЎВрЏ_рЎЎрЏ_рЎрЏрЎЉрЏ_рЎрЏрЎВрЏ_рЎрЎрЎИрЏрЎрЏ_рЎрЏрЎЊрЏрЎрЏрЎЎрЏрЎЊрЎАрЏ_рЎрЎрЏрЎрЏрЎОрЎЊрЎАрЏ_рЎЈрЎЕрЎЎрЏрЎЊрЎАрЏ_рЎрЎПрЎрЎЎрЏрЎЊрЎАрЏ'.split('_'),
        weekdays : 'рЎрЎОрЎЏрЎПрЎБрЏрЎБрЏрЎрЏрЎрЎПрЎДрЎЎрЏ_рЎЄрЎПрЎрЏрЎрЎрЏрЎрЎПрЎДрЎЎрЏ_рЎрЏрЎЕрЏрЎЕрЎОрЎЏрЏрЎрЎПрЎДрЎЎрЏ_рЎЊрЏрЎЄрЎЉрЏрЎрЎПрЎДрЎЎрЏ_рЎЕрЎПрЎЏрЎОрЎДрЎрЏрЎрЎПрЎДрЎЎрЏ_рЎЕрЏрЎГрЏрЎГрЎПрЎрЏрЎрЎПрЎДрЎЎрЏ_рЎрЎЉрЎПрЎрЏрЎрЎПрЎДрЎЎрЏ'.split('_'),
        weekdaysShort : 'рЎрЎОрЎЏрЎПрЎБрЏ_рЎЄрЎПрЎрЏрЎрЎГрЏ_рЎрЏрЎЕрЏрЎЕрЎОрЎЏрЏ_рЎЊрЏрЎЄрЎЉрЏ_рЎЕрЎПрЎЏрЎОрЎДрЎЉрЏ_рЎЕрЏрЎГрЏрЎГрЎП_рЎрЎЉрЎП'.split('_'),
        weekdaysMin : 'рЎрЎО_рЎЄрЎП_рЎрЏ_рЎЊрЏ_рЎЕрЎП_рЎЕрЏ_рЎ'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY, LT',
            LLLL : 'dddd, D MMMM YYYY, LT'
        },
        calendar : {
            sameDay : '[рЎрЎЉрЏрЎБрЏ] LT',
            nextDay : '[рЎЈрЎОрЎГрЏ] LT',
            nextWeek : 'dddd, LT',
            lastDay : '[рЎЈрЏрЎБрЏрЎБрЏ] LT',
            lastWeek : '[рЎрЎрЎЈрЏрЎЄ рЎЕрЎОрЎАрЎЎрЏ] dddd, LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : '%s рЎрЎВрЏ',
            past : '%s рЎЎрЏрЎЉрЏ',
            s : 'рЎрЎАрЏ рЎрЎПрЎВ рЎЕрЎПрЎЈрЎОрЎрЎПрЎрЎГрЏ',
            m : 'рЎрЎАрЏ рЎЈрЎПрЎЎрЎПрЎрЎЎрЏ',
            mm : '%d рЎЈрЎПрЎЎрЎПрЎрЎрЏрЎрЎГрЏ',
            h : 'рЎрЎАрЏ рЎЎрЎЃрЎП рЎЈрЏрЎАрЎЎрЏ',
            hh : '%d рЎЎрЎЃрЎП рЎЈрЏрЎАрЎЎрЏ',
            d : 'рЎрЎАрЏ рЎЈрЎОрЎГрЏ',
            dd : '%d рЎЈрЎОрЎрЏрЎрЎГрЏ',
            M : 'рЎрЎАрЏ рЎЎрЎОрЎЄрЎЎрЏ',
            MM : '%d рЎЎрЎОрЎЄрЎрЏрЎрЎГрЏ',
            y : 'рЎрЎАрЏ рЎЕрЎАрЏрЎрЎЎрЏ',
            yy : '%d рЎрЎЃрЏрЎрЏрЎрЎГрЏ'
        },
/*        preparse: function (string) {
            return string.replace(/[рЏЇрЏЈрЏЉрЏЊрЏЋрЏЌрЏ­рЏЎрЏЏрЏІ]/g, function (match) {
                return numberMap[match];
            });
        },
        postformat: function (string) {
            return string.replace(/\d/g, function (match) {
                return symbolMap[match];
            });
        },*/
        ordinalParse: /\d{1,2}рЎЕрЎЄрЏ/,
        ordinal : function (number) {
            return number + 'рЎЕрЎЄрЏ';
        },


        // refer http://ta.wikipedia.org/s/1er1
        meridiemParse: /рЎЏрЎОрЎЎрЎЎрЏ|рЎЕрЏрЎрЎБрЏ|рЎрЎОрЎВрЏ|рЎЈрЎЃрЏрЎЊрЎрЎВрЏ|рЎрЎБрЏрЎЊрЎОрЎрЏ|рЎЎрЎОрЎВрЏ/,
        meridiem : function (hour, minute, isLower) {
            if (hour < 2) {
                return ' рЎЏрЎОрЎЎрЎЎрЏ';
            } else if (hour < 6) {
                return ' рЎЕрЏрЎрЎБрЏ';  // рЎЕрЏрЎрЎБрЏ
            } else if (hour < 10) {
                return ' рЎрЎОрЎВрЏ'; // рЎрЎОрЎВрЏ
            } else if (hour < 14) {
                return ' рЎЈрЎЃрЏрЎЊрЎрЎВрЏ'; // рЎЈрЎЃрЏрЎЊрЎрЎВрЏ
            } else if (hour < 18) {
                return ' рЎрЎБрЏрЎЊрЎОрЎрЏ'; // рЎрЎБрЏрЎЊрЎОрЎрЏ
            } else if (hour < 22) {
                return ' рЎЎрЎОрЎВрЏ'; // рЎЎрЎОрЎВрЏ
            } else {
                return ' рЎЏрЎОрЎЎрЎЎрЏ';
            }
        },
        meridiemHour : function (hour, meridiem) {
            if (hour === 12) {
                hour = 0;
            }
            if (meridiem === 'рЎЏрЎОрЎЎрЎЎрЏ') {
                return hour < 2 ? hour : hour + 12;
            } else if (meridiem === 'рЎЕрЏрЎрЎБрЏ' || meridiem === 'рЎрЎОрЎВрЏ') {
                return hour;
            } else if (meridiem === 'рЎЈрЎЃрЏрЎЊрЎрЎВрЏ') {
                return hour >= 10 ? hour : hour + 12;
            } else {
                return hour + 12;
            }
        },
        week : {
            dow : 0, // Sunday is the first day of the week.
            doy : 6  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : thai (th)
// author : Kridsada Thanabulpong : https://github.com/sirn

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('th', {
        months : 'рИЁрИрИЃрИВрИрИЁ_рИрИИрИЁрИ рИВрИрИБрИрИрЙ_рИЁрИЕрИрИВрИрИЁ_рЙрИЁрИЉрИВрИЂрИ_рИрИЄрИЉрИ рИВрИрИЁ_рИЁрИДрИрИИрИрИВрИЂрИ_рИрИЃрИрИрИВрИрИЁ_рИЊрИДрИрИЋрИВрИрИЁ_рИрИБрИрИЂрИВрИЂрИ_рИрИИрИЅрИВрИрИЁ_рИрИЄрИЈрИрИДрИрИВрИЂрИ_рИрИБрИрИЇрИВрИрИЁ'.split('_'),
        monthsShort : 'рИЁрИрИЃрИВ_рИрИИрИЁрИ рИВ_рИЁрИЕрИрИВ_рЙрИЁрИЉрИВ_рИрИЄрИЉрИ рИВ_рИЁрИДрИрИИрИрИВ_рИрИЃрИрИрИВ_рИЊрИДрИрИЋрИВ_рИрИБрИрИЂрИВ_рИрИИрИЅрИВ_рИрИЄрИЈрИрИДрИрИВ_рИрИБрИрИЇрИВ'.split('_'),
        weekdays : 'рИ­рИВрИрИДрИрИЂрЙ_рИрИБрИрИрИЃрЙ_рИ­рИБрИрИрИВрИЃ_рИрИИрИ_рИрИЄрИЋрИБрИЊрИрИрИЕ_рИЈрИИрИрИЃрЙ_рЙрИЊрИВрИЃрЙ'.split('_'),
        weekdaysShort : 'рИ­рИВрИрИДрИрИЂрЙ_рИрИБрИрИрИЃрЙ_рИ­рИБрИрИрИВрИЃ_рИрИИрИ_рИрИЄрИЋрИБрИЊ_рИЈрИИрИрИЃрЙ_рЙрИЊрИВрИЃрЙ'.split('_'), // yes, three characters difference
        weekdaysMin : 'рИ­рИВ._рИ._рИ­._рИ._рИрИЄ._рИЈ._рИЊ.'.split('_'),
        longDateFormat : {
            LT : 'H рИрИВрИЌрИДрИрИВ m рИрИВрИрИЕ',
            LTS : 'LT s рИЇрИДрИрИВрИрИЕ',
            L : 'YYYY/MM/DD',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY рЙрИЇрИЅрИВ LT',
            LLLL : 'рИЇрИБрИddddрИрИЕрЙ D MMMM YYYY рЙрИЇрИЅрИВ LT'
        },
        meridiemParse: /рИрЙрИ­рИрЙрИрИЕрЙрИЂрИ|рИЋрИЅрИБрИрЙрИрИЕрЙрИЂрИ/,
        isPM: function (input) {
            return input === 'рИЋрИЅрИБрИрЙрИрИЕрЙрИЂрИ';
        },
        meridiem : function (hour, minute, isLower) {
            if (hour < 12) {
                return 'рИрЙрИ­рИрЙрИрИЕрЙрИЂрИ';
            } else {
                return 'рИЋрИЅрИБрИрЙрИрИЕрЙрИЂрИ';
            }
        },
        calendar : {
            sameDay : '[рИЇрИБрИрИрИЕрЙ рЙрИЇрИЅрИВ] LT',
            nextDay : '[рИрИЃрИИрЙрИрИрИЕрЙ рЙрИЇрИЅрИВ] LT',
            nextWeek : 'dddd[рИЋрИрЙрИВ рЙрИЇрИЅрИВ] LT',
            lastDay : '[рЙрИЁрИЗрЙрИ­рИЇрИВрИрИрИЕрЙ рЙрИЇрИЅрИВ] LT',
            lastWeek : '[рИЇрИБрИ]dddd[рИрИЕрЙрЙрИЅрЙрИЇ рЙрИЇрИЅрИВ] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : 'рИ­рИЕрИ %s',
            past : '%sрИрИЕрЙрЙрИЅрЙрИЇ',
            s : 'рЙрИЁрЙрИрИЕрЙрИЇрИДрИрИВрИрИЕ',
            m : '1 рИрИВрИрИЕ',
            mm : '%d рИрИВрИрИЕ',
            h : '1 рИрИБрЙрИЇрЙрИЁрИ',
            hh : '%d рИрИБрЙрИЇрЙрИЁрИ',
            d : '1 рИЇрИБрИ',
            dd : '%d рИЇрИБрИ',
            M : '1 рЙрИрИЗрИ­рИ',
            MM : '%d рЙрИрИЗрИ­рИ',
            y : '1 рИрИЕ',
            yy : '%d рИрИЕ'
        }
    });
}));
// moment.js locale configuration
// locale : Tagalog/Filipino (tl-ph)
// author : Dan Hagman

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('tl-ph', {
        months : 'Enero_Pebrero_Marso_Abril_Mayo_Hunyo_Hulyo_Agosto_Setyembre_Oktubre_Nobyembre_Disyembre'.split('_'),
        monthsShort : 'Ene_Peb_Mar_Abr_May_Hun_Hul_Ago_Set_Okt_Nob_Dis'.split('_'),
        weekdays : 'Linggo_Lunes_Martes_Miyerkules_Huwebes_Biyernes_Sabado'.split('_'),
        weekdaysShort : 'Lin_Lun_Mar_Miy_Huw_Biy_Sab'.split('_'),
        weekdaysMin : 'Li_Lu_Ma_Mi_Hu_Bi_Sab'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'MM/D/YYYY',
            LL : 'MMMM D, YYYY',
            LLL : 'MMMM D, YYYY LT',
            LLLL : 'dddd, MMMM DD, YYYY LT'
        },
        calendar : {
            sameDay: '[Ngayon sa] LT',
            nextDay: '[Bukas sa] LT',
            nextWeek: 'dddd [sa] LT',
            lastDay: '[Kahapon sa] LT',
            lastWeek: 'dddd [huling linggo] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : 'sa loob ng %s',
            past : '%s ang nakalipas',
            s : 'ilang segundo',
            m : 'isang minuto',
            mm : '%d minuto',
            h : 'isang oras',
            hh : '%d oras',
            d : 'isang araw',
            dd : '%d araw',
            M : 'isang buwan',
            MM : '%d buwan',
            y : 'isang taon',
            yy : '%d taon'
        },
        ordinalParse: /\d{1,2}/,
        ordinal : function (number) {
            return number;
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : turkish (tr)
// authors : Erhan Gundogan : https://github.com/erhangundogan,
//           Burak YiФit Kaya: https://github.com/BYK

(function (factory) {
    factory(moment);
}(function (moment) {
    var suffixes = {
        1: '\'inci',
        5: '\'inci',
        8: '\'inci',
        70: '\'inci',
        80: '\'inci',

        2: '\'nci',
        7: '\'nci',
        20: '\'nci',
        50: '\'nci',

        3: '\'УМncУМ',
        4: '\'УМncУМ',
        100: '\'УМncУМ',

        6: '\'ncФБ',

        9: '\'uncu',
        10: '\'uncu',
        30: '\'uncu',

        60: '\'ФБncФБ',
        90: '\'ФБncФБ'
    };

    return moment.defineLocale('tr', {
        months : 'Ocak_Хubat_Mart_Nisan_MayФБs_Haziran_Temmuz_AФustos_EylУМl_Ekim_KasФБm_AralФБk'.split('_'),
        monthsShort : 'Oca_Хub_Mar_Nis_May_Haz_Tem_AФu_Eyl_Eki_Kas_Ara'.split('_'),
        weekdays : 'Pazar_Pazartesi_SalФБ_УarХamba_PerХembe_Cuma_Cumartesi'.split('_'),
        weekdaysShort : 'Paz_Pts_Sal_Уar_Per_Cum_Cts'.split('_'),
        weekdaysMin : 'Pz_Pt_Sa_Уa_Pe_Cu_Ct'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD.MM.YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd, D MMMM YYYY LT'
        },
        calendar : {
            sameDay : '[bugУМn saat] LT',
            nextDay : '[yarФБn saat] LT',
            nextWeek : '[haftaya] dddd [saat] LT',
            lastDay : '[dУМn] LT',
            lastWeek : '[geУЇen hafta] dddd [saat] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : '%s sonra',
            past : '%s УЖnce',
            s : 'birkaУЇ saniye',
            m : 'bir dakika',
            mm : '%d dakika',
            h : 'bir saat',
            hh : '%d saat',
            d : 'bir gУМn',
            dd : '%d gУМn',
            M : 'bir ay',
            MM : '%d ay',
            y : 'bir yФБl',
            yy : '%d yФБl'
        },
        ordinalParse: /\d{1,2}'(inci|nci|УМncУМ|ncФБ|uncu|ФБncФБ)/,
        ordinal : function (number) {
            if (number === 0) {  // special case for zero
                return number + '\'ФБncФБ';
            }
            var a = number % 10,
                b = number % 100 - a,
                c = number >= 100 ? 100 : null;

            return number + (suffixes[a] || suffixes[b] || suffixes[c]);
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : Morocco Central Atlas TamaziЩЃt in Latin (tzm-latn)
// author : Abdel Said : https://github.com/abdelsaid

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('tzm-latn', {
        months : 'innayr_brЫЄayrЫЄ_marЫЄsЫЄ_ibrir_mayyw_ywnyw_ywlywz_ЩЃwХЁt_ХЁwtanbir_ktЫЄwbrЫЄ_nwwanbir_dwjnbir'.split('_'),
        monthsShort : 'innayr_brЫЄayrЫЄ_marЫЄsЫЄ_ibrir_mayyw_ywnyw_ywlywz_ЩЃwХЁt_ХЁwtanbir_ktЫЄwbrЫЄ_nwwanbir_dwjnbir'.split('_'),
        weekdays : 'asamas_aynas_asinas_akras_akwas_asimwas_asiсИyas'.split('_'),
        weekdaysShort : 'asamas_aynas_asinas_akras_akwas_asimwas_asiсИyas'.split('_'),
        weekdaysMin : 'asamas_aynas_asinas_akras_akwas_asimwas_asiсИyas'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd D MMMM YYYY LT'
        },
        calendar : {
            sameDay: '[asdkh g] LT',
            nextDay: '[aska g] LT',
            nextWeek: 'dddd [g] LT',
            lastDay: '[assant g] LT',
            lastWeek: 'dddd [g] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : 'dadkh s yan %s',
            past : 'yan %s',
            s : 'imik',
            m : 'minuсИ',
            mm : '%d minuсИ',
            h : 'saЩa',
            hh : '%d tassaЩin',
            d : 'ass',
            dd : '%d ossan',
            M : 'ayowr',
            MM : '%d iyyirn',
            y : 'asgas',
            yy : '%d isgasn'
        },
        week : {
            dow : 6, // Saturday is the first day of the week.
            doy : 12  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : Morocco Central Atlas TamaziЩЃt (tzm)
// author : Abdel Said : https://github.com/abdelsaid

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('tzm', {
        months : 'тЕтЕтЕтДАтЕЂтЕ_тДБтЕтДАтЕЂтЕ_тЕтДАтЕтЕ_тЕтДБтЕтЕтЕ_тЕтДАтЕЂтЕЂтЕ_тЕЂтЕтЕтЕЂтЕ_тЕЂтЕтЕтЕЂтЕтЕЃ_тЕтЕтЕтЕ_тЕтЕтЕтДАтЕтДБтЕтЕ_тДНтЕтЕтДБтЕ_тЕтЕтЕЁтДАтЕтДБтЕтЕ_тДЗтЕтЕтЕтДБтЕтЕ'.split('_'),
        monthsShort : 'тЕтЕтЕтДАтЕЂтЕ_тДБтЕтДАтЕЂтЕ_тЕтДАтЕтЕ_тЕтДБтЕтЕтЕ_тЕтДАтЕЂтЕЂтЕ_тЕЂтЕтЕтЕЂтЕ_тЕЂтЕтЕтЕЂтЕтЕЃ_тЕтЕтЕтЕ_тЕтЕтЕтДАтЕтДБтЕтЕ_тДНтЕтЕтДБтЕ_тЕтЕтЕЁтДАтЕтДБтЕтЕ_тДЗтЕтЕтЕтДБтЕтЕ'.split('_'),
        weekdays : 'тДАтЕтДАтЕтДАтЕ_тДАтЕЂтЕтДАтЕ_тДАтЕтЕтЕтДАтЕ_тДАтДНтЕтДАтЕ_тДАтДНтЕЁтДАтЕ_тДАтЕтЕтЕтЕЁтДАтЕ_тДАтЕтЕтДЙтЕЂтДАтЕ'.split('_'),
        weekdaysShort : 'тДАтЕтДАтЕтДАтЕ_тДАтЕЂтЕтДАтЕ_тДАтЕтЕтЕтДАтЕ_тДАтДНтЕтДАтЕ_тДАтДНтЕЁтДАтЕ_тДАтЕтЕтЕтЕЁтДАтЕ_тДАтЕтЕтДЙтЕЂтДАтЕ'.split('_'),
        weekdaysMin : 'тДАтЕтДАтЕтДАтЕ_тДАтЕЂтЕтДАтЕ_тДАтЕтЕтЕтДАтЕ_тДАтДНтЕтДАтЕ_тДАтДНтЕЁтДАтЕ_тДАтЕтЕтЕтЕЁтДАтЕ_тДАтЕтЕтДЙтЕЂтДАтЕ'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS: 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd D MMMM YYYY LT'
        },
        calendar : {
            sameDay: '[тДАтЕтДЗтЕ тДД] LT',
            nextDay: '[тДАтЕтДНтДА тДД] LT',
            nextWeek: 'dddd [тДД] LT',
            lastDay: '[тДАтЕтДАтЕтЕ тДД] LT',
            lastWeek: 'dddd [тДД] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : 'тДЗтДАтДЗтЕ тЕ тЕЂтДАтЕ %s',
            past : 'тЕЂтДАтЕ %s',
            s : 'тЕтЕтЕтДН',
            m : 'тЕтЕтЕтЕтДК',
            mm : '%d тЕтЕтЕтЕтДК',
            h : 'тЕтДАтЕтДА',
            hh : '%d тЕтДАтЕтЕтДАтЕтЕтЕ',
            d : 'тДАтЕтЕ',
            dd : '%d oтЕтЕтДАтЕ',
            M : 'тДАтЕЂoтЕтЕ',
            MM : '%d тЕтЕЂтЕЂтЕтЕтЕ',
            y : 'тДАтЕтДГтДАтЕ',
            yy : '%d тЕтЕтДГтДАтЕтЕ'
        },
        week : {
            dow : 6, // Saturday is the first day of the week.
            doy : 12  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : ukrainian (uk)
// author : zemlanin : https://github.com/zemlanin
// Author : Menelion ElensУКle : https://github.com/Oire

(function (factory) {
    factory(moment);
}(function (moment) {
    function plural(word, num) {
        var forms = word.split('_');
        return num % 10 === 1 && num % 100 !== 11 ? forms[0] : (num % 10 >= 2 && num % 10 <= 4 && (num % 100 < 10 || num % 100 >= 20) ? forms[1] : forms[2]);
    }

    function relativeTimeWithPlural(number, withoutSuffix, key) {
        var format = {
            'mm': 'баВаИаЛаИаНаА_баВаИаЛаИаНаИ_баВаИаЛаИаН',
            'hh': 'аГаОаДаИаНаА_аГаОаДаИаНаИ_аГаОаДаИаН',
            'dd': 'аДаЕаНб_аДаНб_аДаНбаВ',
            'MM': 'аМббббб_аМббббб_аМбббббаВ',
            'yy': 'ббаК_баОаКаИ_баОаКбаВ'
        };
        if (key === 'm') {
            return withoutSuffix ? 'баВаИаЛаИаНаА' : 'баВаИаЛаИаНб';
        }
        else if (key === 'h') {
            return withoutSuffix ? 'аГаОаДаИаНаА' : 'аГаОаДаИаНб';
        }
        else {
            return number + ' ' + plural(format[key], +number);
        }
    }

    function monthsCaseReplace(m, format) {
        var months = {
            'nominative': 'бббаЕаНб_аЛббаИаЙ_аБаЕбаЕаЗаЕаНб_аКаВббаЕаНб_ббаАаВаЕаНб_баЕбаВаЕаНб_аЛаИаПаЕаНб_баЕбаПаЕаНб_аВаЕбаЕбаЕаНб_аЖаОаВбаЕаНб_аЛаИббаОаПаАаД_аГббаДаЕаНб'.split('_'),
            'accusative': 'бббаНб_аЛббаОаГаО_аБаЕбаЕаЗаНб_аКаВббаНб_ббаАаВаНб_баЕбаВаНб_аЛаИаПаНб_баЕбаПаНб_аВаЕбаЕбаНб_аЖаОаВбаНб_аЛаИббаОаПаАаДаА_аГббаДаНб'.split('_')
        },

        nounCase = (/D[oD]? *MMMM?/).test(format) ?
            'accusative' :
            'nominative';

        return months[nounCase][m.month()];
    }

    function weekdaysCaseReplace(m, format) {
        var weekdays = {
            'nominative': 'аНаЕаДбаЛб_аПаОаНаЕаДбаЛаОаК_аВбаВбаОбаОаК_баЕбаЕаДаА_баЕбаВаЕб_аПтббаНаИбб_ббаБаОбаА'.split('_'),
            'accusative': 'аНаЕаДбаЛб_аПаОаНаЕаДбаЛаОаК_аВбаВбаОбаОаК_баЕбаЕаДб_баЕбаВаЕб_аПтббаНаИбб_ббаБаОбб'.split('_'),
            'genitive': 'аНаЕаДбаЛб_аПаОаНаЕаДбаЛаКаА_аВбаВбаОбаКаА_баЕбаЕаДаИ_баЕбаВаЕбаГаА_аПтббаНаИбб_ббаБаОбаИ'.split('_')
        },

        nounCase = (/(\[[ааВаЃб]\]) ?dddd/).test(format) ?
            'accusative' :
            ((/\[?(?:аМаИаНбаЛаОб|аНаАбббаПаНаОб)? ?\] ?dddd/).test(format) ?
                'genitive' :
                'nominative');

        return weekdays[nounCase][m.day()];
    }

    function processHoursFunction(str) {
        return function () {
            return str + 'аО' + (this.hours() === 11 ? 'аБ' : '') + '] LT';
        };
    }

    return moment.defineLocale('uk', {
        months : monthsCaseReplace,
        monthsShort : 'ббб_аЛбб_аБаЕб_аКаВбб_ббаАаВ_баЕбаВ_аЛаИаП_баЕбаП_аВаЕб_аЖаОаВб_аЛаИбб_аГббаД'.split('_'),
        weekdays : weekdaysCaseReplace,
        weekdaysShort : 'аНаД_аПаН_аВб_бб_бб_аПб_баБ'.split('_'),
        weekdaysMin : 'аНаД_аПаН_аВб_бб_бб_аПб_баБ'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD.MM.YYYY',
            LL : 'D MMMM YYYY б.',
            LLL : 'D MMMM YYYY б., LT',
            LLLL : 'dddd, D MMMM YYYY б., LT'
        },
        calendar : {
            sameDay: processHoursFunction('[аЁбаОаГаОаДаНб '),
            nextDay: processHoursFunction('[ааАаВббаА '),
            lastDay: processHoursFunction('[абаОбаА '),
            nextWeek: processHoursFunction('[аЃ] dddd ['),
            lastWeek: function () {
                switch (this.day()) {
                case 0:
                case 3:
                case 5:
                case 6:
                    return processHoursFunction('[ааИаНбаЛаОб] dddd [').call(this);
                case 1:
                case 2:
                case 4:
                    return processHoursFunction('[ааИаНбаЛаОаГаО] dddd [').call(this);
                }
            },
            sameElse: 'L'
        },
        relativeTime : {
            future : 'аЗаА %s',
            past : '%s баОаМб',
            s : 'аДаЕаКбаЛбаКаА баЕаКбаНаД',
            m : relativeTimeWithPlural,
            mm : relativeTimeWithPlural,
            h : 'аГаОаДаИаНб',
            hh : relativeTimeWithPlural,
            d : 'аДаЕаНб',
            dd : relativeTimeWithPlural,
            M : 'аМббббб',
            MM : relativeTimeWithPlural,
            y : 'ббаК',
            yy : relativeTimeWithPlural
        },

        // M. E.: those two are virtually unused but a user might want to implement them for his/her website for some reason

        meridiemParse: /аНаОбб|баАаНаКб|аДаНб|аВаЕбаОбаА/,
        isPM: function (input) {
            return /^(аДаНб|аВаЕбаОбаА)$/.test(input);
        },
        meridiem : function (hour, minute, isLower) {
            if (hour < 4) {
                return 'аНаОбб';
            } else if (hour < 12) {
                return 'баАаНаКб';
            } else if (hour < 17) {
                return 'аДаНб';
            } else {
                return 'аВаЕбаОбаА';
            }
        },

        ordinalParse: /\d{1,2}-(аЙ|аГаО)/,
        ordinal: function (number, period) {
            switch (period) {
            case 'M':
            case 'd':
            case 'DDD':
            case 'w':
            case 'W':
                return number + '-аЙ';
            case 'D':
                return number + '-аГаО';
            default:
                return number;
            }
        },

        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : uzbek (uz)
// author : Sardor Muminov : https://github.com/muminoff

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('uz', {
        months : 'баНаВаАбб_баЕаВбаАаЛб_аМаАбб_аАаПбаЕаЛб_аМаАаЙ_аИбаНб_аИбаЛб_аАаВаГббб_баЕаНббаБбб_аОаКббаБбб_аНаОбаБбб_аДаЕаКаАаБбб'.split('_'),
        monthsShort : 'баНаВ_баЕаВ_аМаАб_аАаПб_аМаАаЙ_аИбаН_аИбаЛ_аАаВаГ_баЕаН_аОаКб_аНаОб_аДаЕаК'.split('_'),
        weekdays : 'аЏаКбаАаНаБаА_аббаАаНаБаА_аЁаЕбаАаНаБаА_аЇаОббаАаНаБаА_ааАаЙбаАаНаБаА_абаМаА_аЈаАаНаБаА'.split('_'),
        weekdaysShort : 'аЏаКб_абб_аЁаЕб_аЇаОб_ааАаЙ_абаМ_аЈаАаН'.split('_'),
        weekdaysMin : 'аЏаК_аб_аЁаЕ_аЇаО_ааА_аб_аЈаА'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'D MMMM YYYY, dddd LT'
        },
        calendar : {
            sameDay : '[абаГбаН баОаАб] LT [аДаА]',
            nextDay : '[а­ббаАаГаА] LT [аДаА]',
            nextWeek : 'dddd [аКбаНаИ баОаАб] LT [аДаА]',
            lastDay : '[ааЕбаА баОаАб] LT [аДаА]',
            lastWeek : '[аЃбаГаАаН] dddd [аКбаНаИ баОаАб] LT [аДаА]',
            sameElse : 'L'
        },
        relativeTime : {
            future : 'аЏаКаИаН %s аИбаИаДаА',
            past : 'ааИб аНаЕбаА %s аОаЛаДаИаН',
            s : 'ббббаАб',
            m : 'аБаИб аДаАаКаИаКаА',
            mm : '%d аДаАаКаИаКаА',
            h : 'аБаИб баОаАб',
            hh : '%d баОаАб',
            d : 'аБаИб аКбаН',
            dd : '%d аКбаН',
            M : 'аБаИб аОаЙ',
            MM : '%d аОаЙ',
            y : 'аБаИб аЙаИаЛ',
            yy : '%d аЙаИаЛ'
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : vietnamese (vi)
// author : Bang Nguyen : https://github.com/bangnk

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('vi', {
        months : 'thУЁng 1_thУЁng 2_thУЁng 3_thУЁng 4_thУЁng 5_thУЁng 6_thУЁng 7_thУЁng 8_thУЁng 9_thУЁng 10_thУЁng 11_thУЁng 12'.split('_'),
        monthsShort : 'Th01_Th02_Th03_Th04_Th05_Th06_Th07_Th08_Th09_Th10_Th11_Th12'.split('_'),
        weekdays : 'chсЛЇ nhсК­t_thсЛЉ hai_thсЛЉ ba_thсЛЉ tЦА_thсЛЉ nФm_thсЛЉ sУЁu_thсЛЉ bсКЃy'.split('_'),
        weekdaysShort : 'CN_T2_T3_T4_T5_T6_T7'.split('_'),
        weekdaysMin : 'CN_T2_T3_T4_T5_T6_T7'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM [nФm] YYYY',
            LLL : 'D MMMM [nФm] YYYY LT',
            LLLL : 'dddd, D MMMM [nФm] YYYY LT',
            l : 'DD/M/YYYY',
            ll : 'D MMM YYYY',
            lll : 'D MMM YYYY LT',
            llll : 'ddd, D MMM YYYY LT'
        },
        calendar : {
            sameDay: '[HУДm nay lУКc] LT',
            nextDay: '[NgУ y mai lУКc] LT',
            nextWeek: 'dddd [tuсКЇn tсЛi lУКc] LT',
            lastDay: '[HУДm qua lУКc] LT',
            lastWeek: 'dddd [tuсКЇn rсЛi lУКc] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : '%s tсЛi',
            past : '%s trЦАсЛc',
            s : 'vУ i giУЂy',
            m : 'mсЛt phУКt',
            mm : '%d phУКt',
            h : 'mсЛt giсЛ',
            hh : '%d giсЛ',
            d : 'mсЛt ngУ y',
            dd : '%d ngУ y',
            M : 'mсЛt thУЁng',
            MM : '%d thУЁng',
            y : 'mсЛt nФm',
            yy : '%d nФm'
        },
        ordinalParse: /\d{1,2}/,
        ordinal : function (number) {
            return number;
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : chinese (zh-cn)
// author : suupic : https://github.com/suupic
// author : Zeno Zeng : https://github.com/zenozeng

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('zh-cn', {
        months : 'фИц_фКц_фИц_хц_фКц_х­ц_фИц_хЋц_фЙц_хц_хфИц_хфКц'.split('_'),
        monthsShort : '1ц_2ц_3ц_4ц_5ц_6ц_7ц_8ц_9ц_10ц_11ц_12ц'.split('_'),
        weekdays : 'цццЅ_ццфИ_ццфК_ццфИ_ццх_ццфК_ццх­'.split('_'),
        weekdaysShort : 'хЈцЅ_хЈфИ_хЈфК_хЈфИ_хЈх_хЈфК_хЈх­'.split('_'),
        weekdaysMin : 'цЅ_фИ_фК_фИ_х_фК_х­'.split('_'),
        longDateFormat : {
            LT : 'AhчЙmm',
            LTS : 'AhчЙmхsчЇ',
            L : 'YYYY-MM-DD',
            LL : 'YYYYхЙДMMMDцЅ',
            LLL : 'YYYYхЙДMMMDцЅLT',
            LLLL : 'YYYYхЙДMMMDцЅddddLT',
            l : 'YYYY-MM-DD',
            ll : 'YYYYхЙДMMMDцЅ',
            lll : 'YYYYхЙДMMMDцЅLT',
            llll : 'YYYYхЙДMMMDцЅddddLT'
        },
        meridiemParse: /хцЈ|цЉфИ|фИх|фИ­х|фИх|цфИ/,
        meridiemHour: function (hour, meridiem) {
            if (hour === 12) {
                hour = 0;
            }
            if (meridiem === 'хцЈ' || meridiem === 'цЉфИ' ||
                    meridiem === 'фИх') {
                return hour;
            } else if (meridiem === 'фИх' || meridiem === 'цфИ') {
                return hour + 12;
            } else {
                // 'фИ­х'
                return hour >= 11 ? hour : hour + 12;
            }
        },
        meridiem : function (hour, minute, isLower) {
            var hm = hour * 100 + minute;
            if (hm < 600) {
                return 'хцЈ';
            } else if (hm < 900) {
                return 'цЉфИ';
            } else if (hm < 1130) {
                return 'фИх';
            } else if (hm < 1230) {
                return 'фИ­х';
            } else if (hm < 1800) {
                return 'фИх';
            } else {
                return 'цфИ';
            }
        },
        calendar : {
            sameDay : function () {
                return this.minutes() === 0 ? '[фЛхЄЉ]Ah[чЙцД]' : '[фЛхЄЉ]LT';
            },
            nextDay : function () {
                return this.minutes() === 0 ? '[цхЄЉ]Ah[чЙцД]' : '[цхЄЉ]LT';
            },
            lastDay : function () {
                return this.minutes() === 0 ? '[цЈхЄЉ]Ah[чЙцД]' : '[цЈхЄЉ]LT';
            },
            nextWeek : function () {
                var startOfWeek, prefix;
                startOfWeek = moment().startOf('week');
                prefix = this.unix() - startOfWeek.unix() >= 7 * 24 * 3600 ? '[фИ]' : '[цЌ]';
                return this.minutes() === 0 ? prefix + 'dddAhчЙцД' : prefix + 'dddAhчЙmm';
            },
            lastWeek : function () {
                var startOfWeek, prefix;
                startOfWeek = moment().startOf('week');
                prefix = this.unix() < startOfWeek.unix()  ? '[фИ]' : '[цЌ]';
                return this.minutes() === 0 ? prefix + 'dddAhчЙцД' : prefix + 'dddAhчЙmm';
            },
            sameElse : 'LL'
        },
        ordinalParse: /\d{1,2}(цЅ|ц|хЈ)/,
        ordinal : function (number, period) {
            switch (period) {
            case 'd':
            case 'D':
            case 'DDD':
                return number + 'цЅ';
            case 'M':
                return number + 'ц';
            case 'w':
            case 'W':
                return number + 'хЈ';
            default:
                return number;
            }
        },
        relativeTime : {
            future : '%sх',
            past : '%sх',
            s : 'х чЇ',
            m : '1хщ',
            mm : '%dхщ',
            h : '1хАцЖ',
            hh : '%dхАцЖ',
            d : '1хЄЉ',
            dd : '%dхЄЉ',
            M : '1фИЊц',
            MM : '%dфИЊц',
            y : '1хЙД',
            yy : '%dхЙД'
        },
        week : {
            // GB/T 7408-1994уцАцЎххфКЄцЂц МхМТЗфПЁцЏфКЄцЂТЗцЅцхцЖщДшЁЈчЄКцГуфИISO 8601:1988ч­ц
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : traditional chinese (zh-tw)
// author : Ben : https://github.com/ben-lin

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('zh-tw', {
        months : 'фИц_фКц_фИц_хц_фКц_х­ц_фИц_хЋц_фЙц_хц_хфИц_хфКц'.split('_'),
        monthsShort : '1ц_2ц_3ц_4ц_5ц_6ц_7ц_8ц_9ц_10ц_11ц_12ц'.split('_'),
        weekdays : 'цццЅ_ццфИ_ццфК_ццфИ_ццх_ццфК_ццх­'.split('_'),
        weekdaysShort : 'щБцЅ_щБфИ_щБфК_щБфИ_щБх_щБфК_щБх­'.split('_'),
        weekdaysMin : 'цЅ_фИ_фК_фИ_х_фК_х­'.split('_'),
        longDateFormat : {
            LT : 'AhщЛmm',
            LTS : 'AhщЛmхsчЇ',
            L : 'YYYYхЙДMMMDцЅ',
            LL : 'YYYYхЙДMMMDцЅ',
            LLL : 'YYYYхЙДMMMDцЅLT',
            LLLL : 'YYYYхЙДMMMDцЅddddLT',
            l : 'YYYYхЙДMMMDцЅ',
            ll : 'YYYYхЙДMMMDцЅ',
            lll : 'YYYYхЙДMMMDцЅLT',
            llll : 'YYYYхЙДMMMDцЅddddLT'
        },
        meridiemParse: /цЉфИ|фИх|фИ­х|фИх|цфИ/,
        meridiemHour : function (hour, meridiem) {
            if (hour === 12) {
                hour = 0;
            }
            if (meridiem === 'цЉфИ' || meridiem === 'фИх') {
                return hour;
            } else if (meridiem === 'фИ­х') {
                return hour >= 11 ? hour : hour + 12;
            } else if (meridiem === 'фИх' || meridiem === 'цфИ') {
                return hour + 12;
            }
        },
        meridiem : function (hour, minute, isLower) {
            var hm = hour * 100 + minute;
            if (hm < 900) {
                return 'цЉфИ';
            } else if (hm < 1130) {
                return 'фИх';
            } else if (hm < 1230) {
                return 'фИ­х';
            } else if (hm < 1800) {
                return 'фИх';
            } else {
                return 'цфИ';
            }
        },
        calendar : {
            sameDay : '[фЛхЄЉ]LT',
            nextDay : '[цхЄЉ]LT',
            nextWeek : '[фИ]ddddLT',
            lastDay : '[цЈхЄЉ]LT',
            lastWeek : '[фИ]ddddLT',
            sameElse : 'L'
        },
        ordinalParse: /\d{1,2}(цЅ|ц|щБ)/,
        ordinal : function (number, period) {
            switch (period) {
            case 'd' :
            case 'D' :
            case 'DDD' :
                return number + 'цЅ';
            case 'M' :
                return number + 'ц';
            case 'w' :
            case 'W' :
                return number + 'щБ';
            default :
                return number;
            }
        },
        relativeTime : {
            future : '%sхЇ',
            past : '%sх',
            s : 'хЙОчЇ',
            m : 'фИхщ',
            mm : '%dхщ',
            h : 'фИхАц',
            hh : '%dхАц',
            d : 'фИхЄЉ',
            dd : '%dхЄЉ',
            M : 'фИхц',
            MM : '%dхц',
            y : 'фИхЙД',
            yy : '%dхЙД'
        }
    });
}));

    moment.locale('en');


    /************************************
        Exposing Moment
    ************************************/

    function makeGlobal(shouldDeprecate) {
        /*global ender:false */
        if (typeof ender !== 'undefined') {
            return;
        }
        oldGlobalMoment = globalScope.moment;
        if (shouldDeprecate) {
            globalScope.moment = deprecate(
                    'Accessing Moment through the global scope is ' +
                    'deprecated, and will be removed in an upcoming ' +
                    'release.',
                    moment);
        } else {
            globalScope.moment = moment;
        }
    }

    // CommonJS module is defined
    if (hasModule) {
        module.exports = moment;
    } else if (typeof define === 'function' && define.amd) {
        define(function (require, exports, module) {
            if (module.config && module.config() && module.config().noGlobal === true) {
                // release the global variable
                globalScope.moment = oldGlobalMoment;
            }

            return moment;
        });
        makeGlobal(true);
    } else {
        makeGlobal();
    }
}).call(this);
