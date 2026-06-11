import katex from "katex";
import "katex/dist/katex.min.css";

// 빌드(SSG) 시 KaTeX로 수식을 HTML로 렌더 → 클라이언트 JS 불필요.
export function Tex({
  children,
  block = false,
}: {
  children: string;
  block?: boolean;
}) {
  const html = katex.renderToString(children, {
    displayMode: block,
    throwOnError: false,
    output: "html",
  });
  return (
    <span
      className={block ? "tex-block" : "tex-inline"}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
