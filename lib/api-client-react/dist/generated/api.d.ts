import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import type { AuditLogListResponse, BiomarkerListResponse, BiomarkerResult, ConsentListResponse, ConsentRecord, ConvertLead200, CreateBiomarkerRequest, CreateLeadInput, CreateLineItemRequest, CreatePatientBody, CreateQuoteRequest, CreateServiceRequest, CreateUserRequest, Document, DocumentListResponse, DownloadDocumentContentParams, DownloadDocumentResponse, ErrorResponse, GdprDeleteResponse, GdprExportResponse, GetAuditLogsParams, GrantConsentRequest, HealthStatus, IntakeForm, IntakeFormData, Lead, LineItem, ListBiomarkersParams, ListDocumentsParams, ListLeads200, ListLeadsParams, ListPatientsParams, ListQuotesParams, ListServicesParams, ListUsersParams, LoginRequest, MessageResponse, Patient, PatientDetail, PatientListResponse, Quote, QuoteDetail, QuoteListResponse, RegisterRequest, Service, ServiceListResponse, UpdateBiomarkerResultBody, UpdateDocumentMetadataBody, UpdateLeadInput, UpdateLineItemBody, UpdatePatientRequest, UpdateQuoteRequest, UpdateServiceRequest, UpdateUserRequest, UploadDocumentContent200, UploadDocumentRequest, UploadDocumentResponse, UserListResponse, UserProfile } from "./api.schemas";
import { customFetch } from "../custom-fetch";
import type { ErrorType, BodyType } from "../custom-fetch";
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
/**
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
 * @summary Register a new user
 */
