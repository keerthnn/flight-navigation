"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
function validate(schema) {
    return (req, _res, next) => {
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next();
    };
}
