import { ApiError } from "../utils/ApiError.js";

export function validate(Schema) {
  return (req, res, next) => {
    try {
      req.body = Schema.parse(req.body);
      next();
    } catch (error) {
      throw new ApiError(400, "Bad Request, ", error);
    }
  };
}