export declare const getRegisterUrl: () => string;
export declare const register: (registerRequest: RegisterRequest, options?: RequestInit) => Promise<UserProfile>;
export declare const getRegisterMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof register>>, TError, {
        data: BodyType<RegisterRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof register>>, TError, {
    data: BodyType<RegisterRequest>;
}, TContext>;
export type RegisterMutationResult = NonNullable<Awaited<ReturnType<typeof register>>>;
export type RegisterMutationBody = BodyType<RegisterRequest>;
export type RegisterMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Register a new user
 */
export declare const useRegister: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof register>>, TError, {
        data: BodyType<RegisterRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof register>>, TError, {
    data: BodyType<RegisterRequest>;
}, TContext>;
/**
 * @summary Log in
 */
export declare const getLoginUrl: () => string;
export declare const login: (loginRequest: LoginRequest, options?: RequestInit) => Promise<UserProfile>;
export declare const getLoginMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof login>>, TError, {
        data: BodyType<LoginRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof login>>, TError, {
    data: BodyType<LoginRequest>;
}, TContext>;
export type LoginMutationResult = NonNullable<Awaited<ReturnType<typeof login>>>;
export type LoginMutationBody = BodyType<LoginRequest>;
export type LoginMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Log in
 */
export declare const useLogin: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof login>>, TError, {
        data: BodyType<LoginRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof login>>, TError, {
    data: BodyType<LoginRequest>;
}, TContext>;
/**
 * @summary Log out
 */
export declare const getLogoutUrl: () => string;
export declare const logout: (options?: RequestInit) => Promise<MessageResponse>;
export declare const getLogoutMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
export type LogoutMutationResult = NonNullable<Awaited<ReturnType<typeof logout>>>;
export type LogoutMutationError = ErrorType<unknown>;
/**
 * @summary Log out
 */
export declare const useLogout: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
/**
 * @summary Get current user
 */
export declare const getGetCurrentUserUrl: () => string;
export declare const getCurrentUser: (options?: RequestInit) => Promise<UserProfile>;
export declare const getGetCurrentUserQueryKey: () => readonly ["/api/auth/me"];
export declare const getGetCurrentUserQueryOptions: <TData = Awaited<ReturnType<typeof getCurrentUser>>, TError = ErrorType<ErrorResponse>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCurrentUser>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getCurrentUser>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetCurrentUserQueryResult = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
export type GetCurrentUserQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Get current user
 */
export declare function useGetCurrentUser<TData = Awaited<ReturnType<typeof getCurrentUser>>, TError = ErrorType<ErrorResponse>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCurrentUser>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary List users (Super Admin only)
 */
export declare const getListUsersUrl: (params?: ListUsersParams) => string;
export declare const listUsers: (params?: ListUsersParams, options?: RequestInit) => Promise<UserListResponse>;
export declare const getListUsersQueryKey: (params?: ListUsersParams) => readonly ["/api/users", ...ListUsersParams[]];
export declare const getListUsersQueryOptions: <TData = Awaited<ReturnType<typeof listUsers>>, TError = ErrorType<unknown>>(params?: ListUsersParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listUsers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listUsers>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListUsersQueryResult = NonNullable<Awaited<ReturnType<typeof listUsers>>>;
export type ListUsersQueryError = ErrorType<unknown>;
/**
 * @summary List users (Super Admin only)
 */
export declare function useListUsers<TData = Awaited<ReturnType<typeof listUsers>>, TError = ErrorType<unknown>>(params?: ListUsersParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listUsers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create user (Super Admin only)
 */
export declare const getCreateUserUrl: () => string;
export declare const createUser: (createUserRequest: CreateUserRequest, options?: RequestInit) => Promise<UserProfile>;
export declare const getCreateUserMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createUser>>, TError, {
        data: BodyType<CreateUserRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createUser>>, TError, {
    data: BodyType<CreateUserRequest>;
}, TContext>;
export type CreateUserMutationResult = NonNullable<Awaited<ReturnType<typeof createUser>>>;
export type CreateUserMutationBody = BodyType<CreateUserRequest>;
export type CreateUserMutationError = ErrorType<unknown>;
/**
 * @summary Create user (Super Admin only)
 */
export declare const useCreateUser: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createUser>>, TError, {
        data: BodyType<CreateUserRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createUser>>, TError, {
    data: BodyType<CreateUserRequest>;
}, TContext>;
/**
 * @summary Update user (Super Admin only)
 */
export declare const getUpdateUserUrl: (userId: string) => string;
export declare const updateUser: (userId: string, updateUserRequest: UpdateUserRequest, options?: RequestInit) => Promise<UserProfile>;
export declare const getUpdateUserMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateUser>>, TError, {
        userId: string;
        data: BodyType<UpdateUserRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateUser>>, TError, {
    userId: string;
    data: BodyType<UpdateUserRequest>;
}, TContext>;
export type UpdateUserMutationResult = NonNullable<Awaited<ReturnType<typeof updateUser>>>;
export type UpdateUserMutationBody = BodyType<UpdateUserRequest>;
export type UpdateUserMutationError = ErrorType<unknown>;
/**
 * @summary Update user (Super Admin only)
 */
export declare const useUpdateUser: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateUser>>, TError, {
        userId: string;
        data: BodyType<UpdateUserRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateUser>>, TError, {
    userId: string;
    data: BodyType<UpdateUserRequest>;
}, TContext>;
/**
 * @summary Get audit logs (Super Admin only)
 */
export declare const getGetAuditLogsUrl: (params?: GetAuditLogsParams) => string;
export declare const getAuditLogs: (params?: GetAuditLogsParams, options?: RequestInit) => Promise<AuditLogListResponse>;
export declare const getGetAuditLogsQueryKey: (params?: GetAuditLogsParams) => readonly ["/api/users/audit-logs", ...GetAuditLogsParams[]];
export declare const getGetAuditLogsQueryOptions: <TData = Awaited<ReturnType<typeof getAuditLogs>>, TError = ErrorType<unknown>>(params?: GetAuditLogsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAuditLogs>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getAuditLogs>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetAuditLogsQueryResult = NonNullable<Awaited<ReturnType<typeof getAuditLogs>>>;
export type GetAuditLogsQueryError = ErrorType<unknown>;
/**
 * @summary Get audit logs (Super Admin only)
 */
export declare function useGetAuditLogs<TData = Awaited<ReturnType<typeof getAuditLogs>>, TError = ErrorType<unknown>>(params?: GetAuditLogsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAuditLogs>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary List patients
 */
export declare const getListPatientsUrl: (params?: ListPatientsParams) => string;
export declare const listPatients: (params?: ListPatientsParams, options?: RequestInit) => Promise<PatientListResponse>;
export declare const getListPatientsQueryKey: (params?: ListPatientsParams) => readonly ["/api/patients", ...ListPatientsParams[]];
export declare const getListPatientsQueryOptions: <TData = Awaited<ReturnType<typeof listPatients>>, TError = ErrorType<unknown>>(params?: ListPatientsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listPatients>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listPatients>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListPatientsQueryResult = NonNullable<Awaited<ReturnType<typeof listPatients>>>;
export type ListPatientsQueryError = ErrorType<unknown>;
/**
 * @summary List patients
 */
export declare function useListPatients<TData = Awaited<ReturnType<typeof listPatients>>, TError = ErrorType<unknown>>(params?: ListPatientsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listPatients>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create patient (Care Coordinator / Super Admin)
 */
export declare const getCreatePatientUrl: () => string;
export declare const createPatient: (createPatientBody: CreatePatientBody, options?: RequestInit) => Promise<PatientDetail>;
export declare const getCreatePatientMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createPatient>>, TError, {
        data: BodyType<CreatePatientBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createPatient>>, TError, {
    data: BodyType<CreatePatientBody>;
}, TContext>;
export type CreatePatientMutationResult = NonNullable<Awaited<ReturnType<typeof createPatient>>>;
export type CreatePatientMutationBody = BodyType<CreatePatientBody>;
export type CreatePatientMutationError = ErrorType<unknown>;
/**
 * @summary Create patient (Care Coordinator / Super Admin)
 */
export declare const useCreatePatient: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createPatient>>, TError, {
        data: BodyType<CreatePatientBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createPatient>>, TError, {
    data: BodyType<CreatePatientBody>;
}, TContext>;
/**
 * @summary Get own patient profile
 */
export declare const getGetMyProfileUrl: () => string;
export declare const getMyProfile: (options?: RequestInit) => Promise<Patient>;
export declare const getGetMyProfileQueryKey: () => readonly ["/api/patients/me/profile"];
export declare const getGetMyProfileQueryOptions: <TData = Awaited<ReturnType<typeof getMyProfile>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMyProfile>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getMyProfile>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetMyProfileQueryResult = NonNullable<Awaited<ReturnType<typeof getMyProfile>>>;
export type GetMyProfileQueryError = ErrorType<unknown>;
/**
 * @summary Get own patient profile
 */
export declare function useGetMyProfile<TData = Awaited<ReturnType<typeof getMyProfile>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMyProfile>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get patient detail
 */
export declare const getGetPatientUrl: (patientId: string) => string;
export declare const getPatient: (patientId: string, options?: RequestInit) => Promise<PatientDetail>;
export declare const getGetPatientQueryKey: (patientId: string) => readonly [`/api/patients/${string}`];
export declare const getGetPatientQueryOptions: <TData = Awaited<ReturnType<typeof getPatient>>, TError = ErrorType<unknown>>(patientId: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPatient>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getPatient>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetPatientQueryResult = NonNullable<Awaited<ReturnType<typeof getPatient>>>;
export type GetPatientQueryError = ErrorType<unknown>;
/**
 * @summary Get patient detail
 */
export declare function useGetPatient<TData = Awaited<ReturnType<typeof getPatient>>, TError = ErrorType<unknown>>(patientId: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPatient>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Update patient
 */
export declare const getUpdatePatientUrl: (patientId: string) => string;
export declare const updatePatient: (patientId: string, updatePatientRequest: UpdatePatientRequest, options?: RequestInit) => Promise<Patient>;
export declare const getUpdatePatientMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updatePatient>>, TError, {
        patientId: string;
        data: BodyType<UpdatePatientRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updatePatient>>, TError, {
    patientId: string;
    data: BodyType<UpdatePatientRequest>;
}, TContext>;
export type UpdatePatientMutationResult = NonNullable<Awaited<ReturnType<typeof updatePatient>>>;
export type UpdatePatientMutationBody = BodyType<UpdatePatientRequest>;
export type UpdatePatientMutationError = ErrorType<unknown>;
/**
 * @summary Update patient
 */
export declare const useUpdatePatient: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updatePatient>>, TError, {
        patientId: string;
        data: BodyType<UpdatePatientRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updatePatient>>, TError, {
    patientId: string;
    data: BodyType<UpdatePatientRequest>;
}, TContext>;
/**
 * @summary Delete patient (Super Admin only)
 */
export declare const getDeletePatientUrl: (patientId: string) => string;
export declare const deletePatient: (patientId: string, options?: RequestInit) => Promise<MessageResponse>;
export declare const getDeletePatientMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deletePatient>>, TError, {
        patientId: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deletePatient>>, TError, {
    patientId: string;
}, TContext>;
export type DeletePatientMutationResult = NonNullable<Awaited<ReturnType<typeof deletePatient>>>;
export type DeletePatientMutationError = ErrorType<unknown>;
/**
 * @summary Delete patient (Super Admin only)
 */
export declare const useDeletePatient: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deletePatient>>, TError, {
        patientId: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deletePatient>>, TError, {
    patientId: string;
}, TContext>;
/**
 * @summary List all leads
 */
export declare const getListLeadsUrl: (params?: ListLeadsParams) => string;
export declare const listLeads: (params?: ListLeadsParams, options?: RequestInit) => Promise<ListLeads200>;
export declare const getListLeadsQueryKey: (params?: ListLeadsParams) => readonly ["/api/leads", ...ListLeadsParams[]];
export declare const getListLeadsQueryOptions: <TData = Awaited<ReturnType<typeof listLeads>>, TError = ErrorType<unknown>>(params?: ListLeadsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listLeads>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listLeads>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListLeadsQueryResult = NonNullable<Awaited<ReturnType<typeof listLeads>>>;
export type ListLeadsQueryError = ErrorType<unknown>;
/**
 * @summary List all leads
 */
export declare function useListLeads<TData = Awaited<ReturnType<typeof listLeads>>, TError = ErrorType<unknown>>(params?: ListLeadsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listLeads>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create a new lead
 */
export declare const getCreateLeadUrl: () => string;
export declare const createLead: (createLeadInput: CreateLeadInput, options?: RequestInit) => Promise<Lead>;
export declare const getCreateLeadMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createLead>>, TError, {
        data: BodyType<CreateLeadInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createLead>>, TError, {
    data: BodyType<CreateLeadInput>;
}, TContext>;
export type CreateLeadMutationResult = NonNullable<Awaited<ReturnType<typeof createLead>>>;
export type CreateLeadMutationBody = BodyType<CreateLeadInput>;
export type CreateLeadMutationError = ErrorType<unknown>;
/**
 * @summary Create a new lead
 */
export declare const useCreateLead: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createLead>>, TError, {
        data: BodyType<CreateLeadInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createLead>>, TError, {
    data: BodyType<CreateLeadInput>;
}, TContext>;
/**
 * @summary Get lead details
 */
export declare const getGetLeadUrl: (leadId: string) => string;
export declare const getLead: (leadId: string, options?: RequestInit) => Promise<Lead>;
export declare const getGetLeadQueryKey: (leadId: string) => readonly [`/api/leads/${string}`];
export declare const getGetLeadQueryOptions: <TData = Awaited<ReturnType<typeof getLead>>, TError = ErrorType<unknown>>(leadId: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getLead>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getLead>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetLeadQueryResult = NonNullable<Awaited<ReturnType<typeof getLead>>>;
export type GetLeadQueryError = ErrorType<unknown>;
/**
 * @summary Get lead details
 */
export declare function useGetLead<TData = Awaited<ReturnType<typeof getLead>>, TError = ErrorType<unknown>>(leadId: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getLead>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Update a lead
 */
export declare const getUpdateLeadUrl: (leadId: string) => string;
export declare const updateLead: (leadId: string, updateLeadInput: UpdateLeadInput, options?: RequestInit) => Promise<Lead>;
export declare const getUpdateLeadMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateLead>>, TError, {
        leadId: string;
        data: BodyType<UpdateLeadInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateLead>>, TError, {
    leadId: string;
    data: BodyType<UpdateLeadInput>;
}, TContext>;
export type UpdateLeadMutationResult = NonNullable<Awaited<ReturnType<typeof updateLead>>>;
export type UpdateLeadMutationBody = BodyType<UpdateLeadInput>;
export type UpdateLeadMutationError = ErrorType<unknown>;
/**
 * @summary Update a lead
 */
export declare const useUpdateLead: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateLead>>, TError, {
        leadId: string;
        data: BodyType<UpdateLeadInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateLead>>, TError, {
    leadId: string;
    data: BodyType<UpdateLeadInput>;
}, TContext>;
/**
 * @summary Delete a lead
 */
export declare const getDeleteLeadUrl: (leadId: string) => string;
export declare const deleteLead: (leadId: string, options?: RequestInit) => Promise<MessageResponse>;
export declare const getDeleteLeadMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteLead>>, TError, {
        leadId: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteLead>>, TError, {
    leadId: string;
}, TContext>;
export type DeleteLeadMutationResult = NonNullable<Awaited<ReturnType<typeof deleteLead>>>;
export type DeleteLeadMutationError = ErrorType<unknown>;
/**
 * @summary Delete a lead
 */
export declare const useDeleteLead: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteLead>>, TError, {
        leadId: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteLead>>, TError, {
    leadId: string;
}, TContext>;
/**
 * @summary Convert lead to patient
 */
export declare const getConvertLeadUrl: (leadId: string) => string;
export declare const convertLead: (leadId: string, options?: RequestInit) => Promise<ConvertLead200>;
export declare const getConvertLeadMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof convertLead>>, TError, {
        leadId: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof convertLead>>, TError, {
    leadId: string;
}, TContext>;
export type ConvertLeadMutationResult = NonNullable<Awaited<ReturnType<typeof convertLead>>>;
export type ConvertLeadMutationError = ErrorType<unknown>;
/**
 * @summary Convert lead to patient
 */
export declare const useConvertLead: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof convertLead>>, TError, {
        leadId: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof convertLead>>, TError, {
    leadId: string;
}, TContext>;
/**
 * @summary List services
 */
export declare const getListServicesUrl: (params?: ListServicesParams) => string;
export declare const listServices: (params?: ListServicesParams, options?: RequestInit) => Promise<ServiceListResponse>;
export declare const getListServicesQueryKey: (params?: ListServicesParams) => readonly ["/api/services", ...ListServicesParams[]];
export declare const getListServicesQueryOptions: <TData = Awaited<ReturnType<typeof listServices>>, TError = ErrorType<unknown>>(params?: ListServicesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listServices>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listServices>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListServicesQueryResult = NonNullable<Awaited<ReturnType<typeof listServices>>>;
export type ListServicesQueryError = ErrorType<unknown>;
/**
 * @summary List services
 */
export declare function useListServices<TData = Awaited<ReturnType<typeof listServices>>, TError = ErrorType<unknown>>(params?: ListServicesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listServices>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create service (Super Admin only)
 */
export declare const getCreateServiceUrl: () => string;
export declare const createService: (createServiceRequest: CreateServiceRequest, options?: RequestInit) => Promise<Service>;
export declare const getCreateServiceMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createService>>, TError, {
        data: BodyType<CreateServiceRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createService>>, TError, {
    data: BodyType<CreateServiceRequest>;
}, TContext>;
export type CreateServiceMutationResult = NonNullable<Awaited<ReturnType<typeof createService>>>;
export type CreateServiceMutationBody = BodyType<CreateServiceRequest>;
export type CreateServiceMutationError = ErrorType<unknown>;
/**
 * @summary Create service (Super Admin only)
 */
export declare const useCreateService: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createService>>, TError, {
        data: BodyType<CreateServiceRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createService>>, TError, {
    data: BodyType<CreateServiceRequest>;
}, TContext>;
/**
 * @summary Get service detail
 */
export declare const getGetServiceUrl: (serviceId: string) => string;
export declare const getService: (serviceId: string, options?: RequestInit) => Promise<Service>;
export declare const getGetServiceQueryKey: (serviceId: string) => readonly [`/api/services/${string}`];
export declare const getGetServiceQueryOptions: <TData = Awaited<ReturnType<typeof getService>>, TError = ErrorType<unknown>>(serviceId: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getService>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getService>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetServiceQueryResult = NonNullable<Awaited<ReturnType<typeof getService>>>;
export type GetServiceQueryError = ErrorType<unknown>;
/**
 * @summary Get service detail
 */
export declare function useGetService<TData = Awaited<ReturnType<typeof getService>>, TError = ErrorType<unknown>>(serviceId: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getService>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Update service (Super Admin only)
 */
export declare const getUpdateServiceUrl: (serviceId: string) => string;
export declare const updateService: (serviceId: string, updateServiceRequest: UpdateServiceRequest, options?: RequestInit) => Promise<Service>;
export declare const getUpdateServiceMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateService>>, TError, {
        serviceId: string;
        data: BodyType<UpdateServiceRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateService>>, TError, {
    serviceId: string;
    data: BodyType<UpdateServiceRequest>;
}, TContext>;
export type UpdateServiceMutationResult = NonNullable<Awaited<ReturnType<typeof updateService>>>;
export type UpdateServiceMutationBody = BodyType<UpdateServiceRequest>;
export type UpdateServiceMutationError = ErrorType<unknown>;
/**
 * @summary Update service (Super Admin only)
 */
export declare const useUpdateService: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateService>>, TError, {
        serviceId: string;
        data: BodyType<UpdateServiceRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateService>>, TError, {
    serviceId: string;
    data: BodyType<UpdateServiceRequest>;
}, TContext>;
/**
 * @summary Delete service (Super Admin only)
 */
export declare const getDeleteServiceUrl: (serviceId: string) => string;
export declare const deleteService: (serviceId: string, options?: RequestInit) => Promise<MessageResponse>;
export declare const getDeleteServiceMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteService>>, TError, {
        serviceId: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteService>>, TError, {
    serviceId: string;
}, TContext>;
export type DeleteServiceMutationResult = NonNullable<Awaited<ReturnType<typeof deleteService>>>;
export type DeleteServiceMutationError = ErrorType<unknown>;
/**
 * @summary Delete service (Super Admin only)
 */
export declare const useDeleteService: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteService>>, TError, {
        serviceId: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteService>>, TError, {
    serviceId: string;
}, TContext>;
/**
 * @summary List quotes
 */
export declare const getListQuotesUrl: (params?: ListQuotesParams) => string;
export declare const listQuotes: (params?: ListQuotesParams, options?: RequestInit) => Promise<QuoteListResponse>;
export declare const getListQuotesQueryKey: (params?: ListQuotesParams) => readonly ["/api/quotes", ...ListQuotesParams[]];
export declare const getListQuotesQueryOptions: <TData = Awaited<ReturnType<typeof listQuotes>>, TError = ErrorType<unknown>>(params?: ListQuotesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listQuotes>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listQuotes>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListQuotesQueryResult = NonNullable<Awaited<ReturnType<typeof listQuotes>>>;
export type ListQuotesQueryError = ErrorType<unknown>;
/**
 * @summary List quotes
 */
export declare function useListQuotes<TData = Awaited<ReturnType<typeof listQuotes>>, TError = ErrorType<unknown>>(params?: ListQuotesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listQuotes>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create quote
 */
export declare const getCreateQuoteUrl: () => string;
export declare const createQuote: (createQuoteRequest: CreateQuoteRequest, options?: RequestInit) => Promise<Quote>;
export declare const getCreateQuoteMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createQuote>>, TError, {
        data: BodyType<CreateQuoteRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createQuote>>, TError, {
    data: BodyType<CreateQuoteRequest>;
}, TContext>;
export type CreateQuoteMutationResult = NonNullable<Awaited<ReturnType<typeof createQuote>>>;
export type CreateQuoteMutationBody = BodyType<CreateQuoteRequest>;
export type CreateQuoteMutationError = ErrorType<unknown>;
/**
 * @summary Create quote
 */
export declare const useCreateQuote: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createQuote>>, TError, {
        data: BodyType<CreateQuoteRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createQuote>>, TError, {
    data: BodyType<CreateQuoteRequest>;
}, TContext>;
/**
 * @summary Get quote with line items
 */
export declare const getGetQuoteUrl: (quoteId: string) => string;
export declare const getQuote: (quoteId: string, options?: RequestInit) => Promise<QuoteDetail>;
export declare const getGetQuoteQueryKey: (quoteId: string) => readonly [`/api/quotes/${string}`];
export declare const getGetQuoteQueryOptions: <TData = Awaited<ReturnType<typeof getQuote>>, TError = ErrorType<unknown>>(quoteId: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getQuote>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getQuote>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetQuoteQueryResult = NonNullable<Awaited<ReturnType<typeof getQuote>>>;
export type GetQuoteQueryError = ErrorType<unknown>;
/**
 * @summary Get quote with line items
 */
export declare function useGetQuote<TData = Awaited<ReturnType<typeof getQuote>>, TError = ErrorType<unknown>>(quoteId: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getQuote>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Update quote
 */
export declare const getUpdateQuoteUrl: (quoteId: string) => string;
export declare const updateQuote: (quoteId: string, updateQuoteRequest: UpdateQuoteRequest, options?: RequestInit) => Promise<Quote>;
export declare const getUpdateQuoteMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateQuote>>, TError, {
        quoteId: string;
        data: BodyType<UpdateQuoteRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateQuote>>, TError, {
    quoteId: string;
    data: BodyType<UpdateQuoteRequest>;
}, TContext>;
export type UpdateQuoteMutationResult = NonNullable<Awaited<ReturnType<typeof updateQuote>>>;
export type UpdateQuoteMutationBody = BodyType<UpdateQuoteRequest>;
export type UpdateQuoteMutationError = ErrorType<unknown>;
/**
 * @summary Update quote
 */
export declare const useUpdateQuote: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateQuote>>, TError, {
        quoteId: string;
        data: BodyType<UpdateQuoteRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateQuote>>, TError, {
    quoteId: string;
    data: BodyType<UpdateQuoteRequest>;
}, TContext>;
/**
 * @summary Add line item to quote
 */
export declare const getAddLineItemUrl: (quoteId: string) => string;
export declare const addLineItem: (quoteId: string, createLineItemRequest: CreateLineItemRequest, options?: RequestInit) => Promise<LineItem>;
export declare const getAddLineItemMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof addLineItem>>, TError, {
        quoteId: string;
        data: BodyType<CreateLineItemRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof addLineItem>>, TError, {
    quoteId: string;
    data: BodyType<CreateLineItemRequest>;
}, TContext>;
export type AddLineItemMutationResult = NonNullable<Awaited<ReturnType<typeof addLineItem>>>;
export type AddLineItemMutationBody = BodyType<CreateLineItemRequest>;
export type AddLineItemMutationError = ErrorType<unknown>;
/**
 * @summary Add line item to quote
 */
export declare const useAddLineItem: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof addLineItem>>, TError, {
        quoteId: string;
        data: BodyType<CreateLineItemRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof addLineItem>>, TError, {
    quoteId: string;
    data: BodyType<CreateLineItemRequest>;
}, TContext>;
/**
 * @summary Update line item
 */
export declare const getUpdateLineItemUrl: (quoteId: string, lineItemId: string) => string;
export declare const updateLineItem: (quoteId: string, lineItemId: string, updateLineItemBody: UpdateLineItemBody, options?: RequestInit) => Promise<LineItem>;
export declare const getUpdateLineItemMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateLineItem>>, TError, {
        quoteId: string;
        lineItemId: string;
        data: BodyType<UpdateLineItemBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateLineItem>>, TError, {
    quoteId: string;
    lineItemId: string;
    data: BodyType<UpdateLineItemBody>;
}, TContext>;
export type UpdateLineItemMutationResult = NonNullable<Awaited<ReturnType<typeof updateLineItem>>>;
export type UpdateLineItemMutationBody = BodyType<UpdateLineItemBody>;
export type UpdateLineItemMutationError = ErrorType<unknown>;
/**
 * @summary Update line item
 */
export declare const useUpdateLineItem: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateLineItem>>, TError, {
        quoteId: string;
        lineItemId: string;
        data: BodyType<UpdateLineItemBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateLineItem>>, TError, {
    quoteId: string;
    lineItemId: string;
    data: BodyType<UpdateLineItemBody>;
}, TContext>;
/**
 * @summary Delete line item
 */
export declare const getDeleteLineItemUrl: (quoteId: string, lineItemId: string) => string;
export declare const deleteLineItem: (quoteId: string, lineItemId: string, options?: RequestInit) => Promise<MessageResponse>;
export declare const getDeleteLineItemMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteLineItem>>, TError, {
        quoteId: string;
        lineItemId: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteLineItem>>, TError, {
    quoteId: string;
    lineItemId: string;
}, TContext>;
export type DeleteLineItemMutationResult = NonNullable<Awaited<ReturnType<typeof deleteLineItem>>>;
export type DeleteLineItemMutationError = ErrorType<unknown>;
/**
 * @summary Delete line item
 */
export declare const useDeleteLineItem: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteLineItem>>, TError, {
        quoteId: string;
        lineItemId: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteLineItem>>, TError, {
    quoteId: string;
    lineItemId: string;
}, TContext>;
/**
 * @summary List patient documents
 */
export declare const getListDocumentsUrl: (patientId: string, params?: ListDocumentsParams) => string;
export declare const listDocuments: (patientId: string, params?: ListDocumentsParams, options?: RequestInit) => Promise<DocumentListResponse>;
export declare const getListDocumentsQueryKey: (patientId: string, params?: ListDocumentsParams) => readonly [`/api/patients/${string}/documents`, ...ListDocumentsParams[]];
export declare const getListDocumentsQueryOptions: <TData = Awaited<ReturnType<typeof listDocuments>>, TError = ErrorType<unknown>>(patientId: string, params?: ListDocumentsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listDocuments>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listDocuments>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListDocumentsQueryResult = NonNullable<Awaited<ReturnType<typeof listDocuments>>>;
export type ListDocumentsQueryError = ErrorType<unknown>;
/**
 * @summary List patient documents
 */
export declare function useListDocuments<TData = Awaited<ReturnType<typeof listDocuments>>, TError = ErrorType<unknown>>(patientId: string, params?: ListDocumentsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listDocuments>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Upload document metadata and get signed URL
 */
export declare const getUploadDocumentUrl: (patientId: string) => string;
export declare const uploadDocument: (patientId: string, uploadDocumentRequest: UploadDocumentRequest, options?: RequestInit) => Promise<UploadDocumentResponse>;
export declare const getUploadDocumentMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof uploadDocument>>, TError, {
        patientId: string;
        data: BodyType<UploadDocumentRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof uploadDocument>>, TError, {
    patientId: string;
    data: BodyType<UploadDocumentRequest>;
}, TContext>;
export type UploadDocumentMutationResult = NonNullable<Awaited<ReturnType<typeof uploadDocument>>>;
export type UploadDocumentMutationBody = BodyType<UploadDocumentRequest>;
export type UploadDocumentMutationError = ErrorType<unknown>;
/**
 * @summary Upload document metadata and get signed URL
 */
export declare const useUploadDocument: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof uploadDocument>>, TError, {
        patientId: string;
        data: BodyType<UploadDocumentRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof uploadDocument>>, TError, {
    patientId: string;
    data: BodyType<UploadDocumentRequest>;
}, TContext>;
/**
 * @summary Upload file content using a signed upload token
 */
export declare const getUploadDocumentContentUrl: (documentId: string) => string;
export declare const uploadDocumentContent: (documentId: string, uploadDocumentContentBody: Blob, options?: RequestInit) => Promise<UploadDocumentContent200>;
export declare const getUploadDocumentContentMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof uploadDocumentContent>>, TError, {
        documentId: string;
        data: BodyType<Blob>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof uploadDocumentContent>>, TError, {
    documentId: string;
    data: BodyType<Blob>;
}, TContext>;
export type UploadDocumentContentMutationResult = NonNullable<Awaited<ReturnType<typeof uploadDocumentContent>>>;
export type UploadDocumentContentMutationBody = BodyType<Blob>;
export type UploadDocumentContentMutationError = ErrorType<unknown>;
/**
 * @summary Upload file content using a signed upload token
 */
export declare const useUploadDocumentContent: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof uploadDocumentContent>>, TError, {
        documentId: string;
        data: BodyType<Blob>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof uploadDocumentContent>>, TError, {
    documentId: string;
    data: BodyType<Blob>;
}, TContext>;
/**
 * @summary Get time-limited download token
 */
export declare const getDownloadDocumentUrl: (documentId: string) => string;
export declare const downloadDocument: (documentId: string, options?: RequestInit) => Promise<DownloadDocumentResponse>;
export declare const getDownloadDocumentQueryKey: (documentId: string) => readonly [`/api/documents/${string}/download`];
export declare const getDownloadDocumentQueryOptions: <TData = Awaited<ReturnType<typeof downloadDocument>>, TError = ErrorType<unknown>>(documentId: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof downloadDocument>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof downloadDocument>>, TError, TData> & {
    queryKey: QueryKey;
};
export type DownloadDocumentQueryResult = NonNullable<Awaited<ReturnType<typeof downloadDocument>>>;
export type DownloadDocumentQueryError = ErrorType<unknown>;
/**
 * @summary Get time-limited download token
 */
export declare function useDownloadDocument<TData = Awaited<ReturnType<typeof downloadDocument>>, TError = ErrorType<unknown>>(documentId: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof downloadDocument>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Download file content using a signed download token
 */
export declare const getDownloadDocumentContentUrl: (documentId: string, params?: DownloadDocumentContentParams) => string;
export declare const downloadDocumentContent: (documentId: string, params?: DownloadDocumentContentParams, options?: RequestInit) => Promise<Blob>;
export declare const getDownloadDocumentContentQueryKey: (documentId: string, params?: DownloadDocumentContentParams) => readonly [`/api/documents/${string}/content`, ...DownloadDocumentContentParams[]];
export declare const getDownloadDocumentContentQueryOptions: <TData = Awaited<ReturnType<typeof downloadDocumentContent>>, TError = ErrorType<unknown>>(documentId: string, params?: DownloadDocumentContentParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof downloadDocumentContent>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof downloadDocumentContent>>, TError, TData> & {
    queryKey: QueryKey;
};
export type DownloadDocumentContentQueryResult = NonNullable<Awaited<ReturnType<typeof downloadDocumentContent>>>;
export type DownloadDocumentContentQueryError = ErrorType<unknown>;
/**
 * @summary Download file content using a signed download token
 */
export declare function useDownloadDocumentContent<TData = Awaited<ReturnType<typeof downloadDocumentContent>>, TError = ErrorType<unknown>>(documentId: string, params?: DownloadDocumentContentParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof downloadDocumentContent>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get document metadata by ID
 */
export declare const getGetDocumentMetadataUrl: (documentId: string) => string;
export declare const getDocumentMetadata: (documentId: string, options?: RequestInit) => Promise<Document>;
export declare const getGetDocumentMetadataQueryKey: (documentId: string) => readonly [`/api/documents/${string}`];
export declare const getGetDocumentMetadataQueryOptions: <TData = Awaited<ReturnType<typeof getDocumentMetadata>>, TError = ErrorType<unknown>>(documentId: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDocumentMetadata>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getDocumentMetadata>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetDocumentMetadataQueryResult = NonNullable<Awaited<ReturnType<typeof getDocumentMetadata>>>;
export type GetDocumentMetadataQueryError = ErrorType<unknown>;
/**
 * @summary Get document metadata by ID
 */
export declare function useGetDocumentMetadata<TData = Awaited<ReturnType<typeof getDocumentMetadata>>, TError = ErrorType<unknown>>(documentId: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDocumentMetadata>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Update document metadata
 */
export declare const getUpdateDocumentMetadataUrl: (documentId: string) => string;
export declare const updateDocumentMetadata: (documentId: string, updateDocumentMetadataBody: UpdateDocumentMetadataBody, options?: RequestInit) => Promise<Document>;
export declare const getUpdateDocumentMetadataMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateDocumentMetadata>>, TError, {
        documentId: string;
        data: BodyType<UpdateDocumentMetadataBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateDocumentMetadata>>, TError, {
    documentId: string;
    data: BodyType<UpdateDocumentMetadataBody>;
}, TContext>;
export type UpdateDocumentMetadataMutationResult = NonNullable<Awaited<ReturnType<typeof updateDocumentMetadata>>>;
export type UpdateDocumentMetadataMutationBody = BodyType<UpdateDocumentMetadataBody>;
export type UpdateDocumentMetadataMutationError = ErrorType<unknown>;
/**
 * @summary Update document metadata
 */
export declare const useUpdateDocumentMetadata: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateDocumentMetadata>>, TError, {
        documentId: string;
        data: BodyType<UpdateDocumentMetadataBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateDocumentMetadata>>, TError, {
    documentId: string;
    data: BodyType<UpdateDocumentMetadataBody>;
}, TContext>;
/**
 * @summary Delete document
 */
export declare const getDeleteDocumentUrl: (documentId: string) => string;
export declare const deleteDocument: (documentId: string, options?: RequestInit) => Promise<MessageResponse>;
export declare const getDeleteDocumentMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteDocument>>, TError, {
        documentId: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteDocument>>, TError, {
    documentId: string;
}, TContext>;
export type DeleteDocumentMutationResult = NonNullable<Awaited<ReturnType<typeof deleteDocument>>>;
export type DeleteDocumentMutationError = ErrorType<unknown>;
/**
 * @summary Delete document
 */
export declare const useDeleteDocument: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteDocument>>, TError, {
        documentId: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteDocument>>, TError, {
    documentId: string;
}, TContext>;
/**
 * @summary Get intake form
 */
export declare const getGetIntakeFormUrl: (patientId: string) => string;
export declare const getIntakeForm: (patientId: string, options?: RequestInit) => Promise<IntakeForm>;
export declare const getGetIntakeFormQueryKey: (patientId: string) => readonly [`/api/patients/${string}/intake`];
export declare const getGetIntakeFormQueryOptions: <TData = Awaited<ReturnType<typeof getIntakeForm>>, TError = ErrorType<unknown>>(patientId: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getIntakeForm>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getIntakeForm>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetIntakeFormQueryResult = NonNullable<Awaited<ReturnType<typeof getIntakeForm>>>;
export type GetIntakeFormQueryError = ErrorType<unknown>;
/**
 * @summary Get intake form
 */
export declare function useGetIntakeForm<TData = Awaited<ReturnType<typeof getIntakeForm>>, TError = ErrorType<unknown>>(patientId: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getIntakeForm>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create intake form
 */
export declare const getCreateIntakeFormUrl: (patientId: string) => string;
export declare const createIntakeForm: (patientId: string, intakeFormData: IntakeFormData, options?: RequestInit) => Promise<IntakeForm>;
export declare const getCreateIntakeFormMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createIntakeForm>>, TError, {
        patientId: string;
        data: BodyType<IntakeFormData>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createIntakeForm>>, TError, {
    patientId: string;
    data: BodyType<IntakeFormData>;
}, TContext>;
export type CreateIntakeFormMutationResult = NonNullable<Awaited<ReturnType<typeof createIntakeForm>>>;
export type CreateIntakeFormMutationBody = BodyType<IntakeFormData>;
export type CreateIntakeFormMutationError = ErrorType<unknown>;
/**
 * @summary Create intake form
 */
export declare const useCreateIntakeForm: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createIntakeForm>>, TError, {
        patientId: string;
        data: BodyType<IntakeFormData>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createIntakeForm>>, TError, {
    patientId: string;
    data: BodyType<IntakeFormData>;
}, TContext>;
/**
 * @summary Update intake form
 */
export declare const getUpdateIntakeFormUrl: (patientId: string) => string;
export declare const updateIntakeForm: (patientId: string, intakeFormData: IntakeFormData, options?: RequestInit) => Promise<IntakeForm>;
export declare const getUpdateIntakeFormMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateIntakeForm>>, TError, {
        patientId: string;
        data: BodyType<IntakeFormData>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateIntakeForm>>, TError, {
    patientId: string;
    data: BodyType<IntakeFormData>;
}, TContext>;
export type UpdateIntakeFormMutationResult = NonNullable<Awaited<ReturnType<typeof updateIntakeForm>>>;
export type UpdateIntakeFormMutationBody = BodyType<IntakeFormData>;
export type UpdateIntakeFormMutationError = ErrorType<unknown>;
/**
 * @summary Update intake form
 */
export declare const useUpdateIntakeForm: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateIntakeForm>>, TError, {
        patientId: string;
        data: BodyType<IntakeFormData>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateIntakeForm>>, TError, {
    patientId: string;
    data: BodyType<IntakeFormData>;
}, TContext>;
/**
 * @summary Complete intake and advance journey
 */
export declare const getCompleteIntakeFormUrl: (patientId: string) => string;
export declare const completeIntakeForm: (patientId: string, options?: RequestInit) => Promise<IntakeForm>;
export declare const getCompleteIntakeFormMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof completeIntakeForm>>, TError, {
        patientId: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof completeIntakeForm>>, TError, {
    patientId: string;
}, TContext>;
export type CompleteIntakeFormMutationResult = NonNullable<Awaited<ReturnType<typeof completeIntakeForm>>>;
export type CompleteIntakeFormMutationError = ErrorType<unknown>;
/**
 * @summary Complete intake and advance journey
 */
export declare const useCompleteIntakeForm: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof completeIntakeForm>>, TError, {
        patientId: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof completeIntakeForm>>, TError, {
    patientId: string;
}, TContext>;
/**
 * @summary List biomarker results
 */
export declare const getListBiomarkersUrl: (patientId: string, params?: ListBiomarkersParams) => string;
export declare const listBiomarkers: (patientId: string, params?: ListBiomarkersParams, options?: RequestInit) => Promise<BiomarkerListResponse>;
export declare const getListBiomarkersQueryKey: (patientId: string, params?: ListBiomarkersParams) => readonly [`/api/patients/${string}/biomarkers`, ...ListBiomarkersParams[]];
export declare const getListBiomarkersQueryOptions: <TData = Awaited<ReturnType<typeof listBiomarkers>>, TError = ErrorType<unknown>>(patientId: string, params?: ListBiomarkersParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listBiomarkers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listBiomarkers>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListBiomarkersQueryResult = NonNullable<Awaited<ReturnType<typeof listBiomarkers>>>;
export type ListBiomarkersQueryError = ErrorType<unknown>;
/**
 * @summary List biomarker results
 */
export declare function useListBiomarkers<TData = Awaited<ReturnType<typeof listBiomarkers>>, TError = ErrorType<unknown>>(patientId: string, params?: ListBiomarkersParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listBiomarkers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Add biomarker result (Medical Provider only)
 */
export declare const getAddBiomarkerResultUrl: (patientId: string) => string;
export declare const addBiomarkerResult: (patientId: string, createBiomarkerRequest: CreateBiomarkerRequest, options?: RequestInit) => Promise<BiomarkerResult>;
export declare const getAddBiomarkerResultMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof addBiomarkerResult>>, TError, {
        patientId: string;
        data: BodyType<CreateBiomarkerRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof addBiomarkerResult>>, TError, {
    patientId: string;
    data: BodyType<CreateBiomarkerRequest>;
}, TContext>;
export type AddBiomarkerResultMutationResult = NonNullable<Awaited<ReturnType<typeof addBiomarkerResult>>>;
export type AddBiomarkerResultMutationBody = BodyType<CreateBiomarkerRequest>;
export type AddBiomarkerResultMutationError = ErrorType<unknown>;
/**
 * @summary Add biomarker result (Medical Provider only)
 */
export declare const useAddBiomarkerResult: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof addBiomarkerResult>>, TError, {
        patientId: string;
        data: BodyType<CreateBiomarkerRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof addBiomarkerResult>>, TError, {
    patientId: string;
    data: BodyType<CreateBiomarkerRequest>;
}, TContext>;
/**
 * @summary Get biomarker result by ID
 */
export declare const getGetBiomarkerResultUrl: (biomarkerId: string) => string;
export declare const getBiomarkerResult: (biomarkerId: string, options?: RequestInit) => Promise<BiomarkerResult>;
export declare const getGetBiomarkerResultQueryKey: (biomarkerId: string) => readonly [`/api/biomarkers/${string}`];
export declare const getGetBiomarkerResultQueryOptions: <TData = Awaited<ReturnType<typeof getBiomarkerResult>>, TError = ErrorType<unknown>>(biomarkerId: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getBiomarkerResult>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getBiomarkerResult>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetBiomarkerResultQueryResult = NonNullable<Awaited<ReturnType<typeof getBiomarkerResult>>>;
export type GetBiomarkerResultQueryError = ErrorType<unknown>;
/**
 * @summary Get biomarker result by ID
 */
export declare function useGetBiomarkerResult<TData = Awaited<ReturnType<typeof getBiomarkerResult>>, TError = ErrorType<unknown>>(biomarkerId: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getBiomarkerResult>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Update biomarker result
 */
export declare const getUpdateBiomarkerResultUrl: (biomarkerId: string) => string;
export declare const updateBiomarkerResult: (biomarkerId: string, updateBiomarkerResultBody: UpdateBiomarkerResultBody, options?: RequestInit) => Promise<BiomarkerResult>;
export declare const getUpdateBiomarkerResultMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateBiomarkerResult>>, TError, {
        biomarkerId: string;
        data: BodyType<UpdateBiomarkerResultBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateBiomarkerResult>>, TError, {
    biomarkerId: string;
    data: BodyType<UpdateBiomarkerResultBody>;
}, TContext>;
export type UpdateBiomarkerResultMutationResult = NonNullable<Awaited<ReturnType<typeof updateBiomarkerResult>>>;
export type UpdateBiomarkerResultMutationBody = BodyType<UpdateBiomarkerResultBody>;
export type UpdateBiomarkerResultMutationError = ErrorType<unknown>;
/**
 * @summary Update biomarker result
 */
export declare const useUpdateBiomarkerResult: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateBiomarkerResult>>, TError, {
        biomarkerId: string;
        data: BodyType<UpdateBiomarkerResultBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateBiomarkerResult>>, TError, {
    biomarkerId: string;
    data: BodyType<UpdateBiomarkerResultBody>;
}, TContext>;
/**
 * @summary Delete biomarker result
 */
export declare const getDeleteBiomarkerResultUrl: (biomarkerId: string) => string;
export declare const deleteBiomarkerResult: (biomarkerId: string, options?: RequestInit) => Promise<MessageResponse>;
export declare const getDeleteBiomarkerResultMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteBiomarkerResult>>, TError, {
        biomarkerId: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteBiomarkerResult>>, TError, {
    biomarkerId: string;
}, TContext>;
export type DeleteBiomarkerResultMutationResult = NonNullable<Awaited<ReturnType<typeof deleteBiomarkerResult>>>;
export type DeleteBiomarkerResultMutationError = ErrorType<unknown>;
/**
 * @summary Delete biomarker result
 */
export declare const useDeleteBiomarkerResult: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteBiomarkerResult>>, TError, {
        biomarkerId: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteBiomarkerResult>>, TError, {
    biomarkerId: string;
}, TContext>;
/**
 * @summary List consent records
 */
export declare const getListConsentsUrl: (patientId: string) => string;
export declare const listConsents: (patientId: string, options?: RequestInit) => Promise<ConsentListResponse>;
export declare const getListConsentsQueryKey: (patientId: string) => readonly [`/api/patients/${string}/consents`];
export declare const getListConsentsQueryOptions: <TData = Awaited<ReturnType<typeof listConsents>>, TError = ErrorType<unknown>>(patientId: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listConsents>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listConsents>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListConsentsQueryResult = NonNullable<Awaited<ReturnType<typeof listConsents>>>;
export type ListConsentsQueryError = ErrorType<unknown>;
/**
 * @summary List consent records
 */
export declare function useListConsents<TData = Awaited<ReturnType<typeof listConsents>>, TError = ErrorType<unknown>>(patientId: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listConsents>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Grant consent
 */
export declare const getGrantConsentUrl: (patientId: string) => string;
export declare const grantConsent: (patientId: string, grantConsentRequest: GrantConsentRequest, options?: RequestInit) => Promise<ConsentRecord>;
export declare const getGrantConsentMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof grantConsent>>, TError, {
        patientId: string;
        data: BodyType<GrantConsentRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof grantConsent>>, TError, {
    patientId: string;
    data: BodyType<GrantConsentRequest>;
}, TContext>;
export type GrantConsentMutationResult = NonNullable<Awaited<ReturnType<typeof grantConsent>>>;
export type GrantConsentMutationBody = BodyType<GrantConsentRequest>;
export type GrantConsentMutationError = ErrorType<unknown>;
/**
 * @summary Grant consent
 */
export declare const useGrantConsent: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof grantConsent>>, TError, {
        patientId: string;
        data: BodyType<GrantConsentRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof grantConsent>>, TError, {
    patientId: string;
    data: BodyType<GrantConsentRequest>;
}, TContext>;
/**
 * @summary Revoke consent
 */
export declare const getRevokeConsentUrl: (consentId: string) => string;
export declare const revokeConsent: (consentId: string, options?: RequestInit) => Promise<ConsentRecord>;
export declare const getRevokeConsentMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof revokeConsent>>, TError, {
        consentId: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof revokeConsent>>, TError, {
    consentId: string;
}, TContext>;
export type RevokeConsentMutationResult = NonNullable<Awaited<ReturnType<typeof revokeConsent>>>;
export type RevokeConsentMutationError = ErrorType<unknown>;
/**
 * @summary Revoke consent
 */
export declare const useRevokeConsent: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof revokeConsent>>, TError, {
        consentId: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof revokeConsent>>, TError, {
    consentId: string;
}, TContext>;
/**
 * @summary Export all personal data (GDPR Article 20)
 */
export declare const getGdprExportUrl: () => string;
export declare const gdprExport: (options?: RequestInit) => Promise<GdprExportResponse>;
export declare const getGdprExportQueryKey: () => readonly ["/api/gdpr/export"];
export declare const getGdprExportQueryOptions: <TData = Awaited<ReturnType<typeof gdprExport>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof gdprExport>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof gdprExport>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GdprExportQueryResult = NonNullable<Awaited<ReturnType<typeof gdprExport>>>;
export type GdprExportQueryError = ErrorType<unknown>;
/**
 * @summary Export all personal data (GDPR Article 20)
 */
export declare function useGdprExport<TData = Awaited<ReturnType<typeof gdprExport>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof gdprExport>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Delete all personal data (GDPR Article 17)
 */
export declare const getGdprDeleteUrl: () => string;
export declare const gdprDelete: (options?: RequestInit) => Promise<GdprDeleteResponse>;
export declare const getGdprDeleteMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof gdprDelete>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof gdprDelete>>, TError, void, TContext>;
export type GdprDeleteMutationResult = NonNullable<Awaited<ReturnType<typeof gdprDelete>>>;
export type GdprDeleteMutationError = ErrorType<unknown>;
/**
 * @summary Delete all personal data (GDPR Article 17)
 */
export declare const useGdprDelete: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof gdprDelete>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof gdprDelete>>, TError, void, TContext>;
export {};
//# sourceMappingURL=api.d.ts.map