import * as ts from "typescript";
import * as tstl from "typescript-to-lua";
import { createSerialDiagnosticFactory } from "typescript-to-lua/dist/utils";
import { TfmCustomPrinter } from "./printer";
import { transformContinueStatementLegacy } from "./visitors";

const warnNoLuaBundle = createSerialDiagnosticFactory(() => ({
  category: ts.DiagnosticCategory.Warning,
  messageText:
    "'luaBundle' is not set. Using tfm-tstl-plugin will be pointless. Set 'luaBundle' and 'luaBundleEntry' in 'tsconfig.json' to fix this warning.",
}));
const errorEntrypointNotFound = createSerialDiagnosticFactory(() => ({
  category: ts.DiagnosticCategory.Error,
  messageText:
    "Cannot match entrypoint require in the generated bundle. Ensure you are using a TSTL version supported by tfm-tstl-plugin.",
}));
const errorBundleNotFound = createSerialDiagnosticFactory(() => ({
  category: ts.DiagnosticCategory.Error,
  messageText: "Bundle not found.",
}));

const entrypointRegex = /(?:local ____entry = |return )(require\("[\w.]+", \.{3}\))(?:\nreturn ____entry)?\s*$/;

function matchAndStripTopLevelReturn(code: string) {
  const entrypointMatch = code.match(entrypointRegex);
  if (!entrypointMatch) {
    return null;
  }
  const [_, entrypointRequire] = entrypointMatch;

  // Strip top level return and return the new code
  return code.replace(entrypointRegex, entrypointRequire) + "\n";
}

const plugin: tstl.Plugin = {
  visitors: {
    [ts.SyntaxKind.ContinueStatement]: transformContinueStatementLegacy,
  },

  beforeTransform(
    program: ts.Program,
    options: tstl.CompilerOptions,
    emitHost: tstl.EmitHost,
  ) {
    if (!tstl.isBundleEnabled(options)) return [warnNoLuaBundle()];
  },

  beforeEmit(
    program: ts.Program,
    options: tstl.CompilerOptions,
    emitHost: tstl.EmitHost,
    result: tstl.EmitFile[],
  ) {
    if (!tstl.isBundleEnabled(options)) return [warnNoLuaBundle()];

    const bundle = result[0];
    // Safety assertion
    if (bundle == null) return [errorBundleNotFound()];

    if (options.sourceMapTraceback) {
      // Replace unsupported debug.getinfo(1) with one-liner alterntive
      bundle.code = bundle.code.replace(
        `debug.getinfo(1).short_src`,
        `string.match(debug.traceback(nil, 1), "(%S+%.lua):%d+")`,
      );
    }

    const strippedCode = matchAndStripTopLevelReturn(bundle.code);
    if (strippedCode == null) return [errorEntrypointNotFound()];
    bundle.code = strippedCode;
  },

  printer: (
    program: ts.Program,
    emitHost: tstl.EmitHost,
    fileName: string,
    file: tstl.File,
  ) => new TfmCustomPrinter(emitHost, program, fileName).print(file),
};

export default plugin;
