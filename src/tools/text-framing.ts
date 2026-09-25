export type TextFraming = Readonly<{
  lineEnding: 'none' | 'lf' | 'crlf' | 'mixed';
  finalNewline: 'none' | 'lf' | 'crlf';
}>;

/** Incrementally classifies UTF-8 text framing without retaining the file body. */
export class TextFramingScanner {
  private readonly decoder = new TextDecoder('utf-8', { fatal: true });
  private valid = true;
  private nul = false;
  private pendingCr = false;
  private bareCr = false;
  private lf = 0;
  private crlf = 0;
  private last = -1;
  private previous = -1;

  update(content: Uint8Array): void {
    if (this.valid) {
      try { this.decoder.decode(content, { stream: true }); } catch { this.valid = false; }
    }
    for (const byte of content) {
      if (byte === 0) this.nul = true;
      if (this.pendingCr) {
        if (byte === 0x0a) { this.crlf += 1; this.pendingCr = false; this.previous = this.last; this.last = byte; continue; }
        this.bareCr = true;
        this.pendingCr = false;
      }
      if (byte === 0x0d) this.pendingCr = true;
      else if (byte === 0x0a) this.lf += 1;
      this.previous = this.last;
      this.last = byte;
    }
  }

  finish(): TextFraming | undefined {
    if (this.valid) {
      try { this.decoder.decode(); } catch { this.valid = false; }
    }
    if (this.pendingCr) this.bareCr = true;
    if (!this.valid || this.nul) return undefined;
    return {
      lineEnding: this.bareCr || (this.lf > 0 && this.crlf > 0) ? 'mixed' : this.crlf > 0 ? 'crlf' : this.lf > 0 ? 'lf' : 'none',
      finalNewline: this.last === 0x0a ? this.previous === 0x0d ? 'crlf' : 'lf' : 'none',
    };
  }
}

export function classifyTextFraming(content: Uint8Array | string): TextFraming | undefined {
  const scanner = new TextFramingScanner();
  scanner.update(typeof content === 'string' ? Buffer.from(content, 'utf8') : content);
  return scanner.finish();
}
