import { BlenderFile } from '../src/parser';
import * as fs from "fs";

const EXAMPLE_FILE_REL_PATH = "./example/test.blend";

describe('Load Blender File', () => {

  test('Loads blender file from ArrayBuffer source', async () => {
    let file = await fs.promises.readFile(EXAMPLE_FILE_REL_PATH);
    let ab = file.buffer;

    let blender_file = await BlenderFile.read(ab);

    expect(blender_file).toBeDefined();
  });

  test.todo('Loads blender file from network using URL input');
  test.todo('Loads blender file from network using String input');
});

describe('Parse Blender File', () => {
  let blender_file;
  beforeAll(async () => {
    let file = await fs.promises.readFile(EXAMPLE_FILE_REL_PATH);
    let ab = file.buffer;
    let blender_file = await BlenderFile.read(ab);
  })
  test.todo("Reads file DNA and extracts object information")
});

describe('Read Blender Objects', () => {
  let blender_file;
  beforeAll(async () => {
    let file = await fs.promises.readFile(EXAMPLE_FILE_REL_PATH);
    let ab = file.buffer;
    let blender_file = await BlenderFile.read(ab);
  })

  test.todo("Reads mesh data")
  test.todo("Reads material data")
  test.todo("Reads texture data")
  test.todo("Reads animation data")
  test.todo("Reads light data")
  test.todo("Reads scene data")
  test.todo("Reads render data")
});