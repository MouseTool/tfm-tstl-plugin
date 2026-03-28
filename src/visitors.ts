import * as ts from "typescript";
import * as tstl from "typescript-to-lua";
import { transformContinueStatement } from "typescript-to-lua/dist/transformation/visitors/break-continue";

export const transformContinueStatementLegacy: tstl.FunctionVisitor<
  ts.ContinueStatement
> = (statement, context) => {
  const originalLuaTarget = context.luaTarget;

  // Force legacy transformation of 'continue' using repeat-break
  // https://github.com/TypeScriptToLua/TypeScriptToLua/pull/1500
  (context.luaTarget as tstl.LuaTarget) = tstl.LuaTarget.Lua51;
  const ret = transformContinueStatement(statement, context);
  (context.luaTarget as tstl.LuaTarget) = originalLuaTarget;

  return ret;
};
