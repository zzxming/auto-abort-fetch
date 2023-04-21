import { jointQueryInputURL, Querys } from './utils/url-tools';
// export type ResponseType<T> = T extends 'fetch'
//     ? FetchResponseType
//     : T extends 'XMLHtteRequest'
//     ? XMLResponseType
//     : string;
export type XMLResponseType = 'arraybuffer' | 'blob' | 'document' | 'json' | 'text';
// export type FetchResponseType = 'arrayBuffer' | 'blob' | 'document' | 'json' | 'text';

export interface AutoAbortableFetchRequestInfo extends Partial<Omit<AutoAbortableFetchRequestConfig, 'url'>> {
	url: string;
}
export interface AutoAbortableFetchRequestConfig {
	url: string;
	headers: {
		[key: string]: string;
	};
	method: string;
	timeout: number;
	data: any;
	querys: Querys;
	responseType: XMLResponseType;
	signal?: AbortSignal;
	withCredentials: boolean;
	validateStatus: (status: number) => boolean;
	onUploadProgress?: (progressEvent: ProgressEvent<XMLHttpRequestEventTarget>) => void;
	onDownloadProgress?: (progressEvent: ProgressEvent<XMLHttpRequestEventTarget>) => void;
}
export interface AutoAbortableFetchResponse<T = any> {
	config: AutoAbortableFetchRequestConfig;
	ok: boolean;
	data: T;
	status: number;
	statusText: string;
	url: string;
	request: XMLHttpRequest;
}
export interface AutoAbortableFetchError<T = any> {
	config: AutoAbortableFetchRequestConfig;
	name: string;
	message: string;
	code: string;
	request?: XMLHttpRequest;
	response?: AutoAbortableFetchResponse<T>;
}
export interface Cancel {
	signal: AbortSignal;
	cancel: () => void;
}
/** 解码响应头, 整理成对象返回 */
export const decodeResponseHeader = (xhr: XMLHttpRequest) => {
	let headerStr = xhr.getAllResponseHeaders();
	let headers: AutoAbortableFetchRequestConfig['headers'] = {};
	headerStr.split('\r\n').forEach((val) => {
		if (val === '') return;
		let [k, v] = val.split(': ');
		headers[k] = decodeURI(v);
	});
	return headers;
};
/** 请求配置默认值 */
let defaults: Omit<AutoAbortableFetchRequestConfig, 'url'> = {
	headers: {},
	method: 'get',
	timeout: 5000,
	querys: {},
	data: null,
	responseType: 'json',
	withCredentials: false,
	validateStatus: (status: number) => {
		return status >= 200 && status < 300;
	},
};
/** 将默认配置转换为请求配置 */
const defaultXMLConfig = (config: AutoAbortableFetchRequestInfo): AutoAbortableFetchRequestConfig => {
	let { signal, url, data, onDownloadProgress, onUploadProgress } = config;

	let headers = config.headers ?? defaults.headers;
	let timeout = config.timeout ?? defaults.timeout;
	let method = config.method ?? defaults.method;
	let responseType = config.responseType ?? defaults.responseType;
	let withCredentials = config.withCredentials ?? defaults.withCredentials;
	let querys = config.querys ?? defaults.querys;
	let validateStatus = config.validateStatus ?? defaults.validateStatus;
	url = jointQueryInputURL(url, querys);

	let result: AutoAbortableFetchRequestConfig = {
		url,
		querys,
		data,
		method,
		timeout,
		headers,
		responseType,
		withCredentials,
		validateStatus,
	};

	if (signal) {
		result.signal = signal;
	}
	if (onDownloadProgress) {
		result.onDownloadProgress = onDownloadProgress;
	}

	if (onUploadProgress) {
		result.onUploadProgress = onUploadProgress;
	}
	return result;
};
/** 将配置绑定至 XMLHttpRequest */
const bindXHRConfig = (xhr: XMLHttpRequest, config: AutoAbortableFetchRequestConfig) => {
	let { timeout, responseType, withCredentials, headers, onDownloadProgress, onUploadProgress } = config;

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
// 未结束请求的中止回调
let fetching = new Map<string, () => void>();

export async function autoAbortableFetch<T = any>(
	requestInfo: AutoAbortableFetchRequestInfo
): Promise<[AutoAbortableFetchResponse<T>, undefined] | [null, AutoAbortableFetchError<T>]> {
	let config = defaultXMLConfig(requestInfo);
	let { method, data, url, signal, validateStatus } = config;

	if (!url) {
		return Promise.reject({
			name: 'ParamsError',
			message: 'missing url parameter',
			code: 'ERR_MISSING_URL',
			request: null,
			config,
		});
	}

	let request = new XMLHttpRequest();
	let onCancel: () => void;

	return new Promise<AutoAbortableFetchResponse<T>>(
		(resolve, reject: (value: AutoAbortableFetchError<T>) => void) => {
			// fetching.delete 不能放在 then/catch/finally 中, 进 then/catch/finally 会进微队列, 会在第二次调用 promise 之后执行, 即第二次的 fetching.set 之后
			if (fetching.has(url)) {
				fetching.get(url)?.();
			}

			onCancel = () => {
				reject({
					config,
					name: 'CancelError',
					message: 'cancel',
					code: 'ERR_CANCEL',
				});
				request.abort();
			};
			if (signal) {
				signal.addEventListener('abort', onCancel);
			}
			fetching.set(url, onCancel);

			request.addEventListener('loadend', () => {
				(request as XMLHttpRequest | null) = null;
			});
			request.addEventListener('readystatechange', () => {
				if (request.readyState === 4) {
					if (request.status === 0) {
						return;
					}
					if (validateStatus(request.status)) {
						resolve({
							config,
							ok: true,
							data: request.response as T,
							status: request.status,
							statusText: request.statusText,
							request,
							url,
						});
					} else {
						reject({
							name: 'VaildateError',
							message: 'validateStatus',
							code: 'ERR_VALIDATE_STATUS',
							config,
							request,
							response: {
								config,
								ok: false,
								data: request.response as T,
								status: request.status,
								statusText: request.statusText,
								request,
								url,
							},
						});
					}
					fetching.delete(url);
				}
			});
			request.addEventListener('abort', (e) => {
				reject({
					name: 'AbortError',
					message: 'abort',
					code: 'ERR_ABORT',
					config,
				});
				fetching.delete(url);
			});
			request.addEventListener('timeout', function (e) {
				reject({
					name: 'TimeoutError',
					message: `timeout of ${this.timeout} exceeded`,
					code: 'ERR_TIMEOUT',
					request,
					config,
				});
				fetching.delete(url);
			});
			// 仅在网络层级出现错误时才触发
			request.addEventListener('error', function (e) {
				reject({
					name: 'NetworkError',
					message: 'network error',
					code: 'ERR_NETWORK',
					request,
					config,
				});
				fetching.delete(url);
			});
			// 发送请求:
			request.open(method, url);
			bindXHRConfig(request, config);
			request.send(data);
		}
	)
		.then<[AutoAbortableFetchResponse<T>, undefined]>((res: AutoAbortableFetchResponse<T>) => {
			return [res, undefined];
		})
		.catch<[null, AutoAbortableFetchError<T>]>((e: AutoAbortableFetchError<T>) => {
			return [null, e];
		})
		.finally(() => {
			if (signal) {
				signal.removeEventListener('abort', onCancel);
			}
		});
}
/** 返回一个对象包含一个 AbortSignal 和一个用于中止信号的取消函数 */
let autoAbortableFetchCancel = (): Cancel => {
	let c = new AbortController();
	return {
		signal: c.signal,
		cancel() {
			c.abort();
		},
	};
};

autoAbortableFetch.CreateAbortSignal = autoAbortableFetchCancel;

export default autoAbortableFetch;
