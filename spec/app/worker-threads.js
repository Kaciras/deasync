const { Worker, isMainThread } = require('worker_threads')

if (isMainThread) {
  new Worker(__filename)
} else {
  const deasync = require('../../index.js')
  deasync.sleep(100)
}
