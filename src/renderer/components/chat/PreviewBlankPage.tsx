/** about:blank 탭에 표시되는 Prowl 브랜딩 페이지 */
import prowlLogo from "@assets/prowl-logo.png";

export default function PreviewBlankPage({ onNavigate }: { onNavigate?: (url: string) => void }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        gap: 10,
        background: "rgba(14, 11, 22, 0.96)",
        position: "relative",
      }}
    >
      <img src={prowlLogo} alt="Prowl" style={{ width: 120, height: 120, opacity: 0.8 }} />
      <span
        style={{
          fontSize: 24,
          fontWeight: 700,
          color: "rgba(255,255,255,0.6)",
          letterSpacing: "0.14em",
        }}
      >
        PROWL
      </span>
      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.28)", marginTop: 4 }}>
        URL을 입력해 탐색하세요
      </span>
      <button
        type="button"
        onClick={() => onNavigate?.("https://github.com/BangDori/prowl")}
        style={{
          position: "absolute",
          bottom: 16,
          fontSize: 11,
          color: "rgba(255,255,255,0.2)",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          transition: "color 0.15s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.5)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.2)";
        }}
      >
        GitHub
      </button>
    </div>
  );
}
