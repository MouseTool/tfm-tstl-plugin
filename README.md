# tfm-tstl-plugin

Provides the plugin for bundling [TypeScriptToLua](https://github.com/TypeScriptToLua/TypeScriptToLua) code into Transformice-compatible Lua code.

Recommend coupling this plugin with [tfm-tstl-types](https://www.npmjs.com/package/tfm-tstl-types) to extend Intellisense with Transformice environment definition. 

## Install

1. Get this package from npm

```sh
npm install -D tfm-tstl-plugin
# or
yarn add -D tfm-tstl-plugin
```

2. Modify your tsconfig.json

```diff
{
  "tstl": {
    "buildMode": "default",
    "luaBundle": "bundle.lua",
    "luaBundleEntry": "src/main.ts",
    "luaPlugins": [
+      {"name": "tfm-tstl-plugin"}
    ],
    "luaTarget": "5.2"
  }
}
```
