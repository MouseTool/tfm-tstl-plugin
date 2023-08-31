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
const typescript_1 = __importDefault(require("typescript"));
const tstl = __importStar(require("typescript-to-lua"));
const printer_1 = require("./printer");
const entrypointRegex = /return (require\("[\w.]+", \.{3}\))\s*$/;
const plugin = {
    beforeTransform(program, options, emitHost) {
        if (!tstl.isBundleEnabled(options))
            return [
                {
                    messageText: "Using tfm-tstl-plugin without setting `luaBundle` is no-op.",
                    category: typescript_1.default.DiagnosticCategory.Warning,
                    code: 0,
                    source: "tsconfig.json",
                    file: undefined,
                    length: undefined,
                    start: undefined,
                },
            ];
    },
    beforeEmit(program, options, emitHost, result) {
        if (!tstl.isBundleEnabled(options))
            return;
        const bundle = result[0];
        console.assert(bundle != null);
        if (options.sourceMapTraceback) {
            // Replace unsupported debug.getinfo(1) with one-liner alterntive
            bundle.code = bundle.code.replace(`debug.getinfo(1).short_src`, `string.match(debug.traceback(nil, 1), "(%S+%.lua):%d+")`);
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
    printer: (program, emitHost, fileName, file) => new printer_1.TfmCustomPrinter(emitHost, program, fileName).print(file),
};
exports.default = plugin;
