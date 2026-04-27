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
      currentAdmin?: {
        id: string;
        email: string;
        role: string;
        fullName: string;
        adminRoleId: string;
        allowedPages: string[];
        canPublish: boolean;
        canManageUsers: boolean;
      };
      currentAdminSessionToken?: string;
    }
  }
}

export {};
