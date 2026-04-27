import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import type { AdminLoginBody, AdminLoginResponse, ErrorResponse, HealthStatus, OperationHistoryItem, OperationState, StatsSummary, UpdateOperationBody } from "./api.schemas";
import { customFetch } from "../custom-fetch";
import type { ErrorType, BodyType } from "../custom-fetch";
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
/**
 * Returns server health status
 * @summary Health check
 */
export declare const getHealthCheckUrl: () => string;
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * Returns the live operation, social proof counters, and WhatsApp link
 * @summary Get current operation state
 */
export declare const getGetOperationUrl: () => string;
export declare const getOperation: (options?: RequestInit) => Promise<OperationState>;
export declare const getGetOperationQueryKey: () => readonly ["/api/operation"];
export declare const getGetOperationQueryOptions: <TData = Awaited<ReturnType<typeof getOperation>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getOperation>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getOperation>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetOperationQueryResult = NonNullable<Awaited<ReturnType<typeof getOperation>>>;
export type GetOperationQueryError = ErrorType<unknown>;
/**
 * @summary Get current operation state
 */
export declare function useGetOperation<TData = Awaited<ReturnType<typeof getOperation>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getOperation>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * Returns the most recent finished operations for display
 * @summary Recent finished operations
 */
export declare const getGetOperationHistoryUrl: () => string;
export declare const getOperationHistory: (options?: RequestInit) => Promise<OperationHistoryItem[]>;
export declare const getGetOperationHistoryQueryKey: () => readonly ["/api/operation/history"];
export declare const getGetOperationHistoryQueryOptions: <TData = Awaited<ReturnType<typeof getOperationHistory>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getOperationHistory>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getOperationHistory>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetOperationHistoryQueryResult = NonNullable<Awaited<ReturnType<typeof getOperationHistory>>>;
export type GetOperationHistoryQueryError = ErrorType<unknown>;
/**
 * @summary Recent finished operations
 */
export declare function useGetOperationHistory<TData = Awaited<ReturnType<typeof getOperationHistory>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getOperationHistory>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * Returns aggregated stats for display in the social proof section
 * @summary Aggregated stats summary
 */
export declare const getGetOperationStatsUrl: () => string;
export declare const getOperationStats: (options?: RequestInit) => Promise<StatsSummary>;
export declare const getGetOperationStatsQueryKey: () => readonly ["/api/operation/stats"];
export declare const getGetOperationStatsQueryOptions: <TData = Awaited<ReturnType<typeof getOperationStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getOperationStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getOperationStats>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetOperationStatsQueryResult = NonNullable<Awaited<ReturnType<typeof getOperationStats>>>;
export type GetOperationStatsQueryError = ErrorType<unknown>;
/**
 * @summary Aggregated stats summary
 */
export declare function useGetOperationStats<TData = Awaited<ReturnType<typeof getOperationStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getOperationStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * Validates the admin password and returns a session token
 * @summary Validate admin password
 */
export declare const getAdminLoginUrl: () => string;
export declare const adminLogin: (adminLoginBody: AdminLoginBody, options?: RequestInit) => Promise<AdminLoginResponse>;
export declare const getAdminLoginMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminLogin>>, TError, {
        data: BodyType<AdminLoginBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof adminLogin>>, TError, {
    data: BodyType<AdminLoginBody>;
}, TContext>;
export type AdminLoginMutationResult = NonNullable<Awaited<ReturnType<typeof adminLogin>>>;
export type AdminLoginMutationBody = BodyType<AdminLoginBody>;
export type AdminLoginMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Validate admin password
 */
export declare const useAdminLogin: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminLogin>>, TError, {
        data: BodyType<AdminLoginBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof adminLogin>>, TError, {
    data: BodyType<AdminLoginBody>;
}, TContext>;
/**
 * Updates the live operation and social proof settings (admin only)
 * @summary Update operation state
 */
export declare const getUpdateOperationUrl: () => string;
export declare const updateOperation: (updateOperationBody: UpdateOperationBody, options?: RequestInit) => Promise<OperationState>;
export declare const getUpdateOperationMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateOperation>>, TError, {
        data: BodyType<UpdateOperationBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateOperation>>, TError, {
    data: BodyType<UpdateOperationBody>;
}, TContext>;
export type UpdateOperationMutationResult = NonNullable<Awaited<ReturnType<typeof updateOperation>>>;
export type UpdateOperationMutationBody = BodyType<UpdateOperationBody>;
export type UpdateOperationMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Update operation state
 */
export declare const useUpdateOperation: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateOperation>>, TError, {
        data: BodyType<UpdateOperationBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateOperation>>, TError, {
    data: BodyType<UpdateOperationBody>;
}, TContext>;
export {};
//# sourceMappingURL=api.d.ts.map