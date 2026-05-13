/** Файл из multer (memory storage) без зависимости от @types/multer в tsconfig. */
export type MemoryUploadedFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};
