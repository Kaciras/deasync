# DeAsync

[![Npm Version](https://img.shields.io/npm/v/@kaciras/deasync)](https://www.npmjs.com/package/@kaciras/deasync)
![node-current (scoped)](https://img.shields.io/node/v/@kaciras/deasync)
[![Test](https://github.com/Kaciras/deasync/actions/workflows/test.yml/badge.svg)](https://github.com/Kaciras/deasync/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/Kaciras/deasync/branch/master/graph/badge.svg?token=ST7ROWQH0Z)](https://codecov.io/gh/Kaciras/deasync)
[![GitHub license](https://img.shields.io/github/license/Kaciras/deasync)](https://github.com/Kaciras/deasync/blob/master/LICENSE)

DeAsync turns async code into sync, implemented with a blocking mechanism by calling Node.js event loop at JavaScript layer. The core of deasync is written in C++.

This project is forked from [abbr/deasync](https://github.com/abbr/deasync) and rewritten in modern code. There are some new features added: Types, Promise support, and prebuild binaries.

## Motivation

Suppose you maintain a library that exposes a function `getData`. Your users call it to get actual data:   
`const myData = getData()`  
Under the hood data is saved in a file so you implemented `getData` using Node.js built-in `fs.readFileSync`. It's obvious both `getData` and `fs.readFileSync` are sync functions. One day you were told to switch the underlying data source to a repo such as MongoDB which can only be accessed asynchronously. You were also told for backward compatibility, `getData` API cannot be changed to return merely a promise or demand a callback parameter. How do you meet both requirements?

You may tempted to use [node-fibers](https://github.com/laverdet/node-fibers) or a module derived from it, but node fibers can only wrap async function call into a sync function inside a fiber. In the case above you cannot assume all  callers are inside fibers. On the other hand, if you start a fiber in `getData` then `getData` itself will still return immediately without waiting for the async call result. For similar reason ES6 generators introduced in Node v0.11 won't work either. 

What really needed is a way to block subsequent JavaScript from running without blocking entire thread by yielding to allow other events in the event loop to be handled. Ideally the blockage is removed as soon as the result of async function is available. A less ideal but often acceptable alternative is a `sleep` function which you can use to implement the blockage like ```while(!done) sleep(100);```. It is less ideal because sleep duration has to be guessed. It is important the `sleep` function not only shouldn't block entire thread, but also shouldn't incur busy wait that pegs the CPU to 100%. 

DeAsync supports both alternatives.

## Installation

```shell
npm install @kaciras/deasync
```

DeAsync downloads prebuild binary from GitHub releases during installation, if the download fails, try to build locally. You can skip the installation phase by set environment variable `NO_PREBUILD=1`.

DeAsync uses node-gyp to compile C++ source code, so to build Deasync you may need the compilers listed in [node-gyp](https://github.com/nodejs/node-gyp).

## Usage

DeAsync exports only two APIs: `deasync` for callback-style functions, and `awaitSync` for Promises.

### `deasync(function)`

Generic wrapper of async function with conventional API signature `function(...args, (error, result) => {})`. Returns `result` and throws `error` as exception if not null.

Sleep (a wrapper of setTimeout):

```javascript
const { deasync } = require("@kaciras/deasync");

const sleep = deasync((timeout, done) => {
	setTimeout(() => done(null, "wake up!"), timeout);
});

console.log("Timestamp before: " + performance.now());
console.log(sleep(1000));
console.log("Timestamp after: " + performance.now());
```

### `awaitSync(promise)`

Similar with the keyword `await` but synchronously.

```javascript
const { awaitSync } = require("@kaciras/deasync");
const { performance } = require("perf_hooks");

const promise = new Promise(resolve => setTimeout(resolve, 1000)).then(() => "wake up!")

console.log("Timestamp before: " + performance.now());
console.log(awaitSync(promise));
console.log("Timestamp after: " + performance.now());
```

## Recommendation

Unlike other (a)sync js packages that mostly have only syntactic impact, DeAsync also changes code execution sequence. As such, it is intended to solve niche cases like the above one. If all you are facing is syntactic problem such as callback hell, using a less drastic package implemented in pure js is recommended.
