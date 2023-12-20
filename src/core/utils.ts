
/**
 * Extracts a string from an ArrayBuffer given an offset and a length. Expects the string
 * to be parsable as ASCII characters.
 * 
 * @param buffer - An ArrayBuffer
 * @param offset - A byte offset into the buffer 
 * @param len - The length of the string to extract in bytes
 * 
 * @returns The ASCII string at the given location, or an empty string if the data
 * could not be parsed as ASCII.
 */
export function toString(buffer: ArrayBuffer, offset: number, len: number): string {
  if (offset + len > buffer.byteLength)
    return ""

  let array = new Uint8Array(buffer, offset, len);

  let end = 0;

  for (; end < len; end++) {
    if (array[end] == 0) break;
  }

  return String.fromCharCode(...array.slice(0, end));
}

/**
 * Given a number returns the nearest multiple of 4 that is >= n
 */
export function align4(n: number): number { return (n + 3) & 0xFFFF_FFFC; }

/**
 * Given a number returns the nearest multiple of 8 that is >= n
 */
export function align8(n: number): number { return (n + 7) & 0xFFFF_FFF8; }

/**
 * Retrieves an array of any dimension from the blender file.
 */
export function arrayGetter(offset: number, base_size: number, index: number, lengths: number[], obj: any, fn: any): any[] {
  if (index >= (lengths.length - 1)) {
    return fn.call(obj, offset);
  } else {
    let array = [];
    let l = lengths[index];
    let size = lengths.slice(index + 1).reduce((a, b) => a * b, base_size);
    console.log({ size })
    for (let i = 0; i < l; i++) {
      array.push(arrayGetter(offset + size * i, base_size, index + 1, lengths, obj, fn))
    }
    return array;
  }
}