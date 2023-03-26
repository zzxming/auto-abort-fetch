import { jointQueryInputURL } from './utils/url-tools';
export type ResponseType = 'arrayBuffer' | 'blob' | 'document' | 'json' | 'text';

export interface AutoAbortableFetchRequestInfo {
    url: string;
    headers?: {
        [key: string]: string;
    };
    method?: string;
    timeout?: number;
    querys?: any;
    data?: any;
    responseType?: ResponseType;
    signal?: AbortSignal;

    cache?: RequestCache;
    credentials?: RequestCredentials;
    destination?: RequestDestination;
    integrity?: string;
    keepalive?: boolean;
    mode?: RequestMode;
    redirect?: RequestRedirect;
    referrer?: string;
    referrerPolicy?: ReferrerPolicy;
}
export interface AutoAbortableFetchResponse<T> {
    headers: {
        [k: string]: string;
    };
    success: boolean;
    data: T;
    status: number;
    statusText: string;
    url: string;
}

let fetching = new Map<string, AbortController>();

export async function autoAbortableFetch<T = any>(
    requestInfo: AutoAbortableFetchRequestInfo
): Promise<[AutoAbortableFetchResponse<T>, undefined] | [null, Error]> {
    let { url, data } = requestInfo;

    if (!url) {
        return Promise.reject({
            message: 'missing url parameter',
        });
    }

    let controller = new AbortController();
    let method = requestInfo.method ?? 'get';
    let timeout = requestInfo.timeout ?? 5000;
    let querys = requestInfo.querys ?? {};
    let responseType = requestInfo.responseType ?? 'json';
    let signal = requestInfo.signal ?? controller.signal;

    url = jointQueryInputURL(url, querys);

    let requestTimeout = (): Promise<Response> => {
        return new Promise((_, reject) => {
            setTimeout(() => {
                reject({
                    ok: false,
                    statusText: 'request timeout',
                });
            }, timeout);
        });
    };

    let sendFetch = () => {
        fetching.get(url)?.abort();
        fetching.set(url, controller);

        return fetch(url, {
            ...requestInfo,
            method,
            body: data,
            signal,
        });
    };
    return Promise.race([sendFetch(), requestTimeout()])
        .then<[AutoAbortableFetchResponse<T>, undefined]>(async (res) => {
            if (res.ok) {
                let data: T =
                    responseType === 'document'
                        ? new DOMParser().parseFromString(await res.text(), 'text/html')
                        : await res[responseType]();

                let headers: { [k: string]: string } = {};
                res.headers.forEach((v, k) => {
                    headers[k] = v;
                });
                return Promise.resolve([
                    {
                        headers,
                        data,
                        success: true,
                        status: res.status,
                        statusText: res.statusText,
                        url: res.url,
                    },
                    undefined,
                ]);
            }
            throw new Error(res.statusText);
        })
        .catch((err: Error) => {
            return Promise.reject([null, err]);
        });
}

export default autoAbortableFetch;
