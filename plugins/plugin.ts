import ts from "typescript";
import * as tstl from "typescript-to-lua";
import { CompilerOptions, isBundleEnabled } from "typescript-to-lua";
import { transformLuaLibFunction } from "typescript-to-lua/dist/transformation/utils/lualib";
import { TfmCustomPrinter } from "./printer";
import { basename } from "./utils";

const entrypointRegex = /return (require\("[\w.]+", \.{3}\))\s*$/;
const plugin: tstl.Plugin = {
  beforeEmit(
    program: ts.Program,
    options: tstl.CompilerOptions,
    emitHost: tstl.EmitHost,
    result: tstl.EmitFile[]
  ) {
    //const diag : ts.Diagnostic[] = []
    if (!isBundleEnabled(options)) return;

    const bundle = result[0];
    console.assert(bundle != null);

    let prependCode = `--[[\n    ${basename(
      bundle.outputPath
    )}\n    Generated on ${new Date().toUTCString()}\n    https://github.com/TypeScriptToLua/TypeScriptToLua\n]]--\n`;

    prependCode += `_VERSION = "Lua 5.2"\n`;

    prependCode += `do
    local raw_print, raw_xpcall = print, xpcall
    local oTableConcat, oUnpack = table.concat, table.unpack
    _G.__TS__originalPrint = raw_print
    _G.__TS__originalXpcall = raw_xpcall
    print = function(...)
        local args = {...}
        local nargs = select('#', ...)
        local segments = {}
        for i = 1, nargs do
            segments[i] = tostring(args[i])
        end
        return raw_print(oTableConcat(segments, "\t"))
    end
    xpcall = function(f, msgh, ...)
        local args, nargs = {...}, select("#", ...)
        return raw_xpcall(function()
            return f(oUnpack(args, 1, nargs))
        end, msgh)
    end
end
`;

    prependCode += `do
    local raw_print, raw_xpcall = print, xpcall
    local oTableConcat, oUnpack = table.concat, table.unpack
    _G.__TS__originalPrint = raw_print
    _G.__TS__originalXpcall = raw_xpcall
    print = function(...)
        local args = {...}
        local nargs = select('#', ...)
        local segments = {}
        for i = 1, nargs do
            segments[i] = tostring(args[i])
        end
        return raw_print(oTableConcat(segments, "\t"))
    end
    xpcall = function(f, msgh, ...)
        local args, nargs = {...}, select("#", ...)
        return raw_xpcall(function()
            return f(oUnpack(args, 1, nargs))
        end, msgh)
    end
end
`;

    if (options.sourceMapTraceback) {
      prependCode += `do
    debug.getinfo = function(level)
        return { short_src = string.match(debug.traceback(nil, 1), "(%S+%.lua):%d+") }
    end
end
`;
    }

    bundle.code = prependCode + bundle.code;

    const entrypointMatch = bundle.code.match(entrypointRegex);
    if (!entrypointMatch) {
      throw new Error("cannot match entrypoint require");
    }
    const [_, entrypointRequire] = entrypointMatch;

    bundle.code = bundle.code.replace(entrypointRegex, entrypointRequire) + "\n";
  },

  printer: (
    program: ts.Program,
    emitHost: tstl.EmitHost,
    fileName: string,
    file: tstl.File
  ) => new TfmCustomPrinter(emitHost, program, fileName).print(file),

  /*visitors: {
    [ts.SyntaxKind.AwaitExpression]: (node, context) => {
      return transformLuaLibFunction()
    }
  }*/
};

export default plugin;
