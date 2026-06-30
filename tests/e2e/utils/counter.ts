let _seq = 0;

export function nextSeq(): number {
  _seq += 1;
  return _seq;
}

export function resetSeq(): void {
  _seq = 0;
}
