
  'use strict';

  /***
   * @package Function
   * @dependency core
   * @description Lazy, throttled, and memoized functions, delayed functions and handling of timers, argument currying.
   *
   ***/

  function setDelay(fn, ms, after, scope, args) {
    // Delay of infinity is never called of course...
    if (ms === Infinity) return;
    if (!fn.timers) fn.timers = [];
    if (!isNumber(ms)) ms = 1;
    // This is a workaround for <= IE8, which apparently has the
    // ability to call timeouts in the queue on the same tick (ms?)
    // even if functionally they have already been cleared.
    fn._canceled = false;
    fn.timers.push(setTimeout(function() {
      if (!fn._canceled) {
        after.apply(scope, args || []);
      }
    }, ms));
  }

  function cancelFunction(fn) {
    var timers = fn.timers, timer;
    if (isArray(timers)) {
      while(timer = timers.shift()) {
        clearTimeout(timer);
      }
    }
    fn._canceled = true;
    return fn;
  }

  function createLazyFunction(fn, ms, immediate, limit) {
    var queue = [], locked = false, execute, rounded, perExecution, result;
    ms = ms || 1;
    limit = limit || Infinity;
    rounded = ceil(ms);
    perExecution = round(rounded / ms) || 1;
    execute = function() {
      var queueLength = queue.length, maxPerRound;
      if (queueLength == 0) return;
      // Allow fractions of a millisecond by calling
      // multiple times per actual timeout execution
      maxPerRound = max(queueLength - perExecution, 0);
      while(queueLength > maxPerRound) {
        // Getting uber-meta here...
        result = func.prototype.apply.apply(fn, queue.shift());
        queueLength--;
      }
      setDelay(lazy, rounded, function() {
        locked = false;
        execute();
      });
    }
    function lazy() {
      // If the execution has locked and it's immediate, then
      // allow 1 less in the queue as 1 call has already taken place.
      if (queue.length < limit - (locked && immediate ? 1 : 0)) {
        // Optimized: no leaking arguments
        var args = [], $i; for($i = 0; $i < arguments.length; $i++) args.push(arguments[$i]);
        queue.push([this, args]);
      }
      if (!locked) {
        locked = true;
        if (immediate) {
          execute();
        } else {
          setDelay(lazy, rounded, execute);
        }
      }
      // Return the memoized result
      return result;
    }
    return lazy;
  }

  function stringifyArguments() {
    var str = '';
    for (var i = 0; i < arguments.length; i++) {
      str += stringify(arguments[i]);
    }
    return str;
  }

  function createMemoizedFunction(fn, hashFn) {
    var cache = {};
    if (!hashFn) {
      hashFn = stringifyArguments;
    }
    return function memoized() {
      var key = hashFn.apply(this, arguments);
      if (hasOwnProperty(cache, key)) {
        return cache[key];
      }
      return cache[key] = fn.apply(this, arguments);
    }
  }

  extend(func, {

     /***
     * @method lazy([ms] = 1, [immediate] = false, [limit] = Infinity)
     * @returns Function
     * @short Creates a lazy function that, when called repeatedly, will queue execution and wait [ms] milliseconds to execute.
     * @extra If [immediate] is %true%, first execution will happen immediately, then lock. If [limit] is a fininte number, calls past [limit] will be ignored while execution is locked. Compare this to %throttle%, which will execute only once per [ms] milliseconds. Note that [ms] can also be a fraction. Calling %cancel% on a lazy function will clear the entire queue. For more see %functions%.
     * @example
     *
     *   (function() {
     *     // Executes immediately.
     *   }).lazy()();
     *   (3).times(function() {
     *     // Executes 3 times, with each execution 20ms later than the last.
     *   }.lazy(20));
     *   (100).times(function() {
     *     // Executes 50 times, with each execution 20ms later than the last.
     *   }.lazy(20, false, 50));
     *
     ***/
    'lazy': function(ms, immediate, limit) {
      return createLazyFunction(this, ms, immediate, limit);
    },

     /***
     * @method throttle([ms] = 1)
     * @returns Function
     * @short Creates a "throttled" version of the function that will only be executed once per <ms> milliseconds.
     * @extra This is functionally equivalent to calling %lazy% with a [limit] of %1% and [immediate] as %true%. %throttle% is appropriate when you want to make sure a function is only executed at most once for a given duration. For more see %functions%.
     * @example
     *
     *   (3).times(function() {
     *     // called only once. will wait 50ms until it responds again
     *   }.throttle(50));
     *
     ***/
    'throttle': function(ms) {
      return createLazyFunction(this, ms, true, 1);
    },

     /***
     * @method debounce([ms] = 1)
     * @returns Function
     * @short Creates a "debounced" function that postpones its execution until after <ms> milliseconds have passed.
     * @extra This method is useful to execute a function after things have "settled down". A good example of this is when a user tabs quickly through form fields, execution of a heavy operation should happen after a few milliseconds when they have "settled" on a field. For more see %functions%.
     * @example
     *
     *   var fn = (function(arg1) {
     *     // called once 50ms later
     *   }).debounce(50); fn(); fn(); fn();
     *
     ***/
    'debounce': function(ms) {
      var fn = this;
      function debounced() {
        // Optimized: no leaking arguments
        var args = [], $i; for($i = 0; $i < arguments.length; $i++) args.push(arguments[$i]);
        cancelFunction(debounced);
        setDelay(debounced, ms, fn, this, args);
      };
      return debounced;
    },

     /***
     * @method delay([ms] = 1, [arg1], ...)
     * @returns Function
     * @short Executes the function after <ms> milliseconds.
     * @extra Returns a reference to itself. %delay% is also a way to execute non-blocking operations that will wait until the CPU is free. Delayed functions can be canceled using the %cancel% method. Can also curry arguments passed in after <ms>.
     * @example
     *
     *   (function(arg1) {
     *     // called 1s later
     *   }).delay(1000, 'arg1');
     *
     ***/
    'delay': function(ms) {
      var fn = this;
      // Optimized: no leaking arguments
      var args = [], $i; for($i = 1; $i < arguments.length; $i++) args.push(arguments[$i]);
      setDelay(fn, ms, fn, fn, args);
      return fn;
    },

     /***
     * @method every([ms] = 1, [arg1], ...)
     * @returns Function
     * @short Executes the function every <ms> milliseconds.
     * @extra Returns a reference to itself. %every% uses %setTimeout%, which means that you are guaranteed a period of idle time equal to [ms] after execution has finished. Compare this to %setInterval% which will try to run a function every [ms], even when execution itself takes up a portion of that time. In most cases avoiding %setInterval% is better as calls won't "back up" when the CPU is under strain, however this also means that calls are less likely to happen at exact intervals of [ms], so the use case here should be considered. Additionally, %every% can curry arguments passed in after [ms], and also be canceled with %cancel%.
     * @example
     *
     *   (function(arg1) {
     *     // called every 1s
     *   }).every(1000, 'arg1');
     *
     ***/
    'every': function(ms) {
      // Optimized: no leaking arguments
      var args = [], $i; for($i = 1; $i < arguments.length; $i++) args.push(arguments[$i]);
      var fn = this;
      function execute () {
        // Set the delay first here, so that cancel
        // can be called within the executing function.
        setDelay(fn, ms, execute);
        fn.apply(fn, args);
      }
      setDelay(fn, ms, execute);
      return fn;
    },

     /***
     * @method cancel()
     * @returns Function
     * @short Cancels a delayed function scheduled to be run.
     * @extra %delay%, %lazy%, %throttle%, and %debounce% can all set delays.
     * @example
     *
     *   (function() {
     *     alert('hay'); -> Never called
     *   }).delay(500).cancel();
     *
     ***/
    'cancel': function() {
      return cancelFunction(this);
    },

     /***
     * @method after([num] = 1)
     * @returns Function
     * @short Creates a function that will execute after [num] calls.
     * @extra %after% is useful for running a final callback after a series of asynchronous operations, when the order in which the operations will complete is unknown.
     * @example
     *
     *   var fn = (function() {
     *     // Will be executed once only
     *   }).after(3); fn(); fn(); fn();
     *
     ***/
    'after': function(num) {
      var fn = this, counter = 0, storedArguments = [];
      if (!isNumber(num)) {
        num = 1;
      } else if (num === 0) {
        fn.call();
        return fn;
      }
      return function() {
        var ret;
        // Optimized: no leaking arguments
        var args = [], $i; for($i = 0; $i < arguments.length; $i++) args.push(arguments[$i]);
        storedArguments.push(args);
        counter++;
        if (counter == num) {
          ret = fn.call(this, storedArguments);
          counter = 0;
          storedArguments = [];
          return ret;
        }
      }
    },

     /***
     * @method once()
     * @returns Function
     * @short Creates a function that will execute only once and store the result.
     * @extra %once% is useful for creating functions that will cache the result of an expensive operation and use it on subsequent calls. Also it can be useful for creating initialization functions that only need to be run once.
     * @example
     *
     *   var fn = (function() {
     *     // Will be executed once only
     *   }).once(); fn(); fn(); fn();
     *
     ***/
    'once': function() {
      // noop always returns "undefined" as the cache key.
      return createMemoizedFunction(this, function() {});
    },

     /***
     * @method memoize([fn])
     * @returns Function
     * @short Creates a function that will cache results for unique calls.
     * @extra %memoize% can be thought of as a more power %once%. Where %once% will only call a function once ever, memoized functions will be called once per unique call. A "unique call" is determined by the result of [fn], which is a hashing function. If empty, [fn] will stringify all arguments, such that any different argument signature will result in a unique call. This includes objects passed as arguments, which will be deep inspected to produce the cache key.
     * @example
     *
     *   var fn = (function() {
     *     // Will be executed twice, returning the memoized
     *     // result of the first call again on the last.
     *   }).memoize(); fn(1); fn(2); fn(1);
     *
     ***/
    'memoize': function(fn) {
      return createMemoizedFunction(this, fn);
    },

     /***
     * @method fill(<arg1>, <arg2>, ...)
     * @returns Function
     * @short Returns a new version of the function which when called will have some of its arguments pre-emptively filled in, also known as "currying".
     * @extra Arguments passed to a "filled" function are generally appended to the curried arguments. However, if %undefined% is passed as any of the arguments to %fill%, it will be replaced, when the "filled" function is executed. This allows currying of arguments even when they occur toward the end of an argument list (the example demonstrates this much more clearly).
     * @example
     *
     *   var delayOneSecond = setTimeout.fill(undefined, 1000);
     *   delayOneSecond(function() {
     *     // Will be executed 1s later
     *   });
     *
     ***/
    'fill': function() {
      // Optimized: no leaking arguments
      var curried = [], $i; for($i = 0; $i < arguments.length; $i++) curried.push(arguments[$i]);
      var fn = this;
      return function() {
        var argIndex = 0, result = [];
        for (var i = 0; i < curried.length; i++) {
          if (curried[i] != null) {
            result[i] = curried[i];
          } else {
            result[i] = arguments[i];
            argIndex++;
          }
        }
        for (var i = argIndex; i < arguments.length; i++) {
          result.push(arguments[i]);
        }
        return fn.apply(this, result);
      }
    }


  });

