(function () {
  'use strict';
  // Contains all performance observers listenening to custom entries.
  const customObservers = new Set();
  // Map from EVERY performance observer to its listener.
  const observerListeners = new WeakMap();

  const originalObserve = PerformanceObserver.prototype.observe;

  // TODO - what if we observe multiple times?
  // TODO - implement disconnect.
  PerformanceObserver.prototype.observe = function(args) {
    let nonCustomTypes = [];
    for (const type of args.entryTypes) {
      if (type == "custom") {
        customObservers.add(this);
      } else {
        nonCustomTypes.push(type);
      }
    }

    if (nonCustomTypes.length > 0) {
      args.entryTypes = nonCustomTypes;
      originalObserve.call(this, args);
    }
  }

  const originalProto = PerformanceObserver.prototype;
  PerformanceObserver = function(listener) {
    const result = new originalProto.constructor(listener);
    observerListeners.set(result, listener);
    return result;
  }
  PerformanceObserver.prototype = originalProto;

  performance.queueEntry = function(name, startTime, duration, data) {
    const performanceEntry = {};
    performanceEntry.prototype = PerformanceEntry;
    performanceEntry.entryType = "custom";
    performanceEntry.name = name;
    performanceEntry.startTime = startTime;
    performanceEntry.duration = duration;
    performanceEntry.data = data;

    for (const observer of customObservers) {
      const listener = observerListeners.get(observer);
      const list = {};
      list.prototype = PerformanceObserverEntryList;
      // TODO - override other methods.
      list.getEntries = function() {
        return [performanceEntry];
      }

      listener.call(this, list);
    };
  }
})()
