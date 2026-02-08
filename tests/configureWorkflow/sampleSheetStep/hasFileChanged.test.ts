import { hasFileChanged } from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SampleSheetStep/hooks/UseFilePicker/utils";

function createMockFile(
  name: string,
  size: number,
  lastModified: number
): File {
  const file = new File(["content"], name, { type: "text/csv" });
  Object.defineProperty(file, "size", { value: size });
  Object.defineProperty(file, "lastModified", { value: lastModified });
  return file;
}

describe("hasFileChanged", () => {
  test("returns true when prevFile is null", () => {
    const newFile = createMockFile("test.csv", 100, 1234567890);

    expect(hasFileChanged(null, newFile)).toBe(true);
  });

  test("returns false when files have same name, size, and lastModified", () => {
    const prevFile = createMockFile("test.csv", 100, 1234567890);
    const newFile = createMockFile("test.csv", 100, 1234567890);

    expect(hasFileChanged(prevFile, newFile)).toBe(false);
  });

  test("returns true when file name differs", () => {
    const prevFile = createMockFile("test.csv", 100, 1234567890);
    const newFile = createMockFile("other.csv", 100, 1234567890);

    expect(hasFileChanged(prevFile, newFile)).toBe(true);
  });

  test("returns true when file size differs", () => {
    const prevFile = createMockFile("test.csv", 100, 1234567890);
    const newFile = createMockFile("test.csv", 200, 1234567890);

    expect(hasFileChanged(prevFile, newFile)).toBe(true);
  });

  test("returns true when lastModified differs", () => {
    const prevFile = createMockFile("test.csv", 100, 1234567890);
    const newFile = createMockFile("test.csv", 100, 9999999999);

    expect(hasFileChanged(prevFile, newFile)).toBe(true);
  });

  test("returns true when all properties differ", () => {
    const prevFile = createMockFile("old.csv", 100, 1234567890);
    const newFile = createMockFile("new.csv", 200, 9999999999);

    expect(hasFileChanged(prevFile, newFile)).toBe(true);
  });
});
