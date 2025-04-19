declare module 'sockjs-client' {
  export default class SockJS {
    constructor(url: string, _reserved?: any, options?: any);
    close(): void;
    send(data: string): void;
    onopen: (() => void) | null;
    onclose: (() => void) | null;
    onmessage: ((e: { data: string }) => void) | null;
  }
}
