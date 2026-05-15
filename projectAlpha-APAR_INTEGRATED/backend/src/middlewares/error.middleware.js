import { ApiError } from "../utils/api-error.js";

export const errorHandler = (err, req, res, next)=>{

    if (err instanceof ApiError){

        res.status(err.statusCode)
        .json(
            {
                message : err.message,
                statusCode : err.statusCode,
                errors : err.errors,
                stack : err.stack,
                success : err.success
            }
        )
    }else{
        res.status(500)
        .json(
            {
                message : err.message,
                statusCode : 500,
                errors : [],
                stack : err.stack,
                success : false
            }
        )
    }

}