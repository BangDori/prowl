/** AI 응답 대기 중 로딩 인디케이터 (3개 바운싱 dot) */
import prowlProfile from "@assets/prowl-profile.png";

export default function LoadingIndicator() {
  return (
    <div className="flex justify-start mb-3 chat-bubble-enter">
      <img
        src={prowlProfile}
        alt="Prowl"
        className="flex-shrink-0 w-7 h-7 rounded-full mr-2 mt-1 object-cover"
      />
      <div className="px-3 py-2 rounded-2xl rounded-bl-sm bg-white/10">
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" />
          <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.15s]" />
          <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.3s]" />
        </div>
      </div>
    </div>
  );
}
