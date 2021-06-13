# DeAsync

[![Npm Version](https://img.shields.io/npm/v/@kaciras/deasync)](https://www.npmjs.com/package/@kaciras/deasync)
[![Build Status](https://www.travis-ci.com/Kaciras/deasync.svg?branch=master)](https://www.travis-ci.com/Kaciras/deasync)

DeAsync turns async code into sync, implemented with a blocking mechanism by calling Node.js event loop at JavaScript layer. The core of deasync is writen in C++.

This project is a fork from [abbr/deasync](https://github.com/abbr/deasync) and rewrite with modern code. There are some new features added: TypeScript types, Promise support, and prebuild binaries.

## Motivation

Suppose you maintain a library that exposes a function `getData`. Your users call it to get actual data:   
`const myData = getData()`  
Under the hood data is saved in a file so you implemented `getData` using Node.js built-in `fs.readFileSync`. It's obvious both `getData` and `fs.readFileSync` are sync functions. One day you were told to switch the underlying data source to a repo such as MongoDB which can only be accessed asynchronously. You were also told to avoid pissing off your users, `getData` API cannot be changed to return merely a promise or demand a callback parameter. How do you meet both requirements?

You may tempted to use [node-fibers](https://github.com/laverdet/node-fibers) or a module derived from it, but node fibers can only wrap async function call into a sync function inside a fiber. In the case above you cannot assume all  callers are inside fibers. On the other hand, if you start a fiber in `getData` then `getData` itself will still return immediately without waiting for the async call result. For similar reason ES6 generators introduced in Node v0.11 won't work either. 

What really needed is a way to block subsequent JavaScript from running without blocking entire thread by yielding to allow other events in the event loop to be handled. Ideally the blockage is removed as soon as the result of async function is available. A less ideal but often acceptable alternative is a `sleep` function which you can use to implement the blockage like ```while(!done) sleep(100);```. It is less ideal because sleep duration has to be guessed. It is important the `sleep` function not only shouldn't block entire thread, but also shouldn't incur busy wait that pegs the CPU to 100%. 

DeAsync supports both alternatives.

## Installation

```npm install @kaciras/deasync```

By default, Deasync downloads prebuild binary from GitHub releases

Except on a few [platforms + Node version combinations](https://github.com/abbr/deasync-bin) where binary distribution is included, DeAsync uses node-gyp to compile C++ source code so you may need the compilers listed in [node-gyp](https://github.com/TooTallNate/node-gyp). You may also need to [update npm's bundled node-gyp](https://github.com/TooTallNate/node-gyp/wiki/Updating-npm's-bundled-node-gyp).

## Usages

### `deasync(function)`

Generic wrapper of async function with conventional API signature `function(p1,...pn, (error,result) => {})`. Returns `result` and throws `error` as exception if not null.

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

The `awaitSync` causes execution to pause until a Promise is settled (that is, fulfilled or rejected), and to resume execution of the async function after fulfillment. When resumed, the returned value of the `awaitSync` is that of the fulfilled Promise. If the Promise is rejected, the `awaitSync` throws the rejected value.

This function is similar with keyword `await` but synchronously.

```javascript
const { awaitSync } = require("@kaciras/deasync");
const { performance } = require("perf_hooks");

async function sleep(time) {
	await new Promise(resolve => setTimeout(resolve, time));
	return "wake up!";
}

console.log("Timestamp before: " + performance.now());
console.log(awaitSync(sleep(1000)));
console.log("Timestamp after: " + performance.now());
```

## Recommendation

Unlike other (a)sync js packages that mostly have only syntactic impact, DeAsync also changes code execution sequence. As such, it is intended to solve niche cases like the above one. If all you are facing is syntatic problem such as callback hell, using a less drastic package implemented in pure js is recommended.
