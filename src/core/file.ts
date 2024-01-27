/**
 * 
 * This reader is based on the Blender source as found in the Blender GitHub mirror repository:
 * https://github.com/blender/blender/blob/main/source/blender/blenloader/intern/readfile.cc
 */

import { SDNA, getNameList, SDNAStruct } from "./sdna";
import {
  VERSION_OFFSET,
  ENDIAN_FLAG_OFFSET,
  BIG_ENDIAN_SYMBOL,
  POINTER_SIZE_OFFSET,
  _32BIT_POINTER_SIZE_SYMBOL,
  SDNA_STRUCT_COUNT_OFFSET,
  BLENDER_HEADER_SIZE,
  BLENDER_NAME_SIZE,
  BLOCK_HEADER_SIZE,
  BLOCK_OFFSET
} from "./constants";

import { align4, toString } from "./utils";

/**
 * @brief Represents a single blender file loaded from 
 * a binary source.
 */
export class BlenderFile {
  protected is_valid: Boolean = false;
  protected _SDNA_: SDNA | null | undefined = undefined;
  readonly address_map: Map<BigInt, number> = new Map;
  readonly object_groups: Map<string, number[]> = new Map;
  readonly named_objects: Map<string, number> = new Map;
  readonly object_cache: Map<number, any> = new Map;
  readonly binary: ArrayBuffer;

  /**
   * Constructs a Blender file 
   * @param file 
   */
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

