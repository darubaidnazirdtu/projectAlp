import axios from 'axios';

const trimTrailingSlash = (value) => value.endsWith('/') ? value.slice(0, -1) : value;

const resolveBaseUrl = (explicitUrl) => {
    const candidate = explicitUrl || (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_BASEURL : undefined);
    if (candidate) {
        return trimTrailingSlash(candidate);
    }

    if (typeof window !== 'undefined') {
        const { protocol, hostname } = window.location;
        return `${protocol}//${hostname}:3000/api/v1`;
    }

    throw new Error('API base URL is not configured. Set VITE_BASEURL to your backend origin.');
};

const unwrap = (response) => {
    const body = response.data;
    if (body && typeof body === 'object' && 'statusCode' in body && 'data' in body) {
        return body.data;
    }
    return body;
};

let isAuthErrorProcessing = false;

export class Api {
    static roleProvider = null;

    static setRoleProvider(provider) {
        Api.roleProvider = provider;
    }

    constructor(baseUrl) {
        this.client = axios.create({
            baseURL: resolveBaseUrl(baseUrl),
            headers: {
                'Content-Type': 'application/json'
            },
            withCredentials: true
        });

        this.client.interceptors.request.use((config) => {
            const role = Api.roleProvider ? Api.roleProvider() : null;
            if (role) {
                config.headers = config.headers || {};
                if (!config.headers['X-Client-Role'] && !config.headers['x-client-role']) {
                    config.headers['X-Client-Role'] = role;
                }
            }
            return config;
        });

        this.client.interceptors.response.use(
            (response) => response,
            (error) => {
                const status = error?.response?.status;
                const bypass = error?.config?.headers && (error.config.headers['X-Bypass-Auth-Redirect'] || error.config.headers['x-bypass-auth-redirect']);
                if (bypass) {
                    return Promise.reject(error);
                }
                if (status && [401, 403, 409].includes(status)) {
                    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
                    const isLoginPage = pathname.endsWith('/login') || pathname.endsWith('/apar/login');

                    // Prevent redirect loop if already on login page or when requesting profile endpoints
                    const reqUrl = error.config?.url || '';
                    const isProfileReq = reqUrl.endsWith('/auth/profile') || reqUrl.endsWith('/apar/auth/profile');

                    if (status === 401 && (isLoginPage || isProfileReq)) {
                        return Promise.reject(error);
                    }

                    if (!isAuthErrorProcessing) {
                        isAuthErrorProcessing = true;
                        if (status === 401) {
                            const redirectPath = reqUrl.startsWith('/apar') || reqUrl.includes('/apar/') ? '/apar/login' : '/login';
                            window.location.href = redirectPath;
                        } else {
                            setTimeout(() => {
                                isAuthErrorProcessing = false;
                            }, 3000);
                        }
                    }
                }
                return Promise.reject(error);
            }
        );
    }

    async post(endpoint, data, headers = {}) {
        const response = await this.client.post(endpoint, data, { headers });
        return unwrap(response);
    }

    async get(endpoint, headers = {}) {
        const response = await this.client.get(endpoint, { headers });
        return unwrap(response);
    }

    async put(endpoint, data, headers = {}) {
        const response = await this.client.put(endpoint, data, { headers });
        return unwrap(response);
    }

    async patch(endpoint, data, headers = {}) {
        const response = await this.client.patch(endpoint, data, { headers });
        return unwrap(response);
    }

    async delete(endpoint, headers = {}) {
        const response = await this.client.delete(endpoint, { headers });
        return unwrap(response);
    }
}