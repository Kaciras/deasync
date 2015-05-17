#include <uv.h>
#include <v8.h>
#include <nan.h>

using namespace v8;

NAN_METHOD(Run) {
  NanScope();
  uv_run(uv_default_loop(), UV_RUN_ONCE);
  NanReturnValue(NanUndefined());
}

void Init(Handle<Object> exports) {
  exports->Set(NanNew<String>("run"),
    NanNew<FunctionTemplate>(Run)->GetFunction());
}

NODE_MODULE(deasync, Init)
