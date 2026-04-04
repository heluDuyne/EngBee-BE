import { Request, Response, NextFunction } from "express";

export interface ErrorResponse {
  message: string;
  status: number;
  details?: any;
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";

  console.error(`[Error] ${status} - ${message}`);
  console.error(err.stack);

  const errorResponse: ErrorResponse = {
    message,
    status,
  };

  if (process.env.NODE_ENV === "development" && err.details) {
    errorResponse.details = err.details;
  }

  res.status(status).json(errorResponse);
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.status(404).json({
    message: "Route not found",
    status: 404,
  });
};
