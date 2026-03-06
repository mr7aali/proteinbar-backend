"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
const AppError_1 = require("../utils/AppError");
function validate(schema, source = "body") {
    return (req, _res, next) => {
        const result = schema.safeParse(req[source]);
        if (!result.success) {
            return next(new AppError_1.AppError(400, "Validation failed", result.error.flatten()));
        }
        if (source === "body")
            req.body = result.data;
        if (source === "query")
            req.query = result.data;
        if (source === "params")
            req.params = result.data;
        return next();
    };
}
