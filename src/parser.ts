
/**
 * @brief Represents a single blender file loaded from 
 * a binary source.
 */
export class BlenderFile {
  private is_valid: Boolean = false;
  private binary: ArrayBuffer;

  /**
   * Constructs a Blender file 
   * @param file 
   */
  private constructor(file: ArrayBuffer) {
    this.binary = file;

    /// Perform some rudimantary parsing to gather file information.
  }

  static async read(file: string | URL | ArrayBuffer): Promise<BlenderFile> {
    let buffer: ArrayBuffer;

    if ((file instanceof String) || (file instanceof URL)) {
      if (file instanceof String) {
        file = new URL(<string>file);
      }

      file = <URL>file;

      //Load from file. 
      let response = await fetch(file);
      buffer = await response.arrayBuffer();
    } else {
      buffer = <ArrayBuffer>file;
    }

    return new BlenderFile(buffer);
  }
}