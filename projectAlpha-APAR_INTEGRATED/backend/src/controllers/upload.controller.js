import { asyncHandler } from "../utils/async-handler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";

const uploadFile = asyncHandler(async (req, res) => {
    const localFilePath = req.file?.path;

    if (!localFilePath) {
        throw new ApiError(400, "No file uploaded");
    }

    const response = await uploadOnCloudinary(localFilePath);

    if (!response) {
        throw new ApiError(500, "Failed to upload file to cloud");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { url: response.secure_url }, "File uploaded successfully"));
});

export { uploadFile };
