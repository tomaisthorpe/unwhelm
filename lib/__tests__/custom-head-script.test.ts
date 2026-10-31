import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { customHeadScriptProps, customScriptConnectSources } from "../custom-head-script";

describe("custom head script", () => {
  it("renders the Umami tag with attributes and the request nonce", () => {
    const props = customHeadScriptProps('<script defer src="https://cloud.umami.is/script.js" data-website-id="462348d2-cbe9-47bd-8e13-b005c02a9ccf" nonce="ignored"></script>');
    const html = renderToStaticMarkup(createElement("script", { ...props, nonce: "request-nonce" }));
    expect(html).toContain('src="https://cloud.umami.is/script.js"');
    expect(html).toContain('defer=""');
    expect(html).toContain('data-website-id="462348d2-cbe9-47bd-8e13-b005c02a9ccf"');
    expect(html).toContain('nonce="request-nonce"');
    expect(html).not.toContain("ignored");
  });

  it("supports inline code and quoted greater-than characters", () => {
    expect(customHeadScriptProps('console.log("hi")')).toEqual({ children: 'console.log("hi")' });
    expect(customHeadScriptProps('<script data-value="a>b">console.log(1 > 0)</script>')).toEqual({ "data-value": "a>b", children: "console.log(1 > 0)" });
  });

  it("omits empty configuration and rejects unsupported markup", () => {
    expect(customHeadScriptProps(undefined)).toBeNull();
    expect(customHeadScriptProps("  ")).toBeNull();
    expect(() => customHeadScriptProps('<img src="/test">')).toThrow();
    expect(() => customHeadScriptProps('<script></script><script></script>')).toThrow();
  });
});

describe("custom script connection origins", () => {
  it("defaults to no additional origins", () => {
    expect(customScriptConnectSources(undefined)).toBe("");
    expect(customScriptConnectSources("  ")).toBe("");
  });

  it("accepts explicit origins and rejects policy injection and paths", () => {
    expect(customScriptConnectSources("https://gateway.umami.is https://example.com")).toBe("https://gateway.umami.is https://example.com");
    for (const value of ["https://example.com;", "https://example.com/path", "data:", "*"]) {
      expect(() => customScriptConnectSources(value)).toThrow();
    }
  });
});
