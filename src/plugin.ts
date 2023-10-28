import ts from "typescript";
import * as tstl from "typescript-to-lua";
import { TfmCustomPrinter } from "./printer";
import { transformContinueStatementLegacy } from "./visitors";

const entrypointRegex = /return (require\("[\w.]+", \.{3}\))\s*$/;

const plugin: tstl.Plugin = {
  visitors: {
    [ts.SyntaxKind.ContinueStatement]: transformContinueStatementLegacy,
  },

  beforeTransform(
    program: ts.Program,
    options: tstl.CompilerOptions,
    emitHost: tstl.EmitHost
  ) {
    if (!tstl.isBundleEnabled(options))
      return [
        {
          messageText:
            "Using tfm-tstl-plugin without setting `luaBundle` is no-op.",
          category: ts.DiagnosticCategory.Warning,
          code: 0,
          source: "tsconfig.json",
          file: undefined,
          length: undefined,
          start: undefined,
        },
      ];
  },

  beforeEmit(
    program: ts.Program,
    options: tstl.CompilerOptions,
    emitHost: tstl.EmitHost,
    result: tstl.EmitFile[]
  ) {
    if (!tstl.isBundleEnabled(options)) return;

    const bundle = result[0];
    console.assert(bundle != null);

    if (options.sourceMapTraceback) {
      // Replace unsupported debug.getinfo(1) with one-liner alterntive
      bundle.code = bundle.code.replace(
        `debug.getinfo(1).short_src`,
        `string.match(debug.traceback(nil, 1), "(%S+%.lua):%d+")`
      );
    }

    const entrypointMatch = bundle.code.match(entrypointRegex);
    if (!entrypointMatch) {
      throw new Error("cannot match entrypoint require");
    }
    const [_, entrypointRequire] = entrypointMatch;

    // Remove unsupported top level return
    bundle.code =
      bundle.code.replace(entrypointRegex, entrypointRequire) + "\n";
  },

  printer: (
    program: ts.Program,
    emitHost: tstl.EmitHost,
    fileName: string,
    file: tstl.File
  ) => new TfmCustomPrinter(emitHost, program, fileName).print(file),
};

export default plugin;
