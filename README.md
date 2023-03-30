# auto-abort-fetch.js

## Pre-requisites

You can use it on Node 17.5.0 (or later) or a browser version that supports fetch.

## Usage

```js
import autoAbortableFetch from 'auto-abortable-fetch';
let [res, err] = await autoAbortableFetch({
    url: 'https://xxx',
    method: 'get',
    headers: {},
    timeout: 5000,
    querys: {},
    data: {},
    responseType: 'json',
});
let { config, ok, url, data, status, statusText, request } = res;
let { config, name, message, code } = err;

// If you want to manually control the request abort, you can pass AbortControl.signal

import autoAbortableFetch from 'auto-abortable-fetch';
let controller = autoAbortableFetch.CreateAbortSignal();
let signal = controller.signal;
let [res, err] = await autoAbortableFetch({
    url: 'https://xxx',
    signal,
});

// cancel request
controller.cancel();
```

## TypeScript usage

```ts
interface ResponseData {
    message: string;
}

let [res, err] = await autoAbortableFetch<ResponseData>({ url: 'https://xxx' });
console.log(res.data.message);
```

## Parameter Descriptions

### requestInfo

| Parameter          | type                                                                      | Description                                                           |
| ------------------ | ------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| url                | string                                                                    | The URL address of the request.                                       |
| headers            | { [key: string]: string; }                                                | An object containing request headers.                                 |
| method             | string                                                                    | The HTTP method to use for the request.                               |
| timeout            | number                                                                    | The timeout for the request, in milliseconds.                         |
| data               | any                                                                       | The data to send with the request.                                    |
| responseType       | "arraybuffer" &#124; "blob" &#124; "document" &#124; "json" &#124; "text" | The expected response type for the request.                           |
| signal             | AbortSignal                                                               | The signal used to cancel the request.                                |
| withCredentials    | boolean                                                                   | Whether to include credentials in the request.                        |
| validateStatus     | (status: number) => void                                                  | A function that determines whether the response status code is valid. |
| onUploadProgress   | (progressEvent: ProgressEvent<XMLHttpRequestEventTarget>) => void         | A function to handle progress events during upload.                   |
| onDownloadProgress | (progressEvent: ProgressEvent<XMLHttpRequestEventTarget>) => void         | A function to handle progress events during download.                 |
