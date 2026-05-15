import multer from "multer"
import fs from "node:fs"
import path from "node:path"

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const dest = path.join(process.cwd(), 'public', 'temp')
      try {
        if (!fs.existsSync(dest)) {
          fs.mkdirSync(dest, { recursive: true })
        }
      } catch (e) {
        // fallback to current relative path if mkdir fails
      }
      cb(null, dest)
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname || `upload-${Date.now()}`)
    }
  })
  
export const upload = multer(
    {
        storage
    }
)