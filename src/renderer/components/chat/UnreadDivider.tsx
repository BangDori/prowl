/** 안 읽은 메시지 시작점 구분선 */
export default function UnreadDivider() {
  return (
    <div className="flex items-center gap-3 my-3 px-2">
      <div className="flex-1 h-px bg-accent/40" />
      <span className="text-[10px] text-accent/70 font-medium whitespace-nowrap">
        여기까지 읽었음
      </span>
      <div className="flex-1 h-px bg-accent/40" />
    </div>
  );
}
