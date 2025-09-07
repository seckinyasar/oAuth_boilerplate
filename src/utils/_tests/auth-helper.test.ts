import { Account } from "@prisma/client";
import * as Sentry from "@sentry/nextjs";
import { prisma } from "../../../prisma";
import {
  checkIfRefreshTokenExists,
  checkIfTokenExpired,
  getGoogleAccount,
  handleSessionTokenRefresh,
  refreshGoogleAccessToken,
} from "../auth-helper";

// Mock dependencies
jest.mock("../../../prisma", () => ({
  prisma: {
    account: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("@sentry/nextjs", () => ({
  captureException: jest.fn(),
}));

// Mock fetch globally
global.fetch = jest.fn();

// Mock environment variables
process.env.GOOGLE_CLIENT_ID = "test-client-id";
process.env.GOOGLE_CLIENT_SECRET = "test-client-secret";

const mockPrisma = {
  account: {
    findMany: jest.fn(),
    update: jest.fn(),
  },
};
const mockSentry = Sentry as jest.Mocked<typeof Sentry>;
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe("Auth Helper Functions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2024-01-01T00:00:00Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("getGoogleAccount", () => {
    const mockAccount: Account = {
      userId: "user-1",
      type: "oauth",
      provider: "google",
      providerAccountId: "google-123",
      refresh_token: "refresh-token-123",
      access_token: "access-token-123",
      expires_at: 1704067200, // 2024-01-01T00:00:00Z
      token_type: "Bearer",
      scope: "openid email profile",
      id_token: "id-token-123",
      session_state: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("should return Google account when account exists", async () => {
      mockPrisma.account.findMany.mockResolvedValue([mockAccount]);

      const result = await getGoogleAccount("user-1");

      expect(result).toEqual(mockAccount);
      expect(mockPrisma.account.findMany).toHaveBeenCalledWith({
        where: {
          provider: "google",
          userId: "user-1",
        },
      });
    });

    it("should return undefined when no account found", async () => {
      mockPrisma.account.findMany.mockResolvedValue([]);

      const result = await getGoogleAccount("user-1");

      expect(result).toBeUndefined();
      expect(mockPrisma.account.findMany).toHaveBeenCalledWith({
        where: {
          provider: "google",
          userId: "user-1",
        },
      });
    });

    it("should return undefined when account is null", async () => {
      mockPrisma.account.findMany.mockResolvedValue([null as any]);

      const result = await getGoogleAccount("user-1");

      expect(result).toBeUndefined();
    });

    it("should handle database errors", async () => {
      const dbError = new Error("Database connection failed");
      mockPrisma.account.findMany.mockRejectedValue(dbError);

      await expect(getGoogleAccount("user-1")).rejects.toThrow(
        "Database connection failed"
      );
    });
  });

  describe("checkIfRefreshTokenExists", () => {
    it("should return true when refresh token exists", () => {
      const account: Account = {
        // id field'ı kaldırıldı
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: "user-1",
        type: "oauth",
        provider: "google",
        providerAccountId: "google-123",
        refresh_token: "refresh-token-123",
        access_token: "access-token-123",
        expires_at: 1704067200,
        token_type: "Bearer",
        scope: "openid email profile",
        id_token: "id-token-123",
        session_state: null,
      };

      const result = checkIfRefreshTokenExists(account);

      expect(result).toBe(true);
    });

    it("should return false when refresh token is null", () => {
      const account: Account = {
        // id field'ı kaldırıldı
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: "user-1",
        type: "oauth",
        provider: "google",
        providerAccountId: "google-123",
        refresh_token: null,
        access_token: "access-token-123",
        expires_at: 1704067200,
        token_type: "Bearer",
        scope: "openid email profile",
        id_token: "id-token-123",
        session_state: null,
      };

      const result = checkIfRefreshTokenExists(account);

      expect(result).toBe(false);
    });

    it("should return false when refresh token is undefined", () => {
      const account: Account = {
        // id field'ı kaldırıldı
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: "user-1",
        type: "oauth",
        provider: "google",
        providerAccountId: "google-123",
        refresh_token: null,
        access_token: "access-token-123",
        expires_at: 1704067200,
        token_type: "Bearer",
        scope: "openid email profile",
        id_token: "id-token-123",
        session_state: null,
      };

      const result = checkIfRefreshTokenExists(account);

      expect(result).toBe(false);
    });
  });

  describe("checkIfTokenExpired", () => {
    it("should return true when expires_at is null", () => {
      const account: Account = {
        // id field'ı kaldırıldı
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: "user-1",
        type: "oauth",
        provider: "google",
        providerAccountId: "google-123",
        refresh_token: "refresh-token-123",
        access_token: "access-token-123",
        expires_at: null,
        token_type: "Bearer",
        scope: "openid email profile",
        id_token: "id-token-123",
        session_state: null,
      };

      const result = checkIfTokenExpired(account);

      expect(result).toBe(true);
    });

    it("should return true when token is expired", () => {
      const account: Account = {
        // id field'ı kaldırıldı
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: "user-1",
        type: "oauth",
        provider: "google",
        providerAccountId: "google-123",
        refresh_token: "refresh-token-123",
        access_token: "access-token-123",
        expires_at: 1704067100, // 100 seconds ago
        token_type: "Bearer",
        scope: "openid email profile",
        id_token: "id-token-123",
        session_state: null,
      };

      const result = checkIfTokenExpired(account);

      expect(result).toBe(true);
    });

    it("should return false when token is not expired", () => {
      const account: Account = {
        // id field'ı kaldırıldı
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: "user-1",
        type: "oauth",
        provider: "google",
        providerAccountId: "google-123",
        refresh_token: "refresh-token-123",
        access_token: "access-token-123",
        expires_at: 1909097300, //? in 5 years
        token_type: "Bearer",
        scope: "openid email profile",
        id_token: "id-token-123",
        session_state: null,
      };

      const result = checkIfTokenExpired(account);

      expect(result).toBe(false);
    });
  });

  describe("handleSessionTokenRefresh", () => {
    const mockAccount: Account = {
      // id field'ı kaldırıldı
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: "user-1",
      type: "oauth",
      provider: "google",
      providerAccountId: "google-123",
      refresh_token: "refresh-token-123",
      access_token: "access-token-123",
      expires_at: 1704067100, // expired
      token_type: "Bearer",
      scope: "openid email profile",
      id_token: "id-token-123",
      session_state: null,
    };

    it("should return undefined when no Google account found", async () => {
      mockPrisma.account.findMany.mockResolvedValue([]);

      const result = await handleSessionTokenRefresh("user-1");

      expect(result).toBeUndefined();
    });

    it("should return undefined when token is not expired", async () => {
      const nonExpiredAccount = { ...mockAccount, expires_at: 1909097300 };
      mockPrisma.account.findMany.mockResolvedValue([nonExpiredAccount]);

      const result = await handleSessionTokenRefresh("user-1");

      expect(result).toBeUndefined();
    });

    it("should return undefined when token refresh is successful", async () => {
      mockPrisma.account.findMany.mockResolvedValue([mockAccount]);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: "new-access-token",
            expires_in: 3600,
            refresh_token: "new-refresh-token",
          }),
      } as Response);
      mockPrisma.account.update.mockResolvedValue(mockAccount);

      const result = await handleSessionTokenRefresh("user-1");

      expect(result).toBeUndefined();
    });

    it("should return error when token refresh fails", async () => {
      mockPrisma.account.findMany.mockResolvedValue([mockAccount]);
      mockFetch.mockResolvedValue({
        ok: false,
        json: () =>
          Promise.resolve({
            error: "invalid_grant",
            error_description: "Refresh token expired",
          }),
      } as Response);

      const result = await handleSessionTokenRefresh("user-1");

      expect(result).toEqual({
        error: "invalid_grant",
        error_description: "Refresh token expired",
      });
    });

    it("should capture exception and return error when exception occurs", async () => {
      const error = new Error("Network error");
      mockPrisma.account.findMany.mockRejectedValue(error);

      const result = await handleSessionTokenRefresh("user-1");

      expect(mockSentry.captureException).toHaveBeenCalledWith(error, {
        tags: {
          error_type: "handleSessionTokenRefresh",
        },
      });
      expect(result).toBe(error);
    });
  });

  describe("refreshGoogleAccessToken", () => {
    const mockAccount: Account = {
      // id field'ı kaldırıldı
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: "user-1",
      type: "oauth",
      provider: "google",
      providerAccountId: "google-123",
      refresh_token: "refresh-token-123",
      access_token: "access-token-123",
      expires_at: 1704067200,
      token_type: "Bearer",
      scope: "openid email profile",
      id_token: "id-token-123",
      session_state: null,
    };

    it("should successfully refresh token and update database", async () => {
      const newTokens = {
        access_token: "new-access-token",
        expires_in: 3600,
        refresh_token: "new-refresh-token",
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(newTokens),
      } as Response);
      mockPrisma.account.update.mockResolvedValue(mockAccount);

      const result = await refreshGoogleAccessToken(mockAccount);

      expect(result).toEqual({
        success: true,
        tokens: newTokens,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://oauth2.googleapis.com/token",
        {
          method: "POST",
          body: new URLSearchParams({
            client_id: "test-client-id",
            client_secret: "test-client-secret",
            grant_type: "refresh_token",
            refresh_token: "refresh-token-123",
          }),
        }
      );

      expect(mockPrisma.account.update).toHaveBeenCalledWith({
        data: {
          access_token: "new-access-token",
          expires_at: expect.any(Number),
          refresh_token: "new-refresh-token",
        },
        where: {
          provider_providerAccountId: {
            provider: "google",
            providerAccountId: "google-123",
          },
        },
      });
    });

    it("should handle invalid_grant error", async () => {
      const errorResponse = {
        error: "invalid_grant",
        error_description: "Refresh token expired or revoked",
      };

      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve(errorResponse),
      } as Response);

      const result = await refreshGoogleAccessToken(mockAccount);

      expect(result).toEqual({
        success: false,
        error: {
          error: "invalid_grant",
          error_description: "Refresh token expired or revoked",
        },
      });

      expect(mockSentry.captureException).toHaveBeenCalledWith(errorResponse, {
        tags: {
          error_type: "refreshGoogleAccessToken",
        },
      });
    });

    it("should handle invalid_client error", async () => {
      const errorResponse = {
        error: "invalid_client",
        error_description: "Invalid client credentials",
      };

      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve(errorResponse),
      } as Response);

      const result = await refreshGoogleAccessToken(mockAccount);

      expect(result).toEqual({
        success: false,
        error: {
          error: "invalid_client",
          error_description: "Invalid client credentials",
        },
      });
    });

    it("should handle generic error", async () => {
      const errorResponse = {
        error: "server_error",
        error_description: "Internal server error",
      };

      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve(errorResponse),
      } as Response);

      const result = await refreshGoogleAccessToken(mockAccount);

      expect(result).toEqual({
        success: false,
        error: errorResponse,
      });
    });

    it("should handle network errors", async () => {
      const networkError = new Error("Network error");
      mockFetch.mockRejectedValue(networkError);

      const result = await refreshGoogleAccessToken(mockAccount);

      expect(result).toEqual({
        success: false,
        error: networkError,
      });

      expect(mockSentry.captureException).toHaveBeenCalledWith(networkError, {
        tags: {
          error_type: "refreshGoogleAccessToken",
        },
      });
    });

    it("should handle database update errors", async () => {
      const newTokens = {
        access_token: "new-access-token",
        expires_in: 3600,
        refresh_token: "new-refresh-token",
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(newTokens),
      } as Response);

      const dbError = new Error("Database update failed");
      mockPrisma.account.update.mockRejectedValue(dbError);

      const result = await refreshGoogleAccessToken(mockAccount);

      expect(result).toEqual({
        success: false,
        error: dbError,
      });

      expect(mockSentry.captureException).toHaveBeenCalledWith(dbError, {
        tags: {
          error_type: "refreshGoogleAccessToken",
        },
      });
    });

    it("should use existing refresh token when new one is not provided", async () => {
      const newTokens = {
        access_token: "new-access-token",
        expires_in: 3600,
        // No refresh_token in response
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(newTokens),
      } as Response);
      mockPrisma.account.update.mockResolvedValue(mockAccount);

      const result = await refreshGoogleAccessToken(mockAccount);

      expect(result.success).toBe(true);
      expect(mockPrisma.account.update).toHaveBeenCalledWith({
        data: {
          access_token: "new-access-token",
          expires_at: expect.any(Number),
          refresh_token: "refresh-token-123", // Should use existing refresh token
        },
        where: {
          provider_providerAccountId: {
            provider: "google",
            providerAccountId: "google-123",
          },
        },
      });
    });

    it("should calculate correct expiration time", async () => {
      const newTokens = {
        access_token: "new-access-token",
        expires_in: 3600, // 1 hour
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(newTokens),
      } as Response);
      mockPrisma.account.update.mockResolvedValue(mockAccount);

      await refreshGoogleAccessToken(mockAccount);

      const updateCall = mockPrisma.account.update.mock.calls[0];
      const expiresAt = updateCall[0].data.expires_at;
      const expectedExpiresAt = Math.floor(Date.now() / 1000) + 3600;

      expect(expiresAt).toBe(expectedExpiresAt);
    });
  });
});
