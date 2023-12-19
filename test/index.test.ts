import { BlenderFile } from '../src';
import * as fs from "fs";

const EXAMPLE_FILE_REL_PATH_278 = "./test/test.278.blend";
const EXAMPLE_FILE_REL_PATH_400 = "./test/test.400.blend";

describe('Load Blender File', () => {

  test('Loads blender file from ArrayBuffer source', async () => {
    let file = await fs.promises.readFile(EXAMPLE_FILE_REL_PATH_278);
    let ab = file.buffer;

    let blender_file = await BlenderFile.read(ab);

    expect(blender_file).toBeDefined();
  });

  test.todo('Loads blender file from network using URL input');
  test.todo('Loads blender file from network using String input');
});

describe('Parse Blender File', () => {
  let blender_file_278: BlenderFile;
  let blender_file_400: BlenderFile;
  beforeAll(async () => {
    blender_file_278 = await BlenderFile.read(
      (await fs.promises.readFile(EXAMPLE_FILE_REL_PATH_278)).buffer
    );

    blender_file_400 = await BlenderFile.read(
      (await fs.promises.readFile(EXAMPLE_FILE_REL_PATH_400)).buffer
    );
  })
  test("Reads file DNA and extracts object information", () => {
    expect(blender_file_278.version).toEqual("278");
    expect(blender_file_400.version).toEqual("400");
  })
});

describe('Read Blender Objects', () => {
  let blender_file: BlenderFile;
  beforeAll(async () => {
    let file = await fs.promises.readFile(EXAMPLE_FILE_REL_PATH_278);
    let ab = file.buffer;
    blender_file = await BlenderFile.read(ab);
  })
  test("Reads SDNA data", () => {
    //@ts-ignore
    expect(blender_file.SDNA).toBeDefined();
  })
  test("Gets Thumbnail Data", () => {
    expect(blender_file.getThumbnail()).toBeDefined();
  })
  test("Get Object By Qualified Name", () => {
    expect(blender_file.getObjectById("OBSusan")).toBeDefined();
  })
  test("Get Objects By Type", () => {
    expect(blender_file.getObjectsByType("Mesh")).toHaveLength(1);
  })
  test.todo("Reads mesh data")
  test.todo("Reads material data")
  test.todo("Reads texture data")
  test.todo("Reads animation data")
  test.todo("Reads light data")
  test.todo("Reads scene data")
  test.todo("Reads render data")
});