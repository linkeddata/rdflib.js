(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.$rdf = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (process){
/*!
 * async
 * https://github.com/caolan/async
 *
 * Copyright 2010-2014 Caolan McMahon
 * Released under the MIT license
 */
/*jshint onevar: false, indent:4 */
/*global setImmediate: false, setTimeout: false, console: false */
(function () {

    var async = {};

    // global on the server, window in the browser
    var root, previous_async;

    root = this;
    if (root != null) {
      previous_async = root.async;
    }

    async.noConflict = function () {
        root.async = previous_async;
        return async;
    };

    function only_once(fn) {
        var called = false;
        return function() {
            if (called) throw new Error("Callback was already called.");
            called = true;
            fn.apply(root, arguments);
        }
    }

    //// cross-browser compatiblity functions ////

    var _toString = Object.prototype.toString;

    var _isArray = Array.isArray || function (obj) {
        return _toString.call(obj) === '[object Array]';
    };

    var _each = function (arr, iterator) {
        for (var i = 0; i < arr.length; i += 1) {
            iterator(arr[i], i, arr);
        }
    };

    var _map = function (arr, iterator) {
        if (arr.map) {
            return arr.map(iterator);
        }
        var results = [];
        _each(arr, function (x, i, a) {
            results.push(iterator(x, i, a));
        });
        return results;
    };

    var _reduce = function (arr, iterator, memo) {
        if (arr.reduce) {
            return arr.reduce(iterator, memo);
        }
        _each(arr, function (x, i, a) {
            memo = iterator(memo, x, i, a);
        });
        return memo;
    };

    var _keys = function (obj) {
        if (Object.keys) {
            return Object.keys(obj);
        }
        var keys = [];
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                keys.push(k);
            }
        }
        return keys;
    };

    //// exported async module functions ////

    //// nextTick implementation with browser-compatible fallback ////
    if (typeof process === 'undefined' || !(process.nextTick)) {
        if (typeof setImmediate === 'function') {
            async.nextTick = function (fn) {
                // not a direct alias for IE10 compatibility
                setImmediate(fn);
            };
            async.setImmediate = async.nextTick;
        }
        else {
            async.nextTick = function (fn) {
                setTimeout(fn, 0);
            };
            async.setImmediate = async.nextTick;
        }
    }
    else {
        async.nextTick = process.nextTick;
        if (typeof setImmediate !== 'undefined') {
            async.setImmediate = function (fn) {
              // not a direct alias for IE10 compatibility
              setImmediate(fn);
            };
        }
        else {
            async.setImmediate = async.nextTick;
        }
    }

    async.each = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        _each(arr, function (x) {
            iterator(x, only_once(done) );
        });
        function done(err) {
          if (err) {
              callback(err);
              callback = function () {};
          }
          else {
              completed += 1;
              if (completed >= arr.length) {
                  callback();
              }
          }
        }
    };
    async.forEach = async.each;

    async.eachSeries = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        var iterate = function () {
            iterator(arr[completed], function (err) {
                if (err) {
                    callback(err);
                    callback = function () {};
                }
                else {
                    completed += 1;
                    if (completed >= arr.length) {
                        callback();
                    }
                    else {
                        iterate();
                    }
                }
            });
        };
        iterate();
    };
    async.forEachSeries = async.eachSeries;

    async.eachLimit = function (arr, limit, iterator, callback) {
        var fn = _eachLimit(limit);
        fn.apply(null, [arr, iterator, callback]);
    };
    async.forEachLimit = async.eachLimit;

    var _eachLimit = function (limit) {

        return function (arr, iterator, callback) {
            callback = callback || function () {};
            if (!arr.length || limit <= 0) {
                return callback();
            }
            var completed = 0;
            var started = 0;
            var running = 0;

            (function replenish () {
                if (completed >= arr.length) {
                    return callback();
                }

                while (running < limit && started < arr.length) {
                    started += 1;
                    running += 1;
                    iterator(arr[started - 1], function (err) {
                        if (err) {
                            callback(err);
                            callback = function () {};
                        }
                        else {
                            completed += 1;
                            running -= 1;
                            if (completed >= arr.length) {
                                callback();
                            }
                            else {
                                replenish();
                            }
                        }
                    });
                }
            })();
        };
    };


    var doParallel = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.each].concat(args));
        };
    };
    var doParallelLimit = function(limit, fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [_eachLimit(limit)].concat(args));
        };
    };
    var doSeries = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.eachSeries].concat(args));
        };
    };


    var _asyncMap = function (eachfn, arr, iterator, callback) {
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        if (!callback) {
            eachfn(arr, function (x, callback) {
                iterator(x.value, function (err) {
                    callback(err);
                });
            });
        } else {
            var results = [];
            eachfn(arr, function (x, callback) {
                iterator(x.value, function (err, v) {
                    results[x.index] = v;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };
    async.map = doParallel(_asyncMap);
    async.mapSeries = doSeries(_asyncMap);
    async.mapLimit = function (arr, limit, iterator, callback) {
        return _mapLimit(limit)(arr, iterator, callback);
    };

    var _mapLimit = function(limit) {
        return doParallelLimit(limit, _asyncMap);
    };

    // reduce only has a series version, as doing reduce in parallel won't
    // work in many situations.
    async.reduce = function (arr, memo, iterator, callback) {
        async.eachSeries(arr, function (x, callback) {
            iterator(memo, x, function (err, v) {
                memo = v;
                callback(err);
            });
        }, function (err) {
            callback(err, memo);
        });
    };
    // inject alias
    async.inject = async.reduce;
    // foldl alias
    async.foldl = async.reduce;

    async.reduceRight = function (arr, memo, iterator, callback) {
        var reversed = _map(arr, function (x) {
            return x;
        }).reverse();
        async.reduce(reversed, memo, iterator, callback);
    };
    // foldr alias
    async.foldr = async.reduceRight;

    var _filter = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.filter = doParallel(_filter);
    async.filterSeries = doSeries(_filter);
    // select alias
    async.select = async.filter;
    async.selectSeries = async.filterSeries;

    var _reject = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (!v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.reject = doParallel(_reject);
    async.rejectSeries = doSeries(_reject);

    var _detect = function (eachfn, arr, iterator, main_callback) {
        eachfn(arr, function (x, callback) {
            iterator(x, function (result) {
                if (result) {
                    main_callback(x);
                    main_callback = function () {};
                }
                else {
                    callback();
                }
            });
        }, function (err) {
            main_callback();
        });
    };
    async.detect = doParallel(_detect);
    async.detectSeries = doSeries(_detect);

    async.some = function (arr, iterator, main_callback) {
        async.each(arr, function (x, callback) {
            iterator(x, function (v) {
                if (v) {
                    main_callback(true);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(false);
        });
    };
    // any alias
    async.any = async.some;

    async.every = function (arr, iterator, main_callback) {
        async.each(arr, function (x, callback) {
            iterator(x, function (v) {
                if (!v) {
                    main_callback(false);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(true);
        });
    };
    // all alias
    async.all = async.every;

    async.sortBy = function (arr, iterator, callback) {
        async.map(arr, function (x, callback) {
            iterator(x, function (err, criteria) {
                if (err) {
                    callback(err);
                }
                else {
                    callback(null, {value: x, criteria: criteria});
                }
            });
        }, function (err, results) {
            if (err) {
                return callback(err);
            }
            else {
                var fn = function (left, right) {
                    var a = left.criteria, b = right.criteria;
                    return a < b ? -1 : a > b ? 1 : 0;
                };
                callback(null, _map(results.sort(fn), function (x) {
                    return x.value;
                }));
            }
        });
    };

    async.auto = function (tasks, callback) {
        callback = callback || function () {};
        var keys = _keys(tasks);
        var remainingTasks = keys.length
        if (!remainingTasks) {
            return callback();
        }

        var results = {};

        var listeners = [];
        var addListener = function (fn) {
            listeners.unshift(fn);
        };
        var removeListener = function (fn) {
            for (var i = 0; i < listeners.length; i += 1) {
                if (listeners[i] === fn) {
                    listeners.splice(i, 1);
                    return;
                }
            }
        };
        var taskComplete = function () {
            remainingTasks--
            _each(listeners.slice(0), function (fn) {
                fn();
            });
        };

        addListener(function () {
            if (!remainingTasks) {
                var theCallback = callback;
                // prevent final callback from calling itself if it errors
                callback = function () {};

                theCallback(null, results);
            }
        });

        _each(keys, function (k) {
            var task = _isArray(tasks[k]) ? tasks[k]: [tasks[k]];
            var taskCallback = function (err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (args.length <= 1) {
                    args = args[0];
                }
                if (err) {
                    var safeResults = {};
                    _each(_keys(results), function(rkey) {
                        safeResults[rkey] = results[rkey];
                    });
                    safeResults[k] = args;
                    callback(err, safeResults);
                    // stop subsequent errors hitting callback multiple times
                    callback = function () {};
                }
                else {
                    results[k] = args;
                    async.setImmediate(taskComplete);
                }
            };
            var requires = task.slice(0, Math.abs(task.length - 1)) || [];
            var ready = function () {
                return _reduce(requires, function (a, x) {
                    return (a && results.hasOwnProperty(x));
                }, true) && !results.hasOwnProperty(k);
            };
            if (ready()) {
                task[task.length - 1](taskCallback, results);
            }
            else {
                var listener = function () {
                    if (ready()) {
                        removeListener(listener);
                        task[task.length - 1](taskCallback, results);
                    }
                };
                addListener(listener);
            }
        });
    };

    async.retry = function(times, task, callback) {
        var DEFAULT_TIMES = 5;
        var attempts = [];
        // Use defaults if times not passed
        if (typeof times === 'function') {
            callback = task;
            task = times;
            times = DEFAULT_TIMES;
        }
        // Make sure times is a number
        times = parseInt(times, 10) || DEFAULT_TIMES;
        var wrappedTask = function(wrappedCallback, wrappedResults) {
            var retryAttempt = function(task, finalAttempt) {
                return function(seriesCallback) {
                    task(function(err, result){
                        seriesCallback(!err || finalAttempt, {err: err, result: result});
                    }, wrappedResults);
                };
            };
            while (times) {
                attempts.push(retryAttempt(task, !(times-=1)));
            }
            async.series(attempts, function(done, data){
                data = data[data.length - 1];
                (wrappedCallback || callback)(data.err, data.result);
            });
        }
        // If a callback is passed, run this as a controll flow
        return callback ? wrappedTask() : wrappedTask
    };

    async.waterfall = function (tasks, callback) {
        callback = callback || function () {};
        if (!_isArray(tasks)) {
          var err = new Error('First argument to waterfall must be an array of functions');
          return callback(err);
        }
        if (!tasks.length) {
            return callback();
        }
        var wrapIterator = function (iterator) {
            return function (err) {
                if (err) {
                    callback.apply(null, arguments);
                    callback = function () {};
                }
                else {
                    var args = Array.prototype.slice.call(arguments, 1);
                    var next = iterator.next();
                    if (next) {
                        args.push(wrapIterator(next));
                    }
                    else {
                        args.push(callback);
                    }
                    async.setImmediate(function () {
                        iterator.apply(null, args);
                    });
                }
            };
        };
        wrapIterator(async.iterator(tasks))();
    };

    var _parallel = function(eachfn, tasks, callback) {
        callback = callback || function () {};
        if (_isArray(tasks)) {
            eachfn.map(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            eachfn.each(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.parallel = function (tasks, callback) {
        _parallel({ map: async.map, each: async.each }, tasks, callback);
    };

    async.parallelLimit = function(tasks, limit, callback) {
        _parallel({ map: _mapLimit(limit), each: _eachLimit(limit) }, tasks, callback);
    };

    async.series = function (tasks, callback) {
        callback = callback || function () {};
        if (_isArray(tasks)) {
            async.mapSeries(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            async.eachSeries(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.iterator = function (tasks) {
        var makeCallback = function (index) {
            var fn = function () {
                if (tasks.length) {
                    tasks[index].apply(null, arguments);
                }
                return fn.next();
            };
            fn.next = function () {
                return (index < tasks.length - 1) ? makeCallback(index + 1): null;
            };
            return fn;
        };
        return makeCallback(0);
    };

    async.apply = function (fn) {
        var args = Array.prototype.slice.call(arguments, 1);
        return function () {
            return fn.apply(
                null, args.concat(Array.prototype.slice.call(arguments))
            );
        };
    };

    var _concat = function (eachfn, arr, fn, callback) {
        var r = [];
        eachfn(arr, function (x, cb) {
            fn(x, function (err, y) {
                r = r.concat(y || []);
                cb(err);
            });
        }, function (err) {
            callback(err, r);
        });
    };
    async.concat = doParallel(_concat);
    async.concatSeries = doSeries(_concat);

    async.whilst = function (test, iterator, callback) {
        if (test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.whilst(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.doWhilst = function (iterator, test, callback) {
        iterator(function (err) {
            if (err) {
                return callback(err);
            }
            var args = Array.prototype.slice.call(arguments, 1);
            if (test.apply(null, args)) {
                async.doWhilst(iterator, test, callback);
            }
            else {
                callback();
            }
        });
    };

    async.until = function (test, iterator, callback) {
        if (!test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.until(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.doUntil = function (iterator, test, callback) {
        iterator(function (err) {
            if (err) {
                return callback(err);
            }
            var args = Array.prototype.slice.call(arguments, 1);
            if (!test.apply(null, args)) {
                async.doUntil(iterator, test, callback);
            }
            else {
                callback();
            }
        });
    };

    async.queue = function (worker, concurrency) {
        if (concurrency === undefined) {
            concurrency = 1;
        }
        function _insert(q, data, pos, callback) {
          if (!q.started){
            q.started = true;
          }
          if (!_isArray(data)) {
              data = [data];
          }
          if(data.length == 0) {
             // call drain immediately if there are no tasks
             return async.setImmediate(function() {
                 if (q.drain) {
                     q.drain();
                 }
             });
          }
          _each(data, function(task) {
              var item = {
                  data: task,
                  callback: typeof callback === 'function' ? callback : null
              };

              if (pos) {
                q.tasks.unshift(item);
              } else {
                q.tasks.push(item);
              }

              if (q.saturated && q.tasks.length === q.concurrency) {
                  q.saturated();
              }
              async.setImmediate(q.process);
          });
        }

        var workers = 0;
        var q = {
            tasks: [],
            concurrency: concurrency,
            saturated: null,
            empty: null,
            drain: null,
            started: false,
            paused: false,
            push: function (data, callback) {
              _insert(q, data, false, callback);
            },
            kill: function () {
              q.drain = null;
              q.tasks = [];
            },
            unshift: function (data, callback) {
              _insert(q, data, true, callback);
            },
            process: function () {
                if (!q.paused && workers < q.concurrency && q.tasks.length) {
                    var task = q.tasks.shift();
                    if (q.empty && q.tasks.length === 0) {
                        q.empty();
                    }
                    workers += 1;
                    var next = function () {
                        workers -= 1;
                        if (task.callback) {
                            task.callback.apply(task, arguments);
                        }
                        if (q.drain && q.tasks.length + workers === 0) {
                            q.drain();
                        }
                        q.process();
                    };
                    var cb = only_once(next);
                    worker(task.data, cb);
                }
            },
            length: function () {
                return q.tasks.length;
            },
            running: function () {
                return workers;
            },
            idle: function() {
                return q.tasks.length + workers === 0;
            },
            pause: function () {
                if (q.paused === true) { return; }
                q.paused = true;
            },
            resume: function () {
                if (q.paused === false) { return; }
                q.paused = false;
                // Need to call q.process once per concurrent
                // worker to preserve full concurrency after pause
                for (var w = 1; w <= q.concurrency; w++) {
                    async.setImmediate(q.process);
                }
            }
        };
        return q;
    };

    async.priorityQueue = function (worker, concurrency) {

        function _compareTasks(a, b){
          return a.priority - b.priority;
        };

        function _binarySearch(sequence, item, compare) {
          var beg = -1,
              end = sequence.length - 1;
          while (beg < end) {
            var mid = beg + ((end - beg + 1) >>> 1);
            if (compare(item, sequence[mid]) >= 0) {
              beg = mid;
            } else {
              end = mid - 1;
            }
          }
          return beg;
        }

        function _insert(q, data, priority, callback) {
          if (!q.started){
            q.started = true;
          }
          if (!_isArray(data)) {
              data = [data];
          }
          if(data.length == 0) {
             // call drain immediately if there are no tasks
             return async.setImmediate(function() {
                 if (q.drain) {
                     q.drain();
                 }
             });
          }
          _each(data, function(task) {
              var item = {
                  data: task,
                  priority: priority,
                  callback: typeof callback === 'function' ? callback : null
              };

              q.tasks.splice(_binarySearch(q.tasks, item, _compareTasks) + 1, 0, item);

              if (q.saturated && q.tasks.length === q.concurrency) {
                  q.saturated();
              }
              async.setImmediate(q.process);
          });
        }

        // Start with a normal queue
        var q = async.queue(worker, concurrency);

        // Override push to accept second parameter representing priority
        q.push = function (data, priority, callback) {
          _insert(q, data, priority, callback);
        };

        // Remove unshift function
        delete q.unshift;

        return q;
    };

    async.cargo = function (worker, payload) {
        var working     = false,
            tasks       = [];

        var cargo = {
            tasks: tasks,
            payload: payload,
            saturated: null,
            empty: null,
            drain: null,
            drained: true,
            push: function (data, callback) {
                if (!_isArray(data)) {
                    data = [data];
                }
                _each(data, function(task) {
                    tasks.push({
                        data: task,
                        callback: typeof callback === 'function' ? callback : null
                    });
                    cargo.drained = false;
                    if (cargo.saturated && tasks.length === payload) {
                        cargo.saturated();
                    }
                });
                async.setImmediate(cargo.process);
            },
            process: function process() {
                if (working) return;
                if (tasks.length === 0) {
                    if(cargo.drain && !cargo.drained) cargo.drain();
                    cargo.drained = true;
                    return;
                }

                var ts = typeof payload === 'number'
                            ? tasks.splice(0, payload)
                            : tasks.splice(0, tasks.length);

                var ds = _map(ts, function (task) {
                    return task.data;
                });

                if(cargo.empty) cargo.empty();
                working = true;
                worker(ds, function () {
                    working = false;

                    var args = arguments;
                    _each(ts, function (data) {
                        if (data.callback) {
                            data.callback.apply(null, args);
                        }
                    });

                    process();
                });
            },
            length: function () {
                return tasks.length;
            },
            running: function () {
                return working;
            }
        };
        return cargo;
    };

    var _console_fn = function (name) {
        return function (fn) {
            var args = Array.prototype.slice.call(arguments, 1);
            fn.apply(null, args.concat([function (err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (typeof console !== 'undefined') {
                    if (err) {
                        if (console.error) {
                            console.error(err);
                        }
                    }
                    else if (console[name]) {
                        _each(args, function (x) {
                            console[name](x);
                        });
                    }
                }
            }]));
        };
    };
    async.log = _console_fn('log');
    async.dir = _console_fn('dir');
    /*async.info = _console_fn('info');
    async.warn = _console_fn('warn');
    async.error = _console_fn('error');*/

    async.memoize = function (fn, hasher) {
        var memo = {};
        var queues = {};
        hasher = hasher || function (x) {
            return x;
        };
        var memoized = function () {
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            var key = hasher.apply(null, args);
            if (key in memo) {
                async.nextTick(function () {
                    callback.apply(null, memo[key]);
                });
            }
            else if (key in queues) {
                queues[key].push(callback);
            }
            else {
                queues[key] = [callback];
                fn.apply(null, args.concat([function () {
                    memo[key] = arguments;
                    var q = queues[key];
                    delete queues[key];
                    for (var i = 0, l = q.length; i < l; i++) {
                      q[i].apply(null, arguments);
                    }
                }]));
            }
        };
        memoized.memo = memo;
        memoized.unmemoized = fn;
        return memoized;
    };

    async.unmemoize = function (fn) {
      return function () {
        return (fn.unmemoized || fn).apply(null, arguments);
      };
    };

    async.times = function (count, iterator, callback) {
        var counter = [];
        for (var i = 0; i < count; i++) {
            counter.push(i);
        }
        return async.map(counter, iterator, callback);
    };

    async.timesSeries = function (count, iterator, callback) {
        var counter = [];
        for (var i = 0; i < count; i++) {
            counter.push(i);
        }
        return async.mapSeries(counter, iterator, callback);
    };

    async.seq = function (/* functions... */) {
        var fns = arguments;
        return function () {
            var that = this;
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            async.reduce(fns, args, function (newargs, fn, cb) {
                fn.apply(that, newargs.concat([function () {
                    var err = arguments[0];
                    var nextargs = Array.prototype.slice.call(arguments, 1);
                    cb(err, nextargs);
                }]))
            },
            function (err, results) {
                callback.apply(that, [err].concat(results));
            });
        };
    };

    async.compose = function (/* functions... */) {
      return async.seq.apply(null, Array.prototype.reverse.call(arguments));
    };

    var _applyEach = function (eachfn, fns /*args...*/) {
        var go = function () {
            var that = this;
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            return eachfn(fns, function (fn, cb) {
                fn.apply(that, args.concat([cb]));
            },
            callback);
        };
        if (arguments.length > 2) {
            var args = Array.prototype.slice.call(arguments, 2);
            return go.apply(this, args);
        }
        else {
            return go;
        }
    };
    async.applyEach = doParallel(_applyEach);
    async.applyEachSeries = doSeries(_applyEach);

    async.forever = function (fn, callback) {
        function next(err) {
            if (err) {
                if (callback) {
                    return callback(err);
                }
                throw err;
            }
            fn(next);
        }
        next();
    };

    // Node.js
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = async;
    }
    // AMD / RequireJS
    else if (typeof define !== 'undefined' && define.amd) {
        define([], function () {
            return async;
        });
    }
    // included directly via <script> tag
    else {
        root.async = async;
    }

}());

}).call(this,require('_process'))
},{"_process":23}],2:[function(require,module,exports){
'use strict'

exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

function init () {
  var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  for (var i = 0, len = code.length; i < len; ++i) {
    lookup[i] = code[i]
    revLookup[code.charCodeAt(i)] = i
  }

  revLookup['-'.charCodeAt(0)] = 62
  revLookup['_'.charCodeAt(0)] = 63
}

init()

function toByteArray (b64) {
  var i, j, l, tmp, placeHolders, arr
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // the number of equal signs (place holders)
  // if there are two placeholders, than the two characters before it
  // represent one byte
  // if there is only one, then the three characters before it represent 2 bytes
  // this is just a cheap hack to not do indexOf twice
  placeHolders = b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0

  // base64 is 4/3 + up to two characters of the original data
  arr = new Arr(len * 3 / 4 - placeHolders)

  // if there are placeholders, only get up to the last complete 4 chars
  l = placeHolders > 0 ? len - 4 : len

  var L = 0

  for (i = 0, j = 0; i < l; i += 4, j += 3) {
    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)]
    arr[L++] = (tmp >> 16) & 0xFF
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  if (placeHolders === 2) {
    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[L++] = tmp & 0xFF
  } else if (placeHolders === 1) {
    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var output = ''
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    output += lookup[tmp >> 2]
    output += lookup[(tmp << 4) & 0x3F]
    output += '=='
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + (uint8[len - 1])
    output += lookup[tmp >> 10]
    output += lookup[(tmp >> 4) & 0x3F]
    output += lookup[(tmp << 2) & 0x3F]
    output += '='
  }

  parts.push(output)

  return parts.join('')
}

},{}],3:[function(require,module,exports){

},{}],4:[function(require,module,exports){
(function (global){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('isarray')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : typedArraySupport()

/*
 * Export kMaxLength after typed array support is determined.
 */
exports.kMaxLength = kMaxLength()

function typedArraySupport () {
  try {
    var arr = new Uint8Array(1)
    arr.foo = function () { return 42 }
    return arr.foo() === 42 && // typed array instances can be augmented
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
}

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

function createBuffer (that, length) {
  if (kMaxLength() < length) {
    throw new RangeError('Invalid typed array length')
  }
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = new Uint8Array(length)
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    if (that === null) {
      that = new Buffer(length)
    }
    that.length = length
  }

  return that
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
    return new Buffer(arg, encodingOrOffset, length)
  }

  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe(this, arg)
  }
  return from(this, arg, encodingOrOffset, length)
}

Buffer.poolSize = 8192 // not used by this implementation

// TODO: Legacy, not needed anymore. Remove in next major version.
Buffer._augment = function (arr) {
  arr.__proto__ = Buffer.prototype
  return arr
}

function from (that, value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
    return fromArrayBuffer(that, value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(that, value, encodingOrOffset)
  }

  return fromObject(that, value)
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(null, value, encodingOrOffset, length)
}

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype
  Buffer.__proto__ = Uint8Array
  if (typeof Symbol !== 'undefined' && Symbol.species &&
      Buffer[Symbol.species] === Buffer) {
    // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
    Object.defineProperty(Buffer, Symbol.species, {
      value: null,
      configurable: true
    })
  }
}

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  }
}

function alloc (that, size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(that, size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(that, size).fill(fill, encoding)
      : createBuffer(that, size).fill(fill)
  }
  return createBuffer(that, size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(null, size, fill, encoding)
}

function allocUnsafe (that, size) {
  assertSize(size)
  that = createBuffer(that, size < 0 ? 0 : checked(size) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < size; i++) {
      that[i] = 0
    }
  }
  return that
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(null, size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(null, size)
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  var length = byteLength(string, encoding) | 0
  that = createBuffer(that, length)

  that.write(string, encoding)
  return that
}

function fromArrayLike (that, array) {
  var length = checked(array.length) | 0
  that = createBuffer(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array, byteOffset, length) {
  array.byteLength // this throws if `array` is not a valid ArrayBuffer

  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('\'offset\' is out of bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('\'length\' is out of bounds')
  }

  if (length === undefined) {
    array = new Uint8Array(array, byteOffset)
  } else {
    array = new Uint8Array(array, byteOffset, length)
  }

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = array
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromArrayLike(that, array)
  }
  return that
}

function fromObject (that, obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    that = createBuffer(that, len)

    if (that.length === 0) {
      return that
    }

    obj.copy(that, 0, 0, len)
    return that
  }

  if (obj) {
    if ((typeof ArrayBuffer !== 'undefined' &&
        obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
      if (typeof obj.length !== 'number' || isnan(obj.length)) {
        return createBuffer(that, 0)
      }
      return fromArrayLike(that, obj)
    }

    if (obj.type === 'Buffer' && isArray(obj.data)) {
      return fromArrayLike(that, obj.data)
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
}

function checked (length) {
  // Note: cannot use `length < kMaxLength` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; i++) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var buf = list[i]
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
      (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string
  }

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'binary':
      // Deprecated
      case 'raw':
      case 'raws':
        return len
      case 'utf8':
      case 'utf-8':
      case undefined:
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'binary':
        return binarySlice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
// Buffer instances.
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!Buffer.isBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

function arrayIndexOf (arr, val, byteOffset, encoding) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var foundIndex = -1
  for (var i = 0; byteOffset + i < arrLength; i++) {
    if (read(arr, byteOffset + i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
      if (foundIndex === -1) foundIndex = i
      if (i - foundIndex + 1 === valLength) return (byteOffset + foundIndex) * indexSize
    } else {
      if (foundIndex !== -1) i -= i - foundIndex
      foundIndex = -1
    }
  }
  return -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset >>= 0

  if (this.length === 0) return -1
  if (byteOffset >= this.length) return -1

  // Negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = Math.max(this.length + byteOffset, 0)

  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  if (Buffer.isBuffer(val)) {
    // special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(this, val, byteOffset, encoding)
  }
  if (typeof val === 'number') {
    if (Buffer.TYPED_ARRAY_SUPPORT && Uint8Array.prototype.indexOf === 'function') {
      return Uint8Array.prototype.indexOf.call(this, val, byteOffset)
    }
    return arrayIndexOf(this, [ val ], byteOffset, encoding)
  }

  throw new TypeError('val must be string, number or Buffer')
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new Error('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function binaryWrite (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'binary':
        return binaryWrite(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function binarySlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = this.subarray(start, end)
    newBuf.__proto__ = Buffer.prototype
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
  }

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = (value & 0xff)
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; i--) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; i++) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if (code < 256) {
        val = code
      }
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; i++) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : utf8ToBytes(new Buffer(val, encoding).toString())
    var len = bytes.length
    for (i = 0; i < end - start; i++) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; i++) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

function isnan (val) {
  return val !== val // eslint-disable-line no-self-compare
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"base64-js":2,"ieee754":8,"isarray":11}],5:[function(require,module,exports){
(function (Buffer){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.

function isArray(arg) {
  if (Array.isArray) {
    return Array.isArray(arg);
  }
  return objectToString(arg) === '[object Array]';
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = Buffer.isBuffer;

function objectToString(o) {
  return Object.prototype.toString.call(o);
}

}).call(this,{"isBuffer":require("../../is-buffer/index.js")})
},{"../../is-buffer/index.js":10}],6:[function(require,module,exports){
(function (process,global){
/*!
 * @overview es6-promise - a tiny implementation of Promises/A+.
 * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors (Conversion to ES6 API by Jake Archibald)
 * @license   Licensed under MIT license
 *            See https://raw.githubusercontent.com/jakearchibald/es6-promise/master/LICENSE
 * @version   2.3.0
 */

(function() {
    "use strict";
    function lib$es6$promise$utils$$objectOrFunction(x) {
      return typeof x === 'function' || (typeof x === 'object' && x !== null);
    }

    function lib$es6$promise$utils$$isFunction(x) {
      return typeof x === 'function';
    }

    function lib$es6$promise$utils$$isMaybeThenable(x) {
      return typeof x === 'object' && x !== null;
    }

    var lib$es6$promise$utils$$_isArray;
    if (!Array.isArray) {
      lib$es6$promise$utils$$_isArray = function (x) {
        return Object.prototype.toString.call(x) === '[object Array]';
      };
    } else {
      lib$es6$promise$utils$$_isArray = Array.isArray;
    }

    var lib$es6$promise$utils$$isArray = lib$es6$promise$utils$$_isArray;
    var lib$es6$promise$asap$$len = 0;
    var lib$es6$promise$asap$$toString = {}.toString;
    var lib$es6$promise$asap$$vertxNext;
    var lib$es6$promise$asap$$customSchedulerFn;

    var lib$es6$promise$asap$$asap = function asap(callback, arg) {
      lib$es6$promise$asap$$queue[lib$es6$promise$asap$$len] = callback;
      lib$es6$promise$asap$$queue[lib$es6$promise$asap$$len + 1] = arg;
      lib$es6$promise$asap$$len += 2;
      if (lib$es6$promise$asap$$len === 2) {
        // If len is 2, that means that we need to schedule an async flush.
        // If additional callbacks are queued before the queue is flushed, they
        // will be processed by this flush that we are scheduling.
        if (lib$es6$promise$asap$$customSchedulerFn) {
          lib$es6$promise$asap$$customSchedulerFn(lib$es6$promise$asap$$flush);
        } else {
          lib$es6$promise$asap$$scheduleFlush();
        }
      }
    }

    function lib$es6$promise$asap$$setScheduler(scheduleFn) {
      lib$es6$promise$asap$$customSchedulerFn = scheduleFn;
    }

    function lib$es6$promise$asap$$setAsap(asapFn) {
      lib$es6$promise$asap$$asap = asapFn;
    }

    var lib$es6$promise$asap$$browserWindow = (typeof window !== 'undefined') ? window : undefined;
    var lib$es6$promise$asap$$browserGlobal = lib$es6$promise$asap$$browserWindow || {};
    var lib$es6$promise$asap$$BrowserMutationObserver = lib$es6$promise$asap$$browserGlobal.MutationObserver || lib$es6$promise$asap$$browserGlobal.WebKitMutationObserver;
    var lib$es6$promise$asap$$isNode = typeof process !== 'undefined' && {}.toString.call(process) === '[object process]';

    // test for web worker but not in IE10
    var lib$es6$promise$asap$$isWorker = typeof Uint8ClampedArray !== 'undefined' &&
      typeof importScripts !== 'undefined' &&
      typeof MessageChannel !== 'undefined';

    // node
    function lib$es6$promise$asap$$useNextTick() {
      var nextTick = process.nextTick;
      // node version 0.10.x displays a deprecation warning when nextTick is used recursively
      // setImmediate should be used instead instead
      var version = process.versions.node.match(/^(?:(\d+)\.)?(?:(\d+)\.)?(\*|\d+)$/);
      if (Array.isArray(version) && version[1] === '0' && version[2] === '10') {
        nextTick = setImmediate;
      }
      return function() {
        nextTick(lib$es6$promise$asap$$flush);
      };
    }

    // vertx
    function lib$es6$promise$asap$$useVertxTimer() {
      return function() {
        lib$es6$promise$asap$$vertxNext(lib$es6$promise$asap$$flush);
      };
    }

    function lib$es6$promise$asap$$useMutationObserver() {
      var iterations = 0;
      var observer = new lib$es6$promise$asap$$BrowserMutationObserver(lib$es6$promise$asap$$flush);
      var node = document.createTextNode('');
      observer.observe(node, { characterData: true });

      return function() {
        node.data = (iterations = ++iterations % 2);
      };
    }

    // web worker
    function lib$es6$promise$asap$$useMessageChannel() {
      var channel = new MessageChannel();
      channel.port1.onmessage = lib$es6$promise$asap$$flush;
      return function () {
        channel.port2.postMessage(0);
      };
    }

    function lib$es6$promise$asap$$useSetTimeout() {
      return function() {
        setTimeout(lib$es6$promise$asap$$flush, 1);
      };
    }

    var lib$es6$promise$asap$$queue = new Array(1000);
    function lib$es6$promise$asap$$flush() {
      for (var i = 0; i < lib$es6$promise$asap$$len; i+=2) {
        var callback = lib$es6$promise$asap$$queue[i];
        var arg = lib$es6$promise$asap$$queue[i+1];

        callback(arg);

        lib$es6$promise$asap$$queue[i] = undefined;
        lib$es6$promise$asap$$queue[i+1] = undefined;
      }

      lib$es6$promise$asap$$len = 0;
    }

    function lib$es6$promise$asap$$attemptVertex() {
      try {
        var r = require;
        var vertx = r('vertx');
        lib$es6$promise$asap$$vertxNext = vertx.runOnLoop || vertx.runOnContext;
        return lib$es6$promise$asap$$useVertxTimer();
      } catch(e) {
        return lib$es6$promise$asap$$useSetTimeout();
      }
    }

    var lib$es6$promise$asap$$scheduleFlush;
    // Decide what async method to use to triggering processing of queued callbacks:
    if (lib$es6$promise$asap$$isNode) {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useNextTick();
    } else if (lib$es6$promise$asap$$BrowserMutationObserver) {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useMutationObserver();
    } else if (lib$es6$promise$asap$$isWorker) {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useMessageChannel();
    } else if (lib$es6$promise$asap$$browserWindow === undefined && typeof require === 'function') {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$attemptVertex();
    } else {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useSetTimeout();
    }

    function lib$es6$promise$$internal$$noop() {}

    var lib$es6$promise$$internal$$PENDING   = void 0;
    var lib$es6$promise$$internal$$FULFILLED = 1;
    var lib$es6$promise$$internal$$REJECTED  = 2;

    var lib$es6$promise$$internal$$GET_THEN_ERROR = new lib$es6$promise$$internal$$ErrorObject();

    function lib$es6$promise$$internal$$selfFullfillment() {
      return new TypeError("You cannot resolve a promise with itself");
    }

    function lib$es6$promise$$internal$$cannotReturnOwn() {
      return new TypeError('A promises callback cannot return that same promise.');
    }

    function lib$es6$promise$$internal$$getThen(promise) {
      try {
        return promise.then;
      } catch(error) {
        lib$es6$promise$$internal$$GET_THEN_ERROR.error = error;
        return lib$es6$promise$$internal$$GET_THEN_ERROR;
      }
    }

    function lib$es6$promise$$internal$$tryThen(then, value, fulfillmentHandler, rejectionHandler) {
      try {
        then.call(value, fulfillmentHandler, rejectionHandler);
      } catch(e) {
        return e;
      }
    }

    function lib$es6$promise$$internal$$handleForeignThenable(promise, thenable, then) {
       lib$es6$promise$asap$$asap(function(promise) {
        var sealed = false;
        var error = lib$es6$promise$$internal$$tryThen(then, thenable, function(value) {
          if (sealed) { return; }
          sealed = true;
          if (thenable !== value) {
            lib$es6$promise$$internal$$resolve(promise, value);
          } else {
            lib$es6$promise$$internal$$fulfill(promise, value);
          }
        }, function(reason) {
          if (sealed) { return; }
          sealed = true;

          lib$es6$promise$$internal$$reject(promise, reason);
        }, 'Settle: ' + (promise._label || ' unknown promise'));

        if (!sealed && error) {
          sealed = true;
          lib$es6$promise$$internal$$reject(promise, error);
        }
      }, promise);
    }

    function lib$es6$promise$$internal$$handleOwnThenable(promise, thenable) {
      if (thenable._state === lib$es6$promise$$internal$$FULFILLED) {
        lib$es6$promise$$internal$$fulfill(promise, thenable._result);
      } else if (thenable._state === lib$es6$promise$$internal$$REJECTED) {
        lib$es6$promise$$internal$$reject(promise, thenable._result);
      } else {
        lib$es6$promise$$internal$$subscribe(thenable, undefined, function(value) {
          lib$es6$promise$$internal$$resolve(promise, value);
        }, function(reason) {
          lib$es6$promise$$internal$$reject(promise, reason);
        });
      }
    }

    function lib$es6$promise$$internal$$handleMaybeThenable(promise, maybeThenable) {
      if (maybeThenable.constructor === promise.constructor) {
        lib$es6$promise$$internal$$handleOwnThenable(promise, maybeThenable);
      } else {
        var then = lib$es6$promise$$internal$$getThen(maybeThenable);

        if (then === lib$es6$promise$$internal$$GET_THEN_ERROR) {
          lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$GET_THEN_ERROR.error);
        } else if (then === undefined) {
          lib$es6$promise$$internal$$fulfill(promise, maybeThenable);
        } else if (lib$es6$promise$utils$$isFunction(then)) {
          lib$es6$promise$$internal$$handleForeignThenable(promise, maybeThenable, then);
        } else {
          lib$es6$promise$$internal$$fulfill(promise, maybeThenable);
        }
      }
    }

    function lib$es6$promise$$internal$$resolve(promise, value) {
      if (promise === value) {
        lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$selfFullfillment());
      } else if (lib$es6$promise$utils$$objectOrFunction(value)) {
        lib$es6$promise$$internal$$handleMaybeThenable(promise, value);
      } else {
        lib$es6$promise$$internal$$fulfill(promise, value);
      }
    }

    function lib$es6$promise$$internal$$publishRejection(promise) {
      if (promise._onerror) {
        promise._onerror(promise._result);
      }

      lib$es6$promise$$internal$$publish(promise);
    }

    function lib$es6$promise$$internal$$fulfill(promise, value) {
      if (promise._state !== lib$es6$promise$$internal$$PENDING) { return; }

      promise._result = value;
      promise._state = lib$es6$promise$$internal$$FULFILLED;

      if (promise._subscribers.length !== 0) {
        lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publish, promise);
      }
    }

    function lib$es6$promise$$internal$$reject(promise, reason) {
      if (promise._state !== lib$es6$promise$$internal$$PENDING) { return; }
      promise._state = lib$es6$promise$$internal$$REJECTED;
      promise._result = reason;

      lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publishRejection, promise);
    }

    function lib$es6$promise$$internal$$subscribe(parent, child, onFulfillment, onRejection) {
      var subscribers = parent._subscribers;
      var length = subscribers.length;

      parent._onerror = null;

      subscribers[length] = child;
      subscribers[length + lib$es6$promise$$internal$$FULFILLED] = onFulfillment;
      subscribers[length + lib$es6$promise$$internal$$REJECTED]  = onRejection;

      if (length === 0 && parent._state) {
        lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publish, parent);
      }
    }

    function lib$es6$promise$$internal$$publish(promise) {
      var subscribers = promise._subscribers;
      var settled = promise._state;

      if (subscribers.length === 0) { return; }

      var child, callback, detail = promise._result;

      for (var i = 0; i < subscribers.length; i += 3) {
        child = subscribers[i];
        callback = subscribers[i + settled];

        if (child) {
          lib$es6$promise$$internal$$invokeCallback(settled, child, callback, detail);
        } else {
          callback(detail);
        }
      }

      promise._subscribers.length = 0;
    }

    function lib$es6$promise$$internal$$ErrorObject() {
      this.error = null;
    }

    var lib$es6$promise$$internal$$TRY_CATCH_ERROR = new lib$es6$promise$$internal$$ErrorObject();

    function lib$es6$promise$$internal$$tryCatch(callback, detail) {
      try {
        return callback(detail);
      } catch(e) {
        lib$es6$promise$$internal$$TRY_CATCH_ERROR.error = e;
        return lib$es6$promise$$internal$$TRY_CATCH_ERROR;
      }
    }

    function lib$es6$promise$$internal$$invokeCallback(settled, promise, callback, detail) {
      var hasCallback = lib$es6$promise$utils$$isFunction(callback),
          value, error, succeeded, failed;

      if (hasCallback) {
        value = lib$es6$promise$$internal$$tryCatch(callback, detail);

        if (value === lib$es6$promise$$internal$$TRY_CATCH_ERROR) {
          failed = true;
          error = value.error;
          value = null;
        } else {
          succeeded = true;
        }

        if (promise === value) {
          lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$cannotReturnOwn());
          return;
        }

      } else {
        value = detail;
        succeeded = true;
      }

      if (promise._state !== lib$es6$promise$$internal$$PENDING) {
        // noop
      } else if (hasCallback && succeeded) {
        lib$es6$promise$$internal$$resolve(promise, value);
      } else if (failed) {
        lib$es6$promise$$internal$$reject(promise, error);
      } else if (settled === lib$es6$promise$$internal$$FULFILLED) {
        lib$es6$promise$$internal$$fulfill(promise, value);
      } else if (settled === lib$es6$promise$$internal$$REJECTED) {
        lib$es6$promise$$internal$$reject(promise, value);
      }
    }

    function lib$es6$promise$$internal$$initializePromise(promise, resolver) {
      try {
        resolver(function resolvePromise(value){
          lib$es6$promise$$internal$$resolve(promise, value);
        }, function rejectPromise(reason) {
          lib$es6$promise$$internal$$reject(promise, reason);
        });
      } catch(e) {
        lib$es6$promise$$internal$$reject(promise, e);
      }
    }

    function lib$es6$promise$enumerator$$Enumerator(Constructor, input) {
      var enumerator = this;

      enumerator._instanceConstructor = Constructor;
      enumerator.promise = new Constructor(lib$es6$promise$$internal$$noop);

      if (enumerator._validateInput(input)) {
        enumerator._input     = input;
        enumerator.length     = input.length;
        enumerator._remaining = input.length;

        enumerator._init();

        if (enumerator.length === 0) {
          lib$es6$promise$$internal$$fulfill(enumerator.promise, enumerator._result);
        } else {
          enumerator.length = enumerator.length || 0;
          enumerator._enumerate();
          if (enumerator._remaining === 0) {
            lib$es6$promise$$internal$$fulfill(enumerator.promise, enumerator._result);
          }
        }
      } else {
        lib$es6$promise$$internal$$reject(enumerator.promise, enumerator._validationError());
      }
    }

    lib$es6$promise$enumerator$$Enumerator.prototype._validateInput = function(input) {
      return lib$es6$promise$utils$$isArray(input);
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._validationError = function() {
      return new Error('Array Methods must be provided an Array');
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._init = function() {
      this._result = new Array(this.length);
    };

    var lib$es6$promise$enumerator$$default = lib$es6$promise$enumerator$$Enumerator;

    lib$es6$promise$enumerator$$Enumerator.prototype._enumerate = function() {
      var enumerator = this;

      var length  = enumerator.length;
      var promise = enumerator.promise;
      var input   = enumerator._input;

      for (var i = 0; promise._state === lib$es6$promise$$internal$$PENDING && i < length; i++) {
        enumerator._eachEntry(input[i], i);
      }
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._eachEntry = function(entry, i) {
      var enumerator = this;
      var c = enumerator._instanceConstructor;

      if (lib$es6$promise$utils$$isMaybeThenable(entry)) {
        if (entry.constructor === c && entry._state !== lib$es6$promise$$internal$$PENDING) {
          entry._onerror = null;
          enumerator._settledAt(entry._state, i, entry._result);
        } else {
          enumerator._willSettleAt(c.resolve(entry), i);
        }
      } else {
        enumerator._remaining--;
        enumerator._result[i] = entry;
      }
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._settledAt = function(state, i, value) {
      var enumerator = this;
      var promise = enumerator.promise;

      if (promise._state === lib$es6$promise$$internal$$PENDING) {
        enumerator._remaining--;

        if (state === lib$es6$promise$$internal$$REJECTED) {
          lib$es6$promise$$internal$$reject(promise, value);
        } else {
          enumerator._result[i] = value;
        }
      }

      if (enumerator._remaining === 0) {
        lib$es6$promise$$internal$$fulfill(promise, enumerator._result);
      }
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._willSettleAt = function(promise, i) {
      var enumerator = this;

      lib$es6$promise$$internal$$subscribe(promise, undefined, function(value) {
        enumerator._settledAt(lib$es6$promise$$internal$$FULFILLED, i, value);
      }, function(reason) {
        enumerator._settledAt(lib$es6$promise$$internal$$REJECTED, i, reason);
      });
    };
    function lib$es6$promise$promise$all$$all(entries) {
      return new lib$es6$promise$enumerator$$default(this, entries).promise;
    }
    var lib$es6$promise$promise$all$$default = lib$es6$promise$promise$all$$all;
    function lib$es6$promise$promise$race$$race(entries) {
      /*jshint validthis:true */
      var Constructor = this;

      var promise = new Constructor(lib$es6$promise$$internal$$noop);

      if (!lib$es6$promise$utils$$isArray(entries)) {
        lib$es6$promise$$internal$$reject(promise, new TypeError('You must pass an array to race.'));
        return promise;
      }

      var length = entries.length;

      function onFulfillment(value) {
        lib$es6$promise$$internal$$resolve(promise, value);
      }

      function onRejection(reason) {
        lib$es6$promise$$internal$$reject(promise, reason);
      }

      for (var i = 0; promise._state === lib$es6$promise$$internal$$PENDING && i < length; i++) {
        lib$es6$promise$$internal$$subscribe(Constructor.resolve(entries[i]), undefined, onFulfillment, onRejection);
      }

      return promise;
    }
    var lib$es6$promise$promise$race$$default = lib$es6$promise$promise$race$$race;
    function lib$es6$promise$promise$resolve$$resolve(object) {
      /*jshint validthis:true */
      var Constructor = this;

      if (object && typeof object === 'object' && object.constructor === Constructor) {
        return object;
      }

      var promise = new Constructor(lib$es6$promise$$internal$$noop);
      lib$es6$promise$$internal$$resolve(promise, object);
      return promise;
    }
    var lib$es6$promise$promise$resolve$$default = lib$es6$promise$promise$resolve$$resolve;
    function lib$es6$promise$promise$reject$$reject(reason) {
      /*jshint validthis:true */
      var Constructor = this;
      var promise = new Constructor(lib$es6$promise$$internal$$noop);
      lib$es6$promise$$internal$$reject(promise, reason);
      return promise;
    }
    var lib$es6$promise$promise$reject$$default = lib$es6$promise$promise$reject$$reject;

    var lib$es6$promise$promise$$counter = 0;

    function lib$es6$promise$promise$$needsResolver() {
      throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
    }

    function lib$es6$promise$promise$$needsNew() {
      throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
    }

    var lib$es6$promise$promise$$default = lib$es6$promise$promise$$Promise;
    /**
      Promise objects represent the eventual result of an asynchronous operation. The
      primary way of interacting with a promise is through its `then` method, which
      registers callbacks to receive either a promise's eventual value or the reason
      why the promise cannot be fulfilled.

      Terminology
      -----------

      - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
      - `thenable` is an object or function that defines a `then` method.
      - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
      - `exception` is a value that is thrown using the throw statement.
      - `reason` is a value that indicates why a promise was rejected.
      - `settled` the final resting state of a promise, fulfilled or rejected.

      A promise can be in one of three states: pending, fulfilled, or rejected.

      Promises that are fulfilled have a fulfillment value and are in the fulfilled
      state.  Promises that are rejected have a rejection reason and are in the
      rejected state.  A fulfillment value is never a thenable.

      Promises can also be said to *resolve* a value.  If this value is also a
      promise, then the original promise's settled state will match the value's
      settled state.  So a promise that *resolves* a promise that rejects will
      itself reject, and a promise that *resolves* a promise that fulfills will
      itself fulfill.


      Basic Usage:
      ------------

      ```js
      var promise = new Promise(function(resolve, reject) {
        // on success
        resolve(value);

        // on failure
        reject(reason);
      });

      promise.then(function(value) {
        // on fulfillment
      }, function(reason) {
        // on rejection
      });
      ```

      Advanced Usage:
      ---------------

      Promises shine when abstracting away asynchronous interactions such as
      `XMLHttpRequest`s.

      ```js
      function getJSON(url) {
        return new Promise(function(resolve, reject){
          var xhr = new XMLHttpRequest();

          xhr.open('GET', url);
          xhr.onreadystatechange = handler;
          xhr.responseType = 'json';
          xhr.setRequestHeader('Accept', 'application/json');
          xhr.send();

          function handler() {
            if (this.readyState === this.DONE) {
              if (this.status === 200) {
                resolve(this.response);
              } else {
                reject(new Error('getJSON: `' + url + '` failed with status: [' + this.status + ']'));
              }
            }
          };
        });
      }

      getJSON('/posts.json').then(function(json) {
        // on fulfillment
      }, function(reason) {
        // on rejection
      });
      ```

      Unlike callbacks, promises are great composable primitives.

      ```js
      Promise.all([
        getJSON('/posts'),
        getJSON('/comments')
      ]).then(function(values){
        values[0] // => postsJSON
        values[1] // => commentsJSON

        return values;
      });
      ```

      @class Promise
      @param {function} resolver
      Useful for tooling.
      @constructor
    */
    function lib$es6$promise$promise$$Promise(resolver) {
      this._id = lib$es6$promise$promise$$counter++;
      this._state = undefined;
      this._result = undefined;
      this._subscribers = [];

      if (lib$es6$promise$$internal$$noop !== resolver) {
        if (!lib$es6$promise$utils$$isFunction(resolver)) {
          lib$es6$promise$promise$$needsResolver();
        }

        if (!(this instanceof lib$es6$promise$promise$$Promise)) {
          lib$es6$promise$promise$$needsNew();
        }

        lib$es6$promise$$internal$$initializePromise(this, resolver);
      }
    }

    lib$es6$promise$promise$$Promise.all = lib$es6$promise$promise$all$$default;
    lib$es6$promise$promise$$Promise.race = lib$es6$promise$promise$race$$default;
    lib$es6$promise$promise$$Promise.resolve = lib$es6$promise$promise$resolve$$default;
    lib$es6$promise$promise$$Promise.reject = lib$es6$promise$promise$reject$$default;
    lib$es6$promise$promise$$Promise._setScheduler = lib$es6$promise$asap$$setScheduler;
    lib$es6$promise$promise$$Promise._setAsap = lib$es6$promise$asap$$setAsap;
    lib$es6$promise$promise$$Promise._asap = lib$es6$promise$asap$$asap;

    lib$es6$promise$promise$$Promise.prototype = {
      constructor: lib$es6$promise$promise$$Promise,

    /**
      The primary way of interacting with a promise is through its `then` method,
      which registers callbacks to receive either a promise's eventual value or the
      reason why the promise cannot be fulfilled.

      ```js
      findUser().then(function(user){
        // user is available
      }, function(reason){
        // user is unavailable, and you are given the reason why
      });
      ```

      Chaining
      --------

      The return value of `then` is itself a promise.  This second, 'downstream'
      promise is resolved with the return value of the first promise's fulfillment
      or rejection handler, or rejected if the handler throws an exception.

      ```js
      findUser().then(function (user) {
        return user.name;
      }, function (reason) {
        return 'default name';
      }).then(function (userName) {
        // If `findUser` fulfilled, `userName` will be the user's name, otherwise it
        // will be `'default name'`
      });

      findUser().then(function (user) {
        throw new Error('Found user, but still unhappy');
      }, function (reason) {
        throw new Error('`findUser` rejected and we're unhappy');
      }).then(function (value) {
        // never reached
      }, function (reason) {
        // if `findUser` fulfilled, `reason` will be 'Found user, but still unhappy'.
        // If `findUser` rejected, `reason` will be '`findUser` rejected and we're unhappy'.
      });
      ```
      If the downstream promise does not specify a rejection handler, rejection reasons will be propagated further downstream.

      ```js
      findUser().then(function (user) {
        throw new PedagogicalException('Upstream error');
      }).then(function (value) {
        // never reached
      }).then(function (value) {
        // never reached
      }, function (reason) {
        // The `PedgagocialException` is propagated all the way down to here
      });
      ```

      Assimilation
      ------------

      Sometimes the value you want to propagate to a downstream promise can only be
      retrieved asynchronously. This can be achieved by returning a promise in the
      fulfillment or rejection handler. The downstream promise will then be pending
      until the returned promise is settled. This is called *assimilation*.

      ```js
      findUser().then(function (user) {
        return findCommentsByAuthor(user);
      }).then(function (comments) {
        // The user's comments are now available
      });
      ```

      If the assimliated promise rejects, then the downstream promise will also reject.

      ```js
      findUser().then(function (user) {
        return findCommentsByAuthor(user);
      }).then(function (comments) {
        // If `findCommentsByAuthor` fulfills, we'll have the value here
      }, function (reason) {
        // If `findCommentsByAuthor` rejects, we'll have the reason here
      });
      ```

      Simple Example
      --------------

      Synchronous Example

      ```javascript
      var result;

      try {
        result = findResult();
        // success
      } catch(reason) {
        // failure
      }
      ```

      Errback Example

      ```js
      findResult(function(result, err){
        if (err) {
          // failure
        } else {
          // success
        }
      });
      ```

      Promise Example;

      ```javascript
      findResult().then(function(result){
        // success
      }, function(reason){
        // failure
      });
      ```

      Advanced Example
      --------------

      Synchronous Example

      ```javascript
      var author, books;

      try {
        author = findAuthor();
        books  = findBooksByAuthor(author);
        // success
      } catch(reason) {
        // failure
      }
      ```

      Errback Example

      ```js

      function foundBooks(books) {

      }

      function failure(reason) {

      }

      findAuthor(function(author, err){
        if (err) {
          failure(err);
          // failure
        } else {
          try {
            findBoooksByAuthor(author, function(books, err) {
              if (err) {
                failure(err);
              } else {
                try {
                  foundBooks(books);
                } catch(reason) {
                  failure(reason);
                }
              }
            });
          } catch(error) {
            failure(err);
          }
          // success
        }
      });
      ```

      Promise Example;

      ```javascript
      findAuthor().
        then(findBooksByAuthor).
        then(function(books){
          // found books
      }).catch(function(reason){
        // something went wrong
      });
      ```

      @method then
      @param {Function} onFulfilled
      @param {Function} onRejected
      Useful for tooling.
      @return {Promise}
    */
      then: function(onFulfillment, onRejection) {
        var parent = this;
        var state = parent._state;

        if (state === lib$es6$promise$$internal$$FULFILLED && !onFulfillment || state === lib$es6$promise$$internal$$REJECTED && !onRejection) {
          return this;
        }

        var child = new this.constructor(lib$es6$promise$$internal$$noop);
        var result = parent._result;

        if (state) {
          var callback = arguments[state - 1];
          lib$es6$promise$asap$$asap(function(){
            lib$es6$promise$$internal$$invokeCallback(state, child, callback, result);
          });
        } else {
          lib$es6$promise$$internal$$subscribe(parent, child, onFulfillment, onRejection);
        }

        return child;
      },

    /**
      `catch` is simply sugar for `then(undefined, onRejection)` which makes it the same
      as the catch block of a try/catch statement.

      ```js
      function findAuthor(){
        throw new Error('couldn't find that author');
      }

      // synchronous
      try {
        findAuthor();
      } catch(reason) {
        // something went wrong
      }

      // async with promises
      findAuthor().catch(function(reason){
        // something went wrong
      });
      ```

      @method catch
      @param {Function} onRejection
      Useful for tooling.
      @return {Promise}
    */
      'catch': function(onRejection) {
        return this.then(null, onRejection);
      }
    };
    function lib$es6$promise$polyfill$$polyfill() {
      var local;

      if (typeof global !== 'undefined') {
          local = global;
      } else if (typeof self !== 'undefined') {
          local = self;
      } else {
          try {
              local = Function('return this')();
          } catch (e) {
              throw new Error('polyfill failed because global object is unavailable in this environment');
          }
      }

      var P = local.Promise;

      if (P && Object.prototype.toString.call(P.resolve()) === '[object Promise]' && !P.cast) {
        return;
      }

      local.Promise = lib$es6$promise$promise$$default;
    }
    var lib$es6$promise$polyfill$$default = lib$es6$promise$polyfill$$polyfill;

    var lib$es6$promise$umd$$ES6Promise = {
      'Promise': lib$es6$promise$promise$$default,
      'polyfill': lib$es6$promise$polyfill$$default
    };

    /* global define:true module:true window: true */
    if (typeof define === 'function' && define['amd']) {
      define(function() { return lib$es6$promise$umd$$ES6Promise; });
    } else if (typeof module !== 'undefined' && module['exports']) {
      module['exports'] = lib$es6$promise$umd$$ES6Promise;
    } else if (typeof this !== 'undefined') {
      this['ES6Promise'] = lib$es6$promise$umd$$ES6Promise;
    }

    lib$es6$promise$polyfill$$default();
}).call(this);


}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":23}],7:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],8:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],9:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],10:[function(require,module,exports){
/**
 * Determine if an object is Buffer
 *
 * Author:   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * License:  MIT
 *
 * `npm install is-buffer`
 */

module.exports = function (obj) {
  return !!(obj != null &&
    (obj._isBuffer || // For Safari 5-7 (missing Object.prototype.constructor)
      (obj.constructor &&
      typeof obj.constructor.isBuffer === 'function' &&
      obj.constructor.isBuffer(obj))
    ))
}

},{}],11:[function(require,module,exports){
var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

},{}],12:[function(require,module,exports){
// Ignore module for browserify (see package.json)
},{}],13:[function(require,module,exports){
(function (process,global,__dirname){
/**
 * A JavaScript implementation of the JSON-LD API.
 *
 * @author Dave Longley
 *
 * @license BSD 3-Clause License
 * Copyright (c) 2011-2015 Digital Bazaar, Inc.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * Redistributions of source code must retain the above copyright notice,
 * this list of conditions and the following disclaimer.
 *
 * Redistributions in binary form must reproduce the above copyright
 * notice, this list of conditions and the following disclaimer in the
 * documentation and/or other materials provided with the distribution.
 *
 * Neither the name of the Digital Bazaar, Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
 * IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
 * TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
 * PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
 * TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
(function() {

// determine if in-browser or using node.js
var _nodejs = (
  typeof process !== 'undefined' && process.versions && process.versions.node);
var _browser = !_nodejs &&
  (typeof window !== 'undefined' || typeof self !== 'undefined');
if(_browser) {
  if(typeof global === 'undefined') {
    if(typeof window !== 'undefined') {
      global = window;
    } else if(typeof self !== 'undefined') {
      global = self;
    } else if(typeof $ !== 'undefined') {
      global = $;
    }
  }
}

// attaches jsonld API to the given object
var wrapper = function(jsonld) {

/* Core API */

/**
 * Performs JSON-LD compaction.
 *
 * @param input the JSON-LD input to compact.
 * @param ctx the context to compact with.
 * @param [options] options to use:
 *          [base] the base IRI to use.
 *          [compactArrays] true to compact arrays to single values when
 *            appropriate, false not to (default: true).
 *          [graph] true to always output a top-level graph (default: false).
 *          [expandContext] a context to expand with.
 *          [skipExpansion] true to assume the input is expanded and skip
 *            expansion, false not to, defaults to false.
 *          [documentLoader(url, callback(err, remoteDoc))] the document loader.
 * @param callback(err, compacted, ctx) called once the operation completes.
 */
jsonld.compact = function(input, ctx, options, callback) {
  if(arguments.length < 2) {
    return jsonld.nextTick(function() {
      callback(new TypeError('Could not compact, too few arguments.'));
    });
  }

  // get arguments
  if(typeof options === 'function') {
    callback = options;
    options = {};
  }
  options = options || {};

  if(ctx === null) {
    return jsonld.nextTick(function() {
      callback(new JsonLdError(
        'The compaction context must not be null.',
        'jsonld.CompactError', {code: 'invalid local context'}));
    });
  }

  // nothing to compact
  if(input === null) {
    return jsonld.nextTick(function() {
      callback(null, null);
    });
  }

  // set default options
  if(!('base' in options)) {
    options.base = (typeof input === 'string') ? input : '';
  }
  if(!('compactArrays' in options)) {
    options.compactArrays = true;
  }
  if(!('graph' in options)) {
    options.graph = false;
  }
  if(!('skipExpansion' in options)) {
    options.skipExpansion = false;
  }
  if(!('documentLoader' in options)) {
    options.documentLoader = jsonld.loadDocument;
  }
  if(!('link' in options)) {
    options.link = false;
  }
  if(options.link) {
    // force skip expansion when linking, "link" is not part of the public
    // API, it should only be called from framing
    options.skipExpansion = true;
  }

  var expand = function(input, options, callback) {
    jsonld.nextTick(function() {
      if(options.skipExpansion) {
        return callback(null, input);
      }
      jsonld.expand(input, options, callback);
    });
  };

  // expand input then do compaction
  expand(input, options, function(err, expanded) {
    if(err) {
      return callback(new JsonLdError(
        'Could not expand input before compaction.',
        'jsonld.CompactError', {cause: err}));
    }

    // process context
    var activeCtx = _getInitialContext(options);
    jsonld.processContext(activeCtx, ctx, options, function(err, activeCtx) {
      if(err) {
        return callback(new JsonLdError(
          'Could not process context before compaction.',
          'jsonld.CompactError', {cause: err}));
      }

      var compacted;
      try {
        // do compaction
        compacted = new Processor().compact(activeCtx, null, expanded, options);
      } catch(ex) {
        return callback(ex);
      }

      cleanup(null, compacted, activeCtx, options);
    });
  });

  // performs clean up after compaction
  function cleanup(err, compacted, activeCtx, options) {
    if(err) {
      return callback(err);
    }

    if(options.compactArrays && !options.graph && _isArray(compacted)) {
      if(compacted.length === 1) {
        // simplify to a single item
        compacted = compacted[0];
      } else if(compacted.length === 0) {
        // simplify to an empty object
        compacted = {};
      }
    } else if(options.graph && _isObject(compacted)) {
      // always use array if graph option is on
      compacted = [compacted];
    }

    // follow @context key
    if(_isObject(ctx) && '@context' in ctx) {
      ctx = ctx['@context'];
    }

    // build output context
    ctx = _clone(ctx);
    if(!_isArray(ctx)) {
      ctx = [ctx];
    }
    // remove empty contexts
    var tmp = ctx;
    ctx = [];
    for(var i = 0; i < tmp.length; ++i) {
      if(!_isObject(tmp[i]) || Object.keys(tmp[i]).length > 0) {
        ctx.push(tmp[i]);
      }
    }

    // remove array if only one context
    var hasContext = (ctx.length > 0);
    if(ctx.length === 1) {
      ctx = ctx[0];
    }

    // add context and/or @graph
    if(_isArray(compacted)) {
      // use '@graph' keyword
      var kwgraph = _compactIri(activeCtx, '@graph');
      var graph = compacted;
      compacted = {};
      if(hasContext) {
        compacted['@context'] = ctx;
      }
      compacted[kwgraph] = graph;
    } else if(_isObject(compacted) && hasContext) {
      // reorder keys so @context is first
      var graph = compacted;
      compacted = {'@context': ctx};
      for(var key in graph) {
        compacted[key] = graph[key];
      }
    }

    callback(null, compacted, activeCtx);
  }
};

/**
 * Performs JSON-LD expansion.
 *
 * @param input the JSON-LD input to expand.
 * @param [options] the options to use:
 *          [base] the base IRI to use.
 *          [expandContext] a context to expand with.
 *          [keepFreeFloatingNodes] true to keep free-floating nodes,
 *            false not to, defaults to false.
 *          [documentLoader(url, callback(err, remoteDoc))] the document loader.
 * @param callback(err, expanded) called once the operation completes.
 */
jsonld.expand = function(input, options, callback) {
  if(arguments.length < 1) {
    return jsonld.nextTick(function() {
      callback(new TypeError('Could not expand, too few arguments.'));
    });
  }

  // get arguments
  if(typeof options === 'function') {
    callback = options;
    options = {};
  }
  options = options || {};

  // set default options
  if(!('documentLoader' in options)) {
    options.documentLoader = jsonld.loadDocument;
  }
  if(!('keepFreeFloatingNodes' in options)) {
    options.keepFreeFloatingNodes = false;
  }

  jsonld.nextTick(function() {
    // if input is a string, attempt to dereference remote document
    if(typeof input === 'string') {
      var done = function(err, remoteDoc) {
        if(err) {
          return callback(err);
        }
        try {
          if(!remoteDoc.document) {
            throw new JsonLdError(
              'No remote document found at the given URL.',
              'jsonld.NullRemoteDocument');
          }
          if(typeof remoteDoc.document === 'string') {
            remoteDoc.document = JSON.parse(remoteDoc.document);
          }
        } catch(ex) {
          return callback(new JsonLdError(
            'Could not retrieve a JSON-LD document from the URL. URL ' +
            'dereferencing not implemented.', 'jsonld.LoadDocumentError', {
              code: 'loading document failed',
              cause: ex,
              remoteDoc: remoteDoc
          }));
        }
        expand(remoteDoc);
      };
      var promise = options.documentLoader(input, done);
      if(promise && 'then' in promise) {
        promise.then(done.bind(null, null), done);
      }
      return;
    }
    // nothing to load
    expand({contextUrl: null, documentUrl: null, document: input});
  });

  function expand(remoteDoc) {
    // set default base
    if(!('base' in options)) {
      options.base = remoteDoc.documentUrl || '';
    }
    // build meta-object and retrieve all @context URLs
    var input = {
      document: _clone(remoteDoc.document),
      remoteContext: {'@context': remoteDoc.contextUrl}
    };
    if('expandContext' in options) {
      var expandContext = _clone(options.expandContext);
      if(typeof expandContext === 'object' && '@context' in expandContext) {
        input.expandContext = expandContext;
      } else {
        input.expandContext = {'@context': expandContext};
      }
    }
    _retrieveContextUrls(input, options, function(err, input) {
      if(err) {
        return callback(err);
      }

      var expanded;
      try {
        var processor = new Processor();
        var activeCtx = _getInitialContext(options);
        var document = input.document;
        var remoteContext = input.remoteContext['@context'];

        // process optional expandContext
        if(input.expandContext) {
          activeCtx = processor.processContext(
            activeCtx, input.expandContext['@context'], options);
        }

        // process remote context from HTTP Link Header
        if(remoteContext) {
          activeCtx = processor.processContext(
            activeCtx, remoteContext, options);
        }

        // expand document
        expanded = processor.expand(
          activeCtx, null, document, options, false);

        // optimize away @graph with no other properties
        if(_isObject(expanded) && ('@graph' in expanded) &&
          Object.keys(expanded).length === 1) {
          expanded = expanded['@graph'];
        } else if(expanded === null) {
          expanded = [];
        }

        // normalize to an array
        if(!_isArray(expanded)) {
          expanded = [expanded];
        }
      } catch(ex) {
        return callback(ex);
      }
      callback(null, expanded);
    });
  }
};

/**
 * Performs JSON-LD flattening.
 *
 * @param input the JSON-LD to flatten.
 * @param ctx the context to use to compact the flattened output, or null.
 * @param [options] the options to use:
 *          [base] the base IRI to use.
 *          [expandContext] a context to expand with.
 *          [documentLoader(url, callback(err, remoteDoc))] the document loader.
 * @param callback(err, flattened) called once the operation completes.
 */
jsonld.flatten = function(input, ctx, options, callback) {
  if(arguments.length < 1) {
    return jsonld.nextTick(function() {
      callback(new TypeError('Could not flatten, too few arguments.'));
    });
  }

  // get arguments
  if(typeof options === 'function') {
    callback = options;
    options = {};
  } else if(typeof ctx === 'function') {
    callback = ctx;
    ctx = null;
    options = {};
  }
  options = options || {};

  // set default options
  if(!('base' in options)) {
    options.base = (typeof input === 'string') ? input : '';
  }
  if(!('documentLoader' in options)) {
    options.documentLoader = jsonld.loadDocument;
  }

  // expand input
  jsonld.expand(input, options, function(err, _input) {
    if(err) {
      return callback(new JsonLdError(
        'Could not expand input before flattening.',
        'jsonld.FlattenError', {cause: err}));
    }

    var flattened;
    try {
      // do flattening
      flattened = new Processor().flatten(_input);
    } catch(ex) {
      return callback(ex);
    }

    if(ctx === null) {
      return callback(null, flattened);
    }

    // compact result (force @graph option to true, skip expansion)
    options.graph = true;
    options.skipExpansion = true;
    jsonld.compact(flattened, ctx, options, function(err, compacted) {
      if(err) {
        return callback(new JsonLdError(
          'Could not compact flattened output.',
          'jsonld.FlattenError', {cause: err}));
      }
      callback(null, compacted);
    });
  });
};

/**
 * Performs JSON-LD framing.
 *
 * @param input the JSON-LD input to frame.
 * @param frame the JSON-LD frame to use.
 * @param [options] the framing options.
 *          [base] the base IRI to use.
 *          [expandContext] a context to expand with.
 *          [embed] default @embed flag: '@last', '@always', '@never', '@link'
 *            (default: '@last').
 *          [explicit] default @explicit flag (default: false).
 *          [requireAll] default @requireAll flag (default: true).
 *          [omitDefault] default @omitDefault flag (default: false).
 *          [documentLoader(url, callback(err, remoteDoc))] the document loader.
 * @param callback(err, framed) called once the operation completes.
 */
jsonld.frame = function(input, frame, options, callback) {
  if(arguments.length < 2) {
    return jsonld.nextTick(function() {
      callback(new TypeError('Could not frame, too few arguments.'));
    });
  }

  // get arguments
  if(typeof options === 'function') {
    callback = options;
    options = {};
  }
  options = options || {};

  // set default options
  if(!('base' in options)) {
    options.base = (typeof input === 'string') ? input : '';
  }
  if(!('documentLoader' in options)) {
    options.documentLoader = jsonld.loadDocument;
  }
  if(!('embed' in options)) {
    options.embed = '@last';
  }
  options.explicit = options.explicit || false;
  if(!('requireAll' in options)) {
    options.requireAll = true;
  }
  options.omitDefault = options.omitDefault || false;

  jsonld.nextTick(function() {
    // if frame is a string, attempt to dereference remote document
    if(typeof frame === 'string') {
      var done = function(err, remoteDoc) {
        if(err) {
          return callback(err);
        }
        try {
          if(!remoteDoc.document) {
            throw new JsonLdError(
              'No remote document found at the given URL.',
              'jsonld.NullRemoteDocument');
          }
          if(typeof remoteDoc.document === 'string') {
            remoteDoc.document = JSON.parse(remoteDoc.document);
          }
        } catch(ex) {
          return callback(new JsonLdError(
            'Could not retrieve a JSON-LD document from the URL. URL ' +
            'dereferencing not implemented.', 'jsonld.LoadDocumentError', {
              code: 'loading document failed',
              cause: ex,
              remoteDoc: remoteDoc
          }));
        }
        doFrame(remoteDoc);
      };
      var promise = options.documentLoader(frame, done);
      if(promise && 'then' in promise) {
        promise.then(done.bind(null, null), done);
      }
      return;
    }
    // nothing to load
    doFrame({contextUrl: null, documentUrl: null, document: frame});
  });

  function doFrame(remoteFrame) {
    // preserve frame context and add any Link header context
    var frame = remoteFrame.document;
    var ctx;
    if(frame) {
      ctx = frame['@context'];
      if(remoteFrame.contextUrl) {
        if(!ctx) {
          ctx = remoteFrame.contextUrl;
        } else if(_isArray(ctx)) {
          ctx.push(remoteFrame.contextUrl);
        } else {
          ctx = [ctx, remoteFrame.contextUrl];
        }
        frame['@context'] = ctx;
      } else {
        ctx = ctx || {};
      }
    } else {
      ctx = {};
    }

    // expand input
    jsonld.expand(input, options, function(err, expanded) {
      if(err) {
        return callback(new JsonLdError(
          'Could not expand input before framing.',
          'jsonld.FrameError', {cause: err}));
      }

      // expand frame
      var opts = _clone(options);
      opts.isFrame = true;
      opts.keepFreeFloatingNodes = true;
      jsonld.expand(frame, opts, function(err, expandedFrame) {
        if(err) {
          return callback(new JsonLdError(
            'Could not expand frame before framing.',
            'jsonld.FrameError', {cause: err}));
        }

        var framed;
        try {
          // do framing
          framed = new Processor().frame(expanded, expandedFrame, opts);
        } catch(ex) {
          return callback(ex);
        }

        // compact result (force @graph option to true, skip expansion,
        // check for linked embeds)
        opts.graph = true;
        opts.skipExpansion = true;
        opts.link = {};
        jsonld.compact(framed, ctx, opts, function(err, compacted, ctx) {
          if(err) {
            return callback(new JsonLdError(
              'Could not compact framed output.',
              'jsonld.FrameError', {cause: err}));
          }
          // get graph alias
          var graph = _compactIri(ctx, '@graph');
          // remove @preserve from results
          opts.link = {};
          compacted[graph] = _removePreserve(ctx, compacted[graph], opts);
          callback(null, compacted);
        });
      });
    });
  }
};

/**
 * **Experimental**
 *
 * Links a JSON-LD document's nodes in memory.
 *
 * @param input the JSON-LD document to link.
 * @param ctx the JSON-LD context to apply.
 * @param [options] the options to use:
 *          [base] the base IRI to use.
 *          [expandContext] a context to expand with.
 *          [documentLoader(url, callback(err, remoteDoc))] the document loader.
 * @param callback(err, linked) called once the operation completes.
 */
jsonld.link = function(input, ctx, options, callback) {
  // API matches running frame with a wildcard frame and embed: '@link'
  // get arguments
  var frame = {};
  if(ctx) {
    frame['@context'] = ctx;
  }
  frame['@embed'] = '@link';
  jsonld.frame(input, frame, options, callback);
};

/**
 * **Deprecated**
 *
 * Performs JSON-LD objectification.
 *
 * @param input the JSON-LD document to objectify.
 * @param ctx the JSON-LD context to apply.
 * @param [options] the options to use:
 *          [base] the base IRI to use.
 *          [expandContext] a context to expand with.
 *          [documentLoader(url, callback(err, remoteDoc))] the document loader.
 * @param callback(err, linked) called once the operation completes.
 */
jsonld.objectify = function(input, ctx, options, callback) {
  if(typeof options === 'function') {
    callback = options;
    options = {};
  }
  options = options || {};

  // set default options
  if(!('base' in options)) {
    options.base = (typeof input === 'string') ? input : '';
  }
  if(!('documentLoader' in options)) {
    options.documentLoader = jsonld.loadDocument;
  }

  // expand input
  jsonld.expand(input, options, function(err, _input) {
    if(err) {
      return callback(new JsonLdError(
        'Could not expand input before linking.',
        'jsonld.LinkError', {cause: err}));
    }

    var flattened;
    try {
      // flatten the graph
      flattened = new Processor().flatten(_input);
    } catch(ex) {
      return callback(ex);
    }

    // compact result (force @graph option to true, skip expansion)
    options.graph = true;
    options.skipExpansion = true;
    jsonld.compact(flattened, ctx, options, function(err, compacted, ctx) {
      if(err) {
        return callback(new JsonLdError(
          'Could not compact flattened output before linking.',
          'jsonld.LinkError', {cause: err}));
      }
      // get graph alias
      var graph = _compactIri(ctx, '@graph');
      var top = compacted[graph][0];

      var recurse = function(subject) {
        // can't replace just a string
        if(!_isObject(subject) && !_isArray(subject)) {
          return;
        }

        // bottom out recursion on re-visit
        if(_isObject(subject)) {
          if(recurse.visited[subject['@id']]) {
            return;
          }
          recurse.visited[subject['@id']] = true;
        }

        // each array element *or* object key
        for(var k in subject) {
          var obj = subject[k];
          var isid = (jsonld.getContextValue(ctx, k, '@type') === '@id');

          // can't replace a non-object or non-array unless it's an @id
          if(!_isArray(obj) && !_isObject(obj) && !isid) {
            continue;
          }

          if(_isString(obj) && isid) {
            subject[k] = obj = top[obj];
            recurse(obj);
          } else if(_isArray(obj)) {
            for(var i = 0; i < obj.length; ++i) {
              if(_isString(obj[i]) && isid) {
                obj[i] = top[obj[i]];
              } else if(_isObject(obj[i]) && '@id' in obj[i]) {
                obj[i] = top[obj[i]['@id']];
              }
              recurse(obj[i]);
            }
          } else if(_isObject(obj)) {
            var sid = obj['@id'];
            subject[k] = obj = top[sid];
            recurse(obj);
          }
        }
      };
      recurse.visited = {};
      recurse(top);

      compacted.of_type = {};
      for(var s in top) {
        if(!('@type' in top[s])) {
          continue;
        }
        var types = top[s]['@type'];
        if(!_isArray(types)) {
          types = [types];
        }
        for(var t = 0; t < types.length; ++t) {
          if(!(types[t] in compacted.of_type)) {
            compacted.of_type[types[t]] = [];
          }
          compacted.of_type[types[t]].push(top[s]);
        }
      }
      callback(null, compacted);
    });
  });
};

/**
 * Performs RDF dataset normalization on the given input. The input is JSON-LD
 * unless the 'inputFormat' option is used. The output is an RDF dataset
 * unless the 'format' option is used.
 *
 * @param input the input to normalize as JSON-LD or as a format specified by
 *          the 'inputFormat' option.
 * @param [options] the options to use:
 *          [algorithm] the normalization algorithm to use, `URDNA2015` or
 *            `URGNA2012` (default: `URGNA2012`).
 *          [base] the base IRI to use.
 *          [expandContext] a context to expand with.
 *          [inputFormat] the format if input is not JSON-LD:
 *            'application/nquads' for N-Quads.
 *          [format] the format if output is a string:
 *            'application/nquads' for N-Quads.
 *          [documentLoader(url, callback(err, remoteDoc))] the document loader.
 * @param callback(err, normalized) called once the operation completes.
 */
jsonld.normalize = function(input, options, callback) {
  if(arguments.length < 1) {
    return jsonld.nextTick(function() {
      callback(new TypeError('Could not normalize, too few arguments.'));
    });
  }

  // get arguments
  if(typeof options === 'function') {
    callback = options;
    options = {};
  }
  options = options || {};

  // set default options
  if(!('algorithm' in options)) {
    options.algorithm = 'URGNA2012';
  }
  if(!('base' in options)) {
    options.base = (typeof input === 'string') ? input : '';
  }
  if(!('documentLoader' in options)) {
    options.documentLoader = jsonld.loadDocument;
  }

  if('inputFormat' in options) {
    if(options.inputFormat !== 'application/nquads') {
      return callback(new JsonLdError(
        'Unknown normalization input format.',
        'jsonld.NormalizeError'));
    }
    var parsedInput = _parseNQuads(input);
    // do normalization
    new Processor().normalize(parsedInput, options, callback);
  } else {
    // convert to RDF dataset then do normalization
    var opts = _clone(options);
    delete opts.format;
    opts.produceGeneralizedRdf = false;
    jsonld.toRDF(input, opts, function(err, dataset) {
      if(err) {
        return callback(new JsonLdError(
          'Could not convert input to RDF dataset before normalization.',
          'jsonld.NormalizeError', {cause: err}));
      }
      // do normalization
      new Processor().normalize(dataset, options, callback);
    });
  }
};

/**
 * Converts an RDF dataset to JSON-LD.
 *
 * @param dataset a serialized string of RDF in a format specified by the
 *          format option or an RDF dataset to convert.
 * @param [options] the options to use:
 *          [format] the format if dataset param must first be parsed:
 *            'application/nquads' for N-Quads (default).
 *          [rdfParser] a custom RDF-parser to use to parse the dataset.
 *          [useRdfType] true to use rdf:type, false to use @type
 *            (default: false).
 *          [useNativeTypes] true to convert XSD types into native types
 *            (boolean, integer, double), false not to (default: false).
 * @param callback(err, output) called once the operation completes.
 */
jsonld.fromRDF = function(dataset, options, callback) {
  if(arguments.length < 1) {
    return jsonld.nextTick(function() {
      callback(new TypeError('Could not convert from RDF, too few arguments.'));
    });
  }

  // get arguments
  if(typeof options === 'function') {
    callback = options;
    options = {};
  }
  options = options || {};

  // set default options
  if(!('useRdfType' in options)) {
    options.useRdfType = false;
  }
  if(!('useNativeTypes' in options)) {
    options.useNativeTypes = false;
  }

  if(!('format' in options) && _isString(dataset)) {
    // set default format to nquads
    if(!('format' in options)) {
      options.format = 'application/nquads';
    }
  }

  jsonld.nextTick(function() {
    // handle special format
    var rdfParser;
    if(options.format) {
      // check supported formats
      rdfParser = options.rdfParser || _rdfParsers[options.format];
      if(!rdfParser) {
        return callback(new JsonLdError(
          'Unknown input format.',
          'jsonld.UnknownFormat', {format: options.format}));
      }
    } else {
      // no-op parser, assume dataset already parsed
      rdfParser = function() {
        return dataset;
      };
    }

    var callbackCalled = false;
    try {
      // rdf parser may be async or sync, always pass callback
      dataset = rdfParser(dataset, function(err, dataset) {
        callbackCalled = true;
        if(err) {
          return callback(err);
        }
        fromRDF(dataset, options, callback);
      });
    } catch(e) {
      if(!callbackCalled) {
        return callback(e);
      }
      throw e;
    }
    // handle synchronous or promise-based parser
    if(dataset) {
      // if dataset is actually a promise
      if('then' in dataset) {
        return dataset.then(function(dataset) {
          fromRDF(dataset, options, callback);
        }, callback);
      }
      // parser is synchronous
      fromRDF(dataset, options, callback);
    }

    function fromRDF(dataset, options, callback) {
      // convert from RDF
      new Processor().fromRDF(dataset, options, callback);
    }
  });
};

/**
 * Outputs the RDF dataset found in the given JSON-LD object.
 *
 * @param input the JSON-LD input.
 * @param [options] the options to use:
 *          [base] the base IRI to use.
 *          [expandContext] a context to expand with.
 *          [format] the format to use to output a string:
 *            'application/nquads' for N-Quads.
 *          [produceGeneralizedRdf] true to output generalized RDF, false
 *            to produce only standard RDF (default: false).
 *          [documentLoader(url, callback(err, remoteDoc))] the document loader.
 * @param callback(err, dataset) called once the operation completes.
 */
jsonld.toRDF = function(input, options, callback) {
  if(arguments.length < 1) {
    return jsonld.nextTick(function() {
      callback(new TypeError('Could not convert to RDF, too few arguments.'));
    });
  }

  // get arguments
  if(typeof options === 'function') {
    callback = options;
    options = {};
  }
  options = options || {};

  // set default options
  if(!('base' in options)) {
    options.base = (typeof input === 'string') ? input : '';
  }
  if(!('documentLoader' in options)) {
    options.documentLoader = jsonld.loadDocument;
  }

  // expand input
  jsonld.expand(input, options, function(err, expanded) {
    if(err) {
      return callback(new JsonLdError(
        'Could not expand input before serialization to RDF.',
        'jsonld.RdfError', {cause: err}));
    }

    var dataset;
    try {
      // output RDF dataset
      dataset = Processor.prototype.toRDF(expanded, options);
      if(options.format) {
        if(options.format === 'application/nquads') {
          return callback(null, _toNQuads(dataset));
        }
        throw new JsonLdError(
          'Unknown output format.',
          'jsonld.UnknownFormat', {format: options.format});
      }
    } catch(ex) {
      return callback(ex);
    }
    callback(null, dataset);
  });
};

/**
 * **Experimental**
 *
 * Recursively flattens the nodes in the given JSON-LD input into a map of
 * node ID => node.
 *
 * @param input the JSON-LD input.
 * @param [options] the options to use:
 *          [base] the base IRI to use.
 *          [expandContext] a context to expand with.
 *          [issuer] a jsonld.IdentifierIssuer to use to label blank nodes.
 *          [namer] (deprecated)
 *          [documentLoader(url, callback(err, remoteDoc))] the document loader.
 * @param callback(err, nodeMap) called once the operation completes.
 */
jsonld.createNodeMap = function(input, options, callback) {
  if(arguments.length < 1) {
    return jsonld.nextTick(function() {
      callback(new TypeError('Could not create node map, too few arguments.'));
    });
  }

  // get arguments
  if(typeof options === 'function') {
    callback = options;
    options = {};
  }
  options = options || {};

  // set default options
  if(!('base' in options)) {
    options.base = (typeof input === 'string') ? input : '';
  }
  if(!('documentLoader' in options)) {
    options.documentLoader = jsonld.loadDocument;
  }

  // expand input
  jsonld.expand(input, options, function(err, _input) {
    if(err) {
      return callback(new JsonLdError(
        'Could not expand input before creating node map.',
        'jsonld.CreateNodeMapError', {cause: err}));
    }

    var nodeMap;
    try {
      nodeMap = new Processor().createNodeMap(_input, options);
    } catch(ex) {
      return callback(ex);
    }

    callback(null, nodeMap);
  });
};

/**
 * **Experimental**
 *
 * Merges two or more JSON-LD documents into a single flattened document.
 *
 * @param docs the JSON-LD documents to merge together.
 * @param ctx the context to use to compact the merged result, or null.
 * @param [options] the options to use:
 *          [base] the base IRI to use.
 *          [expandContext] a context to expand with.
 *          [issuer] a jsonld.IdentifierIssuer to use to label blank nodes.
 *          [namer] (deprecated).
 *          [mergeNodes] true to merge properties for nodes with the same ID,
 *            false to ignore new properties for nodes with the same ID once
 *            the ID has been defined; note that this may not prevent merging
 *            new properties where a node is in the `object` position
 *            (default: true).
 *          [documentLoader(url, callback(err, remoteDoc))] the document loader.
 * @param callback(err, merged) called once the operation completes.
 */
jsonld.merge = function(docs, ctx, options, callback) {
  if(arguments.length < 1) {
    return jsonld.nextTick(function() {
      callback(new TypeError('Could not merge, too few arguments.'));
    });
  }
  if(!_isArray(docs)) {
    return jsonld.nextTick(function() {
      callback(new TypeError('Could not merge, "docs" must be an array.'));
    });
  }

  // get arguments
  if(typeof options === 'function') {
    callback = options;
    options = {};
  } else if(typeof ctx === 'function') {
    callback = ctx;
    ctx = null;
    options = {};
  }
  options = options || {};

  // expand all documents
  var expanded = [];
  var error = null;
  var count = docs.length;
  for(var i = 0; i < docs.length; ++i) {
    var opts = {};
    for(var key in options) {
      opts[key] = options[key];
    }
    jsonld.expand(docs[i], opts, expandComplete);
  }

  function expandComplete(err, _input) {
    if(error) {
      return;
    }
    if(err) {
      error = err;
      return callback(new JsonLdError(
        'Could not expand input before flattening.',
        'jsonld.FlattenError', {cause: err}));
    }
    expanded.push(_input);
    if(--count === 0) {
      merge(expanded);
    }
  }

  function merge(expanded) {
    var mergeNodes = true;
    if('mergeNodes' in options) {
      mergeNodes = options.mergeNodes;
    }

    var issuer = options.namer || options.issuer || new IdentifierIssuer('_:b');
    var graphs = {'@default': {}};

    var defaultGraph;
    try {
      for(var i = 0; i < expanded.length; ++i) {
        // uniquely relabel blank nodes
        var doc = expanded[i];
        doc = jsonld.relabelBlankNodes(doc, {
          issuer: new IdentifierIssuer('_:b' + i + '-')
        });

        // add nodes to the shared node map graphs if merging nodes, to a
        // separate graph set if not
        var _graphs = (mergeNodes || i === 0) ? graphs : {'@default': {}};
        _createNodeMap(doc, _graphs, '@default', issuer);

        if(_graphs !== graphs) {
          // merge document graphs but don't merge existing nodes
          for(var graphName in _graphs) {
            var _nodeMap = _graphs[graphName];
            if(!(graphName in graphs)) {
              graphs[graphName] = _nodeMap;
              continue;
            }
            var nodeMap = graphs[graphName];
            for(var key in _nodeMap) {
              if(!(key in nodeMap)) {
                nodeMap[key] = _nodeMap[key];
              }
            }
          }
        }
      }

      // add all non-default graphs to default graph
      defaultGraph = _mergeNodeMaps(graphs);
    } catch(ex) {
      return callback(ex);
    }

    // produce flattened output
    var flattened = [];
    var keys = Object.keys(defaultGraph).sort();
    for(var ki = 0; ki < keys.length; ++ki) {
      var node = defaultGraph[keys[ki]];
      // only add full subjects to top-level
      if(!_isSubjectReference(node)) {
        flattened.push(node);
      }
    }

    if(ctx === null) {
      return callback(null, flattened);
    }

    // compact result (force @graph option to true, skip expansion)
    options.graph = true;
    options.skipExpansion = true;
    jsonld.compact(flattened, ctx, options, function(err, compacted) {
      if(err) {
        return callback(new JsonLdError(
          'Could not compact merged output.',
          'jsonld.MergeError', {cause: err}));
      }
      callback(null, compacted);
    });
  }
};

/**
 * Relabels all blank nodes in the given JSON-LD input.
 *
 * @param input the JSON-LD input.
 * @param [options] the options to use:
 *          [issuer] a jsonld.IdentifierIssuer to use to label blank nodes.
 *          [namer] (deprecated).
 */
jsonld.relabelBlankNodes = function(input, options) {
  options = options || {};
  var issuer = options.namer || options.issuer || new IdentifierIssuer('_:b');
  return _labelBlankNodes(issuer, input);
};

/**
 * Prepends a base IRI to the given relative IRI.
 *
 * @param base the base IRI.
 * @param iri the relative IRI.
 *
 * @return the absolute IRI.
 */
jsonld.prependBase = function(base, iri) {
  return _prependBase(base, iri);
};

/**
 * The default document loader for external documents. If the environment
 * is node.js, a callback-continuation-style document loader is used; otherwise,
 * a promises-style document loader is used.
 *
 * @param url the URL to load.
 * @param callback(err, remoteDoc) called once the operation completes,
 *          if using a non-promises API.
 *
 * @return a promise, if using a promises API.
 */
jsonld.documentLoader = function(url, callback) {
  var err = new JsonLdError(
    'Could not retrieve a JSON-LD document from the URL. URL ' +
    'dereferencing not implemented.', 'jsonld.LoadDocumentError',
    {code: 'loading document failed'});
  if(_nodejs) {
    return callback(err, {contextUrl: null, documentUrl: url, document: null});
  }
  return jsonld.promisify(function(callback) {
    callback(err);
  });
};

/**
 * Deprecated default document loader. Use or override jsonld.documentLoader
 * instead.
 */
jsonld.loadDocument = function(url, callback) {
  var promise = jsonld.documentLoader(url, callback);
  if(promise && 'then' in promise) {
    promise.then(callback.bind(null, null), callback);
  }
};

/* Promises API */

/**
 * Creates a new promises API object.
 *
 * @param [options] the options to use:
 *          [api] an object to attach the API to.
 *          [version] 'json-ld-1.0' to output a standard JSON-LD 1.0 promises
 *            API, 'jsonld.js' to output the same with augmented proprietary
 *            methods (default: 'jsonld.js')
 *
 * @return the promises API object.
 */
jsonld.promises = function(options) {
  options = options || {};
  var slice = Array.prototype.slice;
  var promisify = jsonld.promisify;

  // handle 'api' option as version, set defaults
  var api = options.api || {};
  var version = options.version || 'jsonld.js';
  if(typeof options.api === 'string') {
    if(!options.version) {
      version = options.api;
    }
    api = {};
  }

  api.expand = function(input) {
    if(arguments.length < 1) {
      throw new TypeError('Could not expand, too few arguments.');
    }
    return promisify.apply(null, [jsonld.expand].concat(slice.call(arguments)));
  };
  api.compact = function(input, ctx) {
    if(arguments.length < 2) {
      throw new TypeError('Could not compact, too few arguments.');
    }
    var compact = function(input, ctx, options, callback) {
      // ensure only one value is returned in callback
      jsonld.compact(input, ctx, options, function(err, compacted) {
        callback(err, compacted);
      });
    };
    return promisify.apply(null, [compact].concat(slice.call(arguments)));
  };
  api.flatten = function(input) {
    if(arguments.length < 1) {
      throw new TypeError('Could not flatten, too few arguments.');
    }
    return promisify.apply(
      null, [jsonld.flatten].concat(slice.call(arguments)));
  };
  api.frame = function(input, frame) {
    if(arguments.length < 2) {
      throw new TypeError('Could not frame, too few arguments.');
    }
    return promisify.apply(null, [jsonld.frame].concat(slice.call(arguments)));
  };
  api.fromRDF = function(dataset) {
    if(arguments.length < 1) {
      throw new TypeError('Could not convert from RDF, too few arguments.');
    }
    return promisify.apply(
      null, [jsonld.fromRDF].concat(slice.call(arguments)));
  };
  api.toRDF = function(input) {
    if(arguments.length < 1) {
      throw new TypeError('Could not convert to RDF, too few arguments.');
    }
    return promisify.apply(null, [jsonld.toRDF].concat(slice.call(arguments)));
  };
  api.normalize = function(input) {
    if(arguments.length < 1) {
      throw new TypeError('Could not normalize, too few arguments.');
    }
    return promisify.apply(
      null, [jsonld.normalize].concat(slice.call(arguments)));
  };

  if(version === 'jsonld.js') {
    api.link = function(input, ctx) {
      if(arguments.length < 2) {
        throw new TypeError('Could not link, too few arguments.');
      }
      return promisify.apply(
        null, [jsonld.link].concat(slice.call(arguments)));
    };
    api.objectify = function(input) {
      return promisify.apply(
        null, [jsonld.objectify].concat(slice.call(arguments)));
    };
    api.createNodeMap = function(input) {
      return promisify.apply(
        null, [jsonld.createNodeMap].concat(slice.call(arguments)));
    };
    api.merge = function(input) {
      return promisify.apply(
        null, [jsonld.merge].concat(slice.call(arguments)));
    };
  }

  try {
    jsonld.Promise = global.Promise || require('es6-promise').Promise;
  } catch(e) {
    var f = function() {
      throw new Error('Unable to find a Promise implementation.');
    };
    for(var method in api) {
      api[method] = f;
    }
  }

  return api;
};

/**
 * Converts a node.js async op into a promise w/boxed resolved value(s).
 *
 * @param op the operation to convert.
 *
 * @return the promise.
 */
jsonld.promisify = function(op) {
  if(!jsonld.Promise) {
    try {
      jsonld.Promise = global.Promise || require('es6-promise').Promise;
    } catch(e) {
      throw new Error('Unable to find a Promise implementation.');
    }
  }
  var args = Array.prototype.slice.call(arguments, 1);
  return new jsonld.Promise(function(resolve, reject) {
    op.apply(null, args.concat(function(err, value) {
      if(!err) {
        resolve(value);
      } else {
        reject(err);
      }
    }));
  });
};

// extend jsonld.promises w/jsonld.js methods
jsonld.promises({api: jsonld.promises});

/* WebIDL API */

function JsonLdProcessor() {}
JsonLdProcessor.prototype = jsonld.promises({version: 'json-ld-1.0'});
JsonLdProcessor.prototype.toString = function() {
  if(this instanceof JsonLdProcessor) {
    return '[object JsonLdProcessor]';
  }
  return '[object JsonLdProcessorPrototype]';
};
jsonld.JsonLdProcessor = JsonLdProcessor;

// IE8 has Object.defineProperty but it only
// works on DOM nodes -- so feature detection
// requires try/catch :-(
var canDefineProperty = !!Object.defineProperty;
if(canDefineProperty) {
  try {
    Object.defineProperty({}, 'x', {});
  } catch(e) {
    canDefineProperty = false;
  }
}

if(canDefineProperty) {
  Object.defineProperty(JsonLdProcessor, 'prototype', {
    writable: false,
    enumerable: false
  });
  Object.defineProperty(JsonLdProcessor.prototype, 'constructor', {
    writable: true,
    enumerable: false,
    configurable: true,
    value: JsonLdProcessor
  });
}

// setup browser global JsonLdProcessor
if(_browser && typeof global.JsonLdProcessor === 'undefined') {
  if(canDefineProperty) {
    Object.defineProperty(global, 'JsonLdProcessor', {
      writable: true,
      enumerable: false,
      configurable: true,
      value: JsonLdProcessor
    });
  } else {
    global.JsonLdProcessor = JsonLdProcessor;
  }
}

/* Utility API */

// define setImmediate and nextTick
//// nextTick implementation with browser-compatible fallback ////
// from https://github.com/caolan/async/blob/master/lib/async.js

// capture the global reference to guard against fakeTimer mocks
var _setImmediate = typeof setImmediate === 'function' && setImmediate;

var _delay = _setImmediate ? function(fn) {
  // not a direct alias (for IE10 compatibility)
  _setImmediate(fn);
} : function(fn) {
  setTimeout(fn, 0);
};

if(typeof process === 'object' && typeof process.nextTick === 'function') {
  jsonld.nextTick = process.nextTick;
} else {
  jsonld.nextTick = _delay;
}
jsonld.setImmediate = _setImmediate ? _delay : jsonld.nextTick;

/**
 * Parses a link header. The results will be key'd by the value of "rel".
 *
 * Link: <http://json-ld.org/contexts/person.jsonld>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"
 *
 * Parses as: {
 *   'http://www.w3.org/ns/json-ld#context': {
 *     target: http://json-ld.org/contexts/person.jsonld,
 *     type: 'application/ld+json'
 *   }
 * }
 *
 * If there is more than one "rel" with the same IRI, then entries in the
 * resulting map for that "rel" will be arrays.
 *
 * @param header the link header to parse.
 */
jsonld.parseLinkHeader = function(header) {
  var rval = {};
  // split on unbracketed/unquoted commas
  var entries = header.match(/(?:<[^>]*?>|"[^"]*?"|[^,])+/g);
  var rLinkHeader = /\s*<([^>]*?)>\s*(?:;\s*(.*))?/;
  for(var i = 0; i < entries.length; ++i) {
    var match = entries[i].match(rLinkHeader);
    if(!match) {
      continue;
    }
    var result = {target: match[1]};
    var params = match[2];
    var rParams = /(.*?)=(?:(?:"([^"]*?)")|([^"]*?))\s*(?:(?:;\s*)|$)/g;
    while(match = rParams.exec(params)) {
      result[match[1]] = (match[2] === undefined) ? match[3] : match[2];
    }
    var rel = result['rel'] || '';
    if(_isArray(rval[rel])) {
      rval[rel].push(result);
    } else if(rel in rval) {
      rval[rel] = [rval[rel], result];
    } else {
      rval[rel] = result;
    }
  }
  return rval;
};

/**
 * Creates a simple queue for requesting documents.
 */
jsonld.RequestQueue = function() {
  this._requests = {};
};
jsonld.RequestQueue.prototype.wrapLoader = function(loader) {
  this._loader = loader;
  this._usePromise = (loader.length === 1);
  return this.add.bind(this);
};
jsonld.RequestQueue.prototype.add = function(url, callback) {
  var self = this;

  // callback must be given if not using promises
  if(!callback && !self._usePromise) {
    throw new Error('callback must be specified.');
  }

  // Promise-based API
  if(self._usePromise) {
    return new jsonld.Promise(function(resolve, reject) {
      var load = self._requests[url];
      if(!load) {
        // load URL then remove from queue
        load = self._requests[url] = self._loader(url)
          .then(function(remoteDoc) {
            delete self._requests[url];
            return remoteDoc;
          }).catch(function(err) {
            delete self._requests[url];
            throw err;
          });
      }
      // resolve/reject promise once URL has been loaded
      load.then(function(remoteDoc) {
        resolve(remoteDoc);
      }).catch(function(err) {
        reject(err);
      });
    });
  }

  // callback-based API
  if(url in self._requests) {
    self._requests[url].push(callback);
  } else {
    self._requests[url] = [callback];
    self._loader(url, function(err, remoteDoc) {
      var callbacks = self._requests[url];
      delete self._requests[url];
      for(var i = 0; i < callbacks.length; ++i) {
        callbacks[i](err, remoteDoc);
      }
    });
  }
};

/**
 * Creates a simple document cache that retains documents for a short
 * period of time.
 *
 * FIXME: Implement simple HTTP caching instead.
 *
 * @param size the maximum size of the cache.
 */
jsonld.DocumentCache = function(size) {
  this.order = [];
  this.cache = {};
  this.size = size || 50;
  this.expires = 30 * 1000;
};
jsonld.DocumentCache.prototype.get = function(url) {
  if(url in this.cache) {
    var entry = this.cache[url];
    if(entry.expires >= +new Date()) {
      return entry.ctx;
    }
    delete this.cache[url];
    this.order.splice(this.order.indexOf(url), 1);
  }
  return null;
};
jsonld.DocumentCache.prototype.set = function(url, ctx) {
  if(this.order.length === this.size) {
    delete this.cache[this.order.shift()];
  }
  this.order.push(url);
  this.cache[url] = {ctx: ctx, expires: (+new Date() + this.expires)};
};

/**
 * Creates an active context cache.
 *
 * @param size the maximum size of the cache.
 */
jsonld.ActiveContextCache = function(size) {
  this.order = [];
  this.cache = {};
  this.size = size || 100;
};
jsonld.ActiveContextCache.prototype.get = function(activeCtx, localCtx) {
  var key1 = JSON.stringify(activeCtx);
  var key2 = JSON.stringify(localCtx);
  var level1 = this.cache[key1];
  if(level1 && key2 in level1) {
    return level1[key2];
  }
  return null;
};
jsonld.ActiveContextCache.prototype.set = function(
  activeCtx, localCtx, result) {
  if(this.order.length === this.size) {
    var entry = this.order.shift();
    delete this.cache[entry.activeCtx][entry.localCtx];
  }
  var key1 = JSON.stringify(activeCtx);
  var key2 = JSON.stringify(localCtx);
  this.order.push({activeCtx: key1, localCtx: key2});
  if(!(key1 in this.cache)) {
    this.cache[key1] = {};
  }
  this.cache[key1][key2] = _clone(result);
};

/**
 * Default JSON-LD cache.
 */
jsonld.cache = {
  activeCtx: new jsonld.ActiveContextCache()
};

/**
 * Document loaders.
 */
jsonld.documentLoaders = {};

/**
 * Creates a built-in jquery document loader.
 *
 * @param $ the jquery instance to use.
 * @param options the options to use:
 *          secure: require all URLs to use HTTPS.
 *          usePromise: true to use a promises API, false for a
 *            callback-continuation-style API; defaults to true if Promise
 *            is globally defined, false if not.
 *
 * @return the jquery document loader.
 */
jsonld.documentLoaders.jquery = function($, options) {
  options = options || {};
  var queue = new jsonld.RequestQueue();

  // use option or, by default, use Promise when its defined
  var usePromise = ('usePromise' in options ?
    options.usePromise : (typeof Promise !== 'undefined'));
  if(usePromise) {
    return queue.wrapLoader(function(url) {
      return jsonld.promisify(loader, url);
    });
  }
  return queue.wrapLoader(loader);

  function loader(url, callback) {
    if(url.indexOf('http:') !== 0 && url.indexOf('https:') !== 0) {
      return callback(new JsonLdError(
        'URL could not be dereferenced; only "http" and "https" URLs are ' +
        'supported.',
        'jsonld.InvalidUrl', {code: 'loading document failed', url: url}),
        {contextUrl: null, documentUrl: url, document: null});
    }
    if(options.secure && url.indexOf('https') !== 0) {
      return callback(new JsonLdError(
        'URL could not be dereferenced; secure mode is enabled and ' +
        'the URL\'s scheme is not "https".',
        'jsonld.InvalidUrl', {code: 'loading document failed', url: url}),
        {contextUrl: null, documentUrl: url, document: null});
    }
    $.ajax({
      url: url,
      accepts: {
        json: 'application/ld+json, application/json'
      },
      // ensure Accept header is very specific for JSON-LD/JSON
      headers: {
        'Accept': 'application/ld+json, application/json'
      },
      dataType: 'json',
      crossDomain: true,
      success: function(data, textStatus, jqXHR) {
        var doc = {contextUrl: null, documentUrl: url, document: data};

        // handle Link Header
        var contentType = jqXHR.getResponseHeader('Content-Type');
        var linkHeader = jqXHR.getResponseHeader('Link');
        if(linkHeader && contentType !== 'application/ld+json') {
          // only 1 related link header permitted
          linkHeader = jsonld.parseLinkHeader(linkHeader)[LINK_HEADER_REL];
          if(_isArray(linkHeader)) {
            return callback(new JsonLdError(
              'URL could not be dereferenced, it has more than one ' +
              'associated HTTP Link Header.',
              'jsonld.InvalidUrl',
              {code: 'multiple context link headers', url: url}), doc);
          }
          if(linkHeader) {
            doc.contextUrl = linkHeader.target;
          }
        }

        callback(null, doc);
      },
      error: function(jqXHR, textStatus, err) {
        callback(new JsonLdError(
          'URL could not be dereferenced, an error occurred.',
          'jsonld.LoadDocumentError',
          {code: 'loading document failed', url: url, cause: err}),
          {contextUrl: null, documentUrl: url, document: null});
      }
    });
  }
};

/**
 * Creates a built-in node document loader.
 *
 * @param options the options to use:
 *          secure: require all URLs to use HTTPS.
 *          strictSSL: true to require SSL certificates to be valid,
 *            false not to (default: true).
 *          maxRedirects: the maximum number of redirects to permit, none by
 *            default.
 *          request: the object which will make the request, default is
 *            provided by `https://www.npmjs.com/package/request`.
 *          headers: an array of headers which will be passed as request
 *            headers for the requested document. Accept is not allowed.
 *          usePromise: true to use a promises API, false for a
 *            callback-continuation-style API; false by default.
 *
 * @return the node document loader.
 */
jsonld.documentLoaders.node = function(options) {
  options = options || {};
  var strictSSL = ('strictSSL' in options) ? options.strictSSL : true;
  var maxRedirects = ('maxRedirects' in options) ? options.maxRedirects : -1;
  var request = ('request' in options) ? options.request : require('request');
  var acceptHeader = 'application/ld+json, application/json';
  var http = require('http');
  // TODO: disable cache until HTTP caching implemented
  //var cache = new jsonld.DocumentCache();

  var queue = new jsonld.RequestQueue();
  if(options.usePromise) {
    return queue.wrapLoader(function(url) {
      return jsonld.promisify(loadDocument, url, []);
    });
  }
  var headers = options.headers || {};
  if('Accept' in headers || 'accept' in headers) {
    throw new RangeError(
      'Accept header may not be specified as an option; only "' +
      acceptHeader + '" is supported.');
  }
  return queue.wrapLoader(function(url, callback) {
    loadDocument(url, [], callback);
  });

  function loadDocument(url, redirects, callback) {
    if(url.indexOf('http:') !== 0 && url.indexOf('https:') !== 0) {
      return callback(new JsonLdError(
        'URL could not be dereferenced; only "http" and "https" URLs are ' +
        'supported.',
        'jsonld.InvalidUrl', {code: 'loading document failed', url: url}),
        {contextUrl: null, documentUrl: url, document: null});
    }
    if(options.secure && url.indexOf('https') !== 0) {
      return callback(new JsonLdError(
        'URL could not be dereferenced; secure mode is enabled and ' +
        'the URL\'s scheme is not "https".',
        'jsonld.InvalidUrl', {code: 'loading document failed', url: url}),
        {contextUrl: null, documentUrl: url, document: null});
    }
    // TODO: disable cache until HTTP caching implemented
    var doc = null;//cache.get(url);
    if(doc !== null) {
      return callback(null, doc);
    }
    var headers = {'Accept': acceptHeader};
    for(var k in options.headers) { headers[k] = options.headers[k]; }
    request({
      url: url,
      headers: headers,
      strictSSL: strictSSL,
      followRedirect: false
    }, handleResponse);

    function handleResponse(err, res, body) {
      doc = {contextUrl: null, documentUrl: url, document: body || null};

      // handle error
      if(err) {
        return callback(new JsonLdError(
          'URL could not be dereferenced, an error occurred.',
          'jsonld.LoadDocumentError',
          {code: 'loading document failed', url: url, cause: err}), doc);
      }
      var statusText = http.STATUS_CODES[res.statusCode];
      if(res.statusCode >= 400) {
        return callback(new JsonLdError(
          'URL could not be dereferenced: ' + statusText,
          'jsonld.InvalidUrl', {
            code: 'loading document failed',
            url: url,
            httpStatusCode: res.statusCode
          }), doc);
      }

      // handle Link Header
      if(res.headers.link &&
        res.headers['content-type'] !== 'application/ld+json') {
        // only 1 related link header permitted
        var linkHeader = jsonld.parseLinkHeader(
          res.headers.link)[LINK_HEADER_REL];
        if(_isArray(linkHeader)) {
          return callback(new JsonLdError(
            'URL could not be dereferenced, it has more than one associated ' +
            'HTTP Link Header.',
            'jsonld.InvalidUrl',
            {code: 'multiple context link headers', url: url}), doc);
        }
        if(linkHeader) {
          doc.contextUrl = linkHeader.target;
        }
      }

      // handle redirect
      if(res.statusCode >= 300 && res.statusCode < 400 &&
        res.headers.location) {
        if(redirects.length === maxRedirects) {
          return callback(new JsonLdError(
            'URL could not be dereferenced; there were too many redirects.',
            'jsonld.TooManyRedirects', {
              code: 'loading document failed',
              url: url,
              httpStatusCode: res.statusCode,
              redirects: redirects
            }), doc);
        }
        if(redirects.indexOf(url) !== -1) {
          return callback(new JsonLdError(
            'URL could not be dereferenced; infinite redirection was detected.',
            'jsonld.InfiniteRedirectDetected', {
              code: 'recursive context inclusion',
              url: url,
              httpStatusCode: res.statusCode,
              redirects: redirects
            }), doc);
        }
        redirects.push(url);
        return loadDocument(res.headers.location, redirects, callback);
      }
      // cache for each redirected URL
      redirects.push(url);
      // TODO: disable cache until HTTP caching implemented
      /*for(var i = 0; i < redirects.length; ++i) {
        cache.set(
          redirects[i],
          {contextUrl: null, documentUrl: redirects[i], document: body});
      }*/
      callback(err, doc);
    }
  }
};

/**
 * Creates a built-in XMLHttpRequest document loader.
 *
 * @param options the options to use:
 *          secure: require all URLs to use HTTPS.
 *          usePromise: true to use a promises API, false for a
 *            callback-continuation-style API; defaults to true if Promise
 *            is globally defined, false if not.
 *          [xhr]: the XMLHttpRequest API to use.
 *
 * @return the XMLHttpRequest document loader.
 */
jsonld.documentLoaders.xhr = function(options) {
  options = options || {};
  var rlink = /(^|(\r\n))link:/i;
  var queue = new jsonld.RequestQueue();

  // use option or, by default, use Promise when its defined
  var usePromise = ('usePromise' in options ?
    options.usePromise : (typeof Promise !== 'undefined'));
  if(usePromise) {
    return queue.wrapLoader(function(url) {
      return jsonld.promisify(loader, url);
    });
  }
  return queue.wrapLoader(loader);

  function loader(url, callback) {
    if(url.indexOf('http:') !== 0 && url.indexOf('https:') !== 0) {
      return callback(new JsonLdError(
        'URL could not be dereferenced; only "http" and "https" URLs are ' +
        'supported.',
        'jsonld.InvalidUrl', {code: 'loading document failed', url: url}),
        {contextUrl: null, documentUrl: url, document: null});
    }
    if(options.secure && url.indexOf('https') !== 0) {
      return callback(new JsonLdError(
        'URL could not be dereferenced; secure mode is enabled and ' +
        'the URL\'s scheme is not "https".',
        'jsonld.InvalidUrl', {code: 'loading document failed', url: url}),
        {contextUrl: null, documentUrl: url, document: null});
    }
    var xhr = options.xhr || XMLHttpRequest;
    var req = new xhr();
    req.onload = function() {
      if(req.status >= 400) {
        return callback(new JsonLdError(
          'URL could not be dereferenced: ' + req.statusText,
          'jsonld.LoadDocumentError', {
            code: 'loading document failed',
            url: url,
            httpStatusCode: req.status
          }), {contextUrl: null, documentUrl: url, document: null});
      }

      var doc = {contextUrl: null, documentUrl: url, document: req.response};

      // handle Link Header (avoid unsafe header warning by existence testing)
      var contentType = req.getResponseHeader('Content-Type');
      var linkHeader;
      if(rlink.test(req.getAllResponseHeaders())) {
        linkHeader = req.getResponseHeader('Link');
      }
      if(linkHeader && contentType !== 'application/ld+json') {
        // only 1 related link header permitted
        linkHeader = jsonld.parseLinkHeader(linkHeader)[LINK_HEADER_REL];
        if(_isArray(linkHeader)) {
          return callback(new JsonLdError(
            'URL could not be dereferenced, it has more than one ' +
            'associated HTTP Link Header.',
            'jsonld.InvalidUrl',
            {code: 'multiple context link headers', url: url}), doc);
        }
        if(linkHeader) {
          doc.contextUrl = linkHeader.target;
        }
      }

      callback(null, doc);
    };
    req.onerror = function() {
      callback(new JsonLdError(
        'URL could not be dereferenced, an error occurred.',
        'jsonld.LoadDocumentError',
        {code: 'loading document failed', url: url}),
        {contextUrl: null, documentUrl: url, document: null});
    };
    req.open('GET', url, true);
    req.setRequestHeader('Accept', 'application/ld+json, application/json');
    req.send();
  }
};

/**
 * Assigns the default document loader for external document URLs to a built-in
 * default. Supported types currently include: 'jquery' and 'node'.
 *
 * To use the jquery document loader, the first parameter must be a reference
 * to the main jquery object.
 *
 * @param type the type to set.
 * @param [params] the parameters required to use the document loader.
 */
jsonld.useDocumentLoader = function(type) {
  if(!(type in jsonld.documentLoaders)) {
    throw new JsonLdError(
      'Unknown document loader type: "' + type + '"',
      'jsonld.UnknownDocumentLoader',
      {type: type});
  }

  // set document loader
  jsonld.documentLoader = jsonld.documentLoaders[type].apply(
    jsonld, Array.prototype.slice.call(arguments, 1));
};

/**
 * Processes a local context, resolving any URLs as necessary, and returns a
 * new active context in its callback.
 *
 * @param activeCtx the current active context.
 * @param localCtx the local context to process.
 * @param [options] the options to use:
 *          [documentLoader(url, callback(err, remoteDoc))] the document loader.
 * @param callback(err, ctx) called once the operation completes.
 */
jsonld.processContext = function(activeCtx, localCtx) {
  // get arguments
  var options = {};
  var callbackArg = 2;
  if(arguments.length > 3) {
    options = arguments[2] || {};
    callbackArg += 1;
  }
  var callback = arguments[callbackArg];

  // set default options
  if(!('base' in options)) {
    options.base = '';
  }
  if(!('documentLoader' in options)) {
    options.documentLoader = jsonld.loadDocument;
  }

  // return initial context early for null context
  if(localCtx === null) {
    return callback(null, _getInitialContext(options));
  }

  // retrieve URLs in localCtx
  localCtx = _clone(localCtx);
  if(!(_isObject(localCtx) && '@context' in localCtx)) {
    localCtx = {'@context': localCtx};
  }
  _retrieveContextUrls(localCtx, options, function(err, ctx) {
    if(err) {
      return callback(err);
    }
    try {
      // process context
      ctx = new Processor().processContext(activeCtx, ctx, options);
    } catch(ex) {
      return callback(ex);
    }
    callback(null, ctx);
  });
};

/**
 * Returns true if the given subject has the given property.
 *
 * @param subject the subject to check.
 * @param property the property to look for.
 *
 * @return true if the subject has the given property, false if not.
 */
jsonld.hasProperty = function(subject, property) {
  var rval = false;
  if(property in subject) {
    var value = subject[property];
    rval = (!_isArray(value) || value.length > 0);
  }
  return rval;
};

/**
 * Determines if the given value is a property of the given subject.
 *
 * @param subject the subject to check.
 * @param property the property to check.
 * @param value the value to check.
 *
 * @return true if the value exists, false if not.
 */
jsonld.hasValue = function(subject, property, value) {
  var rval = false;
  if(jsonld.hasProperty(subject, property)) {
    var val = subject[property];
    var isList = _isList(val);
    if(_isArray(val) || isList) {
      if(isList) {
        val = val['@list'];
      }
      for(var i = 0; i < val.length; ++i) {
        if(jsonld.compareValues(value, val[i])) {
          rval = true;
          break;
        }
      }
    } else if(!_isArray(value)) {
      // avoid matching the set of values with an array value parameter
      rval = jsonld.compareValues(value, val);
    }
  }
  return rval;
};

/**
 * Adds a value to a subject. If the value is an array, all values in the
 * array will be added.
 *
 * @param subject the subject to add the value to.
 * @param property the property that relates the value to the subject.
 * @param value the value to add.
 * @param [options] the options to use:
 *        [propertyIsArray] true if the property is always an array, false
 *          if not (default: false).
 *        [allowDuplicate] true to allow duplicates, false not to (uses a
 *          simple shallow comparison of subject ID or value) (default: true).
 */
jsonld.addValue = function(subject, property, value, options) {
  options = options || {};
  if(!('propertyIsArray' in options)) {
    options.propertyIsArray = false;
  }
  if(!('allowDuplicate' in options)) {
    options.allowDuplicate = true;
  }

  if(_isArray(value)) {
    if(value.length === 0 && options.propertyIsArray &&
      !(property in subject)) {
      subject[property] = [];
    }
    for(var i = 0; i < value.length; ++i) {
      jsonld.addValue(subject, property, value[i], options);
    }
  } else if(property in subject) {
    // check if subject already has value if duplicates not allowed
    var hasValue = (!options.allowDuplicate &&
      jsonld.hasValue(subject, property, value));

    // make property an array if value not present or always an array
    if(!_isArray(subject[property]) &&
      (!hasValue || options.propertyIsArray)) {
      subject[property] = [subject[property]];
    }

    // add new value
    if(!hasValue) {
      subject[property].push(value);
    }
  } else {
    // add new value as set or single value
    subject[property] = options.propertyIsArray ? [value] : value;
  }
};

/**
 * Gets all of the values for a subject's property as an array.
 *
 * @param subject the subject.
 * @param property the property.
 *
 * @return all of the values for a subject's property as an array.
 */
jsonld.getValues = function(subject, property) {
  var rval = subject[property] || [];
  if(!_isArray(rval)) {
    rval = [rval];
  }
  return rval;
};

/**
 * Removes a property from a subject.
 *
 * @param subject the subject.
 * @param property the property.
 */
jsonld.removeProperty = function(subject, property) {
  delete subject[property];
};

/**
 * Removes a value from a subject.
 *
 * @param subject the subject.
 * @param property the property that relates the value to the subject.
 * @param value the value to remove.
 * @param [options] the options to use:
 *          [propertyIsArray] true if the property is always an array, false
 *            if not (default: false).
 */
jsonld.removeValue = function(subject, property, value, options) {
  options = options || {};
  if(!('propertyIsArray' in options)) {
    options.propertyIsArray = false;
  }

  // filter out value
  var values = jsonld.getValues(subject, property).filter(function(e) {
    return !jsonld.compareValues(e, value);
  });

  if(values.length === 0) {
    jsonld.removeProperty(subject, property);
  } else if(values.length === 1 && !options.propertyIsArray) {
    subject[property] = values[0];
  } else {
    subject[property] = values;
  }
};

/**
 * Compares two JSON-LD values for equality. Two JSON-LD values will be
 * considered equal if:
 *
 * 1. They are both primitives of the same type and value.
 * 2. They are both @values with the same @value, @type, @language,
 *   and @index, OR
 * 3. They both have @ids they are the same.
 *
 * @param v1 the first value.
 * @param v2 the second value.
 *
 * @return true if v1 and v2 are considered equal, false if not.
 */
jsonld.compareValues = function(v1, v2) {
  // 1. equal primitives
  if(v1 === v2) {
    return true;
  }

  // 2. equal @values
  if(_isValue(v1) && _isValue(v2) &&
    v1['@value'] === v2['@value'] &&
    v1['@type'] === v2['@type'] &&
    v1['@language'] === v2['@language'] &&
    v1['@index'] === v2['@index']) {
    return true;
  }

  // 3. equal @ids
  if(_isObject(v1) && ('@id' in v1) && _isObject(v2) && ('@id' in v2)) {
    return v1['@id'] === v2['@id'];
  }

  return false;
};

/**
 * Gets the value for the given active context key and type, null if none is
 * set.
 *
 * @param ctx the active context.
 * @param key the context key.
 * @param [type] the type of value to get (eg: '@id', '@type'), if not
 *          specified gets the entire entry for a key, null if not found.
 *
 * @return the value.
 */
jsonld.getContextValue = function(ctx, key, type) {
  var rval = null;

  // return null for invalid key
  if(key === null) {
    return rval;
  }

  // get default language
  if(type === '@language' && (type in ctx)) {
    rval = ctx[type];
  }

  // get specific entry information
  if(ctx.mappings[key]) {
    var entry = ctx.mappings[key];

    if(_isUndefined(type)) {
      // return whole entry
      rval = entry;
    } else if(type in entry) {
      // return entry value for type
      rval = entry[type];
    }
  }

  return rval;
};

/** Registered RDF dataset parsers hashed by content-type. */
var _rdfParsers = {};

/**
 * Registers an RDF dataset parser by content-type, for use with
 * jsonld.fromRDF. An RDF dataset parser will always be given two parameters,
 * a string of input and a callback. An RDF dataset parser can be synchronous
 * or asynchronous.
 *
 * If the parser function returns undefined or null then it will be assumed to
 * be asynchronous w/a continuation-passing style and the callback parameter
 * given to the parser MUST be invoked.
 *
 * If it returns a Promise, then it will be assumed to be asynchronous, but the
 * callback parameter MUST NOT be invoked. It should instead be ignored.
 *
 * If it returns an RDF dataset, it will be assumed to be synchronous and the
 * callback parameter MUST NOT be invoked. It should instead be ignored.
 *
 * @param contentType the content-type for the parser.
 * @param parser(input, callback(err, dataset)) the parser function (takes a
 *          string as a parameter and either returns null/undefined and uses
 *          the given callback, returns a Promise, or returns an RDF dataset).
 */
jsonld.registerRDFParser = function(contentType, parser) {
  _rdfParsers[contentType] = parser;
};

/**
 * Unregisters an RDF dataset parser by content-type.
 *
 * @param contentType the content-type for the parser.
 */
jsonld.unregisterRDFParser = function(contentType) {
  delete _rdfParsers[contentType];
};

if(_nodejs) {
  // needed for serialization of XML literals
  if(typeof XMLSerializer === 'undefined') {
    var XMLSerializer = null;
  }
  if(typeof Node === 'undefined') {
    var Node = {
      ELEMENT_NODE: 1,
      ATTRIBUTE_NODE: 2,
      TEXT_NODE: 3,
      CDATA_SECTION_NODE: 4,
      ENTITY_REFERENCE_NODE: 5,
      ENTITY_NODE: 6,
      PROCESSING_INSTRUCTION_NODE: 7,
      COMMENT_NODE: 8,
      DOCUMENT_NODE: 9,
      DOCUMENT_TYPE_NODE: 10,
      DOCUMENT_FRAGMENT_NODE: 11,
      NOTATION_NODE:12
    };
  }
}

// constants
var XSD_BOOLEAN = 'http://www.w3.org/2001/XMLSchema#boolean';
var XSD_DOUBLE = 'http://www.w3.org/2001/XMLSchema#double';
var XSD_INTEGER = 'http://www.w3.org/2001/XMLSchema#integer';
var XSD_STRING = 'http://www.w3.org/2001/XMLSchema#string';

var RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
var RDF_LIST = RDF + 'List';
var RDF_FIRST = RDF + 'first';
var RDF_REST = RDF + 'rest';
var RDF_NIL = RDF + 'nil';
var RDF_TYPE = RDF + 'type';
var RDF_PLAIN_LITERAL = RDF + 'PlainLiteral';
var RDF_XML_LITERAL = RDF + 'XMLLiteral';
var RDF_OBJECT = RDF + 'object';
var RDF_LANGSTRING = RDF + 'langString';

var LINK_HEADER_REL = 'http://www.w3.org/ns/json-ld#context';
var MAX_CONTEXT_URLS = 10;

/**
 * A JSON-LD Error.
 *
 * @param msg the error message.
 * @param type the error type.
 * @param details the error details.
 */
var JsonLdError = function(msg, type, details) {
  if(_nodejs) {
    Error.call(this);
    Error.captureStackTrace(this, this.constructor);
  } else if(typeof Error !== 'undefined') {
    this.stack = (new Error()).stack;
  }
  this.name = type || 'jsonld.Error';
  this.message = msg || 'An unspecified JSON-LD error occurred.';
  this.details = details || {};
};
if(_nodejs) {
  require('util').inherits(JsonLdError, Error);
} else if(typeof Error !== 'undefined') {
  JsonLdError.prototype = new Error();
}

/**
 * Constructs a new JSON-LD Processor.
 */
var Processor = function() {};

/**
 * Recursively compacts an element using the given active context. All values
 * must be in expanded form before this method is called.
 *
 * @param activeCtx the active context to use.
 * @param activeProperty the compacted property associated with the element
 *          to compact, null for none.
 * @param element the element to compact.
 * @param options the compaction options.
 *
 * @return the compacted value.
 */
Processor.prototype.compact = function(
  activeCtx, activeProperty, element, options) {
  // recursively compact array
  if(_isArray(element)) {
    var rval = [];
    for(var i = 0; i < element.length; ++i) {
      // compact, dropping any null values
      var compacted = this.compact(
        activeCtx, activeProperty, element[i], options);
      if(compacted !== null) {
        rval.push(compacted);
      }
    }
    if(options.compactArrays && rval.length === 1) {
      // use single element if no container is specified
      var container = jsonld.getContextValue(
        activeCtx, activeProperty, '@container');
      if(container === null) {
        rval = rval[0];
      }
    }
    return rval;
  }

  // recursively compact object
  if(_isObject(element)) {
    if(options.link && '@id' in element && element['@id'] in options.link) {
      // check for a linked element to reuse
      var linked = options.link[element['@id']];
      for(var i = 0; i < linked.length; ++i) {
        if(linked[i].expanded === element) {
          return linked[i].compacted;
        }
      }
    }

    // do value compaction on @values and subject references
    if(_isValue(element) || _isSubjectReference(element)) {
      var rval = _compactValue(activeCtx, activeProperty, element);
      if(options.link && _isSubjectReference(element)) {
        // store linked element
        if(!(element['@id'] in options.link)) {
          options.link[element['@id']] = [];
        }
        options.link[element['@id']].push({expanded: element, compacted: rval});
      }
      return rval;
    }

    // FIXME: avoid misuse of active property as an expanded property?
    var insideReverse = (activeProperty === '@reverse');

    var rval = {};

    if(options.link && '@id' in element) {
      // store linked element
      if(!(element['@id'] in options.link)) {
        options.link[element['@id']] = [];
      }
      options.link[element['@id']].push({expanded: element, compacted: rval});
    }

    // process element keys in order
    var keys = Object.keys(element).sort();
    for(var ki = 0; ki < keys.length; ++ki) {
      var expandedProperty = keys[ki];
      var expandedValue = element[expandedProperty];

      // compact @id and @type(s)
      if(expandedProperty === '@id' || expandedProperty === '@type') {
        var compactedValue;

        // compact single @id
        if(_isString(expandedValue)) {
          compactedValue = _compactIri(
            activeCtx, expandedValue, null,
            {vocab: (expandedProperty === '@type')});
        } else {
          // expanded value must be a @type array
          compactedValue = [];
          for(var vi = 0; vi < expandedValue.length; ++vi) {
            compactedValue.push(_compactIri(
              activeCtx, expandedValue[vi], null, {vocab: true}));
          }
        }

        // use keyword alias and add value
        var alias = _compactIri(activeCtx, expandedProperty);
        var isArray = (_isArray(compactedValue) && expandedValue.length === 0);
        jsonld.addValue(
          rval, alias, compactedValue, {propertyIsArray: isArray});
        continue;
      }

      // handle @reverse
      if(expandedProperty === '@reverse') {
        // recursively compact expanded value
        var compactedValue = this.compact(
          activeCtx, '@reverse', expandedValue, options);

        // handle double-reversed properties
        for(var compactedProperty in compactedValue) {
          if(activeCtx.mappings[compactedProperty] &&
            activeCtx.mappings[compactedProperty].reverse) {
            var value = compactedValue[compactedProperty];
            var container = jsonld.getContextValue(
              activeCtx, compactedProperty, '@container');
            var useArray = (container === '@set' || !options.compactArrays);
            jsonld.addValue(
              rval, compactedProperty, value, {propertyIsArray: useArray});
            delete compactedValue[compactedProperty];
          }
        }

        if(Object.keys(compactedValue).length > 0) {
          // use keyword alias and add value
          var alias = _compactIri(activeCtx, expandedProperty);
          jsonld.addValue(rval, alias, compactedValue);
        }

        continue;
      }

      // handle @index property
      if(expandedProperty === '@index') {
        // drop @index if inside an @index container
        var container = jsonld.getContextValue(
          activeCtx, activeProperty, '@container');
        if(container === '@index') {
          continue;
        }

        // use keyword alias and add value
        var alias = _compactIri(activeCtx, expandedProperty);
        jsonld.addValue(rval, alias, expandedValue);
        continue;
      }

      // skip array processing for keywords that aren't @graph or @list
      if(expandedProperty !== '@graph' && expandedProperty !== '@list' &&
        _isKeyword(expandedProperty)) {
        // use keyword alias and add value as is
        var alias = _compactIri(activeCtx, expandedProperty);
        jsonld.addValue(rval, alias, expandedValue);
        continue;
      }

      // Note: expanded value must be an array due to expansion algorithm.

      // preserve empty arrays
      if(expandedValue.length === 0) {
        var itemActiveProperty = _compactIri(
          activeCtx, expandedProperty, expandedValue, {vocab: true},
          insideReverse);
        jsonld.addValue(
          rval, itemActiveProperty, expandedValue, {propertyIsArray: true});
      }

      // recusively process array values
      for(var vi = 0; vi < expandedValue.length; ++vi) {
        var expandedItem = expandedValue[vi];

        // compact property and get container type
        var itemActiveProperty = _compactIri(
          activeCtx, expandedProperty, expandedItem, {vocab: true},
          insideReverse);
        var container = jsonld.getContextValue(
          activeCtx, itemActiveProperty, '@container');

        // get @list value if appropriate
        var isList = _isList(expandedItem);
        var list = null;
        if(isList) {
          list = expandedItem['@list'];
        }

        // recursively compact expanded item
        var compactedItem = this.compact(
          activeCtx, itemActiveProperty, isList ? list : expandedItem, options);

        // handle @list
        if(isList) {
          // ensure @list value is an array
          if(!_isArray(compactedItem)) {
            compactedItem = [compactedItem];
          }

          if(container !== '@list') {
            // wrap using @list alias
            var wrapper = {};
            wrapper[_compactIri(activeCtx, '@list')] = compactedItem;
            compactedItem = wrapper;

            // include @index from expanded @list, if any
            if('@index' in expandedItem) {
              compactedItem[_compactIri(activeCtx, '@index')] =
                expandedItem['@index'];
            }
          } else if(itemActiveProperty in rval) {
            // can't use @list container for more than 1 list
            throw new JsonLdError(
              'JSON-LD compact error; property has a "@list" @container ' +
              'rule but there is more than a single @list that matches ' +
              'the compacted term in the document. Compaction might mix ' +
              'unwanted items into the list.',
              'jsonld.SyntaxError', {code: 'compaction to list of lists'});
          }
        }

        // handle language and index maps
        if(container === '@language' || container === '@index') {
          // get or create the map object
          var mapObject;
          if(itemActiveProperty in rval) {
            mapObject = rval[itemActiveProperty];
          } else {
            rval[itemActiveProperty] = mapObject = {};
          }

          // if container is a language map, simplify compacted value to
          // a simple string
          if(container === '@language' && _isValue(compactedItem)) {
            compactedItem = compactedItem['@value'];
          }

          // add compact value to map object using key from expanded value
          // based on the container type
          jsonld.addValue(mapObject, expandedItem[container], compactedItem);
        } else {
          // use an array if: compactArrays flag is false,
          // @container is @set or @list , value is an empty
          // array, or key is @graph
          var isArray = (!options.compactArrays || container === '@set' ||
            container === '@list' ||
            (_isArray(compactedItem) && compactedItem.length === 0) ||
            expandedProperty === '@list' || expandedProperty === '@graph');

          // add compact value
          jsonld.addValue(
            rval, itemActiveProperty, compactedItem,
            {propertyIsArray: isArray});
        }
      }
    }

    return rval;
  }

  // only primitives remain which are already compact
  return element;
};

/**
 * Recursively expands an element using the given context. Any context in
 * the element will be removed. All context URLs must have been retrieved
 * before calling this method.
 *
 * @param activeCtx the context to use.
 * @param activeProperty the property for the element, null for none.
 * @param element the element to expand.
 * @param options the expansion options.
 * @param insideList true if the element is a list, false if not.
 *
 * @return the expanded value.
 */
Processor.prototype.expand = function(
  activeCtx, activeProperty, element, options, insideList) {
  var self = this;

  // nothing to expand
  if(element === null || element === undefined) {
    return null;
  }

  if(!_isArray(element) && !_isObject(element)) {
    // drop free-floating scalars that are not in lists
    if(!insideList && (activeProperty === null ||
      _expandIri(activeCtx, activeProperty, {vocab: true}) === '@graph')) {
      return null;
    }

    // expand element according to value expansion rules
    return _expandValue(activeCtx, activeProperty, element);
  }

  // recursively expand array
  if(_isArray(element)) {
    var rval = [];
    var container = jsonld.getContextValue(
      activeCtx, activeProperty, '@container');
    insideList = insideList || container === '@list';
    for(var i = 0; i < element.length; ++i) {
      // expand element
      var e = self.expand(activeCtx, activeProperty, element[i], options);
      if(insideList && (_isArray(e) || _isList(e))) {
        // lists of lists are illegal
        throw new JsonLdError(
          'Invalid JSON-LD syntax; lists of lists are not permitted.',
          'jsonld.SyntaxError', {code: 'list of lists'});
      }
      // drop null values
      if(e !== null) {
        if(_isArray(e)) {
          rval = rval.concat(e);
        } else {
          rval.push(e);
        }
      }
    }
    return rval;
  }

  // recursively expand object:

  // if element has a context, process it
  if('@context' in element) {
    activeCtx = self.processContext(activeCtx, element['@context'], options);
  }

  // expand the active property
  var expandedActiveProperty = _expandIri(
    activeCtx, activeProperty, {vocab: true});

  var rval = {};
  var keys = Object.keys(element).sort();
  for(var ki = 0; ki < keys.length; ++ki) {
    var key = keys[ki];
    var value = element[key];
    var expandedValue;

    // skip @context
    if(key === '@context') {
      continue;
    }

    // expand property
    var expandedProperty = _expandIri(activeCtx, key, {vocab: true});

    // drop non-absolute IRI keys that aren't keywords
    if(expandedProperty === null ||
      !(_isAbsoluteIri(expandedProperty) || _isKeyword(expandedProperty))) {
      continue;
    }

    if(_isKeyword(expandedProperty)) {
      if(expandedActiveProperty === '@reverse') {
        throw new JsonLdError(
          'Invalid JSON-LD syntax; a keyword cannot be used as a @reverse ' +
          'property.', 'jsonld.SyntaxError',
          {code: 'invalid reverse property map', value: value});
      }
      if(expandedProperty in rval) {
        throw new JsonLdError(
          'Invalid JSON-LD syntax; colliding keywords detected.',
          'jsonld.SyntaxError',
          {code: 'colliding keywords', keyword: expandedProperty});
      }
    }

    // syntax error if @id is not a string
    if(expandedProperty === '@id' && !_isString(value)) {
      if(!options.isFrame) {
        throw new JsonLdError(
          'Invalid JSON-LD syntax; "@id" value must a string.',
          'jsonld.SyntaxError', {code: 'invalid @id value', value: value});
      }
      if(!_isObject(value)) {
        throw new JsonLdError(
          'Invalid JSON-LD syntax; "@id" value must be a string or an ' +
          'object.', 'jsonld.SyntaxError',
          {code: 'invalid @id value', value: value});
      }
    }

    if(expandedProperty === '@type') {
      _validateTypeValue(value);
    }

    // @graph must be an array or an object
    if(expandedProperty === '@graph' &&
      !(_isObject(value) || _isArray(value))) {
      throw new JsonLdError(
        'Invalid JSON-LD syntax; "@graph" value must not be an ' +
        'object or an array.',
        'jsonld.SyntaxError', {code: 'invalid @graph value', value: value});
    }

    // @value must not be an object or an array
    if(expandedProperty === '@value' &&
      (_isObject(value) || _isArray(value))) {
      throw new JsonLdError(
        'Invalid JSON-LD syntax; "@value" value must not be an ' +
        'object or an array.',
        'jsonld.SyntaxError',
        {code: 'invalid value object value', value: value});
    }

    // @language must be a string
    if(expandedProperty === '@language') {
      if(value === null) {
        // drop null @language values, they expand as if they didn't exist
        continue;
      }
      if(!_isString(value)) {
        throw new JsonLdError(
          'Invalid JSON-LD syntax; "@language" value must be a string.',
          'jsonld.SyntaxError',
          {code: 'invalid language-tagged string', value: value});
      }
      // ensure language value is lowercase
      value = value.toLowerCase();
    }

    // @index must be a string
    if(expandedProperty === '@index') {
      if(!_isString(value)) {
        throw new JsonLdError(
          'Invalid JSON-LD syntax; "@index" value must be a string.',
          'jsonld.SyntaxError',
          {code: 'invalid @index value', value: value});
      }
    }

    // @reverse must be an object
    if(expandedProperty === '@reverse') {
      if(!_isObject(value)) {
        throw new JsonLdError(
          'Invalid JSON-LD syntax; "@reverse" value must be an object.',
          'jsonld.SyntaxError', {code: 'invalid @reverse value', value: value});
      }

      expandedValue = self.expand(activeCtx, '@reverse', value, options);

      // properties double-reversed
      if('@reverse' in expandedValue) {
        for(var property in expandedValue['@reverse']) {
          jsonld.addValue(
            rval, property, expandedValue['@reverse'][property],
            {propertyIsArray: true});
        }
      }

      // FIXME: can this be merged with code below to simplify?
      // merge in all reversed properties
      var reverseMap = rval['@reverse'] || null;
      for(var property in expandedValue) {
        if(property === '@reverse') {
          continue;
        }
        if(reverseMap === null) {
          reverseMap = rval['@reverse'] = {};
        }
        jsonld.addValue(reverseMap, property, [], {propertyIsArray: true});
        var items = expandedValue[property];
        for(var ii = 0; ii < items.length; ++ii) {
          var item = items[ii];
          if(_isValue(item) || _isList(item)) {
            throw new JsonLdError(
              'Invalid JSON-LD syntax; "@reverse" value must not be a ' +
              '@value or an @list.', 'jsonld.SyntaxError',
              {code: 'invalid reverse property value', value: expandedValue});
          }
          jsonld.addValue(
            reverseMap, property, item, {propertyIsArray: true});
        }
      }

      continue;
    }

    var container = jsonld.getContextValue(activeCtx, key, '@container');

    if(container === '@language' && _isObject(value)) {
      // handle language map container (skip if value is not an object)
      expandedValue = _expandLanguageMap(value);
    } else if(container === '@index' && _isObject(value)) {
      // handle index container (skip if value is not an object)
      expandedValue = (function _expandIndexMap(activeProperty) {
        var rval = [];
        var keys = Object.keys(value).sort();
        for(var ki = 0; ki < keys.length; ++ki) {
          var key = keys[ki];
          var val = value[key];
          if(!_isArray(val)) {
            val = [val];
          }
          val = self.expand(activeCtx, activeProperty, val, options, false);
          for(var vi = 0; vi < val.length; ++vi) {
            var item = val[vi];
            if(!('@index' in item)) {
              item['@index'] = key;
            }
            rval.push(item);
          }
        }
        return rval;
      })(key);
    } else {
      // recurse into @list or @set
      var isList = (expandedProperty === '@list');
      if(isList || expandedProperty === '@set') {
        var nextActiveProperty = activeProperty;
        if(isList && expandedActiveProperty === '@graph') {
          nextActiveProperty = null;
        }
        expandedValue = self.expand(
          activeCtx, nextActiveProperty, value, options, isList);
        if(isList && _isList(expandedValue)) {
          throw new JsonLdError(
            'Invalid JSON-LD syntax; lists of lists are not permitted.',
            'jsonld.SyntaxError', {code: 'list of lists'});
        }
      } else {
        // recursively expand value with key as new active property
        expandedValue = self.expand(activeCtx, key, value, options, false);
      }
    }

    // drop null values if property is not @value
    if(expandedValue === null && expandedProperty !== '@value') {
      continue;
    }

    // convert expanded value to @list if container specifies it
    if(expandedProperty !== '@list' && !_isList(expandedValue) &&
      container === '@list') {
      // ensure expanded value is an array
      expandedValue = (_isArray(expandedValue) ?
        expandedValue : [expandedValue]);
      expandedValue = {'@list': expandedValue};
    }

    // FIXME: can this be merged with code above to simplify?
    // merge in reverse properties
    if(activeCtx.mappings[key] && activeCtx.mappings[key].reverse) {
      var reverseMap = rval['@reverse'] = rval['@reverse'] || {};
      if(!_isArray(expandedValue)) {
        expandedValue = [expandedValue];
      }
      for(var ii = 0; ii < expandedValue.length; ++ii) {
        var item = expandedValue[ii];
        if(_isValue(item) || _isList(item)) {
          throw new JsonLdError(
            'Invalid JSON-LD syntax; "@reverse" value must not be a ' +
            '@value or an @list.', 'jsonld.SyntaxError',
            {code: 'invalid reverse property value', value: expandedValue});
        }
        jsonld.addValue(
          reverseMap, expandedProperty, item, {propertyIsArray: true});
      }
      continue;
    }

    // add value for property
    // use an array except for certain keywords
    var useArray =
      ['@index', '@id', '@type', '@value', '@language'].indexOf(
        expandedProperty) === -1;
    jsonld.addValue(
      rval, expandedProperty, expandedValue, {propertyIsArray: useArray});
  }

  // get property count on expanded output
  keys = Object.keys(rval);
  var count = keys.length;

  if('@value' in rval) {
    // @value must only have @language or @type
    if('@type' in rval && '@language' in rval) {
      throw new JsonLdError(
        'Invalid JSON-LD syntax; an element containing "@value" may not ' +
        'contain both "@type" and "@language".',
        'jsonld.SyntaxError', {code: 'invalid value object', element: rval});
    }
    var validCount = count - 1;
    if('@type' in rval) {
      validCount -= 1;
    }
    if('@index' in rval) {
      validCount -= 1;
    }
    if('@language' in rval) {
      validCount -= 1;
    }
    if(validCount !== 0) {
      throw new JsonLdError(
        'Invalid JSON-LD syntax; an element containing "@value" may only ' +
        'have an "@index" property and at most one other property ' +
        'which can be "@type" or "@language".',
        'jsonld.SyntaxError', {code: 'invalid value object', element: rval});
    }
    // drop null @values
    if(rval['@value'] === null) {
      rval = null;
    } else if('@language' in rval && !_isString(rval['@value'])) {
      // if @language is present, @value must be a string
      throw new JsonLdError(
        'Invalid JSON-LD syntax; only strings may be language-tagged.',
        'jsonld.SyntaxError',
        {code: 'invalid language-tagged value', element: rval});
    } else if('@type' in rval && (!_isAbsoluteIri(rval['@type']) ||
      rval['@type'].indexOf('_:') === 0)) {
      throw new JsonLdError(
        'Invalid JSON-LD syntax; an element containing "@value" and "@type" ' +
        'must have an absolute IRI for the value of "@type".',
        'jsonld.SyntaxError', {code: 'invalid typed value', element: rval});
    }
  } else if('@type' in rval && !_isArray(rval['@type'])) {
    // convert @type to an array
    rval['@type'] = [rval['@type']];
  } else if('@set' in rval || '@list' in rval) {
    // handle @set and @list
    if(count > 1 && !(count === 2 && '@index' in rval)) {
      throw new JsonLdError(
        'Invalid JSON-LD syntax; if an element has the property "@set" ' +
        'or "@list", then it can have at most one other property that is ' +
        '"@index".', 'jsonld.SyntaxError',
        {code: 'invalid set or list object', element: rval});
    }
    // optimize away @set
    if('@set' in rval) {
      rval = rval['@set'];
      keys = Object.keys(rval);
      count = keys.length;
    }
  } else if(count === 1 && '@language' in rval) {
    // drop objects with only @language
    rval = null;
  }

  // drop certain top-level objects that do not occur in lists
  if(_isObject(rval) &&
    !options.keepFreeFloatingNodes && !insideList &&
    (activeProperty === null || expandedActiveProperty === '@graph')) {
    // drop empty object, top-level @value/@list, or object with only @id
    if(count === 0 || '@value' in rval || '@list' in rval ||
      (count === 1 && '@id' in rval)) {
      rval = null;
    }
  }

  return rval;
};

/**
 * Creates a JSON-LD node map (node ID => node).
 *
 * @param input the expanded JSON-LD to create a node map of.
 * @param [options] the options to use:
 *          [issuer] a jsonld.IdentifierIssuer to use to label blank nodes.
 *          [namer] (deprecated).
 *
 * @return the node map.
 */
Processor.prototype.createNodeMap = function(input, options) {
  options = options || {};

  // produce a map of all subjects and name each bnode
  var issuer = options.namer || options.issuer || new IdentifierIssuer('_:b');
  var graphs = {'@default': {}};
  _createNodeMap(input, graphs, '@default', issuer);

  // add all non-default graphs to default graph
  return _mergeNodeMaps(graphs);
};

/**
 * Performs JSON-LD flattening.
 *
 * @param input the expanded JSON-LD to flatten.
 *
 * @return the flattened output.
 */
Processor.prototype.flatten = function(input) {
  var defaultGraph = this.createNodeMap(input);

  // produce flattened output
  var flattened = [];
  var keys = Object.keys(defaultGraph).sort();
  for(var ki = 0; ki < keys.length; ++ki) {
    var node = defaultGraph[keys[ki]];
    // only add full subjects to top-level
    if(!_isSubjectReference(node)) {
      flattened.push(node);
    }
  }
  return flattened;
};

/**
 * Performs JSON-LD framing.
 *
 * @param input the expanded JSON-LD to frame.
 * @param frame the expanded JSON-LD frame to use.
 * @param options the framing options.
 *
 * @return the framed output.
 */
Processor.prototype.frame = function(input, frame, options) {
  // create framing state
  var state = {
    options: options,
    graphs: {'@default': {}, '@merged': {}},
    subjectStack: [],
    link: {}
  };

  // produce a map of all graphs and name each bnode
  // FIXME: currently uses subjects from @merged graph only
  var issuer = new IdentifierIssuer('_:b');
  _createNodeMap(input, state.graphs, '@merged', issuer);
  state.subjects = state.graphs['@merged'];

  // frame the subjects
  var framed = [];
  _frame(state, Object.keys(state.subjects).sort(), frame, framed, null);
  return framed;
};

/**
 * Performs normalization on the given RDF dataset.
 *
 * @param dataset the RDF dataset to normalize.
 * @param options the normalization options.
 * @param callback(err, normalized) called once the operation completes.
 */
Processor.prototype.normalize = function(dataset, options, callback) {
  if(options.algorithm === 'URDNA2015') {
    return new URDNA2015(options).main(dataset, callback);
  }
  if(options.algorithm === 'URGNA2012') {
    return new URGNA2012(options).main(dataset, callback);
  }
  callback(new Error(
    'Invalid RDF Dataset Normalization algorithm: ' + options.algorithm));
};

/**
 * Converts an RDF dataset to JSON-LD.
 *
 * @param dataset the RDF dataset.
 * @param options the RDF serialization options.
 * @param callback(err, output) called once the operation completes.
 */
Processor.prototype.fromRDF = function(dataset, options, callback) {
  var defaultGraph = {};
  var graphMap = {'@default': defaultGraph};
  var referencedOnce = {};

  for(var name in dataset) {
    var graph = dataset[name];
    if(!(name in graphMap)) {
      graphMap[name] = {};
    }
    if(name !== '@default' && !(name in defaultGraph)) {
      defaultGraph[name] = {'@id': name};
    }
    var nodeMap = graphMap[name];
    for(var ti = 0; ti < graph.length; ++ti) {
      var triple = graph[ti];

      // get subject, predicate, object
      var s = triple.subject.value;
      var p = triple.predicate.value;
      var o = triple.object;

      if(!(s in nodeMap)) {
        nodeMap[s] = {'@id': s};
      }
      var node = nodeMap[s];

      var objectIsId = (o.type === 'IRI' || o.type === 'blank node');
      if(objectIsId && !(o.value in nodeMap)) {
        nodeMap[o.value] = {'@id': o.value};
      }

      if(p === RDF_TYPE && !options.useRdfType && objectIsId) {
        jsonld.addValue(node, '@type', o.value, {propertyIsArray: true});
        continue;
      }

      var value = _RDFToObject(o, options.useNativeTypes);
      jsonld.addValue(node, p, value, {propertyIsArray: true});

      // object may be an RDF list/partial list node but we can't know easily
      // until all triples are read
      if(objectIsId) {
        if(o.value === RDF_NIL) {
          // track rdf:nil uniquely per graph
          var object = nodeMap[o.value];
          if(!('usages' in object)) {
            object.usages = [];
          }
          object.usages.push({
            node: node,
            property: p,
            value: value
          });
        } else if(o.value in referencedOnce) {
          // object referenced more than once
          referencedOnce[o.value] = false;
        } else {
          // keep track of single reference
          referencedOnce[o.value] = {
            node: node,
            property: p,
            value: value
          };
        }
      }
    }
  }

  // convert linked lists to @list arrays
  for(var name in graphMap) {
    var graphObject = graphMap[name];

    // no @lists to be converted, continue
    if(!(RDF_NIL in graphObject)) {
      continue;
    }

    // iterate backwards through each RDF list
    var nil = graphObject[RDF_NIL];
    for(var i = 0; i < nil.usages.length; ++i) {
      var usage = nil.usages[i];
      var node = usage.node;
      var property = usage.property;
      var head = usage.value;
      var list = [];
      var listNodes = [];

      // ensure node is a well-formed list node; it must:
      // 1. Be referenced only once.
      // 2. Have an array for rdf:first that has 1 item.
      // 3. Have an array for rdf:rest that has 1 item.
      // 4. Have no keys other than: @id, rdf:first, rdf:rest, and,
      //   optionally, @type where the value is rdf:List.
      var nodeKeyCount = Object.keys(node).length;
      while(property === RDF_REST &&
        _isObject(referencedOnce[node['@id']]) &&
        _isArray(node[RDF_FIRST]) && node[RDF_FIRST].length === 1 &&
        _isArray(node[RDF_REST]) && node[RDF_REST].length === 1 &&
        (nodeKeyCount === 3 || (nodeKeyCount === 4 && _isArray(node['@type']) &&
          node['@type'].length === 1 && node['@type'][0] === RDF_LIST))) {
        list.push(node[RDF_FIRST][0]);
        listNodes.push(node['@id']);

        // get next node, moving backwards through list
        usage = referencedOnce[node['@id']];
        node = usage.node;
        property = usage.property;
        head = usage.value;
        nodeKeyCount = Object.keys(node).length;

        // if node is not a blank node, then list head found
        if(node['@id'].indexOf('_:') !== 0) {
          break;
        }
      }

      // the list is nested in another list
      if(property === RDF_FIRST) {
        // empty list
        if(node['@id'] === RDF_NIL) {
          // can't convert rdf:nil to a @list object because it would
          // result in a list of lists which isn't supported
          continue;
        }

        // preserve list head
        head = graphObject[head['@id']][RDF_REST][0];
        list.pop();
        listNodes.pop();
      }

      // transform list into @list object
      delete head['@id'];
      head['@list'] = list.reverse();
      for(var j = 0; j < listNodes.length; ++j) {
        delete graphObject[listNodes[j]];
      }
    }

    delete nil.usages;
  }

  var result = [];
  var subjects = Object.keys(defaultGraph).sort();
  for(var i = 0; i < subjects.length; ++i) {
    var subject = subjects[i];
    var node = defaultGraph[subject];
    if(subject in graphMap) {
      var graph = node['@graph'] = [];
      var graphObject = graphMap[subject];
      var subjects_ = Object.keys(graphObject).sort();
      for(var si = 0; si < subjects_.length; ++si) {
        var node_ = graphObject[subjects_[si]];
        // only add full subjects to top-level
        if(!_isSubjectReference(node_)) {
          graph.push(node_);
        }
      }
    }
    // only add full subjects to top-level
    if(!_isSubjectReference(node)) {
      result.push(node);
    }
  }

  callback(null, result);
};

/**
 * Outputs an RDF dataset for the expanded JSON-LD input.
 *
 * @param input the expanded JSON-LD input.
 * @param options the RDF serialization options.
 *
 * @return the RDF dataset.
 */
Processor.prototype.toRDF = function(input, options) {
  // create node map for default graph (and any named graphs)
  var issuer = new IdentifierIssuer('_:b');
  var nodeMap = {'@default': {}};
  _createNodeMap(input, nodeMap, '@default', issuer);

  var dataset = {};
  var graphNames = Object.keys(nodeMap).sort();
  for(var i = 0; i < graphNames.length; ++i) {
    var graphName = graphNames[i];
    // skip relative IRIs
    if(graphName === '@default' || _isAbsoluteIri(graphName)) {
      dataset[graphName] = _graphToRDF(nodeMap[graphName], issuer, options);
    }
  }
  return dataset;
};

/**
 * Processes a local context and returns a new active context.
 *
 * @param activeCtx the current active context.
 * @param localCtx the local context to process.
 * @param options the context processing options.
 *
 * @return the new active context.
 */
Processor.prototype.processContext = function(activeCtx, localCtx, options) {
  // normalize local context to an array of @context objects
  if(_isObject(localCtx) && '@context' in localCtx &&
    _isArray(localCtx['@context'])) {
    localCtx = localCtx['@context'];
  }
  var ctxs = _isArray(localCtx) ? localCtx : [localCtx];

  // no contexts in array, clone existing context
  if(ctxs.length === 0) {
    return activeCtx.clone();
  }

  // process each context in order, update active context
  // on each iteration to ensure proper caching
  var rval = activeCtx;
  for(var i = 0; i < ctxs.length; ++i) {
    var ctx = ctxs[i];

    // reset to initial context
    if(ctx === null) {
      rval = activeCtx = _getInitialContext(options);
      continue;
    }

    // dereference @context key if present
    if(_isObject(ctx) && '@context' in ctx) {
      ctx = ctx['@context'];
    }

    // context must be an object by now, all URLs retrieved before this call
    if(!_isObject(ctx)) {
      throw new JsonLdError(
        'Invalid JSON-LD syntax; @context must be an object.',
        'jsonld.SyntaxError', {code: 'invalid local context', context: ctx});
    }

    // get context from cache if available
    if(jsonld.cache.activeCtx) {
      var cached = jsonld.cache.activeCtx.get(activeCtx, ctx);
      if(cached) {
        rval = activeCtx = cached;
        continue;
      }
    }

    // update active context and clone new one before updating
    activeCtx = rval;
    rval = rval.clone();

    // define context mappings for keys in local context
    var defined = {};

    // handle @base
    if('@base' in ctx) {
      var base = ctx['@base'];

      // clear base
      if(base === null) {
        base = null;
      } else if(!_isString(base)) {
        throw new JsonLdError(
          'Invalid JSON-LD syntax; the value of "@base" in a ' +
          '@context must be a string or null.',
          'jsonld.SyntaxError', {code: 'invalid base IRI', context: ctx});
      } else if(base !== '' && !_isAbsoluteIri(base)) {
        throw new JsonLdError(
          'Invalid JSON-LD syntax; the value of "@base" in a ' +
          '@context must be an absolute IRI or the empty string.',
          'jsonld.SyntaxError', {code: 'invalid base IRI', context: ctx});
      }

      if(base !== null) {
        base = jsonld.url.parse(base || '');
      }
      rval['@base'] = base;
      defined['@base'] = true;
    }

    // handle @vocab
    if('@vocab' in ctx) {
      var value = ctx['@vocab'];
      if(value === null) {
        delete rval['@vocab'];
      } else if(!_isString(value)) {
        throw new JsonLdError(
          'Invalid JSON-LD syntax; the value of "@vocab" in a ' +
          '@context must be a string or null.',
          'jsonld.SyntaxError', {code: 'invalid vocab mapping', context: ctx});
      } else if(!_isAbsoluteIri(value)) {
        throw new JsonLdError(
          'Invalid JSON-LD syntax; the value of "@vocab" in a ' +
          '@context must be an absolute IRI.',
          'jsonld.SyntaxError', {code: 'invalid vocab mapping', context: ctx});
      } else {
        rval['@vocab'] = value;
      }
      defined['@vocab'] = true;
    }

    // handle @language
    if('@language' in ctx) {
      var value = ctx['@language'];
      if(value === null) {
        delete rval['@language'];
      } else if(!_isString(value)) {
        throw new JsonLdError(
          'Invalid JSON-LD syntax; the value of "@language" in a ' +
          '@context must be a string or null.',
          'jsonld.SyntaxError',
          {code: 'invalid default language', context: ctx});
      } else {
        rval['@language'] = value.toLowerCase();
      }
      defined['@language'] = true;
    }

    // process all other keys
    for(var key in ctx) {
      _createTermDefinition(rval, ctx, key, defined);
    }

    // cache result
    if(jsonld.cache.activeCtx) {
      jsonld.cache.activeCtx.set(activeCtx, ctx, rval);
    }
  }

  return rval;
};

/**
 * Expands a language map.
 *
 * @param languageMap the language map to expand.
 *
 * @return the expanded language map.
 */
function _expandLanguageMap(languageMap) {
  var rval = [];
  var keys = Object.keys(languageMap).sort();
  for(var ki = 0; ki < keys.length; ++ki) {
    var key = keys[ki];
    var val = languageMap[key];
    if(!_isArray(val)) {
      val = [val];
    }
    for(var vi = 0; vi < val.length; ++vi) {
      var item = val[vi];
      if(item === null) {
          // null values are allowed (8.5) but ignored (3.1)
          continue;
      }
      if(!_isString(item)) {
        throw new JsonLdError(
          'Invalid JSON-LD syntax; language map values must be strings.',
          'jsonld.SyntaxError',
          {code: 'invalid language map value', languageMap: languageMap});
      }
      rval.push({
        '@value': item,
        '@language': key.toLowerCase()
      });
    }
  }
  return rval;
}

/**
 * Labels the blank nodes in the given value using the given IdentifierIssuer.
 *
 * @param issuer the IdentifierIssuer to use.
 * @param element the element with blank nodes to rename.
 *
 * @return the element.
 */
function _labelBlankNodes(issuer, element) {
  if(_isArray(element)) {
    for(var i = 0; i < element.length; ++i) {
      element[i] = _labelBlankNodes(issuer, element[i]);
    }
  } else if(_isList(element)) {
    element['@list'] = _labelBlankNodes(issuer, element['@list']);
  } else if(_isObject(element)) {
    // relabel blank node
    if(_isBlankNode(element)) {
      element['@id'] = issuer.getId(element['@id']);
    }

    // recursively apply to all keys
    var keys = Object.keys(element).sort();
    for(var ki = 0; ki < keys.length; ++ki) {
      var key = keys[ki];
      if(key !== '@id') {
        element[key] = _labelBlankNodes(issuer, element[key]);
      }
    }
  }

  return element;
}

/**
 * Expands the given value by using the coercion and keyword rules in the
 * given context.
 *
 * @param activeCtx the active context to use.
 * @param activeProperty the active property the value is associated with.
 * @param value the value to expand.
 *
 * @return the expanded value.
 */
function _expandValue(activeCtx, activeProperty, value) {
  // nothing to expand
  if(value === null || value === undefined) {
    return null;
  }

  // special-case expand @id and @type (skips '@id' expansion)
  var expandedProperty = _expandIri(activeCtx, activeProperty, {vocab: true});
  if(expandedProperty === '@id') {
    return _expandIri(activeCtx, value, {base: true});
  } else if(expandedProperty === '@type') {
    return _expandIri(activeCtx, value, {vocab: true, base: true});
  }

  // get type definition from context
  var type = jsonld.getContextValue(activeCtx, activeProperty, '@type');

  // do @id expansion (automatic for @graph)
  if(type === '@id' || (expandedProperty === '@graph' && _isString(value))) {
    return {'@id': _expandIri(activeCtx, value, {base: true})};
  }
  // do @id expansion w/vocab
  if(type === '@vocab') {
    return {'@id': _expandIri(activeCtx, value, {vocab: true, base: true})};
  }

  // do not expand keyword values
  if(_isKeyword(expandedProperty)) {
    return value;
  }

  var rval = {};

  if(type !== null) {
    // other type
    rval['@type'] = type;
  } else if(_isString(value)) {
    // check for language tagging for strings
    var language = jsonld.getContextValue(
      activeCtx, activeProperty, '@language');
    if(language !== null) {
      rval['@language'] = language;
    }
  }
  // do conversion of values that aren't basic JSON types to strings
  if(['boolean', 'number', 'string'].indexOf(typeof value) === -1) {
    value = value.toString();
  }
  rval['@value'] = value;

  return rval;
}

/**
 * Creates an array of RDF triples for the given graph.
 *
 * @param graph the graph to create RDF triples for.
 * @param issuer a IdentifierIssuer for assigning blank node names.
 * @param options the RDF serialization options.
 *
 * @return the array of RDF triples for the given graph.
 */
function _graphToRDF(graph, issuer, options) {
  var rval = [];

  var ids = Object.keys(graph).sort();
  for(var i = 0; i < ids.length; ++i) {
    var id = ids[i];
    var node = graph[id];
    var properties = Object.keys(node).sort();
    for(var pi = 0; pi < properties.length; ++pi) {
      var property = properties[pi];
      var items = node[property];
      if(property === '@type') {
        property = RDF_TYPE;
      } else if(_isKeyword(property)) {
        continue;
      }

      for(var ii = 0; ii < items.length; ++ii) {
        var item = items[ii];

        // RDF subject
        var subject = {};
        subject.type = (id.indexOf('_:') === 0) ? 'blank node' : 'IRI';
        subject.value = id;

        // skip relative IRI subjects
        if(!_isAbsoluteIri(id)) {
          continue;
        }

        // RDF predicate
        var predicate = {};
        predicate.type = (property.indexOf('_:') === 0) ? 'blank node' : 'IRI';
        predicate.value = property;

        // skip relative IRI predicates
        if(!_isAbsoluteIri(property)) {
          continue;
        }

        // skip blank node predicates unless producing generalized RDF
        if(predicate.type === 'blank node' && !options.produceGeneralizedRdf) {
          continue;
        }

        // convert @list to triples
        if(_isList(item)) {
          _listToRDF(item['@list'], issuer, subject, predicate, rval);
        } else {
          // convert value or node object to triple
          var object = _objectToRDF(item);
          // skip null objects (they are relative IRIs)
          if(object) {
            rval.push({subject: subject, predicate: predicate, object: object});
          }
        }
      }
    }
  }

  return rval;
}

/**
 * Converts a @list value into linked list of blank node RDF triples
 * (an RDF collection).
 *
 * @param list the @list value.
 * @param issuer a IdentifierIssuer for assigning blank node names.
 * @param subject the subject for the head of the list.
 * @param predicate the predicate for the head of the list.
 * @param triples the array of triples to append to.
 */
function _listToRDF(list, issuer, subject, predicate, triples) {
  var first = {type: 'IRI', value: RDF_FIRST};
  var rest = {type: 'IRI', value: RDF_REST};
  var nil = {type: 'IRI', value: RDF_NIL};

  for(var i = 0; i < list.length; ++i) {
    var item = list[i];

    var blankNode = {type: 'blank node', value: issuer.getId()};
    triples.push({subject: subject, predicate: predicate, object: blankNode});

    subject = blankNode;
    predicate = first;
    var object = _objectToRDF(item);

    // skip null objects (they are relative IRIs)
    if(object) {
      triples.push({subject: subject, predicate: predicate, object: object});
    }

    predicate = rest;
  }

  triples.push({subject: subject, predicate: predicate, object: nil});
}

/**
 * Converts a JSON-LD value object to an RDF literal or a JSON-LD string or
 * node object to an RDF resource.
 *
 * @param item the JSON-LD value or node object.
 *
 * @return the RDF literal or RDF resource.
 */
function _objectToRDF(item) {
  var object = {};

  // convert value object to RDF
  if(_isValue(item)) {
    object.type = 'literal';
    var value = item['@value'];
    var datatype = item['@type'] || null;

    // convert to XSD datatypes as appropriate
    if(_isBoolean(value)) {
      object.value = value.toString();
      object.datatype = datatype || XSD_BOOLEAN;
    } else if(_isDouble(value) || datatype === XSD_DOUBLE) {
      if(!_isDouble(value)) {
        value = parseFloat(value);
      }
      // canonical double representation
      object.value = value.toExponential(15).replace(/(\d)0*e\+?/, '$1E');
      object.datatype = datatype || XSD_DOUBLE;
    } else if(_isNumber(value)) {
      object.value = value.toFixed(0);
      object.datatype = datatype || XSD_INTEGER;
    } else if('@language' in item) {
      object.value = value;
      object.datatype = datatype || RDF_LANGSTRING;
      object.language = item['@language'];
    } else {
      object.value = value;
      object.datatype = datatype || XSD_STRING;
    }
  } else {
    // convert string/node object to RDF
    var id = _isObject(item) ? item['@id'] : item;
    object.type = (id.indexOf('_:') === 0) ? 'blank node' : 'IRI';
    object.value = id;
  }

  // skip relative IRIs
  if(object.type === 'IRI' && !_isAbsoluteIri(object.value)) {
    return null;
  }

  return object;
}

/**
 * Converts an RDF triple object to a JSON-LD object.
 *
 * @param o the RDF triple object to convert.
 * @param useNativeTypes true to output native types, false not to.
 *
 * @return the JSON-LD object.
 */
function _RDFToObject(o, useNativeTypes) {
  // convert IRI/blank node object to JSON-LD
  if(o.type === 'IRI' || o.type === 'blank node') {
    return {'@id': o.value};
  }

  // convert literal to JSON-LD
  var rval = {'@value': o.value};

  // add language
  if(o.language) {
    rval['@language'] = o.language;
  } else {
    var type = o.datatype;
    if(!type) {
      type = XSD_STRING;
    }
    // use native types for certain xsd types
    if(useNativeTypes) {
      if(type === XSD_BOOLEAN) {
        if(rval['@value'] === 'true') {
          rval['@value'] = true;
        } else if(rval['@value'] === 'false') {
          rval['@value'] = false;
        }
      } else if(_isNumeric(rval['@value'])) {
        if(type === XSD_INTEGER) {
          var i = parseInt(rval['@value'], 10);
          if(i.toFixed(0) === rval['@value']) {
            rval['@value'] = i;
          }
        } else if(type === XSD_DOUBLE) {
          rval['@value'] = parseFloat(rval['@value']);
        }
      }
      // do not add native type
      if([XSD_BOOLEAN, XSD_INTEGER, XSD_DOUBLE, XSD_STRING]
        .indexOf(type) === -1) {
        rval['@type'] = type;
      }
    } else if(type !== XSD_STRING) {
      rval['@type'] = type;
    }
  }

  return rval;
}

/**
 * Compares two RDF triples for equality.
 *
 * @param t1 the first triple.
 * @param t2 the second triple.
 *
 * @return true if the triples are the same, false if not.
 */
function _compareRDFTriples(t1, t2) {
  var attrs = ['subject', 'predicate', 'object'];
  for(var i = 0; i < attrs.length; ++i) {
    var attr = attrs[i];
    if(t1[attr].type !== t2[attr].type || t1[attr].value !== t2[attr].value) {
      return false;
    }
  }
  if(t1.object.language !== t2.object.language) {
    return false;
  }
  if(t1.object.datatype !== t2.object.datatype) {
    return false;
  }
  return true;
}

/////////////////////////////// DEFINE URDNA2015 //////////////////////////////

var URDNA2015 = (function() {

var POSITIONS = {'subject': 's', 'object': 'o', 'name': 'g'};

var Normalize = function(options) {
  options = options || {};
  this.name = 'URDNA2015';
  this.options = options;
  this.blankNodeInfo = {};
  this.hashToBlankNodes = {};
  this.canonicalIssuer = new IdentifierIssuer('_:c14n');
  this.quads = [];
  this.schedule = {};
  if('maxCallStackDepth' in options) {
    this.schedule.MAX_DEPTH = options.maxCallStackDepth;
  } else {
    this.schedule.MAX_DEPTH = 500;
  }
  if('maxTotalCallStackDepth' in options) {
    this.schedule.MAX_TOTAL_DEPTH = options.maxCallStackDepth;
  } else {
    this.schedule.MAX_TOTAL_DEPTH = 0xFFFFFFFF;
  }
  this.schedule.depth = 0;
  this.schedule.totalDepth = 0;
  if('timeSlice' in options) {
    this.schedule.timeSlice = options.timeSlice;
  } else {
    // milliseconds
    this.schedule.timeSlice = 10;
  }
};

// do some work in a time slice, but in serial
Normalize.prototype.doWork = function(fn, callback) {
  var schedule = this.schedule;

  if(schedule.totalDepth >= schedule.MAX_TOTAL_DEPTH) {
    return callback(new Error(
      'Maximum total call stack depth exceeded; normalization aborting.'));
  }

  (function work() {
    if(schedule.depth === schedule.MAX_DEPTH) {
      // stack too deep, run on next tick
      schedule.depth = 0;
      schedule.running = false;
      return jsonld.nextTick(work);
    }

    // if not yet running, force run
    var now = new Date().getTime();
    if(!schedule.running) {
      schedule.start = new Date().getTime();
      schedule.deadline = schedule.start + schedule.timeSlice;
    }

    // TODO: should also include an estimate of expectedWorkTime
    if(now < schedule.deadline) {
      schedule.running = true;
      schedule.depth++;
      schedule.totalDepth++;
      return fn(function(err, result) {
        schedule.depth--;
        schedule.totalDepth--;
        callback(err, result);
      });
    }

    // not enough time left in this slice, run after letting browser
    // do some other things
    schedule.depth = 0;
    schedule.running = false;
    jsonld.setImmediate(work);
  })();
};

// asynchronously loop
Normalize.prototype.forEach = function(iterable, fn, callback) {
  var self = this;
  var iterator;
  var idx = 0;
  var length;
  if(_isArray(iterable)) {
    length = iterable.length;
    iterator = function() {
      if(idx === length) {
        return false;
      }
      iterator.value = iterable[idx++];
      iterator.key = idx;
      return true;
    };
  } else {
    var keys = Object.keys(iterable);
    length = keys.length;
    iterator = function() {
      if(idx === length) {
        return false;
      }
      iterator.key = keys[idx++];
      iterator.value = iterable[iterator.key];
      return true;
    };
  }

  (function iterate(err, result) {
    if(err) {
      return callback(err);
    }
    if(iterator()) {
      return self.doWork(function() {
        fn(iterator.value, iterator.key, iterate);
      });
    }
    callback();
  })();
};

// asynchronous waterfall
Normalize.prototype.waterfall = function(fns, callback) {
  var self = this;
  self.forEach(fns, function(fn, idx, callback) {
    self.doWork(fn, callback);
  }, callback);
};

// asynchronous while
Normalize.prototype.whilst = function(condition, fn, callback) {
  var self = this;
  (function loop(err) {
    if(err) {
      return callback(err);
    }
    if(!condition()) {
      return callback();
    }
    self.doWork(fn, loop);
  })();
};

// 4.4) Normalization Algorithm
Normalize.prototype.main = function(dataset, callback) {
  var self = this;
  self.schedule.start = new Date().getTime();
  var result;

  // handle invalid output format
  if(self.options.format) {
    if(self.options.format !== 'application/nquads') {
      return callback(new JsonLdError(
        'Unknown output format.',
        'jsonld.UnknownFormat', {format: self.options.format}));
    }
  }

  // 1) Create the normalization state.

  // Note: Optimize by generating non-normalized blank node map concurrently.
  var nonNormalized = {};

  self.waterfall([
    function(callback) {
      // 2) For every quad in input dataset:
      self.forEach(dataset, function(triples, graphName, callback) {
        if(graphName === '@default') {
          graphName = null;
        }
        self.forEach(triples, function(quad, idx, callback) {
          if(graphName !== null) {
            if(graphName.indexOf('_:') === 0) {
              quad.name = {type: 'blank node', value: graphName};
            } else {
              quad.name = {type: 'IRI', value: graphName};
            }
          }
          self.quads.push(quad);

          // 2.1) For each blank node that occurs in the quad, add a reference
          // to the quad using the blank node identifier in the blank node to
          // quads map, creating a new entry if necessary.
          self.forEachComponent(quad, function(component) {
            if(component.type !== 'blank node') {
              return;
            }
            var id = component.value;
            if(id in self.blankNodeInfo) {
              self.blankNodeInfo[id].quads.push(quad);
            } else {
              nonNormalized[id] = true;
              self.blankNodeInfo[id] = {quads: [quad]};
            }
          });
          callback();
        }, callback);
      }, callback);
    },
    function(callback) {
      // 3) Create a list of non-normalized blank node identifiers
      // non-normalized identifiers and populate it using the keys from the
      // blank node to quads map.
      // Note: We use a map here and it was generated during step 2.

      // 4) Initialize simple, a boolean flag, to true.
      var simple = true;

      // 5) While simple is true, issue canonical identifiers for blank nodes:
      self.whilst(function() { return simple; }, function(callback) {
        // 5.1) Set simple to false.
        simple = false;

        // 5.2) Clear hash to blank nodes map.
        self.hashToBlankNodes = {};

        self.waterfall([
          function(callback) {
            // 5.3) For each blank node identifier identifier in non-normalized
            // identifiers:
            self.forEach(nonNormalized, function(value, id, callback) {
              // 5.3.1) Create a hash, hash, according to the Hash First Degree
              // Quads algorithm.
              self.hashFirstDegreeQuads(id, function(err, hash) {
                if(err) {
                  return callback(err);
                }
                // 5.3.2) Add hash and identifier to hash to blank nodes map,
                // creating a new entry if necessary.
                if(hash in self.hashToBlankNodes) {
                  self.hashToBlankNodes[hash].push(id);
                } else {
                  self.hashToBlankNodes[hash] = [id];
                }
                callback();
              });
            }, callback);
          },
          function(callback) {
            // 5.4) For each hash to identifier list mapping in hash to blank
            // nodes map, lexicographically-sorted by hash:
            var hashes = Object.keys(self.hashToBlankNodes).sort();
            self.forEach(hashes, function(hash, i, callback) {
              // 5.4.1) If the length of identifier list is greater than 1,
              // continue to the next mapping.
              var idList = self.hashToBlankNodes[hash];
              if(idList.length > 1) {
                return callback();
              }

              // 5.4.2) Use the Issue Identifier algorithm, passing canonical
              // issuer and the single blank node identifier in identifier
              // list, identifier, to issue a canonical replacement identifier
              // for identifier.
              // TODO: consider changing `getId` to `issue`
              var id = idList[0];
              self.canonicalIssuer.getId(id);

              // 5.4.3) Remove identifier from non-normalized identifiers.
              delete nonNormalized[id];

              // 5.4.4) Remove hash from the hash to blank nodes map.
              delete self.hashToBlankNodes[hash];

              // 5.4.5) Set simple to true.
              simple = true;
              callback();
            }, callback);
          }
        ], callback);
      }, callback);
    },
    function(callback) {
      // 6) For each hash to identifier list mapping in hash to blank nodes map,
      // lexicographically-sorted by hash:
      var hashes = Object.keys(self.hashToBlankNodes).sort();
      self.forEach(hashes, function(hash, idx, callback) {
        // 6.1) Create hash path list where each item will be a result of
        // running the Hash N-Degree Quads algorithm.
        var hashPathList = [];

        // 6.2) For each blank node identifier identifier in identifier list:
        var idList = self.hashToBlankNodes[hash];
        self.waterfall([
          function(callback) {
            self.forEach(idList, function(id, idx, callback) {
              // 6.2.1) If a canonical identifier has already been issued for
              // identifier, continue to the next identifier.
              if(self.canonicalIssuer.hasId(id)) {
                return callback();
              }

              // 6.2.2) Create temporary issuer, an identifier issuer
              // initialized with the prefix _:b.
              var issuer = new IdentifierIssuer('_:b');

              // 6.2.3) Use the Issue Identifier algorithm, passing temporary
              // issuer and identifier, to issue a new temporary blank node
              // identifier for identifier.
              issuer.getId(id);

              // 6.2.4) Run the Hash N-Degree Quads algorithm, passing
              // temporary issuer, and append the result to the hash path list.
              self.hashNDegreeQuads(id, issuer, function(err, result) {
                if(err) {
                  return callback(err);
                }
                hashPathList.push(result);
                callback();
              });
            }, callback);
          },
          function(callback) {
            // 6.3) For each result in the hash path list,
            // lexicographically-sorted by the hash in result:
            hashPathList.sort(function(a, b) {
              return (a.hash < b.hash) ? -1 : ((a.hash > b.hash) ? 1 : 0);
            });
            self.forEach(hashPathList, function(result, idx, callback) {
              // 6.3.1) For each blank node identifier, existing identifier,
              // that was issued a temporary identifier by identifier issuer
              // in result, issue a canonical identifier, in the same order,
              // using the Issue Identifier algorithm, passing canonical
              // issuer and existing identifier.
              for(var existing in result.issuer.existing) {
                self.canonicalIssuer.getId(existing);
              }
              callback();
            }, callback);
          }
        ], callback);
      }, callback);
    }, function(callback) {
      /* Note: At this point all blank nodes in the set of RDF quads have been
      assigned canonical identifiers, which have been stored in the canonical
      issuer. Here each quad is updated by assigning each of its blank nodes
      its new identifier. */

      // 7) For each quad, quad, in input dataset:
      var normalized = [];
      self.waterfall([
        function(callback) {
          self.forEach(self.quads, function(quad, idx, callback) {
            // 7.1) Create a copy, quad copy, of quad and replace any existing
            // blank node identifiers using the canonical identifiers
            // previously issued by canonical issuer.
            // Note: We optimize away the copy here.
            self.forEachComponent(quad, function(component) {
              if(component.type === 'blank node' &&
                component.value.indexOf(self.canonicalIssuer.prefix) !== 0) {
                component.value = self.canonicalIssuer.getId(component.value);
              }
            });
            // 7.2) Add quad copy to the normalized dataset.
            normalized.push(_toNQuad(quad));
            callback();
          }, callback);
        },
        function(callback) {
          // sort normalized output
          normalized.sort();

          // 8) Return the normalized dataset.
          if(self.options.format === 'application/nquads') {
            result = normalized.join('');
            return callback();
          }

          result = _parseNQuads(normalized.join(''));
          callback();
        }
      ], callback);
    }
  ], function(err) {
    callback(err, result);
  });
};

// 4.6) Hash First Degree Quads
Normalize.prototype.hashFirstDegreeQuads = function(id, callback) {
  var self = this;

  // return cached hash
  var info = self.blankNodeInfo[id];
  if('hash' in info) {
    return callback(null, info.hash);
  }

  // 1) Initialize nquads to an empty list. It will be used to store quads in
  // N-Quads format.
  var nquads = [];

  // 2) Get the list of quads quads associated with the reference blank node
  // identifier in the blank node to quads map.
  var quads = info.quads;

  // 3) For each quad quad in quads:
  self.forEach(quads, function(quad, idx, callback) {
    // 3.1) Serialize the quad in N-Quads format with the following special
    // rule:

    // 3.1.1) If any component in quad is an blank node, then serialize it
    // using a special identifier as follows:
    var copy = {predicate: quad.predicate};
    self.forEachComponent(quad, function(component, key) {
      // 3.1.2) If the blank node's existing blank node identifier matches the
      // reference blank node identifier then use the blank node identifier _:a,
      // otherwise, use the blank node identifier _:z.
      copy[key] = self.modifyFirstDegreeComponent(id, component, key);
    });
    nquads.push(_toNQuad(copy));
    callback();
  }, function(err) {
    if(err) {
      return callback(err);
    }
    // 4) Sort nquads in lexicographical order.
    nquads.sort();

    // 5) Return the hash that results from passing the sorted, joined nquads
    // through the hash algorithm.
    info.hash = NormalizeHash.hashNQuads(self.name, nquads);
    callback(null, info.hash);
  });
};

// helper for modifying component during Hash First Degree Quads
Normalize.prototype.modifyFirstDegreeComponent = function(id, component) {
  if(component.type !== 'blank node') {
    return component;
  }
  component = _clone(component);
  component.value = (component.value === id ? '_:a' : '_:z');
  return component;
};

// 4.7) Hash Related Blank Node
Normalize.prototype.hashRelatedBlankNode = function(
  related, quad, issuer, position, callback) {
  var self = this;

  // 1) Set the identifier to use for related, preferring first the canonical
  // identifier for related if issued, second the identifier issued by issuer
  // if issued, and last, if necessary, the result of the Hash First Degree
  // Quads algorithm, passing related.
  var id;
  self.waterfall([
    function(callback) {
      if(self.canonicalIssuer.hasId(related)) {
        id = self.canonicalIssuer.getId(related);
        return callback();
      }
      if(issuer.hasId(related)) {
        id = issuer.getId(related);
        return callback();
      }
      self.hashFirstDegreeQuads(related, function(err, hash) {
        if(err) {
          return callback(err);
        }
        id = hash;
        callback();
      });
    }
  ], function(err) {
    if(err) {
      return callback(err);
    }

    // 2) Initialize a string input to the value of position.
    // Note: We use a hash object instead.
    var md = new NormalizeHash(self.name);
    md.update(position);

    // 3) If position is not g, append <, the value of the predicate in quad,
    // and > to input.
    if(position !== 'g') {
      md.update(self.getRelatedPredicate(quad));
    }

    // 4) Append identifier to input.
    md.update(id);

    // 5) Return the hash that results from passing input through the hash
    // algorithm.
    return callback(null, md.digest());
  });
};

// helper for getting a related predicate
Normalize.prototype.getRelatedPredicate = function(quad) {
  return '<' + quad.predicate.value + '>';
};

// 4.8) Hash N-Degree Quads
Normalize.prototype.hashNDegreeQuads = function(id, issuer, callback) {
  var self = this;

  // 1) Create a hash to related blank nodes map for storing hashes that
  // identify related blank nodes.
  // Note: 2) and 3) handled within `createHashToRelated`
  var hashToRelated;
  var md = new NormalizeHash(self.name);
  self.waterfall([
    function(callback) {
      self.createHashToRelated(id, issuer, function(err, result) {
        if(err) {
          return callback(err);
        }
        hashToRelated = result;
        callback();
      });
    },
    function(callback) {
      // 4) Create an empty string, data to hash.
      // Note: We created a hash object `md` above instead.

      // 5) For each related hash to blank node list mapping in hash to related
      // blank nodes map, sorted lexicographically by related hash:
      var hashes = Object.keys(hashToRelated).sort();
      self.forEach(hashes, function(hash, idx, callback) {
        // 5.1) Append the related hash to the data to hash.
        md.update(hash);

        // 5.2) Create a string chosen path.
        var chosenPath = '';

        // 5.3) Create an unset chosen issuer variable.
        var chosenIssuer;

        // 5.4) For each permutation of blank node list:
        var permutator = new Permutator(hashToRelated[hash]);
        self.whilst(
          function() { return permutator.hasNext(); },
          function(nextPermutation) {
          var permutation = permutator.next();

          // 5.4.1) Create a copy of issuer, issuer copy.
          var issuerCopy = issuer.clone();

          // 5.4.2) Create a string path.
          var path = '';

          // 5.4.3) Create a recursion list, to store blank node identifiers
          // that must be recursively processed by this algorithm.
          var recursionList = [];

          self.waterfall([
            function(callback) {
              // 5.4.4) For each related in permutation:
              self.forEach(permutation, function(related, idx, callback) {
                // 5.4.4.1) If a canonical identifier has been issued for
                // related, append it to path.
                if(self.canonicalIssuer.hasId(related)) {
                  path += self.canonicalIssuer.getId(related);
                } else {
                  // 5.4.4.2) Otherwise:
                  // 5.4.4.2.1) If issuer copy has not issued an identifier for
                  // related, append related to recursion list.
                  if(!issuerCopy.hasId(related)) {
                    recursionList.push(related);
                  }
                  // 5.4.4.2.2) Use the Issue Identifier algorithm, passing
                  // issuer copy and related and append the result to path.
                  path += issuerCopy.getId(related);
                }

                // 5.4.4.3) If chosen path is not empty and the length of path
                // is greater than or equal to the length of chosen path and
                // path is lexicographically greater than chosen path, then
                // skip to the next permutation.
                if(chosenPath.length !== 0 &&
                  path.length >= chosenPath.length && path > chosenPath) {
                  // FIXME: may cause inaccurate total depth calculation
                  return nextPermutation();
                }
                callback();
              }, callback);
            },
            function(callback) {
              // 5.4.5) For each related in recursion list:
              self.forEach(recursionList, function(related, idx, callback) {
                // 5.4.5.1) Set result to the result of recursively executing
                // the Hash N-Degree Quads algorithm, passing related for
                // identifier and issuer copy for path identifier issuer.
                self.hashNDegreeQuads(
                  related, issuerCopy, function(err, result) {
                  if(err) {
                    return callback(err);
                  }

                  // 5.4.5.2) Use the Issue Identifier algorithm, passing issuer
                  // copy and related and append the result to path.
                  path += issuerCopy.getId(related);

                  // 5.4.5.3) Append <, the hash in result, and > to path.
                  path += '<' + result.hash + '>';

                  // 5.4.5.4) Set issuer copy to the identifier issuer in
                  // result.
                  issuerCopy = result.issuer;

                  // 5.4.5.5) If chosen path is not empty and the length of path
                  // is greater than or equal to the length of chosen path and
                  // path is lexicographically greater than chosen path, then
                  // skip to the next permutation.
                  if(chosenPath.length !== 0 &&
                    path.length >= chosenPath.length && path > chosenPath) {
                    // FIXME: may cause inaccurate total depth calculation
                    return nextPermutation();
                  }
                  callback();
                });
              }, callback);
            },
            function(callback) {
              // 5.4.6) If chosen path is empty or path is lexicographically
              // less than chosen path, set chosen path to path and chosen
              // issuer to issuer copy.
              if(chosenPath.length === 0 || path < chosenPath) {
                chosenPath = path;
                chosenIssuer = issuerCopy;
              }
              callback();
            }
          ], nextPermutation);
        }, function(err) {
          if(err) {
            return callback(err);
          }

          // 5.5) Append chosen path to data to hash.
          md.update(chosenPath);

          // 5.6) Replace issuer, by reference, with chosen issuer.
          issuer = chosenIssuer;
          callback();
        });
      }, callback);
    }
  ], function(err) {
    // 6) Return issuer and the hash that results from passing data to hash
    // through the hash algorithm.
    callback(err, {hash: md.digest(), issuer: issuer});
  });
};

// helper for creating hash to related blank nodes map
Normalize.prototype.createHashToRelated = function(id, issuer, callback) {
  var self = this;

  // 1) Create a hash to related blank nodes map for storing hashes that
  // identify related blank nodes.
  var hashToRelated = {};

  // 2) Get a reference, quads, to the list of quads in the blank node to
  // quads map for the key identifier.
  var quads = self.blankNodeInfo[id].quads;

  // 3) For each quad in quads:
  self.forEach(quads, function(quad, idx, callback) {
    // 3.1) For each component in quad, if component is the subject, object,
    // and graph name and it is a blank node that is not identified by
    // identifier:
    self.forEach(quad, function(component, key, callback) {
      if(key === 'predicate' ||
        !(component.type === 'blank node' && component.value !== id)) {
        return callback();
      }
      // 3.1.1) Set hash to the result of the Hash Related Blank Node
      // algorithm, passing the blank node identifier for component as
      // related, quad, path identifier issuer as issuer, and position as
      // either s, o, or g based on whether component is a subject, object,
      // graph name, respectively.
      var related = component.value;
      var position = POSITIONS[key];
      self.hashRelatedBlankNode(
        related, quad, issuer, position, function(err, hash) {
        if(err) {
          return callback(err);
        }
        // 3.1.2) Add a mapping of hash to the blank node identifier for
        // component to hash to related blank nodes map, adding an entry as
        // necessary.
        if(hash in hashToRelated) {
          hashToRelated[hash].push(related);
        } else {
          hashToRelated[hash] = [related];
        }
        callback();
      });
    }, callback);
  }, function(err) {
    callback(err, hashToRelated);
  });
};

// helper that iterates over quad components (skips predicate)
Normalize.prototype.forEachComponent = function(quad, op) {
  for(var key in quad) {
    // skip `predicate`
    if(key === 'predicate') {
      continue;
    }
    op(quad[key], key, quad);
  }
};

return Normalize;

})(); // end of define URDNA2015

/////////////////////////////// DEFINE URGNA2012 //////////////////////////////

var URGNA2012 = (function() {

var Normalize = function(options) {
  URDNA2015.call(this, options);
  this.name = 'URGNA2012';
};
Normalize.prototype = new URDNA2015();

// helper for modifying component during Hash First Degree Quads
Normalize.prototype.modifyFirstDegreeComponent = function(id, component, key) {
  if(component.type !== 'blank node') {
    return component;
  }
  component = _clone(component);
  if(key === 'name') {
    component.value = '_:g';
  } else {
    component.value = (component.value === id ? '_:a' : '_:z');
  }
  return component;
};

// helper for getting a related predicate
Normalize.prototype.getRelatedPredicate = function(quad) {
  return quad.predicate.value;
};

// helper for creating hash to related blank nodes map
Normalize.prototype.createHashToRelated = function(id, issuer, callback) {
  var self = this;

  // 1) Create a hash to related blank nodes map for storing hashes that
  // identify related blank nodes.
  var hashToRelated = {};

  // 2) Get a reference, quads, to the list of quads in the blank node to
  // quads map for the key identifier.
  var quads = self.blankNodeInfo[id].quads;

  // 3) For each quad in quads:
  self.forEach(quads, function(quad, idx, callback) {
    // 3.1) If the quad's subject is a blank node that does not match
    // identifier, set hash to the result of the Hash Related Blank Node
    // algorithm, passing the blank node identifier for subject as related,
    // quad, path identifier issuer as issuer, and p as position.
    var position;
    var related;
    if(quad.subject.type === 'blank node' && quad.subject.value !== id) {
      related = quad.subject.value;
      position = 'p';
    } else if(quad.object.type === 'blank node' && quad.object.value !== id) {
      // 3.2) Otherwise, if quad's object is a blank node that does not match
      // identifier, to the result of the Hash Related Blank Node algorithm,
      // passing the blank node identifier for object as related, quad, path
      // identifier issuer as issuer, and r as position.
      related = quad.object.value;
      position = 'r';
    } else {
      // 3.3) Otherwise, continue to the next quad.
      return callback();
    }
    // 3.4) Add a mapping of hash to the blank node identifier for the
    // component that matched (subject or object) to hash to related blank
    // nodes map, adding an entry as necessary.
    self.hashRelatedBlankNode(
      related, quad, issuer, position, function(err, hash) {
      if(hash in hashToRelated) {
        hashToRelated[hash].push(related);
      } else {
        hashToRelated[hash] = [related];
      }
      callback();
    });
  }, function(err) {
    callback(err, hashToRelated);
  });
};

return Normalize;

})(); // end of define URGNA2012

/**
 * Recursively flattens the subjects in the given JSON-LD expanded input
 * into a node map.
 *
 * @param input the JSON-LD expanded input.
 * @param graphs a map of graph name to subject map.
 * @param graph the name of the current graph.
 * @param issuer the blank node identifier issuer.
 * @param name the name assigned to the current input if it is a bnode.
 * @param list the list to append to, null for none.
 */
function _createNodeMap(input, graphs, graph, issuer, name, list) {
  // recurse through array
  if(_isArray(input)) {
    for(var i = 0; i < input.length; ++i) {
      _createNodeMap(input[i], graphs, graph, issuer, undefined, list);
    }
    return;
  }

  // add non-object to list
  if(!_isObject(input)) {
    if(list) {
      list.push(input);
    }
    return;
  }

  // add values to list
  if(_isValue(input)) {
    if('@type' in input) {
      var type = input['@type'];
      // rename @type blank node
      if(type.indexOf('_:') === 0) {
        input['@type'] = type = issuer.getId(type);
      }
    }
    if(list) {
      list.push(input);
    }
    return;
  }

  // Note: At this point, input must be a subject.

  // spec requires @type to be named first, so assign names early
  if('@type' in input) {
    var types = input['@type'];
    for(var i = 0; i < types.length; ++i) {
      var type = types[i];
      if(type.indexOf('_:') === 0) {
        issuer.getId(type);
      }
    }
  }

  // get name for subject
  if(_isUndefined(name)) {
    name = _isBlankNode(input) ? issuer.getId(input['@id']) : input['@id'];
  }

  // add subject reference to list
  if(list) {
    list.push({'@id': name});
  }

  // create new subject or merge into existing one
  var subjects = graphs[graph];
  var subject = subjects[name] = subjects[name] || {};
  subject['@id'] = name;
  var properties = Object.keys(input).sort();
  for(var pi = 0; pi < properties.length; ++pi) {
    var property = properties[pi];

    // skip @id
    if(property === '@id') {
      continue;
    }

    // handle reverse properties
    if(property === '@reverse') {
      var referencedNode = {'@id': name};
      var reverseMap = input['@reverse'];
      for(var reverseProperty in reverseMap) {
        var items = reverseMap[reverseProperty];
        for(var ii = 0; ii < items.length; ++ii) {
          var item = items[ii];
          var itemName = item['@id'];
          if(_isBlankNode(item)) {
            itemName = issuer.getId(itemName);
          }
          _createNodeMap(item, graphs, graph, issuer, itemName);
          jsonld.addValue(
            subjects[itemName], reverseProperty, referencedNode,
            {propertyIsArray: true, allowDuplicate: false});
        }
      }
      continue;
    }

    // recurse into graph
    if(property === '@graph') {
      // add graph subjects map entry
      if(!(name in graphs)) {
        graphs[name] = {};
      }
      var g = (graph === '@merged') ? graph : name;
      _createNodeMap(input[property], graphs, g, issuer);
      continue;
    }

    // copy non-@type keywords
    if(property !== '@type' && _isKeyword(property)) {
      if(property === '@index' && property in subject &&
        (input[property] !== subject[property] ||
        input[property]['@id'] !== subject[property]['@id'])) {
        throw new JsonLdError(
          'Invalid JSON-LD syntax; conflicting @index property detected.',
          'jsonld.SyntaxError',
          {code: 'conflicting indexes', subject: subject});
      }
      subject[property] = input[property];
      continue;
    }

    // iterate over objects
    var objects = input[property];

    // if property is a bnode, assign it a new id
    if(property.indexOf('_:') === 0) {
      property = issuer.getId(property);
    }

    // ensure property is added for empty arrays
    if(objects.length === 0) {
      jsonld.addValue(subject, property, [], {propertyIsArray: true});
      continue;
    }
    for(var oi = 0; oi < objects.length; ++oi) {
      var o = objects[oi];

      if(property === '@type') {
        // rename @type blank nodes
        o = (o.indexOf('_:') === 0) ? issuer.getId(o) : o;
      }

      // handle embedded subject or subject reference
      if(_isSubject(o) || _isSubjectReference(o)) {
        // relabel blank node @id
        var id = _isBlankNode(o) ? issuer.getId(o['@id']) : o['@id'];

        // add reference and recurse
        jsonld.addValue(
          subject, property, {'@id': id},
          {propertyIsArray: true, allowDuplicate: false});
        _createNodeMap(o, graphs, graph, issuer, id);
      } else if(_isList(o)) {
        // handle @list
        var _list = [];
        _createNodeMap(o['@list'], graphs, graph, issuer, name, _list);
        o = {'@list': _list};
        jsonld.addValue(
          subject, property, o,
          {propertyIsArray: true, allowDuplicate: false});
      } else {
        // handle @value
        _createNodeMap(o, graphs, graph, issuer, name);
        jsonld.addValue(
          subject, property, o, {propertyIsArray: true, allowDuplicate: false});
      }
    }
  }
}

function _mergeNodeMaps(graphs) {
  // add all non-default graphs to default graph
  var defaultGraph = graphs['@default'];
  var graphNames = Object.keys(graphs).sort();
  for(var i = 0; i < graphNames.length; ++i) {
    var graphName = graphNames[i];
    if(graphName === '@default') {
      continue;
    }
    var nodeMap = graphs[graphName];
    var subject = defaultGraph[graphName];
    if(!subject) {
      defaultGraph[graphName] = subject = {
        '@id': graphName,
        '@graph': []
      };
    } else if(!('@graph' in subject)) {
      subject['@graph'] = [];
    }
    var graph = subject['@graph'];
    var ids = Object.keys(nodeMap).sort();
    for(var ii = 0; ii < ids.length; ++ii) {
      var node = nodeMap[ids[ii]];
      // only add full subjects
      if(!_isSubjectReference(node)) {
        graph.push(node);
      }
    }
  }
  return defaultGraph;
}

/**
 * Frames subjects according to the given frame.
 *
 * @param state the current framing state.
 * @param subjects the subjects to filter.
 * @param frame the frame.
 * @param parent the parent subject or top-level array.
 * @param property the parent property, initialized to null.
 */
function _frame(state, subjects, frame, parent, property) {
  // validate the frame
  _validateFrame(frame);
  frame = frame[0];

  // get flags for current frame
  var options = state.options;
  var flags = {
    embed: _getFrameFlag(frame, options, 'embed'),
    explicit: _getFrameFlag(frame, options, 'explicit'),
    requireAll: _getFrameFlag(frame, options, 'requireAll')
  };

  // filter out subjects that match the frame
  var matches = _filterSubjects(state, subjects, frame, flags);

  // add matches to output
  var ids = Object.keys(matches).sort();
  for(var idx = 0; idx < ids.length; ++idx) {
    var id = ids[idx];
    var subject = matches[id];

    if(flags.embed === '@link' && id in state.link) {
      // TODO: may want to also match an existing linked subject against
      // the current frame ... so different frames could produce different
      // subjects that are only shared in-memory when the frames are the same

      // add existing linked subject
      _addFrameOutput(parent, property, state.link[id]);
      continue;
    }

    /* Note: In order to treat each top-level match as a compartmentalized
    result, clear the unique embedded subjects map when the property is null,
    which only occurs at the top-level. */
    if(property === null) {
      state.uniqueEmbeds = {};
    }

    // start output for subject
    var output = {};
    output['@id'] = id;
    state.link[id] = output;

    // if embed is @never or if a circular reference would be created by an
    // embed, the subject cannot be embedded, just add the reference;
    // note that a circular reference won't occur when the embed flag is
    // `@link` as the above check will short-circuit before reaching this point
    if(flags.embed === '@never' ||
      _createsCircularReference(subject, state.subjectStack)) {
      _addFrameOutput(parent, property, output);
      continue;
    }

    // if only the last match should be embedded
    if(flags.embed === '@last') {
      // remove any existing embed
      if(id in state.uniqueEmbeds) {
        _removeEmbed(state, id);
      }
      state.uniqueEmbeds[id] = {parent: parent, property: property};
    }

    // push matching subject onto stack to enable circular embed checks
    state.subjectStack.push(subject);

    // iterate over subject properties
    var props = Object.keys(subject).sort();
    for(var i = 0; i < props.length; i++) {
      var prop = props[i];

      // copy keywords to output
      if(_isKeyword(prop)) {
        output[prop] = _clone(subject[prop]);
        continue;
      }

      // explicit is on and property isn't in the frame, skip processing
      if(flags.explicit && !(prop in frame)) {
        continue;
      }

      // add objects
      var objects = subject[prop];
      for(var oi = 0; oi < objects.length; ++oi) {
        var o = objects[oi];

        // recurse into list
        if(_isList(o)) {
          // add empty list
          var list = {'@list': []};
          _addFrameOutput(output, prop, list);

          // add list objects
          var src = o['@list'];
          for(var n in src) {
            o = src[n];
            if(_isSubjectReference(o)) {
              var subframe = (prop in frame ?
                frame[prop][0]['@list'] : _createImplicitFrame(flags));
              // recurse into subject reference
              _frame(state, [o['@id']], subframe, list, '@list');
            } else {
              // include other values automatically
              _addFrameOutput(list, '@list', _clone(o));
            }
          }
          continue;
        }

        if(_isSubjectReference(o)) {
          // recurse into subject reference
          var subframe = (prop in frame ?
            frame[prop] : _createImplicitFrame(flags));
          _frame(state, [o['@id']], subframe, output, prop);
        } else {
          // include other values automatically
          _addFrameOutput(output, prop, _clone(o));
        }
      }
    }

    // handle defaults
    var props = Object.keys(frame).sort();
    for(var i = 0; i < props.length; ++i) {
      var prop = props[i];

      // skip keywords
      if(_isKeyword(prop)) {
        continue;
      }

      // if omit default is off, then include default values for properties
      // that appear in the next frame but are not in the matching subject
      var next = frame[prop][0];
      var omitDefaultOn = _getFrameFlag(next, options, 'omitDefault');
      if(!omitDefaultOn && !(prop in output)) {
        var preserve = '@null';
        if('@default' in next) {
          preserve = _clone(next['@default']);
        }
        if(!_isArray(preserve)) {
          preserve = [preserve];
        }
        output[prop] = [{'@preserve': preserve}];
      }
    }

    // add output to parent
    _addFrameOutput(parent, property, output);

    // pop matching subject from circular ref-checking stack
    state.subjectStack.pop();
  }
}

/**
 * Creates an implicit frame when recursing through subject matches. If
 * a frame doesn't have an explicit frame for a particular property, then
 * a wildcard child frame will be created that uses the same flags that the
 * parent frame used.
 *
 * @param flags the current framing flags.
 *
 * @return the implicit frame.
 */
function _createImplicitFrame(flags) {
  var frame = {};
  for(var key in flags) {
    if(flags[key] !== undefined) {
      frame['@' + key] = [flags[key]];
    }
  }
  return [frame];
}

/**
 * Checks the current subject stack to see if embedding the given subject
 * would cause a circular reference.
 *
 * @param subjectToEmbed the subject to embed.
 * @param subjectStack the current stack of subjects.
 *
 * @return true if a circular reference would be created, false if not.
 */
function _createsCircularReference(subjectToEmbed, subjectStack) {
  for(var i = subjectStack.length - 1; i >= 0; --i) {
    if(subjectStack[i]['@id'] === subjectToEmbed['@id']) {
      return true;
    }
  }
  return false;
}

/**
 * Gets the frame flag value for the given flag name.
 *
 * @param frame the frame.
 * @param options the framing options.
 * @param name the flag name.
 *
 * @return the flag value.
 */
function _getFrameFlag(frame, options, name) {
  var flag = '@' + name;
  var rval = (flag in frame ? frame[flag][0] : options[name]);
  if(name === 'embed') {
    // default is "@last"
    // backwards-compatibility support for "embed" maps:
    // true => "@last"
    // false => "@never"
    if(rval === true) {
      rval = '@last';
    } else if(rval === false) {
      rval = '@never';
    } else if(rval !== '@always' && rval !== '@never' && rval !== '@link') {
      rval = '@last';
    }
  }
  return rval;
}

/**
 * Validates a JSON-LD frame, throwing an exception if the frame is invalid.
 *
 * @param frame the frame to validate.
 */
function _validateFrame(frame) {
  if(!_isArray(frame) || frame.length !== 1 || !_isObject(frame[0])) {
    throw new JsonLdError(
      'Invalid JSON-LD syntax; a JSON-LD frame must be a single object.',
      'jsonld.SyntaxError', {frame: frame});
  }
}

/**
 * Returns a map of all of the subjects that match a parsed frame.
 *
 * @param state the current framing state.
 * @param subjects the set of subjects to filter.
 * @param frame the parsed frame.
 * @param flags the frame flags.
 *
 * @return all of the matched subjects.
 */
function _filterSubjects(state, subjects, frame, flags) {
  // filter subjects in @id order
  var rval = {};
  for(var i = 0; i < subjects.length; ++i) {
    var id = subjects[i];
    var subject = state.subjects[id];
    if(_filterSubject(subject, frame, flags)) {
      rval[id] = subject;
    }
  }
  return rval;
}

/**
 * Returns true if the given subject matches the given frame.
 *
 * @param subject the subject to check.
 * @param frame the frame to check.
 * @param flags the frame flags.
 *
 * @return true if the subject matches, false if not.
 */
function _filterSubject(subject, frame, flags) {
  // check @type (object value means 'any' type, fall through to ducktyping)
  if('@type' in frame &&
    !(frame['@type'].length === 1 && _isObject(frame['@type'][0]))) {
    var types = frame['@type'];
    for(var i = 0; i < types.length; ++i) {
      // any matching @type is a match
      if(jsonld.hasValue(subject, '@type', types[i])) {
        return true;
      }
    }
    return false;
  }

  // check ducktype
  var wildcard = true;
  var matchesSome = false;
  for(var key in frame) {
    if(_isKeyword(key)) {
      // skip non-@id and non-@type
      if(key !== '@id' && key !== '@type') {
        continue;
      }
      wildcard = false;

      // check @id for a specific @id value
      if(key === '@id' && _isString(frame[key])) {
        if(subject[key] !== frame[key]) {
          return false;
        }
        matchesSome = true;
        continue;
      }
    }

    wildcard = false;

    if(key in subject) {
      // frame[key] === [] means do not match if property is present
      if(_isArray(frame[key]) && frame[key].length === 0 &&
        subject[key] !== undefined) {
        return false;
      }
      matchesSome = true;
      continue;
    }

    // all properties must match to be a duck unless a @default is specified
    var hasDefault = (_isArray(frame[key]) && _isObject(frame[key][0]) &&
      '@default' in frame[key][0]);
    if(flags.requireAll && !hasDefault) {
      return false;
    }
  }

  // return true if wildcard or subject matches some properties
  return wildcard || matchesSome;
}

/**
 * Removes an existing embed.
 *
 * @param state the current framing state.
 * @param id the @id of the embed to remove.
 */
function _removeEmbed(state, id) {
  // get existing embed
  var embeds = state.uniqueEmbeds;
  var embed = embeds[id];
  var parent = embed.parent;
  var property = embed.property;

  // create reference to replace embed
  var subject = {'@id': id};

  // remove existing embed
  if(_isArray(parent)) {
    // replace subject with reference
    for(var i = 0; i < parent.length; ++i) {
      if(jsonld.compareValues(parent[i], subject)) {
        parent[i] = subject;
        break;
      }
    }
  } else {
    // replace subject with reference
    var useArray = _isArray(parent[property]);
    jsonld.removeValue(parent, property, subject, {propertyIsArray: useArray});
    jsonld.addValue(parent, property, subject, {propertyIsArray: useArray});
  }

  // recursively remove dependent dangling embeds
  var removeDependents = function(id) {
    // get embed keys as a separate array to enable deleting keys in map
    var ids = Object.keys(embeds);
    for(var i = 0; i < ids.length; ++i) {
      var next = ids[i];
      if(next in embeds && _isObject(embeds[next].parent) &&
        embeds[next].parent['@id'] === id) {
        delete embeds[next];
        removeDependents(next);
      }
    }
  };
  removeDependents(id);
}

/**
 * Adds framing output to the given parent.
 *
 * @param parent the parent to add to.
 * @param property the parent property.
 * @param output the output to add.
 */
function _addFrameOutput(parent, property, output) {
  if(_isObject(parent)) {
    jsonld.addValue(parent, property, output, {propertyIsArray: true});
  } else {
    parent.push(output);
  }
}

/**
 * Removes the @preserve keywords as the last step of the framing algorithm.
 *
 * @param ctx the active context used to compact the input.
 * @param input the framed, compacted output.
 * @param options the compaction options used.
 *
 * @return the resulting output.
 */
function _removePreserve(ctx, input, options) {
  // recurse through arrays
  if(_isArray(input)) {
    var output = [];
    for(var i = 0; i < input.length; ++i) {
      var result = _removePreserve(ctx, input[i], options);
      // drop nulls from arrays
      if(result !== null) {
        output.push(result);
      }
    }
    input = output;
  } else if(_isObject(input)) {
    // remove @preserve
    if('@preserve' in input) {
      if(input['@preserve'] === '@null') {
        return null;
      }
      return input['@preserve'];
    }

    // skip @values
    if(_isValue(input)) {
      return input;
    }

    // recurse through @lists
    if(_isList(input)) {
      input['@list'] = _removePreserve(ctx, input['@list'], options);
      return input;
    }

    // handle in-memory linked nodes
    var idAlias = _compactIri(ctx, '@id');
    if(idAlias in input) {
      var id = input[idAlias];
      if(id in options.link) {
        var idx = options.link[id].indexOf(input);
        if(idx === -1) {
          // prevent circular visitation
          options.link[id].push(input);
        } else {
          // already visited
          return options.link[id][idx];
        }
      } else {
        // prevent circular visitation
        options.link[id] = [input];
      }
    }

    // recurse through properties
    for(var prop in input) {
      var result = _removePreserve(ctx, input[prop], options);
      var container = jsonld.getContextValue(ctx, prop, '@container');
      if(options.compactArrays && _isArray(result) && result.length === 1 &&
        container === null) {
        result = result[0];
      }
      input[prop] = result;
    }
  }
  return input;
}

/**
 * Compares two strings first based on length and then lexicographically.
 *
 * @param a the first string.
 * @param b the second string.
 *
 * @return -1 if a < b, 1 if a > b, 0 if a == b.
 */
function _compareShortestLeast(a, b) {
  if(a.length < b.length) {
    return -1;
  }
  if(b.length < a.length) {
    return 1;
  }
  if(a === b) {
    return 0;
  }
  return (a < b) ? -1 : 1;
}

/**
 * Picks the preferred compaction term from the given inverse context entry.
 *
 * @param activeCtx the active context.
 * @param iri the IRI to pick the term for.
 * @param value the value to pick the term for.
 * @param containers the preferred containers.
 * @param typeOrLanguage either '@type' or '@language'.
 * @param typeOrLanguageValue the preferred value for '@type' or '@language'.
 *
 * @return the preferred term.
 */
function _selectTerm(
  activeCtx, iri, value, containers, typeOrLanguage, typeOrLanguageValue) {
  if(typeOrLanguageValue === null) {
    typeOrLanguageValue = '@null';
  }

  // preferences for the value of @type or @language
  var prefs = [];

  // determine prefs for @id based on whether or not value compacts to a term
  if((typeOrLanguageValue === '@id' || typeOrLanguageValue === '@reverse') &&
    _isSubjectReference(value)) {
    // prefer @reverse first
    if(typeOrLanguageValue === '@reverse') {
      prefs.push('@reverse');
    }
    // try to compact value to a term
    var term = _compactIri(activeCtx, value['@id'], null, {vocab: true});
    if(term in activeCtx.mappings &&
      activeCtx.mappings[term] &&
      activeCtx.mappings[term]['@id'] === value['@id']) {
      // prefer @vocab
      prefs.push.apply(prefs, ['@vocab', '@id']);
    } else {
      // prefer @id
      prefs.push.apply(prefs, ['@id', '@vocab']);
    }
  } else {
    prefs.push(typeOrLanguageValue);
  }
  prefs.push('@none');

  var containerMap = activeCtx.inverse[iri];
  for(var ci = 0; ci < containers.length; ++ci) {
    // if container not available in the map, continue
    var container = containers[ci];
    if(!(container in containerMap)) {
      continue;
    }

    var typeOrLanguageValueMap = containerMap[container][typeOrLanguage];
    for(var pi = 0; pi < prefs.length; ++pi) {
      // if type/language option not available in the map, continue
      var pref = prefs[pi];
      if(!(pref in typeOrLanguageValueMap)) {
        continue;
      }

      // select term
      return typeOrLanguageValueMap[pref];
    }
  }

  return null;
}

/**
 * Compacts an IRI or keyword into a term or prefix if it can be. If the
 * IRI has an associated value it may be passed.
 *
 * @param activeCtx the active context to use.
 * @param iri the IRI to compact.
 * @param value the value to check or null.
 * @param relativeTo options for how to compact IRIs:
 *          vocab: true to split after @vocab, false not to.
 * @param reverse true if a reverse property is being compacted, false if not.
 *
 * @return the compacted term, prefix, keyword alias, or the original IRI.
 */
function _compactIri(activeCtx, iri, value, relativeTo, reverse) {
  // can't compact null
  if(iri === null) {
    return iri;
  }

  // default value and parent to null
  if(_isUndefined(value)) {
    value = null;
  }
  // default reverse to false
  if(_isUndefined(reverse)) {
    reverse = false;
  }
  relativeTo = relativeTo || {};

  // if term is a keyword, default vocab to true
  if(_isKeyword(iri)) {
    relativeTo.vocab = true;
  }

  // use inverse context to pick a term if iri is relative to vocab
  if(relativeTo.vocab && iri in activeCtx.getInverse()) {
    var defaultLanguage = activeCtx['@language'] || '@none';

    // prefer @index if available in value
    var containers = [];
    if(_isObject(value) && '@index' in value) {
      containers.push('@index');
    }

    // defaults for term selection based on type/language
    var typeOrLanguage = '@language';
    var typeOrLanguageValue = '@null';

    if(reverse) {
      typeOrLanguage = '@type';
      typeOrLanguageValue = '@reverse';
      containers.push('@set');
    } else if(_isList(value)) {
      // choose the most specific term that works for all elements in @list
      // only select @list containers if @index is NOT in value
      if(!('@index' in value)) {
        containers.push('@list');
      }
      var list = value['@list'];
      var commonLanguage = (list.length === 0) ? defaultLanguage : null;
      var commonType = null;
      for(var i = 0; i < list.length; ++i) {
        var item = list[i];
        var itemLanguage = '@none';
        var itemType = '@none';
        if(_isValue(item)) {
          if('@language' in item) {
            itemLanguage = item['@language'];
          } else if('@type' in item) {
            itemType = item['@type'];
          } else {
            // plain literal
            itemLanguage = '@null';
          }
        } else {
          itemType = '@id';
        }
        if(commonLanguage === null) {
          commonLanguage = itemLanguage;
        } else if(itemLanguage !== commonLanguage && _isValue(item)) {
          commonLanguage = '@none';
        }
        if(commonType === null) {
          commonType = itemType;
        } else if(itemType !== commonType) {
          commonType = '@none';
        }
        // there are different languages and types in the list, so choose
        // the most generic term, no need to keep iterating the list
        if(commonLanguage === '@none' && commonType === '@none') {
          break;
        }
      }
      commonLanguage = commonLanguage || '@none';
      commonType = commonType || '@none';
      if(commonType !== '@none') {
        typeOrLanguage = '@type';
        typeOrLanguageValue = commonType;
      } else {
        typeOrLanguageValue = commonLanguage;
      }
    } else {
      if(_isValue(value)) {
        if('@language' in value && !('@index' in value)) {
          containers.push('@language');
          typeOrLanguageValue = value['@language'];
        } else if('@type' in value) {
          typeOrLanguage = '@type';
          typeOrLanguageValue = value['@type'];
        }
      } else {
        typeOrLanguage = '@type';
        typeOrLanguageValue = '@id';
      }
      containers.push('@set');
    }

    // do term selection
    containers.push('@none');
    var term = _selectTerm(
      activeCtx, iri, value, containers, typeOrLanguage, typeOrLanguageValue);
    if(term !== null) {
      return term;
    }
  }

  // no term match, use @vocab if available
  if(relativeTo.vocab) {
    if('@vocab' in activeCtx) {
      // determine if vocab is a prefix of the iri
      var vocab = activeCtx['@vocab'];
      if(iri.indexOf(vocab) === 0 && iri !== vocab) {
        // use suffix as relative iri if it is not a term in the active context
        var suffix = iri.substr(vocab.length);
        if(!(suffix in activeCtx.mappings)) {
          return suffix;
        }
      }
    }
  }

  // no term or @vocab match, check for possible CURIEs
  var choice = null;
  for(var term in activeCtx.mappings) {
    // skip terms with colons, they can't be prefixes
    if(term.indexOf(':') !== -1) {
      continue;
    }
    // skip entries with @ids that are not partial matches
    var definition = activeCtx.mappings[term];
    if(!definition ||
      definition['@id'] === iri || iri.indexOf(definition['@id']) !== 0) {
      continue;
    }

    // a CURIE is usable if:
    // 1. it has no mapping, OR
    // 2. value is null, which means we're not compacting an @value, AND
    //   the mapping matches the IRI)
    var curie = term + ':' + iri.substr(definition['@id'].length);
    var isUsableCurie = (!(curie in activeCtx.mappings) ||
      (value === null && activeCtx.mappings[curie] &&
      activeCtx.mappings[curie]['@id'] === iri));

    // select curie if it is shorter or the same length but lexicographically
    // less than the current choice
    if(isUsableCurie && (choice === null ||
      _compareShortestLeast(curie, choice) < 0)) {
      choice = curie;
    }
  }

  // return chosen curie
  if(choice !== null) {
    return choice;
  }

  // compact IRI relative to base
  if(!relativeTo.vocab) {
    return _removeBase(activeCtx['@base'], iri);
  }

  // return IRI as is
  return iri;
}

/**
 * Performs value compaction on an object with '@value' or '@id' as the only
 * property.
 *
 * @param activeCtx the active context.
 * @param activeProperty the active property that points to the value.
 * @param value the value to compact.
 *
 * @return the compaction result.
 */
function _compactValue(activeCtx, activeProperty, value) {
  // value is a @value
  if(_isValue(value)) {
    // get context rules
    var type = jsonld.getContextValue(activeCtx, activeProperty, '@type');
    var language = jsonld.getContextValue(
      activeCtx, activeProperty, '@language');
    var container = jsonld.getContextValue(
      activeCtx, activeProperty, '@container');

    // whether or not the value has an @index that must be preserved
    var preserveIndex = (('@index' in value) &&
      container !== '@index');

    // if there's no @index to preserve ...
    if(!preserveIndex) {
      // matching @type or @language specified in context, compact value
      if(value['@type'] === type || value['@language'] === language) {
        return value['@value'];
      }
    }

    // return just the value of @value if all are true:
    // 1. @value is the only key or @index isn't being preserved
    // 2. there is no default language or @value is not a string or
    //   the key has a mapping with a null @language
    var keyCount = Object.keys(value).length;
    var isValueOnlyKey = (keyCount === 1 ||
      (keyCount === 2 && ('@index' in value) && !preserveIndex));
    var hasDefaultLanguage = ('@language' in activeCtx);
    var isValueString = _isString(value['@value']);
    var hasNullMapping = (activeCtx.mappings[activeProperty] &&
      activeCtx.mappings[activeProperty]['@language'] === null);
    if(isValueOnlyKey &&
      (!hasDefaultLanguage || !isValueString || hasNullMapping)) {
      return value['@value'];
    }

    var rval = {};

    // preserve @index
    if(preserveIndex) {
      rval[_compactIri(activeCtx, '@index')] = value['@index'];
    }

    if('@type' in value) {
      // compact @type IRI
      rval[_compactIri(activeCtx, '@type')] = _compactIri(
        activeCtx, value['@type'], null, {vocab: true});
    } else if('@language' in value) {
      // alias @language
      rval[_compactIri(activeCtx, '@language')] = value['@language'];
    }

    // alias @value
    rval[_compactIri(activeCtx, '@value')] = value['@value'];

    return rval;
  }

  // value is a subject reference
  var expandedProperty = _expandIri(activeCtx, activeProperty, {vocab: true});
  var type = jsonld.getContextValue(activeCtx, activeProperty, '@type');
  var compacted = _compactIri(
    activeCtx, value['@id'], null, {vocab: type === '@vocab'});

  // compact to scalar
  if(type === '@id' || type === '@vocab' || expandedProperty === '@graph') {
    return compacted;
  }

  var rval = {};
  rval[_compactIri(activeCtx, '@id')] = compacted;
  return rval;
}

/**
 * Creates a term definition during context processing.
 *
 * @param activeCtx the current active context.
 * @param localCtx the local context being processed.
 * @param term the term in the local context to define the mapping for.
 * @param defined a map of defining/defined keys to detect cycles and prevent
 *          double definitions.
 */
function _createTermDefinition(activeCtx, localCtx, term, defined) {
  if(term in defined) {
    // term already defined
    if(defined[term]) {
      return;
    }
    // cycle detected
    throw new JsonLdError(
      'Cyclical context definition detected.',
      'jsonld.CyclicalContext',
      {code: 'cyclic IRI mapping', context: localCtx, term: term});
  }

  // now defining term
  defined[term] = false;

  if(_isKeyword(term)) {
    throw new JsonLdError(
      'Invalid JSON-LD syntax; keywords cannot be overridden.',
      'jsonld.SyntaxError',
      {code: 'keyword redefinition', context: localCtx, term: term});
  }

  if(term === '') {
    throw new JsonLdError(
      'Invalid JSON-LD syntax; a term cannot be an empty string.',
      'jsonld.SyntaxError',
      {code: 'invalid term definition', context: localCtx});
  }

  // remove old mapping
  if(activeCtx.mappings[term]) {
    delete activeCtx.mappings[term];
  }

  // get context term value
  var value = localCtx[term];

  // clear context entry
  if(value === null || (_isObject(value) && value['@id'] === null)) {
    activeCtx.mappings[term] = null;
    defined[term] = true;
    return;
  }

  // convert short-hand value to object w/@id
  if(_isString(value)) {
    value = {'@id': value};
  }

  if(!_isObject(value)) {
    throw new JsonLdError(
      'Invalid JSON-LD syntax; @context property values must be ' +
      'strings or objects.',
      'jsonld.SyntaxError',
      {code: 'invalid term definition', context: localCtx});
  }

  // create new mapping
  var mapping = activeCtx.mappings[term] = {};
  mapping.reverse = false;

  if('@reverse' in value) {
    if('@id' in value) {
      throw new JsonLdError(
        'Invalid JSON-LD syntax; a @reverse term definition must not ' +
        'contain @id.', 'jsonld.SyntaxError',
        {code: 'invalid reverse property', context: localCtx});
    }
    var reverse = value['@reverse'];
    if(!_isString(reverse)) {
      throw new JsonLdError(
        'Invalid JSON-LD syntax; a @context @reverse value must be a string.',
        'jsonld.SyntaxError', {code: 'invalid IRI mapping', context: localCtx});
    }

    // expand and add @id mapping
    var id = _expandIri(
      activeCtx, reverse, {vocab: true, base: false}, localCtx, defined);
    if(!_isAbsoluteIri(id)) {
      throw new JsonLdError(
        'Invalid JSON-LD syntax; a @context @reverse value must be an ' +
        'absolute IRI or a blank node identifier.',
        'jsonld.SyntaxError', {code: 'invalid IRI mapping', context: localCtx});
    }
    mapping['@id'] = id;
    mapping.reverse = true;
  } else if('@id' in value) {
    var id = value['@id'];
    if(!_isString(id)) {
      throw new JsonLdError(
        'Invalid JSON-LD syntax; a @context @id value must be an array ' +
        'of strings or a string.',
        'jsonld.SyntaxError', {code: 'invalid IRI mapping', context: localCtx});
    }
    if(id !== term) {
      // expand and add @id mapping
      id = _expandIri(
        activeCtx, id, {vocab: true, base: false}, localCtx, defined);
      if(!_isAbsoluteIri(id) && !_isKeyword(id)) {
        throw new JsonLdError(
          'Invalid JSON-LD syntax; a @context @id value must be an ' +
          'absolute IRI, a blank node identifier, or a keyword.',
          'jsonld.SyntaxError',
          {code: 'invalid IRI mapping', context: localCtx});
      }
      mapping['@id'] = id;
    }
  }

  if(!('@id' in mapping)) {
    // see if the term has a prefix
    var colon = term.indexOf(':');
    if(colon !== -1) {
      var prefix = term.substr(0, colon);
      if(prefix in localCtx) {
        // define parent prefix
        _createTermDefinition(activeCtx, localCtx, prefix, defined);
      }

      if(activeCtx.mappings[prefix]) {
        // set @id based on prefix parent
        var suffix = term.substr(colon + 1);
        mapping['@id'] = activeCtx.mappings[prefix]['@id'] + suffix;
      } else {
        // term is an absolute IRI
        mapping['@id'] = term;
      }
    } else {
      // non-IRIs *must* define @ids if @vocab is not available
      if(!('@vocab' in activeCtx)) {
        throw new JsonLdError(
          'Invalid JSON-LD syntax; @context terms must define an @id.',
          'jsonld.SyntaxError',
          {code: 'invalid IRI mapping', context: localCtx, term: term});
      }
      // prepend vocab to term
      mapping['@id'] = activeCtx['@vocab'] + term;
    }
  }

  // IRI mapping now defined
  defined[term] = true;

  if('@type' in value) {
    var type = value['@type'];
    if(!_isString(type)) {
      throw new JsonLdError(
        'Invalid JSON-LD syntax; an @context @type values must be a string.',
        'jsonld.SyntaxError',
        {code: 'invalid type mapping', context: localCtx});
    }

    if(type !== '@id' && type !== '@vocab') {
      // expand @type to full IRI
      type = _expandIri(
        activeCtx, type, {vocab: true, base: false}, localCtx, defined);
      if(!_isAbsoluteIri(type)) {
        throw new JsonLdError(
          'Invalid JSON-LD syntax; an @context @type value must be an ' +
          'absolute IRI.',
          'jsonld.SyntaxError',
          {code: 'invalid type mapping', context: localCtx});
      }
      if(type.indexOf('_:') === 0) {
        throw new JsonLdError(
          'Invalid JSON-LD syntax; an @context @type values must be an IRI, ' +
          'not a blank node identifier.',
          'jsonld.SyntaxError',
          {code: 'invalid type mapping', context: localCtx});
      }
    }

    // add @type to mapping
    mapping['@type'] = type;
  }

  if('@container' in value) {
    var container = value['@container'];
    if(container !== '@list' && container !== '@set' &&
      container !== '@index' && container !== '@language') {
      throw new JsonLdError(
        'Invalid JSON-LD syntax; @context @container value must be ' +
        'one of the following: @list, @set, @index, or @language.',
        'jsonld.SyntaxError',
        {code: 'invalid container mapping', context: localCtx});
    }
    if(mapping.reverse && container !== '@index' && container !== '@set' &&
      container !== null) {
      throw new JsonLdError(
        'Invalid JSON-LD syntax; @context @container value for a @reverse ' +
        'type definition must be @index or @set.', 'jsonld.SyntaxError',
        {code: 'invalid reverse property', context: localCtx});
    }

    // add @container to mapping
    mapping['@container'] = container;
  }

  if('@language' in value && !('@type' in value)) {
    var language = value['@language'];
    if(language !== null && !_isString(language)) {
      throw new JsonLdError(
        'Invalid JSON-LD syntax; @context @language value must be ' +
        'a string or null.', 'jsonld.SyntaxError',
        {code: 'invalid language mapping', context: localCtx});
    }

    // add @language to mapping
    if(language !== null) {
      language = language.toLowerCase();
    }
    mapping['@language'] = language;
  }

  // disallow aliasing @context and @preserve
  var id = mapping['@id'];
  if(id === '@context' || id === '@preserve') {
    throw new JsonLdError(
      'Invalid JSON-LD syntax; @context and @preserve cannot be aliased.',
      'jsonld.SyntaxError', {code: 'invalid keyword alias', context: localCtx});
  }
}

/**
 * Expands a string to a full IRI. The string may be a term, a prefix, a
 * relative IRI, or an absolute IRI. The associated absolute IRI will be
 * returned.
 *
 * @param activeCtx the current active context.
 * @param value the string to expand.
 * @param relativeTo options for how to resolve relative IRIs:
 *          base: true to resolve against the base IRI, false not to.
 *          vocab: true to concatenate after @vocab, false not to.
 * @param localCtx the local context being processed (only given if called
 *          during context processing).
 * @param defined a map for tracking cycles in context definitions (only given
 *          if called during context processing).
 *
 * @return the expanded value.
 */
function _expandIri(activeCtx, value, relativeTo, localCtx, defined) {
  // already expanded
  if(value === null || _isKeyword(value)) {
    return value;
  }

  // ensure value is interpreted as a string
  value = String(value);

  // define term dependency if not defined
  if(localCtx && value in localCtx && defined[value] !== true) {
    _createTermDefinition(activeCtx, localCtx, value, defined);
  }

  relativeTo = relativeTo || {};
  if(relativeTo.vocab) {
    var mapping = activeCtx.mappings[value];

    // value is explicitly ignored with a null mapping
    if(mapping === null) {
      return null;
    }

    if(mapping) {
      // value is a term
      return mapping['@id'];
    }
  }

  // split value into prefix:suffix
  var colon = value.indexOf(':');
  if(colon !== -1) {
    var prefix = value.substr(0, colon);
    var suffix = value.substr(colon + 1);

    // do not expand blank nodes (prefix of '_') or already-absolute
    // IRIs (suffix of '//')
    if(prefix === '_' || suffix.indexOf('//') === 0) {
      return value;
    }

    // prefix dependency not defined, define it
    if(localCtx && prefix in localCtx) {
      _createTermDefinition(activeCtx, localCtx, prefix, defined);
    }

    // use mapping if prefix is defined
    var mapping = activeCtx.mappings[prefix];
    if(mapping) {
      return mapping['@id'] + suffix;
    }

    // already absolute IRI
    return value;
  }

  // prepend vocab
  if(relativeTo.vocab && '@vocab' in activeCtx) {
    return activeCtx['@vocab'] + value;
  }

  // prepend base
  var rval = value;
  if(relativeTo.base) {
    rval = jsonld.prependBase(activeCtx['@base'], rval);
  }

  return rval;
}

function _prependBase(base, iri) {
  // skip IRI processing
  if(base === null) {
    return iri;
  }
  // already an absolute IRI
  if(iri.indexOf(':') !== -1) {
    return iri;
  }

  // parse base if it is a string
  if(_isString(base)) {
    base = jsonld.url.parse(base || '');
  }

  // parse given IRI
  var rel = jsonld.url.parse(iri);

  // per RFC3986 5.2.2
  var transform = {
    protocol: base.protocol || ''
  };

  if(rel.authority !== null) {
    transform.authority = rel.authority;
    transform.path = rel.path;
    transform.query = rel.query;
  } else {
    transform.authority = base.authority;

    if(rel.path === '') {
      transform.path = base.path;
      if(rel.query !== null) {
        transform.query = rel.query;
      } else {
        transform.query = base.query;
      }
    } else {
      if(rel.path.indexOf('/') === 0) {
        // IRI represents an absolute path
        transform.path = rel.path;
      } else {
        // merge paths
        var path = base.path;

        // append relative path to the end of the last directory from base
        if(rel.path !== '') {
          path = path.substr(0, path.lastIndexOf('/') + 1);
          if(path.length > 0 && path.substr(-1) !== '/') {
            path += '/';
          }
          path += rel.path;
        }

        transform.path = path;
      }
      transform.query = rel.query;
    }
  }

  // remove slashes and dots in path
  transform.path = _removeDotSegments(transform.path, !!transform.authority);

  // construct URL
  var rval = transform.protocol;
  if(transform.authority !== null) {
    rval += '//' + transform.authority;
  }
  rval += transform.path;
  if(transform.query !== null) {
    rval += '?' + transform.query;
  }
  if(rel.fragment !== null) {
    rval += '#' + rel.fragment;
  }

  // handle empty base
  if(rval === '') {
    rval = './';
  }

  return rval;
}

/**
 * Removes a base IRI from the given absolute IRI.
 *
 * @param base the base IRI.
 * @param iri the absolute IRI.
 *
 * @return the relative IRI if relative to base, otherwise the absolute IRI.
 */
function _removeBase(base, iri) {
  // skip IRI processing
  if(base === null) {
    return iri;
  }

  if(_isString(base)) {
    base = jsonld.url.parse(base || '');
  }

  // establish base root
  var root = '';
  if(base.href !== '') {
    root += (base.protocol || '') + '//' + (base.authority || '');
  } else if(iri.indexOf('//')) {
    // support network-path reference with empty base
    root += '//';
  }

  // IRI not relative to base
  if(iri.indexOf(root) !== 0) {
    return iri;
  }

  // remove root from IRI and parse remainder
  var rel = jsonld.url.parse(iri.substr(root.length));

  // remove path segments that match (do not remove last segment unless there
  // is a hash or query)
  var baseSegments = base.normalizedPath.split('/');
  var iriSegments = rel.normalizedPath.split('/');
  var last = (rel.fragment || rel.query) ? 0 : 1;
  while(baseSegments.length > 0 && iriSegments.length > last) {
    if(baseSegments[0] !== iriSegments[0]) {
      break;
    }
    baseSegments.shift();
    iriSegments.shift();
  }

  // use '../' for each non-matching base segment
  var rval = '';
  if(baseSegments.length > 0) {
    // don't count the last segment (if it ends with '/' last path doesn't
    // count and if it doesn't end with '/' it isn't a path)
    baseSegments.pop();
    for(var i = 0; i < baseSegments.length; ++i) {
      rval += '../';
    }
  }

  // prepend remaining segments
  rval += iriSegments.join('/');

  // add query and hash
  if(rel.query !== null) {
    rval += '?' + rel.query;
  }
  if(rel.fragment !== null) {
    rval += '#' + rel.fragment;
  }

  // handle empty base
  if(rval === '') {
    rval = './';
  }

  return rval;
}

/**
 * Gets the initial context.
 *
 * @param options the options to use:
 *          [base] the document base IRI.
 *
 * @return the initial context.
 */
function _getInitialContext(options) {
  var base = jsonld.url.parse(options.base || '');
  return {
    '@base': base,
    mappings: {},
    inverse: null,
    getInverse: _createInverseContext,
    clone: _cloneActiveContext
  };

  /**
   * Generates an inverse context for use in the compaction algorithm, if
   * not already generated for the given active context.
   *
   * @return the inverse context.
   */
  function _createInverseContext() {
    var activeCtx = this;

    // lazily create inverse
    if(activeCtx.inverse) {
      return activeCtx.inverse;
    }
    var inverse = activeCtx.inverse = {};

    // handle default language
    var defaultLanguage = activeCtx['@language'] || '@none';

    // create term selections for each mapping in the context, ordered by
    // shortest and then lexicographically least
    var mappings = activeCtx.mappings;
    var terms = Object.keys(mappings).sort(_compareShortestLeast);
    for(var i = 0; i < terms.length; ++i) {
      var term = terms[i];
      var mapping = mappings[term];
      if(mapping === null) {
        continue;
      }

      var container = mapping['@container'] || '@none';

      // iterate over every IRI in the mapping
      var ids = mapping['@id'];
      if(!_isArray(ids)) {
        ids = [ids];
      }
      for(var ii = 0; ii < ids.length; ++ii) {
        var iri = ids[ii];
        var entry = inverse[iri];

        // initialize entry
        if(!entry) {
          inverse[iri] = entry = {};
        }

        // add new entry
        if(!entry[container]) {
          entry[container] = {
            '@language': {},
            '@type': {}
          };
        }
        entry = entry[container];

        if(mapping.reverse) {
          // term is preferred for values using @reverse
          _addPreferredTerm(mapping, term, entry['@type'], '@reverse');
        } else if('@type' in mapping) {
          // term is preferred for values using specific type
          _addPreferredTerm(mapping, term, entry['@type'], mapping['@type']);
        } else if('@language' in mapping) {
          // term is preferred for values using specific language
          var language = mapping['@language'] || '@null';
          _addPreferredTerm(mapping, term, entry['@language'], language);
        } else {
          // term is preferred for values w/default language or no type and
          // no language
          // add an entry for the default language
          _addPreferredTerm(mapping, term, entry['@language'], defaultLanguage);

          // add entries for no type and no language
          _addPreferredTerm(mapping, term, entry['@type'], '@none');
          _addPreferredTerm(mapping, term, entry['@language'], '@none');
        }
      }
    }

    return inverse;
  }

  /**
   * Adds the term for the given entry if not already added.
   *
   * @param mapping the term mapping.
   * @param term the term to add.
   * @param entry the inverse context typeOrLanguage entry to add to.
   * @param typeOrLanguageValue the key in the entry to add to.
   */
  function _addPreferredTerm(mapping, term, entry, typeOrLanguageValue) {
    if(!(typeOrLanguageValue in entry)) {
      entry[typeOrLanguageValue] = term;
    }
  }

  /**
   * Clones an active context, creating a child active context.
   *
   * @return a clone (child) of the active context.
   */
  function _cloneActiveContext() {
    var child = {};
    child['@base'] = this['@base'];
    child.mappings = _clone(this.mappings);
    child.clone = this.clone;
    child.inverse = null;
    child.getInverse = this.getInverse;
    if('@language' in this) {
      child['@language'] = this['@language'];
    }
    if('@vocab' in this) {
      child['@vocab'] = this['@vocab'];
    }
    return child;
  }
}

/**
 * Returns whether or not the given value is a keyword.
 *
 * @param v the value to check.
 *
 * @return true if the value is a keyword, false if not.
 */
function _isKeyword(v) {
  if(!_isString(v)) {
    return false;
  }
  switch(v) {
  case '@base':
  case '@context':
  case '@container':
  case '@default':
  case '@embed':
  case '@explicit':
  case '@graph':
  case '@id':
  case '@index':
  case '@language':
  case '@list':
  case '@omitDefault':
  case '@preserve':
  case '@requireAll':
  case '@reverse':
  case '@set':
  case '@type':
  case '@value':
  case '@vocab':
    return true;
  }
  return false;
}

/**
 * Returns true if the given value is an Object.
 *
 * @param v the value to check.
 *
 * @return true if the value is an Object, false if not.
 */
function _isObject(v) {
  return (Object.prototype.toString.call(v) === '[object Object]');
}

/**
 * Returns true if the given value is an empty Object.
 *
 * @param v the value to check.
 *
 * @return true if the value is an empty Object, false if not.
 */
function _isEmptyObject(v) {
  return _isObject(v) && Object.keys(v).length === 0;
}

/**
 * Returns true if the given value is an Array.
 *
 * @param v the value to check.
 *
 * @return true if the value is an Array, false if not.
 */
function _isArray(v) {
  return Array.isArray(v);
}

/**
 * Throws an exception if the given value is not a valid @type value.
 *
 * @param v the value to check.
 */
function _validateTypeValue(v) {
  // can be a string or an empty object
  if(_isString(v) || _isEmptyObject(v)) {
    return;
  }

  // must be an array
  var isValid = false;
  if(_isArray(v)) {
    // must contain only strings
    isValid = true;
    for(var i = 0; i < v.length; ++i) {
      if(!(_isString(v[i]))) {
        isValid = false;
        break;
      }
    }
  }

  if(!isValid) {
    throw new JsonLdError(
      'Invalid JSON-LD syntax; "@type" value must a string, an array of ' +
      'strings, or an empty object.', 'jsonld.SyntaxError',
      {code: 'invalid type value', value: v});
  }
}

/**
 * Returns true if the given value is a String.
 *
 * @param v the value to check.
 *
 * @return true if the value is a String, false if not.
 */
function _isString(v) {
  return (typeof v === 'string' ||
    Object.prototype.toString.call(v) === '[object String]');
}

/**
 * Returns true if the given value is a Number.
 *
 * @param v the value to check.
 *
 * @return true if the value is a Number, false if not.
 */
function _isNumber(v) {
  return (typeof v === 'number' ||
    Object.prototype.toString.call(v) === '[object Number]');
}

/**
 * Returns true if the given value is a double.
 *
 * @param v the value to check.
 *
 * @return true if the value is a double, false if not.
 */
function _isDouble(v) {
  return _isNumber(v) && String(v).indexOf('.') !== -1;
}

/**
 * Returns true if the given value is numeric.
 *
 * @param v the value to check.
 *
 * @return true if the value is numeric, false if not.
 */
function _isNumeric(v) {
  return !isNaN(parseFloat(v)) && isFinite(v);
}

/**
 * Returns true if the given value is a Boolean.
 *
 * @param v the value to check.
 *
 * @return true if the value is a Boolean, false if not.
 */
function _isBoolean(v) {
  return (typeof v === 'boolean' ||
    Object.prototype.toString.call(v) === '[object Boolean]');
}

/**
 * Returns true if the given value is undefined.
 *
 * @param v the value to check.
 *
 * @return true if the value is undefined, false if not.
 */
function _isUndefined(v) {
  return (typeof v === 'undefined');
}

/**
 * Returns true if the given value is a subject with properties.
 *
 * @param v the value to check.
 *
 * @return true if the value is a subject with properties, false if not.
 */
function _isSubject(v) {
  // Note: A value is a subject if all of these hold true:
  // 1. It is an Object.
  // 2. It is not a @value, @set, or @list.
  // 3. It has more than 1 key OR any existing key is not @id.
  var rval = false;
  if(_isObject(v) &&
    !(('@value' in v) || ('@set' in v) || ('@list' in v))) {
    var keyCount = Object.keys(v).length;
    rval = (keyCount > 1 || !('@id' in v));
  }
  return rval;
}

/**
 * Returns true if the given value is a subject reference.
 *
 * @param v the value to check.
 *
 * @return true if the value is a subject reference, false if not.
 */
function _isSubjectReference(v) {
  // Note: A value is a subject reference if all of these hold true:
  // 1. It is an Object.
  // 2. It has a single key: @id.
  return (_isObject(v) && Object.keys(v).length === 1 && ('@id' in v));
}

/**
 * Returns true if the given value is a @value.
 *
 * @param v the value to check.
 *
 * @return true if the value is a @value, false if not.
 */
function _isValue(v) {
  // Note: A value is a @value if all of these hold true:
  // 1. It is an Object.
  // 2. It has the @value property.
  return _isObject(v) && ('@value' in v);
}

/**
 * Returns true if the given value is a @list.
 *
 * @param v the value to check.
 *
 * @return true if the value is a @list, false if not.
 */
function _isList(v) {
  // Note: A value is a @list if all of these hold true:
  // 1. It is an Object.
  // 2. It has the @list property.
  return _isObject(v) && ('@list' in v);
}

/**
 * Returns true if the given value is a blank node.
 *
 * @param v the value to check.
 *
 * @return true if the value is a blank node, false if not.
 */
function _isBlankNode(v) {
  // Note: A value is a blank node if all of these hold true:
  // 1. It is an Object.
  // 2. If it has an @id key its value begins with '_:'.
  // 3. It has no keys OR is not a @value, @set, or @list.
  var rval = false;
  if(_isObject(v)) {
    if('@id' in v) {
      rval = (v['@id'].indexOf('_:') === 0);
    } else {
      rval = (Object.keys(v).length === 0 ||
        !(('@value' in v) || ('@set' in v) || ('@list' in v)));
    }
  }
  return rval;
}

/**
 * Returns true if the given value is an absolute IRI, false if not.
 *
 * @param v the value to check.
 *
 * @return true if the value is an absolute IRI, false if not.
 */
function _isAbsoluteIri(v) {
  return _isString(v) && v.indexOf(':') !== -1;
}

/**
 * Clones an object, array, or string/number. If a typed JavaScript object
 * is given, such as a Date, it will be converted to a string.
 *
 * @param value the value to clone.
 *
 * @return the cloned value.
 */
function _clone(value) {
  if(value && typeof value === 'object') {
    var rval;
    if(_isArray(value)) {
      rval = [];
      for(var i = 0; i < value.length; ++i) {
        rval[i] = _clone(value[i]);
      }
    } else if(_isObject(value)) {
      rval = {};
      for(var key in value) {
        rval[key] = _clone(value[key]);
      }
    } else {
      rval = value.toString();
    }
    return rval;
  }
  return value;
}

/**
 * Finds all @context URLs in the given JSON-LD input.
 *
 * @param input the JSON-LD input.
 * @param urls a map of URLs (url => false/@contexts).
 * @param replace true to replace the URLs in the given input with the
 *           @contexts from the urls map, false not to.
 * @param base the base IRI to use to resolve relative IRIs.
 *
 * @return true if new URLs to retrieve were found, false if not.
 */
function _findContextUrls(input, urls, replace, base) {
  var count = Object.keys(urls).length;
  if(_isArray(input)) {
    for(var i = 0; i < input.length; ++i) {
      _findContextUrls(input[i], urls, replace, base);
    }
    return (count < Object.keys(urls).length);
  } else if(_isObject(input)) {
    for(var key in input) {
      if(key !== '@context') {
        _findContextUrls(input[key], urls, replace, base);
        continue;
      }

      // get @context
      var ctx = input[key];

      // array @context
      if(_isArray(ctx)) {
        var length = ctx.length;
        for(var i = 0; i < length; ++i) {
          var _ctx = ctx[i];
          if(_isString(_ctx)) {
            _ctx = jsonld.prependBase(base, _ctx);
            // replace w/@context if requested
            if(replace) {
              _ctx = urls[_ctx];
              if(_isArray(_ctx)) {
                // add flattened context
                Array.prototype.splice.apply(ctx, [i, 1].concat(_ctx));
                i += _ctx.length - 1;
                length = ctx.length;
              } else {
                ctx[i] = _ctx;
              }
            } else if(!(_ctx in urls)) {
              // @context URL found
              urls[_ctx] = false;
            }
          }
        }
      } else if(_isString(ctx)) {
        // string @context
        ctx = jsonld.prependBase(base, ctx);
        // replace w/@context if requested
        if(replace) {
          input[key] = urls[ctx];
        } else if(!(ctx in urls)) {
          // @context URL found
          urls[ctx] = false;
        }
      }
    }
    return (count < Object.keys(urls).length);
  }
  return false;
}

/**
 * Retrieves external @context URLs using the given document loader. Every
 * instance of @context in the input that refers to a URL will be replaced
 * with the JSON @context found at that URL.
 *
 * @param input the JSON-LD input with possible contexts.
 * @param options the options to use:
 *          documentLoader(url, callback(err, remoteDoc)) the document loader.
 * @param callback(err, input) called once the operation completes.
 */
function _retrieveContextUrls(input, options, callback) {
  // if any error occurs during URL resolution, quit
  var error = null;

  // recursive document loader
  var documentLoader = options.documentLoader;
  var retrieve = function(input, cycles, documentLoader, base, callback) {
    if(Object.keys(cycles).length > MAX_CONTEXT_URLS) {
      error = new JsonLdError(
        'Maximum number of @context URLs exceeded.',
        'jsonld.ContextUrlError',
        {code: 'loading remote context failed', max: MAX_CONTEXT_URLS});
      return callback(error);
    }

    // for tracking the URLs to retrieve
    var urls = {};

    // finished will be called once the URL queue is empty
    var finished = function() {
      // replace all URLs in the input
      _findContextUrls(input, urls, true, base);
      callback(null, input);
    };

    // find all URLs in the given input
    if(!_findContextUrls(input, urls, false, base)) {
      // no new URLs in input
      finished();
    }

    // queue all unretrieved URLs
    var queue = [];
    for(var url in urls) {
      if(urls[url] === false) {
        queue.push(url);
      }
    }

    // retrieve URLs in queue
    var count = queue.length;
    for(var i = 0; i < queue.length; ++i) {
      (function(url) {
        // check for context URL cycle
        if(url in cycles) {
          error = new JsonLdError(
            'Cyclical @context URLs detected.',
            'jsonld.ContextUrlError',
            {code: 'recursive context inclusion', url: url});
          return callback(error);
        }
        var _cycles = _clone(cycles);
        _cycles[url] = true;
        var done = function(err, remoteDoc) {
          // short-circuit if there was an error with another URL
          if(error) {
            return;
          }

          var ctx = remoteDoc ? remoteDoc.document : null;

          // parse string context as JSON
          if(!err && _isString(ctx)) {
            try {
              ctx = JSON.parse(ctx);
            } catch(ex) {
              err = ex;
            }
          }

          // ensure ctx is an object
          if(err) {
            err = new JsonLdError(
              'Dereferencing a URL did not result in a valid JSON-LD object. ' +
              'Possible causes are an inaccessible URL perhaps due to ' +
              'a same-origin policy (ensure the server uses CORS if you are ' +
              'using client-side JavaScript), too many redirects, a ' +
              'non-JSON response, or more than one HTTP Link Header was ' +
              'provided for a remote context.',
              'jsonld.InvalidUrl',
              {code: 'loading remote context failed', url: url, cause: err});
          } else if(!_isObject(ctx)) {
            err = new JsonLdError(
              'Dereferencing a URL did not result in a JSON object. The ' +
              'response was valid JSON, but it was not a JSON object.',
              'jsonld.InvalidUrl',
              {code: 'invalid remote context', url: url, cause: err});
          }
          if(err) {
            error = err;
            return callback(error);
          }

          // use empty context if no @context key is present
          if(!('@context' in ctx)) {
            ctx = {'@context': {}};
          } else {
            ctx = {'@context': ctx['@context']};
          }

          // append context URL to context if given
          if(remoteDoc.contextUrl) {
            if(!_isArray(ctx['@context'])) {
              ctx['@context'] = [ctx['@context']];
            }
            ctx['@context'].push(remoteDoc.contextUrl);
          }

          // recurse
          retrieve(ctx, _cycles, documentLoader, url, function(err, ctx) {
            if(err) {
              return callback(err);
            }
            urls[url] = ctx['@context'];
            count -= 1;
            if(count === 0) {
              finished();
            }
          });
        };
        var promise = documentLoader(url, done);
        if(promise && 'then' in promise) {
          promise.then(done.bind(null, null), done);
        }
      }(queue[i]));
    }
  };
  retrieve(input, {}, documentLoader, options.base, callback);
}

// define js 1.8.5 Object.keys method if not present
if(!Object.keys) {
  Object.keys = function(o) {
    if(o !== Object(o)) {
      throw new TypeError('Object.keys called on non-object');
    }
    var rval = [];
    for(var p in o) {
      if(Object.prototype.hasOwnProperty.call(o, p)) {
        rval.push(p);
      }
    }
    return rval;
  };
}

/**
 * Parses RDF in the form of N-Quads.
 *
 * @param input the N-Quads input to parse.
 *
 * @return an RDF dataset.
 */
function _parseNQuads(input) {
  // define partial regexes
  var iri = '(?:<([^:]+:[^>]*)>)';
  var bnode = '(_:(?:[A-Za-z0-9]+))';
  var plain = '"([^"\\\\]*(?:\\\\.[^"\\\\]*)*)"';
  var datatype = '(?:\\^\\^' + iri + ')';
  var language = '(?:@([a-z]+(?:-[a-z0-9]+)*))';
  var literal = '(?:' + plain + '(?:' + datatype + '|' + language + ')?)';
  var comment = '(?:#.*)?';
  var ws = '[ \\t]+';
  var wso = '[ \\t]*';
  var eoln = /(?:\r\n)|(?:\n)|(?:\r)/g;
  var empty = new RegExp('^' + wso + comment + '$');

  // define quad part regexes
  var subject = '(?:' + iri + '|' + bnode + ')' + ws;
  var property = iri + ws;
  var object = '(?:' + iri + '|' + bnode + '|' + literal + ')' + wso;
  var graphName = '(?:\\.|(?:(?:' + iri + '|' + bnode + ')' + wso + '\\.))';

  // full quad regex
  var quad = new RegExp(
    '^' + wso + subject + property + object + graphName + wso + comment + '$');

  // build RDF dataset
  var dataset = {};

  // split N-Quad input into lines
  var lines = input.split(eoln);
  var lineNumber = 0;
  for(var li = 0; li < lines.length; ++li) {
    var line = lines[li];
    lineNumber++;

    // skip empty lines
    if(empty.test(line)) {
      continue;
    }

    // parse quad
    var match = line.match(quad);
    if(match === null) {
      throw new JsonLdError(
        'Error while parsing N-Quads; invalid quad.',
        'jsonld.ParseError', {line: lineNumber});
    }

    // create RDF triple
    var triple = {};

    // get subject
    if(!_isUndefined(match[1])) {
      triple.subject = {type: 'IRI', value: match[1]};
    } else {
      triple.subject = {type: 'blank node', value: match[2]};
    }

    // get predicate
    triple.predicate = {type: 'IRI', value: match[3]};

    // get object
    if(!_isUndefined(match[4])) {
      triple.object = {type: 'IRI', value: match[4]};
    } else if(!_isUndefined(match[5])) {
      triple.object = {type: 'blank node', value: match[5]};
    } else {
      triple.object = {type: 'literal'};
      if(!_isUndefined(match[7])) {
        triple.object.datatype = match[7];
      } else if(!_isUndefined(match[8])) {
        triple.object.datatype = RDF_LANGSTRING;
        triple.object.language = match[8];
      } else {
        triple.object.datatype = XSD_STRING;
      }
      var unescaped = match[6]
        .replace(/\\"/g, '"')
        .replace(/\\t/g, '\t')
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\\\/g, '\\');
      triple.object.value = unescaped;
    }

    // get graph name ('@default' is used for the default graph)
    var name = '@default';
    if(!_isUndefined(match[9])) {
      name = match[9];
    } else if(!_isUndefined(match[10])) {
      name = match[10];
    }

    // initialize graph in dataset
    if(!(name in dataset)) {
      dataset[name] = [triple];
    } else {
      // add triple if unique to its graph
      var unique = true;
      var triples = dataset[name];
      for(var ti = 0; unique && ti < triples.length; ++ti) {
        if(_compareRDFTriples(triples[ti], triple)) {
          unique = false;
        }
      }
      if(unique) {
        triples.push(triple);
      }
    }
  }

  return dataset;
}

// register the N-Quads RDF parser
jsonld.registerRDFParser('application/nquads', _parseNQuads);

/**
 * Converts an RDF dataset to N-Quads.
 *
 * @param dataset the RDF dataset to convert.
 *
 * @return the N-Quads string.
 */
function _toNQuads(dataset) {
  var quads = [];
  for(var graphName in dataset) {
    var triples = dataset[graphName];
    for(var ti = 0; ti < triples.length; ++ti) {
      var triple = triples[ti];
      if(graphName === '@default') {
        graphName = null;
      }
      quads.push(_toNQuad(triple, graphName));
    }
  }
  return quads.sort().join('');
}

/**
 * Converts an RDF triple and graph name to an N-Quad string (a single quad).
 *
 * @param triple the RDF triple or quad to convert (a triple or quad may be
 *          passed, if a triple is passed then `graphName` should be given
 *          to specify the name of the graph the triple is in, `null` for
 *          the default graph).
 * @param graphName the name of the graph containing the triple, null for
 *          the default graph.
 *
 * @return the N-Quad string.
 */
function _toNQuad(triple, graphName) {
  var s = triple.subject;
  var p = triple.predicate;
  var o = triple.object;
  var g = graphName || null;
  if('name' in triple && triple.name) {
    g = triple.name.value;
  }

  var quad = '';

  // subject is an IRI
  if(s.type === 'IRI') {
    quad += '<' + s.value + '>';
  } else {
    quad += s.value;
  }
  quad += ' ';

  // predicate is an IRI
  if(p.type === 'IRI') {
    quad += '<' + p.value + '>';
  } else {
    quad += p.value;
  }
  quad += ' ';

  // object is IRI, bnode, or literal
  if(o.type === 'IRI') {
    quad += '<' + o.value + '>';
  } else if(o.type === 'blank node') {
    quad += o.value;
  } else {
    var escaped = o.value
      .replace(/\\/g, '\\\\')
      .replace(/\t/g, '\\t')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\"/g, '\\"');
    quad += '"' + escaped + '"';
    if(o.datatype === RDF_LANGSTRING) {
      if(o.language) {
        quad += '@' + o.language;
      }
    } else if(o.datatype !== XSD_STRING) {
      quad += '^^<' + o.datatype + '>';
    }
  }

  // graph
  if(g !== null && g !== undefined) {
    if(g.indexOf('_:') !== 0) {
      quad += ' <' + g + '>';
    } else {
      quad += ' ' + g;
    }
  }

  quad += ' .\n';
  return quad;
}

/**
 * Parses the RDF dataset found via the data object from the RDFa API.
 *
 * @param data the RDFa API data object.
 *
 * @return the RDF dataset.
 */
function _parseRdfaApiData(data) {
  var dataset = {};
  dataset['@default'] = [];

  var subjects = data.getSubjects();
  for(var si = 0; si < subjects.length; ++si) {
    var subject = subjects[si];
    if(subject === null) {
      continue;
    }

    // get all related triples
    var triples = data.getSubjectTriples(subject);
    if(triples === null) {
      continue;
    }
    var predicates = triples.predicates;
    for(var predicate in predicates) {
      // iterate over objects
      var objects = predicates[predicate].objects;
      for(var oi = 0; oi < objects.length; ++oi) {
        var object = objects[oi];

        // create RDF triple
        var triple = {};

        // add subject
        if(subject.indexOf('_:') === 0) {
          triple.subject = {type: 'blank node', value: subject};
        } else {
          triple.subject = {type: 'IRI', value: subject};
        }

        // add predicate
        if(predicate.indexOf('_:') === 0) {
          triple.predicate = {type: 'blank node', value: predicate};
        } else {
          triple.predicate = {type: 'IRI', value: predicate};
        }

        // serialize XML literal
        var value = object.value;
        if(object.type === RDF_XML_LITERAL) {
          // initialize XMLSerializer
          if(!XMLSerializer) {
            _defineXMLSerializer();
          }
          var serializer = new XMLSerializer();
          value = '';
          for(var x = 0; x < object.value.length; x++) {
            if(object.value[x].nodeType === Node.ELEMENT_NODE) {
              value += serializer.serializeToString(object.value[x]);
            } else if(object.value[x].nodeType === Node.TEXT_NODE) {
              value += object.value[x].nodeValue;
            }
          }
        }

        // add object
        triple.object = {};

        // object is an IRI
        if(object.type === RDF_OBJECT) {
          if(object.value.indexOf('_:') === 0) {
            triple.object.type = 'blank node';
          } else {
            triple.object.type = 'IRI';
          }
        } else {
          // object is a literal
          triple.object.type = 'literal';
          if(object.type === RDF_PLAIN_LITERAL) {
            if(object.language) {
              triple.object.datatype = RDF_LANGSTRING;
              triple.object.language = object.language;
            } else {
              triple.object.datatype = XSD_STRING;
            }
          } else {
            triple.object.datatype = object.type;
          }
        }
        triple.object.value = value;

        // add triple to dataset in default graph
        dataset['@default'].push(triple);
      }
    }
  }

  return dataset;
}

// register the RDFa API RDF parser
jsonld.registerRDFParser('rdfa-api', _parseRdfaApiData);

/**
 * Creates a new IdentifierIssuer. A IdentifierIssuer issues unique
 * identifiers, keeping track of any previously issued identifiers.
 *
 * @param prefix the prefix to use ('<prefix><counter>').
 */
function IdentifierIssuer(prefix) {
  this.prefix = prefix;
  this.counter = 0;
  this.existing = {};
}
jsonld.IdentifierIssuer = IdentifierIssuer;
// backwards-compability
jsonld.UniqueNamer = IdentifierIssuer;

/**
 * Copies this IdentifierIssuer.
 *
 * @return a copy of this IdentifierIssuer.
 */
IdentifierIssuer.prototype.clone = function() {
  var copy = new IdentifierIssuer(this.prefix);
  copy.counter = this.counter;
  copy.existing = _clone(this.existing);
  return copy;
};

/**
 * Gets the new identifier for the given old identifier, where if no old
 * identifier is given a new identifier will be generated.
 *
 * @param [old] the old identifier to get the new identifier for.
 *
 * @return the new identifier.
 */
IdentifierIssuer.prototype.getId = function(old) {
  // return existing old identifier
  if(old && old in this.existing) {
    return this.existing[old];
  }

  // get next identifier
  var identifier = this.prefix + this.counter;
  this.counter += 1;

  // save mapping
  if(old) {
    this.existing[old] = identifier;
  }

  return identifier;
};
// alias
IdentifierIssuer.prototype.getName = IdentifierIssuer.prototype.getName;

/**
 * Returns true if the given old identifer has already been assigned a new
 * identifier.
 *
 * @param old the old identifier to check.
 *
 * @return true if the old identifier has been assigned a new identifier, false
 *   if not.
 */
IdentifierIssuer.prototype.hasId = function(old) {
  return (old in this.existing);
};
// alias
IdentifierIssuer.prototype.isNamed = IdentifierIssuer.prototype.hasId;

/**
 * A Permutator iterates over all possible permutations of the given array
 * of elements.
 *
 * @param list the array of elements to iterate over.
 */
var Permutator = function(list) {
  // original array
  this.list = list.sort();
  // indicates whether there are more permutations
  this.done = false;
  // directional info for permutation algorithm
  this.left = {};
  for(var i = 0; i < list.length; ++i) {
    this.left[list[i]] = true;
  }
};

/**
 * Returns true if there is another permutation.
 *
 * @return true if there is another permutation, false if not.
 */
Permutator.prototype.hasNext = function() {
  return !this.done;
};

/**
 * Gets the next permutation. Call hasNext() to ensure there is another one
 * first.
 *
 * @return the next permutation.
 */
Permutator.prototype.next = function() {
  // copy current permutation
  var rval = this.list.slice();

  /* Calculate the next permutation using the Steinhaus-Johnson-Trotter
   permutation algorithm. */

  // get largest mobile element k
  // (mobile: element is greater than the one it is looking at)
  var k = null;
  var pos = 0;
  var length = this.list.length;
  for(var i = 0; i < length; ++i) {
    var element = this.list[i];
    var left = this.left[element];
    if((k === null || element > k) &&
      ((left && i > 0 && element > this.list[i - 1]) ||
      (!left && i < (length - 1) && element > this.list[i + 1]))) {
      k = element;
      pos = i;
    }
  }

  // no more permutations
  if(k === null) {
    this.done = true;
  } else {
    // swap k and the element it is looking at
    var swap = this.left[k] ? pos - 1 : pos + 1;
    this.list[pos] = this.list[swap];
    this.list[swap] = k;

    // reverse the direction of all elements larger than k
    for(var i = 0; i < length; ++i) {
      if(this.list[i] > k) {
        this.left[this.list[i]] = !this.left[this.list[i]];
      }
    }
  }

  return rval;
};

//////////////////////// DEFINE NORMALIZATION HASH API ////////////////////////

/**
 * Creates a new NormalizeHash for use by the given normalization algorithm.
 *
 * @param algorithm the RDF Dataset Normalization algorithm to use:
 *          'URDNA2015' or 'URGNA2012'.
 */
var NormalizeHash = function(algorithm) {
  if(!(this instanceof NormalizeHash)) {
    return new NormalizeHash(algorithm);
  }
  if(['URDNA2015', 'URGNA2012'].indexOf(algorithm) === -1) {
    throw new Error(
      'Invalid RDF Dataset Normalization algorithm: ' + algorithm);
  }
  NormalizeHash._init.call(this, algorithm);
};
NormalizeHash.hashNQuads = function(algorithm, nquads) {
  var md = new NormalizeHash(algorithm);
  for(var i = 0; i < nquads.length; ++i) {
    md.update(nquads[i]);
  }
  return md.digest();
};

// switch definition of NormalizeHash based on environment
(function(_nodejs) {

if(_nodejs) {
  // define NormalizeHash using native crypto lib
  var crypto = require('crypto');
  NormalizeHash._init = function(algorithm) {
    if(algorithm === 'URDNA2015') {
      algorithm = 'sha256';
    } else {
      // assume URGNA2012
      algorithm = 'sha1';
    }
    this.md = crypto.createHash(algorithm);
  };
  NormalizeHash.prototype.update = function(msg) {
    return this.md.update(msg, 'utf8');
  };
  NormalizeHash.prototype.digest = function() {
    return this.md.digest('hex');
  };
  return;
}

// define NormalizeHash using JavaScript
NormalizeHash._init = function(algorithm) {
  if(algorithm === 'URDNA2015') {
    algorithm = new sha256.Algorithm();
  } else {
    // assume URGNA2012
    algorithm = new sha1.Algorithm();
  }
  this.md = new MessageDigest(algorithm);
};
NormalizeHash.prototype.update = function(msg) {
  return this.md.update(msg);
};
NormalizeHash.prototype.digest = function() {
  return this.md.digest().toHex();
};

/////////////////////////// DEFINE MESSAGE DIGEST API /////////////////////////

/**
 * Creates a new MessageDigest.
 *
 * @param algorithm the algorithm to use.
 */
var MessageDigest = function(algorithm) {
  if(!(this instanceof MessageDigest)) {
    return new MessageDigest(algorithm);
  }

  this._algorithm = algorithm;

  // create shared padding as needed
  if(!MessageDigest._padding ||
    MessageDigest._padding.length < this._algorithm.blockSize) {
    MessageDigest._padding = String.fromCharCode(128);
    var c = String.fromCharCode(0x00);
    var n = 64;
    while(n > 0) {
      if(n & 1) {
        MessageDigest._padding += c;
      }
      n >>>= 1;
      if(n > 0) {
        c += c;
      }
    }
  }

  // start digest automatically for first time
  this.start();
};

/**
 * Starts the digest.
 *
 * @return this digest object.
 */
MessageDigest.prototype.start = function() {
  // up to 56-bit message length for convenience
  this.messageLength = 0;

  // full message length
  this.fullMessageLength = [];
  var int32s = this._algorithm.messageLengthSize / 4;
  for(var i = 0; i < int32s; ++i) {
    this.fullMessageLength.push(0);
  }

  // input buffer
  this._input = new MessageDigest.ByteBuffer();

  // get starting state
  this.state = this._algorithm.start();

  return this;
};

/**
 * Updates the digest with the given message input. The input must be
 * a string of characters.
 *
 * @param msg the message input to update with (ByteBuffer or string).
 *
 * @return this digest object.
 */
MessageDigest.prototype.update = function(msg) {
  // encode message as a UTF-8 encoded binary string
  msg = new MessageDigest.ByteBuffer(unescape(encodeURIComponent(msg)));

  // update message length
  this.messageLength += msg.length();
  var len = msg.length();
  len = [(len / 0x100000000) >>> 0, len >>> 0];
  for(var i = this.fullMessageLength.length - 1; i >= 0; --i) {
    this.fullMessageLength[i] += len[1];
    len[1] = len[0] + ((this.fullMessageLength[i] / 0x100000000) >>> 0);
    this.fullMessageLength[i] = this.fullMessageLength[i] >>> 0;
    len[0] = ((len[1] / 0x100000000) >>> 0);
  }

  // add bytes to input buffer
  this._input.putBytes(msg.bytes());

  // digest blocks
  while(this._input.length() >= this._algorithm.blockSize) {
    this.state = this._algorithm.digest(this.state, this._input);
  }

  // compact input buffer every 2K or if empty
  if(this._input.read > 2048 || this._input.length() === 0) {
    this._input.compact();
  }

  return this;
};

/**
 * Produces the digest.
 *
 * @return a byte buffer containing the digest value.
 */
MessageDigest.prototype.digest = function() {
  /* Note: Here we copy the remaining bytes in the input buffer and add the
  appropriate padding. Then we do the final update on a copy of the state so
  that if the user wants to get intermediate digests they can do so. */

  /* Determine the number of bytes that must be added to the message to
  ensure its length is appropriately congruent. In other words, the data to
  be digested must be a multiple of `blockSize`. This data includes the
  message, some padding, and the length of the message. Since the length of
  the message will be encoded as `messageLengthSize` bytes, that means that
  the last segment of the data must have `blockSize` - `messageLengthSize`
  bytes of message and padding. Therefore, the length of the message plus the
  padding must be congruent to X mod `blockSize` because
  `blockSize` - `messageLengthSize` = X.

  For example, SHA-1 is congruent to 448 mod 512 and SHA-512 is congruent to
  896 mod 1024. SHA-1 uses a `blockSize` of 64 bytes (512 bits) and a
  `messageLengthSize` of 8 bytes (64 bits). SHA-512 uses a `blockSize` of
  128 bytes (1024 bits) and a `messageLengthSize` of 16 bytes (128 bits).

  In order to fill up the message length it must be filled with padding that
  begins with 1 bit followed by all 0 bits. Padding must *always* be present,
  so if the message length is already congruent, then `blockSize` padding bits
  must be added. */

  // create final block
  var finalBlock = new MessageDigest.ByteBuffer();
  finalBlock.putBytes(this._input.bytes());

  // compute remaining size to be digested (include message length size)
  var remaining = (
    this.fullMessageLength[this.fullMessageLength.length - 1] +
    this._algorithm.messageLengthSize);

  // add padding for overflow blockSize - overflow
  // _padding starts with 1 byte with first bit is set (byte value 128), then
  // there may be up to (blockSize - 1) other pad bytes
  var overflow = remaining & (this._algorithm.blockSize - 1);
  finalBlock.putBytes(MessageDigest._padding.substr(
    0, this._algorithm.blockSize - overflow));

  // serialize message length in bits in big-endian order; since length
  // is stored in bytes we multiply by 8 (left shift by 3 and merge in
  // remainder from )
  var messageLength = new MessageDigest.ByteBuffer();
  for(var i = 0; i < this.fullMessageLength.length; ++i) {
    messageLength.putInt32((this.fullMessageLength[i] << 3) |
      (this.fullMessageLength[i + 1] >>> 28));
  }

  // write the length of the message (algorithm-specific)
  this._algorithm.writeMessageLength(finalBlock, messageLength);

  // digest final block
  var state = this._algorithm.digest(this.state.copy(), finalBlock);

  // write state to buffer
  var rval = new MessageDigest.ByteBuffer();
  state.write(rval);
  return rval;
};

/**
 * Creates a simple byte buffer for message digest operations.
 *
 * @param data the data to put in the buffer.
 */
MessageDigest.ByteBuffer = function(data) {
  if(typeof data === 'string') {
    this.data = data;
  } else {
    this.data = '';
  }
  this.read = 0;
};

/**
 * Puts a 32-bit integer into this buffer in big-endian order.
 *
 * @param i the 32-bit integer.
 */
MessageDigest.ByteBuffer.prototype.putInt32 = function(i) {
  this.data += (
    String.fromCharCode(i >> 24 & 0xFF) +
    String.fromCharCode(i >> 16 & 0xFF) +
    String.fromCharCode(i >> 8 & 0xFF) +
    String.fromCharCode(i & 0xFF));
};

/**
 * Gets a 32-bit integer from this buffer in big-endian order and
 * advances the read pointer by 4.
 *
 * @return the word.
 */
MessageDigest.ByteBuffer.prototype.getInt32 = function() {
  var rval = (
    this.data.charCodeAt(this.read) << 24 ^
    this.data.charCodeAt(this.read + 1) << 16 ^
    this.data.charCodeAt(this.read + 2) << 8 ^
    this.data.charCodeAt(this.read + 3));
  this.read += 4;
  return rval;
};

/**
 * Puts the given bytes into this buffer.
 *
 * @param bytes the bytes as a binary-encoded string.
 */
MessageDigest.ByteBuffer.prototype.putBytes = function(bytes) {
  this.data += bytes;
};

/**
 * Gets the bytes in this buffer.
 *
 * @return a string full of UTF-8 encoded characters.
 */
MessageDigest.ByteBuffer.prototype.bytes = function() {
  return this.data.slice(this.read);
};

/**
 * Gets the number of bytes in this buffer.
 *
 * @return the number of bytes in this buffer.
 */
MessageDigest.ByteBuffer.prototype.length = function() {
  return this.data.length - this.read;
};

/**
 * Compacts this buffer.
 */
MessageDigest.ByteBuffer.prototype.compact = function() {
  this.data = this.data.slice(this.read);
  this.read = 0;
};

/**
 * Converts this buffer to a hexadecimal string.
 *
 * @return a hexadecimal string.
 */
MessageDigest.ByteBuffer.prototype.toHex = function() {
  var rval = '';
  for(var i = this.read; i < this.data.length; ++i) {
    var b = this.data.charCodeAt(i);
    if(b < 16) {
      rval += '0';
    }
    rval += b.toString(16);
  }
  return rval;
};

///////////////////////////// DEFINE SHA-1 ALGORITHM //////////////////////////

var sha1 = {
  // used for word storage
  _w: null
};

sha1.Algorithm = function() {
  this.name = 'sha1',
  this.blockSize = 64;
  this.digestLength = 20;
  this.messageLengthSize = 8;
};

sha1.Algorithm.prototype.start = function() {
  if(!sha1._w) {
    sha1._w = new Array(80);
  }
  return sha1._createState();
};

sha1.Algorithm.prototype.writeMessageLength = function(
  finalBlock, messageLength) {
  // message length is in bits and in big-endian order; simply append
  finalBlock.putBytes(messageLength.bytes());
};

sha1.Algorithm.prototype.digest = function(s, input) {
  // consume 512 bit (64 byte) chunks
  var t, a, b, c, d, e, f, i;
  var len = input.length();
  var _w = sha1._w;
  while(len >= 64) {
    // initialize hash value for this chunk
    a = s.h0;
    b = s.h1;
    c = s.h2;
    d = s.h3;
    e = s.h4;

    // the _w array will be populated with sixteen 32-bit big-endian words
    // and then extended into 80 32-bit words according to SHA-1 algorithm
    // and for 32-79 using Max Locktyukhin's optimization

    // round 1
    for(i = 0; i < 16; ++i) {
      t = input.getInt32();
      _w[i] = t;
      f = d ^ (b & (c ^ d));
      t = ((a << 5) | (a >>> 27)) + f + e + 0x5A827999 + t;
      e = d;
      d = c;
      c = (b << 30) | (b >>> 2);
      b = a;
      a = t;
    }
    for(; i < 20; ++i) {
      t = (_w[i - 3] ^ _w[i - 8] ^ _w[i - 14] ^ _w[i - 16]);
      t = (t << 1) | (t >>> 31);
      _w[i] = t;
      f = d ^ (b & (c ^ d));
      t = ((a << 5) | (a >>> 27)) + f + e + 0x5A827999 + t;
      e = d;
      d = c;
      c = (b << 30) | (b >>> 2);
      b = a;
      a = t;
    }
    // round 2
    for(; i < 32; ++i) {
      t = (_w[i - 3] ^ _w[i - 8] ^ _w[i - 14] ^ _w[i - 16]);
      t = (t << 1) | (t >>> 31);
      _w[i] = t;
      f = b ^ c ^ d;
      t = ((a << 5) | (a >>> 27)) + f + e + 0x6ED9EBA1 + t;
      e = d;
      d = c;
      c = (b << 30) | (b >>> 2);
      b = a;
      a = t;
    }
    for(; i < 40; ++i) {
      t = (_w[i - 6] ^ _w[i - 16] ^ _w[i - 28] ^ _w[i - 32]);
      t = (t << 2) | (t >>> 30);
      _w[i] = t;
      f = b ^ c ^ d;
      t = ((a << 5) | (a >>> 27)) + f + e + 0x6ED9EBA1 + t;
      e = d;
      d = c;
      c = (b << 30) | (b >>> 2);
      b = a;
      a = t;
    }
    // round 3
    for(; i < 60; ++i) {
      t = (_w[i - 6] ^ _w[i - 16] ^ _w[i - 28] ^ _w[i - 32]);
      t = (t << 2) | (t >>> 30);
      _w[i] = t;
      f = (b & c) | (d & (b ^ c));
      t = ((a << 5) | (a >>> 27)) + f + e + 0x8F1BBCDC + t;
      e = d;
      d = c;
      c = (b << 30) | (b >>> 2);
      b = a;
      a = t;
    }
    // round 4
    for(; i < 80; ++i) {
      t = (_w[i - 6] ^ _w[i - 16] ^ _w[i - 28] ^ _w[i - 32]);
      t = (t << 2) | (t >>> 30);
      _w[i] = t;
      f = b ^ c ^ d;
      t = ((a << 5) | (a >>> 27)) + f + e + 0xCA62C1D6 + t;
      e = d;
      d = c;
      c = (b << 30) | (b >>> 2);
      b = a;
      a = t;
    }

    // update hash state
    s.h0 = (s.h0 + a) | 0;
    s.h1 = (s.h1 + b) | 0;
    s.h2 = (s.h2 + c) | 0;
    s.h3 = (s.h3 + d) | 0;
    s.h4 = (s.h4 + e) | 0;

    len -= 64;
  }

  return s;
};

sha1._createState = function() {
  var state = {
    h0: 0x67452301,
    h1: 0xEFCDAB89,
    h2: 0x98BADCFE,
    h3: 0x10325476,
    h4: 0xC3D2E1F0
  };
  state.copy = function() {
    var rval = sha1._createState();
    rval.h0 = state.h0;
    rval.h1 = state.h1;
    rval.h2 = state.h2;
    rval.h3 = state.h3;
    rval.h4 = state.h4;
    return rval;
  };
  state.write = function(buffer) {
    buffer.putInt32(state.h0);
    buffer.putInt32(state.h1);
    buffer.putInt32(state.h2);
    buffer.putInt32(state.h3);
    buffer.putInt32(state.h4);
  };
  return state;
};

//////////////////////////// DEFINE SHA-256 ALGORITHM /////////////////////////

var sha256 = {
  // shared state
  _k: null,
  _w: null
};

sha256.Algorithm = function() {
  this.name = 'sha256',
  this.blockSize = 64;
  this.digestLength = 32;
  this.messageLengthSize = 8;
};

sha256.Algorithm.prototype.start = function() {
  if(!sha256._k) {
    sha256._init();
  }
  return sha256._createState();
};

sha256.Algorithm.prototype.writeMessageLength = function(
  finalBlock, messageLength) {
  // message length is in bits and in big-endian order; simply append
  finalBlock.putBytes(messageLength.bytes());
};

sha256.Algorithm.prototype.digest = function(s, input) {
  // consume 512 bit (64 byte) chunks
  var t1, t2, s0, s1, ch, maj, i, a, b, c, d, e, f, g, h;
  var len = input.length();
  var _k = sha256._k;
  var _w = sha256._w;
  while(len >= 64) {
    // the w array will be populated with sixteen 32-bit big-endian words
    // and then extended into 64 32-bit words according to SHA-256
    for(i = 0; i < 16; ++i) {
      _w[i] = input.getInt32();
    }
    for(; i < 64; ++i) {
      // XOR word 2 words ago rot right 17, rot right 19, shft right 10
      t1 = _w[i - 2];
      t1 =
        ((t1 >>> 17) | (t1 << 15)) ^
        ((t1 >>> 19) | (t1 << 13)) ^
        (t1 >>> 10);
      // XOR word 15 words ago rot right 7, rot right 18, shft right 3
      t2 = _w[i - 15];
      t2 =
        ((t2 >>> 7) | (t2 << 25)) ^
        ((t2 >>> 18) | (t2 << 14)) ^
        (t2 >>> 3);
      // sum(t1, word 7 ago, t2, word 16 ago) modulo 2^32
      _w[i] = (t1 + _w[i - 7] + t2 + _w[i - 16]) | 0;
    }

    // initialize hash value for this chunk
    a = s.h0;
    b = s.h1;
    c = s.h2;
    d = s.h3;
    e = s.h4;
    f = s.h5;
    g = s.h6;
    h = s.h7;

    // round function
    for(i = 0; i < 64; ++i) {
      // Sum1(e)
      s1 =
        ((e >>> 6) | (e << 26)) ^
        ((e >>> 11) | (e << 21)) ^
        ((e >>> 25) | (e << 7));
      // Ch(e, f, g) (optimized the same way as SHA-1)
      ch = g ^ (e & (f ^ g));
      // Sum0(a)
      s0 =
        ((a >>> 2) | (a << 30)) ^
        ((a >>> 13) | (a << 19)) ^
        ((a >>> 22) | (a << 10));
      // Maj(a, b, c) (optimized the same way as SHA-1)
      maj = (a & b) | (c & (a ^ b));

      // main algorithm
      t1 = h + s1 + ch + _k[i] + _w[i];
      t2 = s0 + maj;
      h = g;
      g = f;
      f = e;
      e = (d + t1) | 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) | 0;
    }

    // update hash state
    s.h0 = (s.h0 + a) | 0;
    s.h1 = (s.h1 + b) | 0;
    s.h2 = (s.h2 + c) | 0;
    s.h3 = (s.h3 + d) | 0;
    s.h4 = (s.h4 + e) | 0;
    s.h5 = (s.h5 + f) | 0;
    s.h6 = (s.h6 + g) | 0;
    s.h7 = (s.h7 + h) | 0;
    len -= 64;
  }

  return s;
};

sha256._createState = function() {
  var state = {
    h0: 0x6A09E667,
    h1: 0xBB67AE85,
    h2: 0x3C6EF372,
    h3: 0xA54FF53A,
    h4: 0x510E527F,
    h5: 0x9B05688C,
    h6: 0x1F83D9AB,
    h7: 0x5BE0CD19
  };
  state.copy = function() {
    var rval = sha256._createState();
    rval.h0 = state.h0;
    rval.h1 = state.h1;
    rval.h2 = state.h2;
    rval.h3 = state.h3;
    rval.h4 = state.h4;
    rval.h5 = state.h5;
    rval.h6 = state.h6;
    rval.h7 = state.h7;
    return rval;
  };
  state.write = function(buffer) {
    buffer.putInt32(state.h0);
    buffer.putInt32(state.h1);
    buffer.putInt32(state.h2);
    buffer.putInt32(state.h3);
    buffer.putInt32(state.h4);
    buffer.putInt32(state.h5);
    buffer.putInt32(state.h6);
    buffer.putInt32(state.h7);
  };
  return state;
};

sha256._init = function() {
  // create K table for SHA-256
  sha256._k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
    0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
    0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
    0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
    0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
    0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];

  // used for word storage
  sha256._w = new Array(64);
};

})(_nodejs); // end definition of NormalizeHash

if(!XMLSerializer) {

var _defineXMLSerializer = function() {
  XMLSerializer = require('xmldom').XMLSerializer;
};

} // end _defineXMLSerializer

// define URL parser
// parseUri 1.2.2
// (c) Steven Levithan <stevenlevithan.com>
// MIT License
// with local jsonld.js modifications
jsonld.url = {};
jsonld.url.parsers = {
  simple: {
    // RFC 3986 basic parts
    keys: ['href','scheme','authority','path','query','fragment'],
    regex: /^(?:([^:\/?#]+):)?(?:\/\/([^\/?#]*))?([^?#]*)(?:\?([^#]*))?(?:#(.*))?/
  },
  full: {
    keys: ['href','protocol','scheme','authority','auth','user','password','hostname','port','path','directory','file','query','fragment'],
    regex: /^(([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?(?:(((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/
  }
};
jsonld.url.parse = function(str, parser) {
  var parsed = {};
  var o = jsonld.url.parsers[parser || 'full'];
  var m = o.regex.exec(str);
  var i = o.keys.length;
  while(i--) {
    parsed[o.keys[i]] = (m[i] === undefined) ? null : m[i];
  }
  parsed.normalizedPath = _removeDotSegments(parsed.path, !!parsed.authority);
  return parsed;
};

/**
 * Removes dot segments from a URL path.
 *
 * @param path the path to remove dot segments from.
 * @param hasAuthority true if the URL has an authority, false if not.
 */
function _removeDotSegments(path, hasAuthority) {
  var rval = '';

  if(path.indexOf('/') === 0) {
    rval = '/';
  }

  // RFC 3986 5.2.4 (reworked)
  var input = path.split('/');
  var output = [];
  while(input.length > 0) {
    if(input[0] === '.' || (input[0] === '' && input.length > 1)) {
      input.shift();
      continue;
    }
    if(input[0] === '..') {
      input.shift();
      if(hasAuthority ||
        (output.length > 0 && output[output.length - 1] !== '..')) {
        output.pop();
      } else {
        // leading relative URL '..'
        output.push('..');
      }
      continue;
    }
    output.push(input.shift());
  }

  return rval + output.join('/');
}

if(_nodejs) {
  // use node document loader by default
  jsonld.useDocumentLoader('node');
} else if(typeof XMLHttpRequest !== 'undefined') {
  // use xhr document loader by default
  jsonld.useDocumentLoader('xhr');
}

if(_nodejs) {
  jsonld.use = function(extension) {
    switch(extension) {
      // TODO: Deprecated as of 0.4.0. Remove at some point.
      case 'request':
        // use node JSON-LD request extension
        jsonld.request = require('jsonld-request');
        break;
      default:
        throw new JsonLdError(
          'Unknown extension.',
          'jsonld.UnknownExtension', {extension: extension});
    }
  };

  // expose version
  var _module = {exports: {}, filename: __dirname};
  require('pkginfo')(_module, 'version');
  jsonld.version = _module.exports.version;
}

// end of jsonld API factory
return jsonld;
};

// external APIs:

// used to generate a new jsonld API instance
var factory = function() {
  return wrapper(function() {
    return factory();
  });
};

if(!_nodejs && (typeof define === 'function' && define.amd)) {
  // export AMD API
  define([], function() {
    // now that module is defined, wrap main jsonld API instance
    wrapper(factory);
    return factory;
  });
} else {
  // wrap the main jsonld API instance
  wrapper(factory);

  if(typeof require === 'function' &&
    typeof module !== 'undefined' && module.exports) {
    // export CommonJS/nodejs API
    module.exports = factory;
  }

  if(_browser) {
    // export simple browser API
    if(typeof jsonld === 'undefined') {
      jsonld = jsonldjs = factory;
    } else {
      jsonldjs = factory;
    }
  }
}

return factory;

})();

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},"/node_modules/jsonld/js")
},{"_process":23,"crypto":12,"es6-promise":6,"http":12,"jsonld-request":12,"pkginfo":12,"request":12,"util":12,"xmldom":12}],14:[function(require,module,exports){
// Replace local require by a lazy loader
var globalRequire = require;
require = function () {};

// Expose submodules
var exports = module.exports = {
  Lexer:        require('./lib/N3Lexer'),
  Parser:       require('./lib/N3Parser'),
  Writer:       require('./lib/N3Writer'),
  Store:        require('./lib/N3Store'),
  StreamParser: require('./lib/N3StreamParser'),
  StreamWriter: require('./lib/N3StreamWriter'),
  Util:         require('./lib/N3Util'),
};

// Load submodules on first access
Object.keys(exports).forEach(function (submodule) {
  Object.defineProperty(exports, submodule, {
    configurable: true,
    enumerable: true,
    get: function () {
      delete exports[submodule];
      return exports[submodule] = globalRequire('./lib/N3' + submodule);
    },
  });
});

},{"./lib/N3Lexer":15,"./lib/N3Parser":16,"./lib/N3Store":17,"./lib/N3StreamParser":18,"./lib/N3StreamWriter":19,"./lib/N3Util":20,"./lib/N3Writer":21}],15:[function(require,module,exports){
// **N3Lexer** tokenizes N3 documents.
var fromCharCode = String.fromCharCode;
var immediately = typeof setImmediate === 'function' ? setImmediate :
                  function setImmediate(func) { setTimeout(func, 0); };

// Regular expression and replacement string to escape N3 strings.
// Note how we catch invalid unicode sequences separately (they will trigger an error).
var escapeSequence = /\\u([a-fA-F0-9]{4})|\\U([a-fA-F0-9]{8})|\\[uU]|\\(.)/g;
var escapeReplacements = { '\\': '\\', "'": "'", '"': '"',
                           'n': '\n', 'r': '\r', 't': '\t', 'f': '\f', 'b': '\b',
                           '_': '_', '~': '~', '.': '.', '-': '-', '!': '!', '$': '$', '&': '&',
                           '(': '(', ')': ')', '*': '*', '+': '+', ',': ',', ';': ';', '=': '=',
                           '/': '/', '?': '?', '#': '#', '@': '@', '%': '%' };
var illegalIriChars = /[\x00-\x20<>\\"\{\}\|\^\`]/;

// ## Constructor
function N3Lexer(options) {
  if (!(this instanceof N3Lexer))
    return new N3Lexer(options);

  // In line mode (N-Triples or N-Quads), only simple features may be parsed
  if (options && options.lineMode) {
    // Don't tokenize special literals
    this._tripleQuotedString = this._number = this._boolean = /$0^/;
    // Swap the tokenize method for a restricted version
    var self = this;
    this._tokenize = this.tokenize;
    this.tokenize = function (input, callback) {
      this._tokenize(input, function (error, token) {
        if (!error && /^(?:IRI|prefixed|literal|langcode|type|\.|eof)$/.test(token.type))
          callback && callback(error, token);
        else
          callback && callback(error || self._syntaxError(token.type, callback = null));
      });
    };
  }
}

N3Lexer.prototype = {
  // ## Regular expressions
  // It's slightly faster to have these as properties than as in-scope variables.

  _iri: /^<((?:[^>\\]|\\[uU])+)>/, // IRI with escape sequences; needs sanity check after unescaping
  _unescapedIri: /^<([^\x00-\x20<>\\"\{\}\|\^\`]*)>/, // IRI without escape sequences; no unescaping
  _unescapedString: /^"[^"\\]+"(?=[^"\\])/, // non-empty string without escape sequences
  _singleQuotedString: /^"[^"\\]*(?:\\.[^"\\]*)*"(?=[^"\\])|^'[^'\\]*(?:\\.[^'\\]*)*'(?=[^'\\])/,
  _tripleQuotedString: /^""("[^"\\]*(?:(?:\\.|"(?!""))[^"\\]*)*")""|^''('[^'\\]*(?:(?:\\.|'(?!''))[^'\\]*)*')''/,
  _langcode: /^@([a-z]+(?:-[a-z0-9]+)*)(?=[^a-z0-9\-])/i,
  _prefix: /^((?:[A-Za-z\xc0-\xd6\xd8-\xf6\xf8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff])(?:\.?[\-0-9A-Z_a-z\xb7\xc0-\xd6\xd8-\xf6\xf8-\u037d\u037f-\u1fff\u200c\u200d\u203f\u2040\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff])*)?:(?=[#\s<])/,
  _prefixed: /^((?:[A-Za-z\xc0-\xd6\xd8-\xf6\xf8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff])(?:\.?[\-0-9A-Z_a-z\xb7\xc0-\xd6\xd8-\xf6\xf8-\u037d\u037f-\u1fff\u200c\u200d\u203f\u2040\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff])*)?:((?:(?:[0-:A-Z_a-z\xc0-\xd6\xd8-\xf6\xf8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff]|%[0-9a-fA-F]{2}|\\[!#-\/;=?\-@_~])(?:(?:[\.\-0-:A-Z_a-z\xb7\xc0-\xd6\xd8-\xf6\xf8-\u037d\u037f-\u1fff\u200c\u200d\u203f\u2040\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff]|%[0-9a-fA-F]{2}|\\[!#-\/;=?\-@_~])*(?:[\-0-:A-Z_a-z\xb7\xc0-\xd6\xd8-\xf6\xf8-\u037d\u037f-\u1fff\u200c\u200d\u203f\u2040\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff]|%[0-9a-fA-F]{2}|\\[!#-\/;=?\-@_~]))?)?)(?=\.?[,;\s#()\[\]\{\}"'<])/,
  _blank: /^_:((?:[0-9A-Z_a-z\xc0-\xd6\xd8-\xf6\xf8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff])(?:\.?[\-0-9A-Z_a-z\xb7\xc0-\xd6\xd8-\xf6\xf8-\u037d\u037f-\u1fff\u200c\u200d\u203f\u2040\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff])*)(?=\.?[,;:\s#()\[\]\{\}"'<])/,
  _number: /^[\-+]?(?:\d+\.?\d*([eE](?:[\-\+])?\d+)|\d*\.?\d+)(?=[.,;:\s#()\[\]\{\}"'<])/,
  _boolean: /^(?:true|false)(?=[.,;:\s#()\[\]\{\}"'<])/,
  _keyword: /^@[a-z]+(?=[\s#<:])/,
  _sparqlKeyword: /^(?:PREFIX|BASE|GRAPH)(?=[\s#<:])/i,
  _shortPredicates: /^a(?=\s+|<)/,
  _newline: /^[ \t]*(?:#[^\n\r]*)?(?:\r\n|\n|\r)[ \t]*/,
  _whitespace: /^[ \t]+/,
  _endOfFile: /^(?:#[^\n\r]*)?$/,

  // ## Private methods

  // ### `_tokenizeToEnd` tokenizes as for as possible, emitting tokens through the callback.
  _tokenizeToEnd: function (callback, inputFinished) {
    // Continue parsing as far as possible; the loop will return eventually.
    var input = this._input;
    while (true) {
      // Count and skip whitespace lines.
      var whiteSpaceMatch;
      while (whiteSpaceMatch = this._newline.exec(input))
        input = input.substr(whiteSpaceMatch[0].length, input.length), this._line++;
      // Skip whitespace on current line.
      if (whiteSpaceMatch = this._whitespace.exec(input))
        input = input.substr(whiteSpaceMatch[0].length, input.length);

      // Stop for now if we're at the end.
      if (this._endOfFile.test(input)) {
        // If the input is finished, emit EOF.
        if (inputFinished)
          callback(input = null, { line: this._line, type: 'eof', value: '', prefix: '' });
        return this._input = input;
      }

      // Look for specific token types based on the first character.
      var line = this._line, type = '', value = '', prefix = '',
          firstChar = input[0], match = null, matchLength = 0, unescaped, inconclusive = false;
      switch (firstChar) {
      case '^':
        // Try to match a type.
        if (input.length === 1) break;
        else if (input[1] !== '^') return reportSyntaxError(this);
        this._prevTokenType = '^';
        // Move to type IRI or prefixed name.
        input = input.substr(2);
        if (input[0] !== '<') {
          inconclusive = true;
          break;
        }
        // Fall through in case the type is an IRI.

      case '<':
        // Try to find a full IRI without escape sequences.
        if (match = this._unescapedIri.exec(input))
          type = 'IRI', value = match[1];
        // Try to find a full IRI with escape sequences.
        else if (match = this._iri.exec(input)) {
          unescaped = this._unescape(match[1]);
          if (unescaped === null || illegalIriChars.test(unescaped))
            return reportSyntaxError(this);
          type = 'IRI', value = unescaped;
        }
        break;

      case '_':
        // Try to find a blank node. Since it can contain (but not end with) a dot,
        // we always need a non-dot character before deciding it is a prefixed name.
        // Therefore, try inserting a space if we're at the end of the input.
        if ((match = this._blank.exec(input)) ||
            inputFinished && (match = this._blank.exec(input + ' ')))
          type = 'prefixed', prefix = '_', value = match[1];
        break;

      case '"':
      case "'":
        // Try to find a non-empty double-quoted literal without escape sequences.
        if (match = this._unescapedString.exec(input))
          type = 'literal', value = match[0];
        // Try to find any other literal wrapped in a pair of single or double quotes.
        else if (match = this._singleQuotedString.exec(input)) {
          unescaped = this._unescape(match[0]);
          if (unescaped === null)
            return reportSyntaxError(this);
          type = 'literal', value = unescaped.replace(/^'|'$/g, '"');
        }
        // Try to find a literal wrapped in three pairs of single or double quotes.
        else if (match = this._tripleQuotedString.exec(input)) {
          unescaped = match[1] || match[2];
          // Count the newlines and advance line counter.
          this._line += unescaped.split(/\r\n|\r|\n/).length - 1;
          unescaped = this._unescape(unescaped);
          if (unescaped === null)
            return reportSyntaxError(this);
          type = 'literal', value = unescaped.replace(/^'|'$/g, '"');
        }
        break;

      case '@':
        // Try to find a language code.
        if (this._prevTokenType === 'literal' && (match = this._langcode.exec(input)))
          type = 'langcode', value = match[1];
        // Try to find a keyword.
        else if (match = this._keyword.exec(input))
          type = match[0];
        break;

      case '.':
        // Try to find a dot as punctuation.
        if (input.length === 1 ? inputFinished : (input[1] < '0' || input[1] > '9')) {
          type = '.';
          matchLength = 1;
          break;
        }
        // Fall through to numerical case (could be a decimal dot).

      case '0':
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
      case '+':
      case '-':
        // Try to find a number.
        if (match = this._number.exec(input)) {
          type = 'literal';
          value = '"' + match[0] + '"^^http://www.w3.org/2001/XMLSchema#' +
                  (match[1] ? 'double' : (/^[+\-]?\d+$/.test(match[0]) ? 'integer' : 'decimal'));
        }
        break;

      case 'B':
      case 'b':
      case 'p':
      case 'P':
      case 'G':
      case 'g':
        // Try to find a SPARQL-style keyword.
        if (match = this._sparqlKeyword.exec(input))
          type = match[0].toUpperCase();
        else
          inconclusive = true;
        break;

      case 'f':
      case 't':
        // Try to match a boolean.
        if (match = this._boolean.exec(input))
          type = 'literal', value = '"' + match[0] + '"^^http://www.w3.org/2001/XMLSchema#boolean';
        else
          inconclusive = true;
        break;

      case 'a':
        // Try to find an abbreviated predicate.
        if (match = this._shortPredicates.exec(input))
          type = 'abbreviation', value = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
        else
          inconclusive = true;
        break;

      case ',':
      case ';':
      case '[':
      case ']':
      case '(':
      case ')':
      case '{':
      case '}':
        // The next token is punctuation
        matchLength = 1;
        type = firstChar;
        break;

      default:
        inconclusive = true;
      }

      // Some first characters do not allow an immediate decision, so inspect more.
      if (inconclusive) {
        // Try to find a prefix.
        if ((this._prevTokenType === '@prefix' || this._prevTokenType === 'PREFIX') &&
            (match = this._prefix.exec(input)))
          type = 'prefix', value = match[1] || '';
        // Try to find a prefixed name. Since it can contain (but not end with) a dot,
        // we always need a non-dot character before deciding it is a prefixed name.
        // Therefore, try inserting a space if we're at the end of the input.
        else if ((match = this._prefixed.exec(input)) ||
                 inputFinished && (match = this._prefixed.exec(input + ' ')))
          type = 'prefixed', prefix = match[1] || '', value = this._unescape(match[2]);
      }

      // A type token is special: it can only be emitted after an IRI or prefixed name is read.
      if (this._prevTokenType === '^')
        type = (type === 'IRI' || type === 'prefixed') ? 'type' : '';

      // What if nothing of the above was found?
      if (!type) {
        // We could be in streaming mode, and then we just wait for more input to arrive.
        // Otherwise, a syntax error has occurred in the input.
        // One exception: error on an unaccounted linebreak (= not inside a triple-quoted literal).
        if (inputFinished || (!/^'''|^"""/.test(input) && /\n|\r/.test(input)))
          return reportSyntaxError(this);
        else
          return this._input = input;
      }

      // Emit the parsed token.
      callback(null, { line: line, type: type, value: value, prefix: prefix });
      this._prevTokenType = type;

      // Advance to next part to tokenize.
      input = input.substr(matchLength || match[0].length, input.length);
    }

    // Signals the syntax error through the callback
    function reportSyntaxError(self) { callback(self._syntaxError(/^\S*/.exec(input)[0])); }
  },

  // ### `_unescape` replaces N3 escape codes by their corresponding characters.
  _unescape: function (item) {
    try {
      return item.replace(escapeSequence, function (sequence, unicode4, unicode8, escapedChar) {
        var charCode;
        if (unicode4) {
          charCode = parseInt(unicode4, 16);
          if (isNaN(charCode)) throw new Error(); // can never happen (regex), but helps performance
          return fromCharCode(charCode);
        }
        else if (unicode8) {
          charCode = parseInt(unicode8, 16);
          if (isNaN(charCode)) throw new Error(); // can never happen (regex), but helps performance
          if (charCode <= 0xFFFF) return fromCharCode(charCode);
          return fromCharCode(0xD800 + ((charCode -= 0x10000) / 0x400), 0xDC00 + (charCode & 0x3FF));
        }
        else {
          var replacement = escapeReplacements[escapedChar];
          if (!replacement)
            throw new Error();
          return replacement;
        }
      });
    }
    catch (error) { return null; }
  },

  // ### `_syntaxError` creates a syntax error for the given issue
  _syntaxError: function (issue) {
    this._input = null;
    return new Error('Syntax error: unexpected "' + issue + '" on line ' + this._line + '.');
  },


  // ## Public methods

  // ### `tokenize` starts the transformation of an N3 document into an array of tokens.
  // The input can be a string or a stream.
  tokenize: function (input, callback) {
    var self = this;
    this._line = 1;

    // If the input is a string, continuously emit tokens through the callback until the end.
    if (typeof input === 'string') {
      this._input = input;
      immediately(function () { self._tokenizeToEnd(callback, true); });
    }
    // Otherwise, the input will be streamed.
    else {
      this._input = '';

      // If no input was given, it will be streamed through `addChunk` and ended with `end`
      if (!input || typeof input === 'function') {
        this.addChunk = addChunk;
        this.end = end;
        if (!callback)
          callback = input;
      }
      // Otherwise, the input itself must be a stream
      else {
        if (typeof input.setEncoding === 'function')
          input.setEncoding('utf8');
        input.on('data', addChunk);
        input.on('end', end);
      }
    }

    // Adds the data chunk to the buffer and parses as far as possible
    function addChunk(data) {
      if (self._input !== null) {
        self._input += data;
        self._tokenizeToEnd(callback, false);
      }
    }

    // Parses until the end
    function end() {
      if (self._input !== null)
        self._tokenizeToEnd(callback, true);
    }
  },
};

// ## Exports

// Export the `N3Lexer` class as a whole.
module.exports = N3Lexer;

},{}],16:[function(require,module,exports){
// **N3Parser** parses N3 documents.
var N3Lexer = require('./N3Lexer');

var RDF_PREFIX = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    RDF_NIL    = RDF_PREFIX + 'nil',
    RDF_FIRST  = RDF_PREFIX + 'first',
    RDF_REST   = RDF_PREFIX + 'rest';

var absoluteIRI = /^[a-z][a-z0-9+.-]*:/i,
    schemeAuthority = /^(?:([a-z][a-z0-9+.-]*:))?(?:\/\/[^\/]*)?/i,
    dotSegments = /(?:^|\/)\.\.?(?:$|[\/#?])/;

// The next ID for new blank nodes
var blankNodePrefix = 0, blankNodeCount = 0;

// ## Constructor
function N3Parser(options) {
  if (!(this instanceof N3Parser))
    return new N3Parser(options);
  this._tripleStack = [];
  this._graph = null;

  // Set the document IRI.
  options = options || {};
  this._setBase(options.documentIRI);

  // Set supported features depending on the format.
  var format = (typeof options.format === 'string') && options.format.match(/\w*$/)[0].toLowerCase(),
      isTurtle = format === 'turtle', isTriG = format === 'trig',
      isNTriples = /triple/.test(format), isNQuads = /quad/.test(format),
      isLineMode = isNTriples || isNQuads;
  if (!(this._supportsNamedGraphs = !isTurtle))
    this._readPredicateOrNamedGraph = this._readPredicate;
  this._supportsQuads = !(isTurtle || isTriG || isNTriples);
  // Disable relative IRIs in N-Triples or N-Quads mode
  if (isLineMode) {
    this._base = '';
    this._resolveIRI = function (token) {
      this._error('Disallowed relative IRI', token);
      return this._callback = noop, this._subject = null;
    };
  }
  this._blankNodePrefix = typeof options.blankNodePrefix !== 'string' ? '' :
                            '_:' + options.blankNodePrefix.replace(/^_:/, '');
  this._lexer = options.lexer || new N3Lexer({ lineMode: isLineMode });
}

// ## Private class methods

// ### `_resetBlankNodeIds` restarts blank node identification.
N3Parser._resetBlankNodeIds = function () {
  blankNodePrefix = blankNodeCount = 0;
};

N3Parser.prototype = {
  // ## Private methods

  // ### `_setBase` sets the base IRI to resolve relative IRIs.
  _setBase: function (baseIRI) {
    if (!baseIRI)
      baseIRI = null;
    else if (baseIRI.indexOf('#') >= 0)
      throw new Error('Invalid base IRI ' + baseIRI);
    // Set base IRI and its components
    if (this._base = baseIRI) {
      this._basePath   = baseIRI.replace(/[^\/?]*(?:\?.*)?$/, '');
      baseIRI = baseIRI.match(schemeAuthority);
      this._baseRoot   = baseIRI[0];
      this._baseScheme = baseIRI[1];
    }
  },

  // ### `_readInTopContext` reads a token when in the top context.
  _readInTopContext: function (token) {
    switch (token.type) {
    // If an EOF token arrives in the top context, signal that we're done.
    case 'eof':
      if (this._graph !== null)
        return this._error('Unclosed graph', token);
      delete this._prefixes._;
      return this._callback(null, null, this._prefixes);
    // It could be a prefix declaration.
    case '@prefix':
      this._sparqlStyle = false;
      return this._readPrefix;
    case 'PREFIX':
      this._sparqlStyle = true;
      return this._readPrefix;
    // It could be a base declaration.
    case '@base':
      this._sparqlStyle = false;
      return this._readBaseIRI;
    case 'BASE':
      this._sparqlStyle = true;
      return this._readBaseIRI;
    // It could be a graph.
    case '{':
      if (this._supportsNamedGraphs) {
        this._graph = '';
        this._subject = null;
        return this._readSubject;
      }
    case 'GRAPH':
      if (this._supportsNamedGraphs)
        return this._readNamedGraphLabel;
    // Otherwise, the next token must be a subject.
    default:
      return this._readSubject(token);
    }
  },

  // ### `_readSubject` reads a triple's subject.
  _readSubject: function (token) {
    this._predicate = null;
    switch (token.type) {
    case 'IRI':
      if (this._base === null || absoluteIRI.test(token.value))
        this._subject = token.value;
      else
        this._subject = this._resolveIRI(token);
      break;
    case 'prefixed':
      var prefix = this._prefixes[token.prefix];
      if (prefix === undefined)
        return this._error('Undefined prefix "' + token.prefix + ':"', token);
      this._subject = prefix + token.value;
      break;
    case '[':
      // Start a new triple with a new blank node as subject.
      this._subject = '_:b' + blankNodeCount++;
      this._tripleStack.push({ subject: this._subject, predicate: null, object: null, type: 'blank' });
      return this._readBlankNodeHead;
    case '(':
      // Start a new list
      this._tripleStack.push({ subject: RDF_NIL, predicate: null, object: null, type: 'list' });
      this._subject = null;
      return this._readListItem;
    case '}':
      return this._readPunctuation(token);
    default:
      return this._error('Expected subject but got ' + token.type, token);
    }
    // The next token must be a predicate,
    // or, if the subject was actually a graph IRI, a named graph.
    return this._readPredicateOrNamedGraph;
  },

  // ### `_readPredicate` reads a triple's predicate.
  _readPredicate: function (token) {
    var type = token.type;
    switch (type) {
    case 'IRI':
    case 'abbreviation':
      if (this._base === null || absoluteIRI.test(token.value))
        this._predicate = token.value;
      else
        this._predicate = this._resolveIRI(token);
      break;
    case 'prefixed':
      if (token.prefix === '_')
        return this._error('Disallowed blank node as predicate', token);
      var prefix = this._prefixes[token.prefix];
      if (prefix === undefined)
        return this._error('Undefined prefix "' + token.prefix + ':"', token);
      this._predicate = prefix + token.value;
      break;
    case '.':
    case ']':
    case '}':
      // Expected predicate didn't come, must have been trailing semicolon.
      if (this._predicate === null)
        return this._error('Unexpected ' + type, token);
      this._subject = null;
      return type === ']' ? this._readBlankNodeTail(token) : this._readPunctuation(token);
    case ';':
      // Extra semicolons can be safely ignored
      return this._readPredicate;
    default:
      return this._error('Expected predicate to follow "' + this._subject + '"', token);
    }
    // The next token must be an object.
    return this._readObject;
  },

  // ### `_readObject` reads a triple's object.
  _readObject: function (token) {
    switch (token.type) {
    case 'IRI':
      if (this._base === null || absoluteIRI.test(token.value))
        this._object = token.value;
      else
        this._object = this._resolveIRI(token);
      break;
    case 'prefixed':
      var prefix = this._prefixes[token.prefix];
      if (prefix === undefined)
        return this._error('Undefined prefix "' + token.prefix + ':"', token);
      this._object = prefix + token.value;
      break;
    case 'literal':
      this._object = token.value;
      return this._readDataTypeOrLang;
    case '[':
      // Start a new triple with a new blank node as subject.
      var blank = '_:b' + blankNodeCount++;
      this._tripleStack.push({ subject: this._subject, predicate: this._predicate, object: blank, type: 'blank' });
      this._subject = blank;
      return this._readBlankNodeHead;
    case '(':
      // Start a new list
      this._tripleStack.push({ subject: this._subject, predicate: this._predicate, object: RDF_NIL, type: 'list' });
      this._subject = null;
      return this._readListItem;
    default:
      return this._error('Expected object to follow "' + this._predicate + '"', token);
    }
    return this._getTripleEndReader();
  },

  // ### `_readPredicateOrNamedGraph` reads a triple's predicate, or a named graph.
  _readPredicateOrNamedGraph: function (token) {
    return token.type === '{' ? this._readGraph(token) : this._readPredicate(token);
  },

  // ### `_readGraph` reads a graph.
  _readGraph: function (token) {
    if (token.type !== '{')
      return this._error('Expected graph but got ' + token.type, token);
    // The "subject" we read is actually the GRAPH's label
    this._graph = this._subject, this._subject = null;
    return this._readSubject;
  },

  // ### `_readBlankNodeHead` reads the head of a blank node.
  _readBlankNodeHead: function (token) {
    if (token.type === ']') {
      this._subject = null;
      return this._readBlankNodeTail(token);
    }
    else {
      this._predicate = null;
      return this._readPredicate(token);
    }
  },

  // ### `_readBlankNodeTail` reads the end of a blank node.
  _readBlankNodeTail: function (token) {
    if (token.type !== ']')
      return this._readBlankNodePunctuation(token);

    // Store blank node triple.
    if (this._subject !== null)
      this._callback(null, { subject:   this._subject,
                             predicate: this._predicate,
                             object:    this._object,
                             graph:     this._graph || '' });

    // Restore parent triple that contains the blank node.
    var triple = this._tripleStack.pop();
    this._subject = triple.subject;
    // Was the blank node the object?
    if (triple.object !== null) {
      // Restore predicate and object as well, and continue by reading punctuation.
      this._predicate = triple.predicate;
      this._object = triple.object;
      return this._getTripleEndReader();
    }
    // The blank node was the subject, so continue reading the predicate.
    // If the blank node didn't contain any predicates, it could also be the label of a named graph.
    return this._predicate !== null ? this._readPredicate : this._readPredicateOrNamedGraph;
  },

  // ### `_readDataTypeOrLang` reads an _optional_ data type or language.
  _readDataTypeOrLang: function (token) {
    switch (token.type) {
    case 'type':
      var value;
      if (token.prefix === '') {
        if (this._base === null || absoluteIRI.test(token.value))
          value = token.value;
        else
          value = this._resolveIRI(token);
      }
      else {
        var prefix = this._prefixes[token.prefix];
        if (prefix === undefined)
          return this._error('Undefined prefix "' + token.prefix + ':"', token);
        value = prefix + token.value;
      }
      this._object += '^^' + value;
      return this._getTripleEndReader();
    case 'langcode':
      this._object += '@' + token.value.toLowerCase();
      return this._getTripleEndReader();
    default:
      return this._getTripleEndReader().call(this, token);
    }
  },

  // ### `_readListItem` reads items from a list.
  _readListItem: function (token) {
    var item = null,                  // The actual list item.
        itemHead = null,              // The head of the rdf:first predicate.
        prevItemHead = this._subject, // The head of the previous rdf:first predicate.
        stack = this._tripleStack,    // The stack of triples part of recursion (lists, blanks, etc.).
        parentTriple = stack[stack.length - 1], // The triple containing the current list.
        next = this._readListItem;    // The next function to execute.

    switch (token.type) {
    case 'IRI':
      if (this._base === null || absoluteIRI.test(token.value))
        item = token.value;
      else
        item = this._resolveIRI(token);
      break;
    case 'prefixed':
      var prefix = this._prefixes[token.prefix];
      if (prefix === undefined)
        return this._error('Undefined prefix "' + token.prefix + ':"', token);
      item = prefix + token.value;
      break;
    case 'literal':
      item = token.value;
      next = this._readDataTypeOrLang;
      break;
    case '[':
      // Stack the current list triple and start a new triple with a blank node as subject.
      itemHead = '_:b' + blankNodeCount++;
      item     = '_:b' + blankNodeCount++;
      stack.push({ subject: itemHead, predicate: RDF_FIRST, object: item, type: 'blank' });
      this._subject = item;
      next = this._readBlankNodeHead;
      break;
    case '(':
      // Stack the current list triple and start a new list
      itemHead = '_:b' + blankNodeCount++;
      stack.push({ subject: itemHead, predicate: RDF_FIRST, object: RDF_NIL, type: 'list' });
      this._subject = null;
      next = this._readListItem;
      break;
    case ')':
      // Restore the parent triple.
      stack.pop();
      // If this list is contained within a parent list, return the membership triple here.
      // This will be `<parent list element> rdf:first <this list>.`.
      if (stack.length !== 0 && stack[stack.length - 1].type === 'list')
        this._callback(null, { subject:   parentTriple.subject,
                               predicate: parentTriple.predicate,
                               object:    parentTriple.object,
                               graph:     this._graph || '' });
      // Restore the parent triple's subject.
      this._subject = parentTriple.subject;
      // Was this list in the parent triple's subject?
      if (parentTriple.predicate === null) {
        // The next token is the predicate.
        next = this._readPredicate;
        // Skip writing the list tail if this was an empty list.
        if (parentTriple.subject === RDF_NIL)
          return next;
      }
      // The list was in the parent triple's object.
      else {
        // Restore the parent triple's predicate and object as well.
        this._predicate = parentTriple.predicate;
        this._object = parentTriple.object;
        next = this._getTripleEndReader();
        // Skip writing the list tail if this was an empty list.
        if (parentTriple.object === RDF_NIL)
          return next;
      }
      // Close the list by making the item head nil.
      itemHead = RDF_NIL;
      break;
    default:
      return this._error('Expected list item instead of "' + token.type + '"', token);
    }

     // Create a new blank node if no item head was assigned yet.
    if (itemHead === null)
      this._subject = itemHead = '_:b' + blankNodeCount++;

    // Is this the first element of the list?
    if (prevItemHead === null) {
      // This list is either the object or the subject.
      if (parentTriple.object === RDF_NIL)
        parentTriple.object = itemHead;
      else
        parentTriple.subject = itemHead;
    }
    else {
      // The rest of the list is in the current head.
      this._callback(null, { subject:   prevItemHead,
                             predicate: RDF_REST,
                             object:    itemHead,
                             graph:     this._graph || '' });
    }
    // Add the item's value.
    if (item !== null)
      this._callback(null, { subject:   itemHead,
                             predicate: RDF_FIRST,
                             object:    item,
                             graph:     this._graph || '' });
    return next;
  },

  // ### `_readPunctuation` reads punctuation between triples or triple parts.
  _readPunctuation: function (token) {
    var next, subject = this._subject, graph = this._graph;
    switch (token.type) {
    // A closing brace ends a graph
    case '}':
      if (this._graph === null)
        return this._error('Unexpected graph closing', token);
      this._graph = null;
    // A dot just ends the statement, without sharing anything with the next.
    case '.':
      this._subject = null;
      next = this._readInTopContext;
      break;
    // Semicolon means the subject is shared; predicate and object are different.
    case ';':
      next = this._readPredicate;
      break;
    // Comma means both the subject and predicate are shared; the object is different.
    case ',':
      next = this._readObject;
      break;
    // An IRI means this is a quad (only allowed if not already inside a graph).
    case 'IRI':
      if (this._supportsQuads && this._graph === null) {
        if (this._base === null || absoluteIRI.test(token.value))
          graph = token.value;
        else
          graph = this._resolveIRI(token);
        subject = this._subject;
        next = this._readQuadPunctuation;
        break;
      }
    // An prefixed name means this is a quad (only allowed if not already inside a graph).
    case 'prefixed':
      if (this._supportsQuads && this._graph === null) {
        var prefix = this._prefixes[token.prefix];
        if (prefix === undefined)
          return this._error('Undefined prefix "' + token.prefix + ':"', token);
        graph = prefix + token.value;
        next = this._readQuadPunctuation;
        break;
      }
    default:
      return this._error('Expected punctuation to follow "' + this._object + '"', token);
    }
    // A triple has been completed now, so return it.
    if (subject !== null)
      this._callback(null, { subject:   subject,
                             predicate: this._predicate,
                             object:    this._object,
                             graph:     graph || '' });
    return next;
  },

    // ### `_readBlankNodePunctuation` reads punctuation in a blank node
  _readBlankNodePunctuation: function (token) {
    var next;
    switch (token.type) {
    // Semicolon means the subject is shared; predicate and object are different.
    case ';':
      next = this._readPredicate;
      break;
    // Comma means both the subject and predicate are shared; the object is different.
    case ',':
      next = this._readObject;
      break;
    default:
      return this._error('Expected punctuation to follow "' + this._object + '"', token);
    }
    // A triple has been completed now, so return it.
    this._callback(null, { subject:   this._subject,
                           predicate: this._predicate,
                           object:    this._object,
                           graph:     this._graph || '' });
    return next;
  },

  // ### `_readQuadPunctuation` reads punctuation after a quad.
  _readQuadPunctuation: function (token) {
    if (token.type !== '.')
      return this._error('Expected dot to follow quad', token);
    return this._readInTopContext;
  },

  // ### `_readPrefix` reads the prefix of a prefix declaration.
  _readPrefix: function (token) {
    if (token.type !== 'prefix')
      return this._error('Expected prefix to follow @prefix', token);
    this._prefix = token.value;
    return this._readPrefixIRI;
  },

  // ### `_readPrefixIRI` reads the IRI of a prefix declaration.
  _readPrefixIRI: function (token) {
    if (token.type !== 'IRI')
      return this._error('Expected IRI to follow prefix "' + this._prefix + ':"', token);
    var prefixIRI;
    if (this._base === null || absoluteIRI.test(token.value))
      prefixIRI = token.value;
    else
      prefixIRI = this._resolveIRI(token);
    this._prefixes[this._prefix] = prefixIRI;
    this._prefixCallback(this._prefix, prefixIRI);
    return this._readDeclarationPunctuation;
  },

  // ### `_readBaseIRI` reads the IRI of a base declaration.
  _readBaseIRI: function (token) {
    if (token.type !== 'IRI')
      return this._error('Expected IRI to follow base declaration', token);
    try {
      this._setBase(this._base === null ||
                    absoluteIRI.test(token.value) ? token.value : this._resolveIRI(token));
    }
    catch (error) { this._error(error.message, token); }
    return this._readDeclarationPunctuation;
  },

  // ### `_readNamedGraphLabel` reads the label of a named graph.
  _readNamedGraphLabel: function (token) {
    switch (token.type) {
    case 'IRI':
    case 'prefixed':
      return this._readSubject(token), this._readGraph;
    case '[':
      return this._readNamedGraphBlankLabel;
    default:
      return this._error('Invalid graph label', token);
    }
  },

  // ### `_readNamedGraphLabel` reads a blank node label of a named graph.
  _readNamedGraphBlankLabel: function (token) {
    if (token.type !== ']')
      return this._error('Invalid graph label', token);
    this._subject = '_:b' + blankNodeCount++;
    return this._readGraph;
  },

  // ### `_readDeclarationPunctuation` reads the punctuation of a declaration.
  _readDeclarationPunctuation: function (token) {
    // SPARQL-style declarations don't have punctuation.
    if (this._sparqlStyle)
      return this._readInTopContext(token);

    if (token.type !== '.')
      return this._error('Expected declaration to end with a dot', token);
    return this._readInTopContext;
  },

  // ### `_getTripleEndReader` gets the next reader function at the end of a triple.
  _getTripleEndReader: function () {
    var stack = this._tripleStack;
    if (stack.length === 0)
      return this._readPunctuation;

    switch (stack[stack.length - 1].type) {
    case 'blank':
      return this._readBlankNodeTail;
    case 'list':
      return this._readListItem;
    }
  },

  // ### `_error` emits an error message through the callback.
  _error: function (message, token) {
    this._callback(new Error(message + ' at line ' + token.line + '.'));
  },

  // ### `_resolveIRI` resolves a relative IRI token against the base path,
  // assuming that a base path has been set and that the IRI is indeed relative.
  _resolveIRI: function (token) {
    var iri = token.value;
    switch (iri[0]) {
    // An empty relative IRI indicates the base IRI
    case undefined: return this._base;
    // Resolve relative fragment IRIs against the base IRI
    case '#': return this._base + iri;
    // Resolve relative query string IRIs by replacing the query string
    case '?': return this._base.replace(/(?:\?.*)?$/, iri);
    // Resolve root-relative IRIs at the root of the base IRI
    case '/':
      // Resolve scheme-relative IRIs to the scheme
      return (iri[1] === '/' ? this._baseScheme : this._baseRoot) + this._removeDotSegments(iri);
    // Resolve all other IRIs at the base IRI's path
    default:
      return this._removeDotSegments(this._basePath + iri);
    }
  },

  // ### `_removeDotSegments` resolves './' and '../' path segments in an IRI as per RFC3986.
  _removeDotSegments: function (iri) {
    // Don't modify the IRI if it does not contain any dot segments
    if (!dotSegments.test(iri))
      return iri;

    // Start with an imaginary slash before the IRI in order to resolve trailing './' and '../'
    var result = '', length = iri.length, i = -1, pathStart = -1, segmentStart = 0, next = '/';

    while (i < length) {
      switch (next) {
      // The path starts with the first slash after the authority
      case ':':
        if (pathStart < 0) {
          // Skip two slashes before the authority
          if (iri[++i] === '/' && iri[++i] === '/')
            // Skip to slash after the authority
            while ((pathStart = i + 1) < length && iri[pathStart] !== '/')
              i = pathStart;
        }
        break;
      // Don't modify a query string or fragment
      case '?':
      case '#':
        i = length;
        break;
      // Handle '/.' or '/..' path segments
      case '/':
        if (iri[i + 1] === '.') {
          next = iri[++i + 1];
          switch (next) {
          // Remove a '/.' segment
          case '/':
            result += iri.substring(segmentStart, i - 1);
            segmentStart = i + 1;
            break;
          // Remove a trailing '/.' segment
          case undefined:
          case '?':
          case '#':
            return result + iri.substring(segmentStart, i) + iri.substr(i + 1);
          // Remove a '/..' segment
          case '.':
            next = iri[++i + 1];
            if (next === undefined || next === '/' || next === '?' || next === '#') {
              result += iri.substring(segmentStart, i - 2);
              // Try to remove the parent path from result
              if ((segmentStart = result.lastIndexOf('/')) >= pathStart)
                result = result.substr(0, segmentStart);
              // Remove a trailing '/..' segment
              if (next !== '/')
                return result + '/' + iri.substr(i + 1);
              segmentStart = i + 1;
            }
          }
        }
      }
      next = iri[++i];
    }
    return result + iri.substring(segmentStart);
  },

  // ## Public methods

  // ### `parse` parses the N3 input and emits each parsed triple through the callback.
  parse: function (input, tripleCallback, prefixCallback) {
    // The read callback is the next function to be executed when a token arrives.
    // We start reading in the top context.
    this._readCallback = this._readInTopContext;
    this._prefixes = Object.create(null);
    this._prefixes._ = this._blankNodePrefix || '_:b' + blankNodePrefix++ + '_';

    // If the input argument is not given, shift parameters
    if (typeof input === 'function')
      prefixCallback = tripleCallback, tripleCallback = input, input = null;

    // Set the triple and prefix callbacks.
    this._callback = tripleCallback || noop;
    this._prefixCallback = prefixCallback || noop;

    // Execute the read callback when a token arrives.
    var self = this;
    this._lexer.tokenize(input, function (error, token) {
      if (error !== null)
        self._callback(error), self._callback = noop;
      else if (self._readCallback !== undefined)
        self._readCallback = self._readCallback(token);
    });

    // If no input was given, it can be added with `addChunk` and ended with `end`
    if (!input) {
      this.addChunk = this._lexer.addChunk;
      this.end = this._lexer.end;
    }
  },
};

// The empty function
function noop() {}

// ## Exports

// Export the `N3Parser` class as a whole.
module.exports = N3Parser;

},{"./N3Lexer":15}],17:[function(require,module,exports){
// **N3Store** objects store N3 triples by graph in memory.

var expandPrefixedName = require('./N3Util').expandPrefixedName;

// ## Constructor
function N3Store(triples, options) {
  if (!(this instanceof N3Store))
    return new N3Store(triples, options);

  // The number of triples is initially zero.
  this._size = 0;
  // `_graphs` contains subject, predicate, and object indexes per graph.
  this._graphs = Object.create(null);
  // `_entities` maps entities such as `http://xmlns.com/foaf/0.1/name` to numbers.
  // This saves memory, since only the numbers have to be stored in `_graphs`.
  this._entities = Object.create(null);
  this._entities['><'] = 0; // Dummy entry, so the first actual key is non-zero
  this._entityCount = 0;
  // `_blankNodeIndex` is the index of the last created blank node that was automatically named
  this._blankNodeIndex = 0;

  // Shift parameters if `triples` is not given
  if (!options && triples && !triples[0])
    options = triples, triples = null;

  // Add triples and prefixes if passed
  this._prefixes = Object.create(null);
  if (options && options.prefixes)
    this.addPrefixes(options.prefixes);
  if (triples)
    this.addTriples(triples);
}

N3Store.prototype = {
  // ## Public properties

  // ### `size` returns the number of triples in the store.
  get size() {
    // Return the triple count if if was cached.
    var size = this._size;
    if (size !== null)
      return size;

    // Calculate the number of triples by counting to the deepest level.
    var graphs = this._graphs, subjects, subject;
    for (var graphKey in graphs)
      for (var subjectKey in (subjects = graphs[graphKey].subjects))
        for (var predicateKey in (subject = subjects[subjectKey]))
          size += Object.keys(subject[predicateKey]).length;
    return this._size = size;
  },

  // ## Private methods

  // ### `_addToIndex` adds a triple to a three-layered index.
  _addToIndex: function (index0, key0, key1, key2) {
    // Create layers as necessary.
    var index1 = index0[key0] || (index0[key0] = {});
    var index2 = index1[key1] || (index1[key1] = {});
    // Setting the key to _any_ value signalizes the presence of the triple.
    index2[key2] = null;
  },

  // ### `_removeFromIndex` removes a triple from a three-layered index.
  _removeFromIndex: function (index0, key0, key1, key2) {
    // Remove the triple from the index.
    var index1 = index0[key0], index2 = index1[key1], key;
    delete index2[key2];

    // Remove intermediary index layers if they are empty.
    for (key in index2) return;
    delete index1[key1];
    for (key in index1) return;
    delete index0[key0];
  },

  // ### `_findInIndex` finds a set of triples in a three-layered index.
  // The index base is `index0` and the keys at each level are `key0`, `key1`, and `key2`.
  // Any of these keys can be `null`, which is interpreted as a wildcard.
  // `name0`, `name1`, and `name2` are the names of the keys at each level,
  // used when reconstructing the resulting triple
  // (for instance: _subject_, _predicate_, and _object_).
  // Finally, `graph` will be the graph of the created triples.
  _findInIndex: function (index0, key0, key1, key2, name0, name1, name2, graph) {
    var results = [], entityKeys = Object.keys(this._entities), tmp, index1, index2;

    // If a key is specified, use only that part of index 0.
    if (key0) (tmp = index0, index0 = {})[key0] = tmp[key0];
    for (var value0 in index0) {
      var entity0 = entityKeys[value0];

      if (index1 = index0[value0]) {
        // If a key is specified, use only that part of index 1.
        if (key1) (tmp = index1, index1 = {})[key1] = tmp[key1];
        for (var value1 in index1) {
          var entity1 = entityKeys[value1];

          if (index2 = index1[value1]) {
            // If a key is specified, use only that part of index 2, if it exists.
            var values = key2 ? (key2 in index2 ? [key2] : []) : Object.keys(index2);
            // Create triples for all items found in index 2.
            for (var l = values.length - 1; l >= 0; l--) {
              var result = { subject: '', predicate: '', object: '', graph: graph };
              result[name0] = entity0;
              result[name1] = entity1;
              result[name2] = entityKeys[values[l]];
              results.push(result);
            }
          }
        }
      }
    }
    return results;
  },

  // ### `_countInIndex` counts matching triples in a three-layered index.
  // The index base is `index0` and the keys at each level are `key0`, `key1`, and `key2`.
  // Any of these keys can be `null`, which is interpreted as a wildcard.
  _countInIndex: function (index0, key0, key1, key2) {
    var count = 0, tmp, index1, index2;

    // If a key is specified, count only that part of index 0.
    if (key0) (tmp = index0, index0 = {})[key0] = tmp[key0];
    for (var value0 in index0) {
      if (index1 = index0[value0]) {
        // If a key is specified, count only that part of index 1.
        if (key1) (tmp = index1, index1 = {})[key1] = tmp[key1];
        for (var value1 in index1) {
          if (index2 = index1[value1]) {
            // If a key is specified, count the triple if it exists.
            if (key2) (key2 in index2) && count++;
            // Otherwise, count all triples.
            else count += Object.keys(index2).length;
          }
        }
      }
    }
    return count;
  },

  // ## Public methods

  // ### `addTriple` adds a new N3 triple to the store.
  addTriple: function (subject, predicate, object, graph) {
    // Shift arguments if a triple object is given instead of components
    if (!predicate)
      graph = subject.graph, object = subject.object,
        predicate = subject.predicate, subject = subject.subject;

    // Find the graph that will contain the triple.
    graph = graph || '';
    var graphItem = this._graphs[graph];
    // Create the graph if it doesn't exist yet.
    if (!graphItem) {
      graphItem = this._graphs[graph] = { subjects: {}, predicates: {}, objects: {} };
      // Freezing a graph helps subsequent `add` performance,
      // and properties will never be modified anyway.
      Object.freeze(graphItem);
    }

    // Since entities can often be long IRIs, we avoid storing them in every index.
    // Instead, we have a separate index that maps entities to numbers,
    // which are then used as keys in the other indexes.
    var entities = this._entities;
    subject   = entities[subject]   || (entities[subject]   = ++this._entityCount);
    predicate = entities[predicate] || (entities[predicate] = ++this._entityCount);
    object    = entities[object]    || (entities[object]    = ++this._entityCount);

    this._addToIndex(graphItem.subjects,   subject,   predicate, object);
    this._addToIndex(graphItem.predicates, predicate, object,    subject);
    this._addToIndex(graphItem.objects,    object,    subject,   predicate);

    // The cached triple count is now invalid.
    this._size = null;
  },

  // ### `addTriples` adds multiple N3 triples to the store.
  addTriples: function (triples) {
    for (var i = triples.length - 1; i >= 0; i--)
      this.addTriple(triples[i]);
  },

  // ### `addPrefix` adds support for querying with the given prefix
  addPrefix: function (prefix, iri) {
    this._prefixes[prefix] = iri;
  },

  // ### `addPrefixes` adds support for querying with the given prefixes
  addPrefixes: function (prefixes) {
    for (var prefix in prefixes)
      this.addPrefix(prefix, prefixes[prefix]);
  },

  // ### `removeTriple` removes an N3 triple from the store if it exists.
  removeTriple: function (subject, predicate, object, graph) {
    // Shift arguments if a triple object is given instead of components.
    if (!predicate)
      graph = subject.graph, object = subject.object,
        predicate = subject.predicate, subject = subject.subject;
    graph = graph || '';

    // Find internal identifiers for all components.
    var graphItem, entities = this._entities, graphs = this._graphs;
    if (!(subject     = entities[subject]))   return;
    if (!(predicate   = entities[predicate])) return;
    if (!(object      = entities[object]))    return;
    if (!(graphItem   = graphs[graph]))       return;

    // Verify that the triple exists.
    var subjects, predicates;
    if (!(subjects   = graphItem.subjects[subject])) return;
    if (!(predicates = subjects[predicate])) return;
    if (!(object in predicates)) return;

    // Remove it from all indexes.
    this._removeFromIndex(graphItem.subjects,   subject,   predicate, object);
    this._removeFromIndex(graphItem.predicates, predicate, object,    subject);
    this._removeFromIndex(graphItem.objects,    object,    subject,   predicate);
    if (this._size !== null) this._size--;

    // Remove the graph if it is empty.
    for (subject in graphItem.subjects) return;
    delete graphs[graph];
  },

  // ### `removeTriples` removes multiple N3 triples from the store.
  removeTriples: function (triples) {
    for (var i = triples.length - 1; i >= 0; i--)
      this.removeTriple(triples[i]);
  },

  // ### `find` finds a set of triples matching a pattern, expanding prefixes as necessary.
  // Setting `subject`, `predicate`, or `object` to `null` means an _anything_ wildcard.
  // Setting `graph` to `null` means the default graph.
  find: function (subject, predicate, object, graph) {
    var prefixes = this._prefixes;
    return this.findByIRI(
      expandPrefixedName(subject,   prefixes),
      expandPrefixedName(predicate, prefixes),
      expandPrefixedName(object,    prefixes),
      expandPrefixedName(graph,     prefixes)
    );
  },

  // ### `findByIRI` finds a set of triples matching a pattern.
  // Setting `subject`, `predicate`, or `object` to a falsy value means an _anything_ wildcard.
  // Setting `graph` to a falsy value means the default graph.
  findByIRI: function (subject, predicate, object, graph) {
    graph = graph || '';
    var graphItem = this._graphs[graph], entities = this._entities;

    // If the specified graph contain no triples, there are no results.
    if (!graphItem) return [];

    // Translate IRIs to internal index keys.
    // Optimization: if the entity doesn't exist, no triples with it exist.
    if (subject   && !(subject   = entities[subject]))   return [];
    if (predicate && !(predicate = entities[predicate])) return [];
    if (object    && !(object    = entities[object]))    return [];

    // Choose the optimal index, based on what fields are present
    if (subject) {
      if (object)
        // If subject and object are given, the object index will be the fastest.
        return this._findInIndex(graphItem.objects, object, subject, predicate,
                                 'object', 'subject', 'predicate', graph);
      else
        // If only subject and possibly predicate are given, the subject index will be the fastest.
        return this._findInIndex(graphItem.subjects, subject, predicate, null,
                                 'subject', 'predicate', 'object', graph);
    }
    else if (predicate)
      // If only predicate and possibly object are given, the predicate index will be the fastest.
      return this._findInIndex(graphItem.predicates, predicate, object, null,
                               'predicate', 'object', 'subject', graph);
    else if (object)
      // If only object is given, the object index will be the fastest.
      return this._findInIndex(graphItem.objects, object, null, null,
                               'object', 'subject', 'predicate', graph);
    else
      // If nothing is given, iterate subjects and predicates first
      return this._findInIndex(graphItem.subjects, null, null, null,
                               'subject', 'predicate', 'object', graph);
  },

  // ### `count` returns the number of triples matching a pattern, expanding prefixes as necessary.
  // Setting `subject`, `predicate`, or `object` to `null` means an _anything_ wildcard.
  // Setting `graph` to `null` means the default graph.
  count: function (subject, predicate, object, graph) {
    var prefixes = this._prefixes;
    return this.countByIRI(
      expandPrefixedName(subject,   prefixes),
      expandPrefixedName(predicate, prefixes),
      expandPrefixedName(object,    prefixes),
      expandPrefixedName(graph,     prefixes)
    );
  },

  // ### `countByIRI` returns the number of triples matching a pattern.
  // Setting `subject`, `predicate`, or `object` to `null` means an _anything_ wildcard.
  // Setting `graph` to `null` means the default graph.
  countByIRI: function (subject, predicate, object, graph) {
    graph = graph || '';
    var graphItem = this._graphs[graph], entities = this._entities;

    // If the specified graph contain no triples, there are no results.
    if (!graphItem) return 0;

    // Translate IRIs to internal index keys.
    // Optimization: if the entity doesn't exist, no triples with it exist.
    if (subject   && !(subject   = entities[subject]))   return 0;
    if (predicate && !(predicate = entities[predicate])) return 0;
    if (object    && !(object    = entities[object]))    return 0;

    // Choose the optimal index, based on what fields are present
    if (subject) {
      if (object)
        // If subject and object are given, the object index will be the fastest.
        return this._countInIndex(graphItem.objects, object, subject, predicate);
      else
        // If only subject and possibly predicate are given, the subject index will be the fastest.
        return this._countInIndex(graphItem.subjects, subject, predicate, object);
    }
    else if (predicate) {
      // If only predicate and possibly object are given, the predicate index will be the fastest.
      return this._countInIndex(graphItem.predicates, predicate, object, subject);
    }
    else {
      // If only object is possibly given, the object index will be the fastest.
      return this._countInIndex(graphItem.objects, object, subject, predicate);
    }
  },

  // ### `createBlankNode` creates a new blank node, returning its name.
  createBlankNode: function (suggestedName) {
    var name, index;
    // Generate a name based on the suggested name
    if (suggestedName) {
      name = suggestedName = '_:' + suggestedName, index = 1;
      while (this._entities[name])
        name = suggestedName + index++;
    }
    // Generate a generic blank node name
    else {
      do { name = '_:b' + this._blankNodeIndex++; }
      while (this._entities[name]);
    }
    // Add the blank node to the entities, avoiding the generation of duplicates
    this._entities[name] = ++this._entityCount;
    return name;
  },
};

// ## Exports

// Export the `N3Store` class as a whole.
module.exports = N3Store;

},{"./N3Util":20}],18:[function(require,module,exports){
// **N3StreamParser** parses an N3 stream into a triple stream
var Transform = require('stream').Transform,
    util = require('util'),
    N3Parser = require('./N3Parser.js');

// ## Constructor
function N3StreamParser(options) {
  if (!(this instanceof N3StreamParser))
    return new N3StreamParser(options);

  // Initialize Transform base class
  Transform.call(this, { decodeStrings: true });
  this._readableState.objectMode = true;

  // Set up parser
  var self = this, parser = new N3Parser(options);
  parser.parse(
    // Handle triples by pushing them down the pipeline
    function (error, triple) {
      triple && self.push(triple) ||
      error  && self.emit('error', error);
    },
    // Emit prefixes through the `prefix` event
    this.emit.bind(this, 'prefix'));

  // Implement Transform methods on top of parser
  this._transform = function (chunk, encoding, done) { parser.addChunk(chunk); done(); };
  this._flush = function (done) { parser.end(); done(); };
}
util.inherits(N3StreamParser, Transform);

// ## Exports
// Export the `N3StreamParser` class as a whole.
module.exports = N3StreamParser;

},{"./N3Parser.js":16,"stream":34,"util":38}],19:[function(require,module,exports){
// **N3StreamWriter** serializes a triple stream into an N3 stream
var Transform = require('stream').Transform,
    util = require('util'),
    N3Writer = require('./N3Writer.js');

// ## Constructor
function N3StreamWriter(options) {
  if (!(this instanceof N3StreamWriter))
    return new N3StreamWriter(options);

  // Initialize Transform base class
  Transform.call(this, { encoding: 'utf8' });
  this._writableState.objectMode = true;

  // Set up writer with a dummy stream object
  var self = this;
  var writer = new N3Writer({
    write: function (chunk, encoding, callback) { self.push(chunk); callback && callback(); },
    end: function (callback) { self.push(null); callback && callback(); },
  }, options);

  // Implement Transform methods on top of writer
  this._transform = function (triple, encoding, done) { writer.addTriple(triple, done); };
  this._flush = function (done) { writer.end(done); };
}
util.inherits(N3StreamWriter, Transform);

// ## Exports
// Export the `N3StreamWriter` class as a whole.
module.exports = N3StreamWriter;

},{"./N3Writer.js":21,"stream":34,"util":38}],20:[function(require,module,exports){
// **N3Util** provides N3 utility functions

var Xsd = 'http://www.w3.org/2001/XMLSchema#';
var XsdString  = Xsd + 'string';
var XsdInteger = Xsd + 'integer';
var XsdDecimal = Xsd + 'decimal';
var XsdBoolean = Xsd + 'boolean';
var RdfLangString = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#langString';

var N3Util = {
  // Tests whether the given entity (triple object) represents an IRI in the N3 library
  isIRI: function (entity) {
    if (!entity)
      return entity;
    var firstChar = entity[0];
    return firstChar !== '"' && firstChar !== '_';
  },

  // Tests whether the given entity (triple object) represents a literal in the N3 library
  isLiteral: function (entity) {
    return entity && entity[0] === '"';
  },

  // Tests whether the given entity (triple object) represents a blank node in the N3 library
  isBlank: function (entity) {
    return entity && entity.substr(0, 2) === '_:';
  },

  // Gets the string value of a literal in the N3 library
  getLiteralValue: function (literal) {
    var match = /^"([^]*)"/.exec(literal);
    if (!match)
      throw new Error(literal + ' is not a literal');
    return match[1];
  },

  // Gets the type of a literal in the N3 library
  getLiteralType: function (literal) {
    var match = /^"[^]*"(?:\^\^([^"]+)|(@)[^@"]+)?$/.exec(literal);
    if (!match)
      throw new Error(literal + ' is not a literal');
    return match[1] || (match[2] ? RdfLangString : XsdString);
  },

  // Gets the language of a literal in the N3 library
  getLiteralLanguage: function (literal) {
    var match = /^"[^]*"(?:@([^@"]+)|\^\^[^"]+)?$/.exec(literal);
    if (!match)
      throw new Error(literal + ' is not a literal');
    return match[1] ? match[1].toLowerCase() : '';
  },

  // Tests whether the given entity (triple object) represents a prefixed name
  isPrefixedName: function (entity) {
    return entity && /^[^:\/"']*:[^:\/"']+$/.test(entity);
  },

  // Expands the prefixed name to a full IRI (also when it occurs as a literal's type)
  expandPrefixedName: function (prefixedName, prefixes) {
    var match = /(?:^|"\^\^)([^:\/#"'\^_]*):[^\/]*$/.exec(prefixedName), prefix, base, index;
    if (match)
      prefix = match[1], base = prefixes[prefix], index = match.index;
    if (base === undefined)
      return prefixedName;

    // The match index is non-zero when expanding a literal's type.
    return index === 0 ? base + prefixedName.substr(prefix.length + 1)
                       : prefixedName.substr(0, index + 3) +
                         base + prefixedName.substr(index + prefix.length + 4);
  },

  // Creates an IRI in N3.js representation
  createIRI: function (iri) {
    return iri && iri[0] === '"' ? N3Util.getLiteralValue(iri) : iri;
  },

  // Creates a literal in N3.js representation
  createLiteral: function (value, modifier) {
    if (!modifier) {
      switch (typeof value) {
      case 'boolean':
        modifier = XsdBoolean;
        break;
      case 'number':
        if (isFinite(value)) {
          modifier = value % 1 === 0 ? XsdInteger : XsdDecimal;
          break;
        }
      default:
        return '"' + value + '"';
      }
    }
    return '"' + value +
           (/^[a-z]+(-[a-z0-9]+)*$/i.test(modifier) ? '"@'  + modifier.toLowerCase()
                                                    : '"^^' + modifier);
  },
};

// Add the N3Util functions to the given object or its prototype
function addN3Util(parent, toPrototype) {
  for (var name in N3Util)
    if (!toPrototype)
      parent[name] = N3Util[name];
    else
      parent.prototype[name] = applyToThis(N3Util[name]);

  return parent;
}

// Returns a function that applies `f` to the `this` object
function applyToThis(f) {
  return function (a) { return f(this, a); };
}

// Expose N3Util, attaching all functions to it
module.exports = addN3Util(addN3Util);

},{}],21:[function(require,module,exports){
// **N3Writer** writes N3 documents.

// Matches a literal as represented in memory by the N3 library
var N3LiteralMatcher = /^"([^]*)"(?:\^\^(.+)|@([\-a-z]+))?$/i;

// rdf:type predicate (for 'a' abbreviation)
var RDF_PREFIX = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    RDF_TYPE   = RDF_PREFIX + 'type';

// Characters in literals that require escaping
var escape    = /["\\\t\n\r\b\f\u0000-\u0019\ud800-\udbff]/,
    escapeAll = /["\\\t\n\r\b\f\u0000-\u0019]|[\ud800-\udbff][\udc00-\udfff]/g,
    escapeReplacements = { '\\': '\\\\', '"': '\\"', '\t': '\\t',
                           '\n': '\\n', '\r': '\\r', '\b': '\\b', '\f': '\\f' };

// ## Constructor
function N3Writer(outputStream, options) {
  if (!(this instanceof N3Writer))
    return new N3Writer(outputStream, options);

  // Shift arguments if the first argument is not a stream
  if (outputStream && typeof outputStream.write !== 'function')
    options = outputStream, outputStream = null;
  options = options || {};

  // If no output stream given, send the output as string through the end callback
  if (!outputStream) {
    var output = '';
    this._outputStream = {
      write: function (chunk, encoding, done) { output += chunk; done && done(); },
      end:   function (done) { done && done(null, output); },
    };
    this._endStream = true;
  }
  else {
    this._outputStream = outputStream;
    this._endStream = options.end === undefined ? true : !!options.end;
  }

  // Initialize writer, depending on the format
  this._subject = null;
  if (!(/triple|quad/i).test(options.format)) {
    this._graph = '';
    this._prefixIRIs = Object.create(null);
    options.prefixes && this.addPrefixes(options.prefixes);
  }
  else {
    this._writeTriple = this._writeTripleLine;
  }
}

N3Writer.prototype = {
  // ## Private methods

  // ### `_write` writes the argument to the output stream
  _write: function (string, callback) {
    this._outputStream.write(string, 'utf8', callback);
  },

    // ### `_writeTriple` writes the triple to the output stream
  _writeTriple: function (subject, predicate, object, graph, done) {
    try {
      // Write the graph's label if it has changed
      if (this._graph !== graph) {
        // Close the previous graph and start the new one
        this._write((this._subject === null ? '' : (this._graph ? '\n}\n' : '.\n')) +
                    (graph ? this._encodeIriOrBlankNode(graph) + ' {\n' : ''));
        this._subject = null;
        // Don't treat identical blank nodes as repeating graphs
        this._graph = graph[0] !== '[' ? graph : ']';
      }
      // Don't repeat the subject if it's the same
      if (this._subject === subject) {
        // Don't repeat the predicate if it's the same
        if (this._predicate === predicate)
          this._write(', ' + this._encodeObject(object), done);
        // Same subject, different predicate
        else
          this._write(';\n    ' +
                      this._encodePredicate(this._predicate = predicate) + ' ' +
                      this._encodeObject(object), done);
      }
      // Different subject; write the whole triple
      else
        this._write((this._subject === null ? '' : '.\n') +
                    this._encodeSubject(this._subject = subject) + ' ' +
                    this._encodePredicate(this._predicate = predicate) + ' ' +
                    this._encodeObject(object), done);
    }
    catch (error) { done && done(error); }
  },

  // ### `_writeTripleLine` writes the triple or quad to the output stream as a single line
  _writeTripleLine: function (subject, predicate, object, graph, done) {
    // Don't use prefixes
    delete this._prefixMatch;
    // Write the triple
    try {
      this._write(this._encodeIriOrBlankNode(subject) + ' ' +
                  this._encodeIriOrBlankNode(predicate) + ' ' +
                  this._encodeObject(object) +
                  (graph ? ' ' + this._encodeIriOrBlankNode(graph) + '.\n' : '.\n'), done);
    }
    catch (error) { done && done(error); }
  },

  // ### `_encodeIriOrBlankNode` represents an IRI or blank node
  _encodeIriOrBlankNode: function (entity) {
    // A blank node or list is represented as-is
    var firstChar = entity[0];
    if (firstChar === '[' || firstChar === '(' || firstChar === '_' && entity[1] === ':')
      return entity;
    // Escape special characters
    if (escape.test(entity))
      entity = entity.replace(escapeAll, characterReplacer);
    // Try to represent the IRI as prefixed name
    var prefixMatch = this._prefixRegex.exec(entity);
    return !prefixMatch ? '<' + entity + '>' :
           (!prefixMatch[1] ? entity : this._prefixIRIs[prefixMatch[1]] + prefixMatch[2]);
  },

  // ### `_encodeLiteral` represents a literal
  _encodeLiteral: function (value, type, language) {
    // Escape special characters
    if (escape.test(value))
      value = value.replace(escapeAll, characterReplacer);
    // Write the literal, possibly with type or language
    if (language)
      return '"' + value + '"@' + language;
    else if (type)
      return '"' + value + '"^^' + this._encodeIriOrBlankNode(type);
    else
      return '"' + value + '"';
  },

  // ### `_encodeSubject` represents a subject
  _encodeSubject: function (subject) {
    if (subject[0] === '"')
      throw new Error('A literal as subject is not allowed: ' + subject);
    // Don't treat identical blank nodes as repeating subjects
    if (subject[0] === '[')
      this._subject = ']';
    return this._encodeIriOrBlankNode(subject);
  },

  // ### `_encodePredicate` represents a predicate
  _encodePredicate: function (predicate) {
    if (predicate[0] === '"')
      throw new Error('A literal as predicate is not allowed: ' + predicate);
    return predicate === RDF_TYPE ? 'a' : this._encodeIriOrBlankNode(predicate);
  },

  // ### `_encodeObject` represents an object
  _encodeObject: function (object) {
    // Represent an IRI or blank node
    if (object[0] !== '"')
      return this._encodeIriOrBlankNode(object);
    // Represent a literal
    var match = N3LiteralMatcher.exec(object);
    if (!match) throw new Error('Invalid literal: ' + object);
    return this._encodeLiteral(match[1], match[2], match[3]);
  },

  // ### `_blockedWrite` replaces `_write` after the writer has been closed
  _blockedWrite: function () {
    throw new Error('Cannot write because the writer has been closed.');
  },

  // ### `addTriple` adds the triple to the output stream
  addTriple: function (subject, predicate, object, graph, done) {
    // The triple was given as a triple object, so shift parameters
    if (object === undefined)
      this._writeTriple(subject.subject, subject.predicate, subject.object,
                        subject.graph || '', predicate);
    // The optional `graph` parameter was not provided
    else if (typeof graph !== 'string')
      this._writeTriple(subject, predicate, object, '', graph);
    // The `graph` parameter was provided
    else
      this._writeTriple(subject, predicate, object, graph, done);
  },

  // ### `addTriples` adds the triples to the output stream
  addTriples: function (triples) {
    for (var i = 0; i < triples.length; i++)
      this.addTriple(triples[i]);
  },

  // ### `addPrefix` adds the prefix to the output stream
  addPrefix: function (prefix, iri, done) {
    var prefixes = {};
    prefixes[prefix] = iri;
    this.addPrefixes(prefixes, done);
  },

  // ### `addPrefixes` adds the prefixes to the output stream
  addPrefixes: function (prefixes, done) {
    // Add all useful prefixes
    var prefixIRIs = this._prefixIRIs, hasPrefixes = false;
    for (var prefix in prefixes) {
      // Verify whether the prefix can be used and does not exist yet
      var iri = prefixes[prefix];
      if (/[#\/]$/.test(iri) && prefixIRIs[iri] !== (prefix += ':')) {
        hasPrefixes = true;
        prefixIRIs[iri] = prefix;
        // Finish a possible pending triple
        if (this._subject !== null) {
          this._write(this._graph ? '\n}\n' : '.\n');
          this._subject = null, this._graph = '';
        }
        // Write prefix
        this._write('@prefix ' + prefix + ' <' + iri + '>.\n');
      }
    }
    // Recreate the prefix matcher
    if (hasPrefixes) {
      var IRIlist = '', prefixList = '';
      for (var prefixIRI in prefixIRIs) {
        IRIlist += IRIlist ? '|' + prefixIRI : prefixIRI;
        prefixList += (prefixList ? '|' : '') + prefixIRIs[prefixIRI];
      }
      IRIlist = IRIlist.replace(/[\]\/\(\)\*\+\?\.\\\$]/g, '\\$&');
      this._prefixRegex = new RegExp('^(?:' + prefixList + ')[^\/]*$|' +
                                     '^(' + IRIlist + ')([a-zA-Z][\\-_a-zA-Z0-9]*)$');
    }
    // End a prefix block with a newline
    this._write(hasPrefixes ? '\n' : '', done);
  },

  // ### `blank` creates a blank node with the given content
  blank: function (predicate, object) {
    var children = predicate, child, length;
    // Empty blank node
    if (predicate === undefined)
      children = [];
    // Blank node passed as blank("predicate", "object")
    else if (typeof predicate === 'string')
      children = [{ predicate: predicate, object: object }];
    // Blank node passed as blank({ predicate: predicate, object: object })
    else if (!('length' in predicate))
      children = [predicate];

    switch (length = children.length) {
    // Generate an empty blank node
    case 0:
      return '[]';
    // Generate a non-nested one-triple blank node
    case 1:
      child = children[0];
      if (child.object[0] !== '[')
        return '[ ' + this._encodePredicate(child.predicate) + ' ' +
                      this._encodeObject(child.object) + ' ]';
    // Generate a multi-triple or nested blank node
    default:
      var contents = '[';
      // Write all triples in order
      for (var i = 0; i < length; i++) {
        child = children[i];
        // Write only the object is the predicate is the same as the previous
        if (child.predicate === predicate)
          contents += ', ' + this._encodeObject(child.object);
        // Otherwise, write the predicate and the object
        else {
          contents += (i ? ';\n  ' : '\n  ') +
                      this._encodePredicate(child.predicate) + ' ' +
                      this._encodeObject(child.object);
          predicate = child.predicate;
        }
      }
      return contents + '\n]';
    }
  },

  // ### `list` creates a list node with the given content
  list: function (elements) {
    var length = elements && elements.length || 0, contents = new Array(length);
    for (var i = 0; i < length; i++)
      contents[i] = this._encodeObject(elements[i]);
    return '(' + contents.join(' ') + ')';
  },

  // ### `_prefixRegex` matches a prefixed name or IRI that begins with one of the added prefixes
  _prefixRegex: /$0^/,

  // ### `end` signals the end of the output stream
  end: function (done) {
    // Finish a possible pending triple
    if (this._subject !== null) {
      this._write(this._graph ? '\n}\n' : '.\n');
      this._subject = null;
    }
    // Disallow further writing
    this._write = this._blockedWrite;

    // Try to end the underlying stream, ensuring done is called exactly one time
    var singleDone = done && function (error, result) { singleDone = null, done(error, result); };
    if (this._endStream) {
      try { return this._outputStream.end(singleDone); }
      catch (error) { /* error closing stream */ }
    }
    singleDone && singleDone();
  },
};

// Replaces a character by its escaped version
function characterReplacer(character) {
  // Replace a single character by its escaped version
  var result = escapeReplacements[character];
  if (result === undefined) {
    // Replace a single character with its 4-bit unicode escape sequence
    if (character.length === 1) {
      result = character.charCodeAt(0).toString(16);
      result = '\\u0000'.substr(0, 6 - result.length) + result;
    }
    // Replace a surrogate pair with its 8-bit unicode escape sequence
    else {
      result = ((character.charCodeAt(0) - 0xD800) * 0x400 +
                 character.charCodeAt(1) + 0x2400).toString(16);
      result = '\\U00000000'.substr(0, 10 - result.length) + result;
    }
  }
  return result;
}

// ## Exports

// Export the `N3Writer` class as a whole.
module.exports = N3Writer;

},{}],22:[function(require,module,exports){
(function (process){
'use strict';

if (!process.version ||
    process.version.indexOf('v0.') === 0 ||
    process.version.indexOf('v1.') === 0 && process.version.indexOf('v1.8.') !== 0) {
  module.exports = nextTick;
} else {
  module.exports = process.nextTick;
}

function nextTick(fn) {
  var args = new Array(arguments.length - 1);
  var i = 0;
  while (i < args.length) {
    args[i++] = arguments[i];
  }
  process.nextTick(function afterTick() {
    fn.apply(null, args);
  });
}

}).call(this,require('_process'))
},{"_process":23}],23:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],24:[function(require,module,exports){
module.exports = require("./lib/_stream_duplex.js")

},{"./lib/_stream_duplex.js":25}],25:[function(require,module,exports){
// a duplex stream is just a stream that is both readable and writable.
// Since JS doesn't have multiple prototypal inheritance, this class
// prototypally inherits from Readable, and then parasitically from
// Writable.

'use strict';

/*<replacement>*/

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    keys.push(key);
  }return keys;
};
/*</replacement>*/

module.exports = Duplex;

/*<replacement>*/
var processNextTick = require('process-nextick-args');
/*</replacement>*/

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

var Readable = require('./_stream_readable');
var Writable = require('./_stream_writable');

util.inherits(Duplex, Readable);

var keys = objectKeys(Writable.prototype);
for (var v = 0; v < keys.length; v++) {
  var method = keys[v];
  if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
}

function Duplex(options) {
  if (!(this instanceof Duplex)) return new Duplex(options);

  Readable.call(this, options);
  Writable.call(this, options);

  if (options && options.readable === false) this.readable = false;

  if (options && options.writable === false) this.writable = false;

  this.allowHalfOpen = true;
  if (options && options.allowHalfOpen === false) this.allowHalfOpen = false;

  this.once('end', onend);
}

// the no-half-open enforcer
function onend() {
  // if we allow half-open state, or if the writable side ended,
  // then we're ok.
  if (this.allowHalfOpen || this._writableState.ended) return;

  // no more data can be written.
  // But allow more writes to happen in this tick.
  processNextTick(onEndNT, this);
}

function onEndNT(self) {
  self.end();
}

function forEach(xs, f) {
  for (var i = 0, l = xs.length; i < l; i++) {
    f(xs[i], i);
  }
}
},{"./_stream_readable":27,"./_stream_writable":29,"core-util-is":5,"inherits":9,"process-nextick-args":22}],26:[function(require,module,exports){
// a passthrough stream.
// basically just the most minimal sort of Transform stream.
// Every written chunk gets output as-is.

'use strict';

module.exports = PassThrough;

var Transform = require('./_stream_transform');

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

util.inherits(PassThrough, Transform);

function PassThrough(options) {
  if (!(this instanceof PassThrough)) return new PassThrough(options);

  Transform.call(this, options);
}

PassThrough.prototype._transform = function (chunk, encoding, cb) {
  cb(null, chunk);
};
},{"./_stream_transform":28,"core-util-is":5,"inherits":9}],27:[function(require,module,exports){
(function (process){
'use strict';

module.exports = Readable;

/*<replacement>*/
var processNextTick = require('process-nextick-args');
/*</replacement>*/

/*<replacement>*/
var isArray = require('isarray');
/*</replacement>*/

/*<replacement>*/
var Buffer = require('buffer').Buffer;
/*</replacement>*/

Readable.ReadableState = ReadableState;

var EE = require('events');

/*<replacement>*/
var EElistenerCount = function (emitter, type) {
  return emitter.listeners(type).length;
};
/*</replacement>*/

/*<replacement>*/
var Stream;
(function () {
  try {
    Stream = require('st' + 'ream');
  } catch (_) {} finally {
    if (!Stream) Stream = require('events').EventEmitter;
  }
})();
/*</replacement>*/

var Buffer = require('buffer').Buffer;

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

/*<replacement>*/
var debugUtil = require('util');
var debug = undefined;
if (debugUtil && debugUtil.debuglog) {
  debug = debugUtil.debuglog('stream');
} else {
  debug = function () {};
}
/*</replacement>*/

var StringDecoder;

util.inherits(Readable, Stream);

var Duplex;
function ReadableState(options, stream) {
  Duplex = Duplex || require('./_stream_duplex');

  options = options || {};

  // object stream flag. Used to make read(n) ignore n and to
  // make all the buffer merging and length checks go away
  this.objectMode = !!options.objectMode;

  if (stream instanceof Duplex) this.objectMode = this.objectMode || !!options.readableObjectMode;

  // the point at which it stops calling _read() to fill the buffer
  // Note: 0 is a valid value, means "don't call _read preemptively ever"
  var hwm = options.highWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;
  this.highWaterMark = hwm || hwm === 0 ? hwm : defaultHwm;

  // cast to ints.
  this.highWaterMark = ~ ~this.highWaterMark;

  this.buffer = [];
  this.length = 0;
  this.pipes = null;
  this.pipesCount = 0;
  this.flowing = null;
  this.ended = false;
  this.endEmitted = false;
  this.reading = false;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // whenever we return null, then we set a flag to say
  // that we're awaiting a 'readable' event emission.
  this.needReadable = false;
  this.emittedReadable = false;
  this.readableListening = false;
  this.resumeScheduled = false;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // when piping, we only care about 'readable' events that happen
  // after read()ing all the bytes and not getting any pushback.
  this.ranOut = false;

  // the number of writers that are awaiting a drain event in .pipe()s
  this.awaitDrain = 0;

  // if true, a maybeReadMore has been scheduled
  this.readingMore = false;

  this.decoder = null;
  this.encoding = null;
  if (options.encoding) {
    if (!StringDecoder) StringDecoder = require('string_decoder/').StringDecoder;
    this.decoder = new StringDecoder(options.encoding);
    this.encoding = options.encoding;
  }
}

var Duplex;
function Readable(options) {
  Duplex = Duplex || require('./_stream_duplex');

  if (!(this instanceof Readable)) return new Readable(options);

  this._readableState = new ReadableState(options, this);

  // legacy
  this.readable = true;

  if (options && typeof options.read === 'function') this._read = options.read;

  Stream.call(this);
}

// Manually shove something into the read() buffer.
// This returns true if the highWaterMark has not been hit yet,
// similar to how Writable.write() returns true if you should
// write() some more.
Readable.prototype.push = function (chunk, encoding) {
  var state = this._readableState;

  if (!state.objectMode && typeof chunk === 'string') {
    encoding = encoding || state.defaultEncoding;
    if (encoding !== state.encoding) {
      chunk = new Buffer(chunk, encoding);
      encoding = '';
    }
  }

  return readableAddChunk(this, state, chunk, encoding, false);
};

// Unshift should *always* be something directly out of read()
Readable.prototype.unshift = function (chunk) {
  var state = this._readableState;
  return readableAddChunk(this, state, chunk, '', true);
};

Readable.prototype.isPaused = function () {
  return this._readableState.flowing === false;
};

function readableAddChunk(stream, state, chunk, encoding, addToFront) {
  var er = chunkInvalid(state, chunk);
  if (er) {
    stream.emit('error', er);
  } else if (chunk === null) {
    state.reading = false;
    onEofChunk(stream, state);
  } else if (state.objectMode || chunk && chunk.length > 0) {
    if (state.ended && !addToFront) {
      var e = new Error('stream.push() after EOF');
      stream.emit('error', e);
    } else if (state.endEmitted && addToFront) {
      var e = new Error('stream.unshift() after end event');
      stream.emit('error', e);
    } else {
      var skipAdd;
      if (state.decoder && !addToFront && !encoding) {
        chunk = state.decoder.write(chunk);
        skipAdd = !state.objectMode && chunk.length === 0;
      }

      if (!addToFront) state.reading = false;

      // Don't add to the buffer if we've decoded to an empty string chunk and
      // we're not in object mode
      if (!skipAdd) {
        // if we want the data now, just emit it.
        if (state.flowing && state.length === 0 && !state.sync) {
          stream.emit('data', chunk);
          stream.read(0);
        } else {
          // update the buffer info.
          state.length += state.objectMode ? 1 : chunk.length;
          if (addToFront) state.buffer.unshift(chunk);else state.buffer.push(chunk);

          if (state.needReadable) emitReadable(stream);
        }
      }

      maybeReadMore(stream, state);
    }
  } else if (!addToFront) {
    state.reading = false;
  }

  return needMoreData(state);
}

// if it's past the high water mark, we can push in some more.
// Also, if we have no data yet, we can stand some
// more bytes.  This is to work around cases where hwm=0,
// such as the repl.  Also, if the push() triggered a
// readable event, and the user called read(largeNumber) such that
// needReadable was set, then we ought to push more, so that another
// 'readable' event will be triggered.
function needMoreData(state) {
  return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);
}

// backwards compatibility.
Readable.prototype.setEncoding = function (enc) {
  if (!StringDecoder) StringDecoder = require('string_decoder/').StringDecoder;
  this._readableState.decoder = new StringDecoder(enc);
  this._readableState.encoding = enc;
  return this;
};

// Don't raise the hwm > 8MB
var MAX_HWM = 0x800000;
function computeNewHighWaterMark(n) {
  if (n >= MAX_HWM) {
    n = MAX_HWM;
  } else {
    // Get the next highest power of 2
    n--;
    n |= n >>> 1;
    n |= n >>> 2;
    n |= n >>> 4;
    n |= n >>> 8;
    n |= n >>> 16;
    n++;
  }
  return n;
}

function howMuchToRead(n, state) {
  if (state.length === 0 && state.ended) return 0;

  if (state.objectMode) return n === 0 ? 0 : 1;

  if (n === null || isNaN(n)) {
    // only flow one buffer at a time
    if (state.flowing && state.buffer.length) return state.buffer[0].length;else return state.length;
  }

  if (n <= 0) return 0;

  // If we're asking for more than the target buffer level,
  // then raise the water mark.  Bump up to the next highest
  // power of 2, to prevent increasing it excessively in tiny
  // amounts.
  if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);

  // don't have that much.  return null, unless we've ended.
  if (n > state.length) {
    if (!state.ended) {
      state.needReadable = true;
      return 0;
    } else {
      return state.length;
    }
  }

  return n;
}

// you can override either this method, or the async _read(n) below.
Readable.prototype.read = function (n) {
  debug('read', n);
  var state = this._readableState;
  var nOrig = n;

  if (typeof n !== 'number' || n > 0) state.emittedReadable = false;

  // if we're doing read(0) to trigger a readable event, but we
  // already have a bunch of data in the buffer, then just trigger
  // the 'readable' event and move on.
  if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
    debug('read: emitReadable', state.length, state.ended);
    if (state.length === 0 && state.ended) endReadable(this);else emitReadable(this);
    return null;
  }

  n = howMuchToRead(n, state);

  // if we've ended, and we're now clear, then finish it up.
  if (n === 0 && state.ended) {
    if (state.length === 0) endReadable(this);
    return null;
  }

  // All the actual chunk generation logic needs to be
  // *below* the call to _read.  The reason is that in certain
  // synthetic stream cases, such as passthrough streams, _read
  // may be a completely synchronous operation which may change
  // the state of the read buffer, providing enough data when
  // before there was *not* enough.
  //
  // So, the steps are:
  // 1. Figure out what the state of things will be after we do
  // a read from the buffer.
  //
  // 2. If that resulting state will trigger a _read, then call _read.
  // Note that this may be asynchronous, or synchronous.  Yes, it is
  // deeply ugly to write APIs this way, but that still doesn't mean
  // that the Readable class should behave improperly, as streams are
  // designed to be sync/async agnostic.
  // Take note if the _read call is sync or async (ie, if the read call
  // has returned yet), so that we know whether or not it's safe to emit
  // 'readable' etc.
  //
  // 3. Actually pull the requested chunks out of the buffer and return.

  // if we need a readable event, then we need to do some reading.
  var doRead = state.needReadable;
  debug('need readable', doRead);

  // if we currently have less than the highWaterMark, then also read some
  if (state.length === 0 || state.length - n < state.highWaterMark) {
    doRead = true;
    debug('length less than watermark', doRead);
  }

  // however, if we've ended, then there's no point, and if we're already
  // reading, then it's unnecessary.
  if (state.ended || state.reading) {
    doRead = false;
    debug('reading or ended', doRead);
  }

  if (doRead) {
    debug('do read');
    state.reading = true;
    state.sync = true;
    // if the length is currently zero, then we *need* a readable event.
    if (state.length === 0) state.needReadable = true;
    // call internal read method
    this._read(state.highWaterMark);
    state.sync = false;
  }

  // If _read pushed data synchronously, then `reading` will be false,
  // and we need to re-evaluate how much data we can return to the user.
  if (doRead && !state.reading) n = howMuchToRead(nOrig, state);

  var ret;
  if (n > 0) ret = fromList(n, state);else ret = null;

  if (ret === null) {
    state.needReadable = true;
    n = 0;
  }

  state.length -= n;

  // If we have nothing in the buffer, then we want to know
  // as soon as we *do* get something into the buffer.
  if (state.length === 0 && !state.ended) state.needReadable = true;

  // If we tried to read() past the EOF, then emit end on the next tick.
  if (nOrig !== n && state.ended && state.length === 0) endReadable(this);

  if (ret !== null) this.emit('data', ret);

  return ret;
};

function chunkInvalid(state, chunk) {
  var er = null;
  if (!Buffer.isBuffer(chunk) && typeof chunk !== 'string' && chunk !== null && chunk !== undefined && !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  return er;
}

function onEofChunk(stream, state) {
  if (state.ended) return;
  if (state.decoder) {
    var chunk = state.decoder.end();
    if (chunk && chunk.length) {
      state.buffer.push(chunk);
      state.length += state.objectMode ? 1 : chunk.length;
    }
  }
  state.ended = true;

  // emit 'readable' now to make sure it gets picked up.
  emitReadable(stream);
}

// Don't emit readable right away in sync mode, because this can trigger
// another read() call => stack overflow.  This way, it might trigger
// a nextTick recursion warning, but that's not so bad.
function emitReadable(stream) {
  var state = stream._readableState;
  state.needReadable = false;
  if (!state.emittedReadable) {
    debug('emitReadable', state.flowing);
    state.emittedReadable = true;
    if (state.sync) processNextTick(emitReadable_, stream);else emitReadable_(stream);
  }
}

function emitReadable_(stream) {
  debug('emit readable');
  stream.emit('readable');
  flow(stream);
}

// at this point, the user has presumably seen the 'readable' event,
// and called read() to consume some data.  that may have triggered
// in turn another _read(n) call, in which case reading = true if
// it's in progress.
// However, if we're not ended, or reading, and the length < hwm,
// then go ahead and try to read some more preemptively.
function maybeReadMore(stream, state) {
  if (!state.readingMore) {
    state.readingMore = true;
    processNextTick(maybeReadMore_, stream, state);
  }
}

function maybeReadMore_(stream, state) {
  var len = state.length;
  while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {
    debug('maybeReadMore read 0');
    stream.read(0);
    if (len === state.length)
      // didn't get any data, stop spinning.
      break;else len = state.length;
  }
  state.readingMore = false;
}

// abstract method.  to be overridden in specific implementation classes.
// call cb(er, data) where data is <= n in length.
// for virtual (non-string, non-buffer) streams, "length" is somewhat
// arbitrary, and perhaps not very meaningful.
Readable.prototype._read = function (n) {
  this.emit('error', new Error('not implemented'));
};

Readable.prototype.pipe = function (dest, pipeOpts) {
  var src = this;
  var state = this._readableState;

  switch (state.pipesCount) {
    case 0:
      state.pipes = dest;
      break;
    case 1:
      state.pipes = [state.pipes, dest];
      break;
    default:
      state.pipes.push(dest);
      break;
  }
  state.pipesCount += 1;
  debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);

  var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;

  var endFn = doEnd ? onend : cleanup;
  if (state.endEmitted) processNextTick(endFn);else src.once('end', endFn);

  dest.on('unpipe', onunpipe);
  function onunpipe(readable) {
    debug('onunpipe');
    if (readable === src) {
      cleanup();
    }
  }

  function onend() {
    debug('onend');
    dest.end();
  }

  // when the dest drains, it reduces the awaitDrain counter
  // on the source.  This would be more elegant with a .once()
  // handler in flow(), but adding and removing repeatedly is
  // too slow.
  var ondrain = pipeOnDrain(src);
  dest.on('drain', ondrain);

  var cleanedUp = false;
  function cleanup() {
    debug('cleanup');
    // cleanup event handlers once the pipe is broken
    dest.removeListener('close', onclose);
    dest.removeListener('finish', onfinish);
    dest.removeListener('drain', ondrain);
    dest.removeListener('error', onerror);
    dest.removeListener('unpipe', onunpipe);
    src.removeListener('end', onend);
    src.removeListener('end', cleanup);
    src.removeListener('data', ondata);

    cleanedUp = true;

    // if the reader is waiting for a drain event from this
    // specific writer, then it would cause it to never start
    // flowing again.
    // So, if this is awaiting a drain, then we just call it now.
    // If we don't know, then assume that we are waiting for one.
    if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
  }

  src.on('data', ondata);
  function ondata(chunk) {
    debug('ondata');
    var ret = dest.write(chunk);
    if (false === ret) {
      // If the user unpiped during `dest.write()`, it is possible
      // to get stuck in a permanently paused state if that write
      // also returned false.
      if (state.pipesCount === 1 && state.pipes[0] === dest && src.listenerCount('data') === 1 && !cleanedUp) {
        debug('false write response, pause', src._readableState.awaitDrain);
        src._readableState.awaitDrain++;
      }
      src.pause();
    }
  }

  // if the dest has an error, then stop piping into it.
  // however, don't suppress the throwing behavior for this.
  function onerror(er) {
    debug('onerror', er);
    unpipe();
    dest.removeListener('error', onerror);
    if (EElistenerCount(dest, 'error') === 0) dest.emit('error', er);
  }
  // This is a brutally ugly hack to make sure that our error handler
  // is attached before any userland ones.  NEVER DO THIS.
  if (!dest._events || !dest._events.error) dest.on('error', onerror);else if (isArray(dest._events.error)) dest._events.error.unshift(onerror);else dest._events.error = [onerror, dest._events.error];

  // Both close and finish should trigger unpipe, but only once.
  function onclose() {
    dest.removeListener('finish', onfinish);
    unpipe();
  }
  dest.once('close', onclose);
  function onfinish() {
    debug('onfinish');
    dest.removeListener('close', onclose);
    unpipe();
  }
  dest.once('finish', onfinish);

  function unpipe() {
    debug('unpipe');
    src.unpipe(dest);
  }

  // tell the dest that it's being piped to
  dest.emit('pipe', src);

  // start the flow if it hasn't been started already.
  if (!state.flowing) {
    debug('pipe resume');
    src.resume();
  }

  return dest;
};

function pipeOnDrain(src) {
  return function () {
    var state = src._readableState;
    debug('pipeOnDrain', state.awaitDrain);
    if (state.awaitDrain) state.awaitDrain--;
    if (state.awaitDrain === 0 && EElistenerCount(src, 'data')) {
      state.flowing = true;
      flow(src);
    }
  };
}

Readable.prototype.unpipe = function (dest) {
  var state = this._readableState;

  // if we're not piping anywhere, then do nothing.
  if (state.pipesCount === 0) return this;

  // just one destination.  most common case.
  if (state.pipesCount === 1) {
    // passed in one, but it's not the right one.
    if (dest && dest !== state.pipes) return this;

    if (!dest) dest = state.pipes;

    // got a match.
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;
    if (dest) dest.emit('unpipe', this);
    return this;
  }

  // slow case. multiple pipe destinations.

  if (!dest) {
    // remove all.
    var dests = state.pipes;
    var len = state.pipesCount;
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;

    for (var _i = 0; _i < len; _i++) {
      dests[_i].emit('unpipe', this);
    }return this;
  }

  // try to find the right one.
  var i = indexOf(state.pipes, dest);
  if (i === -1) return this;

  state.pipes.splice(i, 1);
  state.pipesCount -= 1;
  if (state.pipesCount === 1) state.pipes = state.pipes[0];

  dest.emit('unpipe', this);

  return this;
};

// set up data events if they are asked for
// Ensure readable listeners eventually get something
Readable.prototype.on = function (ev, fn) {
  var res = Stream.prototype.on.call(this, ev, fn);

  // If listening to data, and it has not explicitly been paused,
  // then call resume to start the flow of data on the next tick.
  if (ev === 'data' && false !== this._readableState.flowing) {
    this.resume();
  }

  if (ev === 'readable' && !this._readableState.endEmitted) {
    var state = this._readableState;
    if (!state.readableListening) {
      state.readableListening = true;
      state.emittedReadable = false;
      state.needReadable = true;
      if (!state.reading) {
        processNextTick(nReadingNextTick, this);
      } else if (state.length) {
        emitReadable(this, state);
      }
    }
  }

  return res;
};
Readable.prototype.addListener = Readable.prototype.on;

function nReadingNextTick(self) {
  debug('readable nexttick read 0');
  self.read(0);
}

// pause() and resume() are remnants of the legacy readable stream API
// If the user uses them, then switch into old mode.
Readable.prototype.resume = function () {
  var state = this._readableState;
  if (!state.flowing) {
    debug('resume');
    state.flowing = true;
    resume(this, state);
  }
  return this;
};

function resume(stream, state) {
  if (!state.resumeScheduled) {
    state.resumeScheduled = true;
    processNextTick(resume_, stream, state);
  }
}

function resume_(stream, state) {
  if (!state.reading) {
    debug('resume read 0');
    stream.read(0);
  }

  state.resumeScheduled = false;
  stream.emit('resume');
  flow(stream);
  if (state.flowing && !state.reading) stream.read(0);
}

Readable.prototype.pause = function () {
  debug('call pause flowing=%j', this._readableState.flowing);
  if (false !== this._readableState.flowing) {
    debug('pause');
    this._readableState.flowing = false;
    this.emit('pause');
  }
  return this;
};

function flow(stream) {
  var state = stream._readableState;
  debug('flow', state.flowing);
  if (state.flowing) {
    do {
      var chunk = stream.read();
    } while (null !== chunk && state.flowing);
  }
}

// wrap an old-style stream as the async data source.
// This is *not* part of the readable stream interface.
// It is an ugly unfortunate mess of history.
Readable.prototype.wrap = function (stream) {
  var state = this._readableState;
  var paused = false;

  var self = this;
  stream.on('end', function () {
    debug('wrapped end');
    if (state.decoder && !state.ended) {
      var chunk = state.decoder.end();
      if (chunk && chunk.length) self.push(chunk);
    }

    self.push(null);
  });

  stream.on('data', function (chunk) {
    debug('wrapped data');
    if (state.decoder) chunk = state.decoder.write(chunk);

    // don't skip over falsy values in objectMode
    if (state.objectMode && (chunk === null || chunk === undefined)) return;else if (!state.objectMode && (!chunk || !chunk.length)) return;

    var ret = self.push(chunk);
    if (!ret) {
      paused = true;
      stream.pause();
    }
  });

  // proxy all the other methods.
  // important when wrapping filters and duplexes.
  for (var i in stream) {
    if (this[i] === undefined && typeof stream[i] === 'function') {
      this[i] = function (method) {
        return function () {
          return stream[method].apply(stream, arguments);
        };
      }(i);
    }
  }

  // proxy certain important events.
  var events = ['error', 'close', 'destroy', 'pause', 'resume'];
  forEach(events, function (ev) {
    stream.on(ev, self.emit.bind(self, ev));
  });

  // when we try to consume some more bytes, simply unpause the
  // underlying stream.
  self._read = function (n) {
    debug('wrapped _read', n);
    if (paused) {
      paused = false;
      stream.resume();
    }
  };

  return self;
};

// exposed for testing purposes only.
Readable._fromList = fromList;

// Pluck off n bytes from an array of buffers.
// Length is the combined lengths of all the buffers in the list.
function fromList(n, state) {
  var list = state.buffer;
  var length = state.length;
  var stringMode = !!state.decoder;
  var objectMode = !!state.objectMode;
  var ret;

  // nothing in the list, definitely empty.
  if (list.length === 0) return null;

  if (length === 0) ret = null;else if (objectMode) ret = list.shift();else if (!n || n >= length) {
    // read it all, truncate the array.
    if (stringMode) ret = list.join('');else if (list.length === 1) ret = list[0];else ret = Buffer.concat(list, length);
    list.length = 0;
  } else {
    // read just some of it.
    if (n < list[0].length) {
      // just take a part of the first list item.
      // slice is the same for buffers and strings.
      var buf = list[0];
      ret = buf.slice(0, n);
      list[0] = buf.slice(n);
    } else if (n === list[0].length) {
      // first list is a perfect match
      ret = list.shift();
    } else {
      // complex case.
      // we have enough to cover it, but it spans past the first buffer.
      if (stringMode) ret = '';else ret = new Buffer(n);

      var c = 0;
      for (var i = 0, l = list.length; i < l && c < n; i++) {
        var buf = list[0];
        var cpy = Math.min(n - c, buf.length);

        if (stringMode) ret += buf.slice(0, cpy);else buf.copy(ret, c, 0, cpy);

        if (cpy < buf.length) list[0] = buf.slice(cpy);else list.shift();

        c += cpy;
      }
    }
  }

  return ret;
}

function endReadable(stream) {
  var state = stream._readableState;

  // If we get here before consuming all the bytes, then that is a
  // bug in node.  Should never happen.
  if (state.length > 0) throw new Error('endReadable called on non-empty stream');

  if (!state.endEmitted) {
    state.ended = true;
    processNextTick(endReadableNT, state, stream);
  }
}

function endReadableNT(state, stream) {
  // Check that we didn't get one last unshift.
  if (!state.endEmitted && state.length === 0) {
    state.endEmitted = true;
    stream.readable = false;
    stream.emit('end');
  }
}

function forEach(xs, f) {
  for (var i = 0, l = xs.length; i < l; i++) {
    f(xs[i], i);
  }
}

function indexOf(xs, x) {
  for (var i = 0, l = xs.length; i < l; i++) {
    if (xs[i] === x) return i;
  }
  return -1;
}
}).call(this,require('_process'))
},{"./_stream_duplex":25,"_process":23,"buffer":4,"core-util-is":5,"events":7,"inherits":9,"isarray":11,"process-nextick-args":22,"string_decoder/":35,"util":3}],28:[function(require,module,exports){
// a transform stream is a readable/writable stream where you do
// something with the data.  Sometimes it's called a "filter",
// but that's not a great name for it, since that implies a thing where
// some bits pass through, and others are simply ignored.  (That would
// be a valid example of a transform, of course.)
//
// While the output is causally related to the input, it's not a
// necessarily symmetric or synchronous transformation.  For example,
// a zlib stream might take multiple plain-text writes(), and then
// emit a single compressed chunk some time in the future.
//
// Here's how this works:
//
// The Transform stream has all the aspects of the readable and writable
// stream classes.  When you write(chunk), that calls _write(chunk,cb)
// internally, and returns false if there's a lot of pending writes
// buffered up.  When you call read(), that calls _read(n) until
// there's enough pending readable data buffered up.
//
// In a transform stream, the written data is placed in a buffer.  When
// _read(n) is called, it transforms the queued up data, calling the
// buffered _write cb's as it consumes chunks.  If consuming a single
// written chunk would result in multiple output chunks, then the first
// outputted bit calls the readcb, and subsequent chunks just go into
// the read buffer, and will cause it to emit 'readable' if necessary.
//
// This way, back-pressure is actually determined by the reading side,
// since _read has to be called to start processing a new chunk.  However,
// a pathological inflate type of transform can cause excessive buffering
// here.  For example, imagine a stream where every byte of input is
// interpreted as an integer from 0-255, and then results in that many
// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
// 1kb of data being output.  In this case, you could write a very small
// amount of input, and end up with a very large amount of output.  In
// such a pathological inflating mechanism, there'd be no way to tell
// the system to stop doing the transform.  A single 4MB write could
// cause the system to run out of memory.
//
// However, even in such a pathological case, only a single written chunk
// would be consumed, and then the rest would wait (un-transformed) until
// the results of the previous transformed chunk were consumed.

'use strict';

module.exports = Transform;

var Duplex = require('./_stream_duplex');

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

util.inherits(Transform, Duplex);

function TransformState(stream) {
  this.afterTransform = function (er, data) {
    return afterTransform(stream, er, data);
  };

  this.needTransform = false;
  this.transforming = false;
  this.writecb = null;
  this.writechunk = null;
  this.writeencoding = null;
}

function afterTransform(stream, er, data) {
  var ts = stream._transformState;
  ts.transforming = false;

  var cb = ts.writecb;

  if (!cb) return stream.emit('error', new Error('no writecb in Transform class'));

  ts.writechunk = null;
  ts.writecb = null;

  if (data !== null && data !== undefined) stream.push(data);

  cb(er);

  var rs = stream._readableState;
  rs.reading = false;
  if (rs.needReadable || rs.length < rs.highWaterMark) {
    stream._read(rs.highWaterMark);
  }
}

function Transform(options) {
  if (!(this instanceof Transform)) return new Transform(options);

  Duplex.call(this, options);

  this._transformState = new TransformState(this);

  // when the writable side finishes, then flush out anything remaining.
  var stream = this;

  // start out asking for a readable event once data is transformed.
  this._readableState.needReadable = true;

  // we have implemented the _read method, and done the other things
  // that Readable wants before the first _read call, so unset the
  // sync guard flag.
  this._readableState.sync = false;

  if (options) {
    if (typeof options.transform === 'function') this._transform = options.transform;

    if (typeof options.flush === 'function') this._flush = options.flush;
  }

  this.once('prefinish', function () {
    if (typeof this._flush === 'function') this._flush(function (er) {
      done(stream, er);
    });else done(stream);
  });
}

Transform.prototype.push = function (chunk, encoding) {
  this._transformState.needTransform = false;
  return Duplex.prototype.push.call(this, chunk, encoding);
};

// This is the part where you do stuff!
// override this function in implementation classes.
// 'chunk' is an input chunk.
//
// Call `push(newChunk)` to pass along transformed output
// to the readable side.  You may call 'push' zero or more times.
//
// Call `cb(err)` when you are done with this chunk.  If you pass
// an error, then that'll put the hurt on the whole operation.  If you
// never call cb(), then you'll never get another chunk.
Transform.prototype._transform = function (chunk, encoding, cb) {
  throw new Error('not implemented');
};

Transform.prototype._write = function (chunk, encoding, cb) {
  var ts = this._transformState;
  ts.writecb = cb;
  ts.writechunk = chunk;
  ts.writeencoding = encoding;
  if (!ts.transforming) {
    var rs = this._readableState;
    if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
  }
};

// Doesn't matter what the args are here.
// _transform does all the work.
// That we got here means that the readable side wants more data.
Transform.prototype._read = function (n) {
  var ts = this._transformState;

  if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
    ts.transforming = true;
    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
  } else {
    // mark that we need a transform, so that any data that comes in
    // will get processed, now that we've asked for it.
    ts.needTransform = true;
  }
};

function done(stream, er) {
  if (er) return stream.emit('error', er);

  // if there's nothing in the write buffer, then that means
  // that nothing more will ever be provided
  var ws = stream._writableState;
  var ts = stream._transformState;

  if (ws.length) throw new Error('calling transform done when ws.length != 0');

  if (ts.transforming) throw new Error('calling transform done when still transforming');

  return stream.push(null);
}
},{"./_stream_duplex":25,"core-util-is":5,"inherits":9}],29:[function(require,module,exports){
(function (process){
// A bit simpler than readable streams.
// Implement an async ._write(chunk, encoding, cb), and it'll handle all
// the drain event emission and buffering.

'use strict';

module.exports = Writable;

/*<replacement>*/
var processNextTick = require('process-nextick-args');
/*</replacement>*/

/*<replacement>*/
var asyncWrite = !process.browser && ['v0.10', 'v0.9.'].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : processNextTick;
/*</replacement>*/

/*<replacement>*/
var Buffer = require('buffer').Buffer;
/*</replacement>*/

Writable.WritableState = WritableState;

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

/*<replacement>*/
var internalUtil = {
  deprecate: require('util-deprecate')
};
/*</replacement>*/

/*<replacement>*/
var Stream;
(function () {
  try {
    Stream = require('st' + 'ream');
  } catch (_) {} finally {
    if (!Stream) Stream = require('events').EventEmitter;
  }
})();
/*</replacement>*/

var Buffer = require('buffer').Buffer;

util.inherits(Writable, Stream);

function nop() {}

function WriteReq(chunk, encoding, cb) {
  this.chunk = chunk;
  this.encoding = encoding;
  this.callback = cb;
  this.next = null;
}

var Duplex;
function WritableState(options, stream) {
  Duplex = Duplex || require('./_stream_duplex');

  options = options || {};

  // object stream flag to indicate whether or not this stream
  // contains buffers or objects.
  this.objectMode = !!options.objectMode;

  if (stream instanceof Duplex) this.objectMode = this.objectMode || !!options.writableObjectMode;

  // the point at which write() starts returning false
  // Note: 0 is a valid value, means that we always return false if
  // the entire buffer is not flushed immediately on write()
  var hwm = options.highWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;
  this.highWaterMark = hwm || hwm === 0 ? hwm : defaultHwm;

  // cast to ints.
  this.highWaterMark = ~ ~this.highWaterMark;

  this.needDrain = false;
  // at the start of calling end()
  this.ending = false;
  // when end() has been called, and returned
  this.ended = false;
  // when 'finish' is emitted
  this.finished = false;

  // should we decode strings into buffers before passing to _write?
  // this is here so that some node-core streams can optimize string
  // handling at a lower level.
  var noDecode = options.decodeStrings === false;
  this.decodeStrings = !noDecode;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // not an actual buffer we keep track of, but a measurement
  // of how much we're waiting to get pushed to some underlying
  // socket or file.
  this.length = 0;

  // a flag to see when we're in the middle of a write.
  this.writing = false;

  // when true all writes will be buffered until .uncork() call
  this.corked = 0;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // a flag to know if we're processing previously buffered items, which
  // may call the _write() callback in the same tick, so that we don't
  // end up in an overlapped onwrite situation.
  this.bufferProcessing = false;

  // the callback that's passed to _write(chunk,cb)
  this.onwrite = function (er) {
    onwrite(stream, er);
  };

  // the callback that the user supplies to write(chunk,encoding,cb)
  this.writecb = null;

  // the amount that is being written when _write is called.
  this.writelen = 0;

  this.bufferedRequest = null;
  this.lastBufferedRequest = null;

  // number of pending user-supplied write callbacks
  // this must be 0 before 'finish' can be emitted
  this.pendingcb = 0;

  // emit prefinish if the only thing we're waiting for is _write cbs
  // This is relevant for synchronous Transform streams
  this.prefinished = false;

  // True if the error was already emitted and should not be thrown again
  this.errorEmitted = false;

  // count buffered requests
  this.bufferedRequestCount = 0;

  // create the two objects needed to store the corked requests
  // they are not a linked list, as no new elements are inserted in there
  this.corkedRequestsFree = new CorkedRequest(this);
  this.corkedRequestsFree.next = new CorkedRequest(this);
}

WritableState.prototype.getBuffer = function writableStateGetBuffer() {
  var current = this.bufferedRequest;
  var out = [];
  while (current) {
    out.push(current);
    current = current.next;
  }
  return out;
};

(function () {
  try {
    Object.defineProperty(WritableState.prototype, 'buffer', {
      get: internalUtil.deprecate(function () {
        return this.getBuffer();
      }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' + 'instead.')
    });
  } catch (_) {}
})();

var Duplex;
function Writable(options) {
  Duplex = Duplex || require('./_stream_duplex');

  // Writable ctor is applied to Duplexes, though they're not
  // instanceof Writable, they're instanceof Readable.
  if (!(this instanceof Writable) && !(this instanceof Duplex)) return new Writable(options);

  this._writableState = new WritableState(options, this);

  // legacy.
  this.writable = true;

  if (options) {
    if (typeof options.write === 'function') this._write = options.write;

    if (typeof options.writev === 'function') this._writev = options.writev;
  }

  Stream.call(this);
}

// Otherwise people can pipe Writable streams, which is just wrong.
Writable.prototype.pipe = function () {
  this.emit('error', new Error('Cannot pipe. Not readable.'));
};

function writeAfterEnd(stream, cb) {
  var er = new Error('write after end');
  // TODO: defer error events consistently everywhere, not just the cb
  stream.emit('error', er);
  processNextTick(cb, er);
}

// If we get something that is not a buffer, string, null, or undefined,
// and we're not in objectMode, then that's an error.
// Otherwise stream chunks are all considered to be of length=1, and the
// watermarks determine how many objects to keep in the buffer, rather than
// how many bytes or characters.
function validChunk(stream, state, chunk, cb) {
  var valid = true;

  if (!Buffer.isBuffer(chunk) && typeof chunk !== 'string' && chunk !== null && chunk !== undefined && !state.objectMode) {
    var er = new TypeError('Invalid non-string/buffer chunk');
    stream.emit('error', er);
    processNextTick(cb, er);
    valid = false;
  }
  return valid;
}

Writable.prototype.write = function (chunk, encoding, cb) {
  var state = this._writableState;
  var ret = false;

  if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (Buffer.isBuffer(chunk)) encoding = 'buffer';else if (!encoding) encoding = state.defaultEncoding;

  if (typeof cb !== 'function') cb = nop;

  if (state.ended) writeAfterEnd(this, cb);else if (validChunk(this, state, chunk, cb)) {
    state.pendingcb++;
    ret = writeOrBuffer(this, state, chunk, encoding, cb);
  }

  return ret;
};

Writable.prototype.cork = function () {
  var state = this._writableState;

  state.corked++;
};

Writable.prototype.uncork = function () {
  var state = this._writableState;

  if (state.corked) {
    state.corked--;

    if (!state.writing && !state.corked && !state.finished && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
  }
};

Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
  // node::ParseEncoding() requires lower case.
  if (typeof encoding === 'string') encoding = encoding.toLowerCase();
  if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64', 'ucs2', 'ucs-2', 'utf16le', 'utf-16le', 'raw'].indexOf((encoding + '').toLowerCase()) > -1)) throw new TypeError('Unknown encoding: ' + encoding);
  this._writableState.defaultEncoding = encoding;
};

function decodeChunk(state, chunk, encoding) {
  if (!state.objectMode && state.decodeStrings !== false && typeof chunk === 'string') {
    chunk = new Buffer(chunk, encoding);
  }
  return chunk;
}

// if we're already writing something, then just put this
// in the queue, and wait our turn.  Otherwise, call _write
// If we return false, then we need a drain event, so set that flag.
function writeOrBuffer(stream, state, chunk, encoding, cb) {
  chunk = decodeChunk(state, chunk, encoding);

  if (Buffer.isBuffer(chunk)) encoding = 'buffer';
  var len = state.objectMode ? 1 : chunk.length;

  state.length += len;

  var ret = state.length < state.highWaterMark;
  // we must ensure that previous needDrain will not be reset to false.
  if (!ret) state.needDrain = true;

  if (state.writing || state.corked) {
    var last = state.lastBufferedRequest;
    state.lastBufferedRequest = new WriteReq(chunk, encoding, cb);
    if (last) {
      last.next = state.lastBufferedRequest;
    } else {
      state.bufferedRequest = state.lastBufferedRequest;
    }
    state.bufferedRequestCount += 1;
  } else {
    doWrite(stream, state, false, len, chunk, encoding, cb);
  }

  return ret;
}

function doWrite(stream, state, writev, len, chunk, encoding, cb) {
  state.writelen = len;
  state.writecb = cb;
  state.writing = true;
  state.sync = true;
  if (writev) stream._writev(chunk, state.onwrite);else stream._write(chunk, encoding, state.onwrite);
  state.sync = false;
}

function onwriteError(stream, state, sync, er, cb) {
  --state.pendingcb;
  if (sync) processNextTick(cb, er);else cb(er);

  stream._writableState.errorEmitted = true;
  stream.emit('error', er);
}

function onwriteStateUpdate(state) {
  state.writing = false;
  state.writecb = null;
  state.length -= state.writelen;
  state.writelen = 0;
}

function onwrite(stream, er) {
  var state = stream._writableState;
  var sync = state.sync;
  var cb = state.writecb;

  onwriteStateUpdate(state);

  if (er) onwriteError(stream, state, sync, er, cb);else {
    // Check if we're actually ready to finish, but don't emit yet
    var finished = needFinish(state);

    if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
      clearBuffer(stream, state);
    }

    if (sync) {
      /*<replacement>*/
      asyncWrite(afterWrite, stream, state, finished, cb);
      /*</replacement>*/
    } else {
        afterWrite(stream, state, finished, cb);
      }
  }
}

function afterWrite(stream, state, finished, cb) {
  if (!finished) onwriteDrain(stream, state);
  state.pendingcb--;
  cb();
  finishMaybe(stream, state);
}

// Must force callback to be called on nextTick, so that we don't
// emit 'drain' before the write() consumer gets the 'false' return
// value, and has a chance to attach a 'drain' listener.
function onwriteDrain(stream, state) {
  if (state.length === 0 && state.needDrain) {
    state.needDrain = false;
    stream.emit('drain');
  }
}

// if there's something in the buffer waiting, then process it
function clearBuffer(stream, state) {
  state.bufferProcessing = true;
  var entry = state.bufferedRequest;

  if (stream._writev && entry && entry.next) {
    // Fast case, write everything using _writev()
    var l = state.bufferedRequestCount;
    var buffer = new Array(l);
    var holder = state.corkedRequestsFree;
    holder.entry = entry;

    var count = 0;
    while (entry) {
      buffer[count] = entry;
      entry = entry.next;
      count += 1;
    }

    doWrite(stream, state, true, state.length, buffer, '', holder.finish);

    // doWrite is always async, defer these to save a bit of time
    // as the hot path ends with doWrite
    state.pendingcb++;
    state.lastBufferedRequest = null;
    state.corkedRequestsFree = holder.next;
    holder.next = null;
  } else {
    // Slow case, write chunks one-by-one
    while (entry) {
      var chunk = entry.chunk;
      var encoding = entry.encoding;
      var cb = entry.callback;
      var len = state.objectMode ? 1 : chunk.length;

      doWrite(stream, state, false, len, chunk, encoding, cb);
      entry = entry.next;
      // if we didn't call the onwrite immediately, then
      // it means that we need to wait until it does.
      // also, that means that the chunk and cb are currently
      // being processed, so move the buffer counter past them.
      if (state.writing) {
        break;
      }
    }

    if (entry === null) state.lastBufferedRequest = null;
  }

  state.bufferedRequestCount = 0;
  state.bufferedRequest = entry;
  state.bufferProcessing = false;
}

Writable.prototype._write = function (chunk, encoding, cb) {
  cb(new Error('not implemented'));
};

Writable.prototype._writev = null;

Writable.prototype.end = function (chunk, encoding, cb) {
  var state = this._writableState;

  if (typeof chunk === 'function') {
    cb = chunk;
    chunk = null;
    encoding = null;
  } else if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (chunk !== null && chunk !== undefined) this.write(chunk, encoding);

  // .end() fully uncorks
  if (state.corked) {
    state.corked = 1;
    this.uncork();
  }

  // ignore unnecessary end() calls.
  if (!state.ending && !state.finished) endWritable(this, state, cb);
};

function needFinish(state) {
  return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
}

function prefinish(stream, state) {
  if (!state.prefinished) {
    state.prefinished = true;
    stream.emit('prefinish');
  }
}

function finishMaybe(stream, state) {
  var need = needFinish(state);
  if (need) {
    if (state.pendingcb === 0) {
      prefinish(stream, state);
      state.finished = true;
      stream.emit('finish');
    } else {
      prefinish(stream, state);
    }
  }
  return need;
}

function endWritable(stream, state, cb) {
  state.ending = true;
  finishMaybe(stream, state);
  if (cb) {
    if (state.finished) processNextTick(cb);else stream.once('finish', cb);
  }
  state.ended = true;
  stream.writable = false;
}

// It seems a linked list but it is not
// there will be only 2 of these for each stream
function CorkedRequest(state) {
  var _this = this;

  this.next = null;
  this.entry = null;

  this.finish = function (err) {
    var entry = _this.entry;
    _this.entry = null;
    while (entry) {
      var cb = entry.callback;
      state.pendingcb--;
      cb(err);
      entry = entry.next;
    }
    if (state.corkedRequestsFree) {
      state.corkedRequestsFree.next = _this;
    } else {
      state.corkedRequestsFree = _this;
    }
  };
}
}).call(this,require('_process'))
},{"./_stream_duplex":25,"_process":23,"buffer":4,"core-util-is":5,"events":7,"inherits":9,"process-nextick-args":22,"util-deprecate":36}],30:[function(require,module,exports){
module.exports = require("./lib/_stream_passthrough.js")

},{"./lib/_stream_passthrough.js":26}],31:[function(require,module,exports){
var Stream = (function (){
  try {
    return require('st' + 'ream'); // hack to fix a circular dependency issue when used with browserify
  } catch(_){}
}());
exports = module.exports = require('./lib/_stream_readable.js');
exports.Stream = Stream || exports;
exports.Readable = exports;
exports.Writable = require('./lib/_stream_writable.js');
exports.Duplex = require('./lib/_stream_duplex.js');
exports.Transform = require('./lib/_stream_transform.js');
exports.PassThrough = require('./lib/_stream_passthrough.js');

},{"./lib/_stream_duplex.js":25,"./lib/_stream_passthrough.js":26,"./lib/_stream_readable.js":27,"./lib/_stream_transform.js":28,"./lib/_stream_writable.js":29}],32:[function(require,module,exports){
module.exports = require("./lib/_stream_transform.js")

},{"./lib/_stream_transform.js":28}],33:[function(require,module,exports){
module.exports = require("./lib/_stream_writable.js")

},{"./lib/_stream_writable.js":29}],34:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

module.exports = Stream;

var EE = require('events').EventEmitter;
var inherits = require('inherits');

inherits(Stream, EE);
Stream.Readable = require('readable-stream/readable.js');
Stream.Writable = require('readable-stream/writable.js');
Stream.Duplex = require('readable-stream/duplex.js');
Stream.Transform = require('readable-stream/transform.js');
Stream.PassThrough = require('readable-stream/passthrough.js');

// Backwards-compat with node 0.4.x
Stream.Stream = Stream;



// old-style streams.  Note that the pipe method (the only relevant
// part of this class) is overridden in the Readable class.

function Stream() {
  EE.call(this);
}

Stream.prototype.pipe = function(dest, options) {
  var source = this;

  function ondata(chunk) {
    if (dest.writable) {
      if (false === dest.write(chunk) && source.pause) {
        source.pause();
      }
    }
  }

  source.on('data', ondata);

  function ondrain() {
    if (source.readable && source.resume) {
      source.resume();
    }
  }

  dest.on('drain', ondrain);

  // If the 'end' option is not supplied, dest.end() will be called when
  // source gets the 'end' or 'close' events.  Only dest.end() once.
  if (!dest._isStdio && (!options || options.end !== false)) {
    source.on('end', onend);
    source.on('close', onclose);
  }

  var didOnEnd = false;
  function onend() {
    if (didOnEnd) return;
    didOnEnd = true;

    dest.end();
  }


  function onclose() {
    if (didOnEnd) return;
    didOnEnd = true;

    if (typeof dest.destroy === 'function') dest.destroy();
  }

  // don't leave dangling pipes when there are errors.
  function onerror(er) {
    cleanup();
    if (EE.listenerCount(this, 'error') === 0) {
      throw er; // Unhandled stream error in pipe.
    }
  }

  source.on('error', onerror);
  dest.on('error', onerror);

  // remove all the event listeners that were added.
  function cleanup() {
    source.removeListener('data', ondata);
    dest.removeListener('drain', ondrain);

    source.removeListener('end', onend);
    source.removeListener('close', onclose);

    source.removeListener('error', onerror);
    dest.removeListener('error', onerror);

    source.removeListener('end', cleanup);
    source.removeListener('close', cleanup);

    dest.removeListener('close', cleanup);
  }

  source.on('end', cleanup);
  source.on('close', cleanup);

  dest.on('close', cleanup);

  dest.emit('pipe', source);

  // Allow for unix-like usage: A.pipe(B).pipe(C)
  return dest;
};

},{"events":7,"inherits":9,"readable-stream/duplex.js":24,"readable-stream/passthrough.js":30,"readable-stream/readable.js":31,"readable-stream/transform.js":32,"readable-stream/writable.js":33}],35:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var Buffer = require('buffer').Buffer;

var isBufferEncoding = Buffer.isEncoding
  || function(encoding) {
       switch (encoding && encoding.toLowerCase()) {
         case 'hex': case 'utf8': case 'utf-8': case 'ascii': case 'binary': case 'base64': case 'ucs2': case 'ucs-2': case 'utf16le': case 'utf-16le': case 'raw': return true;
         default: return false;
       }
     }


function assertEncoding(encoding) {
  if (encoding && !isBufferEncoding(encoding)) {
    throw new Error('Unknown encoding: ' + encoding);
  }
}

// StringDecoder provides an interface for efficiently splitting a series of
// buffers into a series of JS strings without breaking apart multi-byte
// characters. CESU-8 is handled as part of the UTF-8 encoding.
//
// @TODO Handling all encodings inside a single object makes it very difficult
// to reason about this code, so it should be split up in the future.
// @TODO There should be a utf8-strict encoding that rejects invalid UTF-8 code
// points as used by CESU-8.
var StringDecoder = exports.StringDecoder = function(encoding) {
  this.encoding = (encoding || 'utf8').toLowerCase().replace(/[-_]/, '');
  assertEncoding(encoding);
  switch (this.encoding) {
    case 'utf8':
      // CESU-8 represents each of Surrogate Pair by 3-bytes
      this.surrogateSize = 3;
      break;
    case 'ucs2':
    case 'utf16le':
      // UTF-16 represents each of Surrogate Pair by 2-bytes
      this.surrogateSize = 2;
      this.detectIncompleteChar = utf16DetectIncompleteChar;
      break;
    case 'base64':
      // Base-64 stores 3 bytes in 4 chars, and pads the remainder.
      this.surrogateSize = 3;
      this.detectIncompleteChar = base64DetectIncompleteChar;
      break;
    default:
      this.write = passThroughWrite;
      return;
  }

  // Enough space to store all bytes of a single character. UTF-8 needs 4
  // bytes, but CESU-8 may require up to 6 (3 bytes per surrogate).
  this.charBuffer = new Buffer(6);
  // Number of bytes received for the current incomplete multi-byte character.
  this.charReceived = 0;
  // Number of bytes expected for the current incomplete multi-byte character.
  this.charLength = 0;
};


// write decodes the given buffer and returns it as JS string that is
// guaranteed to not contain any partial multi-byte characters. Any partial
// character found at the end of the buffer is buffered up, and will be
// returned when calling write again with the remaining bytes.
//
// Note: Converting a Buffer containing an orphan surrogate to a String
// currently works, but converting a String to a Buffer (via `new Buffer`, or
// Buffer#write) will replace incomplete surrogates with the unicode
// replacement character. See https://codereview.chromium.org/121173009/ .
StringDecoder.prototype.write = function(buffer) {
  var charStr = '';
  // if our last write ended with an incomplete multibyte character
  while (this.charLength) {
    // determine how many remaining bytes this buffer has to offer for this char
    var available = (buffer.length >= this.charLength - this.charReceived) ?
        this.charLength - this.charReceived :
        buffer.length;

    // add the new bytes to the char buffer
    buffer.copy(this.charBuffer, this.charReceived, 0, available);
    this.charReceived += available;

    if (this.charReceived < this.charLength) {
      // still not enough chars in this buffer? wait for more ...
      return '';
    }

    // remove bytes belonging to the current character from the buffer
    buffer = buffer.slice(available, buffer.length);

    // get the character that was split
    charStr = this.charBuffer.slice(0, this.charLength).toString(this.encoding);

    // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
    var charCode = charStr.charCodeAt(charStr.length - 1);
    if (charCode >= 0xD800 && charCode <= 0xDBFF) {
      this.charLength += this.surrogateSize;
      charStr = '';
      continue;
    }
    this.charReceived = this.charLength = 0;

    // if there are no more bytes in this buffer, just emit our char
    if (buffer.length === 0) {
      return charStr;
    }
    break;
  }

  // determine and set charLength / charReceived
  this.detectIncompleteChar(buffer);

  var end = buffer.length;
  if (this.charLength) {
    // buffer the incomplete character bytes we got
    buffer.copy(this.charBuffer, 0, buffer.length - this.charReceived, end);
    end -= this.charReceived;
  }

  charStr += buffer.toString(this.encoding, 0, end);

  var end = charStr.length - 1;
  var charCode = charStr.charCodeAt(end);
  // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
  if (charCode >= 0xD800 && charCode <= 0xDBFF) {
    var size = this.surrogateSize;
    this.charLength += size;
    this.charReceived += size;
    this.charBuffer.copy(this.charBuffer, size, 0, size);
    buffer.copy(this.charBuffer, 0, 0, size);
    return charStr.substring(0, end);
  }

  // or just emit the charStr
  return charStr;
};

// detectIncompleteChar determines if there is an incomplete UTF-8 character at
// the end of the given buffer. If so, it sets this.charLength to the byte
// length that character, and sets this.charReceived to the number of bytes
// that are available for this character.
StringDecoder.prototype.detectIncompleteChar = function(buffer) {
  // determine how many bytes we have to check at the end of this buffer
  var i = (buffer.length >= 3) ? 3 : buffer.length;

  // Figure out if one of the last i bytes of our buffer announces an
  // incomplete char.
  for (; i > 0; i--) {
    var c = buffer[buffer.length - i];

    // See http://en.wikipedia.org/wiki/UTF-8#Description

    // 110XXXXX
    if (i == 1 && c >> 5 == 0x06) {
      this.charLength = 2;
      break;
    }

    // 1110XXXX
    if (i <= 2 && c >> 4 == 0x0E) {
      this.charLength = 3;
      break;
    }

    // 11110XXX
    if (i <= 3 && c >> 3 == 0x1E) {
      this.charLength = 4;
      break;
    }
  }
  this.charReceived = i;
};

StringDecoder.prototype.end = function(buffer) {
  var res = '';
  if (buffer && buffer.length)
    res = this.write(buffer);

  if (this.charReceived) {
    var cr = this.charReceived;
    var buf = this.charBuffer;
    var enc = this.encoding;
    res += buf.slice(0, cr).toString(enc);
  }

  return res;
};

function passThroughWrite(buffer) {
  return buffer.toString(this.encoding);
}

function utf16DetectIncompleteChar(buffer) {
  this.charReceived = buffer.length % 2;
  this.charLength = this.charReceived ? 2 : 0;
}

function base64DetectIncompleteChar(buffer) {
  this.charReceived = buffer.length % 3;
  this.charLength = this.charReceived ? 3 : 0;
}

},{"buffer":4}],36:[function(require,module,exports){
(function (global){

/**
 * Module exports.
 */

module.exports = deprecate;

/**
 * Mark that a method should not be used.
 * Returns a modified function which warns once by default.
 *
 * If `localStorage.noDeprecation = true` is set, then it is a no-op.
 *
 * If `localStorage.throwDeprecation = true` is set, then deprecated functions
 * will throw an Error when invoked.
 *
 * If `localStorage.traceDeprecation = true` is set, then deprecated functions
 * will invoke `console.trace()` instead of `console.error()`.
 *
 * @param {Function} fn - the function to deprecate
 * @param {String} msg - the string to print to the console when `fn` is invoked
 * @returns {Function} a new "deprecated" version of `fn`
 * @api public
 */

function deprecate (fn, msg) {
  if (config('noDeprecation')) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (config('throwDeprecation')) {
        throw new Error(msg);
      } else if (config('traceDeprecation')) {
        console.trace(msg);
      } else {
        console.warn(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
}

/**
 * Checks `localStorage` for boolean values for the given `name`.
 *
 * @param {String} name
 * @returns {Boolean}
 * @api private
 */

function config (name) {
  // accessing global.localStorage can trigger a DOMException in sandboxed iframes
  try {
    if (!global.localStorage) return false;
  } catch (_) {
    return false;
  }
  var val = global.localStorage[name];
  if (null == val) return false;
  return String(val).toLowerCase() === 'true';
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],37:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],38:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":37,"_process":23,"inherits":9}],39:[function(require,module,exports){
function DOMParser(options){
	this.options = options ||{locator:{}};
	
}
DOMParser.prototype.parseFromString = function(source,mimeType){	
	var options = this.options;
	var sax =  new XMLReader();
	var domBuilder = options.domBuilder || new DOMHandler();//contentHandler and LexicalHandler
	var errorHandler = options.errorHandler;
	var locator = options.locator;
	var defaultNSMap = options.xmlns||{};
	var entityMap = {'lt':'<','gt':'>','amp':'&','quot':'"','apos':"'"}
	if(locator){
		domBuilder.setDocumentLocator(locator)
	}
	
	sax.errorHandler = buildErrorHandler(errorHandler,domBuilder,locator);
	sax.domBuilder = options.domBuilder || domBuilder;
	if(/\/x?html?$/.test(mimeType)){
		entityMap.nbsp = '\xa0';
		entityMap.copy = '\xa9';
		defaultNSMap['']= 'http://www.w3.org/1999/xhtml';
	}
	defaultNSMap.xml = defaultNSMap.xml || 'http://www.w3.org/XML/1998/namespace';
	if(source){
		sax.parse(source,defaultNSMap,entityMap);
	}else{
		sax.errorHandler.error("invalid document source");
	}
	return domBuilder.document;
}
function buildErrorHandler(errorImpl,domBuilder,locator){
	if(!errorImpl){
		if(domBuilder instanceof DOMHandler){
			return domBuilder;
		}
		errorImpl = domBuilder ;
	}
	var errorHandler = {}
	var isCallback = errorImpl instanceof Function;
	locator = locator||{}
	function build(key){
		var fn = errorImpl[key];
		if(!fn && isCallback){
			fn = errorImpl.length == 2?function(msg){errorImpl(key,msg)}:errorImpl;
		}
		errorHandler[key] = fn && function(msg){
			fn('[xmldom '+key+']\t'+msg+_locator(locator));
		}||function(){};
	}
	build('warning');
	build('error');
	build('fatalError');
	return errorHandler;
}

//console.log('#\n\n\n\n\n\n\n####')
/**
 * +ContentHandler+ErrorHandler
 * +LexicalHandler+EntityResolver2
 * -DeclHandler-DTDHandler 
 * 
 * DefaultHandler:EntityResolver, DTDHandler, ContentHandler, ErrorHandler
 * DefaultHandler2:DefaultHandler,LexicalHandler, DeclHandler, EntityResolver2
 * @link http://www.saxproject.org/apidoc/org/xml/sax/helpers/DefaultHandler.html
 */
function DOMHandler() {
    this.cdata = false;
}
function position(locator,node){
	node.lineNumber = locator.lineNumber;
	node.columnNumber = locator.columnNumber;
}
/**
 * @see org.xml.sax.ContentHandler#startDocument
 * @link http://www.saxproject.org/apidoc/org/xml/sax/ContentHandler.html
 */ 
DOMHandler.prototype = {
	startDocument : function() {
    	this.document = new DOMImplementation().createDocument(null, null, null);
    	if (this.locator) {
        	this.document.documentURI = this.locator.systemId;
    	}
	},
	startElement:function(namespaceURI, localName, qName, attrs) {
		var doc = this.document;
	    var el = doc.createElementNS(namespaceURI, qName||localName);
	    var len = attrs.length;
	    appendElement(this, el);
	    this.currentElement = el;
	    
		this.locator && position(this.locator,el)
	    for (var i = 0 ; i < len; i++) {
	        var namespaceURI = attrs.getURI(i);
	        var value = attrs.getValue(i);
	        var qName = attrs.getQName(i);
			var attr = doc.createAttributeNS(namespaceURI, qName);
			if( attr.getOffset){
				position(attr.getOffset(1),attr)
			}
			attr.value = attr.nodeValue = value;
			el.setAttributeNode(attr)
	    }
	},
	endElement:function(namespaceURI, localName, qName) {
		var current = this.currentElement
	    var tagName = current.tagName;
	    this.currentElement = current.parentNode;
	},
	startPrefixMapping:function(prefix, uri) {
	},
	endPrefixMapping:function(prefix) {
	},
	processingInstruction:function(target, data) {
	    var ins = this.document.createProcessingInstruction(target, data);
	    this.locator && position(this.locator,ins)
	    appendElement(this, ins);
	},
	ignorableWhitespace:function(ch, start, length) {
	},
	characters:function(chars, start, length) {
		chars = _toString.apply(this,arguments)
		//console.log(chars)
		if(this.currentElement && chars){
			if (this.cdata) {
				var charNode = this.document.createCDATASection(chars);
				this.currentElement.appendChild(charNode);
			} else {
				var charNode = this.document.createTextNode(chars);
				this.currentElement.appendChild(charNode);
			}
			this.locator && position(this.locator,charNode)
		}
	},
	skippedEntity:function(name) {
	},
	endDocument:function() {
		this.document.normalize();
	},
	setDocumentLocator:function (locator) {
	    if(this.locator = locator){// && !('lineNumber' in locator)){
	    	locator.lineNumber = 0;
	    }
	},
	//LexicalHandler
	comment:function(chars, start, length) {
		chars = _toString.apply(this,arguments)
	    var comm = this.document.createComment(chars);
	    this.locator && position(this.locator,comm)
	    appendElement(this, comm);
	},
	
	startCDATA:function() {
	    //used in characters() methods
	    this.cdata = true;
	},
	endCDATA:function() {
	    this.cdata = false;
	},
	
	startDTD:function(name, publicId, systemId) {
		var impl = this.document.implementation;
	    if (impl && impl.createDocumentType) {
	        var dt = impl.createDocumentType(name, publicId, systemId);
	        this.locator && position(this.locator,dt)
	        appendElement(this, dt);
	    }
	},
	/**
	 * @see org.xml.sax.ErrorHandler
	 * @link http://www.saxproject.org/apidoc/org/xml/sax/ErrorHandler.html
	 */
	warning:function(error) {
		console.warn('[xmldom warning]\t'+error,_locator(this.locator));
	},
	error:function(error) {
		console.error('[xmldom error]\t'+error,_locator(this.locator));
	},
	fatalError:function(error) {
		console.error('[xmldom fatalError]\t'+error,_locator(this.locator));
	    throw error;
	}
}
function _locator(l){
	if(l){
		return '\n@'+(l.systemId ||'')+'#[line:'+l.lineNumber+',col:'+l.columnNumber+']'
	}
}
function _toString(chars,start,length){
	if(typeof chars == 'string'){
		return chars.substr(start,length)
	}else{//java sax connect width xmldom on rhino(what about: "? && !(chars instanceof String)")
		if(chars.length >= start+length || start){
			return new java.lang.String(chars,start,length)+'';
		}
		return chars;
	}
}

/*
 * @link http://www.saxproject.org/apidoc/org/xml/sax/ext/LexicalHandler.html
 * used method of org.xml.sax.ext.LexicalHandler:
 *  #comment(chars, start, length)
 *  #startCDATA()
 *  #endCDATA()
 *  #startDTD(name, publicId, systemId)
 *
 *
 * IGNORED method of org.xml.sax.ext.LexicalHandler:
 *  #endDTD()
 *  #startEntity(name)
 *  #endEntity(name)
 *
 *
 * @link http://www.saxproject.org/apidoc/org/xml/sax/ext/DeclHandler.html
 * IGNORED method of org.xml.sax.ext.DeclHandler
 * 	#attributeDecl(eName, aName, type, mode, value)
 *  #elementDecl(name, model)
 *  #externalEntityDecl(name, publicId, systemId)
 *  #internalEntityDecl(name, value)
 * @link http://www.saxproject.org/apidoc/org/xml/sax/ext/EntityResolver2.html
 * IGNORED method of org.xml.sax.EntityResolver2
 *  #resolveEntity(String name,String publicId,String baseURI,String systemId)
 *  #resolveEntity(publicId, systemId)
 *  #getExternalSubset(name, baseURI)
 * @link http://www.saxproject.org/apidoc/org/xml/sax/DTDHandler.html
 * IGNORED method of org.xml.sax.DTDHandler
 *  #notationDecl(name, publicId, systemId) {};
 *  #unparsedEntityDecl(name, publicId, systemId, notationName) {};
 */
"endDTD,startEntity,endEntity,attributeDecl,elementDecl,externalEntityDecl,internalEntityDecl,resolveEntity,getExternalSubset,notationDecl,unparsedEntityDecl".replace(/\w+/g,function(key){
	DOMHandler.prototype[key] = function(){return null}
})

/* Private static helpers treated below as private instance methods, so don't need to add these to the public API; we might use a Relator to also get rid of non-standard public properties */
function appendElement (hander,node) {
    if (!hander.currentElement) {
        hander.document.appendChild(node);
    } else {
        hander.currentElement.appendChild(node);
    }
}//appendChild and setAttributeNS are preformance key

if(typeof require == 'function'){
	var XMLReader = require('./sax').XMLReader;
	var DOMImplementation = exports.DOMImplementation = require('./dom').DOMImplementation;
	exports.XMLSerializer = require('./dom').XMLSerializer ;
	exports.DOMParser = DOMParser;
}

},{"./dom":40,"./sax":41}],40:[function(require,module,exports){
/*
 * DOM Level 2
 * Object DOMException
 * @see http://www.w3.org/TR/REC-DOM-Level-1/ecma-script-language-binding.html
 * @see http://www.w3.org/TR/2000/REC-DOM-Level-2-Core-20001113/ecma-script-binding.html
 */

function copy(src,dest){
	for(var p in src){
		dest[p] = src[p];
	}
}
/**
^\w+\.prototype\.([_\w]+)\s*=\s*((?:.*\{\s*?[\r\n][\s\S]*?^})|\S.*?(?=[;\r\n]));?
^\w+\.prototype\.([_\w]+)\s*=\s*(\S.*?(?=[;\r\n]));?
 */
function _extends(Class,Super){
	var pt = Class.prototype;
	if(Object.create){
		var ppt = Object.create(Super.prototype)
		pt.__proto__ = ppt;
	}
	if(!(pt instanceof Super)){
		function t(){};
		t.prototype = Super.prototype;
		t = new t();
		copy(pt,t);
		Class.prototype = pt = t;
	}
	if(pt.constructor != Class){
		if(typeof Class != 'function'){
			console.error("unknow Class:"+Class)
		}
		pt.constructor = Class
	}
}
var htmlns = 'http://www.w3.org/1999/xhtml' ;
// Node Types
var NodeType = {}
var ELEMENT_NODE                = NodeType.ELEMENT_NODE                = 1;
var ATTRIBUTE_NODE              = NodeType.ATTRIBUTE_NODE              = 2;
var TEXT_NODE                   = NodeType.TEXT_NODE                   = 3;
var CDATA_SECTION_NODE          = NodeType.CDATA_SECTION_NODE          = 4;
var ENTITY_REFERENCE_NODE       = NodeType.ENTITY_REFERENCE_NODE       = 5;
var ENTITY_NODE                 = NodeType.ENTITY_NODE                 = 6;
var PROCESSING_INSTRUCTION_NODE = NodeType.PROCESSING_INSTRUCTION_NODE = 7;
var COMMENT_NODE                = NodeType.COMMENT_NODE                = 8;
var DOCUMENT_NODE               = NodeType.DOCUMENT_NODE               = 9;
var DOCUMENT_TYPE_NODE          = NodeType.DOCUMENT_TYPE_NODE          = 10;
var DOCUMENT_FRAGMENT_NODE      = NodeType.DOCUMENT_FRAGMENT_NODE      = 11;
var NOTATION_NODE               = NodeType.NOTATION_NODE               = 12;

// ExceptionCode
var ExceptionCode = {}
var ExceptionMessage = {};
var INDEX_SIZE_ERR              = ExceptionCode.INDEX_SIZE_ERR              = ((ExceptionMessage[1]="Index size error"),1);
var DOMSTRING_SIZE_ERR          = ExceptionCode.DOMSTRING_SIZE_ERR          = ((ExceptionMessage[2]="DOMString size error"),2);
var HIERARCHY_REQUEST_ERR       = ExceptionCode.HIERARCHY_REQUEST_ERR       = ((ExceptionMessage[3]="Hierarchy request error"),3);
var WRONG_DOCUMENT_ERR          = ExceptionCode.WRONG_DOCUMENT_ERR          = ((ExceptionMessage[4]="Wrong document"),4);
var INVALID_CHARACTER_ERR       = ExceptionCode.INVALID_CHARACTER_ERR       = ((ExceptionMessage[5]="Invalid character"),5);
var NO_DATA_ALLOWED_ERR         = ExceptionCode.NO_DATA_ALLOWED_ERR         = ((ExceptionMessage[6]="No data allowed"),6);
var NO_MODIFICATION_ALLOWED_ERR = ExceptionCode.NO_MODIFICATION_ALLOWED_ERR = ((ExceptionMessage[7]="No modification allowed"),7);
var NOT_FOUND_ERR               = ExceptionCode.NOT_FOUND_ERR               = ((ExceptionMessage[8]="Not found"),8);
var NOT_SUPPORTED_ERR           = ExceptionCode.NOT_SUPPORTED_ERR           = ((ExceptionMessage[9]="Not supported"),9);
var INUSE_ATTRIBUTE_ERR         = ExceptionCode.INUSE_ATTRIBUTE_ERR         = ((ExceptionMessage[10]="Attribute in use"),10);
//level2
var INVALID_STATE_ERR        	= ExceptionCode.INVALID_STATE_ERR        	= ((ExceptionMessage[11]="Invalid state"),11);
var SYNTAX_ERR               	= ExceptionCode.SYNTAX_ERR               	= ((ExceptionMessage[12]="Syntax error"),12);
var INVALID_MODIFICATION_ERR 	= ExceptionCode.INVALID_MODIFICATION_ERR 	= ((ExceptionMessage[13]="Invalid modification"),13);
var NAMESPACE_ERR            	= ExceptionCode.NAMESPACE_ERR           	= ((ExceptionMessage[14]="Invalid namespace"),14);
var INVALID_ACCESS_ERR       	= ExceptionCode.INVALID_ACCESS_ERR      	= ((ExceptionMessage[15]="Invalid access"),15);


function DOMException(code, message) {
	if(message instanceof Error){
		var error = message;
	}else{
		error = this;
		Error.call(this, ExceptionMessage[code]);
		this.message = ExceptionMessage[code];
		if(Error.captureStackTrace) Error.captureStackTrace(this, DOMException);
	}
	error.code = code;
	if(message) this.message = this.message + ": " + message;
	return error;
};
DOMException.prototype = Error.prototype;
copy(ExceptionCode,DOMException)
/**
 * @see http://www.w3.org/TR/2000/REC-DOM-Level-2-Core-20001113/core.html#ID-536297177
 * The NodeList interface provides the abstraction of an ordered collection of nodes, without defining or constraining how this collection is implemented. NodeList objects in the DOM are live.
 * The items in the NodeList are accessible via an integral index, starting from 0.
 */
function NodeList() {
};
NodeList.prototype = {
	/**
	 * The number of nodes in the list. The range of valid child node indices is 0 to length-1 inclusive.
	 * @standard level1
	 */
	length:0, 
	/**
	 * Returns the indexth item in the collection. If index is greater than or equal to the number of nodes in the list, this returns null.
	 * @standard level1
	 * @param index  unsigned long 
	 *   Index into the collection.
	 * @return Node
	 * 	The node at the indexth position in the NodeList, or null if that is not a valid index. 
	 */
	item: function(index) {
		return this[index] || null;
	},
	toString:function(){
		for(var buf = [], i = 0;i<this.length;i++){
			serializeToString(this[i],buf);
		}
		return buf.join('');
	}
};
function LiveNodeList(node,refresh){
	this._node = node;
	this._refresh = refresh
	_updateLiveList(this);
}
function _updateLiveList(list){
	var inc = list._node._inc || list._node.ownerDocument._inc;
	if(list._inc != inc){
		var ls = list._refresh(list._node);
		//console.log(ls.length)
		__set__(list,'length',ls.length);
		copy(ls,list);
		list._inc = inc;
	}
}
LiveNodeList.prototype.item = function(i){
	_updateLiveList(this);
	return this[i];
}

_extends(LiveNodeList,NodeList);
/**
 * 
 * Objects implementing the NamedNodeMap interface are used to represent collections of nodes that can be accessed by name. Note that NamedNodeMap does not inherit from NodeList; NamedNodeMaps are not maintained in any particular order. Objects contained in an object implementing NamedNodeMap may also be accessed by an ordinal index, but this is simply to allow convenient enumeration of the contents of a NamedNodeMap, and does not imply that the DOM specifies an order to these Nodes.
 * NamedNodeMap objects in the DOM are live.
 * used for attributes or DocumentType entities 
 */
function NamedNodeMap() {
};

function _findNodeIndex(list,node){
	var i = list.length;
	while(i--){
		if(list[i] === node){return i}
	}
}

function _addNamedNode(el,list,newAttr,oldAttr){
	if(oldAttr){
		list[_findNodeIndex(list,oldAttr)] = newAttr;
	}else{
		list[list.length++] = newAttr;
	}
	if(el){
		newAttr.ownerElement = el;
		var doc = el.ownerDocument;
		if(doc){
			oldAttr && _onRemoveAttribute(doc,el,oldAttr);
			_onAddAttribute(doc,el,newAttr);
		}
	}
}
function _removeNamedNode(el,list,attr){
	var i = _findNodeIndex(list,attr);
	if(i>=0){
		var lastIndex = list.length-1
		while(i<lastIndex){
			list[i] = list[++i]
		}
		list.length = lastIndex;
		if(el){
			var doc = el.ownerDocument;
			if(doc){
				_onRemoveAttribute(doc,el,attr);
				attr.ownerElement = null;
			}
		}
	}else{
		throw DOMException(NOT_FOUND_ERR,new Error())
	}
}
NamedNodeMap.prototype = {
	length:0,
	item:NodeList.prototype.item,
	getNamedItem: function(key) {
//		if(key.indexOf(':')>0 || key == 'xmlns'){
//			return null;
//		}
		var i = this.length;
		while(i--){
			var attr = this[i];
			if(attr.nodeName == key){
				return attr;
			}
		}
	},
	setNamedItem: function(attr) {
		var el = attr.ownerElement;
		if(el && el!=this._ownerElement){
			throw new DOMException(INUSE_ATTRIBUTE_ERR);
		}
		var oldAttr = this.getNamedItem(attr.nodeName);
		_addNamedNode(this._ownerElement,this,attr,oldAttr);
		return oldAttr;
	},
	/* returns Node */
	setNamedItemNS: function(attr) {// raises: WRONG_DOCUMENT_ERR,NO_MODIFICATION_ALLOWED_ERR,INUSE_ATTRIBUTE_ERR
		var el = attr.ownerElement, oldAttr;
		if(el && el!=this._ownerElement){
			throw new DOMException(INUSE_ATTRIBUTE_ERR);
		}
		oldAttr = this.getNamedItemNS(attr.namespaceURI,attr.localName);
		_addNamedNode(this._ownerElement,this,attr,oldAttr);
		return oldAttr;
	},

	/* returns Node */
	removeNamedItem: function(key) {
		var attr = this.getNamedItem(key);
		_removeNamedNode(this._ownerElement,this,attr);
		return attr;
		
		
	},// raises: NOT_FOUND_ERR,NO_MODIFICATION_ALLOWED_ERR
	
	//for level2
	removeNamedItemNS:function(namespaceURI,localName){
		var attr = this.getNamedItemNS(namespaceURI,localName);
		_removeNamedNode(this._ownerElement,this,attr);
		return attr;
	},
	getNamedItemNS: function(namespaceURI, localName) {
		var i = this.length;
		while(i--){
			var node = this[i];
			if(node.localName == localName && node.namespaceURI == namespaceURI){
				return node;
			}
		}
		return null;
	}
};
/**
 * @see http://www.w3.org/TR/REC-DOM-Level-1/level-one-core.html#ID-102161490
 */
function DOMImplementation(/* Object */ features) {
	this._features = {};
	if (features) {
		for (var feature in features) {
			 this._features = features[feature];
		}
	}
};

DOMImplementation.prototype = {
	hasFeature: function(/* string */ feature, /* string */ version) {
		var versions = this._features[feature.toLowerCase()];
		if (versions && (!version || version in versions)) {
			return true;
		} else {
			return false;
		}
	},
	// Introduced in DOM Level 2:
	createDocument:function(namespaceURI,  qualifiedName, doctype){// raises:INVALID_CHARACTER_ERR,NAMESPACE_ERR,WRONG_DOCUMENT_ERR
		var doc = new Document();
		doc.implementation = this;
		doc.childNodes = new NodeList();
		doc.doctype = doctype;
		if(doctype){
			doc.appendChild(doctype);
		}
		if(qualifiedName){
			var root = doc.createElementNS(namespaceURI,qualifiedName);
			doc.appendChild(root);
		}
		return doc;
	},
	// Introduced in DOM Level 2:
	createDocumentType:function(qualifiedName, publicId, systemId){// raises:INVALID_CHARACTER_ERR,NAMESPACE_ERR
		var node = new DocumentType();
		node.name = qualifiedName;
		node.nodeName = qualifiedName;
		node.publicId = publicId;
		node.systemId = systemId;
		// Introduced in DOM Level 2:
		//readonly attribute DOMString        internalSubset;
		
		//TODO:..
		//  readonly attribute NamedNodeMap     entities;
		//  readonly attribute NamedNodeMap     notations;
		return node;
	}
};


/**
 * @see http://www.w3.org/TR/2000/REC-DOM-Level-2-Core-20001113/core.html#ID-1950641247
 */

function Node() {
};

Node.prototype = {
	firstChild : null,
	lastChild : null,
	previousSibling : null,
	nextSibling : null,
	attributes : null,
	parentNode : null,
	childNodes : null,
	ownerDocument : null,
	nodeValue : null,
	namespaceURI : null,
	prefix : null,
	localName : null,
	// Modified in DOM Level 2:
	insertBefore:function(newChild, refChild){//raises 
		return _insertBefore(this,newChild,refChild);
	},
	replaceChild:function(newChild, oldChild){//raises 
		this.insertBefore(newChild,oldChild);
		if(oldChild){
			this.removeChild(oldChild);
		}
	},
	removeChild:function(oldChild){
		return _removeChild(this,oldChild);
	},
	appendChild:function(newChild){
		return this.insertBefore(newChild,null);
	},
	hasChildNodes:function(){
		return this.firstChild != null;
	},
	cloneNode:function(deep){
		return cloneNode(this.ownerDocument||this,this,deep);
	},
	// Modified in DOM Level 2:
	normalize:function(){
		var child = this.firstChild;
		while(child){
			var next = child.nextSibling;
			if(next && next.nodeType == TEXT_NODE && child.nodeType == TEXT_NODE){
				this.removeChild(next);
				child.appendData(next.data);
			}else{
				child.normalize();
				child = next;
			}
		}
	},
  	// Introduced in DOM Level 2:
	isSupported:function(feature, version){
		return this.ownerDocument.implementation.hasFeature(feature,version);
	},
    // Introduced in DOM Level 2:
    hasAttributes:function(){
    	return this.attributes.length>0;
    },
    lookupPrefix:function(namespaceURI){
    	var el = this;
    	while(el){
    		var map = el._nsMap;
    		//console.dir(map)
    		if(map){
    			for(var n in map){
    				if(map[n] == namespaceURI){
    					return n;
    				}
    			}
    		}
    		el = el.nodeType == 2?el.ownerDocument : el.parentNode;
    	}
    	return null;
    },
    // Introduced in DOM Level 3:
    lookupNamespaceURI:function(prefix){
    	var el = this;
    	while(el){
    		var map = el._nsMap;
    		//console.dir(map)
    		if(map){
    			if(prefix in map){
    				return map[prefix] ;
    			}
    		}
    		el = el.nodeType == 2?el.ownerDocument : el.parentNode;
    	}
    	return null;
    },
    // Introduced in DOM Level 3:
    isDefaultNamespace:function(namespaceURI){
    	var prefix = this.lookupPrefix(namespaceURI);
    	return prefix == null;
    }
};


function _xmlEncoder(c){
	return c == '<' && '&lt;' ||
         c == '>' && '&gt;' ||
         c == '&' && '&amp;' ||
         c == '"' && '&quot;' ||
         '&#'+c.charCodeAt()+';'
}


copy(NodeType,Node);
copy(NodeType,Node.prototype);

/**
 * @param callback return true for continue,false for break
 * @return boolean true: break visit;
 */
function _visitNode(node,callback){
	if(callback(node)){
		return true;
	}
	if(node = node.firstChild){
		do{
			if(_visitNode(node,callback)){return true}
        }while(node=node.nextSibling)
    }
}



function Document(){
}
function _onAddAttribute(doc,el,newAttr){
	doc && doc._inc++;
	var ns = newAttr.namespaceURI ;
	if(ns == 'http://www.w3.org/2000/xmlns/'){
		//update namespace
		el._nsMap[newAttr.prefix?newAttr.localName:''] = newAttr.value
	}
}
function _onRemoveAttribute(doc,el,newAttr,remove){
	doc && doc._inc++;
	var ns = newAttr.namespaceURI ;
	if(ns == 'http://www.w3.org/2000/xmlns/'){
		//update namespace
		delete el._nsMap[newAttr.prefix?newAttr.localName:'']
	}
}
function _onUpdateChild(doc,el,newChild){
	if(doc && doc._inc){
		doc._inc++;
		//update childNodes
		var cs = el.childNodes;
		if(newChild){
			cs[cs.length++] = newChild;
		}else{
			//console.log(1)
			var child = el.firstChild;
			var i = 0;
			while(child){
				cs[i++] = child;
				child =child.nextSibling;
			}
			cs.length = i;
		}
	}
}

/**
 * attributes;
 * children;
 * 
 * writeable properties:
 * nodeValue,Attr:value,CharacterData:data
 * prefix
 */
function _removeChild(parentNode,child){
	var previous = child.previousSibling;
	var next = child.nextSibling;
	if(previous){
		previous.nextSibling = next;
	}else{
		parentNode.firstChild = next
	}
	if(next){
		next.previousSibling = previous;
	}else{
		parentNode.lastChild = previous;
	}
	_onUpdateChild(parentNode.ownerDocument,parentNode);
	return child;
}
/**
 * preformance key(refChild == null)
 */
function _insertBefore(parentNode,newChild,nextChild){
	var cp = newChild.parentNode;
	if(cp){
		cp.removeChild(newChild);//remove and update
	}
	if(newChild.nodeType === DOCUMENT_FRAGMENT_NODE){
		var newFirst = newChild.firstChild;
		if (newFirst == null) {
			return newChild;
		}
		var newLast = newChild.lastChild;
	}else{
		newFirst = newLast = newChild;
	}
	var pre = nextChild ? nextChild.previousSibling : parentNode.lastChild;

	newFirst.previousSibling = pre;
	newLast.nextSibling = nextChild;
	
	
	if(pre){
		pre.nextSibling = newFirst;
	}else{
		parentNode.firstChild = newFirst;
	}
	if(nextChild == null){
		parentNode.lastChild = newLast;
	}else{
		nextChild.previousSibling = newLast;
	}
	do{
		newFirst.parentNode = parentNode;
	}while(newFirst !== newLast && (newFirst= newFirst.nextSibling))
	_onUpdateChild(parentNode.ownerDocument||parentNode,parentNode);
	//console.log(parentNode.lastChild.nextSibling == null)
	if (newChild.nodeType == DOCUMENT_FRAGMENT_NODE) {
		newChild.firstChild = newChild.lastChild = null;
	}
	return newChild;
}
function _appendSingleChild(parentNode,newChild){
	var cp = newChild.parentNode;
	if(cp){
		var pre = parentNode.lastChild;
		cp.removeChild(newChild);//remove and update
		var pre = parentNode.lastChild;
	}
	var pre = parentNode.lastChild;
	newChild.parentNode = parentNode;
	newChild.previousSibling = pre;
	newChild.nextSibling = null;
	if(pre){
		pre.nextSibling = newChild;
	}else{
		parentNode.firstChild = newChild;
	}
	parentNode.lastChild = newChild;
	_onUpdateChild(parentNode.ownerDocument,parentNode,newChild);
	return newChild;
	//console.log("__aa",parentNode.lastChild.nextSibling == null)
}
Document.prototype = {
	//implementation : null,
	nodeName :  '#document',
	nodeType :  DOCUMENT_NODE,
	doctype :  null,
	documentElement :  null,
	_inc : 1,
	
	insertBefore :  function(newChild, refChild){//raises 
		if(newChild.nodeType == DOCUMENT_FRAGMENT_NODE){
			var child = newChild.firstChild;
			while(child){
				var next = child.nextSibling;
				this.insertBefore(child,refChild);
				child = next;
			}
			return newChild;
		}
		if(this.documentElement == null && newChild.nodeType == 1){
			this.documentElement = newChild;
		}
		
		return _insertBefore(this,newChild,refChild),(newChild.ownerDocument = this),newChild;
	},
	removeChild :  function(oldChild){
		if(this.documentElement == oldChild){
			this.documentElement = null;
		}
		return _removeChild(this,oldChild);
	},
	// Introduced in DOM Level 2:
	importNode : function(importedNode,deep){
		return importNode(this,importedNode,deep);
	},
	// Introduced in DOM Level 2:
	getElementById :	function(id){
		var rtv = null;
		_visitNode(this.documentElement,function(node){
			if(node.nodeType == 1){
				if(node.getAttribute('id') == id){
					rtv = node;
					return true;
				}
			}
		})
		return rtv;
	},
	
	//document factory method:
	createElement :	function(tagName){
		var node = new Element();
		node.ownerDocument = this;
		node.nodeName = tagName;
		node.tagName = tagName;
		node.childNodes = new NodeList();
		var attrs	= node.attributes = new NamedNodeMap();
		attrs._ownerElement = node;
		return node;
	},
	createDocumentFragment :	function(){
		var node = new DocumentFragment();
		node.ownerDocument = this;
		node.childNodes = new NodeList();
		return node;
	},
	createTextNode :	function(data){
		var node = new Text();
		node.ownerDocument = this;
		node.appendData(data)
		return node;
	},
	createComment :	function(data){
		var node = new Comment();
		node.ownerDocument = this;
		node.appendData(data)
		return node;
	},
	createCDATASection :	function(data){
		var node = new CDATASection();
		node.ownerDocument = this;
		node.appendData(data)
		return node;
	},
	createProcessingInstruction :	function(target,data){
		var node = new ProcessingInstruction();
		node.ownerDocument = this;
		node.tagName = node.target = target;
		node.nodeValue= node.data = data;
		return node;
	},
	createAttribute :	function(name){
		var node = new Attr();
		node.ownerDocument	= this;
		node.name = name;
		node.nodeName	= name;
		node.localName = name;
		node.specified = true;
		return node;
	},
	createEntityReference :	function(name){
		var node = new EntityReference();
		node.ownerDocument	= this;
		node.nodeName	= name;
		return node;
	},
	// Introduced in DOM Level 2:
	createElementNS :	function(namespaceURI,qualifiedName){
		var node = new Element();
		var pl = qualifiedName.split(':');
		var attrs	= node.attributes = new NamedNodeMap();
		node.childNodes = new NodeList();
		node.ownerDocument = this;
		node.nodeName = qualifiedName;
		node.tagName = qualifiedName;
		node.namespaceURI = namespaceURI;
		if(pl.length == 2){
			node.prefix = pl[0];
			node.localName = pl[1];
		}else{
			//el.prefix = null;
			node.localName = qualifiedName;
		}
		attrs._ownerElement = node;
		return node;
	},
	// Introduced in DOM Level 2:
	createAttributeNS :	function(namespaceURI,qualifiedName){
		var node = new Attr();
		var pl = qualifiedName.split(':');
		node.ownerDocument = this;
		node.nodeName = qualifiedName;
		node.name = qualifiedName;
		node.namespaceURI = namespaceURI;
		node.specified = true;
		if(pl.length == 2){
			node.prefix = pl[0];
			node.localName = pl[1];
		}else{
			//el.prefix = null;
			node.localName = qualifiedName;
		}
		return node;
	}
};
_extends(Document,Node);


function Element() {
	this._nsMap = {};
};
Element.prototype = {
	nodeType : ELEMENT_NODE,
	hasAttribute : function(name){
		return this.getAttributeNode(name)!=null;
	},
	getAttribute : function(name){
		var attr = this.getAttributeNode(name);
		return attr && attr.value || '';
	},
	getAttributeNode : function(name){
		return this.attributes.getNamedItem(name);
	},
	setAttribute : function(name, value){
		var attr = this.ownerDocument.createAttribute(name);
		attr.value = attr.nodeValue = "" + value;
		this.setAttributeNode(attr)
	},
	removeAttribute : function(name){
		var attr = this.getAttributeNode(name)
		attr && this.removeAttributeNode(attr);
	},
	
	//four real opeartion method
	appendChild:function(newChild){
		if(newChild.nodeType === DOCUMENT_FRAGMENT_NODE){
			return this.insertBefore(newChild,null);
		}else{
			return _appendSingleChild(this,newChild);
		}
	},
	setAttributeNode : function(newAttr){
		return this.attributes.setNamedItem(newAttr);
	},
	setAttributeNodeNS : function(newAttr){
		return this.attributes.setNamedItemNS(newAttr);
	},
	removeAttributeNode : function(oldAttr){
		return this.attributes.removeNamedItem(oldAttr.nodeName);
	},
	//get real attribute name,and remove it by removeAttributeNode
	removeAttributeNS : function(namespaceURI, localName){
		var old = this.getAttributeNodeNS(namespaceURI, localName);
		old && this.removeAttributeNode(old);
	},
	
	hasAttributeNS : function(namespaceURI, localName){
		return this.getAttributeNodeNS(namespaceURI, localName)!=null;
	},
	getAttributeNS : function(namespaceURI, localName){
		var attr = this.getAttributeNodeNS(namespaceURI, localName);
		return attr && attr.value || '';
	},
	setAttributeNS : function(namespaceURI, qualifiedName, value){
		var attr = this.ownerDocument.createAttributeNS(namespaceURI, qualifiedName);
		attr.value = attr.nodeValue = "" + value;
		this.setAttributeNode(attr)
	},
	getAttributeNodeNS : function(namespaceURI, localName){
		return this.attributes.getNamedItemNS(namespaceURI, localName);
	},
	
	getElementsByTagName : function(tagName){
		return new LiveNodeList(this,function(base){
			var ls = [];
			_visitNode(base,function(node){
				if(node !== base && node.nodeType == ELEMENT_NODE && (tagName === '*' || node.tagName == tagName)){
					ls.push(node);
				}
			});
			return ls;
		});
	},
	getElementsByTagNameNS : function(namespaceURI, localName){
		return new LiveNodeList(this,function(base){
			var ls = [];
			_visitNode(base,function(node){
				if(node !== base && node.nodeType === ELEMENT_NODE && (namespaceURI === '*' || node.namespaceURI === namespaceURI) && (localName === '*' || node.localName == localName)){
					ls.push(node);
				}
			});
			return ls;
		});
	}
};
Document.prototype.getElementsByTagName = Element.prototype.getElementsByTagName;
Document.prototype.getElementsByTagNameNS = Element.prototype.getElementsByTagNameNS;


_extends(Element,Node);
function Attr() {
};
Attr.prototype.nodeType = ATTRIBUTE_NODE;
_extends(Attr,Node);


function CharacterData() {
};
CharacterData.prototype = {
	data : '',
	substringData : function(offset, count) {
		return this.data.substring(offset, offset+count);
	},
	appendData: function(text) {
		text = this.data+text;
		this.nodeValue = this.data = text;
		this.length = text.length;
	},
	insertData: function(offset,text) {
		this.replaceData(offset,0,text);
	
	},
	appendChild:function(newChild){
		//if(!(newChild instanceof CharacterData)){
			throw new Error(ExceptionMessage[3])
		//}
		return Node.prototype.appendChild.apply(this,arguments)
	},
	deleteData: function(offset, count) {
		this.replaceData(offset,count,"");
	},
	replaceData: function(offset, count, text) {
		var start = this.data.substring(0,offset);
		var end = this.data.substring(offset+count);
		text = start + text + end;
		this.nodeValue = this.data = text;
		this.length = text.length;
	}
}
_extends(CharacterData,Node);
function Text() {
};
Text.prototype = {
	nodeName : "#text",
	nodeType : TEXT_NODE,
	splitText : function(offset) {
		var text = this.data;
		var newText = text.substring(offset);
		text = text.substring(0, offset);
		this.data = this.nodeValue = text;
		this.length = text.length;
		var newNode = this.ownerDocument.createTextNode(newText);
		if(this.parentNode){
			this.parentNode.insertBefore(newNode, this.nextSibling);
		}
		return newNode;
	}
}
_extends(Text,CharacterData);
function Comment() {
};
Comment.prototype = {
	nodeName : "#comment",
	nodeType : COMMENT_NODE
}
_extends(Comment,CharacterData);

function CDATASection() {
};
CDATASection.prototype = {
	nodeName : "#cdata-section",
	nodeType : CDATA_SECTION_NODE
}
_extends(CDATASection,CharacterData);


function DocumentType() {
};
DocumentType.prototype.nodeType = DOCUMENT_TYPE_NODE;
_extends(DocumentType,Node);

function Notation() {
};
Notation.prototype.nodeType = NOTATION_NODE;
_extends(Notation,Node);

function Entity() {
};
Entity.prototype.nodeType = ENTITY_NODE;
_extends(Entity,Node);

function EntityReference() {
};
EntityReference.prototype.nodeType = ENTITY_REFERENCE_NODE;
_extends(EntityReference,Node);

function DocumentFragment() {
};
DocumentFragment.prototype.nodeName =	"#document-fragment";
DocumentFragment.prototype.nodeType =	DOCUMENT_FRAGMENT_NODE;
_extends(DocumentFragment,Node);


function ProcessingInstruction() {
}
ProcessingInstruction.prototype.nodeType = PROCESSING_INSTRUCTION_NODE;
_extends(ProcessingInstruction,Node);
function XMLSerializer(){}
XMLSerializer.prototype.serializeToString = function(node,attributeSorter){
	return node.toString(attributeSorter);
}
Node.prototype.toString =function(attributeSorter){
	var buf = [];
	serializeToString(this,buf,attributeSorter);
	return buf.join('');
}
function serializeToString(node,buf,attributeSorter,isHTML){
	switch(node.nodeType){
	case ELEMENT_NODE:
		var attrs = node.attributes;
		var len = attrs.length;
		var child = node.firstChild;
		var nodeName = node.tagName;
		isHTML =  (htmlns === node.namespaceURI) ||isHTML 
		buf.push('<',nodeName);
		if(attributeSorter){
			buf.sort.apply(attrs, attributeSorter);
		}
		for(var i=0;i<len;i++){
			serializeToString(attrs.item(i),buf,attributeSorter,isHTML);
		}
		if(child || isHTML && !/^(?:meta|link|img|br|hr|input|button)$/i.test(nodeName)){
			buf.push('>');
			//if is cdata child node
			if(isHTML && /^script$/i.test(nodeName)){
				if(child){
					buf.push(child.data);
				}
			}else{
				while(child){
					serializeToString(child,buf,attributeSorter,isHTML);
					child = child.nextSibling;
				}
			}
			buf.push('</',nodeName,'>');
		}else{
			buf.push('/>');
		}
		return;
	case DOCUMENT_NODE:
	case DOCUMENT_FRAGMENT_NODE:
		var child = node.firstChild;
		while(child){
			serializeToString(child,buf,attributeSorter,isHTML);
			child = child.nextSibling;
		}
		return;
	case ATTRIBUTE_NODE:
		return buf.push(' ',node.name,'="',node.value.replace(/[<&"]/g,_xmlEncoder),'"');
	case TEXT_NODE:
		return buf.push(node.data.replace(/[<&]/g,_xmlEncoder));
	case CDATA_SECTION_NODE:
		return buf.push( '<![CDATA[',node.data,']]>');
	case COMMENT_NODE:
		return buf.push( "<!--",node.data,"-->");
	case DOCUMENT_TYPE_NODE:
		var pubid = node.publicId;
		var sysid = node.systemId;
		buf.push('<!DOCTYPE ',node.name);
		if(pubid){
			buf.push(' PUBLIC "',pubid);
			if (sysid && sysid!='.') {
				buf.push( '" "',sysid);
			}
			buf.push('">');
		}else if(sysid && sysid!='.'){
			buf.push(' SYSTEM "',sysid,'">');
		}else{
			var sub = node.internalSubset;
			if(sub){
				buf.push(" [",sub,"]");
			}
			buf.push(">");
		}
		return;
	case PROCESSING_INSTRUCTION_NODE:
		return buf.push( "<?",node.target," ",node.data,"?>");
	case ENTITY_REFERENCE_NODE:
		return buf.push( '&',node.nodeName,';');
	//case ENTITY_NODE:
	//case NOTATION_NODE:
	default:
		buf.push('??',node.nodeName);
	}
}
function importNode(doc,node,deep){
	var node2;
	switch (node.nodeType) {
	case ELEMENT_NODE:
		node2 = node.cloneNode(false);
		node2.ownerDocument = doc;
		//var attrs = node2.attributes;
		//var len = attrs.length;
		//for(var i=0;i<len;i++){
			//node2.setAttributeNodeNS(importNode(doc,attrs.item(i),deep));
		//}
	case DOCUMENT_FRAGMENT_NODE:
		break;
	case ATTRIBUTE_NODE:
		deep = true;
		break;
	//case ENTITY_REFERENCE_NODE:
	//case PROCESSING_INSTRUCTION_NODE:
	////case TEXT_NODE:
	//case CDATA_SECTION_NODE:
	//case COMMENT_NODE:
	//	deep = false;
	//	break;
	//case DOCUMENT_NODE:
	//case DOCUMENT_TYPE_NODE:
	//cannot be imported.
	//case ENTITY_NODE:
	//case NOTATION_NODE：
	//can not hit in level3
	//default:throw e;
	}
	if(!node2){
		node2 = node.cloneNode(false);//false
	}
	node2.ownerDocument = doc;
	node2.parentNode = null;
	if(deep){
		var child = node.firstChild;
		while(child){
			node2.appendChild(importNode(doc,child,deep));
			child = child.nextSibling;
		}
	}
	return node2;
}
//
//var _relationMap = {firstChild:1,lastChild:1,previousSibling:1,nextSibling:1,
//					attributes:1,childNodes:1,parentNode:1,documentElement:1,doctype,};
function cloneNode(doc,node,deep){
	var node2 = new node.constructor();
	for(var n in node){
		var v = node[n];
		if(typeof v != 'object' ){
			if(v != node2[n]){
				node2[n] = v;
			}
		}
	}
	if(node.childNodes){
		node2.childNodes = new NodeList();
	}
	node2.ownerDocument = doc;
	switch (node2.nodeType) {
	case ELEMENT_NODE:
		var attrs	= node.attributes;
		var attrs2	= node2.attributes = new NamedNodeMap();
		var len = attrs.length
		attrs2._ownerElement = node2;
		for(var i=0;i<len;i++){
			node2.setAttributeNode(cloneNode(doc,attrs.item(i),true));
		}
		break;;
	case ATTRIBUTE_NODE:
		deep = true;
	}
	if(deep){
		var child = node.firstChild;
		while(child){
			node2.appendChild(cloneNode(doc,child,deep));
			child = child.nextSibling;
		}
	}
	return node2;
}

function __set__(object,key,value){
	object[key] = value
}
//do dynamic
try{
	if(Object.defineProperty){
		Object.defineProperty(LiveNodeList.prototype,'length',{
			get:function(){
				_updateLiveList(this);
				return this.$$length;
			}
		});
		Object.defineProperty(Node.prototype,'textContent',{
			get:function(){
				return getTextContent(this);
			},
			set:function(data){
				switch(this.nodeType){
				case 1:
				case 11:
					while(this.firstChild){
						this.removeChild(this.firstChild);
					}
					if(data || String(data)){
						this.appendChild(this.ownerDocument.createTextNode(data));
					}
					break;
				default:
					//TODO:
					this.data = data;
					this.value = value;
					this.nodeValue = data;
				}
			}
		})
		
		function getTextContent(node){
			switch(node.nodeType){
			case 1:
			case 11:
				var buf = [];
				node = node.firstChild;
				while(node){
					if(node.nodeType!==7 && node.nodeType !==8){
						buf.push(getTextContent(node));
					}
					node = node.nextSibling;
				}
				return buf.join('');
			default:
				return node.nodeValue;
			}
		}
		__set__ = function(object,key,value){
			//console.log(value)
			object['$$'+key] = value
		}
	}
}catch(e){//ie8
}

if(typeof require == 'function'){
	exports.DOMImplementation = DOMImplementation;
	exports.XMLSerializer = XMLSerializer;
}

},{}],41:[function(require,module,exports){
//[4]   	NameStartChar	   ::=   	":" | [A-Z] | "_" | [a-z] | [#xC0-#xD6] | [#xD8-#xF6] | [#xF8-#x2FF] | [#x370-#x37D] | [#x37F-#x1FFF] | [#x200C-#x200D] | [#x2070-#x218F] | [#x2C00-#x2FEF] | [#x3001-#xD7FF] | [#xF900-#xFDCF] | [#xFDF0-#xFFFD] | [#x10000-#xEFFFF]
//[4a]   	NameChar	   ::=   	NameStartChar | "-" | "." | [0-9] | #xB7 | [#x0300-#x036F] | [#x203F-#x2040]
//[5]   	Name	   ::=   	NameStartChar (NameChar)*
var nameStartChar = /[A-Z_a-z\xC0-\xD6\xD8-\xF6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]///\u10000-\uEFFFF
var nameChar = new RegExp("[\\-\\.0-9"+nameStartChar.source.slice(1,-1)+"\u00B7\u0300-\u036F\\u203F-\u2040]");
var tagNamePattern = new RegExp('^'+nameStartChar.source+nameChar.source+'*(?:\:'+nameStartChar.source+nameChar.source+'*)?$');
//var tagNamePattern = /^[a-zA-Z_][\w\-\.]*(?:\:[a-zA-Z_][\w\-\.]*)?$/
//var handlers = 'resolveEntity,getExternalSubset,characters,endDocument,endElement,endPrefixMapping,ignorableWhitespace,processingInstruction,setDocumentLocator,skippedEntity,startDocument,startElement,startPrefixMapping,notationDecl,unparsedEntityDecl,error,fatalError,warning,attributeDecl,elementDecl,externalEntityDecl,internalEntityDecl,comment,endCDATA,endDTD,endEntity,startCDATA,startDTD,startEntity'.split(',')

//S_TAG,	S_ATTR,	S_EQ,	S_V
//S_ATTR_S,	S_E,	S_S,	S_C
var S_TAG = 0;//tag name offerring
var S_ATTR = 1;//attr name offerring 
var S_ATTR_S=2;//attr name end and space offer
var S_EQ = 3;//=space?
var S_V = 4;//attr value(no quot value only)
var S_E = 5;//attr value end and no space(quot end)
var S_S = 6;//(attr value end || tag end ) && (space offer)
var S_C = 7;//closed el<el />

function XMLReader(){
	
}

XMLReader.prototype = {
	parse:function(source,defaultNSMap,entityMap){
		var domBuilder = this.domBuilder;
		domBuilder.startDocument();
		_copy(defaultNSMap ,defaultNSMap = {})
		parse(source,defaultNSMap,entityMap,
				domBuilder,this.errorHandler);
		domBuilder.endDocument();
	}
}
function parse(source,defaultNSMapCopy,entityMap,domBuilder,errorHandler){
  function fixedFromCharCode(code) {
		// String.prototype.fromCharCode does not supports
		// > 2 bytes unicode chars directly
		if (code > 0xffff) {
			code -= 0x10000;
			var surrogate1 = 0xd800 + (code >> 10)
				, surrogate2 = 0xdc00 + (code & 0x3ff);

			return String.fromCharCode(surrogate1, surrogate2);
		} else {
			return String.fromCharCode(code);
		}
	}
	function entityReplacer(a){
		var k = a.slice(1,-1);
		if(k in entityMap){
			return entityMap[k]; 
		}else if(k.charAt(0) === '#'){
			return fixedFromCharCode(parseInt(k.substr(1).replace('x','0x')))
		}else{
			errorHandler.error('entity not found:'+a);
			return a;
		}
	}
	function appendText(end){//has some bugs
		if(end>start){
			var xt = source.substring(start,end).replace(/&#?\w+;/g,entityReplacer);
			locator&&position(start);
			domBuilder.characters(xt,0,end-start);
			start = end
		}
	}
	function position(p,m){
		while(p>=lineEnd && (m = linePattern.exec(source))){
			lineStart = m.index;
			lineEnd = lineStart + m[0].length;
			locator.lineNumber++;
			//console.log('line++:',locator,startPos,endPos)
		}
		locator.columnNumber = p-lineStart+1;
	}
	var lineStart = 0;
	var lineEnd = 0;
	var linePattern = /.+(?:\r\n?|\n)|.*$/g
	var locator = domBuilder.locator;
	
	var parseStack = [{currentNSMap:defaultNSMapCopy}]
	var closeMap = {};
	var start = 0;
	while(true){
		try{
			var tagStart = source.indexOf('<',start);
			if(tagStart<0){
				if(!source.substr(start).match(/^\s*$/)){
					var doc = domBuilder.document;
	    			var text = doc.createTextNode(source.substr(start));
	    			doc.appendChild(text);
	    			domBuilder.currentElement = text;
				}
				return;
			}
			if(tagStart>start){
				appendText(tagStart);
			}
			switch(source.charAt(tagStart+1)){
			case '/':
				var end = source.indexOf('>',tagStart+3);
				var tagName = source.substring(tagStart+2,end);
				var config = parseStack.pop();
				var localNSMap = config.localNSMap;
		        if(config.tagName != tagName){
		            errorHandler.fatalError("end tag name: "+tagName+' is not match the current start tagName:'+config.tagName );
		        }
				domBuilder.endElement(config.uri,config.localName,tagName);
				if(localNSMap){
					for(var prefix in localNSMap){
						domBuilder.endPrefixMapping(prefix) ;
					}
				}
				end++;
				break;
				// end elment
			case '?':// <?...?>
				locator&&position(tagStart);
				end = parseInstruction(source,tagStart,domBuilder);
				break;
			case '!':// <!doctype,<![CDATA,<!--
				locator&&position(tagStart);
				end = parseDCC(source,tagStart,domBuilder,errorHandler);
				break;
			default:
			
				locator&&position(tagStart);
				
				var el = new ElementAttributes();
				
				//elStartEnd
				var end = parseElementStartPart(source,tagStart,el,entityReplacer,errorHandler);
				var len = el.length;
				
				if(locator){
					if(len){
						//attribute position fixed
						for(var i = 0;i<len;i++){
							var a = el[i];
							position(a.offset);
							a.offset = copyLocator(locator,{});
						}
					}
					position(end);
				}
				if(!el.closed && fixSelfClosed(source,end,el.tagName,closeMap)){
					el.closed = true;
					if(!entityMap.nbsp){
						errorHandler.warning('unclosed xml attribute');
					}
				}
				appendElement(el,domBuilder,parseStack);
				
				
				if(el.uri === 'http://www.w3.org/1999/xhtml' && !el.closed){
					end = parseHtmlSpecialContent(source,end,el.tagName,entityReplacer,domBuilder)
				}else{
					end++;
				}
			}
		}catch(e){
			errorHandler.error('element parse error: '+e);
			end = -1;
		}
		if(end>start){
			start = end;
		}else{
			//TODO: 这里有可能sax回退，有位置错误风险
			appendText(Math.max(tagStart,start)+1);
		}
	}
}
function copyLocator(f,t){
	t.lineNumber = f.lineNumber;
	t.columnNumber = f.columnNumber;
	return t;
}

/**
 * @see #appendElement(source,elStartEnd,el,selfClosed,entityReplacer,domBuilder,parseStack);
 * @return end of the elementStartPart(end of elementEndPart for selfClosed el)
 */
function parseElementStartPart(source,start,el,entityReplacer,errorHandler){
	var attrName;
	var value;
	var p = ++start;
	var s = S_TAG;//status
	while(true){
		var c = source.charAt(p);
		switch(c){
		case '=':
			if(s === S_ATTR){//attrName
				attrName = source.slice(start,p);
				s = S_EQ;
			}else if(s === S_ATTR_S){
				s = S_EQ;
			}else{
				//fatalError: equal must after attrName or space after attrName
				throw new Error('attribute equal must after attrName');
			}
			break;
		case '\'':
		case '"':
			if(s === S_EQ){//equal
				start = p+1;
				p = source.indexOf(c,start)
				if(p>0){
					value = source.slice(start,p).replace(/&#?\w+;/g,entityReplacer);
					el.add(attrName,value,start-1);
					s = S_E;
				}else{
					//fatalError: no end quot match
					throw new Error('attribute value no end \''+c+'\' match');
				}
			}else if(s == S_V){
				value = source.slice(start,p).replace(/&#?\w+;/g,entityReplacer);
				//console.log(attrName,value,start,p)
				el.add(attrName,value,start);
				//console.dir(el)
				errorHandler.warning('attribute "'+attrName+'" missed start quot('+c+')!!');
				start = p+1;
				s = S_E
			}else{
				//fatalError: no equal before
				throw new Error('attribute value must after "="');
			}
			break;
		case '/':
			switch(s){
			case S_TAG:
				el.setTagName(source.slice(start,p));
			case S_E:
			case S_S:
			case S_C:
				s = S_C;
				el.closed = true;
			case S_V:
			case S_ATTR:
			case S_ATTR_S:
				break;
			//case S_EQ:
			default:
				throw new Error("attribute invalid close char('/')")
			}
			break;
		case ''://end document
			//throw new Error('unexpected end of input')
			errorHandler.error('unexpected end of input');
		case '>':
			switch(s){
			case S_TAG:
				el.setTagName(source.slice(start,p));
			case S_E:
			case S_S:
			case S_C:
				break;//normal
			case S_V://Compatible state
			case S_ATTR:
				value = source.slice(start,p);
				if(value.slice(-1) === '/'){
					el.closed  = true;
					value = value.slice(0,-1)
				}
			case S_ATTR_S:
				if(s === S_ATTR_S){
					value = attrName;
				}
				if(s == S_V){
					errorHandler.warning('attribute "'+value+'" missed quot(")!!');
					el.add(attrName,value.replace(/&#?\w+;/g,entityReplacer),start)
				}else{
					errorHandler.warning('attribute "'+value+'" missed value!! "'+value+'" instead!!')
					el.add(value,value,start)
				}
				break;
			case S_EQ:
				throw new Error('attribute value missed!!');
			}
//			console.log(tagName,tagNamePattern,tagNamePattern.test(tagName))
			return p;
		/*xml space '\x20' | #x9 | #xD | #xA; */
		case '\u0080':
			c = ' ';
		default:
			if(c<= ' '){//space
				switch(s){
				case S_TAG:
					el.setTagName(source.slice(start,p));//tagName
					s = S_S;
					break;
				case S_ATTR:
					attrName = source.slice(start,p)
					s = S_ATTR_S;
					break;
				case S_V:
					var value = source.slice(start,p).replace(/&#?\w+;/g,entityReplacer);
					errorHandler.warning('attribute "'+value+'" missed quot(")!!');
					el.add(attrName,value,start)
				case S_E:
					s = S_S;
					break;
				//case S_S:
				//case S_EQ:
				//case S_ATTR_S:
				//	void();break;
				//case S_C:
					//ignore warning
				}
			}else{//not space
//S_TAG,	S_ATTR,	S_EQ,	S_V
//S_ATTR_S,	S_E,	S_S,	S_C
				switch(s){
				//case S_TAG:void();break;
				//case S_ATTR:void();break;
				//case S_V:void();break;
				case S_ATTR_S:
					errorHandler.warning('attribute "'+attrName+'" missed value!! "'+attrName+'" instead!!')
					el.add(attrName,attrName,start);
					start = p;
					s = S_ATTR;
					break;
				case S_E:
					errorHandler.warning('attribute space is required"'+attrName+'"!!')
				case S_S:
					s = S_ATTR;
					start = p;
					break;
				case S_EQ:
					s = S_V;
					start = p;
					break;
				case S_C:
					throw new Error("elements closed character '/' and '>' must be connected to");
				}
			}
		}
		p++;
	}
}
/**
 * @return end of the elementStartPart(end of elementEndPart for selfClosed el)
 */
function appendElement(el,domBuilder,parseStack){
	var tagName = el.tagName;
	var localNSMap = null;
	var currentNSMap = parseStack[parseStack.length-1].currentNSMap;
	var i = el.length;
	while(i--){
		var a = el[i];
		var qName = a.qName;
		var value = a.value;
		var nsp = qName.indexOf(':');
		if(nsp>0){
			var prefix = a.prefix = qName.slice(0,nsp);
			var localName = qName.slice(nsp+1);
			var nsPrefix = prefix === 'xmlns' && localName
		}else{
			localName = qName;
			prefix = null
			nsPrefix = qName === 'xmlns' && ''
		}
		//can not set prefix,because prefix !== ''
		a.localName = localName ;
		//prefix == null for no ns prefix attribute 
		if(nsPrefix !== false){//hack!!
			if(localNSMap == null){
				localNSMap = {}
				//console.log(currentNSMap,0)
				_copy(currentNSMap,currentNSMap={})
				//console.log(currentNSMap,1)
			}
			currentNSMap[nsPrefix] = localNSMap[nsPrefix] = value;
			a.uri = 'http://www.w3.org/2000/xmlns/'
			domBuilder.startPrefixMapping(nsPrefix, value) 
		}
	}
	var i = el.length;
	while(i--){
		a = el[i];
		var prefix = a.prefix;
		if(prefix){//no prefix attribute has no namespace
			if(prefix === 'xml'){
				a.uri = 'http://www.w3.org/XML/1998/namespace';
			}if(prefix !== 'xmlns'){
				a.uri = currentNSMap[prefix]
				
				//{console.log('###'+a.qName,domBuilder.locator.systemId+'',currentNSMap,a.uri)}
			}
		}
	}
	var nsp = tagName.indexOf(':');
	if(nsp>0){
		prefix = el.prefix = tagName.slice(0,nsp);
		localName = el.localName = tagName.slice(nsp+1);
	}else{
		prefix = null;//important!!
		localName = el.localName = tagName;
	}
	//no prefix element has default namespace
	var ns = el.uri = currentNSMap[prefix || ''];
	domBuilder.startElement(ns,localName,tagName,el);
	//endPrefixMapping and startPrefixMapping have not any help for dom builder
	//localNSMap = null
	if(el.closed){
		domBuilder.endElement(ns,localName,tagName);
		if(localNSMap){
			for(prefix in localNSMap){
				domBuilder.endPrefixMapping(prefix) 
			}
		}
	}else{
		el.currentNSMap = currentNSMap;
		el.localNSMap = localNSMap;
		parseStack.push(el);
	}
}
function parseHtmlSpecialContent(source,elStartEnd,tagName,entityReplacer,domBuilder){
	if(/^(?:script|textarea)$/i.test(tagName)){
		var elEndStart =  source.indexOf('</'+tagName+'>',elStartEnd);
		var text = source.substring(elStartEnd+1,elEndStart);
		if(/[&<]/.test(text)){
			if(/^script$/i.test(tagName)){
				//if(!/\]\]>/.test(text)){
					//lexHandler.startCDATA();
					domBuilder.characters(text,0,text.length);
					//lexHandler.endCDATA();
					return elEndStart;
				//}
			}//}else{//text area
				text = text.replace(/&#?\w+;/g,entityReplacer);
				domBuilder.characters(text,0,text.length);
				return elEndStart;
			//}
			
		}
	}
	return elStartEnd+1;
}
function fixSelfClosed(source,elStartEnd,tagName,closeMap){
	//if(tagName in closeMap){
	var pos = closeMap[tagName];
	if(pos == null){
		//console.log(tagName)
		pos = closeMap[tagName] = source.lastIndexOf('</'+tagName+'>')
	}
	return pos<elStartEnd;
	//} 
}
function _copy(source,target){
	for(var n in source){target[n] = source[n]}
}
function parseDCC(source,start,domBuilder,errorHandler){//sure start with '<!'
	var next= source.charAt(start+2)
	switch(next){
	case '-':
		if(source.charAt(start + 3) === '-'){
			var end = source.indexOf('-->',start+4);
			//append comment source.substring(4,end)//<!--
			if(end>start){
				domBuilder.comment(source,start+4,end-start-4);
				return end+3;
			}else{
				errorHandler.error("Unclosed comment");
				return -1;
			}
		}else{
			//error
			return -1;
		}
	default:
		if(source.substr(start+3,6) == 'CDATA['){
			var end = source.indexOf(']]>',start+9);
			domBuilder.startCDATA();
			domBuilder.characters(source,start+9,end-start-9);
			domBuilder.endCDATA() 
			return end+3;
		}
		//<!DOCTYPE
		//startDTD(java.lang.String name, java.lang.String publicId, java.lang.String systemId) 
		var matchs = split(source,start);
		var len = matchs.length;
		if(len>1 && /!doctype/i.test(matchs[0][0])){
			var name = matchs[1][0];
			var pubid = len>3 && /^public$/i.test(matchs[2][0]) && matchs[3][0]
			var sysid = len>4 && matchs[4][0];
			var lastMatch = matchs[len-1]
			domBuilder.startDTD(name,pubid && pubid.replace(/^(['"])(.*?)\1$/,'$2'),
					sysid && sysid.replace(/^(['"])(.*?)\1$/,'$2'));
			domBuilder.endDTD();
			
			return lastMatch.index+lastMatch[0].length
		}
	}
	return -1;
}



function parseInstruction(source,start,domBuilder){
	var end = source.indexOf('?>',start);
	if(end){
		var match = source.substring(start,end).match(/^<\?(\S*)\s*([\s\S]*?)\s*$/);
		if(match){
			var len = match[0].length;
			domBuilder.processingInstruction(match[1], match[2]) ;
			return end+2;
		}else{//error
			return -1;
		}
	}
	return -1;
}

/**
 * @param source
 */
function ElementAttributes(source){
	
}
ElementAttributes.prototype = {
	setTagName:function(tagName){
		if(!tagNamePattern.test(tagName)){
			throw new Error('invalid tagName:'+tagName)
		}
		this.tagName = tagName
	},
	add:function(qName,value,offset){
		if(!tagNamePattern.test(qName)){
			throw new Error('invalid attribute:'+qName)
		}
		this[this.length++] = {qName:qName,value:value,offset:offset}
	},
	length:0,
	getLocalName:function(i){return this[i].localName},
	getOffset:function(i){return this[i].offset},
	getQName:function(i){return this[i].qName},
	getURI:function(i){return this[i].uri},
	getValue:function(i){return this[i].value}
//	,getIndex:function(uri, localName)){
//		if(localName){
//			
//		}else{
//			var qName = uri
//		}
//	},
//	getValue:function(){return this.getValue(this.getIndex.apply(this,arguments))},
//	getType:function(uri,localName){}
//	getType:function(i){},
}




function _set_proto_(thiz,parent){
	thiz.__proto__ = parent;
	return thiz;
}
if(!(_set_proto_({},_set_proto_.prototype) instanceof _set_proto_)){
	_set_proto_ = function(thiz,parent){
		function p(){};
		p.prototype = parent;
		p = new p();
		for(parent in thiz){
			p[parent] = thiz[parent];
		}
		return p;
	}
}

function split(source,start){
	var match;
	var buf = [];
	var reg = /'[^']+'|"[^"]+"|[^\s<>\/=]+=?|(\/?\s*>|<)/g;
	reg.lastIndex = start;
	reg.exec(source);//skip <
	while(match = reg.exec(source)){
		buf.push(match);
		if(match[1])return buf;
	}
}

if(typeof require == 'function'){
	exports.XMLReader = XMLReader;
}


},{}],"rdflib":[function(require,module,exports){
(function(root, undef) {
/**
* Utility functions for $rdf and the $rdf object itself
 */

if (typeof $rdf === 'undefined') {
  var $rdf = {}
} else {
  throw new Error('Internal error: RDF libray has already been loaded: $rdf already exists')
}

/**
 * @class a dummy logger

 Note to implement this using the Firefox error console see
  https://developer.mozilla.org/en/nsIConsoleService
 */

// dump("@@ rdf/util.js test RESET RDF LOGGER  $rdf.log.error)\n")
if ($rdf.log !== undefined) {
  // dump("WTF util.js:" + $rdf.log)
  throw new Error('Internal Error: $rdf.log already defined,  util.js: ' + $rdf.log)
}

$rdf.log = {
  'debug': function (x) {
    return
  },
  'warn': function (x) {
    return
  },
  'info': function (x) {
    return
  },
  'error': function (x) {
    return
  },
  'success': function (x) {
    return
  },
  'msg': function (x) {
    return
  }
}

/**
* @class A utility class
 */

$rdf.Util = {
  /** A simple debugging function */
  'output': function (o) {
    var k = document.createElement('div')
    k.textContent = o
    document.body.appendChild(k)
  },
  /**
  * A standard way to add callback functionality to an object
   **
   ** Callback functions are indexed by a 'hook' string.
   **
   ** They return true if they want to be called again.
   **
   */
  callbackify: function (obj, callbacks) {
    obj.callbacks = {}
    for (var x = callbacks.length - 1; x >= 0; x--) {
      obj.callbacks[callbacks[x]] = []
    }

    obj.addHook = function (hook) {
      if (!obj.callbacks[hook]) {
        obj.callbacks[hook] = []
      }
    }

    obj.addCallback = function (hook, func) {
      obj.callbacks[hook].push(func)
    }

    obj.removeCallback = function (hook, funcName) {
      for (var i = 0;i < obj.callbacks[hook].length;i++) {
        if (obj.callbacks[hook][i].name === funcName) {
          obj.callbacks[hook].splice(i, 1)
          return true
        }
      }
      return false
    }

    obj.insertCallback = function (hook, func) {
      obj.callbacks[hook].unshift(func)
    }

    obj.fireCallbacks = function (hook, args) {
      var newCallbacks = []
      var replaceCallbacks = []
      var len = obj.callbacks[hook].length
      var x
      //	    $rdf.log.info('!@$ Firing '+hook+' call back with length'+len)
      for (x = len - 1; x >= 0; x--) {
        //		    $rdf.log.info('@@ Firing '+hook+' callback '+ obj.callbacks[hook][x])
        if (obj.callbacks[hook][x].apply(obj, args)) {
          newCallbacks.push(obj.callbacks[hook][x])
        }
      }

      for (x = newCallbacks.length - 1; x >= 0; x--) {
        replaceCallbacks.push(newCallbacks[x])
      }

      for (x = len; x < obj.callbacks[hook].length; x++) {
        replaceCallbacks.push(obj.callbacks[hook][x])
      }

      obj.callbacks[hook] = replaceCallbacks
    }
  },

  /**
  * A standard way to create XMLHttpRequest objects
  */
  XMLHTTPFactory: function () {
    var XMLHttpRequest
    // Running inside the Tabulator Firefox extension
    if (typeof tabulator !== 'undefined' && tabulator.isExtension) {
      // Cannot use XMLHttpRequest natively, must request it through SDK
      return Components
        .classes['@mozilla.org/xmlextras/xmlhttprequest;1']
        .createInstance()
        .QueryInterface(Components.interfaces.nsIXMLHttpRequest)
    } else if (typeof window !== 'undefined' && 'XMLHttpRequest' in window) {
      // Running inside the browser
      XMLHttpRequest = window.XMLHttpRequest
      return new XMLHttpRequest()
    } else if (typeof module !== 'undefined' && module && module.exports) {
      // Running in Node.js
      XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest
      return new XMLHttpRequest()
    } else if (window.ActiveXObject) {
      try {
        return new ActiveXObject('Msxml2.XMLHTTP')
      } catch (e) {
        return new ActiveXObject('Microsoft.XMLHTTP')
      }
    } else {
      return false
    }
  },

  'DOMParserFactory': function () {
    if (tabulator && tabulator.isExtension) {
      return Components.classes['@mozilla.org/xmlextras/domparser;1']
        .getService(Components.interfaces.nsIDOMParser)
    } else if (window.DOMParser) {
      return new DOMParser()
    } else if (window.ActiveXObject) {
      return new ActiveXObject('Microsoft.XMLDOM')
    } else {
      return false
    }
  },

  /**
  * Returns a hash of headers and values
  **
  ** @@ Bug: Assumes that each header only occurs once
  ** Also note that a , in a header value is just the same as having two headers.
   */
  getHTTPHeaders: function (xhr) {
    var lines = xhr.getAllResponseHeaders().split('\n')
    var headers = {}
    var last
    for (var x = 0; x < lines.length; x++) {
      if (lines[x].length > 0) {
        var pair = lines[x].split(': ')
        if (typeof pair[1] === 'undefined') { // continuation
          headers[last] += '\n' + pair[0]
        } else {
          last = pair[0].toLowerCase()
          headers[last] = pair[1]
        }
      }
    }
    return headers
  },

  dtstamp: function () {
    var now = new Date()
    var year = now.getYear() + 1900
    var month = now.getMonth() + 1
    var day = now.getDate()
    var hour = now.getUTCHours()
    var minute = now.getUTCMinutes()
    var second = now.getSeconds()
    if (month < 10) month = '0' + month
    if (day < 10) day = '0' + day
    if (hour < 10) hour = '0' + hour
    if (minute < 10) minute = '0' + minute
    if (second < 10) second = '0' + second
    return year + '-' + month + '-' + day + 'T' +
      hour + ':' + minute + ':' + second + 'Z'
  },

  enablePrivilege: ((typeof netscape !== 'undefined') &&
    (typeof netscape.security.PrivilegeManager !== 'undefined') &&
    netscape.security.PrivilegeManager.enablePrivilege) ||
    function () {
      return
    },

  disablePrivilege: ((typeof netscape !== 'undefined') && (typeof netscape.security.PrivilegeManager !== 'undefined') && netscape.security.PrivilegeManager.disablePrivilege) || function () {
    return
  },

  // removes all statements equal to x from a
  RDFArrayRemove: function (a, x) {
    for (var i = 0; i < a.length; i++) {
      // TODO: This used to be the following, which didnt always work..why
      // if(a[i] === x)
      if (a[i].subject.sameTerm(x.subject) &&
        a[i].predicate.sameTerm(x.predicate) &&
        a[i].object.sameTerm(x.object) &&
        a[i].why.sameTerm(x.why)) {
        a.splice(i, 1)
        return
      }
    }
    throw new Error('RDFArrayRemove: Array did not contain ' + x + ' ' + x.why)
  },

  string_startswith: function (str, pref) { // missing library routines
    return (str.slice(0, pref.length) === pref)
  },

  // This is the callback from the kb to the fetcher which is used to
  // load ontologies of the data we load.

  AJAR_handleNewTerm: function (kb, p, requestedBy) {
    var sf = null
    if (typeof kb.fetcher !== 'undefined') {
      sf = kb.fetcher
    } else {
      return
    }
    if (p.termType !== 'symbol') return
    var docuri = $rdf.Util.uri.docpart(p.uri)
    var fixuri
    if (p.uri.indexOf('#') < 0) { // No hash
      // @@ major hack for dbpedia Categories, which spread indefinitely
      if ($rdf.Util.string_startswith(p.uri, 'http://dbpedia.org/resource/Category:')) return

      /*
        if (string_startswith(p.uri, 'http://xmlns.com/foaf/0.1/')) {
        fixuri = "http://dig.csail.mit.edu/2005/ajar/ajaw/test/foaf"
        // should give HTTP 303 to ontology -- now is :-)
        } else
      */
      if ($rdf.Util.string_startswith(p.uri,
              'http://purl.org/dc/elements/1.1/') ||
            $rdf.Util.string_startswith(p.uri, 'http://purl.org/dc/terms/')) {
        fixuri = 'http://dublincore.org/2005/06/13/dcq'
      // dc fetched multiple times
      } else if ($rdf.Util.string_startswith(p.uri, 'http://xmlns.com/wot/0.1/')) {
        fixuri = 'http://xmlns.com/wot/0.1/index.rdf'
      } else if ($rdf.Util.string_startswith(p.uri, 'http://web.resource.org/cc/')) {
        //            $rdf.log.warn("creative commons links to html instead of rdf. doesn't seem to content-negotiate.")
        fixuri = 'http://web.resource.org/cc/schema.rdf'
      }
    }
    if (fixuri) {
      docuri = fixuri
    }
    if (sf && sf.getState(docuri) !== 'unrequested') return

    if (fixuri) { // only give warning once: else happens too often
      $rdf.log.warn('Assuming server still broken, faking redirect of <' + p.uri +
        '> to <' + docuri + '>')
    }
    sf.requestURI(docuri, requestedBy)
  }, // AJAR_handleNewTerm

  ArrayIndexOf: function (arr, item, i) {
    i || (i = 0)
    var length = arr.length
    if (i < 0) i = length + i
    for (; i < length; i++) {
      if (arr[i] === item) {
        return i
      }
    }
    return -1
  }

}

// //////////////// find the variables in a graph
//  SHALLOW
//  used?
//
$rdf.Util.variablesIn = function (g) {
  for (var i = 0; i < g.statements.length; i++) {
    var st = g.statatements[i]
    var vars = {}
    if (st.subject instanceof $rdf.Variable) {
      vars[st.subject.toNT()] = true
    }
    if (st.predicate instanceof $rdf.Variable) {
      vars[st.predicate.toNT()] = true
    }
    if (st.object instanceof $rdf.Variable) {
      vars[st.object.toNT()] = true
    }
  }
  return vars
}

//   Heavy comparison is for repeatable canonical ordering
$rdf.Util.heavyCompare = function (x, y, g) {
  var nonBlank = function (x) {
    return (x.termType === 'bnode') ? null : x
  }
  var signature = function (b) {
    var lis = g.statementsMatching(x).map(function (st) {
      return ('' + nonBlank(st.subject) + ' ' + nonBlank(st.predicate) +
        ' ' + nonBlank(st.object))
    }).concat(g.statementsMatching(undefined, undefined, x).map(function (st) {
      return ('' + nonBlank(st.subject) + ' ' + nonBlank(st.predicate) +
        ' ' + nonBlank(st.object))
    }))
    lis.sort()
    return lis.join('\n')
  }
  if ((x.termType === 'bnode') || (y.termType === 'bnode')) {
    if (x.compareTerm(y) === 0) return 0 // Same
    if (signature(x) > signature(y)) return +1
    if (signature(x) < signature(y)) return -1
    return x.compareTerm(y)  // Too bad -- this order not canonical.
    // throw "different bnodes indistinquishable for sorting"
  } else {
    return x.compareTerm(y)
  }
}

$rdf.Util.heavyCompareSPO = function (x, y, g) {
  var comp = $rdf.Util.heavyCompare
  var d = comp(x.subject, y.subject, g)
  if (d) return d
  d = comp(x.predicate, y.predicate, g)
  if (d) return d
  return comp(x.object, y.object, g)
}

// /////////////////// Parse XML
//
// Returns: A DOM
//

$rdf.Util.parseXML = function (str, options) {
  var dparser
  options = options || {}
  if ((typeof tabulator !== 'undefined' && tabulator.isExtension)) {
    dparser = Components.classes['@mozilla.org/xmlextras/domparser;1'].getService(
      Components.interfaces.nsIDOMParser)
  } else if (typeof module !== 'undefined' && module && module.exports) { // Node.js
    // var libxmljs = require('libxmljs'); // Was jsdom before 2012-01 then libxmljs but that nonstandard
    // return libxmljs.parseXmlString(str)

    // var jsdom = require('jsdom');   2012-01 though 2015-08 no worky with new Node
    // var dom = jsdom.jsdom(str, undefined, {} );// html, level, options

    var DOMParser = require('xmldom').DOMParser // 2015-08 on https://github.com/jindw/xmldom
    var dom = new DOMParser().parseFromString(str, options.contentType || 'application/xhtml+xml')
    return dom
  } else {
    if (typeof window !== 'undefined' && window.DOMParser) {
      dparser = new window.DOMParser() // seems to actually work
    } else {
      dparser = new DOMParser() // Doc says this works
    }
  }
  return dparser.parseFromString(str, 'application/xml')
}

// ////////////////////String Utility
// substitutes given terms for occurrnces of %s
// not well named. Used??? - tim
//
$rdf.Util.string = {
  // C++, python style %s -> subs
  'template': function (base, subs) {
    var baseA = base.split('%s')
    var result = ''
    for (var i = 0;i < subs.length;i++) {
      subs[i] += ''
      result += baseA[i] + subs[i]
    }
    return result + baseA.slice(subs.length).join()
  }
}

//From https://github.com/linkeddata/dokieli
$rdf.Util.domToString = function(node, options) {
  var options = options || {}
  var selfClosing = []
  if ('selfClosing' in options) {
    options.selfClosing.split(' ').forEach(function (n) {
      selfClosing[n] = true
    })
  }
  var skipAttributes = [];
  if ('skipAttributes' in options) {
    options.skipAttributes.split(' ').forEach(function (n) {
      skipAttributes[n] = true
    })
  }

  var noEsc = [false];

  var dumpNode = function(node) {
    var out = ''
    if (typeof node.nodeType === 'undefined') return out
    if (1 === node.nodeType) {
      if (node.hasAttribute('class') && 'classWithChildText' in options && node.matches(options.classWithChildText.class)) {
        out += node.querySelector(options.classWithChildText.element).textContent
      }
      else if (!('skipNodeWithClass' in options && node.matches('.' + options.skipNodeWithClass))) {
        var ename = node.nodeName.toLowerCase()
        out += "<" + ename

        var attrList = []
        for (var i = node.attributes.length - 1; i >= 0; i--) {
          var atn = node.attributes[i]
          if (skipAttributes.length > 0 && skipAttributes[atn.name]) continue
          if (/^\d+$/.test(atn.name)) continue
          if (atn.name == 'class' && 'replaceClassItemWith' in options && (atn.value.split(' ').indexOf(options.replaceClassItemWith.source) > -1)) {
            var re = new RegExp(options.replaceClassItemWith.source, 'g')
            atn.value = atn.value.replace(re, options.replaceClassItemWith.target).trim()
          }
          if (!(atn.name == 'class' && 'skipClassWithValue' in options && options.skipClassWithValue == atn.value)) {
            attrList.push(atn.name + "=\"" + atn.value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') + "\"")
          }
        }

        if (attrList.length > 0) {
          if('sortAttributes' in options && options.sortAttributes) {
            attrList.sort(function (a, b) {
              return a.toLowerCase().localeCompare(b.toLowerCase())
            })
          }
          out += ' ' + attrList.join(' ')
        }

        if (selfClosing[ename]) { out += " />"; }
        else {
          out += '>';
          out += (ename == 'html') ? "\n  " : ''
          noEsc.push(ename === "style" || ename === "script");
          for (var i = 0; i < node.childNodes.length; i++) out += dumpNode(node.childNodes[i])
          noEsc.pop()
          out += (ename == 'body') ? '</' + ename + '>' + "\n" : '</' + ename + '>'
        }
      }
    }
    else if (8 === node.nodeType) {
      //FIXME: If comments are not tabbed in source, a new line is not prepended
      out += "<!--" + node.nodeValue + "-->"
    }
    else if (3 === node.nodeType || 4 === node.nodeType) {
      //XXX: Remove new lines which were added after DOM ready
      var nl = node.nodeValue.replace(/\n+$/, '')
      out += noEsc[noEsc.length - 1] ? nl : nl.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    }
    else {
      console.log("Warning; Cannot handle serialising nodes of type: " + node.nodeType)
      console.log(node)
    }
    return out
  };

  return dumpNode(node)
}

// Reomved 2015-08-05 timbl - unused and depended on jQuery!
// from http://dev.jquery.com/browser/trunk/jquery/src/core.js
// Dependency with JQuery -- we try to keep the rdflib.js and jquery libraries separate at the moment.
/*
$rdf.Util.extend = function () {
    // copy reference to target object
    var target = arguments[0] || {},
        i = 1,
        length = arguments.length,
        deep = false,
        options, name, src, copy

    // Handle a deep copy situation
    if (typeof target === "boolean") {
        deep = target
        target = arguments[1] || {}
        // skip the boolean and the target
        i = 2
    }

    // Handle case when target is a string or something (possible in deep copy)
    if (typeof target !== "object" && !jQuery.isFunction(target)) {
        target = {}
    }

    // extend jQuery itself if only one argument is passed
    if (length === i) {
        target = this
        --i
    }

    for (; i < length; i++) {
        // Only deal with non-null/undefined values
        if ((options = arguments[i]) != null) {
            // Extend the base object
            for (name in options) {
                src = target[name]
                copy = options[name]

                // Prevent never-ending loop
                if (target === copy) {
                    continue
                }

                // Recurse if we're merging object values
                if (deep && copy && typeof copy === "object" && !copy.nodeType) {
                    var clone

                    if (src) {
                        clone = src
                    } else if (jQuery.isArray(copy)) {
                        clone = []
                    } else if (jQuery.isObject(copy)) {
                        clone = {}
                    } else {
                        clone = copy
                    }

                    // Never move original objects, clone them
                    target[name] = jQuery.extend(deep, clone, copy)

                    // Don't bring in undefined values
                } else if (copy !== undefined) {
                    target[name] = copy
                }
            }
        }
    }

    // Return the modified object
    return target
}
*/
/*
 * Implements URI-specific functions
 *
 * See RFC 2386
 *
 * See also:
 *   http://www.w3.org/2005/10/ajaw/uri.js
 *   http://www.w3.org/2000/10/swap/uripath.py
 *
 */
var $rdf
var base1
var k
var ref
var v
var hasProp = {}.hasOwnProperty

if (typeof $rdf === 'undefined' || $rdf === null) {
  $rdf = {}
}

if ($rdf.Util == null) {
  $rdf.Util = {}
}

$rdf.uri = (function () {
  function uri () {}

  uri.join = function (given, base) {
    var baseColon
    var baseHash
    var baseScheme
    var baseSingle
    var colon
    var lastSlash
    var path
    baseHash = base.indexOf('#')
    if (baseHash > 0) {
      base = base.slice(0, baseHash)
    }
    if (given.length === 0) {
      return base
    }
    if (given.indexOf('#') === 0) {
      return base + given
    }
    colon = given.indexOf(':')
    if (colon >= 0) {
      return given
    }
    baseColon = base.indexOf(':')
    if (base.length === 0) {
      return given
    }
    if (baseColon < 0) {
      alert('Invalid base: ' + base + ' in join with given: ' + given)
      return given
    }
    baseScheme = base.slice(0, +baseColon + 1 || 9e9)
    if (given.indexOf('//') === 0) {
      return baseScheme + given
    }
    if (base.indexOf('//', baseColon) === baseColon + 1) {
      baseSingle = base.indexOf('/', baseColon + 3)
      if (baseSingle < 0) {
        if (base.length - baseColon - 3 > 0) {
          return base + '/' + given
        } else {
          return baseScheme + given
        }
      }
    } else {
      baseSingle = base.indexOf('/', baseColon + 1)
      if (baseSingle < 0) {
        if (base.length - baseColon - 1 > 0) {
          return base + '/' + given
        } else {
          return baseScheme + given
        }
      }
    }
    if (given.indexOf('/') === 0) {
      return base.slice(0, baseSingle) + given
    }
    path = base.slice(baseSingle)
    lastSlash = path.lastIndexOf('/')
    if (lastSlash < 0) {
      return baseScheme + given
    }
    if (lastSlash >= 0 && lastSlash < path.length - 1) {
      path = path.slice(0, +lastSlash + 1 || 9e9)
    }
    path += given
    while (path.match(/[^\/]*\/\.\.\//)) {
      path = path.replace(/[^\/]*\/\.\.\//, '')
    }
    path = path.replace(/\.\//g, '')
    path = path.replace(/\/\.$/, '/')
    return base.slice(0, baseSingle) + path
  }

  uri.commonHost = new RegExp('^[-_a-zA-Z0-9.]+:(//[^/]*)?/[^/]*$')

  uri.hostpart = function (u) {
    var m
    m = /[^\/]*\/\/([^\/]*)\//.exec(u)
    if (m) {
      return m[1]
    } else {
      return ''
    }
  }

  uri.refTo = function (base, uri) {
    var c
    var i
    // var j
    var k
    var l
    var len
    var len1
    var n
    var o
    var p
    var q
    var ref
    var ref1
    var s
    if (!base) {
      return uri
    }
    if (base === uri) {
      return ''
    }
    for (i = o = 0, len = uri.length; o < len; i = ++o) {
      c = uri[i]
      if (c !== base[i]) {
        break
      }
    }
    if (base.slice(0, i).match($rdf.Util.uri.commonHost)) {
      k = uri.indexOf('//')
      if (k < 0) {
        k = -2
      }
      l = uri.indexOf('/', k + 2)
      if (uri[l + 1] !== '/' && base[l + 1] !== '/' && uri.slice(0, l) === base.slice(0, l)) {
        return uri.slice(l)
      }
    }
    if (uri[i] === '#' && base.length === i) {
      return uri.slice(i)
    }
    while (i > 0 && uri[i - 1] !== '/') {
      i--
    }
    if (i < 3) {
      return uri
    }
    if (base.indexOf('//', i - 2) > 0 || uri.indexOf('//', i - 2) > 0) {
      return uri
    }
    if (base.indexOf(':', i) > 0) {
      return uri
    }
    n = 0
    ref = base.slice(i)
    for (p = 0, len1 = ref.length; p < len1; p++) {
      c = ref[p]
      if (c === '/') {
        n++
      }
    }
    if (n === 0 && i < uri.length && uri[i] === '#') {
      return './' + uri.slice(i)
    }
    if (n === 0 && i === uri.length) {
      return './'
    }
    s = ''
    if (n > 0) {
      for (j = q = 1, ref1 = n; 1 <= ref1 ? q <= ref1 : q >= ref1; j = 1 <= ref1 ? ++q : --q) {
        s += '../'
      }
    }
    return s + uri.slice(i)
  }

  uri.docpart = function (uri) {
    var i
    i = uri.indexOf('#')
    if (i < 0) {
      return uri
    } else {
      return uri.slice(0, i)
    }
  }

  uri.document = function (x) {
    return $rdf.sym(uri.docpart(x.uri))
  }

  uri.protocol = function (uri) {
    var i
    i = uri.indexOf(':')
    if (i < 0) {
      return null
    } else {
      return uri.slice(0, i)
    }
  }

  return uri
})()

$rdf.Util.uri = $rdf.uri

if ((typeof module !== 'undefined' && module !== null ? module.exports : void 0) != null) {
  if ((base1 = module.exports).Util == null) {
    base1.Util = {}
  }
  ref = $rdf.Util
  for (k in ref) {
    if (!hasProp.call(ref, k)) continue
    v = ref[k]
    module.exports.Util[k] = v
  }
  module.exports.uri = $rdf.uri
}
/*
* These are the classes corresponding to the RDF and N3 data models
*
* Designed to look like rdflib and cwm
*
*/
var $rdf
var k
var v
var extend = function (child, parent) {
  for (var key in parent) {
    if (hasProp.call(parent, key)) {
      child[key] = parent[key]
    }
  }
  function Ctor () {
    this.constructor = child
  }
  Ctor.prototype = parent.prototype
  child.prototype = new Ctor()
  child.__super__ = parent.prototype; return child
}
var hasProp = {}.hasOwnProperty
var indexOf = [].indexOf || function (item) {
  for (var i = 0, l = this.length; i < l; i++) {
    if (i in this && this[i] === item) return i
  }
  return -1
}

if (typeof $rdf === 'undefined' || $rdf === null) {
  $rdf = {}
}

/*
the superclass of all RDF Statement objects, that is
$rdf.NamedNode, $rdf.Literal, $rdf.BlankNode
No class extends this yet, but it could be a place to put common behavior.
*/
$rdf.Node = (function () {
  function Node () {}

  Node.prototype.substitute = function (bindings) {
    return this
  }

  return Node
})()

$rdf.Empty = (function (superClass) {
  extend(Empty, superClass)

  function Empty () {
    return Empty.__super__.constructor.apply(this, arguments)
  }

  Empty.prototype.termType = 'empty'

  Empty.prototype.toString = function () {
    return '()'
  }

  Empty.prototype.toNT = Empty.prototype.toString

  return Empty
})($rdf.Node)

/*
A named node in an RDF graph
todo: badly named.
No, formally a URI is a string, this is a node whose name is a URI.
Connolly pointed out it isa symbol on the language.
@param uri the uri as string
*/
$rdf.NamedNode = (function (superClass) {
  extend(NamedNode, superClass)

  function NamedNode (uri1) {
    this.uri = uri1
  }

  NamedNode.prototype.termType = 'symbol'

  NamedNode.prototype.toString = function () {
    return '<' + this.uri + '>'
  }

  NamedNode.prototype.toNT = NamedNode.prototype.toString

  NamedNode.prototype.doc = function () {
    if (this.uri.indexOf('#') < 0) {
      return this
    } else {
      return new $rdf.NamedNode(this.uri.split('#')[0])
    }
  }

  // $rdf node for the containing directory, ending in slash.
  NamedNode.prototype.dir = function () {
    var str = this.uri.split('#')[0]
    var p = str.slice(0, -1).lastIndexOf('/')
    var q = str.indexOf('//')
    if ((q >= 0 && p < q + 2) || p < 0) return null
    return new $rdf.NamedNode(str.slice(0, p + 1))
  }

  NamedNode.prototype.sameTerm = function (other) {
    if (!other) {
      return false
    }
    return (this.termType === other.termType) && (this.uri === other.uri)
  }

  NamedNode.prototype.compareTerm = function (other) {
    if (this.classOrder < other.classOrder) {
      return -1
    }
    if (this.classOrder > other.classOrder) {
      return +1
    }
    if (this.uri < other.uri) {
      return -1
    }
    if (this.uri > other.uri) {
      return +1
    }
    return 0
  }

  NamedNode.prototype.XSDboolean =
    new NamedNode('http://www.w3.org/2001/XMLSchema#boolean')

  NamedNode.prototype.XSDdecimal =
    new NamedNode('http://www.w3.org/2001/XMLSchema#decimal')

  NamedNode.prototype.XSDfloat =
    new NamedNode('http://www.w3.org/2001/XMLSchema#float')

  NamedNode.prototype.XSDinteger =
    new NamedNode('http://www.w3.org/2001/XMLSchema#integer')

  NamedNode.prototype.XSDdateTime =
    new NamedNode('http://www.w3.org/2001/XMLSchema#dateTime')

  NamedNode.prototype.integer =
    new NamedNode('http://www.w3.org/2001/XMLSchema#integer')

  return NamedNode
})($rdf.Node)

if ($rdf.NextId != null) {
  $rdf.log.error('Attempt to re-zero existing blank node id counter at ' + $rdf.NextId)
} else {
  $rdf.NextId = 0
}

$rdf.NTAnonymousNodePrefix = '_:n'

$rdf.BlankNode = (function (superClass) {
  extend(BlankNode, superClass)

  function BlankNode (id) {
    this.id = $rdf.NextId++
    this.value = id || this.id.toString()
  }

  BlankNode.prototype.termType = 'bnode'

  BlankNode.prototype.toNT = function () {
    return $rdf.NTAnonymousNodePrefix + this.id
  }

  BlankNode.prototype.toString = BlankNode.prototype.toNT

  BlankNode.prototype.sameTerm = function (other) {
    if (!other) {
      return false
    }
    return (this.termType === other.termType) && (this.id === other.id)
  }

  BlankNode.prototype.compareTerm = function (other) {
    if (this.classOrder < other.classOrder) {
      return -1
    }
    if (this.classOrder > other.classOrder) {
      return +1
    }
    if (this.id < other.id) {
      return -1
    }
    if (this.id > other.id) {
      return +1
    }
    return 0
  }

  return BlankNode
})($rdf.Node)

$rdf.Literal = (function (superClass) {
  extend(Literal, superClass)

  function Literal (value1, lang1, datatype) {
    this.value = value1
    this.lang = lang1
    this.datatype = datatype
    if (!this.lang) {
      this.lang = void 0  // set to undefined
    }
    if (!this.datatype) {
      this.datatype = void 0  // set to undefined
    }
  }

  Literal.prototype.termType = 'literal'

  Literal.prototype.toString = function () {
    return '' + this.value
  }

  Literal.prototype.toNT = function () {
    var str
    str = this.value
    if (typeof str === !'string') {
      if (typeof str === 'number') {
        return '' + str
      }
      throw Error('Value of RDF literal is not string: ' + str)
    }
    str = str.replace(/\\/g, '\\\\')
    str = str.replace(/\"/g, '\\"')
    str = str.replace(/\n/g, '\\n')
    str = '"' + str + '"'
    if (this.datatype) {
      str += '^^' + this.datatype.toNT()
    }
    if (this.lang) {
      str += '@' + this.lang
    }
    return str
  }

  Literal.prototype.sameTerm = function (other) {
    if (!other) {
      return false
    }
    return (this.termType === other.termType) && (this.value === other.value) && (this.lang === other.lang) && ((!this.datatype && !other.datatype) || (this.datatype && this.datatype.sameTerm(other.datatype)))
  }

  Literal.prototype.compareTerm = function (other) {
    if (this.classOrder < other.classOrder) {
      return -1
    }
    if (this.classOrder > other.classOrder) {
      return +1
    }
    if (this.value < other.value) {
      return -1
    }
    if (this.value > other.value) {
      return +1
    }
    return 0
  }

  return Literal
})($rdf.Node)

$rdf.Collection = (function (superClass) {
  extend(Collection, superClass)

  function Collection (initial) {
    var i
    var len
    var s
    this.id = $rdf.NextId++
    this.elements = []
    this.closed = false
    if (typeof initial !== 'undefined') {
      for (i = 0, len = initial.length; i < len; i++) {
        s = initial[i]
        this.elements.push($rdf.term(s))
      }
    }
  }

  Collection.prototype.termType = 'collection'

  Collection.prototype.toNT = function () {
    return $rdf.NTAnonymousNodePrefix + this.id
  }

  Collection.prototype.toString = function () {
    return '(' + this.elements.join(' ') + ')'
  }

  Collection.prototype.substitute = function (bindings) {
    var s
    return new $rdf.Collection(function () {
      var i
      var len
      var ref
      var results1
      ref = this.elements
      results1 = []
      for (i = 0, len = ref.length; i < len; i++) {
        s = ref[i]
        results1.push(s.substitute(bindings))
      }
      return results1
    }).call(this)
  }

  Collection.prototype.append = function (el) {
    return this.elements.push(el)
  }

  Collection.prototype.unshift = function (el) {
    return this.elements.unshift(el)
  }

  Collection.prototype.shift = function () {
    return this.elements.shift()
  }

  Collection.prototype.close = function () {
    this.closed = true
    return this.closed
  }

  return Collection
})($rdf.Node)

$rdf.Collection.prototype.sameTerm = $rdf.BlankNode.prototype.sameTerm

$rdf.Collection.prototype.compareTerm = $rdf.BlankNode.prototype.compareTerm

/*
function to transform a value into an $rdf.Node
@param val can be an rdf.Node, a date, string, number, boolean, or undefined. RDF Nodes are returned as is,
undefined as undefined
*/
$rdf.term = function (val) {
  var d2
  var dt
  var elt
  var i
  var len
  var value
  var x
  switch (typeof val) {
    case 'object':
      if (val instanceof Date) {
        d2 = function (x) {
          return ('' + (100 + x)).slice(1, 3)
        }
        value = '' + val.getUTCFullYear() + '-' + d2(val.getUTCMonth() + 1) + '-' + d2(val.getUTCDate()) + 'T' + d2(val.getUTCHours()) + ':' + d2(val.getUTCMinutes()) + ':' + d2(val.getUTCSeconds()) + 'Z'
        return new $rdf.Literal(value, void 0, $rdf.NamedNode.prototype.XSDdateTime)
      } else if (val instanceof Array) {
        x = new $rdf.Collection()
        for (i = 0, len = val.length; i < len; i++) {
          elt = val[i]
          x.append($rdf.term(elt))
        }
        return x
      }
      return val
    case 'string':
      return new $rdf.Literal(val)
    case 'number':
      if (('' + val).indexOf('e') >= 0) {
        dt = $rdf.NamedNode.prototype.XSDfloat
      } else if (('' + val).indexOf('.') >= 0) {
        dt = $rdf.NamedNode.prototype.XSDdecimal
      } else {
        dt = $rdf.NamedNode.prototype.XSDinteger
      }
      return new $rdf.Literal('' + val, void 0, dt)
    case 'boolean':
      return new $rdf.Literal((val ? '1' : '0'), void 0, $rdf.NamedNode.prototype.XSDboolean)
    case 'undefined':
      return void 0
  }
  throw new Error("Can't make term from " + val + ' of type ' + typeof val)
}

$rdf.Statement = (function () {
  function Statement (subject, predicate, object, why) {
    this.subject = $rdf.term(subject)
    this.predicate = $rdf.term(predicate)
    this.object = $rdf.term(object)
    if (why != null) {
      this.why = why
    }
  }

  Statement.prototype.toNT = function () {
    return [this.subject.toNT(), this.predicate.toNT(), this.object.toNT()].join(' ') + ' .'
  }

  Statement.prototype.toString = Statement.prototype.toNT

  Statement.prototype.substitute = function (bindings) {
    return new $rdf.Statement(this.subject.substitute(bindings), this.predicate.substitute(bindings), this.object.substitute(bindings), this.why)
  }

  return Statement
})()

$rdf.st = function (subject, predicate, object, why) {
  return new $rdf.Statement(subject, predicate, object, why)
}

$rdf.Formula = (function (superClass) {
  extend(Formula, superClass)

  function Formula () {
    this.statements = []
    this.constraints = []
    this.initBindings = []
    this.optional = []
  }

  Formula.prototype.termType = 'formula'

  Formula.prototype.toNT = function () {
    return '{' + this.statements.join('\n') + '}'
  }

  Formula.prototype.toString = Formula.prototype.toNT

  Formula.prototype.add = function (s, p, o, why) {
    return this.statements.push(new $rdf.Statement(s, p, o, why))
  }

  Formula.prototype.addStatement = function (st) {
    return this.statements.push(st)
  }

  Formula.prototype.substitute = function (bindings) {
    var g
    var i
    var len
    var ref
    var s
    g = new $rdf.Formula()
    ref = this.statements
    for (i = 0, len = ref.length; i < len; i++) {
      s = ref[i]
      g.addStatement(s.substitute(bindings))
    }
    return g
  }

  Formula.prototype.sym = function (uri, name) {
    if (name) {
      throw new Error('This feature (kb.sym with 2 args) is removed. Do not assume prefix mappings.')
    }
    return new $rdf.NamedNode(uri)
  }

  Formula.prototype.literal = function (val, lang, dt) {
    return new $rdf.Literal('' + val, lang, dt)
  }

  Formula.prototype.bnode = function (id) {
    return new $rdf.BlankNode(id)
  }

  Formula.prototype.formula = function () {
    return new $rdf.Formula()
  }

  Formula.prototype.collection = function () {
    return new $rdf.Collection()
  }

  Formula.prototype.list = function (values) {
    var elt
    var i
    var len
    var r
    r = new $rdf.Collection()
    if (values) {
      for (i = 0, len = values.length; i < len; i++) {
        elt = values[i]
        r.append(elt)
      }
    }
    return r
  }

  Formula.prototype.variable = function (name) {
    return new $rdf.Variable(name)
  }

  Formula.prototype.ns = function (nsuri) {
    return function (ln) {
      return new $rdf.NamedNode(nsuri + (ln != null ? ln : ''))
    }
  }

  /*
  transform an NTriples string format into an $rdf.Node
  The bnode bit should not be used on program-external values; designed
  for internal work such as storing a bnode id in an HTML attribute.
  This will only parse the strings generated by the vaious toNT() methods.
  */

  Formula.prototype.fromNT = function (str) {
    var dt
    var k
    var lang
    var x
    switch (str[0]) {
      case '<':
        return $rdf.sym(str.slice(1, -1))
      case '"':
        lang = void 0
        dt = void 0
        k = str.lastIndexOf('"')
        if (k < str.length - 1) {
          if (str[k + 1] === '@') {
            lang = str.slice(k + 2)
          } else if (str.slice(k + 1, k + 3) === '^^') {
            dt = $rdf.fromNT(str.slice(k + 3))
          } else {
            throw new Error("Can't convert string from NT: " + str)
          }
        }
        str = str.slice(1, k)
        str = str.replace(/\\"/g, '"')
        str = str.replace(/\\n/g, '\n')
        str = str.replace(/\\\\/g, '\\')
        return $rdf.lit(str, lang, dt)
      case '_':
        x = new $rdf.BlankNode()
        x.id = parseInt(str.slice(3), 10)
        $rdf.NextId--
        return x
      case '?':
        return new $rdf.Variable(str.slice(1))
    }
    throw new Error("Can't convert from NT: " + str)
  }

  Formula.prototype.sameTerm = function (other) {
    if (!other) {
      return false
    }
    return this.hashString() === other.hashString()
  }

  Formula.prototype.each = function (s, p, o, w) {
    var elt
    var i
    var l
    var len
    var len1
    var len2
    var len3
    var m
    var q
    var results
    var sts
    results = []
    sts = this.statementsMatching(s, p, o, w, false)
    if (s == null) {
      for (i = 0, len = sts.length; i < len; i++) {
        elt = sts[i]
        results.push(elt.subject)
      }
    } else if (p == null) {
      for (l = 0, len1 = sts.length; l < len1; l++) {
        elt = sts[l]
        results.push(elt.predicate)
      }
    } else if (o == null) {
      for (m = 0, len2 = sts.length; m < len2; m++) {
        elt = sts[m]
        results.push(elt.object)
      }
    } else if (w == null) {
      for (q = 0, len3 = sts.length; q < len3; q++) {
        elt = sts[q]
        results.push(elt.why)
      }
    }
    return results
  }

  Formula.prototype.any = function (s, p, o, w) {
    var st
    st = this.anyStatementMatching(s, p, o, w)
    if (st == null) {
      return void 0
    } else if (s == null) {
      return st.subject
    } else if (p == null) {
      return st.predicate
    } else if (o == null) {
      return st.object
    }
    return void 0
  }

  Formula.prototype.holds = function (s, p, o, w) {
    var st
    st = this.anyStatementMatching(s, p, o, w)
    return st != null
  }

  Formula.prototype.holdsStatement = function (st) {
    return this.holds(st.subject, st.predicate, st.object, st.why)
  }

  Formula.prototype.the = function (s, p, o, w) {
    var x
    x = this.any(s, p, o, w)
    if (x == null) {
      $rdf.log.error('No value found for the() {' + s + ' ' + p + ' ' + o + '}.')
    }
    return x
  }

  Formula.prototype.whether = function (s, p, o, w) {
    return this.statementsMatching(s, p, o, w, false).length
  }

  Formula.prototype.transitiveClosure = function (seeds, predicate, inverse) {
    var agenda
    var done
    var elt
    var i
    var k
    var len
    var s
    var sups
    var t
    var v
    done = {}
    agenda = {}
    for (k in seeds) {
      if (!hasProp.call(seeds, k)) continue
      v = seeds[k]
      agenda[k] = v
    }
    while (true) {
      t = (function () {
        var p
        for (p in agenda) {
          if (!hasProp.call(agenda, p)) continue
          return p
        }
      })()
      if (t == null) {
        return done
      }
      sups = inverse ? this.each(void 0, predicate, this.fromNT(t)) : this.each(this.fromNT(t), predicate)
      for (i = 0, len = sups.length; i < len; i++) {
        elt = sups[i]
        s = elt.toNT()
        if (s in done) {
          continue
        }
        if (s in agenda) {
          continue
        }
        agenda[s] = agenda[t]
      }
      done[t] = agenda[t]
      delete agenda[t]
    }
  }

  /*
  For thisClass or any subclass, anything which has it is its type
  or is the object of something which has the type as its range, or subject
  of something which has the type as its domain
  We don't bother doing subproperty (yet?)as it doesn't seeem to be used much.
  Get all the Classes of which we can RDFS-infer the subject is a member
  @returns a hash of URIs
  */
  Formula.prototype.findMembersNT = function (thisClass) {
    var i
    var l
    var len
    var len1
    var len2
    var len3
    var len4
    var m
    var members
    var pred
    var q
    var ref
    var ref1
    var ref2
    var ref3
    var ref4
    var ref5
    var seeds
    var st
    var t
    var u
    seeds = {}
    seeds[thisClass.toNT()] = true
    members = {}
    ref = this.transitiveClosure(seeds, this.sym('http://www.w3.org/2000/01/rdf-schema#subClassOf'), true)
    for (t in ref) {
      if (!hasProp.call(ref, t)) continue
      ref1 = this.statementsMatching(void 0, this.sym('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), this.fromNT(t))
      for (i = 0, len = ref1.length; i < len; i++) {
        st = ref1[i]
        members[st.subject.toNT()] = st
      }
      ref2 = this.each(void 0, this.sym('http://www.w3.org/2000/01/rdf-schema#domain'), this.fromNT(t))
      for (l = 0, len1 = ref2.length; l < len1; l++) {
        pred = ref2[l]
        ref3 = this.statementsMatching(void 0, pred)
        for (m = 0, len2 = ref3.length; m < len2; m++) {
          st = ref3[m]
          members[st.subject.toNT()] = st
        }
      }
      ref4 = this.each(void 0, this.sym('http://www.w3.org/2000/01/rdf-schema#range'), this.fromNT(t))
      for (q = 0, len3 = ref4.length; q < len3; q++) {
        pred = ref4[q]
        ref5 = this.statementsMatching(void 0, pred)
        for (u = 0, len4 = ref5.length; u < len4; u++) {
          st = ref5[u]
          members[st.object.toNT()] = st
        }
      }
    }
    return members
  }

  /*
  transform a collection of NTriple URIs into their URI strings
  @param t some iterable colletion of NTriple URI strings
  @return a collection of the URIs as strings
  todo: explain why it is important to go through NT
  */
  Formula.prototype.NTtoURI = function (t) {
    var k
    var uris
    var v
    uris = {}
    for (k in t) {
      if (!hasProp.call(t, k)) continue
      v = t[k]
      if (k[0] === '<') {
        uris[k.slice(1, -1)] = v
      }
    }
    return uris
  }

  Formula.prototype.findTypeURIs = function (subject) {
    return this.NTtoURI(this.findTypesNT(subject))
  }

  Formula.prototype.findMemberURIs = function (subject) {
    return this.NTtoURI(this.findMembersNT(subject))
  }

  /*
  Get all the Classes of which we can RDFS-infer the subject is a member
  todo: This will loop is there is a class subclass loop (Sublass loops are not illegal)
  Returns a hash table where key is NT of type and value is statement why we think so.
  Does NOT return terms, returns URI strings.
  We use NT representations in this version because they handle blank nodes.
  */
  Formula.prototype.findTypesNT = function (subject) {
    var domain
    var i
    var l
    var len
    var len1
    var len2
    var len3
    var m
    var q
    var range
    var rdftype
    var ref
    var ref1
    var ref2
    var ref3
    var st
    var types
    rdftype = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'
    types = []
    ref = this.statementsMatching(subject, void 0, void 0)
    for (i = 0, len = ref.length; i < len; i++) {
      st = ref[i]
      if (st.predicate.uri === rdftype) {
        types[st.object.toNT()] = st
      } else {
        ref1 = this.each(st.predicate, this.sym('http://www.w3.org/2000/01/rdf-schema#domain'))
        for (l = 0, len1 = ref1.length; l < len1; l++) {
          range = ref1[l]
          types[range.toNT()] = st
        }
      }
    }
    ref2 = this.statementsMatching(void 0, void 0, subject)
    for (m = 0, len2 = ref2.length; m < len2; m++) {
      st = ref2[m]
      ref3 = this.each(st.predicate, this.sym('http://www.w3.org/2000/01/rdf-schema#range'))
      for (q = 0, len3 = ref3.length; q < len3; q++) {
        domain = ref3[q]
        types[domain.toNT()] = st
      }
    }
    return this.transitiveClosure(types, this.sym('http://www.w3.org/2000/01/rdf-schema#subClassOf'), false)
  }

  /*
  Get all the Classes of which we can RDFS-infer the subject is a subclass
  Returns a hash table where key is NT of type and value is statement why we think so.
  Does NOT return terms, returns URI strings.
  We use NT representations in this version because they handle blank nodes.
  */
  Formula.prototype.findSuperClassesNT = function (subject) {
    var types
    types = []
    types[subject.toNT()] = true
    return this.transitiveClosure(types, this.sym('http://www.w3.org/2000/01/rdf-schema#subClassOf'), false)
  }

  /*
  Get all the Classes of which we can RDFS-infer the subject is a superclass
  Returns a hash table where key is NT of type and value is statement why we think so.
  Does NOT return terms, returns URI strings.
  We use NT representations in this version because they handle blank nodes.
  */
  Formula.prototype.findSubClassesNT = function (subject) {
    var types
    types = []
    types[subject.toNT()] = true
    return this.transitiveClosure(types, this.sym('http://www.w3.org/2000/01/rdf-schema#subClassOf'), true)
  }

  /*
  Find the types in the list which have no *stored* supertypes
  We exclude the universal class, owl:Things and rdf:Resource, as it is information-free.
  */
  Formula.prototype.topTypeURIs = function (types) {
    var i
    var j
    var k
    var len
    var n
    var ref
    var tops
    var v
    tops = []
    for (k in types) {
      if (!hasProp.call(types, k)) continue
      v = types[k]
      n = 0
      ref = this.each(this.sym(k), this.sym('http://www.w3.org/2000/01/rdf-schema#subClassOf'))
      for (i = 0, len = ref.length; i < len; i++) {
        j = ref[i]
        if (j.uri !== 'http://www.w3.org/2000/01/rdf-schema#Resource') {
          n++
          break
        }
      }
      if (!n) {
        tops[k] = v
      }
    }
    if (tops['http://www.w3.org/2000/01/rdf-schema#Resource']) {
      delete tops['http://www.w3.org/2000/01/rdf-schema#Resource']
    }
    if (tops['http://www.w3.org/2002/07/owl#Thing']) {
      delete tops['http://www.w3.org/2002/07/owl#Thing']
    }
    return tops
  }

  /*
  Find the types in the list which have no *stored* subtypes
  These are a set of classes which provide by themselves complete
  information -- the other classes are redundant for those who
  know the class DAG.
  */
  Formula.prototype.bottomTypeURIs = function (types) {
    var bots
    var bottom
    var elt
    var i
    var k
    var len
    var ref
    var subs
    var v
    bots = []
    for (k in types) {
      if (!hasProp.call(types, k)) continue
      v = types[k]
      subs = this.each(void 0, this.sym('http://www.w3.org/2000/01/rdf-schema#subClassOf'), this.sym(k))
      bottom = true
      i = 0
      for (len = subs.length; i < len; i++) {
        elt = subs[i]
        ref = elt.uri
        if (indexOf.call(types, ref) >= 0) {
          bottom = false
          break
        }
      }
      if (bottom) {
        bots[k] = v
      }
    }
    return bots
  }

  Formula.prototype.serialize = function (base, contentType, provenance) {
    var documentString
    var sts
    var sz
    sz = $rdf.Serializer(this)
    sz.suggestNamespaces(this.namespaces)
    sz.setBase(base)
    if (provenance) {
      sts = this.statementsMatching(void 0, void 0, void 0, provenance)
    } else {
      sts = this.statements
    }
    switch (
    contentType != null ? contentType : 'text/n3') {
      case 'application/rdf+xml':
        documentString = sz.statementsToXML(sts)
        break
      case 'text/n3':
      case 'text/turtle':
        documentString = sz.statementsToN3(sts)
        break
      default:
        throw new Error('serialize: Content-type ' + contentType(+' not supported.'))
    }
    return documentString
  }

  return Formula
})($rdf.Node)

$rdf.sym = function (uri) {
  return new $rdf.NamedNode(uri)
}

$rdf.lit = $rdf.Formula.prototype.literal

$rdf.Namespace = $rdf.Formula.prototype.ns

$rdf.variable = $rdf.Formula.prototype.variable

/*
* Variable
*
* Variables are placeholders used in patterns to be matched.
* In cwm they are symbols which are the formula's list of quantified variables.
* In sparl they are not visibily URIs.  Here we compromise, by having
* a common special base URI for variables. Their names are uris,
* but the ? nottaion has an implicit base uri of 'varid:'
*/
$rdf.Variable = (function (superClass) {
  extend(Variable, superClass)

  function Variable (rel) {
    this.base = 'varid:'
    this.uri = $rdf.Util.uri.join(rel, this.base)
  }

  Variable.prototype.termType = 'variable'

  Variable.prototype.toNT = function () {
    if (this.uri.slice(0, this.base.length) === this.base) {
      return '?' + this.uri.slice(this.base.length)
    }
    return '?' + this.uri
  }

  Variable.prototype.toString = Variable.prototype.toNT

  Variable.prototype.hashString = Variable.prototype.toNT

  Variable.prototype.substitute = function (bindings) {
    var ref
    return (ref = bindings[this.toNT()]) != null ? ref : this
  }

  Variable.prototype.sameTerm = function (other) {
    if (!other) {
      false
    }
    return (this.termType === other.termType) && (this.uri === other.uri)
  }

  return Variable
})($rdf.Node)

$rdf.Literal.prototype.classOrder = 1

$rdf.Collection.prototype.classOrder = 3

$rdf.Formula.prototype.classOrder = 4

$rdf.NamedNode.prototype.classOrder = 5

$rdf.BlankNode.prototype.classOrder = 6

$rdf.Variable.prototype.classOrder = 7

$rdf.fromNT = $rdf.Formula.prototype.fromNT

$rdf.graph = function () {
  return new $rdf.IndexedFormula()
}

if ((typeof module !== 'undefined' && module !== null ? module.exports : void 0) != null) {
  for (k in $rdf) {
    if (!hasProp.call($rdf, k)) continue
    v = $rdf[k]
    module.exports[k] = v
  }
}
/**
 * @fileoverview
 *  RDF/XML PARSER
 *
 * Version 0.1
 *  Parser believed to be in full positive RDF/XML parsing compliance
 *  with the possible exception of handling deprecated RDF attributes
 *  appropriately. Parser is believed to comply fully with other W3C
 *  and industry standards where appropriate (DOM, ECMAScript, &c.)
 *
 *  Author: David Sheets <dsheets@mit.edu>
 *
 * W3C® SOFTWARE NOTICE AND LICENSE
 * http://www.w3.org/Consortium/Legal/2002/copyright-software-20021231
 * This work (and included software, documentation such as READMEs, or
 * other related items) is being provided by the copyright holders under
 * the following license. By obtaining, using and/or copying this work,
 * you (the licensee) agree that you have read, understood, and will
 * comply with the following terms and conditions.
 *
 * Permission to copy, modify, and distribute this software and its
 * documentation, with or without modification, for any purpose and
 * without fee or royalty is hereby granted, provided that you include
 * the following on ALL copies of the software and documentation or
 * portions thereof, including modifications:
 *
 * 1. The full text of this NOTICE in a location viewable to users of
 * the redistributed or derivative work.
 * 2. Any pre-existing intellectual property disclaimers, notices, or terms and
 * conditions. If none exist, the W3C Software Short Notice should be
 * included (hypertext is preferred, text is permitted) within the body
 * of any redistributed or derivative code.
 * 3. Notice of any changes or modifications to the files, including the
 * date changes were made. (We recommend you provide URIs to the location
 * from which the code is derived.)
 *
 * THIS SOFTWARE AND DOCUMENTATION IS PROVIDED "AS IS," AND COPYRIGHT
 * HOLDERS MAKE NO REPRESENTATIONS OR WARRANTIES, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO, WARRANTIES OF MERCHANTABILITY OR FITNESS
 * FOR ANY PARTICULAR PURPOSE OR THAT THE USE OF THE SOFTWARE OR
 * DOCUMENTATION WILL NOT INFRINGE ANY THIRD PARTY PATENTS, COPYRIGHTS,
 * TRADEMARKS OR OTHER RIGHTS.
 *
 * COPYRIGHT HOLDERS WILL NOT BE LIABLE FOR ANY DIRECT, INDIRECT, SPECIAL
 * OR CONSEQUENTIAL DAMAGES ARISING OUT OF ANY USE OF THE SOFTWARE OR
 * DOCUMENTATION.
 *
 * The name and trademarks of copyright holders may NOT be used in
 * advertising or publicity pertaining to the software without specific,
 * written prior permission. Title to copyright in this software and any
 * associated documentation will at all times remain with copyright
 * holders.
 */
/**
 * @class Class defining an RDFParser resource object tied to an RDFStore
 *
 * @author David Sheets <dsheets@mit.edu>
 * @version 0.1
 *
 * @constructor
 * @param {RDFStore} store An RDFStore object
 */

$rdf.RDFParser = function (store) {
  var RDFParser = {}

  /** Standard namespaces that we know how to handle @final
   *  @member RDFParser
   */
  RDFParser.ns = {'RDF': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#', 'RDFS': 'http://www.w3.org/2000/01/rdf-schema#'}

  /** DOM Level 2 node type magic numbers @final
   *  @member RDFParser
   */
  RDFParser.nodeType = {'ELEMENT': 1, 'ATTRIBUTE': 2, 'TEXT': 3,
    'CDATA_SECTION': 4, 'ENTITY_REFERENCE': 5,
    'ENTITY': 6, 'PROCESSING_INSTRUCTION': 7,
    'COMMENT': 8, 'DOCUMENT': 9, 'DOCUMENT_TYPE': 10,
  'DOCUMENT_FRAGMENT': 11, 'NOTATION': 12}

  /**
   * Frame class for namespace and base URI lookups
   * Base lookups will always resolve because the parser knows
   * the default base.
   *
   * @private
   */

  this.frameFactory = function (parser, parent, element) {
    return {'NODE': 1, 'ARC': 2, 'parent': parent, 'parser': parser, 'store': parser.store, 'element': element,
      'lastChild': 0, 'base': null, 'lang': null, 'node': null, 'nodeType': null, 'listIndex': 1, 'rdfid': null, 'datatype': null, 'collection': false, /** Terminate the frame and notify the store that we're done */
      'terminateFrame': function () {
        if (this.collection) {
          this.node.close()
        }
      },         /** Add a symbol of a certain type to the this frame */'addSymbol': function (type, uri) {
        uri = $rdf.Util.uri.join(uri, this.base)
        this.node = this.store.sym(uri)

        this.nodeType = type
      },         /** Load any constructed triples into the store */'loadTriple': function () {
        if (this.parent.parent.collection) {
          this.parent.parent.node.append(this.node)
        } else {
          this.store.add(this.parent.parent.node, this.parent.node, this.node, this.parser.why)
        }
        if (this.parent.rdfid != null) {
          // reify
          var triple = this.store.sym($rdf.Util.uri.join('#' + this.parent.rdfid, this.base))
          this.store.add(triple, this.store.sym(RDFParser.ns.RDF + 'type'), this.store.sym(RDFParser.ns.RDF + 'Statement'), this.parser.why)
          this.store.add(triple, this.store.sym(RDFParser.ns.RDF + 'subject'), this.parent.parent.node, this.parser.why)
          this.store.add(triple, this.store.sym(RDFParser.ns.RDF + 'predicate'), this.parent.node, this.parser.why)

          this.store.add(triple, this.store.sym(RDFParser.ns.RDF + 'object'), this.node, this.parser.why)
        }
      },         /** Check if it's OK to load a triple */'isTripleToLoad': function () {
        return (this.parent != null && this.parent.parent != null && this.nodeType === this.NODE && this.parent.nodeType ===
        this.ARC && this.parent.parent.nodeType === this.NODE)
      },         /** Add a symbolic node to this frame */'addNode': function (uri) {
        this.addSymbol(this.NODE, uri)
        if (this.isTripleToLoad()) {
          this.loadTriple()
        }
      },         /** Add a collection node to this frame */'addCollection': function () {
        this.nodeType = this.NODE
        this.node = this.store.collection()
        this.collection = true
        if (this.isTripleToLoad()) {
          this.loadTriple()
        }
      },         /** Add a collection arc to this frame */'addCollectionArc': function () {
        this.nodeType = this.ARC
      },         /** Add a bnode to this frame */'addBNode': function (id) {
        if (id != null) {
          if (this.parser.bnodes[id] != null) {
            this.node = this.parser.bnodes[id]
          } else {
            this.node = this.parser.bnodes[id] = this.store.bnode()
          }
        } else {
          this.node = this.store.bnode()
        }
        this.nodeType = this.NODE
        if (this.isTripleToLoad()) {
          this.loadTriple()
        }
      },         /** Add an arc or property to this frame */'addArc': function (uri) {
        if (uri === RDFParser.ns.RDF + 'li') {
          uri = RDFParser.ns.RDF + '_' + this.parent.listIndex
          this.parent.listIndex++
        }

        this.addSymbol(this.ARC, uri)
      },         /** Add a literal to this frame */'addLiteral': function (value) {
        if (this.parent.datatype) {
          this.node = this.store.literal(value, '', this.store.sym(this.parent.datatype))
        } else {
          this.node = this.store.literal(value, this.lang)
        }
        this.nodeType = this.NODE
        if (this.isTripleToLoad()) {
          this.loadTriple()
        }
      }
    }
  }

  // from the OpenLayers source .. needed to get around IE problems.
  this.getAttributeNodeNS = function (node, uri, name) {
    var attributeNode = null
    if (node.getAttributeNodeNS) {
      attributeNode = node.getAttributeNodeNS(uri, name)
    } else {
      var attributes = node.attributes
      var potentialNode, fullName
      for (var i = 0;i < attributes.length; ++i) {
        potentialNode = attributes[i]
        if (potentialNode.namespaceURI === uri) {
          fullName = (potentialNode.prefix) ? (potentialNode.prefix + ':' + name) : name
          if (fullName === potentialNode.nodeName) {
            attributeNode = potentialNode
            break
          }
        }
      }
    }
    return attributeNode
  }

  /** Our triple store reference @private */

  this.store = store /** Our identified blank nodes @private */
  this.bnodes = {} /** A context for context-aware stores @private */
  this.why = null /** Reification flag */
  this.reify = false

  /**
   * Build our initial scope frame and parse the DOM into triples
   * @param {DOMTree} document The DOM to parse
   * @param {String} base The base URL to use
   * @param {Object} why The context to which this resource belongs
   */

  this.parse = function (document, base, why) {
    var children = document.childNodes // clean up for the next run
    this.cleanParser() // figure out the root element
    var root
    if (document.nodeType === RDFParser.nodeType.DOCUMENT) {
      for (var c = 0;c < children.length;c++) {
        if (children[c].nodeType === RDFParser.nodeType.ELEMENT) {
          root = children[c]
          break
        }
      }
    } else if (document.nodeType === RDFParser.nodeType.ELEMENT) {
      root = document
    } else {
      throw new Error("RDFParser: can't find root in " + base + '. Halting. ')
    // return false
    }
    this.why = why // our topmost frame
    var f = this.frameFactory(this)
    this.base = base
    f.base = base
    f.lang = null // was '' but can't have langs like that 2015 (!)
    this.parseDOM(this.buildFrame(f, root))
    return true
  }

  this.parseDOM = function (frame) {
    // a DOM utility function used in parsing
    var rdfid
    var elementURI = function (el) {
      var result = ''
      if (el.namespaceURI == null) {
        throw new Error('RDF/XML syntax error: No namespace for ' + el.localName + ' in ' + this.base)
      }
      if (el.namespaceURI) {
        result = result + el.namespaceURI
      }
      if (el.localName) {
        result = result + el.localName
      } else if (el.nodeName) {
        if (el.nodeName.indexOf(':') >= 0)result = result + el.nodeName.split(':')[1]
        else result = result + el.nodeName
      }
      return result
    }.bind(this)
    var dig = true // if we'll dig down in the tree on the next iter
    while (frame.parent) {
      var dom = frame.element
      var attrs = dom.attributes
      if (dom.nodeType === RDFParser.nodeType.TEXT || dom.nodeType === RDFParser.nodeType.CDATA_SECTION) {
        // we have a literal
        if (frame.parent.nodeType === frame.NODE) {
          // must have had attributes, store as rdf:value
          frame.addArc(RDFParser.ns.RDF + 'value')
          frame = this.buildFrame(frame)
        }
        frame.addLiteral(dom.nodeValue)
      } else if (elementURI(dom) !== RDFParser.ns.RDF + 'RDF') {
        // not root
        if (frame.parent && frame.parent.collection) {
          // we're a collection element
          frame.addCollectionArc()
          frame = this.buildFrame(frame, frame.element)
          frame.parent.element = null
        }
        if (!frame.parent || !frame.parent.nodeType || frame.parent.nodeType === frame.ARC) {
          // we need a node
          var about = this.getAttributeNodeNS(dom, RDFParser.ns.RDF, 'about')
          rdfid = this.getAttributeNodeNS(dom, RDFParser.ns.RDF, 'ID')
          if (about && rdfid) {
            throw new Error('RDFParser: ' + dom.nodeName + ' has both rdf:id and rdf:about.' +
              ' Halting. Only one of these' + ' properties may be specified on a' + ' node.')
          }
          if (!about && rdfid) {
            frame.addNode('#' + rdfid.nodeValue)
            dom.removeAttributeNode(rdfid)
          } else if (about == null && rdfid == null) {
            var bnid = this.getAttributeNodeNS(dom, RDFParser.ns.RDF, 'nodeID')
            if (bnid) {
              frame.addBNode(bnid.nodeValue)
              dom.removeAttributeNode(bnid)
            } else {
              frame.addBNode()
            }
          } else {
            frame.addNode(about.nodeValue)
            dom.removeAttributeNode(about)
          }
          // Typed nodes
          var rdftype = this.getAttributeNodeNS(dom, RDFParser.ns.RDF, 'type')
          if (RDFParser.ns.RDF + 'Description' !== elementURI(dom)) {
            rdftype = {'nodeValue': elementURI(dom)}
          }
          if (rdftype != null) {
            this.store.add(frame.node, this.store.sym(RDFParser.ns.RDF + 'type'), this.store.sym($rdf.Util.uri.join(rdftype.nodeValue,
              frame.base)), this.why)
            if (rdftype.nodeName) {
              dom.removeAttributeNode(rdftype)
            }
          }
          // Property Attributes
          for (var x = attrs.length - 1; x >= 0; x--) {
            this.store.add(frame.node, this.store.sym(elementURI(attrs[x])), this.store.literal(attrs[x].nodeValue,
              frame.lang), this.why)
          }
        } else {
          // we should add an arc (or implicit bnode+arc)
          frame.addArc(elementURI(dom)) // save the arc's rdf:ID if it has one
          if (this.reify) {
            rdfid = this.getAttributeNodeNS(dom, RDFParser.ns.RDF, 'ID')
            if (rdfid) {
              frame.rdfid = rdfid.nodeValue
              dom.removeAttributeNode(rdfid)
            }
          }
          var parsetype = this.getAttributeNodeNS(dom, RDFParser.ns.RDF, 'parseType')
          var datatype = this.getAttributeNodeNS(dom, RDFParser.ns.RDF, 'datatype')
          if (datatype) {
            frame.datatype = datatype.nodeValue
            dom.removeAttributeNode(datatype)
          }
          if (parsetype) {
            var nv = parsetype.nodeValue
            if (nv === 'Literal') {
              frame.datatype = RDFParser.ns.RDF + 'XMLLiteral' // (this.buildFrame(frame)).addLiteral(dom)
              // should work but doesn't
              frame = this.buildFrame(frame)
              frame.addLiteral(dom)
              dig = false
            } else if (nv === 'Resource') {
              frame = this.buildFrame(frame, frame.element)
              frame.parent.element = null
              frame.addBNode()
            } else if (nv === 'Collection') {
              frame = this.buildFrame(frame, frame.element)
              frame.parent.element = null
              frame.addCollection()
            }
            dom.removeAttributeNode(parsetype)
          }
          if (attrs.length !== 0) {
            var resource = this.getAttributeNodeNS(dom, RDFParser.ns.RDF, 'resource')
            var bnid2 = this.getAttributeNodeNS(dom, RDFParser.ns.RDF, 'nodeID')
            frame = this.buildFrame(frame)
            if (resource) {
              frame.addNode(resource.nodeValue)
              dom.removeAttributeNode(resource)
            } else {
              if (bnid2) {
                frame.addBNode(bnid2.nodeValue)
                dom.removeAttributeNode(bnid2)
              } else {
                frame.addBNode()
              }
            }
            for (var x1 = attrs.length - 1; x1 >= 0; x1--) {
              var f = this.buildFrame(frame)
              f.addArc(elementURI(attrs[x1]))
              if (elementURI(attrs[x1]) === RDFParser.ns.RDF + 'type') {
                (this.buildFrame(f)).addNode(attrs[x1].nodeValue)
              } else {
                (this.buildFrame(f)).addLiteral(attrs[x1].nodeValue)
              }
            }
          } else if (dom.childNodes.length === 0) {
            (this.buildFrame(frame)).addLiteral('')
          }
        }
      } // rdf:RDF
      // dig dug
      dom = frame.element
      while (frame.parent) {
        var pframe = frame
        while (dom == null) {
          frame = frame.parent
          dom = frame.element
        }
        var candidate = dom.childNodes && dom.childNodes[frame.lastChild]
        if (!candidate || !dig) {
          frame.terminateFrame()
          if (!(frame = frame.parent)) {
            break
          } // done
          dom = frame.element
          dig = true
        } else if ((candidate.nodeType !== RDFParser.nodeType.ELEMENT &&
          candidate.nodeType !== RDFParser.nodeType.TEXT &&
          candidate.nodeType !== RDFParser.nodeType.CDATA_SECTION) ||
          ((candidate.nodeType === RDFParser.nodeType.TEXT ||
          candidate.nodeType === RDFParser.nodeType.CDATA_SECTION) &&
          dom.childNodes.length !== 1)) {
          frame.lastChild++
        } else {
          // not a leaf
          frame.lastChild++
          frame = this.buildFrame(pframe, dom.childNodes[frame.lastChild - 1])
          break
        }
      }
    } // while
  }

  /**
   * Cleans out state from a previous parse run
   * @private
   */
  this.cleanParser = function () {
    this.bnodes = {}
    this.why = null
  }

  /**
   * Builds scope frame
   * @private
   */
  this.buildFrame = function (parent, element) {
    var frame = this.frameFactory(this, parent, element)
    if (parent) {
      frame.base = parent.base
      frame.lang = parent.lang
    }
    if (!element || element.nodeType === RDFParser.nodeType.TEXT ||
      element.nodeType === RDFParser.nodeType.CDATA_SECTION) {
      return frame
    }
    var attrs = element.attributes
    var base = element.getAttributeNode('xml:base')
    if (base != null) {
      frame.base = base.nodeValue
      element.removeAttribute('xml:base')
    }
    var lang = element.getAttributeNode('xml:lang')
    if (lang != null) {
      frame.lang = lang.nodeValue
      element.removeAttribute('xml:lang')
    }
    // remove all extraneous xml and xmlns attributes
    for (var x = attrs.length - 1;x >= 0;x--) {
      if (attrs[x].nodeName.substr(0, 3) === 'xml') {
        if (attrs[x].name.slice(0, 6) === 'xmlns:') {
          var uri = attrs[x].nodeValue // alert('base for namespac attr:'+this.base)
          if (this.base) uri = $rdf.Util.uri.join(uri, this.base)
          this.store.setPrefixForURI(attrs[x].name.slice(6), uri)
        }
        //		alert('rdfparser: xml atribute: '+attrs[x].name) //@@
        element.removeAttributeNode(attrs[x])
      }
    }
    return frame
  }
}
/**
*
*  UTF-8 data encode / decode
*  http://www.webtoolkit.info/
*
**/

$rdf.N3Parser = function () {

function hexify(str) { // also used in parser
  return encodeURI(str);
}

var Utf8 = {

    // public method for url encoding
    encode : function (string) {
        string = string.replace(/\r\n/g,"\n");
        var utftext = "";

        for (var n = 0; n < string.length; n++) {

            var c = string.charCodeAt(n);

            if (c < 128) {
                    utftext += String.fromCharCode(c);
            }
            else if((c > 127) && (c < 2048)) {
                    utftext += String.fromCharCode((c >> 6) | 192);
                    utftext += String.fromCharCode((c & 63) | 128);
            }
            else {
                    utftext += String.fromCharCode((c >> 12) | 224);
                    utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                    utftext += String.fromCharCode((c & 63) | 128);
            }

        }

        return utftext;
    },

    // public method for url decoding
    decode : function (utftext) {
        var string = "";
        var i = 0;

        while ( i < utftext.length ) {

                var c = utftext.charCodeAt(i);
                if (c < 128) {
                        string += String.fromCharCode(c);
                        i++;
                }
                else if((c > 191) && (c < 224)) {
                        string += String.fromCharCode(((c & 31) << 6)
                            | (utftext.charCodeAt(i+1) & 63));
                        i += 2;
                }
                else {
                        string += String.fromCharCode(((c & 15) << 12)
                            | ((utftext.charCodeAt(i+1) & 63) << 6)
                            | (utftext.charCodeAt(i+2) & 63));
                        i += 3;
                }
        }
        return string;
    }

}// Things we need to define to make converted pythn code work in js
// environment of $rdf

var RDFSink_forSomeSym = "http://www.w3.org/2000/10/swap/log#forSome";
var RDFSink_forAllSym = "http://www.w3.org/2000/10/swap/log#forAll";
var Logic_NS = "http://www.w3.org/2000/10/swap/log#";

//  pyjs seems to reference runtime library which I didn't find

var pyjslib_Tuple = function(theList) { return theList };

var pyjslib_List = function(theList) { return theList };

var pyjslib_Dict = function(listOfPairs) {
    if (listOfPairs.length > 0)
	throw "missing.js: oops nnonempty dict not imp";
    return [];
}

var pyjslib_len = function(s) { return s.length }

var pyjslib_slice = function(str, i, j) {
    if (typeof str.slice == 'undefined')
        throw '@@ mising.js: No .slice function for '+str+' of type '+(typeof str) 
    if ((typeof j == 'undefined') || (j ==null)) return str.slice(i);
    return str.slice(i, j) // @ exactly the same spec?
}
var StopIteration = Error('dummy error stop iteration');

var pyjslib_Iterator = function(theList) {
    this.last = 0;
    this.li = theList;
    this.next = function() {
	if (this.last == this.li.length) throw StopIteration;
	return this.li[this.last++];
    }
    return this;
};

var ord = function(str) {
    return str.charCodeAt(0)
}

var string_find = function(str, s) {
    return str.indexOf(s)
}

var assertFudge = function(condition, desc) {
    if (condition) return;
    if (desc) throw "python Assertion failed: "+desc;
    throw "(python) Assertion failed.";  
}


var stringFromCharCode = function(uesc) {
    return String.fromCharCode(uesc);
}


String.prototype.encode = function(encoding) {
    if (encoding != 'utf-8') throw "UTF8_converter: can only do utf-8"
    return Utf8.encode(this);
}
String.prototype.decode = function(encoding) {
    if (encoding != 'utf-8') throw "UTF8_converter: can only do utf-8"
    //return Utf8.decode(this);
    return this;
}



var uripath_join = function(base, given) {
    return $rdf.Util.uri.join(given, base)  // sad but true
}

var becauseSubexpression = null; // No reason needed
var diag_tracking = 0;
var diag_chatty_flag = 0;
var diag_progress = function(str) { /*$rdf.log.debug(str);*/ }

// why_BecauseOfData = function(doc, reason) { return doc };


var RDF_type_URI = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
var DAML_sameAs_URI = "http://www.w3.org/2002/07/owl#sameAs";

/*
function SyntaxError(details) {
    return new __SyntaxError(details);
}
*/

function __SyntaxError(details) {
    this.details = details
}

/*

$Id: n3parser.js 14561 2008-02-23 06:37:26Z kennyluck $

HAND EDITED FOR CONVERSION TO JAVASCRIPT

This module implements a Nptation3 parser, and the final
part of a notation3 serializer.

See also:

Notation 3
http://www.w3.org/DesignIssues/Notation3

Closed World Machine - and RDF Processor
http://www.w3.org/2000/10/swap/cwm

To DO: See also "@@" in comments

- Clean up interfaces
______________________________________________

Module originally by Dan Connolly, includeing notation3
parser and RDF generator. TimBL added RDF stream model
and N3 generation, replaced stream model with use
of common store/formula API.  Yosi Scharf developped
the module, including tests and test harness.

*/

var ADDED_HASH = "#";
var LOG_implies_URI = "http://www.w3.org/2000/10/swap/log#implies";
var INTEGER_DATATYPE = "http://www.w3.org/2001/XMLSchema#integer";
var FLOAT_DATATYPE = "http://www.w3.org/2001/XMLSchema#double";
var DECIMAL_DATATYPE = "http://www.w3.org/2001/XMLSchema#decimal";
var DATE_DATATYPE = "http://www.w3.org/2001/XMLSchema#date";
var DATETIME_DATATYPE = "http://www.w3.org/2001/XMLSchema#dateTime";
var BOOLEAN_DATATYPE = "http://www.w3.org/2001/XMLSchema#boolean";
var option_noregen = 0;
var _notQNameChars = "\t\r\n !\"#$%&'()*.,+/;<=>?@[\\]^`{|}~";
var _notNameChars =  ( _notQNameChars + ":" ) ;
var _rdfns = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
var N3CommentCharacter = "#";
var eol = new RegExp("^[ \\t]*(#[^\\n]*)?\\r?\\n", 'g');
var eof = new RegExp("^[ \\t]*(#[^\\n]*)?$", 'g');
var ws = new RegExp("^[ \\t]*", 'g');
var signed_integer = new RegExp("^[-+]?[0-9]+", 'g');
var number_syntax = new RegExp("^([-+]?[0-9]+)(\\.[0-9]+)?(e[-+]?[0-9]+)?", 'g');
var datetime_syntax = new RegExp('^[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9](T[0-9][0-9]:[0-9][0-9](:[0-9][0-9](\\.[0-9]*)?)?)?Z?');

var digitstring = new RegExp("^[0-9]+", 'g');
var interesting = new RegExp("[\\\\\\r\\n\\\"]", 'g');
var langcode = new RegExp("^[a-zA-Z0-9]+(-[a-zA-Z0-9]+)?", 'g');
function SinkParser(store, openFormula, thisDoc, baseURI, genPrefix, metaURI, flags, why) {
    return new __SinkParser(store, openFormula, thisDoc, baseURI, genPrefix, metaURI, flags, why);
}
function __SinkParser(store, openFormula, thisDoc, baseURI, genPrefix, metaURI, flags, why) {
    if (typeof openFormula == 'undefined') openFormula=null;
    if (typeof thisDoc == 'undefined') thisDoc="";
    if (typeof baseURI == 'undefined') baseURI=null;
    if (typeof genPrefix == 'undefined') genPrefix="";
    if (typeof metaURI == 'undefined') metaURI=null;
    if (typeof flags == 'undefined') flags="";
    if (typeof why == 'undefined') why=null;
    /*
    note: namespace names should *not* end in #;
    the # will get added during qname processing */
    
    this._bindings = new pyjslib_Dict([]);
    this._flags = flags;
    if ((thisDoc != "")) {
        assertFudge((thisDoc.indexOf(":") >= 0),  ( "Document URI not absolute: " + thisDoc ) );
        this._bindings[""] = (  ( thisDoc + "#" ) );
    }
    this._store = store;
    if (genPrefix) {
        store.setGenPrefix(genPrefix);
    }
    this._thisDoc = thisDoc;
    this.source = store.sym(thisDoc);
    this.lines = 0;
    this.statementCount = 0;
    this.startOfLine = 0;
    this.previousLine = 0;
    this._genPrefix = genPrefix;
    this.keywords = new pyjslib_List(["a", "this", "bind", "has", "is", "of", "true", "false"]);
    this.keywordsSet = 0;
    this._anonymousNodes = new pyjslib_Dict([]);
    this._variables = new pyjslib_Dict([]);
    this._parentVariables = new pyjslib_Dict([]);
    this._reason = why;
    this._reason2 = null;
    if (diag_tracking) {
        this._reason2 = why_BecauseOfData(store.sym(thisDoc), this._reason);
    }
    if (baseURI) {
        this._baseURI = baseURI;
    }
    else {
        if (thisDoc) {
            this._baseURI = thisDoc;
        }
        else {
            this._baseURI = null;
        }
    }
    assertFudge(!(this._baseURI) || (this._baseURI.indexOf(":") >= 0));
    if (!(this._genPrefix)) {
        if (this._thisDoc) {
            this._genPrefix =  ( this._thisDoc + "#_g" ) ;
        }
        else {
            this._genPrefix = RDFSink_uniqueURI();
        }
    }
    if ((openFormula == null)) {
        if (this._thisDoc) {
            this._formula = store.formula( ( thisDoc + "#_formula" ) );
        }
        else {
            this._formula = store.formula();
        }
    }
    else {
        this._formula = openFormula;
    }
    this._context = this._formula;
    this._parentContext = null;
}
__SinkParser.prototype.here = function(i) {
    return  (  (  (  ( this._genPrefix + "_L" )  + this.lines )  + "C" )  +  (  ( i - this.startOfLine )  + 1 )  ) ;
};
__SinkParser.prototype.formula = function() {
    return this._formula;
};
__SinkParser.prototype.loadStream = function(stream) {
    return this.loadBuf(stream.read());
};
__SinkParser.prototype.loadBuf = function(buf) {
    /*
    Parses a buffer and returns its top level formula*/
    
    this.startDoc();
    this.feed(buf);
    return this.endDoc();
};
__SinkParser.prototype.feed = function(octets) {
    /*
    Feed an octet stream tothe parser
    
    if BadSyntax is raised, the string
    passed in the exception object is the
    remainder after any statements have been parsed.
    So if there is more data to feed to the
    parser, it should be straightforward to recover.*/
    
    var str = octets.decode("utf-8");
    var i = 0;
    while ((i >= 0)) {
        var j = this.skipSpace(str, i);
        if ((j < 0)) {
            return;
        }
        var i = this.directiveOrStatement(str, j);
        if ((i < 0)) {
            throw BadSyntax(this._thisDoc, this.lines, str, j, "expected directive or statement");
        }
    }
};
__SinkParser.prototype.directiveOrStatement = function(str, h) {
    var i = this.skipSpace(str, h);
    if ((i < 0)) {
        return i;
    }
    var j = this.directive(str, i);
    if ((j >= 0)) {
        return this.checkDot(str, j);
    }
    var j = this.statement(str, i);
    if ((j >= 0)) {
        return this.checkDot(str, j);
    }
    return j;
};
__SinkParser.prototype.tok = function(tok, str, i) {
    /*
    Check for keyword.  Space must have been stripped on entry and
    we must not be at end of file.*/
    var whitespace = "\t\n\v\f\r ";
    if ((pyjslib_slice(str, i,  ( i + 1 ) ) == "@")) {
        var i =  ( i + 1 ) ;
    }
    else {
        if (($rdf.Util.ArrayIndexOf(this.keywords,tok) < 0)) {
            return -1;
        }
    }
    var k =  ( i + pyjslib_len(tok) ) ;
    if ((pyjslib_slice(str, i, k) == tok) && (_notQNameChars.indexOf(str.charAt(k)) >= 0)) {
        return k;
    }
    else {
        return -1;
    }
};
__SinkParser.prototype.directive = function(str, i) {
    var j = this.skipSpace(str, i);
    if ((j < 0)) {
        return j;
    }
    var res = new pyjslib_List([]);
    var j = this.tok("bind", str, i);
    if ((j > 0)) {
        throw BadSyntax(this._thisDoc, this.lines, str, i, "keyword bind is obsolete: use @prefix");
    }
    var j = this.tok("keywords", str, i);
    if ((j > 0)) {
        var i = this.commaSeparatedList(str, j, res, false);
        if ((i < 0)) {
            throw BadSyntax(this._thisDoc, this.lines, str, i, "'@keywords' needs comma separated list of words");
        }
        this.setKeywords(pyjslib_slice(res, null, null));
        if ((diag_chatty_flag > 80)) {
            diag_progress("Keywords ", this.keywords);
        }
        return i;
    }
    var j = this.tok("forAll", str, i);
    if ((j > 0)) {
        var i = this.commaSeparatedList(str, j, res, true);
        if ((i < 0)) {
            throw BadSyntax(this._thisDoc, this.lines, str, i, "Bad variable list after @forAll");
        }
        
        var __x = new pyjslib_Iterator(res);
        try {
            while (true) {
                var x = __x.next();
                
                
                if ($rdf.Util.ArrayIndexOf(this._variables,x) < 0 || ($rdf.Util.ArrayIndexOf(this._parentVariables,x) >= 0)) {
                    this._variables[x] = ( this._context.newUniversal(x));
                }
                
            }
        } catch (e) {
            if (e != StopIteration) {
                throw e;
            }
        }
        
        return i;
    }
    var j = this.tok("forSome", str, i);
    if ((j > 0)) {
        var i = this.commaSeparatedList(str, j, res, this.uri_ref2);
        if ((i < 0)) {
            throw BadSyntax(this._thisDoc, this.lines, str, i, "Bad variable list after @forSome");
        }
        
        var __x = new pyjslib_Iterator(res);
        try {
            while (true) {
                var x = __x.next();
                
                
                this._context.declareExistential(x);
                
            }
        } catch (e) {
            if (e != StopIteration) {
                throw e;
            }
        }
        
        return i;
    }
    var j = this.tok("prefix", str, i);
    if ((j >= 0)) {
        var t = new pyjslib_List([]);
        var i = this.qname(str, j, t);
        if ((i < 0)) {
            throw BadSyntax(this._thisDoc, this.lines, str, j, "expected qname after @prefix");
        }
        var j = this.uri_ref2(str, i, t);
        if ((j < 0)) {
            throw BadSyntax(this._thisDoc, this.lines, str, i, "expected <uriref> after @prefix _qname_");
        }
        var ns = t[1].uri;
        if (this._baseURI) {
            var ns = uripath_join(this._baseURI, ns);
        }
        else {
            assertFudge((ns.indexOf(":") >= 0), "With no base URI, cannot handle relative URI for NS");
        }
        assertFudge((ns.indexOf(":") >= 0));
        this._bindings[t[0][0]] = ( ns);
        
        this.bind(t[0][0], hexify(ns));
        return j;
    }
    var j = this.tok("base", str, i);
    if ((j >= 0)) {
        var t = new pyjslib_List([]);
        var i = this.uri_ref2(str, j, t);
        if ((i < 0)) {
            throw BadSyntax(this._thisDoc, this.lines, str, j, "expected <uri> after @base ");
        }
        var ns = t[0].uri;
        if (this._baseURI) {
            var ns = uripath_join(this._baseURI, ns);
        }
        else {
            throw BadSyntax(this._thisDoc, this.lines, str, j,  (  ( "With no previous base URI, cannot use relative URI in @base  <" + ns )  + ">" ) );
        }
        assertFudge((ns.indexOf(":") >= 0));
        this._baseURI = ns;
        return i;
    }
    return -1;
};
__SinkParser.prototype.bind = function(qn, uri) {
    if ((qn == "")) {
    }
    else {
        this._store.setPrefixForURI(qn, uri);
    }
};
__SinkParser.prototype.setKeywords = function(k) {
    /*
    Takes a list of strings*/
    
    if ((k == null)) {
        this.keywordsSet = 0;
    }
    else {
        this.keywords = k;
        this.keywordsSet = 1;
    }
};
__SinkParser.prototype.startDoc = function() {
};
__SinkParser.prototype.endDoc = function() {
    /*
    Signal end of document and stop parsing. returns formula*/
    
    return this._formula;
};
__SinkParser.prototype.makeStatement = function(quad) {
    quad[0].add(quad[2], quad[1], quad[3], this.source);
    this.statementCount += 1;
};
__SinkParser.prototype.statement = function(str, i) {
    var r = new pyjslib_List([]);
    var i = this.object(str, i, r);
    if ((i < 0)) {
        return i;
    }
    var j = this.property_list(str, i, r[0]);
    if ((j < 0)) {
        throw BadSyntax(this._thisDoc, this.lines, str, i, "expected propertylist");
    }
    return j;
};
__SinkParser.prototype.subject = function(str, i, res) {
    return this.item(str, i, res);
};
__SinkParser.prototype.verb = function(str, i, res) {
    /*
    has _prop_
    is _prop_ of
    a
    =
    _prop_
    >- prop ->
    <- prop -<
    _operator_*/
    
    var j = this.skipSpace(str, i);
    if ((j < 0)) {
        return j;
    }
    var r = new pyjslib_List([]);
    var j = this.tok("has", str, i);
    if ((j >= 0)) {
        var i = this.prop(str, j, r);
        if ((i < 0)) {
            throw BadSyntax(this._thisDoc, this.lines, str, j, "expected property after 'has'");
        }
        res.push(new pyjslib_Tuple(["->", r[0]]));
        return i;
    }
    var j = this.tok("is", str, i);
    if ((j >= 0)) {
        var i = this.prop(str, j, r);
        if ((i < 0)) {
            throw BadSyntax(this._thisDoc, this.lines, str, j, "expected <property> after 'is'");
        }
        var j = this.skipSpace(str, i);
        if ((j < 0)) {
            throw BadSyntax(this._thisDoc, this.lines, str, i, "End of file found, expected property after 'is'");
            return j;
        }
        var i = j;
        var j = this.tok("of", str, i);
        if ((j < 0)) {
            throw BadSyntax(this._thisDoc, this.lines, str, i, "expected 'of' after 'is' <prop>");
        }
        res.push(new pyjslib_Tuple(["<-", r[0]]));
        return j;
    }
    var j = this.tok("a", str, i);
    if ((j >= 0)) {
        res.push(new pyjslib_Tuple(["->", this._store.sym(RDF_type_URI)]));
        return j;
    }
    if ((pyjslib_slice(str, i,  ( i + 2 ) ) == "<=")) {
        res.push(new pyjslib_Tuple(["<-", this._store.sym( ( Logic_NS + "implies" ) )]));
        return  ( i + 2 ) ;
    }
    if ((pyjslib_slice(str, i,  ( i + 1 ) ) == "=")) {
        if ((pyjslib_slice(str,  ( i + 1 ) ,  ( i + 2 ) ) == ">")) {
            res.push(new pyjslib_Tuple(["->", this._store.sym( ( Logic_NS + "implies" ) )]));
            return  ( i + 2 ) ;
        }
        res.push(new pyjslib_Tuple(["->", this._store.sym(DAML_sameAs_URI)]));
        return  ( i + 1 ) ;
    }
    if ((pyjslib_slice(str, i,  ( i + 2 ) ) == ":=")) {
        res.push(new pyjslib_Tuple(["->",  ( Logic_NS + "becomes" ) ]));
        return  ( i + 2 ) ;
    }
    var j = this.prop(str, i, r);
    if ((j >= 0)) {
        res.push(new pyjslib_Tuple(["->", r[0]]));
        return j;
    }
    if ((pyjslib_slice(str, i,  ( i + 2 ) ) == ">-") || (pyjslib_slice(str, i,  ( i + 2 ) ) == "<-")) {
        throw BadSyntax(this._thisDoc, this.lines, str, j, ">- ... -> syntax is obsolete.");
    }
    return -1;
};
__SinkParser.prototype.prop = function(str, i, res) {
    return this.item(str, i, res);
};
__SinkParser.prototype.item = function(str, i, res) {
    return this.path(str, i, res);
};
__SinkParser.prototype.blankNode = function(uri) {
    return this._context.bnode(uri, this._reason2);
};
__SinkParser.prototype.path = function(str, i, res) {
    /*
    Parse the path production.
    */
    
    var j = this.nodeOrLiteral(str, i, res);
    if ((j < 0)) {
        return j;
    }
    while (("!^.".indexOf(pyjslib_slice(str, j,  ( j + 1 ) )) >= 0)) {
        var ch = pyjslib_slice(str, j,  ( j + 1 ) );
        if ((ch == ".")) {
            var ahead = pyjslib_slice(str,  ( j + 1 ) ,  ( j + 2 ) );
            if (!(ahead) || (_notNameChars.indexOf(ahead) >= 0) && (":?<[{(".indexOf(ahead) < 0)) {
                break;
            }
        }
        var subj = res.pop();
        var obj = this.blankNode(this.here(j));
        var j = this.node(str,  ( j + 1 ) , res);
        if ((j < 0)) {
            throw BadSyntax(this._thisDoc, this.lines, str, j, "EOF found in middle of path syntax");
        }
        var pred = res.pop();
        if ((ch == "^")) {
            this.makeStatement(new pyjslib_Tuple([this._context, pred, obj, subj]));
        }
        else {
            this.makeStatement(new pyjslib_Tuple([this._context, pred, subj, obj]));
        }
        res.push(obj);
    }
    return j;
};
__SinkParser.prototype.anonymousNode = function(ln) {
    /*
    Remember or generate a term for one of these _: anonymous nodes*/
    
    var term = this._anonymousNodes[ln];
    if (term) {
        return term;
    }
    var term = this._store.bnode(this._context, this._reason2);
    this._anonymousNodes[ln] = ( term);
    return term;
};
__SinkParser.prototype.node = function(str, i, res, subjectAlready) {
    if (typeof subjectAlready == 'undefined') subjectAlready=null;
    /*
    Parse the <node> production.
    Space is now skipped once at the beginning
    instead of in multipe calls to self.skipSpace().
    */
    
    var subj = subjectAlready;
    var j = this.skipSpace(str, i);
    if ((j < 0)) {
        return j;
    }
    var i = j;
    var ch = pyjslib_slice(str, i,  ( i + 1 ) );
    if ((ch == "[")) {
        var bnodeID = this.here(i);
        var j = this.skipSpace(str,  ( i + 1 ) );
        if ((j < 0)) {
            throw BadSyntax(this._thisDoc, this.lines, str, i, "EOF after '['");
        }
        if ((pyjslib_slice(str, j,  ( j + 1 ) ) == "=")) {
            var i =  ( j + 1 ) ;
            var objs = new pyjslib_List([]);
            var j = this.objectList(str, i, objs);
            
            if ((j >= 0)) {
                var subj = objs[0];
                if ((pyjslib_len(objs) > 1)) {
                    
                    var __obj = new pyjslib_Iterator(objs);
                    try {
                        while (true) {
                            var obj = __obj.next();
                            
                            
                            this.makeStatement(new pyjslib_Tuple([this._context, this._store.sym(DAML_sameAs_URI), subj, obj]));
                            
                        }
                    } catch (e) {
                        if (e != StopIteration) {
                            throw e;
                        }
                    }
                    
                }
                var j = this.skipSpace(str, j);
                if ((j < 0)) {
                    throw BadSyntax(this._thisDoc, this.lines, str, i, "EOF when objectList expected after [ = ");
                }
                if ((pyjslib_slice(str, j,  ( j + 1 ) ) == ";")) {
                    var j =  ( j + 1 ) ;
                }
            }
            else {
                throw BadSyntax(this._thisDoc, this.lines, str, i, "objectList expected after [= ");
            }
        }
        if ((subj == null)) {
            var subj = this.blankNode(bnodeID);
        }
        var i = this.property_list(str, j, subj);
        if ((i < 0)) {
            throw BadSyntax(this._thisDoc, this.lines, str, j, "property_list expected");
        }
        var j = this.skipSpace(str, i);
        if ((j < 0)) {
            throw BadSyntax(this._thisDoc, this.lines, str, i, "EOF when ']' expected after [ <propertyList>");
        }
        if ((pyjslib_slice(str, j,  ( j + 1 ) ) != "]")) {
            throw BadSyntax(this._thisDoc, this.lines, str, j, "']' expected");
        }
        res.push(subj);
        return  ( j + 1 ) ;
    }
    if ((ch == "{")) {
        var ch2 = pyjslib_slice(str,  ( i + 1 ) ,  ( i + 2 ) );
        if ((ch2 == "$")) {
            i += 1;
            var j =  ( i + 1 ) ;
            var mylist = new pyjslib_List([]);
            var first_run = true;
            while (1) {
                var i = this.skipSpace(str, j);
                if ((i < 0)) {
                    throw BadSyntax(this._thisDoc, this.lines, str, i, "needed '$}', found end.");
                }
                if ((pyjslib_slice(str, i,  ( i + 2 ) ) == "$}")) {
                    var j =  ( i + 2 ) ;
                    break;
                }
                if (!(first_run)) {
                    if ((pyjslib_slice(str, i,  ( i + 1 ) ) == ",")) {
                        i += 1;
                    }
                    else {
                        throw BadSyntax(this._thisDoc, this.lines, str, i, "expected: ','");
                    }
                }
                else {
                    var first_run = false;
                }
                var item = new pyjslib_List([]);
                var j = this.item(str, i, item);
                if ((j < 0)) {
                    throw BadSyntax(this._thisDoc, this.lines, str, i, "expected item in set or '$}'");
                }
                mylist.push(item[0]);
            }
            res.push(this._store.newSet(mylist, this._context));
            return j;
        }
        else {
            var j =  ( i + 1 ) ;
            var oldParentContext = this._parentContext;
            this._parentContext = this._context;
            var parentAnonymousNodes = this._anonymousNodes;
            var grandParentVariables = this._parentVariables;
            this._parentVariables = this._variables;
            this._anonymousNodes = new pyjslib_Dict([]);
            this._variables = this._variables.slice();
            var reason2 = this._reason2;
            this._reason2 = becauseSubexpression;
            if ((subj == null)) {
                var subj = this._store.formula();
            }
            this._context = subj;
            while (1) {
                var i = this.skipSpace(str, j);
                if ((i < 0)) {
                    throw BadSyntax(this._thisDoc, this.lines, str, i, "needed '}', found end.");
                }
                if ((pyjslib_slice(str, i,  ( i + 1 ) ) == "}")) {
                    var j =  ( i + 1 ) ;
                    break;
                }
                var j = this.directiveOrStatement(str, i);
                if ((j < 0)) {
                    throw BadSyntax(this._thisDoc, this.lines, str, i, "expected statement or '}'");
                }
            }
            this._anonymousNodes = parentAnonymousNodes;
            this._variables = this._parentVariables;
            this._parentVariables = grandParentVariables;
            this._context = this._parentContext;
            this._reason2 = reason2;
            this._parentContext = oldParentContext;
            res.push(subj.close());
            return j;
        }
    }
    if ((ch == "(")) {
        var thing_type = this._store.list;
        var ch2 = pyjslib_slice(str,  ( i + 1 ) ,  ( i + 2 ) );
        if ((ch2 == "$")) {
            var thing_type = this._store.newSet;
            i += 1;
        }
        var j =  ( i + 1 ) ;
        var mylist = new pyjslib_List([]);
        while (1) {
            var i = this.skipSpace(str, j);
            if ((i < 0)) {
                throw BadSyntax(this._thisDoc, this.lines, str, i, "needed ')', found end.");
            }
            if ((pyjslib_slice(str, i,  ( i + 1 ) ) == ")")) {
                var j =  ( i + 1 ) ;
                break;
            }
            var item = new pyjslib_List([]);
            var j = this.item(str, i, item);
            if ((j < 0)) {
                throw BadSyntax(this._thisDoc, this.lines, str, i, "expected item in list or ')'");
            }
            mylist.push(item[0]);
        }
        res.push(thing_type(mylist, this._context));
        return j;
    }
    var j = this.tok("this", str, i);
    if ((j >= 0)) {
        throw BadSyntax(this._thisDoc, this.lines, str, i, "Keyword 'this' was ancient N3. Now use @forSome and @forAll keywords.");
        res.push(this._context);
        return j;
    }
    var j = this.tok("true", str, i);
    if ((j >= 0)) {
        res.push(true);
        return j;
    }
    var j = this.tok("false", str, i);
    if ((j >= 0)) {
        res.push(false);
        return j;
    }
    if ((subj == null)) {
        var j = this.uri_ref2(str, i, res);
        if ((j >= 0)) {
            return j;
        }
    }
    return -1;
};
__SinkParser.prototype.property_list = function(str, i, subj) {
    /*
    Parse property list
    Leaves the terminating punctuation in the buffer
    */
    
    while (1) {
        var j = this.skipSpace(str, i);
        if ((j < 0)) {
            throw BadSyntax(this._thisDoc, this.lines, str, i, "EOF found when expected verb in property list");
            return j;
        }
        if ((pyjslib_slice(str, j,  ( j + 2 ) ) == ":-")) {
            var i =  ( j + 2 ) ;
            var res = new pyjslib_List([]);
            var j = this.node(str, i, res, subj);
            if ((j < 0)) {
                throw BadSyntax(this._thisDoc, this.lines, str, i, "bad {} or () or [] node after :- ");
            }
            var i = j;
            continue;
        }
        var i = j;
        var v = new pyjslib_List([]);
        var j = this.verb(str, i, v);
        if ((j <= 0)) {
            return i;
        }
        var objs = new pyjslib_List([]);
        var i = this.objectList(str, j, objs);
        if ((i < 0)) {
            throw BadSyntax(this._thisDoc, this.lines, str, j, "objectList expected");
        }
        
        var __obj = new pyjslib_Iterator(objs);
        try {
            while (true) {
                var obj = __obj.next();
                
                
                var pairFudge = v[0];
                var dir = pairFudge[0];
                var sym = pairFudge[1];
                if ((dir == "->")) {
                    this.makeStatement(new pyjslib_Tuple([this._context, sym, subj, obj]));
                }
                else {
                    this.makeStatement(new pyjslib_Tuple([this._context, sym, obj, subj]));
                }
                
            }
        } catch (e) {
            if (e != StopIteration) {
                throw e;
            }
        }
        
        var j = this.skipSpace(str, i);
        if ((j < 0)) {
            throw BadSyntax(this._thisDoc, this.lines, str, j, "EOF found in list of objects");
            return j;
        }
        if ((pyjslib_slice(str, i,  ( i + 1 ) ) != ";")) {
            return i;
        }
        var i =  ( i + 1 ) ;
    }
};
__SinkParser.prototype.commaSeparatedList = function(str, j, res, ofUris) {
    /*
    return value: -1 bad syntax; >1 new position in str
    res has things found appended
    
    Used to use a final value of the function to be called, e.g. this.bareWord
    but passing the function didn't work fo js converion pyjs
    */
    
    var i = this.skipSpace(str, j);
    if ((i < 0)) {
        throw BadSyntax(this._thisDoc, this.lines, str, i, "EOF found expecting comma sep list");
        return i;
    }
    if ((str.charAt(i) == ".")) {
        return j;
    }
    if (ofUris) {
        var i = this.uri_ref2(str, i, res);
    }
    else {
        var i = this.bareWord(str, i, res);
    }
    if ((i < 0)) {
        return -1;
    }
    while (1) {
        var j = this.skipSpace(str, i);
        if ((j < 0)) {
            return j;
        }
        var ch = pyjslib_slice(str, j,  ( j + 1 ) );
        if ((ch != ",")) {
            if ((ch != ".")) {
                return -1;
            }
            return j;
        }
        if (ofUris) {
            var i = this.uri_ref2(str,  ( j + 1 ) , res);
        }
        else {
            var i = this.bareWord(str,  ( j + 1 ) , res);
        }
        if ((i < 0)) {
            throw BadSyntax(this._thisDoc, this.lines, str, i, "bad list content");
            return i;
        }
    }
};
__SinkParser.prototype.objectList = function(str, i, res) {
    var i = this.object(str, i, res);
    if ((i < 0)) {
        return -1;
    }
    while (1) {
        var j = this.skipSpace(str, i);
        if ((j < 0)) {
            throw BadSyntax(this._thisDoc, this.lines, str, j, "EOF found after object");
            return j;
        }
        if ((pyjslib_slice(str, j,  ( j + 1 ) ) != ",")) {
            return j;
        }
        var i = this.object(str,  ( j + 1 ) , res);
        if ((i < 0)) {
            return i;
        }
    }
};
__SinkParser.prototype.checkDot = function(str, i) {
    var j = this.skipSpace(str, i);
    if ((j < 0)) {
        return j;
    }
    if ((pyjslib_slice(str, j,  ( j + 1 ) ) == ".")) {
        return  ( j + 1 ) ;
    }
    if ((pyjslib_slice(str, j,  ( j + 1 ) ) == "}")) {
        return j;
    }
    if ((pyjslib_slice(str, j,  ( j + 1 ) ) == "]")) {
        return j;
    }
    throw BadSyntax(this._thisDoc, this.lines, str, j, "expected '.' or '}' or ']' at end of statement");
    return i;
};
__SinkParser.prototype.uri_ref2 = function(str, i, res) {
    /*
    Generate uri from n3 representation.
    
    Note that the RDF convention of directly concatenating
    NS and local name is now used though I prefer inserting a '#'
    to make the namesapces look more like what XML folks expect.
    */
    
    var qn = new pyjslib_List([]);
    var j = this.qname(str, i, qn);
    if ((j >= 0)) {
        var pairFudge = qn[0];
        var pfx = pairFudge[0];
        var ln = pairFudge[1];
        if ((pfx == null)) {
            assertFudge(0, "not used?");
            var ns =  ( this._baseURI + ADDED_HASH ) ;
        }
        else {
            var ns = this._bindings[pfx];
            if (!(ns)) {
                if ((pfx == "_")) {
                    res.push(this.anonymousNode(ln));
                    return j;
                }
                throw BadSyntax(this._thisDoc, this.lines, str, i,  (  ( "Prefix " + pfx )  + " not bound." ) );
            }
        }
        var symb = this._store.sym( ( ns + ln ) );
        if (($rdf.Util.ArrayIndexOf(this._variables, symb) >= 0)) {
            res.push(this._variables[symb]);
        }
        else {
            res.push(symb);
        }
        return j;
    }
    var i = this.skipSpace(str, i);
    if ((i < 0)) {
        return -1;
    }
    if ((str.charAt(i) == "?")) {
        var v = new pyjslib_List([]);
        var j = this.variable(str, i, v);
        if ((j > 0)) {
            res.push(v[0]);
            return j;
        }
        return -1;
    }
    else if ((str.charAt(i) == "<")) {
        var i =  ( i + 1 ) ;
        var st = i;
        while ((i < pyjslib_len(str))) {
            if ((str.charAt(i) == ">")) {
                var uref = pyjslib_slice(str, st, i);
                if (this._baseURI) {
                    var uref = uripath_join(this._baseURI, uref);
                }
                else {
                    assertFudge((uref.indexOf(":") >= 0), "With no base URI, cannot deal with relative URIs");
                }
                if ((pyjslib_slice(str,  ( i - 1 ) , i) == "#") && !((pyjslib_slice(uref, -1, null) == "#"))) {
                    var uref =  ( uref + "#" ) ;
                }
                var symb = this._store.sym(uref);
                if (($rdf.Util.ArrayIndexOf(this._variables,symb) >= 0)) {
                    res.push(this._variables[symb]);
                }
                else {
                    res.push(symb);
                }
                return  ( i + 1 ) ;
            }
            var i =  ( i + 1 ) ;
        }
        throw BadSyntax(this._thisDoc, this.lines, str, j, "unterminated URI reference");
    }
    else if (this.keywordsSet) {
        var v = new pyjslib_List([]);
        var j = this.bareWord(str, i, v);
        if ((j < 0)) {
            return -1;
        }
        if (($rdf.Util.ArrayIndexOf(this.keywords, v[0]) >= 0)) {
            throw BadSyntax(this._thisDoc, this.lines, str, i,  (  ( "Keyword \"" + v[0] )  + "\" not allowed here." ) );
        }
        res.push(this._store.sym( ( this._bindings[""] + v[0] ) ));
        return j;
    }
    else {
        return -1;
    }
};
__SinkParser.prototype.skipSpace = function(str, i) {
    /*
    Skip white space, newlines and comments.
    return -1 if EOF, else position of first non-ws character*/

    var whitespace = ' \n\r\t\f\x0b\xa0\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u200b\u2028\u2029\u3000';
    for (var j = (i ? i : 0); j < str.length; j++) {
        var ch = str.charAt(j);
        // console.log("    skipspace j= "+j + " i= " + i + " n= " + str.length);
        // console.log(" skipspace ch <" + ch + ">");
        if (whitespace.indexOf(ch) < 0 ) { //not ws
            // console.log(" skipspace 2 ch <" + ch + ">");
            if( str.charAt(j)==='#' ) {
                for (;; j++) {
                    // console.log("    skipspace2 j= "+j + " i= " + i + " n= " + str.length);
                    if (j === str.length) {
                        return -1; // EOF
                    }
                    if (str.charAt(j) === '\n') {
                        this.lines = this.lines + 1;
                        break;
                    }
                }; 
            } else { // Not hash - something interesting
                // console.log(" skipspace 3 ch <" + ch + ">");
                return j
            }
        } else { // Whitespace
            // console.log(" skipspace 5 ch <" + ch + ">");
            if (str.charAt(j) === '\n') {
                this.lines = this.lines + 1;
            }
        }
    } // next j
    return -1; // EOF
};

__SinkParser.prototype.variable = function(str, i, res) {
    /*
    ?abc -> variable(:abc)
    */
    
    var j = this.skipSpace(str, i);
    if ((j < 0)) {
        return -1;
    }
    if ((pyjslib_slice(str, j,  ( j + 1 ) ) != "?")) {
        return -1;
    }
    var j =  ( j + 1 ) ;
    var i = j;
    if (("0123456789-".indexOf(str.charAt(j)) >= 0)) {
        throw BadSyntax(this._thisDoc, this.lines, str, j,  (  ( "Varible name can't start with '" + str.charAt(j) )  + "s'" ) );
        return -1;
    }
    while ((i < pyjslib_len(str)) && (_notNameChars.indexOf(str.charAt(i)) < 0)) {
        var i =  ( i + 1 ) ;
    }
    if ((this._parentContext == null)) {
        throw BadSyntax(this._thisDoc, this.lines, str, j,  ( "Can't use ?xxx syntax for variable in outermost level: " + pyjslib_slice(str,  ( j - 1 ) , i) ) );
    }
    res.push(this._store.variable(pyjslib_slice(str, j, i)));
    return i;
};
__SinkParser.prototype.bareWord = function(str, i, res) {
    /*
    abc -> :abc
    */
    
    var j = this.skipSpace(str, i);
    if ((j < 0)) {
        return -1;
    }
    var ch = str.charAt(j);
    if (("0123456789-".indexOf(ch) >= 0)) {
        return -1;
    }
    if ((_notNameChars.indexOf(ch) >= 0)) {
        return -1;
    }
    var i = j;
    while ((i < pyjslib_len(str)) && (_notNameChars.indexOf(str.charAt(i)) < 0)) {
        var i =  ( i + 1 ) ;
    }
    res.push(pyjslib_slice(str, j, i));
    return i;
};
__SinkParser.prototype.qname = function(str, i, res) {
    /*
    
    xyz:def -> ('xyz', 'def')
    If not in keywords and keywordsSet: def -> ('', 'def')
    :def -> ('', 'def')    
    */
    
    var i = this.skipSpace(str, i);
    if ((i < 0)) {
        return -1;
    }
    var c = str.charAt(i);
    if (("0123456789-+".indexOf(c) >= 0)) {
        return -1;
    }
    if ((_notNameChars.indexOf(c) < 0)) {
        var ln = c;
        var i =  ( i + 1 ) ;
        while ((i < pyjslib_len(str))) {
            var c = str.charAt(i);
            if ((_notNameChars.indexOf(c) < 0)) {
                var ln =  ( ln + c ) ;
                var i =  ( i + 1 ) ;
            }
            else {
                break;
            }
        }
    }
    else {
        var ln = "";
    }
    if ((i < pyjslib_len(str)) && (str.charAt(i) == ":")) {
        var pfx = ln;
        var i =  ( i + 1 ) ;
        var ln = "";
        while ((i < pyjslib_len(str))) {
            var c = str.charAt(i);
            if ((_notNameChars.indexOf(c) < 0)) {
                var ln =  ( ln + c ) ;
                var i =  ( i + 1 ) ;
            }
            else {
                break;
            }
        }
        res.push(new pyjslib_Tuple([pfx, ln]));
        return i;
    }
    else {
        if (ln && this.keywordsSet && ($rdf.Util.ArrayIndexOf(this.keywords, ln) < 0)) {
            res.push(new pyjslib_Tuple(["", ln]));
            return i;
        }
        return -1;
    }
};
__SinkParser.prototype.object = function(str, i, res) {
    var j = this.subject(str, i, res);
    if ((j >= 0)) {
        return j;
    }
    else {
        var j = this.skipSpace(str, i);
        if ((j < 0)) {
            return -1;
        }
        else {
            var i = j;
        }
        if ((str.charAt(i) == "\"")) {
            if ((pyjslib_slice(str, i,  ( i + 3 ) ) == "\"\"\"")) {
                var delim = "\"\"\"";
            }
            else {
                var delim = "\"";
            }
            var i =  ( i + pyjslib_len(delim) ) ;
            var pairFudge = this.strconst(str, i, delim);
            var j = pairFudge[0];
            var s = pairFudge[1];
            res.push(this._store.literal(s));
            diag_progress("New string const ", s, j);
            return j;
        }
        else {
            return -1;
        }
    }
};
__SinkParser.prototype.nodeOrLiteral = function(str, i, res) {
    var j = this.node(str, i, res);
    if ((j >= 0)) {
        return j;
    }
    else {
        var j = this.skipSpace(str, i);
        if ((j < 0)) {
            return -1;
        }
        else {
            var i = j;
        }
        var ch = str.charAt(i);
        if (("-+0987654321".indexOf(ch) >= 0)) {
	
	    datetime_syntax.lastIndex = 0;
            var m = datetime_syntax.exec(str.slice(i));
            if ((m != null)) {
		// j =  ( i + datetime_syntax.lastIndex ) ;
		var val = m[0];
		j = i + val.length;
		if ((val.indexOf("T") >= 0)) {
		    res.push(this._store.literal(val, undefined, this._store.sym(DATETIME_DATATYPE)));
		} else {
		    res.push(this._store.literal(val, undefined, this._store.sym(DATE_DATATYPE)));
		}	
	
	    } else {
		number_syntax.lastIndex = 0;
		var m = number_syntax.exec(str.slice(i));
		if ((m == null)) {
		    throw BadSyntax(this._thisDoc, this.lines, str, i, "Bad number or date syntax");
		}
		j =  ( i + number_syntax.lastIndex ) ;
		var val = pyjslib_slice(str, i, j);
		if ((val.indexOf("e") >= 0)) {
		    res.push(this._store.literal(parseFloat(val), undefined, this._store.sym(FLOAT_DATATYPE)));
		}
		else if ((pyjslib_slice(str, i, j).indexOf(".") >= 0)) {
		    res.push(this._store.literal(parseFloat(val), undefined, this._store.sym(DECIMAL_DATATYPE)));
		}
		else {
		    res.push(this._store.literal(parseInt(val), undefined, this._store.sym(INTEGER_DATATYPE)));
		}
	    };
	    return j; // Where we have got up to
        }
        if ((str.charAt(i) == "\"")) {
            if ((pyjslib_slice(str, i,  ( i + 3 ) ) == "\"\"\"")) {
                var delim = "\"\"\"";
            }
            else {
                var delim = "\"";
            }
            var i =  ( i + pyjslib_len(delim) ) ;
            var dt = null;
            var pairFudge = this.strconst(str, i, delim);
            var j = pairFudge[0];
            var s = pairFudge[1];
            var lang = null;
            if ((pyjslib_slice(str, j,  ( j + 1 ) ) == "@")) {
                langcode.lastIndex = 0;
                
                var m = langcode.exec(str.slice( ( j + 1 ) ));
                if ((m == null)) {
                    throw BadSyntax(this._thisDoc, startline, str, i, "Bad language code syntax on string literal, after @");
                }
                var i =  (  ( langcode.lastIndex + j )  + 1 ) ;
                
                var lang = pyjslib_slice(str,  ( j + 1 ) , i);
                var j = i;
            }
            if ((pyjslib_slice(str, j,  ( j + 2 ) ) == "^^")) {
                var res2 = new pyjslib_List([]);
                var j = this.uri_ref2(str,  ( j + 2 ) , res2);
                var dt = res2[0];
            }
            res.push(this._store.literal(s, lang, dt));
            return j;
        }
        else {
            return -1;
        }
    }
};
__SinkParser.prototype.strconst = function(str, i, delim) {
    /*
    parse an N3 string constant delimited by delim.
    return index, val
    */
    
    var j = i;
    var ustr = "";
    var startline = this.lines;
    while ((j < pyjslib_len(str))) {
        var i =  ( j + pyjslib_len(delim) ) ;
        if ((pyjslib_slice(str, j, i) == delim)) {
            return new pyjslib_Tuple([i, ustr]);
        }
        if ((str.charAt(j) == "\"")) {
            var ustr =  ( ustr + "\"" ) ;
            var j =  ( j + 1 ) ;
            continue;
        }
        interesting.lastIndex = 0;
        var m = interesting.exec(str.slice(j));
        if (!(m)) {
            throw BadSyntax(this._thisDoc, startline, str, j,  (  (  ( "Closing quote missing in string at ^ in " + pyjslib_slice(str,  ( j - 20 ) , j) )  + "^" )  + pyjslib_slice(str, j,  ( j + 20 ) ) ) );
        }
        var i =  (  ( j + interesting.lastIndex )  - 1 ) ;
        var ustr =  ( ustr + pyjslib_slice(str, j, i) ) ;
        var ch = str.charAt(i);
        if ((ch == "\"")) {
            var j = i;
            continue;
        }
        else if ((ch == "\r")) {
            var j =  ( i + 1 ) ;
            continue;
        }
        else if ((ch == "\n")) {
            if ((delim == "\"")) {
                throw BadSyntax(this._thisDoc, startline, str, i, "newline found in string literal");
            }
            this.lines =  ( this.lines + 1 ) ;
            var ustr =  ( ustr + ch ) ;
            var j =  ( i + 1 ) ;
            this.previousLine = this.startOfLine;
            this.startOfLine = j;
        }
        else if ((ch == "\\")) {
            var j =  ( i + 1 ) ;
            var ch = pyjslib_slice(str, j,  ( j + 1 ) );
            if (!(ch)) {
                throw BadSyntax(this._thisDoc, startline, str, i, "unterminated string literal (2)");
            }
            var k = string_find("abfrtvn\\\"", ch);
            if ((k >= 0)) {
                var uch = "\a\b\f\r\t\v\n\\\"".charAt(k);
                var ustr =  ( ustr + uch ) ;
                var j =  ( j + 1 ) ;
            }
            else if ((ch == "u")) {
                var pairFudge = this.uEscape(str,  ( j + 1 ) , startline);
                var j = pairFudge[0];
                var ch = pairFudge[1];
                var ustr =  ( ustr + ch ) ;
            }
            else if ((ch == "U")) {
                var pairFudge = this.UEscape(str,  ( j + 1 ) , startline);
                var j = pairFudge[0];
                var ch = pairFudge[1];
                var ustr =  ( ustr + ch ) ;
            }
            else {
                throw BadSyntax(this._thisDoc, this.lines, str, i, "bad escape");
            }
        }
    }
    throw BadSyntax(this._thisDoc, this.lines, str, i, "unterminated string literal");
};
__SinkParser.prototype.uEscape = function(str, i, startline) {
    var j = i;
    var count = 0;
    var value = 0;
    while ((count < 4)) {
        var chFudge = pyjslib_slice(str, j,  ( j + 1 ) );
        var ch = chFudge.toLowerCase();
        var j =  ( j + 1 ) ;
        if ((ch == "")) {
            throw BadSyntax(this._thisDoc, startline, str, i, "unterminated string literal(3)");
        }
        var k = string_find("0123456789abcdef", ch);
        if ((k < 0)) {
            throw BadSyntax(this._thisDoc, startline, str, i, "bad string literal hex escape");
        }
        var value =  (  ( value * 16 )  + k ) ;
        var count =  ( count + 1 ) ;
    }
    var uch = String.fromCharCode(value);
    return new pyjslib_Tuple([j, uch]);
};
__SinkParser.prototype.UEscape = function(str, i, startline) {
    var j = i;
    var count = 0;
    var value = "\\U";
    while ((count < 8)) {
        var chFudge = pyjslib_slice(str, j,  ( j + 1 ) );
        var ch = chFudge.toLowerCase();
        var j =  ( j + 1 ) ;
        if ((ch == "")) {
            throw BadSyntax(this._thisDoc, startline, str, i, "unterminated string literal(3)");
        }
        var k = string_find("0123456789abcdef", ch);
        if ((k < 0)) {
            throw BadSyntax(this._thisDoc, startline, str, i, "bad string literal hex escape");
        }
        var value =  ( value + ch ) ;
        var count =  ( count + 1 ) ;
    }
    var uch = stringFromCharCode( (  ( "0x" + pyjslib_slice(value, 2, 10) )  - 0 ) );
    return new pyjslib_Tuple([j, uch]);
};
function OLD_BadSyntax(uri, lines, str, i, why) {
    return new __OLD_BadSyntax(uri, lines, str, i, why);
}
function __OLD_BadSyntax(uri, lines, str, i, why) {
    this._str = str.encode("utf-8");
    this._str = str;
    this._i = i;
    this._why = why;
    this.lines = lines;
    this._uri = uri;
}
__OLD_BadSyntax.prototype.toString = function() {
    var str = this._str;
    var i = this._i;
    var st = 0;
    if ((i > 60)) {
        var pre = "...";
        var st =  ( i - 60 ) ;
    }
    else {
        var pre = "";
    }
    if (( ( pyjslib_len(str) - i )  > 60)) {
        var post = "...";
    }
    else {
        var post = "";
    }
    return "Line %i of <%s>: Bad syntax (%s) at ^ in:\n\"%s%s^%s%s\"" % new pyjslib_Tuple([ ( this.lines + 1 ) , this._uri, this._why, pre, pyjslib_slice(str, st, i), pyjslib_slice(str, i,  ( i + 60 ) ), post]);
};
function BadSyntax(uri, lines, str, i, why) {
    return  (  (  (  (  (  (  (  ( "Line " +  ( lines + 1 )  )  + " of <" )  + uri )  + ">: Bad syntax: " )  + why )  + "\nat: \"" )  + pyjslib_slice(str, i,  ( i + 30 ) ) )  + "\"" ) ;
}


function stripCR(str) {
    var res = "";
    
    var __ch = new pyjslib_Iterator(str);
    try {
        while (true) {
            var ch = __ch.next();
            
            
            if ((ch != "\r")) {
                var res =  ( res + ch ) ;
            }
            
        }
    } catch (e) {
        if (e != StopIteration) {
            throw e;
        }
    }
    
    return res;
}


function dummyWrite(x) {
}

return SinkParser;

}();
//  Identity management and indexing for RDF
//
// This file provides  IndexedFormula a formula (set of triples) which
// indexed by predicate, subject and object.
//
// It "smushes"  (merges into a single node) things which are identical
// according to owl:sameAs or an owl:InverseFunctionalProperty
// or an owl:FunctionalProperty
//
//
//  2005-10 Written Tim Berners-Lee
//  2007    Changed so as not to munge statements from documents when smushing
//
//
/* jsl:option explicit */

$rdf.IndexedFormula = (function () {
  var owl_ns = 'http://www.w3.org/2002/07/owl#'
  // var link_ns = "http://www.w3.org/2007/ont/link#"

  /* hashString functions are used as array indeces. This is done to avoid
  ** conflict with existing properties of arrays such as length and map.
  ** See issue 139.
  */
  $rdf.Literal.prototype.hashString = $rdf.Literal.prototype.toNT
  $rdf.NamedNode.prototype.hashString = $rdf.NamedNode.prototype.toNT
  $rdf.BlankNode.prototype.hashString = $rdf.BlankNode.prototype.toNT
  $rdf.Collection.prototype.hashString = $rdf.Collection.prototype.toNT

  // Stores an associative array that maps URIs to functions
  $rdf.IndexedFormula = function (features) {
    this.statements = [] // As in Formula
    this.optional = []
    this.propertyActions = [] // Array of functions to call when getting statement with {s X o}
    // maps <uri> to [f(F,s,p,o),...]
    this.classActions = [] // Array of functions to call when adding { s type X }
    this.redirections = [] // redirect to lexically smaller equivalent symbol
    this.aliases = [] // reverse mapping to redirection: aliases for this
    this.HTTPRedirects = [] // redirections we got from HTTP
    this.subjectIndex = [] // Array of statements with this X as subject
    this.predicateIndex = [] // Array of statements with this X as subject
    this.objectIndex = [] // Array of statements with this X as object
    this.whyIndex = [] // Array of statements with X as provenance
    this.index = [
      this.subjectIndex,
      this.predicateIndex,
      this.objectIndex,
      this.whyIndex
    ]
    this.namespaces = {} // Dictionary of namespace prefixes
    if (features === undefined) {
      features = [
        'sameAs',
        'InverseFunctionalProperty',
        'FunctionalProperty'
      ]
    }
    //    this.features = features
    // Callbackify?
    function handleRDFType (formula, subj, pred, obj, why) {
      if (formula.typeCallback) {
        formula.typeCallback(formula, obj, why)
      }

      var x = formula.classActions[obj.hashString()]
      var done = false
      if (x) {
        for (var i = 0; i < x.length; i++) {
          done = done || x[i](formula, subj, pred, obj, why)
        }
      }
      return done // statement given is not needed if true
    } // handleRDFType

    // If the predicate is #type, use handleRDFType to create a typeCallback on the object
    this.propertyActions['<http://www.w3.org/1999/02/22-rdf-syntax-ns#type>'] = [ handleRDFType ]

    // Assumption: these terms are not redirected @@fixme
    if ($rdf.Util.ArrayIndexOf(features, 'sameAs') >= 0) {
      this.propertyActions['<http://www.w3.org/2002/07/owl#sameAs>'] = [
        function (formula, subj, pred, obj, why) {
          // $rdf.log.warn("Equating "+subj.uri+" sameAs "+obj.uri);  //@@
          formula.equate(subj, obj)
          return true // true if statement given is NOT needed in the store
        }
      ] // sameAs -> equate & don't add to index
    }
    if ($rdf.Util.ArrayIndexOf(features, 'InverseFunctionalProperty') >= 0) {
      this.classActions['<' + owl_ns + 'InverseFunctionalProperty>'] = [
        function (formula, subj, pred, obj, addFn) {
          // yes subj not pred!
          return formula.newPropertyAction(subj, handle_IFP)
        }
      ] // IFP -> handle_IFP, do add to index
    }
    if ($rdf.Util.ArrayIndexOf(features, 'FunctionalProperty') >= 0) {
      this.classActions['<' + owl_ns + 'FunctionalProperty>'] = [
        function (formula, subj, proj, obj, addFn) {
          return formula.newPropertyAction(subj, handle_FP)
        }
      ] // FP => handleFP, do add to index
    }
    function handle_IFP (formula, subj, pred, obj) {
      var s1 = formula.any(undefined, pred, obj)
      if (!s1) {
        return false // First time with this value
      }
      // $rdf.log.warn("Equating "+s1.uri+" and "+subj.uri + " because IFP "+pred.uri);  //@@
      formula.equate(s1, subj)
      return true
    } // handle_IFP

    function handle_FP (formula, subj, pred, obj) {
      var o1 = formula.any(subj, pred, undefined)
      if (!o1) {
        return false // First time with this value
      }
      // $rdf.log.warn("Equating "+o1.uri+" and "+obj.uri + " because FP "+pred.uri);  //@@
      formula.equate(o1, obj)
      return true
    } // handle_FP
  } /* end IndexedFormula */

  $rdf.IndexedFormula.prototype = new $rdf.Formula()
  $rdf.IndexedFormula.prototype.constructor = $rdf.IndexedFormula
  $rdf.IndexedFormula.SuperClass = $rdf.Formula

  $rdf.IndexedFormula.prototype.newPropertyAction = function newPropertyAction (pred, action) {
    // $rdf.log.debug("newPropertyAction:  "+pred)
    var hash = pred.hashString()
    if (!this.propertyActions[hash]) {
      this.propertyActions[hash] = []
    }
    this.propertyActions[hash].push(action)
    // Now apply the function to to statements already in the store
    var toBeFixed = this.statementsMatching(undefined, pred, undefined)
    var done = false
    for (var i = 0; i < toBeFixed.length; i++) { // NOT optimized - sort toBeFixed etc
      done = done || action(this, toBeFixed[i].subject, pred, toBeFixed[i].object)
    }
    return done
  }

  $rdf.IndexedFormula.prototype.setPrefixForURI = function (prefix, nsuri) {
    // TODO:This is a hack for our own issues, which ought to be fixed post-release
    // See http://dig.csail.mit.edu/cgi-bin/roundup.cgi/$rdf/issue227
    if (prefix === 'tab' && this.namespaces['tab']) {
      return
    } // There are files around with long badly generated prefixes like this
    if (prefix.slice(0, 2) === 'ns' || prefix.slice(0, 7) === 'default') {
      return
    }
    this.namespaces[prefix] = nsuri
  }

  // Deprocated ... name too generic
  $rdf.IndexedFormula.prototype.register = function (prefix, nsuri) {
    this.namespaces[prefix] = nsuri
  }

  /** simplify graph in store when we realize two identifiers are equivalent

  We replace the bigger with the smaller.

  */
  $rdf.IndexedFormula.prototype.equate = function (u1, u2) {
    // $rdf.log.warn("Equating "+u1+" and "+u2); // @@
    // @@JAMBO Must canonicalize the uris to prevent errors from a=b=c
    // 03-21-2010
    u1 = this.canon(u1)
    u2 = this.canon(u2)
    var d = u1.compareTerm(u2)
    if (!d) {
      return true // No information in {a = a}
    }
    // var big
    // var small
    if (d < 0) { // u1 less than u2
      return this.replaceWith(u2, u1)
    } else {
      return this.replaceWith(u1, u2)
    }
  }

  // Replace big with small, obsoleted with obsoleting.
  //
  $rdf.IndexedFormula.prototype.replaceWith = function (big, small) {
    // $rdf.log.debug("Replacing "+big+" with "+small) // @@
    var oldhash = big.hashString()
    var newhash = small.hashString()

    var moveIndex = function (ix) {
      var oldlist = ix[oldhash]
      if (!oldlist) {
        return // none to move
      }
      var newlist = ix[newhash]
      if (!newlist) {
        ix[newhash] = oldlist
      } else {
        ix[newhash] = oldlist.concat(newlist)
      }
      delete ix[oldhash]
    }

    // the canonical one carries all the indexes
    for (var i = 0; i < 4; i++) {
      moveIndex(this.index[i])
    }

    this.redirections[oldhash] = small
    if (big.uri) {
      // @@JAMBO: must update redirections,aliases from sub-items, too.
      if (!this.aliases[newhash]) {
        this.aliases[newhash] = []
      }
      this.aliases[newhash].push(big) // Back link

      if (this.aliases[oldhash]) {
        for (i = 0; i < this.aliases[oldhash].length; i++) {
          this.redirections[this.aliases[oldhash][i].hashString()] = small
          this.aliases[newhash].push(this.aliases[oldhash][i])
        }
      }

      this.add(small, this.sym('http://www.w3.org/2007/ont/link#uri'), big.uri)

      // If two things are equal, and one is requested, we should request the other.
      if (this.fetcher) {
        this.fetcher.nowKnownAs(big, small)
      }
    }

    moveIndex(this.classActions)
    moveIndex(this.propertyActions)

    // $rdf.log.debug("Equate done. "+big+" to be known as "+small)
    return true // true means the statement does not need to be put in
  }

  // Return the symbol with canonical URI as smushed
  $rdf.IndexedFormula.prototype.canon = function (term) {
    if (!term) {
      return term
    }
    var y = this.redirections[term.hashString()]
    if (!y) {
      return term
    }
    return y
  }

  // Compare by canonical URI as smushed
  $rdf.IndexedFormula.prototype.sameThings = function (x, y) {
    if (x.sameTerm(y)) {
      return true
    }
    var x1 = this.canon(x)
    //    alert('x1='+x1)
    if (!x1) return false
    var y1 = this.canon(y)
    //    alert('y1='+y1); //@@
    if (!y1) return false
    return (x1.uri === y1.uri)
  }

  // A list of all the URIs by which this thing is known
  $rdf.IndexedFormula.prototype.uris = function (term) {
    var cterm = this.canon(term)
    var terms = this.aliases[cterm.hashString()]
    if (!cterm.uri) return []
    var res = [ cterm.uri ]
    if (terms) {
      for (var i = 0; i < terms.length; i++) {
        res.push(terms[i].uri)
      }
    }
    return res
  }

  // Add a triple to the store
  //
  //  Returns the statement added
  // (would it be better to return the original formula for chaining?)
  //
  $rdf.IndexedFormula.prototype.add = function (subj, pred, obj, why) {
    var i
    if (arguments.length === 1) {
      if (subj instanceof Array) {
        for (i = 0; i < subj.length; i++) {
          this.add(subj[i])
        }
      } else if (subj instanceof $rdf.Statement) {
        this.add(subj.subject, subj.predicate, subj.object, subj.why)
      } else if (subj instanceof $rdf.IndexedFormula) {
        this.add(subj.statements)
      }
      return this
    }
    var actions
    var st
    if (!why) {
      // system generated
      why = this.fetcher ? this.fetcher.appNode : this.sym('chrome:theSession')
    }
    // defined in source.js, is this OK with identity.js only user?
    subj = $rdf.term(subj)
    pred = $rdf.term(pred)
    obj = $rdf.term(obj)
    why = $rdf.term(why)

    if (this.predicateCallback) {
      this.predicateCallback(this, pred, why)
    }

    // Action return true if the statement does not need to be added
    var predHash = this.canon(pred).hashString()
    actions = this.propertyActions[predHash] // Predicate hash
    var done = false
    if (actions) {
      // alert('type: '+typeof actions +' @@ actions='+actions)
      for (i = 0; i < actions.length; i++) {
        done = done || actions[i](this, subj, pred, obj, why)
      }
    }

    // If we are tracking provenanance, every thing should be loaded into the store
    // if (done) return new Statement(subj, pred, obj, why); // Don't put it in the store
    // still return this statement for owl:sameAs input
    var hash = [ this.canon(subj).hashString(), predHash,
      this.canon(obj).hashString(), this.canon(why).hashString()]
    st = new $rdf.Statement(subj, pred, obj, why)
    for (i = 0; i < 4; i++) {
      var ix = this.index[i]
      var h = hash[i]
      if (!ix[h]) {
        ix[h] = []
      }
      ix[h].push(st) // Set of things with this as subject, etc
    }

    // $rdf.log.debug("ADDING    {"+subj+" "+pred+" "+obj+"} "+why)
    this.statements.push(st)
    return st
  } // add

  // Find out whether a given URI is used as symbol in the formula
  $rdf.IndexedFormula.prototype.mentionsURI = function (uri) {
    var hash = '<' + uri + '>'
    return (!!this.subjectIndex[hash] ||
      !!this.objectIndex[hash] ||
      !!this.predicateIndex[hash])
  }

  // Find an unused id for a file being edited: return a symbol
  // (Note: Slow iff a lot of them -- could be O(log(k)) )
  $rdf.IndexedFormula.prototype.nextSymbol = function (doc) {
    for (var i = 0;;i++) {
      var uri = doc.uri + '#n' + i
      if (!this.mentionsURI(uri)) return this.sym(uri)
    }
  }

  $rdf.IndexedFormula.prototype.anyStatementMatching =
    function (subj, pred, obj, why) {
      var x = this.statementsMatching(subj, pred, obj, why, true)
      if (!x || x.length === 0) {
        return undefined
      }
      return x[0]
    }

  // Return statements matching a pattern
  // ALL CONVENIENCE LOOKUP FUNCTIONS RELY ON THIS!
  $rdf.IndexedFormula.prototype.statementsMatching = function (subj, pred, obj, why, justOne) {
    // $rdf.log.debug("Matching {"+subj+" "+pred+" "+obj+"}")

    var pat = [ subj, pred, obj, why ]
    var pattern = []
    var hash = []
    var wild = [] // wildcards
    var given = [] // Not wild
    var p
    var list
    for (p = 0; p < 4; p++) {
      pattern[p] = this.canon($rdf.term(pat[p]))
      if (!pattern[p]) {
        wild.push(p)
      } else {
        given.push(p)
        hash[p] = pattern[p].hashString()
      }
    }
    if (given.length === 0) {
      return this.statements
    }
    if (given.length === 1) { // Easy too, we have an index for that
      p = given[0]
      list = this.index[p][hash[p]]
      if (list && justOne) {
        if (list.length > 1) {
          list = list.slice(0, 1)
        }
      }
      list = list || []
      return list
    }

    // Now given.length is 2, 3 or 4.
    // We hope that the scale-free nature of the data will mean we tend to get
    // a short index in there somewhere!

    var best = 1e10 // really bad
    var best_i
    var i
    for (i = 0; i < given.length; i++) {
      p = given[i] // Which part we are dealing with
      list = this.index[p][hash[p]]
      if (!list) {
        return [] // No occurrences
      }
      if (list.length < best) {
        best = list.length
        best_i = i // (not p!)
      }
    }

    // Ok, we have picked the shortest index but now we have to filter it
    var best_p = given[best_i]
    var possibles = this.index[best_p][hash[best_p]]
    var check = given.slice(0, best_i).concat(given.slice(best_i + 1)) // remove best_i
    var results = []
    var parts = [ 'subject', 'predicate', 'object', 'why' ]
    for (var j = 0; j < possibles.length; j++) {
      var st = possibles[j]

      for (i = 0; i < check.length; i++) { // for each position to be checked
        p = check[i]
        if (!this.canon(st[parts[p]]).sameTerm(pattern[p])) {
          st = null
          break
        }
      }
      if (st != null) {
        results.push(st)
        if (justOne) break
      }
    }

    return results
  } // statementsMatching

  /** Remove all statemnts in a doc
  **
  **/
  $rdf.IndexedFormula.prototype.removeDocument = function (doc) {
    var sts = this.statementsMatching(undefined, undefined, undefined, doc).slice() // Take a copy as this is the actual index
    for (var i = 0; i < sts.length; i++) {
      this.removeStatement(sts[i])
    }
    return this
  }

  /** Find a statement object and remove it
  **
  ** Or array of statements or graph
  **/
  $rdf.IndexedFormula.prototype.remove = function (st) {
    if (st instanceof Array) {
      for (var i = 0; i < st.length; i++) {
        this.remove(st[i])
      }
      return this
    }
    if (st instanceof $rdf.IndexedFormula) {
      return this.remove(st.statements)
    }
    var sts = this.statementsMatching(st.subject, st.predicate, st.object, st.why)
    if (!sts.length) {
      throw new Error('Statement to be removed is not on store: ' + st)
    }
    this.removeStatement(sts[0])
    return this
  }

  $rdf.IndexedFormula.prototype.removeMatches = function (subject, predicate, object, why) {
    this.removeStatements(this.staementsMatching(subject, predicate, object, why))
    return this
  }

  $rdf.IndexedFormula.prototype.removeStatements = function (sts) {
    for (var i = 0; i < sts.length; i++) {
      this.remove(sts[i])
    }
    return this
  }

  /**
   * Remove a particular statement object from the store
   *
   * st    a statement which is already in the store and indexed.
   *      Make sure you only use this for these.
   *    Otherwise, you should use remove() above.
   */
  $rdf.IndexedFormula.prototype.removeStatement = function (st) {
    // $rdf.log.debug("entering remove w/ st=" + st)
    var term = [ st.subject, st.predicate, st.object, st.why ]
    for (var p = 0; p < 4; p++) {
      var c = this.canon(term[p])
      var h = c.hashString()
      if (!this.index[p][h]) {
        // $rdf.log.warn ("Statement removal: no index '+p+': "+st)
      } else {
        $rdf.Util.RDFArrayRemove(this.index[p][h], st)
      }
    }
    $rdf.Util.RDFArrayRemove(this.statements, st)
    return this
  } // remove

  // ////////////////// Self-consistency checking for diagnostis only
  // Is each statement properly indexed?
  $rdf.IndexedFormula.prototype.checkStatementList = function (sts, from) {
    var names = ['subject', 'predicate', 'object', 'why']
    var origin = ' found in ' + names[from] + ' index.'
    var st
    for (var j = 0; j < sts.length; j++) {
      st = sts[j]
      var term = [ st.subject, st.predicate, st.object, st.why ]

      var arrayContains = function (a, x) {
        for (var i = 0; i < a.length; i++) {
          if (a[i].subject.sameTerm(x.subject) &&
            a[i].predicate.sameTerm(x.predicate) &&
            a[i].object.sameTerm(x.object) &&
            a[i].why.sameTerm(x.why)) {
            return true
          }
        }
      }

      for (var p = 0; p < 4; p++) {
        var c = this.canon(term[p])
        var h = c.hashString()
        if (!this.index[p][h]) {
          throw new Error('No ' + name[p] + ' index for statement ' + st + '@' + st.why + origin)
        } else {
          if (!arrayContains(this.index[p][h], st)) {
            throw new Error('Index for ' + name[p] + ' does not have statement ' + st + '@' + st.why + origin)
          }
        }
      }
      if (!arrayContains(this.statements, st)) {
        throw new Error('Statement list does not statement ' + st + '@' + st.why + origin)
      }
    }
  }

  $rdf.IndexedFormula.prototype.check = function () {
    this.checkStatementList(this.statements)
    for (var p = 0; p < 4; p++) {
      var ix = this.index[p]
      for (var key in ix) {
        if (ix.hasOwnProperty(key)) {
          this.checkStatementList(ix[key], p)
        }
      }
    }
  }

  /** remove all statements matching args (within limit) **/
  $rdf.IndexedFormula.prototype.removeMany = function (subj, pred, obj, why, limit) {
    // $rdf.log.debug("entering removeMany w/ subj,pred,obj,why,limit = " + subj +", "+ pred+", " + obj+", " + why+", " + limit)
    var sts = this.statementsMatching(subj, pred, obj, why, false)
    // This is a subtle bug that occcured in updateCenter.js too.
    // The fact is, this.statementsMatching returns this.whyIndex instead of a copy of it
    // but for perfromance consideration, it's better to just do that
    // so make a copy here.
    var statements = []
    for (var i = 0; i < sts.length; i++) statements.push(sts[i])
    if (limit) statements = statements.slice(0, limit)
    for (i = 0; i < statements.length; i++) this.remove(statements[i])
  } // removeMany

  /** Utility**/

  /*  @method: copyTo
      @description: replace @template with @target and add appropriate triples (no triple removed)
                    one-direction replication
  */
  $rdf.IndexedFormula.prototype.copyTo = function (template, target, flags) {
    if (!flags) flags = []
    var statList = this.statementsMatching(template)
    if ($rdf.Util.ArrayIndexOf(flags, 'two-direction') !== -1) {
      statList.concat(this.statementsMatching(undefined, undefined, template))
    }
    for (var i = 0;i < statList.length;i++) {
      var st = statList[i]
      switch (st.object.termType) {
        case 'symbol':
          this.add(target, st.predicate, st.object)
          break
        case 'literal':
        case 'bnode':
        case 'collection':
          this.add(target, st.predicate, st.object.copy(this))
      }
      if ($rdf.Util.ArrayIndexOf(flags, 'delete') !== -1) {
        this.remove(st)
      }
    }
  }
  // for the case when you alter this.value (text modified in userinput.js)
  $rdf.Literal.prototype.copy = function () {
    return new $rdf.Literal(this.value, this.lang, this.datatype)
  }
  $rdf.BlankNode.prototype.copy = function (formula) { // depends on the formula
    var bnodeNew = new $rdf.BlankNode()
    formula.copyTo(this, bnodeNew)
    return bnodeNew
  }
  /**  Full N3 bits  -- placeholders only to allow parsing, no functionality! **/

  $rdf.IndexedFormula.prototype.newUniversal = function (uri) {
    var x = this.sym(uri)
    if (!this._universalVariables) this._universalVariables = []
    this._universalVariables.push(x)
    return x
  }

  $rdf.IndexedFormula.prototype.newExistential = function (uri) {
    if (!uri) return this.bnode()
    var x = this.sym(uri)
    return this.declareExistential(x)
  }

  $rdf.IndexedFormula.prototype.declareExistential = function (x) {
    if (!this._existentialVariables) this._existentialVariables = []
    this._existentialVariables.push(x)
    return x
  }

  $rdf.IndexedFormula.prototype.formula = function (features) {
    return new $rdf.IndexedFormula(features)
  }

  $rdf.IndexedFormula.prototype.close = function () {
    return this
  }

  $rdf.IndexedFormula.prototype.hashString = $rdf.IndexedFormula.prototype.toNT

  return $rdf.IndexedFormula
})()
// ends
//  RDFa Parser for rdflib.js

// Originally by: Alex Milowski
// From https://github.com/alexmilowski/green-turtle
// Converted: timbl 2015-08-25 not yet working
// Added wrapper: csarven 2016-05-09 working

// $rdf.RDFaProcessor.prototype = new Object() // Was URIResolver

// $rdf.RDFaProcessor.prototype.constructor=$rdf.RDFaProcessor

// options.base = base URI    not really an option, shopuld always be set.
//

if (typeof Node === 'undefined') { //  @@@@@@ Global. Interface to xmldom.
  var Node = {
    ELEMENT_NODE: 1,
    ATTRIBUTE_NODE: 2,
    TEXT_NODE: 3,
    CDATA_SECTION_NODE: 4,
    ENTITY_REFERENCE_NODE: 5,
    ENTITY_NODE: 6,
    PROCESSING_INSTRUCTION_NODE: 7,
    COMMENT_NODE: 8,
    DOCUMENT_NODE: 9,
    DOCUMENT_TYPE_NODE: 10,
    DOCUMENT_FRAGMENT_NODE: 11,
    NOTATION_NODE: 12
  }
}

// //////////////////////////////

$rdf.RDFaProcessor = function RDFaProcessor (kb, options) {
  this.options = options || {}
  this.kb = kb
  this.target = options.target || {
      graph: {
        subjects: {},
        prefixes: {},
        terms: {}
      }
  }

  //XXX: Added to track bnodes
  this.blankNodes = []
  //XXX: Added for normalisation
  this.htmlOptions = {
    'selfClosing': "br img input area base basefont col colgroup source wbr isindex link meta param hr"
  }
  this.theOne = '_:' + (new Date()).getTime()
  this.language = null
  this.vocabulary = null
  this.blankCounter = 0
  this.langAttributes = [ { namespaceURI: 'http://www.w3.org/XML/1998/namespace', localName: 'lang' } ]
  this.inXHTMLMode = false
  this.absURIRE = /[\w\_\-]+:\S+/
  this.finishedHandlers = []
  this.init()
}

$rdf.RDFaProcessor.prototype.newBlankNode = function () {
  this.blankCounter++
  return '_:' + this.blankCounter
}

$rdf.RDFaProcessor.XMLLiteralURI = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#XMLLiteral'
$rdf.RDFaProcessor.HTMLLiteralURI = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#HTML'
$rdf.RDFaProcessor.PlainLiteralURI = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#PlainLiteral'
$rdf.RDFaProcessor.objectURI = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#object'
$rdf.RDFaProcessor.typeURI = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'

$rdf.RDFaProcessor.nameChar = '[-A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u10000-\uEFFFF\.0-9\u00B7\u0300-\u036F\u203F-\u2040]'
$rdf.RDFaProcessor.nameStartChar = '[\u0041-\u005A\u0061-\u007A\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF\u0100-\u0131\u0134-\u013E\u0141-\u0148\u014A-\u017E\u0180-\u01C3\u01CD-\u01F0\u01F4-\u01F5\u01FA-\u0217\u0250-\u02A8\u02BB-\u02C1\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03CE\u03D0-\u03D6\u03DA\u03DC\u03DE\u03E0\u03E2-\u03F3\u0401-\u040C\u040E-\u044F\u0451-\u045C\u045E-\u0481\u0490-\u04C4\u04C7-\u04C8\u04CB-\u04CC\u04D0-\u04EB\u04EE-\u04F5\u04F8-\u04F9\u0531-\u0556\u0559\u0561-\u0586\u05D0-\u05EA\u05F0-\u05F2\u0621-\u063A\u0641-\u064A\u0671-\u06B7\u06BA-\u06BE\u06C0-\u06CE\u06D0-\u06D3\u06D5\u06E5-\u06E6\u0905-\u0939\u093D\u0958-\u0961\u0985-\u098C\u098F-\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09DC-\u09DD\u09DF-\u09E1\u09F0-\u09F1\u0A05-\u0A0A\u0A0F-\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32-\u0A33\u0A35-\u0A36\u0A38-\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8B\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2-\u0AB3\u0AB5-\u0AB9\u0ABD\u0AE0\u0B05-\u0B0C\u0B0F-\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32-\u0B33\u0B36-\u0B39\u0B3D\u0B5C-\u0B5D\u0B5F-\u0B61\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99-\u0B9A\u0B9C\u0B9E-\u0B9F\u0BA3-\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB5\u0BB7-\u0BB9\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C60-\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CDE\u0CE0-\u0CE1\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D28\u0D2A-\u0D39\u0D60-\u0D61\u0E01-\u0E2E\u0E30\u0E32-\u0E33\u0E40-\u0E45\u0E81-\u0E82\u0E84\u0E87-\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA-\u0EAB\u0EAD-\u0EAE\u0EB0\u0EB2-\u0EB3\u0EBD\u0EC0-\u0EC4\u0F40-\u0F47\u0F49-\u0F69\u10A0-\u10C5\u10D0-\u10F6\u1100\u1102-\u1103\u1105-\u1107\u1109\u110B-\u110C\u110E-\u1112\u113C\u113E\u1140\u114C\u114E\u1150\u1154-\u1155\u1159\u115F-\u1161\u1163\u1165\u1167\u1169\u116D-\u116E\u1172-\u1173\u1175\u119E\u11A8\u11AB\u11AE-\u11AF\u11B7-\u11B8\u11BA\u11BC-\u11C2\u11EB\u11F0\u11F9\u1E00-\u1E9B\u1EA0-\u1EF9\u1F00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2126\u212A-\u212B\u212E\u2180-\u2182\u3041-\u3094\u30A1-\u30FA\u3105-\u312C\uAC00-\uD7A3\u4E00-\u9FA5\u3007\u3021-\u3029_]'
$rdf.RDFaProcessor.NCNAME = new RegExp('^' + $rdf.RDFaProcessor.nameStartChar + $rdf.RDFaProcessor.nameChar + '*$')

$rdf.RDFaProcessor.trim = function (str) {
  return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '')
}

$rdf.RDFaProcessor.prototype.tokenize = function (str) {
  return $rdf.RDFaProcessor.trim(str).split(/\s+/)
}

$rdf.RDFaProcessor.prototype.parseSafeCURIEOrCURIEOrURI = function (value, prefixes, base) {
  value = $rdf.RDFaProcessor.trim(value)
  if (value.charAt(0) == '[' && value.charAt(value.length - 1) == ']') {
    value = value.substring(1, value.length - 1)
    value = value.trim(value)
    if (value.length == 0) {
      return null
    }
    if (value == '_:') {
      // the one node
      return this.theOne
    }
    return this.parseCURIE(value, prefixes, base)
  } else {
    return this.parseCURIEOrURI(value, prefixes, base)
  }
}

$rdf.RDFaProcessor.prototype.parseCURIE = function (value, prefixes, base) {
  var colon = value.indexOf(':')
  if (colon >= 0) {
    var prefix = value.substring(0, colon)
    if (prefix == '') {
      // default prefix
      var uri = prefixes['']
      return uri ? uri + value.substring(colon + 1) : null
    } else if (prefix == '_') {
      // blank node
      return '_:' + value.substring(colon + 1)
    } else if ($rdf.RDFaProcessor.NCNAME.test(prefix)) {
      var uri = prefixes[prefix]
      if (uri) {
        return uri + value.substring(colon + 1)
      }
    }
  }
  return null
}

$rdf.RDFaProcessor.prototype.parseCURIEOrURI = function (value, prefixes, base) {
  var curie = this.parseCURIE(value, prefixes, base)
  if (curie) {
    return curie
  }
  return this.resolveAndNormalize(base, value)
}

$rdf.RDFaProcessor.prototype.parsePredicate = function (value, defaultVocabulary, terms, prefixes, base, ignoreTerms) {
  if (value == '') {
    return null
  }
  var predicate = this.parseTermOrCURIEOrAbsURI(value, defaultVocabulary, ignoreTerms ? null : terms, prefixes, base)
  if (predicate && predicate.indexOf('_:') == 0) {
    return null
  }
  return predicate
}

$rdf.RDFaProcessor.prototype.parseTermOrCURIEOrURI = function (value, defaultVocabulary, terms, prefixes, base) {
  // alert("Parsing "+value+" with default vocab "+defaultVocabulary)
  value = $rdf.RDFaProcessor.trim(value)
  var curie = this.parseCURIE(value, prefixes, base)
  if (curie) {
    return curie
  } else {
    var term = terms[value]
    if (term) {
      return term
    }
    var lcvalue = value.toLowerCase()
    term = terms[lcvalue]
    if (term) {
      return term
    }
    if (defaultVocabulary && !this.absURIRE.exec(value)) {
      return defaultVocabulary + value
    }
  }
  return this.resolveAndNormalize(base, value)
}

$rdf.RDFaProcessor.prototype.parseTermOrCURIEOrAbsURI = function (value, defaultVocabulary, terms, prefixes, base) {
  // alert("Parsing "+value+" with default vocab "+defaultVocabulary)
  value = $rdf.RDFaProcessor.trim(value)
  var curie = this.parseCURIE(value, prefixes, base)
  if (curie) {
    return curie
  } else if (terms) {
    if (defaultVocabulary && !this.absURIRE.exec(value)) {
      return defaultVocabulary + value
    }
    var term = terms[value]
    if (term) {
      return term
    }
    var lcvalue = value.toLowerCase()
    term = terms[lcvalue]
    if (term) {
      return term
    }
  }
  if (this.absURIRE.exec(value)) {
    return this.resolveAndNormalize(base, value)
  }
  return null
}

/*
$rdf.RDFaProcessor.prototype.resolveAndNormalize = function(base,href) {
   var u = base.resolve(href)
   var parsed = this.parseURI(u)
   parsed.normalize()
   return parsed.spec
}
*/

$rdf.RDFaProcessor.prototype.parsePrefixMappings = function (str, target) {
  var values = this.tokenize(str)
  var prefix = null
  var uri = null
  for (var i = 0; i < values.length; i++) {
    if (values[i][values[i].length - 1] == ':') {
      prefix = values[i].substring(0, values[i].length - 1)
    } else if (prefix) {
      target[prefix] = this.options.base ? $rdf.uri.join(values[i], this.options.base) : values[i]
      prefix = null
    }
  }
}

$rdf.RDFaProcessor.prototype.copyMappings = function (mappings) {
  var newMappings = {}
  for (var k in mappings) {
    newMappings[k] = mappings[k]
  }
  return newMappings
}

$rdf.RDFaProcessor.prototype.ancestorPath = function (node) {
  var path = ''
  while (node && node.nodeType != Node.DOCUMENT_NODE) {
    path = '/' + node.localName + path
    node = node.parentNode
  }
  return path
}

$rdf.RDFaProcessor.prototype.setContext = function (node) {
  // We only recognized XHTML+RDFa 1.1 if the version is set propertyly
  if (node.localName == 'html' && node.getAttribute('version') == 'XHTML+RDFa 1.1') {
    this.setXHTMLContext()
  } else if (node.localName == 'html' || node.namespaceURI == 'http://www.w3.org/1999/xhtml') {
    if (typeof document !== 'undefined' && document.doctype) {
      if (document.doctype.publicId == '-//W3C//DTD XHTML+RDFa 1.0//EN' && document.doctype.systemId == 'http://www.w3.org/MarkUp/DTD/xhtml-rdfa-1.dtd') {
        console.log('WARNING: RDF 1.0 is not supported.  Defaulting to HTML5 mode.')
        this.setHTMLContext()
      } else if (document.doctype.publicId == '-//W3C//DTD XHTML+RDFa 1.1//EN' && document.doctype.systemId == 'http://www.w3.org/MarkUp/DTD/xhtml-rdfa-2.dtd') {
        this.setXHTMLContext()
      } else {
        this.setHTMLContext()
      }
    } else {
      this.setHTMLContext()
    }
  } else {
    this.setXMLContext()
  }
}

$rdf.RDFaProcessor.prototype.setInitialContext = function () {
  this.vocabulary = null
  // By default, the prefixes are terms are loaded to the RDFa 1.1. standard within the graph constructor
  this.langAttributes = [ { namespaceURI: 'http://www.w3.org/XML/1998/namespace', localName: 'lang' } ]
}

$rdf.RDFaProcessor.prototype.setXMLContext = function () {
  this.setInitialContext()
  this.inXHTMLMode = false
  this.inHTMLMode = false
}

$rdf.RDFaProcessor.prototype.setHTMLContext = function () {
  this.setInitialContext()
  this.langAttributes = [ { namespaceURI: 'http://www.w3.org/XML/1998/namespace', localName: 'lang' },
    { namespaceURI: null, localName: 'lang' }]
  this.inXHTMLMode = false
  this.inHTMLMode = true
}

$rdf.RDFaProcessor.prototype.setXHTMLContext = function () {
  this.setInitialContext()

  this.inXHTMLMode = true
  this.inHTMLMode = false

  this.langAttributes = [ { namespaceURI: 'http://www.w3.org/XML/1998/namespace', localName: 'lang' },
    { namespaceURI: null, localName: 'lang' }]

  // From http://www.w3.org/2011/rdfa-context/xhtml-rdfa-1.1
  this.target.graph.terms['alternate'] = 'http://www.w3.org/1999/xhtml/vocab#alternate'
  this.target.graph.terms['appendix'] = 'http://www.w3.org/1999/xhtml/vocab#appendix'
  this.target.graph.terms['bookmark'] = 'http://www.w3.org/1999/xhtml/vocab#bookmark'
  this.target.graph.terms['cite'] = 'http://www.w3.org/1999/xhtml/vocab#cite'
  this.target.graph.terms['chapter'] = 'http://www.w3.org/1999/xhtml/vocab#chapter'
  this.target.graph.terms['contents'] = 'http://www.w3.org/1999/xhtml/vocab#contents'
  this.target.graph.terms['copyright'] = 'http://www.w3.org/1999/xhtml/vocab#copyright'
  this.target.graph.terms['first'] = 'http://www.w3.org/1999/xhtml/vocab#first'
  this.target.graph.terms['glossary'] = 'http://www.w3.org/1999/xhtml/vocab#glossary'
  this.target.graph.terms['help'] = 'http://www.w3.org/1999/xhtml/vocab#help'
  this.target.graph.terms['icon'] = 'http://www.w3.org/1999/xhtml/vocab#icon'
  this.target.graph.terms['index'] = 'http://www.w3.org/1999/xhtml/vocab#index'
  this.target.graph.terms['last'] = 'http://www.w3.org/1999/xhtml/vocab#last'
  this.target.graph.terms['license'] = 'http://www.w3.org/1999/xhtml/vocab#license'
  this.target.graph.terms['meta'] = 'http://www.w3.org/1999/xhtml/vocab#meta'
  this.target.graph.terms['next'] = 'http://www.w3.org/1999/xhtml/vocab#next'
  this.target.graph.terms['prev'] = 'http://www.w3.org/1999/xhtml/vocab#prev'
  this.target.graph.terms['previous'] = 'http://www.w3.org/1999/xhtml/vocab#previous'
  this.target.graph.terms['section'] = 'http://www.w3.org/1999/xhtml/vocab#section'
  this.target.graph.terms['stylesheet'] = 'http://www.w3.org/1999/xhtml/vocab#stylesheet'
  this.target.graph.terms['subsection'] = 'http://www.w3.org/1999/xhtml/vocab#subsection'
  this.target.graph.terms['start'] = 'http://www.w3.org/1999/xhtml/vocab#start'
  this.target.graph.terms['top'] = 'http://www.w3.org/1999/xhtml/vocab#top'
  this.target.graph.terms['up'] = 'http://www.w3.org/1999/xhtml/vocab#up'
  this.target.graph.terms['p3pv1'] = 'http://www.w3.org/1999/xhtml/vocab#p3pv1'

  // other
  this.target.graph.terms['related'] = 'http://www.w3.org/1999/xhtml/vocab#related'
  this.target.graph.terms['role'] = 'http://www.w3.org/1999/xhtml/vocab#role'
  this.target.graph.terms['transformation'] = 'http://www.w3.org/1999/xhtml/vocab#transformation'
}

$rdf.RDFaProcessor.prototype.init = function () {
}

$rdf.RDFaProcessor.prototype.newSubjectOrigin = function (origin, subject) {
}

$rdf.RDFaProcessor.prototype.addTriple = function (origin, subject, predicate, object) {
  var su, ob, pr, or
  if (typeof subject === 'undefined') {
    su = $rdf.sym(this.options.base)
  } else {
    su = this.toRDFNodeObject(subject)
  }
  pr = this.toRDFNodeObject(predicate)
  ob = this.toRDFNodeObject(object)
  or = $rdf.sym(this.options.base)
  //console.log('Adding { ' + su + ' ' + pr + ' ' + ob + ' ' + or + ' }')
  this.kb.add(su, pr, ob, or)
}

$rdf.RDFaProcessor.prototype.toRDFNodeObject = function(x) {
  if (typeof x === 'undefined') return undefined
  if (typeof x === 'string') {
    if (x.substring(0,2) == "_:") {
      if (typeof this.blankNodes[x.substring(2)] === 'undefined') {
        this.blankNodes[x.substring(2)] = new $rdf.BlankNode(x.substring(2))
      }
      return this.blankNodes[x.substring(2)]
    }
    return $rdf.sym(x)
  }
  switch(x.type) {
    case $rdf.RDFaProcessor.objectURI:
      if (x.value.substring(0,2) == "_:") {
        if (typeof this.blankNodes[x.value.substring(2)] === 'undefined') {
          this.blankNodes[x.value.substring(2)] = new $rdf.BlankNode(x.value.substring(2))
        }
        return this.blankNodes[x.value.substring(2)]
      }
      return $rdf.sym(x.value)
    case $rdf.RDFaProcessor.PlainLiteralURI:
      return new $rdf.Literal(x.value, x.language || '')
    case $rdf.RDFaProcessor.XMLLiteralURI:
    case $rdf.RDFaProcessor.HTMLLiteralURI:
      var string = ''
      Object.keys(x.value).forEach(function(i) {
        string += $rdf.Util.domToString(x.value[i], this.htmlOptions)
      });
      return new $rdf.Literal(string, '', new $rdf.NamedNode(x.type))
    default:
      return new $rdf.Literal(x.value, '', new $rdf.NamedNode(x.type))
  }
}

$rdf.RDFaProcessor.prototype.resolveAndNormalize = function (base, uri) {
  // console.log("Joining " + uri + " to " + base + " making " +  $rdf.uri.join(uri, base))
  return $rdf.uri.join(uri, base); // @@ normalize?
}

$rdf.RDFaProcessor.prototype.parseURI = function (uri) {
  return uri; // We just use strings as URIs, not objects now.
}

$rdf.RDFaProcessor.dateTimeTypes = [
  { pattern: /-?P(?:[0-9]+Y)?(?:[0-9]+M)?(?:[0-9]+D)?(?:T(?:[0-9]+H)?(?:[0-9]+M)?(?:[0-9]+(?:\.[0-9]+)?S)?)?/,
  type: 'http://www.w3.org/2001/XMLSchema#duration' },
  { pattern: /-?(?:[1-9][0-9][0-9][0-9]|0[1-9][0-9][0-9]|00[1-9][0-9]|000[1-9])-[0-9][0-9]-[0-9][0-9]T(?:[0-1][0-9]|2[0-4]):[0-5][0-9]:[0-5][0-9](?:\.[0-9]+)?(?:Z|[+\-][0-9][0-9]:[0-9][0-9])?/,
  type: 'http://www.w3.org/2001/XMLSchema#dateTime' },
  { pattern: /-?(?:[1-9][0-9][0-9][0-9]|0[1-9][0-9][0-9]|00[1-9][0-9]|000[1-9])-[0-9][0-9]-[0-9][0-9](?:Z|[+\-][0-9][0-9]:[0-9][0-9])?/,
  type: 'http://www.w3.org/2001/XMLSchema#date' },
  { pattern: /(?:[0-1][0-9]|2[0-4]):[0-5][0-9]:[0-5][0-9](?:\.[0-9]+)?(?:Z|[+\-][0-9][0-9]:[0-9][0-9])?/,
  type: 'http://www.w3.org/2001/XMLSchema#time' },
  { pattern: /-?(?:[1-9][0-9][0-9][0-9]|0[1-9][0-9][0-9]|00[1-9][0-9]|000[1-9])-[0-9][0-9]/,
  type: 'http://www.w3.org/2001/XMLSchema#gYearMonth' },
  { pattern: /-?[1-9][0-9][0-9][0-9]|0[1-9][0-9][0-9]|00[1-9][0-9]|000[1-9]/,
  type: 'http://www.w3.org/2001/XMLSchema#gYear' }
]

$rdf.RDFaProcessor.deriveDateTimeType = function (value) {
  for (var i = 0; i < $rdf.RDFaProcessor.dateTimeTypes.length; i++) {
    // console.log("Checking "+value+" against "+$rdf.RDFaProcessor.dateTimeTypes[i].type)
    var matched = $rdf.RDFaProcessor.dateTimeTypes[i].pattern.exec(value)
    if (matched && matched[0].length == value.length) {
      // console.log("Matched!")
      return $rdf.RDFaProcessor.dateTimeTypes[i].type
    }
  }
  return null
}

$rdf.RDFaProcessor.prototype.process = function (node, options) {
  /*
  if (!window.console) {
     window.console = { log: function() {} }
  }*/
  var base
  if (node.nodeType == Node.DOCUMENT_NODE) {
    base = node.baseURI
    node = node.documentElement
    node.baseURI = base
    this.setContext(node)
  } else if (node.parentNode.nodeType == Node.DOCUMENT_NODE) {
    this.setContext(node)
  }
  var queue = []

  // Fix for Firefox that includes the hash in the base URI
  var removeHash = function(baseURI) {
    // Fix for undefined baseURI property
    if (!baseURI && options && options.baseURI) {
      return options.baseURI;
    }

    var hash = baseURI.indexOf("#");
    if (hash>=0) {
      baseURI = baseURI.substring(0,hash);
    }
    if (options && options.baseURIMap) {
      baseURI = options.baseURIMap(baseURI);
    }
    return baseURI;
  }

  queue.push({ current: node, context: this.push(null, removeHash(node.baseURI))})
  while (queue.length > 0) {
    var item = queue.shift()
    if (item.parent) {
      // Sequence Step 14: list triple generation
      if (item.context.parent && item.context.parent.listMapping == item.listMapping) {
        // Skip a child context with exactly the same mapping
        continue
      }
      // console.log("Generating lists for "+item.subject+", tag "+item.parent.localName)
      for (var predicate in item.listMapping) {
        var list = item.listMapping[predicate]
        if (list.length == 0) {
          this.addTriple(item.parent, item.subject, predicate, { type: $rdf.RDFaProcessor.objectURI, value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#nil' })
          continue
        }
        var bnodes = []
        for (var i = 0; i < list.length; i++) {
          bnodes.push(this.newBlankNode())
        // this.newSubject(item.parent,bnodes[i])
        }
        for (var i = 0; i < bnodes.length; i++) {
          this.addTriple(item.parent, bnodes[i], 'http://www.w3.org/1999/02/22-rdf-syntax-ns#first', list[i])
          this.addTriple(item.parent, bnodes[i], 'http://www.w3.org/1999/02/22-rdf-syntax-ns#rest', { type: $rdf.RDFaProcessor.objectURI,  value: (i + 1) < bnodes.length ? bnodes[i + 1] : 'http://www.w3.org/1999/02/22-rdf-syntax-ns#nil' })
        }
        this.addTriple(item.parent, item.subject, predicate, { type: $rdf.RDFaProcessor.objectURI, value: bnodes[0]})
      }
      continue
    }
    var current = item.current
    var context = item.context

    // console.log("Tag: "+current.localName+", listMapping="+JSON.stringify(context.listMapping))

    // Sequence Step 1
    var skip = false
    var newSubject = null
    var currentObjectResource = null
    var typedResource = null
    var prefixes = context.prefixes
    var prefixesCopied = false
    var incomplete = []
    var listMapping = context.listMapping
    var listMappingDifferent = context.parent ? false : true
    var language = context.language
    var vocabulary = context.vocabulary

    // TODO: the "base" element may be used for HTML+RDFa 1.1
    var base = this.parseURI(removeHash(current.baseURI))
    current.item = null

    // Sequence Step 2: set the default vocabulary
    var vocabAtt = current.getAttributeNode('vocab')
    if (vocabAtt) {
      var value = $rdf.RDFaProcessor.trim(vocabAtt.value)
      if (value.length > 0) {
        vocabulary = value
        var baseSubject = base.spec
        // this.newSubject(current,baseSubject)
        this.addTriple(current, baseSubject, 'http://www.w3.org/ns/rdfa#usesVocabulary', { type: $rdf.RDFaProcessor.objectURI,  value: vocabulary})
      } else {
        vocabulary = this.vocabulary
      }
    }

    // Sequence Step 3: IRI mappings
    // handle xmlns attributes
    for (var i = 0; i < current.attributes.length; i++) {
      var att = current.attributes[i]
      // if (att.namespaceURI=="http://www.w3.org/2000/xmlns/") {
      if (att.nodeName.charAt(0) == 'x' && att.nodeName.indexOf('xmlns:') == 0) {
        if (!prefixesCopied) {
          prefixes = this.copyMappings(prefixes)
          prefixesCopied = true
        }
        var prefix = att.nodeName.substring(6)
        // TODO: resolve relative?
        var ref = $rdf.RDFaProcessor.trim(att.value)
        prefixes[prefix] = this.options.base ? $rdf.uri.join(ref, this.options.base) : ref
      }
    }
    // Handle prefix mappings (@prefix)
    var prefixAtt = current.getAttributeNode('prefix')
    if (prefixAtt) {
      if (!prefixesCopied) {
        prefixes = this.copyMappings(prefixes)
        prefixesCopied = true
      }
      this.parsePrefixMappings(prefixAtt.value, prefixes)
    }

    // Sequence Step 4: language
    var xmlLangAtt = null
    for (var i = 0; !xmlLangAtt && i < this.langAttributes.length; i++) {
      xmlLangAtt = current.getAttributeNodeNS(this.langAttributes[i].namespaceURI, this.langAttributes[i].localName)
    }
    if (xmlLangAtt) {
      var value = $rdf.RDFaProcessor.trim(xmlLangAtt.value)
      if (value.length > 0) {
        language = value
      } else {
        language = null
      }
    }

    var relAtt = current.getAttributeNode('rel')
    var revAtt = current.getAttributeNode('rev')
    var typeofAtt = current.getAttributeNode('typeof')
    var propertyAtt = current.getAttributeNode('property')
    var datatypeAtt = current.getAttributeNode('datatype')
    var datetimeAtt = this.inHTMLMode ? current.getAttributeNode('datetime') : null
    var contentAtt = current.getAttributeNode('content')
    var aboutAtt = current.getAttributeNode('about')
    var srcAtt = current.getAttributeNode('src')
    var resourceAtt = current.getAttributeNode('resource')
    var hrefAtt = current.getAttributeNode('href')
    var inlistAtt = current.getAttributeNode('inlist')

    var relAttPredicates = []
    if (relAtt) {
      var values = this.tokenize(relAtt.value)
      for (var i = 0; i < values.length; i++) {
        var predicate = this.parsePredicate(values[i], vocabulary, context.terms, prefixes, base, this.inHTMLMode && propertyAtt != null)
        if (predicate) {
          relAttPredicates.push(predicate)
        }
      }
    }
    var revAttPredicates = []
    if (revAtt) {
      var values = this.tokenize(revAtt.value)
      for (var i = 0; i < values.length; i++) {
        var predicate = this.parsePredicate(values[i], vocabulary, context.terms, prefixes, base, this.inHTMLMode && propertyAtt != null)
        if (predicate) {
          revAttPredicates.push(predicate)
        }
      }
    }

    // Section 3.1, bullet 7
    if (this.inHTMLMode && (relAtt != null || revAtt != null) && propertyAtt != null) {
      if (relAttPredicates.length == 0) {
        relAtt = null
      }
      if (revAttPredicates.length == 0) {
        revAtt = null
      }
    }

    if (relAtt || revAtt) {
      // Sequence Step 6: establish new subject and value
      if (aboutAtt) {
        newSubject = this.parseSafeCURIEOrCURIEOrURI(aboutAtt.value, prefixes, base)
      }
      if (typeofAtt) {
        typedResource = newSubject
      }
      if (!newSubject) {
        if (current.parentNode.nodeType == Node.DOCUMENT_NODE) {
          newSubject = removeHash(current.baseURI)
        } else if (context.parentObject) {
          // TODO: Verify: If the xml:base has been set and the parentObject is the baseURI of the parent, then the subject needs to be the new base URI
          newSubject = removeHash(current.parentNode.baseURI) == context.parentObject ? removeHash(current.baseURI) : context.parentObject
        }
      }
      if (resourceAtt) {
        currentObjectResource = this.parseSafeCURIEOrCURIEOrURI(resourceAtt.value, prefixes, base)
      }

      if (!currentObjectResource) {
        if (hrefAtt) {
          currentObjectResource = this.resolveAndNormalize(base, encodeURI(hrefAtt.value))
        } else if (srcAtt) {
          currentObjectResource = this.resolveAndNormalize(base, encodeURI(srcAtt.value))
        } else if (typeofAtt && !aboutAtt && !(this.inXHTMLMode && (current.localName == 'head' || current.localName == 'body'))) {
          currentObjectResource = this.newBlankNode()
        }
      }
      if (typeofAtt && !aboutAtt && this.inXHTMLMode && (current.localName == 'head' || current.localName == 'body')) {
        typedResource = newSubject
      } else if (typeofAtt && !aboutAtt) {
        typedResource = currentObjectResource
      }

    } else if (propertyAtt && !contentAtt && !datatypeAtt) {
      // Sequence Step 5.1: establish a new subject
      if (aboutAtt) {
        newSubject = this.parseSafeCURIEOrCURIEOrURI(aboutAtt.value, prefixes, base)
        if (typeofAtt) {
          typedResource = newSubject
        }
      }
      if (!newSubject && current.parentNode.nodeType == Node.DOCUMENT_NODE) {
        newSubject = removeHash(current.baseURI)
        if (typeofAtt) {
          typedResource = newSubject
        }
      } else if (!newSubject && context.parentObject) {
        // TODO: Verify: If the xml:base has been set and the parentObject is the baseURI of the parent, then the subject needs to be the new base URI
        newSubject = removeHash(current.parentNode.baseURI) == context.parentObject ? removeHash(current.baseURI) : context.parentObject
      }
      if (typeofAtt && !typedResource) {
        if (resourceAtt) {
          typedResource = this.parseSafeCURIEOrCURIEOrURI(resourceAtt.value, prefixes, base)
        }
        if (!typedResource && hrefAtt) {
          typedResource = this.resolveAndNormalize(base, encodeURI(hrefAtt.value))
        }
        if (!typedResource && srcAtt) {
          typedResource = this.resolveAndNormalize(base, encodeURI(srcAtt.value))
        }
        if (!typedResource && (this.inXHTMLMode || this.inHTMLMode) && (current.localName == 'head' || current.localName == 'body')) {
          typedResource = newSubject
        }
        if (!typedResource) {
          typedResource = this.newBlankNode()
        }
        currentObjectResource = typedResource
      }
    // console.log(current.localName+", newSubject="+newSubject+", typedResource="+typedResource+", currentObjectResource="+currentObjectResource)
    } else {
      // Sequence Step 5.2: establish a new subject
      if (aboutAtt) {
        newSubject = this.parseSafeCURIEOrCURIEOrURI(aboutAtt.value, prefixes, base)
      }
      if (!newSubject && resourceAtt) {
        newSubject = this.parseSafeCURIEOrCURIEOrURI(resourceAtt.value, prefixes, base)
      }
      if (!newSubject && hrefAtt) {
        newSubject = this.resolveAndNormalize(base, encodeURI(hrefAtt.value))
      }
      if (!newSubject && srcAtt) {
        newSubject = this.resolveAndNormalize(base, encodeURI(srcAtt.value))
      }
      if (!newSubject) {
        if (current.parentNode.nodeType == Node.DOCUMENT_NODE) {
          newSubject = removeHash(current.baseURI)
        } else if ((this.inXHTMLMode || this.inHTMLMode) && (current.localName == 'head' || current.localName == 'body')) {
          newSubject = removeHash(current.parentNode.baseURI) == context.parentObject ? removeHash(current.baseURI) : context.parentObject
        } else if (typeofAtt) {
          newSubject = this.newBlankNode()
        } else if (context.parentObject) {
          // TODO: Verify: If the xml:base has been set and the parentObject is the baseURI of the parent, then the subject needs to be the new base URI
          newSubject = removeHash(current.parentNode.baseURI) == context.parentObject ? removeHash(current.baseURI) : context.parentObject
          if (!propertyAtt) {
            skip = true
          }
        }
      }
      if (typeofAtt) {
        typedResource = newSubject
      }
    }

    // console.log(current.tagName+": newSubject="+newSubject+", currentObjectResource="+currentObjectResource+", typedResource="+typedResource+", skip="+skip)

    var rdfaData = null
    if (newSubject) {
      // this.newSubject(current,newSubject)
      if (aboutAtt || resourceAtt || typedResource) {
        var id = newSubject
        if (typeofAtt && !aboutAtt && !resourceAtt && currentObjectResource) {
          id = currentObjectResource
        }
        //console.log("Setting data attribute for "+current.localName+" for subject "+id)
        this.newSubjectOrigin(current, id)
      }
    }

    // Sequence Step 7: generate type triple
    if (typedResource) {
      var values = this.tokenize(typeofAtt.value)
      for (var i = 0; i < values.length; i++) {
        var object = this.parseTermOrCURIEOrAbsURI(values[i], vocabulary, context.terms, prefixes, base)
        if (object) {
          this.addTriple(current, typedResource, $rdf.RDFaProcessor.typeURI, { type: $rdf.RDFaProcessor.objectURI,  value: object})
        }
      }
    }

    // Sequence Step 8: new list mappings if there is a new subject
    // console.log("Step 8: newSubject="+newSubject+", context.parentObject="+context.parentObject)
    if (newSubject && newSubject != context.parentObject) {
      // console.log("Generating new list mapping for "+newSubject)
      listMapping = {}
      listMappingDifferent = true
    }

    // Sequence Step 9: generate object triple
    if (currentObjectResource) {
      if (relAtt && inlistAtt) {
        for (var i = 0; i < relAttPredicates.length; i++) {
          var list = listMapping[relAttPredicates[i]]
          if (!list) {
            list = []
            listMapping[relAttPredicates[i]] = list
          }
          list.push({ type: $rdf.RDFaProcessor.objectURI, value: currentObjectResource })
        }
      } else if (relAtt) {
        for (var i = 0; i < relAttPredicates.length; i++) {
          this.addTriple(current, newSubject, relAttPredicates[i], { type: $rdf.RDFaProcessor.objectURI, value: currentObjectResource})
        }
      }
      if (revAtt) {
        for (var i = 0; i < revAttPredicates.length; i++) {
          this.addTriple(current, currentObjectResource, revAttPredicates[i], { type: $rdf.RDFaProcessor.objectURI, value: newSubject})
        }
      }
    } else {
      // Sequence Step 10: incomplete triples
      if (newSubject && !currentObjectResource && (relAtt || revAtt)) {
        currentObjectResource = this.newBlankNode()
      // alert(current.tagName+": generated blank node, newSubject="+newSubject+" currentObjectResource="+currentObjectResource)
      }
      if (relAtt && inlistAtt) {
        for (var i = 0; i < relAttPredicates.length; i++) {
          var list = listMapping[relAttPredicates[i]]
          if (!list) {
            list = []
            listMapping[predicate] = list
          }
          // console.log("Adding incomplete list for "+predicate)
          incomplete.push({ predicate: relAttPredicates[i], list: list })
        }
      } else if (relAtt) {
        for (var i = 0; i < relAttPredicates.length; i++) {
          incomplete.push({ predicate: relAttPredicates[i], forward: true })
        }
      }
      if (revAtt) {
        for (var i = 0; i < revAttPredicates.length; i++) {
          incomplete.push({ predicate: revAttPredicates[i], forward: false })
        }
      }
    }

    // Step 11: Current property values
    if (propertyAtt) {
      var datatype = null
      var content = null
      if (datatypeAtt) {
        datatype = datatypeAtt.value == '' ? $rdf.RDFaProcessor.PlainLiteralURI : this.parseTermOrCURIEOrAbsURI(datatypeAtt.value, vocabulary, context.terms, prefixes, base)
        if (datetimeAtt && !contentAtt) {
          content = datetimeAtt.value
        } else {
          content = datatype == $rdf.RDFaProcessor.XMLLiteralURI || datatype == $rdf.RDFaProcessor.HTMLLiteralURI ? null : (contentAtt ? contentAtt.value : current.textContent)
        }
      } else if (contentAtt) {
        datatype = $rdf.RDFaProcessor.PlainLiteralURI
        content = contentAtt.value
      } else if (datetimeAtt) {
        content = datetimeAtt.value
        datatype = $rdf.RDFaProcessor.deriveDateTimeType(content)
        if (!datatype) {
          datatype = $rdf.RDFaProcessor.PlainLiteralURI
        }
      } else if (!relAtt && !revAtt) {
        if (resourceAtt) {
          content = this.parseSafeCURIEOrCURIEOrURI(resourceAtt.value, prefixes, base)
        }
        if (!content && hrefAtt) {
          content = this.resolveAndNormalize(base, encodeURI(hrefAtt.value))
        } else if (!content && srcAtt) {
          content = this.resolveAndNormalize(base, encodeURI(srcAtt.value))
        }
        if (content) {
          datatype = $rdf.RDFaProcessor.objectURI
        }
      }
      if (!datatype) {
        if (typeofAtt && !aboutAtt) {
          datatype = $rdf.RDFaProcessor.objectURI
          content = typedResource
        } else {
          content = current.textContent
          if (this.inHTMLMode && current.localName == 'time') {
            datatype = $rdf.RDFaProcessor.deriveDateTimeType(content)
          }
          if (!datatype) {
            datatype = $rdf.RDFaProcessor.PlainLiteralURI
          }
        }
      }
      var values = this.tokenize(propertyAtt.value)
      for (var i = 0; i < values.length; i++) {
        var predicate = this.parsePredicate(values[i], vocabulary, context.terms, prefixes, base)
        if (predicate) {
          if (inlistAtt) {
            var list = listMapping[predicate]
            if (!list) {
              list = []
              listMapping[predicate] = list
            }
            list.push((datatype == $rdf.RDFaProcessor.XMLLiteralURI || datatype == $rdf.RDFaProcessor.HTMLLiteralURI) ? { type: datatype, value: current.childNodes} : { type: datatype ? datatype : $rdf.RDFaProcessor.PlainLiteralURI, value: content, language: language})
          } else {
            if (datatype == $rdf.RDFaProcessor.XMLLiteralURI || datatype == $rdf.RDFaProcessor.HTMLLiteralURI) {
              this.addTriple(current, newSubject, predicate, { type: datatype, value: current.childNodes})
            } else {
              this.addTriple(current, newSubject, predicate, { type: datatype ? datatype : $rdf.RDFaProcessor.PlainLiteralURI, value: content, language: language})
            // console.log(newSubject+" "+predicate+"="+content)
            }
          }
        }
      }
    }

    // Sequence Step 12: complete incomplete triples with new subject
    if (newSubject && !skip) {
      for (var i = 0; i < context.incomplete.length; i++) {
        if (context.incomplete[i].list) {
          // console.log("Adding subject "+newSubject+" to list for "+context.incomplete[i].predicate)
          // TODO: it is unclear what to do here
          context.incomplete[i].list.push({ type: $rdf.RDFaProcessor.objectURI, value: newSubject })
        } else if (context.incomplete[i].forward) {
          // console.log(current.tagName+": completing forward triple "+context.incomplete[i].predicate+" with object="+newSubject)
          this.addTriple(current, context.subject, context.incomplete[i].predicate, { type: $rdf.RDFaProcessor.objectURI, value: newSubject})
        } else {
          // console.log(current.tagName+": completing reverse triple with object="+context.subject)
          this.addTriple(current, newSubject, context.incomplete[i].predicate, { type: $rdf.RDFaProcessor.objectURI, value: context.subject})
        }
      }
    }

    var childContext = null
    var listSubject = newSubject
    if (skip) {
      // TODO: should subject be null?
      childContext = this.push(context, context.subject)
      // TODO: should the entObject be passed along?  If not, then intermediary children will keep properties from being associated with incomplete triples.
      // TODO: Verify: if the current baseURI has changed and the parentObject is the parent's base URI, then the baseURI should change
      childContext.parentObject = removeHash(current.parentNode.baseURI) == context.parentObject ? removeHash(current.baseURI) : context.parentObject
      childContext.incomplete = context.incomplete
      childContext.language = language
      childContext.prefixes = prefixes
      childContext.vocabulary = vocabulary
    } else {
      childContext = this.push(context, newSubject)
      childContext.parentObject = currentObjectResource ? currentObjectResource : (newSubject ? newSubject : context.subject)
      childContext.prefixes = prefixes
      childContext.incomplete = incomplete
      if (currentObjectResource) {
        // console.log("Generating new list mapping for "+currentObjectResource)
        listSubject = currentObjectResource
        listMapping = {}
        listMappingDifferent = true
      }
      childContext.listMapping = listMapping
      childContext.language = language
      childContext.vocabulary = vocabulary
    }
    if (listMappingDifferent) {
      //console.log("Pushing list parent "+current.localName)
      queue.unshift({ parent: current, context: context, subject: listSubject, listMapping: listMapping})
    }
    for (var child = current.lastChild; child; child = child.previousSibling) {
      if (child.nodeType == Node.ELEMENT_NODE) {
        // console.log("Pushing child "+child.localName)
        child.baseURI = current.baseURI
        queue.unshift({ current: child, context: childContext})
      }
    }
  }

  if (this.inHTMLMode) {
    this.copyProperties()
  }

  for (var i = 0; i < this.finishedHandlers.length; i++) {
    this.finishedHandlers[i](node)
  }
}

$rdf.RDFaProcessor.prototype.copyProperties = function () {}

$rdf.RDFaProcessor.prototype.push = function (parent, subject) {
  return {
    parent: parent,
    subject: subject ? subject : (parent ? parent.subject : null),
    parentObject: null,
    incomplete: [],
    listMapping: parent ? parent.listMapping : {},
    language: parent ? parent.language : this.language,
    prefixes: parent ? parent.prefixes : this.target.graph.prefixes,
    terms: parent ? parent.terms : this.target.graph.terms,
    vocabulary: parent ? parent.vocabulary : this.vocabulary
  }
}
// ///////////////

$rdf.parseRDFaDOM = function (dom, kb, base) {
  var p = new $rdf.RDFaProcessor(kb, { 'base': base })
  dom.baseURI = base
  p.process(dom)
}
// /////////////////// Parse a simple SPARL-Update subset syntax for patches.
//
//  This parses
//   WHERE {xxx} DELETE {yyy} INSERT DATA {zzz}
// (not necessarily in that order)
// as though it were the n3
//   <#query> patch:where {xxx}; patch:delete {yyy}; patch:insert {zzz}.

$rdf.sparqlUpdateParser = function(str, kb, base) {
    var i,j,k;
    var keywords = [ 'INSERT', 'DELETE', 'WHERE' ]
    var SQNS = $rdf.Namespace('http://www.w3.org/ns/pim/patch#');
    var p = $rdf.N3Parser(kb, kb, base, base, null, null, "", null);
    var clauses = {};

    var badSyntax = function (uri, lines, str, i, why) {
        return  ("Line " +  ( lines + 1 ) + " of <" + uri + ">: Bad syntax:\n   " +
                why + "\n   at: \"" + str.slice(i, (i + 30))  + "\"" ) ;
    };

    var check = function(next, last, message) {
        if (next < 0) {
            throw badSyntax(p._thisDoc, p.lines, str, j, last, message);
        };
        return next;
    };


    i = 0;
    var query = kb.sym(base+ '#query');  // Invent a URI for the query
    clauses['query'] = query; // A way of accessing it in its N3 model.

    while (true) {
        // console.log("A Now at i = " + i)
        var j = p.skipSpace(str, i);
        if (j < 0) {
            return clauses
        }
        // console.log("B After space at j= " + j)
        if (str[j] === ';') {
            i = p.skipSpace(str, j + 1);
            if ( i < 0) {
                return clauses ; // Allow end in a ;
            }
            j = i;
        }
        var found = false;
        for (k=0;  k< keywords.length; k++) {
            var key = keywords[k];
            if (str.slice(j, j + key.length) === key) {
                // console.log("C got one " + key);
                i = p.skipSpace(str, j+ key.length);
                // console.log("D after space at i= " + i);
                if (i < 0) {
                    throw badSyntax(p._thisDoc, p.lines, str, j+ key.length, "found EOF, needed {...} after "+key);
                };
                if (((key === 'INSERT') || (key === 'DELETE')) && str.slice(i, i+4) === 'DATA') { // Some wanted 'DATA'. Whatever
                    j = p.skipSpace(str, i+4);
                    if (j < 0) {
                        throw badSyntax(p._thisDoc, p.lines, str, i+4, "needed {...} after INSERT DATA "+key);
                    };
                    i = j;
                }
                var res2 = [];
                j = p.node(str, i, res2);
                // console.log("M Now at j= " + j + " i= " + i)

                if (j < 0) {
                    throw badSyntax(p._thisDoc, p.lines, str, i,
                            "bad syntax or EOF in {...} after " + key);
                }
                clauses[key.toLowerCase()] = res2[0];
                // print("res2[0] for "+key+ " is " + res2[0]);  //   @@ debug @@@@@@
                kb.add(query, SQNS(key.toLowerCase()), res2[0]);
                // key is the keyword and res2 has the contents
                found = true;
                i = j;
            }
        };
        if (!found  && str.slice(j, j+7) === '@prefix') {
            var i = p.directive(str, j);
            if (i < 0) {
            throw badSyntax(p._thisDoc, p.lines, str, i,
                    "bad syntax or EOF after @prefix ");
            }
            // console.log("P before dot i= " + i)
            i = p.checkDot(str, i);
            // console.log("Q after dot i= " + i)
            found = true;
        }
        if (!found) {
            // console.log("Bad syntax " + j)
            throw badSyntax(p._thisDoc, p.lines, str, j,
                    "Unknown syntax at start of statememt: '" + str.slice(j).slice(0,20) +"'")
        }

    } // while
    //return clauses


}; // End of sparqlUpdateParser


//////////////// Apply a patch

$rdf.IndexedFormula.prototype.applyPatch = function(patch, target, patchCallback) { // patchCallback(err)
    var targetKB = this;
    var doPatch = function(onDonePatch) {
        // $rdf.log.info("doPatch ...")

        if (patch['delete']) {
            // $rdf.log.info("doPatch delete "+patch['delete'])
            var ds =  patch['delete']
            if (bindings) ds = ds.substitute(bindings);
            ds = ds.statements;
            var bad = [];
            var ds2 = ds.map(function(st){ // Find the actual statemnts in the store
                var sts = targetKB.statementsMatching(st.subject, st.predicate, st.object, target);
                if (sts.length === 0) {
                    // $rdf.log.info("NOT FOUND deletable " + st);
                    bad.push(st);
                    return null;
                } else {
                    // $rdf.log.info("Found deletable " + st);
                    return sts[0]
                }
            });
            if (bad.length) {
                return patchCallback("Couldn't find to delete: " + bad[0])
            }
            ds2.map(function(st){
                targetKB.remove(st);
            });
        };

        if (patch['insert']) {
            // $rdf.log.info("doPatch insert "+patch['insert'])
            var ds =  patch['insert'];
            if (bindings) ds = ds.substitute(bindings);
            ds = ds.statements;
            ds.map(function(st){st.why = target;
                targetKB.add(st.subject, st.predicate, st.object, st.why);
            });
        };
        onDonePatch();
    };

    var bindings = null;
    if (patch.where) {
        // $rdf.log.info("Processing WHERE: " + patch.where + '\n');

        var query = new $rdf.Query('patch');
        query.pat = patch.where;
        query.pat.statements.map(function(st){st.why = target});

        var bindingsFound = [];
        // $rdf.log.info("Processing WHERE - launching query: " + query.pat);

        targetKB.query(query, function onBinding(binding) {
            bindingsFound.push(binding)
        },
        targetKB.fetcher,
        function onDone() {
            if (bindingsFound.length == 0) {
                return patchCallback("No match found to be patched:" + patch.where);
            }
            if (bindingsFound.length > 1) {
                return patchCallback("Patch ambiguous. No patch done.");
            }
            bindings = bindingsFound[0];
            doPatch(patchCallback);
        });
    } else {
        doPatch(patchCallback)
    };
};




// ends
// Matching a formula against another formula
// Assync as well as Synchronously
//
//
// W3C open source licence 2005.
//
// This builds on term.js, match.js (and identity.js?)
// to allow a query of a formula.
//
// Here we introduce for the first time a subclass of term: variable.
//
// SVN ID: $Id: query.js 25116 2008-11-15 16:13:48Z timbl $

//  Variable
//
// Compare with BlankNode.  They are similar, but a variable
// stands for something whose value is to be returned.
// Also, users name variables and want the same name back when stuff is printed

/* jsl:option explicit*/ // Turn on JavaScriptLint variable declaration checking

// The Query object.  Should be very straightforward.
//
// This if for tracking queries the user has in the UI.
//
$rdf.Query = function (name, id) {
  this.pat = new $rdf.IndexedFormula() // The pattern to search for
  this.vars = [] // Used by UI code but not in query.js
  //    this.orderBy = [] // Not used yet
  this.name = name
  this.id = id
}

/**
 * The QuerySource object stores a set of listeners and a set of queries.
 * It keeps the listeners aware of those queries that the source currently
 * contains, and it is then up to the listeners to decide what to do with
 * those queries in terms of displays.
 * Not used 2010-08 -- TimBL
 * @constructor
 * @author jambo
 */
$rdf.QuerySource = function () {
  /**
   * stores all of the queries currently held by this source,
   * indexed by ID number.
   */
  this.queries = []
  /**
   * stores the listeners for a query object.
   * @see TabbedContainer
   */
  this.listeners = []

  /**
   * add a Query object to the query source--It will be given an ID number
   * and a name, if it doesn't already have one. This subsequently adds the
   * query to all of the listeners the QuerySource knows about.
   */
  this.addQuery = function (q) {
    var i
    if (q.name === null || q.name === '') {
      q.name = 'Query #' + (this.queries.length + 1)
    }
    q.id = this.queries.length
    this.queries.push(q)
    for (i = 0; i < this.listeners.length; i++) {
      if (this.listeners[i] !== null) {
        this.listeners[i].addQuery(q)
      }
    }
  }

  /**
   * Remove a Query object from the source.  Tells all listeners to also
   * remove the query.
   */
  this.removeQuery = function (q) {
    var i
    for (i = 0; i < this.listeners.length; i++) {
      if (this.listeners[i] !== null) {
        this.listeners[i].removeQuery(q)
      }
    }
    if (this.queries[q.id] !== null) {
      delete this.queries[q.id]
    }
  }

  /**
   * adds a "Listener" to this QuerySource - that is, an object
   * which is capable of both adding and removing queries.
   * Currently, only the TabbedContainer class is added.
   * also puts all current queries into the listener to be used.
   */
  this.addListener = function (listener) {
    var i
    this.listeners.push(listener)
    for (i = 0; i < this.queries.length; i++) {
      if (this.queries[i] !== null) {
        listener.addQuery(this.queries[i])
      }
    }
  }
  /**
   * removes listener from the array of listeners, if it exists! Also takes
   * all of the queries from this source out of the listener.
   */
  this.removeListener = function (listener) {
    var i
    for (i = 0; i < this.queries.length; i++) {
      if (this.queries[i] !== null) {
        listener.removeQuery(this.queries[i])
      }
    }

    for (i = 0; i < this.listeners.length; i++) {
      if (this.listeners[i] === listener) {
        delete this.listeners[i]
      }
    }
  }
}

$rdf.Variable.prototype.isVar = 1
$rdf.BlankNode.prototype.isVar = 1
$rdf.BlankNode.prototype.isBlank = 1
$rdf.NamedNode.prototype.isVar = 0
$rdf.Literal.prototype.isVar = 0
$rdf.Formula.prototype.isVar = 0
$rdf.Collection.prototype.isVar = 0

/**
 * This function will match a pattern to the current kb
 *
 * The callback function is called whenever a match is found
 * When fetcher is supplied this will be called to satisfy any resource requests
 * currently not in the kb. The fetcher function needs to be defined manualy and
 * should call $rdf.Util.AJAR_handleNewTerm to process the requested resource.
 *
 * @param	myQuery,	a knowledgebase containing a pattern to use as query
 * @param	callback, 	whenever the pattern in myQuery is met this is called with
 * 						the new bindings as parameter
 * @param	fetcher,	whenever a resource needs to be loaded this gets called  IGNORED OBSOLETE
 *                              f.fetecher is used as a Fetcher instance to do this.
 * @param       onDone          callback when
 */
$rdf.IndexedFormula.prototype.query = function (myQuery, callback, fetcher, onDone) {
  var kb = this

  // /////////// Debug strings

  var bindingDebug = function (b) {
    var str = ''
    var v
    for (v in b) {
      if (b.hasOwnProperty(v)) {
        str += '    ' + v + ' -> ' + b[v]
      }
    }
    return str
  }

  var bindingsDebug = function (nbs) {
    var str = 'Bindings: '
    var i
    var n = nbs.length
    for (i = 0; i < n; i++) {
      str += bindingDebug(nbs[i][0]) + ';\n\t'
    }
    return str
  } // bindingsDebug

  // Unification: see also
  //  http://www.w3.org/2000/10/swap/term.py
  // for similar things in python
  //
  // Unification finds all bindings such that when the binding is applied
  // to one term it is equal to the other.
  // Returns: a list of bindings, where a binding is an associative array
  //  mapping variuable to value.

  var unifyTerm = function (self, other, bindings, formula) {
    var actual = bindings[self]
    if (actual === undefined) { // Not mapped
      if (self.isVar) {
        /* if (self.isBlank)  //bnodes are existential variables
        {
                if (self.toString() == other.toString()) return [[ [], null]]
                else return []
        }*/
        var b = []
        b[self] = other
        return [[ b, null ]] // Match
      }
      actual = self
    }
    if (!actual.complexType) {
      if (formula.redirections[actual]) {
        actual = formula.redirections[actual]
      }
      if (formula.redirections[other]) {
        other = formula.redirections[other]
      }
      if (actual.sameTerm(other)) {
        return [[ [], null ]]
      }
      return []
    }
    if (self instanceof Array) {
      if (!(other instanceof Array)) {
        return []
      }
      return unifyContents(self, other, bindings)
    }
    throw new Error('query.js: oops - code not written yet')
  // return undefined;  // for lint - no jslint objects to unreachables
  //    return actual.unifyContents(other, bindings)
  } // unifyTerm

  var unifyContents = function (self, other, bindings, formula) {
    var nbs2
    if (self.length !== other.length) {
      return [] // no way
    }
    if (!self.length) {
      return [[ [], null ]] // Success
    }
    var nbs = unifyTerm(self[0], other[0], bindings, formula)
    if (nbs.length === 0) {
      return nbs
    }
    var res = []
    var i
    var n = nbs.length
    var nb
    var j
    var m
    var v
    var nb2
    var bindings2
    for (i = 0; i < n; i++) { // for each possibility from the first term
      nb = nbs[i][0] // new bindings
      bindings2 = []
      for (v in nb) {
        if (nb.hasOwnProperty(v)) {
          bindings2[v] = nb[v] // copy
        }
      }
      for (v in bindings) {
        if (bindings.hasOwnProperty(v)) {
          bindings2[v] = bindings[v] // copy
        }
      }
      nbs2 = unifyContents(self.slice(1), other.slice(1), bindings2, formula)
      m = nbs2.length
      for (j = 0; j < m; j++) {
        nb2 = nbs2[j][0] // @@@@ no idea whether this is used or right
        for (v in nb) {
          if (nb.hasOwnProperty(v)) {
            nb2[v] = nb[v]
          }
        }
        res.push([nb2, null])
      }
    }
    return res
  } // unifyContents

  //  Matching
  //
  // Matching finds all bindings such that when the binding is applied
  // to one term it is equal to the other term.  We only match formulae.

  /** if x is not in the bindings array, return the var; otherwise, return the bindings **/
  var bind = function (x, binding) {
    var y = binding[x]
    if (y === undefined) {
      return x
    }
    return y
  }

  // When there are OPTIONAL clauses, we must return bindings without them if none of them
  // succeed. However, if any of them do succeed, we should not.  (This is what branchCount()
  // tracked. The problem currently is (2011/7) that when several optionals exist, and they
  // all match, multiple sets of bindings are returned, each with one optional filled in.)

  var union = function (a, b) {
    var c = {}
    var x
    for (x in a) {
      if (a.hasOwnProperty(x)) {
        c[x] = a[x]
      }
    }
    for (x in b) {
      if (b.hasOwnProperty(x)) {
        c[x] = b[x]
      }
    }
    return c
  }

  var OptionalBranchJunction = function (originalCallback, trunkBindings) {
    this.trunkBindings = trunkBindings
    this.originalCallback = originalCallback
    this.branches = []
    // this.results = []; // result[i] is an array of bindings for branch i
    // this.done = {};  // done[i] means all/any results are in for branch i
    // this.count = {}
    return this
  }

  OptionalBranchJunction.prototype.checkAllDone = function () {
    var i
    for (i = 0; i < this.branches.length; i++) {
      if (!this.branches[i].done) {
        return
      }
    }
    $rdf.log.debug('OPTIONAL BIDNINGS ALL DONE:')
    this.doCallBacks(this.branches.length - 1, this.trunkBindings)
  }
  // Recrursively generate the cross product of the bindings
  OptionalBranchJunction.prototype.doCallBacks = function (b, bindings) {
    var j
    if (b < 0) {
      return this.originalCallback(bindings)
    }
    for (j = 0; j < this.branches[b].results.length; j++) {
      this.doCallBacks(b - 1, union(bindings, this.branches[b].results[j]))
    }
  }

  // A mandatory branch is the normal one, where callbacks
  // are made immediately and no junction is needed.
  // Might be useful for onFinsihed callback for query API.
  var MandatoryBranch = function (callback, onDone) {
    this.count = 0
    this.success = false
    this.done = false
    // this.results = []
    this.callback = callback
    this.onDone = onDone
    // this.junction = junction
    // junction.branches.push(this)
    return this
  }

  MandatoryBranch.prototype.reportMatch = function (bindings) {
    // $rdf.log.error("@@@@ query.js 1"); // @@
    this.callback(bindings)
    this.success = true
  }

  MandatoryBranch.prototype.reportDone = function () {
    this.done = true
    $rdf.log.info('Mandatory query branch finished.***')
    if (this.onDone !== undefined) {
      this.onDone()
    }
  }

  // An optional branch hoards its results.
  var OptionalBranch = function (junction) {
    this.count = 0
    this.done = false
    this.results = []
    this.junction = junction
    junction.branches.push(this)
    return this
  }

  OptionalBranch.prototype.reportMatch = function (bindings) {
    this.results.push(bindings)
  }

  OptionalBranch.prototype.reportDone = function () {
    $rdf.log.debug('Optional branch finished - results.length = ' + this.results.length)
    if (this.results.length === 0) { // This is what optional means: if no hits,
      this.results.push({}) // mimic success, but with no bindings
      $rdf.log.debug("Optional branch FAILED - that's OK.")
    }
    this.done = true
    this.junction.checkAllDone()
  }

  /** prepare -- sets the index of the item to the possible matches
      * @param f - formula
      * @param item - an Statement, possibly w/ vars in it
      * @param bindings -
  * @returns true if the query fails -- there are no items that match **/
  var prepare = function (f, item, bindings) {
    var t, terms, termIndex, i, ind
    item.nvars = 0
    item.index = null
    // if (!f.statements) $rdf.log.warn("@@@ prepare: f is "+f)
    //    $rdf.log.debug("Prepare: f has "+ f.statements.length)
    // $rdf.log.debug("Prepare: Kb size "+f.statements.length+" Preparing "+item)

    terms = [item.subject, item.predicate, item.object]
    ind = [f.subjectIndex, f.predicateIndex, f.objectIndex]
    for (i = 0; i < 3; i++) {
      // alert("Prepare "+terms[i]+" "+(terms[i] in bindings))
      if (terms[i].isVar && !(bindings[terms[i]] !== undefined)) {
        item.nvars++
      } else {
        t = bind(terms[i], bindings) // returns the RDF binding if bound, otherwise itself
        // if (terms[i]!=bind(terms[i],bindings) alert("Term: "+terms[i]+"Binding: "+bind(terms[i], bindings))
        if (f.redirections[t.hashString()]) {
          t = f.redirections[t.hashString()] // redirect
        }
        termIndex = ind[i][t.hashString()]

        if (!termIndex) {
          item.index = []
          return false // Query line cannot match
        }
        if ((item.index === null) || (item.index.length > termIndex.length)) {
          item.index = termIndex
        }
      }
    }

    if (item.index === null) { // All 3 are variables?
      item.index = f.statements
    }
    return true
  } // prepare

  /** sorting function -- negative if self is easier **/
  // We always prefer to start with a URI to be able to browse a graph
  // this is why we put off items with more variables till later.
  function easiestQuery (self, other) {
    if (self.nvars !== other.nvars) {
      return self.nvars - other.nvars
    }
    return self.index.length - other.index.length
  }

  var match_index = 0 // index
  /** matches a pattern formula against the knowledge base, e.g. to find matches for table-view
  *
  * @param f - knowledge base formula
  * @param g - pattern formula (may have vars)
  * @param bindingsSoFar  - bindings accumulated in matching to date
  * @param level - spaces to indent stuff also lets you know what level of recursion you're at
  * @param fetcher - function (term, requestedBy) - myFetcher / AJAR_handleNewTerm / the sort
  * @param localCallback - function(bindings, pattern, branch) called on sucess
  * @returns nothing
  *
  * Will fetch linked data from the web iff the knowledge base an associated source fetcher (f.fetcher)
  ***/
  var match = function (f, g, bindingsSoFar, level, fetcher, localCallback, branch) {
    $rdf.log.debug('Match begins, Branch count now: ' + branch.count + ' for ' + branch.pattern_debug)
    var sf = f.fetcher ? f.fetcher : null
    // $rdf.log.debug("match: f has "+f.statements.length+", g has "+g.statements.length)
    var pattern = g.statements
    if (pattern.length === 0) { // when it's satisfied all the pattern triples
      $rdf.log.debug('FOUND MATCH WITH BINDINGS:' + bindingDebug(bindingsSoFar))
      if (g.optional.length === 0) {
        branch.reportMatch(bindingsSoFar)
      } else {
        $rdf.log.debug('OPTIONAL: ' + g.optional)
        var junction = new OptionalBranchJunction(callback, bindingsSoFar) // @@ won't work with nested optionals? nest callbacks
        var br = []
        var b
        for (b = 0; b < g.optional.length; b++) {
          br[b] = new OptionalBranch(junction) // Allocate branches to prevent premature ending
          br[b].pattern_debug = g.optional[b] // for diagnotics only
        }
        for (b = 0; b < g.optional.length; b++) {
          br[b].count = br[b].count + 1 // Count how many matches we have yet to complete
          match(f, g.optional[b], bindingsSoFar, '', fetcher, callback, br[b])
        }
      }
      branch.count--
      $rdf.log.debug('Match ends -- success , Branch count now: ' + branch.count + ' for ' + branch.pattern_debug)
      return // Success
    }

    var item
    var i
    var n = pattern.length
    // $rdf.log.debug(level + "Match "+n+" left, bs so far:"+bindingDebug(bindingsSoFar))

    // Follow links from variables in query
    if (sf) { // Fetcher is used to fetch URIs, function first term is a URI term, second is the requester
      var id = 'match' + match_index++
      var fetchResource = function (requestedTerm, id) {
        var docuri = requestedTerm.uri.split('#')[0]
        sf.nowOrWhenFetched(docuri, undefined, function (err, body, xhr) {
          if (err) {
            console.log('Error following link to <' + requestedTerm.uri + '> in query: ' + body)
          }
          match(f, g, bindingsSoFar, level, fetcher, // match not match2 to look up any others necessary.
            localCallback, branch)
        })
      /*
      if( sf ) {
          sf.addCallback('done', function(uri) {
              if ((kb.canon(kb.sym(uri)).uri !== path) && (uri !== kb.canon(kb.sym(path)))) {
                  return true
              }
              return false
          })
      }
      fetcher(requestedTerm, id)
      */
      }
      for (i = 0; i < n; i++) {
        item = pattern[i] // for each of the triples in the query
        if (bindingsSoFar[item.subject] !== undefined &&
            bindingsSoFar[item.subject].uri && sf &&
            sf.getState($rdf.Util.uri.docpart(bindingsSoFar[item.subject].uri)) === 'unrequested') {
          // fetch the subject info and return to id
          fetchResource(bindingsSoFar[item.subject], id)
          return // only look up one per line this time, but we will come back again though match
        }
        if (bindingsSoFar[item.object] !== undefined &&
            bindingsSoFar[item.object].uri && sf &&
            sf.getState($rdf.Util.uri.docpart(bindingsSoFar[item.object].uri)) === 'unrequested') {
          fetchResource(bindingsSoFar[item.object], id)
          return
        }
      }
    } // if sf
    match2(f, g, bindingsSoFar, level, fetcher, localCallback, branch)
    return
  } // match

  var constraintsSatisfied = function (bindings, constraints) {
    var res = true
    var x
    var test
    for (x in bindings) {
      if (bindings.hasOwnProperty(x)) {
        if (constraints[x]) {
          test = constraints[x].test
          if (test && !test(bindings[x])) {
            res = false
          }
        }
      }
    }
    return res
  }

  /** match2 -- stuff after the fetch **/
  var match2 = function (f, g, bindingsSoFar, level, fetcher, callback, branch) { // post fetch
    var pattern = g.statements
    var n = pattern.length
    var i
    var k
    var nk
    var v
    var bindings2
    var newBindings1
    var item
    for (i = 0; i < n; i++) { // For each statement left in the query, run prepare
      item = pattern[i]
      $rdf.log.info('match2: item=' + item + ', bindingsSoFar=' + bindingDebug(bindingsSoFar))
      prepare(f, item, bindingsSoFar)
    }
    pattern.sort(easiestQuery)
    item = pattern[0]
    // $rdf.log.debug("Sorted pattern:\n"+pattern)
    var rest = f.formula()
    rest.optional = g.optional
    rest.constraints = g.constraints
    rest.statements = pattern.slice(1) // No indexes: we will not query g.
    $rdf.log.debug(level + 'match2 searching ' + item.index.length + ' for ' + item +
      '; bindings so far=' + bindingDebug(bindingsSoFar))
    // var results = []
    var c
    var nc = item.index.length
    var nbs1
    var st
    var onward = 0
    // var x
    for (c = 0; c < nc; c++) { // For each candidate statement
      st = item.index[c] // for each statement in the item's index, spawn a new match with that binding
      nbs1 = unifyContents(
        [item.subject, item.predicate, item.object],
        [st.subject, st.predicate, st.object], bindingsSoFar, f)
      $rdf.log.info(level + ' From first: ' + nbs1.length + ': ' + bindingsDebug(nbs1))
      nk = nbs1.length
      // branch.count += nk
      // $rdf.log.debug("Branch count bumped "+nk+" to: "+branch.count)
      for (k = 0; k < nk; k++) { // For each way that statement binds
        bindings2 = []
        newBindings1 = nbs1[k][0]
        if (!constraintsSatisfied(newBindings1, g.constraints)) {
          // branch.count--
          $rdf.log.debug('Branch count CS: ' + branch.count)
        } else {
          for (v in newBindings1) {
            if (newBindings1.hasOwnProperty(v)) {
              bindings2[v] = newBindings1[v] // copy
            }
          }
          for (v in bindingsSoFar) {
            if (bindingsSoFar.hasOwnProperty(v)) {
              bindings2[v] = bindingsSoFar[v] // copy
            }
          }

          branch.count++ // Count how many matches we have yet to complete
          onward++
          match(f, rest, bindings2, level + '  ', fetcher, callback, branch) // call match
        }
      }
    }
    branch.count--
    if (onward === 0) {
      $rdf.log.debug('Match2 fails completely on ' + item)
    }
    $rdf.log.debug('Match2 ends, Branch count: ' + branch.count + ' for ' + branch.pattern_debug)
    if (branch.count === 0) {
      $rdf.log.debug('Branch finished.')
      branch.reportDone()
    }
  } // match2

  // ////////////////////////// Body of query()  ///////////////////////
  /*
  if(!fetcher) {
      fetcher=function (x, requestedBy) {
          if (x === null) {
              return
          }
          $rdf.Util.AJAR_handleNewTerm(kb, x, requestedBy)
      }
  }
  */
  // prepare, oncallback: match1
  // match1: fetcher, oncallback: match2
  // match2, oncallback: populatetable
  //    $rdf.log.debug("Query F length"+this.statements.length+" G="+myQuery)
  var f = this
  $rdf.log.debug('Query on ' + this.statements.length)

  // kb.remoteQuery(myQuery,'http://jena.hpl.hp.com:3040/backstage',callback)
  // return

  var trunck = new MandatoryBranch(callback, onDone)
  trunck.count++ // count one branch to complete at the moment
  setTimeout(function () {
    match(f, myQuery.pat, myQuery.pat.initBindings, '', fetcher, callback,
      trunck /* branch */)
  }, 0)

  return // returns nothing; callback does the work
} // query

// ENDS
// Converting between SPARQL queries and the $rdf query API
/*

function SQuery () {
  this.terms = []
  return this
}

STerm.prototype.toString = STerm.val
SQuery.prototype.add = function (str) {this.terms.push()}*/

$rdf.queryToSPARQL = function (query) {
  var indent = 0
  function getSelect (query) {
    var str = addIndent() + 'SELECT '
    for (var i = 0; i < query.vars.length; i++) {
      str += query.vars[i] + ' '
    }
    str += '\n'
    return str
  }

  function getPattern (pat) {
    var str = ''
    var st = pat.statements
    for (var x in st) {
      $rdf.log.debug('Found statement: ' + st)
      str += addIndent() + st[x] + '\n'
    }
    return str
  }

  function getConstraints (pat) {
    var str = ''
    for (var v in pat.constraints) {
      var foo = pat.constraints[v]
      str += addIndent() + 'FILTER ( ' + foo.describe(v) + ' ) ' + '\n'
    }
    return str
  }

  function getOptionals (pat) {
    var str = ''
    for (var x = 0; x < pat.optional.length; x++) {
      // alert(pat.optional.termType)
      $rdf.log.debug('Found optional query')
      str += addIndent() + 'OPTIONAL { ' + '\n'
      indent++
      str += getPattern(pat.optional[x])
      str += getConstraints(pat.optional[x])
      str += getOptionals(pat.optional[x])
      indent--
      str += addIndent() + '}' + '\n'
    }
    return str
  }

  function getWhere (pat) {
    var str = addIndent() + 'WHERE \n' + '{ \n'
    indent++
    str += getPattern(pat)
    str += getConstraints(pat)
    str += getOptionals(pat)
    indent--
    str += '}'
    return str
  }

  function addIndent () {
    var str = ''
    for (var i = 0; i < indent; i++) {
      str += '    '
    }
    return str
  }

  function getSPARQL (query) {
    return getSelect(query) + getWhere(query.pat)
  }

  return getSPARQL(query)
}

/**
 * @SPARQL: SPARQL text that is converted to a query object which is returned.
 * @testMode: testing flag. Prevents loading of sources.
 */

$rdf.SPARQLToQuery = function (SPARQL, testMode, kb) {
  // AJAR_ClearTable()
  var variableHash = []
  function makeVar (name) {
    if (variableHash[name]) {
      return variableHash[name]
    }
    var newVar = kb.variable(name)
    variableHash[name] = newVar
    return newVar
  }

  // term type functions
  function isRealText (term) {
    return (typeof term === 'string' && term.match(/[^ \n\t]/))
  }
  function isVar (term) {
    return (typeof term === 'string' && term.match(/^[\?\$]/))
  }
  function fixSymbolBrackets (term) {
    if (typeof term === 'string') {
      return term.replace(/^&lt;/, '<').replace(/&gt;$/, '>')
    } else {
      return term
    }
  }
  function isSymbol (term) {
    return (typeof term === 'string' && term.match(/^<[^>]*>$/))
  }
  function isBnode (term) {
    return (typeof term === 'string' && (term.match(/^_:/) || term.match(/^$/)))
  }
  function isPrefix (term) {
    return (typeof term === 'string' && term.match(/:$/))
  }
  function isPrefixedSymbol (term) {
    return (typeof term === 'string' && term.match(/^:|^[^_][^:]*:/))
  }
  function getPrefix (term) {
    var a = term.split(':')
    return a[0]
  }
  function getSuffix (term) {
    var a = term.split(':')
    return a[1]
  }
  function removeBrackets (term) {
    if (isSymbol(term)) {
      return term.slice(1, term.length - 1)
    } else {
      return term
    }
  }
  // takes a string and returns an array of strings and Literals in the place of literals
  function parseLiterals (str) {
    // var sin = (str.indexOf(/[ \n]\'/)==-1)?null:str.indexOf(/[ \n]\'/), doub = (str.indexOf(/[ \n]\"/)==-1)?null:str.indexOf(/[ \n]\"/)
    var sin = (str.indexOf("'") === -1)
      ? null
      : str.indexOf("'")
    var doub = (str.indexOf('"') === -1)
      ? null
      : str.indexOf('"')
    // alert("S: "+sin+" D: "+doub)
    if (!sin && !doub) {
      var a = new Array(1)
      a[0] = str
      return a
    }
    var res = new Array(2)
    var br
    var ind
    if (!sin || (doub && doub < sin)) {
      br = '"'
      ind = doub
    } else if (!doub || (sin && sin < doub)) {
      br = "'"
      ind = sin
    } else {
      $rdf.log.error('SQARQL QUERY OOPS!')
      return res
    }
    res[0] = str.slice(0, ind)
    var end = str.slice(ind + 1).indexOf(br)
    if (end === -1) {
      $rdf.log.error('SPARQL parsing error: no matching parentheses in literal ' + str)
      return str
    }
    // alert(str.slice(end + ind + 2).match(/^\^\^/))
    var end2
    if (str.slice(end + ind + 2).match(/^\^\^/)) {
      end2 = str.slice(end + ind + 2).indexOf(' ')
      // alert(end2)
      res[1] = kb.literal(
        str.slice(ind + 1, ind + 1 + end),
        '',
        kb.sym(removeBrackets(
          str.slice(ind + 4 + end, ind + 2 + end + end2))
        )
      )
      // alert(res[1].datatype.uri)
      res = res.concat(parseLiterals(str.slice(end + ind + 3 + end2)))
    } else if (str.slice(end + ind + 2).match(/^@/)) {
      end2 = str.slice(end + ind + 2).indexOf(' ')
      // alert(end2)
      res[1] = kb.literal(
        str.slice(ind + 1, ind + 1 + end),
        str.slice(ind + 3 + end, ind + 2 + end + end2), null
      )
      // alert(res[1].datatype.uri)
      res = res.concat(
        parseLiterals(str.slice(end + ind + 2 + end2))
      )
    } else {
      res[1] = kb.literal(str.slice(ind + 1, ind + 1 + end), '', null)
      $rdf.log.info('Literal found: ' + res[1])
      res = res.concat(parseLiterals(str.slice(end + ind + 2))) // finds any other literals
    }
    return res
  }

  function spaceDelimit (str) {
    str = str.replace(/\(/g, ' ( ')
      .replace(/\)/g, ' ) ')
      .replace(/</g, ' <')
      .replace(/>/g, '> ')
      .replace(/{/g, ' { ')
      .replace(/}/g, ' } ')
      .replace(/[\t\n\r]/g, ' ')
      .replace(/; /g, ' ; ')
      .replace(/\. /g, ' . ')
      .replace(/, /g, ' , ')
    $rdf.log.info('New str into spaceDelimit: \n' + str)
    var res = []
    var br = str.split(' ')
    for (var x in br) {
      if (isRealText(br[x])) {
        res = res.concat(br[x])
      }
    }
    return res
  }

  function replaceKeywords (input) {
    var strarr = input
    for (var x = 0; x < strarr.length; x++) {
      if (strarr[x] === 'a') {
        strarr[x] = '<http://www.w3.org/1999/02/22-rdf-syntax-ns#type>'
      }
      if (strarr[x] === 'is' && strarr[x + 2] === 'of') {
        strarr.splice(x, 1)
        strarr.splice(x + 1, 1)
        var s = strarr[x - 1]
        strarr[x - 1] = strarr[x + 1]
        strarr[x + 1] = s
      }
    }
    return strarr
  }

  function toTerms (input) {
    var res = []
    for (var x = 0; x < input.length; x++) {
      if (typeof input[x] !== 'string') {
        res[x] = input[x]
        continue
      }
      input[x] = fixSymbolBrackets(input[x])
      if (isVar(input[x])) {
        res[x] = makeVar(input[x].slice(1))
      } else if (isBnode(input[x])) {
        $rdf.log.info(input[x] + ' was identified as a bnode.')
        res[x] = kb.bnode()
      } else if (isSymbol(input[x])) {
        $rdf.log.info(input[x] + ' was identified as a symbol.')
        res[x] = kb.sym(removeBrackets(input[x]))
      } else if (isPrefixedSymbol(input[x])) {
        $rdf.log.info(input[x] + ' was identified as a prefixed symbol')
        if (prefixes[getPrefix(input[x])]) {
          res[x] = kb.sym(input[x] = prefixes[getPrefix(input[x])] +
            getSuffix(input[x]))
        } else {
          $rdf.log.error('SPARQL error: ' + input[x] + ' with prefix ' +
            getPrefix(input[x]) + ' does not have a correct prefix entry.')
          res[x] = input[x]
        }
      } else {
        res[x] = input[x]
      }
    }
    return res
  }

  function tokenize (str) {
    var token1 = parseLiterals(str)
    var token2 = []
    for (var x in token1) {
      if (typeof token1[x] === 'string') {
        token2 = token2.concat(spaceDelimit(token1[x]))
      } else {
        token2 = token2.concat(token1[x])
      }
    }
    token2 = replaceKeywords(token2)
    $rdf.log.info('SPARQL Tokens: ' + token2)
    return token2
  }

  // CASE-INSENSITIVE
  function arrayIndexOf (str, arr) {
    for (var i = 0; i < arr.length; i++) {
      if (typeof arr[i] !== 'string') {
        continue
      }
      if (arr[i].toLowerCase() === str.toLowerCase()) {
        return i
      }
    }
    // $rdf.log.warn("No instance of "+str+" in array "+arr)
    return null
  }

  // CASE-INSENSITIVE
  function arrayIndicesOf (str, arr) {
    var ind = []
    for (var i = 0; i < arr.length; i++) {
      if (typeof arr[i] !== 'string') {
        continue
      }
      if (arr[i].toLowerCase() === str.toLowerCase()) {
        ind.push(i)
      }
    }
    return ind
  }

  function setVars (input, query) {
    $rdf.log.info('SPARQL vars: ' + input)
    for (var x in input) {
      if (isVar(input[x])) {
        $rdf.log.info('Added ' + input[x] + ' to query variables from SPARQL')
        var v = makeVar(input[x].slice(1))
        query.vars.push(v)
        v.label = input[x].slice(1)
      } else {
        $rdf.log.warn('Incorrect SPARQL variable in SELECT: ' + input[x])
      }
    }
  }

  function getPrefixDeclarations (input) {
    var prefInd = arrayIndicesOf('PREFIX', input)
    var res = []
    for (var i in prefInd) {
      var a = input[prefInd[i] + 1]
      var b = input[prefInd[i] + 2]
      if (!isPrefix(a)) {
        $rdf.log.error('Invalid SPARQL prefix: ' + a)
      } else if (!isSymbol(b)) {
        $rdf.log.error('Invalid SPARQL symbol: ' + b)
      } else {
        $rdf.log.info('Prefix found: ' + a + ' -> ' + b)
        var pref = getPrefix(a)
        var symbol = removeBrackets(b)
        res[pref] = symbol
      }
    }
    return res
  }

  function getMatchingBracket (arr, open, close) {
    $rdf.log.info('Looking for a close bracket of type ' + close + ' in ' + arr)
    var index = 0
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] === open) {
        index++
      }
      if (arr[i] === close) {
        index--
      }
      if (index < 0) {
        return i
      }
    }
    $rdf.log.error('Statement had no close parenthesis in SPARQL query')
    return 0
  }

  function constraintGreaterThan (value) {
    this.describe = function (varstr) {
      return varstr + ' > ' + value.toNT()
    }
    this.test = function (term) {
      if (term.value.match(/[0-9]+(\.[0-9]+)?([eE][+-]?[0-9]+)?/)) {
        return (parseFloat(term.value) > parseFloat(value))
      } else {
        return (term.toNT() > value.toNT())
      }
    }
    return this
  }

  function constraintLessThan (value) { // this is not the recommended usage. Should only work on literal, numeric, dateTime
    this.describe = function (varstr) {
      return varstr + ' < ' + value.toNT()
    }
    this.test = function (term) {
      // this.describe = function (varstr) { return varstr + " < "+value }
      if (term.value.match(/[0-9]+(\.[0-9]+)?([eE][+-]?[0-9]+)?/)) {
        return (parseFloat(term.value) < parseFloat(value))
      } else {
        return (term.toNT() < value.toNT())
      }
    }
    return this
  }
  // This should only work on literals but doesn't.
  function constraintEqualTo (value) {
    this.describe = function (varstr) {
      return varstr + ' = ' + value.toNT()
    }
    this.test = function (term) {
      return value.sameTerm(term)
    }
    return this
  }

  // value must be a literal
  function constraintRegexp (value) {
    this.describe = function (varstr) {
      return "REGEXP( '" + value + "' , " + varstr + ' )'
    }
    this.test = function (term) {
      var str = value
      // str = str.replace(/^//,"").replace(//$/,"")
      var rg = new RegExp(str)
      if (term.value) {
        return rg.test(term.value)
      } else {
        return false
      }
    }
  }

  function setConstraint (input, pat) {
    if (input.length === 3 && input[0].termType === 'variable' &&
      (input[2].termType === 'symbol' || input[2].termType === 'literal')) {
      if (input[1] === '=') {
        $rdf.log.debug('Constraint added: ' + input)
        pat.constraints[input[0]] = new constraintEqualTo(input[2])
      } else if (input[1] === '>') {
        $rdf.log.debug('Constraint added: ' + input)
        pat.constraints[input[0]] = new constraintGreaterThan(input[2])
      } else if (input[1] === '<') {
        $rdf.log.debug('Constraint added: ' + input)
        pat.constraints[input[0]] = new constraintLessThan(input[2])
      } else {
        $rdf.log.warn("I don't know how to handle the constraint: " + input)
      }
    } else if (input.length === 6 && typeof input[0] === 'string' &&
      input[0].toLowerCase() === 'regexp' &&
      input[1] === '(' && input[5] === ')' && input[3] === ',' &&
      input[4].termType === 'variable' && input[2].termType === 'literal') {
      $rdf.log.debug('Constraint added: ' + input)
      pat.constraints[input[4]] = new constraintRegexp(input[2].value)
    }
  // $rdf.log.warn("I don't know how to handle the constraint: "+input)
  // alert("length: "+input.length+" input 0 type: "+input[0].termType+" input 1: "+input[1]+" input[2] type: "+input[2].termType)
  }

  function setOptional (terms, pat) {
    $rdf.log.debug('Optional query: ' + terms + ' not yet implemented.')
    var opt = kb.formula()
    setWhere(terms, opt)
    pat.optional.push(opt)
  }

  function setWhere (input, pat) {
    var terms = toTerms(input)
    var end
    $rdf.log.debug('WHERE: ' + terms)
    var opt
    // var opt = arrayIndicesOf("OPTIONAL",terms)
    while (arrayIndexOf('OPTIONAL', terms)) {
      opt = arrayIndexOf('OPTIONAL', terms)
      $rdf.log.debug('OPT: ' + opt + ' ' + terms[opt] + ' in ' + terms)
      if (terms[opt + 1] !== '{') {
        $rdf.log.warn('Bad optional opening bracket in word ' + opt)
      }
      end = getMatchingBracket(terms.slice(opt + 2), '{', '}')
      if (end === -1) {
        $rdf.log.error('No matching bracket in word ' + opt)
      } else {
        setOptional(terms.slice(opt + 2, opt + 2 + end), pat)
        // alert(pat.statements[0].toNT())
        opt = arrayIndexOf('OPTIONAL', terms)
        end = getMatchingBracket(terms.slice(opt + 2), '{', '}')
        terms.splice(opt, end + 3)
      }
    }
    $rdf.log.debug('WHERE after optionals: ' + terms)
    while (arrayIndexOf('FILTER', terms)) {
      var filt = arrayIndexOf('FILTER', terms)
      if (terms[filt + 1] !== '(') {
        $rdf.log.warn('Bad filter opening bracket in word ' + filt)
      }
      end = getMatchingBracket(terms.slice(filt + 2), '(', ')')
      if (end === -1) {
        $rdf.log.error('No matching bracket in word ' + filt)
      } else {
        setConstraint(terms.slice(filt + 2, filt + 2 + end), pat)
        filt = arrayIndexOf('FILTER', terms)
        end = getMatchingBracket(terms.slice(filt + 2), '(', ')')
        terms.splice(filt, end + 3)
      }
    }
    $rdf.log.debug('WHERE after filters and optionals: ' + terms)
    extractStatements(terms, pat)
  }

  function extractStatements (terms, formula) {
    var arrayZero = new Array(1)
    arrayZero[0] = -1 // this is just to add the beginning of the where to the periods index.
    var per = arrayZero.concat(arrayIndicesOf('.', terms))
    var stat = []
    for (var x = 0; x < per.length - 1; x++) {
      stat[x] = terms.slice(per[x] + 1, per[x + 1])
    }
    // Now it's in an array of statements
    for (x in stat) { // THIS MUST BE CHANGED FOR COMMA, SEMICOLON
      $rdf.log.info('s+p+o ' + x + ' = ' + stat[x])
      var subj = stat[x][0]
      stat[x].splice(0, 1)
      var sem = arrayZero.concat(arrayIndicesOf(';', stat[x]))
      sem.push(stat[x].length)
      var stat2 = []
      for (var y = 0; y < sem.length - 1; y++) {
        stat2[y] = stat[x].slice(sem[y] + 1, sem[y + 1])
      }
      for (x in stat2) {
        $rdf.log.info('p+o ' + x + ' = ' + stat[x])
        var pred = stat2[x][0]
        stat2[x].splice(0, 1)
        var com = arrayZero.concat(arrayIndicesOf(',', stat2[x]))
        com.push(stat2[x].length)
        var stat3 = []
        for (y = 0; y < com.length - 1; y++) {
          stat3[y] = stat2[x].slice(com[y] + 1, com[y + 1])
        }
        for (x in stat3) {
          var obj = stat3[x][0]
          $rdf.log.info('Subj=' + subj + ' Pred=' + pred + ' Obj=' + obj)
          formula.add(subj, pred, obj)
        }
      }
    }
  }

  // *******************************THE ACTUAL CODE***************************//
  $rdf.log.info('SPARQL input: \n' + SPARQL)
  var q = new $rdf.Query()
  var sp = tokenize(SPARQL) // first tokenize everything
  var prefixes = getPrefixDeclarations(sp)
  if (!prefixes.rdf) {
    prefixes.rdf = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'
  }
  if (!prefixes.rdfs) {
    prefixes.rdfs = 'http://www.w3.org/2000/01/rdf-schema#'
  }
  var selectLoc = arrayIndexOf('SELECT', sp)
  var whereLoc = arrayIndexOf('WHERE', sp)
  if (selectLoc < 0 || whereLoc < 0 || selectLoc > whereLoc) {
    $rdf.log.error('Invalid or nonexistent SELECT and WHERE tags in SPARQL query')
    return false
  }
  setVars(sp.slice(selectLoc + 1, whereLoc), q)

  setWhere(sp.slice(whereLoc + 2, sp.length - 1), q.pat)

  if (testMode) {
    return q
  }

  for (var x in q.pat.statements) {
    var st = q.pat.statements[x]
    if (st.subject.termType === 'symbol') {
      /* && sf.isPending(st.subject.uri) */ // This doesn't work.
      // sf.requestURI(st.subject.uri,"sparql:"+st.subject) Kenny: I remove these two
      if ($rdf.fetcher) {
        $rdf.fetcher.lookUpThing(st.subject, 'sparql:' + st.subject)
      }
    }
    if (st.object.termType === 'symbol') {
      /* && sf.isPending(st.object.uri) */
      // sf.requestURI(st.object.uri,"sparql:"+st.object)
      if ($rdf.fetcher) {
        $rdf.fetcher.lookUpThing(st.object, 'sparql:' + st.object)
      }
    }
  }
  // alert(q.pat)
  return q
// checkVars()
// *******************************************************************//
}

$rdf.SPARQLResultsInterpreter = function (xml, callback, doneCallback) {
  function isVar (term) {
    return (typeof term === 'string' && term.match(/^[\?\$]/))
  }
  function fixSymbolBrackets (term) {
    if (typeof term === 'string') {
      return term.replace(/^&lt;/, '<').replace(/&gt;$/, '>')
    } else {
      return term
    }
  }
  function isSymbol (term) {
    return (typeof term === 'string' && term.match(/^<[^>]*>$/))
  }
  function isBnode (term) {
    return (typeof term === 'string' &&
    (term.match(/^_:/) || term.match(/^$/)))
  }
  function isPrefix (term) {
    return (typeof term === 'string' && term.match(/:$/))
  }
  function isPrefixedSymbol (term) {
    return (typeof term === 'string' && term.match(/^:|^[^_][^:]*:/))
  }
  function getPrefix (term) {
    var a = term.split(':')
    return a[0]
  }
  function getSuffix (term) {
    var a = term.split(':')
    return a[1]
  }
  function removeBrackets (term) {
    if (isSymbol(term)) {
      return term.slice(1, term.length - 1)
    } else {
      return term
    }
  }
  function parsePrefix (attribute) {
    if (!attribute.name.match(/^xmlns/)) {
      return false
    }
    var pref = attribute.name.replace(/^xmlns/, '')
      .replace(/^:/, '').replace(/ /g, '')
    prefixes[pref] = attribute.value
    $rdf.log.info('Prefix: ' + pref + '\nValue: ' + attribute.value)
  }
  function handleP (str) { // reconstructs prefixed URIs
    var pref
    var suf
    if (isPrefixedSymbol(str)) {
      pref = getPrefix(str)
      suf = getSuffix(str)
    } else {
      pref = ''
      suf = str
    }
    if (prefixes[pref]) {
      return prefixes[pref] + suf
    } else {
      $rdf.log.error('Incorrect SPARQL results - bad prefix')
    }
  }
  function xmlMakeTerm (node) {
    // alert("xml Node name: "+node.nodeName+"\nxml Child value: "+node.childNodes[0].nodeValue)
    var val = node.childNodes[0]
    for (var x = 0; x < node.childNodes.length; x++) {
      if (node.childNodes[x].nodeType === 3) {
        val = node.childNodes[x]
        break
      }
    }
    if (handleP(node.nodeName) === spns + 'uri') {
      return kb.sym(val.nodeValue)
    } else if (handleP(node.nodeName) === spns + 'literal') {
      return kb.literal(val.nodeValue)
    } else if (handleP(node.nodeName) === spns + 'unbound') {
      return 'unbound'
    } else {
      $rdf.log.warn("Don't know how to handle xml binding term " + node)
    }
    return false
  }
  function handleResult (result) {
    var resultBindings = []
    var bound = false
    for (var x = 0; x < result.childNodes.length; x++) {
      // alert(result[x].nodeName)
      if (result.childNodes[x].nodeType !== 1) {
        continue
      }
      if (handleP(result.childNodes[x].nodeName) !== spns + 'binding') {
        $rdf.log.warn('Bad binding node inside result')
        continue
      }
      var bind = result.childNodes[x]
      var bindVar = makeVar(bind.getAttribute('name'))
      var binding = null
      for (var y = 0; y < bind.childNodes.length; y++) {
        if (bind.childNodes[y].nodeType === 1) {
          binding = xmlMakeTerm(bind.childNodes[y])
          break
        }
      }
      if (!binding) {
        $rdf.log.warn('Bad binding')
        return false
      }
      $rdf.log.info('var: ' + bindVar + ' binding: ' + binding)
      bound = true
      if (binding !== 'unbound') {
        resultBindings[bindVar] = binding
      }
    }
    // alert(callback)
    if (bound && callback) {
      setTimeout(function () {
        callback(resultBindings)
      }, 0)
    }
    bindingList.push(resultBindings)
    return
  }

  // ****MAIN CODE**********
  var prefixes = []
  var bindingList = []
  var head
  var results
  var sparql = xml.childNodes[0]
  var spns = 'http://www.w3.org/2005/sparql-results#'
  prefixes[''] = ''
  var x

  if (sparql.nodeName !== 'sparql') {
    $rdf.log.error('Bad SPARQL results XML')
    return
  }

  for (x = 0; x < sparql.attributes.length; x++) { // deals with all the prefixes beforehand
    parsePrefix(sparql.attributes[x])
  }
  // looks for the head and results childNodes
  for (x = 0; x < sparql.childNodes.length; x++) {
    $rdf.log.info('Type: ' + sparql.childNodes[x].nodeType +
      '\nName: ' + sparql.childNodes[x].nodeName + '\nValue: ' +
      sparql.childNodes[x].nodeValue
    )

    if (sparql.childNodes[x].nodeType === 1 &&
      handleP(sparql.childNodes[x].nodeName) === spns + 'head') {
      head = sparql.childNodes[x]
    } else if (sparql.childNodes[x].nodeType === 1 &&
      handleP(sparql.childNodes[x].nodeName) === spns + 'results') {
      results = sparql.childNodes[x]
    }
  }

  if (!results && !head) {
    $rdf.log.error('Bad SPARQL results XML')
    return
  }
  // @@does anything need to be done with these?
  // Should we check against query vars?
  for (x = 0; x < head.childNodes.length; x++) {
    if (head.childNodes[x].nodeType === 1 &&
      handleP(head.childNodes[x].nodeName) === spns + 'variable') {
      $rdf.log.info('Var: ' + head.childNodes[x].getAttribute('name'))
    }
  }

  for (x = 0; x < results.childNodes.length; x++) {
    if (handleP(results.childNodes[x].nodeName) === spns + 'result') {
      $rdf.log.info('Result # ' + x)
      handleResult(results.childNodes[x])
    }
  }
  if (doneCallback) {
    doneCallback()
  }
  return bindingList
// ****END OF MAIN CODE*****
}
// Joe Presbrey <presbrey@mit.edu>
// 2007-07-15
// 2010-08-08 TimBL folded in Kenny's WEBDAV
// 2010-12-07 TimBL addred local file write code

$rdf.UpdateManager = (function () {
  var sparql = function (store) {
    this.store = store
    if (store.updater){
      throw("You can't have two UpdateManagers for the same store")
    }
    store.updater = this
    this.ifps = {}
    this.fps = {}
    this.ns = {}
    this.ns.link = $rdf.Namespace('http://www.w3.org/2007/ont/link#')
    this.ns.http = $rdf.Namespace('http://www.w3.org/2007/ont/http#')
    this.ns.httph = $rdf.Namespace('http://www.w3.org/2007/ont/httph#')
    this.ns.ldp = $rdf.Namespace('http://www.w3.org/ns/ldp#')
    this.ns.rdf = $rdf.Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#')
    this.ns.rdfs = $rdf.Namespace('http://www.w3.org/2000/01/rdf-schema#')
    this.ns.rdf = $rdf.Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#')
    this.ns.owl = $rdf.Namespace('http://www.w3.org/2002/07/owl#')

    this.patchControl = [] // index of objects fro coordinating incomng and outgoing patches
  }

  sparql.prototype.patchControlFor = function (doc) {
    if (!this.patchControl[doc.uri]) {
      this.patchControl[doc.uri] = []
    }
    return this.patchControl[doc.uri]
  }

  // Returns The method string SPARQL or DAV or LOCALFILE or false if known, undefined if not known.
  //
  // Files have to have a specific annotaton that they are machine written, for safety.
  // We don't actually check for write access on files.
  //
  sparql.prototype.editable = function (uri, kb) {
    if (!uri) {
      return false // Eg subject is bnode, no known doc to write to
    }
    if (!kb) {
      kb = this.store
    }

    if (uri.slice(0, 8) === 'file:///') {
      if (kb.holds(kb.sym(uri), $rdf.sym('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        $rdf.sym('http://www.w3.org/2007/ont/link#MachineEditableDocument'))) {
        return 'LOCALFILE'
      }

      var sts = kb.statementsMatching(kb.sym(uri), undefined, undefined)

      console.log('sparql.editable: Not MachineEditableDocument file ' +
        uri + '\n')
      console.log(sts.map(function (x) {
        return x.toNT()
      }).join('\n'))
      return false
    // @@ Would be nifty of course to see whether we actually have write acess first.
    }

    var request
    var definitive = false
    var requests = kb.each(undefined, this.ns.link('requestedURI'), $rdf.uri.docpart(uri))

    // Hack for the moment @@@@ 2016-02-12
    if (kb.holds($rdf.sym(uri), this.ns.rdf('type'), this.ns.ldp('Resource'))) {
      return 'SPARQL'
    }
    var i
    var method
    for (var r = 0; r < requests.length; r++) {
      request = requests[r]
      if (request !== undefined) {
        var response = kb.any(request, this.ns.link('response'))
        if (request !== undefined) {
          var acceptPatch = kb.each(response, this.ns.httph('accept-patch'))
          if (acceptPatch.length) {
            for (i = 0; i < acceptPatch.length; i++) {
              method = acceptPatch[i].value.trim()
              if (method.indexOf('application/sparql-update') >= 0) return 'SPARQL'
            }
          }
          var author_via = kb.each(response, this.ns.httph('ms-author-via'))
          if (author_via.length) {
            for (i = 0; i < author_via.length; i++) {
              method = author_via[i].value.trim()
              if (method.indexOf('SPARQL') >= 0) {
                return 'SPARQL'
              }
              if (method.indexOf('DAV') >= 0) {
                return 'DAV'
              }
            }
          }
          var status = kb.each(response, this.ns.http('status'))
          if (status.length) {
            for (i = 0; i < status.length; i++) {
              if (status[i] === 200 || status[i] === 404) {
                definitive = true
              // return false // A definitive answer
              }
            }
          }
        } else {
          console.log('sparql.editable: No response for ' + uri + '\n')
        }
      }
    }
    if (requests.length === 0) {
      console.log('sparql.editable: No request for ' + uri + '\n')
    } else {
      if (definitive) {
        return false // We have got a request and it did NOT say editable => not editable
      }
    }
    console.log('sparql.editable: inconclusive for ' + uri + '\n')
    return undefined // We don't know (yet) as we haven't had a response (yet)
  }

  // /////////  The identification of bnodes

  sparql.prototype.anonymize = function (obj) {
    return (obj.toNT().substr(0, 2) === '_:' && this._mentioned(obj))
      ? '?' + obj.toNT().substr(2)
      : obj.toNT()
  }

  sparql.prototype.anonymizeNT = function (stmt) {
    return this.anonymize(stmt.subject) + ' ' +
    this.anonymize(stmt.predicate) + ' ' +
    this.anonymize(stmt.object) + ' .'
  }

  // A list of all bnodes occuring in a statement
  sparql.prototype._statement_bnodes = function (st) {
    return [st.subject, st.predicate, st.object].filter(function (x) {
      return x.isBlank
    })
  }

  // A list of all bnodes occuring in a list of statements
  sparql.prototype._statement_array_bnodes = function (sts) {
    var bnodes = []
    for (var i = 0; i < sts.length; i++) {
      bnodes = bnodes.concat(this._statement_bnodes(sts[i]))
    }
    bnodes.sort() // in place sort - result may have duplicates
    var bnodes2 = []
    for (var j = 0; j < bnodes.length; j++) {
      if (j === 0 || !bnodes[j].sameTerm(bnodes[j - 1])) {
        bnodes2.push(bnodes[j])
      }
    }
    return bnodes2
  }

  sparql.prototype._cache_ifps = function () {
    // Make a cached list of [Inverse-]Functional properties
    // Call this once before calling context_statements
    this.ifps = {}
    var a = this.store.each(undefined, this.ns.rdf('type'), this.ns.owl('InverseFunctionalProperty'))
    for (var i = 0; i < a.length; i++) {
      this.ifps[a[i].uri] = true
    }
    this.fps = {}
    a = this.store.each(undefined, this.ns.rdf('type'), this.ns.owl('FunctionalProperty'))
    for (i = 0; i < a.length; i++) {
      this.fps[a[i].uri] = true
    }
  }

  // Returns a context to bind a given node, up to a given depth
  sparql.prototype._bnode_context2 = function (x, source, depth) {
    // Return a list of statements which indirectly identify a node
    //  Depth > 1 if try further indirection.
    //  Return array of statements (possibly empty), or null if failure
    var sts = this.store.statementsMatching(undefined, undefined, x, source) // incoming links
    var y
    var res
    for (var i = 0; i < sts.length; i++) {
      if (this.fps[sts[i].predicate.uri]) {
        y = sts[i].subject
        if (!y.isBlank) {
          return [ sts[i] ]
        }
        if (depth) {
          res = this._bnode_context2(y, source, depth - 1)
          if (res) {
            return res.concat([ sts[i] ])
          }
        }
      }
    }
    // outgoing links
    sts = this.store.statementsMatching(x, undefined, undefined, source)
    for (i = 0; i < sts.length; i++) {
      if (this.ifps[sts[i].predicate.uri]) {
        y = sts[i].object
        if (!y.isBlank) {
          return [ sts[i] ]
        }
        if (depth) {
          res = this._bnode_context2(y, source, depth - 1)
          if (res) {
            return res.concat([ sts[i] ])
          }
        }
      }
    }
    return null // Failure
  }

  // Returns the smallest context to bind a given single bnode
  sparql.prototype._bnode_context_1 = function (x, source) {
    // Return a list of statements which indirectly identify a node
    //   Breadth-first
    for (var depth = 0; depth < 3; depth++) { // Try simple first
      var con = this._bnode_context2(x, source, depth)
      if (con !== null) return con
    }
    throw new Error('Unable to uniquely identify bnode: ' + x.toNT())
  }

  sparql.prototype._mentioned = function (x) {
    return (this.store.statementsMatching(x).length !== 0) || // Don't pin fresh bnodes
    (this.store.statementsMatching(undefined, x).length !== 0) ||
    (this.store.statementsMatching(undefined, undefined, x).length !== 0)
  }

  sparql.prototype._bnode_context = function (bnodes, doc) {
    var context = []
    if (bnodes.length) {
      this._cache_ifps()
      for (var i = 0; i < bnodes.length; i++) { // Does this occur in old graph?
        var bnode = bnodes[i]
        if (!this._mentioned(bnode)) continue
        context = context.concat(this._bnode_context_1(bnode, doc))
      }
    }
    return context
  }

  /*  Weird code does not make sense -- some code corruption along the line -- st undefined -- weird
      sparql.prototype._bnode_context = function(bnodes) {
          var context = []
          if (bnodes.length) {
              if (this.store.statementsMatching(st.subject.isBlank?undefined:st.subject,
                                        st.predicate.isBlank?undefined:st.predicate,
                                        st.object.isBlank?undefined:st.object,
                                        st.why).length <= 1) {
                  context = context.concat(st)
              } else {
                  this._cache_ifps()
                  for (x in bnodes) {
                      context = context.concat(this._bnode_context_1(bnodes[x], st.why))
                  }
              }
          }
          return context
      }
  */
  // Returns the best context for a single statement
  sparql.prototype._statement_context = function (st) {
    var bnodes = this._statement_bnodes(st)
    return this._bnode_context(bnodes, st.why)
  }

  sparql.prototype._context_where = function (context) {
    var sparql = this
    return (!context || context.length === 0)
      ? ''
      : 'WHERE { ' +
        context.map(function (x) {
          return sparql.anonymizeNT(x)
        }).join('\n') + ' }\n'
  }

  sparql.prototype._fire = function (uri, query, callback) {
    if (!uri) {
      throw new Error('No URI given for remote editing operation: ' + query)
    }
    console.log('sparql: sending update to <' + uri + '>')
    var xhr = $rdf.Util.XMLHTTPFactory()
    xhr.options = {}

    xhr.onreadystatechange = function () {
      // dump("SPARQL update ready state for <"+uri+"> readyState="+xhr.readyState+"\n"+query+"\n")
      if (xhr.readyState === 4) {
        var success = (!xhr.status || (xhr.status >= 200 && xhr.status < 300))
        if (!success) {
          console.log('sparql: update failed for <' + uri + '> status=' +
              xhr.status + ', ' + xhr.statusText + ', body length=' + xhr.responseText.length + '\n   for query: ' + query)
        } else {
          console.log('sparql: update Ok for <' + uri + '>')
        }
        callback(uri, success, xhr.responseText, xhr)
      }
    }

    xhr.open('PATCH', uri, true) // async=true
    xhr.setRequestHeader('Content-type', 'application/sparql-update')
    xhr.send(query)
  }

  // This does NOT update the statement.
  // It returns an object whcih includes
  //  function which can be used to change the object of the statement.
  //
  sparql.prototype.update_statement = function (statement) {
    if (statement && !statement.why) {
      return
    }
    var sparql = this
    var context = this._statement_context(statement)

    return {
      statement: statement ? [statement.subject, statement.predicate, statement.object, statement.why] : undefined,
      statementNT: statement ? this.anonymizeNT(statement) : undefined,
      where: sparql._context_where(context),

      set_object: function (obj, callback) {
        var query = this.where
        query += 'DELETE DATA { ' + this.statementNT + ' } ;\n'
        query += 'INSERT DATA { ' +
          this.anonymize(this.statement[0]) + ' ' +
          this.anonymize(this.statement[1]) + ' ' +
          this.anonymize(obj) + ' ' + ' . }\n'

        sparql._fire(this.statement[3].uri, query, callback)
      }
    }
  }

  sparql.prototype.insert_statement = function (st, callback) {
    var st0 = st instanceof Array ? st[0] : st
    var query = this._context_where(this._statement_context(st0))

    if (st instanceof Array) {
      var stText = ''
      for (var i = 0; i < st.length; i++) stText += st[i] + '\n'
      query += 'INSERT DATA { ' + stText + ' }\n'
    } else {
      query += 'INSERT DATA { ' +
        this.anonymize(st.subject) + ' ' +
        this.anonymize(st.predicate) + ' ' +
        this.anonymize(st.object) + ' ' + ' . }\n'
    }

    this._fire(st0.why.uri, query, callback)
  }

  sparql.prototype.delete_statement = function (st, callback) {
    var st0 = st instanceof Array ? st[0] : st
    var query = this._context_where(this._statement_context(st0))

    if (st instanceof Array) {
      var stText = ''
      for (var i = 0; i < st.length; i++) stText += st[i] + '\n'
      query += 'DELETE DATA { ' + stText + ' }\n'
    } else {
      query += 'DELETE DATA { ' +
        this.anonymize(st.subject) + ' ' +
        this.anonymize(st.predicate) + ' ' +
        this.anonymize(st.object) + ' ' + ' . }\n'
    }

    this._fire(st0.why.uri, query, callback)
  }

  //  Request a now or future action to refresh changes coming downstream
  //
  // This is designed to allow the system to re-request the server version,
  // when a websocket has pinged to say there are changes.
  // If thewebsocket, by contrast, has sent a patch, then this may not be necessary.

  sparql.prototype.requestDownstreamAction = function (doc, action) {
    var control = this.patchControlFor(doc)
    if (!control.pendingUpstream) {
      action(doc)
    } else {
      if (control.downstreamAction) {
        if (control.downstreamAction === action) {
          return this
        } else {
          throw new Error("Can't wait for > 1 differnt downstream actions")
        }
      } else {
        control.downstreamAction = action
      }
    }
  }

  // We want to start counting websockt notifications
  // to distinguish the ones from others from our own.
  sparql.prototype.clearUpstreamCount = function (doc) {
    var control = this.patchControlFor(doc)
    control.upstreamCount = 0
  }

  sparql.prototype.getUpdatesVia = function (doc) {
    var linkHeaders = this.store.fetcher.getHeader(doc, 'updates-via')
    if (!linkHeaders || !linkHeaders.length) return null
    return linkHeaders[0].trim()
  }

  sparql.prototype.addDownstreamChangeListener = function (doc, listener) {
    var control = this.patchControlFor(doc)
    if (!control.downstreamChangeListeners) control.downstreamChangeListeners = []
    control.downstreamChangeListeners.push(listener)
    this.setRefreshHandler(doc, this.reloadAndSync)
  }

  sparql.prototype.reloadAndSync = function (doc) {
    var control = this.patchControlFor(doc)

    if (control.reloading) {
      console.log('   Already reloading - stop')
      return // once only needed
    }
    control.reloading = true
    var retryTimeout = 1000 // ms
    var tryReload = function () {
      console.log('try reload - timeout = ' + retryTimeout)
      this.reload(this.store, doc, function (ok, message, xhr) {
        control.reloading = false
        if (ok) {
          if (control.downstreamChangeListeners) {
            for (var i = 0; i < control.downstreamChangeListeners.length; i++) {
              console.log('        Calling downstream listener ' + i)
              control.downstreamChangeListeners[i]()
            }
          }
        } else {
          if (xhr.status === 0) {
            console.log('Network error refreshing the data. Retrying in ' +
              retryTimeout / 1000)
            control.reloading = true
            retryTimeout = retryTimeout * 2
            setTimeout(tryReload, retryTimeout)
          } else {
            console.log('Error ' + xhr.status + 'refreshing the data:' +
              message + '. Stopped' + doc)
          }
        }
      })
    }
    tryReload()
  }

  // Set up websocket to listen on
  //
  // There is coordination between upstream changes and downstream ones
  // so that a reload is not done in the middle of an upsteeam patch.
  // If you usie this API then you get called when a change happens, and you
  // have to reload the file yourself, and then refresh the UI.
  // Alternative is addDownstreamChangeListener(), where you do not
  // have to do the reload yourslf. Do mot mix them.
  //
  //  kb contains the HTTP  metadata from prefvious operations
  //
  sparql.prototype.setRefreshHandler = function (doc, handler) {
    var wssURI = this.getUpdatesVia(doc) // relative
    var kb = this.store
    var theHandler = handler
    var self = this
    var updater = this
    var retryTimeout = 1500 // *2 will be 3 Seconds, 6, 12, etc
    var retries = 0

    if (!wssURI) {
      console.log('Server doies not support live updates thoughUpdates-Via :-(')
      return false
    }

    wssURI = $rdf.uri.join(wssURI, doc.uri)
    wssURI = wssURI.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:')
    console.log('Web socket URI ' + wssURI)

    var openWebsocket = function () {
      // From https://github.com/solid/solid-spec#live-updates
      var socket
      if (typeof WebSocket !== 'undefined') {
        socket = new WebSocket(wssURI)
      } else if (typeof Services !== 'undefined') { // Firefox add on http://stackoverflow.com/questions/24244886/is-websocket-supported-in-firefox-for-android-addons
        socket = (Services.wm.getMostRecentWindow('navigator:browser').WebSocket)(wssURI)
      } else if (typeof window !== 'undefined' && window.WebSocket) {
        socket = window.WebSocket(wssURI)
      } else {
        console.log('Live update disabled, as WebSocket not supported by platform :-(')
        return
      }
      socket.onopen = function () {
        console.log('    websocket open')
        retryTimeout = 1500 // reset timeout to fast on success
        this.send('sub ' + doc.uri)
        if (retries) {
          console.log('Web socket has been down, better check for any news.')
          updater.requestDownstreamAction(doc, theHandler)
        }
      }
      var control = self.patchControlFor(doc)
      control.upstreamCount = 0

      // https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
      //
      // 1000	CLOSE_NORMAL	Normal closure; the connection successfully completed whatever purpose for which it was created.
      // 1001	CLOSE_GOING_AWAY	The endpoint is going away, either
      //                                  because of a server failure or because the browser is navigating away from the page that opened the connection.
      // 1002	CLOSE_PROTOCOL_ERROR	The endpoint is terminating the connection due to a protocol error.
      // 1003	CLOSE_UNSUPPORTED	The connection is being terminated because the endpoint
      //                                  received data of a type it cannot accept (for example, a text-only endpoint received binary data).
      // 1004                             Reserved. A meaning might be defined in the future.
      // 1005	CLOSE_NO_STATUS	Reserved.  Indicates that no status code was provided even though one was expected.
      // 1006	CLOSE_ABNORMAL	Reserved. Used to indicate that a connection was closed abnormally (
      //
      //
      socket.onclose = function (event) {
        console.log('*** Websocket closed with code ' + event.code +
          ", reason '" + event.reason + "' clean = " + event.clean)
        retryTimeout *= 2
        retries += 1
        console.log('Retrying in ' + retryTimeout + 'ms') // (ask user?)
        setTimeout(function () {
          console.log('Trying websocket again')
          openWebsocket()
        }, retryTimeout)
      }
      socket.onmessage = function (msg) {
        if (msg.data && msg.data.slice(0, 3) === 'pub') {
          if (control.upstreamCount) {
            control.upstreamCount -= 1
            if (control.upstreamCount >= 0) {
              console.log('just an echo')
              return // Just an echo
            }
          }
          control.upstreamCount = 0
          console.log('Assume a real downstream change')
          self.requestDownstreamAction(doc, theHandler)
        }
      }
    } // openWebsocket
    openWebsocket()

    return true
  }

  // This high-level function updates the local store iff the web is changed successfully.
  //
  //  - deletions, insertions may be undefined or single statements or lists or formulae.
  //
  //  - callback is called as callback(uri, success, errorbody)
  //
  sparql.prototype.update = function (deletions, insertions, callback) {
    try {
      var kb = this.store
      var ds = !deletions ? []
        : deletions instanceof $rdf.IndexedFormula ? deletions.statements
          : deletions instanceof Array ? deletions : [ deletions ]
      var is = !insertions ? []
        : insertions instanceof $rdf.IndexedFormula ? insertions.statements
          : insertions instanceof Array ? insertions : [ insertions ]
      if (!(ds instanceof Array)) {
        throw new Error('Type Error ' + (typeof ds) + ': ' + ds)
      }
      if (!(is instanceof Array)) {
        throw new Error('Type Error ' + (typeof is) + ': ' + is)
      }
      if (ds.length === 0 && is.length === 0) {
        return callback(null, true) // success -- nothing needed to be done.
      }
      var doc = ds.length ? ds[0].why : is[0].why
      var control = this.patchControlFor(doc)
      var startTime = Date.now()

      var props = ['subject', 'predicate', 'object', 'why']
      var verbs = ['insert', 'delete']
      var clauses = { 'delete': ds, 'insert': is }
      verbs.map(function (verb) {
        clauses[verb].map(function (st) {
          if (!doc.sameTerm(st.why)) {
            throw new Error('update: destination ' + doc +
              ' inconsistent with delete quad ' + st.why)
          }
          props.map(function (prop) {
            if (typeof st[prop] === 'undefined') {
              throw new Error('update: undefined ' + prop + ' of statement.')
            }
          })
        })
      })

      var protocol = this.editable(doc.uri, kb)
      if (!protocol) {
        throw new Error("Can't make changes in uneditable " + doc)
      }
      var i
      var newSts
      var documentString
      var sz
      if (protocol.indexOf('SPARQL') >= 0) {
        var bnodes = []
        if (ds.length) bnodes = this._statement_array_bnodes(ds)
        if (is.length) bnodes = bnodes.concat(this._statement_array_bnodes(is))
        var context = this._bnode_context(bnodes, doc)
        var whereClause = this._context_where(context)
        var query = ''
        if (whereClause.length) { // Is there a WHERE clause?
          if (ds.length) {
            query += 'DELETE { '
            for (i = 0; i < ds.length; i++) {
              query += this.anonymizeNT(ds[i]) + '\n'
            }
            query += ' }\n'
          }
          if (is.length) {
            query += 'INSERT { '
            for (i = 0; i < is.length; i++) {
              query += this.anonymizeNT(is[i]) + '\n'
            }
            query += ' }\n'
          }
          query += whereClause
        } else { // no where clause
          if (ds.length) {
            query += 'DELETE DATA { '
            for (i = 0; i < ds.length; i++) {
              query += this.anonymizeNT(ds[i]) + '\n'
            }
            query += ' } \n'
          }
          if (is.length) {
            if (ds.length) query += ' ; '
            query += 'INSERT DATA { '
            for (i = 0; i < is.length; i++) {
              query += this.anonymizeNT(is[i]) + '\n'
            }
            query += ' }\n'
          }
        }
        // Track pending upstream patches until they have fnished their callback
        control.pendingUpstream = control.pendingUpstream ? control.pendingUpstream + 1 : 1
        if (typeof control.upstreamCount !== 'undefined') {
          control.upstreamCount += 1 // count changes we originated ourselves
        }

        this._fire(doc.uri, query,
          function (uri, success, body, xhr) {
            xhr.elapsedTime_ms = Date.now() - startTime
            console.log('    sparql: Return ' + (success ? 'success' : 'FAILURE ' + xhr.status) +
              ' elapsed ' + xhr.elapsedTime_ms + 'ms')
            if (success) {
              try {
                kb.remove(ds)
              } catch (e) {
                success = false
                body = 'Remote Ok BUT error deleting ' + ds.length + ' from store!!! ' + e
              } // Add in any case -- help recover from weirdness??
              for (var i = 0; i < is.length; i++) {
                kb.add(is[i].subject, is[i].predicate, is[i].object, doc)
              }
            }

            callback(uri, success, body, xhr)
            control.pendingUpstream -= 1
            // When upstream patches have been sent, reload state if downstream waiting
            if (control.pendingUpstream === 0 && control.downstreamAction) {
              var downstreamAction = control.downstreamAction
              delete control.downstreamAction
              console.log('delayed downstream action:')
              downstreamAction(doc)
            }
          })
      } else if (protocol.indexOf('DAV') >= 0) {
        // The code below is derived from Kenny's UpdateCenter.js
        documentString
        var request = kb.any(doc, this.ns.link('request'))
        if (!request) {
          throw new Error('No record of our HTTP GET request for document: ' +
            doc)
        } // should not happen
        var response = kb.any(request, this.ns.link('response'))
        if (!response) {
          return null // throw "No record HTTP GET response for document: "+doc
        }
        var content_type = kb.the(response, this.ns.httph('content-type')).value

        // prepare contents of revised document
        newSts = kb.statementsMatching(undefined, undefined, undefined, doc).slice() // copy!
        for (i = 0; i < ds.length; i++) {
          $rdf.Util.RDFArrayRemove(newSts, ds[i])
        }
        for (i = 0; i < is.length; i++) {
          newSts.push(is[i])
        }

        // serialize to te appropriate format
        sz = $rdf.Serializer(kb)
        sz.suggestNamespaces(kb.namespaces)
        sz.setBase(doc.uri) // ?? beware of this - kenny (why? tim)
        switch (content_type) {
          case 'application/rdf+xml':
            documentString = sz.statementsToXML(newSts)
            break
          case 'text/n3':
          case 'text/turtle':
          case 'application/x-turtle': // Legacy
          case 'application/n3': // Legacy
            documentString = sz.statementsToN3(newSts)
            break
          default:
            throw new Error('Content-type ' + content_type + ' not supported for data write')
        }

        // Write the new version back

        var candidateTarget = kb.the(response, this.ns.httph('content-location'))
        var targetURI
        if (candidateTarget) {
          targetURI = $rdf.uri.join(candidateTarget.value, targetURI)
        }
        var xhr = $rdf.Util.XMLHTTPFactory()
        xhr.options = {}
        xhr.onreadystatechange = function () {
          if (xhr.readyState === 4) {
            // formula from sparqlUpdate.js, what about redirects?
            var success = (!xhr.status || (xhr.status >= 200 && xhr.status < 300))
            if (success) {
              for (var i = 0; i < ds.length; i++) {
                kb.remove(ds[i])
              }
              for (i = 0; i < is.length; i++) {
                kb.add(is[i].subject, is[i].predicate, is[i].object, doc)
              }
            }
            callback(doc.uri, success, xhr.responseText)
          }
        }
        xhr.open('PUT', targetURI, true)
        // assume the server does PUT content-negotiation.
        xhr.setRequestHeader('Content-type', content_type) // OK?
        xhr.send(documentString)
      } else {
        if (protocol.indexOf('LOCALFILE') >= 0) {
          try {
            console.log('Writing back to local file\n')
            // See http://simon-jung.blogspot.com/2007/10/firefox-extension-file-io.html
            // prepare contents of revised document
            newSts = kb.statementsMatching(undefined, undefined, undefined, doc).slice() // copy!
            for (i = 0; i < ds.length; i++) {
              $rdf.Util.RDFArrayRemove(newSts, ds[i])
            }
            for (i = 0; i < is.length; i++) {
              newSts.push(is[i])
            }
            // serialize to the appropriate format
            documentString
            sz = $rdf.Serializer(kb)
            sz.suggestNamespaces(kb.namespaces)
            sz.setBase(doc.uri) // ?? beware of this - kenny (why? tim)
            var dot = doc.uri.lastIndexOf('.')
            if (dot < 1) {
              throw new Error('Rewriting file: No filename extension: ' + doc.uri)
            }
            var ext = doc.uri.slice(dot + 1)
            switch (ext) {
              case 'rdf':
              case 'owl': // Just my experence   ...@@ we should keep the format in which it was parsed
              case 'xml':
                documentString = sz.statementsToXML(newSts)
                break
              case 'n3':
              case 'nt':
              case 'ttl':
                documentString = sz.statementsToN3(newSts)
                break
              default:
                throw new Error('File extension .' + ext + ' not supported for data write')
            }
            // Write the new version back
            // create component for file writing
            console.log('Writing back: <<<' + documentString + '>>>')
            var filename = doc.uri.slice(7) // chop off   file://  leaving /path
            // console.log("Writeback: Filename: "+filename+"\n")
            var file = Components.classes['@mozilla.org/file/local;1']
              .createInstance(Components.interfaces.nsILocalFile)
            file.initWithPath(filename)
            if (!file.exists()) {
              throw new Error('Rewriting file <' + doc.uri +
                '> but it does not exist!')
            }
            // {
            // file.create( Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 420)
            // }
            // create file output stream and use write/create/truncate mode
            // 0x02 writing, 0x08 create file, 0x20 truncate length if exist
            var stream = Components.classes['@mozilla.org/network/file-output-stream;1']
              .createInstance(Components.interfaces.nsIFileOutputStream)

            // Various JS systems object to 0666 in struct mode as dangerous
            stream.init(file, 0x02 | 0x08 | 0x20, parseInt('0666', 8), 0)

            // write data to file then close output stream
            stream.write(documentString, documentString.length)
            stream.close()

            for (i = 0; i < ds.length; i++) {
              kb.remove(ds[i])
            }
            for (i = 0; i < is.length; i++) {
              kb.add(is[i].subject, is[i].predicate, is[i].object, doc)
            }
            callback(doc.uri, true, '') // success!
          } catch (e) {
            callback(doc.uri, false,
              'Exception trying to write back file <' + doc.uri + '>\n'
              // + tabulator.Util.stackString(e))
            )
          }
        } else {
          throw new Error("Unhandled edit method: '" + protocol + "' for " + doc)
        }
      }
    } catch (e) {
      callback(undefined, false, 'Exception in update: ' + e)
    }
  } // wnd update

  // This suitable for an inital creation of a document
  //
  // data:    string, or array of statements
  //
  sparql.prototype.put = function (doc, data, content_type, callback) {
    var documentString
    var kb = this.store

    if (typeof data === typeof '') {
      documentString = data
    } else {
      // serialize to te appropriate format
      var sz = $rdf.Serializer(kb)
      sz.suggestNamespaces(kb.namespaces)
      sz.setBase(doc.uri)
      switch (content_type) {
        case 'application/rdf+xml':
          documentString = sz.statementsToXML(data)
          break
        case 'text/n3':
        case 'text/turtle':
        case 'application/x-turtle': // Legacy
        case 'application/n3': // Legacy
          documentString = sz.statementsToN3(data)
          break
        default:
          throw new Error('Content-type ' + content_type +
            ' not supported for data PUT')
      }
    }
    var xhr = $rdf.Util.XMLHTTPFactory()
    xhr.options = {}
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        // formula from sparqlUpdate.js, what about redirects?
        var success = (!xhr.status || (xhr.status >= 200 && xhr.status < 300))
        if (success && typeof data !== 'string') {
          data.map(function (st) {
            kb.addStatement(st)
          })
        // kb.fetcher.requested[doc.uri] = true // as though fetched
        }
        if (success) {
          delete kb.fetcher.nonexistant[doc.uri]
          delete kb.fetcher.requested[doc.uri]
        // @@ later we can fake it has been requestd if put gives us the header sand we save them.
        }
        callback(doc.uri, success, xhr.responseText, xhr)
      }
    }
    xhr.open('PUT', doc.uri, true)
    xhr.setRequestHeader('Content-type', content_type)
    xhr.send(documentString)
  }

  // Reload a document.
  //
  // Fast and cheap, no metaata
  // Measure times for the document
  // Load it provisionally
  // Don't delete the statemenst before the load, or it will leave a broken document
  // in the meantime.

  sparql.prototype.reload = function (kb, doc, callback) {
    var startTime = Date.now()
    // force sets no-cache and
    kb.fetcher.nowOrWhenFetched(doc.uri, {force: true, noMeta: true, clearPreviousData: true}, function (ok, body, xhr) {
      if (!ok) {
        console.log('    ERROR reloading data: ' + body)
        callback(false, 'Error reloading data: ' + body, xhr)
      } else if (xhr.onErrorWasCalled || xhr.status !== 200) {
        console.log('    Non-HTTP error reloading data! onErrorWasCalled=' +
          xhr.onErrorWasCalled + ' status: ' + xhr.status)
        callback(false, 'Non-HTTP error reloading data: ' + body, xhr)
      } else {
        var elapsedTime_ms = Date.now() - startTime
        if (!doc.reloadTime_total) doc.reloadTime_total = 0
        if (!doc.reloadTime_count) doc.reloadTime_count = 0
        doc.reloadTime_total += elapsedTime_ms
        doc.reloadTime_count += 1
        console.log('    Fetch took ' + elapsedTime_ms + 'ms, av. of ' +
          doc.reloadTime_count + ' = ' +
          (doc.reloadTime_total / doc.reloadTime_count) + 'ms.')
        callback(true)
      }
    })
  }

  sparql.prototype.oldReload = function (kb, doc, callback) {
    var g2 = $rdf.graph() // A separate store to hold the data as we load it
    var f2 = $rdf.fetcher(g2)
    var startTime = Date.now()
    // force sets no-cache and
    f2.nowOrWhenFetched(doc.uri, {force: true, noMeta: true, clearPreviousData: true}, function (ok, body, xhr) {
      if (!ok) {
        console.log('    ERROR reloading data: ' + body)
        callback(false, 'Error reloading data: ' + body, xhr)
      } else if (xhr.onErrorWasCalled || xhr.status !== 200) {
        console.log('    Non-HTTP error reloading data! onErrorWasCalled=' +
          xhr.onErrorWasCalled + ' status: ' + xhr.status)
        callback(false, 'Non-HTTP error reloading data: ' + body, xhr)
      } else {
        var sts1 = kb.statementsMatching(undefined, undefined, undefined, doc).slice() // Take a copy!!
        var sts2 = g2.statementsMatching(undefined, undefined, undefined, doc).slice()
        console.log('    replacing ' + sts1.length + ' with ' + sts2.length +
          ' out of total statements ' + kb.statements.length)
        kb.remove(sts1)
        kb.add(sts2)
        var elapsedTime_ms = Date.now() - startTime
        if (sts2.length === 0) {
          console.log('????????????????? 0000000')
        }
        if (!doc.reloadTime_total) doc.reloadTime_total = 0
        if (!doc.reloadTime_count) doc.reloadTime_count = 0
        doc.reloadTime_total += elapsedTime_ms
        doc.reloadTime_count += 1
        console.log('    fetch took ' + elapsedTime_ms + 'ms, av. of ' + doc.reloadTime_count + ' = ' +
          (doc.reloadTime_total / doc.reloadTime_count) + 'ms.')
        callback(true)
      }
    })
  }
  return sparql
})()
$rdf.jsonParser = (function () {
  return {
    parseJSON: function (data, source, store) {
      var subject, predicate, object
      var bnodes = {}
      var why = store.sym(source)
      for (var x in data) {
        if (x.indexOf('_:') === 0) {
          if (bnodes[x]) {
            subject = bnodes[x]
          } else {
            subject = store.bnode(x)
            bnodes[x] = subject
          }
        } else {
          subject = store.sym(x)
        }
        var preds = data[x]
        for (var y in preds) {
          var objects = preds[y]
          predicate = store.sym(y)
          for (var z in objects) {
            var obj = objects[z]
            if (obj.type === 'uri') {
              object = store.sym(obj.value)
              store.add(subject, predicate, object, why)
            } else if (obj.type === 'bnode') {
              if (bnodes[obj.value]) {
                object = bnodes[obj.value]
              } else {
                object = store.bnode(obj.value)
                bnodes[obj.value] = object
              }
              store.add(subject, predicate, object, why)
            } else if (obj.type === 'literal') {
              var datatype
              if (obj.datatype) {
                object = store.literal(obj.value, undefined, store.sym(obj.datatype))
              } else if (obj.lang) {
                object = store.literal(obj.value, obj.lang)
              } else {
                object = store.literal(obj.value)
              }
              store.add(subject, predicate, object, why)
            } else {
              throw new Error('error: unexpected termtype: ' + z.type)
            }
          }
        }
      }
    }
  }
})()
/*      Serialization of RDF Graphs
**
** Tim Berners-Lee 2006
** This is or was http://dig.csail.mit.edu/2005/ajar/ajaw/js/rdf/serialize.js
**
** Bug: can't serialize  http://data.semanticweb.org/person/abraham-bernstein/rdf
** in XML (from mhausenblas)
*/

// @@@ Check the whole toStr thing tosee whetehr it still makes sense -- tbl
//
$rdf.Serializer = function() {

var __Serializer = function( store ){
    this.flags = "";
    this.base = null;

    this.prefixes = [];    // suggested prefixes
    this.namespaces = []; // complementary indexes

    this.suggestPrefix('rdf', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'); // XML code assumes this!
    this.suggestPrefix('xml', 'reserved:reservedForFutureUse'); // XML reserves xml: in the spec.

    this.namespacesUsed = []; // Count actually used and so needed in @prefixes
    this.keywords = ['a']; // The only one we generate at the moment
    this.prefixchars = "abcdefghijklmnopqustuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    this.incoming = null;  // Array not calculated yet
    this.formulas = [];  // remebering original formulae from hashes
    this.store = store;

    /* pass */
}

__Serializer.prototype.setBase = function(base)
    { this.base = base };

__Serializer.prototype.setFlags = function(flags)
    { this.flags = flags?flags: '' };


__Serializer.prototype.toStr = function(x) {
    var s = x.toNT();
    if (x.termType == 'formula') {
        this.formulas[s] = x; // remember as reverse does not work
    }
    return s;
};

__Serializer.prototype.fromStr = function(s) {
    if (s[0] == '{') {
        var x = this.formulas[s];
        if (!x) alert('No formula object for '+s)
        return x;
    }
    return this.store.fromNT(s);
};





/* Accumulate Namespaces
**
** These are only hints.  If two overlap, only one gets used
** There is therefore no guarantee in general.
*/

__Serializer.prototype.suggestPrefix = function(prefix, uri) {
    if (prefix.slice(0,7) === 'default') return; // Try to weed these out
    if (prefix.slice(0,2) === 'ns') return; //  From others inferior algos
    if (!prefix || !uri) return; // empty strings not suitable
    if (prefix in this.namespaces || uri in this.prefixes) return; // already used
    this.prefixes[uri] = prefix;
    this.namespaces[prefix] = uri;
}

// Takes a namespace -> prefix map
__Serializer.prototype.suggestNamespaces = function(namespaces) {
    for (var px in namespaces) {
        this.suggestPrefix(px, namespaces[px]);
    }
}

__Serializer.prototype.checkIntegrity = function() {
    var p, ns;
    for (p in this.namespaces) {
        if (this.prefixes[this.namespaces[p]] !== p) {
            throw "Serializer integity error 1: " + p + ", " +
                this.namespaces[p] + ", "+ this.prefixes[this.namespaces[p]] +"!";
        }
    }
    for (ns in this.prefixes) {
        if (this.namespaces[this.prefixes[ns]] !== ns) {
            throw "Serializer integity error 2: " + ns + ", " +
                this.prefixs[ns] + ", "+ this.namespaces[this.prefixes[ns]] +"!";

        }
    }
}

// Make up an unused prefix for a random namespace
__Serializer.prototype.makeUpPrefix = function(uri) {
    var p = uri;
    var pok;
    function canUse(pp) {
        if (! __Serializer.prototype.validPrefix.test(pp)) return false; // bad format
        if (pp === 'ns') return false; // boring
        if (pp in this.namespaces) return false; // already used
        this.prefixes[uri] = pp;
        this.namespaces[pp] = uri;
        pok = pp;
        return true
    }
    canUse = canUse.bind(this);
/*    for (var ns in this.prefixes) {
        namespaces[this.prefixes[ns]] = ns; // reverse index foo
    }
    */
    if ('#/'.indexOf(p[p.length-1]) >= 0) p = p.slice(0, -1);
    var slash = p.lastIndexOf('/');
    if (slash >= 0) p = p.slice(slash+1);
    var i = 0;
    while (i < p.length)
        if (this.prefixchars.indexOf(p[i])) i++; else break;
    p = p.slice(0,i);
    if (p.length < 6 && canUse(p)) return pok; // exact i sbest
    if (canUse(p.slice(0,3))) return pok;
    if (canUse(p.slice(0,2))) return pok;
    if (canUse(p.slice(0,4))) return pok;
    if (canUse(p.slice(0,1))) return pok;
    if (canUse(p.slice(0,5))) return pok;
    if (! __Serializer.prototype.validPrefix.test(p)) {
        p = 'n';  // Otherwise the loop below may never termimnate
    }
    for (var i=0;; i++) if (canUse(p.slice(0,3)+i)) return pok;
}



// Todo:
//  - Sort the statements by subject, pred, object
//  - do stuff about the docu first and then (or first) about its primary topic.

__Serializer.prototype.rootSubjects = function(sts) {
    var incoming = {};
    var subjects = {};
    var allBnodes = {};

/* This scan is to find out which nodes will have to be the roots of trees
** in the serialized form. This will be any symbols, and any bnodes
** which hve more or less than one incoming arc, and any bnodes which have
** one incoming arc but it is an uninterrupted loop of such nodes back to itself.
** This should be kept linear time with repect to the number of statements.
** Note it does not use any indexing of the store.
*/


    // $rdf.log.debug('serialize.js Find bnodes with only one incoming arc\n')
    for (var i = 0; i<sts.length; i++) {
        var st = sts[i];
        [ st.subject, st.predicate, st.object].map(function(y){
            if (y.termType =='bnode'){allBnodes[y.toNT()] = true}});
        var x = sts[i].object;
        if (!incoming.hasOwnProperty(x)) incoming[x] = [];
        incoming[x].push(st.subject) // List of things which will cause this to be printed
        var ss =  subjects[this.toStr(st.subject)]; // Statements with this as subject
        if (!ss) ss = [];
        ss.push(st);
        subjects[this.toStr(st.subject)] = ss; // Make hash. @@ too slow for formula?
        // $rdf.log.debug(' sz potential subject: '+sts[i].subject)
    }

    var roots = [];
    for (var xNT in subjects) {
        if (!subjects.hasOwnProperty(xNT)) continue;
        var x = this.fromStr(xNT);
        if ((x.termType != 'bnode') || !incoming[x] || (incoming[x].length != 1)){
            roots.push(x);
            //$rdf.log.debug(' sz actual subject -: ' + x)
            continue;
        }
    }
    this.incoming = incoming; // Keep for serializing @@ Bug for nested formulas

//////////// New bit for CONNECTED bnode loops:frootshash

// This scans to see whether the serialization is gpoing to lead to a bnode loop
// and at the same time accumulates a list of all bnodes mentioned.
// This is in fact a cut down N3 serialization
/*
    // $rdf.log.debug('serialize.js Looking for connected bnode loops\n')
    for (var i=0; i<sts.length; i++) { // @@TBL
        // dump('\t'+sts[i]+'\n');
    }
    var doneBnodesNT = {};
    function dummyPropertyTree(subject, subjects, rootsHash) {
        // dump('dummyPropertyTree('+subject+'...)\n');
        var sts = subjects[sz.toStr(subject)]; // relevant statements
        for (var i=0; i<sts.length; i++) {
            dummyObjectTree(sts[i].object, subjects, rootsHash);
        }
    }

    // Convert a set of statements into a nested tree of lists and strings
    // @param force,    "we know this is a root, do it anyway. It isn't a loop."
    function dummyObjectTree(obj, subjects, rootsHash, force) {
        // dump('dummyObjectTree('+obj+'...)\n');
        if (obj.termType == 'bnode' && (subjects[sz.toStr(obj)]  &&
            (force || (rootsHash[obj.toNT()] == undefined )))) {// and there are statements
            if (doneBnodesNT[obj.toNT()]) { // Ah-ha! a loop
                throw "Serializer: Should be no loops "+obj;
            }
            doneBnodesNT[obj.toNT()] = true;
            return  dummyPropertyTree(obj, subjects, rootsHash);
        }
        return dummyTermToN3(obj, subjects, rootsHash);
    }

    // Scan for bnodes nested inside lists too
    function dummyTermToN3(expr, subjects, rootsHash) {
        if (expr.termType == 'bnode') doneBnodesNT[expr.toNT()] = true;
        // $rdf.log.debug('serialize: seen '+expr);
        if (expr.termType == 'collection') {
            for (i=0; i<expr.elements.length; i++) {
                if (expr.elements[i].termType == 'bnode')
                    dummyObjectTree(expr.elements[i], subjects, rootsHash);
            }
        return;
        }
    }

    // The tree for a subject
    function dummySubjectTree(subject, subjects, rootsHash) {
        // dump('dummySubjectTree('+subject+'...)\n');
        if (subject.termType == 'bnode' && !incoming[subject])
            return dummyObjectTree(subject, subjects, rootsHash, true); // Anonymous bnode subject
        dummyTermToN3(subject, subjects, rootsHash);
        dummyPropertyTree(subject, subjects, rootsHash);
    }
*/
    // Now do the scan using existing roots
    // $rdf.log.debug('serialize.js Dummy serialize to check for missing nodes')
    var rootsHash = {};
    for (var i = 0; i< roots.length; i++) rootsHash[roots[i].toNT()] = true;
/*
    for (var i=0; i<roots.length; i++) {
        var root = roots[i];
        dummySubjectTree(root, subjects, rootsHash);
    }
    // dump('Looking for mising bnodes...\n')

// Now in new roots for anythig not acccounted for
// Now we check for any bndoes which have not been covered.
// Such bnodes must be in isolated rings of pure bnodes.
// They each have incoming link of 1.

    // $rdf.log.debug('serialize.js Looking for connected bnode loops\n')
    for (;;) {
        var bnt;
        var found = null;
        for (bnt in allBnodes) { // @@ Note: not repeatable. No canonicalisation
            if (doneBnodesNT[bnt]) continue;
            found = bnt; // Ah-ha! not covered
            break;
        }
        if (found == null) break; // All done - no bnodes left out/
        // dump('Found isolated bnode:'+found+'\n');
        doneBnodesNT[bnt] = true;
        var root = this.store.fromNT(found);
        roots.push(root); // Add a new root
        rootsHash[found] = true;
        // $rdf.log.debug('isolated bnode:'+found+', subjects[found]:'+subjects[found]+'\n');
        if (subjects[found] == undefined) {
            for (var i=0; i<sts.length; i++) {
                // dump('\t'+sts[i]+'\n');
            }
            throw "Isolated node should be a subject" +found;
        }
        dummySubjectTree(root, subjects, rootsHash); // trace out the ring
    }
    // dump('Done bnode adjustments.\n')
*/
    return {'roots':roots, 'subjects':subjects,
                'rootsHash': rootsHash, 'incoming': incoming};
}

////////////////////////////////////////////////////////

__Serializer.prototype.toN3 = function(f) {
    return this.statementsToN3(f.statements);
}

__Serializer.prototype._notQNameChars = "\t\r\n !\"#$%&'()*.,+/;<=>?@[\\]^`{|}~";
__Serializer.prototype._notNameChars =
                    ( __Serializer.prototype._notQNameChars + ":" ) ;


__Serializer.prototype.statementsToN3 = function(sts) {
    var indent = 4;
    var width = 80;

    var predMap = {
        'http://www.w3.org/2002/07/owl#sameAs': '=',
        'http://www.w3.org/2000/10/swap/log#implies': '=>',
        'http://www.w3.org/1999/02/22-rdf-syntax-ns#type': 'a'
    }




    ////////////////////////// Arrange the bits of text

    var spaces=function(n) {
        var s='';
        for(var i=0; i<n; i++) s+=' ';
        return s
    }

    var treeToLine = function(tree) {
        var str = '';
        for (var i=0; i<tree.length; i++) {
            var branch = tree[i];
            var s2 = (typeof branch == 'string') ? branch : treeToLine(branch);
             // Note the space before the dot in case statement ends 123. which is in fact allowed but be conservative.
            if (i!=0 && s2 != ',' && s2 != ';') str += ' '; // was also:  && s2 != '.'
            str += s2;
        }
        return str;
    }

    // Convert a nested tree of lists and strings to a string
    var treeToString = function(tree, level) {
        var str = '';
        var lastLength = 100000;
        if (!level) level = 0;
        for (var i=0; i<tree.length; i++) {
            var branch = tree[i];
            if (typeof branch != 'string') {
                var substr = treeToString(branch, level +1);
                if (
                    substr.length < 10*(width-indent*level)
                    && substr.indexOf('"""') < 0) {// Don't mess up multiline strings
                    var line = treeToLine(branch);
                    if (line.length < (width-indent*level)) {
                        branch = '   '+line; //   @@ Hack: treat as string below
                        substr = ''
                    }
                }
                if (substr) lastLength = 10000;
                str += substr;
            }
            if (typeof branch == 'string') {
                if (branch.length == '1' && str.slice(-1) == '\n') {
                    if (",.;".indexOf(branch) >=0) {
                        str = str.slice(0,-1) + branch + '\n'; //  slip punct'n on end
                        lastLength += 1;
                        continue;
                    } else if ("])}".indexOf(branch) >=0) {
                        str = str.slice(0,-1) + ' ' + branch + '\n';
                        lastLength += 2;
                        continue;
                    }
                }
                if (lastLength < (indent*level+4)) { // continue
                    str = str.slice(0,-1) + ' ' + branch + '\n';
                    lastLength += branch.length + 1;
                } else {
                    var line = spaces(indent*level) +branch;
                    str += line +'\n';
                    lastLength = line.length;
                }

            } else { // not string
            }
        }
        return str;
    };

    ////////////////////////////////////////////// Structure for N3


    // Convert a set of statements into a nested tree of lists and strings
    function statementListToTree(statements) {
        // print('Statement tree for '+statements.length);
        var res = [];
        var stats = this.rootSubjects(statements);
        var roots = stats.roots;
        var results = []
        for (var i=0; i<roots.length; i++) {
            var root = roots[i];
            results.push(subjectTree(root, stats))
        }
        return results;
    }
    statementListToTree = statementListToTree.bind(this);

    // The tree for a subject
    function subjectTree(subject, stats) {
        if (subject.termType == 'bnode' && !stats.incoming[subject])
            return objectTree(subject, stats, true).concat(['.']); // Anonymous bnode subject
        return [ termToN3(subject, stats) ].concat([propertyTree(subject, stats)]).concat(['.']);
    }


    // The property tree for a single subject or anonymous node
    function propertyTree(subject, stats) {
        // print('Proprty tree for '+subject);
        var results = []
        var lastPred = null;
        var sts = stats.subjects[this.toStr(subject)]; // relevant statements
        if (typeof sts == 'undefined') {
            throw('Cant find statements for '+subject);
        }

        var SPO = function(x, y) {
            return $rdf.Util.heavyCompareSPO(x, y, this.store)
        }
        sts.sort(); // 2014-09-30
//        sts.sort(SPO); // 2014-09-30
        var objects = [];
        for (var i=0; i<sts.length; i++) {
            var st = sts[i];
            if (st.predicate.uri == lastPred) {
                objects.push(',');
            } else {
                if (lastPred) {
                    results=results.concat([objects]).concat([';']);
                    objects = [];
                }
                results.push(predMap[st.predicate.uri] ?
                            predMap[st.predicate.uri] : termToN3(st.predicate, stats));
            }
            lastPred = st.predicate.uri;
            objects.push(objectTree(st.object, stats));
        }
        results=results.concat([objects]);
        return results;
    }
    propertyTree = propertyTree.bind(this);

    function objectTree(obj, stats, force) {
        if (obj.termType == 'bnode' &&
                stats.subjects[this.toStr(obj)] && // and there are statements
                (force || stats.rootsHash[obj.toNT()] == undefined)) // and not a root
            return  ['['].concat(propertyTree(obj, stats)).concat([']']);
        return termToN3(obj, stats);
    }
    objectTree = objectTree.bind(this);

    function termToN3(expr, stats) {
        switch(expr.termType) {

            case 'formula':
                var res = ['{'];
                res = res.concat(statementListToTree(expr.statements));
                return  res.concat(['}']);

            case 'collection':
                var res = ['('];
                for (i=0; i<expr.elements.length; i++) {
                    res.push(   [ objectTree(expr.elements[i], stats) ]);
                }
                res.push(')');
                return res;

           default:
                return this.atomicTermToN3(expr);
        }
    }
    __Serializer.prototype.termToN3 = termToN3;
    termToN3 = termToN3.bind(this);

    function prefixDirectives() {
        var str = '';
        if (this.defaultNamespace)
          str += '@prefix : <'+this.defaultNamespace+'>.\n';
        for (var ns in this.prefixes) {
            if (!this.prefixes.hasOwnProperty(ns)) continue;
            if (!this.namespacesUsed[ns]) continue;
            str += '@prefix ' + this.prefixes[ns] + ': <' +
                 $rdf.uri.refTo(this.base, ns) + '>.\n';
        }
        return str + '\n';
    }
    prefixDirectives = prefixDirectives.bind(this);

    // Body of statementsToN3:

    var tree = statementListToTree(sts);
    return prefixDirectives() + treeToString(tree, -1);

}


////////////////////////////////////////////// Atomic Terms

//  Deal with term level things and nesting with no bnode structure


__Serializer.prototype.atomicTermToN3 = function atomicTermToN3(expr, stats) {
    switch(expr.termType) {
        case 'bnode':
        case 'variable':  return expr.toNT();
        case 'literal':
            if (expr.datatype) {
                switch (expr.datatype.uri) {
                case 'http://www.w3.org/2001/XMLSchema#integer':
                    return expr.value.toString();

                //case 'http://www.w3.org/2001/XMLSchema#double': // Must force use of 'e'

                case 'http://www.w3.org/2001/XMLSchema#boolean':
                    return expr.value? 'true' : 'false';
                }
            }
            var str = this.stringToN3(expr.value);
            if (expr.lang){
                str+= '@' + expr.lang;
            } else if (expr.datatype) {
                str+= '^^' + this.termToN3(expr.datatype, stats);
            }
            return str;
        case 'symbol':
            return this.symbolToN3(expr);
       default:
            throw "Internal: atomicTermToN3 cannot handle "+expr+" of termType+"+expr.termType
            return ''+expr;
    }
};

    //  stringToN3:  String escaping for N3

__Serializer.prototype.validPrefix = new RegExp(/^[a-zA-Z][a-zA-Z0-9]*$/);

__Serializer.prototype.forbidden1 = new RegExp(/[\\"\b\f\r\v\t\n\u0080-\uffff]/gm);
__Serializer.prototype.forbidden3 = new RegExp(/[\\"\b\f\r\v\u0080-\uffff]/gm);
__Serializer.prototype.stringToN3 = function stringToN3(str, flags) {
    if (!flags) flags = "e";
    var res = '', i=0, j=0;
    var delim;
    var forbidden;
    if (str.length > 20 // Long enough to make sense
            && str.slice(-1) != '"'  // corner case'
            && flags.indexOf('n') <0  // Force single line
            && (str.indexOf('\n') >0 || str.indexOf('"') > 0)) {
        delim = '"""';
        forbidden =  __Serializer.prototype.forbidden3;
    } else {
        delim = '"';
        forbidden = __Serializer.prototype.forbidden1;
    }
    for(i=0; i<str.length;) {
        forbidden.lastIndex = 0;
        var m = forbidden.exec(str.slice(i));
        if (m == null) break;
        j = i + forbidden.lastIndex -1;
        res += str.slice(i,j);
        var ch = str[j];
        if (ch=='"' && delim == '"""' &&  str.slice(j,j+3) != '"""') {
            res += ch;



        } else {

            var k = '\b\f\r\t\v\n\\"'.indexOf(ch); // No escaping of bell (7)?
            if (k >= 0) {
                res += "\\" + 'bfrtvn\\"'[k];
            } else  {
                if (flags.indexOf('e')>=0) {
                    res += '\\u' + ('000'+
                     ch.charCodeAt(0).toString(16).toLowerCase()).slice(-4)
                } else { // no 'e' flag
                    res += ch;

                }
            }
        }
        i = j+1;
    }
    return delim + res + str.slice(i) + delim
}



//  A single symbol, either in  <> or namespace notation


__Serializer.prototype.symbolToN3 = function symbolToN3(x) {  // c.f. symbolString() in notation3.py
    var uri = x.uri;
    var j = uri.indexOf('#');
    if (j<0 && this.flags.indexOf('/') < 0) {
        j = uri.lastIndexOf('/');
    }
    if (j >= 0 && this.flags.indexOf('p') < 0 &&
        // Can split at namespace but only if http[s]: URI or file: or ws[s] (why not others?)
        (uri.indexOf('http') === 0 || uri.indexOf('ws') === 0 || uri.indexOf('file') === 0))  {
        var canSplit = true;
        for (var k=j+1; k<uri.length; k++) {
            if (__Serializer.prototype._notNameChars.indexOf(uri[k]) >=0) {
                canSplit = false; break;
            }
        }

        if (uri.slice(0, j+1) == this.base + '#') { // base-relative
            return '<#' + uri.slice(j+1) + '>';
        }
        if (canSplit) {
            var localid = uri.slice(j+1);
            var namesp = uri.slice(0,j+1);
            if (this.defaultNamespace && this.defaultNamespace == namesp
                && this.flags.indexOf('d') < 0) {// d -> suppress default
                if (this.flags.indexOf('k') >= 0 &&
                    this.keyords.indexOf(localid) <0)
                    return localid;
                return ':' + localid;
            }
            this.checkIntegrity(); //  @@@ Remove when not testing
            var prefix = this.prefixes[namesp];
            if (!prefix) prefix = this.makeUpPrefix(namesp);
            if (prefix) {
                this.namespacesUsed[namesp] = true;
                return prefix + ':' + localid;
            }
            // Fall though if can't do qname
        }
    }
    if (this.flags.indexOf('r') < 0 && this.base)
        uri = $rdf.uri.refTo(this.base, uri);
    else if (this.flags.indexOf('u') >= 0)
        uri = backslashUify(uri);
    else uri = hexify(uri);
    return '<'+uri+'>';
}


// String escaping utilities


function hexify(str) { // also used in parser
  return encodeURI(str);
}


function backslashUify(str) {
    var res = '', k;
    for (var i=0; i<str.length; i++) {
        k = str.charCodeAt(i);
        if (k>65535)
            res += '\\U' + ('00000000'+k.toString(16)).slice(-8); // convert to upper?
        else if (k>126)
            res += '\\u' + ('0000'+k.toString(16)).slice(-4);
        else
            res += str[i];
    }
    return res;
}


///////////////////////////// Quad store serialization


// @para. write  - a function taking a single string to be output
//
__Serializer.prototype.writeStore = function(write) {

    var kb = this.store;
    var fetcher = kb.fetcher;
    var session = fetcher && fetcher.appNode;

    // The core data

    var sources = this.store.index[3];
    for (s in sources) {  // -> assume we can use -> as short for log:semantics
        var source = kb.fromNT(s);
        if (session && source.sameTerm(session)) continue;
        write('\n'+ this.atomicTermToN3(source)+' ' +
                this.atomicTermToN3(kb.sym('http://www.w3.org/2000/10/swap/log#semantics'))
                 + ' { '+ this.statementsToN3(kb.statementsMatching(
                            undefined, undefined, undefined, source)) + ' }.\n');
    }


    // The metadata from HTTP interactions:

    kb.statementsMatching(undefined,
            kb.sym('http://www.w3.org/2007/ont/link#requestedURI')).map(
                function(st){
                    write('\n<' + st.object.value + '> log:metadata {\n');
                    var sts = kb.statementsMatching(undefined, undefined, undefined,  st.subject);
                    write(this.statementsToN3(this.statementsToN3(sts)));
                    write('}.\n');
                });

    // Inferences we have made ourselves not attributable to anyone else

    if (session) metaSources.push(session);
    var metadata = [];
    metaSources.map(function(source){
        metadata = metadata.concat(kb.statementsMatching(undefined, undefined, undefined, source));
    });
    write(this.statementsToN3(metadata));

}





//////////////////////////////////////////////// XML serialization

__Serializer.prototype.statementsToXML = function(sts) {
    var indent = 4;
    var width = 80;

    var namespaceCounts = []; // which have been used
    namespaceCounts['http://www.w3.org/1999/02/22-rdf-syntax-ns#'] = true;

    var liPrefix = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#_';	//prefix for ordered list items

    ////////////////////////// Arrange the bits of XML text

    var spaces=function(n) {
        var s='';
        for(var i=0; i<n; i++) s+=' ';
        return s
    }

    var XMLtreeToLine = function(tree) {
        var str = '';
        for (var i=0; i<tree.length; i++) {
            var branch = tree[i];
            var s2 = (typeof branch == 'string') ? branch : XMLtreeToLine(branch);
            str += s2;
        }
        return str;
    }

    // Convert a nested tree of lists and strings to a string
    var XMLtreeToString = function(tree, level) {
        var str = '';
        var lastLength = 100000;
        if (!level) level = 0;
        for (var i=0; i<tree.length; i++) {
            var branch = tree[i];
            if (typeof branch != 'string') {
                var substr = XMLtreeToString(branch, level +1);
                if (
                    substr.length < 10*(width-indent*level)
                    && substr.indexOf('"""') < 0) {// Don't mess up multiline strings
                    var line = XMLtreeToLine(branch);
                    if (line.length < (width-indent*level)) {
                        branch = '   '+line; //   @@ Hack: treat as string below
                        substr = ''
                    }
                }
                if (substr) lastLength = 10000;
                str += substr;
            }
            if (typeof branch == 'string') {
                if (lastLength < (indent*level+4)) { // continue
                    str = str.slice(0,-1) + ' ' + branch + '\n';
                    lastLength += branch.length + 1;
                } else {
                    var line = spaces(indent*level) +branch;
                    str += line +'\n';
                    lastLength = line.length;
                }

            } else { // not string
            }
        }
        return str;
    };

    function statementListToXMLTree(statements) {
        this.suggestPrefix('rdf', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#');
        var stats = this.rootSubjects(statements);
        var roots = stats.roots;
        var results = []
        for (var i=0; i<roots.length; i++) {
            root = roots[i];
            results.push(subjectXMLTree(root, stats))
        }
        return results;
    }
    statementListToXMLTree = statementListToXMLTree.bind(this);

    function escapeForXML(str) {
        if (typeof str == 'undefined') return '@@@undefined@@@@';
        return str.replace(/[&<"]/g, function(m) {
          switch(m[0]) {
            case '&':
              return '&amp;';
            case '<':
              return '&lt;';
            case '"':
              return '&quot;'; //'
          }
        });
    }

    function relURI(term) {
        return escapeForXML((this.base) ? $rdf.Util.uri.refTo(this.base, term.uri) : term.uri);
    }
    relURI = relURI.bind(this);

    // The tree for a subject
    function subjectXMLTree(subject, stats) {
      var results = [];
      var type, t, st, pred;
      var sts = stats.subjects[this.toStr(subject)]; // relevant statements
      if (typeof sts == 'undefined') {
        throw('Serializing XML - Cant find statements for '+subject);
      }


      // Sort only on the predicate, leave the order at object
      // level undisturbed.  This leaves multilingual content in
      // the order of entry (for partner literals), which helps
      // readability.
      //
      // For the predicate sort, we attempt to split the uri
      // as a hint to the sequence
      sts.sort(function(a,b) {
        var ap = a.predicate.uri;
        var bp = b.predicate.uri;
        if(ap.substring(0,liPrefix.length) == liPrefix || bp.substring(0,liPrefix.length) == liPrefix) {	//we're only interested in sorting list items
          return ap.localeCompare(bp);
        }

        var as = ap.substring(liPrefix.length);
        var bs = bp.substring(liPrefix.length);
        var an = parseInt(as);
        var bn = parseInt(bs);
        if(isNaN(an) || isNaN(bn) ||
            an != as || bn != bs) {	//we only care about integers
          return ap.localeCompare(bp);
        }

        return an - bn;
      });


      for (var i=0; i<sts.length; i++) {
        st = sts[i];
        // look for a type
        if(st.predicate.uri == 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' && !type && st.object.termType == "symbol") {
          type = st.object;
          continue;	//don't include it as a child element
        }

        // see whether predicate can be replaced with "li"
        pred = st.predicate;
        if(pred.uri.substr(0, liPrefix.length) == liPrefix) {
          var number = pred.uri.substr(liPrefix.length);
          // make sure these are actually numeric list items
          var intNumber = parseInt(number);
          if(number == intNumber.toString()) {
            // was numeric; don't need to worry about ordering since we've already
            // sorted the statements
            pred = new $rdf.NamedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#li');
          }
        }

        t = qname(pred);
        switch (st.object.termType) {
          case 'bnode':
            if(stats.incoming[st.object].length == 1) {	//there should always be something in the incoming array for a bnode
              results = results.concat(['<'+ t +'>',
                subjectXMLTree(st.object, stats),
                '</'+ t +'>']);
            } else {
              results = results.concat(['<'+ t +' rdf:nodeID="'
                +st.object.toNT().slice(2)+'"/>']);
            }
          break;
          case 'symbol':
            results = results.concat(['<'+ t +' rdf:resource="'
              + relURI(st.object)+'"/>']);
          break;
          case 'literal':
            results = results.concat(['<'+ t
              + (st.object.datatype ? ' rdf:datatype="'+escapeForXML(st.object.datatype.uri)+'"' : '')
              + (st.object.lang ? ' xml:lang="'+st.object.lang+'"' : '')
              + '>' + escapeForXML(st.object.value)
              + '</'+ t +'>']);
          break;
          case 'collection':
            results = results.concat(['<'+ t +' rdf:parseType="Collection">',
              collectionXMLTree(st.object, stats),
              '</'+ t +'>']);
          break;
          default:
            throw "Can't serialize object of type "+st.object.termType +" into XML";
        } // switch
      }

      var tag = type ? qname(type) : 'rdf:Description';

      var attrs = '';
      if (subject.termType == 'bnode') {
          if(!stats.incoming[subject] || stats.incoming[subject].length != 1) { // not an anonymous bnode
              attrs = ' rdf:nodeID="'+subject.toNT().slice(2)+'"';
          }
      } else {
          attrs = ' rdf:about="'+ relURI(subject)+'"';
      }

      return [ '<' + tag + attrs + '>' ].concat([results]).concat(["</"+ tag +">"]);
    }

    subjectXMLTree = subjectXMLTree.bind(this);

    function collectionXMLTree(subject, stats) {
        var res = []
        for (var i=0; i< subject.elements.length; i++) {
            res.push(subjectXMLTree(subject.elements[i], stats));
         }
         return res;
    }

    // The property tree for a single subject or anonymos node
    function propertyXMLTree(subject, stats) {
        var results = []
        var sts = stats.subjects[this.toStr(subject)]; // relevant statements
        if (sts == undefined) return results;  // No relevant statements
        sts.sort();
        for (var i=0; i<sts.length; i++) {
            var st = sts[i];
            switch (st.object.termType) {
                case 'bnode':
                    if(stats.rootsHash[st.object.toNT()]) { // This bnode has been done as a root -- no content here @@ what bout first time
                        results = results.concat(['<'+qname(st.predicate)+' rdf:nodeID="'+st.object.toNT().slice(2)+'">',
                        '</'+qname(st.predicate)+'>']);
                    } else {
                    results = results.concat(['<'+qname(st.predicate)+' rdf:parseType="Resource">',
                        propertyXMLTree(st.object, stats),
                        '</'+qname(st.predicate)+'>']);
                    }
                    break;
                case 'symbol':
                    results = results.concat(['<'+qname(st.predicate)+' rdf:resource="'
                            + relURI(st.object)+'"/>']);
                    break;
                case 'literal':
                    results = results.concat(['<'+qname(st.predicate)
                        + (st.object.datatype ? ' rdf:datatype="'+escapeForXML(st.object.datatype.uri)+'"' : '')
                        + (st.object.lang ? ' xml:lang="'+st.object.lang+'"' : '')
                        + '>' + escapeForXML(st.object.value)
                        + '</'+qname(st.predicate)+'>']);
                    break;
                case 'collection':
                    results = results.concat(['<'+qname(st.predicate)+' rdf:parseType="Collection">',
                        collectionXMLTree(st.object, stats),
                        '</'+qname(st.predicate)+'>']);
                    break;
                default:
                    throw "Can't serialize object of type "+st.object.termType +" into XML";

            } // switch
        }
        return results;
    }
    propertyXMLTree = propertyXMLTree.bind(this);

    function qname(term) {
        var uri = term.uri;

        var j = uri.indexOf('#');
        if (j<0 && this.flags.indexOf('/') < 0) {
            j = uri.lastIndexOf('/');
        }
        if (j < 0) throw ("Cannot make qname out of <"+uri+">")

        var canSplit = true;
        for (var k=j+1; k<uri.length; k++) {
            if (__Serializer.prototype._notNameChars.indexOf(uri[k]) >=0) {
                throw ('Invalid character "'+uri[k] +'" cannot be in XML qname for URI: '+uri);
            }
        }
        var localid = uri.slice(j+1);
        var namesp = uri.slice(0,j+1);
        if (this.defaultNamespace && this.defaultNamespace == namesp
            && this.flags.indexOf('d') < 0) {// d -> suppress default
            return localid;
        }
        var prefix = this.prefixes[namesp];
        if (!prefix) prefix = this.makeUpPrefix(namesp);
        namespaceCounts[namesp] = true;
        return prefix + ':' + localid;
//        throw ('No prefix for namespace "'+namesp +'" for XML qname for '+uri+', namespaces: '+sz.prefixes+' sz='+sz);
    }
    qname = qname.bind(this);

    // Body of toXML:

    var tree = statementListToXMLTree(sts);
    var str = '<rdf:RDF';
    if (this.defaultNamespace)
      str += ' xmlns="'+escapeForXML(this.defaultNamespace)+'"';
    for (var ns in namespaceCounts) {
        if (!namespaceCounts.hasOwnProperty(ns)) continue;
        str += '\n xmlns:' + this.prefixes[ns] + '="'+escapeForXML(ns)+'"';
    }
    str += '>';

    var tree2 = [str, tree, '</rdf:RDF>'];  //@@ namespace declrations
    return XMLtreeToString(tree2, -1);


} // End @@ body

var Serializer = function( store ) {return new __Serializer( store )};
return Serializer;

}();
/*
 * Updates-Via
 */
var $rdf
var k
var v
var bind = function (fn, me) {
  return function () {
    return fn.apply(me, arguments)
  }
}
var hasProp = {}.hasOwnProperty

if (typeof $rdf === 'undefined' || $rdf === null) {
  $rdf = {}
}

$rdf.UpdatesSocket = (function () {
  function UpdatesSocket (parent, via1) {
    var error
    this.parent = parent
    this.via = via1
    this.subscribe = bind(this.subscribe, this)
    this.onError = bind(this.onError, this)
    this.onMessage = bind(this.onMessage, this)
    this.onClose = bind(this.onClose, this)
    this.onOpen = bind(this.onOpen, this)
    this._subscribe = bind(this._subscribe, this)
    this._send = bind(this._send, this)
    this.connected = false
    this.pending = {}
    this.subscribed = {}
    this.socket = {}
    try {
      this.socket = new WebSocket(via1)
      this.socket.onopen = this.onOpen
      this.socket.onclose = this.onClose
      this.socket.onmessage = this.onMessage
      this.socket.onerror = this.onError
    } catch (error1) {
      error = error1
      this.onError(error)
    }
  }

  UpdatesSocket.prototype._decode = function (q) {
    var elt
    var i
    var k
    var r
    var ref
    var ref1
    var v
    r = {}
    ref = (function () {
      var j, len, ref, results
      ref = q.split('&')
      results = []
      for (j = 0, len = ref.length; j < len; j++) {
        elt = ref[j]
        results.push(elt.split('='))
      }
      return results
    })()
    for (i in ref) {
      elt = ref[i]
      ref1 = [decodeURIComponent(elt[0]), decodeURIComponent(elt[1])]
      k = ref1[0]
      v = ref1[1]
      if (r[k] == null) {
        r[k] = []
      }
      r[k].push(v)
    }
    return r
  }

  UpdatesSocket.prototype._send = function (method, uri, data) {
    var base, message
    message = [method, uri, data].join(' ')
    return typeof (base = this.socket).send === 'function' ? base.send(message) : void 0
  }

  UpdatesSocket.prototype._subscribe = function (uri) {
    this._send('sub', uri, '')
    this.subscribed[uri] = true
    return this.subscribed[uri]
  }

  UpdatesSocket.prototype.onOpen = function (e) {
    var results, uri
    this.connected = true
    results = []
    for (uri in this.pending) {
      delete this.pending[uri]
      results.push(this._subscribe(uri))
    }
    return results
  }

  UpdatesSocket.prototype.onClose = function (e) {
    var uri
    this.connected = false
    for (uri in this.subscribed) {
      this.pending[uri] = true
    }
    this.subscribed = {}
    return this.subscribed
  }

  UpdatesSocket.prototype.onMessage = function (e) {
    var base, message
    message = e.data.split(' ')
    if (message[0] === 'ping') {
      return typeof (base = this.socket).send === 'function' ? base.send('pong ' + message.slice(1).join(' ')) : void 0
    } else if (message[0] === 'pub') {
      return this.parent.onUpdate(message[1], this._decode(message[2]))
    }
  }

  UpdatesSocket.prototype.onError = function (e) {
    throw new Error('onError' + e)
  }

  UpdatesSocket.prototype.subscribe = function (uri) {
    if (this.connected) {
      return this._subscribe(uri)
    } else {
      this.pending[uri] = true
      return this.pending[uri]
    }
  }

  return UpdatesSocket
})()

$rdf.UpdatesVia = (function () {
  function UpdatesVia (fetcher) {
    this.fetcher = fetcher
    this.onUpdate = bind(this.onUpdate, this)
    this.onHeaders = bind(this.onHeaders, this)
    this.register = bind(this.register, this)
    this.graph = {}
    this.via = {}
    this.fetcher.addCallback('headers', this.onHeaders)
  }

  UpdatesVia.prototype.register = function (via, uri) {
    if (this.via[via] == null) {
      this.via[via] = new $rdf.UpdatesSocket(this, via)
    }
    return this.via[via].subscribe(uri)
  }

  UpdatesVia.prototype.onHeaders = function (d) {
    var etag, uri, via
    if (d.headers == null) {
      return true
    }
    if (typeof WebSocket === 'undefined' || WebSocket === null) {
      return true
    }
    etag = d.headers['etag']
    via = d.headers['updates-via']
    uri = d.uri
    if (etag && via) {
      this.graph[uri] = {
        etag: etag,
        via: via
      }
      this.register(via, uri)
    }
    return true
  }

  UpdatesVia.prototype.onUpdate = function (uri, d) {
    return this.fetcher.refresh($rdf.sym(uri))
  }

  return UpdatesVia
})()

if ((typeof module !== 'undefined' && module !== null ? module.exports : void 0) != null) {
  for (k in $rdf) {
    if (!hasProp.call($rdf, k)) continue
    v = $rdf[k]
    module.exports[k] = v
  }
}
/**
 *
 * Project: rdflib.js, originally part of Tabulator project
 *
 * File: web.js
 *
 * Description: contains functions for requesting/fetching/retracting
 *  This implements quite a lot of the web architecture.
 * A fetcher is bound to a specific knowledge base graph, into which
 * it loads stuff and into which it writes its metadata
 * @@ The metadata should be optionally a separate graph
 *
 * - implements semantics of HTTP headers, Internet Content Types
 * - selects parsers for rdf/xml, n3, rdfa, grddl
 *
 * Dependencies:
 *
 * needs: util.js uri.js term.js rdfparser.js rdfa.js n3parser.js
 *      identity.js sparql.js jsonparser.js
 *
 * Independent of jQuery
 */

/**
 * Things to test: callbacks on request, refresh, retract
 *   loading from HTTP, HTTPS, FTP, FILE, others?
 * To do:
 * Firing up a mail client for mid:  (message:) URLs
 */

var asyncLib = require('async') // @@ Goal: remove this dependency
var jsonld = require('jsonld')
var N3 = require('n3')  // @@ Goal: remove this dependency

$rdf.Fetcher = function (store, timeout, async) {
  this.store = store
  this.thisURI = 'http://dig.csail.mit.edu/2005/ajar/ajaw/rdf/sources.js' + '#SourceFetcher' // -- Kenny
  this.timeout = timeout || 30000
  this.async = async != null ? async : true
  this.appNode = this.store.bnode() // Denoting this session
  this.store.fetcher = this // Bi-linked
  this.requested = {}
  // this.requested[uri] states:
  //   undefined     no record of web access or records reset
  //   true          has been requested, XHR in progress
  //   'done'        received, Ok
  //   403           HTTP status unauthorized
  //   404           Ressource does not exist. Can be created etc.
  //   'redirected'  In attempt to counter CORS problems retried.
  //   other strings mean various other erros, such as parse errros.
  //
  this.redirectedTo = {} // Wehn 'redireced'
  this.fetchCallbacks = {} // fetchCallbacks[uri].push(callback)

  this.nonexistant = {} // keep track of explict 404s -> we can overwrite etc
  this.lookedUp = {}
  this.handlers = []
  this.mediatypes = { }
  var sf = this
  var kb = this.store
  var ns = {} // Convenience namespaces needed in this module:
  // These are delibertely not exported as the user application should
  // make its own list and not rely on the prefixes used here,
  // and not be tempted to add to them, and them clash with those of another
  // application.
  ns.link = $rdf.Namespace('http://www.w3.org/2007/ont/link#')
  ns.http = $rdf.Namespace('http://www.w3.org/2007/ont/http#')
  ns.httph = $rdf.Namespace('http://www.w3.org/2007/ont/httph#')
  ns.rdf = $rdf.Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#')
  ns.rdfs = $rdf.Namespace('http://www.w3.org/2000/01/rdf-schema#')
  ns.dc = $rdf.Namespace('http://purl.org/dc/elements/1.1/')

  sf.mediatypes['image/*'] = {
    'q': 0.9
  }

  $rdf.Fetcher.crossSiteProxy = function (uri) {
    if ($rdf.Fetcher.crossSiteProxyTemplate) {
      return $rdf.Fetcher.crossSiteProxyTemplate.replace('{uri}', encodeURIComponent(uri))
    } else {
      return undefined
    }
  }

  $rdf.Fetcher.RDFXMLHandler = function (args) {
    if (args) {
      this.dom = args[0]
    }
    this.handlerFactory = function (xhr) {
      xhr.handle = function (cb) {
        // sf.addStatus(xhr.req, 'parsing soon as RDF/XML...')
        var kb = sf.store
        if (!this.dom) this.dom = $rdf.Util.parseXML(xhr.responseText)
        var root = this.dom.documentElement
        if (root.nodeName === 'parsererror') { // @@ Mozilla only See issue/issue110
          sf.failFetch(xhr, 'Badly formed XML in ' + xhr.resource.uri) // have to fail the request
          throw new Error('Badly formed XML in ' + xhr.resource.uri) // @@ Add details
        }
        var parser = new $rdf.RDFParser(kb)
        try {
          parser.parse(this.dom, xhr.original.uri, xhr.original)
        } catch (e) {
          sf.addStatus(xhr.req, 'Syntax error parsing RDF/XML! ' + e)
          console.log('Syntax error parsing RDF/XML! ' + e)
        }
        if (!xhr.options.noMeta) {
          kb.add(xhr.original, ns.rdf('type'), ns.link('RDFDocument'), sf.appNode)
        }
        cb()
      }
    }
  }
  $rdf.Fetcher.RDFXMLHandler.toString = function () {
    return 'RDFXMLHandler'
  }
  $rdf.Fetcher.RDFXMLHandler.register = function (sf) {
    sf.mediatypes['application/rdf+xml'] = {}
  }
  $rdf.Fetcher.RDFXMLHandler.pattern = new RegExp('application/rdf\\+xml')

  // This would much better use on-board XSLT engine. @@
  /*  deprocated 2016-02-17  timbl
  $rdf.Fetcher.doGRDDL = function(kb, doc, xslturi, xmluri) {
      sf.requestURI('http://www.w3.org/2005/08/' + 'online_xslt/xslt?' + 'xslfile=' + escape(xslturi) + '&xmlfile=' + escape(xmluri), doc)
  }
*/
  $rdf.Fetcher.XHTMLHandler = function (args) {
    if (args) {
      this.dom = args[0]
    }
    this.handlerFactory = function (xhr) {
      xhr.handle = function (cb) {
        var relation, reverse
        if (!this.dom) {
          this.dom = $rdf.Util.parseXML(xhr.responseText)
        }
        var kb = sf.store

        // dc:title
        var title = this.dom.getElementsByTagName('title')
        if (title.length > 0) {
          kb.add(xhr.resource, ns.dc('title'), kb.literal(title[0].textContent), xhr.resource)
        // $rdf.log.info("Inferring title of " + xhr.resource)
        }

        // link rel
        var links = this.dom.getElementsByTagName('link')
        for (var x = links.length - 1; x >= 0; x--) { // @@ rev
          relation = links[x].getAttribute('rel')
          reverse = false
          if (!relation) {
            relation = links[x].getAttribute('rev')
            reverse = true
          }
          if (relation) {
            sf.linkData(xhr, relation,
              links[x].getAttribute('href'), xhr.resource, reverse)
          }
        }

        // Data Islands

        var scripts = this.dom.getElementsByTagName('script')
        for (var i = 0; i < scripts.length; i++) {
          var contentType = scripts[i].getAttribute('type')
          if ($rdf.parsable[contentType]) {
            $rdf.parse(scripts[i].textContent, kb, xhr.original.uri, contentType)
          }
        }

        if (!xhr.options.noMeta) {
          kb.add(xhr.resource, ns.rdf('type'), ns.link('WebPage'), sf.appNode)
        }

        if (xhr.options.doRDFa && $rdf.parseRDFaDOM) {
          $rdf.parseRDFaDOM(this.dom, kb, xhr.original)
        }
        cb() // Fire done callbacks
      }
    }
  }
  $rdf.Fetcher.XHTMLHandler.toString = function () {
    return 'XHTMLHandler'
  }
  $rdf.Fetcher.XHTMLHandler.register = function (sf) {
    sf.mediatypes['application/xhtml+xml'] = {}
  }
  $rdf.Fetcher.XHTMLHandler.pattern = new RegExp('application/xhtml')

  $rdf.Fetcher.XMLHandler = function () {
    this.handlerFactory = function (xhr) {
      xhr.handle = function (cb) {
        var dom = $rdf.Util.parseXML(xhr.responseText)

        // XML Semantics defined by root element namespace
        // figure out the root element
        for (var c = 0; c < dom.childNodes.length; c++) {
          // is this node an element?
          if (dom.childNodes[c].nodeType === 1) {
            // We've found the first element, it's the root
            var ns = dom.childNodes[c].namespaceURI

            // Is it RDF/XML?
            if (ns && ns === ns['rdf']) {
              sf.addStatus(xhr.req, 'Has XML root element in the RDF namespace, so assume RDF/XML.')
              sf.switchHandler('RDFXMLHandler', xhr, cb, [dom])
              return
            }
            // it isn't RDF/XML or we can't tell
            // Are there any GRDDL transforms for this namespace?
            // @@ assumes ns documents have already been loaded
            /*
            var xforms = kb.each(kb.sym(ns), kb.sym("http://www.w3.org/2003/g/data-view#namespaceTransformation"))
            for (var i = 0; i < xforms.length; i++) {
                var xform = xforms[i]
                // $rdf.log.info(xhr.resource.uri + " namespace " + ns + " has GRDDL ns transform" + xform.uri)
                 $rdf.Fetcher.doGRDDL(kb, xhr.resource, xform.uri, xhr.resource.uri)
            }
            */
            break
          }
        }

        // Or it could be XHTML?
        // Maybe it has an XHTML DOCTYPE?
        if (dom.doctype) {
          // $rdf.log.info("We found a DOCTYPE in " + xhr.resource)
          if (dom.doctype.name === 'html' && dom.doctype.publicId.match(/^-\/\/W3C\/\/DTD XHTML/) && dom.doctype.systemId.match(/http:\/\/www.w3.org\/TR\/xhtml/)) {
            sf.addStatus(xhr.req, 'Has XHTML DOCTYPE. Switching to XHTML Handler.\n')
            sf.switchHandler('XHTMLHandler', xhr, cb)
            return
          }
        }

        // Or what about an XHTML namespace?
        var html = dom.getElementsByTagName('html')[0]
        if (html) {
          var xmlns = html.getAttribute('xmlns')
          if (xmlns && xmlns.match(/^http:\/\/www.w3.org\/1999\/xhtml/)) {
            sf.addStatus(xhr.req, 'Has a default namespace for ' + 'XHTML. Switching to XHTMLHandler.\n')
            sf.switchHandler('XHTMLHandler', xhr, cb)
            return
          }
        }

        // At this point we should check the namespace document (cache it!) and
        // look for a GRDDL transform
        // @@  Get namespace document <n>, parse it, look for  <n> grddl:namespaceTransform ?y
        // Apply ?y to   dom
        // We give up. What dialect is this?
        sf.failFetch(xhr, 'Unsupported dialect of XML: not RDF or XHTML namespace, etc.\n' + xhr.responseText.slice(0, 80))
      }
    }
  }

  $rdf.Fetcher.XMLHandler.toString = function () {
    return 'XMLHandler'
  }
  $rdf.Fetcher.XMLHandler.register = function (sf) {
    sf.mediatypes['text/xml'] = {
      'q': 0.2
    }
    sf.mediatypes['application/xml'] = {
      'q': 0.2
    }
  }
  $rdf.Fetcher.XMLHandler.pattern = new RegExp('(text|application)/(.*)xml')

  $rdf.Fetcher.HTMLHandler = function () {
    this.handlerFactory = function (xhr) {
      xhr.handle = function (cb) {
        var rt = xhr.responseText
        // We only handle XHTML so we have to figure out if this is XML
        // $rdf.log.info("Sniffing HTML " + xhr.resource + " for XHTML.")

        if (rt.match(/\s*<\?xml\s+version\s*=[^<>]+\?>/)) {
          sf.addStatus(xhr.req, "Has an XML declaration. We'll assume " +
            "it's XHTML as the content-type was text/html.\n")
          sf.switchHandler('XHTMLHandler', xhr, cb)
          return
        }

        // DOCTYPE
        // There is probably a smarter way to do this
        if (rt.match(/.*<!DOCTYPE\s+html[^<]+-\/\/W3C\/\/DTD XHTML[^<]+http:\/\/www.w3.org\/TR\/xhtml[^<]+>/)) {
          sf.addStatus(xhr.req, 'Has XHTML DOCTYPE. Switching to XHTMLHandler.\n')
          sf.switchHandler('XHTMLHandler', xhr, cb)
          return
        }

        // xmlns
        if (rt.match(/[^(<html)]*<html\s+[^<]*xmlns=['"]http:\/\/www.w3.org\/1999\/xhtml["'][^<]*>/)) {
          sf.addStatus(xhr.req, 'Has default namespace for XHTML, so switching to XHTMLHandler.\n')
          sf.switchHandler('XHTMLHandler', xhr, cb)
          return
        }

        // dc:title	                       //no need to escape '/' here
        var titleMatch = (new RegExp('<title>([\\s\\S]+?)</title>', 'im')).exec(rt)
        if (titleMatch) {
          var kb = sf.store
          kb.add(
            xhr.resource,
            ns.dc('title'),
            kb.literal(titleMatch[1]),
            xhr.resource
          ) // think about xml:lang later
          kb.add(xhr.resource, ns.rdf('type'), ns.link('WebPage'), sf.appNode)
          cb() // doneFetch, not failed
          return
        }
        sf.addStatus(xhr.req, 'non-XML HTML document, not parsed for data.')
        sf.doneFetch(xhr)
        // sf.failFetch(xhr, "Sorry, can't yet parse non-XML HTML")
      }
    }
  }

  $rdf.Fetcher.HTMLHandler.toString = function () {
    return 'HTMLHandler'
  }
  $rdf.Fetcher.HTMLHandler.register = function (sf) {
    sf.mediatypes['text/html'] = {
      'q': 0.3
    }
  }
  $rdf.Fetcher.HTMLHandler.pattern = new RegExp('text/html')

  $rdf.Fetcher.TextHandler = function () {
    this.handlerFactory = function (xhr) {
      xhr.handle = function (cb) {
        // We only speak dialects of XML right now. Is this XML?
        var rt = xhr.responseText

        // Look for an XML declaration
        if (rt.match(/\s*<\?xml\s+version\s*=[^<>]+\?>/)) {
          sf.addStatus(xhr.req, 'Warning: ' + xhr.resource + " has an XML declaration. We'll assume " +
            "it's XML but its content-type wasn't XML.\n")
          sf.switchHandler('XMLHandler', xhr, cb)
          return
        }

        // Look for an XML declaration
        if (rt.slice(0, 500).match(/xmlns:/)) {
          sf.addStatus(xhr.req, "May have an XML namespace. We'll assume " +
            "it's XML but its content-type wasn't XML.\n")
          sf.switchHandler('XMLHandler', xhr, cb)
          return
        }

        // We give up finding semantics - this is not an error, just no data
        sf.addStatus(xhr.req, 'Plain text document, no known RDF semantics.')
        sf.doneFetch(xhr)
        //                sf.failFetch(xhr, "unparseable - text/plain not visibly XML")
        //                dump(xhr.resource + " unparseable - text/plain not visibly XML, starts:\n" + rt.slice(0, 500)+"\n")
      }
    }
  }

  $rdf.Fetcher.TextHandler.toString = function () {
    return 'TextHandler'
  }
  $rdf.Fetcher.TextHandler.register = function (sf) {
    sf.mediatypes['text/plain'] = {
      'q': 0.1
    }
  }
  $rdf.Fetcher.TextHandler.pattern = new RegExp('text/plain')

  $rdf.Fetcher.N3Handler = function () {
    this.handlerFactory = function (xhr) {
      xhr.handle = function (cb) {
        // Parse the text of this non-XML file

        // console.log('web.js: Parsing as N3 ' + xhr.resource.uri + ' base: ' + xhr.original.uri) // @@@@ comment me out
        // sf.addStatus(xhr.req, "N3 not parsed yet...")
        var p = $rdf.N3Parser(kb, kb, xhr.original.uri, xhr.original.uri, null, null, '', null)
        //                p.loadBuf(xhr.responseText)
        try {
          p.loadBuf(xhr.responseText)
        } catch (e) {
          var msg = ('Error trying to parse ' + xhr.resource + ' as Notation3:\n' + e + ':\n' + e.stack)
          // dump(msg+"\n")
          sf.failFetch(xhr, msg)
          return
        }

        sf.addStatus(xhr.req, 'N3 parsed: ' + p.statementCount + ' triples in ' + p.lines + ' lines.')
        sf.store.add(xhr.original, ns.rdf('type'), ns.link('RDFDocument'), sf.appNode)
        var args = [xhr.original.uri] // Other args needed ever?
        sf.doneFetch(xhr)
      }
    }
  }

  $rdf.Fetcher.N3Handler.toString = function () {
    return 'N3Handler'
  }
  $rdf.Fetcher.N3Handler.register = function (sf) {
    sf.mediatypes['text/n3'] = {
      'q': '1.0'
    } // as per 2008 spec
    sf.mediatypes['application/x-turtle'] = {
      'q': 1.0
    } // pre 2008
    sf.mediatypes['text/turtle'] = {
      'q': 1.0
    } // pre 2008
  }
  $rdf.Fetcher.N3Handler.pattern = new RegExp('(application|text)/(x-)?(rdf\\+)?(n3|turtle)')

  $rdf.Util.callbackify(this, ['request', 'recv', 'headers', 'load', 'fail', 'refresh', 'retract', 'done'])

  this.addHandler = function (handler) {
    sf.handlers.push(handler)
    handler.register(sf)
  }

  this.switchHandler = function (name, xhr, cb, args) {
    var Handler = null
    for (var i = 0; i < this.handlers.length; i++) {
      if ('' + this.handlers[i] === name) {
        Handler = this.handlers[i]
      }
    }
    if (!Handler) {
      throw new Error('web.js: switchHandler: name=' + name + ' , this.handlers =' + this.handlers + '\n' +
      'switchHandler: switching to ' + Handler + '; sf=' + sf +
      '; typeof $rdf.Fetcher=' + typeof $rdf.Fetcher +
      ';\n\t $rdf.Fetcher.HTMLHandler=' + $rdf.Fetcher.HTMLHandler + '\n' +
      '\n\tsf.handlers=' + sf.handlers + '\n')
    }
    (new Handler(args)).handlerFactory(xhr)
    xhr.handle(cb)
  }

  this.addStatus = function (req, status) {
    // <Debug about="parsePerformance">
    var now = new Date()
    status = '[' + now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds() + '.' + now.getMilliseconds() + '] ' + status
    // </Debug>
    var kb = this.store
    var s = kb.the(req, ns.link('status'))
    if (s && s.append) {
      s.append(kb.literal(status))
    } else {
      $rdf.log.warn('web.js: No list to add to: ' + s + ',' + status) // @@@
    }
  }

  // Record errors in the system on failure
  // Returns xhr so can just do return this.failfetch(...)
  this.failFetch = function (xhr, status) {
    this.addStatus(xhr.req, status)
    if (!xhr.options.noMeta) {
      kb.add(xhr.original, ns.link('error'), status)
    }
    if (!xhr.resource.sameTerm(xhr.original)) {
      console.log('@@ Recording failure original ' + xhr.original + '( as ' + xhr.resource + ') : ' + xhr.status)
    } else {
      console.log('@@ Recording failure for ' + xhr.original + ': ' + xhr.status)
    }
    this.requested[$rdf.uri.docpart(xhr.original.uri)] = xhr.status // changed 2015 was false
    while (this.fetchCallbacks[xhr.original.uri] && this.fetchCallbacks[xhr.original.uri].length) {
      this.fetchCallbacks[xhr.original.uri].shift()(false, 'Fetch of <' + xhr.original.uri + '> failed: ' + status, xhr)
    }
    delete this.fetchCallbacks[xhr.original.uri]
    this.fireCallbacks('fail', [xhr.original.uri, status])
    xhr.abort()
    return xhr
  }

  // in the why part of the quad distinguish between HTML and HTTP header
  // Reverse is set iif the link was rev= as opposed to rel=
  this.linkData = function (xhr, rel, uri, why, reverse) {
    if (!uri) return
    var predicate
    // See http://www.w3.org/TR/powder-dr/#httplink for describedby 2008-12-10
    var obj = kb.sym($rdf.uri.join(uri, xhr.original.uri))
    if (rel === 'alternate' || rel === 'seeAlso' || rel === 'meta' || rel === 'describedby') {
      if (obj.uri === xhr.original.uri) return
      predicate = ns.rdfs('seeAlso')
    } else if (rel === 'type') {
      predicate = $rdf.sym('http://www.w3.org/1999/02/22-rdf-syntax-ns#type')
    } else {
      // See https://www.iana.org/assignments/link-relations/link-relations.xml
      // Alas not yet in RDF yet for each predicate
      predicate = kb.sym($rdf.uri.join(rel, 'http://www.iana.org/assignments/link-relations/'))
    }
    if (reverse) {
      kb.add(obj, predicate, xhr.original, why)
    } else {
      kb.add(xhr.original, predicate, obj, why)
    }
  }

  this.parseLinkHeader = function (xhr, thisReq) {
    var link
    try {
      link = xhr.getResponseHeader('link') // May crash from CORS error
    } catch (e) {}
    if (link) {
      var linkexp = /<[^>]*>\s*(\s*;\s*[^\(\)<>@,;:"\/\[\]\?={} \t]+=(([^\(\)<>@,;:"\/\[\]\?={} \t]+)|("[^"]*")))*(,|$)/g
      var paramexp = /[^\(\)<>@,;:"\/\[\]\?={} \t]+=(([^\(\)<>@,;:"\/\[\]\?={} \t]+)|("[^"]*"))/g

      var matches = link.match(linkexp)
      for (var i = 0; i < matches.length; i++) {
        var split = matches[i].split('>')
        var href = split[0].substring(1)
        var ps = split[1]
        var s = ps.match(paramexp)
        for (var j = 0; j < s.length; j++) {
          var p = s[j]
          var paramsplit = p.split('=')
          // var name = paramsplit[0]
          var rel = paramsplit[1].replace(/["']/g, '') // '"
          this.linkData(xhr, rel, href, thisReq)
        }
      }
    }
  }

  this.doneFetch = function (xhr) {
    this.addStatus(xhr.req, 'Done.')
    this.requested[xhr.original.uri] = 'done' // Kenny
    while (this.fetchCallbacks[xhr.original.uri] && this.fetchCallbacks[xhr.original.uri].length) {
      this.fetchCallbacks[xhr.original.uri].shift()(true, undefined, xhr)
    }
    delete this.fetchCallbacks[xhr.original.uri]
    this.fireCallbacks('done', [xhr.original.uri])
  }
  var handlerList = [
    $rdf.Fetcher.RDFXMLHandler, $rdf.Fetcher.XHTMLHandler,
    $rdf.Fetcher.XMLHandler, $rdf.Fetcher.HTMLHandler,
    $rdf.Fetcher.TextHandler, $rdf.Fetcher.N3Handler
  ]
  handlerList.map(this.addHandler)

  /** Note two nodes are now smushed
   **
   ** If only one was flagged as looked up, then
   ** the new node is looked up again, which
   ** will make sure all the URIs are dereferenced
   */
  this.nowKnownAs = function (was, now) {
    if (this.lookedUp[was.uri]) {
      if (!this.lookedUp[now.uri]) this.lookUpThing(now, was) //  @@@@  Transfer userCallback
    } else if (this.lookedUp[now.uri]) {
      if (!this.lookedUp[was.uri]) this.lookUpThing(was, now)
    }
  }

  // Returns promise of XHR
  //
  this.webOperation = function (method, uri, options) {
    uri = uri.uri || uri; options = options || {}
    var fetcher = this
    return new Promise(function (resolve, reject) {
      var xhr = $rdf.Util.XMLHTTPFactory()
      xhr.options = options
      if (!options.noMeta && typeof tabulator !== 'undefined') {
        fetcher.saveRequestMetadata(xhr, tabulator.kb, uri)
      }
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) { // NOte a 404 can be not afailure
          var ok = (!xhr.status || (xhr.status >= 200 && xhr.status < 300))
          if (!options.noMeta && typeof tabulator !== 'undefined') {
            fetcher.saveResponseMetadata(xhr, tabulator.kb)
          }
          if (ok) resolve(xhr)
          reject(xhr.status + ' ' + xhr.statusText)
        }
      }
      xhr.open(method, uri, true)
      if (options.contentType) {
        xhr.setRequestHeader('Content-type', options.contentType)
      }
      xhr.send(options.data ? options.data : undefined)
    })
  }

  this.webCopy = function (here, there, content_type) {
    var fetcher = this
    here = here.uri || here
    return new Promise(function (resolve, reject) {
      this.webOperation('GET', here)
        .then(function (xhr) {
          fetcher.webOperation('PUT', // @@@ change to binary from text
            there, { data: xhr.responseText, contentType: content_type })
        })
        .then(function (xhr) {
          resolve(xhr)
        })
        .catch(function (e) {
          reject(e)
        })
    })
  }

  // Looks up something.
  //
  // Looks up all the URIs a things has.
  //
  // Parameters:
  //
  //  term:       canonical term for the thing whose URI is to be dereferenced
  //  rterm:      the resource which refered to this (for tracking bad links)
  //  options:    (old: force paraemter) or dictionary of options:
  //      force:      Load the data even if loaded before
  //  oneDone:   is called as callback(ok, errorbody, xhr) for each one
  //  allDone:   is called as callback(ok, errorbody) for all of them
  // Returns      the number of URIs fetched
  //
  this.lookUpThing = function (term, rterm, options, oneDone, allDone) {
    var uris = kb.uris(term) // Get all URIs
    var success = true
    var errors = ''
    var outstanding = {}
    var force
    if (options === false || options === true) { // Old signature
      force = options
      options = { force: force }
    } else {
      if (options === undefined) options = {}
      force = !!options.force
    }

    if (typeof uris !== 'undefined') {
      for (var i = 0; i < uris.length; i++) {
        var u = uris[i]
        outstanding[u] = true
        this.lookedUp[u] = true
        var sf = this

        var requestOne = function requestOne (u1) {
          sf.requestURI($rdf.uri.docpart(u1), rterm, options,
            function (ok, body, xhr) {
              if (ok) {
                if (oneDone) oneDone(true, u1)
              } else {
                if (oneDone) oneDone(false, body)
                success = false
                errors += body + '\n'
              }
              delete outstanding[u]
              if (Object.keys(outstanding).length > 0) {
                return
              }
              if (allDone) {
                allDone(success, errors)
              }
            }
          )
        }
        requestOne(u)
      }
    }
    return uris.length
  }

  /* Promise-based load function
  **
  ** NamedNode -> Promise of xhr
  ** uri string -> Promise of xhr
  ** Array of the above -> Promise of array of xhr
  **
  ** @@ todo: If p1 is array then sequence or parallel fetch of all
  */
  this.load = function (uri, options) {
    var fetcher = this
    if (uri instanceof Array) {
      var ps = uri.map(function (x) {
        return fetcher.load(x)
      })
      return Promise.all(ps)
    }
    uri = uri.uri || uri // NamedNode or URI string
    return new Promise(function (resolve, reject) {
      fetcher.nowOrWhenFetched(uri, options, function (ok, message, xhr) {
        if (ok) {
          resolve(xhr)
        } else {
          reject(message)
        }
      })
    })
  }

  /*  Ask for a doc to be loaded if necessary then call back
  **
  ** Changed 2013-08-20:  Added (ok, errormessage) params to callback
  **
  ** Calling methods:
  **   nowOrWhenFetched (uri, userCallback)
  **   nowOrWhenFetched (uri, options, userCallback)
  **   nowOrWhenFetched (uri, referringTerm, userCallback, options)  <-- old
  **   nowOrWhenFetched (uri, referringTerm, userCallback) <-- old
  **
  **  Options include:
  **   referringTerm    The docuemnt in which this link was found.
  **                    this is valuable when finding the source of bad URIs
  **   force            boolean.  Never mind whether you have tried before,
  **                    load this from scratch.
  **   forceContentType Override the incoming header to force the data to be
  **                    treaed as this content-type.
  **/
  this.nowOrWhenFetched = function (uri, p2, userCallback, options) {
    uri = uri.uri || uri // allow symbol object or string to be passed
    if (typeof p2 === 'function') {
      options = {}
      userCallback = p2
    } else if (typeof p2 === 'undefined') { // original calling signature
      // referingTerm = undefined
    } else if (p2 instanceof $rdf.NamedNode) {
      // referingTerm = p2
      options = {referingTerm: p2}
    } else {
      options = p2
    }

    this.requestURI(uri, p2, options || {}, userCallback)
  }

  this.get = this.nowOrWhenFetched

  // Look up response header
  //
  // Returns: a list of header values found in a stored HTTP response
  //      or [] if response was found but no header found
  //      or undefined if no response is available.
  //
  this.getHeader = function (doc, header) {
    var kb = this.store
    var requests = kb.each(undefined, ns.link('requestedURI'), doc.uri)
    for (var r = 0; r < requests.length; r++) {
      var request = requests[r]
      if (request !== undefined) {
        var response = kb.any(request, ns.link('response'))
        if (request !== undefined) {
          var results = kb.each(response, ns.httph(header.toLowerCase()))
          if (results.length) {
            return results.map(function (v) {
              return v.value
            })
          }
          return []
        }
      }
    }
    return undefined
  }

  this.proxyIfNecessary = function (uri) {
    if (typeof tabulator !== 'undefined' && tabulator.isExtension) return uri // Extenstion does not need proxy
    // browser does 2014 on as https browser script not trusted
    // If the web app origin is https: then the mixed content rules
    // prevent it loading insecure http: stuff so we need proxy.
    if ($rdf.Fetcher.crossSiteProxyTemplate &&
        (typeof document !== 'undefined') &&
        document.location &&
        ('' + document.location).slice(0, 6) === 'https:' && // origin is secure
        uri.slice(0, 5) === 'http:') { // requested data is not
      return $rdf.Fetcher.crossSiteProxyTemplate.replace('{uri}', encodeURIComponent(uri))
    }
    return uri
  }

  this.saveRequestMetadata = function (xhr, kb, docuri) {
    var request = kb.bnode()
    xhr.resource = $rdf.sym(docuri)

    xhr.req = request
    if (!xhr.options.noMeta) { // Store no triples but do mind the bnode for req
      var now = new Date()
      var timeNow = '[' + now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds() + '] '
      kb.add(request, ns.rdfs('label'), kb.literal(timeNow + ' Request for ' + docuri), this.appNode)
      kb.add(request, ns.link('requestedURI'), kb.literal(docuri), this.appNode)
      if (xhr.original && xhr.original.uri !== docuri) {
        kb.add(request, ns.link('orginalURI'), kb.literal(xhr.original.uri), this.appNode)
      }
      kb.add(request, ns.link('status'), kb.collection(), this.appNode)
    }
    return request
  }

  this.saveResponseMetadata = function (xhr, kb) {
    var response = kb.bnode()

    if (xhr.req) kb.add(xhr.req, ns.link('response'), response)
    kb.add(response, ns.http('status'), kb.literal(xhr.status), response)
    kb.add(response, ns.http('statusText'), kb.literal(xhr.statusText), response)

    xhr.headers = {}
    if ($rdf.uri.protocol(xhr.resource.uri) === 'http' || $rdf.uri.protocol(xhr.resource.uri) === 'https') {
      xhr.headers = $rdf.Util.getHTTPHeaders(xhr)
      for (var h in xhr.headers) { // trim below for Safari - adds a CR!
        kb.add(response, ns.httph(h.toLowerCase()), xhr.headers[h].trim(), response)
      }
    }
    return response
  }

  /** Requests a document URI and arranges to load the document.
   ** Parameters:
   **	    term:  term for the thing whose URI is to be dereferenced
   **      rterm:  the resource which refered to this (for tracking bad links)
   **      options:
   **              force:  Load the data even if loaded before
   **              withCredentials:   flag for XHR/CORS etc
   **      userCallback:  Called with (true) or (false, errorbody, {status: 400}) after load is done or failed
   ** Return value:
   **	    The xhr object for the HTTP access
   **      null if the protocol is not a look-up protocol,
   **              or URI has already been loaded
   */
  this.requestURI = function (docuri, rterm, options, userCallback) { // sources_request_new

    // Various calling conventions
    docuri = docuri.uri || docuri // NamedNode or string
    docuri = docuri.split('#')[0]
    if (typeof options === 'boolean') {
      options = { 'force': options } // Ols dignature
    }
    if (typeof options === 'undefined') options = {}

    var force = !!options.force
    var kb = this.store
    var args = arguments
    var baseURI = options.baseURI || docuri  // Preseve though proxying etc
    options.userCallback = userCallback

    var pcol = $rdf.uri.protocol(docuri)
    if (pcol === 'tel' || pcol === 'mailto' || pcol === 'urn') {
      // "No look-up operation on these, but they are not errors?"
      console.log('Unsupported protocol in: ' + docuri)
      return userCallback(false, 'Unsupported protocol', { 'status': 900 }) ||
        undefined
    }
    var docterm = kb.sym(docuri)

    var sta = this.getState(docuri)
    if (!force) {
      if (sta === 'fetched') {
        return userCallback ? userCallback(true) : undefined
      }
      if (sta === 'failed') {
        return userCallback
          ? userCallback(false, 'Previously failed. ' + this.requested[docuri],
              {'status': this.requested[docuri]})
          : undefined // An xhr standin
      }
    // if (sta === 'requested') return userCallback? userCallback(false, "Sorry already requested - pending already.", {'status': 999 }) : undefined
    } else {
      delete this.nonexistant[docuri]
    }
    // @@ Should allow concurrent requests

    // If it is 'failed', then shoulkd we try again?  I think so so an old error doens't get stuck
    // if (sta === 'unrequested')

    this.fireCallbacks('request', args) // Kenny: fire 'request' callbacks here
    // dump( "web.js: Requesting uri: " + docuri + "\n" )

    if (userCallback) {
      if (!this.fetchCallbacks[docuri]) {
        this.fetchCallbacks[docuri] = [ userCallback ]
      } else {
        this.fetchCallbacks[docuri].push(userCallback)
      }
    }

    if (this.requested[docuri] === true) {
      return // Don't ask again - wait for existing call
    } else {
      this.requested[docuri] = true
    }

    if (!options.noMeta && rterm && rterm.uri) {
      kb.add(docterm.uri, ns.link('requestedBy'), rterm.uri, this.appNode)
    }

    var xhr = $rdf.Util.XMLHTTPFactory()
    var req = xhr.req = kb.bnode()
    xhr.original = $rdf.sym(baseURI)
    // console.log('XHR original: ' + xhr.original)
    xhr.options = options
    xhr.resource = docterm  // This might be proxified
    var sf = this

    var now = new Date()
    var timeNow = '[' + now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds() + '] '
    if (!options.noMeta) {
      kb.add(req, ns.rdfs('label'), kb.literal(timeNow + ' Request for ' + docuri), this.appNode)
      kb.add(req, ns.link('requestedURI'), kb.literal(docuri), this.appNode)
      kb.add(req, ns.link('status'), kb.collection(), this.appNode)
    }

    var checkCredentialsRetry = function () {
      if (!xhr.withCredentials) return false // not dealt with

      if (xhr.retriedWithCredentials) {
        return true
      }
      xhr.retriedWithCredentials = true // protect against called twice
      console.log('web: Retrying with no credentials for ' + xhr.resource)
      xhr.abort()
      delete sf.requested[docuri] // forget the original request happened
      var newopt = {}
      for (var opt in options) { // transfer baseURI etc
        if (options.hasOwnProperty(opt)) {
          newopt[opt] = options[opt]
        }
      }
      newopt.withCredentials = false
      sf.addStatus(xhr.req, 'Abort: Will retry with credentials SUPPRESSED to see if that helps')
      sf.requestURI(docuri, rterm, newopt, xhr.userCallback) // userCallback already registered (with where?)
      return true
    }

    var onerrorFactory = function (xhr) {
      return function (event) {
        xhr.onErrorWasCalled = true // debugging and may need it
        if (typeof document !== 'undefined') { // Mashup situation, not node etc
          if ($rdf.Fetcher.crossSiteProxyTemplate && document.location && !xhr.proxyUsed) {
            var hostpart = $rdf.uri.hostpart
            var here = '' + document.location
            var uri = xhr.resource.uri
            if (hostpart(here) && hostpart(uri) && hostpart(here) !== hostpart(uri)) { // If cross-site
              if (xhr.status === 401 || xhr.status === 403 || xhr.status === 404) {
                onreadystatechangeFactory(xhr)()
              } else {
                // IT IS A PAIN THAT NO PROPER ERROR REPORTING
                if (checkCredentialsRetry(xhr)) { // If credentials flag set, retry without,
                  return
                }
                // If it wasn't, or we already tried that
                var newURI = $rdf.Fetcher.crossSiteProxy(uri)
                console.log('web: Direct failed so trying proxy ' + newURI)
                sf.addStatus(xhr.req, 'BLOCKED -> Cross-site Proxy to <' + newURI + '>')
                if (xhr.aborted) return

                var kb = sf.store
                var oldreq = xhr.req
                if (!xhr.options.noMeta) {
                  kb.add(oldreq, ns.http('redirectedTo'), kb.sym(newURI), oldreq)
                }
                xhr.abort()
                xhr.aborted = true

                sf.addStatus(oldreq, 'redirected to new request') // why
                // the callback throws an exception when called from xhr.onerror (so removed)
                // sf.fireCallbacks('done', args) // Are these args right? @@@   Not done yet! done means success
                sf.requested[xhr.resource.uri] = 'redirected'
                sf.redirectedTo[xhr.resource.uri] = newURI

                if (sf.fetchCallbacks[xhr.resource.uri]) {
                  if (!sf.fetchCallbacks[newURI]) {
                    sf.fetchCallbacks[newURI] = []
                  }
                  sf.fetchCallbacks[newURI] === sf.fetchCallbacks[newURI].concat(sf.fetchCallbacks[xhr.resource.uri])
                  delete sf.fetchCallbacks[xhr.resource.uri]
                }

                var xhr2 = sf.requestURI(newURI, xhr.resource, xhr.options, xhr.userCallback)
                if (xhr2) {
                  xhr2.proxyUsed = true // only try the proxy once
                  xhr2.original = xhr.original
                  console.log('Proxying but original still ' + xhr2.original)
                }
                if (xhr2 && xhr2.req) {
                  if (!xhr.options.noMeta) {
                    kb.add(xhr.req,
                      kb.sym('http://www.w3.org/2007/ont/link#redirectedRequest'),
                      xhr2.req,
                      sf.appNode)
                  }
                  return
                }
              }
            }

            xhr.status = 999 //
          }
        } // mashu
      } // function of event
    } // onerrorFactory

    // Set up callbacks
    var onreadystatechangeFactory = function (xhr) {
      return function () {
        var handleResponse = function () {
          if (xhr.handleResponseDone) return
          xhr.handleResponseDone = true
          var handler = null
          var thisReq = xhr.req // Might have changes by redirect
          sf.fireCallbacks('recv', args)
          var kb = sf.store
          sf.saveResponseMetadata(xhr, kb)
          sf.fireCallbacks('headers', [{uri: docuri, headers: xhr.headers}])

          // Check for masked errors.
          // For "security reasons" theboraser hides errors such as CORS errors from
          // the calling code (2015). oneror() used to be called but is not now.
          //
          if (xhr.status === 0) {
            console.log('Masked error - status 0 for ' + xhr.resource.uri)
            if (checkCredentialsRetry(xhr)) { // retry is could be credentials flag CORS issue
              return
            }
            xhr.status = 900 // unknown masked error
            return
          }
          if (xhr.status >= 400) { // For extra dignostics, keep the reply
            //  @@@ 401 should cause  a retry with credential son
            // @@@ cache the credentials flag by host ????
            if (xhr.status === 404) {
              kb.fetcher.nonexistant[xhr.resource.uri] = true
            }
            if (xhr.responseText.length > 10) {
              var response2 = kb.bnode()
              kb.add(response2, ns.http('content'), kb.literal(xhr.responseText), response2)
              if (xhr.statusText) {
                kb.add(response2, ns.http('statusText'), kb.literal(xhr.statusText), response2)
              }
            // dump("HTTP >= 400 responseText:\n"+xhr.responseText+"\n"); // @@@@
            }
            sf.failFetch(xhr, 'HTTP error for ' + xhr.resource + ': ' + xhr.status + ' ' + xhr.statusText)
            return
          }

          var loc = xhr.headers['content-location']

          // deduce some things from the HTTP transaction
          var addType = function (cla) { // add type to all redirected resources too
            var prev = thisReq
            if (loc) {
              var docURI = kb.any(prev, ns.link('requestedURI'))
              if (docURI !== loc) {
                kb.add(kb.sym(loc), ns.rdf('type'), cla, sf.appNode)
              }
            }
            for (;;) {
              var doc = kb.any(prev, ns.link('requestedURI'))
              if (doc && doc.value) {
                kb.add(kb.sym(doc.value), ns.rdf('type'), cla, sf.appNode)
              } // convert Literal
              prev = kb.any(undefined, kb.sym('http://www.w3.org/2007/ont/link#redirectedRequest'), prev)
              if (!prev) break
              var response = kb.any(prev, kb.sym('http://www.w3.org/2007/ont/link#response'))
              if (!response) break
              var redirection = kb.any(response, kb.sym('http://www.w3.org/2007/ont/http#status'))
              if (!redirection) break
              if (redirection !== '301' && redirection !== '302') break
            }
          }
          // This is a minimal set to allow the use of damaged servers if necessary
          var extensionToContentType = {
            'rdf': 'application/rdf+xml', 'owl': 'application/rdf+xml',
            'n3': 'text/n3', 'ttl': 'text/turtle', 'nt': 'text/n3', 'acl': 'text/n3',
            'html': 'text/html',
            'xml': 'text/xml'
          }
          var guess
          if (xhr.status === 200) {
            addType(ns.link('Document'))
            var ct = xhr.headers['content-type']
            if (options.forceContentType) {
              xhr.headers['content-type'] = options.forceContentType
            }
            if (!ct || ct.indexOf('application/octet-stream') >= 0) {
              guess = extensionToContentType[xhr.resource.uri.split('.').pop()]
              if (guess) {
                xhr.headers['content-type'] = guess
              }
            }
            if (ct) {
              if (ct.indexOf('image/') === 0 || ct.indexOf('application/pdf') === 0) addType(kb.sym('http://purl.org/dc/terms/Image'))
            }
            if (options.clearPreviousData) { // Before we parse new data clear old but only on 200
              kb.removeDocument(xhr.resource)
            }
          }
          // application/octet-stream; charset=utf-8

          if ($rdf.uri.protocol(xhr.resource.uri) === 'file' || $rdf.uri.protocol(xhr.resource.uri) === 'chrome') {
            if (options.forceContentType) {
              xhr.headers['content-type'] = options.forceContentType
            } else {
              guess = extensionToContentType[xhr.resource.uri.split('.').pop()]
              if (guess) {
                xhr.headers['content-type'] = guess
              } else {
                xhr.headers['content-type'] = 'text/xml'
              }
            }
          }

          // If we have alread got the thing at this location, abort
          if (loc) {
            var udoc = $rdf.uri.join(xhr.resource.uri, loc)
            if (!force && udoc !== xhr.resource.uri &&
                sf.requested[udoc] && sf.requested[udoc] === 'done') { // we have already fetched this in fact.
              // should we smush too?
              // $rdf.log.info("HTTP headers indicate we have already" + " retrieved " + xhr.resource + " as " + udoc + ". Aborting.")
              sf.doneFetch(xhr)
              xhr.abort()
              return
            }
            sf.requested[udoc] = true
          }

          for (var x = 0; x < sf.handlers.length; x++) {
            if (xhr.headers['content-type'] && xhr.headers['content-type'].match(sf.handlers[x].pattern)) {
              handler = new sf.handlers[x]()
              break
            }
          }

          sf.parseLinkHeader(xhr, thisReq)

          if (handler) {
            try {
              handler.handlerFactory(xhr)
            } catch (e) { // Try to avoid silent errors
              sf.failFetch(xhr, 'Exception handling content-type ' + xhr.headers['content-type'] + ' was: ' + e)
            }
          } else {
            sf.doneFetch(xhr) //  Not a problem, we just don't extract data.
            /*
            // sf.failFetch(xhr, "Unhandled content type: " + xhr.headers['content-type']+
            //        ", readyState = "+xhr.readyState)
            */
            return
          }
        }

        // DONE: 4
        // HEADERS_RECEIVED: 2
        // LOADING: 3
        // OPENED: 1
        // UNSENT: 0

        // $rdf.log.debug("web.js: XHR " + xhr.resource.uri + ' readyState='+xhr.readyState); // @@@@ comment me out

        switch (xhr.readyState) {
          case 0:
            var uri = xhr.resource.uri
            var newURI
            if (this.crossSiteProxyTemplate && (typeof document !== 'undefined') && document.location) { // In mashup situation
              var hostpart = $rdf.uri.hostpart
              var here = '' + document.location
              if (hostpart(here) && hostpart(uri) && hostpart(here) !== hostpart(uri)) {
                newURI = this.crossSiteProxyTemplate.replace('{uri}', encodeURIComponent(uri))
                sf.addStatus(xhr.req, 'BLOCKED -> Cross-site Proxy to <' + newURI + '>')
                if (xhr.aborted) return

                var kb = sf.store
                var oldreq = xhr.req
                kb.add(oldreq, ns.http('redirectedTo'), kb.sym(newURI), oldreq)

                // //////////// Change the request node to a new one:  @@@@@@@@@@@@ Duplicate?
                var newreq = xhr.req = kb.bnode() // Make NEW reqest for everything else
                kb.add(oldreq, ns.http('redirectedRequest'), newreq, xhr.req)

                var now = new Date()
                var timeNow = '[' + now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds() + '] '
                kb.add(newreq, ns.rdfs('label'), kb.literal(timeNow + ' Request for ' + newURI), this.appNode)
                kb.add(newreq, ns.link('status'), kb.collection(), this.appNode)
                kb.add(newreq, ns.link('requestedURI'), kb.literal(newURI), this.appNode)

                var response = kb.bnode()
                kb.add(oldreq, ns.link('response'), response)
                // kb.add(response, ns.http('status'), kb.literal(xhr.status), response)
                // if (xhr.statusText) kb.add(response, ns.http('statusText'), kb.literal(xhr.statusText), response)

                xhr.abort()
                xhr.aborted = true
                xhr.redirected = true

                sf.addStatus(oldreq, 'redirected XHR') // why

                if (sf.fetchCallbacks[xhr.resource.uri]) {
                  if (!sf.fetchCallbacks[newURI]) {
                    sf.fetchCallbacks[newURI] = []
                  }
                  sf.fetchCallbacks[newURI] === sf.fetchCallbacks[newURI].concat(sf.fetchCallbacks[xhr.resource.uri])
                  delete sf.fetchCallbacks[xhr.resource.uri]
                }

                sf.fireCallbacks('redirected', args) // Are these args right? @@@
                sf.requested[xhr.resource.uri] = 'redirected'

                var xhr2 = sf.requestURI(newURI, xhr.resource, xhr.options || {}, xhr.userCallback)
                if (xhr2 && xhr2.req) {
                  kb.add(
                    xhr.req,
                    kb.sym('http://www.w3.org/2007/ont/link#redirectedRequest'),
                    xhr2.req, sf.appNode
                  )
                  return
                }
              }
            }
            sf.failFetch(xhr, 'HTTP Blocked. (ReadyState 0) Cross-site violation for <' +
              docuri + '>')

            break

          case 3:
            // Intermediate state -- 3 may OR MAY NOT be called, selon browser.
            // handleResponse();   // In general it you can't do it yet as the headers are in but not the data
            break
          case 4:
            // Final state for this XHR but may be redirected
            handleResponse()
            // Now handle
            if (xhr.handle && xhr.responseText !== undefined) { // can be validly zero length
              if (sf.requested[xhr.resource.uri] === 'redirected') {
                break
              }
              sf.fireCallbacks('load', args)
              xhr.handle(function () {
                sf.doneFetch(xhr)
              })
            } else {
              if (xhr.redirected) {
                sf.addStatus(xhr.req, 'Aborted and redirected to new request.')
              } else {
                sf.addStatus(xhr.req, 'Fetch over. No data handled. Aborted = ' + xhr.aborted)
              }
            // sf.failFetch(xhr, "HTTP failed unusually. (no handler set) (x-site violation? no net?) for <"+
            //    docuri+">")
            }
            break
        } // switch
      }
    }

    // Map the URI to a localhost proxy if we are running on localhost
    // This is used for working offline, e.g. on planes.
    // Is the script istelf is running in localhost, then access all data in a localhost mirror.
    // Do not remove without checking with TimBL
    var uri2 = docuri
    if (typeof tabulator !== 'undefined' && tabulator.preferences.get('offlineModeUsingLocalhost')) {
      if (uri2.slice(0, 7) === 'http://' && uri2.slice(7, 17) !== 'localhost/') {
        uri2 = 'http://localhost/' + uri2.slice(7)
        $rdf.log.warn('Localhost kludge for offline use: actually getting <' + uri2 + '>')
      } else {
        // $rdf.log.warn("Localhost kludge NOT USED <" + uri2 + ">")
      }
    } else {
      // $rdf.log.warn("Localhost kludge OFF offline use: actually getting <" + uri2 + ">")
    }
    // 2014 probelm:
    // XMLHttpRequest cannot load http://www.w3.org/People/Berners-Lee/card.
    // A wildcard '*' cannot be used in the 'Access-Control-Allow-Origin' header when the credentials flag is true.
    // @ Many ontology files under http: and need CORS wildcard -> can't have withCredentials

    var withCredentials = (uri2.slice(0, 6) === 'https:') // @@ Kludge -- need for webid which typically is served from https
    if (options.withCredentials !== undefined) {
      withCredentials = options.withCredentials
    }
    var actualProxyURI = this.proxyIfNecessary(uri2)

    // Setup the request
    // var xhr
    // xhr = $rdf.Util.XMLHTTPFactory()
    xhr.onerror = onerrorFactory(xhr)
    xhr.onreadystatechange = onreadystatechangeFactory(xhr)
    xhr.timeout = sf.timeout
    xhr.withCredentials = withCredentials
    xhr.actualProxyURI = actualProxyURI

    xhr.req = req
    xhr.options = options
    xhr.options = options
    xhr.resource = docterm
    xhr.requestedURI = uri2

    xhr.ontimeout = function () {
      sf.failFetch(xhr, 'requestTimeout')
    }
    try {
      xhr.open('GET', actualProxyURI, this.async)
    } catch (er) {
      return this.failFetch(xhr, 'XHR open for GET failed for <' + uri2 + '>:\n\t' + er)
    }
    if (force) { // must happen after open
      xhr.setRequestHeader('Cache-control', 'no-cache')
    }

    // Set redirect callback and request headers -- alas Firefox Extension Only
    if (typeof tabulator !== 'undefined' &&
        tabulator.isExtension && xhr.channel &&
        ($rdf.uri.protocol(xhr.resource.uri) === 'http' ||
        $rdf.uri.protocol(xhr.resource.uri) === 'https')) {
      try {
        xhr.channel.notificationCallbacks = {
          getInterface: function (iid) {
            if (iid.equals(Components.interfaces.nsIChannelEventSink)) {
              return {
                onChannelRedirect: function (oldC, newC, flags) {
                  if (xhr.aborted) return
                  var kb = sf.store
                  var newURI = newC.URI.spec
                  var oldreq = xhr.req
                  if (!xhr.options.noMeta) {
                    sf.addStatus(xhr.req, 'Redirected: ' + xhr.status + ' to <' + newURI + '>')
                    kb.add(oldreq, ns.http('redirectedTo'), kb.sym(newURI), xhr.req)

                    // //////////// Change the request node to a new one:  @@@@@@@@@@@@ Duplicate code?
                    var newreq = xhr.req = kb.bnode() // Make NEW reqest for everything else
                    kb.add(oldreq, ns.http('redirectedRequest'), newreq, this.appNode)

                    var now = new Date()
                    var timeNow = '[' + now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds() + '] '
                    kb.add(newreq, ns.rdfs('label'), kb.literal(timeNow + ' Request for ' + newURI), this.appNode)
                    kb.add(newreq, ns.link('status'), kb.collection(), this.appNode)
                    kb.add(newreq, ns.link('requestedURI'), kb.literal(newURI), this.appNode)
                    // /////////////

                    // // $rdf.log.info('@@ sources onChannelRedirect'+
                    //               "Redirected: "+
                    //               xhr.status + " to <" + newURI + ">"); //@@
                    var response = kb.bnode()
                    // kb.add(response, ns.http('location'), newURI, response); Not on this response
                    kb.add(oldreq, ns.link('response'), response)
                    kb.add(response, ns.http('status'), kb.literal(xhr.status), response)
                    if (xhr.statusText) kb.add(response, ns.http('statusText'), kb.literal(xhr.statusText), response)
                  }
                  if (xhr.status - 0 !== 303) kb.HTTPRedirects[xhr.resource.uri] = newURI // same document as
                  if (xhr.status - 0 === 301 && rterm) { // 301 Moved
                    var badDoc = $rdf.uri.docpart(rterm.uri)
                    var msg = 'Warning: ' + xhr.resource + ' has moved to <' + newURI + '>.'
                    if (rterm) {
                      msg += ' Link in <' + badDoc + ' >should be changed'
                      kb.add(badDoc, kb.sym('http://www.w3.org/2007/ont/link#warning'), msg, sf.appNode)
                    }
                  // dump(msg+"\n")
                  }
                  xhr.abort()
                  xhr.aborted = true

                  if (sf.fetchCallbacks[xhr.resource.uri]) {
                    if (!sf.fetchCallbacks[newURI]) {
                      sf.fetchCallbacks[newURI] = []
                    }
                    sf.fetchCallbacks[newURI] === sf.fetchCallbacks[newURI].concat(sf.fetchCallbacks[xhr.resource.uri])
                    delete sf.fetchCallbacks[xhr.resource.uri]
                  }

                  sf.addStatus(oldreq, 'redirected') // why
                  sf.fireCallbacks('redirected', args) // Are these args right? @@@
                  sf.requested[xhr.resource.uri] = 'redirected'
                  sf.redirectedTo[xhr.resource.uri] = newURI

                  var hash = newURI.indexOf('#')
                  if (hash >= 0) {
                    if (!xhr.options.noMeta) {
                      kb.add(xhr.resource, kb.sym('http://www.w3.org/2007/ont/link#warning'),
                      'Warning: ' + xhr.resource + ' HTTP redirects to' + newURI + ' which should not contain a "#" sign')
                    }
                    newURI = newURI.slice(0, hash)
                  }
                  var xhr2 = sf.requestURI(newURI, xhr.resource, xhr.options, xhr.userCallback)
                  if (xhr2 && xhr2.req && !options.noMeta) {
                    kb.add(
                      xhr.req,
                      kb.sym('http://www.w3.org/2007/ont/link#redirectedRequest'),
                      xhr2.req,
                      sf.appNode
                    )
                  }
                // else dump("No xhr.req available for redirect from "+xhr.resource+" to "+newURI+"\n")
                },

                // See https://developer.mozilla.org/en/XPCOM_Interface_Reference/nsIChannelEventSink
                asyncOnChannelRedirect: function (oldC, newC, flags, callback) {
                  if (xhr.aborted) return
                  var kb = sf.store
                  var newURI = newC.URI.spec
                  var oldreq = xhr.req
                  sf.addStatus(xhr.req, 'Redirected: ' + xhr.status + ' to <' + newURI + '>')
                  kb.add(oldreq, ns.http('redirectedTo'), kb.sym(newURI), xhr.req)

                  // //////////// Change the request node to a new one:  @@@@@@@@@@@@ Duplicate?
                  var newreq = xhr.req = kb.bnode() // Make NEW reqest for everything else
                  // xhr.resource = docterm
                  // xhr.requestedURI = args[0]

                  // kb.add(kb.sym(newURI), ns.link("request"), req, this.appNode)
                  kb.add(oldreq, ns.http('redirectedRequest'), newreq, xhr.req)

                  var now = new Date()
                  var timeNow = '[' + now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds() + '] '
                  kb.add(newreq, ns.rdfs('label'), kb.literal(timeNow + ' Request for ' + newURI), this.appNode)
                  kb.add(newreq, ns.link('status'), kb.collection(), this.appNode)
                  kb.add(newreq, ns.link('requestedURI'), kb.literal(newURI), this.appNode)
                  // /////////////

                  // // $rdf.log.info('@@ sources onChannelRedirect'+
                  //               "Redirected: "+
                  //               xhr.status + " to <" + newURI + ">"); //@@
                  var response = kb.bnode()
                  // kb.add(response, ns.http('location'), newURI, response); Not on this response
                  kb.add(oldreq, ns.link('response'), response)
                  kb.add(response, ns.http('status'), kb.literal(xhr.status), response)
                  if (xhr.statusText) kb.add(response, ns.http('statusText'), kb.literal(xhr.statusText), response)

                  if (xhr.status - 0 !== 303) kb.HTTPRedirects[xhr.resource.uri] = newURI // same document as
                  if (xhr.status - 0 === 301 && rterm) { // 301 Moved
                    var badDoc = $rdf.uri.docpart(rterm.uri)
                    var msg = 'Warning: ' + xhr.resource + ' has moved to <' + newURI + '>.'
                    if (rterm) {
                      msg += ' Link in <' + badDoc + ' >should be changed'
                      kb.add(badDoc, kb.sym('http://www.w3.org/2007/ont/link#warning'), msg, sf.appNode)
                    }
                  // dump(msg+"\n")
                  }
                  xhr.abort()
                  xhr.aborted = true

                  var hash = newURI.indexOf('#')
                  if (hash >= 0) {
                    var msg2 = ('Warning: ' + xhr.resource + ' HTTP redirects to' + newURI + ' which do not normally contain a "#" sign')
                    // dump(msg+"\n")
                    kb.add(xhr.resource, kb.sym('http://www.w3.org/2007/ont/link#warning'), msg2)
                    newURI = newURI.slice(0, hash)
                  }
                  /*
                  if (sf.fetchCallbacks[xhr.resource.uri]) {
                    if (!sf.fetchCallbacks[newURI]) {
                      sf.fetchCallbacks[newURI] = []
                    }
                    sf.fetchCallbacks[newURI] = sf.fetchCallbacks[newURI].concat(sf.fetchCallbacks[xhr.resource.uri])
                    delete sf.fetchCallbacks[xhr.resource.uri]
                  }
                  */
                  sf.requested[xhr.resource.uri] = 'redirected'
                  sf.redirectedTo[xhr.resource.uri] = newURI

                  var xhr2 = sf.requestURI(newURI, xhr.resource, xhr.options, xhr.userCallback)
                  if (xhr2) { // may be no XHR is other URI already loaded
                    xhr2.original = xhr.original  // use this for finding base
                    if (xhr2.req) {
                      kb.add(
                        xhr.req,
                        kb.sym('http://www.w3.org/2007/ont/link#redirectedRequest'),
                        xhr2.req,
                        sf.appNode
                      )
                    }
                  }
                // else dump("No xhr.req available for redirect from "+xhr.resource+" to "+newURI+"\n")
                } // asyncOnChannelRedirect
              }
            }
            return Components.results.NS_NOINTERFACE
          }
        }
      } catch (err) {
        return sf.failFetch(xhr,
          "@@ Couldn't set callback for redirects: " + err)
      } // try
    } // if Firefox extension

    try {
      var acceptstring = ''
      for (var type in this.mediatypes) {
        // var attrstring = ''
        if (acceptstring !== '') {
          acceptstring += ', '
        }
        acceptstring += type
        for (var attr in this.mediatypes[type]) {
          acceptstring += ';' + attr + '=' + this.mediatypes[type][attr]
        }
      }
      xhr.setRequestHeader('Accept', acceptstring)
      this.addStatus(xhr.req, 'Accept: ' + acceptstring)

    // if (requester) { xhr.setRequestHeader('Referer',requester) }
    } catch (err) {
      throw new Error("Can't set Accept header: " + err)
    }

    // Fire
    try {
      xhr.send(null)
    } catch (er) {
      return this.failFetch(xhr, 'XHR send failed:' + er)
    }
    setTimeout(function () {
      if (xhr.readyState !== 4 && sf.isPending(xhr.resource.uri)) {
        sf.failFetch(xhr, 'requestTimeout')
      }
    },
      this.timeout)
    this.addStatus(xhr.req, 'HTTP Request sent.')
    return xhr
  } // this.requestURI()

  this.objectRefresh = function (term) {
    var uris = kb.uris(term) // Get all URIs
    if (typeof uris !== 'undefined') {
      for (var i = 0; i < uris.length; i++) {
        this.refresh(this.store.sym($rdf.uri.docpart(uris[i])))
      // what about rterm?
      }
    }
  }

  // deprecated -- use IndexedFormula.removeDocument(doc)
  this.unload = function (term) {
    this.store.removeMany(undefined, undefined, undefined, term)
    delete this.requested[term.uri] // So it can be loaded again
  }

  this.refresh = function (term, userCallback) { // sources_refresh
    this.fireCallbacks('refresh', arguments)
    this.requestURI(term.uri, undefined, { force: true, clearPreviousData: true }, userCallback)
  }

  this.retract = function (term) { // sources_retract
    this.store.removeMany(undefined, undefined, undefined, term)
    if (term.uri) {
      delete this.requested[$rdf.uri.docpart(term.uri)]
    }
    this.fireCallbacks('retract', arguments)
  }

  this.getState = function (docuri) {
    if (typeof this.requested[docuri] === 'undefined') {
      return 'unrequested'
    } else if (this.requested[docuri] === true) {
      return 'requested'
    } else if (this.requested[docuri] === 'done') {
      return 'fetched'
    } else if (this.requested[docuri] === 'redirected') {
      return this.getState(this.redirectedTo[docuri])
    } else { // An non-200 HTTP error status
      return 'failed'
    }
  }

  // doing anyStatementMatching is wasting time
  this.isPending = function (docuri) { // sources_pending
    // if it's not pending: false -> flailed 'done' -> done 'redirected' -> redirected
    return this.requested[docuri] === true
  }
  // var updatesVia = new $rdf.UpdatesVia(this) // Subscribe to headers
  // @@@@@@@@ This is turned off because it causes a websocket to be set up for ANY fetch
  // whether we want to track it ot not. including ontologies loaed though the XSSproxy
} // End of fetcher

$rdf.fetcher = function (store, timeout, async) { return new $rdf.Fetcher(store, timeout, async) }

// Parse a string and put the result into the graph kb
// Normal method is sync.
// Unfortunately jsdonld is currently written to need to be called async.
// Hence the mess beolow with executeCallback.

$rdf.parsable = {'text/n3': true, 'text/turtle': true, 'application/rdf+xml': true,
'application/xhtml+xml': true, 'text/html': true, 'application/ld+json': true }

$rdf.parse = function parse (str, kb, base, contentType, callback) {
  try {
    if (contentType === 'text/n3' || contentType === 'text/turtle') {
      var p = $rdf.N3Parser(kb, kb, base, base, null, null, '', null)
      p.loadBuf(str)
      executeCallback()
    } else if (contentType === 'application/rdf+xml') {
      var parser = new $rdf.RDFParser(kb)
      parser.parse($rdf.Util.parseXML(str), base, kb.sym(base))
      executeCallback()
    } else if (contentType === 'application/xhtml+xml') {
      $rdf.parseRDFaDOM($rdf.Util.parseXML(str, {contentType: 'application/xhtml+xml'}), kb, base)
      executeCallback()
    } else if (contentType === 'text/html') {
      $rdf.parseRDFaDOM($rdf.Util.parseXML(str, {contentType: 'text/html'}), kb, base)
      executeCallback()
    } else if (contentType === 'application/sparql-update') { // @@ we handle a subset
      $rdf.sparqlUpdateParser(str, kb, base)
      executeCallback()
    } else if (contentType === 'application/ld+json' ||
      contentType === 'application/nquads' ||
      contentType === 'application/n-quads') {
      var n3Parser = N3.Parser()
      var N3Util = N3.Util
      var triples = []

      if (contentType === 'application/ld+json') {
        var jsonDocument
        try {
          jsonDocument = JSON.parse(str)
        } catch (parseErr) {
          callback(parseErr, null)
        }
        jsonld.toRDF(jsonDocument,
          {format: 'application/nquads'},
          nquadCallback)
      } else {
        nquadCallback(null, str)
      }
    } else {
      throw new Error("Don't know how to parse " + contentType + ' yet')
    }
  } catch (e) {
    executeErrorCallback(e)
  }

  function executeCallback () {
    if (callback) {
      callback(null, kb)
    } else {
      return
    }
  }

  function executeErrorCallback (e) {
    if (contentType !== 'application/ld+json' ||
      contentType !== 'application/nquads' ||
      contentType !== 'application/n-quads') {
      if (callback) {
        callback(e, kb)
      } else {
        throw new Error('Error trying to parse <' + base + '> as ' +
          contentType + ':\n' + e + ':\n' + e.stack)
      }
    }
  }
/*
  function setJsonLdBase (doc, base) {
    if (doc instanceof Array) {
      return
    }
    if (!('@context' in doc)) {
      doc['@context'] = {}
    }
    doc['@context']['@base'] = base
  }
*/
  function nquadCallback (err, nquads) {
    if (err) {
      callback(err, kb)
    }
    try {
      n3Parser.parse(nquads, tripleCallback)
    } catch (err) {
      callback(err, kb)
    }
  }

  function tripleCallback (err, triple, prefixes) {
    if (err) {
      callback(err, kb)
    }
    if (triple) {
      triples.push(triple)
    } else {
      for (var i = 0; i < triples.length; i++) {
        addTriple(kb, triples[i])
      }
      callback(null, kb)
    }
  }

  function addTriple (kb, triple) {
    var subject = createTerm(triple.subject)
    var predicate = createTerm(triple.predicate)
    var object = createTerm(triple.object)
    var why = null
    if (triple.graph) {
      why = createTerm(triple.graph)
    }
    kb.add(subject, predicate, object, why)
  }

  function createTerm (termString) {
    var value
    if (N3Util.isLiteral(termString)) {
      value = N3Util.getLiteralValue(termString)
      var language = N3Util.getLiteralLanguage(termString)
      var datatype = new $rdf.NamedNode(N3Util.getLiteralType(termString))
      return new $rdf.Literal(value, language, datatype)
    } else if (N3Util.isIRI(termString)) {
      return new $rdf.NamedNode(termString)
    } else if (N3Util.isBlank(termString)) {
      value = termString.substring(2, termString.length)
      return new $rdf.BlankNode(value)
    } else {
      return null
    }
  }
} // $rdf.parse()

//   Serialize to the appropriate format
//
// Either
//
// @@ Currently NQuads and JSON/LD are deal with extrelemently inefficiently
// through mutiple conversions.
//
$rdf.serialize = function (target, kb, base, contentType, callback) {
  var documentString = null
  try {
    var sz = $rdf.Serializer(kb)
    var newSts = kb.statementsMatching(undefined, undefined, undefined, target)
    var n3String
    sz.suggestNamespaces(kb.namespaces)
    sz.setBase(base)
    switch (contentType) {
      case 'application/rdf+xml':
        documentString = sz.statementsToXML(newSts)
        return executeCallback(null, documentString)
      case 'text/n3':
      case 'text/turtle':
      case 'application/x-turtle': // Legacy
      case 'application/n3': // Legacy
        documentString = sz.statementsToN3(newSts)
        return executeCallback(null, documentString)
      case 'application/ld+json':
        n3String = sz.statementsToN3(newSts)
        $rdf.convert.convertToJson(n3String, callback)
        break
      case 'application/n-quads':
      case 'application/nquads': // @@@ just outpout the quads? Does not work for collections
        n3String = sz.statementsToN3(newSts)
        documentString = $rdf.convert.convertToNQuads(n3String, callback)
        break
      default:
        throw new Error('Serialize: Content-type ' + contentType + ' not supported for data write.')
    }
  } catch (err) {
    if (callback) {
      return (err)
    }
    throw err // Don't hide problems from caller in sync mode
  }

  function executeCallback (err, result) {
    if (callback) {
      callback(err, result)
      return
    } else {
      return result
    }
  }
}

// //////////////// JSON-LD code currently requires Node
//
//  Beware of bloat of the library! timbl
//

if (typeof $rdf.convert === 'undefined') $rdf.convert = {}

$rdf.convert.convertToJson = function (n3String, jsonCallback) {
  var jsonString
  var n3Parser = N3.Parser()
  var n3Writer = N3.Writer({
    format: 'N-Quads'
  })
  asyncLib.waterfall([
    function (callback) {
      n3Parser.parse(n3String, callback)
    },
    function (triple, prefix, callback) {
      if (triple !== null) {
        n3Writer.addTriple(triple)
      }
      if (typeof callback === 'function') {
        n3Writer.end(callback)
      }
    },
    function (result, callback) {
      try {
        jsonld.fromRDF(result, {
          format: 'application/nquads'
        }, callback)
      } catch (err) {
        callback(err)
      }
    },
    function (json, callback) {
      jsonString = JSON.stringify(json)
      jsonCallback(null, jsonString)
    }
  ], function (err, result) {
    jsonCallback(err, jsonString)
  }
  )
}

$rdf.convert.convertToNQuads = function (n3String, nquadCallback) {
  var nquadString
  var n3Parser = N3.Parser()
  var n3Writer = N3.Writer({
    format: 'N-Quads'
  })
  asyncLib.waterfall([
    function (callback) {
      n3Parser.parse(n3String, callback)
    },
    function (triple, prefix, callback) {
      if (triple !== null) {
        n3Writer.addTriple(triple)
      }
      if (typeof callback === 'function') {
        n3Writer.end(callback)
      }
    },
    function (result, callback) {
      nquadString = result
      nquadCallback(null, nquadString)
    }
  ], function (err, result) {
    nquadCallback(err, nquadString)
  }
  )
}

// ends
// Handle node, amd, and global systems
if (typeof exports !== 'undefined') {
  if (typeof module !== 'undefined' && module.exports) {
    exports = module.exports = $rdf
  }
  exports.$rdf = $rdf
} else {
  if (typeof define === 'function' && define.amd) {
    define([], function () {
      return $rdf
    })
  }

  // Leak a global regardless of module system
  root['$rdf'] = $rdf
}
$rdf.buildTime = "2016-05-11T17:28:02";
})(this);

},{"async":1,"jsonld":13,"n3":14,"xmldom":39,"xmlhttprequest":undefined}]},{},[])("rdflib")
});