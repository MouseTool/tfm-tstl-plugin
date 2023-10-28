import ts from "typescript";
import { LuaTarget } from "typescript-to-lua";
import { FunctionVisitor } from "typescript-to-lua/dist/transformation/context";
import { transformContinueStatement } from "typescript-to-lua/dist/transformation/visitors/break-continue";

export const transformContinueStatementLegacy: FunctionVisitor<
  ts.ContinueStatement
> = (statement, context) => {
  const originalLuaTarget = context.luaTarget;

  // Force legacy transformation of 'continue' using repeat-break
  // https://github.com/TypeScriptToLua/TypeScriptToLua/pull/1500
  (context.luaTarget as LuaTarget) = LuaTarget.Lua51;
  const ret = transformContinueStatement(statement, context);
  (context.luaTarget as LuaTarget) = originalLuaTarget;

  return ret;
};
