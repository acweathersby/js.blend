import { BlenderFile } from "../core/file";

export class ThreeJSExt extends BlenderFile {
  static async read(file: string | URL | ArrayBuffer): Promise<ThreeJSExt> {
    return ThreeJSExt.from(await BlenderFile.read(file));
  }

  static from(file: BlenderFile): ThreeJSExt {
    return Object.assign(new ThreeJSExt(file.binary), file);
  }
}