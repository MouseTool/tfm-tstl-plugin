"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TfmCustomPrinter = void 0;
const path_1 = __importDefault(require("path"));
const tstl = __importStar(require("typescript-to-lua"));
const utils_1 = require("typescript-to-lua/dist/utils");
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
class TfmCustomPrinter extends tstl.LuaPrinter {
    /* Override printFile */
    printFile(file) {
        if (!tstl.isBundleEnabled(this.options))
            return super.printFile(file);
        const program = this["program"]; // FIXME: should be protected not private
        const sourceFile = this["sourceFile"]; // FIXME: should be protected not private
        const entryModule = (0, utils_1.cast)(this.options.luaBundleEntry, utils_1.isNonNull);
        // Resolve project settings relative to project file.
        const resolvedEntryModule = path_1.default.resolve(tstl.getProjectRoot(program), entryModule);
        const entryModuleFilePath = program.getSourceFile(entryModule)?.fileName ??
            program.getSourceFile(resolvedEntryModule)?.fileName;
        const originalResult = super.printFile(file);
        const finalResult = [];
        // Add header comment at the top of the module
        finalResult.push(`--[[\n    ${this.relativeSourcePath}\n    Generated on ${new Date().toUTCString()}\n    https://github.com/TypeScriptToLua/TypeScriptToLua\n]]--\n`);
        if (entryModuleFilePath == sourceFile) {
            if (this.options.tstlVerbose)
                console.log("found entry point, modifying", sourceFile);
            finalResult.push(tfmPolyfills);
        }
        finalResult.push(originalResult);
        // Add header comment at the top of the file
        return this.createSourceNode(file, finalResult);
    }
}
exports.TfmCustomPrinter = TfmCustomPrinter;
