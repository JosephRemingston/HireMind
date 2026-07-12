import fs from "fs";
import os from "os";
import path from "path";
import multer from "multer";

const uploadDirectory = path.join(os.tmpdir(), "hiremind-uploads");
fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
    destination: uploadDirectory,
    filename: (req, file, callback) => {
        const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]+/g, "_");
        const uniquePrefix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

        callback(null, `${uniquePrefix}-${safeName}`);
    },
});

const upload = multer({
    storage,
    limits: {
        fileSize: 25 * 1024 * 1024,
        files: 1000,
    },
});

export default upload;