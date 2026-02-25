/** 타입 안전한 IPC 핸들러 등록 유틸리티 */
import { ipcMain } from "electron";
import type { IpcChannel, IpcParams, IpcReturn } from "../shared/ipc-schema";

/**
 * 타입 안전한 IPC 핸들러 등록
 *
 * IpcInvokeSchema에서 채널의 파라미터/반환 타입을 자동 추론한다.
 * 잘못된 채널명, 파라미터 타입, 반환 타입 사용 시 컴파일 에러 발생.
 * 모든 핸들러에 try/catch를 적용하여 에러가 숨겨지지 않도록 한다.
 */
export function handleIpc<C extends IpcChannel>(
  channel: C,
  handler: (...args: IpcParams<C>) => Promise<IpcReturn<C>>,
): void {
  ipcMain.handle(channel, async (_event, ...args) => {
    try {
      return await handler(...(args as IpcParams<C>));
    } catch (error) {
      console.error(`[IPC] ${channel} failed:`, error);
      throw error;
    }
  });
}
