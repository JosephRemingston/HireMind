import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: 8 * 1024 * 1024 // 8MB
    }
});

export default upload;