    if (BlenderFile.verify(buffer)) {
      return new BlenderFile(buffer);
    } else {
      throw new Error("This does not seem to be a Blender file.");
    }
  }

  /**
   * Extracts the file thumbnail as PNG data
   * 
   * Reference Source:
   *  https://github.com/blender/blender/blob/3fb6397b7970ad5d96df656df92ec11948f5c8bf/source/blender/blenloader/intern/readfile.cc#L1020C1-L1058C2
   */
  getThumbnail() {
    for (const block of new BlenderBlockIterator(this)) {

      if (block.code === "DATA") {
        let data = this.createObject(block);
        return;
      }

      if (block.code === "TEST") {
        let little = this.little_endian;
        let db = block.data_dv;

        let width = db.getInt32(0, little);
        let height = db.getInt32(4, little);

        if (!(width * height > 0)) {
          break
        }

        let data_length = width * height * 4;

        if (block.data_size < data_length + 8) {
          break
        }

        return {
          width,
          height,
          data: new Uint32Array(this.binary, db.byteOffset + 8, data_length >> 2)
        };
      }
    }

    return null;
  }


  get version(): string {
    return toString(this.binary, VERSION_OFFSET, 3);
  }

  get little_endian(): boolean {
    return new Uint32Array(this.binary)[ENDIAN_FLAG_OFFSET] !== BIG_ENDIAN_SYMBOL;
  }

  get pointer_size(): number {
    return new Uint32Array(this.binary)[POINTER_SIZE_OFFSET] === _32BIT_POINTER_SIZE_SYMBOL ? 4 : 8;
  }

  get dv(): DataView {
    return new DataView(this.binary);
  }


  get meshes(): any[] {
    // Ensure the file has been parsed;
    let _ = this.SDNA;

    return this.getObjectsByType("Mesh");
  }

  get lights(): any[] {
    // Ensure the file has been parsed;
    let _ = this.SDNA;

    return this.getObjectsByType("Light");
  }

  get materials(): any[] {
    // Ensure the file has been parsed;
    let _ = this.SDNA;

    return this.getObjectsByType("Material");
  }

  get scenes(): any[] {
    // Ensure the file has been parsed;
    let _ = this.SDNA;

    return this.getObjectsByType("Scene");
  }

  get cameras(): any[] {
    // Ensure the file has been parsed;
    let _ = this.SDNA;

    return this.getObjectsByType("Camera");
  }

  getObjectById(name: string): any {
    // Ensure the file has been parsed;
    let _ = this.SDNA;

    let offset = this.named_objects.get(name);
    if (offset) {
      return this.createObject(new BlenderBlock(offset, this));
    } else {
      return null;
    }
  }
  /**
   * Returns a list of object belonging to a particular type group.
   * 
   * @param type_name - A name of an object group e.g: `Mesh`, `Light`
   * 
   * @returns A array of objects, or an empty array of there no objects matching
   * the `type_name`
   * 
   * https://docs.blender.org/manual/en/latest/scene_layout/object/types.html
   */
  getObjectsByType(type_name: string): any[] {
    let objects = this.object_groups.get(type_name);

    if (!objects) return [];

    return objects.map(offset =>
      this.createObject(new BlenderBlock(offset, this))
    );
  }

  /**
   * Extracts SDNA information from the file
   * 
   * Reference Source:
   *  https://github.com/blender/blender/blob/3fb6397b7970ad5d96df656df92ec11948f5c8bf/source/blender/blenloader/intern/readfile.cc#L962C1-L1018C2
   */
  private get SDNA(): SDNA | null {
    if (this._SDNA_ === undefined) {
      let little = this.little_endian;

      for (const block of new BlenderBlockIterator(this)) {
        if (block.code === "DNA1") {

          let dv = block.data_dv;

          this._SDNA_ = new SDNA(dv, little, this.pointer_size);

          let offset = SDNA_STRUCT_COUNT_OFFSET;

          let num_of_prop_names = dv.getInt32(offset, little);
          var { s: prop_names, o: o } = getNameList(dv, offset + 4, num_of_prop_names);
          this._SDNA_.prop_names = prop_names;
          offset = align4(o) + 4;

          let num_of_types = dv.getInt32(offset, little);
          var { s: types_names, o: o } = getNameList(dv, offset + 4, num_of_types);
          this._SDNA_.type_names = types_names;
          offset = align4(o) + 4;

          this._SDNA_.type_sizes = new Uint16Array(dv.buffer, dv.byteOffset + offset, num_of_types);
          offset = align4(offset + num_of_types * 2) + 4;

          var num_of_structures = dv.getInt32(offset, little);
          offset += 4;
          for (let i = 0; i < num_of_structures; i++) {
            let definition = new SDNAStruct(offset, i, this._SDNA_);
            this._SDNA_.struct_definitions.push(definition);
            this._SDNA_.struct_name_lu.set(definition.name, definition);



            offset += definition.sdna_byte_size;
          }

          this.initObjects();

          return this._SDNA_;
        }
      }
      /// Could not find the DNA block. Is this a blender file?
      this._SDNA_ = null;
    }

    return this._SDNA_;
  }

  private initObjects() {
    let SDNA = this.SDNA;

    if (!SDNA) return;

    for (const block of new BlenderBlockIterator(this)) {

      if (block.code !== "DNA1" && block.code !== "ENDB") {
        let def = SDNA?.struct_definitions[block.sdna_index];
        if (def && block.num_of_elements > 0) {

          if (block.data_size < def.byte_size) {
            // Block is invalid; Most likely not a SDNA block, but rather an array or source of a pointer.
            continue;
          }

          if (!this.object_groups.has(def.name)) {
            this.object_groups.set(def.name, []);
          }

          //@ts-ignore - already ensured that there's an object at `def.name`
          this.object_groups.get(def.name).push(block.offset);

          if (def.have_id) {
            let proto = SDNA.getPropertyDescriptors(this, block.sdna_index);
            if (proto) {
              let name = proto.id.get?.apply({ dv: block.data_dv }).name;
              if (name) {
                this.named_objects.set(name, block.offset);
              }
            }
          }

          this.address_map.set(block.pointer, block.offset);
        }
      }
    }
  }

  private createFromSDNAOffset(sdna_index: number, start_offset: number, element_byte_size: number, count: number = 1, cache_index: number = start_offset): any | null {
    let cached_object = this.object_cache.get(cache_index);

    if (cached_object)
      return cached_object;

    let SDNA = this.SDNA;

    if (!SDNA) return null;


    let def = SDNA.struct_definitions[sdna_index];

    if (!def) return null;

    let properties = SDNA.getPropertyDescriptors(this, sdna_index);

    if (!properties) return null;

    if (count > 1) {

      let array = [];

      for (let i = 0; i < count; i++) {

        array.push(Object.create({}, {
          _type_: {
            value: def.name,
            writable: false,
            enumerable: true,
          },
          dv: {
            value: new DataView(this.binary, start_offset + element_byte_size * i, element_byte_size),
            writable: false,
            enumerable: false,
          },
          ...properties
        }))
      }

      this.object_cache.set(cache_index, array)

      return array;
    } else {
      let obj = Object.create({}, {
        _type_: {
          value: def.name,
          writable: false,
          enumerable: true,
        },
        dv: {
          value: new DataView(this.binary, start_offset, element_byte_size),
          writable: false,
          enumerable: false,
        },
        ...properties
      });



      this.object_cache.set(cache_index, obj)

      return obj;
    }
  }

  //*  
  private createObject(block: BlenderBlock): any | null {
    if (block.block_size >= this.binary.byteLength) return null;
    return this.createFromSDNAOffset(
      block.sdna_index,
      block.data_segment_start,
      block.data_size / block.num_of_elements,
      block.num_of_elements,
      block.offset
    );
  }

  protected constructor(file: ArrayBuffer) {
    this.binary = file;
  }

  /** 
   * Verifies the header of the file
   * 
   * Source Reference:
   *   https://github.com/blender/blender/blob/3fb6397b7970ad5d96df656df92ec11948f5c8bf/source/blender/blenloader/intern/readfile.cc#L921C1-L960C2
   */
  private static verify(file: ArrayBuffer): boolean {

    if (file.byteLength <= BLENDER_HEADER_SIZE)
      return false

    if (toString(file, 0, BLENDER_NAME_SIZE) !== "BLENDER")
      return false;

    if (!["_", "-"].includes(toString(file, POINTER_SIZE_OFFSET, 1)))
      return false;

    if (!["V", "v"].includes(toString(file, ENDIAN_FLAG_OFFSET, 1)))
      return false;

    return true;
  }
}

