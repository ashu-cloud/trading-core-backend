import rateLimit from 'express-rate-limit';


export const marketLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: {
    success: false,
    message: "Too many requests, please try again later"
  }
});

