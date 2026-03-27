# tfm-tstl-plugin

Provides the plugin for bundling [TypeScriptToLua](https://github.com/TypeScriptToLua/TypeScriptToLua) (TSTL) code into Transformice-compatible Lua code.

Need type definitions for Transformice? Check out [tfm-tstl-types](https://www.npmjs.com/package/tfm-tstl-types).

## Install

1. Get this [package](https://www.npmjs.com/package/tfm-tstl-plugin) from npm

```sh
npm install -D tfm-tstl-plugin
# or
bun add --dev tfm-tstl-plugin
```

2. Modify your `tsconfig.json`

```diff
{
  "tstl": {
    "buildMode": "default",
    "luaBundle": "bundle.lua",
    "luaBundleEntry": "src/main.ts",
    "luaPlugins": [
+      {"name": "tfm-tstl-plugin"}
    ],
    "luaTarget": "5.2",
    "luaLibImport": "require-minimal"
  }
}
```

## Compatibility

The plugin will always have best compatibility with the version of TSTL specified under `devDependencies` in the [`package.json`](./package.json).

Other versions of TSTL may work, but will not guaranteed given possible API changes. This is also due to the fact that the plugin relies on undocumented hacks (e.g. regex replacement after bundling) that may not be supported over time.
