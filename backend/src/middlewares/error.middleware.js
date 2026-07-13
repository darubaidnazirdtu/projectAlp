import { ApiError } from "../utils/api-error.js";

export const errorHandler = (err, req, res, next)=>{
    const showStack = process.env.NODE_ENV !== 'production' && !process.env.RENDER;

    if (err?.name === 'MulterError') {
        const message = err.code === 'LIMIT_FILE_SIZE'
            ? 'File exceeds the 50 MB limit'
            : err.message;
        return res.status(400).json({ message, statusCode: 400, errors: [], success: false });
    }

    if (err?.message === 'Only PDF files are allowed') {
        return res.status(400).json({ message: err.message, statusCode: 400, errors: [], success: false });
    }

    if (err instanceof ApiError){

        res.status(err.statusCode)
        .json(
            {
                message : err.message,
                statusCode : err.statusCode,
                errors : err.errors,
                ...(showStack ? { stack : err.stack } : {}),
                success : err.success
            }
        )
    }else{
        res.status(500)
        .json(
            {
                message : showStack ? err.message : 'Internal server error',
                statusCode : 500,
                errors : [],
                ...(showStack ? { stack : err.stack } : {}),
                success : false
            }
        )
    }

}
