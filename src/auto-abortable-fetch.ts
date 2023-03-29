import { jointQueryInputURL } from './utils/url-tools';

export interface AutoAbortableFetchResponse<T> {
    headers: {
        [k: string]: string;
    };
    ok: boolean;
    data: T;
    status: number;
    statusText: string;
    url: string;
}
export type ResponseType<T> = T extends 'fetch'
    ? FetchResponseType
    : T extends 'XMLHtteRequest'
    ? XMLResponseType
    : string;
export type XMLResponseType = 'arraybuffer' | 'blob' | 'document' | 'json' | 'text';
export type FetchResponseType = 'arrayBuffer' | 'blob' | 'document' | 'json' | 'text';

export interface AutoAbortableFetchRequestInfo<T extends 'fetch' | 'XMLHtteRequest'> {
    url: string;
    headers?: {
        [key: string]: string;
    };
    method?: string;
    timeout?: number;
    querys?: any;
    data?: any;
    responseType?: ResponseType<T>;
    // signal?: AbortSignal;
    withCredentials?: boolean;
    validateStatus?: ((status: number) => boolean) | null;
    onUploadProgress?: (progressEvent: ProgressEvent<XMLHttpRequestEventTarget>) => void;
    onDownloadProgress?: (progressEvent: ProgressEvent<XMLHttpRequestEventTarget>) => void;
}

export interface RejectType {
    name: string;
    message: string;
    code: string;
}

/** 解码响应头, 整理成对象返回 */
const decodeResponseHeader = (str: string) => {
    let headers: { [k: string]: string } = {};
    str.split('\r\n').forEach((val) => {
        if (val === '') return;
        let [k, v] = val.split(': ');
        headers[k] = decodeURI(v);
    });
    return headers;
};

let defaults = {
    headers: {},
    method: 'get',
    timeout: 5000,
    querys: {},
    data: null,
    responseType: 'json',

    validateStatus: (status: number) => {
        return status >= 200 && status < 300;
    },
    withCredentials: false,
};

const bindXHRConfig = (xhr: XMLHttpRequest, config: AutoAbortableFetchRequestInfo<'XMLHtteRequest'>) => {
    let timeout = config.timeout ?? 5000;
    let responseType = config.responseType ?? 'json';
    let headers = config.headers ?? {};
    let withCredentials = config.withCredentials ?? false;
    let { onDownloadProgress, onUploadProgress } = config;

    xhr.timeout = timeout;
    xhr.responseType = responseType;
    xhr.withCredentials = withCredentials;
    for (let k in headers) {
        xhr.setRequestHeader(k, headers[k]);
    }
    if (typeof onDownloadProgress === 'function') {
        xhr.addEventListener('progress', onDownloadProgress);
    }
    if (typeof onUploadProgress === 'function' && xhr.upload) {
        xhr.upload.addEventListener('progress', onUploadProgress);
    }
};
let fetching = new Map<string, XMLHttpRequest>();

export async function autoAbortableFetch<T = any>(
    requestInfo: AutoAbortableFetchRequestInfo<'XMLHtteRequest'>
): Promise<[AutoAbortableFetchResponse<T>, undefined] | [null, RejectType]> {
    let { url, data } = requestInfo;

    if (!url) {
        return Promise.reject({
            name: 'ParamsError',
            message: 'missing url parameter',
            code: 'ERR_MISSING_URL',
        });
    }
    let method = requestInfo.method ?? defaults.method;
    let querys = requestInfo.querys ?? defaults.querys;
    let validateStatus = requestInfo.validateStatus ?? defaults.validateStatus;

    url = jointQueryInputURL(url, querys);

    if (fetching.has(url)) {
        fetching.get(url)?.abort();
    }
    let xhr = new XMLHttpRequest();

    return new Promise<AutoAbortableFetchResponse<T>>((resolve, reject) => {
        // fetching.delete 不能放在 then/catch/finally 中, 进 then/catch/finally 会进微队列, 会在第二次调用 promise 之后执行, 即第二次的 fetching.set 之后
        fetching.set(url, xhr);

        xhr.addEventListener('readystatechange', () => {
            if (xhr.readyState === 4) {
                // get response
                if (xhr.status === 0) {
                    return;
                }
                let headers = decodeResponseHeader(xhr.getAllResponseHeaders());
                if (validateStatus(xhr.status)) {
                    resolve({
                        headers,
                        ok: true,
                        data: xhr.response as T,
                        status: xhr.status,
                        statusText: xhr.statusText,
                        url,
                    });
                } else {
                    resolve({
                        headers,
                        ok: false,
                        data: xhr.response as T,
                        status: xhr.status,
                        statusText: xhr.statusText,
                        url,
                    });
                }
                fetching.delete(url);
            }
        });
        xhr.addEventListener('abort', (e) => {
            // console.log('abort error', e);
            reject({
                name: 'AbortError',
                message: 'abort',
                code: 'ERR_ABORT',
                request: xhr,
            });
            fetching.delete(url);
        });
        xhr.addEventListener('timeout', function (e) {
            // console.log('timeout error', e);
            reject({
                name: 'TimeoutError',
                message: 'timeout',
                code: 'ERR_TIMEOUT',
                request: xhr,
            });
            fetching.delete(url);
        });
        // 仅在网络层级出现错误时才触发
        xhr.addEventListener('error', function (e) {
            // console.log('error', e);
            reject({
                name: 'NetworkError',
                message: 'network error',
                code: 'ERR_NETWORK',
                request: xhr,
            });
            fetching.delete(url);
        });
        // 发送请求:
        xhr.open(method, url);
        bindXHRConfig(xhr, requestInfo);
        xhr.send(data);
    })
        .then<[AutoAbortableFetchResponse<T>, undefined]>((res: AutoAbortableFetchResponse<T>) => {
            return [res, undefined];
        })
        .catch<[null, RejectType]>((e: RejectType) => {
            return [null, e];
        });
}

export default autoAbortableFetch;
