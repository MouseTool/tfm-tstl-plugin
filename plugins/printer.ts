import path from "path";
import { SourceNode } from "source-map";
import ts from "typescript";
import * as tstl from "typescript-to-lua";
import { cast, isNonNull } from "typescript-to-lua/dist/utils";

type SourceChunk = string | SourceNode;

const tfmPolyfills = `-- Polyfill for Transformice Lua
do
    _G._VERSION = "Lua 5.2"

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

export class TfmCustomPrinter extends tstl.LuaPrinter {
  /* Override printFile */
  protected printFile(file: tstl.File): SourceNode {
    if (!tstl.isBundleEnabled(this.options)) return super.printFile(file);

    const program = this["program"] as ts.Program; // FIXME: should be protected not private
    const sourceFile = this["sourceFile"] as string; // FIXME: should be protected not private
    const entryModule = cast(this.options.luaBundleEntry, isNonNull);

    // Resolve project settings relative to project file.
    const resolvedEntryModule = path.resolve(
      tstl.getProjectRoot(program),
      entryModule
    );
    const entryModuleFilePath =
      program.getSourceFile(entryModule)?.fileName ??
      program.getSourceFile(resolvedEntryModule)?.fileName;

    const originalResult = super.printFile(file);
    const finalResult = [] as SourceChunk[];

    // Add header comment at the top of the module
    finalResult.push(
      `--[[\n    ${
        this.relativeSourcePath
      }\n    Generated on ${new Date().toUTCString()}\n    https://github.com/TypeScriptToLua/TypeScriptToLua\n]]--\n`
    );

    if (entryModuleFilePath == sourceFile) {
      if (this.options.tstlVerbose) console.log("found entry point, modifying", sourceFile);
      finalResult.push(tfmPolyfills);
    }

    finalResult.push(originalResult);

    // Add header comment at the top of the file
    return this.createSourceNode(file, finalResult);
  }
}
