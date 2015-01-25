#include <uv.h>
#include <v8.h>
#include <nan.h>

using namespace v8;
uv_idle_t idler;

static void crunch_away(uv_idle_t* handle) {
    uv_idle_stop(handle);
}

NAN_METHOD(Run) {
  NanScope();
  uv_idle_start(&idler, (uv_idle_cb) crunch_away);
  uv_run(uv_default_loop(), UV_RUN_ONCE);
  NanReturnValue(NanUndefined());
}

void Init(Handle<Object> exports) {
  exports->Set(NanNew<String>("run"),
    NanNew<FunctionTemplate>(Run)->GetFunction());
  uv_idle_init(uv_default_loop(), &idler);
}

NODE_MODULE(deasync, Init)
