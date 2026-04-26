import "express";

declare global {
  namespace Express {
    interface Request {
      currentCustomer?: {
        id: string;
        email: string;
        role: string;
      };
      currentCustomerSessionToken?: string;
    }
  }
}

export {};
