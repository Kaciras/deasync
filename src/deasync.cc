#include <node.h>
#include <v8.h>

using namespace v8;
uv_idle_t idler;

static void crunch_away(uv_idle_t* handle, int status) {
    uv_idle_stop(handle);
}

static Handle<Value> Run(const Arguments& args) {
  HandleScope scope;
  uv_idle_start(&idler, crunch_away);
  uv_run(uv_default_loop(), UV_RUN_ONCE);
  return scope.Close(Undefined());
}

static void Init(Handle<Object> target) {
  node::SetMethod(target, "run", Run);
  uv_idle_init(uv_default_loop(), &idler);
}

NODE_MODULE(deasync, Init)
