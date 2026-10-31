import type { ScriptHTMLAttributes } from "react";

// Accept one script tag, or plain JavaScript for inline scripts.
export function customHeadScriptProps(value: string | undefined): ScriptHTMLAttributes<HTMLScriptElement> | null {
  if (!value?.trim()) return null;
  if (!value.trimStart().startsWith("<")) return { children: value };

  const tag = value.trim().match(/^<script\b((?:[^>"']|"[^"]*"|'[^']*')*)>([\s\S]*?)<\/script\s*>$/i);
  if (!tag || /<\/script\s*>/i.test(tag[2])) throw new Error("CUSTOM_HEAD_SCRIPT must contain one script tag or plain JavaScript");

  const props: Record<string, string | boolean> = {};
  const attributes = tag[1];
  const pattern = /\s+([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/gy;
  const names: Record<string, string> = {
    crossorigin: "crossOrigin", referrerpolicy: "referrerPolicy",
    nomodule: "noModule", fetchpriority: "fetchPriority",
  };
  let position = 0;
  while (position < attributes.trimEnd().length) {
    pattern.lastIndex = position;
    const attribute = pattern.exec(attributes);
    if (!attribute) throw new Error("Invalid CUSTOM_HEAD_SCRIPT attributes");
    position = pattern.lastIndex;
    const name = attribute[1].toLowerCase();
    // The request nonce always comes from the server; event handlers are not script attributes.
    if (name === "nonce" || name.startsWith("on")) continue;
    props[names[name] ?? name] = ["async", "defer", "nomodule"].includes(name)
      ? true
      : attribute[2] ?? attribute[3] ?? attribute[4] ?? "";
  }
  return { ...props, children: tag[2] || undefined };
}

export function customScriptConnectSources(value: string | undefined): string {
  return (value?.trim().split(/\s+/).filter(Boolean) ?? []).map((source) => {
    const url = new URL(source);
    if (!["https:", "http:"].includes(url.protocol) || url.origin !== source || /[;'"<>]/.test(source)) {
      throw new Error("CUSTOM_SCRIPT_CONNECT_SRC must contain space-separated HTTP(S) origins");
    }
    return url.origin;
  }).join(" ");
}
