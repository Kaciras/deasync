#include <node.h>
#include <v8.h>

using namespace v8;

static Handle<Value> Run(const Arguments& args) {
  HandleScope scope;

  uv_run(uv_default_loop(), UV_RUN_ONCE);

  return scope.Close(Undefined());
}

static void Init(Handle<Object> target) {
  node::SetMethod(target, "run", Run);
}

NODE_MODULE(deasync, Init)