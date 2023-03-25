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

export type Querys = {
    [k: string]: string | string[];
};

/** url splice querys */
export const jointQueryInputURL = (url: string, querys: Querys) => {
    let { protocol, hostname, port, path, fragment, query: originQuerys } = parseURL(url);
    let fullURL = `${protocol ? protocol + '://' : ''}${hostname}${port ? `:${port}` : ''}${path}`;

    if (!Object.keys(querys).length && !Object.keys(originQuerys).length) {
        return fullURL;
    }
    fullURL += '?';

    for (let k in originQuerys) {
        let ov = originQuerys[k];
        let av = querys[k];
        let str = '';
        if (ov instanceof Array) {
            for (let i = 0; i < ov.length; i++) {
                if (ov[i]) {
                    str += `&${k}=${ov[i]}`;
                }
            }
        } else if (ov) {
            str += `&${k}=${ov}`;
        }

        if (av instanceof Array) {
            for (let i = 0; i < av.length; i++) {
                if (av[i]) {
                    str += `&${k}=${av[i]}`;
                }
            }
        } else if (av) {
            str += `&${k}=${av}`;
        }
        fullURL += str;
    }
    for (let k in querys) {
        if (!originQuerys[k]) {
            let av = querys[k];
            let str = '';
            if (av instanceof Array) {
                for (let i = 0; i < av.length; i++) {
                    str += `&${k}=${av[i]}`;
                }
            } else {
                str += `&${k}=${av}`;
            }
            fullURL += str;
        }
    }
    return `${fullURL}${fragment ? fragment : ''}`;
};

/** parse url */
export const parseURL = (url: string) => {
    url = url.trim();
    let protocol: string,
        hostname: string,
        port: string,
        path: string,
        query: {
            [k: string]: string | string[];
        } = {},
        fragment: string,
        fullPath = url;
    let [proHostPortPathFra, ...queryFra] = url.split('?');
    let queryArr: string[] = [];
    let preUrl = proHostPortPathFra;
    // 提取fragment
    if (queryFra.length) {
        let [queryStr, fragmentPath] = queryFra.join('?').split('#');
        fragment = fragmentPath ? `#${fragmentPath}` : '';
        queryArr = queryStr.split('&');
    } else {
        let [proHostPortPath, fragmentPath] = proHostPortPathFra.split('#');
        fragment = fragmentPath ? `#${fragmentPath}` : '';
        preUrl = proHostPortPath;
    }
    // 提取protocol
    let [protocolStr, hostPortPath] = preUrl.split('://');
    if (hostPortPath === undefined) {
        preUrl = protocolStr;
        protocol = '';
    } else {
        protocol = protocolStr;
        preUrl = hostPortPath;
    }
    // 截取path
    let [hostPort, ...pathArr] = preUrl.split('/');
    path = `/${pathArr.join('/')}`;
    // 截取hostname和port
    [hostname, port] = hostPort.split(':');
    // 获取query
    for (let str of queryArr) {
        if (str === '') continue;
        let [k, ...v] = str.split('=');
        let val = v.join('=');
        if (query[k]) {
            if (query[k] instanceof Array) {
                (query[k] as string[]).push(val);
            } else {
                query[k] = [query[k] as string, val];
            }
        } else {
            query[k] = val;
        }
    }
    return {
        protocol,
        hostname,
        port,
        path,
        query,
        fragment,
        fullPath,
    };
};

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

    fetching.get(url)?.abort();
    fetching.set(url, controller);

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

    return Promise.race([
        fetch(url, {
            ...requestInfo,
            method,
            body: data,
            signal,
        }),
        requestTimeout(),
    ])
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
                return [
                    {
                        headers,
                        data,
                        success: true,
                        status: res.status,
                        statusText: res.statusText,
                        url: res.url,
                    },
                    undefined,
                ];
            }
            throw new Error(res.statusText);
        })
        .catch((err: Error) => {
            return [null, err];
        });
}
