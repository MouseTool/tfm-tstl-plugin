"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.basename = void 0;
const basename = (sPath) => sPath.split(/[\\/]/).pop();
exports.basename = basename;
