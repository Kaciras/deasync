# DeAsync

[![Npm Version](https://img.shields.io/npm/v/@kaciras/deasync)](https://www.npmjs.com/package/@kaciras/deasync)
[![npm provenance](https://img.shields.io/badge/npm-provenance-brightgreen?logo=npm)](https://www.npmjs.com/package/@kaciras/deasync#provenance)
[![Test](https://github.com/Kaciras/deasync/actions/workflows/test.yml/badge.svg)](https://github.com/Kaciras/deasync/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/Kaciras/deasync/branch/master/graph/badge.svg?token=ST7ROWQH0Z)](https://codecov.io/gh/Kaciras/deasync)
![Static Badge](https://img.shields.io/badge/dependencies-0-46c018)

DeAsync turns async code into sync, implemented with a blocking mechanism by calling Node.js event loop at JavaScript layer. The core of deasync is written in C++.

This project is forked from [abbr/deasync](https://github.com/abbr/deasync) and rewritten in modern code, **adding new features: types, Promise support, and prebuild binaries.**

The benefit of this package over [synckit](https://github.com/un-ts/synckit), [await-sync](https://github.com/jimmywarting/await-sync) and others libs is that this runs your code in the current context, so parameters and the return value of your function are no need to be serializable, you are free to pass `Symbol`, functions, and classes.

> [!WARNING]
> 
> Due to `MicrotaskQueue::PerformCheckpoint` and [`uv_run()` is not reentrant](https://docs.libuv.org/en/v1.x/loop.html#c.uv_run), calling `runLoopOnce` and deasynced functions them from asynchronous callbacks can lead to deadlocks.

## Usage

```shell
npm install @kaciras/deasync
```

### `deasync(function)`

Generic wrapper of async function with conventional API signature `function(...args, (error, result) => {})`. Returns `result` and throws `error` as exception if not null.

Sleep (a wrapper of setTimeout):

```javascript
const { deasync } = require("@kaciras/deasync");

const sleep = deasync((timeout, callback) => {
	setTimeout(() => callback(null, "wake up!"), timeout);
});

console.log("Timestamp before: " + performance.now());
console.log(sleep(1000));
console.log("Timestamp after: " + performance.now());
```

### `awaitSync(promise)`

Similar with the keyword `await` but synchronously.

```javascript
const { awaitSync } = require("@kaciras/deasync");

const promise = new Promise(resolve => setTimeout(resolve, 1000)).then(() => "wake up!")

console.log("Timestamp before: " + performance.now());
console.log(awaitSync(promise));
console.log("Timestamp after: " + performance.now());
```

### `uvRun()`

Run pending callbacks of macro tasks in the event loop.

```javascript
const { uvRun } = require("@kaciras/deasync");

let called = false;
setImmediate(() => called = true);

uvRun();
console.log(`Called is ${called}`); // Called is true
```

### `runLoopOnce()`

Run micro task callbacks until the queue has been exhausted, then run pending callbacks of macro tasks.

- If a new micro task callback enqueued when executing another, it will also be executed.
- Callbacks enqueued in macro task callback will not be executed.

### `loopWhile(predicate)`

For async function with unconventional API, for instance function asyncFunction(p1,function cb(res){}), use loopWhile(predicateFunc) where predicateFunc is a function that returns boolean loop condition.

```javascript
let done = false;
let data;
asyncFunction(p1, res => {
	data = res;
	done = true;
});
require('deasync').loopWhile(() => !done);
// data is now populated
```

## Recommendation

DeAsync changes code execution sequence and the task scheduling, which typically degrades performance. The primary use case for DeAsync is compatibility with legacy code that does not support asynchronous. If all you are facing is syntactic problem such as callback hell, using a less drastic package implemented in pure js is recommended.