export class BlenderBlock {
  // BHead Data
  readonly code: string;              // offset 0
  private len: number = 0;            // offset 4
  readonly pointer: BigInt;           // offset 8
  readonly sdna_index: number;        // offset 12 / 16 - depending on pointer size
  readonly num_of_elements: number;    // offset 16 / 20 - depending on pointer size 

  // Convience Properties
  readonly offset: number = 0;
  private bf: BlenderFile;

  constructor(o: number, bf: BlenderFile) {
    let dv = bf.dv;
    let ptr_size = bf.pointer_size;

    this.bf = bf;
    this.offset = o;

    const CODE_OFFSET = 0;
    const LEN_OFFSET = 4;
    const POINTER_OFFSET = 8;
    const SDNAnr_OFFSET = 8 + ptr_size;
    const NR_OFFSET = 12 + ptr_size;

    this.code = toString(dv.buffer, CODE_OFFSET + o, 4).replace(/\x00/g, "");

    this.len = dv.getInt32(LEN_OFFSET + o, bf.little_endian);

    this.pointer = ptr_size > 4
      ? dv.getBigInt64(POINTER_OFFSET + o, bf.little_endian)
      : BigInt(dv.getInt32(POINTER_OFFSET + o, bf.little_endian));


    this.sdna_index = dv.getInt32(o + SDNAnr_OFFSET, bf.little_endian);
    this.num_of_elements = dv.getInt32(o + NR_OFFSET, bf.little_endian);
  }

  get dv(): DataView {
    return new DataView(this.bf.dv.buffer, this.offset, this.block_size)
  }

  get header_dv(): DataView {
    return new DataView(this.bf.dv.buffer, this.offset, BLOCK_HEADER_SIZE + this.bf.pointer_size)
  }

  get data_dv(): DataView {
    return new DataView(this.bf.dv.buffer, this.data_segment_start, this.len)
  }

  get data_segment_start(): number {
    return BLOCK_HEADER_SIZE + this.bf.pointer_size + this.offset;
  }

  get block_size(): number {
    return BLOCK_HEADER_SIZE + this.len + this.bf.pointer_size;
  }

  get data_size(): number {
    return this.len;
  }
}

class BlenderBlockIterator {
  private blender_file: BlenderFile;
  private offset: number = 0;


  next(
    done?: boolean
  ): IteratorResult<BlenderBlock> {
    if (this.offset < this.blender_file.binary.byteLength) {
      let block = new BlenderBlock(this.offset, this.blender_file);
      this.offset += block.block_size;
      this.offset = align4(this.offset);
      return { value: block, done: false };
    } else {
      return { value: null, done: true };
    }
  }

  [Symbol.iterator](): BlenderBlockIterator {
    this.offset = BLOCK_OFFSET;
    return this;
  }

  constructor(blender_file: BlenderFile, offset: number = BLOCK_OFFSET) {
    this.blender_file = blender_file;
    this.offset = offset;
  }
}

